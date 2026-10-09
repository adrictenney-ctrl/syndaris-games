// Answer Board on the table: the blue board of categories and values; a picked clue fills the
// screen with its four answers, then the right one lights up.
import * as E from './answerboard.js?v=68';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'answerboard',
  defaults: { cats: 5, secs: 15 },
  settingsHTML: s => `<label>Board ${opt('cats', s, [[3, '3 categories (quick)'], [4, '4 categories'], [5, '5 categories'], [6, '6 categories']])}</label>
    <label>Time to answer ${opt('secs', s, [[10, '10 seconds'], [15, '15 seconds'], [20, '20 seconds']])}</label>`,
  badges: (g, s) => (g.phase === 'pick' && g.picker === s ? ['<span class="badge alone">picking</span>'] : []),
  center(g, ctx) {
    if (g.phase === 'pick') {
      return `<div class="ab-board" style="--n:${g.board.length}">${g.board.map(B => `<div class="ab-head">${E.CATS[B.cat].icon}<span>${esc(E.CATS[B.cat].name)}</span></div>`).join('')}
        ${[0, 1, 2, 3, 4].map(r => g.board.map(B => `<div class="ab-val ${B.used[r] ? 'used' : ''}">${B.used[r] ? '' : E.val(r)}</div>`).join('')).join('')}</div>
        <p class="pt-sub">${who(ctx, g.picker)} picks on their phone</p>${sc(g, ctx)}`;
    }
    const q = E.clue(g), C = E.CATS[g.board[g.at.c].cat], dd = E.isDD(g);
    const head = `<p class="tw-cat" style="--c:${C.color}">${C.icon} ${esc(C.name)} · ${E.val(g.at.r) * (dd ? 2 : 1)}${dd ? ' · DOUBLE DOWN' : ''}</p><h2 class="pt-h ab-q">${esc(q[0])}</h2>`;
    const choices = `<ol class="tw-choices">${g.choices.map((c, i) => `<li class="tw-c${i} ${g.phase === 'reveal' ? (c === q[1] ? 'right' : 'wrong') : ''}"><span>${'ABCD'[i]}</span>${esc(c)}${g.phase === 'reveal' ? `<em>${Object.keys(g.ans).filter(s => g.ans[s].i === i).map(s => `<i style="background:var(--seat-${s})"></i>`).join('')}</em>` : ''}</li>`).join('')}</ol>`;
    if (g.phase === 'clue') return `${head}${choices}${clock()}${doneRow(g, ctx, dd ? [g.picker] : g.order)}`;
    return `${head}${choices}<p class="pt-sub">${g.fastest >= 0 ? `First right: ${who(ctx, g.fastest)} — they pick next` : 'Nobody got it'}</p>${sc(g, ctx)}`;
  },
});
