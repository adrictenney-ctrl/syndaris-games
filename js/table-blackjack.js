// Blackjack on the table: the dealer's hand in the middle, each player's bet and hands in
// front of their seat, and the house rules printed on the felt.
import * as B from './blackjack.js?v=66';
import { cardEl, snap } from './cards.js?v=66';
import { chipStack, money } from './casino.js?v=66';

let root = null, key = '';
const seen = new Set();
const RESULT = { win: 'Win', lose: 'Lose', bust: 'Bust', push: 'Push', blackjack: 'Blackjack!', surrender: 'Surrendered' };

function cardRow(cards, cw, prefix, step = 0.42) {
  const row = document.createElement('div');
  row.className = 'bj-cards';
  row.style.width = `${cw + Math.max(0, cards.length - 1) * cw * step}px`;
  row.style.height = `${cw * 1.4}px`;
  cards.forEach((c, i) => {
    const el = cardEl(c || null, !c);
    el.style.setProperty('--cw', cw + 'px');
    el.style.left = `${i * cw * step}px`;
    const k = prefix + ':' + i + ':' + (c || 'down');
    if (!seen.has(k)) { el.classList.add('deal'); seen.add(k); }
    row.appendChild(el);
  });
  return row;
}

function place(el, pt, rot) {
  el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${rot}deg)`;
}

function render(g, ctx) {
  const cw = ctx.vmin * 6.6 * ctx.cardScale;
  root.innerHTML = '';
  root.style.setProperty('--v', ctx.vmin + 'px');
  const S = g.settings;

  // The felt's printing and the dealer.
  const dealer = document.createElement('div');
  dealer.className = 'bj-dealer';
  const dv = B.dealerView(g);
  dealer.innerHTML = `<p class="bj-print">BLACKJACK PAYS ${S.payout === '6:5' ? '6 TO 5' : '3 TO 2'}</p>
    <p class="bj-print small">${S.h17 ? 'Dealer hits soft 17' : 'Dealer stands on all 17s'} · Insurance pays 2 to 1</p>`;
  if (dv.cards.length) {
    dealer.appendChild(cardRow(dv.cards, cw * 1.1, 'd' + g.round, 0.62));
    dealer.insertAdjacentHTML('beforeend', `<b class="bj-total">${dv.total ? (dv.total.t > 21 ? `Bust ${dv.total.t}` : dv.total.t) : ''}</b>`);
  } else dealer.insertAdjacentHTML('beforeend', '<div class="bj-shoe">Place your bets on your phone</div>');
  root.appendChild(dealer);

  // Each player's spot.
  g.seats.forEach((s, seat) => {
    if (!s) return;
    const spot = document.createElement('div');
    spot.className = 'bj-spot';
    const hands = g.hands[seat] || [];
    if (hands.length) {
      const wrap = document.createElement('div');
      wrap.className = 'bj-hands';
      hands.forEach((h, i) => {
        const hd = document.createElement('div');
        const active = g.active && g.active.seat === seat && g.active.hand === i;
        hd.className = 'bj-hand' + (active ? ' active' : '') + (h.result ? ' r-' + h.result : '');
        hd.appendChild(cardRow(h.cards, cw, `${g.round}:${seat}:${i}`));
        const t = B.total(h.cards);
        hd.insertAdjacentHTML('beforeend', `<span class="bj-label">${h.result ? RESULT[h.result] : t.t > 21 ? 'Bust' : (t.soft && t.t < 21 ? `${t.t - 10}/${t.t}` : t.t)}${h.doubled ? ' · doubled' : ''}</span>
          <span class="bj-bet">${chipStack(h.bet, 5)}<b>${money(h.bet)}</b></span>`);
        wrap.appendChild(hd);
      });
      spot.appendChild(wrap);
      if (g.phase === 'settle' && g.results?.[seat] !== undefined) {
        const n = g.results[seat];
        spot.insertAdjacentHTML('beforeend', `<span class="bj-net ${n > 0 ? 'up' : n < 0 ? 'down' : ''}">${n > 0 ? '+' : ''}${money(n)}</span>`);
      }
    } else if (g.phase === 'bet' && g.bets[seat]) {
      spot.innerHTML = `<span class="bj-bet big">${chipStack(g.bets[seat], 6)}<b>${money(g.bets[seat])}</b></span><span class="bj-label">${g.ready[seat] ? '✓ ready' : 'betting…'}</span>`;
    } else return;
    root.appendChild(spot);
    place(spot, ctx.inset(seat, 24), ctx.rot(seat));
  });

  // Table buttons.
  const bar = document.createElement('div');
  bar.className = 'bj-bar';
  if (g.phase === 'bet') {
    const any = Object.entries(g.bets).some(([s, b]) => g.seats[s] && b >= S.min);
    const left = g.betDeadline ? Math.ceil((g.betDeadline - Date.now()) / 1000) : null;
    bar.innerHTML = `${left !== null ? `<span>Dealing in ${Math.max(0, left)}s</span>` : ''}<button class="tool" data-a="deal" type="button" ${any ? '' : 'disabled'}>Deal now</button>`;
  } else if (g.phase === 'insurance') bar.innerHTML = '<span>Dealer shows an Ace. Insurance? Answer on your phone.</span>';
  else if (g.phase === 'settle') bar.innerHTML = '<button class="tool" data-a="next" type="button">Next round</button>';
  else if (g.active) bar.innerHTML = `<span>${ctx.nameOf(g.active.seat)}'s turn</span>`;
  if (g.shuffled && g.phase !== 'bet') bar.insertAdjacentHTML('afterbegin', '<span>New shoe</span>');
  bar.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => ctx.act(g.order?.[0] ?? g.seats.findIndex(Boolean), { type: b.dataset.a }); });
  root.appendChild(bar);
}

