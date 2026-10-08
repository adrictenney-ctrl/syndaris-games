// Gearworks: build a workshop of robots in eight rounds. Runs only on the table (host).
//
// Each round two Power Surge cards are turned up, then everyone secretly picks one of five
// actions. Every action that anyone picked happens — for everybody — in this order:
//   Recycle   scrap blueprints from your hand for 1 part each
//   Design    draw a blueprint
//   Fabricate gain a part
//   Assemble  build one robot from your hand by paying its parts
//   Upgrade   turn parts into victory points, 2 for 1
// Whoever picked an action gets the big version (Recycle +1 part, Design +2 cards, Fabricate +2
// parts, Assemble −2 cost, Upgrade +2 points). Each Power Surge adds +1 to its action for
// everyone, and every robot you've built adds +1 to the action on its badge — for you.
// After eight rounds: robots' points + upgrade points + 1 per 3 leftover parts.

export const ACTIONS = ['recycle', 'design', 'fabricate', 'assemble', 'upgrade'];
export const ACT = {
  recycle: { name: 'Recycle', ic: '♻️', text: 'Scrap blueprints for 1 part each', big: '+1 part' },
  design: { name: 'Design', ic: '📐', text: 'Draw a blueprint', big: '+2 blueprints' },
  fabricate: { name: 'Fabricate', ic: '🔩', text: 'Gain a part', big: '+2 parts' },
  assemble: { name: 'Assemble', ic: '🛠️', text: 'Build one robot from your hand', big: '−2 cost' },
  upgrade: { name: 'Upgrade', ic: '⭐', text: 'Turn parts into points, 2 for 1', big: '+2 points' },
};
export const ROUNDS = 8;
export const HAND_MAX = 7;

const NAMES = ['Bolt Buddy', 'Sprocket', 'Widget', 'Cogsworth', 'Tinbot', 'Rivet', 'Gizmo', 'Dynamo', 'Ratchet', 'Servo', 'Piston', 'Flux', 'Coil', 'Spanner', 'Torque', 'Axle', 'Gasket', 'Nibbler', 'Whirr', 'Clank', 'Doodad', 'Ticker', 'Socket', 'Pinwheel', 'Gimbal', 'Lug', 'Bleep', 'Sputnik', 'Thimble', 'Wobble', 'Zapper', 'Buzzby', 'Crank', 'Diode', 'Ember', 'Fizz', 'Grommet', 'Hinge', 'Ion', 'Joule'];
// Blueprints: cost in parts, points, and the action it boosts for its owner.
export const BLUEPRINTS = (() => {
  const shapes = [[1, 0], [2, 1], [2, 1], [3, 2], [3, 3], [4, 3], [5, 5], [6, 7]];
  const out = [];
  ACTIONS.forEach((icon, a) => shapes.forEach(([cost, vp], k) => {
    const id = out.length;
    out.push({ id, name: NAMES[id], cost, vp: vp + (icon === 'upgrade' && cost >= 4 ? -1 : 0), icon, seed: id * 7919 + 13 });
  }));
  return out;
})();

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.deck = shuffle(BLUEPRINTS.map(b => b.id));
  g.discard = [];
  g.p = g.seats.map(() => null);
  for (const s of g.order) g.p[s] = { hand: g.deck.splice(0, 4), parts: 3, robots: [], vp: 0, pick: null };
  g.surgeDeck = [];
  g.round = 0;
  startRound(g);
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const log = (g, text) => { g.log.push(text); if (g.log.length > 20) g.log.shift(); };
function drawCard(g) {
  if (!g.deck.length) { g.deck = shuffle(g.discard); g.discard = []; }
  return g.deck.pop();
}

function startRound(g) {
  g.round++;
  if (g.surgeDeck.length < 2) g.surgeDeck = shuffle(ACTIONS.flatMap(a => [a, a]));
  g.surges = g.surgeDeck.splice(0, 2);
  for (const s of g.order) g.p[s].pick = null;
  g.phase = 'plan';
  g.step = null;
  g.choices = null;
  g.moveId++;
}

export const surge = (g, a) => g.surges.filter(x => x === a).length;
export const icons = (g, s, a) => g.p[s].robots.filter(id => BLUEPRINTS[id].icon === a).length;
// How strong an action is for a player this round.
export function power(g, s, a) {
  const chooser = g.chosen ? g.chosen[a]?.includes(s) : g.p[s].pick === a;
  return { chooser: !!chooser, bonus: surge(g, a) + icons(g, s, a) };
}
export const assembleDiscount = (g, s) => { const p = power(g, s, 'assemble'); return (p.chooser ? 2 : 0) + p.bonus; };
export const costFor = (g, s, id) => Math.max(0, BLUEPRINTS[id].cost - assembleDiscount(g, s));

