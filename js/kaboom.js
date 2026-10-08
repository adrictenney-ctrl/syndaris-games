// Kaboom Critters: a deck with a few Kaboom! critters hidden in it. On your turn play as many
// cards as you like, then draw one. Draw a Kaboom! and you're out — unless you can sing it a
// Lullaby, in which case you tuck it back into the deck wherever you like. Last one standing
// wins. Runs only on the table (host).
//
// Any action can be cancelled with a Nuh-uh! (and a Nuh-uh! can be cancelled by another).
// After an action is played everyone gets a few seconds to object before it happens.

export const CARDS = {
  kaboom: { name: 'Kaboom!', ic: '💥', text: 'Draw this and you\'re out — unless you have a Lullaby' },
  lullaby: { name: 'Lullaby', ic: '🎶', text: 'Calms a Kaboom! Tuck it back in the deck anywhere' },
  nap: { name: 'Nap', ic: '💤', text: 'End your turn without drawing', n: 4 },
  stampede: { name: 'Stampede', ic: '🐃', text: 'End your turn without drawing. The next player takes two turns', n: 4 },
  ball: { name: 'Crystal Ball', ic: '🔮', text: 'Secretly look at the top three cards', n: 5 },
  shake: { name: 'Shake Up', ic: '🌀', text: 'Shuffle the deck', n: 4 },
  nuhuh: { name: 'Nuh-uh!', ic: '✋', text: 'Cancel any action — even another Nuh-uh!', n: 5 },
  please: { name: 'Pretty Please', ic: '🥺', text: 'Someone has to give you a card of their choice', n: 4 },
  panda: { name: 'Trash Panda', ic: '🦝', text: 'Play a pair to steal a random card', n: 4, critter: true },
  llama: { name: 'Disco Llama', ic: '🦙', text: 'Play a pair to steal a random card', n: 4, critter: true },
  hedgehog: { name: 'Toast Hedgehog', ic: '🦔', text: 'Play a pair to steal a random card', n: 4, critter: true },
  sloth: { name: 'Pickle Sloth', ic: '🦥', text: 'Play a pair to steal a random card', n: 4, critter: true },
  otter: { name: 'Mustache Otter', ic: '🦦', text: 'Play a pair to steal a random card', n: 4, critter: true },
};
export const typeOf = c => c.split('.')[0];
export const NOPE_MS = 3500;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const n = g.order.length;
  let id = 0;
  const make = (t, k) => Array.from({ length: k }, () => `${t}.${id++}`);
  const deck = shuffle(Object.entries(CARDS).filter(([, c]) => c.n).flatMap(([t, c]) => make(t, c.n)));
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = [...deck.splice(0, 7), ...make('lullaby', 1)];
  g.deck = shuffle([...deck, ...make('kaboom', n - 1), ...make('lullaby', Math.max(2, 6 - n))]);
  g.discard = [];
  g.alive = g.seats.map(Boolean);
  g.turn = g.order[Math.floor(Math.random() * n)];
  g.turnsLeft = 1;
  g.phase = 'play';       // play | tuck (placing a calmed Kaboom!) | over
  g.pending = null;       // an action waiting out its Nuh-uh! window
  g.favor = null;         // { from, to } while someone chooses a card to give
  g.peek = null;          // { seat, cards } — what the Crystal Ball showed
  g.winner = null;
  g.plays = 0;
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
const log = (g, seat, text) => { g.log.push({ seat, text }); if (g.log.length > 30) g.log.shift(); };
const living = g => g.order.filter(s => g.alive[s]);
const nextAlive = (g, s) => { let i = g.order.indexOf(s); do { i = (i + 1) % g.order.length; } while (!g.alive[g.order[i]]); return g.order[i]; };
export const kaboomsLeft = g => g.deck.filter(c => typeOf(c) === 'kaboom').length;
const has = (g, s, t) => g.hands[s].find(c => typeOf(c) === t);
const remove = (g, s, c) => { const h = g.hands[s], i = h.indexOf(c); if (i >= 0) h.splice(i, 1); return i >= 0; };

// Who has to act right now (for bots and the "your turn" glow).
export function current(g) {
  if (g.phase === 'over' || g.pending) return -1;
  if (g.favor) return g.favor.from;
  return g.turn;
}

function endTurn(g, all = false) {
  g.plays = 0;
  g.turnsLeft = all ? 0 : g.turnsLeft - 1;
  if (g.peek && g.peek.seat === g.turn) g.peek = null;
  if (g.turnsLeft <= 0) { g.turn = nextAlive(g, g.turn); g.turnsLeft = 1; }
  g.moveId++;
}

