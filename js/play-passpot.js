// Pass the Pot on a phone: your chips, a big Roll button on your turn (or shake the phone),
// and what your last throw did.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { ppDie, chipStack } from './table-passpot.js?v=68';

let ctx = null, wasMyTurn = false, lastShake = 0, shakeOn = false;

export function reset() { document.getElementById('ppPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('ppPhone');
  if (!e) { e = document.createElement('div'); e.id = 'ppPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

const myTurn = () => { const g = ctx.st.game; return g.phase === 'roll' && g.turn === ctx.st.you; };
function roll() {
  if (!myTurn()) return;
  ctx.send({ type: 'roll' });
  navigator.vibrate?.([20, 30, 20]);
}

function onShake(e) {
  const a = e.accelerationIncludingGravity;
  if (!a || !ctx) return;
  const f = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
  if (f > 24 && Date.now() - lastShake > 1500) { lastShake = Date.now(); roll(); }
}
function armShake() {
  if (shakeOn) return;
  shakeOn = true;
  const go = () => window.addEventListener('devicemotion', onShake);
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') DeviceMotionEvent.requestPermission().then(r => r === 'granted' && go()).catch(() => {});
  else go();
}

function onClick(ev) {
  if (ev.target.closest('[data-x="roll"]')) { armShake(); roll(); }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Your chips', g.chips[you]);
  $('#hudC').innerHTML = `<span>Pot</span><b>${g.pot}</b>`;
  const best = g.order.filter(s => s !== you).sort((a, b) => g.chips[b] - g.chips[a])[0];
  if (best != null) setHud('#hudR', c.nameOf(best), g.chips[best]);
  const mine = myTurn();
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  const n = Math.min(3, g.chips[you]);
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 The pot is yours!' : `${c.nameOf(g.winner)} takes the pot`, 'Look at the table to play again');
  else if (mine) setStatus('Your turn', `Roll ${n} ${n === 1 ? 'die' : 'dice'} — tap or shake`);
  else if (!g.chips[you]) setStatus('No chips — but you\'re still in', `${c.nameOf(g.left)} or ${c.nameOf(g.right)} might pass you one`);
  else setStatus(`${c.nameOf(g.turn)} is rolling`, `◀ goes to ${c.nameOf(g.left)} · ▶ goes to ${c.nameOf(g.right)}`);
  const L = g.last && g.last.seat === you ? g.last : null;
  el().innerHTML = `<div class="pp-mypile">${chipStack(g.chips[you])}<b>${g.chips[you]}</b></div>
    ${L ? `<div class="pp-mine-throw">${L.dice.map(f => ppDie(f)).join('')}</div>` : ''}
    ${mine ? `<button class="panel-btn go pp-roll" data-x="roll">🎲 Roll ${n} ${n === 1 ? 'die' : 'dice'}</button>` : ''}
    <div class="pp-key">${ppDie('L')}<span>left</span>${ppDie('R')}<span>right</span>${ppDie('P')}<span>pot</span>${ppDie('K')}<span>keep</span></div>`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
