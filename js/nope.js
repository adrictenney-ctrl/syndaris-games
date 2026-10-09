// Nope!: cards from 3 to 35 are bad — each one counts its number against you. One card sits in the
// middle of the table. On your turn either take it (with any chips piled on it) or say "Nope!" and
// put one of your chips on it to pass it along. You can't say Nope with no chips. Runs of numbers
// only count their lowest card, and every chip you keep takes a point off. Lowest score wins.
// Your chips are secret — only your phone knows how many you have.
import { base, shuffle, sfx, announce } from './party.js?v=68';

export function createGame(settings, players) {
  const g = base(settings, players, {});
  const n = g.order.length;
  g.deck = shuffle([...Array(33).keys()].map(i => i + 3)).slice(9);   // nine cards are left out, unseen
  g.chips = g.seats.map(x => (x ? (n <= 5 ? 11 : n === 6 ? 9 : 7) : 0));
  g.taken = g.seats.map(() => []);
  g.card = g.deck.pop();
  g.pot = 0;
  g.turn = g.order[0];
  g.phase = 'play';
  return g;
}
// Score: lowest card of each run, minus chips.
export const tally = (g, s) => {
  const t = [...g.taken[s]].sort((a, b) => a - b);
  return t.reduce((sum, v, i) => sum + (i && t[i - 1] === v - 1 ? 0 : v), 0) - g.chips[s];
};
export const runs = list => { const t = [...list].sort((a, b) => a - b), out = []; for (const v of t) { const r = out[out.length - 1]; if (r && r[r.length - 1] === v - 1) r.push(v); else out.push([v]); } return out; };
export const pending = g => (g.phase === 'play' ? [g.turn] : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => (g.phase === 'play' ? g.turn : -1);
export const collecting = () => false;

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  if (a.type === 'nope') {
    if (g.chips[seat] < 1) return 'No chips left — you have to take it';
    g.chips[seat]--; g.pot++;
    announce(g, seat, 'Nope! 🙅');
    g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
    g.moveId++;
    return null;
  }
  if (a.type === 'take') {
    g.taken[seat].push(g.card);
    g.chips[seat] += g.pot;
    announce(g, seat, `Took ${g.card}${g.pot ? ` + ${g.pot} chip${g.pot > 1 ? 's' : ''}` : ''}`);
    sfx(g, 'thud');
    g.pot = 0;
    g.last = seat;
    if (!g.deck.length) {
      g.card = null;
      g.order.forEach(s => { g.score[s] = tally(g, s); });
      const low = Math.min(...g.order.map(s => g.score[s]));
      g.winners = g.order.filter(s => g.score[s] === low);
      g.winner = g.winners[0];
      g.phase = 'over';
    } else g.card = g.deck.pop();   // whoever takes a card goes again
    g.moveId++;
    return null;
  }
  return 'Take it or say Nope';
}
export const tick = () => null;

export function botAction(g, seat) {
  if (g.chips[seat] < 1) return { type: 'take' };
  const fits = g.taken[seat].some(v => Math.abs(v - g.card) === 1);
  const cost = (fits ? 0 : g.card) - g.pot;
  return cost <= 8 + Math.random() * 6 || (fits && g.pot >= 1) ? { type: 'take' } : { type: 'nope' };
}

export function viewFor(g, seat) {
  const mine = g.turn === seat && g.phase === 'play';
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Your chips', `🪙 ${g.chips[seat] ?? 0}`], ['Score now', g.taken[seat] ? tally(g, seat) : 0]] };
  const runsHTML = `<div class="np-runs">${runs(g.taken[seat] || []).map(r => `<span>${r.map((v, i) => `<i class="${i ? 'dim' : ''}">${v}</i>`).join('')}</span>`).join('') || '<em>No cards yet — good!</em>'}</div>`;
  const card = g.card != null ? { kicker: g.pot ? `with ${g.pot} chip${g.pot > 1 ? 's' : ''} on it` : 'no chips on it', big: String(g.card), cls: 'np-card' } : null;
  if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Lowest score — you win!' : 'Game over', sub: `Your score: ${g.score[seat]}`, html: runsHTML };
  else if (mine) v.ui = { k: 'buttons', key: 't' + g.moveId, title: 'Take it… or Nope?', sub: `${g.deck.length} cards left in the deck`, myturn: true, buzz: true, card, html: runsHTML,
    buttons: [{ type: 'take', label: `Take ${g.card}${g.pot ? ` (+${g.pot})` : ''}`, icon: '✋' }, { type: 'nope', label: 'Nope! (−1 chip)', icon: '🙅', go: true, dis: g.chips[seat] < 1 }] };
  else v.ui = { k: 'wait', title: `@${g.turn}@ is deciding`, sub: 'Your cards:', card, html: runsHTML };
  return v;
}
