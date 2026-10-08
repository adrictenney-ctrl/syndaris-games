// PowerUp Chess: chess where a capture doesn't remove the piece, it absorbs it. Runs only on
// the table (host).
// Each square holds a stack: a string of FEN letters, the top (controlling) piece first,
// absorbed pieces after it. 'Br' is a White bishop that has swallowed a Black rook.
// A stack belongs to the colour of its top piece and moves like ANY piece inside it.
// Capturing a stack absorbs the whole column. Kings stay royal: the stack with your king on
// top can't move into, slide through or stay in check. Only a lone pawn promotes.
// Board index = rank * 8 + file, a1 = 0. Seat 0 plays White.
import { createGame as createChess, TIME, resultText as chessResult } from './chess.js?v=61';
export { TIME };

const FILES = 'abcdefgh';
export const sqName = s => FILES[s & 7] + ((s >> 3) + 1);
const at = (f, r) => r * 8 + f;
const isW = ch => ch === ch.toUpperCase();
export const colorOf = p => (p ? (isW(p[0]) ? 'w' : 'b') : null);
const opp = c => (c === 'w' ? 'b' : 'w');
export const seatColor = seat => (seat === 0 ? 'w' : 'b');
const COLOR_NAME = { w: 'White', b: 'Black' };
const has = (stack, t) => stack.toLowerCase().includes(t);
const lone = (stack, t) => stack.length === 1 && stack.toLowerCase() === t;

const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KG = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const onBoard = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;

const positionKey = s => s.board.map(p => p || '.').join(',') + s.turn + s.castle + s.ep;
// The royal stack: your king is always on top of its own column (it can never be captured).
export const kingSq = (board, c) => board.findIndex(p => p && p[0] === (c === 'w' ? 'K' : 'k'));

// Is square s attacked by colour `by`? Any stack of theirs that has the right power counts.
export function attacked(board, s, by) {
  const f = s & 7, r = s >> 3;
  const mine = p => p && colorOf(p) === by;
  const pr = by === 'w' ? r - 1 : r + 1;
  for (const df of [-1, 1]) if (onBoard(f + df, pr)) { const p = board[at(f + df, pr)]; if (mine(p) && has(p, 'p')) return true; }
  for (const [df, dr] of KN) if (onBoard(f + df, r + dr)) { const p = board[at(f + df, r + dr)]; if (mine(p) && has(p, 'n')) return true; }
  for (const [df, dr] of KG) if (onBoard(f + df, r + dr)) { const p = board[at(f + df, r + dr)]; if (mine(p) && has(p, 'k')) return true; }
  for (const [dirs, A] of [[DIAG, 'b'], [ORTH, 'r']]) {
    for (const [df, dr] of dirs) {
      let ff = f + df, rr = r + dr;
      while (onBoard(ff, rr)) {
        const p = board[at(ff, rr)];
        if (p) { if (mine(p) && (has(p, A) || has(p, 'q'))) return true; break; }
        ff += df; rr += dr;
      }
    }
  }
  return false;
}

export const inCheck = (s, c = s.turn) => attacked(s.board, kingSq(s.board, c), opp(c));

