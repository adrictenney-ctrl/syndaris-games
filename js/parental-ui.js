// The Parent Controls window (opened from Settings on the home page). A parent signs in, sets a
// parent code, then chooses games their kids can't open and words to keep out of the card and word
// games. Everything is saved to their account in Firestore at parental/{uid} = { pin, games, words }
// (the code is stored only as a hash), and a copy is kept on this screen (js/parental.js) so it
// applies right away and keeps applying if someone signs out. Only the parent code changes it.
import { db, onUser, currentUser, confirmOwner, signsInWithGoogle, authMessage } from './firebase.js?v=3';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getParental, setParental, clearParental, hashPin, makeBlocker } from './parental.js?v=1';
import { GAMES } from './games.js?v=95';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ref = uid => doc(db, 'parental', uid);
const PIN_OK = p => /^\d{4,8}$/.test(p);
// The games whose cards, prompts or words the blocked-word list cleans up.
export const WORD_GAMES = ["Chef's Kiss", 'Wrong Number', 'Don’t Say It', 'Sketch & Guess', 'Scribble Chain', 'One Clue', 'Pass the Phrase', 'Hot Takes', 'Emoji Story', 'Fake Movie Pitch', 'and the other talk-and-laugh games'];

let user = null, saved = null, loaded = false, rulesErr = false;
let dlg = null, unlocked = false, view = 'games', q = '', msg = '', err = '', busy = false, resetting = false;
let pending = null, saveTimer = null;

// ---------------------------------------------------------------- keeping this screen in step with the account
let stopDoc = null;
export function watchParental(onChange) {
  return onUser(u => {
    stopDoc?.(); stopDoc = null;
    user = u; saved = null; loaded = !u; rulesErr = false; unlocked = false;
    if (u) {
      stopDoc = onSnapshot(ref(u.uid), snap => {
        loaded = true; rulesErr = false;
        saved = snap.exists() ? snap.data() : null;
        const local = getParental();
        if (saved) setParental({ uid: u.uid, pin: saved.pin, games: saved.games || [], words: saved.words || [] });
        // Turned off on another screen: turn them off here too (only this account's own copy).
        else if (local && local.uid === u.uid) clearParental();
        onChange?.(); if (dlg?.open) draw();
      }, e => { loaded = true; rulesErr = e?.code === 'permission-denied'; onChange?.(); if (dlg?.open) draw(); });
    }
    onChange?.(); if (dlg?.open) draw();
  });
}

export function summary() {
  const p = getParental();
  if (!p) return 'Off';
  const g = p.games.length, w = p.words.length;
  return `On · ${g} ${g === 1 ? 'game' : 'games'} off · ${w} blocked ${w === 1 ? 'word' : 'words'}`;
}

// ---------------------------------------------------------------- saving
async function save(next, { now = false } = {}) {
  const u = currentUser();
  saved = { ...(saved || {}), ...next };
  setParental({ uid: u.uid, pin: saved.pin, games: saved.games || [], words: saved.words || [] });
  pending = { pin: saved.pin, games: saved.games || [], words: saved.words || [] };
  clearTimeout(saveTimer);
  const push = async () => {
    const data = pending; pending = null;
    try { await setDoc(ref(u.uid), { ...data, updatedAt: serverTimestamp() }); status('Saved to your account'); }
    catch (e) { status(e?.code === 'permission-denied' ? 'Saved on this screen only: your account isn’t set up for Parent Controls yet (see the note below).' : 'Saved on this screen. It will reach your account when you’re back online.', true); }
  };
  if (now) await push(); else saveTimer = setTimeout(push, 500);
}
function status(text, bad = false) {
  const el = dlg?.querySelector('.pc-status');
  if (el) { el.textContent = text; el.classList.toggle('bad', bad); }
}

// ---------------------------------------------------------------- the window
export function openParental() {
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.className = 'settings acct pc';
    dlg.setAttribute('aria-labelledby', 'pcTitle');
    document.body.appendChild(dlg);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { unlocked = false; resetting = false; msg = err = ''; });
  }
  msg = err = ''; q = ''; view = 'games';
  draw();
  dlg.showModal();
}

