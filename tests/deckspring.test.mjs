// Chef's Kiss deck picker (25 Nov 2026): a card spring in the table lobby (js/ck-deckspring.js).
// Each card in the arc is a deck; the card facing out is the chosen one.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SLOTS, FRONT, quadAt, quadMatrix, ICONS, ASPECT } from '../js/ck-deckspring-flat.js';
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

test('the flat picker (no WebGL 2): only transforms and opacity move, a card keeps its 3D (no opacity hint), and reduce motion is honoured', () => {
  const css = read('../css/ck-deckspring.css'), js = read('../js/ck-deckspring-flat.js');
  assert.match(css, /\.cks-card \{[^}]*will-change: transform;/);
  assert.doesNotMatch(css, /will-change: [^;]*opacity/);
  assert.match(js, /matrix3d\(/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(js.replace(/\/\/.*$/gm, ''), /style\.(left|top|width|height) = /, 'no layout properties set while moving');
  // keyboard, wheel, pointer (mouse, pen and touch) and screen readers
  for (const s of ["'keydown'", "'wheel'", "'pointerdown'", "'pointermove'", "'pointerup'", "role', 'listbox'", "'aria-activedescendant'", "'aria-selected'"]) assert.ok(js.includes(s), s);
  assert.match(css, /touch-action: none/);
});

// ---- the 3D picker (js/ck-deckspring.js)
import * as D3 from '../js/ck-deckspring.js';

test('3D: the camera is the photo\'s; places along the spring land where the photo has its cards', () => {
  // a point at a distance from the camera projects back onto the same photo pixel
  const P = D3.projection();
  for (const [px, py, d] of [[1418, 622, 14.2], [628, 590, 15.25], [1330, 1640, 13.5]]) {
    const [x, y, z] = D3.unproject(px, py, d);
    const cx = P[0] * x + P[8] * z, cy = P[5] * y + P[9] * z, w = -z;
    const u = D3.BOX.x + (cx / w * .5 + .5) * D3.BOX.w, v = D3.BOX.y + (1 - (cy / w * .5 + .5)) * D3.BOX.h;
    assert.ok(Math.abs(u - px) < 1e-3 && Math.abs(v - py) < 1e-3, `${px},${py}`);
  }
  // the spring passes through every key exactly
  for (const k of D3.KEYS) { const p = D3.poseAt(k.s); assert.ok(Math.abs(p.px - k.px) < 1e-9 && Math.abs(p.py - k.py) < 1e-9 && Math.abs(p.yaw - k.yaw) < 1e-9); }
  assert.ok(Math.abs(D3.ASPECT - 1420 / 1780) < 1e-9);
});

test('3D: the front card faces you, nearer than the arc and drawn over everything; the spring is smooth', () => {
  const f = D3.poseAt(0);
  assert.equal(f.yaw % 360, 0); assert.equal(f.pitch, 0);
  for (const k of D3.KEYS) if (k.s) {
    if (k.s < 6) assert.ok(D3.poseAt(k.s).d > f.d, `place ${k.s} is farther than the front`);   // (the column comes toward the camera as it falls to the pile)
    assert.ok(k.z < f.z, `place ${k.s} is drawn under the front`);
  }
  // down the right side each card is drawn over the one below it, as in the photo
  for (let s = 1; s < 9; s++) assert.ok(D3.poseAt(s).z > D3.poseAt(s + 1).z);
  // springing out of the stack the cards turn steadily toward you; then they lie back steadily
  for (let s = -6; s < 0; s++) assert.ok(D3.poseAt(s + 1).yaw > D3.poseAt(s).yaw);
  for (let s = 1; s < 8; s++) assert.ok(D3.poseAt(s + 1).pitch >= D3.poseAt(s).pitch);
  // small steps along the spring are small moves on screen (no jumps)
  for (let s = -13; s < 14; s += .05) {
    const a = D3.poseAt(s), b = D3.poseAt(s + .05);
    assert.ok(Math.hypot(a.px - b.px, a.py - b.py) < 30, `smooth at ${s.toFixed(2)}`);
  }
  // the card's model matrix is a pure rotation and a move
  const m = D3.modelMatrix([1, 2, 3], [0, 0, Math.sin(.3), Math.cos(.3)]);
  assert.ok(Math.abs(m[0] * m[0] + m[1] * m[1] + m[2] * m[2] - 1) < 1e-6);
  assert.deepEqual([m[12], m[13], m[14]], [1, 2, 3]);
});

test('3D: WebGL 2 with no library; the flat picker stands in without it; no depth buffer for the cards', () => {
  const js = read('../js/ck-deckspring.js');
  assert.match(js, /getContext\('webgl2'/);
  assert.match(js, /if \(!gl\) return mountFlat\(el, opts\);/);
  assert.match(js, /catch \(err\) \{[^}]*return mountFlat\(el, opts\);/);
  assert.match(js, /webglcontextlost/);
  assert.doesNotMatch(js, /^import (?!.*ck-deckspring-flat)/m, 'only the flat picker is imported');
  // the cards are layered by the photo's order (the depth buffer leaves holes on some GPUs)
  assert.match(js, /gl\.disable\(gl\.DEPTH_TEST\);[\s\S]*list\.sort\(\(a, b\) => a\[0\] - b\[0\]\)/);
  assert.doesNotMatch(js, /antialias: true/);
  assert.doesNotMatch(js, /discard;/);
  for (const s of ["'keydown'", "'wheel'", "'pointerdown'", "'pointermove'", "'pointerup'", "role', 'listbox'", "'aria-activedescendant'", "'aria-selected'", 'prefers-reduced-motion: reduce']) assert.ok(js.includes(s), s);
});

test('3D: no card ever flips over: every card shows its face all the way along the spring', () => {
  // the card's face points at the camera wherever it is (never turned past edge on)
  for (let s = -13; s <= 14; s += .01) {
    const p = D3.poseAt(s), yaw = p.yaw * Math.PI / 180, pitch = p.pitch * Math.PI / 180;
    const nz = Math.cos(yaw) * Math.cos(pitch);   // the face's normal toward the camera (+z)
    assert.ok(nz > 0, `face shows at ${s.toFixed(2)}`);
  }
});
