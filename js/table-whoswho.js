// Who's Who on the table: both boards facing each other, with faces flipping down as questions
// are answered, and the list of questions asked so far.
import * as E from './whoswho.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'whoswho',
  settingsHTML: () => '<span class="yc-note">Two players · ask yes/no questions, then guess</span>',
  center(g, ctx) {
    const boards = g.order.map(s => `<div class="ww-tboard ${g.turn === s && g.phase === 'play' ? 'up' : ''}"><p>${who(ctx, s)} · ${g.up[s].filter(Boolean).length} standing</p><div class="ww-board">${E.PEOPLE.map((p, i) => `<span class="${g.up[s][i] ? '' : 'down'}">${g.up[s][i] ? E.face(i) : ''}</span>`).join('')}</div></div>`).join('');
    const log = `<ul class="sl-log">${g.asked.slice(0, 5).map(x => `<li><b>${esc(ctx.nameOf(x.s))}</b>: ${esc(x.q)} <b>${x.yes ? 'Yes' : 'No'}</b></li>`).join('')}</ul>`;
    const end = g.phase === 'over' ? `<p class="pt-big">${g.how === 'right' ? `${who(ctx, g.winner)} guessed it!` : `${who(ctx, g.guess.s)} guessed wrong — ${who(ctx, g.winner)} wins`}</p><div class="ww-reveal">${g.order.map(s => `<span>${E.face(g.secret[s])}<small>${esc(ctx.nameOf(s))} was ${E.PEOPLE[g.secret[s]].name}</small></span>`).join('')}</div>` : '';
    return `${end}<div class="ww-boards">${boards}</div>${log}`;
  },
});
