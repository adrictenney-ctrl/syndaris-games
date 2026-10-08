// Lucky Streak: a push-your-luck card game. Each round everyone is dealt one card face up,
// then in turn either Hit (flip another) or Stay (bank what's in front of you). Flip a number
// you already have and you bust — nothing this round. Collect seven different numbers and
// you hit a Lucky Streak: +15 and the round ends at once. First past the target wins.
//
// The deck: twelve 12s, eleven 11s … one 1 and one 0; bonus cards +2 +4 +6 +8 +10 and ×2;
// and three each of Halt (make a player stop and bank), Triple Dare (a player must flip
// three cards) and Lucky Charm (saves you from one bust). Runs only on the table (host).

export const STREAK = 7, STREAK_BONUS = 15;
export const ACTIONS = {
  halt: { name: 'Halt', ic: '✋', text: 'Pick a player — they stop and bank their points' },
  dare: { name: 'Triple Dare', ic: '🎯', text: 'Pick a player — they must flip three cards' },
  charm: { name: 'Lucky Charm', ic: '🍀', text: 'Keep it. It saves you from one bust' },
};
export const typeOf = c => c.split('.')[0];
export const isNum = c => /^n\d+$/.test(typeOf(c));
export const numOf = c => Number(typeOf(c).slice(1));

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function fullDeck() {
  const d = [];
  let id = 0;
  const add = (t, k) => { for (let i = 0; i < k; i++) d.push(`${t}.${id++}`); };
  add('n0', 1);
  for (let n = 1; n <= 12; n++) add('n' + n, n);
  for (const m of ['p2', 'p4', 'p6', 'p8', 'p10', 'x2']) add(m, 1);
  for (const a of ['halt', 'dare', 'charm']) add(a, 3);
  return d;
}

