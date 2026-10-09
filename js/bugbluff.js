// Bug Bluff: nobody wants bugs. Your hand is on your phone. On your turn, slide a card face down
// to another player and tell them what it is — "This is a spider" — true or not. They either call
// it ("It IS a spider" / "It's NOT a spider") or secretly peek and pass it on to someone who hasn't
// seen it, with a claim of their own. Call it right and the one who passed it takes it face up;
// call it wrong and you take it. Four of the same bug face up in front of you and you lose.
import { base, shuffle, sfx, announce } from './party.js?v=68';

export const BUGS = [{ n: 'Spider', e: '🕷️' }, { n: 'Rat', e: '🐀' }, { n: 'Toad', e: '🐸' }, { n: 'Bat', e: '🦇' }, { n: 'Fly', e: '🪰' }, { n: 'Cockroach', e: '🪳' }, { n: 'Scorpion', e: '🦂' }, { n: 'Beetle', e: '🐞' }];
export function createGame(settings, players) {
  const g = base(settings, players, {});
  const deck = shuffle(BUGS.flatMap((_, b) => Array(8).fill(b)));
  g.hand = g.seats.map(() => []);
  let i = 0;
  while (deck.length) { g.hand[g.order[i % g.order.length]].push(deck.pop()); i++; }
  g.front = g.seats.map(() => BUGS.map(() => 0));
  g.turn = g.order[0];
  g.phase = 'pass';
  g.sel = null;
  g.moving = null;     // { card, from, to, claim, seen: [] }
  return g;
}
export const pending = g => (g.phase === 'pass' ? [g.turn] : g.phase === 'respond' || g.phase === 'repass' ? [g.moving.to] : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => pending(g)[0] ?? -1;
export const collecting = () => false;
const unseen = g => g.order.filter(s => !g.moving.seen.includes(s) && s !== g.moving.to);

function loseCheck(g, s) {
  if (g.front[s].some(n => n >= 4)) return s;
  return -1;
}
function endGame(g, loser) {
  g.loser = loser;
  g.order.forEach(s => { g.score[s] = s === loser ? 0 : 1; });
  g.winners = g.order.filter(s => s !== loser);
  g.phase = 'over';
  sfx(g, 'sad');
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (a.type === 'back') { g.sel = null; g.moveId++; return null; }
  // Passing (first pass of a turn, or passing on after a peek): card → player → claim.
  if (g.phase === 'pass' || g.phase === 'repass') {
    if (seat !== (g.phase === 'pass' ? g.turn : g.moving.to)) return "It's not your turn";
    const v = Number(a.v);
    if (g.phase === 'pass' && !g.sel) {
      if (!g.hand[seat].includes(v)) return 'Pick a card from your hand';
      g.sel = { card: v };
    } else if (g.sel.to == null) {
      const ok = g.phase === 'pass' ? g.order.filter(s => s !== seat) : unseen(g);
      if (!ok.includes(v)) return 'Pass to someone who hasn’t seen it';
      g.sel.to = v;
    } else {
      if (!BUGS[v]) return 'Name a bug';
      if (g.phase === 'pass') { g.hand[seat].splice(g.hand[seat].indexOf(g.sel.card), 1); g.moving = { card: g.sel.card, seen: [seat] }; }
      else g.moving.seen.push(seat);
      Object.assign(g.moving, { from: seat, to: g.sel.to, claim: v });
      g.sel = null;
      announce(g, seat, `“This is a ${BUGS[v].n}” ${BUGS[v].e}`);
      g.phase = 'respond';
    }
    g.moveId++;
    return null;
  }
  if (g.phase === 'respond') {
    if (seat !== g.moving.to) return 'Wait for the bug to reach you';
    if (a.type === 'peek') {
      if (!unseen(g).length) return 'Everyone has seen it — you must call it';
      g.phase = 'repass';
      g.sel = { card: g.moving.card };
      g.moveId++;
      return null;
    }
    if (a.type === 'call') {
      const truth = g.moving.card === g.moving.claim, right = Boolean(a.yes) === truth;
      const taker = right ? g.moving.from : seat;
      g.front[taker][g.moving.card]++;
      g.result = { caller: seat, yes: !!a.yes, right, taker, card: g.moving.card, claim: g.moving.claim, from: g.moving.from };
      announce(g, seat, a.yes ? 'It IS!' : 'It’s NOT!');
      sfx(g, right ? 'ding' : 'buzzer');
      g.phase = 'reveal';
      g.revAt = Date.now();
      g.moveId++;
      return null;
    }
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 4500 - Date.now()), run: () => {
    const t = g.result.taker;
    if (loseCheck(g, t) >= 0) return endGame(g, t);
    g.moving = null;
    g.turn = t;           // whoever took the bug starts next
    if (!g.hand[t].length) return endGame(g, t);
    g.phase = 'pass';
    g.moveId++;
  } };
  return null;
}

