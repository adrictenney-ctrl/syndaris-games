// Scribble Chain on a phone: pick your word; draw what you're given on the pad (colours, two pen
// sizes, undo, clear) and tap Done; guess what a drawing shows. Pages hand in by themselves when
// the clock runs out.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=62';
import { PALETTE, SIZES, PAD_W, PAD_H } from './sketch.js?v=62';
import { fitCanvas, paint, drawStroke } from './sketch-pad.js?v=62';

let ctx = null, stepId = -1, strokes = [], pen = { c: 0, w: 1 }, live = null, autoT = null, clockT = null, endsAt = 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const COLORS = [0, 1, 2, 4, 5, 6, 7];      // a handful of the shared palette

export function reset() { stepId = -1; strokes = []; clearTimeout(autoT); clearInterval(clockT); document.getElementById('scPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('scPhone');
  if (!e) { e = document.createElement('div'); e.id = 'scPhone'; $('#status').after(e); }
  return e;
}

function submit() {
  const g = ctx.st.game;
  clearTimeout(autoT);
  if (g.done) return;
  if (g.phase === 'draw') ctx.send({ type: 'page', strokes });
  else if (g.phase === 'guess') ctx.send({ type: 'page', text: document.getElementById('scGuess')?.value || '' });
  navigator.vibrate?.(20);
}

function padSetup(cv) {
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round(((e.clientX - r.left) / r.width) * PAD_W), Math.round(((e.clientY - r.top) / r.height) * PAD_H)]; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); live = { c: pen.c, w: pen.w, p: pt(e) }; strokes.push(live); drawStroke(cv.getContext('2d'), live); });
  cv.addEventListener('pointermove', e => {
    if (!live) return;
    const [x, y] = pt(e), p = live.p;
    if (Math.hypot(x - p[p.length - 2], y - p[p.length - 1]) < 6) return;
    p.push(x, y);
    drawStroke(cv.getContext('2d'), live, p.length - 4);
  });
  const end = () => { live = null; };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Page', `${Math.min(g.step + 1, g.steps)}/${g.steps}`);
  setHud('#hudC', null);
  setHud('#hudR', 'Waiting on', g.waiting);
  $('#panel').innerHTML = '';
  renderHand([]);
  const e = el();
  const fresh = g.stepId !== stepId;
  if (fresh) { stepId = g.stepId; strokes = []; clearTimeout(autoT); clearInterval(clockT); }
  document.body.classList.toggle('myturn', !g.done && ['write', 'draw', 'guess'].includes(g.phase));

  if (g.phase === 'reveal' || g.phase === 'over') {
    setStatus(g.phase === 'over' ? 'All done!' : 'Watch the table', g.phase === 'over' ? 'Look at the table to play again' : g.revealOwner === you ? "It's your book — tap Next when everyone's laughed enough" : 'The books are being revealed');
    e.innerHTML = g.phase === 'reveal' && g.revealOwner === you ? '<button class="panel-btn go wide" id="scNext">Next page ›</button>' : '';
    document.getElementById('scNext')?.addEventListener('click', () => ctx.send({ type: 'next' }));
    return;
  }
  if (g.done) {
    setStatus('Handed in!', `Waiting for ${g.waiting} more…`);
    e.innerHTML = '<p class="sc-wait">Your page is in the book. ✓</p>';
    return;
  }
  // Hand in automatically just before the table's clock runs out.
  if (g.deadline && fresh) {
    endsAt = Date.now() + Math.max(0, g.deadline - Date.now());
    autoT = setTimeout(submit, Math.max(0, endsAt - Date.now() - 800));
    clockT = setInterval(() => { const k = document.getElementById('scClock'); if (k) k.textContent = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) + 's'; }, 250);
  }
  if (g.phase === 'write') {
    setStatus('Choose a secret word', 'Someone will have to draw it');
    e.innerHTML = `<div class="sc-words">${g.offer.map(w => `<button class="panel-btn" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
    e.querySelectorAll('[data-w]').forEach(b => { b.onclick = () => ctx.send({ type: 'page', word: b.dataset.w }); });
    return;
  }
  if (g.phase === 'guess') {
    setStatus('What is this?', 'Type your best guess');
    if (fresh || !document.getElementById('scGuess')) {
      e.innerHTML = `<div class="sc-paper"><canvas></canvas></div><p class="sc-time">Time left <b id="scClock"></b></p>
        <input id="scGuess" class="sc-input" maxlength="60" placeholder="It's a…" autocomplete="off"><button class="panel-btn go wide" id="scDone">Done</button>`;
      const cv = e.querySelector('canvas');
      fitCanvas(cv, Math.min(window.innerWidth - 36, 420));
      paint(cv, g.prev?.strokes || []);
      e.querySelector('#scDone').onclick = () => { if (!document.getElementById('scGuess').value.trim()) return toast('Type a guess first'); submit(); };
    }
    return;
  }
  // Drawing
  setStatus('Draw this:', g.prev?.text || '(they left it blank — draw anything!)');
  if (fresh || !e.querySelector('canvas')) {
    e.innerHTML = `<div class="sc-prompt">${esc(g.prev?.text || '…')}</div><div class="sc-paper"><canvas></canvas></div>
      <div class="sc-tools">${COLORS.map(i => `<button data-c="${i}" class="${pen.c === i ? 'on' : ''}" style="background:${PALETTE[i]}"></button>`).join('')}
        <button data-s="0" class="size ${pen.w === 0 ? 'on' : ''}"><i style="width:6px;height:6px"></i></button><button data-s="1" class="size ${pen.w === 1 ? 'on' : ''}"><i style="width:12px;height:12px"></i></button>
        <button data-x="undo">↶</button><button data-x="clear">✕</button></div>
      <div class="row"><span class="sc-time">Time left <b id="scClock"></b></span><button class="panel-btn go" id="scDone">Done</button></div>`;
    const cv = e.querySelector('canvas');
    fitCanvas(cv, Math.min(window.innerWidth - 36, 420));
    paint(cv, strokes);
    padSetup(cv);
    e.querySelector('.sc-tools').onclick = ev => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.c) pen.c = Number(b.dataset.c);
      if (b.dataset.s) pen.w = Number(b.dataset.s);
      if (b.dataset.x === 'undo') strokes.pop();
      if (b.dataset.x === 'clear') strokes = [];
      e.querySelectorAll('.sc-tools button').forEach(x => x.classList.toggle('on', (x.dataset.c && Number(x.dataset.c) === pen.c) || (x.dataset.s && Number(x.dataset.s) === pen.w)));
      paint(cv, strokes);
    };
    e.querySelector('#scDone').onclick = submit;
  }
}
