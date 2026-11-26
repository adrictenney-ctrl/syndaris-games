// Chef's Kiss deck picker: the card spring in 3D (25 Nov 2026).
//
// A real-time 3D model of a card spring, laid out after the reference photo: a camera matched to the
// photo, and every card a thin, slightly bendable 3D card with rounded corners and edges, lit by a
// soft key light with a glossy coat, casting soft shadows on the cards around it and on the table
// under the pile. The cards fan out of the red backs at the top, turn to face you at the front (the chosen
// deck), lie back as they fall down the right side and land in the pile. Moving, each card follows
// a moment after the one before and flexes; at rest the front card floats gently. Deck cards are
// ivory with gold foil that catches the light. Drawn with WebGL 2 (no library); on a screen without
// it, the flat version (ck-deckspring-flat.js) stands in.
//
//   Drag     grab anywhere on the arc and drag along it (mouse, pen or touch)
//   Wheel    scroll; Arrow keys move one deck; Home / End go to the first / last
//   Snap     letting go eases the nearest deck into the front; a quick flick carries on a few cards
//   Choose   the deck that lands in front is chosen (unless it's locked); tap it (or press Enter) to
//            choose it again; tap another deck to bring it round to the front
//
// Plug it in (table-chefskiss.js does this in the table lobby):
//   const spring = mountDeckSpring(el, { onSelect: deck => ... });
//   spring.update({ decks: [{ id, name, sub, icon, locked }], selected: 'base' });
// Add a deck: add it to the decks list; a new card appears in the spring.
// Shape: KEYS (where each place along the spring sits in the photo, how far from the camera, and how
//   the card is turned). Speed: SNAP, FOLLOW, LAG, GLIDE. Look: LIGHT, the shaders, the drawings.
// With "reduce motion" on, cards jump to their places with a short fade, and nothing floats.

import { mountDeckSpring as mountFlat, ICONS } from './ck-deckspring-flat.js?v=3';
export { ICONS };

// ---------------------------------------------------------------- the camera and the spring

// The camera is the photo's: a 2000 x 2000 px picture with this focal length (px). The stage shows
// the part of the photo in BOX. Places are given in the photo's pixels and a distance from the camera.
export const F = 4000;
export const BOX = { x: 380, y: 120, w: 1420, h: 1780 };
export const ASPECT = BOX.w / BOX.h;
const CARD_W = 1, CARD_H = 1.4, CARD_T = .012, CARD_R = .062;   // a poker card, in card widths
const TILT = 22 * Math.PI / 180;   // the camera looks down at the table this much

// A point in the photo at a distance from the camera -> camera space (x right, y up, looking down -z).
export const unproject = (px, py, d) => [(px - 1000) / F * d, -(py - 1000) / F * d, -d];
const UP_W = [0, Math.cos(TILT), Math.sin(TILT)];   // the table's "up", seen from the camera
// How near the cards are (below 1 = nearer, so bigger cards in the same arc).
export const NEAR = .8;
const PILE_BASE = unproject(990, 1650, 13.7 * NEAR);   // the table under the pile
// The distance at which the photo point lands on the table, a given height above it.
function onTable(px, py, h) {
  const dir = [(px - 1000) / F, -(py - 1000) / F, -1];
  const p0 = PILE_BASE.map((v, i) => v + UP_W[i] * h);
  const num = p0[0] * UP_W[0] + p0[1] * UP_W[1] + p0[2] * UP_W[2];
  const den = dir[0] * UP_W[0] + dir[1] * UP_W[1] + dir[2] * UP_W[2];
  return num / den;
}
const PILE_TOP = 36 * .0135;   // the static pile's height
const onTablePoint = (px, py, h) => unproject(px, py, onTable(px, py, h));

// Each place s (0 = the front, the chosen deck; up the spring is negative, down it positive):
// [s, photo x, photo y, distance (or null: lying on the pile, `lift` above its top), turn away (yaw),
//  lean back (pitch), turn in the picture (roll) (degrees), bend, lift]
// Which card is drawn over which (higher on top), place by place, as the photo layers them.
const Z = { '-13': .5, '-12': 1, '-11': 2, '-10': 3, '-9': 4, '-8': 5, '-7': 6, '-6': 14, '-5': 15, '-4': 16, '-3': 17, '-2': 18, '-1': 19, 0: 30, 1: 29, 2: 28, 3: 27, 4: 26, 5: 25, 6: 24, 7: 23, 8: 22, 9: 21, 10: 12, 11: 11.8, 12: 11.6, 13: 11.4, 14: 11.2 };
const K = (s, px, py, d, yaw, pitch, roll, bend = 0, lift = 0) => ({ s, px, py, d: d != null ? d * NEAR : onTable(px, py, PILE_TOP + lift), yaw, pitch, roll, bend, z: Z[s] });
const FLAT = 90 - 22;   // lying flat on the table, seen from the camera
export const KEYS = [
  // The fan at the top left: face up all the way round, each card turned a little more toward you
  // than the one after it, so no card ever turns past edge on (nothing flips over).
  K(-13, 640, 600, 15.32, 350, 0, 29),           // tucked under the far-left card (hidden)
  K(-12, 628, 590, 15.25, 348, 0, 28, .01),
  K(-11, 661, 547, 15.15, 340, 0, 24, .01),
  K(-10, 761, 452, 15.3, 328, 0, 18, .02),
  K(-9, 810, 402, 15.45, 316, 0, 12, .02),
  K(-8, 860, 395, 15.6, 304, 0, 6, .02),
  K(-7, 925, 368, 15.85, 292, 0, 0, .02),
  K(-6, 1036, 330, 15.8, 281, 0, -4, .03),       // springing out of it, turned away
  K(-5, 1066, 345, 15.7, 283, 0, -6, .03),
  K(-4, 1101, 368, 15.6, 286, 0, -8, .035),
  K(-3, 1163, 400, 15.45, 291, 0, -11, .04),
  K(-2, 1225, 436, 15.25, 302, 0, -15, .05),
  K(-1, 1322, 490, 14.95, 327, 0, -24, .05),
  K(0, 1418, 622, 14.2, 360, 0, -33, .015),      // the front: facing you
  K(1, 1528, 870, 14.55, 360, 48, -84, .06),     // down the right side, lying back
  K(2, 1550, 1026, 14.65, 360, 58, -90, .07),
  K(3, 1530, 1193, 14.6, 360, 63, -92, .07),
  K(4, 1508, 1317, 14.5, 360, 66, -95, .07),
  K(5, 1452, 1420, 14.4, 360, 69, -99, .06),
  K(6, 1413, 1486, 14.3, 360, 71, -102, .05),
  K(7, 1398, 1524, 14.25, 360, 73, -104, .04),
  K(8, 1385, 1561, 14.2, 360, 75, -106, .03),
  K(9, 1040, 1600, null, 360, FLAT - 4, -102, .015, .2),   // dropping onto the pile, just above it
  K(10, 990, 1625, null, 360, FLAT, -100, 0, .0675),      // landed: the top of the pile, squared up
  K(11, 990, 1625, null, 360, FLAT, -100, 0, .054),       // ... each one under the one that landed after it
  K(12, 990, 1625, null, 360, FLAT, -100, 0, .0405),
  K(13, 990, 1625, null, 360, FLAT, -100, 0, .027),
  K(14, 990, 1625, null, 360, FLAT, -100, 0, .0135),      // into the pile (hidden under the others)
];
const SMIN = KEYS[0].s, SMAX = KEYS[KEYS.length - 1].s;
const FIELDS = ['px', 'py', 'd', 'yaw', 'pitch', 'roll', 'bend', 'z'];

