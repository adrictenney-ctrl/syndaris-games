// Acceptance tests for Chef's Kiss customizable cards (chefskiss_customizable_cards_spec_10-19-26.md, section 11).
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { makeCustomCard, cardProblem, LIMITS, SNACKS_PER_HAND, familyFriendly, FAMILY_MSG } from '../js/ck-custom.js';
import { seasonCard, checkCard, readRequest, tidyOptions, buildPrompt } from '../worker/season.js';
import * as K from '../js/chefskiss.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const players = n => Array.from({ length: 8 }, (_, i) => (i < n ? { name: 'P' + i, bot: false, connected: true } : null));
const sig = (text, level = 'mild', types = ['thing']) => makeCustomCard({ type: 'signature_recipe', text, answerTypes: types, level, ownerId: 'p1' });
const snack = (text, level = 'mild', flavor = null) => makeCustomCard({ type: 'snack', text, flavor, level, ownerId: 'p1' });

// A stand-in for the model service: answers with whatever `reply` returns for each call.
const fakeFetch = reply => async (url, init) => {
  const prompt = JSON.parse(init.body).contents[0].parts[0].text;
  return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: reply(prompt) }] } }] }) };
};
const ENV = { GEMINI_API_KEY: 'test-key-not-real', GEMMA_MODEL: 'gemma-3-27b-it' };

// 1
test('1. a Signature Recipe with text and an answer type saves as signature_recipe at the table level', () => {
  const c = sig('The worst thing to find in your lunchbox', 'medium', ['thing', 'food']);
  assert.equal(c.type, 'signature_recipe');
  assert.equal(c.level, 'medium');
  assert.deepEqual(c.answerTypes, ['thing', 'food']);
  assert.equal(c.flavor, null);
  assert.equal(c.status, 'private');
  assert.equal(c.seasoned, false);
  assert.match(c.id, /^cc_/);
});

// 2
test('2. no answer type, a prompt over 80 or an answer over 60 characters is rejected', () => {
  assert.throws(() => sig('A fine prompt', 'mild', []), /Pick at least one answer type/);
  assert.throws(() => sig('x'.repeat(LIMITS.signature_recipe + 1)), /80 characters/);
  assert.throws(() => snack('x'.repeat(LIMITS.snack + 1)), /60 characters/);
  assert.doesNotThrow(() => sig('x'.repeat(80)));
  assert.doesNotThrow(() => snack('x'.repeat(60)));
});

// 3
test('3. a Snack card saves with the flavor line optional and no answer types', () => {
  const a = snack('A kitten who judges your life choices');
  assert.equal(a.flavor, null);
  assert.deepEqual(a.answerTypes, []);
  const b = snack('A kitten who judges your life choices', 'mild', 'She’s not mad. Just disappointed.');
  assert.equal(b.flavor, 'She’s not mad. Just disappointed.');
  assert.deepEqual(makeCustomCard({ type: 'snack', text: 'A sock', answerTypes: ['thing'], level: 'hot' }).answerTypes, []);
});

