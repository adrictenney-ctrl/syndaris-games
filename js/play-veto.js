// Veto on a player's phone: your hand, draw / keep, wild colours, "last card!".
import { GAMES } from './games.js?v=51';
import { COLORS, COLOR_NAME, cardName, parse } from './veto.js?v=51';
import { $, toast, setHud, setStatus, renderHand, flyCard, cardEl } from './phone-kit.js?v=51';

const LAYOUT = GAMES.veto.layout;
let ctx = null;
let selected = null;
let choosing = null;    // wild card waiting for a colour
let panelKey = '';
let wasMyTurn = false;

export function reset() {
  selected = null;
  choosing = null;
  panelKey = '';
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
  const nameOf = c.nameOf;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${nameOf(you)} · ${LAYOUT[you].name}`;

  setHud('#hudL', 'Cards', g.hand.length, g.called && g.hand.length === 1 ? 'called' : '');
  $('#hudC').innerHTML = g.phase === 'play'
    ? `<span>Colour</span><b class="swatch" style="--sw:${g.color ? `var(--oc-${g.color})` : 'transparent'}">${g.color ? COLOR_NAME[g.color] : 'Any'}</b>`
    : '';
  if (g.target) setHud('#hudR', 'Points', g.seats[you].score, `to ${g.target}`);
  else setHud('#hudR', 'Play', g.dir === 1 ? '↻' : '↺', g.dir === 1 ? 'clockwise' : 'reversed');

  // The pile, so you don't have to look up at the table to know what to match.
  const board = $('#board');
  const bkey = g.top + ':' + g.color;
  if (board.dataset.key !== bkey) {
    board.dataset.key = bkey;
    board.innerHTML = '';
    if (g.top) {
      const el = cardEl(g.top);
      el.classList.add('top-card');
      board.appendChild(el);
    }
  }
  $('#myHand').textContent = g.pending && g.turn === you ? `You're taxed ${g.pending} cards` : '';

  const myTurn = g.phase === 'play' && g.turn === you && g.active;
  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;
  if (!myTurn) { selected = null; choosing = null; }
  if (!g.legal.includes(selected)) selected = null;

  renderStatus(g, you, myTurn);
  renderPanel(g, you, myTurn);
  drawHand(g, myTurn);
}

function drawHand(g, myTurn) {
  renderHand(g.hand, {
    dim: myTurn ? g.hand.filter(id => !g.legal.includes(id)) : null,
    selected,
    onTap: tapCard,
    onSwipe: myTurn ? id => g.legal.includes(id) && playCard(id) : null,
    hint: myTurn ? (g.legal.length ? 'Tap a card twice or swipe it up to play' : 'Nothing matches — draw a card') : '',
  });
}

function renderStatus(g, you, myTurn) {
  const nameOf = ctx.nameOf;
  if (g.phase === 'gameOver') {
    return setStatus(g.winner === you ? '🏆 You win!' : `${nameOf(g.winner)} wins`, 'Look at the table for a rematch');
  }
  if (g.phase === 'roundEnd') {
    const r = g.result;
    return setStatus(r.winner === you ? `You went out! +${r.pts}` : `${nameOf(r.winner)} went out`, 'Next round coming up…');
  }
  if (!g.active) return setStatus("You're in next round", 'Hang tight while this one finishes');
  if (myTurn) {
    if (g.drew) return setStatus('You drew a playable card', `Play the ${cardName(g.drew)}, or keep it`);
    if (g.pending) return setStatus(`Taxed ${g.pending} cards`, g.legal.length ? 'Pass it on with a Tax card, or pay up' : `Pay up: draw ${g.pending}`);
    return setStatus('Your turn', g.color ? `Match ${COLOR_NAME[g.color]} or ${valueWord(g.top)}` : 'Play any card');
  }
  setStatus(`${nameOf(g.turn)}'s turn`, g.next === you ? "You're next" : '');
}

const valueWord = top => {
  const { c, v } = parse(top);
  if (c === 'W') return 'play a wild';
  return { skip: 'a Skip', rev: 'a Reverse', d2: 'a Tax' }[v] || `a ${v}`;
};