export function botAction(g, seat) {
  if (g.phase === 'pass' || g.phase === 'repass') {
    if (!g.sel) return { type: 'pick', v: g.hand[seat][Math.floor(Math.random() * g.hand[seat].length)] };
    if (g.sel.to == null) { const ok = g.phase === 'pass' ? g.order.filter(s => s !== seat) : unseen(g); return { type: 'pick', v: ok[Math.floor(Math.random() * ok.length)] }; }
    return { type: 'pick', v: Math.random() < 0.45 ? g.sel.card : Math.floor(Math.random() * BUGS.length) };
  }
  if (unseen(g).length && Math.random() < 0.25) return { type: 'peek' };
  // Believe it more if few of that bug are already out in the open.
  const shown = g.order.reduce((t, s) => t + g.front[s][g.moving.claim], 0) + g.hand[seat].filter(b => b === g.moving.claim).length;
  return { type: 'call', yes: Math.random() < 0.55 - shown * 0.06 };
}

export const bugOpt = (b, extra = {}) => ({ v: b, label: BUGS[b].e, sub: BUGS[b].n, cls: 'bb-bug', ...extra });
export function viewFor(g, seat) {
  const h = g.hand[seat] || [];
  const counts = BUGS.map((_, b) => h.filter(x => x === b).length);
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Hand', h.length], ['Worst', Math.max(...(g.front[seat] || [0]))]] };
  const handHTML = `<div class="bb-hand">${BUGS.map((B, b) => (counts[b] ? `<span>${B.e}<b>×${counts[b]}</b></span>` : '')).join('')}</div>`;
  const M = g.moving;
  if (g.phase === 'over') { v.ui = { k: 'wait', title: g.loser === seat ? '🐛 Bugged out — you lose' : '🏆 You survived!', sub: `@${g.loser}@ collected four of a kind` }; return v; }
  if ((g.phase === 'pass' && g.turn === seat) || (g.phase === 'repass' && M.to === seat)) {
    const S = g.sel;
    if (g.phase === 'repass' && S.to == null) v.ui = { k: 'pick', key: 'r' + g.moveId, title: `You peeked: it’s a ${BUGS[M.card].n} ${BUGS[M.card].e}`, sub: 'Pass it on to someone who hasn’t seen it', myturn: true, options: unseen(g).map(s => ({ v: s, dot: s, label: `@${s}@` })) };
    else if (!S) v.ui = { k: 'pick', key: 'p' + g.moveId, title: 'Pass a bug', sub: 'Pick a card to slide to someone', myturn: true, buzz: true, cards: true, grid: 4, options: BUGS.map((_, b) => b).filter(b => counts[b]).map(b => bugOpt(b, { sub: `${BUGS[b].n} ×${counts[b]}` })) };
    else if (S.to == null) v.ui = { k: 'pick', key: 't' + g.moveId, title: `Pass your ${BUGS[S.card].n} to…`, myturn: true, options: g.order.filter(s => s !== seat).map(s => ({ v: s, dot: s, label: `@${s}@` })), buttons: [{ type: 'back', label: '‹ Back' }] };
    else v.ui = { k: 'pick', key: 'c' + g.moveId, title: 'What do you say it is?', sub: `It’s really a ${BUGS[S.card].n} — tell the truth or lie`, myturn: true, cards: true, grid: 4, options: BUGS.map((_, b) => bugOpt(b, { on: b === S.card })) };
  } else if (g.phase === 'respond' && M.to === seat) {
    v.ui = { k: 'buttons', key: 'x' + g.moveId, title: `@${M.from}@ says: “It’s a ${BUGS[M.claim].n}” ${BUGS[M.claim].e}`, sub: 'Do you believe them?', myturn: true, buzz: true, html: handHTML, stack: true,
      buttons: [{ type: 'call', label: `It IS a ${BUGS[M.claim].n}`, go: true, payload: { yes: true } }, { type: 'call', label: `It’s NOT a ${BUGS[M.claim].n}`, payload: { yes: false } }, { type: 'peek', label: '👀 Peek and pass it on', dis: !unseen(g).length }] };
  } else if (g.phase === 'reveal') {
    const R = g.result;
    v.ui = { k: 'wait', title: `It was a ${BUGS[R.card].n} ${BUGS[R.card].e}`, sub: R.taker === seat ? 'You take it 😖' : `@${R.taker}@ takes it`, html: handHTML };
  } else v.ui = { k: 'wait', title: M ? `@${M.from}@ → @${M.to}@: “${BUGS[M.claim].n}”` : `@${g.turn}@ is choosing a bug`, sub: 'Your hand:', html: handHTML };
  return v;
}
