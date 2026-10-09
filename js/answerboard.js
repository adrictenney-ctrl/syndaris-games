// Answer Board: a board of categories, each with clues worth 100 to 500. Whoever has control picks
// a clue on their phone; then everyone answers at once. The fastest right answer scores the full
// value and takes control; other right answers score half; wrong answers lose half. One clue on
// the board is a Double Down — only the picker answers, for double. When the board is empty, the
// most points wins.
import { base, shuffle, sfx, left, announce, waiting } from './party.js?v=68';
import { CATS, Q } from './trivia-bank.js?v=68';

export function createGame(settings, players) {
  const g = base(settings, players, { cats: 5, secs: 15 });
  const cats = shuffle(CATS.map((_, i) => i)).slice(0, g.settings.cats).sort((a, b) => a - b);
  // Five clues per category, easiest first.
  g.board = cats.map(c => ({ cat: c, clues: shuffle(Q[CATS[c].id].map((_, i) => i)).slice(0, 5).sort((a, b) => Q[CATS[c].id][a][5] - Q[CATS[c].id][b][5]), used: [false, false, false, false, false] }));
  g.dd = { c: Math.floor(Math.random() * g.board.length), r: 2 + Math.floor(Math.random() * 3) };
  g.picker = g.order[Math.floor(Math.random() * g.order.length)];
  g.phase = 'pick';
  g.clueNo = 0;
  g.endAt = 0;
  return g;
}
const val = r => (r + 1) * 100;
const clue = g => { const B = g.board[g.at.c]; return Q[CATS[B.cat].id][B.clues[g.at.r]]; };
const isDD = g => g.at && g.at.c === g.dd.c && g.at.r === g.dd.r;
const answering = g => (isDD(g) ? [g.picker] : g.order);
export const collecting = g => g.phase === 'clue';
export const turnSeat = g => (g.phase === 'pick' ? g.picker : -1);
export const current = g => (g.phase === 'pick' ? g.picker : g.phase === 'clue' ? waiting(g, answering(g))[0] ?? -1 : -1);

function reveal(g) {
  const q = clue(g), right = q[1], v = val(g.at.r) * (isDD(g) ? 2 : 1);
  g.gain = {};
  const correct = answering(g).filter(s => g.ans[s] && g.choices[g.ans[s].i] === right).sort((a, b) => g.ans[a].t - g.ans[b].t);
  correct.forEach((s, k) => { g.gain[s] = k === 0 ? v : Math.round(v / 2); });
  for (const s of answering(g)) if (g.ans[s] && !correct.includes(s)) g.gain[s] = -Math.round(v / 2);
  if (isDD(g) && !g.ans[g.picker]) g.gain[g.picker] = -v;
  for (const s in g.gain) g.score[s] += g.gain[s];
  if (correct.length) { g.picker = correct[0]; sfx(g, 'ding'); } else sfx(g, 'sad');
  g.fastest = correct[0] ?? -1;
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'pick' && a.type === 'pick') {
    if (seat !== g.picker) return 'It’s not your pick';
    const [c, r] = String(a.v).split(':').map(Number);
    if (!g.board[c] || g.board[c].used[r] !== false) return 'Pick a clue that’s still on the board';
    g.board[c].used[r] = true;
    g.at = { c, r };
    g.clueNo++;
    const q = clue(g);
    g.choices = shuffle([1, 2, 3, 4]).map(i => q[i]);
    g.ans = {};
    g.done = {};
    g.phase = 'clue';
    if (isDD(g)) { announce(g, seat, 'DOUBLE DOWN! 💰'); sfx(g, 'chime'); }
    g.endAt = Date.now() + (g.settings.secs + 2) * 1000;
    g.moveId++;
    return null;
  }
  if (g.phase === 'clue' && a.type === 'answer') {
    if (!answering(g).includes(seat)) return 'Only the picker answers a Double Down';
    if (g.done[seat]) return 'Already answered';
    const i = Number(a.v);
    if (!(i >= 0 && i < 4)) return 'Pick an answer';
    g.ans[seat] = { i, t: Date.now() };
    g.done[seat] = true;
    if (!waiting(g, answering(g)).length) reveal(g); else g.moveId++;
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'clue') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 5000 - Date.now()), run: () => {
    g.at = null;
    if (g.board.every(B => B.used.every(Boolean))) {
      const top = Math.max(...g.order.map(s => g.score[s]));
      g.winners = g.order.filter(s => g.score[s] === top);
      g.winner = g.winners[0];
      g.phase = 'over';
    } else g.phase = 'pick';
    g.moveId++;
  } };
  return null;
}

export function botAction(g, seat) {
  if (g.phase === 'pick') {
    const open = [];
    g.board.forEach((B, c) => B.used.forEach((u, r) => { if (!u) open.push(`${c}:${r}`); }));
    return { type: 'pick', v: open[Math.floor(Math.random() * open.length)] };
  }
  if (g.phase === 'clue') return { type: 'answer', v: Math.random() < 0.6 ? g.choices.indexOf(clue(g)[1]) : Math.floor(Math.random() * 4) };
  return null;
}

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'clue' ? left(g) : 0, hud: [['Score', g.score[seat] ?? 0], ['Clue', `${g.clueNo}/${g.board.length * 5}`]] };
  const head = g.at ? `${CATS[g.board[g.at.c].cat].icon} ${CATS[g.board[g.at.c].cat].name} · ${val(g.at.r) * (isDD(g) ? 2 : 1)}` : '';
  if (g.phase === 'pick') {
    if (seat === g.picker) {
      const options = [];
      for (let r = 0; r < 5; r++) g.board.forEach((B, c) => options.push({ v: `${c}:${r}`, label: B.used[r] ? '' : String(val(r)), dis: B.used[r], cls: 'ab-cell' }));
      v.ui = { k: 'pick', key: 'p' + g.clueNo, title: 'You pick!', sub: 'Choose a category and value', myturn: true, buzz: true, grid: g.board.length,
        card: { cls: 'ab-heads', list: g.board.map(B => `${CATS[B.cat].icon} ${CATS[B.cat].name}`) }, options };
    } else v.ui = { k: 'wait', title: 'Waiting for a pick', sub: 'Whoever got the last one right picks next' };
  } else if (g.phase === 'clue') {
    const q = clue(g), mine = answering(g).includes(seat);
    v.ui = !mine ? { k: 'wait', title: 'Double Down!', sub: 'Only the picker answers this one', card: { kicker: head, small: q[0] } }
      : g.done[seat] ? { k: 'wait', title: 'Locked in ✓', sub: 'Fastest right answer gets the full value', card: { kicker: head, small: q[0] } }
        : { k: 'pick', key: 'c' + g.clueNo, act: 'answer', title: isDD(g) ? 'Double Down — for double!' : 'Quick!', sub: 'Wrong answers lose half the value', myturn: true, card: { kicker: head, small: q[0], cls: 'tw-q' }, options: g.choices.map((c, i) => ({ v: i, label: c, cls: 'tw-c' + i })) };
  } else if (g.phase === 'reveal') {
    const q = clue(g), d = g.gain[seat];
    v.ui = { k: 'wait', title: d > 0 ? `✓ +${d}` : d < 0 ? `✗ ${d}` : 'No answer', sub: `Answer: ${q[1]}`, card: { kicker: head, small: q[0] } };
  } else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
export { CATS, Q, val, clue, isDD };
