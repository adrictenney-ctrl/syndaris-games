// Deal Maker: a fast property card game. First to own three complete property sets (of
// different colours) wins. Start with five cards; each turn draw two (five if your hand is
// empty) and play up to three: put money or an action card in your bank, lay down a property,
// or play an action. Charge rent, steal, swap, collect debts. Anyone hit by an action can play
// a Nope! card to cancel it — and a Nope! can be Noped back. When you owe, you pay from your
// bank and your properties (no change given). Keep at most seven cards at the end of your turn.
// Our own names, colours, values and card counts.

export const COLORS = {
  brown: { name: 'Mud Flats', col: '#7a4a2a', size: 2, rent: [1, 2], val: 1 },
  sky: { name: 'Seaside', col: '#4aa8d8', size: 3, rent: [1, 2, 3], val: 1 },
  pink: { name: 'Blossom Row', col: '#d0569a', size: 3, rent: [1, 2, 4], val: 2 },
  orange: { name: 'Market Street', col: '#e8862a', size: 3, rent: [1, 3, 5], val: 2 },
  red: { name: 'Theatre Lane', col: '#c8323a', size: 3, rent: [2, 3, 6], val: 3 },
  yellow: { name: 'Sunny Heights', col: '#e6c23a', size: 3, rent: [2, 4, 6], val: 3 },
  green: { name: 'Park Avenue', col: '#3a9a5a', size: 3, rent: [2, 4, 7], val: 4 },
  navy: { name: 'Harbor Point', col: '#2a3a8a', size: 2, rent: [3, 8], val: 4 },
  rail: { name: 'Railways', col: '#2a2a2a', size: 4, rent: [1, 2, 3, 4], val: 2 },
  util: { name: 'Utilities', col: '#8aa86a', size: 2, rent: [1, 2], val: 2 },
};
export const ACTIONS = {
  takeover: { name: 'Hostile Takeover', val: 5, n: 2, tip: 'Steal a complete set from anyone' },
  nope: { name: 'Nope!', val: 4, n: 3, tip: 'Cancel an action played against you' },
  snatch: { name: 'Snatch', val: 3, n: 3, tip: 'Steal one property (not from a complete set)' },
  swap: { name: 'Swap Meet', val: 3, n: 3, tip: 'Swap one of your properties for one of theirs' },
  collect: { name: 'Collect Debt', val: 3, n: 3, tip: 'One player pays you 5' },
  party: { name: 'Party Time', val: 2, n: 3, tip: 'Everyone pays you 2' },
  payday: { name: 'Payday', val: 1, n: 10, tip: 'Draw two cards' },
  shop: { name: 'Shop', val: 3, n: 3, tip: 'On a complete set: +3 rent' },
  tower: { name: 'Tower', val: 4, n: 2, tip: 'On a set with a Shop: +4 rent' },
  hike: { name: 'Rent Hike', val: 1, n: 2, tip: 'Play with a Rent card: double it' },
};
const RENT_PAIRS = [['brown', 'sky'], ['pink', 'orange'], ['red', 'yellow'], ['green', 'navy'], ['rail', 'util']];
const WILD_PAIRS = [['sky', 'brown'], ['pink', 'orange'], ['red', 'yellow'], ['green', 'navy'], ['rail', 'util'], ['rail', 'green']];

// Build the deck: an array of card objects indexed by id.
export const CARDS = [];
const add = c => { c.id = CARDS.length; CARDS.push(c); };
for (const [v, n] of [[1, 6], [2, 5], [3, 3], [4, 3], [5, 2], [10, 1]]) for (let i = 0; i < n; i++) add({ kind: 'money', val: v });
for (const [k, c] of Object.entries(COLORS)) for (let i = 0; i < c.size; i++) add({ kind: 'prop', colors: [k], val: c.val });
for (const p of WILD_PAIRS) add({ kind: 'prop', colors: p, val: Math.max(COLORS[p[0]].val, COLORS[p[1]].val) });
for (let i = 0; i < 2; i++) add({ kind: 'prop', colors: Object.keys(COLORS), val: 0, rainbow: true });
for (const [k, a] of Object.entries(ACTIONS)) for (let i = 0; i < a.n; i++) add({ kind: 'action', act: k, val: a.val });
for (const p of RENT_PAIRS) for (let i = 0; i < 2; i++) add({ kind: 'rent', colors: p, val: 1 });
for (let i = 0; i < 3; i++) add({ kind: 'rent', colors: Object.keys(COLORS), val: 3, wild: true });

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.deck = shuffle(CARDS.map(c => c.id));
  g.discard = [];
  g.hands = g.seats.map(() => []);
  g.bank = g.seats.map(() => []);
  g.props = g.seats.map(() => ({}));       // color -> [ids]
  g.builds = g.seats.map(() => ({}));      // color -> { shop: id, tower: id }
  g.wildAs = {};                           // property id -> color it's laid as
  for (const s of g.order) for (let i = 0; i < 5; i++) g.hands[s].push(draw(g));
  g.turn = g.order[Math.floor(Math.random() * g.order.length)];
  startTurn(g);
  return g;
}

