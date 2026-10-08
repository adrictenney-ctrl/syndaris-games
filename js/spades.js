// Spades: four players in two partnerships (sitting across). Spades are always trumps. Everyone
// bids how many tricks they'll take (0 = Nil: you promise to take none). A team that makes its
// combined bid scores 10 a trick bid plus 1 for each extra trick ("bag"); every 10 bags costs
// 100. Missing the bid loses 10 a trick bid. Nil is worth 100 if kept, -100 if not. Spades
// can't be led until one has been played (unless you hold only spades). First team to the
// target wins; a team that falls to -200 loses.
import { fullDeck, shuffle, sortCards, followable, trickWinner, suitOf, rankOf, RANKS, announce } from './tricks.js?v=64';

export const teamOf = s => s % 2;
export const partnerOf = s => (s + 2) % 4;

export function createGame(settings) {
  const g = { settings: { target: 500, ...settings }, scores: [0, 0], bags: [0, 0], dealer: Math.floor(Math.random() * 4) - 1, handNo: 0, annId: 0, moveId: 0 };
  deal(g);
  return g;
}

function deal(g) {
  g.handNo++;
  g.dealer = (g.dealer + 1) % 4;
  const deck = shuffle(fullDeck());
  g.hands = [0, 1, 2, 3].map(i => sortCards(deck.slice(i * 13, i * 13 + 13), 'S'));
  g.bids = [null, null, null, null];
  g.tricksWon = [0, 0, 0, 0];
  g.trick = [];
  g.lastTrick = null;
  g.broken = false;
  g.trickNo = 0;
  g.result = null;
  g.phase = 'bid';
  g.turn = (g.dealer + 1) % 4;
  g.moveId++;
}

export function legal(g, s) {
  if (g.phase !== 'play' || g.turn !== s) return [];
  const h = g.hands[s];
  let ok = followable(h, g.trick);
  if (!g.trick.length && !g.broken) {
    const non = ok.filter(c => suitOf(c) !== 'S');
    if (non.length) ok = non;
  }
  return ok;
}

export const current = g => (g.phase === 'bid' || g.phase === 'play' ? g.turn : -1);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.turn !== seat) return "It isn't your turn";
  if (a.type === 'bid') {
    if (g.phase !== 'bid') return 'Bidding is over';
    const n = Number(a.n);
    if (!(n >= 0 && n <= 13 && Number.isInteger(n))) return 'Bid 0 (Nil) to 13';
    g.bids[seat] = n;
    announce(g, seat, n === 0 ? 'Nil!' : `Bid ${n}`);
    g.moveId++;
    if (g.bids.every(b => b != null)) { g.phase = 'play'; g.turn = (g.dealer + 1) % 4; }
    else g.turn = (seat + 1) % 4;
    return null;
  }
  if (a.type === 'play') {
    if (g.phase !== 'play') return 'Not now';
    if (!legal(g, seat).includes(a.card)) return g.trick.length ? 'Follow suit if you can' : "Spades aren't broken yet";
    g.hands[seat] = g.hands[seat].filter(c => c !== a.card);
    g.trick.push({ seat, card: a.card });
    if (suitOf(a.card) === 'S' && !g.broken) { g.broken = true; if (g.trick.length > 1) announce(g, seat, 'Spades broken ♠'); }
    g.moveId++;
    if (g.trick.length < 4) { g.turn = (seat + 1) % 4; return null; }
    g.trickWinner = g.trick[trickWinner(g.trick, 'S')].seat;
    g.phase = 'trickEnd';
    g.turn = -1;
    return null;
  }
  return "That move isn't allowed";
}

export function advance(g) {
  if (g.phase === 'trickEnd') {
    const w = g.trickWinner;
    g.tricksWon[w]++;
    g.lastTrick = { cards: g.trick, winner: w };
    g.trick = [];
    g.trickNo++;
    g.moveId++;
    if (g.trickNo < 13) { g.phase = 'play'; g.turn = w; return; }
    scoreHand(g);
    return;
  }
  if (g.phase === 'handEnd') deal(g);
}

