// Spin & Solve: a hidden phrase is on the board. On your turn, spin the wheel and call a
// consonant — every time it appears you win the wedge's value. Land on Bankrupt and you lose
// this round's money; Lose a Turn passes the wheel. Buy a vowel for 250, or solve the puzzle to
// bank your round money. Miss a letter or a solve and the next player spins. Most banked after the
// last round wins.
import { base, deal, norm, cleanText, sfx, left, announce } from './party.js?v=67';
import { PUZZLES } from './spinsolve-puzzles.js?v=67';

export const WHEEL = [2500, 350, 450, 700, 300, 600, 'BANKRUPT', 500, 300, 550, 800, 'LOSE A TURN', 300, 900, 500, 400, 650, 'BANKRUPT', 500, 450, 750, 350, 600, 1000];
export const VOWELS = 'AEIOU', CONS = 'BCDFGHJKLMNPQRSTVWXYZ';
const VOWEL_COST = 250;
const BOT_ORDER = 'RSTLNCDMHGPBFWYKVXZJQ';

export function createGame(settings, players) {
  const g = base(settings, players, { rounds: 3 });
  g.round = 0;
  g.turn = 0;
  startRound(g);
  return g;
}
export const player = g => g.order[g.turn % g.order.length];
function startRound(g) {
  g.round++;
  g.puz = deal(g, 'p', PUZZLES.length);
  g.called = [];
  g.bank = g.seats.map(() => 0);
  g.turn = g.round - 1;
  g.wedge = null;
  toTurn(g);
}
function toTurn(g) { g.phase = 'turn'; g.endAt = Date.now() + 30000; g.moveId++; }
function nextPlayer(g, why) { if (why) announce(g, player(g), why); g.turn++; toTurn(g); }
const answer = g => PUZZLES[g.puz][1];
const count = (g, L) => [...answer(g)].filter(c => c === L).length;
const hidden = g => [...new Set([...answer(g)].filter(c => /[A-Z]/.test(c) && !g.called.includes(c)))];
// Once every consonant in the puzzle is showing, the wheel can't be spun any more.
const consLeft = g => (hidden(g).some(c => CONS.includes(c)) ? [...CONS].filter(c => !g.called.includes(c)) : []);
const vowelsLeft = g => [...VOWELS].filter(c => !g.called.includes(c));
export const turnSeat = g => (g.phase === 'over' || g.phase === 'solved' ? -1 : player(g));
export const collecting = () => false;
export const current = g => (['turn', 'letter', 'vowel', 'solve'].includes(g.phase) ? player(g) : -1);

function solved(g, s) {
  g.solver = s;
  g.won = Math.max(g.bank[s], 0);
  g.score[s] += g.won;
  g.called = [...new Set([...g.called, ...hidden(g)])];
  sfx(g, 'chime');
  announce(g, s, 'Solved it! 🎉');
  g.phase = 'solved';
  g.endAt = 0;
  g.solvedAt = Date.now();
  g.moveId++;
}
function callLetter(g, s, L, value) {
  g.called.push(L);
  const n = count(g, L);
  g.lastCall = { L, n };
  if (!n) { sfx(g, 'buzzer'); return nextPlayer(g, `No ${L}`); }
  sfx(g, 'ding');
  if (value) g.bank[s] += value * n;
  if (!hidden(g).length) return solved(g, s);
  toTurn(g);
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== player(g)) return "It's not your turn";
  if (g.phase === 'turn') {
    if (a.type === 'spin') {
      if (!consLeft(g).length) return 'No consonants left — buy a vowel or solve';
      g.wedgeIdx = Math.floor(Math.random() * WHEEL.length);
      g.wedge = WHEEL[g.wedgeIdx];
      g.spinId = (g.spinId || 0) + 1;
      g.phase = 'spinning';
      g.endAt = 0;
      g.spinAt = Date.now();
      g.moveId++;
      return null;
    }
    if (a.type === 'buy') {
      if (g.bank[seat] < VOWEL_COST) return `A vowel costs ${VOWEL_COST}`;
      if (!vowelsLeft(g).length) return 'No vowels left';
      g.phase = 'vowel'; g.endAt = Date.now() + 20000; g.moveId++;
      return null;
    }
    if (a.type === 'solve') { g.phase = 'solve'; g.endAt = Date.now() + 40000; g.moveId++; return null; }
    return 'Spin, buy a vowel or solve';
  }
  if (g.phase === 'letter' && a.type === 'pick') {
    const L = String(a.v);
    if (!CONS.includes(L) || g.called.includes(L)) return 'Pick a consonant that hasn’t been called';
    callLetter(g, seat, L, g.wedge);
    return null;
  }
  if (g.phase === 'vowel' && a.type === 'pick') {
    const L = String(a.v);
    if (!VOWELS.includes(L) || g.called.includes(L)) return 'Pick a vowel that hasn’t been called';
    g.bank[seat] -= VOWEL_COST;
    callLetter(g, seat, L, 0);
    return null;
  }
  if (g.phase === 'solve' && a.type === 'answer') {
    const t = cleanText((a.vals || [])[0], 80);
    if (!t) return 'Type the answer';
    g.lastSolve = t;
    if (norm(t).replace(/ /g, '') === norm(answer(g)).replace(/ /g, '')) solved(g, seat);
    else { sfx(g, 'buzzer'); nextPlayer(g, `“${t}” — not it`); }
    return null;
  }
  if (a.type === 'back' && (g.phase === 'vowel' || g.phase === 'solve')) { toTurn(g); return null; }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'spinning') return { ms: Math.max(0, g.spinAt + 3200 - Date.now()), run: () => {
    if (g.wedge === 'BANKRUPT') { g.bank[player(g)] = 0; sfx(g, 'sad'); return nextPlayer(g, 'BANKRUPT! 💸'); }
    if (g.wedge === 'LOSE A TURN') { sfx(g, 'sad'); return nextPlayer(g, 'Lose a turn'); }
    g.phase = 'letter'; g.endAt = Date.now() + 20000; g.moveId++;
  } };
  if (['turn', 'letter', 'vowel', 'solve'].includes(g.phase)) return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => nextPlayer(g, 'Out of time') };
  if (g.phase === 'solved') return { ms: Math.max(0, g.solvedAt + 7000 - Date.now()), run: () => {
    if (g.round >= g.settings.rounds) {
      const top = Math.max(...g.order.map(s => g.score[s]));
      g.winners = g.order.filter(s => g.score[s] === top);
      g.winner = g.winners[0];
      g.phase = 'over';
      g.moveId++;
      return;
    }
    startRound(g);
  } };
  return null;
}

