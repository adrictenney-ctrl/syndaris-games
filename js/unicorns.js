// Unicorn Chaos: build a stable of seven unicorns (six with six players) before anyone else.
// Everyone starts with a Baby Unicorn. Each turn: draw a card, then either play one card or
// draw another, then keep seven cards at most. Unicorns join your stable; Magic cards do one
// thing and are discarded; Upgrades sit in your stable and help you; Downgrades go in a rival's
// stable and hurt them. Whenever anyone plays a card, anyone holding "Hold Your Horses!" may
// cancel it — and that can be cancelled too. "Unbridled!" can't be stopped.
// Our own cards, names and art.

export const DEF = {
  baby: { t: 'unicorn', name: 'Baby Unicorn', ic: '🦄', baby: true, text: 'Starts in your stable' },
  basic: { t: 'unicorn', name: 'Unicorn', ic: '🦄', n: 20, text: 'Just a unicorn. A very good one.' },
  bright: { t: 'unicorn', name: 'Bright Unicorn', ic: '✨', n: 3, text: 'When it joins your stable, draw a card' },
  thief: { t: 'unicorn', name: 'Thief Unicorn', ic: '🦹', n: 2, text: 'When it joins, take a random card from a rival’s hand', target: 'player' },
  rampage: { t: 'unicorn', name: 'Rampage Unicorn', ic: '💢', n: 2, text: 'When it joins, destroy a unicorn', target: 'unicorn' },
  guardian: { t: 'unicorn', name: 'Guardian Unicorn', ic: '🛡️', n: 2, text: 'Can’t be destroyed' },
  shy: { t: 'unicorn', name: 'Shy Unicorn', ic: '🙈', n: 2, text: 'If it’s destroyed, it runs back to your hand' },
  llama: { t: 'unicorn', name: 'Llamacorn', ic: '🦙', n: 1, text: 'When it joins, every rival discards a random card' },
  cob: { t: 'unicorn', name: 'Corncob Unicorn', ic: '🌽', n: 2, text: 'When it joins, draw two cards, then discard one at random' },
  lasso: { t: 'magic', name: 'Lasso', ic: '🪢', n: 3, text: 'Take a unicorn from a rival’s stable', target: 'unicorn' },
  apple: { t: 'magic', name: 'Bad Apple', ic: '🍎', n: 3, text: 'Destroy a unicorn', target: 'unicorn' },
  twofer: { t: 'magic', name: 'Two for One', ic: '✌️', n: 2, text: 'Sacrifice one of your unicorns, destroy two', target: 'two' },
  sweep: { t: 'magic', name: 'Clean Sweep', ic: '🧹', n: 3, text: 'Destroy an Upgrade or remove a Downgrade', target: 'mod' },
  deal: { t: 'magic', name: 'Good Deal', ic: '🤝', n: 2, text: 'Draw three cards, then discard one at random' },
  kick: { t: 'magic', name: 'Back Kick', ic: '🦶', n: 3, text: 'Send a unicorn back to its owner’s hand', target: 'unicorn' },
  vortex: { t: 'magic', name: 'Whirlwind', ic: '🌪️', n: 1, text: 'Every player discards a random card; shuffle the discards into the deck' },
  aura: { t: 'up', name: 'Rainbow Aura', ic: '🌈', n: 1, text: 'Your unicorns can’t be destroyed' },
  dutch: { t: 'up', name: 'Double Trouble', ic: '⚡', n: 1, text: 'You may play two cards each turn' },
  charm: { t: 'up', name: 'Lucky Horseshoe', ic: '🧲', n: 2, text: 'Draw an extra card at the start of your turn' },
  gate: { t: 'up', name: 'Locked Gate', ic: '🔒', n: 1, text: 'Your unicorns can’t be taken' },
  fence: { t: 'down', name: 'Broken Fence', ic: '🚧', n: 1, text: 'You can’t play Upgrades' },
  slow: { t: 'down', name: 'Hoof Ache', ic: '🩹', n: 1, text: 'You can’t play Hold Your Horses!' },
  barbed: { t: 'down', name: 'Thorny Hedge', ic: '🌵', n: 1, text: 'Whenever a unicorn leaves your stable, discard a random card' },
  saddle: { t: 'down', name: 'Heavy Saddle', ic: '🪨', n: 2, text: 'Discard a random card at the start of your turn' },
  tiny: { t: 'down', name: 'Tiny Stable', ic: '🏚️', n: 1, text: 'You can only keep five unicorns' },
  neigh: { t: 'instant', name: 'Hold Your Horses!', ic: '✋', n: 14, text: 'Cancel a card someone is playing' },
  super: { t: 'instant', name: 'Unbridled!', ic: '🔥', n: 1, text: 'Cancel a card — and this can’t be cancelled' },
};
const BASIC_NAMES = ['Sunny', 'Glimmer', 'Biscuit', 'Comet', 'Pickles', 'Moonbeam', 'Sprinkles', 'Waffles', 'Stardust', 'Noodle', 'Bubbles', 'Marshmallow', 'Twinkle', 'Pudding', 'Zigzag', 'Velvet', 'Maple', 'Pebble', 'Dandelion', 'Fizz'];
const BASIC_HUE = [330, 280, 200, 160, 40, 20, 300, 260, 190, 120, 350, 220, 50, 100, 10, 240, 30, 180, 70, 310];

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export const CARDS = [];
(() => {
  let b = 0;
  for (const [k, d] of Object.entries(DEF)) for (let i = 0; i < (d.n || 0); i++) {
    const c = { id: CARDS.length, k };
    if (k === 'basic') { c.name = BASIC_NAMES[b] + ' Unicorn'; c.hue = BASIC_HUE[b]; b++; }
    CARDS.push(c);
  }
})();
const BABY_BASE = 1000;
export const card = id => (id >= BABY_BASE ? { id, k: 'baby', hue: (id - BABY_BASE) * 47 % 360 } : CARDS[id]);
export const def = id => DEF[card(id).k];
export const cardName = id => card(id).name || def(id).name;

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.goal = g.order.length >= 6 ? 6 : 7;
  g.deck = shuffle(CARDS.map(c => c.id));
  g.discard = [];
  g.hands = g.seats.map(() => []);
  g.stable = g.seats.map(() => []);    // unicorns
  g.mods = g.seats.map(() => []);      // upgrades and downgrades in that stable
  for (const s of g.order) { g.stable[s].push(BABY_BASE + s); for (let i = 0; i < 5; i++) g.hands[s].push(g.deck.pop()); }
  g.turn = g.order[Math.floor(Math.random() * g.order.length)];
  g.log = [];
  startTurn(g);
  return g;
}

