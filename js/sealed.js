// Sealed Letter: get your letter to the crown. Everyone holds ONE card in secret on their phone.
// On your turn draw a second card and play one of the two, using its power on another player:
// the Watch guesses someone's card (right = they're out), the Seer peeks at a hand, the Duelist
// compares hands (lower is out), the Shield protects you, the Herald makes someone discard and
// redraw, the Regent swaps hands, the Lady must be played if you hold the Regent or Herald, and
// whoever discards the Heir is out. Last one in — or the highest card when the deck runs out —
// wins a seal. First to the seal target wins.
import { base, shuffle, sfx, announce } from './party.js?v=68';

export const CARDS = [null,
  { n: 'Watch', p: 'Name a card (not a Watch). If that player holds it, they’re out.', c: 5, e: '🔦' },
  { n: 'Seer', p: 'Look at another player’s hand.', c: 2, e: '👁️' },
  { n: 'Duelist', p: 'Compare hands with another player; the lower card is out.', c: 2, e: '⚔️' },
  { n: 'Shield', p: 'You can’t be targeted until your next turn.', c: 2, e: '🛡️' },
  { n: 'Herald', p: 'Choose any player (even you) to discard their hand and draw a new card.', c: 2, e: '📯' },
  { n: 'Regent', p: 'Swap hands with another player.', c: 1, e: '👑' },
  { n: 'Lady', p: 'Must be played if you also hold the Regent or the Herald.', c: 1, e: '💃' },
  { n: 'Heir', p: 'If you play or discard this, you’re out.', c: 1, e: '💌' },
];
const TARGETS = { 1: 'other', 2: 'other', 3: 'other', 5: 'any', 6: 'other' };

export function createGame(settings, players) {
  const g = base(settings, players, { seals: 0 });
  const n = g.order.length;
  g.need = g.settings.seals || (n === 2 ? 5 : n === 3 ? 4 : 3);
  g.lead = g.order[0];
  g.round = 0;
  newRound(g);
  return g;
}
function newRound(g) {
  g.round++;
  g.deck = shuffle(CARDS.flatMap((c, v) => (c ? Array(c.c).fill(v) : [])));
  g.burned = g.deck.pop();
  g.faceUp = g.order.length === 2 ? [g.deck.pop(), g.deck.pop(), g.deck.pop()] : [];
  g.hand = g.seats.map((_, s) => (g.order.includes(s) ? [g.deck.pop()] : []));
  g.out = g.seats.map(() => false);
  g.shield = g.seats.map(() => false);
  g.played = g.seats.map(() => []);
  g.peek = {};
  g.sel = null;
  g.turn = g.lead;
  g.log = [];
  g.phase = 'play';
  draw(g);
  g.moveId++;
}
const live = g => g.order.filter(s => !g.out[s]);
function draw(g) { g.shield[g.turn] = false; g.hand[g.turn].push(g.deck.pop()); }
const say = (g, t) => { g.log.unshift(t); g.log = g.log.slice(0, 5); };
function knockOut(g, s) { g.out[s] = true; g.played[s].push(...g.hand[s]); g.hand[s] = []; sfx(g, 'sad'); }
export const pending = g => (g.phase === 'play' ? [g.turn] : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => (g.phase === 'play' ? g.turn : -1);
export const collecting = () => false;
const mustLady = h => h.includes(7) && (h.includes(5) || h.includes(6));
const targetsFor = (g, seat, v) => (TARGETS[v] === 'any' ? live(g).filter(s => s === seat || !g.shield[s]) : live(g).filter(s => s !== seat && !g.shield[s]));

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  if (a.type === 'back') { g.sel = null; g.moveId++; return null; }
  // Choosing step by step: the card, then (if needed) the player, then (for the Watch) a guess.
  if (a.type === 'pick') {
    const v = Number(a.v);
    if (!g.sel) {
      if (!g.hand[seat].includes(v)) return 'You don’t hold that card';
      if (mustLady(g.hand[seat]) && v !== 7) return 'You must play the Lady';
      g.sel = { v };
      if (!TARGETS[v] || !targetsFor(g, seat, v).length) return play(g, seat), null;
    } else if (g.sel.t == null) {
      if (!targetsFor(g, seat, g.sel.v).includes(v)) return 'Pick someone you can target';
      g.sel.t = v;
      if (g.sel.v !== 1) return play(g, seat), null;
    } else {
      if (!(v >= 2 && v <= 8)) return 'Guess a card from 2 to 8';
      g.sel.guess = v;
      return play(g, seat), null;
    }
    g.moveId++;
    return null;
  }
  return 'Not now';
}

