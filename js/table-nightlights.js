// Night Lights on the table: the five rockets climbing into the night sky, hint and fuse tokens,
// the deck, the discards — but never anyone's hand (that's on everyone else's phones).
import * as E from './nightlights.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

const named = (ctx, t) => esc(t).replace(/@(\d+)@/g, (_, s) => esc(ctx.nameOf(Number(s))));
export default partyTable(E, {
  id: 'nightlights',
  settingsHTML: () => '<span class="yc-note">A team game · you see everyone’s cards but your own</span>',
  badges: (g, s) => (g.turn === s && g.phase === 'play' ? ['<span class="badge alone">🎆 turn</span>'] : []),
  center(g, ctx) {
    const rockets = `<div class="nl-sky">${E.COLORS.map((C, i) => `<div class="nl-rocket" style="--c:${C.c}">${[1, 2, 3, 4, 5].map(n => `<i class="${n <= g.fw[i] ? 'lit' : ''}">${n}</i>`).reverse().join('')}<b>${C.n}</b></div>`).join('')}</div>`;
    const tokens = `<div class="nl-tokens"><span>${'💡'.repeat(g.hints)}<em>${'○'.repeat(8 - g.hints)}</em></span><span>${'🔥'.repeat(g.fuses)}<em>${'○'.repeat(3 - g.fuses)}</em></span><span>🂠 ${g.deck.length}</span></div>`;
    const disc = `<div class="nl-disc">${[...g.discards].sort((a, b) => a.c - b.c || a.n - b.n).map(c => `<i style="--c:${E.COLORS[c.c].c}">${c.n}</i>`).join('')}</div>`;
    const log = `<ul class="sl-log">${g.log.map(t => `<li>${named(ctx, t)}</li>`).join('')}</ul>`;
    return `<p class="pt-kicker">Score ${E.points(g)}/25${g.finalTurns != null ? ` · last round: ${g.finalTurns} turns left` : ''}</p>${rockets}${tokens}${g.phase === 'play' ? `<p class="pt-sub">${who(ctx, g.turn)}’s turn</p>` : ''}${log}${disc}`;
  },
  overlay(g) {
    if (g.phase !== 'over') return null;
    const p = E.points(g), word = g.fuses >= 3 ? 'The show fizzled out' : p === 25 ? 'A perfect show! 🎆' : p >= 20 ? 'A dazzling show!' : p >= 14 ? 'A fine show' : 'A modest show';
    return { key: 'over' + g.moveId, html: `<h2>${word}</h2><p>${p} of 25 lit</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
});
