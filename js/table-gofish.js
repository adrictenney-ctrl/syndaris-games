// Go Fish on the table screen: the whole table is a pond. Face-down cards drift in the
// water; books sit in front of each player; caught cards come up out of the water.
import * as F from './gofish.js?v=8';
import { cardEl, snap } from './cards.js?v=8';

const $ = id => document.getElementById(id);
let floaters = [];      // drifting face-down cards in the pond
let lastAskId = null;
let lastCatchId = null;
let bookEls = new Map(); // seat -> element showing that seat's books
let pondRound = null;

function ensure(id, cls) {
  let el = $(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = cls;
    $('center').appendChild(el);
  }
  return el;
}

// A ring of ripples where something broke the surface.
function splash(x, y, big) {
  const s = document.createElement('div');
  s.className = 'splash' + (big ? ' big' : '');
  s.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  $('center').appendChild(s);
  setTimeout(() => s.remove(), 1400);
}

export default {
  defaults: { motion: false },

  settingsHTML: s => `<label><input type="checkbox" data-set="motion" ${s.motion ? 'checked' : ''}> Fishing motion (reel in with your phone)</label>`,

  // The little corner switch for the motion controls; works mid-game too.
  tool: {
    label: s => `Fishing motion: ${s.motion ? 'on' : 'off'}`,
    toggle(s, g) {
      s.motion = !s.motion;
      if (g) g.settings.motion = s.motion;
    },
  },

  create: (settings, players) => F.createGame(settings, players.map(Boolean)),
  act: F.applyAction,
  bot: F.botAction,
  view: F.viewFor,
  turn: g => (g.phase === 'ask' || g.phase === 'fish' ? g.turn : -1),
  timer: () => null,
  joinMidGame(g, seat) { F.addPlayer(g, seat); return true; },

  plate(g, seat) {
    const s = g.seats[seat];
    if (!s) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.turn === seat && g.phase === 'fish') badges.push('<span class="badge alone">fishing</span>');
    if (!s.active) badges.push('<span class="badge off">next game</span>');
    return {
      badges,
      meta: `<span><b>${s.hand.length}</b> cards</span><span><b>${s.books.length}</b> book${s.books.length === 1 ? '' : 's'}</span>`,
      cards: s.active ? Math.min(s.hand.length, 12) : 0,
      turn: g.turn === seat && (g.phase === 'ask' || g.phase === 'fish'),
      out: !s.active,
    };
  },

  reset() {
    floaters.forEach(f => f.remove());
    floaters = [];
    bookEls.forEach(e => e.remove());
    bookEls = new Map();
    lastAskId = lastCatchId = pondRound = null;
    ['pondLabelA', 'pondLabelB'].forEach(id => $(id)?.remove());
  },

  renderCenter(g, ctx) {
    $('watermark').textContent = '';
    const v = ctx.vmin;
    const cw = v * 6.4;
    const center = $('center');

    // The pond: up to 16 face-down cards drifting in a loose school.
    if (pondRound !== g.roundNo) {
      floaters.forEach(f => f.remove());
      floaters = [];
      pondRound = g.roundNo;
      lastAskId = g.lastAsk?.id ?? null;
      lastCatchId = g.lastCatch?.id ?? null;
    }
    const want = Math.min(g.pond.length, 16);
    while (floaters.length > want) {
      const f = floaters.pop();
      f.classList.add('sink');
      setTimeout(() => f.remove(), 700);
    }
    while (floaters.length < want) {
      const i = floaters.length;
      const ang = i * 2.39996; // golden-angle spiral keeps them spread out
      const r = Math.sqrt((i + 0.5) / 16);
      const f = document.createElement('div');
      f.className = 'floater';
      f.style.setProperty('--x', Math.cos(ang) * r * v * 24 + 'px');
      f.style.setProperty('--y', Math.sin(ang) * r * v * 14 + 'px');
      f.style.setProperty('--r', ((i * 47) % 360) + 'deg');
      f.style.setProperty('--d', (i % 5) * -0.9 + 's');
      const c = cardEl(null, true);
      c.style.setProperty('--cw', cw + 'px');
      f.appendChild(c);
      center.appendChild(f);
      floaters.push(f);
    }

    // "How many left in the pond", printed for both long sides.
    ['pondLabelA', 'pondLabelB'].forEach((id, i) => {
      const l = ensure(id, 'pot-label' + (i ? ' mirror-label' : ''));
      l.style.setProperty('--r', i ? '180deg' : '0deg');
      l.style.setProperty('--dy', v * 19 + 'px');
      l.textContent = g.phase === 'gameOver' ? '' : g.pond.length ? `${g.pond.length} in the pond` : 'The pond is empty';
    });

    // Asking: the question shows at the asker; handed-over cards slide across.
    if (g.lastAsk && g.lastAsk.id !== lastAskId) {
      lastAskId = g.lastAsk.id;
      const { from, to, rank, got } = g.lastAsk;
      ctx.bubble(from, `${ctx.nameOf(to)}, any ${F.rankPlural(rank)}?`);
      for (let k = 0; k < got; k++) {
        const b = cardEl(null, true);
        b.classList.add('gf-move');
        b.style.setProperty('--cw', cw + 'px');
        const a = ctx.inset(to, 14), z = ctx.inset(from, 14);
        b.style.transform = `translate(-50%, -50%) translate(${a.x}px, ${a.y}px) rotate(${ctx.rot(to)}deg)`;
        center.appendChild(b);
        setTimeout(() => {
          b.style.transform = `translate(-50%, -50%) translate(${z.x}px, ${z.y}px) rotate(${ctx.rot(from)}deg)`;
          b.style.opacity = '0';
          snap(0.25);
        }, 600 + k * 140);
        setTimeout(() => b.remove(), 1500 + k * 140);
      }
    }

    // A catch: the card comes up out of the water to whoever fished.
    if (g.lastCatch && g.lastCatch.id !== lastCatchId) {
      lastCatchId = g.lastCatch.id;
      const seat = g.lastCatch.seat;
      const reel = !!g.settings.motion;
      const sx = (Math.random() - 0.5) * v * 14, sy = (Math.random() - 0.5) * v * 8;
      const to = ctx.inset(seat, 14);
      const b = cardEl(null, true);
      b.classList.add('gf-catch');
      if (reel) b.classList.add('reel');
      b.style.setProperty('--cw', cw * 1.1 + 'px');
      b.style.transform = `translate(-50%, -50%) translate(${sx}px, ${sy}px) scale(.3)`;
      b.style.opacity = '0';
      center.appendChild(b);
      splash(sx, sy, reel);
      if (reel) {
        // Leaps out of the water on the line, hangs dripping for a beat, then swings to the player.
        setTimeout(() => {
          b.style.opacity = '1';
          b.style.transform = `translate(-50%, -50%) translate(${sx + (to.x - sx) * 0.15}px, ${sy + (to.y - sy) * 0.15 - v * 10}px) rotate(${ctx.rot(seat) - 16}deg) scale(1.35)`;
          snap(0.6);
        }, 60);
        setTimeout(() => {
          b.style.transform = `translate(-50%, -50%) translate(${to.x}px, ${to.y}px) rotate(${ctx.rot(seat)}deg) scale(.7)`;
          b.style.opacity = '0';
        }, 1250);
        setTimeout(() => b.remove(), 2100);
      } else {
        setTimeout(() => {
          b.style.opacity = '1';
          b.style.transform = `translate(-50%, -50%) translate(${to.x}px, ${to.y}px) rotate(${ctx.rot(seat)}deg) scale(.8)`;
          snap(0.3);
        }, 60);
        setTimeout(() => { b.style.opacity = '0'; }, 700);
        setTimeout(() => b.remove(), 1300);
      }
    }

    // Books: one face-up card per book, fanned in front of the player.
    g.seats.forEach((s, seat) => {
      let el = bookEls.get(seat);
      const books = s?.books || [];
      if (!books.length) { if (el) { el.remove(); bookEls.delete(seat); } return; }
      if (!el) {
        el = document.createElement('div');
        el.className = 'books';
        center.appendChild(el);
        bookEls.set(seat, el);
      }
      if (el.dataset.key !== books.join('')) {
        el.dataset.key = books.join('');
        el.innerHTML = '';
        books.forEach((r, i) => {
          const c = cardEl(r + 'SHDC'[i % 4]);
          c.style.setProperty('--cw', v * 5 + 'px');
          c.style.transform = `translateX(${(i - (books.length - 1) / 2) * v * 2.2}px) rotate(${(i - (books.length - 1) / 2) * 5}deg)`;
          el.appendChild(c);
        });
      }
      const pt = ctx.inset(seat, 31);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(seat)}deg)`;
    });
  },

  overlay(g, ctx) {
    if (g.phase !== 'gameOver') return null;
    const names = g.winners.map(ctx.nameOf);
    const rows = g.seats.map((s, i) => s?.active && { i, n: s.books.length }).filter(Boolean).sort((a, b) => b.n - a.n)
      .map(({ i, n }) => `<li><span>${ctx.nameOf(i)}</span><b>${n}</b></li>`).join('');
    return {
      key: 'over' + g.roundNo,
      html: `<h2>${names.length > 1 ? `${names.join(' & ')} tie` : `${names[0]} wins`}</h2>
        <p>${g.result.books} books${names.length > 1 ? ' each' : ''}</p><ol class="scores">${rows}</ol>
        <div class="buttons"><button class="big" data-do="next">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
      next: () => F.advance(g),
    };
  },
};
