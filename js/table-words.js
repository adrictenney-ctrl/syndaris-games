// Table screens for the word games (word-games.js).
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';
import * as W from './word-games.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const rounds = (list, label = 'Rounds') => s => `<label>${label} ${opt('rounds', s, list.map(n => [n, String(n)]))}</label>`;
const nm = (ctx, s) => esc(ctx.nameOf(s));
const tiles = (txt, cls = '') => `<div class="wd-tiles ${cls}">${[...txt].map(c => (c === ' ' ? '<i class="sp"></i>' : `<i class="${c === '_' ? 'blank' : ''}">${c === '_' ? '' : esc(c.toUpperCase())}</i>`)).join('')}</div>`;
const answers = (g, ctx, fmt) => `<div class="qz-guesses">${g.order.filter(s => g.ans[s]).map(s => `<span class="${g.gain[s] ? 'ok' : ''}"><i style="background:var(--seat-${s})"></i>${nm(ctx, s)}: <b>${esc(fmt(g.ans[s], s))}</b>${g.gain[s] ? ` +${g.gain[s]}` : ''}</span>`).join('')}</div>`;

export const fivelettersT = partyTable(W.fiveletters, {
  id: 'fiveletters', defaults: { rounds: 3, secs: 180 }, settingsHTML: rounds([1, 3, 5], 'Words'),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const boards = `<div class="fl-boards">${g.order.map(s => `<div class="${g.solvedAt[s] ? 'won' : ''}"><p><i style="background:var(--seat-${s})"></i>${nm(ctx, s)}</p>${W.fiveletters.grid(g.rows[s], g.phase === 'reveal')}</div>`).join('')}</div>`;
    return `<p class="pt-kicker">Word ${g.round} of ${g.settings.rounds}</p>${g.phase === 'reveal' ? tiles(g.word, 'big') : '<p class="pt-big">Guess the five-letter word on your phone</p>' + clock()}${boards}${sc(g, ctx)}`;
  },
});
export const wordgallowsT = partyTable(W.wordgallows, {
  id: 'wordgallows', defaults: { rounds: 4, secs: 25 }, settingsHTML: rounds([3, 4, 6], 'Words'),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const parts = ['<circle cx="70" cy="30" r="10"/>', '<path d="M70 40v30"/>', '<path d="M70 48l-14 12"/>', '<path d="M70 48l14 12"/>', '<path d="M70 70l-12 18"/>', '<path d="M70 70l12 18"/>', '<path d="M64 28l4 4m0-4l-4 4M72 28l4 4m0-4l-4 4"/>'];
    const gallows = `<svg viewBox="0 0 100 100" class="wd-gallows"><path d="M10 95h50M25 95V8h45v12" class="frame"/>${parts.slice(0, g.misses).join('')}</svg>`;
    const used = `<div class="ss-used">${'abcdefghijklmnopqrstuvwxyz'.split('').map(c => `<i class="${g.called.includes(c) ? 'on' : ''} ${g.called.includes(c) && !g.word.includes(c) ? 'miss' : ''}">${c.toUpperCase()}</i>`).join('')}</div>`;
    const last = g.phase === 'show' ? `<p class="pt-sub">${Object.entries(g.last).map(([L, x]) => `${L.toUpperCase()}: ${x.n ? `×${x.n} (${x.by.map(s => nm(ctx, s)).join(', ')})` : '✗'}`).join(' · ')}</p>` : '';
    const end = g.phase === 'end' ? `<p class="pt-big">${g.misses >= 7 ? '💀 Hanged!' : g.solved >= 0 ? `${who(ctx, g.solved)} solved it!` : 'Solved!'}</p>` : '';
    return `<p class="pt-kicker">${esc(g.cat)} · word ${g.round} of ${g.settings.rounds}</p><div class="wd-row">${gallows}<div>${tiles(W.wordgallows.masked(g))}${used}</div></div>${last}${end}${g.phase === 'pick' ? '<p class="pt-sub">Everyone picks a letter on their phone at the same time</p>' + clock() + doneRow(g, ctx) : ''}${sc(g, ctx)}`;
  },
});
export const longwordT = partyTable(W.longword, {
  id: 'longword', defaults: { rounds: 5, secs: 40 }, settingsHTML: rounds([3, 5, 8]),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    return `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p>${tiles(g.letters.join(''), 'big')}${g.phase === 'play' ? `<p class="pt-sub">Make the longest word you can from these letters</p>${clock()}${doneRow(g, ctx)}` : answers(g, ctx, a => `${a.t.toUpperCase()} (${a.v})`)}${sc(g, ctx)}`;
  },
});
export const targetnumberT = partyTable(W.targetnumber, {
  id: 'targetnumber', defaults: { rounds: 4, secs: 60 }, settingsHTML: rounds([3, 4, 6]),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const nums = `<div class="wd-nums">${g.nums.map(n => `<span>${n}</span>`).join('')}</div>`;
    return `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p><div class="wd-target">${g.target}</div>${nums}${g.phase === 'play' ? `<p class="pt-sub">Use each number once with + − × ÷ — get as close as you can</p>${clock()}${doneRow(g, ctx)}` : answers(g, ctx, a => `${a.t} = ${a.v}`)}${sc(g, ctx)}`;
  },
});
export const speedtypistT = partyTable(W.speedtypist, {
  id: 'speedtypist', defaults: { rounds: 6, secs: 30 }, settingsHTML: rounds([4, 6, 10]),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    return `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p><p class="wd-sentence">${esc(g.text)}</p>${g.phase === 'play' ? `${clock()}${doneRow(g, ctx)}` : `<div class="qz-guesses">${g.order2.map((s, i) => `<span class="ok">#${i + 1} ${nm(ctx, s)} +${g.gain[s]}</span>`).join('') || '<span>Nobody typed it exactly!</span>'}</div>`}${sc(g, ctx)}`;
  },
});
export const wordchainT = partyTable(W.wordchain, {
  id: 'wordchain', defaults: { secs: 12 }, settingsHTML: s => `<label>Time per word ${opt('secs', s, [[8, '8 seconds'], [12, '12 seconds'], [20, '20 seconds']])}</label>`,
  badges: (g, s) => [`<span class="badge">${'❤️'.repeat(g.lives[s]) || '💀'}</span>`],
  center(g, ctx) {
    const chain = `<div class="wd-chain">${g.chain.slice(-8).map(c => `<span><i style="background:var(--seat-${c.s})"></i>${esc(c.w.slice(0, -1))}<b>${esc(c.w.slice(-1))}</b></span>`).join('<em>→</em>')}</div>`;
    if (g.phase === 'over') return `${chain}${sc(g, ctx)}`;
    return `${chain}<div class="wd-letter">${g.letter.toUpperCase()}</div><p class="pt-big">${who(ctx, g.turn)} — a word starting with ${g.letter.toUpperCase()}!</p>${clock()}`;
  },
});
export const ghostlettersT = partyTable(W.ghostletters, {
  id: 'ghostletters', settingsHTML: () => '<span class="yc-note">Don’t finish a word of 4+ letters · five letters and you’re a GHOST</span>',
  badges: (g, s) => [`<span class="badge">${'GHOST'.slice(0, g.ghost[s]) || '—'}</span>`],
  center(g, ctx) {
    if (g.phase === 'over') return `<p class="pt-big">${(g.winners || []).map(s => who(ctx, s)).join(' ')} survives!</p>`;
    const status = `<div class="wd-ghosts">${g.order.map(s => `<span class="${g.ghost[s] >= 5 ? 'out' : ''}"><i style="background:var(--seat-${s})"></i>${nm(ctx, s)}<b>${'GHOST'.split('').map((c, i) => `<u class="${i < g.ghost[s] ? 'on' : ''}">${c}</u>`).join('')}</b></span>`).join('')}</div>`;
    if (g.phase === 'lost') return `${tiles(g.lost.frag || '?', 'big')}<p class="pt-big">${who(ctx, g.lost.s)} takes a letter — ${esc(g.lost.why)}</p>${status}`;
    return `${tiles(g.frag || ' ', 'big')}<p class="pt-big">${who(ctx, g.turn)} adds a letter… or challenges</p>${clock()}${status}`;
  },
});
export const slowrevealT = partyTable(W.slowreveal, {
  id: 'slowreveal', defaults: { rounds: 8 }, settingsHTML: rounds([5, 8, 12], 'Pictures'),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const open = g.phase === 'reveal' ? 16 : g.shown;
    const hidden = new Set(g.order16.slice(open));
    const pic = `<div class="sr-pic"><span>${g.item[0]}</span><div>${Array.from({ length: 16 }, (_, i) => `<i class="${hidden.has(i) ? '' : 'off'}"></i>`).join('')}</div></div>`;
    return `<p class="pt-kicker">Picture ${g.round} of ${g.settings.rounds}</p>${pic}${g.phase === 'reveal' ? `<p class="pt-big">${g.winnerR >= 0 ? `${who(ctx, g.winnerR)} got it: ${esc(g.item[1])}! +${g.gain}` : `It was a ${esc(g.item[1])}`}</p>` : '<p class="pt-sub">Type your guess on your phone — wrong guesses freeze you for 3 seconds</p>'}${sc(g, ctx)}`;
  },
});
function voteTable(E, id, head) {
  return partyTable(E, {
    id, defaults: { rounds: E === W.acrorace ? 5 : 6, secs: 60 }, settingsHTML: rounds([4, 5, 6, 8]),
    center(g, ctx) {
      if (g.phase === 'over') return sc(g, ctx);
      const h = head(g);
      if (g.phase === 'write') return `${h}${clock()}${doneRow(g, ctx)}`;
      const list = `<ol class="wb-opts ${g.phase === 'reveal' ? 'reveal' : ''}">${g.opts.map((o, i) => {
        if (g.phase !== 'reveal') return `<li>${esc(o.text)}</li>`;
        const vs = g.order.filter(s => g.votes[s] === i);
        return `<li class="${o.real ? 'real' : ''}"><span>${esc(o.text)}</span><small>${o.real ? '✓ The real answer' : `by ${o.by.map(s => nm(ctx, s)).join(' & ')}`}${vs.length ? ' · votes: ' : ''}${vs.map(s => who(ctx, s)).join('')}</small></li>`;
      }).join('')}</ol>`;
      return `${h}${list}${g.phase === 'vote' ? clock() + doneRow(g, ctx) : sc(g, ctx)}`;
    },
  });
}
export const acroraceT = voteTable(W.acrorace, 'acrorace', g => `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p><div class="wd-acro">${g.acro.split('').map(c => `<span>${c}</span>`).join('')}</div><p class="pt-sub">${g.phase === 'write' ? 'Write a phrase — one word per letter' : 'Vote for your favourite'}</p>`);
export const fibfinderT = voteTable(W.fibfinder, 'fibfinder', g => `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p><h2 class="pt-h">${esc(g.fib[0])}</h2><p class="pt-sub">${g.phase === 'write' ? 'Write a believable fib for the blank' : 'Which one is true?'}</p>`);
