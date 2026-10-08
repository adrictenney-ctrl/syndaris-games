// Unicorn Chaos on a phone: your hand and your stable. Tap a card to play it (then pick its
// target), or draw instead. When someone plays a card and you hold Hold Your Horses!, you get a
// few seconds to stop it.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=64';
import { ucCard, ucMini, describe } from './table-unicorns.js?v=64';
import { card, def, cardName, DEF } from './unicorns.js?v=64';

let ctx = null, sel = null, twoSac = null, twoT = [], picks = [], wasMyTurn = false, cdT = null, until = 0;
export function reset() { sel = null; twoSac = null; twoT = []; picks = []; clearInterval(cdT); cdT = null; document.getElementById('ucPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const b = (label, a, cls = '') => `<button class="panel-btn ${cls}" data-a='${JSON.stringify(a)}'>${label}</button>`;

function targets(g, you) {
  const id = sel, d = def(id), k = card(id).k;
  const name = s => ctx.nameOf(s);
  const rivals = g.order.filter(s => s !== you);
  const uniBtns = (who, extra) => who.flatMap(s => g.stable[s].map(u => b(`${U(u)} ${cardName(u)} <small>${name(s)}</small>`, { type: 'play', id, unicorn: u, ...extra }))).join('');
  const U = u => DEF[card(u).k].ic;
  if (d.t === 'down') return rivals.map(s => b(`Into ${name(s)}’s stable`, { type: 'play', id, player: s })).join('');
  if (d.target === 'player') return rivals.map(s => b(`Rob ${name(s)}`, { type: 'play', id, player: s })).join('');
  if (d.target === 'unicorn') return uniBtns(k === 'lasso' ? rivals : g.order) || '<p class="uc-note">No unicorns to pick.</p>';
  if (d.target === 'mod') return g.order.flatMap(s => g.mods[s].map(m => b(`${def(m).ic} ${cardName(m)} <small>${name(s)}</small>`, { type: 'play', id, mod: m }))).join('') || '<p class="uc-note">No Upgrades or Downgrades out.</p>';
  if (d.target === 'two') {
    if (twoSac == null) return `<p class="uc-note">First, sacrifice one of yours:</p>` + g.stable[you].map(u => `<button class="panel-btn" data-sac="${u}">${U(u)} ${cardName(u)}</button>`).join('');
    const opts = rivals.flatMap(s => g.stable[s].map(u => `<button class="panel-btn ${twoT.includes(u) ? 'sel' : ''}" data-two="${u}">${U(u)} ${cardName(u)} <small>${name(s)}</small></button>`)).join('');
    return `<p class="uc-note">Now pick up to two to destroy:</p>${opts}${b(`Destroy ${twoT.length}`, { type: 'play', id, sac: twoSac, targets: twoT }, 'go')}`;
  }
  return b('Play it', { type: 'play', id }, 'go');
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (sel != null && !g.hand.includes(sel)) { sel = null; twoSac = null; twoT = []; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Unicorns', `${g.stable[you].length}/${g.goal}`);
  $('#hudC').innerHTML = `<span>Deck</span><b>${g.deck}</b>`;
  const lead = g.order.filter(s => s !== you).sort((a, b2) => g.stable[b2].length - g.stable[a].length)[0];
  setHud('#hudR', c.nameOf(lead), `${g.stable[lead].length}/${g.goal}`);
  const myTurn = g.phase === 'action' && g.turn === you;
  const responding = g.phase === 'respond' && g.pending.mine;
  const discarding = g.phase === 'discard' && g.turn === you;
  const mine = myTurn || responding || discarding;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  if (!myTurn) { sel = null; twoSac = null; twoT = []; }
  if (!discarding) picks = [];
  until = Date.now() + (g.respondIn || 0);
  let el = document.getElementById('ucPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ucPhone';
    $('#status').after(el);
    el.addEventListener('click', ev => {
      const st = ctx.st.game;
      const h = ev.target.closest('[data-h]');
      if (h) { const id = Number(h.dataset.h); if (st.phase === 'discard') picks = picks.includes(id) ? picks.filter(x => x !== id) : [...picks, id]; else { sel = sel === id ? null : id; twoSac = null; twoT = []; } return render(ctx); }
      const sac = ev.target.closest('[data-sac]');
      if (sac) { twoSac = Number(sac.dataset.sac); return render(ctx); }
      const two = ev.target.closest('[data-two]');
      if (two) { const u = Number(two.dataset.two); twoT = twoT.includes(u) ? twoT.filter(x => x !== u) : [...twoT, u].slice(-2); return render(ctx); }
      const a = ev.target.closest('[data-a]');
      if (!a) return;
      const act = JSON.parse(a.dataset.a);
      if (act.type === 'discard') act.ids = picks;
      ctx.send(act);
      sel = null; twoSac = null; twoT = []; picks = [];
      navigator.vibrate?.(15);
    });
  }
  let mid = '';
  if (responding) {
    mid = `<div class="uc-alert">${describe(g.pending, c.nameOf)}<span class="uc-cd"></span></div><div class="row">${b('Hold Your Horses! ✋', { type: 'neigh' }, 'go')}${g.hasSuper ? b('Unbridled! 🔥', { type: 'neigh', super: true }, 'go') : ''}${b('Let it be', { type: 'pass' })}</div>`;
  } else if (g.pending) mid = `<div class="uc-alert dim">${describe(g.pending, c.nameOf)}</div>`;
  else if (discarding) mid = `<div class="uc-alert">Discard down to seven</div>${b(`Discard ${picks.length}`, { type: 'discard' }, 'go wide')}`;
  else if (myTurn && sel != null) {
    const d = def(sel);
    mid = `<div class="uc-sheet">${ucCard(sel)}<div class="uc-opts">${d.t === 'instant' ? '<p class="uc-note">Keep this for when someone plays a card.</p>' : targets(g, you)}</div></div>`;
  }
  el.innerHTML = `<div class="uc-mine">${g.stable[you].map(ucMini).join('')}${g.mods[you].map(ucMini).join('')}</div>${mid}
    <div class="uc-hand">${g.hand.map(id => `<button data-h="${id}" class="${sel === id || picks.includes(id) ? 'sel' : ''}">${ucCard(id)}</button>`).join('')}</div>`;
  const p = $('#panel');
  p.innerHTML = myTurn ? (g.plays === 0 ? b('Draw a card instead', { type: 'draw' }, 'wide') : b('End my turn', { type: 'end' }, 'wide')) : '';
  p.querySelector('[data-a]')?.addEventListener('click', ev => { ctx.send(JSON.parse(ev.currentTarget.dataset.a)); sel = null; });
  clearInterval(cdT);
  if (responding) cdT = setInterval(() => { const e = document.querySelector('.uc-cd'); if (e) e.textContent = ` · ${Math.max(0, Math.ceil((until - Date.now()) / 1000))}s`; }, 250);
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (responding) setStatus('Stop it?', 'Use a Hold Your Horses! card — or let it be');
  else if (discarding) setStatus('Too many cards', 'Tap the ones to throw away');
  else if (myTurn) setStatus('Your turn', sel != null ? '' : `Tap a card to play it${g.maxPlays > 1 ? ` · ${g.maxPlays - g.plays} plays left` : ''} — or draw`);
  else setStatus(`${c.nameOf(g.turn)}'s turn`, '');
  renderHand([]);
}