function explode(g, s) {
  g.alive[s] = false;
  g.discard.push(...g.hands[s]);
  g.hands[s] = [];
  announce(g, s, 'KABOOM! 💥');
  log(g, s, 'went kaboom');
  if (living(g).length === 1) { g.phase = 'over'; g.winner = living(g)[0]; g.moveId++; return; }
  g.turn = nextAlive(g, s);
  g.turnsLeft = 1;
  g.plays = 0;
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (!g.alive[seat]) return "You're out of this one";

  if (a.type === 'nuhuh') {
    if (!g.pending) return 'There is nothing to cancel';
    const c = has(g, seat, 'nuhuh');
    if (!c) return "You don't have a Nuh-uh!";
    if (g.pending.last === seat) return "You can't cancel your own Nuh-uh!";
    remove(g, seat, c);
    g.discard.push(c);
    g.pending.nopes++;
    g.pending.last = seat;
    g.pending.until = Date.now() + NOPE_MS;
    g.moveId++;
    announce(g, seat, g.pending.nopes % 2 ? 'Nuh-uh!' : 'Nuh-uh to your nuh-uh!');
    return null;
  }
  if (g.pending) return 'Wait — someone might say Nuh-uh!';

  if (g.favor) {
    if (seat !== g.favor.from) return `Waiting for ${'them'} to choose a card`;
    if (a.type !== 'give' || !g.hands[seat].includes(a.card)) return 'Pick a card to give';
    remove(g, seat, a.card);
    g.hands[g.favor.to].push(a.card);
    g.gift = { to: g.favor.to, card: a.card, id: g.moveId };
    log(g, seat, 'gave a card away');
    g.favor = null;
    g.moveId++;
    return null;
  }
  if (seat !== g.turn) return "It isn't your turn";

  if (g.phase === 'tuck') {
    if (a.type !== 'tuck') return 'Put the Kaboom! back in the deck';
    const n = g.deck.length;
    const pos = a.pos === 'random' ? Math.floor(Math.random() * (n + 1)) : Math.max(0, Math.min(n, Number(a.pos) || 0));
    // pos counts from the top of the deck (the end of the array).
    g.deck.splice(n - pos, 0, g.tucking);
    g.tucking = null;
    g.phase = 'play';
    g.peek = null;
    log(g, seat, 'tucked a Kaboom! back in the deck');
    endTurn(g);
    return null;
  }

  if (a.type === 'draw') {
    const c = g.deck.pop();
    if (g.peek) g.peek = null;
    if (typeOf(c) === 'kaboom') {
      const l = has(g, seat, 'lullaby');
      if (!l) { g.discard.push(c); explode(g, seat); return null; }
      remove(g, seat, l);
      g.discard.push(l);
      g.tucking = c;
      g.phase = 'tuck';
      g.moveId++;
      announce(g, seat, 'Kaboom! … 🎶 Lullaby!');
      log(g, seat, 'calmed a Kaboom! with a Lullaby');
      return null;
    }
    g.hands[seat].push(c);
    g.lastDraw = { seat, id: g.moveId };
    endTurn(g);
    return null;
  }

  if (a.type === 'play') {
    const cards = a.cards || [];
    if (!cards.length || !cards.every(c => g.hands[seat].includes(c)) || new Set(cards).size !== cards.length) return "Those cards aren't in your hand";
    const t = typeOf(cards[0]);
    let kind;
    if (cards.length === 2) {
      if (typeOf(cards[1]) !== t || !CARDS[t].critter) return 'Pairs have to be two of the same critter';
      kind = 'steal';
    } else if (cards.length === 1) {
      if (CARDS[t].critter) return 'Critters only work in pairs';
      if (['kaboom', 'lullaby', 'nuhuh'].includes(t)) return t === 'nuhuh' ? 'Save that for when someone plays an action' : 'You can only use a Lullaby when you draw a Kaboom!';
      kind = t;
    } else return 'Play one card, or a pair of critters';
    let target = null;
    if (kind === 'steal' || kind === 'please') {
      target = a.target;
      if (!g.alive[target] || target === seat) return 'Pick another player';
      if (!g.hands[target].length) return 'They have no cards';
    }
    cards.forEach(c => { remove(g, seat, c); g.discard.push(c); });
    g.plays++;
    g.pending = { seat, kind, cards, target, nopes: 0, last: seat, until: Date.now() + NOPE_MS, checked: -1, id: g.moveId + 1 };
    g.moveId++;
    announce(g, seat, kind === 'steal' ? `${CARDS[t].name} pair → steal!` : CARDS[t].name);
    return null;
  }
  return "That move isn't allowed";
}

// The Nuh-uh! window has closed: do the action unless it was cancelled.
export function resolve(g) {
  const p = g.pending;
  if (!p) return;
  g.pending = null;
  g.moveId++;
  if (p.nopes % 2) { log(g, p.seat, `had a ${p.kind === 'steal' ? 'steal' : CARDS[p.kind].name} cancelled`); return; }
  const s = p.seat;
  if (p.kind === 'nap') { log(g, s, 'took a nap'); endTurn(g); }
  else if (p.kind === 'stampede') {
    // A stampede on top of a stampede piles up: the next player takes two more turns.
    const r = g.turnsLeft;
    log(g, s, 'started a stampede');
    endTurn(g, true);
    g.turnsLeft = r > 1 ? r + 2 : 2;
  } else if (p.kind === 'ball') { g.peek = { seat: s, cards: g.deck.slice(-3).reverse(), id: g.moveId }; log(g, s, 'gazed into the crystal ball'); }
  else if (p.kind === 'shake') { shuffle(g.deck); if (g.peek) g.peek = null; log(g, s, 'shook up the deck'); }
  else if (p.kind === 'please') {
    if (!g.alive[p.target] || !g.hands[p.target].length) return;
    g.favor = { from: p.target, to: s };
  } else if (p.kind === 'steal') {
    const h = g.hands[p.target];
    if (!h.length) return;
    const c = h.splice(Math.floor(Math.random() * h.length), 1)[0];
    g.hands[s].push(c);
    g.gift = { to: s, card: c, id: g.moveId };
    log(g, s, 'stole a card');
  }
}

