// Seven Spires: race to raise a five-stage spire. Runs only on the table (host).
//
// On your turn take one card: the face-up top of either deck beside you (each deck is shared
// with a neighbour) or the hidden top of the central deck.
//   • Materials (Timber, Stone, Clay, Glass, Scroll; Gold counts as any one) build your spire —
//     as soon as you hold what the next stage needs, it's built and those cards are spent.
//   • Banners add to your army. Some carry war drums; when enough drums have sounded, war:
//     everyone compares banners with each neighbour, the bigger army takes a Victory laurel
//     (3 points), and every army disbands.
//   • Science (Gear, Astrolabe, Quill): two alike, or one of each, buys a Boon of your choice.
//   • Laurels are points. Some carry the Owl: whoever took the latest Owl may peek at the top of
//     the central deck.
// When someone finishes their fifth stage the game ends; most points wins.

export const MATS = ['timber', 'stone', 'clay', 'glass', 'scroll'];
export const SCI = ['gear', 'astro', 'quill'];
export const CARD = {
  timber: { kind: 'mat', name: 'Timber', ic: '🪵', n: 12 },
  stone: { kind: 'mat', name: 'Stone', ic: '🪨', n: 12 },
  clay: { kind: 'mat', name: 'Clay', ic: '🧱', n: 12 },
  glass: { kind: 'mat', name: 'Glass', ic: '💠', n: 12 },
  scroll: { kind: 'mat', name: 'Scroll', ic: '📜', n: 12 },
  gold: { kind: 'mat', name: 'Gold', ic: '🪙', n: 8, wild: true },
  b2: { kind: 'banner', name: 'Two Banners', ic: '🚩', banners: 2, drums: 0, n: 6 },
  b1d1: { kind: 'banner', name: 'Banner & Drum', ic: '🚩', banners: 1, drums: 1, n: 8 },
  b1d2: { kind: 'banner', name: 'Banner & Drums', ic: '🚩', banners: 1, drums: 2, n: 4 },
  gear: { kind: 'sci', name: 'Gear', ic: '⚙️', n: 7 },
  astro: { kind: 'sci', name: 'Astrolabe', ic: '🧭', n: 7 },
  quill: { kind: 'sci', name: 'Quill', ic: '🪶', n: 7 },
  l3: { kind: 'laurel', name: 'Laurel', ic: '🏛️', pts: 3, n: 6 },
  l2o: { kind: 'laurel', name: 'Laurel & Owl', ic: '🦉', pts: 2, owl: true, n: 8 },
};
// The five stages, the same for everyone: how many cards, alike or all different, and points.
export const STAGES = [
  { n: 2, same: true, pts: 3 }, { n: 2, same: false, pts: 3 }, { n: 3, same: true, pts: 4 },
  { n: 3, same: false, pts: 5 }, { n: 4, same: true, pts: 7 },
];
export const BOONS = {
  crown: { name: 'Laurel Crown', text: '4 points' },
  treasury: { name: 'Treasury', text: '5 points' },
  mason: { name: "Mason's Guild", text: '+2 points per stage you build' },
  curator: { name: 'Curator', text: '+2 points per laurel card' },
  marshal: { name: 'Marshal', text: 'Your army counts one banner bigger in every war' },
  alchemist: { name: 'Alchemist', text: '+1 point per material card left at the end' },
  owlery: { name: 'Owlery', text: '+2 points per Owl you\'ve taken' },
  scholar: { name: 'Scholar', text: '+2 points per Boon you own' },
};
export const typeOf = c => c.split('.')[0];
export const drumsForWar = n => (n <= 3 ? 3 : n <= 5 ? 4 : 5);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const n = g.order.length;
  let id = 0;
  const all = shuffle(Object.entries(CARD).flatMap(([t, c]) => Array.from({ length: c.n }, () => `${t}.${id++}`)));
  // One deck between each pair of neighbours (two for a two-player game), plus the centre.
  const sides = n === 2 ? 2 : n;
  const per = Math.floor(all.length / (sides + 1.4));
  g.decks = Array.from({ length: sides }, () => all.splice(0, per));
  g.center = all;
  g.tab = g.seats.map(() => ({ mats: Object.fromEntries([...MATS, 'gold'].map(m => [m, 0])), banners: 0, sci: { gear: 0, astro: 0, quill: 0 }, laurels: [], owls: 0, stages: 0, boons: [], wars: 0 }));
  g.drums = 0;
  g.owl = null;
  const pool = shuffle(Object.keys(BOONS));
  g.boonOffer = pool.splice(0, 3);
  g.boonPool = pool;
  g.turn = g.order[Math.floor(Math.random() * n)];
  g.phase = 'play';
  g.boonFor = null;
  g.winners = [];
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const log = (g, seat, text) => { g.log.push({ seat, text }); if (g.log.length > 30) g.log.shift(); };
const idx = (g, s) => g.order.indexOf(s);
const nextSeat = (g, s) => g.order[(idx(g, s) + 1) % g.order.length];
// The two decks a player can reach: the one on their left (shared with the previous player)
// and the one on their right (shared with the next).
export function reach(g, s) {
  const i = idx(g, s), n = g.order.length;
  if (n === 2) return { left: 0, right: 1 };
  return { left: (i - 1 + n) % n, right: i };
}
export const deckTop = d => d[d.length - 1] || null;
export const current = g => (g.phase === 'over' ? -1 : g.phase === 'boon' ? g.boonFor : g.turn);

