// Five-Card Draw poker, fixed limit. Everyone antes and gets five cards. A betting round, then
// each player still in may throw away up to three cards (four if they keep an ace) and draw
// replacements, then a second betting round at double the bet size, then the showdown. Bets
// come in fixed steps (10 before the draw, 20 after) with at most four bets a round. Players
// who run out of chips are out; last one with chips wins. Side pots handle all-ins.
import { fullDeck, shuffle, announce } from './tricks.js?v=68';
import { bestHand, describe } from './poker.js?v=68';

export const ANTE = 5, SMALL = 10, BIG = 20, CAP = 4;

export function createGame(settings, players) {
  const g = { settings: { chips: 500, ...settings }, seats: players.map(p => !!p), handNo: 0, dealer: -1, annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.chips = g.seats.map(x => (x ? g.settings.chips : 0));
  startHand(g);
  return g;
}

const inHand = (g, s) => g.p[s] && !g.p[s].folded;
const canAct = (g, s) => inHand(g, s) && !g.p[s].allIn;
const nextOf = (g, s, pred) => { const i = g.order.indexOf(s); for (let k = 1; k <= g.order.length; k++) { const t = g.order[(i + k) % g.order.length]; if (pred(t)) return t; } return -1; };

function startHand(g) {
  g.handNo++;
  const alive = g.order.filter(s => g.chips[s] > 0);
  g.dealer = nextOf(g, g.dealer < 0 ? g.order[g.order.length - 1] : g.dealer, s => g.chips[s] > 0);
  g.deck = shuffle(fullDeck());
  g.p = g.seats.map(() => null);
  for (const s of alive) {
    const a = Math.min(ANTE, g.chips[s]);
    g.chips[s] -= a;
    g.p[s] = { cards: g.deck.splice(0, 5), bet: 0, total: a, folded: false, allIn: g.chips[s] === 0, acted: false, drew: null };
  }
  g.result = null;
  startRound(g, 'bet1');
  g.moveId++;
}

function startRound(g, phase) {
  g.phase = phase;
  g.bet = 0;
  g.raises = 0;
  for (const s of g.order) if (g.p[s]) { g.p[s].bet = 0; g.p[s].acted = false; }
  g.turn = nextOf(g, g.dealer, s => (phase === 'draw' ? inHand(g, s) : canAct(g, s)));
  if (phase !== 'draw' && g.order.filter(s => canAct(g, s)).length < 2 && !owes(g)) return endRound(g);
}

const owes = g => g.order.some(s => canAct(g, s) && g.p[s].bet < g.bet);
export const current = g => (['bet1', 'draw', 'bet2'].includes(g.phase) ? g.turn : -1);
export const step = g => (g.phase === 'bet2' ? BIG : SMALL);
export const pot = g => g.order.reduce((a, s) => a + (g.p[s] ? g.p[s].total : 0), 0);

function put(g, s, n) {
  const x = Math.min(n, g.chips[s]);
  g.chips[s] -= x;
  g.p[s].bet += x;
  g.p[s].total += x;
  if (g.chips[s] === 0) g.p[s].allIn = true;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== current(g)) return "It isn't your turn";
  const me = g.p[seat];
  if (g.phase === 'draw') {
    if (a.type !== 'draw') return 'Choose cards to swap (or stand pat)';
    const cards = a.cards || [];
    const max = me.cards.some(c => c[0] === 'A' && !cards.includes(c)) ? 4 : 3;
    if (cards.length > max || !cards.every(c => me.cards.includes(c))) return `Swap up to ${max} cards`;
    if (g.deck.length < cards.length) g.deck.push(...shuffle(g.muck || []));
    me.cards = me.cards.filter(c => !cards.includes(c)).concat(g.deck.splice(0, cards.length));
    (g.muck ||= []).push(...cards);
    me.drew = cards.length;
    announce(g, seat, cards.length ? `Draws ${cards.length}` : 'Stands pat');
    g.moveId++;
    const nx = nextOf(g, seat, s => inHand(g, s) && g.p[s].drew == null);
    if (nx >= 0) g.turn = nx; else startRound(g, 'bet2');
    return null;
  }
  const toCall = g.bet - me.bet;
  if (a.type === 'fold') { me.folded = true; announce(g, seat, 'Fold'); }
  else if (a.type === 'check') { if (toCall > 0) return `${toCall} to call`; announce(g, seat, 'Check'); }
  else if (a.type === 'call') { if (toCall <= 0) return 'Nothing to call'; put(g, seat, toCall); announce(g, seat, me.allIn ? 'All in' : `Call ${toCall}`); }
  else if (a.type === 'bet') {
    if (g.raises >= CAP) return 'Betting is capped this round';
    if (g.chips[seat] <= toCall) return 'Not enough chips to raise';
    put(g, seat, toCall + step(g));
    g.bet = Math.max(g.bet, me.bet);
    g.raises++;
    for (const s of g.order) if (s !== seat && g.p[s]) g.p[s].acted = false;
    announce(g, seat, g.raises === 1 ? `Bet ${step(g)}` : `Raise to ${g.bet}`);
  } else return "That move isn't allowed";
  me.acted = true;
  g.moveId++;
  const live = g.order.filter(s => inHand(g, s));
  if (live.length === 1) return winByFold(g, live[0]);
  const nx = nextOf(g, seat, s => canAct(g, s) && (!g.p[s].acted || g.p[s].bet < g.bet));
  if (nx >= 0) g.turn = nx; else endRound(g);
  return null;
}

