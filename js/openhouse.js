// Open House: buy low, sell high. Part one — buying: a row of properties (1 = a cardboard box,
// 30 = a castle) goes up on the table. Bid coins in turn; when you pass you take the cheapest
// property left and get half your bid back. The last bidder pays in full for the best one.
// Part two — selling: a row of cheques goes up, and everyone secretly picks a property from their
// hand on their phone at the same time. The best property gets the biggest cheque. Most money wins.
import { base, shuffle, sfx, announce, waiting } from './party.js?v=68';

export const PROPS = [null, 'Cardboard box', 'Tent', 'Outhouse', 'Igloo', 'Dog kennel', 'Treehouse', 'Caravan', 'Shed', 'Houseboat', 'Cabin',
  'Bungalow', 'Cottage', 'Lighthouse', 'Windmill', 'Farmhouse', 'Townhouse', 'Loft', 'Chalet', 'Beach house', 'Barn conversion',
  'Villa', 'Penthouse', 'Manor', 'Ranch', 'Lodge', 'Mansion', 'Sky palace', 'Private island', 'Space station', 'Castle'];
export const ICON = [null, '📦', '⛺', '🚽', '🧊', '🐕', '🌳', '🚐', '🛖', '🛥️', '🪵', '🏠', '🏡', '🗼', '🌬️', '🚜', '🏘️', '🏢', '🏔️', '🏖️', '🐄', '🌴', '🌆', '🏛️', '🐎', '🦌', '🏰', '☁️', '🏝️', '🛰️', '👑'];

export function createGame(settings, players) {
  const g = base(settings, players, {});
  const n = g.order.length;
  g.props = shuffle([...Array(30).keys()].map(i => i + 1)).slice(0, n === 3 ? 24 : n === 4 ? 28 : 30);
  const cheques = shuffle([0, 0, ...[...Array(14).keys()].flatMap(i => [i + 2, i + 2])]);
  g.cheques = cheques.slice(0, g.props.length);
  g.coins = g.seats.map(x => (x ? (n <= 4 ? 18 : 14) : 0));
  g.owned = g.seats.map(() => []);
  g.cash = g.seats.map(() => []);
  g.lead = g.order[0];
  startBuy(g);
  return g;
}
function startBuy(g) {
  g.row = g.props.splice(0, g.order.length).sort((a, b) => a - b);
  g.bids = g.seats.map(() => 0);
  g.out = [];
  g.turn = g.lead;
  g.phase = 'buy';
  g.moveId++;
}
const nextBidder = (g, s) => { const o = g.order; let i = o.indexOf(s); do i = (i + 1) % o.length; while (g.out.includes(o[i])); return o[i]; };
const high = g => Math.max(0, ...g.bids);
export const pending = g => (g.phase === 'buy' ? [g.turn] : g.phase === 'sell' ? waiting(g) : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => (g.phase === 'buy' ? g.turn : -1);
export const collecting = g => g.phase === 'sell';

function startSell(g) {
  g.row = g.cheques.splice(0, g.order.length).sort((a, b) => a - b);
  g.picks = {};
  g.done = {};
  g.phase = 'sell';
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'buy') {
    if (seat !== g.turn) return "It's not your turn";
    if (a.type === 'bid') {
      const n = Number(a.n);
      if (!(n > high(g))) return `Bid more than ${high(g)}`;
      if (n > g.coins[seat]) return 'You don’t have that many coins';
      g.bids[seat] = n;
      announce(g, seat, `🪙 ${n}`);
      g.turn = nextBidder(g, seat);
    } else if (a.type === 'pass') {
      const p = g.row.shift();
      g.owned[seat].push(p);
      g.coins[seat] -= Math.ceil(g.bids[seat] / 2);     // you get half back, rounded down
      g.out.push(seat);
      announce(g, seat, `Pass — takes the ${PROPS[p]}`);
      sfx(g, 'thud');
      if (g.row.length === 1) {
        const w = g.order.find(s => !g.out.includes(s));
        g.owned[w].push(g.row.shift());
        g.coins[w] -= g.bids[w];
        g.lead = w;
        if (g.props.length >= g.order.length) startBuy(g); else startSell(g);
        return null;
      }
      g.turn = nextBidder(g, seat);
    } else return 'Bid or pass';
    g.moveId++;
    return null;
  }
  if (g.phase === 'sell' && a.type === 'pick') {
    if (g.done[seat]) return 'Already chosen';
    const p = Number(a.v);
    if (!g.owned[seat].includes(p)) return 'Pick a property you own';
    g.picks[seat] = p;
    g.done[seat] = true;
    if (!waiting(g).length) {
      const order = [...g.order].sort((x, y) => g.picks[x] - g.picks[y]);
      g.sold = order.map((s, i) => ({ s, p: g.picks[s], c: g.row[i] }));
      for (const x of g.sold) { g.owned[x.s].splice(g.owned[x.s].indexOf(x.p), 1); g.cash[x.s].push(x.c); }
      g.phase = 'sold';
      g.soldAt = Date.now();
      sfx(g, 'chime');
    }
    g.moveId++;
    return null;
  }
  return 'Not now';
}
export const total = (g, s) => g.coins[s] + g.cash[s].reduce((a, b) => a + b, 0);

