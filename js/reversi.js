// Reversi: on an 8×8 board, place a disc so that it traps a straight line (any direction) of
// the other player's discs between it and one of yours; the trapped discs flip to your colour.
// If you can't trap anything you pass. When neither player can move, the most discs wins.
// Dark (seat 0) moves first. Played as a match (best of 1/3/5/7).
import { createSeries, gameOver, nextGame, announce } from './duel.js?v=68';

const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
export const fresh = g => {
  g.board = Array(64).fill(null);
  g.board[27] = g.board[36] = 1;
  g.board[28] = g.board[35] = 0;
  g.last = null; g.flipped = []; g.passed = false;
};

export function createGame(settings) {
  const g = createSeries(settings);
  fresh(g);
  g.p = 0;
  return g;
}

export function flips(b, i, who) {
  if (b[i] != null) return [];
  const r0 = Math.floor(i / 8), c0 = i % 8, out = [];
  for (const [dr, dc] of DIRS) {
    const line = [];
    let r = r0 + dr, c = c0 + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === 1 - who) { line.push(r * 8 + c); r += dr; c += dc; }
    if (line.length && r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === who) out.push(...line);
  }
  return out;
}
export const moves = (b, who) => b.map((_, i) => i).filter(i => flips(b, i, who).length);
export const count = (b, who) => b.filter(x => x === who).length;

function finish(g) {
  const a = count(g.board, 0), b = count(g.board, 1);
  announce(g, a === b ? 0 : a > b ? 0 : 1, `${a} – ${b}`);
  gameOver(g, a === b ? null : a > b ? 0 : 1, 'count');
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next game';
  if (a.type === 'resign') { announce(g, seat, 'Resigns'); gameOver(g, 1 - seat, 'resign'); return null; }
  if (seat !== g.p) return "It isn't your turn";
  if (a.type !== 'move') return "That move isn't allowed";
  const f = flips(g.board, a.i, seat);
  if (!f.length) return 'That square doesn’t trap anything';
  g.board[a.i] = seat;
  f.forEach(i => { g.board[i] = seat; });
  g.last = a.i; g.flipped = f;
  g.moveId++;
  // Next player, or pass back, or game over.
  if (moves(g.board, 1 - seat).length) { g.p = 1 - seat; g.passed = false; }
  else if (moves(g.board, seat).length) { g.passed = true; announce(g, 1 - seat, 'Has to pass'); }
  else finish(g);
  return null;
}

// Computer: corners good, squares next to empty corners bad, plus mobility; a small search.
const W = [100, -20, 10, 5, 5, 10, -20, 100, -20, -50, -2, -2, -2, -2, -50, -20, 10, -2, 1, 1, 1, 1, -2, 10, 5, -2, 1, 0, 0, 1, -2, 5, 5, -2, 1, 0, 0, 1, -2, 5, 10, -2, 1, 1, 1, 1, -2, 10, -20, -50, -2, -2, -2, -2, -50, -20, 100, -20, 10, 5, 5, 10, -20, 100];
function evalB(b, me) {
  let s = 0;
  for (let i = 0; i < 64; i++) if (b[i] === me) s += W[i]; else if (b[i] === 1 - me) s -= W[i];
  return s + (moves(b, me).length - moves(b, 1 - me).length) * 3;
}
function search(b, who, me, depth, alpha, beta) {
  const ms = moves(b, who);
  if (!depth || (!ms.length && !moves(b, 1 - who).length)) {
    if (!ms.length && !moves(b, 1 - who).length) { const d = count(b, me) - count(b, 1 - me); return d * 1000; }
    return evalB(b, me);
  }
  if (!ms.length) return search(b, 1 - who, me, depth - 1, alpha, beta);
  let best = who === me ? -1e9 : 1e9;
  for (const m of ms) {
    const nb = b.slice(); nb[m] = who; flips(b, m, who).forEach(i => { nb[i] = who; });
    const v = search(nb, 1 - who, me, depth - 1, alpha, beta);
    if (who === me) { best = Math.max(best, v); alpha = Math.max(alpha, v); } else { best = Math.min(best, v); beta = Math.min(beta, v); }
    if (beta <= alpha) break;
  }
  return best;
}
export function botAction(g, seat) {
  const ms = moves(g.board, seat);
  const level = g.settings.level;
  if (level === 'easy' && Math.random() < 0.6) return { type: 'move', i: ms[Math.floor(Math.random() * ms.length)] };
  const depth = level === 'hard' ? 4 : 2;
  let best = null, bv = -1e9;
  for (const m of ms) {
    const nb = g.board.slice(); nb[m] = seat; flips(g.board, m, seat).forEach(i => { nb[i] = seat; });
    const v = search(nb, 1 - seat, seat, depth, -1e9, 1e9) + Math.random();
    if (v > bv) { bv = v; best = m; }
  }
  return { type: 'move', i: best };
}

export const viewFor = g => ({ board: g.board, p: g.p, phase: g.phase, last: g.last, flipped: g.flipped, passed: g.passed, legal: g.phase === 'play' ? moves(g.board, g.p) : [], wins: g.wins, draws: g.draws, result: g.result, bestOf: g.settings.bestOf, gameNo: g.gameNo, champion: g.champion ?? null });
export { nextGame };
