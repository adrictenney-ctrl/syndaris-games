// Dreamcards on the table: the storyteller's clue, then every played card laid out face up and
// numbered for the vote, and at the reveal whose card was whose and who voted for it.
import * as E from './dreamcards.js?v=68';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'dreamcards',
  defaults: { target: 25 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[15, 25, 30].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label>`,
  badges: (g, s) => (E.teller(g) === s && g.phase !== 'over' ? ['<span class="badge alone">📖 storyteller</span>'] : []),
  center(g, ctx) {
    const T = E.teller(g), O = g.order.filter(s => s !== T);
    const clue = g.clue ? `<p class="dc-clue">“${esc(g.clue)}”</p><p class="pt-sub">— ${who(ctx, T)}</p>` : '';
    if (g.phase === 'tell') return `<p class="pt-kicker">Round ${g.round}</p><p class="pt-big">${who(ctx, T)} is the storyteller — choosing a card and a clue…</p>${sc(g, ctx)}`;
    if (g.phase === 'match') return `${clue}<p class="pt-sub">Everyone else: play the card from your hand that fits best</p>${clock()}${doneRow(g, ctx, O)}`;
    if (g.phase === 'over') return sc(g, ctx);
    const rev = g.phase === 'reveal';
    const cards = `<div class="dc-table">${g.table.map((x, i) => `<div class="dc-slot ${rev && x.s === T ? 'teller' : ''}">${E.art(x.c)}<b>${i + 1}</b>${rev ? `<small>${esc(ctx.nameOf(x.s))}</small><span>${Object.entries(g.votes).filter(([, v]) => v === i).map(([s]) => `<i style="background:var(--seat-${s})"></i>`).join('')}</span>` : ''}</div>`).join('')}</div>`;
    if (!rev) return `${clue}${cards}<p class="pt-sub">Vote for the storyteller’s card on your phone</p>${clock()}${doneRow(g, ctx, O)}`;
    const how = g.finders.length === 0 ? 'Nobody found it — the storyteller scores nothing' : g.finders.length === O.length ? 'Everyone found it — too easy! The storyteller scores nothing' : `${g.finders.map(s => esc(ctx.nameOf(s))).join(', ')} found it`;
    return `${clue}${cards}<p class="pt-big">${how}</p>${sc(g, ctx)}`;
  },
});
