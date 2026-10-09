// Card games where your hand lives on your phone: Top Dog (President), Big Deuce (Big Two),
// Fool's Defense (Durak), Tonk, Thirty-One, Slap Stack, Speed, Pairs, Card Golf, Corner Kings.
import { base, shuffle, sfx, announce, left } from './party.js?v=68';
import { deck52, deckOf, SYM, SUITS, isRed, txt, cardEl, cardOpt } from './cardkit.js?v=68';

const R = n => Math.floor(Math.random() * n);
const nextOf = (g, s, skip = () => false) => { const o = g.order; let i = o.indexOf(s); for (let k = 0; k < o.length; k++) { i = (i + 1) % o.length; if (!skip(o[i])) return o[i]; } return s; };
const handHTML = h => `<div class="cdk-hand">${h.map(c => cardEl(c)).join('')}</div>`;
const winLow = g => { const lo = Math.min(...g.order.map(s => g.score[s])); g.winners = g.order.filter(s => g.score[s] === lo); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; };
const winHigh = g => { const hi = Math.max(...g.order.map(s => g.score[s])); g.winners = g.order.filter(s => g.score[s] === hi); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; };
// A small wrapper for "one player acts at a time" games.
function turnGame(E, extra = {}) {
  E.collecting = E.collecting || (() => false);
  E.turnSeat = E.turnSeat || (g => (g.phase === 'play' ? g.turn : -1));
  E.pending = E.pending || (g => (g.phase === 'play' ? [g.turn] : []));
  E.current = g => E.pending(g)[0] ?? -1;
  Object.assign(E, extra);
  return E;
}

// ---------------------------------------------------------------- Top Dog (President)
const PO = '3456789TJQKA2';
const pr = c => PO.indexOf(c[0]);
export const topdog = turnGame({
  createGame(s, p) { const g = base(s, p, { rounds: 5 }); g.round = 0; g.titles = null; deal(g); return g; },
});
function deal(g) {
  g.round++;
  const d = deck52(); g.hand = g.seats.map(() => []);
  let i = 0; while (d.length) { g.hand[g.order[i++ % g.order.length]].push(d.pop()); }
  for (const s of g.order) g.hand[s].sort((a, b) => pr(a) - pr(b));
  // The Underdog hands their two best cards to the Top Dog, who gives back two of their worst.
  if (g.titles) {
    const top = g.titles[0], under = g.titles[g.titles.length - 1];
    const best = g.hand[under].slice(-2), worst = g.hand[top].slice(0, 2);
    g.hand[under] = g.hand[under].slice(0, -2).concat(worst).sort((a, b) => pr(a) - pr(b));
    g.hand[top] = g.hand[top].slice(2).concat(best).sort((a, b) => pr(a) - pr(b));
    g.swap = { top, under, best, worst };
  } else g.swap = null;
  g.out = []; g.pile = null; g.passed = [];
  g.turn = g.titles ? g.titles[g.titles.length - 1] : g.order.find(s => g.hand[s].includes('3C')) ?? g.order[0];
  g.lastPlay = -1;
  g.phase = 'play';
  g.moveId++;
}
// Every legal play: a set of 1–4 cards of one rank, beating the pile (same size, higher rank).
topdog.plays = (g, s) => {
  const by = {}; for (const c of g.hand[s]) (by[c[0]] = by[c[0]] || []).push(c);
  const out = [];
  for (const [r, cs] of Object.entries(by)) for (let n = 1; n <= cs.length; n++) if (!g.pile || (n === g.pile.cards.length && PO.indexOf(r) > PO.indexOf(g.pile.cards[0][0]))) out.push(cs.slice(0, n));
  return out.sort((a, b) => a.length - b.length || pr(a[0]) - pr(b[0]));
};
topdog.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  const live = () => g.order.filter(s => !g.out.includes(s));
  if (a.type === 'pass') {
    if (!g.pile) return 'You lead — play something';
    g.passed.push(seat); announce(g, seat, 'Pass');
  } else {
    const cards = String(a.v || '').split(',').filter(Boolean);
    if (!topdog.plays(g, seat).some(p => p.join(',') === cards.join(','))) return 'You can’t play that';
    for (const c of cards) g.hand[seat].splice(g.hand[seat].indexOf(c), 1);
    g.pile = { cards, s: seat }; g.lastPlay = seat; g.passed = [];
    sfx(g, 'thud');
    if (!g.hand[seat].length) { g.out.push(seat); announce(g, seat, g.out.length === 1 ? 'Top Dog! 🐶' : `Out #${g.out.length}`); }
  }
  if (live().length <= 1) {
    g.titles = [...g.out, ...live()];
    g.titles.forEach((s, i) => { g.score[s] += g.order.length - 1 - i; });
    g.phase = 'roundEnd'; g.endAt = Date.now(); g.moveId++; return null;
  }
  // Everyone else passed: the pile clears and the last player to play leads (or the next one in if they're out).
  let n = nextOf(g, seat, x => g.out.includes(x) || g.passed.includes(x));
  if (g.pile && (n === g.lastPlay || g.order.filter(x => !g.out.includes(x) && !g.passed.includes(x) && x !== g.lastPlay).length === 0)) {
    g.pile = null; g.passed = [];
    n = g.out.includes(g.lastPlay) ? nextOf(g, g.lastPlay, x => g.out.includes(x)) : g.lastPlay;
  }
  g.turn = n; g.moveId++;
  return null;
};
topdog.tick = g => (g.phase === 'roundEnd' ? { ms: Math.max(0, g.endAt + 6000 - Date.now()), run: () => (g.round >= g.settings.rounds ? winHigh(g) : deal(g)) } : null);
topdog.botAction = (g, s) => { const P = topdog.plays(g, s); if (!P.length) return { type: 'pass' }; const p = g.pile ? P[0] : P.sort((a, b) => b.length - a.length || pr(a[0]) - pr(b[0]))[0]; return g.pile && pr(p[0]) >= 11 && Math.random() < 0.4 ? { type: 'pass' } : { type: 'pick', v: p.join(',') }; };
const TITLES = ['Top Dog 🐶', 'Second Dog', 'Pup', 'Stray', 'Mutt', 'Scruff', 'Underdog 🦴'];
topdog.titleOf = (g, s) => { const i = g.titles?.indexOf(s); if (i == null || i < 0) return ''; return i === 0 ? TITLES[0] : i === g.titles.length - 1 ? TITLES[6] : TITLES[Math.min(i, 5)]; };
topdog.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Points', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
  const h = g.hand[seat] || [];
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Top Dog overall!' : 'Game over', sub: '' };
  else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: topdog.titleOf(g, seat) || 'Round over', sub: '' };
  else if (g.out.includes(seat)) v.ui = { k: 'wait', title: `You’re out — #${g.out.indexOf(seat) + 1}`, sub: 'Watch the rest' };
  else if (g.turn === seat) { const P = topdog.plays(g, seat); v.ui = { k: 'pick', key: 'p' + g.round + ':' + h.length + ':' + (g.pile ? g.pile.cards.join('') : ''), title: g.pile ? `Beat ${g.pile.cards.length > 1 ? `${g.pile.cards.length} × ` : ''}${txt(g.pile.cards[0]).slice(0, -1)}` : 'Lead anything', sub: g.swap && (g.swap.top === seat || g.swap.under === seat) ? `Swapped: gave ${(g.swap.top === seat ? g.swap.worst : g.swap.best).map(txt).join(' ')}` : '2s are highest', myturn: true, buzz: true, html: handHTML(h), grid: 3, options: P.map(p => ({ v: p.join(','), label: p.map(txt).join(' '), sub: ['Single', 'Pair', 'Three', 'Four'][p.length - 1] })), buttons: g.pile ? [{ type: 'pass', label: 'Pass' }] : null }; }
  else v.ui = { k: 'wait', title: `@${g.turn}@ to play`, sub: g.pile ? `Pile: ${g.pile.cards.map(txt).join(' ')}` : 'New lead', html: handHTML(h) };
  return v;
};

