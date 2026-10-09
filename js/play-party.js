// The phone for the party games. Each engine describes what the phone should show in its view
// (view.ui) and this draws it:
//   k: 'wait'     — just a message (and maybe a card)
//   k: 'fields'   — one or more text boxes and a Send button; drafts reach the table as you type,
//                   so nothing is lost if the clock runs out. radio: pick one of the fields too.
//   k: 'pick'     — a list (or grid) of choices, tap one. cards: true draws them as playing cards.
//   k: 'toggles'  — a list you can tick on and off, then Done
//   k: 'buttons'  — a row of big buttons
//   k: 'draw'     — a sketch pad with colours, Undo/Clear and Done (strokes are drafted too)
//   k: 'tap'      — one huge button for mashing: taps are counted on the phone and sent in small
//                   batches (as drafts, so the whole room isn't re-sent every tap)
// Shared extras: title/sub (the status lines), card {kicker, big, small, list}, hands [{name, cards}]
// (other players' cards to look at), html (ready-made markup from the engine), hud [[label, value, sub], …],
// left (ms on the clock), myturn, buzz (vibrate on a new key), buttons (under a pick).
// Anywhere in the text, @3@ is replaced by the name of the player in seat 3.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { esc } from './party.js?v=68';
import { PALETTE } from './sketch.js?v=68';
import { fitCanvas, paint, drawStroke } from './sketch-pad.js?v=68';
import { PAD_W, PAD_H } from './sketch.js?v=68';

