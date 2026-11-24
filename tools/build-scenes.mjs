// Builds css/scene.css: the corner art on every game table (24 Nov 2026).
// Busy corners, a clear middle: two bigger corners (top-left, bottom-right) and two smaller ones,
// drawn as SVG so they stay sharp on a 4K TV. The default Vibrant look has five colour families
// (by the kind of game); each bought Style has its own design. Tables with their own scene
// (Go Fish's pond) keep it: see CUSTOM below. No crowns, no logo in the middle, no emoji.
//   Run:  node tools/build-scenes.mjs
import { writeFileSync } from 'node:fs';

const W = 400, H = 300;          // one corner, drawn as the top-left one
const CUSTOM = ['gofish'];       // games whose table already has its own scene

// ---------------------------------------------------------------- icons (centred on 0,0, ~40 across)
const I = {
  die: c => `<rect x="-18" y="-18" width="36" height="36" rx="8" fill="none" stroke="${c}" stroke-width="3.5"/><g fill="${c}"><circle cx="-8" cy="-8" r="3.4"/><circle cx="8" cy="-8" r="3.4"/><circle r="3.4"/><circle cx="-8" cy="8" r="3.4"/><circle cx="8" cy="8" r="3.4"/></g>`,
  spade: c => `<path d="M0-20C6-10 20-4 20 6c0 7-6 11-12 9-3-1-5-3-6-5 1 6 3 10 7 12H-11c4-2 6-6 7-12-1 2-3 4-6 5-6 2-12-2-12-9C-22-4-6-10 0-20z" fill="${c}"/>`,
  heart: c => `<path d="M0 18C-10 10-20 2-20-7c0-7 5-12 11-12 4 0 7 2 9 6 2-4 5-6 9-6 6 0 11 5 11 12 0 9-10 17-20 25z" fill="${c}"/>`,
  club: c => `<g fill="${c}"><circle cy="-9" r="8"/><circle cx="-9" cy="4" r="8"/><circle cx="9" cy="4" r="8"/><path d="M-3 2h6l3 18h-12z"/></g>`,
  diamond: c => `<path d="M0-20L14 0 0 20-14 0z" fill="${c}"/>`,
  card: c => `<rect x="-15" y="-21" width="30" height="42" rx="5" fill="none" stroke="${c}" stroke-width="3.2"/><path d="M0-8L7 0 0 8-7 0z" fill="${c}"/>`,
  chip: c => `<circle r="19" fill="none" stroke="${c}" stroke-width="3.5"/><circle r="10" fill="none" stroke="${c}" stroke-width="2.5"/><g stroke="${c}" stroke-width="4"><path d="M0-19v5M0 14v5M-19 0h5M14 0h5"/></g>`,
  pawn: c => `<path d="M0-20a7 7 0 1 1 0 14 7 7 0 1 1 0-14zM-6-5h12l-2 6 7 14h-22l7-14z" fill="${c}"/><rect x="-14" y="15" width="28" height="5" rx="2" fill="${c}"/>`,
  checker: c => `<circle r="18" fill="none" stroke="${c}" stroke-width="3.5"/><circle r="11" fill="none" stroke="${c}" stroke-width="2"/>`,
  sparkle: c => `<path d="M0-20C2-6 6-2 20 0 6 2 2 6 0 20-2 6-6 2-20 0-6-2-2-6 0-20z" fill="${c}"/>`,
  star: c => `<path d="M0-20l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="${c}"/>`,
  bubble: c => `<path d="M-18-14h36a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H-4l-10 9 2-9h-6a4 4 0 0 1-4-4v-16a4 4 0 0 1 4-4z" fill="none" stroke="${c}" stroke-width="3.2"/>`,
  question: c => `<path d="M-9-8c0-7 5-11 10-11s10 4 10 10c0 8-9 9-9 16" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/><circle cx="2" cy="16" r="3.5" fill="${c}"/>`,
  tile: c => `<rect x="-17" y="-17" width="34" height="34" rx="5" fill="none" stroke="${c}" stroke-width="3.2"/><path d="M-7 9L0-9 7 9M-4 3h8" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  eye: c => `<path d="M-21 0C-12-12 12-12 21 0 12 12-12 12-21 0z" fill="none" stroke="${c}" stroke-width="3.2"/><circle r="6" fill="${c}"/>`,
  key: c => `<circle cx="-9" r="8" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M-1 0h20M12 0v7M18 0v5" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  cup: c => `<path d="M-15-6h26v10a13 13 0 0 1-26 0zM11-2h4a5 5 0 0 1 0 10h-5" fill="none" stroke="${c}" stroke-width="3.2"/><path d="M-8-12c0-4 4-4 4-8M2-12c0-4 4-4 4-8" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`,
  coin: c => `<circle r="17" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M0-8v16M-4-4h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6" fill="none" stroke="${c}" stroke-width="2.6"/>`,
  bolt: c => `<path d="M4-20L-12 4h10l-4 16 16-24H0z" fill="${c}"/>`,
  arrow: c => `<path d="M-16 12C-6-6 6-10 16-8M8-15l8 7-9 6" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  spiral: c => `<path d="M0 0c3 0 4 3 2 5-3 3-8 1-9-3-1-6 4-10 10-10 8 0 13 8 10 15" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
};
// pixel icons for the arcade look (8x8 grids, 5px cells)
const px = (rows, c) => rows.map((r, y) => [...r].map((ch, x) => (ch === '#' ? `<rect x="${x * 5 - 20}" y="${y * 5 - 20}" width="5" height="5"/>` : '')).join('')).join('');
const P = {
  heart: c => `<g fill="${c}">${px(['.##.##..', '#######.', '#######.', '#######.', '.#####..', '..###...', '...#....'], c)}</g>`,
  coin: c => `<g fill="${c}">${px(['..####..', '.#....#.', '#..##..#', '#..##..#', '#..##..#', '#..##..#', '.#....#.', '..####..'], c)}</g>`,
  star: c => `<g fill="${c}">${px(['...##...', '...##...', '########', '.######.', '..####..', '.##..##.', '##....##'], c)}</g>`,
  die: c => `<g fill="${c}">${px(['########', '#......#', '#.#..#.#', '#......#', '#......#', '#.#..#.#', '#......#', '########'], c)}</g>`,
};

