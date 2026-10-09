// Iron Routes on a phone: your rail cards, the five face-up cards (tap to take) and the deck,
// the routes you can afford right now (tap to claim), and your destination tickets.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { ROUTES, CITIES, COLORS, HEX, POINTS, payment, routeOpen } from './ironroutes.js?v=68';
import { railCard, mapSVG } from './table-ironroutes.js?v=68';

let ctx = null, keep = new Set(), keepFor = '', grayPick = null, wasMyTurn = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export function reset() { keep = new Set(); keepFor = ''; grayPick = null; document.getElementById('irPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('irPhone');
  if (!e) { e = document.createElement('div'); e.id = 'irPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game;
  const t = ev.target.closest('[data-m], [data-x], [data-r], [data-k], [data-gc]');
  if (!t) return;
  if (t.dataset.k != null) { const n = +t.dataset.k; keep.has(n) ? keep.delete(n) : keep.add(n); return render(ctx); }
  if (t.dataset.m != null) { ctx.send({ type: 'take', i: +t.dataset.m }); navigator.vibrate?.(10); return; }
  if (t.dataset.gc) { ctx.send({ type: 'claim', route: grayPick, color: t.dataset.gc }); grayPick = null; return; }
  if (t.dataset.r != null) {
    const k = +t.dataset.r, r = ROUTES[k];
    if (r.color === 'gray') {
      const opts = COLORS.filter(c => payment(g.hand, r, c));
      if (opts.length > 1) { grayPick = k; return render(ctx); }
    }
    ctx.send({ type: 'claim', route: k });
    navigator.vibrate?.(20);
    return;
  }
  const x = t.dataset.x;
  if (x === 'blind') ctx.send({ type: 'blind' });
  if (x === 'tickets') ctx.send({ type: 'tickets' });
  if (x === 'pass') ctx.send({ type: 'pass' });
  if (x === 'keep') { if (keep.size < g.offer.min) return toast(`Keep at least ${g.offer.min}`); ctx.send({ type: 'keep', tickets: [...keep] }); keep = new Set(); }
  if (x === 'nogray') { grayPick = null; render(ctx); }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Trains', g.trains[you]);
  $('#hudC').innerHTML = `<span>Points</span><b>${g.points[you]}</b>`;
  setHud('#hudR', 'Tickets', `${g.tickets.filter(t => t.done).length}/${g.tickets.length}`, 'complete');
  const mine = g.phase === 'play' && g.turn === you;
  const act = mine || !!g.offer;
  document.body.classList.toggle('myturn', act);
  if (act && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = act;

  const hand = COLORS.concat('loco').filter(k => g.hand[k] > 0).map(k => `<span class="ir-held">${railCard(k)}<b>×${g.hand[k]}</b></span>`).join('') || '<p class="ir-none">No cards yet</p>';
  const tickets = `<ul class="ir-tix">${g.tickets.map(t => `<li class="${t.done ? 'done' : ''}"><span>${esc(CITIES[t.a].name)} → ${esc(CITIES[t.b].name)}</span><b>${t.value}</b><i>${t.done ? '✓' : ''}</i></li>`).join('') || '<li class="quiet">No tickets yet</li>'}</ul>`;
  const hi = new Set(g.tickets.filter(t => !t.done).flatMap(t => [t.a, t.b]));
  let body = '';

  if (g.phase === 'over') {
    const f = g.final[you];
    setStatus(g.winners.includes(you) ? '🏆 You win!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, `${f.total} points · ${f.routes} routes, ${f.tickets >= 0 ? '+' : ''}${f.tickets} tickets${f.bonus ? ', +10 longest line' : ''}`);
  } else if (g.offer) {
    const k = g.offer.cards.map(x => x.t).join(',');
    if (k !== keepFor) { keepFor = k; keep = new Set(); }
    setStatus('Choose destination tickets', `Keep at least ${g.offer.min} — unfinished ones cost you their value`);
    body = `<ul class="ir-tix offer">${g.offer.cards.map(o => `<li class="${keep.has(o.t) ? 'on' : ''}" data-k="${o.t}"><span>${esc(CITIES[o.a].name)} → ${esc(CITIES[o.b].name)}</span><b>${o.value}</b><i>${keep.has(o.t) ? '✓' : ''}</i></li>`).join('')}</ul>
      <button class="panel-btn go wide" data-x="keep" ${keep.size >= g.offer.min ? '' : 'disabled'}>Keep ${keep.size || ''} ticket${keep.size === 1 ? '' : 's'}</button>`;
  } else if (!mine) {
    setStatus(`${c.nameOf(g.turn)}'s turn`, g.lastRound != null ? 'Final round!' : 'Plan your routes');
  } else if (grayPick != null) {
    const r = ROUTES[grayPick];
    setStatus(`${CITIES[r.a].name}–${CITIES[r.b].name}`, 'Pay with which colour?');
    body = `<div class="ir-pay">${COLORS.filter(x => payment(g.hand, r, x)).map(x => `<button data-gc="${x}">${railCard(x)}</button>`).join('')}</div><button class="panel-btn wide" data-x="nogray">Back</button>`;
  } else {
    const can = ROUTES.map((r, k) => k).filter(k => routeOpen(g, k, you) && g.trains[you] >= ROUTES[k].len && payment(g.hand, ROUTES[k]))
      .sort((a, b) => ROUTES[b].len - ROUTES[a].len);
    setStatus(g.drew ? 'Take one more card' : 'Your turn', g.drew ? 'Face up (not an engine) or blind from the deck' : 'Take two cards, claim a route, or draw tickets');
    body = `<p class="pick">Take ${g.drew ? 'a second card' : 'cards'}</p><div class="ir-marketp">${g.market.map((m, i) => `<button data-m="${i}" ${g.drew && m === 'loco' ? 'disabled' : ''}>${railCard(m)}</button>`).join('')}<button data-x="blind" class="ir-blind" ${g.deck ? '' : 'disabled'}><span class="ir-card back">Deck</span></button></div>
      ${g.drew ? '' : `<p class="pick">Claim a route</p><div class="ir-claims">${can.map(k => { const r = ROUTES[k]; return `<button data-r="${k}"><i style="background:${HEX[r.color]}"></i>${esc(CITIES[r.a].name)} – ${esc(CITIES[r.b].name)}<small>${r.len} · ${POINTS[r.len]} pts</small></button>`; }).join('') || '<p class="ir-none">Nothing you can afford yet.</p>'}</div>
      <div class="row"><button class="panel-btn" data-x="tickets">Draw tickets</button>${!g.deck && !g.market.some(m => m !== 'loco') ? '<button class="panel-btn" data-x="pass">Pass</button>' : ''}</div>`}`;
  }
  el().innerHTML = `<p class="pick">Your cards</p><div class="ir-hand">${hand}</div>${body}<p class="pick">Your tickets</p>${tickets}<div class="ir-phone-map">${mapSVG(g, { hi, mine: you })}</div>`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
