// Casino games with a decision after the deal: Liftoff (cash out before the rocket crashes),
// Ride the Bus (guess card by card, cash out or keep riding), Three Card Showdown and Island Stud
// (see your hand on your phone, then play or fold against the dealer on the table).
import { base, shuffle, sfx, left, waiting, announce } from './party.js?v=68';
import { bestHand, describe } from './poker.js?v=68';

const STAKES = [10, 25, 50, 100];
const RANKS = '23456789TJQKA', SUITS = 'SHDC';
const deck = () => shuffle([...SUITS].flatMap(s => [...RANKS].map(r => r + s)));
export const rv = c => RANKS.indexOf(c[0]) + 2;
export const pretty = c => `${c[0] === 'T' ? '10' : c[0]}${{ S: '♠', H: '♥', D: '♦', C: '♣' }[c[1]]}`;
export const isRed = c => c[1] === 'H' || c[1] === 'D';

// Shared: everyone's stack, a stake per round, rounds, the end.
function stakeKit(defaults) {
  const K = {};
  K.create = (settings, players) => { const g = base(settings, players, { chips: 500, rounds: 10, ...defaults }); g.bank = g.seats.map(x => (x ? g.settings.chips : 0)); g.round = 0; return g; };
  K.startStake = (g, secs = 20) => { g.round++; g.stake = g.seats.map(() => 0); g.done = {}; g.phase = 'stake'; g.endAt = Date.now() + secs * 1000; g.moveId++; };
  K.stakeAction = (g, seat, a) => {
    if (a.type === 'stake') { const n = Number(a.v); if (!STAKES.includes(n)) return 'Pick a stake'; const c = Math.min(n, g.bank[seat]); g.bank[seat] -= c; g.stake[seat] += c; g.moveId++; return null; }
    if (a.type === 'clear') { g.bank[seat] += g.stake[seat]; g.stake[seat] = 0; g.moveId++; return null; }
    if (a.type === 'done') { g.done[seat] = true; g.moveId++; return null; }
    return 'Not now';
  };
  K.stakeUI = (g, seat, title) => (g.done[seat] ? { k: 'wait', title: g.stake[seat] ? `In for ${g.stake[seat]} ✓` : 'Sitting out', sub: 'Waiting for the others…' }
    : !g.bank[seat] && !g.stake[seat] ? { k: 'wait', title: 'Out of chips 😢', sub: 'Watch the others' }
      : { k: 'buttons', key: 's' + g.round, title, sub: `Stake: ${g.stake[seat]} · you have ${g.bank[seat]}`, myturn: true, buzz: true, buttons: [...STAKES.filter(n => n <= g.bank[seat]).map(n => ({ type: 'stake', label: `+${n}`, payload: { v: n } })), { type: 'clear', label: 'Clear' }, { type: 'done', label: g.stake[seat] ? 'Done ✓' : 'Sit out', go: !!g.stake[seat] }] });
  K.end = g => { g.order.forEach(s => { g.score[s] = g.bank[s]; }); const top = Math.max(...g.order.map(s => g.bank[s])); g.winners = g.order.filter(s => g.bank[s] === top); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; };
  K.alive = g => g.order.filter(s => g.bank[s] > 0);
  return K;
}

