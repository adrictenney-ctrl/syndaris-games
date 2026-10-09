// Table screens for the card-kit games (trick-games.js, shed-games.js). Hands stay on the
// phones; the table shows the trick, the pile, trump, bids, the dummy and the scores.
import { partyTable, esc, sc, who, teamScores, TEAMS } from './table-party.js?v=68';
import * as T from './trick-games.js?v=68';
import * as S from './shed-games.js?v=68';
import { cardEl, SYM, txt } from './cardkit.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${String(v) === String(s[k]) ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const nm = (ctx, s) => esc(ctx.nameOf(s));
const big = (c, cls = '') => cardEl(c, 'cdk-big ' + cls);
const row = cards => `<div class="cdk-row">${cards.join('')}</div>`;
const lowRank = (g, ctx) => `<ol class="pt-rank">${[...g.order].sort((a, b) => g.score[a] - g.score[b]).map(s => `<li><i style="background:var(--seat-${s})"></i>${nm(ctx, s)}<b>${g.score[s]}</b></li>`).join('')}</ol>`;
const suitTxt = s => (s ? `<b class="cdk-suit ${s === 'H' || s === 'D' ? 'red' : ''}">${SYM[s] || s}</b>` : '<b class="cdk-suit">—</b>');

// ---------------------------------------------------------------- trick games
// The trick: each played card under its player's name, the winner's lit up.
function trickRow(g, ctx, E) {
  const cards = g.phase === 'trick' && g.lastTrick ? g.lastTrick.cards : g.trick;
  const w = g.phase === 'trick' && g.lastTrick ? g.lastTrick.w : -1;
  return `<div class="cdk-trick">${g.order.map(s => { const p = cards.find(x => x.s === s); return `<div class="cdk-slot ${w === s ? 'win' : ''} ${g.turn === s && g.phase === 'play' ? 'turn' : ''}">${p ? (p.c === 'RV' ? '<span class="cdk-c cdk-big raven">🐦‍⬛</span>' : big(p.c)) : '<span class="cdk-c cdk-big empty"></span>'}<small>${nm(ctx, s)}${E && g.bids && g.bids[s] != null && E !== T.setback ? ` · ${g.tricks[s]}/${g.bids[s]}` : g.tricks ? ` · ${g.tricks[s]}` : ''}</small></div>`; }).join('')}</div>`;
}
function trickTable(E, id, o) {
  return partyTable(E, {
    id, defaults: o.defaults, settingsHTML: o.settingsHTML, low: o.low,
    center(g, ctx) {
      const head = g.team ? teamScores(g) : '';
      if (g.phase === 'over') return g.team ? head : o.low ? lowRank(g, ctx) : sc(g, ctx);
      const info = `<div class="cdk-info">${o.info ? o.info(g, ctx) : ''}</div>`;
      let mid;
      if (g.phase === 'bid') mid = `<p class="pt-big">${who(ctx, g.turn)} is bidding…</p>${o.bids ? o.bids(g, ctx) : ''}`;
      else if (g.phase === 'handEnd') mid = `<p class="pt-big">Hand over</p><p class="pt-kicker">${o.summary ? o.summary(g, ctx) : ''}</p>${g.team ? '' : (o.low ? lowRank(g, ctx) : sc(g, ctx))}`;
      else if (o.special && o.special(g, ctx)) mid = o.special(g, ctx);
      else mid = `${trickRow(g, ctx, E)}${o.extra ? o.extra(g, ctx) : ''}`;
      return `${head}${info}${mid}`;
    },
    badges: (g, s) => (o.badges ? o.badges(g, s) : []),
  });
}
const trumpInfo = g => `<span>Trump ${suitTxt(g.trump)}</span>${g.turnUp ? `<span>Turned up ${cardEl(g.turnUp)}</span>` : ''}`;
const bidChips = (g, ctx) => `<div class="pt-done">${g.order.map(s => `<span class="${g.bids[s] != null ? 'on' : ''}"><i style="background:var(--seat-${s})"></i>${nm(ctx, s)}${g.bids[s] != null ? ` · ${g.bids[s] || 'pass'}` : ''}</span>`).join('')}</div>`;
const target = (k, list, label = 'Play to') => s => `<label>${label} ${opt(k, s, list)}</label>`;

