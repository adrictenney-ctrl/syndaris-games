// In Sync on the table: the pile of played cards climbing upward, lives and stars, how many cards
// each player still holds (never what they are), and a flash when someone plays too soon.
import * as E from './insync.js?v=68';
import { partyTable, esc, who } from './table-party.js?v=68';

export default partyTable(E, {
  id: 'insync',
  settingsHTML: () => '<span class="yc-note">A team game · no talking · 2–4 players</span>',
  badges: (g, s) => [`<span class="badge">🂠 ${g.hand[s].length}</span>`, ...(g.starVote?.[s] ? ['<span class="badge got">⭐</span>'] : [])],
  center(g, ctx) {
    const top = g.pile.slice(-6);
    const pile = `<div class="is-pile">${top.map((v, i) => `<span class="is-card ${i === top.length - 1 ? 'top' : ''}" style="--i:${top.length - 1 - i}">${v}</span>`).join('') || '<span class="is-card empty">·</span>'}</div>`;
    let msg = '';
    if (g.phase === 'play') {
      if (g.last?.oops) msg = `<p class="pt-big is-oops">💔 ${who(ctx, g.last.s)} played ${g.last.v} — but ${g.last.oops.map(o => `${esc(ctx.nameOf(o.s))} had ${o.x}`).join(', ')}</p>`;
      else if (g.last?.star) msg = '<p class="pt-big">⭐ Everyone threw their lowest card</p>';
      else if (Object.keys(g.starVote).length) msg = `<p class="pt-big">⭐ A star has been proposed — ${Object.keys(g.starVote).length} agreed</p>`;
      else msg = '<p class="pt-sub">Shh… play in rising order</p>';
    } else if (g.phase === 'cleared') msg = `<p class="pt-big">Level ${g.level} cleared! ${g.reward ? `+1 ${g.reward === 'star' ? '⭐' : '❤️'}` : ''}</p>`;
    const status = `<div class="is-status"><span>Level <b>${g.level}</b>/${g.levels}</span><span>${'❤️'.repeat(g.lives)}</span><span>${'⭐'.repeat(g.stars) || '—'}</span></div>`;
    const lost = g.lost.length ? `<p class="pt-sub">Thrown away: ${g.lost.sort((a, b) => a - b).join(', ')}</p>` : '';
    return `${status}${pile}${msg}${lost}<p class="pt-sub">${g.order.reduce((t, s) => t + g.hand[s].length, 0)} cards left in hands</p>`;
  },
  overlay(g) {
    if (g.phase !== 'over') return null;
    return { key: 'over' + g.moveId, html: `<h2>${g.won ? 'Perfectly in sync! 🏆' : 'Out of lives'}</h2><p>${g.won ? `You cleared all ${g.levels} levels.` : `You reached level ${g.level} of ${g.levels}.`}</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
});