const head = title => `<div class="set-head"><h2 id="pcTitle">${title}</h2><button type="button" class="set-x" data-a="close" aria-label="Close">✕</button></div>`;
const pinField = (name, label, auto = 'off') => `<label class="acct-field"><span>${label}</span><input name="${name}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="${auto}" placeholder="4 to 8 numbers"></label>`;
const notes = () => `${err ? `<p class="acct-err" role="alert">${esc(err)}</p>` : ''}${msg ? `<p class="acct-note" role="status">${esc(msg)}</p>` : ''}`;
const RULES_NOTE = '<p class="set-note pc-warn">This account can’t save Parent Controls yet. In the Firebase console, add the <b>parental</b> rule to Firestore (see the README).</p>';

function draw() {
  if (!dlg) return;
  const local = getParental();
  let html;
  if (!user) {
    html = local
      ? `${head('Parent Controls')}<p class="pc-lead">Parent Controls are <b>on</b> for this screen: ${esc(summary().replace(/^On · /, ''))}.</p>
         <p class="set-note">Sign in with the parent’s account to change them.</p>
         <div class="acct-row"><span></span><button type="button" class="acct-go" data-a="signin">Sign in</button></div>`
      : `${head('Parent Controls')}<p class="pc-lead">Choose which games your kids can open on this screen, and keep words you don’t want out of the card and word games.</p>
         <p class="set-note">Parent Controls are saved to your account, so sign in first. A parent code keeps them from being changed.</p>
         <div class="acct-row"><span></span><button type="button" class="acct-go" data-a="signin">Sign in to set up</button></div>`;
  } else if (!loaded) {
    html = `${head('Parent Controls')}<p class="pc-lead">Loading…</p>`;
  } else if (!saved && local && local.uid !== user.uid) {
    // This screen has another account's Parent Controls on it.
    html = `${head('Parent Controls')}<form class="acct-form" data-f="foreign">
      <p class="pc-lead">This screen has Parent Controls from a different account. Sign in with that account to change them, or enter its parent code to remove them from this screen.</p>
      ${pinField('pin', 'That account’s parent code')}${notes()}
      <button type="submit" class="acct-go">Remove from this screen</button></form>`;
  } else if (!saved) {
    html = `${head('Set up Parent Controls')}<form class="acct-form" data-f="setup">
      <p class="pc-lead">Choose which games your kids can open on screens signed in to your account, and keep words you don’t want out of the card and word games.</p>
      ${pinField('pin', 'Choose a parent code', 'new-password')}${pinField('pin2', 'Type it again', 'new-password')}
      <p class="set-note">You’ll need this code to change or turn off Parent Controls. Kids shouldn’t know it.</p>${rulesErr ? RULES_NOTE : ''}${notes()}
      <button type="submit" class="acct-go" ${busy ? 'disabled' : ''}>Turn on Parent Controls</button></form>`;
  } else if (resetting) {
    const google = signsInWithGoogle();
    html = `${head('Forgot the code?')}<form class="acct-form" data-f="reset">
      <p class="pc-lead">Prove it’s you by signing in to <b>${esc(user.email || 'your account')}</b> again, then choose a new code.</p>
      ${google ? '' : '<label class="acct-field"><span>Account password</span><input name="password" type="password" autocomplete="current-password"></label>'}
      ${pinField('pin', 'New parent code', 'new-password')}${pinField('pin2', 'Type it again', 'new-password')}${notes()}
      <div class="acct-row"><button type="button" class="acct-go ghost" data-a="back">Back</button><button type="submit" class="acct-go" ${busy ? 'disabled' : ''}>${google ? 'Confirm with Google' : 'Set new code'}</button></div></form>`;
  } else if (!unlocked) {
    html = `${head('Parent Controls')}<form class="acct-form" data-f="unlock">
      <p class="pc-lead">Parent Controls are <b>on</b>: ${esc(summary().replace(/^On · /, ''))}.</p>
      ${pinField('pin', 'Parent code', 'current-password')}${notes()}
      <button type="submit" class="acct-go">Unlock</button>
      <p class="acct-links"><button type="button" data-a="forgot">Forgot the code?</button></p></form>`;
  } else {
    html = `${head('Parent Controls')}
      <div class="pc-tabs" role="tablist">${[['games', 'Games'], ['words', 'Blocked words'], ['code', 'Parent code']].map(([k, t]) => `<button type="button" role="tab" data-v="${k}" aria-selected="${view === k}">${t}</button>`).join('')}</div>
      <div class="pc-body">${view === 'games' ? gamesView() : view === 'words' ? wordsView() : codeView()}</div>
      <p class="pc-status" role="status"></p>${rulesErr ? RULES_NOTE : ''}
      <div class="acct-row"><button type="button" class="acct-go ghost" data-a="off">Turn off</button><button type="button" class="acct-go" data-a="lock">Lock and close</button></div>`;
  }
  dlg.innerHTML = html;
  wire();
}

