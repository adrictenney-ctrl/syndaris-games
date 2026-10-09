// Table screens for the live casino games (casino-live.js).
import { partyTable, esc, clock, doneRow, who } from './table-party.js?v=68';
import { liftoff, ridethebus, threecard, islandstud, multAt, BUS_STAGES, pretty, isRed } from './casino-live.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const settings = s => `<label>Starting chips ${opt('chips', s, [[200, '200'], [500, '500'], [1000, '1,000']])}</label><label>Rounds ${opt('rounds', s, [[5, '5'], [8, '8'], [10, '10'], [15, '15']])}</label>`;
const stacks = (g, ctx, extra = () => '') => `<ol class="pt-rank">${[...g.order].sort((a, b) => g.bank[b] - g.bank[a]).map(s => `<li><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}<b>🪙 ${g.bank[s]}</b>${extra(s)}</li>`).join('')}</ol>`;
const cardEl = (c, cls = '') => `<span class="cs-card ${isRed(c) ? 'red' : ''} ${cls}">${pretty(c)}</span>`;
const back = () => '<span class="cs-card back">?</span>';
const stakeScreen = (g, ctx, title) => `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p><p class="pt-big">${title}</p>${clock()}${doneRow(g, ctx, g.order.filter(s => g.bank[s] > 0 || g.stake[s]))}${stacks(g, ctx, s => (g.stake[s] ? `<small>in ${g.stake[s]}</small>` : ''))}`;

export const liftoffTable = (() => {
  let timer = null;
  const T = partyTable(liftoff, {
    id: 'liftoff', defaults: { chips: 500, rounds: 10 }, settingsHTML: settings,
    center(g, ctx) {
      const hist = `<div class="lo-hist">${(g.history || []).map(x => `<span class="${x >= 2 ? 'hi' : ''}">${x.toFixed(2)}×</span>`).join('')}</div>`;
      if (g.phase === 'stake') return `${hist}${stakeScreen(g, ctx, 'Board the rocket — stake on your phone')}`;
      const riders = g.order.filter(s => g.stake[s] > 0);
      const list = `<ul class="lo-riders">${riders.map(s => `<li class="${g.cash[s] != null ? 'out' : g.phase === 'crashed' ? 'bust' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))} · ${g.stake[s]}${g.cash[s] != null ? ` · <b>${g.cash[s].toFixed(2)}×</b>` : g.phase === 'crashed' ? ' · 💥' : ''}</li>`).join('')}</ul>`;
      if (g.phase === 'fly') return `${hist}<div class="lo-sky"><span class="lo-rocket">🚀</span><b class="lo-mult">1.00×</b></div><p class="pt-sub">Cash out on your phone before it blows!</p>${list}`;
      if (g.phase === 'crashed') return `${hist}<div class="lo-sky boom"><span class="lo-rocket">💥</span><b class="lo-mult">${g.crash.toFixed(2)}×</b></div>${list}${stacks(g, ctx)}`;
      return stacks(g, ctx);
    },
    after(root, g) {
      clearInterval(timer);
      if (g.phase !== 'fly') return;
      timer = setInterval(() => {
        const m = Math.min(g.crash, multAt(g)), el = root.querySelector('.lo-mult'), r = root.querySelector('.lo-rocket');
        if (!el) return clearInterval(timer);
        el.textContent = (Date.now() < g.flyAt ? 1 : m).toFixed(2) + '×';
        el.classList.toggle('hot', m >= 2);
        if (r) r.style.transform = `translate(${Math.min(30, Math.log(m) * 22)}vmin, ${-Math.min(18, Math.log(m) * 14)}vmin) rotate(${-Math.min(30, m * 6)}deg)`;
      }, 80);
    },
  });
  return T;
})();

export const ridethebusTable = partyTable(ridethebus, {
  id: 'ridethebus', defaults: { chips: 500, rounds: 6 }, settingsHTML: settings,
  center(g, ctx) {
    if (g.phase === 'stake') return stakeScreen(g, ctx, 'Get on the bus — stake on your phone');
    if (g.phase === 'over') return stacks(g, ctx);
    const st = BUS_STAGES[Math.min(g.stage, 3)];
    const cards = `<div class="cs-cards">${[0, 1, 2, 3].map(i => (g.cards[i] ? cardEl(g.cards[i], i === g.cards.length - 1 && g.phase === 'flip' ? 'mid' : '') : back())).join('')}</div>`;
    const riders = `<ul class="lo-riders">${g.order.filter(s => g.stake[s] > 0).map(s => `<li class="${g.state[s] === 'bust' ? 'bust' : g.state[s] === 'cashed' ? 'out' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))} · ${g.state[s] === 'bust' ? '🚏 bust' : g.state[s] === 'cashed' ? '💰 off' : '🚌 riding'}</li>`).join('')}</ul>`;
    const head = g.phase === 'guess' ? `<p class="pt-big">${st.q} <small>(×${st.mult})</small></p>${clock()}` : g.phase === 'flip' ? `<p class="pt-big">${pretty(g.cards[g.cards.length - 1])}!</p>` : '<p class="pt-big">End of the line</p>';
    return `<p class="pt-kicker">Round ${g.round} · stop ${Math.min(g.stage + 1, 4)} of 4</p>${cards}${head}${riders}`;
  },
});

function studTable(E, id, title) {
  return partyTable(E, {
    id, defaults: { chips: 500, rounds: 8 }, settingsHTML: settings,
    center(g, ctx) {
      if (g.phase === 'stake') return stakeScreen(g, ctx, `${title} — ante up on your phone`);
      if (g.phase === 'over') return stacks(g, ctx);
      const res = g.phase === 'result';
      const dealer = `<div class="cs-cards"><span class="cs-label">Dealer</span>${g.dealer.map((c, i) => (res || i === 0 ? cardEl(c) : back())).join('')}</div>${res ? `<p class="pt-sub">${esc(g.dealerName || '')}${g.qual === false ? ' — doesn’t qualify' : ''}</p>` : ''}`;
      const seats = `<ul class="lo-riders">${g.order.filter(s => g.stake[s] > 0).map(s => `<li class="${res && g.res[s]?.win < 0 ? 'bust' : res && g.res[s]?.win > 0 ? 'out' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))} · ${res ? `${g.hand[s].map(pretty).join(' ')} · ${g.res[s].win > 0 ? '+' : ''}${g.res[s].win}` : g.done[s] ? (g.choice[s] === 'play' ? 'plays' : 'folds') : 'thinking…'}</li>`).join('')}</ul>`;
      return `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p>${dealer}${g.phase === 'decide' ? `<p class="pt-big">Look at your hand — play or fold?</p>${clock()}` : ''}${seats}${res ? stacks(g, ctx) : ''}`;
    },
  });
}
export const threecardTable = studTable(threecard, 'threecard', 'Three Card Showdown');
export const islandstudTable = studTable(islandstud, 'islandstud', 'Island Stud');