function draw(g) {
  if (!g.deck.length) { g.deck = shuffle(g.discard); g.discard = []; }
  return g.deck.pop();
}
function startTurn(g) {
  const h = g.hands[g.turn];
  const n = h.length ? 2 : 5;
  for (let i = 0; i < n; i++) { const c = draw(g); if (c != null) h.push(c); }
  g.plays = 0;
  g.phase = 'play';
  g.queue = [];
  g.pending = null;
  g.moveId++;
}

export const setSize = c => COLORS[c].size;
export const complete = (g, s, c) => (g.props[s][c] || []).length >= setSize(c);
export const completeSets = (g, s) => Object.keys(COLORS).filter(c => complete(g, s, c));
export function rentFor(g, s, c) {
  const n = Math.min((g.props[s][c] || []).length, setSize(c));
  if (!n) return 0;
  let r = COLORS[c].rent[n - 1];
  if (complete(g, s, c)) { if (g.builds[s][c]?.shop != null) r += 3; if (g.builds[s][c]?.tower != null) r += 4; }
  return r;
}
const worth = (g, s) => g.bank[s].reduce((t, id) => t + CARDS[id].val, 0) + Object.values(g.props[s]).flat().reduce((t, id) => t + CARDS[id].val, 0);
const looseProps = (g, s) => Object.entries(g.props[s]).filter(([c]) => !complete(g, s, c)).flatMap(([, ids]) => ids);
const others = (g, s) => g.order.filter(x => x !== s);

function checkWin(g) {
  for (const s of g.order) if (completeSets(g, s).length >= 3) { g.phase = 'over'; g.winner = s; g.pending = null; g.queue = []; announce(g, s, 'Three sets — wins!'); return true; }
  return false;
}

export function current(g) {
  if (g.phase === 'play' || g.phase === 'discard') return g.turn;
  if (g.phase === 'respond') return g.pending.responder;
  if (g.phase === 'pay') return g.pending.effect.from;
  return -1;
}

