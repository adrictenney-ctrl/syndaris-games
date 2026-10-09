// List Off on the table: the big letter and the clock while everyone writes, then each category
// with everyone's answer (crossed out if it matched someone else's, used the wrong letter or was
// voted down), then the round's points.
import * as E from './listoff.js?v=68';
import { partyTable, esc, clock, doneRow, sc } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'listoff',
  defaults: { rounds: 3, secs: 120, count: 10 },
  settingsHTML: s => `<label>Rounds ${opt('rounds', s, [[2, '2'], [3, '3'], [4, '4'], [5, '5']])}</label>
    <label>Time to write ${opt('secs', s, [[60, '1 minute'], [90, '1½ minutes'], [120, '2 minutes'], [180, '3 minutes']])}</label>
    <label>Categories ${opt('count', s, [[6, '6'], [8, '8'], [10, '10'], [12, '12']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'write') return `<div class="lo-die">${g.letter}</div><p class="pt-sub">Round ${g.round} of ${g.settings.rounds} · ${g.list.length} categories on your phone</p>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'review') {
      const rows = g.order.map(s => {
        const a = g.answers[s][g.ci], m = g.marks[s + ':' + g.ci], out = m || E.vetoed(g, s, g.ci);
        const why = m === 'dup' ? 'matched' : m === 'letter' ? `not ${g.letter}` : out && m !== 'blank' ? 'voted out' : '';
        return `<li class="${out ? 'out' : ''}"><i style="background:var(--seat-${s})"></i><span class="nm">${esc(ctx.nameOf(s))}</span><b>${a ? esc(a) : '—'}</b>${why ? `<em>${why}</em>` : `<strong>+${E.points(g, s, g.ci)}</strong>`}</li>`;
      }).join('');
      return `<p class="pt-kicker">Category ${g.ci + 1} of ${g.list.length} · letter ${g.letter}</p><h2 class="pt-h">${esc(g.list[g.ci])}</h2><ul class="lo-ans">${rows}</ul>${doneRow(g, ctx)}`;
    }
    if (g.phase === 'tally') return `<h2 class="pt-h">End of round ${g.round}</h2><ul class="lo-ans">${g.order.map(s => `<li><i style="background:var(--seat-${s})"></i><span class="nm">${esc(ctx.nameOf(s))}</span><b>+${g.roundPts[s]}</b></li>`).join('')}</ul>${sc(g, ctx)}`;
    return sc(g, ctx);
  },
});
