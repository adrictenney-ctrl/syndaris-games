// Homestead: settle a frontier island of nineteen hexes. Roll for resources, build roads,
// cabins and manors, trade with the bank, the harbours and each other, buy charters — and race
// to 10 points. Our own names and look: Timber, Clay, Fleece, Wheat and Stone; cabins and manors;
// the Bandit; Rangers, Monuments, Surveyors, Bounty and Embargo charters.

export const RES = ['timber', 'clay', 'fleece', 'wheat', 'stone'];
export const RES_NAME = { timber: 'Timber', clay: 'Clay', fleece: 'Fleece', wheat: 'Wheat', stone: 'Stone' };
export const RES_ICON = { timber: '🌲', clay: '🧱', fleece: '🐑', wheat: '🌾', stone: '⛰' };
export const COST = {
  road: { timber: 1, clay: 1 },
  cabin: { timber: 1, clay: 1, fleece: 1, wheat: 1 },
  manor: { wheat: 2, stone: 3 },
  charter: { fleece: 1, wheat: 1, stone: 1 },
};
export const CHARTERS = {
  ranger: { name: 'Ranger', text: 'Move the Bandit and take a card from someone next to it.' },
  monument: { name: 'Monument', text: 'Worth 1 point. Stays hidden until the game is won.' },
  surveyors: { name: 'Surveyors', text: 'Build two roads for free.' },
  bounty: { name: 'Bounty', text: 'Take any two resources from the bank.' },
  embargo: { name: 'Embargo', text: 'Name a resource: everyone hands you all of theirs.' },
};
export const LIMITS = { road: 15, cabin: 5, manor: 4 };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------------------------------------------------------------- the island's geometry

export const SIZE = 10;
export const HEXES = [];
for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= 2) HEXES.push({ q, r });
HEXES.forEach(h => { h.x = SIZE * Math.sqrt(3) * (h.q + h.r / 2); h.y = SIZE * 1.5 * h.r; });
export const VERTS = [], EDGES = [];
const vkey = (x, y) => `${Math.round(x * 10)},${Math.round(y * 10)}`;
const vmap = new Map();
HEXES.forEach((h, hi) => {
  h.verts = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (60 * k - 30);
    const x = h.x + SIZE * Math.cos(a), y = h.y + SIZE * Math.sin(a), key = vkey(x, y);
    if (!vmap.has(key)) { vmap.set(key, VERTS.length); VERTS.push({ x, y, hexes: [], edges: [] }); }
    const v = vmap.get(key);
    VERTS[v].hexes.push(hi);
    h.verts.push(v);
  }
});
const emap = new Map();
HEXES.forEach((h, hi) => {
  h.edges = [];
  for (let k = 0; k < 6; k++) {
    const a = h.verts[k], b = h.verts[(k + 1) % 6], key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!emap.has(key)) { emap.set(key, EDGES.length); EDGES.push({ a: Math.min(a, b), b: Math.max(a, b), hexes: [] }); VERTS[a].edges.push(EDGES.length - 1); VERTS[b].edges.push(EDGES.length - 1); }
    const e = emap.get(key);
    EDGES[e].hexes.push(hi);
    h.edges.push(e);
  }
});
export const vNeighbours = v => VERTS[v].edges.map(e => (EDGES[e].a === v ? EDGES[e].b : EDGES[e].a));
// Coastal edges, in order round the island, for placing harbours.
const COAST = EDGES.map((e, i) => i).filter(i => EDGES[i].hexes.length === 1)
  .sort((i, j) => { const m = k => Math.atan2((VERTS[EDGES[k].a].y + VERTS[EDGES[k].b].y) / 2, (VERTS[EDGES[k].a].x + VERTS[EDGES[k].b].x) / 2); return m(i) - m(j); });

// ---------------------------------------------------------------- setting up