const gameList = () => Object.values(GAMES).filter(G => G?.id && G.name).sort((a, b) => a.name.localeCompare(b.name));
function gamesView() {
  const off = new Set(saved.games || []);
  const rows = gameList().filter(G => !q || G.name.toLowerCase().includes(q.toLowerCase()));
  return `<p class="set-note pc-intro">Turned-off games are hidden on screens signed in to this account, and they won’t open.</p>
    <input class="pc-search" type="search" placeholder="Find a game…" value="${esc(q)}" aria-label="Find a game">
    <p class="pc-count">${off.size} ${off.size === 1 ? 'game' : 'games'} turned off</p>
    <ul class="pc-games">${rows.map(G => `<li><label><span>${esc(G.name)}</span><input type="checkbox" role="switch" data-g="${esc(G.id)}" ${off.has(G.id) ? '' : 'checked'}><i aria-hidden="true"></i></label></li>`).join('') || '<li class="pc-none">No games match.</li>'}</ul>`;
}
function wordsView() {
  const words = saved.words || [];
  return `<p class="set-note pc-intro">Cards, prompts and words with these are left out of ${esc(WORD_GAMES.join(', '))}. Players also can’t play their own cards with them.</p>
    <form class="pc-add" data-f="word"><input name="w" maxlength="40" placeholder="Add a word or phrase" autocomplete="off" aria-label="Word to block"><button type="submit" class="acct-go">Add</button></form>${notes()}
    <ul class="pc-words">${words.map((w, i) => `<li>${esc(w)}<button type="button" data-rm="${i}" aria-label="Remove ${esc(w)}">✕</button></li>`).join('') || '<li class="pc-none">No blocked words yet.</li>'}</ul>`;
}
function codeView() {
  return `<form class="acct-form" data-f="change"><p class="set-note pc-intro">Change the code that unlocks Parent Controls.</p>
    ${pinField('pin', 'New parent code', 'new-password')}${pinField('pin2', 'Type it again', 'new-password')}${notes()}
    <button type="submit" class="acct-go">Change code</button></form>`;
}

