// Texas Hold'em on a player's phone: hole cards, betting controls.
import { GAMES } from './games.js?v=4';
import { $, setHud, setStatus, renderHand, cardEl } from './phone-kit.js?v=4';

const LAYOUT = GAMES.holdem.layout;
let ctx = null;
let hidden = false;       // player tapped their cards face down
let raising = false;      // raise panel open
let raiseTo = 0;
let panelKey = '';
let wasMyTurn = false;
let lastHandNo = null;

const fmt = n => Number(n).toLocaleString();

export function reset() {
  raising = false;
  panelKey = '';
  lastHandNo = null;
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${LAYOUT[you].name}`;
  setHud('#hudL', null);
  setHud('#hudR', null);
  setHud('#hudC', null);
  $('#board').innerHTML = '';
}

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  const me = g.me;
  if (g.handNo !== lastHandNo) { lastHandNo = g.handNo; raising = false; }

  const tags = [];
  if (g.button === you) tags.push('dealer');
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${LAYOUT[you].name}${tags.length ? ' · ' + tags.join(' · ') : ''}`;

  setHud('#hudL', 'Chips', fmt(me.chips), me.bet ? `bet ${fmt(me.bet)}` : '');
  $('#hudC').innerHTML = g.phase === 'gameOver' ? '' : `<span>Pot</span><b>${fmt(g.pot)}</b>`;
  const betting = ['preflop', 'flop', 'turn', 'river'].includes(g.phase);
  setHud('#hudR', 'To call', betting && me.inHand && !me.folded && me.toCall > 0 ? fmt(me.toCall) : '—');

  // Board preview.
  const board = $('#board');
  const bkey = g.handNo + ':' + g.board.join(',');
  if (board.dataset.key !== bkey) {
    board.dataset.key = bkey;
    board.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      if (g.board[i]) board.appendChild(cardEl(g.board[i]));
      else { const e = document.createElement('div'); e.className = 'slot'; board.appendChild(e); }
    }
  }
  const best = g.phase === 'showdown' && g.result.type === 'showdown' && g.result.hands[you];
  $('#myHand').textContent = me.inHand && !me.folded && me.handName ? `You have: ${best ? best.name : me.handName}` : '';

  const myTurn = betting && g.toAct === you && me.inHand && !me.folded;
  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;
  if (!myTurn) raising = false;

  renderStatus(g, you, me, myTurn);
  renderPanel(g, me, myTurn);
  renderHand(me.cards || [], {
    faceDown: hidden,
    onTap: () => { hidden = !hidden; render(ctx); },
    hint: me.cards?.length ? (hidden ? 'Tap to look at your cards' : 'Tap your cards to hide them') : '',
  });
}

function renderStatus(g, you, me, myTurn) {
  const nameOf = ctx.nameOf;
  if (g.phase === 'gameOver') {
    return setStatus(g.winner === you ? '🏆 You win the game!' : `${nameOf(g.winner)} wins the game`, 'Look at the table for a rematch');
  }
  if (g.phase === 'showdown') {
    const mine = g.result.winners.find(w => w.seat === you);
    const top = g.result.winners.slice().sort((a, b) => b.amount - a.amount)[0];
    if (mine) return setStatus(`You win ${fmt(mine.amount)}!`, mine.hand || 'Everyone else folded');
    return setStatus(`${nameOf(top.seat)} wins ${fmt(top.amount)}`, top.hand || 'Everyone else folded');
  }
  if (!me.inHand) {
    if (me.chips === 0) return setStatus('Out of chips', g.rebuy ? 'Rebuy to get back in' : 'Watch the rest of the game');
    return setStatus("You're in next hand", 'Hang tight while this one finishes');
  }
  if (me.folded) return setStatus('You folded', 'Waiting for the next hand');
  const onTable = g.seats.filter(s => s && s.inHand && !s.folded).length;
  if (g.toAct < 0) return setStatus('All in — dealing it out', `${onTable} players left`);
  if (myTurn) {
    if (me.toCall > 0) return setStatus('Your turn', me.toCall >= me.chips ? `Call all in for ${fmt(me.chips)}, or fold` : `${fmt(me.toCall)} to call`);
    return setStatus('Your turn', 'Check or bet');
  }
  const last = g.seats[g.toAct]?.last;
  setStatus(`${nameOf(g.toAct)} is thinking…`, me.allIn ? "You're all in" : last ? `${nameOf(g.toAct)}: ${last}` : '');
}

