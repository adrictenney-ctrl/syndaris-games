// Skyline: a property-trading board game. Buy lots in the city's eight districts, own a
// whole district to raise floors (four, then a tower), collect rent, trade, and keep out of
// Prison. The last player still solvent wins — or, with a round limit, the richest.
//
// The board is a loop of 36 squares (corners at 0, 9, 18, 27).

export const CORNER = { 0: 'payday', 9: 'prison', 18: 'garden', 27: 'arrest' };

export const DISTRICTS = [
  { name: 'Harbor Row', color: '#5f7183', build: 50 },
  { name: 'Old Mill', color: '#b08d52', build: 50 },
  { name: 'Garden Quarter', color: '#6f8f6a', build: 100 },
  { name: 'Lantern Lane', color: '#b06d4a', build: 100 },
  { name: 'Museum Mile', color: '#7f557c', build: 150 },
  { name: 'The Exchange', color: '#2f7a78', build: 150 },
  { name: 'Crown Heights', color: '#8c3441', build: 200 },
  { name: 'Summit Park', color: '#c4a050', build: 200 },
];

const L = (d, name, price) => ({ kind: 'lot', d, name, price });
const M = name => ({ kind: 'metro', name, price: 200 });
const U = name => ({ kind: 'utility', name, price: 150 });
const F = () => ({ kind: 'fortune', name: 'Fortune' });

export const BOARD = [
  { kind: 'payday', name: 'Payday' },
  L(0, 'Pier Street', 60), F(), L(0, 'Lighthouse Walk', 80), { kind: 'tax', name: 'City Levy', amount: 150 },
  M('Northgate Station'), L(1, 'Millrace Road', 100), L(1, 'Grain Yard', 100), L(1, "Weaver's Court", 120),
  { kind: 'prison', name: 'Prison' },
  L(2, 'Rose Terrace', 140), U('Power Grid'), L(2, 'Arbor Close', 140), L(2, 'Orchard Way', 160),
  M('Eastbank Station'), L(3, 'Lamplight Alley', 180), L(3, 'Tinsmith Row', 180), L(3, 'Copper Corner', 200),
  { kind: 'garden', name: 'Rooftop Garden' },
  L(4, 'Gallery Place', 220), F(), L(4, "Curator's Square", 220), L(4, 'Sculpture Lane', 240),
  M('Southmoor Station'), L(5, 'Ticker Street', 260), L(5, 'Bond Avenue', 260), L(5, 'Ledger Plaza', 280),
  { kind: 'arrest', name: 'Go to Prison' },
  L(6, 'Regent Crescent', 300), L(6, 'Sovereign Drive', 300), U('Fiber Network'), L(6, 'Coronet Circle', 320),
  M('Westfield Station'), L(7, 'Summit Terrace', 350), F(), L(7, 'The Pinnacle', 400),
];
export const PRISON = 9, SIZE = BOARD.length;
export const PIECES = [
  { glyph: '⚓', name: 'Anchor' }, { glyph: '♛', name: 'Crown' }, { glyph: '✦', name: 'Star' }, { glyph: '☾', name: 'Moon' },
  { glyph: '⚜', name: 'Lily' }, { glyph: '♞', name: 'Knight' }, { glyph: '☀', name: 'Sun' }, { glyph: '❖', name: 'Gem' },
];

// Rents for a lot: bare, then 1–4 floors, then a tower.
const round5 = x => (x < 20 ? Math.round(x) : Math.round(x / 5) * 5);
BOARD.forEach(t => {
  if (t.kind !== 'lot') return;
  const base = Math.max(2, Math.round((t.price * t.price) / 3200));
  const mult = [5, 14, 32, 40, 48], floor = [0.17, 0.5, 1.4, 2, 2.5];
  t.rent = [base, ...mult.map((m, i) => round5(Math.max(base * m, t.price * floor[i])))];
});
export const groupOf = d => BOARD.map((t, i) => (t.kind === 'lot' && t.d === d ? i : -1)).filter(i => i >= 0);
const METROS = BOARD.map((t, i) => (t.kind === 'metro' ? i : -1)).filter(i => i >= 0);
const UTILS = BOARD.map((t, i) => (t.kind === 'utility' ? i : -1)).filter(i => i >= 0);

