// Sonar on the table: two radar screens, one for each player's waters, showing every ping —
// hits, misses and sunken ships (never the hidden fleet, until the game is over).
import * as SO from './sonar.js?v=61';
import { seriesTimer, BEST_OF, LEVEL, applyLevel, duelPlate, duelOverlay, seriesText } from './duel.js?v=61';
import { snap } from './cards.js?v=61';

let root = null, lastMove = -1;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const COLS = 'ABCDEFGHIJ';
export const cellName = c => `${COLS[c % 10]}${Math.floor(c / 10) + 1}`;

// A radar grid. shots: {cell: hit|miss}; ships: [{len, down, r, c}] to draw; opts.mine shows unhit ship squares.
export function gridHTML(shots, ships, opts = {}) {
  const shipCells = {};
  ships.forEach(sh => SO.cellsOf(sh).forEach((x, k) => { shipCells[x] = { sh, k }; }));
  let h = '';
  for (let x = 0; x < SO.N * SO.N; x++) {
    const s = shots[x], ship = shipCells[x];
    const cls = ['so-c'];
    if (ship) cls.push('ship', ship.sh.down ? 'v' : 'h', ship.k === 0 ? 'bow' : ship.k === ship.sh.len - 1 ? 'stern' : 'mid');
    if (s) cls.push(s);
    if (opts.last === x) cls.push('last');
    if (opts.pick && !s) cls.push('pick');
    if (opts.sel?.has(x)) cls.push('sel');
    h += `<i class="${cls.join(' ')}" data-cell="${x}"></i>`;
  }
  return `<div class="so-grid${opts.mine ? ' mine' : ''}">${h}</div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'sonar';
  root.innerHTML = `<p class="so-score"></p><div class="so-screens"><div class="so-screen s0"><h4></h4><div class="so-wrap"></div><p></p></div><div class="so-screen s1"><h4></h4><div class="so-wrap"></div><p></p></div></div><p class="so-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { bestOf: 1, level: 'normal', again: false },
  settingsHTML: s => BEST_OF(s) + LEVEL(s) + `<label><input type="checkbox" data-set="again" ${s.again ? 'checked' : ''}> A hit earns another ping</label>`,
  applySetting: applyLevel,
  create: settings => SO.createGame(settings),
  act: SO.applyAction,
  bot: SO.botAction,
  view: SO.viewFor,
  turn: g => (g.phase !== 'play' ? -1 : g.step === 'place' ? -1 : g.p),
  timer(g, players) {
    if (g.phase === 'play' && g.step === 'place') {
      const b = [0, 1].find(s => players[s]?.bot && !g.ready[s]);
      return b != null ? { ms: 500, run: () => SO.applyAction(g, b, { type: 'ready' }) } : null;
    }
    return seriesTimer(g, SO.fresh);
  },
  joinMidGame: () => false,
  plate(g, seat) {
    const p = duelPlate(g, seat, `<span class="so-left">${SO.FLEET.length - g.sunk[seat].length} ships afloat</span>`);
    if (g.step === 'place' && g.phase === 'play') p.badges.push(g.ready[seat] ? '<span class="badge got">ready</span>' : '<span class="badge">placing ships</span>');
    p.turn = g.phase === 'play' && g.step === 'fire' && g.p === seat;
    return p;
  },
  reset() { root?.remove(); root = null; lastMove = -1; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    root.style.setProperty('--G', Math.min((felt.width - v * 70) / 2.25, felt.height - v * 34) + 'px');
    for (const s of [0, 1]) {
      const scr = root.querySelector(`.so-screen.s${s}`);
      scr.querySelector('h4').innerHTML = `<i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}'s waters`;
      const ships = g.phase === 'play' ? g.sunk[s].map(k => g.fleets[s][k]) : g.fleets[s];
      const k = JSON.stringify([g.shots[s], ships, g.last?.cell, g.last?.by]);
      const wrap = scr.querySelector('.so-wrap');
      if (wrap.dataset.k !== k) { wrap.dataset.k = k; wrap.innerHTML = gridHTML(g.shots[s], ships, { last: g.last && g.last.by !== s ? g.last.cell : null }); }
      scr.classList.toggle('target', g.phase === 'play' && g.step === 'fire' && g.p !== s);
      scr.querySelector('p').textContent = g.step === 'place' && g.phase === 'play' ? (g.ready[s] ? 'Fleet hidden' : 'Placing ships…') : `${SO.FLEET.length - g.sunk[s].length} of ${SO.FLEET.length} ships afloat`;
    }
    if (g.moveId !== lastMove) { if (lastMove !== -1) snap(g.last?.hit ? 0.7 : 0.25); lastMove = g.moveId; }
    root.querySelector('.so-score').textContent = g.settings.bestOf > 1 ? `Game ${g.gameNo + 1} · ${seriesText(g, ctx.nameOf)}` : '';
    const L = g.last;
    root.querySelector('.so-msg').innerHTML = g.phase !== 'play' ? (g.result ? `<b>${esc(ctx.nameOf(g.result.winner))}</b> sank the whole fleet` : '')
      : g.step === 'place' ? 'Both captains are hiding their fleets…'
      : `${L ? `${esc(ctx.nameOf(L.by))} pinged ${cellName(L.cell)} — <b>${L.sunk != null ? `sank the ${SO.FLEET[L.sunk].name}!` : L.hit ? 'hit!' : 'miss'}</b> · ` : ''}<b>${esc(ctx.nameOf(g.p))}</b> to ping`;
  },
  overlay: (g, ctx) => duelOverlay(g, ctx, 'sonar'),
};