function layout() {
  const kinds = shuffle([...Array(4).fill('timber'), ...Array(3).fill('clay'), ...Array(4).fill('fleece'), ...Array(4).fill('wheat'), ...Array(3).fill('stone'), 'badlands']);
  const nums = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  for (let tries = 0; tries < 400; tries++) {
    const ns = shuffle(nums.slice());
    const tiles = kinds.map(k => ({ kind: k, num: k === 'badlands' ? null : ns.pop() }));
    // No two red numbers (6 and 8) side by side.
    const red = tiles.map((t, i) => (t.num === 6 || t.num === 8 ? i : -1)).filter(i => i >= 0);
    const touching = (i, j) => HEXES[i].verts.some(v => HEXES[j].verts.includes(v));
    if (red.every(i => red.every(j => i === j || !touching(i, j)))) return tiles;
  }
  return kinds.map(k => ({ kind: k, num: null }));
}

export function createGame(settings, players) {
  const g = { settings: { target: 10, ...settings }, seats: players.map(p => !!p), annId: 0, logId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.tiles = layout();
  g.bandit = g.tiles.findIndex(t => t.kind === 'badlands');
  const types = shuffle(['any', 'any', 'any', 'any', ...RES]);
  g.ports = types.map((type, k) => ({ type, edge: COAST[Math.round((k * COAST.length) / 9 + 1) % COAST.length] }));
  g.vOwner = VERTS.map(() => null); g.vLevel = VERTS.map(() => 0);   // 1 cabin, 2 manor
  g.eOwner = EDGES.map(() => null);
  g.hand = g.seats.map(() => Object.fromEntries(RES.map(r => [r, 0])));
  g.charters = g.seats.map(() => []);    // { kind, fresh }
  g.played = g.seats.map(() => 0);       // rangers played
  g.deck = shuffle([...Array(14).fill('ranger'), ...Array(5).fill('monument'), ...Array(2).fill('surveyors'), ...Array(2).fill('bounty'), ...Array(2).fill('embargo')]);
  g.longest = null; g.largest = null;
  // Setup: snake order, cabin then road each time.
  g.setup = [...g.order, ...g.order.slice().reverse()];
  g.setupIdx = 0;
  g.phase = 'setup'; g.step = 'cabin';
  g.turn = g.setup[0];
  g.dice = null; g.rollId = 0;
  g.trade = null; g.winner = null;
  return g;
}

function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }
function log(g, seat, text) { g.log.push({ id: ++g.logId, seat, text }); if (g.log.length > 8) g.log.shift(); }
const count = (g, seat, lvl) => g.vLevel.filter((l, v) => g.vOwner[v] === seat && l === lvl).length;
const roads = (g, seat) => g.eOwner.filter(o => o === seat).length;
export const total = h => RES.reduce((a, r) => a + h[r], 0);
const canPay = (h, cost) => Object.entries(cost).every(([r, n]) => h[r] >= n);
const pay = (h, cost) => Object.entries(cost).forEach(([r, n]) => { h[r] -= n; });

export function points(g, seat, hidden = true) {
  let p = count(g, seat, 1) + 2 * count(g, seat, 2);
  if (g.longest === seat) p += 2;
  if (g.largest === seat) p += 2;
  if (hidden) p += g.charters[seat].filter(c => c.kind === 'monument').length;
  return p;
}

// ---------------------------------------------------------------- placement rules

export function cabinSpots(g, seat, setup) {
  return VERTS.map((_, v) => v).filter(v => {
    if (g.vOwner[v] != null) return false;
    if (vNeighbours(v).some(n => g.vOwner[n] != null)) return false;   // distance rule
    return setup || VERTS[v].edges.some(e => g.eOwner[e] === seat);
  });
}
export function roadSpots(g, seat, fromVertex = null) {
  return EDGES.map((_, e) => e).filter(e => {
    if (g.eOwner[e] != null) return false;
    const { a, b } = EDGES[e];
    if (fromVertex != null) return a === fromVertex || b === fromVertex;
    return [a, b].some(v => g.vOwner[v] === seat || (g.vOwner[v] == null && VERTS[v].edges.some(x => x !== e && g.eOwner[x] === seat)));
  });
}
export const manorSpots = (g, seat) => VERTS.map((_, v) => v).filter(v => g.vOwner[v] === seat && g.vLevel[v] === 1);