const FORTUNE = [
  { text: 'Advance to Payday. Collect $200.', go: 0 },
  { text: 'Your startup is acquired. Collect $200.', cash: 200 },
  { text: 'A rare stamp sells at auction. Collect $100.', cash: 100 },
  { text: 'Tax refund. Collect $50.', cash: 50 },
  { text: 'Parking tickets pile up. Pay $50.', cash: -50 },
  { text: 'Tailor-made suit. Pay $100.', cash: -100 },
  { text: 'You throw a rooftop gala. Pay every player $50.', each: -50 },
  { text: "It's your birthday! Collect $25 from every player.", each: 25 },
  { text: 'Caught speeding. Go to Prison.', prison: true },
  { text: 'A friend in high places. Keep this pardon to leave Prison free.', pardon: true },
  { text: 'Take the next train. Advance to the nearest station; pay double if it is owned.', metro: true },
  { text: 'Back three squares.', back: 3 },
  { text: 'Advance to The Pinnacle.', go: 35 },
  { text: 'Advance to Gallery Place. Collect $200 if you pass Payday.', go: 19 },
  { text: 'Building inspection: pay $40 per floor and $115 per tower.', repairs: [40, 115] },
  { text: 'Advance to Rose Terrace. Collect $200 if you pass Payday.', go: 10 },
];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const seats = players.map(p => !!p);
  const order = seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const g = {
    settings: { cash: 1500, rounds: 30, ...settings },
    seats, order,
    cash: seats.map(x => (x ? 1500 : 0)),
    pos: seats.map(() => 0), inPrison: seats.map(() => 0), pardons: seats.map(() => 0), broke: seats.map(() => false),
    owner: BOARD.map(() => null), level: BOARD.map(() => 0), mortgaged: BOARD.map(() => false),
    deck: shuffle(FORTUNE.map((_, i) => i)),
    turnIdx: 0, round: 1, phase: 'roll', dice: null, doubles: 0, rollId: 0,
    log: [], annId: 0, trade: null, tradeId: 0, card: null, debt: null, winner: null,
  };
  g.cash = g.cash.map((c, i) => (seats[i] ? g.settings.cash : 0));
  return g;
}

export const current = g => g.order[g.turnIdx];
const name = i => BOARD[i].name;
function log(g, seat, text) { g.log.push({ seat, text }); if (g.log.length > 8) g.log.shift(); }
function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; log(g, seat, text); }

export const ownsGroup = (g, d, s) => groupOf(d).every(i => g.owner[i] === s);

export function rentFor(g, i, roll) {
  const t = BOARD[i], o = g.owner[i];
  if (o == null || g.mortgaged[i]) return 0;
  if (t.kind === 'lot') {
    const lv = g.level[i];
    if (lv) return t.rent[lv];
    return ownsGroup(g, t.d, o) ? t.rent[0] * 2 : t.rent[0];
  }
  if (t.kind === 'metro') { const n = METROS.filter(m => g.owner[m] === o).length; return 25 * 2 ** (n - 1); }
  if (t.kind === 'utility') { const n = UTILS.filter(u => g.owner[u] === o).length; return (n === 2 ? 10 : 4) * (roll || 7); }
  return 0;
}

export function netWorth(g, s) {
  let w = g.cash[s];
  BOARD.forEach((t, i) => {
    if (g.owner[i] !== s) return;
    w += g.mortgaged[i] ? t.price / 2 : t.price;
    if (g.level[i]) w += g.level[i] * DISTRICTS[t.d].build;
  });
  return w;
}

// ---------------------------------------------------------------- money

