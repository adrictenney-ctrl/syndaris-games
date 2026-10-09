// Reversi on the table: a green baize board in a dark frame; discs flip when trapped. Tap a
// glowing square on the table or play from your phone.
import * as R from './reversi.js?v=68';
import { seriesTimer, BEST_OF, LEVEL, applyLevel, duelPlate, duelOverlay, seriesText } from './duel.js?v=68';
import { snap } from './cards.js?v=68';

let root = null, gameRef = null, ctxRef = null, lastMove = -1;
export const disc = (who, cls = '') => (who == null ? '' : `<i class="rv-disc d${who} ${cls}"></i>`);
export function boardHTML(g, canTap) {
  return g.board.map((x, i) => `<button class="rv-cell ${g.legal.includes(i) && canTap ? 'ok' : ''} ${g.last === i ? 'last' : ''}" data-i="${i}" data-tv>${disc(x, g.flipped?.includes(i) ? 'flip' : g.last === i ? 'pop' : '')}</button>`).join('');
}

export default {
  defaults: { bestOf: 1, level: 'normal' },
  settingsHTML: s => BEST_OF(s) + LEVEL(s),
  applySetting: applyLevel,
  create: settings => R.createGame(settings),
  act: R.applyAction,
  bot: R.botAction,
  view: R.viewFor,
  turn: g => (g.phase === 'play' ? g.p : -1),
  timer: g => seriesTimer(g, R.fresh),
  joinMidGame: () => false,
  plate: (g, seat) => { const p = duelPlate(g, seat, disc(seat, 'small')); p.meta += `<span><b>${R.count(g.board, seat)}</b> discs</span>`; return p; },
  reset() { root?.remove(); root = null; lastMove = -1; },
  renderCenter(g, ctx) {
    gameRef = g; ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    if (!root) {
      root = document.createElement('div');
      root.id = 'reversi';
      root.className = 'duel-wrap';
      root.innerHTML = '<p class="dw-score"></p><div class="rv-board"></div><p class="dw-msg"></p>';
      root.querySelector('.rv-board').addEventListener('click', e => {
        const b = e.target.closest('[data-i]');
        const G = gameRef;
        if (!b || !G || G.phase !== 'play' || ctxRef.isBot(G.p)) return;
        ctxRef.act(G.p, { type: 'move', i: Number(b.dataset.i) });
      });
      document.getElementById('center').appendChild(root);
    }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--B', Math.min(felt.height - v * 26, felt.width - v * 64, v * 74) + 'px');
    if (g.moveId !== lastMove) {
      if (lastMove !== -1) snap(0.4);
      lastMove = g.moveId;
      root.querySelector('.rv-board').innerHTML = boardHTML({ ...g, legal: g.phase === 'play' ? R.moves(g.board, g.p) : [] }, g.phase === 'play' && !ctx.isBot(g.p));
    }
    root.querySelector('.dw-score').textContent = g.settings.bestOf > 1 ? `Game ${g.gameNo + 1} · ${seriesText(g, ctx.nameOf)}` : `${R.count(g.board, 0)} – ${R.count(g.board, 1)}`;
    root.querySelector('.dw-msg').innerHTML = g.phase === 'play' ? `${disc(g.p, 'small')} <b>${ctx.nameOf(g.p)}</b> to play${g.passed ? ` · ${ctx.nameOf(1 - g.p)} had no move` : ''}`
      : g.result ? (g.result.winner == null ? 'A draw' : `${disc(g.result.winner, 'small')} <b>${ctx.nameOf(g.result.winner)}</b> takes the game`) : '';
  },
  overlay: (g, ctx) => duelOverlay(g, ctx, 'reversi'),
};
