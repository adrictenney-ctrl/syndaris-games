// Cash Out on a player's phone: the pot, your score, and one big button — CASH OUT —
// that works any time after the first roll. When it's your roll, tap Roll (or shake).
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=51';
import { SAFE } from './cashout.js?v=51';
import { dieHTML } from './table-yacht.js?v=51';

let ctx = null, panelKey = '', wasMyRoll = false, shakeOn = false, lastShake = 0;

export function reset() { panelKey = ''; }

export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  $('#board').innerHTML = '';
}

const myRoll = () => { const g = ctx.st.game; return g.phase === 'roll' && g.roller === ctx.st.you; };
function roll() { if (myRoll()) { ctx.send({ type: 'roll' }); navigator.vibrate?.([20, 30, 20]); } }

async function enableShake() {
  if (shakeOn) return;
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission && (await DeviceMotionEvent.requestPermission()) !== 'granted') return;
  } catch { return; }
  shakeOn = true;
  window.addEventListener('devicemotion', e => {
    const a = e.accelerationIncludingGravity;
    if (!a || ctx?.st?.gameId !== 'cashout') return;
    if (Math.hypot(a.x || 0, a.y || 0, a.z || 0) > 24 && Date.now() - lastShake > 1500) { lastShake = Date.now(); roll(); }
  });
}

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Your score', g.you.score.toLocaleString());
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b><em class="of">of ${g.rounds}</em>`;
  const lead = g.order.filter(s => s !== you).sort((a, b) => g.scores[b] - g.scores[a])[0];
  if (lead != null) setHud('#hudR', c.nameOf(lead), g.scores[lead].toLocaleString(), g.scores[lead] > g.you.score ? 'ahead' : 'behind');
  else setHud('#hudR', null);

  const mine = myRoll();
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyRoll) navigator.vibrate?.([60, 40, 60]);
  wasMyRoll = mine;

  // The pot and the dice.
  const board = $('#board');
  board.innerHTML = `<div class="co-phone${g.danger && g.phase === 'roll' ? ' danger' : ''}${g.phase === 'roundOver' && g.bustBy != null ? ' bust' : ''}">
      <small>${g.phase === 'roundOver' ? (g.bustBy != null ? 'Seven! The pot is gone' : 'Round over') : 'The pot'}</small>
      <b>${g.pot.toLocaleString()}</b>
      <div class="co-pdice">${g.dice ? g.dice.map(d => dieHTML(d)).join('') : ''}${g.last ? `<em class="${g.last.effect === 'bust' ? 'bad' : ''}">${g.last.effect === 'bust' ? '7' : g.last.effect}</em>` : ''}</div>
      <p>${g.phase === 'roll' ? (g.rolls < SAFE ? `Roll ${g.rolls + 1} · safe` : `Roll ${g.rolls + 1} · a 7 ends the round`) : ''}</p>
    </div>`;

  if (g.phase === 'over') {
    const won = g.winners.includes(you);
    setStatus(won ? '🏆 You win!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, `${g.you.score.toLocaleString()} points · look at the table to play again`);
  } else if (g.phase === 'roundOver') setStatus(g.you.banked != null ? `You banked ${g.you.banked}` : g.bustBy != null ? 'Busted!' : 'Round over', 'Next round in a moment');
  else if (g.you.banked != null) setStatus(`Cashed out · +${g.you.banked}`, 'Sit back and watch the others sweat');
  else if (mine) setStatus(g.rolls ? 'Your roll' : 'You start the round', g.rolls >= SAFE ? 'A 7 now wipes the pot for everyone still in' : 'Tap Roll — or shake your phone');
  else setStatus(`${c.nameOf(g.roller)} is rolling`, g.rolls ? 'Cash out whenever you like' : 'Waiting for the first roll');

  const key = [g.phase, mine, g.you.in, g.rolls > 0, g.pot].join('|');
  if (key !== panelKey) {
    panelKey = key;
    const p = $('#panel');
    p.innerHTML = '';
    if (g.phase === 'roll' && g.you.in) {
      p.innerHTML = `<button class="co-bank" id="coBank" ${g.rolls ? '' : 'disabled'}><span>Cash out</span><small>${g.rolls ? `bank ${g.pot.toLocaleString()} now` : 'after the first roll'}</small></button>
        ${mine ? '<button class="panel-btn wide" id="coRoll">Roll the dice</button>' : ''}`;
      $('#coBank').onclick = () => { ctx.send({ type: 'bank' }); navigator.vibrate?.([30, 20, 60]); };
      if (mine) $('#coRoll').onclick = () => { enableShake(); roll(); };
    }
  }
  renderHand([]);
}
