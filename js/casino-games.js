// Casino games on the casino kit: bets go on phones, the action happens on the table.
import { casinoEngine } from './casinokit.js?v=68';
import { shuffle } from './party.js?v=68';

const R = n => Math.floor(Math.random() * n);
const die = () => 1 + R(6);
export const REDS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];
export const card = () => ({ r: 2 + R(13), s: R(4) });
export const cardTxt = c => `${RANKS[c.r - 2]}${SUITS[c.s]}`;

// ---- Roulette (single zero)
const ROUL_OUT = [['red', 'Red', 'pays 1:1'], ['black', 'Black', 'pays 1:1'], ['odd', 'Odd', '1:1'], ['even', 'Even', '1:1'], ['low', '1–18', '1:1'], ['high', '19–36', '1:1'], ['d1', '1st 12', 'pays 2:1'], ['d2', '2nd 12', '2:1'], ['d3', '3rd 12', '2:1']];
export const roulette = casinoEngine({
  rounds: 10, cols: 6, spinMs: 5500, betTitle: 'Place your bets',
  spots: () => [...ROUL_OUT.map(([id, label, sub]) => ({ id, label, sub, cls: 'cs-out ' + id })), ...Array.from({ length: 37 }, (_, n) => ({ id: String(n), label: String(n), cls: `cs-num ${n === 0 ? 'green' : REDS.includes(n) ? 'red' : 'black'}` }))],
  outcome: () => R(37),
  pays(g, id) {
    const n = g.out;
    if (/^\d+$/.test(id)) return Number(id) === n ? 36 : 0;
    if (n === 0) return 0;
    const ok = { red: REDS.includes(n), black: !REDS.includes(n), odd: n % 2 === 1, even: n % 2 === 0, low: n <= 18, high: n >= 19, d1: n <= 12, d2: n > 12 && n <= 24, d3: n > 24 }[id];
    return ok ? (id[0] === 'd' ? 3 : 2) : 0;
  },
  botSpots: (g, sp) => sp.slice(0, 9),
  summary: g => `${g.out} ${g.out === 0 ? 'green' : REDS.includes(g.out) ? 'red' : 'black'}`,
});

// ---- Triple Dice (three dice, big/small, totals and singles)
const TOTAL_PAY = { 4: 61, 17: 61, 5: 31, 16: 31, 6: 18, 15: 18, 7: 13, 14: 13, 8: 9, 13: 9, 9: 7, 12: 7, 10: 7, 11: 7 };
export const tripledice = casinoEngine({
  rounds: 10, cols: 4, spinMs: 3500,
  spots: () => [{ id: 'small', label: 'Small', sub: '4–10 · 1:1' }, { id: 'big', label: 'Big', sub: '11–17 · 1:1' }, { id: 'triple', label: 'Any triple', sub: '30:1' },
    ...[1, 2, 3, 4, 5, 6].map(f => ({ id: 's' + f, label: '⚀⚁⚂⚃⚄⚅'[f - 1], sub: `a ${f} · 1:1 each`, cls: 'cs-die' })), ...Object.keys(TOTAL_PAY).map(t => ({ id: 't' + t, label: `= ${t}`, sub: `${TOTAL_PAY[t] - 1}:1` }))],
  outcome: () => [die(), die(), die()],
  pays(g, id) {
    const d = g.out, sum = d[0] + d[1] + d[2], triple = d[0] === d[1] && d[1] === d[2];
    if (id === 'small') return !triple && sum <= 10 ? 2 : 0;
    if (id === 'big') return !triple && sum >= 11 ? 2 : 0;
    if (id === 'triple') return triple ? 31 : 0;
    if (id[0] === 's') { const k = d.filter(x => x === Number(id.slice(1))).length; return k ? k + 1 : 0; }
    return Number(id.slice(1)) === sum ? TOTAL_PAY[sum] : 0;
  },
  botSpots: (g, sp) => sp.slice(0, 2),
  summary: g => `${g.out.join(' · ')} = ${g.out[0] + g.out[1] + g.out[2]}`,
});

// ---- Lucky Numbers (keno: pick up to 6 of 40, ten are drawn)
const KENO = { 1: [0, 3.6], 2: [0, 1, 9], 3: [0, 0.5, 2.5, 25], 4: [0, 0, 2, 8, 60], 5: [0, 0, 1, 4, 20, 250], 6: [0, 0, 0.5, 2, 10, 80, 800] };
export const luckynumbers = casinoEngine({
  rounds: 8, pickMode: true, maxPicks: 6, cols: 8, spinMs: 6000, numbers: Array.from({ length: 40 }, (_, i) => i + 1),
  outcome: () => shuffle(Array.from({ length: 40 }, (_, i) => i + 1)).slice(0, 10),
  payPicks: (g, picks) => { const hits = picks.filter(p => g.out.includes(p)).length; return (KENO[picks.length] || [])[hits] || 0; },
  myBets: (g, s) => `<p class="cs-ticket">Your numbers: ${g.ticket[s].picks.sort((a, b) => a - b).join(' · ') || '—'}</p>`,
  summary: g => `Drawn: ${[...g.out].sort((a, b) => a - b).join(' ')}`,
  spots: () => [], pays: () => 0,
});
export const KENO_TABLE = KENO;

