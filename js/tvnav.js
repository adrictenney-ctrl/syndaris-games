// TV remote support: arrow keys move a highlight between everything you can press,
// OK/Enter presses it, Back steps out (asking first if a game is in progress).
// Turns on automatically inside the Play On Display TV app, with ?tv=1 in the address,
// or the first time someone presses an arrow key.

const FOCUSABLE = 'a[href], button, input, select, [data-tv]';
const isTV = /PlayOnDisplayTV/.test(navigator.userAgent) || new URLSearchParams(location.search).has('tv');
try { if (isTV) sessionStorage.setItem('pod.tv', '1'); } catch {}
let tvMode = isTV;
try { tvMode = tvMode || sessionStorage.getItem('pod.tv') === '1'; } catch {}
if (tvMode) document.documentElement.classList.add('tv');

let navOn = tvMode;
const visible = el => {
  if (el.disabled || el.closest('[hidden]') || el.getAttribute('aria-hidden') === 'true') return false;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return false;
  const st = getComputedStyle(el);
  return st.visibility !== 'hidden' && st.display !== 'none' && Number(st.opacity) > 0.05;
};
const candidates = () => [...document.querySelectorAll(FOCUSABLE)].filter(visible);
const centre = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };

// The obvious thing to start on: an open scoring slip's button, the Deal button, or the first game.
function home() {
  const pref = ['#overlay:not([hidden]) button', '#startBtn:not([disabled])', '.box', '.seat .addbot', '#joinBtn', 'button', 'a[href]'];
  for (const sel of pref) {
    const el = [...document.querySelectorAll(sel)].find(visible);
    if (el) return el;
  }
  return candidates()[0];
}

function focus(el) {
  if (!el) return;
  document.querySelectorAll('.tv-focus').forEach(e => e.classList.remove('tv-focus'));
  el.classList.add('tv-focus');
  el.focus({ preventScroll: true });
  const r = el.getBoundingClientRect();
  if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView?.({ block: 'center', inline: 'nearest' });
}

function move(dir) {
  const cur = document.activeElement && document.activeElement !== document.body && visible(document.activeElement) ? document.activeElement : null;
  // If a scoring slip is open, keep the highlight inside it.
  const overlay = document.querySelector('#overlay:not([hidden])');
  let pool = candidates();
  if (overlay) pool = pool.filter(el => overlay.contains(el));
  if (!cur || (overlay && !overlay.contains(cur))) return focus(pool.includes(home()) ? home() : pool[0] || home());
  const a = centre(cur);
  let best = null, bestScore = Infinity;
  for (const el of pool) {
    if (el === cur) continue;
    const b = centre(el);
    const dx = b.x - a.x, dy = b.y - a.y;
    const along = { left: -dx, right: dx, up: -dy, down: dy }[dir];
    const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    if (along <= 4) continue;
    const score = along + across * 2.2;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) focus(best);
}

const DIRS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

document.addEventListener('keydown', e => {
  const dir = DIRS[e.key];
  if (!dir) return;
  const el = document.activeElement;
  // Text fields and sliders keep left/right for themselves.
  if (el && (el.type === 'range' || el.type === 'text') && (dir === 'left' || dir === 'right')) return;
  if (!navOn) {
    navOn = true;
    document.documentElement.classList.add('tv-nav');
  }
  e.preventDefault();
  move(dir);
}, true);

// OK/Enter on things browsers don't "press" by themselves: dropdowns, checkboxes, board squares.
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const el = document.activeElement;
  if (!el) return;
  if (el.tagName === 'SELECT') { e.preventDefault(); try { el.showPicker(); } catch { el.click(); } }
  else if (el.type === 'checkbox') { e.preventDefault(); el.click(); }
  else if (el.hasAttribute('data-tv')) { e.preventDefault(); el.click(); }
}, true);

if (navOn) document.documentElement.classList.add('tv-nav');
document.addEventListener('focusin', e => {
  document.querySelectorAll('.tv-focus').forEach(x => x !== e.target && x.classList.remove('tv-focus'));
  if (navOn && e.target.matches?.(FOCUSABLE)) e.target.classList.add('tv-focus');
});

// Things that appear (a scoring slip, the lobby after a game) take the highlight.
new MutationObserver(() => {
  if (!navOn) return;
  const cur = document.activeElement;
  if (!cur || cur === document.body || !visible(cur)) {
    clearTimeout(window.__podRefocus);
    window.__podRefocus = setTimeout(() => focus(home()), 120);
  }
}).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'disabled'] });

if (navOn) window.addEventListener('load', () => setTimeout(() => focus(home()), 400));

// The TV app asks this before going back. During a game, the first Back only warns.
let backArmed = 0;
window.podBack = () => {
  const inGame = document.body.classList.contains('in-game');
  if (!inGame) return false;
  if (Date.now() - backArmed < 3000) return false;
  backArmed = Date.now();
  let t = document.getElementById('tvToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tvToast';
    document.body.appendChild(t);
  }
  t.textContent = 'Press Back again to leave the table. The game is saved.';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
  return true;
};

export const tv = tvMode;