test('there are no Chef cards: only signature_recipe and snack exist', () => {
  assert.throws(() => makeCustomCard({ type: 'chef', text: 'Head chef', level: 'mild' }));
  for (const f of ['../js/ck-custom.js', '../js/ck-workshop.js', '../worker/season.js']) assert.doesNotMatch(read(f), /type:\s*['"]chef|chef_card|ChefCard/i, f);
});

// 4
test('4. Add salt and pepper returns exactly 3 options within the limits (model mocked)', async () => {
  const reply = () => JSON.stringify({ options: [
    { text: 'A kitten who files a formal complaint about your life choices and also your shoes', flavor: 'She has notes.' },
    { text: 'A kitten with a clipboard', flavor: null },
    { text: 'A kitten who judges your life choices, professionally', flavor: 'Certified.' },
    { text: 'One option too many', flavor: null },
  ] });
  const card = readRequest({ type: 'snack', level: 'mild', text: 'A kitten who judges your life choices', flavor: null }).card;
  const { options } = await seasonCard(card, ENV, fakeFetch(p => (p.includes('Reply with only JSON') ? '{"ok": true}' : reply())));
  assert.equal(options.length, 3);
  for (const o of options) { assert.ok(o.text.length >= 1 && o.text.length <= LIMITS.snack, o.text); if (o.flavor) assert.ok(o.flavor.length <= LIMITS.flavor); }
});

test('4. the prompt keeps the player’s idea and the level; Recipes get 80 characters, Snacks 60', () => {
  const p = buildPrompt({ type: 'signature_recipe', level: 'hot', text: 'The worst thing to say at prom', flavor: null, answerTypes: ['said'] });
  assert.match(p, /Table level: hot/);
  assert.match(p, /text="The worst thing to say at prom"/);
  assert.match(p, /exactly 3 different options/);
  // Too long: discarded (and asked again), never cut off mid-joke.
  const kept = tidyOptions([{ text: 'x '.repeat(70) }, { text: 'A short one' }], { type: 'signature_recipe', text: 'y' });
  assert.deepEqual(kept.map(o => o.text), ['A short one']);
});

test('4. nothing is saved until the player picks Use this or Keep mine', () => {
  const src = read('../js/ck-workshop.js');
  // The only places cards are written: save() (Save card, Use this, Keep mine) and share().
  const writes = [...src.matchAll(/saveCards\(/g)].length;
  assert.equal(writes, 3, 'saveCards is called only from save, share and delete');
  assert.match(src, /async function season\(\)[\s\S]*?\n {2}\}/);
  const season = src.match(/async function season\(\)[\s\S]*?\n {2}\}/)[0];
  assert.doesNotMatch(season, /saveCards|save\(/);
});

test('4. if the service fails twice, the player gets the error screen (no options)', async () => {
  const card = readRequest({ type: 'snack', level: 'mild', text: 'A sock' }).card;
  await assert.rejects(seasonCard(card, ENV, async () => ({ ok: false, status: 500 })), /Couldn’t add salt and pepper/);
});

// 5
test('5. no player-facing text in the builder mentions the service behind it', () => {
  const code = src => src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const banned = /\b(gemma|ai|llm|si|model)\b/i;
  const builder = code(read('../js/ck-workshop.js'));
  for (const s of builder.match(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g) || []) assert.doesNotMatch(s, banned, s);
  // The table lobby's helper status, which players see too.
  const lobby = read('../js/table-chefskiss.js').match(/const SI_TEXT = \{[^\n]*\}/)[0];
  for (const s of lobby.match(/'[^']*'/g)) assert.doesNotMatch(s.replace(/^'(off|nogpu|needmodel|downloading|loading|ready|error)'$/, ''), banned, s);
  assert.match(builder, /Add salt and pepper/);
});

// 6
test('6. the model key is never in client code or the repo', () => {
  const files = [];
  const walk = dir => { for (const n of readdirSync(new URL(dir, import.meta.url))) { if (/^(node_modules|\.git|tv-app)$/.test(n)) continue; const p = dir + n; statSync(new URL(p, import.meta.url)).isDirectory() ? walk(p + '/') : /\.(js|mjs|cjs|html|json|jsonc|md|txt|sh)$/.test(n) && files.push(p); } };
  walk('../');
  for (const f of files) {
    const src = read(f);
    // A Google API key looks like AIza…; the only one allowed is Firebase's public web config.
    if (!f.endsWith('js/firebase.js')) assert.doesNotMatch(src, /AIza[0-9A-Za-z_-]{30,}/, f);
    if (!f.startsWith('../tests/')) assert.doesNotMatch(src, /GEMINI_API_KEY\s*[:=]\s*['"][^'"]+['"]/, f);
  }
  for (const f of files.filter(f => f.startsWith('../js/'))) assert.doesNotMatch(read(f), /generativelanguage\.googleapis\.com/, f);
  assert.match(read('../worker/season.js'), /env\.GEMINI_API_KEY/);
});

// 7
test('7. custom cards are dealt only at tables of their own level', () => {
  for (const [lv, level] of ['mild', 'medium', 'hot'].entries()) {
    const g = K.createGame({ level: lv, target: 0, length: 0 }, players(4));
    for (const other of ['mild', 'medium', 'hot'].filter(x => x !== level)) {
      assert.match(K.applyAction(g, 1, { type: 'custom', card: snack('A sneaky snack', other) }), /tables/);
      assert.match(K.applyAction(g, 1, { type: 'custom', card: sig('A sneaky prompt', other) }), /tables/);
    }
    assert.equal(Object.keys(g.custom).length, 0);
    assert.equal(K.applyAction(g, 1, { type: 'custom', card: snack('A level snack', level) }), null);
  }
});

// 8
test('8. House Recipes: Mix in offers at most 1 Signature Recipe of 3; Replace puts them first', () => {
  const mix = K.createGame({ level: 0, houseRecipes: 1, target: 0, length: 0 }, players(4));
  for (let i = 0; i < 5; i++) K.applyAction(mix, 1, { type: 'custom', card: sig('My prompt number ' + i) });
  for (let round = 0; round < 5; round++) {
    K.applyAction(mix, mix.chef, { type: 'next' });
    const ids = (mix.recipes[mix.chef] || []);
    assert.ok(ids.filter(id => id.startsWith('cc_')).length <= 1);
    K.applyAction(mix, mix.chef, { type: 'recipe', id: ids[ids.length - 1] });
    for (const s of mix.apprentices) K.applyAction(mix, s, { type: 'play', id: mix.hands[s][0] });
    K.applyAction(mix, mix.chef, { type: 'kiss', i: 0 }); K.applyAction(mix, mix.chef, { type: 'next' });
  }
  const rep = K.createGame({ level: 0, houseRecipes: 2, target: 0, length: 0 }, players(4));
  for (let i = 0; i < 2; i++) K.applyAction(rep, 1, { type: 'custom', card: sig('Replace prompt ' + i) });
  K.applyAction(rep, rep.chef, { type: 'recipe', id: rep.recipes[rep.chef][2] });   // finish round 1 (dealt before the cards came)
  for (const s of rep.apprentices) K.applyAction(rep, s, { type: 'play', id: rep.hands[s][0] });
  K.applyAction(rep, rep.chef, { type: 'kiss', i: 0 }); K.applyAction(rep, rep.chef, { type: 'next' });
  const ids = rep.recipes[rep.chef];
  assert.equal(ids.length, 3);
  assert.ok(ids[0].startsWith('cc_') && ids[1].startsWith('cc_'), 'Signature Recipes first');
  assert.ok(!ids[2].startsWith('cc_'), 'standard Recipes fill in');
  const off = K.createGame({ level: 0, houseRecipes: 0 }, players(4));
  K.applyAction(off, 1, { type: 'custom', card: sig('Off prompt') });
  K.applyAction(off, off.chef, { type: 'recipe', id: off.recipes[off.chef][0] });
  for (const s of off.apprentices) K.applyAction(off, s, { type: 'play', id: off.hands[s][0] });
  K.applyAction(off, off.chef, { type: 'kiss', i: 0 }); K.applyAction(off, off.chef, { type: 'next' });
  assert.ok(off.recipes[off.chef].every(id => !id.startsWith('cc_')));
});

test('a Signature Recipe deals cards that fit its answer types', () => {
  const g = K.createGame({ level: 0, houseRecipes: 2, target: 0, length: 0 }, players(4));
  const c = sig('The best thing to eat at a sleepover', 'mild', ['food']);
  K.applyAction(g, 1, { type: 'custom', card: c });
  K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });
  for (const s of g.apprentices) K.applyAction(g, s, { type: 'play', id: g.hands[s][0] });
  K.applyAction(g, g.chef, { type: 'kiss', i: 0 }); K.applyAction(g, g.chef, { type: 'next' });
  assert.equal(g.recipes[g.chef][0], c.id);
  K.applyAction(g, g.chef, { type: 'recipe', id: c.id });
  const all = g.apprentices.flatMap(s => g.hands[s]).filter(id => !id.startsWith('cc_')).map(id => K.record(id));
  const food = all.filter(r => r.tags.subject.includes('food')).length;
  assert.ok(food >= all.length / 2, `${food} of ${all.length} cards are food`);
});

// 9
test('9. no hand has more than 2 Snack cards, and every Apprentice plays exactly one card', () => {
  const g = K.createGame({ level: 0, target: 0, length: 0 }, players(4));
  for (let i = 0; i < 6; i++) for (const s of [1, 2]) assert.equal(K.applyAction(g, s, { type: 'custom', card: snack(`Snack ${s}-${i}`) }), null);
  for (let round = 0; round < 6; round++) {
    K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });
    for (const s of g.apprentices) {
      const snacks = g.hands[s].filter(id => id.startsWith('cc_'));
      assert.ok(snacks.length <= SNACKS_PER_HAND, `${snacks.length} snacks`);
      for (const id of snacks) assert.equal(g.custom[id].seat, s, 'only your own snacks');
      assert.equal(g.hands[s].length, 7);
    }
    for (const s of g.apprentices) {
      assert.equal(K.applyAction(g, s, { type: 'play', id: g.hands[s][0] }), null);
      assert.notEqual(K.applyAction(g, s, { type: 'play', id: g.hands[s][0] }), null, 'a second card is refused');
    }
    K.applyAction(g, g.chef, { type: 'kiss', i: 0 }); K.applyAction(g, g.chef, { type: 'next' });
  }
});

