// Euchre rules engine + bots. Runs only on the table (host) device;
// phones receive a per-seat view from viewFor() and send actions back.
//
// Seats: 0 = South (bottom edge of the table screen), 1 = West, 2 = North, 3 = East.
// Play goes clockwise 0 → 1 → 2 → 3. Partners sit across: 0 & 2, 1 & 3.
// Cards are two-char strings: rank (9 T J Q K A) + suit (S H D C), e.g. "JH".

export const SUITS = ['S', 'H', 'D', 'C'];
export const RANKS = ['9', 'T', 'J', 'Q', 'K', 'A'];
// ︎ forces text (not emoji) rendering on iOS.
export const SUIT_SYMBOL = { S: '♠︎', H: '♥︎', D: '♦︎', C: '♣︎' };
export const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const RANK_LABEL = { '9': '9', T: '10', J: 'J', Q: 'Q', K: 'K', A: 'A' };
export const SEAT_NAME = ['South', 'West', 'North', 'East'];

export const rankOf = c => c[0];
export const suitOf = c => c[1];
export const isRed = s => s === 'H' || s === 'D';
export const sameColorSuit = s => ({ S: 'C', C: 'S', H: 'D', D: 'H' })[s];
export const partnerOf = seat => (seat + 2) % 4;
export const teamOf = seat => seat % 2;
export const cardLabel = c => RANK_LABEL[rankOf(c)] + SUIT_SYMBOL[suitOf(c)];

// The left bower (jack of the same colour as trump) belongs to the trump suit.
export function effSuit(card, trump) {
  if (trump && rankOf(card) === 'J' && suitOf(card) === sameColorSuit(trump)) return trump;
  return suitOf(card);
}
export const isTrump = (card, trump) => !!trump && effSuit(card, trump) === trump;

// Strength of a card within a trick. Cards that neither follow the led suit nor trump score 0.
export function power(card, trump, led) {
  const r = rankOf(card), s = suitOf(card);
  if (trump) {
    if (r === 'J' && s === trump) return 200;
    if (r === 'J' && s === sameColorSuit(trump)) return 199;
    if (s === trump) return 100 + RANKS.indexOf(r);
  }
  if (effSuit(card, trump) === led) return 10 + RANKS.indexOf(r);
  return 0;
}

export function legalCards(hand, trump, led) {
  if (!led) return hand.slice();
  const follow = hand.filter(c => effSuit(c, trump) === led);
  return follow.length ? follow : hand.slice();
}

export function trickWinner(trick, trump) {
  const led = effSuit(trick[0].card, trump);
  let best = trick[0];
  for (const p of trick) if (power(p.card, trump, led) > power(best.card, trump, led)) best = p;
  return best.seat;
}

// Group by suit (trump first) with alternating colours, highest first within a suit.
export function sortHand(hand, trump) {
  const lead = trump || 'S';
  const opp = SUITS.filter(s => isRed(s) !== isRed(lead));
  const order = [lead, opp[0], sameColorSuit(lead), opp[1]];
  return hand.slice().sort((a, b) => {
    const sa = order.indexOf(effSuit(a, trump)), sb = order.indexOf(effSuit(b, trump));
    if (sa !== sb) return sa - sb;
    const su = effSuit(a, trump);
    return power(b, trump, su) - power(a, trump, su);
  });
}

function newDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push(r + s);
  return d;
}

