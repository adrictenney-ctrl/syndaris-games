// Know Me on the table: who's in the hot seat, the question and its four answers, then their real
// answer lit up with everyone's guesses on it.
import * as E from './knowme.js?v=68';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'knowme',
  defaults: { laps: 2 },
  settingsHTML: s => `<label>Hot seats <select data-set="laps">${[[1, 'Once each'], [2, 'Twice each'], [3, 'Three times each']].map(([v, t]) => `<option value="${v}" ${v === s.laps ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  badges: (g, s) => (E.hot(g) === s && g.phase !== 'over' ? ['<span class="badge alone">🔥 hot seat</span>'] : []),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const H = E.hot(g), Q = E.QS[g.q], rev = g.phase === 'reveal';
    const opts = `<ol class="tw-choices">${Q.slice(1).map((t, i) => `<li class="tw-c${i} ${rev ? (g.ans[H] === i ? 'right' : 'wrong') : ''}"><span>${'ABCD'[i]}</span>${esc(t)}${rev ? `<em>${g.order.filter(s => s !== H && g.ans[s] === i).map(s => `<i style="background:var(--seat-${s})"></i>`).join('')}</em>` : ''}</li>`).join('')}</ol>`;
    return `<p class="pt-kicker">In the hot seat</p><p class="pt-big">🔥 ${who(ctx, H)}</p><h2 class="pt-h">${esc(Q[0])}</h2>${opts}${rev ? sc(g, ctx) : clock() + doneRow(g, ctx)}`;
  },
});
