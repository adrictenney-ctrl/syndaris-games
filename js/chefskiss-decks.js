// Chef's Kiss decks (Al's 18 Nov 2026 spec, Sections 4 and 7). Each family level has a free starter
// deck and a paid Expansion - 1. The expansions wait for payments and subscriptions (a later phase),
// so they aren't in the card database yet and every table plays the free starter.
export const DECKS = {
  deck_mild_base: { level: 'mild', kind: 'base', price: 0, name: 'Mild' },
  deck_mild_exp1: { level: 'mild', kind: 'expansion', price: 1.99, baseDeck: 'deck_mild_base', name: 'Mild Expansion - 1' },
  deck_medium_base: { level: 'medium', kind: 'base', price: 0, name: 'Medium' },
  deck_medium_exp1: { level: 'medium', kind: 'expansion', price: 1.99, baseDeck: 'deck_medium_base', name: 'Medium Expansion - 1' },
  deck_hot_base: { level: 'hot', kind: 'base', price: 0, name: 'Hot' },
  deck_hot_exp1: { level: 'hot', kind: 'expansion', price: 1.99, baseDeck: 'deck_hot_base', name: 'Hot Expansion - 1' },
};

// The decks a table deals from. Only 'base' is playable until purchases exist; 'expansion' and 'mixed'
// are here so the table state and the later purchase flow have a place to plug in.
export const DECK_MODES = ['base', 'expansion', 'mixed'];
export const PLAYABLE_MODES = ['base'];
export function activeDecks(level, mode = 'base') {
  const base = `deck_${level}_base`, exp = `deck_${level}_exp1`;
  const m = PLAYABLE_MODES.includes(mode) ? mode : 'base';
  return m === 'expansion' ? [exp] : m === 'mixed' ? [base, exp] : [base];
}
// A card belongs to the table's decks if any of its deckIds is in the set.
export const inDecks = (card, decks) => !decks || (card?.deckIds || []).some(d => decks.includes(d));
