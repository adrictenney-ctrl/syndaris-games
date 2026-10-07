// Chess on a player's phone: the board turned to your side, tap a piece then a square.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=54';
import { targetsFrom, tapMoves } from './chess.js?v=54';

const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const glyph = p => GLYPH[p.toLowerCase()] + '︎';
const colorOf = p => (p ? (p === p.toUpperCase() ? 'w' : 'b') : null);
const NAME = { w: 'White', b: 'Black' };

let ctx = null;
let selected = null;
let promo = null;         // { from, to } waiting for a piece choice
let receivedAt = 0;
let lastKey = '';
let panelKey = '';
let resignArmed = false;
let wasMyTurn = false;

const fmt = ms => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

// Clocks count down between updates from the table.
setInterval(() => {
  const g = ctx?.st?.game;
  if (!g?.clocks || ctx.st.gameId !== 'chess') return;
  const now = c => (!g.result && g.turn === c ? g.clocks[c] - (Date.now() - receivedAt) : g.clocks[c]);
  const mine = g.color, theirs = mine === 'w' ? 'b' : 'w';
  const l = document.querySelector('#hudL b'), r = document.querySelector('#hudR b');
  if (l) l.textContent = fmt(now(mine));
  if (r) r.textContent = fmt(now(theirs));
}, 250);

export function reset() {
  selected = promo = null;
  lastKey = panelKey = '';
  resignArmed = false;
  document.getElementById('chessPhone')?.remove();
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · plays ${you === 0 ? 'White' : 'Black'}`;
  setHud('#hudL', null);
  setHud('#hudR', null);
  setHud('#hudC', null);
  document.getElementById('chessPhone')?.remove();
}

function boardEl() {
  let el = document.getElementById('chessPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'chessPhone';
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
  const me = g.color, them = me === 'w' ? 'b' : 'w';
  const opp = you === 0 ? 1 : 0;
  receivedAt = Date.now();
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${NAME[me]} vs ${c.nameOf(opp)}`;

  const myTurn = !g.result && g.turn === me;
  if (g.clocks) {
    setHud('#hudL', 'You', fmt(g.clocks[me]), myTurn ? 'your move' : '');
    setHud('#hudR', c.nameOf(opp), fmt(g.clocks[them]), !g.result && !myTurn ? 'thinking' : '');
  } else {
    setHud('#hudL', 'You', NAME[me], `${g.captured[me].length} taken`);
    setHud('#hudR', c.nameOf(opp), NAME[them], `${g.captured[them].length} taken`);
  }
  $('#hudC').innerHTML = `<span>Move</span><b>${Math.floor(g.moveCount / 2) + 1}</b>`;
  $('#myHand').textContent = g.moves.length ? `Last move: ${g.moves[g.moves.length - 1]}` : '';

  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;
  if (!myTurn) { selected = null; promo = null; }

  if (g.result) setStatus(resultLine(g, you), 'Look at the table for a rematch');
  else if (myTurn) setStatus(g.check ? 'Check! Your move' : 'Your move', 'Tap a piece, then where it goes');
  else setStatus(`${c.nameOf(opp)} is thinking…`, g.check ? "They're in check" : '');

  drawBoard(g);
  renderPanel(g, me, myTurn);
  renderHand([]);
}

function resultLine(g, you) {
  const r = g.result;
  const mine = g.color;
  if (!r.winner) return { stalemate: 'Stalemate · draw', repetition: 'Draw by repetition', fifty: 'Draw · 50-move rule', material: 'Draw · not enough pieces', agreed: 'Draw agreed', time: 'Out of time · draw' }[r.type];
  const won = r.winner === mine;
  const how = { mate: 'by checkmate', resign: 'by resignation', time: 'on time' }[r.type];
  return won ? `🏆 You win ${how}!` : `You lose ${how}`;
}

function drawBoard(g) {
  const el = boardEl();
  const key = [g.board.join(','), selected, g.lastMove?.id, g.check, g.color, g.legal.length].join('|');
  if (key === lastKey) return;
  lastKey = key;
  const flip = g.color === 'b';
  const targets = selected != null ? targetsFrom(g.legal, selected) : new Set();
  const kingSq = g.check ? g.board.indexOf(g.turn === 'w' ? 'K' : 'k') : -1;
  let html = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const r = flip ? row : 7 - row, f = flip ? 7 - col : col;
      const s = r * 8 + f;
      const p = g.board[s];
      const cls = ['sq', (r + f) % 2 ? 'light' : 'dark'];
      if (g.lastMove && (s === g.lastMove.from || s === g.lastMove.to)) cls.push('last');
      if (s === selected) cls.push('sel');
      if (s === kingSq) cls.push('check');
      if (targets.has(s)) cls.push(p ? 'hit' : 'dot');
      html += `<div class="${cls.join(' ')}" data-sq="${s}">${p ? `<span class="pc ${colorOf(p)}">${glyph(p)}</span>` : ''}</div>`;
    }
  }
  el.innerHTML = html;
}

function onSquare(s) {
  const g = ctx.st.game;
  if (g.result || g.turn !== g.color) return;
  if (selected != null) {
    const opts = tapMoves(g.legal, selected, s);
    if (opts.length > 1) { promo = { from: selected, to: s }; panelKey = ''; renderPanel(g, g.color, true); return; }
    if (opts.length === 1) {
      ctx.send({ type: 'move', from: selected, to: opts[0].to });
      selected = null;
      navigator.vibrate?.(15);
      return;
    }
  }
  const p = g.board[s];
  if (p && colorOf(p) === g.color && g.legal.some(m => m.from === s)) selected = s;
  else if (p && colorOf(p) === g.color) { selected = null; toast("That piece can't move right now"); }
  else selected = null;
  drawBoard(g);
}

function renderPanel(g, me, myTurn) {
  const key = [g.result?.type, myTurn, g.drawOffer, promo?.to, resignArmed].join('|');
  if (key === panelKey) return;
  panelKey = key;
  const p = $('#panel');
  p.innerHTML = '';
  if (g.result) return;
  const send = ctx.send;

  if (promo) {
    p.innerHTML = `<p class="pick">Promote to…</p><div class="row promo">${'qrbn'.split('').map(t =>
      `<button class="panel-btn piece" data-t="${t}"><span class="pc ${me}">${glyph(me === 'w' ? t.toUpperCase() : t)}</span></button>`).join('')}</div>`;
    p.querySelectorAll('[data-t]').forEach(b => {
      b.onclick = () => {
        send({ type: 'move', from: promo.from, to: promo.to, promo: b.dataset.t });
        promo = selected = null;
      };
    });
    return;
  }
  if (g.drawOffer && g.drawOffer !== me) {
    p.innerHTML = `<p class="pick">${ctx.nameOf(me === 'w' ? 1 : 0)} offers a draw</p>
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
    renderPanel(g, me, myTurn);
    setTimeout(() => { resignArmed = false; panelKey = ''; if (ctx.st.game) renderPanel(ctx.st.game, me, myTurn); }, 3000);
  };
}