const hasMod = (g, s, k) => g.mods[s].some(id => card(id).k === k);
const others = (g, s) => g.order.filter(x => x !== s);
function draw(g, s, n = 1) {
  for (let i = 0; i < n; i++) {
    if (!g.deck.length) { g.deck = shuffle(g.discard); g.discard = []; }
    if (g.deck.length) g.hands[s].push(g.deck.pop());
  }
}
function discardRandom(g, s) {
  const h = g.hands[s];
  if (!h.length) return;
  const [id] = h.splice(Math.floor(Math.random() * h.length), 1);
  g.discard.push(id);
}
const log = (g, text) => { g.log.push(text); if (g.log.length > 6) g.log.shift(); };

function startTurn(g) {
  const s = g.turn;
  g.phase = 'begin';
  if (hasMod(g, s, 'saddle')) discardRandom(g, s);
  if (hasMod(g, s, 'charm')) draw(g, s);
  draw(g, s);
  g.plays = 0;
  g.maxPlays = hasMod(g, s, 'dutch') ? 2 : 1;
  g.phase = 'action';
  g.pending = null;
  g.moveId++;
}

export function current(g) {
  if (g.phase === 'action' || g.phase === 'discard') return g.turn;
  return -1;
}

// Can `seat` cancel cards right now?
export const canNeigh = (g, s) => !hasMod(g, s, 'slow') && g.hands[s].some(id => def(id).t === 'instant');

