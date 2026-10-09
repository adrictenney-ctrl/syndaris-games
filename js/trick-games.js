// Trick-taking games on the card kit: Whist, Exactly (Oh Hell), Setback (Pitch), Raven (a Rook-style
// game), Mission Tricks (co-op missions), Schnapsen, Pinochle and Bridge. Hands on phones; the
// trick, trump, bids and (in Bridge) the dummy on the table.
import { shuffle, sfx, announce } from './party.js?v=68';
import { trickEngine, deck52, deckOf, SYM, SUITS, SUIT_NAME, RANKS, rv, cardEl, cardOpt, sortHand } from './cardkit.js?v=68';

const R = n => Math.floor(Math.random() * n);
const dealOut = (g, deck, n) => { g.hand = g.seats.map(() => []); for (let k = 0; k < n; k++) for (const s of g.order) g.hand[s].push(deck.pop()); return deck; };
const hcp = h => h.reduce((t, c) => t + ({ A: 4, K: 3, Q: 2, J: 1 }[c[0]] || 0), 0);
const longest = h => [...SUITS].sort((a, b) => h.filter(c => c[1] === b).length - h.filter(c => c[1] === a).length)[0];
const suitOpts = () => [...SUITS].map(s => ({ v: s, label: `${SYM[s]} ${SUIT_NAME[s]}`, cls: s === 'H' || s === 'D' ? 'cdk-red' : '' }));

// ---------------------------------------------------------------- Whist
export const whist = trickEngine({
  teams: true, teamNames: ['North–South', 'East–West'], defaults: { target: 5 },
  deal(g) { const d = deck52(); dealOut(g, d, 13); const last = g.hand[g.dealer][12]; g.trump = last[1]; g.turnUp = last; },
  scoreHand(g) { const t = [0, 1].map(k => g.order.filter(s => g.team[s] === k).reduce((a, s) => a + g.tricks[s], 0)); g.handTricks = t; for (const k of [0, 1]) if (t[k] > 6) g.scores[k] += t[k] - 6; },
  isOver: g => Math.max(...g.scores) >= g.settings.target,
  handSummary: g => `Tricks: ${g.handTricks[0]}–${g.handTricks[1]}`,
});

// ---------------------------------------------------------------- Exactly (Oh Hell)
export const exactly = trickEngine({
  defaults: { start: 7 },
  init(g) { g.sizes = Array.from({ length: Math.min(g.settings.start, Math.floor(51 / g.order.length)) }, (_, i) => Math.min(g.settings.start, Math.floor(51 / g.order.length)) - i); },
  deal(g) { const n = g.sizes[g.handNo - 1], d = deck52(); dealOut(g, d, n); g.turnUp = d.length ? d.pop() : null; g.trump = g.turnUp ? g.turnUp[1] : null; g.n = n; },
  bidding: {
    title: g => `How many tricks will you take? (${g.n} cards)`,
    options(g, s) { const isDealer = s === g.dealer, sum = Object.values(g.bids).reduce((a, b) => a + b, 0); return Array.from({ length: g.n + 1 }, (_, i) => ({ v: i, label: String(i), dis: isDealer && sum + i === g.n, sub: isDealer && sum + i === g.n ? 'not allowed' : '' })); },
    apply(g, s, v) { g.bids[s] = Number(v); announce(g, s, `Bids ${v}`); return Object.keys(g.bids).length === g.order.length; },
  },
  botBid(g, s) { const h = g.hand[s]; let est = h.filter(c => c[0] === 'A' || (c[1] === g.trump && rv(c) >= 11)).length; const sum = Object.values(g.bids).reduce((a, b) => a + b, 0); if (s === g.dealer && sum + est === g.n) est = est ? est - 1 : 1; return Math.min(g.n, est); },
  scoreHand(g) { g.gain = {}; for (const s of g.order) { g.gain[s] = g.tricks[s] === g.bids[s] ? 10 + g.bids[s] : 0; g.score[s] += g.gain[s]; } },
  isOver: g => g.handNo >= g.sizes.length,
  hud: (g, s) => [['Bid / won', g.bids[s] != null ? `${g.bids[s]} / ${g.tricks[s]}` : '—'], ['Score', g.score[s] ?? 0]],
  handSummary: (g, s) => (g.gain[s] ? `Exactly right! +${g.gain[s]}` : `You bid ${g.bids[s]}, took ${g.tricks[s]}`),
});

