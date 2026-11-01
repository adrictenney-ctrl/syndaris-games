// Search by other names (js/search-aliases.js): every game has some, they point at real games,
// typos still match, and the names are only used for matching (never shown on the games page).
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES } from '../js/games.js';
import { ALIASES, nearWord } from '../js/search-aliases.js';

test('every game has other names to search by, and only real games are listed', () => {
  for (const id of Object.keys(GAMES)) assert.ok(ALIASES[id]?.length, id);
  for (const id of Object.keys(ALIASES)) assert.ok(GAMES[id], id);
});

test('well-known names find our versions, typos too', () => {
  const finds = (term, id) => ALIASES[id].some(a => { const x = a.toLowerCase().replace(/[^a-z0-9]/g, ''), t = term.replace(/[^a-z0-9]/g, ''); return x.startsWith(t) || nearWord(t, x); });
  assert.ok(finds('uno', 'veto'));
  assert.ok(finds('telestraitions', 'scribble'));
  assert.ok(finds('yahtzee', 'yacht'));
  assert.ok(finds('codenames', 'fieldagents'));
});

test('the other names are never written into the page', () => {
  const page = readFileSync(new URL('../games.html', import.meta.url), 'utf8');
  for (const word of ['Telestrations', 'Yahtzee', 'Monopoly', 'Pictionary']) assert.ok(!page.includes(word), word);
  assert.match(page, /\|\| aliasHit\(id\)/);
});