function removeProp(g, s, id) {
  for (const [c, ids] of Object.entries(g.props[s])) {
    const i = ids.indexOf(id);
    if (i >= 0) {
      ids.splice(i, 1);
      if (!ids.length) delete g.props[s][c];
      // A set that breaks up loses its buildings to the bank.
      if (!complete(g, s, c) && g.builds[s][c]) { for (const b of Object.values(g.builds[s][c])) if (b != null) g.bank[s].push(b); delete g.builds[s][c]; }
      return c;
    }
  }
  return null;
}
function placeProp(g, s, id, color) {
  const card = CARDS[id];
  const c = card.colors.includes(color) ? color : card.colors[0];
  g.wildAs[id] = c;
  (g.props[s][c] ||= []).push(id);
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (seat !== current(g)) return "It isn't your turn";
  if (g.phase === 'respond') return respond(g, seat, a);
  if (g.phase === 'pay') return pay(g, seat, a);
  const h = g.hands[seat];
  if (g.phase === 'discard') {
    if (a.type !== 'discard') return 'Discard down to seven cards';
    const ids = a.ids || [];
    if (ids.length !== h.length - 7 || !ids.every(id => h.includes(id))) return `Discard ${h.length - 7}`;
    g.hands[seat] = h.filter(id => !ids.includes(id));
    g.discard.push(...ids);
    return nextTurn(g);
  }
  if (a.type === 'end') {
    if (h.length > 7) { g.phase = 'discard'; g.moveId++; return null; }
    return nextTurn(g);
  }
  if (g.plays >= 3) return 'You’ve played three cards — end your turn';
  const id = Number(a.id);
  if (!h.includes(id)) return 'That card isn’t in your hand';
  const card = CARDS[id];
  const use = () => { g.hands[seat] = g.hands[seat].filter(x => x !== id); g.plays++; g.moveId++; };
  if (a.type === 'bank') {
    if (card.kind === 'prop') return 'Properties can’t go in the bank';
    use();
    g.bank[seat].push(id);
    return null;
  }
  if (a.type === 'prop') {
    if (card.kind !== 'prop') return 'That isn’t a property';
    use();
    placeProp(g, seat, id, a.color);
    checkWin(g);
    return null;
  }
  if (a.type !== 'play') return "That move isn't allowed";
  if (card.kind === 'rent') {
    const color = a.color;
    if (!card.colors.includes(color)) return 'Pick one of the card’s colours';
    let amt = rentFor(g, seat, color);
    if (!amt) return 'You don’t own any of that colour';
    let hike = null;
    if (a.hike != null) {
      hike = Number(a.hike);
      if (!h.includes(hike) || CARDS[hike].act !== 'hike') return 'No Rent Hike in your hand';
      if (g.plays >= 2) return 'A Rent Hike needs a second play left';
      amt *= 2;
    }
    const targets = card.wild ? [Number(a.target)] : others(g, seat);
    if (card.wild && !others(g, seat).includes(targets[0])) return 'Pick who pays';
    use();
    if (hike != null) { g.hands[seat] = g.hands[seat].filter(x => x !== hike); g.plays++; g.discard.push(hike); }
    g.discard.push(id);
    announce(g, seat, `Rent! ${amt}`);
    queueAll(g, targets.map(t => ({ kind: 'pay', from: t, to: seat, amount: amt, why: `${COLORS[color].name} rent` })));
    return null;
  }
  if (card.kind !== 'action') return 'That card can’t be played like that';
  const k = card.act;
  if (k === 'nope') return 'Keep Nope! for when someone acts against you (or bank it)';
  if (k === 'payday') { use(); g.discard.push(id); for (let i = 0; i < 2; i++) g.hands[seat].push(draw(g)); announce(g, seat, 'Payday!'); return null; }
  if (k === 'shop' || k === 'tower') {
    const c = a.color;
    if (!c || !complete(g, seat, c) || c === 'rail' || c === 'util') return 'Put it on a complete set (not railways or utilities)';
    const b = (g.builds[seat][c] ||= {});
    if (k === 'shop' && b.shop != null) return 'That set already has a Shop';
    if (k === 'tower' && (b.shop == null || b.tower != null)) return 'A Tower goes on a set with a Shop (and no Tower)';
    use();
    b[k] = id;
    return null;
  }
  if (k === 'hike') return 'Play Rent Hike together with a Rent card';
  const t = Number(a.target);
  if (k === 'party') {
    use(); g.discard.push(id); announce(g, seat, 'Party Time! 🎉');
    queueAll(g, others(g, seat).map(o => ({ kind: 'pay', from: o, to: seat, amount: 2, why: 'Party Time' })));
    return null;
  }
  if (!others(g, seat).includes(t)) return 'Pick another player';
  if (k === 'collect') { use(); g.discard.push(id); announce(g, seat, 'Collect Debt!'); queueAll(g, [{ kind: 'pay', from: t, to: seat, amount: 5, why: 'Collect Debt' }]); return null; }
  if (k === 'takeover') {
    if (!complete(g, t, a.color)) return 'They need a complete set of that colour';
    use(); g.discard.push(id); announce(g, seat, 'Hostile Takeover!');
    queueAll(g, [{ kind: 'takeover', from: t, to: seat, color: a.color }]);
    return null;
  }
  if (k === 'snatch') {
    const p = Number(a.prop);
    if (!looseProps(g, t).includes(p)) return 'Pick a property that isn’t in a complete set';
    use(); g.discard.push(id); announce(g, seat, 'Snatch!');
    queueAll(g, [{ kind: 'snatch', from: t, to: seat, prop: p }]);
    return null;
  }
  if (k === 'swap') {
    const p = Number(a.prop), m = Number(a.mine);
    if (!looseProps(g, t).includes(p)) return 'Pick one of their properties that isn’t in a complete set';
    if (!looseProps(g, seat).includes(m)) return 'Pick one of your properties that isn’t in a complete set';
    use(); g.discard.push(id); announce(g, seat, 'Swap Meet!');
    queueAll(g, [{ kind: 'swap', from: t, to: seat, prop: p, mine: m }]);
    return null;
  }
  return "That move isn't allowed";
}

// Effects go one at a time; each target may answer with Nope! first.
function queueAll(g, effects) { g.queue.push(...effects); nextEffect(g); }
const hasNope = (g, s) => g.hands[s].some(id => CARDS[id].act === 'nope');

