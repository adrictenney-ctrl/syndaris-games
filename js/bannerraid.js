// Banner Raid: a two-player game of hidden ranks. Each side sets up 40 pieces face-down on
// its four rows of a 10×10 field (two lakes in the middle). Move one piece a square at a
// time; move onto an enemy piece to attack — both are revealed and the higher rank wins
// (equal ranks both fall). Capture the enemy Banner to win; a side that can't move loses.
//
// Specials: the Scout runs any distance in a straight line. The Sapper is the only piece that
// can clear a Mine (every other attacker is blown up). The Assassin beats the Warlord — but
// only when the Assassin attacks. Mines and the Banner never move.
// Runs only on the table (host). Squares are numbered row*10 + col; player 0 sets up on
// rows 6–9 (the bottom), player 1 on rows 0–3.

export const RANKS = {
  10: { name: 'Warlord', n: 1 }, 9: { name: 'General', n: 1 }, 8: { name: 'Colonel', n: 2 }, 7: { name: 'Major', n: 3 },
  6: { name: 'Captain', n: 4 }, 5: { name: 'Knight', n: 4 }, 4: { name: 'Sergeant', n: 4 }, 3: { name: 'Sapper', n: 5 },
  2: { name: 'Scout', n: 8 }, 1: { name: 'Assassin', n: 1 }, M: { name: 'Mine', n: 6 }, B: { name: 'Banner', n: 1 },
};
export const ORDER = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M', 'B'];
export const LAKES = new Set([42, 43, 46, 47, 52, 53, 56, 57]);
export const zone = p => (p === 0 ? Array.from({ length: 40 }, (_, i) => 60 + i) : Array.from({ length: 40 }, (_, i) => i));
const still = r => r === 'M' || r === 'B';

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// A sensible random setup: the Banner on the back row with Mines around it, Scouts and a few
// low ranks up front, the rest shuffled. Returned as ranks in rows from the back (row 0 = back).
export function autoSetup() {
  const rows = [Array(10).fill(null), Array(10).fill(null), Array(10).fill(null), Array(10).fill(null)];
  const pool = [];
  for (const r of ORDER) for (let i = 0; i < RANKS[r].n; i++) pool.push(r);
  const take = r => pool.splice(pool.indexOf(r), 1)[0];
  const fc = Math.floor(Math.random() * 10);
  rows[0][fc] = take('B');
  const guard = [[0, fc - 1], [0, fc + 1], [1, fc]].filter(([, c]) => c >= 0 && c < 10);
  for (const [r, c] of guard) rows[r][c] = take('M');
  // A couple more mines somewhere in the back two rows as decoys.
  const backs = shuffle([...Array(20).keys()].map(i => [Math.floor(i / 10), i % 10]).filter(([r, c]) => !rows[r][c]));
  while (pool.includes('M')) { const [r, c] = backs.pop(); rows[r][c] = take('M'); }
  // Front row: scouts and some low ranks.
  const front = shuffle([...Array(10).keys()]);
  for (let i = 0; i < 4; i++) rows[3][front[i]] = take('2');
  shuffle(pool);
  for (let r = 3; r >= 0; r--) for (let c = 0; c < 10; c++) if (!rows[r][c]) rows[r][c] = pool.pop();
  return rows;
}

function place(g, p, rows) {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) {
    const sq = p === 0 ? (9 - r) * 10 + c : r * 10 + (9 - c);
    g.board[sq] = { o: p, r: rows[r][c], known: false, moved: false };
  }
}

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.board = Array(100).fill(null);
  place(g, 0, autoSetup());
  place(g, 1, autoSetup());
  g.ready = [false, false];
  g.phase = 'setup';
  g.turnP = 0;
  g.hist = [[], []];
  g.lost = [[], []];          // ranks each player has lost
  g.battle = null;
  g.last = null;
  g.winner = null;
  g.how = null;
  return g;
}

export const seatOf = (g, p) => g.order[p];
export const playerOf = (g, s) => g.order.indexOf(s);
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const current = g => (g.phase === 'play' ? g.order[g.turnP] : -1);

const inBounds = (r, c) => r >= 0 && r < 10 && c >= 0 && c < 10;

