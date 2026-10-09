// Cover art for every game: a small illustrated scene (inline SVG, 600×400) with the game's
// title set like the front of a box. Shown on the home page tiles and the spotlight.
// Every id inside an SVG is prefixed with the game id so the covers can share one page.

const SERIF = "'DM Serif Display', Georgia, serif";
const CORM = "'Cormorant Garamond', Georgia, serif";
const UI = "Manrope, 'Segoe UI', sans-serif";
const SYM = "'Noto Sans Symbols 2', 'Segoe UI Symbol', serif";

// ------------------------------------------------------------------ shared pieces

function shell(id, o, body) {
  const [c1, c2, c3] = o.bg;
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
  <rect y="190" width="600" height="210" fill="url(#${id}-scrim)"/>
  ${titleBlock(id, o)}
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

// ------------------------------------------------------------------ the covers

cover('euchre', id => shell(id, { title: 'Euchre', tag: 'Partners · trumps · bowers', bg: ['#2f6b50', '#1d4433', '#0c1f17'], cy: 35 }, `
  ${glow(id, 300, 150, 150, '#7fd1a6', .25)}
  <g opacity=".18" stroke="#c9e8d4" fill="none"><ellipse cx="300" cy="190" rx="250" ry="120"/><ellipse cx="300" cy="190" rx="215" ry="98"/></g>
  ${card(id, 215, 165, { rank: 'A', suit: '♥', red: true, rot: -24, w: 124 })}
  ${card(id, 390, 165, { rank: 'J', suit: '♦', red: true, rot: 22, w: 124, face: jackFace('#a3262a', 124) })}
  ${card(id, 302, 140, { rank: 'J', suit: '♥', red: true, rot: 0, w: 134, face: jackFace('#a3262a', 134) })}
`));
function jackFace(col, w) {
  const h = w * 1.4;
  return `<g transform="translate(${w / 2} ${h * .58}) scale(${w / 100})"><path d="M-22 -26 L-14 -40 L-6 -30 L0 -44 L6 -30 L14 -40 L22 -26 Z" fill="#d8b46a" stroke="${col}" stroke-width="1.5"/><circle cy="-12" r="13" fill="#f3e2c4" stroke="${col}" stroke-width="1.5"/><path d="M-26 30 Q-24 4 0 2 Q24 4 26 30 Z" fill="${col}"/><path d="M-10 6 L0 22 L10 6" fill="none" stroke="#d8b46a" stroke-width="3"/></g>`;
}

cover('holdem', id => shell(id, { title: "Texas Hold'em", tag: 'No-limit · chips · nerve', bg: ['#2c4870', '#1c2f4a', '#0a121e'] }, `
  ${glow(id, 300, 170, 170, '#8fb4e8', .2)}
  ${stack(id, 120, 230, 40, 9, '#7a1f24')}${stack(id, 200, 250, 40, 6, '#1d1d22', '#d8b46a')}${stack(id, 470, 240, 38, 7, '#2f5a85')}
  ${card(id, 278, 158, { rank: 'A', suit: '♠', rot: -12, w: 124 })}${card(id, 366, 160, { rank: 'A', suit: '♥', red: true, rot: 10, w: 124 })}
  ${chip(id, 520, 120, 30, '#d8b46a', { label: '$', ink: '#3a2a0a', edge: '#fff6dc' })}
`));

cover('veto', id => shell(id, { title: 'Veto', tag: 'Match · block · shed', bg: ['#7a5232', '#4b301c', '#1e120a'] }, `
  <g opacity=".25" stroke="#2a180c">${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 36 + 10} Q300 ${i * 36 - 6} 600 ${i * 36 + 14}" fill="none"/>`).join('')}</g>
  ${card(id, 210, 170, { w: 100, rot: -16, face: vetoFace('#3e6b8a', '7') })}
  ${card(id, 400, 175, { w: 100, rot: 15, face: vetoFace('#4f7a3a', '2') })}
  ${card(id, 305, 160, { w: 112, rot: -2, face: vetoFace('#9b3b2e', '✕', 112) })}
  <g transform="translate(400 120) rotate(-14)" opacity=".92"><rect x="-70" y="-26" width="140" height="52" rx="6" fill="none" stroke="#c0392b" stroke-width="6"/><text y="14" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="36" letter-spacing="6" fill="#c0392b">VETO</text></g>
`));
function vetoFace(c, mark, w = 100) { const h = w * 1.4; return `<rect x="${w * .1}" y="${w * .1}" width="${w * .8}" height="${h - w * .2}" rx="${w * .06}" fill="${c}" opacity=".9"/><text x="${w / 2}" y="${h * .64}" text-anchor="middle" font-family="${SERIF}" font-size="${w * .62}" fill="#f7f0df">${mark}</text>`; }

cover('gofish', id => shell(id, { title: 'Go Fish', tag: 'Ask · fish · collect', bg: ['#2a6a75', '#173f48', '#08191d'], cy: 35 }, `
  ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${150 + (i % 3) * 160}" cy="${90 + Math.floor(i / 3) * 120}" rx="${60 + i * 6}" ry="${16 + i * 2}" fill="none" stroke="#9fd6dc" stroke-opacity=".18" stroke-width="2"/>`).join('')}
  ${koi(id, 170, 210, -20, '#e07a3c')}${koi(id, 420, 140, 160, '#f3ead6')}${koi(id, 330, 280, 30, '#d9503c')}
  <path d="M470 0 L470 170" stroke="#e9dcc0" stroke-width="1.5" opacity=".7"/>
  ${card(id, 470, 215, { rank: '7', suit: '♣', w: 70, rot: 6 })}
  <path d="M470 170 q8 6 0 14" fill="none" stroke="#c9b48c" stroke-width="3"/>
  <g fill="#3f7a4a" opacity=".85"><ellipse cx="80" cy="90" rx="44" ry="26"/><ellipse cx="540" cy="300" rx="50" ry="28"/></g>
`));
function koi(id, x, y, rot, col) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#${id}-sh)"><path d="M-60 0 Q-20 -26 30 -10 Q50 0 30 10 Q-20 26 -60 0 Z" fill="${col}"/><path d="M-58 0 L-86 -18 L-78 0 L-86 18 Z" fill="${col}" opacity=".85"/><path d="M-10 -14 L0 -30 L10 -12 Z M-10 14 L0 30 L10 12 Z" fill="${col}" opacity=".7"/><circle cx="22" cy="-4" r="2.6" fill="#1d1b1a"/><path d="M-30 -8 Q-12 -2 6 -10" fill="none" stroke="#1d1b1a" stroke-opacity=".2" stroke-width="5"/></g>`;
}

cover('chess', id => shell(id, { title: 'Chess', tag: 'The classic duel', bg: ['#5a3c24', '#33200f', '#110a04'], cy: 30 }, `
  <g transform="translate(300 300) scale(1 .42) rotate(45)" opacity=".95">${Array.from({ length: 64 }, (_, i) => `<rect x="${(i % 8) * 46 - 184}" y="${Math.floor(i / 8) * 46 - 184}" width="46" height="46" fill="${(i + Math.floor(i / 8)) % 2 ? '#2a1a0c' : '#c9a777'}"/>`).join('')}</g>
  ${glow(id, 300, 140, 120, '#ffd9a0', .25)}
  <g filter="url(#${id}-sh)"><text x="235" y="250" text-anchor="middle" font-family="${SYM}" font-size="170" fill="#f3e7d0">♚</text><text x="370" y="262" text-anchor="middle" font-family="${SYM}" font-size="150" fill="#1d1612" stroke="#c9a777" stroke-width="1.5">♛</text></g>
`));

cover('backgammon', id => shell(id, { title: 'Backgammon', tag: 'Race · hit · double', bg: ['#7a4a26', '#4a2a14', '#1a0d05'] }, `
  <g filter="url(#${id}-sh)"><rect x="40" y="40" width="520" height="300" rx="10" fill="#2e1a0c"/><rect x="56" y="54" width="232" height="272" fill="#e6d3ad"/><rect x="312" y="54" width="232" height="272" fill="#e6d3ad"/>
  ${Array.from({ length: 12 }, (_, i) => { const x = (i < 6 ? 56 : 312) + (i % 6) * 38.6; return `<path d="M${x} 54 L${x + 19.3} 180 L${x + 38.6} 54 Z" fill="${i % 2 ? '#7a2b26' : '#2f4a3a'}"/><path d="M${x} 326 L${x + 19.3} 200 L${x + 38.6} 326 Z" fill="${i % 2 ? '#2f4a3a' : '#7a2b26'}"/>`; }).join('')}</g>
  ${[[75, 72], [75, 104], [75, 136], [500, 308], [500, 276], [380, 72], [380, 104]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="15" fill="${i > 2 && i < 5 ? '#1d1b1a' : '#f7f0df'}" stroke="rgba(0,0,0,.3)" filter="url(#${id}-sh)"/>`).join('')}
  ${die(id, 410, 210, 46, 6, { rot: 12 })}${die(id, 470, 230, 46, 4, { rot: -8 })}
  <g transform="translate(220 200) rotate(-8)" filter="url(#${id}-sh)"><rect x="-26" y="-26" width="52" height="52" rx="8" fill="#f7f0df"/><text y="14" text-anchor="middle" font-family="${SERIF}" font-size="34" fill="#7a2b26">64</text></g>
`));

cover('sketch', id => shell(id, { title: 'Sketch & Guess', tag: 'Draw it · guess it', bg: ['#5e5348', '#3a322b', '#141110'], defs: `<pattern id="${id}-lines" width="600" height="22" patternUnits="userSpaceOnUse"><path d="M0 21 H600" stroke="#9fb6d6" stroke-opacity=".5"/></pattern>` }, `
  <g transform="rotate(-4 300 180)" filter="url(#${id}-sh)"><rect x="110" y="40" width="380" height="270" rx="4" fill="#fbf6ea"/><rect x="110" y="40" width="380" height="270" fill="url(#${id}-lines)"/><path d="M150 40 V310" stroke="#d98a8a" stroke-width="1.5"/>
  <path d="M200 240 Q210 140 290 130 Q370 120 390 230" fill="none" stroke="#a8322a" stroke-width="7" stroke-linecap="round"/><circle cx="295" cy="200" r="42" fill="none" stroke="#1d1b1a" stroke-width="5"/><path d="M280 190h1M312 190h1M278 216q17 14 34 0" stroke="#1d1b1a" stroke-width="6" stroke-linecap="round" fill="none"/>
  <text x="420" y="120" font-family="${SERIF}" font-size="64" fill="#2f5a85">?</text></g>
  <g transform="translate(470 250) rotate(38)" filter="url(#${id}-sh)"><rect x="-8" y="-90" width="16" height="150" fill="#e6b84a"/><path d="M-8 60 L0 84 L8 60 Z" fill="#e9d5b0"/><path d="M-3 76 L0 84 L3 76 Z" fill="#1d1b1a"/><rect x="-8" y="-104" width="16" height="16" fill="#d98a8a"/></g>
`));

cover('chefskiss', id => shell(id, { title: "Chef's Kiss", tag: 'The party game of taste', bg: ['#7a3a3a', '#4a1f22', '#1a0a0b'] }, `
  ${glow(id, 300, 160, 140, '#ffb59a', .25)}
  <g filter="url(#${id}-sh)"><ellipse cx="300" cy="250" rx="170" ry="48" fill="#f3ead6"/><ellipse cx="300" cy="244" rx="128" ry="34" fill="#e3d6bb"/></g>
  <g transform="translate(300 120)" filter="url(#${id}-sh)"><path d="M-60 40 Q-90 0 -50 -20 Q-40 -60 0 -55 Q40 -60 50 -20 Q90 0 60 40 Z" fill="#fbf6ea"/><rect x="-56" y="34" width="112" height="34" rx="6" fill="#fbf6ea" stroke="#d9cdb2"/></g>
  <g transform="translate(300 232)"><path d="M-40 0 Q-20 -24 0 -8 Q20 -24 40 0 Q20 18 0 10 Q-20 18 -40 0 Z" fill="#b8323a"/><path d="M-40 0 Q0 6 40 0" stroke="#7a1a22" stroke-width="3" fill="none"/></g>
  ${[[150, 140], [460, 150], [430, 80]].map(([x, y]) => `<text x="${x}" y="${y}" font-family="${SYM}" font-size="34" fill="#e3c88c" opacity=".8">✦</text>`).join('')}
`));

cover('insidejob', id => shell(id, { title: 'Inside Job', tag: 'Crack the vault together', bg: ['#2a4a6e', '#1a3050', '#08121f'], defs: `<pattern id="${id}-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#9fc3e6" stroke-opacity=".18"/></pattern>` }, `
  <rect width="600" height="400" fill="url(#${id}-grid)"/>
  <g stroke="#cfe2f5" stroke-opacity=".5" fill="none" stroke-width="2"><rect x="60" y="50" width="200" height="140"/><path d="M60 120 H160 V190 M200 50 V120"/><text x="70" y="70" fill="#cfe2f5" stroke="none" font-family="${UI}" font-size="11" letter-spacing="2" opacity=".7">VAULT · LEVEL B</text></g>
  <g transform="translate(400 150)" filter="url(#${id}-sh)"><circle r="96" fill="#8a96a3"/><circle r="84" fill="#5a6673"/><circle r="70" fill="#9aa6b3" stroke="#3a4450" stroke-width="3"/>${Array.from({ length: 6 }, (_, i) => `<rect x="-5" y="-66" width="10" height="34" rx="4" fill="#3a4450" transform="rotate(${i * 60})"/>`).join('')}<circle r="22" fill="#d8b46a" stroke="#6a4e1a" stroke-width="3"/></g>
  ${chip(id, 140, 270, 30, '#f3ead6', { label: '100', ink: '#1d1b1a', edge: '#c9b48c' })}${chip(id, 210, 285, 30, '#e6c25a', { label: '200', ink: '#1d1b1a', edge: '#fff' })}${chip(id, 280, 272, 30, '#d9783c', { label: '300', ink: '#1d1b1a', edge: '#fff' })}${chip(id, 350, 290, 30, '#b8323a', { label: '400', ink: '#fff', edge: '#fff' })}
`));

cover('crown', id => shell(id, { title: 'Crown & Dagger', tag: 'Loyalty is a lie', bg: ['#6a2a24', '#3e1512', '#140605'] }, `
  ${glow(id, 300, 150, 140, '#ff9a6a', .2)}
  <g transform="translate(300 160)" filter="url(#${id}-sh)"><path d="M-90 30 L-100 -50 L-50 -10 L0 -70 L50 -10 L100 -50 L90 30 Z" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="3"/><rect x="-92" y="30" width="184" height="26" rx="4" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="3"/>${[-50, 0, 50].map(x => `<circle cx="${x}" cy="43" r="7" fill="#8a1f24"/>`).join('')}<circle cx="0" cy="-74" r="8" fill="#e6c25a"/></g>
  <g transform="translate(300 175) rotate(35)" filter="url(#${id}-sh)"><path d="M-6 -150 L6 -150 L10 40 L0 60 L-10 40 Z" fill="#d9dde3" stroke="#6a7480" stroke-width="2"/><rect x="-40" y="40" width="80" height="12" rx="4" fill="#3a2a1a"/><rect x="-8" y="52" width="16" height="50" rx="4" fill="#5a3a22"/><circle cy="108" r="10" fill="url(#${id}-gold)"/></g>
