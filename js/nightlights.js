// Night Lights: a team game of fireworks. Build five rockets — one per colour — from 1 up to 5.
// The twist: your phone shows everyone's cards EXCEPT your own. On your turn either play a card
// (it must be the next number for its colour, or a fuse burns), discard one (gets a hint token
// back), or spend a hint token to tell a teammate about all their cards of one colour or one
// number. Three burnt fuses and the show is over. Score = the cards in the rockets (25 is perfect).
import { base, shuffle, sfx, announce } from './party.js?v=68';

export const COLORS = [{ n: 'Red', c: '#e8473c' }, { n: 'Gold', c: '#f2c230' }, { n: 'Green', c: '#3fb35c' }, { n: 'Blue', c: '#3d8be8' }, { n: 'Violet', c: '#a05ad8' }];
const COUNTS = [0, 3, 2, 2, 2, 1];

export function createGame(settings, players) {
  const g = base(settings, players, {});
  const deck = [];
  COLORS.forEach((_, c) => { for (let n = 1; n <= 5; n++) for (let k = 0; k < COUNTS[n]; k++) deck.push({ c, n }); });
  g.deck = shuffle(deck);
  const size = g.order.length <= 3 ? 5 : 4;
  g.hand = g.seats.map((_, s) => (g.order.includes(s) ? Array.from({ length: size }, () => fresh(g.deck.pop())) : []));
  g.fw = [0, 0, 0, 0, 0];
  g.hints = 8;
  g.fuses = 0;
  g.discards = [];
  g.turn = g.order[0];
  g.finalTurns = null;
  g.sel = null;
  g.log = [];
  g.phase = 'play';
  return g;
}
const fresh = card => ({ ...card, kc: null, kn: null });
export const points = g => g.fw.reduce((a, b) => a + b, 0);
export const pending = g => (g.phase === 'play' ? [g.turn] : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => (g.phase === 'play' ? g.turn : -1);
export const collecting = () => false;
const say = (g, t) => { g.log.unshift(t); g.log = g.log.slice(0, 4); };

function endTurn(g, seat) {
  g.sel = null;
  if (g.fuses >= 3 || points(g) === 25) return finish(g);
  if (g.finalTurns != null && --g.finalTurns <= 0) return finish(g);
  if (!g.deck.length && g.finalTurns == null) g.finalTurns = g.order.length;
  g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
  g.moveId++;
}
function finish(g) {
  g.phase = 'over';
  g.order.forEach(s => { g.score[s] = points(g); });
  g.winners = g.fuses >= 3 ? [] : [...g.order];
  sfx(g, g.fuses >= 3 ? 'sad' : 'chime');
  g.moveId++;
}
function drawInto(g, seat, i) { g.hand[seat].splice(i, 1); if (g.deck.length) g.hand[seat].push(fresh(g.deck.pop())); }

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  if (a.type === 'back') { g.sel = null; g.moveId++; return null; }
  if (a.type === 'mode') {
    if (a.m === 'discard' && g.hints >= 8) return 'All 8 hint tokens are back — you can’t discard';
    if (a.m === 'hint' && g.hints < 1) return 'No hint tokens left';
    g.sel = { m: a.m }; g.moveId++; return null;
  }
  if (a.type !== 'pick' || !g.sel) return 'Choose what to do first';
  const v = a.v;
  if (g.sel.m === 'play' || g.sel.m === 'discard') {
    const i = Number(v), card = g.hand[seat][i];
    if (!card) return 'Pick one of your cards';
    if (g.sel.m === 'discard') {
      g.discards.push(card); g.hints++;
      say(g, `@${seat}@ discarded a ${COLORS[card.c].n} ${card.n}`);
    } else if (g.fw[card.c] === card.n - 1) {
      g.fw[card.c] = card.n;
      if (card.n === 5 && g.hints < 8) g.hints++;
      say(g, `@${seat}@ launched ${COLORS[card.c].n} ${card.n} 🎆`);
      announce(g, seat, `🎆 ${COLORS[card.c].n} ${card.n}`);
      sfx(g, 'ding');
    } else {
      g.fuses++; g.discards.push(card);
      say(g, `@${seat}@ played ${COLORS[card.c].n} ${card.n} — fizzle! 🔥`);
      announce(g, seat, '💥 Fizzle!');
      sfx(g, 'buzzer');
    }
    drawInto(g, seat, i);
    return endTurn(g, seat), null;
  }
  // Hints: first the player, then the colour or number.
  if (g.sel.t == null) {
    const t = Number(v);
    if (t === seat || !g.order.includes(t)) return 'Hint a teammate';
    g.sel.t = t; g.moveId++; return null;
  }
  const [kind, val] = String(v).split(':'), x = Number(val), T = g.hand[g.sel.t];
  const hit = T.filter(c => (kind === 'c' ? c.c === x : c.n === x));
  if (!hit.length) return 'They have none of those';
  for (const c of hit) { if (kind === 'c') c.kc = x; else c.kn = x; }
  g.hints--;
  const pos = T.map((c, i) => (hit.includes(c) ? i + 1 : 0)).filter(Boolean);
  say(g, `@${seat}@ told @${g.sel.t}@: card${pos.length > 1 ? 's' : ''} ${pos.join(', ')} ${pos.length > 1 ? 'are' : 'is'} ${kind === 'c' ? COLORS[x].n : x + (pos.length > 1 ? 's' : '')}`);
  announce(g, seat, '💡 Hint');
  return endTurn(g, seat), null;
}

