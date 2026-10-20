// Tests for Si Spice It Up (SPEC.md Section 10.1) and Parent Controls (blocked games and words).
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spiceItUp, coreOf, TECHNIQUES, RECIPE_TECHNIQUES } from '../js/spice.js';
import { makeBlocker, familySafe, hashPin } from '../js/parental.js';
import { makeRng } from '../js/chefskiss-hands.js';
import * as K from '../js/chefskiss.js';
import { CARDS } from '../js/chefskiss-db.js';

const IDEAS = ['a dog', 'homework', 'pizza', 'Grandma', 'Uncle Bob dancing', 'socks', 'my little brother', 'a sock', 'the principal', 'cold spaghetti'];

// ---------------------------------------------------------------- Spice It Up
test('Spice It Up returns at most 3 suggestions, each with a different technique label', () => {
  for (const idea of IDEAS) for (const level of ['mild', 'medium', 'hot']) {
    const out = spiceItUp(idea, 'ingredient', level, null, makeRng(idea + level));
    assert.ok(out.length <= 3 && out.length >= 1, idea);
    assert.equal(new Set(out.map(x => x.technique)).size, out.length, 'distinct techniques');
    for (const x of out) assert.ok(TECHNIQUES.includes(x.technique), x.technique);
  }
});

test('every suggestion keeps the player’s own idea in it', () => {
  for (const idea of IDEAS) {
    const core = coreOf(idea).bare.toLowerCase();
    for (const x of spiceItUp(idea, 'ingredient', 'hot', null, makeRng(idea))) assert.ok(x.text.toLowerCase().includes(core), `${idea} → ${x.text}`);
  }
});

test('suggestions carry tags on all 6 axes and fit on a card', () => {
  for (const x of spiceItUp('a raccoon', 'ingredient', 'medium', null, makeRng('t'))) {
    for (const axis of ['subject', 'tone', 'scale', 'register', 'violation', 'status']) assert.ok(x.tags[axis]?.length >= 1 && x.tags[axis].length <= 2, axis);
    assert.ok(x.text.length <= 120);
  }
});

test('Recipe ideas get Recipe techniques', () => {
  const out = spiceItUp('things at a wedding', 'recipe', 'medium', null, makeRng('r'));
  assert.ok(out.length >= 1);
  for (const x of out) assert.ok(RECIPE_TECHNIQUES.includes(x.technique));
});

test('nothing to spice gives an empty list (Keep mine only), and it never throws', () => {
  assert.deepEqual(spiceItUp('', 'ingredient'), []);
  assert.deepEqual(spiceItUp('   ', 'ingredient'), []);
  assert.deepEqual(spiceItUp(null, 'ingredient'), []);
  assert.deepEqual(spiceItUp({ weird: true }, 'ingredient'), []);
});

test('Spice It Up stays family-friendly: the Si never raises the heat', () => {
  const a = spiceItUp('a dog', 'ingredient', 'medium', null, makeRng('h'));
  const b = spiceItUp('a dog', 'ingredient', 'medium', 'hellfire', makeRng('h'));
  assert.deepEqual(a, b, 'an adult deck heat changes nothing');
});

