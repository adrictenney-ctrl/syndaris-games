// Go Fish rules engine + bots. Runs only on the table (host).
// Standard 52-card deck ("AS", "TD", ...). Seats are 0..7 clockwise; empty seats are null.
//
// Rules: 2–3 players are dealt 7 cards, 4 or more get 5; the rest is the pond.
// On your turn, ask one player for a rank you already hold. If they have any, they hand
// over all of them and you go again. If not: "Go fish!" You draw one from the pond; if it's
// the rank you asked for, you show it and go again, otherwise play passes left.
// Four of a kind is a book and goes down on the table right away. If your hand is empty
// on your turn you draw from the pond first. Most books when all 13 are down wins.

export const RANKS = 'A23456789TJQK';
const SUITS = 'SHDC';
export const RANK_NAME = { A: 'Ace', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', T: 'Ten', J: 'Jack', Q: 'Queen', K: 'King' };
export const rankPlural = r => (r === '6' ? 'Sixes' : RANK_NAME[r] + 's');
const rankOf = c => c[0];

function shuffledDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push(r + s);
  const rnd = new Uint32Array(d.length);
  crypto.getRandomValues(rnd);
  for (let i = d.length - 1; i > 0; i--) {
    const j = rnd[i] % (i + 1);
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export const sortHand = hand => hand.slice().sort((a, b) => RANKS.indexOf(rankOf(a)) - RANKS.indexOf(rankOf(b)) || a.localeCompare(b));

const newSeat = () => ({ hand: [], books: [], active: false });

export function createGame(settings, occupied) {
  const g = {
    settings: { motion: false, ...settings },
    seats: occupied.map(o => (o ? newSeat() : null)),
    annId: 0,
    roundNo: 0,
    memory: {}, // rank -> seats known to hold it (from their asks), for the bots
  };
  const taken = g.seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  g.dealer = taken[Math.floor(Math.random() * taken.length)];
  startRound(g);
  return g;
}

// Late arrivals watch this game and are dealt into the next one.
export function addPlayer(g, seat) {
  if (!g.seats[seat]) g.seats[seat] = newSeat();
}

function announce(g, seat, text) {
  g.announce = { id: ++g.annId, seat, text };
}

const active = g => g.seats.map((s, i) => (s?.active ? i : -1)).filter(i => i >= 0);

function nextSeat(g, from) {
  const n = g.seats.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    const s = g.seats[i];
    if (s?.active && (s.hand.length || g.pond.length)) return i;
  }
  return -1;
}

export function startRound(g) {
  g.roundNo++;
  g.seats.forEach(s => { if (s) Object.assign(s, { hand: [], books: [], active: true }); });
  g.pond = shuffledDeck();
  const players = active(g);
  const deal = players.length <= 3 ? 7 : 5;
  for (let k = 0; k < deal; k++) for (const i of players) g.seats[i].hand.push(g.pond.pop());
  for (const i of players) { g.seats[i].hand = sortHand(g.seats[i].hand); takeBooks(g, i, true); }
  g.memory = {};
  g.lastAsk = null;
  g.lastCatch = null;
  g.lastBook = null;
  g.result = null;
  g.winners = null;
  g.dealer = nextSeat(g, g.dealer) >= 0 ? nextSeat(g, g.dealer) : g.dealer;
  beginTurn(g, nextSeat(g, g.dealer));
}

function takeBooks(g, seat, quiet = false) {
  const s = g.seats[seat];
  for (const r of RANKS) {
    if (s.hand.filter(c => rankOf(c) === r).length === 4) {
      s.hand = s.hand.filter(c => rankOf(c) !== r);
      s.books.push(r);
      delete g.memory[r];
      g.lastBook = { id: (g.lastBook?.id || 0) + 1, seat, rank: r };
      if (!quiet) announce(g, seat, `Book of ${rankPlural(r)}!`);
    }
  }
}

const booksDown = g => g.seats.reduce((n, s) => n + (s ? s.books.length : 0), 0);

function beginTurn(g, seat) {
  if (booksDown(g) === 13 || seat < 0) return endGame(g);
  g.turn = seat;
  g.fishFor = null;
  // An empty hand has to be refilled from the pond before asking; so does a turn where
  // nobody else has a card left to ask for.
  const someoneToAsk = g.seats.some((o, i) => i !== seat && o?.active && o.hand.length);
  g.phase = g.seats[seat].hand.length && someoneToAsk ? 'ask' : 'fish';
  if (g.phase === 'fish' && !g.pond.length) {
    if (!someoneToAsk && g.seats[seat].hand.length) return endGame(g); // nothing left to play
    return beginTurn(g, nextSeat(g, seat));
  }
}

function endGame(g) {
  g.phase = 'gameOver';
  g.turn = -1;
  const most = Math.max(...g.seats.map(s => (s ? s.books.length : -1)));
  g.winners = g.seats.map((s, i) => (s && s.books.length === most ? i : -1)).filter(i => i >= 0);
  g.result = { books: most };
}

// Returns an error message, or null if the action was applied.
export function applyAction(g, seat, a) {
  const s = g.seats[seat];
  if (!s || !a) return 'You are not in this game';
  if (g.phase === 'gameOver') return 'The game is over';
  if (!s.active) return "You're dealt in next game";
  if (g.turn !== seat) return 'Not your turn';

  if (a.type === 'ask') {
    if (g.phase !== 'ask') return 'Draw from the pond first';
    const t = g.seats[a.target];
    if (a.target === seat || !t?.active) return 'Ask someone else at the table';
    if (!t.hand.length) return 'They have no cards left';
    if (!s.hand.some(c => rankOf(c) === a.rank)) return 'You can only ask for a rank you already hold';
    (g.memory[a.rank] = g.memory[a.rank] || []).includes(seat) || g.memory[a.rank].push(seat);
    const given = t.hand.filter(c => rankOf(c) === a.rank);
    g.lastAsk = { id: (g.lastAsk?.id || 0) + 1, from: seat, to: a.target, rank: a.rank, got: given.length, cards: given };
    if (given.length) {
      t.hand = t.hand.filter(c => rankOf(c) !== a.rank);
      s.hand = sortHand([...s.hand, ...given]);
      if (g.memory[a.rank]) g.memory[a.rank] = g.memory[a.rank].filter(i => i !== a.target);
      announce(g, a.target, `Hands over ${given.length} ${given.length === 1 ? RANK_NAME[a.rank] : rankPlural(a.rank)}`);
      takeBooks(g, seat);
      beginTurn(g, seat); // go again
    } else {
      announce(g, a.target, 'Go fish!');
      g.phase = 'fish';
      g.fishFor = a.rank;
    }
    return null;
  }

  if (a.type === 'fish') {
    if (g.phase !== 'fish') return 'Ask someone for a card first';
    if (!g.pond.length) {
      announce(g, seat, 'The pond is empty');
      beginTurn(g, nextSeat(g, seat));
      return null;
    }
    const card = g.pond.pop();
    s.hand = sortHand([...s.hand, card]);
    g.lastCatch = { id: (g.lastCatch?.id || 0) + 1, seat, card, wanted: g.fishFor };
    const lucky = g.fishFor && rankOf(card) === g.fishFor;
    const refill = !g.fishFor;
    takeBooks(g, seat);
    if (lucky) {
      announce(g, seat, `Caught the ${RANK_NAME[g.fishFor]}! Go again`);
      beginTurn(g, seat);
    } else if (refill) {
      beginTurn(g, s.hand.length ? seat : nextSeat(g, seat));
    } else {
      beginTurn(g, nextSeat(g, seat));
    }
    return null;
  }

  return "That move isn't allowed";
}

export function advance(g) {
  if (g.phase === 'gameOver') startRound(g);
}

// ---------------------------------------------------------------- views

export function viewFor(g, seat) {
  const s = g.seats[seat];
  return {
    phase: g.phase, seat, turn: g.turn, fishFor: g.fishFor, pond: g.pond.length, roundNo: g.roundNo,
    hand: s ? s.hand : [], active: !!s?.active, motion: !!g.settings.motion,
    askable: s ? [...new Set(s.hand.map(rankOf))] : [],
    seats: g.seats.map(o => o && { n: o.hand.length, books: o.books, active: o.active }),
    lastAsk: g.lastAsk && { ...g.lastAsk, cards: undefined }, lastCatch: g.lastCatch && g.lastCatch.seat === seat ? g.lastCatch : (g.lastCatch && { id: g.lastCatch.id, seat: g.lastCatch.seat }),
    winners: g.winners, result: g.result,
  };
}

// ---------------------------------------------------------------- bots

export function botAction(g, seat) {
  const s = g.seats[seat];
  if (g.phase === 'fish') return { type: 'fish' };
  const counts = {};
  for (const c of s.hand) counts[rankOf(c)] = (counts[rankOf(c)] || 0) + 1;
  const targets = g.seats.map((o, i) => (o?.active && i !== seat && o.hand.length ? i : -1)).filter(i => i >= 0);
  // Someone asked for a rank we hold? They must have it — ask them.
  for (const r of Object.keys(counts)) {
    const known = (g.memory[r] || []).filter(i => targets.includes(i));
    if (known.length && Math.random() < 0.85) return { type: 'ask', target: known[0], rank: r };
  }
  const ranks = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const rank = Math.random() < 0.7 ? ranks[0] : ranks[Math.floor(Math.random() * ranks.length)];
  return { type: 'ask', target: targets[Math.floor(Math.random() * targets.length)], rank };
}
