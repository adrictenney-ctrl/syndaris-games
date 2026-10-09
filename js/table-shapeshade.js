// Shape & Shade on the table: the tiles laid out on a dark slate, growing in every direction;
// the last move outlined.
import * as Q from './shapeshade.js?v=68';
import { snap } from './cards.js?v=68';
import { centerMsg, clearMsg } from './table-hearts.js?v=68';

let root = null, key = '';
export const qTile = (id, cls = '') => { const t = Q.tile(id); return `<span class="qs-tile ${cls}" style="--c:${Q.COLORS[t.c]}">${Q.SHAPES[t.s]}</span>`; };

// The board as an absolutely positioned grid; staged = [{x,y,t}], spots = tappable squares.
export function boardHTML(board, { staged = [], spots = [], last = [], pad = 1 } = {}) {
  const keys = [...Object.keys(board), ...staged.map(p => Q.K(p.x, p.y)), ...spots.map(([x, y]) => Q.K(x, y))];
  const xy = keys.map(k => k.split(',').map(Number));
  const minX = Math.min(0, ...xy.map(p => p[0])) - pad, maxX = Math.max(0, ...xy.map(p => p[0])) + pad;
  const minY = Math.min(0, ...xy.map(p => p[1])) - pad, maxY = Math.max(0, ...xy.map(p => p[1])) + pad;
  const W = maxX - minX + 1, H = maxY - minY + 1;
  let h = '';
  for (const [k, t] of Object.entries(board)) { const [x, y] = k.split(',').map(Number); h += `<div class="qs-at" style="grid-area:${y - minY + 1}/${x - minX + 1}">${qTile(t, last.includes(k) ? 'last' : '')}</div>`; }
  for (const p of staged) h += `<div class="qs-at" style="grid-area:${p.y - minY + 1}/${p.x - minX + 1}">${qTile(p.t, 'staged')}</div>`;
  for (const [x, y] of spots) if (!staged.some(p => p.x === x && p.y === y)) h += `<button class="qs-spot" data-x="${x}" data-y="${y}" style="grid-area:${y - minY + 1}/${x - minX + 1}"></button>`;
  return `<div class="qs-board" style="--W:${W}; --H:${H}; grid-template-columns: repeat(${W}, 1fr); grid-template-rows: repeat(${H}, 1fr)">${h}</div>`;
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Lines of one colour or one shape · six in a row scores double</span>',
  create: (settings, players) => Q.createGame(settings, players),
  act: Q.applyAction,
  bot: Q.botAction,
  view: Q.viewFor,
  turn: g => Q.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = g.phase === 'over' && g.winners.includes(s) ? ['<span class="badge got">🏆 winner</span>'] : [];
    return { badges, meta: `<span><b>${g.scores[s]}</b> pts</span>`, cards: 0, turn: Q.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'shapeshade'; document.getElementById('center').appendChild(root); }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--maxW', felt.width - v * 60 + 'px');
    root.style.setProperty('--maxH', felt.height - v * 26 + 'px');
    if (g.moveId === key) return;
    if (key !== '') snap(0.4);
    key = g.moveId;
    root.innerHTML = boardHTML(g.board, { last: g.last }) + `<p class="qs-bag">${g.bag.length} tiles in the bag</p>`;
    centerMsg(g.phase === 'play' ? `<b>${ctx.nameOf(g.turn)}</b>'s turn` : '');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return { key: 'over', html: `<h2>${g.winners.map(ctx.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}!</h2><p>${g.out != null ? `${ctx.nameOf(g.out)} used every tile (+6)` : 'Nobody could move'}</p><ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b></li>`).join('')}</ol><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
