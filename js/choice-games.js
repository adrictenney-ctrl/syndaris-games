// Secret-choice games: everyone decides on their own phone at the same moment, then the table
// reveals what happened. Lowest Unique, Split or Steal, Two-Thirds, Vulture Bids, Treasure Run,
// Ticker, Gala Auction, Three Fronts, Lemonade Stand, Fish Pond, Mystery Boxes, Standoff.
import { base, shuffle, pick, sfx, left, waiting, announce, finish } from './party.js?v=68';

const R = n => Math.floor(Math.random() * n);
// Shared shape: rounds of "everyone chooses" → reveal → next.
function simul(o) {
  const E = {};
  E.createGame = (settings, players) => {
    const g = base(settings, players, { rounds: o.rounds || 8, secs: o.secs || 30, ...(o.defaults || {}) });
    g.round = 0;
    o.init?.(g);
    start(g);
    return g;
  };
  const who = g => (o.who ? o.who(g) : g.order);
  function start(g) {
    g.round++;
    g.pick = {};
    g.done = {};
    o.round?.(g);
    if (g.phase === 'over') return;
    g.phase = 'choose';
    g.endAt = Date.now() + g.settings.secs * 1000;
    g.moveId++;
  }
  function reveal(g) {
    o.resolve(g);
    if (g.phase === 'over') return;
    g.phase = 'reveal';
    g.endAt = 0;
    g.revAt = Date.now();
    g.moveId++;
  }
  E.collecting = g => g.phase === 'choose';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'choose' ? waiting(g, who(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'choose') return 'Not now';
    if (!who(g).includes(seat)) return 'Not your decision this time';
    if (g.done[seat]) return 'Already locked in';
    const r = o.choose(g, seat, a);
    if (r === 'stage') { g.moveId++; return null; }
    if (r === undefined || typeof r === 'string') return r ?? 'Pick something';
    g.pick[seat] = r.v;
    g.done[seat] = true;
    if (!E.pending(g).length) reveal(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'choose') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => { o.timeout?.(g); reveal(g); } };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + (o.revealMs || 6500) - Date.now()), run: () => (o.isOver ? o.isOver(g) : g.round >= g.settings.rounds) ? (o.end ? o.end(g) : finish(g)) : start(g) };
    return null;
  };
  E.botAction = (g, seat) => o.bot(g, seat);
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'choose' ? left(g) : 0, hud: o.hud ? o.hud(g, seat) : [['Score', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
    if (g.phase === 'choose') v.ui = !who(g).includes(seat) ? { k: 'wait', title: o.idleTitle?.(g, seat) || 'Sit this one out', sub: 'Watch the table' }
      : g.done[seat] ? { k: 'wait', title: 'Locked in ✓', sub: `Waiting for ${E.pending(g).length} more…`, html: o.mine?.(g, seat) || '' }
        : { myturn: true, buzz: true, ...o.ui(g, seat) };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', ...o.after(g, seat) };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: o.final ? o.final(g, seat) : 'Look at the table to play again' };
    return v;
  };
  E.o = o;
  return E;
}
const numOpts = (from, to, extra = {}) => Array.from({ length: to - from + 1 }, (_, i) => ({ v: from + i, label: String(from + i), ...extra }));

// ---------------------------------------------------------------- Lowest Unique
export const lowestunique = simul({
  rounds: 10, secs: 20,
  init: g => { g.max = Math.max(10, g.order.length * 3); },
  ui: g => ({ k: 'pick', key: 'r' + g.round, title: 'Pick a number', sub: 'The lowest number that nobody else picks wins', grid: 5, options: numOpts(1, g.max) }),
  choose: (g, s, a) => (Number(a.v) >= 1 && Number(a.v) <= g.max ? { v: Number(a.v) } : 'Pick a number'),
  resolve(g) {
    const count = {};
    for (const v of Object.values(g.pick)) count[v] = (count[v] || 0) + 1;
    const uniq = Object.keys(count).filter(k => count[k] === 1).map(Number).sort((a, b) => a - b);
    g.win = uniq.length ? g.order.find(s => g.pick[s] === uniq[0]) : -1;
    g.counts = count;
    if (g.win >= 0) { g.score[g.win] += 1; announce(g, g.win, `${uniq[0]} — unique! +1`); sfx(g, 'ding'); } else sfx(g, 'sad');
  },
  bot: g => ({ type: 'pick', v: 1 + Math.floor(Math.random() ** 2 * g.max) }),
  after: (g, s) => ({ title: g.win === s ? '+1 — yours was the lowest unique!' : g.win >= 0 ? `@${g.win}@ wins with ${g.pick[g.win]}` : 'No unique number!', sub: `You picked ${g.pick[s] ?? '—'}` }),
});