// Validate a play; returns an error or null.
function checkPlay(g, s, id, a) {
  const d = def(id);
  if (d.t === 'instant') return 'Hold that for when someone plays a card';
  if (d.t === 'up' && hasMod(g, s, 'fence')) return 'Broken Fence: you can’t play Upgrades';
  if (d.t === 'down' && !others(g, s).includes(Number(a.player))) return 'Pick a rival’s stable';
  const owner = u => g.order.find(p => g.stable[p].includes(u));
  if (d.target === 'unicorn') {
    const u = Number(a.unicorn), o = owner(u);
    if (o == null) return 'Pick a unicorn';
    if (card(id).k === 'lasso' && (o === s || hasMod(g, o, 'gate'))) return o === s ? 'Pick a rival’s unicorn' : 'Their gate is locked';
    if (['apple', 'rampage'].includes(card(id).k) && !destroyable(g, o, u)) return 'That unicorn can’t be destroyed';
  }
  if (d.target === 'two') {
    const sac = Number(a.sac), ts = (a.targets || []).map(Number);
    if (!g.stable[s].includes(sac)) return 'Pick one of your unicorns to sacrifice';
    if (ts.length < 1 || ts.some(u => owner(u) == null || u === sac || !destroyable(g, owner(u), u))) return 'Pick unicorns to destroy';
  }
  if (d.target === 'mod') { if (!g.order.some(p => g.mods[p].includes(Number(a.mod)))) return 'Pick an Upgrade or Downgrade'; }
  if (d.target === 'player' && !others(g, s).includes(Number(a.player))) return 'Pick a rival';
  return null;
}
const destroyable = (g, o, u) => card(u).k !== 'guardian' && !hasMod(g, o, 'aura');

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (g.phase === 'respond') return respond(g, seat, a);
  if (seat !== current(g)) return "It isn't your turn";
  const h = g.hands[seat];
  if (g.phase === 'discard') {
    const ids = (a.ids || []).map(Number);
    if (a.type !== 'discard' || ids.length !== h.length - 7 || !ids.every(id => h.includes(id))) return `Discard ${h.length - 7}`;
    g.hands[seat] = h.filter(id => !ids.includes(id));
    g.discard.push(...ids);
    return nextTurn(g);
  }
  if (a.type === 'draw') {
    if (g.plays > 0) return 'You’ve already played';
    draw(g, seat);
    g.plays = g.maxPlays;
    return endTurn(g);
  }
  if (a.type === 'end') {
    if (g.plays === 0) return 'Play a card or draw one first';
    return endTurn(g);
  }
  if (a.type !== 'play') return "That move isn't allowed";
  if (g.plays >= g.maxPlays) return 'No plays left — end your turn';
  const id = Number(a.id);
  if (!h.includes(id)) return 'That card isn’t in your hand';
  const err = checkPlay(g, seat, id, a);
  if (err) return err;
  g.hands[seat] = h.filter(x => x !== id);
  g.plays++;
  g.pending = { seat, id, a, chain: [], asked: [] };
  announce(g, seat, `${def(id).ic} ${cardName(id)}`);
  openWindow(g);
  return null;
}

// Everyone who could cancel gets a few seconds to decide.
function openWindow(g) {
  const p = g.pending;
  const last = p.chain.length ? p.chain[p.chain.length - 1] : null;
  const actor = last ? last.seat : p.seat;
  if (last && last.super) return finishChain(g);
  p.waiting = g.order.filter(s => s !== actor && canNeigh(g, s));
  if (!p.waiting.length) return finishChain(g);
  g.phase = 'respond';
  g.respondUntil = Date.now() + 9000;
  g.moveId++;
}

function respond(g, seat, a) {
  const p = g.pending;
  if (!p.waiting.includes(seat)) return 'Nothing to answer';
  if (a.type === 'neigh') {
    const want = a.super || !g.hands[seat].some(y => card(y).k === 'neigh') ? 'super' : 'neigh';
    const id = g.hands[seat].find(x => card(x).k === want);
    if (id == null || hasMod(g, seat, 'slow')) return 'You can’t';
    g.hands[seat] = g.hands[seat].filter(x => x !== id);
    g.discard.push(id);
    p.chain.push({ seat, super: card(id).k === 'super' });
    announce(g, seat, card(id).k === 'super' ? 'Unbridled! 🔥' : 'Hold your horses! ✋');
    openWindow(g);
    return null;
  }
  if (a.type === 'pass') {
    p.waiting = p.waiting.filter(x => x !== seat);
    g.moveId++;
    if (!p.waiting.length) finishChain(g);
    return null;
  }
  return 'Cancel it, or let it be';
}

function finishChain(g) {
  const p = g.pending;
  const cancelled = p.chain.length % 2 === 1;
  g.pending = null;
  g.phase = 'action';
  g.moveId++;
  if (cancelled) { g.discard.push(p.id); log(g, `${cardName(p.id)} was stopped`); }
  else resolve(g, p.seat, p.id, p.a);
  if (g.phase === 'over') return;
  if (g.plays >= g.maxPlays) endTurn(g);
}

