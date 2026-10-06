// Blackjack against the house. The table is the dealer; each player bets from their own
// stack and plays their hand(s) on their phone, in seat order.
// Rules: dealer peeks for blackjack under an Ace or ten, blackjack pays 3:2 (or 6:5),
// dealer stands or hits on soft 17 (setting), double on any two cards, double after
// split, split up to four hands (split Aces get one card each), late surrender
// (setting), insurance pays 2:1.
import { makeShoe, syncStacks } from './casino.js?v=37';

const rnd = n => Math.floor(Math.random() * n);
let annN = 0;

export const cardValue = c => (c[0] === 'A' ? 11 : 'TJQK'.includes(c[0]) ? 10 : Number(c[0]));
export function total(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { t += cardValue(c); if (c[0] === 'A') aces++; }
  while (t > 21 && aces) { t -= 10; aces--; }
  return { t, soft: aces > 0 };
}
const isBJ = h => h.cards.length === 2 && !h.split && total(h.cards).t === 21;

export const DEFAULTS = { startChips: 1000, min: 10, decks: 6, h17: false, payout: '3:2', surrender: true, rebuy: true };

export function createGame(settings, players) {
  const g = {
    settings: { ...DEFAULTS, ...settings },
    seats: [], stacks: {},
    shoe: [], cut: 0,
    phase: 'bet', round: 0,
    bets: {}, lastBet: {}, ready: {},
    hands: {}, dealer: { cards: [], hidden: true },
    active: null, insurance: {},
    betDeadline: 0,
    announce: null,
  };
  syncStacks(g, players);
  newShoe(g);
  return g;
}

function newShoe(g) {
  g.shoe = makeShoe(g.settings.decks);
  g.cut = Math.floor(g.shoe.length * 0.25);   // reshuffle when a quarter of the shoe is left
  g.shuffled = true;
}
const draw = g => g.shoe.pop();

// ---------------------------------------------------------------- the round

function inRound(g) { return g.order || []; }

function deal(g) {
  const order = g.seats.map((s, i) => (s && g.bets[i] >= g.settings.min && g.bets[i] <= g.stacks[i] ? i : -1)).filter(i => i >= 0);
  if (!order.length) return;
  if (g.shoe.length < g.cut) newShoe(g); else g.shuffled = false;
  g.round++;
  g.order = order;
  g.hands = {};
  g.insurance = {};
  g.results = null;
  for (const s of order) {
    g.stacks[s] -= g.bets[s];
    g.lastBet[s] = g.bets[s];
    g.hands[s] = [{ cards: [], bet: g.bets[s] }];
  }
  g.dealer = { cards: [], hidden: true };
  for (let k = 0; k < 2; k++) {
    for (const s of order) g.hands[s][0].cards.push(draw(g));
    g.dealer.cards.push(draw(g));
  }
  g.ready = {};
  g.betDeadline = 0;
  if (g.dealer.cards[0][0] === 'A') { g.phase = 'insurance'; g.insDeadline = Date.now() + 15000; return; }
  afterPeek(g);
}

function afterPeek(g) {
  const up = cardValue(g.dealer.cards[0]);
  if ((up === 11 || up === 10) && total(g.dealer.cards).t === 21) {
    g.dealer.hidden = false;
    g.announce = { id: 'bj' + ++annN, seat: -1, text: 'Dealer has blackjack' };
    return settle(g);
  }
  // Settle any lost insurance now, like a real table.
  g.phase = 'play';
  for (const s of inRound(g)) { const h = g.hands[s][0]; if (isBJ(h)) h.done = true; }
  nextHand(g);
}

