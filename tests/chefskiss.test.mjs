// Chef's Kiss tests for the master card database and the Laugh Engine's hands (SPEC.md Sections 5.2, 8, 15).
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARDS } from '../js/chefskiss-db.js';
import { CONFIG, OFFICIAL_LEVELS, rank } from '../js/chefskiss-config.js';
import { buildHand, recipeChoices, makeRng, eligible, isDud, targetScore, funnyScore } from '../js/chefskiss-hands.js';
import { validateCard, fromTestDeck, TAXONOMY as TAX } from '../js/chefskiss-schema.js';
import * as K from '../js/chefskiss.js';

const DIMS = Object.keys(TAX);
const active = CARDS.filter(c => c.status === 'active');
const ingredients = active.filter(c => c.type === 'ingredient');
const recipes = active.filter(c => c.type === 'recipe');
const byId = new Map(CARDS.map(c => [c.id, c]));
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

// Al's 17 Oct 2026 blind-test deck (30 Recipe + 150 Ingredient Cards, all Medium): the first test fixture.
const TEST_DECK = JSON.parse(read('../cards.json'));
const FIXTURE = [...TEST_DECK.recipes, ...TEST_DECK.ingredients].map(fromTestDeck);

// ---------------------------------------------------------------- seed data (Sections 5.2 and 15)
test('every card matches the Card schema', () => {
  const ids = new Set();
  for (const c of CARDS) {
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`); ids.add(c.id);
    assert.match(c.id, c.type === 'recipe' ? /^rc_[a-z0-9_]+$/i : /^ic_[a-z0-9_]+$/i);
    assert.equal(c.source, 'official');
    assert.deepEqual(validateCard(c), [], c.id);
  }
});

test("Al's test deck (cards.json) passes the Card schema", () => {
  assert.equal(TEST_DECK.recipes.length, 30);
  assert.equal(TEST_DECK.ingredients.length, 150);
  for (const c of FIXTURE) assert.deepEqual(validateCard(c), [], c.id);
});

test('family deck cards are only Mild, Medium or Hot (never Spicy or Hellfire Scorpion)', () => {
  for (const c of active) assert.ok(OFFICIAL_LEVELS.includes(c.level), `${c.id} is ${c.level}`);
});

test('at least 150 Recipe Cards and 600 Ingredient Cards per level', () => {
  for (const level of OFFICIAL_LEVELS) {
    assert.ok(recipes.filter(c => c.level === level).length >= 150, `${level} recipes`);
    assert.ok(ingredients.filter(c => c.level === level).length >= 600, `${level} ingredients`);
  }
});

// SPEC.md Section 15, approved 18 Oct 2026. Al's finished decks meet these; they aren't in the repo yet.
test('200 Recipe Cards and 800 Ingredient Cards per level', { todo: "waiting for Al's 18 Oct 2026 decks" }, () => {
  for (const level of OFFICIAL_LEVELS) {
    assert.ok(recipes.filter(c => c.level === level).length >= 200, `${level} recipes`);
    assert.ok(ingredients.filter(c => c.level === level).length >= 800, `${level} ingredients`);
  }
});

test('every card has 1–2 tags on all 6 axes (CARD_RULES.md Section 3)', { todo: "waiting for Al's 18 Oct 2026 decks" }, () => {
  for (const c of active) for (const d of DIMS) assert.ok(c.tags[d].length >= 1 && c.tags[d].length <= 2, `${c.id} ${d}`);
});

test('every card is tagged and every Recipe has funnyTargetCombos and literalTags', () => {
  for (const c of active) {
    for (const d of ['subject', 'tone', 'scale', 'register']) assert.ok(c.tags[d].length, `${c.id} has no ${d} tag`);
    if (c.type === 'recipe') {
      assert.ok(c.funnyTargetCombos.length >= 1, `${c.id} funnyTargetCombos`);
      assert.ok(DIMS.some(d => c.literalTags[d]?.length), `${c.id} literalTags`);
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

test('old banned titles and the banned two-letter term are not in any card', () => {
  for (const c of active) {
    assert.doesNotMatch(c.text, /Trash It|Toss It|Super-Duper|MyCard|Simply Silly|Easy Peasy|Double Vision/i);
    assert.doesNotMatch(c.text, /\bA[I]\b/);
  }
});

test("Chef's Kiss code and screens say Si, never the banned two-letter term", () => {
  for (const file of ['chefskiss.js', 'table-chefskiss.js', 'play-chefskiss.js', 'laugh-si.js', 'laugh-engine.js', 'chefskiss-hands.js', 'chefskiss-config.js', 'chefskiss-schema.js']) {
    assert.doesNotMatch(read('../js/' + file), /\bA[I]\b/, file);
  }
  assert.doesNotMatch(read('../css/chefskiss.css'), /\bA[I]\b/);
});

// ---------------------------------------------------------------- hands (Section 8)
const table = (level = 'hot', used = []) => ({ level, usedCardIds: new Set(used) });
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

test('hands are 6 on-target + 1 random when the data is there, and nothing else', () => {
  assert.deepEqual(CONFIG.handMix, { onTarget: 6, random: 1 });
  for (const r of recipes.slice(0, 60)) {
    const hand = buildHand(CARDS, r, table(r.level), { dealtThisRound: new Set() }, makeRng(r.id));
    const n = s => hand.filter(h => h.slot === s).length;
    assert.deepEqual([n('on_target'), n('random')], [6, 1], r.id);
  }
});

test('no safe or wild slot code is left in the engine', () => {
  assert.doesNotMatch(read('../js/chefskiss-hands.js'), /safe|wild/);
  assert.doesNotMatch(read('../js/chefskiss-config.js'), /safe:|wild:/);
});

test("buildHand over Al's test deck returns 7 cards per Recipe, aimed at the combos", () => {
  const deck = FIXTURE.filter(c => c.type === 'ingredient');
  for (const r of FIXTURE.filter(c => c.type === 'recipe')) {
    const hand = buildHand(deck, r, table('medium'), { dealtThisRound: new Set() }, makeRng(r.id));
    assert.equal(hand.length, 7, r.id);
    assert.equal(new Set(hand.map(h => h.cardId)).size, 7);
    for (const h of hand) assert.deepEqual(validateCard(deck.find(c => c.id === h.cardId)), []);
    // The on-target cards should match the Recipe's combos better than the deck does on average.
    const on = hand.filter(h => h.slot === 'on_target').map(h => targetScore(deck.find(c => c.id === h.cardId), r));
    const avg = deck.reduce((t, c) => t + targetScore(c, r), 0) / deck.length;
    assert.ok(on.reduce((a, b) => a + b, 0) / on.length >= avg, `${r.id} on-target cards aim at the combos`);
  }
});

test('the funny score uses the best single combo, not bits of several', () => {
  const r = { id: 'rc_t', funnyTargetCombos: [{ subject: ['animal'], register: ['fancy'] }, { scale: ['cosmic'], tone: ['gross_mild'] }], literalTags: {} };
  const whole = { id: 'ic_1', tags: { subject: ['animal'], register: ['fancy'] } };
  const bits = { id: 'ic_2', tags: { subject: ['animal'], scale: ['cosmic'] } };
  assert.equal(targetScore(whole, r), 2);
  assert.equal(targetScore(bits, r), 1);
  const zero = () => 0;
  assert.ok(funnyScore(whole, r, zero) > funnyScore(bits, r, zero));
});

test('falls back to a random hand when tags or combos are missing', () => {
  const bare = CARDS.map(c => ({ ...c, tags: undefined, funnyTargetCombos: undefined }));
  const r = { ...someRecipe(), funnyTargetCombos: undefined };
  const hand = buildHand(bare, r, table('mild'), { dealtThisRound: new Set() }, makeRng('bare'));
  assert.equal(hand.length, CONFIG.handSize);
  assert.ok(hand.every(h => h.slot === 'random'));
});

test('one table, one deck: a table deals only its own level, never a lower or higher one', () => {
  for (const level of OFFICIAL_LEVELS) {
    for (let i = 0; i < 30; i++) {
      const hand = buildHand(CARDS, someRecipe(level), table(level), { dealtThisRound: new Set() }, makeRng(level + i));
      for (const h of hand) assert.equal(byId.get(h.cardId).level, level, `${h.cardId} at a ${level} table`);
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
  const deal = () => buildHand(CARDS, someRecipe('hot'), table(), { dealtThisRound: new Set() }, makeRng('seed-42'));
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
    for (const id of ids) { const c = byId.get(id); assert.equal(c.type, 'recipe'); assert.equal(c.level, level); }
  }
});

test('isDud uses only the literal checks, never the slot', () => {
  const r = { id: 'rc_test', literalTags: { subject: ['animal'], tone: ['wholesome'] } };
  const literal = { id: 'ic_a', tags: { subject: ['animal'], tone: ['wholesome'] } };
  const funny = { id: 'ic_b', tags: { subject: ['thing'], tone: ['absurd'] } };
  const known = { ...funny, literalFor: ['rc_test'] };
  assert.equal(isDud.length, 2, 'isDud takes no slot');
  assert.equal(isDud(literal, r), true);
  assert.equal(isDud(known, r), true);
  assert.equal(isDud(funny, r), false);
});

// ---------------------------------------------------------------- the game (Section 6, with the Section 8.3 hand refresh)
const players = n => Array.from({ length: 8 }, (_, i) => (i < n ? { name: 'P' + i, bot: i > 0, connected: true } : null));
const pickRecipe = g => K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });
function finishRound(g, played) {
  for (const s of g.apprentices) {
    if (!g.subs[s]?.length) {
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
  for (const s of g.apprentices) assert.doesNotMatch(JSON.stringify(K.viewFor(g, s)), /on_target|"random"/);
});

// Al's 19 Oct 2026 playtest note: one Ingredient Card per Apprentice per round, at any table size.
test('Double Vision is gone: every round asks each Apprentice for exactly one card, at 3, 4 and 6 players', () => {
  for (const n of [3, 4, 6]) {
    const g = K.createGame({ level: 0, target: 0, length: 0 }, players(n));
    for (let round = 0; round < 4; round++) {
      pickRecipe(g);
      const v = K.viewFor(g, g.apprentices[0]);
      assert.equal(v.expected, g.apprentices.length, 'one card per Apprentice');
      assert.equal(v.need, undefined, 'no two-card rounds');
      const s = g.apprentices[0];
      assert.equal(K.applyAction(g, s, { type: 'play', id: g.hands[s][0] }), null);
      assert.equal(K.applyAction(g, s, { type: 'play', id: g.hands[s][0] }), 'You already played');
      finishRound(g);
    }
  }
  for (const file of ['chefskiss.js', 'table-chefskiss.js', 'play-chefskiss.js']) assert.doesNotMatch(read('../js/' + file), /Double Vision|g\.need|v\.need/, file);
});

test('Chef’s Kiss fills seats with bots up to 4 players', async () => {
  const { GAMES } = await import('../js/games.js');
  assert.equal(GAMES.chefskiss.fillBots, 4);
  assert.match(read('../js/table.js'), /function fillWithBots\(\)/);
});

test('every level, 3 and 6 seats: 100% of dealt and played cards come from that level’s deck', () => {
  for (const [i, level] of OFFICIAL_LEVELS.entries()) {
    for (const n of [3, 6]) {
      const g = K.createGame({ level: i, target: 0, length: 0 }, players(n));
      for (let round = 0; round < 6; round++) {
        for (const id of g.recipes[g.chef]) assert.equal(byId.get(id).level, level, 'Recipe choice');
        pickRecipe(g);
        for (const s of g.apprentices) for (const id of g.hands[s]) assert.equal(byId.get(id).level, level, 'hand');
        const played = [];
        finishRound(g, played);
        for (const id of played) assert.equal(byId.get(id).level, level, 'played');
      }
    }
  }
});

test('the high school level is called Hot', () => {
  assert.deepEqual(OFFICIAL_LEVELS, ['mild', 'medium', 'hot']);
  assert.match(read('../js/table-chefskiss.js'), /LEVEL_LABEL/);
  for (const file of ['chefskiss-config.js', 'table-chefskiss.js', 'play-chefskiss.js']) assert.doesNotMatch(read('../js/' + file), /Spicy \(high school\)/);
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
