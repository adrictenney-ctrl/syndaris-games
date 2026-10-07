// Go Fish on the table screen: the whole table is a pond. Face-down cards drift in the
// water; books sit in front of each player; caught cards come up out of the water.
import * as F from './gofish.js?v=55';
import { cardEl, snap } from './cards.js?v=55';

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

// ---------------------------------------------------------------- pond scenery

// Seeded random so the rocks don't jump around every time the screen resizes.
function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// A point `d` px along the screen's edge (clockwise from top-left), plus which edge.
function onEdge(d, W, H) {
  if (d < W) return { x: d, y: 0, nx: 0, ny: 1 };
  d -= W;
  if (d < H) return { x: W, y: d, nx: -1, ny: 0 };
  d -= H;
  if (d < W) return { x: W - d, y: H, nx: 0, ny: -1 };
  d -= W;
  return { x: 0, y: H - d, nx: 1, ny: 0 };
}

const ROCK_TONES = [
  ['#a59d8f', '#6f685d', '#3b3731'], // grey granite
  ['#a8977c', '#76654c', '#3e3426'], // sandstone
  ['#8f978a', '#5d6657', '#2f3530'], // mossy
  ['#b3aca0', '#827a6d', '#46413a'], // pale
];

function rock(x, y, w, h, rand) {
  const el = document.createElement('i');
  el.className = 'rock';
  const t = ROCK_TONES[Math.floor(rand() * ROCK_TONES.length)];
  const r = () => 38 + Math.round(rand() * 24);
  Object.assign(el.style, {
    left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px',
    borderRadius: `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`,
    rotate: Math.round(rand() * 360) + 'deg',
  });
  el.style.setProperty('--hi', t[0]);
  el.style.setProperty('--mid', t[1]);
  el.style.setProperty('--lo', t[2]);
  if (rand() < 0.3) el.classList.add('moss');
  return el;
}

// Koi: body, patches, fins and a tail that wags. Drawn facing right.
const KOI = [
  { body: '#f6f1e7', patch: '#e2462b', head: '#e2462b' },   // kohaku: white with red
  { body: '#f08a24', patch: '#f8c25c', head: '#f08a24' },   // orange ogon
  { body: '#f4efe4', patch: '#1c1a1d', head: '#e0502f' },   // tancho-ish with black
  { body: '#1f1d22', patch: '#e9b13a', head: '#1f1d22' },   // black and gold
  { body: '#fbf7ee', patch: '#f2b347', head: '#fbf7ee' },   // pale with gold
];
const koiSVG = k => `<svg viewBox="0 0 120 48" aria-hidden="true">
  <g class="tail"><path d="M24 24 C14 12 6 6 1 6 C6 14 10 20 14 24 C10 28 6 34 1 42 C6 42 14 36 24 24 Z" fill="${k.patch}" opacity=".9"/></g>
  <path d="M58 33 C56 42 48 46 43 45 C48 41 51 37 52 33 Z" fill="${k.body}" opacity=".85"/>
  <path d="M58 15 C56 6 48 2 43 3 C48 7 51 11 52 15 Z" fill="${k.body}" opacity=".85"/>
  <path d="M22 24 C32 12 64 8 96 12 C110 14 118 19 118 24 C118 29 110 34 96 36 C64 40 32 36 22 24 Z" fill="${k.body}"/>
  <path d="M60 11 C70 9 80 11 84 16 C78 22 66 22 58 18 Z" fill="${k.patch}"/>
  <path d="M38 30 C44 26 54 28 56 33 C50 36 42 35 38 30 Z" fill="${k.patch}"/>
  <path d="M100 13 C110 15 117 20 118 24 C117 28 110 33 100 35 C104 28 104 20 100 13 Z" fill="${k.head}"/>
  <circle cx="108" cy="20" r="1.6" fill="#141214"/><circle cx="108" cy="28" r="1.6" fill="#141214"/>
</svg>`;

// A smooth closed loop through a few random points in the open water.
function swimPath(rand, W, H, v) {
  const m = 16 * v;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + rand() * 0.8;
    return [W / 2 + Math.cos(a) * (W / 2 - m) * (0.55 + rand() * 0.45), H / 2 + Math.sin(a) * (H / 2 - m) * (0.55 + rand() * 0.45)];
  });
  if (rand() < 0.5) pts.reverse();
  // Catmull-Rom through the points, as cubic Béziers.
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

