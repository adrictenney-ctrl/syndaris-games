// Road Rally: a card race to drive exactly 1000 miles. Draw one card, play one card (or
// discard). You need a Green Light before mileage counts. Slow your rivals with hazards —
// Crash, Empty Tank, Flat Tire, Red Light, or a Speed Limit (50 or less a turn) — and fix your
// own with the matching remedy (Tow Truck, Fuel Can, Spare Tire, Green Light, End of Limit).
// Four Aces make you immune for the rest of the hand: Stunt Driver (crashes), Fuel Tanker,
// Tough Tires, and Right of Way (red lights and speed limits). Play an Ace right when you're
// hit by its hazard — a Counter-Move — for 300 extra and another turn. At most two 200s a hand.
// Score: miles + 100 per Ace + 300 per Counter-Move + 400 for finishing (+300 with no 200s,
// +500 if a rival drove nothing). First to the target total wins. Our own names and art.

export const KINDS = {
  d25: { t: 'miles', v: 25, n: 10 }, d50: { t: 'miles', v: 50, n: 10 }, d75: { t: 'miles', v: 75, n: 10 }, d100: { t: 'miles', v: 100, n: 12 }, d200: { t: 'miles', v: 200, n: 4 },
  crash: { t: 'hazard', name: 'Crash', ic: '💥', fix: 'tow', ace: 'stunt', n: 3 },
  empty: { t: 'hazard', name: 'Empty Tank', ic: '⛽', fix: 'fuel', ace: 'tanker', n: 3 },
  flat: { t: 'hazard', name: 'Flat Tire', ic: '🛞', fix: 'spare', ace: 'tough', n: 3 },
  limit: { t: 'hazard', name: 'Speed Limit', ic: '🐢', fix: 'unlimit', ace: 'row', n: 4 },
  red: { t: 'hazard', name: 'Red Light', ic: '🛑', fix: 'green', ace: 'row', n: 5 },
  tow: { t: 'remedy', name: 'Tow Truck', ic: '🛻', n: 6 }, fuel: { t: 'remedy', name: 'Fuel Can', ic: '🛢️', n: 6 }, spare: { t: 'remedy', name: 'Spare Tire', ic: '🔧', n: 6 },
  unlimit: { t: 'remedy', name: 'End of Limit', ic: '🏁', n: 6 }, green: { t: 'remedy', name: 'Green Light', ic: '🟢', n: 14 },
  stunt: { t: 'ace', name: 'Stunt Driver', ic: '🏎️', n: 1 }, tanker: { t: 'ace', name: 'Fuel Tanker', ic: '🚛', n: 1 }, tough: { t: 'ace', name: 'Tough Tires', ic: '🛡️', n: 1 }, row: { t: 'ace', name: 'Right of Way', ic: '🚨', n: 1 },
};
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { target: 1000, goal: 3000, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, handNo: 0, dealerIdx: -1 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.scores = g.seats.map(() => 0);
  deal(g);
  return g;
}

function deal(g) {
  g.handNo++;
  g.dealerIdx = (g.dealerIdx + 1) % g.order.length;
  g.deck = shuffle(Object.entries(KINDS).flatMap(([k, c]) => Array(c.n).fill(k)));
  g.discard = [];
  g.hands = g.seats.map(() => []);
  g.p = g.seats.map(() => null);
  for (const s of g.order) { g.hands[s] = g.deck.splice(0, 6); g.p[s] = { battle: null, limited: false, miles: 0, aces: [], coups: 0, n200: 0, cards: [] }; }
  g.turn = g.order[(g.dealerIdx + 1) % g.order.length];
  g.result = null;
  startTurn(g);
}

function startTurn(g) {
  if (g.deck.length) g.hands[g.turn].push(g.deck.pop());
  g.phase = 'play';
  g.moveId++;
  if (!g.hands[g.turn].length) {
    // Out of cards with the deck gone: pass to someone who still has some, or end the hand.
    const next = g.order.find(s => g.hands[s].length);
    if (next == null) endHand(g, false); else g.turn = next;
  }
}

export const has = (p, ace) => p.aces.includes(ace);
// Is this player rolling (allowed to add miles)?
export function rolling(p) {
  const b = p.battle;
  if (has(p, 'row')) return !b || KINDS[b].t !== 'hazard' || b === 'red';
  return b === 'green';
}
export const limited = p => p.limited && !has(p, 'row');