// Every legal move for player p: [{from, to}].
export function legalMoves(g, p) {
  const out = [];
  for (let sq = 0; sq < 100; sq++) {
    const pc = g.board[sq];
    if (!pc || pc.o !== p || still(pc.r)) continue;
    const r0 = Math.floor(sq / 10), c0 = sq % 10;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let k = 1; k < 10; k++) {
        const r = r0 + dr * k, c = c0 + dc * k, to = r * 10 + c;
        if (!inBounds(r, c) || LAKES.has(to)) break;
        const t = g.board[to];
        if (t && t.o === p) break;
        if (!bouncing(g, p, sq, to)) out.push({ from: sq, to });
        if (t || pc.r !== '2') break;
      }
    }
  }
  return out;
}

// No shuttling one piece back and forth between the same two squares more than three times.
function bouncing(g, p, from, to) {
  const h = g.hist[p];
  if (h.length < 3) return false;
  const [a, b, c] = h.slice(-3);
  return c.from === to && c.to === from && b.from === from && b.to === to && a.from === to && a.to === from;
}

// Who wins a fight: 'a' (attacker), 'd' (defender) or 'both'.
export function fight(att, def) {
  if (def === 'B') return 'a';
  if (def === 'M') return att === '3' ? 'a' : 'd';
  if (att === '1' && def === '10') return 'a';
  const A = Number(att), D = Number(def);
  return A > D ? 'a' : A < D ? 'd' : 'both';
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  const p = playerOf(g, seat);
  if (p < 0) return "You're not playing";
  if (g.phase === 'setup') {
    if (g.ready[p] && a.type !== 'unready') return 'You are ready — waiting for the other side';
    if (a.type === 'shuffle') { place(g, p, autoSetup()); g.moveId++; return null; }
    if (a.type === 'swap') {
      const Z = new Set(zone(p));
      if (!Z.has(a.a) || !Z.has(a.b)) return 'Swap pieces in your own rows';
      [g.board[a.a], g.board[a.b]] = [g.board[a.b], g.board[a.a]];
      g.moveId++;
      return null;
    }
    if (a.type === 'ready') {
      g.ready[p] = true;
      announce(g, seat, 'Ready! ⚑');
      if (g.ready.every(Boolean)) { g.phase = 'play'; g.turnP = 0; }
      g.moveId++;
      return null;
    }
    if (a.type === 'unready') { g.ready[p] = false; g.moveId++; return null; }
    return 'Set up your pieces first';
  }
  if (p !== g.turnP) return "It isn't your turn";
  if (a.type !== 'move') return "That move isn't allowed";
  const from = Number(a.from), to = Number(a.to);
  if (!legalMoves(g, p).some(m => m.from === from && m.to === to)) return "That piece can't go there";
  const pc = g.board[from], t = g.board[to];
  g.hist[p].push({ from, to });
  if (g.hist[p].length > 6) g.hist[p].shift();
  pc.moved = true;
  // A Scout that runs more than one square gives itself away.
  if (pc.r === '2' && Math.abs(from - to) !== 1 && Math.abs(from - to) !== 10) pc.known = true;
  g.battle = null;
  if (!t) {
    g.board[to] = pc;
    g.board[from] = null;
  } else {
    const res = fight(pc.r, t.r);
    g.battle = { a: pc.r, d: t.r, ap: p, res, at: to, id: g.moveId + 1 };
    pc.known = true; t.known = true;
    g.board[from] = null;
    if (res === 'a') { g.lost[t.o].push(t.r); g.board[to] = pc; }
    else if (res === 'd') { g.lost[p].push(pc.r); }
    else { g.lost[p].push(pc.r); g.lost[t.o].push(t.r); g.board[to] = null; }
    const nm = r => RANKS[r].name;
    announce(g, seat, res === 'a' ? `${nm(pc.r)} takes ${nm(t.r)}!` : res === 'd' ? `${nm(pc.r)} falls to ${nm(t.r)}` : `${nm(pc.r)} and ${nm(t.r)} fall together`);
    if (t.r === 'B') return finish(g, p, 'banner');
  }
  g.last = { from, to, id: g.moveId + 1 };
  g.moveId++;
  // A game that drags on for 1,500 moves is called a draw.
  g.turnP = 1 - g.turnP;
  g.plies = (g.plies || 0) + 1;
  if (g.plies >= 1500) { g.phase = 'over'; g.winner = null; g.how = 'draw'; return null; }
  // A side with nothing left to move loses.
  if (!legalMoves(g, g.turnP).length) return finish(g, 1 - g.turnP, 'stuck');
  return null;
}

