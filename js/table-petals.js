// Petals & Thorns on the table: each player's face-down stack (just how many discs), their discs
// left and wins, the current challenge, and the discs as they're flipped.
import * as E from './petals.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'petals',
  settingsHTML: () => '<span class="yc-note">Three Petals and a Thorn each · win two challenges</span>',
  badges: (g, s) => [`<span class="badge">${'🏵️'.repeat(g.score[s]) || '·'} · ${g.hand[s].length} discs</span>`],
  center(g, ctx) {
    const stacks = `<ul class="pe-stacks">${g.order.map(s => {
      const fl = g.flipped.filter(f => f.s === s);
      return `<li class="${E.turnSeat(g) === s ? 'up' : ''} ${g.hand[s].length ? '' : 'out'}"><div class="pe-pile">${fl.map(f => `<i class="up">${E.DISC[f.d]}</i>`).join('')}${g.stack[s].map(() => '<i class="down"></i>').join('')}</div><b><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}</b><small>${'🏵️'.repeat(g.score[s])} ${g.hand[s].length} discs</small></li>`;
    }).join('')}</ul>`;
    let msg = '';
    if (g.phase === 'lay') msg = '<p class="pt-big">Everyone lays a disc, face down</p>';
    else if (g.phase === 'turn') msg = `<p class="pt-big">${who(ctx, g.turn)}: add a disc or start a challenge</p>`;
    else if (g.phase === 'bidding') msg = `<div class="pe-bid">${g.bid}</div><p class="pt-sub">${who(ctx, g.bidder)} can flip ${g.bid} · ${who(ctx, g.turn)} to raise or pass</p>`;
    else if (g.phase === 'flip') msg = `<div class="pe-bid">${g.flipped.length}/${g.bid}</div><p class="pt-sub">${who(ctx, g.bidder)} is flipping…</p>`;
    else if (g.phase === 'result') msg = `<p class="pt-big">${g.result.ok ? `🌸 ${who(ctx, g.result.by)} made it!` : `🌵 ${who(ctx, g.result.by)} hit ${who(ctx, g.result.why)}’s Thorn and loses a disc`}</p>`;
    return `<p class="pt-kicker">Round ${g.round} · ${E.onTable(g)} discs down</p>${msg}${stacks}`;
  },
});