// ---------------------------------------------------------------- building the spire

// The cards that would pay for a stage, or null. Natural materials first, Gold to fill gaps.
export function payFor(mats, stage) {
  if (!stage) return null;
  const have = { ...mats };
  if (stage.same) {
    const best = MATS.slice().sort((a, b) => have[b] - have[a])[0];
    if (have[best] + have.gold < stage.n) return null;
    const use = Math.min(have[best], stage.n);
    return { [best]: use, gold: stage.n - use };
  }
  const kinds = MATS.filter(m => have[m] > 0).sort((a, b) => have[b] - have[a]);
  const take = kinds.slice(0, stage.n);
  const gold = stage.n - take.length;
  if (gold > have.gold) return null;
  return Object.fromEntries([...take.map(m => [m, 1]), ['gold', gold]]);
}
// How many more material cards the next stage needs.
export function missing(mats, stage) {
  if (!stage) return 0;
  if (stage.same) return Math.max(0, stage.n - Math.max(...MATS.map(m => mats[m])) - mats.gold);
  return Math.max(0, stage.n - Math.min(stage.n, MATS.filter(m => mats[m] > 0).length) - mats.gold);
}

function tryBuild(g, s) {
  const t = g.tab[s];
  let built = false;
  while (t.stages < STAGES.length) {
    const pay = payFor(t.mats, STAGES[t.stages]);
    if (!pay) break;
    for (const [m, k] of Object.entries(pay)) t.mats[m] -= k;
    t.stages++;
    built = true;
    announce(g, s, `Stage ${t.stages} built! +${STAGES[t.stages - 1].pts}`);
    log(g, s, `built stage ${t.stages}`);
  }
  return built;
}

// ---------------------------------------------------------------- war and science

function war(g) {
  const n = g.order.length;
  const pairs = n === 2 ? [[g.order[0], g.order[1]]] : g.order.map((s, i) => [s, g.order[(i + 1) % n]]);
  const army = s => g.tab[s].banners + (g.tab[s].boons.includes('marshal') ? 1 : 0);
  const won = [];
  for (const [a, b] of pairs) {
    if (army(a) === army(b)) continue;
    const w = army(a) > army(b) ? a : b;
    g.tab[w].wars++;
    won.push(w);
  }
  g.lastWar = { id: g.moveId, won };
  for (const s of g.order) g.tab[s].banners = 0;
  g.drums = 0;
  announce(g, won[0] ?? g.turn, 'War! ⚔️');
  log(g, won[0] ?? g.turn, `— war: ${won.length ? won.length + ' victory laurel' + (won.length > 1 ? 's' : '') + ' handed out' : 'all square'}`);
}

// Two alike, or one of each: spend them for a Boon.
function scienceReady(sci) {
  const pair = SCI.find(k => sci[k] >= 2);
  if (pair) return { [pair]: 2 };
  if (SCI.every(k => sci[k] >= 1)) return { gear: 1, astro: 1, quill: 1 };
  return null;
}

// ---------------------------------------------------------------- turns

function endTurn(g) {
  g.moveId++;
  const done = g.order.some(s => g.tab[s].stages >= STAGES.length) || (!g.center.length && g.decks.every(d => !d.length));
  if (done) return finish(g);
  g.turn = nextSeat(g, g.turn);
}

export function points(g, s, final = true) {
  const t = g.tab[s];
  let p = STAGES.slice(0, t.stages).reduce((a, st) => a + st.pts, 0) + t.laurels.reduce((a, x) => a + x, 0) + t.wars * 3;
  for (const b of t.boons) {
    if (b === 'crown') p += 4;
    else if (b === 'treasury') p += 5;
    else if (b === 'mason') p += 2 * t.stages;
    else if (b === 'curator') p += 2 * t.laurels.length;
    else if (b === 'owlery') p += 2 * t.owls;
    else if (b === 'scholar') p += 2 * t.boons.length;
    else if (b === 'alchemist' && final) p += Object.values(t.mats).reduce((a, x) => a + x, 0);
  }
  return p;
}

