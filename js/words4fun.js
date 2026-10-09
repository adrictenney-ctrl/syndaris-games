// Words 4 Fun: two teams race to find words in a grid of letter tiles (4×4 or 5×5). After a
// 10-second countdown and the buzzer, everyone traces words on their own phone: three or more
// letters, each tile joined to the last (across, up/down or diagonally), no tile twice in a word.
// When time runs out the team lists are compared: any word BOTH teams found is cancelled for
// both. Every other word scores (3–4 letters 2, five 3, six 4, seven 6, eight or more 12 — or
// one point per letter), and the player who found a word first earns 2 more. Play one round,
// or rounds until a team reaches the target. Runs on the table (the host), which checks words.
import { isWord, hasPrefix, dictReady } from './dict.js?v=66';

export const COUNT_MS = 10000;
export const team = s => (s < 4 ? 0 : 1);
export const TEAM_NAME = ['Team Sun', 'Team Moon'];

// Letter tiles, weighted like English, with Qu on one tile.
const BAG = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIOOOOOOONNNNNNRRRRRRTTTTTTTLLLLSSSSSSUUUUDDDDGGGBBCCCMMMPPFFHHHVVWWYYKJXZ'.split('').concat(['Qu']);
const VOWEL = t => 'AEIOU'.includes(t[0]);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function makeGrid(n) {
  for (;;) {
    const tiles = Array.from({ length: n * n }, () => BAG[Math.floor(Math.random() * BAG.length)]);
    const v = tiles.filter(VOWEL).length / tiles.length;
    const counts = {};
    tiles.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    const tooMany = Object.entries(counts).some(([t, k]) => k > ('JKQuXZVWY'.includes(t) ? 1 : 3));
    if (v >= 0.3 && v <= 0.48 && !tooMany) return tiles;
  }
}

export const adjacent = (n, a, b) => a !== b && Math.abs(Math.floor(a / n) - Math.floor(b / n)) <= 1 && Math.abs((a % n) - (b % n)) <= 1;
export const wordOf = (grid, path) => path.map(i => grid[i]).join('').toLowerCase();

export function points(w, scoring) {
  const n = w.length;
  if (scoring === 'letters') return n;
  return n <= 4 ? 2 : n === 5 ? 3 : n === 6 ? 4 : n === 7 ? 6 : 12;
}

export function createGame(settings, players) {
  const g = {
    settings: { size: 4, minutes: 3, target: 0, scoring: 'chart', ...settings },
    seats: players.map(p => !!p), bots: players.map(p => !!p?.bot), annId: 0, moveId: 0, round: 0,
  };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.teamScores = [0, 0];
  g.playerScores = g.seats.map(() => 0);
  startRound(g);
  return g;
}

function startRound(g) {
  g.round++;
  g.n = g.settings.size;
  g.grid = makeGrid(g.n);
  g.found = g.seats.map(() => []);     // per seat: { w, path, first }
  g.firstBy = {};                      // word -> seat that found it first
  g.phase = 'count';
  g.goAt = 0;                          // set once the dictionary is ready
  g.endAt = 0;
  g.results = null;
  g.botPlan = [];
  g.moveId++;
}

const announce = (g, seat, text, kind = '') => { g.announce = { id: ++g.annId, seat, text, kind }; };

export function current() { return -1; }

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (!g.order.includes(seat)) return "You're not playing";
  if (a.type === 'word') {
    if (g.phase !== 'play') return g.phase === 'count' ? 'Wait for the buzzer!' : 'Time is up';
    const path = (a.path || []).map(Number);
    if (path.length < 3) return 'Words need at least three letters';
    if (new Set(path).size !== path.length || path.some(i => !(i >= 0 && i < g.grid.length))) return 'Each tile only once per word';
    for (let i = 1; i < path.length; i++) if (!adjacent(g.n, path[i - 1], path[i])) return 'Tiles must touch';
    const w = wordOf(g.grid, path);
    if (g.found[seat].some(f => f.w === w)) return `You already have ${w.toUpperCase()}`;
    if (!isWord(w)) return `${w.toUpperCase()} isn't in the dictionary`;
    const first = !(w in g.firstBy);
    if (first) g.firstBy[w] = seat;
    g.found[seat].push({ w, path, first });
    g.moveId++;
    if (first) announce(g, seat, `New word! (${g.found[seat].length})`, 'ding');
    return null;
  }
  if (a.type === 'next') {
    if (g.phase !== 'scored') return 'Not yet';
    startRound(g);
    return null;
  }
  if (a.type === 'endnow') {
    if (g.phase !== 'play') return 'Not now';
    finish(g);
    return null;
  }
  return "That move isn't allowed";
}

