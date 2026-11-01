// The landing page (site root): the spec's acceptance checks.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { GAMES } from '../js/games.js';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const body = page.slice(page.indexOf('<body>'));

test('the landing page has the headline, the picture, the three steps and one button', () => {
  assert.match(body, /<h1>Games where the table plays and <em>your phone controls\.<\/em><\/h1>/);
  assert.match(body, /iPad on the table/);
  assert.match(body, /TV on the wall/);
  for (const step of ['Glance at the table', 'Act on your phone', 'See it on the table']) assert.ok(body.includes(step), step);
  const links = body.match(/<a\b/g) || [], buttons = body.match(/<button\b/g) || [];
  assert.equal(links.length + buttons.length, 1, 'exactly one thing to click');
  assert.match(body, /<a class="try" href="table\.html\?game=trio">Try a game<\/a>/);
  assert.ok(GAMES.trio, 'the game it opens exists');
});

test('no menu or game list on the landing page; the games live in games.html', () => {
  assert.doesNotMatch(body, /<nav|id="shelf"|class="chip/);
  assert.ok(existsSync(new URL('../games.html', import.meta.url)));
  const table = readFileSync(new URL('../table.html', import.meta.url), 'utf8');
  assert.match(table, /id="allGames" href="games\.html"/);
});

test('the TV app skips the landing page', () => {
  assert.match(page, /PlayOnDisplayTV/);
  assert.match(page, /location\.replace\('games\.html' \+ location\.search\)/);
});

test('the landing page shows once per device', () => {
  assert.match(page, /localStorage\.setItem\('pod\.seenLanding', '1'\)/);
  assert.match(page, /const skip = seen \|\|/);
});