function clampRaise(v, me) {
  const step = Math.max(1, ctx.st.game.bb / 2);
  let x = Math.round(v / step) * step;
  if (x >= me.maxRaiseTo - step / 2) x = me.maxRaiseTo;
  return Math.max(me.minRaiseTo, Math.min(me.maxRaiseTo, x));
}

function renderPanel(g, me, myTurn) {
  const key = [g.phase, g.toAct, myTurn, raising, g.handNo, me.chips, me.inHand, g.currentBet].join('|');
  if (key === panelKey) return;
  panelKey = key;
  const p = $('#panel');
  p.innerHTML = '';
  const send = ctx.send;

  if (!me.inHand && me.chips === 0 && g.rebuy && g.phase !== 'gameOver') {
    p.innerHTML = '<button class="panel-btn go wide" id="rebuy">Rebuy</button>';
    $('#rebuy').onclick = () => send({ type: 'rebuy' });
    return;
  }
  if (!myTurn) return;

  const canRaise = me.maxRaiseTo > g.currentBet && me.chips > me.toCall;
  const verb = g.currentBet === 0 ? 'Bet' : 'Raise';

  if (raising) {
    raiseTo = clampRaise(raiseTo || me.minRaiseTo, me);
    const potRaise = g.currentBet + g.pot + me.toCall;
    p.innerHTML = `
      <div class="raise-amt"><small>${verb} to</small><b id="raiseVal">${fmt(raiseTo)}</b></div>
      <input type="range" id="raiseSlider" min="${me.minRaiseTo}" max="${me.maxRaiseTo}" step="${Math.max(1, g.bb / 2)}" value="${raiseTo}">
      <div class="row quick">
        <button class="panel-btn" data-to="${me.minRaiseTo}">Min</button>
        <button class="panel-btn" data-to="${g.currentBet + Math.round((g.pot + me.toCall) / 2)}">½ Pot</button>
        <button class="panel-btn" data-to="${potRaise}">Pot</button>
        <button class="panel-btn" data-to="${me.maxRaiseTo}">All in</button>
      </div>
      <div class="row"><button class="panel-btn" id="back">Back</button><button class="panel-btn go" id="confirm"></button></div>`;
    const setTo = v => {
      raiseTo = clampRaise(v, me);
      $('#raiseVal').textContent = fmt(raiseTo);
      $('#raiseSlider').value = raiseTo;
      $('#confirm').textContent = raiseTo >= me.maxRaiseTo ? `All in ${fmt(raiseTo)}` : `${verb} to ${fmt(raiseTo)}`;
    };
    setTo(raiseTo);
    $('#raiseSlider').oninput = e => setTo(Number(e.target.value));
    p.querySelectorAll('[data-to]').forEach(b => { b.onclick = () => setTo(Number(b.dataset.to)); });
    $('#back').onclick = () => { raising = false; panelKey = ''; renderPanel(g, me, myTurn); };
    $('#confirm').onclick = () => { raising = false; send({ type: 'raise', to: raiseTo }); };
    return;
  }

  const callAll = me.toCall >= me.chips;
  p.innerHTML = `<div class="row">
      ${me.toCall > 0 ? '<button class="panel-btn fold" id="fold">Fold</button>' : ''}
      <button class="panel-btn ${me.toCall > 0 ? '' : 'go'}" id="call">${me.toCall > 0 ? (callAll ? `All in ${fmt(me.chips)}` : `Call ${fmt(me.toCall)}`) : 'Check'}</button>
      ${canRaise ? `<button class="panel-btn go" id="raise">${verb}</button>` : ''}
    </div>`;
  $('#fold')?.addEventListener('click', () => send({ type: 'fold' }));
  $('#call').onclick = () => send({ type: me.toCall > 0 ? 'call' : 'check' });
  $('#raise')?.addEventListener('click', () => { raising = true; raiseTo = me.minRaiseTo; panelKey = ''; renderPanel(g, me, myTurn); });
}
