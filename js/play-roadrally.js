// Road Rally on a phone: your car's status and your hand. Tap a card: play it on yourself, pick
// a rival for a hazard, or discard it. When you're hit and hold the right Ace, a Counter-Move
// button appears.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=64';
import { rrCard, status } from './table-roadrally.js?v=64';
import { KINDS, canPlay } from './roadrally.js?v=64';

let sel = null, wasMyTurn = false;
export function reset() { sel = null; document.getElementById('rrPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  const g = c.st.game, you = c.st.you, me = g.p[you];
  // canPlay needs the full table state; rebuild what it reads from the view.
  const gv = { p: g.p, settings: { target: g.target } };
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Miles', me.miles, `of ${g.target}`);
  $('#hudC').innerHTML = `<span>Deck</span><b>${g.deck}</b>`;
  setHud('#hudR', 'Points', g.scores[you]);
  const myTurn = g.phase === 'play' && g.turn === you;
  const coup = g.phase === 'coup' && g.coup.target === you;
  document.body.classList.toggle('myturn', myTurn || coup);
  if ((myTurn || coup) && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn || coup;
  if (!myTurn || sel >= g.hand.length) sel = null;
  let el = document.getElementById('rrPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rrPhone';
    $('#status').after(el);
    el.addEventListener('click', ev => {
      const h = ev.target.closest('[data-i]');
      if (h) { sel = sel === Number(h.dataset.i) ? null : Number(h.dataset.i); return render(c); }
      const b = ev.target.closest('[data-a]');
      if (b) { c.send(JSON.parse(b.dataset.a)); sel = null; navigator.vibrate?.(15); }
    });
  }
  let opts = '';
  if (myTurn && sel != null) {
    const k = g.hand[sel], kc = KINDS[k];
    const b = (label, a, cls = '') => `<button class="panel-btn ${cls}" data-a='${JSON.stringify(a)}'>${label}</button>`;
    if (kc.t === 'hazard') {
      opts += g.order.filter(s => s !== you).map(t => { const err = canPlay(gv, you, k, t); return err ? `<button class="panel-btn" disabled>${c.nameOf(t)} · ${err}</button>` : b(`${kc.ic} on ${c.nameOf(t)}`, { type: 'play', i: sel, target: t }, 'go'); }).join('');
    } else {
      const err = canPlay(gv, you, k);
      opts += err ? `<p class="rr-why">${err}</p>` : b(kc.t === 'miles' ? `Drive ${kc.v}` : kc.t === 'ace' ? `Play ${kc.name} (+ another turn)` : `Use ${kc.name}`, { type: 'play', i: sel }, 'go');
    }
    opts += b('Discard it', { type: 'discard', i: sel });
  }
  if (coup) opts = `<div class="rr-coup">${KINDS[g.coup.hazard].ic} You were hit! Answer with your ${KINDS[g.coup.ace].name}?</div><button class="panel-btn go" data-a='{"type":"coup"}'>Counter-Move! +300</button><button class="panel-btn" data-a='{"type":"pass"}'>Keep it for later</button>`;
  el.innerHTML = `<div class="rr-mystat">${status(me)}</div><div class="rr-opts">${opts}</div><div class="rr-hand">${g.hand.map((k, i) => `<button data-i="${i}" class="${sel === i ? 'sel' : ''}" ${myTurn ? '' : 'disabled'}>${rrCard(k)}</button>`).join('')}</div>`;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win the rally!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (g.phase === 'handEnd') setStatus('Hand over', `You scored ${g.result.add[you]}`);
  else if (coup) setStatus('Counter-Move?', 'Play your Ace now for 300 and another turn');
  else if (myTurn) setStatus('Your turn', sel == null ? 'Tap a card to play or discard it' : '');
  else setStatus(`${c.nameOf(g.phase === 'coup' ? g.coup.target : g.turn)}'s turn`, '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
