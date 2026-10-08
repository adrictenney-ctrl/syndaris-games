// Four Up: drop discs into a 7-column, 6-row frame; first to line up four (across, up or
// diagonally) wins. Seat 0 plays champagne discs, seat 1 plays oxblood. Played as a match.
import { createSeries, gameOver, nextGame, announce } from './duel.js?v=58';

export const COLS = 7, ROWS = 6;
export const fresh = g => { g.cols = Array.from({ length: COLS }, () => []); g.line = null; g.last = null; };

export function createGame(settings) {
  const g = createSeries(settings);
  fresh(g);
  g.p = 0;
  return g;
}

const at = (cols, c, r) => (c < 0 || c >= COLS || r < 0 || r >= ROWS ? undefined : cols[c][r]);

export function findLine(cols, c, r) {
  const who = cols[c][r];
  for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    const cells = [[c, r]];
    for (const s of [1, -1]) {
      let k = 1;
      while (at(cols, c + dc * k * s, r + dr * k * s) === who) { cells.push([c + dc * k * s, r + dr * k * s]); k++; }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next game';
  if (a.type === 'resign') { announce(g, seat, 'Resigns'); gameOver(g, 1 - seat, 'resign'); return null; }
  if (a.type !== 'drop') return "That move isn't allowed";
  if (seat !== g.p) return "It isn't your turn";
  const c = a.col;
  if (!(c >= 0 && c < COLS) || g.cols[c].length >= ROWS) return 'That column is full';
  g.cols[c].push(seat);
  const r = g.cols[c].length - 1;
  g.last = [c, r];
  g.moveId++;
  const l = findLine(g.cols, c, r);
  if (l) { g.line = l; announce(g, seat, 'Four up!'); gameOver(g, seat, 'line'); return null; }
  if (g.cols.every(col => col.length >= ROWS)) { announce(g, seat, 'The frame is full'); gameOver(g, null, 'full'); return null; }
  g.p = 1 - g.p;
  return null;
}

export const viewFor = g => ({ cols: g.cols, p: g.p, phase: g.phase, line: g.line, last: g.last, wins: g.wins, draws: g.draws, result: g.result, bestOf: g.settings.bestOf, gameNo: g.gameNo, champion: g.champion ?? null, moveId: g.moveId });
export { nextGame };

// ---------------------------------------------------------------- computer player

function evalWindow(w, me) {
  const mine = w.filter(x => x === me).length, theirs = w.filter(x => x === 1 - me).length, empty = w.filter(x => x === undefined || x === null).length;
  if (mine && theirs) return 0;
  if (mine === 3 && empty === 1) return 50;
  if (mine === 2 && empty === 2) return 8;
  if (theirs === 3 && empty === 1) return -60;
  if (theirs === 2 && empty === 2) return -8;
  return 0;
}
function evaluate(cols, me) {
  let s = 0;
  for (let r = 0; r < ROWS; r++) if (cols[3][r] === me) s += 6; else if (cols[3][r] === 1 - me) s -= 6;
  const cell = (c, r) => (r < cols[c].length ? cols[c][r] : null);
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    if (c + 3 < COLS) s += evalWindow([0, 1, 2, 3].map(k => cell(c + k, r)), me);
    if (r + 3 < ROWS) s += evalWindow([0, 1, 2, 3].map(k => cell(c, r + k)), me);
    if (c + 3 < COLS && r + 3 < ROWS) s += evalWindow([0, 1, 2, 3].map(k => cell(c + k, r + k)), me);
    if (c + 3 < COLS && r - 3 >= 0) s += evalWindow([0, 1, 2, 3].map(k => cell(c + k, r - k)), me);
  }
  return s;
}
const ORDER = [3, 2, 4, 1, 5, 0, 6];
function search(cols, turn, me, depth, alpha, beta) {
  let best = turn === me ? -Infinity : Infinity;
  let any = false;
  for (const c of ORDER) {
    if (cols[c].length >= ROWS) continue;
    any = true;
    cols[c].push(turn);
    let s;
    if (findLine(cols, c, cols[c].length - 1)) s = turn === me ? 10000 + depth : -10000 - depth;
    else if (depth <= 1) s = evaluate(cols, me);
    else s = search(cols, 1 - turn, me, depth - 1, alpha, beta);
    cols[c].pop();
    if (turn === me) { best = Math.max(best, s); alpha = Math.max(alpha, s); }
    else { best = Math.min(best, s); beta = Math.min(beta, s); }
    if (beta <= alpha) break;
  }
  return any ? best : 0;
}

export function botAction(g, seat) {
  const depth = { easy: 2, normal: 5, hard: 7 }[g.settings.level] || 5;
  const open = ORDER.filter(c => g.cols[c].length < ROWS);
  if (g.settings.level === 'easy' && Math.random() < 0.3) return { type: 'drop', col: open[Math.floor(Math.random() * open.length)] };
  const cols = g.cols.map(c => c.slice());
  let best = open[0], bestS = -Infinity;
  for (const c of open) {
    cols[c].push(seat);
    const s = findLine(cols, c, cols[c].length - 1) ? 100000 : search(cols, 1 - seat, seat, depth - 1, -Infinity, Infinity) + (Math.random() - 0.5);
    cols[c].pop();
    if (s > bestS) { bestS = s; best = c; }
  }
  return { type: 'drop', col: best };
}
