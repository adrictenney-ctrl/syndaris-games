// Bluff Dice on the table: a cup for each player with how many dice are under it, the current bid
// in the middle, and — when someone calls Liar — every cup lifted, with the dice that count lit up.
import * as E from './bluffdice.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

const cup = (g, ctx, s) => {
  const lift = g.phase === 'reveal' || g.phase === 'over', f = g.reveal?.bid.f;
  const dice = lift ? g.dice[s].map(d => `<i class="bd-die ${d === f || d === 1 ? 'hit' : ''}">${E.FACE[d]}</i>`).join('') : '';
  return `<li class="${E.turnSeat(g) === s ? 'up' : ''} ${g.count[s] ? '' : 'out'} ${g.reveal?.loser === s && lift ? 'lost' : ''}"><span class="bd-cup ${lift ? 'up' : ''}"></span><div class="bd-dice">${dice || '•'.repeat(g.count[s])}</div><b><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}</b></li>`;
};
export default partyTable(E, {
  id: 'bluffdice',
  defaults: { dice: 5 },
  settingsHTML: s => `<label>Dice each <select data-set="dice">${[3, 4, 5, 6].map(n => `<option value="${n}" ${n === s.dice ? 'selected' : ''}>${n}</option>`).join('')}</select></label><span class="yc-note">Ones are wild</span>`,
  badges: (g, s) => [`<span class="badge">🎲 ${g.count[s]}</span>`],
  center(g, ctx) {
    const bid = g.bid ? `<div class="bd-bid"><b>${g.bid.q}</b><span>×</span><i class="bd-die big">${E.FACE[g.bid.f]}</i></div><p class="pt-sub">bid by ${who(ctx, g.bid.by)}</p>` : '<p class="pt-big">Opening bid…</p>';
    let msg = '';
    if (g.phase === 'bid') msg = `<p class="pt-sub">${who(ctx, E.player(g))} — raise the bid or call Liar</p>`;
    else if (g.phase === 'reveal') { const R = g.reveal; msg = `<p class="pt-big">${who(ctx, R.caller)} called Liar! There ${R.n === 1 ? 'is' : 'are'} <b>${R.n}</b> — ${R.ok ? 'the bid stands' : 'caught bluffing'}. ${who(ctx, R.loser)} loses a die.</p>`; }
    return `<p class="pt-kicker">Round ${g.round} · ${g.order.reduce((t, s) => t + g.count[s], 0)} dice in play</p>${g.phase === 'reveal' ? `<div class="bd-bid"><b>${g.reveal.bid.q}</b><span>×</span><i class="bd-die big">${E.FACE[g.reveal.bid.f]}</i></div>` : bid}${msg}<ul class="bd-cups">${g.order.map(s => cup(g, ctx, s)).join('')}</ul>`;
  },
});
