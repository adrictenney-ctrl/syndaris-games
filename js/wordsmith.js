// Wordsmith: a crossword tile game on our own 15×15 board. Draw seven letter tiles; on your
// turn lay a word in a straight line through the board (the first one across the centre star),
// connecting to what's there. Every new word you make must be real. Score the letters, with the
// board's bonus squares under your new tiles; use all seven tiles at once for +40. Or swap tiles,
// or pass. When the bag is empty and someone plays out, everyone's leftover tiles count against
// them. Our own board layout, letter values and tile counts.

export const N = 15, CENTER = 7 * 15 + 7;
export const VALUES = { A: 1, B: 3, C: 2, D: 2, E: 1, F: 4, G: 3, H: 3, I: 1, J: 9, K: 6, L: 1, M: 2, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 2, V: 5, W: 4, X: 8, Y: 4, Z: 9 };
const COUNTS = { E: 12, A: 9, I: 8, O: 8, N: 6, R: 6, T: 6, S: 5, L: 4, U: 4, D: 4, G: 3, B: 2, C: 2, M: 2, P: 2, F: 2, H: 2, V: 2, W: 2, Y: 2, K: 1, J: 1, X: 1, Q: 1, Z: 1, '?': 2 };
export const BINGO = 40;

// Bonus squares: one quadrant, mirrored four ways and across the diagonal.
const QUAD = { W3: [[0, 4]], W2: [[2, 2], [3, 6], [7, 7]], L3: [[1, 1], [5, 5], [1, 6]], L2: [[0, 0], [0, 7], [2, 4], [3, 7], [5, 7], [6, 6]] };
export const BONUS = Array(N * N).fill(null);
for (const [kind, cells] of Object.entries(QUAD)) for (const [r, c] of cells) for (const [a, b] of [[r, c], [c, r]]) for (const rr of [a, N - 1 - a]) for (const cc of [b, N - 1 - b]) BONUS[rr * N + cc] = kind;

let DICT = null;
export const setDictionary = words => { DICT = words; };
export const dictionaryReady = () => DICT !== null;
const isWord = w => (DICT === false ? true : DICT.has(w.toLowerCase()));   // false = couldn't load: accept everything

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const tileValue = t => (t === '?' || (t && t === t.toLowerCase()) ? 0 : VALUES[t] || 0);

