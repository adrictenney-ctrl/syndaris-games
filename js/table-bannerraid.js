// Banner Raid on the table: the field — grass squares, two still lakes — with every piece
// standing face-down in its side's colour. Only pieces that have fought (or Scouts that ran)
// show their rank. After each battle both pieces are shown side by side for a moment.
import * as B from './bannerraid.js?v=68';
import { snap } from './cards.js?v=68';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const SHORT = { 10: 'X', M: '✸', B: '⚑' };

// One piece. r = null when its rank is hidden from whoever is looking.
export function pieceHTML(pc, cls = '') {
  if (!pc) return '';
  const face = pc.r == null ? '<i class="br-crest">⚔</i>' : `<b>${SHORT[pc.r] || pc.r}</b><small>${B.RANKS[pc.r].name}</small>`;
  return `<span class="br-pc o${pc.o} ${pc.r == null ? 'hid' : 'r' + pc.r} ${pc.known ? 'known' : ''} ${cls}">${face}</span>`;
}

// The board. view: { board: [...], last, battle }; o: { flip, sel, dots: Set, tap, zone: Set }
export function fieldHTML(v, o = {}) {
  let h = '';
  for (let i = 0; i < 100; i++) {
    const sq = o.flip ? 99 - i : i;
    const lake = B.LAKES.has(sq);
    const cls = ['br-sq', lake ? 'lake' : (Math.floor(sq / 10) + sq) % 2 ? 'a' : 'b'];
    if (v.last && (v.last.from === sq || v.last.to === sq)) cls.push('lastmv');
    if (o.sel === sq) cls.push('sel');
    if (o.zone?.has(sq)) cls.push('zone');
    const dot = o.dots?.has(sq) ? `<i class="br-dot${v.board[sq] ? ' hit' : ''}"></i>` : '';
    h += `<div class="${cls.join(' ')}" ${o.tap ? `data-sq="${sq}"` : ''}>${pieceHTML(v.board[sq], v.battle?.at === sq && v.battle.id >= (v.moveId || 0) - 1 ? 'fought' : '')}${dot}</div>`;
  }
  return `<div class="br-field">${h}</div>`;
}

export function battleHTML(bt) {
  const res = bt.res === 'a' ? 'wins' : bt.res === 'd' ? 'loses' : 'trade';
  return `<div class="br-battle">${pieceHTML({ o: bt.ap, r: bt.a, known: true }, bt.res === 'a' ? 'win' : 'lose')}<span>${res === 'wins' ? '›' : res === 'loses' ? '‹' : '='}</span>${pieceHTML({ o: 1 - bt.ap, r: bt.d, known: true }, bt.res === 'd' ? 'win' : 'lose')}</div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'bannerraid';
  root.innerHTML = `<div class="br-board"></div><div class="br-fight"></div><p class="br-msg"></p><div class="br-lost l0"></div><div class="br-lost l1"></div>`;
  document.getElementById('center').appendChild(root);
}

const lostHTML = (g, p) => B.ORDER.filter(r => g.lost[p].includes(r)).map(r => `<span>${SHORT[r] || r}${g.lost[p].filter(x => x === r).length > 1 ? `<sup>×${g.lost[p].filter(x => x === r).length}</sup>` : ''}</span>`).join('');

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Set up your 40 pieces on your phone, then raid</span>',
  create: (settings, players) => B.createGame(settings, players),
  act: B.applyAction,
  bot: B.botAction,
  view: B.viewFor,
  turn: g => B.current(g),
  timer: (g, players) => B.tick(g, players),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const p = B.playerOf(g, seat), badges = [];
    if (g.phase === 'setup') badges.push(g.ready[p] ? '<span class="badge got">ready</span>' : '<span class="badge">setting up…</span>');
    if (g.phase === 'over' && g.winner === seat) badges.push('<span class="badge got">🏆 winner</span>');
    const left = g.board.filter(x => x && x.o === p && !['M', 'B'].includes(x.r)).length;
    return { badges, meta: `<span class="br-side o${p}">${p ? 'Indigo' : 'Oxblood'}</span><span><b>${left}</b> movable</span>`, cards: 0, turn: B.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--bw', Math.min(felt.height - v * 10, felt.width - v * 48) + 'px');
    const k = JSON.stringify([g.moveId, g.phase, Math.round(felt.width), Math.round(felt.height)]);
    if (k === key) return;
    if (key) snap(g.battle ? 0.5 : 0.25);
    key = k;
    const view = { board: g.board.map(pc => pc && ({ o: pc.o, r: pc.known || g.phase === 'over' ? pc.r : null, known: pc.known })), last: g.last, battle: g.battle, moveId: g.moveId };
    root.querySelector('.br-board').innerHTML = fieldHTML(view, { flip: ctx.rot(g.order[0]) === 180 });
    root.querySelector('.br-fight').innerHTML = g.battle && g.battle.id >= g.moveId - 1 ? battleHTML(g.battle) : '';
    [0, 1].forEach(p => { root.querySelector('.br-lost.l' + p).innerHTML = g.lost[p].length ? `<small>${p ? 'Indigo' : 'Oxblood'} lost</small>${lostHTML(g, p)}` : ''; });
    const msg = root.querySelector('.br-msg');
    if (g.phase === 'setup') msg.innerHTML = 'Arrange your pieces on your phone, then tap Ready';
    else if (g.phase === 'over') msg.innerHTML = '';
    else msg.innerHTML = `<b>${esc(ctx.nameOf(B.current(g)))}</b> to move`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const how = { banner: 'captured the Banner', stuck: 'left the other side with no moves', draw: '' }[g.how];
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.how === 'draw' ? 'A draw' : `${ctx.nameOf(g.winner)} wins!`}</h2><p>${g.how === 'draw' ? '1,500 moves and no Banner taken' : how}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