export default {
  defaults: { ...B.DEFAULTS },
  settingsHTML: s => {
    const sel = (k, vals, label) => `<select data-set="${k}">${vals.map(v => `<option value="${v}" ${String(v) === String(s[k]) ? 'selected' : ''}>${label(v)}</option>`).join('')}</select>`;
    return `
      <label>Chips ${sel('startChips', [500, 1000, 2000, 5000], v => v.toLocaleString())}</label>
      <label>Minimum bet ${sel('min', [5, 10, 25, 100], v => v)}</label>
      <label>Decks ${sel('decks', [1, 2, 6, 8], v => v)}</label>
      <label>Blackjack pays ${sel('payout', ['3:2', '6:5'], v => v)}</label>
      <label><input type="checkbox" data-set="h17" ${s.h17 ? 'checked' : ''}> Dealer hits soft 17</label>
      <label><input type="checkbox" data-set="surrender" ${s.surrender ? 'checked' : ''}> Surrender</label>
      <label><input type="checkbox" data-set="rebuy" ${s.rebuy ? 'checked' : ''}> Rebuys</label>`;
  },
  applySetting(set, key2, el) {
    if (key2 !== 'payout') return false;
    set.payout = el.value;
    return true;
  },

  create: (settings, players) => B.createGame(settings, players),
  act: B.applyAction,
  bot: B.botAction,
  view: B.viewFor,
  turn: B.turn,
  timer: B.timer,
  joinMidGame: () => true,

  plate(g, seat) {
    const badges = [];
    const st = g.stacks[seat] ?? 0;
    if (g.phase === 'bet' && g.ready[seat]) badges.push('<span class="badge got">✓ in</span>');
    if (g.phase === 'insurance' && (g.order || []).includes(seat) && !(seat in g.insurance)) badges.push('<span class="badge">insurance?</span>');
    if (g.insurance[seat]) badges.push('<span class="badge">insured</span>');
    if (st < g.settings.min && !(g.order || []).includes(seat)) badges.push('<span class="badge off">out of chips</span>');
    return {
      badges,
      meta: `<span class="chips-count"><i class="chip-dot"></i><b>${money(st)}</b></span>`,
      cards: 0,
      turn: g.phase === 'play' && g.active?.seat === seat,
      out: false,
    };
  },

  reset() { root?.remove(); root = null; key = ''; seen.clear(); },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'blackjack'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.phase, g.round, g.hands, g.dealer, g.bets, g.ready, g.active, g.results, Math.ceil((g.betDeadline - Date.now()) / 1000), ctx.vmin, ctx.cardScale, ctx.upright]);
    if (k === key) return;
    const fresh = JSON.stringify(g.hands).length !== (key ? JSON.stringify(JSON.parse(key)[2]).length : 0);
    key = k;
    render(g, ctx);
    if (fresh) snap(0.25);
    // Keep the betting countdown ticking.
    clearTimeout(root._t);
    if (g.phase === 'bet' && g.betDeadline) root._t = setTimeout(() => { key = ''; render(g, ctx); }, 1000);
  },

  overlay: () => null,
};
