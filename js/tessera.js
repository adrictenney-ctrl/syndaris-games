// Tessera: lay square tiles so their edge shapes join up, covering other players' gems as you
// go. Runs only on the table (host).
//
// Every tile is 2×2 cells. Some cells hold a gem in its owner's colour; the tile's outer edges
// carry half-shapes (a circle, square or triangle). On your turn play the top or the bottom tile
// of your deck, turned any way, so that at least one of its half-shapes meets the same
// half-shape on a tile already down — completing the shape. Tiles may overlap others (covering
// whatever is beneath) but at least one of the four cells must go on empty table. When every
// deck is empty, whoever has the most gems showing wins.

export const SYMS = ['c', 's', 't'];      // circle, square, triangle
const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const OPP = { N: 'S', E: 'W', S: 'N', W: 'E' };
const CW = { N: 'E', E: 'S', S: 'W', W: 'N' };
export const LIMIT = 9;                   // the table runs from -LIMIT to +LIMIT each way

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// A random tile: gems in its four cells, and a symbol (or nothing) on each of its eight outer
// edge segments, clockwise from the top-left: [0 N, 1 N, 1 E, 3 E, 3 S, 2 S, 2 W, 0 W].
function makeTile(owner, k) {
  const nGems = [1, 2, 2, 2, 3, 1, 2, 3][k % 8];
  const gems = shuffle([0, 1, 2, 3]).slice(0, nGems);
  const edges = Array.from({ length: 8 }, () => (Math.random() < 0.62 ? SYMS[Math.floor(Math.random() * 3)] : null));
  if (edges.filter(Boolean).length < 3) edges[Math.floor(Math.random() * 8)] = SYMS[k % 3];
  return { owner, gems: [0, 1, 2, 3].map(i => gems.includes(i)), edges };
}

// The four cells of a tile placed with its top-left at (ax, ay), turned `rot` quarter turns.
export function cellsOf(tile, rot, ax, ay) {
  const e = tile.edges;
  let cells = [
    { lx: 0, ly: 0, i: 0, sides: { N: e[0], W: e[7] } },
    { lx: 1, ly: 0, i: 1, sides: { N: e[1], E: e[2] } },
    { lx: 1, ly: 1, i: 3, sides: { E: e[3], S: e[4] } },
    { lx: 0, ly: 1, i: 2, sides: { S: e[5], W: e[6] } },
  ];
  for (let r = 0; r < rot; r++) {
    cells = cells.map(c => ({ ...c, lx: 1 - c.ly, ly: c.lx, sides: Object.fromEntries(Object.entries(c.sides).map(([d, s]) => [CW[d], s])) }));
  }
  return cells.map(c => ({ x: ax + c.lx, y: ay + c.ly, gem: tile.gems[c.i], sides: c.sides, i: c.i }));
}

const K = (x, y) => `${x},${y}`;

