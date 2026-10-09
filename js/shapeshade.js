// Shape & Shade: 108 tiles — six shapes in six colours, three of each. Hold six tiles. On your
// turn place one or more tiles in a single straight line, joined to the tiles already down.
// Every line on the board must be all one colour (each shape at most once) or all one shape
// (each colour at most once), so no line is longer than six. Score one point per tile in every
// line you made or added to; finishing a line of six scores six extra. Or swap any tiles with
// the bag instead. When the bag is empty, the first to use all their tiles ends the game (+6).

export const SHAPES = ['●', '■', '◆', '✚', '★', '✿'];
export const COLORS = ['#d8443a', '#e8892a', '#e6c83a', '#4aa85a', '#3a7ad8', '#9a5ad0'];
export const tile = id => { const k = Math.floor(id / 3); return { c: Math.floor(k / 6), s: k % 6 }; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const K = (x, y) => `${x},${y}`;

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.bag = shuffle([...Array(108).keys()]);
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.bag.splice(0, 6);
  g.board = {};
  g.scores = g.seats.map(() => 0);
  g.turn = g.order[0];
  g.phase = 'play';
  g.last = [];
  return g;
}

// The run of tiles through (x, y) along direction (dx, dy), using board + staged.
function run(get, x, y, dx, dy) {
  let sx = x, sy = y;
  while (get(sx - dx, sy - dy) != null) { sx -= dx; sy -= dy; }
  const out = [];
  for (let cx = sx, cy = sy; get(cx, cy) != null; cx += dx, cy += dy) out.push(get(cx, cy));
  return out;
}
const lineOk = ids => {
  if (ids.length > 6) return false;
  const ts = ids.map(tile);
  const sameC = ts.every(t => t.c === ts[0].c) && new Set(ts.map(t => t.s)).size === ts.length;
  const sameS = ts.every(t => t.s === ts[0].s) && new Set(ts.map(t => t.c)).size === ts.length;
  return sameC || sameS;
};

// Check a move: places = [{ x, y, t }]. Returns { score } or an error string.
export function checkMove(board, places) {
  if (!places.length) return 'Place at least one tile';
  const map = new Map(places.map(p => [K(p.x, p.y), p.t]));
  if (map.size !== places.length) return 'Two tiles on one square';
  if (places.some(p => board[K(p.x, p.y)] != null)) return 'That square is taken';
  const get = (x, y) => map.get(K(x, y)) ?? board[K(x, y)] ?? null;
  const rows = new Set(places.map(p => p.y)), cols = new Set(places.map(p => p.x));
  if (rows.size > 1 && cols.size > 1) return 'Tiles must go in one straight line';
  const horiz = rows.size === 1 && places.length > 1 ? true : cols.size === 1 && places.length > 1 ? false : null;
  // No gaps between the placed tiles.
  if (horiz != null) {
    const xs = places.map(p => (horiz ? p.x : p.y)).sort((a, b) => a - b), fixed = horiz ? places[0].y : places[0].x;
    for (let v = xs[0]; v <= xs[xs.length - 1]; v++) if ((horiz ? get(v, fixed) : get(fixed, v)) == null) return 'No gaps in your line';
  }
  const empty = !Object.keys(board).length;
  if (!empty && !places.some(p => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => board[K(p.x + dx, p.y + dy)] != null))) return 'Join onto the tiles already down';
  let score = 0;
  const lines = [];
  const add = (x, y, dx, dy) => { const L = run(get, x, y, dx, dy); if (L.length >= 2) lines.push(L); };
  const p0 = places[0];
  if (horiz === true) { add(p0.x, p0.y, 1, 0); places.forEach(p => add(p.x, p.y, 0, 1)); }
  else if (horiz === false) { add(p0.x, p0.y, 0, 1); places.forEach(p => add(p.x, p.y, 1, 0)); }
  else { add(p0.x, p0.y, 1, 0); add(p0.x, p0.y, 0, 1); }
  for (const L of lines) { if (!lineOk(L)) return 'Every line must be one colour or one shape, with no repeats'; score += L.length + (L.length === 6 ? 6 : 0); }
  if (!lines.length) score = 1;
  return { score, six: lines.some(L => L.length === 6) };
}

