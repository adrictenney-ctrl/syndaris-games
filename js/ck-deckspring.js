// Chef's Kiss deck picker: a card spring (25 Nov 2026, redrawn from the reference photo).
//
// The decks sit in an arc of casino cards that springs out of a stack at the top, curves down the
// right side and lands in a pile at the bottom. Every card's place is taken straight from the
// reference photo: the four corners of each card in the photo (SLOTS below), and each card is drawn
// onto its four corners with a perspective transform (matrix3d), so the arc, the angles, the
// foreshortening and the overlaps match the photo. The card facing out, upper right, is the chosen
// deck; plain playing cards fill the rest, so at rest the picture is the photo with the decks in it.
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
// Add a deck: add it to the decks list; a new card appears in the arc.
// Shape of the arc: SLOTS (one card's four corners per place, in the photo's pixels; FRONT is the
//   chosen deck's place). Moving between two places, a card turns and slides from one to the other.
// Speed: SNAP (how firmly it snaps), FOLLOW and LAG (how fast each card catches up, and how much
//   later each card farther from the front moves), GLIDE (how far a flick carries).
// With "reduce motion" on, the cards jump straight to their places with a short fade and slide.
// Everything moves with transforms and opacity only.

// ---------------------------------------------------------------- the shape (from the photo)

// Each place: the card's corners [top-left, top-right, bottom-right, bottom-left] (x, y in the
// 2000 x 2000 reference photo; top-left is the corner with the upright index), how high it sits (z),
// the card the photo has there, whether its back shows, how much it's in shade, and whether only its
// white edge shows (in the top stack).
const S = (q, z, card, back = 0, shade = 0, edge = 0) => ({ q, z, card, back, shade, edge });
const STACKED = ['Qs', '2h', '6c', '4d', '9s', '3c', '7d', '6s'];
const stack = i => { const x = 838 + i * 22, b = v => 505 + (v - 828) * .47; return S([x, 171, x + 12, 169, x + 12, b(x + 12), x, b(x)], 6 + i, STACKED[i], 0, .25, 1); };
export const SLOTS = [
  S([402, 515, 644, 408, 854, 665, 612, 772], 1, '8d', 0, .04),       //  0  far left, face up
  S([470, 452, 712, 345, 852, 642, 610, 750], 2, '10s', 0, .02),      //  1
  S([570, 335, 800, 250, 950, 565, 725, 660], 3, 'Kh', 1),            //  2  red backs
  S([630, 280, 860, 200, 990, 520, 760, 610], 4, '7c', 1),            //  3
  S([712, 207, 902, 250, 985, 590, 762, 558], 5, '9d', 1),            //  4
  stack(0), stack(1), stack(2), stack(3), stack(4), stack(5), stack(6), stack(7),   // 5-12  the top stack, edge on
  S([1011, 145, 1072, 152, 1060, 508, 1003, 495], 14, 'Ah', 0, .16),  // 13  springing out, turned away
  S([1040, 160, 1108, 175, 1088, 528, 1022, 500], 15, 'Js', 0, .14),  // 14
  S([1082, 175, 1150, 200, 1112, 555, 1050, 530], 16, '5s', 0, .12),  // 15
  S([1152, 205, 1222, 228, 1170, 590, 1110, 565], 17, 'Js', 0, .1),   // 16
  S([1190, 222, 1305, 280, 1215, 640, 1150, 592], 18, 'Qd', 0, .06),  // 17
  S([1295, 285, 1500, 380, 1355, 688, 1150, 593], 19, '5h', 0, .03),  // 18
  S([1470, 403, 1667, 580, 1363, 860, 1173, 637], 30, 'Jc'),          // 19  FRONT: the chosen deck
  S([1722, 779, 1719, 854, 1350, 967, 1306, 800], 29, '3h', 0, .1),   // 20  down the right side, lying back
  S([1737, 954, 1716, 1061, 1356, 1132, 1384, 957], 28, '5d', 0, .12),
  S([1734, 1120, 1700, 1252, 1323, 1270, 1358, 1137], 27, '5d', 0, .13),
  S([1720, 1263, 1667, 1363, 1303, 1370, 1340, 1270], 26, '8s', 0, .14),
  S([1667, 1390, 1577, 1480, 1250, 1433, 1300, 1375], 25, '8c', 0, .15),
  S([1660, 1478, 1550, 1523, 1193, 1507, 1240, 1440], 24, '5h', 0, .16),
  S([1640, 1505, 1543, 1573, 1170, 1547, 1230, 1470], 23, '3h', 0, .17),
  S([1605, 1545, 1587, 1607, 1150, 1580, 1195, 1515], 22, '3h', 0, .18),
  S([1555, 1625, 1510, 1680, 1100, 1662, 1140, 1600], 21, '5d', 0, .18), // 28
  S([1490, 1612, 1452, 1690, 1150, 1668, 1190, 1592], 20, '5d', 0, .12), // 29  landing on the pile
  S([1340, 1660, 1125, 1735, 960, 1650, 1170, 1590], 12, '8c', 0, .1),   // 30
  S([1140, 1700, 1060, 1745, 840, 1715, 910, 1660], 11, '4s', 0, .12),   // 31
  S([1030, 1690, 1000, 1738, 800, 1718, 830, 1665], 10, '8h', 0, .14),   // 32
  S([969, 1515, 1131, 1545, 893, 1670, 731, 1640], 13, 'Kd', 0, .04),    // 33
  S([845, 1495, 1025, 1570, 655, 1665, 475, 1590], 14, 'Jc', 0, .02),    // 34  the top of the pile
];
export const FRONT = 19;
const LASTSLOT = SLOTS.length - 1;
const BOX = { x: 380, y: 120, w: 1420, h: 1780 };   // the part of the photo the stage shows
export const ASPECT = BOX.w / BOX.h;
// The top stack's and the bottom pile's blocks of card edges (outlines in the photo).
const STACK_BLOCK = [[826, 172], [1010, 164], [1010, 594], [826, 508]];
const PILE_BLOCK = [[628, 1698], [1352, 1700], [1352, 1834], [1218, 1878], [646, 1872]];
const CAPTION = { x: 1010, y: 1090 };   // the hint, in the hollow of the arc
const CW = 250, CH = 350;               // a card's own size before it's put on its corners