// Charge `amount` to `s`, owed to `to` (a seat, or null for the bank). If they can't cover
// it, they go into debt and must raise the money (or go bankrupt) before play continues.
function charge(g, s, amount, to, why) {
  if (amount <= 0) return;
  g.cash[s] -= amount;
  if (to != null) g.cash[to] += amount;
  log(g, s, `${why} · $${amount}`);
  if (g.cash[s] < 0) g.debt = { seat: s, to, why };
}

function pay(g, s, amount) { g.cash[s] += amount; }

function settleDebt(g) {
  if (g.debt && g.cash[g.debt.seat] >= 0) g.debt = null;
}

function bankrupt(g, s) {
  const to = g.debt?.seat === s ? g.debt.to : null;
  // Everything goes to the creditor (or back to the bank, unowned).
  BOARD.forEach((t, i) => {
    if (g.owner[i] !== s) return;
    if (to != null) { g.owner[i] = to; g.level[i] = 0; }
    else { g.owner[i] = null; g.level[i] = 0; g.mortgaged[i] = false; }
  });
  // Rent was credited in full when charged; take back the part that was never covered.
  if (to != null) { g.cash[to] += Math.min(0, g.cash[s]); g.pardons[to] += g.pardons[s]; }
  g.cash[s] = 0;
  g.pardons[s] = 0;
  g.broke[s] = true;
  g.debt = null;
  if (g.trade && (g.trade.from === s || g.trade.to === s)) g.trade = null;
  announce(g, s, 'Bankrupt!');
  const left = g.order.filter(x => !g.broke[x]);
  if (left.length <= 1) { g.phase = 'over'; g.winner = left[0]; return; }
  if (current(g) === s) nextTurn(g);
}

// ---------------------------------------------------------------- moving

function moveTo(g, s, target, passPay = true) {
  const from = g.pos[s];
  if (passPay && target < from) { pay(g, s, 200); log(g, s, 'Passed Payday · +$200'); }
  g.pos[s] = target;
  land(g, s);
}

function sendToPrison(g, s) {
  g.pos[s] = PRISON;
  g.inPrison[s] = 1;
  g.doubles = 0;
  announce(g, s, 'Off to Prison!');
  g.phase = 'end';
}

function land(g, s) {
  const i = g.pos[s], t = BOARD[i];
  g.phase = 'end';
  if (t.kind === 'arrest') return sendToPrison(g, s);
  if (t.kind === 'tax') return charge(g, s, t.amount, null, t.name);
  if (t.kind === 'payday' && i === 0) return;
  if (t.kind === 'fortune') return drawFortune(g, s);
  if (['lot', 'metro', 'utility'].includes(t.kind)) {
    const o = g.owner[i];
    if (o == null) { g.phase = 'buy'; return; }
    if (o === s) return;
    let rent = rentFor(g, i, g.dice ? g.dice[0] + g.dice[1] : 7);
    if (g.metroDouble && t.kind === 'metro') rent *= 2;
    g.metroDouble = false;
    if (rent) { charge(g, s, rent, o, `Rent on ${t.name}`); announce(g, s, `Pays $${rent} rent`); }
  }
}