function scoreHand(g) {
  const res = [0, 1].map(t => {
    const pl = [t, t + 2];
    let pts = 0, bags = 0;
    const lines = [];
    const contract = pl.reduce((a, s) => a + (g.bids[s] || 0), 0);
    const took = pl.reduce((a, s) => a + (g.bids[s] ? g.tricksWon[s] : 0), 0);
    if (contract) {
      if (took >= contract) { pts += contract * 10 + (took - contract); bags += took - contract; lines.push(`made ${contract} (+${contract * 10 + took - contract})`); }
      else { pts -= contract * 10; lines.push(`set on ${contract} (−${contract * 10})`); }
    }
    for (const s of pl) if (g.bids[s] === 0) {
      if (g.tricksWon[s] === 0) { pts += 100; lines.push('Nil made (+100)'); }
      else { pts -= 100; bags += g.tricksWon[s]; pts += g.tricksWon[s]; lines.push('Nil broken (−100)'); }
    }
    g.bags[t] += bags;
    if (g.bags[t] >= 10) { pts -= 100; g.bags[t] -= 10; lines.push('10 bags (−100)'); }
    g.scores[t] += pts;
    return { pts, lines, contract, took };
  });
  g.result = res;
  const tgt = g.settings.target;
  const [a, b] = g.scores;
  const over = a >= tgt || b >= tgt || a <= -200 || b <= -200;
  if (over) {
    g.winner = a <= -200 ? 1 : b <= -200 ? 0 : a === b ? null : a > b ? 0 : 1;
    if (g.winner == null) { g.phase = 'handEnd'; return; } // tie: play another hand
    g.phase = 'over';
  } else g.phase = 'handEnd';
}

// ------------------------------------------------------------------ computer player

function estimate(h) {
  const bySuit = s => h.filter(c => suitOf(c) === s);
  let t = 0;
  for (const s of 'HDC') {
    const cs = bySuit(s), r = cs.map(rankOf);
    if (r.includes('A')) t += 1;
    if (r.includes('K') && cs.length >= 2 && cs.length <= 5) t += 0.8;
    if (r.includes('Q') && cs.length >= 3 && cs.length <= 4) t += 0.3;
  }
  const sp = bySuit('S'), sr = sp.map(rankOf);
  t += ['A', 'K', 'Q'].filter(x => sr.includes(x)).length * 0.9;
  t += Math.max(0, sp.length - 3) * 0.8;
  for (const s of 'HDC') if (bySuit(s).length <= 1 && sp.length >= 3) t += 0.5;
  return t;
}

export function botAction(g, s) {
  const rank = c => RANKS.indexOf(rankOf(c));
  if (g.phase === 'bid') {
    const h = g.hands[s];
    const e = estimate(h);
    const highSp = h.some(c => suitOf(c) === 'S' && rank(c) >= 9);
    if (e < 0.9 && !highSp && h.filter(c => rank(c) >= 11).length <= 1) return { type: 'bid', n: 0 };
    return { type: 'bid', n: Math.max(1, Math.min(13, Math.round(e))) };
  }
  const ok = legal(g, s);
  const t = teamOf(s);
  const need = [t, t + 2].reduce((a, x) => a + (g.bids[x] || 0), 0) - [t, t + 2].reduce((a, x) => a + (g.bids[x] ? g.tricksWon[x] : 0), 0);
  const nil = g.bids[s] === 0;
  const low = ok.slice().sort((a, b) => rank(a) - rank(b) + (suitOf(a) === 'S') * 20 - (suitOf(b) === 'S') * 20);
  if (!g.trick.length) {
    if (nil) return { type: 'play', card: low[0] };
    const ace = ok.find(c => rankOf(c) === 'A' && suitOf(c) !== 'S');
    return { type: 'play', card: need > 0 && ace ? ace : low[0] };
  }
  const winsWith = c => { const tr = [...g.trick, { seat: s, card: c }]; return tr[trickWinner(tr, 'S')].seat === s; };
  const curWin = g.trick[trickWinner(g.trick, 'S')].seat;
  const partnerWinning = curWin === partnerOf(s);
  const winners = low.filter(winsWith);
  if (nil) {
    const losers = ok.filter(c => !winsWith(c)).sort((a, b) => rank(b) - rank(a));
    return { type: 'play', card: losers[0] || low[0] };
  }
  if (need > 0 && !partnerWinning && winners.length) return { type: 'play', card: winners[0] };
  const losers = low.filter(c => !winsWith(c));
  return { type: 'play', card: losers[0] || low[0] };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, hand: g.hands[seat], legal: legal(g, seat), turn: g.turn, trick: g.trick, bids: g.bids, dealer: g.dealer,
    tricksWon: g.tricksWon, scores: g.scores, bags: g.bags, broken: g.broken, result: g.result, target: g.settings.target,
    handNo: g.handNo, trickNo: g.trickNo, winner: g.winner ?? null, counts: g.hands.map(h => h.length),
  };
}

export function tick(g) {
  if (g.phase === 'trickEnd') return { ms: 1500, run: () => advance(g) };
  if (g.phase === 'handEnd') return { ms: 9000, run: () => advance(g) };
  return null;
}