// ---------------------------------------------------------------- Split or Steal
export const splitsteal = simul({
  rounds: 6, secs: 45,
  round(g) {
    const p = shuffle([...g.order]);
    g.pairs = [];
    while (p.length >= 2) g.pairs.push({ a: p.pop(), b: p.pop(), pot: 2 + R(9) * 2 });
    g.bye = p[0] ?? -1;
  },
  who: g => g.order.filter(s => s !== g.bye),
  idleTitle: () => 'You sit this round out',
  ui(g, s) { const P = g.pairs.find(x => x.a === s || x.b === s), o = P.a === s ? P.b : P.a; return { k: 'buttons', key: 'r' + g.round, title: `${P.pot} points with @${o}@`, sub: 'Talk it over… then choose in secret', card: { kicker: 'Your partner', big: `@${o}@` }, buttons: [{ type: 'pick', label: 'Split 🤝', go: true, payload: { v: 'split' } }, { type: 'pick', label: 'Steal 🗡️', payload: { v: 'steal' } }] }; },
  choose: (g, s, a) => (a.v === 'split' || a.v === 'steal' ? { v: a.v } : 'Split or steal?'),
  timeout(g) { for (const s of g.order) if (s !== g.bye && !g.pick[s]) g.pick[s] = 'split'; },
  resolve(g) {
    g.gain = {};
    for (const P of g.pairs) {
      const A = g.pick[P.a], B = g.pick[P.b];
      if (A === 'split' && B === 'split') { g.gain[P.a] = g.gain[P.b] = P.pot / 2; }
      else if (A === 'steal' && B === 'split') { g.gain[P.a] = P.pot; g.gain[P.b] = 0; }
      else if (B === 'steal' && A === 'split') { g.gain[P.b] = P.pot; g.gain[P.a] = 0; }
      else { g.gain[P.a] = g.gain[P.b] = 0; }
      g.score[P.a] += g.gain[P.a]; g.score[P.b] += g.gain[P.b];
    }
    sfx(g, 'chime');
  },
  bot: () => ({ type: 'pick', v: Math.random() < 0.6 ? 'split' : 'steal' }),
  after(g, s) { if (s === g.bye) return { title: 'You sat out', sub: '' }; const P = g.pairs.find(x => x.a === s || x.b === s), o = P.a === s ? P.b : P.a; return { title: `+${g.gain[s]}`, sub: `You: ${g.pick[s]} · @${o}@: ${g.pick[o]}` }; },
});

// ---------------------------------------------------------------- Two-Thirds
export const twothirds = simul({
  rounds: 8, secs: 30,
  ui: g => ({ k: 'fields', key: 'r' + g.round, title: 'Pick a number from 0 to 100', sub: 'Closest to TWO-THIRDS of everyone’s average wins', fields: [{ type: 'number', ph: '0–100', max: 3 }], submit: 'Lock it in', need: 1 }),
  choose(g, s, a) { const n = Number((a.vals || [])[0]); return Number.isFinite(n) && n >= 0 && n <= 100 && String((a.vals || [])[0]).trim() !== '' ? { v: Math.round(n) } : 'A whole number from 0 to 100'; },
  resolve(g) {
    const vals = Object.values(g.pick);
    g.avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    g.target = Math.round((g.avg * 2) / 3 * 10) / 10;
    const d = s => Math.abs(g.pick[s] - g.target);
    const best = Math.min(...Object.keys(g.pick).map(s => d(Number(s))));
    g.wins = g.order.filter(s => g.pick[s] != null && d(s) === best);
    for (const s of g.wins) g.score[s] += 3;
    sfx(g, 'chime');
  },
  bot: () => ({ type: 'answer', vals: [String(10 + R(40))] }),
  after: (g, s) => ({ title: g.wins.includes(s) ? '🎯 +3 — closest!' : 'Not this time', sub: `Average ${g.avg.toFixed(1)} · target ${g.target} · you said ${g.pick[s] ?? '—'}` }),
});

