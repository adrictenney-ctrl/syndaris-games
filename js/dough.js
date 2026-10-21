// Dough: the everyday currency. You earn 10 Dough for every game you win (the table decides the
// winners; the winning phone collects it), and spend it on styles. It lives in Firestore at
// users/{uid} = { name, dough, styles: [...owned], updatedAt }, guarded by the security rules
// (only you can read or change yours; Dough goes up by at most 10 at a time, and a style can
// only be bought at its price).
//
// Wins collected while signed out wait on this device (pending) and are paid in on sign-in.
import { db, auth, onUser, currentUser } from './firebase.js?v=3';
import { doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, increment, arrayUnion, runTransaction, serverTimestamp, deleteField, writeBatch, collection, query, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const WIN_DOUGH = 10;
// Styles for sale. Vibrant is the free default; more will be added here later.
export const STYLES = {
  vibrant: { name: 'Vibrant', price: 0 },
  // skins: Vibrant's layout with their own look on the table and phones
  arcade: { name: 'Retro Arcade', price: 100 },
  neon: { name: 'Neon Night', price: 100 },
  cafe: { name: 'Cozy Café', price: 100 },
  comic: { name: 'Comic Book', price: 100 },
  gameshow: { name: 'Game Show', price: 100 },
  sketch: { name: 'Sketchbook', price: 100 },
  luxe: { name: 'Midnight Luxe', price: 100 },
  paper: { name: 'Paper Craft', price: 100 },
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
      // Gifts waiting for this email: added now, and the page is told so it can say so.
      claimGifts(u).then(got => got.forEach(g => dispatchEvent(new CustomEvent('pod-gift', { detail: g })))).catch(() => {});
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

// Codes (Settings → "Have a code?"). Only fingerprints are kept here, never the codes themselves.
// A code is matched without caring about capitals or extra spaces.
const CODES = {
  '06387caf46ccc5834c704240a2c7bfaa296b33fb41a8308f984f54766d94ddb8': 'dough',   // choose an amount
  'c6a7e8b1655085b129236c8c7aa2fea4e4a550a069c024353706db590e9ad6a7': 'jackpot', // a fixed 1,000,000,000,000
};
export const JACKPOT = 1e12;
const norm = t => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// What a code unlocks ('dough' = choose an amount of Dough to add), or null.
export async function checkCode(code) { return CODES[await sha256('pod-code:' + norm(code))] || null; }

// Add Dough with a 'dough' code. The grant carries a second fingerprint of the code that only the
// Firestore rules know, so the amount can't be raised without it; it's cleared again straight after.
export async function redeemDough(code, amount) {
  const u = currentUser();
  if (!u) throw Object.assign(new Error('Sign in first'), { code: 'signin' });
  const kind = await checkCode(code);
  if (kind !== 'dough' && kind !== 'jackpot') throw Object.assign(new Error('Unknown code'), { code: 'bad' });
  const add = kind === 'jackpot' ? JACKPOT : Math.floor(Number(amount));
  if (kind === 'dough' && (!(add > 0) || add > 1e6)) throw Object.assign(new Error('Amount'), { code: 'amount' });
  await ensureWallet(u);
  const grant = await sha256('pod-dev-grant:' + norm(code));
  let total = 0;
  await runTransaction(db, async tx => {
    const s = await tx.get(ref(u.uid));
    total = ((s.data() || {}).dough || 0) + add;
    tx.update(ref(u.uid), { dough: total, devGrant: grant, updatedAt: serverTimestamp() });
  });
  await updateDoc(ref(u.uid), { devGrant: deleteField(), updatedAt: serverTimestamp() }).catch(() => {});
  return total;
}

// Gifts. A Dough code can send its amount to someone else's email (a Google account is its Gmail
// address) instead: gifts/{id} = { to, amount, from, createdAt }. The sender's own wallet carries the
// code's grant fingerprint in the same write (the rules check it there, so the gift itself never holds
// it). The gift waits until someone signs in with that email; then it's added to their wallet and
// the gift is removed, in one step.
export const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
export async function giftDough(code, email, amount) {
  const u = currentUser();
  if (!u) throw Object.assign(new Error('Sign in first'), { code: 'signin' });
  if (await checkCode(code) !== 'dough') throw Object.assign(new Error('Unknown code'), { code: 'bad' });
  const to = String(email || '').trim().toLowerCase(), add = Math.floor(Number(amount));
  if (!emailOk(to)) throw Object.assign(new Error('Email'), { code: 'email' });
  if (!(add > 0) || add > 1e6) throw Object.assign(new Error('Amount'), { code: 'amount' });
  await ensureWallet(u);
  const grant = await sha256('pod-dev-grant:' + norm(code));
  const batch = writeBatch(db);
  batch.update(ref(u.uid), { devGrant: grant, updatedAt: serverTimestamp() });
  batch.set(doc(collection(db, 'gifts')), { to, amount: add, from: nameOf(u), createdAt: serverTimestamp() });
  await batch.commit();
  await updateDoc(ref(u.uid), { devGrant: deleteField(), updatedAt: serverTimestamp() }).catch(() => {});
  return { to, amount: add };
}

// Collect any gifts waiting for the signed-in player's email. Returns [{ amount, from }].
async function claimGifts(u) {
  const email = (u.email || '').toLowerCase();
  if (!email) return [];
  const got = [];
  const snap = await getDocs(query(collection(db, 'gifts'), where('to', '==', email)));
  for (const g of snap.docs) {
    const { amount, from } = g.data();
    try {
      const batch = writeBatch(db);
      batch.update(ref(u.uid), { dough: increment(amount), giftClaim: g.id, updatedAt: serverTimestamp() });
      batch.delete(g.ref);
      await batch.commit();
      got.push({ amount, from });
    } catch {}
  }
  if (got.length) await updateDoc(ref(u.uid), { giftClaim: deleteField(), updatedAt: serverTimestamp() }).catch(() => {});
  return got;
}
