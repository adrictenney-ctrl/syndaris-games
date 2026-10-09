// Cornerstones: each colour has 21 pieces (every shape of one to five squares). Your first piece
// must cover your corner of the 20×20 board. After that, each new piece must touch one of your
// own pieces corner to corner — and must never share a side with your own colour (it may touch
// other colours however it likes). If you can't place a piece you're out of moves. When nobody
// can move, everyone loses a point per square left; placing every piece is +15 (+20 if the last
// one was the single square). With two players each plays two colours; with three, three colours.

export const N = 20;
// The 21 pieces as lists of [x, y] cells.
export const PIECES = [
  [[0, 0]],
  [[0, 0], [1, 0]],
  [[0, 0], [1, 0], [2, 0]], [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]], [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1]], [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]], [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]], [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]], [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]], [[0, 0], [0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
];
export const CORNER = [[0, N - 1], [0, 0], [N - 1, 0], [N - 1, N - 1]];   // colour k starts here (bottom-left, top-left, top-right, bottom-right)
export const COLOR = ['#3a7ad8', '#e8c23a', '#d8443a', '#4aa85a'];
export const COLOR_NAME = ['Blue', 'Yellow', 'Red', 'Green'];
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

// All distinct orientations of a piece (rotations and flips), normalised to start at 0,0.
export function orientations(cells) {
  const out = [], seen = new Set();
  let c = cells;
  for (let f = 0; f < 2; f++) {
    for (let r = 0; r < 4; r++) {
      const minx = Math.min(...c.map(p => p[0])), miny = Math.min(...c.map(p => p[1]));
      const n = c.map(([x, y]) => [x - minx, y - miny]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      const k = JSON.stringify(n);
      if (!seen.has(k)) { seen.add(k); out.push(n); }
      c = c.map(([x, y]) => [-y, x]);
    }
    c = c.map(([x, y]) => [-x, y]);
  }
  return out;
}
export const ORIENT = PIECES.map(orientations);
// The transformed cells for piece p with rotation r (0–3) and flip f.
export function shape(p, rot = 0, flip = false) {
  let c = PIECES[p];
  if (flip) c = c.map(([x, y]) => [-x, y]);
  for (let i = 0; i < rot; i++) c = c.map(([x, y]) => [-y, x]);
  const minx = Math.min(...c.map(q => q[0])), miny = Math.min(...c.map(q => q[1]));
  return c.map(([x, y]) => [x - minx, y - miny]);
}

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const n = g.order.length;
  // Colours in play and who controls each.
  g.colors = n === 2 ? [0, 1, 2, 3] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3];
  g.owner = g.colors.map((c, i) => g.order[i % n]);
  g.board = Array(N * N).fill(null);
  g.left = g.colors.map(() => PIECES.map((_, i) => i));
  g.out = g.colors.map(() => false);
  g.lastPiece = g.colors.map(() => null);
  g.ci = 0;           // index into g.colors of the colour to move
  g.phase = 'play';
  g.last = null;
  return g;
}

const at = (x, y) => (x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1);
export function canPlace(g, color, cells, ox, oy) {
  const first = !g.board.some(v => v === color);
  let corner = false;
  for (const [cx, cy] of cells) {
    const x = ox + cx, y = oy + cy, i = at(x, y);
    if (i < 0 || g.board[i] != null) return false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = at(x + dx, y + dy); if (j >= 0 && g.board[j] === color) return false; }
    if (first) { if (x === CORNER[color][0] && y === CORNER[color][1]) corner = true; }
    else for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const j = at(x + dx, y + dy); if (j >= 0 && g.board[j] === color) corner = true; }
  }
  return corner;
}

export function anyMove(g, ci) {
  const color = g.colors[ci];
  for (const p of g.left[ci]) for (const o of ORIENT[p]) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (canPlace(g, color, o, x, y)) return true;
  return false;
}

export const current = g => (g.phase === 'play' ? g.owner[g.ci] : -1);
export const colorToMove = g => g.colors[g.ci];

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== current(g)) return "It isn't your turn";
  const ci = g.ci, color = g.colors[ci];
  if (a.type === 'pass') {
    if (anyMove(g, ci)) return 'You can still place a piece';
    g.out[ci] = true;
    announce(g, seat, `${COLOR_NAME[color]} is out of moves`);
    return advance(g);
  }
  if (a.type !== 'place') return "That move isn't allowed";
  const p = Number(a.piece);
  if (!g.left[ci].includes(p)) return 'You’ve already used that piece';
  const cells = shape(p, a.rot || 0, !!a.flip);
  if (!canPlace(g, color, cells, Number(a.x), Number(a.y))) return g.board.some(v => v === color) ? 'It must touch your colour at a corner — never along a side' : 'Your first piece must cover your corner';
  for (const [cx, cy] of cells) g.board[at(a.x + cx, a.y + cy)] = color;
  g.left[ci] = g.left[ci].filter(x => x !== p);
  g.lastPiece[ci] = p;
  g.last = cells.map(([cx, cy]) => at(a.x + cx, a.y + cy));
  return advance(g);
}

function advance(g) {
  g.moveId++;
  for (let k = 1; k <= g.colors.length; k++) {
    const ci = (g.ci + k) % g.colors.length;
    if (g.out[ci]) continue;
    if (!g.left[ci].length || !anyMove(g, ci)) { g.out[ci] = true; continue; }
    g.ci = ci;
    return null;
  }
  // Nobody can move.
  g.phase = 'over';
  g.score = g.seats.map(() => 0);
  g.colors.forEach((c, ci) => {
    const sq = g.left[ci].reduce((t, p) => t + PIECES[p].length, 0);
    const pts = sq ? -sq : 15 + (g.lastPiece[ci] === 0 ? 5 : 0);
    g.score[g.owner[ci]] += pts;
  });
  const best = Math.max(...g.order.map(s => g.score[s]));
  g.winners = g.order.filter(s => g.score[s] === best);
  return null;
}

// Computer: biggest piece first, favouring spots that open new corners and reach the centre.
export function botAction(g, s) {
  const ci = g.ci, color = g.colors[ci];
  let best = null, bv = -1e9;
  const pieces = g.left[ci].slice().sort((a, b) => PIECES[b].length - PIECES[a].length);
  for (const p of pieces) {
    if (best && PIECES[p].length < PIECES[best.piece].length - 1) break;
    for (let rot = 0; rot < 4; rot++) for (const flip of [false, true]) {
      const cells = shape(p, rot, flip);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (!canPlace(g, color, cells, x, y)) continue;
        let v = PIECES[p].length * 10;
        for (const [cx, cy] of cells) { const dx = x + cx - 9.5, dy = y + cy - 9.5; v -= Math.hypot(dx, dy) * 0.3; }
        v += Math.random() * 3;
        if (v > bv) { bv = v; best = { type: 'place', piece: p, rot, flip, x, y }; }
      }
    }
  }
  return best || { type: 'pass' };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, board: g.board, colors: g.colors, owner: g.owner, ci: g.ci, color: g.colors[g.ci], left: g.left, out: g.out, last: g.last,
    turn: current(g), order: g.order, score: g.score || null, winners: g.winners || null,
  };
}
