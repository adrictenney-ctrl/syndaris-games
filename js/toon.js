// Cartoon art kit for the Vibrant style: big chunky objects with bold outlines, flat cel shading,
// glossy highlights and a cartoon drop shadow, on a bright background of printed shards.
// Every object is drawn around (0, 0) at roughly 100 units tall; P(...) places, turns and sizes it.

export const INK = '#1b1352';
const W = 5;                                   // outline width at unit scale
const FUN = "'Lilita One', 'Nunito', sans-serif";
const o = (extra = '') => `stroke="${INK}" stroke-width="${W}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
const shine = (x, y, rx, ry, r = -25, a = .55) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${a}" transform="rotate(${r} ${x} ${y})"/>`;
const txt = (x, y, size, fill, t, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${FUN}" font-size="${size}" fill="${fill}" stroke="${INK}" stroke-width="${size / 7}" stroke-linejoin="round" style="paint-order:stroke" ${extra}>${t}</text>`;
export const mix = (hex, amt) => {               // toward white (amt > 0) or black (amt < 0)
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return '#' + c.map(v => Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)).toString(16).padStart(2, '0')).join('');
};

// ---------------------------------------------------------------- suits
const SUIT = {
  heart: 'M0 13 C-19 0 -17 -15 -8 -15 C-3 -15 0 -11 0 -8 C0 -11 3 -15 8 -15 C17 -15 19 0 0 13Z',
  diamond: 'M0 -16 L12 0 L0 16 L-12 0Z',
  spade: 'M0 -16 C-6 -7 -17 -2 -15 6 C-13 12 -5 12 -2 7 L-5 16 L5 16 L2 7 C5 12 13 12 15 6 C17 -2 6 -7 0 -16Z',
  club: 'M-2 3 L-5 16 L5 16 L2 3Z M0 -15 A7 7 0 1 1 -.1 -15Z M-8 -3 A7 7 0 1 1 -8.1 -3Z M8 -3 A7 7 0 1 1 7.9 -3Z',
};
const RED = '#e8303c', BLK = '#1d1b2e';
const suit = (s, x, y, k = 1) => `<path d="${SUIT[s]}" fill="${s === 'heart' || s === 'diamond' ? RED : BLK}" transform="translate(${x} ${y}) scale(${k})"/>`;