let ctx = null, key = null, clockT = null, endAt = 0, draftT = null, radio = -1;
let strokes = [], pen = { c: 0, w: 1 }, live = null;
let taps = 0, tapT = null;
function flushTaps() { tapT = null; if (taps) { ctx.raw({ t: 'ink', draft: { taps } }); taps = 0; } }
export function reset() { document.body.classList.remove('party-game'); key = null; strokes = []; clearInterval(clockT); clockT = null; document.getElementById('ptPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}`; };
const nm = t => String(t ?? '').replace(/@(\d+)@/g, (_, s) => ctx.nameOf(Number(s)));
const E = t => esc(nm(t));
const cardHTML = c => (c ? `<div class="pp-card ${c.cls || ''}">${c.kicker ? `<small>${E(c.kicker)}</small>` : ''}${c.big ? `<b>${E(c.big)}</b>` : ''}${c.small ? `<p>${E(c.small)}</p>` : ''}${c.list ? `<ul>${c.list.map(x => `<li>${E(x)}</li>`).join('')}</ul>` : ''}</div>` : '');
// A small playing card: big label, small sub, colour, or ready-made art.
const mini = o => `<span class="pp-mini ${o.cls || ''}" style="${o.color ? `--c:${o.color}` : ''}">${o.art || `<b>${E(o.label)}</b>${o.sub ? `<small>${E(o.sub)}</small>` : ''}`}</span>`;
const handsHTML = hs => (hs ? `<div class="pp-hands">${hs.map(h => `<div class="pp-handrow"><span class="nm">${h.dot != null ? `<i style="background:var(--seat-${h.dot})"></i>` : ''}${E(h.name)}</span><div>${h.cards.map(mini).join('') || '<em>no cards</em>'}</div></div>`).join('')}</div>` : '');

function vals() { return [...document.querySelectorAll('#ptPhone .pp-field input')].map(i => i.value); }
function sendFields(u) {
  if (u.radio && radio < 0) return toast(u.radio);
  const v = vals();
  if (u.need && v.filter(x => x.trim()).length < u.need) return toast(u.needMsg || 'Fill it in first');
  ctx.send({ type: u.act || 'answer', vals: v, pick: radio });
  navigator.vibrate?.(20);
}
function sendDraw() { ctx.send({ type: (ctx.st.game.ui || {}).act || 'draw', strokes }); navigator.vibrate?.(20); }
function draftDraw() { clearTimeout(draftT); draftT = setTimeout(() => ctx.raw({ t: 'ink', draft: { strokes } }), 350); }

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
  const end = () => { if (live) draftDraw(); live = null; };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

export function render(c) {
  ctx = c;
  document.body.classList.add('party-game');
  const g = c.st.game, you = c.st.you, u = g.ui || { k: 'wait', title: '' };
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}${g.teamName ? ` · <span class="pt-team t${g.myTeam}">${esc(g.teamName)}</span>` : ''}`;
  const hud = g.hud || [];
  setHud('#hudL', ...(hud[0] || [null]));
  setHud('#hudR', ...(hud[1] || [null]));
  // The clock runs from the table's time left, not the phone's own clock.
  if (g.left > 0) {
    endAt = Date.now() + g.left;
    $('#hudC').innerHTML = '<span>Time</span><b class="pp-clock"></b>';
    if (!clockT) clockT = setInterval(() => { const k = document.querySelector('#hudC .pp-clock'); if (k) { const l = endAt - Date.now(); k.textContent = fmt(l); k.classList.toggle('low', l < 6000); } }, 200);
  } else { clearInterval(clockT); clockT = null; setHud('#hudC', ...(hud[2] || [null])); }
  setStatus(nm(u.title), nm(u.sub));
  document.body.classList.toggle('myturn', !!u.myturn);
  $('#panel').innerHTML = '';
  renderHand([]);
  let el = document.getElementById('ptPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ptPhone';
    $('#status').after(el);
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-v],[data-b],[data-r],[data-send],[data-t],[data-pen],[data-x]');
      if (!b || b.disabled) return;
      const U = ctx.st.game.ui || {};
      if (b.dataset.v != null) { ctx.send({ type: U.act || 'pick', v: isNaN(b.dataset.v) || b.dataset.v === '' ? b.dataset.v : Number(b.dataset.v) }); navigator.vibrate?.(15); }
      else if (b.dataset.t != null) { ctx.send({ type: U.act || 'toggle', v: Number(b.dataset.t) }); navigator.vibrate?.(10); }
      else if (b.dataset.b != null) { const B = U.buttons[Number(b.dataset.b)]; ctx.send({ type: B.type, ...(B.payload || {}) }); navigator.vibrate?.(B.buzz ? [60, 30, 60] : 20); }
      else if (b.dataset.r != null) { radio = Number(b.dataset.r); el.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', Number(x.dataset.r) === radio)); ctx.raw({ t: 'ink', draft: { vals: vals(), pick: radio } }); }
      else if (b.dataset.send != null) (U.k === 'draw' ? sendDraw() : sendFields(U));
      else if (b.dataset.pen != null) {
        const [k2, v] = b.dataset.pen.split(':');
        pen[k2] = Number(v);
        el.querySelectorAll('[data-pen]').forEach(x => x.classList.toggle('on', x.dataset.pen === `c:${pen.c}` || x.dataset.pen === `w:${pen.w}`));
      } else if (b.dataset.x) {
        if (b.dataset.x === 'undo') strokes.pop(); else strokes = [];
        paint(el.querySelector('canvas'), strokes);
        draftDraw();
      }
    });
    el.addEventListener('pointerdown', e => {
      const b = e.target.closest('[data-tap]');
      if (!b) return;
      e.preventDefault();
      taps++;
      b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
      const n = el.querySelector('.pp-tapn'); if (n) n.textContent = String(Number(n.textContent || 0) + 1);
      navigator.vibrate?.(8);
      if (!tapT) tapT = setTimeout(flushTaps, 250);
    });
    el.addEventListener('input', e => {
      if (!e.target.closest('.pp-field')) return;
      clearTimeout(draftT);
      draftT = setTimeout(() => ctx.raw({ t: 'ink', draft: { vals: vals(), pick: radio } }), 400);
    });
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !e.target.closest('.pp-field')) return;
      const ins = [...el.querySelectorAll('.pp-field input')], i = ins.indexOf(e.target);
      if (i < ins.length - 1) ins[i + 1].focus(); else sendFields(ctx.st.game.ui);
    });
  }
  const k = JSON.stringify([u.key ?? g.moveId, u.k]);
  const fresh = k !== key;
  if (fresh && u.buzz && key !== null) navigator.vibrate?.([70, 40, 70]);
  key = k;
  // Text boxes and the sketch pad are only rebuilt for a new question, so work is never wiped by an update.
  if ((u.k === 'fields' || u.k === 'draw') && !fresh) { el.querySelector('.pp-cardslot').innerHTML = cardHTML(u.card); return; }
  if (fresh) { radio = u.k === 'fields' && u.radioAt != null ? u.radioAt : -1; if (u.k === 'draw') strokes = []; }
  let h = `<div class="pp-cardslot">${cardHTML(u.card)}</div>${nm(u.html || '')}${handsHTML(u.hands)}`;
  if (u.k === 'fields') {
    h += `<div class="pp-fields ${u.compact ? 'compact' : ''}">${u.fields.map((f, i) => `<label class="pp-field">${u.radio ? `<button type="button" class="pp-radio ${radio === i ? 'on' : ''}" data-r="${i}" aria-label="Mark as the lie">✗</button>` : ''}${f.label ? `<span>${E(f.label)}</span>` : ''}<input ${f.type === 'number' ? 'type="number" inputmode="numeric"' : ''} maxlength="${f.max || 40}" placeholder="${esc(f.ph || '')}" value="${esc(f.value || '')}" autocomplete="off" autocapitalize="sentences" spellcheck="false"></label>`).join('')}</div>
      ${u.radio ? `<p class="pp-hint">Tap ✗ next to the lie</p>` : ''}<button class="panel-btn go wide" data-send>${esc(u.submit || 'Send')}</button>${u.buttons ? `<div class="pp-btns">${u.buttons.map((b, i) => `<button class="panel-btn ${b.go ? 'go' : ''}" data-b="${i}" ${b.dis ? 'disabled' : ''}>${E(b.label)}</button>`).join('')}</div>` : ''}`;
  } else if (u.k === 'draw') {
    h += `<div class="sc-paper"><canvas></canvas></div>
      <div class="sc-tools">${PALETTE.map((col, i) => `<button data-pen="c:${i}" class="${pen.c === i ? 'on' : ''}" style="background:${col}"></button>`).join('')}
        <button data-pen="w:0" class="size ${pen.w === 0 ? 'on' : ''}"><i style="width:6px;height:6px"></i></button><button data-pen="w:1" class="size ${pen.w === 1 ? 'on' : ''}"><i style="width:12px;height:12px"></i></button>
        <button data-x="undo">↶</button><button data-x="clear">✕</button></div>
      <button class="panel-btn go wide" data-send>${esc(u.submit || 'Done')}</button>`;
  } else if (u.k === 'pick' || u.k === 'toggles') {
    const T = u.k === 'toggles';
    h += `<div class="pp-opts ${u.grid ? 'grid' : ''} ${u.cards ? 'cards' : ''} ${u.big ? 'big' : ''}" style="${u.grid ? `--cols:${u.grid}` : ''}">${u.options.map(o => `<button class="pp-opt ${o.on ? 'on' : ''} ${o.cls || ''}" style="${o.color ? `--c:${o.color}` : ''}" ${T ? `data-t="${o.v}"` : `data-v="${esc(o.v)}"`} ${o.dis ? 'disabled' : ''}>${o.dot != null ? `<i style="background:var(--seat-${o.dot})"></i>` : ''}${o.art || `<span>${E(o.label)}</span>`}${o.sub ? `<small>${E(o.sub)}</small>` : ''}</button>`).join('')}</div>`;
    if (u.buttons) h += `<div class="pp-btns">${u.buttons.map((b, i) => `<button class="panel-btn ${b.go ? 'go' : ''} ${b.cls || ''}" data-b="${i}" ${b.dis ? 'disabled' : ''}>${E(b.label)}</button>`).join('')}</div>`;
  } else if (u.k === 'tap') {
    h += `<button class="pp-tap ${u.cls || ''}" data-tap style="${u.color ? `--c:${u.color}` : ''}"><b>${u.icon || '👆'}</b><span>${E(u.label || 'TAP!')}</span><em class="pp-tapn">${u.count ?? ''}</em></button>`;
  } else if (u.k === 'buttons') {
    h += `<div class="pp-btns ${u.stack ? 'stack' : ''}">${u.buttons.map((b, i) => `<button class="panel-btn ${b.go ? 'go' : ''} ${b.cls || ''}" data-b="${i}" ${b.dis ? 'disabled' : ''}>${b.icon ? `<b>${b.icon}</b>` : ''}${E(b.label)}</button>`).join('')}</div>`;
  } else if (u.note) h += `<p class="pp-note">${E(u.note)}</p>`;
  el.innerHTML = h;
  if (u.k === 'draw') {
    const cv = el.querySelector('canvas');
    fitCanvas(cv, Math.min(window.innerWidth - 36, 420));
    paint(cv, strokes);
    padSetup(cv);
  }
  if (u.k === 'fields' && fresh && !('ontouchstart' in window)) el.querySelector('.pp-field input')?.focus();
}
