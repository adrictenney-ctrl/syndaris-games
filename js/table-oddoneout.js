// Odd One Out on the table: the topic card's 4×4 grid of words (the secret one is never marked
// until the end), the clues as they come in around the table, then the vote and the reveal.
import * as E from './oddoneout.js?v=67';
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=67';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'oddoneout',
  defaults: { rounds: 0, secs: 45 },
  settingsHTML: s => `<label>Rounds ${opt('rounds', s, [[0, 'One per player'], [3, '3'], [5, '5'], [8, '8']])}</label>
    <label>Time per clue ${opt('secs', s, [[30, '30 seconds'], [45, '45 seconds'], [60, '1 minute']])}</label>`,
  center(g, ctx) {
    const W = E.words(g), reveal = g.phase === 'result' || g.phase === 'over';
    const grid = `<div class="oo-grid">${W.map((w, i) => `<span class="${reveal && i === g.word ? 'secret' : ''} ${g.phase === 'result' && g.guess === i && i !== g.word ? 'guess' : ''}">${esc(w)}</span>`).join('')}</div>`;
    const clues = `<ul class="oo-clues">${g.order.map(s => `<li class="${g.phase === 'clue' && E.turnSeat(g) === s ? 'up' : ''} ${g.phase === 'result' && s === g.odd ? 'odd' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}<b>${g.clues[s] ? esc(g.clues[s]) : g.phase === 'clue' && E.turnSeat(g) === s ? '…' : ''}</b>${g.tally && g.phase !== 'clue' && g.phase !== 'vote' && g.tally[s] ? `<em>${'●'.repeat(g.tally[s])}</em>` : ''}</li>`).join('')}</ul>`;
    const head = `<p class="pt-kicker">Round ${g.round} of ${g.rounds}</p><h2 class="pt-h">${esc(E.TOPICS[g.topic][0])}</h2>`;
    let foot = '';
    if (g.phase === 'peek') foot = '<p class="pt-big">Check your phones… 🤫</p><p class="pt-sub">One of you is the Odd One Out</p>';
    else if (g.phase === 'clue') foot = `<p class="pt-sub">${who(ctx, E.turnSeat(g))} — one-word clue on your phone</p>${clock()}`;
    else if (g.phase === 'vote') foot = `<p class="pt-big">Vote! Who’s the Odd One Out?</p>${clock()}${doneRow(g, ctx)}`;
    else if (g.phase === 'guess') foot = `<p class="pt-big">${who(ctx, g.odd)} was caught! Can they guess the word?</p>${clock()}`;
    else if (g.phase === 'result') foot = `<p class="pt-big">${g.how === 'escaped' ? `${who(ctx, g.odd)} got away with it! +2` : g.how === 'guessed' ? `${who(ctx, g.odd)} was caught — but guessed it! +1` : `Caught ${who(ctx, g.odd)}! Everyone else +1`}</p>${sc(g, ctx)}`;
    return `${head}<div class="oo-wrap">${grid}${clues}</div>${foot}`;
  },
});
