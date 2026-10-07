// Low Tide: each player has twelve face-down cards in a 3-row × 4-column grid. Cards run from
// −2 to 12. On your turn: draw from the deck (swap it into your grid, or throw it away and turn
// one of your hidden cards face up) or take the top discard (and swap it in). Three matching
// face-up cards in a column wash away. When someone has turned up their whole grid, everyone
// else gets one last turn, then every card is shown and scored. If the player who ended the
// round doesn't have the lowest score, theirs is doubled. First to 100 ends the game —
// lowest total wins. (The same rules as Skyjo, under our own name and cards.)

export const ROWS = 3, COLS = 4;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function makeDeck() {
  const d = [];
  for (let k = 0; k < 5; k++) d.push(-2);
  for (let k = 0; k < 10; k++) d.push(-1);
  for (let k = 0; k < 15; k++) d.push(0);
  for (let v = 1; v <= 12; v++) for (let k = 0; k < 10; k++) d.push(v);
  return shuffle(d);
}
// Cell index = col * 3 + row, so a column is [c*3, c*3+1, c*3+2].
export const colOf = i => Math.floor(i / ROWS);

export function createGame(settings, players) {
  const g = {
    settings: { target: 100, ...settings },
    seats: players.map(p => !!p), totals: players.map(() => 0),
    round: 0, annId: 0, moveId: 0, history: [],
  };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  deal(g);
  return g;
}

function deal(g) {
  g.round++;
  g.deck = makeDeck();
  // Each cell: { v, up } or null once its column has washed away.
  g.grids = g.seats.map(x => (x ? Array.from({ length: ROWS * COLS }, () => ({ v: g.deck.pop(), up: false })) : null));
  g.discard = [g.deck.pop()];
  g.phase = 'setup';            // everyone turns up two cards
  g.flips = g.seats.map(() => 0);
  g.holding = null;             // { v, from } — the current player's drawn card
  g.mustFlip = false;           // threw away the drawn card: now turn a hidden card up
  g.turn = null;
  g.closer = null;              // who turned up their last card
  g.lastTurns = null;           // seats still owed a final turn
  g.result = null;
}

const nextSeat = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];
function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }
export const visibleSum = grid => grid.reduce((a, c) => a + (c && c.up ? c.v : 0), 0);
export const allUp = grid => grid.every(c => !c || c.up);

function refillDeck(g) {
  if (g.deck.length) return;
  const top = g.discard.pop();
  g.deck = shuffle(g.discard);
  g.discard = [top];
}

// Three matching face-up cards in a column wash away to the discard pile.
function washColumns(g, s) {
  const grid = g.grids[s];
  for (let c = 0; c < COLS; c++) {
    const cells = [0, 1, 2].map(r => grid[c * ROWS + r]);
    if (cells.every(x => x && x.up) && cells.every(x => x.v === cells[0].v)) {
      cells.forEach((x, r) => { g.discard.push(x.v); grid[c * ROWS + r] = null; });
      announce(g, s, `A column of ${cells[0].v}s washes away!`);
    }
  }
}

function endTurn(g, s) {
  washColumns(g, s);
  g.holding = null;
  g.mustFlip = false;
  g.moveId++;
  if (g.lastTurns) {
    g.lastTurns = g.lastTurns.filter(x => x !== s);
    if (!g.lastTurns.length) return scoreRound(g);
  } else if (allUp(g.grids[s])) {
    g.closer = s;
    g.lastTurns = g.order.filter(x => x !== s);
    announce(g, s, 'All turned up — last turns!');
    if (!g.lastTurns.length) return scoreRound(g);
  }
  g.turn = nextSeat(g, s);
}

function scoreRound(g) {
  // Turn everything up (columns can still wash away now).
  for (const s of g.order) { g.grids[s].forEach(c => { if (c) c.up = true; }); washColumns(g, s); }
  const pts = {};
  for (const s of g.order) pts[s] = visibleSum(g.grids[s]);
  let doubled = false;
  const c = g.closer;
  if (c != null && pts[c] > 0 && g.order.some(s => s !== c && pts[s] <= pts[c])) { pts[c] *= 2; doubled = true; }
  for (const s of g.order) g.totals[s] += pts[s];
  g.result = { pts, closer: c, doubled };
  g.history.push(pts);
  g.phase = g.order.some(s => g.totals[s] >= g.settings.target) ? 'over' : 'roundOver';
  if (g.phase === 'over') {
    const low = Math.min(...g.order.map(s => g.totals[s]));
    g.winners = g.order.filter(s => g.totals[s] === low);
  }
  g.nextAt = Date.now() + 7000;
}

