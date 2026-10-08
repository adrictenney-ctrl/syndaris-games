// Power Grab: a bluffing game of court intrigue. Everyone starts with two secret role cards
// (their influence) and two coins. On your turn take one action:
//   Income +1 · Foreign Aid +2 (a Treasurer can block it) · Overthrow: pay 7, a rival loses
//   influence (you must at 10+ coins)
//   or claim a role — whether you hold it or not:
//   Treasurer: take 3 · Shadow: pay 3, a rival loses influence (a Duchess blocks it)
//   Pirate: steal 2 (a Pirate or Diplomat blocks it) · Diplomat: draw two roles, keep the best.
// Anyone may call a bluff. If the claim was true, the challenger loses influence (and the
// claimer swaps that card for a fresh one); if false, the bluffer loses influence. Blocks can be
// challenged the same way. Lose both cards and you're out; last player standing wins.
// Three of each role in the court deck. Our own names and art.

export const ROLES = {
  treasurer: { name: 'Treasurer', ic: '💰', col: '#7a4a9a', text: 'Take 3 coins · blocks Foreign Aid' },
  shadow: { name: 'Shadow', ic: '🗡️', col: '#2a2a2a', text: 'Pay 3: a rival loses influence' },
  pirate: { name: 'Pirate', ic: '🏴‍☠️', col: '#2a5a8a', text: 'Steal 2 coins · blocks stealing' },
  diplomat: { name: 'Diplomat', ic: '📜', col: '#3a7a4a', text: 'Swap roles with the deck · blocks stealing' },
  duchess: { name: 'Duchess', ic: '👑', col: '#a8323a', text: 'Blocks the Shadow' },
};
export const ACTS = {
  income: { name: 'Income', text: '+1 coin' },
  aid: { name: 'Foreign Aid', text: '+2 coins', blockBy: ['treasurer'], anyBlock: true },
  overthrow: { name: 'Overthrow', text: 'Pay 7: a rival loses influence', cost: 7, target: true },
  tax: { name: 'Tax', text: '+3 coins', claim: 'treasurer' },
  strike: { name: 'Strike', text: 'Pay 3: a rival loses influence', claim: 'shadow', cost: 3, target: true, blockBy: ['duchess'] },
  steal: { name: 'Steal', text: 'Take 2 coins from a rival', claim: 'pirate', target: true, blockBy: ['pirate', 'diplomat'] },
  exchange: { name: 'Exchange', text: 'Draw 2 roles, keep the best', claim: 'diplomat' },
};
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.court = shuffle(Object.keys(ROLES).flatMap(r => [r, r, r]));
  g.cards = g.seats.map(() => []);           // { role, up }
  g.coins = g.seats.map(() => 0);
  for (const s of g.order) { g.cards[s] = [{ role: g.court.pop(), up: false }, { role: g.court.pop(), up: false }]; g.coins[s] = g.order.length === 2 ? 1 : 2; }
  g.turn = g.order[Math.floor(Math.random() * g.order.length)];
  g.loseQ = [];
  g.phase = 'act';
  return g;
}

export const alive = (g, s) => g.cards[s].some(c => !c.up);
const living = g => g.order.filter(s => alive(g, s));
const influence = (g, s) => g.cards[s].filter(c => !c.up).length;
const hasRole = (g, s, r) => g.cards[s].some(c => !c.up && c.role === r);
const log = (g, t) => { g.log.push(t); if (g.log.length > 8) g.log.shift(); };

export function current(g) {
  if (g.phase === 'act' || g.phase === 'exchange') return g.turn;
  if (g.phase === 'lose') return g.loseQ[0].seat;
  return -1;   // windows: anyone listed in g.p.waiting may answer
}

