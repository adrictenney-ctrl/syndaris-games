// The table lobby keeps the game panel and the corner controls clear of the seat tiles.
// (The full check, every game at 1920x1080, 1280x720 and 1024x576 in both styles, is the
// _overlap.html dev page; this guards the pieces it relies on.)
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES } from '../js/games.js';

const css = readFileSync(new URL('../css/table.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../js/table.js', import.meta.url), 'utf8');

test('table.js measures the seat bands for the lobby', () => {
  assert.match(js, /function fitLobby\(\)/);
  assert.match(js, /if \(!g\) fitLobby\(\)/, 'refitted on every lobby render');
  for (const k of ['b', 'l', 't', 'r']) assert.ok(js.includes(`'${k}'`), `--edge-${k}`);
});

test('the lobby panel is capped to the free middle and its settings scroll', () => {
  const rule = css.slice(css.indexOf('body.in-lobby .lobby-info {'));
  assert.match(rule, /max-height: calc\(\(var\(--lob-b, 100vh\) - var\(--lob-t, 0px\)/);
  assert.match(css, /body\.in-lobby \.lobby-main \{ zoom: var\(--lz, 1\); \}/, 'a last-resort shrink to fit');
  assert.match(js, /function plateRects\(\)/);
  assert.match(js, /--lob-t/);
  assert.match(css, /body\.in-lobby \.lobby-info \.settings \{[^}]*overflow-y: auto/);
});

test('the corner controls sit inside the seat bands in the lobby', () => {
  assert.match(css, /body\.in-lobby #toolbar \{[^}]*right: var\(--tb-right[^}]*bottom: var\(--tb-bottom/);
  assert.match(js, /--tb-right/);
});

test('four seats down a side get narrower tiles', () => {
  assert.match(js, /classList\.toggle\('crowded-sides'/);
  assert.match(css, /body\.crowded-sides #felt \{ --seat-w: 17vmin; \}/);
  const crowded = Object.values(GAMES).filter(G => [1, 3].some(s => G.layout.filter(L => L.side === s).length >= 4)).map(G => G.id);
  for (const id of ['words4fun', 'fieldagents']) assert.ok(crowded.includes(id), id);
});

test('nothing in the lobby gets cut off', () => {
  // a long settings list wraps side by side; if it still has to scroll, the box keeps text off its
  // edges and ends between two settings, never through one
  assert.match(css, /body\.in-lobby \.lobby-info \.settings \{ box-sizing: border-box; padding:/);
  assert.match(css, /body\.many-settings\.in-lobby \.lobby-info \.settings \{ display: flex; flex-wrap: wrap;/);
  assert.match(js, /function settingsFit\(\)/);
  // seat names clip with "…", so their clip box needs room for letter tails
  assert.match(css, /\.who \.name \{ padding-block: \.16em; margin-block: -\.16em; \}/);
});

test('style skins: picked before drawing, shared engine, one file per skin', () => {
  const boot = readFileSync(new URL('../js/skin-boot.js', import.meta.url), 'utf8');
  const skins = [...boot.matchAll(/^\s{4}(\w+): 'family=/gm)].map(m => m[1]);
  assert.deepEqual(skins, ['arcade', 'neon', 'cafe', 'comic', 'gameshow', 'sketch', 'luxe', 'paper']);
  for (const page of ['table.html', 'play.html', 'index.html'])
    assert.match(readFileSync(new URL('../' + page, import.meta.url), 'utf8'), /<script src="js\/skin-boot\.js\?v=\d+" data-page="\w+"><\/script>/, page);
  const engine = readFileSync(new URL('../css/skins.css', import.meta.url), 'utf8');
  assert.match(engine, /prefers-reduced-motion: reduce/);
  assert.match(js, /de\.dataset\.skin \|\|/, 'the phones get the table\'s skin');
});
