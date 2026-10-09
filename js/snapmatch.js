// Snap Match: 57 round cards with 8 pictures each — and any two cards share exactly ONE picture.
// Your card is on your phone; the middle card is on the table. Spot the picture they share and tap
// it on your phone first to win the middle card (it becomes your new card). Tap a wrong one and
// you're frozen for two seconds. When the pile runs out, whoever won the most cards wins.
import { base, shuffle, sfx, announce } from './party.js?v=68';

export const SYMS = '🍎 🍌 🍇 🍉 🍓 🥕 🌽 🍄 🌵 🌻 🌙 ⭐ ☀️ ⚡ ❄️ 🔥 💧 🌈 ☂️ ⚓ 🚲 🚗 ✈️ 🚀 ⛵ 🎈 🎁 🎸 🎺 🥁 🎲 🧩 ⚽ 🏀 🎯 🔑 🔒 💡 ⏰ ✂️ 📌 ✏️ 📚 🧲 🔔 🎩 👓 👑 💎 🐶 🐱 🐸 🐢 🐙 🦋 🐝 🦉'.split(' ');
// The 57 cards: lines of the projective plane of order 7.
export const DECK = (() => {
  const n = 7, cards = [];
  for (let m = 0; m < n; m++) for (let c = 0; c < n; c++) cards.push([...Array(n).keys()].map(x => x * n + ((m * x + c) % n)).concat(n * n + m));
  for (let c = 0; c < n; c++) cards.push([...Array(n).keys()].map(y => c * n + y).concat(n * n + n));
  cards.push([...Array(n + 1).keys()].map(m => n * n + m));
  return cards;
})();

export function createGame(settings, players) {
  const g = base(settings, players, { cards: 30 });
  const pile = shuffle([...DECK.keys()]);
  g.card = g.seats.map((_, s) => (g.order.includes(s) ? pile.pop() : null));
  g.pile = pile.slice(0, Math.min(pile.length, g.settings.cards));
  g.center = g.pile.pop();
  g.layout = shuffle([...Array(8).keys()]);
  g.frozen = {};
  g.round = 1;
  g.phase = 'play';
  return g;
}
export const shared = (a, b) => DECK[a].find(x => DECK[b].includes(x));
export const pending = g => (g.phase === 'play' ? shuffle(g.order.filter(s => !(g.frozen[s] > Date.now()))) : []);
export const current = g => (g.phase === 'play' ? g.order[0] : -1);
export const turnSeat = () => -1;
export const collecting = () => false;
export const botDelay = () => 2600 + Math.random() * 3400;

export function applyAction(g, seat, a) {
  if (!a || a.type !== 'pick' || g.phase !== 'play') return 'Not now';
  if (!g.order.includes(seat)) return "You're not in this game";
  if (g.frozen[seat] > Date.now()) return 'Frozen! Wait a moment';
  if (Number(a.c) !== g.center) return 'Too slow — that card’s gone';
  const sym = Number(a.v);
  if (sym !== shared(g.card[seat], g.center)) { g.frozen[seat] = Date.now() + 2000; announce(g, seat, '❌ Frozen!'); g.moveId++; return null; }
  g.score[seat]++;
  g.card[seat] = g.center;
  g.last = { s: seat, sym };
  announce(g, seat, `${SYMS[sym]} Snap!`);
  sfx(g, 'ding');
  if (!g.pile.length) {
    const top = Math.max(...g.order.map(s => g.score[s]));
    g.winners = g.order.filter(s => g.score[s] === top);
    g.winner = g.winners[0];
    g.phase = 'over';
  } else { g.center = g.pile.pop(); g.layout = shuffle([...Array(8).keys()]); g.round++; }
  g.moveId++;
  return null;
}
// Thaw frozen players so their phone lights up again.
export function tick(g) {
  const t = Object.values(g.frozen).filter(x => x > Date.now());
  if (g.phase !== 'play' || !t.length) return null;
  return { ms: Math.max(0, Math.min(...t) - Date.now()) + 30, run: () => { for (const k in g.frozen) if (g.frozen[k] <= Date.now()) delete g.frozen[k]; g.moveId++; } };
}
export const botAction = (g, seat) => ({ type: 'pick', v: shared(g.card[seat], g.center), c: g.center });

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Won', g.score[seat] ?? 0], ['Left', g.pile.length]] };
  if (g.phase === 'over') { v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Sharpest eyes!' : 'Game over', sub: `You won ${g.score[seat]} cards` }; return v; }
  const mine = DECK[g.card[seat]];
  const frozen = g.frozen[seat] > Date.now();
  // Shuffle the picture order per card so it doesn't match the table's layout.
  const order = [...mine].sort((x, y) => ((x * 31 + g.card[seat]) % 17) - ((y * 31 + g.card[seat]) % 17));
  v.ui = { k: 'buttons', key: `m${g.center}:${g.card[seat]}:${frozen ? 1 : 0}`, title: frozen ? '❄️ Frozen!' : 'Find the match!', sub: 'Tap the picture that’s also on the table’s card', myturn: !frozen,
    html: '', buttons: order.map(x => ({ type: 'pick', label: SYMS[x], cls: 'sm-sym', dis: frozen, payload: { v: x, c: g.center } })) };
  return v;
}
