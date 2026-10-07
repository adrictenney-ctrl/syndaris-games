// Warfront: a game of territory and dice on our own map — thirty territories across six regions
// of an island world, joined by land borders and sea lanes. Each turn: reinforce (territories ÷ 3,
// at least 3, plus region bonuses and traded-in supply cards), attack neighbours with dice
// (up to 3 against up to 2, highest dice compared, defender wins ties), then make one fortifying
// move. Take a territory on your turn and you earn a supply card. Conquer everything to win —
// or, with a round limit, hold the most territory.

export const REGIONS = [
  { name: 'Northreach', bonus: 3, color: '#7aa0b8' },
  { name: 'Emberlands', bonus: 3, color: '#c0714f' },
  { name: 'Verdant Isles', bonus: 2, color: '#6f9a63' },
  { name: 'Heartland', bonus: 5, color: '#c9a24a' },
  { name: 'Dunesea', bonus: 3, color: '#c79a6a' },
  { name: 'Southmarch', bonus: 3, color: '#7f6aa0' },
];
const T = (name, c, r, region) => ({ name, c, r, region });
export const MAP = [
  T('Frostmark', 1, 0, 0), T('Whitecliff', 2, 0, 0), T('Hollowpine', 3, 0, 0), T('Glacier Bay', 1, 1, 0), T('Ravenhold', 2, 1, 0),
  T('Ashfall', 7, 0, 1), T('Cinderport', 8, 0, 1), T('Smoke Ridge', 6, 1, 1), T('Kilnmoor', 7, 1, 1), T('Brimstone', 8, 1, 1),
  T('Fernreach', 0, 3, 2), T('Mossgate', 1, 3, 2), T('Willowmere', 0, 4, 2), T('Reedwater', 1, 4, 2),
  T('Crossroads', 4, 2, 3), T('Highmarket', 5, 2, 3), T('Kingsfield', 3, 3, 3), T('Golden Vale', 4, 3, 3), T('Stonebridge', 5, 3, 3), T('Riverbend', 4, 4, 3),
  T('Sandspire', 8, 3, 4), T('Mirage', 9, 3, 4), T('Saltflat', 8, 4, 4), T('Oasis', 9, 4, 4), T('Sunken Gate', 9, 5, 4),
  T('Thornwood', 3, 6, 5), T('Marshlight', 4, 6, 5), T('Tidewatch', 5, 6, 5), T('Coral Coast', 4, 7, 5), T('Southport', 5, 7, 5),
];
const id = name => MAP.findIndex(t => t.name === name);
export const LANES = [
  ['Ravenhold', 'Crossroads'], ['Hollowpine', 'Smoke Ridge'], ['Glacier Bay', 'Mossgate'], ['Smoke Ridge', 'Highmarket'],
  ['Brimstone', 'Sandspire'], ['Mossgate', 'Kingsfield'], ['Reedwater', 'Thornwood'], ['Stonebridge', 'Sandspire'],
  ['Riverbend', 'Marshlight'], ['Sunken Gate', 'Tidewatch'],
].map(([a, b]) => [id(a), id(b)]);

// Hex neighbours on an odd-row-offset grid, plus the sea lanes.
function hexNeighbours(c, r) {
  const odd = r % 2;
  return odd ? [[c - 1, r], [c + 1, r], [c, r - 1], [c + 1, r - 1], [c, r + 1], [c + 1, r + 1]]
    : [[c - 1, r], [c + 1, r], [c - 1, r - 1], [c, r - 1], [c - 1, r + 1], [c, r + 1]];
}
export const ADJ = MAP.map((t, i) => {
  const out = new Set();
  for (const [c, r] of hexNeighbours(t.c, t.r)) { const j = MAP.findIndex(u => u.c === c && u.r === r); if (j >= 0) out.add(j); }
  LANES.forEach(([a, b]) => { if (a === i) out.add(b); if (b === i) out.add(a); });
  return [...out];
});

const START = { 2: 30, 3: 26, 4: 22, 5: 19, 6: 16 };
export const SYMBOLS = ['⚔', '🛡', '⚑'];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const roll = n => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a);

