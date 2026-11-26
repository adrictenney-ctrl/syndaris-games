// Chef's Kiss deck picker (25 Nov 2026): a card spring in the table lobby (js/ck-deckspring.js).
// Each card in the arc is a deck; the card facing out is the chosen one.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SLOTS, FRONT, quadAt, quadMatrix, ICONS, ASPECT } from '../js/ck-deckspring.js';
import { DECK_MODES } from '../js/chefskiss-decks.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('the arc is the reference photo: each card on its own four corners', () => {
  // the front card is the photo's Jack of clubs, upper right; the biggest card and on top
  const area = q => Math.abs((q[0] * q[3] - q[2] * q[1]) + (q[2] * q[5] - q[4] * q[3]) + (q[4] * q[7] - q[6] * q[5]) + (q[6] * q[1] - q[0] * q[7])) / 2;
  assert.equal(SLOTS[FRONT].card, 'Jc');
  for (const [i, sl] of SLOTS.entries()) {
    if (i !== FRONT) { assert.ok(area(sl.q) < area(SLOTS[FRONT].q), `place ${i} is smaller`); assert.ok(sl.z < SLOTS[FRONT].z, `place ${i} is under the front`); }
    for (let c = 0; c < 8; c += 2) assert.ok(sl.q[c] >= 380 && sl.q[c] <= 1800 && sl.q[c + 1] >= 120 && sl.q[c + 1] <= 1900, `place ${i} is inside the photo's frame`);
  }
  // red backs fan out of the top stack on the left, face-up cards spring out of it on the right
  assert.deepEqual(SLOTS.slice(0, 5).map(s => s.back), [0, 0, 1, 1, 1]);
  assert.ok(SLOTS.slice(5, 13).every(s => s.edge === 1), 'the top stack is edge on');
  assert.deepEqual(SLOTS.slice(13, 19).map(s => s.card), ['Ah', 'Js', '5s', 'Js', 'Qd', '5h']);
  // down the right side the cards lie back, each under the one above, and land in the pile
  for (let i = FRONT + 1; i < FRONT + 10; i++) assert.ok(SLOTS[i + 1].z < SLOTS[i].z);
  assert.ok(Math.abs(ASPECT - 1420 / 1780) < 1e-9);
});

test('between two places a card turns and slides without shrinking; the transform lands on the corners', () => {
  const area = q => Math.abs((q[0] * q[3] - q[2] * q[1]) + (q[2] * q[5] - q[4] * q[3]) + (q[4] * q[7] - q[6] * q[5]) + (q[6] * q[1] - q[0] * q[7])) / 2;
  assert.deepEqual(quadAt(FRONT), SLOTS[FRONT].q);
  const a = area(SLOTS[FRONT].q), b = area(SLOTS[FRONT + 1].q), m = area(quadAt(FRONT + .5));
  assert.ok(m > Math.min(a, b) * .9, 'no squash half way');
  // the matrix maps the card's corners (0,0), (250,0), (250,350), (0,350) onto the place's corners
  const q = SLOTS[FRONT].q, M = quadMatrix(q);
  const map = (x, y) => { const w = M[3] * x + M[7] * y + M[15]; return [(M[0] * x + M[4] * y + M[12]) / w, (M[1] * x + M[5] * y + M[13]) / w]; };
  [[0, 0], [250, 0], [250, 350], [0, 350]].forEach(([x, y], c) => {
    const [X, Y] = map(x, y);
    assert.ok(Math.abs(X - q[c * 2]) < 1e-6 && Math.abs(Y - q[c * 2 + 1]) < 1e-6, `corner ${c}`);
  });
});

test('the lobby: the card spring replaces the Cards list; one card per deck, locked ones show the Shop price', () => {
  const t = read('../js/table-chefskiss.js');
  assert.match(t, /lobbyStage\(el, s, change\)/);
  assert.match(t, /mountDeckSpring\(el, \{ onSelect: d => change\('deckMode', d\.id\) \}\)/);
  assert.doesNotMatch(t, /data-set="deckMode"/, 'no Cards dropdown any more');
  for (const m of DECK_MODES) assert.match(t, new RegExp(`\\b${m}: \\{ name: '[^']+', sub: '[^']+', icon: '(${Object.keys(ICONS).join('|')})' \\}`), m);
  assert.match(t, /sub: locked \? '499 Dough in the Shop'/);
  // the settings run in the mockup's order: Card level, Time Capsule, Play to, Game length, the two timers, Write your own card
  const order = ["sel('level'", 'capsuleSelect(s)', "sel('target'", "sel('length'", "sel('recipeTime'", "sel('ingredientTime'", 'ck-ownbtn'];
  const html = t.slice(t.indexOf('settingsHTML(s) {'));
  order.reduce((at, key) => { const i = html.indexOf(key); assert.ok(i > at, key); return i; }, -1);
});

test('the table page: a stage beside the settings, the join card by the start button', () => {
  const html = read('../table.html');
  assert.match(html, /<div id="lobbyStage"><\/div>\s*<div class="lobby-info">/);
  assert.match(html, /css\/ck-deckspring\.css\?v=\d+/);
  const js = read('../js/table.js');
  assert.match(js, /const stage = mode\(\)\.lobbyStage;\s*stageLayout\(!!stage\);/);
  assert.match(js, /go\.append\(tent, start\)/);
});

test('smooth: only transforms and opacity move, a card keeps its 3D (no opacity hint), and reduce motion is honoured', () => {
  const css = read('../css/ck-deckspring.css'), js = read('../js/ck-deckspring.js');
  assert.match(css, /\.cks-card \{[^}]*will-change: transform;/);
  assert.doesNotMatch(css, /will-change: [^;]*opacity/);
  assert.match(js, /matrix3d\(/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(js.replace(/\/\/.*$/gm, ''), /style\.(left|top|width|height) = /, 'no layout properties set while moving');
  // keyboard, wheel, pointer (mouse, pen and touch) and screen readers
  for (const s of ["'keydown'", "'wheel'", "'pointerdown'", "'pointermove'", "'pointerup'", "role', 'listbox'", "'aria-activedescendant'", "'aria-selected'"]) assert.ok(js.includes(s), s);
  assert.match(css, /touch-action: none/);
});