// ---------------------------------------------------------------- Big Deuce (Big Two)
const SO = 'DCHS';   // suit order, low to high
const bv = c => PO.indexOf(c[0]) * 4 + SO.indexOf(c[1]);
function combo(cs) {
  const n = cs.length, rs = cs.map(c => PO.indexOf(c[0])).sort((a, b) => a - b), top = Math.max(...cs.map(bv));
  if (n === 1) return { t: 1, k: top };
  if (n === 2) return rs[0] === rs[1] ? { t: 2, k: top } : null;
  if (n === 3) return rs[0] === rs[2] ? { t: 3, k: top } : null;
  if (n !== 5) return null;
  const flush = cs.every(c => c[1] === cs[0][1]), straight = rs.every((r, i) => !i || r === rs[i - 1] + 1) && rs[4] <= 11;
  const cnt = {}; rs.forEach(r => { cnt[r] = (cnt[r] || 0) + 1; }); const g2 = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  if (straight && flush) return { t: 5, r: 5, k: top };
  if (g2[0][1] === 4) return { t: 5, r: 4, k: Number(g2[0][0]) };
  if (g2[0][1] === 3 && g2[1][1] === 2) return { t: 5, r: 3, k: Number(g2[0][0]) };
  if (flush) return { t: 5, r: 2, k: top };
  if (straight) return { t: 5, r: 1, k: top };
  return null;
}
const beats = (a, b) => !b || (a.t === b.t && (a.t < 5 ? a.k > b.k : a.r > b.r || (a.r === b.r && a.k > b.k)));
export const bigdeuce = turnGame({
  createGame(s, p) { const g = base(s, p, { rounds: 4 }); g.round = 0; bdDeal(g); return g; },
});
function bdDeal(g) {
  g.round++;
  const d = deck52(); g.hand = g.seats.map(() => []);
  let i = 0; while (d.length && i < 13 * g.order.length) { g.hand[g.order[i++ % g.order.length]].push(d.pop()); }
  for (const s of g.order) g.hand[s].sort((a, b) => bv(a) - bv(b));
  g.turn = g.order.find(s => g.hand[s].includes('3D')) ?? g.order.find(s => g.hand[s].some(c => bv(c) === Math.min(...g.order.flatMap(x => g.hand[x].map(bv)))));
  g.first = true; g.pile = null; g.passed = []; g.lastPlay = -1; g.phase = 'play'; g.moveId++;
}
bigdeuce.plays = (g, s) => {
  const h = g.hand[s], out = [];
  const add = cs => { const c = combo(cs); if (c && beats(c, g.pile?.c) && (!g.first || cs.some(x => bv(x) === bv(h[0])))) out.push(cs); };
  const want = g.pile ? g.pile.cards.length : 0;
  if (!want || want === 1) h.forEach(c => add([c]));
  if (!want || want === 2) for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) add([h[i], h[j]]);
  if (!want || want === 3) for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) for (let k = j + 1; k < h.length; k++) add([h[i], h[j], h[k]]);
  if (!want || want === 5) { const pick5 = (st, cur) => { if (cur.length === 5) return add(cur); for (let i = st; i < h.length; i++) pick5(i + 1, [...cur, h[i]]); }; if (h.length <= 13) pick5(0, []); }
  return out.slice(0, 40);
};
bigdeuce.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  if (a.type === 'pass') { if (!g.pile) return 'You lead — play something'; g.passed.push(seat); announce(g, seat, 'Pass'); }
  else {
    const cards = String(a.v || '').split(',').filter(Boolean);
    if (!bigdeuce.plays(g, seat).some(p => p.join(',') === cards.join(','))) return 'That doesn’t beat the pile';
    for (const c of cards) g.hand[seat].splice(g.hand[seat].indexOf(c), 1);
    g.pile = { cards, c: combo(cards), s: seat }; g.lastPlay = seat; g.passed = []; g.first = false; sfx(g, 'thud');
    if (!g.hand[seat].length) {
      g.gain = {};
      for (const s of g.order) { const n = g.hand[s].length; g.gain[s] = n >= 10 ? n * 2 : n; g.score[s] += g.gain[s]; }
      g.roundWin = seat; g.phase = 'roundEnd'; g.endAt = Date.now(); announce(g, seat, 'Out! 🎉'); g.moveId++; return null;
    }
  }
  let n = nextOf(g, seat, x => g.passed.includes(x));
  if (n === g.lastPlay) { g.pile = null; g.passed = []; }
  g.turn = n; g.moveId++;
  return null;
};
bigdeuce.tick = g => (g.phase === 'roundEnd' ? { ms: Math.max(0, g.endAt + 6000 - Date.now()), run: () => (g.round >= g.settings.rounds ? winLow(g) : bdDeal(g)) } : null);
bigdeuce.botAction = (g, s) => { const P = bigdeuce.plays(g, s); if (!P.length) return { type: 'pass' }; return { type: 'pick', v: (g.pile ? P[0] : P.sort((a, b) => b.length - a.length)[0]).join(',') }; };
bigdeuce.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Penalty', g.score[seat] ?? 0], ['Cards', g.hand[seat]?.length ?? 0]] };
  const h = g.hand[seat] || [];
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Fewest penalty points!' : 'Game over', sub: '' };
  else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: g.roundWin === seat ? 'You went out! 🎉' : `+${g.gain[seat]} penalty`, sub: '' };
  else if (g.turn === seat) { const P = bigdeuce.plays(g, seat); v.ui = { k: 'pick', key: 'p' + g.round + ':' + h.length + ':' + (g.pile ? g.pile.cards.join('') : '') + g.passed.length, title: g.pile ? `Beat: ${g.pile.cards.map(txt).join(' ')}` : g.first ? 'Lead — must include your lowest card' : 'Lead anything', sub: 'Singles, pairs, threes or five-card hands', myturn: true, buzz: true, html: handHTML(h), options: P.map(p => ({ v: p.join(','), label: p.map(txt).join(' ') })), buttons: g.pile ? [{ type: 'pass', label: 'Pass' }] : null }; }
  else v.ui = { k: 'wait', title: `@${g.turn}@ to play`, sub: g.pile ? `Pile: ${g.pile.cards.map(txt).join(' ')}` : 'New lead', html: handHTML(h) };
  return v;
};

