// Hearts: four players, no trumps, avoid points. Each heart is 1 point and the Queen of Spades
// is 13. Before each hand everyone passes three cards (left, right, across, then a hand with no
// passing). The 2♣ leads the first trick; nobody may throw points on the first trick unless they
// have nothing else; hearts can't be led until one has been thrown (unless that's all you have).
// Take all 26 points ("shoot the moon") and everyone else gets 26 instead. When someone reaches
// the target the lowest score wins.
import { fullDeck, shuffle, sortCards, followable, trickWinner, suitOf, rankOf, RANKS, announce } from './tricks.js?v=65';

export const PASS_DIR = ['left', 'right', 'across', 'none'];
const QS = 'QS';
export const pointsOf = c => (suitOf(c) === 'H' ? 1 : c === QS ? 13 : 0);

export function createGame(settings) {
  const g = { settings: { target: 100, ...settings }, scores: [0, 0, 0, 0], handNo: -1, annId: 0, moveId: 0 };
  deal(g);
  return g;
}

function deal(g) {
  g.handNo++;
  const deck = shuffle(fullDeck());
  g.hands = [0, 1, 2, 3].map(i => sortCards(deck.slice(i * 13, i * 13 + 13)));
  g.passDir = PASS_DIR[g.handNo % 4];
  g.passes = [null, null, null, null];
  g.taken = [0, 0, 0, 0];       // points taken this hand
  g.tricksWon = [0, 0, 0, 0];
  g.trick = [];
  g.lastTrick = null;
  g.broken = false;
  g.trickNo = 0;
  g.result = null;
  if (g.passDir === 'none') startPlay(g);
  else { g.phase = 'pass'; g.turn = -1; }
  g.moveId++;
}

function startPlay(g) {
  g.phase = 'play';
  g.turn = g.hands.findIndex(h => h.includes('2C'));
}

const passTarget = (g, s) => (s + { left: 1, right: 3, across: 2 }[g.passDir]) % 4;

export function legal(g, s) {
  const h = g.hands[s];
  if (g.phase !== 'play' || g.turn !== s) return [];
  if (g.trickNo === 0 && !g.trick.length) return h.includes('2C') ? ['2C'] : [];
  let ok = followable(h, g.trick);
  if (!g.trick.length && !g.broken) {
    const nonH = ok.filter(c => suitOf(c) !== 'H');
    if (nonH.length) ok = nonH;
  }
  if (g.trickNo === 0) {
    const clean = ok.filter(c => !pointsOf(c));
    if (clean.length) ok = clean;
  }
  return ok;
}

export function current(g) { return g.phase === 'play' ? g.turn : -1; }

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (a.type === 'pass') {
    if (g.phase !== 'pass') return 'Not passing now';
    const cards = a.cards || [];
    if (cards.length !== 3 || new Set(cards).size !== 3 || !cards.every(c => g.hands[seat].includes(c))) return 'Pick three cards to pass';
    g.passes[seat] = cards;
    g.moveId++;
    if (g.passes.every(Boolean)) {
      for (let s = 0; s < 4; s++) g.hands[s] = g.hands[s].filter(c => !g.passes[s].includes(c));
      g.received = [[], [], [], []];
      for (let s = 0; s < 4; s++) { const t = passTarget(g, s); g.hands[t].push(...g.passes[s]); g.received[t] = g.passes[s]; }
      g.hands = g.hands.map(h => sortCards(h));
      startPlay(g);
    }
    return null;
  }
  if (a.type === 'unpass') {
    if (g.phase !== 'pass' || !g.passes[seat]) return 'Nothing to take back';
    g.passes[seat] = null;
    g.moveId++;
    return null;
  }
  if (a.type === 'play') {
    if (g.phase !== 'play' || g.turn !== seat) return "It isn't your turn";
    if (!legal(g, seat).includes(a.card)) return g.trickNo === 0 && !g.trick.length ? 'The 2♣ leads' : "You can't play that card now";
    g.hands[seat] = g.hands[seat].filter(c => c !== a.card);
    g.trick.push({ seat, card: a.card });
    if (suitOf(a.card) === 'H' && !g.broken) { g.broken = true; announce(g, seat, 'Hearts are broken'); }
    if (a.card === QS) announce(g, seat, 'The Queen! ♠');
    g.moveId++;
    if (g.trick.length < 4) { g.turn = (seat + 1) % 4; return null; }
    const w = g.trick[trickWinner(g.trick)].seat;
    g.trickWinner = w;
    g.phase = 'trickEnd';
    g.turn = -1;
    return null;
  }
  return "That move isn't allowed";
}