// 10
test('10. a card that fails the content check is not saved, and a failing option is never shown', async () => {
  assert.equal(familyFriendly('A drunk pirate'), false);
  assert.throws(() => snack('A drunk pirate'), new RegExp(FAMILY_MSG.slice(0, 20)));
  assert.equal(cardProblem({ type: 'snack', text: 'A kitten', flavor: 'Totally wasted beer' }), FAMILY_MSG);
  const g = K.createGame({ level: 0 }, players(4));
  assert.equal(K.applyAction(g, 1, { type: 'custom', card: { ...snack('A fine card'), text: 'A drunk pirate' } }), FAMILY_MSG);
  // The model's own verdict also counts.
  const verdict = fakeFetch(p => (p.includes('Reply with only JSON') ? (p.includes('Grumpy') ? '{"ok": false}' : '{"ok": true}') : ''));
  assert.deepEqual(await checkCard({ type: 'snack', level: 'mild', text: 'A Grumpy gremlin', flavor: null, answerTypes: [] }, ENV, verdict), { ok: false, message: FAMILY_MSG });
  // Options: one fails the word list, one fails the verdict; neither comes back.
  let calls = 0;
  const options = fakeFetch(p => {
    if (p.includes('Reply with only JSON')) return p.includes('Grumpy') ? '{"ok": false}' : '{"ok": true}';
    calls++;
    return JSON.stringify({ options: calls === 1
      ? [{ text: 'A drunk kitten' }, { text: 'A Grumpy kitten' }, { text: 'A kitten in a tiny hat' }]
      : [{ text: 'A kitten running for mayor' }, { text: 'A kitten with a briefcase' }, { text: 'A kitten in a tiny hat' }] });
  });
  const card = readRequest({ type: 'snack', level: 'mild', text: 'A kitten' }).card;
  const { options: got } = await seasonCard(card, ENV, options);
  assert.equal(got.length, 3);
  for (const o of got) { assert.doesNotMatch(o.text, /drunk|Grumpy/); }
});

