// House Rules: the card game where the rules keep changing. You start with one rule —
// draw 1, play 1 — and the cards you play change it: draw more, play more, hand limits,
// keeper limits, bonuses. Keepers go on the table in front of you. A Goal card says which
// two Keepers win the game; play a new Goal and the target moves. Actions do something once.
// Whoever has what the current Goal asks for, at any moment, wins.
//
// Two decks share these rules: the Home deck and the Deep Space deck (which adds Creepers —
// they jump onto the table when drawn and stop you winning unless the Goal wants them).
// Runs only on the table (host).

const K = (name, ic) => ({ type: 'keeper', name, ic });
const C = (name, ic) => ({ type: 'creeper', name, ic, text: "Goes straight into play when drawn. You can't win while you have it — unless the Goal needs it." });
const G = (name, needs, text) => ({ type: 'goal', name, needs, text });
const R = (name, group, val, text) => ({ type: 'rule', name, group, val, text });
const A = (name, act, text, target) => ({ type: 'action', name, act, text, target });

const RULES = names => ({
  draw2: R(names.draw2 || 'Draw 2', 'draw', 2, 'Draw 2 cards at the start of your turn'),
  draw3: R(names.draw3 || 'Draw 3', 'draw', 3, 'Draw 3 cards at the start of your turn'),
  draw4: R(names.draw4 || 'Draw 4', 'draw', 4, 'Draw 4 cards at the start of your turn'),
  draw5: R(names.draw5 || 'Draw 5', 'draw', 5, 'Draw 5 cards at the start of your turn'),
  play2: R(names.play2 || 'Play 2', 'play', 2, 'Play 2 cards each turn'),
  play3: R(names.play3 || 'Play 3', 'play', 3, 'Play 3 cards each turn'),
  play4: R(names.play4 || 'Play 4', 'play', 4, 'Play 4 cards each turn'),
  playAll: R(names.playAll || 'Play Everything', 'play', 99, 'Play every card in your hand'),
  hand0: R(names.hand0 || 'Hand Limit 0', 'hand', 0, 'At the end of your turn, discard down to 0 cards'),
  hand1: R(names.hand1 || 'Hand Limit 1', 'hand', 1, 'At the end of your turn, discard down to 1 card'),
  hand2: R(names.hand2 || 'Hand Limit 2', 'hand', 2, 'At the end of your turn, discard down to 2 cards'),
  keep2: R(names.keep2 || 'Keeper Limit 2', 'keep', 2, 'At the end of your turn, keep only 2 Keepers'),
  keep3: R(names.keep3 || 'Keeper Limit 3', 'keep', 3, 'At the end of your turn, keep only 3 Keepers'),
  keep4: R(names.keep4 || 'Keeper Limit 4', 'keep', 4, 'At the end of your turn, keep only 4 Keepers'),
  inflation: R(names.inflation || 'Inflation', 'inflation', 1, 'Every number on every rule goes up by 1'),
  noHand: R(names.noHand || 'Empty-Handed Bonus', 'noHand', 3, 'Start your turn with no cards? Draw 3 extra'),
  poor: R(names.poor || 'Underdog Bonus', 'poor', 1, 'Fewest Keepers? Draw 1 extra'),
  rich: R(names.rich || 'Head Start', 'rich', 1, 'Most Keepers? Play 1 extra'),
  double: R(names.double || 'Double Goal', 'double', 2, 'Two Goals at once — meet either to win'),
  reverse: R(names.reverse || 'Turnabout', 'reverse', 1, 'Play goes the other way round the table'),
});

