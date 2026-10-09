// Petals & Thorns: everyone holds three Petals and one Thorn — secretly, on their phone. Each round
// everyone lays one disc face down on the table, then in turn you add another disc or start a
// challenge: "I can flip 4 Petals". Others raise or pass. The highest bidder flips — their own
// stack first, then the top discs of anyone else's — and must not hit a Thorn. Make it and you
// score; win two challenges to win the game. Hit a Thorn and you lose a disc for good.
import { base, shuffle, sfx, announce } from './party.js?v=68';

export function createGame(settings, players) {
  const g = base(settings, players, {});
  g.hand = g.seats.map(x => (x ? ['P', 'P', 'P', 'T'] : []));   // discs still owned
  g.lead = g.order[0];
  g.round = 0;
  newRound(g);
  return g;
}
const alive = g => g.order.filter(s => g.hand[s].length > 0);
const nextAlive = (g, s, skip = []) => { const o = g.order; let i = o.indexOf(s); for (let k = 0; k < o.length; k++) { i = (i + 1) % o.length; if (g.hand[o[i]].length && !skip.includes(o[i])) return o[i]; } return s; };
function newRound(g) {
  g.round++;
  g.stack = g.seats.map(() => []);   // face-down discs, top last
  g.phase = 'lay';                    // everyone lays their first disc at once
  g.turn = g.lead;
  g.bid = 0; g.bidder = -1; g.passed = [];
  g.flipped = [];                     // [{s, d}]
  g.moveId++;
}
const inHand = (g, s) => { const h = [...g.hand[s]]; for (const d of g.stack[s]) h.splice(h.indexOf(d), 1); return h; };
const onTable = g => g.order.reduce((t, s) => t + g.stack[s].length, 0);
export const pending = g => (g.phase === 'lay' ? alive(g).filter(s => !g.stack[s].length) : ['turn', 'bidding', 'flip'].includes(g.phase) ? [g.turn] : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => (['turn', 'bidding', 'flip'].includes(g.phase) ? g.turn : -1);
export const collecting = () => false;

function lose(g, s, why) {
  // The bidder loses one of their discs at random (if they hit their own Thorn they'd choose — we pick at random).
  const h = g.hand[s];
  h.splice(Math.floor(Math.random() * h.length), 1);
  g.result = { ok: false, by: s, why };
  sfx(g, 'sad');
  endRound(g, s);
}
function endRound(g, s) {
  g.phase = 'result';
  g.resAt = Date.now();
  g.lead = g.hand[s].length ? s : nextAlive(g, s);
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'lay') {
    if (g.stack[seat].length || !g.hand[seat].length) return 'Wait for the others';
    if (!inHand(g, seat).includes(a.v)) return 'You don’t have that disc';
    g.stack[seat].push(a.v);
    if (!pending(g).length) { g.phase = 'turn'; g.turn = g.lead; }
    g.moveId++;
    return null;
  }
  if (seat !== g.turn) return "It's not your turn";
  if (g.phase === 'turn') {
    if (a.type === 'pick') {
      if (!inHand(g, seat).includes(a.v)) return 'You don’t have that disc';
      g.stack[seat].push(a.v);
      g.turn = nextAlive(g, seat);
      g.moveId++;
      return null;
    }
    if (a.type === 'bid') {
      const n = Number(a.n);
      if (!(n >= 1 && n <= onTable(g))) return `Bid between 1 and ${onTable(g)}`;
      g.bid = n; g.bidder = seat; g.passed = [];
      announce(g, seat, `I can flip ${n}!`);
      if (n === onTable(g)) return startFlip(g), null;
      g.phase = 'bidding';
      g.turn = nextAlive(g, seat);
      g.moveId++;
      return null;
    }
  }
  if (g.phase === 'bidding') {
    if (a.type === 'pass') {
      g.passed.push(seat);
      announce(g, seat, 'Pass');
    } else if (a.type === 'bid') {
      const n = Number(a.n);
      if (!(n > g.bid && n <= onTable(g))) return 'Bid higher, or pass';
      g.bid = n; g.bidder = seat;
      announce(g, seat, `${n}!`);
      if (n === onTable(g)) return startFlip(g), null;
    } else return 'Raise or pass';
    const left = alive(g).filter(s => !g.passed.includes(s));
    if (left.length === 1) return startFlip(g), null;
    g.turn = nextAlive(g, seat, g.passed);
    g.moveId++;
    return null;
  }
  if (g.phase === 'flip' && a.type === 'flip') {
    const s = Number(a.v);
    if (g.stack[g.bidder].length) return 'Flip your own stack first';
    if (!g.stack[s]?.length) return 'Nothing to flip there';
    return flipOne(g, s), null;
  }
  return 'Not now';
}
function startFlip(g) {
  g.phase = 'flip';
  g.turn = g.bidder;
  // Your own discs flip first, all of them.
  while (g.stack[g.bidder].length && g.phase === 'flip') flipOne(g, g.bidder);
  if (g.phase === 'flip') g.moveId++;
}
function flipOne(g, s) {
  const d = g.stack[s].pop();
  g.flipped.push({ s, d });
  if (d === 'T') { announce(g, s, '🌵 A Thorn!'); return lose(g, g.bidder, s); }
  sfx(g, 'ding');
  if (g.flipped.length >= g.bid) {
    g.score[g.bidder]++;
    g.result = { ok: true, by: g.bidder };
    announce(g, g.bidder, '🌸 Made it!');
    sfx(g, 'chime');
    return endRound(g, g.bidder);
  }
  g.moveId++;
}

