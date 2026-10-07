// Midnight Manor: a murder mystery deduction game. One suspect, one weapon and one room are
// sealed in the envelope; the rest of the cards are dealt out. On your turn, move to a room
// next door (or take a secret passage between opposite corners), then suggest who did it, with
// what, in this room. The first player after you who can disprove it shows you one card,
// privately. Think you know? Accuse — right and you win; wrong and you're out of the running
// (but still show cards). Our own suspects, weapons and mansion.

export const SUSPECTS = ['Countess Vale', 'Doctor Hargrove', 'Captain Briar', 'Madame Orsini', 'Professor Quill', 'Miss Lark'];
export const SUSPECT_COLOR = ['#9c3b4f', '#3f6f8f', '#5f7f45', '#b07a2e', '#6a5596', '#c7c1b4'];
export const WEAPONS = ['Letter opener', 'Poisoned teacup', 'Fire poker', 'Silk scarf', 'Brass telescope', 'Garden shears'];
export const WEAPON_ICON = ['✉', '☕', '⚚', '∿', '⌖', '✂'];
// Rooms on a 3×3 floor plan, row by row.
export const ROOMS = ['Wine Cellar', 'Observatory', 'Greenhouse', 'Gallery', 'Grand Staircase', 'Music Room', 'Chapel', 'Trophy Room', 'Smoking Room'];
export const PASSAGES = { 0: 8, 8: 0, 2: 6, 6: 2 };
export const neighbours = r => {
  const out = [], row = Math.floor(r / 3), col = r % 3;
  if (row > 0) out.push(r - 3); if (row < 2) out.push(r + 3); if (col > 0) out.push(r - 1); if (col < 2) out.push(r + 1);
  if (PASSAGES[r] != null) out.push(PASSAGES[r]);
  return out;
};

// Cards: 's0'..'s5', 'w0'..'w5', 'r0'..'r8'.
export const cardName = c => (c[0] === 's' ? SUSPECTS : c[0] === 'w' ? WEAPONS : ROOMS)[Number(c.slice(1))];
export const ALL = [...SUSPECTS.map((_, i) => 's' + i), ...WEAPONS.map((_, i) => 'w' + i), ...ROOMS.map((_, i) => 'r' + i)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, logId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  // Each player plays a suspect; suspects nobody plays still wander (they get moved by suggestions).
  g.suspectOf = g.seats.map(() => null);
  g.order.forEach((s, i) => { g.suspectOf[s] = i; });
  const pick = k => k + Math.floor(Math.random() * (k === 's' ? 6 : k === 'w' ? 6 : 9));
  g.envelope = [pick('s'), pick('w'), pick('r')];
  const rest = shuffle(ALL.filter(c => !g.envelope.includes(c)));
  g.hands = g.seats.map(() => []);
  rest.forEach((c, i) => g.hands[g.order[i % g.order.length]].push(c));
  g.where = SUSPECTS.map((_, i) => [0, 2, 6, 8, 1, 7][i]);         // suspect -> room
  g.weaponAt = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 6);  // weapon -> room
  g.turn = g.order[0];
  g.step = 'move';          // move → suggest → end
  g.summoned = g.seats.map(() => false);
  g.out = g.seats.map(() => false);
  g.log = [];
  g.shown = g.seats.map(() => []);   // cards each player has been shown: { card, by }
  g.pending = null;         // { suggester, cards:[s,w,r], asker: seat being asked }
  g.winner = null;
  g.phase = 'play';
  return g;
}

function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }
function log(g, entry) {
  const e = { id: ++g.logId, ...entry };
  g.log.push(e);
  if (g.log.length > 12) g.log.shift();
  if (entry.type === 'none') (g.allLog ||= []).push(e);
}
const nextSeat = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];
export const roomOf = (g, seat) => g.where[g.suspectOf[seat]];

function nextTurn(g) {
  let s = g.turn;
  for (let k = 0; k < g.order.length; k++) { s = nextSeat(g, s); if (!g.out[s]) break; }
  g.turn = s;
  g.step = 'move';
}