// ---------------------------------------------------------------- Fool's Defense (Durak)
const DO = '6789TJQKA', dv = c => DO.indexOf(c[0]);
export const foolsdefense = turnGame({
  createGame(s, p) {
    const g = base(s, p, {});
    g.deck = deckOf(DO); g.hand = g.seats.map(() => []);
    for (let k = 0; k < 6; k++) for (const x of g.order) g.hand[x].push(g.deck.pop());
    g.trumpCard = g.deck[0]; g.trump = g.trumpCard[1];
    g.out = [];
    const lowestTrump = s2 => Math.min(99, ...g.hand[s2].filter(c => c[1] === g.trump).map(dv));
    g.attacker = [...g.order].sort((a, b) => lowestTrump(a) - lowestTrump(b))[0];
    newBout(g);
    return g;
  },
  turnSeat: g => (g.phase === 'attack' ? g.attacker : g.phase === 'defend' ? g.defender : -1),
  pending: g => (g.phase === 'attack' ? [g.attacker] : g.phase === 'defend' ? [g.defender] : []),
});
const alive = g => g.order.filter(s => !g.out.includes(s));
function newBout(g) { g.defender = nextOf(g, g.attacker, x => g.out.includes(x)); g.table = []; g.phase = 'attack'; g.moveId++; }
const beatsD = (g, a, d) => (d[1] === a[1] && dv(d) > dv(a)) || (d[1] === g.trump && a[1] !== g.trump);
function refill(g, order) { for (const s of order) while (g.hand[s].length < 6 && g.deck.length) g.hand[s].push(g.deck.pop()); }
function endBout(g, took) {
  if (took) g.hand[g.defender].push(...g.table.flatMap(p => [p.a, p.d].filter(Boolean)));
  refill(g, [g.attacker, ...g.order.filter(s => s !== g.attacker && s !== g.defender), g.defender]);
  for (const s of g.order) if (!g.hand[s].length && !g.deck.length && !g.out.includes(s)) g.out.push(s);
  if (alive(g).length <= 1) { g.fool = alive(g)[0] ?? -1; g.order.forEach(s => { g.score[s] = s === g.fool ? 0 : 1; }); g.winners = g.order.filter(s => s !== g.fool); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; return; }
  g.attacker = took ? nextOf(g, g.defender, x => g.out.includes(x)) : (g.out.includes(g.defender) ? nextOf(g, g.defender, x => g.out.includes(x)) : g.defender);
  sfx(g, took ? 'sad' : 'chime');
  newBout(g);
}
foolsdefense.applyAction = (g, seat, a) => {
  if (!a) return 'Nothing to do';
  if (g.phase === 'attack') {
    if (seat !== g.attacker) return 'Wait — you’re not attacking';
    if (a.type === 'done') { if (!g.table.length || g.table.some(p => !p.d)) return 'Attack with a card first'; return endBout(g, false), null; }
    const c = String(a.v);
    if (!g.hand[seat].includes(c)) return 'Play a card from your hand';
    const ranks = g.table.flatMap(p => [p.a, p.d]).filter(Boolean).map(x => x[0]);
    if (g.table.length && !ranks.includes(c[0])) return 'Add only ranks already on the table';
    if (g.table.length >= Math.min(6, g.hand[g.defender].length + g.table.filter(p => !p.d).length)) return 'No more attacks this round';
    g.hand[seat].splice(g.hand[seat].indexOf(c), 1);
    g.table.push({ a: c, d: null });
    g.phase = 'defend'; g.moveId++; return null;
  }
  if (g.phase === 'defend') {
    if (seat !== g.defender) return 'Wait — you’re not defending';
    if (a.type === 'take') { announce(g, seat, 'Takes the cards'); return endBout(g, true), null; }
    const c = String(a.v), open = g.table.find(p => !p.d);
    if (!g.hand[seat].includes(c)) return 'Play a card from your hand';
    if (!beatsD(g, open.a, c)) return 'That doesn’t beat it';
    g.hand[seat].splice(g.hand[seat].indexOf(c), 1); open.d = c;
    g.phase = 'attack'; g.moveId++; return null;
  }
  return 'Not now';
};
foolsdefense.tick = () => null;
foolsdefense.botAction = (g, s) => {
  if (g.phase === 'attack') {
    const ranks = g.table.flatMap(p => [p.a, p.d]).filter(Boolean).map(x => x[0]);
    const ok = g.hand[s].filter(c => !g.table.length || ranks.includes(c[0])).filter(c => c[1] !== g.trump || g.table.length === 0).sort((a, b) => dv(a) - dv(b));
    return ok.length && g.table.length < 4 && g.table.length < g.hand[g.defender].length ? { type: 'pick', v: ok[0] } : g.table.length ? { type: 'done' } : { type: 'pick', v: [...g.hand[s]].sort((a, b) => dv(a) - dv(b))[0] };
  }
  const open = g.table.find(p => !p.d);
  const b = g.hand[s].filter(c => beatsD(g, open.a, c)).sort((a, c) => (a[1] === g.trump) - (c[1] === g.trump) || dv(a) - dv(c));
  return b.length ? { type: 'pick', v: b[0] } : { type: 'take' };
};
foolsdefense.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Trump', SYM[g.trump]], ['Deck', g.deck.length]] };
  const h = g.hand[seat] || [];
  if (g.phase === 'over') { v.ui = { k: 'wait', title: g.fool === seat ? '🤡 You’re the Fool!' : '🏆 Not the Fool!', sub: '' }; return v; }
  if (g.out.includes(seat)) { v.ui = { k: 'wait', title: 'You’re out of cards — safe! 🎉', sub: '' }; return v; }
  const ranks = g.table.flatMap(p => [p.a, p.d]).filter(Boolean).map(x => x[0]);
  if (g.phase === 'attack' && seat === g.attacker) v.ui = { k: 'pick', key: 'a' + g.moveId, title: g.table.length ? 'Add another attack card… or end the attack' : `Attack @${g.defender}@`, sub: g.table.length ? 'Only ranks already on the table' : 'Play any card', myturn: true, buzz: true, cards: true, grid: 6, options: h.map(c => cardOpt(c, { dis: g.table.length > 0 && !ranks.includes(c[0]) })), buttons: g.table.length ? [{ type: 'done', label: 'End attack ✓', go: true }] : null };
  else if (g.phase === 'defend' && seat === g.defender) { const open = g.table.find(p => !p.d); v.ui = { k: 'pick', key: 'd' + g.moveId, title: `Beat ${txt(open.a)}`, sub: `Higher of the same suit, or a trump ${SYM[g.trump]}`, myturn: true, buzz: true, cards: true, grid: 6, options: h.map(c => cardOpt(c, { dis: !beatsD(g, open.a, c) })), buttons: [{ type: 'take', label: 'Take the cards' }] }; }
  else v.ui = { k: 'wait', title: `@${g.attacker}@ attacks @${g.defender}@`, sub: '', html: handHTML(h) };
  return v;
};

