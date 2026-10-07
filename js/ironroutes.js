// Iron Routes: collect coloured rail cards, claim routes between cities with matching sets, and
// complete your destination tickets. On your turn, do one thing: take two rail cards (from the
// five face up or blind off the deck — a face-up engine counts as both), claim a route, or draw
// tickets. Routes score by length; at the end, finished tickets add their value and unfinished
// ones subtract it, and the longest continuous line earns 10. The game ends a round after
// someone is down to two trains. Our own country, cities and cards.

export const COLORS = ['crimson', 'amber', 'jade', 'azure', 'violet', 'ivory', 'ebony', 'rose'];
export const HEX = { crimson: '#b8423d', amber: '#d29a3a', jade: '#3f8f6a', azure: '#3f73b8', violet: '#7a55a6', ivory: '#ece4d2', ebony: '#2a2a2e', rose: '#cf7f97', gray: '#8a8f96', loco: '#c9a24a' };
export const CITIES = [
  ['Northwatch', 12, 6], ['Glenhaven', 30, 5], ['Ironcrest', 50, 8], ['Frosthold', 72, 6], ['Seabright', 90, 10],
  ['Willowby', 6, 20], ['Marrowfield', 24, 19], ['Kingsport', 42, 22], ['Dunmore', 60, 20], ['Ravenmoor', 78, 22], ['Saltmarsh', 96, 26],
  ['Ashby', 14, 34], ['Brightwater', 32, 34], ['Coldspring', 50, 36], ['Highgate', 68, 36], ['Easthaven', 86, 40],
  ['Redfern', 6, 48], ['Millbrook', 24, 50], ['Stonecross', 42, 50], ['Thornbury', 60, 52], ['Larkspur', 78, 54], ['Southmere', 94, 56],
].map(([name, x, y]) => ({ name, x, y }));
const C = n => CITIES.findIndex(c => c.name === n);
const R = (a, b, len, color, twin) => ({ a: C(a), b: C(b), len, color, twin });
export const ROUTES = [
  R('Northwatch', 'Glenhaven', 3, 'crimson'), R('Northwatch', 'Willowby', 2, 'gray'), R('Northwatch', 'Marrowfield', 3, 'azure'),
  R('Glenhaven', 'Ironcrest', 3, 'amber'), R('Glenhaven', 'Marrowfield', 2, 'jade'), R('Glenhaven', 'Kingsport', 3, 'violet'),
  R('Ironcrest', 'Frosthold', 3, 'ebony'), R('Ironcrest', 'Kingsport', 2, 'gray', 1), R('Ironcrest', 'Kingsport', 2, 'rose', -1), R('Ironcrest', 'Dunmore', 2, 'ivory'),
  R('Frosthold', 'Seabright', 3, 'jade'), R('Frosthold', 'Dunmore', 3, 'crimson'), R('Frosthold', 'Ravenmoor', 3, 'gray'),
  R('Seabright', 'Ravenmoor', 2, 'amber'), R('Seabright', 'Saltmarsh', 2, 'violet'),
  R('Willowby', 'Marrowfield', 3, 'ebony'), R('Willowby', 'Ashby', 2, 'rose'), R('Willowby', 'Redfern', 5, 'azure'),
  R('Marrowfield', 'Kingsport', 3, 'ivory'), R('Marrowfield', 'Brightwater', 2, 'gray'), R('Marrowfield', 'Ashby', 3, 'amber'),
  R('Kingsport', 'Dunmore', 3, 'azure', 1), R('Kingsport', 'Dunmore', 3, 'jade', -1), R('Kingsport', 'Brightwater', 2, 'crimson'), R('Kingsport', 'Coldspring', 2, 'rose'),
  R('Dunmore', 'Ravenmoor', 3, 'violet'), R('Dunmore', 'Coldspring', 2, 'ebony'), R('Dunmore', 'Highgate', 2, 'gray'),
  R('Ravenmoor', 'Saltmarsh', 3, 'ivory'), R('Ravenmoor', 'Highgate', 2, 'jade'), R('Ravenmoor', 'Easthaven', 3, 'rose'),
  R('Saltmarsh', 'Easthaven', 2, 'gray'), R('Saltmarsh', 'Southmere', 4, 'ebony'),
  R('Ashby', 'Brightwater', 3, 'violet'), R('Ashby', 'Redfern', 2, 'jade'), R('Ashby', 'Millbrook', 3, 'gray'),
  R('Brightwater', 'Coldspring', 3, 'amber', 1), R('Brightwater', 'Coldspring', 3, 'ebony', -1), R('Brightwater', 'Millbrook', 2, 'azure'), R('Brightwater', 'Stonecross', 2, 'gray'),
  R('Coldspring', 'Highgate', 3, 'crimson'), R('Coldspring', 'Stonecross', 2, 'violet'), R('Coldspring', 'Thornbury', 3, 'ivory'),
  R('Highgate', 'Easthaven', 3, 'azure'), R('Highgate', 'Thornbury', 2, 'rose'), R('Highgate', 'Larkspur', 3, 'ebony'),
  R('Easthaven', 'Larkspur', 2, 'amber'), R('Easthaven', 'Southmere', 3, 'crimson'),
  R('Redfern', 'Millbrook', 3, 'ebony'), R('Millbrook', 'Stonecross', 3, 'crimson'),
  R('Stonecross', 'Thornbury', 3, 'jade', 1), R('Stonecross', 'Thornbury', 3, 'azure', -1), R('Thornbury', 'Larkspur', 3, 'violet'), R('Larkspur', 'Southmere', 3, 'jade'),
];
// Twins: the two tracks of a double route point at each other.
ROUTES.forEach((r, i) => { if (r.twin === 1) { r.twin = i + 1; ROUTES[i + 1].twin = i; } else if (r.twin !== undefined && r.twin < 0) { /* set by its partner */ } });
export const POINTS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15 };
const TICKET_PAIRS = [
  ['Northwatch', 'Southmere'], ['Northwatch', 'Larkspur'], ['Northwatch', 'Thornbury'], ['Northwatch', 'Easthaven'], ['Glenhaven', 'Southmere'], ['Glenhaven', 'Thornbury'],
  ['Glenhaven', 'Redfern'], ['Ironcrest', 'Redfern'], ['Ironcrest', 'Larkspur'], ['Ironcrest', 'Millbrook'], ['Frosthold', 'Redfern'], ['Frosthold', 'Stonecross'],
  ['Frosthold', 'Ashby'], ['Seabright', 'Redfern'], ['Seabright', 'Millbrook'], ['Seabright', 'Brightwater'], ['Willowby', 'Saltmarsh'], ['Willowby', 'Larkspur'],
  ['Willowby', 'Highgate'], ['Marrowfield', 'Southmere'], ['Marrowfield', 'Easthaven'], ['Kingsport', 'Southmere'], ['Kingsport', 'Saltmarsh'], ['Dunmore', 'Redfern'],
  ['Dunmore', 'Southmere'], ['Ravenmoor', 'Millbrook'], ['Ravenmoor', 'Ashby'], ['Saltmarsh', 'Stonecross'], ['Ashby', 'Larkspur'], ['Brightwater', 'Southmere'],
  ['Coldspring', 'Seabright'], ['Highgate', 'Redfern'],
];

