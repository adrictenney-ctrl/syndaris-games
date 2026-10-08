// Low Tide on the table: every player's 3×4 grid of tide cards sits in front of them; the deck
// and the discard pile are in the middle. The card someone has just drawn floats beside their
// grid so everyone can see what they're weighing up.
import * as T from './lowtide.js?v=61';
import { snap } from './cards.js?v=61';

let root = null, grids = {}, lastMove = -1, lastRound = -1;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const band = v => (v < 0 ? 'deep' : v === 0 ? 'aqua' : v <= 4 ? 'foam' : v <= 8 ? 'sand' : 'coral');
// A tide card: value face, or the wave-patterned back. cell: { v, up } | null
export function tideCard(cell, extra = '') {
  if (!cell) return `<div class="lt-card gone ${extra}"></div>`;
  if (!cell.up) return `<div class="lt-card back ${extra}"><i></i></div>`;
  const v = cell.v;
  return `<div class="lt-card b-${band(v)} ${extra}"><span class="c tl">${v}</span><b>${v}</b><span class="c br">${v}</span></div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'lowtide';
  root.innerHTML = `<div class="lt-mid"><div class="lt-deck"><div class="lt-card back"><i></i></div><small></small></div><div class="lt-disc"></div></div><p class="lt-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

function renderGrid(g, ctx, s, cw) {
  let el = grids[s];
  if (!el) { el = grids[s] = document.createElement('div'); el.className = 'lt-grid'; root.appendChild(el); }
  const grid = g.grids[s];
  // Columns left to right, rows top to bottom.
  let html = '';
  for (let r = 0; r < T.ROWS; r++) for (let c = 0; c < T.COLS; c++) html += tideCard(grid[c * T.ROWS + r]);
  const hold = g.turn === s && g.holding ? `<div class="lt-hold">${tideCard({ v: g.holding.v, up: true })}<small>${g.holding.from === 'deck' ? 'drawn' : 'taken'}</small></div>` : '';
  const key = html + hold + cw;
  if (el.dataset.k !== key) { el.dataset.k = key; el.innerHTML = `<div class="cells">${html}</div>${hold}`; }
  el.style.setProperty('--lw', cw + 'px');
  el.classList.toggle('now', g.phase === 'play' && g.turn === s);
  const gh = cw * 1.4 * 3 + cw * 0.3;
  const pt = ctx.inset(s, 12 + gh / ctx.vmin / 2);
  el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
}

export default {
  defaults: { target: 100 },
  settingsHTML: s => `<label>Game ends at <select data-set="target">${[50, 100, 150].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label>
    <span class="yc-note">Lowest score wins · three of a kind in a column washes away</span>`,

  create: (settings, players) => T.createGame(settings, players),
  act: T.applyAction,
  bot: T.botAction,
  view: T.viewFor,
  // During setup every player flips at once; bots go one after another.
  turn: g => (g.phase === 'setup' ? (g.order.find(s => g.flips[s] < 2) ?? -1) : g.phase === 'play' ? g.turn : -1),
  timer(g, players) {
    if (g.phase === 'roundOver') return { ms: Math.max(0, g.nextAt - Date.now()) + 20, run: () => T.advance(g) };
    if (g.phase === 'setup') {
      // Humans flip on their phones; let the bots flip right away.
      const b = g.order.find(s => players[s]?.bot && g.flips[s] < 2);
      if (b != null) return { ms: 400, run: () => T.applyAction(g, b, T.botAction(g, b)) };
      return { ms: 3600000, run: () => {} };
    }
    return null;
  },
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'setup' && g.flips[seat] < 2) badges.push('<span class="badge">turning up</span>');
    if (g.closer === seat && g.phase === 'play') badges.push('<span class="badge alone">went out</span>');
    else if (g.lastTurns?.includes(seat)) badges.push('<span class="badge">last turn</span>');
    if (g.result && g.phase !== 'play') badges.push(`<span class="badge ${g.result.doubled && g.result.closer === seat ? 'lost' : 'got'}">+${g.result.pts[seat]}${g.result.doubled && g.result.closer === seat ? ' ×2' : ''}</span>`);
    return { badges, meta: `<span><b>${g.totals[seat]}</b> total</span><span>showing <b>${T.visibleSum(g.grids[seat])}</b></span>`, cards: 0, turn: g.phase === 'play' && g.turn === seat, out: false };
  },

  reset() { root?.remove(); root = null; grids = {}; lastMove = -1; lastRound = -1; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    if (g.round !== lastRound) { Object.values(grids).forEach(e => e.remove()); grids = {}; lastRound = g.round; }
    const v = ctx.vmin;
    const many = g.order.length > 4 || ctx.layout.length > 4;
    const cw = v * (many ? 3.5 : 4.6) * ctx.cardScale;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--lw', cw * 1.9 + 'px');
    for (const s of g.order) renderGrid(g, ctx, s, cw);
    root.querySelector('.lt-deck small').textContent = g.deck.length;
    const top = g.discard[g.discard.length - 1];
    root.querySelector('.lt-disc').innerHTML = top != null ? tideCard({ v: top, up: true }) : '';
    if (g.moveId !== lastMove) { if (lastMove !== -1) snap(0.4); lastMove = g.moveId; }
    const msg = root.querySelector('.lt-msg');
    if (g.phase === 'setup') msg.innerHTML = 'Everyone turns up <b>two</b> cards';
    else if (g.phase === 'play') msg.innerHTML = `<b>${esc(ctx.nameOf(g.turn))}</b>${g.lastTurns ? ' · last turn' : ''} · ${g.holding ? (g.holding.from === 'deck' ? 'keep it or throw it away?' : 'where will it go?') : g.mustFlip ? 'turns up a card' : 'draws or takes the discard'}`;
    else if (g.result) msg.innerHTML = `Round ${g.round} scored${g.result.doubled ? ` · <b>${esc(ctx.nameOf(g.result.closer))}</b> went out without the lowest score — doubled` : ''}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.totals[a] - g.totals[b]);
    const names = g.winners.map(s => ctx.nameOf(s));
    return {
      key: 'over' + g.round,
      html: `<h2>${names.length > 1 ? `${names.join(' & ')} tie` : `${names[0]} wins`}</h2><p>Lowest score after ${g.round} rounds</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.totals[s]}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
