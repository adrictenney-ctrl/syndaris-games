// Code Breaker: one player secretly sets a code of four coloured pegs; the other has ten tries to
// guess it. After each guess the code-maker's answer is automatic: a gold key peg for every peg
// that's the right colour in the right place, a silver one for a right colour in the wrong place.
// Then swap. The code-maker scores one point per guess the breaker needed (+1 if never broken);
// more points after both rounds wins the game. Colours can repeat.
import { createSeries, gameOver, nextGame, announce } from './duel.js?v=65';

export const COLORS = ['#d8443a', '#e8a33a', '#e6d84a', '#4aa85a', '#3a7ad8', '#9a5ad0', '#f0f0e8', '#2a2a2a'];
export const NAMES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white', 'black'];
export const PEGS = 4;

export const fresh = g => { g.round = 0; g.points = [0, 0]; startRound(g); };
function startRound(g) {
  g.maker = (g.gameNo + g.round) % 2;
  g.code = null;
  g.guesses = [];
  g.stage = 'set';
  g.p = g.maker;
  g.moveId++;
}

export function createGame(settings) {
  const g = createSeries({ colors: 6, tries: 10, ...settings });
  fresh(g);
  return g;
}

export function mark(code, guess) {
  let black = 0, white = 0;
  const c = [], q = [];
  for (let i = 0; i < PEGS; i++) { if (code[i] === guess[i]) black++; else { c.push(code[i]); q.push(guess[i]); } }
  for (const x of q) { const k = c.indexOf(x); if (k >= 0) { white++; c.splice(k, 1); } }
  return { black, white };
}
const valid = (g, pegs) => Array.isArray(pegs) && pegs.length === PEGS && pegs.every(x => Number.isInteger(x) && x >= 0 && x < g.settings.colors);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Wait for the next game';
  if (a.type === 'resign') { announce(g, seat, 'Resigns'); gameOver(g, 1 - seat, 'resign'); return null; }
  if (seat !== g.p) return "It isn't your turn";
  if (g.stage === 'set') {
    if (a.type !== 'set' || !valid(g, a.pegs)) return 'Choose four pegs for your secret code';
    g.code = a.pegs.slice();
    g.stage = 'guess';
    g.p = 1 - g.maker;
    announce(g, seat, 'Code set 🔒');
    g.moveId++;
    return null;
  }
  if (g.stage === 'guess') {
    if (a.type !== 'guess' || !valid(g, a.pegs)) return 'Choose four pegs to guess';
    const m = mark(g.code, a.pegs);
    g.guesses.push({ pegs: a.pegs.slice(), ...m });
    g.moveId++;
    const broke = m.black === PEGS;
    if (broke || g.guesses.length >= g.settings.tries) {
      g.points[g.maker] += g.guesses.length + (broke ? 0 : 1);
      announce(g, seat, broke ? `Cracked it in ${g.guesses.length}! 🔓` : 'Out of tries');
      g.stage = 'reveal';
      g.revealAt = Date.now();
      g.p = -1;
    }
    return null;
  }
  return "That move isn't allowed";
}

// Between rounds: show the code for a moment, then swap or finish the game.
export function tick(g) {
  if (g.phase === 'play' && g.stage === 'reveal') {
    return { ms: Math.max(0, g.revealAt + 4500 - Date.now()), run: () => {
      if (g.round === 0) { g.round = 1; startRound(g); return; }
      const [a, b] = g.points;
      gameOver(g, a === b ? null : a > b ? 0 : 1, 'points');
    } };
  }
  return null;
}

// Computer: a random code; as breaker, a random guess consistent with every answer so far.
export function botAction(g, seat) {
  const C = g.settings.colors;
  const rnd = () => Array.from({ length: PEGS }, () => Math.floor(Math.random() * C));
  if (g.stage === 'set') return { type: 'set', pegs: rnd() };
  const all = [];
  for (let n = 0; n < C ** PEGS; n++) { let x = n; const p = []; for (let i = 0; i < PEGS; i++) { p.push(x % C); x = Math.floor(x / C); } all.push(p); }
  const ok = all.filter(p => g.guesses.every(q => { const m = mark(p, q.pegs); return m.black === q.black && m.white === q.white; }));
  if (g.settings.level === 'easy' && Math.random() < 0.3) return { type: 'guess', pegs: rnd() };
  return { type: 'guess', pegs: ok[Math.floor(Math.random() * ok.length)] || rnd() };
}

export const viewFor = (g, seat) => ({
  phase: g.phase, stage: g.stage, p: g.p, maker: g.maker, round: g.round, guesses: g.guesses, points: g.points, colors: g.settings.colors, tries: g.settings.tries,
  code: g.stage === 'reveal' || g.phase !== 'play' || seat === g.maker ? g.code : null, wins: g.wins, draws: g.draws, result: g.result, bestOf: g.settings.bestOf, gameNo: g.gameNo, champion: g.champion ?? null,
});
export { nextGame };
