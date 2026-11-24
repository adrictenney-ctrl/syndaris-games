// The Laugh Engine learns which pairings win (24 Nov 2026): each judged round is reported anonymously
// to the Worker (D1), and the stats raise the cards that win more than chance. Rare tags count more.
// Run:  node --test "tests/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARDS } from '../js/chefskiss-db.js';
import { buildHand, makeRng, pairWinRate, tagRarity, overlap } from '../js/chefskiss-hands.js';
import * as K from '../js/chefskiss.js';
import { readRound, saveRound, readStats } from '../worker/stats.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('win rate: no data is the old prior; wins above chance raise it, losses lower it', () => {
  assert.equal(pairWinRate('rc_a', 'ic_b', null), 0.2);
  assert.equal(pairWinRate('rc_a', 'ic_b', { pairs: {}, cards: {} }), 0.2);
  const hot = { pairs: { rc_a: { ic_b: [8, 6, 2] } }, cards: { ic_b: [8, 6, 2] } };
  const cold = { pairs: { rc_a: { ic_b: [8, 0, 2] } }, cards: { ic_b: [8, 0, 2] } };
  assert.ok(pairWinRate('rc_a', 'ic_b', hot) > 0.3);
  assert.ok(pairWinRate('rc_a', 'ic_b', cold) < 0.2);
  // a card that wins everywhere helps on a Recipe it hasn't met yet, but less than a proven pair
  assert.ok(pairWinRate('rc_new', 'ic_b', hot) > 0.2 && pairWinRate('rc_new', 'ic_b', hot) < pairWinRate('rc_a', 'ic_b', hot));
  assert.ok(pairWinRate('rc_a', 'ic_b', { pairs: { rc_a: { ic_b: [999, 999, 1] } }, cards: {} }) <= 0.8 + 1e-9, 'capped at 4x');
  assert.equal(pairWinRate('rc_a', 'ic_b', new Map([['rc_a|ic_b', { plays: 5, wins: 5 }]])), 0.6, 'the old Map form');
});

test('the engine deals more of a pairing that keeps winning', () => {
  const r = CARDS.find(c => c.status === 'active' && c.type === 'recipe' && c.deckIds?.includes('deck_medium_base'));
  const table = { level: 'medium', decks: ['deck_medium_base'], usedCardIds: new Set() };
  const dealt = (stats, id) => { let n = 0; for (let k = 0; k < 200; k++) n += buildHand(CARDS, r, table, { dealtThisRound: new Set() }, makeRng('s' + k), { stats }).some(h => h.cardId === id); return n; };
  // pick a card that's rarely dealt with this Recipe, then say it has won a lot with it
  const counts = new Map();
  for (let k = 0; k < 200; k++) for (const h of buildHand(CARDS, r, table, { dealtThisRound: new Set() }, makeRng('s' + k))) counts.set(h.cardId, (counts.get(h.cardId) || 0) + 1);
  const pool = CARDS.filter(c => c.status === 'active' && c.type === 'ingredient' && c.deckIds?.includes('deck_medium_base'));
  const quiet = pool.find(c => !counts.has(c.id) && r.funnyTargetCombos.some(cb => overlap(c.tags, cb) > 0)) || pool.find(c => !counts.has(c.id));
  const stats = { pairs: { [r.id]: { [quiet.id]: [20, 15, 4] } }, cards: { [quiet.id]: [20, 15, 4] } };
  assert.ok(dealt(stats, quiet.id) > dealt(null, quiet.id) + 20, 'a winning pair comes up more often');
});

test('rare tags count more than tags most of the deck shares', () => {
  const pool = CARDS.filter(c => c.status === 'active' && c.type === 'ingredient' && c.deckIds?.includes('deck_medium_base'));
  const rar = tagRarity(pool);
  assert.ok(rar('scale', 'everyday') < 0.5, 'everyday is on most cards');
  assert.ok(rar('register', 'official_sounding') > rar('register', 'casual'));
  assert.ok(rar('tone', 'no_such_tag') <= 2);
  const card = { scale: ['everyday'], register: ['official_sounding'] };
  assert.ok(overlap(card, { register: ['official_sounding'] }, rar) > overlap(card, { scale: ['everyday'] }, rar));
});

