// Bread: the second currency, only ever bought. The shop (cart) lists the packs; buying is off
// until Paddle is set up.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PACKS, BUY_LIVE } from '../js/bread.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('the five Bread packs: $1.99 = 500, $5.99 = 1500, $9.99 = 3000, $15.99 = 4500, $19.99 = 6000', () => {
  assert.deepEqual(PACKS.map(p => [p.usd, p.bread]), [[1.99, 500], [5.99, 1500], [9.99, 3000], [15.99, 4500], [19.99, 6000]]);
  assert.equal(new Set(PACKS.map(p => p.id)).size, PACKS.length);
});

test('Bread is not for sale yet', () => {
  assert.equal(BUY_LIVE, false);
});

test('the site never writes Bread (only the server adds it after a payment)', () => {
  assert.doesNotMatch(read('../js/bread.js'), /firebase|firestore|setDoc|updateDoc/, 'the shop never touches the database');
  assert.doesNotMatch(read('../js/dough.js'), /bread\s*:\s*(increment|\d)/, 'the wallet code only reads Bread');
});

test('the cart button is in the home page top bar', () => {
  assert.match(read('../games.html'), /bread\.js\?v=\d+'\)\.then\(m => \{ B = m; m\.mountCart\(document\.getElementById\('doughPill'\)/);
});