// Longest continuous road, not running through someone else's buildings.
export function longestRoad(g, seat) {
  const mine = EDGES.map((_, e) => e).filter(e => g.eOwner[e] === seat);
  let best = 0;
  const used = new Set();
  const walk = (v, len) => {
    best = Math.max(best, len);
    if (len > 0 && g.vOwner[v] != null && g.vOwner[v] !== seat) return;
    for (const e of VERTS[v].edges) {
      if (used.has(e) || g.eOwner[e] !== seat) continue;
      used.add(e);
      walk(EDGES[e].a === v ? EDGES[e].b : EDGES[e].a, len + 1);
      used.delete(e);
    }
  };
  for (const e of mine) { used.add(e); walk(EDGES[e].a, 1); walk(EDGES[e].b, 1); used.delete(e); }
  return best;
}

function updateLongest(g) {
  const lens = Object.fromEntries(g.order.map(s => [s, longestRoad(g, s)]));
  const holder = g.longest;
  const best = Math.max(...Object.values(lens));
  const tops = g.order.filter(s => lens[s] === best);
  let next = null;
  if (best >= 5) {
    if (holder != null && tops.includes(holder)) next = holder;        // a tie keeps it where it is
    else if (tops.length === 1) next = tops[0];
  }
  if (next !== holder && next != null) announce(g, next, "Longest Road!");
  g.longest = next;
  g.roadLens = g.order.map(s => lens[s]);
}

function checkWin(g, seat) {
  if (g.phase === 'play' && points(g, seat) >= g.settings.target) { g.phase = 'over'; g.winner = seat; announce(g, seat, 'Wins!'); }
}

function produce(g, n) {
  const got = {};
  g.tiles.forEach((t, hi) => {
    if (t.num !== n || hi === g.bandit) return;
    for (const v of HEXES[hi].verts) {
      const s = g.vOwner[v];
      if (s == null) continue;
      g.hand[s][t.kind] += g.vLevel[v];
      got[s] = (got[s] || 0) + g.vLevel[v];
    }
  });
  return got;
}

export function portRates(g, seat) {
  const rate = Object.fromEntries(RES.map(r => [r, 4]));
  for (const p of g.ports) {
    const e = EDGES[p.edge];
    if (g.vOwner[e.a] !== seat && g.vOwner[e.b] !== seat) continue;
    if (p.type === 'any') RES.forEach(r => { rate[r] = Math.min(rate[r], 3); });
    else rate[p.type] = 2;
  }
  return rate;
}

const nextSeat = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];

function endTurn(g) {
  g.charters[g.turn].forEach(c => { c.fresh = false; });
  g.turn = nextSeat(g, g.turn);
  g.step = 'roll';
  g.dice = null;
  g.trade = null;
  g.playedThisTurn = false;
  g.free = 0;
}

