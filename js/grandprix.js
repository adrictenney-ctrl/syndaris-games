// Grand Prix Dice: race round the Monte Vale circuit with a gearbox of dice. Runs only on the
// table (host).
//
// Your turn: pick a gear (up one at a time, or down — dropping two or more costs wear), roll that
// gear's die, then move exactly that far (you may brake to move up to a few spaces less, using
// brake points). Each corner shows how many times you must STOP inside it (end a turn there)
// before you leave. Leave one stop short and you burn tyres for every space you overshoot; two
// short — or more overshoot than your tyres can take — and you crash out. A space holds three
// cars; if yours is full you stop behind. First across the line after the last lap ends the
// race once everyone has had that round's turn.

import { makeCircuit, findCorners } from './circuit.js?v=61';

export const CTRL = [[34, 104], [100, 106], [150, 104], [178, 96], [188, 78], [176, 62], [150, 64], [130, 54], [134, 36], [160, 28], [182, 18], [150, 8], [96, 10], [52, 12], [24, 24], [18, 46], [36, 60], [20, 84]];
export const L = 96;
export const CIRCUIT = makeCircuit(CTRL, L);
// Stops each corner needs, from how far and how sharply it turns.
export const CORNERS = findCorners(CIRCUIT).map((z, id) => {
  const sharp = z.angle / z.len;
  return { ...z, id, stops: sharp >= 40 ? 3 : z.angle >= 150 || sharp >= 25 ? 2 : 1 };
});
export const GEARS = { 1: [1, 2], 2: [2, 4], 3: [4, 8], 4: [7, 12], 5: [11, 20], 6: [21, 30] };
export const WEAR = { tires: 6, brakes: 4, gearbox: 3, engine: 3 };
const MAX_BRAKE = 6;

const zoneIndex = new Array(L).fill(-1);
CORNERS.forEach(z => { for (let k = 0; k < z.len; k++) zoneIndex[(z.from + k) % L] = z.id; });
const mod = p => ((p % L) + L) % L;
// Which corner (and which pass of it) a position is in.
export function zoneAt(p) {
  const id = zoneIndex[mod(p)];
  if (id < 0) return null;
  const z = CORNERS[id], off = mod(p - z.from);
  return `${id}@${Math.round((p - off - z.from) / L)}`;
}

