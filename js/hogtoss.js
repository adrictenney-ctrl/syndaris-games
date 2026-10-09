// Hog Toss: toss two little pigs and score by how they land. Keep tossing to build up your turn
// total, then bank it — but if the pigs land on opposite sides (one with its spot up, one
// without) you lose the turn's points, and a Pig Pile (the pigs land touching) wipes out your
// whole score. First to the target wins.
//   Both on the same side: 1 · on its back: 5 · on its feet: 5 · on its nose: 10 · leaning on
//   an ear: 15. One pig on its side scores the other's position; two pigs in the same position
//   score double the pair (back/feet 20, nose 40, ear 60); two different positions add up.

export const POS = [
  { k: 'side', name: 'Side', p: 0.349 }, { k: 'dot', name: 'Spot side', p: 0.302 }, { k: 'back', name: 'Back', p: 0.224, v: 5 },
  { k: 'feet', name: 'Feet', p: 0.088, v: 5 }, { k: 'nose', name: 'Nose', p: 0.03, v: 10 }, { k: 'ear', name: 'Ear lean', p: 0.0061, v: 15 },
];
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
function toss() {
  let r = Math.random() * POS.reduce((t, p) => t + p.p, 0);
  for (const p of POS) { if ((r -= p.p) < 0) return p.k; }
  return 'side';
}
// Score a toss: { pts, kind: 'ok' | 'oddsides' | 'pile', name }.
export function scoreToss(a, b, pile = false) {
  if (pile) return { pts: 0, kind: 'pile', name: 'Pig Pile!' };
  const side = x => x === 'side' || x === 'dot';
  const P = k => POS.find(p => p.k === k);
  if (side(a) && side(b)) return a === b ? { pts: 1, kind: 'ok', name: 'Same side' } : { pts: 0, kind: 'oddsides', name: 'Odd sides!' };
  if (side(a)) return { pts: P(b).v, kind: 'ok', name: P(b).name };
  if (side(b)) return { pts: P(a).v, kind: 'ok', name: P(a).name };
  if (a === b) return { pts: P(a).v * 4, kind: 'ok', name: `Double ${P(a).name.toLowerCase()}` };
  return { pts: P(a).v + P(b).v, kind: 'ok', name: `${P(a).name} + ${P(b).name.toLowerCase()}` };
}

export function createGame(settings, players) {
  const g = { settings: { target: 100, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.scores = g.seats.map(() => 0);
  g.turn = g.order[0];
  g.turnPts = 0;
  g.pigs = ['side', 'dot'];
  g.phase = 'play';
  g.lastToss = null;
  return g;
}

export const current = g => (g.phase === 'play' ? g.turn : -1);
export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It isn't your turn";
  if (a.type === 'bank') {
    if (!g.turnPts) return 'Toss first';
    g.scores[seat] += g.turnPts;
    announce(g, seat, `Banks ${g.turnPts}`);
    if (g.scores[seat] >= g.settings.target) { g.phase = 'over'; g.winner = seat; g.moveId++; return null; }
    return next(g, seat);
  }
  if (a.type !== 'toss') return "That move isn't allowed";
  const pile = Math.random() < 1 / 250;
  g.pigs = [toss(), toss()];
  const r = scoreToss(g.pigs[0], g.pigs[1], pile);
  g.lastToss = { ...r, pigs: g.pigs, pile, id: (g.lastToss?.id || 0) + 1 };
  g.moveId++;
  if (r.kind === 'ok') { g.turnPts += r.pts; announce(g, seat, `${r.name} +${r.pts}`); return null; }
  if (r.kind === 'pile') g.scores[seat] = 0;
  announce(g, seat, r.kind === 'pile' ? 'Pig Pile! Back to zero 😱' : 'Odd sides! 💨');
  g.phase = 'oops';
  g.oopsAt = Date.now();
  return null;
}
function next(g, seat) {
  g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
  g.turnPts = 0;
  g.phase = 'play';
  g.moveId++;
  return null;
}
export const tick = g => (g.phase === 'oops' ? { ms: Math.max(0, g.oopsAt + 2200 - Date.now()), run: () => next(g, g.turn) } : null);

export function botAction(g, s) {
  const need = g.settings.target - g.scores[s];
  if (g.turnPts >= need) return { type: 'bank' };
  const lead = Math.max(...g.order.filter(x => x !== s).map(x => g.scores[x]));
  const goal = lead >= g.settings.target - 20 ? need : 20 + Math.random() * 6;
  return g.turnPts >= goal ? { type: 'bank' } : { type: 'toss' };
}

export const viewFor = g => ({ phase: g.phase, turn: g.turn, order: g.order, scores: g.scores, turnPts: g.turnPts, pigs: g.pigs, lastToss: g.lastToss, target: g.settings.target, winner: g.winner ?? null, moveId: g.moveId });