export function advance(g) {
  if (g.phase === 'trickEnd') {
    const w = g.trickWinner;
    g.taken[w] += g.trick.reduce((t, p) => t + pointsOf(p.card), 0);
    g.tricksWon[w]++;
    g.lastTrick = { cards: g.trick, winner: w };
    g.trick = [];
    g.trickNo++;
    g.moveId++;
    if (g.trickNo < 13) { g.phase = 'play'; g.turn = w; return; }
    // Hand over.
    const moon = g.taken.findIndex(p => p === 26);
    const add = moon >= 0 ? g.taken.map((_, s) => (s === moon ? 0 : 26)) : g.taken.slice();
    if (moon >= 0) announce(g, moon, 'Shot the moon! 🌙');
    g.scores = g.scores.map((x, s) => x + add[s]);
    g.result = { taken: g.taken.slice(), add, moon };
    const over = Math.max(...g.scores) >= g.settings.target;
    if (over) {
      const low = Math.min(...g.scores);
      g.winners = [0, 1, 2, 3].filter(s => g.scores[s] === low);
    }
    g.phase = over ? 'over' : 'handEnd';
    return;
  }
  if (g.phase === 'handEnd') deal(g);
}

// ------------------------------------------------------------------ computer player

export function botPass(g, s) {
  const h = g.hands[s];
  const danger = c => (c === QS ? 100 : rankOf(c) === 'A' && suitOf(c) === 'S' ? 90 : rankOf(c) === 'K' && suitOf(c) === 'S' ? 88 : 0)
    + (suitOf(c) === 'H' ? 20 + RANKS.indexOf(rankOf(c)) * 2 : RANKS.indexOf(rankOf(c)));
  return h.slice().sort((a, b) => danger(b) - danger(a)).slice(0, 3);
}

export function botAction(g, s) {
  if (g.phase === 'pass') return { type: 'pass', cards: botPass(g, s) };
  const ok = legal(g, s);
  const rank = c => RANKS.indexOf(rankOf(c));
  if (!g.trick.length) {
    // Lead low, avoid leading spades high while the Queen is out.
    const safe = ok.filter(c => !(suitOf(c) === 'S' && rank(c) >= 10)).sort((a, b) => rank(a) - rank(b));
    return { type: 'play', card: (safe[0] || ok.sort((a, b) => rank(a) - rank(b))[0]) };
  }
  const led = suitOf(g.trick[0].card);
  const following = ok.every(c => suitOf(c) === led);
  if (following) {
    const best = g.trick.filter(p => suitOf(p.card) === led).reduce((m, p) => Math.max(m, rank(p.card)), -1);
    const pts = g.trick.reduce((t, p) => t + pointsOf(p.card), 0);
    const under = ok.filter(c => rank(c) < best).sort((a, b) => rank(b) - rank(a));
    if (under.length) return { type: 'play', card: under[0] };
    // Must win: if last to play and no points, win with the highest; otherwise lowest.
    const sorted = ok.slice().sort((a, b) => rank(a) - rank(b));
    if (g.trick.length === 3 && !pts) return { type: 'play', card: sorted.filter(c => c !== QS).pop() || sorted[0] };
    return { type: 'play', card: sorted.filter(c => c !== QS)[0] || sorted[0] };
  }
  // Void: dump the Queen, then high spades, then the highest heart, then the highest card.
  const order = ok.slice().sort((a, b) => {
    const v = c => (c === QS ? 1000 : suitOf(c) === 'S' && rank(c) > 10 ? 500 + rank(c) : suitOf(c) === 'H' ? 300 + rank(c) : rank(c));
    return v(b) - v(a);
  });
  return { type: 'play', card: order[0] };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, hand: g.hands[seat], legal: legal(g, seat), turn: g.turn, trick: g.trick, lastTrick: g.lastTrick,
    scores: g.scores, taken: g.taken, tricksWon: g.tricksWon, counts: g.hands.map(h => h.length), passDir: g.passDir,
    passed: g.passes[seat], passedAll: g.passes.map(Boolean), received: g.received?.[seat] || null, handNo: g.handNo, trickNo: g.trickNo,
    broken: g.broken, result: g.result, target: g.settings.target, winners: g.winners || null,
  };
}

export function check(g) {
  const n = g.hands.reduce((t, h) => t + h.length, 0) + g.trick.length;
  return n !== (13 - g.trickNo) * 4 && g.phase !== 'trickEnd' ? `card count ${n}` : null;
}

// The table's clock: computer players pass, finished tricks clear, the next hand is dealt.
export function tick(g, players) {
  if (g.phase === 'pass') {
    const s = [0, 1, 2, 3].find(x => !g.passes[x] && players?.[x]?.bot);
    return s == null ? null : { ms: 500, run: () => applyAction(g, s, botAction(g, s)) };
  }
  if (g.phase === 'trickEnd') return { ms: 1500, run: () => advance(g) };
  if (g.phase === 'handEnd') return { ms: 8000, run: () => advance(g) };
  return null;
}