function openWindow(g, stage, waiting) {
  g.p.stage = stage;
  g.p.waiting = waiting.filter(s => alive(g, s));
  if (!g.p.waiting.length) return advanceStage(g);
  g.phase = 'window';
  g.windowUntil = Date.now() + 10000;
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (g.phase === 'window') return answer(g, seat, a);
  if (seat !== current(g)) return "It isn't your turn";
  if (g.phase === 'lose') {
    const i = Number(a.i);
    const c = g.cards[seat][i];
    if (a.type !== 'lose' || !c || c.up) return 'Pick one of your face-down cards to give up';
    c.up = true;
    announce(g, seat, `Loses the ${ROLES[c.role].name}`);
    log(g, `${'P' + seat} reveals ${ROLES[c.role].name}`);
    g.loseQ.shift();
    g.moveId++;
    return afterLose(g);
  }
  if (g.phase === 'exchange') {
    const keep = (a.keep || []).map(Number);
    const pool = g.p.pool;
    const n = influence(g, seat);
    if (a.type !== 'keep' || keep.length !== n || new Set(keep).size !== n || keep.some(i => !(i >= 0 && i < pool.length))) return `Keep ${n}`;
    const kept = keep.map(i => pool[i]);
    const back = pool.filter((_, i) => !keep.includes(i));
    let k = 0;
    for (const c of g.cards[seat]) if (!c.up) c.role = kept[k++];
    g.court = shuffle([...g.court, ...back]);
    g.moveId++;
    return endTurn(g);
  }
  // Choosing an action.
  if (a.type !== 'act') return 'Choose an action';
  const A = ACTS[a.act];
  if (!A) return 'Unknown action';
  if (g.coins[seat] >= 10 && a.act !== 'overthrow') return 'With 10 coins you must Overthrow';
  if (A.cost && g.coins[seat] < A.cost) return `You need ${A.cost} coins`;
  const t = A.target ? Number(a.target) : null;
  if (A.target && (t === seat || !g.order.includes(t) || !alive(g, t))) return 'Pick a rival who is still in';
  if (A.cost) g.coins[seat] -= A.cost;
  g.p = { actor: seat, act: a.act, target: t, claim: A.claim || null, blocker: null, blockRole: null };
  announce(g, seat, A.claim ? `${ROLES[A.claim].ic} ${A.name}${t != null ? ' → ' : ''}` : A.name);
  g.moveId++;
  if (A.claim) return openWindow(g, 'challengeAct', living(g).filter(s => s !== seat)) ?? null;
  advanceStage(g, 'challengeAct');
  return null;
}

// Someone answers a window: challenge, block, or pass.
function answer(g, seat, a) {
  const p = g.p;
  if (!p.waiting.includes(seat)) return 'Nothing to answer right now';
  if (a.type === 'pass') {
    p.waiting = p.waiting.filter(s => s !== seat);
    g.moveId++;
    if (!p.waiting.length) advanceStage(g);
    return null;
  }
  if (a.type === 'challenge' && (p.stage === 'challengeAct' || p.stage === 'challengeBlock')) {
    p.waiting = [];
    const claimer = p.stage === 'challengeAct' ? p.actor : p.blocker;
    const role = p.stage === 'challengeAct' ? p.claim : p.blockRole;
    announce(g, seat, 'Liar! 🫵');
    if (hasRole(g, claimer, role)) {
      // True claim: swap the shown card for a fresh one; the challenger loses influence.
      const c = g.cards[claimer].find(x => !x.up && x.role === role);
      g.court.push(c.role); shuffle(g.court); c.role = g.court.pop();
      log(g, `The ${ROLES[role].name} was real`);
      g.loseQ.push({ seat });
      p.challengeResult = { stage: p.stage, truthful: true, challenger: seat, claimer };
      p.resume = p.stage === 'challengeAct' ? 'block' : 'blockStands';
    } else {
      log(g, `Bluff caught — no ${ROLES[role].name}`);
      g.loseQ.push({ seat: claimer });
      p.challengeResult = { stage: p.stage, truthful: false, challenger: seat, claimer };
      p.resume = p.stage === 'challengeAct' ? 'fail' : 'resolve';
    }
    g.phase = 'lose';
    g.moveId++;
    return afterLose(g, true);
  }
  if (a.type === 'block' && p.stage === 'block') {
    const r = a.role;
    if (!ACTS[p.act].blockBy.includes(r)) return 'That role can’t block this';
    p.blocker = seat;
    p.blockRole = r;
    p.waiting = [];
    announce(g, seat, `Blocks with the ${ROLES[r].ic} ${ROLES[r].name}`);
    g.moveId++;
    openWindow(g, 'challengeBlock', living(g).filter(s => s !== seat));
    return null;
  }
  return 'You can’t do that now';
}

