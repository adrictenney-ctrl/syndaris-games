// Cribbage for two. Six cards each; both throw two into the dealer's crib. A starter is cut (a
// Jack gives the dealer 2, "his heels"). Pegging: take turns laying cards, keeping a running
// count that can't pass 31 — score 2 for making 15 or 31, pairs (2, 6, 12), runs of three or
// more, 1 for a "go" or the last card. Then the show: the non-dealer's hand, the dealer's hand
// and the crib, each with the starter: fifteens 2, pairs 2, runs, a flush (4, or 5 with the
// starter — the crib needs all 5) and the Jack of the starter's suit 1 ("nobs"). First to 121.
import { fullDeck, shuffle, announce } from './tricks.js?v=66';

export const ORDER = 'A23456789TJQK';
export const pip = c => Math.min(10, ORDER.indexOf(c[0]) + 1);
const ri = c => ORDER.indexOf(c[0]);
export const WIN = 121;

export function createGame(settings) {
  const g = { settings: { ...settings }, scores: [0, 0], prev: [0, 0], dealer: Math.floor(Math.random() * 2), handNo: 0, annId: 0, moveId: 0 };
  deal(g);
  return g;
}

function deal(g) {
  g.handNo++;
  g.dealer = 1 - g.dealer;
  g.deck = shuffle(fullDeck());
  g.hands = [g.deck.splice(0, 6), g.deck.splice(0, 6)].map(sortC);
  g.crib = [];
  g.thrown = [null, null];
  g.played = [];
  g.seq = [];
  g.count = 0;
  g.starter = null;
  g.phase = 'discard';
  g.show = null;
  g.moveId++;
}
const sortC = h => h.slice().sort((a, b) => ri(a) - ri(b) || 'SHDC'.indexOf(a[1]) - 'SHDC'.indexOf(b[1]));

function peg(g, s, pts, why) {
  if (!pts || g.phase === 'over') return;
  g.prev[s] = g.scores[s];
  g.scores[s] = Math.min(WIN, g.scores[s] + pts);
  g.log = { seat: s, pts, why, id: (g.log?.id || 0) + 1 };
  announce(g, s, `+${pts} ${why}`);
  if (g.scores[s] >= WIN) { g.phase = 'over'; g.winner = s; g.turn = -1; }
}

export const current = g => (g.phase === 'peg' ? g.turn : -1);

// Points for the cards just played in pegging.
function pegPoints(seq, count) {
  let pts = 0;
  const why = [];
  if (count === 15) { pts += 2; why.push('fifteen'); }
  if (count === 31) { pts += 2; why.push('thirty-one'); }
  let k = 1;
  while (k < seq.length && seq[seq.length - 1 - k][0] === seq[seq.length - 1][0]) k++;
  if (k >= 2) { const p = { 2: 2, 3: 6, 4: 12 }[k]; pts += p; why.push(k === 2 ? 'pair' : k === 3 ? 'three of a kind' : 'four of a kind'); }
  for (let n = seq.length; n >= 3; n--) {
    const r = seq.slice(-n).map(ri).sort((a, b) => a - b);
    if (r.every((x, i) => i === 0 || x === r[i - 1] + 1)) { pts += n; why.push(`run of ${n}`); break; }
  }
  return { pts, why: why.join(' + ') };
}

// Scores a hand of four (plus the starter) for the show.
export function handScore(hand, starter, crib = false) {
  const all = [...hand, starter];
  const parts = [];
  let fif = 0;
  for (let m = 1; m < 32; m++) { let t = 0; for (let i = 0; i < 5; i++) if (m & (1 << i)) t += pip(all[i]); if (t === 15) fif++; }
  if (fif) parts.push([`${fif} fifteen${fif > 1 ? 's' : ''}`, fif * 2]);
  let pairs = 0;
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (all[i][0] === all[j][0]) pairs++;
  if (pairs) parts.push([`${pairs} pair${pairs > 1 ? 's' : ''}`, pairs * 2]);
  const cnt = Array(13).fill(0);
  all.forEach(c => cnt[ri(c)]++);
  let runPts = 0;
  for (let i = 0; i < 13 && !runPts; i++) {
    let len = 0, mult = 1;
    while (i + len < 13 && cnt[i + len]) { mult *= cnt[i + len]; len++; }
    if (len >= 3) runPts = len * mult;
    if (len) i += len - 1;
  }
  if (runPts) parts.push(['runs', runPts]);
  if (hand.every(c => c[1] === hand[0][1])) {
    if (starter[1] === hand[0][1]) parts.push(['flush of 5', 5]);
    else if (!crib) parts.push(['flush', 4]);
  }
  if (hand.some(c => c[0] === 'J' && c[1] === starter[1])) parts.push(['nobs', 1]);
  return { total: parts.reduce((a, p) => a + p[1], 0), parts };
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'discard') {
    if (a.type !== 'crib') return 'Throw two cards into the crib';
    if (g.thrown[seat]) return 'Already done';
    const cs = a.cards || [];
    if (cs.length !== 2 || cs[0] === cs[1] || !cs.every(c => g.hands[seat].includes(c))) return 'Pick two cards';
    g.thrown[seat] = cs;
    g.moveId++;
    if (g.thrown.every(Boolean)) {
      for (const s of [0, 1]) { g.hands[s] = g.hands[s].filter(c => !g.thrown[s].includes(c)); g.crib.push(...g.thrown[s]); }
      g.starter = g.deck.pop();
      g.kept = g.hands.map(h => h.slice());
      if (g.starter[0] === 'J') peg(g, g.dealer, 2, 'his heels');
      if (g.phase === 'over') return null;
      g.phase = 'peg';
      g.turn = 1 - g.dealer;
      g.count = 0;
      g.seq = [];
      g.played = [];
      g.go = [false, false];
    }
    return null;
  }
  if (g.phase !== 'peg') return 'Not now';
  if (seat !== g.turn) return "It isn't your turn";
  if (a.type === 'go') {
    if (g.hands[seat].some(c => g.count + pip(c) <= 31)) return 'You can still play';
    g.go[seat] = true;
    announce(g, seat, 'Go');
    g.moveId++;
    afterGo(g, seat);
    return null;
  }
  if (a.type !== 'play') return "That move isn't allowed";
  if (!g.hands[seat].includes(a.card)) return 'Not in your hand';
  if (g.count + pip(a.card) > 31) return 'That would go past 31';
  g.hands[seat] = g.hands[seat].filter(c => c !== a.card);
  g.count += pip(a.card);
  g.seq.push(a.card);
  g.played.push({ seat, card: a.card });
  g.lastBy = seat;
  g.moveId++;
  const r = pegPoints(g.seq, g.count);
  peg(g, seat, r.pts, r.why);
  if (g.phase === 'over') return null;
  if (g.count === 31) return resetCount(g, seat, false);
  if (!g.hands[0].length && !g.hands[1].length) { peg(g, seat, 1, 'last card'); return g.phase === 'over' ? null : startShow(g); }
  const o = 1 - seat;
  if (!g.go[o] && g.hands[o].length) g.turn = o;
  else if (!g.hands[seat].length || !g.hands[seat].some(c => g.count + pip(c) <= 31)) afterGo(g, seat);
  return null;
}

