// Shared pieces for the card games built on the party frame: decks, card text, card options for
// the phone, and a trick-taking engine (deal → optional bidding → tricks → score → next hand).
// Cards are strings: rank + suit, e.g. 'AS', 'TD', '9H'. Ranks: 2–9, T, J, Q, K, A. Suits: S H D C.
import { base, shuffle, sfx, announce } from './party.js?v=68';

export const SUITS = 'SHDC';
export const SYM = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const RANKS = '23456789TJQKA';
export const deck52 = () => shuffle([...SUITS].flatMap(s => [...RANKS].map(r => r + s)));
export const deckOf = ranks => shuffle([...SUITS].flatMap(s => [...ranks].map(r => r + s)));
export const rv = c => RANKS.indexOf(c[0]) + 2;
export const suit = c => c[1];
export const isRed = c => c[1] === 'H' || c[1] === 'D';
export const txt = c => `${c[0] === 'T' ? '10' : c[0]}${SYM[c[1]] || ''}`;
// A card as a phone option (tap to play) or as markup for the table.
export const cardOpt = (c, extra = {}) => ({ v: c, label: c[0] === 'T' ? '10' : c[0], sub: SYM[c[1]], cls: `cdk-card ${isRed(c) ? 'red' : ''}`, ...extra });
export const cardEl = (c, cls = '') => (c ? `<span class="cdk-c ${isRed(c) ? 'red' : ''} ${cls}"><b>${c[0] === 'T' ? '10' : c[0]}</b><i>${SYM[c[1]]}</i></span>` : `<span class="cdk-c back ${cls}"></span>`);
export const sortHand = (h, trump, order = RANKS) => [...h].sort((a, b) => (a[1] === b[1] ? order.indexOf(a[0]) - order.indexOf(b[0]) : (SUITS.indexOf(a[1]) + (a[1] === trump ? 10 : 0)) - (SUITS.indexOf(b[1]) + (b[1] === trump ? 10 : 0))));