test('Spice It Up runs on the phone and says Si, never the banned two-letter term', () => {
  const src = readFileSync(new URL('../js/spice.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon/, 'no network calls');
  assert.doesNotMatch(src, /\bA[I]\b/);
  for (const x of IDEAS.flatMap(i => spiceItUp(i, 'ingredient', 'hot', null, makeRng(i)))) assert.doesNotMatch(x.text, /\bA[I]\b/);
});

// ---------------------------------------------------------------- Parent Controls: blocked words
test('blocked words match whole words and simple plurals, not parts of other words', () => {
  const b = makeBlocker(['poker', 'toot']);
  assert.equal(b('Poker night'), true);
  assert.equal(b('two pokers'), true);
  assert.equal(b('A loud toot!'), true);
  assert.equal(b('A sore tooth'), false);
  assert.equal(b('pokerface'), false);
  assert.equal(makeBlocker([])('anything'), false);
});

test('familySafe leaves out blocked entries in any shape of list', () => {
  assert.deepEqual(familySafe(['A loud toot', 'A dog', 'Toots'], ['toot']), ['A dog']);
  assert.deepEqual(familySafe([{ word: 'Valentine', ban: ['love', 'heart'] }, { word: 'Sunscreen', ban: ['beach'] }], ['love']), [{ word: 'Sunscreen', ban: ['beach'] }]);
  assert.deepEqual(familySafe(['a', 'b'], []), ['a', 'b']);
});

test("Chef's Kiss never deals a card with a blocked word", () => {
  const players = Array.from({ length: 8 }, (_, i) => (i < 6 ? { name: 'P' + i, bot: i > 0, connected: true } : null));
  const words = ['dog', 'pizza', 'grandma', 'school'];
  const blocked = makeBlocker(words);
  const g = K.createGame({ level: 2, target: 0, length: 0 }, players);
  g.block = words;                       // what the table reads from Parent Controls on this screen
  for (let round = 0; round < 6; round++) {
    // The Chef's first Recipe choices were dealt before the words were set; deal again with them.
    if (round === 0) { K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] }); }
    else {
      for (const id of g.recipes[g.chef]) assert.equal(blocked(CARDS.find(c => c.id === id).text), false, 'recipe');
      K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });
    }
    for (const s of g.apprentices) for (const id of g.hands[s]) assert.equal(blocked(CARDS.find(c => c.id === id).text), false, CARDS.find(c => c.id === id).text);
    for (const s of g.apprentices) K.applyAction(g, s, { type: 'play', id: g.hands[s][0] });
    K.applyAction(g, g.chef, { type: 'kiss', i: 0 });
    K.applyAction(g, g.chef, { type: 'next' });
  }
});

test("a player's own card with a blocked word can't come to the table", async () => {
  const { makeCustomCard } = await import('../js/ck-custom.js');
  const players = Array.from({ length: 8 }, (_, i) => (i < 4 ? { name: 'P' + i, bot: false, connected: true } : null));
  const g = K.createGame({ level: 0 }, players);
  g.block = ['toot'];
  const card = t => makeCustomCard({ type: 'snack', text: t, level: 'mild' });
  assert.equal(K.applyAction(g, 1, { type: 'custom', card: card('A very loud toot') }), "That card can't be played at this table");
  assert.equal(K.applyAction(g, 1, { type: 'custom', card: card('A very loud trumpet') }), null);
});

test('the blocked words never reach a phone', () => {
  const players = Array.from({ length: 8 }, (_, i) => (i < 4 ? { name: 'P' + i, bot: false, connected: true } : null));
  const g = K.createGame({ level: 0 }, players);
  g.block = ['secretword'];
  K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });
  for (let s = 0; s < 4; s++) assert.doesNotMatch(JSON.stringify(K.viewFor(g, s)), /secretword/);
});

test('the parent code is stored only as a hash, tied to the account', async () => {
  const h = await hashPin('uid-1', '2468');
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.doesNotMatch(h, /2468/);
  assert.equal(await hashPin('uid-1', '2468'), h);
  assert.notEqual(await hashPin('uid-2', '2468'), h);
  assert.notEqual(await hashPin('uid-1', '2469'), h);
});

test('every word list that games draw from goes through the Parent Controls filter', () => {
  const read = f => readFileSync(new URL('../js/' + f, import.meta.url), 'utf8');
  for (const f of ['wrongnumber-cards.js', 'talk-data.js', 'dontsay-cards.js', 'sketch-words.js', 'scribble-words.js']) assert.match(read(f), /familySafe\(/, f);
  assert.match(read('chefskiss-hands.js'), /table\.blocked/);
});
