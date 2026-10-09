// Spin & Solve on the table: the puzzle board of letter tiles (blank green until called), the
// category, the 24-wedge wheel that spins to its result, the letters already called and
// everyone's money.
import * as E from './spinsolve.js?v=68';
import { partyTable, esc, clock, who } from './table-party.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const COLS = ['#e0382c', '#f39a1e', '#f2cf2a', '#36a852', '#2f7de1', '#8b45c8', '#e05aa0', '#1fb5a8'];
const N = E.WHEEL.length;

// Break the answer into board rows of up to 14 squares, without splitting words.
function rows(text) {
  const out = [];
  let line = '';
  for (const w of text.split(' ')) {
    if (line && (line + ' ' + w).length > 14) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
  }
  out.push(line);
  return out;
}
function board(g) {
  const ans = E.answer(g), m = E.masked(g);
  let k = 0;
  return `<div class="ss-board">${rows(ans).map(r => {
    const cells = [...r].map(c => {
      const shown = m[k], i = k++;
      if (c === ' ') return '<i class="sp"></i>';
      if (!/[A-Z]/.test(c)) return `<i class="on">${c}</i>`;
      return `<i class="${shown === '_' ? '' : 'on'} ${g.lastCall?.L === c && g.phase === 'turn' ? 'new' : ''}" data-i="${i}">${shown === '_' ? '' : c}</i>`;
    }).join('');
    k++;  // the space between rows
    return `<div class="ss-row">${cells}</div>`;
  }).join('')}</div>`;
}
function wheel(g) {
  const seg = 360 / N, rot = g.wedgeIdx != null ? 6 * 360 + (360 - (g.wedgeIdx + 0.5) * seg) : 0;
  const parts = E.WHEEL.map((w, i) => {
    const a0 = (i * seg - 90) * Math.PI / 180, a1 = ((i + 1) * seg - 90) * Math.PI / 180, am = ((i + 0.5) * seg - 90);
    const fill = w === 'BANKRUPT' ? '#111' : w === 'LOSE A TURN' ? '#f4f1e8' : w === 2500 ? '#c9a227' : COLS[i % COLS.length];
    const label = w === 'BANKRUPT' ? 'BANKRUPT' : w === 'LOSE A TURN' ? 'LOSE' : String(w);
    return `<path d="M0 0L${(50 * Math.cos(a0)).toFixed(2)} ${(50 * Math.sin(a0)).toFixed(2)}A50 50 0 0 1 ${(50 * Math.cos(a1)).toFixed(2)} ${(50 * Math.sin(a1)).toFixed(2)}Z" style="fill:${fill}"/><text transform="rotate(${am}) translate(31 0) rotate(90)" text-anchor="middle" dominant-baseline="central" font-size="${label.length > 5 ? 3.4 : 5}" style="fill:${w === 'LOSE A TURN' ? '#222' : '#fff'}">${label}</text>`;
  }).join('');
  const spin = g.phase === 'spinning';
  return `<div class="ss-wheel ${spin ? 'go' : ''}"><svg viewBox="-52 -52 104 104" style="--to:${rot}deg;${spin ? '' : `transform:rotate(${rot}deg)`}">${parts}<circle r="7" style="fill:#2a2320"/></svg><i class="tw-pointer"></i></div>`;
}

export default partyTable(E, {
  id: 'spinsolve',
  defaults: { rounds: 3 },
  settingsHTML: s => `<label>Puzzles ${opt('rounds', s, [[2, '2'], [3, '3'], [4, '4'], [5, '5']])}</label>`,
  badges: (g, s) => (g.bank && g.bank[s] ? [`<span class="badge">💰 ${g.bank[s]}</span>`] : []),
  key: g => g.spinId || 0,
  center(g, ctx) {
    const P = E.player(g);
    const used = `<div class="ss-used">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(c => `<i class="${g.called.includes(c) ? 'on' : ''} ${E.VOWELS.includes(c) ? 'v' : ''}">${c}</i>`).join('')}</div>`;
    let msg = '';
    if (g.phase === 'solved') msg = `<p class="pt-big">${who(ctx, g.solver)} solved it! +${g.won}</p>`;
    else if (g.phase === 'spinning') msg = `<p class="pt-sub">${who(ctx, P)} spins…</p>`;
    else if (g.phase === 'letter') msg = `<p class="pt-big">${who(ctx, P)} landed on <b class="ss-val">${g.wedge}</b> — call a consonant</p>${clock()}`;
    else if (g.phase === 'vowel') msg = `<p class="pt-big">${who(ctx, P)} is buying a vowel</p>`;
    else if (g.phase === 'solve') msg = `<p class="pt-big">${who(ctx, P)} is solving…</p>${clock()}`;
    else if (g.phase === 'turn') msg = `<p class="pt-big">${who(ctx, P)}’s turn${g.lastCall && g.lastCall.n ? ` · ${g.lastCall.n} ${g.lastCall.L}${g.lastCall.n > 1 ? '’s' : ''}!` : ''}</p>`;
    const money = `<ol class="pt-rank ss-money">${g.order.map(s => `<li class="${s === P && g.phase !== 'solved' ? 'up' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}<small>${g.bank[s]}</small><b>${g.score[s]}</b></li>`).join('')}</ol>`;
    return `<p class="pt-kicker">Puzzle ${g.round} of ${g.settings.rounds}</p><div class="ss-top">${wheel(g)}<div class="ss-mid">${board(g)}<p class="ss-cat">${esc(E.PUZZLES[g.puz][0])}</p>${used}</div></div>${msg}${money}`;
  },
});