function endRound(g) {
  if (g.phase === 'bet1') {
    if (g.order.filter(s => inHand(g, s)).length > 1) return startRound(g, 'draw');
  }
  showdown(g);
}

function winByFold(g, w) {
  const p = pot(g);
  g.chips[w] += p;
  g.result = { pots: [{ amount: p, winners: [w] }], fold: true, hands: {} };
  finishHand(g);
}

function showdown(g) {
  const live = g.order.filter(s => inHand(g, s));
  const ev = {};
  for (const s of live) ev[s] = bestHand(g.p[s].cards);
  // Side pots by contribution level.
  const levels = [...new Set(g.order.filter(s => g.p[s]).map(s => g.p[s].total))].sort((a, b) => a - b);
  let prev = 0;
  const pots = [];
  for (const L of levels) {
    const amount = g.order.reduce((a, s) => a + (g.p[s] ? Math.max(0, Math.min(g.p[s].total, L) - prev) : 0), 0);
    const elig = live.filter(s => g.p[s].total >= L);
    prev = L;
    if (!amount) continue;
    if (!elig.length) { pots.length ? pots[pots.length - 1].amount += amount : null; continue; }
    const top = Math.max(...elig.map(s => ev[s].score));
    const winners = elig.filter(s => ev[s].score === top);
    pots.push({ amount, winners });
  }
  for (const p of pots) {
    const share = Math.floor(p.amount / p.winners.length);
    p.winners.forEach((s, i) => { g.chips[s] += share + (i === 0 ? p.amount - share * p.winners.length : 0); });
  }
  g.result = { pots, fold: false, hands: Object.fromEntries(live.map(s => [s, { cards: g.p[s].cards, text: describe(ev[s]) }])) };
  finishHand(g);
}

function finishHand(g) {
  g.phase = 'handEnd';
  g.turn = -1;
  g.nextAt = Date.now() + 8000;
  g.moveId++;
  const alive = g.order.filter(s => g.chips[s] > 0);
  if (alive.length <= 1) { g.phase = 'over'; g.winner = alive[0]; }
}

export function advance(g) { if (g.phase === 'handEnd') startHand(g); }
export function tick(g) { return g.phase === 'handEnd' ? { ms: Math.max(0, g.nextAt - Date.now()), run: () => advance(g) } : null; }

// ------------------------------------------------------------------ computer player
function keepFor(cards) {
  const h = bestHand(cards);
  if (h.cat >= 4) return cards.slice();
  const cnt = {};
  cards.forEach(c => { cnt[c[0]] = (cnt[c[0]] || 0) + 1; });
  if (h.cat >= 1) return cards.filter(c => cnt[c[0]] >= 2);
  for (const s of 'SHDC') { const f = cards.filter(c => c[1] === s); if (f.length === 4) return f; }
  const ace = cards.find(c => c[0] === 'A');
  return ace ? [ace, ...cards.filter(c => c !== ace).sort((a, b) => 'AKQJT98765432'.indexOf(a[0]) - 'AKQJT98765432'.indexOf(b[0])).slice(0, 1)] : cards.slice().sort((a, b) => 'AKQJT98765432'.indexOf(a[0]) - 'AKQJT98765432'.indexOf(b[0])).slice(0, 2);
}

export function botAction(g, s) {
  const me = g.p[s];
  if (g.phase === 'draw') {
    const keep = keepFor(me.cards);
    let toss = me.cards.filter(c => !keep.includes(c));
    if (toss.length > 3 && !keep.some(c => c[0] === 'A')) toss = toss.slice(0, 3);
    return { type: 'draw', cards: toss.slice(0, 4) };
  }
  const h = bestHand(me.cards);
  const toCall = g.bet - me.bet;
  const r = Math.random();
  const strong = g.phase === 'bet1' ? h.cat >= 2 || (h.cat === 1 && h.tb[0] >= 11) : h.cat >= 2;
  const ok = g.phase === 'bet1' ? h.cat >= 1 || r < 0.25 : h.cat >= 1;
  if (strong && g.raises < CAP && g.chips[s] > toCall && r < 0.75) return { type: 'bet' };
  if (toCall <= 0) return r < 0.08 && g.raises < CAP ? { type: 'bet' } : { type: 'check' };
  if (ok || toCall <= ANTE) return { type: 'call' };
  return { type: 'fold' };
}

export function viewFor(g, seat) {
  const me = g.p[seat];
  return {
    phase: g.phase, turn: g.turn, dealer: g.dealer, chips: g.chips, pot: pot(g), bet: g.bet, raises: g.raises, step: step(g),
    hand: me ? me.cards : [], me: me && { bet: me.bet, folded: me.folded, allIn: me.allIn, drew: me.drew },
    players: g.p.map(p => p && { bet: p.bet, folded: p.folded, allIn: p.allIn, drew: p.drew }), order: g.order,
    result: g.result, handNo: g.handNo, winner: g.winner ?? null, text: me ? describe(bestHand(me.cards)) : '',
  };
}

export const check = g => (g.order.reduce((a, s) => a + g.chips[s], 0) + (g.phase === 'handEnd' || g.phase === 'over' ? 0 : pot(g)) !== g.order.length * g.settings.chips ? 'chips' : null);