// ---------------------------------------------------------------- helpers
// Compact data URIs: single quotes inside, and only the characters that must be escaped.
const enc = svg => `url("data:image/svg+xml,${svg.replace(/\s+/g, ' ').trim().replace(/"/g, "'")
  .replace(/%/g, '%25').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
const MIRROR = { tl: '', tr: `translate(${W} 0) scale(-1 1)`, bl: `translate(0 ${H}) scale(1 -1)`, br: `translate(${W} ${H}) scale(-1 -1)` };
const place = (corner, x, y) => ({ tl: [x, y], tr: [W - x, y], bl: [x, H - y], br: [W - x, H - y] })[corner];

// A corner: `back` (mirrored into each corner), `icons` [[icon, x, y, rotate, scale, opacity]] kept upright.
function corner(design, c) {
  const icons = design.icons.map(([draw, x, y, r = 0, s = 1, o = 1]) => {
    const [X, Y] = place(c, x, y);
    return `<g transform="translate(${X} ${Y}) rotate(${c === 'tr' || c === 'bl' ? -r : r}) scale(${s})" opacity="${o}">${draw}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${design.defs ? `<defs>${design.defs}</defs>` : ''}<g transform="${MIRROR[c]}">${design.back}</g>${icons}</svg>`;
}

// ---------------------------------------------------------------- the Vibrant families
// Layered swooshes in the corner with a bright accent in the very corner and a highlight line.
function swoosh({ band, deep, glowA, glowB, line }) {
  return {
    defs: `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${glowA}"/><stop offset="1" stop-color="${glowB}"/></linearGradient>`,
    back: `<path d="M0 0H360C318 40 262 70 200 92 128 118 60 160 0 270Z" fill="${deep}" fill-opacity=".8"/>`
      + `<path d="M0 0H292C258 34 214 58 160 80 104 102 50 136 0 212Z" fill="${band}"/>`
      + `<path d="M0 0H206C182 30 148 52 106 70 66 88 30 112 0 152Z" fill="${deep}"/>`
      + `<path d="M0 0H134C118 40 82 70 0 114Z" fill="url(#g)"/>`
      + `<path d="M0 126C62 96 104 60 140 0H156C124 68 74 110 0 144Z" fill="${glowB}" fill-opacity=".75"/>`
      + `<path d="M0 216C54 138 108 104 162 82 216 60 260 36 294 0" fill="none" stroke="${line}" stroke-width="4" stroke-linecap="round" stroke-opacity=".7"/>`
      + `<path d="M0 276C62 160 130 120 202 94 264 72 320 42 362 0" fill="none" stroke="${line}" stroke-width="2.5" stroke-opacity=".3"/>`,
  };
}
const ICONS = {          // the kind of game -> its corner icons
  cards: ['spade', 'heart', 'card', 'diamond'],
  casino: ['chip', 'diamond', 'die', 'club'],
  board: ['pawn', 'die', 'checker', 'sparkle'],
  dice: ['die', 'die', 'sparkle', 'star'],
  party: ['sparkle', 'bubble', 'star', 'heart'],
  quiz: ['question', 'star', 'sparkle', 'bubble'],
  word: ['tile', 'bubble', 'sparkle', 'tile'],
  roles: ['eye', 'key', 'sparkle', 'spade'],
};
const FAMILY = {         // the kind of game -> the table's colours
  party: 'party', quiz: 'show', word: 'show', cards: 'felt', casino: 'felt', board: 'board', dice: 'board', roles: 'night',
};
const FAMILIES = {
  //       table base, lighter middle,     swoosh band, deep band,  corner glow A, B,       highlight, icons
  party: { base: '#3b1fae', mid: '#5a35d8', band: '#6a3cf0', deep: '#2a1488', glowA: '#c06bff', glowB: '#7a3cf0', line: '#d9a8ff', icon: '#d8c8ff' },
  show:  { base: '#25279a', mid: '#3a3dc8', band: '#2d2fb8', deep: '#1a1b78', glowA: '#ffd04a', glowB: '#ff9a2e', line: '#b46cff', icon: '#b9bcff' },
  felt:  { base: '#0d4f3e', mid: '#14705a', band: '#178a6c', deep: '#093a2e', glowA: '#5ce0b0', glowB: '#1fa880', line: '#8ff0cc', icon: '#9fe8cf' },
  board: { base: '#152a86', mid: '#1f3fb8', band: '#2456d8', deep: '#0d1c5c', glowA: '#4ad0ff', glowB: '#2a7cff', line: '#8fd8ff', icon: '#a9c8ff' },
  night: { base: '#17113e', mid: '#2a1f66', band: '#3a2a86', deep: '#0c0828', glowA: '#ff5fae', glowB: '#8a3cf0', line: '#ff9fd0', icon: '#c8b8ff' },
};
const iconSpots = [[180, 70, -14, 1.15, .45], [84, 176, 10, .95, .4], [266, 38, 12, .8, .4], [36, 226, 0, .6, .45]];
function vibrant(fam, kind) {
  const f = FAMILIES[fam];
  const d = swoosh(f);
  d.icons = ICONS[kind].map((name, i) => [I[name](f.icon), ...iconSpots[i]]);
  return d;
}

