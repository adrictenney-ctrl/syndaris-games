// Chess on the table screen: an inlaid board in the middle of a dark wood table.
// With the tablet flat, Black's pieces are turned to face the player across the table.
// Moves can be made by tapping the board on the table, or from either phone.
import * as C from './chess.js?v=55';
import { snap } from './cards.js?v=55';

export const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const glyph = p => GLYPH[p.toLowerCase()] + '︎';

let boardEl = null;
let pieceEls = new Array(64).fill(null);
let lastMoveId = null;
let gameNo = null;
let selected = null;
let promo = null;           // { from, to, seat } while the promotion picker is open
let gameRef = null, ctxRef = null;
let S = 0;                  // square size in px

const fmt = ms => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

// Clocks tick on screen between updates.
setInterval(() => {
  const g = gameRef;
  if (!g?.clocks) return;
  const c = C.clocksNow(g);
  document.querySelectorAll('[data-clock]').forEach(el => {
    const ms = c[el.dataset.clock];
    el.textContent = fmt(ms);
    el.classList.toggle('low', ms < 20000);
    el.classList.toggle('running', !g.result && g.turn === el.dataset.clock);
  });
}, 250);

// Square → pixel position, White at the bottom.
const pos = s => ({ x: (s & 7) * S, y: (7 - (s >> 3)) * S });

function buildBoard() {
  const el = document.createElement('div');
  el.id = 'chessboard';
  let squares = '';
  for (let r = 7; r >= 0; r--) {
    for (let f = 0; f < 8; f++) {
      const s = r * 8 + f;
      squares += `<div class="sq ${(f + r) % 2 ? 'light' : 'dark'}" data-sq="${s}" data-tv tabindex="-1"></div>`;
    }
  }
  const files = 'abcdefgh'.split('').map(l => `<i>${l}</i>`).join('');
  const ranks = '87654321'.split('').map(l => `<i>${l}</i>`).join('');
  el.innerHTML = `
    <div class="cb-frame">
      <div class="coords files bottom">${files}</div><div class="coords files top">${files}</div>
      <div class="coords ranks left">${ranks}</div><div class="coords ranks right">${ranks}</div>
      <div class="cb-squares">${squares}</div>
      <div class="cb-pieces"></div>
      <div class="cb-promo" hidden></div>
    </div>`;
  el.querySelector('.cb-squares').addEventListener('click', e => {
    const sq = e.target.closest('.sq');
    if (sq) onSquare(Number(sq.dataset.sq));
  });
  document.getElementById('center').appendChild(el);
  return el;
}

function makePiece(p) {
  const el = document.createElement('div');
  setPiece(el, p);
  boardEl.querySelector('.cb-pieces').appendChild(el);
  return el;
}

function setPiece(el, p) {
  el.className = `pc ${C.colorOf(p)}`;
  el.dataset.p = p;
  el.textContent = glyph(p);
}

function place(el, s) {
  const { x, y } = pos(s);
  const turn = C.colorOf(el.dataset.p) === 'b' && !ctxRef.upright ? 180 : 0;
  el.style.transform = `translate(${x}px, ${y}px) rotate(${turn}deg)`;
}

function sync(g) {
  const lm = g.lastMove;
  // Slide the piece that just moved (and the rook, when castling) instead of redrawing.
  if (lm && lm.id !== lastMoveId && lastMoveId !== null && pieceEls[lm.from]) {
    const capSq = lm.ep ? lm.to + (C.colorOf(g.board[lm.to]) === 'w' ? -8 : 8) : lm.to;
    if (pieceEls[capSq] && capSq !== lm.from) {
      const cap = pieceEls[capSq];
      cap.classList.add('taken');
      setTimeout(() => cap.remove(), 400);
      pieceEls[capSq] = null;
    }
    pieceEls[lm.to] = pieceEls[lm.from];
    pieceEls[lm.from] = null;
    if (lm.castle) {
      const [rf, rt] = { K: [7, 5], Q: [0, 3], k: [63, 61], q: [56, 59] }[lm.castle];
      pieceEls[rt] = pieceEls[rf];
      pieceEls[rf] = null;
    }
    snap(0.4);
  }
  lastMoveId = lm?.id ?? null;
  for (let s = 0; s < 64; s++) {
    const p = g.board[s];
    let el = pieceEls[s];
    if (!p) { if (el) { el.remove(); pieceEls[s] = null; } continue; }
    if (!el) el = pieceEls[s] = makePiece(p);
    else if (el.dataset.p !== p) setPiece(el, p); // promotion
    place(el, s);
  }
}

function highlight(g) {
  const sqs = boardEl.querySelectorAll('.sq');
  const check = !g.result && C.inCheck(g) ? g.board.indexOf(g.turn === 'w' ? 'K' : 'k') : -1;
  const targets = selected != null ? C.targetsFrom(g.legal, selected) : new Set();
  sqs.forEach(el => {
    const s = Number(el.dataset.sq);
    el.classList.toggle('last', !!g.lastMove && (s === g.lastMove.from || s === g.lastMove.to));
    el.classList.toggle('check', s === check);
    el.classList.toggle('sel', s === selected);
    el.classList.toggle('dot', targets.has(s) && !g.board[s]);
    el.classList.toggle('hit', targets.has(s) && !!g.board[s]);
  });
}