`));

cover('hollow', id => shell(id, { title: 'Hollowmere', tag: 'A village with secrets', bg: ['#2f3a52', '#1a2133', '#070a12'], cy: 25 }, `
  ${stars(60, 7, 200)}
  <circle cx="460" cy="90" r="44" fill="#f3ead6"/><circle cx="478" cy="80" r="40" fill="#1d2538" opacity=".95"/>
  ${glow(id, 300, 300, 200, '#8aa0c0', .2)}
  <g fill="#0d111c">${[[60, 240, 70, 80], [140, 220, 60, 100], [210, 250, 90, 70], [320, 210, 70, 110], [400, 245, 80, 75], [490, 230, 70, 90]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/><path d="M${x - 8} ${y} L${x + w / 2} ${y - 40} L${x + w + 8} ${y} Z"/>`).join('')}<path d="M345 210 L355 120 L365 210 Z"/></g>
  ${[[95, 270], [170, 255], [355, 250], [520, 265], [245, 280]].map(([x, y]) => `<rect x="${x - 6}" y="${y - 8}" width="12" height="16" fill="#f5c46a" filter="url(#${id}-glow)"/>`).join('')}
  <rect y="300" width="600" height="100" fill="#0a0d16"/><ellipse cx="300" cy="320" rx="320" ry="30" fill="#9fb0c8" opacity=".12" filter="url(#${id}-soft)"/>
`));

cover('blackjack', id => shell(id, { title: 'Blackjack', tag: 'Twenty-one · beat the house', bg: ['#2f6b50', '#1a4a36', '#0a1f16'] }, `
  <path d="M60 60 Q300 -20 540 60" fill="none" stroke="#d8b46a" stroke-opacity=".5" stroke-width="2"/><text x="300" y="58" text-anchor="middle" font-family="${UI}" font-weight="700" font-size="11" letter-spacing="4" fill="#d8b46a" opacity=".7">BLACKJACK PAYS 3 TO 2</text>
  ${card(id, 260, 175, { rank: 'A', suit: '♠', rot: -10, w: 108 })}${card(id, 345, 180, { rank: 'K', suit: '♥', red: true, rot: 8, w: 108, face: kingFace(108) })}
  ${stack(id, 480, 260, 34, 8, '#1d1d22', '#d8b46a')}${stack(id, 120, 270, 34, 5, '#7a1f24')}
`));
function kingFace(w) { const h = w * 1.4; return `<g transform="translate(${w / 2} ${h * .6}) scale(${w / 100})"><path d="M-22 -24 L-22 -42 L-11 -32 L0 -46 L11 -32 L22 -42 L22 -24 Z" fill="#d8b46a" stroke="#a3262a" stroke-width="1.5"/><circle cy="-10" r="13" fill="#f3e2c4" stroke="#a3262a" stroke-width="1.5"/><path d="M-9 0 Q0 14 9 0" fill="#e9dcc0" stroke="#a3262a"/><path d="M-26 32 Q-24 6 0 4 Q24 6 26 32 Z" fill="#a3262a"/></g>`; }

cover('baccarat', id => shell(id, { title: 'Baccarat', tag: 'Player · banker · tie', bg: ['#6a2430', '#43141d', '#16060a'] }, `
  <g fill="none" stroke="#d8b46a" stroke-opacity=".45" stroke-width="2"><path d="M80 120 Q300 40 520 120"/><path d="M110 170 Q300 100 490 170"/></g>
  <text x="300" y="98" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="13" letter-spacing="5" fill="#d8b46a" opacity=".75">BANKER</text>
  <text x="300" y="148" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="13" letter-spacing="5" fill="#d8b46a" opacity=".75">PLAYER</text>
  ${card(id, 235, 230, { rank: '9', suit: '♦', red: true, rot: -8, w: 96 })}${card(id, 325, 235, { rank: '8', suit: '♣', rot: 6, w: 96 })}
  ${chip(id, 450, 250, 34, '#d8b46a', { label: '9', ink: '#3a2a0a', edge: '#fff6dc' })}${chip(id, 500, 300, 30, '#1d1d22', { edge: '#d8b46a' })}
`));

cover('checkers', id => shell(id, { title: 'Checkers', tag: 'Jump · crown · clear', bg: ['#6b3b2a', '#3e2016', '#140906'], cy: 30 }, `
  <g transform="translate(300 270) scale(1 .45) rotate(45)">${Array.from({ length: 64 }, (_, i) => `<rect x="${(i % 8) * 48 - 192}" y="${Math.floor(i / 8) * 48 - 192}" width="48" height="48" fill="${(i + Math.floor(i / 8)) % 2 ? '#2a1a12' : '#c9a777'}"/>`).join('')}</g>
  ${[[230, 200, '#9b2a24'], [380, 210, '#1d1b1a'], [300, 150, '#9b2a24', 1], [180, 250, '#1d1b1a'], [430, 260, '#9b2a24']].map(([x, y, c, k]) => `<g filter="url(#${id}-sh)"><ellipse cx="${x}" cy="${y + 10}" rx="44" ry="16" fill="${c}"/><rect x="${x - 44}" y="${y - (k ? 18 : 0)}" width="88" height="${k ? 28 : 10}" fill="${c}"/><ellipse cx="${x}" cy="${y - (k ? 18 : 0)}" rx="44" ry="16" fill="${c}" stroke="rgba(255,255,255,.2)"/><ellipse cx="${x}" cy="${y - (k ? 18 : 0)}" rx="30" ry="10" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/>${k ? `<text x="${x}" y="${y - 10}" text-anchor="middle" font-family="${SYM}" font-size="22" fill="#e3c88c">♛</text>` : ''}</g>`).join('')}
`));

cover('yacht', id => shell(id, { title: 'Yacht Club', tag: 'Five dice · thirteen boxes', bg: ['#2f5a7a', '#1b3a52', '#08141e'], cy: 30 }, `
  ${glow(id, 420, 80, 80, '#ffe6b0', .35)}
  <path d="M0 230 Q150 210 300 228 Q450 246 600 222 V400 H0 Z" fill="#12293a"/>
  <g transform="translate(450 140)" filter="url(#${id}-sh)"><path d="M0 -90 L0 60 L-70 60 Z" fill="#f3ead6"/><path d="M6 -70 L6 60 L56 60 Z" fill="#e6d8b8"/><path d="M-80 66 L70 66 L52 88 L-62 88 Z" fill="#5a2a1a"/><path d="M0 -90 L24 -84 L0 -78 Z" fill="#b8323a"/></g>
  ${die(id, 120, 250, 64, 6, { rot: -12 })}${die(id, 200, 280, 64, 6, { rot: 8 })}${die(id, 280, 250, 64, 6, { rot: -4 })}${die(id, 165, 190, 56, 6, { rot: 20 })}${die(id, 250, 185, 56, 6, { rot: -18 })}
`));

cover('spoons', id => shell(id, { title: 'Spoons', tag: 'Four of a kind · grab!', bg: ['#4a5a6a', '#2c3844', '#0e1318'] }, `
  ${glow(id, 300, 150, 130, '#dfe8f0', .2)}
  ${[-60, -20, 20, 60].map(a => `<g transform="translate(300 150) rotate(${a}) translate(0 -18)" filter="url(#${id}-sh)"><ellipse cx="0" cy="-92" rx="22" ry="30" fill="#dfe4ea" stroke="#8a96a3" stroke-width="2"/><ellipse cx="-5" cy="-98" rx="9" ry="14" fill="#fff" opacity=".6"/><rect x="-5" y="-64" width="10" height="110" rx="5" fill="#c9d0d8" stroke="#8a96a3"/></g>`).join('')}
  ${['♠', '♥', '♦', '♣'].map((s, i) => card(id, 210 + i * 60, 262 - Math.abs(i - 1.5) * 10, { rank: '7', suit: s, red: i === 1 || i === 2, rot: (i - 1.5) * 9, w: 84 })).join('')}
`));

cover('doubt', id => shell(id, { title: 'I Doubt It', tag: 'Bluff · call · deny', bg: ['#4a3a5a', '#2c2238', '#0f0a14'] }, `
  ${[0, 1, 2, 3, 4].map(i => card(id, 220 + i * 5, 190 - i * 5, { back: true, backFill: '#3e2a52', w: 118, rot: -18 + i * 3 })).join('')}
  ${card(id, 385, 160, { rank: 'Q', suit: '♠', w: 126, rot: 14 })}
  <g transform="translate(500 90)" filter="url(#${id}-sh)"><circle r="44" fill="#f3e7d0"/><path d="M-22 -10 q8 -10 16 -2 M8 -16 q10 -8 18 4" stroke="#1d1b1a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="-14" cy="2" r="4" fill="#1d1b1a"/><circle cx="16" cy="2" r="4" fill="#1d1b1a"/><path d="M-14 22 q14 -8 28 2" stroke="#1d1b1a" stroke-width="4" fill="none" stroke-linecap="round"/></g>
  <text x="90" y="130" font-family="${SERIF}" font-size="96" fill="#e3c88c" opacity=".85" filter="url(#${id}-sh)">?</text>
`));

cover('cashout', id => shell(id, { title: 'Cash Out', tag: 'Push your luck · bank it', bg: ['#2f5a3a', '#1a3a24', '#08140c'] }, `
  ${glow(id, 300, 120, 150, '#d8f0a0', .2)}
  <text x="300" y="138" text-anchor="middle" font-family="${SERIF}" font-size="110" fill="url(#${id}-gold)" filter="url(#${id}-sh)">1,240</text>
  ${die(id, 245, 222, 78, 5, { rot: -14 })}${die(id, 350, 228, 78, 2, { rot: 10 })}
  ${stack(id, 490, 262, 36, 7, '#d8b46a', '#fff6dc')}${stack(id, 110, 250, 32, 4, '#2f5a3a')}
`));

cover('crazy8', id => shell(id, { title: 'Crazy Eights', tag: 'Match the suit · eights are wild', bg: ['#2a5a5c', '#17393b', '#071314'] }, `
  <ellipse cx="300" cy="170" rx="170" ry="120" fill="none" stroke="#bfe6e0" stroke-opacity=".15" stroke-width="18"/>
  ${card(id, 205, 168, { rank: '8', suit: '♣', rot: -24, w: 124, face: eight('#1d1b1a', 124) })}${card(id, 395, 168, { rank: '8', suit: '♦', red: true, rot: 22, w: 124, face: eight('#a3262a', 124) })}${card(id, 300, 148, { rank: '8', suit: '♥', red: true, w: 136, face: eight('#a3262a', 136) })}
`));
function eight(c, w) { const h = w * 1.4; return `<text x="${w / 2}" y="${h * .72}" text-anchor="middle" font-family="${SERIF}" font-size="${w * .8}" fill="${c}">8</text>`; }

cover('skyline', id => shell(id, { title: 'Skyline', tag: 'Buy the block · build the city', bg: ['#4a5a8a', '#1b2740', '#090d18'], cy: 20 }, `
  ${glow(id, 300, 300, 260, '#ffb070', .3)}
  <g fill="#0e1424">${[[30, 200, 50], [85, 150, 46], [136, 180, 40], [180, 110, 56], [240, 160, 44], [288, 70, 62], [354, 140, 50], [408, 100, 54], [466, 170, 44], [514, 130, 56]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${400 - y}"/>`).join('')}<rect x="318" y="30" width="3" height="40"/></g>
  <g fill="#f5c46a">${Array.from({ length: 80 }, (_, i) => { const x = 36 + (i * 53) % 520, y = 116 + (i * 37) % 200; return `<rect x="${x}" y="${y}" width="6" height="8" opacity="${((i * 7) % 10) / 12 + .1}"/>`; }).join('')}</g>
  ${die(id, 470, 296, 58, 6, { rot: 14 })}${die(id, 535, 286, 58, 3, { rot: -10 })}
`));

cover('lowtide', id => shell(id, { title: 'Low Tide', tag: 'Flip · swap · go low', bg: ['#3a7090', '#12304a', '#050f18'], cy: 25 }, `
  <path d="M0 210 Q100 190 200 210 T400 210 T600 210 V400 H0 Z" fill="#0e2a40"/><path d="M0 240 Q100 222 200 240 T400 240 T600 240" fill="none" stroke="#9fd6dc" stroke-opacity=".35" stroke-width="3"/>
  ${[[-2, '#2f6a8a'], [0, '#3f8a7a'], [5, '#a0864a'], [12, '#9a4a3a']].map(([v, c], i) => `<g transform="translate(${165 + i * 90} ${160 + Math.abs(i - 1.5) * 14}) rotate(${(i - 1.5) * 9})" filter="url(#${id}-sh)"><rect x="-48" y="-68" width="96" height="136" rx="10" fill="#f7f0df"/><rect x="-41" y="-61" width="82" height="122" rx="7" fill="${c}"/><text y="20" text-anchor="middle" font-family="${SERIF}" font-size="58" fill="#f7f0df">${v}</text></g>`).join('')}
  <circle cx="520" cy="62" r="28" fill="#f3e7c8" opacity=".9"/>
`));

cover('trio', id => shell(id, { title: 'Tic Tac Toe', tag: 'Three in a row', bg: ['#4a4e58', '#2a2d33', '#0e0f12'] }, `
  <g transform="translate(300 160) scale(.95)" filter="url(#${id}-sh)"><rect x="-130" y="-130" width="260" height="260" rx="18" fill="#6a5238"/><rect x="-120" y="-120" width="240" height="240" rx="12" fill="#8a6c4a"/>
  <g stroke="#4a3622" stroke-width="8" stroke-linecap="round"><path d="M-40 -110 V110 M40 -110 V110 M-110 -40 H110 M-110 40 H110"/></g>
  ${[[-80, -80, 0], [0, -80, 1], [80, 0, 1], [0, 0, 0], [-80, 80, 1], [80, 80, 0]].map(([x, y, k]) => k ? `<path d="M${x} ${y - 26} L${x + 24} ${y} L${x} ${y + 26} L${x - 24} ${y} Z" fill="#9ec3d8" stroke="#2f4a5e" stroke-width="3"/>` : `<circle cx="${x}" cy="${y}" r="24" fill="none" stroke="#e6c25a" stroke-width="10"/>`).join('')}
  <path d="M-96 -96 L96 96" stroke="#f3e7c8" stroke-width="5" stroke-opacity=".7" stroke-linecap="round"/></g>
`));

cover('fourup', id => shell(id, { title: 'Four Up', tag: 'Drop · stack · connect', bg: ['#2f5070', '#1d3346', '#081420'] }, `
  <g transform="translate(300 172)" filter="url(#${id}-sh)"><rect x="-190" y="-130" width="380" height="270" rx="14" fill="#2f5a85"/>
  ${Array.from({ length: 42 }, (_, i) => { const c = i % 7, r = Math.floor(i / 7), x = -162 + c * 54, y = -104 + r * 44; const fill = { 35: '#c9473a', 36: '#e6c25a', 37: '#c9473a', 29: '#e6c25a', 30: '#c9473a', 38: '#e6c25a', 23: '#c9473a', 31: '#c9473a', 39: '#e6c25a', 17: '#c9473a', 25: '#e6c25a', 40: '#c9473a' }[i]; return `<circle cx="${x}" cy="${y}" r="18" fill="${fill || '#0f1e2c'}" stroke="rgba(0,0,0,.35)" stroke-width="2"/>`; }).join('')}</g>
  <circle cx="354" cy="16" r="18" fill="#e6c25a" filter="url(#${id}-sh)"/>
`));

cover('seedstones', id => shell(id, { title: 'Seed Stones', tag: 'Sow · capture · harvest', bg: ['#6a4a2a', '#3a2a1c', '#140c06'] }, `
  <g transform="translate(300 170)" filter="url(#${id}-sh)"><rect x="-260" y="-96" width="520" height="192" rx="86" fill="#7a5232"/><rect x="-250" y="-86" width="500" height="172" rx="78" fill="#9a6a40"/>
  ${[-1, 1].map(row => Array.from({ length: 6 }, (_, i) => `<ellipse cx="${-156 + i * 62}" cy="${row * 38}" rx="25" ry="21" fill="#5a3a20"/>`).join('')).join('')}<ellipse cx="-218" cy="0" rx="23" ry="60" fill="#5a3a20"/><ellipse cx="218" cy="0" rx="23" ry="60" fill="#5a3a20"/>
  ${Array.from({ length: 40 }, (_, i) => { const pit = i % 12, row = pit < 6 ? -1 : 1, px = -156 + (pit % 6) * 62, k = Math.floor(i / 12); return `<circle cx="${px + (k - 1) * 9}" cy="${row * 38 + ((i * 7) % 3 - 1) * 6}" r="7" fill="${['#cfd8d0', '#9ec3d8', '#e6c25a', '#c9a0a0'][i % 4]}"/>`; }).join('')}
  ${Array.from({ length: 9 }, (_, i) => `<circle cx="${218 + (i % 3 - 1) * 9}" cy="${-30 + Math.floor(i / 3) * 18}" r="7" fill="${['#cfd8d0', '#9ec3d8', '#e6c25a'][i % 3]}"/>`).join('')}</g>