export function botAction(g, seat) {
  const shown = 1 - hidden(g).reduce((t, c) => t + count(g, c), 0) / answer(g).replace(/[^A-Z]/g, '').length;
  if (g.phase === 'turn') {
    if (shown > 0.6 && Math.random() < shown) return { type: 'solve' };
    if (g.bank[seat] >= VOWEL_COST && vowelsLeft(g).length && Math.random() < 0.3) return { type: 'buy' };
    return consLeft(g).length ? { type: 'spin' } : vowelsLeft(g).length && g.bank[seat] >= VOWEL_COST ? { type: 'buy' } : { type: 'solve' };
  }
  if (g.phase === 'letter') return { type: 'pick', v: [...BOT_ORDER].find(c => !g.called.includes(c)) };
  if (g.phase === 'vowel') return { type: 'pick', v: [...'EAOIU'].find(c => !g.called.includes(c)) };
  if (g.phase === 'solve') return { type: 'answer', vals: [Math.random() < 0.85 ? answer(g) : 'NO IDEA'] };
  return null;
}

// The board as the players see it: letters not yet called are blanks.
export const masked = g => [...answer(g)].map(c => (/[A-Z]/.test(c) && !g.called.includes(c) ? '_' : c)).join('');

export function viewFor(g, seat) {
  const P = player(g), mine = P === seat && current(g) === seat;
  const v = { phase: g.phase, moveId: g.moveId, left: mine ? left(g) : 0, hud: [['This round', g.bank[seat] ?? 0], ['Banked', g.score[seat] ?? 0]] };
  const card = { kicker: PUZZLES[g.puz][0], big: masked(g).replace(/_/g, '•'), cls: 'ss-card' };
  if (!mine) {
    const txt = { turn: 'is deciding', spinning: 'is spinning…', letter: 'is calling a letter', vowel: 'is buying a vowel', solve: 'is solving…' }[g.phase];
    if (g.phase === 'solved') v.ui = { k: 'wait', title: g.solver === seat ? `Solved! +${g.won}` : 'Solved!', sub: answer(g), card: { kicker: PUZZLES[g.puz][0], big: answer(g), cls: 'ss-card' } };
    else if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
    else v.ui = { k: 'wait', title: `Someone ${txt}`, sub: 'Watch the table — you’re up soon', card };
    return v;
  }
  if (g.phase === 'turn') v.ui = { k: 'buttons', key: 'm' + g.moveId, title: 'Your turn!', sub: `You have ${g.bank[seat]} this round`, myturn: true, buzz: true, card, stack: true,
    buttons: [{ type: 'spin', label: 'Spin the wheel', icon: '🎡', go: true, dis: !consLeft(g).length }, { type: 'buy', label: `Buy a vowel (${VOWEL_COST})`, icon: '🅰', dis: g.bank[seat] < VOWEL_COST || !vowelsLeft(g).length }, { type: 'solve', label: 'Solve the puzzle', icon: '💡' }] };
  else if (g.phase === 'letter') v.ui = { k: 'pick', key: 'l' + g.spinId, title: `${g.wedge} a letter!`, sub: 'Call a consonant', myturn: true, card, grid: 7,
    options: [...CONS].map(c => ({ v: c, label: c, dis: g.called.includes(c), cls: 'ss-key' })) };
  else if (g.phase === 'vowel') v.ui = { k: 'pick', key: 'v' + g.moveId, title: 'Buy a vowel', sub: `${VOWEL_COST} from your round money`, myturn: true, card, grid: 5,
    options: [...VOWELS].map(c => ({ v: c, label: c, dis: g.called.includes(c), cls: 'ss-key' })), buttons: [{ type: 'back', label: '‹ Back' }] };
  else if (g.phase === 'solve') v.ui = { k: 'fields', key: 's' + g.moveId, title: 'Solve it!', sub: 'Type the whole answer', myturn: true, card, fields: [{ ph: 'The answer is…', max: 80 }], submit: 'Solve', need: 1 };
  else v.ui = { k: 'wait', title: 'Spinning…', sub: 'Watch the wheel', card };
  return v;
}
export { PUZZLES, answer };
