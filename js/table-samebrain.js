// Same Brain on the table: the question, then the answers grouped into pens — the biggest pen
// scores — and who's holding the Odd Sock.
import * as E from './samebrain.js?v=68';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'samebrain',
  defaults: { target: 8, secs: 30 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[5, 8, 10].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label><label>Time to answer <select data-set="secs">${[20, 30, 45].map(n => `<option value="${n}" ${n === s.secs ? 'selected' : ''}>${n} seconds</option>`).join('')}</select></label>`,
  badges: (g, s) => (g.sock === s ? ['<span class="badge">🧦 odd sock</span>'] : []),
  center(g, ctx) {
    const head = `<p class="pt-kicker">Question ${g.round} · first to ${g.settings.target} (not holding the 🧦)</p><h2 class="pt-h">${esc(E.QUESTIONS[g.q])}</h2>`;
    if (g.phase === 'answer') return `${head}${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'reveal') {
      const pens = `<div class="sb-pens">${g.groups.map((x, i) => `<div class="sb-pen ${i === 0 && g.herd === 0 ? 'herd' : ''} ${x.who.length === 1 && g.sock === x.who[0] && g.sockMoved ? 'sock' : ''}"><b>${esc(x.text)}</b><span>${x.who.map(s => `<i style="background:var(--seat-${s})" title="${esc(ctx.nameOf(s))}"></i>`).join('')}</span><small>${x.who.map(s => esc(ctx.nameOf(s))).join(', ')}</small></div>`).join('')}</div>`;
      return `${head}${pens}<p class="pt-big">${g.herd === 0 ? `🐑 The herd says “${esc(g.groups[0].text)}”` : '🤷 No clear herd — nobody scores'}${g.sockMoved ? ` · 🧦 to ${who(ctx, g.sock)}` : ''}</p>${sc(g, ctx)}`;
    }
    return sc(g, ctx);
  },
});