export default {
  defaults: { motion: false },

  // The pond's scenery: a rocky shore all the way round, lily pads, and koi swimming laps.
  decorate(el, W, H, v) {
    const key = `${Math.round(W)}x${Math.round(H)}`;
    if (el.dataset.key === key) return;
    el.dataset.key = key;
    el.innerHTML = '';
    const rand = seeded(20260930);

    // Koi first, so they swim under the lily pads and the rocks.
    const koiLayer = document.createElement('div');
    koiLayer.className = 'koi-layer';
    KOI.forEach((k, i) => {
      const f = document.createElement('div');
      f.className = 'koi';
      f.innerHTML = koiSVG(k);
      f.style.offsetPath = `path('${swimPath(rand, W, H, v)}')`;
      f.style.width = (10 + rand() * 4) * v + 'px';
      f.style.animationDuration = 34 + rand() * 22 + 's';
      f.style.animationDelay = -rand() * 40 + 's';
      f.querySelector('.tail').style.animationDuration = 0.5 + rand() * 0.35 + 's';
      koiLayer.appendChild(f);
    });
    el.appendChild(koiLayer);

    // Lily pads near the corners, where no one sits.
    [[0.09, 0.14, 11, 20], [0.9, 0.17, 8, 140], [0.1, 0.7, 8, 260, true], [0.17, 0.25, 5, 60], [0.86, 0.8, 7, 200]].forEach(([fx, fy, s, r, flower]) => {
      const p = document.createElement('i');
      p.className = 'pad';
      Object.assign(p.style, { left: fx * W + 'px', top: fy * H + 'px', width: s * v + 'px', rotate: r + 'deg' });
      if (flower) p.innerHTML = '<b></b>';
      el.appendChild(p);
    });

    // The shore: rocks of mixed sizes hugging every edge, bigger piles in the corners.
    const shore = document.createElement('div');
    shore.className = 'shore';
    const perim = 2 * (W + H);
    for (let d = 0; d < perim;) {
      const s = (4 + rand() * 4.5) * v;
      const p = onEdge(d, W, H);
      const inward = s * (0.05 + rand() * 0.15);
      shore.appendChild(rock(p.x + p.nx * inward, p.y + p.ny * inward, s * (1 + rand() * 0.5), s * (0.7 + rand() * 0.25), rand));
      d += s * (0.6 + rand() * 0.35);
    }
    [[0, 0], [W, 0], [W, H], [0, H]].forEach(([x, y]) => {
      for (let k = 0; k < 3; k++) {
        const s = (9 + rand() * 7) * v;
        const ox = (x ? -1 : 1) * rand() * 5 * v, oy = (y ? -1 : 1) * rand() * 5 * v;
        shore.appendChild(rock(x + ox, y + oy, s * 1.2, s * 0.85, rand));
      }
    });
    el.appendChild(shore);
  },

  settingsHTML: s => `<label><input type="checkbox" data-set="motion" ${s.motion ? 'checked' : ''}> Fishing motion (reel in with your phone)</label>`,

  // The little corner switch for the motion controls; works mid-game too.
  tool: {
    label: 'Fishing motion',
    hint: 'Reel in by pulling your phone back',
    on: s => !!s.motion,
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
    const cw = v * 6.4 * ctx.cardScale;
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

    floaters.forEach(f => f.firstChild.style.setProperty('--cw', cw + 'px'));

    // "How many left in the pond", printed for both long sides.
    ['pondLabelA', 'pondLabelB'].forEach((id, i) => {
      const l = ensure(id, 'pot-label' + (i ? ' mirror-label' : ''));
      l.style.setProperty('--r', i ? '180deg' : '0deg');
      l.style.setProperty('--dy', v * 19 * Math.max(1, ctx.cardScale * 0.9) + 'px');
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
      if (el.dataset.key !== books.join('') + ctx.cardScale) {
        el.dataset.key = books.join('') + ctx.cardScale;
        el.innerHTML = '';
        books.forEach((r, i) => {
          const c = cardEl(r + 'SHDC'[i % 4]);
          c.style.setProperty('--cw', v * 5 * ctx.cardScale + 'px');
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
