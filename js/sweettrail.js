// Sweet Trail: a race along a candy-coloured path — no reading, no counting. Draw a card: a
// colour moves you to the next square of that colour; a double colour, to the second one; a
// treat card sends you straight to that treat's square (even backwards!). Land on a Toffee Pit
// and you're stuck for a turn. Land exactly on the start of a Sugar Bridge and you cross it.
// First to the Candy Castle at the end wins. Our own board and cards.

export const COLORS = [{ k: 'red', c: '#e0505a' }, { k: 'purple', c: '#9a5ad0' }, { k: 'yellow', c: '#f0cc3a' }, { k: 'blue', c: '#4a90e0' }, { k: 'orange', c: '#f08a2a' }, { k: 'green', c: '#4ab060' }];
export const LEN = 120;
export const TREATS = [{ k: 'pop', ic: '🍭', name: 'Lollipop Woods', at: 9 }, { k: 'cup', ic: '🧁', name: 'Cupcake Hill', at: 22 }, { k: 'donut', ic: '🍩', name: 'Donut Dunes', at: 44 }, { k: 'choc', ic: '🍫', name: 'Cocoa Falls', at: 69 }, { k: 'ice', ic: '🍦', name: 'Sundae Peak', at: 91 }, { k: 'taffy', ic: '🍬', name: 'Taffy Town', at: 104 }];
export const TOFFEE = [33, 57, 86];
export const BRIDGES = { 5: 27, 50: 63 };
// Square kinds: color index, 'treat:k', 'toffee'. Square 0 is the start, LEN is the castle.
export const SQUARES = (() => {
  const sq = [];
  let ci = 0;
  for (let i = 1; i < LEN; i++) {
    const t = TREATS.find(x => x.at === i);
    if (t) sq[i] = 'treat:' + t.k;
    else if (TOFFEE.includes(i)) sq[i] = 'toffee';
    else { sq[i] = ci; ci = (ci + 1) % 6; }
  }
  return sq;
})();

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const DECK = () => shuffle([...COLORS.flatMap((_, i) => [...Array(7).fill({ c: i, n: 1 }), ...Array(2).fill({ c: i, n: 2 })]), ...TREATS.map(t => ({ treat: t.k }))]);

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.pos = g.seats.map(() => 0);
  g.stuck = g.seats.map(() => false);
  g.deck = DECK();
  g.turn = g.order[0];
  g.phase = 'play';
  g.last = null;
  return g;
}

export const current = g => (g.phase === 'play' ? g.turn : -1);
export function applyAction(g, seat, a) {
  if (!a || a.type !== 'draw') return 'Draw a card';
  if (g.phase !== 'play' || seat !== g.turn) return "It isn't your turn";
  const nextTurn = () => {
    let i = g.order.indexOf(seat);
    for (let k = 0; k < g.order.length; k++) {
      i = (i + 1) % g.order.length;
      const s = g.order[i];
      if (g.stuck[s]) { g.stuck[s] = false; announce(g, s, 'Stuck in toffee — skips a turn'); continue; }
      g.turn = s; return;
    }
  };
  if (!g.deck.length) g.deck = DECK();
  const card = g.deck.pop();
  const from = g.pos[seat];
  let to = from;
  if (card.treat) to = TREATS.find(t => t.k === card.treat).at;
  else {
    for (let n = 0; n < card.n; n++) { let p = to + 1; while (p < LEN && SQUARES[p] !== card.c) p++; to = p; }
  }
  let bridge = false;
  if (BRIDGES[to]) { to = BRIDGES[to]; bridge = true; }
  g.pos[seat] = Math.min(to, LEN);
  g.last = { seat, card, from, to: g.pos[seat], bridge, id: (g.last?.id || 0) + 1 };
  g.moveId++;
  if (g.pos[seat] >= LEN) { g.phase = 'over'; g.winner = seat; announce(g, seat, 'Candy Castle! 🏰'); return null; }
  if (bridge) announce(g, seat, 'Over the Sugar Bridge! 🌈');
  if (SQUARES[g.pos[seat]] === 'toffee') { g.stuck[seat] = true; announce(g, seat, 'Toffee pit! 🍯'); }
  nextTurn();
  return null;
}
export const botAction = () => ({ type: 'draw' });
export const viewFor = g => ({ phase: g.phase, turn: g.turn, order: g.order, pos: g.pos, stuck: g.stuck, last: g.last, winner: g.winner ?? null, moveId: g.moveId });
