// Shared bits for the phone screens: toasts, the scoreboard header, and the hand of cards.
import { cardEl, setFace } from './cards.js?v=52';

export const $ = s => document.querySelector(s);

let toastT;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

// The three header blocks: left, centre chip, right.
export function setHud(id, label, value, sub = '') {
  const el = $(id);
  el.innerHTML = label === null ? '' : `<span>${label}</span><b>${value}</b><em>${sub}</em>`;
}

export function setStatus(main, sub = '') {
  $('#statusMain').textContent = main;
  $('#statusSub').textContent = sub;
}

// ---------------------------------------------------------------- the hand

let handKey = '';
let opts = {};

// cards: array of card ids. o: { dim: string[]|null, selected, faceDown, onTap(card), onSwipe(card), hint }
export function renderHand(cards, o = {}) {
  opts = o;
  const el = $('#hand');
  const key = cards.join(',') + (o.faceDown ? '|down' : '');
  if (key !== handKey) {
    handKey = key;
    el.innerHTML = '';
    for (const c of cards) {
      const ce = o.faceDown ? cardEl(null, true) : cardEl(c);
      ce.dataset.card = c;
      attachGestures(ce, c);
      el.appendChild(ce);
    }
  }
  el.classList.toggle('big', cards.length <= 2);
  el.classList.toggle('many', cards.length > 9);
  layoutHand();
  $('#handHint').textContent = o.hint || '';
}

export function layoutHand() {
  const el = $('#hand');
  const cards = [...el.children];
  const n = cards.length;
  if (!n) { el.style.width = '0'; return; }
  const cw = cards[0].offsetWidth;
  const avail = Math.min(el.parentElement.clientWidth - 16, 760);
  const spread = n <= 2 ? 0.92 : 0.82;
  const step = n > 1 ? Math.min(cw * spread, (avail - cw) / (n - 1)) : 0;
  // Big hands fan flatter so the ends don't curl off the screen.
  const flat = Math.min(1, 8 / n);
  el.style.width = `${cw + step * (n - 1)}px`;
  cards.forEach((ce, i) => {
    const off = i - (n - 1) / 2;
    const c = ce.dataset.card;
    const isSel = c === opts.selected;
    ce.style.position = 'absolute';
    ce.style.bottom = '0';
    ce.style.left = `${i * step}px`;
    ce.style.zIndex = String(i + 1);
    ce.style.transform = `translateY(${off * off * 3 * flat * flat - (isSel ? 30 : 0)}px) rotate(${off * (n <= 2 ? 6 : 4) * flat}deg)`;
    ce.classList.toggle('sel', isSel);
    ce.classList.toggle('dim', !!opts.dim && opts.dim.includes(c));
  });
}
window.addEventListener('resize', layoutHand);

// Send a card flying up off the phone, toward the table.
export function flyCard(card) {
  const ce = document.querySelector(`#hand .card[data-card="${card}"]`);
  if (!ce) return;
  ce.classList.add('fly');
  ce.style.transform = `translateY(-70vh) rotate(${Math.random() * 20 - 10}deg) scale(.8)`;
}

function attachGestures(ce, card) {
  let startY = null, dy = 0, base = '';
  ce.addEventListener('pointerdown', e => {
    startY = e.clientY;
    dy = 0;
    base = ce.style.transform;
    ce.style.transition = 'none';
    try { ce.setPointerCapture(e.pointerId); } catch {}
  });
  ce.addEventListener('pointermove', e => {
    if (startY === null) return;
    dy = Math.min(0, e.clientY - startY);
    if (opts.onSwipe) ce.style.transform = `translateY(${dy}px) ${base}`;
  });
  ce.addEventListener('pointerup', () => {
    if (startY === null) return;
    startY = null;
    ce.style.transition = '';
    if (dy < -70 && opts.onSwipe) return opts.onSwipe(card);
    ce.style.transform = base;
    if (Math.abs(dy) < 12) opts.onTap?.(card);
  });
  ce.addEventListener('pointercancel', () => { startY = null; ce.style.transition = ''; ce.style.transform = base; });
}

export function resetHand() {
  handKey = '';
  $('#hand').innerHTML = '';
}

export { cardEl, setFace };