function nextEffect(g) {
  if (g.phase === 'over') return;
  const e = g.queue.shift();
  if (!e) { g.pending = null; g.phase = 'play'; g.moveId++; return; }
  g.pending = { effect: e, responder: e.from, nopes: 0 };
  if (hasNope(g, e.from)) { g.phase = 'respond'; g.moveId++; return; }
  resolve(g);
}

function respond(g, seat, a) {
  const p = g.pending;
  if (a.type === 'nope') {
    const id = g.hands[seat].find(x => CARDS[x].act === 'nope');
    if (id == null) return 'You have no Nope!';
    g.hands[seat] = g.hands[seat].filter(x => x !== id);
    g.discard.push(id);
    p.nopes++;
    announce(g, seat, 'Nope!');
    const other = seat === p.effect.from ? p.effect.to : p.effect.from;
    g.moveId++;
    if (hasNope(g, other)) { p.responder = other; return null; }
    return resolve(g);
  }
  if (a.type === 'accept') return resolve(g);
  return 'Nope!, or let it happen';
}

function resolve(g) {
  const p = g.pending, e = p.effect;
  g.moveId++;
  if (p.nopes % 2 === 1) { nextEffect(g); return null; }
  if (e.kind === 'pay') {
    if (worth(g, e.from) === 0) { nextEffect(g); return null; }
    g.phase = 'pay';
    return null;
  }
  if (e.kind === 'takeover') {
    const ids = g.props[e.from][e.color] || [];
    for (const id of ids.slice()) { removeProp(g, e.from, id); placeProp(g, e.to, id, e.color); }
    const b = g.builds[e.from][e.color];
    if (b) { g.builds[e.to][e.color] = b; delete g.builds[e.from][e.color]; }
  } else if (e.kind === 'snatch') {
    const c = removeProp(g, e.from, e.prop);
    if (c) placeProp(g, e.to, e.prop, c);
  } else if (e.kind === 'swap') {
    const c1 = removeProp(g, e.from, e.prop), c2 = removeProp(g, e.to, e.mine);
    if (c1) placeProp(g, e.to, e.prop, c1);
    if (c2) placeProp(g, e.from, e.mine, c2);
  }
  if (!checkWin(g)) nextEffect(g);
  return null;
}

function pay(g, seat, a) {
  if (a.type !== 'pay') return 'Choose what to pay with';
  const e = g.pending.effect;
  const ids = (a.ids || []).map(Number);
  const owned = [...g.bank[seat], ...Object.values(g.props[seat]).flat()];
  if (!ids.every(id => owned.includes(id)) || new Set(ids).size !== ids.length) return 'Pay with your own cards';
  const total = ids.reduce((t, id) => t + CARDS[id].val, 0);
  if (total < e.amount && ids.length < owned.filter(id => CARDS[id].val > 0).length) return `You owe ${e.amount} — pick more`;
  for (const id of ids) {
    if (g.bank[seat].includes(id)) { g.bank[seat] = g.bank[seat].filter(x => x !== id); g.bank[e.to].push(id); }
    else { const c = removeProp(g, seat, id); placeProp(g, e.to, id, c); }
  }
  announce(g, seat, `Paid ${total}`);
  g.moveId++;
  if (!checkWin(g)) nextEffect(g);
  return null;
}

function nextTurn(g) {
  g.turn = g.order[(g.order.indexOf(g.turn) + 1) % g.order.length];
  startTurn(g);
  return null;
}

