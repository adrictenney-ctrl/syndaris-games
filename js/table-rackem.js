// Rack 'Em on the table: the deck and the discard pile, and each player's rack drawn as ten
// card edges standing in a wooden tray. At the end of a hand every rack is shown.
import * as R from './rackem.js?v=65';
import { snap } from './cards.js?v=65';
import { centerMsg, clearMsg } from './table-hearts.js?v=65';

let root = null, key = '';
// A Rack 'Em card: a long card with its number at the left end, shaded by value.
export const rkCard = (v, max, cls = '') => v == null ? `<div class="rk-card back ${cls}"></div>`
  : `<div class="rk-card ${cls}" style="--h:${Math.round(200 - (v / max) * 170)}; --p:${(v / max) * 100}%"><b>${v}</b><i></i></div>`;

export default {
  defaults: { target: 500 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[[150, '150 points'], [300, '300 points'], [500, '500 points']].map(([v, t]) => `<option value="${v}" ${v === s.target ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  create: (settings, players) => R.createGame(settings, players),
  act: R.applyAction,
  bot: R.botAction,
  view: R.viewFor,
  turn: g => R.current(g),
  timer: g => R.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = g.result?.winner === s ? ['<span class="badge got">rack!</span>'] : [];
    return { badges, meta: `<span><b>${g.scores[s]}</b> pts</span>`, cards: 0, turn: R.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'rackem'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.moveId, g.phase, ctx.upright, Math.round(ctx.vmin)]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.style.setProperty('--rw', ctx.vmin * 16 * ctx.cardScale + 'px');
    const show = g.phase === 'handEnd' || g.phase === 'over';
    let h = `<div class="rk-mid"><div class="rk-pile">${rkCard(null, g.max)}<small>${g.deck.length}</small></div><div class="rk-pile">${rkCard(g.discard[g.discard.length - 1], g.max)}<small>discard</small></div>
      ${g.drawn ? `<div class="rk-pile held">${rkCard(g.drawn.from === 'discard' ? g.drawn.v : null, g.max)}<small>${ctx.nameOf(g.turn)} holds</small></div>` : ''}</div>`;
    for (const s of g.order) {
      const pt = ctx.inset(s, 15);
      h += `<div class="rk-tray ${show ? 'open' : ''}" style="transform: translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ctx.rot(s)}deg)">${g.racks[s].map((v, i) => rkCard(show ? v : null, g.max, g.lastSlot?.seat === s && g.lastSlot.slot === i ? 'just' : '')).join('')}</div>`;
    }
    root.innerHTML = h;
    if (g.phase === 'draw') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> draws`);
    else if (g.phase === 'place') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> swaps a card into the rack`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'handEnd' && g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: g.phase + g.handNo,
      html: `<h2>${g.phase === 'over' ? `${ctx.nameOf(g.winner)} wins!` : `${ctx.nameOf(g.result.winner)} racked it!`}</h2><p>75 for the rack · 5 for each card in order from the front</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <span>+${g.result.add[s]}</span> <b>${g.scores[s]}</b></li>`).join('')}</ol>
        ${g.phase === 'over' ? '<div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>' : '<p class="hint">Next hand in a moment… <button class="tool" data-do="next">Deal now</button></p>'}`,
      next: () => R.advance(g),
    };
  },
};
