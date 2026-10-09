// Go on the table: a kaya-wood board with black ink lines and star points; slate and shell
// stones. Tap a point on the table or on your phone. After two passes, tap stones to mark them
// dead; the territory is shaded and the score shown until both players accept.
import * as G from './go.js?v=65';
import { seriesTimer, BEST_OF, LEVEL, applyLevel, duelPlate, duelOverlay, seriesText } from './duel.js?v=65';
import { snap } from './cards.js?v=65';

let root = null, gameRef = null, ctxRef = null, lastMove = -1;
export const stone = (who, cls = '') => (who == null ? '' : `<i class="go-stone s${who} ${cls}"></i>`);
const STARS = { 9: [2, 6, 4], 13: [3, 9, 6], 19: [3, 9, 15] };

// The board as SVG. Points are 10 units apart; a 7-unit margin.
export function goSVG(g) {
  const n = g.n, S = 10, M = 7, W = (n - 1) * S + 2 * M;
  const at = i => [M + (i % n) * S, M + Math.floor(i / n) * S];
  let h = `<rect width="${W}" height="${W}" rx="2" fill="url(#goWood)"/>`;
  for (let k = 0; k < n; k++) h += `<path d="M${M} ${M + k * S} H${W - M} M${M + k * S} ${M} V${W - M}" stroke="#2a1a08" stroke-width=".35" opacity=".85"/>`;
  const st = STARS[n];
  for (const r of st) for (const c of st) if (n !== 9 || (r !== 4) === (c !== 4)) h += `<circle cx="${M + c * S}" cy="${M + r * S}" r="1" fill="#2a1a08"/>`;
  const terr = g.stage === 'score' && g.score ? g.score.terr : null;
  for (let i = 0; i < n * n; i++) {
    const [x, y] = at(i), s = g.board[i], dead = g.dead.includes(i);
    if (terr && terr[i] != null && (s == null || dead)) h += `<rect x="${x - 2.2}" y="${y - 2.2}" width="4.4" height="4.4" fill="${terr[i] ? '#f6f1e4' : '#141414'}" opacity=".85"/>`;
    if (s != null) h += `<circle cx="${x}" cy="${y + .35}" r="4.6" fill="#000" opacity=".35"/><circle cx="${x}" cy="${y}" r="4.6" fill="url(#goS${s})" opacity="${dead ? .4 : 1}"/>`;
    if (g.last === i) h += `<circle cx="${x}" cy="${y}" r="1.6" fill="none" stroke="${s ? '#2a2a2a' : '#f3ead6'}" stroke-width=".6"/>`;
    h += `<circle class="go-hit" data-i="${i}" cx="${x}" cy="${y}" r="5" fill="transparent"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${W}" class="go-board"><defs>
    <linearGradient id="goWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3b672"/><stop offset=".5" stop-color="#d4a35c"/><stop offset="1" stop-color="#c08d48"/></linearGradient>
    <radialGradient id="goS0" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#5a5a5a"/><stop offset=".5" stop-color="#1a1a1a"/><stop offset="1" stop-color="#050505"/></radialGradient>
    <radialGradient id="goS1" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#ece6d8"/><stop offset="1" stop-color="#c8bfae"/></radialGradient></defs>${h}</svg>`;
}

export default {
  defaults: { bestOf: 1, level: 'normal', size: 9, komi: 6.5 },
  settingsHTML: s => `<label>Board <select data-set="size">${[9, 13, 19].map(n => `<option value="${n}" ${n === s.size ? 'selected' : ''}>${n} × ${n}</option>`).join('')}</select></label>` + BEST_OF(s) + LEVEL(s),
  applySetting: applyLevel,
  create: settings => G.createGame(settings),
  act: G.applyAction,
  bot: G.botAction,
  view: G.viewFor,
  turn: g => (g.phase !== 'play' ? -1 : g.stage === 'score' ? [0, 1].find(s => !g.accept[s]) ?? -1 : g.p),
  timer: g => seriesTimer(g, G.fresh),
  joinMidGame: () => false,
  plate: (g, seat) => { const p = duelPlate(g, seat, stone(seat, 'small')); p.meta += `<span><b>${g.caps[seat]}</b> captured</span>`; if (g.stage === 'score') p.turn = !g.accept[seat]; return p; },
  reset() { root?.remove(); root = null; lastMove = -1; },
  renderCenter(g, ctx) {
    gameRef = g; ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    if (!root) {
      root = document.createElement('div');
      root.id = 'go';
      root.className = 'duel-wrap';
      root.innerHTML = '<p class="dw-score"></p><div class="go-wrap"></div><p class="dw-msg"></p>';
      root.querySelector('.go-wrap').addEventListener('click', e => {
        const b = e.target.closest('[data-i]');
        const S = gameRef;
        if (!b || !S || S.phase !== 'play') return;
        if (S.stage === 'score') return ctxRef.act(S.p, { type: 'dead', i: Number(b.dataset.i) });
        if (ctxRef.isBot(S.p)) return;
        ctxRef.act(S.p, { type: 'move', i: Number(b.dataset.i) });
      });
      document.getElementById('center').appendChild(root);
    }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--B', Math.min(felt.height - v * 24, felt.width - v * 64, v * 78) + 'px');
    if (g.moveId !== lastMove) {
      if (lastMove !== -1) snap(0.5);
      lastMove = g.moveId;
      root.querySelector('.go-wrap').innerHTML = goSVG(g);
    }
    const sc = g.score;
    root.querySelector('.dw-score').textContent = g.stage === 'score' && sc ? `Black ${sc.black} · White ${sc.white} (komi ${g.settings.komi})` : g.settings.bestOf > 1 ? `Game ${g.gameNo + 1} · ${seriesText(g, ctx.nameOf)}` : `Captures: ${g.caps[0]} · ${g.caps[1]}`;
    root.querySelector('.dw-msg').innerHTML = g.phase !== 'play' ? (g.result ? `${stone(g.result.winner, 'small')} <b>${ctx.nameOf(g.result.winner)}</b> wins` : '')
      : g.stage === 'score' ? 'Tap dead stones to mark them, then both accept on your phones'
      : `${stone(g.p, 'small')} <b>${ctx.nameOf(g.p)}</b> to play${g.passes ? ` · ${ctx.nameOf(1 - g.p)} passed` : ''}`;
  },
  overlay: (g, ctx) => duelOverlay(g, ctx, 'go'),
};