function play(g, seat) {
  const { v, t, guess } = g.sel;
  g.sel = null;
  g.hand[seat].splice(g.hand[seat].indexOf(v), 1);
  g.played[seat].push(v);
  const C = CARDS[v];
  const T = t != null ? `@${t}@` : '';
  g.peek = Object.fromEntries(Object.entries(g.peek).filter(([k]) => Number(k) !== seat));
  if (v === 8) { knockOut(g, seat); say(g, `@${seat}@ gave up the Heir and is out`); }
  else if (t == null && TARGETS[v]) say(g, `@${seat}@ played the ${C.n} — no one to target`);
  else if (v === 1) {
    const hit = g.hand[t][0] === guess;
    say(g, `@${seat}@ (Watch) guessed ${T} holds the ${CARDS[guess].n} — ${hit ? 'right! They’re out' : 'wrong'}`);
    if (hit) knockOut(g, t);
  } else if (v === 2) { g.peek[seat] = { s: t, v: g.hand[t][0] }; say(g, `@${seat}@ (Seer) looked at ${T}’s hand`); }
  else if (v === 3) {
    const a = g.hand[seat][0], b = g.hand[t][0];
    g.peek[seat] = { s: t, v: b }; g.peek[t] = { s: seat, v: a };
    if (a === b) say(g, `@${seat}@ duelled ${T} — a draw`);
    else { const lo = a < b ? seat : t; say(g, `@${seat}@ duelled ${T} — @${lo}@ is out with the ${CARDS[g.hand[lo][0]].n}`); knockOut(g, lo); }
  } else if (v === 4) { g.shield[seat] = true; say(g, `@${seat}@ raised a Shield`); }
  else if (v === 5) {
    const d = g.hand[t].pop();
    g.played[t].push(d);
    if (d === 8) { knockOut(g, t); say(g, `@${seat}@ (Herald) made ${T} discard the Heir — out!`); }
    else { g.hand[t].push(g.deck.length ? g.deck.pop() : g.burned); say(g, `@${seat}@ (Herald) made ${T} discard the ${CARDS[d].n}`); }
  } else if (v === 6) { [g.hand[seat], g.hand[t]] = [g.hand[t], g.hand[seat]]; say(g, `@${seat}@ (Regent) swapped hands with ${T}`); }
  else say(g, `@${seat}@ played the ${C.n}`);
  announce(g, seat, `${C.e} ${C.n}`);
  // Round over?
  const L = live(g);
  if (L.length === 1) return endRound(g, L);
  if (!g.deck.length) {
    const top = Math.max(...L.map(s => g.hand[s][0]));
    let w = L.filter(s => g.hand[s][0] === top);
    if (w.length > 1) { const sum = s => g.played[s].reduce((x, y) => x + y, 0); const m = Math.max(...w.map(sum)); w = w.filter(s => sum(s) === m); }
    return endRound(g, w);
  }
  do g.turn = g.order[(g.order.indexOf(g.turn) + 1) % g.order.length]; while (g.out[g.turn]);
  draw(g);
  g.moveId++;
}
function endRound(g, winners) {
  for (const s of winners) g.score[s]++;
  g.roundWin = winners;
  g.lead = winners[0];
  g.phase = 'result';
  g.resAt = Date.now();
  sfx(g, 'chime');
  g.moveId++;
}

