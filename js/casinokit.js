// The casino kit: everyone has their own chip stack. Each round, everyone places bets on their
// phone at the same time (pick a chip size, tap the spots), then the table spins/rolls/races and
// pays out. A game supplies:
//   spots(g, seat)  → [{ id, label, sub?, cls? }]   where you can bet (cols: grid width)
//   outcome(g)      → the result, stored as g.out
//   pays(g, spotId) → what a 1-chip bet on that spot returns (0 = lost, 1 = stake back, 2 = even money…)
//   pickMode        → instead of spots, pick up to `maxPicks` numbers and stake one wager (keno-style)
//   payPicks(g, picks) → return per chip for a pick-mode ticket
// Options: chips (start), rounds, spinMs, minBet.
import { base, sfx, left, waiting, announce } from './party.js?v=68';

export const CHIPS = [5, 25, 100, 500];
export function casinoEngine(G) {
  const E = {};
  E.createGame = (settings, players) => {
    const g = base(settings, players, { chips: G.chips || 500, rounds: G.rounds || 10 });
    g.bank = g.seats.map(x => (x ? g.settings.chips : 0));
    g.chip = g.seats.map(() => 5);
    g.round = 0;
    g.history = [];
    G.init?.(g);
    startBets(g);
    return g;
  };
  const inGame = g => g.order.filter(s => g.bank[s] > 0 || staked(g, s) > 0);
  const staked = (g, s) => Object.values(g.bets?.[s] || {}).reduce((a, b) => a + b, 0) + (g.ticket?.[s]?.stake || 0);
  function startBets(g) {
    g.round++;
    g.bets = g.seats.map(() => ({}));
    g.ticket = g.seats.map(() => ({ picks: [], stake: 0 }));
    g.done = {};
    G.newRound?.(g);
    g.phase = 'bet';
    g.endAt = Date.now() + (G.betSecs || 30) * 1000;
    g.moveId++;
  }
  E.collecting = g => g.phase === 'bet';
  E.turnSeat = () => -1;
  const bettors = g => g.order.filter(s => g.bank[s] > 0);
  E.pending = g => (g.phase === 'bet' ? waiting(g, bettors(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 1200 + Math.random() * 2500;

  function spin(g) {
    g.out = G.outcome(g);
    g.phase = 'spin';
    g.spinAt = Date.now();
    g.endAt = 0;
    sfx(g, 'thud');
    g.moveId++;
  }
  function settle(g) {
    g.win = g.seats.map(() => 0);
    for (const s of g.order) {
      let back = 0;
      for (const [id, amt] of Object.entries(g.bets[s])) back += amt * G.pays(g, id, s);
      if (G.pickMode && g.ticket[s].stake) back += g.ticket[s].stake * G.payPicks(g, g.ticket[s].picks);
      back = Math.floor(back);
      g.win[s] = back - staked(g, s);
      g.bank[s] += back;
    }
    g.history.unshift(G.summary ? G.summary(g) : '');
    g.history = g.history.slice(0, 8);
    const best = g.order.reduce((b, s) => (g.win[s] > (g.win[b] ?? -1e9) ? s : b), g.order[0]);
    if (g.win[best] > 0) { announce(g, best, `+${g.win[best]} 🎉`); sfx(g, 'chime'); } else sfx(g, 'sad');
    g.phase = 'payout';
    g.payAt = Date.now();
    g.moveId++;
  }
  function end(g) {
    g.order.forEach(s => { g.score[s] = g.bank[s]; });
    const top = Math.max(...g.order.map(s => g.bank[s]));
    g.winners = g.order.filter(s => g.bank[s] === top);
    g.winner = g.winners[0];
    g.phase = 'over';
    g.moveId++;
  }

  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'bet') return 'Bets are closed';
    if (!g.order.includes(seat)) return "You're not in this game";
    if (g.done[seat]) return 'Your bets are in';
    if (a.type === 'chip') { if (!CHIPS.includes(Number(a.v))) return 'Pick a chip'; g.chip[seat] = Number(a.v); g.moveId++; return null; }
    if (a.type === 'clear') { g.bank[seat] += staked(g, seat); g.bets[seat] = {}; g.ticket[seat] = { picks: [], stake: 0 }; g.moveId++; return null; }
    if (a.type === 'done') {
      if (!staked(g, seat)) { g.done[seat] = true; if (!E.pending(g).length) spin(g); else g.moveId++; return null; }
      if (G.pickMode && g.ticket[seat].stake && !g.ticket[seat].picks.length) return `Pick some numbers first`;
      g.done[seat] = true;
      if (!E.pending(g).length) spin(g); else g.moveId++;
      return null;
    }
    if (G.pickMode && a.type === 'toggle') {
      const n = Number(a.v), T = g.ticket[seat];
      if (T.picks.includes(n)) T.picks = T.picks.filter(x => x !== n);
      else { if (T.picks.length >= G.maxPicks) return `Up to ${G.maxPicks} numbers`; T.picks.push(n); }
      g.moveId++;
      return null;
    }
    if (G.pickMode && a.type === 'stake') {
      const c = g.chip[seat];
      if (g.bank[seat] < c) return 'Not enough chips';
      g.bank[seat] -= c; g.ticket[seat].stake += c; g.moveId++; return null;
    }
    if (a.type === 'pick' || a.type === 'bet') {
      const id = String(a.v);
      if (!G.spots(g, seat).some(sp => String(sp.id) === id && !sp.dis)) return 'You can’t bet there';
      const c = Math.min(g.chip[seat], g.bank[seat]);
      if (c <= 0) return 'Out of chips';
      if (G.maxBet && (g.bets[seat][id] || 0) + c > G.maxBet) return `Table limit is ${G.maxBet}`;
      g.bank[seat] -= c;
      g.bets[seat][id] = (g.bets[seat][id] || 0) + c;
      g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'bet') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => spin(g) };
    if (g.phase === 'spin') return { ms: Math.max(0, g.spinAt + (G.spinMs || 4000) - Date.now()), run: () => settle(g) };
    if (g.phase === 'payout') return { ms: Math.max(0, g.payAt + 5000 - Date.now()), run: () => (g.round >= g.settings.rounds || !bettors(g).length ? end(g) : startBets(g)) };
    return null;
  };
  E.botAction = (g, seat) => {
    if (staked(g, seat) >= Math.min(60, g.bank[seat] + staked(g, seat)) || Math.random() < 0.25) return { type: 'done' };
    if (G.pickMode) {
      if (g.ticket[seat].picks.length < 4) { const free = G.numbers.filter(n => !g.ticket[seat].picks.includes(n)); return { type: 'toggle', v: free[Math.floor(Math.random() * free.length)] }; }
      return { type: 'stake' };
    }
    const sp = G.spots(g, seat).filter(x => !x.dis);
    const fav = G.botSpots ? G.botSpots(g, sp) : sp;
    if (!fav.length) return { type: 'done' };
    return { type: 'pick', v: fav[Math.floor(Math.random() * fav.length)].id };
  };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'bet' ? left(g) : 0, hud: [['Chips', `🪙 ${g.bank[seat] ?? 0}`], ['Round', `${g.round}/${g.settings.rounds}`], ['On the table', staked(g, seat)]] };
    if (g.phase === 'bet') {
      if (!g.bank[seat] && !staked(g, seat)) { v.ui = { k: 'wait', title: 'Out of chips 😢', sub: 'Watch the others play on' }; return v; }
      if (g.done[seat]) { v.ui = { k: 'wait', title: staked(g, seat) ? `Bets in: ${staked(g, seat)} ✓` : 'Sitting this one out', sub: `Waiting for ${E.pending(g).length} more…`, html: G.myBets ? G.myBets(g, seat) : '' }; return v; }
      const chipBtns = CHIPS.filter(c => c <= Math.max(5, g.bank[seat])).map(c => ({ type: 'chip', label: `${g.chip[seat] === c ? '● ' : ''}${c}`, payload: { v: c }, cls: 'cs-chip c' + c }));
      if (G.pickMode) {
        const T = g.ticket[seat];
        v.ui = { k: 'toggles', key: 'b' + g.round, title: `Pick up to ${G.maxPicks} numbers`, sub: `${T.picks.length} picked · ticket ${T.stake}`, myturn: true, buzz: true, grid: G.cols || 8,
          options: G.numbers.map(n => ({ v: n, label: String(n), on: T.picks.includes(n), cls: 'cs-num' })),
          buttons: [...chipBtns, { type: 'stake', label: `Stake +${g.chip[seat]}`, go: true }, { type: 'clear', label: 'Clear' }, { type: 'done', label: T.stake ? 'Done ✓' : 'Skip round', go: !!T.stake }] };
        v.ui.act = 'toggle';
        return v;
      }
      v.ui = { k: 'pick', key: 'b' + g.round, act: 'pick', title: G.betTitle || 'Place your bets', sub: `Chip: ${g.chip[seat]} · tap a spot to bet`, myturn: true, buzz: true, grid: G.cols || 3, html: G.betInfo ? G.betInfo(g, seat) : '',
        options: G.spots(g, seat).map(sp => ({ v: sp.id, label: sp.label, sub: g.bets[seat][sp.id] ? `🪙 ${g.bets[seat][sp.id]}` : sp.sub || '', cls: `cs-spot ${sp.cls || ''} ${g.bets[seat][sp.id] ? 'has' : ''}`, dis: sp.dis })),
        buttons: [...chipBtns, { type: 'clear', label: 'Clear' }, { type: 'done', label: staked(g, seat) ? 'Done ✓' : 'Skip round', go: !!staked(g, seat) }] };
      v.ui.key = 'b' + g.round;  // same key all betting round: options refresh, no buzz
      return v;
    }
    if (g.phase === 'spin') v.ui = { k: 'wait', title: G.spinTitle || 'No more bets!', sub: 'Watch the table…', html: G.myBets ? G.myBets(g, seat) : '' };
    else if (g.phase === 'payout') v.ui = { k: 'wait', title: g.win[seat] > 0 ? `You won ${g.win[seat]}! 🎉` : g.win[seat] < 0 ? `Lost ${-g.win[seat]}` : 'Even this round', sub: G.summary ? G.summary(g) : '' };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Biggest stack — you win!' : 'Game over', sub: `You finished with ${g.bank[seat]}` };
    return v;
  };
  E.G = G;
  E.staked = staked;
  return E;
}
