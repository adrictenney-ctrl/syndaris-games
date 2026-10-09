// Nope! on the table: the card up for grabs with its little pile of chips, the deck, and everyone's
// taken cards laid out in runs. Chip counts stay hidden on the phones.
import * as E from './nope.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'nope',
  low: true,
  settingsHTML: () => '<span class="yc-note">Lowest score wins · runs only count their lowest card</span>',
  center(g, ctx) {
    const mid = g.card != null ? `<div class="np-mid"><span class="np-big">${g.card}</span><div class="np-pot">${'<i></i>'.repeat(Math.min(g.pot, 30))}</div><small>${g.pot} chip${g.pot === 1 ? '' : 's'} · ${g.deck.length} left in the deck</small></div>` : '';
    const rows = `<ul class="np-rows">${g.order.map(s => `<li class="${E.turnSeat(g) === s ? 'up' : ''}"><span class="nm"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}${g.phase === 'over' ? ` <b>${g.score[s]}</b>` : ''}</span><div class="np-runs">${E.runs(g.taken[s]).map(r => `<span>${r.map((v, i) => `<i class="${i ? 'dim' : ''}">${v}</i>`).join('')}</span>`).join('')}</div></li>`).join('')}</ul>`;
    return `${mid}${g.phase === 'play' ? `<p class="pt-sub">${who(ctx, g.turn)}: take it, or Nope?</p>` : ''}${rows}`;
  },
});