// ---------------------------------------------------------------- Setback (Pitch)
const GAMEPTS = { T: 10, A: 4, K: 3, Q: 2, J: 1 };
export const setback = trickEngine({
  teams: true, teamNames: ['North–South', 'East–West'], defaults: { target: 11 },
  deal(g) { dealOut(g, deck52(), 6); g.trump = null; g.high = { bid: 0, s: -1 }; g.passes = 0; },
  bidding: {
    title: g => (g.high.bid ? `High bid: ${g.high.bid} — raise or pass` : 'Bid how many points (High, Low, Jack, Game) you’ll make'),
    options(g, s) { const forced = s === g.dealer && !g.high.bid; return [{ v: 0, label: 'Pass', dis: forced }, ...[2, 3, 4].map(n => ({ v: n, label: String(n), dis: n <= g.high.bid }))]; },
    apply(g, s, v) { v = Number(v); g.bids[s] = v; if (v > g.high.bid) g.high = { bid: v, s }; announce(g, s, v ? `Bids ${v}` : 'Pass'); return Object.keys(g.bids).length === g.order.length || v === 4; },
  },
  setup(g) { g.bidder = g.high.s; g.trump = null; },
  lead: g => g.high.s,
  onPlay(g, s, c) { if (!g.trump) { g.trump = c[1]; announce(g, s, `Trump: ${SYM[c[1]]}`); } },
  legal(g, s) { const h = g.hand[s]; if (!g.trick.length) return h; const led = g.trick[0].c[1], f = h.filter(c => c[1] === led); return f.length ? [...f, ...h.filter(c => c[1] === g.trump && c[1] !== led)] : h; },
  botBid(g, s) { const h = g.hand[s], tr = longest(h), n = h.filter(c => c[1] === tr).length, hi = h.some(c => c[1] === tr && rv(c) >= 13); const want = n >= 3 && hi ? 3 : n >= 2 && hi ? 2 : 0; return s === g.dealer && !g.high.bid ? 2 : want > g.high.bid ? want : 0; },
  botPlay(g, s, L) { if (!g.trick.length && !g.trump) { const tr = longest(g.hand[s]); return [...L].filter(c => c[1] === tr).sort((a, b) => rv(b) - rv(a))[0] || L[0]; } return null; },
  scoreHand(g) {
    const played = g.order.flatMap(s => g.won[s].map(c => ({ c, s })));
    const trumps = played.filter(x => x.c[1] === g.trump).sort((a, b) => rv(b.c) - rv(a.c));
    const pts = [0, 0], why = [];
    const give = (k, w) => { pts[k]++; why.push(w); };
    if (trumps.length) { give(g.team[trumps[0].s], 'High'); const lowCard = trumps[trumps.length - 1].c; const lowWho = g.played?.[lowCard] ?? trumps[trumps.length - 1].s; give(g.team[lowWho], 'Low'); }
    const jack = played.find(x => x.c === 'J' + g.trump); if (jack) give(g.team[jack.s], 'Jack');
    const gp = [0, 1].map(k => played.filter(x => g.team[x.s] === k).reduce((t, x) => t + (GAMEPTS[x.c[0]] || 0), 0));
    if (gp[0] !== gp[1]) give(gp[0] > gp[1] ? 0 : 1, 'Game');
    const bt = g.team[g.bidder];
    g.made = pts[bt] >= g.high.bid;
    g.scores[bt] += g.made ? pts[bt] : -g.high.bid;
    g.scores[1 - bt] += pts[1 - bt];
    g.pts = pts; g.why = why;
  },
  onTrick() {},
  isOver: g => Math.max(...g.scores) >= g.settings.target || Math.min(...g.scores) <= -g.settings.target,
  handSummary: g => `${g.made ? 'Bid made' : 'Set back!'} · points this hand ${g.pts[0]}–${g.pts[1]}`,
});
// Remember who actually played each card (Low goes to whoever played it).
const sbPlay = setback.cfg.onPlay;
setback.cfg.onPlay = (g, s, c) => { g.played = g.played || {}; g.played[c] = s; sbPlay(g, s, c); };

