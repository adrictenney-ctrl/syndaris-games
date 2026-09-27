// No-limit Texas Hold'em rules engine + bots. Runs only on the table (host).
// Seats are 0..7 going clockwise; empty seats are null.

export const RANKS = '23456789TJQKA';
const SUITS = 'SHDC';
const BETTING = ['preflop', 'flop', 'turn', 'river'];
const rv = c => RANKS.indexOf(c[0]) + 2;

const RANK_WORD = { 14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: 'Ten', 9: 'Nine', 8: 'Eight', 7: 'Seven', 6: 'Six', 5: 'Five', 4: 'Four', 3: 'Three', 2: 'Two' };
const plural = v => (v === 6 ? 'Sixes' : RANK_WORD[v] + 's');

// ---------------------------------------------------------------- hand ranking

function eval5(cards) {
  const vals = cards.map(rv).sort((a, b) => b - a);
  const flush = cards.every(c => c[1] === cards[0][1]);
  let straight = 0;
  if (new Set(vals).size === 5) {
    if (vals[0] - vals[4] === 4) straight = vals[0];
    else if (vals[0] === 14 && vals[1] === 5) straight = 5; // A-2-3-4-5
  }
  const counts = new Map();
  vals.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const shape = groups.map(g => g[1]).join('');
  const byGroup = groups.map(g => g[0]);
  let cat, tb;
  if (straight && flush) { cat = 8; tb = [straight]; }
  else if (shape === '41') { cat = 7; tb = byGroup; }
  else if (shape === '32') { cat = 6; tb = byGroup; }
  else if (flush) { cat = 5; tb = vals; }
  else if (straight) { cat = 4; tb = [straight]; }
  else if (shape === '311') { cat = 3; tb = byGroup; }
  else if (shape === '221') { cat = 2; tb = byGroup; }
  else if (shape === '2111') { cat = 1; tb = byGroup; }
  else { cat = 0; tb = vals; }
  let score = cat;
  for (let i = 0; i < 5; i++) score = score * 15 + (tb[i] || 0);
  return { score, cat, tb, cards };
}

// Best five-card hand from any 5–7 cards.
export function bestHand(cards) {
  let best = null;
  const pick = (start, chosen) => {
    if (chosen.length === 5) {
      const e = eval5(chosen);
      if (!best || e.score > best.score) best = e;
      return;
    }
    for (let i = start; i < cards.length; i++) pick(i + 1, [...chosen, cards[i]]);
  };
  pick(0, []);
  return best;
}

export function describe(h) {
  const t = h.tb;
  switch (h.cat) {
    case 8: return t[0] === 14 ? 'Royal flush' : `Straight flush, ${RANK_WORD[t[0]]} high`;
    case 7: return `Four ${plural(t[0])}`;
    case 6: return `Full house, ${plural(t[0])} over ${plural(t[1])}`;
    case 5: return `Flush, ${RANK_WORD[t[0]]} high`;
    case 4: return `Straight, ${RANK_WORD[t[0]]} high`;
    case 3: return `Three ${plural(t[0])}`;
    case 2: return `Two pair, ${plural(t[0])} and ${plural(t[1])}`;
    case 1: return `Pair of ${plural(t[0])}`;
    default: return `${RANK_WORD[t[0]]} high`;
  }
}

// ---------------------------------------------------------------- setup

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

const newSeat = chips => ({ chips, cards: [], inHand: false, folded: false, allIn: false, bet: 0, total: 0, acted: false, last: null });

export function createGame(settings, occupied) {
  const g = {
    settings: { startChips: 1000, sb: 10, bb: 20, rebuy: true, ...settings },
    seats: occupied.map(o => (o ? newSeat(0) : null)),
    button: -1,
    handNo: 0,
    annId: 0,
    board: [],
    phase: 'preflop',
  };
  g.seats.forEach(s => { if (s) s.chips = g.settings.startChips; });
  // Random first dealer.
  const taken = g.seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  g.button = taken[Math.floor(Math.random() * taken.length)] - 1;
  startHand(g);
  return g;
}

// Someone sat down mid-game: they get chips and are dealt in from the next hand.
export function addPlayer(g, seat) {
  if (!g.seats[seat]) g.seats[seat] = newSeat(g.settings.startChips);
}

function announce(g, seat, text) {
  g.announce = { id: ++g.annId, seat, text };
}

const canAct = s => s && s.inHand && !s.folded && !s.allIn;
const live = g => g.seats.map((s, i) => (s && s.inHand && !s.folded ? i : -1)).filter(i => i >= 0);

