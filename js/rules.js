// How to play every game: shown from the "How to play" button on the table's lobby card.
// Each entry: { goal, play: [steps, in order], win, tips?: [] }. Written to match how each game
// actually plays on this table (its engine and lobby settings), in plain words.
import { RULES_A } from './rules-a.js?v=1';
import { RULES_B } from './rules-b.js?v=1';
import { RULES_C } from './rules-c.js?v=1';

export const RULES = { ...RULES_A, ...RULES_B, ...RULES_C };

// Sort It Out scores by position, unlike the other quiz shows.
RULES.sortitout = {
  ...RULES.sortitout,
  win: '25 points for each item in the right place, plus 50 for getting all four. Most points after the last question wins.',
};