export function canPlay(g, s, k, target = s) {
  const p = g.p[s], c = KINDS[k];
  if (c.t === 'miles') {
    if (!rolling(p)) return 'You need a Green Light first';
    if (limited(p) && c.v > 50) return 'Speed limit: 50 or less';
    if (p.miles + c.v > g.settings.target) return `That would overshoot ${g.settings.target}`;
    if (c.v === 200 && p.n200 >= 2) return 'Only two 200s a hand';
    return null;
  }
  if (c.t === 'remedy') {
    if (k === 'unlimit') return p.limited ? null : 'You aren’t speed limited';
    if (k === 'green') return !p.battle || KINDS[p.battle].t === 'remedy' || p.battle === 'red' ? (p.battle === 'green' ? 'You already have a Green Light' : has(p, 'row') && p.battle !== 'red' ? 'Right of Way — you don’t need it' : null) : 'Fix your hazard first';
    return p.battle && KINDS[p.battle].fix === k ? null : 'That doesn’t fix anything';
  }
  if (c.t === 'ace') return null;
  // Hazard on a rival.
  if (target === s || !g.p[target]) return 'Pick a rival';
  const q = g.p[target];
  if (has(q, c.ace)) return 'They’re immune to that';
  if (k === 'limit') return q.limited ? 'They’re already limited' : null;
  if (!rolling(q)) return 'They aren’t moving';
  return null;
}

export const current = g => (g.phase === 'play' ? g.turn : g.phase === 'coup' ? g.coup.target : -1);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== current(g)) return "It isn't your turn";
  const h = g.hands[seat];
  if (g.phase === 'coup') {
    const { target, ace, from } = g.coup;
    if (a.type === 'coup') {
      g.hands[seat] = h.filter((x, i) => i !== h.indexOf(ace));
      applyAce(g, seat, ace, true);
      g.phase = 'play';
      g.turn = seat;
      g.coup = null;
      startTurn(g);
      return null;
    }
    g.coup = null;
    g.phase = 'play';
    return nextTurn(g, from);
  }
  const i = Number(a.i);
  const k = h[i];
  if (k === undefined) return 'Pick a card';
  if (a.type === 'discard') { h.splice(i, 1); g.discard.push(k); g.moveId++; return nextTurn(g, seat); }
  if (a.type !== 'play') return "That move isn't allowed";
  const c = KINDS[k];
  const t = a.target == null ? seat : Number(a.target);
  const err = canPlay(g, seat, k, t);
  if (err) return err;
  h.splice(i, 1);
  const p = g.p[seat];
  g.moveId++;
  if (c.t === 'miles') {
    p.miles += c.v; if (c.v === 200) p.n200++;
    p.cards.push(k);
    if (p.miles === g.settings.target) { announce(g, seat, `${g.settings.target} miles! 🏁`); return endHand(g, true, seat); }
    return nextTurn(g, seat);
  }
  if (c.t === 'remedy') {
    if (k === 'unlimit') p.limited = false; else p.battle = k;
    g.discard.push(k);
    return nextTurn(g, seat);
  }
  if (c.t === 'ace') {
    applyAce(g, seat, k, false);
    startTurn(g);    // an Ace gives another turn
    return null;
  }
  // Hazard.
  const q = g.p[t];
  if (k === 'limit') q.limited = true; else q.battle = k;
  announce(g, t, `${c.ic} ${c.name}!`);
  if (g.hands[t].includes(c.ace)) {
    g.phase = 'coup';
    g.coup = { target: t, ace: c.ace, from: seat, hazard: k };
    return null;
  }
  return nextTurn(g, seat);
}

function applyAce(g, s, ace, coup) {
  const p = g.p[s];
  p.aces.push(ace);
  if (coup) { p.coups++; announce(g, s, `Counter-Move! ${KINDS[ace].ic} +300`); }
  else announce(g, s, `${KINDS[ace].ic} ${KINDS[ace].name}`);
  if (ace === 'row') { p.limited = false; if (p.battle === 'red') p.battle = null; }
  else if (p.battle && KINDS[p.battle].ace === ace) p.battle = null;
  g.moveId++;
}