// All moves ignoring whether they leave your own king in check. A stack gets the union of
// its pieces' moves; the same destination is listed once.
function pseudoMoves(s) {
  const moves = [];
  const b = s.board, c = s.turn, them = opp(c);
  for (let from = 0; from < 64; from++) {
    const p = b[from];
    if (!p || colorOf(p) !== c) continue;
    const f = from & 7, r = from >> 3;
    const royal = p[0].toLowerCase() === 'k';
    const seen = new Set();
    const add = (to, extra) => {
      const k = to + (extra?.promo || '') + (extra?.castle || '');
      if (seen.has(k)) return;
      seen.add(k);
      moves.push({ from, to, piece: p, captured: b[to] || '', ...extra });
    };
    const steps = deltas => {
      for (const [df, dr] of deltas) {
        if (!onBoard(f + df, r + dr)) continue;
        const to = at(f + df, r + dr);
        if (!b[to] || colorOf(b[to]) !== c) add(to);
      }
    };
    if (has(p, 'p')) {
      const dir = c === 'w' ? 1 : -1, start = c === 'w' ? 1 : 6, last = c === 'w' ? 7 : 0;
      const r1 = r + dir;
      const solo = lone(p, 'p');
      if (onBoard(f, r1) && !b[at(f, r1)]) {
        if (r1 === last && solo) for (const q of 'qrbn') add(at(f, r1), { promo: c === 'w' ? q.toUpperCase() : q });
        else {
          add(at(f, r1));
          if (solo && r === start && !b[at(f, r + 2 * dir)]) add(at(f, r + 2 * dir), { double: true });
        }
      }
      for (const df of [-1, 1]) {
        if (!onBoard(f + df, r1)) continue;
        const to = at(f + df, r1);
        if (b[to] && colorOf(b[to]) !== c) add(to);
        else if (solo && to === s.ep) add(to, { ep: true, captured: c === 'w' ? 'p' : 'P' });
      }
    }
    if (has(p, 'n')) steps(KN);
    if (has(p, 'k')) {
      steps(KG);
      if (lone(p, 'k')) {
        const home = c === 'w' ? 0 : 56;
        const [kSide, qSide, rook] = c === 'w' ? ['K', 'Q', 'R'] : ['k', 'q', 'r'];
        if (from === home + 4 && !attacked(b, from, them)) {
          if (s.castle.includes(kSide) && !b[home + 5] && !b[home + 6] && b[home + 7] === rook &&
              !attacked(b, home + 5, them) && !attacked(b, home + 6, them)) add(home + 6, { castle: kSide });
          if (s.castle.includes(qSide) && !b[home + 3] && !b[home + 2] && !b[home + 1] && b[home] === rook &&
              !attacked(b, home + 3, them) && !attacked(b, home + 2, them)) add(home + 2, { castle: qSide });
        }
      }
    }
    const dirs = [...(has(p, 'b') || has(p, 'q') ? DIAG : []), ...(has(p, 'r') || has(p, 'q') ? ORTH : [])];
    if (dirs.length) {
      // A sliding king-stack may not pass through an attacked square.
      const cleared = royal ? b.map((x, i) => (i === from ? '' : x)) : null;
      for (const [df, dr] of dirs) {
        let ff = f + df, rr = r + dr, first = true;
        while (onBoard(ff, rr)) {
          const to = at(ff, rr);
          if (royal && !first && attacked(cleared, at(ff - df, rr - dr), them)) break;
          if (!b[to]) add(to);
          else { if (colorOf(b[to]) !== c) add(to); break; }
          ff += df; rr += dr; first = false;
        }
      }
    }
  }
  return moves;
}

const CORNER = { 0: 'Q', 7: 'K', 56: 'q', 63: 'k' };

export function makeMove(s, m) {
  const b = s.board.slice();
  const c = s.turn;
  // The mover goes on top; whatever was there is absorbed underneath.
  b[m.to] = (m.promo || m.piece) + (m.ep ? '' : b[m.to] || '');
  b[m.from] = '';
  if (m.ep) { b[m.to] += b[m.to + (c === 'w' ? -8 : 8)]; b[m.to + (c === 'w' ? -8 : 8)] = ''; }
  if (m.castle) {
    const [rf, rt] = { K: [7, 5], Q: [0, 3], k: [63, 61], q: [56, 59] }[m.castle];
    b[rt] = b[rf];
    b[rf] = '';
  }
  let castle = s.castle;
  if (m.piece[0] === 'K') castle = castle.replace(/[KQ]/g, '');
  if (m.piece[0] === 'k') castle = castle.replace(/[kq]/g, '');
  for (const sq of [m.from, m.to]) if (CORNER[sq]) castle = castle.replace(CORNER[sq], '');
  return {
    board: b, turn: opp(c), castle,
    ep: m.double ? (m.from + m.to) / 2 : -1,
    half: lone(m.piece, 'p') || m.captured ? 0 : s.half + 1,
    full: s.full + (c === 'b' ? 1 : 0),
  };
}

export function legalMoves(s) {
  const c = s.turn;
  return pseudoMoves(s).filter(m => {
    const n = makeMove(s, m);
    return !attacked(n.board, kingSq(n.board, c), opp(c));
  });
}

