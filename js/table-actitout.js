// Act It Out on the table: who's acting, the category (never the answer), the clock, and the
// list of what they got at the end of the turn.
import * as E from './actitout.js?v=67';
import { partyTable, esc, clock, teamScores, who, TEAMS } from './table-party.js?v=67';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'actitout',
  defaults: { secs: 60, rounds: 2 },
  settingsHTML: s => `<label>Turn ${opt('secs', s, [[45, '45 seconds'], [60, '1 minute'], [90, '1½ minutes']])}</label>
    <label>Length ${opt('rounds', s, [[1, 'Everyone acts once'], [2, 'Everyone acts twice']])}</label><span class="yc-note">Teams alternate around the table</span>`,
  badges: (g, s) => (E.turnSeat(g) === s ? ['<span class="badge alone">🎭 acting</span>'] : []),
  center(g, ctx) {
    const A = E.actor(g), head = `${teamScores(g)}<p class="pt-kicker"><b class="pt-team t${g.up}">${TEAMS[g.up]}</b> is up</p>`;
    if (g.phase === 'ready') return `${head}<p class="pt-big">${who(ctx, A)} acts next</p><p class="pt-sub">Tap Start on your phone · no talking, no sounds!</p>`;
    if (g.phase === 'act') return `${head}<div class="ai-mask">🎭</div><p class="pt-big">${who(ctx, A)} is acting</p><p class="pt-sub">Category: <b>${esc(E.DECK[g.card][0])}</b> · ${g.log.filter(x => x.r === 'got').length} so far</p>${clock()}`;
    return `${head}<p class="pt-big">Time!</p><ul class="pt-log">${g.log.map(x => `<li class="${x.r}">${x.r === 'got' ? '✓' : '↷'} ${esc(x.w)}</li>`).join('') || '<li>Nothing this time</li>'}</ul>`;
  },
});
