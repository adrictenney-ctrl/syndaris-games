// Hot Dice: roll six dice and set aside scoring ones — at least one each roll — then roll the
// rest again or bank your points. A roll with nothing that scores busts you for the turn. Score
// all six and you get all six back ("hot dice"). Scoring: a 1 is 100, a 5 is 50; three of a
// kind is 100 × the number (three 1s are 1000), and every extra matching die doubles it; a run
// of 1–6 or three pairs is 1500. You need 500 in one turn to get on the board. First to the
// target triggers a last turn for everyone else; highest total wins.

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const roll = n => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));

// Score for exactly these dice, using every one — or -1 if some die doesn't score.
export function scoreSet(d) {
  if (!d.length) return -1;
  const c = [0, 0, 0, 0, 0, 0, 0];
  d.forEach(v => c[v]++);
  if (d.length === 6 && c.slice(1).every(x => x === 1)) return 1500;
  if (d.length === 6 && c.filter(x => x === 2).length === 3) return 1500;
  let pts = 0;
  for (let f = 1; f <= 6; f++) {
    let n = c[f];
    if (n >= 3) { pts += (f === 1 ? 1000 : f * 100) * 2 ** (n - 3); n = 0; }
    if (f === 1) pts += n * 100;
    else if (f === 5) pts += n * 50;
    else if (n) return -1;
  }
  return pts;
}
// Best score and the dice it uses (for bots and for spotting a bust).
export function best(d) {
  let top = { pts: 0, idx: [] };
  for (let m = 1; m < 1 << d.length; m++) {
    const idx = d.map((_, i) => i).filter(i => m & (1 << i));
    const p = scoreSet(idx.map(i => d[i]));
    if (p > top.pts || (p === top.pts && p > 0 && idx.length > top.idx.length)) top = { pts: p, idx };
  }
  return top;
}

export function createGame(settings, players) {
  const g = { settings: { target: 10000, entry: 500, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.scores = g.seats.map(() => 0);
  g.turn = g.order[0];
  g.endAt = null;
  startTurn(g);
  return g;
}

function startTurn(g) {
  g.dice = [];          // the last roll (dice still in play)
  g.setAside = [];      // dice kept so far this turn
  g.turnPts = 0;
  g.phase = 'start';
  g.bust = false;
  g.moveId++;
}

export const current = g => (g.phase === 'start' || g.phase === 'choose' ? g.turn : -1);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== current(g)) return "It isn't your turn";
  if (a.type === 'roll' && g.phase === 'start') {
    g.dice = roll(6);
    afterRoll(g, seat);
    return null;
  }
  if (g.phase !== 'choose') return 'Roll first';
  const idx = [...new Set((a.keep || []).map(Number))].filter(i => i >= 0 && i < g.dice.length);
  const pts = scoreSet(idx.map(i => g.dice[i]));
  if (pts <= 0) return 'Keep scoring dice only (1s, 5s, three of a kind…)';
  const total = g.turnPts + pts;
  if (a.type === 'bank') {
    const entering = g.scores[seat] === 0 && total < g.settings.entry;
    if (entering) return `You need ${g.settings.entry} in one turn to get on the board`;
    g.scores[seat] += total;
    announce(g, seat, `Banks ${total}`);
    return nextTurn(g, seat);
  }
  if (a.type === 'roll') {
    g.turnPts = total;
    g.setAside.push(...idx.map(i => g.dice[i]));
    let left = g.dice.length - idx.length;
    if (!left) { left = 6; g.setAside = []; announce(g, seat, 'Hot dice! 🔥'); }
    g.dice = roll(left);
    afterRoll(g, seat);
    return null;
  }
  return "That move isn't allowed";
}

function afterRoll(g, seat) {
  g.moveId++;
  g.rollId = (g.rollId || 0) + 1;
  if (best(g.dice).pts === 0) {
    g.bust = true;
    g.phase = 'bust';
    g.bustAt = Date.now();
    announce(g, seat, `Bust! −${g.turnPts}`);
    return;
  }
  g.phase = 'choose';
}

function nextTurn(g, seat) {
  if (g.scores[seat] >= g.settings.target && g.endAt == null) { g.endAt = seat; announce(g, seat, 'Last round!'); }
  const nxt = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
  if (g.endAt != null && nxt === g.endAt) {
    g.phase = 'over';
    const top = Math.max(...g.order.map(s => g.scores[s]));
    g.winners = g.order.filter(s => g.scores[s] === top);
    g.moveId++;
    return null;
  }
  g.turn = nxt;
  startTurn(g);
  return null;
}

export function tick(g) {
  if (g.phase === 'bust') return { ms: Math.max(0, g.bustAt + 2200 - Date.now()), run: () => nextTurn(g, g.turn) };
  return null;
}

// Computer: keep the best scoring dice; bank when it's sensible.
export function botAction(g, s) {
  if (g.phase === 'start') return { type: 'roll' };
  const b = best(g.dice);
  // Keeping fewer dice can be better: just one 1 or 5 when lots of dice would remain.
  let keep = b.idx;
  const ones = g.dice.map((v, i) => (v === 1 ? i : -1)).filter(i => i >= 0), fives = g.dice.map((v, i) => (v === 5 ? i : -1)).filter(i => i >= 0);
  if (b.pts < 300 && b.idx.length >= 2 && g.dice.length >= 4 && ones.length + fives.length) keep = ones.length ? [ones[0]] : [fives[0]];
  const pts = scoreSet(keep.map(i => g.dice[i]));
  const total = g.turnPts + pts;
  const left = g.dice.length - keep.length || 6;
  const onBoard = g.scores[s] > 0 || total >= g.settings.entry;
  const leader = Math.max(...g.order.filter(x => x !== s).map(x => g.scores[x]));
  const chasing = g.endAt != null && g.scores[s] + total <= leader;
  const bank = onBoard && !chasing && (total >= (left >= 4 ? 1000 : left === 3 ? 500 : 300));
  return { type: bank ? 'bank' : 'roll', keep };
}

export function viewFor(g) {
  return { phase: g.phase, turn: g.turn, order: g.order, dice: g.dice, setAside: g.setAside, turnPts: g.turnPts, scores: g.scores, target: g.settings.target, entry: g.settings.entry, endAt: g.endAt, winners: g.winners || null, rollId: g.rollId || 0, moveId: g.moveId };
}
