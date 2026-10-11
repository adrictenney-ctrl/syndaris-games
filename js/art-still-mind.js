// Still-life covers: secret bids and bluffs, and the fast action games.
export default function paint(K) {
  const { cover, shell, T } = K;
  const C = (id, title, tag, bg, body, z = 1.2) => shell(id, { title, tag, bg }, `${T.defs(id)}${T.zoom(body, z)}`);
  const shade = K.shade;
  const slip = (id, text, o = {}) => `<rect x="${-(o.w || 150) / 2}" y="${-(o.h || 60) / 2}" width="${o.w || 150}" height="${o.h || 60}" rx="3" fill="${o.fill || '#fbf8ee'}" stroke="rgba(0,0,0,.15)"/>${T.hand(text, 0, 7, o.fs || 20, o.ink || '#2a2a5a')}`;
  const ncard = (id, n, c = '#1a2a4a', o = {}) => `<rect x="-38" y="-54" width="76" height="108" rx="8" fill="${o.fill || `url(#${id}-paper)`}" stroke="${o.edge || 'rgba(0,0,0,.2)'}" stroke-width="${o.edge ? 3 : 1}"/>${T.word(String(n), 0, 16, String(n).length > 2 ? 32 : 44, { weight: 700, fill: c })}`;
  const brassify = (id, svg) => T.strip(svg).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`);

  cover('lowestunique', id => C(id, 'Lowest Unique', 'The lowest number nobody else picked', ['#2a4a7a', '#142640', '#060c16'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#1a2a40', lx: 300 })}
    ${[['5', 150, 200, -10], ['2', 260, 180, -2, true], ['5', 360, 196, 6], ['9', 450, 210, 12], ['3', 300, 290, 4]].map(([n, x, y, r, win]) => T.lay(id, x, y, r, ncard(id, n, n === '5' ? '#9a9aa8' : '#1a2a4a', { edge: win ? '#c8a24a' : null }) + (n === '5' ? '<path d="M-28 -40 L28 40" stroke="#a8242a" stroke-width="4"/>' : ''))).join('')}
  `));

  cover('splitsteal', id => {
    const ball = (label, c) => `<g transform="translate(0 -60)"><circle r="56" fill="url(#${id}-brass)"/><ellipse cx="-18" cy="-24" rx="18" ry="10" fill="#fff" opacity=".45" transform="rotate(-30 -18 -24)"/><g transform="rotate(-6)"><rect x="-50" y="-14" width="100" height="28" fill="#1d1b1a"/>${T.word(label, 0, 9, 18, { font: K.UI, weight: 900, ls: 3, fill: c })}</g></g>`;
    return C(id, 'Split or Steal', 'Share the pot, or take it all', ['#6a5a1a', '#3a300c', '#141004'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#2a1a10', lx: 300 })}
      ${T.stand(id, 190, 260, 110, `<g transform="translate(190 260)">${ball('SPLIT', '#7ae09a')}</g>`)}${T.stand(id, 410, 260, 110, `<g transform="translate(410 260)">${ball('STEAL', '#ff7a6a')}</g>`)}
      ${T.lay(id, 300, 300, -6, T.note(160, '#2a5a3a', '£100'))}${T.lay(id, 310, 290, 8, T.note(160, '#6a3a1a', '£50'))}
    `);
  });

  cover('twothirds', id => C(id, 'Two-Thirds', 'Two-thirds of the average wins', ['#3a2a6a', '#1e1438', '#080614'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1a14', lx: 300 })}
    ${T.lay(id, 280, 200, -4, `${T.notepad(id, 260, 220, `${T.word('⅔', 0, 10, 120, { weight: 700, fill: '#2a2a5a' })}${T.hand('of 33 = 22', 0, 76, 22, '#a8242a')}`)}`)}
    ${['50', '33', '22', '14'].map((n, i) => T.lay(id, 470, 120 + i * 60, (i % 2 ? 6 : -6), slip(id, n, { w: 70, h: 44, fs: 22 }))).join('')}
  `));

  cover('vulturebids', id => C(id, 'Vulture Bids', 'Secret bids, ties cancel', ['#6a3a1a', '#3a1e0c', '#140a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 300, 160, 0, `<rect x="-60" y="-84" width="120" height="168" rx="9" fill="#2a1a10"/><rect x="-52" y="-76" width="104" height="152" rx="6" fill="#e8c87a"/>${T.word('+10', 0, 16, 46, { weight: 700, fill: '#5a3a10' })}`, { s: 1.1 })}
    ${[7, 12, 12, 3].map((n, i) => T.lay(id, 140 + i * 110, 300 + (i % 2) * 8, (i - 1.5) * 8, ncard(id, n, ['#2a4a8a', '#a8242a', '#2a8a3a', '#6a3ab0'][i]) + (n === 12 ? '<path d="M-28 -40 L28 40" stroke="#1d1b1a" stroke-width="3" opacity=".6"/>' : ''))).join('')}
    ${T.lay(id, 480, 140, 30, `<path d="M0 -60 C24 -36 20 24 2 54 L-2 54 C-18 24 -24 -36 0 -60 Z" fill="#2a2018"/><path d="M0 -56 V54" stroke="#4a3a2a" stroke-width="1.4"/>`, { thin: true, blur: 2 })}
  `));

  cover('treasurerun', id => C(id, 'Treasure Run', 'Go deeper, or head home?', ['#3a2a1a', '#1e140c', '#0a0604'], `
    ${T.surface(id, 'slate', { hz: 26, color: '#2a221a', lx: 300 })}
    ${T.stand(id, 300, 250, 160, brassify(id, K.chest(id, 300, 230, 1.1)))}
    ${[[160, 280, '#3a9ad8', -12], [440, 290, '#c8232a', 14], [480, 230, '#3ac86a', 4], [130, 220, '#c8a02a', 0]].map(([x, y, c, r]) => T.stand(id, x, y + 20, 30, T.strip(K.gem(id, x, y, .4, c, r)))).join('')}
  `));

  cover('ticker', id => {
    const pts = [40, 70, 55, 90, 80, 120, 100, 150, 130, 140, 170, 200];
    const chart = `<rect x="-160" y="-110" width="320" height="220" fill="#f6f2e6"/>${[0, 1, 2, 3, 4].map(i => `<path d="M-150 ${-90 + i * 40} H150" stroke="#c8d0d8"/>`).join('')}${pts.map((v, i) => { const x = -140 + i * 25, up = i === 0 || v > pts[i - 1], y = 90 - v * .9; return `<rect x="${x - 7}" y="${y}" width="14" height="${Math.abs(v - (pts[i - 1] ?? v - 20)) * .9 + 6}" fill="${up ? '#2a8a4a' : '#a8242a'}"/>`; }).join('')}${T.word('GOLD CORP · 4.2 ▲', -150, -94, 12, { anchor: 'start', font: K.UI, weight: 800, fill: '#2a2018' })}`;
    return C(id, 'Ticker', 'A secret tip, one trade a day', ['#1a4a3a', '#0c261e', '#04100c'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#2a1a10', lx: 300 })}
      ${T.lay(id, 260, 190, -4, chart)}
      ${T.lay(id, 470, 280, 12, T.phone(id, `<rect x="-36" y="-72" width="72" height="144" fill="#0b1a14"/>${T.word('TIP', 0, -44, 11, { font: K.UI, weight: 900, ls: 3, fill: '#ffd36a' })}${T.word('Buy rail.', 0, 0, 13, { weight: 700, fill: '#fff' })}${T.word('Shh.', 0, 22, 12, { italic: true, fill: '#9ab' })}`), { tilt: .74, s: 1.05 })}
    `);
  });

  cover('galaauction', id => C(id, 'Gala Auction', 'Bid on luxuries, don’t go broke', ['#6a1a3a', '#3a0c1e', '#14040a'], `
    ${T.surface(id, 'leather', { hz: 26, color: '#3a1424', lx: 300 })}
    ${T.stand(id, 300, 230, 120, `<g transform="translate(300 230)"><ellipse rx="70" ry="20" fill="#3a1020"/><path d="M-70 0 V-20 Q0 -40 70 -20 V0" fill="#5a1830"/></g>${T.strip(K.gem(id, 300, 170, 1.2, '#e8f0ff'))}`)}
    ${T.lay(id, 140, 250, -20, `<circle cy="-50" r="34" fill="#fbf6ea" stroke="#2a2018" stroke-width="3"/>${T.word('12', 0, -38, 30, { weight: 700 })}<rect x="-6" y="-14" width="12" height="80" rx="4" fill="#5a3416"/>`, { tilt: .8 })}
    ${T.lay(id, 470, 270, -20, brassify(id, K.gavel(id, 0, 0, 1, 0)), { thin: true })}
  `));

  cover('threefronts', id => {
    const flag = (c) => `<rect x="-2" y="-60" width="4" height="60" fill="#3a2410"/><path d="M2 -60 Q20 -66 36 -56 Q20 -46 2 -50 Z" fill="${c}"/>`;
    const sold = (c) => `<rect x="-6" y="-6" width="12" height="12" fill="${c}"/>`;
    return C(id, 'Three Fronts', 'Split your troops three ways', ['#4a4a2a', '#262614', '#0e0e06'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 300, 190, 0, `<rect x="-240" y="-110" width="480" height="220" fill="#d8c8a0"/>${[-160, 0, 160].map(x => `<rect x="${x - 70}" y="-100" width="140" height="200" fill="none" stroke="#8a7a5a" stroke-width="2" stroke-dasharray="6 4"/>`).join('')}${[[-160, '#a8242a', 5], [0, '#2a4a8a', 2], [160, '#c8902a', 7]].map(([x, c, n]) => Array.from({ length: n }, (_, i) => `<g transform="translate(${x - 40 + (i % 4) * 26} ${20 + Math.floor(i / 4) * 26})">${sold(c)}</g>`).join('')).join('')}`, { tilt: .6 })}
      ${[[150, 140, '#a8242a'], [300, 130, '#2a4a8a'], [450, 140, '#c8902a']].map(([x, y, c]) => T.stand(id, x, y, 14, `<g transform="translate(${x} ${y})">${flag(c)}</g>`)).join('')}
    `);
  });

  cover('lemonade', id => C(id, 'Lemonade Stand', 'Set your price, read the weather', ['#8a7a1a', '#4a400c', '#181404'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#8a6a3a', lx: 300 })}
    ${T.stand(id, 250, 260, 70, `<g transform="translate(250 260)"><path d="M-40 0 L-46 -120 H46 L40 0 Z" fill="#f2e37a" opacity=".85"/><path d="M-46 -120 H46 L44 -100 H-44 Z" fill="#fff" opacity=".35"/><path d="M-30 -110 Q-36 -50 -26 -10" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none"/><path d="M46 -100 Q76 -90 70 -50 Q66 -30 44 -30" fill="none" stroke="#f2e37a" stroke-width="8" opacity=".85"/></g>`)}
    ${T.stand(id, 380, 260, 40, `<g transform="translate(380 260)"><path d="M-22 0 L-26 -76 H26 L22 0 Z" fill="#f2e37a" opacity=".8"/><path d="M-26 -76 H26" stroke="#fff" stroke-width="2"/><path d="M6 -76 L22 -110" stroke="#c8232a" stroke-width="4"/></g>`)}
    ${[[160, 300, -10], [450, 300, 20], [480, 250, 0]].map(([x, y, r]) => T.stand(id, x, y + 20, 30, T.strip(K.lemon(id, x, y, .7, r)))).join('')}
    ${T.lay(id, 300, 330, 0, slip(id, 'Lemonade 50¢', { w: 160, h: 46, fs: 22, fill: '#fbf3dc' }))}
  `));

  cover('fishpond', id => C(id, 'Fish Pond', 'Share it, or ruin it for everyone', ['#1a5a6a', '#0e2e38', '#041014'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#4a3020', lx: 300 })}
    ${T.lay(id, 300, 190, 0, `<ellipse rx="210" ry="130" fill="#1a4a5a"/><ellipse rx="196" ry="118" fill="#2a7a8a"/><ellipse rx="150" ry="80" fill="#3a8a9a" opacity=".5"/>${[[-80, -20, '#e07a3a', 0], [40, 30, '#e8b82a', 1], [-10, -50, '#e8473c', 0], [100, -30, '#e07a3a', 1], [-110, 40, '#f3ead6', 1]].map(([x, y, c, f]) => `<g transform="translate(${x} ${y}) scale(${f ? -.7 : .7} .7)"><path d="M-50 0 Q-10 -36 36 -8 L60 -26 L56 0 L60 26 L36 8 Q-10 36 -50 0 Z" fill="${c}"/><circle cx="-34" cy="-4" r="4" fill="#1d1b1a"/></g>`).join('')}${[[140, 60], [-150, -60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="30" ry="20" fill="#3a8a3a"/>`).join('')}`, { tilt: .62 })}
    ${T.lay(id, 470, 320, -20, `<rect x="-6" y="-120" width="12" height="200" rx="4" fill="#7a4a22"/><circle cy="40" r="14" fill="none" stroke="#c8ccd2" stroke-width="4"/>`, { thin: true })}
  `));

  cover('mysteryboxes', id => {
    const box = (c, lid) => `<g><path d="M-50 0 V-70 H50 V0 Z" fill="${c}"/><path d="M50 -70 L64 -80 V-10 L50 0 Z" fill="${shade(c, -.35)}"/><path d="M-50 -70 L-36 -80 H64 L50 -70 Z" fill="${shade(c, .2)}"/><rect x="-6" y="-70" width="12" height="70" fill="url(#${lid}-brass)"/><path d="M-36 -80 H64" stroke="url(#${lid}-brass)" stroke-width="0"/><path d="M0 -76 C-24 -110 -40 -86 -14 -78 Z M0 -76 C24 -110 40 -86 14 -78 Z" fill="url(#${lid}-brass)"/></g>`;
    return C(id, 'Mystery Boxes', 'A secret hint, a sealed bid', ['#6a1a5a', '#380c30', '#140410'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#2a1a14', lx: 300 })}
      ${[[170, 250, '#2a4a8a'], [300, 236, '#8a1a3a'], [430, 250, '#2a6a3a']].map(([x, y, c]) => T.stand(id, x, y, 80, `<g transform="translate(${x} ${y})">${box(c, id)}</g>`)).join('')}
      ${T.lay(id, 300, 330, 0, slip(id, 'Box B is not empty…', { w: 230, h: 46, fs: 20 }))}
    `);
  });

  cover('standoff', id => C(id, 'Standoff', 'Aim, load, grab the loot', ['#8a5a2a', '#482e14', '#180e06'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#5a3418', lx: 300 })}
    ${T.stand(id, 300, 250, 110, T.strip(K.moneybag(id, 300, 190, 1)))}
    ${T.lay(id, 160, 270, -16, brassify(id, K.star(id, 0, 0, .9)).replace(/url\(#[^)]*-brass\)/g, `url(#${id}-silver)`), { tilt: .7 })}
    ${[0, 1, 2].map(i => T.lay(id, 440 + i * 22, 300 - i * 6, 70, `<rect x="-6" y="-20" width="12" height="30" rx="2" fill="url(#${id}-brass)"/><path d="M-6 -20 Q0 -34 6 -20 Z" fill="#8a8a92"/>`, { thin: true })).join('')}
    ${T.lay(id, 440, 160, 10, `<rect x="-60" y="-80" width="120" height="160" fill="#e8d4a8"/>${T.word('WANTED', 0, -50, 24, { weight: 700, ls: 3 })}<rect x="-40" y="-36" width="80" height="70" fill="#c8b48a"/>${T.word('$500', 0, 62, 22, { weight: 700 })}`, { blur: 2 })}
  `));

  cover('bugbluff', id => {
    const beetle = (c) => `${[-1, 1].map(sx => [-14, 0, 14].map(dy => `<path d="M${sx * 16} ${dy} l${sx * 18} ${dy / 2 - 5}" stroke="#1a1410" stroke-width="3"/>`).join('')).join('')}<ellipse cy="4" rx="20" ry="27" fill="${c}"/><path d="M0 -20 V30" stroke="#1a1410" stroke-width="1.6"/><circle cy="-27" r="11" fill="#1a1410"/><ellipse cx="-8" cy="-4" rx="6" ry="10" fill="#fff" opacity=".25"/>`;
    const bc = (c) => `<rect x="-50" y="-70" width="100" height="140" rx="8" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-42" y="-62" width="84" height="124" rx="5" fill="none" stroke="${c}" stroke-width="2"/><g transform="translate(0 -4) scale(1.3)">${beetle(c)}</g>`;
    return C(id, 'Bug Bluff', 'Pass the bug, call the bluff', ['#3a4a1a', '#1e260c', '#0a0e04'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#2a3a1e', lx: 300 })}
      ${T.lay(id, 220, 196, -10, T.pback(id, 100, '#3a5a1a'))}${T.lay(id, 360, 190, 8, bc('#2a6a3a'))}
      ${T.lay(id, 300, 320, 0, slip(id, '“It’s a spider.”', { w: 200, h: 50, fs: 22 }))}
    `);
  });

  cover('openhouse', id => {
    const hcard = (n, c) => `<rect x="-45" y="-64" width="90" height="128" rx="6" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-38" y="-56" width="76" height="74" rx="4" fill="${c}"/><g transform="translate(0 -16)"><path d="M-22 22 V-2 L0 -20 L22 -2 V22 Z" fill="#f4eee0"/><rect x="-6" y="6" width="12" height="16" fill="${shade(c, -.3)}"/></g>${T.word(String(n), 0, 46, 26, { weight: 700 })}`;
    return C(id, 'Open House', 'Buy houses, sell for cheques', ['#2a5a7a', '#142e40', '#060e16'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${[[3, '#8a5a3a'], [17, '#3a5a7a'], [24, '#6a3a3a']].map(([n, c], i) => T.lay(id, 170 + i * 110, 190 + (i % 2) * 10, (i - 1) * 8, hcard(n, c))).join('')}
      ${T.lay(id, 460, 300, 10, `<rect x="-80" y="-36" width="160" height="72" rx="3" fill="#e8f0e0"/>${T.word('PAY TO THE ORDER OF', -70, -14, 8, { anchor: 'start', font: K.UI, weight: 800, fill: '#2a4a2a' })}${T.word('$15,000', 0, 16, 24, { weight: 700, fill: '#2a4a2a' })}`)}
      ${T.lay(id, 140, 310, -10, T.coinTop(id, 20, { mark: '$' }), { thin: true })}
    `);
  });

  cover('bullpen', id => C(id, 'Bull Pen', 'Dodge the sixth spot', ['#7a4a1a', '#3e260c', '#140c04'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#2a3a24', lx: 300 })}
    ${[0, 1, 2, 3, 4, 5].map(i => T.lay(id, 110 + i * 76, 170, 0, `${ncard(id, [12, 27, 38, 55, 61, 6][i], i === 5 ? '#fff' : '#3a2a1a', { fill: i === 5 ? '#a8242a' : null })}<g transform="translate(0 -36)">${Array.from({ length: [1, 2, 3, 2, 1, 5][i] }, (_, k) => `<path transform="translate(${-16 + k * 8} 0) scale(.5)" d="M-10 0 Q-14 -10 -6 -14 L-10 -22 L0 -16 L10 -22 L6 -14 Q14 -10 10 0 Z" fill="${i === 5 ? '#fff' : '#a8242a'}"/>`).join('')}</g>`)).join('')}
    ${T.fan(id, 300, 330, ['back', 'back', 'back', 'back'], { w: 76, step: 10, backColor: '#3a2a1a', blur: 2 })}
  `));

  cover('nope', id => {
    const chip = (c) => `<circle r="18" fill="${c}"/><circle r="12" fill="none" stroke="#fff" stroke-width="1.5" opacity=".5"/>`;
    return C(id, 'Nope!', 'Take the card, or pay to pass', ['#143a30', '#0c221c', '#04100c'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#1a4a3a', lx: 300 })}
      ${T.lay(id, 300, 180, -4, ncard(id, 27, '#1a3a2a'), { s: 1.4 })}
      ${[[260, 186], [280, 172], [324, 190]].map(([x, y]) => T.lay(id, x, y, 0, chip('#c8a02a'), { thin: true })).join('')}
      ${Array.from({ length: 8 }, (_, i) => T.lay(id, 120 + (i % 4) * 22, 300 - Math.floor(i / 4) * 10, 0, chip(['#c8a02a', '#a8242a'][i % 2]), { thin: true })).join('')}
      ${T.lay(id, 470, 300, 10, ncard(id, 28, '#1a3a2a'))}
    `);
  });

  cover('nightlights', id => {
    const fw = (x, y, r, c) => Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return `<path d="M${x + Math.cos(a) * r * .3} ${y + Math.sin(a) * r * .3} L${x + Math.cos(a) * r} ${y + Math.sin(a) * r}" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`; }).join('');
    return C(id, 'Night Lights', 'See every hand but your own', ['#0c0c22', '#06061a', '#020208'], `
      ${T.surface(id, 'slate', { hz: 26, color: '#141428', lx: 300, light: .22 })}
      ${['#e8473c', '#2f7de1', '#36a852', '#f2c230', '#f4eee0'].map((c, i) => T.lay(id, 140 + i * 82, 200 + (i % 2) * 10, (i - 2) * 4, `<rect x="-36" y="-52" width="72" height="104" rx="8" fill="#16163a" stroke="${c}" stroke-width="2"/>${fw(0, -6, 26, c)}${T.word(String(i + 1), 0, 42, 18, { weight: 700, fill: c })}`)).join('')}
      ${T.fan(id, 300, 340, ['back', 'back', 'back', 'back'], { w: 70, step: 10, backColor: '#16163a', blur: 4 })}
    `);
  });

  cover('sealed', id => C(id, 'Sealed Letter', 'One secret card, last one standing', ['#6a3a1a', '#3a1e0c', '#140a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2014', lx: 300 })}
    ${T.lay(id, 280, 190, -6, `<rect x="-140" y="-90" width="280" height="180" rx="4" fill="#efe1bd"/><path d="M-140 -90 L0 18 L140 -90" fill="#e3d1a6" stroke="#b8a27a" stroke-width="2"/><path d="M-140 90 L-28 4 M140 90 L28 4" stroke="#b8a27a" stroke-width="2"/><circle cy="18" r="30" fill="#8a1a1a"/><circle cy="18" r="22" fill="#a82424"/><path d="M-12 26 V10 L-6 18 L0 6 L6 18 L12 10 V26 Z" fill="#e8c06a"/>`)}
    ${T.stand(id, 480, 260, 40, T.strip(K.candle(id, 480, 260, .7, 80)))}
    <circle cx="480" cy="170" r="60" fill="#ffc860" opacity=".2" filter="url(#${id}-b8)"/>
  `));

  // ---------------------------------------------------------------- action games (phones are the controllers)
  const screen = (bg, inner) => `<rect x="-36" y="-72" width="72" height="144" fill="${bg}"/>${inner}`;
  cover('snapmatch', id => {
    const icons = { star: c => `<path d="M0 -14 L4 -4 L14 -4 L6 2 L9 12 L0 6 L-9 12 L-6 2 L-14 -4 L-4 -4 Z" fill="${c}"/>`, moon: c => `<path d="M4 -12 A12 12 0 1 0 4 12 A9 9 0 1 1 4 -12 Z" fill="${c}"/>`, heart: c => `<path d="M0 10 C-14 0 -14 -12 -6 -12 C-2 -12 0 -8 0 -6 C0 -8 2 -12 6 -12 C14 -12 14 0 0 10 Z" fill="${c}"/>`, leaf: c => `<path d="M-12 10 Q-12 -12 12 -12 Q12 10 -12 10 Z" fill="${c}"/>`, anchor: c => `<path d="M0 -12 V12 M-10 4 Q0 18 10 4 M-6 -6 H6" stroke="${c}" stroke-width="3" fill="none"/>`, sun: c => `<circle r="7" fill="${c}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0 -10 V-14" stroke="${c}" stroke-width="2.5" transform="rotate(${i * 45})"/>`).join('')}` };
    const disc = (set) => `<circle r="96" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/>${set.map(([k, c, dx, dy, s], i) => `<g transform="translate(${dx} ${dy}) scale(${s}) rotate(${i * 50})">${icons[k](c)}</g>`).join('')}`;
    return C(id, 'Snap Match', 'Spot the match, tap first', ['#6a1a4a', '#380c26', '#14040c'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#2a1a2a', lx: 300 })}
      ${T.lay(id, 200, 190, -10, disc([['star', '#c89a2a', -40, -40, 1.8], ['moon', '#2a4a8a', 50, 10, 1.8], ['heart', '#a8242a', -10, 40, 2], ['leaf', '#2a8a4a', -50, 20, 1.6]]))}
      ${T.lay(id, 410, 196, 12, disc([['anchor', '#2a4a8a', -40, -40, 1.6], ['heart', '#a8242a', 36, -36, 2], ['sun', '#c89a2a', 40, 30, 1.6], ['leaf', '#2a8a4a', -40, 20, 1.4]]))}
    `);
  });
}