export function tick(g) {
  if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 8000 - Date.now()), run: () => {
    const w = g.order.filter(s => g.score[s] >= g.need);
    if (w.length) { g.winners = w; g.winner = w[0]; g.phase = 'over'; g.moveId++; return; }
    newRound(g);
  } };
  return null;
}

export function botAction(g, seat) {
  const h = g.hand[seat];
  if (!g.sel) {
    let v = mustLady(h) ? 7 : h.filter(x => x !== 8).sort((a, b) => a - b)[0] ?? h[0];
    if (v === 3 && h.find(x => x !== 3) < 4) v = h.find(x => x !== 3);
    return { type: 'pick', v };
  }
  if (g.sel.t == null) { const ts = targetsFor(g, seat, g.sel.v).filter(s => s !== seat); const pool = ts.length ? ts : targetsFor(g, seat, g.sel.v); return { type: 'pick', v: pool[Math.floor(Math.random() * pool.length)] }; }
  const known = g.peek[seat]?.s === g.sel.t ? g.peek[seat].v : null;
  return { type: 'pick', v: known && known !== 1 ? known : 2 + Math.floor(Math.random() * 7) };
}

export const cardOpt = (v, extra = {}) => ({ v, label: `${CARDS[v].e}`, sub: `${v} · ${CARDS[v].n}`, cls: 'sl-card', ...extra });
export function viewFor(g, seat) {
  const h = g.hand[seat] || [], mine = g.phase === 'play' && g.turn === seat;
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Seals', `${g.score[seat] ?? 0}/${g.need}`], ['Deck', g.deck?.length ?? 0]] };
  const pk = g.peek[seat];
  const info = `${pk ? `<p class="sl-peek">👁️ @${pk.s}@ holds the <b>${CARDS[pk.v].n}</b> (${pk.v})</p>` : ''}<ul class="sl-help">${h.map(x => `<li><b>${CARDS[x].e} ${x} ${CARDS[x].n}</b> — ${CARDS[x].p}</li>`).join('')}</ul>`;
  if (g.out[seat] && g.phase === 'play') v.ui = { k: 'wait', title: 'You’re out this round', sub: 'Next round soon' };
  else if (mine && !g.sel) v.ui = { k: 'pick', key: 'c' + g.moveId, title: 'Play a card', sub: mustLady(h) ? 'You must play the Lady' : 'Tap the card to play', myturn: true, buzz: true, cards: true, grid: 2, html: info,
    options: h.map(x => cardOpt(x, { dis: mustLady(h) && x !== 7 })) };
  else if (mine && g.sel.t == null) v.ui = { k: 'pick', key: 't' + g.moveId, title: `${CARDS[g.sel.v].n}: choose a player`, sub: CARDS[g.sel.v].p, myturn: true,
    options: targetsFor(g, seat, g.sel.v).map(s => ({ v: s, dot: s, label: s === seat ? 'Yourself' : `@${s}@` })), buttons: [{ type: 'back', label: '‹ Back' }] };
  else if (mine) v.ui = { k: 'pick', key: 'g' + g.moveId, title: `Guess @${g.sel.t}@’s card`, sub: 'Right and they’re out', myturn: true, cards: true, grid: 4,
    options: [2, 3, 4, 5, 6, 7, 8].map(x => cardOpt(x)), buttons: [{ type: 'back', label: '‹ Back' }] };
  else if (g.phase === 'result') v.ui = { k: 'wait', title: g.roundWin.includes(seat) ? 'You win the round! 💌' : `@${g.roundWin[0]}@ wins the round`, sub: h.length ? `You held the ${CARDS[h[0]].n}` : '' };
  else if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Your letter reached the crown!' : 'Game over', sub: 'Look at the table to play again' };
  else v.ui = { k: 'wait', title: `@${g.turn}@’s turn`, sub: g.shield[seat] ? '🛡️ You’re shielded' : 'Your card:', cards: true, html: `${h.length ? `<div class="pp-opts cards grid" style="--cols:2"><span class="pp-opt sl-card"><span>${CARDS[h[0]].e}</span><small>${h[0]} · ${CARDS[h[0]].n}</small></span></div>` : ''}${info}` };
  return v;
}
