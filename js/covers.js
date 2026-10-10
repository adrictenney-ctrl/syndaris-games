// Cover art for every game: a small illustrated scene (inline SVG, 600×400) with the game's
// title set like the front of a box. Shown on the home page tiles and the spotlight.
// Every id inside an SVG is prefixed with the game id so the covers can share one page.

import { makeKit } from './art-kit.js?v=68';
import { ART } from './art-index.js?v=68';
import { makeStill } from './still.js?v=68';

const SERIF = "'DM Serif Display', Georgia, serif";
const CORM = "'Cormorant Garamond', Georgia, serif";
const UI = "Manrope, 'Segoe UI', sans-serif";
const SYM = "'Noto Sans Symbols 2', 'Segoe UI Symbol', serif";

// ------------------------------------------------------------------ shared pieces

// Scene mode draws just the illustration, with no title: the picture on a tile, and the art on a box front.
let SCENE = false, LAST = null;
function shell(id, o, body) {
  const [c1, c2, c3] = o.bg;
  LAST = o;
  return `<svg viewBox="0 0 600 400" class="cover" role="img" aria-label="${o.title}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${id}-bg" cx="${o.cx ?? 50}%" cy="${o.cy ?? 42}%" r="80%"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient>
    <radialGradient id="${id}-vig" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
    <linearGradient id="${id}-scrim" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></linearGradient>
    <linearGradient id="${id}-foil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3cf"/><stop offset=".38" stop-color="#e9c77e"/><stop offset=".52" stop-color="#b8893a"/><stop offset=".62" stop-color="#d9b46a"/><stop offset="1" stop-color="#f3dda0"/></linearGradient>
    <linearGradient id="${id}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2b0"/><stop offset=".55" stop-color="#d8b46a"/><stop offset="1" stop-color="#a8823c"/></linearGradient>
    <linearGradient id="${id}-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e9dfc8"/></linearGradient>
    <filter id="${id}-sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".5"/></filter>
    <filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    ${o.defs || ''}
  </defs>
  <rect width="600" height="400" fill="url(#${id}-bg)"/>
  ${body}
  <rect width="600" height="400" fill="url(#${id}-vig)"/>
  ${SCENE ? '' : `<rect y="190" width="600" height="210" fill="url(#${id}-scrim)"/>${titleBlock(id, o)}`}
</svg>`;
}

