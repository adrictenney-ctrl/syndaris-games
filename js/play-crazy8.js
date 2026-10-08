// Crazy Eights on a player's phone: cards you can play stand up, the rest are dimmed.
// Tap (or swipe up) a card to play it; an eight asks you which suit to call.
import { $, toast, setHud, setStatus, renderHand, cardEl, flyCard } from './phone-kit.js?v=63';
import { SUIT_NAME, SUITS } from './crazy8.js?v=63';
import { SUIT_SYMBOL } from './cards.js?v=63';

let ctx = null, eight = null, panelKey = '', wasMyTurn = false;

export function reset() { eight = null; panelKey = ''; }

export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  $('#board').innerHTML = '';
}

function play(card) {
  const g = ctx.st.game;
  if (g.phase !== 'play' || g.turn !== ctx.st.you) return;
  if (!g.playable.includes(card)) return toast(`That doesn't match — ${SUIT_NAME[g.suit].toLowerCase()}, ${g.top[0] === 'T' ? '10' : g.top[0]}s or an eight`);
  if (card[0] === '8') { eight = card; panelKey = ''; render(ctx); return; }
  flyCard(card);
  ctx.send({ type: 'play', card });
  navigator.vibrate?.(15);
}

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Cards', g.hand.length);
  $('#hudC').innerHTML = `<span>Suit</span><b class="c8-hud s-${g.suit}">${SUIT_SYMBOL[g.suit]}</b>`;
  if (g.target) setHud('#hudR', 'Points', g.scores[you], `to ${g.target}`); else setHud('#hudR', 'Stock', g.stock);

  const mine = g.phase === 'play' && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  if (!mine || (eight && !g.hand.includes(eight))) eight = null;

  // The card to match.
  const board = $('#board');
  if (board.dataset.k !== g.top + g.suit) {
    board.dataset.k = g.top + g.suit;
    board.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'c8-top';
    wrap.appendChild(cardEl(g.top));
    if (g.top[0] === '8') wrap.insertAdjacentHTML('beforeend', `<span class="c8-called s-${g.suit}">${SUIT_SYMBOL[g.suit]} ${SUIT_NAME[g.suit]}</span>`);
    board.appendChild(wrap);
  }

  if (g.phase === 'over' || g.phase === 'handOver') {
    const r = g.result;
    setStatus(r.winner === you ? `You went out! +${r.won}` : `${c.nameOf(r.winner)} went out`, g.phase === 'over' ? 'Game over · look at the table' : 'Next hand in a moment');
  } else if (eight) setStatus('Call a suit', 'Which suit has to follow your eight?');
  else if (mine) {
    if (g.playable.length) setStatus('Your turn', g.drew ? 'You can play the card you drew' : 'Tap a card to play it');
    else setStatus(g.drew ? (g.drawUntil ? 'Still nothing — draw again' : 'No luck') : 'Nothing to play', g.drew && !g.drawUntil ? 'Pass to the next player' : 'Draw a card');
  } else setStatus(`${c.nameOf(g.turn)}'s turn`, `${g.counts[g.turn]} card${g.counts[g.turn] === 1 ? '' : 's'} left`);

  const key = [g.phase, mine, eight, g.drew, g.playable.length > 0, g.stock > 0].join('|');
  if (key !== panelKey) {
    panelKey = key;
    const p = $('#panel');
    p.innerHTML = '';
    if (eight) {
      p.innerHTML = `<div class="row c8-suits">${[...SUITS].map(s => `<button class="panel-btn suit s-${s} ${'HD'.includes(s) ? 'red' : ''}" data-s="${s}">${SUIT_SYMBOL[s]}<small>${SUIT_NAME[s]}</small></button>`).join('')}</div>
        <button class="panel-btn" id="c8Back">Keep the eight</button>`;
      p.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => { flyCard(eight); ctx.send({ type: 'play', card: eight, suit: b.dataset.s }); eight = null; }; });
      $('#c8Back').onclick = () => { eight = null; panelKey = ''; render(ctx); };
    } else if (mine) {
      const canDraw = !g.drew || g.drawUntil;
      p.innerHTML = `<div class="row">
        <button class="panel-btn" id="c8Draw" ${canDraw ? '' : 'disabled'}>Draw a card</button>
        <button class="panel-btn" id="c8Pass" ${g.drew || !g.stock ? '' : 'disabled'}>Pass</button></div>`;
      $('#c8Draw').onclick = () => { ctx.send({ type: 'draw' }); navigator.vibrate?.(10); };
      $('#c8Pass').onclick = () => ctx.send({ type: 'pass' });
    }
  }

  renderHand(g.hand, {
    dim: mine ? g.hand.filter(x => !g.playable.includes(x)) : null,
    onTap: play,
    onSwipe: play,
    hint: mine && g.playable.length && !eight ? 'Tap or swipe up a bright card to play it' : '',
  });
}
