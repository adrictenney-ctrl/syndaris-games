// Nest Egg: collect matching pairs of valuables and stack them into your nest egg — then
// try to steal the top of everyone else's. Runs only on the table (host).
//
// Your turn, one of:
//   • Make a set: two matching cards from your hand, or one card that matches the top of the
//     discard pile (you take that card). Sets go on top of your stack.
//   • Challenge: play a card matching another player's TOP set (or a Bullion/Ingot wild). They
//     answer with a match or let it go; you go back and forth until someone can't or won't.
//     The winner takes the set plus every card played. A player's first set is the base of the
//     stack and can't be challenged.
//   • Discard a card.
// Then fill your hand back up to four. When the deck and every hand are empty, the richest
// stack wins.

export const ASSETS = {
  piggy: { name: 'Piggy Bank', v: 5, n: 8, ic: '🐷' },
  comics: { name: 'Comic Hoard', v: 5, n: 8, ic: '📚' },
  clock: { name: 'Grand Clock', v: 10, n: 8, ic: '🕰️' },
  wine: { name: 'Wine Cellar', v: 10, n: 8, ic: '🍷' },
  ring: { name: 'Diamond Ring', v: 15, n: 8, ic: '💍' },
  art: { name: 'Old Master', v: 15, n: 8, ic: '🖼️' },
  boat: { name: 'Sailboat', v: 20, n: 8, ic: '⛵' },
  car: { name: 'Roadster', v: 20, n: 8, ic: '🏎️' },
  horse: { name: 'Racehorse', v: 25, n: 6, ic: '🐎' },
  villa: { name: 'Seaside Villa', v: 25, n: 6, ic: '🏡' },
  bullion: { name: 'Gold Bullion', v: 50, n: 4, ic: '', wild: true },
  ingot: { name: 'Silver Ingot', v: 25, n: 8, ic: '', wild: true },
};
export const HAND = 4;
export const typeOf = c => c.split('.')[0];
export const isWild = c => !!ASSETS[typeOf(c)].wild;
export const valueOf = c => ASSETS[typeOf(c)].v;
export const setValue = set => set.cards.reduce((a, c) => a + valueOf(c), 0);
export const total = stack => stack.reduce((a, s) => a + setValue(s), 0);
export const money = v => `$${v}k`;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = {
    settings: { ...settings },
    seats: players.map(p => !!p), annId: 0, moveId: 0, log: [],
  };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.deck = shuffle(Object.entries(ASSETS).flatMap(([t, a]) => Array.from({ length: a.n }, (_, i) => `${t}.${i}`)));
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.deck.splice(0, HAND);
  g.stacks = g.seats.map(() => []);
  g.discard = [g.deck.pop()];
  g.turn = g.order[Math.floor(Math.random() * g.order.length)];
  g.phase = 'play';
  g.challenge = null;
  g.winners = [];
  return g;
}

const nextSeat = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const log = (g, seat, text) => { g.log.push({ seat, text }); if (g.log.length > 30) g.log.shift(); };
export const top = g => g.discard[g.discard.length - 1] || null;
export const topSet = (g, s) => g.stacks[s][g.stacks[s].length - 1] || null;
// Can this player's top set be challenged? (The first set is the protected base.)
export const exposed = (g, s) => g.stacks[s].length >= 2;
const matches = (card, type) => typeOf(card) === type || isWild(card);
// Two cards make a set if they're the same valuable, or one valuable plus a wild.
export function pairType(a, b) {
  if (!a || !b || a === b) return null;
  const wa = isWild(a), wb = isWild(b);
  if (wa && wb) return null;
  if (wa) return typeOf(b);
  if (wb) return typeOf(a);
  return typeOf(a) === typeOf(b) ? typeOf(a) : null;
}
// The player to move: the turn player, or whoever has to answer a challenge.
export const current = g => (g.phase === 'over' ? -1 : g.challenge ? g.challenge.toMove : g.turn);

function refill(g, s) {
  while (g.hands[s].length < HAND && g.deck.length) g.hands[s].push(g.deck.pop());
}

