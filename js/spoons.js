// Spoons: everyone plays at once. Each player holds four cards. The dealer draws from the
// deck; every card you look at, you either keep (swapping one of yours out) or pass on to the
// player on your left. The last player's passes go to the discard pile. Get four of a kind and
// grab a spoon — and once one spoon is gone, everyone scrambles for the rest. There's one spoon
// fewer than players: whoever is left without one takes a letter (S-P-O-O-N). Spell it and
// you're out. Last player in wins. Grabbing too early (no four of a kind, no spoon gone yet)
// costs you a letter.

export const WORD = 'SPOON';
const RANKS = 'A23456789TJQK';
const rankOf = c => c[0];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const fullDeck = () => shuffle([...RANKS].flatMap(r => [...'SHDC'].map(s => r + s)));

export const isQuads = hand => hand.length === 4 && hand.every(c => rankOf(c) === rankOf(hand[0]));

export function createGame(settings, players) {
  const g = {
    settings: { ...settings },
    seats: players.map(p => !!p),
    letters: players.map(() => 0),
    out: players.map(() => false),
    round: 0, dealerIdx: -1, annId: 0, log: [],
  };
  startRound(g);
  return g;
}

// Active players in seat order.
export const active = g => g.seats.map((x, i) => (x && !g.out[i] ? i : -1)).filter(i => i >= 0);

export function startRound(g) {
  const order = active(g);
  g.round++;
  g.dealerIdx = (g.dealerIdx + 1) % order.length;
  // Seats passing order starts with the dealer.
  g.order = [...order.slice(g.dealerIdx), ...order.slice(0, g.dealerIdx)];
  g.deck = fullDeck();
  g.discard = [];
  g.hands = g.seats.map(() => []);
  g.queue = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.deck.splice(0, 4);
  g.spoons = g.order.length - 1;
  g.grabbed = [];
  g.phase = 'play';
  g.loser = null;
  g.started = Date.now();
  g.nextAt = 0;
  g.passId = 0;
}

const dealer = g => g.order[0];
const nextOf = (g, s) => { const i = g.order.indexOf(s); return i === g.order.length - 1 ? null : g.order[i + 1]; };

// The card waiting for this player to look at (the dealer's comes off the deck).
export function incoming(g, s) {
  if (g.queue[s].length) return g.queue[s][0];
  if (s === dealer(g)) {
    if (!g.deck.length) { g.deck = shuffle(g.discard); g.discard = []; }
    if (g.deck.length) { g.queue[s].push(g.deck.pop()); return g.queue[s][0]; }
  }
  return null;
}

function passOn(g, s, card) {
  const n = nextOf(g, s);
  if (n == null) g.discard.push(card);
  else g.queue[n].push(card);
  g.passId++;
}

function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next round';
  if (!g.order.includes(seat)) return "You're not in this round";
  if (a.type === 'grab') {
    if (g.grabbed.includes(seat)) return 'You already have a spoon';
    if (!g.grabbed.length && !isQuads(g.hands[seat])) {
      // Too early: a letter, and the round goes on.
      g.letters[seat]++;
      announce(g, seat, `Too early! ${WORD.slice(0, g.letters[seat])}`);
      if (g.letters[seat] >= WORD.length) endRound(g, seat, false);
      return null;
    }
    g.grabbed.push(seat);
    announce(g, seat, g.grabbed.length === 1 ? (isQuads(g.hands[seat]) ? 'Four of a kind! 🥄' : '🥄') : '🥄');
    if (g.grabbed.length >= g.spoons) endRound(g, g.order.find(s => !g.grabbed.includes(s)));
    return null;
  }
  const card = incoming(g, seat);
  if (a.type === 'pass') {
    if (!card) return 'No card to look at yet';
    g.queue[seat].shift();
    passOn(g, seat, card);
    return null;
  }
  if (a.type === 'swap') {
    if (!card) return 'No card to look at yet';
    const i = g.hands[seat].indexOf(a.card);
    if (i < 0) return "That card isn't in your hand";
    g.queue[seat].shift();
    g.hands[seat][i] = card;
    passOn(g, seat, a.card);
    return null;
  }
  return "That move isn't allowed";
}

function endRound(g, loser, addLetter = true) {
  g.phase = 'roundOver';
  g.loser = loser;
  if (loser != null) {
    if (addLetter) g.letters[loser]++;
    if (g.letters[loser] >= WORD.length) g.out[loser] = true;
    announce(g, loser, g.out[loser] ? `${WORD} — out!` : `No spoon · ${WORD.slice(0, g.letters[loser])}`);
  }
  g.nextAt = Date.now() + 5000;
  if (active(g).length <= 1) { g.phase = 'over'; g.winner = active(g)[0] ?? null; }
}

export function advance(g) {
  if (g.phase === 'roundOver' && Date.now() >= g.nextAt) { startRound(g); return true; }
  return false;
}

export function viewFor(g, seat) {
  const inRound = g.order.includes(seat);
  return {
    phase: g.phase, round: g.round, seats: g.seats, letters: g.letters, out: g.out, order: g.order,
    hand: inRound ? g.hands[seat].slice() : [],
    incoming: inRound && g.phase === 'play' ? incoming(g, seat) : null,
    waiting: inRound ? g.queue[seat].length : 0,
    spoons: g.spoons, grabbed: g.grabbed, mine: g.grabbed.includes(seat),
    dealer: g.order[0], loser: g.loser, winner: g.winner ?? null, inRound, nextAt: g.nextAt,
    quads: inRound && isQuads(g.hands[seat]),
  };
}

// ---------------------------------------------------------------- bots

// Keep the rank you hold most of; pass anything else.
function botStep(g, s) {
  const hand = g.hands[s];
  if (isQuads(hand) && !g.grabbed.includes(s)) return { type: 'grab' };
  const card = incoming(g, s);
  if (!card) return null;
  const count = r => hand.filter(c => rankOf(c) === r).length;
  const best = [...new Set(hand.map(rankOf))].sort((a, b) => count(b) - count(a))[0];
  const stall = (g.stall ||= {});
  let want = count(rankOf(card)) > count(best) || (rankOf(card) === best) ||
    (count(rankOf(card)) === count(best) && count(best) === 1 && Math.random() < 0.3);
  // Stuck chasing a rank someone else is hoarding? Start collecting something else.
  if (!want && (stall[s] = (stall[s] || 0) + 1) > 30) want = true;
  if (!want) return { type: 'pass' };
  stall[s] = 0;
  // Throw away a card of the weakest rank.
  const keep = rankOf(card) === best || count(rankOf(card)) > count(best) || count(best) === 1 ? (rankOf(card) === best ? best : rankOf(card)) : rankOf(card);
  const throwAway = hand.filter(c => rankOf(c) !== keep).sort((a, b) => count(rankOf(a)) - count(rankOf(b)))[0];
  return throwAway ? { type: 'swap', card: throwAway } : { type: 'pass' };
}

// Bots act together on a clock tick: each looks at a card or reaches for a spoon.
export function botsTick(g, players) {
  if (g.phase !== 'play') return;
  for (const s of g.order) {
    if (!players[s]?.bot || g.phase !== 'play') continue;
    if (g.grabbed.length && !g.grabbed.includes(s)) {
      // Someone's grabbed! Bots notice after a moment.
      if (Math.random() < 0.28) applyAction(g, s, { type: 'grab' });
      continue;
    }
    if (g.grabbed.includes(s)) continue;
    if (Math.random() < 0.25) continue;      // a bit of hesitation
    const a = botStep(g, s);
    if (a) applyAction(g, s, a);
  }
}
