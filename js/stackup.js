// Stack Up: everyone races to empty their own stock pile. Four shared build piles in the middle
// go up from 1 to 12 (then they're cleared). On your turn, top up your hand to five, then play
// as many cards as you can onto the build piles — from your hand, the top of your stock, or the
// tops of your four discard piles. Stars are wild. Empty your hand mid-turn and you draw five
// more. End your turn by putting one hand card on one of your discard piles.
// 144 numbered cards (twelve of each 1–12) and 18 stars. Our own names and card design.

export const WILD = 0;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { stock: 0, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.deck = shuffle([...Array(12)].flatMap((_, i) => Array(12).fill(i + 1)).concat(Array(18).fill(WILD)));
  const n = g.settings.stock || (g.order.length <= 4 ? 30 : 20);
  g.stocks = g.seats.map(() => []);
  g.hands = g.seats.map(() => []);
  g.discards = g.seats.map(() => [[], [], [], []]);
  for (const s of g.order) g.stocks[s] = g.deck.splice(0, n);
  g.builds = [[], [], [], []];   // each: list of { v, as } (as = the number it counts as)
  g.done = [];
  g.turn = g.order[Math.floor(Math.random() * g.order.length)];
  startTurn(g);
  return g;
}

function draw(g) {
  if (!g.deck.length) { g.deck = shuffle(g.done); g.done = []; }
  return g.deck.pop();
}
function startTurn(g) {
  const h = g.hands[g.turn];
  while (h.length < 5 && (g.deck.length || g.done.length)) h.push(draw(g));
  g.phase = 'play';
  g.moveId++;
}

export const need = pile => pile.length + 1;            // the number the pile wants next
export const fits = (pile, v) => v === WILD || v === need(pile);
export const current = g => (g.phase === 'play' ? g.turn : -1);

// Source: { from: 'hand', i } | { from: 'stock' } | { from: 'discard', d }
function take(g, s, src, peek = false) {
  if (src.from === 'hand') { const v = g.hands[s][src.i]; if (v === undefined) return undefined; if (!peek) g.hands[s].splice(src.i, 1); return v; }
  if (src.from === 'stock') { const st = g.stocks[s]; if (!st.length) return undefined; return peek ? st[st.length - 1] : st.pop(); }
  if (src.from === 'discard') { const d = g.discards[s][src.d]; if (!d || !d.length) return undefined; return peek ? d[d.length - 1] : d.pop(); }
  return undefined;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || g.turn !== seat) return "It isn't your turn";
  if (a.type === 'build') {
    const pile = g.builds[a.b];
    if (!pile) return 'Pick a build pile';
    const v = take(g, seat, a.src, true);
    if (v === undefined) return 'Nothing there';
    if (!fits(pile, v)) return `That pile needs a ${need(pile)}`;
    take(g, seat, a.src);
    pile.push({ v, as: need(pile) });
    g.moveId++;
    g.built = true;
    if (pile.length === 12) { g.done.push(...pile.map(c => c.v)); g.builds[a.b] = []; announce(g, seat, 'Pile complete!'); }
    if (a.src.from === 'stock' && !g.stocks[seat].length) {
      g.phase = 'over'; g.winner = seat; announce(g, seat, 'Stock empty — wins!'); return null;
    }
    if (!g.hands[seat].length) { for (let k = 0; k < 5; k++) if (g.deck.length || g.done.length) g.hands[seat].push(draw(g)); }
    return null;
  }
  if (a.type === 'end') {
    // Only when there's nothing in your hand to discard (the draw pile ran dry).
    if (g.hands[seat].length) return 'Finish by discarding a card';
    return endTurn(g, seat);
  }
  if (a.type === 'discard') {
    const d = g.discards[seat][a.d];
    if (!d) return 'Pick one of your discard piles';
    const v = g.hands[seat][a.i];
    if (v === undefined) return 'Pick a card from your hand';
    g.hands[seat].splice(a.i, 1);
    d.push(v);
    return endTurn(g, seat);
  }
  return "That move isn't allowed";
}

function endTurn(g, seat) {
  // A whole round with nothing built and no cards left to draw: fewest stock cards wins.
  g.idle = g.built || g.deck.length || g.done.length ? 0 : (g.idle || 0) + 1;
  g.built = false;
  if (g.idle >= g.order.length * 2) {
    const low = Math.min(...g.order.map(x => g.stocks[x].length));
    g.phase = 'over'; g.winner = g.order.find(x => g.stocks[x].length === low); g.stalled = true; g.moveId++;
    return null;
  }
  const i = g.order.indexOf(seat);
  g.turn = g.order[(i + 1) % g.order.length];
  startTurn(g);
  return null;
}

// ------------------------------------------------------------------ computer player
export function botAction(g, s) {
  const srcs = [];
  if (g.stocks[s].length) srcs.push({ from: 'stock' });
  g.discards[s].forEach((d, k) => { if (d.length) srcs.push({ from: 'discard', d: k }); });
  g.hands[s].forEach((_, i) => srcs.push({ from: 'hand', i }));
  const val = src => take(g, s, src, true);
  // 1) Stock card straight onto a pile.
  const sv = g.stocks[s].length ? val({ from: 'stock' }) : null;
  if (sv != null) { const b = g.builds.findIndex(p => fits(p, sv)); if (b >= 0) return { type: 'build', b, src: { from: 'stock' } }; }
  // 2) A non-wild card that brings some pile closer to the stock card.
  if (sv != null && sv !== WILD) {
    for (let b = 0; b < 4; b++) {
      const gap = sv - need(g.builds[b]);
      if (gap <= 0 || gap > 3) continue;
      const src = srcs.find(x => x.from !== 'stock' && val(x) === need(g.builds[b])) || (gap <= 2 && srcs.find(x => x.from === 'hand' && val(x) === WILD));
      if (src) return { type: 'build', b, src };
    }
  }
  // 3) Any non-wild discard top or hand card that fits.
  for (const src of srcs) { if (src.from === 'stock') continue; const v = val(src); if (v === WILD) continue; const b = g.builds.findIndex(p => fits(p, v)); if (b >= 0) return { type: 'build', b, src }; }
  // 4) Discard: highest card, onto a pile whose top is one higher (or an empty pile, or the lowest top).
  const h = g.hands[s];
  if (!h.length) return { type: 'end' };
  const order = h.map((v, i) => ({ v: v === WILD ? -1 : v, i })).sort((a, b) => b.v - a.v);
  const pick = order[0];
  const ds = g.discards[s];
  let d = ds.findIndex(p => p.length && p[p.length - 1] === pick.v + 1);
  if (d < 0) d = ds.findIndex(p => !p.length);
  if (d < 0) d = ds.map((p, k) => ({ k, t: p[p.length - 1] })).sort((a, b) => a.t - b.t)[0].k;
  return { type: 'discard', d, i: pick.i };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, order: g.order, hand: g.hands[seat] || [], builds: g.builds.map(p => ({ n: p.length, top: p[p.length - 1] || null })),
    stockTop: g.order.map(s => [s, g.stocks[s][g.stocks[s].length - 1] ?? null]), stockN: g.stocks.map(x => x.length),
    discards: g.discards.map(ds => ds.map(d => d.slice(-4))), deck: g.deck.length, winner: g.winner ?? null, moveId: g.moveId,
  };
}

export const check = g => (g.deck.length + g.done.length + g.stocks.flat().length + g.hands.flat().length + g.discards.flat(2).length + g.builds.flat().length !== 162 ? 'count' : null);
