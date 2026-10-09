// List Off: a letter is rolled and everyone gets the same list of categories. Before the clock
// runs out, fill in one answer per category that starts with that letter — a fruit, a TV show,
// something in a kitchen… Then the table goes through the list: answers that match someone
// else's score nothing, and the others can vote down anything too silly. 1 point per answer that
// stands (+1 if every word in it starts with the letter). Most points after the last round wins.
import { base, shuffle, pick, core, norm, cleanText, announce, sfx, left, finish, waiting } from './party.js?v=67';

export const CATEGORIES = 'A boy’s name|A girl’s name|A city|A country|An animal|A fruit|A vegetable|Something in a kitchen|A sport|A school subject|A movie title|A TV show|A song title|A band or singer|A food you’d eat for breakfast|A dessert|Something cold|Something hot|Something you’d find at the beach|Something in a backpack|A type of drink|A pizza topping|A car brand|A job|A famous person|A superhero|A cartoon character|A board game|A hobby|A musical instrument|Something with wheels|Something that flies|A bird|A fish or sea creature|A bug|A flower or plant|A color|A body part|An item of clothing|Something in a bathroom|Something in a garage|A tool|A store or restaurant|A holiday|A gift|A reason to be late|An excuse for not doing homework|Something you shout|A nickname|A word ending in -ing|A thing you can break|Something sticky|Something soft|Something loud|Something round|Something that smells bad|A snack|A candy|A cereal|A sandwich|A spice or sauce|A kitchen appliance|Something at a party|Something at a wedding|A camping item|A thing in the sky|A weather word|A state or province|A river, lake or ocean|A mountain or famous landmark|A language|A dance|A video game|A villain|A book or author|A magic word or spell|Something in a hospital|Something at the zoo|Something at the airport|A farm animal|A pet’s name|A dog breed|A thing you plug in|An app or website|A piece of furniture|Something in a toolbox|A school supply|A word for happy|A word for big|An insult (keep it nice)|Something you do on a weekend|A bad habit|A fear|A chore|A smell you love|Something you collect|A Halloween costume|A thing with stripes|A thing that’s green|A thing that’s yellow|A sound an animal makes|A breakfast cereal mascot|A famous scientist|A reality show|Something you’d see in space|A street name|A type of shoe|A hairstyle|Something you can’t live without'.split('|');
const LETTERS = 'ABCDEFGHIJKLMNOPRSTW'.split('');

export function createGame(settings, players) {
  const g = base(settings, players, { rounds: 3, secs: 120, count: 10 });
  g.round = 0;
  g.cats = shuffle(CATEGORIES.map((_, i) => i));
  startRound(g);
  return g;
}

function startRound(g) {
  g.round++;
  g.letter = pick(LETTERS.filter(l => !(g.used || []).includes(l)));
  g.used = [...(g.used || []), g.letter];
  if (g.cats.length < g.settings.count) g.cats = shuffle(CATEGORIES.map((_, i) => i));
  g.list = g.cats.splice(0, g.settings.count).map(i => CATEGORIES[i]);
  g.answers = {};
  g.drafts = {};
  g.done = {};
  g.phase = 'write';
  g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}

export const collecting = g => g.phase === 'write' || g.phase === 'review';
export const turnSeat = () => -1;
export const current = g => (collecting(g) ? waiting(g)[0] ?? -1 : -1);

export function draft(g, seat, d) {
  if (g.phase !== 'write' || g.done[seat] || !g.order.includes(seat)) return false;
  g.drafts[seat] = (d.vals || []).slice(0, g.list.length).map(v => cleanText(v, 40));
  return true;
}

// Does it start with the letter (skipping a leading "the", "a" or "an")?
const fits = (g, t) => { const c = norm(t).replace(/^(the|a|an) /, ''); return c[0] === g.letter.toLowerCase(); };
const bonus = (g, t) => { const w = norm(t).split(' '); return w.length > 1 && w.every(x => x[0] === g.letter.toLowerCase()); };

function toReview(g) {
  for (const s of g.order) if (!g.answers[s]) g.answers[s] = g.drafts[s] || [];
  // Work out each answer's state: '' fine, 'letter' wrong letter, 'dup' someone else had it.
  g.marks = {};
  g.list.forEach((_, ci) => {
    const seen = {};
    for (const s of g.order) { const a = g.answers[s][ci]; if (a && fits(g, a)) { const k = core(a); seen[k] = (seen[k] || 0) + 1; } }
    for (const s of g.order) {
      const a = g.answers[s][ci];
      g.marks[s + ':' + ci] = !a ? 'blank' : !fits(g, a) ? 'letter' : seen[core(a)] > 1 ? 'dup' : '';
    }
  });
  g.vetoes = {};      // "seat:cat" -> [voters]
  g.phase = 'review';
  g.ci = 0;
  g.done = {};
  g.endAt = Date.now() + 20000;
  g.moveId++;
}