function titleBlock(id, o) {
  const t = o.title, n = t.length;
  const size = o.size || (n <= 6 ? 66 : n <= 10 ? 58 : n <= 14 ? 50 : n <= 18 ? 42 : 36);
  const lines = o.lines || [t];
  const lh = size * 0.98;
  const y0 = 368 - (lines.length - 1) * lh;
  // The wordmark: a dark offset for depth, metallic foil on top, then a fine highlight edge.
  const words = lines.map((l, i) => {
    const y = y0 + i * lh, a = `x="34" y="${y}" font-family="${SERIF}" font-size="${size}" letter-spacing=".6"`;
    return `<text ${a} dx="0" dy="3" fill="#120c06" opacity=".7">${esc(l)}</text>`
      + `<text ${a} fill="url(#${id}-foil)" stroke="#5a3f14" stroke-width="1.1" style="paint-order:stroke">${esc(l)}</text>`
      + `<text ${a} fill="none" stroke="#fff6dc" stroke-opacity=".35" stroke-width=".6" transform="translate(-.5 -.7)">${esc(l)}</text>`;
  }).join('');
  // A gilt rule under the name, ending in a small diamond.
  const ry = y0 + (lines.length - 1) * lh + size * 0.2;
  const rule = `<path d="M36 ${ry} H190" stroke="#c9a35a" stroke-width="1.2" opacity=".8"/><path d="M196 ${ry - 4} L200 ${ry} L196 ${ry + 4} L192 ${ry} Z" fill="#e3c88c" opacity=".9"/>`;
  const tag = o.tag ? `<g opacity=".9"><path d="M36 ${y0 - size * 0.9} l4 -4 l4 4 l-4 4 Z" fill="#d8b46a"/><text x="50" y="${y0 - size * 0.86}" font-family="${UI}" font-weight="800" font-size="12" letter-spacing="3.2" fill="#efe3c6">${esc(o.tag.toUpperCase())}</text></g>` : '';
  return `<g filter="url(#${id}-sh)">${tag}${words}${rule}</g>`;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A playing card. o: { w, rank, suit, red, back, backFill, face (inner svg), rot }
function card(id, x, y, o = {}) {
  const w = o.w || 96, h = w * 1.4, r = w * 0.07;
  const col = o.red ? '#a3262a' : '#1d1b1a';
  let inner;
  if (o.back) inner = `<rect width="${w}" height="${h}" rx="${r}" fill="${o.backFill || '#6a1f24'}"/><rect x="${w * .07}" y="${w * .07}" width="${w * .86}" height="${h - w * .14}" rx="${r * .6}" fill="none" stroke="#e3c88c" stroke-width="${w * .02}"/>
    <path d="M${w / 2} ${h * .3} L${w * .72} ${h / 2} L${w / 2} ${h * .7} L${w * .28} ${h / 2} Z" fill="none" stroke="#e3c88c" stroke-width="${w * .018}"/>`;
  else {
    inner = `<rect width="${w}" height="${h}" rx="${r}" fill="url(#${id}-card)" stroke="rgba(0,0,0,.15)"/>`;
    if (o.rank) inner += `<text x="${w * .1}" y="${w * .25}" font-family="${SERIF}" font-size="${w * .22}" fill="${col}">${o.rank}</text><text x="${w * .1}" y="${w * .44}" font-family="${SYM}" font-size="${w * .17}" fill="${col}">${o.suit}</text>`;
    inner += o.face || (o.suit ? `<text x="${w / 2}" y="${h * .62}" text-anchor="middle" font-family="${SYM}" font-size="${w * .52}" fill="${col}">${o.suit}</text>` : '');
  }
  return `<g transform="translate(${x} ${y}) rotate(${o.rot || 0})" filter="url(#${id}-sh)"><g transform="translate(${-w / 2} ${-h / 2})">${inner}</g></g>`;
}

// A casino chip seen from above.
function chip(id, x, y, r, fill, o = {}) {
  const marks = Array.from({ length: 8 }, (_, i) => { const a = i * 45; return `<rect x="${-r * .09}" y="${-r}" width="${r * .18}" height="${r * .26}" fill="${o.edge || '#f3ead6'}" transform="rotate(${a})"/>`; }).join('');
  return `<g transform="translate(${x} ${y})" filter="url(#${id}-sh)"><circle r="${r}" fill="${fill}"/>${marks}<circle r="${r * .66}" fill="none" stroke="${o.edge || '#f3ead6'}" stroke-width="${r * .05}" stroke-dasharray="${r * .12} ${r * .1}"/><circle r="${r * .56}" fill="${fill}" stroke="rgba(255,255,255,.25)"/>${o.label ? `<text y="${r * .2}" text-anchor="middle" font-family="${SERIF}" font-size="${r * .55}" fill="${o.ink || '#f3ead6'}">${o.label}</text>` : ''}</g>`;
}

// A stack of chips seen from the side.
function stack(id, x, y, r, n, fill, edge = '#f3ead6') {
  let h = '';
  for (let i = 0; i < n; i++) {
    const yy = y - i * r * 0.22;
    h += `<ellipse cx="${x}" cy="${yy + r * .12}" rx="${r}" ry="${r * .36}" fill="${fill}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`;
    h += `<path d="M${x - r} ${yy} v${r * .12} a${r} ${r * .36} 0 0 0 ${2 * r} 0 v${-r * .12}" fill="${fill}"/>`;
    for (let k = -2; k <= 2; k++) h += `<rect x="${x + k * r * .38 - r * .06}" y="${yy + r * .02}" width="${r * .12}" height="${r * .14}" fill="${edge}" opacity=".85"/>`;
    h += `<ellipse cx="${x}" cy="${yy}" rx="${r}" ry="${r * .36}" fill="${fill}" stroke="rgba(255,255,255,.25)"/><ellipse cx="${x}" cy="${yy}" rx="${r * .6}" ry="${r * .2}" fill="none" stroke="${edge}" stroke-width="1.2" stroke-dasharray="4 3" opacity=".8"/>`;
  }
  return `<g filter="url(#${id}-sh)">${h}</g>`;
}

// A die. pips 1–6, or text for custom faces.
const PIP = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.27, .27], [.5, .5], [.73, .73]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.27, .27], [.73, .27], [.5, .5], [.27, .73], [.73, .73]], 6: [[.27, .25], [.73, .25], [.27, .5], [.73, .5], [.27, .75], [.73, .75]] };
function die(id, x, y, s, v, o = {}) {
  const pips = typeof v === 'number' ? PIP[v].map(([a, b]) => `<circle cx="${a * s}" cy="${b * s}" r="${s * .085}" fill="${o.pip || '#1d1b1a'}"/>`).join('') : `<text x="${s / 2}" y="${s * .68}" text-anchor="middle" font-family="${SERIF}" font-size="${s * .5}" fill="${o.pip || '#1d1b1a'}">${v}</text>`;
  return `<g transform="translate(${x} ${y}) rotate(${o.rot || 0})" filter="url(#${id}-sh)"><g transform="translate(${-s / 2} ${-s / 2})"><rect width="${s}" height="${s}" rx="${s * .18}" fill="${o.fill || '#f7f1e3'}"/><rect x="${s * .04}" y="${s * .04}" width="${s * .92}" height="${s * .92}" rx="${s * .15}" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="${s * .02}"/>${pips}</g></g>`;
}