export function createGame(settings, players) {
  const g = { settings: { target: 200, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.scores = g.seats.map(() => 0);
  g.deck = shuffle(fullDeck());
  g.discard = [];
  g.round = 0;
  g.dealerIdx = Math.floor(Math.random() * g.order.length) - 1;
  g.winners = [];
  startRound(g);
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

function startRound(g) {
  g.round++;
  g.dealerIdx = (g.dealerIdx + 1) % g.order.length;
  g.rows = g.seats.map(() => ({ nums: [], mods: [], cards: [], charm: null, status: 'in' }));
  // Everyone is dealt one card, starting left of the dealer.
  const first = (g.dealerIdx + 1) % g.order.length;
  g.forced = g.order.map((_, k) => ({ seat: g.order[(first + k) % g.order.length], why: 'deal' }));
  g.turnIdx = first;
  g.turn = g.order[first];
  g.need = null;          // { seat, kind: 'halt' | 'dare', card } — someone must pick a target
  g.later = [];           // action cards drawn during a Triple Dare, played once it's done
  g.phase = 'play';
  g.streak = null;
  g.roundPts = null;
  g.moveId++;
}

export const active = g => g.order.filter(s => g.rows[s].status === 'in');

export function roundPoints(g, s) {
  const r = g.rows[s];
  if (r.status === 'bust') return 0;
  let p = r.nums.reduce((a, c) => a + numOf(c), 0);
  if (r.mods.some(c => typeOf(c) === 'x2')) p *= 2;
  p += r.mods.filter(c => typeOf(c) !== 'x2').reduce((a, c) => a + Number(typeOf(c).slice(1)), 0);
  if (r.nums.length >= STREAK) p += STREAK_BONUS;
  return p;
}

// Who has to act: someone picking a target, otherwise the player whose turn it is
// (nobody while cards are being dealt out by the table).
export function current(g) {
  if (g.phase !== 'play') return -1;
  if (g.need) return g.need.seat;
  if (g.forced.length) return -1;
  return g.turn;
}

function draw(g) {
  if (!g.deck.length) {
    g.deck = shuffle(g.discard);
    g.discard = [];
    announce(g, g.turn, 'Reshuffle!');
  }
  return g.deck.pop();
}

function flip(g, s, why) {
  const c = draw(g), r = g.rows[s], t = typeOf(c);
  g.lastFlip = { seat: s, card: c, id: g.moveId + 1 };
  if (isNum(c)) {
    if (r.nums.some(x => typeOf(x) === t)) {
      if (r.charm) {
        g.discard.push(c, r.charm);
        r.cards = r.cards.filter(x => x !== r.charm);
        r.charm = null;
        announce(g, s, `${numOf(c)} again — saved by the Lucky Charm 🍀`);
        return;
      }
      r.cards.push(c);
      r.status = 'bust';
      r.bustCard = c;
      g.forced = g.forced.filter(f => f.seat !== s);
      g.later = g.later.filter(l => l.seat !== s);
      announce(g, s, `Bust! Two ${numOf(c)}s 💥`);
      return;
    }
    r.nums.push(c);
    r.cards.push(c);
    if (r.nums.length >= STREAK) { g.streak = s; announce(g, s, 'LUCKY STREAK! +15 🌟'); }
    return;
  }
  if (t === 'charm') {
    if (!r.charm) { r.charm = c; r.cards.push(c); return; }
    // A second charm goes to someone still in who hasn't got one, or away.
    const to = active(g).find(x => x !== s && !g.rows[x].charm);
    if (to != null) { g.rows[to].charm = c; g.rows[to].cards.push(c); announce(g, s, 'Passes a Lucky Charm on'); }
    else g.discard.push(c);
    return;
  }
  if (t === 'halt' || t === 'dare') {
    r.cards.push(c);
    if (why === 'dare' && g.forced.some(f => f.seat === s && f.why === 'dare')) { g.later.push({ seat: s, kind: t, card: c }); return; }
    if (why === 'dare') { g.later.push({ seat: s, kind: t, card: c }); return; }
    g.need = { seat: s, kind: t, card: c };
    autoTarget(g);
    return;
  }
  r.mods.push(c);
  r.cards.push(c);
}

// With nobody else still in, an action card can only hit the player who drew it.
function autoTarget(g) {
  if (!g.need) return;
  const others = active(g).filter(x => x !== g.need.seat);
  if (!others.length) applyTarget(g, g.need.seat);
}

function applyTarget(g, t) {
  const n = g.need;
  g.need = null;
  if (n.kind === 'halt') {
    g.rows[t].status = 'stay';
    g.forced = g.forced.filter(f => f.seat !== t || f.why === 'deal');
    // A halted player who hasn't been dealt yet still gets their first card.
    announce(g, n.seat, t === n.seat ? 'Halts — and banks' : 'Halt! ✋');
  } else {
    g.forced.unshift({ seat: t, why: 'dare' }, { seat: t, why: 'dare' }, { seat: t, why: 'dare' });
    announce(g, n.seat, 'Triple Dare! 🎯');
  }
}

// Actions saved up during a Triple Dare come out once the dare is over.
function releaseLater(g) {
  while (!g.need && g.later.length) {
    const l = g.later[0];
    if (g.forced.some(f => f.seat === l.seat && f.why === 'dare')) return;
    g.later.shift();
    if (g.rows[l.seat].status !== 'in' && l.kind === 'dare') continue;
    g.need = { seat: l.seat, kind: l.kind, card: l.card };
    autoTarget(g);
  }
}

function afterMove(g) {
  releaseLater(g);
  if (g.streak != null || (!active(g).length && !g.need)) return endRound(g);
  if (!g.need && !g.forced.length && g.rows[g.turn].status !== 'in') advance(g);
}

function advance(g) {
  for (let k = 1; k <= g.order.length; k++) {
    const i = (g.turnIdx + k) % g.order.length;
    if (g.rows[g.order[i]].status === 'in') { g.turnIdx = i; g.turn = g.order[i]; return; }
  }
}

function endRound(g) {
  g.forced = [];
  g.need = null;
  g.later = [];
  g.roundPts = g.seats.map((x, s) => (x ? roundPoints(g, s) : 0));
  g.order.forEach(s => { g.scores[s] += g.roundPts[s]; });
  g.phase = 'scored';
  g.scoredAt = Date.now();
  g.moveId++;
  const top = Math.max(...g.order.map(s => g.scores[s]));
  if (top >= g.settings.target) {
    g.winners = g.order.filter(s => g.scores[s] === top);
    g.phase = 'over';
  }
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (g.phase !== 'play') return 'Next round coming up';
  if (g.need) {
    if (seat !== g.need.seat) return 'Waiting for a target to be picked';
    if (a.type !== 'target') return `Pick who gets the ${ACTIONS[g.need.kind].name}`;
    const t = Number(a.target);
    if (!g.seats[t] || g.rows[t].status !== 'in') return 'Pick a player still in the round';
    applyTarget(g, t);
    g.moveId++;
    afterMove(g);
    return null;
  }
  if (g.forced.length) return 'Wait for the cards to be dealt';
  if (seat !== g.turn) return "It isn't your turn";
  if (a.type === 'stay') {
    if (!g.rows[seat].cards.length) return 'Flip at least one card first';
    g.rows[seat].status = 'stay';
    announce(g, seat, `Stays on ${roundPoints(g, seat)}`);
    advance(g);
  } else if (a.type === 'hit') {
    flip(g, seat, 'hit');
    advance(g);
  } else return "That move isn't allowed";
  g.moveId++;
  afterMove(g);
  return null;
}

// The table's clock: deal forced cards one at a time, and move on after the round's scores.
export function tick(g) {
  if (g.phase === 'scored') return { ms: Math.max(0, g.scoredAt + 4200 - Date.now()), run: () => { g.rows.forEach(r => g.discard.push(...r.cards)); startRound(g); } };
  if (g.phase !== 'play' || g.need || !g.forced.length) return null;
  return {
    ms: 650, run: () => {
      const f = g.forced.shift();
      if (f.why === 'deal' && g.rows[f.seat].cards.length) { g.moveId++; return afterMove(g); }
      if (g.rows[f.seat].status === 'bust') { g.moveId++; return afterMove(g); }
      flip(g, f.seat, f.why);
      g.moveId++;
      afterMove(g);
    },
  };
}

// ---------------------------------------------------------------- bots

// The chance the next card busts this player, from the cards nobody can see.
export function bustChance(g, s) {
  const seen = {};
  for (const c of g.discard) seen[typeOf(c)] = (seen[typeOf(c)] || 0) + 1;
  for (const r of g.rows) for (const c of r.cards) seen[typeOf(c)] = (seen[typeOf(c)] || 0) + 1;
  const total = {};
  for (const c of fullDeck()) total[typeOf(c)] = (total[typeOf(c)] || 0) + 1;
  let unseen = 0, bad = 0;
  for (const t in total) {
    const left = total[t] - (seen[t] || 0);
    unseen += left;
    if (g.rows[s].nums.some(c => typeOf(c) === t)) bad += left;
  }
  return unseen ? bad / unseen : 0;
}

export function botAction(g, seat) {
  if (g.need) {
    const others = active(g).filter(x => x !== seat);
    if (!others.length) return { type: 'target', target: seat };
    if (g.need.kind === 'halt') {
      // Halt the leader if they're doing well; or bank our own good round.
      const mine = roundPoints(g, seat);
      if (mine >= 30 && bustChance(g, seat) > 0.2) return { type: 'target', target: seat };
      const best = others.sort((a, b) => (g.scores[b] + roundPoints(g, b)) - (g.scores[a] + roundPoints(g, a)))[0];
      return { type: 'target', target: best };
    }
    // Dare whoever is most likely to bust (and has the most to lose).
    const best = others.sort((a, b) => bustChance(g, b) * (1 + roundPoints(g, b) / 30) - bustChance(g, a) * (1 + roundPoints(g, a) / 30))[0];
    return { type: 'target', target: best };
  }
  const r = g.rows[seat], pts = roundPoints(g, seat), p = bustChance(g, seat);
  if (!r.cards.length) return { type: 'hit' };
  if (g.scores[seat] + pts >= g.settings.target) return { type: 'stay' };
  const limit = r.charm ? 0.55 : pts < 15 ? 0.32 : pts < 30 ? 0.22 : 0.14;
  return { type: p <= limit ? 'hit' : 'stay' };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, round: g.round, turn: g.turn, order: g.order, scores: g.scores, target: g.settings.target,
    rows: g.rows.map((r, s) => ({ cards: r.cards, status: r.status, pts: g.seats[s] ? roundPoints(g, s) : 0, charm: !!r.charm, bustCard: r.bustCard || null })),
    need: g.need, toMove: current(g), dealing: g.forced.length > 0, deck: g.deck.length, roundPts: g.roundPts, winners: g.winners,
    bust: g.phase === 'play' && g.rows[seat]?.status === 'in' ? Math.round(bustChance(g, seat) * 100) : null,
    lastFlip: g.lastFlip, moveId: g.moveId, streak: g.streak,
  };
}

// Test helper: every card is somewhere exactly once.
export function check(g) {
  const all = [...g.deck, ...g.discard, ...g.rows.flatMap(r => r.cards)];
  const n = fullDeck().length;
  return all.length === n && new Set(all).size === n ? '' : `cards ${all.length}/${new Set(all).size} of ${n}`;
}
