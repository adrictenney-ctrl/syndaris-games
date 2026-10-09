// War on the table: each player's face-down pile by their edge, the flipped cards meeting in
// the middle, war cards fanned face down underneath.
import * as W from './war.js?v=68';
import { cardEl, snap } from './cards.js?v=68';
import { centerMsg, clearMsg } from './table-hearts.js?v=68';

let root = null, key = '';

function build() {
  root = document.createElement('div');
  root.id = 'war';
  root.innerHTML = '<div class="wr-side s0"><div class="wr-pile"></div><div class="wr-play"></div></div><div class="wr-side s1"><div class="wr-pile"></div><div class="wr-play"></div></div>';
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { length: 0, auto: false },
  settingsHTML: s => `<label>Length <select data-set="length">${[[0, 'Until someone has every card'], [26, 'Most cards after 26 battles'], [52, 'Most cards after 52 battles']].map(([v, t]) => `<option value="${v}" ${v === s.length ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-set="auto" ${s.auto ? 'checked' : ''}> Flip automatically</label>`,
  create: settings => W.createGame(settings),
  act: W.applyAction,
  bot: W.botAction,
  view: W.viewFor,
  turn: () => -1,
  timer: (g, players) => W.tick(g, players),
  joinMidGame: () => false,
  plate(g, s) {
    const badges = [];
    if (g.phase === 'over' && g.winner === s) badges.push('<span class="badge got">🏆 winner</span>');
    if (g.phase === 'reveal' && g.result.winner === s) badges.push(`<span class="badge got">+${g.result.n}</span>`);
    return { badges, meta: `<span><b>${g.piles[s].length}</b> cards</span>`, cards: 0, turn: g.phase === 'flip' && !g.flipped[s], out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    root.style.setProperty('--cw', ctx.vmin * 11 * ctx.cardScale + 'px');
    const k = JSON.stringify([g.moveId, g.phase, ctx.upright, ctx.cardScale]);
    if (k === key) return;
    if (key) snap(0.4);
    key = k;
    [0, 1].forEach(s => {
      const side = root.querySelector('.wr-side.s' + s);
      const pile = side.querySelector('.wr-pile');
      pile.innerHTML = '';
      for (let i = 0; i < Math.min(6, Math.ceil(g.piles[s].length / 5)); i++) { const c = cardEl(null, true); c.style.transform = `translate(${i * -1}px, ${i * -1.5}px)`; pile.appendChild(c); }
      pile.dataset.n = g.piles[s].length;
      const play = side.querySelector('.wr-play');
      play.innerHTML = '';
      g.up[s].forEach((card, i) => {
        if (i > 0) for (let d = 0; d < 3 && (i - 1) * 3 + d < g.down[s].length; d++) { const c = cardEl(null, true); c.classList.add('wr-down'); play.appendChild(c); }
        const c = cardEl(card);
        if (g.phase === 'reveal' && i === g.up[s].length - 1 && g.result.winner === s) c.classList.add('win');
        play.appendChild(c);
      });
    });
    if (g.phase === 'flip') centerMsg(g.wars ? '<b>WAR!</b> Three down, flip the fourth' : g.flipped.some(Boolean) ? `Waiting for <b>${ctx.nameOf(g.flipped[0] ? 1 : 0)}</b>` : 'Both players: <b>flip!</b>');
    else if (g.phase === 'reveal') centerMsg(`<b>${ctx.nameOf(g.result.winner)}</b> takes ${g.result.n}${g.result.war ? ' — won the war!' : ''}`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.battles,
      html: `<h2>${g.winner == null ? 'A draw' : `${ctx.nameOf(g.winner)} wins the war!`}</h2><p>${g.piles[0].length} cards – ${g.piles[1].length} cards after ${g.battles} battles</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