function shuffle(a) {
  const rnd = new Uint32Array(a.length);
  crypto.getRandomValues(rnd);
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd[i] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- game flow

export function createGame(settings) {
  const g = {
    settings: { target: 10, stickDealer: true, ...settings },
    score: [0, 0],
    dealer: Math.floor(Math.random() * 4),
    handNo: 0,
    annId: 0,
  };
  startHand(g);
  return g;
}

function announce(g, seat, text) {
  g.announce = { id: ++g.annId, seat, text };
}

export function startHand(g) {
  const deck = shuffle(newDeck());
  g.hands = [0, 1, 2, 3].map(i => sortHand(deck.slice(i * 5, i * 5 + 5), null));
  g.upcard = deck[20];
  g.kitty = deck.slice(21);
  g.handNo++;
  g.phase = 'bid1';
  g.turn = (g.dealer + 1) % 4;
  g.trump = null;
  g.maker = null;
  g.alone = null;
  g.upcardDown = false;
  g.upcardTaken = false;
  g.trick = [];
  g.tricksWon = [0, 0, 0, 0];
  g.trickWinner = null;
  g.lastTrick = null;
  g.result = null;
}

function nextActive(g, seat) {
  let n = (seat + 1) % 4;
  if (g.alone !== null && n === partnerOf(g.alone)) n = (n + 1) % 4;
  return n;
}

const activeCount = g => (g.alone !== null ? 3 : 4);

function startPlay(g) {
  g.hands = g.hands.map(h => sortHand(h, g.trump));
  g.phase = 'play';
  g.trick = [];
  g.turn = nextActive(g, g.dealer);
}

function setTrump(g, seat, suit, alone) {
  g.trump = suit;
  g.maker = seat;
  g.alone = alone ? seat : null;
}

// Returns an error message, or null if the action was applied.
export function applyAction(g, seat, a) {
  if (!a || g.turn !== seat) return 'Not your turn';
  const hand = g.hands[seat];

  if (g.phase === 'bid1') {
    if (a.type === 'pass') {
      announce(g, seat, 'Pass');
      if (seat === g.dealer) {
        g.phase = 'bid2';
        g.upcardDown = true;
        g.turn = (g.dealer + 1) % 4;
      } else g.turn = (seat + 1) % 4;
      return null;
    }
    if (a.type === 'order') {
      const suit = suitOf(g.upcard);
      setTrump(g, seat, suit, a.alone);
      const verb = seat === g.dealer ? 'Picking it up' : 'Pick it up!';
      announce(g, seat, `${verb} ${SUIT_SYMBOL[suit]}${a.alone ? ' — ALONE' : ''}`);
      if (g.alone !== null && partnerOf(seat) === g.dealer) {
        // Dealer is sitting out, so the up-card stays in the kitty.
        g.upcardDown = true;
        startPlay(g);
      } else {
        g.hands[g.dealer] = sortHand([...g.hands[g.dealer], g.upcard], g.trump);
        g.upcardTaken = true;
        g.phase = 'discard';
        g.turn = g.dealer;
      }
      return null;
    }
  }

  if (g.phase === 'discard' && a.type === 'discard') {
    const i = hand.indexOf(a.card);
    if (i < 0) return 'That card is not in your hand';
    hand.splice(i, 1);
    g.kitty.push(a.card);
    startPlay(g);
    return null;
  }

  if (g.phase === 'bid2') {
    if (a.type === 'pass') {
      if (seat === g.dealer) {
        if (g.settings.stickDealer) return 'Stick the dealer — you have to call trump';
        announce(g, seat, 'Pass — redeal');
        g.dealer = (g.dealer + 1) % 4;
        startHand(g);
        return null;
      }
      announce(g, seat, 'Pass');
      g.turn = (seat + 1) % 4;
      return null;
    }
    if (a.type === 'call') {
      if (!SUITS.includes(a.suit) || a.suit === suitOf(g.upcard)) return 'Pick a different suit';
      setTrump(g, seat, a.suit, a.alone);
      announce(g, seat, `${SUIT_NAME[a.suit]} ${SUIT_SYMBOL[a.suit]}${a.alone ? ' — ALONE' : ''}`);
      startPlay(g);
      return null;
    }
  }

  if (g.phase === 'play' && a.type === 'play') {
    const i = hand.indexOf(a.card);
    if (i < 0) return 'That card is not in your hand';
    const led = g.trick.length ? effSuit(g.trick[0].card, g.trump) : null;
    if (!legalCards(hand, g.trump, led).includes(a.card)) return `You have to follow suit (${SUIT_NAME[led]})`;
    hand.splice(i, 1);
    g.trick.push({ seat, card: a.card });
    if (g.trick.length === activeCount(g)) {
      const w = trickWinner(g.trick, g.trump);
      g.tricksWon[w]++;
      g.trickWinner = w;
      g.phase = 'trickEnd';
      g.turn = -1;
      announce(g, w, 'Takes the trick');
    } else {
      g.turn = nextActive(g, seat);
    }
    return null;
  }

  return "That move isn't allowed right now";
}

// Moves past timed pauses (a finished trick, the end-of-hand summary).
export function advance(g) {
  if (g.phase === 'trickEnd') {
    g.lastTrick = { cards: g.trick, winner: g.trickWinner };
    g.trick = [];
    if (g.tricksWon.reduce((a, b) => a + b, 0) === 5) return scoreHand(g);
    g.phase = 'play';
    g.turn = g.trickWinner;
    g.trickWinner = null;
  } else if (g.phase === 'handEnd') {
    g.dealer = (g.dealer + 1) % 4;
    startHand(g);
  }
}

function scoreHand(g) {
  const makerTeam = teamOf(g.maker);
  const makerTricks = g.tricksWon[g.maker] + g.tricksWon[partnerOf(g.maker)];
  const r = { makerTeam, makerTricks, alone: g.alone !== null, euchred: false, march: false };
  if (makerTricks >= 3) {
    r.team = makerTeam;
    r.march = makerTricks === 5;
    r.pts = r.march ? (r.alone ? 4 : 2) : 1;
  } else {
    r.team = 1 - makerTeam;
    r.euchred = true;
    r.pts = 2;
  }
  g.score[r.team] += r.pts;
  g.result = r;
  g.turn = -1;
  g.trickWinner = null;
  if (g.score[r.team] >= g.settings.target) {
    g.phase = 'gameOver';
    g.winner = r.team;
  } else g.phase = 'handEnd';
}

// What one player's phone is allowed to see.
export function viewFor(g, seat) {
  const myTurn = g.turn === seat;
  let legal = [];
  if (myTurn && g.phase === 'play') {
    legal = legalCards(g.hands[seat], g.trump, g.trick.length ? effSuit(g.trick[0].card, g.trump) : null);
  } else if (myTurn && g.phase === 'discard') legal = g.hands[seat].slice();
  return {
    phase: g.phase, seat, hand: g.hands[seat], legal, turn: g.turn, dealer: g.dealer,
    upcard: g.upcard, upcardDown: g.upcardDown, trump: g.trump, maker: g.maker, alone: g.alone,
    trick: g.trick, tricksWon: g.tricksWon, score: g.score, trickWinner: g.trickWinner,
    target: g.settings.target, stickDealer: g.settings.stickDealer,
    result: g.result, winner: g.winner ?? null, handNo: g.handNo,
  };
}

// ---------------------------------------------------------------- bots

function cardValue(c, trump) {
  const r = rankOf(c);
  if (isTrump(c, trump)) {
    if (r === 'J') return suitOf(c) === trump ? 3 : 2.6;
    return { A: 2, K: 1.6, Q: 1.3, T: 1.1, '9': 1 }[r];
  }
  return r === 'A' ? 1 : r === 'K' ? 0.35 : 0;
}

function handScore(hand, trump) {
  let s = hand.reduce((a, c) => a + cardValue(c, trump), 0);
  const trumps = hand.filter(c => isTrump(c, trump)).length;
  const offSuits = new Set(hand.filter(c => !isTrump(c, trump)).map(c => effSuit(c, trump)));
  if (trumps >= 2) s += (3 - offSuits.size) * 0.6;
  return s;
}

// Low value = first to throw away. Off-suit junk before trump, singletons before pairs.
function throwOrder(hand, trump) {
  const off = hand.filter(c => !isTrump(c, trump));
  const count = s => off.filter(c => effSuit(c, trump) === s).length;
  const val = c => isTrump(c, trump)
    ? 50 + power(c, trump, trump)
    : RANKS.indexOf(rankOf(c)) + (rankOf(c) === 'A' ? 5 : 0) - (count(suitOf(c)) === 1 ? 2 : 0);
  return hand.slice().sort((a, b) => val(a) - val(b));
}

const lowest = (cards, trump) =>
  cards.slice().sort((a, b) =>
    (isTrump(a, trump) ? 50 + power(a, trump, trump) : RANKS.indexOf(rankOf(a))) -
    (isTrump(b, trump) ? 50 + power(b, trump, trump) : RANKS.indexOf(rankOf(b))))[0];

export function botAction(g, seat) {
  const hand = g.hands[seat];

  if (g.phase === 'bid1') {
    const t = suitOf(g.upcard);
    let s;
    if (seat === g.dealer) {
      const six = [...hand, g.upcard];
      const drop = throwOrder(six, t)[0];
      s = handScore(six.filter(c => c !== drop), t);
    } else {
      const v = cardValue(g.upcard, t) * 0.8;
      s = handScore(hand, t) + (partnerOf(seat) === g.dealer ? v : -v);
    }
    return s >= 6.2 ? { type: 'order', alone: s >= 10.5 } : { type: 'pass' };
  }

  if (g.phase === 'discard') return { type: 'discard', card: throwOrder(hand, g.trump)[0] };

  if (g.phase === 'bid2') {
    let best = null, bestS = -1;
    for (const suit of SUITS) {
      if (suit === suitOf(g.upcard)) continue;
      const s = handScore(hand, suit);
      if (s > bestS) { bestS = s; best = suit; }
    }
    const stuck = seat === g.dealer && g.settings.stickDealer;
    return bestS >= 6 || stuck ? { type: 'call', suit: best, alone: bestS >= 10.5 } : { type: 'pass' };
  }

  if (g.phase === 'play') {
    const t = g.trump;
    const led = g.trick.length ? effSuit(g.trick[0].card, t) : null;
    const legal = legalCards(hand, t, led);
    if (!led) return { type: 'play', card: botLead(g, seat, legal) };

    const winSeat = trickWinner(g.trick, t);
    const best = power(g.trick.find(p => p.seat === winSeat).card, t, led);
    const lastToPlay = g.trick.length === activeCount(g) - 1;
    const partnerWinning = teamOf(winSeat) === teamOf(seat);
    if (partnerWinning && (lastToPlay || best >= 100 || best === 15)) return { type: 'play', card: lowest(legal, t) };
    const winners = legal.filter(c => power(c, t, led) > best).sort((a, b) => power(a, t, led) - power(b, t, led));
    return { type: 'play', card: winners.length ? winners[0] : lowest(legal, t) };
  }
  return null;
}

function botLead(g, seat, legal) {
  const t = g.trump;
  const trumps = legal.filter(c => isTrump(c, t)).sort((a, b) => power(b, t, t) - power(a, t, t));
  const ourCall = teamOf(g.maker) === teamOf(seat);
  if (ourCall && trumps.length && (power(trumps[0], t, t) >= 199 || trumps.length >= 3 || g.alone === seat)) return trumps[0];
  const aces = legal.filter(c => !isTrump(c, t) && rankOf(c) === 'A');
  if (aces.length) return aces[0];
  if (ourCall && trumps.length >= 2) return trumps[0];
  const off = legal.filter(c => !isTrump(c, t));
  return lowest(off.length ? off : legal, t);
}
