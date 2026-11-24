// The playondisplay.com Worker. Static files (the whole site) are served straight from the assets
// folder; only these API routes run code:
//   POST /api/season-card   "Add salt and pepper" for a Chef's Kiss custom card (3 options)
//   POST /api/check-card    the family-friendly content check before a custom card is saved
//   POST /api/laugh-round   a judged Chef's Kiss round, for the Laugh Engine's win stats
//   GET  /api/laugh-stats   those win stats (worker/stats.js)
import { readRequest, seasonCard, checkCard, overLimit } from './season.js';
import { readRound, overRoundLimit, saveRound, readStats } from './stats.js';

const json = (data, status = 200, cache = 'no-store') => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (url.pathname === '/api/laugh-stats') {
      if (!env.STATS) return json({ pairs: {}, cards: {} });
      try { return json(await readStats(env.STATS, (url.searchParams.get('r') || '').split(',')), 200, 'public, max-age=30'); }
      catch { return json({ pairs: {}, cards: {} }); }
    }
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
    if (url.pathname === '/api/laugh-round') {
      const r = readRound(body);
      if (!r.ok) return json({ ok: false, error: r.error }, 400);
      if (!env.STATS) return json({ ok: false, error: 'Stats are off' }, 503);
      if (await overRoundLimit(request.headers.get('cf-connecting-ip') || '', globalThis.caches?.default)) return json({ ok: false, error: 'Too many rounds' }, 429);
      try { await saveRound(env.STATS, r.round); return json({ ok: true }); }
      catch { return json({ ok: false, error: 'Couldn’t save' }, 503); }
    }
    const req = readRequest(body);
    if (url.pathname === '/api/check-card') {
      if (!req.ok) return json({ ok: false, message: req.error });
      return json(await checkCard(req.card, env));
    }
    if (url.pathname === '/api/season-card') {
      if (!req.ok) return json({ error: req.error }, 400);
      const player = String(body.playerId || request.headers.get('cf-connecting-ip') || '').slice(0, 80);
      if (await overLimit(player, globalThis.caches?.default)) return json({ error: 'Too many tries. Wait a bit and try again.' }, 429);
      try { return json(await seasonCard(req.card, env)); }
      catch { return json({ error: 'Couldn’t add salt and pepper right now.' }, 503); }
    }
    return json({ error: 'Not found' }, 404);
  },
};
