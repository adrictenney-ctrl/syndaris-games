// Dreamcards: each player holds six dreamlike picture cards on their phone. The storyteller picks one
// and says (types) a clue — a word, a phrase, a song lyric, anything. Everyone else picks the card
// from their own hand that best fits the clue. All the cards are shuffled onto the table and
// everyone votes for the storyteller's card. If EVERYONE or NOBODY finds it, the storyteller scores 0
// and the others 2; otherwise the storyteller and each finder score 3. Players also score 1 for each
// vote their card fooled. First to the target wins.
import { base, shuffle, cleanText, sfx, left, waiting } from './party.js?v=68';

// 96 cards, each a little scene: a big subject, two smaller things and a sky.
const BIG = '🐋 🦉 🏰 🌙 🎈 🦊 🗝️ 🐢 🍄 🚂 🪐 🦋 ⛵ 🌋 🐘 🎭 🕰️ 🦩 🌵 🐙 🚪 🪁 🧸 🕯️'.split(' ');
const SMALL = '⭐ ☁️ 🌧️ ❄️ 🔥 🌈 💧 🌸 🍂 ⚡ 🎶 🫧 🪶 🌀 💎 🪺 🐚 🍃'.split(' ');
const SKY = [['#2b1d52', '#e07a5f'], ['#0b3d5c', '#7ad0c4'], ['#3a0d3a', '#f2b5d4'], ['#11203a', '#4a6aa8'], ['#3b2a10', '#f2c46e'], ['#0e3a2a', '#9fd3a0'], ['#4a1020', '#f28a5a'], ['#1a1a2a', '#8888c8']];
export const CARDS = Array.from({ length: 96 }, (_, i) => ({ big: BIG[i % BIG.length], a: SMALL[(i * 5 + 3) % SMALL.length], b: SMALL[(i * 11 + 7) % SMALL.length], sky: SKY[(i * 3 + Math.floor(i / BIG.length)) % SKY.length], flip: i % 2 }));
export const art = i => { const c = CARDS[i]; return `<span class="dc-art" style="--a:${c.sky[0]};--b:${c.sky[1]}"><i class="s1">${c.a}</i><b class="${c.flip ? 'f' : ''}">${c.big}</b><i class="s2">${c.b}</i></span>`; };

export function createGame(settings, players) {
  const g = base(settings, players, { target: 25 });
  g.deck = shuffle([...CARDS.keys()]);
  g.hand = g.seats.map((_, s) => (g.order.includes(s) ? g.deck.splice(0, 6) : []));
  g.round = 0;
  startRound(g);
  return g;
}
export const teller = g => g.order[(g.round - 1) % g.order.length];
const others = g => g.order.filter(s => s !== teller(g));
function startRound(g) {
  g.round++;
  g.pick = {};
  g.sel = null;
  g.clue = '';
  g.done = {};
  g.phase = 'tell';
  g.endAt = 0;
  g.moveId++;
}
export const collecting = g => g.phase === 'match' || g.phase === 'vote';
export const turnSeat = g => (g.phase === 'tell' ? teller(g) : -1);
export const pending = g => (g.phase === 'tell' ? [teller(g)] : collecting(g) ? waiting(g, others(g)) : []);
export const current = g => pending(g)[0] ?? -1;