function endTurn(g) {
  refill(g, g.turn);
  g.moveId++;
  if (!g.deck.length && g.order.every(s => !g.hands[s].length)) return finish(g);
  // Skip anyone left with nothing to play.
  let s = nextSeat(g, g.turn);
  for (let i = 0; i < g.order.length && !g.hands[s].length; i++) s = nextSeat(g, s);
  g.turn = s;
}

function finish(g) {
  g.phase = 'over';
  g.challenge = null;
  const best = Math.max(...g.order.map(s => total(g.stacks[s])));
  g.winners = g.order.filter(s => total(g.stacks[s]) === best);
}

const take = (g, s, c) => { const h = g.hands[s], i = h.indexOf(c); if (i < 0) return false; h.splice(i, 1); return true; };

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  const hand = g.hands[seat];

  if (g.challenge) {
    const ch = g.challenge;
    if (seat !== ch.toMove) return `Waiting for ${seat === ch.attacker || seat === ch.defender ? 'the other player' : 'the challenge to finish'}`;
    if (a.type === 'fold') {
      resolve(g, seat === ch.attacker ? ch.defender : ch.attacker);
      return null;
    }
    if (a.type !== 'answer') return 'Answer the challenge or let it go';
    if (!hand.includes(a.card)) return "That card isn't in your hand";
    if (!matches(a.card, ch.type)) return `You need a ${ASSETS[ch.type].name} or a wild`;
    take(g, seat, a.card);
    ch.played.push({ seat, card: a.card });
    ch.toMove = seat === ch.attacker ? ch.defender : ch.attacker;
    g.moveId++;
    announce(g, seat, isWild(a.card) ? `${ASSETS[typeOf(a.card)].name}!` : 'Matched!');
    // Out of cards to answer with: the other side wins straight away.
    if (!g.hands[ch.toMove].some(c => matches(c, ch.type))) resolve(g, seat);
    return null;
  }

  if (seat !== g.turn) return "It isn't your turn";
  if (a.type === 'pair') {
    const [x, y] = a.cards || [];
    if (!hand.includes(x) || !hand.includes(y)) return "Those cards aren't in your hand";
    const t = pairType(x, y);
    if (!t) return 'Those two cards don\'t make a set';
    take(g, seat, x); take(g, seat, y);
    g.stacks[seat].push({ type: t, cards: [x, y] });
    announce(g, seat, `${ASSETS[t].name} set · ${money(valueOf(x) + valueOf(y))}`);
    log(g, seat, `banked a ${ASSETS[t].name} set`);
    endTurn(g);
    return null;
  }
  if (a.type === 'take') {
    const d = top(g);
    if (!d) return 'The discard pile is empty';
    if (!hand.includes(a.card)) return "That card isn't in your hand";
    const t = pairType(a.card, d);
    if (!t) return "That doesn't match the discard pile";
    take(g, seat, a.card);
    g.discard.pop();
    g.stacks[seat].push({ type: t, cards: [d, a.card] });
    announce(g, seat, `Takes the ${ASSETS[typeOf(d)].name}`);
    log(g, seat, `took the discard for a ${ASSETS[t].name} set`);
    endTurn(g);
    return null;
  }
  if (a.type === 'challenge') {
    const target = a.target;
    if (!g.order.includes(target) || target === seat) return 'Pick another player';
    if (!exposed(g, target)) return 'Their first set is safe — they need two sets before you can challenge';
    if (!hand.includes(a.card)) return "That card isn't in your hand";
    const type = topSet(g, target).type;
    if (!matches(a.card, type)) return `You need a ${ASSETS[type].name} or a wild to challenge that set`;
    take(g, seat, a.card);
    g.challenge = { attacker: seat, defender: target, type, played: [{ seat, card: a.card }], toMove: target };
    g.moveId++;
    announce(g, seat, `Challenges for the ${ASSETS[type].name}!`);
    if (!g.hands[target].some(c => matches(c, type))) resolve(g, seat);
    return null;
  }
  if (a.type === 'discard') {
    if (!hand.includes(a.card)) return "That card isn't in your hand";
    take(g, seat, a.card);
    g.discard.push(a.card);
    log(g, seat, `discarded a ${ASSETS[typeOf(a.card)].name}`);
    endTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

// The challenge is over: the winner gets the set and every card played.
function resolve(g, winner) {
  const ch = g.challenge;
  const set = g.stacks[ch.defender].pop();
  const cards = [...set.cards, ...ch.played.map(p => p.card)];
  g.stacks[winner].push({ type: ch.type, cards });
  const v = cards.reduce((a, c) => a + valueOf(c), 0);
  announce(g, winner, winner === ch.attacker ? `Steals it! ${money(v)}` : `Keeps it! ${money(v)}`);
  log(g, winner, winner === ch.attacker ? `stole a ${ASSETS[ch.type].name} set (${money(v)})` : `defended a ${ASSETS[ch.type].name} set (${money(v)})`);
  g.lastChallenge = { ...ch, winner, id: g.moveId };
  g.challenge = null;
  refill(g, ch.defender);
  endTurn(g);
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, order: g.order, toMove: current(g),
    hand: (g.hands[seat] || []).slice(), deck: g.deck.length, top: top(g), discardN: g.discard.length,
    counts: g.hands.map(h => h.length),
    // Everyone sees the top set of each stack and how many sets are under it.
    stacks: g.stacks.map(st => ({ sets: st.length, top: st.length ? { type: st[st.length - 1].type, cards: st[st.length - 1].cards } : null })),
    totals: g.phase === 'over' ? g.stacks.map(total) : null, mine: total(g.stacks[seat] || []),
    challenge: g.challenge, winners: g.winners, moveId: g.moveId,
  };
}

