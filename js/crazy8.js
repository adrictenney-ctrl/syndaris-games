// Crazy Eights: match the top card of the discard pile by suit or by rank. Eights are wild —
// play one any time and name the suit that has to follow. Can't play? Draw a card (one card,
// then play it if you can or pass — or, with the "draw until you can play" setting, keep
// drawing). First to empty their hand wins the hand and scores what everyone else is holding:
// eights 50, picture cards 10, aces 1, the rest face value. Play one hand, or to 100 or 200.

export const SUITS = 'SHDC';
export const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
const RANKS = 'A23456789TJQK';
const rankOf = c => c[0], suitOf = c => c[1];
export const cardPoints = c => (rankOf(c) === '8' ? 50 : 'TJQK'.includes(rankOf(c)) ? 10 : rankOf(c) === 'A' ? 1 : Number(rankOf(c)));
export const sortHand = h => h.slice().sort((a, b) => SUITS.indexOf(suitOf(a)) - SUITS.indexOf(suitOf(b)) || RANKS.indexOf(rankOf(a)) - RANKS.indexOf(rankOf(b)));

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = {
    settings: { target: 100, drawUntil: false, ...settings },
    seats: players.map(p => !!p), scores: players.map(() => 0),
    hand: 0, dealerIdx: -1, annId: 0, playId: 0,
  };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  deal(g);
  return g;
}

function deal(g) {
  g.hand++;
  g.dealerIdx = (g.dealerIdx + 1) % g.order.length;
  // Two decks for a big table.
  const decks = g.order.length > 5 ? 2 : 1;
  g.stock = shuffle(Array.from({ length: decks }, () => [...RANKS].flatMap(r => [...SUITS].map(s => r + s))).flat());
  const n = g.order.length === 2 ? 7 : 5;
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.stock.splice(0, n);
  // The starter can't be an eight.
  let i = g.stock.findIndex(c => rankOf(c) !== '8');
  g.discard = g.stock.splice(i, 1);
  g.suit = suitOf(g.discard[0]);
  g.turn = g.order[(g.dealerIdx + 1) % g.order.length];
  g.drew = false;          // drew this turn (one-card rule)
  g.phase = 'play';
  g.result = null;
}

export const top = g => g.discard[g.discard.length - 1];
export const canPlay = (g, c) => rankOf(c) === '8' || suitOf(c) === g.suit || rankOf(c) === rankOf(top(g));
const nextSeat = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];
function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }

function refill(g) {
  if (g.stock.length || g.discard.length < 2) return;
  const t = g.discard.pop();
  g.stock = shuffle(g.discard);
  g.discard = [t];
}

function endTurn(g) {
  g.drew = false;
  g.turn = nextSeat(g, g.turn);
  // Nobody can move and the stock is empty: the hand is blocked.
  refill(g);
  if (!g.stock.length && g.order.every(s => !g.hands[s].some(c => canPlay(g, c)))) finishHand(g, null);
}

function finishHand(g, winner) {
  const pts = {};
  for (const s of g.order) pts[s] = g.hands[s].reduce((a, c) => a + cardPoints(c), 0);
  if (winner == null) {
    // Blocked: lowest hand wins the difference.
    winner = g.order.slice().sort((a, b) => pts[a] - pts[b])[0];
  }
  const won = g.order.filter(s => s !== winner).reduce((a, s) => a + pts[s], 0);
  g.scores[winner] += won;
  g.result = { winner, won, pts };
  const target = g.settings.target;
  g.phase = target === 0 || g.scores[winner] >= target ? 'over' : 'handOver';
  g.nextAt = Date.now() + 5000;
}

export function advance(g) {
  if (g.phase === 'handOver' && Date.now() >= g.nextAt) { deal(g); return true; }
  return false;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next hand';
  if (seat !== g.turn) return "It isn't your turn";
  const hand = g.hands[seat];
  if (a.type === 'play') {
    if (!hand.includes(a.card)) return "That card isn't in your hand";
    if (!canPlay(g, a.card)) return `Play a ${SUIT_NAME[g.suit].slice(0, -1).toLowerCase()}, a ${rankOf(top(g)) === 'T' ? '10' : rankOf(top(g))}, or an eight`;
    if (rankOf(a.card) === '8' && !SUITS.includes(a.suit)) return 'Name a suit for your eight';
    hand.splice(hand.indexOf(a.card), 1);
    g.discard.push(a.card);
    g.suit = rankOf(a.card) === '8' ? a.suit : suitOf(a.card);
    g.playId++;
    if (rankOf(a.card) === '8') announce(g, seat, `Eight! ${SUIT_NAME[a.suit]}`);
    else if (hand.length === 1) announce(g, seat, 'Last card!');
    if (!hand.length) { announce(g, seat, 'Out!'); finishHand(g, seat); return null; }
    endTurn(g);
    return null;
  }
  if (a.type === 'draw') {
    if (g.drew && !g.settings.drawUntil) return 'Play the card you drew, or pass';
    refill(g);
    if (!g.stock.length) { endTurn(g); announce(g, seat, 'No cards left to draw · pass'); return null; }
    hand.push(g.stock.pop());
    g.drew = true;
    return null;
  }
  if (a.type === 'pass') {
    if (!g.drew && g.stock.length + g.discard.length > 1) return 'Draw a card first';
    if (g.settings.drawUntil && hand.some(c => canPlay(g, c))) return 'You can play now';
    announce(g, seat, 'Pass');
    endTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

export function viewFor(g, seat) {
  const mine = g.hands[seat] || [];
  return {
    phase: g.phase, turn: g.turn, order: g.order, hand: sortHand(mine), top: top(g), suit: g.suit,
    stock: g.stock.length, counts: g.hands.map(h => h.length), scores: g.scores, target: g.settings.target,
    playable: g.turn === seat && g.phase === 'play' ? mine.filter(c => canPlay(g, c)) : [],
    drew: g.drew, drawUntil: g.settings.drawUntil, result: g.result, handNo: g.hand, playId: g.playId,
  };
}

// ---------------------------------------------------------------- bots

export function botAction(g, seat) {
  const hand = g.hands[seat];
  const ok = hand.filter(c => canPlay(g, c));
  const plain = ok.filter(c => rankOf(c) !== '8');
  const bestSuit = () => {
    const n = {}; hand.forEach(c => { if (rankOf(c) !== '8') n[suitOf(c)] = (n[suitOf(c)] || 0) + 1; });
    return Object.keys(n).sort((a, b) => n[b] - n[a])[0] || SUITS[Math.floor(Math.random() * 4)];
  };
  if (plain.length) {
    // Prefer changing to the suit we hold most of; dump high cards first.
    const counts = {}; hand.forEach(c => { counts[suitOf(c)] = (counts[suitOf(c)] || 0) + 1; });
    plain.sort((a, b) => (counts[suitOf(b)] - counts[suitOf(a)]) || (cardPoints(b) - cardPoints(a)));
    return { type: 'play', card: plain[0] };
  }
  if (ok.length) return { type: 'play', card: ok[0], suit: bestSuit() };
  if (!g.drew || g.settings.drawUntil) {
    if (g.stock.length || g.discard.length > 1) return { type: 'draw' };
  }
  return { type: 'pass' };
}
