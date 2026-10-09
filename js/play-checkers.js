// Checkers on a player's phone: the board turned to your side, tap a piece then where it lands.
// For a multiple jump, tap the square it finishes on.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { targetsFrom, num, NAME, isKing, colorOf } from './checkers.js?v=66';

let ctx = null;
let selected = null;
let lastKey = '';
let panelKey = '';
let resignArmed = false;
let wasMyTurn = false;

export function reset() {
  selected = null;
  lastKey = panelKey = '';
  resignArmed = false;
  document.getElementById('drPhone')?.remove();
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · plays ${you === 0 ? 'Ebony (moves first)' : 'Ivory'}`;
  setHud('#hudL', null);
  setHud('#hudR', null);
  setHud('#hudC', null);
  document.getElementById('drPhone')?.remove();
}

function boardEl() {
  let el = document.getElementById('drPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'drPhone';
    el.addEventListener('click', e => {
      const sq = e.target.closest('[data-sq]');
      if (sq) onSquare(Number(sq.dataset.sq));
    });
    $('#status').after(el);
  }
  return el;
}

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  const me = g.color, them = me === 'd' ? 'l' : 'd';
  const opp = you === 0 ? 1 : 0;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${NAME[me]} vs ${c.nameOf(opp)}`;
  const n = x => g.counts[x].men + g.counts[x].kings;
  const myTurn = !g.result && g.turn === me;
  setHud('#hudL', 'You', n(me), g.counts[me].kings ? `${g.counts[me].kings} crowned` : NAME[me]);
  setHud('#hudR', c.nameOf(opp), n(them), g.counts[them].kings ? `${g.counts[them].kings} crowned` : NAME[them]);
  $('#hudC').innerHTML = `<span>Move</span><b>${Math.floor(g.moveCount / 2) + 1}</b>`;
  $('#myHand').textContent = g.moves.length ? `Last move: ${g.moves[g.moves.length - 1]}` : '';

  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;
  if (!myTurn) selected = null;

  if (g.result) {
    const r = g.result;
    setStatus(!r.winner ? 'A draw' : r.winner === me ? '🏆 You win!' : 'You lose', 'Look at the table for a rematch');
  } else if (myTurn) setStatus(g.mustJump ? 'You must jump' : 'Your move', g.mustJump ? 'A capture is on — tap the glowing piece' : 'Tap a piece, then where it goes');
  else setStatus(`${c.nameOf(opp)} is thinking…`, '');

  drawBoard(g);
  renderPanel(g, me);
  renderHand([]);
}

function drawBoard(g) {
  const el = boardEl();
  const key = [g.board.join(','), selected, g.lastMove?.id, g.color, g.legal.length].join('|');
  if (key === lastKey) return;
  lastKey = key;
  const flip = g.color === 'l';
  const targets = selected != null ? targetsFrom(g.legal, selected) : new Set();
  const via = new Set(selected != null ? g.legal.filter(m => m.from === selected).flatMap(m => m.path.slice(0, -1)) : []);
  const must = new Set(g.mustJump && selected == null ? g.legal.map(m => m.from) : []);
  const caps = new Set(g.lastMove?.caps || []);
  let html = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const r = flip ? row : 7 - row, f = flip ? 7 - col : col;
      const s = r * 8 + f;
      const p = g.board[s];
      const cls = ['dq', (r + f) % 2 === 0 ? 'dk' : 'lt'];
      if (g.lastMove && (s === g.lastMove.from || s === g.lastMove.to)) cls.push('last');
      if (caps.has(s)) cls.push('gone');
      if (s === selected) cls.push('sel');
      if (targets.has(s)) cls.push('dot');
      else if (via.has(s)) cls.push('via');
      if (must.has(s)) cls.push('can');
      html += `<div class="${cls.join(' ')}" data-sq="${s}">${p ? `<span class="drp ${colorOf(p)}${isKing(p) ? ' king' : ''}"><b class="dcrown">${isKing(p) ? '♛︎' : ''}</b></span>` : ''}</div>`;
    }
  }
  el.innerHTML = html;
}

function onSquare(s) {
  const g = ctx.st.game;
  if (g.result || g.turn !== g.color) return;
  if (selected != null && targetsFrom(g.legal, selected).has(s)) {
    ctx.send({ type: 'move', from: selected, to: s });
    selected = null;
    navigator.vibrate?.(15);
    return;
  }
  const p = g.board[s];
  if (p && colorOf(p) === g.color && g.legal.some(m => m.from === s)) selected = s;
  else if (p && colorOf(p) === g.color) { selected = null; toast(g.mustJump ? 'You have to jump with another piece' : "That piece can't move"); }
  else selected = null;
  drawBoard(g);
}

function renderPanel(g, me) {
  const key = [g.result?.type, g.drawOffer, resignArmed].join('|');
  if (key === panelKey) return;
  panelKey = key;
  const p = $('#panel');
  p.innerHTML = '';
  if (g.result) return;
  const send = ctx.send;
  if (g.drawOffer && g.drawOffer !== me) {
    p.innerHTML = `<p class="pick">${ctx.nameOf(me === 'd' ? 1 : 0)} offers a draw</p>
      <div class="row"><button class="panel-btn" id="decline">Keep playing</button><button class="panel-btn go" id="accept">Accept draw</button></div>`;
    $('#accept').onclick = () => send({ type: 'acceptDraw' });
    $('#decline').onclick = () => send({ type: 'declineDraw' });
    return;
  }
  p.innerHTML = `<div class="row">
      <button class="panel-btn" id="draw" ${g.drawOffer ? 'disabled' : ''}>${g.drawOffer === me ? 'Draw offered' : 'Offer a draw'}</button>
      <button class="panel-btn ${resignArmed ? 'fold' : ''}" id="resign">${resignArmed ? 'Tap again to resign' : 'Resign'}</button>
    </div>`;
  $('#draw').onclick = () => send({ type: 'offerDraw' });
  $('#resign').onclick = () => {
    if (resignArmed) { send({ type: 'resign' }); resignArmed = false; return; }
    resignArmed = true;
    panelKey = '';
    renderPanel(g, me);
    setTimeout(() => { resignArmed = false; panelKey = ''; if (ctx.st.game) renderPanel(ctx.st.game, me); }, 3000);
  };
}

