// Chef's Kiss deck picker: a card spring (25 Nov 2026).
//
// The decks sit in an arc of casino cards that springs out of a stack at the top, curves down the
// right side and lands in a pile at the bottom (like a card flourish). The card facing straight out,
// upper right, is the chosen deck; the cards around it turn away more the farther they are from it.
// Plain playing cards fill the rest of the arc, so it looks full even with only a few decks.
//
//   Drag     grab anywhere on the arc (the top stack, the bottom pile or any card) and drag along it
//   Wheel    scroll; Arrow keys move one deck; Home / End go to the first / last
//   Snap     letting go eases the nearest deck into the front; a quick flick carries on a few cards
//   Choose   the deck that lands in front is chosen (unless it's locked); tap it (or press Enter)
//            to choose it again; tap another deck to bring it round to the front
//
// Plug it in (table-chefskiss.js does this in the table lobby):
//   const spring = mountDeckSpring(el, { onSelect: deck => ... });
//   spring.update({ decks: [{ id, name, sub, icon, locked }], selected: 'base' });
// Add a deck: add it to the decks list; a new card appears in the arc. `icon` is an SVG string
//   (ICONS below has a few), `sub` a short line under the name, `locked` greys it out with a lock.
// Shape of the arc: ARC (one pose per card position; 0 is the front card).
// Card spacing: SPACING (above 1 spreads the cards out along the arc, below 1 bunches them up).
// Speed: SNAP (how firmly it snaps), FOLLOW and LAG (how fast each card catches up, and how much
//   later each card farther from the front moves), GLIDE (how far a flick carries).
// With "reduce motion" on, the cards jump straight to their places with a short fade and slide.
//
// Everything moves with transforms and opacity only.

// ---------------------------------------------------------------- the shape

// The arc, in a 1000-unit box at the reference photo's scale (x right, y down; the card's centre).
// Each row: [x, y, turn in the picture (deg), turn away (deg, about the card's own upright line;
// past 90 shows the back), lean back (deg, lying flat), size]. The first row is the far left of the
// top; position 0 is the front card; after the last row the cards land in the bottom pile.
export const ARC_FROM = -19;
export const ARC = [
  [300, 300, -34,   28,  0, .86],   // -19  face up, far left
  [330, 262, -28,   25,  0, .88],   // -18
  [352, 228, -22, -150,  0, .90],   // -17  red backs
  [378, 196, -15, -142,  0, .92],   // -16
  [404, 172,  -9, -134,  0, .94],   // -15
  [425, 158,  -4, -100,  0, .95],   // -14  the top stack, edge on
  [436, 154,  -2,  -96,  0, .95],   // -13
  [447, 151,  -1,  -94,  0, .95],   // -12
  [458, 149,   0,  -92,  0, .95],   // -11
  [469, 148,   0,  -90,  0, .95],   // -10
  [480, 147,   0,  -88,  0, .95],   //  -9
  [491, 147,   0,  -85,  0, .96],   //  -8
  [505, 148,   1,  -78,  0, .96],   //  -7  springing out, turned away
  [527, 152,   2,  -73,  0, .96],   //  -6
  [552, 160,   3,  -67,  0, .97],   //  -5
  [580, 172,   5,  -60,  0, .97],   //  -4
  [610, 190,   7,  -50,  0, .98],   //  -3
  [640, 213,   9,  -38,  0, .99],   //  -2
  [662, 246,  11,  -26,  0, .99],   //  -1
  [702, 322,  13,    0,  0, 1.22],  //   0  the front card: the chosen deck
  [752, 418,  30,    0, 24, .97],   //   1  down the right side, leaning back more and more
  [768, 487,  62,    0, 42, .92],   //   2
  [762, 570,  80,    0, 50, .90],   //   3
  [738, 646,  88,    0, 56, .88],   //   4
  [706, 702,  92,    0, 60, .87],   //   5
  [670, 744,  95,    0, 63, .86],   //   6
  [630, 777,  98,    0, 66, .85],   //   7
  [585, 800, 100,    0, 68, .85],   //   8
  [530, 815,  96,    0, 70, .85],   //   9
  [480, 826,  90,    0, 70, .85],   //  10
];
const PILE = ARC_FROM + ARC.length;   // 11: from here on the cards lie in the pile
const LAST = 16;                      // the last position drawn (deeper pile cards are hidden)
export const CARD = { w: 190, h: 266 };            // card size in the box (casino ratio 5:7)
const BOX = { x: 130, y: 0, w: 800, h: 940 };      // the part of the box the stage shows
const STACK = { x: 418, y: 26, w: 104, h: 246 };   // the top stack's block of card edges (covers positions -8 to -14)
const PILEBOX = { x: 330, y: 846, w: 280, h: 70 }; // the bottom pile's block of card edges
const CAPTION = { x: 470, y: 540 };                // the hint, in the hollow of the arc
export const SPACING = 1;