// Shortest path cost between cities over a set of usable routes (cost per route given).
export function shortest(from, to, cost) {
  const dist = CITIES.map(() => Infinity), prev = CITIES.map(() => null);
  dist[from] = 0;
  const done = new Set();
  for (;;) {
    let u = -1;
    for (let i = 0; i < CITIES.length; i++) if (!done.has(i) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity || u === to) break;
    done.add(u);
    ROUTES.forEach((r, k) => {
      const c = cost(r, k);
      if (c == null) return;
      const v = r.a === u ? r.b : r.b === u ? r.a : -1;
      if (v >= 0 && dist[u] + c < dist[v]) { dist[v] = dist[u] + c; prev[v] = k; }
    });
  }
  const path = [];
  for (let v = to; prev[v] != null; ) { const r = ROUTES[prev[v]]; path.push(prev[v]); v = r.a === v ? r.b : r.a; }
  return { cost: dist[to], path };
}
export const TICKETS = TICKET_PAIRS.map(([a, b]) => ({ a: C(a), b: C(b), value: shortest(C(a), C(b), r => r.len).cost }));

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function createGame(settings, players) {
  const g = { settings: { trains: 40, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.deck = shuffle([...COLORS.flatMap(c => Array(12).fill(c)), ...Array(14).fill('loco')]);
  g.discard = [];
  g.market = [];
  refillMarket(g);
  g.hands = g.seats.map(() => ({}));
  for (const s of g.order) for (let k = 0; k < 4; k++) addCard(g.hands[s], drawBlind(g));
  g.ticketDeck = shuffle(TICKETS.map((_, i) => i));
  g.tickets = g.seats.map(() => []);
  g.offer = g.seats.map(() => null);           // tickets being chosen
  for (const s of g.order) g.offer[s] = { cards: g.ticketDeck.splice(0, 3), min: 2 };
  g.owner = ROUTES.map(() => null);
  g.trains = g.seats.map(() => g.settings.trains);
  g.points = g.seats.map(() => 0);
  g.turnIdx = 0;
  g.phase = 'tickets';
  g.drew = 0;
  g.lastRound = null;
  return g;
}

const addCard = (hand, c) => { if (c) hand[c] = (hand[c] || 0) + 1; };
function drawBlind(g) {
  if (!g.deck.length) { g.deck = shuffle(g.discard); g.discard = []; }
  return g.deck.pop();
}
function refillMarket(g) {
  for (let tries = 0; tries < 5; tries++) {
    while (g.market.length < 5 && (g.deck.length || g.discard.length)) g.market.push(drawBlind(g));
    if (g.market.filter(c => c === 'loco').length < 3) return;
    g.discard.push(...g.market);
    g.market = [];
  }
}
export const current = g => g.order[g.turnIdx];
function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }
function log(g, seat, text) { g.log.push({ id: ++g.moveId, seat, text }); if (g.log.length > 8) g.log.shift(); }

function endTurn(g) {
  g.drew = 0;
  const s = current(g);
  // Down to two trains: everyone, including this player, gets one more turn.
  if (g.lastRound != null && --g.finalTurns <= 0) return finish(g);
  if (g.lastRound == null && g.trains[s] <= 2) { g.lastRound = s; g.finalTurns = g.order.length; announce(g, s, 'Last round!'); }
  g.turnIdx = (g.turnIdx + 1) % g.order.length;
}

// Twin routes: with fewer than four players, only one of a double route can be used.
export function routeOpen(g, k, seat) {
  if (g.owner[k] != null) return false;
  const tw = ROUTES[k].twin;
  if (tw != null && g.owner[tw] != null && (g.order.length < 4 || g.owner[tw] === seat)) return false;
  return true;
}

// How would this player pay for a route? Returns {color, n, loco} or null.
export function payment(hand, route, color) {
  const loco = hand.loco || 0;
  const opts = route.color === 'gray' ? (color ? [color] : COLORS.slice().sort((a, b) => (hand[b] || 0) - (hand[a] || 0))) : [route.color];
  for (const c of opts) {
    const have = hand[c] || 0;
    if (have + loco >= route.len) { const n = Math.min(have, route.len); return { color: c, n, loco: route.len - n }; }
  }
  if (route.color === 'gray' && !color && loco >= route.len) return { color: 'loco', n: 0, loco: route.len };
  return null;
}

export function connectedFor(g, seat, a, b) {
  return shortest(a, b, (r, k) => (g.owner[k] === seat ? 0 : null)).cost === 0;
}

export function longestPath(g, seat) {
  const mine = ROUTES.map((r, k) => k).filter(k => g.owner[k] === seat);
  let best = 0;
  const used = new Set();
  const dfs = (city, len) => {
    best = Math.max(best, len);
    for (const k of mine) {
      if (used.has(k)) continue;
      const r = ROUTES[k];
      const next = r.a === city ? r.b : r.b === city ? r.a : -1;
      if (next < 0) continue;
      used.add(k); dfs(next, len + r.len); used.delete(k);
    }
  };
  CITIES.forEach((_, c) => dfs(c, 0));
  return best;
}

function finish(g) {
  g.phase = 'over';
  g.final = {};
  const longest = g.order.map(s => longestPath(g, s));
  const top = Math.max(...longest);
  g.order.forEach((s, i) => {
    let tk = 0;
    const done = [], failed = [];
    for (const t of g.tickets[s]) { const T = TICKETS[t]; if (connectedFor(g, s, T.a, T.b)) { tk += T.value; done.push(t); } else { tk -= T.value; failed.push(t); } }
    const bonus = longest[i] === top && top > 0 ? 10 : 0;
    g.final[s] = { routes: g.points[s], tickets: tk, bonus, longest: longest[i], done, failed, total: g.points[s] + tk + bonus };
  });
  const best = Math.max(...g.order.map(s => g.final[s].total));
  g.winners = g.order.filter(s => g.final[s].total === best);
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The line is closed';
  if (a.type === 'keep') {
    const o = g.offer[seat];
    if (!o) return 'No tickets to choose';
    const keep = [...new Set(a.tickets || [])].filter(t => o.cards.includes(t));
    if (keep.length < o.min) return `Keep at least ${o.min}`;
    g.tickets[seat].push(...keep);
    g.ticketDeck.unshift(...o.cards.filter(t => !keep.includes(t)));
    g.offer[seat] = null;
    if (g.phase === 'tickets') { if (g.order.every(s => !g.offer[s])) g.phase = 'play'; }
    else endTurn(g);
    return null;
  }
  if (g.phase !== 'play') return 'Choose your tickets first';
  if (seat !== current(g)) return "It isn't your turn";
  if (g.offer[seat]) return 'Choose which tickets to keep';
  if (a.type === 'take') {
    const c = g.market[a.i];
    if (c == null) return 'No card there';
    if (c === 'loco' && g.drew) return "You can't take an engine as your second card";
    g.market.splice(a.i, 1);
    addCard(g.hands[seat], c);
    refillMarket(g);
    g.moveId++;
    g.passes = 0;
    if (c === 'loco' || ++g.drew >= 2) endTurn(g);
    else g.drew = 1;
    return null;
  }
  if (a.type === 'blind') {
    const c = drawBlind(g);
    if (!c) return 'The deck is empty';
    addCard(g.hands[seat], c);
    g.moveId++;
    if (++g.drew >= 2 || (!g.deck.length && !g.discard.length && !g.market.some(x => x !== 'loco'))) endTurn(g);
    return null;
  }
  if (g.drew && a.type !== 'pass') return 'Take your second card';
  if (a.type === 'claim') {
    const k = a.route, r = ROUTES[k];
    if (!r || !routeOpen(g, k, seat)) return 'That route is taken';
    if (g.trains[seat] < r.len) return 'Not enough trains left';
    const pay = payment(g.hands[seat], r, a.color);
    if (!pay) return `You need ${r.len} ${r.color === 'gray' ? 'cards of one colour' : r.color} cards`;
    const h = g.hands[seat];
    if (pay.color !== 'loco') h[pay.color] = (h[pay.color] || 0) - pay.n;
    g.passes = 0;
    h.loco = (h.loco || 0) - pay.loco;
    g.discard.push(...Array(pay.n).fill(pay.color), ...Array(pay.loco).fill('loco'));
    g.owner[k] = seat;
    g.trains[seat] -= r.len;
    g.points[seat] += POINTS[r.len];
    g.moveId++;
    log(g, seat, `${CITIES[r.a].name}–${CITIES[r.b].name}`);
    announce(g, seat, `Claims ${CITIES[r.a].name}–${CITIES[r.b].name}`);
    endTurn(g);
    return null;
  }
  if (a.type === 'pass') {
    // Only when there's nothing left to draw.
    if (g.deck.length || g.discard.length || g.market.some(c => c !== 'loco' || !g.drew)) return 'You can still draw cards';
    if (++g.passes >= g.order.length) return finish(g), null;
    endTurn(g);
    return null;
  }
  if (a.type === 'tickets') {
    if (!g.ticketDeck.length) return 'No tickets left';
    g.offer[seat] = { cards: g.ticketDeck.splice(0, 3), min: 1 };
    return null;
  }
  return "That move isn't allowed";
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: current(g), order: g.order, market: g.market, deck: g.deck.length + g.discard.length, drew: g.drew,
    hand: g.hands[seat] || {}, tickets: (g.tickets[seat] || []).map(t => ({ t, ...TICKETS[t], done: connectedFor(g, seat, TICKETS[t].a, TICKETS[t].b) })),
    offer: g.offer[seat] ? { min: g.offer[seat].min, cards: g.offer[seat].cards.map(t => ({ t, ...TICKETS[t] })) } : null,
    owner: g.owner, trains: g.trains, points: g.points, handCounts: g.hands.map(h => Object.values(h).reduce((a, b) => a + b, 0)),
    ticketCounts: g.tickets.map(t => t.length), lastRound: g.lastRound, final: g.final || null, winners: g.winners || null, log: g.log, moveId: g.moveId,
  };
}

