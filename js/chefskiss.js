// Chef's Kiss: a party game of pairings. Each round one player is the Chef and picks a
// Recipe Card (the prompt). Everyone else is an Apprentice and plays the Ingredient Card
// from their hand that they think pairs best with it. The Chef must award exactly one
// Chef's Kiss (1 point). The Chef role then passes to the left.
import { DECKS } from './chefskiss-cards.js?v=58';

export const HAND = 5;          // Ingredient Cards per Apprentice
export const RECIPES = 3;       // Recipe Cards to choose from
export const TEAMS = [
  { name: 'Red', c: '#e0474c' }, { name: 'Blue', c: '#3d7fe0' },
  { name: 'Green', c: '#33a35b' }, { name: 'Gold', c: '#e2a72e' },
];
const REVEAL_MS = 9000;

const now = () => Date.now();
const rnd = n => Math.floor(Math.random() * n);
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------------------------------------------------------------- cards

// Card ids look like "e2026:r:12" (Recipe) or "d80:i:3" (Ingredient).
export function card(id) {
  if (id && typeof id === 'object') return id;           // a player's own card: { own: true, t, d }
  const [deck, kind, n] = String(id).split(':');
  const D = DECKS[deck];
  const c = D && (kind === 'r' ? D.recipes : D.ingredients)[Number(n)];
  return c ? { id, kind, t: c.t, d: c.d, k: c.k, deck: D.name } : null;
}

export function decksIn(settings) {
  const keys = Object.keys(DECKS).filter(k => settings['deck_' + k]);
  // Decade-Decks only have Ingredient Cards, so there's always an Edition for the Recipes.
  if (!keys.some(k => DECKS[k].group === 'edition')) keys.unshift('e2026');
  return keys;
}

function buildPiles(settings) {
  const r = [], i = [];
  for (const k of decksIn(settings)) {
    DECKS[k].recipes.forEach((_, n) => r.push(`${k}:r:${n}`));
    DECKS[k].ingredients.forEach((_, n) => i.push(`${k}:i:${n}`));
  }
  return { r: shuffle(r), i: shuffle(i) };
}

function draw(g, kind) {
  if (!g.piles[kind].length) { g.piles[kind] = shuffle(g.discard[kind]); g.discard[kind] = []; }
  return g.piles[kind].pop() || null;
}

// Smart hands: deal for variety (people, things, happenings, places and ideas) so nobody
// stares at five cards that are all the same sort of thing.
function drawIngredient(g, hand) {
  const pile = g.piles.i;
  if (!pile.length) { g.piles.i = shuffle(g.discard.i); g.discard.i = []; }
  const count = k => hand.filter(id => card(id)?.k === k).length;
  for (let j = g.piles.i.length - 1, tries = 0; j >= 0 && tries < 8; j--, tries++) {
    if (count(card(g.piles.i[j])?.k) < 2) return g.piles.i.splice(j, 1)[0];
  }
  return draw(g, 'i');
}

function deal(g) {
  g.seats.forEach((s, seat) => {
    if (!s) return;
    const hand = g.hands[seat] || (g.hands[seat] = []);
    while (hand.length < HAND) { const c = drawIngredient(g, hand); if (!c) break; hand.push(c); }
    const rec = g.recipes[seat] || (g.recipes[seat] = []);
    while (rec.length < RECIPES) { const c = draw(g, 'r'); if (!c) break; rec.push(c); }
  });
}

// ---------------------------------------------------------------- setup

export const DEFAULTS = {
  deck_e2026: true, deck_silly: false, deck_easy: false,
  deck_d50: false, deck_d60: false, deck_d70: false, deck_d80: false, deck_d90: false,
  target: 7,          // Chef's Kisses to win (0 = no target)
  length: 60,         // minutes (0 = no game timer)
  recipeTime: 10,     // seconds for the Chef to pick a Recipe Card (0 = off)
  ingredientTime: 15, // seconds for Apprentices to play (0 = off)
  teams: 0,           // 0 = everyone for themselves, else 2–4 teams
};

export function createGame(settings, players) {
  const g = {
    settings: { ...DEFAULTS, ...settings },
    id: now().toString(36),
    seats: [],
    scores: new Array(players.length).fill(0),
    teams: new Array(players.length).fill(null),
    piles: null,
    discard: { r: [], i: [] },
    hands: {},
    recipes: {},
    round: 0,
    chef: -1,
    phase: 'recipe',
    kisses: 0,
    startedAt: now(),
    announce: null,
  };
  g.piles = buildPiles(g.settings);
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
  deal(g);
  g.round++;
  g.phase = 'recipe';
  g.recipe = null;
  g.subs = {};
  g.apprentices = seated(g).filter(s => s !== g.chef);
  // Three's a Party: with only three players, each Apprentice plays two cards (Double Vision).
  g.need = seated(g).length === 3 ? 2 : 1;
  g.swapped = {};
  g.reveal = null;
  g.winner = null;
  g.endsAt = g.settings.recipeTime ? now() + g.settings.recipeTime * 1000 : 0;
}

