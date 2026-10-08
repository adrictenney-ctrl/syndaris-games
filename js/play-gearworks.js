// Gearworks on a phone: pick your action for the round (each tile shows how strong it is for
// you), then make the choices the actions ask for — which blueprints to recycle, which robot
// to assemble, how many parts to upgrade.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=59';
import * as W from './gearworks.js?v=59';
import { gwCard, robotSVG, ACT_COLOR } from './table-gearworks.js?v=59';

let ctx = null, sel = [], pairs = 0, lastKey = '', wasMyTurn = false;

export function reset() { sel = []; pairs = 0; document.getElementById('gwPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('gwPhone');
  if (!e) { e = document.createElement('div'); e.id = 'gwPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}
const send = a => { ctx.send(a); navigator.vibrate?.(12); };

function onClick(ev) {
  const g = ctx.st.game;
  const t = ev.target.closest('[data-a], [data-c], [data-x]');
  if (!t) return;
  if (t.dataset.a && g.phase === 'plan') return send({ type: 'pick', action: t.dataset.a });
  if (!g.mustChoose) return;
  const act = g.step.action;
  if (t.dataset.c != null) {
    const id = Number(t.dataset.c);
    if (act === 'recycle') { sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]; return render(ctx); }
    if (act === 'assemble') {
      const cost = Math.max(0, W.BLUEPRINTS[id].cost - g.discount);
      if (cost > g.me.parts) return toast(`Needs ${cost} parts — you have ${g.me.parts}`);
      return send({ type: 'choose', card: id });
    }
  }
  const x = t.dataset.x;
  if (x === 'recycle') { send({ type: 'choose', cards: sel }); sel = []; }
  if (x === 'skip') send({ type: 'choose', card: null });
  if (x === 'minus') { pairs = Math.max(0, pairs - 1); render(ctx); }
  if (x === 'plus') { pairs = Math.min(Math.floor(g.me.parts / 2), pairs + 1); render(ctx); }
  if (x === 'upgrade') send({ type: 'choose', pairs });
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, me = g.me, pl = g.players[you];
  const k = `${g.round}|${g.step?.action}`;
  if (k !== lastKey) { lastKey = k; sel = []; pairs = me ? Math.floor(me.parts / 2) : 0; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Points', pl.score);
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}/${g.rounds}</b>`;
  setHud('#hudR', 'Parts', `🔩${me.parts}`);

  const act = g.phase === 'plan' && !me.pick || g.mustChoose;
  document.body.classList.toggle('myturn', !!act);
  if (act && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = !!act;

  const step = g.step?.action;
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 Finest workshop!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, `You scored ${pl.score}`);
  else if (g.phase === 'plan') setStatus(me.pick ? `You picked ${W.ACT[me.pick].name}` : 'Pick an action', me.pick ? 'You can change it until everyone has picked' : 'Everyone does every action that gets picked — yours gets the bonus');
  else if (g.mustChoose && step === 'recycle') setStatus('Recycle', 'Tap blueprints to scrap them for parts (or none)');
  else if (g.mustChoose && step === 'assemble') setStatus('Assemble a robot', `Your discount: −${g.discount} · you have ${me.parts} parts`);
  else if (g.mustChoose && step === 'upgrade') setStatus('Upgrade', 'Turn pairs of parts into points');
  else setStatus(step ? `${W.ACT[step].name}…` : 'Waiting', 'Watch the table');

  let top = '';
  if (g.phase === 'plan') {
    top = `<div class="gw-pick">${W.ACTIONS.map(a => {
      const pw = g.power[a], bonus = pw.surge + pw.icons;
      return `<button data-a="${a}" class="${me.pick === a ? 'on' : ''}" style="--c:${ACT_COLOR[a]}"><i>${W.ACT[a].ic}</i><b>${W.ACT[a].name}</b><span>${W.ACT[a].text}</span><em>Your pick: ${W.ACT[a].big}${bonus ? ` · +${bonus} ${pw.surge ? '⚡' : ''}${pw.icons ? '🤖' : ''}` : ''}</em></button>`;
    }).join('')}</div>`;
  } else if (g.mustChoose && step === 'recycle') top = `<div class="row"><button class="panel-btn go" data-x="recycle">Scrap ${sel.length} for ${sel.length} part${sel.length === 1 ? '' : 's'}</button></div>`;
  else if (g.mustChoose && step === 'assemble') top = `<div class="row"><button class="panel-btn" data-x="skip">Don't build</button></div>`;
  else if (g.mustChoose && step === 'upgrade') top = `<div class="gw-up"><button class="panel-btn" data-x="minus">−</button><p><b>${pairs}</b> point${pairs === 1 ? '' : 's'} for ${pairs * 2} parts</p><button class="panel-btn" data-x="plus">+</button></div><div class="row"><button class="panel-btn go" data-x="upgrade">Upgrade</button></div>`;

  const lit = id => g.mustChoose && step === 'assemble' && Math.max(0, W.BLUEPRINTS[id].cost - g.discount) <= me.parts;
  const hand = `<p class="gw-h">Blueprints</p><div class="gw-hand">${me.hand.map(id => `<button data-c="${id}" class="${sel.includes(id) ? 'sel' : ''}${lit(id) ? ' lit' : ''}">${gwCard(id)}</button>`).join('') || '<em>none — Design draws more</em>'}</div>`;
  const shop = `<p class="gw-h">Your workshop</p><div class="gw-bots mine">${pl.robots.map(id => `<span style="--c:${ACT_COLOR[W.BLUEPRINTS[id].icon]}">${robotSVG(W.BLUEPRINTS[id].seed, ACT_COLOR[W.BLUEPRINTS[id].icon])}<b>${W.BLUEPRINTS[id].vp}</b></span>`).join('') || '<em>no robots yet</em>'}</div>`;
  const surges = `<p class="gw-surges">⚡ Surges: ${g.surges.map(a => `${W.ACT[a].ic} ${W.ACT[a].name}`).join(' · ')}</p>`;
  el().innerHTML = `${surges}${top}${hand}${shop}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
