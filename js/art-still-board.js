// Still-life covers: board games. Boards lie in perspective, pieces stand on them.
export default function paint(K) {
  const { cover, shell, T } = K;
  const C = (id, title, tag, bg, body, z = 1.2) => shell(id, { title, tag, bg }, `${T.defs(id)}${T.zoom(body, z)}`);
  const shade = K.shade;
  const TILT = .58;
  // Map a board-local point (bx, by) to the screen for a board laid at (x, y) with rotation r.
  const P = (x, y, r, bx, by, s = 1) => { const a = r * Math.PI / 180, X = bx * Math.cos(a) - by * Math.sin(a), Y = bx * Math.sin(a) + by * Math.cos(a); return [x + X * s, y + Y * s * TILT]; };
  const bowl = (id, x, y, s, c = '#7a4a22') => T.stand(id, x, y, 70 * s, `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 -20 Q-56 30 0 34 Q56 30 60 -20 Z" fill="${c}"/><path d="M-60 -20 Q-56 30 0 34" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="6"/><ellipse cy="-20" rx="60" ry="16" fill="${shade(c, -.35)}"/><ellipse cy="-20" rx="60" ry="16" fill="none" stroke="${shade(c, .2)}" stroke-width="2"/></g>`);

  cover('chess', id => C(id, 'Chess', 'The classic duel', ['#5a3c24', '#33200f', '#110a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2212', lx: 300 })}
    ${T.lay(id, 300, 200, 0, T.board(8, 40, '#e8d4ac', '#6a4426', { frame: '#2a1608' }), { tilt: TILT })}
    ${T.piece(id, 200, 180, .7, 'r', 'b')}${T.piece(id, 410, 168, .7, 'n', 'b')}${T.piece(id, 340, 210, .75, 'p', 'w')}
    ${T.piece(id, 250, 260, 1.15, 'k', 'w')}${T.piece(id, 360, 262, 1.05, 'q', 'b')}
    ${T.piece(id, 150, 330, 1.2, 'p', 'b', { blur: 4 })}
  `));

  cover('powerup', id => C(id, 'PowerUp Chess', 'Captures lend their moves', ['#4a3418', '#2f2215', '#100a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2212', lx: 300 })}
    ${T.lay(id, 300, 200, 0, T.board(8, 40, '#e8d4ac', '#6a4426', { frame: '#2a1608' }), { tilt: TILT })}
    <circle cx="290" cy="200" r="70" fill="#ffd36a" opacity=".22" filter="url(#${id}-b8)"/>
    ${T.piece(id, 290, 250, 1.1, 'n', 'w')}${T.piece(id, 290, 166, .55, 'b', 'w')}
    <ellipse cx="290" cy="168" rx="26" ry="8" fill="none" stroke="url(#${id}-brass)" stroke-width="3"/>
    ${T.piece(id, 400, 200, .75, 'r', 'b')}${T.piece(id, 180, 210, .75, 'p', 'b')}
  `));

  cover('checkers', id => C(id, 'Checkers', 'Jump, crown, clear', ['#6b3b2a', '#3e2016', '#140906'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#4a2a14', lx: 300 })}
    ${T.lay(id, 300, 200, 0, T.board(8, 40, '#d8b880', '#2a1a10', { frame: '#3a1a0c' }), { tilt: TILT })}
    ${[[230, 170, '#9b2a24'], [370, 186, '#1d1b1a'], [190, 230, '#1d1b1a'], [420, 240, '#9b2a24'], [300, 150, '#1d1b1a']].map(([x, y, c]) => T.checker(id, x, y, 20, c)).join('')}
    ${T.checker(id, 300, 250, 26, '#9b2a24', { king: true })}
  `));

  cover('backgammon', id => {
    const pts = Array.from({ length: 12 }, (_, i) => { const x = -230 + (i < 6 ? 0 : 20) + i * 36; return `<path d="M${x} -110 L${x + 18} -10 L${x + 36} -110 Z" fill="${i % 2 ? '#7a2b26' : '#2f4a3a'}"/><path d="M${x} 110 L${x + 18} 10 L${x + 36} 110 Z" fill="${i % 2 ? '#2f4a3a' : '#7a2b26'}"/>`; }).join('');
    const board = `<rect x="-250" y="-130" width="500" height="260" rx="8" fill="#3a1e0c"/><rect x="-236" y="-118" width="226" height="236" fill="#e6d3ad"/><rect x="10" y="-118" width="226" height="236" fill="#e6d3ad"/>${pts}<rect x="-10" y="-130" width="20" height="260" fill="#2a1408"/>`;
    return C(id, 'Backgammon', 'Race, hit, double', ['#7a4a26', '#4a2a14', '#1a0d05'], `
      ${T.surface(id, 'leather', { hz: 26, color: '#2a1a12', lx: 300 })}
      ${T.lay(id, 300, 190, 0, board, { tilt: TILT })}
      ${[[-212, -96], [-212, -78], [-212, -60], [190, 96], [190, 78], [-140, 96], [100, -96], [100, -78]].map(([bx, by], i) => { const [x, y] = P(300, 190, 0, bx, by); return T.stone(x, y, 15, i > 2 && i < 6 ? '#1d1b1a' : '#f4f0e6'); }).join('')}
      ${T.die(id, 360, 190, .6, [6, 4, 2], { rot: 12 })}${T.die(id, 420, 205, .6, [4, 1, 5], { rot: -8 })}
      ${T.lay(id, 120, 300, -14, `<rect x="-24" y="-24" width="48" height="48" rx="6" fill="#f6f0e2"/>${T.word('64', 0, 10, 26, { weight: 700, fill: '#7a2b26' })}`)}
    `, .98);
  });

  cover('go', id => C(id, 'Go', 'Surround territory, capture stones', ['#a07a40', '#5a4020', '#1a1206'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1a10', lx: 300 })}
    ${T.lay(id, 300, 190, 0, T.grid(9, 30), { tilt: TILT })}
    ${[[-2, -1, 'b'], [-1, -1, 'w'], [0, 0, 'b'], [1, -1, 'w'], [-1, 1, 'b'], [2, 1, 'w'], [0, 2, 'b'], [1, 1, 'w'], [-3, 2, 'w']].map(([gx, gy, c]) => { const [x, y] = P(300, 190, 0, gx * 30, gy * 30); return T.stone(x, y, 13, c === 'b' ? '#16151a' : '#f4f0e6', { light: c !== 'b' }); }).join('')}
    ${bowl(id, 110, 300, .9)}${bowl(id, 490, 300, .9)}
    ${[[96, 284], [120, 286], [108, 278]].map(([x, y]) => T.stone(x, y, 10, '#16151a')).join('')}${[[478, 284], [502, 286], [490, 278]].map(([x, y]) => T.stone(x, y, 10, '#f4f0e6', { light: true })).join('')}
  `));

  cover('reversi', id => C(id, 'Reversi', 'Trap and flip, own the board', ['#215c39', '#123a22', '#04120a'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1a10', lx: 300 })}
    ${T.lay(id, 300, 200, 0, `${T.board(8, 40, '#2a7a4a', '#2a7a4a', { frame: '#1a1006', line: '#14401f' })}${Array.from({ length: 9 }, (_, i) => `<path d="M${-160 + i * 40} -160 V160 M-160 ${-160 + i * 40} H160" stroke="#14401f" stroke-width="1.5"/>`).join('')}`, { tilt: TILT })}
    ${[[-1, -1, 'w'], [0, -1, 'b'], [-1, 0, 'b'], [0, 0, 'w'], [1, 0, 'b'], [1, 1, 'b'], [-2, 1, 'w'], [0, 1, 'w']].map(([gx, gy, c]) => { const [x, y] = P(300, 200, 0, gx * 40 + 20, gy * 40 + 20); return T.stone(x, y, 16, c === 'b' ? '#16151a' : '#f4f0e6', { light: c !== 'b' }); }).join('')}
    ${T.stand(id, 380, 160, 30, `<ellipse cx="380" cy="138" rx="7" ry="17" fill="#16151a"/><path d="M380 121 A7 17 0 0 1 380 155" fill="#f4f0e6"/>`)}
  `));

  cover('fourup', id => {
    const discs = [['', '', '', '', '', '', ''], ['', '', '', 'y', '', '', ''], ['', '', 'r', 'y', '', '', ''], ['', 'y', 'r', 'r', '', '', ''], ['', 'r', 'y', 'y', 'r', '', ''], ['y', 'r', 'r', 'y', 'y', 'r', '']];
    const frame = `<rect x="-160" y="-140" width="320" height="276" rx="10" fill="#1d4ab0"/><rect x="-160" y="-140" width="320" height="276" rx="10" fill="url(#${id}-fu)"/><defs><linearGradient id="${id}-fu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>${discs.map((row, r) => row.map((d, c) => `<circle cx="${-135 + c * 45}" cy="${-112 + r * 45}" r="17" fill="${d === 'r' ? '#c8232a' : d === 'y' ? '#f2c230' : '#0e1a3a'}"/>${d ? `<circle cx="${-140 + c * 45}" cy="${-117 + r * 45}" r="6" fill="#fff" opacity=".3"/>` : ''}`).join('')).join('')}<rect x="-176" y="136" width="352" height="16" rx="4" fill="#1a3a8a"/>`;
    return C(id, 'Four Up', 'Drop discs, line up four', ['#1d3346', '#122030', '#060c12'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a3020', lx: 300 })}
      ${T.stand(id, 300, 300, 260, `<g transform="translate(300 160) scale(.9)">${frame}</g>`)}
      ${[[150, 320, '#c8232a'], [470, 330, '#f2c230'], [500, 300, '#f2c230']].map(([x, y, c]) => T.lay(id, x, y, 0, `<circle r="20" fill="${c}"/><circle r="14" fill="none" stroke="${shade(c, -.2)}" stroke-width="2"/>`, { thin: true })).join('')}
    `);
  });

  cover('trio', id => {
    const X = `<path d="M-22 -22 L22 22 M22 -22 L-22 22" stroke="#7a1a1a" stroke-width="12" stroke-linecap="round"/>`, O = `<circle r="20" fill="none" stroke="#1d3a6a" stroke-width="11"/>`;
    return C(id, 'Tic Tac Toe', 'Three in a row', ['#2a2d33', '#1a1c20', '#08090a'], `
      ${T.surface(id, 'linen', { hz: 26, color: '#c8bca0', lx: 300 })}
      ${T.lay(id, 300, 200, 0, `<rect x="-140" y="-140" width="280" height="280" rx="10" fill="#7a5032"/><rect x="-128" y="-128" width="256" height="256" rx="6" fill="#9a6a42"/><path d="M-43 -128 V128 M43 -128 V128 M-128 -43 H128 M-128 43 H128" stroke="#5a3418" stroke-width="5"/>${[[-86, -86, X], [0, -86, O], [86, 0, X], [0, 0, X], [-86, 86, O], [86, 86, O]].map(([x, y, g]) => `<g transform="translate(${x} ${y})">${g}</g>`).join('')}`, { tilt: TILT })}
      ${T.lay(id, 470, 310, 20, X, { thin: true })}${T.lay(id, 140, 300, 0, O, { thin: true })}
    `);
  });

  cover('seedstones', id => {
    const pits = Array.from({ length: 12 }, (_, i) => `<ellipse cx="${-150 + (i % 6) * 60}" cy="${i < 6 ? -34 : 34}" rx="24" ry="24" fill="#4a2a12"/><ellipse cx="${-150 + (i % 6) * 60}" cy="${i < 6 ? -34 : 34}" rx="24" ry="24" fill="url(#${id}-pit)"/>`).join('');
    const board = `<defs><radialGradient id="${id}-pit" cx="45%" cy="35%" r="65%"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect x="-240" y="-80" width="480" height="160" rx="70" fill="#9a6a3a"/><rect x="-240" y="-80" width="480" height="160" rx="70" fill="none" stroke="#6a4020" stroke-width="3"/>${pits}<ellipse cx="-208" rx="26" ry="56" fill="#4a2a12"/><ellipse cx="208" rx="26" ry="56" fill="#4a2a12"/>`;
    const gems = ['#4a8ac8', '#c84a4a', '#4aa86a', '#d8b84a', '#8a5ac8'];
    return C(id, 'Seed Stones', 'Sow, capture, fill your store', ['#3a2a1c', '#22180e', '#0c0804'], `
      ${T.surface(id, 'linen', { hz: 26, color: '#b8a888', lx: 300 })}
      ${T.lay(id, 300, 200, 0, board, { tilt: TILT })}
      ${Array.from({ length: 30 }, (_, i) => { const pit = i % 12, [x, y] = P(300, 200, 0, -150 + (pit % 6) * 60 + ((i * 7) % 13 - 6), (pit < 6 ? -34 : 34) + ((i * 5) % 11 - 5)); return T.marble(id, x, y, 5.5, gems[i % 5]); }).join('')}
      ${Array.from({ length: 6 }, (_, i) => { const [x, y] = P(300, 200, 0, 208 + (i % 2) * 8 - 4, -30 + i * 10); return T.marble(id, x, y, 5.5, gems[(i + 2) % 5]); }).join('')}
    `, 1);
  });

  cover('dominoes', id => C(id, 'Dominoes', 'Match the ends', ['#1f4a5a', '#122a34', '#061014'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#1d4a3a', lx: 300 })}
    ${[[6, 6, 300, 170, 0], [6, 3, 300, 104, 0], [3, 5, 370, 70, 90], [6, 1, 228, 170, 90], [1, 4, 160, 170, 90]].map(([a, b, x, y, r]) => T.lay(id, x, y, r, T.domino(a, b, 34, { id }))).join('')}
    ${[0, 1, 2, 3, 4].map(i => T.stand(id, 160 + i * 40, 320, 30, `<g transform="translate(${160 + i * 40} 290)"><rect x="-17" y="-34" width="34" height="68" rx="5" fill="#16151a"/><rect x="-17" y="-34" width="8" height="68" rx="4" fill="#3a3a44"/></g>`)).join('')}
    ${T.lay(id, 470, 300, -20, T.domino(5, 2, 34, { id }))}
  `));

  cover('lineup5', id => {
    let g = '';
    const ranks = ['A', 'K', 'Q', '10', '9', '8'], suits = ['♠', '♥', '♦', '♣'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) g += `<g transform="translate(${-150 + c * 60} ${-120 + r * 60})">${T.pcard(id, ranks[(r + c) % 6], suits[(r * 2 + c) % 4], 42)}</g>`;
    const chipAt = (c, r, col) => `<g transform="translate(${-150 + c * 60} ${-120 + r * 60})">${T.chipTop(id, 18, col)}</g>`;
    return C(id, 'Line Up 5', 'Play a card, place a chip', ['#2a5a40', '#173a28', '#071209'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `<rect x="-190" y="-160" width="380" height="320" rx="10" fill="#1a3a2a"/>${g}${[[0, 0], [1, 1], [2, 2], [3, 3]].map(([c, r]) => chipAt(c, r, '#2a5ab8')).join('')}${chipAt(4, 1, '#2a8a4a')}${chipAt(5, 3, '#2a8a4a')}`, { tilt: TILT })}
      ${T.fan(id, 470, 330, [['Q', '♦'], ['9', '♣']], { w: 80, step: 14 })}
    `);
  });

  cover('shapeshade', id => {
    const sh = { circle: c => `<circle r="12" fill="${c}"/>`, square: c => `<rect x="-11" y="-11" width="22" height="22" fill="${c}"/>`, diamond: c => `<path d="M0 -14 L14 0 L0 14 L-14 0 Z" fill="${c}"/>`, star: c => `<path d="M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4 Z" fill="${c}"/>`, clover: c => `<g fill="${c}"><circle cy="-6" r="6"/><circle cx="6" r="6"/><circle cy="6" r="6"/><circle cx="-6" r="6"/></g>`, cross: c => `<path d="M-4 -13 H4 V-4 H13 V4 H4 V13 H-4 V4 H-13 V-4 H-4 Z" fill="${c}"/>` };
    const tile = (k, c) => `<rect x="-22" y="-22" width="44" height="44" rx="5" fill="#1a1a1e"/><rect x="-22" y="-22" width="44" height="10" rx="5" fill="#fff" opacity=".08"/>${sh[k](c)}`;
    const cols = ['#e8473c', '#f39a1e', '#f2cf2a', '#36a852', '#2f7de1', '#8b45c8'];
    return C(id, 'Shape & Shade', 'Line up colours and shapes', ['#34343a', '#202024', '#0a0a0c'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#6a4a2a', lx: 300 })}
      ${T.lay(id, 300, 180, -4, `${Object.keys(sh).map((k, i) => `<g transform="translate(${-125 + i * 50} 0)">${tile(k, cols[2])}</g>`).join('')}${cols.map((c, i) => i === 2 ? '' : `<g transform="translate(-25 ${-100 + i * 50 - (i > 2 ? 50 : 0)})">${tile('star', c)}</g>`).join('')}`, { tilt: TILT, s: 1.2 })}
      ${T.stand(id, 480, 300, 60, `<g transform="translate(480 270)"><path d="M-40 -20 Q-40 30 0 32 Q40 30 40 -20 Z" fill="#7a4a8a"/><ellipse cy="-20" rx="40" ry="12" fill="#5a2a6a"/><path d="M-40 -20 Q-20 -40 0 -24 Q20 -40 40 -20" fill="#7a4a8a"/></g>`)}
    `);
  });

  cover('cornerstones', id => {
    const piece = (cells, c) => cells.map(([x, y]) => `<rect x="${x * 24}" y="${y * 24}" width="23" height="23" fill="${c}" opacity=".88"/><rect x="${x * 24 + 2}" y="${y * 24 + 2}" width="19" height="6" fill="#fff" opacity=".25"/>`).join('');
    return C(id, 'Cornerstones', 'Fit your pieces corner to corner', ['#3a3e48', '#22252c', '#0a0b0e'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a3a3e', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `<rect x="-170" y="-170" width="340" height="340" rx="8" fill="#cfd2d8"/>${Array.from({ length: 15 }, (_, i) => `<path d="M${-156 + i * 22.3} -156 V156 M-156 ${-156 + i * 22.3} H156" stroke="#b0b4bc" stroke-width="1"/>`).join('')}<g transform="translate(-156 -156) scale(.93)">${piece([[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]], '#2f6de1')}${piece([[3, 3], [4, 3], [4, 4], [4, 5]], '#2f6de1')}${piece([[13, 0], [13, 1], [12, 1], [12, 2], [11, 2]], '#e8473c')}${piece([[10, 3], [10, 4], [9, 4], [8, 4]], '#e8473c')}${piece([[0, 13], [0, 12], [1, 12], [1, 11]], '#f2c230')}${piece([[13, 13], [12, 13], [12, 12], [11, 12], [11, 11]], '#36a852')}${piece([[2, 10], [3, 10], [3, 9]], '#f2c230')}</g>`, { tilt: TILT })}
      ${T.lay(id, 490, 320, 20, piece([[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]], '#e8473c'), { thin: true })}
    `);
  });

  cover('starjump', id => {
    const star = Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6 - Math.PI / 2, R = i % 2 ? 100 : 190; return `${(R * Math.cos(a)).toFixed(1)} ${(R * Math.sin(a)).toFixed(1)}`; }).join(' L');
    const holes = []; for (let q = -6; q <= 6; q++) for (let r = -6; r <= 6; r++) { const x = (q + r / 2) * 22, y = r * 19; if (Math.hypot(x, y) < 175 && (Math.abs(r) <= 4 || Math.abs(q + r / 2) <= 2.2)) holes.push([x, y]); }
    const cols = ['#e8473c', '#2f7de1', '#36a852', '#f2c230', '#8b45c8', '#f39a1e'];
    return C(id, 'Star Jump', 'Hop your marbles across the star', ['#2a2a3e', '#18182a', '#06060e'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `<path d="M${star} Z" fill="#c89a5a" stroke="#6a4020" stroke-width="4"/>${holes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#5a3a18"/>`).join('')}`, { tilt: TILT })}
      ${holes.filter((h, i) => i % 3 === 0).slice(0, 26).map(([bx, by], i) => { const [x, y] = P(300, 190, 0, bx, by); const a = Math.atan2(by, bx); return T.marble(id, x, y - 4, 7, cols[Math.floor(((a + Math.PI) / (2 * Math.PI)) * 6) % 6]); }).join('')}
    `);
  });

  cover('codebreaker', id => {
    const rows = [['#c8232a', '#2a6ad8', '#f2c230', '#36a852'], ['#2a6ad8', '#c8232a', '#f4f0e6', '#36a852'], ['#36a852', '#2a6ad8', '#c8232a', '#f2c230']];
    const board = `<rect x="-90" y="-200" width="180" height="400" rx="14" fill="#2a1a10"/><rect x="-82" y="-192" width="164" height="384" rx="10" fill="#3a2414"/>${Array.from({ length: 10 }, (_, r) => `${[0, 1, 2, 3].map(c => r < 3 ? `<circle cx="${-56 + c * 30}" cy="${150 - r * 34}" r="11" fill="${rows[r][c]}"/><circle cx="${-59 + c * 30}" cy="${147 - r * 34}" r="3.5" fill="#fff" opacity=".5"/>` : `<circle cx="${-56 + c * 30}" cy="${150 - r * 34}" r="4" fill="#140a04"/>`).join('')}${r < 3 ? [0, 1, 2, 3].map(k => `<circle cx="${62 + (k % 2) * 10}" cy="${144 - r * 34 + Math.floor(k / 2) * 10}" r="3.4" fill="${k < [2, 3, 1][r] ? '#16151a' : '#f4f0e6'}"/>`).join('') : ''}`).join('')}<rect x="-82" y="-192" width="164" height="40" rx="8" fill="#5a3a20"/>`;
    return C(id, 'Code Breaker', 'Set a code, crack theirs', ['#6a4424', '#3a2412', '#140c04'], `
      ${T.surface(id, 'linen', { hz: 26, color: '#c0b294', lx: 300 })}
      ${T.lay(id, 270, 190, -70, board, { tilt: TILT })}
      ${[['#c8232a', 470, 300], ['#2a6ad8', 500, 320], ['#f2c230', 450, 330], ['#36a852', 520, 290]].map(([c, x, y]) => T.marble(id, x, y, 9, c)).join('')}
    `);
  });

  cover('sonar', id => {
    const g = (shipCells, hits, miss) => `<rect x="-150" y="-150" width="300" height="300" rx="6" fill="#1a3a5a"/>${Array.from({ length: 11 }, (_, i) => `<path d="M${-150 + i * 30} -150 V150 M-150 ${-150 + i * 30} H150" stroke="#5a8ab8" stroke-width="1" opacity=".6"/>`).join('')}${shipCells}${hits.map(([c, r]) => `<circle cx="${-135 + c * 30}" cy="${-135 + r * 30}" r="7" fill="#d8322a"/>`).join('')}${miss.map(([c, r]) => `<circle cx="${-135 + c * 30}" cy="${-135 + r * 30}" r="6" fill="#f4f0e6"/>`).join('')}`;
    const ship = (c, r, len, vert) => `<rect x="${-148 + c * 30}" y="${-148 + r * 30}" width="${vert ? 26 : len * 30 - 4}" height="${vert ? len * 30 - 4 : 26}" rx="13" fill="#8a929c"/><rect x="${-144 + c * 30}" y="${-144 + r * 30}" width="${vert ? 8 : len * 30 - 12}" height="${vert ? len * 30 - 12 : 8}" rx="4" fill="#c0c6ce"/>`;
    return C(id, 'Sonar', 'Hide your fleet, ping theirs', ['#12282c', '#0a181c', '#040a0c'], `
      ${T.surface(id, 'slate', { hz: 26, color: '#1a2228', lx: 300 })}
      ${T.lay(id, 300, 190, 0, g(`${ship(1, 1, 4, false)}${ship(7, 2, 3, true)}${ship(2, 6, 2, false)}${ship(5, 8, 3, false)}`, [[2, 1], [3, 1], [7, 3]], [[5, 4], [1, 4], [8, 7], [4, 2]]), { tilt: TILT, s: 1.05 })}
      ${[0, 1, 2].map(i => T.stand(id, 480 + i * 18, 320, 10, `<rect x="${476 + i * 18}" y="${292}" width="8" height="26" rx="4" fill="#d8322a"/>`)).join('')}
    `);
  });

  cover('whoswho', id => {
    const cameo = (down, c) => down ? `<rect x="-30" y="-6" width="60" height="16" rx="3" fill="#7a1a2a"/>` : `<rect x="-30" y="-74" width="60" height="80" rx="4" fill="#7a1a2a"/><ellipse cy="-34" rx="22" ry="30" fill="#f2e6cc" stroke="url(#${id}-brass)" stroke-width="3"/><g fill="${c}"><circle cy="-44" r="9"/><path d="M-16 -12 Q-16 -30 0 -30 Q16 -30 16 -12 Z"/></g>`;
    const cols = ['#3a2a1a', '#2a3a5a', '#5a2a2a', '#2a4a2a', '#4a2a4a', '#5a4a1a'];
    return C(id, 'Who’s Who', 'Ask yes-or-no, guess the face', ['#1c3a58', '#102234', '#040c14'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a2c16', lx: 300 })}
      ${[0, 1].map(r => T.stand(id, 300, 160 + r * 100, 300, `<g transform="translate(300 ${160 + r * 100}) scale(${.86 + r * .14})"><rect x="-210" y="0" width="420" height="16" rx="4" fill="#5a1220"/>${Array.from({ length: 6 }, (_, i) => `<g transform="translate(${-175 + i * 70} 4)">${cameo((i + r) % 3 === 1, cols[(i + r * 3) % 6])}</g>`).join('')}</g>`)).join('')}
    `);
  });

  cover('snakes', id => {
    let sq = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const n = r % 2 ? (7 - r) * 8 + c + 1 : (7 - r) * 8 + (7 - c) + 1; sq += `<rect x="${-160 + c * 40}" y="${-160 + r * 40}" width="40" height="40" fill="${(r + c) % 2 ? '#f2e2bc' : '#e2c890'}"/><text x="${-156 + c * 40}" y="${-148 + r * 40}" font-family="${K.UI}" font-weight="700" font-size="8" fill="#7a5a3a">${n}</text>`; }
    const ladder = (x1, y1, x2, y2) => `<g stroke="#8a5a2a" stroke-width="4"><path d="M${x1 - 8} ${y1} L${x2 - 8} ${y2} M${x1 + 8} ${y1} L${x2 + 8} ${y2}"/>${[.2, .4, .6, .8].map(t => `<path d="M${x1 - 8 + (x2 - x1) * t} ${y1 + (y2 - y1) * t} h16"/>`).join('')}</g>`;
    const snake = `<path d="M100 -130 C40 -100 120 -40 40 0 C-30 40 60 90 -20 130" stroke="#2a8a3a" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M100 -130 C40 -100 120 -40 40 0 C-30 40 60 90 -20 130" stroke="#f2c230" stroke-width="5" fill="none" stroke-dasharray="4 10"/><ellipse cx="104" cy="-132" rx="14" ry="10" fill="#2a8a3a"/><circle cx="108" cy="-136" r="2.4" fill="#fff"/>`;
    return C(id, 'Snakes & Ladders', 'Climb the ladders, dodge the snakes', ['#3a5a3a', '#203a20', '#0a140a'], `
      ${T.surface(id, 'linen', { hz: 26, color: '#b8aa8c', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `<rect x="-172" y="-172" width="344" height="344" rx="6" fill="#7a4a22"/>${sq}${ladder(-120, 140, -40, -20)}${ladder(60, 100, 120, -140)}${snake}`, { tilt: TILT })}
      ${T.pawn(id, 220, 230, .9, '#c8232a')}${T.pawn(id, 360, 180, .9, '#2a5ab8')}
      ${T.die(id, 490, 300, .6, [6, 2, 3], { rot: 14 })}
    `);
  });

  cover('ludo', id => {
    const cols = ['#c8232a', '#2a8a3a', '#f2c230', '#2a5ab8'];
    let b = `<rect x="-180" y="-180" width="360" height="360" fill="#f6f0e2"/>`;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], i) => { b += `<rect x="${sx < 0 ? -180 : 60}" y="${sy < 0 ? -180 : 60}" width="120" height="120" fill="${cols[i]}"/><rect x="${sx < 0 ? -160 : 80}" y="${sy < 0 ? -160 : 80}" width="80" height="80" rx="6" fill="#f6f0e2"/>`; });
    for (let i = 0; i < 6; i++) b += `<rect x="-20" y="${-180 + i * 20}" width="20" height="20" fill="none" stroke="#a89878"/><rect x="0" y="${-180 + i * 20}" width="20" height="20" fill="none" stroke="#a89878"/><rect x="-60" y="${-180 + i * 20}" width="20" height="20" fill="none" stroke="#a89878"/>`.repeat(1);
    b += `<path d="M-60 -60 L60 -60 L0 0 Z" fill="${cols[1]}"/><path d="M60 -60 L60 60 L0 0 Z" fill="${cols[2]}"/><path d="M60 60 L-60 60 L0 0 Z" fill="${cols[3]}"/><path d="M-60 60 L-60 -60 L0 0 Z" fill="${cols[0]}"/><rect x="-180" y="-180" width="360" height="360" fill="none" stroke="#5a3a1a" stroke-width="6"/>`;
    return C(id, 'Ludo', 'Roll a six, race all four home', ['#3a4a6a', '#1e2638', '#080c14'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a2c16', lx: 300 })}
      ${T.lay(id, 300, 190, 0, b, { tilt: TILT })}
      ${[[-120, -120, 0], [-100, -100, 0], [120, -120, 1], [120, 120, 2], [100, 100, 2], [-120, 120, 3]].map(([bx, by, c]) => { const [x, y] = P(300, 190, 0, bx, by); return T.pawn(id, x, y + 6, .7, cols[c]); }).join('')}
      ${T.die(id, 300, 200, .55, [6, 3, 1])}
    `);
  });

  cover('poprace', id => C(id, 'Pop-Up Race', 'Pop the die, chase them home', ['#6a2a4a', '#381426', '#14060e'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2a3a', lx: 300 })}
    ${T.lay(id, 300, 200, 0, `<rect x="-200" y="-200" width="400" height="400" rx="40" fill="#e8e0d0"/>${Array.from({ length: 28 }, (_, i) => { const a = i / 28 * Math.PI * 2; return `<circle cx="${(160 * Math.cos(a)).toFixed(1)}" cy="${(160 * Math.sin(a)).toFixed(1)}" r="9" fill="${['#c8232a', '#2a8a3a', '#f2c230', '#2a5ab8'][Math.floor(i / 7)]}" opacity=".85"/>`; }).join('')}<circle r="90" fill="#cfc4ae"/>`, { tilt: TILT })}
    ${T.stand(id, 300, 220, 110, `<ellipse cx="300" cy="214" rx="64" ry="20" fill="#2a2a30"/><path d="M240 210 Q240 120 300 116 Q360 120 360 210" fill="#dfeaf2" opacity=".2" stroke="#fff" stroke-opacity=".5" stroke-width="2"/><path d="M254 170 Q262 136 290 126" stroke="#fff" stroke-opacity=".7" stroke-width="6" fill="none" stroke-linecap="round"/>`)}
    ${T.die(id, 300, 180, .45, [5, 2, 3], { rot: 10 })}
    ${[[150, 150, '#c8232a'], [460, 160, '#2a5ab8'], [180, 280, '#2a8a3a'], [430, 290, '#f2c230']].map(([x, y, c]) => T.pawn(id, x, y, .6, c)).join('')}
  `));

  cover('marblerush', id => {
    const holes = Array.from({ length: 40 }, (_, i) => { const a = i / 40 * Math.PI * 2; return [170 * Math.cos(a), 170 * Math.sin(a)]; });
    const cols = ['#c8232a', '#2a8a3a', '#f2c230', '#2a5ab8', '#8b45c8', '#f39a1e'];
    return C(id, 'Marble Rush', 'Race your marbles home', ['#2a5a5a', '#163030', '#061212'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2412', lx: 300 })}
      ${T.lay(id, 300, 200, 0, `<circle r="200" fill="#a8783e"/><circle r="200" fill="none" stroke="#5a3418" stroke-width="5"/>${holes.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#4a2a10"/>`).join('')}<circle r="10" fill="#4a2a10"/>${[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * Math.PI * 2; return [1, 2, 3, 4].map(j => `<circle cx="${(Math.cos(a) * (170 - j * 28)).toFixed(1)}" cy="${(Math.sin(a) * (170 - j * 28)).toFixed(1)}" r="6" fill="#4a2a10"/>`).join(''); }).join('')}`, { tilt: TILT })}
      ${holes.filter((_, i) => i % 3 === 0).map(([bx, by], i) => { const [x, y] = P(300, 200, 0, bx, by); return T.marble(id, x, y - 3, 7, cols[i % 6]); }).join('')}
      ${T.die(id, 300, 196, .5, [6, 1, 4])}
    `);
  });

  cover('pardon', id => {
    let b = `<rect x="-200" y="-200" width="400" height="400" fill="#e6eef6"/>`;
    for (let i = 0; i < 15; i++) b += `<rect x="${-200 + i * 26.6}" y="-200" width="26.6" height="26.6" fill="#f6f8fa" stroke="#2a4a7a"/><rect x="${-200 + i * 26.6}" y="173.4" width="26.6" height="26.6" fill="#f6f8fa" stroke="#2a4a7a"/><rect x="-200" y="${-200 + i * 26.6}" width="26.6" height="26.6" fill="#f6f8fa" stroke="#2a4a7a"/><rect x="173.4" y="${-200 + i * 26.6}" width="26.6" height="26.6" fill="#f6f8fa" stroke="#2a4a7a"/>`;
    b += `<path d="M-140 -187 H-40" stroke="#c8232a" stroke-width="10" stroke-linecap="round"/><circle cx="-140" cy="-187" r="8" fill="#c8232a"/><path d="M187 -120 V-20" stroke="#2a8a3a" stroke-width="10" stroke-linecap="round"/><circle cx="-110" cy="-110" r="34" fill="none" stroke="#c8232a" stroke-width="3"/>${T.word('START', -110, -106, 12, { font: K.UI, weight: 900, fill: '#c8232a' })}<rect x="-70" y="-40" width="140" height="80" rx="10" fill="#2a4a7a"/>${T.word('PARDON', 0, -4, 20, { weight: 700, fill: '#fff', ls: 3 })}${T.word('ME!', 0, 22, 20, { weight: 700, fill: '#f2c230', ls: 3 })}`;
    return C(id, 'Pardon Me!', 'Slide, swap, bump them home', ['#2a4a7a', '#14243e', '#060a14'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a2c16', lx: 300 })}
      ${T.lay(id, 300, 196, 0, b, { tilt: TILT })}
      ${[[-110, -110, '#c8232a'], [-90, -90, '#c8232a'], [187, -60, '#2a8a3a'], [-40, 187, '#f2c230'], [187, 120, '#2a5ab8']].map(([bx, by, c]) => { const [x, y] = P(300, 196, 0, bx, by); return T.pawn(id, x, y + 4, .7, c); }).join('')}
    `);
  });

  cover('orchard', id => {
    const tree = (c) => `<circle r="44" fill="#3a7a2a"/><circle cx="-14" cy="-10" r="26" fill="#4a8a3a"/>${[[-20, -16], [14, -24], [22, 10], [-10, 18], [0, -2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}"/>`).join('')}`;
    return C(id, 'Orchard', 'Pick the fruit, beat the crow', ['#4a7a3a', '#263e1e', '#0a1408'], `
      ${T.surface(id, 'linen', { hz: 26, color: '#c8bc9c', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `<rect x="-200" y="-160" width="400" height="320" rx="10" fill="#8ab858"/><rect x="-200" y="-160" width="400" height="320" rx="10" fill="none" stroke="#5a7a2a" stroke-width="5"/>${[[-100, -70, '#c8232a'], [100, -70, '#f2c230'], [-100, 70, '#2a8a3a'], [100, 70, '#6a3a9a']].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${tree(c)}</g>`).join('')}<path d="M-60 0 H60" stroke="#c8a060" stroke-width="18" stroke-linecap="round"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${-55 + i * 20}" y="-9" width="18" height="18" fill="${i < 3 ? '#f4f0e6' : '#d8c8a0'}" stroke="#8a6a3a"/>`).join('')}`, { tilt: TILT })}
      ${T.stand(id, 470, 320, 50, `<g transform="translate(470 300)"><path d="M-36 -10 h72 l-10 34 h-52 Z" fill="#c88a4a"/><path d="M-30 -10 Q0 -44 30 -10" stroke="#8a5a2a" stroke-width="5" fill="none"/>${[[-14, -16, '#c8232a'], [6, -18, '#f2c230'], [-2, -10, '#6a3a9a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`).join('')}</g>`)}
      ${T.die(id, 140, 300, .55, [5, 2, 3], { rot: -8 })}
    `);
  });

  cover('sweettrail', id => {
    const path = 'M-180 120 C-100 40 -40 140 20 60 C80 -20 -60 -80 20 -120 C100 -150 140 -60 180 -120';
    return C(id, 'Sweet Trail', 'Draw a colour, hop along', ['#7a4a8a', '#3e2648', '#140a18'], `
      ${T.surface(id, 'linen', { hz: 26, color: '#d8c8b0', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `<rect x="-210" y="-170" width="420" height="340" rx="12" fill="#bfe0a0"/><path d="${path}" stroke="#fbf6ea" stroke-width="36" fill="none" stroke-linecap="round"/><path d="${path}" stroke="url(#${id}-trail)" stroke-width="30" fill="none" stroke-dasharray="20 4" stroke-linecap="butt"/><defs><linearGradient id="${id}-trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8473c"/><stop offset=".2" stop-color="#f39a1e"/><stop offset=".4" stop-color="#f2cf2a"/><stop offset=".6" stop-color="#36a852"/><stop offset=".8" stop-color="#2f7de1"/><stop offset="1" stop-color="#8b45c8"/></linearGradient></defs>${[[-150, -90, '#e88ad8'], [130, 80, '#e8473c'], [-60, 110, '#f2c230']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="22" fill="${c}"/><circle cx="${x}" cy="${y}" r="14" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="10 6"/>`).join('')}`, { tilt: TILT })}
      ${T.pawn(id, 280, 180, .8, '#e88ad8')}${T.pawn(id, 330, 210, .8, '#2a8ad8')}
      ${[0, 1, 2].map(i => T.lay(id, 470 + i * 14, 320 - i * 4, 10 + i * 6, `<rect x="-28" y="-40" width="56" height="80" rx="6" fill="#fbf8f0"/><rect x="-18" y="-24" width="36" height="${i === 2 ? 20 : 36}" rx="4" fill="${['#2f7de1', '#36a852', '#e8473c'][i]}"/>${i === 2 ? '<rect x="-18" y="2" width="36" height="20" rx="4" fill="#e8473c"/>' : ''}`)).join('')}
    `);
  });

  cover('bingo', id => {
    const nums = [[5, 18, 33, 47, 62], [11, 22, 0, 52, 70], [2, 29, 41, 58, 66], [14, 16, 38, 49, 74], [9, 25, 44, 55, 61]];
    const daub = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 3], [2, 4]];
    const cardS = T.sheet(id, 250, 290, `<rect x="-125" y="-145" width="250" height="44" fill="#8a1a2a"/>${'BINGO'.split('').map((ch, i) => T.word(ch, -96 + i * 48, -112, 28, { weight: 700, fill: '#fbf3dc' })).join('')}${nums.map((row, r) => row.map((n, c) => `<rect x="${-120 + c * 48}" y="${-96 + r * 48}" width="46" height="46" fill="none" stroke="#c8b898"/>${T.word(n ? String(n) : '★', -97 + c * 48, -64 + r * 48, 18, { weight: 700, fill: '#2a2018' })}${daub.some(([a, b]) => a === r && b === c) || !n ? `<circle cx="${-97 + c * 48}" cy="${-72 + r * 48}" r="17" fill="#c8232a" opacity=".55"/>` : ''}`).join('')).join('')}`, { fill: '#f6efd8' });
    return C(id, 'Bingo', 'The table calls, your phone is your card', ['#2a3a6a', '#16203a', '#080c16'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a2c16', lx: 300 })}
      ${T.lay(id, 270, 190, -6, cardS, { tilt: .66 })}
      ${[[440, 140, 'B', 5, '#2a5ab8'], [480, 190, 'O', 70, '#c8232a'], [430, 230, 'G', 52, '#2a8a3a']].map(([x, y, l, n, c]) => T.lay(id, x, y, 0, `<circle r="26" fill="${c}"/><circle r="16" fill="#fbf8f0"/>${T.word(`${l}${n}`, 0, 5, 11, { font: K.UI, weight: 900 })}<ellipse cx="-9" cy="-12" rx="8" ry="4" fill="#fff" opacity=".5"/>`, { tilt: 1 })).join('')}
      ${T.stand(id, 140, 290, 40, `<g transform="translate(140 220)"><rect x="-18" y="-70" width="36" height="80" rx="10" fill="#c8232a"/><rect x="-18" y="-70" width="10" height="80" rx="5" fill="#fff" opacity=".2"/><rect x="-14" y="10" width="28" height="30" rx="6" fill="#8a1a2a"/></g>`)}
    `);
  });
}