export const current = g => (g.phase === 'play' ? g.turn : -1);
const next = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It isn't your turn";
  const h = g.hands[seat];
  if (a.type === 'swap') {
    const ids = g.bag.length ? (a.ids || []).map(Number) : [];   // an empty bag: this is a pass
    if (g.bag.length && (!ids.length || !ids.every(t => h.includes(t)))) return 'Pick tiles to swap';
    if (g.bag.length < ids.length) return 'Not enough tiles left in the bag';
    g.hands[seat] = h.filter(t => !ids.includes(t));
    g.hands[seat].push(...g.bag.splice(0, ids.length));
    g.bag.push(...ids); shuffle(g.bag);
    announce(g, seat, ids.length ? `Swaps ${ids.length}` : 'Pass');
    g.moveId++;
    g.turn = next(g, seat);
    g.passes = (g.passes || 0) + 1;
    if (g.passes > g.order.length * 3) end(g, null);
    return null;
  }
  if (a.type !== 'place') return "That move isn't allowed";
  const places = (a.places || []).map(p => ({ x: Number(p.x), y: Number(p.y), t: Number(p.t) }));
  if (!places.every(p => h.includes(p.t)) || new Set(places.map(p => p.t)).size !== places.length) return 'Use tiles from your hand';
  const r = checkMove(g.board, places);
  if (typeof r === 'string') return r;
  for (const p of places) g.board[K(p.x, p.y)] = p.t;
  g.hands[seat] = h.filter(t => !places.some(p => p.t === t));
  g.hands[seat].push(...g.bag.splice(0, 6 - g.hands[seat].length));
  g.scores[seat] += r.score;
  g.last = places.map(p => K(p.x, p.y));
  g.passes = 0;
  announce(g, seat, r.six ? `Six in a row! +${r.score}` : `+${r.score}`);
  g.moveId++;
  if (!g.hands[seat].length) { g.scores[seat] += 6; return end(g, seat); }
  g.turn = next(g, seat);
  return null;
}
function end(g, out) {
  g.phase = 'over';
  g.out = out;
  const best = Math.max(...g.order.map(s => g.scores[s]));
  g.winners = g.order.filter(s => g.scores[s] === best);
  return null;
}

// Computer: every single-tile spot, then grow the best ones along their line.
export function spots(board) {
  const keys = Object.keys(board);
  if (!keys.length) return [[0, 0]];
  const out = new Set();
  for (const k of keys) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (board[K(x + dx, y + dy)] == null) out.add(K(x + dx, y + dy)); }
  return [...out].map(k => k.split(',').map(Number));
}
export function botAction(g, s) {
  const h = g.hands[s];
  let best = null;
  for (const [x, y] of spots(g.board)) for (const t of h) {
    const r = checkMove(g.board, [{ x, y, t }]);
    if (typeof r === 'string') continue;
    let places = [{ x, y, t }], sc = r.score;
    // Try to extend in both directions along each axis.
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      let cur = places.slice(), curSc = sc;
      for (let step = 1; step < 6; step++) for (const sign of [1, -1]) {
        let nx = x, ny = y;
        while (cur.some(p => p.x === nx && p.y === ny) || g.board[K(nx, ny)] != null) { nx += dx * sign; ny += dy * sign; }
        for (const t2 of h) {
          if (cur.some(p => p.t === t2)) continue;
          const tryP = [...cur, { x: nx, y: ny, t: t2 }];
          const r2 = checkMove(g.board, tryP);
          if (typeof r2 !== 'string' && r2.score > curSc) { cur = tryP; curSc = r2.score; break; }
        }
      }
      if (curSc > sc) { places = cur; sc = curSc; }
    }
    if (!best || sc > best.sc) best = { sc, places };
  }
  if (best) return { type: 'place', places: best.places };
  return { type: 'swap', ids: h.slice(0, Math.min(h.length, g.bag.length)) };
}

export function viewFor(g, seat) {
  return { phase: g.phase, turn: g.turn, order: g.order, hand: g.hands[seat] || [], board: g.board, bag: g.bag.length, scores: g.scores, last: g.last, winners: g.winners || null, out: g.out ?? null, moveId: g.moveId };
}
