// Two Truths & a Lie: everyone secretly writes three things about themselves — two true, one
// made up — and marks the lie. Then, one player at a time, their three statements go up on the
// table and everyone else votes for the one they think is the lie. 1 point for spotting it; the
// writer gets 1 point for every player they fooled.
import { base, shuffle, cleanText, sfx, left, waiting, finish } from './party.js?v=67';

export function createGame(settings, players) {
  const g = base(settings, players, { secs: 180, vote: 30 });
  g.sets = {};
  g.drafts = {};
  g.done = {};
  g.phase = 'write';
  g.endAt = Date.now() + g.settings.secs * 1000;
  return g;
}
export const collecting = g => g.phase === 'write' || g.phase === 'guess';
export const turnSeat = g => (g.phase === 'guess' || g.phase === 'reveal' ? g.queue[g.qi] : -1);
const author = g => g.queue[g.qi];
const guessers = g => g.order.filter(s => s !== author(g));
export const current = g => (g.phase === 'write' ? waiting(g)[0] ?? -1 : g.phase === 'guess' ? waiting(g, guessers(g))[0] ?? -1 : -1);

const valid = d => d && d.vals.filter(Boolean).length === 3 && d.lie >= 0 && d.lie < 3;
export function draft(g, seat, d) {
  if (g.phase !== 'write' || g.done[seat] || !g.order.includes(seat)) return false;
  g.drafts[seat] = { vals: (d.vals || []).slice(0, 3).map(v => cleanText(v, 80)), lie: Number(d.pick) };
  return true;
}
function toGuess(g) {
  for (const s of g.order) if (!g.sets[s] && valid(g.drafts[s])) g.sets[s] = g.drafts[s];
  g.queue = shuffle(g.order.filter(s => g.sets[s]));
  if (!g.queue.length) return finish(g);
  g.qi = -1;
  nextAuthor(g);
}
function nextAuthor(g) {
  g.qi++;
  if (g.qi >= g.queue.length) return finish(g);
  const S = g.sets[author(g)];
  g.shown = shuffle([0, 1, 2]);           // the order the statements are shown in
  g.lieAt = g.shown.indexOf(S.lie);
  g.votes = {};
  g.done = {};
  g.phase = 'guess';
  g.endAt = Date.now() + g.settings.vote * 1000;
  g.moveId++;
}
function reveal(g) {
  g.gain = {};
  let fooled = 0;
  for (const [s, i] of Object.entries(g.votes)) { if (i === g.lieAt) { g.score[s]++; g.gain[s] = 1; } else fooled++; }
  g.score[author(g)] += fooled;
  g.gain[author(g)] = fooled;
  sfx(g, 'chime');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (!g.order.includes(seat)) return "You're not in this game";
  if (g.phase === 'write' && a.type === 'answer') {
    if (g.done[seat]) return 'Already handed in';
    const d = { vals: (a.vals || []).slice(0, 3).map(v => cleanText(v, 80)), lie: Number(a.pick) };
    if (d.vals.filter(Boolean).length < 3) return 'Write all three';
    if (!(d.lie >= 0 && d.lie < 3)) return 'Mark which one is the lie';
    g.sets[seat] = d;
    g.done[seat] = true;
    if (!waiting(g).length) toGuess(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'guess' && a.type === 'pick') {
    if (seat === author(g)) return 'These are yours!';
    if (g.done[seat]) return 'Already voted';
    const i = Number(a.v);
    if (!(i >= 0 && i < 3)) return 'Pick one';
    g.votes[seat] = i;
    g.done[seat] = true;
    if (!waiting(g, guessers(g)).length) reveal(g); else g.moveId++;
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1500, run: () => { sfx(g, 'buzzer'); toGuess(g); } };
  if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 8000 - Date.now()), run: () => nextAuthor(g) };
  return null;
}

export function botAction(g, seat) {
  if (g.phase === 'write') return { type: 'answer', vals: [`I have been to ${['Peru', 'Iceland', 'Japan'][seat % 3]}`, 'I can juggle', 'I once met a famous chef'], pick: seat % 3 };
  if (g.phase === 'guess') return { type: 'pick', v: Math.floor(Math.random() * 3) };
  return null;
}

export const statements = g => g.shown.map(i => g.sets[author(g)].vals[i]);
export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, left: left(g), hud: [['Score', g.score[seat] ?? 0], ['Player', g.queue ? `${Math.min(g.qi + 1, g.queue.length)}/${g.queue.length}` : '—']] };
  if (g.phase === 'write') {
    const d = g.drafts[seat] || { vals: [] };
    v.ui = g.done[seat]
      ? { k: 'wait', title: 'Handed in ✓', sub: `Waiting for ${waiting(g).length} more…` }
      : { k: 'fields', key: 'w', title: 'Two truths and a lie', sub: 'Three things about you — then tap ✗ on the lie', myturn: true, radio: 'Tap ✗ next to the one that’s a lie', radioAt: d.lie >= 0 ? d.lie : null,
        fields: [0, 1, 2].map(i => ({ ph: ['I once…', 'I have…', 'I can…'][i], max: 80, value: d.vals[i] || '' })), submit: 'Hand it in', need: 3, needMsg: 'Write all three' };
  } else if (g.phase === 'guess' || g.phase === 'reveal') {
    const A = author(g), S = statements(g);
    if (g.phase === 'reveal') v.ui = { k: 'wait', title: seat === A ? `You fooled ${g.gain[A]}! +${g.gain[A]}` : g.gain[seat] ? '✓ Spotted it! +1' : '✗ Fooled you', sub: `The lie: “${S[g.lieAt]}”`, card: { kicker: '@' + A + '@', list: S } };
    else if (seat === A) v.ui = { k: 'wait', title: 'Everyone’s judging you…', sub: 'Keep a straight face 😐', card: { kicker: 'Your statements', list: S } };
    else if (g.done[seat]) v.ui = { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g, guessers(g)).length} more…`, card: { kicker: '@' + A + '@', list: S } };
    else v.ui = { k: 'pick', key: 'g' + g.qi, title: `Which is @${A}@’s lie?`, sub: 'Tap the one you think is made up', myturn: true, buzz: true, options: S.map((t, i) => ({ v: i, label: t })) };
  } else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
export { author };
