// The Laugh Engine's Si, run on the HOST device (the table screen) and only during Chef's Kiss:
// Google's Gemma 3n (E2B or E4B, the "-Web" .litertlm build) through MediaPipe's LLM Inference API
// on WebGPU. Phones never run it; they receive its picks and card ideas from the table.
//
// The model is big (E2B ≈ 3 GB, E4B ≈ 4.4 GB), so it is fetched once and kept on this device in
// the browser's private storage (OPFS). It comes either from MODEL_URL (a copy you host yourself)
// or from a file the host picks once in the Chef's Kiss lobby. Google's own download needs a Hugging
// Face login and accepting the Gemma terms, which a web page can't do on its own.
//
// It only helps. Every request is cancelled after its time limit, and whenever the model is missing,
// still loading, too slow or broken, the game simply uses the built-in scorer instead.
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.29';
// Where to download the model from, if you host a copy (needs CORS allowed for your site). Leave
// empty to have the host choose the file instead.
export const MODEL_URL = '';
const STORE = 'laugh-gemma.litertlm';

let llm = null, busy = Promise.resolve(), loading = null;
const listeners = new Set();
let status = { state: 'off', note: '' };          // off | nogpu | needmodel | downloading | loading | ready | error
const set = (state, note = '', extra = {}) => { status = { state, note, ...extra }; listeners.forEach(f => f(status)); };
export const siStatus = () => status;
export const onSiStatus = f => { listeners.add(f); return () => listeners.delete(f); };

async function gpuOk() {
  try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch { return false; }
}
async function storedModel() {
  try { const dir = await navigator.storage.getDirectory(); const h = await dir.getFileHandle(STORE); const f = await h.getFile(); return f.size > 100e6 ? f : null; } catch { return null; }
}
// Copy a stream into private storage, reporting progress.
async function keep(stream, size) {
  const dir = await navigator.storage.getDirectory();
  const h = await dir.getFileHandle(STORE, { create: true });
  const out = await h.createWritable();
  let done = 0;
  const reader = stream.getReader();
  try {
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      await out.write(value);
      done += value.length;
      if (size) set('downloading', `${Math.round(done / size * 100)}%`, { progress: done / size });
    }
    await out.close();
  } catch (e) { try { await out.abort(); } catch {} throw e; }
  try { await navigator.storage.persist?.(); } catch {}
}

// Get the model ready (download/copy if needed, then load it onto the GPU). Safe to call often.
export function startSi() {
  if (llm) return Promise.resolve(true);
  if (loading) return loading;
  loading = (async () => {
    if (!await gpuOk()) { set('nogpu', 'This screen has no WebGPU, so the built-in scorer is used'); return false; }
    let file = await storedModel();
    if (!file && MODEL_URL) {
      set('downloading', '0%', { progress: 0 });
      try {
        const res = await fetch(MODEL_URL);
        if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
        await keep(res.body, Number(res.headers.get('content-length')) || 0);
        file = await storedModel();
      } catch (e) { set('needmodel', 'Couldn’t download the Si model — choose the file instead'); return false; }
    }
    if (!file) { set('needmodel', 'Choose the Gemma 3n model file (E2B or E4B, “-Web” .litertlm) once on this screen'); return false; }
    set('loading', 'Waking up the Si…');
    try {
      const { FilesetResolver, LlmInference } = await import(`${MP}/genai_bundle.mjs`);
      const files = await FilesetResolver.forGenAiTasks(`${MP}/wasm`);
      llm = await LlmInference.createFromOptions(files, {
        baseOptions: { modelAssetBuffer: file.stream().getReader() },
        maxTokens: 1024, topK: 40, temperature: 0.9, randomSeed: Math.floor(Math.random() * 1e6),
      });
      set('ready', 'Gemma is ready');
      return true;
    } catch (e) { llm = null; set('error', 'The Si couldn’t start on this screen — using the built-in scorer'); return false; }
  })().finally(() => { loading = null; });
  return loading;
}

