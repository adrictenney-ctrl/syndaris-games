// Shared rules plumbing for the trick-taking games (Hearts, Spades, Bridge, Pinochle):
// decks, sorting, following suit, and who wins a trick.

export const SUITS = 'SHDC';
export const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const RANKS = '23456789TJQKA';
export const rankOf = c => c[0];
export const suitOf = c => c[1];
export const isRed = s => s === 'H' || s === 'D';
export const cardName = c => `${{ T: '10', J: 'J', Q: 'Q', K: 'K', A: 'A' }[c[0]] || c[0]}${SUIT_SYMBOL[c[1]]}`;

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const fullDeck = (ranks = RANKS) => [...ranks].flatMap(r => [...SUITS].map(s => r + s));

// Sort for a hand: suits alternate colour (trump first if given), high to low inside a suit.
export function sortCards(hand, trump = null, ranks = RANKS) {
  const order = trump ? [trump, ...'SHCD'.replace(trump, '')] : [...'SHCD'];
  return hand.slice().sort((a, b) => order.indexOf(suitOf(a)) - order.indexOf(suitOf(b)) || ranks.indexOf(rankOf(b)) - ranks.indexOf(rankOf(a)));
}

// Cards in `hand` that may be played to `trick` (an array of { seat, card }).
export function followable(hand, trick) {
  if (!trick.length) return hand.slice();
  const led = suitOf(trick[0].card);
  const same = hand.filter(c => suitOf(c) === led);
  return same.length ? same : hand.slice();
}

// Index (in trick) of the winning card. Highest trump, else highest of the suit led.
// Ties (double decks) go to the card played first.
export function trickWinner(trick, trump = null, ranks = RANKS) {
  let best = 0;
  for (let i = 1; i < trick.length; i++) {
    const a = trick[best].card, b = trick[i].card;
    const ta = suitOf(a) === trump, tb = suitOf(b) === trump;
    if (tb && !ta) best = i;
    else if (tb === ta && suitOf(b) === suitOf(a) && ranks.indexOf(rankOf(b)) > ranks.indexOf(rankOf(a))) best = i;
  }
  return best;
}

export const announce = (g, seat, text) => { g.announce = { id: (g.annId = (g.annId || 0) + 1), seat, text }; };
