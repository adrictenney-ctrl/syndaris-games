// Bento Box: a card-drafting game of packed lunches. Everyone picks one card from their hand at
// the same time, lays it down, and passes the rest of the hand to the left — until the hands
// run out. Three rounds. Scoring each round:
//   Spring rolls: 5 for each pair.        Onigiri: 10 for each set of three.
//   Gyoza: 1 / 3 / 6 / 10 / 15 for one to five or more.
//   Lanterns: most lanterns 6, second most 3 (ties split, rounded down).
//   Rice bowls: egg 1, salmon 2, tuna 3 — tripled if poured on an earlier Soy sauce.
//   Chopsticks: later, take two cards in one turn and put the chopsticks back in the hand.
//   Mochi stays until the end of the game: most mochi +6, fewest −6.
// Our own names, art and numbers of cards.

export const CARDS = {
  roll: { name: 'Spring Roll', ic: '🥟', col: '#c9853a', n: 14, tip: 'Pairs score 5' },
  oni: { name: 'Onigiri', ic: '🍙', col: '#5a7a8a', n: 14, tip: 'Sets of 3 score 10' },
  gyoza: { name: 'Gyoza', ic: '🥠', col: '#9a6aa0', n: 14, tip: '1·3·6·10·15' },
  lan1: { name: 'Lantern', ic: '🏮', col: '#c0392b', n: 6, lan: 1, tip: 'Most lanterns 6, second 3' },
  lan2: { name: 'Lanterns', ic: '🏮', col: '#c0392b', n: 12, lan: 2, tip: 'Most lanterns 6, second 3' },
  lan3: { name: 'Lanterns', ic: '🏮', col: '#c0392b', n: 8, lan: 3, tip: 'Most lanterns 6, second 3' },
  egg: { name: 'Egg Bowl', ic: '🍳', col: '#d9a521', n: 5, bowl: 1, tip: '1 point' },
  salmon: { name: 'Salmon Bowl', ic: '🍣', col: '#e07050', n: 10, bowl: 2, tip: '2 points' },
  tuna: { name: 'Tuna Bowl', ic: '🐟', col: '#4a6a9a', n: 5, bowl: 3, tip: '3 points' },
  soy: { name: 'Soy Sauce', ic: '🫙', col: '#5a3a2a', n: 6, tip: 'Triples the next bowl' },
  sticks: { name: 'Chopsticks', ic: '🥢', col: '#3a7a5a', n: 4, tip: 'Later: take two cards at once' },
  mochi: { name: 'Mochi', ic: '🍡', col: '#e48aa8', n: 10, tip: 'End of game: most +6, fewest −6' },
};
const HAND = { 2: 10, 3: 9, 4: 8, 5: 7 };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, round: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.deck = shuffle(Object.entries(CARDS).flatMap(([k, c]) => Array(c.n).fill(k)));
  g.scores = g.seats.map(() => 0);
  g.mochi = g.seats.map(() => 0);
  g.history = [];
  startRound(g);
  return g;
}

function startRound(g) {
  g.round++;
  const n = HAND[g.order.length];
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.deck.splice(0, n);
  g.played = g.seats.map(() => []);     // { k, soy?: bool (a soy that's been used), on?: true (bowl on soy) }
  g.picks = g.seats.map(() => null);
  g.phase = 'pick';
  g.result = null;
  g.moveId++;
}

export const current = () => -1;

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (a.type === 'pick') {
    if (g.phase !== 'pick') return 'Wait for the next pick';
    const h = g.hands[seat];
    const idx = (a.idx || []).map(Number);
    if (!idx.length || idx.length > 2 || new Set(idx).size !== idx.length || idx.some(i => !(i >= 0 && i < h.length))) return 'Pick a card';
    if (idx.length === 2 && !g.played[seat].some(p => p.k === 'sticks')) return 'You need chopsticks on the table to take two';
    g.picks[seat] = idx;
    g.moveId++;
    if (g.order.every(s => g.picks[s])) reveal(g);
    return null;
  }
  if (a.type === 'unpick') {
    if (g.phase !== 'pick' || !g.picks[seat]) return 'Nothing to change';
    g.picks[seat] = null;
    g.moveId++;
    return null;
  }
  if (a.type === 'next') {
    if (g.phase !== 'roundEnd') return 'Not yet';
    startRound(g);
    return null;
  }
  return "That move isn't allowed";
}

function reveal(g) {
  for (const s of g.order) {
    const h = g.hands[s];
    const idx = g.picks[s].slice().sort((a, b) => b - a);
    const taken = idx.map(i => h[i]);
    idx.forEach(i => h.splice(i, 1));
    for (const k of taken.reverse()) {
      const card = { k };
      if (CARDS[k].bowl) { const soy = g.played[s].find(p => p.k === 'soy' && !p.used); if (soy) { soy.used = true; card.on = true; } }
      g.played[s].push(card);
    }
    if (taken.length === 2) { const i = g.played[s].findIndex(p => p.k === 'sticks'); g.played[s].splice(i, 1); h.push('sticks'); }
  }
  g.picks = g.seats.map(() => null);
  g.moveId++;
  // Pass hands to the left.
  const hs = g.order.map(s => g.hands[s]);
  g.order.forEach((s, i) => { g.hands[s] = hs[(i - 1 + hs.length) % hs.length]; });
  if (g.order.every(s => !g.hands[s].length)) scoreRound(g);
}

