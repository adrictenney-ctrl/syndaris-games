// Blackjack on a phone: tap chips to bet, then Hit / Stand / Double / Split / Surrender.
import { $, setHud, setStatus, renderHand, cardEl } from './phone-kit.js?v=54';
import { CHIP_CLASS, money } from './casino.js?v=54';

let ctx = null, panelKey = '', boardKey = '';
const CHIPS = [5, 25, 100, 500];

export function reset() { panelKey = boardKey = ''; }

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', null); setHud('#hudC', null); setHud('#hudR', null);
}

const totalText = t => (t ? (t.t > 21 ? `Bust (${t.t})` : t.soft && t.t < 21 ? `${t.t - 10} or ${t.t}` : `${t.t}`) : '');
const RESULT = { win: 'You win', lose: 'You lose', bust: 'Bust', push: 'Push', blackjack: 'Blackjack!', surrender: 'Surrendered' };

function renderBoard(v) {
  const k = JSON.stringify([v.dealer, v.hands, v.active]);
  if (k === boardKey) return;
  boardKey = k;
  const el = $('#board');
  el.innerHTML = '';
  if (!v.dealer.cards.length) return;
  const d = document.createElement('div');
  d.className = 'bjp-dealer';
  d.innerHTML = '<small>Dealer</small>';
  const row = document.createElement('div');
  row.className = 'bjp-row';
  v.dealer.cards.forEach(c => row.appendChild(cardEl(c || null, !c)));
  d.appendChild(row);
  d.insertAdjacentHTML('beforeend', `<b>${v.dealer.total ? totalText(v.dealer.total) : ''}</b>`);
  el.appendChild(d);
}

function chipRow() {
  return `<div class="bjp-chips">${CHIPS.map(d => `<button class="cchip big ${CHIP_CLASS[d]}" data-chip="${d}"><b>${d}</b></button>`).join('')}</div>`;
}

function renderPanel(v) {
  const k = JSON.stringify([v.phase, v.bet, v.ready, v.stack, v.myTurn, v.can, v.insuranceAsked, v.active, v.hands.length]);
  if (k === panelKey) return;
  panelKey = k;
  const p = $('#panel');
  const send = a => ctx.send(a);
  p.innerHTML = '';
  if (v.phase === 'bet') {
    if (v.stack < v.min) {
      p.innerHTML = v.settings.rebuy ? '<button class="panel-btn go wide" id="bjRebuy">Rebuy</button>' : '<p class="bjp-hint">Out of chips.</p>';
      $('#bjRebuy')?.addEventListener('click', () => send({ type: 'rebuy' }));
      return;
    }
    p.innerHTML = `<div class="bjp-bet"><small>Your bet</small><b>${money(v.bet)}</b></div>${chipRow()}
      <div class="row"><button class="panel-btn" id="bjClear">Clear</button>${v.lastBet && v.lastBet !== v.bet && v.lastBet <= v.stack ? `<button class="panel-btn" id="bjSame">Same (${money(v.lastBet)})</button>` : ''}
      <button class="panel-btn go" id="bjReady" ${v.bet >= v.min ? '' : 'disabled'}>${v.ready ? '✓ Ready' : 'Deal me in'}</button></div>
      <p class="bjp-hint">Minimum bet ${v.min}. Tap chips to add to your bet.</p>`;
    p.querySelectorAll('[data-chip]').forEach(b => { b.onclick = () => { navigator.vibrate?.(8); send({ type: 'bet', amount: Math.min(v.stack, v.bet + Number(b.dataset.chip)) }); }; });
    $('#bjClear').onclick = () => send({ type: 'bet', amount: 0 });
    $('#bjSame')?.addEventListener('click', () => send({ type: 'bet', amount: v.lastBet }));
    $('#bjReady').onclick = () => send({ type: 'ready', on: !v.ready });
    return;
  }
  if (v.insuranceAsked) {
    p.innerHTML = `<p class="bjp-hint">The dealer shows an Ace. Insurance costs ${money(v.hands[0].bet / 2)} and pays 2 to 1 if the dealer has blackjack.</p>
      <div class="row"><button class="panel-btn" id="bjNo">No thanks</button><button class="panel-btn go" id="bjYes">Take insurance</button></div>`;
    $('#bjNo').onclick = () => send({ type: 'insurance', take: false });
    $('#bjYes').onclick = () => send({ type: 'insurance', take: true });
    return;
  }
  if (v.myTurn) {
    p.innerHTML = `<div class="bjp-actions">
      <button class="panel-btn go" data-a="hit">Hit</button><button class="panel-btn go" data-a="stand">Stand</button>
      ${v.can.double ? '<button class="panel-btn" data-a="double">Double</button>' : ''}
      ${v.can.split ? '<button class="panel-btn" data-a="split">Split</button>' : ''}
      ${v.can.surrender ? '<button class="panel-btn" data-a="surrender">Surrender</button>' : ''}</div>`;
    p.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => { navigator.vibrate?.(12); send({ type: b.dataset.a }); }; });
  }
}

export function render(c) {
  ctx = c;
  const v = c.st.game;
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Chips', money(v.stack), '');
  $('#hudC').innerHTML = `<span>Round</span><b>${v.round || '–'}</b>`;
  setHud('#hudR', 'Bet', money(v.hands.reduce((t, h) => t + h.bet, 0) || v.bet), '');
  document.body.classList.toggle('myturn', v.myTurn || v.insuranceAsked || (v.phase === 'bet' && !v.ready && v.stack >= v.min));

  const h = v.myTurn ? v.hands[v.active.hand] : v.hands[0];
  if (v.phase === 'bet') setStatus(v.ready ? "You're in" : 'Place your bet', v.ready ? 'Waiting for the others…' : `You have ${money(v.stack)}`);
  else if (v.phase === 'settle') setStatus(v.result === null ? 'Round over' : v.result > 0 ? `You won ${money(v.result)}` : v.result < 0 ? `You lost ${money(-v.result)}` : 'Push', v.hands.map(x => RESULT[x.result]).join(' · '));
  else if (!v.inRound) setStatus('Sitting this one out', 'Bet when the next round starts');
  else if (v.myTurn) setStatus(totalText(h.total), `${v.hands.length > 1 ? `Hand ${v.active.hand + 1} of ${v.hands.length} · ` : ''}Dealer shows ${v.dealer.up === 11 ? 'an Ace' : v.dealer.up}`);
  else if (v.phase === 'insurance') setStatus(v.insuranceAsked ? 'Insurance?' : 'Waiting…', '');
  else setStatus(v.hands.every(x => x.done) ? 'Your hand is done' : 'Wait for your turn', v.hands.map(x => totalText(x.total)).join(' · '));

  renderBoard(v);
  renderPanel(v);
  // Your cards: the hand you're playing (or your first hand).
  renderHand(h ? h.cards : [], { hint: v.hands.length > 1 ? v.hands.map((x, i) => `Hand ${i + 1}: ${totalText(x.total)}${x.result ? ' ' + RESULT[x.result] : ''}`).join(' · ') : '' });
}
