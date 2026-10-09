// Line Up 5: a 10×10 board shows every card (except Jacks) twice, with free corners. Players
// form two or three teams (alternating around the table). On your turn play a card from your
// hand and put a chip of your team's colour on a matching space, then draw. Two-eyed Jacks
// (♣ ♦) go anywhere; one-eyed Jacks (♠ ♥) take an opponent's chip off (not one in a finished
// line). A line is five in a row — across, down or diagonally; corners count for everyone.
// Two teams need two lines to win; three teams need one. A card whose spaces are both taken is
// dead: trade it in for a new one (once a turn). Our own board layout.
import { fullDeck, shuffle, announce } from './tricks.js?v=67';

export const N = 10;
// Our own fixed layout: both decks without Jacks, dealt into the board by a seeded shuffle.
export const BOARD = (() => {
  const cards = [...fullDeck('23456789TQKA'), ...fullDeck('23456789TQKA')];
  let s = 20261008;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  const b = [];
  let k = 0;
  for (let i = 0; i < N * N; i++) b.push([0, 9, 90, 99].includes(i) ? '*' : cards[k++]);
  return b;
})();
export const TEAM_COLOR = ['#3a7ad8', '#4aa85a', '#d8443a'];
export const TEAM_NAME = ['Blue', 'Green', 'Red'];
export const isTwoEye = c => c === 'JC' || c === 'JD';
export const isOneEye = c => c === 'JS' || c === 'JH';
const HAND = n => (n <= 2 ? 7 : n <= 4 ? 6 : n <= 6 ? 5 : n <= 9 ? 4 : 3);