function nextSeat(g, from, pred) {
  for (let i = 1; i <= g.seats.length; i++) {
    const idx = (((from + i) % g.seats.length) + g.seats.length) % g.seats.length;
    if (pred(g.seats[idx])) return idx;
  }
  return -1;
}

function put(s, amount) {
  const a = Math.min(amount, s.chips);
  s.chips -= a;
  s.bet += a;
  s.total += a;
  if (s.chips === 0) s.allIn = true;
  return a;
}

export function startHand(g) {
  const players = g.seats.filter(s => s && s.chips > 0);
  if (players.length < 2) {
    g.phase = 'gameOver';
    g.winner = g.seats.findIndex(s => s && s.chips > 0);
    g.toAct = -1;
    return;
  }
  g.handNo++;
  g.deck = shuffledDeck();
  g.board = [];
  g.result = null;
  g.runout = false;
  for (const s of g.seats) {
    if (!s) continue;
    Object.assign(s, { cards: [], inHand: s.chips > 0, folded: false, allIn: false, bet: 0, total: 0, acted: false, last: null });
  }
  const inHand = s => s && s.inHand;
  g.button = nextSeat(g, g.button, inHand);
  const headsUp = players.length === 2;
  g.sbSeat = headsUp ? g.button : nextSeat(g, g.button, inHand);
  g.bbSeat = nextSeat(g, g.sbSeat, inHand);
  put(g.seats[g.sbSeat], g.settings.sb);
  put(g.seats[g.bbSeat], g.settings.bb);
  g.seats[g.sbSeat].last = 'Small blind';
  g.seats[g.bbSeat].last = 'Big blind';
  for (let round = 0; round < 2; round++) {
    let i = g.button;
    do {
      i = nextSeat(g, i, inHand);
      g.seats[i].cards.push(g.deck.pop());
    } while (i !== g.button);
  }
  g.currentBet = g.settings.bb;
  g.minRaise = g.settings.bb;
  g.phase = 'preflop';
  g.toAct = nextSeat(g, g.bbSeat, canAct);
  if (g.toAct < 0 || roundDone(g)) endRound(g);
}

// ---------------------------------------------------------------- betting

export const potTotal = g => g.seats.reduce((a, s) => a + (s ? s.total : 0), 0);

// Returns an error message, or null if the action was applied.
export function applyAction(g, seat, a) {
  const s = g.seats[seat];
  if (!s || !a) return 'You are not in this game';

  if (a.type === 'rebuy') {
    if (!g.settings.rebuy) return 'Rebuys are turned off';
    if (s.chips > 0 || s.inHand) return 'You still have chips';
    s.chips = g.settings.startChips;
    s.rebuys = (s.rebuys || 0) + 1;
    announce(g, seat, `Rebuy · ${s.chips}`);
    return null;
  }

  if (!BETTING.includes(g.phase) || g.runout) return 'Wait for the next hand';
  if (g.toAct !== seat) return 'Not your turn';
  const toCall = g.currentBet - s.bet;

  if (a.type === 'fold') {
    s.folded = true;
    s.last = 'Fold';
  } else if (a.type === 'check' || (a.type === 'call' && toCall <= 0)) {
    if (toCall > 0) return `You need to call ${toCall} or fold`;
    s.last = 'Check';
  } else if (a.type === 'call' || (a.type === 'raise' && s.bet + s.chips <= g.currentBet)) {
    const paid = put(s, toCall);
    s.last = s.allIn ? `All in ${s.bet}` : `Call ${paid}`;
  } else if (a.type === 'raise') {
    const maxTo = s.bet + s.chips;
    const minTo = g.currentBet + g.minRaise;
    let to = Math.floor(Number(a.to)) || 0;
    if (to > maxTo) to = maxTo;
    if (to < minTo && to < maxTo) return `The minimum raise is to ${minTo}`;
    const wasBet = g.currentBet === 0;
    const inc = to - g.currentBet;
    put(s, to - s.bet);
    if (inc >= g.minRaise) g.minRaise = inc;
    g.currentBet = to;
    for (const o of g.seats) if (o && o !== s) o.acted = false;
    s.last = s.allIn ? `All in ${to}` : wasBet ? `Bet ${to}` : `Raise to ${to}`;
  } else return "That move isn't allowed";

  s.acted = true;
  announce(g, seat, s.last);

  if (live(g).length === 1) return winByFold(g), null;
  if (roundDone(g)) endRound(g);
  else g.toAct = nextSeat(g, seat, canAct);
  return null;
}

