// Quick Three on the table: whose turn, then the prompt huge with a five-second countdown ring,
// then the thumbs-up vote.
import * as E from './quickthree.js?v=67';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=67';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'quickthree',
  defaults: { secs: 5, target: 5 },
  settingsHTML: s => `<label>Time ${opt('secs', s, [[5, '5 seconds'], [7, '7 seconds'], [10, '10 seconds (easy)']])}</label>
    <label>Play to ${opt('target', s, [[3, '3 points'], [5, '5 points'], [7, '7 points']])}</label>`,
  center(g, ctx) {
    const P = E.player(g), prompt = g.prompt != null ? `<p class="pt-kicker">Name 3</p><h2 class="qt-prompt">${esc(E.PROMPTS[g.prompt])}</h2>` : '';
    if (g.phase === 'ready') return `<p class="pt-big">${who(ctx, P)}’s turn</p><p class="pt-sub">Tap Go on your phone — you’ll have ${g.settings.secs} seconds</p>${sc(g, ctx)}`;
    if (g.phase === 'go') return `${prompt}<div class="qt-ring" style="--secs:${g.settings.secs}s">${clock()}</div><p class="pt-sub">${who(ctx, P)} — go!</p>`;
    if (g.phase === 'judge') return `${prompt}<p class="pt-big">Did ${who(ctx, P)} do it?</p><p class="pt-sub">Vote on your phones</p>${doneRow(g, ctx, g.order.filter(s => s !== P))}`;
    if (g.phase === 'result') return `${prompt}<p class="pt-big qt-res ${g.made ? 'yes' : 'no'}">${g.made ? '👍 Nailed it! +1' : '👎 Not this time'}</p>${sc(g, ctx)}`;
    return sc(g, ctx);
  },
});
