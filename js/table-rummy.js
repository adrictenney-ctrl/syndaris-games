// Rummy on the table: the stock and discard pile, and every meld laid down so far (with a dot
// in the colour of whoever laid it).
import * as R from './rummy.js?v=64';
import { cardEl, snap } from './cards.js?v=64';
import { centerMsg, clearMsg } from './table-hearts.js?v=64';

let root = null, key = '';

// A row of overlapping cards (a meld) as an element.
export function rowEl(cards, cls = '') {
  const d = document.createElement('div');
  d.className = 'rm-row ' + cls;
  cards.forEach(c => d.appendChild(cardEl(c)));
  return d;
}
// The stock and discard pile.
export function pilesEl(stockN, top) {
  const d = document.createElement('div');
  d.className = 'rm-piles';
  const st = document.createElement('div');
  st.className = 'rm-stock';
  for (let i = 0; i < Math.min(5, Math.ceil(stockN / 8)); i++) { const c = cardEl(null, true); c.style.transform = `translate(${-i}px, ${-i * 1.4}px)`; st.appendChild(c); }
  st.dataset.n = stockN;
  d.appendChild(st);
  const dis = document.createElement('div');
  dis.className = 'rm-discard';
  if (top) dis.appendChild(cardEl(top));
  d.appendChild(dis);
  return d;
}

export default {
  defaults: { target: 100 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[[0, 'One hand'], [100, '100 points'], [250, '250 points']].map(([v, t]) => `<option value="${v}" ${v === s.target ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  create: (settings, players) => R.createGame(settings, players),
  act: R.applyAction,
  bot: R.botAction,
  view: R.viewFor,
  turn: g => R.current(g),
  timer: g => R.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.result?.winner === s) badges.push(`<span class="badge got">+${g.result.pts}</span>`);
    return { badges, meta: `<span><b>${g.hands[s].length}</b> cards</span>${g.settings.target ? `<span><b>${g.scores[s]}</b> pts</span>` : ''}`, cards: Math.min(g.hands[s].length, 12), turn: R.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'rummy'; root.className = 'rm-wrap'; document.getElementById('center').appendChild(root); }
    root.style.setProperty('--cw', ctx.vmin * 7.4 * ctx.cardScale + 'px');
    const k = JSON.stringify([g.moveId, g.phase, ctx.cardScale]);
    if (k === key) return;
    if (key) snap(0.4);
    key = k;
    root.innerHTML = '';
    root.appendChild(pilesEl(g.stock.length, g.discard[g.discard.length - 1]));
    const box = document.createElement('div');
    box.className = 'rm-melds';
    g.melds.forEach(m => { const r = rowEl(m.cards); r.style.setProperty('--dot', `var(--seat-${m.by})`); box.appendChild(r); });
    if (!g.melds.length) box.innerHTML = '<p class="rm-empty">Melds go here</p>';
    root.appendChild(box);
    if (g.phase === 'draw') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> draws from the stock or the discard pile`);
    else if (g.phase === 'play') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> melds, lays off, then discards`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'handEnd' && g.phase !== 'over') return null;
    const r = g.result;
    if (r.wash) return { key: 'wash' + g.handNo, html: '<h2>A wash</h2><p>The stock ran out twice — nobody scores this hand.</p><p class="hint">Next hand in a moment… <button class="tool" data-do="next">Deal now</button></p>', next: () => R.advance(g) };
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: g.phase + g.handNo,
      html: `<h2>${g.phase === 'over' ? `${ctx.nameOf(r.winner)} wins!` : `${ctx.nameOf(r.winner)} went out${r.rummy ? ' — Rummy!' : ''}`}</h2>
        <p>+${r.pts}${r.rummy ? ' (doubled)' : ''} · left in hands: ${Object.entries(r.left).map(([s, v]) => `${ctx.nameOf(Number(s))} ${v}`).join(', ')}</p>
        ${g.settings.target ? `<ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b></li>`).join('')}</ol>` : ''}
        ${g.phase === 'over' ? '<div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>' : '<p class="hint">Next hand in a moment… <button class="tool" data-do="next">Deal now</button></p>'}`,
      next: () => R.advance(g),
    };
  },
};