// ---------------------------------------------------------------- the trick-taking engine
// cfg: {
//   defaults, deal(g) → hands (sets g.hand, may set g.trump / g.turnUp), handSize(g) for display,
//   bidding?: { options(g, seat) → [{v,label}], apply(g, seat, v) → done? }, after bidding: setup(g)
//   order: rank string high→low ordering (default RANKS), legal(g, seat) → cards allowed,
//   winner(g, trick) → index into trick, scoreHand(g), isOver(g), lead(g) → who leads the first trick,
//   botBid(g, seat), botPlay(g, seat), teams: true for partnerships (0&2 vs 1&3 by order)
// }
export function trickEngine(cfg) {
  const E = {};
  const order = cfg.order || RANKS;
  const pos = c => order.indexOf(c[0]);
  E.createGame = (settings, players) => {
    const g = base(settings, players, cfg.defaults || {});
    if (cfg.teams) { g.team = g.seats.map(() => null); g.order.forEach((s, i) => { g.team[s] = i % 2; }); g.scores = [0, 0]; }
    g.dealer = g.order[g.order.length - 1];
    g.handNo = 0;
    cfg.init?.(g);
    newHand(g);
    return g;
  };
  const next = (g, s) => g.order[(g.order.indexOf(s) + 1) % g.order.length];
  E.next = next;
  function newHand(g) {
    g.handNo++;
    g.dealer = next(g, g.dealer);
    g.trick = []; g.lastTrick = null; g.won = g.seats.map(() => []); g.tricks = g.seats.map(() => 0);
    g.trump = null; g.bids = {}; g.log = [];
    cfg.deal(g);
    for (const s of g.order) g.hand[s] = sortHand(g.hand[s], g.trump, order);
    if (cfg.bidding) { g.phase = 'bid'; g.turn = cfg.bidding.first ? cfg.bidding.first(g) : next(g, g.dealer); }
    else startPlay(g);
    g.moveId++;
  }
  function startPlay(g) {
    cfg.setup?.(g);
    for (const s of g.order) g.hand[s] = sortHand(g.hand[s], g.trump, order);
    g.phase = 'play';
    g.turn = cfg.lead ? cfg.lead(g) : next(g, g.dealer);
    g.leader = g.turn;
  }
  E.startPlay = startPlay;
  // Must follow the suit led if you can (unless the game says otherwise).
  E.legal = (g, s) => {
    if (cfg.legal) return cfg.legal(g, s);
    const h = g.hand[s];
    if (!g.trick.length) return h;
    const led = g.trick[0].c[1], f = h.filter(c => c[1] === led);
    return f.length ? f : h;
  };
  E.winner = (g, t) => {
    if (cfg.winner) return cfg.winner(g, t);
    const led = t[0].c[1];
    let best = 0;
    for (let i = 1; i < t.length; i++) {
      const a = t[best].c, b = t[i].c;
      const bt = b[1] === g.trump, at = a[1] === g.trump;
      if ((bt && !at) || (b[1] === a[1] && pos(b) > pos(a))) best = i;
      else if (!at && !bt && b[1] === led && a[1] !== led) best = i;
    }
    return best;
  };
  E.collecting = () => false;
  E.turnSeat = g => (g.phase === 'bid' || g.phase === 'play' ? g.turn : -1);
  E.pending = g => (g.phase === 'bid' || g.phase === 'play' ? [g.turn] : cfg.pending ? cfg.pending(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (cfg.action) { const r = cfg.action(g, seat, a, E); if (r !== undefined) return r; }
    if (seat !== g.turn) return "It's not your turn";
    if (g.phase === 'bid') {
      const ok = cfg.bidding.options(g, seat).some(o => String(o.v) === String(a.v) && !o.dis);
      if (!ok) return 'You can’t bid that';
      const done = cfg.bidding.apply(g, seat, a.v);
      if (g.phase !== 'bid') { g.moveId++; return null; }
      if (done) startPlay(g); else g.turn = cfg.bidding.nextBidder ? cfg.bidding.nextBidder(g, seat) : next(g, seat);
      g.moveId++;
      return null;
    }
    if (g.phase !== 'play') return 'Not now';
    const c = String(a.v);
    if (!g.hand[seat].includes(c)) return 'Play a card from your hand';
    if (!E.legal(g, seat).includes(c)) return 'You must follow suit';
    g.hand[seat].splice(g.hand[seat].indexOf(c), 1);
    g.trick.push({ s: seat, c });
    cfg.onPlay?.(g, seat, c);
    if (g.trick.length === (cfg.trickSize ? cfg.trickSize(g) : g.order.length)) {
      const w = g.trick[E.winner(g, g.trick)].s;
      g.tricks[w]++; g.won[w].push(...g.trick.map(t => t.c));
      g.lastTrick = { cards: g.trick, w };
      cfg.onTrick?.(g, w);
      g.phase = 'trick'; g.trickAt = Date.now(); g.turn = w;
      sfx(g, 'thud');
    } else g.turn = cfg.nextPlayer ? cfg.nextPlayer(g, seat) : next(g, seat);
    g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'trick') return { ms: Math.max(0, g.trickAt + 1400 - Date.now()), run: () => {
      g.trick = [];
      if (g.order.every(s => !g.hand[s].length) || cfg.handDone?.(g)) {
        cfg.scoreHand(g);
        g.phase = 'handEnd'; g.endAt = Date.now(); sfx(g, 'chime');
      } else { g.phase = 'play'; g.leader = g.turn; }
      g.moveId++;
    } };
    if (g.phase === 'handEnd') return { ms: Math.max(0, g.endAt + 6000 - Date.now()), run: () => {
      if (cfg.isOver(g)) return E.finish(g);
      newHand(g);
    } };
    return cfg.tick ? cfg.tick(g, E) : null;
  };
  E.finish = g => {
    if (cfg.teams) {
      g.winner = g.scores[0] === g.scores[1] ? null : (cfg.low ? g.scores[0] < g.scores[1] : g.scores[0] > g.scores[1]) ? 0 : 1;
      g.winners = g.order.filter(s => g.team[s] === g.winner);
      g.order.forEach(s => { g.score[s] = g.scores[g.team[s]]; });
    } else {
      const best = cfg.low ? Math.min(...g.order.map(s => g.score[s])) : Math.max(...g.order.map(s => g.score[s]));
      g.winners = g.order.filter(s => g.score[s] === best); g.winner = g.winners[0];
    }
    g.phase = 'over'; g.moveId++;
  };
  E.botAction = (g, s) => {
    if (cfg.botAction) { const r = cfg.botAction(g, s, E); if (r) return r; }
    if (g.phase === 'bid') return { type: 'pick', v: cfg.botBid(g, s) };
    const L = E.legal(g, s);
    return { type: 'pick', v: (cfg.botPlay && cfg.botPlay(g, s, L, E)) || simpleBot(g, s, L, E) };
  };
  // A sensible default: win cheaply if you can, otherwise throw your lowest.
  function simpleBot(g, s, L) {
    const low = [...L].sort((a, b) => pos(a) - pos(b));
    if (!g.trick.length) return low[low.length - 1 - Math.floor(Math.random() * Math.min(2, low.length))];
    const wins = L.filter(c => E.winner(g, [...g.trick, { s, c }]) === g.trick.length);
    const partnerWinning = cfg.teams && g.team[g.trick[E.winner(g, g.trick)].s] === g.team[s];
    if (wins.length && !partnerWinning) return wins.sort((a, b) => pos(a) - pos(b))[0];
    return low[0];
  }
  E.cfg = cfg;
  E.pos = pos;
  // The phone view for a trick game.
  E.viewFor = (g, seat) => {
    const h = g.hand[seat] || [];
    const myTurn = g.turn === seat && (g.phase === 'play' || g.phase === 'bid');
    const v = { phase: g.phase, moveId: g.moveId, hud: cfg.hud ? cfg.hud(g, seat) : [['Tricks', g.tricks[seat] ?? 0], ['Score', cfg.teams ? g.scores[g.team[seat]] : g.score[seat] ?? 0]] };
    if (cfg.teams) { v.teamName = `${cfg.teamNames?.[g.team[seat]] || ['Team A', 'Team B'][g.team[seat]]}`; v.myTeam = g.team[seat]; }
    const extra = cfg.phoneInfo ? cfg.phoneInfo(g, seat) : '';
    const trumpInfo = g.trump ? `Trump: ${SYM[g.trump] || g.trump}` : '';
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: '' };
    else if (cfg.phoneUI) { const u = cfg.phoneUI(g, seat, E); if (u) { v.ui = u; return v; } }
    if (v.ui) return v;
    if (g.phase === 'bid') v.ui = myTurn ? { k: 'pick', key: 'b' + g.handNo + ':' + Object.keys(g.bids).length, title: cfg.bidding.title ? cfg.bidding.title(g, seat) : 'Your bid', sub: trumpInfo, myturn: true, buzz: true, grid: cfg.bidding.grid || 4, options: cfg.bidding.options(g, seat), html: `${extra}<div class="cdk-hand">${h.map(c => cardEl(c)).join('')}</div>` }
      : { k: 'wait', title: `@${g.turn}@ is bidding`, sub: trumpInfo, html: `${extra}<div class="cdk-hand">${h.map(c => cardEl(c)).join('')}</div>` };
    else if (g.phase === 'play' || g.phase === 'trick') {
      const L = myTurn ? E.legal(g, seat) : [];
      v.ui = { k: 'pick', key: 'p' + g.handNo + ':' + h.length + ':' + g.trick.length + (myTurn ? 'm' : ''), title: myTurn ? 'Your turn — play a card' : `@${g.turn}@ to play`, sub: trumpInfo, myturn: myTurn, buzz: myTurn, cards: true, grid: Math.min(7, Math.max(4, Math.ceil(h.length / 2))), html: extra, options: h.map(c => cardOpt(c, { dis: !L.includes(c) })) };
    } else v.ui = { k: 'wait', title: 'Hand over', sub: cfg.handSummary ? cfg.handSummary(g, seat) : '' };
    return v;
  };
  return E;
}