export function createGame(settings, players) {
  const g = { settings: { rounds: 0, ...settings }, seats: players.map(p => !!p), annId: 0, logId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.owner = Array(MAP.length).fill(null);
  g.armies = Array(MAP.length).fill(1);
  shuffle(MAP.map((_, i) => i)).forEach((t, k) => { g.owner[t] = g.order[k % g.order.length]; });
  // Spread each player's starting armies over their land at random.
  for (const s of g.order) {
    const mine = MAP.map((_, i) => i).filter(i => g.owner[i] === s);
    for (let k = mine.length; k < START[g.order.length]; k++) g.armies[mine[Math.floor(Math.random() * mine.length)]]++;
  }
  g.deck = shuffle([...Array(42)].map((_, k) => (k < 40 ? `${k % 3}.${k}` : `W.${k}`)));
  g.cards = g.seats.map(() => []);
  g.trades = 0;
  g.out = g.seats.map(() => false);
  g.turnIdx = 0; g.round = 1;
  g.log = [];
  startTurn(g);
  return g;
}

export const current = g => g.order[g.turnIdx];
const owned = (g, s) => MAP.map((_, i) => i).filter(i => g.owner[i] === s);
export function income(g, s) {
  const mine = owned(g, s);
  let n = Math.max(3, Math.floor(mine.length / 3));
  REGIONS.forEach((reg, k) => { if (MAP.every((t, i) => t.region !== k || g.owner[i] === s)) n += reg.bonus; });
  return n;
}
export const tradeValue = k => (k < 5 ? 4 + k * 2 : 15 + (k - 5) * 5);
function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }
function log(g, seat, text) { g.log.push({ id: ++g.logId, seat, text }); if (g.log.length > 8) g.log.shift(); }

function startTurn(g) {
  const s = current(g);
  g.step = 'reinforce';
  g.reserve = income(g, s);
  g.conquered = false;
  g.battle = null;
  g.occupy = null;
  g.fortified = false;
}

export const isSet = cards => {
  if (cards.length !== 3) return false;
  const kinds = cards.map(c => c.split('.')[0]);
  const wild = kinds.filter(k => k === 'W').length;
  const plain = kinds.filter(k => k !== 'W');
  return wild > 0 || new Set(plain).size === 1 || new Set(plain).size === 3;
};

function nextTurn(g) {
  const s = current(g);
  if (g.conquered && g.deck.length) g.cards[s].push(g.deck.pop());
  for (let k = 1; k <= g.order.length; k++) {
    const idx = (g.turnIdx + k) % g.order.length;
    if (g.out[g.order[idx]]) continue;
    if (idx <= g.turnIdx) g.round++;
    g.turnIdx = idx;
    break;
  }
  if (g.settings.rounds && g.round > g.settings.rounds) {
    g.step = 'over';
    const live = g.order.filter(x => !g.out[x]);
    const land = x => owned(g, x).length, troops = x => owned(g, x).reduce((a, i) => a + g.armies[i], 0);
    g.winner = live.sort((a, b) => land(b) - land(a) || troops(b) - troops(a))[0];
    return;
  }
  startTurn(g);
}

// Can troops travel from a to b through the player's own territory?
export function connected(g, a, b) {
  const s = g.owner[a];
  const seen = new Set([a]), q = [a];
  while (q.length) {
    const x = q.shift();
    if (x === b) return true;
    for (const y of ADJ[x]) if (!seen.has(y) && g.owner[y] === s) { seen.add(y); q.push(y); }
  }
  return false;
}