// ---------------------------------------------------------------- Raven (Rook-style: bid, take the nest, the Raven is top trump)
const RAVEN = 'RV';
const ravenPts = c => (c === RAVEN ? 20 : c[0] === '5' ? 5 : c[0] === 'T' || c[0] === 'A' ? 10 : 0);
export const raven = trickEngine({
  teams: true, teamNames: ['North–South', 'East–West'], defaults: { target: 300 }, order: '56789TJQKA',
  deal(g) { const d = shuffle([...deckOf('56789TJQKA'), RAVEN]); dealOut(g, d, 9); g.nest = d.splice(0, 5); g.high = { bid: 65, s: -1 }; g.passed = []; g.trump = null; },
  bidding: {
    title: g => `High bid ${g.high.bid > 65 ? g.high.bid : '—'} · bid in fives or pass for good`,
    options(g, s) { const forced = g.passed.length === g.order.length - 1 && g.high.s < 0; return [{ v: 0, label: 'Pass', dis: forced }, ...[5, 10, 20].map(d => ({ v: g.high.bid + d, label: String(g.high.bid + d), dis: g.high.bid + d > 120 }))]; },
    apply(g, s, v) { v = Number(v); if (!v) { g.passed.push(s); announce(g, s, 'Pass'); } else { g.high = { bid: v, s }; announce(g, s, `${v}!`); } const live = g.order.filter(x => !g.passed.includes(x)); if (live.length === 1 && g.high.s >= 0) return true; if (!live.length) { g.high = { bid: 70, s: g.dealer }; return true; } return g.high.bid >= 120; },
    nextBidder(g, s) { let n = raven.next(g, s); while (g.passed.includes(n)) n = raven.next(g, n); return n; },
  },
  // The winner takes the nest, buries five cards and names trump.
  setup(g) { g.bidder = g.high.s; g.hand[g.bidder].push(...g.nest); g.nest = []; },
  pending: g => (g.phase === 'nest' || g.phase === 'trumpcall' ? [g.bidder] : []),
  action(g, seat, a, E) {
    if (g.phase === 'nest') {
      if (seat !== g.bidder) return 'The bidder is burying cards';
      const c = String(a.v);
      if (!g.hand[seat].includes(c)) return 'Pick a card from your hand';
      if (c === RAVEN) return 'Keep the Raven!';
      g.hand[seat].splice(g.hand[seat].indexOf(c), 1); g.buried.push(c);
      if (g.buried.length === 5) g.phase = 'trumpcall';
      g.moveId++; return null;
    }
    if (g.phase === 'trumpcall') { if (seat !== g.bidder) return 'The bidder names trump'; if (!SUITS.includes(a.v)) return 'Pick a suit'; g.trump = a.v; announce(g, seat, `Trump: ${SYM[a.v]}`); for (const s of g.order) g.hand[s] = sortHand(g.hand[s], g.trump, '56789TJQKA'); g.phase = 'play'; g.turn = g.bidder; g.leader = g.turn; g.moveId++; return null; }
    return undefined;
  },
  lead: g => g.high.s,
  legal(g, s) { const h = g.hand[s]; if (!g.trick.length) return h; const led = g.trick[0].c === RAVEN ? g.trump : g.trick[0].c[1]; const f = h.filter(c => c !== RAVEN && c[1] === led); return f.length ? [...f, ...h.filter(c => c === RAVEN)] : h; },
  winner(g, t) {
    const led = t[0].c === RAVEN ? g.trump : t[0].c[1], P = c => '56789TJQKA'.indexOf(c[0]);
    const val = c => (c === RAVEN ? 100 : c[1] === g.trump ? 50 + P(c) : c[1] === led ? P(c) : -1);
    let best = 0; t.forEach((x, i) => { if (val(x.c) > val(t[best].c)) best = i; }); return best;
  },
  botBid(g, s) { const h = g.hand[s], p = h.reduce((t, c) => t + ravenPts(c) + (c[0] === 'A' ? 5 : 0), 0) + (h.includes(RAVEN) ? 15 : 0); const cap = 70 + Math.floor(p / 5) * 5; return g.high.bid + 5 <= cap ? g.high.bid + 5 : g.passed.length === g.order.length - 1 && g.high.s < 0 ? g.high.bid + 5 : 0; },
  botAction(g, s) {
    if (g.phase === 'nest') { const h = g.hand[s].filter(c => c !== RAVEN && !['A', 'T', '5'].includes(c[0])).sort((a, b) => '56789TJQKA'.indexOf(a[0]) - '56789TJQKA'.indexOf(b[0])); return { type: 'pick', v: (h[0] || g.hand[s].find(c => c !== RAVEN)) }; }
    if (g.phase === 'trumpcall') return { type: 'pick', v: longest(g.hand[s].filter(c => c !== RAVEN)) };
    return null;
  },
  phoneUI(g, seat) {
    if (g.phase === 'nest' && seat === g.bidder) return { k: 'pick', key: 'n' + g.buried.length, title: `Bury ${5 - g.buried.length} more card${g.buried.length === 4 ? '' : 's'}`, sub: 'You took the nest', myturn: true, cards: true, grid: 6, options: g.hand[seat].map(c => (c === RAVEN ? { v: c, label: '🐦‍⬛', sub: 'Raven', cls: 'cdk-card', dis: true } : cardOpt(c))) };
    if (g.phase === 'trumpcall' && seat === g.bidder) return { k: 'pick', key: 't', title: 'Name trump', myturn: true, buzz: true, grid: 2, options: suitOpts() };
    if (g.phase === 'nest' || g.phase === 'trumpcall') return { k: 'wait', title: `@${g.bidder}@ took the nest`, sub: 'Waiting for trump…', html: `<div class="cdk-hand">${g.hand[seat].map(c => (c === RAVEN ? '<span class="cdk-c raven">🐦‍⬛</span>' : cardEl(c))).join('')}</div>` };
    if (g.phase === 'play' || g.phase === 'trick') {
      const myTurn = g.turn === seat && g.phase === 'play', L = myTurn ? raven.legal(g, seat) : [];
      return { k: 'pick', key: 'p' + g.handNo + ':' + g.hand[seat].length + ':' + g.trick.length + (myTurn ? 'm' : ''), title: myTurn ? 'Your turn' : `@${g.turn}@ to play`, sub: g.trump ? `Trump ${SYM[g.trump]} · the Raven beats everything` : '', myturn: myTurn, cards: true, grid: 5, options: g.hand[seat].map(c => (c === RAVEN ? { v: c, label: '🐦‍⬛', sub: 'Raven', cls: 'cdk-card', dis: !L.includes(c) } : cardOpt(c, { dis: !L.includes(c) }))) };
    }
    return null;
  },
  scoreHand(g) {
    const pts = [0, 0];
    for (const s of g.order) pts[g.team[s]] += g.won[s].reduce((t, c) => t + ravenPts(c), 0);
    pts[g.team[g.lastTrick.w]] += g.buried.reduce((t, c) => t + ravenPts(c), 0);
    const bt = g.team[g.bidder];
    g.made = pts[bt] >= g.high.bid;
    g.scores[bt] += g.made ? pts[bt] : -g.high.bid;
    g.scores[1 - bt] += pts[1 - bt];
    g.pts = pts;
  },
  isOver: g => Math.max(...g.scores) >= g.settings.target || Math.min(...g.scores) <= -g.settings.target,
  handSummary: g => `${g.made ? 'Bid made' : 'Bid failed'} · ${g.pts[0]}–${g.pts[1]} points`,
});
const ravenDeal = raven.cfg.deal;
raven.cfg.deal = g => { ravenDeal(g); g.buried = []; };