// ---------------------------------------------------------------- actions

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  // Discarding after a 7 happens for everyone at once.
  if (a.type === 'discard') {
    const need = g.discards?.[seat];
    if (!need) return 'Nothing to discard';
    const give = a.give || {};
    const n = RES.reduce((x, r) => x + (give[r] | 0), 0);
    if (n !== need || RES.some(r => (give[r] | 0) > g.hand[seat][r] || (give[r] | 0) < 0)) return `Discard exactly ${need}`;
    RES.forEach(r => { g.hand[seat][r] -= give[r] | 0; });
    delete g.discards[seat];
    if (!Object.keys(g.discards).length) { g.discards = null; g.step = 'bandit'; }
    return null;
  }
  if (a.type === 'answer') {
    const t = g.trade;
    if (!t || t.to !== seat) return 'No offer for you';
    if (a.yes) {
      if (!canPay(g.hand[t.from], t.give) || !canPay(g.hand[seat], t.get)) { g.trade = null; return 'Someone can no longer afford it'; }
      pay(g.hand[t.from], t.give); pay(g.hand[seat], t.get);
      Object.entries(t.give).forEach(([r, n]) => { g.hand[seat][r] += n; });
      Object.entries(t.get).forEach(([r, n]) => { g.hand[t.from][r] += n; });
      announce(g, seat, 'Deal!');
    } else announce(g, seat, 'No deal');
    g.trade = null;
    return null;
  }
  if (seat !== g.turn) return "It isn't your turn";

  if (g.phase === 'setup') {
    if (g.step === 'cabin' && a.type === 'cabin') {
      if (!cabinSpots(g, seat, true).includes(a.v)) return "You can't build there";
      g.vOwner[a.v] = seat; g.vLevel[a.v] = 1; g.lastCabin = a.v;
      // Second round of setup: collect from the hexes around this cabin.
      if (g.setupIdx >= g.order.length) VERTS[a.v].hexes.forEach(hi => { const k = g.tiles[hi].kind; if (k !== 'badlands') g.hand[seat][k]++; });
      g.step = 'road';
      return null;
    }
    if (g.step === 'road' && a.type === 'road') {
      if (!roadSpots(g, seat, g.lastCabin).includes(a.e)) return 'Build the road next to the cabin you just placed';
      g.eOwner[a.e] = seat;
      g.setupIdx++;
      if (g.setupIdx >= g.setup.length) { g.phase = 'play'; g.turn = g.order[0]; g.step = 'roll'; }
      else { g.turn = g.setup[g.setupIdx]; g.step = 'cabin'; }
      return null;
    }
    return g.step === 'cabin' ? 'Place a cabin' : 'Place a road';
  }

  if (a.type === 'play') return playCharter(g, seat, a);
  if (g.step === 'roll') {
    if (a.type !== 'roll') return 'Roll first (or play a Ranger)';
    const d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    g.dice = d; g.rollId++;
    const n = d[0] + d[1];
    if (n === 7) {
      g.discards = {};
      g.order.forEach(s => { const t = total(g.hand[s]); if (t > 7) g.discards[s] = Math.floor(t / 2); });
      if (!Object.keys(g.discards).length) { g.discards = null; g.step = 'bandit'; } else g.step = 'discard';
      announce(g, seat, 'Seven — the Bandit!');
    } else {
      produce(g, n);
      g.step = 'main';
    }
    return null;
  }
  if (g.step === 'discard') return 'Waiting for players to discard';
  if (g.step === 'bandit') {
    if (a.type !== 'bandit') return 'Move the Bandit';
    if (!(a.hex >= 0 && a.hex < HEXES.length) || a.hex === g.bandit) return 'Move the Bandit to a different hex';
    g.bandit = a.hex;
    const victims = [...new Set(HEXES[a.hex].verts.map(v => g.vOwner[v]).filter(s => s != null && s !== seat && total(g.hand[s]) > 0))];
    if (victims.length === 0) { g.step = g.afterBandit || 'main'; g.afterBandit = null; return null; }
    if (victims.length === 1) return steal(g, seat, victims[0]);
    g.victims = victims;
    g.step = 'steal';
    return null;
  }
  if (g.step === 'steal') {
    if (a.type !== 'steal' || !g.victims.includes(a.from)) return 'Pick who to take from';
    return steal(g, seat, a.from);
  }
  // Main phase: build, trade, end.
  if (a.type === 'road') {
    if (!roadSpots(g, seat).includes(a.e)) return "You can't build a road there";
    if (roads(g, seat) >= LIMITS.road) return 'No roads left';
    if (g.free > 0) g.free--;
    else { if (!canPay(g.hand[seat], COST.road)) return 'A road costs Timber + Clay'; pay(g.hand[seat], COST.road); }
    g.eOwner[a.e] = seat;
    updateLongest(g); checkWin(g, seat);
    return null;
  }
  if (a.type === 'cabin') {
    if (!cabinSpots(g, seat, false).includes(a.v)) return 'Cabins go on your roads, two steps from any other building';
    if (count(g, seat, 1) >= LIMITS.cabin) return 'No cabins left — upgrade one to a manor';
    if (!canPay(g.hand[seat], COST.cabin)) return 'A cabin costs Timber, Clay, Fleece and Wheat';
    pay(g.hand[seat], COST.cabin);
    g.vOwner[a.v] = seat; g.vLevel[a.v] = 1;
    log(g, seat, 'built a cabin');
    updateLongest(g); checkWin(g, seat);
    return null;
  }
  if (a.type === 'manor') {
    if (!manorSpots(g, seat).includes(a.v)) return 'Upgrade one of your cabins';
    if (count(g, seat, 2) >= LIMITS.manor) return 'No manors left';
    if (!canPay(g.hand[seat], COST.manor)) return 'A manor costs 2 Wheat and 3 Stone';
    pay(g.hand[seat], COST.manor);
    g.vLevel[a.v] = 2;
    log(g, seat, 'raised a manor');
    checkWin(g, seat);
    return null;
  }
  if (a.type === 'charter') {
    if (!g.deck.length) return 'No charters left';
    if (!canPay(g.hand[seat], COST.charter)) return 'A charter costs Fleece, Wheat and Stone';
    pay(g.hand[seat], COST.charter);
    g.charters[seat].push({ kind: g.deck.pop(), fresh: true });
    log(g, seat, 'bought a charter');
    checkWin(g, seat);
    return null;
  }
  if (a.type === 'bank') {
    const rates = portRates(g, seat), give = a.give, get = a.get;
    if (!RES.includes(give) || !RES.includes(get) || give === get) return 'Pick what to give and what to get';
    if (g.hand[seat][give] < rates[give]) return `You need ${rates[give]} ${RES_NAME[give]}`;
    g.hand[seat][give] -= rates[give];
    g.hand[seat][get]++;
    return null;
  }
  if (a.type === 'offer') {
    if (g.trade) return 'An offer is already out';
    const give = clean(a.give), get = clean(a.get);
    if (!Object.keys(give).length || !Object.keys(get).length) return 'Offer something and ask for something';
    if (!canPay(g.hand[seat], give)) return "You don't have that to give";
    if (!g.order.includes(a.to) || a.to === seat) return 'Pick a player';
    g.trade = { from: seat, to: a.to, give, get, id: (g.trade?.id || 0) + 1 };
    announce(g, seat, 'Offers a trade');
    return null;
  }
  if (a.type === 'cancelOffer') { g.trade = null; return null; }
  if (a.type === 'end') {
    if (g.free) g.free = 0;
    endTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

const clean = o => Object.fromEntries(Object.entries(o || {}).filter(([r, n]) => RES.includes(r) && (n | 0) > 0).map(([r, n]) => [r, n | 0]));

function steal(g, seat, from) {
  const pool = RES.flatMap(r => Array(g.hand[from][r]).fill(r));
  if (pool.length) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    g.hand[from][r]--; g.hand[seat][r]++;
    g.stolen = { from, to: seat, res: r, id: (g.stolen?.id || 0) + 1 };
  }
  announce(g, seat, 'Takes a card');
  g.victims = null;
  g.step = g.afterBandit || 'main';
  g.afterBandit = null;
  return null;
}

