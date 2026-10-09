// Go on a 9×9, 13×13 or 19×19 board. Black (seat 0) plays first. Place a stone on any empty
// point; a group with no empty points next to it (no liberties) is captured. You can't make a
// move that leaves your own group with no liberties (unless it captures), and you can't recreate
// the board position from just before your opponent's move (ko). Pass when you're done; after two
// passes in a row both players mark any dead stones, then the game is scored by area: your stones
// plus the empty points only you surround, with komi (extra points) for White.
import { createSeries, gameOver, nextGame, announce } from './duel.js?v=66';

export const fresh = g => {
  const n = g.settings.size;
  g.n = n;
  g.board = Array(n * n).fill(null);
  g.prev = null;            // position before the last move (for ko)
  g.caps = [0, 0];
  g.passes = 0;
  g.last = null;
  g.dead = [];
  g.accept = [false, false];
  g.score = null;
  g.moves = 0;
  g.stage = 'play';
};

export function createGame(settings) {
  const g = createSeries({ size: 9, komi: 6.5, ...settings });
  g.settings.size = Number(g.settings.size) || 9;
  fresh(g);
  g.p = 0;
  return g;
}

export const nbrs = (n, i) => { const r = Math.floor(i / n), c = i % n, o = []; if (r) o.push(i - n); if (r < n - 1) o.push(i + n); if (c) o.push(i - 1); if (c < n - 1) o.push(i + 1); return o; };
export function group(b, n, i) {
  const col = b[i], stones = [i], libs = new Set(), seen = new Set([i]);
  for (let k = 0; k < stones.length; k++) for (const j of nbrs(n, stones[k])) {
    if (b[j] == null) libs.add(j);
    else if (b[j] === col && !seen.has(j)) { seen.add(j); stones.push(j); }
  }
  return { stones, libs };
}

// Try a move: returns { board, captured } or an error string.
export function tryMove(b, n, i, who, prev) {
  if (b[i] != null) return 'That point is taken';
  const nb = b.slice();
  nb[i] = who;
  let captured = 0;
  for (const j of nbrs(n, i)) if (nb[j] === 1 - who) { const gr = group(nb, n, j); if (!gr.libs.size) { gr.stones.forEach(s => { nb[s] = null; }); captured += gr.stones.length; } }
  if (!group(nb, n, i).libs.size) return 'That stone would have no liberties';
  if (prev && nb.every((x, k) => x === prev[k])) return 'Ko — you can’t retake straight away';
  return { board: nb, captured };
}