// Move the action along once a window closes with nobody acting.
function advanceStage(g, from) {
  const p = g.p, A = ACTS[p.act];
  const stage = from || p.stage;
  if (stage === 'challengeAct') {
    if (A.blockBy) {
      const who = A.anyBlock ? living(g).filter(s => s !== p.actor) : [p.target];
      return openWindow(g, 'block', who);
    }
    return resolve(g);
  }
  if (stage === 'block') return resolve(g);
  if (stage === 'challengeBlock') return blockStands(g);
}

function blockStands(g) { log(g, `${ACTS[g.p.act].name} was blocked`); endTurn(g); }

// After a lost influence, carry on (or end the game).
function afterLose(g, fresh) {
  const winner = living(g);
  if (winner.length === 1) { g.phase = 'over'; g.winner = winner[0]; announce(g, winner[0], 'Takes the throne! 👑'); return null; }
  // Skip anyone already out.
  while (g.loseQ.length && !alive(g, g.loseQ[0].seat)) g.loseQ.shift();
  if (g.loseQ.length) { g.phase = 'lose'; return null; }
  const p = g.p;
  if (!p) return endTurn(g);
  const r = p.resume;
  p.resume = null;
  if (r === 'block') return advanceStage(g, 'challengeAct') ?? null;
  if (r === 'blockStands') return blockStands(g) ?? null;
  if (r === 'fail') { log(g, `${ACTS[p.act].name} failed`); return endTurn(g); }
  if (r === 'resolve') return resolve(g) ?? null;
  return endTurn(g);
}

function resolve(g) {
  const p = g.p, s = p.actor, t = p.target;
  g.moveId++;
  switch (p.act) {
    case 'income': g.coins[s] += 1; break;
    case 'aid': g.coins[s] += 2; break;
    case 'tax': g.coins[s] += 3; break;
    case 'steal': { const n = Math.min(2, g.coins[t]); g.coins[t] -= n; g.coins[s] += n; break; }
    case 'overthrow': case 'strike':
      if (alive(g, t)) { g.loseQ.push({ seat: t }); p.resume = 'end'; g.phase = 'lose'; return afterLose(g); }
      break;
    case 'exchange': {
      const pool = [...g.cards[s].filter(c => !c.up).map(c => c.role), g.court.pop(), g.court.pop()];
      p.pool = pool;
      g.phase = 'exchange';
      return null;
    }
  }
  return endTurn(g);
}

function endTurn(g) {
  if (g.phase === 'over') return null;
  g.p = null;
  const L = living(g);
  if (L.length === 1) { g.phase = 'over'; g.winner = L[0]; return null; }
  let i = g.order.indexOf(g.turn);
  do { i = (i + 1) % g.order.length; } while (!alive(g, g.order[i]));
  g.turn = g.order[i];
  g.phase = 'act';
  g.moveId++;
  return null;
}

// Windows close by themselves; computer players answer quickly.
export function tick(g, players) {
  if (g.phase !== 'window') return null;
  const bot = g.p.waiting.find(s => players?.[s]?.bot);
  if (bot != null) return { ms: 650, run: () => applyAction(g, bot, botAnswer(g, bot)) };
  return { ms: Math.max(0, g.windowUntil - Date.now()), run: () => { g.p.waiting = []; advanceStage(g); } };
}

