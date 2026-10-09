// Top Answers: two teams try to guess the most popular answers to a survey question. The team in
// control types guesses on any of their phones; every hit flips that answer on the board, every
// miss is a strike. Three strikes and the other team gets ONE guess to steal all the points on the
// board. Find every answer and you keep them. The last round is worth double.
import { base, teams, deal, same, cleanText, sfx, left, announce } from './party.js?v=67';
import { SURVEYS } from './topanswers-surveys.js?v=67';

export function createGame(settings, players) {
  const g = base(settings, players, { rounds: 5, secs: 30 });
  teams(g);
  g.round = 0;
  startRound(g);
  return g;
}
const mult = g => (g.round === g.settings.rounds ? 2 : 1);
function startRound(g) {
  g.round++;
  g.q = deal(g, 'q', SURVEYS.length);
  g.up = (g.round - 1) % 2;
  g.open = [];
  g.strikes = 0;
  g.guesses = 0;
  g.last = null;
  g.phase = 'play';
  g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}
const answers = g => SURVEYS[g.q][1];
const bank = g => g.open.reduce((t, i) => t + answers(g)[i][1], 0) * mult(g);
export const collecting = () => false;
export const turnSeat = () => -1;
export const current = g => (g.phase === 'play' ? g.members[g.up][g.guesses % g.members[g.up].length] : g.phase === 'steal' ? g.members[1 - g.up][0] : -1);

function award(g, t) {
  g.got = { team: t, pts: bank(g) };
  g.scores[t] += g.got.pts;
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  sfx(g, 'chime');
  g.moveId++;
}
function strike(g, text) {
  g.strikes++;
  g.last = { text, hit: false };
  sfx(g, 'buzzer');
  if (g.strikes >= 3) { g.phase = 'steal'; g.endAt = Date.now() + 30000; }
  else g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}
// Which answer (not yet on the board) does this guess match?
const find = (g, text) => answers(g).findIndex(([a, , ...alt], i) => !g.open.includes(i) && same(text, [a, ...alt]));

export function applyAction(g, seat, a) {
  if (!a || a.type !== 'answer') return 'Not now';
  const text = cleanText((a.vals || [])[0], 40);
  if (!text) return 'Type a guess';
  if (g.phase === 'play') {
    if (g.team[seat] !== g.up) return 'It’s the other team’s turn';
    g.guesses++;
    const i = find(g, text);
    if (i < 0) { announce(g, seat, `“${text}” ✗`); return strike(g, text), null; }
    g.open.push(i);
    g.last = { text, hit: true, i };
    announce(g, seat, `“${text}” ✓`);
    sfx(g, 'ding');
    if (g.open.length === answers(g).length) return award(g, g.up), null;
    g.endAt = Date.now() + g.settings.secs * 1000;
    g.moveId++;
    return null;
  }
  if (g.phase === 'steal') {
    if (g.team[seat] === g.up) return 'The other team is stealing';
    const i = find(g, text);
    g.stealText = text;
    announce(g, seat, `Steal: “${text}” ${i >= 0 ? '✓' : '✗'}`);
    if (i >= 0) { g.open.push(i); g.stole = true; award(g, 1 - g.up); } else { g.stole = false; award(g, g.up); }
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'play') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => strike(g, '(time)') };
  if (g.phase === 'steal') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => { g.stole = false; award(g, g.up); } };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 10000 - Date.now()), run: () => {
    if (g.round >= g.settings.rounds) { g.phase = 'over'; g.winner = g.scores[0] === g.scores[1] ? null : g.scores[0] > g.scores[1] ? 0 : 1; g.moveId++; return; }
    g.stole = null; g.stealText = null;
    startRound(g);
  } };
  return null;
}

export function botAction(g) {
  const A = answers(g), left = A.map((_, i) => i).filter(i => !g.open.includes(i));
  return { type: 'answer', vals: [Math.random() < 0.55 && left.length ? A[left[Math.floor(Math.random() * left.length)]][0] : 'something odd'] };
}

const TEAMS = ['Team Ruby', 'Team Teal'];
export function viewFor(g, seat) {
  const t = g.team[seat], A = answers(g);
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'play' || g.phase === 'steal' ? left(g) : 0, teamName: TEAMS[t], myTeam: t,
    hud: [[TEAMS[t], g.scores[t]], [TEAMS[1 - t], g.scores[1 - t]]] };
  const card = { kicker: `Round ${g.round}${mult(g) > 1 ? ' · double points' : ''}`, big: SURVEYS[g.q][0], small: `${g.open.length}/${A.length} found · ${'✗'.repeat(g.strikes) || 'no strikes'}` };
  if (g.phase === 'play') v.ui = t === g.up
    ? { k: 'fields', key: `p${g.round}:${g.guesses}`, title: 'Your team’s guess', sub: 'Talk it over — anyone on your team can type it', myturn: true, card, fields: [{ ph: 'Top answer is…', max: 40 }], submit: 'Guess!', need: 1, needMsg: 'Type a guess' }
    : { k: 'wait', title: 'The other team is guessing', sub: 'Three strikes and you can steal!', card };
  else if (g.phase === 'steal') v.ui = t !== g.up
    ? { k: 'fields', key: `s${g.round}`, title: 'STEAL! One guess', sub: 'Agree on it — the first one sent counts', myturn: true, buzz: true, card, fields: [{ ph: 'Our guess…', max: 40 }], submit: 'Steal it!', need: 1 }
    : { k: 'wait', title: 'Three strikes…', sub: 'The other team gets one guess to steal', card };
  else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.got.team === t ? `+${g.got.pts} for your team!` : `${TEAMS[g.got.team]} takes ${g.got.pts}`, sub: g.stole ? 'Stolen!' : '', card: { ...card, list: A.map(([a, p]) => `${a} — ${p}`) } };
  else v.ui = { k: 'wait', title: g.winner == null ? 'A tie!' : g.winner === t ? '🏆 Your team wins!' : `${TEAMS[g.winner]} wins`, sub: 'Look at the table to play again' };
  return v;
}
export { SURVEYS, bank };
