// One Clue on the table: while clues are written only who's guessing (the word is never shown);
// then the surviving clues on easels — crossed-out ones stay face down — and finally the word.
import * as E from './oneclue.js?v=68';
import { partyTable, esc, clock, doneRow, who } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
export default partyTable(E, {
  id: 'oneclue',
  defaults: { cards: 13, secs: 60 },
  settingsHTML: s => `<label>Cards ${opt('cards', s, [[8, '8 (quick)'], [13, '13'], [20, '20']])}</label><label>Time for clues ${opt('secs', s, [[45, '45 seconds'], [60, '1 minute'], [90, '1½ minutes']])}</label><span class="yc-note">A team game · everyone wins or loses together</span>`,
  badges: (g, s) => (E.guesser(g) === s && g.phase !== 'over' ? ['<span class="badge alone">🙈 guessing</span>'] : []),
  center(g, ctx) {
    const G = E.guesser(g), W = g.order.filter(s => s !== G);
    const head = `<p class="pt-kicker">Card ${g.round} · ${g.got} found · ${g.cardsLeft} left in the deck</p>`;
    if (g.phase === 'clue') return `${head}<p class="pt-big">${who(ctx, G)} is guessing — look away from the phones!</p><p class="pt-sub">Everyone else: one-word clue on your phone. Matching clues cancel out.</p>${clock()}${doneRow(g, ctx, W)}`;
    const show = g.phase !== 'guess';
    const easels = `<div class="oc-easels">${W.map(s => {
      const c = g.clues[s], x = g.cancel[s];
      return `<div class="oc-easel ${x ? 'x' : ''} ${!c ? 'blank' : ''}"><b>${!c ? '—' : x && !show ? '✗' : esc(c)}</b><small>${esc(ctx.nameOf(s))}${x ? ` · ${x}` : ''}</small></div>`;
    }).join('')}</div>`;
    if (g.phase === 'guess') return `${head}${easels}<p class="pt-big">${who(ctx, G)}, what’s the word?</p>${clock()}`;
    if (g.phase === 'result') return `${head}<p class="oc-word ${g.res.kind}">${esc(g.word)}</p><p class="pt-big">${g.res.kind === 'right' ? '✓ Got it!' : g.res.kind === 'wrong' ? `✗ “${esc(g.res.guess)}” — and a card is lost` : 'Passed'}</p>${easels}`;
    return '';
  },
  overlay(g) {
    if (g.phase !== 'over') return null;
    const n = g.got, of = g.settings.cards;
    const word = n === of ? 'Perfect! 🏆' : n >= of * 0.75 ? 'Amazing!' : n >= of * 0.5 ? 'Not bad at all' : 'Keep practising';
    return { key: 'over' + g.moveId, html: `<h2>${n} of ${of} — ${word}</h2><p>${g.history.map(h => `${h.kind === 'right' ? '✓' : h.kind === 'wrong' ? '✗' : '–'} ${h.word}`).join(' · ')}</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
});
