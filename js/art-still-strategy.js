// Still-life covers: the bigger original games — strategy, hidden roles and the house party games.
export default function paint(K) {
  const { cover, shell, T } = K;
  const C = (id, title, tag, bg, body, z = 1.2) => shell(id, { title, tag, bg }, `${T.defs(id)}${T.zoom(body, z)}`);
  const shade = K.shade;
  const TILT = .6;
  const card = (id, x, y, r, rank, s, w = 100, o = {}) => T.lay(id, x, y, r, T.pcard(id, rank, s, w), o);
  // A generic game card: coloured art panel, a title, rules lines.
  const gcard = (id, title, c, art = '', o = {}) => { const w = o.w || 100, h = w * 1.4; return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w * .07}" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="${-w / 2 + w * .07}" y="${-h / 2 + w * .07}" width="${w * .86}" height="${h * .5}" rx="${w * .04}" fill="${c}"/><g transform="translate(0 ${-h / 2 + w * .07 + h * .25})">${art}</g>${T.word(title, 0, h * .14, w * (title.length > 9 ? .11 : .14), { weight: 700, fill: '#2a2018' })}${T.lines(-w * .34, h * .24, w * .68, 3, w * .08, '#8a7a5a', { weight: 1.6, ragged: true, op: .45 })}`; };
  const gear = (r, n, c) => { const teeth = Array.from({ length: n }, (_, i) => `<rect x="${-r * .12}" y="${-r - r * .16}" width="${r * .24}" height="${r * .3}" rx="2" fill="${c}" transform="rotate(${i * 360 / n})"/>`).join(''); return `${teeth}<circle r="${r}" fill="${c}"/><circle r="${r * .72}" fill="${shade(c, -.2)}"/><circle r="${r * .72}" fill="none" stroke="${shade(c, .3)}" stroke-width="1.5"/>${[0, 1, 2, 3, 4].map(i => `<path d="M0 0 L0 ${-r * .6}" stroke="${c}" stroke-width="${r * .16}" transform="rotate(${i * 72})"/>`).join('')}<circle r="${r * .22}" fill="${c}"/><circle r="${r * .1}" fill="#1a1410"/>`; };
  const house = (c, s = 1) => `<g transform="scale(${s})"><path d="M-14 0 V-18 L0 -30 L14 -18 V0 Z" fill="${c}"/><path d="M0 -30 L14 -18 V0 H4 V-20 Z" fill="${shade(c, -.3)}"/></g>`;
  const pad = (id, rows, o = {}) => T.notepad(id, o.w || 150, o.h || 190, rows.map((r, i) => T.hand(r, o.x ?? -44, -62 + i * 16 + 8, 15, '#2a2a5a', { anchor: 'start' })).join(''));

  cover('homestead', id => {
    const R = 44, hex = (c) => `<path d="${Array.from({ length: 6 }, (_, i) => `${i ? 'L' : 'M'}${(R * Math.cos(i * Math.PI / 3 + Math.PI / 6)).toFixed(1)} ${(R * Math.sin(i * Math.PI / 3 + Math.PI / 6)).toFixed(1)}`).join(' ')} Z" fill="${c}" stroke="#f0e2c0" stroke-width="3"/>`;
    const terr = ['#d8b44a', '#2e6a2e', '#b8603a', '#8a8a92', '#8ab84a', '#d8c08a', '#2e6a2e', '#d8b44a', '#8ab84a', '#b8603a', '#8a8a92', '#2e6a2e', '#d8b44a', '#8ab84a', '#b8603a', '#2e6a2e', '#8a8a92', '#d8b44a', '#8ab84a'];
    const cells = [[0, -2], [1, -2], [2, -2], [-1, -1], [0, -1], [1, -1], [2, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [-2, 2], [-1, 2], [0, 2]];
    const nums = [10, 2, 9, 12, 6, 4, 10, 9, 11, 0, 3, 8, 8, 3, 4, 5, 5, 6, 11];
    const board = `<path d="${Array.from({ length: 6 }, (_, i) => `${i ? 'L' : 'M'}${(250 * Math.cos(i * Math.PI / 3)).toFixed(1)} ${(250 * Math.sin(i * Math.PI / 3)).toFixed(1)}`).join(' ')} Z" fill="#3a6a9a"/>${cells.map(([q, r], i) => { const x = (q + r / 2) * R * 1.75, y = r * R * 1.52; return `<g transform="translate(${x} ${y})">${hex(terr[i])}${nums[i] ? `<circle r="13" fill="#f4eee0"/>${T.word(String(nums[i]), 0, 5, 13, { weight: 700, fill: nums[i] === 6 || nums[i] === 8 ? '#a8242a' : '#2a2018' })}` : ''}</g>`; }).join('')}`;
    return C(id, 'Homestead', 'Settle the island, trade, build', ['#16303a', '#0e1e26', '#040c10'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a2c16', lx: 300 })}
      ${T.lay(id, 300, 190, 0, board, { tilt: TILT, s: .85 })}
      ${[[250, 150, '#c8232a'], [350, 200, '#2a5ab8'], [300, 230, '#f4eee0']].map(([x, y, c]) => T.stand(id, x, y, 20, `<g transform="translate(${x} ${y})">${house(c, 1.1)}</g>`)).join('')}
      ${T.fan(id, 110, 340, [0, 1, 2].map(() => 'back'), { w: 70, step: 12, backColor: '#2e6a2e', blur: 2 })}
    `, 1.02);
  });

  cover('warfront', id => {
    const map = `<rect x="-220" y="-150" width="440" height="300" fill="#2a5a7a"/><rect x="-220" y="-150" width="440" height="300" fill="url(#${id}-sea)"/><defs><radialGradient id="${id}-sea"><stop offset="0" stop-color="#3a7aa0"/><stop offset="1" stop-color="#1a3a5a"/></radialGradient></defs>${[['M-180 -100 Q-120 -140 -60 -110 Q-30 -60 -90 -30 Q-160 -20 -180 -100 Z', '#c8a85a'], ['M-20 -120 Q60 -150 120 -100 Q150 -40 80 -20 Q0 -10 -20 -60 Z', '#8ab05a'], ['M-160 30 Q-90 10 -40 50 Q-40 120 -120 120 Q-190 100 -160 30 Z', '#b88a5a'], ['M20 30 Q100 0 170 40 Q190 110 110 130 Q30 120 20 30 Z', '#a8a05a']].map(([d, c]) => `<path d="${d}" fill="${c}" stroke="#f4eee0" stroke-width="2"/>`).join('')}<path d="M-60 -70 L20 -70 M-90 40 L40 60" stroke="#f4eee0" stroke-width="2" stroke-dasharray="5 5"/>`;
    const army = (c) => `<rect x="-9" y="-9" width="18" height="18" rx="2" fill="${c}"/><rect x="-9" y="-9" width="18" height="5" fill="#fff" opacity=".2"/>`;
    return C(id, 'Warfront', 'Conquer the islands', ['#162637', '#0c1622', '#04080c'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 300, 180, 0, map, { tilt: TILT })}
      ${[[200, 140, '#a8242a'], [214, 146, '#a8242a'], [206, 130, '#a8242a'], [360, 140, '#2a4a8a'], [374, 146, '#2a4a8a'], [230, 220, '#a8242a'], [390, 226, '#e8c84a']].map(([x, y, c]) => T.stand(id, x, y, 14, `<g transform="translate(${x} ${y - 9})">${army(c)}</g>`)).join('')}
      ${T.die(id, 470, 300, .55, [6, 2, 3], { rot: 10, fill: '#c8303a', pip: '#fff' })}${T.die(id, 530, 310, .55, [5, 4, 1], { rot: -10, fill: '#2a4a8a', pip: '#fff' })}
    `);
  });

  cover('ironroutes', id => {
    const map = `<rect x="-230" y="-150" width="460" height="300" fill="#e8dcbc"/>${[[-180, -90], [-60, -110], [60, -70], [180, -100], [-120, 40], [20, 30], [160, 60], [-40, 110]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#a8242a" stroke="#f4eee0" stroke-width="2"/>`).join('')}${[[-180, -90, -60, -110, '#2a5ab8'], [-60, -110, 60, -70, '#c8a02a'], [60, -70, 180, -100, '#2a8a3a'], [-120, 40, 20, 30, '#a8242a'], [20, 30, 160, 60, '#7a3ab0'], [-60, -110, -120, 40, '#3a3a3a'], [60, -70, 20, 30, '#e87a2a'], [20, 30, -40, 110, '#2a5ab8']].map(([a, b, c, d, col]) => { const n = Math.round(Math.hypot(c - a, d - b) / 26); return Array.from({ length: n }, (_, i) => { const t = (i + .5) / n, x = a + (c - a) * t, y = b + (d - b) * t, ang = Math.atan2(d - b, c - a) * 180 / Math.PI; return `<rect x="${x - 10}" y="${y - 5}" width="20" height="10" rx="2" fill="${col}" opacity=".35" stroke="${col}" transform="rotate(${ang} ${x} ${y})"/>`; }).join(''); }).join('')}`;
    const car = (c) => `<rect x="-12" y="-6" width="24" height="12" rx="3" fill="${c}"/><rect x="-12" y="-6" width="24" height="4" rx="2" fill="#fff" opacity=".25"/>`;
    return C(id, 'Iron Routes', 'Build rail lines across the land', ['#1d2f26', '#121e18', '#060a08'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 300, 180, 0, map, { tilt: TILT })}
      ${[[-170, -94], [-148, -98], [-126, -102], [-104, -106]].map(([bx, by]) => { const a = 0, x = 300 + bx, y = 180 + by * TILT; return T.lay(id, x, y, -10, car('#2a5ab8'), { thin: true }); }).join('')}
      ${T.fan(id, 480, 330, ['back', 'back', 'back', 'back'], { w: 70, step: 12, backColor: '#2a5a3a' })}
      ${T.stand(id, 140, 320, 30, `<g transform="translate(140 300) scale(1.4)">${car('#a8242a')}</g>`)}
    `);
  });

  cover('skyline', id => {
    const deed = (name, c) => `<rect x="-55" y="-75" width="110" height="150" rx="4" fill="#fbf8f0" stroke="rgba(0,0,0,.2)"/><rect x="-48" y="-68" width="96" height="34" fill="${c}"/>${T.word('TITLE DEED', 0, -55, 8, { font: K.UI, weight: 800, ls: 1.5, fill: '#fff' })}${T.word(name, 0, -40, 12, { weight: 700, fill: '#fff' })}${T.lines(-40, -12, 80, 6, 12, '#6a5a44', { weight: 1.4, op: .45 })}`;
    const tower = (c, h) => `<path d="M-12 0 V${-h} L0 ${-h - 10} L12 ${-h} V0 Z" fill="${c}"/><path d="M0 ${-h - 10} L12 ${-h} V0 H0 Z" fill="${shade(c, -.3)}"/>`;
    return C(id, 'Skyline', 'Buy the city, raise towers', ['#1b2740', '#101828', '#04080e'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#2a3a2a', lx: 300 })}
      ${T.lay(id, 190, 190, -10, deed('Park Lane', '#2a3a8a'))}${T.lay(id, 300, 180, 2, deed('Bond Street', '#2a7a3a'))}${T.lay(id, 410, 192, 12, deed('The Strand', '#a8242a'))}
      ${[[230, 260, '#2a7a3a', 30], [260, 266, '#2a7a3a', 30], [370, 260, '#a8242a', 52]].map(([x, y, c, h]) => T.stand(id, x, y, 22, `<g transform="translate(${x} ${y})">${tower(c, h)}</g>`)).join('')}
      ${T.lay(id, 120, 320, -14, T.note(150, '#2a5a3a', '500'))}${T.lay(id, 140, 300, 8, T.note(150, '#6a3a1a', '100'))}
    `);
  });

  cover('tessera', id => {
    const tile = (pts, c, gem) => `<path d="${pts}" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="2"/>${gem ? `<path d="M${gem[0]} ${gem[1] - 9} L${gem[0] + 8} ${gem[1]} L${gem[0]} ${gem[1] + 9} L${gem[0] - 8} ${gem[1]} Z" fill="${gem[2]}" stroke="#fff" stroke-width="1"/>` : ''}`;
    return C(id, 'Tessera', 'Join the shapes, cover the gems', ['#2c2a33', '#1c1a22', '#08080c'], `
      ${T.surface(id, 'marble', { hz: 26, color: '#d8d2c6', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `<rect x="-180" y="-150" width="360" height="300" rx="8" fill="#2a2a34"/>${tile('M-160 -130 H-40 V-50 H-100 V10 H-160 Z', '#c8a24a', [-130, -100, '#e83a5a'])}${tile('M-30 -130 H100 V-70 H-30 Z', '#3a7ab8')}${tile('M110 -130 H160 V40 H110 Z', '#3a9a6a', [135, -40, '#3ae0e0'])}${tile('M-90 -40 H40 V20 H-90 Z', '#b8583a')}${tile('M50 -60 H100 V130 H50 Z', '#6a4ab8', [75, 60, '#ffd36a'])}${tile('M-160 20 H40 V130 H-160 Z', '#c8a24a', [-60, 75, '#e83a5a'])}`, { tilt: TILT })}
      ${T.lay(id, 480, 320, 20, tile('M-30 -40 H30 V40 H-30 Z', '#3a9a6a', [0, 0, '#ffd36a']), { thin: true })}
    `);
  });

  cover('gearworks', id => C(id, 'Gearworks', 'Pick actions at once, build robots', ['#2b3238', '#1a1e22', '#08090a'], `
    ${T.surface(id, 'slate', { hz: 26, color: '#2a2e32', lx: 300 })}
    ${T.lay(id, 240, 180, 10, gear(70, 14, '#b8893a'), { tilt: .66 })}${T.lay(id, 360, 160, -6, gear(46, 10, '#a8aeb8'), { tilt: .66 })}${T.lay(id, 330, 250, 0, gear(34, 8, '#8a6a2a'), { tilt: .66 })}
    ${T.lay(id, 470, 300, 12, gcard(id, 'BUILD', '#2a4a6a', `<rect x="-18" y="-20" width="36" height="34" rx="6" fill="#c8ccd2"/><circle cx="-8" cy="-6" r="5" fill="#2a8ad8"/><circle cx="8" cy="-6" r="5" fill="#2a8ad8"/><rect x="-10" y="6" width="20" height="4" fill="#3a3a44"/>`, { w: 90 }))}
    ${T.lay(id, 120, 310, -14, gcard(id, 'SCAVENGE', '#6a3a2a', '', { w: 90 }), { blur: 2 })}
  `));

  cover('spires', id => C(id, 'Seven Spires', 'Draw, build your spire, win the wars', ['#26304a', '#161c2c', '#060810'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.stand(id, 300, 270, 90, `<g transform="translate(300 270)"><path d="M-46 0 L-36 -60 L-24 -64 L-18 -140 L-8 -146 L0 -200 L8 -146 L18 -140 L24 -64 L36 -60 L46 0 Z" fill="#c8b89a"/><path d="M0 -200 L8 -146 L18 -140 L24 -64 L36 -60 L46 0 H0 Z" fill="#9a8a6a"/>${[-40, -90, -130].map(y => `<path d="M-30 ${y} H30" stroke="#7a6a4a" stroke-width="2"/>`).join('')}<rect x="-6" y="-120" width="12" height="20" rx="6" fill="#ffd36a"/></g>`)}
    ${['#a8242a', '#2a5ab8', '#2a8a3a'].map((c, i) => T.lay(id, 150 + i * 30, 240 + i * 8, -12 + i * 6, gcard(id, ['BARRACKS', 'LIBRARY', 'FORUM'][i], c, '', { w: 84 }))).join('')}
    ${[[430, 250], [454, 262], [440, 274]].map(([x, y]) => T.lay(id, x, y, 0, T.coinTop(id, 18, { mark: '3' }), { thin: true })).join('')}
  `));

  cover('redline', id => {
    const speed = (n, c) => `<rect x="-38" y="-54" width="76" height="108" rx="7" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-32" y="-48" width="64" height="96" rx="4" fill="${c}"/>${T.word(String(n), 0, 16, 48, { weight: 700, fill: '#fff' })}`;
    return C(id, 'Redline', 'Speed cards and engine heat', ['#2a1d1f', '#1a1214', '#080506'], `
      ${T.surface(id, 'slate', { hz: 26, color: '#2a2a2e', lx: 300 })}
      ${T.lay(id, 300, 170, 0, `<rect x="-260" y="-40" width="520" height="80" fill="#3a3a3e"/><path d="M-260 -40 H260 M-260 40 H260" stroke="#f4eee0" stroke-width="3"/>${Array.from({ length: 13 }, (_, i) => `<path d="M${-240 + i * 40} -40 V40" stroke="#5a5a60" stroke-width="1.5"/>`).join('')}${Array.from({ length: 8 }, (_, i) => `<rect x="${200 + (i % 2) * 10}" y="${-40 + i * 10}" width="10" height="10" fill="${i % 2 ? '#fff' : '#1d1b1a'}"/>`).join('')}`, { tilt: TILT })}
      ${T.stand(id, 250, 180, 50, T.strip(K.car(id, 250, 160, .35, '#a8242a')))}${T.stand(id, 340, 200, 50, T.strip(K.car(id, 340, 180, .35, '#2a5ab8')))}
      ${T.lay(id, 190, 300, -8, speed(5, '#2a6a3a'))}${T.lay(id, 270, 300, 4, speed(9, '#2a6a3a'))}${T.lay(id, 380, 306, 10, speed('H', '#a8242a'))}
    `);
  });

  cover('grandprix', id => C(id, 'Grand Prix Dice', 'Shift gears, roll, brake', ['#233a26', '#142218', '#060c08'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#2a4a2a', lx: 300 })}
    ${T.lay(id, 300, 160, 0, `<path d="M-260 60 Q-100 60 -40 0 Q20 -60 160 -60 L260 -60 V40 L160 40 Q60 40 0 100 Q-60 160 -260 160 Z" fill="#3a3a3e"/><path d="M-260 110 Q-60 110 0 50 Q60 -10 260 -10" stroke="#f4eee0" stroke-width="2" stroke-dasharray="14 10" fill="none"/><path d="M-60 40 L-30 80" stroke="#a8242a" stroke-width="10"/><path d="M-60 40 L-30 80" stroke="#fff" stroke-width="10" stroke-dasharray="6 6"/>`, { tilt: TILT })}
    ${T.stand(id, 280, 180, 50, T.strip(K.car(id, 280, 160, .4, '#a8242a')))}
    ${T.die(id, 200, 270, .6, [6, 3, 2], { rot: -10, fill: '#2a2a30', pip: '#f4eee0' })}${T.die(id, 290, 286, .6, [4, 1, 5], { rot: 10, fill: '#c8a02a', pip: '#1d1b1a' })}
    ${T.lay(id, 450, 290, 8, `<rect x="-50" y="-50" width="100" height="100" rx="8" fill="#fbf8f0"/>${[1, 2, 3, 4, 5].map(g => `<rect x="${-40 + (g - 1) * 18}" y="${30 - g * 12}" width="14" height="${g * 12}" fill="${g === 3 ? '#a8242a' : '#8a8a92'}"/>`).join('')}${T.word('GEAR', 0, -32, 11, { font: K.UI, weight: 900, ls: 2 })}`)}
  `));

  cover('bannerraid', id => {
    const block = (rank, c) => `<g><path d="M-22 0 V-46 L22 -46 V0 Z" fill="${c}"/><path d="M22 -46 L32 -52 V-6 L22 0 Z" fill="${shade(c, -.35)}"/><path d="M-22 -46 L-12 -52 H32 L22 -46 Z" fill="${shade(c, .2)}"/>${rank ? T.word(rank, 0, -16, 20, { weight: 700, fill: '#f4eee0' }) : ''}</g>`;
    return C(id, 'Banner Raid', 'Hidden ranks, bold attacks', ['#2a2a20', '#1a1a14', '#080806'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2a14', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `${T.board(10, 32, '#8ab05a', '#7aa04a', { frame: '#3a2a10', line: '#5a7a3a' })}<rect x="-64" y="-16" width="40" height="32" fill="#3a7aa0"/><rect x="24" y="-16" width="40" height="32" fill="#3a7aa0"/>`, { tilt: TILT })}
      ${[[190, 150, '#a8242a', ''], [230, 150, '#a8242a', ''], [270, 140, '#a8242a', ''], [360, 230, '#2a4a8a', '9'], [400, 230, '#2a4a8a', '3'], [440, 240, '#2a4a8a', 'S']].map(([x, y, c, r]) => T.stand(id, x, y, 30, `<g transform="translate(${x} ${y})">${block(r, c)}</g>`)).join('')}
      ${T.stand(id, 320, 280, 40, `<g transform="translate(320 280)">${block('', '#2a4a8a')}<path d="M0 -52 V-120" stroke="#3a2410" stroke-width="3"/><path d="M0 -120 Q20 -126 40 -114 Q20 -102 0 -106 Z" fill="#c8a02a"/></g>`)}
    `);
  });

  cover('nestegg', id => C(id, 'Nest Egg', 'Pair up valuables, steal the top set', ['#1f3a2b', '#12241a', '#060c08'], `
    ${T.surface(id, 'leather', { hz: 26, color: '#22402e', lx: 300 })}
    ${T.stand(id, 300, 220, 120, `<g transform="translate(300 220)">${Array.from({ length: 40 }, (_, i) => `<path d="M${-90 + (i * 23) % 180} ${(i % 4) * 5 - 10} q${30 + (i % 3) * 10} -${8 + (i % 5) * 3} ${60 + (i % 4) * 8} 0" stroke="${i % 2 ? '#8a6a3a' : '#6a4a22'}" stroke-width="3" fill="none"/>`).join('')}<ellipse cy="-36" rx="38" ry="48" fill="url(#${id}-brass)"/><ellipse cx="-12" cy="-58" rx="10" ry="16" fill="#fff" opacity=".45"/></g>`)}
    ${T.lay(id, 140, 220, -14, gcard(id, 'PEARLS', '#2a4a6a', `<g fill="#f4eee0">${[-14, 0, 14].map(x => `<circle cx="${x}" cy="0" r="7"/>`).join('')}</g>`, { w: 90 }))}${T.lay(id, 470, 230, 14, gcard(id, 'PORTRAIT', '#5a2a1a', `<rect x="-16" y="-20" width="32" height="40" fill="none" stroke="#e8c87a" stroke-width="4"/>`, { w: 90 }))}
  `));

  cover('houserules', id => {
    const rule = (t1, t2, c) => `<rect x="-55" y="-77" width="110" height="154" rx="7" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-48" y="-70" width="96" height="26" rx="3" fill="${c}"/>${T.word('NEW RULE', 0, -52, 11, { font: K.UI, weight: 900, ls: 2, fill: '#fff' })}${T.word(t1, 0, -14, 15, { weight: 700 })}${T.word(t2, 0, 6, 15, { weight: 700 })}${T.lines(-36, 30, 72, 3, 10, '#8a7a5a', { weight: 1.4, op: .4 })}`;
    return C(id, 'House Rules', 'The rules keep changing', ['#5a3a1e', '#3a2a1e', '#100a04'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a2c16', lx: 300 })}
      ${T.lay(id, 200, 190, -12, rule('Draw 3,', 'Play 2', '#2a6a3a'))}${T.lay(id, 300, 176, 0, rule('Hand', 'Limit 2', '#a8242a'))}${T.lay(id, 400, 192, 12, rule('Play', 'All', '#2a4a8a'))}
      ${T.lay(id, 300, 320, 4, rule('Goal:', 'Bread & Toast', '#c8a02a'), { blur: 4 })}
    `);
  });

  cover('deepspace', id => {
    const sc = (t, c) => `<rect x="-52" y="-74" width="104" height="148" rx="7" fill="#14182a" stroke="#3a4a6a"/>${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 37) % 90 - 45}" cy="${(i * 53) % 130 - 65}" r=".9" fill="#fff" opacity=".8"/>`).join('')}<circle cy="-20" r="24" fill="${c}"/><ellipse cy="-20" rx="38" ry="8" fill="none" stroke="#e8c87a" stroke-width="2"/>${T.word(t, 0, 44, 13, { weight: 700, fill: '#e8dcc0' })}`;
    return C(id, 'House Rules: Deep Space', 'Shifting rules among the stars', ['#18203a', '#0c101e', '#04060c'], `
      ${T.surface(id, 'slate', { hz: 26, color: '#161a24', lx: 300 })}
      ${T.lay(id, 210, 186, -10, sc('NEBULA', '#7a3ab0'))}${T.lay(id, 300, 176, 2, sc('CREEPER', '#3a8a3a'))}${T.lay(id, 390, 188, 12, sc('WARP', '#2a6ab8'))}
      ${T.marble(id, 480, 300, 22, '#2a5ab8')}${T.marble(id, 140, 310, 14, '#c86a3a')}
    `);
  });

  cover('pileup', id => {
    const pc = (t, c) => `<rect x="-50" y="-70" width="100" height="140" rx="8" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-43" y="-63" width="86" height="126" rx="5" fill="none" stroke="${c}" stroke-width="2"/><circle r="32" fill="${c}"/>${T.word(t, 0, 12, 32, { weight: 700, fill: '#f4eee0' })}`;
    return C(id, 'Pile Up', 'Stack the draws, no mercy', ['#2b2f38', '#1a1d22', '#08090c'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#2a2a3a', lx: 300 })}
      ${['+2', '+2', '+4', '+2', '+4'].map((t, i) => T.lay(id, 300 + ((i * 17) % 30 - 15), 190 - i * 3, (i * 41) % 60 - 30, pc(t, ['#2a5ab8', '#2a8a3a', '#a8242a', '#c8902a', '#6a3ab0'][i]))).join('')}
      ${T.fan(id, 120, 330, ['back', 'back', 'back', 'back', 'back'], { w: 70, step: 8, backColor: '#2a2a3a', blur: 2 })}
    `);
  });

  cover('luckystreak', id => C(id, 'Lucky Streak', 'Flip, push your luck, never pair', ['#1b3a2c', '#10241a', '#040c08'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#1b4a32', lx: 300 })}
    ${['3', '8', '1', '5', '8'].map((n, i) => T.lay(id, 160 + i * 72, 190, (i - 2) * 3, `<rect x="-32" y="-46" width="64" height="92" rx="7" fill="url(#${id}-paper)" stroke="${i === 4 ? '#a8242a' : 'rgba(0,0,0,.2)'}" stroke-width="${i === 4 ? 3 : 1}"/>${T.word(n, 0, 14, 40, { weight: 700, fill: i === 4 || i === 1 ? '#a8242a' : '#2a4a3a' })}`)).join('')}
    ${T.lay(id, 300, 320, 0, `${[0, 1, 2, 3, 4, 5, 6].map(i => `<g transform="translate(${-60 + i * 20} 0) rotate(${i * 20})">${T.coinTop(id, 16, { mark: '' })}</g>`).join('')}`, { thin: true })}
  `));

  cover('unicorns', id => {
    const uni = `<path d="M-14 26 Q-20 0 -8 -10 Q-14 -24 -2 -32 L4 -34 Q14 -30 22 -22 L30 -14 Q34 -8 28 -6 L18 -10 Q16 6 22 22 Z" fill="#e8c87a"/><path d="M4 -34 L0 -56 L10 -36 Z" fill="#fff3c8"/>`;
    const uc = (name, c) => `<rect x="-55" y="-77" width="110" height="154" rx="7" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-48" y="-70" width="96" height="88" rx="4" fill="${c}"/><g transform="translate(0 -26) scale(1.3)">${uni}</g>${T.word(name, 0, 42, 13, { weight: 700 })}${T.lines(-34, 56, 68, 2, 8, '#8a7a5a', { weight: 1.2, op: .4 })}`;
    return C(id, 'Unicorn Chaos', 'Build a stable of seven', ['#6a3a7a', '#381e40', '#140a16'], `
      ${T.surface(id, 'leather', { hz: 26, color: '#3a1e44', lx: 300 })}
      ${T.lay(id, 200, 190, -12, uc('Baby Unicorn', '#3a6ab8'))}${T.lay(id, 300, 176, 0, uc('Ginger Unicorn', '#a83a7a'))}${T.lay(id, 400, 192, 12, uc('Neigh!', '#2a2a3a'))}
      ${T.fan(id, 300, 340, ['back', 'back', 'back'], { w: 76, step: 12, backColor: '#3a1e44', blur: 4 })}
    `);
  });

  cover('roadrally', id => {
    const mc = (n, c) => `<rect x="-42" y="-60" width="84" height="120" rx="7" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-36" y="-54" width="72" height="108" rx="4" fill="${c}"/>${T.word(n, 0, 6, n.length > 3 ? 18 : 30, { weight: 700, fill: '#fff' })}${T.word('MILES', 0, 30, 10, { font: K.UI, weight: 900, ls: 2, fill: '#fff' })}`;
    return C(id, 'Road Rally', 'Drive a thousand miles', ['#5a6a3a', '#2e381e', '#0e1408'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a2c16', lx: 300 })}
      ${T.lay(id, 170, 200, -10, mc('25', '#2a8a3a'))}${T.lay(id, 250, 190, -2, mc('50', '#2a6ab8'))}${T.lay(id, 330, 192, 6, mc('100', '#c8902a'))}${T.lay(id, 410, 200, 14, mc('STOP', '#a8242a'))}
      ${T.stand(id, 300, 320, 100, T.strip(K.car(id, 300, 300, .6, '#a8242a')))}
    `);
  });

  cover('dealmaker', id => {
    const prop = (c, name) => `<rect x="-45" y="-64" width="90" height="128" rx="6" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-38" y="-57" width="76" height="30" fill="${c}"/>${T.word(name, 0, -37, 11, { weight: 700, fill: '#fff' })}${T.lines(-30, -8, 60, 4, 12, '#6a5a44', { weight: 1.3, op: .45 })}`;
    const money = (n, c) => `<rect x="-45" y="-64" width="90" height="128" rx="6" fill="${c}"/><circle r="30" fill="#fbf8f0" opacity=".9"/>${T.word(`${n}M`, 0, 8, 22, { weight: 700, fill: c })}`;
    return C(id, 'Deal Maker', 'Charge rent, steal deals', ['#2a6a5a', '#163a30', '#061410'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#1d4a3c', lx: 300 })}
      ${['Park', 'Mayfair'].map((n, i) => T.lay(id, 170 + i * 26, 170 + i * 10, -8 + i * 4, prop('#2a3a8a', n))).join('')}${['Rose St', 'Oak Ave', 'Elm Row'].map((n, i) => T.lay(id, 340 + i * 26, 170 + i * 10, 4 + i * 4, prop('#c8902a', n))).join('')}
      ${T.lay(id, 220, 320, -10, money(5, '#5a3a8a'))}${T.lay(id, 260, 316, 6, money(2, '#2a7a5a'))}
    `);
  });

  cover('bento', id => {
    const nigiri = (x, y, c) => `<g transform="translate(${x} ${y})"><ellipse cy="6" rx="26" ry="12" fill="#fbf6ea"/><path d="M-28 0 Q0 -24 28 0 Q0 8 -28 0 Z" fill="${c}"/><path d="M-16 -6 l8 4 M0 -10 l8 4" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></g>`;
    const maki = (x, y) => `<g transform="translate(${x} ${y})"><circle r="18" fill="#1a2a1a"/><circle r="14" fill="#fbf6ea"/><circle r="6" fill="#e8743a"/></g>`;
    const box = `<rect x="-200" y="-130" width="400" height="260" rx="16" fill="#1a0e0a"/><rect x="-190" y="-120" width="380" height="240" rx="10" fill="#8a1a1a"/><rect x="-180" y="-110" width="170" height="220" rx="6" fill="#2a1410"/><rect x="0" y="-110" width="180" height="104" rx="6" fill="#2a1410"/><rect x="0" y="6" width="180" height="104" rx="6" fill="#2a1410"/>${nigiri(-130, -60, '#f08a5a')}${nigiri(-60, -60, '#e8473c')}${nigiri(-130, 10, '#f2cf9a')}${nigiri(-60, 10, '#f08a5a')}${maki(40, -60)}${maki(90, -60)}${maki(140, -60)}<g transform="translate(90 58)"><circle cx="-28" r="16" fill="#f3ead6"/><circle r="16" fill="#7ac86a"/><circle cx="28" r="16" fill="#e88aa8"/><rect x="-54" y="-2" width="108" height="4" fill="#c8a060"/></g>`;
    return C(id, 'Bento Box', 'Pick a card, pass the rest', ['#7a3a32', '#401c18', '#160806'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#5a3a22', lx: 300 })}
      ${T.lay(id, 290, 190, -4, box, { tilt: TILT })}
      ${T.lay(id, 490, 270, 60, `<rect x="-4" y="-110" width="7" height="220" rx="3" fill="#c8a060"/><rect x="10" y="-110" width="7" height="220" rx="3" fill="#c8a060"/>`, { thin: true })}
    `);
  });

  cover('kaboom', id => C(id, 'Kaboom Critters', 'Draw, dodge, don’t go kaboom', ['#3a1f3a', '#241424', '#0c060c'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#3a1e3a', lx: 300 })}
    ${T.stand(id, 300, 250, 90, `<g transform="translate(300 200)"><circle r="56" fill="#1d1b22"/><circle r="56" fill="url(#${id}-bomb)"/><defs><radialGradient id="${id}-bomb" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#6a6a7a"/><stop offset=".5" stop-color="#2a2a32" stop-opacity="0"/></radialGradient></defs><rect x="-16" y="-72" width="32" height="20" rx="4" fill="#4a4a54"/><path d="M0 -72 Q20 -110 50 -100" stroke="#c8a060" stroke-width="5" fill="none"/><circle cx="52" cy="-100" r="10" fill="#ffd36a"/><circle cx="52" cy="-100" r="22" fill="#ffb03a" opacity=".35" filter="url(#${id}-b4)"/></g>`)}
    ${T.lay(id, 140, 230, -14, `<rect x="-50" y="-70" width="100" height="140" rx="8" fill="url(#${id}-paper)"/><rect x="-43" y="-63" width="86" height="80" rx="4" fill="#e8a83a"/><g transform="translate(0 -24)"><path d="M-22 18 Q-24 -6 -12 -12 L-16 -26 L-4 -16 H4 L16 -26 L12 -12 Q24 -6 22 18 Z" fill="#3a2a1a"/><circle cx="-7" cy="0" r="3" fill="#ffd36a"/><circle cx="7" cy="0" r="3" fill="#ffd36a"/></g>${T.word('DEFUSE', 0, 42, 14, { font: K.UI, weight: 900, ls: 2 })}`)}
    ${T.fan(id, 470, 330, ['back', 'back', 'back'], { w: 76, step: 12, backColor: '#3a1e3a' })}
  `));

  // ---- hidden roles
  cover('crown', id => C(id, 'Crown & Dagger', 'Loyalty is a lie', ['#6a2a24', '#3e1512', '#140605'], `
    ${T.surface(id, 'leather', { hz: 26, color: '#4a1418', lx: 300 })}
    ${T.stand(id, 300, 210, 140, `<g transform="translate(300 210)"><ellipse rx="110" ry="36" fill="#5a0e1e"/><ellipse cy="-6" rx="104" ry="30" fill="#7a1428"/>${[[-104, 0], [104, 0], [0, 30], [0, -36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="url(#${id}-brass)"/>`).join('')}<path d="M-60 -20 L-70 -96 L-36 -60 L0 -112 L36 -60 L70 -96 L60 -20 Q0 -6 -60 -20 Z" fill="url(#${id}-brass)" stroke="#5a3a10" stroke-width="2"/><path d="M-60 -20 Q0 -6 60 -20 L58 -34 Q0 -20 -58 -34 Z" fill="#8a6420"/>${[-34, 0, 34].map(x => `<circle cx="${x}" cy="-28" r="6" fill="#a8142a"/>`).join('')}<circle cy="-116" r="7" fill="url(#${id}-brass)"/></g>`)}
    ${T.lay(id, 300, 320, -16, `<path d="M-170 -5 L40 -6 L60 0 L40 6 L-170 5 Z" fill="url(#${id}-silver)"/><rect x="40" y="-24" width="12" height="48" rx="3" fill="url(#${id}-brass)"/><rect x="52" y="-6" width="60" height="12" rx="4" fill="#3a2010"/><circle cx="118" r="9" fill="url(#${id}-brass)"/>`, { thin: true })}
  `));

  cover('hollow', id => {
    const lantern = `<rect x="-26" y="-90" width="52" height="10" rx="3" fill="#2a2420"/><path d="M-22 -80 H22 V-10 H-22 Z" fill="#ffd36a" opacity=".75"/><path d="M-22 -80 H22 V-10 H-22 Z" fill="none" stroke="#2a2420" stroke-width="4"/><path d="M0 -80 V-10 M-22 -45 H22" stroke="#2a2420" stroke-width="2"/><rect x="-28" y="-10" width="56" height="12" rx="3" fill="#2a2420"/><path d="M-14 -90 Q0 -116 14 -90" stroke="#2a2420" stroke-width="4" fill="none"/><path d="M0 -60 C6 -50 5 -42 0 -38 C-5 -42 -6 -50 0 -60 Z" fill="#fff3c0"/>`;
    const role = (t, c) => `<rect x="-50" y="-70" width="100" height="140" rx="8" fill="#e8dcc4" stroke="rgba(0,0,0,.25)"/><rect x="-43" y="-63" width="86" height="126" rx="5" fill="none" stroke="${c}" stroke-width="2"/>${T.word(t, 0, 6, t.length > 6 ? 11 : 14, { weight: 700, fill: c, ls: 1.5 })}`;
    return C(id, 'Hollowmere', 'A village, a Shade, a long night', ['#2f3a52', '#1a2133', '#070a12'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#2a1e18', lx: 380, ly: 170, light: .26 })}
      <circle cx="420" cy="140" r="110" fill="#ffc860" opacity=".22" filter="url(#${id}-b8)"/>
      ${T.stand(id, 420, 240, 50, `<g transform="translate(420 240)">${lantern}</g>`)}
      ${T.lay(id, 220, 190, -10, role('VILLAGER', '#3a5a3a'))}${T.lay(id, 300, 200, 6, role('THE SHADE', '#3a1a3a'))}
      ${T.lay(id, 170, 320, -20, `<rect x="-90" y="-60" width="180" height="120" fill="#d8c8a0"/>${[[-60, -20], [-20, 10], [30, -30], [60, 20]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-8 6 V-6 L0 -12 L8 -6 V6 Z" fill="#5a4a3a"/></g>`).join('')}`, { blur: 2 })}
    `);
  });

  cover('manor', id => {
    const candlestick = `<ellipse cy="0" rx="30" ry="9" fill="url(#${id}-brass)"/><path d="M-6 -4 Q-14 -40 -6 -60 H6 Q14 -40 6 -4 Z" fill="url(#${id}-brass)"/><ellipse cy="-62" rx="16" ry="5" fill="url(#${id}-brass)"/><rect x="-7" y="-110" width="14" height="48" fill="#f3ead6"/><path d="M0 -130 C6 -120 5 -114 0 -112 C-5 -114 -6 -120 0 -130 Z" fill="#ffd36a"/>`;
    const env = `<rect x="-90" y="-56" width="180" height="112" fill="#e8dcbc"/><path d="M-90 -56 L0 10 L90 -56" fill="#d8c8a0" stroke="#b8a27a"/>${T.word('CONFIDENTIAL', 0, 40, 12, { font: K.UI, weight: 900, ls: 3, fill: '#8a1a1a' })}`;
    const plan = `<rect x="-120" y="-80" width="240" height="160" fill="#2a4a6a"/>${[[-110, -70, 90, 60], [-10, -70, 120, 60], [-110, 0, 70, 70], [-30, 0, 140, 70]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#cfe0f0" stroke-width="2"/>`).join('')}${T.word('Library', -65, -36, 10, { fill: '#cfe0f0' })}${T.word('Ballroom', 50, -36, 10, { fill: '#cfe0f0' })}`;
    return C(id, 'Midnight Manor', 'Who did it, with what, and where?', ['#3a1f1c', '#241210', '#0e0604'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2014', lx: 300, light: .28 })}
      ${T.lay(id, 300, 170, -4, plan)}
      ${T.lay(id, 200, 300, -12, env)}
      ${T.stand(id, 440, 290, 40, `<g transform="translate(440 290)">${candlestick}</g>`)}
      ${T.lay(id, 380, 330, 30, T.strip(K.key(id, 0, 0, .7, 0)).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`), { thin: true })}
    `);
  });

  cover('insidejob', id => {
    const dial = `<circle r="70" fill="url(#${id}-silver)"/><circle r="58" fill="#2a2e34"/>${Array.from({ length: 40 }, (_, i) => `<path d="M0 -56 V${i % 5 ? -50 : -44}" stroke="#d8dce2" stroke-width="${i % 5 ? 1 : 2}" transform="rotate(${i * 9})"/>`).join('')}<circle r="30" fill="url(#${id}-silver)"/><path d="M0 -30 V-10" stroke="#a8242a" stroke-width="4"/>`;
    const blue = `<rect x="-150" y="-100" width="300" height="200" fill="#1e4a7a"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${-150 + i * 25} -100 V100" stroke="#3a6a9a" stroke-width=".8"/>`).join('')}<rect x="-120" y="-70" width="120" height="90" fill="none" stroke="#cfe0f0" stroke-width="2.5"/><rect x="20" y="-70" width="100" height="140" fill="none" stroke="#cfe0f0" stroke-width="2.5"/>${T.word('VAULT', 70, 6, 14, { font: K.UI, weight: 900, ls: 3, fill: '#cfe0f0' })}<path d="M-60 20 V60 H20" stroke="#ffd36a" stroke-width="2.5" stroke-dasharray="6 5" fill="none"/>`;
    return C(id, 'Inside Job', 'Crack the vault together', ['#2a4a6e', '#1a3050', '#08121f'], `
      ${T.surface(id, 'slate', { hz: 26, color: '#20262e', lx: 300 })}
      ${T.lay(id, 260, 180, -6, blue)}
      ${T.lay(id, 440, 260, 0, dial, { tilt: .7 })}
      ${T.chips(id, 140, 320, 24, 4, '#c9a24a', { edge: '#fff6dc' })}
    `);
  });

  // ---- house party games
  cover('chefskiss', id => {
    const dish = (c) => `<circle r="38" fill="#fbfaf6"/><circle r="28" fill="#efe8d8"/><circle r="18" fill="${c}"/><circle cx="-6" cy="-6" r="5" fill="#fff" opacity=".4"/>`;
    const dcard = (name, c) => `<rect x="-50" y="-70" width="100" height="140" rx="8" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><g transform="translate(0 -18)">${dish(c)}</g>${T.word(name, 0, 50, 14, { weight: 700 })}`;
    return C(id, "Chef's Kiss", 'The party game of taste', ['#7a3a3a', '#4a1f22', '#1a0a0b'], `
      ${T.surface(id, 'linen', { hz: 26, color: '#d8ccb4', lx: 300 })}
      ${T.stand(id, 300, 230, 130, `<g transform="translate(300 230)"><ellipse rx="110" ry="30" fill="#e8e4dc"/><ellipse cy="-4" rx="96" ry="24" fill="#fbfaf6"/><path d="M-84 -6 Q-84 -90 0 -92 Q84 -90 84 -6 Z" fill="url(#${id}-silver)"/><ellipse cx="-30" cy="-60" rx="22" ry="12" fill="#fff" opacity=".5"/><circle cy="-98" r="9" fill="url(#${id}-silver)"/></g>`)}
      ${T.lay(id, 130, 230, -14, dcard('Truffle Tart', '#5a3a1a'))}${T.lay(id, 470, 236, 12, dcard('Lemon Sole', '#e8c84a'))}
    `);
  });

  cover('sketch', id => C(id, 'Sketch & Guess', 'Draw it, guess it', ['#5e5348', '#3a322b', '#141110'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#6a4a2a', lx: 300 })}
    ${T.lay(id, 270, 190, -6, `${T.notepad(id, 260, 200, `<path d="M-60 40 Q-50 -40 10 -50 Q70 -46 80 30" stroke="#a8322a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="10" cy="10" r="26" fill="none" stroke="#2a2a3a" stroke-width="3"/><path d="M0 4 h1 M20 4 h1 M-2 20 q12 10 24 0" stroke="#2a2a3a" stroke-width="3.4" stroke-linecap="round" fill="none"/>`, { spiral: true })}`)}
    ${T.lay(id, 450, 280, -40, T.pencilFlat(180, '#d8a830'), { thin: true })}
    ${T.stand(id, 470, 160, 40, T.strip(K.hourglass(id, 470, 120, .5, 0)))}
  `));

  cover('scribble', id => C(id, 'Scribble Chain', 'Draw, guess, pass it on', ['#3a2d22', '#241c14', '#0e0a06'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#5a3a22', lx: 300 })}
    ${[0, 1, 2].map(i => T.lay(id, 180 + i * 120, 190 + (i % 2) * 20, -10 + i * 10, T.notepad(id, 150, 170, i % 2 ? T.hand('a cat on a bus?', -20, 0, 18, '#2a2a5a', { anchor: 'middle' }) : `<path d="M-40 30 Q-30 -30 20 -30 Q50 -10 40 30 Z" fill="none" stroke="${['#2a6ad8', '#c8232a', '#2a8a3a'][i]}" stroke-width="4"/><circle cx="0" cy="-2" r="8" fill="none" stroke="#2a2a3a" stroke-width="3"/>`))).join('')}
    ${['#c8232a', '#2a6ad8', '#2a8a3a'].map((c, i) => T.lay(id, 460 + i * 20, 320, 60 + i * 8, `<rect x="-8" y="-70" width="16" height="120" rx="7" fill="#f4eee0"/><rect x="-8" y="-70" width="16" height="34" rx="7" fill="${c}"/>`, { thin: true })).join('')}
  `));

  cover('wrongnumber', id => {
    const bubble = (x, y, w, txt, me) => `<rect x="${x}" y="${y}" width="${w}" height="18" rx="9" fill="${me ? '#2a6ad8' : '#3a3a44'}"/><text x="${x + 6}" y="${y + 12.5}" font-family="${K.UI}" font-size="7.5" fill="#fff">${txt}</text>`;
    return C(id, 'Wrong Number', 'Strange texts, funnier replies', ['#2a1f38', '#1a1424', '#08060c'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2a1e', lx: 300 })}
      ${T.lay(id, 230, 190, -12, T.phone(id, `${bubble(-30, -56, 56, 'who is this??', false)}${bubble(-24, -32, 58, 'ur llama is out', true)}${bubble(-30, -8, 44, 'what llama', false)}${bubble(-22, 16, 54, 'Gerald.', true)}`), { tilt: .72, s: 1.25 })}
      ${T.lay(id, 400, 200, 14, T.phone(id, `${bubble(-30, -50, 60, 'new phone who', false)}${bubble(-24, -26, 54, 'it’s ur mum', true)}`), { tilt: .72, s: 1.15, blur: 2 })}
    `);
  });

  cover('hardsell', id => {
    const prod = `<rect x="-60" y="-80" width="120" height="160" rx="4" fill="#2a6a5a"/><rect x="-60" y="-80" width="30" height="160" fill="#1e4a40"/>${T.word('NEW!', 10, -40, 20, { font: K.UI, weight: 900, fill: '#ffd36a' })}${T.word('Self-Buttering', 10, -10, 11, { weight: 700, fill: '#fff' })}${T.word('Toast', 10, 10, 20, { weight: 700, fill: '#fff' })}`;
    return C(id, 'Hard Sell', 'Make silly products, make the sale', ['#1f3a3a', '#122424', '#040c0c'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a3020', lx: 300 })}
      ${T.stand(id, 280, 260, 110, `<g transform="translate(280 180)">${prod}</g>`)}
      ${T.lay(id, 450, 280, 10, `<rect x="-60" y="-34" width="120" height="68" rx="3" fill="#fbf8f0"/>${T.word('ACME & SONS', 0, -6, 12, { font: K.UI, weight: 900, ls: 2 })}${T.word('Chief Pitch Officer', 0, 14, 11, { italic: true })}`)}
      ${T.lay(id, 130, 300, -20, T.strip(K.gavel(id, 0, 0, .8, 0)), { thin: true })}
    `);
  });

  cover('fieldagents', id => {
    const words = ['ANCHOR', 'MOON', 'PIANO', 'LION', 'SPRING', 'GLASS', 'BANK', 'TOWER', 'NIGHT', 'RING', 'CROWN', 'BOLT', 'FIELD', 'PIRATE', 'MAPLE'];
    const cols = { 1: '#a8242a', 6: '#2a4a8a', 8: '#a8242a', 11: '#2a4a8a', 13: '#d8c8a0' };
    return C(id, 'Field Agents', 'One-word clues, find your agents', ['#2d2f22', '#1c1e14', '#080a06'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#2a3a2a', lx: 300 })}
      ${T.lay(id, 300, 180, 0, words.map((w, i) => `<g transform="translate(${-200 + (i % 5) * 100} ${-90 + Math.floor(i / 5) * 70})"><rect x="-46" y="-28" width="92" height="56" rx="5" fill="${cols[i] || '#efe4cc'}"/><rect x="-40" y="2" width="80" height="20" fill="#fbf8f0"/>${T.word(w, 0, 17, 13, { font: K.UI, weight: 900, ls: 1 })}</g>`).join(''), { tilt: TILT })}
      ${T.stand(id, 480, 320, 50, `<g transform="translate(480 300) rotate(-8)"><rect x="-42" y="-42" width="84" height="84" rx="6" fill="#1d1b1a"/>${Array.from({ length: 25 }, (_, i) => `<rect x="${-36 + (i % 5) * 15}" y="${-36 + Math.floor(i / 5) * 15}" width="12" height="12" fill="${[1, 8, 12].includes(i) ? '#a8242a' : [6, 11, 18].includes(i) ? '#2a4a8a' : '#d8c8a0'}"/>`).join('')}</g>`)}
    `);
  });

  cover('dialitin', id => {
    const dial = `<path d="M-150 0 A150 150 0 0 1 150 0 Z" fill="#1a3a4a"/>${[['#f2c230', -30, -10], ['#e87a2a', -10, 10], ['#c8232a', 10, 30]].map(([c, a0, a1]) => `<path d="M0 0 L${(140 * Math.cos((a0 - 90) * Math.PI / 180)).toFixed(1)} ${(140 * Math.sin((a0 - 90) * Math.PI / 180)).toFixed(1)} A140 140 0 0 1 ${(140 * Math.cos((a1 - 90) * Math.PI / 180)).toFixed(1)} ${(140 * Math.sin((a1 - 90) * Math.PI / 180)).toFixed(1)} Z" fill="${c}"/>`).join('')}<path d="M0 0 L-90 -110" stroke="#c8232a" stroke-width="7" stroke-linecap="round"/><circle r="18" fill="url(#${id}-brass)"/><rect x="-160" y="0" width="320" height="30" rx="6" fill="#0e2430"/>`;
    return C(id, 'Dial It In', 'Turn the dial, read their minds', ['#173338', '#0e2024', '#040c0e'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2a1e', lx: 300 })}
      ${T.stand(id, 300, 260, 200, `<g transform="translate(300 250) scale(1 .9)">${dial}</g>`)}
      ${T.lay(id, 140, 320, -14, `<rect x="-70" y="-40" width="140" height="80" rx="6" fill="#fbf8f0"/><rect x="-70" y="-40" width="70" height="80" rx="6" fill="#2a6ad8"/>${T.word('HOT', -35, 6, 16, { font: K.UI, weight: 900, fill: '#fff' })}${T.word('COLD', 35, 6, 16, { font: K.UI, weight: 900, fill: '#2a6ad8' })}`)}
    `);
  });

  cover('words4fun', id => {
    const cube = (ch) => `<path d="M-20 -10 L0 -22 L20 -10 L0 2 Z" fill="#fbf6ea"/><path d="M-20 -10 L0 2 V26 L-20 14 Z" fill="#e0d6c0"/><path d="M0 2 L20 -10 V14 L0 26 Z" fill="#c8bca4"/><text x="0" y="-6" text-anchor="middle" font-family="${T.DISPLAY}" font-weight="700" font-size="14" fill="#2a2018" transform="scale(1 .62) translate(0 -2)">${ch}</text>`;
    const L = 'WORDFUNSTARGAMES';
    return C(id, 'Words 4 Fun', 'A grid of letters, find the most words', ['#3a3878', '#22214a', '#0a0a18'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#4a3020', lx: 300 })}
      ${T.stand(id, 280, 250, 170, `<g transform="translate(280 200)"><path d="M-130 0 L0 -70 L130 0 L0 70 Z" fill="#2a2a5a"/><path d="M-130 0 L0 70 V86 L-130 16 Z" fill="#1a1a3a"/><path d="M0 70 L130 0 V16 L0 86 Z" fill="#14142a"/>${[...L].map((ch, i) => { const r = Math.floor(i / 4), c = i % 4, x = (c - r) * 28, y = (c + r) * 16 - 48; return `<g transform="translate(${x} ${y})">${cube(ch)}</g>`; }).join('')}</g>`)}
      ${T.stand(id, 480, 280, 40, T.strip(K.hourglass(id, 480, 230, .55, 0)))}
    `);
  });

  cover('wordsmith', id => {
    let b = `<rect x="-200" y="-200" width="400" height="400" fill="#e8dcbc"/>`;
    for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) { const sp = (r === 7 && c === 7) ? '#d8a0a0' : ((r * c) % 7 === 0 && (r + c) % 4 === 0) ? '#a0c0d8' : ((r + c) % 11 === 0) ? '#d8b0b0' : null; b += `<rect x="${-200 + c * 26.6}" y="${-200 + r * 26.6}" width="26" height="26" fill="${sp || '#d8ccaa'}" opacity=".9"/>`; }
    const tilesH = 'GAMES'.split('').map((ch, i) => `<g transform="translate(${-80 + i * 26.6 + 13} ${-14 + 13})">${T.tile(ch, 25, { pts: [2, 1, 3, 1, 1][i] })}</g>`).join('');
    const tilesV = 'WORD'.split('').map((ch, i) => `<g transform="translate(${-80 + 2 * 26.6 + 13} ${-14 - (4 - i) * 26.6 + 13})">${T.tile(ch, 25, { pts: [4, 1, 1, 2][i] })}</g>`).join('');
    return C(id, 'Wordsmith', 'Build words across the board', ['#2c2620', '#1c1814', '#0a0806'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 300, 180, 0, `${b}${tilesH}${tilesV}`, { tilt: TILT })}
      ${T.stand(id, 300, 340, 220, `<g transform="translate(300 330)"><path d="M-140 0 L-150 -18 H150 L140 0 Z" fill="#6a3a1a"/>${'TRIADEN'.split('').map((ch, i) => `<g transform="translate(${-108 + i * 36} -28)"><rect x="-16" y="-16" width="32" height="32" rx="4" fill="#f1dfb4"/>${T.word(ch, 0, 8, 22, { weight: 700 })}</g>`).join('')}</g>`)}
    `);
  });
}