function pickRecipe(g, id) {
  const hand = g.recipes[g.chef];
  hand.splice(hand.indexOf(id), 1);
  g.recipe = id;
  g.phase = 'play';
  g.endsAt = g.settings.ingredientTime ? now() + g.settings.ingredientTime * 1000 : 0;
}

const pending = g => g.apprentices.filter(s => g.seats[s] && (g.subs[s]?.length || 0) < g.need);

function playCard(g, seat, c) {
  (g.subs[seat] || (g.subs[seat] = [])).push(c);
  if (typeof c === 'string') { const h = g.hands[seat]; h.splice(h.indexOf(c), 1); }
}

function playRandom(g, seat) {
  while ((g.subs[seat]?.length || 0) < g.need && g.hands[seat]?.length) playCard(g, seat, g.hands[seat][rnd(g.hands[seat].length)]);
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
  g.lastKiss = { n: g.kisses, seat: w.seat, round: g.round };
  g.announce = { id: g.id + ':' + g.kisses, seat: w.seat, text: "💋 Chef's Kiss!" };
  g.phase = 'reveal';
  g.endsAt = now() + REVEAL_MS;
}

function finishRound(g) {
  if (g.recipe) g.discard.r.push(g.recipe);
  for (const cards of Object.values(g.subs || {})) for (const c of cards) if (typeof c === 'string') g.discard.i.push(c);
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
      if ((g.subs[seat]?.length || 0) >= g.need) return 'You already played';
      if (a.own) {
        const t = clean(a.own.t, 80);
        if (!t) return 'Write something on your card first';
        playCard(g, seat, { own: true, t, d: clean(a.own.d, 160) });
      } else {
        if (!g.hands[seat]?.includes(a.id)) return "That card isn't in your hand";
        playCard(g, seat, a.id);
      }
      if (!pending(g).length) toJudge(g);
      return null;
    }
    case 'swap': {
      if (g.phase === 'over') return null;
      if (g.swapped[seat]) return 'You can swap one card per round';
      const hand = g.hands[seat];
      const i = hand ? hand.indexOf(a.id) : -1;
      if (i < 0) return "That card isn't in your hand";
      const next = drawIngredient(g, hand.filter(x => x !== a.id));
      if (!next) return 'No cards left to swap in';
      g.discard.i.push(hand[i]);
      hand[i] = next;
      g.swapped[seat] = true;
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
    need: g.need,
    playing: (g.apprentices || []).includes(seat),
    recipe: g.recipe ? card(g.recipe) : null,
    myRecipes: isChef && g.phase === 'recipe' ? g.recipes[seat].map(card) : null,
    hand: (g.hands[seat] || []).map(card),
    mine: (g.subs?.[seat] || []).map(card),
    played: Object.values(g.subs || {}).reduce((n, c) => n + c.length, 0),
    expected: (g.apprentices || []).filter(s => g.seats[s]).length * g.need,
    reveal: g.reveal && ['judge', 'reveal'].includes(g.phase)
      ? g.reveal.map(r => ({ ...card(r.c), seat: showOwners ? r.seat : undefined, yours: r.seat === seat }))
      : null,
    winner: g.winner,
    lastKiss: g.lastKiss || null,
    canSwap: !g.swapped?.[seat],
    scores: g.scores,
    seats: g.seats,
    teams: g.settings.teams ? g.teams : null,
    teamTotals: g.settings.teams ? teamTotals(g) : null,
    target: g.settings.target,
    left: g.endsAt ? Math.max(0, g.endsAt - now()) : null,
    gameLeft: g.settings.length ? Math.max(0, g.startedAt + g.settings.length * 60000 - now()) : null,
    winners: g.winners || null,
    winningTeams: g.winningTeams || null,
    why: g.why,
  };
}

export const turn = g => (['recipe', 'judge'].includes(g.phase) ? g.chef : -1);

export function botAction(g, seat) {
  if (g.phase === 'recipe') return { type: 'recipe', id: g.recipes[seat][0] };
  if (g.phase === 'judge') return { type: 'kiss', i: rnd(g.reveal.length) };
  return { type: 'next' };
}
