// Sonar: hide your fleet on a 10×10 grid, then take turns pinging the other player's waters.
// A ping is a hit or a miss; hit every square of a ship and it sinks. Sink the whole fleet to win.
// Ships are placed on each phone (shuffle, or pick a ship and tap where it goes). Played as a match.
import { createSeries, gameOver, nextGame, announce } from './duel.js?v=54';

export const N = 10;
export const FLEET = [
  { name: 'Flagship', len: 5 }, { name: 'Cruiser', len: 4 }, { name: 'Frigate', len: 3 },
  { name: 'Submarine', len: 3 }, { name: 'Patrol boat', len: 2 },
];
export const cellsOf = sh => Array.from({ length: sh.len }, (_, k) => (sh.down ? (sh.r + k) * N + sh.c : sh.r * N + sh.c + k));

export function fits(ships, k, sh) {
  if (sh.c < 0 || sh.r < 0) return false;
  if (sh.down ? sh.r + sh.len > N : sh.c + sh.len > N) return false;
  const taken = new Set(ships.flatMap((o, j) => (j === k || !o ? [] : cellsOf(o))));
  return cellsOf(sh).every(x => !taken.has(x));
}

export function randomFleet() {
  for (;;) {
    const ships = [];
    let ok = true;
    for (const f of FLEET) {
      let placed = false;
      for (let tries = 0; tries < 200 && !placed; tries++) {
        const sh = { len: f.len, down: Math.random() < 0.5, r: Math.floor(Math.random() * N), c: Math.floor(Math.random() * N) };
        if (fits(ships, -1, sh)) { ships.push(sh); placed = true; }
      }
      if (!placed) { ok = false; break; }
    }
    if (ok) return ships;
  }
}

export function fresh(g) {
  g.fleets = [randomFleet(), randomFleet()];
  g.shots = [{}, {}];            // shots[s][cell] = 'hit' | 'miss' — fired AT seat s
  g.ready = [false, false];
  g.step = 'place';
  g.last = null;
  g.sunk = [[], []];             // indexes of ships sunk, per owner
}

export function createGame(settings) {
  const g = createSeries({ bestOf: 1, again: false, ...settings });
  fresh(g);
  g.p = 0;
  return g;
}

const shipAt = (g, s, cell) => g.fleets[s].findIndex(sh => cellsOf(sh).includes(cell));

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next game';
  if (a.type === 'resign') { announce(g, seat, 'Resigns'); gameOver(g, 1 - seat, 'resign'); return null; }
  if (g.step === 'place') {
    if (g.ready[seat]) return a.type === 'unready' ? ((g.ready[seat] = false), null) : 'You are ready — waiting for the other player';
    if (a.type === 'shuffle') { g.fleets[seat] = randomFleet(); return null; }
    if (a.type === 'place') {
      const k = a.k, f = FLEET[k];
      if (!f) return 'No such ship';
      const sh = { len: f.len, down: !!a.down, r: a.r, c: a.c };
      if (!fits(g.fleets[seat], k, sh)) return "It doesn't fit there";
      g.fleets[seat][k] = sh;
      return null;
    }
    if (a.type === 'ready') {
      g.ready[seat] = true;
      if (g.ready[0] && g.ready[1]) { g.step = 'fire'; announce(g, g.p, 'Fires first'); }
      return null;
    }
    return 'Place your fleet first';
  }
  if (a.type !== 'ping') return "That move isn't allowed";
  if (seat !== g.p) return "It isn't your turn";
  const foe = 1 - seat, cell = a.cell;
  if (!(cell >= 0 && cell < N * N)) return 'Off the grid';
  if (g.shots[foe][cell]) return 'Already pinged there';
  const k = shipAt(g, foe, cell);
  g.shots[foe][cell] = k >= 0 ? 'hit' : 'miss';
  g.last = { by: seat, cell, hit: k >= 0, sunk: null };
  g.moveId++;
  if (k >= 0 && cellsOf(g.fleets[foe][k]).every(x => g.shots[foe][x])) {
    g.sunk[foe].push(k);
    g.last.sunk = k;
    announce(g, seat, `Sank the ${FLEET[k].name}!`);
    if (g.sunk[foe].length === FLEET.length) { gameOver(g, seat, 'fleet'); return null; }
  } else announce(g, seat, k >= 0 ? 'Hit!' : 'Miss');
  if (!(k >= 0 && g.settings.again)) g.p = foe;
  return null;
}