// ---------------------------------------------------------------- Vulture Bids (Raj)
export const PRIZES = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const vulturebids = simul({
  rounds: 15, secs: 25,
  init(g) { g.deck = shuffle([...PRIZES]); g.hand = g.seats.map(x => (x ? Array.from({ length: 15 }, (_, i) => i + 1) : [])); g.carry = []; },
  round(g) { g.prize = g.deck.pop(); },
  ui: (g, s) => ({ k: 'pick', key: 'r' + g.round, cards: true, grid: 5, title: g.prize > 0 ? `Bid for +${g.prize + g.carry.reduce((a, b) => a + b, 0)}` : `Avoid ${g.prize}!`, sub: g.prize > 0 ? 'Highest card nobody else played wins it' : 'LOWEST card nobody else played is stuck with it',
    options: g.hand[s].map(c => ({ v: c, label: String(c), cls: 'vb-card' })) }),
  choose: (g, s, a) => (g.hand[s].includes(Number(a.v)) ? { v: Number(a.v) } : 'Play one of your cards'),
  timeout(g) { for (const s of g.order) if (g.pick[s] == null) g.pick[s] = g.hand[s][0]; },
  resolve(g) {
    for (const s of g.order) g.hand[s].splice(g.hand[s].indexOf(g.pick[s]), 1);
    const count = {};
    for (const v of Object.values(g.pick)) count[v] = (count[v] || 0) + 1;
    const uniq = g.order.filter(s => count[g.pick[s]] === 1).sort((a, b) => g.pick[a] - g.pick[b]);
    const value = g.prize + g.carry.reduce((a, b) => a + b, 0);
    if (!uniq.length) { g.carry.push(g.prize); g.taker = -1; sfx(g, 'sad'); return; }
    g.taker = g.prize > 0 ? uniq[uniq.length - 1] : uniq[0];
    g.score[g.taker] += value;
    g.carry = [];
    announce(g, g.taker, `${value > 0 ? '+' : ''}${value}`);
    sfx(g, value > 0 ? 'ding' : 'sad');
  },
  isOver: g => !g.deck.length,
  bot: (g, s) => ({ type: 'pick', v: g.prize > 0 ? g.hand[s][Math.max(0, Math.min(g.hand[s].length - 1, Math.floor(((g.prize + 5) / 15) * g.hand[s].length + R(3) - 1)))] : g.hand[s][R(Math.min(3, g.hand[s].length))] }),
  after: (g, s) => ({ title: g.taker === s ? `You take ${g.prize}${g.prize > 0 ? ' 🎉' : ' 😖'}` : g.taker < 0 ? 'All tied — it carries over!' : `@${g.taker}@ takes it`, sub: `You played ${g.pick[s]}` }),
  hud: (g, s) => [['Score', g.score[s] ?? 0], ['Prizes left', g.deck.length]],
});

// ---------------------------------------------------------------- Treasure Run (push your luck in a cave)
export const HAZARDS = ['🕷️', '🐍', '🔥', '🪨', '💀'];
export const treasurerun = simul({
  rounds: 5, secs: 20, revealMs: 3500,
  init(g) { g.bank = g.seats.map(() => 0); g.removed = []; g.cave = 0; },
  round(g) {
    // A new step into the cave (or a new expedition when everyone's out).
    if (!g.inside || !g.inside.length || g.collapsed) {
      g.cave++;
      if (g.cave > g.settings.rounds) { end(g); return; }
      const deck = [...[1, 2, 3, 4, 5, 5, 7, 7, 9, 11, 11, 13, 14, 15, 17].map(n => ({ gems: n })), ...HAZARDS.flatMap(h => (g.removed.includes(h) ? [h, h] : [h, h, h]).map(x => ({ hazard: x })))];
      g.deck = shuffle(deck);
      g.inside = [...g.order];
      g.carry = g.seats.map(() => 0);
      g.path = [];
      g.leftover = 0;
      g.collapsed = false;
    }
    const c = g.deck.pop();
    g.path.push(c);
    if (c.gems) { const each = Math.floor(c.gems / g.inside.length); g.inside.forEach(s => { g.carry[s] += each; }); c.left = c.gems - each * g.inside.length; g.leftover += c.left; sfx(g, 'ding'); }
    else if (g.path.filter(p => p.hazard === c.hazard).length >= 2) {
      g.collapsed = c.hazard; g.removed.push(c.hazard); g.inside.forEach(s => { g.carry[s] = 0; });
      announce(g, -1, `${c.hazard} The cave collapses!`); sfx(g, 'buzzer');
      g.inside = [];
    } else sfx(g, 'thud');
  },
  who: g => g.inside,
  idleTitle: g => (g.collapsed ? 'The cave collapsed!' : 'You’re safe outside'),
  ui: (g, s) => ({ k: 'buttons', key: 'r' + g.round, title: `Carrying 💎 ${g.carry[s]}`, sub: `Banked: ${g.bank[s]} · go deeper or head home?`, buttons: [{ type: 'pick', label: 'Head home 🏕️', payload: { v: 'leave' } }, { type: 'pick', label: 'Go deeper 🔦', go: true, payload: { v: 'stay' } }] }),
  choose: (g, s, a) => (a.v === 'leave' || a.v === 'stay' ? { v: a.v } : 'Stay or leave?'),
  timeout(g) { for (const s of g.inside) if (!g.pick[s]) g.pick[s] = 'stay'; },
  resolve(g) {
    const leavers = g.inside.filter(s => g.pick[s] === 'leave');
    if (leavers.length) {
      const share = Math.floor(g.leftover / leavers.length);
      g.leftover -= share * leavers.length;
      for (const s of leavers) { g.bank[s] += g.carry[s] + share; g.carry[s] = 0; }
      g.inside = g.inside.filter(s => !leavers.includes(s));
    }
    g.left = leavers;
    g.order.forEach(s => { g.score[s] = g.bank[s]; });
  },
  isOver: g => g.cave > g.settings.rounds,
  bot: (g, s) => ({ type: 'pick', v: g.carry[s] > 6 + R(10) || g.path.some(p => p.hazard) && Math.random() < 0.3 ? 'leave' : 'stay' }),
  after: (g, s) => ({ title: g.left.includes(s) ? `Home safe with 💎 ${g.bank[s]}` : g.inside.includes(s) ? 'Deeper we go…' : 'Watching', sub: g.left.length ? `Left: ${g.left.map(x => `@${x}@`).join(', ')}` : 'Nobody left' }),
  hud: (g, s) => [['Banked 💎', g.bank[s] ?? 0], ['Expedition', `${Math.min(g.cave, g.settings.rounds)}/${g.settings.rounds}`]],
});
function end(g) { g.order.forEach(s => { g.score[s] = g.bank[s]; }); finish(g); }
// Treasure Run's own "next" logic: keep stepping while anyone is inside.
treasurerun.tick = g => {
  if (g.phase === 'choose') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => { treasurerun.o.timeout(g); treasurerun.o.resolve(g); g.phase = 'reveal'; g.revAt = Date.now(); g.moveId++; } };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 3500 - Date.now()), run: () => stepCave(g) };
  return null;
};
function stepCave(g) {
  g.round++;
  g.pick = {}; g.done = {};
  treasurerun.o.round(g);
  if (g.phase === 'over') return;
  if (!g.inside.length) { g.phase = 'reveal'; g.revAt = Date.now(); g.moveId++; return; }
  g.phase = 'choose'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++;
}
treasurerun.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'choose') return 'Not now';
  if (!g.inside.includes(seat)) return 'You’re not in the cave';
  if (g.done[seat]) return 'Already decided';
  if (a.v !== 'stay' && a.v !== 'leave') return 'Stay or leave?';
  g.pick[seat] = a.v; g.done[seat] = true;
  if (!waiting(g, g.inside).length) { treasurerun.o.resolve(g); g.phase = 'reveal'; g.revAt = Date.now(); }
  g.moveId++;
  return null;
};

