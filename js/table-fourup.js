// Four Up on the table: a walnut frame standing on the felt. Tap a column on the table or on
// your phone; the disc drops to the lowest free slot.
import * as F from './fourup.js?v=51';
import { seriesTimer, BEST_OF, LEVEL, applyLevel, duelPlate, duelOverlay, seriesText } from './duel.js?v=51';
import { snap } from './cards.js?v=51';

let root = null, gameRef = null, ctxRef = null, lastMove = -1;
export const disc = (who, cls = '') => `<i class="fu-disc s${who} ${cls}"></i>`;

// The frame: columns of slots, top row first.
export function frameHTML(g, clickable) {
  const win = new Set((g.line || []).map(([c, r]) => c + ':' + r));
  let h = '';
  for (let c = 0; c < F.COLS; c++) {
    h += `<button class="fu-col" data-c="${c}" ${clickable && g.cols[c].length < F.ROWS ? '' : 'disabled'} data-tv>`;
    for (let r = F.ROWS - 1; r >= 0; r--) {
      const who = g.cols[c][r];
      const last = g.last && g.last[0] === c && g.last[1] === r;
      h += `<span class="fu-slot${win.has(c + ':' + r) ? ' win' : ''}">${who != null ? disc(who, last ? 'drop' : '') : ''}</span>`;
    }
    h += '</button>';
  }
  return h;
}

function build() {
  root = document.createElement('div');
  root.id = 'fourup';
  root.innerHTML = `<p class="fu-score"></p><div class="fu-frame"></div><p class="fu-msg"></p>`;
  root.querySelector('.fu-frame').addEventListener('click', e => {
    const b = e.target.closest('[data-c]');
    const g = gameRef;
    if (!b || !g || g.phase !== 'play' || ctxRef.isBot(g.p)) return;
    ctxRef.act(g.p, { type: 'drop', col: Number(b.dataset.c) });
  });
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { bestOf: 3, level: 'normal' },
  settingsHTML: s => BEST_OF(s) + LEVEL(s),
  applySetting: applyLevel,
  create: settings => F.createGame(settings),
  act: F.applyAction,
  bot: F.botAction,
  view: F.viewFor,
  turn: g => (g.phase === 'play' ? g.p : -1),
  timer: g => seriesTimer(g, F.fresh),
  joinMidGame: () => false,
  plate: (g, seat) => duelPlate(g, seat, disc(seat, 'small')),
  reset() { root?.remove(); root = null; lastMove = -1; },

  renderCenter(g, ctx) {
    gameRef = g; ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const S = Math.min((felt.height - v * 30) / 6.6, (felt.width - v * 64) / 7.6);
    root.style.setProperty('--S', S + 'px');
    const k = JSON.stringify([g.cols, g.line, g.phase, g.p]);
    const frame = root.querySelector('.fu-frame');
    if (frame.dataset.k !== k) { frame.dataset.k = k; frame.innerHTML = frameHTML(g, g.phase === 'play' && !ctx.isBot(g.p)); }
    if (g.moveId !== lastMove) { if (lastMove !== -1) snap(0.5); lastMove = g.moveId; }
    root.querySelector('.fu-score').textContent = g.settings.bestOf > 1 ? `Game ${g.gameNo + 1} · ${seriesText(g, ctx.nameOf)}` : '';
    root.querySelector('.fu-msg').innerHTML = g.phase === 'play' ? `${disc(g.p, 'small')} <b>${ctx.nameOf(g.p)}</b> to drop`
      : g.result ? (g.result.winner == null ? 'A draw' : `${disc(g.result.winner, 'small')} <b>${ctx.nameOf(g.result.winner)}</b> lines up four`) : '';
  },
  overlay: (g, ctx) => duelOverlay(g, ctx, 'fourup'),
};