// ---------------------------------------------------------------- Mission Tricks (co-op)
const CREW = '123456789';
const crewDeck = () => shuffle([...SUITS].flatMap(s => [...CREW].map(r => r + s)).concat(['1R', '2R', '3R', '4R']));
export const missiontricks = trickEngine({
  order: CREW, defaults: { levels: 10 },
  init(g) { g.level = 1; g.attempts = 0; g.cleared = 0; },
  deal(g) {
    const d = crewDeck(); g.hand = g.seats.map(() => []);
    let i = 0; while (d.length) { g.hand[g.order[i % g.order.length]].push(d.pop()); i++; }
    g.trump = 'R';
    g.attempts++;
    const pool = shuffle(g.order.flatMap(s => g.hand[s].filter(c => c[1] !== 'R')));
    g.tasks = pool.slice(0, Math.min(g.level, 8)).map((c, k) => ({ c, s: g.order[(g.order.indexOf(g.order.find(x => g.hand[x].includes('4R'))) + k) % g.order.length], done: false }));
    g.reveal = {}; g.failed = false;
  },
  lead: g => g.order.find(s => g.hand[s].includes('4R')),
  winner(g, t) { const led = t[0].c[1], v = c => (c[1] === 'R' ? 100 + Number(c[0]) : c[1] === led ? Number(c[0]) : -1); let b = 0; t.forEach((x, i) => { if (v(x.c) > v(t[b].c)) b = i; }); return b; },
  onTrick(g, w) { for (const T of g.tasks) if (!T.done && g.lastTrick.cards.some(x => x.c === T.c)) { if (T.s === w) { T.done = true; sfx(g, 'ding'); } else { g.failed = true; announce(g, w, `✗ Task ${T.c} lost`); } } },
  handDone: g => g.failed || g.tasks.every(T => T.done),
  action(g, seat, a) {
    if (a.type !== 'reveal') return undefined;
    if (g.phase !== 'play' || seat !== g.turn) return 'Reveal on your turn, before you play';
    if (g.reveal[seat]) return 'One card each per mission';
    const c = String(a.v);
    if (!g.hand[seat].includes(c) || c[1] === 'R') return 'Reveal a coloured card';
    g.reveal[seat] = c; announce(g, seat, `Shows ${c[0]}${SYM[c[1]]}`); g.moveId++; return null;
  },
  botAction(g, s) {
    if (g.phase !== 'play') return null;
    const L = missiontricks.legal(g, s), myTask = g.tasks.find(T => !T.done && T.s === s && (g.trick.some(x => x.c === T.c) || L.includes(T.c)));
    if (myTask && g.trick.length) { const win = L.filter(c => missiontricks.winner(g, [...g.trick, { s, c }]) === g.trick.length); if (win.length) return { type: 'pick', v: win[0] }; }
    const avoid = L.filter(c => !g.tasks.some(T => !T.done && T.c === c && T.s !== s));
    const pick2 = (avoid.length ? avoid : L).sort((a, b) => Number(a[0]) - Number(b[0]) + (a[1] === 'R' ? 50 : 0) - (b[1] === 'R' ? 50 : 0));
    return { type: 'pick', v: pick2[0] };
  },
  scoreHand(g) { if (!g.failed && g.tasks.every(T => T.done)) { g.cleared = g.level; g.level++; g.result = 'success'; } else g.result = 'fail'; g.order.forEach(s => { g.score[s] = g.cleared; }); },
  isOver: g => g.level > g.settings.levels || g.attempts >= g.settings.levels * 2,
  hud: g => [['Mission', g.level], ['Attempts', g.attempts]],
  phoneInfo: (g, s) => { const mine = g.tasks.filter(T => T.s === s); return `<p class="cdk-task">Your task${mine.length === 1 ? '' : 's'}: ${mine.map(T => `${T.done ? '✓' : '🎯'} ${T.c[0]}${SYM[T.c[1]]}`).join(' ') || 'none — help the team!'}</p>`; },
  handSummary: g => (g.result === 'success' ? 'Mission complete! 🚀' : 'Mission failed — try again'),
});
// Mission Tricks: rockets show as 🚀 on phones; and you may reveal a card.
const mtView = missiontricks.viewFor;
missiontricks.viewFor = (g, s) => {
  const v = mtView(g, s);
  if (v.ui?.options) v.ui.options = v.ui.options.map(o => (o.v[1] === 'R' ? { ...o, label: o.v[0], sub: '🚀', cls: 'cdk-card rocket' } : { ...o, label: o.v[0] }));
  if (v.ui?.myturn && g.phase === 'play' && !g.reveal[s]) v.ui.buttons = [{ type: 'revealmode', label: '📣 Reveal a card to the team' }];
  if (g.revealMode?.[s] && g.phase === 'play' && g.turn === s) v.ui = { k: 'pick', key: 'rv', act: 'reveal', title: 'Show one card to the team', sub: 'It goes face up on the table', cards: true, grid: 5, options: g.hand[s].filter(c => c[1] !== 'R').map(c => cardOpt(c, { label: c[0] })), buttons: [{ type: 'revealmode', label: '‹ Back' }] };
  return v;
};
const mtAct = missiontricks.applyAction;
missiontricks.applyAction = (g, s, a) => { if (a?.type === 'revealmode') { g.revealMode = g.revealMode || {}; g.revealMode[s] = !g.revealMode[s]; g.moveId++; return null; } const r = mtAct(g, s, a); if (!r && a?.type === 'reveal') { g.revealMode[s] = false; } return r; };
missiontricks.finish = g => { g.order.forEach(s => { g.score[s] = g.cleared; }); g.winners = g.cleared >= g.settings.levels ? [...g.order] : []; g.phase = 'over'; g.moveId++; };

