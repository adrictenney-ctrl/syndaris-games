// Euchre on a player's phone: bidding buttons and the hand of cards.
import { SEAT_NAME, SUITS, SUIT_SYMBOL, SUIT_NAME, cardLabel, suitOf, effSuit, isRed, teamOf, partnerOf } from './euchre.js?v=15';
import { $, toast, setHud, setStatus, renderHand, flyCard, cardEl } from './phone-kit.js?v=15';

let selected = null;
let goAlone = false;
let wasMyTurn = false;
let lastHandNo = null;
let panelKey = '';
let ctx = null;

export function reset() {
  selected = null;
  goAlone = false;
  panelKey = '';
  lastHandNo = null;
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${SEAT_NAME[you]} · partner ${c.nameOf(partnerOf(you))}`;
  setHud('#hudL', 'Us', 0);
  setHud('#hudR', 'Them', 0);
  setHud('#hudC', null);
}

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  const nameOf = c.nameOf;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${nameOf(you)} · ${SEAT_NAME[you]} · partner ${nameOf(partnerOf(you))}`;

  if (g.handNo !== lastHandNo) { lastHandNo = g.handNo; goAlone = false; selected = null; }

  const us = teamOf(you);
  const showTricks = !!g.trump && g.phase !== 'discard';
  setHud('#hudL', 'Us', g.score[us], showTricks ? `${g.tricksWon[you] + g.tricksWon[partnerOf(you)]} tricks` : '');
  setHud('#hudR', 'Them', g.score[1 - us], showTricks ? `${g.tricksWon[(you + 1) % 4] + g.tricksWon[(you + 3) % 4]} tricks` : '');
  $('#hudC').innerHTML = g.trump ? `<span>Trump</span><b class="${isRed(g.trump) ? 'red' : ''}">${SUIT_SYMBOL[g.trump]}</b>` : '';

  const myTurn = g.turn === you && ['bid1', 'bid2', 'discard', 'play'].includes(g.phase);
  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;
  if (!g.legal.includes(selected)) selected = null;

  renderStatus(g, you, myTurn);
  renderPanel(g, you, myTurn);
  drawHand();
}

function drawHand() {
  const g = ctx.st.game;
  const playing = g.turn === ctx.st.you && (g.phase === 'play' || g.phase === 'discard');
  renderHand(g.hand, {
    dim: playing ? g.hand.filter(c => !g.legal.includes(c)) : null,
    selected,
    onTap: tapCard,
    onSwipe: playing && g.phase === 'play' ? card => g.legal.includes(card) && playCard(card) : null,
    hint: playing ? (g.phase === 'play' ? 'Tap a card twice or swipe it up to play' : 'Tap the card you want to get rid of') : '',
  });
}

function renderStatus(g, you, myTurn) {
  const nameOf = ctx.nameOf;
  const up = g.upcard ? cardLabel(g.upcard) : '';
  const out = g.alone !== null && partnerOf(g.alone) === you;
  let main = '', sub = '';
  switch (g.phase) {
    case 'bid1':
      if (myTurn) {
        main = 'Your call';
        sub = you === g.dealer ? `Pick up the ${up}, or pass` : `Order the ${up} up to ${nameOf(g.dealer)}, or pass`;
      } else { main = `${nameOf(g.turn)} is deciding…`; sub = `Up-card ${up} · ${nameOf(g.dealer)} dealt`; }
      break;
    case 'bid2':
      if (myTurn) {
        const stuck = you === g.dealer && g.stickDealer;
        main = stuck ? "You're stuck — name trump" : 'Name trump';
        sub = `${SUIT_NAME[suitOf(g.upcard)]} is out${stuck ? '' : ' · or pass'}`;
      } else { main = `${nameOf(g.turn)} is choosing trump…`; sub = `${SUIT_NAME[suitOf(g.upcard)]} was turned down`; }
      break;
    case 'discard':
      if (myTurn) { main = 'Discard a card'; sub = `You picked up the ${up}`; }
      else { main = `${nameOf(g.dealer)} is discarding…`; sub = `${nameOf(g.maker)} called ${SUIT_NAME[g.trump]}`; }
      break;
    case 'play':
      if (out) { main = 'Sit this one out'; sub = `Your partner ${nameOf(g.alone)} is going alone`; }
      else if (myTurn) {
        main = 'Your turn';
        sub = g.trick.length ? `Follow ${SUIT_NAME[effSuit(g.trick[0].card, g.trump)]} if you can` : 'You lead — play any card';
      } else { main = `${nameOf(g.turn)}'s turn`; sub = `${nameOf(g.maker)} called ${SUIT_NAME[g.trump]}${g.alone !== null ? ' — alone' : ''}`; }
      break;
    case 'trickEnd':
      main = g.trickWinner === you ? 'You take the trick!' : `${nameOf(g.trickWinner)} takes the trick`;
      sub = teamOf(g.trickWinner) === teamOf(you) ? 'Nice.' : '';
      break;
    case 'handEnd':
    case 'gameOver': {
      const r = g.result, ours = r.team === teamOf(you);
      if (r.euchred) main = ours ? 'Euchred them! +2' : 'Euchred… they get 2';
      else if (r.march) main = ours ? `All 5 tricks! +${r.pts}` : `They swept it · +${r.pts}`;
      else main = ours ? 'We made it · +1' : 'They made it · +1';
      if (g.phase === 'gameOver') { main = g.winner === teamOf(you) ? '🏆 You win!' : 'They win this one'; sub = 'Look at the table for a rematch'; }
      else sub = 'Next hand coming up…';
      break;
    }
  }
  setStatus(main, sub);
}