// Score the round: compare the two teams' lists.
function finish(g) {
  g.phase = 'scored';
  g.moveId++;
  const lists = [new Map(), new Map()];      // word -> first finder on that team
  for (const s of g.order) for (const f of g.found[s]) {
    const L = lists[team(s)];
    if (!L.has(f.w)) L.set(f.w, s);
  }
  const res = { teams: [[], []], add: [0, 0], players: g.seats.map(() => 0) };
  for (const t of [0, 1]) {
    for (const [w, s] of lists[t]) {
      const cancelled = lists[1 - t].has(w);
      const base = cancelled ? 0 : points(w, g.settings.scoring);
      const first = g.firstBy[w];
      const bonus = cancelled ? 0 : (first != null && team(first) === t ? 2 : 0);
      res.teams[t].push({ w, by: s, cancelled, pts: base, bonus, first: bonus ? first : null });
      res.add[t] += base + bonus;
      if (!cancelled) {
        res.players[s] += base;
        if (bonus) res.players[first] += bonus;
      }
    }
    res.teams[t].sort((a, b) => a.cancelled - b.cancelled || b.w.length - a.w.length || a.w.localeCompare(b.w));
  }
  g.teamScores[0] += res.add[0];
  g.teamScores[1] += res.add[1];
  res.players.forEach((p, s) => { g.playerScores[s] += p; });
  g.results = res;
  const tgt = g.settings.target;
  const reached = tgt && Math.max(...g.teamScores) >= tgt;
  if (!tgt || reached) {
    g.phase = 'over';
    const [a, b] = g.teamScores;
    g.winner = a === b ? null : a > b ? 0 : 1;
  }
  announce(g, g.order[0], "Time's up!", 'end');
}

// Every word in the grid (for the computer players), longest first.
export function solve(grid, n, limit = 400) {
  const out = new Map();
  const walk = (path, w) => {
    if (out.size >= limit) return;
    if (w.length >= 3 && isWord(w) && !out.has(w)) out.set(w, path.slice());
    if (w.length >= 10) return;
    const last = path[path.length - 1];
    for (let i = 0; i < n * n; i++) {
      if (path.includes(i) || !adjacent(n, last, i)) continue;
      const nw = w + grid[i].toLowerCase();
      if (!hasPrefix(nw)) continue;
      path.push(i); walk(path, nw); path.pop();
    }
  };
  for (let i = 0; i < n * n; i++) walk([i], grid[i].toLowerCase());
  return [...out].map(([w, path]) => ({ w, path }));
}

function planBots(g) {
  const bots = g.order.filter(s => g.bots[s]);
  if (!bots.length) return;
  // Computer players stick to ordinary-looking words (the dictionary has some odd ones).
  const all = solve(g.grid, g.n).filter(x => /[aeiouy]/.test(x.w) && /^[a-z]*[aeiouy][a-z]*$/.test(x.w) && x.w.replace(/[^aeiouy]/g, '').length / x.w.length >= 0.25);
  const dur = g.settings.minutes * 60000;
  const perMin = { easy: 3, normal: 5, hard: 9 }[g.settings.level || 'normal'];
  for (const s of bots) {
    const k = Math.min(all.length, Math.round(perMin * g.settings.minutes * (0.8 + Math.random() * 0.4)));
    const pick = shuffle(all.slice()).sort((a, b) => a.w.length - b.w.length + (Math.random() - 0.5) * 4).slice(0, k);
    for (const p of pick) g.botPlan.push({ seat: s, path: p.path, at: g.goAt + 4000 + Math.random() * (dur - 7000) });
  }
  g.botPlan.sort((a, b) => a.at - b.at);
}

// The clock: countdown → play → time up, plus the computer players' words.
export function tick(g) {
  if (g.phase === 'count') {
    if (!dictReady()) return { ms: 300, run: () => {} };
    if (!g.goAt) { g.goAt = Date.now() + COUNT_MS; g.moveId++; return { ms: 0, run: () => {} }; }
    return { ms: Math.max(0, g.goAt - Date.now()), run: () => { g.phase = 'play'; g.endAt = g.goAt + g.settings.minutes * 60000; g.moveId++; planBots(g); announce(g, g.order[0], 'Go!', 'go'); } };
  }
  if (g.phase === 'play') {
    const next = g.botPlan[0];
    if (next && next.at < g.endAt) {
      return { ms: Math.max(0, next.at - Date.now()), run: () => { g.botPlan.shift(); applyAction(g, next.seat, { type: 'word', path: next.path }); } };
    }
    return { ms: Math.max(0, g.endAt - Date.now()), run: () => finish(g) };
  }
  return null;
}

export const botAction = () => null;

export function viewFor(g, seat) {
  const now = Date.now();
  return {
    phase: g.phase, round: g.round, n: g.n, grid: g.grid, settings: g.settings, order: g.order,
    goIn: g.goAt ? g.goAt - now : null, left: g.endAt ? g.endAt - now : null,
    mine: g.found[seat].map(f => ({ w: f.w, first: f.first })),
    counts: g.found.map(f => f.length), teamScores: g.teamScores, playerScores: g.playerScores,
    results: g.phase === 'count' || g.phase === 'play' ? null : g.results, winner: g.winner, moveId: g.moveId,
  };
}