// ---------------------------------------------------------------- Liftoff
const RATE = 0.075;   // the multiplier grows as e^(RATE·seconds)
export const multAt = (g, t = Date.now()) => Math.max(1, Math.floor(Math.exp(RATE * Math.max(0, t - g.flyAt) / 1000) * 100) / 100);
export const liftoff = (() => {
  const K = stakeKit({ rounds: 10 }), E = {};
  E.createGame = (s, p) => { const g = K.create(s, p); g.history = []; K.startStake(g); return g; };
  const riders = g => g.order.filter(s => g.stake[s] > 0 && g.cash[s] == null);
  E.collecting = g => g.phase === 'stake';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'stake' ? waiting(g, K.alive(g)) : g.phase === 'fly' ? riders(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = (g, s) => (g.phase === 'fly' ? Math.max(200, g.flyAt + (Math.log(g.target[s]) / RATE) * 1000 - Date.now()) : 1500 + Math.random() * 2000);
  function launch(g) {
    // Crash point: 3% of flights crash at once, the rest follow 0.97 / (1 − U).
    const u = Math.random();
    g.crash = Math.max(1, Math.floor((0.97 / (1 - u)) * 100) / 100);
    g.flyAt = Date.now() + 1500;
    g.crashAt = g.flyAt + (Math.log(g.crash) / RATE) * 1000;
    g.cash = g.seats.map(() => null);
    g.target = g.seats.map(() => 1.2 + Math.random() * 2.5);
    g.phase = 'fly';
    g.endAt = 0;
    sfx(g, 'thud');
    g.moveId++;
  }
  function crash(g) {
    g.phase = 'crashed';
    g.history.unshift(g.crash);
    g.history = g.history.slice(0, 10);
    g.win = g.seats.map((_, s) => (g.cash[s] != null ? Math.floor(g.stake[s] * g.cash[s]) - g.stake[s] : -g.stake[s]));
    sfx(g, 'buzzer');
    announce(g, -1, `💥 ${g.crash.toFixed(2)}×`);
    g.crashShown = Date.now();
    g.moveId++;
  }
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'stake') { const e = K.stakeAction(g, seat, a); if (!e && !E.pending(g).length) launch(g); return e; }
    if (g.phase === 'fly' && a.type === 'cash') {
      if (!(g.stake[seat] > 0) || g.cash[seat] != null) return 'You’re not riding this one';
      const now = Date.now();
      if (now < g.flyAt) return 'Not off the ground yet!';
      if (now >= g.crashAt) { crash(g); return null; }
      const m = Math.min(g.crash, multAt(g, now));
      g.cash[seat] = m;
      g.bank[seat] += Math.floor(g.stake[seat] * m);
      announce(g, seat, `Cashed out ${m.toFixed(2)}×`);
      sfx(g, 'ding');
      g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'stake') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => launch(g) };
    if (g.phase === 'fly') return { ms: Math.max(0, g.crashAt - Date.now()), run: () => crash(g) };
    if (g.phase === 'crashed') return { ms: Math.max(0, g.crashShown + 4500 - Date.now()), run: () => (g.round >= g.settings.rounds || !K.alive(g).length ? K.end(g) : K.startStake(g)) };
    return null;
  };
  E.botAction = (g, seat) => (g.phase === 'stake' ? (g.stake[seat] ? { type: 'done' } : { type: 'stake', v: 25 }) : { type: 'cash' });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'stake' ? left(g) : 0, hud: [['Chips', `🪙 ${g.bank[seat] ?? 0}`], ['Round', `${g.round}/${g.settings.rounds}`]] };
    if (g.phase === 'stake') v.ui = K.stakeUI(g, seat, 'How much are you riding?');
    else if (g.phase === 'fly') v.ui = !(g.stake[seat] > 0) ? { k: 'wait', title: 'Watching this one', sub: 'Look at the table' }
      : g.cash[seat] != null ? { k: 'wait', title: `Cashed out at ${g.cash[seat].toFixed(2)}× ✓`, sub: `+${Math.floor(g.stake[seat] * g.cash[seat]) - g.stake[seat]}` }
        : { k: 'buttons', key: 'f' + g.round, title: '🚀 Watch the multiplier on the table!', sub: `Riding ${g.stake[seat]} — cash out before it crashes`, myturn: true, buzz: true, buttons: [{ type: 'cash', label: 'CASH OUT', icon: '💰', go: true, cls: 'pp-huge' }] };
    else if (g.phase === 'crashed') v.ui = { k: 'wait', title: g.win[seat] > 0 ? `+${g.win[seat]} 🎉` : g.stake[seat] ? `Lost ${g.stake[seat]} 💥` : 'Crashed!', sub: `It blew at ${g.crash.toFixed(2)}×` };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Top pilot!' : 'Game over', sub: `You finished with ${g.bank[seat]}` };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Ride the Bus
