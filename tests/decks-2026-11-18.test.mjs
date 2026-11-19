// Al's 18 Nov 2026 deck release ("Chef's Kiss Programming Changes for Claude Code", Section 10).
// The free starters ship; the paid Expansion - 1 decks wait for purchases; the holdouts never ship.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CARDS } from '../js/chefskiss-db.js';
import { CONFIG } from '../js/chefskiss-config.js';
import { buildHand, makeRng, targetScore, literalScore } from '../js/chefskiss-hands.js';
import { DECKS, activeDecks, inDecks } from '../js/chefskiss-decks.js';
import * as K from '../js/chefskiss.js';

const DIR = new URL('../content/chefskiss/decks-2026-11-18/', import.meta.url);
const deck = name => JSON.parse(readFileSync(new URL('decks/' + name + '.json', DIR), 'utf8'));
const LEVELS = ['mild', 'medium', 'hot'];
const FILES = LEVELS.flatMap(l => [`${l}_base`, `${l}_expansion1`, `${l}_holdout_NOT_FOR_RELEASE`]);
const active = CARDS.filter(c => c.status === 'active');

// A tiny CSV reader (quoted fields with "" inside).
function csv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

test('1. counts: six release decks of 100 + 400, unique IDs, no clash with the old cards, no holdout or paid card shipped', () => {
  const ids = new Map();
  for (const f of FILES) {
    const d = deck(f);
    if (!f.includes('holdout')) { assert.equal(d.recipes.length, 100, f); assert.equal(d.ingredients.length, 400, f); }
    for (const c of [...d.recipes, ...d.ingredients]) { assert.ok(!ids.has(c.id), `${c.id} in ${f} and ${ids.get(c.id)}`); ids.set(c.id, f); }
  }
  const old = CARDS.filter(c => c.status === 'retired');
  assert.ok(old.length >= 2439, 'the old live cards are kept, retired');
  for (const c of old) assert.ok(!ids.has(c.id), `old id ${c.id} reused`);
  for (const c of CARDS) assert.ok(!(c.deckIds || []).some(d => /holdout|exp1/.test(d)), `${c.id} must not ship yet`);
  assert.deepEqual(new Set(active.map(c => c.id)), new Set(LEVELS.flatMap(l => { const d = deck(`${l}_base`); return [...d.recipes, ...d.ingredients].map(c => c.id); })));
});

test('2. levels: only mild, medium and hot; no Spicy or Hellfire Scorpion card anywhere in the bundle', () => {
  for (const c of active) assert.ok(LEVELS.includes(c.level), c.id);
  for (const f of FILES) for (const c of [...deck(f).recipes, ...deck(f).ingredients]) assert.ok(LEVELS.includes(c.level), `${f} ${c.id}`);
});

test('3. Recipe tags loaded exactly as shipped (recipe_tag_changes.csv, new_* columns)', () => {
  const rows = csv(readFileSync(new URL('recipe_tag_changes.csv', DIR), 'utf8'));
  assert.ok(rows.length >= 150);
  const byId = new Map(CARDS.map(c => [c.id, c]));
  const shipped = new Map(LEVELS.flatMap(l => ['base', 'expansion1'].flatMap(k => deck(`${l}_${k}`).recipes.map(r => [r.id, r]))));
  const clean = o => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v?.length).map(([k, v]) => [k, [...v].sort()]).sort());
  for (const r of rows) {
    const card = byId.get(r.recipe_id) || shipped.get(r.recipe_id);   // expansion Recipes aren't in the bundle yet
    assert.ok(card, r.recipe_id);
    assert.deepEqual(clean(card.tags), clean(JSON.parse(r.new_tags)), `${r.recipe_id} tags`);
    assert.deepEqual(clean(card.literalTags), clean(JSON.parse(r.new_literalTags)), `${r.recipe_id} literalTags`);
    assert.deepEqual(card.funnyTargetCombos.map(clean), JSON.parse(r.new_funnyTargetCombos).map(clean), `${r.recipe_id} combos`);
  }
});

