// Chef's Kiss: a party game of pairings. Each round one player is the Chef and picks a
// Recipe Card (the prompt). Everyone else is an Apprentice and plays the Ingredient Card
// from their hand that they think pairs best with it. The Chef must award exactly one
// Chef's Kiss (1 point). The Chef role then passes to the left.
import { CARDS } from './chefskiss-db.js?v=3';
import { CONFIG, OFFICIAL_LEVELS, TEAMS } from './chefskiss-config.js?v=3';
import { buildHand, recipeChoices, makeRng } from './chefskiss-hands.js?v=4';
import { blockedWords, makeBlocker } from './parental.js?v=1';
import { validateCustomCard, SNACKS_PER_HAND } from './ck-custom.js?v=1';
export { TEAMS };

export const HAND = CONFIG.handSize;        // Ingredient Cards per Apprentice
export const RECIPES = CONFIG.recipeChoices; // Recipe Cards to choose from
const REVEAL_MS = 9000;

const now = () => Date.now();
const rnd = n => Math.floor(Math.random() * n);
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------------------------------------------------------------- cards

// Cards come from the master card database (js/chefskiss-db.js). Ids look like "rc_000042"
// (Recipe) or "ic_000310" (Ingredient). Players' own cards ("cc_…") are looked up with cardOf(g, id).
const BY_ID = new Map(CARDS.map(c => [c.id, c]));
const KIND = { person: 'p', animal: 'p', thing: 't', food: 't', pop_culture: 't', event: 'e', action: 'e', place: 'c', feeling: 'c', nature: 'c' };
export function card(id) {
  if (id && typeof id === 'object') return id;
  const c = BY_ID.get(id);
  if (!c) return null;
  // t/d/k are the short names the screens use: text, the light-bulb hint, and a rough kind.
  return { id, kind: c.type === 'recipe' ? 'r' : 'i', t: c.text, d: c.hint || '', k: KIND[c.tags?.subject?.[0]] || 't', level: c.level, tags: c.tags, ...(c.type === 'recipe' ? { funnyTargets: c.funnyTargets, literalTags: c.literalTags } : {}) };
}
export const record = id => BY_ID.get(id) || null;

// ---------------------------------------------------------------- customizable cards
// Players' own cards (customizable cards spec): Signature Recipes (prompts) and Snack cards
// (answers), sent from their phone with "Play it at this table". They live on the game, keyed by
// id ("cc_…"), together with the seat that brought them. Who wrote one is never shown in play.
const ANSWER_SUBJECTS = { thing: ['thing'], person: ['person'], action: ['action', 'event'], food: ['food'] };
export function cardOf(g, id) {
  const c = typeof id === 'string' && id.startsWith('cc_') ? g?.custom?.[id] : null;
  if (!c) return card(id);
  return c.type === 'signature_recipe'
    ? { id, kind: 'r', t: c.text, d: '', k: 't', custom: true, answerTypes: c.answerTypes }
    : { id, kind: 'i', t: c.text, d: c.flavor || '', k: 't', custom: true, snack: true };
}
// A Signature Recipe as the Laugh Engine sees it: no tags of its own, but its "What kind of answer
// fits?" chips become a funny target, so cards that fit those answer types get dealt.
function recordOf(g, id) {
  const c = g.custom?.[id];
  if (!c) return record(id);
  const subject = [...new Set(c.answerTypes.flatMap(a => ANSWER_SUBJECTS[a] || []))];
  return { id, type: 'recipe', text: c.text, level: c.level, status: 'active', source: 'organic', answerTypes: c.answerTypes,
    tags: {}, funnyTargetCombos: subject.length ? [{ subject }] : [], literalTags: {} };
}
const activeCustom = (g, type) => Object.values(g.custom || {}).filter(c => c.type === type && g.seats[c.seat] && !g.used.includes(c.id));
export const levelOf = settings => OFFICIAL_LEVELS[settings.level] || 'mild';

// Parent Controls: cards with a word this family blocked are never dealt (and can't be played).
const blockerOf = g => makeBlocker(g.block);
const tableOf = g => ({ level: levelOf(g.settings), usedCardIds: new Set(g.used), blocked: blockerOf(g) });
const rngFor = (g, what) => makeRng(`${g.id}:${g.round}:${what}`);

