// Top Answers on the table: the survey question over a board of numbered tiles that flip to show
// each answer and its points, the strikes, and the points banked so far.
import * as E from './topanswers.js?v=68';
import { partyTable, esc, clock, teamScores, TEAMS } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'topanswers',
  defaults: { rounds: 5, secs: 30 },
  settingsHTML: s => `<label>Rounds ${opt('rounds', s, [[3, '3'], [5, '5'], [7, '7']])}</label>
    <label>Time per guess ${opt('secs', s, [[20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds']])}</label><span class="yc-note">Teams alternate around the table · last round double</span>`,
  center(g, ctx) {
    const [q, A] = E.SURVEYS[g.q];
    const all = g.phase === 'reveal' || g.phase === 'over';
    const tiles = A.map(([a, p], i) => {
      const on = g.open.includes(i);
      return `<li class="${on ? 'on' : all ? 'shown' : ''} ${g.last?.hit && g.last.i === i && g.phase === 'play' ? 'new' : ''}"><span class="n">${i + 1}</span>${on || all ? `<b>${esc(a)}</b><em>${p}</em>` : ''}</li>`;
    }).join('');
    const strikes = `<div class="ta-x">${g.phase === 'play' || g.phase === 'steal' ? clock() : ''}${[0, 1, 2].map(i => `<i class="${i < g.strikes ? 'on' : ''}">✗</i>`).join('')}</div>`;
    let foot = '';
    if (g.phase === 'play') foot = `<p class="pt-sub"><b class="pt-team t${g.up}">${TEAMS[g.up]}</b> is guessing${g.last && !g.last.hit ? ` · “${esc(g.last.text)}” isn’t up there` : ''}</p>`;
    else if (g.phase === 'steal') foot = `<p class="pt-big"><b class="pt-team t${1 - g.up}">${TEAMS[1 - g.up]}</b> can steal ${E.bank(g)} points!</p>`;
    else if (g.phase === 'reveal') foot = `<p class="pt-big">${g.stole === true ? `Stolen with “${esc(g.stealText)}”! ` : g.stole === false && g.stealText ? `“${esc(g.stealText)}” missed. ` : ''}<b class="pt-team t${g.got.team}">${TEAMS[g.got.team]}</b> +${g.got.pts}</p>`;
    return `${teamScores(g)}<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}${g.round === g.settings.rounds ? ' · DOUBLE POINTS' : ''} · bank ${E.bank(g)}</p><h2 class="pt-h">${esc(q)}</h2><ol class="ta-board" style="grid-template-rows:repeat(${Math.ceil(A.length / 2)},auto)">${tiles}</ol>${strikes}${foot}`;
  },
});
