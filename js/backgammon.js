// Backgammon rules engine + computer player. Runs only on the table (host).
//
// Points are numbered 1–24 from White's side: White moves 24 → 1 and bears off past 1;
// Black moves 1 → 24 and bears off past 24. b[p] > 0 is White checkers, < 0 is Black.
// Seat 0 plays White (bottom of the table screen), seat 1 plays Black (top).

export const seatColor = seat => (seat === 0 ? 'w' : 'b');
const sign = c => (c === 'w' ? 1 : -1);
const other = c => (c === 'w' ? 'b' : 'w');
const NAME = { w: 'White', b: 'Black' };

export function startPosition() {
  const b = new Array(26).fill(0);
  b[24] = 2; b[13] = 5; b[8] = 3; b[6] = 5;
  b[1] = -2; b[12] = -5; b[17] = -3; b[19] = -5;
  return { b, bar: { w: 0, b: 0 }, off: { w: 0, b: 0 } };
}

const copy = p => ({ b: p.b.slice(), bar: { ...p.bar }, off: { ...p.off } });
const key = p => p.b.join(',') + '|' + p.bar.w + ',' + p.bar.b + '|' + p.off.w + ',' + p.off.b;
const ownAt = (p, pt, c) => Math.max(0, sign(c) * p.b[pt]);
const blocked = (p, pt, c) => -sign(c) * p.b[pt] >= 2;

function allHome(p, c) {
  if (p.bar[c]) return false;
  for (let pt = 1; pt <= 24; pt++) {
    const home = c === 'w' ? pt <= 6 : pt >= 19;
    if (!home && ownAt(p, pt, c)) return false;
  }
  return true;
}

export function pips(p, c) {
  let n = p.bar[c] * 25;
  for (let pt = 1; pt <= 24; pt++) n += ownAt(p, pt, c) * (c === 'w' ? pt : 25 - pt);
  return n;
}

// Every way to move one checker with one die.
export function singleMoves(p, c, d) {
  const out = [];
  if (p.bar[c]) {
    const to = c === 'w' ? 25 - d : d;
    if (!blocked(p, to, c)) out.push({ from: 'bar', to, die: d });
    return out;
  }
  const home = allHome(p, c);
  for (let pt = 1; pt <= 24; pt++) {
    if (!ownAt(p, pt, c)) continue;
    const to = c === 'w' ? pt - d : pt + d;
    if (to >= 1 && to <= 24) {
      if (!blocked(p, to, c)) out.push({ from: pt, to, die: d });
    } else if (home) {
      const exact = c === 'w' ? to === 0 : to === 25;
      // A higher roll may bear off only the checker farthest from home.
      let farthest = true;
      if (!exact) {
        if (c === 'w') { for (let q = pt + 1; q <= 6; q++) if (ownAt(p, q, c)) farthest = false; }
        else { for (let q = 19; q < pt; q++) if (ownAt(p, q, c)) farthest = false; }
      }
      if (exact || farthest) out.push({ from: pt, to: 'off', die: d });
    }
  }
  return out;
}

export function applyMove(p, c, m) {
  const n = copy(p);
  const s = sign(c);
  if (m.from === 'bar') n.bar[c]--;
  else n.b[m.from] -= s;
  if (m.to === 'off') n.off[c]++;
  else {
    if (n.b[m.to] === -s) { n.b[m.to] = 0; n.bar[other(c)]++; }
    n.b[m.to] += s;
  }
  return n;
}

const without = (dice, d) => { const i = dice.indexOf(d); return dice.slice(0, i).concat(dice.slice(i + 1)); };

// Most dice that can still be used from here (memoised per turn).
function maxUse(p, c, dice, memo) {
  if (!dice.length) return 0;
  const k = key(p) + '/' + dice.slice().sort().join('');
  if (memo.has(k)) return memo.get(k);
  let best = 0;
  for (const d of [...new Set(dice)]) {
    for (const m of singleMoves(p, c, d)) {
      best = Math.max(best, 1 + maxUse(applyMove(p, c, m), c, without(dice, d), memo));
      if (best === dice.length) break;
    }
    if (best === dice.length) break;
  }
  memo.set(k, best);
  return best;
}