// ---------------------------------------------------------------- the kit
export const K = {
  // a playing card: rank + suit
  card: ({ rank = 'A', suit: s = 'spade' } = {}) => {
    const red = s === 'heart' || s === 'diamond', col = red ? RED : BLK;
    return `<rect x="-36" y="-50" width="72" height="100" rx="10" fill="#fff"/>
      <path d="M-36 30 H36 V40 A10 10 0 0 1 26 50 H-26 A10 10 0 0 1 -36 40Z" fill="#e6e1f7"/>
      <rect x="-36" y="-50" width="72" height="100" rx="10" fill="none" ${o()}/>
      <text x="-24" y="-26" text-anchor="middle" font-family="${FUN}" font-size="20" fill="${col}">${rank}</text>
      ${suit(s, -24, -12, .5)}${suit(s, 0, 10, 1.45)}
      <g transform="rotate(180)"><text x="-24" y="-26" text-anchor="middle" font-family="${FUN}" font-size="20" fill="${col}">${rank}</text></g>`;
  },
  // a coloured number card (big outlined number, white inner frame)
  ccard: ({ color = '#3f86f2', n = '7' } = {}) => `<rect x="-36" y="-50" width="72" height="100" rx="10" fill="${color}"/>
      <path d="M-36 24 H36 V40 A10 10 0 0 1 26 50 H-26 A10 10 0 0 1 -36 40Z" fill="${mix(color, -.18)}"/>
      <rect x="-28" y="-42" width="56" height="84" rx="7" fill="none" stroke="#fff" stroke-width="3.5" opacity=".9"/>
      ${txt(0, 18, 52, '#fff', n)}
      <text x="-19" y="-24" text-anchor="middle" font-family="${FUN}" font-size="15" fill="#fff">${n}</text>
      ${shine(-16, -34, 12, 5)}
      <rect x="-36" y="-50" width="72" height="100" rx="10" fill="none" ${o()}/>`,
  // the back of a card
  back: ({ color = '#8a55ef' } = {}) => `<rect x="-36" y="-50" width="72" height="100" rx="10" fill="${color}"/>
      <rect x="-27" y="-41" width="54" height="82" rx="6" fill="${mix(color, -.2)}" stroke="#fff" stroke-width="3.5"/>
      <path d="M0 -26 L16 0 L0 26 L-16 0Z" fill="#ffd84a" stroke="#fff" stroke-width="3"/>
      ${shine(-18, -36, 10, 4)}
      <rect x="-36" y="-50" width="72" height="100" rx="10" fill="none" ${o()}/>`,
  // a stack of casino chips seen from the side
  chips: ({ color = '#e8303c', n = 4 } = {}) => {
    let h = '';
    for (let i = 0; i < n; i++) {
      const y = 22 - i * 13;
      h += `<path d="M-34 ${y} V${y + 11} A34 13 0 0 0 34 ${y + 11} V${y}" fill="${mix(color, -.25)}" ${o()}/>`;
      for (const x of [-22, 0, 22]) h += `<rect x="${x - 4}" y="${y + (x ? 6 : 10)}" width="8" height="8" fill="#fff"/>`;
      h += `<ellipse cx="0" cy="${y}" rx="34" ry="13" fill="${color}" ${o()}/>`;
    }
    const t = 22 - (n - 1) * 13;
    return h + `<ellipse cx="0" cy="${t}" rx="22" ry="8" fill="none" stroke="#fff" stroke-width="3.5" stroke-dasharray="7 6"/>${shine(-12, t - 4, 9, 3, -8, .5)}`;
  },
  // a die, three faces showing
  die: ({ v = 5, color = '#ffffff', pip = INK } = {}) => {
    const P = { 1: [[.5, .5]], 2: [[.25, .25], [.75, .75]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.25, .25], [.75, .25], [.25, .75], [.75, .75]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.25, .22], [.75, .22], [.25, .5], [.75, .5], [.25, .78], [.75, .78]] };
    const pips = P[v].map(([a, b]) => `<circle cx="${-36 + a * 56}" cy="${-16 + b * 56}" r="6" fill="${pip}"/>`).join('');
    return `<path d="M-36 -16 L-16 -36 L40 -36 L20 -16Z" fill="${mix(color, -.06)}" ${o()}/>
      <path d="M20 -16 L40 -36 L40 20 L20 40Z" fill="${mix(color, -.2)}" ${o()}/>
      <rect x="-36" y="-16" width="56" height="56" rx="8" fill="${color}" ${o()}/>${pips}
      <circle cx="12" cy="-26" r="5" fill="${pip}" transform="skewX(-30)" opacity=".9"/>
      <circle cx="30" cy="6" r="4.5" fill="${pip}" opacity=".8"/>
      ${shine(-24, -6, 9, 4)}`;
  },
  cup: ({ color = '#a0522d' } = {}) => `<path d="M-34 -40 L34 -40 L26 44 L-26 44Z" fill="${color}" ${o()}/>
      <path d="M-30 -10 L30 -10 M-28 16 L28 16" stroke="${mix(color, -.3)}" stroke-width="6"/>
      <ellipse cx="0" cy="-40" rx="34" ry="10" fill="${mix(color, -.35)}" ${o()}/>${shine(-18, 0, 5, 22, 5, .35)}`,
  coin: ({ color = '#ffc93a', mark = '$' } = {}) => `<ellipse cx="0" cy="6" rx="34" ry="34" fill="${mix(color, -.25)}" ${o()}/>
      <circle cx="0" cy="0" r="34" fill="${color}" ${o()}/><circle r="25" fill="none" stroke="${mix(color, -.2)}" stroke-width="4"/>
      ${txt(0, 12, 34, '#fff', mark)}${shine(-14, -16, 10, 5)}`,
  bills: () => `<g transform="rotate(-8)"><rect x="-46" y="-24" width="92" height="48" rx="6" fill="#4cc27a" ${o()}/><rect x="-38" y="-16" width="76" height="32" rx="4" fill="none" stroke="#e9ffe9" stroke-width="3"/><circle r="11" fill="#e9ffe9"/>${txt(0, 6, 16, '#2a8a52', '$')}</g>
      <g transform="translate(6 -14) rotate(4)"><rect x="-46" y="-24" width="92" height="48" rx="6" fill="#5fd38c" ${o()}/><rect x="-38" y="-16" width="76" height="32" rx="4" fill="none" stroke="#e9ffe9" stroke-width="3"/><circle r="11" fill="#e9ffe9"/>${txt(0, 6, 16, '#2a8a52', '$')}${shine(-26, -14, 12, 4, -5, .4)}</g>`,
  moneybag: () => `<path d="M-14 -38 L14 -38 L8 -24 C40 -14 46 40 0 44 C-46 40 -40 -14 -8 -24Z" fill="#c9a060" ${o()}/>
      <path d="M-14 -24 H14" ${o()}/>${txt(0, 22, 40, '#ffd84a', '$')}${shine(-18, -2, 8, 16, 15, .35)}`,
  tophat: () => `<ellipse cx="0" cy="34" rx="50" ry="14" fill="#2a2440" ${o()}/>
      <path d="M-32 34 L-30 -40 Q0 -48 30 -40 L32 34Z" fill="#2f2950" ${o()}/>
      <path d="M-31 12 L31 12 L31 24 L-31 24Z" fill="#e8303c" ${o()}/>${shine(-18, -14, 6, 20, 0, .3)}`,
  crown: ({ color = '#ffc93a' } = {}) => `<path d="M-42 30 L-46 -22 L-22 4 L0 -36 L22 4 L46 -22 L42 30Z" fill="${color}" ${o()}/>
      <rect x="-42" y="22" width="84" height="16" rx="4" fill="${mix(color, -.2)}" ${o()}/>
      <circle cx="0" cy="-2" r="7" fill="#e8303c" ${o('stroke-width="3"')}/><circle cx="-24" cy="12" r="5" fill="#3f86f2" ${o('stroke-width="3"')}/><circle cx="24" cy="12" r="5" fill="#22b97a" ${o('stroke-width="3"')}/>
      ${shine(-28, -2, 5, 12, 20, .45)}`,
  trophy: () => `<path d="M-30 -40 H30 V-10 C30 14 14 24 0 24 C-14 24 -30 14 -30 -10Z" fill="#ffc93a" ${o()}/>
      <path d="M-30 -30 C-50 -30 -50 0 -26 2 M30 -30 C50 -30 50 0 26 2" fill="none" ${o()}/>
      <rect x="-8" y="22" width="16" height="12" fill="#e0a520" ${o()}/><rect x="-26" y="32" width="52" height="14" rx="4" fill="#8a55ef" ${o()}/>
      ${txt(0, -4, 26, '#fff', '1')}${shine(-16, -26, 6, 12, 10, .45)}`,
  star: ({ color = '#ffd84a' } = {}) => `<path d="M0 -44 L13 -14 L45 -12 L20 9 L28 41 L0 24 L-28 41 L-20 9 L-45 -12 L-13 -14Z" fill="${color}" ${o()}/>${shine(-8, -14, 6, 10, 20, .5)}`,
  heart: ({ color = '#f0509c' } = {}) => `<path d="M0 40 C-60 0 -52 -44 -24 -44 C-10 -44 0 -32 0 -22 C0 -32 10 -44 24 -44 C52 -44 60 0 0 40Z" fill="${color}" ${o()}/>${shine(-24, -24, 10, 7, -30, .55)}`,
  gem: ({ color = '#4ad6ff' } = {}) => `<path d="M-40 -14 L-22 -36 L22 -36 L40 -14 L0 40Z" fill="${color}" ${o()}/>
      <path d="M-40 -14 H40 M-22 -36 L-10 -14 L0 40 L10 -14 L22 -36" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-22 -36 L-10 -14 L-40 -14Z" fill="#fff" opacity=".45"/>`,
  // chess pieces (gold or dark)
  king: ({ color = '#ffc93a' } = {}) => `<path d="M-4 -50 H4 V-44 H10 V-36 H4 V-30 H-4 V-36 H-10 V-44 H-4Z" fill="${color}" ${o('stroke-width="4"')}/>
      <path d="M-18 -30 C-26 -18 -20 -8 -14 -4 L-20 28 H20 L14 -4 C20 -8 26 -18 18 -30Z" fill="${color}" ${o()}/>
      <rect x="-30" y="26" width="60" height="16" rx="5" fill="${mix(color, -.2)}" ${o()}/>${shine(-8, -14, 4, 12, 0, .45)}`,
  knight: ({ color = '#2f2950' } = {}) => `<path d="M-22 30 C-22 10 -8 4 -12 -8 C-24 -2 -32 -8 -30 -16 C-26 -30 -10 -48 10 -44 C30 -40 34 -12 26 30Z" fill="${color}" ${o()}/>
      <circle cx="-2" cy="-28" r="4" fill="#fff"/><rect x="-32" y="26" width="64" height="16" rx="5" fill="${mix(color, .15)}" ${o()}/>${shine(10, -24, 4, 12, 15, .3)}`,
  pawnC: ({ color = '#2f2950' } = {}) => `<circle cx="0" cy="-22" r="16" fill="${color}" ${o()}/><path d="M-12 -8 L-22 28 H22 L12 -8Z" fill="${color}" ${o()}/>
      <rect x="-30" y="26" width="60" height="14" rx="5" fill="${mix(color, .15)}" ${o()}/>${shine(-6, -28, 5, 4, -20, .45)}`,
  // a board-game pawn
  pawn: ({ color = '#e8303c' } = {}) => `<ellipse cx="0" cy="34" rx="28" ry="10" fill="${mix(color, -.3)}" ${o()}/>
      <path d="M-26 34 C-24 10 -12 0 -12 -10 A18 18 0 1 1 12 -10 C12 0 24 10 26 34Z" fill="${color}" ${o()}/>${shine(-8, -26, 6, 8, -20, .55)}`,
  // a checker, thick, from slightly above
  checker: ({ color = '#e8303c' } = {}) => `<path d="M-42 0 V14 A42 18 0 0 0 42 14 V0" fill="${mix(color, -.3)}" ${o()}/>
      <ellipse cx="0" cy="0" rx="42" ry="18" fill="${color}" ${o()}/><ellipse cx="0" cy="0" rx="28" ry="11" fill="none" stroke="${mix(color, -.25)}" stroke-width="4"/>
      ${shine(-18, -6, 10, 3, -5, .5)}`,
  stone: ({ color = '#fff' } = {}) => `<ellipse cx="0" cy="4" rx="30" ry="22" fill="${mix(color, -.25)}" ${o()}/><ellipse cx="0" cy="0" rx="30" ry="20" fill="${color}" ${o()}/>${shine(-10, -6, 9, 4, -10, color === '#fff' ? .9 : .4)}`,
  marble: ({ color = '#3f86f2' } = {}) => `<circle r="22" fill="${color}" ${o()}/><path d="M-12 8 C0 0 6 14 16 4" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>${shine(-8, -9, 7, 4, -30, .8)}`,
  // a square game board, tilted back a little
  board: ({ a = '#ffd9a0', b = '#c9783a', n = 6, frame = '#7a3e1e' } = {}) => {
    let sq = '';
    const s = 90 / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) sq += `<rect x="${-45 + c * s}" y="${-45 + r * s}" width="${s}" height="${s}" fill="${(r + c) % 2 ? b : a}"/>`;
    return `<g transform="scale(1 .62)"><rect x="-52" y="-44" width="104" height="104" rx="8" fill="${mix(frame, -.3)}" ${o()}/><rect x="-52" y="-52" width="104" height="104" rx="8" fill="${frame}" ${o()}/>${sq}<rect x="-45" y="-45" width="90" height="90" fill="none" stroke="${INK}" stroke-width="3"/></g>`;
  },
  // an upright drop-four grid
  grid: ({ color = '#3f86f2' } = {}) => {
    let h = `<rect x="-52" y="-46" width="104" height="92" rx="10" fill="${color}" ${o()}/><rect x="-60" y="40" width="20" height="12" rx="3" fill="${mix(color, -.3)}" ${o()}/><rect x="40" y="40" width="20" height="12" rx="3" fill="${mix(color, -.3)}" ${o()}/>`;
    const fill = ['', '#e8303c', '#ffc93a'];
    const B = [[0, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 2, 1, 0, 0], [2, 1, 2, 1, 0], [1, 2, 2, 1, 2]];
    B.forEach((row, r) => row.forEach((v, c) => { h += `<circle cx="${-40 + c * 20}" cy="${-34 + r * 17}" r="7.5" fill="${v ? fill[v] : mix(color, -.45)}" stroke="${INK}" stroke-width="2.5"/>`; }));
    return h + shine(-36, -40, 14, 3, 0, .45);
  },
  disc: ({ color = '#e8303c' } = {}) => `<circle r="30" fill="${color}" ${o()}/><circle r="20" fill="none" stroke="${mix(color, -.2)}" stroke-width="4"/>${shine(-12, -12, 8, 4, -40, .6)}`,
  fish: ({ color = '#3f86f2' } = {}) => `<path d="M36 0 L62 -26 L58 0 L62 26Z" fill="${mix(color, -.15)}" ${o()}/>
      <path d="M-50 0 C-40 -38 24 -40 40 0 C24 40 -40 38 -50 0Z" fill="${color}" ${o()}/>
      <path d="M-6 -30 C0 -46 18 -44 22 -28" fill="${mix(color, -.15)}" ${o()}/>
      <path d="M-36 14 C-16 28 14 28 34 10" fill="none" stroke="${mix(color, -.2)}" stroke-width="5"/>
      <circle cx="-26" cy="-8" r="10" fill="#fff" ${o('stroke-width="3"')}/><circle cx="-28" cy="-8" r="5" fill="${INK}"/><circle cx="-30" cy="-10" r="1.8" fill="#fff"/>
      <path d="M-44 8 Q-40 12 -36 9" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>${shine(-10, -22, 14, 5, -10, .45)}`,
  paper: ({ color = '#ffffff', lines = 5 } = {}) => `<path d="M-38 -48 H26 L38 -36 V48 H-38Z" fill="${color}" ${o()}/><path d="M26 -48 V-36 H38" fill="${mix(color, -.12)}" ${o('stroke-width="3"')}/>
      ${Array.from({ length: lines }, (_, i) => `<path d="M-26 ${-28 + i * 14} H${i % 2 ? 18 : 26}" stroke="#9a94c8" stroke-width="4" stroke-linecap="round"/>`).join('')}`,
  pencil: ({ color = '#ffc93a' } = {}) => `<g transform="rotate(-35)"><rect x="-10" y="-50" width="20" height="74" fill="${color}" ${o()}/><rect x="-10" y="-60" width="20" height="12" rx="3" fill="#f0509c" ${o()}/>
      <path d="M-10 24 L0 48 L10 24Z" fill="#ffe2b0" ${o()}/><path d="M-4 38 L0 48 L4 38Z" fill="${INK}"/><path d="M-2 -46 V20" stroke="#fff" stroke-width="3" opacity=".6"/></g>`,
  bubble: ({ color = '#ffffff', t = '?' } = {}) => `<path d="M-44 -34 Q-44 -46 -32 -46 H32 Q44 -46 44 -34 V8 Q44 20 32 20 H-6 L-26 40 L-20 20 H-32 Q-44 20 -44 8Z" fill="${color}" ${o()}/>${txt(0, 0, 38, color === '#ffffff' ? '#8a55ef' : '#fff', t)}`,
  qmark: ({ color = '#ffd84a' } = {}) => txt(0, 34, 110, color, '?'),
  bulb: () => `<path d="M-28 -6 A30 30 0 1 1 28 -6 C28 10 14 16 14 28 H-14 C-14 16 -28 10 -28 -6Z" fill="#ffe066" ${o()}/>
      <rect x="-14" y="28" width="28" height="16" rx="4" fill="#b8b3d8" ${o()}/><path d="M-8 20 V8 L0 14 L8 8 V20" fill="none" stroke="#e0a520" stroke-width="3"/>${shine(-12, -20, 7, 12, 25, .7)}`,
  clock: ({ color = '#ffffff' } = {}) => `<circle r="42" fill="#e8303c" ${o()}/><circle r="32" fill="${color}" ${o('stroke-width="3"')}/>
      <path d="M0 0 V-22 M0 0 L14 8" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><rect x="-8" y="-56" width="16" height="10" rx="3" fill="#e8303c" ${o('stroke-width="3.5"')}/>${shine(-16, -18, 7, 4, -30, .5)}`,
  hourglass: () => `<rect x="-30" y="-46" width="60" height="10" rx="4" fill="#c9783a" ${o()}/><rect x="-30" y="36" width="60" height="10" rx="4" fill="#c9783a" ${o()}/>
      <path d="M-22 -36 H22 C22 -10 4 -6 4 0 C4 6 22 10 22 36 H-22 C-22 10 -4 6 -4 0 C-4 -6 -22 -10 -22 -36Z" fill="#dff4ff" ${o()}/>
      <path d="M-14 -24 H14 C10 -12 2 -8 0 -2 C-2 -8 -10 -12 -14 -24Z M-14 30 H14 C10 18 4 16 0 14 C-4 16 -10 18 -14 30Z" fill="#ffc93a"/>`,
  magnifier: () => `<path d="M18 18 L46 46" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="M18 18 L46 46" stroke="#c9783a" stroke-width="9" stroke-linecap="round"/>
      <circle r="30" fill="#bfe8ff" ${o('stroke-width="7"')}/><circle r="30" fill="none" stroke="#ffc93a" stroke-width="3"/>${shine(-10, -10, 10, 6, -40, .8)}`,
  phone: ({ color = '#8a55ef', screen = '#4ad6ff' } = {}) => `<rect x="-28" y="-50" width="56" height="100" rx="12" fill="${color}" ${o()}/>
      <rect x="-21" y="-38" width="42" height="72" rx="4" fill="${screen}" ${o('stroke-width="3"')}/><circle cx="0" cy="42" r="3.5" fill="#fff"/>${shine(-8, -26, 6, 14, 20, .5)}`,
  mic: () => `<path d="M-6 30 V48 M-22 48 H10" stroke="${INK}" stroke-width="7" stroke-linecap="round" transform="translate(6 0)"/>
      <rect x="-18" y="-46" width="36" height="58" rx="18" fill="#b8b3d8" ${o()}/><path d="M-18 -20 H18 M-18 -8 H18" stroke="#8a84b8" stroke-width="3"/>
      <path d="M-28 0 C-28 34 28 34 28 0" fill="none" ${o()}/>${shine(-6, -30, 4, 10, 0, .7)}`,
  mask: ({ color = '#8a55ef' } = {}) => `<path d="M-50 -14 C-30 -24 -10 -18 0 -10 C10 -18 30 -24 50 -14 C52 10 36 22 18 18 C10 16 6 10 0 10 C-6 10 -10 16 -18 18 C-36 22 -52 10 -50 -14Z" fill="${color}" ${o()}/>
      <ellipse cx="-22" cy="-2" rx="11" ry="7" fill="${INK}"/><ellipse cx="22" cy="-2" rx="11" ry="7" fill="${INK}"/>${shine(-34, -14, 8, 3, -10, .5)}`,
  envelope: ({ color = '#ffffff' } = {}) => `<rect x="-46" y="-30" width="92" height="62" rx="6" fill="${color}" ${o()}/><path d="M-46 -28 L0 8 L46 -28" fill="none" ${o()}/>
      <circle cx="0" cy="8" r="10" fill="#e8303c" ${o('stroke-width="3"')}/>`,
  key: ({ color = '#ffc93a' } = {}) => `<g transform="rotate(-30)"><circle cx="-26" cy="0" r="20" fill="${color}" ${o()}/><circle cx="-26" cy="0" r="8" fill="#fff" ${o('stroke-width="3"')}/>
      <path d="M-6 -6 H44 V6 H36 V16 H28 V6 H20 V14 H12 V6 H-6Z" fill="${color}" ${o()}/></g>`,
  map: () => `<path d="M-50 -34 L-18 -44 L18 -34 L50 -44 V34 L18 44 L-18 34 L-50 44Z" fill="#ffe2a0" ${o()}/>
      <path d="M-18 -44 V34 M18 -34 V44" stroke="${INK}" stroke-width="3" opacity=".4"/><path d="M-36 20 C-20 0 0 20 10 -4" fill="none" stroke="#e8303c" stroke-width="4" stroke-dasharray="6 6"/>
      <path d="M22 -16 l12 12 m0 -12 l-12 12" stroke="#e8303c" stroke-width="6" stroke-linecap="round"/>`,
  rocket: () => `<path d="M0 -54 C24 -30 24 10 16 30 H-16 C-24 10 -24 -30 0 -54Z" fill="#f2f0ff" ${o()}/>
      <path d="M-16 6 L-34 30 L-16 30Z M16 6 L34 30 L16 30Z" fill="#e8303c" ${o()}/><circle cy="-14" r="10" fill="#4ad6ff" ${o('stroke-width="4"')}/>
      <path d="M-10 32 Q0 64 10 32Z" fill="#ffb02a" ${o('stroke-width="3"')}/><path d="M0 -54 C10 -44 14 -36 16 -28 H-16 C-14 -36 -10 -44 0 -54Z" fill="#e8303c" ${o()}/>${shine(-8, -2, 4, 14, 0, .6)}`,
  planet: ({ color = '#ff9d3c' } = {}) => `<circle r="34" fill="${color}" ${o()}/><path d="M-26 -10 C-10 -4 10 -14 30 -6" fill="none" stroke="${mix(color, -.2)}" stroke-width="5"/>
      <ellipse rx="58" ry="14" fill="none" stroke="${INK}" stroke-width="9" transform="rotate(-15)"/><ellipse rx="58" ry="14" fill="none" stroke="#ffd84a" stroke-width="4" transform="rotate(-15)"/>${shine(-14, -16, 8, 5, -30, .55)}`,
  car: ({ color = '#e8303c' } = {}) => `<path d="M-56 14 V-2 Q-54 -12 -40 -14 L-24 -32 H18 L36 -14 Q54 -12 56 0 V14Z" fill="${color}" ${o()}/>
      <path d="M-18 -26 H14 L26 -14 H-30Z" fill="#bfe8ff" ${o('stroke-width="3.5"')}/>
      <circle cx="-32" cy="16" r="13" fill="${INK}"/><circle cx="-32" cy="16" r="5" fill="#ccc"/><circle cx="32" cy="16" r="13" fill="${INK}"/><circle cx="32" cy="16" r="5" fill="#ccc"/>
      ${txt(2, 8, 18, '#fff', '7')}${shine(-38, -6, 10, 3, 0, .5)}`,
  horse: ({ color = '#c9783a' } = {}) => `<path d="M-30 40 C-34 10 -24 -6 -20 -18 C-28 -20 -36 -26 -32 -36 C-24 -48 -4 -54 10 -46 L18 -56 L20 -42 C30 -32 32 -8 26 6 C34 18 34 30 30 40Z" fill="${color}" ${o()}/>
      <path d="M10 -46 C-4 -40 -8 -26 -2 -12 C2 -24 8 -30 18 -34" fill="${mix(color, -.35)}" ${o('stroke-width="3"')}/><circle cx="-14" cy="-30" r="4.5" fill="${INK}"/><circle cx="-26" cy="-36" r="2" fill="${INK}"/>${shine(4, -10, 5, 12, 10, .3)}`,
  flag: ({ color = '#e8303c' } = {}) => `<path d="M-30 50 V-48" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M-30 50 V-48" stroke="#c9c4e8" stroke-width="4" stroke-linecap="round"/>
      <path d="M-28 -46 C-10 -54 10 -36 40 -44 V-2 C10 6 -10 -12 -28 -4Z" fill="${color}" ${o()}/><circle cx="-30" cy="-50" r="7" fill="#ffd84a" ${o('stroke-width="3"')}/>`,
  checkflag: () => `<path d="M-30 50 V-48" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M-28 -46 C-10 -54 10 -36 40 -44 V-2 C10 6 -10 -12 -28 -4Z" fill="#fff" ${o()}/>
      <path d="M-28 -46 L-14 -48 L-14 -34 L-28 -32Z M0 -42 L14 -42 L14 -26 L0 -28Z M-14 -34 L0 -34 L0 -18 L-14 -18Z M14 -26 L28 -28 L28 -12 L14 -12Z M-28 -18 L-14 -18 L-14 -5 L-28 -4Z M0 -18 L14 -16 L14 -2 L0 -4Z" fill="${INK}"/>`,
  globe: () => `<circle r="40" fill="#3f86f2" ${o()}/><path d="M-24 -26 C-10 -30 -4 -18 -14 -10 C-22 -4 -10 6 -18 16 C-26 10 -36 -8 -24 -26Z M8 -36 C22 -32 34 -18 30 -4 C22 -8 12 0 8 -10 C4 -18 14 -24 8 -36Z M6 14 C16 10 26 16 20 30 C12 36 4 28 6 14Z" fill="#22b97a" ${o('stroke-width="3"')}/>${shine(-16, -20, 10, 6, -30, .45)}`,
  book: ({ color = '#e8303c' } = {}) => `<path d="M-46 -34 Q-24 -42 0 -32 Q24 -42 46 -34 V36 Q24 28 0 38 Q-24 28 -46 36Z" fill="#fff" ${o()}/><path d="M0 -32 V38" ${o()}/>
      <path d="M-50 -30 V42 Q-24 32 0 44 Q24 32 50 42 V-30" fill="none" stroke="${color}" stroke-width="8" stroke-linejoin="round"/>
      ${[0, 1, 2].map(i => `<path d="M-36 ${-18 + i * 14} H-10 M10 ${-18 + i * 14} H36" stroke="#b8b3d8" stroke-width="4" stroke-linecap="round"/>`).join('')}`,
  tile: ({ l = 'A', n = 1, color = '#ffe2a0' } = {}) => `<rect x="-30" y="-26" width="60" height="60" rx="9" fill="${mix(color, -.25)}" ${o()}/><rect x="-30" y="-32" width="60" height="60" rx="9" fill="${color}" ${o()}/>
      ${txt(0, 12, 38, '#fff', l)}<text x="18" y="20" text-anchor="middle" font-family="${FUN}" font-size="12" fill="${INK}">${n}</text>${shine(-16, -22, 9, 4, -10, .6)}`,
  wheel: ({ cols = ['#e8303c', '#ffc93a', '#22b97a', '#3f86f2', '#8a55ef', '#ff8f2e'] } = {}) => {
    const n = cols.length * 2; let h = '';
    for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, R = 46; h += `<path d="M0 0 L${(R * Math.cos(a0)).toFixed(1)} ${(R * Math.sin(a0)).toFixed(1)} A${R} ${R} 0 0 1 ${(R * Math.cos(a1)).toFixed(1)} ${(R * Math.sin(a1)).toFixed(1)}Z" fill="${cols[i % cols.length]}" stroke="${INK}" stroke-width="2.5"/>`; }
    return `<circle r="50" fill="#ffd84a" ${o()}/>${h}<circle r="46" fill="none" ${o()}/><circle r="10" fill="#fff" ${o('stroke-width="4"')}/><path d="M-8 -60 L8 -60 L0 -42Z" fill="#fff" ${o('stroke-width="4"')}/>`;
  },
  target: () => `<circle r="46" fill="#fff" ${o()}/><circle r="36" fill="#e8303c"/><circle r="26" fill="#fff"/><circle r="16" fill="#e8303c"/><circle r="7" fill="#ffd84a"/><circle r="46" fill="none" ${o()}/>
      <path d="M4 -4 L40 -40" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M34 -46 L46 -34 L52 -52Z" fill="#22b97a" ${o('stroke-width="3"')}/>`,
  balloon: ({ color = '#f0509c' } = {}) => `<path d="M0 30 C-40 20 -40 -46 0 -46 C40 -46 40 20 0 30Z" fill="${color}" ${o()}/><path d="M-6 36 L0 30 L6 36Z" fill="${color}" ${o('stroke-width="3"')}/>
      <path d="M0 36 C-8 46 8 52 0 62" fill="none" stroke="${INK}" stroke-width="3"/>${shine(-14, -24, 7, 12, 20, .6)}`,
  gift: ({ color = '#22b97a', ribbon = '#ffd84a' } = {}) => `<rect x="-40" y="-14" width="80" height="58" rx="5" fill="${color}" ${o()}/><rect x="-46" y="-28" width="92" height="20" rx="5" fill="${mix(color, .15)}" ${o()}/>
      <rect x="-8" y="-28" width="16" height="72" fill="${ribbon}" ${o('stroke-width="3.5"')}/><path d="M0 -28 C-20 -54 -40 -36 -18 -28 M0 -28 C20 -54 40 -36 18 -28" fill="${ribbon}" ${o('stroke-width="4"')}/>`,
  bomb: () => `<circle cx="0" cy="8" r="38" fill="#2f2950" ${o()}/><rect x="-12" y="-38" width="24" height="14" rx="3" fill="#6a648a" ${o()}/>
      <path d="M0 -38 C4 -50 16 -52 22 -46" fill="none" stroke="#c9783a" stroke-width="5"/><path d="M22 -46 l6 -12 4 10 10 -4 -6 10 10 4 -12 2Z" fill="#ffd84a" ${o('stroke-width="2.5"')}/>${shine(-14, -6, 10, 6, -30, .45)}`,
  scroll: () => `<rect x="-36" y="-40" width="72" height="80" fill="#ffe8b8" ${o()}/><rect x="-44" y="-50" width="88" height="16" rx="8" fill="#e8c27a" ${o()}/><rect x="-44" y="34" width="88" height="16" rx="8" fill="#e8c27a" ${o()}/>
      ${[0, 1, 2, 3].map(i => `<path d="M-24 ${-22 + i * 13} H${i % 2 ? 14 : 24}" stroke="#b8925a" stroke-width="4" stroke-linecap="round"/>`).join('')}`,
  house: ({ color = '#ff8f2e' } = {}) => `<rect x="-36" y="-10" width="72" height="54" fill="${color}" ${o()}/><path d="M-48 -6 L0 -48 L48 -6Z" fill="#e8303c" ${o()}/>
      <rect x="-10" y="16" width="20" height="28" fill="#7a3e1e" ${o('stroke-width="3.5"')}/><rect x="-28" y="2" width="14" height="14" fill="#bfe8ff" ${o('stroke-width="3"')}/><rect x="14" y="2" width="14" height="14" fill="#bfe8ff" ${o('stroke-width="3"')}/>`,
  tower: ({ color = '#3f86f2' } = {}) => `<rect x="-24" y="-50" width="48" height="96" fill="${color}" ${o()}/>${[0, 1, 2, 3, 4].map(r => [0, 1].map(c => `<rect x="${-14 + c * 18}" y="${-40 + r * 18}" width="10" height="10" fill="#ffe066" stroke="${INK}" stroke-width="2.5"/>`).join('')).join('')}<rect x="-30" y="-56" width="60" height="10" fill="${mix(color, -.25)}" ${o()}/>`,
  tree: ({ color = '#22b97a' } = {}) => `<rect x="-8" y="10" width="16" height="36" fill="#a0522d" ${o()}/><circle cx="0" cy="-16" r="34" fill="${color}" ${o()}/><circle cx="-14" cy="-22" r="6" fill="#e8303c" ${o('stroke-width="2.5"')}/><circle cx="14" cy="-8" r="6" fill="#e8303c" ${o('stroke-width="2.5"')}/>${shine(-12, -34, 9, 5, -30, .4)}`,
  apple: ({ color = '#e8303c' } = {}) => `<path d="M0 -26 C-20 -40 -46 -26 -40 4 C-34 34 -14 40 0 32 C14 40 34 34 40 4 C46 -26 20 -40 0 -26Z" fill="${color}" ${o()}/><path d="M0 -26 C0 -34 4 -42 8 -46" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M6 -38 C18 -50 30 -40 26 -32 C18 -28 8 -30 6 -38Z" fill="#22b97a" ${o('stroke-width="3.5"')}/>${shine(-20, -12, 7, 12, 20, .55)}`,
  lemon: () => `<path d="M-44 0 C-44 -30 -12 -40 12 -34 C34 -30 48 -14 46 6 C44 30 10 40 -14 34 C-36 28 -44 18 -44 0Z" fill="#ffe066" ${o()}/><path d="M46 4 L54 0 L48 -6" fill="#ffe066" ${o('stroke-width="3.5"')}/>${shine(-14, -18, 14, 6, -15, .6)}`,
  glass: ({ color = '#ffe066' } = {}) => `<path d="M-30 -44 H30 L22 44 H-22Z" fill="#dff4ff" ${o()}/><path d="M-26 -14 H26 L22 40 H-22Z" fill="${color}" opacity=".9"/><path d="M-30 -44 H30 L22 44 H-22Z" fill="none" ${o()}/>
      <path d="M10 -60 L4 -14" stroke="#e8303c" stroke-width="7" stroke-linecap="round"/>${shine(-16, -24, 4, 16, 5, .7)}`,
  spoon: () => `<g transform="rotate(30)"><rect x="-6" y="-6" width="12" height="62" rx="6" fill="#d8d4ee" ${o()}/><ellipse cx="0" cy="-26" rx="20" ry="28" fill="#e8e5f8" ${o()}/>${shine(-6, -34, 5, 10, 0, .8)}</g>`,
  gear: ({ color = '#8a84b8' } = {}) => { let t = ''; for (let i = 0; i < 8; i++) t += `<rect x="-9" y="-50" width="18" height="18" rx="3" fill="${color}" ${o('stroke-width="4"')} transform="rotate(${i * 45})"/>`; return t + `<circle r="38" fill="${color}" ${o()}/><circle r="14" fill="${mix(color, -.3)}" ${o('stroke-width="4"')}/>${shine(-16, -18, 9, 5, -30, .4)}`; },
  robot: ({ color = '#4ad6ff' } = {}) => `<path d="M0 -50 V-38" stroke="${INK}" stroke-width="5"/><circle cy="-52" r="6" fill="#e8303c" ${o('stroke-width="3.5"')}/>
      <rect x="-36" y="-38" width="72" height="54" rx="12" fill="${color}" ${o()}/><circle cx="-14" cy="-14" r="10" fill="#fff" ${o('stroke-width="3.5"')}/><circle cx="14" cy="-14" r="10" fill="#fff" ${o('stroke-width="3.5"')}/>
      <circle cx="-14" cy="-14" r="4" fill="${INK}"/><circle cx="14" cy="-14" r="4" fill="${INK}"/><rect x="-14" y="2" width="28" height="7" rx="3" fill="${INK}"/><rect x="-24" y="20" width="48" height="28" rx="6" fill="${mix(color, -.2)}" ${o()}/>`,
  unicorn: () => `<path d="M-30 46 C-34 14 -24 -4 -18 -14 C-26 -18 -34 -24 -30 -34 C-22 -46 -2 -50 10 -42 C26 -32 30 -8 24 8 C30 20 30 34 28 46Z" fill="#fff" ${o()}/>
      <path d="M-4 -46 L8 -78 L12 -44Z" fill="#ffd84a" ${o('stroke-width="4"')}/><path d="M10 -42 C24 -34 30 -20 28 -4 C34 -16 40 -30 30 -44 C26 -48 16 -48 10 -42Z" fill="#f0509c" ${o('stroke-width="4"')}/>
      <path d="M24 -24 C34 -14 36 2 30 14 C40 4 42 -12 36 -24Z" fill="#8a55ef" ${o('stroke-width="4"')}/><circle cx="-12" cy="-30" r="4.5" fill="${INK}"/><ellipse cx="-24" cy="-24" rx="6" ry="4" fill="#ffb8d0"/>`,
  dragonish: () => '',
  ghost: () => `<path d="M-34 44 V-10 A34 34 0 0 1 34 -10 V44 L22 34 L10 44 L-2 34 L-14 44 L-24 34Z" fill="#f2f0ff" ${o()}/><ellipse cx="-12" cy="-8" rx="6" ry="9" fill="${INK}"/><ellipse cx="12" cy="-8" rx="6" ry="9" fill="${INK}"/><ellipse cx="0" cy="12" rx="6" ry="8" fill="${INK}"/>${shine(-16, -28, 8, 5, -30, .6)}`,
  moon: () => `<path d="M10 -44 A44 44 0 1 0 40 22 A36 36 0 1 1 10 -44Z" fill="#ffe066" ${o()}/><circle cx="-14" cy="10" r="6" fill="#f0d040"/><circle cx="-2" cy="26" r="4" fill="#f0d040"/>`,
  lantern: () => `<path d="M-6 -56 H6 M0 -56 V-46" stroke="${INK}" stroke-width="5"/><rect x="-22" y="-46" width="44" height="12" rx="4" fill="#2f2950" ${o()}/>
      <path d="M-26 -34 H26 L22 30 H-22Z" fill="#ffd84a" ${o()}/><path d="M-10 -20 C-14 0 14 0 10 -20 C8 -6 -8 -6 -10 -20Z" fill="#ff8f2e"/><rect x="-26" y="28" width="52" height="12" rx="4" fill="#2f2950" ${o()}/>`,
  candle: () => `<rect x="-18" y="-20" width="36" height="62" rx="4" fill="#fff6e0" ${o()}/><path d="M0 -24 V-34" stroke="${INK}" stroke-width="4"/><path d="M0 -60 C14 -44 10 -32 0 -32 C-10 -32 -14 -44 0 -60Z" fill="#ffb02a" ${o('stroke-width="3.5"')}/>
      <rect x="-34" y="38" width="68" height="12" rx="6" fill="#ffc93a" ${o()}/>`,
  dagger: () => `<g transform="rotate(35)"><path d="M0 -58 L10 -10 H-10Z" fill="#e8e5f8" ${o()}/><rect x="-26" y="-12" width="52" height="10" rx="4" fill="#ffc93a" ${o()}/><rect x="-7" y="-2" width="14" height="32" rx="4" fill="#8a3ae0" ${o()}/><circle cy="34" r="8" fill="#ffc93a" ${o('stroke-width="3.5"')}/></g>`,
  shield: ({ color = '#3f86f2' } = {}) => `<path d="M0 -48 L40 -34 C40 6 26 34 0 48 C-26 34 -40 6 -40 -34Z" fill="${color}" ${o()}/><path d="M0 -36 L28 -26 C28 2 18 24 0 34Z" fill="#fff" opacity=".35"/>${txt(0, 12, 34, '#ffd84a', '★')}`,
  sword: () => `<g transform="rotate(-35)"><path d="M-7 -58 L0 -66 L7 -58 V18 H-7Z" fill="#e8e5f8" ${o()}/><rect x="-24" y="16" width="48" height="10" rx="4" fill="#ffc93a" ${o()}/><rect x="-6" y="26" width="12" height="24" rx="3" fill="#7a3e1e" ${o()}/></g>`,
  eye: () => `<path d="M-50 0 C-30 -32 30 -32 50 0 C30 32 -30 32 -50 0Z" fill="#fff" ${o()}/><circle r="18" fill="#3f86f2" ${o('stroke-width="3.5"')}/><circle r="8" fill="${INK}"/><circle cx="-5" cy="-6" r="4" fill="#fff"/>`,
  controller: () => `<path d="M-50 10 C-56 -20 -34 -26 -20 -20 H20 C34 -26 56 -20 50 10 C46 32 30 30 22 16 H-22 C-30 30 -46 32 -50 10Z" fill="#2f2950" ${o()}/>
      <path d="M-34 -4 H-18 M-26 -12 V4" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="-8" r="5" fill="#e8303c"/><circle cx="34" cy="2" r="5" fill="#22b97a"/>`,
  rope: () => `<path d="M-60 0 C-30 -12 -10 12 20 0 S50 -12 60 0" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M-60 0 C-30 -12 -10 12 20 0 S50 -12 60 0" fill="none" stroke="#e0b070" stroke-width="9" stroke-linecap="round" stroke-dasharray="7 5"/><rect x="-6" y="-16" width="12" height="32" fill="#e8303c" ${o('stroke-width="3.5"')}/>`,
  chair: ({ color = '#e8303c' } = {}) => `<rect x="-28" y="-50" width="56" height="50" rx="8" fill="${color}" ${o()}/><rect x="-34" y="-4" width="68" height="14" rx="5" fill="${mix(color, -.2)}" ${o()}/>
      <path d="M-28 10 V48 M28 10 V48" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`,
  mole: () => `<ellipse cx="0" cy="34" rx="48" ry="14" fill="#5a3418" ${o()}/><path d="M-30 34 V-6 A30 30 0 0 1 30 -6 V34" fill="#a0724a" ${o()}/>
      <circle cx="-11" cy="-10" r="5" fill="${INK}"/><circle cx="11" cy="-10" r="5" fill="${INK}"/><ellipse cx="0" cy="4" rx="10" ry="7" fill="#f0509c" ${o('stroke-width="3"')}/><path d="M-6 14 H6" stroke="#fff" stroke-width="5"/>`,
  hammer: () => `<g transform="rotate(-30)"><rect x="-6" y="-14" width="12" height="66" rx="5" fill="#c9783a" ${o()}/><rect x="-32" y="-42" width="64" height="30" rx="8" fill="#e8303c" ${o()}/>${shine(-16, -34, 10, 3, 0, .5)}</g>`,
  cake: () => `<rect x="-44" y="-6" width="88" height="46" rx="6" fill="#f0509c" ${o()}/><path d="M-44 -2 C-30 14 -20 -6 -10 10 C0 -6 10 14 20 -2 C30 14 40 -4 44 -2 V-10 H-44Z" fill="#fff" ${o('stroke-width="3.5"')}/>
      <rect x="-4" y="-34" width="8" height="26" fill="#4ad6ff" ${o('stroke-width="3"')}/><path d="M0 -50 C8 -40 6 -34 0 -34 C-6 -34 -8 -40 0 -50Z" fill="#ffb02a" ${o('stroke-width="3"')}/>`,
  bento: () => `<rect x="-54" y="-36" width="108" height="76" rx="10" fill="#e8303c" ${o()}/><rect x="-46" y="-28" width="44" height="60" rx="5" fill="#fff" ${o('stroke-width="3.5"')}/>
      <rect x="2" y="-28" width="44" height="28" rx="5" fill="#22b97a" ${o('stroke-width="3.5"')}/><rect x="2" y="4" width="44" height="28" rx="5" fill="#ffd84a" ${o('stroke-width="3.5"')}/>
      <circle cx="-34" cy="-10" r="8" fill="#fff" ${o('stroke-width="3"')}/><circle cx="-16" cy="12" r="8" fill="#fff" ${o('stroke-width="3"')}/><rect x="-26" y="-2" width="14" height="10" fill="${INK}"/><circle cx="24" cy="-14" r="7" fill="#e8303c" ${o('stroke-width="3"')}/>`,
  pig: () => `<ellipse cx="0" cy="6" rx="46" ry="34" fill="#ffb8d0" ${o()}/><path d="M-34 -18 L-38 -40 L-18 -28Z M34 -18 L38 -40 L18 -28Z" fill="#ff9ac0" ${o('stroke-width="4"')}/>
      <ellipse cx="0" cy="14" rx="16" ry="11" fill="#ff9ac0" ${o('stroke-width="4"')}/><circle cx="-5" cy="14" r="3" fill="${INK}"/><circle cx="5" cy="14" r="3" fill="${INK}"/><circle cx="-18" cy="-6" r="4.5" fill="${INK}"/><circle cx="18" cy="-6" r="4.5" fill="${INK}"/>`,
  snake: () => `<path d="M-56 30 C-40 0 -20 40 0 10 S30 -20 44 -30" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/><path d="M-56 30 C-40 0 -20 40 0 10 S30 -20 44 -30" fill="none" stroke="#22b97a" stroke-width="17" stroke-linecap="round"/>
      <path d="M-56 30 C-40 0 -20 40 0 10 S30 -20 44 -30" fill="none" stroke="#ffe066" stroke-width="5" stroke-dasharray="4 12"/><circle cx="46" cy="-34" r="14" fill="#22b97a" ${o()}/><circle cx="50" cy="-38" r="3.5" fill="${INK}"/><path d="M60 -30 l10 4 m-10 -4 l8 8" stroke="#e8303c" stroke-width="3"/>`,
  ladder: () => `<g transform="rotate(20)"><path d="M-20 -56 V56 M20 -56 V56" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M-20 -56 V56 M20 -56 V56" stroke="#c9783a" stroke-width="6" stroke-linecap="round"/>
      ${[-40, -16, 8, 32].map(y => `<path d="M-20 ${y} H20" stroke="${INK}" stroke-width="11"/><path d="M-20 ${y} H20" stroke="#e0a060" stroke-width="5"/>`).join('')}</g>`,
  candy: ({ color = '#f0509c' } = {}) => `<path d="M-30 0 L-54 -18 L-50 0 L-54 18Z M30 0 L54 -18 L50 0 L54 18Z" fill="${mix(color, .2)}" ${o('stroke-width="4"')}/><circle r="30" fill="${color}" ${o()}/><path d="M-20 -20 C0 -8 0 8 20 20 M-28 6 C-12 10 10 -10 28 -6" stroke="#fff" stroke-width="5" fill="none"/>`,
  lollipop: () => `<path d="M0 20 V60" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M0 20 V60" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cy="-10" r="34" fill="#f0509c" ${o()}/><path d="M0 -10 m-20 0 a20 20 0 1 1 20 20 a12 12 0 1 1 -12 -12" fill="none" stroke="#fff" stroke-width="6"/>`,
  domino: ({ a = 3, b = 5 } = {}) => {
    const P = { 0: [], 1: [[.5, .5]], 2: [[.25, .25], [.75, .75]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.25, .25], [.75, .25], [.25, .75], [.75, .75]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.25, .2], [.75, .2], [.25, .5], [.75, .5], [.25, .8], [.75, .8]] };
    const pp = (v, oy) => P[v].map(([x, y]) => `<circle cx="${-22 + x * 44}" cy="${oy + y * 44}" r="5" fill="${INK}"/>`).join('');
    return `<rect x="-26" y="-46" width="52" height="100" rx="9" fill="#d8d4ee" ${o()}/><rect x="-26" y="-52" width="52" height="100" rx="9" fill="#fff" ${o()}/><path d="M-20 -2 H20" stroke="${INK}" stroke-width="3.5"/>${pp(a, -48)}${pp(b, 2)}`;
  },
  peg: ({ color = '#e8303c' } = {}) => `<path d="M-10 40 L-14 -10 A14 14 0 1 1 14 -10 L10 40Z" fill="${color}" ${o()}/>${shine(-4, -22, 4, 6, -20, .6)}`,
  boardTrack: ({ cols = ['#e8303c', '#ffc93a', '#22b97a', '#3f86f2'] } = {}) => {
    let h = `<rect x="-56" y="-56" width="112" height="112" rx="10" fill="#fff6e0" ${o()}/>`;
    const sq = 14; let i = 0;
    for (let x = -50; x < 50; x += sq) { h += `<rect x="${x}" y="-50" width="${sq}" height="${sq}" fill="${cols[i++ % 4]}" stroke="${INK}" stroke-width="2"/>`; h += `<rect x="${x}" y="${50 - sq}" width="${sq}" height="${sq}" fill="${cols[i++ % 4]}" stroke="${INK}" stroke-width="2"/>`; }
    for (let y = -50 + sq; y < 50 - sq; y += sq) { h += `<rect x="-50" y="${y}" width="${sq}" height="${sq}" fill="${cols[i++ % 4]}" stroke="${INK}" stroke-width="2"/>`; h += `<rect x="${50 - sq}" y="${y}" width="${sq}" height="${sq}" fill="${cols[i++ % 4]}" stroke="${INK}" stroke-width="2"/>`; }
    return `<g transform="scale(1 .66)">${h}<rect x="-26" y="-26" width="52" height="52" rx="6" fill="${cols[3]}" ${o('stroke-width="4"')}/></g>`;
  },
  ship: ({ color = '#e8303c' } = {}) => `<path d="M-56 4 H56 L42 34 H-42Z" fill="${color}" ${o()}/><rect x="-26" y="-18" width="44" height="22" rx="3" fill="#fff" ${o()}/><rect x="-14" y="-38" width="14" height="20" fill="#2f2950" ${o()}/>
      <circle cx="-14" cy="-7" r="4" fill="#4ad6ff"/><circle cx="2" cy="-7" r="4" fill="#4ad6ff"/><path d="M-60 40 C-40 30 -20 50 0 40 S40 30 60 40" fill="none" stroke="#4ad6ff" stroke-width="6" stroke-linecap="round"/>`,
  train: ({ color = '#e8303c' } = {}) => `<rect x="-50" y="-16" width="70" height="42" rx="6" fill="${color}" ${o()}/><rect x="10" y="-40" width="40" height="66" rx="6" fill="${mix(color, -.15)}" ${o()}/><rect x="18" y="-32" width="24" height="18" rx="3" fill="#bfe8ff" ${o('stroke-width="3"')}/>
      <rect x="-42" y="-36" width="16" height="22" fill="#2f2950" ${o()}/><circle cx="-34" cy="32" r="12" fill="${INK}"/><circle cx="-4" cy="32" r="12" fill="${INK}"/><circle cx="34" cy="32" r="12" fill="${INK}"/><circle cx="-34" cy="32" r="4" fill="#ffd84a"/><circle cx="-4" cy="32" r="4" fill="#ffd84a"/><circle cx="34" cy="32" r="4" fill="#ffd84a"/>`,
  castle: ({ color = '#b8b3d8' } = {}) => `<rect x="-46" y="-14" width="92" height="60" fill="${color}" ${o()}/><path d="M-46 -14 V-30 H-36 V-20 H-26 V-30 H-16 V-20 H-6 V-30 H6 V-20 H16 V-30 H26 V-20 H36 V-30 H46 V-14" fill="${color}" ${o()}/>
      <rect x="-56" y="-46" width="26" height="92" fill="${mix(color, -.1)}" ${o()}/><rect x="30" y="-46" width="26" height="92" fill="${mix(color, -.1)}" ${o()}/><path d="M-60 -46 L-43 -70 L-26 -46Z M26 -46 L43 -70 L60 -46Z" fill="#e8303c" ${o()}/>
      <path d="M-14 46 V18 A14 14 0 0 1 14 18 V46Z" fill="#7a3e1e" ${o()}/>`,
  skyline: () => `<rect x="-60" y="-10" width="30" height="56" fill="#8a55ef" ${o()}/><rect x="-30" y="-50" width="34" height="96" fill="#3f86f2" ${o()}/><rect x="4" y="-26" width="28" height="72" fill="#22b97a" ${o()}/><rect x="32" y="-40" width="28" height="86" fill="#ff8f2e" ${o()}/>
      ${[-40, -26, -12, 2, 16, 30].map(y => `<rect x="-22" y="${y}" width="8" height="8" fill="#ffe066"/><rect x="-8" y="${y}" width="8" height="8" fill="#ffe066"/>`).join('')}${[-30, -16, -2, 12, 26].map(y => `<rect x="40" y="${y}" width="12" height="8" fill="#fff6c0"/>`).join('')}`,
  island: () => `<ellipse cx="0" cy="30" rx="60" ry="18" fill="#4ad6ff" ${o()}/><ellipse cx="0" cy="22" rx="42" ry="14" fill="#ffe2a0" ${o()}/>
      <path d="M0 22 C2 0 -2 -20 6 -34" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M0 22 C2 0 -2 -20 6 -34" fill="none" stroke="#c9783a" stroke-width="4"/>
      <path d="M6 -34 C-10 -46 -30 -40 -36 -28 C-20 -36 -6 -34 6 -34 C0 -52 22 -58 32 -48 C20 -48 12 -42 6 -34 C24 -40 40 -30 40 -18 C28 -28 16 -32 6 -34Z" fill="#22b97a" ${o('stroke-width="4"')}/>`,
  wheat: () => `<path d="M0 50 V-30" stroke="${INK}" stroke-width="7"/><path d="M0 50 V-30" stroke="#e0b040" stroke-width="3"/>${[-30, -14, 2].map(y => `<ellipse cx="-10" cy="${y}" rx="8" ry="14" fill="#ffd84a" ${o('stroke-width="3.5"')} transform="rotate(-30 -10 ${y})"/><ellipse cx="10" cy="${y}" rx="8" ry="14" fill="#ffd84a" ${o('stroke-width="3.5"')} transform="rotate(30 10 ${y})"/>`).join('')}<ellipse cx="0" cy="-44" rx="8" ry="14" fill="#ffd84a" ${o('stroke-width="3.5"')}/>`,
  sheep: () => `<g>${[[-26, -6], [-10, -18], [10, -18], [26, -6], [-18, 10], [0, 12], [18, 10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="#fff" ${o()}/>`).join('')}${[[-26, -6], [-10, -18], [10, -18], [26, -6], [-18, 10], [0, 12], [18, 10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#fff"/>`).join('')}
      <ellipse cx="-38" cy="-4" rx="14" ry="11" fill="#2f2950" ${o('stroke-width="3.5"')}/><circle cx="-42" cy="-6" r="2.5" fill="#fff"/><path d="M-14 26 V42 M14 26 V42" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></g>`,
  shapes: () => `<circle cx="-30" cy="-10" r="20" fill="#e8303c" ${o()}/><rect x="2" y="-36" width="38" height="38" rx="5" fill="#3f86f2" ${o()}/><path d="M-10 46 L10 10 L30 46Z" fill="#22b97a" ${o()}/><path d="M-44 30 L-36 14 L-28 30 L-36 46Z" fill="#ffd84a" ${o('stroke-width="4"')}/>`,
  bingoCard: () => {
    let h = `<rect x="-50" y="-50" width="100" height="100" rx="8" fill="#fff" ${o()}/><rect x="-50" y="-50" width="100" height="22" rx="8" fill="#3f86f2" ${o()}/>`;
    h += ['B', 'I', 'N', 'G', 'O'].map((l, i) => `<text x="${-40 + i * 20}" y="-33" text-anchor="middle" font-family="${FUN}" font-size="14" fill="#fff">${l}</text>`).join('');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) h += `<text x="${-40 + c * 20}" y="${-12 + r * 18}" text-anchor="middle" font-family="${FUN}" font-size="11" fill="${INK}">${(c * 15 + r * 4 + 3) % 75 + 1}</text>`;
    return h + `<circle cx="-20" cy="-4" r="9" fill="#f0509c" opacity=".75"/><circle cx="0" cy="14" r="9" fill="#f0509c" opacity=".75"/><circle cx="20" cy="32" r="9" fill="#f0509c" opacity=".75"/>`;
  },
  ball: ({ color = '#ff8f2e', n = '8' } = {}) => `<circle r="34" fill="${color}" ${o()}/><circle cx="-4" cy="-4" r="14" fill="#fff"/>${`<text x="-4" y="2" text-anchor="middle" font-family="${FUN}" font-size="16" fill="${INK}">${n}</text>`}${shine(-14, -18, 8, 4, -30, .6)}`,
  hexes: () => [[0, 0, '#22b97a'], [-38, -22, '#ffd84a'], [38, -22, '#c9783a'], [-38, 22, '#b8b3d8'], [38, 22, '#e8303c'], [0, -44, '#4ad6ff'], [0, 44, '#ff8f2e']].map(([x, y, c]) => `<path d="M${x - 22} ${y} L${x - 11} ${y - 19} L${x + 11} ${y - 19} L${x + 22} ${y} L${x + 11} ${y + 19} L${x - 11} ${y + 19}Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`).join(''),
  rails: () => `<path d="M-60 40 C-20 10 20 -10 60 -40" fill="none" stroke="#a0724a" stroke-width="30" stroke-dasharray="6 10"/><path d="M-60 30 C-20 0 20 -20 60 -50 M-60 50 C-20 20 20 0 60 -30" fill="none" stroke="${INK}" stroke-width="5"/>`,
  tank: () => `<rect x="-50" y="8" width="100" height="28" rx="14" fill="#5a6a3a" ${o()}/>${[-34, -12, 10, 32].map(x => `<circle cx="${x}" cy="22" r="8" fill="#3a4a2a" ${o('stroke-width="3"')}/>`).join('')}<path d="M-36 8 L-28 -14 H28 L36 8Z" fill="#7a8a4a" ${o()}/><rect x="20" y="-12" width="44" height="10" rx="4" fill="#7a8a4a" ${o()}/>`,
  dartArrow: () => '',
  number: ({ n = '7', color = '#ffd84a' } = {}) => txt(0, 34, 100, color, n),
  letters: ({ t = 'ABC', color = '#ffffff' } = {}) => txt(0, 24, 64, color, t),
  dialMeter: () => `<path d="M-56 20 A56 56 0 0 1 56 20Z" fill="#fff" ${o()}/><path d="M0 20 L-50 -6 A56 56 0 0 1 -30 -32Z" fill="#ff8f2e"/><path d="M0 20 L-30 -32 A56 56 0 0 1 0 -36Z" fill="#ffd84a"/><path d="M0 20 L0 -36 A56 56 0 0 1 30 -32Z" fill="#22b97a"/><path d="M0 20 L30 -32 A56 56 0 0 1 50 -6Z" fill="#3f86f2"/>
      <path d="M-56 20 A56 56 0 0 1 56 20Z" fill="none" ${o()}/><path d="M0 20 L20 -30" stroke="#e8303c" stroke-width="7" stroke-linecap="round"/><circle cy="20" r="8" fill="${INK}"/>`,
  spy: () => `<path d="M-44 -6 H44 L28 -14 L20 -40 H-20 L-28 -14Z" fill="#2f2950" ${o()}/><rect x="-24" y="-20" width="48" height="8" fill="#e8303c"/><circle cx="-16" cy="12" r="14" fill="#2f2950" ${o()}/><circle cx="16" cy="12" r="14" fill="#2f2950" ${o()}/><path d="M-2 12 H2" ${o()}/>${shine(-20, 8, 5, 3, -30, .6)}${shine(12, 8, 5, 3, -30, .6)}`,
  rps: () => `<path d="M-50 10 C-50 -16 -30 -24 -16 -16 C-10 -26 6 -24 8 -12 C18 -16 26 -6 22 6 C24 24 4 34 -20 30 C-40 28 -50 22 -50 10Z" fill="#ffcc99" ${o()}/>
      <path d="M-30 -6 C-26 -2 -22 -2 -18 -6 M-14 -10 C-10 -6 -4 -6 0 -10" fill="none" stroke="${INK}" stroke-width="3"/>`,
  burst: ({ color = '#ffd84a', t = '' } = {}) => { let p = ''; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r = i % 2 ? 36 : 50; p += `${i ? 'L' : 'M'}${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`; } return `<path d="${p}Z" fill="${color}" ${o()}/>${t ? txt(0, 12, 30, '#fff', t) : ''}`; },
  sun: () => { let r = ''; for (let i = 0; i < 12; i++) r += `<path d="M0 -40 L8 -56 L-8 -56Z" fill="#ffb02a" ${o('stroke-width="3.5"')} transform="rotate(${i * 30})"/>`; return r + `<circle r="36" fill="#ffd84a" ${o()}/><circle cx="-12" cy="-4" r="4" fill="${INK}"/><circle cx="12" cy="-4" r="4" fill="${INK}"/><path d="M-12 10 Q0 20 12 10" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; },
  cloud: ({ color = '#ffffff' } = {}) => `<path d="M-46 20 C-62 20 -62 -6 -42 -6 C-42 -30 -10 -36 0 -18 C10 -40 44 -30 38 -6 C60 -6 60 20 44 20Z" fill="${color}" ${o()}/>`,
  bolt: () => `<path d="M8 -50 L-26 6 H-2 L-12 50 L26 -8 H2Z" fill="#ffd84a" ${o()}/>`,
  firework: ({ color = '#f0509c' } = {}) => { let r = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; r += `<path d="M${(14 * Math.cos(a)).toFixed(1)} ${(14 * Math.sin(a)).toFixed(1)} L${(46 * Math.cos(a)).toFixed(1)} ${(46 * Math.sin(a)).toFixed(1)}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M${(14 * Math.cos(a)).toFixed(1)} ${(14 * Math.sin(a)).toFixed(1)} L${(46 * Math.cos(a)).toFixed(1)} ${(46 * Math.sin(a)).toFixed(1)}" stroke="${i % 2 ? color : '#ffd84a'}" stroke-width="4" stroke-linecap="round"/>`; } return r + `<circle r="8" fill="#fff" ${o('stroke-width="3"')}/>`; },
  bug: () => `<ellipse cx="0" cy="6" rx="30" ry="36" fill="#e8303c" ${o()}/><path d="M0 -30 V42" ${o()}/><circle cy="-36" r="16" fill="#2f2950" ${o()}/>
      <circle cx="-14" cy="0" r="6" fill="${INK}"/><circle cx="14" cy="16" r="6" fill="${INK}"/><circle cx="-12" cy="26" r="5" fill="${INK}"/><circle cx="12" cy="-10" r="5" fill="${INK}"/><path d="M-8 -50 L-16 -60 M8 -50 L16 -60" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  flower: ({ color = '#f0509c' } = {}) => `${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-22" rx="14" ry="22" fill="${color}" ${o('stroke-width="4"')} transform="rotate(${a})"/>`).join('')}<circle r="14" fill="#ffd84a" ${o('stroke-width="4"')}/>`,
  thorn: () => `<path d="M0 50 C-4 20 6 0 0 -40" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M0 50 C-4 20 6 0 0 -40" fill="none" stroke="#22b97a" stroke-width="5" stroke-linecap="round"/><path d="M2 10 L18 2 L4 0Z M-2 -14 L-18 -22 L-2 -24Z M2 30 L16 26 L2 22Z" fill="#22b97a" ${o('stroke-width="3"')}/>`,
  tv: () => `<rect x="-54" y="-38" width="108" height="72" rx="10" fill="#2f2950" ${o()}/><rect x="-44" y="-28" width="88" height="52" rx="5" fill="#4ad6ff" ${o('stroke-width="3"')}/><path d="M-20 44 H20 M0 34 V44" ${o()}/>${shine(-24, -16, 14, 4, -10, .5)}`,
  buzzer: () => `<ellipse cx="0" cy="20" rx="48" ry="18" fill="#2f2950" ${o()}/><path d="M-48 20 V6 H48 V20" fill="#2f2950" ${o()}/><ellipse cx="0" cy="6" rx="48" ry="18" fill="#3a3460" ${o()}/>
      <path d="M-34 4 C-34 -32 34 -32 34 4Z" fill="#e8303c" ${o()}/>${shine(-12, -14, 10, 5, -10, .55)}`,
  ticket: ({ color = '#ffd84a' } = {}) => `<path d="M-50 -26 H50 V-8 A8 8 0 0 0 50 8 V26 H-50 V8 A8 8 0 0 0 -50 -8Z" fill="${color}" ${o()}/><path d="M24 -26 V26" stroke="${INK}" stroke-width="3" stroke-dasharray="5 5"/>${txt(-12, 10, 26, '#fff', '★')}`,
  chart: () => `<rect x="-50" y="-44" width="100" height="88" rx="8" fill="#fff" ${o()}/><path d="M-38 24 L-14 0 L4 12 L36 -28" fill="none" stroke="#22b97a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 -28 L24 -28 M36 -28 L36 -16" stroke="#22b97a" stroke-width="8" stroke-linecap="round"/>`,
  wand: () => `<g transform="rotate(30)"><rect x="-5" y="-30" width="10" height="80" rx="4" fill="#2f2950" ${o()}/><rect x="-5" y="-30" width="10" height="14" fill="#fff"/></g><path d="M-14 -52 l5 -11 5 11 12 2 -9 8 2 12 -10 -6 -10 6 2 -12 -9 -8Z" fill="#ffd84a" ${o('stroke-width="3.5"')}/>`,
  alien: () => `<ellipse cx="0" cy="0" rx="34" ry="42" fill="#7cf5b8" ${o()}/><ellipse cx="-13" cy="-4" rx="10" ry="14" fill="${INK}" transform="rotate(20 -13 -4)"/><ellipse cx="13" cy="-4" rx="10" ry="14" fill="${INK}" transform="rotate(-20 13 -4)"/><path d="M-10 22 Q0 28 10 22" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M-14 -40 L-22 -58 M14 -40 L22 -58" stroke="${INK}" stroke-width="4"/><circle cx="-22" cy="-60" r="5" fill="#ffd84a" ${o('stroke-width="3"')}/><circle cx="22" cy="-60" r="5" fill="#ffd84a" ${o('stroke-width="3"')}/>`,
  cat: () => `<path d="M-38 40 V-10 L-40 -46 L-16 -26 H16 L40 -46 L38 -10 V40Z" fill="#ff9d3c" ${o()}/><circle cx="-14" cy="-6" r="6" fill="${INK}"/><circle cx="14" cy="-6" r="6" fill="${INK}"/><path d="M-4 6 H4 L0 12Z" fill="#f0509c"/><path d="M0 12 Q-8 20 -14 14 M0 12 Q8 20 14 14" fill="none" stroke="${INK}" stroke-width="3"/><path d="M-20 4 H-40 M20 4 H40" stroke="${INK}" stroke-width="2.5"/>`,
  palette: () => `<path d="M0 -44 C40 -44 56 -14 50 6 C44 22 26 12 18 22 C10 34 26 46 6 46 C-30 46 -52 18 -50 -6 C-48 -30 -26 -44 0 -44Z" fill="#ffe2a0" ${o()}/>${[[-26, -14, '#e8303c'], [-6, -26, '#ffd84a'], [18, -24, '#22b97a'], [-30, 12, '#3f86f2'], [32, -6, '#8a55ef']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}" ${o('stroke-width="3"')}/>`).join('')}`,
  frame: ({ color = '#ffc93a' } = {}) => `<rect x="-50" y="-40" width="100" height="80" rx="4" fill="${color}" ${o()}/><rect x="-38" y="-28" width="76" height="56" fill="#bfe8ff" ${o('stroke-width="3.5"')}/><path d="M-38 28 L-12 4 L4 18 L18 6 L38 28Z" fill="#22b97a"/><circle cx="20" cy="-12" r="7" fill="#ffd84a"/>`,
  // plain things used as small accents
  sparkle: ({ color = '#fff' } = {}) => `<path d="M0 -20 C2 -6 6 -2 20 0 C6 2 2 6 0 20 C-2 6 -6 2 -20 0 C-6 -2 -2 -6 0 -20Z" fill="${color}" ${o('stroke-width="3"')}/>`,
};

// ---------------------------------------------------------------- the stage
// Place one object: P(name, x, y, size, turn, opts).
export const P = (name, x, y, s = 1, r = 0, opts) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${K[name] ? K[name](opts) : ''}</g>`;
// A fan of cards (any of card / ccard / back), spread from a point below.
export const fan = (cards, x, y, s = 1, spread = 14) => cards.map(([name, opts], i) => {
  const a = (i - (cards.length - 1) / 2) * spread;
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${a}) translate(0 -46)">${K[name](opts)}</g>`;
}).join('');

