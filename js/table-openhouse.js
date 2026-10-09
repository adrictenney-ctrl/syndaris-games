// Open House on the table: the row of properties up for auction with everyone's bids, then the row
// of cheques and the properties flipped against them. Coins and hands stay on the phones.
import * as E from './openhouse.js?v=68';
import { partyTable, esc, who, doneRow } from './table-party.js?v=68';

const prop = p => `<span class="oh-card"><b>${E.ICON[p]}</b><em>${p}</em><small>${E.PROPS[p]}</small></span>`;
const cheque = c => `<span class="oh-cheque">💵<b>${c}</b></span>`;
export default partyTable(E, {
  id: 'openhouse',
  settingsHTML: () => '<span class="yc-note">Buy properties, then sell them for cheques · most money wins</span>',
  badges: (g, s) => (g.phase === 'buy' ? [g.out.includes(s) ? '<span class="badge">passed</span>' : `<span class="badge">bid ${g.bids[s]}</span>`] : []),
  center(g, ctx) {
    if (g.phase === 'buy') return `<p class="pt-kicker">Buying · ${g.props.length} properties still to come</p><div class="oh-row">${g.row.map(prop).join('')}</div><p class="pt-big">${who(ctx, g.turn)} to bid${Math.max(...g.bids) ? ` — top bid 🪙 ${Math.max(...g.bids)}` : ''}</p>`;
    if (g.phase === 'sell') return `<p class="pt-kicker">Selling · ${g.cheques.length} cheques still to come</p><div class="oh-row">${g.row.map(cheque).join('')}</div><p class="pt-sub">Everyone picks a property to sell on their phone</p>${doneRow(g, ctx)}`;
    if (g.phase === 'sold') return `<p class="pt-kicker">Sold!</p><div class="oh-row">${g.sold.map(x => `<div class="oh-pair">${prop(x.p)}${cheque(x.c)}<small>${esc(ctx.nameOf(x.s))}</small></div>`).join('')}</div>`;
    return '';
  },
});
