// This or That on the table: the two choices facing off, then a tug-of-war bar with everyone's dot
// on the side they chose.
import * as E from './thisorthat.js?v=68';
import { partyTable, esc, clock, doneRow, sc } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'thisorthat',
  defaults: { rounds: 10 },
  settingsHTML: s => `<label>Questions <select data-set="rounds">${[6, 10, 15].map(n => `<option value="${n}" ${n === s.rounds ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const P = E.PAIRS[g.q], rev = g.phase === 'reveal', tot = Math.max(1, g.count ? g.count[0] + g.count[1] : 1);
    const sides = `<div class="to-vs"><div class="to-side a ${rev && g.major === 0 ? 'win' : ''}"><b>${esc(P[0])}</b>${rev ? `<span>${g.order.filter(s => g.pick[s] === 0).map(s => `<i style="background:var(--seat-${s})" title="${esc(ctx.nameOf(s))}"></i>`).join('')}</span><em>${g.count[0]}</em>` : ''}</div><span class="to-or">or</span><div class="to-side b ${rev && g.major === 1 ? 'win' : ''}"><b>${esc(P[1])}</b>${rev ? `<span>${g.order.filter(s => g.pick[s] === 1).map(s => `<i style="background:var(--seat-${s})" title="${esc(ctx.nameOf(s))}"></i>`).join('')}</span><em>${g.count[1]}</em>` : ''}</div></div>`;
    const bar = rev ? `<div class="to-bar"><i style="width:${(g.count[0] / tot) * 100}%"></i></div>` : '';
    return `<p class="pt-kicker">Question ${g.round} of ${g.settings.rounds} · would you rather…</p>${sides}${bar}${rev ? sc(g, ctx) : clock() + doneRow(g, ctx)}`;
  },
});