// ---------------------------------------------------------------- Thirty-One
const val31 = c => ('JQKT'.includes(c[0]) ? 10 : c[0] === 'A' ? 11 : Number(c[0]));
export const best31 = h => Math.max(...[...SUITS].map(s => h.filter(c => c[1] === s).reduce((t, c) => t + val31(c), 0)));
export const thirtyone = turnGame({
  createGame(s, p) { const g = base(s, p, {}); g.lives = g.seats.map(x => (x ? 3 : 0)); g.round = 0; deal31(g); return g; },
});
function deal31(g) {
  g.round++; g.deck = deck52(); g.hand = g.seats.map(() => []);
  for (let k = 0; k < 3; k++) for (const s of g.order) if (g.lives[s] > 0) g.hand[s].push(g.deck.pop());
  g.discard = [g.deck.pop()]; g.knock = -1; g.drawn = null;
  g.turn = g.order.filter(s => g.lives[s] > 0)[(g.round - 1) % g.order.filter(s => g.lives[s] > 0).length];
  g.phase = 'play'; g.moveId++;
}
function end31(g, instant) {
  const P = g.order.filter(s => g.lives[s] > 0), sc = Object.fromEntries(P.map(s => [s, best31(g.hand[s])]));
  const lo = Math.min(...P.map(s => sc[s]));
  g.losers = instant ? P.filter(s => s !== instant.s) : P.filter(s => sc[s] === lo);
  // A knocker who has the lowest hand loses two lives.
  for (const s of g.losers) g.lives[s] -= !instant && s === g.knock ? 2 : 1;
  for (const s of g.order) if (g.lives[s] < 0) g.lives[s] = 0;
  g.sc = sc; g.phase = 'roundEnd'; g.endAt = Date.now(); sfx(g, 'chime'); g.moveId++;
}
thirtyone.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  const advance = () => {
    g.drawn = null;
    if (best31(g.hand[seat]) === 31) { announce(g, seat, '31! 💥'); return end31(g, { s: seat }); }
    g.turn = nextOf(g, seat, x => g.lives[x] <= 0);
    if (g.turn === g.knock) return end31(g);
    g.moveId++;
  };
  if (!g.drawn) {
    if (a.type === 'knock') { if (g.knock >= 0) return 'Someone already knocked'; g.knock = seat; announce(g, seat, 'Knock! ✊'); g.turn = nextOf(g, seat, x => g.lives[x] <= 0); g.moveId++; return null; }
    if (a.type === 'deck') { g.drawn = g.deck.pop() || g.discard.shift(); g.hand[seat].push(g.drawn); g.moveId++; return null; }
    if (a.type === 'discard') { g.drawn = g.discard.pop(); g.hand[seat].push(g.drawn); g.moveId++; return null; }
    return 'Draw first';
  }
  if (a.type === 'pick') { const c = String(a.v); if (!g.hand[seat].includes(c)) return 'Discard one of your cards'; g.hand[seat].splice(g.hand[seat].indexOf(c), 1); g.discard.push(c); advance(); return null; }
  return 'Discard a card';
};
thirtyone.tick = g => (g.phase === 'roundEnd' ? { ms: Math.max(0, g.endAt + 6000 - Date.now()), run: () => { if (g.order.filter(s => g.lives[s] > 0).length <= 1) { g.order.forEach(s => { g.score[s] = g.lives[s]; }); return winHigh(g); } deal31(g); } } : null);
thirtyone.botAction = (g, s) => {
  if (!g.drawn) { if (g.knock < 0 && best31(g.hand[s]) >= 25 + R(4)) return { type: 'knock' }; const top = g.discard[g.discard.length - 1]; return best31([...g.hand[s], top]) - val31(top) * 0 > best31(g.hand[s]) + 3 ? { type: 'discard' } : { type: 'deck' }; }
  let best = null; for (const c of g.hand[s]) { const r = best31(g.hand[s].filter(x => x !== c)); if (!best || r > best.r) best = { c, r }; }
  return { type: 'pick', v: best.c };
};
thirtyone.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Lives', '❤️'.repeat(g.lives[seat] || 0) || '💀'], ['Your best', g.hand[seat]?.length ? best31(g.hand[seat]) : 0]] };
  const h = g.hand[seat] || [], top = g.discard[g.discard.length - 1];
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Last one standing!' : 'Game over', sub: '' };
  else if (!g.lives[seat]) v.ui = { k: 'wait', title: 'You’re out 💀', sub: '' };
  else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: g.losers.includes(seat) ? 'You lose a life 💔' : 'Safe!', sub: `Your hand: ${g.sc[seat]}` };
  else if (g.turn !== seat) v.ui = { k: 'wait', title: `@${g.turn}@’s turn`, sub: g.knock >= 0 ? `@${g.knock}@ knocked — last round!` : 'Get as close to 31 in one suit', html: handHTML(h) };
  else if (!g.drawn) v.ui = { k: 'buttons', key: 'd' + g.moveId, title: 'Draw a card', sub: `Discard pile: ${txt(top)}`, myturn: true, buzz: true, html: handHTML(h), buttons: [{ type: 'deck', label: 'From the deck', go: true }, { type: 'discard', label: `Take ${txt(top)}` }, { type: 'knock', label: 'Knock ✊', dis: g.knock >= 0 }] };
  else v.ui = { k: 'pick', key: 'x' + g.moveId, title: 'Discard one', sub: `You drew ${txt(g.drawn)}`, myturn: true, cards: true, grid: 4, options: h.map(c => cardOpt(c)) };
  return v;
};

