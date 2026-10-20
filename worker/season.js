// Server side of "Add salt and pepper" and the family-friendly content check for Chef's Kiss
// customizable cards (customizable cards spec, sections 5 and 7). Runs in the Cloudflare Worker
// (worker/index.js); never on a phone. The model key comes from the Worker's secret GEMINI_API_KEY,
// set with `wrangler secret put GEMINI_API_KEY`; it is never in client code or the repo.
//
// Everything here takes `fetchImpl` so the tests can run it without the network.
import { LIMITS, CARD_LEVELS, ANSWER_TYPES, familyFriendly, cardProblem, FAMILY_MSG } from '../js/ck-custom.js';
import { spiceItUp } from '../js/spice.js';

export const DEFAULT_MODEL = 'gemma-3-27b-it';
export const TIMEOUT_MS = 8000;
export const RATE_PER_HOUR = 20;

const clean = t => String(t ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

// The request a phone may send. Returns { ok, card } or { ok: false, error }.
export function readRequest(body) {
  const type = body?.type, level = body?.level;
  if (type !== 'signature_recipe' && type !== 'snack') return { ok: false, error: 'Unknown card type' };
  if (!CARD_LEVELS.includes(level)) return { ok: false, error: 'Unknown level' };
  const card = {
    type, level,
    text: clean(body.text).slice(0, 200),
    flavor: type === 'snack' && clean(body.flavor) ? clean(body.flavor).slice(0, 200) : null,
    answerTypes: type === 'signature_recipe' && Array.isArray(body.answerTypes) ? body.answerTypes.filter(a => ANSWER_TYPES.some(([k]) => k === a)) : [],
  };
  const problem = cardProblem(card);
  return problem ? { ok: false, error: problem } : { ok: true, card };
}

// The instructions sent to the model (spec section 5, word for word).
export function buildPrompt({ type, level, text, flavor, answerTypes }) {
  return [
    "You punch up player-written cards for Chef's Kiss, a family party game.",
    `Card type: ${type}. Table level: ${level}.`,
    'Level guide: mild = silly and gentle, for elementary-school kids; medium = sharper and more clever, for middle schoolers; hot = witty and sarcastic, for high schoolers.',
    "Keep the player's core idea; bring out the joke that is already there rather than replacing it.",
    'Be witty, never mean. No insults about real people, groups, bodies, or anyone at the table. Keep everything family-friendly at every level: no profanity, crude or inappropriate content, or graphic violence.',
    'Signature Recipe: a prompt the other players answer with a card; keep it open so many answers fit; max 80 characters.',
    'Snack: a noun or short phrase that answers prompts; max 60 characters; optional flavor line max 60 characters.',
    'Return exactly 3 different options as JSON: {"options":[{"text":"...","flavor":"... or null"}]}. No other text.',
    `Player's card: text="${text}" flavor="${flavor ?? ''}" answerTypes=${JSON.stringify(answerTypes || [])}`,
  ].join('\n');
}

// Pull a JSON object out of a model reply (it sometimes wraps it in ``` fences or adds words).
export function jsonFrom(raw) {
  const s = String(raw ?? '').replace(/```(?:json)?/gi, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
}

// Options that pass the server-side rules: non-empty, within the length limits (trimmed, cut at a
// word if needed), clean words, different from each other.
export function tidyOptions(list, card) {
  const max = LIMITS[card.type];
  const cut = (t, n) => { t = clean(t); if (t.length <= n) return t; const c = t.slice(0, n); return (c.lastIndexOf(' ') > n * 0.6 ? c.slice(0, c.lastIndexOf(' ')) : c).replace(/[,;:\-–—\s]+$/, ''); };
  const seen = new Set();
  const out = [];
  for (const o of Array.isArray(list) ? list : []) {
    const text = cut(o?.text, max);
    if (!text || seen.has(text.toLowerCase()) || text.toLowerCase() === card.text.toLowerCase()) continue;
    let flavor = card.type === 'snack' ? cut(o?.flavor, LIMITS.flavor) : '';
    if (/^(null|none|n\/a)$/i.test(flavor)) flavor = '';
    if (!familyFriendly(text) || (flavor && !familyFriendly(flavor))) continue;
    seen.add(text.toLowerCase());
    out.push({ text, flavor: card.type === 'snack' ? flavor || null : null });
  }
  return out;
}

async function withTimeout(promise, ms) {
  let t;
  try { return await Promise.race([promise, new Promise((_, no) => { t = setTimeout(() => no(Object.assign(new Error('timeout'), { code: 'timeout' })), ms); })]); }
  finally { clearTimeout(t); }
}

// One call to the model. Returns its text reply.
export async function callModel(env, prompt, fetchImpl = fetch, ms = TIMEOUT_MS) {
  const model = env.GEMMA_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await withTimeout(fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 400 } }),
  }), ms);
  if (!res.ok) throw Object.assign(new Error('model ' + res.status), { code: 'model' });
  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
}

// The second half of the content check: ask the model whether the text suits the table level.
export async function classify(env, text, level, fetchImpl = fetch) {
  if (!env.GEMINI_API_KEY) return true;   // without a key, the word list is the whole check
  const prompt = `You check cards for Chef's Kiss, a family party game. Table level: ${level} (mild = elementary school, medium = middle school, hot = high school; family-friendly at every level).\nIs this card text family-friendly for that level? No profanity, crude or sexual content, drugs, graphic violence, or insults about real people or groups.\nReply with only JSON: {"ok": true} or {"ok": false}.\nCard text: "${text}"`;
  try { return jsonFrom(await callModel(env, prompt, fetchImpl))?.ok === true; }
  catch { return true; }  // the check never blocks a card just because the service is slow; the word list still ran
}

// "Add salt and pepper": exactly 3 options, or an error. Retries the model once, then gives up.
export async function seasonCard(card, env, fetchImpl = fetch) {
  const tidyAndCheck = async list => {
    const ok = [];
    for (const o of tidyOptions(list, card)) {
      if (await classify(env, [o.text, o.flavor].filter(Boolean).join(' — '), card.level, fetchImpl)) ok.push(o);
      if (ok.length === 3) break;
    }
    return ok;
  };
  let options = [];
  if (env.GEMINI_API_KEY) {
    for (let attempt = 0; attempt < 2 && options.length < 3; attempt++) {
      try {
        const got = jsonFrom(await callModel(env, buildPrompt(card), fetchImpl))?.options;
        const fresh = await tidyAndCheck(got);
        for (const o of fresh) if (options.length < 3 && !options.some(x => x.text.toLowerCase() === o.text.toLowerCase())) options.push(o);
      } catch { /* try once more */ }
    }
  } else {
    // No model configured yet: the built-in technique templates stand in (same rules, same checks).
    const kind = card.type === 'signature_recipe' ? 'recipe' : 'ingredient';
    for (let k = 0; k < 4 && options.length < 3; k++) {
      const got = spiceItUp(card.text, kind, card.level, null, Math.random, 3).map(x => ({ text: x.text, flavor: card.flavor }));
      for (const o of tidyOptions(got, card)) if (options.length < 3 && !options.some(x => x.text.toLowerCase() === o.text.toLowerCase())) options.push(o);
    }
  }
  if (options.length < 3) throw Object.assign(new Error('Couldn’t add salt and pepper right now.'), { code: 'unavailable' });
  return { options: options.slice(0, 3) };
}

// The content check when a card is saved (word list, then the model's verdict).
export async function checkCard(card, env, fetchImpl = fetch) {
  const problem = cardProblem(card);
  if (problem) return { ok: false, message: problem };
  const whole = [card.text, card.flavor].filter(Boolean).join(' — ');
  if (!(await classify(env, whole, card.level, fetchImpl))) return { ok: false, message: FAMILY_MSG };
  return { ok: true };
}

// 20 requests per player per hour (spec section 5). Counted with the Worker's cache, per data centre.
export async function overLimit(playerId, cache) {
  if (!cache || !playerId) return false;
  const hour = Math.floor(Date.now() / 3600000);
  const key = new Request(`https://rate.playondisplay.internal/season/${encodeURIComponent(playerId)}/${hour}`);
  const hit = await cache.match(key);
  const n = hit ? Number(await hit.text()) || 0 : 0;
  if (n >= RATE_PER_HOUR) return true;
  await cache.put(key, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3700' } }));
  return false;
}
