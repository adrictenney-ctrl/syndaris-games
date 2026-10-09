// Close Call on the table: the question, then the betting mat — every guess in a row from low to
// high with its odds and whose it is, bets stacked on top — and the answer flipped at the end.
import * as E from './closecall.js?v=68';
import { partyTable, esc, clock, doneRow, sc } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'closecall',
  defaults: { rounds: 7 },
  settingsHTML: s => `<label>Questions <select data-set="rounds">${[5, 7, 10].map(n => `<option value="${n}" ${n === s.rounds ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`,
  center(g, ctx) {
    const head = `<p class="pt-kicker">Question ${g.round} of ${g.settings.rounds}</p><h2 class="pt-h">${esc(E.QS[g.q][0])}</h2>`;
    if (g.phase === 'guess') return `${head}<p class="pt-sub">Guess on your phone — nobody needs to be right</p>${clock()}${doneRow(g, ctx)}`;
    const mat = `<div class="cc-mat">${g.slots.map((sl, i) => `<div class="cc-slot ${g.phase === 'reveal' && g.win === i ? 'win' : ''}"><em>${sl.odds} to 1</em><b>${sl.low ? '⬇ lower than all' : sl.v.toLocaleString()}</b><small>${sl.who.map(s => esc(ctx.nameOf(s))).join(', ')}</small><span>${Object.entries(g.bets).filter(([, x]) => x === i).map(([s]) => `<i style="background:var(--seat-${s})"></i>`).join('')}</span></div>`).join('')}</div>`;
    if (g.phase === 'bet') return `${head}${mat}<p class="pt-sub">Bet on the closest guess without going over</p>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'reveal') return `${head}<p class="cc-answer">${E.QS[g.q][1].toLocaleString()}</p>${mat}${sc(g, ctx)}`;
    return sc(g, ctx);
  },
});
