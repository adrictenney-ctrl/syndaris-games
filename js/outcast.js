// Outcast: shedding-game rules engine (UNO-style play) + bots. Runs only on the table (host).
// Cards are "colour-value-n": colour R O T P (red, gold, teal, plum; W for wilds), value 0–9, skip, rev, d2, wild, d4,
// and n makes each of the 108 cards unique. Seats are 0..7 clockwise; empty seats are null.

export const COLORS = ['R', 'O', 'T', 'P'];
export const COLOR_NAME = { R: 'Red', O: 'Gold', T: 'Teal', P: 'Plum' };
const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'rev', 'd2', 'wild', 'd4'];

export const parse = id => {
  const [c, v] = id.split('-');
  return { c, v };
};
export const points = id => {
  const { v } = parse(id);
  return /^\d$/.test(v) ? Number(v) : v === 'wild' || v === 'd4' ? 50 : 20;
};
export const cardName = id => {
  const { c, v } = parse(id);
  const val = { skip: 'Skip', rev: 'Reverse', d2: 'Draw Two', wild: 'Wild', d4: 'Wild Draw Four' }[v] || v;
  return c === 'W' ? val : `${COLOR_NAME[c]} ${val}`;
};

function buildDeck() {
  const d = [];
  let n = 0;
  for (const c of COLORS) {
    d.push(`${c}-0-${n++}`);
    for (const v of VALUES.slice(1, 13)) for (let k = 0; k < 2; k++) d.push(`${c}-${v}-${n++}`);
  }
  for (let k = 0; k < 4; k++) { d.push(`W-wild-${n++}`); d.push(`W-d4-${n++}`); }
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

export function sortHand(hand) {
  const co = { R: 0, O: 1, T: 2, P: 3, W: 4 };
  return hand.slice().sort((a, b) => {
    const A = parse(a), B = parse(b);
    return co[A.c] - co[B.c] || VALUES.indexOf(A.v) - VALUES.indexOf(B.v);
  });
}

const newSeat = () => ({ hand: [], score: 0, active: false, called: false });

// ---------------------------------------------------------------- flow

export function createGame(settings, occupied) {
  const g = {
    settings: { target: 0, stacking: false, ...settings },
    seats: occupied.map(o => (o ? newSeat() : null)),
    roundNo: 0,
    annId: 0,
    dealer: -1,
  };
  const taken = g.seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  g.dealer = taken[Math.floor(Math.random() * taken.length)];
  startRound(g);
  return g;
}

export function addPlayer(g, seat) {
  if (!g.seats[seat]) g.seats[seat] = newSeat(); // dealt in next round
}

function announce(g, seat, text) {
  g.announce = { id: ++g.annId, seat, text };
}

const activeSeats = g => g.seats.map((s, i) => (s?.active ? i : -1)).filter(i => i >= 0);

function step(g, from) {
  const n = g.seats.length;
  let i = from;
  for (let k = 0; k < n; k++) {
    i = (i + g.dir + n) % n;
    if (g.seats[i]?.active) return i;
  }
  return from;
}

function draw(g, seat, count) {
  const got = [];
  for (let k = 0; k < count; k++) {
    if (!g.deck.length) {
      const top = g.discard.pop();
      g.deck = shuffle(g.discard);
      g.discard = [top];
    }
    if (!g.deck.length) break; // every card is in someone's hand
    got.push(g.deck.pop());
  }
  const s = g.seats[seat];
  s.hand = sortHand([...s.hand, ...got]);
  if (s.hand.length > 1) s.called = false;
  g.drawn = { id: (g.drawn?.id || 0) + 1, seat, count: got.length };
  return got;
}

export function startRound(g) {
  g.roundNo++;
  g.seats.forEach(s => { if (s) Object.assign(s, { hand: [], active: true, called: false }); });
  g.dir = 1;
  g.dealer = step(g, g.dealer);
  g.deck = shuffle(buildDeck());
  g.discard = [];
  g.pending = 0;
  g.drew = null;
  g.vulnerable = null;
  g.catchChecked = true;
  g.result = null;
  g.lastPlay = null;
  for (let k = 0; k < 7; k++) for (const i of activeSeats(g)) g.seats[i].hand.push(g.deck.pop());
  g.seats.forEach(s => { if (s) s.hand = sortHand(s.hand); });

  // Turn up the first card. A Wild Draw Four goes back in the deck.
  let first = g.deck.pop();
  while (parse(first).v === 'd4') {
    g.deck.splice(Math.floor(Math.random() * g.deck.length), 0, first);
    first = g.deck.pop();
  }
  g.discard.push(first);
  const { c, v } = parse(first);
  g.color = c === 'W' ? null : c; // a Wild lets the first player play anything
  g.phase = 'play';
  g.turn = step(g, g.dealer);
  if (v === 'skip') g.turn = step(g, g.turn);
  else if (v === 'rev') { g.dir = -1; g.turn = activeSeats(g).length === 2 ? step(g, g.dealer) : g.dealer; }
  else if (v === 'd2') { draw(g, g.turn, 2); g.turn = step(g, g.turn); }
}

export function canPlay(g, hand, id) {
  const { c, v } = parse(id);
  if (g.pending > 0) return v === 'd4' || (v === 'd2' && g.pendingType === 'd2');
  if (c === 'W') return v === 'wild' || !g.color || !hand.some(h => parse(h).c === g.color);
  if (!g.color) return true;
  const top = parse(g.discard[g.discard.length - 1]);
  return c === g.color || (top.c !== 'W' && v === top.v);
}

// Returns an error message, or null if the action was applied.
export function applyAction(g, seat, a) {
  const s = g.seats[seat];
  if (!s || !a) return 'You are not in this game';
  if (g.phase !== 'play') return 'Wait for the next round';

  // Calling "last card" and catching someone who forgot aren't tied to whose turn it is.
  if (a.type === 'call') {
    if (s.hand.length === 1 && g.vulnerable === seat) g.vulnerable = null;
    else if (!(s.hand.length === 2 && g.turn === seat)) return 'Call it when you are about to play your second-to-last card';
    s.called = true;
    announce(g, seat, 'Last card!');
    return null;
  }
  if (a.type === 'catch') {
    if (g.vulnerable !== a.target || a.target === seat) return 'Too late, they are safe';
    g.vulnerable = null;
    draw(g, a.target, 2);
    announce(g, a.target, 'Caught! +2 cards');
    return null;
  }

  if (!s.active) return "You're in next round";
  if (g.turn !== seat) return 'Not your turn';
  g.vulnerable = null; // the chance to catch someone ends when the next player acts
  g.catchChecked = true;

  if (a.type === 'draw') {
    if (g.drew) return 'Play the card you drew, or keep it';
    if (g.pending) {
      const n = g.pending;
      draw(g, seat, n);
      g.pending = 0;
      g.pendingType = null;
      announce(g, seat, `Draws ${n}`);
      g.turn = step(g, seat);
      return null;
    }
    const [card] = draw(g, seat, 1);
    if (card && canPlay(g, s.hand, card)) { g.drew = card; announce(g, seat, 'Draws a card'); }
    else { announce(g, seat, 'Draws · no play'); g.turn = step(g, seat); }
    return null;
  }

  if (a.type === 'pass') {
    if (!g.drew) return 'Draw a card first';
    g.drew = null;
    announce(g, seat, 'Keeps it');
    g.turn = step(g, seat);
    return null;
  }

  if (a.type !== 'play') return "That move isn't allowed";
  const idx = s.hand.indexOf(a.card);
  if (idx < 0) return 'That card is not in your hand';
  if (g.drew && a.card !== g.drew) return 'You can only play the card you just drew';
  if (!canPlay(g, s.hand, a.card)) {
    const { v } = parse(a.card);
    if (g.pending) return `Play a draw card or take ${g.pending}`;
    if (v === 'd4') return `You can only play Wild Draw Four when you have no ${COLOR_NAME[g.color]} cards`;
    return `Play ${COLOR_NAME[g.color]} or match the number`;
  }
  const { c, v } = parse(a.card);
  if (c === 'W' && !COLORS.includes(a.color)) return 'Pick a colour for your wild';

  s.hand.splice(idx, 1);
  g.discard.push(a.card);
  g.drew = null;
  g.color = c === 'W' ? a.color : c;
  g.lastPlay = { seat, card: a.card, id: (g.lastPlay?.id || 0) + 1 };
  if (s.hand.length === 1) {
    if (!s.called) { g.vulnerable = seat; g.catchChecked = false; }
  } else s.called = false;

  const next = step(g, seat);
  const two = activeSeats(g).length === 2;
  let msg = c === 'W' ? `${COLOR_NAME[g.color]}!` : '';
  if (v === 'skip') { g.turn = step(g, next); msg = 'Skip!'; }
  else if (v === 'rev') { g.dir *= -1; g.turn = two ? seat : step(g, seat); msg = 'Reverse!'; }
  else if (v === 'd2' || v === 'd4') {
    const n = v === 'd2' ? 2 : 4;
    msg = v === 'd4' ? `+4 · ${COLOR_NAME[g.color]}` : '+2';
    if (g.settings.stacking) {
      g.pending += n;
      g.pendingType = v;
      g.turn = next;
    } else {
      draw(g, next, n);
      g.turn = step(g, next);
    }
  } else g.turn = next;
  if (msg) announce(g, seat, msg);

  if (s.hand.length === 0) endRound(g, seat);
  return null;
}

function endRound(g, winner) {
  // Any draw penalty still waiting lands on the next player before scoring.
  if (g.pending) { draw(g, g.turn, g.pending); g.pending = 0; }
  const pts = g.seats.reduce((sum, s, i) => sum + (s && s.active && i !== winner ? s.hand.reduce((a, c) => a + points(c), 0) : 0), 0);
  g.seats[winner].score += pts;
  g.result = { winner, pts };
  g.vulnerable = null;
  g.turn = -1;
  announce(g, winner, g.settings.target ? `Out! +${pts}` : 'Out!');
  if (!g.settings.target || g.seats[winner].score >= g.settings.target) {
    g.phase = 'gameOver';
    g.winner = winner;
  } else g.phase = 'roundEnd';
}

export function advance(g) {
  if (g.phase === 'roundEnd') startRound(g);
}

// ---------------------------------------------------------------- views

export function viewFor(g, seat) {
  const s = g.seats[seat];
  const myTurn = g.phase === 'play' && g.turn === seat && s?.active;
  let legal = [];
  if (myTurn) legal = g.drew ? [g.drew] : s.hand.filter(id => canPlay(g, s.hand, id));
  return {
    phase: g.phase, seat, roundNo: g.roundNo, turn: g.turn, dir: g.dir, dealer: g.dealer,
    hand: s ? s.hand : [], legal, top: g.discard[g.discard.length - 1], color: g.color,
    pending: g.pending, drew: myTurn ? g.drew : null, called: !!s?.called, active: !!s?.active,
    vulnerable: g.vulnerable, next: g.phase === 'play' ? step(g, g.turn) : -1,
    seats: g.seats.map(o => o && { n: o.hand.length, score: o.score, active: o.active, called: o.called }),
    target: g.settings.target, stacking: g.settings.stacking, result: g.result, winner: g.winner ?? null,
  };
}

// ---------------------------------------------------------------- bots

export function botAction(g, seat) {
  const s = g.seats[seat];
  const hand = s.hand;
  const legal = g.drew ? [g.drew] : hand.filter(id => canPlay(g, hand, id));

  if (hand.length === 2 && !s.called && legal.length && Math.random() < 0.92) return { type: 'call' };
  if (!legal.length) return g.drew ? { type: 'pass' } : { type: 'draw' };
  if (g.drew && Math.random() < 0.15 && parse(g.drew).c !== 'W') return { type: 'pass' };

  const next = step(g, seat);
  const threat = g.seats[next].hand.length <= 2;
  const score = id => {
    const { c, v } = parse(id);
    let sc = points(id);
    if (c === 'W') sc = v === 'd4' ? (threat ? 60 : -40) : (threat ? 10 : -20); // save wilds
    else if (threat && ['skip', 'd2', 'rev'].includes(v)) sc += 40;
    sc += hand.filter(h => parse(h).c === c).length * 2; // stay in colours we hold a lot of
    return sc;
  };
  const card = legal.slice().sort((a, b) => score(b) - score(a))[0];
  const a = { type: 'play', card };
  if (parse(card).c === 'W') {
    const counts = COLORS.map(c => [c, hand.filter(h => h !== card && parse(h).c === c).length]);
    counts.sort((x, y) => y[1] - x[1]);
    a.color = counts[0][1] ? counts[0][0] : COLORS[Math.floor(Math.random() * 4)];
  }
  return a;
}

// A bot might notice a human who forgot to call "last card".
export function botCatch(g, bots) {
  if (g.vulnerable == null) return;
  const catcher = bots.find(i => i !== g.vulnerable && g.seats[i]?.active);
  if (catcher != null && Math.random() < 0.7) applyAction(g, catcher, { type: 'catch', target: g.vulnerable });
}