// Move text: the top piece, where it went, and what it absorbed. "B c4×e6 (+R)".
const LETTER = p => (p[0].toLowerCase() === 'p' ? '' : p[0].toUpperCase());
export function moveText(s, m) {
  let str;
  if (m.castle) str = m.castle.toLowerCase() === 'k' ? 'O-O' : 'O-O-O';
  else {
    str = LETTER(m.piece) + (m.piece.length > 1 ? '+' : '') + sqName(m.from) + (m.captured ? '×' : '–') + sqName(m.to) + (m.promo ? '=' + m.promo.toUpperCase() : '');
    if (m.captured) str += ` (+${m.captured.toUpperCase().split('').join('')})`;
  }
  const next = makeMove(s, m);
  if (inCheck(next)) str += legalMoves(next).length ? '+' : '#';
  return str;
}

// Only lone kings left: nobody can mate.
const insufficient = board => board.every(p => !p || p.length === 1 && p.toLowerCase() === 'k');

// ---------------------------------------------------------------- the game

const stateOf = g => ({ board: g.board, turn: g.turn, castle: g.castle, ep: g.ep, half: g.half, full: g.full });

export function createGame(settings) {
  const g = createChess(settings);
  g.keys = { [positionKey(g)]: 1 };
  g.legal = legalMoves(g);
  return g;
}

function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }
function finish(g, type, winner) { g.result = { type, winner }; g.legal = []; g.drawOffer = null; }

export function clocksNow(g) {
  if (!g.clocks) return null;
  const c = { ...g.clocks };
  if (!g.result) c[g.turn] = Math.max(0, c[g.turn] - (Date.now() - g.turnStart));
  return c;
}

export function checkFlag(g) {
  const c = clocksNow(g);
  if (!c || g.result || c[g.turn] > 0) return false;
  g.clocks = c;
  const winner = opp(g.turn);
  const theirs = g.board.map(p => (colorOf(p) === winner || p[0]?.toLowerCase() === 'k' ? p : ''));
  finish(g, 'time', insufficient(theirs) ? null : winner);
  return true;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  const me = seatColor(seat);
  if (g.result) return 'The game is over';
  if (a.type === 'resign') { finish(g, 'resign', opp(me)); announce(g, seat, 'Resigns'); return null; }
  if (a.type === 'offerDraw') {
    if (g.drawOffer) return 'A draw is already on offer';
    g.drawOffer = me; announce(g, seat, 'Offers a draw'); return null;
  }
  if (a.type === 'acceptDraw') {
    if (!g.drawOffer || g.drawOffer === me) return 'There is no draw offer to accept';
    finish(g, 'agreed', null); announce(g, seat, 'Accepts the draw'); return null;
  }
  if (a.type === 'declineDraw') {
    if (!g.drawOffer || g.drawOffer === me) return 'There is no draw offer to decline';
    g.drawOffer = null; announce(g, seat, 'Declines the draw'); return null;
  }
  if (a.type !== 'move') return "That move isn't allowed";
  if (me !== g.turn) return `It's ${COLOR_NAME[g.turn]}'s move`;
  if (checkFlag(g)) return 'Out of time';

  const options = g.legal.filter(m => m.from === a.from && m.to === a.to);
  if (!options.length) return 'That move is not legal';
  const m = options.find(o => !o.promo || o.promo.toLowerCase() === (a.promo || 'q').toLowerCase()) || options[0];

  const before = stateOf(g);
  const text = moveText(before, m);
  if (g.clocks) g.clocks[g.turn] = Math.max(0, g.clocks[g.turn] - (Date.now() - g.turnStart)) + g.inc;
  g.turnStart = Date.now();
  Object.assign(g, makeMove(before, m));
  if (m.captured) g.captured[me].push(m.captured);
  g.moves.push(text);
  g.lastMove = { id: (g.lastMove?.id || 0) + 1, from: m.from, to: m.to, castle: m.castle || null, ep: !!m.ep, promo: m.promo || null, captured: m.captured || null };
  g.drawOffer = null;
  const key = positionKey(g);
  g.keys[key] = (g.keys[key] || 0) + 1;
  g.legal = legalMoves(g);
  announce(g, seat, text);

  if (!g.legal.length) {
    if (inCheck(g)) { finish(g, 'mate', me); announce(g, seat, `${text} · Checkmate!`); }
    else finish(g, 'stalemate', null);
  } else if (g.keys[key] >= 3) finish(g, 'repetition', null);
  else if (g.half >= 100) finish(g, 'fifty', null);
  else if (insufficient(g.board)) finish(g, 'material', null);
  return null;
}

