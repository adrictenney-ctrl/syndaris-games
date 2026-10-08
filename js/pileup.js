// Pile Up: a merciless shedding game. Match the top card by suit or by number/symbol, or play
// a wild. Draw cards stack — answer a +2 with a +2 or bigger and pass the whole pile on; whoever
// can't answer takes the lot and loses their turn. Can't play? Keep drawing until you can.
// Hold 25 cards and you're knocked out. First to empty their hand (or the last one standing)
// wins. Runs only on the table (host).
//
// Suits: Ember, Tide, Moss, Gilt. Each has 0–9 (two of each) and its action cards: Pass
// (skip the next player), Turnabout (reverse), +2, +4, Clear Out (also throw away every other
// card of that suit), Encore (everyone else is skipped — go again). Wilds: Wild Turnabout +4,
// Wild +6, Wild +10 and Roulette (the next player names a suit and flips until they find it,
// keeping everything). A 7 swaps hands with a player you choose; a 0 passes every hand on.

export const SUITS = ['e', 't', 'm', 'g'];
export const SUIT = { e: { name: 'Ember', ic: '🔥' }, t: { name: 'Tide', ic: '🌊' }, m: { name: 'Moss', ic: '🌿' }, g: { name: 'Gilt', ic: '✦' } };
export const KIND = {
  pass: { name: 'Pass', short: '⦸' }, turn: { name: 'Turnabout', short: '⇄' }, d2: { name: '+2', short: '+2', draw: 2 }, d4: { name: '+4', short: '+4', draw: 4 },
  clear: { name: 'Clear Out', short: '✕' }, encore: { name: 'Encore', short: '↻' },
  wt4: { name: 'Wild Turnabout +4', short: '+4', draw: 4, wild: true }, w6: { name: 'Wild +6', short: '+6', draw: 6, wild: true },
  w10: { name: 'Wild +10', short: '+10', draw: 10, wild: true }, roul: { name: 'Roulette', short: '◎', wild: true },
};
export const MERCY = 25;
export const suitOf = c => c[0];
export const kindOf = c => c.split('.')[0].slice(2);
export const isWild = c => suitOf(c) === 'w';
export const drawOf = c => KIND[kindOf(c)]?.draw || 0;
export const label = c => { const k = kindOf(c); return KIND[k] ? KIND[k].name : k; };

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function fullDeck() {
  const d = [];
  let id = 0;
  const add = (s, k, n) => { for (let i = 0; i < n; i++) d.push(`${s}-${k}.${id++}`); };
  for (const s of SUITS) {
    for (let n = 0; n <= 9; n++) add(s, String(n), 2);
    add(s, 'pass', 3); add(s, 'turn', 3); add(s, 'd2', 3); add(s, 'd4', 2); add(s, 'clear', 3); add(s, 'encore', 2);
  }
  add('w', 'wt4', 8); add('w', 'w6', 4); add('w', 'w10', 4); add('w', 'roul', 8);
  return d;
}