function drawFortune(g, s) {
  if (!g.deck.length) g.deck = shuffle(FORTUNE.map((_, i) => i).filter(i => !(FORTUNE[i].pardon && g.pardons.some(Boolean))));
  const k = g.deck.shift();
  const c = FORTUNE[k];
  g.card = { id: (g.card?.id || 0) + 1, text: c.text, seat: s };
  announce(g, s, 'Fortune card');
  if (c.cash > 0) pay(g, s, c.cash);
  else if (c.cash < 0) charge(g, s, -c.cash, null, 'Fortune');
  else if (c.each) {
    for (const o of g.order) {
      if (o === s || g.broke[o]) continue;
      if (c.each > 0) { charge(g, o, c.each, s, 'Birthday gift'); if (g.debt) bankruptIfStuck(g); }
      else charge(g, s, -c.each, o, 'Gala');
    }
  } else if (c.prison) sendToPrison(g, s);
  else if (c.pardon) g.pardons[s]++;
  else if (c.back) { g.pos[s] = (g.pos[s] - c.back + SIZE) % SIZE; land(g, s); }
  else if (c.go != null) moveTo(g, s, c.go);
  else if (c.metro) { const next = METROS.find(m => m > g.pos[s]) ?? METROS[0]; g.metroDouble = true; moveTo(g, s, next); }
  else if (c.repairs) {
    let cost = 0;
    BOARD.forEach((t, i) => { if (g.owner[i] === s && g.level[i]) cost += g.level[i] === 5 ? c.repairs[1] : g.level[i] * c.repairs[0]; });
    charge(g, s, cost, null, 'Inspection');
  }
}

// Someone else's debt from a card mid-turn: settle it automatically (sell, mortgage, or go broke).
function bankruptIfStuck(g) {
  const s = g.debt.seat;
  autoRaise(g, s);
  if (g.cash[s] < 0) bankrupt(g, s);
  else g.debt = null;
}

function nextTurn(g) {
  g.doubles = 0;
  g.card = null;
  for (let k = 1; k <= g.order.length; k++) {
    const idx = (g.turnIdx + k) % g.order.length;
    if (g.broke[g.order[idx]]) continue;
    if (idx <= g.turnIdx) g.round++;
    g.turnIdx = idx;
    break;
  }
  g.phase = 'roll';
  if (g.settings.rounds && g.round > g.settings.rounds) {
    g.phase = 'over';
    const live = g.order.filter(x => !g.broke[x]);
    g.winner = live.sort((a, b) => netWorth(g, b) - netWorth(g, a))[0];
    g.byWorth = true;
  }
}

// ---------------------------------------------------------------- building & mortgages

export function canBuild(g, s, i) {
  const t = BOARD[i];
  if (t.kind !== 'lot' || g.owner[i] !== s || g.level[i] >= 5) return false;
  if (!ownsGroup(g, t.d, s)) return false;
  const grp = groupOf(t.d);
  if (grp.some(j => g.mortgaged[j])) return false;
  if (g.level[i] > Math.min(...grp.map(j => g.level[j]))) return false;   // build evenly
  return g.cash[s] >= DISTRICTS[t.d].build;
}
export function canSell(g, s, i) {
  const t = BOARD[i];
  if (t.kind !== 'lot' || g.owner[i] !== s || !g.level[i]) return false;
  return g.level[i] >= Math.max(...groupOf(t.d).map(j => g.level[j]));   // sell evenly
}
export function canMortgage(g, s, i) {
  const t = BOARD[i];
  if (g.owner[i] !== s || g.mortgaged[i]) return false;
  if (t.kind === 'lot' && groupOf(t.d).some(j => g.level[j])) return false;
  return true;
}
export const unmortgageCost = i => Math.ceil(BOARD[i].price * 0.55);

function raiseMoney(g, s) {
  // Prefer selling floors, then mortgaging stations, utilities and lone lots.
  for (const i of BOARD.map((_, k) => k).sort((a, b) => g.level[b] - g.level[a])) {
    if (canSell(g, s, i)) return sell(g, s, i), true;
  }
  const order = BOARD.map((_, k) => k).filter(k => canMortgage(g, s, k))
    .sort((a, b) => (BOARD[a].kind === 'lot' && ownsGroup(g, BOARD[a].d, s) ? 1 : 0) - (BOARD[b].kind === 'lot' && ownsGroup(g, BOARD[b].d, s) ? 1 : 0) || BOARD[a].price - BOARD[b].price);
  if (order.length) return mortgage(g, s, order[0]), true;
  return false;
}
function autoRaise(g, s) { while (g.cash[s] < 0 && raiseMoney(g, s)) { /* keep going */ } }

