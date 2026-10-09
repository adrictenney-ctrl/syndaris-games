// The race-home family: get all four of your pieces from your yard, once round the track and up
// your home lane. One engine, three rule sets:
//   Ludo (the classic cross-and-circle game): a 6 brings a piece out and rolls again; land on
//     a rival to send them home, except on the starred safe squares; exact roll to finish.
//   Pop-Up Race: a shorter track, a 6 to come out, a 6 rolls again; no safe squares.
//   Marble Rush: a 1 or a 6 comes out; land exactly on a corner shortcut and you may hop
//     straight to the next one; land in the centre hub and leave it later with a 1.
// Two to four players; each seat owns the start square on its side of the board.

export const RULES = {
  ludo: { track: 52, home: 6, exit: [6], extra: true, safe: [0, 8, 13, 21, 26, 34, 39, 47], three6: true },
  trouble: { track: 28, home: 4, exit: [6], extra: true, safe: [] },
  marble: { track: 56, home: 4, exit: [1, 6], extra: true, safe: [], corners: [7, 21, 35, 49], hub: true },
};
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players, variant = 'ludo') {
  const R = RULES[variant];
  const g = { variant, settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  // A piece: -1 in the yard; 0..track-1 steps travelled from its start; track.. track+home-1 in
  // the home lane (the last is home); 'hub' in Marble Rush's centre.
  g.pieces = g.seats.map(() => [-1, -1, -1, -1]);
  g.R = R;
  g.turn = g.order[0];
  g.phase = 'roll';
  g.die = null;
  g.sixes = 0;
  return g;
}
const Q = g => g.R.track / 4;
export const startOf = (g, s) => (s % 4) * Q(g);
// Absolute track square of a piece (or null if not on the shared track).
export const abs = (g, s, p) => (p >= 0 && p < g.R.track ? (startOf(g, s) + p) % g.R.track : null);
const goal = g => g.R.track + g.R.home - 1;

// Where would piece i go with this roll? null if it can't move.
export function dest(g, s, i, d) {
  const p = g.pieces[s][i];
  if (p === -1) return g.R.exit.includes(d) ? 0 : null;
  if (p === 'hub') return d === 1 ? { fromHub: true, to: hubExit(g, s) } : null;
  if (p === goal(g)) return null;
  let to = p + d;
  // On the track, steps past the last square go up the home lane (track-1 is the last square).
  if (to > goal(g)) return null;
  // Can't land on your own piece (except finished pieces stack at home).
  if (to !== goal(g) && g.pieces[s].some((q, k) => k !== i && q === to)) return null;
  return to;
}
// Marble Rush: leaving the hub drops you on the corner nearest to your home lane.
function hubExit(g, s) {
  const c = g.R.corners.map(a => (a - startOf(g, s) + g.R.track) % g.R.track);
  return Math.max(...c);
}
export function moves(g, s, d) {
  const out = [];
  for (let i = 0; i < 4; i++) { const t = dest(g, s, i, d); if (t != null) out.push(i); }
  return out;
}

export const current = g => (g.phase === 'roll' || g.phase === 'move' ? g.turn : -1);
const next = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== current(g)) return "It isn't your turn";
  if (a.type === 'roll') {
    if (g.phase !== 'roll') return 'Move a piece first';
    g.die = 1 + Math.floor(Math.random() * 6);
    g.rollId = (g.rollId || 0) + 1;
    g.moveId++;
    if (g.die === 6) g.sixes++; else g.sixes = 0;
    if (g.R.three6 && g.sixes === 3) { announce(g, seat, 'Three sixes — turn over'); g.sixes = 0; return pass(g, seat); }
    if (!moves(g, seat, g.die).length) { announce(g, seat, `Rolled ${g.die} — no move`); g.phase = 'nomove'; g.waitAt = Date.now(); return null; }
    g.phase = 'move';
    return null;
  }
  if (a.type !== 'move' || g.phase !== 'move') return 'Roll first';
  const i = Number(a.i);
  let to = dest(g, seat, i, g.die);
  if (to == null) return 'That piece can’t move';
  const P = g.pieces[seat];
  if (to.fromHub) to = to.to;
  // Marble Rush shortcuts: land exactly on a corner → hop to the next corner, or into the hub.
  let hop = null;
  if (g.R.corners && to < g.R.track) {
    const A = (startOf(g, seat) + to) % g.R.track;
    if (g.R.corners.includes(A) && a.shortcut) {
      if (a.shortcut === 'hub') { hop = 'hub'; }
      else { const k = g.R.corners.indexOf(A); const nxt = g.R.corners[(k + 1) % 4]; const ahead = (nxt - startOf(g, seat) + g.R.track) % g.R.track; if (ahead > to) { to = ahead; hop = 'corner'; } }
    }
  }
  if (hop === 'hub') { P[i] = 'hub'; announce(g, seat, 'Into the hub!'); }
  else {
    P[i] = to;
    // Capture anyone on that square of the shared track.
    const A = abs(g, seat, to);
    if (A != null && !g.R.safe.includes(A)) for (const o of g.order) if (o !== seat) g.pieces[o].forEach((q, k) => { if (abs(g, o, q) === A) { g.pieces[o][k] = -1; announce(g, seat, `Sent ${'home'}! 💥`); g.captured = { by: seat, of: o }; } });
    if (hop === 'corner') announce(g, seat, 'Shortcut! ⚡');
  }
  g.moveId++;
  g.last = { seat, i };
  if (P.every(q => q === goal(g))) { g.phase = 'over'; g.winner = seat; announce(g, seat, 'All home! 🏠'); return null; }
  if (g.die === 6 && g.R.extra) { g.phase = 'roll'; announce(g, seat, 'Six — roll again'); return null; }
  return pass(g, seat);
}
function pass(g, seat) { g.turn = next(g, seat); g.phase = 'roll'; g.sixes = 0; g.moveId++; return null; }
export const tick = g => (g.phase === 'nomove' ? { ms: Math.max(0, g.waitAt + 1400 - Date.now()), run: () => { if (g.die === 6 && g.R.extra) { g.phase = 'roll'; g.moveId++; } else pass(g, g.turn); } } : null);

// Computer: capture if possible, else bring a piece out, else move the piece furthest along
// that isn't safe; avoid squares a rival could hit.
export function botAction(g, s) {
  if (g.phase === 'roll') return { type: 'roll' };
  const ms = moves(g, s, g.die);
  let best = null, bv = -1e9;
  for (const i of ms) {
    let to = dest(g, s, i, g.die);
    let v = 0, shortcut;
    if (to?.fromHub) { to = to.to; v += 6; }
    const A = abs(g, s, to);
    if (A != null && g.order.some(o => o !== s && g.pieces[o].some(q => abs(g, o, q) === A)) && !g.R.safe.includes(A)) v += 20;
    if (g.pieces[s][i] === -1) v += 12;
    if (to === goal(g)) v += 15;
    if (to >= g.R.track) v += 8;
    if (A != null && g.R.safe.includes(A)) v += 4;
    if (g.R.corners && A != null && g.R.corners.includes(A)) { shortcut = 'corner'; v += 5; }
    v += (typeof to === 'number' ? to : 0) * 0.1 + Math.random();
    if (v > bv) { bv = v; best = { type: 'move', i, shortcut }; }
  }
  return best;
}

export const viewFor = g => ({ variant: g.variant, phase: g.phase, turn: g.turn, order: g.order, pieces: g.pieces, die: g.die, rollId: g.rollId || 0, R: g.R, last: g.last || null, winner: g.winner ?? null, moveId: g.moveId });
