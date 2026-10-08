// Pass the Pot on the table: a brass bowl in the middle that fills up as the game goes, each
// player's little stack of chips in front of them, and the last throw of the dice — with
// where every chip went.
import * as P from './passpot.js?v=62';
import { snap } from './cards.js?v=62';

let root = null, stacks = {}, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// One of our dice: arrows, the pot, or a plain keep face (a small star).
export function ppDie(f, cls = '') {
  const art = {
    L: '<path d="M62 30 L34 50 L62 70 Z"/>',
    R: '<path d="M38 30 L66 50 L38 70 Z"/>',
    P: '<ellipse cx="50" cy="56" rx="22" ry="12"/><path d="M28 52 Q50 74 72 52 L72 56 Q50 80 28 56 Z" opacity=".55"/><circle cx="44" cy="44" r="6"/><circle cx="56" cy="42" r="6"/><circle cx="50" cy="36" r="6"/>',
    K: '<path d="M50 38 L53.5 46.5 L62 47 L55.5 52.5 L57.5 61 L50 56.5 L42.5 61 L44.5 52.5 L38 47 L46.5 46.5 Z" opacity=".55"/>',
  }[f];
  return `<span class="pp-die f-${f} ${cls}"><svg viewBox="0 0 100 100">${art}</svg></span>`;
}

// A stack of chips, drawn as discs piled up (capped so a big pile still fits).
export function chipStack(n, cls = '') {
  const shown = Math.min(n, 12);
  return `<span class="pp-stack ${cls}">${Array.from({ length: shown }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</span>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'passpot';
  root.innerHTML = `<div class="pp-bowl"><div class="pp-in"></div><b></b><small>in the pot</small></div><div class="pp-throw"></div><p class="pp-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { chips: 3 },
  settingsHTML: s => `<label>Chips each <select data-set="chips">${[3, 4, 5].map(n => `<option value="${n}" ${n === s.chips ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`,
  create: (settings, players) => P.createGame(settings, players),
  act: (g, s, a) => P.applyAction(g, s, a),
  bot: P.botAction,
  view: P.viewFor,
  turn: g => P.current(g),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'over' && g.winner === seat) badges.push('<span class="badge got">🏆 takes the pot</span>');
    else if (!g.chips[seat]) badges.push('<span class="badge">no chips · still in</span>');
    return { badges, meta: `<span><b>${g.chips[seat]}</b> chip${g.chips[seat] === 1 ? '' : 's'}</span>`, cards: 0, turn: P.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; stacks = {}; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin;
    root.style.setProperty('--v', v + 'px');
    for (const s of g.order) {
      let el = stacks[s];
      if (!el) { el = stacks[s] = document.createElement('div'); el.className = 'pp-mine'; root.appendChild(el); }
      const k = String(g.chips[s]) + (g.last?.id || 0);
      if (el.dataset.k !== k) {
        el.dataset.k = k;
        const got = g.last && g.last.moves.filter(m => m.to === s && m.face !== 'K').length;
        el.innerHTML = `${chipStack(g.chips[s], got ? 'got' : '')}<b>${g.chips[s]}</b>`;
      }
      const pt = ctx.inset(s, 19);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
    }
    const k = JSON.stringify([g.moveId, g.phase, Math.round(v)]);
    if (k === key) return;
    if (key) snap(0.35);
    key = k;
    root.querySelector('.pp-bowl b').textContent = g.pot;
    root.querySelector('.pp-in').innerHTML = Array.from({ length: Math.min(g.pot, 40) }, (_, i) => {
      const a = i * 2.39996, r = 3.2 * Math.sqrt(i + 0.5);
      return `<i style="left:${50 + Math.cos(a) * r}%;top:${52 + Math.sin(a) * r * 0.6}%"></i>`;
    }).join('');
    const L = g.last;
    root.querySelector('.pp-throw').innerHTML = L ? `<div class="pp-dice">${L.dice.map(f => ppDie(f, 'roll')).join('')}</div>
      <p>${L.moves.map(m => m.face === 'K' ? '' : m.face === 'P' ? '<span>1 → pot</span>' : `<span>1 → ${esc(ctx.nameOf(m.to))}</span>`).filter(Boolean).join('') || '<span>all kept</span>'}</p>` : '';
    const msg = root.querySelector('.pp-msg');
    msg.innerHTML = g.phase === 'over' ? `<b>${esc(ctx.nameOf(g.winner))}</b> is the last one holding chips`
      : `<b>${esc(ctx.nameOf(g.turn))}</b> rolls ${Math.min(3, g.chips[g.turn])} ${Math.min(3, g.chips[g.turn]) === 1 ? 'die' : 'dice'}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.moveId,
      html: `<h2>${ctx.nameOf(g.winner)} takes the pot!</h2><p>The last player still holding chips · ${g.won} chips in the pot</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