export function viewFor(g, seat) {
  const foe = 1 - seat;
  return {
    phase: g.phase, step: g.step, p: g.p, ready: g.ready, last: g.last, wins: g.wins, draws: g.draws, result: g.result,
    bestOf: g.settings.bestOf, gameNo: g.gameNo, champion: g.champion ?? null, again: g.settings.again,
    myFleet: g.fleets[seat], myShots: g.shots[seat], mySunk: g.sunk[seat],
    // The other side's fleet stays hidden — except ships already sunk (or everything once the game ends).
    foeShots: g.shots[foe], foeSunk: g.sunk[foe],
    foeShips: g.phase === 'play' ? g.sunk[foe].map(k => ({ k, ...g.fleets[foe][k] })) : g.fleets[foe].map((sh, k) => ({ k, ...sh })),
  };
}
export { nextGame };

// ---------------------------------------------------------------- computer player

export function botAction(g, seat) {
  if (g.step === 'place') return { type: 'ready' };
  const foe = 1 - seat, shots = g.shots[foe];
  const sunkCells = new Set(g.sunk[foe].flatMap(k => cellsOf(g.fleets[foe][k])));
  const open = c => c >= 0 && c < N * N && !shots[c];
  const hits = Object.keys(shots).map(Number).filter(c => shots[c] === 'hit' && !sunkCells.has(c));
  const level = g.settings.level;
  if (hits.length && level !== 'easy') {
    // Target mode: extend a line of hits, else try around a hit.
    for (const h of hits) {
      const r = Math.floor(h / N), c = h % N;
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const inLine = hits.filter(x => (dr ? x % N === c : Math.floor(x / N) === r));
        if (inLine.length < 2) continue;
        const sorted = inLine.map(x => (dr ? Math.floor(x / N) : x % N)).sort((a, b) => a - b);
        const lo = sorted[0] - 1, hi = sorted[sorted.length - 1] + 1;
        const cand = [dr ? lo * N + c : r * N + lo, dr ? hi * N + c : r * N + hi].filter(x => (dr ? x >= 0 && x < N * N : Math.floor(x / N) === r && x >= 0)).filter(open);
        if (cand.length) return { type: 'ping', cell: cand[Math.floor(Math.random() * cand.length)] };
      }
    }
    const around = [];
    for (const h of hits) {
      const r = Math.floor(h / N), c = h % N;
      if (r > 0) around.push(h - N); if (r < N - 1) around.push(h + N); if (c > 0) around.push(h - 1); if (c < N - 1) around.push(h + 1);
    }
    const cand = around.filter(open);
    if (cand.length) return { type: 'ping', cell: cand[Math.floor(Math.random() * cand.length)] };
  }
  // Hunt mode: a checkerboard sweep (every ship covers at least one), weighted to open water.
  let cells = [...Array(N * N).keys()].filter(open);
  if (level !== 'easy') { const par = cells.filter(x => (Math.floor(x / N) + (x % N)) % 2 === 0); if (par.length) cells = par; }
  if (level === 'hard') {
    // Prefer squares where the most remaining ships could still fit.
    const left = FLEET.map((f, k) => k).filter(k => !g.sunk[foe].includes(k)).map(k => FLEET[k].len);
    const score = x => { let s = 0; const r = Math.floor(x / N), c = x % N; for (const L of left) for (const down of [0, 1]) for (let o = 0; o < L; o++) { const r0 = down ? r - o : r, c0 = down ? c : c - o; if (r0 < 0 || c0 < 0 || (down ? r0 + L > N : c0 + L > N)) continue; let ok = true; for (let q = 0; q < L; q++) { const y = down ? (r0 + q) * N + c0 : r0 * N + c0 + q; if (shots[y] === 'miss' || sunkCells.has(y)) { ok = false; break; } } if (ok) s++; } return s; };
    const best = Math.max(...cells.map(score));
    cells = cells.filter(x => score(x) === best);
  }
  return { type: 'ping', cell: cells[Math.floor(Math.random() * cells.length)] };
}
