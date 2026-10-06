// Checkers (American / English draughts) rules, with a computer player.
// 8×8 board, play on the dark squares. Ebony moves first and sits at seat 0 (the bottom);
// Ivory sits at seat 1. Men move forward one square; kings move one square any diagonal
// direction. Captures are compulsory, jumps chain, and a man that reaches the far row
// is crowned and its move ends there.
//
// Squares are numbered 0..63 as row * 8 + file, row 0 at Ebony's side. Pieces:
// 'd' ebony man, 'D' ebony king, 'l' ivory man, 'L' ivory king.

export const seatColor = seat => (seat === 0 ? 'd' : 'l');
export const colorOf = p => (p ? p.toLowerCase() : null);
export const isKing = p => !!p && p === p.toUpperCase();
export const NAME = { d: 'Ebony', l: 'Ivory' };
const opp = c => (c === 'd' ? 'l' : 'd');
export const dark = s => ((s >> 3) + (s & 7)) % 2 === 0;
// Standard square numbers 1–32, counted from Ebony's back row.
export const num = s => (s >> 3) * 4 + (3 - ((s & 7) >> 1)) + 1;

const DIRS = { d: [[1, -1], [1, 1]], l: [[-1, -1], [-1, 1]] };
const ALL = [[1, -1], [1, 1], [-1, -1], [-1, 1]];
const dirsOf = p => (isKing(p) ? ALL : DIRS[colorOf(p)]);
const at = (r, f) => (r < 0 || r > 7 || f < 0 || f > 7 ? -1 : r * 8 + f);
const crownRow = c => (c === 'd' ? 7 : 0);

export function startBoard() {
  const b = new Array(64).fill('');
  for (let s = 0; s < 64; s++) {
    if (!dark(s)) continue;
    const r = s >> 3;
    if (r <= 2) b[s] = 'd';
    else if (r >= 5) b[s] = 'l';
  }
  return b;
}

// Every way to keep jumping from `s` with piece `p`. Captured pieces stay on the board
// until the move is over (and can't be jumped twice), as in the official rules.
function jumps(board, s, p, caps, path, out) {
  let found = false;
  const r = s >> 3, f = s & 7;
  for (const [dr, df] of dirsOf(p)) {
    const mid = at(r + dr, f + df), land = at(r + 2 * dr, f + 2 * df);
    if (mid < 0 || land < 0) continue;
    if (colorOf(board[mid]) !== opp(colorOf(p)) || caps.includes(mid) || board[land]) continue;
    found = true;
    const c2 = [...caps, mid], p2 = [...path, land];
    const crowned = !isKing(p) && (land >> 3) === crownRow(colorOf(p));
    if (crowned) { out.push({ caps: c2, path: p2 }); continue; } // crowning ends the move
    // Lift the piece off its old square while it travels.
    const b2 = board.slice(); b2[land] = p; b2[s] = '';
    if (!jumps(b2, land, p, c2, p2, out)) out.push({ caps: c2, path: p2 });
  }
  return found;
}

export function legalMoves(board, turn) {
  const caps = [], steps = [];
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (colorOf(p) !== turn) continue;
    const found = [];
    jumps(board, s, p, [], [], found);
    for (const j of found) caps.push({ from: s, to: j.path[j.path.length - 1], path: j.path, caps: j.caps });
    if (caps.length) continue;
    const r = s >> 3, f = s & 7;
    for (const [dr, df] of dirsOf(p)) {
      const t = at(r + dr, f + df);
      if (t >= 0 && !board[t]) steps.push({ from: s, to: t, path: [t], caps: [] });
    }
  }
  return caps.length ? caps : steps;
}

export function makeMove(board, m) {
  const b = board.slice();
  const p = b[m.from];
  b[m.from] = '';
  for (const c of m.caps) b[c] = '';
  const crowned = !isKing(p) && (m.to >> 3) === crownRow(colorOf(p));
  b[m.to] = crowned ? p.toUpperCase() : p;
  return { board: b, crowned };
}

export const notation = m => m.caps.length ? [m.from, ...m.path].map(num).join('×') : `${num(m.from)}-${num(m.to)}`;

// ---------------------------------------------------------------- the game

export function createGame(settings) {
  const g = {
    settings: { level: 'normal', ...settings },
    board: startBoard(), turn: 'd', moves: [], lastMove: null, result: null, drawOffer: null,
    quiet: 0,              // plies since the last capture or man move (draw at 80)
    seen: {}, annId: 0,
  };
  g.seen[key(g)] = 1;
  g.legal = legalMoves(g.board, g.turn);
  return g;
}

const key = g => g.turn + g.board.map(p => p || '.').join('');

function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }
function finish(g, type, winner) { g.result = { type, winner }; g.legal = []; g.drawOffer = null; }