export function createGame(settings, players) {
  const g = { settings: { level: 'normal', ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.bag = shuffle(Object.entries(COUNTS).flatMap(([l, n]) => Array(n).fill(l)));
  g.racks = g.seats.map(() => []);
  for (const s of g.order) g.racks[s] = g.bag.splice(0, 7);
  g.board = Array(N * N).fill(null);   // uppercase = tile, lowercase = blank playing that letter
  g.scores = g.seats.map(() => 0);
  g.turnIdx = 0;
  g.scoreless = 0;
  g.phase = 'play';
  g.last = null;
  return g;
}

export const current = g => g.order[g.turnIdx];
function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }

// Work out what a placement makes: { words: [{word, score}], score } or { error }.
export function evaluate(board, tiles) {
  if (!tiles.length) return { error: 'Place some tiles' };
  const idx = tiles.map(t => t.i);
  if (new Set(idx).size !== idx.length) return { error: 'Two tiles on one square' };
  if (idx.some(i => i < 0 || i >= N * N || board[i])) return { error: 'Those squares are taken' };
  const rows = new Set(idx.map(i => Math.floor(i / N))), cols = new Set(idx.map(i => i % N));
  if (rows.size > 1 && cols.size > 1) return { error: 'Tiles must be in one straight line' };
  const across = rows.size === 1 && (cols.size > 1 || hasNeighbour(board, idx[0], 1));
  const step = across ? 1 : N;
  const b = board.slice();
  tiles.forEach(t => { b[t.i] = t.letter; });
  // No gaps along the line.
  const lo = Math.min(...idx), hi = Math.max(...idx);
  for (let i = lo; i <= hi; i += step) if (!b[i]) return { error: 'No gaps in your word' };
  const empty = board.every(x => !x);
  if (empty) { if (!idx.includes(CENTER)) return { error: 'The first word goes across the centre star' }; if (tiles.length < 2) return { error: 'The first word needs at least two letters' }; }
  else if (!idx.some(i => [i - 1, i + 1, i - N, i + N].some(j => j >= 0 && j < N * N && board[j] && (Math.abs((j % N) - (i % N)) <= 1)))) return { error: 'Connect to the tiles already on the board' };
  const placed = new Set(idx);
  const words = [];
  const wordAt = (start, st) => {
    let i = start;
    while (prevOk(i, st) && b[i - st]) i -= st;
    let w = '', sum = 0, mult = 1;
    const cells = [];
    for (let j = i; j >= 0 && j < N * N && b[j] && (st === N || Math.floor(j / N) === Math.floor(i / N)); j += st) {
      const t = b[j];
      let v = tileValue(t);
      if (placed.has(j)) { const k = BONUS[j]; if (k === 'L2') v *= 2; if (k === 'L3') v *= 3; if (k === 'W2') mult *= 2; if (k === 'W3') mult *= 3; }
      w += t.toUpperCase(); sum += v; cells.push(j);
    }
    return { word: w, score: sum * mult, cells };
  };
  const main = wordAt(idx[0], step);
  if (main.word.length >= 2) words.push(main);
  const cross = step === 1 ? N : 1;
  for (const i of idx) { const w = wordAt(i, cross); if (w.word.length >= 2) words.push(w); }
  if (!words.length) return { error: 'Make a word of at least two letters' };
  let score = words.reduce((a, w) => a + w.score, 0);
  if (tiles.length === 7) score += BINGO;
  return { words, score, bingo: tiles.length === 7 };
}
const prevOk = (i, st) => (st === 1 ? i % N > 0 : i - N >= 0);
const hasNeighbour = (board, i, st) => (i % N > 0 && board[i - 1]) || (i % N < N - 1 && board[i + 1]);

function draw(g, s) { while (g.racks[s].length < 7 && g.bag.length) g.racks[s].push(g.bag.pop()); }

function nextTurn(g) {
  g.turnIdx = (g.turnIdx + 1) % g.order.length;
  if (g.scoreless >= g.order.length * 2) finish(g, null);
}

function finish(g, out) {
  g.phase = 'over';
  const left = {};
  for (const s of g.order) { left[s] = g.racks[s].reduce((a, t) => a + tileValue(t), 0); g.scores[s] -= left[s]; }
  if (out != null) g.scores[out] += Object.values(left).reduce((a, b) => a + b, 0);
  const best = Math.max(...g.order.map(s => g.scores[s]));
  g.winners = g.order.filter(s => g.scores[s] === best);
  g.leftover = left;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'The game is over';
  if (seat !== current(g)) return "It isn't your turn";
  const rack = g.racks[seat];
  if (a.type === 'place') {
    if (DICT === null) return 'The dictionary is still loading — one moment';
    const tiles = (a.tiles || []).map(t => ({ i: t.i | 0, letter: String(t.letter || '').toUpperCase(), blank: !!t.blank }));
    // The tiles must come from the rack (blanks played as any letter).
    const pool = rack.slice();
    for (const t of tiles) {
      const k = pool.indexOf(t.blank ? '?' : t.letter);
      if (!/^[A-Z]$/.test(t.letter) || k < 0) return "Those tiles aren't on your rack";
      pool.splice(k, 1);
      if (t.blank) t.letter = t.letter.toLowerCase();
    }
    const r = evaluate(g.board, tiles);
    if (r.error) return r.error;
    const bad = r.words.find(w => !isWord(w.word));
    if (bad) return `“${bad.word}” isn't in the dictionary`;
    tiles.forEach(t => { g.board[t.i] = t.letter; });
    g.racks[seat] = pool;
    g.scores[seat] += r.score;
    g.scoreless = 0;
    g.last = { seat, cells: tiles.map(t => t.i), words: r.words.map(w => w.word), score: r.score, id: ++g.moveId };
    g.log.push({ seat, text: `${r.words[0].word}${r.words.length > 1 ? ` +${r.words.length - 1}` : ''}`, score: r.score });
    if (g.log.length > 8) g.log.shift();
    announce(g, seat, `${r.words[0].word} · ${r.score}${r.bingo ? ' · all seven!' : ''}`);
    draw(g, seat);
    if (!g.racks[seat].length && !g.bag.length) { finish(g, seat); return null; }
    nextTurn(g);
    return null;
  }
  if (a.type === 'swap') {
    const give = a.tiles || [];
    if (g.bag.length < 7) return 'Fewer than seven tiles left in the bag — you can only pass';
    const pool = rack.slice();
    for (const t of give) { const k = pool.indexOf(t); if (k < 0) return "Those tiles aren't on your rack"; pool.splice(k, 1); }
    if (!give.length) return 'Pick tiles to swap';
    g.racks[seat] = pool;
    draw(g, seat);
    g.bag.push(...give); shuffle(g.bag);
    g.scoreless++;
    g.moveId++;
    announce(g, seat, `Swaps ${give.length}`);
    nextTurn(g);
    return null;
  }
  if (a.type === 'pass') {
    g.scoreless++;
    g.moveId++;
    announce(g, seat, 'Passes');
    nextTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: current(g), order: g.order, board: g.board, rack: g.racks[seat] || [], bag: g.bag.length,
    scores: g.scores, last: g.last, log: g.log, winners: g.winners || null, rackCounts: g.racks.map(r => r.length), ready: DICT !== null, moveId: g.moveId,
  };
}

// ---------------------------------------------------------------- computer player
// Classic anchor-and-cross-check move generation over a letter tree of shorter words.

let TRIE = null;
function trie() {
  if (TRIE || !DICT) return TRIE;
  TRIE = { c: {}, w: false };
  for (const w of DICT) {
    if (w.length < 2 || w.length > 9 || !/^[a-z]+$/.test(w)) continue;
    let n = TRIE;
    for (const ch of w.toUpperCase()) n = n.c[ch] ||= { c: {}, w: false };
    n.w = true;
  }
  return TRIE;
}

function movesFor(board, rack) {
  const T = trie();
  if (!T) return [];
  const out = [];
  const empty = board.every(x => !x);
  for (const across of [true, false]) {
    const at = (r, c) => (across ? r * N + c : c * N + r);
    for (let r = 0; r < N; r++) {
      // Cross-checks: which letters can sit in each empty square of this line.
      const checks = [];
      for (let c = 0; c < N; c++) {
        const i = at(r, c);
        if (board[i]) { checks.push(null); continue; }
        let before = '', after = '';
        for (let k = r - 1; k >= 0 && board[at(k, c)]; k--) before = board[at(k, c)].toUpperCase() + before;
        for (let k = r + 1; k < N && board[at(k, c)]; k++) after += board[at(k, c)].toUpperCase();
        if (!before && !after) { checks.push(true); continue; }
        const ok = new Set();
        for (const L of Object.keys(VALUES)) if (isWord(before + L + after)) ok.add(L);
        checks.push(ok);
      }
      const isAnchor = c => {
        const i = at(r, c);
        if (board[i]) return false;
        if (empty) return i === CENTER;
        return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(([a, b]) => a >= 0 && a < N && b >= 0 && b < N && board[at(a, b)]);
      };
      const tiles = rack.slice();
      const place = [];
      const record = () => { if (place.length) out.push(place.map(p => ({ ...p }))); };
      const extend = (node, c, anchorPassed) => {
        if (c >= N) { if (node.w && anchorPassed) record(); return; }
        const i = at(r, c);
        if (board[i]) { const L = board[i].toUpperCase(); if (node.c[L]) extend(node.c[L], c + 1, anchorPassed); return; }
        if (node.w && anchorPassed) record();
        const chk = checks[c];
        for (const [L, child] of Object.entries(node.c)) {
          if (chk !== true && !(chk && chk.has(L))) continue;
          let k = tiles.indexOf(L), blank = false;
          if (k < 0) { k = tiles.indexOf('?'); blank = true; }
          if (k < 0) continue;
          tiles.splice(k, 1); place.push({ i, letter: L, blank });
          extend(child, c + 1, anchorPassed || isAnchor(c));
          place.pop(); tiles.splice(k, 0, blank ? '?' : L);
        }
      };
      for (let c = 0; c < N; c++) {
        if (!isAnchor(c)) continue;
        if (c > 0 && board[at(r, c - 1)]) {
          // Prefix already on the board: walk it, then extend.
          let s = c - 1; while (s > 0 && board[at(r, s - 1)]) s--;
          let node = T;
          for (let k = s; k < c && node; k++) node = node.c[board[at(r, k)].toUpperCase()];
          if (node) extend(node, c, false);
        } else {
          let limit = 0;
          for (let k = c - 1; k >= 0 && !board[at(r, k)] && !isAnchor(k); k--) limit++;
          // Try left parts of every length, then position them right before the anchor.
          const tryLeft = (node, part) => {
            const start = c - part.length;
            const before = place.length;
            part.forEach((p, k) => place.push({ i: at(r, start + k), letter: p.letter, blank: p.blank }));
            extend(node, c, false);
            place.length = before;
            if (part.length >= limit) return;
            for (const [L, child] of Object.entries(node.c)) {
              let k = tiles.indexOf(L), blank = false;
              if (k < 0) { k = tiles.indexOf('?'); blank = true; }
              if (k < 0) continue;
              const ck = checks[c - part.length - 1];
              if (ck !== true && !(ck && ck.has(L))) continue;
              tiles.splice(k, 1);
              tryLeft(child, [...part, { letter: L, blank }]);
              tiles.splice(k, 0, blank ? '?' : L);
            }
          };
          tryLeft(T, []);
        }
      }
    }
  }
  return out;
}

export function botAction(g, seat) {
  if (!DICT) return { type: 'pass' };
  const rack = g.racks[seat];
  const cands = movesFor(g.board, rack);
  const scored = [];
  for (const m of cands) {
    const tiles = m.map(p => ({ i: p.i, letter: p.blank ? p.letter.toLowerCase() : p.letter }));
    const r = evaluate(g.board, tiles);
    if (r.error || r.words.some(w => !isWord(w.word))) continue;
    scored.push({ tiles: m, score: r.score - (m.some(p => p.blank) && r.score < 25 ? 8 : 0) });
  }
  // Nothing playable: swap the clunkiest tiles (keep blanks), or pass.
  if (!scored.length) return g.bag.length >= 7 ? { type: 'swap', tiles: rack.filter(t => t !== '?').sort((a, b) => tileValue(b) - tileValue(a)).slice(0, 4) } : { type: 'pass' };
  scored.sort((a, b) => b.score - a.score);
  const level = g.settings.level;
  const pick = level === 'hard' ? scored[0] : level === 'easy' ? scored[Math.floor(scored.length * (0.5 + Math.random() * 0.5))] : scored[Math.floor(Math.random() * Math.min(4, scored.length))];
  return { type: 'place', tiles: pick.tiles.map(p => ({ i: p.i, letter: p.letter, blank: p.blank })) };
}
