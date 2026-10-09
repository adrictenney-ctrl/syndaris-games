// The table side of the casino kit: the game's own centrepiece (wheel, dice, race, pegs, cards),
// the clock and who's placed their bets, then the result and everyone's stack.
import { partyTable, esc, clock, doneRow, who } from './table-party.js?v=68';
import { REDS, HORSES, SILKS, WHEEL, PEG_PAY, KENO_TABLE, cardTxt } from './casino-games.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const dice = (d, roll) => `<div class="cs-dice ${roll ? 'roll' : ''}">${d.map(x => `<i>${FACES[x]}</i>`).join('')}</div>`;
const red = c => c.s === 1 || c.s === 2;
const cardEl = (c, extra = '') => `<span class="cs-card ${red(c) ? 'red' : ''} ${extra}">${cardTxt(c)}</span>`;
// Everyone's stacks, biggest first.
const stacks = (g, ctx) => `<ol class="pt-rank">${[...g.order].sort((a, b) => g.bank[b] - g.bank[a]).map(s => `<li><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}<b>🪙 ${g.bank[s]}</b>${g.phase === 'payout' && g.win[s] ? `<small class="${g.win[s] > 0 ? 'up' : 'down'}">${g.win[s] > 0 ? '+' : ''}${g.win[s]}</small>` : ''}</li>`).join('')}</ol>`;
// Who has chips on which spot.
function board(E, g, ctx) {
  const sp = E.G.spots(g, g.order[0]);
  const rows = sp.map(x => ({ x, who: g.order.filter(s => g.bets[s][x.id]) })).filter(r => r.who.length);
  if (!rows.length) return '';
  return `<div class="cs-board">${rows.map(r => `<span class="${g.phase !== 'bet' && E.G.pays(g, String(r.x.id), r.who[0]) > 0 && g.out != null ? 'win' : ''}"><b>${esc(r.x.label)}</b>${r.who.map(s => `<i style="background:var(--seat-${s})" title="${esc(ctx.nameOf(s))}">${g.bets[s][r.x.id]}</i>`).join('')}</span>`).join('')}</div>`;
}

const ROUL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
function wheelSVG(seq, colour, label, target, spinning, r = 50) {
  const n = seq.length, seg = 360 / n;
  const turn = spinning ? 5 * 360 + (360 - (target + 0.5) * seg) : 360 - (target + 0.5) * seg;
  const parts = seq.map((v, i) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180, am = (i + 0.5) * seg - 90;
    return `<path d="M0 0L${(r * Math.cos(a0)).toFixed(2)} ${(r * Math.sin(a0)).toFixed(2)}A${r} ${r} 0 0 1 ${(r * Math.cos(a1)).toFixed(2)} ${(r * Math.sin(a1)).toFixed(2)}Z" style="fill:${colour(v)}"/><text transform="rotate(${am}) translate(${r * 0.8} 0) rotate(90)" text-anchor="middle" dominant-baseline="central" font-size="${n > 40 ? 3.4 : 4.4}" style="fill:#fff">${label(v)}</text>`;
  }).join('');
  return `<div class="cs-wheel ${spinning ? 'go' : ''}"><svg viewBox="-52 -52 104 104" style="--to:${turn}deg;${spinning ? '' : `transform:rotate(${turn}deg)`}">${parts}<circle r="${r * 0.55}" style="fill:#2a1a10"/><circle r="${r * 0.12}" style="fill:#d8b46a"/></svg><i class="tw-pointer"></i></div>`;
}
const MW_COL = { 1: '#e8c35a', 2: '#3d8be8', 5: '#3fb35c', 10: '#a05ad8', 20: '#e8473c', '★': '#111' };

