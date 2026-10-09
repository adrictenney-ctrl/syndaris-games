// Bug Bluff on the table: each player's face-up bugs (danger at three of a kind), how many cards
// they hold, and the bug in transit — face down, with its claim and everyone who's peeked.
import * as E from './bugbluff.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'bugbluff',
  settingsHTML: () => '<span class="yc-note">Four of the same bug face up and you lose</span>',
  badges: (g, s) => [`<span class="badge">🂠 ${g.hand[s].length}</span>`],
  center(g, ctx) {
    const M = g.moving;
    let mid = '';
    if (g.phase === 'respond' || g.phase === 'repass') mid = `<div class="bb-transit"><span class="bb-back">?</span><p class="pt-big">${who(ctx, M.from)} → ${who(ctx, M.to)}: “It’s a ${E.BUGS[M.claim].n}” ${E.BUGS[M.claim].e}</p><p class="pt-sub">${M.seen.length > 1 ? `Already peeked: ${M.seen.map(s => esc(ctx.nameOf(s))).join(', ')}` : g.phase === 'repass' ? `${esc(ctx.nameOf(M.to))} peeked and is passing it on…` : 'True… or a bluff?'}</p></div>`;
    else if (g.phase === 'reveal') { const R = g.result; mid = `<div class="bb-transit"><span class="bb-face">${E.BUGS[R.card].e}</span><p class="pt-big">${who(ctx, R.caller)} said it ${R.yes ? 'IS' : 'is NOT'} a ${E.BUGS[R.claim].n} — ${R.right ? 'right!' : 'wrong!'} ${who(ctx, R.taker)} takes the ${E.BUGS[R.card].n}</p></div>`; }
    else if (g.phase === 'pass') mid = `<p class="pt-big">${who(ctx, g.turn)} is choosing a bug to pass</p>`;
    const rows = `<ul class="bb-rows">${g.order.map(s => `<li class="${pendingHere(g, s) ? 'up' : ''} ${g.loser === s ? 'lost' : ''}"><span class="nm"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}<small>${g.hand[s].length} in hand</small></span><div>${E.BUGS.map((B, b) => (g.front[s][b] ? `<span class="${g.front[s][b] >= 3 ? 'hot' : ''}">${B.e.repeat(g.front[s][b])}</span>` : '')).join('')}</div></li>`).join('')}</ul>`;
    return `${mid}${rows}`;
  },
});
const pendingHere = (g, s) => E.pending(g)[0] === s;