const glow = (id, x, y, r, color, op = .55) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${op}" filter="url(#${id}-soft)"/>`;
const stars = (n, seed = 1, h = 260, op = .7) => { let s = seed, out = ''; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < n; i++) out += `<circle cx="${rnd() * 600}" cy="${rnd() * h}" r="${rnd() * 1.4 + .3}" fill="#fff" opacity="${(rnd() * .6 + .3) * op}"/>`; return out; };

export const COVERS = {};
const cover = (id, fn) => { COVERS[id] = fn; };
export function coverSVG(id) { return COVERS[id] ? COVERS[id](id) : ''; }

// ------------------------------------------------------------------ the boxes
// The illustration alone (no title), for the picture beside the box. `pre` keeps ids unique.
export function sceneSVG(id, pre = id + '-s') {
  if (!COVERS[id]) return '';
  SCENE = true;
  try { return COVERS[id](pre); } finally { SCENE = false; }
}
const fitTitle = (t, w, max) => {
  // DM Serif runs about .5em a character; long names go onto two lines.
  const words = t.split(' ');
  let lines = [t];
  if (t.length > 13 && words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const m = Math.max(a.length, b.length); if (!best || m < best.m) best = { m, l: [a, b] }; }
    lines = best.l;
  }
  const longest = Math.max(...lines.map(l => l.length));
  return { lines, size: Math.min(max, w / (longest * 0.52)) };
};
const playersTxt = G => (G.min === G.max ? `${G.min}` : `${G.min}–${G.max}`);
// The front of the box: the art full-bleed inside a double gilt frame, a lacquered title plaque,
// the maker's mark and a players seal. 400 × 400.
export function boxFrontSVG(id, G) {
  const pre = id + '-b';
  const scene = sceneSVG(id, pre);
  if (!scene) return '';
  const o = LAST, [c1, c2, c3] = o.bg;
  const { lines, size } = fitTitle(o.title, 330, 58);
  const lh = size * 1.0, by = 362 - (lines.length - 1) * lh;
  const plaqueTop = by - size - 34;
  const title = lines.map((l, i) => { const y = by + i * lh, a = `x="200" y="${y}" text-anchor="middle" font-family="${SERIF}" font-size="${size}"`; return `<text ${a} dy="3" fill="#000" opacity=".6">${esc(l)}</text><text ${a} fill="url(#${pre}-bf)" stroke="#4a3210" stroke-width="1" style="paint-order:stroke">${esc(l)}</text>`; }).join('');
  const tag = (o.tag || '').toUpperCase();
  const corner = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0 h26 M0 0 v26" stroke="url(#${pre}-bf)" stroke-width="3"/><path d="M6 6 h12 M6 6 v12" stroke="url(#${pre}-bf)" stroke-width="1.2"/><path d="M0 -5 L5 0 L0 5 L-5 0 Z" fill="url(#${pre}-bf)" transform="translate(6 6)"/></g>`;
  return `<svg viewBox="0 0 400 400" class="boxart" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(o.title)} box">
  <defs>
    <linearGradient id="${pre}-bf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d2"/><stop offset=".4" stop-color="#e6c47c"/><stop offset=".55" stop-color="#b08436"/><stop offset=".68" stop-color="#d8b268"/><stop offset="1" stop-color="#f4dfa4"/></linearGradient>
    <linearGradient id="${pre}-pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c3}" stop-opacity="0"/><stop offset=".28" stop-color="${c3}" stop-opacity=".86"/><stop offset="1" stop-color="#050403" stop-opacity=".96"/></linearGradient>
    <linearGradient id="${pre}-tp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050403" stop-opacity=".8"/><stop offset="1" stop-color="#050403" stop-opacity="0"/></linearGradient>
    <linearGradient id="${pre}-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
  </defs>
  <rect width="400" height="400" fill="${c3}"/>
  ${scene.replace('<svg ', '<svg x="0" y="0" width="400" height="400" ')}
  <rect y="0" width="400" height="74" fill="url(#${pre}-tp)"/>
  <rect y="${plaqueTop - 40}" width="400" height="${440 - plaqueTop}" fill="url(#${pre}-pl)"/>
  <rect x="9" y="9" width="382" height="382" fill="none" stroke="url(#${pre}-bf)" stroke-width="3"/>
  <rect x="17" y="17" width="366" height="366" fill="none" stroke="url(#${pre}-bf)" stroke-width="1" opacity=".8"/>
  ${corner(17, 17, 0)}${corner(383, 17, 90)}${corner(383, 383, 180)}${corner(17, 383, 270)}
  <text x="200" y="40" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="10.5" letter-spacing="4.5" fill="#ecdcb4">PLAY ON DISPLAY</text>
  <path d="M120 36 H140 M260 36 H280" stroke="#c9a35a" stroke-width="1"/>
  ${tag ? `<text x="200" y="${plaqueTop + 6}" text-anchor="middle" font-family="${UI}" font-weight="700" font-size="${tag.length > 40 ? 8.5 : 10}" letter-spacing="2.2" fill="#e9d7ae" opacity=".9">${esc(tag.length > 52 ? tag.slice(0, 50).replace(/\s+\S*$/, '') + '…' : tag)}</text>` : ''}
  ${title}
  <path d="M150 ${by + (lines.length - 1) * lh + 14} H190 M210 ${by + (lines.length - 1) * lh + 14} H250" stroke="#c9a35a" stroke-width="1.2"/><path d="M200 ${by + (lines.length - 1) * lh + 9} l5 5 l-5 5 l-5 -5 Z" fill="url(#${pre}-bf)"/>
  ${G ? `<g transform="translate(340 82)"><circle r="31" fill="${c2}" stroke="url(#${pre}-bf)" stroke-width="2.5"/><circle r="25" fill="none" stroke="url(#${pre}-bf)" stroke-width=".8" stroke-dasharray="2 2.6"/><text y="5" text-anchor="middle" font-family="${SERIF}" font-size="${playersTxt(G).length > 3 ? 17 : 21}" fill="url(#${pre}-bf)">${playersTxt(G)}</text><text y="17" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="6.5" letter-spacing="1.6" fill="#ecdcb4">PLAYERS</text></g>` : ''}
  <rect width="400" height="400" fill="url(#${pre}-sheen)"/>
</svg>`;
}
// The whole box as HTML: front, right side (spine) and lid top, put in 3D by CSS (.box3d).
export function boxHTML(id, G) {
  const front = boxFrontSVG(id, G);
  if (!front) return '';
  const [c1, c2, c3] = LAST.bg;
  return `<div class="box3d" style="--b1:${c1};--b2:${c2};--b3:${c3}"><div class="bx-front">${front}</div><div class="bx-side"><span>${esc(LAST.title)}</span></div><div class="bx-top"></div></div>`;
}

// ------------------------------------------------------------------ the covers

function jackFace(col, w) {
  const h = w * 1.4;
  return `<g transform="translate(${w / 2} ${h * .58}) scale(${w / 100})"><path d="M-22 -26 L-14 -40 L-6 -30 L0 -44 L6 -30 L14 -40 L22 -26 Z" fill="#d8b46a" stroke="${col}" stroke-width="1.5"/><circle cy="-12" r="13" fill="#f3e2c4" stroke="${col}" stroke-width="1.5"/><path d="M-26 30 Q-24 4 0 2 Q24 4 26 30 Z" fill="${col}"/><path d="M-10 6 L0 22 L10 6" fill="none" stroke="#d8b46a" stroke-width="3"/></g>`;
}

function vetoFace(c, mark, w = 100) { const h = w * 1.4; return `<rect x="${w * .1}" y="${w * .1}" width="${w * .8}" height="${h - w * .2}" rx="${w * .06}" fill="${c}" opacity=".9"/><text x="${w / 2}" y="${h * .64}" text-anchor="middle" font-family="${SERIF}" font-size="${w * .62}" fill="#f7f0df">${mark}</text>`; }

function koi(id, x, y, rot, col) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#${id}-sh)"><path d="M-60 0 Q-20 -26 30 -10 Q50 0 30 10 Q-20 26 -60 0 Z" fill="${col}"/><path d="M-58 0 L-86 -18 L-78 0 L-86 18 Z" fill="${col}" opacity=".85"/><path d="M-10 -14 L0 -30 L10 -12 Z M-10 14 L0 30 L10 12 Z" fill="${col}" opacity=".7"/><circle cx="22" cy="-4" r="2.6" fill="#1d1b1a"/><path d="M-30 -8 Q-12 -2 6 -10" fill="none" stroke="#1d1b1a" stroke-opacity=".2" stroke-width="5"/></g>`;
}

