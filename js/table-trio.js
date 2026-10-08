// Trio on the table: a slate board with gold lines. Tap a square on the table, or play from
// your phone. Gold rings (seat 0) against ivory diamonds (seat 1).
import * as T from './trio.js?v=59';
import { seriesTimer, BEST_OF, LEVEL, applyLevel, duelPlate, duelOverlay, seriesText } from './duel.js?v=59';
import { snap } from './cards.js?v=59';

let root = null, gameRef = null, ctxRef = null, lastMove = -1;
export const mark = (who, cls = '') => (who == null ? '' : `<i class="tr-mark ${who === 0 ? 'ring' : 'gem'} ${cls}"></i>`);

function build() {
  root = document.createElement('div');
  root.id = 'trio';
  root.innerHTML = `<p class="tr-score"></p><div class="tr-board">${[...Array(9)].map((_, i) => `<button class="tr-cell" data-i="${i}" data-tv></button>`).join('')}</div><p class="tr-msg"></p>`;
  root.querySelector('.tr-board').addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    const g = gameRef;
    if (!b || !g || g.phase !== 'play' || ctxRef.isBot(g.p)) return;
    ctxRef.act(g.p, { type: 'move', i: Number(b.dataset.i) });
  });
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { bestOf: 3, level: 'normal' },
  settingsHTML: s => BEST_OF(s) + LEVEL(s),
  applySetting: applyLevel,
  create: settings => T.createGame(settings),
  act: T.applyAction,
  bot: T.botAction,
  view: T.viewFor,
  turn: g => (g.phase === 'play' ? g.p : -1),
  timer: g => seriesTimer(g, T.fresh),
  joinMidGame: () => false,
  plate: (g, seat) => duelPlate(g, seat, mark(seat, 'small')),
  reset() { root?.remove(); root = null; lastMove = -1; },

  renderCenter(g, ctx) {
    gameRef = g; ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    root.style.setProperty('--B', Math.min(felt.height - v * 30, felt.width - v * 64, v * 62) + 'px');
    root.querySelectorAll('.tr-cell').forEach((c, i) => {
      const k = `${g.board[i]}|${g.line?.includes(i)}|${g.last === i}`;
      if (c.dataset.k !== k) { c.dataset.k = k; c.innerHTML = mark(g.board[i], g.last === i ? 'pop' : ''); }
      c.classList.toggle('win', !!g.line?.includes(i));
      c.disabled = g.board[i] != null || g.phase !== 'play';
    });
    if (g.moveId !== lastMove) { if (lastMove !== -1) snap(0.4); lastMove = g.moveId; }
    root.querySelector('.tr-score').textContent = g.settings.bestOf > 1 ? `Game ${g.gameNo + 1} · ${seriesText(g, ctx.nameOf)}` : '';
    root.querySelector('.tr-msg').innerHTML = g.phase === 'play' ? `${mark(g.p, 'small')} <b>${ctx.nameOf(g.p)}</b> to play`
      : g.result ? (g.result.winner == null ? 'A draw' : `${mark(g.result.winner, 'small')} <b>${ctx.nameOf(g.result.winner)}</b> takes the game`) : '';
  },
  overlay: (g, ctx) => duelOverlay(g, ctx, 'trio'),
};