function nextTurn(g, seat) {
  if (!g.deck.length && g.order.every(s => !g.hands[s].length)) return endHand(g, false);
  g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
  startTurn(g);
  return null;
}

function endHand(g, done, finisher = null) {
  const add = g.seats.map(() => 0);
  const lines = g.seats.map(() => []);
  for (const s of g.order) {
    const p = g.p[s];
    const L = lines[s];
    const push = (why, v) => { if (v) { L.push([why, v]); add[s] += v; } };
    push('miles', p.miles);
    push('aces', p.aces.length * 100 + (p.aces.length === 4 ? 300 : 0));
    push('counter-moves', p.coups * 300);
    if (s === finisher) {
      push('trip complete', 400);
      if (!p.n200) push('no 200s', 300);
      if (!g.deck.length) push('delayed action', 300);
      if (g.order.some(o => o !== s && g.p[o].miles === 0)) push('shutout', 500);
    }
  }
  g.scores = g.scores.map((x, i) => x + add[i]);
  g.result = { add, lines, finisher };
  const top = Math.max(...g.order.map(s => g.scores[s]));
  if (top >= g.settings.goal) { g.phase = 'over'; g.winner = g.order.find(s => g.scores[s] === top); }
  else { g.phase = 'handEnd'; g.nextAt = Date.now() + 12000; }
  g.moveId++;
  return null;
}

export function advance(g) { if (g.phase === 'handEnd') deal(g); }
export function tick(g) { return g.phase === 'handEnd' ? { ms: Math.max(0, g.nextAt - Date.now()), run: () => advance(g) } : null; }

// ------------------------------------------------------------------ computer player
export function botAction(g, s) {
  if (g.phase === 'coup') return { type: 'coup' };
  const h = g.hands[s], p = g.p[s];
  const opts = h.map((k, i) => ({ k, i, c: KINDS[k] }));
  // Aces always (they give another turn).
  const ace = opts.find(o => o.c.t === 'ace' && (p.battle && KINDS[p.battle].ace === o.k || (o.k === 'row' && (p.limited || p.battle === 'red')) || h.length >= 7));
  if (ace) return { type: 'play', i: ace.i };
  // Fix myself.
  const fix = opts.find(o => o.c.t === 'remedy' && !canPlay(g, s, o.k));
  if (fix) return { type: 'play', i: fix.i };
  // Attack the leader.
  const rivals = g.order.filter(o => o !== s).sort((a, b) => g.p[b].miles - g.p[a].miles);
  for (const t of rivals) {
    const hz = opts.filter(o => o.c.t === 'hazard' && !canPlay(g, s, o.k, t));
    const best = hz.find(o => o.k !== 'limit') || (g.p[t].miles > 400 ? hz[0] : null);
    if (best && (g.p[t].miles >= p.miles - 100 || Math.random() < 0.3)) return { type: 'play', i: best.i, target: t };
  }
  // Drive.
  const miles = opts.filter(o => o.c.t === 'miles' && !canPlay(g, s, o.k)).sort((a, b) => b.c.v - a.c.v);
  if (miles.length) return { type: 'play', i: miles[0].i };
  // Any other hazard.
  for (const t of rivals) { const hz = opts.find(o => o.c.t === 'hazard' && !canPlay(g, s, o.k, t)); if (hz) return { type: 'play', i: hz.i, target: t }; }
  // Discard: miles that can't be used, spare remedies, small mileage.
  const worst = opts.slice().sort((a, b) => {
    const w = o => (o.c.t === 'ace' ? 100 : o.c.t === 'miles' ? (p.miles + o.c.v > g.settings.target ? -10 : o.c.v / 10) : o.c.t === 'remedy' ? (h.filter(x => x === o.k).length > 1 ? 1 : 6) : 4);
    return w(a) - w(b);
  })[0];
  return { type: 'discard', i: worst.i };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, order: g.order, hand: g.hands[seat] || [], p: g.p, deck: g.deck.length, scores: g.scores, target: g.settings.target, goal: g.settings.goal,
    coup: g.coup && g.coup.target === seat ? g.coup : g.coup && { target: g.coup.target }, result: g.result, handNo: g.handNo, winner: g.winner ?? null, moveId: g.moveId,
    top: g.discard[g.discard.length - 1] || null,
  };
}
