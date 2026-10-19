// Firebase for Play On Display: the app, Authentication, and (where the browser supports it) Analytics.
// The site has no bundler, so the official modular SDK is loaded straight from Google's CDN.
// The web config below is public by design (it ships to every browser); access is protected by
// Firebase's own rules and the list of authorized domains in the Firebase console.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signOut,
  reauthenticateWithPopup, reauthenticateWithCredential, EmailAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA8T7hOlVPyt3kqSpRyKo7Uv8rx1WaP-xc',
  authDomain: 'play-on-display.firebaseapp.com',
  projectId: 'play-on-display',
  storageBucket: 'play-on-display.firebasestorage.app',
  messagingSenderId: '395255608270',
  appId: '1:395255608270:web:163d3ac705ef1f0f9b719f',
  measurementId: 'G-3WYLKQHGH1',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Cloud Firestore: each player's wallet (Dough) and the styles they own, at users/{uid}.
export const db = getFirestore(app);
auth.useDeviceLanguage();

// Analytics only where it can run (it isn't available in every browser or in the TV app's web view).
import('https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js')
  .then(async ({ getAnalytics, isSupported }) => { if (await isSupported()) getAnalytics(app); })
  .catch(() => {});

// Finish a Google sign-in that went through a full-page redirect (used when pop-ups are blocked).
getRedirectResult(auth).catch(() => {});

export const onUser = cb => onAuthStateChanged(auth, cb);
export const currentUser = () => auth.currentUser;

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try { return (await signInWithPopup(auth, provider)).user; }
  catch (e) {
    // Pop-up blocked (common on phones and TV web views): go to Google's page and come back.
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(auth, provider);
    throw e;
  }
}
export const signInEmail = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password).then(r => r.user);
export async function signUpEmail(email, password, name) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name?.trim()) await updateProfile(user, { displayName: name.trim().slice(0, 40) });
  return user;
}
export const resetPassword = email => sendPasswordResetEmail(auth, email.trim());
export const signOutUser = () => signOut(auth);

// Prove it's really the account owner again (Parent Controls: resetting a forgotten parent code).
export const signsInWithGoogle = () => !!auth.currentUser?.providerData.some(p => p.providerId === 'google.com');
export async function confirmOwner(password) {
  const u = auth.currentUser;
  if (!u) throw Object.assign(new Error('Not signed in'), { code: 'auth/user-not-found' });
  if (password == null && signsInWithGoogle()) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account', login_hint: u.email || '' });
    return reauthenticateWithPopup(u, provider);
  }
  return reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password || ''));
}

// Friendly words for Firebase's error codes.
export function authMessage(e) {
  const c = e?.code || '';
  return {
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/missing-password': 'Enter your password.',
    'auth/weak-password': 'Use at least 6 characters for your password.',
    'auth/email-already-in-use': 'There’s already an account with that email — sign in instead.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email yet — create one.',
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
    'auth/popup-closed-by-user': 'Sign-in was closed before it finished.',
    'auth/cancelled-popup-request': 'Sign-in was closed before it finished.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'auth/unauthorized-domain': 'This web address isn’t allowed to sign in yet (add it in the Firebase console under Authentication → Settings → Authorized domains).',
    'auth/user-mismatch': 'That’s a different account. Use the account these Parent Controls belong to.',
    'auth/operation-not-allowed': 'This sign-in method isn’t turned on yet (enable it in the Firebase console under Authentication → Sign-in method).',
  }[c] || 'Something went wrong. Please try again.';
}
