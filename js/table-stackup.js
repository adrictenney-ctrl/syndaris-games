// Stack Up on the table: the four build piles in the middle, and in front of each player their
// stock (top card up, with how many are left) and their four discard piles.
import * as S from './stackup.js?v=64';
import { snap } from './cards.js?v=64';
import { centerMsg, clearMsg } from './table-hearts.js?v=64';

let root = null, key = '';
// A Stack Up card: numbers in three colour bands, stars wild.
export const suCard = (v, cls = '', extra = '') => v == null ? `<div class="su-card empty ${cls}">${extra}</div>`
  : v === S.WILD ? `<div class="su-card wild ${cls}"><b>★</b><small>wild</small>${extra}</div>`
  : `<div class="su-card b${v <= 4 ? 1 : v <= 8 ? 2 : 3} ${cls}"><i>${v}</i><b>${v}</b><i class="br">${v}</i>${extra}</div>`;
export const buildCard = p => (p.top ? suCard(p.top.v, p.top.v === S.WILD ? 'as' : '', p.top.v === S.WILD ? `<em>${p.top.as}</em>` : '') : suCard(null, '', '<span>1</span>'));

export default {
  defaults: { stock: 0 },
  settingsHTML: s => `<label>Stock pile <select data-set="stock">${[[0, 'Standard (30, or 20 for 5–6)'], [10, 'Quick (10)'], [20, '20 cards']].map(([v, t]) => `<option value="${v}" ${v === s.stock ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  create: (settings, players) => S.createGame(settings, players),
  act: S.applyAction,
  bot: S.botAction,
  view: S.viewFor,
  turn: g => S.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = g.phase === 'over' && g.winner === s ? ['<span class="badge got">🏆 winner</span>'] : [];
    return { badges, meta: `<span><b>${g.stocks[s].length}</b> in stock</span><span><b>${g.hands[s].length}</b> in hand</span>`, cards: 0, turn: S.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'stackup'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.moveId, g.builds.map(p => p.length), g.phase, ctx.upright, Math.round(ctx.vmin)]);
    if (k === key) return;
    if (key) snap(0.35);
    key = k;
    const sides = g.order.map(s => ctx.layout[s].side);
    const many = sides.some((x, i) => sides.indexOf(x) !== i);
    root.style.setProperty('--sw', ctx.vmin * (many ? 4.2 : 6.2) * ctx.cardScale + 'px');
    let h = `<div class="su-builds">${g.builds.map(p => `<div class="su-b">${buildCard({ top: p[p.length - 1] })}<small>${p.length ? `next ${S.need(p)}` : 'starts at 1'}</small></div>`).join('')}<div class="su-b deck"><div class="su-card back"><b>★</b></div><small>${g.deck.length} left</small></div></div>`;
    for (const s of g.order) {
      const pt = ctx.inset(s, many ? 16 : 19);
      const st = g.stocks[s];
      h += `<div class="su-area ${S.current(g) === s ? 'turn' : ''}" style="transform: translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ctx.rot(s)}deg)">
        <div class="su-stock">${suCard(st[st.length - 1] ?? null)}<small>${st.length}</small></div>
        ${g.discards[s].map(d => `<div class="su-disc">${d.slice(-3).map(v => suCard(v)).join('') || suCard(null)}</div>`).join('')}</div>`;
    }
    root.innerHTML = h;
    centerMsg(g.phase === 'over' ? '' : `<b>${ctx.nameOf(g.turn)}</b>'s turn`);
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over',
      html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>${g.stalled ? 'Nobody could play — fewest stock cards wins' : 'Their stock pile is empty'}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
