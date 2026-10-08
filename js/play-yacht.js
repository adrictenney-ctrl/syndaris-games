// Yacht Club on a player's phone: your dice (tap to keep), the Roll button (or give the
// phone a shake), and your score card. Tap an open box, then confirm, to score it.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=63';
import { UPPER, LOWER, LABEL, HINT } from './yacht.js?v=63';
import { dieHTML } from './table-yacht.js?v=63';

let ctx = null;
let pick = null;            // the box picked, waiting for the confirm tap
let lastRoll = -1;
let wasMyTurn = false;
let shakeOn = false, lastShake = 0;

export function reset() {
  pick = null;
  lastRoll = -1;
  document.getElementById('ycPhone')?.remove();
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', null);
  setHud('#hudR', null);
  setHud('#hudC', null);
  document.getElementById('ycPhone')?.remove();
}

function el() {
  let e = document.getElementById('ycPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'ycPhone';
    e.innerHTML = '<div class="yp-dice"></div><div class="yp-act"></div><div class="yp-card"></div>';
    e.addEventListener('click', onClick);
    $('#status').after(e);
  }
  return e;
}

const myTurn = () => { const g = ctx.st.game; return !g.over && g.turn === ctx.st.you; };

function roll() {
  const g = ctx.st.game;
  if (!myTurn() || g.rolls >= 3 || (g.rolls && g.held.every(Boolean))) return;
  pick = null;
  ctx.send({ type: 'roll' });
  navigator.vibrate?.([20, 30, 20]);
}

// Shake to roll. iPhones ask permission once, on the first tap of Roll.
async function enableShake() {
  if (shakeOn) return;
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
      if ((await DeviceMotionEvent.requestPermission()) !== 'granted') return;
    }
  } catch { return; }
  shakeOn = true;
  window.addEventListener('devicemotion', e => {
    const a = e.accelerationIncludingGravity;
    if (!a || !ctx?.st?.game || ctx.st.gameId !== 'yacht') return;
    const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    if (m > 24 && Date.now() - lastShake > 1500) { lastShake = Date.now(); roll(); }
  });
}

function onClick(e) {
  const g = ctx.st.game;
  const d = e.target.closest('[data-i]');
  if (d && myTurn() && g.rolls && g.rolls < 3) { ctx.send({ type: 'hold', i: Number(d.dataset.i) }); navigator.vibrate?.(10); return; }
  if (e.target.closest('#ypRoll')) { enableShake(); roll(); return; }
  const box = e.target.closest('[data-cat]');
  if (box && g.options && box.dataset.cat in g.options) { pick = pick === box.dataset.cat ? null : box.dataset.cat; render(ctx); return; }
  if (e.target.closest('#ypScore') && pick) { ctx.send({ type: 'score', cat: pick }); pick = null; navigator.vibrate?.(15); }
}

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  const t = g.totals[you];
  const mine = myTurn();
  const leader = Object.entries(g.totals).sort((a, b) => b[1].total - a[1].total)[0];
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'You', t.total, t.bonus ? 'bonus won' : `${t.upper}/63 top`);
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b><em class="of">of 13</em>`;
  if (leader && Number(leader[0]) !== you) setHud('#hudR', c.nameOf(Number(leader[0])), leader[1].total, 'leading');
  else setHud('#hudR', g.order.length > 1 ? 'Leading' : 'Solo', t.total, '');

  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  if (!mine || !g.options || !(pick in g.options)) pick = null;

  if (g.over) setStatus('Game over', 'Final scores are on the table');
  else if (!mine) setStatus(`${c.nameOf(g.turn)} is rolling…`, 'Your card is below');
  else if (!g.rolls) setStatus('Your turn', 'Tap Roll — or shake your phone');
  else if (g.rolls < 3) setStatus(`Roll ${g.rolls} of 3`, 'Tap dice to keep them, then roll again — or pick a box');
  else setStatus('Pick a box', 'That was your last roll');

  const e = el();
  // Dice
  const rolled = g.rollId !== lastRoll && lastRoll !== -1;
  lastRoll = g.rollId;
  e.querySelector('.yp-dice').innerHTML = g.rolls || !mine
    ? g.dice.map((v, i) => `<button class="yp-die${g.held[i] ? ' kept' : ''}" data-i="${i}" ${mine && g.rolls && g.rolls < 3 ? '' : 'disabled'}>${dieHTML(v, rolled && !g.held[i] ? 'tumble' : '')}<small>${g.held[i] ? 'Kept' : ''}</small></button>`).join('')
    : '<p class="yp-empty">Five dice, three rolls.</p>';
  // Actions
  const act = e.querySelector('.yp-act');
  if (mine && pick) {
    act.innerHTML = `<button class="panel-btn go" id="ypScore">Score ${g.options[pick]} in ${LABEL[pick]}</button>`;
  } else if (mine && g.rolls < 3) {
    const allKept = g.rolls && g.held.every(Boolean);
    act.innerHTML = `<button class="panel-btn go" id="ypRoll" ${allKept ? 'disabled' : ''}>${!g.rolls ? 'Roll the dice' : `Roll again · ${3 - g.rolls} left`}</button>`;
  } else act.innerHTML = '';
  // Card
  const card = g.cards[you];
  const row = k => {
    const v = card[k];
    if (v != null) return `<li class="done"><span>${LABEL[k]}</span><b>${v === 0 ? '—' : v}</b></li>`;
    const o = g.options && k in g.options;
    return `<li class="${o ? 'open' : ''}${pick === k ? ' pick' : ''}${o && g.options[k] === 0 ? ' nil' : ''}" ${o ? `data-cat="${k}"` : ''}><span>${LABEL[k]}<small>${HINT[k]}</small></span><b>${o ? g.options[k] : ''}</b></li>`;
  };
  e.querySelector('.yp-card').innerHTML = `
    <ul>${UPPER.map(row).join('')}<li class="sum"><span>Bonus <small>35 when the top reaches 63</small></span><b>${t.bonus ? 35 : `${t.upper}/63`}</b></li></ul>
    <ul>${LOWER.map(row).join('')}${t.yachtBonus ? `<li class="sum"><span>Yacht bonus</span><b>${t.yachtBonus}</b></li>` : ''}</ul>`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
