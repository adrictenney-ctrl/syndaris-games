// Spoons on the table: a ring of silver spoons in the middle (one fewer than players), the
// deck and the discard pile, and each player's waiting cards stacked in front of them.
// Spoons slide off to whoever grabs them — watch the middle!
import * as SP from './spoons.js?v=48';
import { cardEl, snap } from './cards.js?v=48';

let root = null, spoonEls = [], roundKey = '', lastGrab = 0, stacks = {};

export const SPOON_SVG = `<svg viewBox="0 0 40 160" aria-hidden="true"><defs><linearGradient id="spg" x1="0" x2="1"><stop offset="0" stop-color="#8d939b"/><stop offset=".45" stop-color="#f4f6f8"/><stop offset=".6" stop-color="#cfd4da"/><stop offset="1" stop-color="#7d838b"/></linearGradient></defs><ellipse cx="20" cy="26" rx="16" ry="24" fill="url(#spg)" stroke="#5f656d" stroke-width="1"/><ellipse cx="17" cy="22" rx="7" ry="13" fill="#fff" opacity=".35"/><path d="M17 48 C 17 70, 14 120, 15 150 Q 20 158 25 150 C 26 120, 23 70, 23 48 Z" fill="url(#spg)" stroke="#5f656d" stroke-width="1"/></svg>`;

function build() {
  root = document.createElement('div');
  root.id = 'spoons';
  root.innerHTML = `<div class="sp-ring"></div><div class="sp-piles"><div class="sp-pile deck"><b></b><small>Deck</small></div><div class="sp-pile discard"><b></b><small>Discard</small></div></div><p class="sp-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

function layoutSpoons(g, ctx) {
  const ring = root.querySelector('.sp-ring');
  const k = g.round + ':' + g.spoons;
  if (k !== roundKey) {
    roundKey = k;
    ring.innerHTML = '';
    spoonEls = [];
    for (let i = 0; i < g.spoons; i++) {
      const el = document.createElement('div');
      el.className = 'spoon';
      el.innerHTML = SPOON_SVG;
      ring.appendChild(el);
      spoonEls.push(el);
    }
    lastGrab = 0;
  }
  const v = ctx.vmin, R = v * 13;
  spoonEls.forEach((el, i) => {
    const who = g.grabbed[i];
    if (who != null) {
      const pt = ctx.inset(who, 24);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(who) + 90}deg) scale(.8)`;
      el.classList.add('taken');
    } else {
      const a = (i / g.spoons) * Math.PI * 2 - Math.PI / 2;
      el.style.transform = `translate(-50%, -50%) translate(${Math.cos(a) * R}px, ${Math.sin(a) * R}px) rotate(${(a * 180) / Math.PI + 90}deg)`;
      el.classList.remove('taken');
    }
  });
  if (g.grabbed.length > lastGrab) { snap(0.8); lastGrab = g.grabbed.length; }
}

function renderStacks(g, ctx) {
  const cw = ctx.vmin * 4.6 * ctx.cardScale;
  for (const s of Object.keys(stacks)) if (!g.order.includes(Number(s)) || g.phase !== 'play') { stacks[s].remove(); delete stacks[s]; }
  if (g.phase !== 'play') return;
  for (const s of g.order) {
    let el = stacks[s];
    if (!el) {
      el = stacks[s] = document.createElement('div');
      el.className = 'sp-wait';
      root.appendChild(el);
    }
    const n = g.queue[s].length + (s === g.order[0] ? 0 : 0);
    const key = n + ':' + cw;
    if (el.dataset.k !== key) {
      el.dataset.k = key;
      el.innerHTML = '';
      for (let i = 0; i < Math.min(n, 4); i++) {
        const c = cardEl(null, true);
        c.style.setProperty('--cw', cw + 'px');
        c.style.transform = `translate(${i * 2}px, ${-i * 2}px) rotate(${(i % 2 ? 4 : -3)}deg)`;
        el.appendChild(c);
      }
      if (n) el.insertAdjacentHTML('beforeend', `<b>${n}</b>`);
    }
    const pt = ctx.inset(s, 26);
    el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
  }
}

const letters = (n, out) => `<span class="sp-letters${out ? ' out' : ''}">${[...SP.WORD].map((ch, i) => `<i class="${i < n ? 'on' : ''}">${ch}</i>`).join('')}</span>`;

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">One spoon fewer than players · spell S-P-O-O-N and you\'re out</span>',

  create: (settings, players) => SP.createGame(settings, players),
  act: SP.applyAction,
  bot: () => null,
  view: SP.viewFor,
  turn: () => -1,
  timer(g, players) {
    if (g.phase === 'roundOver') return { ms: Math.max(0, g.nextAt - Date.now()) + 20, run: () => SP.advance(g) };
    if (g.phase === 'play' && g.order.some(s => players[s]?.bot)) return { ms: 800, run: () => SP.botsTick(g, players) };
    return null;
  },
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.out[seat]) badges.push('<span class="badge off">out</span>');
    else if (g.grabbed.includes(seat)) badges.push('<span class="badge got">🥄 safe</span>');
    else if (g.phase === 'roundOver' && g.loser === seat) badges.push('<span class="badge lost">no spoon</span>');
    if (g.order[0] === seat && g.phase === 'play') badges.push('<span class="badge dealer">deals</span>');
    return { badges, meta: letters(g.letters[seat], g.out[seat]), cards: g.out[seat] ? 0 : 4, turn: false, out: g.out[seat] };
  },

  reset() { root?.remove(); root = null; spoonEls = []; roundKey = ''; stacks = {}; lastGrab = 0; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    root.style.setProperty('--v', ctx.vmin + 'px');
    layoutSpoons(g, ctx);
    root.querySelector('.deck b').textContent = g.deck.length;
    root.querySelector('.discard b').textContent = g.discard.length;
    const msg = root.querySelector('.sp-msg');
    if (g.phase === 'play') msg.innerHTML = g.grabbed.length ? '<b>Spoons are going!</b> Grab one!' : `Round ${g.round} · keep or pass every card · four of a kind? <b>grab a spoon</b>`;
    else if (g.phase === 'roundOver') msg.innerHTML = g.loser != null ? `<b>${ctx.nameOf(g.loser)}</b> ${g.out[g.loser] ? 'spelled SPOON — out!' : `has no spoon · ${SP.WORD.slice(0, g.letters[g.loser])}`}` : '';
    else msg.innerHTML = '';
    renderStacks(g, ctx);
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.round,
      html: `<h2>${g.winner != null ? `${ctx.nameOf(g.winner)} wins` : 'Game over'}</h2><p>Last one with a spoon, after ${g.round} rounds</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