// ---------------------------------------------------------------- Schnapsen (two players)
const SCH = 'JQKTA', SCHPTS = { J: 2, Q: 3, K: 4, T: 10, A: 11 };
export const schnapsen = trickEngine({
  order: SCH, defaults: { target: 7 },
  deal(g) { const d = deckOf(SCH); dealOut(g, d, 5); g.trumpCard = d.shift(); g.trump = g.trumpCard[1]; g.talon = d; g.pts = g.seats.map(() => 0); g.marr = g.seats.map(() => 0); },
  onPlay(g, s, c) {
    // Marriage: leading a King or Queen while holding its partner scores 20 (40 in trumps).
    if (g.trick.length === 1 && (c[0] === 'K' || c[0] === 'Q') && g.hand[s].includes((c[0] === 'K' ? 'Q' : 'K') + c[1])) { const p = c[1] === g.trump ? 40 : 20; g.marr[s] += p; announce(g, s, `Marriage! +${p}`); }
  },
  legal(g, s) { const h = g.hand[s]; if (!g.trick.length || g.talon.length) return h; const led = g.trick[0].c[1], f = h.filter(c => c[1] === led), beat = f.filter(c => SCH.indexOf(c[0]) > SCH.indexOf(g.trick[0].c[0])); if (f.length) return beat.length ? beat : f; const tr = h.filter(c => c[1] === g.trump); return tr.length ? tr : h; },
  onTrick(g, w) {
    g.pts[w] += g.lastTrick.cards.reduce((t, x) => t + SCHPTS[x.c[0]], 0) + g.marr[w]; g.marr[w] = 0;
    // Draw back up: winner first; the turned-up trump is the last card.
    const o = w === g.order[0] ? g.order : [...g.order].reverse();
    for (const s of o) { if (g.talon.length) g.hand[s].push(g.talon.pop()); else if (g.trumpCard) { g.hand[s].push(g.trumpCard); g.trumpCard = null; } g.hand[s] = sortHand(g.hand[s], g.trump, SCH); }
  },
  handDone: g => g.order.some(s => g.pts[s] >= 66),
  scoreHand(g) {
    const w = g.order.find(s => g.pts[s] >= 66) ?? g.lastTrick.w, l = g.order.find(s => s !== w);
    const gp = g.tricks[l] === 0 ? 3 : g.pts[l] < 33 ? 2 : 1;
    g.score[w] += gp; g.handWin = { w, gp };
  },
  isOver: g => g.order.some(s => g.score[s] >= g.settings.target),
  hud: (g, s) => [['Points', g.pts?.[s] ?? 0], ['Game', g.score[s] ?? 0]],
  phoneInfo: g => `<p class="cdk-task">Trump ${SYM[g.trump]} · ${g.talon.length + (g.trumpCard ? 1 : 0)} in the talon${g.talon.length ? ' (no need to follow suit yet)' : ' — follow suit and beat it!'}</p>`,
  handSummary: (g, s) => (g.handWin.w === s ? `You win the hand: +${g.handWin.gp}` : `@${g.handWin.w}@ wins the hand`),
});

