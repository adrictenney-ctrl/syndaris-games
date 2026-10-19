// Parent Controls, as they apply on this screen. A parent sets them up in Settings while signed in
// (js/parental-ui.js saves them to their account); a copy is kept on this device so they apply
// right away, offline, and even after someone signs out. Only the parent's code turns them off.
//
//   pod.parental = { on, uid, pin, games: [game ids kids can't open], words: [words to keep out] }
//
// This file has no network code and no Firebase, so every game engine can use it cheaply:
//   isGameBlocked(id)  - the home page hides the game; the table page won't open it
//   familySafe(list)   - leaves out cards, prompts and words that contain a blocked word
//   makeBlocker(words) - (text) => true when the text contains one of the words
const KEY = 'pod.parental';
const read = () => { try { return JSON.parse(globalThis.localStorage?.getItem(KEY) || 'null'); } catch { return null; } };

export function getParental() {
  const p = read();
  return p && p.on ? { games: [], words: [], ...p } : null;
}
export function setParental(p) {
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify({ ...p, on: true })); } catch {}
  try { globalThis.dispatchEvent?.(new Event('pod-parental')); } catch {}
}
export function clearParental() {
  try { globalThis.localStorage?.removeItem(KEY); } catch {}
  try { globalThis.dispatchEvent?.(new Event('pod-parental')); } catch {}
}

export const isGameBlocked = id => !!getParental()?.games?.includes(id);
export const blockedWords = () => getParental()?.words || [];

// Text in a form that's easy to match: lower case, no accents, straight apostrophes.
const plain = t => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘`]/g, "'");
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A whole word or phrase, also matching simple plurals: "poker" blocks "Poker night" and "pokers".
export function makeBlocker(words) {
  const list = (words || []).map(w => plain(w).trim()).filter(Boolean);
  if (!list.length) return () => false;
  const re = new RegExp(`(^|[^a-z0-9])(${list.map(escRe).join('|')})(s|es|'s)?(?=$|[^a-z0-9])`, 'i');
  return text => re.test(plain(text));
}

// All the text in a card, whatever its shape (a string, or an object with strings and lists).
function textOf(x) {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  if (Array.isArray(x)) return x.map(textOf).join(' ');
  if (typeof x === 'object') return Object.values(x).map(textOf).join(' ');
  return '';
}

// A deck or word list without the blocked words. (Only if a word would remove every single entry
// is the list left as it was, so the game can still run; Settings warns about words that broad.)
export function familySafe(list, words = blockedWords()) {
  if (!Array.isArray(list) || !words?.length) return list;
  const blocked = makeBlocker(words);
  const ok = list.filter(x => !blocked(textOf(x)));
  return ok.length ? ok : list;
}
export const cardText = textOf;

// The parent's code is never stored as typed: only a SHA-256 of it (with the account id mixed in).
export async function hashPin(uid, pin) {
  const text = `pod-parent:${uid}:${String(pin).trim()}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Plain http on a home network has no crypto.subtle: a simple hash instead (marked so it's never confused).
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return 'f1:' + (h >>> 0).toString(16);
}
