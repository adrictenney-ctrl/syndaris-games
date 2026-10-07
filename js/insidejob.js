// Inside Job: a cooperative heist played with Texas Hold'em hands. Nobody may say what
// cards they hold. Each round everyone takes a poker chip (100 = weakest hand at the table,
// 200 = next, and so on) to show how strong they think their hand is. Chips can be taken
// from the middle or straight from another player. At the showdown, hands are revealed
// from the lowest red chip to the highest: if they really go weakest to strongest, the vault
// opens. Crack 3 vaults before 3 alarms go off.
import { bestHand, describe, RANKS } from './poker.js?v=53';

export const ROUNDS = ['white', 'yellow', 'orange', 'red'];
export const ROUND_NAME = ['Before the flop', 'The flop', 'The turn', 'The river'];
const WIN = 3, LOSE = 3;

// After a cracked vault the next heist gets a Complication; after an alarm, a Specialist.
export const TWISTS = {
  butterfingers: { kind: 'complication', name: 'Butterfingers', text: 'Everyone gets three cards and must drop one right after the flop.' },
  blindriver: { kind: 'complication', name: 'Blind River', text: 'The river card stays face down until the showdown. Red chips are taken without it.' },
  coldstart: { kind: 'complication', name: 'Cold Start', text: 'No white chips. The first chips are taken after the flop.' },
  glueyfingers: { kind: 'complication', name: 'Sticky Fingers', text: 'Red chips can only be taken from the middle, never from another player.' },
  safecracker: { kind: 'specialist', name: 'The Safecracker', text: 'The vault still opens if one pair of neighbors is out of order.' },
  lookout: { kind: 'specialist', name: 'The Lookout', text: 'One flop card is turned up before the white chips.' },
  insider: { kind: 'specialist', name: 'The Insider', text: 'After the flop, everyone shows their lower card.' },
  forger: { kind: 'specialist', name: 'The Forger', text: 'After the flop, everyone may swap one card for a fresh one.' },
};