// ---- Money Wheel (54 segments)
export const WHEEL = (() => { const w = []; const add = (v, n) => { for (let i = 0; i < n; i++) w.push(v); }; add('1', 24); add('2', 15); add('5', 7); add('10', 4); add('20', 2); add('★', 2); const s = []; const pools = {}; for (const v of w) (pools[v] = pools[v] || []).push(v); while (Object.values(pools).some(p => p.length)) for (const k of ['1', '2', '1', '5', '1', '2', '10', '1', '2', '20', '1', '5', '★', '1', '2']) if (pools[k]?.length) s.push(pools[k].pop()); return s; })();
export const moneywheel = casinoEngine({
  rounds: 10, cols: 3, spinMs: 5500,
  spots: () => ['1', '2', '5', '10', '20', '★'].map(v => ({ id: v, label: v, sub: v === '★' ? 'pays 45:1' : `pays ${v}:1`, cls: 'cs-mw v' + (v === '★' ? 'star' : v) })),
  outcome: () => R(WHEEL.length),
  pays: (g, id) => (WHEEL[g.out] === id ? (id === '★' ? 46 : Number(id) + 1) : 0),
  summary: g => `The wheel stopped on ${WHEEL[g.out]}`,
});

// ---- Derby Day (six horses, odds change each race)
export const HORSES = ['Thunder', 'Biscuit', 'Comet', 'Lady Luck', 'Pickles', 'Midnight'];
export const SILKS = ['#e8473c', '#f2c230', '#3d8be8', '#3fb35c', '#a05ad8', '#ee7a2a'];
export const derbyday = casinoEngine({
  rounds: 8, cols: 2, spinMs: 9000, spinTitle: 'And they’re off!',
  newRound(g) {
    const w = HORSES.map(() => 1 + Math.random() * 4), t = w.reduce((a, b) => a + b, 0);
    g.prob = w.map(x => x / t);
    g.odds = g.prob.map(p => Math.max(1.2, Math.floor((0.92 / p) * 10) / 10));
  },
  spots: g => HORSES.map((h, i) => ({ id: String(i), label: `${i + 1}. ${h}`, sub: `pays ${g.odds[i]}×`, cls: 'cs-horse h' + i })),
  outcome(g) {
    let r = Math.random(), w = 0;
    for (; w < 5 && r > g.prob[w]; w++) r -= g.prob[w];
    // Finishing order: winner first, the rest by weighted chance.
    const rest = shuffle(HORSES.map((_, i) => i).filter(i => i !== w)).sort((a, b) => g.prob[b] * Math.random() - g.prob[a] * Math.random());
    return { order: [w, ...rest], seed: R(1000) };
  },
  pays: (g, id) => (Number(id) === g.out.order[0] ? g.odds[g.out.order[0]] : 0),
  summary: g => `${HORSES[g.out.order[0]]} wins!`,
});

// ---- Odd or Even (two dice under the cup)
export const oddoreven = casinoEngine({
  rounds: 12, cols: 2, spinMs: 3000,
  spots: () => [{ id: 'odd', label: 'Odd (Han)', sub: 'pays 0.95:1', cls: 'cs-big' }, { id: 'even', label: 'Even (Chō)', sub: 'pays 0.95:1', cls: 'cs-big' }],
  outcome: () => [die(), die()],
  pays: (g, id) => (((g.out[0] + g.out[1]) % 2 === 0) === (id === 'even') ? 1.95 : 0),
  summary: g => `${g.out.join(' + ')} = ${g.out[0] + g.out[1]} · ${(g.out[0] + g.out[1]) % 2 ? 'odd' : 'even'}`,
});