export function createGame(settings, players) {
  const g = { settings: { teams: 2, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const n = g.order.length;
  g.nTeams = n === 3 || (n % 3 === 0 && g.settings.teams === 3) ? 3 : 2;
  g.team = g.seats.map(() => null);
  g.order.forEach((s, i) => { g.team[s] = i % g.nTeams; });
  g.deck = shuffle([...fullDeck(), ...fullDeck()]);
  g.discard = [];
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.deck.splice(0, HAND(n));
  g.chips = Array(N * N).fill(null);
  g.locked = Array(N * N).fill(null);    // team whose finished line includes this chip
  g.lines = Array(g.nTeams).fill(0);
  g.need = g.nTeams === 2 ? 2 : 1;
  g.turn = g.order[0];
  g.traded = false;
  g.phase = 'play';
  g.last = null;
  return g;
}

const owns = (g, i, t) => BOARD[i] === '*' || g.chips[i] === t;
export const spacesFor = (g, card) => {
  if (isTwoEye(card)) return g.chips.map((c, i) => (c == null && BOARD[i] !== '*' ? i : -1)).filter(i => i >= 0);
  if (isOneEye(card)) return [];
  return BOARD.map((b, i) => (b === card && g.chips[i] == null ? i : -1)).filter(i => i >= 0);
};
export const removable = (g, seat) => g.chips.map((c, i) => (c != null && c !== g.team[seat] && g.locked[i] == null ? i : -1)).filter(i => i >= 0);
export const dead = (g, card) => !isTwoEye(card) && !isOneEye(card) && !spacesFor(g, card).length;
// Can this player play anything at all?
export const canMove = (g, s) => g.hands[s].some(c => (isOneEye(c) ? removable(g, s).length : spacesFor(g, c).length));
export const current = g => (g.phase === 'play' ? g.turn : -1);

// New lines through i for team t: each 5-window of t's chips containing i sharing at most one
// chip with a line t already made.
function findLines(g, i, t) {
  const x0 = i % N, y0 = Math.floor(i / N);
  let made = 0;
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    for (let off = -4; off <= 0; off++) {
      const cells = [];
      for (let k = 0; k < 5; k++) { const x = x0 + (off + k) * dx, y = y0 + (off + k) * dy; if (x < 0 || y < 0 || x >= N || y >= N) break; cells.push(y * N + x); }
      if (cells.length < 5 || !cells.every(c => owns(g, c, t))) continue;
      if (cells.filter(c => g.locked[c] === t).length > 1) continue;
      cells.forEach(c => { if (BOARD[c] !== '*') g.locked[c] = t; });
      made++;
      break;
    }
  }
  return made;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It isn't your turn";
  const h = g.hands[seat];
  if (a.type === 'pass') {
    if (canMove(g, seat) || h.some(c => dead(g, c))) return 'You can still play';
    g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
    g.traded = false;
    g.moveId++;
    return null;
  }
  if (!h.includes(a.card)) return 'That card isn’t in your hand';
  const draw = () => { if (!g.deck.length) { g.deck = shuffle(g.discard); g.discard = []; } if (g.deck.length) h.push(g.deck.pop()); };
  const drop = () => { h.splice(h.indexOf(a.card), 1); g.discard.push(a.card); };
  if (a.type === 'trade') {
    if (g.traded && canMove(g, seat)) return 'Only one dead card a turn';
    if (!dead(g, a.card)) return 'That card still has an open space';
    drop(); draw(); g.traded = true; g.moveId++;
    return null;
  }
  const i = Number(a.i);
  const t = g.team[seat];
  if (isOneEye(a.card)) {
    if (!removable(g, seat).includes(i)) return 'Take off an opponent’s chip that isn’t in a finished line';
    g.chips[i] = null;
    drop(); draw();
    g.last = { i, removed: true, seat };
    announce(g, seat, 'Removes a chip ✂️');
  } else {
    if (!spacesFor(g, a.card).includes(i)) return 'That card can’t go there';
    g.chips[i] = t;
    drop(); draw();
    g.last = { i, seat };
    const made = findLines(g, i, t);
    if (made) { g.lines[t] += made; announce(g, seat, 'A line of five! 🎉'); }
    if (g.lines[t] >= g.need) { g.phase = 'over'; g.winner = t; g.moveId++; return null; }
  }
  g.moveId++;
  g.traded = false;
  g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
  g.turns = (g.turns || 0) + 1;
  // Out of cards, or a very long stalemate: most lines wins, otherwise a draw.
  if (g.order.every(s => !g.hands[s].length) || g.turns > 400) {
    const top = Math.max(...g.lines);
    g.phase = 'over';
    g.winner = g.lines.filter(x => x === top).length === 1 ? g.lines.indexOf(top) : null;
  }
  return null;
}

// ------------------------------------------------------------------ computer player
function value(g, i, t) {
  // How much this space helps team t: the best 5-window through it.
  const x0 = i % N, y0 = Math.floor(i / N);
  let best = 0;
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) for (let off = -4; off <= 0; off++) {
    let mine = 0, ok = true;
    for (let k = 0; k < 5; k++) {
      const x = x0 + (off + k) * dx, y = y0 + (off + k) * dy;
      if (x < 0 || y < 0 || x >= N || y >= N) { ok = false; break; }
      const c = y * N + x;
      if (c === i) continue;
      if (owns(g, c, t)) mine++; else if (g.chips[c] != null) { ok = false; break; }
    }
    if (ok) best = Math.max(best, mine === 4 ? 100 : mine * mine);
  }
  return best;
}
export function botAction(g, s) {
  const h = g.hands[s], t = g.team[s];
  for (const c of h) if ((!g.traded || !canMove(g, s)) && dead(g, c)) return { type: 'trade', card: c };
  let best = null, bv = -Infinity;
  for (const c of h) {
    if (isOneEye(c)) {
      for (const i of removable(g, s)) { const v = Math.max(...[...Array(g.nTeams).keys()].filter(o => o !== t).map(o => (g.chips[i] === o ? value(g, i, o) : 0))) * 0.9 - 5; if (v > bv) { bv = v; best = { type: 'play', card: c, i }; } }
      continue;
    }
    for (const i of spacesFor(g, c)) {
      let v = value(g, i, t) + Math.max(0, ...[...Array(g.nTeams).keys()].filter(o => o !== t).map(o => value(g, i, o) * 0.8)) + Math.random();
      if (isTwoEye(c)) v -= 8;
      if (v > bv) { bv = v; best = { type: 'play', card: c, i }; }
    }
  }
  if (best) return best;
  const d = h.find(c => dead(g, c));
  return d ? { type: 'trade', card: d } : { type: 'pass' };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, order: g.order, team: g.team, nTeams: g.nTeams, hand: g.hands[seat] || [], chips: g.chips, locked: g.locked, lines: g.lines, need: g.need,
    last: g.last, traded: g.traded, winner: g.winner ?? null, deck: g.deck.length, moveId: g.moveId,
  };
}