export function tick(g) {
  if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 6000 - Date.now()), run: () => {
    const champ = g.order.find(s => g.score[s] >= 2);
    if (champ != null || alive(g).length === 1) { g.winner = champ ?? alive(g)[0]; g.winners = [g.winner]; g.phase = 'over'; g.moveId++; return; }
    newRound(g);
  } };
  return null;
}

export function botAction(g, seat) {
  const h = inHand(g, seat);
  if (g.phase === 'lay') return { type: 'pick', v: h.includes('T') && Math.random() < 0.3 ? 'T' : h.includes('P') ? 'P' : h[0] };
  if (g.phase === 'turn') {
    if (h.length && Math.random() < 0.45) return { type: 'pick', v: h.includes('P') && Math.random() < 0.7 ? 'P' : h[0] };
    return { type: 'bid', n: Math.min(onTable(g), g.stack[seat].filter(d => d === 'P').length + 1) };
  }
  if (g.phase === 'bidding') return g.bid < g.stack[seat].filter(d => d === 'P').length + 1 && g.bid < onTable(g) && Math.random() < 0.5 ? { type: 'bid', n: g.bid + 1 } : { type: 'pass' };
  if (g.phase === 'flip') { const opts = g.order.filter(s => g.stack[s].length); return { type: 'flip', v: opts[Math.floor(Math.random() * opts.length)] }; }
  return null;
}

const DISC = { P: '🌸', T: '🌵' };
export function viewFor(g, seat) {
  const h = inHand(g, seat);
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Wins', `${g.score[seat] ?? 0}/2`], ['Discs', g.hand[seat]?.length ?? 0]] };
  const mine = `<div class="pt-discs"><small>Your stack (top last):</small>${g.stack[seat]?.map(d => `<i>${DISC[d]}</i>`).join('') || '—'}</div>`;
  const discOpts = ['P', 'T'].filter(d => h.includes(d)).map(d => ({ v: d, label: DISC[d], sub: d === 'P' ? `Petal ×${h.filter(x => x === 'P').length}` : 'Thorn', cls: 'pt-disc' }));
  if (!g.hand[seat]?.length && g.phase !== 'over') v.ui = { k: 'wait', title: 'You’re out of discs', sub: 'Watch the rest play out' };
  else if (g.phase === 'lay') v.ui = g.stack[seat].length ? { k: 'wait', title: 'Laid ✓', sub: 'Waiting for the others', html: mine } : { k: 'pick', key: 'l' + g.round, title: 'Lay your first disc', sub: 'Face down — only you know', myturn: true, buzz: true, grid: 2, options: discOpts };
  else if (g.phase === 'turn' && g.turn === seat) {
    const max = onTable(g);
    v.ui = { k: 'pick', key: 't' + g.moveId, title: 'Add a disc… or challenge', sub: `${max} discs on the table`, myturn: true, buzz: true, html: mine, grid: 2, options: discOpts,
      buttons: Array.from({ length: max }, (_, i) => ({ type: 'bid', label: `Flip ${i + 1}`, payload: { n: i + 1 } })) };
  } else if (g.phase === 'bidding' && g.turn === seat) {
    v.ui = { k: 'buttons', key: 'b' + g.moveId, title: `Bid is ${g.bid} (@${g.bidder}@)`, sub: 'Raise it or pass', myturn: true, buzz: true, html: mine,
      buttons: [{ type: 'pass', label: 'Pass' }, ...Array.from({ length: onTable(g) - g.bid }, (_, i) => ({ type: 'bid', label: `${g.bid + i + 1}`, go: true, payload: { n: g.bid + i + 1 } }))] };
  } else if (g.phase === 'flip' && g.turn === seat) {
    v.ui = { k: 'pick', key: 'f' + g.flipped.length, act: 'flip', title: `Flip ${g.bid - g.flipped.length} more`, sub: 'Pick whose top disc to flip', myturn: true, options: g.order.filter(s => g.stack[s].length).map(s => ({ v: s, dot: s, label: `@${s}@`, sub: `${g.stack[s].length} left` })) };
  } else if (g.phase === 'result') v.ui = { k: 'wait', title: g.result.ok ? `@${g.result.by}@ made it! 🌸` : `@${g.result.by}@ hit a Thorn 🌵`, sub: g.result.ok ? '' : `It was @${g.result.why}@’s`, html: mine };
  else if (g.phase === 'over') v.ui = { k: 'wait', title: g.winner === seat ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  else v.ui = { k: 'wait', title: g.phase === 'flip' ? `@${g.turn}@ is flipping…` : g.phase === 'bidding' ? `Bid: ${g.bid} — @${g.turn}@ to raise or pass` : `@${g.turn}@’s turn`, sub: 'Watch the table', html: mine };
  return v;
}
export { DISC, onTable };
