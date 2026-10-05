// Chess rules engine + computer player. Runs only on the table (host).
// Board: 64 squares, index = rank * 8 + file, rank 0 is White's back rank (a1 = 0, h8 = 63).
// Pieces are FEN letters: white KQRBNP, black kqrbnp, '' for empty.
// Seat 0 plays White, seat 1 plays Black.

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const FILES = 'abcdefgh';
export const sqName = s => FILES[s & 7] + ((s >> 3) + 1);
const at = (f, r) => r * 8 + f;
export const colorOf = p => (p ? (p === p.toUpperCase() ? 'w' : 'b') : null);
const opp = c => (c === 'w' ? 'b' : 'w');
export const seatColor = seat => (seat === 0 ? 'w' : 'b');
const COLOR_NAME = { w: 'White', b: 'Black' };

const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KG = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const onBoard = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;

export function parseFEN(fen) {
  const [placement, turn, castle, ep, half, full] = fen.split(' ');
  const board = new Array(64).fill('');
  placement.split('/').forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else board[at(f++, 7 - i)] = ch;
    }
  });
  return {
    board, turn, castle: castle === '-' ? '' : castle,
    ep: ep === '-' ? -1 : FILES.indexOf(ep[0]) + (Number(ep[1]) - 1) * 8,
    half: Number(half), full: Number(full),
  };
}

const positionKey = s => s.board.map(p => p || '.').join('') + s.turn + s.castle + s.ep;
const kingSq = (board, c) => board.indexOf(c === 'w' ? 'K' : 'k');

// Is square s attacked by colour `by`?
export function attacked(board, s, by) {
  const f = s & 7, r = s >> 3;
  const w = by === 'w';
  const [P, N, B, R, Q, K] = w ? ['P', 'N', 'B', 'R', 'Q', 'K'] : ['p', 'n', 'b', 'r', 'q', 'k'];
  const pr = w ? r - 1 : r + 1;
  for (const df of [-1, 1]) if (onBoard(f + df, pr) && board[at(f + df, pr)] === P) return true;
  for (const [df, dr] of KN) if (onBoard(f + df, r + dr) && board[at(f + df, r + dr)] === N) return true;
  for (const [df, dr] of KG) if (onBoard(f + df, r + dr) && board[at(f + df, r + dr)] === K) return true;
  for (const [dirs, A] of [[DIAG, B], [ORTH, R]]) {
    for (const [df, dr] of dirs) {
      let ff = f + df, rr = r + dr;
      while (onBoard(ff, rr)) {
        const p = board[at(ff, rr)];
        if (p) { if (p === A || p === Q) return true; break; }
        ff += df; rr += dr;
      }
    }
  }
  return false;
}

export const inCheck = (s, c = s.turn) => attacked(s.board, kingSq(s.board, c), opp(c));