// ------------------------------------------------------------------ computer player
export function botAction(g, s) {
  if (g.phase === 'respond') {
    const e = g.pending.effect;
    const mineHit = (e.from === s) === (g.pending.nopes % 2 === 0);
    const big = e.kind === 'takeover' || e.kind === 'snatch' || e.kind === 'swap' || e.amount >= 4;
    return mineHit && big ? { type: 'nope' } : { type: 'accept' };
  }
  if (g.phase === 'pay') {
    const e = g.pending.effect;
    let need = e.amount;
    const ids = [];
    const bank = g.bank[s].slice().sort((a, b) => CARDS[a].val - CARDS[b].val);
    // Smallest bank cards first, but use one big note rather than many small ones if it covers it.
    const big = bank.find(id => CARDS[id].val >= need);
    if (big != null && bank.filter(id => CARDS[id].val < need).reduce((t, id) => t + CARDS[id].val, 0) < need) { ids.push(big); need = 0; }
    for (const id of bank) { if (need <= 0) break; if (ids.includes(id)) continue; ids.push(id); need -= CARDS[id].val; }
    if (need > 0) {
      const props = [...looseProps(g, s), ...Object.values(g.props[s]).flat().filter(id => !looseProps(g, s).includes(id))].filter(id => CARDS[id].val > 0);
      for (const id of props) { if (need <= 0) break; ids.push(id); need -= CARDS[id].val; }
    }
    return { type: 'pay', ids };
  }
  if (g.phase === 'discard') {
    const h = g.hands[s].slice().sort((a, b) => CARDS[a].val - CARDS[b].val);
    return { type: 'discard', ids: h.slice(0, g.hands[s].length - 7) };
  }
  if (g.plays >= 3) return { type: 'end' };
  const h = g.hands[s];
  const opp = others(g, s);
  // 1) Properties.
  for (const id of h) {
    const c = CARDS[id];
    if (c.kind !== 'prop') continue;
    const best = c.colors.slice().sort((x, y) => ((g.props[s][y] || []).length - setSize(y)) - ((g.props[s][x] || []).length - setSize(x)) - (complete(g, s, y) ? 9 : 0) + (complete(g, s, x) ? 9 : 0))[0];
    return { type: 'prop', id, color: best };
  }
  // 2) Actions that take things.
  for (const id of h) {
    const c = CARDS[id];
    if (c.act === 'payday') return { type: 'play', id };
    if (c.act === 'takeover') for (const t of opp) { const cs = completeSets(g, t); if (cs.length) return { type: 'play', id, target: t, color: cs[0] }; }
    if (c.act === 'snatch') {
      for (const t of opp) for (const p of looseProps(g, t)) { const col = g.wildAs[p]; if ((g.props[s][col] || []).length + 1 >= setSize(col) || CARDS[p].val >= 3) return { type: 'play', id, target: t, prop: p }; }
    }
    if ((c.act === 'shop' || c.act === 'tower')) { const col = completeSets(g, s).find(x => x !== 'rail' && x !== 'util' && (c.act === 'shop' ? g.builds[s][x]?.shop == null : g.builds[s][x]?.shop != null && g.builds[s][x]?.tower == null)); if (col) return { type: 'play', id, color: col }; }
  }
  // 3) Rent for the best colour.
  for (const id of h) {
    const c = CARDS[id];
    if (c.kind !== 'rent') continue;
    const col = c.colors.slice().sort((x, y) => rentFor(g, s, y) - rentFor(g, s, x))[0];
    if (rentFor(g, s, col) >= 2 || (c.wild && rentFor(g, s, col) >= 1)) {
      const hike = g.plays <= 1 ? h.find(x => CARDS[x].act === 'hike') : undefined;
      const target = opp.slice().sort((a, b) => worth(g, b) - worth(g, a))[0];
      return { type: 'play', id, color: col, target, hike };
    }
  }
  for (const id of h) {
    const c = CARDS[id];
    if (c.act === 'collect') return { type: 'play', id, target: opp.slice().sort((a, b) => worth(g, b) - worth(g, a))[0] };
    if (c.act === 'party' && opp.length >= 2) return { type: 'play', id };
  }
  // 4) Bank money, then spare action cards (keep Nope!) if the bank is thin.
  const money = h.filter(id => CARDS[id].kind === 'money').sort((a, b) => CARDS[b].val - CARDS[a].val)[0];
  if (money != null) return { type: 'bank', id: money };
  const bankable = h.filter(id => CARDS[id].kind !== 'prop' && CARDS[id].act !== 'nope' && CARDS[id].act !== 'takeover');
  if (bankable.length && (g.bank[s].reduce((t, x) => t + CARDS[x].val, 0) < 6 || h.length > 7)) return { type: 'bank', id: bankable[0] };
  return { type: 'end' };
}

export function viewFor(g, seat) {
  const p = g.pending;
  return {
    phase: g.phase, turn: g.turn, plays: g.plays, order: g.order, hand: g.hands[seat] || [], counts: g.hands.map(h => h.length),
    bank: g.bank, props: g.props, builds: g.builds, wildAs: g.wildAs, deck: g.deck.length,
    pending: p && { ...p.effect, responder: p.responder, nopes: p.nopes }, winner: g.winner ?? null, moveId: g.moveId,
  };
}

export const check = g => (g.deck.length + g.discard.length + g.hands.flat().length + g.bank.flat().length + g.props.reduce((t, p) => t + Object.values(p).flat().length, 0) + g.builds.reduce((t, b) => t + Object.values(b).reduce((u, x) => u + Object.values(x).filter(v => v != null).length, 0), 0) !== CARDS.length ? 'count' : null);