export function createGame(settings, players) {
  const g = { settings: { tiles: 12, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.tiles = [];
  // The starting tile: no gems, a shape on every edge.
  g.tiles.push({ owner: -1, gems: [false, false, false, false], edges: ['c', 's', 't', 'c', 's', 't', 'c', 's'] });
  g.placed = [{ t: 0, rot: 0, x: -1, y: -1 }];
  g.decks = g.seats.map(() => []);
  for (const s of g.order) for (let k = 0; k < g.settings.tiles; k++) { g.tiles.push(makeTile(s, k)); g.decks[s].push(g.tiles.length - 1); }
  for (const s of g.order) shuffle(g.decks[s]);
  rebuild(g);
  g.turn = g.order[Math.floor(Math.random() * g.order.length)];
  g.phase = 'play';
  return g;
}

// Which tile shows on each cell (the most recently placed one on top).
function rebuild(g) {
  g.top = {};
  g.placed.forEach((p, n) => { for (const c of cellsOf(g.tiles[p.t], p.rot, p.x, p.y)) g.top[K(c.x, c.y)] = { ...c, t: p.t, n }; });
}

export const visibleGems = g => {
  const out = g.seats.map(() => 0);
  for (const c of Object.values(g.top)) if (c.gem && g.tiles[c.t].owner >= 0) out[g.tiles[c.t].owner]++;
  return out;
};

// Is it legal to put this tile here? Returns how many shapes it completes (0 = not legal).
export function check(g, tileId, rot, ax, ay) {
  const cells = cellsOf(g.tiles[tileId], rot, ax, ay);
  let covered = 0, joins = 0;
  const mine = new Set(cells.map(c => K(c.x, c.y)));
  for (const c of cells) {
    if (Math.abs(c.x) > LIMIT || Math.abs(c.y) > LIMIT) return 0;
    if (g.top[K(c.x, c.y)]) covered++;
    for (const [d, sym] of Object.entries(c.sides)) {
      if (!sym) continue;
      const nx = c.x + DIRS[d][0], ny = c.y + DIRS[d][1];
      if (mine.has(K(nx, ny))) continue;
      const n = g.top[K(nx, ny)];
      if (n && n.sides[OPP[d]] === sym) joins++;
    }
  }
  return covered < 4 ? joins : 0;
}

// Every legal placement of a tile: [{ rot, x, y, joins }]
export function placements(g, tileId) {
  const keys = Object.keys(g.top).map(k => k.split(',').map(Number));
  const xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
  const out = [];
  for (let rot = 0; rot < 4; rot++) {
    for (let x = Math.min(...xs) - 2; x <= Math.max(...xs) + 1; x++) {
      for (let y = Math.min(...ys) - 2; y <= Math.max(...ys) + 1; y++) {
        const j = check(g, tileId, rot, x, y);
        if (j) out.push({ rot, x, y, joins: j });
      }
    }
  }
  return out;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const current = g => (g.phase === 'over' ? -1 : g.turn);
// The two tiles a player may choose from: the top and the bottom of their deck.
export const choices = (g, s) => { const d = g.decks[s]; return d.length ? (d.length > 1 ? [d[d.length - 1], d[0]] : [d[0]]) : []; };

function nextTurn(g) {
  g.moveId++;
  if (g.order.every(s => !g.decks[s].length)) return finish(g);
  let i = g.order.indexOf(g.turn);
  for (let k = 0; k < g.order.length; k++) {
    i = (i + 1) % g.order.length;
    if (g.decks[g.order[i]].length) { g.turn = g.order[i]; return; }
  }
}

function finish(g) {
  g.phase = 'over';
  const v = visibleGems(g);
  const best = Math.max(...g.order.map(s => v[s]));
  g.winners = g.order.filter(s => v[s] === best);
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (seat !== g.turn) return "It isn't your turn";
  const opts = choices(g, seat);
  if (a.type === 'pass') {
    if (opts.some(t => placements(g, t).length)) return 'One of your tiles still fits somewhere';
    g.decks[seat].pop();
    announce(g, seat, 'No fit · tile discarded');
    nextTurn(g);
    return null;
  }
  if (a.type !== 'place') return 'Place a tile';
  if (!opts.includes(a.tile)) return 'Play the top or bottom tile of your deck';
  const rot = ((a.rot | 0) % 4 + 4) % 4;
  const joins = check(g, a.tile, rot, a.x | 0, a.y | 0);
  if (!joins) return 'It has to complete at least one shape — and can\'t sit wholly on top of other tiles';
  const before = visibleGems(g);
  const d = g.decks[seat];
  d.splice(d.indexOf(a.tile), 1);
  g.placed.push({ t: a.tile, rot, x: a.x | 0, y: a.y | 0 });
  rebuild(g);
  const after = visibleGems(g);
  const hidden = g.order.filter(s => s !== seat).reduce((acc, s) => acc + Math.max(0, before[s] - after[s]), 0);
  g.last = { seat, tile: a.tile, rot, x: a.x | 0, y: a.y | 0, joins, hidden, id: g.moveId + 1 };
  announce(g, seat, hidden ? `Covers ${hidden} gem${hidden > 1 ? 's' : ''}!` : joins > 1 ? `${joins} shapes joined` : 'Placed');
  nextTurn(g);
  return null;
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, order: g.order, placed: g.placed, tiles: g.tiles,
    left: g.decks.map(d => d.length), gems: visibleGems(g), last: g.last || null, winners: g.winners || [], moveId: g.moveId,
    choices: g.order.includes(seat) ? choices(g, seat) : [],
    legal: g.turn === seat && g.phase === 'play' ? Object.fromEntries(choices(g, seat).map(t => [t, placements(g, t)])) : null,
  };
}

// ---------------------------------------------------------------- bots

export function botAction(g, seat) {
  let best = null;
  const base = visibleGems(g);
  for (const t of choices(g, seat)) {
    for (const p of placements(g, t)) {
      g.placed.push({ t, rot: p.rot, x: p.x, y: p.y });
      rebuild(g);
      const v = visibleGems(g);
      g.placed.pop();
      rebuild(g);
      const gain = v[seat] - base[seat];
      const hurt = g.order.filter(s => s !== seat).reduce((a, s) => a + (base[s] - v[s]), 0);
      const score = gain * 1.2 + hurt + p.joins * 0.15 + Math.random() * 0.3;
      if (!best || score > best.score) best = { score, a: { type: 'place', tile: t, rot: p.rot, x: p.x, y: p.y } };
    }
  }
  rebuild(g);
  return best ? best.a : { type: 'pass' };
}