const SUITS = 'SHDC';
const rv = c => RANKS.indexOf(c[0]) + 2;
const rnd = n => Math.floor(Math.random() * n);
function deck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push(r + s);
  for (let i = d.length - 1; i > 0; i--) { const j = rnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
let annN = 0;

// ---------------------------------------------------------------- setup

export function createGame(settings, players) {
  const g = {
    settings: { twists: true, ...settings },
    seats: [],
    heist: 0,
    vaults: 0,
    alarms: 0,
    history: [],
    nextTwist: null,
    phase: 'chips',
    announce: null,
  };
  refreshSeats(g, players);
  startHeist(g);
  return g;
}

export function refreshSeats(g, players) {
  g.seats = players.map(p => (p ? (p.bot ? 'bot' : 'human') : null));
}

function startHeist(g) {
  g.heist++;
  g.crew = g.seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
  g.n = g.crew.length;
  g.twist = g.settings.twists ? g.nextTwist : null;
  g.nextTwist = null;
  g.deck = deck();
  g.hole = {};
  for (const s of g.crew) g.hole[s] = g.deck.splice(0, g.twist === 'butterfingers' ? 3 : 2);
  g.board = [];
  g.early = g.twist === 'lookout' ? g.deck.pop() : null;   // the Lookout's flop card, shown early
  g.shown = {};
  g.chips = [null, null, null, null];
  g.ready = {};
  g.pick = null;
  g.show = null;
  g.result = null;
  g.round = -1;
  if (g.twist === 'coldstart') { dealFlop(g); afterFlop(g); }
  else nextRound(g, 0);
}

function dealFlop(g) {
  g.board = g.early ? [g.early, g.deck.pop(), g.deck.pop()] : [g.deck.pop(), g.deck.pop(), g.deck.pop()];
}

// Things that happen right after the flop (before the yellow chips).
function afterFlop(g) {
  if (g.twist === 'insider') for (const s of g.crew) g.shown[s] = g.hole[s].slice().sort((a, b) => rv(a) - rv(b))[0];
  if (g.twist === 'butterfingers' || g.twist === 'forger') {
    g.phase = 'pick';
    g.pick = { mode: g.twist === 'butterfingers' ? 'drop' : 'swap', done: {} };
    return;
  }
  nextRound(g, 1);
}

function nextRound(g, r) {
  g.round = r;
  g.phase = 'chips';
  g.chips[r] = new Array(g.n).fill(null);
  g.ready = {};
}

// ---------------------------------------------------------------- helpers

const crewIndex = (g, seat) => g.crew.indexOf(seat);
export const chipOf = (g, seat, r = g.round) => (g.chips[r] ? g.chips[r].indexOf(seat) : -1);
const allHold = g => g.crew.every(s => !g.seats[s] || chipOf(g, s) >= 0);
const allReady = g => g.crew.every(s => !g.seats[s] || g.ready[s]);

function advanceRound(g) {
  if (g.round === 0) { dealFlop(g); afterFlop(g); return; }
  if (g.round === 1) { g.board.push(g.deck.pop()); nextRound(g, 2); return; }
  if (g.round === 2) { g.board.push(g.deck.pop()); nextRound(g, 3); return; }
  showdown(g);
}

function showdown(g) {
  const red = g.chips[3];
  const order = red.map((seat, k) => ({ seat, value: k + 1 })).filter(x => x.seat !== null);
  const hands = {};
  for (const { seat } of order) {
    const best = bestHand([...g.hole[seat], ...g.board]);
    hands[seat] = { score: best.score, name: describe(best), best: best.cards };
  }
  let wrong = 0;
  const bad = [];
  for (let i = 1; i < order.length; i++) {
    if (hands[order[i].seat].score < hands[order[i - 1].seat].score) { wrong++; bad.push(i); }
  }
  const ok = wrong === 0 || (g.twist === 'safecracker' && wrong === 1);
  g.phase = 'showdown';
  g.show = { order, hands, bad, ok, revealed: 0, wrong };
}

function finishHeist(g) {
  const ok = g.show.ok;
  if (ok) g.vaults++; else g.alarms++;
  g.history.push(ok);
  g.result = { ok, wrong: g.show.wrong };
  g.phase = g.vaults >= WIN || g.alarms >= LOSE ? 'over' : 'result';
  if (g.phase === 'result' && g.settings.twists) {
    const pool = Object.keys(TWISTS).filter(k => TWISTS[k].kind === (ok ? 'complication' : 'specialist') && k !== g.twist);
    g.nextTwist = pool[rnd(pool.length)];
  }
}

// ---------------------------------------------------------------- actions

export function applyAction(g, seat, a) {
  if (!a || typeof a !== 'object') return 'Bad move';
  if (crewIndex(g, seat) < 0) return "You'll join the next heist";
  switch (a.type) {
    case 'take': {
      if (g.phase !== 'chips') return 'No chips to take right now';
      const k = Number(a.k);
      const row = g.chips[g.round];
      if (!(k >= 0 && k < row.length)) return 'Pick a chip';
      const owner = row[k];
      if (owner === seat) return null;
      if (owner !== null && g.round === 3 && g.twist === 'glueyfingers') return 'Sticky Fingers: red chips only come from the middle';
      const mine = row.indexOf(seat);
      if (mine >= 0) row[mine] = null;            // your old chip goes back to the middle
      row[k] = seat;
      g.ready = {};                               // anything changed: everyone looks again
      if (owner !== null) g.announce = { id: 'ij' + ++annN, seat: owner, text: `My ${(k + 1) * 100} chip got taken!` };
      return null;
    }
    case 'ready': {
      if (g.phase !== 'chips') return null;
      if (chipOf(g, seat) < 0) return 'Take a chip first';
      g.ready[seat] = a.on !== false;
      if (allHold(g) && allReady(g)) advanceRound(g);
      return null;
    }
    case 'pick': {
      if (g.phase !== 'pick' || g.pick.done[seat]) return null;
      const hand = g.hole[seat];
      if (a.card === null || a.card === undefined) {
        if (g.pick.mode === 'drop') return 'Pick a card to drop';
        g.pick.done[seat] = true;                 // the Forger: keep both
      } else {
        const i = hand.indexOf(a.card);
        if (i < 0) return "That isn't your card";
        if (g.pick.mode === 'drop') hand.splice(i, 1);
        else hand[i] = g.deck.pop();
        g.pick.done[seat] = true;
      }
      if (g.crew.every(s => !g.seats[s] || g.pick.done[s])) { g.pick = null; nextRound(g, 1); }
      return null;
    }
    case 'next':
      if (g.phase === 'result') startHeist(g);
      if (g.phase === 'showdown') { g.show.revealed = g.show.order.length; finishHeist(g); }
      return null;
  }
  return 'Unknown move';
}

// ---------------------------------------------------------------- bots

// How strong a hand looks: the share of other players it beats, from a quick simulation.
function strength(g, seat, sims = 160) {
  const seen = g.twist === 'blindriver' && g.board.length === 5 ? g.board.slice(0, 4) : g.board;
  const known = new Set([...g.hole[seat], ...seen]);
  const rest = [];
  for (const s of SUITS) for (const r of RANKS) if (!known.has(r + s)) rest.push(r + s);
  const others = g.n - 1;
  const boardLeft = 5 - seen.length;
  let beat = 0;
  for (let t = 0; t < sims; t++) {
    const d = rest.slice();
    const draw = () => d.splice(rnd(d.length), 1)[0];
    const board = g.twist === 'blindriver' && g.board.length === 5 ? g.board.slice(0, 4) : [...g.board];
    for (let i = 0; i < boardLeft; i++) board.push(draw());
    const me = bestHand([...g.hole[seat].slice(0, 2), ...board]).score;
    for (let o = 0; o < others; o++) {
      const them = bestHand([draw(), draw(), ...board]).score;
      beat += me > them ? 1 : me === them ? 0.5 : 0;
    }
  }
  return beat / (sims * others || 1);
}

export function botStep(g) {
  if (g.phase === 'pick') {
    const s = g.crew.find(x => g.seats[x] === 'bot' && !g.pick.done[x]);
    if (s === undefined) return false;
    const hand = g.hole[s];
    if (g.pick.mode === 'drop') {
      // Drop the card that helps least: try each and keep the best two.
      let best = null;
      for (const c of hand) {
        const keep = hand.filter(x => x !== c);
        const score = bestHand([...keep, ...g.board]).score;
        if (!best || score > best.score) best = { c, score };
      }
      applyAction(g, s, { type: 'pick', card: best.c });
    } else applyAction(g, s, { type: 'pick', card: null });
    return true;
  }
  if (g.phase !== 'chips') return false;
  const row = g.chips[g.round];
  for (const s of g.crew) {
    if (g.seats[s] !== 'bot') continue;
    g.bots = g.bots || {};
    const key = `${g.heist}:${g.round}:${g.board.length}`;
    if (!g.bots[s] || g.bots[s].key !== key) g.bots[s] = { key, want: Math.round(strength(g, s) * (g.n - 1)) };
    const want = g.bots[s].want;
    const have = row.indexOf(s);
    // The chip this hand deserves is held by another bot that wants it less: take it.
    // (Bots never take chips from people; people know their own hands.)
    const owner = row[want];
    if (owner !== null && owner !== s && g.seats[owner] === 'bot') {
      const theirs = g.bots[owner]?.want ?? want;
      if (Math.abs(theirs - want) > (have < 0 ? 0 : Math.abs(have - want)) && Math.abs(theirs - want) > 0) {
        applyAction(g, s, { type: 'take', k: want });
        return true;
      }
    }
    // Otherwise take the free chip closest to what the hand deserves.
    const free = row.map((o, k) => (o === null ? k : -1)).filter(k => k >= 0);
    if (free.length) {
      const k = free.sort((a, b) => Math.abs(a - want) - Math.abs(b - want))[0];
      if (have < 0 || Math.abs(k - want) < Math.abs(have - want)) { applyAction(g, s, { type: 'take', k }); return true; }
    }
    if (have >= 0 && !g.ready[s]) { applyAction(g, s, { type: 'ready' }); return true; }
  }
  return false;
}

// ---------------------------------------------------------------- the clock

export function timer(g, players) {
  refreshSeats(g, players);
  // Someone left mid-heist: the rest can still finish.
  if (g.phase === 'chips' && allHold(g) && allReady(g)) return { ms: 300, run: () => advanceRound(g) };
  if (g.phase === 'showdown') {
    if (g.show.revealed < g.show.order.length) return { ms: g.show.revealed ? 1500 : 900, run: () => { g.show.revealed++; } };
    return { ms: 1200, run: () => { if (g.phase === 'showdown') finishHeist(g); } };
  }
  if (g.phase === 'result') return { ms: 9000, run: () => { if (g.phase === 'result') startHeist(g); } };
  if (['chips', 'pick'].includes(g.phase) && g.crew.some(s => g.seats[s] === 'bot')) {
    return { ms: 700 + rnd(700), run: () => botStep(g) };
  }
  return null;
}

// ---------------------------------------------------------------- views

export function viewFor(g, seat) {
  const blind = g.twist === 'blindriver' && g.board.length === 5 && !['showdown', 'result', 'over'].includes(g.phase);
  const show = g.show && {
    order: g.show.order, revealed: g.show.revealed, bad: g.show.bad, ok: g.show.ok,
    hands: Object.fromEntries(g.show.order.slice(0, g.show.revealed).map(({ seat: s }) => [s, { cards: g.hole[s], ...g.show.hands[s] }])),
  };
  return {
    phase: g.phase,
    heist: g.heist,
    round: g.round,
    crew: g.crew,
    inCrew: g.crew.includes(seat),
    hole: g.hole[seat] || [],
    board: blind ? [...g.board.slice(0, 4), null] : g.board,
    early: g.board.length ? null : g.early,
    shown: g.shown,
    chips: g.chips,
    ready: g.ready,
    pick: g.pick && { mode: g.pick.mode, done: !!g.pick.done[seat], waiting: g.crew.filter(s => !g.pick.done[s]).length },
    twist: g.twist ? { id: g.twist, ...TWISTS[g.twist] } : null,
    nextTwist: g.phase === 'result' && g.nextTwist ? { id: g.nextTwist, ...TWISTS[g.nextTwist] } : null,
    vaults: g.vaults,
    alarms: g.alarms,
    history: g.history,
    show,
    result: g.result,
    seats: g.seats,
  };
}

export const turn = () => -1;
export const botAction = () => ({ type: 'ready' });