function roundDone(g) {
  const actors = g.seats.filter(canAct);
  if (actors.length === 0) return true;
  // Everyone else is all in and this player has matched the biggest bet: nobody left to bet against.
  if (actors.length === 1 && actors[0].bet >= g.currentBet) return true;
  return actors.every(o => o.acted && o.bet === g.currentBet);
}

function endRound(g) {
  for (const s of g.seats) if (s) { s.bet = 0; s.acted = false; }
  g.currentBet = 0;
  g.minRaise = g.settings.bb;
  g.toAct = -1;
  if (g.seats.filter(canAct).length <= 1) {
    g.runout = true; // everyone's all in: the table deals the rest out slowly
    if (g.board.length === 5) showdown(g);
    return;
  }
  dealStreet(g);
}

function dealStreet(g) {
  if (g.board.length === 5) return showdown(g);
  const n = g.board.length === 0 ? 3 : 1;
  g.deck.pop(); // burn
  for (let i = 0; i < n; i++) g.board.push(g.deck.pop());
  g.phase = g.board.length === 3 ? 'flop' : g.board.length === 4 ? 'turn' : 'river';
  for (const s of g.seats) if (s && !s.folded && s.inHand && !s.allIn) s.last = null;
  if (!g.runout) g.toAct = nextSeat(g, g.button, canAct);
}

// Called by the table on a timer while all-in players wait for the board.
export function runoutStep(g) {
  if (g.board.length === 5) return showdown(g);
  dealStreet(g);
}

function winByFold(g) {
  const w = live(g)[0];
  const amount = potTotal(g);
  g.seats[w].chips += amount;
  for (const s of g.seats) if (s) s.bet = 0;
  g.result = { type: 'fold', winners: [{ seat: w, amount }], pot: amount };
  g.phase = 'showdown';
  g.toAct = -1;
  announce(g, w, `Wins ${amount}`);
}

function showdown(g) {
  const contenders = live(g);
  const hands = {};
  for (const i of contenders) {
    const h = bestHand([...g.seats[i].cards, ...g.board]);
    hands[i] = { cards: g.seats[i].cards, name: describe(h), score: h.score, best: h.cards };
  }
  // Side pots: each all-in amount caps what that player can win.
  const totals = g.seats.map(s => (s ? s.total : 0));
  const levels = [...new Set(contenders.map(i => totals[i]))].sort((a, b) => a - b);
  const pots = [];
  let prev = 0;
  for (const L of levels) {
    const amount = totals.reduce((a, t) => a + Math.max(0, Math.min(t, L) - prev), 0);
    if (amount > 0) pots.push({ amount, eligible: contenders.filter(i => totals[i] >= L) });
    prev = L;
  }
  const leftover = totals.reduce((a, t) => a + Math.max(0, t - prev), 0); // folded over-contributions
  if (leftover && pots.length) pots[pots.length - 1].amount += leftover;

  const won = {};
  for (const p of pots) {
    const top = Math.max(...p.eligible.map(i => hands[i].score));
    // Odd chips go to the first winner left of the button.
    const winners = p.eligible.filter(i => hands[i].score === top)
      .sort((a, b) => ((a - g.button + g.seats.length) % g.seats.length) - ((b - g.button + g.seats.length) % g.seats.length));
    const share = Math.floor(p.amount / winners.length);
    let odd = p.amount - share * winners.length;
    for (const w of winners) {
      const amt = share + (odd-- > 0 ? 1 : 0);
      won[w] = (won[w] || 0) + amt;
    }
  }
  for (const [seat, amt] of Object.entries(won)) g.seats[seat].chips += amt;
  const winners = Object.entries(won).map(([seat, amount]) => ({ seat: Number(seat), amount, hand: hands[seat].name }));
  g.result = { type: 'showdown', hands, winners, pot: potTotal(g), pots: pots.length };
  g.phase = 'showdown';
  g.toAct = -1;
  g.runout = false;
  const best = winners.slice().sort((a, b) => b.amount - a.amount)[0];
  announce(g, best.seat, `Wins ${best.amount} · ${best.hand}`);
}

// Between hands.
export function advance(g) {
  if (g.phase === 'showdown') startHand(g);
}

// ---------------------------------------------------------------- views