// ------------------------------------------------------------------ computer player
function botAnswer(g, s) {
  const p = g.p;
  const mine = r => g.cards[s].filter(c => c.role === r).length;
  const seen = r => g.order.reduce((t, x) => t + g.cards[x].filter(c => c.up && c.role === r).length, 0);
  if (p.stage === 'challengeAct' || p.stage === 'challengeBlock') {
    const role = p.stage === 'challengeAct' ? p.claim : p.blockRole;
    const out = mine(role) + seen(role);
    const stakes = (p.target === s && (p.act === 'strike' || p.act === 'steal')) || (p.stage === 'challengeBlock' && p.actor === s);
    const chance = out >= 3 ? 1 : out === 2 ? 0.5 : stakes ? 0.25 : 0.06;
    return Math.random() < chance ? { type: 'challenge' } : { type: 'pass' };
  }
  if (p.stage === 'block') {
    const roles = ACTS[p.act].blockBy;
    const real = roles.find(r => hasRole(g, s, r));
    if (real) return { type: 'block', role: real };
    const desperate = p.act === 'strike' && influence(g, s) === 1;
    if ((desperate && Math.random() < 0.6) || (p.target === s && Math.random() < 0.12)) return { type: 'block', role: roles[0] };
    return { type: 'pass' };
  }
  return { type: 'pass' };
}

export function botAction(g, s) {
  if (g.phase === 'lose') {
    const cs = g.cards[s].map((c, i) => ({ c, i })).filter(x => !x.c.up);
    const worst = cs.sort((a, b) => ({ duchess: 1, diplomat: 2, pirate: 3, treasurer: 4, shadow: 5 }[a.c.role] - { duchess: 1, diplomat: 2, pirate: 3, treasurer: 4, shadow: 5 }[b.c.role]))[0];
    return { type: 'lose', i: worst.i };
  }
  if (g.phase === 'exchange') {
    const n = influence(g, s);
    const pool = g.p.pool.map((r, i) => ({ r, i }));
    const pref = { treasurer: 5, shadow: 4, duchess: 3, pirate: 2, diplomat: 1 };
    const keep = [];
    for (const x of pool.sort((a, b) => pref[b.r] - pref[a.r])) { if (keep.length < n && !keep.some(k => g.p.pool[k] === x.r)) keep.push(x.i); }
    for (const x of pool) if (keep.length < n && !keep.includes(x.i)) keep.push(x.i);
    return { type: 'keep', keep };
  }
  const rivals = living(g).filter(x => x !== s);
  const threat = rivals.slice().sort((a, b) => influence(g, b) * 3 + g.coins[b] - influence(g, a) * 3 - g.coins[a])[0];
  if (g.coins[s] >= 7) return { type: 'act', act: 'overthrow', target: threat };
  const bluff = Math.random() < 0.2;
  if (g.coins[s] >= 3 && (hasRole(g, s, 'shadow') || (bluff && Math.random() < 0.4))) return { type: 'act', act: 'strike', target: threat };
  if (hasRole(g, s, 'treasurer') || bluff) return { type: 'act', act: 'tax' };
  const rich = rivals.filter(x => g.coins[x] >= 2).sort((a, b) => g.coins[b] - g.coins[a])[0];
  if (rich != null && hasRole(g, s, 'pirate')) return { type: 'act', act: 'steal', target: rich };
  if (hasRole(g, s, 'diplomat') && Math.random() < 0.3) return { type: 'act', act: 'exchange' };
  return { type: 'act', act: Math.random() < 0.5 ? 'aid' : 'income' };
}

export function viewFor(g, seat) {
  const p = g.p;
  return {
    phase: g.phase, turn: g.turn, order: g.order, coins: g.coins, alive: g.order.map(s => alive(g, s)),
    mine: g.cards[seat] || [], shown: g.cards.map(cs => cs.map(c => (c.up ? c.role : null))), court: g.court.length, log: g.log,
    p: p && { actor: p.actor, act: p.act, target: p.target, claim: p.claim, blocker: p.blocker, blockRole: p.blockRole, stage: p.stage, waiting: p.waiting || [], pool: g.turn === seat ? p.pool : null },
    loser: g.phase === 'lose' ? g.loseQ[0].seat : null, windowIn: g.windowUntil ? g.windowUntil - Date.now() : 0, winner: g.winner ?? null, moveId: g.moveId,
  };
}
