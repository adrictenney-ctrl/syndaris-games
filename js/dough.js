// Dough: the everyday currency. You earn 10 Dough for every game you win (the table decides the
// winners; the winning phone collects it), and spend it on styles. It lives in Firestore at
// users/{uid} = { name, dough, styles: [...owned], updatedAt }, guarded by the security rules
// (only you can read or change yours; Dough goes up by at most 10 at a time, and a style can
// only be bought at its price).
//
// Wins collected while signed out wait on this device (pending) and are paid in on sign-in.
import { db, auth, onUser, currentUser } from './firebase.js?v=3';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, increment, arrayUnion, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const WIN_DOUGH = 10;
// Styles for sale. Vibrant is the free default; more will be added here later.
export const STYLES = {
  vibrant: { name: 'Vibrant', price: 0 },
  classic: { name: 'Classic', price: 100 },
};

const LS = { pending: 'pod.dough.pending', owned: 'pod.owned', seen: 'pod.dough.seen' };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const ref = uid => doc(db, 'users', uid);
const nameOf = u => (u.displayName || (u.email || '').split('@')[0] || 'Player').slice(0, 40);

// Styles this device knows the signed-in player owns (used before Firestore answers, e.g. at page load).
export const ownedHere = () => new Set(['vibrant', ...read(LS.owned, [])]);

// Make sure the player has a wallet (0 Dough, no styles bought yet).
async function ensureWallet(u) {
  const snap = await getDoc(ref(u.uid));
  if (!snap.exists()) await setDoc(ref(u.uid), { name: nameOf(u), dough: 0, styles: [], updatedAt: serverTimestamp() });
}

// Watch the signed-in player's wallet: cb({ signedIn, dough, styles }) on every change.
export function watchWallet(cb) {
  let stop = null;
  return onUser(async u => {
    stop?.(); stop = null;
    if (!u) { write(LS.owned, []); cb({ signedIn: false, dough: 0, styles: [] }); return; }
    try {
      await ensureWallet(u);
      await payPending();
      stop = onSnapshot(ref(u.uid), s => {
        const d = s.data() || {};
        const styles = Array.isArray(d.styles) ? d.styles : [];
        write(LS.owned, styles);
        cb({ signedIn: true, dough: d.dough || 0, styles, name: d.name || nameOf(u) });
      }, () => cb({ signedIn: true, dough: 0, styles: read(LS.owned, []), offline: true }));
    } catch { cb({ signedIn: true, dough: 0, styles: read(LS.owned, []), offline: true }); }
  });
}

// A win: add Dough now if signed in, otherwise keep it for later. `id` makes each win count once.
export async function collectWin(id, amount = WIN_DOUGH) {
  const seen = read(LS.seen, []);
  if (seen.includes(id)) return { already: true };
  write(LS.seen, [...seen, id].slice(-200));
  await auth.authStateReady?.();   // a signed-in player is restored after the page loads
  const u = currentUser();
  if (!u) { write(LS.pending, [...read(LS.pending, []), amount]); return { pending: true }; }
  try { await ensureWallet(u); await updateDoc(ref(u.uid), { dough: increment(Math.min(amount, WIN_DOUGH)), updatedAt: serverTimestamp() }); return { paid: true }; }
  catch { write(LS.pending, [...read(LS.pending, []), amount]); return { pending: true }; }
}

// Pay in wins collected while signed out (one at a time — the rules allow +10 per change).
async function payPending() {
  const u = currentUser();
  let list = read(LS.pending, []);
  while (u && list.length) {
    try { await updateDoc(ref(u.uid), { dough: increment(Math.min(list[0], WIN_DOUGH)), updatedAt: serverTimestamp() }); }
    catch { return; }
    list = list.slice(1); write(LS.pending, list);
  }
}
export const pendingDough = () => read(LS.pending, []).reduce((a, n) => a + n, 0);

// Buy a style: take its price and add it to the owned list in one step (or not at all).
export async function buyStyle(id) {
  const u = currentUser(), item = STYLES[id];
  if (!u) throw Object.assign(new Error('Sign in first'), { code: 'signin' });
  if (!item) throw new Error('No such style');
  await runTransaction(db, async tx => {
    const s = await tx.get(ref(u.uid));
    const d = s.data() || { dough: 0, styles: [] };
    if ((d.styles || []).includes(id)) return;
    if ((d.dough || 0) < item.price) throw Object.assign(new Error('Not enough Dough'), { code: 'poor', have: d.dough || 0 });
    tx.update(ref(u.uid), { dough: increment(-item.price), styles: arrayUnion(id), updatedAt: serverTimestamp() });
  });
}