// The pose at any position along the arc (between rows it blends the two).
export function pose(p) {
  p *= SPACING;
  const row = i => (i < ARC.length ? ARC[Math.max(0, i)] : [470, 826 + (ARC_FROM + i - PILE) * 3, 90, 0, 70, .85]);
  const u = Math.max(0, p - ARC_FROM), i = Math.floor(u), f = u - i;
  const a = row(i), b = row(i + 1);
  return a.map((v, j) => v + (b[j] - v) * f);
}

// ---------------------------------------------------------------- the feel
const SNAP = 170;     // spring strength when snapping (higher = snappier)
const FOLLOW = 26;    // how fast a card catches up with its place (per second)
const LAG = .09;      // each position away from the front makes a card that much slower
const GLIDE = .2;     // a flick carries on for about this many seconds of its speed
const UP = 20, DOWN = 18;   // plain cards before and after the decks

// ---------------------------------------------------------------- the art
const SUIT = {
  s: '<path d="M50 6C33 28 6 42 6 62a20 20 0 0 0 38 9l-7 23h26l-7-23a20 20 0 0 0 38-9C94 42 67 28 50 6Z"/>',
  h: '<path d="M50 90C22 64 5 48 5 29A22 22 0 0 1 50 18a22 22 0 0 1 45 11c0 19-17 35-45 61Z"/>',
  d: '<path d="M50 3 88 50 50 97 12 50Z"/>',
  c: '<circle cx="50" cy="27" r="20"/><circle cx="27" cy="58" r="20"/><circle cx="73" cy="58" r="20"/><path d="M45 52h10l8 42H37Z"/>',
};
const suit = s => `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#cks-${s}"/></svg>`;
export const ICONS = {
  hat: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M27 60a17 17 0 0 1 3-33 20 20 0 0 1 40 0 17 17 0 0 1 3 33Z"/><path d="M30 64h40v15a5 5 0 0 1-5 5H35a5 5 0 0 1-5-5Z"/></svg>',
  plus: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M17 58a15 15 0 0 1 3-29 17 17 0 0 1 34 0 15 15 0 0 1 3 29Z"/><path d="M20 62h34v13a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4Z"/><circle cx="72" cy="66" r="19"/><path d="M72 56v20M62 66h20" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>',
  both: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M8 54a13 13 0 0 1 2-25 15 15 0 0 1 30 0 13 13 0 0 1 2 25Z" opacity=".55"/><path d="M10 58h30v12a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4Z" opacity=".55"/><path d="M42 62a16 16 0 0 1 3-31 19 19 0 0 1 37 0 16 16 0 0 1 3 31Z"/><path d="M45 66h37v14a5 5 0 0 1-5 5H50a5 5 0 0 1-5-5Z"/></svg>',
};
const LOCK = '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="22" y="44" width="56" height="44" rx="8"/><path d="M34 44V32a16 16 0 0 1 32 0v12" fill="none" stroke="currentColor" stroke-width="9"/></svg>';

// Where the pips sit on a plain card (x, y in %; the lower ones are drawn upside down).
const PIPS = {
  A: [[50, 50]],
  2: [[50, 20], [50, 80]],
  3: [[50, 20], [50, 50], [50, 80]],
  4: [[30, 20], [70, 20], [30, 80], [70, 80]],
  5: [[30, 20], [70, 20], [50, 50], [30, 80], [70, 80]],
  6: [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80], [70, 80]],
  7: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [30, 80], [70, 80]],
  8: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [50, 65], [30, 80], [70, 80]],
  9: [[30, 20], [70, 20], [30, 40], [70, 40], [50, 50], [30, 60], [70, 60], [30, 80], [70, 80]],
  10: [[30, 20], [70, 20], [50, 30], [30, 40], [70, 40], [30, 60], [70, 60], [50, 70], [30, 80], [70, 80]],
};
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// A steady "random" number from a card's place in the spring, so a card never changes as it moves.
const hash = (k, salt = 0) => { let x = (k + 1) * 2654435761 + salt * 40503; x ^= x >>> 15; x = Math.imul(x, 2246822519); x ^= x >>> 13; return (x >>> 0) / 4294967296; };