// Single moves that keep the turn legal: you must use as many dice as possible, and if
// only one of two different dice can be used, it must be the larger one when that's possible.
export function legalNext(p, c, diceLeft, need, rolled, memo) {
  if (need <= 0) return [];
  const out = [];
  for (const d of [...new Set(diceLeft)]) {
    for (const m of singleMoves(p, c, d)) {
      if (1 + maxUse(applyMove(p, c, m), c, without(diceLeft, d), memo) === need) out.push(m);
    }
  }
  if (rolled.length === 2 && rolled[0] !== rolled[1] && need === 1 && diceLeft.length === 2) {
    const hi = Math.max(...rolled);
    if (out.some(m => m.die === hi)) return out.filter(m => m.die === hi);
  }
  return out;
}

const rollDie = () => 1 + Math.floor(Math.random() * 6);

// Per-turn lookup cache for the move rules. Kept outside the saved game (it can't be saved),
// and rebuilt automatically after the table reloads.
const memos = new WeakMap();
function memoOf(g, fresh) {
  if (fresh || !memos.has(g)) memos.set(g, new Map());
  return memos.get(g);
}

// ---------------------------------------------------------------- the match

export function createGame(settings) {
  const g = {
    settings: { match: 3, cube: true, ...settings },
    score: { w: 0, b: 0 },
    gameNo: 0,
    annId: 0,
    crawfordDone: false,
  };
  startGame(g);
  return g;
}

function announce(g, c, text) {
  g.announce = { id: ++g.annId, seat: c === 'w' ? 0 : 1, text };
}

export function startGame(g) {
  g.gameNo++;
  g.pos = startPosition();
  g.cube = 1;
  g.cubeOwner = null;
  g.result = null;
  g.lastMoves = [];
  const M = g.settings.match;
  // Crawford rule: the first game after someone reaches match point is played without the cube.
  g.crawford = false;
  if (M > 1 && !g.crawfordDone && (g.score.w === M - 1 || g.score.b === M - 1)) { g.crawford = true; g.crawfordDone = true; }
  // Opening roll: one die each, higher goes first and plays both.
  let dw, db;
  do { dw = rollDie(); db = rollDie(); } while (dw === db);
  g.opening = { w: dw, b: db };
  g.turn = dw > db ? 'w' : 'b';
  announce(g, g.turn, `Opens with ${Math.max(dw, db)}-${Math.min(dw, db)}`);
  beginMoves(g, [dw, db]);
}

function beginMoves(g, dice) {
  g.rolled = dice.slice();
  g.diceLeft = dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : dice.slice();
  memoOf(g, true);
  g.need = maxUse(g.pos, g.turn, g.diceLeft, memoOf(g));
  g.turnStart = { pos: copy(g.pos), diceLeft: g.diceLeft.slice(), need: g.need };
  g.turnMoves = [];
  if (!g.need) {
    g.phase = 'nomove';
    g.legal = [];
    announce(g, g.turn, `${dice[0]}-${dice[1]} · no moves`);
  } else {
    g.phase = 'move';
    g.legal = legalNext(g.pos, g.turn, g.diceLeft, g.need, g.rolled, memoOf(g));
  }
}

function endTurn(g) {
  g.lastMoves = g.turnMoves;
  g.turn = other(g.turn);
  g.phase = 'roll';
  g.rolled = null;
  g.diceLeft = [];
  g.legal = [];
}

const canDouble = g => g.settings.cube && !g.crawford && g.phase === 'roll' && g.cube < 64 &&
  (g.cubeOwner === null || g.cubeOwner === g.turn) && g.score[g.turn] + g.cube < g.settings.match;

function finish(g, winner, how) {
  const loser = other(winner);
  let mult = 1, kind = 'single';
  if (how !== 'drop' && g.pos.off[loser] === 0) {
    const inHome = g.pos.bar[loser] > 0 || [...Array(6)].some((_, i) => ownAt(g.pos, winner === 'w' ? i + 1 : 19 + i, loser));
    mult = inHome ? 3 : 2;
    kind = inHome ? 'backgammon' : 'gammon';
  }
  const pts = g.cube * mult;
  g.score[winner] += pts;
  g.result = { winner, pts, kind, how };
  g.phase = g.score[winner] >= g.settings.match ? 'matchOver' : 'gameOver';
  g.turn = winner;
  g.legal = [];
  announce(g, winner, how === 'drop' ? `Wins ${pts} (double dropped)` : `Wins ${pts}${kind !== 'single' ? ' · ' + kind : ''}`);
}