function wire() {
  const $ = s => dlg.querySelector(s);
  $('[data-a="close"]')?.addEventListener('click', () => dlg.close());
  $('[data-a="signin"]')?.addEventListener('click', () => { dlg.close(); document.getElementById('openAccount')?.click(); });
  $('[data-a="forgot"]')?.addEventListener('click', () => { resetting = true; msg = err = ''; draw(); });
  $('[data-a="back"]')?.addEventListener('click', () => { resetting = false; msg = err = ''; draw(); });
  $('[data-a="lock"]')?.addEventListener('click', () => dlg.close());
  $('[data-a="off"]')?.addEventListener('click', async () => {
    if (!confirm('Turn off Parent Controls? Every game opens again and no words are blocked.')) return;
    clearParental();
    try { await deleteDoc(ref(user.uid)); } catch {}
    saved = null; unlocked = false; msg = 'Parent Controls are off.'; draw();
  });
  dlg.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => { view = b.dataset.v; msg = err = ''; draw(); }; });
  const search = $('.pc-search');
  if (search) {
    search.oninput = () => { q = search.value; const pos = search.selectionStart; dlg.querySelector('.pc-body').innerHTML = gamesView(); wire(); const s2 = dlg.querySelector('.pc-search'); s2.focus(); s2.setSelectionRange(pos, pos); };
  }
  dlg.querySelectorAll('[data-g]').forEach(cb => {
    cb.onchange = () => {
      const off = new Set(saved.games || []);
      if (cb.checked) off.delete(cb.dataset.g); else off.add(cb.dataset.g);
      save({ games: [...off] });
      const n = off.size, c = dlg.querySelector('.pc-count');
      if (c) c.textContent = `${n} ${n === 1 ? 'game' : 'games'} turned off`;
    };
  });
  dlg.querySelectorAll('[data-rm]').forEach(b => { b.onclick = () => { const w = [...(saved.words || [])]; w.splice(Number(b.dataset.rm), 1); save({ words: w }); msg = err = ''; draw(); }; });
  dlg.querySelectorAll('form[data-f]').forEach(f => { f.onsubmit = e => { e.preventDefault(); submit(f.dataset.f, f); }; });
  (dlg.querySelector('input[name="pin"]') || dlg.querySelector('input[name="w"]'))?.focus();
}

async function submit(kind, f) {
  const v = n => f.elements[n]?.value?.trim() || '';
  msg = err = '';
  const newPin = () => {
    if (!PIN_OK(v('pin'))) { err = 'Use 4 to 8 numbers for the code.'; return null; }
    if (v('pin') !== v('pin2')) { err = 'The two codes don’t match.'; return null; }
    return v('pin');
  };
  if (kind === 'setup') {
    const pin = newPin(); if (!pin) return draw();
    busy = true; draw();
    await save({ pin: await hashPin(user.uid, pin), games: [], words: [] }, { now: true });
    busy = false; unlocked = true; view = 'games'; draw();
    status('Parent Controls are on. Turn off games or add blocked words below.');
    return;
  }
  if (kind === 'unlock') {
    if ((await hashPin(user.uid, v('pin'))) === saved.pin) { unlocked = true; view = 'games'; }
    else err = 'That code isn’t right.';
    return draw();
  }
  if (kind === 'foreign') {
    const local = getParental();
    if (local && (await hashPin(local.uid, v('pin'))) === local.pin) { clearParental(); msg = 'Removed from this screen.'; }
    else err = 'That code isn’t right.';
    return draw();
  }
  if (kind === 'reset') {
    const pin = newPin(); if (!pin) return draw();
    busy = true; draw();
    try {
      await confirmOwner(signsInWithGoogle() ? null : v('password'));
      await save({ pin: await hashPin(user.uid, pin) }, { now: true });
      resetting = false; unlocked = true; view = 'games'; busy = false; draw(); status('New code saved.');
    } catch (e) { busy = false; err = authMessage(e); draw(); }
    return;
  }
  if (kind === 'change') {
    const pin = newPin(); if (!pin) return draw();
    await save({ pin: await hashPin(user.uid, pin) }, { now: true });
    msg = 'New code saved.'; return draw();
  }
  if (kind === 'word') {
    const w = v('w').toLowerCase().replace(/\s+/g, ' ');
    if (!w) return;
    const words = saved.words || [];
    if (words.includes(w)) { err = `“${w}” is already blocked.`; return draw(); }
    if (w.length < 2) { err = 'Use at least 2 letters.'; return draw(); }
    await save({ words: [...words, w].slice(0, 300) });
    // A very short or very common word can hide a lot: say how much, so the parent knows.
    msg = `Blocked “${w}”.`;
    view = 'words'; draw();
  }
}

// How many entries in a list a word would remove (used by tests and for the parent's information).
export const countBlocked = (list, words) => { const b = makeBlocker(words); return list.filter(t => b(String(t))).length; };
