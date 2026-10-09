// Power Grab on a phone: your two secret roles and your coins. On your turn pick an action (a
// role action is a claim — you can bluff). When someone else claims something, you get a few
// seconds to call the bluff or block.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=67';
import { roleCard, claimText } from './table-powergrab.js?v=67';
import { ROLES, ACTS } from './powergrab.js?v=67';

let ctx = null, pick = null, keep = [], wasMyTurn = false, cdT = null, until = 0;
export function reset() { pick = null; keep = []; clearInterval(cdT); document.getElementById('pgPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const b = (label, a, cls = '') => `<button class="panel-btn ${cls}" data-a='${JSON.stringify(a)}'>${label}</button>`;

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, p = g.p;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Coins', g.coins[you]);
  $('#hudC').innerHTML = `<span>Influence</span><b>${g.mine.filter(x => !x.up).length}</b>`;
  setHud('#hudR', 'Players left', g.alive.filter(Boolean).length);
  const myTurn = g.phase === 'act' && g.turn === you;
  const answering = g.phase === 'window' && p.waiting.includes(you);
  const losing = g.phase === 'lose' && g.loser === you;
  const swapping = g.phase === 'exchange' && g.turn === you;
  const mine = myTurn || answering || losing || swapping;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  if (!myTurn) pick = null;
  if (!swapping) keep = [];
  until = Date.now() + (g.windowIn || 0);
  let el = document.getElementById('pgPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pgPhone';
    $('#status').after(el);
    el.addEventListener('click', ev => {
      const st = ctx.st.game;
      const k = ev.target.closest('[data-keep]');
      if (k) { const i = Number(k.dataset.keep); keep = keep.includes(i) ? keep.filter(x => x !== i) : [...keep, i].slice(-st.mine.filter(x => !x.up).length); return render(ctx); }
      const pk = ev.target.closest('[data-pick]');
      if (pk) { pick = pk.dataset.pick; return render(ctx); }
      const a = ev.target.closest('[data-a]');
      if (!a) return;
      const act = JSON.parse(a.dataset.a);
      if (act.type === 'keep') act.keep = keep;
      ctx.send(act);
      pick = null; keep = [];
      navigator.vibrate?.(15);
    });
  }
  const rivals = g.order.filter(s => s !== you && g.alive[g.order.indexOf(s)]);
  let body = '';
  if (losing) body = `<p class="pg-note">Give up one card (it’s turned face up):</p><div class="pg-mine">${g.mine.map((x, i) => x.up ? roleCard(x.role, 'lost') : `<button data-a='${JSON.stringify({ type: 'lose', i })}'>${roleCard(x.role)}</button>`).join('')}</div>`;
  else if (swapping) {
    const n = g.mine.filter(x => !x.up).length;
    body = `<p class="pg-note">Keep ${n}; the rest go back to the court:</p><div class="pg-mine pool">${p.pool.map((r, i) => `<button data-keep="${i}" class="${keep.includes(i) ? 'sel' : ''}">${roleCard(r)}</button>`).join('')}</div>${b(`Keep these ${keep.length}`, { type: 'keep' }, 'go wide')}`;
  } else {
    body = `<div class="pg-mine">${g.mine.map(x => roleCard(x.role, x.up ? 'lost' : '')).join('')}</div>`;
    if (answering) {
      body += `<div class="pg-alert">${claimText(p, c.nameOf)}<span class="pg-cd"></span></div><div class="pg-acts">`;
      if (p.stage === 'challengeAct' || p.stage === 'challengeBlock') body += b('Call the bluff! 🫵', { type: 'challenge' }, 'go');
      if (p.stage === 'block') body += ACTS[p.act].blockBy.map(r => b(`Block with ${ROLES[r].ic} ${ROLES[r].name}`, { type: 'block', role: r }, 'go')).join('');
      body += b('Let it go', { type: 'pass' }) + '</div>';
    } else if (myTurn) {
      const must = g.coins[you] >= 10;
      if (pick && ACTS[pick].target) body += `<p class="pg-note">${ACTS[pick].name} — who?</p><div class="pg-acts">${rivals.map(t => b(`${c.nameOf(t)} · 🪙${g.coins[t]}`, { type: 'act', act: pick, target: t }, 'go')).join('')}<button class="panel-btn" data-pick="">Back</button></div>`;
      else body += `<div class="pg-acts grid">${Object.entries(ACTS).filter(([k]) => !must || k === 'overthrow').map(([k, A]) => {
        const off = A.cost && g.coins[you] < A.cost;
        const label = `<b>${A.claim ? ROLES[A.claim].ic + ' ' : ''}${A.name}</b><small>${A.text}${A.claim ? ` · claim ${ROLES[A.claim].name}` : ''}</small>`;
        return A.target ? `<button class="panel-btn pg-act" data-pick="${k}" ${off ? 'disabled' : ''}>${label}</button>` : `<button class="panel-btn pg-act" data-a='${JSON.stringify({ type: 'act', act: k })}'>${label}</button>`;
      }).join('')}</div>`;
    } else if (p) body += `<div class="pg-alert dim">${claimText(p, c.nameOf)}</div>`;
  }
  el.innerHTML = body;
  clearInterval(cdT);
  if (answering) cdT = setInterval(() => { const e = document.querySelector('.pg-cd'); if (e) e.textContent = ` · ${Math.max(0, Math.ceil((until - Date.now()) / 1000))}s`; }, 250);
  const out = !g.mine.some(x => !x.up);
  if (g.phase === 'over') setStatus(g.winner === you ? '👑 You take the throne!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (out) setStatus('You’re out', 'Watch the rest of the intrigue');
  else if (losing) setStatus('You lose influence', 'Pick a card to give up');
  else if (swapping) setStatus('Exchange', 'Choose which roles to keep');
  else if (answering) setStatus(p.stage === 'block' ? 'Block it?' : 'Bluff?', 'Decide before the timer runs out');
  else if (myTurn) setStatus(g.coins[you] >= 10 ? 'You must Overthrow' : 'Your move', 'Any role action is a claim — bluff if you dare');
  else setStatus(`${c.nameOf(g.turn)}'s move`, '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