// ------------------------------------------------------------------ effects
function enter(g, s, u) {
  const cap = hasMod(g, s, 'tiny') ? 5 : 99;
  if (g.stable[s].length >= cap) { g.discard.push(u); return; }
  g.stable[s].push(u);
}
function leave(g, o, u) {
  g.stable[o] = g.stable[o].filter(x => x !== u);
  if (hasMod(g, o, 'barbed')) discardRandom(g, o);
}
function destroy(g, o, u) {
  if (!destroyable(g, o, u)) return;
  leave(g, o, u);
  if (u >= BABY_BASE) { log(g, 'A Baby Unicorn went home'); return; }
  if (card(u).k === 'shy') g.hands[o].push(u); else g.discard.push(u);
}
const ownerOf = (g, u) => g.order.find(p => g.stable[p].includes(u));

function resolve(g, s, id, a) {
  const k = card(id).k, d = DEF[k];
  if (d.t === 'unicorn') {
    enter(g, s, id);
    if (k === 'bright') draw(g, s);
    if (k === 'cob') { draw(g, s, 2); discardRandom(g, s); }
    if (k === 'llama') for (const o of others(g, s)) discardRandom(g, o);
    if (k === 'thief') { const t = Number(a.player); const h = g.hands[t]; if (h && h.length) { const [x] = h.splice(Math.floor(Math.random() * h.length), 1); g.hands[s].push(x); } }
    if (k === 'rampage') { const u = Number(a.unicorn), o = ownerOf(g, u); if (o != null) destroy(g, o, u); }
  } else if (d.t === 'up') g.mods[s].push(id);
  else if (d.t === 'down') g.mods[Number(a.player)].push(id);
  else {
    g.discard.push(id);
    const u = Number(a.unicorn), o = ownerOf(g, u);
    if (k === 'lasso' && o != null && o !== s && !hasMod(g, o, 'gate')) { leave(g, o, u); enter(g, s, u); }
    if (k === 'apple' && o != null) destroy(g, o, u);
    if (k === 'kick' && o != null) { leave(g, o, u); if (u >= BABY_BASE) g.stable[o].push(u); else g.hands[o].push(u); }
    if (k === 'twofer') { const sac = Number(a.sac); if (g.stable[s].includes(sac)) { leave(g, s, sac); if (sac < BABY_BASE) g.discard.push(sac); } for (const t of (a.targets || []).map(Number).slice(0, 2)) { const ot = ownerOf(g, t); if (ot != null) destroy(g, ot, t); } }
    if (k === 'sweep') { const m = Number(a.mod); for (const p of g.order) if (g.mods[p].includes(m)) { g.mods[p] = g.mods[p].filter(x => x !== m); g.discard.push(m); } }
    if (k === 'deal') { draw(g, s, 3); discardRandom(g, s); }
    if (k === 'vortex') { for (const p of g.order) discardRandom(g, p); g.deck = shuffle([...g.deck, ...g.discard]); g.discard = []; }
  }
  checkWin(g);
}

function checkWin(g) {
  for (const s of g.order) if (g.stable[s].length >= g.goal) { g.phase = 'over'; g.winner = s; announce(g, s, `${g.goal} unicorns! 🦄`); return true; }
  return false;
}

function endTurn(g) {
  if (g.phase === 'over') return null;
  if (g.hands[g.turn].length > 7) { g.phase = 'discard'; g.moveId++; return null; }
  return nextTurn(g);
}
function nextTurn(g) {
  g.turn = g.order[(g.order.indexOf(g.turn) + 1) % g.order.length];
  startTurn(g);
  return null;
}

// Waiting on people who might cancel: computer players decide quickly, humans get a few seconds.
export function tick(g, players) {
  if (g.phase !== 'respond') return null;
  const p = g.pending;
  const bot = p.waiting.find(s => players?.[s]?.bot);
  if (bot != null) return { ms: 700, run: () => applyAction(g, bot, botRespond(g, bot)) };
  return { ms: Math.max(0, g.respondUntil - Date.now()), run: () => { for (const s of p.waiting.slice()) if (g.phase === 'respond') applyAction(g, s, { type: 'pass' }); } };
}

// ------------------------------------------------------------------ computer player
function botRespond(g, s) {
  const p = g.pending;
  const last = p.chain.length ? p.chain[p.chain.length - 1].seat : p.seat;
  const d = def(p.id);
  const hurtsMe = (d.t === 'down' && Number(p.a.player) === s) || (d.target === 'unicorn' && ownerOf(g, Number(p.a.unicorn)) === s) || (d.target === 'two' && (p.a.targets || []).some(u => ownerOf(g, Number(u)) === s));
  const leaderPlays = g.stable[p.seat].length >= g.goal - 2 && d.t === 'unicorn';
  // Cancel things that hurt me or would nearly win the game for someone; counter-cancel when my own play was stopped.
  const mineStopped = p.seat === s && p.chain.length % 2 === 1;
  const want = p.chain.length % 2 === 0 ? (hurtsMe || leaderPlays) && last !== s : mineStopped;
  return want && Math.random() < 0.85 ? { type: 'neigh' } : { type: 'pass' };
}

