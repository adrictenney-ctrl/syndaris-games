// Don't Say It: two teams (seats alternate around the table). On your team's turn one player
// gives clues to get their teammates to say the word on the card — without saying any of the
// five forbidden words (or any part of them). Tap Got it for a point, or Skip. The other team
// sees the forbidden words too and can hit Buzz! if you slip: that card goes to them. When the
// timer runs out, the other team goes. Everyone takes turns as clue-giver; most points wins.
import { CARDS } from './dontsay-cards.js?v=68';

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { secs: 60, rounds: 2, skipCost: 0, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.team = g.seats.map(() => null);
  g.order.forEach((s, i) => { g.team[s] = i % 2; });
  g.members = [0, 1].map(t => g.order.filter(s => g.team[s] === t));
  g.deck = shuffle(CARDS.map((_, i) => i));
  g.scores = [0, 0];
  g.up = 0;
  g.next = [0, 0];           // whose turn to give clues, per team
  g.turnNo = 0;
  g.total = Math.max(g.members[0].length, g.members[1].length) * 2 * g.settings.rounds;
  startTurn(g);
  return g;
}
export const giver = g => g.members[g.up][g.next[g.up] % g.members[g.up].length];
function startTurn(g) {
  g.phase = 'ready';
  g.card = null;
  g.log = [];
  g.moveId++;
}
const draw = g => { if (!g.deck.length) g.deck = shuffle(CARDS.map((_, i) => i)); return g.deck.pop(); };

export const current = g => (g.phase === 'ready' ? giver(g) : -1);
export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  const G = giver(g);
  if (a.type === 'start') {
    if (g.phase !== 'ready' || seat !== G) return 'Only the clue-giver starts';
    g.phase = 'clue';
    g.endAt = Date.now() + g.settings.secs * 1000;
    g.card = draw(g);
    g.moveId++;
    return null;
  }
  if (g.phase !== 'clue') return 'Not now';
  if (a.type === 'got' || a.type === 'skip') {
    if (seat !== G) return 'Only the clue-giver can do that';
    if (a.type === 'got') { g.scores[g.up]++; g.log.push({ c: g.card, r: 'got' }); }
    else { g.scores[g.up] -= g.settings.skipCost; g.log.push({ c: g.card, r: 'skip' }); }
    g.card = draw(g);
    g.moveId++;
    return null;
  }
  if (a.type === 'buzz') {
    if (g.team[seat] === g.up) return 'Only the other team can buzz';
    g.scores[1 - g.up]++;
    g.log.push({ c: g.card, r: 'buzz' });
    announce(g, seat, 'BUZZ! 🚨');
    g.card = draw(g);
    g.moveId++;
    return null;
  }
  return "That move isn't allowed";
}
function endTurn(g) {
  g.phase = 'end';
  g.endShownAt = Date.now();
  g.moveId++;
}
export function tick(g) {
  if (g.phase === 'clue') return { ms: Math.max(0, g.endAt - Date.now()), run: () => endTurn(g) };
  if (g.phase === 'end') return { ms: Math.max(0, g.endShownAt + 7000 - Date.now()), run: () => {
    g.next[g.up]++;
    g.turnNo++;
    if (g.turnNo >= g.total) { g.phase = 'over'; g.winner = g.scores[0] === g.scores[1] ? null : g.scores[0] > g.scores[1] ? 0 : 1; g.moveId++; return; }
    g.up = 1 - g.up;
    startTurn(g);
  } };
  return null;
}
export const botAction = () => null;
export function viewFor(g, seat) {
  const G = giver(g);
  const see = g.phase === 'clue' && (seat === G || g.team[seat] !== g.up);
  return {
    phase: g.phase, up: g.up, giver: G, team: g.team, members: g.members, scores: g.scores, card: see && g.card != null ? CARDS[g.card] : null,
    left: g.endAt ? g.endAt - Date.now() : 0, log: g.phase === 'end' || g.phase === 'over' ? g.log.map(x => ({ word: CARDS[x.c].word, r: x.r })) : g.log.length,
    turnNo: g.turnNo, total: g.total, winner: g.winner ?? null, moveId: g.moveId,
  };
}
