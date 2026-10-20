// Settings → "Have a code?": codes are kept only as fingerprints, and the box is for signed-in players.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dough = readFileSync(new URL('../js/dough.js', import.meta.url), 'utf8');
const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('codes are stored only as SHA-256 fingerprints', () => {
  const m = dough.match(/const CODES = \{([^}]*)\}/);
  assert.ok(m, 'CODES');
  for (const [, key] of m[1].matchAll(/'([^']+)':/g)) assert.match(key, /^[0-9a-f]{64}$/);
  assert.match(dough, /export async function checkCode\(/);
  assert.match(dough, /export async function redeemDough\(/);
  assert.match(dough, /devGrant: deleteField\(\)/, 'the grant fingerprint is cleared after use');
});

test('the code box is plain: hidden until signed in, no hint of what codes exist', () => {
  assert.match(home, /<div class="code-row" id="codeRow" hidden>/);
  assert.match(home, /placeholder="Have a code\?"/);
  assert.doesNotMatch(home, /developer|dev code|cheat/i);
});