export const current = () => -1;

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  const me = g.p[seat];
  if (!me) return 'You are not in this game';
  if (g.phase === 'plan') {
    if (a.type !== 'pick' || !ACTIONS.includes(a.action)) return 'Pick an action';
    me.pick = a.action;
    if (g.order.every(s => g.p[s].pick)) beginResolve(g);
    return null;
  }
  if (g.phase !== 'choose') return 'Wait a moment';
  if (!(seat in g.choices)) return 'Nothing to choose right now';
  if (g.choices[seat] != null) return 'Already chosen';
  const act = g.step.action;
  if (act === 'recycle') {
    const ids = (a.cards || []).map(Number);
    if (new Set(ids).size !== ids.length || !ids.every(id => me.hand.includes(id))) return "Those blueprints aren't in your hand";
    g.choices[seat] = { cards: ids };
  } else if (act === 'assemble') {
    if (a.card == null) g.choices[seat] = { card: null };
    else {
      const id = Number(a.card);
      if (!me.hand.includes(id)) return "That blueprint isn't in your hand";
      if (costFor(g, seat, id) > me.parts) return 'Not enough parts';
      g.choices[seat] = { card: id };
    }
  } else if (act === 'upgrade') {
    const n = Math.max(0, Math.floor(Number(a.pairs) || 0));
    if (n * 2 > me.parts) return 'Not enough parts';
    g.choices[seat] = { pairs: n };
  }
  if (Object.values(g.choices).every(c => c != null)) applyStep(g);
  return null;
}

function beginResolve(g) {
  g.chosen = {};
  for (const s of g.order) (g.chosen[g.p[s].pick] ||= []).push(s);
  g.steps = ACTIONS.filter(a => g.chosen[a]);
  g.picks = Object.fromEntries(g.order.map(s => [s, g.p[s].pick]));
  log(g, `Round ${g.round}: ${g.steps.map(a => ACT[a].name).join(', ')}`);
  nextStep(g);
}

// Move to the next action; actions that need a decision wait for everyone's choice.
function nextStep(g) {
  const a = g.steps.shift();
  g.moveId++;
  if (!a) return endRound(g);
  g.step = { action: a };
  g.choices = null;
  if (a === 'recycle') g.choices = Object.fromEntries(g.order.filter(s => g.p[s].hand.length).map(s => [s, null]));
  if (a === 'assemble') g.choices = Object.fromEntries(g.order.filter(s => g.p[s].hand.some(id => costFor(g, s, id) <= g.p[s].parts)).map(s => [s, null]));
  if (a === 'upgrade') g.choices = Object.fromEntries(g.order.map(s => [s, null]));
  if (g.choices && Object.keys(g.choices).length) { g.phase = 'choose'; return; }
  g.choices = {};
  g.phase = 'show';      // the table's clock applies it after a beat
}

// Do the current action for everyone.
export function applyStep(g) {
  const a = g.step.action;
  const gained = {};
  for (const s of g.order) {
    const me = g.p[s], pw = power(g, s, a), ch = g.choices?.[s];
    if (a === 'recycle') {
      const ids = ch?.cards || [];
      me.hand = me.hand.filter(id => !ids.includes(id));
      g.discard.push(...ids);
      const n = ids.length + (pw.chooser ? 1 : 0) + pw.bonus;
      me.parts += n;
      gained[s] = n ? `+${n} part${n > 1 ? 's' : ''}` : '';
    } else if (a === 'design') {
      const n = 1 + (pw.chooser ? 2 : 0) + pw.bonus;
      for (let i = 0; i < n; i++) { const c = drawCard(g); if (c != null) me.hand.push(c); }
      gained[s] = `+${n} blueprint${n > 1 ? 's' : ''}`;
    } else if (a === 'fabricate') {
      const n = 1 + (pw.chooser ? 2 : 0) + pw.bonus;
      me.parts += n;
      gained[s] = `+${n} part${n > 1 ? 's' : ''}`;
    } else if (a === 'assemble') {
      if (ch?.card != null) {
        me.parts -= costFor(g, s, ch.card);
        me.hand = me.hand.filter(id => id !== ch.card);
        me.robots.push(ch.card);
        gained[s] = `built ${BLUEPRINTS[ch.card].name}`;
      }
    } else if (a === 'upgrade') {
      const pairs = ch?.pairs || 0;
      me.parts -= pairs * 2;
      const n = pairs + (pw.chooser ? 2 : 0) + pw.bonus;
      me.vp += n;
      gained[s] = n ? `+${n} point${n > 1 ? 's' : ''}` : '';
    }
  }
  g.lastStep = { action: a, gained, id: g.moveId };
  announce(g, g.chosen[a][0], `${ACT[a].ic} ${ACT[a].name}`);
  nextStep(g);
}

function endRound(g) {
  // Too many blueprints: the extras are scrapped for parts.
  for (const s of g.order) {
    const me = g.p[s];
    while (me.hand.length > HAND_MAX) {
      const worst = me.hand.slice().sort((x, y) => BLUEPRINTS[x].vp - BLUEPRINTS[y].vp)[0];
      me.hand = me.hand.filter(id => id !== worst);
      g.discard.push(worst);
      me.parts++;
    }
  }
  g.chosen = null;
  if (g.round >= ROUNDS) return finish(g);
  startRound(g);
}