const ACTIONS = n => ({
  trash: A(n.trash, 'trash', 'Throw away any Keeper on the table', 'keeper'),
  steal: A(n.steal, 'steal', "Take someone else's Keeper", 'theirKeeper'),
  tradeHands: A(n.tradeHands, 'tradeHands', 'Swap hands with another player', 'player'),
  rotate: A(n.rotate, 'rotate', 'Everyone passes their hand on, in the direction of play'),
  jackpot: A(n.jackpot, 'jackpot', 'Draw 3 cards'),
  reset: A(n.reset, 'reset', 'Throw away every rule — back to draw 1, play 1'),
  freshStart: A(n.freshStart, 'freshStart', 'Discard your hand, then draw that many'),
  again: A(n.again, 'again', 'Take another turn after this one'),
  share: A(n.share, 'share', 'Draw one card per player and deal one to everyone'),
  exchange: A(n.exchange, 'exchange', 'Swap one of your Keepers for one of theirs', 'exchange'),
  scrap: A(n.scrap, 'scrap', 'Throw away one rule', 'rule'),
  draw2play: A(n.draw2play, 'draw2play', 'Draw 2 cards and play them both'),
  draw3play2: A(n.draw3play2, 'draw3play2', 'Draw 3 cards, play 2, discard the last'),
  allDraw: A(n.allDraw, 'allDraw', 'Everyone draws a card'),
  goalSwap: A(n.goalSwap, 'goalSwap', 'Throw away the Goal — there is no Goal until someone plays one'),
});

