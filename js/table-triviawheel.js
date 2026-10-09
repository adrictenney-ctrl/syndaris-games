// Trivia Wheel on the table: the six-colour wheel spins and lands on a category, the question
// and its four answers appear, then the right answer lights up. Each player's wedges are shown
// as a little pie beside their name.
import * as E from './triviawheel.js?v=67';
import { partyTable, esc, clock, doneRow, who } from './table-party.js?v=67';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const N = E.CATS.length;
const slice = (i, r, cls = '') => {
  const a0 = (i / N) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / N) * 2 * Math.PI - Math.PI / 2;
  return `<path class="${cls}" d="M0 0L${(r * Math.cos(a0)).toFixed(2)} ${(r * Math.sin(a0)).toFixed(2)}A${r} ${r} 0 0 1 ${(r * Math.cos(a1)).toFixed(2)} ${(r * Math.sin(a1)).toFixed(2)}Z" style="fill:${E.CATS[i].color}"/>`;
};
// A player's pie: wedges they've won in colour, the rest dim.
export const pie = (have, size = 2.6) => `<svg class="tw-pie" viewBox="-11 -11 22 22" style="width:${size}vmin;height:${size}vmin"><circle r="10.5" style="fill:rgba(0,0,0,.35)"/>${E.CATS.map((_, i) => (have.includes(i) ? slice(i, 10) : '')).join('')}</svg>`;
function wheel(g) {
  const turns = 5 * 360 + (360 - (g.cat + 0.5) * (360 / N));
  return `<div class="tw-wheel"><svg viewBox="-52 -52 104 104" class="tw-spin" style="--to:${turns}deg">${E.CATS.map((c, i) => {
    const a = ((i + 0.5) / N) * 2 * Math.PI - Math.PI / 2;
    return `${slice(i, 50)}<text x="${(32 * Math.cos(a)).toFixed(1)}" y="${(32 * Math.sin(a)).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="11">${c.icon}</text>`;
  }).join('')}<circle r="9" style="fill:#1c1622"/></svg><i class="tw-pointer"></i></div>`;
}
const standings = (g, ctx) => `<ol class="pt-rank">${[...g.order].sort((a, b) => g.wedges[b].length - g.wedges[a].length || g.score[b] - g.score[a]).map(s => `<li><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}${pie(g.wedges[s])}<b>${g.score[s]}</b></li>`).join('')}</ol>`;

export default partyTable(E, {
  id: 'triviawheel',
  defaults: { need: 6, secs: 20, spins: 24 },
  settingsHTML: s => `<label>To win ${opt('need', s, [[3, '3 wedges (quick)'], [4, '4 wedges'], [6, 'All 6 wedges']])}</label>
    <label>Time to answer ${opt('secs', s, [[15, '15 seconds'], [20, '20 seconds'], [30, '30 seconds']])}</label>`,
  badges: (g, s) => [`<span class="badge">${pie(g.wedges[s], 2)}</span>`],
  center(g, ctx) {
    const C = E.CATS[g.cat];
    if (g.phase === 'spin') return `${wheel(g)}<p class="pt-sub">Spin ${g.spinNo}</p>`;
    const q = E.Q[C.id][g.qi], right = q[1];
    const head = `<p class="tw-cat" style="--c:${C.color}">${C.icon} ${C.name}</p><h2 class="pt-h tw-qt">${esc(q[0])}</h2>`;
    const choices = `<ol class="tw-choices">${g.choices.map((c, i) => `<li class="tw-c${i} ${g.phase === 'reveal' ? (c === right ? 'right' : 'wrong') : ''}"><span>${'ABCD'[i]}</span>${esc(c)}${g.phase === 'reveal' ? `<em>${g.order.filter(s => g.ans[s]?.i === i).map(s => `<i style="background:var(--seat-${s})"></i>`).join('')}</em>` : ''}</li>`).join('')}</ol>`;
    if (g.phase === 'ask') return `${head}${choices}${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'reveal') return `${head}${choices}<p class="pt-sub">${g.fastest >= 0 ? `Fastest: ${who(ctx, g.fastest)}` : 'Nobody got it!'}</p>${standings(g, ctx)}`;
    return standings(g, ctx);
  },
});