function finish(g) {
  g.phase = 'over';
  const best = Math.max(...g.order.map(s => points(g, s)));
  g.winners = g.order.filter(s => points(g, s) === best);
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (g.phase === 'boon') {
    if (seat !== g.boonFor) return 'Waiting for a Boon to be chosen';
    if (a.type !== 'boon' || !g.boonOffer.includes(a.boon)) return 'Pick one of the Boons on offer';
    g.tab[seat].boons.push(a.boon);
    g.boonOffer = g.boonOffer.filter(b => b !== a.boon);
    if (g.boonPool.length) g.boonOffer.push(g.boonPool.shift());
    announce(g, seat, BOONS[a.boon].name);
    log(g, seat, `took the ${BOONS[a.boon].name} boon`);
    g.phase = 'play';
    g.boonFor = null;
    endTurn(g);
    return null;
  }
  if (seat !== g.turn) return "It isn't your turn";
  const r = reach(g, seat);
  if (a.type === 'pass') {
    if (g.center.length || g.decks[r.left].length || g.decks[r.right].length) return 'There are still cards you can take';
    endTurn(g);
    return null;
  }
  if (a.type !== 'take') return 'Take a card';
  const src = a.from === 'center' ? g.center : a.from === 'left' ? g.decks[r.left] : a.from === 'right' ? g.decks[r.right] : null;
  if (!src) return 'Take from a deck beside you or the centre';
  if (!src.length) return 'That deck is empty';
  const c = src.pop();
  const t = typeOf(c), d = CARD[t], tab = g.tab[seat];
  g.lastTake = { seat, card: c, from: a.from, deck: a.from === 'center' ? -1 : a.from === 'left' ? r.left : r.right, id: g.moveId + 1 };
  if (d.kind === 'mat') { tab.mats[t]++; tryBuild(g, seat); }
  else if (d.kind === 'banner') {
    tab.banners += d.banners;
    g.drums += d.drums;
    if (g.drums >= drumsForWar(g.order.length)) war(g);
  } else if (d.kind === 'laurel') {
    tab.laurels.push(d.pts);
    if (d.owl) { tab.owls++; g.owl = seat; }
  } else if (d.kind === 'sci') {
    tab.sci[t]++;
    const spend = scienceReady(tab.sci);
    if (spend && g.boonOffer.length) {
      for (const [k, v] of Object.entries(spend)) tab.sci[k] -= v;
      g.phase = 'boon';
      g.boonFor = seat;
      g.moveId++;
      return null;
    }
  }
  endTurn(g);
  return null;
}

export function viewFor(g, seat) {
  const r = g.order.includes(seat) ? reach(g, seat) : null;
  return {
    phase: g.phase, turn: g.turn, order: g.order, toMove: current(g),
    decks: g.decks.map(d => ({ n: d.length, top: deckTop(d) })), center: g.center.length,
    peek: g.owl === seat ? deckTop(g.center) : null, reach: r,
    tab: g.tab, drums: g.drums, warAt: drumsForWar(g.order.length), owl: g.owl,
    boonOffer: g.boonOffer, boonFor: g.boonFor, points: g.order.map(s => points(g, s, g.phase === 'over')),
    lastTake: g.lastTake, lastWar: g.lastWar, winners: g.winners, moveId: g.moveId,
  };
}

// ---------------------------------------------------------------- bots

function cardValue(g, s, c) {
  const t = typeOf(c), d = CARD[t], tab = g.tab[s];
  if (d.kind === 'mat') {
    const st = STAGES[tab.stages];
    if (!st) return 0.5;
    const before = missing(tab.mats, st);
    const after = missing({ ...tab.mats, [t]: tab.mats[t] + 1 }, st);
    return 1.5 + (before - after) * (after === 0 ? 9 : 5);
  }
  if (d.kind === 'banner') {
    const n = g.order.length, i = idx(g, s);
    const nb = n === 2 ? [g.order[1 - i]] : [g.order[(i + n - 1) % n], g.order[(i + 1) % n]];
    const close = nb.filter(o => Math.abs(g.tab[o].banners - tab.banners) <= d.banners).length;
    const soon = g.drums + d.drums >= drumsForWar(n) ? 2 : 1;
    return d.banners * 1.2 + close * 1.5 * soon;
  }
  if (d.kind === 'sci') return scienceReady({ ...tab.sci, [t]: tab.sci[t] + 1 }) ? 7 : 2.5;
  return d.pts + (d.owl ? 1 : 0);
}

const boonValue = (g, s, b) => {
  const t = g.tab[s];
  return { crown: 4, treasury: 5, mason: 2 * Math.max(3, t.stages + 2), curator: 2 * (t.laurels.length + 2), marshal: 3, alchemist: 2, owlery: 2 * (t.owls + 1), scholar: 2 * (t.boons.length + 2) }[b] || 0;
};

export function botAction(g, seat) {
  if (g.phase === 'boon') return { type: 'boon', boon: g.boonOffer.slice().sort((a, b) => boonValue(g, seat, b) - boonValue(g, seat, a))[0] };
  const r = reach(g, seat);
  const opts = [];
  for (const from of ['left', 'right']) {
    const top = deckTop(g.decks[r[from]]);
    if (top) opts.push({ from, v: cardValue(g, seat, top) + Math.random() * 0.5 });
  }
  if (g.center.length) {
    const peek = g.owl === seat ? deckTop(g.center) : null;
    opts.push({ from: 'center', v: (peek ? cardValue(g, seat, peek) : 3.2) + Math.random() * 0.5 });
  }
  if (!opts.length) return { type: 'pass' };
  opts.sort((a, b) => b.v - a.v);
  return { type: 'take', from: opts[0].from };
}
