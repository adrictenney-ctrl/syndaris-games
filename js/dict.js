// The shared English word list, loaded once from the CDN by the table (the host checks words).
// isWord() for spelling, hasPrefix() so word finders can stop early. If the list can't load,
// every word is accepted rather than blocking the game.
const URL = 'https://cdn.jsdelivr.net/npm/word-list@4.0.0/words.txt';
let words = null, set = null, state = 'idle';
const waiting = [];

export function loadDict(cb) {
  if (cb) { if (dictReady()) cb(); else waiting.push(cb); }
  if (state !== 'idle') return;
  state = 'loading';
  fetch(URL).then(r => (r.ok ? r.text() : Promise.reject(r.status)))
    .then(t => {
      words = t.split('\n').map(w => w.trim()).filter(w => /^[a-z]+$/.test(w)).sort();
      set = new Set(words);
      state = 'ready';
    })
    .catch(() => { state = 'failed'; })
    .finally(() => { while (waiting.length) waiting.shift()(); });
}

export const dictReady = () => state === 'ready' || state === 'failed';
export const dictFailed = () => state === 'failed';
export const isWord = w => (state === 'ready' ? set.has(w.toLowerCase()) : state === 'failed');

// Is any word in the list starting with p?
export function hasPrefix(p) {
  if (state !== 'ready') return state === 'failed';
  let lo = 0, hi = words.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (words[m] < p) lo = m + 1; else hi = m; }
  return lo < words.length && words[lo].startsWith(p);
}

// A random word from the list with a length in [min, max] (for games that need one).
export function randomWord(min = 4, max = 8, test = () => true) {
  if (state !== 'ready') return null;
  for (let i = 0; i < 4000; i++) {
    const w = words[Math.floor(Math.random() * words.length)];
    if (w.length >= min && w.length <= max && test(w)) return w;
  }
  return null;
}
