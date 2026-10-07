// Homestead on the table: the island — nineteen tiles in our own frontier palette, number
// tokens, harbours on the coast, roads, cabins and manors in each player's colour, and the
// Bandit. Beside it: the dice, the scores and what's happening.
import * as H from './homestead.js?v=55';
import { snap } from './cards.js?v=55';
import { dieHTML } from './table-yacht.js?v=55';

let root = null, key = '', lastRoll = -1;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const TILE = { timber: '#3f6b46', clay: '#a65a3c', fleece: '#8db06e', wheat: '#cfa84c', stone: '#7e8792', badlands: '#b49f78' };
const hexPts = (x, y, s) => [...Array(6)].map((_, k) => { const a = (Math.PI / 180) * (60 * k - 30); return `${(x + s * Math.cos(a)).toFixed(2)},${(y + s * Math.sin(a)).toFixed(2)}`; }).join(' ');
const PIPS = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };

// The island. opts: { verts:Set, edges:Set, hexes:Set } to highlight legal taps.
export function boardSVG(g, opts = {}) {
  const S = H.SIZE;
  let h = `<polygon points="${hexPts(0, 0, S * 5.6)}" class="hs-sea" transform="rotate(30)"/>`;
  g.tiles.forEach((t, i) => {
    const hx = H.HEXES[i];
    h += `<g class="hs-hex${opts.hexes?.has(i) ? ' pick' : ''}" data-hex="${i}"><polygon points="${hexPts(hx.x, hx.y, S - 0.3)}" style="fill:${TILE[t.kind]}"/>
      <text x="${hx.x}" y="${hx.y - 4.4}" class="hs-ic">${t.kind === 'badlands' ? '☀' : H.RES_ICON[t.kind]}</text>
      ${t.num ? `<circle cx="${hx.x}" cy="${hx.y + 1.6}" r="3.4" class="hs-tok"/><text x="${hx.x}" y="${hx.y + 2.2}" class="hs-num${t.num === 6 || t.num === 8 ? ' red' : ''}">${t.num}</text><text x="${hx.x}" y="${hx.y + 4.3}" class="hs-pips">${'·'.repeat(PIPS[t.num])}</text>` : ''}
      ${g.bandit === i ? `<g class="hs-bandit"><circle cx="${hx.x + 4.4}" cy="${hx.y - 1}" r="2.6"/><path d="M${hx.x + 2.8} ${hx.y + 3.4} q1.6 -4.6 3.2 0 z"/></g>` : ''}</g>`;
  });
  // Harbours on the coast.
  for (const p of g.ports) {
    const e = H.EDGES[p.edge], a = H.VERTS[e.a], b = H.VERTS[e.b];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, L = Math.hypot(mx, my), ox = (mx / L) * 4.2, oy = (my / L) * 4.2;
    h += `<g class="hs-port"><line x1="${a.x}" y1="${a.y}" x2="${mx + ox}" y2="${my + oy}"/><line x1="${b.x}" y1="${b.y}" x2="${mx + ox}" y2="${my + oy}"/>
      <circle cx="${mx + ox}" cy="${my + oy}" r="2.8"/><text x="${mx + ox}" y="${my + oy + 0.9}">${p.type === 'any' ? '3:1' : '2:1'}</text>${p.type !== 'any' ? `<text x="${mx + ox * 1.75}" y="${my + oy * 1.75 + 1}" class="hs-pr">${H.RES_ICON[p.type]}</text>` : ''}</g>`;
  }
  // Roads.
  H.EDGES.forEach((e, i) => {
    const a = H.VERTS[e.a], b = H.VERTS[e.b], o = g.eOwner[i];
    if (o != null) h += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="hs-road" style="stroke:var(--seat-${o})"/>`;
    else if (opts.edges?.has(i)) h += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="hs-road pick" data-e="${i}"/>`;
  });
  // Buildings.
  H.VERTS.forEach((v, i) => {
    const o = g.vOwner[i];
    if (o != null) {
      h += g.vLevel[i] === 2
        ? `<path d="M${v.x - 2.6} ${v.y + 2} v-3 l1.3 -1.4 l1.3 1.4 v-1.6 h2.6 v4.6 z" class="hs-manor" style="fill:var(--seat-${o})"/>`
        : `<path d="M${v.x - 1.8} ${v.y + 1.6} v-2.2 l1.8 -1.6 l1.8 1.6 v2.2 z" class="hs-cabin" style="fill:var(--seat-${o})"/>`;
      if (opts.verts?.has(i)) h += `<circle cx="${v.x}" cy="${v.y}" r="2.8" class="hs-spot up" data-v="${i}"/>`;
    } else if (opts.verts?.has(i)) h += `<circle cx="${v.x}" cy="${v.y}" r="1.8" class="hs-spot" data-v="${i}"/>`;
  });
  return `<svg viewBox="-56 -50 112 100" class="hs-map">${h}</svg>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'homestead';
  root.innerHTML = `<div class="hs-board"></div><div class="hs-side"><div class="hs-dice"></div><ol class="hs-scores"></ol><ul class="hs-log"></ul><p class="hs-now"></p></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { target: 10 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[8, 10, 12].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label>`,
  create: (settings, players) => H.createGame(settings, players),
  act: H.applyAction,
  bot: H.botAction,
  view: H.viewFor,
  turn: g => (g.phase === 'over' ? -1 : g.trade ? g.trade.to : g.turn),
  // After a 7, everyone with too many cards discards at once — bots straight away.
  timer(g, players) {
    if (!g.discards) return null;
    const b = Object.keys(g.discards).map(Number).find(s => players[s]?.bot);
    return b != null ? { ms: 600, run: () => H.applyAction(g, b, H.botAction(g, b)) } : null;
  },
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.longest === seat) badges.push('<span class="badge got">longest road</span>');
    if (g.largest === seat) badges.push('<span class="badge got">largest patrol</span>');
    if (g.discards?.[seat]) badges.push(`<span class="badge lost">discards ${g.discards[seat]}</span>`);
    return { badges, meta: `<span><b>${H.points(g, seat, g.phase === 'over')}</b> pts</span><span><b>${H.total(g.hand[seat])}</b> cards · ${g.charters[seat].length} charters</span>`, cards: 0, turn: g.phase !== 'over' && g.turn === seat, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; lastRoll = -1; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const Hh = Math.min(felt.height - v * 12, (felt.width - v * 84) / 1.12);
    root.style.setProperty('--H', Hh + 'px');
    const k = JSON.stringify([g.vOwner, g.vLevel, g.eOwner, g.bandit, g.rollId, g.step, g.turn, g.logId, g.longest, g.largest, Math.round(Hh)]);
    if (k === key) return;
    key = k;
    root.querySelector('.hs-board').innerHTML = boardSVG(g);
    if (g.rollId !== lastRoll && g.dice) {
      root.querySelector('.hs-dice').innerHTML = g.dice.map((d, i) => dieHTML(d, lastRoll !== -1 ? 'tumble' : '').replace('class="ydie', `style="--r:${i ? 8 : -10}deg" class="ydie`)).join('') + `<b>${g.dice[0] + g.dice[1]}</b>`;
      if (lastRoll !== -1) snap(0.45);
      lastRoll = g.rollId;
    }
    root.querySelector('.hs-scores').innerHTML = g.order.slice().sort((a, b) => H.points(g, b, false) - H.points(g, a, false))
      .map(s => `<li><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}<b>${H.points(g, s, g.phase === 'over')}</b></li>`).join('');
    root.querySelector('.hs-log').innerHTML = g.log.slice(-4).map(l => `<li><i style="background:var(--seat-${l.seat})"></i>${esc(ctx.nameOf(l.seat))} ${esc(l.text)}</li>`).join('');
    const who = esc(ctx.nameOf(g.turn));
    root.querySelector('.hs-now').innerHTML = g.phase === 'setup' ? `<b>${who}</b> places a ${g.step === 'cabin' ? 'cabin' : 'road'}`
      : g.phase === 'over' ? '' : g.discards ? 'Seven! Players with more than 7 cards discard half'
      : `<b>${who}</b> · ${{ roll: 'to roll', bandit: 'moves the Bandit', steal: 'chooses who to rob', main: 'builds and trades' }[g.step] || ''}${g.trade ? ` · offering ${esc(ctx.nameOf(g.trade.to))} a trade` : ''}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => H.points(g, b) - H.points(g, a));
    return {
      key: 'over' + g.logId,
      html: `<h2>${ctx.nameOf(g.winner)} wins</h2><p>${H.points(g, g.winner)} points</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${H.points(g, s)}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
