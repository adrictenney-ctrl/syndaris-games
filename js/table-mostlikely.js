// Most Likely To on the table: the question, then bars of votes for each player with the winner
// crowned.
import * as E from './mostlikely.js?v=68';
import { partyTable, esc, clock, doneRow, sc } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'mostlikely',
  defaults: { rounds: 10, secs: 30 },
  settingsHTML: s => `<label>Questions ${opt('rounds', s, [[6, '6'], [10, '10'], [15, '15'], [20, '20']])}</label>
    <label>Time to vote ${opt('secs', s, [[20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds']])}</label>`,
  center(g, ctx) {
    const head = `<p class="pt-kicker">Question ${g.round} of ${g.settings.rounds} · who’s most likely to…</p><h2 class="pt-h ml-q">${esc(E.PROMPTS[g.prompt])}?</h2>`;
    if (g.phase === 'vote') return `${head}${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'reveal') {
      const max = Math.max(1, ...Object.values(g.tally));
      const bars = [...g.order].sort((a, b) => (g.tally[b] || 0) - (g.tally[a] || 0)).map(s => `<li class="${g.crowned.includes(s) ? 'crown' : ''}"><span><i style="background:var(--seat-${s})"></i>${g.crowned.includes(s) ? '👑 ' : ''}${esc(ctx.nameOf(s))}</span><b style="width:${((g.tally[s] || 0) / max) * 100}%;background:var(--seat-${s})"></b><em>${g.tally[s] || 0}</em></li>`).join('');
      return `${head}<ul class="ml-bars">${bars}</ul>${sc(g, ctx)}`;
    }
    return sc(g, ctx);
  },
});