export const tick = () => null;

export function botAction(g, seat) {
  const h = g.hand[seat];
  if (!g.sel) {
    const sure = h.findIndex(c => c.kc != null && c.kn != null && g.fw[c.kc] === c.kn - 1);
    const numOk = h.findIndex(c => c.kn != null && c.kc == null && g.fw.every(f => f === c.kn - 1));
    if (sure >= 0 || numOk >= 0) return { type: 'mode', m: 'play' };
    if (g.hints > 0 && botHint(g, seat)) return { type: 'mode', m: 'hint' };
    return g.hints < 8 ? { type: 'mode', m: 'discard' } : { type: 'mode', m: 'hint' };
  }
  if (g.sel.m === 'play') {
    let i = h.findIndex(c => c.kc != null && c.kn != null && g.fw[c.kc] === c.kn - 1);
    if (i < 0) i = h.findIndex(c => c.kn != null && g.fw.every(f => f === c.kn - 1));
    return { type: 'pick', v: Math.max(0, i) };
  }
  if (g.sel.m === 'discard') { const i = h.findIndex(c => c.kc == null && c.kn == null); return { type: 'pick', v: i >= 0 ? i : 0 }; }
  const b = botHint(g, seat) || { t: g.order.find(s => s !== seat), v: `n:${g.hand[g.order.find(s => s !== seat)][0]?.n || 1}` };
  return g.sel.t == null ? { type: 'pick', v: b.t } : { type: 'pick', v: b.v };
}
// A useful hint: someone holds a card that's playable right now and doesn't know it.
function botHint(g, seat) {
  for (let k = 1; k < g.order.length; k++) {
    const t = g.order[(g.order.indexOf(seat) + k) % g.order.length];
    const c = g.hand[t].find(c2 => g.fw[c2.c] === c2.n - 1 && (c2.kc == null || c2.kn == null));
    if (c) return { t, v: c.kn == null ? `n:${c.n}` : `c:${c.c}` };
  }
  return null;
}