// ---------------------------------------------------------------- Tonk (quick rummy: low hand or go out)
const tonkVal = c => ('JQKT'.includes(c[0]) ? 10 : c[0] === 'A' ? 1 : Number(c[0]));
const RUNORD = 'A23456789TJQK';
function spreadOk(cs) {
  if (cs.length < 3) return false;
  if (cs.every(c => c[0] === cs[0][0])) return true;
  if (!cs.every(c => c[1] === cs[0][1])) return false;
  const r = cs.map(c => RUNORD.indexOf(c[0])).sort((a, b) => a - b);
  return r.every((x, i) => !i || x === r[i - 1] + 1);
}
export const tonk = turnGame({
  createGame(s, p) { const g = base(s, p, { rounds: 5 }); g.round = 0; dealTonk(g); return g; },
});
function dealTonk(g) {
  g.round++; g.deck = deck52(); g.hand = g.seats.map(() => []);
  for (let k = 0; k < 5; k++) for (const s of g.order) g.hand[s].push(g.deck.pop());
  g.discard = [g.deck.pop()]; g.spreads = []; g.drawn = false; g.sel = [];
  g.turn = g.order[(g.round - 1) % g.order.length]; g.phase = 'play'; g.moveId++;
}
function endTonk(g, w, how) {
  g.res = { w, how };
  g.gain = {}; for (const s of g.order) { g.gain[s] = s === w ? 0 : g.hand[s].reduce((t, c) => t + tonkVal(c), 0); g.score[s] += g.gain[s]; }
  g.phase = 'roundEnd'; g.endAt = Date.now(); sfx(g, 'chime'); g.moveId++;
}
tonk.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  const total = s => g.hand[s].reduce((t, c) => t + tonkVal(c), 0);
  if (!g.drawn) {
    if (a.type === 'drop') { const lo = Math.min(...g.order.map(total)); const w = total(seat) <= lo ? seat : g.order.filter(s => total(s) === lo)[0]; announce(g, seat, 'Drop!'); return endTonk(g, w, total(seat) <= lo ? 'dropped lowest' : `caught dropping — @${w}@ was lower`), null; }
    if (a.type === 'deck' || a.type === 'discard') { g.hand[seat].push(a.type === 'deck' ? (g.deck.pop() || g.discard.shift()) : g.discard.pop()); g.drawn = true; g.moveId++; return null; }
    return 'Draw or drop first';
  }
  if (a.type === 'toggle') { const c = typeof a.v === 'number' ? g.hand[seat][a.v] : String(a.v); if (!g.hand[seat].includes(c)) return 'Pick your cards'; g.sel = g.sel.includes(c) ? g.sel.filter(x => x !== c) : [...g.sel, c]; g.moveId++; return null; }
  if (a.type === 'spread') { if (!spreadOk(g.sel)) return 'Three or more of a kind, or a run in one suit'; for (const c of g.sel) g.hand[seat].splice(g.hand[seat].indexOf(c), 1); g.spreads.push({ s: seat, cards: g.sel }); g.sel = []; announce(g, seat, 'Spread!'); if (!g.hand[seat].length) return endTonk(g, seat, 'went out'), null; g.moveId++; return null; }
  if (a.type === 'hit') { if (g.sel.length !== 1) return 'Pick one card to add'; const c = g.sel[0], sp = g.spreads.find(x => spreadOk([...x.cards, c])); if (!sp) return 'It doesn’t fit any spread'; sp.cards.push(c); g.hand[seat].splice(g.hand[seat].indexOf(c), 1); g.sel = []; if (!g.hand[seat].length) return endTonk(g, seat, 'went out'), null; g.moveId++; return null; }
  if (a.type === 'throw') {
    if (g.sel.length !== 1) return 'Pick one card to discard';
    const c = g.sel[0]; g.hand[seat].splice(g.hand[seat].indexOf(c), 1); g.discard.push(c); g.sel = []; g.drawn = false;
    if (!g.hand[seat].length) return endTonk(g, seat, 'went out'), null;
    if (!g.deck.length) { const lo = Math.min(...g.order.map(total)); return endTonk(g, g.order.find(s => total(s) === lo), 'deck ran out — lowest hand'), null; }
    g.turn = nextOf(g, seat); g.moveId++; return null;
  }
  return 'Not now';
};
tonk.tick = g => (g.phase === 'roundEnd' ? { ms: Math.max(0, g.endAt + 6000 - Date.now()), run: () => (g.round >= g.settings.rounds ? winLow(g) : dealTonk(g)) } : null);
tonk.botAction = (g, s) => {
  const h = g.hand[s];
  if (!g.drawn) return h.reduce((t, c) => t + tonkVal(c), 0) <= 6 ? { type: 'drop' } : { type: 'deck' };
  // Spread any three of a kind, else throw the highest card.
  const by = {}; for (const c of h) (by[c[0]] = by[c[0]] || []).push(c);
  const set = Object.values(by).find(x => x.length >= 3);
  if (set && !g.sel.length) { g.sel = set; return { type: 'spread' }; }
  const hi = [...h].sort((a, b) => tonkVal(b) - tonkVal(a))[0];
  g.sel = [hi]; return { type: 'throw' };
};
tonk.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Penalty', g.score[seat] ?? 0], ['Hand', g.hand[seat]?.reduce((t, c) => t + tonkVal(c), 0) ?? 0]] };
  const h = g.hand[seat] || [], top = g.discard[g.discard.length - 1];
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Lowest total!' : 'Game over', sub: '' };
  else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: g.res.w === seat ? 'You win the hand! 🎉' : `+${g.gain[seat]} penalty`, sub: `@${g.res.w}@ ${g.res.how}` };
  else if (g.turn !== seat) v.ui = { k: 'wait', title: `@${g.turn}@’s turn`, sub: '', html: handHTML(h) };
  else if (!g.drawn) v.ui = { k: 'buttons', key: 'd' + g.moveId, title: 'Draw — or drop if you think you’re lowest', sub: `Discard: ${top ? txt(top) : '—'}`, myturn: true, buzz: true, html: handHTML(h), buttons: [{ type: 'deck', label: 'Draw from deck', go: true }, { type: 'discard', label: `Take ${top ? txt(top) : ''}`, dis: !top }, { type: 'drop', label: 'Drop (call lowest)' }] };
  else v.ui = { k: 'toggles', key: 't' + g.round + ':' + h.length + ':' + g.spreads.length + ':' + g.sel.join(''), title: 'Spread, hit, then discard one', sub: 'Tap cards to select', myturn: true, cards: true, grid: 6, options: h.map((c, i) => cardOpt(c, { v: i, on: g.sel.includes(c) })), buttons: [{ type: 'spread', label: 'Spread' }, { type: 'hit', label: 'Hit a spread' }, { type: 'throw', label: 'Discard ✓', go: true }] };
  return v;
};

