// Sketch & Guess: one player draws a secret word on their phone, the drawing appears on
// the table, and everyone else types their answer on their own phone. When the time runs
// out (or everyone has it) the table reveals the word and every player's final answer.
import { LISTS } from './sketch-words.js?v=31';

export const PALETTE = ['#1d1b1a', '#e0382c', '#f39a1e', '#f2cf2a', '#36a852', '#2f7de1', '#8b45c8', '#8a5a32', '#f08bb4', '#fbf7ec'];
export const ERASER = PALETTE.length - 1;           // paints in the paper's own colour
export const SIZES = [6, 14, 30];                   // stroke widths, in the pad's 1000 × 750 units
export const PAD_W = 1000, PAD_H = 750;

const PICK_MS = 20000;
const REVEAL_MS = 10000;
const MAX_INK = 80000;                              // coordinates per drawing, so a drawing can't grow forever

let annId = 0;
const now = () => Date.now();
const rnd = n => Math.floor(Math.random() * n);

// ---------------------------------------------------------------- answers

export function norm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/^(a|an|the) /, '');
}

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

// 'yes' (counts), 'close' (tell them they're nearly there) or 'no'.
export function check(guess, word) {
  const g = norm(guess), w = norm(word);
  if (!g) return 'no';
  const gs = g.replace(/ /g, ''), ws = w.replace(/ /g, '');
  if (gs === ws || gs === ws + 's' || gs === ws + 'es' || ws === gs + 's') return 'yes';
  const d = lev(gs, ws);
  if (d <= (ws.length >= 6 ? 1 : 0)) return 'yes';           // small typos in longer words are fine
  if (d <= (ws.length >= 4 ? 2 : 1)) return 'close';
  if (ws.length >= 5 && (gs.includes(ws) || ws.includes(gs) && gs.length >= 4)) return 'close';
  return 'no';
}

// ---------------------------------------------------------------- setup

export function createGame(settings, players) {
  const g = {
    settings: { rounds: 2, time: 80, words: 'mixed', hints: true, ...settings },
    seats: [],
    scores: new Array(players.length).fill(0),
    round: 1,
    drawn: [],
    drawer: -1,
    turnNo: 0,
    phase: 'pick',
    used: [],
    announce: null,
  };
  refreshSeats(g, players);
  // Start with a random player; after that it goes around the table.
  const humans = humanSeats(g);
  g.drawer = humans.length ? humans[rnd(humans.length)] : 0;
  g.drawer = (g.drawer + players.length - 1) % players.length; // startTurn moves on by one
  startTurn(g, true);
  return g;
}

export function refreshSeats(g, players) {
  g.seats = players.map(p => (p ? (p.bot ? 'bot' : 'human') : null));
  while (g.scores.length < g.seats.length) g.scores.push(0);
}

const humanSeats = g => g.seats.map((s, i) => (s === 'human' ? i : -1)).filter(i => i >= 0);

function pickWords(g) {
  const levels = g.settings.words === 'mixed' ? ['easy', 'medium', 'hard'] : [g.settings.words, g.settings.words, g.settings.words];
  const out = [];
  for (const level of levels) {
    let pool = LISTS[level].filter(w => !g.used.includes(w) && !out.some(o => o.w === w));
    if (!pool.length) pool = LISTS[level].filter(w => !out.some(o => o.w === w));
    out.push({ w: pool[rnd(pool.length)], level });
  }
  return out;
}

function startTurn(g, first = false) {
  const n = g.seats.length;
  const humans = humanSeats(g);
  let next = -1;
  for (let k = 1; k <= n && humans.length; k++) {
    const s = (g.drawer + k) % n;
    if (humans.includes(s) && !g.drawn.includes(s)) { next = s; break; }
  }
  if (next < 0 && !first) {
    // Everyone has drawn this round.
    if (g.round >= g.settings.rounds || humans.length < 2) return gameOver(g);
    g.round++;
    g.drawn = [];
    for (let k = 1; k <= n; k++) {
      const s = (g.drawer + k) % n;
      if (humans.includes(s)) { next = s; break; }
    }
  }
  if (next < 0) return gameOver(g);
  g.drawer = next;
  g.drawn.push(next);
  g.turnNo++;
  g.phase = 'pick';
  g.choices = pickWords(g);
  g.word = null;
  g.revealed = [];
  g.ink = [];
  g.guesses = {};
  g.correct = 0;
  g.drawerPts = 0;
  g.result = null;
  g.endsAt = now() + PICK_MS;
}

