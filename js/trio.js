// Trio: three in a row on a 3×3 board (the classic noughts-and-crosses game). Seat 0 plays
// the gold rings, seat 1 the ivory diamonds. Played as a match (best of 1/3/5/7).
import { createSeries, gameOver, nextGame, announce } from './duel.js?v=68';

export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const fresh = g => { g.board = Array(9).fill(null); g.line = null; g.last = null; };

export function createGame(settings) {
  const g = createSeries(settings);
  fresh(g);
  g.p = 0;
  return g;
}

export function lineOf(b) {
  for (const l of LINES) if (b[l[0]] != null && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return l;
  return null;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next game';
  if (a.type === 'resign') { announce(g, seat, 'Resigns'); gameOver(g, 1 - seat, 'resign'); return null; }
  if (a.type !== 'move') return "That move isn't allowed";
  if (seat !== g.p) return "It isn't your turn";
  if (!(a.i >= 0 && a.i < 9) || g.board[a.i] != null) return 'That square is taken';
  g.board[a.i] = seat;
  g.last = a.i;
  g.moveId++;
  const l = lineOf(g.board);
  if (l) { g.line = l; announce(g, seat, 'Three in a row!'); gameOver(g, seat, 'line'); return null; }
  if (g.board.every(x => x != null)) { announce(g, seat, 'A draw'); gameOver(g, null, 'full'); return null; }
  g.p = 1 - g.p;
  return null;
}

export const viewFor = g => ({ board: g.board, p: g.p, phase: g.phase, line: g.line, last: g.last, wins: g.wins, draws: g.draws, result: g.result, bestOf: g.settings.bestOf, gameNo: g.gameNo, champion: g.champion ?? null });
export { nextGame };

function score(b, me, turn, depth) {
  const l = lineOf(b);
  if (l) return b[l[0]] === me ? 10 - depth : depth - 10;
  if (b.every(x => x != null)) return 0;
  let best = turn === me ? -99 : 99;
  for (let i = 0; i < 9; i++) {
    if (b[i] != null) continue;
    b[i] = turn;
    const s = score(b, me, 1 - turn, depth + 1);
    b[i] = null;
    best = turn === me ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}

export function botAction(g, seat) {
  const free = g.board.map((x, i) => (x == null ? i : -1)).filter(i => i >= 0);
  const sloppy = { easy: 0.5, normal: 0.15, hard: 0 }[g.settings.level] ?? 0.15;
  if (Math.random() < sloppy) return { type: 'move', i: free[Math.floor(Math.random() * free.length)] };
  let best = [], bestS = -99;
  for (const i of free) {
    const b = g.board.slice(); b[i] = seat;
    const s = score(b, seat, 1 - seat, 1);
    if (s > bestS) { bestS = s; best = [i]; } else if (s === bestS) best.push(i);
  }
  return { type: 'move', i: best[Math.floor(Math.random() * best.length)] };
}
