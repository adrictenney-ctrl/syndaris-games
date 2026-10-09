// War: two players split the deck face down. Both flip their top card; the higher card takes
// both (aces high). A tie is a war: each lays three cards face down and flips a fourth, and the
// winner takes the whole pile. Play until one player has every card, or the length chosen in
// the lobby (most cards after so many battles).
import { fullDeck, shuffle, rankOf, RANKS } from './tricks.js?v=65';

export function createGame(settings) {
  const deck = shuffle(fullDeck());
  const g = { settings: { length: 0, auto: false, ...settings }, piles: [deck.slice(0, 26), deck.slice(26)], annId: 0, moveId: 0, battles: 0 };
  newBattle(g);
  return g;
}

function newBattle(g) {
  g.up = [[], []];        // face-up cards this battle (one per flip)
  g.down = [[], []];      // face-down war cards
  g.flipped = [false, false];
  g.wars = 0;
  g.phase = 'flip';
  g.result = null;
  g.moveId++;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const r = c => RANKS.indexOf(rankOf(c));
export const current = () => -1;

function endGame(g, winner) {
  g.phase = 'over';
  g.winner = winner;
}

export function applyAction(g, seat, a) {
  if (!a || a.type !== 'flip') return "That move isn't allowed";
  if (g.phase !== 'flip') return 'Wait a moment';
  if (g.flipped[seat]) return 'Waiting for the other player';
  if (!g.piles[seat].length) return 'You have no cards';
  g.up[seat].push(g.piles[seat].shift());
  g.flipped[seat] = true;
  g.moveId++;
  if (g.flipped.every(Boolean)) resolve(g);
  return null;
}

function resolve(g) {
  const a = g.up[0].at(-1), b = g.up[1].at(-1);
  if (r(a) !== r(b)) {
    const w = r(a) > r(b) ? 0 : 1;
    const won = shuffle([...g.up[0], ...g.up[1], ...g.down[0], ...g.down[1]]);
    g.piles[w].push(...won);
    g.result = { winner: w, n: won.length, war: g.wars };
    if (g.wars) announce(g, w, `Won the war! +${won.length}`);
    g.battles++;
    g.phase = 'reveal';
    g.revealAt = Date.now();
    return;
  }
  // War! Three face down each (keeping one to flip), then flip again.
  g.wars++;
  announce(g, 0, 'WAR!');
  for (const s of [0, 1]) {
    const k = Math.min(3, Math.max(0, g.piles[s].length - 1));
    g.down[s].push(...g.piles[s].splice(0, k));
  }
  if (!g.piles[0].length || !g.piles[1].length) {
    // Someone can't fight the war: the other takes everything.
    const w = g.piles[0].length ? 0 : 1;
    g.piles[w].push(...g.up[0], ...g.up[1], ...g.down[0], ...g.down[1]);
    g.up = [[], []]; g.down = [[], []];
    return endGame(g, w);
  }
  g.flipped = [false, false];
  g.phase = 'flip';
}

export function tick(g, players) {
  if (g.phase === 'reveal') {
    return {
      ms: Math.max(0, g.revealAt + (g.result.war ? 2600 : 1400) - Date.now()),
      run: () => {
        if (!g.piles[0].length || !g.piles[1].length) return endGame(g, g.piles[0].length ? 0 : 1);
        if (g.settings.length && g.battles >= g.settings.length) {
          const [a, b] = g.piles.map(p => p.length);
          return endGame(g, a === b ? null : a > b ? 0 : 1);
        }
        newBattle(g);
      },
    };
  }
  if (g.phase === 'flip') {
    const s = [0, 1].find(x => !g.flipped[x] && (players?.[x]?.bot || g.settings.auto));
    if (s != null) return { ms: g.settings.auto && !players?.[s]?.bot ? 500 : 700, run: () => applyAction(g, s, { type: 'flip' }) };
  }
  return null;
}

export const botAction = () => ({ type: 'flip' });

export function viewFor(g, seat) {
  return {
    phase: g.phase, counts: g.piles.map(p => p.length), up: g.up, downCount: g.down.map(d => d.length), flipped: g.flipped,
    wars: g.wars, result: g.result, winner: g.winner ?? null, battles: g.battles, length: g.settings.length, moveId: g.moveId,
  };
}

export const check = g => (g.piles[0].length + g.piles[1].length + g.up.flat().length + g.down.flat().length !== 52 ? 'count' : null);