function playCharter(g, seat, a) {
  if (g.playedThisTurn) return 'One charter per turn';
  const i = g.charters[seat].findIndex(c => c.kind === a.kind && !c.fresh);
  if (i < 0) return a.kind === 'monument' ? 'Monuments count by themselves' : 'You need a charter bought before this turn';
  if (a.kind === 'monument') return 'Monuments count by themselves';
  if (!['roll', 'main'].includes(g.step)) return 'Not now';
  g.charters[seat].splice(i, 1);
  g.playedThisTurn = true;
  announce(g, seat, CHARTERS[a.kind].name + '!');
  if (a.kind === 'ranger') {
    g.played[seat]++;
    const top = Math.max(...g.order.map(s => g.played[s]));
    if (g.played[seat] >= 3 && g.played[seat] === top && (g.largest == null || g.played[seat] > g.played[g.largest])) g.largest = seat;
    g.afterBandit = g.step;
    g.step = 'bandit';
  } else if (a.kind === 'surveyors') g.free = 2;
  else if (a.kind === 'bounty') { (a.res || []).slice(0, 2).forEach(r => { if (RES.includes(r)) g.hand[seat][r]++; }); }
  else if (a.kind === 'embargo') {
    const r = a.res?.[0];
    if (RES.includes(r)) g.order.forEach(s => { if (s !== seat) { g.hand[seat][r] += g.hand[s][r]; g.hand[s][r] = 0; } });
  }
  checkWin(g, seat);
  return null;
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, step: g.step, turn: g.turn, order: g.order, tiles: g.tiles, bandit: g.bandit, ports: g.ports,
    vOwner: g.vOwner, vLevel: g.vLevel, eOwner: g.eOwner, dice: g.dice, rollId: g.rollId,
    hand: g.hand[seat] || {}, charters: g.charters[seat] || [], handCounts: g.hand.map(h => (h ? total(h) : 0)),
    points: g.order.map(s => points(g, s, s === seat || g.phase === 'over')), longest: g.longest, largest: g.largest, roadLens: g.roadLens || [],
    discard: g.discards?.[seat] || 0, victims: g.turn === seat ? g.victims : null, free: g.turn === seat ? g.free || 0 : 0,
    trade: g.trade, rates: g.hand[seat] ? portRates(g, seat) : null, log: g.log, winner: g.winner, deck: g.deck.length,
    lastCabin: g.lastCabin, playedThisTurn: !!g.playedThisTurn, stolen: g.stolen && (g.stolen.from === seat || g.stolen.to === seat) ? g.stolen : null,
  };
}