// The pose at any place along the spring: a smooth curve through the keys (Catmull-Rom).
export function poseAt(s) {
  const S = Math.max(SMIN, Math.min(SMAX, s)), i = Math.min(KEYS.length - 2, Math.floor(S - SMIN)), f = S - SMIN - i;
  const k0 = KEYS[Math.max(0, i - 1)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const out = {};
  for (const n of FIELDS) {
    const p0 = k0[n], p1 = k1[n], p2 = k2[n], p3 = k3[n];
    out[n] = .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
  }
  out.pos = unproject(out.px, out.py, out.d);
  return out;
}

// ---------------------------------------------------------------- small 3D maths (column-major)
const deg = Math.PI / 180;
function quatEuler(yaw, pitch, roll) {   // R = Ry(yaw) * Rx(-pitch) * Rz(roll)
  const q = (ax, a) => { const s = Math.sin(a / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(a / 2)]; };
  return qmul(qmul(q([0, 1, 0], yaw * deg), q([1, 0, 0], -pitch * deg)), q([0, 0, 1], roll * deg));
}
function qmul(a, b) {
  return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
}
export function modelMatrix(pos, q) {
  const [x, y, z, w] = q;
  return new Float32Array([
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    pos[0], pos[1], pos[2], 1]);
}
const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
const xf = (m, p) => { const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]; return [x / w, y / w, z / w, w]; };
// The photo's frame (BOX) as an off-centre perspective projection.
export function projection(near = 4, far = 40) {
  const l = (BOX.x - 1000) / F * near, r = (BOX.x + BOX.w - 1000) / F * near;
  const t = -(BOX.y - 1000) / F * near, b = -(BOX.y + BOX.h - 1000) / F * near;
  return new Float32Array([2 * near / (r - l), 0, 0, 0, 0, 2 * near / (t - b), 0, 0, (r + l) / (r - l), (t + b) / (t - b), -(far + near) / (far - near), -1, 0, 0, -2 * far * near / (far - near), 0]);
}
function lookAt(eye, at, up) {
  const z = norm(eye.map((v, i) => v - at[i])), x = norm(cross(up, z)), y = cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
}
const ortho = (l, r, b, t, n, f) => new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };

// ---------------------------------------------------------------- the feel
const SNAP = 140;     // spring strength when snapping (higher = snappier)
const FOLLOW = 18;    // how fast a card catches up with its place (per second)
const LAG = .06;      // each place away from the front makes a card that much slower
const GLIDE = .2;     // a flick carries on for about this many seconds of its speed
const LIGHT = norm([-.42, .78, .46]);   // the key light: from the upper left, in front