function finish(g, p, how) {
  g.phase = 'over';
  g.winner = g.order[p];
  g.how = how;
  g.moveId++;
  return null;
}

// The table's clock: bots get themselves ready during setup.
export function tick(g, players) {
  if (g.phase !== 'setup') return null;
  const p = [0, 1].find(p => !g.ready[p] && players[g.order[p]]?.bot);
  if (p == null) return null;
  return { ms: 700, run: () => applyAction(g, g.order[p], { type: 'ready' }) };
}

// ---------------------------------------------------------------- bots

const VALUE = { 10: 10, 9: 8, 8: 6, 7: 5, 6: 4, 5: 3, 4: 2, 3: 3.5, 2: 1.5, 1: 6, M: 1, B: 100 };
const nearest = (g, p, sq) => { let d = 99; for (let i = 0; i < 100; i++) { const t = g.board[i]; if (t && t.o !== p) d = Math.min(d, Math.abs(Math.floor(i / 10) - Math.floor(sq / 10)) + Math.abs(i % 10 - sq % 10)); } return d; };

export function botAction(g, seat) {
  const p = playerOf(g, seat);
  if (g.phase === 'setup') return { type: 'ready' };
  const moves = legalMoves(g, p);
  const enemyAt = sq => { const t = g.board[sq]; return t && t.o !== p ? t : null; };
  const forward = p === 0 ? -1 : 1;
  let best = null, bestV = -Infinity;
  for (const m of moves) {
    const pc = g.board[m.from], t = g.board[m.to];
    let v = Math.random() * 0.6;
    const mine = VALUE[pc.r];
    if (t) {
      if (t.known) {
        const res = fight(pc.r, t.r);
        v += res === 'a' ? VALUE[t.r] * 2 + 2 : res === 'd' ? -mine * 2 : VALUE[t.r] - mine;
      } else {
        const couldBeMine = !t.moved;
        if (['2', '4'].includes(pc.r)) v += 2;                 // send cheap pieces to find out
        else if (pc.r === '3') v += couldBeMine ? 1.6 : 0.4;
        else if (Number(pc.r) >= 8) v += couldBeMine ? -4 : -1;
        else v += couldBeMine ? -1.5 : 0.3;
        // Back-row pieces that never moved might be the Banner.
        const row = Math.floor(m.to / 10);
        if (couldBeMine && (row === 0 || row === 9)) v += 0.8;
      }
    } else {
      const r0 = Math.floor(m.from / 10), r1 = Math.floor(m.to / 10);
      // Close in on the nearest enemy piece.
      if (Number(pc.r) < 9) v += 0.3 * (nearest(g, p, m.from) - nearest(g, p, m.to));
      if ((r1 - r0) * forward > 0) v += pc.r === '2' ? 0.5 : 0.35;
      // Don't step next to a known enemy that beats us.
      for (const d of [1, -1, 10, -10]) {
        const n = m.to + d;
        if (n < 0 || n > 99 || (Math.abs(d) === 1 && Math.floor(n / 10) !== r1)) continue;
        const e = enemyAt(n);
        if (e && e.known && !still(e.r) && fight(e.r, pc.r) === 'a') v -= mine * 1.5;
        if (e && e.known && fight(pc.r, e.r) === 'a') v += 0.8;
      }
    }
    // Keep the big pieces home until something is known.
    if (Number(pc.r) >= 9 && !t) v -= 0.6;
    if (v > bestV) { bestV = v; best = m; }
  }
  return { type: 'move', from: best.from, to: best.to };
}

export function viewFor(g, seat) {
  const p = playerOf(g, seat);
  return {
    phase: g.phase, me: p, turnP: g.turnP, order: g.order, ready: g.ready, winner: g.winner, how: g.how,
    board: g.board.map(pc => pc && ({ o: pc.o, r: pc.o === p || pc.known || g.phase === 'over' ? pc.r : null, known: pc.known, moved: pc.moved })),
    moves: g.phase === 'play' && p === g.turnP ? legalMoves(g, p) : [], last: g.last, battle: g.battle, lost: g.lost, moveId: g.moveId,
  };
}

export function check(g) {
  const n = g.board.filter(Boolean).length + g.lost[0].length + g.lost[1].length;
  return n === 80 ? '' : `pieces ${n}`;
}
