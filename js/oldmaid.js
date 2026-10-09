// Old Maid: one queen is taken out, so one queen can never be paired — the Old Maid. Deal the
// rest. Everyone throws away their pairs (two cards of the same rank). On your turn, take one
// face-down card from the next player who still has cards; pair it if you can. Empty your hand
// and you're safe. Whoever is left holding the Old Maid loses.
import { fullDeck, shuffle, rankOf } from './tricks.js?v=66';

export const MAID = 'QS';

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const deck = shuffle(fullDeck().filter(c => c !== 'QC'));
  g.hands = g.seats.map(() => []);
  deck.forEach((c, i) => g.hands[g.order[i % g.order.length]].push(c));
  g.pairs = g.seats.map(() => 0);
  g.safe = [];
  for (const s of g.order) dropPairs(g, s);
  for (const s of g.order) shuffle(g.hands[s]);
  g.turn = g.order[0];
  g.phase = 'play';
  g.last = null;
  settle(g);
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

function dropPairs(g, s) {
  const h = g.hands[s];
  const by = {};
  h.forEach(c => { (by[rankOf(c)] ||= []).push(c); });
  let out = [];
  for (const cs of Object.values(by)) for (let i = 0; i + 1 < cs.length; i += 2) { out.push(cs[i], cs[i + 1]); g.pairs[s]++; }
  g.hands[s] = h.filter(c => !out.includes(c));
  return out.length / 2;
}

const active = g => g.order.filter(s => g.hands[s].length);
export const victim = (g, s) => { const a = active(g); if (a.length < 2) return -1; const i = g.order.indexOf(s); for (let k = 1; k <= g.order.length; k++) { const t = g.order[(i + k) % g.order.length]; if (t !== s && g.hands[t].length) return t; } return -1; };

// Players who emptied their hands are safe; the game ends when only the Old Maid is left.
function settle(g) {
  for (const s of g.order) if (!g.hands[s].length && !g.safe.includes(s)) { g.safe.push(s); announce(g, s, 'Safe! 🎉'); }
  const a = active(g);
  if (a.length <= 1) { g.phase = 'over'; g.loser = a[0] ?? g.hands.findIndex(h => h.includes(MAID)); return; }
  if (!g.hands[g.turn].length) {
    const i = g.order.indexOf(g.turn);
    for (let k = 1; k <= g.order.length; k++) { const t = g.order[(i + k) % g.order.length]; if (g.hands[t].length) { g.turn = t; break; } }
  }
}

export const current = g => (g.phase === 'play' ? g.turn : -1);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (a.type === 'shuffle') {
    if (!g.hands[seat]?.length) return 'No cards';
    shuffle(g.hands[seat]);
    g.moveId++;
    return null;
  }
  if (a.type !== 'take') return "That move isn't allowed";
  if (g.phase !== 'play' || g.turn !== seat) return "It isn't your turn";
  const from = victim(g, seat);
  const i = Number(a.i);
  if (from < 0 || !(i >= 0 && i < g.hands[from].length)) return 'Pick one of their cards';
  const [card] = g.hands[from].splice(i, 1);
  g.hands[seat].push(card);
  const paired = dropPairs(g, seat);
  g.last = { from, to: seat, paired: !!paired, maid: card === MAID, card: paired ? card : null };
  if (card === MAID) announce(g, seat, '😱');
  else if (paired) announce(g, seat, 'A pair!');
  shuffle(g.hands[seat]);
  g.moveId++;
  // Next turn: the player you took from, if they still have cards — otherwise onward.
  g.turn = from;
  settle(g);
  if (g.phase === 'play' && g.turn === seat) settle(g);
  return null;
}

export function botAction(g, s) {
  const from = victim(g, s);
  return { type: 'take', i: Math.floor(Math.random() * g.hands[from].length) };
}

export function viewFor(g, seat) {
  const from = victim(g, seat);
  return {
    phase: g.phase, turn: g.turn, hand: g.hands[seat] || [], counts: g.hands.map(h => h.length), order: g.order, pairs: g.pairs,
    from, fromCount: from >= 0 ? g.hands[from].length : 0, safe: g.safe, last: g.last, loser: g.loser ?? null, moveId: g.moveId,
  };
}

export const check = g => (g.hands.flat().length + g.pairs.reduce((a, b) => a + b, 0) * 2 !== 51 ? 'count' : null);
