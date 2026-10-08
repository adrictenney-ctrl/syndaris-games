// Yacht Club on the table: a leather dice tray and the shared score card. The player
// whose turn it is rolls and keeps dice from their phone; kept dice sit up on the rail.
import * as Y from './yacht.js?v=62';
import { snap } from './cards.js?v=62';

let root = null, lastRoll = -1, cardKey = '', trayKey = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
export const dieHTML = (v, cls = '') => `<span class="ydie ${cls}" data-v="${v}">${[...Array(9)].map((_, i) => `<i${PIPS[v].includes(i) ? ' class="on"' : ''}></i>`).join('')}</span>`;

function build() {
  root = document.createElement('div');
  root.id = 'yacht';
  root.innerHTML = `
    <div class="yc-left">
      <p class="yc-head"></p>
      <div class="yc-tray"><div class="yc-rail"></div><div class="yc-well"></div></div>
      <p class="yc-sub"></p>
    </div>
    <div class="yc-card"></div>`;
  document.getElementById('center').appendChild(root);
}

function renderTray(g, ctx, rolled) {
  const cur = Y.current(g);
  const rail = root.querySelector('.yc-rail'), well = root.querySelector('.yc-well');
  if (!g.rolls) {
    rail.innerHTML = '';
    well.innerHTML = cur >= 0 ? `<p class="yc-wait">${esc(ctx.nameOf(cur))}, roll from your phone</p>` : '';
    return;
  }
  // Each die keeps a little scatter in the well so the throw looks natural.
  const seed = g.rollId * 7919;
  const jitter = (i, k) => (((seed + i * 97 + k * 31) % 100) / 100 - 0.5);
  rail.innerHTML = g.dice.map((v, i) => (g.held[i] ? dieHTML(v, 'held') : '')).join('');
  well.innerHTML = g.dice.map((v, i) => {
    if (g.held[i]) return '';
    const r = Math.round(jitter(i, 1) * 50), y = jitter(i, 2) * 2.4;
    return dieHTML(v, rolled ? 'tumble' : '').replace('class="ydie', `style="--r:${r}deg;--y:${y}" data-i="${i}" class="ydie`);
  }).join('');
}

function renderCard(g, ctx) {
  const cur = Y.current(g);
  const opts = !g.over && g.rolls ? Y.options(g.cards[cur], g.dice) : {};
  const T = Object.fromEntries(g.order.map(s => [s, Y.totals(g.cards[s])]));
  const head = `<tr><th></th>${g.order.map(s => `<th class="${s === cur ? 'now' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}</th>`).join('')}</tr>`;
  const row = (k, label, hint) => `<tr><td class="lbl">${label}<small>${hint}</small></td>${g.order.map(s => {
    const v = g.cards[s][k];
    const flash = g.last && g.last.seat === s && g.last.cat === k ? ' flash' : '';
    if (v != null) return `<td class="${s === cur ? 'now' : ''}${flash}${v === 0 ? ' zero' : ''}">${v === 0 ? '—' : v}</td>`;
    if (s === cur && k in opts) return `<td class="now maybe">${opts[k]}</td>`;
    return `<td class="${s === cur ? 'now' : ''}"></td>`;
  }).join('')}</tr>`;
  const sumRow = (label, f, cls) => `<tr class="${cls}"><td class="lbl">${label}</td>${g.order.map(s => `<td class="${s === cur ? 'now' : ''}">${f(T[s], g.cards[s])}</td>`).join('')}</tr>`;
  root.querySelector('.yc-card').innerHTML = `
    <table>
      <thead>${head}</thead>
      <tbody>
        ${Y.UPPER.map(k => row(k, Y.LABEL[k], Y.HINT[k])).join('')}
        ${sumRow('Bonus <small>35 at 63</small>', t => (t.bonus ? 35 : `<span class="need">${t.upper}/63</span>`), 'sum')}
        ${Y.LOWER.map(k => row(k, Y.LABEL[k], Y.HINT[k])).join('')}
        ${sumRow('Yacht bonus <small>100 each</small>', t => t.yachtBonus || '', 'sum')}
        ${sumRow('Total', t => t.total, 'total')}
      </tbody>
    </table>`;
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">13 rounds · up to three rolls a turn · bots welcome</span>',

  create: (settings, players) => Y.createGame(settings, players),
  act: Y.applyAction,
  bot: Y.botAction,
  view: Y.viewFor,
  turn: Y.current,
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    const t = Y.totals(g.cards[seat] || {});
    const badges = [];
    if (Y.current(g) === seat) badges.push(`<span class="badge">${g.rolls ? `roll ${g.rolls} of 3` : 'to roll'}</span>`);
    if (g.over) {
      const top = Y.standings(g)[0]?.total;
      if (t.total === top) badges.push('<span class="badge got">🏆 winner</span>');
    }
    return { badges, meta: `<span><b>${t.total}</b> points</span>`, cards: 0, turn: Y.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; lastRoll = -1; cardKey = trayKey = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin;
    const felt = document.getElementById('felt').getBoundingClientRect();
    const many = ctx.layout.length > 4;
    const availW = felt.width - 2 * v * (many ? 26 : 22);
    const availH = felt.height - 2 * v * (ctx.upright ? 19 : 21);
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--row', Math.min(3.2 * v, availH / 18.5) + 'px');
    root.style.setProperty('--trayW', Math.min(46 * v, availW * 0.46) + 'px');

    const cur = Y.current(g);
    root.querySelector('.yc-head').innerHTML = g.over ? 'Final scores' : `Round ${g.round} of 13 · <b>${esc(ctx.nameOf(cur))}</b>`;
    root.querySelector('.yc-sub').innerHTML = g.over ? '' : g.rolls ? (g.rolls < 3 ? `Roll ${g.rolls} of 3 · keep dice on your phone` : 'Last roll · choose a box') : 'Three rolls to make your best hand';

    const rolled = g.rollId !== lastRoll && lastRoll !== -1 && g.rolls > 0;
    const tk = JSON.stringify([g.rollId, g.held, g.rolls, cur, ctx.vmin]);
    if (tk !== trayKey) {
      trayKey = tk;
      renderTray(g, ctx, rolled);
      if (rolled) { snap(0.5); setTimeout(() => snap(0.3), 160); }
    }
    lastRoll = g.rollId;
    const ck = JSON.stringify([g.cards, cur, g.rolls ? g.dice : null, g.last?.id, g.order.map(s => ctx.nameOf(s))]);
    if (ck !== cardKey) { cardKey = ck; renderCard(g, ctx); }
  },

  overlay(g, ctx) {
    if (!g.over) return null;
    const st = Y.standings(g);
    const top = st[0].total;
    const names = st.filter(x => x.total === top).map(x => ctx.nameOf(x.seat));
    return {
      key: 'over' + g.last?.id,
      html: `<h2>${names.length > 1 ? `${names.join(' & ')} tie` : `${names[0]} wins`}</h2>
        <p>${top} points</p>
        <ol class="scores">${st.map(x => `<li>${ctx.nameOf(x.seat)} <b>${x.total}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