`));

cover('sonar', id => shell(id, { title: 'Sonar', tag: 'Hunt the hidden fleet', bg: ['#1e4a4a', '#12282c', '#040c0d'] }, `
  <g transform="translate(300 160)"><circle r="150" fill="#0c2a26" stroke="#3fae8a" stroke-opacity=".5" stroke-width="2"/>${[110, 70, 30].map(r => `<circle r="${r}" fill="none" stroke="#3fae8a" stroke-opacity=".35"/>`).join('')}<path d="M-150 0 H150 M0 -150 V150" stroke="#3fae8a" stroke-opacity=".3"/>
  <path d="M0 0 L150 0 A150 150 0 0 0 106 -106 Z" fill="#3fae8a" opacity=".28"/><path d="M0 0 L106 -106" stroke="#7fe8c0" stroke-width="3"/>
  ${[[60, -70], [-80, 40], [30, 90]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${i ? '#3fae8a' : '#ff7a5a'}" filter="url(#${id}-glow)"/>`).join('')}</g>
  <g transform="translate(490 300)" fill="#0a1a18" stroke="#3fae8a" stroke-opacity=".6" stroke-width="2"><path d="M-80 0 L70 0 L50 18 L-66 18 Z"/><rect x="-30" y="-20" width="40" height="20"/><path d="M-10 -20 V-40"/></g>
`));

cover('milestones', id => shell(id, { title: 'Milestones', tag: 'Ten phases to the finish', bg: ['#3a4a6a', '#1e2a3e', '#080c16'], cy: 25 }, `
  <path d="M-20 330 C140 290 120 220 260 205 S420 140 470 90 S560 30 620 40" fill="none" stroke="#c9b48c" stroke-width="34" stroke-linecap="round" opacity=".55"/><path d="M-20 330 C140 290 120 220 260 205 S420 140 470 90 S560 30 620 40" fill="none" stroke="#f3e7c8" stroke-width="3" stroke-dasharray="14 12" opacity=".7"/>
  ${[[90, 292, 1], [180, 246, 3], [270, 200, 5], [380, 158, 7], [470, 92, 9], [560, 46, 10]].map(([x, y, n]) => `<g transform="translate(${x} ${y - 34}) scale(1.15)" filter="url(#${id}-sh)"><path d="M-18 30 V-12 Q-18 -30 0 -30 Q18 -30 18 -12 V30 Z" fill="#cfc6b2" stroke="#6a6252" stroke-width="2"/><text y="8" text-anchor="middle" font-family="${SERIF}" font-size="${n > 9 ? 18 : 22}" fill="#3a3428">${n}</text></g>`).join('')}
`));

cover('wrongnumber', id => shell(id, { title: 'Wrong Number', tag: 'New phone, who dis?', bg: ['#4a3a6a', '#2a1f38', '#0e0a14'] }, `
  <g transform="translate(300 175) rotate(-6)" filter="url(#${id}-sh)"><rect x="-96" y="-170" width="192" height="350" rx="26" fill="#14121a"/><rect x="-86" y="-150" width="172" height="310" rx="10" fill="#f3eee6"/>
  <g font-family="${UI}" font-size="14"><rect x="-76" y="-128" width="132" height="46" rx="14" fill="#e3dcd0"/><text x="-66" y="-109" fill="#2a2320">URGENT: the goat</text><text x="-66" y="-92" fill="#2a2320">is loose again</text>
  <rect x="-36" y="-68" width="114" height="32" rx="14" fill="#7a5ab0"/><text x="-26" y="-47" fill="#fff">who is this??</text>
  <rect x="-76" y="-22" width="140" height="46" rx="14" fill="#e3dcd0"/><text x="-66" y="-3" fill="#2a2320">bring snacks. and</text><text x="-66" y="14" fill="#2a2320">the inflatable duck</text>
  <rect x="-26" y="38" width="108" height="32" rx="14" fill="#7a5ab0"/><text x="-14" y="59" fill="#fff">wrong number</text></g></g>
`));

cover('scribble', id => shell(id, { title: 'Scribble Chain', tag: 'Draw · guess · pass it on', bg: ['#6a5a44', '#3a2d22', '#140f0a'] }, `
  ${[0, 1, 2].map(i => `<g transform="translate(${160 + i * 140} ${160 + (i % 2) * 14}) rotate(${(i - 1) * 8})" filter="url(#${id}-sh)"><rect x="-66" y="-86" width="132" height="172" rx="4" fill="#fbf6ea"/><rect x="-66" y="-86" width="132" height="12" fill="#c9473a" opacity=".5"/>
  ${i === 0 ? `<text y="10" text-anchor="middle" font-family="${CORM}" font-style="italic" font-size="32" fill="#2a2320">castle</text>` : i === 1 ? `<path d="M-40 50 V0 H-24 V-14 H-12 V0 H12 V-14 H24 V0 H40 V50 Z" fill="none" stroke="#2a2320" stroke-width="3"/><path d="M-8 50 V30 H8 V50" fill="none" stroke="#c9473a" stroke-width="3"/>` : `<text y="10" text-anchor="middle" font-family="${CORM}" font-style="italic" font-size="28" fill="#2a2320">a toaster?</text>`}</g>`).join('')}
`));

cover('manor', id => shell(id, { title: 'Midnight Manor', tag: 'Who? Where? With what?', bg: ['#4a2a32', '#2a1418', '#0c0507'], cy: 20 }, `
  ${stars(40, 3, 150, .5)}<circle cx="100" cy="76" r="34" fill="#f3e7c8" opacity=".9"/>
  <g fill="#120a0c" filter="url(#${id}-sh)"><rect x="150" y="130" width="300" height="200"/><path d="M130 132 L300 50 L470 132 Z"/><rect x="190" y="70" width="24" height="60"/><rect x="390" y="80" width="24" height="50"/></g>
  ${[[180, 160], [240, 160], [340, 160], [400, 160], [180, 230], [400, 230]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="26" height="36" fill="${i === 3 ? '#f5c46a' : '#3a2a1a'}" ${i === 3 ? `filter="url(#${id}-glow)"` : ''}/>`).join('')}
  <rect x="280" y="250" width="40" height="80" fill="#2a1a12"/>
  <g transform="translate(480 250) rotate(-30)" filter="url(#${id}-sh)"><circle r="44" fill="none" stroke="url(#${id}-gold)" stroke-width="11"/><circle r="38" fill="#9ec3d8" opacity=".25"/><rect x="-8" y="48" width="16" height="74" rx="6" fill="#5a3a22"/></g>
`));

cover('warfront', id => shell(id, { title: 'Warfront', tag: 'Conquer the islands', bg: ['#2a4a6a', '#162637', '#060c14'] }, `
  <g filter="url(#${id}-sh)"><path d="M90 140 Q120 70 210 80 Q280 50 330 100 Q400 80 440 130 Q520 140 500 210 Q520 280 430 290 Q360 320 290 290 Q200 320 150 280 Q70 250 90 140 Z" fill="#6a7a4a"/>
  <path d="M210 80 Q230 170 290 290 M330 100 Q320 190 430 290 M90 140 Q200 190 500 210" fill="none" stroke="#3a4a2a" stroke-width="3" opacity=".6"/></g>
  ${[[180, 150, '#b8323a', 5], [300, 190, '#2f5a85', 3], [420, 180, '#e6c25a', 4], [240, 250, '#b8323a', 2], [380, 260, '#2f5a85', 6]].map(([x, y, c, n]) => `<g filter="url(#${id}-sh)"><circle cx="${x}" cy="${y}" r="22" fill="${c}" stroke="#f3e7c8" stroke-width="3"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-family="${SERIF}" font-size="22" fill="#fff">${n}</text></g>`).join('')}
  <path d="M202 154 Q250 140 278 180" fill="none" stroke="#f3e7c8" stroke-width="5" stroke-dasharray="10 6"/><path d="M272 168 L282 186 L264 186 Z" fill="#f3e7c8"/>
`));

cover('ironroutes', id => shell(id, { title: 'Iron Routes', tag: 'Claim the railways', bg: ['#2f4a3a', '#1d2f26', '#09120d'] }, `
  <g fill="none" stroke-width="10" stroke-linecap="round">${[['M60 290 L200 190 L340 220 L480 110', '#b8323a'], ['M80 110 L200 190', '#2f5a85'], ['M340 220 L470 290', '#e6c25a'], ['M200 190 L300 80 L480 110', '#4a7340']].map(([d, c]) => `<path d="${d}" stroke="#0d1a12" stroke-width="16"/><path d="${d}" stroke="${c}" stroke-dasharray="26 6"/>`).join('')}</g>
  ${[[60, 290], [200, 190], [340, 220], [480, 110], [80, 110], [470, 290], [300, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#f3e7c8" stroke="#1d2f26" stroke-width="3"/>`).join('')}
  <g transform="translate(330 160) scale(1.3)" filter="url(#${id}-sh)"><rect x="-50" y="-26" width="70" height="36" rx="4" fill="#2a2a2e"/><rect x="20" y="-40" width="34" height="50" rx="4" fill="#3a3a40"/><rect x="-44" y="-44" width="14" height="20" fill="#2a2a2e"/><circle cx="-36" cy="16" r="10" fill="#b8323a"/><circle cx="-6" cy="16" r="10" fill="#b8323a"/><circle cx="34" cy="16" r="12" fill="#b8323a"/><path d="M-58 10 L-70 22 H-50 Z" fill="#5a5a60"/><rect x="26" y="-34" width="22" height="16" fill="#f5c46a"/></g>
`));

cover('homestead', id => shell(id, { title: 'Homestead', tag: 'Settle · trade · build', bg: ['#2a5a6a', '#16303a', '#061015'] }, `
  ${(() => { const T = ['#6a8a3a', '#c9a24a', '#8a6a4a', '#9a9a9a', '#4a6a3a', '#b8783a', '#c9a24a']; let h = ''; const R = 52; const pos = [[0, 0], [1, 0], [-1, 0], [.5, -1], [-.5, -1], [.5, 1], [-.5, 1]]; pos.forEach(([q, r], i) => { const x = 300 + q * R * 1.74, y = 160 + r * R * 1.5; const pts = Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 6 + k * Math.PI / 3; return `${x + R * Math.cos(a)},${y + R * Math.sin(a)}`; }).join(' '); h += `<polygon points="${pts}" fill="${T[i]}" stroke="#e9dcc0" stroke-width="3"/>`; if (i === 0) h += `<circle cx="${x}" cy="${y}" r="17" fill="#f3e7c8"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-family="${SERIF}" font-size="20" fill="#1d1b1a">8</text>`; }); return `<g filter="url(#${id}-sh)">${h}</g>`; })()}
  ${[[255, 114, '#b8323a'], [390, 206, '#2f5a85']].map(([x, y, c]) => `<g filter="url(#${id}-sh)"><path d="M${x - 15} ${y} V${y - 17} L${x} ${y - 30} L${x + 15} ${y - 17} V${y} Z" fill="${c}" stroke="#fff" stroke-width="2"/></g>`).join('')}
`));

cover('wordsmith', id => shell(id, { title: 'Wordsmith', tag: 'Tiles · words · triple word', bg: ['#4a4032', '#2c2620', '#0e0c0a'] }, `
  <g transform="translate(300 145) rotate(-4)">${[...'WORDS'].map((L, i) => { const pts = { W: 4, O: 1, R: 1, D: 2, S: 1 }[L]; return `<g transform="translate(${(i - 2) * 88} ${(i % 2) * 8})" filter="url(#${id}-sh)"><rect x="-39" y="-39" width="78" height="78" rx="8" fill="#f1e2bf"/><rect x="-39" y="-39" width="78" height="78" rx="8" fill="none" stroke="#c9a777" stroke-width="2"/><text y="17" text-anchor="middle" font-family="${SERIF}" font-size="50" fill="#2a2018">${L}</text><text x="27" y="31" text-anchor="end" font-family="${UI}" font-weight="700" font-size="13" fill="#2a2018">${pts}</text></g>`; }).join('')}</g>
  <g transform="translate(490 270) rotate(6)" filter="url(#${id}-sh)"><rect x="-42" y="-42" width="84" height="84" fill="#9b3b2e"/><text y="-4" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="12" fill="#f7f0df">TRIPLE</text><text y="14" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="12" fill="#f7f0df">WORD</text></g>
`));

cover('powerup', id => shell(id, { title: 'PowerUp Chess', tag: 'Capture · absorb · power up', bg: ['#5a3a1c', '#2f2215', '#0e0905'], cy: 35 }, `
  <g transform="translate(300 300) scale(1 .42) rotate(45)" opacity=".9">${Array.from({ length: 64 }, (_, i) => `<rect x="${(i % 8) * 46 - 184}" y="${Math.floor(i / 8) * 46 - 184}" width="46" height="46" fill="${(i + Math.floor(i / 8)) % 2 ? '#2a1a0c' : '#b8955f'}"/>`).join('')}</g>
  ${glow(id, 300, 130, 110, '#ffcf6a', .45)}
  <g filter="url(#${id}-sh)"><text x="300" y="250" text-anchor="middle" font-family="${SYM}" font-size="190" fill="#f3e7d0">♝</text></g>
  ${[['♜', 210, 120, -18], ['♞', 395, 110, 16], ['♟', 300, 60, 0]].map(([p, x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})" opacity=".85"><text text-anchor="middle" font-family="${SYM}" font-size="56" fill="#1d1612" stroke="#ffd98a" stroke-width="1.5">${p}</text></g>`).join('')}
  <path d="M250 150 L262 132 L256 132 L268 112" fill="none" stroke="#ffd98a" stroke-width="4" stroke-linecap="round" filter="url(#${id}-glow)"/><path d="M350 150 L338 132 L344 132 L332 112" fill="none" stroke="#ffd98a" stroke-width="4" stroke-linecap="round" filter="url(#${id}-glow)"/>
`));

cover('nestegg', id => shell(id, { title: 'Nest Egg', tag: 'Collect · challenge · steal', bg: ['#5a4a2a', '#2f2618', '#0e0b06'] }, `
  ${glow(id, 300, 150, 140, '#ffe08a', .35)}
  <g filter="url(#${id}-sh)">${Array.from({ length: 26 }, (_, i) => `<path d="M${180 + (i * 37) % 240} ${215 + (i % 5) * 5} q${30 + (i % 4) * 8} ${-14 - (i % 3) * 6} ${70 + (i % 5) * 6} ${4 + (i % 3) * 3}" fill="none" stroke="${['#8a6a3a', '#6a4e2a', '#a0804a'][i % 3]}" stroke-width="5" stroke-linecap="round"/>`).join('')}
  <ellipse cx="300" cy="225" rx="140" ry="40" fill="#5a4220"/><ellipse cx="300" cy="212" rx="118" ry="30" fill="#3a2a14"/></g>
  <g filter="url(#${id}-sh)"><ellipse cx="300" cy="160" rx="62" ry="78" fill="url(#${id}-gold)"/><ellipse cx="278" cy="130" rx="16" ry="26" fill="#fff6dc" opacity=".55"/></g>
  ${chip(id, 160, 250, 28, '#d8b46a', { label: '$', ink: '#3a2a0a', edge: '#fff6dc' })}${chip(id, 445, 255, 26, '#d8b46a', { label: '$', ink: '#3a2a0a', edge: '#fff6dc' })}
  <g transform="translate(470 150) rotate(16)" filter="url(#${id}-sh)"><circle r="22" fill="none" stroke="url(#${id}-gold)" stroke-width="8"/><path d="M-10 -26 L0 -40 L10 -26 Z" fill="#9ec3d8"/></g>
`));

cover('kaboom', id => shell(id, { title: 'Kaboom Critters', tag: 'Draw · dodge · survive', bg: ['#5a2e55', '#3a1f3a', '#120812'] }, `
  ${glow(id, 380, 90, 90, '#ffb040', .6)}
  <g transform="translate(250 190)" filter="url(#${id}-sh)"><ellipse cx="0" cy="40" rx="86" ry="64" fill="#e6a24a"/><circle cx="0" cy="-30" r="70" fill="#f0b25a"/><path d="M-60 -70 L-48 -126 L-14 -92 Z M60 -70 L48 -126 L14 -92 Z" fill="#f0b25a"/><path d="M-50 -80 L-44 -110 L-26 -92 Z M50 -80 L44 -110 L26 -92 Z" fill="#f3c6b0"/>
  <ellipse cx="-24" cy="-36" rx="14" ry="18" fill="#fff"/><ellipse cx="24" cy="-36" rx="14" ry="18" fill="#fff"/><circle cx="-20" cy="-32" r="8" fill="#1d1b1a"/><circle cx="28" cy="-32" r="8" fill="#1d1b1a"/><path d="M-8 -8 q8 6 16 0" stroke="#1d1b1a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-4 -16 L4 -16 L0 -10 Z" fill="#c9473a"/>
  <path d="M-90 -10 L-120 -16 M-90 0 L-122 2 M90 -10 L120 -16 M90 0 L122 2" stroke="#1d1b1a" stroke-width="2"/></g>
  <g transform="translate(370 200)" filter="url(#${id}-sh)"><circle r="56" fill="#26212a"/><circle cx="-18" cy="-18" r="14" fill="#fff" opacity=".18"/><rect x="-14" y="-70" width="28" height="18" rx="4" fill="#3a3440"/><path d="M0 -70 Q10 -100 30 -110" fill="none" stroke="#c9a777" stroke-width="5"/></g>
  <g transform="translate(400 88)" filter="url(#${id}-glow)"><path d="M0 -22 L6 -6 L22 0 L6 6 L0 22 L-6 6 L-22 0 L-6 -6 Z" fill="#ffdc6a"/></g>
`));

cover('spires', id => shell(id, { title: 'Seven Spires', tag: 'Build a wonder of the world', bg: ['#c98a5a', '#5a3a4a', '#1a1020'], cy: 60 }, `
  ${glow(id, 300, 230, 160, '#ffcc88', .5)}
  <g filter="url(#${id}-sh)">${[[180, 300, 240, 34], [200, 266, 200, 34], [220, 232, 160, 34], [240, 198, 120, 34], [260, 164, 80, 34]].map(([x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${i < 4 ? '#e3c88c' : '#f6e2b0'}" stroke="#7a5a2a" stroke-width="2"/><g fill="#7a5a2a" opacity=".5">${Array.from({ length: Math.floor(w / 26) }, (_, k) => `<rect x="${x + 8 + k * 26}" y="${y + 8}" width="12" height="18" rx="6"/>`).join('')}</g>`).join('')}<path d="M276 164 L300 64 L324 164 Z" fill="#f6e2b0" stroke="#7a5a2a" stroke-width="2"/></g>
  <path d="M300 64 V36" stroke="#3a2a1a" stroke-width="3"/><path d="M300 36 L332 44 L300 52 Z" fill="#b8323a"/>
  ${[[110, 120], [480, 100], [520, 180]].map(([x, y]) => `<path d="M${x} ${y} q8 -6 16 0 q8 -6 16 0" fill="none" stroke="#2a1a24" stroke-width="2.5"/>`).join('')}
`));

cover('grandprix', id => shell(id, { title: 'Grand Prix Dice', tag: 'Shift up · brake late', bg: ['#4a5a6a', '#26303a', '#0c1014'], cy: 30 }, `
  <path d="M-20 300 Q150 180 300 220 T620 120" fill="none" stroke="#3a3a40" stroke-width="90"/><path d="M-20 300 Q150 180 300 220 T620 120" fill="none" stroke="#f3e7c8" stroke-width="2" stroke-dasharray="20 18" opacity=".6"/>
  <path d="M-20 300 Q150 180 300 220 T620 120" fill="none" stroke="url(#${id}-kerb)" stroke-width="96" opacity=".0"/>
  <g transform="translate(330 200) rotate(-12)" filter="url(#${id}-sh)"><path d="M-80 0 Q-70 -20 -30 -22 L20 -22 Q50 -36 80 -14 L96 -4 L96 10 L-84 10 Z" fill="#c9473a"/><rect x="-96" y="-14" width="14" height="24" fill="#a3262a"/><path d="M-20 -22 L0 -40 L24 -22 Z" fill="#1d1b1a" opacity=".8"/><circle cx="-50" cy="12" r="16" fill="#1d1b1a"/><circle cx="56" cy="12" r="16" fill="#1d1b1a"/><circle cx="-50" cy="12" r="6" fill="#8a8a8a"/><circle cx="56" cy="12" r="6" fill="#8a8a8a"/><text x="10" y="2" font-family="${SERIF}" font-size="16" fill="#fff">7</text></g>
  ${die(id, 150, 110, 58, 6, { rot: -14, fill: '#c9473a', pip: '#fff' })}${die(id, 470, 300, 58, 4, { rot: 12 })}
  <g transform="translate(470 70)">${Array.from({ length: 24 }, (_, i) => `<rect x="${(i % 6) * 14}" y="${Math.floor(i / 6) * 14}" width="14" height="14" fill="${(i + Math.floor(i / 6)) % 2 ? '#1d1b1a' : '#f3ead6'}"/>`).join('')}<rect x="-4" y="0" width="4" height="110" fill="#c9c0aa"/></g>
`));

cover('redline', id => shell(id, { title: 'Redline', tag: 'Speed · heat · nerve', bg: ['#3a1a24', '#1a0c14', '#060306'], cy: 30 }, `
  <g transform="translate(300 190)"><circle r="150" fill="#100a0e" stroke="#3a2a30" stroke-width="6"/>
  ${Array.from({ length: 11 }, (_, i) => { const a = (-210 + i * 24) * Math.PI / 180; const r1 = 130, r2 = i > 7 ? 104 : 112; return `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * r2}" y2="${Math.sin(a) * r2}" stroke="${i > 7 ? '#e0382c' : '#e9dcc0'}" stroke-width="${i % 2 ? 3 : 5}"/><text x="${Math.cos(a) * 88}" y="${Math.sin(a) * 88 + 6}" text-anchor="middle" font-family="${UI}" font-weight="700" font-size="15" fill="${i > 7 ? '#e0382c' : '#e9dcc0'}">${i}</text>`; }).join('')}
  <path d="M${Math.cos(10 * Math.PI / 180) * 136} ${Math.sin(10 * Math.PI / 180) * 136} A136 136 0 0 0 ${Math.cos(-42 * Math.PI / 180) * 136} ${Math.sin(-42 * Math.PI / 180) * 136}" fill="none" stroke="#e0382c" stroke-width="8" opacity=".85" filter="url(#${id}-glow)"/>
  <line x1="0" y1="0" x2="${Math.cos(-20 * Math.PI / 180) * 120}" y2="${Math.sin(-20 * Math.PI / 180) * 120}" stroke="#ff5a3c" stroke-width="6" stroke-linecap="round" filter="url(#${id}-glow)"/><circle r="14" fill="#2a2228" stroke="#e9dcc0" stroke-width="2"/></g>
  ${glow(id, 420, 140, 60, '#ff4a2c', .4)}
`));

cover('gearworks', id => shell(id, { title: 'Gearworks', tag: 'Pick an action · build robots', bg: ['#4a5a5a', '#283434', '#0a1010'] }, `
  ${gear(id, 140, 150, 70, 12, '#8a7a5a')}${gear(id, 470, 120, 56, 10, '#6a7a7a')}${gear(id, 470, 250, 40, 8, '#a0864a')}
  <g transform="translate(300 175)" filter="url(#${id}-sh)"><rect x="-70" y="-60" width="140" height="120" rx="22" fill="#c9d0d0"/><rect x="-56" y="-44" width="112" height="60" rx="12" fill="#1d2a2a"/><circle cx="-26" cy="-14" r="14" fill="#7fe8c0" filter="url(#${id}-glow)"/><circle cx="26" cy="-14" r="14" fill="#7fe8c0" filter="url(#${id}-glow)"/><rect x="-30" y="28" width="60" height="10" rx="5" fill="#5a6a6a"/><path d="M0 -60 V-90" stroke="#5a6a6a" stroke-width="5"/><circle cy="-96" r="9" fill="#e0382c"/><rect x="-92" y="-20" width="22" height="50" rx="10" fill="#9aa6a6"/><rect x="70" y="-20" width="22" height="50" rx="10" fill="#9aa6a6"/></g>
`));
function gear(id, x, y, r, n, c) {
  const pts = []; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.18; pts.push(`${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`); }
  return `<g filter="url(#${id}-sh)"><polygon points="${pts.join(' ')}" fill="${c}" stroke="rgba(0,0,0,.3)" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${r * .62}" fill="${c}" stroke="rgba(255,255,255,.18)" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${r * .22}" fill="#1d2a2a"/></g>`;
}

cover('tessera', id => shell(id, { title: 'Tessera', tag: 'Join the shapes · cover the gems', bg: ['#3a3846', '#2c2a33', '#0c0b10'] }, `
  ${[[200, 110, '#3f6f9a', -6], [330, 130, '#9b3b2e', 8], [255, 230, '#4a7340', -3], [395, 250, '#a8802c', 5]].map(([x, y, c, r]) => `<g transform="translate(${x} ${y}) rotate(${r})" filter="url(#${id}-sh)"><rect x="-62" y="-62" width="124" height="124" rx="10" fill="#34363f"/><rect x="-62" y="-62" width="124" height="124" rx="10" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="4"/><path d="M0 -54 V54 M-54 0 H54" stroke="rgba(255,255,255,.08)" stroke-width="2"/>
  <path d="M-31 -46 L-14 -31 L-31 -16 L-48 -31 Z" fill="${c}"/><path d="M-48 -31 H-14 M-31 -46 L-31 -16" stroke="rgba(255,255,255,.3)"/><path d="M31 16 L48 31 L31 46 L14 31 Z" fill="${c}"/>
  <path d="M-12 -62 A12 12 0 0 0 12 -62 Z" fill="#efe6cf"/><rect x="62" y="-12" width="0.1" height="0.1"/><path d="M62 -12 V12 L50 0 Z" fill="#efe6cf"/></g>`).join('')}
`));

cover('passpot', id => shell(id, { title: 'Pass the Pot', tag: 'Left · right · centre', bg: ['#6a2a28', '#4a1d1c', '#160707'] }, `
  ${glow(id, 300, 150, 140, '#ffcc88', .25)}
  <g filter="url(#${id}-sh)"><ellipse cx="300" cy="150" rx="150" ry="96" fill="#8a6a2a"/><ellipse cx="300" cy="150" rx="140" ry="88" fill="#c9a35a"/><ellipse cx="300" cy="146" rx="118" ry="70" fill="#3a2a14"/></g>
  ${Array.from({ length: 16 }, (_, i) => { const a = i * 2.4, r = 9 * Math.sqrt(i + .5); return `<ellipse cx="${300 + Math.cos(a) * r * 1.5}" cy="${148 + Math.sin(a) * r * .8}" rx="20" ry="9" fill="#f3e7c8" stroke="#a8844a" stroke-width="2"/>`; }).join('')}
  ${die(id, 180, 280, 66, '◀', { rot: -14, pip: '#7a1f1c' })}${die(id, 300, 292, 66, '●', { rot: 6, pip: '#8a6a2a' })}${die(id, 420, 280, 66, '▶', { rot: 14, pip: '#7a1f1c' })}
`));

cover('luckystreak', id => shell(id, { title: 'Lucky Streak', tag: 'Flip · push · never pair up', bg: ['#2f5a44', '#1b3a2c', '#07110c'] }, `
  ${[1, 2, 3, 4, 5, 6, 7].map((n, i) => { const a = (i - 3) * 15; const col = ['#6b8f71', '#5f7fa0', '#9a6b4f', '#7a5f95', '#a0864a', '#4f8a8a', '#a05f6b'][i]; return `<g transform="translate(300 430) rotate(${a}) translate(0 -250)" filter="url(#${id}-sh)"><rect x="-44" y="-62" width="88" height="124" rx="9" fill="url(#${id}-card)" stroke="${col}" stroke-width="3"/><text y="22" text-anchor="middle" font-family="${SERIF}" font-size="62" fill="${col}">${n}</text></g>`; }).join('')}
  <g transform="translate(520 70) scale(.9)" filter="url(#${id}-glow)">${[0, 90, 180, 270].map(r => `<path d="M0 0 C-20 -12 -22 -36 0 -34 C22 -36 20 -12 0 0 Z" fill="#6fbf7a" transform="rotate(${r + 45})"/>`).join('')}<path d="M0 0 Q6 22 18 34" stroke="#4a8a50" stroke-width="4" fill="none"/></g>
`));

cover('pileup', id => shell(id, { title: 'Pile Up', tag: 'Stack the draws · no mercy', bg: ['#3e434e', '#2b2f38', '#0c0d11'] }, `
  ${[['#9b3b2e', '+2', -26], ['#2f5a85', '+4', -12], ['#4a7340', '+4', 2], ['#a8802c', '+6', 14], ['#1d1d22', '+10', 26]].map(([c, t, r], i) => `<g transform="translate(${180 + i * 62} ${200 - i * 14}) rotate(${r})" filter="url(#${id}-sh)"><rect x="-54" y="-76" width="108" height="152" rx="10" fill="${i === 4 ? '#26282e' : '#f7f0df'}" stroke="${i === 4 ? '#c9a35a' : c}" stroke-width="6"/><text x="-44" y="-38" font-family="${UI}" font-weight="800" font-size="${i === 4 ? 30 : 34}" fill="${i === 4 ? '#f3e7c8' : c}">${t}</text></g>`).join('')}
  <text x="470" y="96" text-anchor="middle" font-family="${SERIF}" font-size="72" fill="#ff8a70" filter="url(#${id}-glow)">+26</text>
`));

cover('dialitin', id => shell(id, { title: 'Dial It In', tag: 'One clue · read their minds', bg: ['#255058', '#173338', '#060f11'], cy: 30 }, `
  <g transform="translate(300 250)" filter="url(#${id}-sh)"><path d="M-196 0 A196 196 0 0 1 196 0 Z" fill="#8a6a2a"/><path d="M-182 0 A182 182 0 0 1 182 0 Z" fill="#f3ead6"/>
  ${[[34, '#d98a5f'], [21, '#e6c25a'], [7, '#3f8a8a']].map(([w, c]) => { const t = 118, a1 = (180 + t - w) * Math.PI / 180, a2 = (180 + t + w) * Math.PI / 180; return `<path d="M0 0 L${Math.cos(a1) * 182} ${Math.sin(a1) * 182} A182 182 0 0 1 ${Math.cos(a2) * 182} ${Math.sin(a2) * 182} Z" fill="${c}"/>`; }).join('')}
  <line x1="0" y1="0" x2="${Math.cos((180 + 112) * Math.PI / 180) * 168}" y2="${Math.sin((180 + 112) * Math.PI / 180) * 168}" stroke="#1a1512" stroke-width="8" stroke-linecap="round"/><circle r="18" fill="#c9a35a" stroke="#3a2a10" stroke-width="3"/></g>
  <text x="300" y="38" text-anchor="middle" font-family="${SERIF}" font-size="28" fill="#fff3d6" opacity=".9">“a warm bath”</text>
`));

cover('fieldagents', id => shell(id, { title: 'Field Agents', tag: 'One word · find your agents', bg: ['#4a4c34', '#2d2f22', '#0d0e09'] }, `
  <g transform="translate(150 60) rotate(-6)">${['HARBOR', 'COMET', 'SPY', 'GHOST', 'ANCHOR', 'OPERA'].map((w, i) => `<g transform="translate(${(i % 3) * 112} ${Math.floor(i / 3) * 76})" filter="url(#${id}-sh)"><rect width="104" height="62" rx="5" fill="${i === 2 ? '#b08a3e' : i === 3 ? '#1d1d1d' : '#e6d4a8'}"/><rect x="8" y="34" width="88" height="20" fill="rgba(255,255,255,.3)"/><text x="52" y="49" text-anchor="middle" font-family="'Courier New', monospace" font-weight="700" font-size="15" fill="${i === 3 ? '#e6d4a8' : '#2a2318'}">${w}</text></g>`).join('')}</g>
  <g transform="translate(470 210)" filter="url(#${id}-sh)"><path d="M-60 0 L60 0 L42 -16 Q0 -30 -42 -16 Z" fill="#1d1b16"/><path d="M-36 -16 Q-30 -60 0 -62 Q30 -60 36 -16 Z" fill="#1d1b16"/><rect x="-36" y="-26" width="72" height="8" fill="#6a5a3a"/><path d="M-50 0 Q-58 70 -40 110 L40 110 Q58 70 50 0 Z" fill="#2a2820"/><path d="M-20 4 L0 50 L20 4" fill="#e6d4a8"/></g>
`));

cover('bannerraid', id => shell(id, { title: 'Banner Raid', tag: 'Hidden ranks · bold attacks', bg: ['#4a4a34', '#2a2a20', '#0b0b08'], cy: 30 }, `
  <path d="M0 300 Q160 220 300 240 T600 210 V400 H0 Z" fill="#3a4428"/><path d="M0 330 Q200 280 360 300 T600 290 V400 H0 Z" fill="#2c3420"/>
  <g filter="url(#${id}-sh)"><path d="M300 238 V70" stroke="#5a4a2a" stroke-width="6"/><path d="M303 74 Q360 64 400 84 Q360 104 303 114 Z" fill="#9b2a24"/><text x="344" y="100" text-anchor="middle" font-family="${SYM}" font-size="22" fill="#e3c88c">⚔</text></g>
  ${[[150, 250, '#94392f', '10'], [210, 270, '#94392f', '?'], [420, 245, '#3e4f7a', '?'], [480, 262, '#3e4f7a', '7']].map(([x, y, c, t]) => `<g filter="url(#${id}-sh)" transform="translate(${x} ${y}) scale(1.45) translate(${-x} ${-y})"><rect x="${x - 26}" y="${y - 36}" width="52" height="64" rx="7" fill="${c}"/><rect x="${x - 26}" y="${y - 36}" width="52" height="10" rx="5" fill="rgba(255,255,255,.18)"/><text x="${x}" y="${y + 10}" text-anchor="middle" font-family="${SERIF}" font-size="28" fill="#f3dfa6">${t}</text></g>`).join('')}
`));

cover('houserules', id => shell(id, { title: 'House Rules', tag: 'The rules keep changing', bg: ['#5a4030', '#3a2a1e', '#110b07'] }, `
  ${[['#4f6f5c', 'KEEPER', '☕', -20, 190], ['#74405e', 'GOAL', '☕ + 📖', -6, 260], ['#9a7a2e', 'NEW RULE', 'Draw 3', 8, 330], ['#3e5470', 'ACTION', 'Snatch', 22, 400]].map(([c, k, t, r, x], i) => `<g transform="translate(${x} ${178 - Math.abs(i - 1.5) * 8}) rotate(${r})" filter="url(#${id}-sh)"><rect x="-56" y="-78" width="112" height="156" rx="9" fill="#f6efdf"/><path d="M-56 -69 Q-56 -78 -47 -78 H47 Q56 -78 56 -69 V-50 H-56 Z" fill="${c}"/><text y="-58" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="10" letter-spacing="2" fill="#fff8ea">${k}</text><text y="${i < 2 ? 18 : 6}" text-anchor="middle" font-family="${i < 2 ? 'inherit' : SERIF}" font-size="${i === 0 ? 46 : i === 1 ? 24 : 20}" fill="#2a2018">${t}</text></g>`).join('')}
  <path d="M120 80 q40 -40 80 0" fill="none" stroke="#e3c88c" stroke-width="4" stroke-linecap="round" opacity=".7"/><path d="M196 70 l6 12 l-13 0 Z" fill="#e3c88c" opacity=".7"/>
  <path d="M480 80 q-40 -40 -80 0" fill="none" stroke="#e3c88c" stroke-width="4" stroke-linecap="round" opacity=".7"/><path d="M404 70 l-6 12 l13 0 Z" fill="#e3c88c" opacity=".7"/>
`));

cover('deepspace', id => shell(id, { title: 'House Rules: Deep Space', lines: ['House Rules:', 'Deep Space'], size: 40, tag: 'Changing rules among the stars', bg: ['#2c3a66', '#18203a', '#05070f'], cy: 30 }, `
  ${stars(90, 11, 400, .9)}
  <circle cx="470" cy="110" r="64" fill="#8a6a9a"/><ellipse cx="470" cy="110" rx="110" ry="20" fill="none" stroke="#e3c88c" stroke-width="5" transform="rotate(-18 470 110)" opacity=".85"/><circle cx="450" cy="92" r="18" fill="#fff" opacity=".12"/>
  <g transform="translate(250 150) rotate(35)" filter="url(#${id}-sh)"><path d="M0 -80 Q26 -50 26 10 L26 40 L-26 40 L-26 10 Q-26 -50 0 -80 Z" fill="#e9e4da"/><circle cy="-20" r="12" fill="#3e5f9a" stroke="#c9c0aa" stroke-width="3"/><path d="M-26 20 L-46 50 L-26 44 Z M26 20 L46 50 L26 44 Z" fill="#b8323a"/><path d="M-14 40 L0 76 L14 40 Z" fill="#ffb040" filter="url(#${id}-glow)"/></g>
  <g transform="translate(120 250) rotate(-14)" filter="url(#${id}-sh)"><rect x="-40" y="-56" width="80" height="112" rx="8" fill="#2a1d18"/><path d="M-40 -48 Q-40 -56 -32 -56 H32 Q40 -56 40 -48 V-38 H-40 Z" fill="#7a2e1e"/><text y="14" text-anchor="middle" font-size="40">👾</text></g>
`));

cover('hardsell', id => shell(id, { title: 'Hard Sell', tag: 'Invent it · pitch it · sell it', bg: ['#2f5a5a', '#1f3a3a', '#061010'], cy: 30 }, `
  ${glow(id, 300, 120, 150, '#ffdca0', .35)}
  <g transform="translate(300 88) rotate(-3)" filter="url(#${id}-sh)"><rect x="-120" y="-44" width="240" height="88" rx="8" fill="#f7efdc" stroke="#c9a35a" stroke-width="4"/><text y="-14" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="11" letter-spacing="3" fill="#8a6a2a">TODAY'S CUSTOMER</text><text y="22" text-anchor="middle" font-family="${SERIF}" font-size="34" fill="#2a2018">a Pirate</text></g>
  ${[['Bacon', 170, 205, -8], ['Umbrella', 400, 210, 6]].map(([w, x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})" filter="url(#${id}-sh)"><path d="M-84 -30 H70 L92 0 L70 30 H-84 Z" fill="#f1e2bf" stroke="#a8823c" stroke-width="2"/><circle cx="72" cy="0" r="6" fill="#1f3a3a"/><text x="-6" y="11" text-anchor="middle" font-family="${SERIF}" font-size="32" fill="#2a2018">${w}</text></g>`).join('')}
  <text x="288" y="222" text-anchor="middle" font-family="${SERIF}" font-size="44" fill="url(#${id}-gold)" filter="url(#${id}-sh)">+</text>
  <g transform="translate(520 260) rotate(14)" filter="url(#${id}-sh)"><rect x="-12" y="-46" width="24" height="56" rx="12" fill="#2a2a2e"/><rect x="-16" y="-50" width="32" height="34" rx="16" fill="#8a96a3"/><rect x="-3" y="10" width="6" height="40" fill="#5a5a60"/></g>
`));

// A letter tile seen from above (Words 4 Fun, Upwords, Bananagrams…).
function ltile(x, y, s, ch, o = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${o.rot || 0})"><rect x="${-s / 2}" y="${-s / 2 + s * .06}" width="${s}" height="${s}" rx="${s * .16}" fill="${o.edge || '#b49a68'}"/><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * .16}" fill="${o.fill || '#f6ecd4'}"/><text y="${s * .22}" text-anchor="middle" font-family="${SERIF}" font-size="${s * .62}" fill="${o.ink || '#2a2140'}">${ch}</text>${o.pts ? `<text x="${s * .3}" y="${s * .38}" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="${s * .18}" fill="${o.ink || '#2a2140'}">${o.pts}</text>` : ''}</g>`;
}

cover('words4fun', id => shell(id, { title: 'Words 4 Fun', tag: 'Two teams · one grid · go!', bg: ['#3a3878', '#22214a', '#0a0a18'], cy: 30 }, `
  ${glow(id, 300, 140, 160, '#ffd36a', .22)}
  <circle cx="92" cy="86" r="34" fill="#ffc94a" filter="url(#${id}-glow)"/>${Array.from({ length: 10 }, (_, i) => `<path d="M92 86 m${Math.cos(i * .628) * 44} ${Math.sin(i * .628) * 44} l${Math.cos(i * .628) * 14} ${Math.sin(i * .628) * 14}" stroke="#ffc94a" stroke-width="4" stroke-linecap="round"/>`).join('')}
  <path d="M528 62 a36 36 0 1 0 22 62 a30 30 0 1 1 -22 -62 Z" fill="#cfe0ff" filter="url(#${id}-glow)"/>
  <g transform="translate(300 150) rotate(-6)" filter="url(#${id}-sh)">
    <rect x="-132" y="-110" width="264" height="232" rx="20" fill="#8a5523"/><rect x="-124" y="-102" width="248" height="216" rx="16" fill="#a86a30"/>
    ${'WORDFUNSTARGAMES'.split('').map((ch, i) => ltile(-90 + (i % 4) * 60, -70 + Math.floor(i / 4) * 52, 48, ch, [0, 1, 2, 3].includes(i) ? { fill: '#ffd36a', edge: '#b07a1a' } : {})).join('')}
  </g>
`));

cover('hearts', id => shell(id, { title: 'Hearts', tag: 'Pass three · dodge the Queen', bg: ['#7a2a3c', '#4e1726', '#17060b'], cy: 34 }, `
  ${glow(id, 300, 150, 160, '#ff8aa0', .22)}
  ${[[150, 90, 26, -20], [470, 70, 20, 18], [530, 210, 16, -8], [90, 230, 14, 12]].map(([x, y, s, r]) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s / 20})" d="M0 8 C-14 -4 -22 -14 -12 -22 C-6 -26 0 -22 0 -16 C0 -22 6 -26 12 -22 C22 -14 14 -4 0 8 Z" fill="#e05a6c" opacity=".55"/>`).join('')}
  ${card(id, 220, 170, { rank: 'A', suit: '♥', red: true, rot: -18, w: 112 })}
  ${card(id, 380, 170, { rank: '10', suit: '♥', red: true, rot: 16, w: 112 })}
  ${card(id, 300, 150, { rank: 'Q', suit: '♠', rot: 0, w: 124, face: queenFace('#1d1b1a', 124) })}
`));
function queenFace(col, w) {
  const h = w * 1.4;
  return `<g transform="translate(${w / 2} ${h * .58}) scale(${w / 100})"><path d="M-18 -30 L-12 -42 L-4 -32 L0 -46 L4 -32 L12 -42 L18 -30 Z" fill="#d8b46a" stroke="${col}" stroke-width="1.4"/><circle cy="-14" r="13" fill="#f3e2c4" stroke="${col}" stroke-width="1.5"/><path d="M-13 -16 Q-16 0 -10 8 M13 -16 Q16 0 10 8" stroke="#6a4a2a" stroke-width="4" fill="none"/><path d="M-26 32 Q-24 4 0 2 Q24 4 26 32 Z" fill="#3a3a6a"/><circle cy="14" r="3.5" fill="#d8b46a"/></g>`;
}

cover('spades', id => shell(id, { title: 'Spades', tag: 'Partners · bids · trumps', bg: ['#2c3c64', '#18223e', '#06080f'], cy: 34 }, `
  ${stars(50, 3, 240, .5)}
  <text x="470" y="170" text-anchor="middle" font-family="${SYM}" font-size="220" fill="#0c1222" opacity=".55">♠</text>
  ${card(id, 210, 165, { rank: 'A', suit: '♠', rot: -14, w: 120 })}
  ${card(id, 320, 155, { rank: 'K', suit: '♠', rot: 6, w: 120, face: kingFace(120) })}
  <g filter="url(#${id}-sh)"><rect x="410" y="210" width="130" height="44" rx="22" fill="#f3ead6"/><text x="475" y="240" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="20" letter-spacing="2" fill="#18223e">BID 4</text></g>
`));

cover('war', id => shell(id, { title: 'War', tag: 'Flip · compare · conquer', bg: ['#3e5f86', '#24395a', '#0a1220'], cy: 34 }, `
  ${glow(id, 300, 160, 140, '#ffb050', .3)}
  ${card(id, 150, 175, { back: true, rot: -8, w: 96, backFill: '#24395a' })}${card(id, 158, 168, { back: true, rot: -4, w: 96, backFill: '#24395a' })}
  ${card(id, 450, 175, { back: true, rot: 8, w: 96, backFill: '#6a1f24' })}${card(id, 442, 168, { back: true, rot: 4, w: 96, backFill: '#6a1f24' })}
  ${card(id, 262, 160, { rank: 'K', suit: '♣', rot: -10, w: 112, face: kingFace(112) })}
  ${card(id, 340, 160, { rank: 'K', suit: '♦', red: true, rot: 10, w: 112, face: kingFace(112) })}
  <g transform="translate(300 74)" filter="url(#${id}-sh)"><path d="M-70 -24 L70 -24 L60 0 L70 24 L-70 24 L-60 0 Z" fill="#b8323a"/><text y="11" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="30" letter-spacing="8" fill="#fff3d6">WAR!</text></g>
`));

cover('oldmaid', id => shell(id, { title: 'Old Maid', tag: 'Pair up · don’t get stuck', bg: ['#5e4580', '#3a2a52', '#120c1c'], cy: 34 }, `
  ${glow(id, 300, 150, 150, '#e7c4ff', .2)}
  ${[-2, -1, 0, 1, 2].map(i => card(id, 300 + i * 52, 175 + Math.abs(i) * 8, i === 1 ? { rank: 'Q', suit: '♠', rot: i * 10, w: 104, face: queenFace('#1d1b1a', 104) } : { back: true, rot: i * 10, w: 104, backFill: '#3a2a52' })).join('')}
  <g transform="translate(352 62)" filter="url(#${id}-sh)"><circle r="24" fill="#f3ead6"/><text y="10" text-anchor="middle" font-size="28">😱</text></g>
`));

cover('rummy', id => shell(id, { title: 'Rummy', tag: 'Draw · meld · go out', bg: ['#357052', '#1f4a33', '#081a10'], cy: 34 }, `
  ${[['7', '♥', true], ['7', '♣', false], ['7', '♦', true]].map(([r, s, red], i) => card(id, 130 + i * 44, 165, { rank: r, suit: s, red, w: 88, rot: -6 + i * 3 })).join('')}
  ${[['4', '♠'], ['5', '♠'], ['6', '♠'], ['7', '♠']].map(([r, s], i) => card(id, 360 + i * 42, 155, { rank: r, suit: s, w: 88, rot: 4 - i * 2 })).join('')}
`));

cover('gin', id => shell(id, { title: 'Gin Rummy', tag: 'Knock · or go Gin', bg: ['#2a5a40', '#1b3f2c', '#081a10'], cy: 34 }, `
  ${[-3, -2, -1, 0, 1, 2, 3].map(i => card(id, 300 + i * 44, 180 + Math.abs(i) * 6, { rank: ['9', '9', '9', 'J', 'Q', 'K', 'A'][i + 3], suit: ['♣', '♥', '♠', '♦', '♦', '♦', '♦'][i + 3], red: [0, 1, 0, 1, 1, 1, 1][i + 3], rot: i * 6, w: 92 })).join('')}
  <g transform="translate(486 80) rotate(10)" filter="url(#${id}-sh)"><circle r="40" fill="#f3ead6"/><circle r="34" fill="none" stroke="#1b3f2c" stroke-width="2"/><text y="12" text-anchor="middle" font-family="${SERIF}" font-size="34" fill="#1b3f2c">GIN</text></g>
`));

cover('drawpoker', id => shell(id, { title: 'Five-Card Draw', tag: 'Ante · draw · show down', bg: ['#8a2a30', '#5a161c', '#1a0608'], cy: 34 }, `
  ${stack(id, 110, 250, 38, 6, '#1d1d22', '#d8b46a')}${stack(id, 500, 250, 38, 8, '#2f5a85')}
  ${[-2, -1, 0, 1, 2].map(i => card(id, 300 + i * 50, 160 + Math.abs(i) * 7, { rank: ['A', 'A', 'K', 'K', 'K'][i + 2], suit: ['♠', '♥', '♣', '♦', '♠'][i + 2], red: [0, 1, 0, 1, 0][i + 2], rot: i * 8, w: 100, face: i >= 0 ? kingFace(100) : '' })).join('')}
`));

cover('cribbage', id => shell(id, { title: 'Cribbage', tag: 'Fifteen two · peg to 121', bg: ['#46703f', '#2c4a2a', '#0c160c'], cy: 34 }, `
  <g transform="translate(300 120) rotate(-6)" filter="url(#${id}-sh)"><rect x="-230" y="-40" width="460" height="80" rx="16" fill="#a06a38"/><rect x="-230" y="-40" width="460" height="80" rx="16" fill="none" stroke="#5a3a1a" stroke-width="3"/>
  ${Array.from({ length: 30 }, (_, i) => [-1, 1].map(r => `<circle cx="${-210 + i * 14.5}" cy="${r * 14 - 6}" r="3" fill="#3a2210"/>`).join('') + `<circle cx="${-210 + i * 14.5}" cy="22" r="3" fill="#3a2210"/>`).join('')}
  <rect x="-60" y="-34" width="8" height="26" rx="4" fill="#c0392b"/><rect x="40" y="-6" width="8" height="26" rx="4" fill="#2f6fae"/></g>
  ${card(id, 210, 250, { rank: '5', suit: '♥', red: true, w: 80, rot: -10 })}${card(id, 262, 252, { rank: 'J', suit: '♣', w: 80, rot: 0, face: jackFace('#1d1b1a', 80) })}${card(id, 314, 250, { rank: '5', suit: '♠', w: 80, rot: 10 })}
`));

cover('stackup', id => shell(id, { title: 'Stack Up', tag: 'Build 1 to 12 · empty your stock', bg: ['#5e4a86', '#3a2c54', '#110c1a'], cy: 32 }, `
  ${glow(id, 300, 150, 150, '#ffd36a', .2)}
  ${[1, 2, 3, 4, 5, 6].map((v, i) => `<g transform="translate(${200 + i * 26} ${210 - i * 22}) rotate(${-14 + i * 5})" filter="url(#${id}-sh)"><rect x="-44" y="-62" width="88" height="124" rx="9" fill="#fffaf0" stroke="${v <= 4 ? '#2f7a8a' : '#c27a1e'}" stroke-width="5"/><text y="20" text-anchor="middle" font-family="${SERIF}" font-size="58" fill="${v <= 4 ? '#2f7a8a' : '#c27a1e'}">${v}</text></g>`).join('')}
  <g transform="translate(480 150) rotate(12)" filter="url(#${id}-sh)"><rect x="-44" y="-62" width="88" height="124" rx="9" fill="#f0c75a" stroke="#b8892a" stroke-width="5"/><text y="22" text-anchor="middle" font-size="56" fill="#5a3a08">★</text></g>
`));

cover('rackem', id => shell(id, { title: 'Rack ’Em', tag: 'Low to high · ten slots', bg: ['#357078', '#1f4a52', '#081619'], cy: 32 }, `
  <g transform="translate(300 150) rotate(-8)" filter="url(#${id}-sh)"><rect x="-160" y="-120" width="320" height="230" rx="16" fill="#8a5a32"/>
  ${[4, 11, 17, 23, 30, 36, 42, 49].map((v, i) => `<g transform="translate(0 ${-102 + i * 26})"><rect x="-140" y="0" width="280" height="22" rx="4" fill="#fbf5e6"/><rect x="-140" y="0" width="60" height="22" rx="4" fill="hsl(${200 - v * 3} 55% 45%)"/><text x="-110" y="17" text-anchor="middle" font-family="${SERIF}" font-size="18" fill="#fff">${v}</text><rect x="${-70 + v * 3.6}" y="6" width="22" height="10" rx="5" fill="hsl(${200 - v * 3} 55% 45%)" opacity=".7"/></g>`).join('')}</g>
`));

cover('bento', id => shell(id, { title: 'Bento Box', tag: 'Pick one · pass the rest', bg: ['#9a4a3e', '#5a2a22', '#1c0b08'], cy: 32 }, `
  <g transform="translate(300 140) rotate(-5)" filter="url(#${id}-sh)"><rect x="-170" y="-90" width="340" height="190" rx="18" fill="#1a0f0a"/><rect x="-160" y="-80" width="320" height="170" rx="12" fill="#2a1a12" stroke="#c9853a" stroke-width="3"/>
  <path d="M0 -80 V90 M-160 5 H0" stroke="#c9853a" stroke-width="3"/>
  <text x="-80" y="-12" text-anchor="middle" font-size="56">🍣</text><text x="80" y="20" text-anchor="middle" font-size="80">🍙</text><text x="-120" y="70" text-anchor="middle" font-size="44">🥟</text><text x="-50" y="70" text-anchor="middle" font-size="44">🍡</text></g>
  <text x="520" y="90" font-size="56" transform="rotate(20 520 90)">🥢</text>
`));

cover('dealmaker', id => shell(id, { title: 'Deal Maker', tag: 'Rent · steal · three sets', bg: ['#3a8a72', '#1f5a4a', '#081a15'], cy: 32 }, `
  ${[['#c8323a', 'Theatre Lane', -18, 200], ['#e6c23a', 'Sunny Heights', -4, 280], ['#3a9a5a', 'Park Avenue', 10, 360]].map(([c, n, r, x]) => `<g transform="translate(${x} 160) rotate(${r})" filter="url(#${id}-sh)"><rect x="-58" y="-82" width="116" height="164" rx="9" fill="#fffaf0"/><rect x="-58" y="-82" width="116" height="52" rx="9" fill="${c}"/><rect x="-58" y="-42" width="116" height="12" fill="${c}"/><text y="10" text-anchor="middle" font-family="${SERIF}" font-size="13.5" fill="#2a2018">${n}</text><text y="40" text-anchor="middle" font-family="${UI}" font-size="11" fill="#5a4a3a">rent 2 · 4 · 7</text></g>`).join('')}
  <g transform="translate(500 120) rotate(14)" filter="url(#${id}-sh)"><rect x="-50" y="-70" width="100" height="140" rx="9" fill="#b8d4a0" stroke="#5a8a4a" stroke-width="5"/><text y="18" text-anchor="middle" font-family="${SERIF}" font-size="56" fill="#2a5a2a">5</text></g>
`));

cover('roadrally', id => shell(id, { title: 'Road Rally', tag: 'A thousand miles · watch for hazards', bg: ['#76884e', '#4a5a30', '#141a0c'], cy: 30 }, `
  <path d="M-20 300 Q200 180 300 200 T640 120" stroke="#3a3a3a" stroke-width="70" fill="none"/><path d="M-20 300 Q200 180 300 200 T640 120" stroke="#f3d67a" stroke-width="4" stroke-dasharray="22 18" fill="none"/>
  <g transform="translate(300 196) scale(-1 1)"><text text-anchor="middle" font-size="64">🚗</text></g>
  ${[['100', '#3a6a9a', 120, 110, -10], ['💥', '#b8323a', 470, 70, 12]].map(([t, c, x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})" filter="url(#${id}-sh)"><rect x="-42" y="-58" width="84" height="116" rx="8" fill="#fffaf0" stroke="${c}" stroke-width="5"/><text y="${t.length > 2 ? 14 : 18}" text-anchor="middle" font-family="${SERIF}" font-size="${t.length > 2 ? 38 : 44}" fill="${c}">${t}</text></g>`).join('')}
`));

cover('unicorns', id => shell(id, { title: 'Unicorn Chaos', tag: 'Seven unicorns · zero mercy', bg: ['#8a4aa0', '#4a2656', '#1a0c20'], cy: 30, defs: `<linearGradient id="${id}-rb" x1="0" x2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".3" stop-color="#ffd36a"/><stop offset=".6" stop-color="#6ae08a"/><stop offset="1" stop-color="#6ab0ff"/></linearGradient>` }, `
  ${stars(60, 7, 300, .8)}
  ${glow(id, 300, 140, 150, '#ffb0f0', .3)}
  <path d="M0 260 Q150 200 300 230 T600 210" stroke="url(#${id}-rb)" stroke-width="26" fill="none" opacity=".55"/>
  ${[[180, 160, -14, 290, '🦄'], [300, 140, 0, 200, '✨'], [420, 160, 14, 330, '🦄']].map(([x, y, r, h, e]) => `<g transform="translate(${x} ${y}) rotate(${r})" filter="url(#${id}-sh)"><rect x="-54" y="-76" width="108" height="152" rx="10" fill="hsl(${h} 70% 94%)" stroke="hsl(${h} 50% 55%)" stroke-width="5"/><text y="18" text-anchor="middle" font-size="58">${e}</text></g>`).join('')}
`));

cover('powergrab', id => shell(id, { title: 'Power Grab', tag: 'Claim it · bluff it · seize it', bg: ['#6a3a52', '#3a2030', '#12080e'], cy: 30 }, `
  ${glow(id, 300, 130, 140, '#ffd38a', .3)}
  ${[['👑', '#a8323a', 'Duchess', -14, 230], ['🗡️', '#2a2a2a', 'Shadow', 12, 370]].map(([e, c, n, r, x]) => `<g transform="translate(${x} 150) rotate(${r})" filter="url(#${id}-sh)"><rect x="-60" y="-84" width="120" height="168" rx="10" fill="#fffaf0" stroke="${c}" stroke-width="6"/><rect x="-52" y="-76" width="104" height="152" rx="6" fill="none" stroke="${c}" stroke-width="1.5"/><text y="14" text-anchor="middle" font-size="58">${e}</text><text y="56" text-anchor="middle" font-family="${SERIF}" font-size="20" fill="${c}">${n}</text></g>`).join('')}
  ${[100, 130, 160].map((x, i) => `<circle cx="${x}" cy="${250 - i * 6}" r="16" fill="#e8c35a" stroke="#9a7020" stroke-width="2"/>`).join('')}
`));

cover('rebelcell', id => shell(id, { title: 'Rebel Cell', tag: 'Five missions · hidden spies', bg: ['#3a5050', '#1c2828', '#080e0e'], cy: 30 }, `
  <g opacity=".2" stroke="#9fd6dc">${Array.from({ length: 10 }, (_, i) => `<path d="M0 ${i * 40} H600 M${i * 64} 0 V400"/>`).join('')}</g>
  ${[0, 1, 2, 3, 4].map(i => `<g filter="url(#${id}-sh)"><circle cx="${140 + i * 80}" cy="130" r="30" fill="${['#2f8a4a', '#b8323a', '#2f8a4a', 'none', 'none'][i]}" stroke="#e3d2ab" stroke-width="3"/><text x="${140 + i * 80}" y="141" text-anchor="middle" font-family="${SERIF}" font-size="30" fill="#fff">${['✓', '✗', '✓', '4', '5'][i]}</text></g>`).join('')}
  <text x="300" y="235" text-anchor="middle" font-size="60">🕵️</text>
`));

cover('roundtable', id => shell(id, { title: 'Round Table', tag: 'Knights · traitors · a hidden Seer', bg: ['#7a5228', '#3e2814', '#140c06'], cy: 30 }, `
  ${glow(id, 300, 140, 150, '#ffd38a', .25)}
  <g filter="url(#${id}-sh)"><ellipse cx="300" cy="160" rx="170" ry="70" fill="#6a4220" stroke="#c9a35a" stroke-width="4"/><ellipse cx="300" cy="155" rx="150" ry="58" fill="#7a5028"/></g>
  ${['🛡️', '🔮', '🛡️', '🔪', '🛡️', '🐎', '🧙'].map((e, i) => { const a = Math.PI * (1.08 + i * 0.14); return `<text x="${300 + Math.cos(a) * 205}" y="${172 + Math.sin(a) * 100}" text-anchor="middle" font-size="34">${e}</text>`; }).join('')}
  <text x="300" y="175" text-anchor="middle" font-size="50">🗡️</text>
`));

cover('reversi', id => shell(id, { title: 'Reversi', tag: 'Trap · flip · take the board', bg: ['#3a8a5a', '#215c39', '#08180e'], cy: 32 }, `
  <g transform="translate(300 150) rotate(-8)" filter="url(#${id}-sh)"><rect x="-150" y="-110" width="300" height="220" rx="10" fill="#1a1410"/>
  ${Array.from({ length: 30 }, (_, i) => { const r = Math.floor(i / 6), c = i % 6; const v = [1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, null, 1, null, 1, 0, null, 0, 1][i]; return `<rect x="${-142 + c * 47.5}" y="${-102 + r * 41}" width="45" height="39" rx="3" fill="#2f7a4e"/>${v == null ? '' : `<ellipse cx="${-119.5 + c * 47.5}" cy="${-82.5 + r * 41}" rx="17" ry="15" fill="${v ? '#f6efe0' : '#151515'}" stroke="${v ? '#c8bfae' : '#444'}"/>`}`; }).join('')}</g>
`));

cover('go', id => shell(id, { title: 'Go', tag: 'Surround · capture · territory', bg: ['#c8964e', '#8a5a26', '#2a1a08'], cy: 30 }, `
  <g transform="translate(300 160) rotate(-6)" filter="url(#${id}-sh)"><rect x="-170" y="-130" width="340" height="260" rx="6" fill="#e0b06a"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${-150 + i * 37.5} -110 V110 M-150 ${-110 + i * 27.5} H150" stroke="#3a2210" stroke-width="1.5"/>`).join('')}
  ${[[2, 2, 0], [3, 2, 1], [3, 3, 0], [4, 3, 1], [4, 4, 0], [5, 4, 1], [2, 5, 0], [6, 2, 1], [5, 5, 0], [6, 6, 1], [3, 6, 1], [4, 6, 0]].map(([c, r, w]) => `<circle cx="${-150 + c * 37.5}" cy="${-110 + r * 27.5}" r="15" fill="${w ? '#f6f1e4' : '#151515'}" stroke="${w ? '#bdb4a2' : '#000'}"/>`).join('')}</g>
`));

cover('codebreaker', id => shell(id, { title: 'Code Breaker', tag: 'Four pegs · ten tries', bg: ['#7a5232', '#4a2e16', '#140a04'], cy: 30 }, `
  <g transform="translate(300 150) rotate(-10)" filter="url(#${id}-sh)"><rect x="-170" y="-80" width="340" height="170" rx="14" fill="#6a4424"/>
  ${[[0, 4, 1, 2], [3, 3, 5, 0], [1, 4, 3, 2], [2, 4, 1, 3]].map((row, r) => row.map((c, k) => `<circle cx="${-130 + k * 42}" cy="${-50 + r * 38}" r="14" fill="${['#d8443a', '#e8a33a', '#e6d84a', '#4aa85a', '#3a7ad8', '#9a5ad0'][c]}"/>`).join('') + [0, 1, 2, 3].map(k => `<circle cx="${60 + (k % 2) * 16}" cy="${-58 + r * 38 + Math.floor(k / 2) * 16}" r="5.5" fill="${k < r ? '#e8c35a' : k < r + 1 ? '#e8e8f0' : '#2a1a10'}"/>`).join('')).join('')}
  <rect x="110" y="-70" width="50" height="150" rx="8" fill="#c9a35a"/><text x="135" y="12" text-anchor="middle" font-size="28">🔒</text></g>
`));

cover('starjump', id => shell(id, { title: 'Star Jump', tag: 'Hop · jump · race across', bg: ['#3a3a5a', '#1c1c2c', '#0a0a12'], cy: 34 }, `
  ${stars(50, 5, 400, .5)}
  <g transform="translate(300 170)" filter="url(#${id}-sh)"><circle r="150" fill="#5a3a20"/>
  ${(() => { let h = ''; for (let q = -8; q <= 8; q++) for (let r = -8; r <= 8; r++) { const s = -q - r; if (Math.abs(s) > 8) continue; if (!((q >= -4 && r >= -4 && s >= -4) || (q <= 4 && r <= 4 && s <= 4))) continue; const x = 8.6 * Math.sqrt(3) * (q + r / 2), y = 8.6 * 1.5 * r; const col = r > 4 ? '#3a7ad8' : r < -4 ? '#d8443a' : q > 4 ? '#e8c23a' : q < -4 ? '#4aa85a' : s > 4 ? '#9a5ad0' : s < -4 ? '#e8892a' : null; h += col ? `<circle cx="${x}" cy="${y}" r="5.5" fill="${col}"/><circle cx="${x - 1.5}" cy="${y - 1.8}" r="1.8" fill="#fff" opacity=".6"/>` : `<circle cx="${x}" cy="${y}" r="2.6" fill="#2a1a08"/>`; } return h; })()}</g>
`));

cover('dominoes', id => shell(id, { title: 'Dominoes', tag: 'Match the ends', bg: ['#2a6070', '#15343f', '#071418'], cy: 32 }, `
  ${[[[6, 6], 150, 120, 90], [[6, 3], 215, 150, 0], [[3, 5], 300, 150, 0], [[5, 5], 365, 150, 90], [[5, 2], 430, 150, 0], [[2, 1], 500, 120, -30]].map(([[a, b], x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})" filter="url(#${id}-sh)"><rect x="-40" y="-20" width="80" height="40" rx="6" fill="#fbf6ea" stroke="#b8ad96"/><path d="M0 -15 V15" stroke="#8a7a5a" stroke-width="1.5"/>${[[a, -20], [b, 20]].map(([n, ox]) => ({ 0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] })[n].map(([px, py]) => `<circle cx="${ox + px * 10}" cy="${py * 10}" r="3.4" fill="#1a1612"/>`).join('')).join('')}</g>`).join('')}
`));

cover('cornerstones', id => shell(id, { title: 'Cornerstones', tag: 'Corner to corner · never side by side', bg: ['#4a4e5a', '#262a32', '#0c0d10'], cy: 32 }, `
  <g transform="translate(300 150) rotate(-12)" filter="url(#${id}-sh)"><rect x="-140" y="-120" width="280" height="240" rx="8" fill="#2a2e36"/>
  ${(() => { const P = { '#3a7ad8': [[0, 9], [1, 9], [1, 8], [2, 7], [3, 7], [3, 6], [4, 5], [4, 4]], '#e8c23a': [[0, 0], [0, 1], [1, 2], [2, 2], [2, 3], [3, 4]], '#d8443a': [[11, 0], [10, 0], [10, 1], [9, 2], [8, 2], [8, 3], [7, 4], [7, 5]], '#4aa85a': [[11, 9], [11, 8], [10, 7], [9, 7], [9, 6], [8, 5]] }; let h = ''; for (const [c, cells] of Object.entries(P)) for (const [x, y] of cells) h += `<rect x="${-132 + x * 22}" y="${-112 + y * 22.5}" width="20" height="20.5" rx="3" fill="${c}"/>`; return h; })()}</g>
`));

cover('shapeshade', id => shell(id, { title: 'Shape & Shade', tag: 'One colour or one shape', bg: ['#4a4a52', '#232328', '#0b0b0d'], cy: 32 }, `
  ${[[0, 0, 0], [1, 0, 1], [2, 0, 2], [3, 0, 3], [0, 1, 6], [0, 2, 12], [1, 2, 13], [2, 2, 14], [3, -1, 9], [3, 1, 21], [4, 0, 4]].map(([x, y, k]) => { const c = ['#d8443a', '#e8892a', '#e6c83a', '#4aa85a', '#3a7ad8', '#9a5ad0'][Math.floor(k / 6)], s = ['●', '■', '◆', '✚', '★', '✿'][k % 6]; return `<g transform="translate(${170 + x * 62} ${100 + y * 62}) rotate(-6)" filter="url(#${id}-sh)"><rect x="-28" y="-28" width="56" height="56" rx="8" fill="#16161a"/><text y="13" text-anchor="middle" font-family="${SYM}" font-size="36" fill="${c}">${s}</text></g>`; }).join('')}
`));

cover('lineup5', id => shell(id, { title: 'Line Up 5', tag: 'Play a card · place a chip', bg: ['#357052', '#1b3f2c', '#081a10'], cy: 32 }, `
  <g transform="translate(300 150) rotate(-8)" filter="url(#${id}-sh)"><rect x="-160" y="-110" width="320" height="220" rx="8" fill="#3a2414"/>
  ${Array.from({ length: 35 }, (_, i) => { const r = Math.floor(i / 7), c = i % 7; const lab = ['7♥', 'K♠', '2♦', '9♣', 'A♥', '4♠', 'Q♦'][(i * 3) % 7]; return `<rect x="${-152 + c * 43.5}" y="${-102 + r * 41}" width="41" height="39" rx="3" fill="#fbf5e6"/><text x="${-131.5 + c * 43.5}" y="${-78 + r * 41}" text-anchor="middle" font-family="${SERIF}" font-size="14" fill="${/[♥♦]/.test(lab) ? '#a8222b' : '#1c1a1f'}">${lab}</text>`; }).join('')}
  ${[0, 1, 2, 3, 4].map(k => `<circle cx="${-131.5 + (k + 1) * 43.5}" cy="${-81.5 + k * 41}" r="15" fill="#3a7ad8" stroke="#f3d67a" stroke-width="3"/>`).join('')}
  ${[[0, 3], [5, 1], [6, 3]].map(([c, r]) => `<circle cx="${-131.5 + c * 43.5}" cy="${-81.5 + r * 41}" r="15" fill="#4aa85a"/>`).join('')}</g>
`));

// A plain die face for covers.
function die6(id, x, y, s, v, rot = 0, fill = '#f7f1e3') { return die(id, x, y, s, v, { rot, fill }); }

cover('hotdice', id => shell(id, { title: 'Hot Dice', tag: 'Keep the scorers · bank or bust', bg: ['#a8323a', '#55161b', '#1c0608'], cy: 32 }, `
  ${glow(id, 300, 150, 150, '#ff8a3a', .35)}
  ${[[180, 120, 1, -14], [260, 160, 5, 10], [340, 110, 1, -6], [420, 170, 1, 18], [220, 230, 3, 30], [380, 240, 6, -22]].map(([x, y, v, r]) => die6(id, x, y, 70, v, r)).join('')}
  <text x="470" y="96" font-size="54" filter="url(#${id}-glow)">🔥</text>
`));

cover('hogtoss', id => shell(id, { title: 'Hog Toss', tag: 'Two pigs · push your luck', bg: ['#8a9a4a', '#4a5628', '#161a0a'], cy: 32 }, `
  <ellipse cx="300" cy="170" rx="210" ry="90" fill="#d8b860" opacity=".9"/><ellipse cx="300" cy="170" rx="210" ry="90" fill="none" stroke="#a8862a" stroke-width="4" stroke-dasharray="10 6"/>
  ${[[230, 160, 'rotate(-35)'], [380, 150, 'scale(-1 1) rotate(55)']].map(([x, y, t]) => `<g transform="translate(${x} ${y}) scale(1.8)" filter="url(#${id}-sh)"><g transform="${t}"><ellipse rx="30" ry="20" fill="#f4a6b4" stroke="#c96a80" stroke-width="2"/><circle cx="27" cy="-8" r="15" fill="#f4a6b4" stroke="#c96a80" stroke-width="2"/><ellipse cx="40" cy="-5" rx="6" ry="7" fill="#f7bcc8" stroke="#c96a80"/><path d="M20 -20 L26 -32 L31 -20 Z" fill="#e88aa0"/><circle cx="30" cy="-12" r="2" fill="#2a1a1a"/>${[-18, -6, 8, 18].map(lx => `<rect x="${lx - 3.5}" y="14" width="7" height="12" rx="3" fill="#f4a6b4" stroke="#c96a80" stroke-width="1.5"/>`).join('')}</g></g>`).join('')}
`));

cover('bingo', id => shell(id, { title: 'Bingo', tag: 'The table calls · your phone daubs', bg: ['#3a4a8a', '#1c284a', '#080c1a'], cy: 32 }, `
  <g transform="translate(220 150) rotate(-8)" filter="url(#${id}-sh)"><rect x="-110" y="-110" width="220" height="210" rx="12" fill="#f7f0de"/>
  ${'BINGO'.split('').map((L, c) => `<text x="${-84 + c * 42}" y="-80" text-anchor="middle" font-family="${SERIF}" font-size="24" fill="#b8323a">${L}</text>`).join('')}
  ${Array.from({ length: 20 }, (_, i) => { const r = Math.floor(i / 5), c = i % 5; const n = [7, 22, 41, 53, 68, 3, 19, 0, 50, 72, 12, 27, 35, 47, 61, 9, 30, 44, 58, 66][i]; const daub = [0, 6, 7, 12, 18].includes(i); return `<rect x="${-102 + c * 42}" y="${-66 + r * 40}" width="36" height="34" rx="5" fill="#fff" stroke="#d8ccb0"/>${daub ? `<circle cx="${-84 + c * 42}" cy="${-49 + r * 40}" r="14" fill="#e8506a" opacity=".85"/>` : ''}<text x="${-84 + c * 42}" y="${-42 + r * 40}" text-anchor="middle" font-family="${SERIF}" font-size="18" fill="${daub ? '#fff' : '#1a1a2a'}">${n || '★'}</text>`; }).join('')}</g>
  <g transform="translate(450 120)" filter="url(#${id}-sh)"><circle r="62" fill="#fffaf0"/><circle r="62" fill="none" stroke="#c8b890" stroke-width="3"/><text y="-14" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="22" fill="#b8323a">G</text><text y="34" text-anchor="middle" font-family="${SERIF}" font-size="50" fill="#1a1a2a">52</text></g>
`));

cover('snakes', id => shell(id, { title: 'Snakes & Ladders', lines: ['Snakes &', 'Ladders'], size: 44, tag: 'Climb up · slide down', bg: ['#4a7a4a', '#283f28', '#0c160c'], cy: 30 }, `
  <g transform="translate(300 150) rotate(-6)" filter="url(#${id}-sh)">${Array.from({ length: 48 }, (_, i) => { const r = Math.floor(i / 8), c = i % 8; return `<rect x="${-160 + c * 40}" y="${-120 + r * 40}" width="40" height="40" fill="${(r + c) % 2 ? '#e9dcb8' : '#b8c99a'}"/>`; }).join('')}
  <g stroke="#8a5a2a" stroke-width="5" stroke-linecap="round"><path d="M-100 100 L-40 -90 M-80 106 L-20 -84"/>${[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map(t => `<path d="M${-100 + 60 * t} ${100 - 190 * t} L${-80 + 60 * t} ${106 - 190 * t}" stroke-width="3.5"/>`).join('')}</g>
  <path d="M110 -100 C 170 -40, 40 0, 100 90" stroke="#2f6a3a" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M110 -100 C 170 -40, 40 0, 100 90" stroke="#6ab04a" stroke-width="9" fill="none" stroke-dasharray="9 7" stroke-linecap="round"/><circle cx="110" cy="-100" r="13" fill="#2f6a3a"/></g>
`));

cover('sweettrail', id => shell(id, { title: 'Sweet Trail', tag: 'Draw a colour · follow the path', bg: ['#a86ab8', '#55306a', '#1c0c24'], cy: 30 }, `
  <path d="M40 260 C 160 300, 120 160, 260 180 S 420 280, 470 150 S 540 60, 580 70" stroke="#fff8ea" stroke-width="40" fill="none" stroke-linecap="round"/>
  ${Array.from({ length: 16 }, (_, i) => { const t = i / 15; const x = 40 + t * 540, y = 260 - Math.sin(t * Math.PI * 1.6) * 70 - t * 120; return `<rect x="${x - 15}" y="${y - 15}" width="30" height="30" rx="7" fill="${['#e0505a', '#9a5ad0', '#f0cc3a', '#4a90e0', '#f08a2a', '#4ab060'][i % 6]}" stroke="#fff" stroke-width="3" transform="rotate(${i * 7} ${x} ${y})"/>`; }).join('')}
  <text x="545" y="80" font-size="60">🏰</text><text x="120" y="110" font-size="46">🍭</text><text x="330" y="90" font-size="42">🧁</text>
`));

cover('orchard', id => shell(id, { title: 'Orchard', tag: 'Spin · pick · don’t spill', bg: ['#6a9a4a', '#34582a', '#10200c'], cy: 32 }, `
  <g transform="translate(220 140) scale(4)" filter="url(#${id}-sh)"><rect x="-4" y="0" width="8" height="24" rx="2" fill="#7a4a24"/><circle cx="0" cy="-12" r="22" fill="#3f8a3a"/><circle cx="-12" cy="-6" r="13" fill="#4a9a44"/><circle cx="12" cy="-6" r="13" fill="#4a9a44"/>
  ${[[0, -22], [-14, -16], [14, -16], [-20, -4], [20, -4], [-9, -8], [9, -8]].map(([x, y]) => `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="9">🍒</text>`).join('')}</g>
  <g transform="translate(450 150)" filter="url(#${id}-sh)">${[0, 1, 2, 3, 4, 5, 6].map(k => { const a0 = (k / 7) * 6.283 - 1.57, a1 = ((k + 1) / 7) * 6.283 - 1.57; return `<path d="M0 0 L${Math.cos(a0) * 80} ${Math.sin(a0) * 80} A80 80 0 0 1 ${Math.cos(a1) * 80} ${Math.sin(a1) * 80} Z" fill="${['#f3d67a', '#9ad0f0', '#f0a0b8', '#b8e0a0', '#2a2a2a', '#c9a35a', '#d8443a'][k]}" stroke="#fff" stroke-width="2"/>`; }).join('')}<path d="M0 -66 L8 0 L-8 0 Z" fill="#1a1a1a" transform="rotate(40)"/><circle r="8" fill="#c9a35a"/></g>
`));

function raceCover(id, o) {
  return shell(id, o, `
  <g transform="translate(300 150) rotate(-8)" filter="url(#${id}-sh)"><rect x="-140" y="-120" width="280" height="240" rx="14" fill="#f3ead6"/>
  ${Array.from({ length: o.n }, (_, k) => { const per = 4 * 200, u = (k / o.n) * per; let x, y; if (u < 200) { x = 100 - u; y = 100; } else if (u < 400) { x = -100; y = 100 - (u - 200); } else if (u < 600) { x = -100 + (u - 400); y = -100; } else { x = 100; y = -100 + (u - 600); } return `<circle cx="${x}" cy="${y}" r="${o.n > 40 ? 5.5 : 8}" fill="${o.corner && k % (o.n / 4) === o.n / 8 ? '#e8c35a' : '#fffaf0'}" stroke="#8a7a5a"/>`; }).join('')}
  ${['#3a7ad8', '#e8c23a', '#d8443a', '#4aa85a'].map((c, s) => { const ang = s * 90; return `<g transform="rotate(${ang})">${[0, 1, 2, 3].map(j => `<circle cx="0" cy="${80 - j * 18}" r="7" fill="${c}" opacity="${j === 3 ? .9 : .35}"/>`).join('')}<circle cx="${-30}" cy="112" r="8" fill="${c}"/><circle cx="${-14}" cy="112" r="8" fill="${c}"/></g>`; }).join('')}
  ${o.center || ''}</g>
  ${die(id, 500, 260, 70, 6, { rot: 16 })}`);
}
cover('ludo', id => raceCover(id, { title: 'Ludo', tag: 'Roll a six · race them home', bg: ['#4a5a8a', '#28344a', '#0c1018'], cy: 30, n: 52 }));
cover('poprace', id => raceCover(id, { title: 'Pop-Up Race', tag: 'Pop · chase · bump', bg: ['#8a3a5a', '#4a1c34', '#180810'], cy: 30, n: 28, center: '<circle r="34" fill="#fff" opacity=".35" stroke="#fff" stroke-width="3"/>' }));
cover('marblerush', id => raceCover(id, { title: 'Marble Rush', tag: 'Shortcuts · hubs · aggravation', bg: ['#3a7a7a', '#1c3e3e', '#081616'], cy: 30, n: 56, corner: true, center: '<circle r="20" fill="#e8c35a" stroke="#8a6a2a" stroke-width="3"/>' }));
cover('pardon', id => shell(id, { title: 'Pardon Me!', tag: 'Draw · slide · bump them back', bg: ['#3a6aaa', '#1c3256', '#080e1a'], cy: 30 }, `
  ${[['11', -16, 200], ['🎩', 0, 300], ['4', 16, 400]].map(([t, r, x]) => `<g transform="translate(${x} 150) rotate(${r})" filter="url(#${id}-sh)"><rect x="-58" y="-80" width="116" height="160" rx="10" fill="#fffaf0" stroke="${t === '🎩' ? '#b8323a' : '#2a4a7a'}" stroke-width="6"/><text y="${t === '🎩' ? 22 : 26}" text-anchor="middle" font-family="${SERIF}" font-size="${t === '🎩' ? 64 : 80}" fill="#2a4a7a">${t}</text></g>`).join('')}
`));

cover('dontsay', id => shell(id, { title: 'Don’t Say It', tag: 'Describe it · don’t slip', bg: ['#5a3a8a', '#261c3e', '#0c0814'], cy: 30 }, `
  <g transform="translate(300 150) rotate(-6)" filter="url(#${id}-sh)"><rect x="-110" y="-110" width="220" height="210" rx="14" fill="#fffaf0"/><text y="-60" text-anchor="middle" font-family="${SERIF}" font-size="38" fill="#2a1a40">Pizza</text><path d="M-80 -40 H80" stroke="#c0392b" stroke-width="3"/>
  ${['cheese', 'slice', 'Italy', 'pepperoni'].map((w, i) => `<text y="${-8 + i * 28}" text-anchor="middle" font-family="${UI}" font-weight="700" font-size="20" fill="#a8323a">${w}</text>`).join('')}</g>
  <text x="470" y="110" font-size="70">🚨</text>
`));
cover('passphrase', id => shell(id, { title: 'Pass the Phrase', tag: 'Hot potato · ticking bomb', bg: ['#7a3a6a', '#4a2a4a', '#140814'], cy: 30 }, `
  ${glow(id, 300, 140, 140, '#ffb050', .35)}<text x="300" y="200" text-anchor="middle" font-size="150">💣</text>
`));

// ---- Party games batch 3
const partyCard = (id, x, y, rot, w, h, body, fill = '#fffaf0') => `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#${id}-sh)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="12" fill="${fill}"/>${body}</g>`;
cover('listoff', id => shell(id, { title: 'List Off', tag: 'One letter · ten categories', bg: ['#3a7a5a', '#1c4030', '#08160e'], cy: 30 }, `
  ${partyCard(id, 250, 150, -5, 230, 230, `${['A fruit', 'A city', 'An animal', 'Something cold', 'A job'].map((c, i) => `<text x="-96" y="${-74 + i * 38}" font-family="${UI}" font-size="13" fill="#6a5a3a">${i + 1}. ${c}</text><path d="M-96 ${-66 + i * 38} H96" stroke="#c8b88a" stroke-dasharray="3 3"/><text x="96" y="${-74 + i * 38}" text-anchor="end" font-family="${SERIF}" font-style="italic" font-size="18" fill="#2a4a8a">${['Mango', 'Madrid', 'Moose', 'Milkshake', 'Mechanic'][i]}</text>`).join('')}`)}
  ${die(id, 455, 130, 104, 'M', { rot: 12, fill: '#f2cf2a' })}
`));
cover('wordbluff', id => shell(id, { title: 'Word Bluff', tag: 'Fake the meaning · find the real one', bg: ['#6a4a2a', '#3a2814', '#140c06'], cy: 30 }, `
  ${partyCard(id, 300, 150, -3, 360, 200, `<text y="-46" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="44" fill="#3a2410">Snollygoster</text><text y="-14" text-anchor="middle" font-family="${UI}" font-size="14" letter-spacing="3" fill="#8a6a3a">WHICH MEANING IS REAL?</text>
  ${['a. A clever, unprincipled person', 'b. A pastry shaped like a ghost', 'c. A snow-covered hillside'].map((t, i) => `<text x="-150" y="${18 + i * 26}" font-family="${SERIF}" font-style="italic" font-size="17" fill="#3a2a1a">${t}</text>`).join('')}`, '#f6ecd4')}
  <text x="500" y="250" font-size="60">🤥</text>
`));
cover('quickthree', id => shell(id, { title: 'Quick Three', tag: 'Name three · five seconds', bg: ['#c84a2a', '#6a2414', '#200a04'], cy: 30 }, `
  ${glow(id, 300, 140, 130, '#ffb070', .35)}
  <g transform="translate(300 150)" filter="url(#${id}-sh)"><circle r="100" fill="#fffaf0"/><circle r="100" fill="none" stroke="#e0382c" stroke-width="14" stroke-dasharray="470 628" transform="rotate(-90)"/><text y="38" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="110" fill="#2a1a10">5</text></g>
  ${['1', '2', '3'].map((n, i) => `<g transform="translate(${470 + (i % 2) * 30} ${80 + i * 70})" filter="url(#${id}-sh)"><circle r="26" fill="#f2cf2a"/><text y="9" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="26" fill="#2a1a10">${n}</text></g>`).join('')}
`));
cover('topanswers', id => shell(id, { title: 'Top Answers', tag: 'Survey says · three strikes', bg: ['#2a4aaa', '#14245a', '#060a1e'], cy: 30 }, `
  <g transform="translate(300 152)" filter="url(#${id}-sh)"><rect x="-200" y="-100" width="400" height="200" rx="14" fill="#0e1a4a" stroke="#e8c35a" stroke-width="5"/>
  ${[0, 1, 2, 3].map(i => `<g transform="translate(${i % 2 ? 6 : -190} ${-84 + Math.floor(i / 2) * 84})"><rect width="184" height="72" rx="6" fill="${i < 2 ? '#2a5ad8' : '#1a2e6a'}" stroke="#7aa0ff"/>${i < 2 ? `<text x="12" y="46" font-family="${UI}" font-weight="800" font-size="22" fill="#fff">${['KEYS', 'PHONE'][i]}</text><text x="170" y="46" text-anchor="end" font-family="${UI}" font-weight="800" font-size="24" fill="#f2cf2a">${[45, 20][i]}</text>` : `<circle cx="92" cy="36" r="20" fill="#2a5ad8"/><text x="92" y="44" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="22" fill="#fff">${i + 1}</text>`}</g>`).join('')}</g>
  <text x="520" y="90" font-family="${UI}" font-weight="900" font-size="64" fill="#e0382c" stroke="#fff" stroke-width="3">✗</text>
`));
cover('triviawheel', id => shell(id, { title: 'Trivia Wheel', tag: 'Spin · answer · collect all six', bg: ['#4a3a7a', '#241c40', '#0a0816'], cy: 30 }, `
  <g transform="translate(300 152)" filter="url(#${id}-sh)">${['#3b82d6', '#e0559a', '#e8b923', '#9a6a3a', '#3aa856', '#ee7a2a'].map((c, i) => { const a0 = (i / 6) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / 6) * 2 * Math.PI - Math.PI / 2; return `<path d="M0 0L${(110 * Math.cos(a0)).toFixed(1)} ${(110 * Math.sin(a0)).toFixed(1)}A110 110 0 0 1 ${(110 * Math.cos(a1)).toFixed(1)} ${(110 * Math.sin(a1)).toFixed(1)}Z" fill="${c}" stroke="#fffaf0" stroke-width="4"/>`; }).join('')}<circle r="26" fill="#fffaf0"/><text y="12" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="36" fill="#2a1a40">?</text></g>
  <path d="M300 40 l-14 -22 h28z" fill="#fffaf0"/>
`));
cover('answerboard', id => shell(id, { title: 'Answer Board', tag: 'Pick a clue · answer fastest', bg: ['#1a3aa8', '#0e1e5a', '#04081e'], cy: 30 }, `
  <g transform="translate(300 152)" filter="url(#${id}-sh)"><rect x="-230" y="-110" width="460" height="220" rx="8" fill="#050a2a"/>
  ${[0, 1, 2, 3, 4].map(c => [0, 1, 2, 3].map(r => `<rect x="${-222 + c * 89}" y="${-102 + r * 53}" width="85" height="49" fill="${r === 0 ? '#1a2aa0' : '#1636c8'}"/>${r === 0 ? `<rect x="${-214 + c * 89}" y="-80" width="69" height="6" rx="3" fill="#fff" opacity=".7"/>` : (c + r) % 3 === 0 ? '' : `<text x="${-180 + c * 89}" y="${-68 + r * 53}" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="22" fill="#f2cf2a">${r * 100}</text>`}`).join('')).join('')}</g>
`));
cover('spinsolve', id => shell(id, { title: 'Spin & Solve', tag: 'Spin · call a letter · solve it', bg: ['#2a7a6a', '#144038', '#061814'], cy: 30 }, `
  <g transform="translate(150 160)" filter="url(#${id}-sh)">${Array.from({ length: 12 }, (_, i) => { const a0 = (i / 12) * 2 * Math.PI, a1 = ((i + 1) / 12) * 2 * Math.PI; return `<path d="M0 0L${(90 * Math.cos(a0)).toFixed(1)} ${(90 * Math.sin(a0)).toFixed(1)}A90 90 0 0 1 ${(90 * Math.cos(a1)).toFixed(1)} ${(90 * Math.sin(a1)).toFixed(1)}Z" fill="${['#e0382c', '#f39a1e', '#f2cf2a', '#36a852', '#2f7de1', '#8b45c8'][i % 6]}"/>`; }).join('')}<circle r="14" fill="#2a2320"/></g>
  <g transform="translate(410 150)" filter="url(#${id}-sh)">${[...'S_IN_'].map((c, i) => `<rect x="${-140 + i * 56}" y="-30" width="50" height="62" rx="4" fill="${c === '_' ? '#2a8a5a' : '#fffaf0'}" stroke="#0a3a2a" stroke-width="3"/>${c === '_' ? '' : `<text x="${-115 + i * 56}" y="16" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="38" fill="#1a1a1a">${c}</text>`}`).join('')}</g>
`));
cover('oddoneout', id => shell(id, { title: 'Odd One Out', tag: 'Everyone knows the word — but one', bg: ['#6a2a5a', '#3a142e', '#14060f'], cy: 30 }, `
  <g transform="translate(300 150) rotate(-4)" filter="url(#${id}-sh)"><rect x="-150" y="-110" width="300" height="220" rx="12" fill="#fffaf0"/>
  ${['Pizza', 'Sushi', 'Tacos', 'Soup', 'Curry', 'Steak', 'Pasta', 'Salad', 'Noodles'].map((w, i) => `<rect x="${-138 + (i % 3) * 94}" y="${-98 + Math.floor(i / 3) * 68}" width="88" height="60" rx="6" fill="${i === 4 ? '#f2cf2a' : '#efe4cc'}"/><text x="${-94 + (i % 3) * 94}" y="${-62 + Math.floor(i / 3) * 68}" text-anchor="middle" font-family="${SERIF}" font-size="19" fill="#3a2410">${w}</text>`).join('')}</g>
  <text x="510" y="250" font-size="64">🕵️</text>
`));
cover('mostlikely', id => shell(id, { title: 'Most Likely To', tag: 'Vote with the crowd', bg: ['#aa4a2a', '#5a2414', '#1e0a04'], cy: 30 }, `
  ${glow(id, 300, 120, 120, '#ffd070', .35)}
  ${[0, 1, 2, 3, 4].map(i => `<g transform="translate(${140 + i * 80} ${210 - (i === 2 ? 40 : 0)})" filter="url(#${id}-sh)"><circle r="${i === 2 ? 34 : 26}" fill="${['#e0382c', '#2f7de1', '#f2cf2a', '#36a852', '#8b45c8'][i]}"/><circle cy="${i === 2 ? -6 : -4}" r="${i === 2 ? 14 : 10}" fill="#fffaf0" opacity=".85"/></g>`).join('')}
  <text x="300" y="132" text-anchor="middle" font-size="56">👑</text>
`));
cover('twotruths', id => shell(id, { title: 'Two Truths & a Lie', tag: 'Two are true · spot the fib', bg: ['#2a5a8a', '#142e48', '#060e18'], cy: 30 }, `
  ${['I’ve met a penguin', 'I can juggle', 'I’ve been to the Moon'].map((t, i) => partyCard(id, 300, 82 + i * 70, i - 1, 360, 56, `<text x="-160" y="8" font-family="${SERIF}" font-style="italic" font-size="22" fill="#2a2a3a">${t}</text><text x="160" y="10" text-anchor="end" font-family="${UI}" font-weight="900" font-size="26" fill="${i === 2 ? '#e0382c' : '#36a852'}">${i === 2 ? '✗' : '✓'}</text>`)).join('')}
`));
cover('blurtit', id => shell(id, { title: 'Blurt It', tag: 'Ten answers · one minute · shout!', bg: ['#d8862a', '#7a4414', '#241404'], cy: 30 }, `
  ${partyCard(id, 220, 150, -6, 220, 230, `<text y="-82" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="16" fill="#7a4414">THINGS IN A FRIDGE</text>${['Milk', 'Eggs', 'Butter', 'Cheese', 'Juice'].map((w, i) => `<text x="-80" y="${-46 + i * 30}" font-family="${SERIF}" font-size="20" fill="#2a1a10">${i < 3 ? '✓' : '·'} ${w}</text>`).join('')}`)}
  <text x="440" y="190" text-anchor="middle" font-size="110">📣</text>
`));
cover('actitout', id => shell(id, { title: 'Act It Out', tag: 'No words · just moves', bg: ['#8a2a3a', '#4a141e', '#18060a'], cy: 30 }, `
  ${glow(id, 300, 120, 140, '#ff9aa8', .3)}
  <text x="300" y="200" text-anchor="middle" font-size="150">🎭</text>
  <g transform="translate(470 90) rotate(10)" filter="url(#${id}-sh)"><rect x="-56" y="-36" width="112" height="72" rx="8" fill="#fffaf0"/><text y="-8" text-anchor="middle" font-family="${UI}" font-size="12" letter-spacing="2" fill="#8a2a3a">ANIMAL</text><text y="20" text-anchor="middle" font-family="${SERIF}" font-size="22" fill="#2a1a10">Penguin</text></g>
`));