// The host picked the model file: keep a copy on this device, then start.
export async function useModelFile(file) {
  if (!file) return false;
  set('downloading', '0%', { progress: 0 });
  try { await keep(file.stream(), file.size); } catch { set('error', 'Couldn’t store the model on this device (not enough space?)'); return false; }
  return startSi();
}

// Leaving Chef's Kiss: free the GPU and memory (the file stays on the device for next time).
export function stopSi() {
  try { llm?.cancelProcessing?.(); llm?.close(); } catch {}
  llm = null;
  if (status.state === 'ready' || status.state === 'loading') set('off');
}
export async function forgetModel() {
  stopSi();
  try { const dir = await navigator.storage.getDirectory(); await dir.removeEntry(STORE); } catch {}
  set('needmodel', 'Model removed from this device');
}

// One request at a time, each cancelled after `ms`.
function ask(prompt, ms) {
  const run = async () => {
    if (!llm) throw new Error('not ready');
    let t;
    const timeout = new Promise((_, no) => { t = setTimeout(() => { try { llm?.cancelProcessing(); } catch {} no(new Error('timeout')); }, ms); });
    try { return await Promise.race([llm.generateResponse(`<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>model\n`), timeout]); }
    finally { clearTimeout(t); try { llm?.clearCancelSignals?.(); } catch {} }
  };
  const p = busy.then(run, run);
  busy = p.catch(() => {});
  return p;
}

const clip = s => String(s || '').replace(/\s+/g, ' ').trim();
// A last safety net on anything the model writes: drop lines with words a family game shouldn't show.
const UNKIND = /\b(sex\w*|naked|nude|kill\w*|murder\w*|drug\w*|drunk|beer|vodka|shit\w*|fuck\w*|damn\w*|hell|bitch\w*|ass(hole)?|crap|stupid|idiot|dumb|ugly|fat|hate|blood\w*|gun\w*|suicid\w*|racis\w*)\b/i;
// The Laugh Engine backend (same shape as laugh-engine.js's localBackend).
export const gemmaBackend = {
  name: 'gemma',
  // A 1–10 "how funny is this pairing" score for every card.
  async rank(recipe, cards, ms = 12000) {
    const list = cards.map((c, i) => `${i + 1}. ${clip(c.t)}`).join('\n');
    const out = await ask(`You judge a family-friendly party card game like Apples to Apples. The prompt card is: "${clip(recipe.t)}" (${clip(recipe.d)}).
Rate how FUNNY each answer card below would be when played on that prompt — surprising, absurd, clever or perfectly fitting gets a high score; dull or unrelated gets a low score.
Reply with one line per card, exactly in the form "number: score" with a score from 1 to 10, and nothing else.
${list}`, ms);
    const scores = cards.map(() => NaN);
    for (const m of String(out).matchAll(/(\d+)\s*[:.)-]\s*(\d+(?:\.\d+)?)/g)) { const i = Number(m[1]) - 1; if (i >= 0 && i < cards.length) scores[i] = Math.min(10, Number(m[2])); }
    if (scores.filter(Number.isFinite).length < Math.ceil(cards.length / 2)) throw new Error('unreadable');
    return scores.map(s => (Number.isFinite(s) ? s : 0));
  },
  // Short, family-friendly, funny answer cards for this prompt.
  async suggest(recipe, n = 6, avoid = [], ms = 12000) {
    const out = await ask(`You write answer cards for a family-friendly party card game like Apples to Apples.
The prompt card is: "${clip(recipe.t)}" (${clip(recipe.d)}).
Write ${n} different answer cards that would make a room of friends laugh out loud when played on that prompt. Each is a short noun phrase of 2 to 7 words (like "A goat in pajamas" or "Grandma's secret karaoke career"). Keep it clean and kind: no swearing, no adult topics, nothing mean.${avoid.length ? ` Don't use these: ${avoid.slice(0, 20).map(clip).join('; ')}.` : ''}
Reply with one card per line and nothing else.`, ms);
    const lines = String(out).split('\n').map(l => clip(l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').replace(/^["“]|["”]$/g, ''))).filter(l => l && l.length <= 60 && !/^(here|sure|okay)/i.test(l) && !UNKIND.test(l));
    return [...new Set(lines)].slice(0, n);
  },
};
