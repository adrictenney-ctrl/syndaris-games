// Chef's Kiss settings from SPEC.md Section 4, in one place. Values marked TODO-AL in the spec
// are product decisions that may change; change them here, not in the game code.
// Wired up so far: handSize, handMix, handRefresh, recipeChoices, dudTarget (the Laugh Engine's hands).
export const CONFIG = {
  minSeats: 3,
  maxSeats: 8,
  targetScoreOptions: [5, 7, 10],
  defaultTargetScore: 7,
  gameTimerOptionsMin: [null, 15, 30, 45],
  handSize: 7,
  handMix: { onTarget: 6, random: 1 },   // approved by Al, 17 Oct 2026
  handRefresh: 'full',
  recipeChoices: 3,
  timers: { recipePickSec: 30, playSec: 60, kissSec: null, resultSec: 6, disconnectGraceSec: 60, joinTimeoutSec: 15 },
  botsCanBeChef: false,
  revealWinnerAfterKiss: true,
  freshness: { halfLifeDays: 180, kissBoost: 0.05, floor: 0.05, retireBelow: null },
  dudTarget: 0.30,
  paidTierEnabled: false,
  spiceItUpEnabled: true,
  spiceItUpSuggestions: 3,
  spiceItUpButtonLabel: 'Salt and Pepper',   // candidate name (TODO-AL)
};

// Level order, used for every comparison (SPEC.md Section 2, renamed 19 Oct 2026): Hot is the high
// school family deck (formerly "Spicy"); Spicy is now the gated college tier and Hellfire Scorpion the
// adult tier. Tables play exactly one of the three family decks (OFFICIAL_LEVELS), never a mix.
export const LEVELS = ['mild', 'medium', 'hot', 'spicy', 'hellfire_scorpion'];
export const OFFICIAL_LEVELS = ['mild', 'medium', 'hot'];
export const LEVEL_LABEL = { mild: 'Mild (elementary)', medium: 'Medium (middle school)', hot: 'Hot (high school)' };
export const LEVEL_NAME = { mild: 'Mild', medium: 'Medium', hot: 'Hot' };
export const rank = level => LEVELS.indexOf(level);

export const TEAMS = [
  { name: 'Red', c: '#e0474c' }, { name: 'Blue', c: '#3d7fe0' },
  { name: 'Green', c: '#33a35b' }, { name: 'Gold', c: '#e2a72e' },
];