test('round report: anonymous, only rounds a person judged, never players\' own cards', () => {
  const players = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D', bot: true }];
  const g = K.createGame({ level: 1, decks: ['deck_medium_base'], target: 0, length: 0 }, players);
  g.chef = 0; g.apprentices = [1, 2, 3];
  K.applyAction(g, 0, { type: 'recipe', id: g.recipes[g.chef]?.[0] ?? g.recipes[Object.keys(g.recipes)[0]][0] });
  assert.equal(K.roundReport(g), null, 'not judged yet');
  for (const s of g.apprentices) K.applyAction(g, s, { type: 'play', id: g.hands[s][0] });
  K.timer(g, players)?.run?.();
  if (g.phase === 'play') K.timer(g, players)?.run?.();
  assert.equal(g.phase, 'judge');
  K.applyAction(g, g.chef, { type: 'kiss', i: 0 });
  const rep = K.roundReport(g);
  assert.ok(rep);
  assert.equal(rep.recipe, g.recipe);
  assert.equal(rep.level, 'medium');
  assert.equal(rep.played.length, 3);
  assert.equal(rep.winner, g.reveal[0].c);
  assert.deepEqual(Object.keys(rep).sort(), ['bots', 'engine', 'level', 'n', 'played', 'recipe', 'seats', 'winner']);
  assert.equal(rep.bots, 1);
  assert.doesNotMatch(JSON.stringify(rep), /"(name|text|t|seat)"/, 'no names, card text or seats');
  assert.equal(readRound(rep).ok, true, 'the Worker accepts it');
  // a bot Chef picks at random: not a real judgment
  g.seats[g.chef] = 'bot';
  assert.equal(K.roundReport(g), null);
});

test('Worker: checks every report and adds it up', async () => {
  assert.equal(readRound({ recipe: 'rc_1', level: 'medium', played: [{ id: 'ic_1' }] }).ok, false, 'needs 2+ cards');
  assert.equal(readRound({ recipe: 'x', level: 'medium', played: [{ id: 'ic_1' }, { id: 'ic_2' }] }).ok, false);
  assert.equal(readRound({ recipe: 'rc_1', level: 'adult', played: [{ id: 'ic_1' }, { id: 'ic_2' }] }).ok, false);
  assert.equal(readRound({ recipe: 'rc_1', level: 'mild', played: [{ id: 'cc_o1' }, { id: 'ic_2' }] }).ok, false, 'no private card ids');
  assert.equal(readRound({ recipe: 'rc_1', level: 'mild', played: [{ id: 'ic_1' }, { id: 'ic_1' }] }).ok, false);
  assert.equal(readRound({ recipe: 'rc_1', level: 'mild', played: [{ id: 'ic_1' }, { id: 'ic_2' }], winner: 'ic_9' }).ok, false);
  // a tiny stand-in for D1
  const rows = { pairs: new Map(), cards: new Map(), rounds: [] };
  const db = {
    prepare: sql => ({ bind: (...v) => ({ sql, v }), all: async () => ({ results: [...rows.cards].map(([card, x]) => ({ card, ...x })) }) }),
    batch: async stmts => { for (const { sql, v } of stmts) {
      if (sql.includes('INTO pairs')) { const k = v[0] + '|' + v[1]; const x = rows.pairs.get(k) || { plays: 0, wins: 0, exp: 0 }; rows.pairs.set(k, { plays: x.plays + 1, wins: x.wins + v[2], exp: x.exp + v[3] }); }
      else if (sql.includes('INTO cards')) { const x = rows.cards.get(v[0]) || { plays: 0, wins: 0, exp: 0 }; rows.cards.set(v[0], { plays: x.plays + 1, wins: x.wins + v[1], exp: x.exp + v[2] }); }
      else rows.rounds.push(v);
    } },
  };
  const r = readRound({ recipe: 'rc_1', level: 'mild', played: [{ id: 'ic_1', slot: 'on_target' }, { id: 'ic_2', slot: 'random' }], n: 4, winner: 'ic_1', seats: 5, bots: 0 });
  await saveRound(db, r.round);
  await saveRound(db, r.round);
  assert.deepEqual(rows.pairs.get('rc_1|ic_1'), { plays: 2, wins: 2, exp: 0.5 });
  assert.deepEqual(rows.cards.get('ic_2'), { plays: 2, wins: 0, exp: 0.5 });
  assert.equal(rows.rounds.length, 2);
  assert.doesNotMatch(JSON.stringify(rows.rounds), /name|text/);
  const out = await readStats(db, []);
  assert.deepEqual(out.cards.ic_1, [2, 2, 0.5]);
});

test('the TV reports rounds and fetches stats; the Worker has the routes and the database', () => {
  const t = read('../js/table-chefskiss.js');
  assert.match(t, /K\.useStats\(statsNow\)/);
  assert.match(t, /report\(K\.roundReport\(g\)/);
  assert.match(t, /prefetch\(g\.recipes\?\.\[g\.chef\]\)/);
  assert.match(read('../worker/index.js'), /\/api\/laugh-round[\s\S]*\/api\/laugh-stats|\/api\/laugh-stats[\s\S]*\/api\/laugh-round/);
  assert.match(read('../wrangler.jsonc'), /"binding": "STATS", "database_name": "pod-laugh-stats"/);
});
