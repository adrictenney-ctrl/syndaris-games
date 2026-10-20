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
  assert.match(rule, /max-height: calc\(100vh - var\(--edge-t\) - var\(--edge-b\)/);
  assert.match(css, /body\.in-lobby \.lobby-info \.settings \{[^}]*overflow-y: auto/);
});

test('the corner controls sit inside the seat bands in the lobby', () => {
  assert.match(css, /body\.in-lobby #toolbar \{[^}]*right: calc\(var\(--edge-r\)[^}]*bottom: calc\(var\(--edge-b\)/);
});

test('four seats down a side get narrower tiles', () => {
  assert.match(js, /classList\.toggle\('crowded-sides'/);
  assert.match(css, /body\.crowded-sides #felt \{ --seat-w: 17vmin; \}/);
  const crowded = Object.values(GAMES).filter(G => [1, 3].some(s => G.layout.filter(L => L.side === s).length >= 4)).map(G => G.id);
  for (const id of ['words4fun', 'fieldagents']) assert.ok(crowded.includes(id), id);
});