// All moves ignoring whether they leave your own king in check.
function pseudoMoves(s) {
  const moves = [];
  const b = s.board, c = s.turn;
  for (let from = 0; from < 64; from++) {
    const p = b[from];
    if (!p || colorOf(p) !== c) continue;
    const f = from & 7, r = from >> 3, t = p.toLowerCase();
    const add = (to, extra) => moves.push({ from, to, piece: p, captured: b[to] || '', ...extra });
    if (t === 'p') {
      const dir = c === 'w' ? 1 : -1, start = c === 'w' ? 1 : 6, last = c === 'w' ? 7 : 0;
      const r1 = r + dir;
      const promos = to => { for (const q of 'qrbn') add(to, { promo: c === 'w' ? q.toUpperCase() : q }); };
      if (onBoard(f, r1) && !b[at(f, r1)]) {
        if (r1 === last) promos(at(f, r1));
        else {
          add(at(f, r1));
          if (r === start && !b[at(f, r + 2 * dir)]) add(at(f, r + 2 * dir), { double: true });
        }
      }
      for (const df of [-1, 1]) {
        if (!onBoard(f + df, r1)) continue;
        const to = at(f + df, r1);
        if (b[to] && colorOf(b[to]) !== c) { if (r1 === last) promos(to); else add(to); }
        else if (to === s.ep) add(to, { ep: true, captured: c === 'w' ? 'p' : 'P' });
      }
    } else if (t === 'n' || t === 'k') {
      for (const [df, dr] of t === 'n' ? KN : KG) {
        if (!onBoard(f + df, r + dr)) continue;
        const to = at(f + df, r + dr);
        if (!b[to] || colorOf(b[to]) !== c) add(to);
      }
      if (t === 'k') {
        const them = opp(c);
        const home = c === 'w' ? 0 : 56;
        const [kSide, qSide, rook] = c === 'w' ? ['K', 'Q', 'R'] : ['k', 'q', 'r'];
        if (from === home + 4 && !attacked(b, from, them)) {
          if (s.castle.includes(kSide) && !b[home + 5] && !b[home + 6] && b[home + 7] === rook &&
              !attacked(b, home + 5, them) && !attacked(b, home + 6, them)) add(home + 6, { castle: kSide });
          if (s.castle.includes(qSide) && !b[home + 3] && !b[home + 2] && !b[home + 1] && b[home] === rook &&
              !attacked(b, home + 3, them) && !attacked(b, home + 2, them)) add(home + 2, { castle: qSide });
        }
      }
    } else {
      const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : [...DIAG, ...ORTH];
      for (const [df, dr] of dirs) {
        let ff = f + df, rr = r + dr;
        while (onBoard(ff, rr)) {
          const to = at(ff, rr);
          if (!b[to]) add(to);
          else { if (colorOf(b[to]) !== c) add(to); break; }
          ff += df; rr += dr;
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
  b[m.to] = m.promo || m.piece;
  b[m.from] = '';
  if (m.ep) b[m.to + (c === 'w' ? -8 : 8)] = '';
  if (m.castle) {
    const [rf, rt] = { K: [7, 5], Q: [0, 3], k: [63, 61], q: [56, 59] }[m.castle];
    b[rt] = b[rf];
    b[rf] = '';
  }
  let castle = s.castle;
  if (m.piece === 'K') castle = castle.replace(/[KQ]/g, '');
  if (m.piece === 'k') castle = castle.replace(/[kq]/g, '');
  for (const sq of [m.from, m.to]) if (CORNER[sq]) castle = castle.replace(CORNER[sq], '');
  return {
    board: b, turn: opp(c), castle,
    ep: m.double ? (m.from + m.to) / 2 : -1,
    half: m.piece.toLowerCase() === 'p' || m.captured ? 0 : s.half + 1,
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

export function san(s, m, legal = legalMoves(s)) {
  let str;
  if (m.castle) str = m.castle.toLowerCase() === 'k' ? 'O-O' : 'O-O-O';
  else {
    const t = m.piece.toUpperCase();
    if (t === 'P') {
      str = (m.captured ? FILES[m.from & 7] + 'x' : '') + sqName(m.to) + (m.promo ? '=' + m.promo.toUpperCase() : '');
    } else {
      const others = legal.filter(o => o.piece === m.piece && o.to === m.to && o.from !== m.from);
      let dis = '';
      if (others.length) {
        if (!others.some(o => (o.from & 7) === (m.from & 7))) dis = FILES[m.from & 7];
        else if (!others.some(o => o.from >> 3 === m.from >> 3)) dis = String((m.from >> 3) + 1);
        else dis = sqName(m.from);
      }
      str = t + dis + (m.captured ? 'x' : '') + sqName(m.to);
    }
  }
  const next = makeMove(s, m);
  if (inCheck(next)) str += legalMoves(next).length ? '+' : '#';
  return str;
}

function insufficient(board) {
  const rest = board.map((p, i) => [p, i]).filter(([p]) => p && p.toLowerCase() !== 'k');
  if (!rest.length) return true;
  if (rest.length === 1 && 'nb'.includes(rest[0][0].toLowerCase())) return true;
  if (rest.every(([p]) => p.toLowerCase() === 'b')) {
    const shade = ([, i]) => ((i & 7) + (i >> 3)) % 2;
    return rest.every(x => shade(x) === shade(rest[0]));
  }
  return false;
}

// ---------------------------------------------------------------- the game

export const TIME = { none: null, '5|0': [5, 0], '10|0': [10, 0], '15|10': [15, 10] };

const stateOf = g => ({ board: g.board, turn: g.turn, castle: g.castle, ep: g.ep, half: g.half, full: g.full });

export function createGame(settings) {
  const g = {
    settings: { time: 'none', level: 'normal', ...settings },
    ...parseFEN(START_FEN),
    moves: [], lastMove: null, keys: {}, result: null, drawOffer: null,
    captured: { w: [], b: [] }, annId: 0, gameNo: 1,
  };
  const tc = TIME[g.settings.time];
  g.clocks = tc ? { w: tc[0] * 60000, b: tc[0] * 60000 } : null;
  g.inc = tc ? tc[1] * 1000 : 0;
  g.turnStart = Date.now();
  g.keys[positionKey(g)] = 1;
  g.legal = legalMoves(g);
  return g;
}

function announce(g, seat, text) {
  g.announce = { id: ++g.annId, seat, text };
}

function finish(g, type, winner) {
  g.result = { type, winner };
  g.legal = [];
  g.drawOffer = null;
}

// Time left for each side right now.
export function clocksNow(g) {
  if (!g.clocks) return null;
  const c = { ...g.clocks };
  if (!g.result) c[g.turn] = Math.max(0, c[g.turn] - (Date.now() - g.turnStart));
  return c;
}

// Called by the table when the side to move runs out of time.
export function checkFlag(g) {
  const c = clocksNow(g);
  if (!c || g.result || c[g.turn] > 0) return false;
  g.clocks = c;
  // Out of time loses, unless the opponent couldn't possibly mate.
  const winner = opp(g.turn);
  const theirs = g.board.map(p => (colorOf(p) === winner || p.toLowerCase() === 'k' ? p : ''));
  finish(g, 'time', insufficient(theirs) ? null : winner);
  return true;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  const me = seatColor(seat);
  if (g.result) return 'The game is over';

  if (a.type === 'resign') {
    finish(g, 'resign', opp(me));
    announce(g, seat, 'Resigns');
    return null;
  }
  if (a.type === 'offerDraw') {
    if (g.drawOffer) return 'A draw is already on offer';
    g.drawOffer = me;
    announce(g, seat, 'Offers a draw');
    return null;
  }
  if (a.type === 'acceptDraw') {
    if (!g.drawOffer || g.drawOffer === me) return 'There is no draw offer to accept';
    finish(g, 'agreed', null);
    announce(g, seat, 'Accepts the draw');
    return null;
  }
  if (a.type === 'declineDraw') {
    if (!g.drawOffer || g.drawOffer === me) return 'There is no draw offer to decline';
    g.drawOffer = null;
    announce(g, seat, 'Declines the draw');
    return null;
  }
  if (a.type !== 'move') return "That move isn't allowed";
  if (me !== g.turn) return `It's ${COLOR_NAME[g.turn]}'s move`;
  if (checkFlag(g)) return 'Out of time';

  const options = g.legal.filter(m => m.from === a.from && m.to === a.to);
  if (!options.length) return 'That move is not legal';
  const m = options.find(o => !o.promo || o.promo.toLowerCase() === (a.promo || 'q').toLowerCase()) || options[0];

  const before = stateOf(g);
  const text = san(before, m, g.legal);
  if (g.clocks) {
    g.clocks[g.turn] = Math.max(0, g.clocks[g.turn] - (Date.now() - g.turnStart)) + g.inc;
  }
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

export const resultText = (r, nameOf) => {
  if (!r) return '';
  const who = r.winner ? nameOf(r.winner === 'w' ? 0 : 1) : null;
  return {
    mate: `Checkmate · ${who} wins`,
    resign: `${nameOf(r.winner === 'w' ? 1 : 0)} resigned · ${who} wins`,
    time: who ? `Out of time · ${who} wins` : 'Out of time · draw (no mating material)',
    stalemate: 'Stalemate · draw',
    repetition: 'Threefold repetition · draw',
    fifty: '50 moves without a capture or pawn move · draw',
    material: 'Not enough pieces to checkmate · draw',
    agreed: 'Draw agreed',
  }[r.type];
};

// ---------------------------------------------------------------- computer player

const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
// Piece-square tables from White's side, a1 first (rank 1 → rank 8).
const PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0, -10, -5, 5, 0, 0, 0, 20, 20, 0, 0, 0,
    5, 5, 10, 25, 25, 10, 5, 5, 10, 10, 20, 30, 30, 20, 10, 10, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40, -30, 5, 10, 15, 15, 10, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 10, 15, 15, 10, 0, -30, -40, -20, 0, 0, 0, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 5, 5, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 5, 0, 0, 0, 0, -10, -10, 5, 5, 5, 5, 5, 0, -10, 0, 0, 5, 5, 5, 5, 0, -5,
    -5, 0, 5, 5, 5, 5, 0, -5, -10, 0, 5, 5, 5, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20, -20, -20, -20, -20, -20, -10, -20, -30, -30, -40, -40, -30, -30, -20,
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30],
};

function evaluate(s) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = s.board[i];
    if (!p) continue;
    const t = p.toLowerCase();
    const white = p !== t;
    const idx = white ? i : (7 - (i >> 3)) * 8 + (i & 7);
    score += (white ? 1 : -1) * (VAL[t] + PST[t][idx]);
  }
  return s.turn === 'w' ? score : -score;
}

const MATE = 100000;
const order = moves => moves.sort((a, b) =>
  (b.captured ? VAL[b.captured.toLowerCase()] * 10 - VAL[b.piece.toLowerCase()] : 0) + (b.promo ? 800 : 0) -
  ((a.captured ? VAL[a.captured.toLowerCase()] * 10 - VAL[a.piece.toLowerCase()] : 0) + (a.promo ? 800 : 0)));

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
    // Take a draw when behind, turn it down otherwise.
    const ev = evaluate({ ...stateOf(g), turn: seatColor(seat) });
    return { type: ev < -150 ? 'acceptDraw' : 'declineDraw' };
  }
  const s = stateOf(g);
  const maxDepth = { easy: 1, normal: 2, hard: 4 }[g.settings.level] || 2;
  const noise = g.settings.level === 'easy' ? 120 : g.settings.level === 'normal' ? 15 : 0;
  // Search one move deeper at a time; stop once the thinking budget is spent so a slow
  // tablet never freezes for long. A depth that doesn't finish in time is thrown away.
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
    moves = scored.sort((a, b) => b[1] - a[1]).map(x => x[0]); // best first next time round
    if (bestScore > MATE - 100 || Date.now() - started > budget / 3) break;
  }
  return { type: 'move', from: best.from, to: best.to, promo: best.promo ? best.promo.toLowerCase() : null };
}

// Castling by touch: after picking up the king, tapping your own rook castles that way
// (as well as tapping the square two to the side). Returns the rook square for a castle move.
export const CASTLE_ROOK = { K: 7, Q: 0, k: 63, q: 56 };
export function targetsFrom(legal, from) {
  const out = new Set();
  for (const m of legal) if (m.from === from) { out.add(m.to); if (m.castle) out.add(CASTLE_ROOK[m.castle]); }
  return out;
}
// The move a tap means: a normal destination, or the rook for castling.
export function tapMoves(legal, from, sq) {
  const direct = legal.filter(m => m.from === from && m.to === sq);
  if (direct.length) return direct;
  return legal.filter(m => m.from === from && m.castle && CASTLE_ROOK[m.castle] === sq);
}
