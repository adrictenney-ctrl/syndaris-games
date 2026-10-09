// Pardon Me!: race your four pawns from Start, round the board and into Home — moving by cards
// instead of dice. 1 or 2 can bring a pawn out of Start (a 2 also draws again); 3, 5, 8 and 12
// move forward; 4 moves backward; 7 can be split between two pawns; 10 is forward 10 or back 1;
// 11 is forward 11 or swap places with a rival's pawn; Pardon Me! takes a pawn from Start and
// bumps any rival's pawn back to their Start. Land on a rival and they go back to Start. Land on
// the start of a rival's slide and you slide to its end, bumping everyone on it. Exact moves
// into Home. You must move if you can. Our own board and card design.

export const R = { track: 60, home: 6, safe: [] };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const DECK = () => shuffle([...Array(5).fill(1), ...[2, 3, 4, 5, 7, 8, 10, 11, 12, 'P'].flatMap(c => Array(4).fill(c))]);
export const SLIDES = [0, 1, 2, 3].flatMap(k => [{ owner: k, from: k * 15 + 1, len: 3 }, { owner: k, from: k * 15 + 9, len: 4 }]);
export const CARD_TEXT = { 1: 'Start a pawn, or move 1', 2: 'Start a pawn, or move 2 — then draw again', 3: 'Move 3', 4: 'Move 4 backward', 5: 'Move 5', 7: 'Move 7, or split it between two pawns', 8: 'Move 8', 10: 'Move 10, or 1 backward', 11: 'Move 11, or swap with a rival', 12: 'Move 12', P: 'Pardon Me! Start a pawn and bump a rival' };

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, R };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.pieces = g.seats.map(() => [-1, -1, -1, -1]);
  g.deck = DECK();
  g.turn = g.order[0];
  g.phase = 'draw';
  g.card = null;
  return g;
}
const Q = 15;
export const startOf = (g, s) => (s % 4) * Q;
export const abs = (g, s, p) => (p >= 0 && p < R.track ? (startOf(g, s) + p) % R.track : null);
const GOAL = R.track + R.home - 1;
const occupied = (g, A) => { for (const o of g.order) { const k = g.pieces[o].findIndex(q => abs(g, o, q) === A); if (k >= 0) return { s: o, k }; } return null; };

// Step a pawn forward (n > 0) or backward (n < 0). Returns the new position or null.
function stepTo(g, s, p, n) {
  if (p < 0) return null;
  if (n > 0) { const to = p + n; return to > GOAL ? null : to; }
  if (p >= R.track) { const to = p + n; return to; }       // backward out of the safety lane, back onto the track
  return (p + n + R.track) % R.track;
}
const ownBlocked = (g, s, i, to) => to !== GOAL && g.pieces[s].some((q, k) => k !== i && q === to);

// Every legal play for this card: { i, to } | { i, to, j, to2 } (split 7) | { i, swap: {s,k} } | { i, pardon: {s,k} }
export function options(g, s, card) {
  const P = g.pieces[s], out = [];
  const fwd = (i, n) => { const to = stepTo(g, s, P[i], n); if (to != null && !ownBlocked(g, s, i, to)) out.push({ i, to }); };
  for (let i = 0; i < 4; i++) {
    if (P[i] === GOAL) continue;
    if (P[i] === -1) {
      if ((card === 1 || card === 2) && !ownBlocked(g, s, i, 0)) out.push({ i, to: 0 });
      if (card === 'P') for (const o of g.order) if (o !== s) g.pieces[o].forEach((q, k) => { if (q >= 0 && q < R.track) out.push({ i, pardon: { s: o, k } }); });
      continue;
    }
    if (typeof card === 'number' && ![4, 7, 10, 11].includes(card)) fwd(i, card);
    if (card === 4) fwd(i, -4);
    if (card === 10) { fwd(i, 10); fwd(i, -1); }
    if (card === 11) { fwd(i, 11); if (P[i] < R.track) for (const o of g.order) if (o !== s) g.pieces[o].forEach((q, k) => { if (q >= 0 && q < R.track) out.push({ i, swap: { s: o, k } }); }); }
    if (card === 7) {
      fwd(i, 7);
      for (let a = 1; a < 7; a++) for (let j = 0; j < 4; j++) {
        if (j === i || P[j] < 0 || P[j] === GOAL) continue;
        const t1 = stepTo(g, s, P[i], a), t2 = stepTo(g, s, P[j], 7 - a);
        if (t1 == null || t2 == null || t1 === t2 || ownBlocked(g, s, i, t1) && t1 !== P[j] || ownBlocked(g, s, j, t2) && t2 !== P[i]) continue;
        if (i < j) out.push({ i, to: t1, j, to2: t2 });
      }
    }
  }
  return out;
}