function kingFace(w) { const h = w * 1.4; return `<g transform="translate(${w / 2} ${h * .6}) scale(${w / 100})"><path d="M-22 -24 L-22 -42 L-11 -32 L0 -46 L11 -32 L22 -42 L22 -24 Z" fill="#d8b46a" stroke="#a3262a" stroke-width="1.5"/><circle cy="-10" r="13" fill="#f3e2c4" stroke="#a3262a" stroke-width="1.5"/><path d="M-9 0 Q0 14 9 0" fill="#e9dcc0" stroke="#a3262a"/><path d="M-26 32 Q-24 6 0 4 Q24 6 26 32 Z" fill="#a3262a"/></g>`; }

function eight(c, w) { const h = w * 1.4; return `<text x="${w / 2}" y="${h * .72}" text-anchor="middle" font-family="${SERIF}" font-size="${w * .8}" fill="${c}">8</text>`; }

function gear(id, x, y, r, n, c) {
  const pts = []; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.18; pts.push(`${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`); }
  return `<g filter="url(#${id}-sh)"><polygon points="${pts.join(' ')}" fill="${c}" stroke="rgba(0,0,0,.3)" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${r * .62}" fill="${c}" stroke="rgba(255,255,255,.18)" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${r * .22}" fill="#1d2a2a"/></g>`;
}

