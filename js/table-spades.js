// Spades on the table: the trick in the middle, a spade printed on the felt, each player's
// bid and tricks on their plate, team scores and bags above the trick.
import * as P from './spades.js?v=63';
import { trickView } from './trickview.js?v=63';
import { centerMsg, clearMsg } from './table-hearts.js?v=63';

const tv = trickView();

export default {
  defaults: { target: 500 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[250, 300, 500].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label><span class="yc-note">Partners sit across from each other</span>`,
  create: settings => P.createGame(settings),
  act: P.applyAction,
  bot: P.botAction,
  view: P.viewFor,
  turn: g => P.current(g),
  timer: g => P.tick(g),
  joinMidGame: () => false,

  plate(g, s) {
    const badges = [];
    if (g.dealer === s) badges.push('<span class="badge dealer">DEALER</span>');
    if (g.bids[s] === 0) badges.push('<span class="badge alone">NIL</span>');
    if (g.phase === 'over' && P.teamOf(s) === g.winner) badges.push('<span class="badge got">🏆 winners</span>');
    const t = P.teamOf(s);
    return {
      badges,
      meta: `<span>Bid <b>${g.bids[s] ?? '–'}</b> · took <b>${g.tricksWon[s]}</b></span><span>We <b>${g.scores[t]}</b> · They <b>${g.scores[1 - t]}</b></span>`,
      cards: g.hands[s].length, turn: P.current(g) === s, out: false,
    };
  },

  reset() { tv.reset(); clearMsg(); },

  renderCenter(g, ctx) {
    const wm = document.getElementById('watermark');
    wm.textContent = '♠';
    wm.classList.remove('red');
    tv.render(g.trick, ctx, { sweepTo: g.lastTrick?.winner, glow: g.phase === 'trickEnd' ? g.trickWinner : null });
    const team = t => `${ctx.nameOf(t)} & ${ctx.nameOf(t + 2)}`;
    if (g.phase === 'bid') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> is bidding`);
    else if (g.phase === 'play' || g.phase === 'trickEnd') {
      const c = t => [t, t + 2].reduce((a, s) => a + (g.bids[s] || 0), 0), k = t => g.tricksWon[t] + g.tricksWon[t + 2];
      centerMsg(`${team(0)} <b>${k(0)}/${c(0)}</b> · ${team(1)} <b>${k(1)}/${c(1)}</b>${g.broken ? '' : ' · <small>spades not broken</small>'}`);
    } else centerMsg('');
  },

  overlay(g, ctx) {
    if (g.phase !== 'handEnd' && g.phase !== 'over') return null;
    const team = t => `${ctx.nameOf(t)} & ${ctx.nameOf(t + 2)}`;
    const row = t => `<li>${team(t)} <span>${g.result[t].lines.join(' · ') || '—'}</span> <b>${g.scores[t]}</b></li>`;
    return {
      key: g.phase + g.handNo,
      html: `<h2>${g.phase === 'over' ? `${team(g.winner)} win!` : 'Hand over'}</h2><p>Bags: ${g.bags[0]} · ${g.bags[1]} (10 bags cost 100)</p><ol class="scores">${row(0)}${row(1)}</ol>
        ${g.phase === 'over' ? '<div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>' : '<p class="hint">Next hand in a moment… <button class="tool" data-do="next">Deal now</button></p>'}`,
      next: () => { if (g.phase === 'handEnd') P.advance(g); },
    };
  },
};