// ---------------------------------------------------------------- the eight Styles
const STYLES = {
  // Retro Arcade: stepped pixel blocks in hot pink, cyan and lime; pixel icons.
  arcade: {
    back: [[0, 0, 300, 20, '#ff2e88'], [0, 20, 240, 20, '#ff2e88'], [0, 40, 180, 20, '#ff2e88'], [0, 60, 120, 20, '#ff2e88'], [0, 80, 80, 20, '#ff2e88'], [0, 100, 40, 40, '#ff2e88'],
      [0, 0, 200, 20, '#00e5ff'], [0, 20, 140, 20, '#00e5ff'], [0, 40, 80, 20, '#00e5ff'], [0, 60, 40, 20, '#00e5ff'],
      [0, 0, 80, 20, '#b6ff00'], [0, 20, 40, 20, '#b6ff00'],
      [320, 0, 20, 20, '#ff2e88'], [260, 40, 20, 20, '#00e5ff'], [200, 80, 20, 20, '#b6ff00'], [120, 120, 20, 20, '#ff2e88'], [60, 160, 20, 20, '#00e5ff'], [20, 200, 20, 20, '#ffe600']]
      .map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" fill-opacity=".75"/>`).join(''),
    icons: [[P.heart('#ff2e88'), 170, 82, 0, 1, .55], [P.coin('#ffe600'), 80, 150, 0, .9, .5], [P.star('#00e5ff'), 262, 92, 0, .8, .45], [P.die('#b6ff00'), 150, 170, 0, .7, .35]],
  },
  // Neon Night: glowing tubes curving round the corner, neon outline icons.
  neon: {
    defs: `<filter id="n" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    back: `<g filter="url(#n)" fill="none" stroke-linecap="round">`
      + `<path d="M0 200C70 120 160 70 300 10" stroke="#ff3dcb" stroke-width="5"/>`
      + `<path d="M0 150C56 92 120 52 220 8" stroke="#b026ff" stroke-width="4"/>`
      + `<path d="M0 96C34 62 70 34 120 6" stroke="#3d8bff" stroke-width="4"/>`
      + `<path d="M0 250C90 160 190 110 360 40" stroke="#3dffb5" stroke-width="2.5" stroke-opacity=".6"/></g>`,
    icons: [[`<g filter="url(#n)">${I.star('#ff3dcb')}</g>`, 120, 120, 12, .8, .55], [`<g filter="url(#n)">${I.die('#3dffb5')}</g>`, 220, 76, -12, .75, .5], [`<g filter="url(#n)">${I.bolt('#ffe14d')}</g>`, 54, 220, 0, .7, .5], [`<g filter="url(#n)">${I.spade('#3d8bff')}</g>`, 290, 44, 8, .55, .45]],
  },
  // Cozy Café: a cream wave and a latte-coloured one, coffee-cup rings, steam and a cup.
  cafe: {
    back: `<path d="M0 0H330C292 36 230 58 170 82 110 106 54 140 0 230Z" fill="#e9d3b4" fill-opacity=".22"/>`
      + `<path d="M0 0H220C192 34 150 56 106 76 66 94 30 120 0 160Z" fill="#c8915e" fill-opacity=".35"/>`
      + `<path d="M0 0H96C80 26 52 48 0 76Z" fill="#f2c4c0" fill-opacity=".55"/>`
      + `<circle cx="250" cy="120" r="34" fill="none" stroke="#e9d3b4" stroke-opacity=".22" stroke-width="5" stroke-dasharray="150 30"/>`
      + `<circle cx="92" cy="226" r="24" fill="none" stroke="#e9d3b4" stroke-opacity=".18" stroke-width="4" stroke-dasharray="100 24"/>`,
    icons: [[I.cup('#f6e6cf'), 160, 120, -8, 1, .4], [I.heart('#f2c4c0'), 64, 120, 10, .6, .45], [I.spiral('#f6e6cf'), 300, 40, 0, .7, .3], [I.diamond('#f2c4c0'), 210, 40, 0, .45, .35]],
  },
  // Comic Book: a halftone corner, a jagged burst and speed lines, black ink outlines.
  comic: {
    defs: `<pattern id="h" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="3.2" fill="#ffd400"/></pattern>`,
    back: `<path d="M0 0H320C260 60 160 110 0 240Z" fill="url(#h)" fill-opacity=".55"/>`
      + `<path d="M0 0H190C160 40 110 80 0 136Z" fill="#e8262b" stroke="#111" stroke-width="5" fill-opacity=".85"/>`
      + `<path d="M60 18l14 26 28-8-12 26 28 14-30 6 6 30-24-18-20 22-2-30-30-4 24-18-14-26 28 6z" fill="#ffd400" stroke="#111" stroke-width="4" transform="translate(-30 -12) scale(.9)"/>`
      + `<g stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"><path d="M210 90l70-34M180 126l84-36M150 164l70-26"/></g>`,
    icons: [[I.bolt('#ffd400'), 240, 120, 10, .9, .55], [I.star('#fff'), 70, 200, -10, .7, .45], [I.diamond('#e8262b'), 300, 40, 0, .6, .55], [I.die('#fff'), 150, 200, 14, .6, .3]],
  },
  // Game Show: spotlight rays from the corner and an arc of marquee bulbs, in gold on navy.
  gameshow: {
    defs: `<radialGradient id="r" cx="0" cy="0" r="1"><stop offset="0" stop-color="#f5c542" stop-opacity=".55"/><stop offset="1" stop-color="#f5c542" stop-opacity="0"/></radialGradient>`,
    back: `<g fill="url(#r)">${[0, 14, 28, 42, 56, 70].map(a => `<path d="M0 0L${(400 * Math.cos((a + 6) * Math.PI / 180)).toFixed(0)} ${(400 * Math.sin((a + 6) * Math.PI / 180)).toFixed(0)}L${(400 * Math.cos((a + 13) * Math.PI / 180)).toFixed(0)} ${(400 * Math.sin((a + 13) * Math.PI / 180)).toFixed(0)}Z"/>`).join('')}</g>`
      + `<path d="M0 150A150 150 0 0 0 150 0" fill="none" stroke="#f5c542" stroke-opacity=".5" stroke-width="10"/>`
      + Array.from({ length: 9 }, (_, i) => { const a = (i + .5) * (90 / 9) * Math.PI / 180; return `<circle cx="${(150 * Math.sin(a)).toFixed(1)}" cy="${(150 * Math.cos(a)).toFixed(1)}" r="5.5" fill="#fff6cf"/>`; }).join(''),
    icons: [[I.star('#f5c542'), 200, 96, 10, .9, .5], [I.sparkle('#fff6cf'), 90, 200, 0, .7, .45], [I.question('#f5c542'), 300, 40, -8, .6, .4], [I.sparkle('#f5c542'), 250, 170, 0, .5, .35]],
  },
  // Sketchbook: wobbly pencil swooshes, a highlighter stroke and doodles.
  sketch: {
    back: `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`
      + `<path d="M-4 120C40 80 70 64 112 30 126 18 140 8 150-4" stroke="#ffe45c" stroke-opacity=".45" stroke-width="26"/>`
      + `<path d="M0 190C60 130 120 96 190 58 230 36 262 18 290 0M4 198C62 138 124 100 188 66 226 44 258 26 296 4" stroke="#dfe6f2" stroke-opacity=".5" stroke-width="2.5"/>`
      + `<path d="M0 240C90 170 180 120 280 70 320 50 350 30 370 0" stroke="#9fb8e8" stroke-opacity=".4" stroke-width="2.5" stroke-dasharray="10 7"/></g>`,
    icons: [[I.star('#dfe6f2').replace('fill=', 'fill="none" stroke-width="2.6" stroke='), 170, 112, -10, 1, .55], [I.arrow('#ffe45c'), 76, 200, 0, .9, .55], [I.spiral('#dfe6f2'), 260, 40, 0, .8, .45], [I.heart('#ff8a8a').replace('fill=', 'fill="none" stroke-width="2.6" stroke='), 240, 150, 12, .6, .45]],
  },
  // Midnight Luxe: an art-deco fan and thin gold double lines with lozenges.
  luxe: {
    back: `<g fill="none" stroke="#c9a24d">`
      + Array.from({ length: 10 }, (_, i) => { const a = (i * 10) * Math.PI / 180; return `<path d="M0 0L${(170 * Math.cos(a)).toFixed(1)} ${(170 * Math.sin(a)).toFixed(1)}" stroke-opacity=".35" stroke-width="1.5"/>`; }).join('')
      + `<path d="M0 170A170 170 0 0 0 170 0" stroke-opacity=".7" stroke-width="2.5"/><path d="M0 184A184 184 0 0 0 184 0" stroke-opacity=".45" stroke-width="1.2"/>`
      + `<path d="M0 90A90 90 0 0 0 90 0" stroke-opacity=".6" stroke-width="2"/>`
      + `<path d="M0 252L252 0M0 264L264 0" stroke-opacity=".3" stroke-width="1.2"/></g>`
      + `<path d="M126 114l8-12 8 12-8 12z" fill="#c9a24d" fill-opacity=".8"/>`,
    icons: [[I.diamond('#c9a24d'), 240, 150, 0, .55, .5], [I.spade('#c9a24d'), 90, 230, 0, .5, .4], [I.sparkle('#e8d29a'), 300, 50, 0, .45, .5], [I.diamond('#e8d29a'), 40, 120, 0, .3, .5]],
  },
  // Paper Craft: three cut-paper layers with soft shadows, a paper star and confetti.
  paper: {
    defs: `<filter id="s" x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="3" dy="4" stdDeviation="3" flood-color="#000" flood-opacity=".35"/></filter>`,
    back: `<g filter="url(#s)">`
      + `<path d="M0 0H330C300 30 270 44 236 62 196 82 170 70 128 98 84 128 52 150 0 236Z" fill="#17bebb"/>`
      + `<path d="M0 0H230C210 26 184 40 152 56 120 72 96 72 66 96 40 118 22 136 0 170Z" fill="#ff7b5c"/>`
      + `<path d="M0 0H120C106 22 84 36 58 48 34 60 18 76 0 98Z" fill="#ffd166"/></g>`,
    icons: [[`<g filter="url(#s)">${I.star('#fff6e0')}</g>`, 190, 110, -12, .8, .9], [`<rect x="-6" y="-3" width="12" height="6" fill="#ff7b5c"/>`, 100, 190, 30, 1, .9], [`<rect x="-6" y="-3" width="12" height="6" fill="#17bebb"/>`, 270, 120, -20, 1, .9], [`<circle r="5" fill="#ffd166"/>`, 60, 230, 0, 1, .9]],
  },
};

