// Who won? One answer for every game, used to hand out Dough. Games record their end in many
// ways (a winners list, a winning seat, a winning colour, a team, a race ranking, a loser…), so
// this reads all of them, with a few games named below.
//
//   winnersOf(id, g) → null while the game is still going, or the winning seats once it's over
//                      ([] when nobody won, e.g. a cooperative game that failed).
//   leadersOf(id, g) → for open-ended games with no finish (Scribble Chain, the casino tables):
//                      whoever is ahead when the table goes back to the lobby.

import { totals as yachtTotals } from './yacht.js?v=101';
import { sideOf as hollowSide } from './hollow.js?v=101';
import { side as rebelSide } from './rebel.js?v=101';
import { team as w4fTeam } from './words4fun.js?v=101';

const isSeat = s => Number.isInteger(s) && s >= 0;
const seatsOf = g => (Array.isArray(g.order) ? g.order : (g.seats || []).map((x, i) => (x ? i : -1)).filter(i => i >= 0));
const top = (g, score) => {
  const seats = seatsOf(g).filter(s => Number.isFinite(score(s)));
  if (!seats.length) return [];
  const best = Math.max(...seats.map(score));
  return best > 0 ? seats.filter(s => score(s) === best) : [];
};
// Colour games: seat 0 is White / Ebony, seat 1 Black / Ivory.
const COLOR = { w: 0, d: 0, b: 1, l: 1 };

// Games that need their own reading.
const SPECIAL = {
  chess: g => (g.result ? (g.result.winner in COLOR ? [COLOR[g.result.winner]] : []) : null),
  powerup: g => SPECIAL.chess(g),
  checkers: g => SPECIAL.chess(g),
  backgammon: g => (g.phase === 'matchOver' ? (g.result?.winner in COLOR ? [COLOR[g.result.winner]] : []) : null),
  insidejob: g => (g.phase === 'over' ? (g.result?.ok ? seatsOf(g) : []) : null),
  wrongnumber: g => (g.phase === 'over' ? top(g, s => g.score?.[s]) : null),
  grandprix: g => (g.phase === 'over' && Array.isArray(g.ranking) && isSeat(g.ranking[0]) ? [g.ranking[0]] : g.phase === 'over' ? [] : null),
  redline: g => SPECIAL.grandprix(g),
  oldmaid: g => (g.phase === 'over' ? seatsOf(g).filter(s => s !== g.loser) : null),
  yacht: g => (g.over ? top(g, s => (g.cards?.[s] ? yachtTotals(g.cards[s]).total : 0)) : null),
  warfront: g => (isSeat(g.winner) ? [g.winner] : null),
  // Hidden-role games: everyone on the winning side wins.
  crown: g => (g.phase === 'over' && g.winner ? seatsOf(g).filter(s => (g.roles?.[s] === 'loyal') === (g.winner.team === 'loyal')) : null),
  hollow: g => (g.phase === 'over' && g.winner ? seatsOf(g).filter(s => hollowSide(g, s) === g.winner.team) : null),
  rebelcell: g => (g.phase === 'over' ? (isSeat(g.winner) ? seatsOf(g).filter(s => rebelSide(g, s) === g.winner) : []) : null),
  roundtable: g => SPECIAL.rebelcell(g),
  words4fun: g => (g.phase === 'over' ? (isSeat(g.winner) ? seatsOf(g).filter(s => w4fTeam(s) === g.winner) : []) : null),
  scribble: () => null,              // open-ended: see leadersOf
};

export function winnersOf(id, g) {
  if (!g) return null;
  if (SPECIAL[id]) return SPECIAL[id](g);
  const over = ['over', 'gameOver', 'matchOver'].includes(g.phase) || g.over === true;
  if (!over) return null;
  if (Array.isArray(g.winners)) return g.winners.filter(isSeat);
  if (isSeat(g.champion)) return [g.champion];
  if (g.champion === null && 'champion' in g) return [];                      // a drawn match
  // Team games: the winner is a team number, and every seat on that team wins.
  if (Array.isArray(g.team) && isSeat(g.winner)) return seatsOf(g).filter(s => g.team[s] === g.winner);
  if (Array.isArray(g.teams) && isSeat(g.winner) && g.teams.some(t => isSeat(t))) return seatsOf(g).filter(s => g.teams[s] === g.winner);
  if (isSeat(g.winner)) return [g.winner];
  if (isSeat(g.result?.winner)) return [g.result.winner];
  if (Array.isArray(g.ranking) && isSeat(g.ranking[0])) return [g.ranking[0]];
  // Last resort: the highest score.
  const sc = g.score || g.scores;
  if (Array.isArray(sc) || (sc && typeof sc === 'object')) return top(g, s => sc[s]);
  return [];
}

// Open-ended games (no finish line): whoever leads when the table goes back to the lobby.
const STACK_START = 1000;
export function leadersOf(id, g) {
  if (!g) return [];
  if (id === 'scribble') return top(g, s => g.score?.[s]);
  // Casino tables: most chips, and only if they actually came out ahead.
  if (Array.isArray(g.stacks) || (g.stacks && typeof g.stacks === 'object')) {
    const start = g.settings?.startChips || STACK_START;
    return top(g, s => (Number.isFinite(g.stacks[s]) ? g.stacks[s] - start : 0));
  }
  return [];
}
export const OPEN_ENDED = new Set(['scribble', 'blackjack', 'baccarat']);
