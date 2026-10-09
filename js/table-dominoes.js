// Dominoes on the table: the line of play laid out in rows (read left to right, top to bottom),
// the two open ends called out big on either side, and the boneyard.
import * as D from './dominoes.js?v=65';
import { snap } from './cards.js?v=65';
import { centerMsg, clearMsg } from './table-hearts.js?v=65';

let root = null, key = '';
const PIP = { 0: [], 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
const half = (n, ox) => PIP[n].map(([x, y]) => `<circle cx="${ox + 5 + x * 5}" cy="${5 + y * 5}" r="1.5"/>`).join('');
// A domino as SVG (20×10, or 10×20 standing up).
export function domino(a, b, { vertical = false, cls = '' } = {}) {
  const body = `<rect x=".5" y=".5" width="39" height="19" rx="3" class="dm-face"/><path d="M20 3 V17" class="dm-split"/><g class="dm-pips" transform="translate(0 0)">${half(a, 0)}${half(b, 20)}</g>`;
  return vertical ? `<svg viewBox="0 0 20 40" class="domino v ${cls}"><g transform="translate(20 0) rotate(90)">${body}</g></svg>`
    : `<svg viewBox="0 0 40 20" class="domino ${cls}">${body}</svg>`;
}

export default {
  defaults: { target: 100 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[[0, 'One hand'], [100, '100 points'], [150, '150 points']].map(([v, t]) => `<option value="${v}" ${v === s.target ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  create: (settings, players) => D.createGame(settings, players),
  act: D.applyAction,
  bot: D.botAction,
  view: D.viewFor,
  turn: g => D.current(g),
  timer: g => D.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = g.result?.winner === s ? [`<span class="badge got">+${g.result.pts}</span>`] : [];
    return { badges, meta: `<span><b>${g.hands[s].length}</b> tiles</span>${g.settings.target ? `<span><b>${g.scores[s]}</b> pts</span>` : ''}`, cards: 0, turn: D.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'dominoes'; document.getElementById('center').appendChild(root); }
    root.style.setProperty('--dw', ctx.vmin * 8.4 * ctx.cardScale + 'px');
    const k = JSON.stringify([g.moveId, g.phase, ctx.cardScale]);
    if (k === key) return;
    if (key) snap(0.5);
    key = k;
    const ends = g.ends ? `<div class="dm-end l"><small>Left end</small><b>${g.ends[0]}</b></div><div class="dm-end r"><small>Right end</small><b>${g.ends[1]}</b></div>` : '';
    root.innerHTML = `${ends}<div class="dm-line">${g.line.map((x, i) => domino(x.pair[0], x.pair[1], { vertical: x.pair[0] === x.pair[1], cls: (i === 0 || i === g.line.length - 1 ? 'end ' : '') + (x.t === g.last ? 'last' : '') })).join('') || '<p class="dm-empty">The highest double opens</p>'}</div><div class="dm-bone">Boneyard <b>${g.bone.length}</b></div>`;
    if (g.phase === 'play') centerMsg(`<b>${ctx.nameOf(g.turn)}</b>'s turn`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'handEnd' && g.phase !== 'over') return null;
    const r = g.result;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: g.phase + g.handNo,
      html: `<h2>${g.phase === 'over' ? `${ctx.nameOf(g.winner)} wins!` : r.winner == null ? 'Blocked — a tie' : r.how === 'domino' ? `${ctx.nameOf(r.winner)} dominoes!` : `Blocked — ${ctx.nameOf(r.winner)} has the lightest hand`}</h2><p>${r.pts ? `+${r.pts} points` : 'No score'}</p>
        ${g.settings.target ? `<ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b></li>`).join('')}</ol>` : ''}
        ${g.phase === 'over' ? '<div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>' : '<p class="hint">Next hand in a moment… <button class="tool" data-do="next">Deal now</button></p>'}`,
      next: () => D.advance(g),
    };
  },
};