export const BUS_STAGES = [
  { q: 'Red or black?', opts: ['Red', 'Black'], mult: 2 },
  { q: 'Higher or lower than the first card?', opts: ['Higher', 'Lower'], mult: 3 },
  { q: 'Inside or outside the first two?', opts: ['Inside', 'Outside'], mult: 4 },
  { q: 'Which suit?', opts: ['♠ Spades', '♥ Hearts', '♦ Diamonds', '♣ Clubs'], mult: 20 },
];
export const ridethebus = (() => {
  const K = stakeKit({ rounds: 6 }), E = {};
  E.createGame = (s, p) => { const g = K.create(s, p); K.startStake(g); return g; };
  const riding = g => g.order.filter(s => g.stake[s] > 0 && g.state[s] === 'ride');
  E.collecting = g => g.phase === 'stake' || g.phase === 'guess';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'stake' ? waiting(g, K.alive(g)) : g.phase === 'guess' ? waiting(g, riding(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  function begin(g) {
    g.deck = deck();
    g.cards = [];
    g.state = g.seats.map((_, s) => (g.stake[s] > 0 ? 'ride' : 'out'));
    g.stage = 0;
    if (!riding(g).length) return afterRound(g);
    toGuess(g);
  }
  function toGuess(g) { g.choice = {}; g.done = {}; g.phase = 'guess'; g.endAt = Date.now() + 20000; g.moveId++; }
  function correct(g, c) {
    const [a, b] = g.cards, st = g.stage;
    if (st === 0) return isRed(c) ? 0 : 1;
    if (st === 1) return rv(c) > rv(a) ? 0 : rv(c) < rv(a) ? 1 : -1;
    if (st === 2) { const lo = Math.min(rv(a), rv(b)), hi = Math.max(rv(a), rv(b)); return rv(c) > lo && rv(c) < hi ? 0 : rv(c) < lo || rv(c) > hi ? 1 : -1; }
    return SUITS.indexOf(c[1]);
  }
  function flip(g) {
    const c = g.deck.pop(), ok = correct(g, c);
    g.cards.push(c);
    for (const s of riding(g)) {
      if (g.choice[s] === 'cash') { g.state[s] = 'cashed'; g.bank[s] += g.stake[s] * (g.stage ? BUS_STAGES[g.stage - 1].mult : 1); continue; }
      if (g.choice[s] == null || g.choice[s] !== ok) g.state[s] = 'bust';
    }
    g.phase = 'flip';
    g.flipAt = Date.now();
    sfx(g, 'thud');
    g.moveId++;
  }
  function afterFlip(g) {
    g.stage++;
    // Made it to the end: paid in full.
    if (g.stage >= 4) { for (const s of riding(g)) { g.state[s] = 'cashed'; g.bank[s] += g.stake[s] * BUS_STAGES[3].mult; announce(g, s, `🚌 ×${BUS_STAGES[3].mult}!`); } return afterRound(g); }
    if (!riding(g).length) return afterRound(g);
    toGuess(g);
  }
  function afterRound(g) { g.phase = 'roundEnd'; g.endShown = Date.now(); g.moveId++; }
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'stake') { const e = K.stakeAction(g, seat, a); if (!e && !E.pending(g).length) begin(g); return e; }
    if (g.phase === 'guess') {
      if (!riding(g).includes(seat)) return 'You’re off the bus';
      if (g.done[seat]) return 'Already chosen';
      if (a.type === 'cash') { if (!g.stage) return 'Nothing to cash yet'; g.choice[seat] = 'cash'; }
      else if (a.type === 'pick') { const i = Number(a.v); if (!(i >= 0 && i < BUS_STAGES[g.stage].opts.length)) return 'Pick one'; g.choice[seat] = i; }
      else return 'Not now';
      g.done[seat] = true;
      if (!E.pending(g).length) flip(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'stake') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => begin(g) };
    if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => flip(g) };
    if (g.phase === 'flip') return { ms: Math.max(0, g.flipAt + 2800 - Date.now()), run: () => afterFlip(g) };
    if (g.phase === 'roundEnd') return { ms: Math.max(0, g.endShown + 4000 - Date.now()), run: () => (g.round >= g.settings.rounds || !K.alive(g).length ? K.end(g) : K.startStake(g)) };
    return null;
  };
  E.botAction = (g, seat) => {
    if (g.phase === 'stake') return g.stake[seat] ? { type: 'done' } : { type: 'stake', v: 25 };
    if (g.stage >= 2 && Math.random() < 0.5) return { type: 'cash' };
    if (g.stage === 1) return { type: 'pick', v: rv(g.cards[0]) <= 8 ? 0 : 1 };
    return { type: 'pick', v: Math.floor(Math.random() * BUS_STAGES[g.stage].opts.length) };
  };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'stake' || g.phase === 'guess' ? left(g) : 0, hud: [['Chips', `🪙 ${g.bank[seat] ?? 0}`], ['Round', `${g.round}/${g.settings.rounds}`]] };
    const cards = g.cards?.length ? { kicker: 'Cards so far', big: g.cards.map(pretty).join('  ') } : null;
    if (g.phase === 'stake') v.ui = K.stakeUI(g, seat, 'Get on the bus?');
    else if (g.phase === 'guess') {
      const st = BUS_STAGES[g.stage];
      if (g.state[seat] !== 'ride') v.ui = { k: 'wait', title: g.state[seat] === 'cashed' ? 'Cashed out ✓' : g.state[seat] === 'bust' ? 'Bust 🚏' : 'Not riding', sub: 'Watch the others', card: cards };
      else if (g.done[seat]) v.ui = { k: 'wait', title: 'Locked in ✓', sub: 'Waiting for the flip…', card: cards };
      else v.ui = { k: 'pick', key: 'g' + g.round + ':' + g.stage, title: st.q, sub: `Right pays ×${st.mult}${g.stage ? ` · cash out now for ×${BUS_STAGES[g.stage - 1].mult}` : ''}`, myturn: true, buzz: true, card: cards, grid: 2, big: true,
        options: st.opts.map((o, i) => ({ v: i, label: o })), buttons: g.stage ? [{ type: 'cash', label: `💰 Cash out ×${BUS_STAGES[g.stage - 1].mult} (${g.stake[seat] * BUS_STAGES[g.stage - 1].mult})` }] : null };
    } else if (g.phase === 'flip' || g.phase === 'roundEnd') v.ui = { k: 'wait', title: g.state[seat] === 'bust' ? 'Bust! 🚏' : g.state[seat] === 'cashed' ? 'Off the bus with your winnings 💰' : g.state[seat] === 'ride' ? 'Still riding! 🚌' : 'Watching', sub: '', card: cards };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: `You finished with ${g.bank[seat]}` };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Three Card Showdown & Island Stud
