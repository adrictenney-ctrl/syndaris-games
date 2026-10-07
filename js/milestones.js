// Milestones: work through ten stages, one per round if you can. Each stage asks for a
// combination of sets (same number), runs (numbers in a row) or a colour group. On your turn:
// draw (deck or discard), lay down your stage once you hold it, then add cards to anyone's
// laid-down groups, and discard one card. Go out and the round ends; everyone who laid down
// moves to the next stage, and the cards left in hand score against you. The first to finish
// stage ten wins (lowest score breaks a tie). Wilds fill in anywhere; a Skip makes someone
// miss their next turn.
//
// Cards: 'S7.1' = sapphire 7 (copy 1); colours S sapphire, E emerald, G garnet, A amber.
// 'W.3' = wild, 'K.2' = skip.

export const COLORS = { S: 'Sapphire', E: 'Emerald', G: 'Garnet', A: 'Amber' };
export const STAGES = [
  [['set', 3], ['set', 3]],
  [['set', 3], ['run', 4]],
  [['set', 4], ['run', 4]],
  [['run', 7]],
  [['run', 8]],
  [['run', 9]],
  [['set', 4], ['set', 4]],
  [['color', 7]],
  [['set', 5], ['set', 2]],
  [['set', 5], ['set', 3]],
];
const WORD = { set: n => `a set of ${n}`, run: n => `a run of ${n}`, color: n => `${n} of one colour` };
export const stageText = i => STAGES[i].map(([t, n]) => WORD[t](n)).join(' + ');

export const isWild = c => c[0] === 'W';
export const isSkip = c => c[0] === 'K';
export const num = c => (isWild(c) || isSkip(c) ? 0 : parseInt(c.slice(1), 10));
export const col = c => c[0];
export const points = c => (isWild(c) ? 25 : isSkip(c) ? 15 : num(c) >= 10 ? 10 : 5);
export const sortHand = h => h.slice().sort((a, b) => (isSkip(a) - isSkip(b)) || (isWild(a) - isWild(b)) || num(a) - num(b) || col(a).localeCompare(col(b)));

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function makeDeck() {
  const d = [];
  for (const c of 'SEGA') for (let n = 1; n <= 12; n++) for (let k = 0; k < 2; k++) d.push(`${c}${n}.${k}`);
  for (let k = 0; k < 8; k++) d.push(`W.${k}`);
  for (let k = 0; k < 4; k++) d.push(`K.${k}`);
  return shuffle(d);
}

// ---------------------------------------------------------------- groups

// Is this exact list of cards a valid group of the given kind and size?
export function validGroup(kind, size, cards) {
  if (cards.length !== size || cards.some(isSkip)) return false;
  const nat = cards.filter(c => !isWild(c));
  if (!nat.length) return false;                       // at least one real card
  if (kind === 'set') return nat.every(c => num(c) === num(nat[0]));
  if (kind === 'color') return nat.every(c => col(c) === col(nat[0]));
  // run: distinct numbers that fit inside some window of `size` within 1..12
  const ns = nat.map(num);
  if (new Set(ns).size !== ns.length) return false;
  const lo = Math.min(...ns), hi = Math.max(...ns);
  return hi - lo < size && size <= 12;
}

// A laid-down group as stored: { kind, cards, lo, hi } (lo/hi = the run's span, wilds included).
export function makeGroup(kind, cards) {
  const g = { kind, cards: cards.slice() };
  if (kind === 'run') {
    const ns = cards.filter(c => !isWild(c)).map(num);
    let lo = Math.min(...ns), hi = Math.max(...ns);
    let spare = cards.length - (hi - lo + 1);
    while (spare > 0 && hi < 12) { hi++; spare--; }
    while (spare > 0 && lo > 1) { lo--; spare--; }
    g.lo = lo; g.hi = hi;
  }
  if (kind === 'set') g.n = num(cards.find(c => !isWild(c)));
  if (kind === 'color') g.c = col(cards.find(c => !isWild(c)));
  return g;
}

export function fitsGroup(gr, card) {
  if (isSkip(card)) return false;
  if (gr.kind === 'set') return isWild(card) || num(card) === gr.n;
  if (gr.kind === 'color') return isWild(card) || col(card) === gr.c;
  if (isWild(card)) return gr.lo > 1 || gr.hi < 12;
  return num(card) === gr.lo - 1 || num(card) === gr.hi + 1;
}

// Find a way to make every requirement from `cards`. With exact=true every card must be used.
export function solve(reqs, cards, exact) {
  const wilds = cards.filter(isWild), nat = cards.filter(c => !isWild(c) && !isSkip(c));
  if (exact && cards.some(isSkip)) return null;
  const need = reqs.reduce((a, [, n]) => a + n, 0);
  if (exact && cards.length !== need) return null;
  function rec(k, natLeft, wildLeft) {
    if (k === reqs.length) return exact && natLeft.length + wildLeft ? null : [];
    const [kind, n] = reqs[k];
    for (const pick of candidates(kind, n, natLeft, wildLeft)) {
      const rest = natLeft.filter(c => !pick.nat.includes(c));
      const r = rec(k + 1, rest, wildLeft - pick.w);
      if (r) return [{ kind, cards: [...pick.nat, ...wilds.slice(wilds.length - wildLeft, wilds.length - wildLeft + pick.w)] }, ...r];
    }
    return null;
  }
  return rec(0, nat, wilds.length);
}

