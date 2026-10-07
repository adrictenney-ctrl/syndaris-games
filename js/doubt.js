// I Doubt It (also called Cheat): the whole deck is dealt out. Players take turns laying
// 1–4 cards face down, claiming they're all the rank that's up — Aces, then Twos, Threes…
// Kings, then Aces again. Lying is allowed. After each play, anyone else can call
// "I doubt it!" before the clock runs out. The cards are turned over: if the claim was a lie,
// the player who laid them picks up the whole pile; if it was true, the doubter does. First
// player to get rid of every card (and survive the doubt) wins.

export const RANKS = 'A23456789TJQK';
export const RANK_NAME = { A: 'Ace', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', T: 'Ten', J: 'Jack', Q: 'Queen', K: 'King' };
export const plural = r => (r === '6' ? 'Sixes' : RANK_NAME[r] + 's');
export const claimText = (n, r) => `${['', 'One', 'Two', 'Three', 'Four'][n]} ${n === 1 ? RANK_NAME[r] : plural(r)}`;
const rankOf = c => c[0];
export const sortHand = h => h.slice().sort((a, b) => RANKS.indexOf(rankOf(a)) - RANKS.indexOf(rankOf(b)) || a.localeCompare(b));

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = {
    settings: { window: 6, ...settings },
    seats: players.map(p => !!p),
    annId: 0, playId: 0,
  };
  deal(g);
  return g;
}

function deal(g) {
  const order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const deck = shuffle([...RANKS].flatMap(r => [...'SHDC'].map(s => r + s)));
  g.hands = g.seats.map(() => []);
  deck.forEach((c, i) => g.hands[order[i % order.length]].push(c));
  g.order = order;
  g.pile = [];
  g.rankIdx = 0;
  g.turn = order[Math.floor(Math.random() * order.length)];
  g.phase = 'play';
  g.last = null;          // { seat, cards, claim, n, id }
  g.reveal = null;        // { doubter, liar, truthful, cards, took, n }
  g.winner = null;
  g.deadline = 0;
}

export const required = g => RANKS[g.rankIdx % 13];
const nextSeat = (g, s) => { const i = g.order.indexOf(s); return g.order[(i + 1) % g.order.length]; };
function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (a.type === 'play') {
    if (g.phase !== 'play' && !(g.phase === 'doubt' && seat === g.turn)) return 'Wait a moment';
    if (seat !== g.turn) return "It isn't your turn";
    if (g.phase === 'doubt') settleNoDoubt(g);      // playing on closes the window
    if (g.turn !== seat || g.phase !== 'play') return "It isn't your turn";
    const cards = Array.isArray(a.cards) ? [...new Set(a.cards)] : [];
    if (cards.length < 1 || cards.length > 4) return 'Play one to four cards';
    if (!cards.every(c => g.hands[seat].includes(c))) return "Those cards aren't in your hand";
    g.hands[seat] = g.hands[seat].filter(c => !cards.includes(c));
    g.pile.push(...cards);
    const claim = required(g);
    g.last = { seat, cards, claim, n: cards.length, id: ++g.playId };
    announce(g, seat, claimText(cards.length, claim));
    g.rankIdx++;
    g.phase = 'doubt';
    g.deadline = Date.now() + g.settings.window * 1000;
    g.turn = nextSeat(g, seat);
    g.botDoubt = null;
    return null;
  }
  if (a.type === 'doubt') {
    if (g.phase !== 'doubt' || !g.last) return 'Nothing to doubt right now';
    if (seat === g.last.seat) return "You can't doubt yourself";
    if (!g.order.includes(seat)) return "You're not in this game";
    const truthful = g.last.cards.every(c => rankOf(c) === g.last.claim);
    const taker = truthful ? seat : g.last.seat;
    const took = g.pile.length;
    g.hands[taker].push(...g.pile);
    g.reveal = { doubter: seat, liar: g.last.seat, truthful, cards: g.last.cards, claim: g.last.claim, taker, took, id: g.playId };
    g.pile = [];
    announce(g, seat, 'I doubt it!');
    g.phase = 'reveal';
    g.deadline = Date.now() + 4200;
    return null;
  }
  return "That move isn't allowed";
}

// Nobody doubted in time.
function settleNoDoubt(g) {
  g.phase = 'play';
  const s = g.last?.seat;
  if (s != null && !g.hands[s].length) { g.phase = 'over'; g.winner = s; announce(g, s, 'Out of cards!'); }
}

export function advance(g) {
  if (g.phase === 'doubt' && Date.now() >= g.deadline) { settleNoDoubt(g); return true; }
  if (g.phase === 'reveal' && Date.now() >= g.deadline) {
    g.phase = 'play';
    // A truthful last play that emptied a hand still wins.
    const s = g.reveal.liar;
    if (g.reveal.truthful && !g.hands[s].length) { g.phase = 'over'; g.winner = s; }
    g.reveal = null;
    return true;
  }
  return false;
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, order: g.order, required: required(g), pile: g.pile.length,
    hand: g.hands[seat] ? sortHand(g.hands[seat]) : [],
    counts: g.hands.map(h => h.length), last: g.last && { seat: g.last.seat, n: g.last.n, claim: g.last.claim, id: g.last.id },
    reveal: g.reveal, deadline: g.deadline, window: g.settings.window, winner: g.winner,
    canDoubt: g.phase === 'doubt' && g.last && g.last.seat !== seat && g.order.includes(seat),
  };
}

// ---------------------------------------------------------------- bots

export function botAction(g, seat) {
  const hand = g.hands[seat];
  const r = required(g);
  const real = hand.filter(c => rankOf(c) === r);
  let cards;
  if (real.length) {
    cards = real.slice(0, 4);
    // Sometimes slip in an extra card with the truth.
    if (cards.length < 3 && hand.length > cards.length + 1 && Math.random() < 0.3) {
      const extra = hand.filter(c => rankOf(c) !== r)[0];
      if (extra) cards.push(extra);
    }
  } else {
    // Bluff with the cards least likely to be needed soon (furthest from coming up).
    const dist = c => (RANKS.indexOf(rankOf(c)) - (g.rankIdx % 13) + 13) % 13;
    const pool = hand.slice().sort((a, b) => dist(b) - dist(a));
    cards = pool.slice(0, Math.random() < 0.7 ? 1 : 2);
  }
  return { type: 'play', cards };
}

// After each play, decide whether any bot will call it, and when.
export function planBotDoubt(g, players) {
  if (g.phase !== 'doubt' || g.botDoubt !== null) return;
  g.botDoubt = false;
  const L = g.last;
  for (const s of shuffle(g.order.slice())) {
    if (s === L.seat || !players[s]?.bot) continue;
    const mine = g.hands[s].filter(c => rankOf(c) === L.claim).length;
    let p = 0.12;
    if (mine + L.n > 4) p = 1;                          // impossible claim
    else {
      p += (mine + L.n - 2) * 0.12;                    // the more of that rank I see, the less likely
      if (L.n >= 3) p += 0.12;
      if (g.hands[L.seat].length === 0) p += 0.6;      // they'd win — always worth a look
      else if (g.hands[L.seat].length <= 2) p += 0.2;
      if (g.pile.length > 12) p -= 0.08;               // a big pile is a big risk
    }
    if (Math.random() < p) {
      g.botDoubt = { seat: s, at: Date.now() + 900 + Math.random() * Math.min(2600, g.settings.window * 1000 - 1400) };
      return;
    }
  }
}
