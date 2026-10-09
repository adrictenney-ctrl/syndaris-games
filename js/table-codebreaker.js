// Code Breaker on the table: a walnut board with ten rows of guesses (oldest at the bottom),
// gold and silver key pegs beside each, and the secret code under a brass shield until it's
// cracked.
import * as C from './codebreaker.js?v=65';
import { seriesTimer, BEST_OF, LEVEL, applyLevel, duelPlate, duelOverlay, seriesText } from './duel.js?v=65';
import { snap } from './cards.js?v=65';

let root = null, lastMove = -1;
export const peg = (c, cls = '') => `<i class="cb2-peg ${c == null ? 'empty' : ''} ${cls}" style="${c == null ? '' : `--pc:${C.COLORS[c]}`}"></i>`;
export const keys = (b, w) => `<span class="cb2-keys">${[...Array(C.PEGS)].map((_, i) => `<i class="${i < b ? 'k' : i < b + w ? 'w' : ''}"></i>`).join('')}</span>`;
export function rowsHTML(g) {
  let h = '';
  for (let r = g.tries - 1; r >= 0; r--) {
    const q = g.guesses[r];
    h += `<div class="cb2-row ${r === g.guesses.length && g.stage === 'guess' ? 'now' : ''}"><small>${r + 1}</small>${[0, 1, 2, 3].map(i => peg(q ? q.pegs[i] : null)).join('')}${q ? keys(q.black, q.white) : keys(0, 0)}</div>`;
  }
  return h;
}

export default {
  defaults: { bestOf: 1, level: 'normal', colors: 6, tries: 10 },
  settingsHTML: s => `<label>Colours <select data-set="colors">${[6, 8].map(n => `<option value="${n}" ${n === s.colors ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` + BEST_OF(s) + LEVEL(s),
  applySetting: applyLevel,
  create: settings => C.createGame(settings),
  act: C.applyAction,
  bot: C.botAction,
  view: C.viewFor,
  turn: g => (g.phase === 'play' && g.p >= 0 ? g.p : -1),
  timer: g => C.tick(g) || seriesTimer(g, C.fresh),
  joinMidGame: () => false,
  plate: (g, seat) => { const p = duelPlate(g, seat, ''); p.meta += `<span><b>${g.points[seat]}</b> pts</span><span>${g.maker === seat ? '🔒 code-maker' : '🔍 breaker'}</span>`; return p; },
  reset() { root?.remove(); root = null; lastMove = -1; },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) {
      root = document.createElement('div');
      root.id = 'codebreaker';
      root.className = 'duel-wrap';
      root.innerHTML = '<p class="dw-score"></p><div class="cb2-board"><div class="cb2-code"></div><div class="cb2-rows"></div></div><p class="dw-msg"></p>';
      document.getElementById('center').appendChild(root);
    }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--R', Math.min((felt.height - v * 30) / 11.5, v * 6.4) + 'px');
    if (g.moveId !== lastMove) { if (lastMove !== -1) snap(0.4); lastMove = g.moveId; }
    const show = g.stage === 'reveal' || g.phase !== 'play';
    root.querySelector('.cb2-code').innerHTML = show && g.code ? g.code.map(c => peg(c)).join('') : `<span class="cb2-shield">${g.code ? '🔒 secret code' : 'waiting for the code…'}</span>`;
    root.querySelector('.cb2-rows').innerHTML = rowsHTML({ ...g, tries: g.settings.tries });
    root.querySelector('.dw-score').textContent = `${ctx.nameOf(0)} ${g.points[0]} · ${g.points[1]} ${ctx.nameOf(1)}${g.settings.bestOf > 1 ? ` · games ${seriesText(g, ctx.nameOf)}` : ''}`;
    const breaker = 1 - g.maker;
    root.querySelector('.dw-msg').innerHTML = g.phase !== 'play' ? '' : g.stage === 'set' ? `<b>${ctx.nameOf(g.maker)}</b> is setting a secret code` : g.stage === 'guess' ? `<b>${ctx.nameOf(breaker)}</b> is guessing · try ${g.guesses.length + 1} of ${g.settings.tries}` : g.guesses.at(-1)?.black === C.PEGS ? `<b>${ctx.nameOf(breaker)}</b> cracked it in ${g.guesses.length}!` : 'Not cracked!';
  },
  overlay: (g, ctx) => duelOverlay(g, ctx, 'codebreaker'),
};