function renderPanel(g, you, myTurn) {
  const catchable = g.vulnerable != null && g.vulnerable !== you ? g.vulnerable : null;
  const key = [g.phase, g.turn, myTurn, selected, choosing, g.drew, g.hand.length, g.called, g.vulnerable, g.pending].join('|');
  if (key === panelKey) return;
  panelKey = key;
  const p = $('#panel');
  p.innerHTML = '';
  const send = ctx.send;
  const rows = [];

  if (catchable != null) rows.push(`<button class="panel-btn catch wide" id="catch">Catch ${ctx.nameOf(catchable)} — they didn't call it (they draw 2)</button>`);
  const mustCall = g.vulnerable === you;
  const canPreCall = myTurn && g.hand.length === 2 && !g.called && g.legal.length;
  if (mustCall || canPreCall) rows.push(`<button class="panel-btn call wide" id="call">Last card!</button>`);

  if (myTurn && choosing) {
    rows.push(`<p class="pick">Pick the new colour</p><div class="row colours">${COLORS.map(c =>
      `<button class="panel-btn colour" data-c="${c}" style="--sw:var(--oc-${c})">${COLOR_NAME[c]}</button>`).join('')}</div>
      <div class="row"><button class="panel-btn" id="cancelWild">Cancel</button></div>`);
  } else if (myTurn) {
    const main = [];
    if (g.drew) main.push('<button class="panel-btn" id="keep">Keep it</button>');
    else main.push(`<button class="panel-btn ${g.legal.length ? '' : 'go'}" id="draw">${g.pending ? `Pay the tax (draw ${g.pending})` : 'Draw a card'}</button>`);
    if (selected) main.push(`<button class="panel-btn go" id="play">Play ${cardName(selected)}</button>`);
    rows.push(`<div class="row">${main.join('')}</div>`);
  }
  p.innerHTML = rows.join('');

  $('#catch')?.addEventListener('click', () => send({ type: 'catch', target: catchable }));
  $('#call')?.addEventListener('click', () => { navigator.vibrate?.(30); send({ type: 'call' }); });
  $('#draw')?.addEventListener('click', () => send({ type: 'draw' }));
  $('#keep')?.addEventListener('click', () => send({ type: 'pass' }));
  $('#play')?.addEventListener('click', () => playCard(selected));
  $('#cancelWild')?.addEventListener('click', () => { choosing = null; panelKey = ''; renderPanel(g, you, myTurn); });
  p.querySelectorAll('[data-c]').forEach(b => {
    b.onclick = () => {
      const card = choosing;
      choosing = null;
      flyCard(card);
      selected = null;
      send({ type: 'play', card, color: b.dataset.c });
    };
  });
}

function playCard(id) {
  const g = ctx.st.game;
  if (!id || !g.legal.includes(id)) return;
  if (parse(id).c === 'W') {
    choosing = id;
    selected = id;
    panelKey = '';
    renderPanel(g, ctx.st.you, true);
    drawHand(g, true);
    return;
  }
  flyCard(id);
  selected = null;
  navigator.vibrate?.(15);
  ctx.send({ type: 'play', card: id });
}

function tapCard(id) {
  const g = ctx.st.game;
  if (!(g.phase === 'play' && g.turn === ctx.st.you)) return;
  if (!g.legal.includes(id)) {
    if (g.drew) return toast('You can only play the card you just drew');
    if (g.pending) return toast(`Pass the tax on with a Tax card, or pay ${g.pending}`);
    if (parse(id).v === 'd4') return toast(`A Wild Tax only works when you have no ${COLOR_NAME[g.color]}`);
    return toast(g.color ? `Play ${COLOR_NAME[g.color]} or match the number` : "That can't be played now");
  }
  if (selected === id) return playCard(id);
  selected = id;
  choosing = null;
  panelKey = '';
  renderPanel(g, ctx.st.you, true);
  drawHand(g, true);
}