export function roundScore(played) {
  const cnt = k => played.filter(p => p.k === k).length;
  const gy = [0, 1, 3, 6, 10, 15][Math.min(5, cnt('gyoza'))];
  const bowls = played.filter(p => CARDS[p.k].bowl).reduce((t, p) => t + CARDS[p.k].bowl * (p.on ? 3 : 1), 0);
  return { roll: Math.floor(cnt('roll') / 2) * 5, oni: Math.floor(cnt('oni') / 3) * 10, gyoza: gy, bowls };
}
export const lanterns = played => played.reduce((t, p) => t + (CARDS[p.k].lan || 0), 0);

function scoreRound(g) {
  const lines = g.seats.map(() => null);
  for (const s of g.order) { const r = roundScore(g.played[s]); lines[s] = { ...r, lan: 0 }; }
  // Lanterns: most 6, second 3.
  const L = g.order.map(s => [s, lanterns(g.played[s])]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  if (L.length) {
    const top = L.filter(x => x[1] === L[0][1]);
    top.forEach(([s]) => { lines[s].lan = Math.floor(6 / top.length); });
    if (top.length === 1) {
      const rest = L.filter(x => x[1] < L[0][1]);
      const sec = rest.filter(x => rest.length && x[1] === rest[0][1]);
      sec.forEach(([s]) => { lines[s].lan = Math.floor(3 / sec.length); });
    }
  }
  for (const s of g.order) {
    const t = Object.values(lines[s]).reduce((a, b) => a + b, 0);
    lines[s].total = t;
    g.scores[s] += t;
    g.mochi[s] += g.played[s].filter(p => p.k === 'mochi').length;
  }
  g.result = { lines };
  g.history.push(lines);
  if (g.round >= 3) {
    // Mochi: most +6, fewest −6 (no penalty with two players).
    const vals = g.order.map(s => g.mochi[s]);
    const hi = Math.max(...vals), lo = Math.min(...vals);
    g.mochiBonus = g.seats.map(() => 0);
    if (hi !== lo) {
      const top = g.order.filter(s => g.mochi[s] === hi), bot = g.order.filter(s => g.mochi[s] === lo);
      top.forEach(s => { g.mochiBonus[s] = Math.floor(6 / top.length); });
      if (g.order.length > 2) bot.forEach(s => { g.mochiBonus[s] = -Math.floor(6 / bot.length); });
    }
    g.order.forEach(s => { g.scores[s] += g.mochiBonus[s]; });
    const best = Math.max(...g.order.map(s => g.scores[s]));
    g.winners = g.order.filter(s => g.scores[s] === best);
    g.phase = 'over';
  } else { g.phase = 'roundEnd'; g.nextAt = Date.now() + 12000; }
}

export function tick(g, players) {
  if (g.phase === 'roundEnd') return { ms: Math.max(0, g.nextAt - Date.now()), run: () => startRound(g) };
  if (g.phase === 'pick') {
    const s = g.order.find(x => !g.picks[x] && players?.[x]?.bot);
    if (s != null) return { ms: 500, run: () => applyAction(g, s, botAction(g, s)) };
  }
  return null;
}

// ------------------------------------------------------------------ computer player
function value(g, s, k) {
  const pl = g.played[s], cnt = x => pl.filter(p => p.k === x).length;
  const left = g.hands[s].length;
  switch (k) {
    case 'roll': return cnt('roll') % 2 ? 5 : left > 2 ? 2.5 : 0.5;
    case 'oni': return cnt('oni') % 3 === 2 ? 10 : cnt('oni') % 3 === 1 ? (left > 2 ? 4 : 0.5) : left > 4 ? 3 : 0.3;
    case 'gyoza': return [1, 2, 3, 4, 5, 0][Math.min(5, cnt('gyoza'))];
    case 'lan1': return 1; case 'lan2': return 2; case 'lan3': return 3;
    case 'egg': case 'salmon': case 'tuna': return CARDS[k].bowl * (pl.some(p => p.k === 'soy' && !p.used) ? 3 : 1);
    case 'soy': return left > 3 ? 3.5 : 0.5;
    case 'sticks': return left > 4 ? 2 : 0;
    case 'mochi': return g.round === 3 ? 3 : 2;
  }
  return 0;
}
export function botAction(g, s) {
  const h = g.hands[s];
  const scored = h.map((k, i) => ({ i, v: value(g, s, k) + Math.random() * 0.8 })).sort((a, b) => b.v - a.v);
  const sticks = g.played[s].some(p => p.k === 'sticks');
  if (sticks && scored.length > 1 && scored[1].v > 3) return { type: 'pick', idx: [scored[0].i, scored[1].i] };
  return { type: 'pick', idx: [scored[0].i] };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, round: g.round, hand: g.hands[seat] || [], picked: g.picks[seat], ready: g.picks.map(Boolean), order: g.order,
    played: g.played, scores: g.scores, mochi: g.mochi, result: g.result, winners: g.winners || null, mochiBonus: g.mochiBonus || null,
    hasSticks: g.played[seat]?.some(p => p.k === 'sticks'), moveId: g.moveId,
  };
}