// ---------------------------------------------------------------- Pinochle (partnership, simplified scoring)
const PIN = '9JQKTA';
export function meld(h, tr) {
  const n = c => h.filter(x => x === c).length;
  let m = 0;
  const run = Math.min(...['A', 'T', 'K', 'Q', 'J'].map(r => n(r + tr)));
  m += run * 150;
  for (const s of SUITS) { const k = n('K' + s), q = n('Q' + s); let pairs = Math.min(k, q); if (s === tr) pairs -= run; m += pairs * (s === tr ? 40 : 20); }
  m += n('9' + tr) * 10;
  const around = (r, p) => { const k = Math.min(...[...SUITS].map(s => n(r + s))); return k === 2 ? p * 10 : k * p; };
  m += around('A', 100) + around('K', 80) + around('Q', 60) + around('J', 40);
  const pin = Math.min(n('QS'), n('JD'));
  m += pin === 2 ? 300 : pin * 40;
  return m;
}
export const pinochle = trickEngine({
  teams: true, teamNames: ['North–South', 'East–West'], defaults: { target: 1500 }, order: PIN,
  deal(g) { const d = shuffle([...deckOf(PIN), ...deckOf(PIN)]); dealOut(g, d, 12); g.high = { bid: 240, s: -1 }; g.passed = []; g.trump = null; },
  bidding: {
    title: g => `High bid ${g.high.s >= 0 ? g.high.bid : '—'} · pass once and you’re out`,
    options(g, s) { const forced = g.passed.length === g.order.length - 1 && g.high.s < 0; return [{ v: 0, label: 'Pass', dis: forced }, ...[10, 20, 50].map(d => ({ v: Math.max(250, g.high.bid + d), label: String(Math.max(250, g.high.bid + d)) }))]; },
    apply(g, s, v) { v = Number(v); if (!v) { g.passed.push(s); announce(g, s, 'Pass'); } else { g.high = { bid: v, s }; announce(g, s, `${v}!`); } const live = g.order.filter(x => !g.passed.includes(x)); if (live.length === 1 && g.high.s >= 0) return true; if (!live.length) { g.high = { bid: 250, s: g.dealer }; return true; } return false; },
    nextBidder(g, s) { let n = pinochle.next(g, s); while (g.passed.includes(n)) n = pinochle.next(g, n); return n; },
  },
  setup(g) { g.bidder = g.high.s; },
  lead: g => g.high.s,
  action(g, seat, a) {
    if (g.phase !== 'trumpcall') return undefined;
    if (seat !== g.bidder) return 'The bidder names trump';
    if (!SUITS.includes(a.v)) return 'Pick a suit';
    g.trump = a.v; g.melds = g.seats.map((_, s) => (g.order.includes(s) ? meld(g.hand[s], g.trump) : 0));
    announce(g, seat, `Trump: ${SYM[a.v]}`);
    for (const s of g.order) g.hand[s] = sortHand(g.hand[s], g.trump, PIN);
    g.phase = 'play'; g.turn = g.bidder; g.leader = g.turn; g.moveId++; return null;
  },
  pending: g => (g.phase === 'trumpcall' ? [g.bidder] : []),
  legal(g, s) { const h = g.hand[s]; if (!g.trick.length) return h; const led = g.trick[0].c[1], f = h.filter(c => c[1] === led); if (f.length) return f; const t = h.filter(c => c[1] === g.trump); return t.length ? t : h; },
  winner(g, t) { const led = t[0].c[1], v = c => (c[1] === g.trump ? 50 : c[1] === led ? 0 : -100) + PIN.indexOf(c[0]); let b = 0; t.forEach((x, i) => { if (v(x.c) > v(t[b].c)) b = i; }); return b; },
  botBid(g, s) { const tr = longest(g.hand[s]), est = meld(g.hand[s], tr) + 150 + g.hand[s].filter(c => c[0] === 'A').length * 20; const nextBid = Math.max(250, g.high.bid + 10); return nextBid <= est || (g.passed.length === g.order.length - 1 && g.high.s < 0) ? nextBid : 0; },
  botAction(g, s) { if (g.phase === 'trumpcall') return { type: 'pick', v: [...SUITS].sort((a, b) => meld(g.hand[s], b) - meld(g.hand[s], a))[0] }; return null; },
  phoneUI(g, seat) {
    if (g.phase === 'trumpcall') return seat === g.bidder ? { k: 'pick', key: 'tc', title: 'You won the bid — name trump', sub: `Your meld with each: ${[...SUITS].map(s => `${SYM[s]} ${meld(g.hand[seat], s)}`).join(' · ')}`, myturn: true, buzz: true, grid: 2, options: suitOpts(), html: `<div class="cdk-hand">${g.hand[seat].map(c => cardEl(c)).join('')}</div>` } : { k: 'wait', title: `@${g.bidder}@ is naming trump`, sub: '' };
    return null;
  },
  scoreHand(g) {
    const pts = [0, 0];
    for (const s of g.order) pts[g.team[s]] += g.won[s].filter(c => 'AKT'.includes(c[0])).length * 10;
    pts[g.team[g.lastTrick.w]] += 10;
    const tot = [0, 1].map(k => pts[k] + (g.order.some(s => g.team[s] === k && g.tricks[s]) ? g.order.filter(s => g.team[s] === k).reduce((t, s) => t + g.melds[s], 0) : 0));
    const bt = g.team[g.bidder];
    g.made = tot[bt] >= g.high.bid;
    g.scores[bt] += g.made ? tot[bt] : -g.high.bid;
    g.scores[1 - bt] += tot[1 - bt];
    g.tot = tot;
  },
  isOver: g => Math.max(...g.scores) >= g.settings.target || Math.min(...g.scores) <= -g.settings.target,
  phoneInfo: (g, s) => (g.melds ? `<p class="cdk-task">Your meld: ${g.melds[s]}</p>` : ''),
  handSummary: g => `${g.made ? 'Bid made' : 'Bid set'} · ${g.tot[0]}–${g.tot[1]}`,
});
for (const E of [raven, pinochle]) {
  const ap = E.applyAction;
  E.applyAction = (g, s, a) => {
    const before = g.phase;
    const r = ap(g, s, a);
    // When the auction ends, hold play until the bidder has done their part.
    if (!r && before === 'bid' && g.phase === 'play' && !g.trump) { g.phase = E === raven ? 'nest' : 'trumpcall'; g.turn = g.bidder; }
    return r;
  };
}