function nextHand(g) {
  for (const s of inRound(g)) {
    const hands = g.hands[s];
    for (let i = 0; i < hands.length; i++) {
      const h = hands[i];
      if (h.done) continue;
      if (h.cards.length === 1) h.cards.push(draw(g));        // second card for a split hand
      if (h.splitAces) { h.done = true; continue; }
      if (total(h.cards).t >= 21) { h.done = true; continue; }
      g.active = { seat: s, hand: i };
      g.turnStarted = Date.now();
      return;
    }
  }
  g.active = null;
  // Dealer's turn: reveal, and draw only if anyone still has a live hand.
  g.dealer.hidden = false;
  const live = inRound(g).some(s => g.hands[s].some(h => !h.surrendered && total(h.cards).t <= 21 && !isBJ(h)));
  g.phase = live ? 'dealer' : 'dealerDone';
}

function dealerStep(g) {
  const { t, soft } = total(g.dealer.cards);
  if (t < 17 || (t === 17 && soft && g.settings.h17)) { g.dealer.cards.push(draw(g)); return false; }
  return true;
}

function settle(g) {
  const d = total(g.dealer.cards).t;
  const dBJ = g.dealer.cards.length === 2 && d === 21;
  const bjPay = g.settings.payout === '6:5' ? 1.2 : 1.5;
  const results = {};
  for (const s of inRound(g)) {
    let net = 0;
    const ins = g.insurance[s] || 0;
    if (ins) { if (dBJ) { g.stacks[s] += ins * 3; net += ins * 2; } else net -= ins; }
    for (const h of g.hands[s]) {
      const p = total(h.cards).t;
      let r, back = 0;
      if (h.surrendered) { r = 'surrender'; back = h.bet / 2; }
      else if (isBJ(h) && !dBJ) { r = 'blackjack'; back = h.bet * (1 + bjPay); }
      else if (p > 21) r = 'bust';
      else if (dBJ) r = isBJ(h) ? 'push' : 'lose';
      else if (d > 21 || p > d) { r = 'win'; back = h.bet * 2; }
      else if (p === d) { r = 'push'; back = h.bet; }
      else r = 'lose';
      h.result = r;
      g.stacks[s] += back;
      net += back - h.bet;
    }
    results[s] = net;
  }
  g.results = results;
  g.phase = 'settle';
  g.settleAt = Date.now();
}

function newRound(g) {
  g.phase = 'bet';
  g.active = null;
  g.hands = {};
  g.dealer = { cards: [], hidden: true };
  g.results = null;
  g.ready = {};
  g.order = [];
  // Keep last round's bet ready to go, if they can still afford it.
  g.bets = {};
  for (const [s, b] of Object.entries(g.lastBet)) if (g.seats[s] && g.stacks[s] >= b) g.bets[s] = b;
}

// ---------------------------------------------------------------- actions

