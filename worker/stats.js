// Chef's Kiss Laugh Engine win stats, kept in Cloudflare D1 (binding STATS; schema in
// worker/migrations). Anonymous by design (SPEC.md 5.7): only official card ids and counts,
// never card text, names or player ids.
//   POST /api/laugh-round   one judged round: { recipe, level, played: [{ id, slot }], winner, seats, bots, engine }
//   GET  /api/laugh-stats?r=rc_a,rc_b,rc_c   { pairs: { rc: { ic: [plays, wins, exp] } }, cards: { ic: [plays, wins, exp] } }
const RECIPE = /^rc_[a-z0-9_]{1,40}$/;
const CARD = /^ic_[a-z0-9_]{1,40}$/;
const LEVELS = ['mild', 'medium', 'hot'];
const ROUNDS_PER_HOUR = 240;   // per address: a real round takes well over 15 seconds

// Check a round report; returns { ok, round } or { ok: false, error }.
export function readRound(b) {
  if (!b || typeof b !== 'object') return { ok: false, error: 'Bad round' };
  const recipe = String(b.recipe || '');
  if (!RECIPE.test(recipe)) return { ok: false, error: 'Bad recipe' };
  if (!LEVELS.includes(b.level)) return { ok: false, error: 'Bad level' };
  if (!Array.isArray(b.played) || b.played.length < 2 || b.played.length > 12) return { ok: false, error: 'Bad cards' };
  const n = Number(b.n);
  const total = Number.isInteger(n) && n >= b.played.length && n <= 24 ? n : b.played.length;
  const played = [];
  for (const p of b.played) {
    const id = String(p?.id || '');
    if (!CARD.test(id) || played.some(x => x.id === id)) return { ok: false, error: 'Bad card' };
    played.push({ id, slot: ['on_target', 'random', 'snack'].includes(p.slot) ? p.slot : 'random' });
  }
  const winner = b.winner == null ? null : String(b.winner);
  if (winner !== null && !played.some(p => p.id === winner)) return { ok: false, error: 'Bad winner' };
  const int = (v, hi) => (Number.isInteger(v) && v >= 0 && v <= hi ? v : null);
  return { ok: true, round: { recipe, level: b.level, played, winner, total, seats: int(b.seats, 24), bots: int(b.bots, 24), engine: String(b.engine || '').slice(0, 20) } };
}

export async function overRoundLimit(who, cache) {
  if (!cache || !who) return false;
  const key = new Request(`https://rate.playondisplay.internal/laugh/${encodeURIComponent(who)}/${Math.floor(Date.now() / 3600000)}`);
  const hit = await cache.match(key);
  const n = hit ? Number(await hit.text()) || 0 : 0;
  if (n >= ROUNDS_PER_HOUR) return true;
  await cache.put(key, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3700' } }));
  return false;
}

export async function saveRound(db, r) {
  const e = 1 / r.total;   // the chance any one card wins this round
  const up = (table, keys) => `INSERT INTO ${table} (${keys}, plays, wins, exp) VALUES (${keys.split(',').map(() => '?').join(',')}, 1, ?, ?)
    ON CONFLICT (${keys}) DO UPDATE SET plays = plays + 1, wins = wins + excluded.wins, exp = exp + excluded.exp`;
  const stmts = [];
  for (const p of r.played) {
    const won = p.id === r.winner ? 1 : 0;
    stmts.push(db.prepare(up('pairs', 'recipe,card')).bind(r.recipe, p.id, won, e));
    stmts.push(db.prepare(up('cards', 'card')).bind(p.id, won, e));
  }
  stmts.push(db.prepare('INSERT INTO rounds (hour, level, recipe, winner, played, seats, bots, engine) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(Math.floor(Date.now() / 3600000), r.level, r.recipe, r.winner, JSON.stringify(r.played), r.seats, r.bots, r.engine));
  await db.batch(stmts);
}

export async function readStats(db, recipes) {
  const ids = [...new Set(recipes)].filter(id => RECIPE.test(id)).slice(0, 6);
  const pairs = {};
  if (ids.length) {
    const { results } = await db.prepare(`SELECT recipe, card, plays, wins, exp FROM pairs WHERE recipe IN (${ids.map(() => '?').join(',')})`).bind(...ids).all();
    for (const x of results) (pairs[x.recipe] ||= {})[x.card] = [x.plays, x.wins, Math.round(x.exp * 1000) / 1000];
  }
  const cards = {};
  const { results } = await db.prepare('SELECT card, plays, wins, exp FROM cards').all();
  for (const x of results) cards[x.card] = [x.plays, x.wins, Math.round(x.exp * 1000) / 1000];
  return { pairs, cards };
}