// ---------------------------------------------------------------- Ticker (stock market with private tips)
export const STOCKS = [{ n: 'Rocket Rides', t: 'RKT' }, { n: 'Cozy Cafés', t: 'CAF' }, { n: 'Green Gadgets', t: 'GRN' }, { n: 'Pixel Pets', t: 'PET' }];
export const ticker = simul({
  rounds: 8, secs: 40,
  init(g) { g.price = [20, 20, 20, 20]; g.cash = g.seats.map(() => 100); g.shares = g.seats.map(() => [0, 0, 0, 0]); g.hist = [[...g.price]]; },
  round(g) {
    g.move = STOCKS.map(() => [-6, -4, -2, 0, 2, 4, 6, 8][R(8)] * (Math.random() < 0.5 ? 1 : 1));
    g.tip = g.seats.map(() => R(4));
  },
  ui(g, s) {
    const t = g.tip[s], dir = g.move[t] > 0 ? 'go UP' : g.move[t] < 0 ? 'go DOWN' : 'stay flat';
    return { k: 'pick', key: 'r' + g.round, title: `Tip: ${STOCKS[t].t} will ${dir} 🤫`, sub: `Cash 💵 ${g.cash[s]} · one trade per round`, card: { kicker: 'Your portfolio', list: STOCKS.map((x, i) => `${x.t} ${g.shares[s][i]} shares @ ${g.price[i]}`) },
      options: [...STOCKS.map((x, i) => ({ v: `b${i}`, label: `Buy ${x.t}`, sub: `${Math.min(10, Math.floor(g.cash[s] / g.price[i]))} shares`, dis: g.cash[s] < g.price[i] })), ...STOCKS.map((x, i) => ({ v: `s${i}`, label: `Sell ${x.t}`, sub: `${g.shares[s][i]} shares`, dis: !g.shares[s][i] })), { v: 'h', label: 'Hold', sub: 'do nothing' }], grid: 2 };
  },
  choose: (g, s, a) => (/^(b[0-3]|s[0-3]|h)$/.test(String(a.v)) ? { v: String(a.v) } : 'Pick a trade'),
  resolve(g) {
    // Trades at today's price, then the market moves (plus a little push from buyers and sellers).
    const push = [0, 0, 0, 0];
    for (const s of g.order) {
      const p = g.pick[s];
      if (!p || p === 'h') continue;
      const i = Number(p[1]);
      if (p[0] === 'b') { const n = Math.min(10, Math.floor(g.cash[s] / g.price[i])); g.cash[s] -= n * g.price[i]; g.shares[s][i] += n; push[i] += n > 0 ? 1 : 0; }
      else { g.cash[s] += g.shares[s][i] * g.price[i]; push[i] -= g.shares[s][i] > 0 ? 1 : 0; g.shares[s][i] = 0; }
    }
    g.price = g.price.map((p, i) => Math.max(1, p + g.move[i] + push[i]));
    g.hist.push([...g.price]);
    g.order.forEach(s => { g.score[s] = g.cash[s] + g.shares[s].reduce((t, n, i) => t + n * g.price[i], 0); });
    sfx(g, 'chime');
  },
  bot(g, s) { const t = g.tip[s]; return g.move[t] > 0 && g.cash[s] >= g.price[t] ? { type: 'pick', v: `b${t}` } : g.move[t] < 0 && g.shares[s][t] ? { type: 'pick', v: `s${t}` } : { type: 'pick', v: 'h' }; },
  after: (g, s) => ({ title: `Worth 💵 ${g.score[s]}`, sub: STOCKS.map((x, i) => `${x.t} ${g.price[i]}`).join(' · ') }),
  hud: (g, s) => [['Worth', g.score[s] || 100], ['Day', `${g.round}/${g.settings.rounds}`]],
});

