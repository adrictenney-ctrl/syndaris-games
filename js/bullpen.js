// Bull Pen: 104 cards, each with bull heads on it — you don't want them. Four rows sit on the
// table. Everyone secretly picks a card on their phone at the same time; then the cards are placed
// from lowest to highest, each on the row whose last card is the closest below it. Lay the SIXTH
// card in a row and you take the five before it. Play a card lower than every row and you choose
// a row to take. When someone reaches the bull limit, fewest bull heads wins.
import { base, shuffle, sfx, announce, waiting } from './party.js?v=68';

export const bulls = v => (v === 55 ? 7 : v % 11 === 0 ? 5 : v % 10 === 0 ? 3 : v % 5 === 0 ? 2 : 1);
export function createGame(settings, players) {
  const g = base(settings, players, { limit: 66 });
  g.taken = g.seats.map(() => 0);
  g.deal = 0;
  newDeal(g);
  return g;
}
function newDeal(g) {
  g.deal++;
  const deck = shuffle([...Array(104).keys()].map(i => i + 1));
  g.hand = g.seats.map((_, s) => (g.order.includes(s) ? deck.splice(0, 10).sort((a, b) => a - b) : []));
  g.rows = [0, 1, 2, 3].map(() => [deck.pop()]);
  startTrick(g);
}
function startTrick(g) {
  g.picks = {};
  g.done = {};
  g.queue = null;
  g.placed = [];
  g.phase = 'pick';
  g.moveId++;
}
const rowFor = (g, v) => { let best = -1; g.rows.forEach((r, i) => { const end = r[r.length - 1]; if (end < v && (best < 0 || end > g.rows[best][g.rows[best].length - 1])) best = i; }); return best; };
export const rowBulls = r => r.reduce((t, v) => t + bulls(v), 0);
export const pending = g => (g.phase === 'pick' ? waiting(g) : g.phase === 'choose' ? [g.queue[0].s] : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => (g.phase === 'choose' ? g.queue[0].s : -1);
export const collecting = g => g.phase === 'pick';

// Place cards one by one, lowest first, stopping if someone has to choose a row.
function resolve(g) {
  while (g.queue.length) {
    const { s, v } = g.queue[0];
    const i = rowFor(g, v);
    if (i < 0) { g.phase = 'choose'; g.moveId++; return; }
    const r = g.rows[i];
    if (r.length === 5) { take(g, s, i); g.rows[i] = [v]; }
    else r.push(v);
    g.placed.push({ s, v, row: i });
    g.queue.shift();
  }
  g.phase = 'show';
  g.showAt = Date.now();
  g.moveId++;
}
function take(g, s, i) {
  const b = rowBulls(g.rows[i]);
  g.taken[s] += b;
  announce(g, s, `🐂 +${b}`);
  sfx(g, 'sad');
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'pick' && a.type === 'pick') {
    if (g.done[seat]) return 'Already picked';
    const v = Number(a.v);
    if (!g.hand[seat].includes(v)) return 'Pick a card from your hand';
    g.picks[seat] = v;
    g.done[seat] = true;
    if (!waiting(g).length) {
      for (const s of g.order) g.hand[s].splice(g.hand[s].indexOf(g.picks[s]), 1);
      g.queue = g.order.map(s => ({ s, v: g.picks[s] })).sort((x, y) => x.v - y.v);
      g.phase = 'reveal';
      g.revAt = Date.now();
    }
    g.moveId++;
    return null;
  }
  if (g.phase === 'choose' && a.type === 'row') {
    if (seat !== g.queue[0].s) return 'Someone else is choosing';
    const i = Number(a.v);
    if (!g.rows[i]) return 'Pick a row';
    take(g, seat, i);
    g.rows[i] = [g.queue[0].v];
    g.placed.push({ ...g.queue.shift(), row: i });
    resolve(g);
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 2200 - Date.now()), run: () => resolve(g) };
  if (g.phase === 'show') return { ms: Math.max(0, g.showAt + 2600 - Date.now()), run: () => {
    if (g.hand[g.order[0]].length) return startTrick(g);
    if (g.order.some(s => g.taken[s] >= g.settings.limit)) {
      g.order.forEach(s => { g.score[s] = g.taken[s]; });
      const low = Math.min(...g.order.map(s => g.taken[s]));
      g.winners = g.order.filter(s => g.taken[s] === low);
      g.winner = g.winners[0];
      g.phase = 'over';
      g.moveId++;
      return;
    }
    newDeal(g);
  } };
  return null;
}

export function botAction(g, seat) {
  if (g.phase === 'choose') { const lo = g.rows.map((r, i) => [rowBulls(r), i]).sort((a, b) => a[0] - b[0])[0][1]; return { type: 'row', v: lo }; }
  // Prefer a card that lands on a short row close to its end.
  let best = null;
  for (const v of g.hand[seat]) {
    const i = rowFor(g, v);
    const risk = i < 0 ? 20 + Math.min(...g.rows.map(rowBulls)) : (g.rows[i].length >= 4 ? 10 * (g.rows[i].length - 3) : 0) + (v - g.rows[i][g.rows[i].length - 1]) / 10;
    if (!best || risk < best.r) best = { v, r: risk + Math.random() };
  }
  return { type: 'pick', v: best.v };
}

const bullCard = v => ({ v, label: String(v), sub: '🐂'.repeat(bulls(v)), cls: `bp-card b${bulls(v)}` });
export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Your bulls', `🐂 ${g.taken[seat] ?? 0}`], ['Limit', g.settings.limit]] };
  const rows = `<div class="bp-mini">${g.rows.map((r, i) => `<div><b>${i + 1}</b>${r.map(x => `<i class="b${bulls(x)}">${x}</i>`).join('')}<em>🐂${rowBulls(r)}</em></div>`).join('')}</div>`;
  const h = g.hand[seat] || [];
  if (g.phase === 'pick') v.ui = g.done[seat]
    ? { k: 'wait', title: `You picked ${g.picks[seat]} ✓`, sub: `Waiting for ${waiting(g).length} more…`, html: rows }
    : { k: 'pick', key: 'p' + g.deal + ':' + h.length, title: 'Pick a card', sub: 'Everyone picks at once — lowest is placed first', myturn: true, buzz: true, cards: true, grid: 5, html: rows, options: h.map(bullCard) };
  else if (g.phase === 'choose' && g.queue[0].s === seat) v.ui = { k: 'pick', key: 'c' + g.moveId, act: 'row', title: `Your ${g.queue[0].v} is lower than every row`, sub: 'Choose a row to take — your card starts it again', myturn: true, buzz: true,
    options: g.rows.map((r, i) => ({ v: i, label: `Row ${i + 1}: ${r.join(' · ')}`, sub: `🐂 ${rowBulls(r)}` })) };
  else if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Fewest bulls — you win!' : 'Game over', sub: `You took ${g.taken[seat]} bull heads` };
  else v.ui = { k: 'wait', title: g.phase === 'choose' ? `@${g.queue[0].s}@ is choosing a row` : 'Placing the cards…', sub: 'Watch the table', html: rows };
  return v;
}