// Area score: stones (minus marked dead) plus territory.
export function scoreOf(g) {
  const n = g.n, b = g.board.map((x, i) => (g.dead.includes(i) ? null : x));
  const pts = [0, 0];
  b.forEach(x => { if (x != null) pts[x]++; });
  const seen = new Set();
  const terr = Array(n * n).fill(null);
  for (let i = 0; i < n * n; i++) {
    if (b[i] != null || seen.has(i)) continue;
    const area = [i], border = new Set();
    seen.add(i);
    for (let k = 0; k < area.length; k++) for (const j of nbrs(n, area[k])) {
      if (b[j] == null) { if (!seen.has(j)) { seen.add(j); area.push(j); } } else border.add(b[j]);
    }
    if (border.size === 1) { const w = [...border][0]; pts[w] += area.length; area.forEach(a => { terr[a] = w; }); }
  }
  // Dead stones count as territory for the side that surrounds them (already empty in `b`).
  return { black: pts[0], white: pts[1] + g.settings.komi, terr };
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next game';
  if (a.type === 'resign') { announce(g, seat, 'Resigns'); gameOver(g, 1 - seat, 'resign'); return null; }
  if (g.stage === 'score') {
    if (a.type === 'dead') {
      const i = Number(a.i);
      if (g.board[i] == null) return 'Tap a stone';
      const gr = group(g.board, g.n, i).stones;
      const isDead = g.dead.includes(i);
      g.dead = isDead ? g.dead.filter(x => !gr.includes(x)) : [...g.dead, ...gr];
      g.accept = [false, false];
      g.score = scoreOf(g);
      g.moveId++;
      return null;
    }
    if (a.type === 'accept') {
      g.accept[seat] = true;
      g.moveId++;
      if (g.accept[0] && g.accept[1]) {
        const s = scoreOf(g);
        announce(g, s.black > s.white ? 0 : 1, `${s.black} – ${s.white}`);
        gameOver(g, s.black > s.white ? 0 : 1, 'score');
      }
      return null;
    }
    if (a.type === 'resume') { g.stage = 'play'; g.passes = 0; g.dead = []; g.accept = [false, false]; g.score = null; g.moveId++; return null; }
    return 'Mark dead stones, then accept the score';
  }
  if (seat !== g.p) return "It isn't your turn";
  if (a.type === 'pass') {
    g.passes++;
    g.prev = null;
    g.last = null;
    announce(g, seat, 'Pass');
    g.moveId++;
    g.p = 1 - seat;
    if (g.passes >= 2) { g.stage = 'score'; g.score = scoreOf(g); }
    return null;
  }
  if (a.type !== 'move') return "That move isn't allowed";
  const i = Number(a.i);
  if (!(i >= 0 && i < g.n * g.n)) return 'Pick a point';
  const r = tryMove(g.board, g.n, i, seat, g.prev);
  if (typeof r === 'string') return r;
  g.prev = g.board;
  g.board = r.board;
  g.caps[seat] += r.captured;
  g.last = i;
  g.passes = 0;
  g.moves++;
  g.moveId++;
  g.p = 1 - seat;
  return null;
}

// ------------------------------------------------------------------ computer player
const isEye = (b, n, i, who) => nbrs(n, i).every(j => b[j] === who);
export function botAction(g, seat) {
  if (g.stage === 'score') return { type: 'accept' };
  const n = g.n, b = g.board;
  let best = null, bv = -1e9;
  const level = g.settings.level;
  for (let i = 0; i < n * n; i++) {
    if (b[i] != null || isEye(b, n, i, seat)) continue;
    const r = tryMove(b, n, i, seat, g.prev);
    if (typeof r === 'string') continue;
    let v = r.captured * 12;
    const mine = group(r.board, n, i);
    if (mine.libs.size === 1) v -= 15 + mine.stones.length * 3;
    else v += Math.min(mine.libs.size, 4);
    // Save my groups in atari; put theirs in atari.
    for (const j of nbrs(n, i)) {
      if (b[j] === seat && group(b, n, j).libs.size === 1) v += 10;
      if (b[j] === 1 - seat) { const l = group(r.board, n, j).libs.size; if (l === 1) v += 6; else if (l === 2) v += 1.5; }
    }
    // Shape: near stones, not on the edge early.
    const row = Math.floor(i / n), col = i % n, edge = Math.min(row, col, n - 1 - row, n - 1 - col);
    if (g.moves < n * 1.5) v += edge === 2 || (n >= 13 && edge === 3) ? 3 : edge === 0 ? -4 : 0;
    if (nbrs(n, i).some(j => b[j] != null)) v += 1;
    v += Math.random() * (level === 'easy' ? 8 : level === 'hard' ? 1 : 3);
    if (v > bv) { bv = v; best = i; }
  }
  // Pass when nothing useful is left (or the other side passed and it's late).
  const sc = scoreOf(g);
  const filled = b.filter(x => x != null).length + sc.terr.filter(x => x != null).length;
  if (best == null || bv < 0.5 || (g.passes && filled > n * n * 0.8)) return { type: 'pass' };
  return { type: 'move', i: best };
}

export const viewFor = g => ({ n: g.n, board: g.board, p: g.p, phase: g.phase, stage: g.stage, last: g.last, caps: g.caps, passes: g.passes, dead: g.dead, accept: g.accept, score: g.score, komi: g.settings.komi, wins: g.wins, draws: g.draws, result: g.result, bestOf: g.settings.bestOf, gameNo: g.gameNo, champion: g.champion ?? null });
export { nextGame };