// Ask round the table after a suggestion.
function askNext(g) {
  const p = g.pending;
  let s = p.asker;
  for (let k = 0; k < g.order.length - 1; k++) {
    s = nextSeat(g, s);
    if (s === p.suggester) break;
    if (g.hands[s].some(c => p.cards.includes(c))) { p.asker = s; return; }
  }
  // Nobody could.
  log(g, { type: 'none', seat: p.suggester, cards: p.cards });
  announce(g, p.suggester, 'Nobody could disprove it!');
  g.pending = null;
  g.step = 'end';
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'The case is closed';
  if (a.type === 'show') {
    const p = g.pending;
    if (!p || p.asker !== seat) return 'Nobody is asking you';
    if (!p.cards.includes(a.card) || !g.hands[seat].includes(a.card)) return 'Show one of the suggested cards you hold';
    g.shown[p.suggester].push({ card: a.card, by: seat });
    log(g, { type: 'shown', seat: p.suggester, by: seat, cards: p.cards });
    announce(g, seat, 'Shows a card');
    g.pending = null;
    g.step = 'end';
    return null;
  }
  if (seat !== g.turn) return "It isn't your turn";
  if (g.pending) return 'Waiting for someone to show a card';
  const room = roomOf(g, seat);
  if (a.type === 'move') {
    if (g.step !== 'move') return 'You already moved';
    if (a.room === room && g.summoned[seat]) { g.summoned[seat] = false; g.step = 'suggest'; return null; }
    if (!neighbours(room).includes(a.room)) return 'You can only move to a room next door (or through a secret passage)';
    g.where[g.suspectOf[seat]] = a.room;
    g.summoned[seat] = false;
    g.step = 'suggest';
    announce(g, seat, `Into the ${ROOMS[a.room]}`);
    return null;
  }
  if (a.type === 'suggest') {
    if (g.step !== 'suggest') return g.step === 'move' ? 'Move first' : 'You already suggested this turn';
    const s = a.suspect, w = a.weapon;
    if (!(s >= 0 && s < 6 && w >= 0 && w < 6)) return 'Pick a suspect and a weapon';
    // Bring the suspect and the weapon into the room.
    g.where[s] = room;
    g.weaponAt[w] = room;
    const owner = g.suspectOf.indexOf(s);
    if (owner >= 0 && owner !== seat) g.summoned[owner] = true;
    const cards = ['s' + s, 'w' + w, 'r' + room];
    log(g, { type: 'suggest', seat, cards });
    announce(g, seat, `${SUSPECTS[s]}, ${WEAPONS[w].toLowerCase()}, ${ROOMS[room]}?`);
    g.pending = { suggester: seat, cards, asker: seat };
    askNext(g);
    return null;
  }
  if (a.type === 'accuse') {
    const cards = ['s' + a.suspect, 'w' + a.weapon, 'r' + a.room];
    const right = cards.every((c, i) => c === g.envelope[i]);
    log(g, { type: 'accuse', seat, cards, right });
    if (right) { g.phase = 'over'; g.winner = seat; announce(g, seat, 'Solved it!'); return null; }
    g.out[seat] = true;
    announce(g, seat, 'Wrong! Out of the running');
    if (g.order.every(s => g.out[s])) { g.phase = 'over'; g.winner = null; return null; }
    nextTurn(g);
    return null;
  }
  if (a.type === 'end') {
    if (g.step === 'move') return 'Move (or stay, if you were summoned) first';
    nextTurn(g);
    return null;
  }
  return "That move isn't allowed";
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, turn: g.turn, step: g.step, order: g.order, suspectOf: g.suspectOf, where: g.where, weaponAt: g.weaponAt,
    hand: g.hands[seat] || [], shown: g.shown[seat] || [], out: g.out, summoned: g.summoned[seat] || false,
    log: g.log, winner: g.winner, envelope: g.phase === 'over' ? g.envelope : null,
    asked: g.pending && g.pending.asker === seat ? g.pending.cards.filter(c => g.hands[seat].includes(c)) : null,
    pending: g.pending ? { suggester: g.pending.suggester, asker: g.pending.asker } : null,
    counts: g.hands.map(h => h.length),
  };
}

// ---------------------------------------------------------------- bots

// What a bot knows isn't in the envelope: its own hand, cards shown to it, and (cleverly)
// any suggestion where everyone else passed except one card it can't place.
function cleared(g, seat) {
  const no = new Set([...g.hands[seat], ...g.shown[seat].map(x => x.card)]);
  return no;
}

export function botAction(g, seat) {
  if (g.pending && g.pending.asker === seat) {
    const mine = g.pending.cards.filter(c => g.hands[seat].includes(c));
    return { type: 'show', card: mine[Math.floor(Math.random() * mine.length)] };
  }
  if (seat !== g.turn) return null;
  const no = cleared(g, seat);
  // A suggestion of ours nobody could disprove: whatever we don't hold is in the envelope.
  const sure = {};
  for (const e of g.allLog || []) if (e.type === 'none' && e.seat === seat) e.cards.forEach(c => { if (!g.hands[seat].includes(c)) sure[c[0]] = c; });
  const left = k => (sure[k] ? [sure[k]] : ALL.filter(c => c[0] === k && !no.has(c)));
  const [S, W, R] = ['s', 'w', 'r'].map(left);
  // Accuse when certain.
  if (S.length === 1 && W.length === 1 && R.length === 1) return { type: 'accuse', suspect: +S[0].slice(1), weapon: +W[0].slice(1), room: +R[0].slice(1) };
  const room = roomOf(g, seat);
  if (g.step === 'move') {
    if (g.summoned[seat] && R.includes('r' + room)) return { type: 'move', room };
    const opts = neighbours(room);
    const good = opts.filter(r => R.includes('r' + r));
    const pick = good.length ? good : opts;
    return { type: 'move', room: pick[Math.floor(Math.random() * pick.length)] };
  }
  if (g.step === 'suggest') {
    const pickOne = (arr, k) => { const from = arr.length ? arr : ALL.filter(c => c[0] === k); return +from[Math.floor(Math.random() * from.length)].slice(1); };
    return { type: 'suggest', suspect: pickOne(S, 's'), weapon: pickOne(W, 'w') };
  }
  return { type: 'end' };
}