export const count = (board, c) => board.reduce((n, p) => {
  if (colorOf(p) !== c) return n;
  n[isKing(p) ? 'kings' : 'men']++;
  return n;
}, { men: 0, kings: 0 });

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.result) return 'The game is over';
  const me = seatColor(seat);
  if (a.type === 'resign') { finish(g, 'resign', opp(me)); announce(g, seat, 'Resigns'); return null; }
  if (a.type === 'offerDraw') {
    if (g.drawOffer) return 'A draw is already on offer';
    g.drawOffer = me; announce(g, seat, 'Offers a draw'); return null;
  }
  if (a.type === 'acceptDraw' || a.type === 'declineDraw') {
    if (!g.drawOffer || g.drawOffer === me) return 'There is no draw offer';
    if (a.type === 'acceptDraw') { finish(g, 'agreed', null); announce(g, seat, 'Accepts the draw'); }
    else { g.drawOffer = null; announce(g, seat, 'Declines the draw'); }
    return null;
  }
  if (a.type !== 'move') return "That move isn't allowed";
  if (me !== g.turn) return `It's ${NAME[g.turn]}'s move`;
  const options = g.legal.filter(m => m.from === a.from && m.to === a.to);
  if (!options.length) {
    if (g.legal.some(m => m.caps.length)) return 'You must take a piece when you can';
    return 'That move is not legal';
  }
  // Two different routes to the same square: take the one that captures the most.
  const m = options.sort((x, y) => y.caps.length - x.caps.length)[0];
  const moved = g.board[m.from];
  const { board, crowned } = makeMove(g.board, m);
  g.board = board;
  g.quiet = m.caps.length || !isKing(moved) ? 0 : g.quiet + 1;
  const text = notation(m);
  g.moves.push(text);
  g.lastMove = { id: (g.lastMove?.id || 0) + 1, from: m.from, to: m.to, path: m.path, caps: m.caps, crowned };
  g.drawOffer = null;
  g.turn = opp(g.turn);
  g.legal = legalMoves(g.board, g.turn);
  const k = key(g);
  g.seen[k] = (g.seen[k] || 0) + 1;
  announce(g, seat, crowned ? `${text} · Crowned!` : m.caps.length > 1 ? `${text} · ${m.caps.length} pieces!` : text);
  if (!g.legal.length) finish(g, count(g.board, g.turn).men + count(g.board, g.turn).kings ? 'blocked' : 'taken', me);
  else if (g.seen[k] >= 3) finish(g, 'repetition', null);
  else if (g.quiet >= 80) finish(g, 'forty', null);
  return null;
}

export function viewFor(g, seat) {
  const me = seatColor(seat);
  return {
    color: me, board: g.board, turn: g.turn, lastMove: g.lastMove, result: g.result, drawOffer: g.drawOffer,
    legal: !g.result && g.turn === me ? g.legal : [],
    mustJump: !g.result && g.legal.some(m => m.caps.length),
    moves: g.moves.slice(-30), moveCount: g.moves.length,
    counts: { d: count(g.board, 'd'), l: count(g.board, 'l') },
  };
}

export const resultText = (r, nameOf) => {
  if (!r) return '';
  const who = r.winner ? nameOf(r.winner === 'd' ? 0 : 1) : null;
  const loser = r.winner ? nameOf(r.winner === 'd' ? 1 : 0) : null;
  return {
    taken: `${who} took every piece`,
    blocked: `${loser} has no move left · ${who} wins`,
    resign: `${loser} resigned · ${who} wins`,
    agreed: 'Draw agreed',
    repetition: 'Same position three times · draw',
    forty: 'Forty moves each without progress · draw',
  }[r.type];
};

// ---------------------------------------------------------------- computer player

function evaluate(board, c) {
  let score = 0;
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p) continue;
    const r = s >> 3, f = s & 7;
    const own = colorOf(p) === 'd' ? r : 7 - r;           // rows advanced
    let v = isKing(p) ? 175 : 100 + own * 4;
    if (!isKing(p) && own === 0 && (f === 2 || f === 6 || f === 1 || f === 5)) v += 12; // back-row guard
    if (f >= 2 && f <= 5 && r >= 2 && r <= 5) v += 6;   // the centre
    if (f === 0 || f === 7) v -= 4;                        // edges are safe but passive
    score += colorOf(p) === c ? v : -v;
  }
  return score;
}

const WIN = 100000;
function search(board, turn, depth, alpha, beta, ply) {
  const moves = legalMoves(board, turn);
  if (!moves.length) return -WIN + ply;
  // Keep searching while captures are forced, so the bot doesn't stop mid-exchange.
  if (depth <= 0 && !moves[0].caps.length) return evaluate(board, turn);
  if (depth <= -6) return evaluate(board, turn);
  moves.sort((a, b) => b.caps.length - a.caps.length);
  for (const m of moves) {
    const s = -search(makeMove(board, m).board, opp(turn), depth - 1, -beta, -alpha, ply + 1);
    if (s >= beta) return s;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

export function botAction(g, seat) {
  const me = seatColor(seat);
  if (g.drawOffer && g.drawOffer !== me) return { type: evaluate(g.board, me) < -120 ? 'acceptDraw' : 'declineDraw' };
  const level = g.settings.level;
  const maxDepth = { easy: 2, normal: 5, hard: 9 }[level] || 5;
  const noise = level === 'easy' ? 90 : level === 'normal' ? 12 : 0;
  const started = Date.now(), budget = 1200;
  let moves = g.legal.slice();
  let best = moves[0];
  if (moves.length === 1) return { type: 'move', from: best.from, to: best.to };
  for (let depth = 1; depth <= maxDepth; depth++) {
    const scored = [];
    let done = true;
    for (const m of moves) {
      if (depth > 1 && Date.now() - started > budget) { done = false; break; }
      const s = -search(makeMove(g.board, m).board, opp(me), depth - 1, -WIN - 1, WIN + 1, 1) + (Math.random() - 0.5) * 2 * noise;
      scored.push([m, s]);
    }
    if (!done) break;
    scored.sort((a, b) => b[1] - a[1]);
    best = scored[0][0];
    moves = scored.map(x => x[0]);
    if (scored[0][1] > WIN - 200 || Date.now() - started > budget / 3) break;
  }
  return { type: 'move', from: best.from, to: best.to };
}

// For tapping: the squares a picked-up piece can finish on.
export const targetsFrom = (legal, from) => new Set(legal.filter(m => m.from === from).map(m => m.to));
