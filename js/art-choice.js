// Painted covers: secret choices, bids and bluffs.
export default function paint(K) {
  const { cover, shell, card, chip, stack, glow, SERIF, UI } = K;
  const S = (title, tag, bg, cy = 34) => ({ title, tag, bg, cy });

  cover('lowestunique', id => shell(id, S('Lowest Unique', 'The lowest number nobody else picked', ['#2a4a7a', '#142640', '#060c16'], 30), `
    ${glow(id, 300, 150, 160, '#a0c8ff', .18)}
    ${[['5', 2, 160, 120], ['2', 1, 300, 96], ['5', 2, 440, 120], ['9', 1, 220, 230], ['3', 1, 380, 230]].map(([n, k, x, y]) => `<g transform="translate(${x} ${y})" ${K.sh(id)}><circle r="${n === '2' ? 54 : 40}" fill="${n === '2' ? 'url(#' + id + '-gold)' : n === '5' ? '#5a5a6a' : '#f3ead6'}" stroke="${n === '2' ? '#6a4a1a' : '#2a2a3a'}" stroke-width="3"/><text y="${n === '2' ? 20 : 15}" text-anchor="middle" font-family="${SERIF}" font-size="${n === '2' ? 58 : 42}" fill="${n === '5' ? '#9a9aaa' : '#2a2018'}">${n}</text>${n === '5' ? '<path d="M-28 -28 L28 28" stroke="#c8232a" stroke-width="6"/>' : ''}</g>`).join('')}
    ${K.laurel(id, 246, 96, .6)}${K.laurel(id, 354, 96, .6, true)}
  `));

  cover('splitsteal', id => {
    const ball = (x, label, c) => `<g transform="translate(${x} 160)" ${K.sh(id)}><circle r="78" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="3"/><ellipse cx="-24" cy="-34" rx="26" ry="14" fill="#fff" opacity=".5" transform="rotate(-30 -24 -34)"/><g transform="rotate(-8)"><rect x="-66" y="-18" width="132" height="36" fill="#1d1b1a" opacity=".85"/><text y="11" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="24" letter-spacing="3" fill="${c}">${label}</text></g></g>`;
    return shell(id, S('Split or Steal', 'Share the pot, or take it all', ['#6a5a1a', '#3a300c', '#141004'], 30), `
      ${K.stage(id)}
      ${ball(180, 'SPLIT', '#7ae09a')}${ball(420, 'STEAL', '#ff7a6a')}
      ${K.moneybag(id, 300, 250, .7)}
    `);
  });

  cover('twothirds', id => shell(id, S('Two-Thirds', 'Two-thirds of the average wins', ['#3a2a6a', '#1e1438', '#080614'], 30), `
    ${glow(id, 300, 140, 160, '#c0a0ff', .2)}
    <g font-family="${SERIF}" fill="url(#${id}-gold)" text-anchor="middle" ${K.sh(id)}><text x="250" y="140" font-size="120">2</text><text x="350" y="230" font-size="120">3</text></g><path d="M240 196 L370 96" stroke="url(#${id}-gold)" stroke-width="10" stroke-linecap="round"/>
    <g transform="translate(300 290)"><path d="M-220 0 H220" stroke="#e9d29a" stroke-width="3"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<path d="M${-220 + i * 44} -8 V8" stroke="#e9d29a" stroke-width="2"/>`).join('')}<path d="M-44 -24 L-34 -8 L-54 -8 Z" fill="#ff7a6a"/></g>
  `));

  cover('vulturebids', id => shell(id, S('Vulture Bids', 'Secret bids, ties cancel out', ['#6a3a1a', '#3a1e0c', '#140a04'], 26), `
    <circle cx="300" cy="140" r="130" fill="#e88a3a" opacity=".55" filter="url(#${id}-glow)"/>
    <path d="M60 210 Q200 196 330 204 Q420 210 560 190" stroke="#2a1a0c" stroke-width="12" fill="none"/><path d="M420 206 l40 -30 M180 202 l-30 -26" stroke="#2a1a0c" stroke-width="7"/>
    ${K.bird(id, 290, 150, 1.25, 'vulture', '#1a120c')}
    ${[0, 1, 2].map(i => `<g transform="translate(${210 + i * 90} 290) rotate(${(i - 1) * 8})" ${K.sh(id)}><rect x="-32" y="-44" width="64" height="88" rx="8" fill="#fbf3dc"/><text y="14" text-anchor="middle" font-family="${SERIF}" font-size="40" fill="${['#2a4a8a', '#b8232a', '#2a8a4a'][i]}">${[7, 12, 3][i]}</text></g>`).join('')}
  `));

  cover('treasurerun', id => shell(id, S('Treasure Run', 'Go deeper, or head home?', ['#3a2a1a', '#1e140c', '#0a0604'], 30), `
    <path d="M0 0 H600 V400 H0 Z M120 360 Q100 140 300 90 Q500 140 480 360 Z" fill="#140c06" fill-rule="evenodd"/>
    <path d="M120 360 Q100 140 300 90 Q500 140 480 360" fill="none" stroke="#3a2a1a" stroke-width="10"/>
    <circle cx="300" cy="240" r="140" fill="#ffb050" opacity=".22" filter="url(#${id}-soft)"/>
    ${K.chest(id, 300, 240, .9)}
    ${K.gem(id, 180, 280, .45, '#3a9ad8', -12)}${K.gem(id, 420, 286, .4, '#c8232a', 14)}${K.gem(id, 460, 230, .3, '#3ac86a', 4)}
    <g transform="translate(150 150)"><rect x="-4" y="0" width="8" height="70" fill="#5a3416"/><path d="M0 -36 C14 -16 10 0 0 4 C-10 0 -14 -16 0 -36 Z" fill="#ffb03a" filter="url(#${id}-glow)"/></g>
  `));

  cover('ticker', id => {
    const pts = [40, 70, 55, 90, 80, 120, 100, 150, 130, 140, 170, 200];
    const candles = pts.map((v, i) => { const x = 110 + i * 34, up = i === 0 || v > pts[i - 1], y = 300 - v, h = Math.abs(v - (pts[i - 1] ?? v - 20)) + 10; return `<path d="M${x} ${y - 16} V${y + h + 10}" stroke="${up ? '#3ac86a' : '#e8473c'}" stroke-width="2"/><rect x="${x - 9}" y="${up ? y : y - h + 10}" width="18" height="${h}" fill="${up ? '#3ac86a' : '#e8473c'}"/>`; }).join('');
    return shell(id, S('Ticker', 'A secret tip and one trade a day', ['#1a4a3a', '#0c261e', '#04100c'], 30), `
      <g stroke="#9ae0c0" stroke-opacity=".12">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M80 ${60 + i * 44} H540"/>`).join('')}</g>
      <g ${K.sh(id)}>${candles}</g>
      <path d="M110 260 C200 240 300 200 486 96" stroke="url(#${id}-gold)" stroke-width="4" fill="none" stroke-dasharray="2 6"/>
      <g transform="translate(300 40)"><rect x="-260" y="-16" width="520" height="30" fill="#0a0a0a" opacity=".8"/><text y="5" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="13" letter-spacing="2" fill="#3ac86a">GOLD ▲ 4.2   OIL ▼ 1.1   TECH ▲ 7.8   RAIL ▲ 0.6</text></g>
    `);
  });

  cover('galaauction', id => shell(id, S('Gala Auction', 'Bid on luxuries, don’t go broke', ['#6a1a3a', '#3a0c1e', '#14040a'], 30), `
    ${glow(id, 300, 140, 160, '#ffb0c8', .22)}
    <g transform="translate(300 214)" ${K.sh(id)}><path d="M-80 0 h160 l-20 60 h-120 Z" fill="#2a1a10"/><rect x="-90" y="-12" width="180" height="16" rx="4" fill="url(#${id}-gold)"/></g>
    ${K.gem(id, 300, 140, 1.15, '#e8f0ff')}
    <g transform="translate(130 200) rotate(-14)" ${K.sh(id)}><circle cy="-50" r="36" fill="#fbf6ea" stroke="#2a2018" stroke-width="3"/><text y="-38" text-anchor="middle" font-family="${SERIF}" font-size="34" fill="#2a2018">12</text><rect x="-6" y="-14" width="12" height="80" rx="4" fill="#5a3416"/></g>
    ${K.gavel(id, 480, 210, .9, -30)}
  `));

  cover('threefronts', id => {
    const flag = (x, y, c) => `<g transform="translate(${x} ${y})" ${K.sh(id)}><rect x="-2" y="-70" width="4" height="70" fill="#3a2410"/><path d="M2 -70 Q22 -76 40 -66 Q22 -56 2 -60 Z" fill="${c}"/></g>`;
    const soldier = (x, y, c) => `<g transform="translate(${x} ${y})"><circle cy="-22" r="7" fill="${c}"/><path d="M-9 0 Q-10 -16 0 -16 Q10 -16 9 0 Z" fill="${c}"/></g>`;
    return shell(id, S('Three Fronts', 'Split your troops three ways', ['#4a4a2a', '#262614', '#0e0e06'], 30), `
      <path d="M0 230 Q100 150 200 210 Q300 130 400 210 Q500 160 600 220 V400 H0 Z" fill="#3a4a26"/><path d="M0 260 Q150 220 300 250 Q450 280 600 240 V400 H0 Z" fill="#2a3a1c"/>
      ${flag(110, 180, '#c8232a')}${flag(300, 150, '#2a4aa8')}${flag(490, 185, '#e6b82a')}
      <g ${K.sh(id)}>${[[80, 230, '#c8232a'], [110, 240, '#c8232a'], [140, 232, '#c8232a'], [280, 200, '#2a4aa8'], [310, 206, '#2a4aa8'], [470, 236, '#e6b82a'], [500, 240, '#e6b82a'], [530, 232, '#e6b82a'], [560, 238, '#e6b82a']].map(([x, y, c]) => soldier(x, y, c)).join('')}</g>
    `);
  });

  cover('lemonade', id => shell(id, S('Lemonade Stand', 'Set your price, read the weather', ['#8a7a1a', '#4a400c', '#181404'], 28), `
    <circle cx="500" cy="70" r="40" fill="#ffd36a" filter="url(#${id}-glow)"/>
    <g transform="translate(300 220)" ${K.sh(id)}><rect x="-160" y="-150" width="12" height="190" fill="#7a4a22"/><rect x="148" y="-150" width="12" height="190" fill="#7a4a22"/><path d="M-180 -150 h360 l-20 -40 h-320 Z" fill="#f3ead6"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${-180 + i * 45} -150 l${i < 4 ? 6 : 4} -40 h20 l${i < 4 ? -6 : -2} 40 Z" fill="#e8473c" opacity="${i % 2 ? 1 : 0}"/>`).join('')}<rect x="-170" y="-20" width="340" height="80" fill="#c88a3a"/><rect x="-170" y="-20" width="340" height="10" fill="#e0a85a"/><rect x="-100" y="-10" width="200" height="40" rx="4" fill="#fbf3dc"/><text y="18" text-anchor="middle" font-family="${SERIF}" font-size="24" fill="#8a5a1a">Lemonade 50¢</text></g>
    <g transform="translate(240 160)" ${K.sh(id)}><path d="M-24 -40 h48 l-6 70 h-36 Z" fill="#f2e37a" opacity=".9" stroke="#fff" stroke-width="2"/><rect x="-24" y="-40" width="48" height="12" fill="#fff" opacity=".4"/></g>
    ${K.lemon(id, 330, 176, .6, -10)}${K.lemon(id, 380, 182, .55, 20)}
  `));

  cover('fishpond', id => shell(id, S('Fish Pond', 'Share it, or ruin it for everyone', ['#1a5a6a', '#0e2e38', '#041014'], 30), `
    <ellipse cx="300" cy="200" rx="260" ry="120" fill="#0a3a4a"/><ellipse cx="300" cy="196" rx="240" ry="106" fill="#1a6a7a"/><ellipse cx="300" cy="190" rx="200" ry="80" fill="#2a8a9a" opacity=".5"/>
    ${[[220, 190, '#e07a3a', 1], [360, 220, '#e6b82a', 0], [300, 160, '#e8473c', 1], [420, 170, '#e07a3a', 0], [180, 240, '#f3ead6', 0]].map(([x, y, c, f]) => K.fish(id, x, y, .7, c, !!f)).join('')}
    ${[[110, 110], [500, 120]].map(([x, y], i) => `<path d="M${x} ${y} Q${x + (i ? -70 : 70)} ${y - 80} ${x + (i ? -140 : 140)} ${y - 40}" stroke="#5a3416" stroke-width="5" fill="none"/><path d="M${x + (i ? -140 : 140)} ${y - 40} V${y + 60}" stroke="#e9d29a" stroke-width="1.5"/>`).join('')}
    ${[[200, 300, 40], [400, 110, 30]].map(([x, y, r]) => `<g transform="translate(${x} ${y})"><ellipse rx="${r}" ry="${r * .4}" fill="#3a8a3a"/><path d="M0 0 L${r} ${-r * .2}" stroke="#1a6a7a" stroke-width="3"/></g>`).join('')}
  `));

  cover('mysteryboxes', id => shell(id, S('Mystery Boxes', 'A secret hint, a sealed bid', ['#6a1a5a', '#380c30', '#140410'], 30), `
    ${K.stage(id)}
    ${K.giftbox(id, 160, 200, 1, '#2a4a8a')}${K.giftbox(id, 300, 180, 1.2, '#8a1a3a')}${K.giftbox(id, 440, 200, 1, '#2a6a3a')}
  `));

  cover('standoff', id => shell(id, S('Standoff', 'Aim, load, grab the loot', ['#8a5a2a', '#482e14', '#180e06'], 24), `
    <circle cx="300" cy="200" r="120" fill="#ffb050" opacity=".55" filter="url(#${id}-glow)"/>
    <path d="M0 240 Q300 220 600 240 V400 H0 Z" fill="#6a3a1a"/>
    <g fill="#2a1408">${[[120, 240], [480, 240]].map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(${i ? -1 : 1} 1)"><path d="M-30 -20 Q-34 -50 -10 -54 Q14 -50 16 -20 L14 0 L4 0 L0 -18 L-6 0 L-16 0 Z"/><circle cx="-2" cy="-66" r="12"/><path d="M-30 -74 h56 v6 h-56 Z M-16 -88 h28 l4 16 h-36 Z"/><path d="M14 -46 L40 -50 L42 -44 L16 -38 Z"/></g>`).join('')}</g>
    ${K.moneybag(id, 300, 222, .6)}
    ${K.star(id, 300, 96, .5)}
  `));

  // ---- older bluffing covers, repainted without emoji
  cover('petals', id => shell(id, S('Petals & Thorns', 'Bid, then flip without a thorn', ['#5a2a4a', '#2e1426', '#0e060c'], 30), `
    ${glow(id, 300, 150, 160, '#ffa0c8', .2)}
    ${[0, 1, 2, 3].map(i => `<g transform="translate(300 ${230 - i * 18})" ${K.sh(id)}><ellipse cy="10" rx="80" ry="22" fill="#3a1a2a"/><ellipse rx="80" ry="22" fill="${i === 3 ? '#f3d0dc' : '#d8a0b8'}" stroke="#7a3a5a" stroke-width="2"/>${i === 3 ? `<g transform="scale(1 .3)">${[0, 1, 2, 3, 4].map(k => `<ellipse cx="0" cy="-34" rx="16" ry="34" fill="#e05a8a" transform="rotate(${k * 72})"/>`).join('')}<circle r="14" fill="#ffd36a"/></g>` : ''}</g>`).join('')}
    <g transform="translate(470 210)" ${K.sh(id)}><ellipse cy="10" rx="62" ry="18" fill="#1a1a14"/><ellipse rx="62" ry="18" fill="#3a4a2a"/><path d="M-30 -2 L-20 -40 L-10 -2 M8 -2 L20 -50 L30 -2" fill="#2a3a1a" stroke="#1a2010" stroke-width="2"/></g>
    <g transform="translate(130 140)" ${K.sh(id)}><path d="M0 60 C-10 20 10 -10 0 -40" stroke="#3a6a2a" stroke-width="5" fill="none"/>${[0, 1, 2, 3, 4].map(k => `<ellipse cx="0" cy="-58" rx="12" ry="20" fill="#c8325a" transform="rotate(${k * 72 - 10} 0 -40)"/>`).join('')}<circle cy="-40" r="9" fill="#8a1a3a"/></g>
  `));

  cover('sealed', id => shell(id, S('Sealed Letter', 'One secret card, last one standing', ['#6a3a1a', '#3a1e0c', '#140a04'], 30), `
    ${glow(id, 300, 150, 160, '#ffd0a0', .2)}
    <g transform="translate(300 160) rotate(-6)" ${K.sh(id)}><rect x="-150" y="-96" width="300" height="192" rx="6" fill="#efe1bd"/><path d="M-150 -96 L0 20 L150 -96" fill="#e3d1a6" stroke="#b8a27a" stroke-width="2"/><path d="M-150 96 L-30 0 M150 96 L30 0" stroke="#b8a27a" stroke-width="2"/><circle cy="20" r="34" fill="#8a1a1a"/><circle cy="20" r="26" fill="#a82424"/><path d="M-14 28 L-14 10 L-7 18 L0 6 L7 18 L14 10 L14 28 Z" fill="#e8c06a"/></g>
    ${K.candle(id, 500, 290, .7, 80)}
  `));

  cover('insync', id => shell(id, S('In Sync', 'Play your numbers in order, silently', ['#1a3a5a', '#0c1c2e', '#04080e'], 30), `
    ${K.stars(40, 21, 260, .5)}
    ${[3, 17, 42, 68, 91].map((n, i) => `<g transform="translate(${120 + i * 90} ${180 - i * 14}) rotate(${(i - 2) * 6})" ${K.sh(id)}><rect x="-36" y="-52" width="72" height="104" rx="9" fill="${i === 4 ? '#2a4a7a' : '#fbf6ea'}"/>${i === 4 ? `<rect x="-28" y="-44" width="56" height="88" rx="6" fill="none" stroke="#e9d29a" stroke-width="2"/><text y="12" text-anchor="middle" font-family="${SERIF}" font-size="34" fill="#e9d29a">?</text>` : `<text y="14" text-anchor="middle" font-family="${SERIF}" font-size="40" fill="#1a2a4a">${n}</text>`}</g>`).join('')}
    <g transform="translate(300 300)" fill="none" stroke="#e9d29a" stroke-width="2" opacity=".7"><path d="M-30 0 Q0 -20 30 0"/><path d="M-20 10 Q0 -4 20 10"/></g>
  `));

  cover('bullpen', id => shell(id, S('Bull Pen', 'Dodge the sixth spot', ['#7a4a1a', '#3e260c', '#140c04'], 30), `
    ${K.wood(id, 230, '#5a3416')}
    <g transform="translate(300 118)" ${K.sh(id)}><path d="M-60 -30 Q-110 -40 -120 -90 Q-90 -56 -56 -54 Z M60 -30 Q110 -40 120 -90 Q90 -56 56 -54 Z" fill="#efe1bd"/><path d="M-64 -50 Q-70 20 -36 60 Q0 80 36 60 Q70 20 64 -50 Q0 -80 -64 -50 Z" fill="#3a2010"/><ellipse cy="40" rx="34" ry="22" fill="#6a4030"/><circle cx="-12" cy="40" r="5" fill="#1a0a04"/><circle cx="12" cy="40" r="5" fill="#1a0a04"/><circle cx="-28" cy="-10" r="6" fill="#1a0a04"/><circle cx="28" cy="-10" r="6" fill="#1a0a04"/><path d="M-6 60 a6 6 0 1 0 12 0" fill="none" stroke="url(#${id}-gold)" stroke-width="4"/><path d="M-64 -40 l-26 6 l20 12 Z M64 -40 l26 6 l-20 12 Z" fill="#3a2010"/></g>
    ${[0, 1, 2, 3, 4, 5].map(i => `<g transform="translate(${130 + i * 68} 250)" ${K.sh(id)}><rect x="-26" y="-36" width="52" height="72" rx="6" fill="${i === 5 ? '#b8232a' : '#fbf6ea'}"/><text y="12" text-anchor="middle" font-family="${SERIF}" font-size="30" fill="${i === 5 ? '#fff' : '#2a2018'}">${[12, 27, 38, 55, 61, 6][i]}</text></g>`).join('')}
  `));

  cover('openhouse', id => shell(id, S('Open House', 'Buy the houses, sell for cheques', ['#2a5a7a', '#142e40', '#060e16'], 28), `
    <path d="M0 260 Q300 240 600 260 V400 H0 Z" fill="#2a4a2a"/>
    ${K.house(id, 140, 220, 1, '#c8836a', '#5a2a1a')}${K.house(id, 300, 196, 1.3, '#e8d4b0', '#2a3a5a')}${K.house(id, 460, 222, 1, '#a8b4c8', '#6a2a2a')}
    <g transform="translate(400 120) rotate(8)" ${K.sh(id)}><rect x="-4" y="0" width="8" height="70" fill="#5a3416"/><rect x="-46" y="-30" width="92" height="40" rx="4" fill="#b8232a"/><text y="-2" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="20" letter-spacing="3" fill="#fff">SOLD</text></g>
    <g transform="translate(120 100) rotate(-10)" ${K.sh(id)}><rect x="-60" y="-26" width="120" height="52" rx="4" fill="#e8f0e0"/><text x="-50" y="-6" font-family="${UI}" font-weight="800" font-size="9" fill="#2a4a2a">PAY TO THE ORDER OF</text><text x="0" y="16" text-anchor="middle" font-family="${SERIF}" font-size="20" fill="#2a4a2a">$15,000</text></g>
  `));

  cover('bugbluff', id => {
    const beetle = (x, y, s, c, r) => `<g ${K.at(x, y, s, r)} ${K.sh(id)}>${[-1, 1].map(sx => [-18, 0, 18].map(dy => `<path d="M${sx * 20} ${dy} l${sx * 22} ${dy / 2 - 6}" stroke="#1a1410" stroke-width="4"/>`).join('')).join('')}<ellipse cy="4" rx="26" ry="34" fill="${c}"/><path d="M0 -26 V38" stroke="#1a1410" stroke-width="2"/><circle cy="-34" r="14" fill="#1a1410"/><path d="M-6 -44 l-10 -16 M6 -44 l10 -16" stroke="#1a1410" stroke-width="3"/><ellipse cx="-10" cy="-6" rx="8" ry="12" fill="#fff" opacity=".25"/></g>`;
    const spider = (x, y, s) => `<g ${K.at(x, y, s)} ${K.sh(id)}>${[-1, 1].map(sx => [-24, -8, 8, 24].map(dy => `<path d="M0 0 q${sx * 30} ${dy - 30} ${sx * 50} ${dy + 10}" stroke="#1a1410" stroke-width="4" fill="none"/>`).join('')).join('')}<ellipse cy="10" rx="20" ry="24" fill="#1a1410"/><circle cy="-16" r="12" fill="#1a1410"/><circle cx="-4" cy="-18" r="2" fill="#e8473c"/><circle cx="4" cy="-18" r="2" fill="#e8473c"/></g>`;
    return shell(id, S('Bug Bluff', 'Pass the bug, call the bluff', ['#3a4a1a', '#1e260c', '#0a0e04'], 30), `
      ${glow(id, 300, 150, 160, '#d0ff90', .16)}
      ${card(id, 180, 170, { back: true, backFill: '#3a5a1a', w: 120, rot: -16 })}
      <g transform="translate(320 160) rotate(6)" ${K.sh(id)}><rect x="-70" y="-98" width="140" height="196" rx="10" fill="#fbf6ea"/><g transform="translate(0 -6)">${beetle(0, 0, 1.1, '#2a6a3a', 0).replace(K.sh(id), '')}</g></g>
      ${spider(480, 120, .8)}${beetle(470, 280, .7, '#8a2a1a', 30)}
      ${K.bubble(id, 150, 70, 170, 50, '“It’s a spider.”', { italic: true, fs: 17 })}
    `);
  });
}