// ---------------------------------------------------------------- the stylesheet
const corners = d => ['tl', 'tr', 'bl', 'br'].map(c => `--sc-${c}: ${enc(corner(d, c))};`).join('\n  ');
let css = `/* GENERATED by tools/build-scenes.mjs — edit that file, then run: node tools/build-scenes.mjs
   The corner art on every game table: busy corners, a clear middle (cards and boards go there).
   Two bigger corners (top-left, bottom-right) and two smaller ones. The default Vibrant look picks
   its colours from the kind of game (body[data-family], set by table.js); each bought Style has its
   own design. Tables with their own scene keep it: ${CUSTOM.join(', ')}. */
#scene { position: absolute; inset: 0; pointer-events: none; --sc-w: min(44vmin, 28vw); }
#scene i { position: absolute; display: block; aspect-ratio: 4 / 3; background: no-repeat 0 0 / 100% 100%; }
#scene .tl { left: 0; top: 0; width: var(--sc-w); background-image: var(--sc-tl); }
#scene .br { right: 0; bottom: 0; width: var(--sc-w); background-image: var(--sc-br); }
#scene .tr { right: 0; top: 0; width: calc(var(--sc-w) * .62); background-image: var(--sc-tr); }
#scene .bl { left: 0; bottom: 0; width: calc(var(--sc-w) * .62); background-image: var(--sc-bl); }
${CUSTOM.map(g => `body[data-game="${g}"] #scene`).join(', ')} { display: none; }
/* The old Classic look has no corner art. */
html[data-style="classic"] #scene { display: none; }