// ---- Dice Pit (pass line, don't pass and one-roll bets, settled within the round)
export const dicepit = casinoEngine({
  rounds: 10, cols: 2, spinMs: 7000,
  spots: () => [{ id: 'pass', label: 'Pass line', sub: '1:1' }, { id: 'dont', label: 'Don’t pass', sub: '1:1 (12 pushes)' }, { id: 'field', label: 'Field', sub: '2,3,4,9,10,11,12 · 2 & 12 pay 2:1' }, { id: 'seven', label: 'Any seven', sub: 'one roll · 4:1' }, { id: 'craps', label: 'Any craps', sub: '2, 3, 12 · 7:1' }],
  outcome() {
    const rolls = [[die(), die()]], sum = r => r[0] + r[1];
    const first = sum(rolls[0]);
    if (![2, 3, 7, 11, 12].includes(first)) { let r; do { r = [die(), die()]; rolls.push(r); } while (sum(r) !== first && sum(r) !== 7 && rolls.length < 30); }
    return { rolls, first, point: [2, 3, 7, 11, 12].includes(first) ? null : first, last: sum(rolls[rolls.length - 1]) };
  },
  pays(g, id) {
    const o = g.out;
    const passWins = o.point == null ? [7, 11].includes(o.first) : o.last === o.point;
    if (id === 'pass') return passWins ? 2 : 0;
    if (id === 'dont') return o.point == null && o.first === 12 ? 1 : !passWins && !(o.point == null && [7, 11].includes(o.first)) ? 2 : 0;
    if (id === 'field') return [2, 12].includes(o.first) ? 3 : [3, 4, 9, 10, 11].includes(o.first) ? 2 : 0;
    if (id === 'seven') return o.first === 7 ? 5 : 0;
    return [2, 3, 12].includes(o.first) ? 8 : 0;
  },
  botSpots: (g, sp) => sp.slice(0, 2),
  summary: g => (g.out.point == null ? `Come-out roll ${g.out.first}` : `Point ${g.out.point} — ${g.out.last === 7 ? 'seven out' : 'point made'}`),
});

// ---- Peg Drop (each player's ball bounces down 8 rows of pegs)
export const PEG_PAY = [8, 3, 1.4, 0.7, 0.4, 0.7, 1.4, 3, 8];
export const pegdrop = casinoEngine({
  rounds: 10, cols: 1, spinMs: 4500,
  spots: () => [{ id: 'drop', label: 'Drop a ball', sub: 'edges pay 8×, middle 0.4×', cls: 'cs-big' }],
  outcome: g => Object.fromEntries(g.order.map(s => [s, Array.from({ length: 8 }, () => R(2))])),
  pays: (g, id, s) => (g.out[s] ? PEG_PAY[g.out[s].reduce((a, b) => a + b, 0)] : 0),
  summary: () => 'Balls dropped!',
});

// ---- In Between (bet the next card lands between two)
export const inbetween = casinoEngine({
  rounds: 10, cols: 1, spinMs: 3000,
  newRound(g) { let a, b; do { a = card(); b = card(); } while (a.r === b.r && a.s === b.s); g.pair = [a, b].sort((x, y) => x.r - y.r); },
  spots(g) {
    const gap = g.pair[1].r - g.pair[0].r - 1;
    if (gap < 0) return [{ id: 'pair', label: 'Three of a kind!', sub: 'pays 11:1', cls: 'cs-big' }];
    return [{ id: 'in', label: gap === 0 ? 'No gap — push' : `In between (${gap} card${gap > 1 ? 's' : ''})`, sub: gap === 0 ? '' : `pays ${gap === 1 ? 5 : gap === 2 ? 4 : gap === 3 ? 2 : 1}:1`, cls: 'cs-big', dis: gap === 0 }];
  },
  outcome: () => card(),
  pays(g, id) {
    const [a, b] = g.pair, c = g.out, gap = b.r - a.r - 1;
    if (id === 'pair') return c.r === a.r ? 12 : 0;
    return c.r > a.r && c.r < b.r ? (gap === 1 ? 6 : gap === 2 ? 5 : gap === 3 ? 3 : 2) : 0;
  },
  betInfo: g => `<p class="cs-pair">${cardTxt(g.pair[0])} … ${cardTxt(g.pair[1])}</p>`,
  summary: g => `${cardTxt(g.pair[0])} · ${cardTxt(g.out)} · ${cardTxt(g.pair[1])}`,
});

// ---- Casino War (your card against the dealer's)
export const casinowar = casinoEngine({
  rounds: 12, cols: 1, spinMs: 3000,
  spots: () => [{ id: 'war', label: 'Play a hand', sub: 'higher card wins 1:1 · tie pushes', cls: 'cs-big' }],
  outcome: g => ({ dealer: card(), you: Object.fromEntries(g.order.map(s => [s, card()])) }),
  pays: (g, id, s) => { const y = g.out.you[s].r, d = g.out.dealer.r; return y > d ? 2 : y === d ? 1 : 0; },
  summary: g => `Dealer shows ${cardTxt(g.out.dealer)}`,
});
