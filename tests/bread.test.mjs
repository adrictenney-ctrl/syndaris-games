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

test('the site only adds Bread when collecting a gift (payments: the server adds it)', () => {
  assert.doesNotMatch(read('../js/bread.js'), /firebase|firestore|setDoc|updateDoc/, 'the shop never touches the database');
  // the rules check the gift and remove it in the same step
  const writes = read('../js/dough.js').match(/bread\s*:\s*(increment|\d)[^\r\n]*/g) || [];
  assert.deepEqual(writes, ['bread: increment(amount), breadClaim: g.id, updatedAt: serverTimestamp() });']);
});

test('the cart button is in the home page top bar', () => {
  assert.match(read('../games.html'), /bread\.js\?v=\d+'\)\.then\(m => \{ B = m; m\.mountCart\(document\.getElementById\('doughPill'\)/);
});

test('only the two gifter accounts see the Gift Bread box, and their emails are not in the site code', async () => {
  const src = read('../js/dough.js') + read('../js/bread.js') + read('../games.html');
  assert.doesNotMatch(src, /adric.tenney|alwaller228/);
  const { createHash } = await import('node:crypto');
  for (const e of ['adric.tenney@gmail.com', 'alwaller228@gmail.com']) assert.ok(src.includes(createHash('sha256').update('pod-bread-gifter:' + e).digest('hex')), e);
});