const same = (m, a) => String(m.from) === String(a.from) && String(m.to) === String(a.to);

export function applyAction(g, seat, a) {
  const me = seatColor(seat);
  if (!a) return 'Nothing to do';
  if (g.phase === 'gameOver' || g.phase === 'matchOver') return 'The game is over';

  if (a.type === 'take' || a.type === 'drop') {
    if (g.phase !== 'doubled' || g.decider !== me) return 'There is no double to answer';
    if (a.type === 'drop') { finish(g, other(me), 'drop'); return null; }
    g.cube *= 2;
    g.cubeOwner = me;
    g.phase = 'roll';
    g.turn = other(me);
    announce(g, me, `Takes · cube at ${g.cube}`);
    return null;
  }
  if (g.turn !== me) return `It's ${NAME[g.turn]}'s turn`;

  if (a.type === 'double') {
    if (!canDouble(g)) return "You can't double right now";
    g.phase = 'doubled';
    g.decider = other(me);
    announce(g, me, `Doubles to ${g.cube * 2}`);
    return null;
  }
  if (a.type === 'roll') {
    if (g.phase !== 'roll') return 'You already rolled';
    const d = [rollDie(), rollDie()];
    announce(g, me, d[0] === d[1] ? `Doubles! ${d[0]}-${d[1]}` : `${d[0]}-${d[1]}`);
    beginMoves(g, d);
    return null;
  }
  if (a.type === 'undo') {
    if (g.phase !== 'move' || !g.turnMoves.length) return 'Nothing to undo';
    g.pos = copy(g.turnStart.pos);
    g.diceLeft = g.turnStart.diceLeft.slice();
    g.need = g.turnStart.need;
    g.turnMoves = [];
    g.legal = legalNext(g.pos, g.turn, g.diceLeft, g.need, g.rolled, memoOf(g));
    return null;
  }
  if (a.type === 'pass') {
    if (g.phase !== 'nomove') return 'You have moves to make';
    endTurn(g);
    return null;
  }
  if (a.type === 'move') {
    if (g.phase !== 'move') return 'Roll first';
    const steps = a.moves || [{ from: a.from, to: a.to }];
    for (const s of steps) {
      const m = g.legal.find(x => same(x, s));
      if (!m) return 'That move is not allowed with these dice';
      g.pos = applyMove(g.pos, me, m);
      g.diceLeft = without(g.diceLeft, m.die);
      g.need--;
      g.turnMoves.push(m);
      if (g.pos.off[me] === 15) { finish(g, me, 'race'); return null; }
      g.legal = legalNext(g.pos, me, g.diceLeft, g.need, g.rolled, memoOf(g));
    }
    if (!g.need || !g.legal.length) endTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

export function advance(g) {
  if (g.phase === 'gameOver') startGame(g);
  else if (g.phase === 'nomove') endTurn(g);
}

// Where a checker on `from` can end up this turn: single dice and the same checker
// moving on with the next die (so "13 to 8" with a 3-2 is one tap).
export function targetsFrom(g, from) {
  const res = new Map();
  const walk = (pos, diceLeft, need, at, path) => {
    for (const m of legalNext(pos, g.turn, diceLeft, need, g.rolled, memoOf(g))) {
      if (String(m.from) !== String(at)) continue;
      const k = String(m.to);
      const p2 = [...path, { from: m.from, to: m.to }];
      if (!res.has(k) || res.get(k).length > p2.length) res.set(k, p2);
      if (m.to !== 'off' && need > 1) walk(applyMove(pos, g.turn, m), without(diceLeft, m.die), need - 1, m.to, p2);
    }
  };
  if (g.phase === 'move') walk(g.pos, g.diceLeft, g.need, from, []);
  return res;
}

export function viewFor(g, seat) {
  const me = seatColor(seat);
  return {
    color: me, phase: g.phase, turn: g.turn, pos: g.pos, rolled: g.rolled, diceLeft: g.diceLeft,
    legal: g.turn === me && g.phase === 'move' ? g.legal.map(m => ({ from: m.from, to: m.to })) : [],
    targets: g.turn === me && g.phase === 'move' ? Object.fromEntries([...new Set(g.legal.map(m => String(m.from)))].map(f => [f, Object.fromEntries(targetsFrom(g, f === 'bar' ? 'bar' : Number(f)))])) : {},
    canUndo: g.turn === me && g.phase === 'move' && g.turnMoves.length > 0,
    canDouble: g.turn === me && canDouble(g), decider: g.phase === 'doubled' ? g.decider : null,
    cube: g.cube, cubeOwner: g.cubeOwner, crawford: g.crawford, score: g.score, match: g.settings.match,
    pips: { w: pips(g.pos, 'w'), b: pips(g.pos, 'b') }, lastMoves: g.lastMoves, turnMoves: g.turnMoves,
    result: g.result, gameNo: g.gameNo, opening: g.opening,
  };
}

// ---------------------------------------------------------------- computer player

function evaluate(p, c) {
  const o = other(c);
  const myPips = pips(p, c), oppPips = pips(p, o);
  // Is there still contact? (Any of my checkers behind any of theirs.)
  let myBack = 0, oppBack = 25;
  for (let pt = 1; pt <= 24; pt++) {
    if (ownAt(p, pt, c)) myBack = Math.max(myBack, c === 'w' ? pt : 25 - pt);
    if (ownAt(p, pt, o)) oppBack = Math.min(oppBack, c === 'w' ? pt : 25 - pt);
  }
  const contact = p.bar.w || p.bar.b || myBack > oppBack;
  let score = (oppPips - myPips) + p.off[c] * 3 - p.off[o] * 3;
  if (!contact) return score * 2;
  score += p.bar[o] * 9 - p.bar[c] * 9;
  let run = 0, bestRun = 0;
  for (let i = 1; i <= 24; i++) {
    const pt = c === 'w' ? i : 25 - i;               // i = distance from my home end
    const n = ownAt(p, pt, c);
    if (n >= 2) {
      score += 3 + (i <= 6 ? 2.5 : 0) + (i === 5 || i === 7 ? 1.5 : 0);
      run++;
      bestRun = Math.max(bestRun, run);
    } else run = 0;
    if (n === 1) {
      // A lone checker: how many of their checkers sit within direct range behind it?
      let shooters = p.bar[o] && i > 18 ? 2 : 0;
      for (let k = 1; k <= 12; k++) {
        const q = pt + (c === 'w' ? k : -k);
        if (q >= 1 && q <= 24 && ownAt(p, q, o)) shooters += k <= 6 ? 2 : 1;
      }
      if (shooters) score -= 4 + shooters * 1.2 + (i <= 6 ? 2 : 0);
    }
  }
  score += bestRun >= 3 ? bestRun * bestRun * 1.2 : 0;
  return score;
}

function bestSequence(g) {
  const c = g.turn;
  let best = null, bestScore = -Infinity;
  const seen = new Set();
  const walk = (pos, diceLeft, need, path) => {
    const moves = legalNext(pos, c, diceLeft, need, g.rolled, memoOf(g));
    if (!need || !moves.length) {
      const k = key(pos);
      if (seen.has(k)) return;
      seen.add(k);
      const sc = pos.off[c] === 15 ? 1e6 : evaluate(pos, c) + Math.random() * 0.5;
      if (sc > bestScore) { bestScore = sc; best = path; }
      return;
    }
    for (const m of moves) walk(applyMove(pos, c, m), without(diceLeft, m.die), need - 1, [...path, { from: m.from, to: m.to }]);
  };
  walk(g.pos, g.diceLeft, g.need, []);
  return best || [];
}

export function botAction(g, seat) {
  const me = seatColor(seat);
  if (g.phase === 'doubled' && g.decider === me) {
    const lead = (pips(g.pos, other(me)) - pips(g.pos, me)) / Math.max(pips(g.pos, other(me)), 1);
    return { type: lead < -0.22 || evaluate(g.pos, me) < -40 ? 'drop' : 'take' };
  }
  if (g.phase === 'roll') {
    if (canDouble(g)) {
      const lead = (pips(g.pos, other(me)) - pips(g.pos, me)) / Math.max(pips(g.pos, me), 1);
      const ev = evaluate(g.pos, me);
      if (lead > 0.1 && lead < 0.3 && ev > 12) return { type: 'double' };
    }
    return { type: 'roll' };
  }
  if (g.phase === 'nomove') return { type: 'pass' };
  return { type: 'move', moves: bestSequence(g) };
}
