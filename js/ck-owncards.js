// Chef's Kiss "Write your own card": Ingredient Cards a signed-in player writes, saved to their
// account (Firestore users/{uid}/ckcards/s1…s5). Free accounts get 5 cards. A card is permanent:
// once saved it can't be changed or deleted (the Firestore rules allow create only).
// Each card belongs to one deck (Mild, Medium or Hot). At a table playing that deck, the card is
// dealt only into its writer's own hand, never anyone else's.
// (Later: a paid blank deck adds more slots.)
import { cardProblem, LIMITS } from './ck-custom.js?v=1';

export const FREE_CARDS = 5;
const SLOTS = Array.from({ length: FREE_CARDS }, (_, i) => 's' + (i + 1));
const DECKS = [['mild', 'Mild'], ['medium', 'Medium'], ['hot', 'Hot']];
const NAME = Object.fromEntries(DECKS);
const MAX = LIMITS.snack;   // 60 characters, like any Ingredient Card a player writes
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const FS = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const fb = () => import('./firebase.js?v=4');

// The signed-in account (or null), once Firebase has had a moment to say.
export async function whoIs() {
  const { onUser } = await fb();
  return new Promise(r => { const off = onUser(u => { r(u); setTimeout(() => off?.()); }); });
}

// This account's cards: [{ slot, text, level }], oldest first. [] when signed out.
export async function loadMine(user) {
  const u = user === undefined ? await whoIs() : user;
  if (!u) return [];
  const [{ db }, { collection, getDocs }] = await Promise.all([fb(), import(FS)]);
  const snap = await getDocs(collection(db, 'users', u.uid, 'ckcards'));
  return snap.docs.filter(d => SLOTS.includes(d.id)).map(d => ({ slot: d.id, text: String(d.data().text || ''), level: d.data().level }))
    .sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
}

async function saveCard(u, slot, text, level) {
  const [{ db }, { doc, setDoc, serverTimestamp }] = await Promise.all([fb(), import(FS)]);
  await setDoc(doc(db, 'users', u.uid, 'ckcards', slot), { text, level, createdAt: serverTimestamp() });
}

// What the phone sends the table: the cards for this table's deck, as the player's own Snack cards.
export const tableCards = (uid, cards) => cards.map(c => ({ id: `cc_o${String(uid).replace(/\W/g, '').slice(0, 20)}_${c.slot}`, text: c.text, level: c.level }));

