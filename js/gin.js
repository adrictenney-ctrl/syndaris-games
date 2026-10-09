// Gin Rummy: two players, ten cards each. Draw from the stock or take the top discard, then
// discard. Unmatched cards are "deadwood" (aces 1, pictures 10). When your deadwood is 10 or
// less after discarding you may knock: both hands are shown, the other player lays off what
// they can onto your melds, and the lower deadwood scores the difference. Knock with no
// deadwood at all for Gin (+25, no laying off). Get undercut (their deadwood is as low as
// yours) and they score the difference +25. First to the target wins (+100 game bonus).
// If the stock runs down to two cards the hand is a wash.
import { fullDeck, shuffle, announce } from './tricks.js?v=66';
import { bestMelds, val, layOffAll, sortMeld } from './rummycore.js?v=66';
import { handSort } from './rummy.js?v=66';

export function createGame(settings) {
  const g = { settings: { target: 100, ...settings }, scores: [0, 0], dealer: Math.floor(Math.random() * 2), handNo: 0, annId: 0, moveId: 0 };
  deal(g);
  return g;
}

function deal(g) {
  g.handNo++;
  g.dealer = 1 - g.dealer;
  g.stock = shuffle(fullDeck());
  g.hands = [handSort(g.stock.splice(0, 10)), handSort(g.stock.splice(0, 10))];
  g.discard = [g.stock.pop()];
  g.turn = 1 - g.dealer;
  g.phase = 'draw';
  g.took = null;
  g.result = null;
  g.moveId++;
}

export const current = g => (g.phase === 'draw' || g.phase === 'discard' ? g.turn : -1);
export const deadwood = h => bestMelds(h).deadwood;

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.turn !== seat) return "It isn't your turn";
  const h = g.hands[seat];
  if (a.type === 'draw') {
    if (g.phase !== 'draw') return 'You already drew';
    if (a.from === 'discard') { g.took = g.discard.pop(); h.push(g.took); }
    else { h.push(g.stock.pop()); g.took = null; }
    g.hands[seat] = handSort(h);
    g.phase = 'discard';
    g.moveId++;
    return null;
  }
  if (a.type === 'discard') {
    if (g.phase !== 'discard') return 'Draw a card first';
    if (!h.includes(a.card)) return 'That card isn’t in your hand';
    if (a.card === g.took) return 'You can’t throw back the card you just picked up';
    const rest = h.filter(c => c !== a.card);
    if (a.knock && deadwood(rest) > 10) return 'You need 10 or less deadwood to knock';
    g.hands[seat] = rest;
    g.discard.push(a.card);
    g.moveId++;
    if (a.knock) return knock(g, seat);
    if (g.stock.length <= 2) { g.phase = 'handEnd'; g.result = { wash: true }; g.nextAt = Date.now() + 6000; announce(g, seat, 'A wash — no score'); return null; }
    g.turn = 1 - seat;
    g.phase = 'draw';
    g.took = null;
    return null;
  }
  return "That move isn't allowed";
}

function knock(g, s) {
  const o = 1 - s;
  const K = bestMelds(g.hands[s]);
  const D = bestMelds(g.hands[o]);
  const gin = K.deadwood === 0;
  let defDead = D.dead, laid = [];
  if (!gin) { const r = layOffAll(K.melds, D.dead); defDead = r.left; laid = r.laid; }
  const dw = defDead.reduce((t, c) => t + val(c), 0);
  let winner, pts;
  if (gin) { winner = s; pts = dw + 25; }
  else if (K.deadwood < dw) { winner = s; pts = dw - K.deadwood; }
  else { winner = o; pts = K.deadwood - dw + 25; }
  g.scores[winner] += pts;
  announce(g, s, gin ? 'GIN!' : 'Knock!');
  g.result = { knocker: s, gin, undercut: winner === o, winner, pts, kMelds: K.melds.map(sortMeld), kDead: K.dead, kDw: K.deadwood, dMelds: D.melds.map(sortMeld), dDead: defDead, dDw: dw, laid };
  if (g.scores[winner] >= g.settings.target) { g.scores[winner] += 100; g.phase = 'over'; g.winner = winner; }
  else { g.phase = 'handEnd'; g.nextAt = Date.now() + 12000; }
  return null;
}

export function advance(g) { if (g.phase === 'handEnd') deal(g); }
export function tick(g) { return g.phase === 'handEnd' ? { ms: Math.max(0, g.nextAt - Date.now()), run: () => advance(g) } : null; }

// ------------------------------------------------------------------ computer player
function bestDiscard(h, not) {
  let best = null;
  for (const c of h) {
    if (c === not) continue;
    const d = deadwood(h.filter(x => x !== c));
    if (!best || d < best.d || (d === best.d && val(c) > val(best.c))) best = { c, d };
  }
  return best;
}
export function botAction(g, s) {
  const h = g.hands[s];
  if (g.phase === 'draw') {
    const top = g.discard[g.discard.length - 1];
    const now = deadwood(h);
    const withTop = bestDiscard([...h, top], top);
    return { type: 'draw', from: withTop && withTop.d < now - 2 ? 'discard' : 'stock' };
  }
  const b = bestDiscard(h, g.took);
  return { type: 'discard', card: b.c, knock: b.d <= (g.settings.level === 'easy' ? 4 : 10) };
}

export function viewFor(g, seat) {
  const mine = g.hands[seat] || [];
  const bm = bestMelds(mine);
  return {
    phase: g.phase, turn: g.turn, hand: mine, top: g.discard[g.discard.length - 1] || null, stock: g.stock.length, scores: g.scores,
    took: g.took, deadwood: bm.deadwood, melds: bm.melds, result: g.result, target: g.settings.target, handNo: g.handNo, winner: g.winner ?? null,
  };
}
export const check = g => (g.stock.length + g.discard.length + g.hands.flat().length !== 52 ? 'count' : null);