const mid = q => [(q[0] + q[2] + q[4] + q[6]) / 4, (q[1] + q[3] + q[5] + q[7]) / 4];
// The corners at any place along the arc. Between two places a card turns and slides: each corner
// keeps its distance and angle from the card's middle, blended, so it doesn't shrink as it turns.
export function quadAt(p) {
  const P = Math.max(0, Math.min(LASTSLOT, p)), i = Math.min(LASTSLOT - 1, Math.floor(P)), f = P - i;
  const a = SLOTS[i].q, b = SLOTS[i + 1].q;
  if (f <= 0) return a.slice();
  if (f >= 1) return b.slice();
  const [ax, ay] = mid(a), [bx, by] = mid(b), cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f;
  const out = [];
  for (let c = 0; c < 4; c++) {
    const ra = Math.hypot(a[c * 2] - ax, a[c * 2 + 1] - ay), rb = Math.hypot(b[c * 2] - bx, b[c * 2 + 1] - by);
    const ta = Math.atan2(a[c * 2 + 1] - ay, a[c * 2] - ax), tb = Math.atan2(b[c * 2 + 1] - by, b[c * 2] - bx);
    let d = tb - ta; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const r = ra + (rb - ra) * f, t = ta + d * f;
    out.push(cx + r * Math.cos(t), cy + r * Math.sin(t));
  }
  return out;
}
const lerpSlot = (p, key) => { const P = Math.max(0, Math.min(LASTSLOT, p)), i = Math.min(LASTSLOT - 1, Math.floor(P)), f = P - i; return SLOTS[i][key] + (SLOTS[i + 1][key] - SLOTS[i][key]) * f; };
export const centreAt = p => mid(quadAt(p));

// The perspective transform that puts a W x H box onto four corners (Heckbert's square to quad).
export function quadMatrix(q, W = CW, H = CH) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  let a, b, d, e, g = 0, h = 0;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) { a = x1 - x0; b = x3 - x0; d = y1 - y0; e = y3 - y0; }
  else {
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den;
    a = x1 - x0 + g * x1; b = x3 - x0 + h * x3; d = y1 - y0 + g * y1; e = y3 - y0 + h * y3;
  }
  return [a / W, d / W, 0, g / W, b / H, e / H, 0, h / H, 0, 0, 1, 0, x0, y0, 0, 1];
}