export function applyAction(g, seat, a) {
  if (!a || typeof a !== 'object') return 'Bad move';
  const S = g.settings;
  switch (a.type) {
    case 'bet': {
      if (g.phase !== 'bet') return 'Bets are closed';
      const amt = Math.max(0, Math.floor(Number(a.amount) || 0));
      if (amt > g.stacks[seat]) return "You don't have that many chips";
      g.bets[seat] = amt;
      g.ready[seat] = false;
      return null;
    }
    case 'ready': {
      if (g.phase !== 'bet') return null;
      if (a.on !== false && !(g.bets[seat] >= S.min)) return `The minimum bet is ${S.min}`;
      g.ready[seat] = a.on !== false;
      if (g.ready[seat] && !g.betDeadline) g.betDeadline = Date.now() + 20000;
      if (allReady(g)) deal(g);
      return null;
    }
    case 'deal':
      if (g.phase === 'bet') deal(g);
      return null;
    case 'rebuy':
      if (!S.rebuy || g.stacks[seat] >= S.min) return null;
      g.stacks[seat] = S.startChips;
      return null;
    case 'insurance': {
      if (g.phase !== 'insurance' || !inRound(g).includes(seat) || seat in g.insurance) return null;
      const cost = g.hands[seat][0].bet / 2;
      if (a.take && g.stacks[seat] < cost) return 'Not enough chips for insurance';
      g.insurance[seat] = a.take ? cost : 0;
      if (a.take) g.stacks[seat] -= cost;
      if (inRound(g).every(s => s in g.insurance)) afterPeek(g);
      return null;
    }
    case 'hit': case 'stand': case 'double': case 'split': case 'surrender': {
      if (g.phase !== 'play' || !g.active || g.active.seat !== seat) return "It isn't your turn";
      const hands = g.hands[seat];
      const h = hands[g.active.hand];
      const two = h.cards.length === 2;
      if (a.type === 'hit') { h.cards.push(draw(g)); if (total(h.cards).t >= 21) h.done = true; }
      else if (a.type === 'stand') h.done = true;
      else if (a.type === 'double') {
        if (!two) return 'You can only double on your first two cards';
        if (g.stacks[seat] < h.bet) return 'Not enough chips to double';
        g.stacks[seat] -= h.bet; h.bet *= 2; h.doubled = true;
        h.cards.push(draw(g)); h.done = true;
      } else if (a.type === 'split') {
        if (!two || cardValue(h.cards[0]) !== cardValue(h.cards[1])) return 'You can only split a pair';
        if (hands.length >= 4) return 'Four hands is the limit';
        if (h.splitAces) return "Split Aces can't be split again";
        if (g.stacks[seat] < h.bet) return 'Not enough chips to split';
        g.stacks[seat] -= h.bet;
        const aces = h.cards[0][0] === 'A';
        const other = { cards: [h.cards.pop()], bet: h.bet, split: true, splitAces: aces };
        h.split = true; h.splitAces = aces;
        hands.splice(g.active.hand + 1, 0, other);
        h.cards.push(draw(g));
        if (aces) { other.cards.push(draw(g)); h.done = other.done = true; }
      } else if (a.type === 'surrender') {
        if (!S.surrender || !two || h.split) return 'You can only surrender your first two cards';
        h.surrendered = true; h.done = true;
      }
      g.lastAction = { seat, type: a.type, id: ++annN };
      if (h.done || total(h.cards).t >= 21) { h.done = true; nextHand(g); }
      return null;
    }
    case 'next':
      if (g.phase === 'settle') newRound(g);
      return null;
  }
  return 'Unknown move';
}

const allReady = g => {
  const sitting = g.seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  const betting = sitting.filter(i => g.bets[i] >= g.settings.min);
  return betting.length > 0 && sitting.every(i => g.ready[i] || !(g.stacks[i] >= g.settings.min));
};

// ---------------------------------------------------------------- bots: basic strategy

export function botMove(g, s) {
  const h = g.hands[s][g.active.hand];
  const { t, soft } = total(h.cards);
  const up = cardValue(g.dealer.cards[0]);
  const two = h.cards.length === 2;
  const canDouble = two && g.stacks[s] >= h.bet;
  if (two && cardValue(h.cards[0]) === cardValue(h.cards[1]) && g.hands[s].length < 4 && g.stacks[s] >= h.bet) {
    const v = cardValue(h.cards[0]);
    if (v === 11 || v === 8) return 'split';
    if ([2, 3, 7].includes(v) && up <= 7) return 'split';
    if (v === 6 && up <= 6) return 'split';
    if (v === 9 && up <= 9 && up !== 7) return 'split';
  }
  if (g.settings.surrender && two && !h.split && t === 16 && !soft && up >= 9) return 'surrender';
  if (soft) {
    if (t >= 19) return 'stand';
    if (t === 18) return up >= 9 ? 'hit' : canDouble && up >= 3 && up <= 6 ? 'double' : 'stand';
    return canDouble && up >= 5 && up <= 6 ? 'double' : 'hit';
  }
  if (t >= 17) return 'stand';
  if (t >= 13) return up <= 6 ? 'stand' : 'hit';
  if (t === 12) return up >= 4 && up <= 6 ? 'stand' : 'hit';
  if (t === 11) return canDouble ? 'double' : 'hit';
  if (t === 10) return canDouble && up <= 9 ? 'double' : 'hit';
  if (t === 9) return canDouble && up >= 3 && up <= 6 ? 'double' : 'hit';
  return 'hit';
}

// ---------------------------------------------------------------- the clock