export const DECKS = {
  home: {
    name: 'House Rules',
    cards: {
      kettle: K('The Kettle', '☕'), book: K('A Good Book', '📖'), cat: K('The Cat', '🐈'), dog: K('The Dog', '🐕'),
      piano: K('The Piano', '🎹'), garden: K('The Garden', '🌻'), cake: K('Cake', '🎂'), candle: K('Candlelight', '🕯️'),
      rain: K('Rain', '🌧️'), moon: K('The Moon', '🌙'), sun: K('Sunshine', '☀️'), bed: K('A Warm Bed', '🛏️'),
      phone: K('The Telephone', '☎️'), money: K('Money', '💰'), friends: K('Old Friends', '👫'), music: K('Music', '🎵'),
      pizza: K('Pizza', '🍕'), clock: K('The Clock', '🕰️'),
      gTea: G('Tea & a Story', ['kettle', 'book']), gLights: G('Lights Out', ['bed', 'clock']), gNap: G('Cat Nap', ['cat', 'bed']),
      gWalk: G('Walkies', ['dog', 'garden']), gRecital: G('Recital', ['piano', 'music']), gThumb: G('Green Thumb', ['garden', 'sun']),
      gWish: G('Make a Wish', ['cake', 'candle']), gRainy: G('Rainy Afternoon', ['rain', 'book']), gDinner: G('Moonlit Dinner', ['moon', 'candle']),
      gCatch: G('Catching Up', ['phone', 'friends']), gBake: G('Bake Sale', ['money', 'cake']), gParty: G('Pizza Party', ['pizza', 'friends']),
      gSing: G('Singalong', ['music', 'friends']), gRainbow: G('Rainbow', ['sun', 'rain']), gMidnight: G('Midnight', ['moon', 'clock']),
      gPets: G('Cats & Dogs', ['cat', 'dog']), gElevenses: G('Elevenses', ['kettle', 'clock']), gDeal: G('Big Deal', ['money', 'phone']),
      gSnack: G('Late-Night Snack', ['pizza', 'moon']), gSerenade: G('Serenade', ['piano', 'candle']),
      gFive: G('Collector', 'five', 'Have 5 or more Keepers on the table'), gHand: G('Full Hands', 'hand8', 'Have 8 or more cards in your hand'),
      ...RULES({}),
      ...ACTIONS({
        trash: 'Out It Goes', steal: 'Snatch', tradeHands: 'Swap Hands', rotate: 'Pass It On', jackpot: 'Lucky Dip', reset: 'Back to Basics',
        freshStart: 'Fresh Start', again: 'Second Helping', share: 'Share Around', exchange: 'Fair Trade', scrap: 'Scrap a Rule',
        draw2play: 'Use It or Lose It', draw3play2: 'Pick Two', allDraw: 'Tea for Everyone', goalSwap: 'Change of Plans',
      }),
    },
  },
  space: {
    name: 'Deep Space',
    cards: {
      starship: K('The Starship', '🚀'), robot: K('Robot Pal', '🤖'), alien: K('Alien Friend', '👽'), torch: K('Laser Torch', '🔦'),
      map: K('Star Map', '🗺️'), core: K('Warp Core', '⚛️'), suit: K('Spacesuit', '🧑‍🚀'), base: K('Moon Base', '🌕'),
      rations: K('Ration Packs', '🥫'), comet: K('The Comet', '☄️'), crystal: K('Time Crystal', '💎'), dish: K('Signal Dish', '📡'),
      cadet: K('Space Cadet', '🎖️'), compass: K('Navigator', '🧭'), scope: K('Telescope', '🔭'), planet: K('Ringed Planet', '🪐'),
      satellite: K('Satellite', '🛰️'), coffee: K('Space Coffee', '☕'),
      gremlin: C('Space Gremlin', '👾'), breach: C('Hull Breach', '💨'), worm: C('Mind Worm', '🐛'),
      gLaunch: G('Launch Day', ['starship', 'core']), gFirst: G('First Contact', ['alien', 'dish']), gNav: G('Plotted Course', ['map', 'compass']),
      gWalk: G('Spacewalk', ['suit', 'satellite']), gOutpost: G('Outpost', ['base', 'rations']), gChase: G('Comet Chase', ['comet', 'starship']),
      gTime: G('Time Warp', ['crystal', 'core']), gRobo: G('Robot Uprising', ['robot', 'torch']), gWatch: G('Stargazing', ['scope', 'planet']),
      gCadet: G('Cadet Training', ['cadet', 'suit']), gShift: G('Night Shift', ['coffee', 'robot']), gPicnic: G('Moon Picnic', ['base', 'coffee']),
      gRings: G('Ring Run', ['planet', 'starship']), gSignal: G('Deep Signal', ['dish', 'satellite']), gEnvoy: G('Envoy', ['alien', 'cadet']),
      gLost: G('Lost in Time', ['crystal', 'map']), gTorch: G('Dark Side', ['torch', 'base']), gGuide: G('Comet Guide', ['comet', 'compass']),
      gWorks: G('Gremlin in the Works', ['gremlin', 'core']), gBug: G('Bug Hunt', ['worm', 'torch']),
      gFive: G('Collector', 'five', 'Have 5 or more Keepers on the table'), gHand: G('Cargo Hold', 'hand8', 'Have 8 or more cards in your hand'),
      ...RULES({ draw2: 'Draw 2', inflation: 'Hyperdrive', noHand: 'Empty Hold Bonus', poor: 'Rescue Rations', rich: 'Fleet Admiral', double: 'Twin Missions', reverse: 'Reverse Thrusters' }),
      ...ACTIONS({
        trash: 'Vaporize', steal: 'Tractor Beam', tradeHands: 'Body Swap', rotate: 'Orbit', jackpot: 'Supply Drop', reset: 'System Reboot',
        freshStart: 'Jettison', again: 'Time Loop', share: 'Rations for All', exchange: 'Docking Trade', scrap: 'Override',
        draw2play: 'Emergency Protocol', draw3play2: 'Away Mission', allDraw: 'Transmission', goalSwap: 'Change Course',
      }),
      airlock: A('Airlock', 'airlock', 'Throw away any Creeper on the table', 'creeper'),
    },
  },
};

