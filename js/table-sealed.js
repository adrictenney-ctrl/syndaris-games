// Sealed Letter on the table: the deck, each player's played cards in a row (so everyone can count
// what's gone), who's shielded or out, the last few plays, and the seals won.
import * as E from './sealed.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

const card = (v, cls = '') => `<span class="sl-tcard ${cls}"><b>${E.CARDS[v].e}</b><small>${v}</small></span>`;
const named = (ctx, t) => esc(t).replace(/@(\d+)@/g, (_, s) => esc(ctx.nameOf(Number(s))));
export default partyTable(E, {
  id: 'sealed',
  defaults: { seals: 0 },
  settingsHTML: s => `<label>Seals to win <select data-set="seals">${[[0, 'Standard'], [2, '2 (quick)'], [3, '3'], [5, '5']].map(([v, t]) => `<option value="${v}" ${v === s.seals ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  badges: (g, s) => [`<span class="badge">💌 ${g.score[s]}</span>`, ...(g.shield?.[s] ? ['<span class="badge got">🛡️</span>'] : []), ...(g.out?.[s] ? ['<span class="badge">out</span>'] : [])],
  center(g, ctx) {
    const rows = `<ul class="sl-rows">${g.order.map(s => `<li class="${g.out[s] ? 'out' : ''} ${E.turnSeat(g) === s ? 'up' : ''}"><span class="nm"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}${g.shield[s] ? ' 🛡️' : ''}<small>${'💌'.repeat(g.score[s])}</small></span><div>${g.played[s].map(v => card(v)).join('')}${g.phase === 'result' && !g.out[s] ? card(g.hand[s][0], 'shown') : ''}</div></li>`).join('')}</ul>`;
    const deck = `<div class="sl-deck"><span class="sl-back">${g.deck.length}</span><small>in the deck</small>${g.faceUp.length ? `<div>${g.faceUp.map(v => card(v)).join('')}</div><small>set aside</small>` : ''}</div>`;
    const log = `<ul class="sl-log">${g.log.map(t => `<li>${named(ctx, t)}</li>`).join('')}</ul>`;
    const head = g.phase === 'result' ? `<p class="pt-big">${g.roundWin.map(s => who(ctx, s)).join(' & ')} win${g.roundWin.length > 1 ? '' : 's'} the round 💌</p>` : `<p class="pt-sub">${who(ctx, g.turn)}’s turn</p>`;
    return `<p class="pt-kicker">Round ${g.round} · first to ${g.need} seals</p>${head}<div class="sl-wrap">${deck}${rows}</div>${log}`;
  },
});
