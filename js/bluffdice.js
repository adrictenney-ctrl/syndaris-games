// Bluff Dice: everyone rolls five dice in secret — only you can see yours, on your phone. Take
// turns bidding on how many dice of a face there are under ALL the cups ("six 4s"), each bid higher
// than the last, or call "Liar!" on the bid before you. Ones are wild. The cups lift on the table:
// if the bid was there, the caller loses a die; if not, the bidder does. Lose all your dice and
// you're out. Last player with dice wins.
import { base, sfx, announce } from './party.js?v=68';

const roll = n => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
export function createGame(settings, players) {
  const g = base(settings, players, { dice: 5 });
  g.count = g.seats.map(x => (x ? g.settings.dice : 0));
  g.turnIdx = 0;
  g.round = 0;
  newRound(g);
  return g;
}
const alive = g => g.order.filter(s => g.count[s] > 0);
export const player = g => g.order[g.turnIdx % g.order.length];
function newRound(g) {
  g.round++;
  g.dice = g.seats.map((_, s) => roll(g.count[s]));
  g.bid = null;           // { q, f, by }
  g.stage = {};
  g.phase = 'bid';
  g.reveal = null;
  while (g.count[player(g)] === 0) g.turnIdx++;
  g.moveId++;
}
const total = g => g.order.reduce((t, s) => t + g.count[s], 0);
export const countFace = (g, f) => g.order.reduce((t, s) => t + g.dice[s].filter(d => d === f || d === 1).length, 0);
const beats = (a, b) => !b || a.q > b.q || (a.q === b.q && a.f > b.f);
// The smallest bid you could make on each face.
const minQ = (g, f) => (!g.bid ? 1 : f > g.bid.f ? g.bid.q : g.bid.q + 1);
export const pending = g => (g.phase === 'bid' ? [player(g)] : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => (g.phase === 'bid' ? player(g) : -1);
export const collecting = () => false;

function nextTurn(g) { do g.turnIdx++; while (g.count[player(g)] === 0); }

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'bid' || seat !== player(g)) return "It's not your turn";
  const st = g.stage[seat] || (g.stage[seat] = { f: g.bid ? g.bid.f : 2, q: 0 });
  if (a.type === 'pick') { st.f = Number(a.v); st.q = Math.max(st.q, minQ(g, st.f)); g.moveId++; return null; }
  if (a.type === 'qty') { st.q = Math.max(minQ(g, st.f), Math.min(total(g), (st.q || minQ(g, st.f)) + Number(a.d))); g.moveId++; return null; }
  if (a.type === 'bid') {
    const b = { q: Number(a.q ?? st.q) || minQ(g, Number(a.f ?? st.f)), f: Number(a.f ?? st.f), by: seat };
    if (!(b.f >= 2 && b.f <= 6)) return 'Bid on a face from 2 to 6 (ones are wild)';
    if (b.q > total(g)) return 'There aren’t that many dice';
    if (!beats(b, g.bid)) return 'Your bid has to be higher';
    g.bid = b;
    g.stage = {};
    announce(g, seat, `${b.q} × ${b.f}s`);
    nextTurn(g);
    g.moveId++;
    return null;
  }
  if (a.type === 'call') {
    if (!g.bid) return 'Nobody has bid yet';
    const n = countFace(g, g.bid.f), ok = n >= g.bid.q;
    const loser = ok ? seat : g.bid.by;
    g.reveal = { caller: seat, bid: g.bid, n, ok, loser };
    g.count[loser]--;
    announce(g, seat, 'LIAR! 🫵');
    sfx(g, ok ? 'sad' : 'ding');
    g.phase = 'reveal';
    g.revAt = Date.now();
    // The loser starts the next round (or the next player, if they're out).
    g.turnIdx = g.order.indexOf(loser);
    g.moveId++;
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 7000 - Date.now()), run: () => {
    if (alive(g).length <= 1) { g.order.forEach(s => { g.score[s] = g.count[s]; }); g.winner = alive(g)[0]; g.winners = [g.winner]; g.phase = 'over'; g.moveId++; return; }
    newRound(g);
  } };
  return null;
}

export function botAction(g, seat) {
  const mine = g.dice[seat], others = total(g) - mine.length;
  const expect = f => mine.filter(d => d === f || d === 1).length + others / 3;
  if (g.bid && g.bid.q > expect(g.bid.f) + 0.8 && Math.random() < 0.85) return { type: 'call' };
  // Bid on our best face, as low as allowed.
  let best = null;
  for (let f = 2; f <= 6; f++) { const q = minQ(g, f); const margin = expect(f) - q; if (!best || margin > best.m) best = { f, q, m: margin }; }
  if (g.bid && best.m < -1) return { type: 'call' };
  return { type: 'bid', f: best.f, q: best.q };
}

const FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
export function viewFor(g, seat) {
  const mine = g.dice[seat] || [];
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Your dice', g.count[seat] ?? 0], ['All dice', total(g)]] };
  const dice = `<div class="bd-mine">${mine.map(d => `<i class="bd-die d${d}">${FACE[d]}</i>`).join('')}</div>`;
  const bidTxt = g.bid ? `Bid: ${g.bid.q} × ${FACE[g.bid.f]} (@${g.bid.by}@)` : 'No bid yet';
  if (g.phase === 'bid' && player(g) === seat) {
    const st = g.stage[seat] || { f: g.bid ? g.bid.f : 2, q: 0 };
    const q = Math.max(st.q || 0, minQ(g, st.f));
    v.ui = { k: 'pick', key: 'b' + g.moveId, title: 'Your bid', sub: bidTxt, myturn: true, buzz: true, html: dice, grid: 5,
      options: [2, 3, 4, 5, 6].map(f => ({ v: f, label: FACE[f], sub: `≥${minQ(g, f)}`, on: st.f === f, cls: 'bd-face' })),
      buttons: [{ type: 'qty', label: '−', payload: { d: -1 } }, { type: 'bid', label: `Bid ${q} × ${FACE[st.f]}`, go: true, payload: { q, f: st.f } }, { type: 'qty', label: '+', payload: { d: 1 } }, { type: 'call', label: 'LIAR!', dis: !g.bid, cls: 'bd-liar' }] };
  } else if (g.phase === 'reveal') {
    const R = g.reveal;
    v.ui = { k: 'wait', title: R.loser === seat ? 'You lose a die 🎲' : R.ok ? 'The bid was good' : 'Caught bluffing!', sub: `There were ${R.n} × ${FACE[R.bid.f]} (bid ${R.bid.q})`, html: dice };
  } else if (g.phase === 'over') v.ui = { k: 'wait', title: g.winner === seat ? '🏆 Last cup standing!' : 'Game over', sub: 'Look at the table to play again' };
  else v.ui = { k: 'wait', title: g.count[seat] ? `@${player(g)}@ is bidding` : 'You’re out', sub: bidTxt, html: dice };
  return v;
}
export { FACE };