// A letter tile seen from above (Words 4 Fun, Upwords, Bananagrams…).
function ltile(x, y, s, ch, o = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${o.rot || 0})"><rect x="${-s / 2}" y="${-s / 2 + s * .06}" width="${s}" height="${s}" rx="${s * .16}" fill="${o.edge || '#b49a68'}"/><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * .16}" fill="${o.fill || '#f6ecd4'}"/><text y="${s * .22}" text-anchor="middle" font-family="${SERIF}" font-size="${s * .62}" fill="${o.ink || '#2a2140'}">${ch}</text>${o.pts ? `<text x="${s * .3}" y="${s * .38}" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="${s * .18}" fill="${o.ink || '#2a2140'}">${o.pts}</text>` : ''}</g>`;
}

function queenFace(col, w) {
  const h = w * 1.4;
  return `<g transform="translate(${w / 2} ${h * .58}) scale(${w / 100})"><path d="M-18 -30 L-12 -42 L-4 -32 L0 -46 L4 -32 L12 -42 L18 -30 Z" fill="#d8b46a" stroke="${col}" stroke-width="1.4"/><circle cy="-14" r="13" fill="#f3e2c4" stroke="${col}" stroke-width="1.5"/><path d="M-13 -16 Q-16 0 -10 8 M13 -16 Q16 0 10 8" stroke="#6a4a2a" stroke-width="4" fill="none"/><path d="M-26 32 Q-24 4 0 2 Q24 4 26 32 Z" fill="#3a3a6a"/><circle cy="14" r="3.5" fill="#d8b46a"/></g>`;
}

// A plain die face for covers.
function die6(id, x, y, s, v, rot = 0, fill = '#f7f1e3') { return die(id, x, y, s, v, { rot, fill }); }

function raceCover(id, o) {
  return shell(id, o, `
  <g transform="translate(300 150) rotate(-8)" filter="url(#${id}-sh)"><rect x="-140" y="-120" width="280" height="240" rx="14" fill="#f3ead6"/>
  ${Array.from({ length: o.n }, (_, k) => { const per = 4 * 200, u = (k / o.n) * per; let x, y; if (u < 200) { x = 100 - u; y = 100; } else if (u < 400) { x = -100; y = 100 - (u - 200); } else if (u < 600) { x = -100 + (u - 400); y = -100; } else { x = 100; y = -100 + (u - 600); } return `<circle cx="${x}" cy="${y}" r="${o.n > 40 ? 5.5 : 8}" fill="${o.corner && k % (o.n / 4) === o.n / 8 ? '#e8c35a' : '#fffaf0'}" stroke="#8a7a5a"/>`; }).join('')}
  ${['#3a7ad8', '#e8c23a', '#d8443a', '#4aa85a'].map((c, s) => { const ang = s * 90; return `<g transform="rotate(${ang})">${[0, 1, 2, 3].map(j => `<circle cx="0" cy="${80 - j * 18}" r="7" fill="${c}" opacity="${j === 3 ? .9 : .35}"/>`).join('')}<circle cx="${-30}" cy="112" r="8" fill="${c}"/><circle cx="${-14}" cy="112" r="8" fill="${c}"/></g>`; }).join('')}
  ${o.center || ''}</g>
  ${die(id, 500, 260, 70, 6, { rot: 16 })}`);
}
// ---- Party games batch 3
const partyCard = (id, x, y, rot, w, h, body, fill = '#fffaf0') => `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#${id}-sh)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="12" fill="${fill}"/>${body}</g>`;
// ---- Phone + table games batch 4
const emo = (x, y, s, e, rot = 0) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s}" transform="rotate(${rot} ${x} ${y})">${e}</text>`;
const pc = (id, x, y, rot, w, h, fill, body) => `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#${id}-sh)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) * .1}" fill="${fill}"/>${body}</g>`;
// ---- Family covers: a big emoji emblem over a backdrop that says what kind of game it is
// (quiz-show lights, casino felt, fanned cards, dice, a board grid, party confetti, a phone + screen).
const motif = (id, kind, c) => {
  if (kind === 'quiz') return `${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M300 -20 L${60 + i * 80} 260" stroke="#fff" stroke-opacity=".06" stroke-width="40"/>`).join('')}<ellipse cx="300" cy="250" rx="230" ry="40" fill="#000" opacity=".25"/>${Array.from({ length: 16 }, (_, i) => `<circle cx="${40 + i * 35}" cy="30" r="5" fill="#ffe8a0" opacity="${i % 2 ? .9 : .4}"/>`).join('')}`;
  if (kind === 'casino') return `<ellipse cx="300" cy="190" rx="290" ry="150" fill="#0e3a24" opacity=".55"/><ellipse cx="300" cy="190" rx="270" ry="135" fill="none" stroke="#e8c35a" stroke-opacity=".35" stroke-width="3"/>${[[110, 250, '#b8232a'], [130, 236, '#1d1b1a'], [480, 250, '#2a5ad8'], [500, 236, '#e8c35a']].map(([x, y, f]) => `<g transform="translate(${x} ${y})"><ellipse rx="26" ry="10" fill="${f}" stroke="#fff" stroke-dasharray="6 5" stroke-width="2"/></g>`).join('')}`;
  if (kind === 'cards') return [-28, -12, 4, 20].map((r, i) => `<g transform="translate(${170 + i * 18} 200) rotate(${r})" filter="url(#${id}-sh)"><rect x="-50" y="-72" width="100" height="144" rx="9" fill="url(#${id}-card)"/><text x="-40" y="-48" font-family="${SERIF}" font-size="22" fill="${i % 2 ? '#a3262a' : '#1d1b1a'}">${['A', 'K', 'Q', 'J'][i]}</text></g>`).join('') + [-20, 0, 20].map((r, i) => `<g transform="translate(${430 + i * 14} 210) rotate(${r})" filter="url(#${id}-sh)"><rect x="-44" y="-64" width="88" height="128" rx="8" fill="#6a1f24"/><rect x="-36" y="-56" width="72" height="112" rx="5" fill="none" stroke="#e3c88c" stroke-width="2"/></g>`).join('');
  if (kind === 'dice') return `${die(id, 140, 230, 70, 6, { rot: -16 })}${die(id, 470, 225, 64, 3, { rot: 14 })}${die(id, 520, 120, 44, 5, { rot: -8 })}${die(id, 90, 120, 40, 2, { rot: 10 })}`;
  if (kind === 'board') return `<g opacity=".28">${Array.from({ length: 9 }, (_, i) => `<path d="M${60 + i * 60} 20 V380 M60 ${20 + i * 45} H540" stroke="#fff" stroke-width="1.5"/>`).join('')}</g>${[[150, 110, '#e8473c'], [450, 290, '#3d8be8'], [480, 110, '#f2c230'], [120, 290, '#3fb35c']].map(([x, y, f]) => `<circle cx="${x}" cy="${y}" r="20" fill="${f}" filter="url(#${id}-sh)"/>`).join('')}`;
  if (kind === 'phone') return `<g filter="url(#${id}-sh)"><rect x="70" y="120" width="90" height="160" rx="16" fill="#111" stroke="#555" stroke-width="3"/><rect x="78" y="134" width="74" height="126" rx="6" fill="${c[0]}"/><rect x="440" y="110" width="90" height="160" rx="16" fill="#111" stroke="#555" stroke-width="3"/><rect x="448" y="124" width="74" height="126" rx="6" fill="${c[0]}"/></g>`;
  return Array.from({ length: 40 }, (_, i) => `<rect x="${(i * 97) % 600}" y="${(i * 53) % 260}" width="10" height="5" rx="2" fill="${['#f2c230', '#e8473c', '#3d8be8', '#3fb35c', '#a05ad8'][i % 5]}" opacity=".55" transform="rotate(${(i * 37) % 180} ${(i * 97) % 600} ${(i * 53) % 260})"/>`).join('');
};
export const emblemCover = (id, o) => shell(id, { title: o.title, tag: o.tag, bg: o.bg, cy: 30 }, `
  ${motif(id, o.kind, o.bg)}
  ${glow(id, 300, 150, 120, '#fff4d0', .28)}
  <circle cx="300" cy="150" r="92" fill="#000" opacity=".25"/>
  <circle cx="300" cy="150" r="84" fill="none" stroke="url(#${id}-gold)" stroke-width="5"/>
  <text x="300" y="${150 + 38}" text-anchor="middle" font-size="104">${o.emoji}</text>
`);

// ---- The painted covers (art-*.js) replace the older emblem covers.
const KIT = makeKit({ cover, shell, card, chip, stack, die, glow, stars, esc, ltile, kingFace, queenFace, jackFace, SERIF, CORM, UI, SYM });
KIT.T = makeStill(KIT);
for (const paint of ART) paint(KIT);
