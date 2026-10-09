// Four-Hole Hold'em (Omaha): the Hold'em table with four hole cards; hands must use exactly two
// of them plus three from the board (poker.js handles both).
import holdem from './table-poker.js?v=68';

export default { ...holdem, create: (settings, players) => holdem.create({ ...settings, hole: 4, omaha: true }, players) };