// ---------------------------------------------------------------- bots

export function botAction(g, seat) {
  const hand = g.hands[seat];
  const ch = g.challenge;
  if (ch) {
    const opts = hand.filter(c => matches(c, ch.type));
    if (!opts.length) return { type: 'fold' };
    const naturals = opts.filter(c => !isWild(c));
    const pot = setValue(g.stacks[ch.defender][g.stacks[ch.defender].length - 1]) + ch.played.reduce((a, p) => a + valueOf(p.card), 0);
    if (naturals.length) return { type: 'answer', card: naturals[0] };
    // Only spend a wild when there's a lot riding on it.
    const w = opts.sort((a, b) => valueOf(a) - valueOf(b))[0];
    return pot >= valueOf(w) + 20 ? { type: 'answer', card: w } : { type: 'fold' };
  }
  // Best set available: from the hand, or with the discard.
  let best = null;
  for (let i = 0; i < hand.length; i++) for (let j = i + 1; j < hand.length; j++) {
    const t = pairType(hand[i], hand[j]);
    if (!t) continue;
    const v = valueOf(hand[i]) + valueOf(hand[j]) - (isWild(hand[i]) || isWild(hand[j]) ? 15 : 0);
    if (!best || v > best.v) best = { v, a: { type: 'pair', cards: [hand[i], hand[j]] } };
  }
  const d = top(g);
  if (d) for (const c of hand) {
    const t = pairType(c, d);
    if (!t) continue;
    const v = valueOf(c) + valueOf(d) + 3 - (isWild(c) ? 15 : 0);
    if (!best || v > best.v) best = { v, a: { type: 'take', card: c } };
  }
  // A challenge, when we hold two or more cards for someone's juicy top set.
  let steal = null;
  for (const s of g.order) {
    if (s === seat || !exposed(g, s)) continue;
    const set = topSet(g, s);
    const ammo = hand.filter(c => matches(c, set.type));
    const naturals = ammo.filter(c => !isWild(c));
    const v = setValue(set);
    if (ammo.length >= 2 || (ammo.length === 1 && v >= 40 && Math.random() < 0.5)) {
      const score = v + naturals.length * 10;
      if (!steal || score > steal.score) steal = { score, a: { type: 'challenge', target: s, card: naturals[0] || ammo[0] } };
    }
  }
  if (steal && (!best || steal.score > best.v + 10)) return steal.a;
  if (best) return best.a;
  // Otherwise throw away the cheapest card (never a wild if there's a choice).
  const sorted = hand.slice().sort((a, b) => valueOf(a) - valueOf(b));
  return { type: 'discard', card: sorted.find(c => !isWild(c)) || sorted[0] };
}