function toVote(g) {
  for (const s of others(g)) if (g.pick[s] == null) g.pick[s] = g.hand[s][0];   // out of time: first card
  g.table = shuffle(g.order.map(s => ({ s, c: g.pick[s] })));
  g.votes = {};
  g.done = {};
  g.phase = 'vote';
  g.endAt = Date.now() + 60000;
  g.moveId++;
}
function reveal(g) {
  const T = teller(g), ti = g.table.findIndex(x => x.s === T);
  const finders = others(g).filter(s => g.votes[s] === ti);
  g.gain = {};
  for (const s of g.order) g.gain[s] = 0;
  if (finders.length === 0 || finders.length === others(g).length) for (const s of others(g)) g.gain[s] += 2;
  else { g.gain[T] += 3; for (const s of finders) g.gain[s] += 3; }
  for (const [s, i] of Object.entries(g.votes)) { const owner = g.table[i].s; if (owner !== T && owner !== Number(s)) g.gain[owner] += 1; }
  for (const s of g.order) g.score[s] += g.gain[s];
  // Played cards leave; everyone draws back up to six.
  for (const s of g.order) { g.hand[s].splice(g.hand[s].indexOf(g.pick[s]), 1); if (g.deck.length) g.hand[s].push(g.deck.pop()); }
  g.finders = finders;
  sfx(g, 'chime');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'tell') {
    if (seat !== teller(g)) return 'The storyteller is choosing';
    if (a.type === 'back') { g.sel = null; g.moveId++; return null; }
    if (a.type === 'pick') { if (!g.hand[seat].includes(Number(a.v))) return 'Pick one of your cards'; g.sel = Number(a.v); g.moveId++; return null; }
    if (a.type === 'answer') {
      if (g.sel == null) return 'Pick a card first';
      const t = cleanText((a.vals || [])[0], 60);
      if (!t) return 'Give a clue';
      g.clue = t;
      g.pick[seat] = g.sel;
      g.phase = 'match';
      g.endAt = Date.now() + 60000;
      sfx(g, 'chime');
      g.moveId++;
      return null;
    }
  }
  if (g.phase === 'match' && a.type === 'pick') {
    if (!others(g).includes(seat)) return 'Wait for the others';
    if (g.done[seat]) return 'Already chosen';
    if (!g.hand[seat].includes(Number(a.v))) return 'Pick one of your cards';
    g.pick[seat] = Number(a.v);
    g.done[seat] = true;
    if (!waiting(g, others(g)).length) toVote(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'vote' && a.type === 'pick') {
    if (!others(g).includes(seat)) return 'The storyteller doesn’t vote';
    if (g.done[seat]) return 'Already voted';
    const i = Number(a.v);
    if (!g.table[i]) return 'Vote for a card';
    if (g.table[i].s === seat) return "That's your own card";
    g.votes[seat] = i;
    g.done[seat] = true;
    if (!waiting(g, others(g)).length) reveal(g); else g.moveId++;
    return null;
  }
  return 'Not now';
}
export function tick(g) {
  if (g.phase === 'match') return { ms: Math.max(0, g.endAt - Date.now()) + 1000, run: () => toVote(g) };
  if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 10000 - Date.now()), run: () => {
    const top = Math.max(...g.order.map(s => g.score[s]));
    if (top >= g.settings.target || g.hand[g.order[0]].length < 6) { g.winners = g.order.filter(s => g.score[s] === top); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; return; }
    startRound(g);
  } };
  return null;
}
export function botAction(g, seat) {
  if (g.phase === 'tell') return g.sel == null ? { type: 'pick', v: g.hand[seat][0] } : { type: 'answer', vals: ['dreamy'] };
  if (g.phase === 'match') return { type: 'pick', v: g.hand[seat][Math.floor(Math.random() * g.hand[seat].length)] };
  const ok = g.table.map((x, i) => i).filter(i => g.table[i].s !== seat);
  return { type: 'pick', v: ok[Math.floor(Math.random() * ok.length)] };
}

const cardOpt = (c, extra = {}) => ({ v: c, art: art(c), cls: 'dc-card', ...extra });
export function viewFor(g, seat) {
  const T = teller(g), me = seat === T, h = g.hand[seat] || [];
  const v = { phase: g.phase, moveId: g.moveId, left: collecting(g) ? left(g) : 0, hud: [['Points', `${g.score[seat] ?? 0}/${g.settings.target}`], ['Deck', g.deck.length]] };
  const clue = g.clue ? { kicker: `@${T}@’s clue`, big: `“${g.clue}”` } : null;
  if (g.phase === 'tell') {
    if (!me) v.ui = { k: 'wait', title: `@${T}@ is the storyteller`, sub: 'Waiting for their clue…', html: `<div class="pp-opts cards grid" style="--cols:3">${h.map(c => `<span class="pp-opt dc-card">${art(c)}</span>`).join('')}</div>` };
    else if (g.sel == null) v.ui = { k: 'pick', key: 't' + g.round, title: 'You’re the storyteller', sub: 'Pick a card for your clue', myturn: true, buzz: true, cards: true, grid: 3, options: h.map(c => cardOpt(c)) };
    else v.ui = { k: 'fields', key: 'c' + g.round + ':' + g.sel, title: 'Now give a clue', sub: 'Not too obvious, not too obscure!', myturn: true, html: `<div class="dc-chosen">${art(g.sel)}</div>`, fields: [{ ph: 'A word, a phrase, a feeling…', max: 60 }], submit: 'Tell the table', need: 1, buttons: [{ type: 'back', label: '‹ Choose another card' }] };
  } else if (g.phase === 'match') v.ui = me ? { k: 'wait', title: 'Everyone is choosing a card for your clue', sub: `Waiting for ${waiting(g, others(g)).length}…`, card: clue }
    : g.done[seat] ? { k: 'wait', title: 'Card played ✓', sub: `Waiting for ${waiting(g, others(g)).length} more…`, card: clue }
      : { k: 'pick', key: 'm' + g.round, title: 'Which of your cards fits the clue?', sub: 'Fool the others into voting for it', myturn: true, buzz: true, card: clue, cards: true, grid: 3, options: h.map(c => cardOpt(c)) };
  else if (g.phase === 'vote') v.ui = me ? { k: 'wait', title: 'Everyone is voting…', sub: 'Will they find yours?', card: clue }
    : g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g, others(g)).length} more…`, card: clue }
      : { k: 'pick', key: 'v' + g.round, title: `Which card is @${T}@’s?`, sub: 'Not your own!', myturn: true, card: clue, cards: true, grid: 3, options: g.table.map((x, i) => cardOpt(x.c, { v: i, sub: String(i + 1), dis: x.s === seat })) };
  else if (g.phase === 'reveal') v.ui = { k: 'wait', title: `+${g.gain[seat]} this round`, sub: `${g.score[seat]} points`, card: clue };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Sweet dreams — you win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