export function advance(g) {
  if (g.phase === 'roundOver' && Date.now() >= g.nextAt) { deal(g); return true; }
  return false;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (!g.order.includes(seat)) return "You're not in this game";
  const grid = g.grids[seat];
  if (g.phase === 'setup') {
    if (a.type !== 'flip') return 'Turn up two cards first';
    if (g.flips[seat] >= 2) return 'Waiting for the others';
    const c = grid[a.i];
    if (!c || c.up) return 'Pick a face-down card';
    c.up = true;
    g.flips[seat]++;
    if (g.order.every(s => g.flips[s] >= 2)) {
      // Highest two cards starts (ties: first in seat order).
      g.turn = g.order.slice().sort((x, y) => visibleSum(g.grids[y]) - visibleSum(g.grids[x]))[0];
      g.phase = 'play';
      announce(g, g.turn, 'Goes first');
    }
    return null;
  }
  if (g.phase !== 'play') return 'Wait for the next round';
  if (seat !== g.turn) return "It isn't your turn";
  if (a.type === 'draw') {
    if (g.holding || g.mustFlip) return 'You already have a card';
    refillDeck(g);
    g.holding = { v: g.deck.pop(), from: 'deck' };
    return null;
  }
  if (a.type === 'take') {
    if (g.holding || g.mustFlip) return 'You already have a card';
    g.holding = { v: g.discard.pop(), from: 'discard' };
    return null;
  }
  if (a.type === 'swap') {
    if (!g.holding) return 'Draw or take a card first';
    const c = grid[a.i];
    if (!c) return 'That spot is empty';
    g.discard.push(c.v);
    grid[a.i] = { v: g.holding.v, up: true };
    endTurn(g, seat);
    return null;
  }
  if (a.type === 'toss') {
    if (!g.holding || g.holding.from !== 'deck') return 'Only a card from the deck can be thrown away';
    g.discard.push(g.holding.v);
    g.holding = null;
    g.mustFlip = true;
    // Nothing left to turn up? Then the turn just ends.
    if (grid.every(c => !c || c.up)) endTurn(g, seat);
    return null;
  }
  if (a.type === 'flip') {
    if (!g.mustFlip) return 'Draw or take a card first';
    const c = grid[a.i];
    if (!c || c.up) return 'Pick a face-down card';
    c.up = true;
    endTurn(g, seat);
    return null;
  }
  return "That move isn't allowed";
}

export function viewFor(g, seat) {
  const hide = grid => grid && grid.map(c => (c ? (c.up ? { v: c.v, up: true } : { up: false }) : null));
  return {
    phase: g.phase, turn: g.turn, order: g.order, round: g.round, target: g.settings.target,
    grids: g.grids.map(hide), mine: hide(g.grids[seat]), top: g.discard[g.discard.length - 1] ?? null, deck: g.deck.length,
    holding: g.turn === seat ? g.holding : g.holding ? { from: g.holding.from, v: g.holding.v } : null,
    mustFlip: g.turn === seat && g.mustFlip, flips: g.flips[seat] ?? 0, totals: g.totals,
    lastTurns: g.lastTurns, closer: g.closer, result: g.result, winners: g.winners || null, moveId: g.moveId,
  };
}

// ---------------------------------------------------------------- bots

const AVG = 5.07;   // average value of a hidden card

// Best spot for a card of value v: completing a column, else replacing the worst card.
function bestSpot(grid, v) {
  let best = null, gain = -Infinity;
  grid.forEach((c, i) => {
    if (!c) return;
    const col = colOf(i);
    const others = [0, 1, 2].map(r => col * ROWS + r).filter(j => j !== i).map(j => grid[j]);
    const match = others.filter(o => o && o.up && o.v === v).length;
    let g2 = (c.up ? c.v : AVG) - v;
    if (match === 2) g2 += 3 * v + 6;               // washes the column away
    else if (match === 1) g2 += 1.5;
    // Don't break up a promising pair.
    if (c.up && others.some(o => o && o.up && o.v === c.v) && c.v <= 4) g2 -= 3;
    if (g2 > gain) { gain = g2; best = i; }
  });
  return { i: best, gain };
}

export function botAction(g, seat) {
  const grid = g.grids[seat];
  if (g.phase === 'setup') {
    const hidden = grid.map((c, i) => (c && !c.up ? i : -1)).filter(i => i >= 0);
    return { type: 'flip', i: hidden[Math.floor(Math.random() * hidden.length)] };
  }
  if (g.mustFlip) {
    const hidden = grid.map((c, i) => (c && !c.up ? i : -1)).filter(i => i >= 0);
    return { type: 'flip', i: hidden[Math.floor(Math.random() * hidden.length)] };
  }
  const hiddenLeft = grid.filter(c => c && !c.up).length;
  // Careful near the end: don't close the round when behind.
  const closing = i => hiddenLeft === 1 && grid[i] && !grid[i].up;
  const wouldLose = v => {
    const mine = visibleSum(grid) + v;
    return g.order.some(s => s !== seat && visibleSum(g.grids[s]) + g.grids[s].filter(c => c && !c.up).length * 3 < mine);
  };
  if (g.holding) {
    const v = g.holding.v;
    const spot = bestSpot(grid, v);
    const ok = spot.i != null && spot.gain > (g.holding.from === 'deck' ? 0.5 : -99) && !(closing(spot.i) && wouldLose(v));
    if (ok || g.holding.from === 'discard') return { type: 'swap', i: spot.i };
    return { type: 'toss' };
  }
  const top = g.discard[g.discard.length - 1];
  if (top != null) {
    const spot = bestSpot(grid, top);
    if (spot.gain >= 3 || top <= 0) return { type: 'take' };
  }
  return { type: 'draw' };
}
