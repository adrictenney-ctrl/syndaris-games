// Playtest fix (24 Nov 2026): the 4 on-target cards are spread over the Recipe's funny-target
// combos, so a hand isn't 4 of the same joke (it used to be gross + social in about half of Mild hands).
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../js/chefskiss-db.js';
import { buildHand, makeRng, overlap, fitsCombo } from '../js/chefskiss-hands.js';

const byId = new Map(CARDS.map(c => [c.id, c]));

for (const level of ['mild', 'medium', 'hot']) {
  test(`${level}: hands mix the Recipe's kinds of joke`, () => {
    const deck = `deck_${level}_base`;
    const recipes = CARDS.filter(c => c.status === 'active' && c.type === 'recipe' && c.deckIds?.includes(deck));
    let hands = 0, oneNote = 0, fit = 0, onTarget = 0;
    for (const r of recipes) for (let k = 0; k < 3; k++) {
      const h = buildHand(CARDS, r, { level, decks: [deck], usedCardIds: new Set() }, { dealtThisRound: new Set() }, makeRng(`${r.id}:${k}`));
      assert.equal(h.length, 5);
      const on = h.filter(x => x.slot === 'on_target').map(x => byId.get(x.cardId));
      // best combo per card
      const best = on.map(c => r.funnyTargetCombos.map(cb => overlap(c.tags, cb)).reduce((bi, s, i, a) => (s > a[bi] ? i : bi), 0));
      const counts = {};
      for (const i of best) counts[i] = (counts[i] || 0) + 1;
      if (Math.max(...Object.values(counts)) >= 3) oneNote++;
      // no more than 2 on-target cards share a main tone
      const tones = {};
      for (const c of on) tones[c.tags.tone[0]] = (tones[c.tags.tone[0]] || 0) + 1;
      assert.ok(Math.max(...Object.values(tones)) <= 2, `${r.text}: 3+ cards with the same tone`);
      fit += on.filter(c => r.funnyTargetCombos.some(cb => fitsCombo(c, cb))).length;
      onTarget += on.length;
      hands++;
    }
    assert.ok(oneNote / hands < 0.2, `${Math.round(100 * oneNote / hands)}% of hands are mostly one combo`);
    assert.ok(fit / onTarget > 0.6, 'on-target cards still fit a whole combo');
  });
}