// Nobody else can play: the last player to lay a card scores 1 for the go and the count resets.
function afterGo(g, seat) {
  const o = 1 - seat;
  const canPlay = s => g.hands[s].some(c => g.count + pip(c) <= 31);
  if (canPlay(o) && !g.go[o]) { g.turn = o; return; }
  if (canPlay(seat)) { g.turn = seat; return; }
  resetCount(g, g.lastBy, true);
}

function resetCount(g, last, scoreGo) {
  if (scoreGo && g.count !== 31) peg(g, last, 1, 'go');
  if (g.phase === 'over') return null;
  g.count = 0;
  g.seq = [];
  g.go = [false, false];
  if (!g.hands[0].length && !g.hands[1].length) return startShow(g);
  const o = 1 - last;
  g.turn = g.hands[o].length ? o : last;
  return null;
}

function startShow(g) {
  g.phase = 'show';
  g.turn = -1;
  const nd = 1 - g.dealer;
  g.show = [
    { seat: nd, what: 'hand', cards: g.kept[nd], ...handScore(g.kept[nd], g.starter) },
    { seat: g.dealer, what: 'hand', cards: g.kept[g.dealer], ...handScore(g.kept[g.dealer], g.starter) },
    { seat: g.dealer, what: 'crib', cards: g.crib, ...handScore(g.crib, g.starter, true) },
  ];
  g.showStep = 0;
  g.nextAt = Date.now() + 1500;
  return null;
}

export function tick(g, players) {
  if (g.phase === 'discard') {
    const s = [0, 1].find(x => !g.thrown[x] && players?.[x]?.bot);
    return s == null ? null : { ms: 600, run: () => applyAction(g, s, botAction(g, s)) };
  }
  if (g.phase === 'show') {
    return {
      ms: Math.max(0, g.nextAt - Date.now()),
      run: () => {
        if (g.showStep < 3) { const sh = g.show[g.showStep]; g.showStep++; peg(g, sh.seat, sh.total, sh.what === 'crib' ? 'in the crib' : 'in hand'); g.nextAt = Date.now() + 4200; g.moveId++; }
        else deal(g);
      },
    };
  }
  return null;
}

// ------------------------------------------------------------------ computer player
export function botAction(g, s) {
  if (g.phase === 'discard') {
    const h = g.hands[s];
    let best = null;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
      const keep = h.filter((_, k) => k !== i && k !== j);
      // Average over a few possible starters.
      let tot = 0;
      for (const st of ['5H', 'TC', 'AD', '7S', 'KH', '3C']) if (!h.includes(st)) tot += handScore(keep, st).total;
      const toss = [h[i], h[j]];
      const cribBonus = (pip(toss[0]) + pip(toss[1]) === 15 ? 2 : 0) + (toss[0][0] === toss[1][0] ? 2 : 0) + toss.filter(c => c[0] === '5').length;
      const v = tot / 6 + (s === g.dealer ? cribBonus : -cribBonus);
      if (!best || v > best.v) best = { v, toss };
    }
    return { type: 'crib', cards: best.toss };
  }
  const ok = g.hands[s].filter(c => g.count + pip(c) <= 31);
  if (!ok.length) return { type: 'go' };
  let best = null;
  for (const c of ok) {
    const n = g.count + pip(c);
    let v = pegPoints([...g.seq, c], n).pts * 10;
    if (n === 5 || n === 21) v -= 6;
    if (n < 15 && n + 10 >= 15) v -= 1;
    v += pip(c) * 0.1;
    if (!best || v > best.v) best = { v, c };
  }
  return { type: 'play', card: best.c };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, dealer: g.dealer, scores: g.scores, prev: g.prev, hand: g.hands[seat], thrown: g.thrown[seat], thrownAll: g.thrown.map(Boolean),
    starter: g.starter, turn: g.turn, count: g.count ?? 0, seq: g.seq || [], played: g.played || [], go: g.go, counts: g.hands.map(h => h.length),
    canPlay: g.phase === 'peg' && g.turn === seat ? g.hands[seat].filter(c => g.count + pip(c) <= 31) : [],
    show: g.show, showStep: g.showStep ?? 0, winner: g.winner ?? null, handNo: g.handNo,
  };
}