function beginDrawing(g, i) {
  g.word = g.choices[i].w;
  g.level = g.choices[i].level;
  g.used.push(g.word);
  g.phase = 'draw';
  g.total = g.settings.time * 1000;
  g.startedAt = now();
  g.endsAt = g.startedAt + g.total;
}

function endTurn(g, why) {
  g.phase = 'reveal';
  g.result = {
    word: g.word,
    drawer: g.drawer,
    why,
    drawerPts: g.drawerPts,
    answers: g.seats.map((s, i) => {
      if (!s || i === g.drawer) return null;
      const a = g.guesses[i];
      return { answer: a?.last || '', correct: !!a?.correct, pts: a?.pts || 0 };
    }),
  };
  g.endsAt = now() + REVEAL_MS;
}

function gameOver(g) {
  g.phase = 'over';
  g.endsAt = 0;
  const best = Math.max(...g.scores);
  g.winners = g.scores.map((s, i) => (s === best && g.seats[i] ? i : -1)).filter(i => i >= 0);
}

const letterIdx = w => [...w].map((ch, i) => (/\p{L}|\d/u.test(ch) ? i : -1)).filter(i => i >= 0);
const maxHints = g => Math.min(2, Math.floor(letterIdx(g.word).length / 3));
const hintTimes = g => [0.5, 0.75].slice(0, maxHints(g)).map(f => g.startedAt + g.total * f);

// Everyone who could be guessing right now.
const guessers = g => humanSeats(g).filter(s => s !== g.drawer);
const allIn = g => { const gs = guessers(g); return gs.length > 0 && gs.every(s => g.guesses[s]?.correct); };

// ---------------------------------------------------------------- the clock

// Called by the table on every update. Returns the next thing that happens by itself.
export function timer(g, players) {
  refreshSeats(g, players);
  if (g.phase === 'over') return null;
  const drawerGone = g.seats[g.drawer] !== 'human';
  if (g.phase === 'pick') {
    if (drawerGone) return { ms: 1200, run: () => startTurn(g) };
    return { ms: Math.max(0, g.endsAt - now()), run: () => { if (g.phase === 'pick') beginDrawing(g, rnd(g.choices.length)); } };
  }
  if (g.phase === 'draw') {
    if (drawerGone) return { ms: 1500, run: () => endTurn(g, 'left') };
    if (allIn(g)) return { ms: 600, run: () => endTurn(g, 'all') };
    const hint = g.settings.hints ? hintTimes(g)[g.revealed.length] : undefined;
    if (hint !== undefined && hint < g.endsAt) {
      return { ms: Math.max(0, hint - now()), run: () => revealLetter(g) };
    }
    return { ms: Math.max(0, g.endsAt - now()), run: () => { if (g.phase === 'draw') endTurn(g, 'time'); } };
  }
  if (g.phase === 'reveal') return { ms: Math.max(0, g.endsAt - now()), run: () => { if (g.phase === 'reveal') startTurn(g); } };
  return null;
}

function revealLetter(g) {
  if (g.phase !== 'draw') return;
  const left = letterIdx(g.word).filter(i => !g.revealed.includes(i));
  if (left.length > 1) g.revealed.push(left[rnd(left.length)]);
  else g.revealed.push(-1); // nothing worth revealing; still counts so the clock moves on
}

// ---------------------------------------------------------------- actions

