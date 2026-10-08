// Redline: a racing card game round the Redline Ring. Runs only on the table (host).
//
// Each round everyone at once picks a gear (1–4; up or down one is free, two costs a Heat card
// from your engine) and plays that many cards. Then, leader first:
//   • move the total of your speed cards (a Stress card flips cards off your deck until it
//     finds a speed card, and adds that);
//   • Boost, if you chose it: pay a Heat, flip for one more speed card;
//   • last place gets Adrenaline: +1 speed and +1 cooldown;
//   • Slipstream: end on or right behind another car and you may jump 2 spaces;
//   • every corner line you crossed has a speed limit — for each point over, move a Heat card
//     from your engine into your discard pile. Can't pay? Spin out: back before that corner,
//     gear 1, and Stress cards in your hand.
//   • Cool down in low gears (1st: 3 Heat, 2nd: 1) — Heat in your hand goes back to the engine.
// Heat in your hand is dead weight, so manage your engine. First over the line after the last
// lap wins once the round is finished.

import { makeCircuit, findCorners } from './circuit.js?v=62';

export const CTRL = [[40, 104], [100, 108], [150, 104], [182, 90], [186, 62], [166, 48], [176, 26], [150, 10], [112, 16], [96, 40], [74, 52], [56, 34], [36, 14], [16, 32], [22, 62], [16, 86]];
export const L = 64;
export const CIRCUIT = makeCircuit(CTRL, L);
export const CORNERS = findCorners(CIRCUIT).filter(z => z.angle >= 80).map((z, id) => ({
  id, at: (z.from + Math.floor(z.len / 2)) % L, sign: z.sign, angle: z.angle,
  limit: z.angle >= 150 ? 3 : z.angle >= 120 ? 4 : z.angle >= 100 ? 5 : 6,
}));
export const HAND = 7;
export const ENGINE = 6;
export const COOL = { 1: 3, 2: 1, 3: 0, 4: 0 };
export const cardType = c => c.split('.')[0];      // s1..s4, stress, heat
export const speedOf = c => (/^s\d$/.test(cardType(c)) ? Number(cardType(c)[1]) : 0);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = { settings: { laps: 2, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [], uid: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const grid = g.order.slice().sort(() => Math.random() - 0.5);
  g.cars = g.seats.map(() => null);
  grid.forEach((s, k) => {
    const deck = shuffle([...['s1', 's2', 's3', 's4'].flatMap(t => [0, 1, 2].map(() => `${t}.${g.uid++}`)), ...[0, 1, 2].map(() => `stress.${g.uid++}`)]);
    const car = { pos: -Math.floor(k / 2), arrive: k, gear: 1, deck, hand: [], discard: [], engine: ENGINE, done: false, plan: null, last: null };
    g.cars[s] = car;
    draw(g, car);
  });
  g.goal = g.settings.laps * L;
  g.round = 0;
  g.finishers = [];
  newRound(g);
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const racing = g => g.order.filter(s => !g.cars[s].done);

function topCard(g, car) {
  if (!car.deck.length) { car.deck = shuffle(car.discard); car.discard = []; }
  return car.deck.pop();
}
function draw(g, car) {
  while (car.hand.length < HAND) {
    const c = topCard(g, car);
    if (!c) break;
    car.hand.push(c);
  }
}

function newRound(g) {
  g.round++;
  g.phase = 'plan';
  for (const s of racing(g)) g.cars[s].plan = null;
  g.moveId++;
}

export const current = () => -1;   // everyone plans at once; nobody takes a turn alone

// What a seat may do this round.
export function gearChoices(car) {
  return [1, 2, 3, 4].filter(n => Math.abs(n - car.gear) <= 2).map(n => ({ gear: n, heat: Math.abs(n - car.gear) === 2 ? 1 : 0, ok: Math.abs(n - car.gear) < 2 || car.engine >= 1 }));
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The race is over';
  const car = g.cars[seat];
  if (!car) return 'You are not racing';
  if (g.phase !== 'plan') return 'Wait for the cars to move';
  if (car.done) return 'You have finished';
  if (a.type === 'unplan') { car.plan = null; return null; }
  if (a.type !== 'plan') return 'Choose a gear and your cards';
  const opt = gearChoices(car).find(o => o.gear === a.gear);
  if (!opt) return 'You can shift at most two gears';
  if (!opt.ok) return 'No Heat left to pay for a two-gear shift';
  const cards = a.cards || [];
  const playable = car.hand.filter(c => cardType(c) !== 'heat').length;
  // A hand clogged with Heat plays what it can.
  if (cards.length !== Math.min(a.gear, playable) || !cards.length) return `Play exactly ${a.gear} card${a.gear > 1 ? 's' : ''} in gear ${a.gear}`;
  if (new Set(cards).size !== cards.length || !cards.every(c => car.hand.includes(c))) return "Those cards aren't in your hand";
  if (cards.some(c => cardType(c) === 'heat')) return "Heat cards can't be played";
  const boost = !!a.boost;
  if (boost && car.engine < 1 + opt.heat) return 'Not enough Heat in your engine to boost';
  car.plan = { gear: a.gear, cards, boost };
  if (racing(g).every(s => g.cars[s].plan)) startReveal(g);
  return null;
}

function startReveal(g) {
  g.phase = 'reveal';
  // Leader first; on the same space, whoever got there first.
  g.queue = racing(g).sort((a, b) => g.cars[b].pos - g.cars[a].pos || g.cars[a].arrive - g.cars[b].arrive);
  g.lastPlace = g.order.length >= 3 ? g.queue[g.queue.length - 1] : null;
  g.moveId++;
}

const occupancy = (g, pos, except) => g.order.filter(s => s !== except && !g.cars[s].done && g.cars[s].pos === pos).length;
// Corner lines crossed moving from `from` to `to` (absolute positions).
export function crossed(from, to) {
  const out = [];
  for (const c of CORNERS) {
    for (let lap = Math.floor(from / L) - 1; lap <= Math.floor(to / L) + 1; lap++) {
      const abs = c.at + lap * L;
      if (abs > from && abs <= to) out.push({ c, abs });
    }
  }
  return out.sort((a, b) => a.abs - b.abs);
}

// Move one car (called by the table's clock, one car at a time).
export function revealNext(g) {
  const s = g.queue.shift();
  if (s == null) return;
  const car = g.cars[s], p = car.plan;
  const shift = Math.abs(p.gear - car.gear) === 2 ? 1 : 0;
  if (shift) { car.engine--; car.discard.push(`heat.${g.uid++}`); }
  car.gear = p.gear;
  car.hand = car.hand.filter(c => !p.cards.includes(c));
  const flips = [];
  let speed = 0;
  for (const c of p.cards) {
    if (cardType(c) === 'stress') {
      let f;
      do { f = topCard(g, car); if (f) { flips.push(f); car.discard.push(f); } } while (f && !speedOf(f));
      speed += f ? speedOf(f) : 0;
    } else speed += speedOf(c);
    car.discard.push(c);
  }
  if (p.boost && car.engine > 0) {
    car.engine--; car.discard.push(`heat.${g.uid++}`);
    let f;
    do { f = topCard(g, car); if (f) { flips.push(f); car.discard.push(f); } } while (f && !speedOf(f));
    speed += f ? speedOf(f) : 0;
  }
  const adrenaline = g.lastPlace === s;
  if (adrenaline) speed += 1;
  const from = car.pos;
  let to = from + speed;
  while (to > from && occupancy(g, to, s) >= 2 && to < g.goal) to--;
  // Slipstream: two more spaces when tucked in behind (or beside) another car — unless that
  // would carry us over a corner too fast.
  let slip = false;
  const near = g.order.some(o => o !== s && !g.cars[o].done && (g.cars[o].pos === to || g.cars[o].pos === to + 1));
  if (near && to > from) {
    const extra = crossed(to, to + 2).filter(x => speed > x.c.limit);
    let t2 = to + 2;
    while (t2 > to && occupancy(g, t2, s) >= 2) t2--;
    if (!extra.length && t2 > to) { to = t2; slip = true; }
  }
  // Corners.
  let heatPaid = 0, spun = null;
  for (const x of crossed(from, to)) {
    const over = speed - x.c.limit;
    if (over <= 0) continue;
    if (car.engine >= over) { car.engine -= over; heatPaid += over; for (let i = 0; i < over; i++) car.discard.push(`heat.${g.uid++}`); continue; }
    spun = x;
    break;
  }
  if (spun) {
    to = spun.abs - 1;
    while (to > from && occupancy(g, to, s) >= 2) to--;
    const stress = car.gear >= 3 ? 2 : 1;
    for (let i = 0; i < stress; i++) car.hand.push(`stress.${g.uid++}`);
    car.gear = 1;
    announce(g, s, `Spins out! 🌀 (+${stress} stress)`);
  } else if (heatPaid) announce(g, s, `${speed} · 🔥${heatPaid} heat`);
  else announce(g, s, `${speed}${slip ? ' + slipstream' : ''}`);
  car.pos = to;
  car.arrive = g.moveId;
  // Cool down: Heat from the hand back into the engine.
  let cool = (COOL[car.gear] || 0) + (adrenaline ? 1 : 0);
  car.hand = car.hand.filter(c => { if (cool > 0 && cardType(c) === 'heat') { cool--; car.engine++; return false; } return true; });
  draw(g, car);
  car.last = { speed, from, to, heatPaid, spun: !!spun, slip, adrenaline, flips, cards: p.cards, boost: p.boost, round: g.round };
  if (car.pos >= g.goal && !car.done) {
    car.done = true;
    g.finishers.push(s);
    announce(g, s, g.finishers.length === 1 ? '🏁 Chequered flag!' : `🏁 Finishes P${g.finishers.length}`);
  }
  g.moveId++;
  if (!g.queue.length) {
    if (g.finishers.length || !racing(g).length) finish(g);
    else newRound(g);
  }
}

function finish(g) {
  g.phase = 'over';
  g.ranking = [...g.finishers, ...racing(g).sort((a, b) => g.cars[b].pos - g.cars[a].pos)];
}

export const standings = g => g.ranking || [...g.finishers, ...racing(g).sort((a, b) => g.cars[b].pos - g.cars[a].pos)];
export const lapOf = (g, s) => Math.min(g.settings.laps, Math.max(1, Math.floor(g.cars[s].pos / L) + 1));

// The next corner line ahead of a position: distance and limit.
export function nextCorner(pos) {
  const ahead = crossed(pos, pos + L);
  return ahead.length ? { dist: ahead[0].abs - pos, limit: ahead[0].c.limit } : null;
}

export function viewFor(g, seat) {
  const me = g.cars[seat];
  return {
    phase: g.phase, order: g.order, laps: g.settings.laps, goal: g.goal, round: g.round, moveId: g.moveId,
    cars: g.cars.map((c, s) => c && { pos: c.pos, gear: c.gear, engine: c.engine, done: c.done, planned: !!c.plan, last: c.last, hand: c.hand.length, deck: c.deck.length }),
    standings: standings(g), ranking: g.ranking || null, queue: g.queue || [],
    me: me && { hand: me.hand.slice().sort((a, b) => speedOf(b) - speedOf(a) || cardType(a).localeCompare(cardType(b))), gear: me.gear, engine: me.engine, plan: me.plan, deck: me.deck.length, discard: me.discard.length, heatInDiscard: me.discard.filter(c => cardType(c) === 'heat').length },
    gears: me && !me.done ? gearChoices(me) : null, next: me ? nextCorner(me.pos) : null,
  };
}

// ---------------------------------------------------------------- bots

function combos(arr, k, start = 0, cur = [], out = []) {
  if (cur.length === k) { out.push(cur.slice()); return out; }
  for (let i = start; i < arr.length; i++) { cur.push(arr[i]); combos(arr, k, i + 1, cur, out); cur.pop(); }
  return out;
}

export function planFor(g, seat) {
  const car = g.cars[seat];
  const playable = car.hand.filter(c => cardType(c) !== 'heat');
  const heatInHand = car.hand.length - playable.length;
  let best = null;
  for (const o of gearChoices(car)) {
    if (!o.ok || playable.length < o.gear) continue;
    const seen = new Set();
    for (const cs of combos(playable, o.gear)) {
      const sig = cs.map(cardType).sort().join();
      if (seen.has(sig)) continue;
      seen.add(sig);
      const stress = cs.filter(c => cardType(c) === 'stress').length;
      const speed = cs.reduce((a, c) => a + speedOf(c), 0) + stress * 2.5;
      const engine = car.engine - o.heat;
      let heat = 0, spin = false;
      for (const x of crossed(car.pos, car.pos + Math.round(speed))) {
        const over = Math.round(speed) - x.c.limit + (stress ? 1 : 0);
        if (over > 0) { heat += over; if (heat > engine) { spin = true; break; } }
      }
      let v = speed - heat * 1.7 - o.heat * 1.7 + stress * 0.6 + Math.min(heatInHand, COOL[o.gear]) * 1.4 - (spin ? 30 : 0);
      if (engine - heat <= 1) v -= 2;
      v += Math.random() * 0.3;
      if (!best || v > best.v) best = { v, gear: o.gear, cards: cs, engine: engine - heat };
    }
  }
  if (!best) {
    // Only Heat in hand: pick the lowest gear we can fill, playing whatever is allowed.
    const o = gearChoices(car).find(x => x.ok) || { gear: car.gear };
    return { type: 'plan', gear: o.gear, cards: playable.slice(0, Math.min(o.gear, playable.length)) };
  }
  const nc = nextCorner(car.pos);
  const boost = best.engine >= 3 && (!nc || nc.dist > 12) && Math.random() < 0.4;
  return { type: 'plan', gear: best.gear, cards: best.cards, boost };
}

export const botAction = (g, seat) => planFor(g, seat);

// The table's clock: bots plan straight away; then cars move one at a time.
export function tick(g, players) {
  if (g.phase === 'plan') {
    const waiting = racing(g).filter(s => !g.cars[s].plan && players[s]?.bot);
    if (waiting.length) return { ms: 600, run: () => { for (const s of waiting) applyAction(g, s, planFor(g, s)); } };
    return null;
  }
  if (g.phase === 'reveal') return { ms: 1100, run: () => revealNext(g) };
  return null;
}