// 11
test('11. play never shows who wrote a custom card', () => {
  const g = K.createGame({ level: 0, target: 0, length: 0 }, players(4));
  for (let i = 0; i < 3; i++) K.applyAction(g, 1, { type: 'custom', card: snack('Anonymous snack ' + i) });
  for (let round = 0; round < 8; round++) {
    K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });
    for (const s of g.apprentices) { const own = g.hands[s].find(id => id.startsWith('cc_')); K.applyAction(g, s, { type: 'play', id: own || g.hands[s][0] }); }
    const i = g.reveal.findIndex(r => String(r.c).startsWith('cc_'));
    K.applyAction(g, g.chef, { type: 'kiss', i: Math.max(0, i) });
    for (let seat = 0; seat < 4; seat++) {
      const v = K.viewFor(g, seat);
      for (const r of v.reveal.filter(r => r.custom)) assert.equal(r.seat, undefined, 'no author on a custom card');
      assert.doesNotMatch(JSON.stringify(v.reveal.filter(r => r.custom)), /ownerId|"seat":/);
    }
    if (i >= 0) { assert.equal(g.lastKiss.seat, -1); assert.equal(g.announce.seat, -1); }
    K.applyAction(g, g.chef, { type: 'next' });
  }
  assert.doesNotMatch(read('../js/chefskiss.js'), /ownerId/);
});