function plainFace(k) {
  const r = RANKS[Math.floor(hash(k) * 13)], s = 'shdc'[Math.floor(hash(k, 1) * 4)];
  const ix = `<b>${r}</b>${suit(s)}`;
  const mid = PIPS[r]
    ? `<div class="cks-pips${r === 'A' ? ' ace' : ''}">${PIPS[r].map(([x, y]) => `<i style="left:${x}%;top:${y}%"${y > 50 ? ' class="dn"' : ''}>${suit(s)}</i>`).join('')}</div>`
    : `<div class="cks-court"><b>${r}</b>${suit(s)}</div>`;
  return { red: s === 'h' || s === 'd', html: `<span class="cks-ix tl">${ix}</span><span class="cks-ix br">${ix}</span>${mid}` };
}
function deckFace(d) {
  const ix = ICONS.hat;
  return `<span class="cks-ix tl">${ix}</span><span class="cks-ix br">${ix}</span>
    <div class="cks-mid"><span class="cks-icon">${d.icon || ICONS.hat}</span><b>${esc(d.name)}</b>${d.sub ? `<small>${esc(d.sub)}</small>` : ''}</div>
    ${d.locked ? `<span class="cks-lock">${LOCK}</span>` : ''}`;
}

// ---------------------------------------------------------------- the picker
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let uid = 0;