export function viewFor(g, seat) {
  const s = g.seats[seat];
  // Cards are turned face up at showdown, and as soon as everyone left is all in.
  const revealed = (g.phase === 'showdown' && g.result?.type === 'showdown') || g.runout;
  const me = s && {
    cards: s.cards, chips: s.chips, bet: s.bet, inHand: s.inHand, folded: s.folded, allIn: s.allIn,
    toCall: Math.max(0, Math.min(g.currentBet - s.bet, s.chips)),
    minRaiseTo: Math.min(g.currentBet + g.minRaise, s.bet + s.chips),
    maxRaiseTo: s.bet + s.chips,
    handName: s.inHand && s.cards.length && g.board.length >= 3 ? describe(bestHand([...s.cards, ...g.board])) : null,
  };
  return {
    phase: g.phase, seat, handNo: g.handNo, board: g.board, button: g.button, sbSeat: g.sbSeat, bbSeat: g.bbSeat,
    toAct: g.toAct, currentBet: g.currentBet, bb: g.settings.bb, pot: potTotal(g), rebuy: g.settings.rebuy,
    seats: g.seats.map((o, i) => o && {
      chips: o.chips, bet: o.bet, folded: o.folded, allIn: o.allIn, inHand: o.inHand, last: o.last,
      cards: revealed && o.inHand && !o.folded ? o.cards : null,
    }),
    me, result: g.result, winner: g.winner ?? null,
  };
}

// ---------------------------------------------------------------- bots

// Chen-style pre-flop score, roughly 0 (7-2 off) to 20 (A-A).
function preflopScore(cards) {
  const [a, b] = cards.map(rv).sort((x, y) => y - x);
  const base = v => (v === 14 ? 10 : v === 13 ? 8 : v === 12 ? 7 : v === 11 ? 6 : v / 2);
  if (a === b) return Math.max(5, base(a) * 2);
  let s = base(a);
  if (cards[0][1] === cards[1][1]) s += 2;
  const gap = a - b - 1;
  s -= [0, 1, 2, 4][gap] ?? 5;
  if (gap <= 1 && a < 12) s += 1;
  return s;
}

function postflopStrength(cards, board) {
  const h = bestHand([...cards, ...board]);
  const boardOnly = board.length >= 5 ? bestHand(board) : null;
  let s = [0.12, 0.42, 0.66, 0.76, 0.83, 0.87, 0.94, 0.99, 1][h.cat];
  if (h.cat === 1) {
    const top = Math.max(...board.map(rv));
    if (h.tb[0] >= top) s += 0.12; // top pair or overpair
    if (!cards.some(c => rv(c) === h.tb[0])) s = 0.15; // the pair is on the board
  }
  if (boardOnly && boardOnly.score === h.score) s = 0.1; // playing the board
  if (board.length < 5) {
    const all = [...cards, ...board];
    const suitCount = Math.max(...'SHDC'.split('').map(x => all.filter(c => c[1] === x).length));
    if (suitCount === 4 && h.cat < 5) s += 0.14;
    const vals = [...new Set(all.map(rv))].sort((x, y) => x - y);
    for (let i = 0; i + 3 < vals.length; i++) if (vals[i + 3] - vals[i] === 3 && h.cat < 4) { s += 0.1; break; }
  }
  return Math.min(s, 1);
}

export function botAction(g, seat) {
  const s = g.seats[seat];
  const toCall = Math.min(g.currentBet - s.bet, s.chips);
  const pot = potTotal(g);
  const bb = g.settings.bb;
  const raiseTo = amt => ({ type: 'raise', to: Math.max(g.currentBet + g.minRaise, Math.round(amt / bb) * bb) });
  const passive = toCall <= 0 ? { type: 'check' } : { type: 'fold' };
  const r = Math.random();

  if (g.phase === 'preflop') {
    const c = preflopScore(s.cards);
    if (c >= 10 && r < 0.8) return raiseTo(g.currentBet * (g.currentBet > bb ? 2.5 : 3));
    if (c >= 7 || (c >= 5 && toCall <= bb) || (toCall <= 0)) {
      return toCall > s.chips * 0.35 && c < 12 ? passive : { type: toCall > 0 ? 'call' : 'check' };
    }
    return r < 0.04 ? { type: 'call' } : passive;
  }

  const str = postflopStrength(s.cards, g.board);
  const odds = toCall > 0 ? toCall / (pot + toCall) : 0;
  if (str >= 0.8 && r < 0.75) return raiseTo(g.currentBet + pot * 0.7);
  if (str >= 0.6 && toCall === 0 && r < 0.6) return raiseTo(pot * 0.5);
  if (toCall === 0) return r < 0.07 ? raiseTo(pot * 0.5) : { type: 'check' };
  if (str > odds + 0.15) return { type: 'call' };
  return { type: 'fold' };
}
