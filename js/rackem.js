// Rack 'Em: get the ten cards in your rack into rising order, lowest at the front. Each turn,
// draw from the deck or take the top discard, and swap it into any slot of your rack (the old
// card is discarded) — or, if it came from the deck, throw it straight away. First with a
// rising rack calls it and scores 75. Everyone scores 5 for each card in order from the front
// before the first break. First to 500 wins. Cards run 1–40 for two players, 1–50 for three,
// 1–60 for four. Our own card design.

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const SLOTS = 10;

export function createGame(settings, players) {
  const g = { settings: { target: 500, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, handNo: 0, dealerIdx: -1 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.max = 20 + 10 * g.order.length;
  g.scores = g.seats.map(() => 0);
  deal(g);
  return g;
}

function deal(g) {
  g.handNo++;
  g.dealerIdx = (g.dealerIdx + 1) % g.order.length;
  g.deck = shuffle([...Array(g.max)].map((_, i) => i + 1));
  g.racks = g.seats.map(() => []);
  for (const s of g.order) g.racks[s] = g.deck.splice(0, SLOTS);
  g.discard = [g.deck.pop()];
  g.turn = g.order[(g.dealerIdx + 1) % g.order.length];
  g.drawn = null;
  g.phase = 'draw';
  g.result = null;
  g.moveId++;
}

export const inOrder = r => r.every((x, i) => i === 0 || x > r[i - 1]);
export const runFromFront = r => { let k = 1; while (k < r.length && r[k] > r[k - 1]) k++; return k; };
export const current = g => (g.phase === 'draw' || g.phase === 'place' ? g.turn : -1);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.turn !== seat || !['draw', 'place'].includes(g.phase)) return "It isn't your turn";
  if (a.type === 'draw') {
    if (g.phase !== 'draw') return 'You already drew';
    if (a.from === 'discard') g.drawn = { v: g.discard.pop(), from: 'discard' };
    else {
      if (!g.deck.length) { const top = g.discard.pop(); g.deck = shuffle(g.discard); g.discard = [top]; }
      g.drawn = { v: g.deck.pop(), from: 'deck' };
    }
    g.phase = 'place';
    g.moveId++;
    return null;
  }
  if (a.type === 'place') {
    if (g.phase !== 'place') return 'Draw first';
    const r = g.racks[seat];
    if (a.slot === -1) {
      if (g.drawn.from === 'discard') return 'A card from the discard pile has to go into your rack';
      g.discard.push(g.drawn.v);
    } else {
      if (!(a.slot >= 0 && a.slot < SLOTS)) return 'Pick a slot';
      g.discard.push(r[a.slot]);
      r[a.slot] = g.drawn.v;
      g.lastSlot = { seat, slot: a.slot };
    }
    g.drawn = null;
    g.moveId++;
    if (inOrder(r)) return rack(g, seat);
    g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
    g.phase = 'draw';
    return null;
  }
  return "That move isn't allowed";
}

function rack(g, s) {
  const add = g.seats.map(() => 0);
  for (const o of g.order) add[o] = runFromFront(g.racks[o]) * 5 + (o === s ? 75 : 0);
  g.scores = g.scores.map((x, i) => x + add[i]);
  g.result = { winner: s, add };
  announce(g, s, "Rack 'em! +75");
  const top = Math.max(...g.scores);
  g.phase = top >= g.settings.target ? 'over' : 'handEnd';
  if (g.phase === 'over') g.winner = g.order.find(o => g.scores[o] === top);
  g.nextAt = Date.now() + 9000;
  return null;
}

export function advance(g) { if (g.phase === 'handEnd') deal(g); }
export function tick(g) { return g.phase === 'handEnd' ? { ms: Math.max(0, g.nextAt - Date.now()), run: () => advance(g) } : null; }

// ------------------------------------------------------------------ computer player
// Ideal value for each slot, and how much a card would improve a slot.
function bestSlot(g, r, v) {
  const target = i => ((i + 0.5) * g.max) / SLOTS;
  let best = { slot: -1, gain: 2 };
  for (let i = 0; i < SLOTS; i++) {
    const before = Math.abs(r[i] - target(i)), after = Math.abs(v - target(i));
    const okL = i === 0 || v > r[i - 1], okR = i === SLOTS - 1 || v < r[i + 1];
    const gain = before - after + (okL && okR ? 4 : 0) - ((i === 0 || r[i] > r[i - 1]) && (i === SLOTS - 1 || r[i] < r[i + 1]) ? 4 : 0);
    if (gain > best.gain) best = { slot: i, gain };
  }
  return best;
}
export function botAction(g, s) {
  const r = g.racks[s];
  if (g.phase === 'draw') {
    const top = g.discard[g.discard.length - 1];
    return { type: 'draw', from: bestSlot(g, r, top).slot >= 0 ? 'discard' : 'deck' };
  }
  const b = bestSlot(g, r, g.drawn.v);
  if (b.slot < 0 && g.drawn.from === 'discard') {
    // Must place it: least harmful slot.
    const t = i => ((i + 0.5) * g.max) / SLOTS;
    let k = 0;
    for (let i = 1; i < SLOTS; i++) if (Math.abs(g.drawn.v - t(i)) < Math.abs(g.drawn.v - t(k))) k = i;
    return { type: 'place', slot: k };
  }
  return { type: 'place', slot: b.slot };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, rack: g.racks[seat] || [], top: g.discard[g.discard.length - 1] ?? null, drawn: g.turn === seat ? g.drawn : g.drawn && { from: g.drawn.from },
    scores: g.scores, order: g.order, max: g.max, result: g.result, target: g.settings.target, handNo: g.handNo, winner: g.winner ?? null,
  };
}