function upcardMini(card) {
  const wrap = document.createElement('div');
  wrap.className = 'upcard-mini';
  wrap.appendChild(cardEl(card));
  wrap.append('Up-card');
  return wrap;
}

function renderPanel(g, you, myTurn) {
  const key = [g.phase, g.turn, myTurn, selected, g.handNo].join('|');
  if (key === panelKey) return;
  panelKey = key;
  const p = $('#panel');
  const aloneBox = `<label class="alone"><input type="checkbox" id="alone" ${goAlone ? 'checked' : ''}> Go alone (partner sits out)</label>`;
  p.innerHTML = '';
  const send = ctx.send;

  if (myTurn && g.phase === 'bid1') {
    p.innerHTML = `
      <div class="row"><button class="panel-btn" id="pass">Pass</button>
      <button class="panel-btn go" id="order">${you === g.dealer ? 'Pick it up' : 'Order it up'} ${SUIT_SYMBOL[suitOf(g.upcard)]}</button></div>${aloneBox}`;
    $('#pass').onclick = () => send({ type: 'pass' });
    $('#order').onclick = () => send({ type: 'order', alone: goAlone });
    p.prepend(upcardMini(g.upcard));
  } else if (myTurn && g.phase === 'bid2') {
    const stuck = you === g.dealer && g.stickDealer;
    const suits = SUITS.filter(s => s !== suitOf(g.upcard))
      .map(s => `<button class="panel-btn suit ${isRed(s) ? 'red' : ''}" data-suit="${s}">${SUIT_SYMBOL[s]}<small>${SUIT_NAME[s]}</small></button>`).join('');
    p.innerHTML = `<div class="row">${suits}</div>
      <div class="row"><button class="panel-btn" id="pass" ${stuck ? 'disabled' : ''}>${stuck ? 'Stuck — must call' : 'Pass'}</button></div>${aloneBox}`;
    p.querySelectorAll('[data-suit]').forEach(b => { b.onclick = () => send({ type: 'call', suit: b.dataset.suit, alone: goAlone }); });
    $('#pass').onclick = () => send({ type: 'pass' });
  } else if (myTurn && g.phase === 'discard') {
    p.innerHTML = `<button class="panel-btn go wide" id="doit" ${selected ? '' : 'disabled'}>${selected ? 'Discard ' + cardLabel(selected) : 'Tap a card to discard'}</button>`;
    $('#doit').onclick = () => selected && playCard(selected);
  } else if (myTurn && g.phase === 'play' && selected) {
    p.innerHTML = `<button class="panel-btn go wide" id="doit">Play ${cardLabel(selected)}</button>`;
    $('#doit').onclick = () => playCard(selected);
  } else if (g.phase === 'bid1' && !myTurn) {
    p.appendChild(upcardMini(g.upcard));
  }
  const box = $('#alone');
  if (box) box.onchange = e => { goAlone = e.target.checked; };
}

function canPlay(card) {
  const g = ctx.st.game;
  return g.turn === ctx.st.you && (g.phase === 'play' || g.phase === 'discard') && g.legal.includes(card);
}

function playCard(card) {
  const g = ctx.st.game;
  if (!canPlay(card)) return;
  flyCard(card);
  selected = null;
  navigator.vibrate?.(15);
  ctx.send(g.phase === 'discard' ? { type: 'discard', card } : { type: 'play', card });
}

function tapCard(card) {
  const g = ctx.st.game;
  if (g.turn !== ctx.st.you || !(g.phase === 'play' || g.phase === 'discard')) return;
  if (!g.legal.includes(card)) return toast(`You have to follow ${SUIT_NAME[effSuit(g.trick[0].card, g.trump)]}`);
  if (selected === card && g.phase === 'play') return playCard(card);
  selected = card;
  panelKey = '';
  renderPanel(g, ctx.st.you, true);
  drawHand();
}
