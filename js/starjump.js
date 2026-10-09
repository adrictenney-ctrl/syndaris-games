// Star Jump: race your ten marbles across a six-pointed star into the point opposite your own.
// On your turn move one marble: either one step to a neighbouring empty hole, or a chain of
// jumps — over any single marble (anyone's) into the empty hole right behind it, as many jumps
// as you like in one turn. First to fill the opposite point wins. Two to six players; each seat
// at the table owns the point of the star facing it.

// Holes in cube coordinates (q, r, s with q + r + s = 0): the union of two big triangles.
export const HOLES = [];
for (let q = -8; q <= 8; q++) for (let r = -8; r <= 8; r++) {
  const s = -q - r;
  if (Math.abs(s) > 8) continue;
  const up = q >= -4 && r >= -4 && s >= -4, down = q <= 4 && r <= 4 && s <= 4;
  if (up || down) HOLES.push({ q, r, s });
}
const key = (q, r) => q * 100 + r;
export const INDEX = new Map(HOLES.map((h, i) => [key(h.q, h.r), i]));
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const NBR = HOLES.map(h => DIRS.map(([dq, dr]) => INDEX.get(key(h.q + dq, h.r + dr)) ?? -1));

// The six points, in seat order (clockwise from the bottom of the table).
// Arm k is the set of holes whose coordinate `c` is beyond ±4.
const ARM_DEF = [['r', 1], ['q', -1], ['s', 1], ['r', -1], ['q', 1], ['s', -1]];
export const ARMS = ARM_DEF.map(([c, sign]) => HOLES.map((h, i) => (h[c] * sign > 4 ? i : -1)).filter(i => i >= 0));
export const TIP = ARM_DEF.map(([c, sign]) => HOLES.findIndex(h => h[c] * sign === 8));
export const opposite = k => (k + 3) % 6;
export const dist = (a, b) => (Math.abs(HOLES[a].q - HOLES[b].q) + Math.abs(HOLES[a].r - HOLES[b].r) + Math.abs(HOLES[a].s - HOLES[b].s)) / 2;

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { level: 'normal', ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.board = HOLES.map(() => null);
  for (const s of g.order) for (const i of ARMS[s]) g.board[i] = s;
  g.turn = g.order[0];
  g.last = null;
  g.moves = 0;
  g.phase = 'play';
  return g;
}

// Every hole a marble at `from` can reach this turn: { to: path }.
export function reach(b, from) {
  const out = new Map();
  for (const n of NBR[from]) if (n >= 0 && b[n] == null) out.set(n, [from, n]);
  const seen = new Set([from]), queue = [[from, [from]]];
  while (queue.length) {
    const [at, path] = queue.shift();
    for (let d = 0; d < 6; d++) {
      const over = NBR[at][d];
      if (over < 0 || b[over] == null) continue;
      const land = NBR[over][d];
      if (land < 0 || b[land] != null || seen.has(land) || land === from) continue;
      seen.add(land);
      const p = [...path, land];
      if (!out.has(land)) out.set(land, p);
      queue.push([land, p]);
    }
  }
  return out;
}

export const current = g => (g.phase === 'play' ? g.turn : -1);
export const won = (g, s) => { const T = ARMS[opposite(s)]; return T.every(i => g.board[i] != null) && T.some(i => g.board[i] === s); };

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It isn't your turn";
  if (a.type !== 'move') return "That move isn't allowed";
  const from = Number(a.from), to = Number(a.to);
  if (g.board[from] !== seat) return 'Pick one of your marbles';
  const r = reach(g.board, from);
  if (!r.has(to)) return 'It can’t get there';
  g.board[from] = null;
  g.board[to] = seat;
  g.last = { seat, path: r.get(to) };
  g.moves++;
  g.moveId++;
  if (won(g, seat)) { g.phase = 'over'; g.winner = seat; announce(g, seat, 'Home! 🌟'); return null; }
  g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
  if (g.moves > 600 * g.order.length) { g.phase = 'over'; g.winner = bestProgress(g); }
  return null;
}

const progress = (g, s) => g.board.reduce((t, x, i) => t + (x === s ? dist(i, TIP[opposite(s)]) : 0), 0);
const bestProgress = g => g.order.slice().sort((a, b) => progress(g, a) - progress(g, b))[0];

export function botAction(g, s) {
  const tip = TIP[opposite(s)];
  const target = new Set(ARMS[opposite(s)]);
  let best = null, bv = -1e9;
  const mine = g.board.map((x, i) => (x === s ? i : -1)).filter(i => i >= 0);
  const far = Math.max(...mine.map(i => dist(i, tip)));
  for (const from of mine) {
    for (const [to] of reach(g.board, from)) {
      let v = dist(from, tip) - dist(to, tip);
      if (target.has(from) && !target.has(to)) v -= 5;
      if (dist(from, tip) === far) v += 0.6;            // bring up the stragglers
      if (target.has(to)) v += 0.3 + (8 - dist(to, tip)) * 0.05;
      v += Math.random() * (g.settings.level === 'easy' ? 2 : 0.2);
      if (v > bv) { bv = v; best = { type: 'move', from, to }; }
    }
  }
  return best;
}

export function viewFor(g) {
  return { phase: g.phase, turn: g.turn, order: g.order, board: g.board, last: g.last, winner: g.winner ?? null, moveId: g.moveId };
}
