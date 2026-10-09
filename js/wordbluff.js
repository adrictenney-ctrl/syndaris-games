// Word Bluff: a real but very strange word appears. Everyone secretly writes a made-up meaning
// that sounds believable. Then all the meanings — the fakes and the real one — are shuffled
// together and everyone votes for the one they think is real. 2 points for finding the real
// meaning; 1 point for every player your fake fooled. Most points wins.
import { base, shuffle, deal, cleanText, core, sfx, left, finish, waiting } from './party.js?v=67';
import { WORDS } from './wordbluff-words.js?v=67';

export function createGame(settings, players) {
  const g = base(settings, players, { rounds: 6, secs: 90 });
  g.round = 0;
  startRound(g);
  return g;
}
function startRound(g) {
  g.round++;
  g.word = deal(g, 'w', WORDS.length);
  g.defs = {};
  g.drafts = {};
  g.done = {};
  g.phase = 'write';
  g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}
export const collecting = g => g.phase === 'write' || g.phase === 'vote';
export const turnSeat = () => -1;
const voters = g => g.order;
export const current = g => (g.phase === 'write' ? waiting(g)[0] ?? -1 : g.phase === 'vote' ? waiting(g, voters(g))[0] ?? -1 : -1);

export function draft(g, seat, d) {
  if (g.phase !== 'write' || g.done[seat] || !g.order.includes(seat)) return false;
  g.drafts[seat] = cleanText((d.vals || [])[0], 90);
  return true;
}

function toVote(g) {
  for (const s of g.order) if (g.defs[s] == null && g.drafts[s]) g.defs[s] = g.drafts[s];
  // The choices: the real meaning plus every fake (identical fakes are merged).
  const opts = [{ text: WORDS[g.word][1], by: [] }];
  for (const s of g.order) {
    const t = g.defs[s];
    if (!t) continue;
    const same = opts.find(o => core(o.text) === core(t));
    if (same) { if (same.by.length || same === opts[0]) same.by.push(s); } else opts.push({ text: t, by: [s] });
  }
  g.opts = shuffle(opts.map((o, i) => ({ ...o, real: i === 0 })));
  g.votes = {};
  g.done = {};
  g.phase = 'vote';
  g.endAt = Date.now() + 45000;
  g.moveId++;
}
function reveal(g) {
  g.gain = {};
  for (const s of g.order) g.gain[s] = 0;
  for (const [s, i] of Object.entries(g.votes)) {
    const o = g.opts[i];
    if (o.real) g.gain[s] += 2;
    else for (const b of o.by) if (b !== Number(s)) g.gain[b] += 1;
  }
  // Writing (almost) the real meaning yourself counts as finding it.
  const real = g.opts.find(o => o.real);
  for (const b of real.by) if (g.votes[b] == null) g.gain[b] += 2;
  for (const s of g.order) g.score[s] += g.gain[s];
  g.phase = 'reveal';
  g.endAt = 0;
  g.revealAt = Date.now();
  sfx(g, 'chime');
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (!g.order.includes(seat)) return "You're not in this game";
  if (g.phase === 'write' && a.type === 'answer') {
    if (g.done[seat]) return 'Already handed in';
    const t = cleanText((a.vals || [])[0], 90);
    if (!t) return 'Write a meaning first';
    g.defs[seat] = t;
    g.done[seat] = true;
    if (!waiting(g).length) toVote(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'vote' && a.type === 'pick') {
    if (g.done[seat]) return 'Already voted';
    const i = Number(a.v), o = g.opts[i];
    if (!o) return 'Pick one of the meanings';
    if (o.by.includes(seat) && !o.real) return "That's your own!";
    g.votes[seat] = i;
    g.done[seat] = true;
    if (!waiting(g).length) reveal(g); else g.moveId++;
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1500, run: () => { sfx(g, 'buzzer'); toVote(g); } };
  if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revealAt + 12000 - Date.now()), run: () => (g.round >= g.settings.rounds ? finish(g) : startRound(g)) };
  return null;
}

export function botAction(g, seat) {
  if (g.phase === 'write') return { type: 'answer', vals: [`A kind of ${['small boat', 'old coin', 'garden tool', 'folk dance', 'cheese'][seat % 5]}`] };
  if (g.phase === 'vote') { const ok = g.opts.map((o, i) => i).filter(i => g.opts[i].real || !g.opts[i].by.includes(seat)); return { type: 'pick', v: ok[Math.floor(Math.random() * ok.length)] }; }
  return null;
}

export function viewFor(g, seat) {
  const [word, real] = WORDS[g.word];
  const v = { phase: g.phase, moveId: g.moveId, left: left(g), hud: [['Score', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
  const card = { kicker: 'The word', big: word };
  if (g.phase === 'write') {
    v.ui = g.done[seat]
      ? { k: 'wait', title: 'Handed in ✓', sub: `Waiting for ${waiting(g).length} more…`, card: { ...card, small: `Your meaning: ${g.defs[seat]}` } }
      : { k: 'fields', key: 'w' + g.round, title: 'What does it mean?', sub: 'Make up a meaning that sounds real', myturn: true, card,
        fields: [{ ph: 'It means…', max: 90, value: g.drafts[seat] || '' }], submit: 'Hand it in', need: 1, needMsg: 'Write a meaning first' };
  } else if (g.phase === 'vote') {
    v.ui = g.done[seat]
      ? { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g).length} more…`, card }
      : { k: 'pick', key: 'v' + g.round, title: 'Which one is real?', sub: '2 points if you find it', myturn: true, card,
        options: g.opts.map((o, i) => ({ v: i, label: o.text, dis: o.by.includes(seat) && !o.real, sub: o.by.includes(seat) && !o.real ? 'yours' : '' })) };
  } else if (g.phase === 'reveal') v.ui = { k: 'wait', title: `+${g.gain[seat] || 0} this round`, sub: `${g.score[seat]} points in total`, card: { ...card, small: real } };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
export { WORDS };