const vetoed = (g, s, ci) => (g.vetoes[s + ':' + ci] || []).length * 2 > g.order.length - 1 && g.order.length > 2;
const points = (g, s, ci) => {
  const m = g.marks[s + ':' + ci];
  if (m || vetoed(g, s, ci)) return 0;
  return 1 + (bonus(g, g.answers[s][ci]) ? 1 : 0);
};

function nextCat(g) {
  g.ci++;
  g.done = {};
  if (g.ci < g.list.length) { g.endAt = Date.now() + 20000; g.moveId++; return; }
  g.roundPts = {};
  for (const s of g.order) { g.roundPts[s] = g.list.reduce((t, _, ci) => t + points(g, s, ci), 0); g.score[s] += g.roundPts[s]; }
  g.phase = 'tally';
  g.endAt = 0;
  g.tallyAt = Date.now();
  sfx(g, 'chime');
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (!g.order.includes(seat)) return "You're not in this game";
  if (g.phase === 'write' && a.type === 'answer') {
    if (g.done[seat]) return 'Already handed in';
    g.answers[seat] = (a.vals || []).slice(0, g.list.length).map(v => cleanText(v, 40));
    g.done[seat] = true;
    if (!waiting(g).length) toReview(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'review') {
    if (a.type === 'toggle') {
      const s = Number(a.v), k = s + ':' + g.ci;
      if (s === seat || !g.order.includes(s)) return "You can't vote on your own answer";
      if (g.marks[k]) return 'That one already scores nothing';
      const v = g.vetoes[k] || [];
      g.vetoes[k] = v.includes(seat) ? v.filter(x => x !== seat) : [...v, seat];
      g.moveId++;
      return null;
    }
    if (a.type === 'ok') {
      g.done[seat] = true;
      if (!waiting(g).length) nextCat(g); else g.moveId++;
      return null;
    }
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1500, run: () => { announce(g, -1, 'Pens down!'); sfx(g, 'buzzer'); toReview(g); } };
  if (g.phase === 'review') return { ms: Math.max(0, g.endAt - Date.now()), run: () => nextCat(g) };
  if (g.phase === 'tally') return { ms: Math.max(0, g.tallyAt + 9000 - Date.now()), run: () => (g.round >= g.settings.rounds ? finish(g) : startRound(g)) };
  return null;
}

export function botAction(g, seat) {
  if (g.phase === 'write') return { type: 'answer', vals: g.list.map((_, i) => (Math.random() < 0.7 ? `${g.letter}${'aeiou'[i % 5]}bot ${seat}` : '')) };
  if (g.phase === 'review') return { type: 'ok' };
  return null;
}

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, left: left(g), hud: [['Letter', g.letter], ['Round', `${g.round}/${g.settings.rounds}`]] };
  const me = g.order.includes(seat);
  if (g.phase === 'write') {
    v.ui = g.done[seat] || !me
      ? { k: 'wait', title: 'Handed in ✓', sub: `Waiting for ${waiting(g).length} more…`, card: { kicker: 'Letter', big: g.letter } }
      : { k: 'fields', key: 'w' + g.round, title: `Everything starts with ${g.letter}`, sub: 'One answer each — the clock hands it in for you', compact: true, myturn: true,
        fields: g.list.map((c, i) => ({ label: c, ph: g.letter + '…', max: 40, value: (g.drafts[seat] || [])[i] || '' })), submit: 'Hand it in' };
  } else if (g.phase === 'review') {
    const opts = g.order.map(s => {
      const a = g.answers[s][g.ci], m = g.marks[s + ':' + g.ci];
      return { v: s, dot: s, label: a || '—', sub: s === seat ? 'yours' : m === 'dup' ? 'same as someone' : m === 'letter' ? `not ${g.letter}` : m === 'blank' ? '' : vetoed(g, s, g.ci) ? '👎 voted out' : 'tap to vote out', on: (g.vetoes[s + ':' + g.ci] || []).includes(seat), dis: s === seat || !!m, cls: m || vetoed(g, s, g.ci) ? 'dead' : '' };
    });
    v.ui = { k: 'toggles', key: 'r' + g.round + ':' + g.ci, title: g.list[g.ci], sub: `Starts with ${g.letter} · tap anything that doesn't count`, options: opts,
      buttons: [{ type: 'ok', label: g.done[seat] ? 'Waiting for the others…' : 'Looks good ›', go: true, dis: !!g.done[seat] }] };
  } else if (g.phase === 'tally') v.ui = { k: 'wait', title: `+${g.roundPts[seat] ?? 0} this round`, sub: `${g.score[seat]} points in total` };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
export { points, vetoed };