// ---------------------------------------------------------------- Gala Auction (sealed bids with money cards)
export const MONEY = [1, 2, 3, 4, 6, 8, 10, 12, 15, 20, 25];
export const ITEMS = [{ n: '🖼️ Painting', v: 1 }, { n: '🏺 Vase', v: 2 }, { n: '💍 Ring', v: 3 }, { n: '🛥️ Yacht', v: 4 }, { n: '🐎 Racehorse', v: 5 }, { n: '🏰 Castle', v: 6 }, { n: '✈️ Jet', v: 7 }, { n: '🏝️ Island', v: 8 }, { n: '💎 Diamond', v: 9 }, { n: '🎻 Violin', v: 10 }, { n: '🦢 Swan', x: 2 }, { n: '🌟 Fame', x: 2 }, { n: '🍷 Scandal', v: -5 }];
export const galaauction = simul({
  rounds: 13, secs: 30,
  init(g) { g.deck = shuffle(ITEMS.map((_, i) => i)); g.money = g.seats.map(x => (x ? [...MONEY] : [])); g.won = g.seats.map(() => []); },
  round(g) { g.item = g.deck.pop(); },
  ui(g, s) { const I = ITEMS[g.item]; const bad = I.v < 0; return { k: 'pick', key: 'r' + g.round, cards: true, grid: 4, title: bad ? `Avoid the ${I.n}!` : `Bid for the ${I.n}`, sub: bad ? 'LOWEST bid is stuck with it — but everyone else pays' : `Highest card wins it (and spends it) · ${I.x ? 'doubles your total!' : `worth ${I.v}`}`, options: g.money[s].map(m => ({ v: m, label: String(m), cls: 'vb-card money' })) }; },
  choose: (g, s, a) => (g.money[s].includes(Number(a.v)) ? { v: Number(a.v) } : 'Bid one of your money cards'),
  timeout(g) { for (const s of g.order) if (g.pick[s] == null) g.pick[s] = g.money[s][0]; },
  resolve(g) {
    const I = ITEMS[g.item], bad = I.v < 0;
    const sorted = [...g.order].sort((a, b) => g.pick[a] - g.pick[b] || a - b);
    g.taker = bad ? sorted[0] : sorted[sorted.length - 1];
    // Winner of a good item pays their card; for the Scandal, everyone EXCEPT the taker pays.
    for (const s of g.order) if (bad ? s !== g.taker : s === g.taker) g.money[s].splice(g.money[s].indexOf(g.pick[s]), 1);
    g.won[g.taker].push(g.item);
    g.order.forEach(s => { g.score[s] = value(g, s); });
    announce(g, g.taker, I.n);
    sfx(g, bad ? 'sad' : 'ding');
  },
  isOver: g => !g.deck.length || g.order.some(s => !g.money[s].length),
  end(g) {
    // The poorest player (least money left) can't win.
    const cash = s => g.money[s].reduce((a, b) => a + b, 0);
    const poorest = Math.min(...g.order.map(cash));
    g.broke = g.order.filter(s => cash(s) === poorest);
    const pool = g.order.filter(s => !g.broke.includes(s)), P = pool.length ? pool : g.order;
    const top = Math.max(...P.map(s => g.score[s]));
    g.winners = P.filter(s => g.score[s] === top); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++;
  },
  bot: (g, s) => { const m = g.money[s], I = ITEMS[g.item]; return { type: 'pick', v: I.v < 0 ? m[m.length > 2 ? 1 : 0] : m[Math.min(m.length - 1, Math.floor(Math.random() * m.length * ((I.v || 8) / 10)))] }; },
  after: (g, s) => ({ title: g.taker === s ? `You take the ${ITEMS[g.item].n}` : `@${g.taker}@ takes the ${ITEMS[g.item].n}`, sub: `You bid ${g.pick[s]} · money left ${g.money[s].reduce((a, b) => a + b, 0)}` }),
  final: (g, s) => (g.broke?.includes(s) ? 'You spent the most — the poorest can’t win!' : `Your collection: ${g.score[s]}`),
  hud: (g, s) => [['Collection', g.score[s] ?? 0], ['Money left', g.money[s]?.reduce((a, b) => a + b, 0) ?? 0]],
});
const value = (g, s) => { let v = 0, x = 1; for (const i of g.won[s]) { if (ITEMS[i].x) x *= ITEMS[i].x; else v += ITEMS[i].v; } return v * x; };

