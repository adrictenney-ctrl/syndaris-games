// Face Off on the table: the prompt with its two answers side by side (no names until the vote is
// done), then the votes stacked under each and who wrote it. The final round lays out everyone's.
import * as E from './faceoff.js?v=68';
import { partyTable, esc, clock, doneRow, sc } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'faceoff',
  defaults: { secs: 90 },
  settingsHTML: s => `<label>Time to write <select data-set="secs">${[60, 90, 120].map(n => `<option value="${n}" ${n === s.secs ? 'selected' : ''}>${n} seconds</option>`).join('')}</select></label>`,
  center(g, ctx) {
    if (g.phase === 'write') return `<p class="pt-kicker">${g.round >= 3 ? 'Final round' : `Round ${g.round} of 2`}</p><h2 class="pt-h">Write your answers on your phone</h2>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'over') return sc(g, ctx);
    const m = g.matchups[g.mi], rev = g.phase === 'reveal';
    const cards = `<div class="fo-cards ${m.all ? 'all' : ''}">${m.opts.map(s => {
      const vs = Object.entries(g.votes).filter(([, x]) => x === s).map(([v]) => v);
      return `<div class="fo-card ${rev && g.sweep === s ? 'sweep' : ''}"><b>${m.ans[s] ? esc(m.ans[s]) : '<em>(no answer)</em>'}</b>${rev ? `<span>${vs.map(v => `<i style="background:var(--seat-${v})"></i>`).join('')}</span><small>${esc(ctx.nameOf(s))} · +${g.gain[s]}${g.sweep === s ? ' · CLEAN SWEEP!' : ''}</small>` : ''}</div>`;
    }).join(m.all ? '' : '<span class="fo-vs">VS</span>')}</div>`;
    return `<p class="pt-kicker">${m.all ? 'Final round' : `Round ${g.round} · face-off ${g.mi + 1} of ${g.matchups.length}`}</p><h2 class="pt-h">${esc(E.PROMPTS[m.p])}</h2>${cards}${rev ? sc(g, ctx) : clock() + doneRow(g, ctx, g.order.filter(s => m.all || (s !== m.a && s !== m.b)))}`;
  },
});