export const whistT = trickTable(T.whist, 'whist', {
  defaults: { target: 5 }, settingsHTML: target('target', [[3, '3 points'], [5, '5 points'], [7, '7 points']]),
  info: g => `${trumpInfo(g)}<span>Hand ${g.handNo}</span>`,
  summary: g => `Tricks ${TEAMS[0]} ${g.handTricks[0]} · ${TEAMS[1]} ${g.handTricks[1]} — over six scores`,
});
export const exactlyT = trickTable(T.exactly, 'exactly', {
  defaults: { start: 7 }, settingsHTML: target('start', [[5, '5 cards'], [7, '7 cards'], [10, '10 cards']], 'Start with'),
  info: g => `${trumpInfo(g)}<span>${g.n} card${g.n === 1 ? '' : 's'} · hand ${g.handNo}/${g.sizes.length}</span><span>Bids ${Object.values(g.bids).reduce((a, b) => a + b, 0)} of ${g.n}</span>`,
  bids: bidChips,
  summary: (g, ctx) => g.order.map(s => `${nm(ctx, s)} ${g.gain[s] ? '✓ +' + g.gain[s] : '✗'}`).join(' · '),
});
export const setbackT = trickTable(T.setback, 'setback', {
  defaults: { target: 11 }, settingsHTML: target('target', [[7, '7 points'], [11, '11 points'], [15, '15 points']]),
  info: (g, ctx) => `<span>Trump ${g.trump ? suitTxt(g.trump) : '<b class="cdk-suit">first card led</b>'}</span>${g.high?.s >= 0 ? `<span>${nm(ctx, g.high.s)} bid ${g.high.bid}</span>` : ''}`,
  bids: bidChips,
  summary: g => g.why ? `${g.why.join(' · ')}` : '',
});
export const ravenT = trickTable(T.raven, 'raven', {
  defaults: { target: 300 }, settingsHTML: target('target', [[200, '200'], [300, '300'], [500, '500']]),
  info: (g, ctx) => `${g.trump ? `<span>Trump ${suitTxt(g.trump)}</span>` : ''}${g.high?.s >= 0 ? `<span>${nm(ctx, g.high.s)} bid ${g.high.bid}</span>` : ''}<span>The 🐦‍⬛ Raven is the top trump</span>`,
  bids: (g, ctx) => `${bidChips(g, ctx)}<div class="cdk-row">${(g.nest || []).map(() => cardEl(null)).join('')}</div><p class="pt-kicker">The nest (5 cards) goes to the high bidder</p>`,
  special: (g, ctx) => (g.phase === 'nest' ? `<p class="pt-big">${who(ctx, g.bidder)} took the nest and is burying 5 cards…</p>` : g.phase === 'trumpcall' ? `<p class="pt-big">${who(ctx, g.bidder)} is naming trump…</p>` : ''),
  summary: g => (T.raven.cfg.handSummary ? T.raven.cfg.handSummary(g) : ''),
});
export const missiontricksT = trickTable(T.missiontricks, 'missiontricks', {
  defaults: { levels: 10 }, settingsHTML: target('levels', [[5, '5 missions'], [10, '10 missions']], 'Campaign'),
  info: g => `<span>Mission ${g.level}</span><span>Attempt ${g.attempts}</span><span>🚀 Rockets are trump</span>`,
  extra: (g, ctx) => `<div class="cdk-tasks">${g.tasks.map(t => `<span class="${t.done ? 'done' : ''}">${t.done ? '✓' : '🎯'} ${cardEl(t.c)} ${nm(ctx, t.s)}</span>`).join('')}</div>${Object.keys(g.reveal || {}).length ? `<p class="pt-kicker">Revealed: ${Object.entries(g.reveal).map(([s, c]) => `${nm(ctx, Number(s))} ${cardEl(c)}`).join(' ')}</p>` : ''}`,
  summary: g => (g.result === 'success' ? '🎉 Mission complete!' : '💥 Mission failed — try again'),
});
export const schnapsenT = trickTable(T.schnapsen, 'schnapsen', {
  defaults: { target: 7 }, settingsHTML: target('target', [[5, '5'], [7, '7'], [11, '11']]),
  info: g => `<span>Trump ${suitTxt(g.trump)}</span>${g.trumpCard ? `<span>${cardEl(g.trumpCard)} under ${g.talon.length} talon cards</span>` : '<span>Talon closed — follow suit!</span>'}`,
  extra: (g, ctx) => `<p class="pt-kicker">${g.order.map(s => `${nm(ctx, s)} ${g.pts[s]} card points`).join(' · ')} — first to 66</p>`,
  summary: g => g.res || '',
});
export const pinochleT = trickTable(T.pinochle, 'pinochle', {
  defaults: { target: 1500 }, settingsHTML: target('target', [[1000, '1000'], [1500, '1500']]),
  info: (g, ctx) => `${g.trump ? `<span>Trump ${suitTxt(g.trump)}</span>` : ''}${g.high?.s >= 0 ? `<span>${nm(ctx, g.high.s)} bid ${g.high.bid}</span>` : ''}`,
  bids: bidChips,
  special: (g, ctx) => (g.phase === 'trumpcall' ? `<p class="pt-big">${who(ctx, g.bidder)} is naming trump…</p>` : ''),
  extra: (g, ctx) => (g.melds ? `<p class="pt-kicker">Meld: ${g.order.map(s => `${nm(ctx, s)} ${g.melds[s]}`).join(' · ')}</p>` : ''),
  summary: g => (T.pinochle.cfg.handSummary ? T.pinochle.cfg.handSummary(g) : ''),
});
export const bridgeT = trickTable(T.bridge, 'bridge', {
  defaults: { deals: 4 }, settingsHTML: target('deals', [[4, '4 deals'], [8, '8 deals']], 'Rubber of'),
  info: (g, ctx) => (g.contract && g.declarer != null ? `<span>Contract <b class="cdk-suit ${'HD'.includes(g.contract.strain) ? 'red' : ''}">${T.bidTxt(g.contract)}${g.dbl ? ' ×' : ''}</b></span><span>Declarer ${nm(ctx, g.declarer)}</span>` : `<span>Deal ${g.handNo} of ${g.settings.deals}</span>`) + `<span>Vulnerable: ${[0, 1].filter(k => g.vul[k]).map(k => TEAMS[k]).join(', ') || 'none'}</span>`,
  bids: (g, ctx) => `<div class="cdk-auction">${g.auction.map(x => `<span>${nm(ctx, x.s)} <b>${x.v === 'P' ? 'Pass' : x.v === 'X' ? 'Double' : T.bidTxt({ level: Number(x.v[0]), strain: x.v[1] })}</b></span>`).join('') || '<em>No bids yet</em>'}</div>`,
  // The dummy's hand lies face up on the table.
  extra: (g, ctx) => (g.dummy != null ? `<div class="cdk-dummy"><small>Dummy — ${nm(ctx, g.dummy)}</small>${row(g.hand[g.dummy].map(c => cardEl(c)))}</div>` : ''),
  summary: g => g.res || 'Passed out — redeal',
});