/* ---------------- Vibrant: the table colour per family, then its corners per kind of game ---------------- */
`;
const notCustom = CUSTOM.map(g => `:not([data-game="${g}"])`).join('');
for (const [fam, f] of Object.entries(FAMILIES)) {
  css += `html[data-style="vibrant"]:not([data-skin]) body[data-family="${fam}"]${notCustom} #felt { background: ${f.base} !important; }
html[data-style="vibrant"]:not([data-skin]) body[data-family="${fam}"]${notCustom} #felt::before {
  background:
    var(--v-grain) 0 0 / 180px,
    radial-gradient(ellipse 50% 44% at 50% 51%, rgba(255, 255, 255, .06) 0 97%, rgba(255, 255, 255, .12) 97.5% 98.6%, transparent 99%),
    radial-gradient(ellipse 70% 60% at 50% 45%, ${f.mid}, transparent 75%),
    radial-gradient(ellipse 120% 90% at 50% 40%, transparent 50%, rgba(4, 2, 20, .5)),
    ${f.base} !important;
  background-blend-mode: overlay, normal, normal, normal, normal !important;
}
`;
}
for (const kind of Object.keys(ICONS)) css += `html[data-style="vibrant"]:not([data-skin]) body[data-kind="${kind}"] #scene {\n  ${corners(vibrant(FAMILY[kind], kind))}\n}\n`;
css += `\n/* ---------------- the eight Styles ---------------- */\n`;
for (const [id, d] of Object.entries(STYLES)) css += `html[data-skin="${id}"] #scene {\n  ${corners(d)}\n}\n`;
css += `/* Gentle on a big TV: a little dimmer on the Styles whose art is bright. */
html[data-skin="arcade"] #scene, html[data-skin="paper"] #scene, html[data-skin="comic"] #scene { opacity: .8; }
`;
writeFileSync(new URL('../css/scene.css', import.meta.url), css);
writeFileSync(new URL('../js/game-kinds.js', import.meta.url), `// GENERATED by tools/build-scenes.mjs from its FAMILY table. The colour family of each kind of game
// (the kinds themselves are in js/game-kind-list.js, shared with the home page).
export const FAMILY = ${JSON.stringify(FAMILY)};
export const CUSTOM_TABLES = ${JSON.stringify(CUSTOM)};
`);
console.log('css/scene.css', (css.length / 1024).toFixed(0) + ' KB');