function fight(g, from, to) {
  const a = roll(Math.min(3, g.armies[from] - 1)), d = roll(Math.min(2, g.armies[to]));
  let al = 0, dl = 0;
  for (let k = 0; k < Math.min(a.length, d.length); k++) { if (a[k] > d[k]) dl++; else al++; }
  g.armies[from] -= al;
  g.armies[to] -= dl;
  return { a, d, al, dl };
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.step === 'over') return 'The war is over';
  if (seat !== current(g)) return "It isn't your turn";
  if (a.type === 'trade') {
    const cs = a.cards || [];
    if (!cs.every(c => g.cards[seat].includes(c)) || !isSet(cs)) return 'Trade three of a kind, one of each, or with a wild';
    if (g.step !== 'reinforce') return 'Trade cards at the start of your turn';
    g.cards[seat] = g.cards[seat].filter(c => !cs.includes(c));
    const bonus = tradeValue(g.trades++);
    g.reserve += bonus;
    g.deck.unshift(...cs);
    announce(g, seat, `Trades cards for ${bonus}`);
    return null;
  }
  if (a.type === 'place') {
    if (g.step !== 'reinforce') return 'Reinforce at the start of your turn';
    if (g.cards[seat].length >= 5) return 'You hold 5 cards — trade a set first';
    const t = a.t, n = Math.max(1, Math.min(a.n | 0 || 1, g.reserve));
    if (g.owner[t] !== seat) return 'Place troops on your own territory';
    g.armies[t] += n;
    g.reserve -= n;
    if (!g.reserve) g.step = 'attack';
    return null;
  }
  if (a.type === 'attack') {
    if (g.step !== 'attack') return g.step === 'reinforce' ? 'Place all your troops first' : 'Attacking is over for this turn';
    if (g.occupy) return 'Move troops into your new territory first';
    const { from, to } = a;
    if (g.owner[from] !== seat || g.owner[to] === seat || !ADJ[from].includes(to)) return 'Attack a neighbouring enemy territory';
    if (g.armies[from] < 2) return 'You need at least 2 troops to attack';
    let r, rounds = 0;
    do { r = fight(g, from, to); rounds++; } while (a.blitz && g.armies[to] > 0 && g.armies[from] > 1);
    g.battle = { from, to, ...r, rounds, id: (g.battle?.id || 0) + 1 };
    if (g.armies[to] <= 0) {
      const loser = g.owner[to];
      g.owner[to] = seat;
      g.armies[to] = 0;
      g.conquered = true;
      g.occupy = { from, to, min: Math.min(r.a.length, g.armies[from] - 1), max: g.armies[from] - 1 };
      log(g, seat, `took ${MAP[to].name}`);
      announce(g, seat, `Takes ${MAP[to].name}!`);
      if (!owned(g, loser).length) {
        g.out[loser] = true;
        g.cards[seat].push(...g.cards[loser]);
        g.cards[loser] = [];
        log(g, seat, 'knocked a player out');
      }
      if (g.order.filter(s => !g.out[s]).length === 1) { g.armies[to] = g.armies[from] - 1; g.armies[from] = 1; g.step = 'over'; g.winner = seat; g.occupy = null; }
    }
    return null;
  }
  if (a.type === 'occupy') {
    const o = g.occupy;
    if (!o) return 'Nothing to move';
    const n = Math.max(o.min, Math.min(o.max, a.n | 0));
    g.armies[o.from] -= n;
    g.armies[o.to] += n;
    g.occupy = null;
    return null;
  }
  if (a.type === 'endAttack') {
    if (g.step !== 'attack' || g.occupy) return 'Not now';
    g.step = 'fortify';
    return null;
  }
  if (a.type === 'fortify') {
    if (g.step !== 'fortify') return 'Fortify after attacking';
    const { from, to } = a, n = a.n | 0;
    if (g.owner[from] !== seat || g.owner[to] !== seat || from === to) return 'Move between your own territories';
    if (!connected(g, from, to)) return 'Those territories are not connected through your land';
    if (n < 1 || n > g.armies[from] - 1) return 'Leave at least one troop behind';
    g.armies[from] -= n;
    g.armies[to] += n;
    log(g, seat, `fortified ${MAP[to].name}`);
    nextTurn(g);
    return null;
  }
  if (a.type === 'end') {
    if (g.step === 'reinforce') return 'Place all your troops first';
    if (g.occupy) return 'Move troops into your new territory first';
    nextTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

export function viewFor(g, seat) {
  return {
    step: g.step, turn: current(g), round: g.round, rounds: g.settings.rounds, owner: g.owner, armies: g.armies, reserve: g.reserve,
    battle: g.battle, occupy: g.occupy, out: g.out, order: g.order, cards: g.cards[seat] || [], cardCounts: g.cards.map(c => c.length),
    trades: g.trades, log: g.log, winner: g.winner ?? null, income: g.order.map(s => income(g, s)),
  };
}

// ---------------------------------------------------------------- bots

export function botAction(g, seat) {
  if (g.step === 'over') return null;
  const mine = owned(g, seat);
  const enemyNear = i => ADJ[i].filter(j => g.owner[j] !== seat);
  const threat = i => enemyNear(i).reduce((a, j) => a + g.armies[j], 0);
  if (g.step === 'reinforce') {
    const cs = g.cards[seat];
    if (cs.length >= 3) {
      for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) for (let c = b + 1; c < cs.length; c++) {
        const set = [cs[a], cs[b], cs[c]];
        if (isSet(set)) return { type: 'trade', cards: set };
      }
    }
    // Pile into the border territory in the region we're closest to owning.
    const regionScore = k => { const ts = MAP.map((t, i) => (t.region === k ? i : -1)).filter(i => i >= 0); return ts.filter(i => g.owner[i] === seat).length / ts.length; };
    const borders = mine.filter(i => enemyNear(i).length);
    const t = borders.sort((x, y) => regionScore(MAP[y].region) - regionScore(MAP[x].region) || threat(y) - threat(x))[0] ?? mine[0];
    return { type: 'place', t, n: g.reserve };
  }
  if (g.occupy) return { type: 'occupy', n: g.occupy.max - (enemyNear(g.occupy.from).length > 1 ? Math.floor(g.occupy.max / 3) : 0) };
  if (g.step === 'attack') {
    let best = null, bestS = 0;
    for (const f of mine) {
      if (g.armies[f] < 3) continue;
      for (const t of enemyNear(f)) {
        const s = g.armies[f] - g.armies[t] * 1.3;
        if (s > bestS) { bestS = s; best = { from: f, to: t }; }
      }
    }
    if (best && bestS >= 2) return { type: 'attack', ...best, blitz: true };
    return { type: 'endAttack' };
  }
  if (g.step === 'fortify') {
    const interior = mine.filter(i => !enemyNear(i).length && g.armies[i] > 1).sort((a, b) => g.armies[b] - g.armies[a])[0];
    if (interior != null) {
      const target = mine.filter(i => enemyNear(i).length && connected(g, interior, i)).sort((a, b) => threat(b) - threat(a))[0];
      if (target != null) return { type: 'fortify', from: interior, to: target, n: g.armies[interior] - 1 };
    }
    return { type: 'end' };
  }
  return { type: 'end' };
}