// Section 6.1, ported from score_decks.py, using the engine's own scoring.
const fits = (rt, it) => rt.includes('any') || rt.some(t => it.includes(t));
const score = (r, c) => 2 * targetScore(c, r) - 1.5 * literalScore(c, r);
const good = (r, c) => fits(r.answerTypes, c.answerTypes) && literalScore(c, r) < 2;
function perHand(r, pool) {
  const T = Math.max(12, Math.ceil(pool.length / 4));
  const s = new Map(pool.map(c => [c.id, score(r, c)]));
  const v = [...s.values()].sort((a, b) => b - a)[T - 1];
  const gt = pool.filter(c => s.get(c.id) > v), eq = pool.filter(c => s.get(c.id) === v);
  const g = gt.filter(c => good(r, c)).length + eq.filter(c => good(r, c)).length * (T - gt.length) / eq.length;
  return 4 * g / T;
}
function metric(R, P) {
  const x = R.map(r => perHand(r, P));
  const p2 = h => { const p = h / 4; return 1 - (1 - p) ** 4 - 4 * p * (1 - p) ** 3; };
  return [x.reduce((a, b) => a + b, 0) / x.length, 100 * x.map(p2).reduce((a, b) => a + b, 0) / x.length, x.filter(y => y < 1).length];
}
const EXPECTED = {
  mild: { base: [3.370, 92.8, 0], expansion: [2.441, 74.8, 0], mixed: [2.738, 82.8, 0] },
  medium: { base: [3.704, 94.8, 0], expansion: [2.487, 80.2, 0], mixed: [3.057, 88.0, 0] },
  hot: { base: [3.402, 91.4, 0], expansion: [2.461, 80.2, 0], mixed: [2.787, 85.6, 0] },
};

test('4. engine parity: the nine acceptance rows from Section 10', () => {
  for (const l of LEVELS) {
    // the base row from the shipped card database, the expansion rows from the deck files
    const b = { recipes: active.filter(c => c.level === l && c.type === 'recipe'), ingredients: active.filter(c => c.level === l && c.type === 'ingredient') };
    const e = deck(`${l}_expansion1`);
    const views = { base: [b.recipes, b.ingredients], expansion: [e.recipes, e.ingredients], mixed: [[...b.recipes, ...e.recipes], [...b.ingredients, ...e.ingredients]] };
    for (const [name, [R, P]] of Object.entries(views)) {
      const [avg, two, weak] = metric(R, P), [eAvg, eTwo, eWeak] = EXPECTED[l][name];
      assert.equal(avg.toFixed(2), eAvg.toFixed(2), `${l} ${name} good per hand`);
      assert.equal(two.toFixed(1), eTwo.toFixed(1), `${l} ${name} share with 2+`);
      assert.equal(weak, eWeak, `${l} ${name} weak Recipes`);
    }
  }
});

test('5. dealer: 5 cards a hand (4 on-target + 1 random), no card in two hands in a round', () => {
  assert.equal(CONFIG.handSize, 5);
  assert.deepEqual(CONFIG.handMix, { onTarget: 4, random: 1 });
  for (const l of LEVELS) {
    const table = { level: l, decks: activeDecks(l), usedCardIds: new Set() };
    const round = { dealtThisRound: new Set() };
    const rng = makeRng('deal-' + l);
    for (const r of active.filter(c => c.level === l && c.type === 'recipe').slice(0, 25)) {
      round.dealtThisRound = new Set();
      const seen = new Set();
      for (let seat = 0; seat < 7; seat++) {
        const hand = buildHand(CARDS, r, table, round, rng);
        assert.equal(hand.length, 5);
        assert.deepEqual([hand.filter(h => h.slot === 'on_target').length, hand.filter(h => h.slot === 'random').length], [4, 1], r.id);
        for (const h of hand) { assert.ok(!seen.has(h.cardId), 'a card in two hands'); seen.add(h.cardId); }
      }
    }
  }
  assert.doesNotThrow(() => buildHand([], null, { level: 'mild', decks: activeDecks('mild') }, { dealtThisRound: new Set() }, makeRng('x')));
});

test('6. deck mode: base deals only the free starter; paid decks stay locked until purchases exist', () => {
  assert.equal(DECKS.deck_mild_exp1.kind, 'expansion');
  for (const l of LEVELS) {
    assert.deepEqual(activeDecks(l, 'base'), [`deck_${l}_base`]);
    assert.deepEqual(activeDecks(l, 'expansion'), [`deck_${l}_base`], 'expansion is locked');
    assert.deepEqual(activeDecks(l, 'mixed'), [`deck_${l}_base`], 'mixed is locked');
    assert.ok(!inDecks({ deckIds: [`deck_${l}_exp1`] }, activeDecks(l)), 'an expansion card is never dealt');
  }
  const players = [0, 1, 2, 3].map(i => ({ name: 'P' + i }));
  const g = K.createGame({ level: 0 }, players);
  assert.equal(g.settings.deckMode, 'base');
  for (const s of Object.keys(g.hands)) for (const h of g.hands[s]) {
    const c = CARDS.find(x => x.id === (h.cardId || h.id || h));
    if (c) assert.ok(c.deckIds.includes('deck_mild_base'), c.id);
  }
});

test('7. rejoin: deckMode survives the table being saved and reloaded', () => {
  const g = K.createGame({ level: 1 }, [0, 1, 2].map(i => ({ name: 'P' + i })));
  const back = JSON.parse(JSON.stringify(g));
  assert.equal(back.settings.deckMode, 'base');
});

test('the holdout and paid deck files are kept in the repo for later', () => {
  const names = readdirSync(new URL('decks/', DIR));
  for (const f of FILES) assert.ok(names.includes(f + '.json'), f);
});
