// Dominoes (the draw game, double-six set): match the number at either open end of the line.
// Two players take seven tiles each; three or four take five. The highest double starts. If you
// can't play, draw from the boneyard until you can (or pass once it's empty). Go out first and
// you score the pips left in everyone else's hands; if nobody can move, the lowest hand wins the
// difference. First to the target wins.

export const TILES = [];
for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) TILES.push([a, b]);
const shuffle = x => { for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const pips = t => TILES[t][0] + TILES[t][1];

export function createGame(settings, players) {
  const g = { settings: { target: 100, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, handNo: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.scores = g.seats.map(() => 0);
  deal(g);
  return g;
}

function deal(g) {
  g.handNo++;
  g.bone = shuffle(TILES.map((_, i) => i));
  const n = g.order.length === 2 ? 7 : 5;
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.bone.splice(0, n);
  g.line = [];                     // { t, side: 'L' | 'R', flip }
  g.ends = null;                   // [left, right]
  g.passes = 0;
  g.result = null;
  // Highest double starts (else the heaviest tile).
  let best = null;
  for (const s of g.order) for (const t of g.hands[s]) {
    const [a, b] = TILES[t], v = (a === b ? 100 : 0) + a + b;
    if (!best || v > best.v) best = { s, t, v };
  }
  g.turn = best.s;
  g.mustOpen = best.t;
  g.phase = 'play';
  g.moveId++;
}

export function fitsAt(g, t) {
  if (!g.ends) return g.mustOpen == null || t === g.mustOpen ? ['L'] : [];
  const [a, b] = TILES[t], out = [];
  if (a === g.ends[0] || b === g.ends[0]) out.push('L');
  if (a === g.ends[1] || b === g.ends[1]) out.push('R');
  return out;
}
export const playable = (g, s) => g.hands[s].filter(t => fitsAt(g, t).length);
export const current = g => (g.phase === 'play' ? g.turn : -1);
const next = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It isn't your turn";
  const h = g.hands[seat];
  if (a.type === 'draw') {
    if (playable(g, seat).length) return 'You have a tile you can play';
    if (!g.bone.length) return 'The boneyard is empty — pass';
    h.push(g.bone.pop());
    g.moveId++;
    return null;
  }
  if (a.type === 'pass') {
    if (playable(g, seat).length || g.bone.length) return 'You can still play or draw';
    g.passes++;
    announce(g, seat, 'Pass');
    g.moveId++;
    if (g.passes >= g.order.length) return blocked(g);
    g.turn = next(g, seat);
    return null;
  }
  if (a.type !== 'play') return "That move isn't allowed";
  const t = Number(a.t);
  if (!h.includes(t)) return 'That tile isn’t yours';
  const sides = fitsAt(g, t);
  if (!sides.length) return g.ends ? 'It doesn’t match either end' : 'The highest double opens';
  const side = sides.includes(a.side) ? a.side : sides[0];
  const [x, y] = TILES[t];
  // `pair` is the tile as it lies in the line, left number first.
  if (!g.ends) { g.ends = [x, y]; g.line.push({ t, pair: [x, y] }); g.mustOpen = null; }
  else if (side === 'L') { const pair = y === g.ends[0] ? [x, y] : [y, x]; g.ends[0] = pair[0]; g.line.unshift({ t, pair }); }
  else { const pair = x === g.ends[1] ? [x, y] : [y, x]; g.ends[1] = pair[1]; g.line.push({ t, pair }); }
  g.hands[seat] = h.filter(z => z !== t);
  g.passes = 0;
  g.last = t;
  g.moveId++;
  if (!g.hands[seat].length) return out(g, seat);
  g.turn = next(g, seat);
  return null;
}

const handPips = (g, s) => g.hands[s].reduce((a, t) => a + pips(t), 0);
function out(g, s) {
  const pts = g.order.filter(o => o !== s).reduce((a, o) => a + handPips(g, o), 0);
  g.scores[s] += pts;
  g.result = { winner: s, pts, how: 'domino' };
  announce(g, s, `Domino! +${pts}`);
  return endHand(g);
}
function blocked(g) {
  const low = Math.min(...g.order.map(o => handPips(g, o)));
  const w = g.order.filter(o => handPips(g, o) === low);
  const pts = w.length === 1 ? g.order.reduce((a, o) => a + handPips(g, o), 0) - low * 2 : 0;
  if (w.length === 1) g.scores[w[0]] += pts;
  g.result = { winner: w.length === 1 ? w[0] : null, pts, how: 'blocked' };
  return endHand(g);
}
function endHand(g) {
  const top = Math.max(...g.order.map(o => g.scores[o]));
  if (top >= g.settings.target || !g.settings.target) { g.phase = 'over'; g.winner = g.order.find(o => g.scores[o] === top); }
  else { g.phase = 'handEnd'; g.nextAt = Date.now() + 9000; }
  g.moveId++;
  return null;
}
export function advance(g) { if (g.phase === 'handEnd') deal(g); }
export function tick(g) { return g.phase === 'handEnd' ? { ms: Math.max(0, g.nextAt - Date.now()), run: () => advance(g) } : null; }

export function botAction(g, s) {
  const ok = playable(g, s);
  if (!ok.length) return g.bone.length ? { type: 'draw' } : { type: 'pass' };
  const t = ok.sort((a, b) => (TILES[b][0] === TILES[b][1]) - (TILES[a][0] === TILES[a][1]) || pips(b) - pips(a))[0];
  return { type: 'play', t, side: fitsAt(g, t)[0] };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, order: g.order, hand: g.hands[seat] || [], counts: g.hands.map(h => h.length), line: g.line, ends: g.ends,
    bone: g.bone.length, scores: g.scores, target: g.settings.target, result: g.result, handNo: g.handNo, winner: g.winner ?? null,
    playable: g.phase === 'play' && g.turn === seat ? playable(g, seat) : [], mustOpen: g.mustOpen, last: g.last ?? null,
  };
}