export const current = g => (g.phase === 'draw' || g.phase === 'move' ? g.turn : -1);
const next = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];

function land(g, s, i, to) {
  g.pieces[s][i] = to;
  let A = abs(g, s, to);
  if (A == null) return;
  const hit = occupied(g, A);
  if (hit && !(hit.s === s && hit.k === i)) { g.pieces[hit.s][hit.k] = -1; announce(g, s, 'Pardon me! 💥'); }
  const sl = SLIDES.find(x => x.from === A && x.owner !== s % 4);
  if (sl) {
    for (let n = 1; n <= sl.len; n++) { const B = (A + n) % R.track; const h2 = occupied(g, B); if (h2) g.pieces[h2.s][h2.k] = -1; }
    g.pieces[s][i] = (to + sl.len) % R.track;
    announce(g, s, 'Whee — slide! 🛝');
  }
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== current(g)) return "It isn't your turn";
  if (a.type === 'draw') {
    if (g.phase !== 'draw') return 'Play your card first';
    if (!g.deck.length) g.deck = DECK();
    g.card = g.deck.pop();
    g.cardId = (g.cardId || 0) + 1;
    g.opts = options(g, seat, g.card);
    g.moveId++;
    if (!g.opts.length) { g.phase = 'nomove'; g.waitAt = Date.now(); announce(g, seat, 'No move'); return null; }
    g.phase = 'move';
    return null;
  }
  if (a.type !== 'play' || g.phase !== 'move') return 'Draw a card';
  const o = g.opts[Number(a.k)];
  if (!o) return 'Pick one of the moves';
  const P = g.pieces[seat];
  if (o.pardon) {
    // My pawn from Start takes the rival's square; theirs goes back to their Start.
    const theirA = abs(g, o.pardon.s, g.pieces[o.pardon.s][o.pardon.k]);
    g.pieces[o.pardon.s][o.pardon.k] = -1;
    land(g, seat, o.i, (theirA - startOf(g, seat) + R.track) % R.track);
    announce(g, seat, 'Pardon me! 🎩');
  } else if (o.swap) {
    const mineA = abs(g, seat, P[o.i]), theirA = abs(g, o.swap.s, g.pieces[o.swap.s][o.swap.k]);
    g.pieces[o.swap.s][o.swap.k] = (mineA - startOf(g, o.swap.s) + R.track) % R.track;
    land(g, seat, o.i, (theirA - startOf(g, seat) + R.track) % R.track);
    announce(g, seat, 'Swap! 🔄');
  } else {
    if (o.j != null) { land(g, seat, o.i, o.to); land(g, seat, o.j, o.to2); }
    else land(g, seat, o.i, o.to);
  }
  g.moveId++;
  if (g.order.some(s => g.pieces[s].every(q => q === GOAL))) { g.phase = 'over'; g.winner = seat; announce(g, seat, 'All home! 🏠'); return null; }
  if (g.card === 2) { g.phase = 'draw'; return null; }
  g.turn = next(g, seat);
  g.phase = 'draw';
  return null;
}
export const tick = g => (g.phase === 'nomove' ? { ms: Math.max(0, g.waitAt + 1600 - Date.now()), run: () => { g.phase = 'draw'; if (g.card !== 2) g.turn = next(g, g.turn); g.moveId++; } } : null);

export function botAction(g, s) {
  if (g.phase === 'draw') return { type: 'draw' };
  let best = 0, bv = -1e9;
  g.opts.forEach((o, k) => {
    let v = Math.random();
    const P = g.pieces[s];
    if (o.pardon) v += 30;
    else if (o.swap) { const theirs = g.pieces[o.swap.s][o.swap.k], mine = P[o.i]; v += 5 + (theirs > mine ? 10 : -5); }
    else {
      for (const [i, to] of [[o.i, o.to], [o.j, o.to2]]) {
        if (i == null) continue;
        const A = abs(g, s, to);
        if (A != null) { const h = occupied(g, A); if (h && h.s !== s) v += 20; }
        if (to === GOAL) v += 25; else if (to >= R.track) v += 12;
        v += (to - (P[i] < 0 ? -10 : P[i])) * 0.5;
        if (P[i] === -1) v += 10;
      }
    }
    if (v > bv) { bv = v; best = k; }
  });
  return { type: 'play', k: best };
}

export const viewFor = g => ({ phase: g.phase, turn: g.turn, order: g.order, pieces: g.pieces, card: g.card, cardId: g.cardId || 0, opts: g.phase === 'move' ? g.opts : [], R, winner: g.winner ?? null, moveId: g.moveId, die: null });