// ---------------------------------------------------------------- bots

function plan(g, seat) {
  const need = new Set();
  for (const t of g.tickets[seat]) {
    const T = TICKETS[t];
    if (connectedFor(g, seat, T.a, T.b)) continue;
    const p = shortest(T.a, T.b, (r, k) => (g.owner[k] === seat ? 0 : routeOpen(g, k, seat) ? r.len : null));
    if (p.cost < Infinity) p.path.forEach(k => { if (g.owner[k] !== seat) need.add(k); });
  }
  return [...need];
}

export function botAction(g, seat) {
  const o = g.offer[seat];
  if (o) {
    const cost = t => shortest(TICKETS[t].a, TICKETS[t].b, (r, k) => (g.owner[k] === seat ? 0 : routeOpen(g, k, seat) ? r.len : null)).cost - TICKETS[t].value * 0.3;
    const sorted = o.cards.slice().sort((x, y) => cost(x) - cost(y)).filter(t => cost(t) < 40);
    const keep = sorted.slice(0, Math.max(o.min, o.min === 2 ? 2 : 1));
    return { type: 'keep', tickets: keep.length >= o.min ? keep : o.cards.slice(0, o.min) };
  }
  if (g.phase !== 'play' || current(g) !== seat) return null;
  const hand = g.hands[seat];
  const need = plan(g, seat);
  if (!g.drew) {
    const affordable = k => routeOpen(g, k, seat) && g.trains[seat] >= ROUTES[k].len && payment(hand, ROUTES[k]);
    const claim = need.filter(affordable).sort((x, y) => ROUTES[y].len - ROUTES[x].len)[0];
    if (claim != null) return { type: 'claim', route: claim };
    if (!need.length) {
      if (g.trains[seat] > 14 && g.ticketDeck.length && g.tickets[seat].length < 6) return { type: 'tickets' };
      const any = ROUTES.map((_, k) => k).filter(affordable).sort((x, y) => ROUTES[y].len - ROUTES[x].len)[0];
      if (any != null && (ROUTES[any].len >= 3 || g.lastRound != null)) return { type: 'claim', route: any };
    }
  }
  const wanted = new Set(need.map(k => ROUTES[k].color).filter(c => c !== 'gray'));
  const i = g.market.findIndex((c, k) => wanted.has(c));
  if (i >= 0) return { type: 'take', i };
  if (!g.drew) { const l = g.market.indexOf('loco'); if (l >= 0 && Math.random() < 0.4) return { type: 'take', i: l }; }
  if (g.deck.length || g.discard.length) return { type: 'blind' };
  const j = g.market.findIndex(c => c !== 'loco' || !g.drew);
  return j >= 0 ? { type: 'take', i: j } : { type: 'pass' };
}
