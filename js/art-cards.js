// Painted covers: card games.
export default function paint(K) {
  const { cover, shell, card, chip, stack, glow, SERIF, UI, SYM } = K;
  const S = (title, tag, bg, cy = 34) => ({ title, tag, bg, cy });
  const back = (id, x, y, r, w = 110, c = '#6a1f24') => card(id, x, y, { back: true, backFill: c, w, rot: r });
  const pile = (id, x, y, n, w, c) => Array.from({ length: n }, (_, i) => back(id, x + i * 1.5, y - i * 2, (i % 3 - 1) * 3, w, c)).join('');

  cover('whist', id => shell(id, S('Whist', 'Partners, trumps and tricks', ['#1f3a6a', '#0f1e38', '#050a14']), `
    ${K.felt(id, '#1a3a5a', 250)}
    ${card(id, 300, 96, { rank: 'K', suit: '♥', red: true, w: 92, face: K.kingFace(92) })}${card(id, 400, 160, { rank: '9', suit: '♥', red: true, w: 92, rot: 90 })}${card(id, 300, 220, { rank: 'A', suit: '♥', red: true, w: 92, rot: 180 })}${card(id, 200, 160, { rank: '4', suit: '♠', w: 92, rot: -90 })}
    ${pile(id, 520, 280, 4, 70, '#1f2a4a')}${pile(id, 80, 280, 3, 70, '#6a1f24')}
  `));

  cover('exactly', id => shell(id, S('Exactly', 'Bid the exact tricks you’ll take', ['#6a2a5a', '#38142e', '#140610']), `
    ${glow(id, 300, 150, 160, '#ffa0e0', .18)}
    ${[0, 1, 2].map(i => card(id, 220 + i * 60, 170 - (i === 1 ? 14 : 0), { rank: ['Q', '7', 'A'][i], suit: ['♣', '♦', '♠'][i], red: i === 1, rot: (i - 1) * 12, w: 112, face: i === 0 ? K.queenFace('#1d1b1a', 112) : undefined })).join('')}
    <g transform="translate(470 130)" ${K.sh(id)}><circle r="56" fill="#1d1b1a" stroke="url(#${id}-gold)" stroke-width="5"/><text y="-18" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="10" letter-spacing="2.5" fill="#e9d29a">EXACTLY</text><text y="30" text-anchor="middle" font-family="${SERIF}" font-size="54" fill="#ffd36a">3</text></g>
  `));

  cover('setback', id => shell(id, S('Setback', 'High, low, jack and game', ['#7a4a1a', '#40260c', '#160c04']), `
    ${K.wood(id, 250, '#4a2a12')}
    ${card(id, 230, 160, { rank: 'J', suit: '♣', rot: -12, w: 120, face: K.jackFace('#1d1b1a', 120) })}${card(id, 330, 156, { rank: '2', suit: '♣', rot: 10, w: 120 })}
    <g transform="translate(480 230) rotate(-8)" ${K.sh(id)}><rect x="-60" y="-24" width="120" height="48" rx="10" fill="#c88a4a"/><rect x="-60" y="-24" width="120" height="10" rx="6" fill="#e0a85a"/>${Array.from({ length: 22 }, (_, i) => `<circle cx="${-50 + (i % 11) * 10}" cy="${-6 + Math.floor(i / 11) * 14}" r="2.5" fill="#3a1e0c"/>`).join('')}<rect x="-14" y="-30" width="5" height="22" rx="2" fill="#c8232a"/><rect x="24" y="-28" width="5" height="22" rx="2" fill="#2a4aa8"/></g>
    <text x="110" y="110" font-family="${SERIF}" font-style="italic" font-size="34" fill="#e9d29a" transform="rotate(-8 110 110)">Pitch!</text>
  `));

  cover('raven', id => shell(id, S('Raven', 'Bid for the nest, fear the Raven', ['#3a3a4a', '#1c1c26', '#08080c'], 30), `
    ${glow(id, 300, 150, 160, '#c0c8ff', .14)}
    <g transform="translate(300 250)" ${K.sh(id)}><ellipse rx="110" ry="26" fill="#3a2410"/>${Array.from({ length: 22 }, (_, i) => `<path d="M${-110 + i * 10} ${(i % 3) * 4 - 8} q30 -${10 + (i % 4) * 4} 60 0" stroke="#7a5a2a" stroke-width="3" fill="none"/>`).join('')}</g>
    ${[0, 1, 2, 3, 4].map(i => back(id, 240 + i * 30, 220 - Math.abs(i - 2) * 6, (i - 2) * 10, 70, '#2a2a3a')).join('')}
    ${K.bird(id, 300, 110, 1.3, 'raven', '#0e0c14', true)}
    <g transform="translate(130 130) rotate(-14)" ${K.sh(id)}><rect x="-42" y="-60" width="84" height="120" rx="8" fill="#fbf6ea"/><rect x="-34" y="-52" width="68" height="104" rx="5" fill="#1d1b22"/><text y="12" text-anchor="middle" font-family="${SERIF}" font-size="20" fill="#e9d29a">RAVEN</text></g>
  `));

  cover('missiontricks', id => {
    const crew = (x, y, n, c, r) => `<g transform="translate(${x} ${y}) rotate(${r})" ${K.sh(id)}><rect x="-38" y="-54" width="76" height="108" rx="9" fill="#fbf6ea"/><rect x="-30" y="-46" width="60" height="92" rx="5" fill="${c}"/><text y="16" text-anchor="middle" font-family="${SERIF}" font-size="46" fill="#fff">${n}</text></g>`;
    return shell(id, S('Mission Tricks', 'Co-op missions among the stars', ['#1a3a6a', '#0c1e38', '#040a14'], 26), `
      ${K.stars(90, 37, 400, .8)}
      <circle cx="480" cy="300" r="120" fill="#2a5a9a" opacity=".5"/><circle cx="480" cy="300" r="120" fill="url(#${id}-vig)"/>
      ${K.rocket(id, 300, 120, .9, 18)}
      ${crew(140, 190, 9, '#c8232a', -12)}${crew(215, 214, 4, '#2a6ad8', -4)}${crew(420, 210, 7, '#2a9a4a', 8)}${crew(495, 188, 2, '#e6b82a', 14)}
      ${[[150, 80], [470, 70]].map(([x, y]) => `<g transform="translate(${x} ${y})" ${K.sh(id)}><circle r="16" fill="url(#${id}-gold)"/><path d="M-7 0 l5 5 l9 -10" stroke="#3a2410" stroke-width="3" fill="none"/></g>`).join('')}
    `);
  });

  cover('schnapsen', id => shell(id, S('Schnapsen', 'A fast duel to sixty-six', ['#6a1a2a', '#380c14', '#140406']), `
    ${glow(id, 300, 150, 160, '#ffb0a0', .2)}
    ${card(id, 240, 165, { rank: 'K', suit: '♥', red: true, rot: -10, w: 128, face: K.kingFace(128) })}${card(id, 360, 165, { rank: 'Q', suit: '♥', red: true, rot: 10, w: 128, face: K.queenFace('#a3262a', 128) })}
    <g transform="translate(470 96)" ${K.sh(id)}><circle r="26" fill="none" stroke="url(#${id}-gold)" stroke-width="8"/><path d="M-12 -30 L-6 -40 H6 L12 -30 L0 -20 Z" fill="#e8f0ff" stroke="#9ab0c8"/></g>
    <text x="300" y="290" text-anchor="middle" font-family="${SERIF}" font-size="30" fill="#e9d29a" opacity=".8">66</text>
  `));

  cover('pinochle', id => shell(id, S('Pinochle', 'Bid, meld and take tricks', ['#5a3a1a', '#2e1e0c', '#100a04']), `
    ${K.felt(id, '#2a4a2a', 240)}
    ${card(id, 230, 160, { rank: 'Q', suit: '♠', rot: -14, w: 122, face: K.queenFace('#1d1b1a', 122) })}${card(id, 370, 160, { rank: 'J', suit: '♦', red: true, rot: 14, w: 122, face: K.jackFace('#a3262a', 122) })}
    ${card(id, 300, 140, { rank: 'A', suit: '♦', red: true, w: 112 })}
    <g transform="translate(470 270)" ${K.sh(id)}><rect x="-60" y="-26" width="120" height="52" rx="8" fill="#fbf6ea"/><text y="-6" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="10" letter-spacing="2" fill="#6a5a3a">MELD</text><text y="18" text-anchor="middle" font-family="${SERIF}" font-size="24" fill="#2a2018">40</text></g>
  `));

  cover('bridge', id => shell(id, S('Bridge', 'Auction the contract, then make it', ['#1a4a4a', '#0c2626', '#040e0e']), `
    ${K.felt(id, '#1a4a3a', 200)}
    <g transform="translate(300 160)" opacity=".85">${['N', 'E', 'S', 'W'].map((d, i) => `<text transform="rotate(${i * 90}) translate(0 -128)" text-anchor="middle" font-family="${SERIF}" font-size="22" fill="#e9d29a">${d}</text>`).join('')}<circle r="110" fill="none" stroke="url(#${id}-gold)" stroke-width="2"/><path d="M0 -110 L10 0 L0 110 L-10 0 Z M-110 0 L0 -10 L110 0 L0 10 Z" fill="url(#${id}-gold)" opacity=".5"/></g>
    ${[0, 1, 2, 3, 4, 5].map(i => card(id, 160 + i * 56, 150, { rank: ['A', 'K', 'Q', 'J', '10', '9'][i], suit: '♠', w: 74 })).join('')}
    <g transform="translate(300 262)" ${K.sh(id)}><rect x="-64" y="-24" width="128" height="48" rx="8" fill="#fbf6ea"/><text y="12" text-anchor="middle" font-family="${SERIF}" font-size="30" fill="#1d1b1a">4<tspan font-family="${SYM}">♠</tspan></text></g>
  `));

  cover('topdog', id => shell(id, S('Top Dog', 'First out wins the crown', ['#7a5a1a', '#402e0c', '#160e04'], 30), `
    ${glow(id, 300, 150, 160, '#ffe0a0', .22)}
    ${pile(id, 300, 230, 5, 110, '#4a2a6a')}
    ${card(id, 300, 180, { rank: '2', suit: '♠', w: 120, rot: -4 })}
    <g transform="translate(300 78)" ${K.sh(id)}><path d="M-50 20 L-60 -30 L-28 -4 L0 -46 L28 -4 L60 -30 L50 20 Z" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><rect x="-52" y="18" width="104" height="14" rx="3" fill="url(#${id}-gold)" stroke="#6a4a1a"/>${[-30, 0, 30].map(x => `<circle cx="${x}" cy="25" r="4" fill="#8a1f24"/>`).join('')}</g>
    <g transform="translate(470 250) rotate(20)" ${K.sh(id)}><path d="M-40 -8 a12 12 0 1 1 6 -14 h68 a12 12 0 1 1 6 14 a12 12 0 1 1 -6 14 h-68 a12 12 0 1 1 -6 -14 Z" fill="#f3ead6"/></g>
  `));

  cover('bigdeuce', id => shell(id, S('Big Deuce', 'Twos are king', ['#6a1a1a', '#380c0c', '#140404']), `
    ${glow(id, 300, 150, 160, '#ffa090', .2)}
    ${['♦', '♣', '♥', '♠'].map((s, i) => card(id, 210 + i * 60, 170 - Math.abs(i - 1.5) * 10, { rank: '2', suit: s, red: s === '♦' || s === '♥', rot: (i - 1.5) * 12, w: 116 })).join('')}
  `));

  cover('foolsdefense', id => shell(id, S('Fool’s Defense', 'Don’t be left holding cards', ['#4a1a6a', '#260c38', '#0c0414'], 30), `
    ${glow(id, 300, 150, 160, '#d0a0ff', .2)}
    <g transform="translate(300 120)" ${K.sh(id)}><path d="M-70 40 Q-90 -30 -120 -50 Q-60 -50 -30 0 Q-10 -70 0 -80 Q10 -70 30 0 Q60 -50 120 -50 Q90 -30 70 40 Z" fill="#8a1a3a"/><path d="M-30 0 Q-10 -70 0 -80 Q10 -70 30 0 Z" fill="#2a4a8a"/><rect x="-74" y="34" width="148" height="20" rx="6" fill="url(#${id}-gold)"/>${[[-120, -50], [0, -80], [120, -50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="url(#${id}-gold)" stroke="#6a4a1a"/>`).join('')}</g>
    ${card(id, 240, 236, { rank: '6', suit: '♠', w: 96, rot: -14 })}${card(id, 280, 246, { rank: '9', suit: '♠', w: 96, rot: 10 })}${card(id, 380, 236, { rank: 'K', suit: '♦', red: true, w: 96, rot: 6, face: K.kingFace(96) })}
  `));

  cover('thirtyone', id => shell(id, S('Thirty-One', 'Knock when you dare', ['#1a5a3a', '#0c2e1e', '#04100a']), `
    ${K.felt(id, '#185a3a', 250)}
    ${card(id, 220, 165, { rank: 'A', suit: '♣', rot: -14, w: 116 })}${card(id, 300, 152, { rank: 'K', suit: '♣', rot: 0, w: 116, face: K.kingFace(116) })}${card(id, 380, 165, { rank: '10', suit: '♣', rot: 14, w: 116 })}
    <g transform="translate(490 90)" ${K.sh(id)}><circle r="40" fill="#8a1a1a"/><circle r="32" fill="#a82424"/><text y="12" text-anchor="middle" font-family="${SERIF}" font-size="34" fill="#f3e2b0">31</text></g>
  `));

  cover('tonk', id => shell(id, S('Tonk', 'Spread it, or drop it', ['#5a2a1a', '#2e140c', '#100604']), `
    ${K.wood(id, 230, '#4a2a12')}
    ${[0, 1, 2].map(i => card(id, 120 + i * 46, 230, { rank: '7', suit: ['♠', '♥', '♣'][i], red: i === 1, w: 84 })).join('')}
    ${[0, 1, 2].map(i => card(id, 400 + i * 46, 236, { rank: ['5', '6', '7'][i], suit: '♦', red: true, w: 84 })).join('')}
    ${card(id, 300, 120, { rank: 'Q', suit: '♠', w: 100, rot: -6, face: K.queenFace('#1d1b1a', 100) })}${pile(id, 400, 110, 3, 80, '#5a2a1a')}
  `));

  cover('slapstack', id => shell(id, S('Slap Stack', 'Slap the doubles first', ['#7a2a2a', '#401414', '#160606'], 30), `
    ${K.wood(id, 250, '#4a2a12')}
    ${card(id, 270, 200, { rank: '7', suit: '♠', rot: -18, w: 116 })}${card(id, 320, 196, { rank: '7', suit: '♥', red: true, rot: 10, w: 116 })}
    <g transform="translate(300 150) rotate(-10)" ${K.sh(id)}><path d="M-40 60 Q-60 20 -50 -10 L-70 -60 Q-74 -76 -60 -78 Q-50 -78 -44 -64 L-30 -30 L-34 -90 Q-34 -104 -20 -104 Q-6 -104 -6 -90 L-4 -40 L2 -100 Q4 -114 18 -112 Q30 -110 30 -96 L26 -40 L40 -86 Q44 -98 56 -94 Q66 -90 62 -76 L48 -10 Q54 30 30 60 Z" fill="#e8c8a8" stroke="#8a6a4a" stroke-width="2"/></g>
    <g stroke="#ffd36a" stroke-width="5" stroke-linecap="round" opacity=".8"><path d="M170 120 l-26 -16 M160 160 l-30 0 M440 120 l26 -16 M450 160 l30 0"/></g>
  `));

  cover('speed', id => shell(id, S('Speed', 'No turns, just hands', ['#6a5a1a', '#382e0c', '#141004'], 30), `
    ${K.felt(id, '#2a4a2a', 240)}
    ${card(id, 230, 170, { rank: '8', suit: '♣', w: 116, rot: -4 })}${card(id, 370, 170, { rank: '9', suit: '♥', red: true, w: 116, rot: 4 })}
    <g stroke="#ffd36a" stroke-width="4" stroke-linecap="round" opacity=".75"><path d="M80 120 H150 M60 160 H150 M90 200 H150 M450 120 H520 M450 160 H540 M450 200 H510"/></g>
    <path d="M300 60 L276 130 H300 L286 190 L330 110 H304 L322 60 Z" fill="#ffd36a" filter="url(#${id}-glow)"/>
  `));

  cover('pairs', id => shell(id, S('Pairs', 'Flip, or fold?', ['#4a6a1a', '#26380c', '#0c1404'], 30), `
    ${glow(id, 300, 150, 160, '#e0ff90', .2)}
    ${[3, 7, 7, 10].map((n, i) => `<g transform="translate(${170 + i * 86} ${170 - (i === 1 || i === 2 ? 12 : 0)}) rotate(${(i - 1.5) * 7})" ${K.sh(id)}><rect x="-38" y="-54" width="76" height="108" rx="9" fill="#fbf6ea"/><text y="16" text-anchor="middle" font-family="${SERIF}" font-size="50" fill="${n === 7 ? '#b8232a' : '#2a4a2a'}">${n}</text>${n === 7 ? `<rect x="-38" y="-54" width="76" height="108" rx="9" fill="none" stroke="#ffd36a" stroke-width="4"/>` : ''}</g>`).join('')}
    <g transform="translate(300 64)" ${K.sh(id)}><path d="M0 -26 Q-30 -10 -24 20 Q-14 40 0 40 Q14 40 24 20 Q30 -10 0 -26 Z" fill="#b8c83a"/><path d="M0 -26 Q-4 -40 4 -46" stroke="#5a3a1a" stroke-width="4" fill="none"/><path d="M4 -40 q14 -8 20 0 q-10 6 -20 0 Z" fill="#3a8a2a"/><ellipse cx="-10" cy="4" rx="6" ry="12" fill="#fff" opacity=".3"/></g>
  `));

  cover('cardgolf', id => shell(id, S('Card Golf', 'Lowest score wins', ['#2a6a2a', '#143814', '#061406'], 26), `
    <path d="M0 200 Q300 150 600 200 V400 H0 Z" fill="#3a8a3a"/><ellipse cx="420" cy="196" rx="120" ry="30" fill="#4aa04a"/>
    <g transform="translate(440 190)" ${K.sh(id)}><ellipse rx="10" ry="4" fill="#1d1b1a"/><rect x="-2" y="-110" width="4" height="110" fill="#f3ead6"/><path d="M2 -110 L60 -94 L2 -78 Z" fill="#c8232a"/></g>
    <circle cx="380" cy="210" r="8" fill="#fff" ${K.sh(id)}/>
    ${[0, 1, 2, 3, 4, 5].map(i => (i === 1 || i === 4 ? back(id, 120 + (i % 3) * 64, 120 + Math.floor(i / 3) * 90, 0, 60, '#1f4a2a') : card(id, 120 + (i % 3) * 64, 120 + Math.floor(i / 3) * 90, { rank: ['K', '', '3', 'A', '', '5'][i], suit: ['♠', '', '♥', '♣', '', '♦'][i], red: i === 2 || i === 5, w: 60 }))).join('')}
  `));

  cover('cornerkings', id => shell(id, S('Corner Kings', 'Kings claim the corners', ['#6a4a1a', '#38260c', '#140c04'], 30), `
    ${K.felt(id, '#2a4a2a', 120)}
    ${pile(id, 300, 160, 3, 70, '#5a2a1a')}
    ${[[300, 70, 0, '5', '♠'], [400, 160, 90, '9', '♥'], [300, 250, 180, 'J', '♣'], [200, 160, -90, '4', '♦']].map(([x, y, r, rk, s]) => card(id, x, y, { rank: rk, suit: s, red: s === '♥' || s === '♦', rot: r, w: 66 })).join('')}
    ${[[200, 70, -45], [400, 70, 45], [400, 250, 135], [200, 250, -135]].map(([x, y, r], i) => card(id, x, y, { rank: 'K', suit: ['♠', '♥', '♣', '♦'][i], red: i % 2 === 1, rot: r, w: 66, face: K.kingFace(66) })).join('')}
  `));

  // ---- older card covers, repainted without emoji
  cover('oldmaid', id => shell(id, S('Old Maid', 'Pair up, don’t keep the Queen', ['#4a3560', '#261a32', '#0c0812']), `
    ${glow(id, 300, 150, 160, '#e0b0ff', .18)}
    ${[0, 1, 2, 3].map(i => back(id, 160 + i * 26, 190, -24 + i * 8, 100, '#4a3560')).join('')}
    ${card(id, 360, 160, { rank: 'Q', suit: '♣', w: 132, rot: 10, face: K.queenFace('#1d1b1a', 132) })}
    <g transform="translate(500 250)" ${K.sh(id)}><path d="M-30 30 Q-34 -10 -16 -20 L-24 -44 L-6 -28 Q0 -30 6 -28 L24 -44 L16 -20 Q34 -10 30 30 Z" fill="#2a2030"/><circle cx="-8" cy="-10" r="3" fill="#ffd36a"/><circle cx="8" cy="-10" r="3" fill="#ffd36a"/><path d="M30 26 Q56 20 50 -10" stroke="#2a2030" stroke-width="7" fill="none" stroke-linecap="round"/></g>
  `));

  cover('bento', id => {
    const nigiri = (x, y, c) => `<g transform="translate(${x} ${y})"><ellipse cy="6" rx="26" ry="12" fill="#fbf6ea"/><path d="M-28 0 Q0 -24 28 0 Q0 8 -28 0 Z" fill="${c}"/><path d="M-16 -6 l8 4 M0 -10 l8 4 M14 -8 l6 4" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></g>`;
    const maki = (x, y) => `<g transform="translate(${x} ${y})"><circle r="18" fill="#1a2a1a"/><circle r="14" fill="#fbf6ea"/><circle r="6" fill="#e8743a"/></g>`;
    const onigiri = (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 -28 Q26 18 22 22 H-22 Q-26 18 0 -28 Z" fill="#fbf6ea"/><rect x="-14" y="4" width="28" height="18" fill="#1a2a1a"/></g>`;
    return shell(id, S('Bento Box', 'Pick a card, pass the rest', ['#7a3a32', '#401c18', '#160806']), `
      <g transform="translate(300 170) scale(1 .75)" ${K.sh(id)}><rect x="-200" y="-120" width="400" height="240" rx="18" fill="#1a0e0a"/><rect x="-190" y="-110" width="380" height="220" rx="12" fill="#8a1a1a"/><path d="M-190 -110 h380" stroke="#fff" stroke-opacity=".2" stroke-width="4"/><rect x="-180" y="-100" width="170" height="200" rx="6" fill="#2a1410"/><rect x="0" y="-100" width="180" height="94" rx="6" fill="#2a1410"/><rect x="0" y="6" width="180" height="94" rx="6" fill="#2a1410"/></g>
      ${nigiri(170, 130, '#f08a5a')}${nigiri(240, 130, '#e8473c')}${nigiri(170, 190, '#f2cf9a')}${onigiri(245, 196)}
      ${maki(350, 126)}${maki(394, 126)}${maki(438, 126)}
      <g transform="translate(395 205)"><circle cx="-24" r="14" fill="#f3ead6"/><circle cx="0" r="14" fill="#7ac86a"/><circle cx="24" r="14" fill="#e88aa8"/><rect x="-46" y="-2" width="92" height="4" fill="#c8a060"/></g>
      <g transform="translate(470 70) rotate(30)" ${K.sh(id)}><rect x="-3" y="-90" width="6" height="180" rx="3" fill="#c8a060"/><rect x="9" y="-90" width="6" height="180" rx="3" fill="#c8a060"/></g>
    `);
  });

  cover('roadrally', id => shell(id, S('Road Rally', 'Drive a thousand miles', ['#5a6a3a', '#2e381e', '#0e1408'], 26), `
    <path d="M0 200 Q300 170 600 200 V400 H0 Z" fill="#4a6a2a"/>
    <path d="M200 400 L280 190 H320 L400 400 Z" fill="#3a3a3a"/><path d="M300 200 V400" stroke="#f3e7c0" stroke-width="5" stroke-dasharray="18 16"/>
    ${K.car(id, 300, 270, .9, '#b8232a')}
    <g transform="translate(120 160)" ${K.sh(id)}><rect x="-3" y="0" width="6" height="70" fill="#7a7a7a"/><rect x="-46" y="-26" width="92" height="36" rx="5" fill="#2a6a3a"/><text y="-2" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="15" fill="#fff">1000 MI</text></g>
    ${[[430, 140, '#e6b82a'], [500, 170, '#c8232a']].map(([x, y, c], i) => `<g transform="translate(${x} ${y}) rotate(${i ? 8 : -6})" ${K.sh(id)}><rect x="-36" y="-50" width="72" height="100" rx="8" fill="#fbf6ea"/><rect x="-28" y="-42" width="56" height="84" rx="5" fill="${c}"/><text y="10" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="${i ? 13 : 20}" fill="#fff">${i ? 'STOP' : '100'}</text></g>`).join('')}
  `));

  cover('unicorns', id => shell(id, S('Unicorn Chaos', 'Build a stable of seven', ['#6a3a7a', '#381e40', '#140a16'], 30), `
    ${K.stars(50, 41, 300, .6)}
    <path d="M60 300 Q300 120 540 300" stroke="#ff8ad8" stroke-width="14" fill="none" opacity=".5"/><path d="M80 300 Q300 140 520 300" stroke="#ffd36a" stroke-width="14" fill="none" opacity=".5"/><path d="M100 300 Q300 160 500 300" stroke="#7ad0ff" stroke-width="14" fill="none" opacity=".5"/>
    <g transform="translate(300 170)" ${K.sh(id)}><path d="M-40 80 Q-50 30 -30 0 Q-40 -30 -20 -50 L-6 -60 Q10 -64 30 -50 L58 -30 Q70 -20 60 -10 Q50 -4 38 -10 L20 -14 Q24 10 40 30 Q50 60 40 80 Z" fill="#fbf6ff"/><path d="M-6 -60 L-14 -120 L4 -62 Z" fill="url(#${id}-gold)"/><path d="M-30 0 Q-60 -10 -64 -50 Q-50 -30 -40 -40 Q-50 -60 -30 -76 Q-30 -60 -20 -50" fill="#ff8ad8"/><circle cx="24" cy="-38" r="4" fill="#2a1a3a"/><path d="M-20 -50 Q-10 -70 4 -62" fill="#ffd36a"/></g>
    ${K.sparkles([[150, 100, 1.2], [460, 120, 1], [400, 70, .7]])}
  `));

  cover('houserules', id => shell(id, S('House Rules', 'The rules keep changing', ['#5a3a1e', '#2e1e0e', '#100a04'], 30), `
    ${glow(id, 300, 150, 160, '#ffd0a0', .2)}
    ${K.book(id, 300, 160, 1.3, '#6a1a1a', { open: true, lines: false, inner: `<text x="-52" y="-20" text-anchor="middle" font-family="${SERIF}" font-size="14" fill="#2a1a10">RULE 1</text><text x="-52" y="2" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="12" fill="#3a2a1a">Draw one,</text><text x="-52" y="18" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="12" fill="#3a2a1a">play one.</text><text x="52" y="-20" text-anchor="middle" font-family="${SERIF}" font-size="14" fill="#2a1a10">RULE 2</text><text x="52" y="2" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="12" fill="#3a2a1a">Draw three!</text><path d="M20 -2 H84" stroke="#b8232a" stroke-width="2"/>` })}
    ${[0, 1, 2].map(i => `<g transform="translate(${130 + i * 170} ${270 + (i === 1 ? 12 : 0)}) rotate(${(i - 1) * 12})" ${K.sh(id)}><rect x="-34" y="-48" width="68" height="96" rx="8" fill="#fbf6ea"/><rect x="-26" y="-40" width="52" height="30" rx="4" fill="${['#2a6ad8', '#e6b82a', '#2a9a4a'][i]}"/><path d="M-22 4 H22 M-22 14 H18 M-22 24 H22" stroke="#7a6040" stroke-width="2.5" opacity=".6"/></g>`).join('')}
  `));

  cover('deepspace', id => shell(id, S('House Rules: Deep Space', 'Shifting rules among the stars', ['#18203a', '#0c101e', '#04060c'], 26), `
    ${K.stars(100, 43, 400, .9)}
    <circle cx="140" cy="110" r="50" fill="#c86a3a"/><ellipse cx="140" cy="110" rx="86" ry="16" fill="none" stroke="#e9d29a" stroke-width="5" transform="rotate(-18 140 110)"/>
    <circle cx="470" cy="250" r="80" fill="#2a5a9a"/><circle cx="470" cy="250" r="80" fill="url(#${id}-vig)"/>
    ${K.rocket(id, 330, 160, .8, 40)}
    <g transform="translate(470 100)" ${K.sh(id)}><ellipse rx="36" ry="30" fill="#5aa04a"/><circle cx="-12" cy="-6" r="9" fill="#fff"/><circle cx="12" cy="-6" r="9" fill="#fff"/><circle cx="-10" cy="-5" r="4" fill="#1d1b1a"/><circle cx="14" cy="-5" r="4" fill="#1d1b1a"/><path d="M-10 14 Q0 20 10 14" stroke="#1d1b1a" stroke-width="3" fill="none"/><path d="M-20 -24 l-10 -20 M20 -24 l10 -20" stroke="#5aa04a" stroke-width="4"/><circle cx="-30" cy="-44" r="5" fill="#ffd36a"/><circle cx="30" cy="-44" r="5" fill="#ffd36a"/></g>
  `));
}
