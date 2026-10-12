// The account button in the home page's top bar and its window: sign in with Google or with an
// email and password, create an account, reset a password, and sign out. Uses Firebase
// Authentication (firebase.js). The page works exactly the same when nobody is signed in.
import { onUser, signInGoogle, signInEmail, signUpEmail, resetPassword, signOutUser, authMessage } from './firebase.js?v=1';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const nameOf = u => u.displayName || (u.email || '').split('@')[0] || 'Player';
const initial = u => nameOf(u).trim()[0]?.toUpperCase() || '?';
const avatar = (u, cls = '') => (u.photoURL
  ? `<img class="acct-pic ${cls}" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`
  : `<span class="acct-pic acct-init ${cls}">${esc(initial(u))}</span>`);

let user = null, mode = 'signin', busy = false, note = '', err = '';

export function mountAccount() {
  const gear = document.getElementById('openSettings');
  if (!gear || document.getElementById('openAccount')) return;
  const btn = document.createElement('button');
  btn.className = 'gear acct-btn';
  btn.id = 'openAccount';
  btn.type = 'button';
  gear.before(btn);
  const dlg = document.createElement('dialog');
  dlg.className = 'settings acct';
  dlg.id = 'account';
  dlg.setAttribute('aria-labelledby', 'acctTitle');
  document.body.appendChild(dlg);
  btn.onclick = () => { err = note = ''; mode = 'signin'; draw(); dlg.showModal(); };
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  const paintButton = () => {
    btn.title = user ? `Signed in as ${nameOf(user)}` : 'Sign in';
    btn.setAttribute('aria-label', btn.title);
    btn.innerHTML = user ? `${avatar(user)}<span>${esc(nameOf(user))}</span>` : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg><span>Sign in</span>';
  };
  onUser(u => { user = u; paintButton(); if (dlg.open) draw(); });
  paintButton();

  function draw() {
    if (user) {
      dlg.innerHTML = `<form method="dialog">
        <div class="set-head"><h2 id="acctTitle">Your account</h2><button class="set-x" value="close" aria-label="Close">✕</button></div>
        <div class="acct-me">${avatar(user, 'big')}<div><strong>${esc(nameOf(user))}</strong><small>${esc(user.email || '')}</small></div></div>
        <p class="set-note">Signed in on this device. Your name fills in automatically when you join a table from this browser.</p>
        <div class="acct-row"><button type="button" class="acct-go ghost" data-a="out">Sign out</button></div>
      </form>`;
      dlg.querySelector('[data-a="out"]').onclick = async () => { await signOutUser().catch(() => {}); dlg.close(); };
      return;
    }
    const up = mode === 'signup', reset = mode === 'reset';
    dlg.innerHTML = `<form class="acct-form" novalidate>
      <div class="set-head"><h2 id="acctTitle">${up ? 'Create an account' : reset ? 'Reset your password' : 'Sign in'}</h2><button type="button" class="set-x" data-a="close" aria-label="Close">✕</button></div>
      ${reset ? '' : `<button type="button" class="acct-google" data-a="google" ${busy ? 'disabled' : ''}><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continue with Google</button>
      <p class="acct-or"><span>or with email</span></p>`}
      ${up ? '<label class="acct-field"><span>Your name</span><input name="name" autocomplete="name" maxlength="40" placeholder="What should we call you?"></label>' : ''}
      <label class="acct-field"><span>Email</span><input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
      ${reset ? '' : `<label class="acct-field"><span>Password</span><input name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6" placeholder="${up ? 'At least 6 characters' : 'Your password'}" required></label>`}
      ${err ? `<p class="acct-err" role="alert">${esc(err)}</p>` : ''}${note ? `<p class="acct-note" role="status">${esc(note)}</p>` : ''}
      <button type="submit" class="acct-go" ${busy ? 'disabled' : ''}>${busy ? 'One moment…' : up ? 'Create account' : reset ? 'Send reset email' : 'Sign in'}</button>
      <p class="acct-links">${up || reset ? '<button type="button" data-m="signin">I already have an account</button>' : '<button type="button" data-m="signup">Create an account</button><button type="button" data-m="reset">Forgot password?</button>'}</p>
    </form>`;
    const f = dlg.querySelector('form');
    dlg.querySelector('[data-a="close"]').onclick = () => dlg.close();
    dlg.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => { mode = b.dataset.m; err = note = ''; draw(); }; });
    const run = async work => {
      busy = true; err = note = ''; draw();
      try { const msg = await work(); if (msg) note = msg; else dlg.close(); }
      catch (e) { err = authMessage(e); }
      busy = false; if (dlg.open) draw();
    };
    dlg.querySelector('[data-a="google"]')?.addEventListener('click', () => run(() => signInGoogle()));
    f.onsubmit = e => {
      e.preventDefault();
      const el = f.elements, email = el.email.value, password = el.password?.value || '', name = el.namedItem('name')?.value || '';
      if (reset) return run(async () => { await resetPassword(email); return 'Check your inbox for a link to reset your password.'; });
      return run(() => (up ? signUpEmail(email, password, name) : signInEmail(email, password)));
    };
    f.elements.email?.focus();
  }
}
