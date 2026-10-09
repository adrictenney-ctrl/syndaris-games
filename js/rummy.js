// Rummy: draw a card (from the stock or the top of the discard pile), lay down melds — sets of
// three or four of a rank, or runs of three or more in a suit (ace low) — add single cards to
// anyone's melds on the table, then discard one. First to get rid of every card wins the hand
// and scores what everyone else is still holding (aces 1, pictures 10, the rest face value);
// going out all at once, without having melded before, is "Rummy" and scores double.
// A card taken from the discard pile can't be thrown straight back.
import { fullDeck, shuffle, announce } from './tricks.js?v=68';
import { isMeld, sortMeld, val, bestMelds, fits, allMelds } from './rummycore.js?v=68';

export const handSort = h => h.slice().sort((a, b) => 'SHDC'.indexOf(a[1]) - 'SHDC'.indexOf(b[1]) || 'A23456789TJQK'.indexOf(a[0]) - 'A23456789TJQK'.indexOf(b[0]));

export function createGame(settings, players) {
  const g = { settings: { target: 100, ...settings }, seats: players.map(p => !!p), dealerIdx: -1, handNo: 0, annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.scores = g.seats.map(() => 0);
  deal(g);
  return g;
}

function deal(g) {
  g.handNo++;
  g.dealerIdx = (g.dealerIdx + 1) % g.order.length;
  const n = g.order.length === 2 ? 10 : g.order.length <= 4 ? 7 : 6;
  g.stock = shuffle(fullDeck());
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = handSort(g.stock.splice(0, n));
  g.discard = [g.stock.pop()];
  g.melds = [];          // { cards, by }
  g.melded = g.seats.map(() => false);
  g.turn = g.order[(g.dealerIdx + 1) % g.order.length];
  g.phase = 'draw';
  g.took = null;         // card taken from the discard pile this turn
  g.recycled = false;
  g.result = null;
  g.moveId++;
}

export const current = g => (g.phase === 'draw' || g.phase === 'play' ? g.turn : -1);
const next = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.turn !== seat || (g.phase !== 'draw' && g.phase !== 'play')) return "It isn't your turn";
  const h = g.hands[seat];
  if (a.type === 'draw') {
    if (g.phase !== 'draw') return 'You already drew';
    if (a.from === 'discard') {
      if (!g.discard.length) return 'The discard pile is empty';
      g.took = g.discard.pop();
      h.push(g.took);
    } else {
      if (!g.stock.length) {
        // The discard pile becomes the stock once; when that runs out too, the hand is a wash.
        if (g.recycled || g.discard.length < 2) return wash(g);
        const top = g.discard.pop(); g.stock = shuffle(g.discard); g.discard = [top]; g.recycled = true;
      }
      h.push(g.stock.pop());
      g.took = null;
    }
    g.hands[seat] = handSort(h);
    g.phase = 'play';
    g.moveId++;
    return null;
  }
  if (g.phase !== 'play') return 'Draw a card first';
  if (a.type === 'meld') {
    const cs = a.cards || [];
    if (!cs.every(c => h.includes(c)) || new Set(cs).size !== cs.length) return 'Those cards aren’t in your hand';
    if (!isMeld(cs)) return 'A meld is 3–4 of a kind, or 3+ in a row of one suit';
    g.hands[seat] = h.filter(c => !cs.includes(c));
    g.melds.push({ cards: sortMeld(cs), by: seat });
    announce(g, seat, 'Meld!');
    g.moveId++;
    if (!g.hands[seat].length) return goOut(g, seat);
    g.meldedNow = true;
    return null;
  }
  if (a.type === 'layoff') {
    const m = g.melds[a.meld];
    if (!m) return 'Pick a meld on the table';
    if (!h.includes(a.card)) return 'That card isn’t in your hand';
    if (!fits(m.cards, a.card)) return 'That card doesn’t fit there';
    g.hands[seat] = h.filter(c => c !== a.card);
    m.cards = sortMeld([...m.cards, a.card]);
    g.moveId++;
    g.meldedNow = true;
    if (!g.hands[seat].length) return goOut(g, seat);
    return null;
  }
  if (a.type === 'discard') {
    if (!h.includes(a.card)) return 'That card isn’t in your hand';
    if (a.card === g.took && h.length > 1) return 'You can’t throw back the card you just picked up';
    g.hands[seat] = h.filter(c => c !== a.card);
    g.discard.push(a.card);
    g.moveId++;
    if (!g.hands[seat].length) return goOut(g, seat);
    if (g.meldedNow) g.melded[seat] = true;
    g.meldedNow = false;
    g.turn = next(g, seat);
    g.phase = 'draw';
    g.took = null;
    return null;
  }
  return "That move isn't allowed";
}

function wash(g) {
  g.result = { wash: true };
  announce(g, g.turn, 'Out of cards — a wash');
  g.phase = 'handEnd';
  g.nextAt = Date.now() + 6000;
  return null;
}

function goOut(g, s) {
  const rummy = !g.melded[s];
  let pts = 0;
  const left = {};
  for (const o of g.order) if (o !== s) { const v = g.hands[o].reduce((t, c) => t + val(c), 0); left[o] = v; pts += v; }
  if (rummy) pts *= 2;
  g.scores[s] += pts;
  g.result = { winner: s, pts, rummy, left };
  announce(g, s, rummy ? 'Rummy! ×2' : 'Out!');
  g.meldedNow = false;
  const tgt = g.settings.target;
  g.phase = !tgt || g.scores[s] >= tgt ? 'over' : 'handEnd';
  g.nextAt = Date.now() + 9000;
  return null;
}

export function advance(g) { if (g.phase === 'handEnd') deal(g); }
export function tick(g) { return g.phase === 'handEnd' ? { ms: Math.max(0, g.nextAt - Date.now()), run: () => advance(g) } : null; }

// ------------------------------------------------------------------ computer player
export function botAction(g, s) {
  const h = g.hands[s];
  if (g.phase === 'draw') {
    const top = g.discard[g.discard.length - 1];
    const helps = top && (allMelds([...h, top]).some(m => m.includes(top)) || g.melds.some(m => fits(m.cards, top)));
    return { type: 'draw', from: helps ? 'discard' : 'stock' };
  }
  const best = bestMelds(h);
  const m = best.melds[0];
  if (m) return { type: 'meld', cards: m };
  for (const c of h) { const i = g.melds.findIndex(x => fits(x.cards, c)); if (i >= 0) return { type: 'layoff', card: c, meld: i }; }
  const dead = best.dead.filter(c => c !== g.took).sort((a, b) => val(b) - val(a));
  if (dead.length > 1 && Math.random() < 0.25) return { type: 'discard', card: dead[Math.floor(Math.random() * dead.length)] };
  return { type: 'discard', card: dead[0] || h.find(c => c !== g.took) || h[0] };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, hand: g.hands[seat] || [], melds: g.melds, top: g.discard[g.discard.length - 1] || null, stock: g.stock.length,
    counts: g.hands.map(h => h.length), order: g.order, scores: g.scores, took: g.took, result: g.result, target: g.settings.target, handNo: g.handNo,
  };
}

export const check = g => (g.stock.length + g.discard.length + g.hands.flat().length + g.melds.reduce((t, m) => t + m.cards.length, 0) !== 52 ? 'count' : null);
