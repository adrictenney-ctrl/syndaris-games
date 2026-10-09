// Orchard: everyone has a little tree with ten pieces of fruit and an empty basket. Spin the
// spinner: pick 1, 2, 3 or 4 fruit into your basket — but a Crow or a Puppy makes you put two
// back on the tree, and a Spilled Basket puts them all back. First to pick their tree bare wins.
// A counting game for little ones. Our own spinner and art.

export const SPIN = [{ k: 1, label: 'Pick 1' }, { k: 2, label: 'Pick 2' }, { k: 3, label: 'Pick 3' }, { k: 4, label: 'Pick 4' }, { k: 'crow', label: 'Crow! Put 2 back', ic: '🐦‍⬛' }, { k: 'pup', label: 'Puppy! Put 2 back', ic: '🐶' }, { k: 'spill', label: 'Spilled basket! Put them all back', ic: '🧺' }];
export const FRUIT = ['🍒', '🍎', '🍐', '🍑', '🍋', '🫐', '🍊', '🍇'];
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.tree = g.seats.map(() => 10);
  g.fruit = g.seats.map((_, s) => FRUIT[s % FRUIT.length]);
  g.turn = g.order[0];
  g.phase = 'play';
  g.last = null;
  return g;
}
export const current = g => (g.phase === 'play' ? g.turn : -1);
export function applyAction(g, seat, a) {
  if (!a || a.type !== 'spin') return 'Spin the spinner';
  if (g.phase !== 'play' || seat !== g.turn) return "It isn't your turn";
  const i = Math.floor(Math.random() * SPIN.length);
  const sp = SPIN[i];
  const before = g.tree[seat];
  if (typeof sp.k === 'number') g.tree[seat] = Math.max(0, g.tree[seat] - sp.k);
  else if (sp.k === 'spill') g.tree[seat] = 10;
  else g.tree[seat] = Math.min(10, g.tree[seat] + 2);
  g.last = { seat, i, before, after: g.tree[seat], id: (g.last?.id || 0) + 1 };
  announce(g, seat, sp.label);
  g.moveId++;
  if (!g.tree[seat]) { g.phase = 'over'; g.winner = seat; announce(g, seat, 'Tree picked bare! 🧺'); return null; }
  g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
  return null;
}
export const botAction = () => ({ type: 'spin' });
export const viewFor = g => ({ phase: g.phase, turn: g.turn, order: g.order, tree: g.tree, fruit: g.fruit, last: g.last, winner: g.winner ?? null, moveId: g.moveId });