// ---------------------------------------------------------------- Three Fronts (split your troops)
export const threefronts = simul({
  rounds: 6, secs: 45,
  ui: g => ({ k: 'fields', key: 'r' + g.round, title: 'Split 10 troops across 3 fronts', sub: 'Win more fronts than an opponent to beat them', fields: [{ label: '⛰️ North', type: 'number', ph: '0' }, { label: '🌊 Coast', type: 'number', ph: '0' }, { label: '🌲 Forest', type: 'number', ph: '0' }], submit: 'Deploy', need: 3, needMsg: 'Fill in all three (0 is fine)' }),
  choose(g, s, a) { const v = (a.vals || []).slice(0, 3).map(x => Math.max(0, Math.floor(Number(x) || 0))); if (v.length < 3 || v.reduce((x, y) => x + y, 0) !== 10) return 'The three numbers must add up to 10'; return { v }; },
  timeout(g) { for (const s of g.order) if (!g.pick[s]) g.pick[s] = [4, 3, 3]; },
  resolve(g) {
    g.gain = {};
    for (const s of g.order) g.gain[s] = 0;
    for (const a of g.order) for (const b of g.order) {
      if (a >= b) continue;
      let wa = 0, wb = 0;
      for (let i = 0; i < 3; i++) { if (g.pick[a][i] > g.pick[b][i]) wa++; else if (g.pick[b][i] > g.pick[a][i]) wb++; }
      if (wa > wb) g.gain[a]++; else if (wb > wa) g.gain[b]++;
    }
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime');
  },
  bot: () => { const a = R(8), b = R(11 - a); return { type: 'answer', vals: [a, b, 10 - a - b].map(String) }; },
  after: (g, s) => ({ title: `Beat ${g.gain[s]} opponent${g.gain[s] === 1 ? '' : 's'}`, sub: `You sent ${g.pick[s].join(' / ')}` }),
});

// ---------------------------------------------------------------- Lemonade Stand
export const WEATHER = [{ n: '☀️ Hot', d: 90 }, { n: '🌤️ Sunny', d: 70 }, { n: '⛅ Cloudy', d: 45 }, { n: '🌧️ Rainy', d: 20 }];
export const lemonade = simul({
  rounds: 7, secs: 40,
  init(g) { g.money = g.seats.map(() => 20); g.logd = []; },
  round(g) { g.wx = R(4); g.forecast = Math.random() < 0.7 ? g.wx : R(4); },
  ui: (g, s) => ({ k: 'fields', key: 'r' + g.round, title: `Forecast: ${WEATHER[g.forecast].n}`, sub: `Cash $${g.money[s]} · cups cost $1 to make · price $1–$5`, fields: [{ label: 'Cups to make', type: 'number', ph: '0' }, { label: 'Price per cup ($)', type: 'number', ph: '1–5' }], submit: 'Open the stand', need: 2 }),
  choose(g, s, a) { const cups = Math.floor(Number(a.vals?.[0])), price = Math.floor(Number(a.vals?.[1])); if (!(cups >= 0 && cups <= g.money[s])) return `Make between 0 and ${g.money[s]} cups`; if (!(price >= 1 && price <= 5)) return 'Price must be $1 to $5'; return { v: [cups, price] }; },
  timeout(g) { for (const s of g.order) if (!g.pick[s]) g.pick[s] = [0, 2]; },
  resolve(g) {
    // Customers come by the weather; each picks a stand, preferring cheaper ones; a stand sells up to its cups.
    const W = WEATHER[g.wx];
    let crowd = Math.round(W.d * (0.8 + Math.random() * 0.4) * Math.max(1, g.order.length / 3));
    const sold = Object.fromEntries(g.order.map(s => [s, 0]));
    const open = () => g.order.filter(s => g.pick[s][0] > sold[s]);
    while (crowd > 0 && open().length) {
      const o = open(), w = o.map(s => 1 / g.pick[s][1] ** 2), t = w.reduce((a, b) => a + b, 0);
      let r = Math.random() * t, i = 0;
      while (r > w[i]) r -= w[i++];
      const s = o[Math.min(i, o.length - 1)];
      // Pricey lemonade puts some people off altogether.
      if (Math.random() < 1 - (g.pick[s][1] - 1) * 0.12) sold[s]++;
      crowd--;
    }
    g.sold = sold;
    g.profit = {};
    for (const s of g.order) { const [c, p] = g.pick[s]; g.profit[s] = sold[s] * p - c; g.money[s] += g.profit[s]; g.score[s] = g.money[s]; }
    sfx(g, 'chime');
  },
  bot: (g, s) => ({ type: 'answer', vals: [String(Math.min(g.money[s], [25, 18, 10, 5][g.forecast] + R(5))), String(2 + R(2))] }),
  after: (g, s) => ({ title: `${g.profit[s] >= 0 ? '+' : ''}$${g.profit[s]} today`, sub: `It was ${WEATHER[g.wx].n} · sold ${g.sold[s]} of ${g.pick[s][0]} at $${g.pick[s][1]}` }),
  hud: (g, s) => [['Cash', `$${g.money[s] ?? 0}`], ['Day', `${g.round}/${g.settings.rounds}`]],
});

