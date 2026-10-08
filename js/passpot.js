// Pass the Pot: everyone starts with a few chips. On your turn roll one die for each chip you
// have (up to three). Each die says where one of your chips goes: to the player on your left,
// to the player on your right, into the pot in the middle — or it stays with you. A player
// with no chips skips their turn but is still in: chips can come back to them. The last
// player holding any chips wins the whole pot. Runs only on the table (host).
//
// "Left" is the next player round the table (clockwise seen from above), "right" the one before.

export const FACES = ['L', 'R', 'P', 'K', 'K', 'K'];   // left, right, pot, keep ×3
export const FACE_NAME = { L: 'to the left', R: 'to the right', P: 'into the pot', K: 'kept' };

export function createGame(settings, players) {
  const g = { settings: { chips: 3, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, rollId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.chips = g.seats.map(x => (x ? g.settings.chips : 0));
  g.pot = 0;
  g.turnIdx = Math.floor(Math.random() * g.order.length);
  g.turn = g.order[g.turnIdx];
  g.last = null;            // { seat, dice, moves: [{face, to}], id }
  g.phase = 'roll';
  g.winner = null;
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const leftOf = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];
export const rightOf = (g, s) => g.order[(g.order.indexOf(s) - 1 + g.order.length) % g.order.length];
const holders = g => g.order.filter(s => g.chips[s] > 0);
export const current = g => (g.phase === 'roll' ? g.turn : -1);

function advance(g) {
  for (let k = 1; k <= g.order.length; k++) {
    const i = (g.turnIdx + k) % g.order.length;
    if (g.chips[g.order[i]] > 0) { g.turnIdx = i; g.turn = g.order[i]; return; }
  }
}

export function applyAction(g, seat, a, rand = Math.random) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (a.type !== 'roll') return "That move isn't allowed";
  if (seat !== g.turn) return "It isn't your turn";
  const n = Math.min(3, g.chips[seat]);
  const dice = Array.from({ length: n }, () => FACES[Math.floor(rand() * 6)]);
  const moves = [];
  for (const f of dice) {
    if (f === 'K') { moves.push({ face: f, to: seat }); continue; }
    g.chips[seat]--;
    if (f === 'P') { g.pot++; moves.push({ face: f, to: -1 }); }
    else { const to = f === 'L' ? leftOf(g, seat) : rightOf(g, seat); g.chips[to]++; moves.push({ face: f, to }); }
  }
  g.last = { seat, dice, moves, id: ++g.rollId };
  g.moveId++;
  const gone = moves.filter(m => m.face !== 'K').length;
  announce(g, seat, gone ? `${dice.map(f => ({ L: '◀', R: '▶', P: '●', K: '·' })[f]).join(' ')}` : 'Kept them all!');
  const h = holders(g);
  if (h.length <= 1) {
    g.phase = 'over';
    g.winner = h[0] ?? seat;
    g.chips[g.winner] += g.pot;
    g.won = g.pot;
    g.pot = 0;
    announce(g, g.winner, 'Takes the pot! 🏆');
    return null;
  }
  advance(g);
  return null;
}

export const botAction = () => ({ type: 'roll' });

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, order: g.order, chips: g.chips, pot: g.pot, last: g.last,
    winner: g.winner, won: g.won || 0, moveId: g.moveId, left: leftOf(g, seat), right: rightOf(g, seat),
  };
}