// ---------------------------------------------------------------- bots

const PIPS = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
function vertexValue(g, v) {
  let s = 0;
  const kinds = new Set();
  for (const hi of VERTS[v].hexes) { const t = g.tiles[hi]; if (t.num) { s += PIPS[t.num]; kinds.add(t.kind); } }
  return s + kinds.size * 1.5 + (g.ports.some(p => EDGES[p.edge].a === v || EDGES[p.edge].b === v) ? 1.5 : 0);
}
function goal(g, seat) {
  if (manorSpots(g, seat).length && count(g, seat, 2) < LIMITS.manor) return 'manor';
  if (cabinSpots(g, seat, false).length && count(g, seat, 1) < LIMITS.cabin) return 'cabin';
  if (roads(g, seat) < LIMITS.road) return 'road';
  return 'charter';
}
function bestRoad(g, seat, spots) {
  let best = spots[0], bs = -1;
  for (const e of spots) {
    for (const v of [EDGES[e].a, EDGES[e].b]) {
      const free = g.vOwner[v] == null && !vNeighbours(v).some(n => g.vOwner[n] != null);
      const s = vertexValue(g, v) * (free ? 1 : 0.4) + Math.random() * 0.5;
      if (s > bs) { bs = s; best = e; }
    }
  }
  return best;
}