// The Chef is dealt fresh Recipe Card choices every round. House Recipes (the host's setting):
// Off, Mix in (default: at most 1 of the 3 is a Signature Recipe) or Replace (Signature Recipes
// first, standard Recipe Cards fill in when they run out).
export const HOUSE = ['off', 'mix', 'replace'];
function dealRecipes(g) {
  const rng = rngFor(g, 'recipes');
  let ids = recipeChoices(CARDS, tableOf(g), rng);
  const house = HOUSE[g.settings.houseRecipes] || 'mix';
  const sig = rng.shuffle(activeCustom(g, 'signature_recipe').filter(c => !blockerOf(g)(c.text))).map(c => c.id);
  if (house === 'mix' && sig.length) ids = [sig[0], ...ids.slice(0, RECIPES - 1)];
  if (house === 'replace' && sig.length) ids = [...sig.slice(0, RECIPES), ...ids].slice(0, RECIPES);
  g.recipes = { [g.chef]: ids };
}

// An Apprentice's active Snack cards go into their own hand: at most 2 per hand, taking the
// random slot first, then on-target slots from the end.
function addSnacks(g, seat, hand, rng) {
  const snacks = rng.shuffle(activeCustom(g, 'snack').filter(c => c.seat === seat && !blockerOf(g)(c.text))).slice(0, SNACKS_PER_HAND);
  if (!snacks.length) return hand;
  const order = [...hand.keys()].sort((a, b) => (hand[a].slot === 'random' ? 0 : 1) - (hand[b].slot === 'random' ? 0 : 1) || b - a);
  const out = hand.slice();
  snacks.forEach((c, k) => { if (k < order.length) out[order[k]] = { cardId: c.id, slot: 'snack' }; else out.push({ cardId: c.id, slot: 'snack' }); });
  return out;
}

// After the Recipe is picked, every Apprentice (bots too) gets a fresh hand from the Laugh Engine.
// Last round's unplayed cards go back in the pool; no card is in two hands in the same round.
function dealHands(g) {
  const table = tableOf(g), round = { dealtThisRound: new Set() };
  const recipe = recordOf(g, g.recipe);
  const rng = rngFor(g, 'hands');
  g.hands = {};
  g.slots = {};
  for (const seat of rng.shuffle([...g.apprentices])) {
    const hand = addSnacks(g, seat, buildHand(CARDS, recipe, table, round, rng), rng);
    g.hands[seat] = hand.map(h => h.cardId);
    g.slots[seat] = Object.fromEntries(hand.map(h => [h.cardId, h.slot]));
  }
}

// ---------------------------------------------------------------- setup

export const DEFAULTS = {
  level: 0,           // the table's one deck: 0 = Mild (elementary), 1 = Medium (middle school), 2 = Hot (high school)
  target: 7,          // Chef's Kisses to win (0 = no target)
  length: 60,         // minutes (0 = no game timer)
  recipeTime: 10,     // seconds for the Chef to pick a Recipe Card (0 = off)
  ingredientTime: 15, // seconds for Apprentices to play (0 = off)
  teams: 0,           // 0 = everyone for themselves, else 2–4 teams
  laugh: true,        // the Laugh Engine: funny-card highlights and "Make me a card" on the phones
  houseRecipes: 1,    // players' Signature Recipes: 0 = Off, 1 = Mix in (at most 1 of 3), 2 = Replace
};
const MAX_CUSTOM = 30;  // custom cards one player can have at a table at once

export function createGame(settings, players) {
  const g = {
    settings: { ...DEFAULTS, ...settings },
    id: now().toString(36),
    seats: [],
    scores: new Array(players.length).fill(0),
    teams: new Array(players.length).fill(null),
    v: 2,              // the master card database version of the game
    block: blockedWords(),   // Parent Controls words on this screen (never sent to phones)
    used: [],          // cards used this game (played Ingredients, picked Recipes), so they aren't repeated
    hands: {},
    slots: {},         // the Laugh Engine's slot for each dealt card; stays at the table
    recipes: {},
    custom: {},        // players' Signature Recipes and Snack cards at this table, by id (with the seat that brought them)
    round: 0,
    chef: -1,
    phase: 'recipe',
    kisses: 0,
    startedAt: now(),
    announce: null,
  };
  refreshSeats(g, players);
  // The first Chef is the first player at the table.
  g.chef = g.seats.findIndex(s => s === 'human');
  if (g.chef < 0) g.chef = g.seats.findIndex(Boolean);
  startRound(g, true);
  return g;
}