// ---------------------------------------------------------------- Slap Stack (Egyptian Ratscrew)
const FACE_CH = { J: 1, Q: 2, K: 3, A: 4 };
export const slapstack = {
  createGame(s, p) {
    const g = base(s, p, {});
    const d = deck52(); g.pile = g.seats.map(() => []);
    let i = 0; while (d.length) g.pile[g.order[i++ % g.order.length]].push(d.pop());
    g.center = []; g.turn = g.order[0]; g.challenge = null; g.phase = 'play'; g.lastSlap = null;
    return g;
  },
  collecting: () => false,
  turnSeat: g => (g.phase === 'play' ? g.turn : -1),
};
const liveSS = g => g.order.filter(s => g.pile[s].length > 0);
slapstack.slappable = g => { const c = g.center, n = c.length; return n >= 2 && (c[n - 1][0] === c[n - 2][0] || (n >= 3 && c[n - 1][0] === c[n - 3][0])); };
slapstack.pending = g => (g.phase !== 'play' ? [] : slapstack.slappable(g) ? liveSS(g) : [g.turn]);
slapstack.current = g => slapstack.pending(g)[0] ?? -1;
slapstack.botDelay = g => (slapstack.slappable(g) ? 700 + Math.random() * 1500 : 900);
function takeCenter(g, s, why) { g.pile[s].unshift(...g.center.reverse()); g.center = []; g.challenge = null; g.turn = s; announce(g, s, why); sfx(g, 'chime'); checkSS(g); }
function checkSS(g) { const L = liveSS(g); if (L.length <= 1) { g.order.forEach(s => { g.score[s] = g.pile[s].length; }); g.winners = L; g.winner = L[0]; g.phase = 'over'; } g.moveId++; }
slapstack.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play') return 'Not now';
  if (a.type === 'slap') {
    if (!g.pile[seat].length && !slapstack.slappable(g)) return 'You’re out';
    if (slapstack.slappable(g)) { g.lastSlap = { s: seat, ok: true }; return takeCenter(g, seat, 'SLAP! 🖐️'), null; }
    // A wrong slap burns a card to the bottom of the pile.
    if (g.pile[seat].length) { g.center.unshift(g.pile[seat].pop()); g.lastSlap = { s: seat, ok: false }; announce(g, seat, 'Bad slap — burn!'); g.moveId++; }
    return null;
  }
  if (a.type !== 'flip' || seat !== g.turn) return "It's not your turn";
  const c = g.pile[seat].pop();
  g.center.push(c);
  sfx(g, 'thud');
  if (FACE_CH[c[0]]) { g.challenge = { s: seat, left: FACE_CH[c[0]] }; g.turn = nextOf(g, seat, x => !g.pile[x].length); }
  else if (g.challenge) { g.challenge.left--; if (g.challenge.left <= 0) { g.collectAt = Date.now(); g.collector = g.challenge.s; } }
  else g.turn = nextOf(g, seat, x => !g.pile[x].length);
  if (!g.pile[seat].length && g.turn === seat) g.turn = nextOf(g, seat, x => !g.pile[x].length);
  checkSS(g);
  return null;
};
slapstack.tick = g => (g.phase === 'play' && g.collector != null ? { ms: Math.max(0, g.collectAt + 1600 - Date.now()), run: () => { const s = g.collector; g.collector = null; if (g.challenge && g.challenge.left <= 0) takeCenter(g, s, 'Takes the pile'); } } : null);
slapstack.botAction = (g, s) => (slapstack.slappable(g) ? { type: 'slap' } : s === g.turn && g.collector == null ? { type: 'flip' } : null);
slapstack.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Your cards', g.pile[seat]?.length ?? 0], ['Pile', g.center.length]] };
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You won every card!' : 'Game over', sub: '' };
  else if (!g.pile[seat].length) v.ui = { k: 'buttons', key: 'out', title: 'Out of cards!', sub: 'Slap your way back in on a double or sandwich', buttons: [{ type: 'slap', label: 'SLAP!', icon: '🖐️', cls: 'pp-huge' }] };
  else v.ui = { k: 'buttons', key: 'ss' + (g.turn === seat ? 't' : 'w'), title: g.turn === seat ? (g.challenge ? `Face card! ${g.challenge.left} chance${g.challenge.left > 1 ? 's' : ''} to beat it` : 'Your flip') : `@${g.turn}@ is flipping`, sub: 'Slap doubles (7-7) or sandwiches (7-K-7)!', myturn: g.turn === seat, buttons: [{ type: 'flip', label: 'Flip', icon: '🂠', go: true, dis: g.turn !== seat || g.collector != null }, { type: 'slap', label: 'SLAP!', icon: '🖐️', cls: 'ss-slap' }] };
  return v;
};

// ---------------------------------------------------------------- Speed (two players, real time)
const SPO = 'A23456789TJQK', sp = c => SPO.indexOf(c[0]);
const adj = (a, b) => { const d = Math.abs(sp(a) - sp(b)); return d === 1 || d === 12; };
export const speed = {
  createGame(s, p) {
    const g = base(s, p, {});
    const d = deck52();
    g.stock = g.seats.map(() => []); g.hand = g.seats.map(() => []);
    for (const x of g.order) { g.stock[x] = d.splice(0, 15); g.hand[x] = g.stock[x].splice(0, 5); }
    g.side = [d.splice(0, 5), d.splice(0, 5)]; g.center = [g.side[0].pop(), g.side[1].pop()];
    g.phase = 'ready'; g.readyAt = Date.now();
    return g;
  },
  collecting: () => false, turnSeat: () => -1,
};
const canPlay = (g, s) => g.hand[s].some(c => g.center.some(t => adj(c, t)));
speed.pending = g => (g.phase === 'play' ? g.order.filter(s => canPlay(g, s)) : []);
speed.current = g => speed.pending(g)[0] ?? -1;
speed.botDelay = () => 1300 + Math.random() * 1800;
function speedStuck(g) {
  if (g.order.some(s => canPlay(g, s))) return;
  // Nobody can move: turn over a new card from each side stack (reshuffle if needed).
  if (!g.side[0].length) { const all = shuffle(g.center.slice(0)); g.side = [all.slice(0, Math.ceil(all.length / 2)), all.slice(Math.ceil(all.length / 2))]; }
  g.center = [g.side[0].pop() || g.center[0], g.side[1].pop() || g.center[1]];
  announce(g, -1, 'Stuck — new cards!');
}
speed.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play' || a.type !== 'pick') return 'Not now';
  const [c, pile] = String(a.v).split('@');
  const i = Number(pile);
  if (!g.hand[seat].includes(c)) return 'Play from your hand';
  if (!(i === 0 || i === 1) || !adj(c, g.center[i])) return 'Must be one higher or lower';
  g.hand[seat].splice(g.hand[seat].indexOf(c), 1); g.center[i] = c;
  if (g.stock[seat].length && g.hand[seat].length < 5) g.hand[seat].push(g.stock[seat].pop());
  sfx(g, 'thud');
  if (!g.hand[seat].length) { g.order.forEach(s => { g.score[s] = s === seat ? 1 : 0; }); g.winners = [seat]; g.winner = seat; g.phase = 'over'; g.moveId++; return null; }
  speedStuck(g);
  g.moveId++;
  return null;
};
speed.tick = g => (g.phase === 'ready' ? { ms: Math.max(0, g.readyAt + 3000 - Date.now()), run: () => { g.phase = 'play'; speedStuck(g); g.moveId++; } } : null);
speed.botAction = (g, s) => { for (const c of g.hand[s]) for (const i of [0, 1]) if (adj(c, g.center[i])) return { type: 'pick', v: `${c}@${i}` }; return null; };
speed.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Left', (g.hand[seat]?.length ?? 0) + (g.stock[seat]?.length ?? 0)], ['Piles', g.center.map(txt).join(' ')]] };
  if (g.phase === 'over') v.ui = { k: 'wait', title: g.winner === seat ? '🏆 Fastest hands!' : 'Too slow!', sub: '' };
  else if (g.phase === 'ready') v.ui = { k: 'wait', key: 'r', buzz: true, title: 'Ready… set…', sub: 'Play cards one higher or lower onto either pile — no turns!' };
  else v.ui = { k: 'pick', key: 'sp' + g.moveId, title: 'GO!', sub: `Piles: ${txt(g.center[0])} and ${txt(g.center[1])}`, myturn: true, grid: 2, cards: true, options: g.hand[seat].flatMap(c => [0, 1].map(i => cardOpt(c, { v: `${c}@${i}`, sub: `→ ${txt(g.center[i])}`, dis: !adj(c, g.center[i]) }))).filter(o => !o.dis).concat(g.hand[seat].filter(c => !g.center.some(t => adj(c, t))).map(c => cardOpt(c, { v: `${c}@0`, dis: true }))) };
  return v;
};