export function botAction(g, s) {
  if (g.phase === 'discard') {
    const h = g.hands[s].slice().sort((x, y) => rank(y) - rank(x));
    return { type: 'discard', ids: h.slice(7) };
  }
  if (g.plays > 0 && g.plays >= g.maxPlays) return { type: 'end' };
  const h = g.hands[s];
  const rivals = others(g, s).sort((a, b) => g.stable[b].length - g.stable[a].length);
  const leader = rivals[0];
  const theirUni = (filter = () => true) => rivals.flatMap(o => g.stable[o].filter(u => filter(o, u)).map(u => ({ o, u })));
  const options = [];
  for (const id of h) {
    const k = card(id).k, d = DEF[k];
    if (d.t === 'instant') continue;
    let a = null, v = 0;
    if (d.t === 'unicorn') {
      if (hasMod(g, s, 'tiny') && g.stable[s].length >= 5) continue;
      a = { type: 'play', id };
      v = 5 + (k === 'bright' || k === 'cob' ? 1 : 0);
      if (k === 'thief') a.player = leader;
      if (k === 'rampage') { const t = theirUni((o, u) => destroyable(g, o, u))[0]; if (!t) continue; a.unicorn = t.u; v += 2; }
      if (g.stable[s].length + 1 >= g.goal) v += 50;
    } else if (d.t === 'up') { if (hasMod(g, s, 'fence') || hasMod(g, s, k)) continue; a = { type: 'play', id }; v = 3; }
    else if (d.t === 'down') { const t = rivals.find(o => !hasMod(g, o, k)); if (t == null) continue; a = { type: 'play', id, player: t }; v = 2 + g.stable[t].length * 0.3; }
    else if (k === 'lasso') { const t = theirUni((o) => !hasMod(g, o, 'gate'))[0]; if (!t) continue; a = { type: 'play', id, unicorn: t.u }; v = 7; }
    else if (k === 'apple' || k === 'kick') { const t = theirUni((o, u) => k === 'kick' || destroyable(g, o, u))[0]; if (!t) continue; a = { type: 'play', id, unicorn: t.u }; v = 4 + (g.stable[t.o].length >= g.goal - 2 ? 5 : 0); }
    else if (k === 'twofer') { const mine = g.stable[s].slice().sort((x, y) => (x >= BABY_BASE) - (y >= BABY_BASE))[0]; const ts = theirUni((o, u) => destroyable(g, o, u)).slice(0, 2); if (mine == null || ts.length < 2) continue; a = { type: 'play', id, sac: mine, targets: ts.map(t => t.u) }; v = 4; }
    else if (k === 'sweep') { const myDown = g.mods[s].find(m => def(m).t === 'down'); const theirUp = rivals.flatMap(o => g.mods[o].filter(m => def(m).t === 'up'))[0]; const m = myDown ?? theirUp; if (m == null) continue; a = { type: 'play', id, mod: m }; v = 3; }
    else if (k === 'deal' || k === 'vortex') { a = { type: 'play', id }; v = k === 'deal' ? 2.5 : 1; }
    if (a) options.push({ a, v: v + Math.random() });
  }
  options.sort((x, y) => y.v - x.v);
  if (options.length) return options[0].a;
  return g.plays === 0 ? { type: 'draw' } : { type: 'end' };
}
const rank = id => { const d = def(id); return d.t === 'instant' ? 8 : d.t === 'unicorn' ? 7 : d.t === 'magic' ? 5 : 3; };

export function viewFor(g, seat) {
  const p = g.pending;
  return {
    phase: g.phase, turn: g.turn, order: g.order, goal: g.goal, hand: g.hands[seat] || [], counts: g.hands.map(h => h.length),
    stable: g.stable, mods: g.mods, plays: g.plays, maxPlays: g.maxPlays, deck: g.deck.length, log: g.log,
    pending: p && { seat: p.seat, id: p.id, a: p.a, chain: p.chain, waiting: p.waiting, mine: p.waiting.includes(seat) }, respondIn: g.respondUntil ? g.respondUntil - Date.now() : 0,
    canNeigh: canNeigh(g, seat), hasSuper: (g.hands[seat] || []).some(id => card(id).k === 'super'), winner: g.winner ?? null, moveId: g.moveId,
  };
}
