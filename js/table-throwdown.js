// Throwdown on the table: this round's matches side by side with the score in each and the last
// throws flipped face to face, plus the earlier rounds as a bracket strip.
import * as E from './throwdown.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

const nm = (ctx, s) => (s == null ? '—' : esc(ctx.nameOf(s)));
export default partyTable(E, {
  id: 'throwdown',
  defaults: { bestOf: 3 },
  settingsHTML: s => `<label>Matches <select data-set="bestOf">${[[1, 'One throw'], [3, 'Best of 3'], [5, 'Best of 5']].map(([v, t]) => `<option value="${v}" ${v === s.bestOf ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  center(g, ctx) {
    const R = g.rounds[g.rounds.length - 1];
    const live = `<div class="td-matches">${R.map(m => m.bye ? `<div class="td-match bye">${who(ctx, m.a)}<small>bye</small></div>` : `<div class="td-match ${m.w != null ? 'done' : ''}">
      <div class="td-side ${m.w === m.a ? 'win' : m.w === m.b ? 'lose' : ''}"><b>${nm(ctx, m.a)}</b><span class="td-throw">${m.last ? E.THROWS[m.last.ta].e : m.ta != null ? '✊' : '…'}</span><em>${m.wa}</em></div>
      <span class="td-vs">vs</span>
      <div class="td-side ${m.w === m.b ? 'win' : m.w === m.a ? 'lose' : ''}"><em>${m.wb}</em><span class="td-throw">${m.last ? E.THROWS[m.last.tb].e : m.tb != null ? '✊' : '…'}</span><b>${nm(ctx, m.b)}</b></div></div>`).join('')}</div>`;
    const past = g.rounds.slice(0, -1).map((r, i) => `<div class="td-past"><small>Round ${i + 1}</small>${r.map(m => `<span>${nm(ctx, m.w)}</span>`).join('')}</div>`).join('');
    const head = g.phase === 'over' ? `<p class="pt-big">🏆 ${who(ctx, g.winner)} is the champion!</p>` : `<p class="pt-kicker">Round ${g.rounds.length} · ${g.alive.length} players left</p>`;
    return `${head}${live}<div class="td-bracket">${past}</div>`;
  },
});