// A preview of every design on a plain 16:9 table (not published): _scenes.html
let boxN = 0, boxCss = '';
const box = (label, bg, d) => { const n = boxN++; boxCss += `.d${n}{background:${bg}}` + ['tl', 'tr', 'bl', 'br'].map(c => `.d${n} .${c}{background-image:${enc(corner(d, c))}}`).join(''); return `<figure><div class="t d${n}"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i><b>${label}</b></div></figure>`; };
const SKIN_BG = { arcade: '#0a0a12', neon: '#07070f', cafe: '#4e321d', comic: '#1553b8', gameshow: '#0b1640', sketch: '#263046', luxe: '#0d0d0d', paper: '#6b4a2b' };
const figs = Object.keys(ICONS).map(k => { const f = FAMILIES[FAMILY[k]]; return box(`Vibrant · ${k}`, `radial-gradient(ellipse 70% 60% at 50% 45%, ${f.mid}, ${f.base} 75%)`, vibrant(FAMILY[k], k)); }).join('') + Object.entries(STYLES).map(([id, d]) => box(`Style · ${id}`, SKIN_BG[id], d)).join('');
writeFileSync(new URL('../_scenes.html', import.meta.url), `<!doctype html><meta charset="utf-8"><title>Table scenes</title>
<style>body{margin:0;padding:16px;background:#111;font:600 14px system-ui;color:#fff;display:grid;grid-template-columns:repeat(auto-fill,minmax(560px,1fr));gap:16px}
figure{margin:0}.t{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:10px}.t i{position:absolute;aspect-ratio:4/3;background:no-repeat 0 0/100% 100%}
.tl{left:0;top:0;width:28%}.br{right:0;bottom:0;width:28%}.tr{right:0;top:0;width:17.4%}.bl{left:0;bottom:0;width:17.4%}
b{position:absolute;left:50%;top:50%;translate:-50% -50%;opacity:.7}${boxCss}</style>${figs}`);
