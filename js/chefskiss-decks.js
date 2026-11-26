// Chef's Kiss decks (Al's 18 Nov 2026 spec, Sections 4 and 7). Each family level has a free starter
// deck and an Expansion - 1, bought separately for 499 Dough each (on the player's account).
export const EXPANSION_PRICE = 499;   // Dough
export const DECKS = {
  deck_mild_base: { level: 'mild', kind: 'base', price: 0, name: 'Mild' },
  deck_mild_exp1: { level: 'mild', kind: 'expansion', dough: EXPANSION_PRICE, baseDeck: 'deck_mild_base', name: 'Mild Expansion - 1' },
  deck_medium_base: { level: 'medium', kind: 'base', price: 0, name: 'Medium' },
  deck_medium_exp1: { level: 'medium', kind: 'expansion', dough: EXPANSION_PRICE, baseDeck: 'deck_medium_base', name: 'Medium Expansion - 1' },
  deck_hot_base: { level: 'hot', kind: 'base', price: 0, name: 'Hot' },
  deck_hot_exp1: { level: 'hot', kind: 'expansion', dough: EXPANSION_PRICE, baseDeck: 'deck_hot_base', name: 'Hot Expansion - 1' },
};
// Al's decade decks, the Classic Cookbooks (21 Nov 2026; first called Time Capsules, which the ids
// still say: owned decks are saved under them): one decade each, 500 cards with heat set per card (most
// Medium). Each is bought separately for 499 Bread.
export const CAPSULE_PRICE = 499;   // Bread
export const DECADES = ['2010s', '2000s', '1990s', '1980s', '1970s', '1960s', '1950s'];
for (const d of DECADES) DECKS[`deck_timecapsule_${d}`] = { level: 'mixed', kind: 'expansion', bread: CAPSULE_PRICE, decade: d, name: `Classic Cookbook: ${d}` };
export const CAPSULES = DECADES.map(d => `deck_timecapsule_${d}`);
export const EXPANSIONS = Object.keys(DECKS).filter(id => DECKS[id].kind === 'expansion');
export const expansionOf = level => `deck_${level}_exp1`;

// Which of the level's decks a table deals from (Section 7): the free starter, the Expansion - 1
// alone, or both. 'expansion' and 'mixed' need that level's Expansion - 1 unlocked.
export const DECK_MODES = ['base', 'expansion', 'mixed'];
export const MODE_LABEL = { base: 'Starter deck', expansion: 'Expansion - 1 only', mixed: 'Starter + Expansion - 1' };
// The mode a table really plays: a locked expansion falls back to the starter.
export const playableMode = (level, mode, unlocked = []) =>
  DECK_MODES.includes(mode) && (mode === 'base' || unlocked.includes(expansionOf(level))) ? mode : 'base';
export function activeDecks(level, mode = 'base') {
  const base = `deck_${level}_base`, exp = expansionOf(level);
  const m = DECK_MODES.includes(mode) ? mode : 'base';
  return m === 'expansion' ? [exp] : m === 'mixed' ? [base, exp] : [base];
}
// A card belongs to the table's decks if any of its deckIds is in the set.
export const inDecks = (card, decks) => !decks || (card?.deckIds || []).some(d => decks.includes(d));
// A Classic Cookbook at a table (setting `capsule`): 'off' or one decade on its own ("a 1990s night"), picked like any deck
// on the deck chooser (25 Nov 2026). At every level: Mild and Hot have 20 Recipes and 80 Ingredients
// per decade (Medium 60 and 240), so a long game there sees cards come round again. ('mix', every
// owned decade mixed in, is no longer offered; a table saved with it plays without them.)
export const CAPSULE_ALONE_LEVELS = ['mild', 'medium', 'hot'];
export function tableDecks(level, mode, capsule, owned = []) {
  const caps = CAPSULES.filter(id => owned.includes(id));
  if (CAPSULES.includes(capsule) && caps.includes(capsule) && CAPSULE_ALONE_LEVELS.includes(level)) return [capsule];
  return activeDecks(level, playableMode(level, mode, owned));
}
// The deck the chooser shows as picked: an owned decade, else the level's playable mode.
export const deckChoice = (level, mode, capsule, owned = []) =>
  CAPSULES.includes(capsule) && owned.includes(capsule) ? capsule : playableMode(level, mode, owned);
// Clean a list of deck ids sent by a phone (only known expansions).
export const cleanOwned = list => (Array.isArray(list) ? list : []).filter(d => EXPANSIONS.includes(d)).slice(0, EXPANSIONS.length);
