// Throwdown: a rock-paper-scissors tournament. The table draws the bracket; every match in a round
// plays at once. Pick your throw secretly on your phone — both throws flip on the table together.
// First to two wins takes the match and moves on. Last one standing is the champion.
import { base, shuffle, sfx, announce } from './party.js?v=68';

export const THROWS = [{ n: 'Rock', e: '🪨' }, { n: 'Paper', e: '📄' }, { n: 'Scissors', e: '✂️' }];
const beats = (a, b) => (a - b + 3) % 3 === 1;   // paper beats rock, scissors beat paper, rock beats scissors

export function createGame(settings, players) {
  const g = base(settings, players, { bestOf: 3 });
  g.rounds = [];
  g.alive = shuffle([...g.order]);
  g.phase = 'play';
  newRound(g);
  return g;
}
function newRound(g) {
  const p = [...g.alive], matches = [];
  while (p.length > 1) matches.push({ a: p.shift(), b: p.shift(), wa: 0, wb: 0, ta: null, tb: null, last: null, w: null });
  if (p.length) matches.push({ a: p.shift(), b: null, w: null, bye: true });
  g.rounds.push(matches);
  matches.forEach(m => { if (m.bye) m.w = m.a; });
  g.moveId++;
}
const cur = g => g.rounds[g.rounds.length - 1];
const need = g => Math.ceil(g.settings.bestOf / 2);
export const matchOf = (g, s) => cur(g).find(m => m.a === s || m.b === s);
export const pending = g => (g.phase !== 'play' ? [] : cur(g).filter(m => m.w == null).flatMap(m => [m.ta == null ? m.a : null, m.tb == null ? m.b : null]).filter(x => x != null));
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = () => -1;
export const collecting = () => false;

export function applyAction(g, seat, a) {
  if (!a || a.type !== 'pick' || g.phase !== 'play') return 'Not now';
  const m = matchOf(g, seat);
  if (!m || m.w != null) return 'You’re not in a match right now';
  const t = Number(a.v);
  if (!THROWS[t]) return 'Rock, paper or scissors';
  if (m.a === seat) { if (m.ta != null) return 'Already thrown'; m.ta = t; } else { if (m.tb != null) return 'Already thrown'; m.tb = t; }
  if (m.ta != null && m.tb != null) {
    const r = m.ta === m.tb ? 0 : beats(m.ta, m.tb) ? 1 : -1;
    m.last = { ta: m.ta, tb: m.tb, r, id: (m.last?.id || 0) + 1 };
    if (r > 0) m.wa++; else if (r < 0) m.wb++;
    m.ta = m.tb = null;
    if (m.wa >= need(g)) m.w = m.a; else if (m.wb >= need(g)) m.w = m.b;
    sfx(g, r ? 'ding' : 'thud');
    if (m.w != null) { announce(g, m.w, 'Wins the match! 💪'); g.score[m.w]++; }
    if (cur(g).every(x => x.w != null)) { g.phase = 'between'; g.betweenAt = Date.now(); }
  }
  g.moveId++;
  return null;
}

export function tick(g) {
  if (g.phase === 'between') return { ms: Math.max(0, g.betweenAt + 3500 - Date.now()), run: () => {
    g.alive = cur(g).map(m => m.w);
    if (g.alive.length <= 1) { g.winner = g.alive[0]; g.winners = [g.winner]; g.score[g.winner] += 1; g.phase = 'over'; sfx(g, 'chime'); g.moveId++; return; }
    g.phase = 'play';
    newRound(g);
  } };
  return null;
}
export const botAction = () => ({ type: 'pick', v: Math.floor(Math.random() * 3) });

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Round', g.rounds.length], ['Still in', g.alive.length]] };
  const m = g.phase === 'over' ? null : matchOf(g, seat);
  if (g.phase === 'over') { v.ui = { k: 'wait', title: g.winner === seat ? '🏆 Champion!' : `@${g.winner}@ is the champion`, sub: 'Look at the table to play again' }; return v; }
  if (!m) { v.ui = { k: 'wait', title: 'You’re out', sub: 'Cheer on the others!' }; return v; }
  if (m.bye) { v.ui = { k: 'wait', title: 'A bye this round', sub: 'You go straight through' }; return v; }
  const me = m.a === seat, opp = me ? m.b : m.a, myW = me ? m.wa : m.wb, oppW = me ? m.wb : m.wa;
  const last = m.last ? `Last: you ${THROWS[me ? m.last.ta : m.last.tb].e} vs ${THROWS[me ? m.last.tb : m.last.ta].e} them — ${m.last.r === 0 ? 'tie' : (m.last.r > 0) === me ? 'you won it' : 'they won it'}` : `First to ${need(g)}`;
  if (m.w != null) v.ui = { k: 'wait', title: m.w === seat ? 'You win the match! 💪' : 'Knocked out', sub: `${myW}–${oppW} against @${opp}@` };
  else if ((me ? m.ta : m.tb) != null) v.ui = { k: 'wait', title: 'Thrown ✓', sub: `Waiting for @${opp}@… (${myW}–${oppW})` };
  else v.ui = { k: 'pick', key: `t${g.rounds.length}:${m.last?.id || 0}`, title: `vs @${opp}@ · ${myW}–${oppW}`, sub: last, myturn: true, buzz: true, grid: 3, big: true, options: THROWS.map((t, i) => ({ v: i, label: t.e, sub: t.n })) };
  return v;
}
