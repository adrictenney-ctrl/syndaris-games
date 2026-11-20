// Chef's Kiss "Write your own card": a signed-in player's account cards (5 free, permanent) go into
// the deck they picked and are dealt only into that player's own hand.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as K from '../js/chefskiss.js';
import { tableCards, FREE_CARDS } from '../js/ck-owncards.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const players = n => Array.from({ length: 8 }, (_, i) => (i < n ? { name: 'P' + i, bot: false, connected: true } : null));
const mine = (level, n = 3) => tableCards('uidAbc123', Array.from({ length: n }, (_, i) => ({ slot: 's' + (i + 1), text: `My own card number ${i + 1}`, level })));
const pick = g => K.applyAction(g, g.chef, { type: 'recipe', id: g.recipes[g.chef][0] });

test('free accounts get 5 cards, with ids the table accepts', () => {
  assert.equal(FREE_CARDS, 5);
  for (const c of mine('mild', 5)) assert.match(c.id, /^cc_o[\w-]+_s[1-5]$/);
});

test("a player's own cards are dealt only into their own hand", () => {
  const g = K.createGame({ level: 0, target: 0, length: 0 }, players(4));
  const seat = g.apprentices[0];
  assert.equal(K.applyAction(g, seat, { type: 'mine', cards: mine('mild', 2) }), null);
  pick(g);
  const own = id => id.startsWith('cc_o');
  assert.equal(g.hands[seat].filter(own).length, 2, 'both of my cards are in my hand');
  for (const s of g.apprentices) if (s !== seat) assert.equal(g.hands[s].filter(own).length, 0, `seat ${s} never gets them`);
  assert.equal(g.hands[seat].length, 5, 'the hand is still 5 cards');
  assert.equal(K.viewFor(g, seat).myOwn, 2);
});

test('only cards for the deck the table selected join', () => {
  const g = K.createGame({ level: 1, target: 0, length: 0 }, players(4));
  const seat = g.apprentices[0];
  K.applyAction(g, seat, { type: 'mine', cards: [...mine('mild', 2), ...mine('medium', 1).map(c => ({ ...c, id: c.id + 'm' }))] });
  assert.equal(Object.values(g.custom).filter(c => c.own).length, 1);
  assert.ok(Object.values(g.custom).every(c => c.level === 'medium'));
});

test('at most 5, bad ids and unfriendly words are ignored, and sending again replaces', () => {
  const g = K.createGame({ level: 0, target: 0, length: 0 }, players(4));
  const seat = g.apprentices[0];
  const many = Array.from({ length: 9 }, (_, i) => ({ id: `cc_ouid_x${i}`, text: 'Card ' + i, level: 'mild' }));
  K.applyAction(g, seat, { type: 'mine', cards: many });
  assert.equal(Object.values(g.custom).filter(c => c.own).length, 5);
  K.applyAction(g, seat, { type: 'mine', cards: [{ id: 'nope', text: 'Hi there', level: 'mild' }, { id: 'cc_ouid_s1', text: '', level: 'mild' }, ...mine('mild', 1)] });
  assert.deepEqual(Object.values(g.custom).filter(c => c.own).map(c => c.text), ['My own card number 1']);
  // someone else can't take over my card
  K.applyAction(g, g.apprentices[1], { type: 'mine', cards: mine('mild', 1) });
  assert.equal(g.custom[mine('mild', 1)[0].id].seat, seat);
});

test('the Card level setting has a "Write your own card" button, and the phone lobby shows the deck', () => {
  assert.match(read('../js/table-chefskiss.js'), /data-ck-own[\s\S]*Write your own card/);
  assert.match(read('../js/play-chefskiss.js'), /Table deck[\s\S]*Write your own card/);
  assert.match(read('../js/table.js'), /lobby: !g && mode\(\)\.lobbyInfo/);
});

test('cards are saved to the account, create-only (permanent)', () => {
  const src = read('../js/ck-owncards.js');
  assert.match(src, /'users', u\.uid, 'ckcards'/);
  assert.doesNotMatch(src, /deleteDoc|updateDoc/);
});