// The bright printed background: the game's colour, bold lighter and darker shards, a few confetti bits.
const SHARDS = [['0,0 230,0 60,190', '#fff', .16], ['230,0 430,0 310,150', '#000', .1], ['430,0 600,0 600,170 540,70', '#fff', .12],
  ['60,190 310,150 190,400 0,400 0,260', '#000', .09], ['310,150 600,170 520,400', '#fff', .14], ['0,0 60,190 0,260', '#fff', .08],
  ['520,400 600,170 600,400', '#000', .12], ['190,400 310,150 360,400', '#fff', .06], ['360,400 310,150 520,400', '#000', .05]];
export function backdrop(pre, main, deep, flip = 0) {
  const t = flip === 1 ? 'transform="translate(600 0) scale(-1 1)"' : flip === 2 ? 'transform="translate(0 400) scale(1 -1)"' : '';
  const bits = [[44, 40, 24, '#fff'], [552, 58, -30, '#ffd84a'], [512, 352, 45, '#fff'], [82, 340, 10, '#ffd84a'], [300, 22, 70, '#fff']]
    .map(([x, y, r, c], i) => i % 2 ? `<path d="M${x} ${y} l9 -15 l9 15z" fill="${c}" opacity=".6" transform="rotate(${r} ${x} ${y})"/>` : `<rect x="${x}" y="${y}" width="14" height="6" rx="2" fill="${c}" opacity=".6" transform="rotate(${r} ${x} ${y})"/>`).join('');
  return `<rect width="600" height="400" fill="${main}"/><g ${t}>${SHARDS.map(([p, c, a]) => `<polygon points="${p}" fill="${c}" fill-opacity="${a}"/>`).join('')}</g>
    <path d="M0 400 L0 330 Q300 300 600 340 L600 400Z" fill="${deep}" opacity=".35"/>${bits}`;
}
// The cartoon drop shadow every object casts (one filter for the whole group).
export const shadowDef = pre => `<filter id="${pre}-tsh" x="-10%" y="-10%" width="120%" height="125%"><feOffset in="SourceAlpha" dy="9" result="o"/><feFlood flood-color="#0c0630" flood-opacity=".35"/><feComposite in2="o" operator="in" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