export function score(g, s) {
  const me = g.p[s];
  return me.robots.reduce((a, id) => a + BLUEPRINTS[id].vp, 0) + me.vp + Math.floor(me.parts / 3);
}

function finish(g) {
  g.phase = 'over';
  g.step = null;
  const best = Math.max(...g.order.map(s => score(g, s)));
  g.winners = g.order.filter(s => score(g, s) === best);
  g.moveId++;
}

export function viewFor(g, seat) {
  const me = g.p[seat];
  return {
    phase: g.phase, round: g.round, rounds: ROUNDS, order: g.order, surges: g.surges, step: g.step, steps: g.steps || [],
    picks: g.phase === 'plan' ? null : g.picks, picked: g.order.map(s => !!g.p[s].pick),
    players: g.p.map((p, s) => p && { parts: p.parts, vp: p.vp, robots: p.robots, hand: p.hand.length, score: score(g, s) }),
    me: me && { hand: me.hand.slice(), parts: me.parts, pick: me.pick },
    mustChoose: g.phase === 'choose' && g.choices && seat in g.choices && g.choices[seat] == null,
    discount: me && g.phase === 'choose' && g.step?.action === 'assemble' ? assembleDiscount(g, seat) : 0,
    power: me ? Object.fromEntries(ACTIONS.map(a => [a, { surge: surge(g, a), icons: icons(g, seat, a) }])) : null,
    lastStep: g.lastStep, winners: g.winners || [], moveId: g.moveId, deck: g.deck.length,
  };
}

// ---------------------------------------------------------------- bots

const value = id => BLUEPRINTS[id].vp + (BLUEPRINTS[id].cost <= 3 ? 1.5 : 0.5);

export function botPick(g, s) {
  const me = g.p[s], late = g.round >= ROUNDS - 1;
  const cheapest = Math.min(...me.hand.map(id => Math.max(0, BLUEPRINTS[id].cost - 2 - surge(g, 'assemble') - icons(g, s, 'assemble'))), 99);
  const bestAffordable = me.hand.filter(id => Math.max(0, BLUEPRINTS[id].cost - 2 - surge(g, 'assemble') - icons(g, s, 'assemble')) <= me.parts).sort((x, y) => value(y) - value(x))[0];
  const sc = {
    assemble: bestAffordable != null ? 4 + value(bestAffordable) : -5,
    fabricate: 3 + (me.parts < cheapest ? 3 : 0) - (late ? 2 : 0),
    design: 2 + (me.hand.length <= 2 ? 4 : 0) - (late ? 4 : 0),
    upgrade: (late ? 6 : 1) + me.parts / 2 - (g.round < 4 ? 3 : 0),
    recycle: me.hand.length >= 5 ? 2.5 : 0,
  };
  for (const a of ACTIONS) sc[a] += surge(g, a) * 1.5 + icons(g, s, a) * 1.2 + Math.random();
  return ACTIONS.slice().sort((x, y) => sc[y] - sc[x])[0];
}

export function botChoice(g, s) {
  const me = g.p[s], a = g.step.action;
  if (a === 'recycle') {
    if (me.hand.length <= 3) return { type: 'choose', cards: [] };
    const worst = me.hand.slice().sort((x, y) => value(x) - value(y));
    return { type: 'choose', cards: worst.slice(0, me.hand.length - 3) };
  }
  if (a === 'assemble') {
    const ok = me.hand.filter(id => costFor(g, s, id) <= me.parts).sort((x, y) => value(y) - value(x) || costFor(g, s, x) - costFor(g, s, y));
    return { type: 'choose', card: ok[0] ?? null };
  }
  // Upgrade: keep enough parts for a robot unless the game is nearly over.
  const keep = g.round >= ROUNDS ? 0 : Math.min(me.parts, Math.min(...me.hand.map(id => BLUEPRINTS[id].cost), 4));
  return { type: 'choose', pairs: Math.max(0, Math.floor((me.parts - keep) / 2)) };
}

export const botAction = (g, s) => (g.phase === 'plan' ? { type: 'pick', action: botPick(g, s) } : botChoice(g, s));

export function tick(g, players) {
  if (g.phase === 'plan') {
    const w = g.order.filter(s => !g.p[s].pick && players[s]?.bot);
    return w.length ? { ms: 700, run: () => w.forEach(s => applyAction(g, s, { type: 'pick', action: botPick(g, s) })) } : null;
  }
  if (g.phase === 'choose') {
    const w = Object.keys(g.choices).map(Number).filter(s => g.choices[s] == null && players[s]?.bot);
    return w.length ? { ms: 700, run: () => w.forEach(s => applyAction(g, s, botChoice(g, s))) } : null;
  }
  if (g.phase === 'show') return { ms: 1100, run: () => applyStep(g) };
  return null;
}