// ---------------------------------------------------------------- the feel
const SNAP = 150;     // spring strength when snapping (higher = snappier)
const FOLLOW = 22;    // how fast a card catches up with its place (per second)
const LAG = .07;      // each place away from the front makes a card that much slower
const GLIDE = .2;     // a flick carries on for about this many seconds of its speed

// ---------------------------------------------------------------- the art
const SUIT = {
  s: '<path d="M50 4C34 26 6 40 6 61a20 20 0 0 0 37 10c-1 9-4 16-10 24h34c-6-8-9-15-10-24a20 20 0 0 0 37-10C94 40 66 26 50 4Z"/>',
  h: '<path d="M50 92C24 68 4 52 4 31A23 23 0 0 1 50 21a23 23 0 0 1 46 10c0 21-20 37-46 61Z"/>',
  d: '<path d="M50 2C62 20 74 36 90 50 74 64 62 80 50 98 38 80 26 64 10 50 26 36 38 20 50 2Z"/>',
  c: '<circle cx="50" cy="27" r="20"/><circle cx="26" cy="57" r="20"/><circle cx="74" cy="57" r="20"/><path d="M46 50h8c0 18 3 30 12 44H34c9-14 12-26 12-44Z"/>',
};
const suit = (s, cls = '') => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><use href="#cks-${s}"/></svg>`;
export const ICONS = {
  hat: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M27 60a17 17 0 0 1 3-33 20 20 0 0 1 40 0 17 17 0 0 1 3 33Z"/><path d="M30 64h40v15a5 5 0 0 1-5 5H35a5 5 0 0 1-5-5Z"/></svg>',
  plus: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M17 58a15 15 0 0 1 3-29 17 17 0 0 1 34 0 15 15 0 0 1 3 29Z"/><path d="M20 62h34v13a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4Z"/><circle cx="72" cy="66" r="19"/><path d="M72 56v20M62 66h20" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>',
  both: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M8 54a13 13 0 0 1 2-25 15 15 0 0 1 30 0 13 13 0 0 1 2 25Z" opacity=".55"/><path d="M10 58h30v12a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4Z" opacity=".55"/><path d="M42 62a16 16 0 0 1 3-31 19 19 0 0 1 37 0 16 16 0 0 1 3 31Z"/><path d="M45 66h37v14a5 5 0 0 1-5 5H50a5 5 0 0 1-5-5Z"/></svg>',
};
const LOCK = '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="22" y="44" width="56" height="44" rx="8"/><path d="M34 44V32a16 16 0 0 1 32 0v12" fill="none" stroke="currentColor" stroke-width="9"/></svg>';

// The shared drawings: suits, the red card back, and half a court figure (drawn twice, head to head).
const DEFS = `${Object.entries(SUIT).map(([k, d]) => `<symbol id="cks-${k}" viewBox="0 0 100 100">${d}</symbol>`).join('')}
  <pattern id="cks-lattice" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="12" height="12" fill="#c3141d"/><path d="M0 6h12M6 0v12" stroke="#f7d9d4" stroke-width="1"/><circle cx="6" cy="6" r="2" fill="none" stroke="#f7d9d4" stroke-width=".8"/>
  </pattern>
  <symbol id="cks-back" viewBox="0 0 250 350">
    <rect x="13" y="13" width="224" height="324" rx="6" fill="url(#cks-lattice)"/>
    <rect x="19" y="19" width="212" height="312" rx="4" fill="none" stroke="#f7d9d4" stroke-width="2"/>
    <rect x="25" y="25" width="200" height="300" rx="3" fill="none" stroke="#a80f17" stroke-width="2"/>
    <g fill="#c3141d" stroke="#f7d9d4" stroke-width="2.2"><ellipse cx="125" cy="175" rx="44" ry="58"/><ellipse cx="125" cy="175" rx="28" ry="38"/></g>
    <g fill="none" stroke="#f7d9d4" stroke-width="2"><path d="M125 117c-10-22-34-28-52-20M125 117c10-22 34-28 52-20M125 233c-10 22-34 28-52 20M125 233c10 22 34 28 52 20"/><path d="M60 60c14 10 20 24 18 40M190 60c-14 10-20 24-18 40M60 290c14-10 20-24 18-40M190 290c-14-10-20-24-18-40"/></g>
    <circle cx="125" cy="175" r="9" fill="#f7d9d4"/>
  </symbol>
  <symbol id="cks-court" viewBox="0 0 170 128">
    <rect width="170" height="128" fill="#fbf3dc"/>
    <path d="M0 128V66c10-6 18-8 26-8l12 70Z" fill="#c8202c"/><path d="M0 92l30-6M0 108l34-7" stroke="#f2c230" stroke-width="4"/>
    <path d="M170 128V66c-10-6-18-8-26-8l-12 70Z" fill="#1f3f9a"/><path d="M170 92l-30-6M170 108l-34-7" stroke="#f2c230" stroke-width="4"/>
    <path d="M26 58c18-5 38-8 59-8s41 3 59 8l-12 70H38Z" fill="#f2c230"/>
    <path d="M38 128l-6-52c16-5 34-8 53-8s37 3 53 8l-6 52Z" fill="#c8202c"/>
    <path d="M52 128l-4-44c12-4 24-6 37-6s25 2 37 6l-4 44Z" fill="#1b1b1b"/>
    <path d="M58 128l-3-40c10-3 20-4 30-4s20 1 30 4l-3 40Z" fill="#f2c230"/>
    <g fill="#1f3f9a"><path d="M62 128l-2-34h12l1 34Z"/><path d="M108 128l2-34H98l-1 34Z"/></g>
    <path d="M76 128l-1-38h20l-1 38Z" fill="#c8202c"/>
    <g fill="#fff" stroke="#1f3f9a" stroke-width="1.2"><circle cx="66" cy="100" r="2.6"/><circle cx="66" cy="112" r="2.6"/><circle cx="66" cy="124" r="2.6"/><circle cx="104" cy="100" r="2.6"/><circle cx="104" cy="112" r="2.6"/><circle cx="104" cy="124" r="2.6"/></g>
    <g fill="none" stroke="#1b1b1b" stroke-width="1.3"><path d="M26 58l12 70M144 58l-12 70M32 76c16-5 34-8 53-8s37 3 53 8M48 84c12-4 24-6 37-6s25 2 37 6"/><path d="M40 70l4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6"/></g>
    <path d="M60 58c6-6 15-9 25-9s19 3 25 9c-6 6-15 8-25 8s-19-2-25-8Z" fill="#fff" stroke="#1b1b1b" stroke-width="1.3"/>
    <g fill="#1f3f9a"><circle cx="70" cy="57" r="1.8"/><circle cx="78" cy="59" r="1.8"/><circle cx="86" cy="59" r="1.8"/><circle cx="94" cy="58" r="1.8"/><circle cx="101" cy="56" r="1.8"/></g>
    <path d="M64 38c-6 2-9 8-8 15 4-3 7-4 10-4M106 38c6 2 9 8 8 15-4-3-7-4-10-4" fill="#f2c230" stroke="#1b1b1b" stroke-width="1.2"/>
    <path d="M66 32c0-11 8-18 19-18s19 7 19 18v8c0 8-8 14-19 14s-19-6-19-14Z" fill="#f7e5cc" stroke="#1b1b1b" stroke-width="1.4"/>
    <path d="M72 33c2-2 6-2 8 0M90 33c2-2 6-2 8 0M85 34v8l-3 2M79 47c4 2 8 2 12 0" fill="none" stroke="#1b1b1b" stroke-width="1.3"/>
    <circle cx="76" cy="36" r="1.4" fill="#1f3f9a"/><circle cx="94" cy="36" r="1.4" fill="#1f3f9a"/>
    <path d="M64 24l5-16 8 9 8-12 8 12 8-9 5 16Z" fill="#f2c230" stroke="#1b1b1b" stroke-width="1.3"/>
    <path d="M64 24h42v5H64Z" fill="#c8202c" stroke="#1b1b1b" stroke-width="1.2"/>
    <g fill="#1f3f9a"><circle cx="72" cy="26.5" r="1.6"/><circle cx="85" cy="26.5" r="1.6"/><circle cx="98" cy="26.5" r="1.6"/></g>
    <circle cx="85" cy="6" r="2.4" fill="#c8202c" stroke="#1b1b1b" stroke-width="1"/>
    <path d="M118 70c6-10 12-22 14-34" stroke="#1b1b1b" stroke-width="2.4" fill="none"/><path d="M128 34c4-4 10-4 12 0-2 4-8 6-12 0Z" fill="#c8202c" stroke="#1b1b1b" stroke-width="1"/>
  </symbol>`;

const RANKS = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 };
// Where the pips sit on a number card (x, y in %; the lower ones are drawn upside down).
const PIPS = {
  1: [[50, 50]], 2: [[50, 22], [50, 78]], 3: [[50, 22], [50, 50], [50, 78]],
  4: [[31, 22], [69, 22], [31, 78], [69, 78]], 5: [[31, 22], [69, 22], [50, 50], [31, 78], [69, 78]],
  6: [[31, 22], [69, 22], [31, 50], [69, 50], [31, 78], [69, 78]],
  7: [[31, 22], [69, 22], [50, 36], [31, 50], [69, 50], [31, 78], [69, 78]],
  8: [[31, 22], [69, 22], [50, 36], [31, 50], [69, 50], [50, 64], [31, 78], [69, 78]],
  9: [[31, 22], [69, 22], [31, 41], [69, 41], [50, 50], [31, 59], [69, 59], [31, 78], [69, 78]],
  10: [[31, 22], [69, 22], [50, 32], [31, 41], [69, 41], [31, 59], [69, 59], [50, 68], [31, 78], [69, 78]],
};
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ALL = Object.keys(RANKS).flatMap(r => ['s', 'h', 'd', 'c'].map(s => r + s));
const hash = (k, salt = 0) => { let x = (k + 1) * 2654435761 + salt * 40503; x ^= x >>> 15; x = Math.imul(x, 2246822519); x ^= x >>> 13; return (x >>> 0) / 4294967296; };

// A playing card's face, '8d', '10s', 'Jc' and so on.
export function playingFace(id) {
  const r = id.slice(0, -1), s = id.slice(-1), n = RANKS[r], red = s === 'h' || s === 'd';
  const ix = `<b>${r}</b>${suit(s)}`;
  let mid;
  if (n <= 10) mid = `<div class="cks-pips${n === 1 ? ' ace' : ''}">${PIPS[n].map(([x, y]) => `<i style="left:${x}%;top:${y}%"${y > 50 ? ' class="dn"' : ''}>${suit(s)}</i>`).join('')}</div>`;
  else mid = `<div class="cks-court r${r}"><svg viewBox="0 0 170 256" preserveAspectRatio="none" aria-hidden="true"><use href="#cks-court" width="170" height="128"/><use href="#cks-court" width="170" height="128" transform="rotate(180 85 128)"/></svg>${suit(s, 'cks-cpip')}${suit(s, 'cks-cpip dn')}</div>`;
  return { red, html: `<span class="cks-ix tl">${ix}</span><span class="cks-ix br">${ix}</span>${mid}` };
}
function deckFace(d) {
  return `<span class="cks-ix tl">${ICONS.hat}</span><span class="cks-ix br">${ICONS.hat}</span>
    <div class="cks-dframe"><span class="cks-icon">${d.icon || ICONS.hat}</span><b>${esc(d.name)}</b>${d.sub ? `<small>${esc(d.sub)}</small>` : ''}</div>
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
  const poly = pts => pts.map(([x, y]) => `${x - BOX.x},${y - BOX.y}`).join(' ');
  el.innerHTML = `<svg class="cks-defs" aria-hidden="true"><defs>${DEFS}</defs></svg>
    <div class="cks-cards">
      <svg class="cks-blocks" viewBox="0 0 ${BOX.w} ${BOX.h}" aria-hidden="true">
        <defs>
          <pattern id="${id}-vl" width="5.5" height="10" patternUnits="userSpaceOnUse"><rect width="5.5" height="10" fill="#f1f1f4"/><rect width="1.5" height="10" fill="#77768a"/></pattern>
          <pattern id="${id}-hl" width="10" height="5" patternUnits="userSpaceOnUse"><rect width="10" height="5" fill="#efeff2"/><rect width="10" height="1.5" fill="#6f6e80"/></pattern>
          <linearGradient id="${id}-vs" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a1430" stop-opacity=".45"/></linearGradient>
          <linearGradient id="${id}-hs" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#1a1430" stop-opacity=".35"/><stop offset=".3" stop-color="#fff" stop-opacity=".1"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a1430" stop-opacity=".4"/></linearGradient>
          <filter id="${id}-soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
        </defs>
        <ellipse cx="${990 - BOX.x}" cy="${1888 - BOX.y}" rx="420" ry="30" fill="#0a0630" opacity=".4" filter="url(#${id}-soft)"/>
        <polygon points="${poly(STACK_BLOCK)}" fill="url(#${id}-vl)"/><polygon points="${poly(STACK_BLOCK)}" fill="url(#${id}-vs)"/>
        <polygon points="${poly(PILE_BLOCK)}" fill="url(#${id}-hl)"/><polygon points="${poly(PILE_BLOCK)}" fill="url(#${id}-hs)"/>
      </svg>
    </div>
    <p class="cks-cap"><span>${esc(hint)}</span><b aria-live="polite"></b></p>`;
  const wrap = el.querySelector('.cks-cards'), cap = el.querySelector('.cks-cap b');

  let decks = [], selected = null, cards = [], x = 0, v = 0, target = 0, k = 1;
  let drag = null, running = false, last = 0, settledAt = -1;
  const UP = FRONT + 1;   // plain cards before the first deck (one spare, off the far left)

  // ---- building the cards: plain cards up to the front, the decks, then plain cards to the pile.
  // At rest with the first deck in front, every plain card is the one the photo has in its place.
  function build() {
    for (const c of cards) c.el.remove();
    cards = [];
    const n = decks.length, total = UP + n + (LASTSLOT - FRONT) + 1;
    for (let s = 0; s < total; s++) {
      const di = s - UP, deck = di >= 0 && di < n ? decks[di] : null;
      const slot = FRONT + (s - UP);
      const plain = deck ? null : playingFace(SLOTS[slot]?.card || ALL[Math.floor(hash(s) * ALL.length)]);
      const card = document.createElement('div');
      card.className = 'cks-card' + (deck ? ' deck' + (deck.locked ? ' locked' : '') : '') + (plain?.red ? ' red' : '');
      card.innerHTML = `<div class="cks-face">${deck ? deckFace(deck) : plain.html}</div><div class="cks-back"><svg viewBox="0 0 250 350" aria-hidden="true"><use href="#cks-back"/></svg></div><i class="cks-edge"></i><i class="cks-shade"></i>`;
      if (deck) {
        card.id = `${id}-${deck.id}`;
        card.setAttribute('role', 'option');
        card.setAttribute('aria-label', deck.name + (deck.locked ? ' (locked' + (deck.sub ? ': ' + deck.sub : '') + ')' : ''));
      } else card.setAttribute('aria-hidden', 'true');
      wrap.appendChild(card);
      cards.push({ el: card, deck, di, s, p: null, z: null, op: null, bk: null, sh: null, ed: null, back: card.querySelector('.cks-back'), edge: card.querySelector('.cks-edge'), shade: card.querySelector('.cks-shade') });
    }
  }
  const sameDecks = list => list.length === decks.length && list.every((d, i) => ['id', 'name', 'sub', 'icon', 'locked'].every(f => d[f] === decks[i][f]));

  function measure() {
    k = (el.clientWidth || 1) / BOX.w;
    Object.assign(el.querySelector('.cks-cap').style, { left: (CAPTION.x - BOX.x) * k + 'px', top: (CAPTION.y - BOX.y) * k + 'px' });
  }

  // ---- drawing one frame
  function draw(dt) {
    const rm = reduced();
    let moving = false, front = null;
    for (const c of cards) {
      const t = FRONT + (c.s - UP) - x;   // the place this card belongs (FRONT = the chosen deck's)
      if (c.p === null || rm) c.p = t;
      else if (dt) {
        const rate = FOLLOW / (1 + Math.abs(t - FRONT) * LAG);
        c.p += (t - c.p) * (1 - Math.exp(-rate * dt));
        if (Math.abs(t - c.p) > .0005) moving = true; else c.p = t;
      }
      const p = c.p;
      const op = p < 0 ? clamp(1 + p, 0, 1) : p > LASTSLOT ? clamp(1 - (p - LASTSLOT), 0, 1) : 1;
      if (op !== c.op) { c.el.style.opacity = op === 1 ? '' : op; c.el.style.visibility = op ? '' : 'hidden'; c.op = op; }
      if (!op) continue;
      const q = quadAt(p).map((n, i) => (n - (i % 2 ? BOX.y : BOX.x)) * k);
      c.el.style.transform = `matrix3d(${quadMatrix(q).map(n => +n.toFixed(6)).join(',')})`;
      const z = Math.round(lerpSlot(p, 'z') * 4);
      if (z !== c.z) { c.el.style.zIndex = z; c.z = z; }
      const bk = +clamp((lerpSlot(p, 'back') - .3) / .4, 0, 1).toFixed(3);
      if (bk !== c.bk) { c.back.style.opacity = bk; c.bk = bk; }
      const ed = +clamp((lerpSlot(p, 'edge') - .2) / .6, 0, 1).toFixed(3);
      if (ed !== c.ed) { c.edge.style.opacity = ed; c.ed = ed; }
      const sh = +lerpSlot(p, 'shade').toFixed(3);
      if (sh !== c.sh) { c.shade.style.opacity = sh; c.sh = sh; }
      if (c.deck && Math.abs(p - FRONT) < .5) front = c;
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
    if (!d.locked && d.id !== selected) { selected = d.id; onSelect(d); }
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
  // The cards follow the hand: drag up the arc (toward the top stack) and the next deck comes up out
  // of the pile to the front; drag down it and the deck before comes back down out of the stack.
  function along(p) {
    const a = centreAt(p - .5), b = centreAt(p + .5);
    let dx = (a[0] - b[0]) * k, dy = (a[1] - b[1]) * k;
    const len = Math.hypot(dx, dy), min = 70 * k;   // the stack is tightly packed: don't let it race
    if (len < min) { if (!len) { dx = 0; dy = -min; } else { dx *= min / len; dy *= min / len; } }
    return { dx, dy, l2: dx * dx + dy * dy };
  }
  el.addEventListener('pointerdown', e => {
    if (e.button > 0 || !decks.length) return;
    const card = e.target.closest('.cks-card');
    const zoom = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
    const c = card && cards.find(q => q.el === card);
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, s0: x, card: c, moved: false, dir: along(c ? c.p : FRONT), zoom, hist: [[performance.now(), x]] };
    v = 0;
    el.setPointerCapture?.(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id || !(drag.dir.l2 > 1)) return;   // (a stage with no size yet can't be dragged)
    const mx = (e.clientX - drag.x0) / drag.zoom, my = (e.clientY - drag.y0) / drag.zoom;
    if (!drag.moved && Math.hypot(mx, my) < 6) return;
    if (!drag.moved) { drag.moved = true; el.classList.add('cks-dragging'); run(); }
    const n = decks.length;
    let raw = drag.s0 + (mx * drag.dir.dx + my * drag.dir.dy) / drag.dir.l2;
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
      else if (c) go(target + (c.p > FRONT ? 1 : -1));
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

  let first = true;
  return {
    // New decks or a choice made somewhere else; the same list again changes nothing.
    update({ decks: list = decks, selected: sel = selected } = {}) {
      const fresh = !sameDecks(list);
      if (fresh) { decks = list.map(d => ({ ...d })); build(); }
      const i = Math.max(0, decks.findIndex(d => d.id === sel));
      const outside = sel !== selected;
      selected = sel;
      measure();
      if (first) {
        // The first time: the cards spring down out of the top stack into place.
        first = false;
        target = i; settledAt = i;
        x = reduced() ? i : i + 7;
        cards.forEach(c => { c.p = FRONT + (c.s - UP) - x; });
        cap.textContent = decks[i]?.name || '';
        draw(0);
        run();
      } else if ((outside || fresh) && decks[target]?.id !== sel) go(i);
      else draw(0);
    },
    get front() { return decks[target] || null; },
    get state() { return { x, v, target, running, drag: !!drag }; },
    go,
  };
}
