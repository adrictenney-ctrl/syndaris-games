// Chef's Kiss deck picker (25 Nov 2026): a card spring in the table lobby (js/ck-deckspring.js).
// Each card in the arc is a deck; the card facing out is the chosen one.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pose, ARC, ARC_FROM, ICONS } from '../js/ck-deckspring.js';
import { DECK_MODES } from '../js/chefskiss-decks.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('the arc: the front card is the biggest and faces straight out; the others turn away', () => {
  const [, , , ry, rx, s] = pose(0);
  assert.equal(ry, 0);
  assert.equal(rx, 0);
  for (let p = ARC_FROM; p <= 16; p += .5) if (p) assert.ok(pose(p)[5] < s, `position ${p} is smaller than the front`);
  // springing out of the top stack: turned further away the farther from the front
  for (let p = -1; p > -7; p--) assert.ok(pose(p - 1)[3] < pose(p)[3], `position ${p - 1} turns away more`);
  // the top stack is edge on, the far left shows red backs, then faces again
  for (let p = -13; p <= -8; p++) assert.ok(Math.abs(pose(p)[3]) > 80);
  for (let p = -17; p <= -15; p++) assert.ok(Math.abs(pose(p)[3]) > 90, 'a back');
  assert.ok(Math.abs(pose(-19)[3]) < 90, 'a face');
  // down the right side the cards lean back more and more, and land lying in the pile
  for (let p = 1; p < 10; p++) assert.ok(pose(p + 1)[4] >= pose(p)[4]);
  assert.equal(pose(14)[4], 70);
  // between two positions a card is part way between them
  const a = pose(2), b = pose(3), m = pose(2.5);
  assert.ok(Math.abs(m[0] - (a[0] + b[0]) / 2) < 1e-9 && Math.abs(m[1] - (a[1] + b[1]) / 2) < 1e-9);
  assert.equal(ARC[-ARC_FROM][5], s, 'row -ARC_FROM is the front');
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
  assert.match(css, /backface-visibility: hidden/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(js.replace(/\/\/.*$/gm, ''), /style\.(left|top|width|height) = /, 'no layout properties set while moving');
  // keyboard, wheel, pointer (mouse, pen and touch) and screen readers
  for (const s of ["'keydown'", "'wheel'", "'pointerdown'", "'pointermove'", "'pointerup'", "role', 'listbox'", "'aria-activedescendant'", "'aria-selected'"]) assert.ok(js.includes(s), s);
  assert.match(css, /touch-action: none/);
});
