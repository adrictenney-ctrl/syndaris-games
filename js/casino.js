// Shared bits for the house games (Blackjack and Baccarat): the shoe, money, and chip stacks.
const RANKS = '23456789TJQKA', SUITS = 'SHDC';

export function makeShoe(decks) {
  const d = [];
  for (let k = 0; k < decks; k++) for (const s of SUITS) for (const r of RANKS) d.push(r + s);
  const rnd = new Uint32Array(d.length);
  crypto.getRandomValues(rnd);
  for (let i = d.length - 1; i > 0; i--) { const j = rnd[i] % (i + 1); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

// Casino chip colors by value.
export const DENOMS = [1000, 500, 100, 25, 5, 1];
export const CHIP_CLASS = { 1: 'c1', 5: 'c5', 25: 'c25', 100: 'c100', 500: 'c500', 1000: 'c1000' };

export const money = n => (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });

// A short stack of chips that adds up to (about) the amount, biggest at the bottom.
export function chipStack(amount, max = 7) {
  const chips = [];
  let left = Math.floor(amount);
  for (const d of DENOMS) while (left >= d && chips.length < max) { chips.push(d); left -= d; }
  return `<span class="cstack">${chips.map((d, i) => `<i class="cchip ${CHIP_CLASS[d]}" style="--i:${i}"></i>`).join('')}</span>`;
}

// Starting stacks for players who sit down (or come back) mid-game.
export function syncStacks(g, players) {
  g.seats = players.map(p => (p ? (p.bot ? 'bot' : 'human') : null));
  g.seats.forEach((s, i) => { if (s && g.stacks[i] === undefined) g.stacks[i] = g.settings.startChips; });
}