const clean = t => String(t ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

// The window: sign in (if needed), your cards, and the form to write a new one.
// opts: { level: the deck the table has selected ('mild' | 'medium' | 'hot'), onSaved?(cards) }
export async function openOwnCards(opts = {}) {
  document.getElementById('ckOwn')?.remove();
  const dlg = document.createElement('dialog');
  dlg.id = 'ckOwn';
  dlg.className = 'ck-own';
  dlg.setAttribute('aria-labelledby', 'ckOwnTitle');
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  let user = null, cards = [], level = DECKS.some(([k]) => k === opts.level) ? opts.level : 'mild';
  let text = '', err = '', note = '', busy = false, confirm = false, loading = true, mode = 'signin';
  dlg.innerHTML = '<p class="ck-own-wait">One moment…</p>';
  dlg.showModal();

  const F = await fb();
  F.onUser(async u => {
    user = u; loading = !!u; draw();
    if (!u) return;
    try { cards = await loadMine(u); } catch { err = "Couldn't load your cards right now. Check your connection and try again."; }
    loading = false; draw();
  });

  function draw() {
    if (!dlg.isConnected) return;
    const head = `<div class="ck-own-head"><h2 id="ckOwnTitle">Write your own card</h2><button type="button" class="ck-own-x" data-a="close" aria-label="Close">✕</button></div>`;
    if (!user) {
      dlg.innerHTML = `${head}<form class="ck-own-body" novalidate>
        <p class="ck-own-lead">Sign in to write your own Ingredient Cards. Every account gets <b>${FREE_CARDS} free cards</b>. They're saved to your account, and only you get dealt them.</p>
        <button type="button" class="ck-own-google" data-a="google" ${busy ? 'disabled' : ''}>Continue with Google</button>
        <p class="ck-own-or"><span>or with email</span></p>
        <label class="ck-own-field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
        <label class="ck-own-field"><span>Password</span><input name="password" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" minlength="6" required></label>
        ${err ? `<p class="ck-own-err" role="alert">${esc(err)}</p>` : ''}
        <button type="submit" class="ck-own-go" ${busy ? 'disabled' : ''}>${busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        <p class="ck-own-links"><button type="button" data-a="mode">${mode === 'signup' ? 'I already have an account' : 'Create an account'}</button></p>
      </form>`;
      const f = dlg.querySelector('form');
      const run = async work => { busy = true; err = ''; draw(); try { await work(); } catch (e) { err = F.authMessage(e); } busy = false; draw(); };
      dlg.querySelector('[data-a="google"]').onclick = () => run(() => F.signInGoogle());
      dlg.querySelector('[data-a="mode"]').onclick = () => { mode = mode === 'signup' ? 'signin' : 'signup'; err = ''; draw(); };
      f.onsubmit = e => { e.preventDefault(); const em = f.elements.email.value, pw = f.elements.password.value; run(() => (mode === 'signup' ? F.signUpEmail(em, pw, '') : F.signInEmail(em, pw))); };
      wire();
      return;
    }
    if (loading) { dlg.innerHTML = `${head}<p class="ck-own-wait">Loading your cards…</p>`; wire(); return; }
    const left = FREE_CARDS - cards.length, slot = SLOTS.find(s => !cards.some(c => c.slot === s));
    const list = cards.length ? `<ul class="ck-own-list">${cards.map(c => `<li><span class="ck-own-deck">${NAME[c.level] || '?'}</span><span>${esc(c.text)}</span></li>`).join('')}</ul>` : '';
    const problem = text ? cardProblem({ type: 'snack', text }) : null;
    const form = !slot ? `<p class="ck-own-done">You've written all ${FREE_CARDS} of your free cards.</p>` : confirm
      ? `<div class="ck-own-confirm" role="alert"><p><b>Save this card for good?</b> Once it's saved you can't change it or delete it.</p>
          <div class="ck-own-card"><small>${NAME[level]} deck</small><p>${esc(clean(text))}</p></div>
          <div class="ck-own-row"><button type="button" class="ck-own-go ghost" data-a="back">Go back</button><button type="button" class="ck-own-go" data-a="save" ${busy ? 'disabled' : ''}>${busy ? 'Saving…' : 'Save it for good'}</button></div></div>`
      : `<form class="ck-own-form" novalidate>
          <label class="ck-own-field"><span>Deck</span><select name="level">${DECKS.map(([k, n]) => `<option value="${k}" ${k === level ? 'selected' : ''}>${n}${k === opts.level ? ' (this table)' : ''}</option>`).join('')}</select></label>
          <label class="ck-own-field"><span>Your card <i class="ck-own-count${clean(text).length > MAX ? ' over' : ''}">${clean(text).length}/${MAX}</i></span>
            <input name="text" maxlength="${MAX + 10}" value="${esc(text)}" placeholder="A kitten who judges your life choices" autocomplete="off" enterkeyhint="done"></label>
          <div class="ck-own-card" aria-hidden="true"><small>${NAME[level]} deck</small><p>${esc(clean(text)) || '<i>Your words go here</i>'}</p></div>
          ${err || problem ? `<p class="ck-own-err" role="alert">${esc(err || problem)}</p>` : ''}
          <button type="submit" class="ck-own-go" ${!text.trim() || problem ? 'disabled' : ''}>Save card</button>
        </form>`;
    dlg.innerHTML = `${head}<div class="ck-own-body">
      <p class="ck-own-lead">Your cards go into the deck you pick and are dealt only to you, whenever you play that deck. <b>${left} of ${FREE_CARDS}</b> free cards left.</p>
      ${note ? `<p class="ck-own-note" role="status">${esc(note)}</p>` : ''}
      ${form}${list ? `<h3 class="ck-own-h">Your cards</h3>${list}` : ''}
    </div>`;
    const f = dlg.querySelector('.ck-own-form');
    if (f) {
      const inp = f.elements.text;
      f.elements.level.onchange = e => { level = e.target.value; draw(); };
      inp.oninput = () => {
        text = inp.value; err = ''; note = '';
        const n = clean(text).length, p = text ? cardProblem({ type: 'snack', text }) : null;
        f.querySelector('.ck-own-count').textContent = `${n}/${MAX}`;
        f.querySelector('.ck-own-count').classList.toggle('over', n > MAX);
        f.querySelector('.ck-own-card p').innerHTML = esc(clean(text)) || '<i>Your words go here</i>';
        f.querySelector('[type="submit"]').disabled = !text.trim() || !!p;
        let e = f.querySelector('.ck-own-err');
        if (p) { if (!e) { e = document.createElement('p'); e.className = 'ck-own-err'; e.setAttribute('role', 'alert'); f.querySelector('[type="submit"]').before(e); } e.textContent = p; } else e?.remove();
      };
      f.onsubmit = e => { e.preventDefault(); if (!text.trim() || cardProblem({ type: 'snack', text })) return; confirm = true; draw(); };
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
    dlg.querySelector('[data-a="back"]')?.addEventListener('click', () => { confirm = false; draw(); });
    dlg.querySelector('[data-a="save"]')?.addEventListener('click', async () => {
      busy = true; draw();
      try {
        const t = clean(text);
        await saveCard(user, slot, t, level);
        cards = [...cards, { slot, text: t, level }];
        text = ''; confirm = false; note = `Saved to your ${NAME[level]} deck.`;
        opts.onSaved?.(cards);
      } catch (e) {
        confirm = false;
        err = e?.code === 'permission-denied' ? "Your account couldn't save that card. (The site's Firebase rules may not be set up for player cards yet.)" : "Couldn't save it right now. Check your connection and try again.";
      }
      busy = false; draw();
    });
    wire();
  }
  function wire() { dlg.querySelector('[data-a="close"]')?.addEventListener('click', () => dlg.close()); }
}