export function viewFor(g, seat) {
  const me = seatColor(seat);
  return {
    color: me, board: g.board, turn: g.turn, lastMove: g.lastMove, check: !g.result && inCheck(g),
    legal: !g.result && g.turn === me ? g.legal.map(m => ({ from: m.from, to: m.to, promo: m.promo ? m.promo.toLowerCase() : null, castle: m.castle || null })) : [],
    moves: g.moves.slice(-40), moveCount: g.moves.length, result: g.result, drawOffer: g.drawOffer,
    captured: g.captured, clocks: clocksNow(g), gameNo: g.gameNo,
  };
}

export const resultText = chessResult;

// ---------------------------------------------------------------- computer player

// A stack is worth every piece in it, plus a bonus for each extra kind of move it has.
const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MOB = { p: 20, n: 120, b: 110, r: 160, q: 120, k: 60 };
const CENTER = i => { const f = i & 7, r = i >> 3; return 14 - 2 * (Math.abs(3.5 - f) + Math.abs(3.5 - r)); };

function stackValue(p) {
  let v = 0;
  const kinds = new Set();
  for (const ch of p.toLowerCase()) { v += VAL[ch]; kinds.add(ch); }
  if (kinds.size > 1) for (const k of kinds) if (k !== p[0].toLowerCase()) v += MOB[k];
  return v;
}

function evaluate(s) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (!p) continue;
    const t = p[0].toLowerCase();
    let v = stackValue(p);
    if (t === 'p' && p.length === 1) v += 6 * (isW(p) ? (i >> 3) - 1 : 6 - (i >> 3));
    else if (t !== 'k') v += CENTER(i);
    else v -= CENTER(i) * (p.length > 1 ? 0 : 1); // a bare king keeps out of the middle
    score += isW(p) ? v : -v;
  }
  return s.turn === 'w' ? score : -score;
}

const MATE = 100000;
const gain = m => (m.captured ? stackValue(m.captured) * 10 - stackValue(m.piece) : 0) + (m.promo ? 800 : 0);
const order = moves => moves.sort((a, b) => gain(b) - gain(a));

function quiesce(s, alpha, beta, depth) {
  const stand = evaluate(s);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (depth === 0) return alpha;
  for (const m of order(pseudoMoves(s).filter(x => x.captured))) {
    const n = makeMove(s, m);
    if (attacked(n.board, kingSq(n.board, s.turn), n.turn)) continue;
    const score = -quiesce(n, -beta, -alpha, depth - 1);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(s, depth, alpha, beta, ply) {
  if (depth === 0) return quiesce(s, alpha, beta, 3);
  let any = false;
  for (const m of order(pseudoMoves(s))) {
    const n = makeMove(s, m);
    if (attacked(n.board, kingSq(n.board, s.turn), n.turn)) continue;
    any = true;
    const score = -negamax(n, depth - 1, -beta, -alpha, ply + 1);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  if (!any) return inCheck(s) ? -MATE + ply : 0;
  return alpha;
}

export function botAction(g, seat) {
  if (g.drawOffer && g.drawOffer !== seatColor(seat)) {
    const ev = evaluate({ ...stateOf(g), turn: seatColor(seat) });
    return { type: ev < -150 ? 'acceptDraw' : 'declineDraw' };
  }
  const s = stateOf(g);
  const maxDepth = { easy: 1, normal: 2, hard: 3 }[g.settings.level] || 2;
  const noise = g.settings.level === 'easy' ? 120 : g.settings.level === 'normal' ? 15 : 0;
  const started = Date.now(), budget = 1200;
  let moves = order(g.legal.slice());
  let best = moves[0];
  for (let depth = 1; depth <= maxDepth; depth++) {
    let depthBest = null, bestScore = -Infinity, complete = true;
    const scored = [];
    for (const m of moves) {
      if (depth > 1 && Date.now() - started > budget) { complete = false; break; }
      const score = -negamax(makeMove(s, m), depth - 1, -MATE - 1, MATE + 1, 1) + (Math.random() - 0.5) * 2 * noise;
      scored.push([m, score]);
      if (score > bestScore) { bestScore = score; depthBest = m; }
    }
    if (!complete) break;
    best = depthBest;
    moves = scored.sort((a, b) => b[1] - a[1]).map(x => x[0]);
    if (bestScore > MATE - 100 || Date.now() - started > budget / 3) break;
  }
  return { type: 'move', from: best.from, to: best.to, promo: best.promo ? best.promo.toLowerCase() : null };
}

export { targetsFrom, tapMoves } from './chess.js?v=61';
