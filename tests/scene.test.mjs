// The corner art on every game table (24 Nov 2026): css/scene.css, built by tools/build-scenes.mjs.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KIND } from '../js/game-kind-list.js';
import { FAMILY, CUSTOM_TABLES } from '../js/game-kinds.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const css = read('../css/scene.css');
const modes = read('../js/table.js').match(/const MODES = \{([^}]*)\}/)[1].split(',').map(s => s.trim()).filter(Boolean);
const SKINS = ['arcade', 'neon', 'cafe', 'comic', 'gameshow', 'sketch', 'luxe', 'paper'];

test('every game has a kind, and every kind has a colour family and its own corner art', () => {
  for (const id of modes) assert.ok(KIND[id], `${id} has no kind in js/game-kind-list.js`);
  for (const kind of new Set(Object.values(KIND))) {
    assert.ok(FAMILY[kind], kind);
    assert.match(css, new RegExp(`body\\[data-kind="${kind}"\\] #scene \\{\\s*--sc-tl: url`));
  }
});

test('each bought Style has its own corner art, all four corners', () => {
  for (const s of SKINS) {
    const block = css.split(`html[data-skin="${s}"] #scene {`)[1]?.split('}')[0] || '';
    for (const c of ['tl', 'tr', 'bl', 'br']) assert.match(block, new RegExp(`--sc-${c}: url\\("data:image/svg\\+xml,`), `${s} ${c}`);
  }
  // the designs differ from each other
  const tl = SKINS.map(s => css.split(`html[data-skin="${s}"] #scene {`)[1].split('--sc-tl:')[1].split(';')[0]);
  assert.equal(new Set(tl).size, SKINS.length);
});

test('custom tables keep their own scene and colours (Go Fish)', () => {
  assert.deepEqual(CUSTOM_TABLES, ['gofish']);
  assert.match(css, /body\[data-game="gofish"\] #scene \{ display: none; \}/);
  for (const m of css.matchAll(/body\[data-family="\w+"\]([^ ]*) #felt/g)) assert.equal(m[1], ':not([data-game="gofish"])');
});

test('busy corners, clear middle: corners only, no crown, no logo in the middle', () => {
  assert.match(css, /#scene \.tl \{ left: 0; top: 0;/);
  assert.match(css, /--sc-w: min\(44vmin, 28vw\)/);
  assert.doesNotMatch(read('../tools/build-scenes.mjs'), /\bcrown\b/i);
  const html = read('../table.html');
  assert.match(html, /<div id="scene" aria-hidden="true"><i class="tl"><\/i><i class="tr"><\/i><i class="bl"><\/i><i class="br"><\/i><\/div>/);
  assert.match(html, /css\/scene\.css\?v=\d+/);
  assert.match(read('../js/table.js'), /document\.body\.dataset\.family = FAMILY\[document\.body\.dataset\.kind\]/);
});
