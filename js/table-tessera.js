// Tessera on the table: the growing mosaic in the middle — slate tiles with gems in each
// player's colour and half-shapes on their edges that join into whole circles, squares and
// triangles. The tile just played glows.
import * as T from './tessera.js?v=67';
import { snap } from './cards.js?v=67';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const U = 10;  // svg units per cell
const ANG = { N: 0, E: 90, S: 180, W: 270 };

// A half-shape on one side of a cell, pointing into the cell.
function half(sym, cx, cy, side) {
  const t = `rotate(${ANG[side]} ${cx} ${cy})`, ex = cx, ey = cy - U / 2;
  if (sym === 'c') return `<path d="M${ex - 2.1} ${ey} A2.1 2.1 0 0 0 ${ex + 2.1} ${ey} Z" transform="${t}" class="ts-sym c"/>`;
  if (sym === 's') return `<rect x="${ex - 1.8}" y="${ey}" width="3.6" height="1.8" transform="${t}" class="ts-sym s"/>`;
  return `<path d="M${ex - 2.2} ${ey} L${ex} ${ey + 2.2} L${ex + 2.2} ${ey} Z" transform="${t}" class="ts-sym t"/>`;
}

// One tile, drawn whole (later tiles are drawn over it).
export function tileSVGBody(tile, rot, ax, ay, cls = '') {
  const cells = T.cellsOf(tile, rot, ax, ay);
  const x0 = Math.min(...cells.map(c => c.x)) * U, y0 = Math.min(...cells.map(c => c.y)) * U;
  const col = tile.owner >= 0 ? `var(--seat-${tile.owner})` : '#c9b27a';
  let h = `<g class="ts-tile ${cls}" style="--tc:${col}"><rect x="${x0 + .3}" y="${y0 + .3}" width="${2 * U - .6}" height="${2 * U - .6}" rx="1.6" class="ts-body"/>`;
  h += `<path d="M${x0 + U} ${y0 + 1.2} V${y0 + 2 * U - 1.2} M${x0 + 1.2} ${y0 + U} H${x0 + 2 * U - 1.2}" class="ts-grid"/>`;
  for (const c of cells) {
    const cx = c.x * U + U / 2, cy = c.y * U + U / 2;
    if (c.gem) h += `<g class="ts-gem"><path d="M${cx} ${cy - 3.2} L${cx + 3} ${cy - .6} L${cx} ${cy + 3.4} L${cx - 3} ${cy - .6} Z"/><path d="M${cx - 3} ${cy - .6} H${cx + 3} M${cx - 1.4} ${cy - .6} L${cx} ${cy - 3.2} L${cx + 1.4} ${cy - .6} L${cx} ${cy + 3.4} Z" class="facet"/></g>`;
    for (const [side, sym] of Object.entries(c.sides)) if (sym) h += half(sym, cx, cy, side);
  }
  return h + '</g>';
}

// The whole mosaic. opts: { ghost: {tile, rot, x, y}, dots: [{x, y, key}], glowLast }
export function boardSVG(g, opts = {}) {
  const all = [];
  for (const p of g.placed) for (const c of T.cellsOf(g.tiles[p.t], p.rot, p.x, p.y)) all.push(c);
  if (opts.ghost) for (const c of T.cellsOf(g.tiles[opts.ghost.tile], opts.ghost.rot, opts.ghost.x, opts.ghost.y)) all.push(c);
  for (const d of opts.dots || []) all.push({ x: d.x - 1, y: d.y - 1 }, { x: d.x, y: d.y });
  const pad = opts.pad ?? 1.4;
  const minX = Math.min(...all.map(c => c.x)) - pad, maxX = Math.max(...all.map(c => c.x)) + 1 + pad;
  const minY = Math.min(...all.map(c => c.y)) - pad, maxY = Math.max(...all.map(c => c.y)) + 1 + pad;
  let h = '';
  g.placed.forEach((p, n) => { h += tileSVGBody(g.tiles[p.t], p.rot, p.x, p.y, opts.glowLast && n === g.placed.length - 1 && g.placed.length > 1 ? 'last' : ''); });
  if (opts.ghost) h += tileSVGBody(g.tiles[opts.ghost.tile], opts.ghost.rot, opts.ghost.x, opts.ghost.y, 'ghost');
  for (const d of opts.dots || []) h += `<circle cx="${d.x * U}" cy="${d.y * U}" r="2.6" class="ts-dot${d.on ? ' on' : ''}" data-spot="${d.key}"/>`;
  return `<svg viewBox="${minX * U} ${minY * U} ${(maxX - minX) * U} ${(maxY - minY) * U}" class="ts-svg">${h}</svg>`;
}

// A single tile on its own (for the phone's choices and the home page).
export function tilePreview(tile, rot = 0) {
  return `<svg viewBox="-1 -1 22 22" class="ts-svg ts-one">${tileSVGBody(tile, rot, 0, 0)}</svg>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'tessera';
  root.innerHTML = `<div class="ts-board"></div><p class="ts-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { tiles: 12 },
  settingsHTML: s => `<label>Tiles each <select data-set="tiles">${[8, 12, 16].map(n => `<option value="${n}" ${n === s.tiles ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`,
  create: (settings, players) => T.createGame(settings, players),
  act: T.applyAction,
  bot: T.botAction,
  view: T.viewFor,
  turn: g => T.current(g),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    const v = T.visibleGems(g);
    return { badges, meta: `<span><b>${v[seat]}</b> gems showing</span><span>${g.decks[seat].length} tiles left</span>`, cards: 0, turn: T.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    root.style.setProperty('--bw', Math.min(felt.width - v * 56, felt.height - v * 32) + 'px');
    root.style.setProperty('--v', v + 'px');
    const k = JSON.stringify([g.moveId, Math.round(felt.width), Math.round(felt.height)]);
    if (k === key) return;
    if (key && g.last) snap(0.4);
    key = k;
    root.querySelector('.ts-board').innerHTML = boardSVG(g, { glowLast: true });
    root.querySelector('.ts-msg').innerHTML = g.phase === 'over' ? '' : `<b>${esc(ctx.nameOf(g.turn))}</b> · join a shape — cover a gem if you can`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const v = T.visibleGems(g);
    const order = g.order.slice().sort((a, b) => v[b] - v[a]);
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} win${g.winners.length > 1 ? '' : 's'}</h2><p>Most gems still showing</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${v[s]}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