// ---------------------------------------------------------------- Fish Pond (share the lake — or empty it)
export const fishpond = simul({
  rounds: 10, secs: 25,
  init(g) { g.fish = 8 * g.order.length; g.cap = g.fish; },
  ui: (g, s) => ({ k: 'pick', key: 'r' + g.round, title: `The pond has ${g.fish} fish`, sub: 'How many do you take? If everyone takes too many, the pond is ruined', grid: 6, big: true, options: numOpts(0, 5) }),
  choose: (g, s, a) => (Number(a.v) >= 0 && Number(a.v) <= 5 ? { v: Number(a.v) } : 'Pick 0 to 5'),
  timeout(g) { for (const s of g.order) if (g.pick[s] == null) g.pick[s] = 2; },
  resolve(g) {
    const want = g.order.reduce((t, s) => t + g.pick[s], 0);
    g.want = want;
    if (want <= g.fish) { for (const s of g.order) g.score[s] += g.pick[s]; g.fish -= want; g.collapsed = false; }
    else { const f = g.fish / want; for (const s of g.order) g.score[s] += Math.floor(g.pick[s] * f); g.fish = 0; g.collapsed = true; announce(g, -1, '🎣 The pond is empty!'); }
    g.before = g.fish;
    if (!g.collapsed) g.fish = Math.min(g.cap, Math.round(g.fish * 1.5));
    sfx(g, g.collapsed ? 'sad' : 'ding');
  },
  isOver: g => g.collapsed || g.round >= g.settings.rounds,
  bot: g => ({ type: 'pick', v: Math.random() < 0.7 ? 2 : 3 + R(3) }),
  after: (g, s) => ({ title: `You caught ${g.pick[s]}`, sub: g.collapsed ? 'Too greedy — the pond is ruined and the season ends' : `Everyone took ${g.want} · the pond grows back to ${g.fish}` }),
  hud: (g, s) => [['Fish', g.score[s] ?? 0], ['Pond', g.fish]],
});

// ---------------------------------------------------------------- Mystery Boxes (private hints, sealed bids)
export const mysteryboxes = simul({
  rounds: 6, secs: 40,
  init(g) { g.coins = g.seats.map(() => 60); },
  round(g) {
    g.box = [0, 1, 2].map(() => [0, 5, 10, 15, 20, 30, 40, 60][R(8)]);
    // Each player gets a secret hint about one box: either its exact value or "more/less than X".
    g.hint = g.seats.map(() => { const b = R(3), v = g.box[b]; return Math.random() < 0.5 ? { b, t: `Box ${'ABC'[b]} holds exactly ${v}` } : { b, t: `Box ${'ABC'[b]} holds ${v >= 20 ? 'at least 20' : 'less than 20'}` }; });
  },
  ui: (g, s) => ({ k: 'fields', key: 'r' + g.round, title: `🤫 ${g.hint[s].t}`, sub: `You have ${g.coins[s]} coins · bid on ONE box (highest bid wins it)`, fields: [{ label: 'Box (A, B or C)', ph: 'A', max: 1 }, { label: 'Your bid', type: 'number', ph: '0' }], submit: 'Seal the bid', need: 2 }),
  choose(g, s, a) { const b = 'ABC'.indexOf(String(a.vals?.[0] || '').trim().toUpperCase()), n = Math.floor(Number(a.vals?.[1])); if (b < 0) return 'Box A, B or C'; if (!(n >= 0 && n <= g.coins[s])) return `Bid 0 to ${g.coins[s]}`; return { v: [b, n] }; },
  timeout(g) { for (const s of g.order) if (!g.pick[s]) g.pick[s] = [0, 0]; },
  resolve(g) {
    g.winners3 = [0, 1, 2].map(b => { const bids = g.order.filter(s => g.pick[s][0] === b && g.pick[s][1] > 0).sort((x, y) => g.pick[y][1] - g.pick[x][1]); return bids[0] ?? -1; });
    g.winners3.forEach((s, b) => { if (s >= 0) { g.coins[s] += g.box[b] - g.pick[s][1]; } });
    g.order.forEach(s => { g.score[s] = g.coins[s]; });
    sfx(g, 'chime');
  },
  bot(g, s) { const h = g.hint[s], v = /exactly (\d+)/.exec(h.t); const worth = v ? Number(v[1]) : /at least/.test(h.t) ? 30 : 8; return { type: 'answer', vals: ['ABC'[h.b], String(Math.max(0, Math.min(g.coins[s], worth - 3 - R(5))))] }; },
  after: (g, s) => { const b = g.winners3.indexOf(s); return { title: b >= 0 ? `You won box ${'ABC'[b]}: ${g.box[b]} for ${g.pick[s][1]}` : 'Outbid or no bid', sub: `Boxes held ${g.box.join(' · ')}` }; },
  hud: (g, s) => [['Coins', g.coins[s] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]],
});

