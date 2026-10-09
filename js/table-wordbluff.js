// Word Bluff on the table: the word, then every meaning numbered for the vote, then the reveal —
// which was real, who wrote each fake and who fell for it.
import * as E from './wordbluff.js?v=68';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'wordbluff',
  defaults: { rounds: 6, secs: 90 },
  settingsHTML: s => `<label>Rounds ${opt('rounds', s, [[4, '4 words'], [6, '6 words'], [8, '8 words'], [10, '10 words']])}</label>
    <label>Time to write ${opt('secs', s, [[60, '1 minute'], [90, '1½ minutes'], [120, '2 minutes']])}</label>`,
  center(g, ctx) {
    const word = E.WORDS[g.word][0];
    const head = `<p class="pt-kicker">Word ${g.round} of ${g.settings.rounds}</p><h2 class="wb-word">${esc(word)}</h2>`;
    if (g.phase === 'write') return `${head}<p class="pt-sub">Write a believable meaning on your phone</p>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'vote') return `${head}<ol class="wb-opts">${g.opts.map(o => `<li>${esc(o.text)}</li>`).join('')}</ol>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'reveal') {
      return `${head}<ol class="wb-opts reveal">${g.opts.map((o, i) => {
        const vs = g.order.filter(s => g.votes[s] === i);
        return `<li class="${o.real ? 'real' : ''}"><span>${esc(o.text)}</span><small>${o.real ? '✓ The real meaning' : `Fake by ${o.by.map(s => esc(ctx.nameOf(s))).join(' & ')}`}${vs.length ? ` · fooled: ` : ''}${vs.map(s => who(ctx, s)).join('')}</small></li>`;
      }).join('')}</ol>${sc(g, ctx)}`;
    }
    return sc(g, ctx);
  },
});