// Touching the board on the table moves for whoever's turn it is (unless that's a bot).
function onSquare(s) {
  const g = gameRef, ctx = ctxRef;
  if (!g || g.result || promo) return;
  const seat = g.turn === 'w' ? 0 : 1;
  if (ctx.isBot(seat)) return;
  if (selected != null) {
    const opts = C.tapMoves(g.legal, selected, s);
    if (opts.length > 1) return showPromo(selected, s, seat);
    if (opts.length === 1) {
      const from = selected;
      selected = null;
      ctx.act(seat, { type: 'move', from, to: opts[0].to });
      return;
    }
  }
  const p = g.board[s];
  selected = p && C.colorOf(p) === g.turn && g.legal.some(m => m.from === s) ? s : null;
  highlight(g);
}

function showPromo(from, to, seat) {
  promo = { from, to, seat };
  const box = boardEl.querySelector('.cb-promo');
  const color = gameRef.turn;
  const { x, y } = pos(to);
  box.innerHTML = 'qrbn'.split('').map(t => `<button data-t="${t}" class="pc ${color}">${glyph(color === 'w' ? t.toUpperCase() : t)}</button>`).join('');
  box.style.transform = `translate(${x}px, ${y}px) rotate(${color === 'b' && !ctxRef.upright ? 180 : 0}deg)`;
  box.hidden = false;
  box.querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      box.hidden = true;
      const p = promo;
      promo = selected = null;
      ctxRef.act(p.seat, { type: 'move', from: p.from, to: p.to, promo: b.dataset.t });
    };
  });
}

export default {
  defaults: { time: 'none', level: 'normal' },

  settingsHTML: s => `
    <label>Clock <select data-set="time" data-str="1">${[['none', 'No clock'], ['5|0', '5 min'], ['10|0', '10 min'], ['15|10', '15 min + 10 s']]
      .map(([v, t]) => `<option value="${v}" ${v === s.time ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label>Computer <select data-set="level" data-str="1">${[['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']]
      .map(([v, t]) => `<option value="${v}" ${v === s.level ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,

  applySetting(s, key, el) {
    if (key !== 'time' && key !== 'level') return false;
    s[key] = el.value;
    return true;
  },

  create: settings => C.createGame(settings),
  act: C.applyAction,
  bot: C.botAction,
  view: C.viewFor,
  turn: g => (g.result ? -1 : g.turn === 'w' ? 0 : 1),
  timer(g, players) {
    if (g.result || !g.clocks) return null;
    const seat = g.turn === 'w' ? 0 : 1;
    if (players[seat]?.bot) return null;
    return { ms: C.clocksNow(g)[g.turn] + 30, run: () => C.checkFlag(g) };
  },
  joinMidGame: () => false,

  plate(g, seat) {
    const color = C.seatColor(seat);
    const badges = [];
    if (!g.result && g.turn === color && C.inCheck(g)) badges.push('<span class="badge lost">check</span>');
    if (g.drawOffer === color) badges.push('<span class="badge">offers a draw</span>');
    const taken = g.captured[color].map(p => `<i class="cap ${C.colorOf(p)}">${glyph(p)}</i>`).join('');
    const clock = g.clocks ? `<span class="clock" data-clock="${color}">${fmt(C.clocksNow(g)[color])}</span>` : `<span>${color === 'w' ? 'White' : 'Black'}</span>`;
    return {
      badges,
      meta: `${clock}${taken ? `<span class="caps">${taken}</span>` : ''}`,
      cards: 0,
      turn: !g.result && g.turn === color,
      out: false,
    };
  },

  reset() {
    boardEl?.remove();
    boardEl = null;
    pieceEls = new Array(64).fill(null);
    lastMoveId = gameNo = selected = promo = null;
  },

  renderCenter(g, ctx) {
    gameRef = g;
    ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    const v = ctx.vmin;
    const felt = document.getElementById('felt').getBoundingClientRect();
    const frame = v * 3.2;
    // As big as fits between the rail and the players' corners.
    const B = Math.floor(Math.min(felt.height - 2 * (v * 6.5 + frame), felt.width - 2 * (v * 29 + frame)) / 8) * 8;
    if (!boardEl) boardEl = buildBoard();
    if (S !== B / 8) {
      S = B / 8;
      boardEl.style.setProperty('--S', S + 'px');
      boardEl.style.setProperty('--frame', frame + 'px');
    }
    boardEl.classList.toggle('upright', ctx.upright);
    if (selected != null && (g.result || C.colorOf(g.board[selected]) !== g.turn)) selected = null;
    if (promo && (g.result || g.turn !== C.seatColor(promo.seat))) { promo = null; boardEl.querySelector('.cb-promo').hidden = true; }
    sync(g);
    highlight(g);
  },

  overlay(g, ctx) {
    if (!g.result) return null;
    const r = g.result;
    const head = r.winner ? `${ctx.nameOf(r.winner === 'w' ? 0 : 1)} wins` : 'Draw';
    return {
      key: 'over' + g.moves.length + r.type,
      html: `<h2>${head}</h2><p>${C.resultText(r, ctx.nameOf)}</p><p class="hint">${g.moves.length ? `${Math.ceil(g.moves.length / 2)} moves · last: ${g.moves[g.moves.length - 1]}` : ''}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
