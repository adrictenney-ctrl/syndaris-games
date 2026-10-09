// Checkers on the table screen: an ebony-and-champagne board on a dark leather desk.
// Ebony plays from the bottom, Ivory from the top. Moves can be made by tapping the
// board on the table, or from either phone. Multi-jumps hop square by square.
import * as K from './checkers.js?v=67';
import { snap } from './cards.js?v=67';

let boardEl = null;
let pieceEls = new Array(64).fill(null);
let lastMoveId = null;
let selected = null;
let gameRef = null, ctxRef = null;
let S = 0;

const pos = s => ({ x: (s & 7) * S, y: (7 - (s >> 3)) * S });

function buildBoard() {
  const el = document.createElement('div');
  el.id = 'drboard';
  let squares = '';
  for (let r = 7; r >= 0; r--) {
    for (let f = 0; f < 8; f++) {
      const s = r * 8 + f;
      squares += `<div class="dq ${K.dark(s) ? 'dk' : 'lt'}" data-sq="${s}" data-tv tabindex="-1">${K.dark(s) ? `<i>${K.num(s)}</i>` : ''}</div>`;
    }
  }
  el.innerHTML = `<div class="dr-frame"><div class="dr-squares">${squares}</div><div class="dr-pieces"></div></div>`;
  el.querySelector('.dr-squares').addEventListener('click', e => {
    const sq = e.target.closest('.dq');
    if (sq) onSquare(Number(sq.dataset.sq));
  });
  document.getElementById('center').appendChild(el);
  return el;
}

export const pieceHTML = p => `<b class="dcrown">${K.isKing(p) ? '♛︎' : ''}</b>`;

function setPiece(el, p) {
  el.className = `drp ${K.colorOf(p)}${K.isKing(p) ? ' king' : ''}`;
  el.dataset.p = p;
  el.innerHTML = pieceHTML(p);
}

function place(el, s) {
  const { x, y } = pos(s);
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function sync(g) {
  const lm = g.lastMove;
  let moving = null;
  if (lm && lm.id !== lastMoveId && lastMoveId !== null && pieceEls[lm.from]) {
    moving = pieceEls[lm.from];
    pieceEls[lm.from] = null;
    pieceEls[lm.to] = moving;
    moving._moving = true;
    const hop = 300;
    lm.path.forEach((s, i) => setTimeout(() => { place(moving, s); snap(0.25); }, i * hop));
    lm.caps.forEach((c, i) => {
      const cap = pieceEls[c];
      pieceEls[c] = null;
      if (!cap) return;
      setTimeout(() => cap.classList.add('taken'), i * hop + hop * 0.6);
      setTimeout(() => cap.remove(), i * hop + hop * 0.6 + 450);
    });
    setTimeout(() => {
      moving._moving = false;
      if (gameRef.board[lm.to]) setPiece(moving, gameRef.board[lm.to]);
    }, lm.path.length * hop);
  }
  lastMoveId = lm?.id ?? null;
  for (let s = 0; s < 64; s++) {
    const p = g.board[s];
    let el = pieceEls[s];
    if (!p) { if (el) { el.remove(); pieceEls[s] = null; } continue; }
    if (!el) {
      el = pieceEls[s] = document.createElement('div');
      boardEl.querySelector('.dr-pieces').appendChild(el);
      setPiece(el, p);
    } else if (!el._moving && el.dataset.p !== p) setPiece(el, p);
    if (!el._moving) place(el, s);
  }
}

function highlight(g) {
  const targets = selected != null ? K.targetsFrom(g.legal, selected) : new Set();
  const movable = new Set(g.result ? [] : g.legal.map(m => m.from));
  const path = new Set(selected != null ? g.legal.filter(m => m.from === selected).flatMap(m => m.path.slice(0, -1)) : []);
  boardEl.querySelectorAll('.dq').forEach(el => {
    const s = Number(el.dataset.sq);
    el.classList.toggle('last', !!g.lastMove && (s === g.lastMove.from || s === g.lastMove.to));
    el.classList.toggle('sel', s === selected);
    el.classList.toggle('dot', targets.has(s));
    el.classList.toggle('via', path.has(s) && !targets.has(s));
    el.classList.toggle('can', selected == null && movable.has(s) && g.legal.some(m => m.caps.length));
  });
}

function onSquare(s) {
  const g = gameRef, ctx = ctxRef;
  if (!g || g.result) return;
  const seat = g.turn === 'd' ? 0 : 1;
  if (ctx.isBot(seat)) return;
  if (selected != null && K.targetsFrom(g.legal, selected).has(s)) {
    const from = selected;
    selected = null;
    ctx.act(seat, { type: 'move', from, to: s });
    return;
  }
  selected = g.legal.some(m => m.from === s) ? s : null;
  highlight(g);
}

export default {
  defaults: { level: 'normal' },

  settingsHTML: s => `
    <label>Computer <select data-set="level" data-str="1">${[['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']]
      .map(([v, t]) => `<option value="${v}" ${v === s.level ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,

  applySetting(s, key, el) {
    if (key !== 'level') return false;
    s.level = el.value;
    return true;
  },

  create: settings => K.createGame(settings),
  act: K.applyAction,
  bot: K.botAction,
  view: K.viewFor,
  turn: g => (g.result ? -1 : g.turn === 'd' ? 0 : 1),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    const c = K.seatColor(seat);
    const n = K.count(g.board, c);
    const badges = [];
    if (g.drawOffer === c) badges.push('<span class="badge">offers a draw</span>');
    if (!g.result && g.turn === c && g.legal.some(m => m.caps.length)) badges.push('<span class="badge alone">must jump</span>');
    return {
      badges,
      meta: `<span class="dr-side ${c}"><i class="drp ${c}"></i>${K.NAME[c]}</span><span><b>${n.men + n.kings}</b> pieces${n.kings ? ` · <b>${n.kings}</b> ♛︎` : ''}</span>`,
      cards: 0,
      turn: !g.result && g.turn === c,
      out: false,
    };
  },

  reset() {
    boardEl?.remove();
    boardEl = null;
    pieceEls = new Array(64).fill(null);
    lastMoveId = selected = null;
  },

  renderCenter(g, ctx) {
    gameRef = g;
    ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    const v = ctx.vmin;
    const felt = document.getElementById('felt').getBoundingClientRect();
    const frame = v * 2.6;
    const B = Math.floor(Math.min(felt.height - 2 * (v * 6.5 + frame), felt.width - 2 * (v * 29 + frame)) / 8) * 8;
    if (!boardEl) boardEl = buildBoard();
    if (S !== B / 8) {
      S = B / 8;
      boardEl.style.setProperty('--S', S + 'px');
      boardEl.style.setProperty('--frame', frame + 'px');
      pieceEls.forEach((el, s) => el && !el._moving && place(el, s));
    }
    if (selected != null && (g.result || !g.legal.some(m => m.from === selected))) selected = null;
    sync(g);
    highlight(g);
  },

  overlay(g, ctx) {
    if (!g.result) return null;
    const r = g.result;
    const head = r.winner ? `${ctx.nameOf(r.winner === 'd' ? 0 : 1)} wins` : 'Draw';
    return {
      key: 'over' + g.moves.length + r.type,
      html: `<h2>${head}</h2><p>${K.resultText(r, ctx.nameOf)}</p><p class="hint">${g.moves.length} moves</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