// ---------------------------------------------------------------- the drawings (canvas textures)
const SUITS = {
  h: p => { p.moveTo(50, 90); p.bezierCurveTo(18, 63, 4, 47, 4, 29); p.bezierCurveTo(4, 14, 15, 4, 28, 4); p.bezierCurveTo(38, 4, 46, 10, 50, 20); p.bezierCurveTo(54, 10, 62, 4, 72, 4); p.bezierCurveTo(85, 4, 96, 14, 96, 29); p.bezierCurveTo(96, 47, 82, 63, 50, 90); },
  d: p => { p.moveTo(50, 2); p.bezierCurveTo(60, 19, 73, 36, 90, 50); p.bezierCurveTo(73, 64, 60, 81, 50, 98); p.bezierCurveTo(40, 81, 27, 64, 10, 50); p.bezierCurveTo(27, 36, 40, 19, 50, 2); },
  s: p => { p.moveTo(50, 3); p.bezierCurveTo(38, 22, 6, 37, 6, 60); p.bezierCurveTo(6, 74, 17, 82, 29, 82); p.bezierCurveTo(37, 82, 43, 78, 46.5, 72); p.bezierCurveTo(45.5, 82, 41, 90, 33, 97); p.lineTo(67, 97); p.bezierCurveTo(59, 90, 54.5, 82, 53.5, 72); p.bezierCurveTo(57, 78, 63, 82, 71, 82); p.bezierCurveTo(83, 82, 94, 74, 94, 60); p.bezierCurveTo(94, 37, 62, 22, 50, 3); },
  c: p => { for (const [x, y] of [[50, 27], [27, 57], [73, 57]]) { p.moveTo(x + 20, y); p.arc(x, y, 20, 0, Math.PI * 2); } p.moveTo(60, 52); p.arc(50, 52, 10, 0, Math.PI * 2); p.moveTo(46.5, 58); p.bezierCurveTo(46, 78, 42, 89, 33, 97); p.lineTo(67, 97); p.bezierCurveTo(58, 89, 54, 78, 53.5, 58); },
};
const PIPS = {
  1: [[50, 50]], 2: [[50, 18], [50, 82]], 3: [[50, 18], [50, 50], [50, 82]],
  4: [[28, 18], [72, 18], [28, 82], [72, 82]], 5: [[28, 18], [72, 18], [50, 50], [28, 82], [72, 82]],
  6: [[28, 18], [72, 18], [28, 50], [72, 50], [28, 82], [72, 82]],
  7: [[28, 18], [72, 18], [50, 34], [28, 50], [72, 50], [28, 82], [72, 82]],
  8: [[28, 18], [72, 18], [50, 34], [28, 50], [72, 50], [50, 66], [28, 82], [72, 82]],
  9: [[28, 18], [72, 18], [28, 39.3], [72, 39.3], [50, 50], [28, 60.7], [72, 60.7], [28, 82], [72, 82]],
  10: [[28, 18], [72, 18], [50, 28.7], [28, 39.3], [72, 39.3], [28, 60.7], [72, 60.7], [50, 71.3], [28, 82], [72, 82]],
};
const RANK = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10 };
const RED = '#c8141e', INK = '#141418';
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function pip(g, s, x, y, size, flip = false) {
  g.save(); g.translate(x, y); if (flip) g.rotate(Math.PI); g.scale(size / 100, size / 100); g.translate(-50, -50);
  g.beginPath(); SUITS[s](g); g.fill(); g.restore();
}
// White coated card stock with a fine grain, rounded corners (transparent outside them).
function stock(W, H, tint = ['#ffffff', '#f6f5f1']) {
  const c = canvasOf(W, H), g = c.getContext('2d');
  g.save();
  const gr = g.createLinearGradient(0, 0, W * .4, H); gr.addColorStop(0, tint[0]); gr.addColorStop(1, tint[1]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < W * H / 60; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,255,255'},${.018 + rnd() * .02})`; g.fillRect(rnd() * W, rnd() * H, 1.2, 1.2); }
  g.restore();
  return { c, g };
}
// A playing card's face: '8d', '10s', 'Ah' ...
function drawFace(id, W = 384) {
  const H = Math.round(W * CARD_H), r = id.slice(0, -1), s = id.slice(-1), n = RANK[r];
  const { c, g } = stock(W, H);
  g.fillStyle = s === 'h' || s === 'd' ? RED : INK;
  // the corner indexes
  for (const flip of [false, true]) {
    g.save(); if (flip) { g.translate(W, H); g.rotate(Math.PI); }
    g.save(); g.translate(W * .105, H * .088); g.scale(r === '10' ? .74 : .86, 1);
    g.font = `700 ${Math.round(W * .15)}px "Times New Roman", Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(r, 0, 0); g.restore();
    pip(g, s, W * .105, H * .165, W * .088);
    g.restore();
  }
  // the pips
  if (n === 1) {
    pip(g, s, W / 2, H / 2, W * (s === 's' ? .46 : .38));
    if (s === 's') { g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = W * .008; g.translate(W / 2 - W * .23, H / 2 - W * .23); g.scale(W * .46 / 100, W * .46 / 100); g.beginPath(); g.moveTo(50, 22); g.bezierCurveTo(42, 34, 22, 44, 22, 60); g.stroke(); g.restore(); }
  } else {
    const x0 = W * .2, x1 = W * .8, y0 = H * .15, y1 = H * .85;
    for (const [px, py] of PIPS[n]) pip(g, s, x0 + (x1 - x0) * px / 100, y0 + (y1 - y0) * py / 100, W * .165, py > 50);
  }
  return c;
}
// The red back: a fine lattice, mirrored filigree, a medallion and a double white border.
function drawBack(W = 384) {
  const H = Math.round(W * CARD_H), { c, g } = stock(W, H, ['#fbfaf6', '#f1efe8']), m = W * .055;
  g.save(); rr(g, m, m, W - 2 * m, H - 2 * m, W * .03); g.clip();
  const gr = g.createRadialGradient(W / 2, H / 2, W * .1, W / 2, H / 2, H * .7); gr.addColorStop(0, '#cf1b25'); gr.addColorStop(1, '#a50f18');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,226,220,.3)'; g.lineWidth = W * .0028;
  for (let k = -H; k < W + H; k += W * .034) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.moveTo(k, 0); g.lineTo(k - H, H); g.stroke(); }
  g.strokeStyle = '#fbe9e4'; g.fillStyle = '#fbe9e4'; g.lineCap = 'round';
  const spiral = (x, y, r0, turns, dir) => { g.beginPath(); for (let a = 0; a <= turns * Math.PI * 2; a += .12) { const r = r0 * (1 - a / (turns * Math.PI * 2 + .6)); const X = x + dir * r * Math.cos(a), Y = y + r * Math.sin(a); a ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); };
  const leaf = (x, y, a, l) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * .5, -l * .32, l, 0); g.quadraticCurveTo(l * .5, l * .32, 0, 0); g.fill(); g.restore(); };
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    g.save(); g.translate(W / 2, H / 2); g.scale(sx, sy);
    const w = W / 2 - m, h = H / 2 - m;
    g.lineWidth = W * .009;
    g.beginPath(); g.moveTo(0, h * .36); g.bezierCurveTo(w * .25, h * .36, w * .34, h * .2, w * .56, h * .26); g.bezierCurveTo(w * .78, h * .32, w * .76, h * .56, w * .58, h * .56); g.stroke();
    spiral(w * .62, h * .5, w * .1, 1.6, 1);
    g.beginPath(); g.moveTo(w * .12, h * .62); g.bezierCurveTo(w * .3, h * .9, w * .62, h * .7, w * .8, h * .86); g.stroke();
    spiral(w * .78, h * .8, w * .08, 1.5, -1);
    g.beginPath(); g.moveTo(w * .3, 0); g.bezierCurveTo(w * .42, h * .08, w * .66, h * .02, w * .82, h * .12); g.stroke();
    spiral(w * .84, h * .17, w * .07, 1.4, 1);
    for (const [x, y, a] of [[.2, .36, -.5], [.36, .3, -1.1], [.48, .7, .7], [.66, .74, -.4], [.52, .06, -.3], [.7, .06, .6], [.12, .74, 1.2]]) leaf(w * x, h * y, a, w * .13);
    g.lineWidth = W * .005;
    g.beginPath(); g.moveTo(w * .92, h * .9); g.lineTo(w * .7, h * .94); g.moveTo(w * .92, h * .9); g.lineTo(w * .96, h * .7); g.stroke();
    g.restore();
  }
  // medallion
  g.save(); g.translate(W / 2, H / 2);
  g.fillStyle = '#b8121b'; g.lineWidth = W * .01; g.strokeStyle = '#fbe9e4';
  g.beginPath(); g.ellipse(0, 0, W * .16, H * .13, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.lineWidth = W * .005; g.beginPath(); g.ellipse(0, 0, W * .12, H * .097, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#fbe9e4';
  for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4); g.beginPath(); g.ellipse(0, -W * .055, W * .02, W * .05, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.beginPath(); g.arc(0, 0, W * .025, 0, Math.PI * 2); g.fillStyle = '#b8121b'; g.fill(); g.stroke();
  g.restore();
  g.restore();
  // double border inside the white margin
  g.strokeStyle = '#a50f18'; g.lineWidth = W * .008; rr(g, m - W * .012, m - W * .012, W - 2 * m + W * .024, H - 2 * m + W * .024, W * .04); g.stroke();
  g.strokeStyle = '#fbe9e4'; g.lineWidth = W * .006; rr(g, m + W * .022, m + W * .022, W - 2 * m - W * .044, H - 2 * m - W * .044, W * .02); g.stroke();
  return c;
}
// A deck card: ivory stock, gold foil frame and flourishes, the deck's emblem and name.
// Returns the face and its foil mask (white where the gold is).
const HAT = p => { p.moveTo(27, 60); p.bezierCurveTo(14, 58, 8, 44, 16, 34); p.bezierCurveTo(20, 28, 27, 26, 31, 27); p.bezierCurveTo(32, 15, 42, 8, 50, 8); p.bezierCurveTo(58, 8, 68, 15, 69, 27); p.bezierCurveTo(73, 26, 80, 28, 84, 34); p.bezierCurveTo(92, 44, 86, 58, 73, 60); p.closePath(); p.rect(30, 64, 40, 18); };
function drawDeck(d, W = 640) {
  const H = Math.round(W * CARD_H), { c, g } = stock(W, H, ['#fffdf7', '#f4eedf']);
  const foil = canvasOf(W, H), f = foil.getContext('2d');
  const both = fn => { fn(g, true); fn(f, false); };
  const GOLD = '#b98b2e';
  const gold = (ctx, real) => { if (!real) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; return; } const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#d9b45a'); gr.addColorStop(.5, '#a87a22'); gr.addColorStop(1, '#e2c06c'); ctx.fillStyle = gr; ctx.strokeStyle = gr; };
  // frame
  both((ctx, real) => {
    gold(ctx, real);
    ctx.lineWidth = W * .012; rr(ctx, W * .06, W * .06, W - W * .12, H - W * .12, W * .035); ctx.stroke();
    ctx.lineWidth = W * .004; rr(ctx, W * .085, W * .085, W - W * .17, H - W * .17, W * .02); ctx.stroke();
    // corner flourishes
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sx, sy); ctx.translate(-W / 2, -H / 2);
      ctx.lineWidth = W * .006; ctx.beginPath();
      ctx.moveTo(W * .11, W * .2); ctx.bezierCurveTo(W * .11, W * .13, W * .13, W * .11, W * .2, W * .11);
      ctx.moveTo(W * .14, W * .27); ctx.bezierCurveTo(W * .15, W * .18, W * .18, W * .15, W * .27, W * .14); ctx.stroke();
      ctx.beginPath(); ctx.arc(W * .16, W * .16, W * .016, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // the title band
    ctx.font = `600 ${Math.round(W * .05)}px "Cormorant Garamond", Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(W * .012)}px`;
    ctx.fillText("CHEF'S KISS", W / 2, H * .145);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.lineWidth = W * .003; ctx.beginPath(); ctx.moveTo(W * .26, H * .175); ctx.lineTo(W * .74, H * .175); ctx.stroke();
    // emblem ring
    ctx.lineWidth = W * .012; ctx.beginPath(); ctx.arc(W / 2, H * .37, W * .17, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = W * .004; ctx.beginPath(); ctx.arc(W / 2, H * .37, W * .195, 0, Math.PI * 2); ctx.stroke();
  });
  // emblem: deep red disc with an ivory chef's hat (and a plus or a second hat)
  g.fillStyle = '#9b1722'; g.beginPath(); g.arc(W / 2, H * .37, W * .164, 0, Math.PI * 2); g.fill();
  const hat = (x, y, s, a = 1) => { g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s / 100, s / 100); g.translate(-50, -46); g.beginPath(); HAT(g); g.fillStyle = '#fbf3e2'; g.fill(); g.restore(); };
  const HOURGLASS = p => { p.moveTo(26, 8); p.lineTo(74, 8); p.lineTo(74, 16); p.lineTo(70, 16); p.bezierCurveTo(70, 30, 62, 40, 54, 50); p.bezierCurveTo(62, 60, 70, 70, 70, 84); p.lineTo(74, 84); p.lineTo(74, 92); p.lineTo(26, 92); p.lineTo(26, 84); p.lineTo(30, 84); p.bezierCurveTo(30, 70, 38, 60, 46, 50); p.bezierCurveTo(38, 40, 30, 30, 30, 16); p.lineTo(26, 16); p.closePath(); };
  if (d.iconKey === 'capsule') {
    g.save(); g.translate(W / 2, H * .37); g.scale(W * .2 / 100, W * .2 / 100); g.translate(-50, -50);
    g.beginPath(); HOURGLASS(g); g.fillStyle = '#fbf3e2'; g.fill();
    g.beginPath(); g.moveTo(40, 82); g.bezierCurveTo(42, 74, 46, 70, 50, 68); g.bezierCurveTo(54, 70, 58, 74, 60, 82); g.closePath(); g.moveTo(38, 24); g.lineTo(62, 24); g.bezierCurveTo(60, 32, 55, 38, 50, 42); g.bezierCurveTo(45, 38, 40, 32, 38, 24); g.fillStyle = '#d9b45a'; g.fill();
    g.restore();
  } else if (d.iconKey === 'both') { hat(W / 2 - W * .055, H * .365, W * .17, .7); hat(W / 2 + W * .045, H * .375, W * .19); }
  else hat(W / 2, H * .37, W * .2);
  if (d.iconKey === 'plus') {
    g.fillStyle = GOLD; g.beginPath(); g.arc(W / 2 + W * .1, H * .415, W * .048, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff8e6'; g.lineWidth = W * .012; g.beginPath(); g.moveTo(W / 2 + W * .1, H * .395); g.lineTo(W / 2 + W * .1, H * .435); g.moveTo(W / 2 + W * .08, H * .415); g.lineTo(W / 2 + W * .12, H * .415); g.stroke();
    f.fillStyle = '#fff'; f.beginPath(); f.arc(W / 2 + W * .1, H * .415, W * .048, 0, Math.PI * 2); f.fill();
  }
  // the deck's name, on one or two lines
  g.fillStyle = '#1d1a2c'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const words = String(d.name).toUpperCase().split(' '); let lines = [words.join(' ')];
  let size = W * .1;
  g.font = `400 ${Math.round(size)}px "DM Serif Display", Georgia, serif`;
  if (g.measureText(lines[0]).width > W * .72) {
    let best = null;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const wmax = Math.max(g.measureText(a).width, g.measureText(b).width); if (!best || wmax < best[0]) best = [wmax, [a, b]]; }
    if (best) lines = best[1];
  }
  while (Math.max(...lines.map(l => g.measureText(l).width)) > W * .74 && size > W * .05) { size *= .94; g.font = `400 ${Math.round(size)}px "DM Serif Display", Georgia, serif`; }
  const y0 = H * (lines.length > 1 ? .64 : .67);
  lines.forEach((l, i) => g.fillText(l, W / 2, y0 + i * size * 1.02));
  // a gold rule and the small line under it
  both((ctx, real) => { gold(ctx, real); ctx.fillRect(W * .4, y0 + (lines.length - 1) * size * 1.02 + size * .42, W * .2, W * .006); });
  if (d.sub) { g.fillStyle = '#6a6274'; g.font = `italic 600 ${Math.round(W * .052)}px "Cormorant Garamond", Georgia, serif`; g.fillText(d.sub, W / 2, y0 + (lines.length - 1) * size * 1.02 + size * .42 + W * .085); }
  // corner marks: a small red hat
  for (const flip of [false, true]) {
    g.save(); if (flip) { g.translate(W, H); g.rotate(Math.PI); }
    g.translate(W * .155, H * .072); g.scale(W * .075 / 100, W * .075 / 100); g.translate(-50, -46); g.beginPath(); HAT(g); g.fillStyle = '#9b1722'; g.fill(); g.restore();
  }
  if (d.locked) {
    // greyed out: the whole card in greys, paler, with no gold shine; then the lock
    const img = g.getImageData(0, 0, W, H), px = img.data;
    for (let i = 0; i < px.length; i += 4) { const l = .3 * px[i] + .59 * px[i + 1] + .11 * px[i + 2]; px[i] = px[i + 1] = px[i + 2] = l * .78 + 44; }
    g.putImageData(img, 0, 0);
    f.clearRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H * .37);
    g.fillStyle = 'rgba(24,18,52,.92)'; g.beginPath(); g.arc(0, 0, W * .12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd84a'; rr(g, -W * .05, -W * .005, W * .1, W * .075, W * .012); g.fill();
    g.strokeStyle = '#ffd84a'; g.lineWidth = W * .016; g.beginPath(); g.arc(0, -W * .01, W * .032, Math.PI, 0); g.lineTo(W * .032, 0); g.moveTo(-W * .032, -W * .01); g.lineTo(-W * .032, 0); g.stroke();
    g.restore();
  }
  return { face: c, foil };
}

// ---------------------------------------------------------------- shaders
const VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec2 aUv; layout(location=3) in vec2 aKind;
uniform mat4 uModel, uView, uProj, uLightVP; uniform float uBend;
out vec3 vNor; out vec3 vPos; out vec2 vUv; out vec4 vLight; out float vKind; out float vEdge;
void main() {
  vec3 p = aPos; float t = p.y / ${(CARD_H / 2).toFixed(3)};
  p.z += uBend * (1.0 - t * t);
  vec3 n = aNor;
  if (aKind.x < 1.5) n = normalize(vec3(0.0, 2.0 * uBend * t / ${(CARD_H / 2).toFixed(3)} * sign(aNor.z), aNor.z));
  vec4 w = uModel * vec4(p, 1.0);
  vPos = (uView * w).xyz; vNor = mat3(uView) * mat3(uModel) * n; vUv = aUv; vKind = aKind.x; vEdge = aKind.y;
  vLight = uLightVP * w;
  gl_Position = uProj * vec4(vPos, 1.0);
}`;
const FS = `#version 300 es
precision highp float; precision highp sampler2DShadow;
in vec3 vNor; in vec3 vPos; in vec2 vUv; in vec4 vLight; in float vKind; in float vEdge;
uniform sampler2D uFace, uBack, uFoil; uniform sampler2DShadow uShadow;
uniform vec3 uL; uniform float uGlow, uFoilOn, uShade;
out vec4 o;
float shadowAt(vec4 lp) {
  vec3 c = lp.xyz / lp.w * 0.5 + 0.5; if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0) return 1.0;
  float s = 0.0; vec2 px = vec2(1.0) / vec2(textureSize(uShadow, 0));
  for (int x = -2; x <= 2; x++) for (int y = -2; y <= 2; y++) s += texture(uShadow, vec3(c.xy + vec2(x, y) * px * 1.4, c.z - 0.0015));
  return s / 25.0;
}
vec3 env(vec3 r) {   // a studio: a big soft box up and to the left, a dim floor
  float box = smoothstep(0.25, 0.75, r.y) * smoothstep(-0.9, -0.1, -abs(r.x + 0.35) * 1.2);
  return mix(vec3(0.12, 0.10, 0.22), vec3(1.0, 0.98, 0.95), clamp(box + max(r.y, 0.0) * 0.25, 0.0, 1.0));
}
void main() {
  vec3 N = normalize(vNor); vec3 V = normalize(-vPos);
  if (dot(N, V) < 0.0 && vKind > 1.5) N = -N;
  vec4 albedo; float foil = 0.0;
  if (vKind < 0.5) { albedo = texture(uFace, vUv); foil = uFoilOn * texture(uFoil, vUv).r; }
  else if (vKind < 1.5) albedo = texture(uBack, vec2(1.0 - vUv.x, vUv.y));
  else { float e = sin(vEdge * 3.14159); albedo = vec4(vec3(0.80 + 0.16 * e) * vec3(1.0, 0.99, 0.96), 1.0); }
  float sh = shadowAt(vLight);
  float dif = max(dot(N, uL), 0.0);
  vec3 H = normalize(uL + V);
  float nh = clamp(dot(N, H), 0.0, 1.0), nv = clamp(dot(N, V), 0.0, 1.0);
  float spec = pow(nh, 70.0);
  float fres = 0.04 + 0.5 * pow(1.0 - nv, 5.0);
  vec3 R = reflect(-V, N);
  vec3 col = albedo.rgb * (0.70 + 0.08 * N.y + 0.40 * dif * mix(0.4, 1.0, sh));
  col += env(R) * fres * 0.45 + vec3(1.0) * spec * 0.28 * sh;
  if (foil > 0.01) {
    vec3 goldC = albedo.rgb * (0.45 + 1.6 * env(R) + 0.5 * dif * sh) + vec3(1.0, 0.86, 0.55) * pow(nh, 30.0) * 1.4 * sh;
    col = mix(col, goldC, foil) + foil * uGlow * vec3(0.45, 0.32, 0.08);
  }
  col *= 1.0 - uShade;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
const SVS = `#version 300 es
layout(location=0) in vec3 aPos; uniform mat4 uModel, uLightVP; uniform float uBend;
void main() { vec3 p = aPos; float t = p.y / ${(CARD_H / 2).toFixed(3)}; p.z += uBend * (1.0 - t * t); gl_Position = uLightVP * uModel * vec4(p, 1.0); }`;
const SFS = `#version 300 es
precision mediump float; out vec4 o; void main() { o = vec4(1.0); }`;
// The table under the pile: shows only the shadows on it (and a soft contact shadow).
const GVS = `#version 300 es
layout(location=0) in vec3 aPos; uniform mat4 uView, uProj, uLightVP; out vec4 vLight; out vec2 vP;
void main() { vLight = uLightVP * vec4(aPos, 1.0); vP = aPos.xz; gl_Position = uProj * uView * vec4(aPos, 1.0); }`;
const GFS = `#version 300 es
precision highp float; precision highp sampler2DShadow;
in vec4 vLight; in vec2 vP; uniform sampler2DShadow uShadow; uniform vec3 uC; uniform vec2 uR; out vec4 o;
void main() {
  vec3 c = vLight.xyz / vLight.w * 0.5 + 0.5; float s = 0.0; vec2 px = vec2(1.0) / vec2(textureSize(uShadow, 0));
  for (int x = -3; x <= 3; x++) for (int y = -3; y <= 3; y++) s += texture(uShadow, vec3(c.xy + vec2(x, y) * px * 2.0, c.z - 0.002));
  s /= 49.0;
  vec2 d = (vP - uC.xz) / uR; float r = length(d);
  float a = (1.0 - s) * 0.42 * smoothstep(1.0, 0.55, r) + 0.28 * smoothstep(0.75, 0.25, r);
  o = vec4(vec3(0.03, 0.02, 0.1) * a, a);
}`;

// ---------------------------------------------------------------- the card mesh
function cardMesh() {
  const W = CARD_W, H = CARD_H, R = CARD_R * W, T = CARD_T, pos = [], nor = [], uv = [], kind = [], idx = [];
  const v = (x, y, z, nx, ny, nz, u, w, k, e) => { pos.push(x, y, z); nor.push(nx, ny, nz); uv.push(u, w); kind.push(k, e); return pos.length / 3 - 1; };
  // faces: rows across the card from the bottom edge to the top, following the rounded corners
  // (the corners are in the shape itself, so nothing is cut away in the shader)
  const NY = 14, rows = [];
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + i / 6 * Math.PI / 2; rows.push([-H / 2 + R + R * Math.sin(a), W / 2 - R + R * Math.cos(a)]); }
  for (let i = 1; i < NY; i++) rows.push([-H / 2 + R + (H - 2 * R) * i / NY, W / 2]);
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; rows.push([H / 2 - R + R * Math.sin(a), W / 2 - R + R * Math.cos(a)]); }
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (const [y, hx] of rows) for (const x of [-hx, hx]) v(x, y, side * T / 2, 0, 0, side, x / W + .5, .5 - y / H, side > 0 ? 0 : 1, 0);
    for (let j = 0; j < rows.length - 1; j++) {
      const l0 = base + j * 2, r0 = l0 + 1, l1 = l0 + 2, r1 = l0 + 3;
      if (side > 0) idx.push(l0, r0, r1, l0, r1, l1); else idx.push(l0, r1, r0, l0, l1, r1);
    }
  }
  const nFace = idx.length;
  // the edge all round, following the rounded corners
  const out = [], arc = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + i / 6 * Math.PI / 2; out.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } };
  arc(W / 2 - R, -H / 2 + R, -Math.PI / 2); for (let i = 1; i < NY; i++) out.push([W / 2, -H / 2 + R + (H - 2 * R) * i / NY]);
  arc(W / 2 - R, H / 2 - R, 0); for (let i = 1; i < 4; i++) out.push([W / 2 - R - (W - 2 * R) * i / 4, H / 2]);
  arc(-W / 2 + R, H / 2 - R, Math.PI / 2); for (let i = 1; i < NY; i++) out.push([-W / 2, H / 2 - R - (H - 2 * R) * i / NY]);
  arc(-W / 2 + R, -H / 2 + R, Math.PI); for (let i = 1; i < 4; i++) out.push([-W / 2 + R + (W - 2 * R) * i / 4, -H / 2]);
  for (let i = 0; i < out.length; i++) {
    const [x0, y0] = out[i], [x1, y1] = out[(i + 1) % out.length], n = norm([y1 - y0, -(x1 - x0), 0]);
    const a = v(x0, y0, T / 2, ...n, 0, 0, 2, 0), b = v(x1, y1, T / 2, ...n, 0, 0, 2, 0), c = v(x0, y0, -T / 2, ...n, 0, 0, 2, 1), d = v(x1, y1, -T / 2, ...n, 0, 0, 2, 1);
    idx.push(a, c, b, b, c, d);
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), uv: new Float32Array(uv), kind: new Float32Array(kind), idx: new Uint16Array(idx), faces: nFace };
}

// ---------------------------------------------------------------- the picker
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const hash = (k, salt = 0) => { let x = (k + 1) * 2654435761 + salt * 40503; x ^= x >>> 15; x = Math.imul(x, 2246822519); x ^= x >>> 13; return (x >>> 0) / 4294967296; };
// The plain cards, place by place, when the first deck is in front (after the photo, number cards only).
const PLAIN = { '-13': '8d', '-12': '8d', '-11': '10s', '-10': '2h', '-9': '7c', '-8': '9d', '-7': '4c', '-6': 'Ah', '-5': '7s', '-4': '5s', '-3': '9s', '-2': '6d', '-1': '5h', 1: '3h', 2: '5d', 3: '5d', 4: '8s', 5: '8c', 6: '5h', 7: '3h', 8: '3h', 9: '5d', 10: '8c', 11: '4s', 12: 'Ad', 13: 'As', 14: '7d' };
const ALLPLAIN = ['Ah', '2c', '3h', '4s', '5d', '6c', '7h', '8s', '9d', '10c', 'As', '5h', '8d', '3s', '7d', '9c'];
let uid = 0;

export function mountDeckSpring(el, opts = {}) {
  const probe = typeof document !== 'undefined' && document.createElement('canvas');
  const gl = probe && probe.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) return mountFlat(el, opts);
  try { return mount3d(el, opts, probe, gl); }
  catch (err) { console.warn('Deck picker: 3D failed, using the flat one', err); el.innerHTML = ''; return mountFlat(el, opts); }
}

function mount3d(el, { onSelect = () => {}, onFront = () => {}, hint = 'Drag the cards to choose a deck' }, canvas, gl) {
  const id = 'cks' + (++uid);
  el.classList.add('cks', 'cks-3d');
  el.tabIndex = 0;
  el.setAttribute('role', 'listbox');
  el.setAttribute('aria-label', 'Choose a deck');
  el.innerHTML = `<div class="cks-cards"></div><p class="cks-cap"><span>${esc(hint)}</span><b aria-live="polite"></b></p><div class="cks-sr" role="presentation"></div>`;
  const wrap = el.querySelector('.cks-cards'), cap = el.querySelector('.cks-cap b'), sr = el.querySelector('.cks-sr');
  canvas.className = 'cks-canvas';
  wrap.appendChild(canvas);

  // ---- GL setup
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const program = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, shader(gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); } return { p, u }; };
  const P = program(VS, FS), PS = program(SVS, SFS), PG = program(GVS, GFS);
  const mesh = cardMesh();
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = (data, loc, size) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); };
  buf(mesh.pos, 0, 3); buf(mesh.nor, 1, 3); buf(mesh.uv, 2, 2); buf(mesh.kind, 3, 2);
  const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);
  const NIDX = mesh.idx.length, NFACE = mesh.faces;
  // the table under the pile (a flat quad on the table plane)
  const gvao = gl.createVertexArray(); gl.bindVertexArray(gvao);
  const GC = PILE_BASE.map((v, i) => v + UP_W[i] * .002), ax = [1, 0, 0], az = norm(cross(ax, UP_W)), GR = [2.3, 1.6];
  const gq = []; for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) for (let i = 0; i < 3; i++) gq.push(GC[i] + ax[i] * a * GR[0] * 1.2 + az[i] * b * GR[1] * 1.2);
  buf(new Float32Array(gq), 0, 3);
  gl.bindVertexArray(null);

  // shadow map
  const SM = 2048;
  const shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SM, SM);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0);
  gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const centre = unproject(1080, 1000, 15 * NEAR);
  const lightView = lookAt(centre.map((v, i) => v + LIGHT[i] * 12), centre, [0, 1, 0]);
  const lightVP = mul(ortho(-4.6, 4.6, -4.6, 4.6, 2, 24), lightView);
  const PROJ = projection(), VIEW = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  // textures
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  const texOf = src => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    return t;
  };
  const faces = new Map();
  const faceTex = cid => { if (!faces.has(cid)) faces.set(cid, texOf(drawFace(cid))); return faces.get(cid); };
  const backTex = texOf(drawBack());
  const black = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, black); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

  // ---- the still cards: the pile under the landing cards
  const still = [];
  {
    for (let i = 0; i < 36; i++) {
      const h = i * .0135, sx = (hash(i, 5) - .5) * .03, sz = (hash(i, 6) - .5) * .03;   // squared up, a hair out of line
      const pos = onTablePoint(990, 1625, h).map((v, k) => v + ax[k] * sx + az[k] * sz);
      const cid = ALLPLAIN[Math.floor(hash(i, 7) * ALLPLAIN.length)];
      still.push({ m: modelMatrix(pos, quatEuler(0, FLAT, -100 + (hash(i, 8) - .5) * 3)), face: faceTex(cid), back: backTex, bend: 0, pile: true, z: i * .25 });
    }
  }

  // ---- the moving cards
  let decks = [], selected = null, cards = [], x = 0, v = 0, target = 0, settledAt = -1;
  let drag = null, running = false, last = 0, time = 0, pop = 0, lost = false, idle = 0;
  const UPN = -SMIN;   // plain cards before the first deck
  const deckTex = new Map();
  function deckTextures(d) {
    const key = JSON.stringify([d.id, d.name, d.sub, d.iconKey, d.locked]);
    if (!deckTex.has(key)) { const { face, foil } = drawDeck(d); deckTex.set(key, { face: texOf(face), foil: texOf(foil) }); }
    return deckTex.get(key);
  }
  function build() {
    cards = [];
    const n = decks.length, total = UPN + n + SMAX + 1;
    for (let k = 0; k < total; k++) {
      const di = k - UPN, deck = di >= 0 && di < n ? decks[di] : null;
      const s0 = k - UPN - (k >= UPN + n ? n - 1 : 0);
      const cid = PLAIN[s0] || ALLPLAIN[Math.floor(hash(k, 3) * ALLPLAIN.length)];
      cards.push({ k, deck, di, p: null, vel: 0, tex: deck ? deckTextures(deck) : { face: faceTex(cid), foil: black } });
    }
    sr.innerHTML = decks.map(d => `<span id="${id}-${esc(d.id)}" role="option" aria-selected="false">${esc(d.name)}${d.locked ? ' (locked' + (d.sub ? ': ' + esc(d.sub) : '') + ')' : ''}</span>`).join('');
  }
  const sameDecks = list => list.length === decks.length && list.every((d, i) => ['id', 'name', 'sub', 'icon', 'locked'].every(f => d[f] === decks[i][f]));

  // ---- sizes
  let cssW = 1, cssH = 1;
  function measure() {
    cssW = el.clientWidth || 1; cssH = el.clientHeight || 1;
    // Smooth edges by drawing at twice the size (or the screen's pixel ratio) and letting the page
    // scale it down: multisampling leaves see-through specks on some GPUs. Capped for TVs.
    const scale = Math.min(Math.max(2, window.devicePixelRatio || 1), 2.5, Math.sqrt(3.2e6 / (cssW * cssH)));
    canvas.width = Math.round(cssW * scale); canvas.height = Math.round(cssH * scale);
    Object.assign(el.querySelector('.cks-cap').style, { left: (1010 - BOX.x) / BOX.w * cssW + 'px', top: (1080 - BOX.y) / BOX.h * cssH + 'px' });
  }
  const toScreen = p => { const c = xf(PROJ, p); return [(c[0] * .5 + .5) * cssW, (1 - (c[1] * .5 + .5)) * cssH, c[3]]; };

  // ---- one card's pose this frame
  function cardPose(c) {
    const ps = poseAt(c.p);
    let { pos } = ps, yaw = ps.yaw, pitch = ps.pitch, roll = ps.roll;
    const isFront = c.deck && Math.abs(c.p) < .5;
    if (isFront && !reduced()) {
      const settle = clamp(1 - Math.abs(c.p) * 4, 0, 1);
      const f = Math.sin(time * 1.25) * .022 * settle, r = Math.sin(time * .8) * 1.6 * settle;
      pos = [pos[0], pos[1] + f, pos[2] + pop * .9];
      yaw += r; pitch += Math.sin(time * 1.05 + 1) * 1.1 * settle;
    }
    const bend = ps.bend + Math.min(.09, Math.abs(c.vel) * .012);
    return { m: modelMatrix(pos, quatEuler(yaw, pitch, roll)), bend, pos, z: ps.z + (isFront ? 1 : 0) };
  }

  // ---- drawing
  function render() {
    if (lost) return;
    const poses = [];
    for (const c of cards) if (c.p >= SMIN && c.p <= SMAX) poses.push([c, cardPose(c)]);
    // shadow pass
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, SM, SM);
    gl.enable(gl.DEPTH_TEST); gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 3);
    gl.useProgram(PS.p); gl.bindVertexArray(vao); gl.uniformMatrix4fv(PS.u.uLightVP, false, lightVP);
    const shadowDraw = (m, b) => { gl.uniformMatrix4fv(PS.u.uModel, false, m); gl.uniform1f(PS.u.uBend, b); gl.drawElements(gl.TRIANGLES, NIDX, gl.UNSIGNED_SHORT, 0); };
    for (const st of still) shadowDraw(st.m, 0);
    for (const [, q] of poses) shadowDraw(q.m, q.bend);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    // colour pass: the table's shadows first, then every card back to front in the photo's
    // layering (no depth buffer: it's unreliable on some GPUs), each showing only its facing side
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(PG.p); gl.bindVertexArray(gvao);
    gl.uniformMatrix4fv(PG.u.uView, false, VIEW); gl.uniformMatrix4fv(PG.u.uProj, false, PROJ); gl.uniformMatrix4fv(PG.u.uLightVP, false, lightVP);
    gl.uniform1i(PG.u.uShadow, 3); gl.uniform3fv(PG.u.uC, GC); gl.uniform2fv(PG.u.uR, [GR[0] * 1.15, GR[1] * 1.6]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.useProgram(P.p); gl.bindVertexArray(vao);
    gl.uniformMatrix4fv(P.u.uView, false, VIEW); gl.uniformMatrix4fv(P.u.uProj, false, PROJ); gl.uniformMatrix4fv(P.u.uLightVP, false, lightVP);
    gl.uniform3fv(P.u.uL, LIGHT);
    gl.uniform1i(P.u.uFace, 0); gl.uniform1i(P.u.uBack, 1); gl.uniform1i(P.u.uFoil, 2); gl.uniform1i(P.u.uShadow, 3);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, backTex);
    const list = still.map(st => [st.z, st.m, 0, st.face, black, 0, 0, st.pile ? .04 : 0, st.back]);
    for (const [c, q] of poses) {
      const front = c.deck && Math.abs(c.p) < .5;
      list.push([q.z, q.m, q.bend, c.tex.face, c.tex.foil, c.deck ? 1 : 0, front ? .55 + .25 * Math.sin(time * 2.2) : 0, c.deck?.locked ? .06 : 0, backTex]);
    }
    list.sort((a, b) => a[0] - b[0]);
    for (const [, m, bend, face, foil, foilOn, glow, shade, back] of list) {
      gl.uniformMatrix4fv(P.u.uModel, false, m); gl.uniform1f(P.u.uBend, bend);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, face);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, foil);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, back);
      gl.uniform1f(P.u.uFoilOn, foilOn); gl.uniform1f(P.u.uGlow, glow); gl.uniform1f(P.u.uShade, shade);
      // the edge first, then the faces (only the side towards the camera survives the culling)
      gl.drawElements(gl.TRIANGLES, NIDX - NFACE, gl.UNSIGNED_SHORT, NFACE * 2);
      gl.drawElements(gl.TRIANGLES, NFACE, gl.UNSIGNED_SHORT, 0);
    }
    gl.disable(gl.CULL_FACE);
    gl.bindVertexArray(null);
  }

  // ---- the motion
  function step(dt) {
    const rm = reduced();
    let moving = false, front = null;
    if (!drag) {
      if (rm) { x = target; v = 0; }
      else {
        const a = -SNAP * (x - target) - 2 * Math.sqrt(SNAP) * v;
        v += a * dt; x += v * dt;
        if (Math.abs(x - target) < .001 && Math.abs(v) < .01) { x = target; v = 0; } else moving = true;
      }
    }
    for (const c of cards) {
      const t = c.k - UPN - x;
      if (c.p === null || rm) { c.p = t; c.vel = 0; continue; }
      const rate = FOLLOW / (1 + Math.abs(t) * LAG), before = c.p;
      c.p += (t - c.p) * (1 - Math.exp(-rate * dt));
      if (Math.abs(t - c.p) < .0005) c.p = t; else moving = true;
      c.vel = dt ? (c.p - before) / dt : 0;
      if (c.deck && Math.abs(c.p) < .5) front = c;
    }
    pop *= Math.exp(-dt * 7);
    if (pop > .002) moving = true;
    sr.querySelectorAll('[role=option]').forEach((o, i) => o.setAttribute('aria-selected', String(front?.di === i)));
    if (front) el.setAttribute('aria-activedescendant', `${id}-${front.deck.id}`);
    return moving || !!drag;
  }
  function tick(now) {
    const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
    last = now; time += dt;
    const busy = step(dt);
    // at rest the float only needs 30 frames a second (kinder to TVs)
    idle = busy || drag ? 0 : idle + 1;
    if (!(idle % 2)) render();
    if (!drag && !busy && settledAt !== target) settle();
    // keep going while anything moves; at rest keep the front card floating (unless motion is reduced)
    if (busy || drag) frame(true);
    else if (!reduced() && !document.hidden && el.isConnected && el.offsetParent) frame(false);   // (stops while the lobby is hidden)
    else { running = false; last = 0; }
  }
  // The next frame; while cards move, a timer stands in if the screen holds back animation frames.
  function frame(important) {
    let done = false;
    const go = () => { if (!done) { done = true; tick(performance.now()); } };
    requestAnimationFrame(go);
    if (important) setTimeout(go, 120);
  }
  function run() { if (!running) { running = true; last = 0; frame(true); } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });

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
    selected = d.id; onSelect(d);
    if (!reduced()) pop = .35;
    run();
  }

  // ---- pointer: which card is under it, and dragging along the spring
  function cardAt(cx, cy) {
    let best = null;
    for (const c of cards) {
      if (c.p === null || c.p < SMIN || c.p > SMAX) continue;
      const { m } = cardPose(c);
      const q = [[-.5, -.7], [.5, -.7], [.5, .7], [-.5, .7]].map(([a, b]) => toScreen(xf(m, [a * CARD_W, b, 0])));
      let inside = true;
      for (let i = 0; i < 4; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % 4]; const s = (x1 - x0) * (cy - y0) - (y1 - y0) * (cx - x0); if (i === 0) inside = s; else if (Math.sign(s) !== Math.sign(inside)) { inside = false; break; } }
      if (inside === false) continue;
      const depth = xf(m, [0, 0, 0])[2];
      if (!best || depth > best.depth) best = { c, depth };
    }
    return best?.c || null;
  }
  // Drag up the spring (toward the top) and the next deck comes up out of the pile to the
  // front; drag down it and the deck before comes back down out of the stack.
  function along(p) {
    const a = toScreen(poseAt(p - .5).pos), b = toScreen(poseAt(p + .5).pos);
    let dx = a[0] - b[0], dy = a[1] - b[1];
    const len = Math.hypot(dx, dy), min = cssW * .05;
    if (len < min) { if (!len) { dx = 0; dy = -min; } else { dx *= min / len; dy *= min / len; } }
    return { dx, dy, l2: dx * dx + dy * dy };
  }
  const local = e => { const r = el.getBoundingClientRect(), z = r.width / (el.offsetWidth || 1) || 1; return [(e.clientX - r.left) / z, (e.clientY - r.top) / z, z]; };
  el.addEventListener('pointerdown', e => {
    if (e.button > 0 || !decks.length) return;
    const [lx, ly, z] = local(e), c = cardAt(lx, ly);
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, s0: x, card: c, moved: false, dir: along(c ? c.p : 0), zoom: z, hist: [[performance.now(), x]] };
    v = 0;
    try { el.setPointerCapture?.(e.pointerId); } catch {}
  });
  el.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id || !(drag.dir.l2 > 1)) return;
    const mx = (e.clientX - drag.x0) / drag.zoom, my = (e.clientY - drag.y0) / drag.zoom;
    if (!drag.moved && Math.hypot(mx, my) < 6) return;
    if (!drag.moved) { drag.moved = true; el.classList.add('cks-dragging'); run(); }
    const n = decks.length;
    let raw = drag.s0 + (mx * drag.dir.dx + my * drag.dir.dy) / drag.dir.l2;
    if (raw < 0) raw *= .35; else if (raw > n - 1) raw = n - 1 + (raw - n + 1) * .35;
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
    if (!d.moved) {
      const c = d.card;
      if (c?.deck) { if (c.di === target && settledAt === target) confirm(); else go(c.di); }
      else if (c) go(target + (c.p > 0 ? 1 : -1));
      return;
    }
    const [t0, x0] = d.hist[0], [t1, x1] = d.hist[d.hist.length - 1];
    const vel = t1 > t0 ? (x1 - x0) / ((t1 - t0) / 1000) : 0;
    v = reduced() ? 0 : clamp(vel, -40, 40);
    go(x + v * GLIDE);
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
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
    const stepK = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (stepK) { if (target + stepK < 0 || target + stepK > n - 1) return; e.preventDefault(); go(target + stepK); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); go(e.key === 'Home' ? 0 : n - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); confirm(); }
  });

  // a lost GPU (rare): fall back to the flat picker with the same decks
  let flat = null;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; el.innerHTML = ''; el.classList.remove('cks-3d'); flat = mountFlat(el, { onSelect, onFront, hint }); flat.update({ decks, selected }); });

  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { measure(); if (!running) render(); }).observe(el);
  measure();

  // The deck names use the table's fonts: draw the deck cards again once they've loaded.
  let first = true;
  const api = {
    update({ decks: list = decks, selected: sel = selected } = {}) {
      if (flat) return flat.update({ decks: list, selected: sel });
      const fresh = !sameDecks(list);
      if (fresh) { decks = list.map(d => ({ ...d, iconKey: Object.keys(ICONS).find(k => ICONS[k] === d.icon) || 'hat' })); build(); }
      const i = Math.max(0, decks.findIndex(d => d.id === sel));
      const outside = sel !== selected;
      selected = sel;
      measure();
      if (first) {
        first = false;
        target = i; settledAt = i;
        x = reduced() ? i : i + 9;
        cards.forEach(c => { c.p = c.k - UPN - x; });
        cap.textContent = decks[i]?.name || '';
        if (document.fonts?.load) Promise.all(['400 64px "DM Serif Display"', '600 32px "Cormorant Garamond"', 'italic 600 32px "Cormorant Garamond"'].map(f => document.fonts.load(f).catch(() => {}))).then(() => { deckTex.clear(); cards.forEach(c => { if (c.deck) c.tex = deckTextures(c.deck); }); run(); });
        run();
      } else if ((outside || fresh) && decks[target]?.id !== sel) go(i);
      else run();
    },
    get front() { return flat ? flat.front : decks[target] || null; },
    get state() { return { x, v, target, running, drag: !!drag, mode: flat ? 'flat' : '3d' }; },
    go: i => (flat ? flat.go(i) : go(i)),
  };
  return api;
}