export function refreshSeats(g, players) {
  g.seats = players.map(p => (p ? (p.bot ? 'bot' : 'human') : null));
  while (g.scores.length < g.seats.length) g.scores.push(0);
  const T = g.settings.teams;
  if (T) {
    g.seats.forEach((s, seat) => {
      if (!s) { g.teams[seat] = null; return; }
      if (g.teams[seat] !== null && g.teams[seat] !== undefined) return;
      // New players join the smallest team.
      const size = t => g.teams.filter((x, i) => x === t && g.seats[i]).length;
      let best = 0;
      for (let t = 1; t < T; t++) if (size(t) < size(best)) best = t;
      g.teams[seat] = best;
    });
  }
}

const seated = g => g.seats.map((s, i) => (s ? i : -1)).filter(i => i >= 0);

function startRound(g, first = false) {
  const n = g.seats.length;
  if (!first) {
    let next = -1;
    for (let k = 1; k <= n; k++) { const s = (g.chef + k) % n; if (g.seats[s]) { next = s; break; } }
    g.chef = next;
  }
  if (seated(g).length < 2 || g.chef < 0) return gameOver(g);
  g.round++;
  g.phase = 'recipe';
  g.recipe = null;
  g.subs = {};
  g.apprentices = seated(g).filter(s => s !== g.chef);
  g.hands = {};
  g.slots = {};
  dealRecipes(g);
  g.reveal = null;
  g.winner = null;
  g.endsAt = g.settings.recipeTime ? now() + g.settings.recipeTime * 1000 : 0;
}

function pickRecipe(g, id) {
  g.recipe = id;
  g.used.push(id);
  g.recipes = {};
  dealHands(g);
  g.phase = 'play';
  g.endsAt = g.settings.ingredientTime ? now() + g.settings.ingredientTime * 1000 : 0;
}

// Every Apprentice plays exactly one Ingredient Card per round, at any table size.
const played = (g, s) => (g.subs?.[s]?.length || 0) > 0;
const pending = g => g.apprentices.filter(s => g.seats[s] && !played(g, s));

function playCard(g, seat, c) {
  (g.subs[seat] || (g.subs[seat] = [])).push(c);
  if (typeof c === 'string') { const h = g.hands[seat]; h.splice(h.indexOf(c), 1); g.used.push(c); }
}

function playRandom(g, seat) {
  if (!played(g, seat) && g.hands[seat]?.length) playCard(g, seat, g.hands[seat][rnd(g.hands[seat].length)]);
}

function toJudge(g) {
  const list = [];
  for (const [seat, cards] of Object.entries(g.subs)) for (const c of cards) list.push({ seat: Number(seat), c });
  if (!list.length) return finishRound(g);
  g.reveal = shuffle(list);
  g.phase = 'judge';
  g.endsAt = 0;
}

function kiss(g, i) {
  const w = g.reveal[i];
  g.winner = i;
  g.scores[w.seat]++;
  g.kisses++;
  // A player's own card wins anonymously: the point counts, but nothing points at who wrote it.
  const custom = typeof w.c === 'string' && w.c.startsWith('cc_');
  g.lastKiss = { n: g.kisses, seat: custom ? -1 : w.seat, round: g.round, custom };
  g.announce = { id: g.id + ':' + g.kisses, seat: custom ? -1 : w.seat, text: "💋 Chef's Kiss!" };
  g.phase = 'reveal';
  g.endsAt = now() + REVEAL_MS;
}

function finishRound(g) {
  const T = g.settings.target;
  if (T && Math.max(...g.scores) >= T) return gameOver(g, 'target');
  if (g.settings.length && now() >= g.startedAt + g.settings.length * 60000) return gameOver(g, 'time');
  startRound(g);
}

function gameOver(g, why = 'players') {
  g.phase = 'over';
  g.why = why;
  g.endsAt = 0;
  const best = Math.max(...g.scores);
  g.winners = best > 0 ? g.scores.map((s, i) => (s === best && g.seats[i] ? i : -1)).filter(i => i >= 0) : [];
  if (g.settings.teams) {
    const totals = teamTotals(g);
    const top = Math.max(...totals);
    g.winningTeams = top > 0 ? totals.map((t, i) => (t === top ? i : -1)).filter(i => i >= 0) : [];
  }
}