// The table's clock: bots decide on Nuh-uh!s a moment after each action, then the window closes.
export function tick(g, players) {
  const p = g.pending;
  if (!p) return null;
  if (p.checked !== p.nopes) {
    return {
      ms: 700, run: () => {
        p.checked = p.nopes;
        const b = botNope(g, players);
        if (b != null) applyAction(g, b, { type: 'nuhuh' });
      },
    };
  }
  return { ms: Math.max(0, p.until - Date.now()) + 30, run: () => resolve(g) };
}

function botNope(g, players) {
  const p = g.pending;
  const on = p.nopes % 2 === 0;          // would the action happen as things stand?
  const next = nextAlive(g, p.seat);
  for (const s of living(g)) {
    if (!players[s]?.bot || s === p.last || !has(g, s, 'nuhuh')) continue;
    const hurt = on && ((p.target === s) || (p.kind === 'stampede' && next === s));
    const mine = !on && s === p.seat;    // someone cancelled my action
    if ((hurt && Math.random() < 0.7) || (mine && Math.random() < 0.5)) return s;
  }
  return null;
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, turnsLeft: g.turnsLeft, order: g.order, alive: g.alive, toMove: current(g),
    hand: (g.hands[seat] || []).slice().sort((a, b) => Object.keys(CARDS).indexOf(typeOf(a)) - Object.keys(CARDS).indexOf(typeOf(b))),
    counts: g.hands.map(h => h.length), deck: g.deck.length, kabooms: kaboomsLeft(g), top: g.discard[g.discard.length - 1] || null,
    pending: g.pending ? { seat: g.pending.seat, kind: g.pending.kind, cards: g.pending.cards, target: g.pending.target, nopes: g.pending.nopes, last: g.pending.last, left: Math.max(0, g.pending.until - Date.now()) } : null,
    favor: g.favor, peek: g.peek?.seat === seat ? g.peek.cards : null, gift: g.gift?.to === seat ? g.gift : null,
    winner: g.winner, moveId: g.moveId, log: g.log.slice(-6),
  };
}

// ---------------------------------------------------------------- bots

export function botAction(g, seat) {
  const hand = g.hands[seat];
  const find = t => hand.find(c => typeOf(c) === t);
  if (g.favor && g.favor.from === seat) {
    // Give away the least useful card.
    const rank = ['panda', 'llama', 'hedgehog', 'sloth', 'otter', 'shake', 'ball', 'please', 'nap', 'stampede', 'nuhuh', 'lullaby'];
    return { type: 'give', card: hand.slice().sort((a, b) => rank.indexOf(typeOf(a)) - rank.indexOf(typeOf(b)))[0] };
  }
  if (g.phase === 'tuck') {
    // Usually right on top for the next player; sometimes a little deeper.
    const r = Math.random();
    return { type: 'tuck', pos: r < 0.55 ? 0 : r < 0.8 ? 1 : 'random' };
  }
  const n = g.deck.length || 1;
  const risk = kaboomsLeft(g) / n;
  const knowsTop = g.peek?.seat === seat ? g.peek.cards : null;
  const topIsKaboom = knowsTop ? typeOf(knowsTop[0]) === 'kaboom' : null;
  const safe = !!find('lullaby');
  const others = living(g).filter(s => s !== seat && g.hands[s].length);
  const richest = others.sort((a, b) => g.hands[b].length - g.hands[a].length)[0];
  if (g.plays < 4) {
    if (topIsKaboom) {
      const out = find('stampede') || find('nap') || find('shake');
      if (out) return { type: 'play', cards: [out] };
    }
    if (topIsKaboom === null && risk > (safe ? 0.45 : 0.18)) {
      if (find('ball') && Math.random() < 0.7) return { type: 'play', cards: [find('ball')] };
      const out = find('stampede') || find('nap');
      if (out && (!safe || risk > 0.5)) return { type: 'play', cards: [out] };
    }
    // Steal with a critter pair, or ask nicely, when short of Lullabies.
    if (richest != null && (!safe || Math.random() < 0.3)) {
      const pairT = ['panda', 'llama', 'hedgehog', 'sloth', 'otter'].find(t => hand.filter(c => typeOf(c) === t).length >= 2);
      if (pairT) return { type: 'play', cards: hand.filter(c => typeOf(c) === pairT).slice(0, 2), target: richest };
      if (find('please') && !safe) return { type: 'play', cards: [find('please')], target: richest };
    }
  }
  return { type: 'draw' };
}
