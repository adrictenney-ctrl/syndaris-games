// The Laugh Engine's win stats, shared by every table (worker/stats.js). The TV reports each
// judged round (official card ids and counts only: no text, no names) and fetches what's been
// learned for the Recipe choices, so it's ready by the time the Chef picks. Offline or on a
// local test server it quietly does nothing, and hands are dealt from tags alone.
let stats = { pairs: {}, cards: {} };
let asked = '';
export const statsNow = () => stats;

export function prefetch(recipeIds) {
  const ids = (recipeIds || []).filter(id => /^rc_/.test(id));
  const key = ids.join(',');
  if (!ids.length || key === asked) return;
  asked = key;
  fetch('/api/laugh-stats?r=' + encodeURIComponent(key))
    .then(r => (r.ok ? r.json() : null))
    .then(d => { if (d && typeof d === 'object' && d.cards) stats = { pairs: { ...stats.pairs, ...(d.pairs || {}) }, cards: d.cards }; })
    .catch(() => {});
}

const sent = new Set();
export function report(round, key) {
  if (!round || sent.has(key)) return;
  sent.add(key);
  fetch('/api/laugh-round', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(round), keepalive: true }).catch(() => {});
}
