// Blurt It on the table: the topic, ten face-down slots that flip as the card-holder ticks
// answers, the clock and the team scores.
import * as E from './blurtit.js?v=67';
import { partyTable, esc, clock, teamScores, who, TEAMS } from './table-party.js?v=67';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'blurtit',
  defaults: { secs: 60, turns: 2 },
  settingsHTML: s => `<label>Turn ${opt('secs', s, [[45, '45 seconds'], [60, '1 minute'], [90, '1½ minutes']])}</label>
    <label>Length ${opt('turns', s, [[1, '1 turn per team'], [2, '2 turns per team'], [3, '3 turns per team'], [4, '4 turns per team']])}</label><span class="yc-note">Teams alternate around the table</span>`,
  badges: (g, s) => (E.turnSeat(g) === s ? ['<span class="badge alone">🃏 card</span>'] : []),
  center(g, ctx) {
    const A = E.answers(g), all = g.phase === 'end';
    const slots = `<ol class="bi-slots">${A.map((x, i) => `<li class="${g.found.includes(i) ? 'on' : all ? 'miss' : ''}">${g.found.includes(i) || all ? esc(x) : ''}</li>`).join('')}</ol>`;
    const head = `${teamScores(g)}<p class="pt-kicker"><b class="pt-team t${g.up}">${TEAMS[g.up]}</b> blurts · ${who(ctx, E.judge(g))} holds the card</p><h2 class="pt-h">${esc(E.TOPICS[g.topic][0])}</h2>`;
    if (g.phase === 'ready') return `${head}<p class="pt-sub">Card-holder: tap Start on your phone</p>`;
    if (g.phase === 'play') return `${head}${clock()}${slots}`;
    return `${head}<p class="pt-big">${g.found.length} of 10!</p>${slots}`;
  },
});
