// Most played games (27 Nov 2026): every game started on any screen adds one mark to that game in
// Firestore (plays/{gameId}, field n). The home page puts the ten games with the most marks first
// in every list. Nobody needs to be signed in. The rules only let a mark go up by one at a time.
// Nothing here ever holds up a game or the home page: errors are ignored.
import { db } from './firebase.js?v=5';
import { doc, setDoc, increment, collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const TOP_N = 10;
const CACHE = 'pod.topPlayed';
const okId = id => typeof id === 'string' && /^[a-z0-9]{1,30}$/.test(id);

// One more game of `id` played.
export function markPlayed(id) {
  if (!okId(id)) return Promise.resolve();
  return setDoc(doc(db, 'plays', id), { n: increment(1) }, { merge: true }).catch(() => {});
}

// The last top ten this device saw (shown at once, before the fresh list arrives).
export function cachedTop() {
  try { const t = JSON.parse(localStorage.getItem(CACHE)); return Array.isArray(t) ? t.filter(okId) : []; } catch { return []; }
}

// The ten most played games, most first: [id, ...].
export async function topPlayed() {
  const snap = await getDocs(query(collection(db, 'plays'), orderBy('n', 'desc'), limit(TOP_N)));
  const top = snap.docs.filter(d => okId(d.id) && d.data().n > 0).map(d => d.id);
  try { localStorage.setItem(CACHE, JSON.stringify(top)); } catch {}
  return top;
}
