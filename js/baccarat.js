// Baccarat (punto banco) against the house. Everyone bets on the Player hand, the Banker
// hand, or a Tie (and optionally on a pair in either hand); then the table deals both hands
// by the fixed drawing rules. Closest to 9 wins.
// Pays: Player 1:1, Banker 0.95:1 (5% commission), Tie 8:1 (Player and Banker bets push),
// Player Pair / Banker Pair 11:1.
import { makeShoe, syncStacks } from './casino.js?v=57';

export const SPOTS = ['player', 'banker', 'tie', 'ppair', 'bpair'];
export const PAYS = { player: 1, banker: 0.95, tie: 8, ppair: 11, bpair: 11 };
export const DEFAULTS = { startChips: 1000, min: 10, pairs: true, rebuy: true };

export const value = c => ('TJQK'.includes(c[0]) ? 0 : c[0] === 'A' ? 1 : Number(c[0]));
export const score = cards => cards.reduce((t, c) => t + value(c), 0) % 10;

export function createGame(settings, players) {
  const g = {
    settings: { ...DEFAULTS, ...settings },
    seats: [], stacks: {},
    shoe: makeShoe(8), shuffled: true,
    phase: 'bet', round: 0,
    bets: {}, lastBets: {}, ready: {},
    player: [], banker: [], shown: 0, result: null,
    road: [],
    betDeadline: 0,
  };
  syncStacks(g, players);
  return g;
}

const betTotal = b => (b ? SPOTS.reduce((t, k) => t + (b[k] || 0), 0) : 0);

// The fixed drawing rules (the "tableau").
function play(g) {
  const p = [g.shoe.pop()], b = [g.shoe.pop()];
  p.push(g.shoe.pop()); b.push(g.shoe.pop());
  const order = [['P', 0], ['B', 0], ['P', 1], ['B', 1]];
  const ps = score(p), bs = score(b);
  if (ps < 8 && bs < 8) {
    let p3 = null;
    if (ps <= 5) { p3 = g.shoe.pop(); p.push(p3); order.push(['P', 2]); }
    let bankerDraws;
    if (p3 === null) bankerDraws = bs <= 5;
    else {
      const v = value(p3);
      bankerDraws = bs <= 2 || (bs === 3 && v !== 8) || (bs === 4 && v >= 2 && v <= 7) || (bs === 5 && v >= 4 && v <= 7) || (bs === 6 && (v === 6 || v === 7));
    }
    if (bankerDraws) { b.push(g.shoe.pop()); order.push(['B', 2]); }
  }
  return { p, b, order };
}

function deal(g) {
  const playing = g.seats.map((s, i) => (s && betTotal(g.bets[i]) >= g.settings.min && betTotal(g.bets[i]) <= g.stacks[i] ? i : -1)).filter(i => i >= 0);
  if (!playing.length) return;
  if (g.shoe.length < 14) { g.shoe = makeShoe(8); g.shuffled = true; } else g.shuffled = false;
  g.round++;
  g.playing = playing;
  for (const s of playing) { g.stacks[s] -= betTotal(g.bets[s]); g.lastBets[s] = { ...g.bets[s] }; }
  const r = play(g);
  g.player = r.p; g.banker = r.b; g.order = r.order;
  g.shown = 0;
  g.result = null;
  g.phase = 'deal';
  g.ready = {};
  g.betDeadline = 0;
}

function settle(g) {
  const ps = score(g.player), bs = score(g.banker);
  const winner = ps > bs ? 'player' : bs > ps ? 'banker' : 'tie';
  const ppair = g.player[0][0] === g.player[1][0], bpair = g.banker[0][0] === g.banker[1][0];
  const natural = (g.player.length === 2 && g.banker.length === 2) && (ps >= 8 || bs >= 8);
  const net = {};
  for (const s of g.playing) {
    const b = g.bets[s] || {};
    let back = 0;
    const win = k => { if (b[k]) back += b[k] * (1 + PAYS[k]); };
    if (winner === 'tie') { win('tie'); back += (b.player || 0) + (b.banker || 0); }
    else win(winner);
    if (ppair) win('ppair');
    if (bpair) win('bpair');
    g.stacks[s] += back;
    net[s] = back - betTotal(b);
  }
  g.result = { winner, ps, bs, ppair, bpair, natural, net };
  g.road.push({ w: winner[0].toUpperCase(), pp: ppair, bp: bpair, n: natural });
  if (g.road.length > 72) g.road.shift();
  g.phase = 'settle';
}