function candidates(kind, n, nat, wild) {
  const out = [];
  if (kind === 'set' || kind === 'color') {
    const key = kind === 'set' ? num : col;
    const by = {};
    nat.forEach(c => { (by[key(c)] ||= []).push(c); });
    for (const cs of Object.values(by).sort((a, b) => b.length - a.length)) {
      for (let take = Math.min(n, cs.length); take >= 1; take--) {
        if (n - take <= wild) out.push({ nat: cs.slice(0, take), w: n - take });
      }
    }
  } else {
    for (let lo = 1; lo + n - 1 <= 12; lo++) {
      const pick = [];
      for (let v = lo; v < lo + n; v++) { const c = nat.find(x => num(x) === v && !pick.includes(x)); if (c) pick.push(c); }
      if (pick.length && n - pick.length <= wild) out.push({ nat: pick, w: n - pick.length });
    }
    out.sort((a, b) => a.w - b.w);
  }
  return out;
}

// ---------------------------------------------------------------- game

export function createGame(settings, players) {
  const g = {
    settings: { ...settings }, seats: players.map(p => !!p),
    stage: players.map(() => 0), score: players.map(() => 0),
    round: 0, dealer: -1, annId: 0, moveId: 0,
  };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  deal(g);
  return g;
}

function deal(g) {
  g.round++;
  g.dealer = (g.dealer + 1) % g.order.length;
  g.deck = makeDeck();
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.deck.splice(0, 10);
  g.discard = [g.deck.pop()];
  g.laid = g.seats.map(() => null);          // groups each player has laid down this round
  g.skipped = g.seats.map(() => 0);
  g.turn = g.order[(g.dealer + 1) % g.order.length];
  g.step = 'draw';
  g.phase = 'play';
  g.result = null;
  // A skip turned up to start the round skips the first player.
  if (isSkip(g.discard[0])) { g.skipped[g.turn]++; advanceTurn(g, true); }
}

function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }
const nextSeat = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];

function advanceTurn(g, fromStart = false) {
  let s = fromStart ? g.turn : nextSeat(g, g.turn);
  for (let k = 0; k < g.order.length * 2; k++) {
    if (g.skipped[s]) { g.skipped[s]--; announce(g, s, 'Skipped!'); s = nextSeat(g, s); continue; }
    break;
  }
  g.turn = s;
  g.step = 'draw';
}

function refill(g) {
  if (g.deck.length) return;
  const top = g.discard.pop();
  g.deck = shuffle(g.discard);
  g.discard = [top];
}

function endRound(g, out) {
  const pts = {};
  for (const s of g.order) { pts[s] = g.hands[s].reduce((a, c) => a + points(c), 0); g.score[s] += pts[s]; }
  const advanced = g.order.filter(s => g.laid[s]);
  advanced.forEach(s => { g.stage[s]++; });
  g.result = { out, pts, advanced };
  const finished = g.order.filter(s => g.stage[s] >= STAGES.length);
  if (finished.length) {
    const low = Math.min(...finished.map(s => g.score[s]));
    g.winners = finished.filter(s => g.score[s] === low);
    g.phase = 'over';
  } else { g.phase = 'roundOver'; g.nextAt = Date.now() + 7000; }
}