export function teamTotals(g) {
  const out = new Array(g.settings.teams || 0).fill(0);
  g.teams.forEach((t, seat) => { if (t !== null && t !== undefined && out[t] !== undefined) out[t] += g.scores[seat]; });
  return out;
}

// ---------------------------------------------------------------- the clock and the bots

export function timer(g, players) {
  // A game saved before the card database changed can't continue: end it cleanly.
  if (g.v !== 2 && g.phase !== 'over') return { ms: 0, run: () => gameOver(g) };
  refreshSeats(g, players);
  const chefHere = g.seats[g.chef];
  const chefBot = chefHere === 'bot';
  switch (g.phase) {
    case 'recipe':
      if (!chefHere) return { ms: 800, run: () => startRound(g) };
      if (chefBot) return { ms: 1600, run: () => { if (g.phase === 'recipe') pickRecipe(g, g.recipes[g.chef][rnd(g.recipes[g.chef].length)]); } };
      if (g.endsAt) return { ms: Math.max(0, g.endsAt - now()), run: () => { if (g.phase === 'recipe') pickRecipe(g, g.recipes[g.chef][rnd(g.recipes[g.chef].length)]); } };
      return null;
    case 'play': {
      const left = pending(g);
      if (!left.length) return { ms: 400, run: () => { if (g.phase === 'play') toJudge(g); } };
      const bot = left.find(s => g.seats[s] === 'bot');
      if (bot !== undefined) return { ms: 700 + rnd(900), run: () => { if (g.phase === 'play') { playRandom(g, bot); if (!pending(g).length) toJudge(g); } } };
      if (g.endsAt) return { ms: Math.max(0, g.endsAt - now()), run: () => { if (g.phase === 'play') { pending(g).forEach(s => playRandom(g, s)); toJudge(g); } } };
      return null;
    }
    case 'judge':
      // No timer on the Chef's decision: the lobbying is the fun part.
      if (!chefHere) return { ms: 1500, run: () => { if (g.phase === 'judge') finishRound(g); } };
      if (chefBot) return { ms: 6000, run: () => { if (g.phase === 'judge') kiss(g, rnd(g.reveal.length)); } };
      return null;
    case 'reveal':
      return { ms: Math.max(0, g.endsAt - now()), run: () => { if (g.phase === 'reveal') finishRound(g); } };
  }
  return null;
}

// ---------------------------------------------------------------- actions

