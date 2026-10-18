// Chef's Kiss tests for the master card database and the Laugh Engine's hands (SPEC.md Sections 5.2, 8, 15).
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../js/chefskiss-db.js';
import { CONFIG, OFFICIAL_LEVELS, rank } from '../js/chefskiss-config.js';
import { buildHand, recipeChoices, makeRng, eligible, literalScore, isDud, overlap } from '../js/chefskiss-hands.js';
import * as K from '../js/chefskiss.js';

const TAX = {
  subject: ['person', 'place', 'thing', 'event', 'nature', 'animal', 'food', 'pop_culture', 'feeling', 'action'],
  tone: ['silly', 'absurd', 'wholesome', 'awkward', 'dramatic', 'dry', 'gross_mild', 'nostalgic'],
  scale: ['tiny', 'everyday', 'huge', 'cosmic'],
  register: ['formal', 'casual', 'kid', 'slang', 'fancy', 'official_sounding'],
};
const DIMS = Object.keys(TAX);
const active = CARDS.filter(c => c.status === 'active');
const ingredients = active.filter(c => c.type === 'ingredient');
const recipes = active.filter(c => c.type === 'recipe');
const byId = new Map(CARDS.map(c => [c.id, c]));

// ---------------------------------------------------------------- seed data (Sections 5.2 and 15)
test('every card matches the Card schema', () => {
  const ids = new Set();
  for (const c of CARDS) {
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`); ids.add(c.id);
    assert.match(c.id, c.type === 'recipe' ? /^rc_\d{6}$/ : /^ic_\d{6}$/);
    assert.ok(['recipe', 'ingredient'].includes(c.type));
    assert.ok(typeof c.text === 'string' && c.text.length >= 1 && c.text.length <= 120, c.id);
    assert.equal(c.source, 'official');
    assert.ok(['draft', 'in_review', 'active', 'retired', 'rejected'].includes(c.status));
    assert.ok(c.freshness >= 0 && c.freshness <= 1);
    assert.ok(c.audience.knownness >= 1 && c.audience.knownness <= 5);
    assert.ok(rank(c.audience.readingLevel) <= rank('spicy') && rank(c.audience.cultureLevel) <= rank('spicy'));
    for (const k of ['born', 'peak', 'stale']) assert.ok(c.culture[k] === null || /^\d{4}$/.test(c.culture[k]));
    for (const key of c.type === 'recipe' ? ['tags', 'funnyTargets', 'literalTags'] : ['tags']) {
      for (const d of DIMS) for (const t of c[key][d]) assert.ok(TAX[d].includes(t), `${c.id} ${key}.${d} "${t}"`);
    }
    assert.deepEqual(Object.keys(c.stats).sort(), ['kisses', 'timesDealt', 'timesPlayed']);
    assert.ok(Number.isInteger(c.version) && c.version >= 1);
  }
});

test('official cards are only Mild, Medium or Spicy (never Hot or Hellfire)', () => {
  for (const c of CARDS) assert.ok(OFFICIAL_LEVELS.includes(c.level), `${c.id} is ${c.level}`);
});

test('at least 150 Recipe Cards and 600 Ingredient Cards per level', () => {
  for (const level of OFFICIAL_LEVELS) {
    assert.ok(recipes.filter(c => c.level === level).length >= 150, `${level} recipes`);
    assert.ok(ingredients.filter(c => c.level === level).length >= 600, `${level} ingredients`);
  }
});

test('every card is fully tagged and every Recipe has funnyTargets and literalTags', () => {
  for (const c of active) {
    for (const d of DIMS) assert.ok(c.tags[d].length, `${c.id} has no ${d} tag`);
    if (c.type === 'recipe') {
      assert.ok(DIMS.some(d => c.funnyTargets[d].length), `${c.id} funnyTargets`);
      assert.ok(DIMS.some(d => c.literalTags[d].length), `${c.id} literalTags`);
    }
  }
});

test('pop-culture Ingredient Cards say when they are from', () => {
  for (const c of ingredients) if (c.tags.subject.includes('pop_culture')) assert.ok(c.culture.born, c.id);
});

test('no two cards share the same text', () => {
  const seen = new Set();
  for (const c of active) { const k = c.text.toLowerCase(); assert.ok(!seen.has(k), c.text); seen.add(k); }
});

test('old banned titles are not in any card', () => {
  for (const c of CARDS) assert.doesNotMatch(c.text, /Trash It|Toss It|Super-Duper|MyCard|Simply Silly|Easy Peasy|Double Vision/i);
});

// ---------------------------------------------------------------- hands (Section 8)
const table = (level = 'spicy', used = []) => ({ level, usedCardIds: new Set(used) });
const someRecipe = (level = 'mild') => recipes.find(c => c.level === level);

test('buildHand returns 7 unique eligible cards', () => {
  for (const level of OFFICIAL_LEVELS) {
    const hand = buildHand(CARDS, someRecipe(level), table(level), { dealtThisRound: new Set() }, makeRng('a' + level));
    assert.equal(hand.length, CONFIG.handSize);
    assert.equal(new Set(hand.map(h => h.cardId)).size, CONFIG.handSize);
    for (const h of hand) {
      const c = byId.get(h.cardId);
      assert.equal(c.type, 'ingredient');
      assert.equal(c.status, 'active');
    }
  }
});

test('hands are 5 on-target, 1 safe and 1 wild when the data is there', () => {
  for (const r of recipes.slice(0, 60)) {
    const hand = buildHand(CARDS, r, table(r.level), { dealtThisRound: new Set() }, makeRng(r.id));
    const n = s => hand.filter(h => h.slot === s).length;
    assert.deepEqual([n('on_target'), n('safe'), n('wild')], [CONFIG.handMix.onTarget, CONFIG.handMix.safe, CONFIG.handMix.wild], r.id);
  }
});

test('the wild card has no link to the Recipe when one exists', () => {
  const r = someRecipe('medium');
  const hand = buildHand(CARDS, r, table('medium'), { dealtThisRound: new Set() }, makeRng('wild'));
  const wild = byId.get(hand.find(h => h.slot === 'wild').cardId);
  assert.equal(overlap(wild.tags, r.funnyTargets), 0);
  assert.equal(literalScore(wild, r), 0);
});

test('falls back to a random hand when tags are missing', () => {
  const bare = CARDS.map(c => ({ ...c, tags: undefined, funnyTargets: undefined }));
  const r = { ...someRecipe(), funnyTargets: undefined };
  const hand = buildHand(bare, r, table('mild'), { dealtThisRound: new Set() }, makeRng('bare'));
  assert.equal(hand.length, CONFIG.handSize);
  assert.ok(hand.every(h => h.slot === 'random'));
});

test('never deals a card above the table level', () => {
  for (const level of ['mild', 'medium']) {
    for (let i = 0; i < 30; i++) {
      const hand = buildHand(CARDS, someRecipe(level), table(level), { dealtThisRound: new Set() }, makeRng(level + i));
      for (const h of hand) assert.ok(rank(byId.get(h.cardId).level) <= rank(level), `${h.cardId} at a ${level} table`);
    }
  }
});

test('never deals Organic or retired cards', () => {
  const organic = { ...ingredients[0], id: 'org_x', source: 'organic' };
  const retired = { ...ingredients[1], id: 'ic_999998', status: 'retired' };
  assert.equal(eligible(organic, table(), { dealtThisRound: new Set() }), false);
  assert.equal(eligible(retired, table(), { dealtThisRound: new Set() }), false);
  const only = [organic, retired, ...ingredients.slice(2, 40)];
  for (let i = 0; i < 20; i++) {
    const hand = buildHand(only, someRecipe(), table(), { dealtThisRound: new Set() }, makeRng('o' + i));
    assert.ok(!hand.some(h => h.cardId === 'org_x' || h.cardId === 'ic_999998'));
  }
});

test('no card appears in two hands in the same round', () => {
  const round = { dealtThisRound: new Set() }, rng = makeRng('round');
  const all = [];
  for (let s = 0; s < 7; s++) all.push(...buildHand(CARDS, someRecipe(), table('mild'), round, rng).map(h => h.cardId));
  assert.equal(new Set(all).size, all.length);
});

test('the same seed always deals the same hand', () => {
  const deal = () => buildHand(CARDS, someRecipe('spicy'), table(), { dealtThisRound: new Set() }, makeRng('seed-42'));
  assert.deepEqual(deal(), deal());
});

test('cards already played this game are not dealt again', () => {
  const used = ingredients.filter(c => c.level === 'mild').slice(0, 400).map(c => c.id);
  const hand = buildHand(CARDS, someRecipe(), table('mild', used), { dealtThisRound: new Set() }, makeRng('used'));
  for (const h of hand) assert.ok(!used.includes(h.cardId));
});

test('Recipe choices are 3 distinct eligible Recipes', () => {
  for (const level of OFFICIAL_LEVELS) {
    const ids = recipeChoices(CARDS, table(level), makeRng('r' + level));
    assert.equal(ids.length, CONFIG.recipeChoices);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) { const c = byId.get(id); assert.equal(c.type, 'recipe'); assert.ok(rank(c.level) <= rank(level)); }
  }
});

test('isDud: a safe-slot or literal winner is a dud; a funny one is not', () => {
  const r = { id: 'rc_test', literalTags: { subject: ['animal'], tone: ['wholesome'], scale: [], register: [] } };
  const literal = { id: 'ic_a', tags: { subject: ['animal'], tone: ['wholesome'], scale: [], register: [] } };
  const funny = { id: 'ic_b', tags: { subject: ['thing'], tone: ['absurd'], scale: [], register: [] } };
  const known = { ...funny, literalFor: ['rc_test'] };
  assert.equal(isDud(funny, 'safe', r), true);
  assert.equal(isDud(literal, 'on_target', r), true);
  assert.equal(isDud(known, 'wild', r), true);
  assert.equal(isDud(funny, 'on_target', r), false);
});

// ---------------------------------------------------------------- the game (Section 6, with the Section 8.3 hand refresh)
const players = n => Array.from({ length: 8 }, (_, i) => (i < n ? { name: 'P' + i, bot: i > 0, connected: true } : null));
const pickRecipe = g => K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });
function finishRound(g, played) {
  for (const s of g.apprentices) {
    while ((g.subs[s]?.length || 0) < g.need) {
      const id = g.hands[s][0];
      assert.equal(K.applyAction(g, s, { type: 'play', id }), null);
      played?.push(id);
    }
  }
  assert.equal(g.phase, 'judge');
  K.applyAction(g, g.chef, { type: 'kiss', i: 0 });
  K.applyAction(g, g.chef, { type: 'next' });
}

test('the Chef gets 3 Recipe choices and hands are dealt only after the pick', () => {
  const g = K.createGame({ level: 0 }, players(5));
  assert.equal(g.phase, 'recipe');
  assert.equal(g.recipes[g.chef].length, 3);
  assert.equal(Object.keys(g.hands).length, 0);
  pickRecipe(g);
  assert.equal(g.phase, 'play');
  for (const s of g.apprentices) assert.equal(g.hands[s].length, 7);
  const all = g.apprentices.flatMap(s => g.hands[s]);
  assert.equal(new Set(all).size, all.length, 'no card in two hands');
});

test('hands are rebuilt fresh every round and played cards never come back', () => {
  const g = K.createGame({ level: 1, target: 0, length: 0 }, players(4));
  const played = [];
  let last = null;
  for (let round = 0; round < 8; round++) {
    pickRecipe(g);
    const hands = g.apprentices.map(s => [...g.hands[s]]);
    for (const h of hands) {
      assert.equal(h.length, 7);
      for (const id of h) assert.ok(!played.includes(id), 'a played card was dealt again');
    }
    if (last) assert.notDeepEqual(hands, last);
    last = hands;
    finishRound(g, played);
  }
});

test('the old card swap is gone', () => {
  const g = K.createGame({}, players(4));
  pickRecipe(g);
  const s = g.apprentices[0];
  assert.equal(K.applyAction(g, s, { type: 'swap', id: g.hands[s][0] }), 'Unknown move');
});

test('phones never see the Laugh Engine slot labels', () => {
  const g = K.createGame({}, players(4));
  pickRecipe(g);
  for (const s of g.apprentices) assert.doesNotMatch(JSON.stringify(K.viewFor(g, s)), /on_target|"safe"|"wild"/);
});

test('a Mild table only ever deals Mild cards', () => {
  const g = K.createGame({ level: 0, target: 0, length: 0 }, players(8));
  for (let i = 0; i < 5; i++) {
    for (const id of g.recipes[g.chef]) assert.equal(byId.get(id).level, 'mild');
    pickRecipe(g);
    for (const s of g.apprentices) for (const id of g.hands[s]) assert.equal(byId.get(id).level, 'mild');
    finishRound(g);
  }
});
