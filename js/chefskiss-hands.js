// The Laugh Engine's hand building (SPEC.md Section 8). Pure functions over the master card
// database, so they can be tested on their own. Every round, after the Chef picks a Recipe Card,
// each Apprentice gets a fresh 5-card hand: 4 on-target cards (likely funny with this Recipe) and
// 1 random eligible card, shuffled together (CARD_RULES.md Section 7).
// The slot labels stay with the table; players never see them.
import { CONFIG, rank } from './chefskiss-config.js?v=3';
import { answerFit } from './ck-custom.js?v=1';
import { inDecks } from './chefskiss-decks.js?v=3';

const DIMS = ['subject', 'tone', 'scale', 'register', 'violation', 'status'];
export const TAG_WEIGHTS = { subject: 1.0, tone: 1.5, scale: 1.0, register: 1.0, violation: 1.0, status: 1.0 };
export const LITERAL_THRESHOLD = 2;

// A small seeded random number generator (mulberry32), so the same seed always deals the same hands.
export function makeRng(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (const ch of String(seed)) { h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = n => Math.floor(next() * n);
  next.pick = list => list[next.int(list.length)];
  next.shuffle = list => { for (let i = list.length - 1; i > 0; i--) { const j = next.int(i + 1); [list[i], list[j]] = [list[j], list[i]]; } return list; };
  return next;
}

// Missing data never breaks a round: anything the engine needs falls back to empty or a default.
const tagsOf = (c, key = 'tags') => {
  const t = c?.[key] || {};
  return Object.fromEntries(DIMS.map(d => [d, Array.isArray(t[d]) ? t[d] : []]));
};
const hasTags = c => DIMS.some(d => tagsOf(c)[d].length);
const combosOf = recipe => (Array.isArray(recipe?.funnyTargetCombos) ? recipe.funnyTargetCombos : []).filter(x => x && typeof x === 'object');
const fresh = c => (typeof c?.freshness === 'number' ? c.freshness : 1);

export function overlap(cardTags, targetTags, rarity = null) {
  let s = 0;
  for (const d of DIMS) {
    const want = new Set(targetTags?.[d] || []);
    for (const t of cardTags?.[d] || []) if (want.has(t)) s += TAG_WEIGHTS[d] * (rarity ? rarity(d, t) : 1);
  }
  return s;
}

// Narrower tags (playtest, 24 Nov 2026): a match on a tag most of the deck shares ("everyday",
// "casual") says little, so each tag counts by how rare it is among the cards being dealt.
// A tag on a quarter of the pool counts 1x, half 0.5x, a tenth about 1.7x (between 0.25x and 2x).
export function tagRarity(pool) {
  const n = Math.max(1, pool.length);
  const df = {};
  for (const c of pool) for (const d of DIMS) for (const t of tagsOf(c)[d]) df[d + ':' + t] = (df[d + ':' + t] || 0) + 1;
  return (d, t) => Math.min(2, Math.max(0.25, Math.log(n / (df[d + ':' + t] || 1)) / Math.log(4)));
}

export function literalScore(card, recipe) {
  return overlap(tagsOf(card), tagsOf(recipe, 'literalTags')) + ((card?.literalFor || []).includes(recipe?.id) ? 3 : 0);
}

// What the table has learned (the win stats at /api/laugh-stats): { pairs: { recipeId: { cardId:
// [plays, wins, exp] } }, cards: { cardId: [plays, wins, exp] } }, where exp is the wins expected by
// chance. A card's "lift" is wins / expected: 1 = average, 2 = wins twice as often as chance. A pair
// with few plays leans on the card's own lift, and a card with few plays leans on 1 (no data = 0.2,
// the old prior, so hands are unchanged until rounds are logged). An older Map form still works.
export const pairWinRate = (recipeId, cardId, stats) => {
  const prior = 0.2;
  if (stats?.get) {
    const s = stats.get(`${recipeId}|${cardId}`);
    return s ? (s.wins + prior * 5) / (s.plays + 5) : prior;
  }
  const c = stats?.cards?.[cardId], p = stats?.pairs?.[recipeId]?.[cardId];
  if (!c && !p) return prior;
  const cardLift = c ? (c[1] + 5) / (c[2] + 5) : 1;
  const lift = p ? (p[1] + 3 * cardLift) / (p[2] + 3) : cardLift;
  return prior * Math.min(4, Math.max(0.25, lift));
};

// How well a card fits the Recipe's funny targets: its best match against any one combo
// (a card has to fit one whole technique, not bits of several).
export const targetScore = (card, recipe, rarity = null) => Math.max(0, ...combosOf(recipe).map(combo => overlap(tagsOf(card), combo, rarity)));

export function funnyScore(card, recipe, rng = Math.random, stats = null, rarity = null) {
  const target = targetScore(card, recipe, rarity);
  const literal = literalScore(card, recipe);
  // Learned wins count on a log scale around the prior: no data = 3.0 x 0.2 (as before); a pair
  // that wins 3x as often as chance adds about 6.6, one that wins half as often loses about 4.2.
  const history = 0.6 + 6.0 * Math.log(pairWinRate(recipe?.id, card?.id, stats) / 0.2);
  // A Signature Recipe's "What kind of answer fits?" chips: cards of those kinds score higher.
  // (Official cards' answerTypes are Al's deck-review labels, used by his scorer, not by the dealer.)
  const chips = recipe?.source === 'organic' && recipe?.answerTypes?.length;
  const fit = chips ? 2.0 * answerFit(card, recipe.answerTypes) : 0;
  return (2.0 * target - 1.5 * literal + history + fit) * (0.5 + 0.5 * fresh(card)) + rng() * 0.3;
}

// Which Ingredient Cards may be dealt at this table this round (SPEC.md Section 8.1).
export function eligible(card, table, round) {
  if (!card || card.status !== 'active' || card.type !== 'ingredient') return false;
  if (table.usedCardIds?.has?.(card.id) || round.dealtThisRound.has(card.id)) return false;
  if (card.source === 'organic') return false;                // Organic Cards are played from their owner's tab, never dealt
  if (table.blocked?.(card.text)) return false;               // Parent Controls: a word this family blocked
  if (card.level !== table.level) return false;               // one table, one deck: never another level's cards
  if (!inDecks(card, table.decks)) return false;              // only the table's decks (free starter for now)
  if (table.decadeFilter?.length && !table.decadeFilter.includes(card.decade)) return false;
  return true;
}

// Sample n cards from the top quarter of a ranked list, weighted by score, with at most
// maxSameSubject cards sharing a main subject (relaxed only if the pool can't fill the hand).
function takeTopWithDiversity(ranked, n, maxSameSubject, rng) {
  const top = ranked.slice(0, Math.max(n * 3, Math.ceil(ranked.length / 4)));
  const out = [];
  const count = {};
  const main = c => tagsOf(c).subject[0] || '?';
  for (const strict of [true, false]) {
    const left = top.filter(x => !out.includes(x.c));
    while (out.length < n && left.length) {
      const ok = left.filter(x => !strict || (count[main(x.c)] || 0) < maxSameSubject);
      if (!ok.length) break;
      const low = Math.min(...ok.map(x => x.s));
      const w = ok.map(x => x.s - low + 0.25);
      let r = rng() * w.reduce((a, b) => a + b, 0);
      let i = 0;
      while (i < ok.length - 1 && (r -= w[i]) > 0) i++;
      const pick = ok[i];
      out.push(pick.c);
      count[main(pick.c)] = (count[main(pick.c)] || 0) + 1;
      left.splice(left.indexOf(pick), 1);
    }
  }
  return out;
}

// Does a card fit one whole combo (a tag on every axis the combo names)?
export const fitsCombo = (card, combo) => Object.entries(combo || {}).every(([d, want]) =>
  !Array.isArray(want) || !want.length || tagsOf(card)[d]?.some(t => want.includes(t)));

// The on-target slots, spread over the Recipe's combos (playtest, 24 Nov 2026): each slot is
// dealt for one combo in turn, so a hand mixes 2–3 kinds of joke instead of 4 of the same one
// (before, the gross + social combo won most hands because tone counts 1.5). No more than 2
// cards share a main subject or a main tone (relaxed only if the pool can't fill the hand).
function spreadAcrossCombos(pool, recipe, n, rng, stats, rarity) {
  const combos = combosOf(recipe);
  const start = rng.int(combos.length);
  const out = [];
  const count = { subject: {}, tone: {} };
  const main = (c, d) => tagsOf(c)[d][0] || '?';
  for (let i = 0; i < n; i++) {
    const combo = combos[(start + i) % combos.length];
    const one = { ...recipe, funnyTargetCombos: [combo] };
    const scored = pool.filter(c => !out.includes(c))
      .map(c => ({ c, s: funnyScore(c, one, rng, stats, rarity) + (fitsCombo(c, combo) ? 1.5 : 0) }))
      .sort((a, b) => b.s - a.s);
    let ok = [];
    for (const cap of [2, 3, Infinity]) {
      ok = scored.filter(x => (count.subject[main(x.c, 'subject')] || 0) < cap && (count.tone[main(x.c, 'tone')] || 0) < cap);
      if (ok.length) break;
    }
    if (!ok.length) break;
    const top = ok.slice(0, Math.max(6, Math.ceil(ok.length / 8)));
    const low = Math.min(...top.map(x => x.s));
    const w = top.map(x => x.s - low + 0.25);
    let r = rng() * w.reduce((a, b) => a + b, 0);
    let k = 0;
    while (k < top.length - 1 && (r -= w[k]) > 0) k++;
    const pick = top[k].c;
    out.push(pick);
    for (const d of ['subject', 'tone']) count[d][main(pick, d)] = (count[d][main(pick, d)] || 0) + 1;
  }
  return out;
}

// One Apprentice's hand (SPEC.md Section 8.3). Returns [{ cardId, slot }]; marks the cards as dealt.
// table: { level, usedCardIds: Set, decadeFilter? }   round: { dealtThisRound: Set }
export function buildHand(cards, recipe, table, round, rng, { handSize = CONFIG.handSize, mix = CONFIG.handMix, stats = null } = {}) {
  let pool = cards.filter(c => eligible(c, table, round));
  // Short on cards: let this game's played cards come back before anything else (never higher levels).
  if (pool.length < handSize) pool = cards.filter(c => eligible(c, { ...table, usedCardIds: new Set() }, round));
  let hand;
  const hasData = (combosOf(recipe).length > 0 || (recipe?.source === 'organic' && recipe?.answerTypes?.length > 0)) && pool.filter(hasTags).length >= 10;
  if (!hasData) {
    hand = rng.shuffle([...pool]).slice(0, handSize).map(c => ({ cardId: c.id, slot: 'random' }));
  } else {
    const rarity = tagRarity(pool);
    const ranked = pool.map(c => ({ c, s: funnyScore(c, recipe, rng, stats, rarity) })).sort((a, b) => b.s - a.s);
    // Mixed subjects keep a hand varied, unless the Recipe asked for one kind of answer (a Signature
    // Recipe's "What kind of answer fits?" chips).
    const chips = recipe?.source === 'organic' && recipe?.answerTypes?.length;
    const onTarget = !chips && combosOf(recipe).length > 1
      ? spreadAcrossCombos(pool, recipe, mix.onTarget, rng, stats, rarity)
      : takeTopWithDiversity(ranked, mix.onTarget, chips ? mix.onTarget : 2, rng);
    const rest = rng.shuffle(pool.filter(c => !onTarget.includes(c)));
    hand = [
      ...onTarget.map(c => ({ cardId: c.id, slot: 'on_target' })),
      ...rest.slice(0, mix.random).map(c => ({ cardId: c.id, slot: 'random' })),
    ];
    // Top up with random cards if the mix couldn't be filled (tiny pools only).
    for (const c of rest.slice(mix.random)) { if (hand.length >= handSize) break; hand.push({ cardId: c.id, slot: 'random' }); }
    rng.shuffle(hand);
  }
  for (const h of hand) round.dealtThisRound.add(h.cardId);
  return hand;
}

// The Chef's Recipe Card choices: eligible Recipes, weighted toward fresh ones with funnyTargets,
// avoiding two choices with the same main subject when possible (SPEC.md Section 8.3).
export function recipeChoices(cards, table, rng, n = CONFIG.recipeChoices) {
  const ok = c => c && c.status === 'active' && c.type === 'recipe' && c.source !== 'organic' && c.level === table.level && inDecks(c, table.decks) && (!table.decadeFilter?.length || table.decadeFilter.includes(c.decade)) && !table.blocked?.(c.text);
  let pool = cards.filter(c => ok(c) && !table.usedCardIds?.has?.(c.id));
  if (pool.length < n) pool = cards.filter(ok);
  const weight = c => fresh(c) * (combosOf(c).length ? 1 : 0.3) + 0.01;
  const out = [];
  for (const strict of [true, false]) {
    let left = pool.filter(c => !out.includes(c) && (!strict || !out.some(o => tagsOf(o).subject[0] && tagsOf(o).subject[0] === tagsOf(c).subject[0])));
    while (out.length < n && left.length) {
      const w = left.map(weight);
      let r = rng() * w.reduce((a, b) => a + b, 0);
      let i = 0;
      while (i < left.length - 1 && (r -= w[i]) > 0) i++;
      const pick = left[i];
      out.push(pick);
      left = left.filter(c => c !== pick && (!strict || tagsOf(c).subject[0] !== tagsOf(pick).subject[0]));
    }
  }
  return out.map(c => c.id);
}

// Was this round won by a plain, literal match? (SPEC.md Section 8.5) Only the literal checks
// count; the slot a card was dealt in never decides a dud.
export function isDud(winnerCard, recipe) {
  if (!winnerCard || !recipe) return false;
  return literalScore(winnerCard, recipe) >= LITERAL_THRESHOLD || (winnerCard.literalFor || []).includes(recipe.id);
}
