// Bull Pen on the table: the four rows (with the danger of a sixth card), then everyone's picks
// flipped together and slid into place, lowest first.
import * as E from './bullpen.js?v=68';
import { partyTable, esc, who, doneRow } from './table-party.js?v=68';

const card = (v, extra = '') => `<span class="bp-card b${E.bulls(v)} ${extra}"><b>${v}</b><small>${'🐂'.repeat(E.bulls(v))}</small></span>`;
export default partyTable(E, {
  id: 'bullpen',
  low: true,
  defaults: { limit: 66 },
  settingsHTML: s => `<label>Game ends at <select data-set="limit">${[33, 50, 66].map(n => `<option value="${n}" ${n === s.limit ? 'selected' : ''}>${n} bull heads</option>`).join('')}</select></label>`,
  badges: (g, s) => [`<span class="badge">🐂 ${g.taken[s]}</span>`],
  center(g, ctx) {
    const last = g.placed.length ? g.placed[g.placed.length - 1] : null;
    const rows = `<div class="bp-rows">${g.rows.map((r, i) => `<div class="bp-row ${r.length >= 5 ? 'danger' : ''}"><span class="bp-n">${i + 1}</span>${r.map((v, k) => card(v, last && last.row === i && k === r.length - 1 && g.phase !== 'pick' ? 'new' : '')).join('')}${Array.from({ length: 5 - r.length }, () => '<span class="bp-slot"></span>').join('')}<span class="bp-slot six">✕</span><em>🐂${E.rowBulls(r)}</em></div>`).join('')}</div>`;
    let top = '';
    if (g.phase === 'pick') top = `<p class="pt-sub">Deal ${g.deal} · ${g.hand[g.order[0]].length} cards left · pick on your phones</p>${doneRow(g, ctx)}`;
    else {
      const all = [...g.placed, ...(g.queue || [])];
      top = `<div class="bp-reveal">${all.sort((a, b) => a.v - b.v).map(p => `<span class="${g.queue?.some(q => q.v === p.v) ? 'wait' : 'done'}">${card(p.v)}<small>${esc(ctx.nameOf(p.s))}</small></span>`).join('')}</div>`;
      if (g.phase === 'choose') top += `<p class="pt-big">${who(ctx, g.queue[0].s)}’s ${g.queue[0].v} is too low — they choose a row to take</p>`;
    }
    return `${top}${rows}`;
  },
});