export function botAction(g, seat) {
  const h = g.hand[seat];
  if (g.discards?.[seat]) {
    const give = Object.fromEntries(RES.map(r => [r, 0]));
    for (let n = g.discards[seat]; n > 0; n--) { const r = RES.filter(x => h[x] - give[x] > 0).sort((a, b) => (h[b] - give[b]) - (h[a] - give[a]))[0]; give[r]++; }
    return { type: 'discard', give };
  }
  if (g.trade && g.trade.to === seat) {
    const want = COST[goal(g, seat)];
    const gain = Object.entries(g.trade.give).reduce((a, [r, n]) => a + n * ((want[r] || 0) > h[r] ? 2 : 0.5), 0);
    const lose = Object.entries(g.trade.get).reduce((a, [r, n]) => a + n * ((want[r] || 0) >= h[r] ? 2 : 0.6), 0);
    return { type: 'answer', yes: gain > lose && canPay(h, g.trade.get) };
  }
  if (seat !== g.turn || g.phase === 'over') return null;
  if (g.phase === 'setup') {
    if (g.step === 'cabin') return { type: 'cabin', v: cabinSpots(g, seat, true).sort((a, b) => vertexValue(g, b) - vertexValue(g, a))[0] };
    return { type: 'road', e: bestRoad(g, seat, roadSpots(g, seat, g.lastCabin)) };
  }
  const ranger = g.charters[seat].find(c => c.kind === 'ranger' && !c.fresh);
  if (g.step === 'roll') {
    if (ranger && !g.playedThisTurn && HEXES[g.bandit].verts.some(v => g.vOwner[v] === seat)) return { type: 'play', kind: 'ranger' };
    return { type: 'roll' };
  }
  if (g.step === 'discard') return null;
  if (g.step === 'bandit') {
    let best = null, bs = -Infinity;
    g.tiles.forEach((t, hi) => {
      if (hi === g.bandit) return;
      const owners = HEXES[hi].verts.map(v => g.vOwner[v]);
      if (owners.includes(seat)) return;
      const s = owners.filter(o => o != null).length * (PIPS[t.num] || 0) + owners.filter(o => o != null && points(g, o, false) >= 6).length * 3;
      if (s > bs) { bs = s; best = hi; }
    });
    return { type: 'bandit', hex: best ?? (g.bandit + 1) % HEXES.length };
  }
  if (g.step === 'steal') return { type: 'steal', from: g.victims.slice().sort((a, b) => total(g.hand[b]) - total(g.hand[a]))[0] };
  // Main phase.
  if (g.free > 0) { const rs = roadSpots(g, seat); return rs.length ? { type: 'road', e: bestRoad(g, seat, rs) } : { type: 'end' }; }
  if (!g.playedThisTurn) {
    const ok = k => g.charters[seat].some(c => c.kind === k && !c.fresh);
    const need = COST[goal(g, seat)];
    const missing = RES.filter(r => (need[r] || 0) > h[r]);
    if (ok('bounty') && missing.length) return { type: 'play', kind: 'bounty', res: [missing[0], missing[1] || missing[0]] };
    if (ok('embargo') && missing.length) return { type: 'play', kind: 'embargo', res: [missing[0]] };
    if (ok('surveyors') && roadSpots(g, seat).length) return { type: 'play', kind: 'surveyors' };
    if (ranger && HEXES[g.bandit].verts.some(v => g.vOwner[v] === seat)) return { type: 'play', kind: 'ranger' };
  }
  const ms = manorSpots(g, seat);
  if (ms.length && canPay(h, COST.manor) && count(g, seat, 2) < LIMITS.manor) return { type: 'manor', v: ms.sort((a, b) => vertexValue(g, b) - vertexValue(g, a))[0] };
  const cs = cabinSpots(g, seat, false);
  if (cs.length && canPay(h, COST.cabin) && count(g, seat, 1) < LIMITS.cabin) return { type: 'cabin', v: cs.sort((a, b) => vertexValue(g, b) - vertexValue(g, a))[0] };
  const rs = roadSpots(g, seat);
  if (!cs.length && rs.length && canPay(h, COST.road) && roads(g, seat) < LIMITS.road) return { type: 'road', e: bestRoad(g, seat, rs) };
  if (canPay(h, COST.charter) && g.deck.length && (goal(g, seat) === 'charter' || h.stone > 3 || (h.fleece > 1 && h.wheat > 1 && h.stone > 1))) return { type: 'charter' };
  // Trade surplus at the bank/harbour for what the goal still needs.
  const need = COST[goal(g, seat)], rates = portRates(g, seat);
  const missing = RES.filter(r => (need[r] || 0) > h[r]);
  if (missing.length) {
    const spare = RES.filter(r => h[r] - (need[r] || 0) >= rates[r]).sort((a, b) => h[b] - h[a])[0];
    if (spare) return { type: 'bank', give: spare, get: missing[0] };
  }
  return { type: 'end' };
}