export function mountDeckSpring(el, { onSelect = () => {}, onFront = () => {}, hint = 'Drag the cards to choose a deck' } = {}) {
  const id = 'cks' + (++uid);
  el.classList.add('cks');
  el.tabIndex = 0;
  el.setAttribute('role', 'listbox');
  el.setAttribute('aria-label', 'Choose a deck');
  el.innerHTML = `<svg class="cks-defs" aria-hidden="true"><defs>${Object.entries(SUIT).map(([k, d]) => `<symbol id="cks-${k}" viewBox="0 0 100 100">${d}</symbol>`).join('')}</defs></svg>
    <div class="cks-cards"><div class="cks-block cks-stack"></div><div class="cks-block cks-pileblock"></div></div>
    <p class="cks-cap"><span>${esc(hint)}</span><b aria-live="polite"></b></p>`;
  const wrap = el.querySelector('.cks-cards'), cap = el.querySelector('.cks-cap b');

  let decks = [], selected = null, cards = [], x = 0, v = 0, target = 0, k = 1;
  let drag = null, running = false, last = 0, settledAt = -1, intro = true;

  // ---- building the cards
  function build() {
    for (const c of cards) c.el.remove();
    cards = [];
    const n = decks.length;
    for (let s = 0; s < UP + n + DOWN; s++) {
      const di = s - UP, deck = di >= 0 && di < n ? decks[di] : null;
      const card = document.createElement('div');
      const plain = deck ? null : plainFace(s);
      card.className = 'cks-card' + (deck ? ' deck' + (deck.locked ? ' locked' : '') : '') + (plain?.red ? ' red' : '');
      card.innerHTML = `<div class="cks-face">${deck ? deckFace(deck) : plain.html}<i class="cks-shade"></i></div><div class="cks-back"><i class="cks-shade"></i></div>`;
      if (deck) {
        card.id = `${id}-${deck.id}`;
        card.setAttribute('role', 'option');
        card.setAttribute('aria-label', deck.name + (deck.locked ? ' (locked' + (deck.sub ? ': ' + deck.sub : '') + ')' : ''));
      } else card.setAttribute('aria-hidden', 'true');
      wrap.appendChild(card);
      const shades = card.querySelectorAll('.cks-shade');
      cards.push({ el: card, deck, di, s, p: null, z: null, jx: (hash(s, 2) - .5) * 60, jr: (hash(s, 3) - .5) * 26, shades, op: null });
    }
  }
  const sameDecks = list => list.length === decks.length && list.every((d, i) => ['id', 'name', 'sub', 'icon', 'locked'].every(f => d[f] === decks[i][f]));

  // ---- sizes
  function measure() {
    k = (el.clientWidth || 1) / BOX.w;
    el.style.setProperty('--dsw', CARD.w * k + 'px');
    el.style.setProperty('--dsh', CARD.h * k + 'px');
    const place = (node, r) => Object.assign(node.style, { left: (r.x - BOX.x) * k + 'px', top: (r.y - BOX.y) * k + 'px', width: r.w * k + 'px', height: r.h * k + 'px' });
    place(el.querySelector('.cks-stack'), STACK);
    place(el.querySelector('.cks-pileblock'), PILEBOX);
    Object.assign(el.querySelector('.cks-cap').style, { left: (CAPTION.x - BOX.x) * k + 'px', top: (CAPTION.y - BOX.y) * k + 'px' });
  }

  // ---- drawing one frame
  function draw(dt) {
    const rm = reduced();
    let moving = false, front = null;
    for (const c of cards) {
      const t = c.s - UP - x;   // where this card belongs (0 = front)
      if (c.p === null || rm) c.p = t;
      else {
        const rate = FOLLOW / (1 + Math.abs(t) * LAG);
        c.p += (t - c.p) * (1 - Math.exp(-rate * dt));
        if (Math.abs(t - c.p) > .0005) moving = true; else c.p = t;
      }
      const speed = rm || !dt ? 0 : Math.abs(t - c.p) * FOLLOW;   // positions per second, roughly
      const p = c.p;
      const op = p < ARC_FROM ? clamp(1 - (ARC_FROM - p), 0, 1) : p > LAST ? clamp(1 - (p - LAST), 0, 1) : 1;
      if (op !== c.op) { c.el.style.opacity = op === 1 ? '' : op; c.el.style.visibility = op ? '' : 'hidden'; c.op = op; }
      if (!op) continue;
      let [px, py, rz, ry, rx, sc] = pose(p);
      const pileness = clamp((p - PILE + 1) / 2, 0, 1);   // landed cards lie a little untidily
      px += c.jx * pileness; rz += c.jr * pileness;
      const stretch = 1 + Math.min(.07, speed * .006);    // a touch of stretch while moving fast
      c.el.style.transform = `translate3d(${(px - BOX.x) * k - CARD.w * k / 2}px, ${(py - BOX.y) * k - CARD.h * k / 2}px, 0) perspective(${1400 * k}px) rotateX(${rx}deg) rotateZ(${rz}deg) rotateY(${ry}deg) scale(${sc}) scaleY(${stretch})`;
      const z = p >= PILE ? Math.round(40 - p) : Math.round(100 - Math.abs(p) * 2);
      if (z !== c.z) { c.el.style.zIndex = z; c.z = z; }
      const shade = clamp(Math.abs(Math.sin(ry * Math.PI / 180)) * .5 + rx / 200, 0, .55);
      c.shades[0].style.opacity = c.shades[1].style.opacity = shade.toFixed(3);
      if (c.deck && Math.abs(p) < .5) front = c;
    }
    for (const c of cards) c.el.classList.toggle('is-front', c === front);
    if (front) {
      el.setAttribute('aria-activedescendant', front.el.id);
      cards.forEach(c => c.deck && c.el.setAttribute('aria-selected', String(c === front)));
    }
    return moving;
  }

  // ---- the snap spring and the loop
  function tick(now) {
    const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
    last = now;
    let springing = false;
    if (!drag) {
      if (reduced()) { x = target; v = 0; }
      else {
        const a = -SNAP * (x - target) - 2 * Math.sqrt(SNAP) * v;
        v += a * dt; x += v * dt;
        if (Math.abs(x - target) < .001 && Math.abs(v) < .01) { x = target; v = 0; } else springing = true;
      }
    }
    const moving = draw(dt);
    if (!drag && !springing && settledAt !== target) settle();
    if (drag || springing || moving) frame();
    else { running = false; last = 0; }
  }
  // The next frame; if the screen holds back animation frames (a hidden window), a timer stands in.
  function frame() {
    let done = false;
    const go = () => { if (!done) { done = true; tick(performance.now()); } };
    requestAnimationFrame(go);
    setTimeout(go, 120);
  }
  function run() { if (!running) { running = true; last = 0; frame(); } }

  // When it comes to rest: the front deck is chosen (a locked one is only shown).
  function settle() {
    settledAt = target;
    const d = decks[target];
    if (!d) return;
    cap.textContent = d.locked ? `${d.name}: locked${d.sub ? ' · ' + d.sub : ''}` : d.name;
    onFront(d);
    if (!d.locked && d.id !== selected && !intro) { selected = d.id; onSelect(d); }
    intro = false;
  }

  function go(i, fling = 0) {
    const n = decks.length;
    if (!n) return;
    target = clamp(Math.round(i), 0, n - 1);
    v += fling;
    if (reduced()) { wrap.classList.remove('cks-swap'); void wrap.offsetWidth; wrap.classList.add('cks-swap'); }
    run();
  }
  function confirm() {
    const d = decks[target];
    if (!d || d.locked) return;
    selected = d.id;
    onSelect(d);
    const f = cards.find(c => c.deck === d);
    if (f) { f.el.classList.remove('cks-pop'); void f.el.offsetWidth; f.el.classList.add('cks-pop'); }
  }

  // ---- dragging along the arc (mouse, pen and touch)
  // How far along the arc a pointer movement is: projected on the arc's direction at the card held.
  function along(p) {
    const a = pose(p - .5), b = pose(p + .5);
    let dx = (b[0] - a[0]) * k, dy = (b[1] - a[1]) * k;
    const len = Math.hypot(dx, dy), min = 55 * k;   // the stack is tightly packed: don't let it race
    if (len < min) { dx *= min / (len || 1); dy *= min / (len || 1); if (!len) { dx = 0; dy = min; } }
    return { dx, dy, l2: dx * dx + dy * dy };
  }
  el.addEventListener('pointerdown', e => {
    if (e.button > 0 || !decks.length) return;
    const card = e.target.closest('.cks-card');
    const zoom = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
    const c = card && cards.find(q => q.el === card);
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, s0: x, card: c, moved: false, dir: along(c ? c.p : 0), zoom, hist: [[performance.now(), x]] };
    v = 0;
    el.setPointerCapture?.(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id || !(drag.dir.l2 > 1)) return;   // (a stage with no size yet can't be dragged)
    const mx = (e.clientX - drag.x0) / drag.zoom, my = (e.clientY - drag.y0) / drag.zoom;
    if (!drag.moved && Math.hypot(mx, my) < 6) return;
    if (!drag.moved) { drag.moved = true; el.classList.add('cks-dragging'); run(); }
    const n = decks.length;
    let raw = drag.s0 - (mx * drag.dir.dx + my * drag.dir.dy) / drag.dir.l2;   // dragging down the arc moves the cards down it
    if (raw < 0) raw *= .35; else if (raw > n - 1) raw = n - 1 + (raw - n + 1) * .35;   // a soft stop at each end
    x = raw;
    const now = performance.now();
    drag.hist.push([now, x]);
    while (drag.hist.length > 2 && now - drag.hist[0][0] > 90) drag.hist.shift();
  });
  const release = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    el.classList.remove('cks-dragging');
    if (!d.moved) {   // a tap
      const c = d.card;
      if (c?.deck) { if (c.di === target && settledAt === target) confirm(); else go(c.di); }
      else if (c) go(target + Math.sign(c.p || 1));
      return;
    }
    const [t0, x0] = d.hist[0], [t1, x1] = d.hist[d.hist.length - 1];
    const vel = t1 > t0 ? (x1 - x0) / ((t1 - t0) / 1000) : 0;   // decks per second
    v = reduced() ? 0 : clamp(vel, -40, 40);
    go(x + v * GLIDE);
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  // ---- the wheel and the keys
  let wheel = 0, wheelAt = 0;
  el.addEventListener('wheel', e => {
    if (!decks.length) return;
    e.preventDefault();
    const now = performance.now();
    if (now - wheelAt > 250) wheel = 0;
    wheelAt = now;
    wheel += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(wheel) >= 40) { go(target + Math.sign(wheel)); wheel = 0; }
  }, { passive: false });
  el.addEventListener('keydown', e => {
    const n = decks.length;
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (step) {
      // At either end the key moves on to the next control (TV remotes need that).
      if (target + step < 0 || target + step > n - 1) return;
      e.preventDefault(); go(target + step);
    } else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); go(e.key === 'Home' ? 0 : n - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); confirm(); }
  });

  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { measure(); draw(0); }).observe(el);

  return {
    // New decks or a choice made somewhere else; the same list again changes nothing.
    update({ decks: list = decks, selected: sel = selected } = {}) {
      const fresh = !sameDecks(list);
      if (fresh) { decks = list.map(d => ({ ...d })); build(); }
      const i = Math.max(0, decks.findIndex(d => d.id === sel));
      const outside = sel !== selected;
      selected = sel;
      measure();
      if (fresh && intro) {
        // The first time: the cards spring down out of the top stack into place.
        target = i; settledAt = i;
        x = reduced() ? i : i + 6;
        cards.forEach(c => { c.p = c.s - UP - x; });
        cap.textContent = decks[i]?.name || '';
        intro = false;
        draw(0);
        run();
      } else if (outside || fresh) { if (decks[target]?.id !== sel) go(i); else { draw(0); } }
      else draw(0);
    },
    get front() { return decks[target] || null; },
    get state() { return { x, v, target, running, drag: !!drag }; },
    go,
  };
}
