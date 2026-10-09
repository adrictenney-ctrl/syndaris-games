// Trivia Wheel: the table spins a wheel of six categories. Everyone answers the question on their
// own phone at the same time — get it right and you win that category's wedge (and points, more
// for being quick). The first player to collect the wedges they need wins; if nobody has after
// the last spin, most wedges (then points) wins.
import { base, shuffle, deal, sfx, left, announce, waiting } from './party.js?v=67';
import { CATS, Q } from './trivia-bank.js?v=67';

export function createGame(settings, players) {
  const g = base(settings, players, { need: 6, secs: 20, spins: 24 });
  g.wedges = g.seats.map(() => []);
  g.spinNo = 0;
  startSpin(g);
  return g;
}
function startSpin(g) {
  g.spinNo++;
  g.cat = Math.floor(Math.random() * CATS.length);
  g.phase = 'spin';
  g.spinAt = Date.now();
  g.endAt = 0;
  g.moveId++;
}
function ask(g) {
  const id = CATS[g.cat].id;
  g.qi = deal(g, id, Q[id].length);
  const q = Q[id][g.qi];
  g.choices = shuffle([1, 2, 3, 4]).map(i => q[i]);
  g.ans = {};
  g.done = {};
  g.phase = 'ask';
  g.askAt = Date.now();
  g.endAt = g.askAt + g.settings.secs * 1000;
  g.moveId++;
}
function reveal(g) {
  const id = CATS[g.cat].id, right = Q[id][g.qi][1];
  g.gain = {};
  const correct = g.order.filter(s => g.ans[s] && g.choices[g.ans[s].i] === right).sort((a, b) => g.ans[a].t - g.ans[b].t);
  correct.forEach((s, k) => {
    g.gain[s] = Math.max(10, 100 - Math.round((g.ans[s].t - g.askAt) / (g.settings.secs * 10))) + (k === 0 ? 25 : 0);
    g.score[s] += g.gain[s];
    if (!g.wedges[s].includes(g.cat)) { g.wedges[s].push(g.cat); g.gain[s + 'w'] = true; }
  });
  g.fastest = correct[0] ?? -1;
  if (correct.length) sfx(g, 'ding'); else sfx(g, 'sad');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}
export const collecting = g => g.phase === 'ask';
export const turnSeat = () => -1;
export const current = g => (g.phase === 'ask' ? waiting(g)[0] ?? -1 : -1);

export function applyAction(g, seat, a) {
  if (!a || a.type !== 'pick' || g.phase !== 'ask') return 'Not now';
  if (!g.order.includes(seat)) return "You're not in this game";
  if (g.done[seat]) return 'Already answered';
  const i = Number(a.v);
  if (!(i >= 0 && i < 4)) return 'Pick an answer';
  g.ans[seat] = { i, t: Date.now() };
  g.done[seat] = true;
  if (!waiting(g).length) reveal(g); else g.moveId++;
  return null;
}

export function tick(g) {
  if (g.phase === 'spin') return { ms: Math.max(0, g.spinAt + 3600 - Date.now()), run: () => ask(g) };
  if (g.phase === 'ask') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 6000 - Date.now()), run: () => {
    const done = g.order.filter(s => g.wedges[s].length >= g.settings.need);
    if (done.length || g.spinNo >= g.settings.spins) {
      const key = s => g.wedges[s].length * 100000 + g.score[s];
      const top = Math.max(...g.order.map(key));
      g.winners = g.order.filter(s => key(s) === top);
      g.winner = g.winners[0];
      g.phase = 'over';
      announce(g, g.winner, 'Trivia champion! 🏆');
      g.moveId++;
      return;
    }
    startSpin(g);
  } };
  return null;
}

export function botAction(g) {
  const right = Q[CATS[g.cat].id][g.qi][1];
  return { type: 'pick', v: Math.random() < 0.6 ? g.choices.indexOf(right) : Math.floor(Math.random() * 4) };
}

export function viewFor(g, seat) {
  const C = CATS[g.cat], q = g.qi != null ? Q[C.id][g.qi] : null;
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'ask' ? left(g) : 0, hud: [['Wedges', `${g.wedges[seat]?.length ?? 0}/${g.settings.need}`], ['Points', g.score[seat] ?? 0]], wedges: g.wedges[seat] };
  if (g.phase === 'spin') v.ui = { k: 'wait', title: 'Spinning…', sub: 'Watch the wheel on the table' };
  else if (g.phase === 'ask') v.ui = g.done[seat]
    ? { k: 'wait', title: 'Locked in ✓', sub: `Waiting for ${waiting(g).length} more…`, card: { kicker: `${C.icon} ${C.name}`, small: q[0] } }
    : { k: 'pick', key: 'a' + g.spinNo, title: `${C.icon} ${C.name}`, sub: g.wedges[seat].includes(g.cat) ? 'You have this wedge — answer for points' : 'Get it right to win the wedge!', myturn: true, buzz: true,
      card: { small: q[0], cls: 'tw-q' }, options: g.choices.map((c, i) => ({ v: i, label: c, cls: 'tw-c' + i })) };
  else if (g.phase === 'reveal') {
    const ok = g.gain[seat] != null;
    v.ui = { k: 'wait', title: ok ? `✓ Right! +${g.gain[seat]}${g.gain[seat + 'w'] ? ' and the wedge!' : ''}` : g.ans[seat] ? '✗ Not quite' : '⏱ Too slow', sub: `Answer: ${q[1]}`, card: { kicker: `${C.icon} ${C.name}`, small: q[0] } };
  } else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
export { CATS, Q };
