// Seed Stones on the table: a long carved board with six pits a side and a store at each end.
// Seat 0 sows along the bottom row (store on the right), seat 1 along the top (store on the left).
import * as S from './seedstones.js?v=64';
import { seriesTimer, BEST_OF, LEVEL, applyLevel, duelPlate, duelOverlay, seriesText } from './duel.js?v=64';
import { snap } from './cards.js?v=64';

let root = null, gameRef = null, ctxRef = null, lastMove = -1;
const TONES = ['#d9c7a6', '#b9cfc2', '#c7b1c9', '#d6b08e', '#a9bccf', '#e2d8c3'];
const seeded = k => { const x = Math.sin(k * 91.7) * 43758.5; return x - Math.floor(x); };

// A pit's stones: up to 14 pebbles scattered inside, plus the count.
export function pebbles(n, salt) {
  let h = '';
  for (let k = 0; k < Math.min(n, 14); k++) {
    const a = seeded(salt * 31 + k) * Math.PI * 2, r = Math.sqrt(seeded(salt * 17 + k * 3)) * 30;
    h += `<i style="left:${50 + Math.cos(a) * r}%;top:${50 + Math.sin(a) * r}%;background:${TONES[(salt + k) % TONES.length]}"></i>`;
  }
  return `<span class="ss-peb">${h}</span><b>${n}</b>`;
}

// Board markup, seen from `side` (that seat's pits along the bottom).
export function boardHTML(g, side, clickable) {
  const bottom = S.pitsOf(side), top = S.pitsOf(1 - side).slice().reverse();
  const pit = i => `<button class="ss-pit${g.last === i ? ' last' : ''}" data-i="${i}" ${clickable && bottom.includes(i) && g.pits[i] ? '' : 'disabled'} data-tv>${pebbles(g.pits[i], i)}</button>`;
  return `<div class="ss-store left">${pebbles(g.pits[S.STORE[1 - side]], 13 + side)}</div>
    <div class="ss-rows"><div class="ss-row">${top.map(pit).join('')}</div><div class="ss-row">${bottom.map(pit).join('')}</div></div>
    <div class="ss-store right">${pebbles(g.pits[S.STORE[side]], 6 + side)}</div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'seedstones';
  root.innerHTML = `<p class="ss-score"></p><div class="ss-board"></div><p class="ss-msg"></p>`;
  root.querySelector('.ss-board').addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    const g = gameRef;
    if (!b || !g || g.phase !== 'play' || ctxRef.isBot(g.p)) return;
    ctxRef.act(g.p, { type: 'sow', i: Number(b.dataset.i) });
  });
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { bestOf: 1, level: 'normal', seeds: 4 },
  settingsHTML: s => BEST_OF(s) + LEVEL(s) + `<label>Stones per pit <select data-set="seeds">${[3, 4, 5, 6].map(n => `<option value="${n}" ${n === s.seeds ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`,
  applySetting: applyLevel,
  create: settings => S.createGame(settings),
  act: S.applyAction,
  bot: S.botAction,
  view: S.viewFor,
  turn: g => (g.phase === 'play' ? g.p : -1),
  timer: g => seriesTimer(g, S.fresh),
  joinMidGame: () => false,
  plate: (g, seat) => { const p = duelPlate(g, seat, `<span class="ss-mini">${g.pits[S.STORE[seat]]}</span>`); return p; },
  reset() { root?.remove(); root = null; lastMove = -1; },

  renderCenter(g, ctx) {
    gameRef = g; ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    root.style.setProperty('--P', Math.min((felt.width - v * 60) / 8.6, (felt.height - v * 34) / 2.4) + 'px');
    // In upright (TV) mode nobody sits on top; otherwise the side to move faces the bottom row.
    const side = 0;
    const k = JSON.stringify([g.pits, g.last, g.phase, g.p]);
    const board = root.querySelector('.ss-board');
    if (board.dataset.k !== k) { board.dataset.k = k; board.innerHTML = boardHTML(g, side, g.phase === 'play' && !ctx.isBot(g.p) && g.p === side); }
    // The top player can tap their pits on the table too.
    if (g.phase === 'play' && g.p === 1 && !ctx.isBot(1)) board.querySelectorAll('.ss-row:first-child .ss-pit').forEach(b => { b.disabled = !g.pits[Number(b.dataset.i)]; });
    if (g.moveId !== lastMove) { if (lastMove !== -1) { snap(0.3); setTimeout(() => snap(0.2), 120); } lastMove = g.moveId; }
    root.querySelector('.ss-score').textContent = g.settings.bestOf > 1 ? `Game ${g.gameNo + 1} · ${seriesText(g, ctx.nameOf)}` : '';
    root.querySelector('.ss-msg').innerHTML = g.phase === 'play' ? `<b>${ctx.nameOf(g.p)}</b> to sow · ${g.p === 0 ? 'bottom row' : 'top row'}`
      : g.result ? (g.result.winner == null ? `A draw, ${g.pits[6]} – ${g.pits[13]}` : `<b>${ctx.nameOf(g.result.winner)}</b> wins, ${Math.max(g.pits[6], g.pits[13])} – ${Math.min(g.pits[6], g.pits[13])}`) : '';
  },
  overlay: (g, ctx) => duelOverlay(g, ctx, 'seed'),
};