export function tick(g) {
  if (g.phase === 'sold') return { ms: Math.max(0, g.soldAt + 5000 - Date.now()), run: () => {
    if (g.cheques.length) return startSell(g);
    g.order.forEach(s => { g.score[s] = total(g, s); });
    const top = Math.max(...g.order.map(s => g.score[s]));
    g.winners = g.order.filter(s => g.score[s] === top);
    g.winner = g.winners[0];
    g.phase = 'over';
    g.moveId++;
  } };
  return null;
}

export function botAction(g, seat) {
  if (g.phase === 'buy') {
    const want = g.row[g.row.length - 1] / 4 + Math.random() * 3;
    const n = high(g) + 1;
    return n <= g.coins[seat] && n <= want && g.coins[seat] - n > 3 ? { type: 'bid', n } : { type: 'pass' };
  }
  const h = [...g.owned[seat]].sort((a, b) => a - b);
  const bigCheque = g.row[g.row.length - 1] >= 12;
  return { type: 'pick', v: bigCheque ? h[h.length - 1] : h[Math.floor(Math.random() * h.length)] };
}

export const propOpt = p => ({ v: p, label: ICON[p], sub: `${p} · ${PROPS[p]}`, cls: 'oh-prop' });
export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Coins', `🪙 ${g.coins[seat] ?? 0}`], ['Cheques', `💵 ${g.cash[seat]?.reduce((a, b) => a + b, 0) ?? 0}`]] };
  const owned = `<div class="oh-owned">${[...(g.owned[seat] || [])].sort((a, b) => a - b).map(p => `<span title="${PROPS[p]}">${ICON[p]}<b>${p}</b></span>`).join('') || '<em>No properties yet</em>'}</div>`;
  if (g.phase === 'buy') {
    if (g.turn === seat) {
      const min = high(g) + 1, max = g.coins[seat];
      const steps = [...new Set([min, min + 1, min + 2, min + 4, max].filter(n => n >= min && n <= max))];
      v.ui = { k: 'buttons', key: 'b' + g.moveId, title: high(g) ? `Top bid: ${high(g)}` : 'Open the bidding', sub: `Your bid: ${g.bids[seat]} · passing takes ${PROPS[g.row[0]]} and refunds ${Math.floor(g.bids[seat] / 2)}`, myturn: true, buzz: true, html: owned,
        buttons: [{ type: 'pass', label: `Pass (take ${g.row[0]})` }, ...steps.map(n => ({ type: 'bid', label: `Bid ${n}`, go: true, payload: { n } }))] };
    } else v.ui = { k: 'wait', title: g.out.includes(seat) ? 'You’ve passed this round' : `@${g.turn}@ is bidding`, sub: `Top bid ${high(g)} · your bid ${g.bids[seat]}`, html: owned };
  } else if (g.phase === 'sell') v.ui = g.done[seat]
    ? { k: 'wait', title: `Selling the ${PROPS[g.picks[seat]]} ✓`, sub: `Waiting for ${waiting(g).length} more…`, html: owned }
    : { k: 'pick', key: 's' + g.cheques.length, title: 'Sell a property', sub: `Cheques up: ${g.row.join(', ')} — the best property takes the biggest`, myturn: true, buzz: true, cards: true, grid: 4, options: [...g.owned[seat]].sort((a, b) => a - b).map(propOpt) };
  else if (g.phase === 'sold') { const x = g.sold.find(y => y.s === seat); v.ui = { k: 'wait', title: `Sold for ${x.c}!`, sub: `Your ${PROPS[x.p]}`, html: owned }; }
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Richest on the street!' : 'Game over', sub: `You finished with ${g.score[seat]}` };
  return v;
}
