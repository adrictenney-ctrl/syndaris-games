// Snakes & Ladders: race from square 1 to 100 on a 10×10 board. Roll the die and move; land at
// the foot of a ladder and climb it, land on a snake's head and slide down its tail. You need
// the exact number to land on 100 (or, with "bounce back", extra pips bounce you back). A six
// rolls again (optional). The traditional Indian game; our own board layout.

export const LADDERS = { 4: 25, 9: 31, 21: 42, 28: 84, 36: 57, 51: 67, 71: 92, 80: 99 };
export const SNAKES = { 17: 7, 47: 26, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { bounce: true, sixAgain: true, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.pos = g.seats.map(() => 0);    // 0 = off the board, waiting to start
  g.turn = g.order[0];
  g.phase = 'play';
  g.last = null;
  return g;
}

export const current = g => (g.phase === 'play' ? g.turn : -1);
export function applyAction(g, seat, a) {
  if (!a || a.type !== 'roll') return 'Roll the die';
  if (g.phase !== 'play' || seat !== g.turn) return "It isn't your turn";
  const d = 1 + Math.floor(Math.random() * 6);
  const from = g.pos[seat];
  let to = from + d;
  const path = [];
  if (to > 100) to = g.settings.bounce ? 200 - to : from;
  path.push(to);
  let via = null;
  if (LADDERS[to]) { via = 'ladder'; to = LADDERS[to]; path.push(to); announce(g, seat, `Ladder! ↑ ${to}`); }
  else if (SNAKES[to]) { via = 'snake'; to = SNAKES[to]; path.push(to); announce(g, seat, `Snake! ↓ ${to}`); }
  g.pos[seat] = to;
  g.last = { seat, d, from, to, via, path, id: (g.last?.id || 0) + 1 };
  g.moveId++;
  if (to === 100) { g.phase = 'over'; g.winner = seat; announce(g, seat, 'Made it to 100! 🏁'); return null; }
  if (!(d === 6 && g.settings.sixAgain)) g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
  return null;
}
export const botAction = () => ({ type: 'roll' });
export const viewFor = g => ({ phase: g.phase, turn: g.turn, order: g.order, pos: g.pos, last: g.last, winner: g.winner ?? null, moveId: g.moveId });

// Square n (1–100) → [col, row] with row 0 at the bottom, snaking back and forth.
export function cell(n) {
  const r = Math.floor((n - 1) / 10), c = (n - 1) % 10;
  return [r % 2 ? 9 - c : c, r];
}