export function createGame(settings, players) {
  const g = { settings: { laps: 2, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const grid = g.order.slice().sort(() => Math.random() - 0.5);
  g.cars = g.seats.map(() => null);
  grid.forEach((s, k) => { g.cars[s] = { pos: -Math.floor(k / 2), arrive: k, gear: 0, wear: { ...WEAR }, corner: null, out: false, done: false, laps: 0 }; });
  g.goal = g.settings.laps * L;
  g.round = 0;
  g.finishers = [];
  g.crashed = [];
  g.phase = 'gear';
  newRound(g);
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const log = (g, seat, text) => { g.log.push({ seat, text }); if (g.log.length > 30) g.log.shift(); };
const racing = g => g.order.filter(s => !g.cars[s].out && !g.cars[s].done);

function newRound(g) {
  g.round++;
  // Leader first; on the same space, whoever got there first.
  g.queue = racing(g).sort((a, b) => g.cars[b].pos - g.cars[a].pos || g.cars[a].arrive - g.cars[b].arrive);
  g.turn = g.queue[0];
  g.phase = 'gear';
  g.roll = null;
}

export const current = g => (g.phase === 'over' ? -1 : g.turn);

// Gears you can pick from here, with what each costs.
export function gearOptions(car) {
  const out = [];
  for (let n = 1; n <= 6; n++) {
    const drop = car.gear - n;
    if (n > Math.max(1, car.gear + 1)) continue;
    if (drop > 4) continue;
    const cost = { gearbox: drop >= 2 ? 1 : 0, brakes: drop >= 3 ? 1 : 0, engine: drop >= 4 ? 1 : 0 };
    const ok = Object.entries(cost).every(([k, v]) => car.wear[k] - v >= 0);
    out.push({ gear: n, cost, ok });
  }
  return out;
}

const occupancy = (g, pos, except) => g.order.filter(s => s !== except && !g.cars[s].out && !g.cars[s].done && g.cars[s].pos === pos).length;

// Where a move of `dist` spaces would end up, and what it would cost.
export function simulate(g, seat, dist) {
  const car = g.cars[seat];
  let d = dist;
  // A full space: stop behind it.
  while (d > 0 && occupancy(g, car.pos + d, seat) >= 3 && car.pos + d < g.goal) d--;
  let st = car.corner ? { ...car.corner } : null, tires = 0, crash = null;
  for (let k = 1; k <= d; k++) {
    const p = car.pos + k, z = zoneAt(p), pz = zoneAt(p - 1);
    if (pz && pz !== z) {
      const need = CORNERS[Number(pz.split('@')[0])].stops;
      const have = st && st.key === pz ? st.stops : 0;
      if (need - have >= 2) { crash = 'missed the corner'; break; }
      if (need - have === 1) {
        tires = d - k + 1;
        if (tires > car.wear.tires) { crash = 'ran out of tyres'; break; }
      }
      st = null;
    }
    if (z && z !== pz) st = { key: z, stops: 0 };
  }
  const end = car.pos + d;
  const z = zoneAt(end);
  if (z && st && st.key === z) st = { key: z, stops: st.stops + 1 };
  return { dist: d, end, tires, crash, corner: z ? st : null, blocked: d < dist };
}

// Brake choices once the die is rolled: 0 .. as many as the brakes allow.
export function brakeOptions(g, seat) {
  const car = g.cars[seat];
  const max = Math.min(MAX_BRAKE, car.wear.brakes, g.roll - 1);
  return Array.from({ length: Math.max(0, max) + 1 }, (_, b) => ({ brake: b, ...simulate(g, seat, g.roll - b) }));
}

function nextTurn(g) {
  g.moveId++;
  g.queue.shift();
  while (g.queue.length && (g.cars[g.queue[0]].out || g.cars[g.queue[0]].done)) g.queue.shift();
  if (g.queue.length) { g.turn = g.queue[0]; g.phase = 'gear'; g.roll = null; return; }
  if (g.finishers.length || !racing(g).length) return finish(g);
  newRound(g);
}

function finish(g) {
  g.phase = 'over';
  // Finishers in order, then everyone still running by distance, then the crashes (last out last).
  const running = racing(g).sort((a, b) => g.cars[b].pos - g.cars[a].pos);
  g.ranking = [...g.finishers, ...running, ...g.crashed.slice().reverse()];
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The race is over';
  if (seat !== g.turn) return "It isn't your turn";
  const car = g.cars[seat];
  if (g.phase === 'gear') {
    if (a.type !== 'gear') return 'Choose a gear';
    const opt = gearOptions(car).find(o => o.gear === a.gear);
    if (!opt) return car.gear && a.gear > car.gear + 1 ? 'You can only shift up one gear at a time' : 'You can only drop four gears at once';
    if (!opt.ok) return "Your car can't take that downshift";
    for (const [k, v] of Object.entries(opt.cost)) car.wear[k] -= v;
    car.gear = a.gear;
    const [lo, hi] = GEARS[a.gear];
    g.roll = lo + Math.floor(Math.random() * (hi - lo + 1));
    if (a.gear >= 5 && g.roll === hi) {
      car.wear.engine--;
      announce(g, seat, `${g.roll}! The engine groans`);
      if (car.wear.engine < 0) { crashOut(g, seat, 'blew the engine'); return null; }
    } else announce(g, seat, `Gear ${a.gear} · rolls ${g.roll}`);
    g.phase = 'move';
    g.rollId = (g.rollId || 0) + 1;
    g.moveId++;
    return null;
  }
  if (a.type !== 'move') return 'Move your car';
  const opt = brakeOptions(g, seat).find(o => o.brake === (a.brake || 0));
  if (!opt) return "You can't brake that hard";
  car.wear.brakes -= opt.brake;
  if (opt.crash) {
    car.pos += opt.dist;
    crashOut(g, seat, opt.crash);
    return null;
  }
  car.wear.tires -= opt.tires;
  car.pos = opt.end;
  car.corner = opt.corner;
  car.arrive = g.moveId;
  if (opt.tires) announce(g, seat, `Overshoots! −${opt.tires} tyres`);
  if (car.pos >= g.goal) {
    car.done = true;
    g.finishers.push(seat);
    announce(g, seat, g.finishers.length === 1 ? '🏁 Chequered flag!' : `🏁 Finishes P${g.finishers.length}`);
    log(g, seat, `crossed the line${g.finishers.length === 1 ? ' first' : ''}`);
  }
  g.last = { seat, from: opt.end - opt.dist, to: opt.end, id: g.moveId };
  nextTurn(g);
  return null;
}

function crashOut(g, seat, why) {
  const car = g.cars[seat];
  car.out = true;
  g.crashed.push(seat);
  announce(g, seat, `💥 Crash — ${why}`);
  log(g, seat, `crashed (${why})`);
  nextTurn(g);
}

export const lapOf = (g, s) => Math.min(g.settings.laps, Math.max(1, Math.floor(g.cars[s].pos / L) + 1));
export const standings = g => g.phase === 'over' ? g.ranking : [...g.finishers, ...racing(g).sort((a, b) => g.cars[b].pos - g.cars[a].pos), ...g.crashed.slice().reverse()];

export function viewFor(g, seat) {
  const me = g.cars[seat];
  return {
    phase: g.phase, turn: g.turn, order: g.order, laps: g.settings.laps, goal: g.goal, round: g.round,
    cars: g.cars, roll: g.roll, rollId: g.rollId, standings: standings(g),
    gears: g.turn === seat && g.phase === 'gear' && me ? gearOptions(me) : null,
    brakes: g.turn === seat && g.phase === 'move' && me ? brakeOptions(g, seat) : null,
    nextCorner: me ? nextCorner(me) : null, moveId: g.moveId, ranking: g.ranking || null,
    // What the computer would do, shown as a gentle suggestion.
    hint: g.turn === seat && me && g.phase === 'gear' ? (gearValues(g, seat, 1).sort((a, b) => b.v - a.v)[0] || {}).gear
      : g.turn === seat && me && g.phase === 'move' ? bestMove(g, seat, 1).o.brake : null,
  };
}

// The next corner ahead of a car: how far, and how many stops it still needs there.
export function nextCorner(car) {
  for (let k = 0; k < L; k++) {
    const z = zoneAt(car.pos + k);
    if (!z) continue;
    const c = CORNERS[Number(z.split('@')[0])];
    const have = car.corner && car.corner.key === z ? car.corner.stops : 0;
    if (k === 0 && have >= c.stops) { // already done this one: look past it
      let j = k; while (zoneAt(car.pos + j) === z) j++;
      const rest = nextCorner({ ...car, pos: car.pos + j, corner: null });
      return rest && { ...rest, dist: rest.dist + j };
    }
    return { id: c.id, dist: k, stops: c.stops, have, len: c.len };
  }
  return null;
}

// ---------------------------------------------------------------- bots

function outcomeScore(g, seat, o) {
  const car = g.cars[seat];
  if (o.crash) return -1000;
  let v = o.dist * 1.0 - o.tires * (2 + 8 / (car.wear.tires + 1)) - o.brake * (1.2 + 3 / (car.wear.brakes + 1));
  if (o.corner) {
    const need = CORNERS[Number(o.corner.key.split('@')[0])].stops;
    if (o.corner.stops <= need) v += 3;   // a stop that counts
  }
  // Ending just before a corner in a low gear is fine; ending inside a straight in top gear is better.
  return v;
}

const wearCost = (cost, gear) => cost.gearbox * 6 + cost.brakes * 4 + cost.engine * 8 + (gear >= 5 ? 0.6 : 0);

// Try a car state for a moment (position, gear, wear…), then put it back.
function withCar(g, seat, patch, fn) {
  const car = g.cars[seat], saved = { pos: car.pos, gear: car.gear, corner: car.corner, wear: car.wear }, roll = g.roll;
  Object.assign(car, patch);
  try { return fn(); } finally { Object.assign(car, saved); g.roll = roll; }
}

// Expected value of the best gear choice from the car's current state.
function gearValues(g, seat, depth) {
  const car = g.cars[seat], out = [];
  for (const opt of gearOptions(car)) {
    if (!opt.ok) continue;
    const [lo, hi] = GEARS[opt.gear];
    const wear = { ...car.wear };
    for (const [k, v] of Object.entries(opt.cost)) wear[k] -= v;
    let sum = 0;
    withCar(g, seat, { gear: opt.gear, wear }, () => {
      for (let r = lo; r <= hi; r++) { g.roll = r; sum += bestMove(g, seat, depth).v; }
    });
    out.push({ gear: opt.gear, v: sum / (hi - lo + 1) - wearCost(opt.cost, opt.gear) });
  }
  return out;
}

// Best brake choice for the rolled die; with depth, also how good the next turn looks from there.
function bestMove(g, seat, depth) {
  let best = null;
  for (const o of brakeOptions(g, seat)) {
    let v = outcomeScore(g, seat, o);
    if (depth > 0 && !o.crash && v > -500) {
      const car = g.cars[seat];
      const wear = { ...car.wear, brakes: car.wear.brakes - o.brake, tires: car.wear.tires - o.tires };
      const next = withCar(g, seat, { pos: o.end, corner: o.corner, wear }, () => gearValues(g, seat, depth - 1));
      v += 0.85 * (next.length ? Math.max(...next.map(x => x.v)) : -1000);
    }
    if (!best || v > best.v) best = { v, o };
  }
  return best;
}

export function botAction(g, seat) {
  const car = g.cars[seat];
  if (g.phase === 'move') return { type: 'move', brake: bestMove(g, seat, 1).o.brake };
  const opts = gearValues(g, seat, 1).sort((a, b) => b.v - a.v);
  return { type: 'gear', gear: opts.length ? opts[0].gear : Math.max(1, car.gear - 1) };
}