export function advance(g) {
  if (g.phase === 'roundOver' && Date.now() >= g.nextAt) { deal(g); return true; }
  return false;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next round';
  if (seat !== g.turn) return "It isn't your turn";
  const hand = g.hands[seat];
  if (a.type === 'draw' || a.type === 'take') {
    if (g.step !== 'draw') return 'You already drew';
    if (a.type === 'take') {
      const top = g.discard[g.discard.length - 1];
      if (!top) return 'The discard pile is empty';
      if (isSkip(top)) return "You can't pick up a Skip";
      hand.push(g.discard.pop());
    } else { refill(g); hand.push(g.deck.pop()); }
    g.step = 'act';
    g.moveId++;
    return null;
  }
  if (g.step !== 'act') return 'Draw a card first';
  if (a.type === 'lay') {
    if (g.laid[seat]) return 'You already laid down your stage';
    const cards = [...new Set(a.cards || [])];
    if (!cards.every(c => hand.includes(c))) return "Those cards aren't in your hand";
    const sol = solve(STAGES[g.stage[seat]], cards, true);
    if (!sol) return `That isn't ${stageText(g.stage[seat])}`;
    g.laid[seat] = sol.map(x => makeGroup(x.kind, x.cards));
    g.hands[seat] = hand.filter(c => !cards.includes(c));
    announce(g, seat, `Stage ${g.stage[seat] + 1} done!`);
    g.moveId++;
    if (!g.hands[seat].length) endRound(g, seat);
    return null;
  }
  if (a.type === 'hit') {
    if (!g.laid[seat]) return 'Lay down your own stage first';
    const owner = a.owner, gi = a.group, card = a.card;
    const gr = g.laid[owner]?.[gi];
    if (!gr) return 'No such group';
    if (!hand.includes(card)) return "That card isn't in your hand";
    if (!fitsGroup(gr, card)) return "That card doesn't fit there";
    gr.cards.push(card);
    if (gr.kind === 'run') {
      if (isWild(card)) { if (gr.hi < 12) gr.hi++; else gr.lo--; }
      else if (num(card) === gr.hi + 1) gr.hi++; else gr.lo--;
    }
    g.hands[seat] = hand.filter(c => c !== card);
    g.moveId++;
    if (!g.hands[seat].length) endRound(g, seat);
    return null;
  }
  if (a.type === 'discard') {
    const card = a.card;
    if (!hand.includes(card)) return "That card isn't in your hand";
    if (isSkip(card)) {
      const t = a.target ?? nextSeat(g, seat);
      if (!g.order.includes(t) || t === seat) return 'Pick someone to skip';
      g.skipped[t]++;
      announce(g, seat, 'Plays a Skip!');
    }
    g.hands[seat] = hand.filter(c => c !== card);
    g.discard.push(card);
    g.moveId++;
    if (!g.hands[seat].length) { announce(g, seat, 'Out!'); endRound(g, seat); return null; }
    advanceTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, step: g.step, turn: g.turn, order: g.order, round: g.round,
    hand: g.hands[seat] ? sortHand(g.hands[seat]) : [], top: g.discard[g.discard.length - 1] ?? null,
    counts: g.hands.map(h => h.length), laid: g.laid, stage: g.stage, score: g.score, skipped: g.skipped,
    result: g.result, winners: g.winners || null, moveId: g.moveId,
  };
}

// ---------------------------------------------------------------- bots

// Roughly how many cards short of the stage this hand is.
function shortfall(reqs, hand) {
  if (solve(reqs, hand, false)) return 0;
  const nat = hand.filter(c => !isWild(c) && !isSkip(c)), w = hand.filter(isWild).length;
  let miss = 0;
  const used = new Set();
  for (const [kind, n] of reqs) {
    let best = n;
    if (kind === 'set' || kind === 'color') {
      const key = kind === 'set' ? num : col, by = {};
      nat.filter(c => !used.has(c)).forEach(c => { (by[key(c)] ||= []).push(c); });
      const top = Object.values(by).sort((a, b) => b.length - a.length)[0] || [];
      best = Math.max(0, n - top.length);
      top.slice(0, n).forEach(c => used.add(c));
    } else {
      for (let lo = 1; lo + n - 1 <= 12; lo++) {
        const have = new Set(nat.filter(c => !used.has(c) && num(c) >= lo && num(c) < lo + n).map(num)).size;
        best = Math.min(best, n - have);
      }
    }
    miss += best;
  }
  return Math.max(0, miss - w);
}

export function botAction(g, seat) {
  const hand = g.hands[seat], reqs = STAGES[Math.min(g.stage[seat], 9)];
  if (g.step === 'draw') {
    const top = g.discard[g.discard.length - 1];
    if (top && !isSkip(top)) {
      if (isWild(top)) return { type: 'take' };
      if (!g.laid[seat] && shortfall(reqs, [...hand, top]) < shortfall(reqs, hand)) return { type: 'take' };
      if (g.laid[seat] && g.order.some(o => g.laid[o]?.some(gr => fitsGroup(gr, top)))) return { type: 'take' };
    }
    return { type: 'draw' };
  }
  if (!g.laid[seat]) {
    const sol = solve(reqs, hand, false);
    if (sol) return { type: 'lay', cards: sol.flatMap(x => x.cards) };
  } else {
    for (const c of hand) for (const o of g.order) {
      const i = g.laid[o]?.findIndex(gr => fitsGroup(gr, c));
      if (i != null && i >= 0) return { type: 'hit', owner: o, group: i, card: c };
    }
  }
  // Discard: a skip on the leader first, else the card that hurts least (high points first).
  const skip = hand.find(isSkip);
  if (skip) {
    const others = g.order.filter(s => s !== seat).sort((a, b) => g.stage[b] - g.stage[a] || g.hands[a].length - g.hands[b].length);
    return { type: 'discard', card: skip, target: others[0] };
  }
  let best = null, bestS = Infinity;
  for (const c of hand) {
    if (isWild(c)) continue;
    const rest = hand.filter(x => x !== c);
    const s = (g.laid[seat] ? 0 : shortfall(reqs, rest) * 100) - points(c);
    if (s < bestS) { bestS = s; best = c; }
  }
  return { type: 'discard', card: best ?? hand[0] };
}