// ---------------------------------------------------------------- Pairs (push your luck)
export const pairs = turnGame({
  createGame(s, p) {
    const g = base(s, p, {});
    g.limit = [0, 0, 31, 21, 16, 13, 11, 11, 11, 11, 11][g.order.length];
    g.round = 0; startPairs(g); return g;
  },
});
function startPairs(g) {
  g.round++;
  g.deck = shuffle(Array.from({ length: 10 }, (_, i) => Array(i + 1).fill(i + 1)).flat()).slice(5);
  g.row = g.seats.map(() => []);
  g.turn = g.order[(g.round - 1) % g.order.length]; g.phase = 'play'; g.last = null; g.moveId++;
}
pairs.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  if (a.type === 'flip') {
    const c = g.deck.pop();
    if (g.row[seat].includes(c)) { g.score[seat] += c; g.last = { s: seat, pair: c }; announce(g, seat, `Pair of ${c}s! +${c}`); sfx(g, 'sad'); return endPairs(g), null; }
    g.row[seat].push(c); g.last = { s: seat, c }; sfx(g, 'thud');
  } else if (a.type === 'fold') {
    const all = g.order.flatMap(s => g.row[s]);
    const lo = all.length ? Math.min(...all) : 0;
    g.score[seat] += lo; g.last = { s: seat, fold: lo }; announce(g, seat, `Folds: +${lo}`);
    return endPairs(g), null;
  } else return 'Flip or fold';
  if (!g.deck.length) return endPairs(g), null;
  g.turn = nextOf(g, seat); g.moveId++;
  return null;
};
function endPairs(g) { g.phase = 'roundEnd'; g.endAt = Date.now(); g.moveId++; }
pairs.tick = g => (g.phase === 'roundEnd' ? { ms: Math.max(0, g.endAt + 4500 - Date.now()), run: () => { if (g.order.some(s => g.score[s] >= g.limit)) { const lo = Math.min(...g.order.map(s => g.score[s])); g.winners = g.order.filter(s => g.score[s] === lo); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; return; } startPairs(g); } } : null);
pairs.botAction = (g, s) => { const risk = g.row[s].reduce((t, c) => t + c, 0) / 55; const all = g.order.flatMap(x => g.row[x]); return all.length && Math.min(...all) <= 2 && risk > 0.25 ? { type: 'fold' } : { type: 'flip' }; };
pairs.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Points', `${g.score[seat] ?? 0}/${g.limit}`], ['Deck', g.deck.length]] };
  const mine = `<div class="pr-row">${(g.row[seat] || []).map(c => `<span>${c}</span>`).join('') || '<em>no cards</em>'}</div>`;
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Fewest points!' : 'Game over', sub: '' };
  else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: g.last?.s === seat ? (g.last.pair ? `Pair! +${g.last.pair}` : `Folded: +${g.last.fold}`) : `@${g.last?.s}@ ended the round`, sub: '' };
  else if (g.turn === seat) { const all = g.order.flatMap(s => g.row[s]); v.ui = { k: 'buttons', key: 'p' + g.moveId, title: 'Flip — or fold?', sub: `Pair your own card and you take its value · fold takes the lowest card showing (${all.length ? Math.min(...all) : 0})`, myturn: true, buzz: true, html: mine, buttons: [{ type: 'flip', label: 'Flip a card', go: true }, { type: 'fold', label: 'Fold', dis: !all.length }] }; }
  else v.ui = { k: 'wait', title: `@${g.turn}@’s turn`, sub: `First to ${g.limit} points loses`, html: mine };
  return v;
};

// ---------------------------------------------------------------- Card Golf (six cards, lowest score)
const golfVal = c => (c[0] === 'K' ? 0 : c[0] === 'A' ? 1 : 'JQ'.includes(c[0]) ? 10 : c[0] === 'T' ? 10 : Number(c[0]));
export const golfScore = (grid) => { let t = 0; for (let col = 0; col < 3; col++) { const a = grid[col], b = grid[col + 3]; t += a.c[0] === b.c[0] ? 0 : golfVal(a.c) + golfVal(b.c); } return t; };
export const cardgolf = turnGame({
  createGame(s, p) { const g = base(s, p, { holes: 4 }); g.hole = 0; dealGolf(g); return g; },
});
function dealGolf(g) {
  g.hole++; g.deck = deck52(); g.grid = g.seats.map(() => []);
  for (const s of g.order) { g.grid[s] = Array.from({ length: 6 }, () => ({ c: g.deck.pop(), up: false })); g.grid[s][0].up = true; g.grid[s][4].up = true; }
  g.discard = [g.deck.pop()]; g.drawn = null; g.final = null;
  g.turn = g.order[(g.hole - 1) % g.order.length]; g.phase = 'play'; g.moveId++;
}
cardgolf.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  const G = g.grid[seat];
  if (!g.drawn) {
    if (a.type === 'deck') { g.drawn = g.deck.pop() || g.discard.shift(); g.fromDeck = true; g.moveId++; return null; }
    if (a.type === 'discard') { g.drawn = g.discard.pop(); g.fromDeck = false; g.moveId++; return null; }
    return 'Draw first';
  }
  if (a.type === 'pick') {
    const i = Number(a.v); if (!(i >= 0 && i < 6)) return 'Pick a spot';
    g.discard.push(G[i].c); G[i] = { c: g.drawn, up: true };
  } else if (a.type === 'toss') {
    if (!g.fromDeck) return 'You must use a card from the discard pile';
    g.discard.push(g.drawn);
  } else if (a.type === 'flipup') {
    const i = Number(a.i); if (!g.fromDeck || G[i]?.up) return 'Flip a face-down card';
    g.discard.push(g.drawn); G[i].up = true;
  } else return 'Not now';
  g.drawn = null;
  if (G.every(x => x.up) && g.final == null) { g.final = seat; announce(g, seat, 'All up! Last turns'); }
  g.turn = nextOf(g, seat);
  if (g.final != null && g.turn === g.final) {
    for (const s of g.order) g.grid[s].forEach(x => { x.up = true; });
    g.gain = {}; for (const s of g.order) { g.gain[s] = golfScore(g.grid[s]); g.score[s] += g.gain[s]; }
    g.phase = 'roundEnd'; g.endAt = Date.now(); sfx(g, 'chime');
  }
  g.moveId++;
  return null;
};
cardgolf.tick = g => (g.phase === 'roundEnd' ? { ms: Math.max(0, g.endAt + 7000 - Date.now()), run: () => (g.hole >= g.settings.holes ? winLow(g) : dealGolf(g)) } : null);
cardgolf.botAction = (g, s) => {
  const G = g.grid[s], top = g.discard[g.discard.length - 1];
  if (!g.drawn) return golfVal(top) <= 3 ? { type: 'discard' } : { type: 'deck' };
  const worst = G.map((x, i) => ({ i, v: x.up ? golfVal(x.c) : 6 })).sort((a, b) => b.v - a.v)[0];
  if (golfVal(g.drawn) < worst.v) return { type: 'pick', v: worst.i };
  const down = G.findIndex(x => !x.up);
  return g.fromDeck ? (down >= 0 ? { type: 'flipup', i: down } : { type: 'toss' }) : { type: 'pick', v: worst.i };
};
cardgolf.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Strokes', g.score[seat] ?? 0], ['Hole', `${g.hole}/${g.settings.holes}`]] };
  const G = g.grid[seat] || [], top = g.discard[g.discard.length - 1];
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Lowest round!' : 'Game over', sub: '' };
  else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: `This hole: ${g.gain[seat]}`, sub: 'Matching pairs in a column score zero' };
  else if (g.turn !== seat) v.ui = { k: 'wait', title: `@${g.turn}@’s turn`, sub: 'Your grid is on the table' };
  else if (!g.drawn) v.ui = { k: 'buttons', key: 'd' + g.moveId, title: 'Draw a card', sub: `Discard: ${txt(top)}`, myturn: true, buzz: true, buttons: [{ type: 'deck', label: 'From the deck', go: true }, { type: 'discard', label: `Take ${txt(top)}` }] };
  else v.ui = { k: 'pick', key: 'g' + g.moveId, title: `You have ${txt(g.drawn)} — swap it into your grid`, sub: g.fromDeck ? '…or throw it away and flip a face-down card' : 'Pick the spot', myturn: true, grid: 3, cards: true, options: G.map((x, i) => (x.up ? cardOpt(x.c, { v: i }) : { v: i, label: '?', sub: 'face down', cls: 'cdk-card back' })), buttons: g.fromDeck ? [...G.map((x, i) => (x.up ? null : { type: 'flipup', label: `Toss & flip #${i + 1}`, payload: { i } })).filter(Boolean), ...(G.every(x => x.up) ? [{ type: 'toss', label: 'Toss it' }] : [])] : null };
  return v;
};