export function createGame(settings, players) {
  const g = { settings: { hand: 7, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.deck = shuffle(fullDeck());
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.deck.splice(0, g.settings.hand);
  // Start the pile with a plain number card.
  let i = g.deck.findIndex(c => !isWild(c) && /^\d$/.test(kindOf(c)));
  g.pile = [g.deck.splice(i, 1)[0]];
  g.color = suitOf(g.pile[0]);
  g.dir = 1;
  g.out = g.seats.map(() => false);
  g.turn = g.order[Math.floor(Math.random() * g.order.length)];
  g.stack = 0;            // cards waiting for whoever can't answer the draw pile
  g.stackMin = 0;         // the smallest draw card that can answer it
  g.drew = null;          // the card drawn this turn (the only one that may still be played)
  g.choice = null;        // { seat, kind: 'swap' | 'roulette' }
  g.phase = 'play';
  g.winner = null;
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const alive = g => g.order.filter(s => !g.out[s]);
export const top = g => g.pile[g.pile.length - 1];
function step(g, s, k = 1) {
  let i = g.order.indexOf(s);
  for (let n = 0; n < k; n++) do { i = (i + g.dir + g.order.length) % g.order.length; } while (g.out[g.order[i]]);
  return g.order[i];
}
export const nextOf = (g, s) => step(g, s, 1);

export function current(g) {
  if (g.phase !== 'play') return -1;
  return g.choice ? g.choice.seat : g.turn;
}

export function canPlay(g, s, c) {
  if (g.stack) return drawOf(c) >= g.stackMin;
  if (g.drew && c !== g.drew) return false;
  if (isWild(c)) return true;
  return suitOf(c) === g.color || kindOf(c) === kindOf(top(g));
}
export const playable = (g, s) => g.hands[s].filter(c => canPlay(g, s, c));

function drawOne(g) {
  if (!g.deck.length) {
    if (g.pile.length <= 1) return null;
    const t = g.pile.pop();
    g.deck = shuffle(g.pile);
    g.pile = [t];
  }
  return g.deck.pop();
}

// Draw n cards into a hand; the mercy rule knocks a player out at 25.
function give(g, s, n) {
  let got = 0;
  for (let i = 0; i < n; i++) { const c = drawOne(g); if (!c) break; g.hands[s].push(c); got++; }
  checkMercy(g, s);
  return got;
}

function checkMercy(g, s) {
  if (g.out[s] || g.hands[s].length < MERCY) return false;
  g.out[s] = true;
  g.pile.splice(0, 0, ...g.hands[s]);  // under the pile, to be shuffled back in later
  g.hands[s] = [];
  announce(g, s, `Knocked out — ${MERCY} cards! 💀`);
  const left = alive(g);
  if (left.length === 1) win(g, left[0]);
  return true;
}

function win(g, s) {
  g.phase = 'over';
  g.winner = s;
  g.choice = null;
  g.moveId++;
}

function endTurn(g, skip = 0) {
  g.drew = null;
  if (g.phase === 'over') return;
  g.turn = step(g, g.turn, 1 + skip);
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (g.out[seat]) return "You've been knocked out";

  if (g.choice) {
    if (seat !== g.choice.seat) return 'Waiting for a choice';
    if (g.choice.kind === 'swap') {
      if (a.type !== 'swap' || a.target === seat || !g.seats[a.target] || g.out[a.target]) return 'Pick a player to swap hands with';
      [g.hands[seat], g.hands[a.target]] = [g.hands[a.target], g.hands[seat]];
      announce(g, seat, 'Swap! 🔄');
      g.choice = null;
      endTurn(g);
    } else {
      if (a.type !== 'color' || !SUITS.includes(a.color)) return 'Name a suit';
      // Roulette: flip until the named suit turns up, keeping everything.
      let n = 0, c;
      while ((c = drawOne(g))) { g.hands[seat].push(c); n++; if (suitOf(c) === a.color) break; }
      g.color = a.color;
      announce(g, seat, `Roulette: ${SUIT[a.color].name} — took ${n} 😬`);
      g.choice = null;
      if (!checkMercy(g, seat)) { g.turn = seat; endTurn(g); }
      else if (g.phase !== 'over') { g.turn = seat; g.turn = nextOf(g, seat); }
    }
    g.moveId++;
    return null;
  }
  if (seat !== g.turn) return "It isn't your turn";

  if (a.type === 'take') {
    if (!g.stack) return 'There is nothing to take';
    const n = g.stack;
    g.stack = 0; g.stackMin = 0;
    give(g, seat, n);
    announce(g, seat, `Takes ${n} 😩`);
    if (g.phase !== 'over') { if (g.out[seat]) g.turn = nextOf(g, seat); else endTurn(g); }
    g.moveId++;
    return null;
  }
  if (a.type === 'draw') {
    if (g.stack) return `Answer the +${g.stack} or take it`;
    if (g.drew) return 'You already drew — play it or pass';
    if (playable(g, seat).length) return 'You have a card you can play';
    // Draw until something can be played.
    let c, n = 0;
    while ((c = drawOne(g))) {
      g.hands[seat].push(c); n++;
      if (isWild(c) || suitOf(c) === g.color || kindOf(c) === kindOf(top(g))) break;
    }
    g.drewCount = n;
    if (checkMercy(g, seat)) { if (g.phase !== 'over') g.turn = nextOf(g, seat); g.moveId++; return null; }
    if (c) g.drew = c; else endTurn(g);
    if (n > 3) announce(g, seat, `Drew ${n}…`);
    g.moveId++;
    return null;
  }
  if (a.type === 'pass') {
    if (!g.drew) return 'Draw first';
    endTurn(g);
    g.moveId++;
    return null;
  }
  if (a.type !== 'play') return "That move isn't allowed";
  const c = a.card, hand = g.hands[seat];
  if (!hand.includes(c)) return "That card isn't in your hand";
  if (!canPlay(g, seat, c)) return g.stack ? `Only a +${g.stackMin} or bigger can answer that` : "That card doesn't match";
  const k = kindOf(c);
  if (isWild(c) && k !== 'roul' && !SUITS.includes(a.color)) return 'Pick a suit for the wild';
  hand.splice(hand.indexOf(c), 1);
  g.pile.push(c);
  g.drew = null;
  g.color = isWild(c) ? (k === 'roul' ? g.color : a.color) : suitOf(c);
  g.moveId++;

  if (k === 'clear') {
    const same = hand.filter(x => suitOf(x) === suitOf(c));
    for (const x of same) { hand.splice(hand.indexOf(x), 1); g.pile.splice(g.pile.length - 1, 0, x); }
    if (same.length) announce(g, seat, `Clear Out! −${same.length + 1} cards`);
  }
  if (!hand.length) { announce(g, seat, 'Out of cards! 🏆'); win(g, seat); return null; }

  const d = drawOf(c);
  if (d) {
    if (k === 'wt4') g.dir = -g.dir;
    g.stack += d;
    g.stackMin = d;
    if (k === 'wt4' && alive(g).length === 2) { /* reversing between two players changes nothing */ }
    announce(g, seat, `${KIND[k].name}${g.stack > d ? ` — the pile is +${g.stack}!` : ''}`);
    endTurn(g);
    return null;
  }
  if (k === 'pass') { announce(g, seat, 'Pass!'); endTurn(g, 1); return null; }
  if (k === 'turn') {
    g.dir = -g.dir;
    announce(g, seat, 'Turnabout ⇄');
    endTurn(g, alive(g).length === 2 ? 1 : 0);
    return null;
  }
  if (k === 'encore') { announce(g, seat, 'Encore — again!'); g.drew = null; return null; }
  if (k === 'roul') {
    const t = nextOf(g, seat);
    g.choice = { seat: t, kind: 'roulette' };
    g.turn = t;
    announce(g, seat, 'Roulette! 🎡');
    return null;
  }
  if (k === '7') {
    if (alive(g).length < 2) { endTurn(g); return null; }
    g.choice = { seat, kind: 'swap' };
    return null;
  }
  if (k === '0') {
    // Every hand moves on one seat in the direction of play.
    const live = alive(g);
    const hands = live.map(s => g.hands[s]);
    live.forEach((s, i) => { g.hands[nextOf(g, s)] = hands[i]; });
    announce(g, seat, 'Zero — pass your hands! 🔁');
  }
  endTurn(g);
  return null;
}

// ---------------------------------------------------------------- bots

function bestColor(hand) {
  const n = { e: 0, t: 0, m: 0, g: 0 };
  for (const c of hand) if (!isWild(c)) n[suitOf(c)]++;
  return SUITS.slice().sort((a, b) => n[b] - n[a])[0];
}

export function botAction(g, seat) {
  const hand = g.hands[seat];
  if (g.choice) {
    if (g.choice.kind === 'swap') {
      const others = alive(g).filter(s => s !== seat);
      return { type: 'swap', target: others.sort((a, b) => g.hands[a].length - g.hands[b].length)[0] };
    }
    // Name the suit that's most common in the deck — it'll turn up soonest.
    return { type: 'color', color: bestColor(g.deck.length ? g.deck : hand) };
  }
  const ok = playable(g, seat);
  if (g.stack) {
    if (!ok.length) return { type: 'take' };
    const c = ok.sort((a, b) => drawOf(a) - drawOf(b))[0];
    return { type: 'play', card: c, color: bestColor(hand.filter(x => x !== c)) };
  }
  if (!ok.length) return g.drew ? { type: 'pass' } : { type: 'draw' };
  const next = nextOf(g, seat);
  const nextLow = g.hands[next].length <= 3;
  const score = c => {
    const k = kindOf(c);
    let v = 0;
    if (isWild(c)) v -= 6;                       // save wilds
    if (drawOf(c)) v += nextLow ? 8 : 1;
    if (k === 'clear') v += 2 + 2 * hand.filter(x => suitOf(x) === suitOf(c)).length;
    if (k === 'encore') v += 3;
    if (k === '7') { const fewest = Math.min(...alive(g).filter(s => s !== seat).map(s => g.hands[s].length)); v += hand.length - 1 > fewest + 2 ? 6 : -4; }
    if (k === '0') v += g.hands[next] && hand.length > 6 ? 2 : -1;
    if (k === 'pass' || k === 'turn') v += nextLow ? 5 : 0.5;
    if (!isWild(c)) v += hand.filter(x => suitOf(x) === suitOf(c)).length * 0.3;
    return v;
  };
  const c = ok.sort((a, b) => score(b) - score(a))[0];
  return { type: 'play', card: c, color: bestColor(hand.filter(x => x !== c)) };
}

export function viewFor(g, seat) {
  const hand = (g.hands[seat] || []).slice().sort((a, b) => {
    const sa = isWild(a) ? 'z' : suitOf(a), sb = isWild(b) ? 'z' : suitOf(b);
    if (sa !== sb) return sa < sb ? -1 : 1;
    return kindOf(a) < kindOf(b) ? -1 : 1;
  });
  return {
    phase: g.phase, turn: g.turn, order: g.order, dir: g.dir, color: g.color, top: top(g), stack: g.stack, stackMin: g.stackMin,
    counts: g.hands.map(h => h.length), out: g.out, hand, playable: g.phase === 'play' && current(g) === seat && !g.choice ? playable(g, seat) : [],
    drew: g.turn === seat ? g.drew : null, choice: g.choice, toMove: current(g), deck: g.deck.length, winner: g.winner, moveId: g.moveId,
  };
}

// Test helper: every card is somewhere exactly once.
export function check(g) {
  const all = [...g.deck, ...g.pile, ...g.hands.flat()];
  const n = fullDeck().length;
  return all.length === n && new Set(all).size === n ? '' : `cards ${all.length}/${new Set(all).size} of ${n}`;
}
