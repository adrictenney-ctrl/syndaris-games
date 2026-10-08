// Redline on a phone: pick your gear, tap that many cards, maybe Boost, then Lock in. Everyone
// plans at the same time; the cars move once the last player locks in.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=60';
import * as R from './redline.js?v=60';
import { rlCard, trackSVG } from './table-redline.js?v=60';

let ctx = null, gear = null, sel = [], boost = false, lastRound = -1, wasMyTurn = false;

export function reset() { gear = null; sel = []; boost = false; document.getElementById('rlPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('rlPhone');
  if (!e) { e = document.createElement('div'); e.id = 'rlPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game, me = g.me;
  const t = ev.target.closest('[data-g], [data-c], [data-x]');
  if (!t || g.phase !== 'plan' || !me || g.cars[ctx.st.you].done) return;
  if (t.dataset.x === 'change') { ctx.send({ type: 'unplan' }); return; }
  if (me.plan) return;
  if (t.dataset.g) { gear = Number(t.dataset.g); sel = sel.slice(0, need(g)); return render(ctx); }
  if (t.dataset.c) {
    const c = t.dataset.c;
    if (R.cardType(c) === 'heat') return toast('Heat cards can\'t be played — cool down in 1st or 2nd gear');
    if (sel.includes(c)) sel = sel.filter(x => x !== c);
    else if (sel.length < need(g)) sel.push(c);
    else sel = [...sel.slice(1), c];
    return render(ctx);
  }
  if (t.dataset.x === 'boost') { boost = !boost; return render(ctx); }
  if (t.dataset.x === 'lock') { ctx.send({ type: 'plan', gear, cards: sel, boost }); navigator.vibrate?.(20); }
}

const playable = me => me.hand.filter(c => R.cardType(c) !== 'heat');
const need = g => Math.min(gear || g.me.gear, playable(g.me).length);

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, me = g.me, car = g.cars[you];
  if (g.round !== lastRound) { lastRound = g.round; gear = me?.gear ?? 1; sel = []; boost = false; }
  if (gear == null) gear = me?.gear ?? 1;
  sel = sel.filter(x => me?.hand.includes(x));
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Position', `P${g.standings.indexOf(you) + 1}`, `of ${g.order.length}`);
  $('#hudC').innerHTML = `<span>Engine</span><b>🔥${me?.engine ?? 0}</b>`;
  setHud('#hudR', 'To go', Math.max(0, g.goal - car.pos), `lap ${Math.min(g.laps, Math.max(1, Math.floor(car.pos / R.L) + 1))}/${g.laps}`);

  const planning = g.phase === 'plan' && !car.done && !me.plan;
  document.body.classList.toggle('myturn', planning);
  if (planning && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = planning;

  const opt = g.gears?.find(o => o.gear === gear);
  const n = need(g);
  const sp = sel.reduce((a, x) => a + R.speedOf(x), 0), stress = sel.filter(x => R.cardType(x) === 'stress').length;
  const nx = g.next;
  const cornerTxt = nx ? `Next corner in ${nx.dist} · limit ${nx.limit}` : '';
  if (g.phase === 'over') setStatus(g.ranking[0] === you ? '🏆 You win!' : `🏁 You finished P${g.ranking.indexOf(you) + 1}`, 'Look at the table');
  else if (car.done) setStatus(`🏁 Finished · P${g.standings.indexOf(you) + 1}`, 'Waiting for the others');
  else if (g.phase === 'reveal') setStatus('Cars on the move…', 'Watch the table');
  else if (me.plan) setStatus('Locked in ✓', 'Waiting for the other drivers');
  else setStatus(`Gear ${gear} · play ${n} card${n === 1 ? '' : 's'}`, cornerTxt);

  let body = '';
  if (g.phase === 'plan' && !car.done && me) {
    if (me.plan) body = `<div class="rl-locked"><div class="rl-row">${me.plan.cards.map(x => rlCard(x)).join('')}</div><p>Gear ${me.plan.gear}${me.plan.boost ? ' · Boost' : ''}</p><button class="panel-btn" data-x="change">Change my mind</button></div>`;
    else {
      const gears = g.gears.map(o => `<button data-g="${o.gear}" class="${o.gear === gear ? 'on' : ''}" ${o.ok ? '' : 'disabled'}><b>${o.gear}</b><small>${o.heat ? '🔥1' : o.gear === me.gear ? 'same' : 'free'}${R.COOL[o.gear] ? ` · cool ${R.COOL[o.gear]}` : ''}</small></button>`).join('');
      const est = stress ? `${sp}+${stress}?` : `${sp}`;
      const canBoost = me.engine >= 1 + (opt?.heat || 0);
      body = `<div class="rl-gears">${gears}</div>
        <div class="rl-hand">${me.hand.map(x => `<button data-c="${x}" class="${sel.includes(x) ? 'sel' : ''}${R.cardType(x) === 'heat' ? ' dead' : ''}">${rlCard(x)}</button>`).join('')}</div>
        <div class="row"><button class="panel-btn${boost ? ' on' : ''}" data-x="boost" ${canBoost ? '' : 'disabled'}>${boost ? '⚡ Boost on (🔥1)' : 'Boost +? (🔥1)'}</button>
        <button class="panel-btn go" data-x="lock" ${sel.length === n && n > 0 ? '' : 'disabled'}>Lock in · speed ${est}</button></div>`;
    }
  }
  const pile = me ? `<p class="rl-piles">Deck ${me.deck} · discard ${me.discard}${me.heatInDiscard ? ` (🔥${me.heatInDiscard} heat waiting)` : ''}</p>` : '';
  el().innerHTML = `<div class="rl-mini">${trackSVG(g, { highlight: you })}</div>${body}${pile}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
