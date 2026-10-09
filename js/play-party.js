// The phone for the party games. Each engine describes what the phone should show in its view
// (view.ui) and this draws it:
//   k: 'wait'     — just a message (and maybe a card)
//   k: 'fields'   — one or more text boxes and a Send button; drafts reach the table as you type,
//                   so nothing is lost if the clock runs out. radio: pick one of the fields too.
//   k: 'pick'     — a list (or grid) of choices, tap one
//   k: 'toggles'  — a list you can tick on and off, then Done
//   k: 'buttons'  — a row of big buttons
// Anywhere in the text, @3@ is replaced by the name of the player in seat 3.
// Shared extras: title/sub (the status lines), card {kicker, big, small, list}, hud [[label, value, sub], …],
// left (ms on the clock), myturn, buzz (vibrate on a new key).
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=67';
import { esc } from './party.js?v=67';

let ctx = null, key = null, clockT = null, endAt = 0, draftT = null, radio = -1;
export function reset() { key = null; clearInterval(clockT); clockT = null; document.getElementById('ptPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}`; };
const nm = t => String(t ?? '').replace(/@(d+)@/g, (_, s) => ctx.nameOf(Number(s)));
const E = t => esc(nm(t));
const cardHTML = c => (c ? `<div class="pp-card ${c.cls || ''}">${c.kicker ? `<small>${E(c.kicker)}</small>` : ''}${c.big ? `<b>${E(c.big)}</b>` : ''}${c.small ? `<p>${E(c.small)}</p>` : ''}${c.list ? `<ul>${c.list.map(x => `<li>${E(x)}</li>`).join('')}</ul>` : ''}</div>` : '');

function vals() { return [...document.querySelectorAll('#ptPhone .pp-field input')].map(i => i.value); }
function sendFields(u) {
  if (u.radio && radio < 0) return toast(u.radio);
  const v = vals();
  if (u.need && v.filter(x => x.trim()).length < u.need) return toast(u.needMsg || 'Fill it in first');
  ctx.send({ type: u.act || 'answer', vals: v, pick: radio });
  navigator.vibrate?.(20);
}

export function render(c) {
  ctx = c;
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
      const b = e.target.closest('[data-v],[data-b],[data-r],[data-send],[data-t]');
      if (!b || b.disabled) return;
      const U = ctx.st.game.ui || {};
      if (b.dataset.v != null) { ctx.send({ type: U.act || 'pick', v: isNaN(b.dataset.v) ? b.dataset.v : Number(b.dataset.v) }); navigator.vibrate?.(15); }
      else if (b.dataset.t != null) { ctx.send({ type: U.act || 'toggle', v: Number(b.dataset.t) }); navigator.vibrate?.(10); }
      else if (b.dataset.b != null) { const B = U.buttons[Number(b.dataset.b)]; ctx.send({ type: B.type, ...(B.payload || {}) }); navigator.vibrate?.(B.buzz ? [60, 30, 60] : 20); }
      else if (b.dataset.r != null) { radio = Number(b.dataset.r); el.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', Number(x.dataset.r) === radio)); ctx.raw({ t: 'ink', draft: { vals: vals(), pick: radio } }); }
      else if (b.dataset.send != null) sendFields(U);
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
  // Text boxes are only rebuilt for a new question, so typing is never wiped by an update.
  if (u.k === 'fields' && !fresh) { el.querySelector('.pp-cardslot').innerHTML = cardHTML(u.card); return; }
  if (fresh) radio = u.k === 'fields' && u.radioAt != null ? u.radioAt : -1;
  let h = `<div class="pp-cardslot">${cardHTML(u.card)}</div>`;
  if (u.k === 'fields') {
    h += `<div class="pp-fields ${u.compact ? 'compact' : ''}">${u.fields.map((f, i) => `<label class="pp-field">${u.radio ? `<button type="button" class="pp-radio ${radio === i ? 'on' : ''}" data-r="${i}" aria-label="Mark as the lie">✗</button>` : ''}${f.label ? `<span>${esc(f.label)}</span>` : ''}<input maxlength="${f.max || 40}" placeholder="${esc(f.ph || '')}" value="${esc(f.value || '')}" autocomplete="off" autocapitalize="sentences" spellcheck="false"></label>`).join('')}</div>
      ${u.radio ? `<p class="pp-hint">Tap ✗ next to the lie</p>` : ''}<button class="panel-btn go wide" data-send>${esc(u.submit || 'Send')}</button>`;
  } else if (u.k === 'pick' || u.k === 'toggles') {
    const T = u.k === 'toggles';
    h += `<div class="pp-opts ${u.grid ? 'grid' : ''}" style="${u.grid ? `--cols:${u.grid}` : ''}">${u.options.map(o => `<button class="pp-opt ${o.on ? 'on' : ''} ${o.cls || ''}" ${T ? `data-t="${o.v}"` : `data-v="${esc(o.v)}"`} ${o.dis ? 'disabled' : ''}>${o.dot != null ? `<i style="background:var(--seat-${o.dot})"></i>` : ''}<span>${E(o.label)}</span>${o.sub ? `<small>${E(o.sub)}</small>` : ''}</button>`).join('')}</div>`;
    if (u.buttons) h += `<div class="pp-btns">${u.buttons.map((b, i) => `<button class="panel-btn ${b.go ? 'go' : ''} ${b.cls || ''}" data-b="${i}" ${b.dis ? 'disabled' : ''}>${esc(b.label)}</button>`).join('')}</div>`;
  } else if (u.k === 'buttons') {
    h += `<div class="pp-btns ${u.stack ? 'stack' : ''}">${u.buttons.map((b, i) => `<button class="panel-btn ${b.go ? 'go' : ''} ${b.cls || ''}" data-b="${i}" ${b.dis ? 'disabled' : ''}>${b.icon ? `<b>${b.icon}</b>` : ''}${E(b.label)}</button>`).join('')}</div>`;
  } else if (u.note) h += `<p class="pp-note">${E(u.note)}</p>`;
  el.innerHTML = h;
  if (u.k === 'fields' && fresh && !('ontouchstart' in window)) el.querySelector('.pp-field input')?.focus();
}