function three(cards) {
  // Rank a 3-card hand: [category, …tiebreak]; straight flush 5, trips 4, straight 3, flush 2, pair 1, high 0.
  const v = cards.map(rv).sort((a, b) => b - a);
  const flush = cards.every(c => c[1] === cards[0][1]);
  const straight = (v[0] - v[1] === 1 && v[1] - v[2] === 1) || (v[0] === 14 && v[1] === 3 && v[2] === 2);
  const top = v[0] === 14 && v[1] === 3 ? 3 : v[0];
  if (straight && flush) return [5, top];
  if (v[0] === v[2]) return [4, v[0]];
  if (straight) return [3, top];
  if (flush) return [2, ...v];
  if (v[0] === v[1] || v[1] === v[2]) { const p = v[1]; return [1, p, v[0] === p ? v[2] : v[0]]; }
  return [0, ...v];
}
const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); return 0; };
export const THREE_NAMES = ['High card', 'Pair', 'Flush', 'Straight', 'Three of a kind', 'Straight flush'];
const ANTE_BONUS = { 3: 1, 4: 4, 5: 5 };
const STUD_PAY = [1, 1, 2, 3, 4, 5, 7, 20, 50];   // by poker category (high card counts as 1:1 when the dealer qualifies)

function dealerGame({ cards, rate, qualify, payPlay, name }) {
  const K = stakeKit({ rounds: 8 }), E = {};
  E.createGame = (s, p) => { const g = K.create(s, p); K.startStake(g); return g; };
  const playing = g => g.order.filter(s => g.stake[s] > 0);
  E.collecting = g => g.phase === 'stake' || g.phase === 'decide';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'stake' ? waiting(g, K.alive(g)) : g.phase === 'decide' ? waiting(g, playing(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  function deal(g) {
    const d = deck();
    g.hand = g.seats.map((_, s) => (g.stake[s] > 0 ? d.splice(0, cards) : []));
    g.dealer = d.splice(0, cards);
    g.choice = {};
    g.done = {};
    if (!playing(g).length) { g.phase = 'result'; g.resAt = Date.now(); g.res = {}; g.moveId++; return; }
    g.phase = 'decide';
    g.endAt = Date.now() + 25000;
    g.moveId++;
  }
  function showdown(g) {
    const dr = rate(g.dealer), q = qualify(dr);
    g.res = {};
    for (const s of playing(g)) {
      const ante = g.stake[s], hr = rate(g.hand[s]);
      if (g.choice[s] !== 'play') { g.res[s] = { win: -ante, what: 'Folded' }; continue; }
      const raise = Math.min(g.bank[s], ante * (cards === 3 ? 1 : 2));
      g.bank[s] -= raise;
      let back = 0, what;
      if (!q) { back = ante * 2 + raise; what = 'Dealer doesn’t qualify'; }
      else { const c = cmp(hr.key, dr.key); if (c > 0) { back = ante * 2 + raise * (1 + payPlay(hr)); what = `You beat the dealer with ${hr.name}`; } else if (c === 0) { back = ante + raise; what = 'Tie — push'; } else what = `Dealer wins with ${dr.name}`; }
      if (cards === 3 && ANTE_BONUS[hr.key[0]]) back += ante * ANTE_BONUS[hr.key[0]];
      g.bank[s] += back;
      g.res[s] = { win: back - ante - raise, what };
    }
    g.dealerName = dr.name;
    g.qual = q;
    g.phase = 'result';
    g.resAt = Date.now();
    sfx(g, 'chime');
    g.moveId++;
  }
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'stake') { const e = K.stakeAction(g, seat, a); if (!e && !E.pending(g).length) deal(g); return e; }
    if (g.phase === 'decide') {
      if (!playing(g).includes(seat)) return 'You’re not in this hand';
      if (g.done[seat]) return 'Already decided';
      if (a.type !== 'play' && a.type !== 'fold') return 'Play or fold';
      if (a.type === 'play' && g.bank[seat] < g.stake[seat] * (cards === 3 ? 1 : 2)) { /* short stack: plays for what's left */ }
      g.choice[seat] = a.type;
      g.done[seat] = true;
      if (!E.pending(g).length) showdown(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'stake') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => deal(g) };
    if (g.phase === 'decide') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => showdown(g) };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 6500 - Date.now()), run: () => (g.round >= g.settings.rounds || !K.alive(g).length ? K.end(g) : K.startStake(g)) };
    return null;
  };
  E.botAction = (g, seat) => {
    if (g.phase === 'stake') return g.stake[seat] ? { type: 'done' } : { type: 'stake', v: 25 };
    const r = rate(g.hand[seat]);
    return { type: r.key[0] > 0 || r.key[1] >= 12 ? 'play' : 'fold' };
  };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, hud: [['Chips', `🪙 ${g.bank[seat] ?? 0}`], ['Round', `${g.round}/${g.settings.rounds}`]] };
    const mine = g.hand?.[seat]?.length ? `<div class="cl-hand">${g.hand[seat].map(c => `<span class="cs-card ${isRed(c) ? 'red' : ''}">${pretty(c)}</span>`).join('')}</div><p class="cl-name">${rate(g.hand[seat]).name}</p>` : '';
    if (g.phase === 'stake') v.ui = K.stakeUI(g, seat, `${name}: your ante`);
    else if (g.phase === 'decide') v.ui = !playing(g).includes(seat) ? { k: 'wait', title: 'Sitting this hand out', sub: '' }
      : g.done[seat] ? { k: 'wait', title: g.choice[seat] === 'play' ? 'Playing ✓' : 'Folded', sub: 'Waiting for the others…', html: mine }
        : { k: 'buttons', key: 'd' + g.round, title: 'Play or fold?', sub: `Playing costs another ${g.stake[seat] * (cards === 3 ? 1 : 2)} · dealer needs ${cards === 3 ? 'Queen high' : 'Ace–King'} to qualify`, myturn: true, buzz: true, html: mine,
          buttons: [{ type: 'fold', label: 'Fold' }, { type: 'play', label: `Play (+${g.stake[seat] * (cards === 3 ? 1 : 2)})`, go: true }] };
    else if (g.phase === 'result') { const r = g.res[seat]; v.ui = { k: 'wait', title: r ? (r.win > 0 ? `+${r.win} 🎉` : r.win < 0 ? `${r.win}` : 'Push') : 'Watching', sub: r ? r.what : '', html: mine }; }
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You beat the house!' : 'Game over', sub: `You finished with ${g.bank[seat]}` };
    return v;
  };
  E.rate = rate;
  E.cards = cards;
  return E;
}
export const threecard = dealerGame({
  cards: 3, name: 'Three Card Showdown',
  rate: c => { const k = three(c); return { key: k, name: THREE_NAMES[k[0]] }; },
  qualify: d => d.key[0] > 0 || d.key[1] >= 12,
  payPlay: () => 1,
});
export const islandstud = dealerGame({
  cards: 5, name: 'Island Stud',
  rate: c => { const h = bestHand(c); return { key: [h.score], cat: h.cat, name: describe(h), tb: h.tb }; },
  qualify: d => d.cat > 0 || (d.tb[0] === 14 && d.tb[1] === 13),
  payPlay: h => STUD_PAY[h.cat] || 1,
});
