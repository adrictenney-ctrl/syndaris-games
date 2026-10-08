// Gin Rummy on the table: the stock and discard pile between the two players. After a knock
// both hands are laid out face up — melds, deadwood, and what was laid off.
import * as G from './gin.js?v=63';
import { snap } from './cards.js?v=63';
import { centerMsg, clearMsg } from './table-hearts.js?v=63';
import { rowEl, pilesEl } from './table-rummy.js?v=63';

let root = null, key = '';

export default {
  defaults: { target: 100, level: 'normal' },
  settingsHTML: s => `<label>Play to <select data-set="target">${[50, 100, 150].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label>`,
  create: settings => G.createGame(settings),
  act: G.applyAction,
  bot: G.botAction,
  view: G.viewFor,
  turn: g => G.current(g),
  timer: g => G.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    const badges = [];
    if (g.dealer === s) badges.push('<span class="badge dealer">DEALER</span>');
    if (g.result?.winner === s && !g.result.wash) badges.push(`<span class="badge got">+${g.result.pts}</span>`);
    return { badges, meta: `<span><b>${g.scores[s]}</b> pts</span>`, cards: g.hands[s].length, turn: G.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'gin'; root.className = 'rm-wrap'; document.getElementById('center').appendChild(root); }
    root.style.setProperty('--cw', ctx.vmin * 8 * ctx.cardScale + 'px');
    const k = JSON.stringify([g.moveId, g.phase, ctx.cardScale]);
    if (k === key) return;
    if (key) snap(0.4);
    key = k;
    root.innerHTML = '';
    const r = g.result;
    if (r && !r.wash) {
      const side = (melds, dead, label) => {
        const d = document.createElement('div');
        d.className = 'gn-show';
        d.innerHTML = `<small>${label}</small>`;
        const rows = document.createElement('div');
        rows.className = 'rm-melds';
        melds.forEach(m => rows.appendChild(rowEl(m)));
        if (dead.length) rows.appendChild(rowEl(dead, 'dead'));
        d.appendChild(rows);
        return d;
      };
      root.appendChild(side(r.kMelds, r.kDead, `${ctx.nameOf(r.knocker)} ${r.gin ? 'went GIN' : `knocked · ${r.kDw} deadwood`}`));
      root.appendChild(side(r.dMelds, r.dDead, `${ctx.nameOf(1 - r.knocker)} · ${r.dDw} deadwood${r.laid.length ? ` (laid off ${r.laid.length})` : ''}`));
    } else root.appendChild(pilesEl(g.stock.length, g.discard[g.discard.length - 1]));
    if (g.phase === 'draw') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> draws`);
    else if (g.phase === 'discard') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> discards — or knocks`);
    else centerMsg(r?.wash ? 'The stock ran out — a wash' : '');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.handNo,
      html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>${ctx.nameOf(0)} ${g.scores[0]} · ${ctx.nameOf(1)} ${g.scores[1]} (includes the 100-point game bonus)</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