// ---------------------------------------------------------------- shedding and other card games
const pileOf = cards => row(cards.map(c => big(c)));
export const topdogT = partyTable(S.topdog, {
  id: 'topdog', defaults: { rounds: 5 }, settingsHTML: target('rounds', [[3, '3 rounds'], [5, '5 rounds'], [8, '8 rounds']], 'Play'),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const head = `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds} · 2s are high</p>`;
    if (g.phase === 'roundEnd') return `${head}<ol class="pt-rank">${g.titles.map(s => `<li><i style="background:var(--seat-${s})"></i>${nm(ctx, s)}<b>${S.topdog.titleOf(g, s)}</b></li>`).join('')}</ol>`;
    const pile = g.pile ? `${pileOf(g.pile.cards)}<p class="pt-kicker">played by ${nm(ctx, g.pile.s)}</p>` : '<p class="pt-big">Fresh lead</p>';
    return `${head}${g.swap && g.round > 1 && !g.pile && g.out.length === 0 ? `<p class="pt-kicker">${nm(ctx, g.swap.under)} handed their two best cards to ${nm(ctx, g.swap.top)}</p>` : ''}${pile}<p class="pt-big">${who(ctx, g.turn)} to play</p>${g.out.length ? `<p class="pt-kicker">Out: ${g.out.map((s, i) => `#${i + 1} ${nm(ctx, s)}`).join(' · ')}</p>` : ''}`;
  },
  badges: (g, s) => [g.hand[s] && g.phase === 'play' ? `<span class="badge">${g.hand[s].length} 🂠</span>` : '', g.passed?.includes(s) ? '<span class="badge">pass</span>' : ''].filter(Boolean),
});
export const bigdeuceT = partyTable(S.bigdeuce, {
  id: 'bigdeuce', low: true, defaults: { rounds: 4 }, settingsHTML: target('rounds', [[2, '2 rounds'], [4, '4 rounds'], [6, '6 rounds']], 'Play'),
  center(g, ctx) {
    if (g.phase === 'over') return lowRank(g, ctx);
    const head = `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds} · ♦ < ♣ < ♥ < ♠ · 2 is top</p>`;
    if (g.phase === 'roundEnd') return `${head}<p class="pt-big">${who(ctx, g.roundWin)} went out!</p><p class="pt-kicker">${g.order.filter(s => s !== g.roundWin).map(s => `${nm(ctx, s)} +${g.gain[s]}`).join(' · ')}</p>${lowRank(g, ctx)}`;
    return `${head}${g.pile ? `${pileOf(g.pile.cards)}<p class="pt-kicker">played by ${nm(ctx, g.pile.s)}</p>` : '<p class="pt-big">Fresh lead</p>'}<p class="pt-big">${who(ctx, g.turn)} to play</p>`;
  },
  badges: (g, s) => [g.hand[s] && g.phase === 'play' ? `<span class="badge ${g.hand[s].length <= 2 ? 'alone' : ''}">${g.hand[s].length} 🂠</span>` : '', g.passed?.includes(s) ? '<span class="badge">pass</span>' : ''].filter(Boolean),
});
export const foolsdefenseT = partyTable(S.foolsdefense, {
  id: 'foolsdefense', defaults: {},
  center(g, ctx) {
    if (g.phase === 'over') return `<p class="pt-big">🤡 ${g.fool >= 0 ? `${nm(ctx, g.fool)} is the Fool!` : 'Nobody is the Fool!'}</p>`;
    const deck = `<div class="cdk-info"><span>Trump ${suitTxt(g.trump)}</span>${g.deck.length ? `<span>${cardEl(g.trumpCard)} · ${g.deck.length} in the deck</span>` : '<span>Deck empty</span>'}</div>`;
    const bout = `<div class="cdk-bout">${g.table.map(p => `<div class="cdk-pair">${big(p.a)}${p.d ? big(p.d, 'over') : ''}</div>`).join('') || '<em>No attack yet</em>'}</div>`;
    return `${deck}<p class="pt-big">${who(ctx, g.attacker)} ⚔️ ${who(ctx, g.defender)}</p>${bout}`;
  },
  badges: (g, s) => [g.out.includes(s) ? '<span class="badge got">safe</span>' : g.hand[s] ? `<span class="badge">${g.hand[s].length} 🂠</span>` : ''].filter(Boolean),
  overlay(g, ctx) { return { key: 'over' + g.moveId, html: `<h2>${g.fool >= 0 ? `${nm(ctx, g.fool)} is the Fool! 🤡` : 'No Fool this time!'}</h2><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` }; },
});
export const thirtyoneT = partyTable(S.thirtyone, {
  id: 'thirtyone', defaults: {},
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const lives = `<div class="pt-done">${g.order.map(s => `<span class="${g.lives[s] ? 'on' : ''}"><i style="background:var(--seat-${s})"></i>${nm(ctx, s)} ${'❤️'.repeat(g.lives[s]) || '💀'}</span>`).join('')}</div>`;
    if (g.phase === 'roundEnd') return `${lives}<p class="pt-big">Show your hands!</p><div class="cdk-shows">${g.order.filter(s => g.hand[s].length).map(s => `<div class="${g.losers.includes(s) ? 'lose' : ''}"><small>${nm(ctx, s)} · ${g.sc[s]}</small>${row(g.hand[s].map(c => cardEl(c)))}</div>`).join('')}</div>`;
    return `${lives}<div class="cdk-row">${cardEl(null, 'cdk-big')}${big(g.discard[g.discard.length - 1])}</div><p class="pt-big">${who(ctx, g.turn)}${g.drawn ? ' is discarding' : ' to draw'}</p>${g.knock >= 0 ? `<p class="pt-kicker">✊ ${nm(ctx, g.knock)} knocked — everyone else gets one more turn</p>` : ''}`;
  },
});
export const tonkT = partyTable(S.tonk, {
  id: 'tonk', low: true, defaults: { rounds: 5 }, settingsHTML: target('rounds', [[3, '3 hands'], [5, '5 hands'], [8, '8 hands']], 'Play'),
  center(g, ctx) {
    if (g.phase === 'over') return lowRank(g, ctx);
    const head = `<p class="pt-kicker">Hand ${g.round} of ${g.settings.rounds}</p>`;
    const spreads = g.spreads.length ? `<div class="cdk-shows">${g.spreads.map(x => `<div><small>${nm(ctx, x.s)}</small>${row(x.cards.map(c => cardEl(c)))}</div>`).join('')}</div>` : '';
    if (g.phase === 'roundEnd') return `${head}<p class="pt-big">${who(ctx, g.res.w)} wins the hand</p><p class="pt-kicker">${g.res.how.replace(/@(\d+)@/g, (_, n) => nm(ctx, Number(n)))}</p>${lowRank(g, ctx)}`;
    return `${head}<div class="cdk-row">${cardEl(null, 'cdk-big')}${g.discard.length ? big(g.discard[g.discard.length - 1]) : ''}</div>${spreads}<p class="pt-big">${who(ctx, g.turn)}’s turn</p>`;
  },
  badges: (g, s) => (g.hand[s] && g.phase === 'play' ? [`<span class="badge">${g.hand[s].length} 🂠</span>`] : []),
});
export const slapstackT = partyTable(S.slapstack, {
  id: 'slapstack', defaults: {},
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const c = g.center, top = c.slice(-3);
    const slap = g.lastSlap ? `<p class="pt-kicker">${g.lastSlap.ok ? '🖐️' : '❌'} ${nm(ctx, g.lastSlap.s)} ${g.lastSlap.ok ? 'slapped first!' : 'slapped wrong'}</p>` : '';
    return `<div class="cdk-stack">${top.map((x, i) => big(x, `st${i + 3 - top.length}`)).join('') || '<em>Empty pile</em>'}</div><p class="pt-kicker">${c.length} card${c.length === 1 ? '' : 's'} in the pile</p>${g.challenge ? `<p class="pt-big">${who(ctx, g.turn)} has ${g.challenge.left} chance${g.challenge.left === 1 ? '' : 's'} to hit a face card</p>` : `<p class="pt-big">${who(ctx, g.turn)} flips</p>`}${slap}`;
  },
  badges: (g, s) => (g.pile[s] ? [`<span class="badge ${g.pile[s].length ? '' : 'alone'}">${g.pile[s].length} 🂠</span>`] : []),
});
export const speedT = partyTable(S.speed, {
  id: 'speed', defaults: {},
  center(g, ctx) {
    if (g.phase === 'over') return `<p class="pt-big">${who(ctx, g.winner)} emptied their hand first!</p>`;
    if (g.phase === 'ready') return `<p class="pt-big">Ready… set…</p><div class="cdk-row">${big(g.center[0])}${big(g.center[1])}</div>`;
    return `<div class="cdk-row cdk-speed">${big(g.center[0])}${big(g.center[1])}</div><div class="pt-done">${g.order.map(s => `<span class="on"><i style="background:var(--seat-${s})"></i>${nm(ctx, s)} · ${g.hand[s].length + g.stock[s].length} left</span>`).join('')}</div>`;
  },
  overlay(g, ctx) { return { key: 'over' + g.moveId, html: `<h2>${nm(ctx, g.winner)} wins!</h2><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` }; },
});
export const pairsT = partyTable(S.pairs, {
  id: 'pairs', low: true, defaults: {},
  center(g, ctx) {
    if (g.phase === 'over') return lowRank(g, ctx);
    const rows = `<div class="cdk-shows">${g.order.map(s => `<div class="${g.turn === s && g.phase === 'play' ? 'turn' : ''}"><small>${nm(ctx, s)} · ${g.score[s]} pts</small><div class="pr-row">${g.row[s].map(c => `<span>${c}</span>`).join('') || '<em>—</em>'}</div></div>`).join('')}</div>`;
    const msg = g.phase === 'roundEnd' ? `<p class="pt-big">${g.last?.pair ? `${nm(ctx, g.last.s)} paired ${g.last.pair}s! +${g.last.pair}` : `${nm(ctx, g.last?.s)} folded +${g.last?.fold}`}</p>` : `<p class="pt-big">${who(ctx, g.turn)}: flip or fold?</p>`;
    return `<p class="pt-kicker">First to ${g.limit} points loses · ${g.deck.length} cards left</p>${msg}${rows}`;
  },
});
export const cardgolfT = partyTable(S.cardgolf, {
  id: 'cardgolf', low: true, defaults: { holes: 4 }, settingsHTML: target('holes', [[3, '3 holes'], [4, '4 holes'], [9, '9 holes']], 'Play'),
  center(g, ctx) {
    if (g.phase === 'over') return lowRank(g, ctx);
    const grids = `<div class="cdk-golf">${g.order.map(s => `<div class="${g.turn === s && g.phase === 'play' ? 'turn' : ''}"><small>${nm(ctx, s)}${g.phase === 'roundEnd' ? ` · ${g.gain[s]}` : ''}</small><div class="cdk-g6">${g.grid[s].map(x => (x.up ? cardEl(x.c) : cardEl(null))).join('')}</div></div>`).join('')}</div>`;
    const top = g.discard[g.discard.length - 1];
    return `<p class="pt-kicker">Hole ${g.hole} of ${g.settings.holes} · K = 0 · columns that match = 0</p><div class="cdk-row">${cardEl(null, 'cdk-big')}${top ? big(top) : ''}${g.drawn ? `<span class="cdk-arrow">→</span>${big(g.drawn, 'held')}` : ''}</div>${grids}`;
  },
});
export const cornerkingsT = partyTable(S.cornerkings, {
  id: 'cornerkings', low: true, defaults: {},
  center(g, ctx) {
    if (g.phase === 'over') return lowRank(g, ctx);
    const P = i => { const p = g.piles[i]; return `<div class="cdk-pile p${i}">${p.length ? cardEl(p[p.length - 1]) : `<span class="cdk-c empty">${i >= 4 ? '👑' : ''}</span>`}${p.length > 1 ? `<small>${txt(p[0])}…</small>` : ''}</div>`; };
    const board = `<div class="cdk-cross">${[4, 0, 5, 3, -1, 1, 7, 2, 6].map(i => (i < 0 ? `<div class="cdk-pile mid">${cardEl(null)}<small>${g.deck.length}</small></div>` : P(i))).join('')}</div>`;
    if (g.phase === 'roundEnd') return `${board}<p class="pt-big">${who(ctx, g.roundWin)} is out! 👑</p>${lowRank(g, ctx)}`;
    return `${board}<p class="pt-big">${who(ctx, g.turn)}’s turn</p>`;
  },
  badges: (g, s) => (g.hand[s] && g.phase === 'play' ? [`<span class="badge">${g.hand[s].length} 🂠</span>`] : []),
});