function sell(g, s, i) { g.level[i]--; pay(g, s, DISTRICTS[BOARD[i].d].build / 2); }
function mortgage(g, s, i) { g.mortgaged[i] = true; pay(g, s, BOARD[i].price / 2); }

// ---------------------------------------------------------------- actions

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (g.broke[seat]) return "You're out of the game";
  const me = current(g) === seat;

  // Things you can do any time: manage your own property, and answer trades.
  if (a.type === 'build' || a.type === 'sell' || a.type === 'mortgage' || a.type === 'unmortgage') {
    const i = a.i;
    if (!(i >= 0 && i < SIZE)) return 'No such square';
    if (a.type === 'build') {
      if (g.debt) return 'Settle your debt first';
      if (!canBuild(g, seat, i)) return ownsGroup(g, BOARD[i].d, seat) ? 'Build evenly across the district, and keep it free of mortgages' : 'You need the whole district to build';
      g.cash[seat] -= DISTRICTS[BOARD[i].d].build;
      g.level[i]++;
      announce(g, seat, g.level[i] === 5 ? `Tower on ${name(i)}!` : `Floor ${g.level[i]} on ${name(i)}`);
    } else if (a.type === 'sell') {
      if (!canSell(g, seat, i)) return 'Sell evenly across the district';
      sell(g, seat, i);
    } else if (a.type === 'mortgage') {
      if (!canMortgage(g, seat, i)) return 'Sell the floors in this district first';
      mortgage(g, seat, i);
      log(g, seat, `Mortgaged ${name(i)}`);
    } else {
      if (g.owner[i] !== seat || !g.mortgaged[i]) return 'Not mortgaged';
      const cost = unmortgageCost(i);
      if (g.cash[seat] < cost) return `You need $${cost}`;
      g.cash[seat] -= cost;
      g.mortgaged[i] = false;
      log(g, seat, `Paid off ${name(i)}`);
    }
    settleDebt(g);
    return null;
  }
  if (a.type === 'bankrupt') {
    if (!g.debt || g.debt.seat !== seat) return "You're not in debt";
    bankrupt(g, seat);
    return null;
  }
  if (a.type === 'offer') return offer(g, seat, a);
  if (a.type === 'accept' || a.type === 'decline' || a.type === 'cancel') return answer(g, seat, a.type);

  if (g.debt) return g.debt.seat === seat ? `Raise $${-g.cash[seat]} first — mortgage or sell, or declare bankruptcy` : `Waiting for ${'a player'} to settle a debt`;
  if (!me) return "It isn't your turn";

  if (a.type === 'bail' || a.type === 'pardon') {
    if (g.phase !== 'roll' || !g.inPrison[seat]) return "You're not in Prison";
    if (a.type === 'pardon') { if (!g.pardons[seat]) return 'No pardon card'; g.pardons[seat]--; }
    else { if (g.cash[seat] < 50) return 'Bail is $50'; g.cash[seat] -= 50; }
    g.inPrison[seat] = 0;
    announce(g, seat, a.type === 'pardon' ? 'Uses a pardon' : 'Pays $50 bail');
    return null;
  }
  if (a.type === 'roll') {
    if (g.phase !== 'roll') return 'You already rolled';
    const d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    g.dice = d;
    g.rollId++;
    const dbl = d[0] === d[1];
    g.card = null;
    if (g.inPrison[seat]) {
      if (dbl) { g.inPrison[seat] = 0; announce(g, seat, 'Doubles — out of Prison!'); moveTo(g, seat, (g.pos[seat] + d[0] + d[1]) % SIZE); g.doubles = 0; if (g.phase === 'roll') g.phase = 'end'; return null; }
      if (g.inPrison[seat] >= 3) {
        g.inPrison[seat] = 0;
        charge(g, seat, 50, null, 'Bail');
        announce(g, seat, 'Third try — pays bail');
        moveTo(g, seat, (g.pos[seat] + d[0] + d[1]) % SIZE);
        return null;
      }
      g.inPrison[seat]++;
      log(g, seat, 'Still in Prison');
      g.phase = 'end';
      return null;
    }
    if (dbl) g.doubles++; else g.doubles = 0;
    if (g.doubles >= 3) { sendToPrison(g, seat); return null; }
    moveTo(g, seat, (g.pos[seat] + d[0] + d[1]) % SIZE);
    return null;
  }
  if (a.type === 'buy' || a.type === 'pass') {
    if (g.phase !== 'buy') return 'Nothing to buy';
    const i = g.pos[seat], t = BOARD[i];
    if (a.type === 'buy') {
      if (g.cash[seat] < t.price) return `You need $${t.price}`;
      g.cash[seat] -= t.price;
      g.owner[i] = seat;
      announce(g, seat, `Buys ${t.name}`);
    } else log(g, seat, `Passes on ${t.name}`);
    g.phase = 'end';
    return null;
  }
  if (a.type === 'end') {
    if (g.phase !== 'end') return g.phase === 'buy' ? 'Buy it or pass first' : 'Roll first';
    if (g.trade && g.trade.from === seat) g.trade = null;
    // Doubles (and not in Prison): roll again.
    if (g.doubles && !g.inPrison[seat]) { g.phase = 'roll'; return null; }
    nextTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

// ---------------------------------------------------------------- trading

const tradable = (g, s, i) => g.owner[i] === s && !(BOARD[i].kind === 'lot' && groupOf(BOARD[i].d).some(j => g.level[j]));

function offer(g, seat, a) {
  if (g.trade) return 'A trade is already on the table';
  if (current(g) !== seat) return 'You can offer trades on your turn';
  const to = a.to;
  if (!g.order.includes(to) || to === seat || g.broke[to]) return 'Pick someone to trade with';
  const give = (a.give || []).filter(i => tradable(g, seat, i));
  const get = (a.get || []).filter(i => tradable(g, to, i));
  const giveCash = Math.max(0, Math.min(Math.floor(a.giveCash || 0), g.cash[seat]));
  const getCash = Math.max(0, Math.min(Math.floor(a.getCash || 0), g.cash[to]));
  if (!give.length && !get.length) return 'Put a property in the deal';
  g.trade = { id: ++g.tradeId, from: seat, to, give, get, giveCash, getCash };
  announce(g, seat, 'Offers a trade');
  return null;
}

function answer(g, seat, type) {
  const t = g.trade;
  if (!t) return 'No trade on the table';
  if (type === 'cancel') { if (seat !== t.from) return 'Not your offer'; g.trade = null; return null; }
  if (seat !== t.to) return 'This offer is for someone else';
  if (type === 'decline') { g.trade = null; announce(g, seat, 'Declines the trade'); return null; }
  // Still valid?
  if (!t.give.every(i => tradable(g, t.from, i)) || !t.get.every(i => tradable(g, t.to, i)) || g.cash[t.from] < t.giveCash || g.cash[t.to] < t.getCash) {
    g.trade = null;
    return 'That deal no longer works';
  }
  t.give.forEach(i => { g.owner[i] = t.to; });
  t.get.forEach(i => { g.owner[i] = t.from; });
  g.cash[t.from] += t.getCash - t.giveCash;
  g.cash[t.to] += t.giveCash - t.getCash;
  g.trade = null;
  announce(g, seat, 'Deal!');
  return null;
}

// ---------------------------------------------------------------- views

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: current(g), round: g.round, rounds: g.settings.rounds, dice: g.dice, rollId: g.rollId,
    cash: g.cash, pos: g.pos, inPrison: g.inPrison, pardons: g.pardons, broke: g.broke, order: g.order,
    owner: g.owner, level: g.level, mortgaged: g.mortgaged, trade: g.trade, card: g.card, debt: g.debt,
    log: g.log, winner: g.winner, byWorth: !!g.byWorth, doubles: g.doubles,
    worth: g.order.map(s => netWorth(g, s)),
  };
}

