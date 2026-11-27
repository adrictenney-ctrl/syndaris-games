// Most played (27 Nov 2026): every game started adds a mark (js/plays.js); the home page puts the
// ten games with the most marks first in every list.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('starting a game (and Play again) adds one mark for that game', () => {
  const js = read('../js/table.js');
  const start = js.slice(js.indexOf('function startGame()'), js.indexOf('function endGame()'));
  assert.match(start, /import\('\.\/plays\.js\?v=\d+'\)\.then\(m => m\.markPlayed\(session\.gameId\)\)\.catch\(\(\) => \{\}\)/);
  const p = read('../js/plays.js');
  assert.match(p, /setDoc\(doc\(db, 'plays', id\), \{ n: increment\(1\) \}, \{ merge: true \}\)/);
  assert.match(p, /orderBy\('n', 'desc'\), limit\(TOP_N\)/);
  assert.match(p, /export const TOP_N = 10;/);
});

test('the home page: the top ten first in every list (before favourites), each with its place', () => {
  const html = read('../games.html');
  assert.match(html, /show = \[\.\.\.top\.filter\(id => show\.includes\(id\)\), \.\.\.show\.filter\(id => isFav\(id\) && !isTop\(id\)\), \.\.\.show\.filter\(id => !isFav\(id\) && !isTop\(id\)\)\]/);
  assert.match(html, /import\('\.\/js\/plays\.js\?v=\d+'\)/);
  assert.match(html, /#\$\{k \+ 1\} MOST PLAYED/);
  // games turned off in Parent Controls never count toward the list shown
  assert.match(html, /top = list\.filter\(id => GAMES\[id\] && allowed\(id\)\)\.slice\(0, 10\)/);
});
