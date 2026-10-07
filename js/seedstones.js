// Seed Stones: the classic sowing game (mancala, Kalah rules). Each player has six pits and a
// store. Pick up all the stones in one of your pits and sow them one by one counter-clockwise
// into the following pits and your own store (never your opponent's). Last stone in your store:
// go again. Last stone in an empty pit of yours: capture it and the stones opposite. When one
// side runs out, the other player stores what's left. Most stones in store wins.
//
// Pits 0–5 and store 6 belong to seat 0; pits 7–12 and store 13 to seat 1. Pit i faces 12 − i.
import { createSeries, gameOver, nextGame, announce } from './duel.js?v=56';

export const STORE = [6, 13];
export const pitsOf = s => (s === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);

export function createGame(settings) {
  const g = createSeries({ seeds: 4, ...settings });
  fresh(g);
  g.p = 0;
  return g;
}
export function fresh(g) {
  g.pits = Array.from({ length: 14 }, (_, i) => (i === 6 || i === 13 ? 0 : g.settings.seeds));
  g.last = null;
  g.path = null;
}

// Sow from pit i for seat s on a copy of the pits; returns { pits, last, again, captured, path }.
export function sow(pits0, s, i) {
  const pits = pits0.slice();
  let n = pits[i];
  pits[i] = 0;
  let k = i;
  const path = [];
  while (n > 0) {
    k = (k + 1) % 14;
    if (k === STORE[1 - s]) continue;
    pits[k]++;
    path.push(k);
    n--;
  }
  let captured = 0;
  if (pitsOf(s).includes(k) && pits[k] === 1 && pits[12 - k] > 0) {
    captured = pits[12 - k] + 1;
    pits[STORE[s]] += captured;
    pits[k] = 0;
    pits[12 - k] = 0;
  }
  return { pits, last: k, again: k === STORE[s], captured, path };
}

const sideEmpty = (pits, s) => pitsOf(s).every(i => pits[i] === 0);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next game';
  if (a.type === 'resign') { announce(g, seat, 'Resigns'); gameOver(g, 1 - seat, 'resign'); return null; }
  if (a.type !== 'sow') return "That move isn't allowed";
  if (seat !== g.p) return "It isn't your turn";
  if (!pitsOf(seat).includes(a.i) || !g.pits[a.i]) return 'Pick one of your pits with stones in it';
  const r = sow(g.pits, seat, a.i);
  g.pits = r.pits;
  g.last = r.last;
  g.path = [a.i, ...r.path];
  g.moveId++;
  if (r.captured) announce(g, seat, `Captures ${r.captured}!`);
  else if (r.again) announce(g, seat, 'Into the store — again!');
  if (sideEmpty(g.pits, 0) || sideEmpty(g.pits, 1)) {
    for (const s of [0, 1]) for (const i of pitsOf(s)) { g.pits[STORE[s]] += g.pits[i]; g.pits[i] = 0; }
    const a0 = g.pits[6], a1 = g.pits[13];
    gameOver(g, a0 === a1 ? null : a0 > a1 ? 0 : 1, 'empty');
    return null;
  }
  if (!r.again) g.p = 1 - g.p;
  return null;
}

export const viewFor = g => ({ pits: g.pits, p: g.p, phase: g.phase, last: g.last, path: g.path, wins: g.wins, draws: g.draws, result: g.result, bestOf: g.settings.bestOf, gameNo: g.gameNo, champion: g.champion ?? null, moveId: g.moveId });
export { nextGame };

// ---------------------------------------------------------------- computer player

function value(pits, me) {
  return (pits[STORE[me]] - pits[STORE[1 - me]]) * 3 + pitsOf(me).reduce((a, i) => a + pits[i], 0) - pitsOf(1 - me).reduce((a, i) => a + pits[i], 0);
}
function search(pits, turn, me, depth, alpha, beta) {
  if (sideEmpty(pits, 0) || sideEmpty(pits, 1)) {
    const p = pits.slice();
    for (const s of [0, 1]) for (const i of pitsOf(s)) { p[STORE[s]] += p[i]; p[i] = 0; }
    return (p[STORE[me]] - p[STORE[1 - me]]) * 100;
  }
  if (depth === 0) return value(pits, me);
  const moves = pitsOf(turn).filter(i => pits[i]);
  let best = turn === me ? -Infinity : Infinity;
  for (const i of moves) {
    const r = sow(pits, turn, i);
    const s = search(r.pits, r.again ? turn : 1 - turn, me, depth - 1, alpha, beta);
    if (turn === me) { best = Math.max(best, s); alpha = Math.max(alpha, s); } else { best = Math.min(best, s); beta = Math.min(beta, s); }
    if (beta <= alpha) break;
  }
  return best;
}

export function botAction(g, seat) {
  const moves = pitsOf(seat).filter(i => g.pits[i]);
  if (g.settings.level === 'easy' && Math.random() < 0.4) return { type: 'sow', i: moves[Math.floor(Math.random() * moves.length)] };
  const depth = { easy: 2, normal: 6, hard: 9 }[g.settings.level] || 6;
  let best = moves[0], bestS = -Infinity;
  for (const i of moves) {
    const r = sow(g.pits, seat, i);
    const s = search(r.pits, r.again ? seat : 1 - seat, seat, depth - 1, -Infinity, Infinity) + Math.random() * 0.5;
    if (s > bestS) { bestS = s; best = i; }
  }
  return { type: 'sow', i: best };
}