export const typeOf = c => c.split('.')[0];
export const def = (g, c) => DECKS[g.settings.deck].cards[typeOf(c)];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = { settings: { deck: 'home', ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  if (!DECKS[g.settings.deck]) g.settings.deck = 'home';
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  let id = 0;
  g.deck = shuffle(Object.keys(DECKS[g.settings.deck].cards).map(k => `${k}.${id++}`));
  g.discard = [];
  g.hands = g.seats.map(() => []);
  g.keepers = g.seats.map(() => []);
  g.rules = [];
  g.goals = [];
  g.phase = 'play';
  g.turn = g.order[Math.floor(Math.random() * g.order.length)];
  for (const s of g.order) draw(g, s, 3);
  g.limitQ = [];
  g.temp = null;
  g.extra = false;
  g.winner = null;
  startTurn(g);
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const ruleOf = (g, group) => g.rules.map(c => def(g, c)).find(d => d.group === group);
const has = (g, group) => !!ruleOf(g, group);
const infl = g => (has(g, 'inflation') ? 1 : 0);
export function drawCount(g) { return (ruleOf(g, 'draw')?.val || 1) + infl(g); }
export function playCount(g, s = g.turn) {
  const r = ruleOf(g, 'play');
  if (r && r.val >= 99) return 99;
  let n = (r?.val || 1) + infl(g);
  if (has(g, 'rich') && isMost(g, s)) n += 1 + infl(g);
  return n;
}
export const handLimit = g => { const r = ruleOf(g, 'hand'); return r ? r.val + infl(g) : null; };
export const keeperLimit = g => { const r = ruleOf(g, 'keep'); return r ? r.val + infl(g) : null; };
const keepersOnly = (g, s) => g.keepers[s].filter(c => def(g, c).type === 'keeper');
const isMost = (g, s) => g.order.every(o => o === s || keepersOnly(g, o).length < keepersOnly(g, s).length);
const isFewest = (g, s) => g.order.every(o => o === s || keepersOnly(g, o).length > keepersOnly(g, s).length);
const nextSeat = (g, s) => { const i = g.order.indexOf(s), d = has(g, 'reverse') ? -1 : 1; return g.order[(i + d + g.order.length) % g.order.length]; };

function drawOne(g) {
  if (!g.deck.length) { g.deck = shuffle(g.discard); g.discard = []; }
  return g.deck.pop();
}

// Draw n cards for seat s. Creepers jump straight onto the table and are replaced.
function draw(g, s, n) {
  const got = [];
  while (n > 0) {
    const c = drawOne(g);
    if (!c) break;
    if (def(g, c).type === 'creeper') { g.keepers[s].push(c); announce(g, s, `${def(g, c).ic} ${def(g, c).name}!`); continue; }
    g.hands[s].push(c);
    got.push(c);
    n--;
  }
  return got;
}

function startTurn(g) {
  g.played = 0;
  g.drawn = 0;
  const s = g.turn;
  if (has(g, 'noHand') && !g.hands[s].length) draw(g, s, 3 + infl(g));
  let n = drawCount(g);
  if (has(g, 'poor') && isFewest(g, s)) n += 1 + infl(g);
  draw(g, s, n);
  g.drawn = n;
  g.moveId++;
}

// After a rule change: if the active player is now owed more cards, they draw the difference.
function catchUp(g) {
  const want = drawCount(g);
  if (g.drawn < want) { draw(g, g.turn, want - g.drawn); g.drawn = want; }
}

// Does seat s meet goal card c?
export function meets(g, s, c) {
  const d = def(g, c);
  const mine = g.keepers[s].map(typeOf);
  if (d.needs === 'five') return keepersOnly(g, s).length >= 5 && !g.keepers[s].some(k => def(g, k).type === 'creeper');
  if (d.needs === 'hand8') return g.hands[s].length >= 8 && !g.keepers[s].some(k => def(g, k).type === 'creeper');
  if (!d.needs.every(k => mine.includes(k))) return false;
  // Creepers stop a win unless this Goal asks for them.
  return g.keepers[s].every(k => def(g, k).type !== 'creeper' || d.needs.includes(typeOf(k)));
}

function checkWin(g) {
  if (g.phase === 'over') return true;
  const seq = [g.turn, ...g.order.filter(s => s !== g.turn)];
  for (const s of seq) for (const c of g.goals) if (meets(g, s, c)) {
    g.phase = 'over'; g.winner = s; g.winGoal = c; g.moveId++;
    announce(g, s, `${def(g, c).name}! 🏆`);
    return true;
  }
  return false;
}

export function current(g) {
  if (g.phase === 'over') return -1;
  if (g.phase === 'limit') return g.limitQ[0].seat;
  return g.turn;
}

// Who needs to discard at the end of a turn: hand limit, then keeper limit.
function queueLimits(g) {
  const hl = handLimit(g), kl = keeperLimit(g);
  const seq = [g.turn, ...g.order.filter(s => s !== g.turn)];
  g.limitQ = [];
  for (const s of seq) {
    if (hl != null && g.hands[s].length > hl) g.limitQ.push({ seat: s, what: 'hand', n: g.hands[s].length - hl });
    if (kl != null && keepersOnly(g, s).length > kl) g.limitQ.push({ seat: s, what: 'keepers', n: keepersOnly(g, s).length - kl });
  }
}

function endTurn(g) {
  g.temp = null;
  queueLimits(g);
  if (g.limitQ.length) { g.phase = 'limit'; g.moveId++; return; }
  nextTurn(g);
}

function nextTurn(g) {
  g.phase = 'play';
  if (g.extra) g.extra = false;
  else g.turn = nextSeat(g, g.turn);
  startTurn(g);
}

const turnDone = g => !g.temp && (g.played >= playCount(g) || !g.hands[g.turn].length);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (g.phase === 'limit') {
    const q = g.limitQ[0];
    if (seat !== q.seat) return 'Waiting for someone to discard';
    const cards = a.cards || [];
    const pool = q.what === 'hand' ? g.hands[seat] : keepersOnly(g, seat);
    if (cards.length !== q.n || new Set(cards).size !== q.n || !cards.every(c => pool.includes(c))) return `Pick ${q.n} ${q.what === 'hand' ? 'card' : 'Keeper'}${q.n > 1 ? 's' : ''} to discard`;
    for (const c of cards) {
      const from = q.what === 'hand' ? g.hands[seat] : g.keepers[seat];
      from.splice(from.indexOf(c), 1);
      g.discard.push(c);
    }
    g.limitQ.shift();
    g.moveId++;
    if (!g.limitQ.length) nextTurn(g);
    return null;
  }
  if (seat !== g.turn) return "It isn't your turn";
  if (a.type !== 'play') return "That move isn't allowed";
  const fromTemp = !!g.temp;
  const src = fromTemp ? g.temp.cards : g.hands[seat];
  if (!src.includes(a.card)) return fromTemp ? 'Play one of the cards you just drew' : "That card isn't in your hand";
  const err = targetError(g, seat, a);
  if (err) return err;
  src.splice(src.indexOf(a.card), 1);
  if (fromTemp) g.temp.left--; else g.played++;
  playCard(g, seat, a);
  g.moveId++;
  if (checkWin(g)) return null;
  if (g.temp && (g.temp.left <= 0 || !g.temp.cards.length)) { g.discard.push(...g.temp.cards); g.temp = null; }
  if (checkWin(g)) return null;
  if (turnDone(g)) endTurn(g);
  return null;
}

// The extra choice some cards need (whose Keeper, which rule…).
function targetError(g, seat, a) {
  const d = def(g, a.card);
  if (d.type === 'goal' && g.goals.length >= 2 && has(g, 'double') && !(a.replace >= 0 && a.replace < 2)) return 'Pick which Goal to replace';
  if (d.type !== 'action' || !d.target) return null;
  const allKeepers = g.order.flatMap(s => g.keepers[s].map(c => ({ s, c })));
  if (d.target === 'keeper' || d.target === 'theirKeeper' || d.target === 'creeper') {
    const want = d.target === 'creeper' ? 'creeper' : 'keeper';
    const ok = allKeepers.filter(x => def(g, x.c).type === want && (d.target !== 'theirKeeper' || x.s !== seat));
    if (!ok.length) return null;     // nothing to aim at: the card fizzles
    if (!ok.some(x => x.c === a.keeper)) return `Pick a ${want === 'creeper' ? 'Creeper' : 'Keeper'}${d.target === 'theirKeeper' ? ' from someone else' : ''}`;
  }
  if (d.target === 'player' && !(g.order.includes(a.target) && a.target !== seat)) return 'Pick another player';
  if (d.target === 'rule' && g.rules.length && !g.rules.includes(a.rule)) return 'Pick a rule';
  if (d.target === 'exchange') {
    const theirs = allKeepers.filter(x => x.s !== seat && def(g, x.c).type === 'keeper');
    const mine = keepersOnly(g, seat);
    if (theirs.length && mine.length && (!mine.includes(a.mine) || !theirs.some(x => x.c === a.keeper))) return 'Pick one of yours and one of theirs';
  }
  return null;
}

const ownerOf = (g, c) => g.order.find(s => g.keepers[s].includes(c));

function playCard(g, seat, a) {
  const c = a.card, d = def(g, c);
  if (d.type === 'keeper' || d.type === 'creeper') { g.keepers[seat].push(c); return; }
  if (d.type === 'goal') {
    if (has(g, 'double') && g.goals.length >= 2) g.discard.push(g.goals.splice(a.replace, 1, c)[0]);
    else if (has(g, 'double')) g.goals.push(c);
    else { g.discard.push(...g.goals); g.goals = [c]; }
    announce(g, seat, `New Goal: ${d.name}`);
    return;
  }
  if (d.type === 'rule') {
    // A new rule replaces the old one of the same kind.
    for (const r of g.rules.filter(r => def(g, r).group === d.group)) { g.rules.splice(g.rules.indexOf(r), 1); g.discard.push(r); }
    g.rules.push(c);
    if (d.group === 'double' && g.goals.length > 2) g.discard.push(...g.goals.splice(0, g.goals.length - 2));
    announce(g, seat, `New rule: ${d.name}`);
    if (seat === g.turn) catchUp(g);
    return;
  }
  // Actions happen once and are discarded (afterwards, so a reshuffle can't bring them straight back).
  const n = k => k + infl(g);
  announce(g, seat, d.name);
  switch (d.act) {
    case 'trash': case 'airlock': {
      const o = ownerOf(g, a.keeper);
      if (o == null) break;
      g.keepers[o].splice(g.keepers[o].indexOf(a.keeper), 1);
      g.discard.push(a.keeper);
      break;
    }
    case 'steal': {
      const o = ownerOf(g, a.keeper);
      if (o == null || o === seat) break;
      g.keepers[o].splice(g.keepers[o].indexOf(a.keeper), 1);
      g.keepers[seat].push(a.keeper);
      break;
    }
    case 'tradeHands': [g.hands[seat], g.hands[a.target]] = [g.hands[a.target], g.hands[seat]]; break;
    case 'rotate': {
      const hands = g.order.map(s => g.hands[s]);
      g.order.forEach((s, i) => { g.hands[nextSeat(g, s)] = hands[i]; });
      break;
    }
    case 'jackpot': draw(g, seat, n(3)); break;
    case 'reset': g.discard.push(...g.rules); g.rules = []; if (g.goals.length > 1) g.discard.push(...g.goals.splice(0, g.goals.length - 1)); break;
    case 'freshStart': { const k = g.hands[seat].length; g.discard.push(...g.hands[seat]); g.hands[seat] = []; draw(g, seat, k); break; }
    case 'again': g.extra = true; break;
    case 'share': { let s = seat; for (let i = 0; i < g.order.length; i++) { draw(g, s, 1); s = nextSeat(g, s); } break; }
    case 'exchange': {
      const o = ownerOf(g, a.keeper);
      if (o == null || o === seat || !g.keepers[seat].includes(a.mine)) break;
      g.keepers[o].splice(g.keepers[o].indexOf(a.keeper), 1, a.mine);
      g.keepers[seat].splice(g.keepers[seat].indexOf(a.mine), 1, a.keeper);
      break;
    }
    case 'scrap': if (g.rules.includes(a.rule)) { g.rules.splice(g.rules.indexOf(a.rule), 1); g.discard.push(a.rule); if (!has(g, 'double') && g.goals.length > 1) g.discard.push(...g.goals.splice(0, g.goals.length - 1)); } break;
    case 'draw2play': case 'draw3play2': {
      const got = [];
      for (let i = 0; i < (d.act === 'draw2play' ? 2 : 3); i++) { const x = drawOne(g); if (!x) break; if (def(g, x).type === 'creeper') { g.keepers[seat].push(x); i--; continue; } got.push(x); }
      if (g.temp) { g.temp.cards.push(...got); g.temp.left += d.act === 'draw2play' ? got.length : Math.min(2, got.length); }
      else if (got.length) g.temp = { cards: got, left: d.act === 'draw2play' ? got.length : Math.min(2, got.length) };
      break;
    }
    case 'allDraw': for (const s of g.order) draw(g, s, 1); break;
    case 'goalSwap': g.discard.push(...g.goals); g.goals = []; break;
  }
  g.discard.push(c);
  if (g.phase === 'play' && seat === g.turn) catchUp(g);
}

// ---------------------------------------------------------------- bots

// Every way to play each card (with the choices it needs).
function options(g, seat) {
  const src = g.phase === 'limit' ? [] : g.temp ? g.temp.cards : g.hands[seat];
  const out = [];
  const others = g.order.filter(s => s !== seat);
  for (const c of src) {
    const d = def(g, c);
    if (d.type === 'goal' && has(g, 'double') && g.goals.length >= 2) { out.push({ type: 'play', card: c, replace: 0 }, { type: 'play', card: c, replace: 1 }); continue; }
    if (d.type !== 'action' || !d.target) { out.push({ type: 'play', card: c }); continue; }
    const all = g.order.flatMap(s => g.keepers[s].map(k => ({ s, k })));
    if (d.target === 'keeper' || d.target === 'theirKeeper' || d.target === 'creeper') {
      const want = d.target === 'creeper' ? 'creeper' : 'keeper';
      const ok = all.filter(x => def(g, x.k).type === want && (d.target !== 'theirKeeper' || x.s !== seat));
      if (!ok.length) out.push({ type: 'play', card: c });
      for (const x of ok) out.push({ type: 'play', card: c, keeper: x.k });
    } else if (d.target === 'player') for (const s of others) out.push({ type: 'play', card: c, target: s });
    else if (d.target === 'rule') { if (!g.rules.length) out.push({ type: 'play', card: c }); for (const r of g.rules) out.push({ type: 'play', card: c, rule: r }); }
    else if (d.target === 'exchange') {
      const theirs = all.filter(x => x.s !== seat && def(g, x.k).type === 'keeper'), mine = keepersOnly(g, seat);
      if (!theirs.length || !mine.length) out.push({ type: 'play', card: c });
      // Only try trading away our least useful Keepers.
      const spare = mine.slice().sort((a, b) => keepScore(g, seat, a) - keepScore(g, seat, b)).slice(0, 2);
      for (const t of theirs) for (const m of spare) out.push({ type: 'play', card: c, keeper: t.k, mine: m });
    }
  }
  return out;
}

// How much seat s wants to hold on to Keeper k (it's in a Goal on the table or in their hand).
const keepScore = (g, s, k) => [...g.goals, ...g.hands[s]].filter(c => Array.isArray(def(g, c).needs) && def(g, c).needs.includes(typeOf(k))).length;

// How good a position is for seat s (big numbers for a win or a loss).
function value(g, s) {
  if (g.phase === 'over') return g.winner === s ? 1e4 : -1e4;
  const progress = (who, c) => {
    const d = def(g, c);
    if (d.needs === 'five') return keepersOnly(g, who).length / 5 * 2;
    if (d.needs === 'hand8') return g.hands[who].length / 8 * 2;
    return d.needs.filter(k => g.keepers[who].some(x => typeOf(x) === k)).length;
  };
  let v = 0;
  for (const c of g.goals) {
    v += progress(s, c) * 3;
    for (const o of g.order) if (o !== s) v -= progress(o, c) * 2.2;
  }
  // Keepers that some Goal in my hand would use.
  const handGoals = g.hands[s].filter(c => def(g, c).type === 'goal' && Array.isArray(def(g, c).needs));
  for (const hgc of handGoals) v += def(g, hgc).needs.filter(k => g.keepers[s].some(x => typeOf(x) === k)).length * 1.2;
  v += keepersOnly(g, s).length * 0.5 + g.hands[s].length * 0.25;
  v -= g.keepers[s].filter(c => def(g, c).type === 'creeper').length * 2;
  if (g.hands[s].length > 10) v -= (g.hands[s].length - 10) * 0.4;   // a huge hand is no use
  return v;
}

export function botAction(g, seat) {
  if (g.phase === 'limit') {
    const q = g.limitQ[0];
    const pool = q.what === 'hand' ? g.hands[seat].slice() : keepersOnly(g, seat);
    // Throw away whatever hurts least.
    const scored = pool.map(c => { const t = JSON.parse(JSON.stringify(g)); const arr = q.what === 'hand' ? t.hands[seat] : t.keepers[seat]; arr.splice(arr.indexOf(c), 1); return { c, v: value(t, seat) }; });
    scored.sort((a, b) => b.v - a.v);
    return { type: 'discard', cards: scored.slice(0, q.n).map(x => x.c) };
  }
  const opts = options(g, seat);
  // Now and then just play something else: keeps bots from looping on the same move forever.
  if (opts.length > 1 && Math.random() < 0.12) return opts[Math.floor(Math.random() * opts.length)];
  let best = null, bestV = -Infinity;
  for (const o of opts) {
    const t = JSON.parse(JSON.stringify(g));
    if (applyAction(t, seat, o)) continue;
    let v = value(t, seat);
    v += Math.random() * 0.3;
    if (v > bestV) { bestV = v; best = o; }
  }
  return best || { type: 'play', card: (g.temp ? g.temp.cards : g.hands[seat])[0] };
}

export function viewFor(g, seat) {
  const D = DECKS[g.settings.deck].cards;
  return {
    deck: g.settings.deck, phase: g.phase, turn: g.turn, order: g.order, toMove: current(g),
    hand: (g.hands[seat] || []).slice(), counts: g.hands.map(h => h.length), keepers: g.keepers, rules: g.rules, goals: g.goals,
    temp: g.temp && g.turn === seat ? g.temp : g.temp ? { cards: g.temp.cards.map(() => null), left: g.temp.left } : null,
    limit: g.phase === 'limit' ? g.limitQ[0] : null,
    played: g.played, plays: playCount(g), draws: drawCount(g), handLimit: handLimit(g), keeperLimit: keeperLimit(g), double: has(g, 'double'),
    deckLeft: g.deck.length, winner: g.winner, winGoal: g.winGoal || null, moveId: g.moveId,
    cards: Object.fromEntries([...new Set([...(g.hands[seat] || []), ...(g.temp?.cards || []), ...g.keepers.flat(), ...g.rules, ...g.goals].map(typeOf))].map(k => [k, D[k]])),
  };
}

export function check(g) {
  const n = Object.keys(DECKS[g.settings.deck].cards).length;
  const all = [...g.deck, ...g.discard, ...g.hands.flat(), ...g.keepers.flat(), ...g.rules, ...g.goals, ...(g.temp?.cards || [])];
  return all.length === n && new Set(all).size === n ? '' : `cards ${all.length}/${new Set(all).size} of ${n}`;
}
