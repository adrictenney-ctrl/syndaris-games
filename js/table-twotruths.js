// Two Truths & a Lie on the table: who's in the hot seat and their three statements; then the lie
// is stamped and everyone's votes appear under each statement.
import * as E from './twotruths.js?v=68';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'twotruths',
  defaults: { secs: 180, vote: 30 },
  settingsHTML: s => `<label>Time to write ${opt('secs', s, [[120, '2 minutes'], [180, '3 minutes'], [300, '5 minutes']])}</label>
    <label>Time to vote ${opt('vote', s, [[20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'write') return `<h2 class="pt-h">Two truths &amp; a lie</h2><p class="pt-sub">Write three things about yourself on your phone — mark the lie</p>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'guess' || g.phase === 'reveal') {
      const A = E.author(g), S = E.statements(g), rev = g.phase === 'reveal';
      const list = `<ol class="tt-list">${S.map((t, i) => `<li class="${rev ? (i === g.lieAt ? 'lie' : 'true') : ''}"><span>${esc(t)}</span>${rev ? `<em>${i === g.lieAt ? 'LIE' : 'TRUE'}</em><small>${g.order.filter(s => g.votes[s] === i).map(s => `<i style="background:var(--seat-${s})"></i>`).join('')}</small>` : ''}</li>`).join('')}</ol>`;
      return `<p class="pt-kicker">Player ${g.qi + 1} of ${g.queue.length}</p><p class="pt-big">${who(ctx, A)} says…</p>${list}${rev ? `<p class="pt-sub">${g.gain[A] ? `${esc(ctx.nameOf(A))} fooled ${g.gain[A]}!` : 'Nobody was fooled!'}</p>${sc(g, ctx)}` : `${clock()}${doneRow(g, ctx, g.order.filter(s => s !== A))}`}`;
    }
    return sc(g, ctx);
  },
});