// ---------------------------------------------------------------- Bridge (Chicago: four deals)
const STRAINS = ['C', 'D', 'H', 'S', 'N'], SNAME = { C: '♣', D: '♦', H: '♥', S: '♠', N: 'NT' };
const bidVal = b => (b.level - 1) * 5 + STRAINS.indexOf(b.strain);
export const bidTxt = b => `${b.level}${SNAME[b.strain]}`;
export const bridge = trickEngine({
  teams: true, teamNames: ['North–South', 'East–West'], defaults: { deals: 4 },
  deal(g) { dealOut(g, deck52(), 13); g.auction = []; g.contract = null; g.dbl = 0; g.trump = null; g.vul = [[false, false], [true, false], [false, true], [true, true]][(g.handNo - 1) % 4]; },
  bidding: {
    grid: 5,
    title: g => (g.contract ? `Current: ${bidTxt(g.contract)}${g.dbl ? ' ×' + (g.dbl === 1 ? '' : '×') : ''} by @${g.contract.s}@` : 'Open the bidding (or pass)'),
    options(g, s) {
      const cur = g.contract ? bidVal(g.contract) : -1;
      const bids = [];
      for (let l = 1; l <= 7; l++) for (const st of STRAINS) { const b = { level: l, strain: st }; if (bidVal(b) > cur) bids.push({ v: `${l}${st}`, label: bidTxt(b), cls: st === 'H' || st === 'D' ? 'cdk-red' : '' }); }
      const canDbl = g.contract && g.team[g.contract.s] !== g.team[s] && g.dbl === 0;
      return [{ v: 'P', label: 'Pass' }, ...(canDbl ? [{ v: 'X', label: 'Double' }] : []), ...bids.slice(0, 20)];
    },
    apply(g, s, v) {
      g.auction.push({ s, v });
      if (v === 'X') { g.dbl = 1; announce(g, s, 'Double!'); }
      else if (v !== 'P') { g.contract = { level: Number(v[0]), strain: v[1], s }; g.dbl = 0; announce(g, s, bidTxt(g.contract)); }
      else announce(g, s, 'Pass');
      const tail = g.auction.slice(-3);
      if (!g.contract && g.auction.length === 4 && g.auction.every(x => x.v === 'P')) { g.passedOut = true; return true; }
      return g.contract && g.auction.length >= 4 && tail.length === 3 && tail.every(x => x.v === 'P');
    },
  },
  setup(g) {
    if (g.passedOut) { g.passedOut = false; g.redeal = true; return; }
    const c = g.contract, side = g.team[c.s];
    // Declarer: the first on the winning side to name this strain.
    g.declarer = g.auction.find(x => x.v !== 'P' && x.v !== 'X' && x.v[1] === c.strain && g.team[x.s] === side).s;
    g.dummy = g.order.find(s => g.team[s] === side && s !== g.declarer);
    g.trump = c.strain === 'N' ? null : c.strain;
  },
  lead: g => (g.redeal ? g.dealer : bridge.next(g, g.declarer)),
  // The declarer plays the dummy's cards from their own phone.
  pending: () => [],
  scoreHand(g) {
    const c = g.contract, side = g.team[g.declarer], vul = g.vul[side];
    const won = g.order.filter(s => g.team[s] === side).reduce((t, s) => t + g.tricks[s], 0), need = 6 + c.level;
    let pts = 0, def = 0;
    if (won >= need) {
      const per = c.strain === 'C' || c.strain === 'D' ? 20 : 30;
      let trick = c.strain === 'N' ? 40 + 30 * (c.level - 1) : per * c.level;
      trick *= g.dbl ? 2 : 1;
      pts = trick + (trick >= 100 ? (vul ? 500 : 300) : 50);
      if (c.level === 6) pts += vul ? 750 : 500;
      if (c.level === 7) pts += vul ? 1500 : 1000;
      const over = won - need;
      pts += g.dbl ? over * (vul ? 200 : 100) + 50 : over * (c.strain === 'C' || c.strain === 'D' ? 20 : 30);
      g.scores[side] += pts; g.res = `Made ${bidTxt(c)}${over ? ` +${over}` : ''}: ${pts}`;
    } else {
      const down = need - won;
      if (!g.dbl) def = down * (vul ? 100 : 50);
      else for (let i = 1; i <= down; i++) def += vul ? (i === 1 ? 200 : 300) : (i === 1 ? 100 : i <= 3 ? 200 : 300);
      g.scores[1 - side] += def; g.res = `${bidTxt(c)} down ${down}: ${def} to the defence`;
    }
  },
  isOver: g => g.handNo >= g.settings.deals,
  botBid(g, s) {
    const h = g.hand[s], p = hcp(h), ls = longest(h), len = h.filter(c => c[1] === ls).length;
    const mine = g.auction.filter(x => x.v.length === 2 && g.team[x.s] === g.team[s]);
    const partner = mine.filter(x => x.s !== s);
    const legal = v => bridge.cfg.bidding.options(g, s).some(o => o.v === v);
    const tryBid = v => (legal(v) ? v : 'P');
    if (!mine.length) { if (p >= 15 && p <= 17 && SUITS.split('').every(su => h.filter(c => c[1] === su).length >= 2)) return tryBid('1N'); if (p >= 12) return tryBid(`1${ls}`); return 'P'; }
    if (partner.length && !mine.some(x => x.s === s)) {
      const ps = partner[partner.length - 1].v[1], sup = h.filter(c => c[1] === ps).length;
      if (p >= 6 && ps !== 'N' && sup >= 3) { const lvl = p >= 13 ? (ps === 'H' || ps === 'S' ? 4 : 5) : p >= 10 ? 3 : 2; return tryBid(`${lvl}${ps}`); }
      if (p >= 6) return tryBid(p >= 13 ? '3N' : p >= 10 ? '2N' : `1N`);
    }
    return 'P';
  },
  phoneUI(g, seat, E) {
    if (g.phase !== 'play' && g.phase !== 'trick') return null;
    const playing = g.turn === g.dummy ? g.declarer : g.turn;
    const view = seat === g.dummy ? null : seat === g.declarer && g.turn === g.dummy ? g.dummy : seat;
    if (seat === g.dummy) return { k: 'wait', title: 'You’re the dummy 🪑', sub: `@${g.declarer}@ plays your cards — your hand is face up on the table`, html: `<div class="cdk-hand">${g.hand[seat].map(c => cardEl(c)).join('')}</div>` };
    const myTurn = playing === seat && g.phase === 'play';
    const h = g.hand[view], L = myTurn ? E.legal(g, view) : [];
    return { k: 'pick', key: 'p' + g.handNo + ':' + view + ':' + h.length + ':' + g.trick.length + (myTurn ? 'm' : ''), title: myTurn ? (view === g.dummy ? 'Play from the DUMMY' : 'Your turn') : `@${playing}@ to play`, sub: `${bidTxt(g.contract)}${g.dbl ? ' doubled' : ''} by @${g.declarer}@${g.trump ? '' : ' · no trumps'}`, myturn: myTurn, buzz: myTurn, cards: true, grid: 7, options: h.map(c => cardOpt(c, { dis: !L.includes(c) })) };
  },
  hud: (g, s) => [['Tricks', g.order.filter(x => g.team[x] === g.team[s]).reduce((t, x) => t + g.tricks[x], 0)], ['Score', g.scores[g.team[s]]]],
  handSummary: g => g.res || 'Passed out — redeal',
});
// Passed-out deals and the dummy's turn need a little extra wiring.
{
  const ap = bridge.applyAction;
  bridge.applyAction = (g, seat, a) => {
    // The declarer acts for the dummy.
    if (g.phase === 'play' && g.turn === g.dummy && seat === g.declarer) return ap(g, g.dummy, a);
    const r = ap(g, seat, a);
    if (!r && g.redeal && g.phase === 'play') { g.redeal = false; g.phase = 'handEnd'; g.endAt = Date.now() - 4000; g.res = 'Everyone passed — redeal'; g.handNo--; }
    return r;
  };
  bridge.pending = g => (g.phase === 'bid' ? [g.turn] : g.phase === 'play' ? [g.turn === g.dummy ? g.declarer : g.turn] : []);
  bridge.current = g => bridge.pending(g)[0] ?? -1;
  bridge.turnSeat = g => (g.phase === 'play' && g.turn === g.dummy ? g.declarer : g.phase === 'bid' || g.phase === 'play' ? g.turn : -1);
  const bot = bridge.botAction;
  bridge.botAction = (g, s) => (g.phase === 'play' && g.turn === g.dummy && s === g.declarer ? bot(g, g.dummy) : bot(g, s));
  const sh = bridge.cfg.scoreHand;
  bridge.cfg.scoreHand = g => { if (g.contract) sh(g); else g.res = 'Everyone passed — redeal'; };
}
export { STRAINS, SNAME };