export const cardOpt = (c, i) => ({ v: i, color: COLORS[c.c].c, label: String(c.n), cls: 'nl-card' });
// What you know about your own card.
const knownOpt = (c, i) => ({ v: i, color: c.kc != null ? COLORS[c.kc].c : '', label: c.kn != null ? String(c.kn) : '?', sub: `#${i + 1}${c.kc == null ? '' : ''}`, cls: `nl-card own ${c.kc == null ? 'nocol' : ''}` });

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Score', points(g)], ['Hints', `💡${g.hints}`], ['Fuses', '🔥'.repeat(g.fuses) || '—']] };
  const others = g.order.filter(s => s !== seat).map(s => ({ name: `@${s}@`, dot: s, cards: g.hand[s].map(c => ({ label: String(c.n), color: COLORS[c.c].c, cls: 'nl-card', sub: `${c.kc != null ? '●' : ''}${c.kn != null ? '#' : ''}` })) }));
  const mineRow = `<div class="pp-hands"><div class="pp-handrow mine"><span class="nm">Your cards (what you know)</span><div>${(g.hand[seat] || []).map((c, i) => `<span class="pp-mini nl-card own ${c.kc == null ? 'nocol' : ''}" style="${c.kc != null ? `--c:${COLORS[c.kc].c}` : ''}"><b>${c.kn ?? '?'}</b><small>#${i + 1}</small></span>`).join('')}</div></div></div>`;
  const fw = `<div class="nl-fw">${COLORS.map((C, i) => `<span style="--c:${C.c}">${g.fw[i]}</span>`).join('')}</div>`;
  if (g.phase === 'over') { v.ui = { k: 'wait', title: g.fuses >= 3 ? 'The show fizzled 💥' : `Show over: ${points(g)}/25`, sub: 'Look at the table to play again' }; return v; }
  if (g.turn !== seat) { v.ui = { k: 'wait', title: `@${g.turn}@’s turn`, sub: 'Your teammates’ cards:', hands: others, html: mineRow + fw }; return v; }
  const S = g.sel;
  if (!S) v.ui = { k: 'buttons', key: 'm' + g.moveId, title: 'Your turn', sub: 'Play, discard, or give a hint', myturn: true, buzz: true, hands: others, html: fw + mineRow, stack: true,
    buttons: [{ type: 'mode', label: 'Play one of my cards', icon: '🎆', go: true, payload: { m: 'play' } }, { type: 'mode', label: `Give a hint (${g.hints} left)`, icon: '💡', dis: g.hints < 1, payload: { m: 'hint' } }, { type: 'mode', label: 'Discard a card (+1 hint)', icon: '🗑️', dis: g.hints >= 8, payload: { m: 'discard' } }] };
  else if (S.m === 'play' || S.m === 'discard') v.ui = { k: 'pick', key: 's' + g.moveId, title: S.m === 'play' ? 'Which card do you play?' : 'Which card do you discard?', sub: 'You can’t see them — only what you’ve been told', myturn: true, cards: true, grid: 5, html: fw,
    options: g.hand[seat].map(knownOpt), buttons: [{ type: 'back', label: '‹ Back' }] };
  else if (S.t == null) v.ui = { k: 'pick', key: 'h' + g.moveId, title: 'Hint who?', myturn: true, hands: others, options: g.order.filter(s => s !== seat).map(s => ({ v: s, dot: s, label: `@${s}@` })), buttons: [{ type: 'back', label: '‹ Back' }] };
  else {
    const T = g.hand[S.t];
    const cols = [...new Set(T.map(c => c.c))].sort(), nums = [...new Set(T.map(c => c.n))].sort();
    v.ui = { k: 'pick', key: 'k' + g.moveId, title: `Tell @${S.t}@ about…`, sub: 'Every card of that colour or number is pointed out', myturn: true, hands: others.filter(h => h.dot === S.t), grid: 5, cards: true,
      options: [...cols.map(c => ({ v: `c:${c}`, color: COLORS[c].c, label: COLORS[c].n, cls: 'nl-card' })), ...nums.map(n => ({ v: `n:${n}`, label: String(n), cls: 'nl-card plain' }))], buttons: [{ type: 'back', label: '‹ Back' }] };
  }
  return v;
}
