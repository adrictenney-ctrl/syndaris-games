// Every game has How to play rules (js/rules.js), shown from the table's lobby card.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES } from '../js/games.js';
import { RULES } from '../js/rules.js';

test('every game has complete How to play rules', () => {
  for (const id of Object.keys(GAMES)) {
    const R = RULES[id];
    assert.ok(R, `${id} has no rules`);
    assert.ok(typeof R.goal === 'string' && R.goal.length > 10, `${id} goal`);
    assert.ok(Array.isArray(R.play) && R.play.length >= 2 && R.play.every(s => typeof s === 'string' && s.length > 5), `${id} steps`);
    assert.ok(typeof R.win === 'string' && R.win.length > 10, `${id} win`);
    if (R.tips) assert.ok(R.tips.every(s => typeof s === 'string' && s.length > 5), `${id} tips`);
  }
});

test('no rules for games that don’t exist', () => {
  for (const id of Object.keys(RULES)) assert.ok(GAMES[id], `${id} isn’t a game`);
});

test('the table lobby card has a working How to play button', () => {
  const html = readFileSync(new URL('../table.html', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../js/table.js', import.meta.url), 'utf8');
  const card = html.slice(html.indexOf('<div class="lobby-info">'), html.indexOf('id="startBtn"'));
  assert.match(card, /id="rulesBtn"[^>]*>[\s\S]*How to play<\/button>/, 'the button is inside the lobby card');
  assert.match(html, /id="rulesPanel"/);
  assert.match(js, /\$\('#rulesBtn'\)\.onclick = openRules/);
  assert.match(js, /function openRules\(\)/);
});