const clean = (s, n) => String(s || '').replace(/[<>&"]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);

export function applyAction(g, seat, a) {
  if (!a || typeof a !== 'object') return 'Bad move';
  switch (a.type) {
    case 'recipe': {
      if (g.phase !== 'recipe' || seat !== g.chef) return "It isn't your turn to pick a Recipe Card";
      if (!g.recipes[seat]?.includes(a.id)) return 'Pick one of your Recipe Cards';
      pickRecipe(g, a.id);
      return null;
    }
    case 'play': {
      if (g.phase !== 'play') return g.phase === 'recipe' ? 'Wait for the Chef to pick a Recipe Card' : 'Cards are already in';
      if (seat === g.chef) return "You're the Chef this round";
      if (!g.apprentices.includes(seat)) return "You'll be dealt in next round";
      if (played(g, seat)) return 'You already played';
      if (!g.hands[seat]?.includes(a.id)) return "That card isn't in your hand";
      playCard(g, seat, a.id);
      if (!pending(g).length) toJudge(g);
      return null;
    }
    case 'custom': {
      // "Play it at this table": a player's own card joins the table (same level only).
      g.custom = g.custom || {};
      const c = a.card;
      const problem = validateCustomCard(c, levelOf(g.settings));
      if (problem) return problem;
      if (blockerOf(g)(c.text) || (c.flavor && blockerOf(g)(c.flavor))) return "That card can't be played at this table";
      if (g.custom[c.id] && g.custom[c.id].seat !== seat) return 'That card is already at the table';
      if (!g.custom[c.id] && Object.values(g.custom).filter(x => x.seat === seat).length >= MAX_CUSTOM) return `You can bring up to ${MAX_CUSTOM} cards`;
      g.custom[c.id] = { id: c.id, type: c.type, level: c.level, text: String(c.text).trim(), flavor: c.type === 'snack' ? (c.flavor || null) : null,
        answerTypes: c.type === 'signature_recipe' ? c.answerTypes : [], seat };
      return null;
    }
    case 'uncustom': {
      const c = g.custom?.[a.id];
      if (!c || c.seat !== seat) return null;
      delete g.custom[a.id];
      return null;
    }
    case 'kiss': {
      if (g.phase !== 'judge' || seat !== g.chef) return 'Only the Chef awards the Chef\'s Kiss';
      const i = Number(a.i);
      if (!(i >= 0 && i < g.reveal.length)) return 'Pick one of the Ingredient Cards';
      kiss(g, i);
      return null;
    }
    case 'next':
      if (g.phase === 'reveal') finishRound(g);
      return null;
    case 'timers': {
      // The host can change the timers mid-game.
      const s = g.settings;
      if ([0, 5, 10, 15].includes(Number(a.recipeTime))) s.recipeTime = Number(a.recipeTime);
      if ([0, 10, 15, 20, 30].includes(Number(a.ingredientTime))) s.ingredientTime = Number(a.ingredientTime);
      if ([0, 30, 60, 120].includes(Number(a.length))) s.length = Number(a.length);
      if (g.phase === 'recipe') g.endsAt = s.recipeTime ? now() + s.recipeTime * 1000 : 0;
      if (g.phase === 'play') g.endsAt = s.ingredientTime ? now() + s.ingredientTime * 1000 : 0;
      return null;
    }
    case 'end':
      gameOver(g, 'time');
      return null;
  }
  return 'Unknown move';
}

// ---------------------------------------------------------------- what each phone sees

export function viewFor(g, seat) {
  const isChef = seat === g.chef;
  const showOwners = ['reveal', 'over'].includes(g.phase);
  return {
    id: g.id,
    phase: g.phase,
    round: g.round,
    chef: g.chef,
    isChef,
    playing: (g.apprentices || []).includes(seat),
    recipe: g.recipe ? cardOf(g, g.recipe) : null,
    myRecipes: isChef && g.phase === 'recipe' ? (g.recipes[seat] || []).map(id => cardOf(g, id)).filter(Boolean) : null,
    hand: (g.hands[seat] || []).map(id => cardOf(g, id)).filter(Boolean),
    mine: (g.subs?.[seat] || []).map(id => cardOf(g, id)).filter(Boolean),
    myCustom: Object.values(g.custom || {}).filter(c => c.seat === seat).map(c => c.id),
    houseRecipes: HOUSE[g.settings.houseRecipes] || 'mix',
    played: Object.values(g.subs || {}).reduce((n, c) => n + c.length, 0),
    expected: (g.apprentices || []).filter(s => g.seats[s]).length,
    reveal: g.reveal && ['judge', 'reveal'].includes(g.phase)
      ? g.reveal.map(r => { const c = cardOf(g, r.c) || { t: '?' }; return { ...c, seat: showOwners && !c.custom ? r.seat : undefined, yours: r.seat === seat }; })
      : null,
    winner: g.winner,
    lastKiss: g.lastKiss || null,
    scores: g.scores,
    seats: g.seats,
    teams: g.settings.teams ? g.teams : null,
    teamTotals: g.settings.teams ? teamTotals(g) : null,
    target: g.settings.target,
    left: g.endsAt ? Math.max(0, g.endsAt - now()) : null,
    gameLeft: g.settings.length ? Math.max(0, g.startedAt + g.settings.length * 60000 - now()) : null,
    winners: g.winners || null,
    laugh: !!g.settings.laugh,
    level: levelOf(g.settings),
    winningTeams: g.winningTeams || null,
    why: g.why,
  };
}

export const turn = g => (['recipe', 'judge'].includes(g.phase) ? g.chef : -1);

export function botAction(g, seat) {
  if (g.phase === 'recipe') return { type: 'recipe', id: g.recipes[seat]?.[0] };
  if (g.phase === 'judge') return { type: 'kiss', i: rnd(g.reveal.length) };
  return { type: 'next' };
}