// ---------------------------------------------------------------- Corner Kings (Kings in the Corner)
const KO = 'A23456789TJQK', ko = c => KO.indexOf(c[0]);
const fitsOn = (c, top) => !top ? true : ko(c) === ko(top) - 1 && isRed(c) !== isRed(top);
export const cornerkings = turnGame({
  createGame(s, p) {
    const g = base(s, p, {});
    g.round = 0; dealCK(g); return g;
  },
});
function dealCK(g) {
  g.round++; g.deck = deck52(); g.hand = g.seats.map(() => []);
  for (let k = 0; k < 7; k++) for (const s of g.order) g.hand[s].push(g.deck.pop());
  // Four piles to the sides; corners wait for kings.
  g.piles = Array.from({ length: 8 }, (_, i) => (i < 4 ? [g.deck.pop()] : []));
  g.sel = null; g.turn = g.order[(g.round - 1) % g.order.length]; g.drawn = false; g.phase = 'play'; g.moveId++;
}
const canOn = (g, c, i) => (i >= 4 ? (g.piles[i].length ? fitsOn(c, g.piles[i][g.piles[i].length - 1]) : c[0] === 'K') : (g.piles[i].length ? fitsOn(c, g.piles[i][g.piles[i].length - 1]) : true));
cornerkings.applyAction = (g, seat, a) => {
  if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  if (!g.drawn) { if (a.type !== 'draw') return 'Draw a card first'; if (g.deck.length) g.hand[seat].push(g.deck.pop()); g.drawn = true; g.moveId++; return null; }
  if (a.type === 'end') { g.sel = null; g.drawn = false; g.turn = nextOf(g, seat); g.moveId++; return null; }
  if (a.type === 'back') { g.sel = null; g.moveId++; return null; }
  if (a.type === 'pick' && !g.sel) { const c = String(a.v); if (!g.hand[seat].includes(c)) return 'Pick a card'; if (![...Array(8).keys()].some(i => canOn(g, c, i))) return 'That card can’t go anywhere yet'; g.sel = c; g.moveId++; return null; }
  if (a.type === 'pick' && g.sel) {
    const i = Number(a.v);
    if (!canOn(g, g.sel, i)) return i >= 4 && !g.piles[i].length ? 'Only a King starts a corner' : 'One lower, opposite colour';
    g.hand[seat].splice(g.hand[seat].indexOf(g.sel), 1); g.piles[i].push(g.sel); g.sel = null; sfx(g, 'thud');
    if (!g.hand[seat].length) {
      g.gain = {}; for (const s of g.order) { g.gain[s] = g.hand[s].reduce((t, c) => t + (c[0] === 'K' ? 10 : 1), 0); g.score[s] += g.gain[s]; }
      g.roundWin = seat; g.phase = 'roundEnd'; g.endAt = Date.now(); announce(g, seat, 'Out! 👑');
    }
    g.moveId++; return null;
  }
  return 'Not now';
};
cornerkings.tick = g => (g.phase === 'roundEnd' ? { ms: Math.max(0, g.endAt + 6000 - Date.now()), run: () => (g.order.some(s => g.score[s] >= 25) || g.round >= 5 ? winLow(g) : dealCK(g)) } : null);
cornerkings.botAction = (g, s) => {
  if (!g.drawn) return { type: 'draw' };
  if (g.sel) { const i = [4, 5, 6, 7, 0, 1, 2, 3].find(k => canOn(g, g.sel, k) && (k >= 4 || g.piles[k].length)) ?? [0, 1, 2, 3].find(k => canOn(g, g.sel, k)); return i != null ? { type: 'pick', v: i } : { type: 'back' }; }
  const c = g.hand[s].find(x => [...Array(8).keys()].some(i => canOn(g, x, i) && (i >= 4 || g.piles[i].length)));
  return c ? { type: 'pick', v: c } : { type: 'end' };
};
export const PILE_NAME = ['North', 'East', 'South', 'West', '↖ corner', '↗ corner', '↘ corner', '↙ corner'];
cornerkings.viewFor = (g, seat) => {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Penalty', g.score[seat] ?? 0], ['Deck', g.deck.length]] };
  const h = g.hand[seat] || [];
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 King of the corners!' : 'Game over', sub: '' };
  else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: g.roundWin === seat ? 'You’re out! 👑' : `+${g.gain[seat]} penalty`, sub: '' };
  else if (g.turn !== seat) v.ui = { k: 'wait', title: `@${g.turn}@’s turn`, sub: '', html: handHTML(h) };
  else if (!g.drawn) v.ui = { k: 'buttons', key: 'dr' + g.moveId, title: 'Draw a card to start your turn', sub: '', myturn: true, buzz: true, html: handHTML(h), buttons: [{ type: 'draw', label: 'Draw', go: true }] };
  else if (!g.sel) v.ui = { k: 'pick', key: 's' + g.moveId, title: 'Play a card (or end your turn)', sub: 'One lower, opposite colour · Kings start corners', myturn: true, cards: true, grid: 5, options: h.map(c => cardOpt(c, { dis: ![...Array(8).keys()].some(i => canOn(g, c, i)) })), buttons: [{ type: 'end', label: 'End turn' }] };
  else v.ui = { k: 'pick', key: 'p' + g.moveId, title: `Where does ${txt(g.sel)} go?`, myturn: true, grid: 2, options: g.piles.map((p, i) => ({ v: i, label: `${PILE_NAME[i]}: ${p.length ? txt(p[p.length - 1]) : 'empty'}`, dis: !canOn(g, g.sel, i) })), buttons: [{ type: 'back', label: '‹ Back' }] };
  return v;
};
