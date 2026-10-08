// Milestones on the table: the deck and discard in the middle, and each player's laid-down
// groups in front of their seat, so everyone can see where to add cards.
import * as M from './milestones.js?v=60';
import { snap } from './cards.js?v=60';

let root = null, spots = {}, lastMove = -1;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// A Milestones card face (or its back).
export function msCard(c, extra = '') {
  if (!c) return `<div class="ms-card back ${extra}"><i>M</i></div>`;
  if (M.isWild(c)) return `<div class="ms-card wild ${extra}" data-c="${c}"><span>★</span><b>Wild</b></div>`;
  if (M.isSkip(c)) return `<div class="ms-card skip ${extra}" data-c="${c}"><span>⦸</span><b>Skip</b></div>`;
  const n = M.num(c);
  return `<div class="ms-card k-${M.col(c)} ${extra}" data-c="${c}"><span class="c">${n}</span><b>${n}</b><span class="c r">${n}</span></div>`;
}
export const groupText = gr => (gr.kind === 'set' ? `Set of ${gr.n}s` : gr.kind === 'run' ? `Run ${gr.lo}–${gr.hi}` : `${M.COLORS[gr.c]}`);

function build() {
  root = document.createElement('div');
  root.id = 'milestones';
  root.innerHTML = `<div class="ms-piles"><div class="ms-deck"></div><div class="ms-disc"></div></div><p class="ms-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Ten stages · finish stage ten first to win</span>',
  create: (settings, players) => M.createGame(settings, players),
  act: M.applyAction,
  bot: M.botAction,
  view: M.viewFor,
  turn: g => (g.phase === 'play' ? g.turn : -1),
  timer: g => (g.phase === 'roundOver' ? { ms: Math.max(0, g.nextAt - Date.now()) + 20, run: () => M.advance(g) } : null),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [`<span class="badge ms-stage">Stage ${Math.min(g.stage[seat] + 1, 10)}</span>`];
    if (g.laid[seat]) badges.push('<span class="badge got">laid down</span>');
    if (g.skipped[seat]) badges.push('<span class="badge lost">skipped</span>');
    return { badges, meta: `<span><b>${g.hands[seat].length}</b> cards</span><span><b>${g.score[seat]}</b> pts</span>`, cards: Math.min(g.hands[seat].length, 12), turn: g.phase === 'play' && g.turn === seat, out: false };
  },

  reset() { root?.remove(); root = null; spots = {}; lastMove = -1; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin;
    const cw = v * 6.6 * ctx.cardScale, mini = v * 3.4 * ctx.cardScale;
    root.style.setProperty('--mw', cw + 'px');
    root.querySelector('.ms-deck').innerHTML = msCard(null);
    root.querySelector('.ms-disc').innerHTML = g.discard.length ? msCard(g.discard[g.discard.length - 1]) : '';
    if (g.moveId !== lastMove) { if (lastMove !== -1) snap(0.35); lastMove = g.moveId; }
    // Each player's groups in front of them.
    for (const s of g.order) {
      let el = spots[s];
      if (!el) { el = spots[s] = document.createElement('div'); el.className = 'ms-laid'; root.appendChild(el); }
      const k = JSON.stringify(g.laid[s]) + mini;
      if (el.dataset.k !== k) {
        el.dataset.k = k;
        el.style.setProperty('--mw', mini + 'px');
        el.innerHTML = g.laid[s] ? g.laid[s].map(gr => `<div class="ms-group"><small>${groupText(gr)}</small><div>${(gr.kind === 'run' ? gr.cards.slice().sort((a, b) => (M.num(a) || 99) - (M.num(b) || 99)) : gr.cards).map(c => msCard(c)).join('')}</div></div>`).join('') : '';
      }
      const pt = ctx.inset(s, 24);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
    }
    const msg = root.querySelector('.ms-msg');
    if (g.phase === 'play') msg.innerHTML = `<b>${esc(ctx.nameOf(g.turn))}</b> · Stage ${g.stage[g.turn] + 1}: ${M.stageText(g.stage[g.turn])}`;
    else if (g.result) msg.innerHTML = `<b>${esc(ctx.nameOf(g.result.out))}</b> went out · ${g.result.advanced.length} moved up a stage`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.stage[b] - g.stage[a] || g.score[a] - g.score[b]);
    return {
      key: 'over' + g.round,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} win${g.winners.length > 1 ? '' : 's'}</h2><p>All ten stages, in ${g.round} rounds</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} · stage ${Math.min(g.stage[s] + 1, 10)} <b>${g.score[s]}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