const SHOW = {
  roulette(g, live) {
    const i = g.out == null ? 0 : ROUL_ORDER.indexOf(g.out);
    const col = n => (n === 0 ? '#1f8a4a' : REDS.includes(n) ? '#b8232a' : '#1d1b1a');
    return `${wheelSVG(ROUL_ORDER, col, String, i, live)}${g.out != null && !live ? `<p class="cs-result" style="--c:${col(g.out)}">${g.out}</p>` : ''}`;
  },
  moneywheel(g, live) { return `${wheelSVG(WHEEL, v => MW_COL[v], v => v, g.out ?? 0, live)}${g.out != null && !live ? `<p class="cs-result" style="--c:${MW_COL[WHEEL[g.out]]}">${WHEEL[g.out]}</p>` : ''}`; },
  tripledice: (g, live) => (g.out ? dice(g.out, live) + (live ? '' : `<p class="cs-result">${g.out[0] + g.out[1] + g.out[2]}</p>`) : dice([1, 2, 3], false)),
  oddoreven: (g, live) => (g.out ? (live ? '<div class="cs-cup shake">🥣</div>' : dice(g.out) + `<p class="cs-result">${(g.out[0] + g.out[1]) % 2 ? 'Odd · Han' : 'Even · Chō'}</p>`) : '<div class="cs-cup">🥣</div>'),
  dicepit(g, live) {
    if (!g.out) return dice([3, 4]);
    const n = live ? Math.min(g.out.rolls.length, 1 + Math.floor((Date.now() - g.spinAt) / 900)) : g.out.rolls.length;
    return `<div class="cs-rolls">${g.out.rolls.slice(0, n).map((r, i) => `<span class="${i === n - 1 ? 'last' : ''}">${FACES[r[0]]}${FACES[r[1]]}<small>${r[0] + r[1]}</small></span>`).join('')}</div>${g.out.point ? `<p class="pt-sub">Point: <b>${g.out.point}</b></p>` : ''}`;
  },
  luckynumbers(g, live) {
    const shown = g.out ? (live ? g.out.slice(0, Math.min(10, 1 + Math.floor((Date.now() - g.spinAt) / 550))) : g.out) : [];
    return `<div class="cs-keno">${Array.from({ length: 40 }, (_, i) => i + 1).map(n => `<i class="${shown.includes(n) ? 'hit' : ''}">${n}</i>`).join('')}</div><p class="pt-sub">Pick up to 6 · ${Object.entries(KENO_TABLE[6]).filter(([, m]) => m).map(([k, m]) => `${k} hits ${m}×`).join(' · ')} (6 picks)</p>`;
  },
  derbyday(g, live) {
    const t = live ? Math.min(1, (Date.now() - g.spinAt) / 8000) : g.out ? 1 : 0;
    const place = g.out ? g.out.order : [];
    return `<div class="cs-track">${HORSES.map((h, i) => {
      const rank = place.indexOf(i), fin = g.out ? 1 - rank * 0.06 : 0;
      const wob = g.out ? Math.sin((i + 1) * 7 + t * 9 + g.out.seed) * 0.05 * (1 - t) : 0;
      const x = Math.max(0, Math.min(1, t * fin + wob * t));
      return `<div class="cs-lane"><span class="cs-silk" style="background:${SILKS[i]}">${i + 1}</span><b>${h}</b><em>${g.odds[i]}×</em><i class="cs-horse" style="left:calc(${(x * 100).toFixed(1)}% - ${(x * 6).toFixed(1)}vmin)">🏇</i>${!live && g.out && rank === 0 ? '<strong>🏆</strong>' : ''}</div>`;
    }).join('')}</div>`;
  },
  pegdrop(g, live, ctx) {
    const balls = g.out ? g.order.map(s => {
      const path = g.out[s], t = live ? Math.min(1, (Date.now() - g.spinAt) / 4000) : 1, rows = Math.floor(t * 8);
      const x = path.slice(0, rows).reduce((a, b) => a + b, 0) - rows / 2;
      return `<i class="cs-ball" style="background:var(--seat-${s});left:${50 + x * 9.5}%;top:${(rows / 8) * 86}%"></i>`;
    }).join('') : '';
    return `<div class="cs-pegs">${Array.from({ length: 8 }, (_, r) => `<div>${Array.from({ length: r + 2 }, () => '<b></b>').join('')}</div>`).join('')}${balls}<div class="cs-slots">${PEG_PAY.map(m => `<span>${m}×</span>`).join('')}</div></div>`;
  },
  inbetween: g => `<div class="cs-cards">${cardEl(g.pair[0])}${g.out ? cardEl(g.out, 'mid') : '<span class="cs-card back">?</span>'}${cardEl(g.pair[1])}</div>`,
  casinowar: (g, live, ctx) => (g.out ? `<div class="cs-cards"><span class="cs-label">Dealer</span>${cardEl(g.out.dealer)}</div><div class="cs-wars">${g.order.filter(s => g.bets[s].war).map(s => `<span>${esc(ctx.nameOf(s))} ${cardEl(g.out.you[s], g.out.you[s].r > g.out.dealer.r ? 'win' : '')}</span>`).join('')}</div>` : '<div class="cs-cards"><span class="cs-label">Dealer</span><span class="cs-card back">?</span></div>'),
};

export function casinoTable(E, o) {
  let raf = null;
  const T = partyTable(E, {
    id: o.id,
    defaults: { chips: E.G.chips || 500, rounds: E.G.rounds || 10 },
    settingsHTML: s => `<label>Starting chips ${opt('chips', s, [[200, '200'], [500, '500'], [1000, '1,000']])}</label><label>Rounds ${opt('rounds', s, [[5, '5'], [8, '8'], [10, '10'], [12, '12'], [15, '15']])}</label>`,
    badges: (g, s) => [`<span class="badge">🪙 ${g.bank[s]}</span>`],
    center(g, ctx) {
      const live = g.phase === 'spin';
      const show = SHOW[o.id](g, live, ctx);
      const head = `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}${g.history[0] ? ` · last: ${esc(g.history[0])}` : ''}</p>`;
      if (g.phase === 'bet') return `${head}${show}<p class="pt-big">Place your bets on your phones</p>${clock()}${doneRow(g, ctx, g.order.filter(s => g.bank[s] > 0 || E.staked(g, s)))}${board(E, g, ctx)}`;
      if (g.phase === 'spin') return `${head}${show}<p class="pt-sub">No more bets!</p>${board(E, g, ctx)}`;
      return `${head}${show}${g.phase === 'payout' ? `<p class="pt-big">${esc(E.G.summary ? E.G.summary(g) : '')}</p>${board(E, g, ctx)}` : ''}${stacks(g, ctx)}`;
    },
    after(root, g) {
      // Races, rolls and drops are animated by redrawing a few times a second while they play.
      clearTimeout(raf);
      if (g.phase === 'spin' && ['derbyday', 'pegdrop', 'dicepit', 'luckynumbers'].includes(o.id)) {
        const step = () => { if (g.phase !== 'spin') return; root.innerHTML = T.__center(g); raf = setTimeout(step, 120); };
        raf = setTimeout(step, 120);
      }
    },
  });
  const center = T.renderCenter;
  let lastCtx = null;
  T.renderCenter = (g, ctx) => { lastCtx = ctx; return center(g, ctx); };
  T.__center = g => {
    const live = g.phase === 'spin';
    return `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p>${SHOW[o.id](g, live, lastCtx)}<p class="pt-sub">No more bets!</p>${board(E, g, lastCtx)}`;
  };
  return T;
}
