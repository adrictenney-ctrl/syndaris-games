// Al's Time Capsule decks (21 Nov 2026): six decades, 500 cards each, heat per card, 499 Bread each.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CARDS } from '../js/chefskiss-db.js';
import { CAPSULES, DECADES, DECKS, tableDecks, CAPSULE_PRICE, cleanOwned } from '../js/chefskiss-decks.js';
import { recipeChoices, makeRng } from '../js/chefskiss-hands.js';
import * as K from '../js/chefskiss.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const DIR = new URL('../content/chefskiss/timecapsule/', import.meta.url);
const LEVELS = ['mild', 'medium', 'hot'];
const byId = new Map(CARDS.map(c => [c.id, c]));
const players = [0, 1, 2, 3, 4, 5].map(i => ({ name: 'P' + i }));

test('six Time Capsule decks, each 100 + 400 with Al\'s heat split, all live and unique', () => {
  assert.deepEqual(DECADES, ['2010s', '2000s', '1990s', '1980s', '1970s', '1960s']);
  assert.equal(readdirSync(DIR).filter(f => f.endsWith('.json')).length, 6);
  const ids = new Set();
  for (const id of CAPSULES) {
    const cards = CARDS.filter(c => c.deckIds?.includes(id));
    const n = (type, level) => cards.filter(c => c.type === type && c.level === level).length;
    assert.deepEqual(LEVELS.map(l => n('recipe', l)), [20, 60, 20], id);
    assert.deepEqual(LEVELS.map(l => n('ingredient', l)), [80, 240, 80], id);
    for (const c of cards) { assert.equal(c.status, 'active'); assert.equal(c.decade, DECKS[id].decade); assert.ok(!ids.has(c.id)); ids.add(c.id); }
  }
  assert.equal(ids.size, 3000);
  assert.equal(new Set(CARDS.map(c => c.id)).size, CARDS.length, 'no id is used twice in the whole database');
});

test('each Time Capsule costs 499 Bread and is unlocked on its own', () => {
  assert.equal(CAPSULE_PRICE, 499);
  for (const id of CAPSULES) assert.equal(DECKS[id].bread, 499);
  assert.match(read('../js/dough.js'), /\[`deck_timecapsule_\$\{d\}`, \{ name: `Time Capsule: \$\{d\}`, price: 499, currency: 'bread' \}\]/);
  assert.deepEqual(cleanOwned(['deck_timecapsule_1990s', 'deck_nope']), ['deck_timecapsule_1990s']);
  // owning one decade doesn't unlock another
  assert.deepEqual(tableDecks('medium', 'base', 'mix', ['deck_timecapsule_1990s']), ['deck_medium_base', 'deck_timecapsule_1990s']);
  assert.deepEqual(tableDecks('medium', 'base', 'mix', []), ['deck_medium_base']);
  assert.deepEqual(tableDecks('medium', 'base', 'deck_timecapsule_1980s', ['deck_timecapsule_1990s']), ['deck_medium_base', 'deck_timecapsule_1990s']);
  // a decade alone: Medium only (Mild and Hot are too thin), and only when owned
  assert.deepEqual(tableDecks('medium', 'base', 'deck_timecapsule_1990s', ['deck_timecapsule_1990s']), ['deck_timecapsule_1990s']);
  assert.deepEqual(tableDecks('mild', 'base', 'deck_timecapsule_1990s', ['deck_timecapsule_1990s']), ['deck_mild_base', 'deck_timecapsule_1990s']);
  // off: never a Time Capsule card
  assert.deepEqual(tableDecks('hot', 'mixed', 'off', ['deck_hot_exp1', ...CAPSULES]), ['deck_hot_base', 'deck_hot_exp1']);
});

// Al's checks: games at each level, with the Time Capsules off, mixed in and alone.
function play(level, decks, rounds = 6) {
  const g = K.createGame({ level: LEVELS.indexOf(level), decks, target: 0, length: 0 }, players);
  const seen = [];
  for (let r = 0; r < rounds && g.phase !== 'over'; r++) {
    seen.push(...g.recipes[g.chef]);
    K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });
    for (const s of g.apprentices) { seen.push(...g.hands[s]); assert.equal(g.hands[s].length, 5, 'a hand is 5 cards'); }
    for (const s of g.apprentices) K.applyAction(g, s, { type: 'play', id: g.hands[s][0] });
    K.applyAction(g, g.chef, { type: 'kiss', i: 0 });
    K.applyAction(g, g.chef, { type: 'next' });
  }
  return seen.map(id => byId.get(id)).filter(Boolean);
}
test('dealing: every card matches the table level; off never deals a Time Capsule card; mixed deals both; alone deals only that decade', () => {
  for (const level of LEVELS) {
    const off = play(level, tableDecks(level, 'base', 'off', CAPSULES));
    assert.ok(off.every(c => c.level === level && !c.decade), level + ' off');
    const mix = play(level, tableDecks(level, 'base', 'mix', CAPSULES), 10);
    assert.ok(mix.every(c => c.level === level), level + ' mixed: level');
    assert.ok(mix.some(c => c.decade) && mix.some(c => !c.decade), level + ' mixed deals both');
  }
  const alone = play('medium', tableDecks('medium', 'base', 'deck_timecapsule_1970s', CAPSULES));
  assert.ok(alone.every(c => c.level === 'medium' && c.decade === '1970s'), '1970s night');
});

test('Al\'s decade fix: a decade filter applies to the Recipe choices too', () => {
  const table = { level: 'medium', decks: ['deck_medium_base', ...CAPSULES], decadeFilter: ['1960s'], usedCardIds: new Set() };
  for (let i = 0; i < 20; i++) for (const id of recipeChoices(CARDS, table, makeRng('r' + i))) assert.equal(byId.get(id).decade, '1960s');
});

test('the lobby has a Time Capsule setting and the Shop sells the six decks for Bread', () => {
  assert.match(read('../js/table-chefskiss.js'), /Time Capsule <select data-set="capsule">/);
  assert.match(read('../js/table-chefskiss.js'), /decks: tableDecks\(level, deckMode, settings\.capsule, owned\)/);
  assert.match(read('../js/bread.js'), /Chef's Kiss Time Capsules[\s\S]*499 Bread/);
});