export function timer(g, players) {
  syncStacks(g, players);
  const S = g.settings;
  if (g.phase === 'bet') {
    // Bots bet the minimum and are always ready.
    const bot = g.seats.findIndex((x, i) => x === 'bot' && !g.ready[i] && g.stacks[i] >= S.min);
    if (bot >= 0) return { ms: 500, run: () => { g.bets[bot] = S.min; g.ready[bot] = true; if (allReady(g)) deal(g); } };
    if (g.betDeadline) return { ms: Math.max(0, g.betDeadline - Date.now()), run: () => { if (g.phase === 'bet') deal(g); } };
    return null;
  }
  if (g.phase === 'insurance') {
    const bot = inRound(g).find(s => g.seats[s] === 'bot' && !(s in g.insurance));
    if (bot !== undefined) return { ms: 600, run: () => applyAction(g, bot, { type: 'insurance', take: false }) };
    return { ms: Math.max(0, g.insDeadline - Date.now()), run: () => { if (g.phase === 'insurance') { inRound(g).forEach(s => { if (!(s in g.insurance)) g.insurance[s] = 0; }); afterPeek(g); } } };
  }
  if (g.phase === 'play' && g.active) {
    const s = g.active.seat;
    if (!g.seats[s]) return { ms: 500, run: () => { g.hands[s].forEach(h => { h.done = true; }); nextHand(g); } };
    if (g.seats[s] === 'bot') return { ms: 900 + rnd(500), run: () => applyAction(g, s, { type: botMove(g, s) }) };
    return null;
  }
  if (g.phase === 'dealer') return { ms: 900, run: () => { if (dealerStep(g)) settle(g); } };
  if (g.phase === 'dealerDone') return { ms: 900, run: () => settle(g) };
  if (g.phase === 'settle') return { ms: 6000, run: () => { if (g.phase === 'settle') newRound(g); } };
  return null;
}

// ---------------------------------------------------------------- views

export function viewFor(g, seat) {
  const mine = g.hands[seat] || [];
  const myTurn = g.phase === 'play' && g.active?.seat === seat;
  const h = myTurn ? mine[g.active.hand] : null;
  const S = g.settings;
  return {
    phase: g.phase,
    round: g.round,
    stack: g.stacks[seat] ?? 0,
    bet: g.bets[seat] || 0,
    lastBet: g.lastBet[seat] || 0,
    ready: !!g.ready[seat],
    min: S.min,
    settings: { payout: S.payout, h17: S.h17, surrender: S.surrender, rebuy: S.rebuy },
    inRound: inRound(g).includes(seat),
    hands: mine.map(x => ({ cards: x.cards, bet: x.bet, total: total(x.cards), done: !!x.done, result: x.result || null, doubled: !!x.doubled, surrendered: !!x.surrendered, bj: isBJ(x) })),
    active: g.active,
    myTurn,
    can: h ? {
      double: h.cards.length === 2 && g.stacks[seat] >= h.bet,
      split: h.cards.length === 2 && cardValue(h.cards[0]) === cardValue(h.cards[1]) && mine.length < 4 && !h.splitAces && g.stacks[seat] >= h.bet,
      surrender: S.surrender && h.cards.length === 2 && !h.split,
    } : null,
    dealer: dealerView(g),
    insuranceAsked: g.phase === 'insurance' && inRound(g).includes(seat) && !(seat in g.insurance),
    result: g.results ? g.results[seat] ?? null : null,
    betLeft: g.betDeadline ? Math.max(0, g.betDeadline - Date.now()) : null,
  };
}

export const turn = g => (g.phase === 'play' && g.active ? g.active.seat : -1);
export const botAction = () => null;

// The dealer's hole card stays face down (null) until it's turned over.
export function dealerView(g) {
  const c = g.dealer.cards;
  if (!g.dealer.hidden) return { cards: c, total: c.length ? total(c) : null };
  return { cards: c.length === 2 ? [c[0], null] : c.slice(), total: null, up: c[0] ? cardValue(c[0]) : null };
}
