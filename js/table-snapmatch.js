// Snap Match on the table: the big round middle card with its eight pictures scattered at different
// sizes and angles, the pile, and who won the last card (with the shared picture).
import * as E from './snapmatch.js?v=68';
import { partyTable, who, sc } from './table-party.js?v=68';

// Positions inside the circle: one in the middle, seven around it.
const SPOTS = [[50, 50], [50, 17], [78, 31], [82, 63], [58, 84], [26, 80], [16, 52], [27, 22]];
export function roundCard(id, layout, cls = '') {
  const syms = E.DECK[id];
  return `<div class="sm-card ${cls}">${syms.map((x, i) => {
    const [l, t] = SPOTS[layout[i]], size = 7 + ((x * 7 + id) % 5) * 1.3, rot = ((x * 53 + id * 17) % 80) - 40;
    return `<span style="left:${l}%;top:${t}%;font-size:${size}vmin;transform:translate(-50%,-50%) rotate(${rot}deg)">${E.SYMS[x]}</span>`;
  }).join('')}</div>`;
}
export default partyTable(E, {
  id: 'snapmatch',
  defaults: { cards: 30 },
  settingsHTML: s => `<label>Cards in the pile <select data-set="cards">${[[15, '15 (quick)'], [30, '30'], [49, 'All of them']].map(([v, t]) => `<option value="${v}" ${v === s.cards ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  badges: (g, s) => (g.frozen?.[s] > Date.now() ? ['<span class="badge">❄️</span>'] : []),
  center(g, ctx) {
    const last = g.last ? `<p class="pt-sub">${who(ctx, g.last.s)} spotted the ${E.SYMS[g.last.sym]}</p>` : '<p class="pt-sub">Find the picture your card shares with this one</p>';
    if (g.phase === 'over') return sc(g, ctx);
    return `<p class="pt-kicker">Card ${g.round} · ${g.pile.length} left</p>${roundCard(g.center, g.layout, 'pop')}${last}${sc(g, ctx)}`;
  },
});