// ---------------------------------------------------------------- bots

const reserve = g => (g.round < 4 ? 120 : 220);

export function botAction(g, seat) {
  // Answer trades, debts and the turn, in that order. (Bots never start trades.)
  if (g.trade && g.trade.to === seat) return { type: tradeValue(g, seat) > 25 ? 'accept' : 'decline' };
  if (g.debt && g.debt.seat === seat) {
    if (raiseMoneyMove(g, seat)) return raiseMoneyMove(g, seat);
    return { type: 'bankrupt' };
  }
  if (current(g) !== seat) return null;
  if (g.phase === 'roll') {
    if (g.inPrison[seat]) {
      if (g.pardons[seat]) return { type: 'pardon' };
      if (g.round < 12 && g.cash[seat] > 300) return { type: 'bail' };
    }
    return { type: 'roll' };
  }
  if (g.phase === 'buy') {
    const t = BOARD[g.pos[seat]];
    const wantIt = t.kind !== 'lot' || groupOf(t.d).some(j => g.owner[j] === seat) || g.cash[seat] - t.price > reserve(g);
    return { type: g.cash[seat] - t.price >= (wantIt ? 40 : reserve(g)) ? 'buy' : 'pass' };
  }
  if (g.phase === 'end') {
    // Pay off a mortgage or raise a floor with spare cash.
    const spare = g.cash[seat] - reserve(g) - 100;
    for (let i = 0; i < SIZE && spare > 0; i++) {
      if (g.owner[i] === seat && g.mortgaged[i] && unmortgageCost(i) < spare) return { type: 'unmortgage', i };
    }
    const builds = BOARD.map((_, i) => i).filter(i => canBuild(g, seat, i) && g.cash[seat] - DISTRICTS[BOARD[i].d].build > reserve(g) + 80);
    if (builds.length) return { type: 'build', i: builds.sort((a, b) => g.level[a] - g.level[b] || BOARD[b].price - BOARD[a].price)[0] };
    return { type: 'end' };
  }
  return null;
}

