// Doodle Bluff on the table: while everyone draws, just the clock; then each drawing big on an
// easel, the list of titles to vote on, and the reveal of who fooled whom.
import * as E from './doodlebluff.js?v=68';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';
import { fitCanvas, paint } from './sketch-pad.js?v=68';

export default partyTable(E, {
  id: 'doodlebluff',
  defaults: { secs: 90 },
  settingsHTML: s => `<label>Drawing time <select data-set="secs">${[60, 90, 120].map(n => `<option value="${n}" ${n === s.secs ? 'selected' : ''}>${n} seconds</option>`).join('')}</select></label>`,
  center(g, ctx) {
    if (g.phase === 'draw') return `<h2 class="pt-h">Everyone’s drawing their secret prompt…</h2>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'over') return sc(g, ctx);
    const A = E.artist(g), easel = '<div class="db-easel"><canvas></canvas></div>';
    const head = `<p class="pt-kicker">Drawing ${g.qi + 1} of ${g.queue.length}</p>`;
    if (g.phase === 'title') return `${head}${easel}<p class="pt-sub">What is it? Write a title on your phone</p>${clock()}${doneRow(g, ctx, g.order.filter(s => s !== A))}`;
    const list = `<ol class="wb-opts ${g.phase === 'reveal' ? 'reveal' : ''}">${g.opts.map((o, i) => {
      if (g.phase !== 'reveal') return `<li>${esc(o.text)}</li>`;
      const vs = g.order.filter(s => g.votes[s] === i);
      return `<li class="${o.real ? 'real' : ''}"><span>${esc(o.text)}</span><small>${o.real ? `✓ The real prompt — drawn by ${esc(ctx.nameOf(A))}` : `Fake by ${o.by.map(s => esc(ctx.nameOf(s))).join(' & ')}`}${vs.length ? ' · picked by: ' : ''}${vs.map(s => who(ctx, s)).join('')}</small></li>`;
    }).join('')}</ol>`;
    return `${head}<div class="db-row">${easel}${list}</div>${g.phase === 'vote' ? clock() + doneRow(g, ctx, g.order.filter(s => s !== A)) : sc(g, ctx)}`;
  },
  after(root, g) {
    const cv = root.querySelector('.db-easel canvas');
    if (!cv) return;
    fitCanvas(cv, Math.round(Math.min(window.innerWidth, window.innerHeight) * (g.phase === 'title' ? 0.5 : 0.36)));
    paint(cv, g.pics[E.artist(g)] || []);
  },
});