export function applyAction(g, seat, a) {
  if (!a || typeof a !== 'object') return 'Bad move';
  switch (a.type) {
    case 'pick': {
      if (g.phase !== 'pick' || seat !== g.drawer) return "It isn't your turn to pick";
      const i = Number(a.i);
      if (!(i >= 0 && i < g.choices.length)) return 'Pick one of the words';
      beginDrawing(g, i);
      return null;
    }
    case 'guess': {
      if (g.phase !== 'draw') return 'Wait for the drawing to start';
      if (seat === g.drawer) return "You're the one drawing!";
      if (!g.seats[seat]) return 'Sit down first';
      const text = String(a.text || '').replace(/[<>&"]/g, '').trim().slice(0, 40);
      if (!text) return 'Type a guess first';
      const mine = g.guesses[seat] || (g.guesses[seat] = { last: '', tries: 0, correct: false, close: false, pts: 0 });
      if (mine.correct) return 'You already got it';
      mine.tries++;
      mine.last = text;
      const r = check(text, g.word);
      mine.close = r === 'close';
      if (r === 'yes') {
        mine.correct = true;
        g.correct++;
        mine.pts = g.correct === 1 ? 3 : g.correct === 2 ? 2 : 1;
        g.scores[seat] += mine.pts;
        if (g.drawerPts < 3) { g.drawerPts++; g.scores[g.drawer]++; }
        g.announce = { id: ++annId + ':' + now(), seat, text: 'Got it! ✓' };
        if (allIn(g)) endTurn(g, 'all');
      }
      return null;
    }
    case 'undo': {
      if (g.phase !== 'draw' || seat !== g.drawer) return null;
      const i = g.ink.findIndex(s => s.id === a.s);
      if (i >= 0) g.ink.splice(i, 1);
      return null;
    }
    case 'clear':
      if (g.phase === 'draw' && seat === g.drawer) g.ink = [];
      return null;
    case 'giveup':
      if (g.phase === 'pick' && seat === g.drawer) { startTurn(g); return null; }
      if (g.phase !== 'draw' || seat !== g.drawer) return null;
      endTurn(g, 'gaveup');
      return null;
    case 'next':
      if (g.phase === 'reveal') startTurn(g);
      return null;
  }
  return 'Unknown move';
}

// A piece of a stroke from the drawer's phone. These don't go through applyAction, so the
// table can draw them without re-sending everyone's screen several times a second.
// m: { s: stroke id, c: colour, w: size, i: index of the first number in p, p: [x, y, x, y, …], done }
export function addInk(g, seat, m) {
  if (g.phase !== 'draw' || seat !== g.drawer) return false;
  if (typeof m.s !== 'string' || !/^[\w-]{1,20}$/.test(m.s) || !Array.isArray(m.p) || m.p.length > 1200 || m.p.length % 2) return false;
  const c = Number(m.c), w = Number(m.w), at = Number(m.i) || 0;
  if (!(c >= 0 && c < PALETTE.length) || !(w >= 0 && w < SIZES.length) || at < 0 || at % 2) return false;
  const used = g.ink.reduce((n, s) => n + s.p.length, 0);
  if (used + m.p.length > MAX_INK) return false;
  let st = g.ink.find(s => s.id === m.s);
  if (!st) { st = { id: m.s, c, w, p: [] }; g.ink.push(st); }
  const pts = m.p.map((v, k) => Math.round(Math.min(k % 2 ? PAD_H : PAD_W, Math.max(0, Number(v) || 0))));
  if (m.done && at === 0) st.p = pts;
  else for (let k = 0; k < pts.length; k++) st.p[at + k] = pts[k];
  return true;
}

// ---------------------------------------------------------------- what each phone sees

export function blanks(g) {
  if (!g.word) return '';
  const show = new Set(g.revealed);
  return [...g.word].map((ch, i) => (/\p{L}|\d/u.test(ch) ? (show.has(i) ? ch.toUpperCase() : '_') : ch === ' ' ? '  ' : ch)).join(' ').replace(/ {3,}/g, '   ');
}

export function viewFor(g, seat) {
  const me = seat === g.drawer;
  const mine = g.guesses?.[seat] || null;
  const knows = me || mine?.correct || ['reveal', 'over'].includes(g.phase);
  return {
    phase: g.phase,
    turnNo: g.turnNo,
    round: g.round,
    rounds: g.settings.rounds,
    drawer: g.drawer,
    isDrawer: me,
    choices: me && g.phase === 'pick' ? g.choices : null,
    word: knows ? g.word : null,
    level: g.level,
    blanks: g.phase === 'draw' ? blanks(g) : '',
    left: Math.max(0, (g.endsAt || 0) - now()),
    total: g.phase === 'draw' ? g.total : g.phase === 'pick' ? PICK_MS : REVEAL_MS,
    scores: g.scores,
    seats: g.seats,
    my: mine && { last: mine.last, correct: mine.correct, close: mine.close, pts: mine.pts, tries: mine.tries },
    correct: g.correct || 0,
    guessers: guessers(g).length,
    result: g.result,
    winners: g.winners || null,
    // The drawer's phone gets the drawing back, so it survives a reload.
    ink: me && g.phase === 'draw' ? g.ink : null,
  };
}

export const turn = g => (['pick', 'draw'].includes(g.phase) ? g.drawer : -1);
export const botAction = () => ({ type: 'giveup' });
