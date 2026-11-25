// Chef's Kiss lobby (25 Nov 2026): the Laugh Engine is always on, there are no teams, and every
// table starts at Play to 5 with both card timers off (the host can still change them).
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as K from '../js/chefskiss.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const players = n => Array.from({ length: n }, (_, i) => ({ name: 'P' + i }));

test('defaults: Play to 5, Recipe and Ingredient timers off', () => {
  assert.equal(K.DEFAULTS.target, 5);
  assert.equal(K.DEFAULTS.recipeTime, 0);
  assert.equal(K.DEFAULTS.ingredientTime, 0);
  assert.deepEqual(K.FRESH, ['target', 'recipeTime', 'ingredientTime']);
  const g = K.createGame({}, players(4));
  assert.equal(g.endsAt, 0, 'no Recipe timer');
});

test('they can still be changed', () => {
  const g = K.createGame({ target: 10, recipeTime: 30, ingredientTime: 60 }, players(4));
  assert.equal(g.settings.target, 10);
  assert.equal(g.settings.recipeTime, 30);
  assert.equal(g.settings.ingredientTime, 60);
  const lobby = read('../js/table-chefskiss.js');
  assert.match(lobby, /Play to \$\{sel\('target'/);
  assert.match(lobby, /Recipe timer \$\{sel\('recipeTime'/);
  assert.match(lobby, /Ingredient timer \$\{sel\('ingredientTime'/);
});

test('every time the table opens they start at the default again', () => {
  assert.match(read('../js/table-chefskiss.js'), /fresh: K\.FRESH/);
  assert.match(read('../js/table.js'), /for \(const k of MODES\[id\]\.fresh \|\| \[\]\) s\.settings\[id\]\[k\] = MODES\[id\]\.defaults\[k\]/);
});

test('the Laugh Engine is always on, and there are no teams', () => {
  const g = K.createGame({ laugh: false, teams: 3 }, players(4));
  assert.equal(g.settings.laugh, undefined);
  assert.equal(g.settings.teams, undefined);
  assert.equal(g.teams, undefined);
  const v = K.viewFor(g, 1);
  assert.equal(v.laugh, true);
  assert.equal(v.teams, undefined);
  for (const f of ['../js/table-chefskiss.js', '../js/play-chefskiss.js']) assert.doesNotMatch(read(f), /data-set="laugh"|settings\.laugh|teams|TEAMS/i, f);
});