// ---------------------------------------------------------------- Standoff (aim, load, maybe duck)
export const standoff = simul({
  rounds: 8, secs: 35, revealMs: 7000,
  init(g) { g.bangs = g.seats.map(() => 3); g.wounds = g.seats.map(() => 0); },
  round(g) { g.loot = shuffle([5, 5, 10, 10, 15, 20, 0, 30]).slice(0, Math.max(3, g.order.length)); g.aim = {}; },
  who: g => g.order.filter(s => g.wounds[s] < 3),
  idleTitle: () => 'You’re out of the game 🪦',
  ui(g, s) {
    if (g.aim[s] == null) return { k: 'pick', key: 'r' + g.round + 'a', title: 'Who are you aiming at?', sub: 'Everyone reveals at once', options: g.order.filter(x => x !== s && g.wounds[x] < 3).map(x => ({ v: x, dot: x, label: `@${x}@`, sub: `${g.wounds[x]} wound${g.wounds[x] === 1 ? '' : 's'}` })) };
    return { k: 'buttons', key: 'r' + g.round + 'b', title: `Aiming at @${g.aim[s]}@ — loaded?`, sub: `${g.bangs[s]} real bullet${g.bangs[s] === 1 ? '' : 's'} left`, buttons: [{ type: 'pick', label: '💥 BANG (real)', go: true, dis: !g.bangs[s], payload: { v: 'bang' } }, { type: 'pick', label: '🔫 click (bluff)', payload: { v: 'click' } }] };
  },
  choose(g, s, a) {
    if (g.aim[s] == null) { const t = Number(a.v); if (!g.order.includes(t) || t === s || g.wounds[t] >= 3) return 'Aim at another player'; g.aim[s] = t; return 'stage'; }
    if (a.v === 'bang' && !g.bangs[s]) return 'No bullets left — bluff!';
    return a.v === 'bang' || a.v === 'click' ? { v: a.v } : 'Bang or click?';
  },
  timeout(g) { const P = standoff.o.who(g); for (const s of P) { if (g.aim[s] == null) g.aim[s] = P.find(x => x !== s); if (!g.pick[s]) g.pick[s] = 'click'; } },
  resolve(g) {
    const P = standoff.o.who(g);
    g.hit = [];
    for (const s of P) if (g.pick[s] === 'bang') { g.bangs[s]--; if (!g.hit.includes(g.aim[s])) g.hit.push(g.aim[s]); }
    for (const s of g.hit) g.wounds[s]++;
    // The loot is shared, card by card, among those still standing this round.
    const share = P.filter(s => !g.hit.includes(s));
    g.got = Object.fromEntries(g.order.map(s => [s, 0]));
    g.loot.forEach((c, i) => { if (share.length) g.got[share[i % share.length]] += c; });
    for (const s of g.order) g.score[s] += g.got[s];
    if (g.hit.length) { sfx(g, 'buzzer'); announce(g, -1, `💥 ${g.hit.length} hit!`); } else sfx(g, 'chime');
  },
  isOver: g => g.round >= g.settings.rounds || standoff.o.who(g).length <= 1,
  bot(g, s) {
    if (g.aim[s] == null) { const t = g.order.filter(x => x !== s && g.wounds[x] < 3); return { type: 'pick', v: t[R(t.length)] }; }
    return { type: 'pick', v: g.bangs[s] && Math.random() < 0.4 ? 'bang' : 'click' };
  },
  after: (g, s) => ({ title: g.hit.includes(s) ? `💥 You were hit! (${g.wounds[s]}/3)` : `+${g.got[s]} loot`, sub: `You aimed at @${g.aim[s]}@ with a ${g.pick[s] || 'click'}` }),
  hud: (g, s) => [['Loot', g.score[s] ?? 0], ['Bullets', '💥'.repeat(g.bangs[s] || 0) || '—'], ['Wounds', '🩸'.repeat(g.wounds[s] || 0) || '—']],
});