function newRound(g) {
  g.phase = 'bet';
  g.ready = {};
  g.player = []; g.banker = []; g.shown = 0; g.order = [];
  g.bets = {};
  for (const [s, b] of Object.entries(g.lastBets)) if (g.seats[s] && g.stacks[s] >= betTotal(b)) g.bets[s] = { ...b };
}

export function applyAction(g, seat, a) {
  if (!a || typeof a !== 'object') return 'Bad move';
  const S = g.settings;
  switch (a.type) {
    case 'bet': {
      if (g.phase !== 'bet') return 'Bets are closed';
      const b = {};
      for (const k of SPOTS) {
        if ((k === 'ppair' || k === 'bpair') && !S.pairs) continue;
        const v = Math.max(0, Math.floor(Number(a.bets?.[k]) || 0));
        if (v) b[k] = v;
      }
      if (betTotal(b) > g.stacks[seat]) return "You don't have that many chips";
      g.bets[seat] = b;
      g.ready[seat] = false;
      return null;
    }
    case 'ready': {
      if (g.phase !== 'bet') return null;
      if (a.on !== false && betTotal(g.bets[seat]) < S.min) return `The minimum bet is ${S.min}`;
      g.ready[seat] = a.on !== false;
      if (g.ready[seat] && !g.betDeadline) g.betDeadline = Date.now() + 20000;
      if (allReady(g)) deal(g);
      return null;
    }
    case 'deal':
      if (g.phase === 'bet') deal(g);
      return null;
    case 'rebuy':
      if (S.rebuy && g.stacks[seat] < S.min) g.stacks[seat] = S.startChips;
      return null;
    case 'next':
      if (g.phase === 'settle') newRound(g);
      return null;
  }
  return 'Unknown move';
}

const allReady = g => {
  const sitting = g.seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  const betting = sitting.filter(i => betTotal(g.bets[i]) >= g.settings.min);
  return betting.length > 0 && sitting.every(i => g.ready[i] || g.stacks[i] < g.settings.min);
};

export function timer(g, players) {
  syncStacks(g, players);
  if (g.phase === 'bet') {
    const bot = g.seats.findIndex((x, i) => x === 'bot' && !g.ready[i] && g.stacks[i] >= g.settings.min);
    if (bot >= 0) return { ms: 500, run: () => { g.bets[bot] = { [Math.random() < 0.55 ? 'banker' : 'player']: g.settings.min }; g.ready[bot] = true; if (allReady(g)) deal(g); } };
    if (g.betDeadline) return { ms: Math.max(0, g.betDeadline - Date.now()), run: () => { if (g.phase === 'bet') deal(g); } };
    return null;
  }
  // Turn the cards over one at a time, then pay out.
  if (g.phase === 'deal') {
    if (g.shown < g.order.length) return { ms: g.shown < 4 ? 700 : 1300, run: () => { g.shown++; } };
    return { ms: 900, run: () => { if (g.phase === 'deal') settle(g); } };
  }
  if (g.phase === 'settle') return { ms: 7000, run: () => { if (g.phase === 'settle') newRound(g); } };
  return null;
}

// What has been turned over so far.
export function visible(g) {
  const p = [], b = [];
  (g.order || []).slice(0, g.shown).forEach(([side, i]) => { (side === 'P' ? p : b)[i] = side === 'P' ? g.player[i] : g.banker[i]; });
  return { p, b };
}

export function viewFor(g, seat) {
  const v = visible(g);
  return {
    phase: g.phase,
    round: g.round,
    stack: g.stacks[seat] ?? 0,
    bets: g.bets[seat] || {},
    lastBets: g.lastBets[seat] || null,
    ready: !!g.ready[seat],
    min: g.settings.min,
    pairs: g.settings.pairs,
    rebuy: g.settings.rebuy,
    player: v.p, banker: v.b,
    pScore: v.p.filter(Boolean).length ? score(v.p.filter(Boolean)) : null,
    bScore: v.b.filter(Boolean).length ? score(v.b.filter(Boolean)) : null,
    result: g.phase === 'settle' ? { ...g.result, mine: g.result.net[seat] ?? null } : null,
    road: g.road.slice(-24),
    betLeft: g.betDeadline ? Math.max(0, g.betDeadline - Date.now()) : null,
  };
}

export const turn = () => -1;
export const botAction = () => null;