function raiseMoneyMove(g, s) {
  for (const i of BOARD.map((_, k) => k).sort((a, b) => g.level[b] - g.level[a])) if (canSell(g, s, i)) return { type: 'sell', i };
  const m = BOARD.map((_, k) => k).filter(k => canMortgage(g, s, k))
    .sort((a, b) => (BOARD[a].kind === 'lot' && ownsGroup(g, BOARD[a].d, s) ? 1 : 0) - (BOARD[b].kind === 'lot' && ownsGroup(g, BOARD[b].d, s) ? 1 : 0) || BOARD[a].price - BOARD[b].price);
  return m.length ? { type: 'mortgage', i: m[0] } : null;
}

// How good is the trade on the table for this bot? (Positive = good.)
function tradeValue(g, s) {
  const t = g.trade;
  const val = (i, owner) => {
    const tile = BOARD[i];
    let v = g.mortgaged[i] ? tile.price / 2 : tile.price;
    if (tile.kind === 'lot') {
      const grp = groupOf(tile.d);
      const have = grp.filter(j => g.owner[j] === owner && j !== i).length;
      if (have === grp.length - 1) v *= 2.6;            // completes (or breaks) a district
      else if (have) v *= 1.3;
    }
    return v;
  };
  let gain = t.giveCash - t.getCash;
  t.give.forEach(i => { gain += val(i, s); });
  t.get.forEach(i => { gain -= val(i, s) * 1.15; });
  // Don't hand someone a full district for cheap.
  t.get.forEach(i => { const tile = BOARD[i]; if (tile.kind === 'lot' && groupOf(tile.d).every(j => j === i || g.owner[j] === t.from)) gain -= tile.price * 2; });
  return gain;
}
