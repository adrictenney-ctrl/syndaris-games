// Painted covers: party, social and hidden-role games.
export default function paint(K) {
  const { cover, shell, card, glow, SERIF, UI } = K;
  const S = (title, tag, bg, cy = 34) => ({ title, tag, bg, cy });
  const person = (x, y, s, c, o = {}) => `<g ${K.at(x, y, s)}><circle cy="-58" r="20" fill="${o.skin || '#e8c8a8'}"/><path d="M-34 0 Q-34 -36 0 -36 Q34 -36 34 0 Z" fill="${c}"/>${o.hat ? `<path d="M-26 -70 h52 v6 h-52 Z M-16 -92 h32 l4 22 h-40 Z" fill="${o.hat}"/>` : ''}</g>`;
  const silhouette = (x, y, s, c = '#120e0c') => `<g ${K.at(x, y, s)} fill="${c}"><circle cy="-62" r="22"/><path d="M-40 0 Q-42 -40 0 -42 Q42 -40 40 0 Z"/></g>`;

  cover('storychain', id => shell(id, S('Story Chain', 'One line at a time', ['#4a2a5a', '#26142e', '#0e0612'], 30), `
    ${glow(id, 300, 150, 160, '#e0b0ff', .18)}
    ${[0, 1, 2].map(i => `<g transform="translate(${170 + i * 130} ${150 + (i % 2) * 24}) rotate(${(i - 1) * 7})" ${K.sh(id)}><rect x="-62" y="-80" width="124" height="160" fill="#f6eedb"/>${[0, 1, 2, 3, 4].map(k => `<path d="M-48 ${-56 + k * 18} H${40 - (k % 2) * 16}" stroke="#7a6040" stroke-width="2.5" opacity="${i === 2 && k > 1 ? .15 : .55}"/>`).join('')}<path d="M-62 50 H62" stroke="#c9b48c" stroke-dasharray="4 4"/><text y="72" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="13" fill="#6a5a3a">${['Once upon…', '…a dragon…', '…?'][i]}</text></g>`).join('')}
    ${[0, 1].map(i => `<g transform="translate(${235 + i * 130} 156)"><rect x="-16" y="-9" width="32" height="18" rx="9" fill="none" stroke="url(#${id}-gold)" stroke-width="5"/></g>`).join('')}
    ${K.quill(id, 520, 220, .6, 30)}
  `));

  cover('rateit', id => shell(id, S('Rate It', 'How would they score it?', ['#8a3a1a', '#481e0c', '#180a04'], 30), `
    ${K.stage(id)}
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n, i) => `<g transform="translate(${84 + i * 48} ${170 - (n === 8 ? 26 : 0)})" ${K.sh(id)}><rect x="-20" y="-28" width="40" height="56" rx="6" fill="${n === 8 ? '#ffd36a' : '#fffaf0'}"/><text y="11" text-anchor="middle" font-family="${SERIF}" font-size="${n === 10 ? 24 : 30}" fill="#2a2018">${n}</text></g>`).join('')}
  `));

  cover('topfive', id => shell(id, S('Top Five', 'Guess their ranking', ['#6a5a1a', '#3a300c', '#141004'], 30), `
    ${glow(id, 300, 150, 160, '#ffe0a0', .2)}
    ${[0, 1, 2, 3, 4].map(i => `<g transform="translate(300 ${66 + i * 44})" ${K.sh(id)}><rect x="${-150 + i * 8}" y="-18" width="${300 - i * 16}" height="36" rx="18" fill="${['#ffd36a', '#e8e0d0', '#d8a06a', '#fffaf0', '#fffaf0'][i]}"/><circle cx="${-130 + i * 8}" r="15" fill="#2a2018"/><text x="${-130 + i * 8}" y="6" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="15" fill="#fff">${i + 1}</text><path d="M${-100 + i * 8} 0 H${110 - i * 20}" stroke="#7a6040" stroke-width="4" opacity=".4"/></g>`).join('')}
  `));

  cover('mindmeld', id => shell(id, S('Mind Meld', 'Say the same word at once', ['#2a2a6a', '#141438', '#060614'], 30), `
    ${K.stars(40, 17, 260, .5)}
    <g ${K.sh(id)}>${[-1, 1].map(sx => `<g transform="translate(${300 + sx * 120} 210) scale(${-sx} 1)" fill="#0e0c1a"><path d="M-60 90 Q-70 40 -50 20 Q-80 -10 -66 -60 Q-50 -110 0 -110 Q50 -110 60 -60 Q64 -40 76 -24 Q70 -18 64 -14 Q70 0 60 6 Q64 20 50 26 Q30 30 30 50 L34 90 Z"/></g>`).join('')}</g>
    <path d="M200 120 C250 60 350 60 400 120" stroke="#ffd36a" stroke-width="4" fill="none" filter="url(#${id}-glow)" stroke-dasharray="4 8"/>
    ${K.bulb(id, 300, 76, .7)}
  `));

  cover('captionit', id => shell(id, S('Caption It', 'Write the funniest caption', ['#1a4a6a', '#0c2638', '#040e14'], 30), `
    ${K.frame(id, 300, 130, 250, 160, `<rect x="-125" y="-80" width="250" height="160" fill="#8ac0e0"/><path d="M-125 80 L-125 30 Q0 10 125 40 L125 80 Z" fill="#5a9a4a"/>${K.car(id, -40, 34, .5, '#b8232a')}<g transform="translate(60 -10)"><ellipse rx="34" ry="22" fill="#fff"/><circle cx="26" cy="-14" r="14" fill="#fff"/><circle cx="31" cy="-17" r="3" fill="#1d1b1a"/><path d="M-20 18 v16 M-6 20 v16 M10 20 v16 M22 18 v16" stroke="#1d1b1a" stroke-width="4"/></g>`)}
    ${K.bubble(id, 300, 266, 340, 44, '“Sheep requests a lift.”', { italic: true, fs: 20 })}
  `));

  cover('fakeartist', id => shell(id, S('Fake Artist', 'One artist doesn’t know the word', ['#6a1a2a', '#380c16', '#140408'], 30), `
    ${glow(id, 300, 150, 160, '#ffb0a0', .18)}
    <g transform="translate(300 150)" ${K.sh(id)}><path d="M-110 140 L-60 -110 M110 140 L60 -110 M0 -130 V140" stroke="#6a3a1a" stroke-width="10"/><rect x="-120" y="-100" width="240" height="170" fill="#fbf6ea"/><rect x="-128" y="70" width="256" height="12" fill="#7a4a22"/>
      <path d="M-70 30 Q-60 -40 0 -50" stroke="#c8232a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M0 -50 Q60 -40 70 20" stroke="#2a6ad8" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M70 20 Q30 40 -10 30" stroke="#2a9a4a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-30 -10 l20 30 l-40 10 l30 -50" stroke="#e6b82a" stroke-width="6" fill="none" stroke-linecap="round"/></g>
    <g transform="translate(470 110)" ${K.sh(id)}><ellipse rx="60" ry="18" fill="#2a2a2e"/><path d="M-50 0 Q-40 -30 0 -32 Q40 -30 50 0 Z" fill="#2a2a2e"/><circle cy="-34" r="6" fill="#2a2a2e"/></g>
    <text x="470" y="78" text-anchor="middle" font-family="${SERIF}" font-size="40" fill="#ffd36a">?</text>
  `));

  cover('copycat', id => shell(id, S('Copy Cat', 'Draw it from memory', ['#6a5a1a', '#38300c', '#141004'], 30), `
    ${K.frame(id, 180, 140, 160, 130, `<rect x="-80" y="-65" width="160" height="130" fill="#e8d8b0"/><circle cx="-20" cy="0" r="34" fill="#c8232a"/><path d="M10 40 L40 -30 L70 40 Z" fill="#2a4a8a"/><rect x="-70" y="-50" width="30" height="30" fill="#e6b82a"/>`, { rot: -4 })}
    ${K.frame(id, 420, 150, 160, 130, `<rect x="-80" y="-65" width="160" height="130" fill="#fbf6ea"/><circle cx="-16" cy="4" r="32" fill="none" stroke="#c8232a" stroke-width="4"/><path d="M14 40 L42 -24 L66 40 Z" fill="none" stroke="#2a4a8a" stroke-width="4"/><rect x="-66" y="-46" width="28" height="28" fill="none" stroke="#e6b82a" stroke-width="4"/>`, { rot: 5, bg: '#fbf6ea' })}
    ${K.pencil(id, 500, 250, .6, 40)}
    <path d="M270 150 h60" stroke="url(#${id}-gold)" stroke-width="4"/><path d="M330 140 l16 10 l-16 10 Z" fill="url(#${id}-gold)"/>
  `));

  cover('codecrack', id => {
    const ring = (r, n, txt, rot, c) => `<g transform="rotate(${rot})"><circle r="${r}" fill="${c}" stroke="url(#${id}-gold)" stroke-width="3"/>${Array.from({ length: n }, (_, i) => `<text transform="rotate(${i * 360 / n}) translate(0 ${-r + 16})" text-anchor="middle" font-family="${SERIF}" font-size="${r > 90 ? 17 : 15}" fill="#f3ead6">${txt[i % txt.length]}</text>`).join('')}</g>`;
    return shell(id, S('Code Crack', 'Coded clues, sneaky interceptions', ['#1a3a4a', '#0c1e26', '#040c10'], 30), `
      ${glow(id, 300, 150, 160, '#a0e0ff', .18)}
      <g transform="translate(300 150)" ${K.sh(id)}>${ring(118, 26, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 0, '#2a1a10')}${ring(86, 26, 'XYZABCDEFGHIJKLMNOPQRSTUVW', 7, '#5a3416')}<circle r="52" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><path d="M0 -118 V-70" stroke="#c8232a" stroke-width="4"/><text y="12" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="30" fill="#3a2410">4·1·3</text></g>
    `);
  });

  cover('undercover', id => shell(id, S('Undercover Spy', 'Everyone knows the place, except the spy', ['#2a2a3a', '#16161e', '#06060a'], 26), `
    <g opacity=".25" stroke="#e9d7ae" fill="none">${[0, 1, 2, 3, 4].map(i => `<path d="M0 ${70 + i * 60} Q300 ${40 + i * 60} 600 ${70 + i * 60}"/>`).join('')}</g>
    <path d="M300 -10 L170 330 L430 330 Z" fill="#fff3cf" opacity=".1"/>
    <g transform="translate(300 250)" ${K.sh(id)}><path d="M-90 0 Q-96 -90 0 -96 Q96 -90 90 0 Z" fill="#8a6a3a"/><path d="M-20 -96 L0 -40 L20 -96 Z" fill="#1d1b1a"/><path d="M-90 0 Q-96 -90 0 -96" stroke="#5a4020" stroke-width="3" fill="none"/><circle cy="-120" r="32" fill="#1a1612"/><path d="M-62 -140 Q0 -150 62 -140 Q40 -134 0 -134 Q-40 -134 -62 -140 Z" fill="#3a2a1a"/><path d="M-36 -140 Q-34 -184 0 -184 Q34 -184 36 -140 Z" fill="#3a2a1a"/><rect x="-36" y="-150" width="72" height="8" fill="#1a120a"/></g>
    ${[[120, 110], [480, 90], [520, 220]].map(([x, y]) => `<g transform="translate(${x} ${y})" ${K.sh(id)}><path d="M0 30 C-20 6 -20 -24 0 -24 C20 -24 20 6 0 30 Z" fill="#c8232a"/><circle cy="-6" r="8" fill="#fff"/></g>`).join('')}
    ${K.magnifier(id, 140, 250, .6, -40, `<text y="10" text-anchor="middle" font-family="${SERIF}" font-size="28" fill="#2a2018">?</text>`)}
  `));

  cover('mafianight', id => shell(id, S('Mafia Night', 'Secret roles after dark', ['#3a1424', '#1e0a12', '#0a0406'], 26), `
    ${K.stars(50, 23, 200, .6)}
    <circle cx="470" cy="80" r="40" fill="#f3ead6"/><circle cx="486" cy="70" r="36" fill="#1e0a12"/>
    <g fill="#0a0406">${[[0, 220, 70, 180], [60, 180, 60, 220], [120, 240, 80, 160], [200, 150, 60, 250], [260, 210, 90, 190], [350, 170, 60, 230], [410, 230, 80, 170], [490, 190, 110, 210]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}</g>
    ${[[80, 240], [220, 180], [230, 220], [380, 200], [520, 220], [140, 270]].map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="14" fill="#f5c46a" opacity=".8"/>`).join('')}
    <g transform="translate(300 170)" ${K.sh(id)}><ellipse cy="10" rx="120" ry="24" fill="#1a1414"/><path d="M-70 10 Q-74 -60 0 -64 Q74 -60 70 10 Z" fill="#2a2222"/><path d="M-70 -6 Q0 6 70 -6 L70 10 Q0 22 -70 10 Z" fill="#7a1a24"/><path d="M-20 -62 Q0 -48 20 -62" stroke="#1a1414" stroke-width="5" fill="none"/></g>
    <g transform="translate(150 140) rotate(-30)" ${K.sh(id)}><path d="M0 60 V-10" stroke="#2a4a1a" stroke-width="4"/><path d="M0 -10 C-20 -20 -20 -46 0 -50 C20 -46 20 -20 0 -10 Z" fill="#a8142a"/><path d="M-8 -30 Q0 -40 8 -30" stroke="#6a0a1a" stroke-width="2" fill="none"/></g>
  `));

  // ---- older party covers, repainted without emoji
  cover('oddoneout', id => shell(id, S('Odd One Out', 'Everyone knows the word, but one', ['#6a2a5a', '#3a142e', '#14060f'], 30), `
    ${K.stage(id)}
    ${[0, 1, 2, 3].map(i => card(id, 150 + i * 100, 170, { rank: '', w: 92, rot: (i - 1.5) * 4, face: `<text x="46" y="78" text-anchor="middle" font-family="${SERIF}" font-size="${i === 2 ? 42 : 18}" fill="${i === 2 ? '#b8232a' : '#2a2018'}">${i === 2 ? '?' : 'PIZZA'}</text>` })).join('')}
    ${K.mask(id, 350, 80, .55, -8, '#1d1b1a', { gold: true })}
  `));

  cover('mostlikely', id => shell(id, S('Most Likely To', 'Vote with the crowd', ['#aa4a2a', '#5a2414', '#1e0a04'], 30), `
    ${K.stage(id)}
    ${[0, 1, 2, 3, 4].map(i => person(130 + i * 85, 270 - (i === 2 ? 30 : 0), i === 2 ? 1.15 : .9, ['#2a4a8a', '#2a8a4a', '#b8232a', '#8a3ab8', '#e6b82a'][i])).join('')}
    <g transform="translate(300 120)" ${K.sh(id)}><path d="M-34 10 L-40 -26 L-18 -8 L0 -36 L18 -8 L40 -26 L34 10 Z" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><rect x="-36" y="10" width="72" height="12" rx="3" fill="url(#${id}-gold)"/></g>
    ${[130, 215, 385, 470].map(x => `<path d="M${x} 190 L${300 + (x - 300) * .3} 150" stroke="#ffd36a" stroke-width="2" stroke-dasharray="3 5" opacity=".6"/>`).join('')}
  `));

  cover('snapmatch', id => {
    const icons = {
      star: c => `<path d="M0 -14 L4 -4 L14 -4 L6 2 L9 12 L0 6 L-9 12 L-6 2 L-14 -4 L-4 -4 Z" fill="${c}"/>`,
      key: c => `<circle cx="-8" r="6" fill="none" stroke="${c}" stroke-width="3"/><path d="M-2 0 H14 M10 0 v5 M14 0 v5" stroke="${c}" stroke-width="3"/>`,
      moon: c => `<path d="M4 -12 A12 12 0 1 0 4 12 A9 9 0 1 1 4 -12 Z" fill="${c}"/>`,
      heart: c => `<path d="M0 10 C-14 0 -14 -12 -6 -12 C-2 -12 0 -8 0 -6 C0 -8 2 -12 6 -12 C14 -12 14 0 0 10 Z" fill="${c}"/>`,
      leaf: c => `<path d="M-12 10 Q-12 -12 12 -12 Q12 10 -12 10 Z" fill="${c}"/><path d="M-12 10 L6 -6" stroke="#fff" stroke-width="1.5" opacity=".6"/>`,
      anchor: c => `<path d="M0 -12 V12 M-10 4 Q0 18 10 4 M-6 -6 H6" stroke="${c}" stroke-width="3" fill="none"/><circle cy="-14" r="3" fill="none" stroke="${c}" stroke-width="2"/>`,
      sun: c => `<circle r="7" fill="${c}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0 -10 V-14" stroke="${c}" stroke-width="2.5" transform="rotate(${i * 45})"/>`).join('')}`,
      drop: c => `<path d="M0 -13 C8 -2 10 4 0 12 C-10 4 -8 -2 0 -13 Z" fill="${c}"/>`,
    };
    const disc = (x, y, r, set, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})" ${K.sh(id)}><circle r="${r}" fill="#fffaf0" stroke="url(#${id}-gold)" stroke-width="5"/>${set.map(([k, c, dx, dy, s], i) => `<g transform="translate(${dx} ${dy}) scale(${s}) rotate(${i * 50})">${icons[k](c)}</g>`).join('')}</g>`;
    return shell(id, S('Snap Match', 'Spot the match, tap first', ['#6a1a4a', '#380c26', '#14040c'], 30), `
      ${glow(id, 300, 150, 160, '#ffb0e0', .2)}
      ${disc(200, 160, 96, [['star', '#e6b82a', -40, -40, 1.8], ['key', '#8a3ab8', 30, -50, 1.6], ['moon', '#2a4a8a', 50, 10, 1.8], ['heart', '#c8232a', -10, 40, 2], ['leaf', '#2a8a4a', -50, 20, 1.6]], -10)}
      ${disc(410, 160, 96, [['anchor', '#2a4a8a', -40, -40, 1.6], ['heart', '#c8232a', 36, -36, 2], ['sun', '#e6b82a', 40, 30, 1.6], ['drop', '#2a8ad8', -20, 44, 1.8], ['leaf', '#2a8a4a', -50, 10, 1.4]], 12)}
      <path d="M195 200 Q300 260 450 125" stroke="#ffd36a" stroke-width="3" fill="none" stroke-dasharray="4 6" filter="url(#${id}-glow)"/>
    `);
  });

  cover('throwdown', id => shell(id, S('Throwdown', 'Rock, paper, scissors, bracket', ['#5a3a1a', '#2e1e0c', '#100a04'], 30), `
    ${glow(id, 300, 150, 160, '#ffd0a0', .18)}
    <g ${K.sh(id)}><path d="M110 200 Q90 150 130 120 Q170 100 200 130 Q230 160 210 200 Q180 230 140 222 Q118 218 110 200 Z" fill="#8a8478"/><path d="M130 140 Q160 126 186 140" stroke="#fff" stroke-opacity=".3" stroke-width="5" fill="none"/></g>
    <g transform="translate(300 160) rotate(6)" ${K.sh(id)}><rect x="-60" y="-76" width="120" height="152" fill="#fbf6ea"/>${[0, 1, 2, 3, 4].map(k => `<path d="M-44 ${-50 + k * 22} H40" stroke="#9fb6d6" stroke-width="2"/>`).join('')}<path d="M40 -76 L60 -56 L40 -56 Z" fill="#e3d6bb"/></g>
    <g transform="translate(480 160) rotate(-30)" ${K.sh(id)}><circle cx="-20" cy="40" r="18" fill="none" stroke="#b8232a" stroke-width="10"/><circle cx="20" cy="40" r="18" fill="none" stroke="#b8232a" stroke-width="10"/><path d="M-10 26 L18 -70 L22 -66 L4 30 Z M10 26 L-18 -70 L-22 -66 L-4 30 Z" fill="#d9dde3" stroke="#6a7480"/><circle cy="20" r="4" fill="#6a7480"/></g>
    <g stroke="url(#${id}-gold)" stroke-width="3" fill="none" opacity=".8"><path d="M140 270 V290 H300 V270 M300 290 V306 H460 V290 M460 290 V270"/></g>
  `));

  cover('oneclue', id => shell(id, S('One Clue', 'One-word clues, duplicates cancel', ['#1a5a5a', '#0e2e2e', '#041010'], 30), `
    ${K.stage(id)}
    ${['sweet', 'BEES', 'honey', 'sticky'].map((w, i) => `<g transform="translate(${135 + i * 110} ${186 + (i % 2) * 14})" ${K.sh(id)}><path d="M-46 30 L-40 -30 H40 L46 30 Z" fill="#fbf6ea"/><rect x="-50" y="30" width="100" height="10" fill="#7a4a22"/><text y="10" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="${w === 'BEES' ? 22 : 20}" fill="#2a2018">${w}</text>${w === 'sweet' || w === 'sticky' ? '' : ''}</g>`).join('')}
    <path d="M100 196 L170 176 M100 176 L170 196" stroke="#c8232a" stroke-width="0"/>
    ${card(id, 300, 86, { w: 70, rot: 0, face: `<text x="35" y="60" text-anchor="middle" font-family="${SERIF}" font-size="26" fill="#2a2018">?</text>` })}
  `));

  cover('samebrain', id => shell(id, S('Same Brain', 'Answer what everyone else answers', ['#2e481c', '#18260e', '#081004'], 30), `
    ${glow(id, 300, 150, 160, '#d0ffa0', .18)}
    ${[0, 1, 2].map(i => `${person(170 + i * 130, 290, .9, ['#2a4a8a', '#b8232a', '#e6b82a'][i])}${K.bubble(id, 170 + i * 130, 150, 116, 56, 'PIZZA', { fs: 22, font: UI })}`).join('')}
    ${K.sparkles([[100, 80, 1], [500, 90, .8], [300, 70, 1.2]])}
  `));

  cover('dreamcards', id => {
    const pic = (x, y, r, inner, sel) => K.picCard(id, x, y, r, 116, 164, `<rect x="-50" y="-72" width="100" height="144" rx="6" fill="#1a1a3a"/>${inner}${sel ? `<rect x="-58" y="-82" width="116" height="164" rx="10" fill="none" stroke="#ffd36a" stroke-width="4"/>` : ''}`);
    return shell(id, S('Dreamcards', 'A dreamy clue, which picture?', ['#2a1e4a', '#160e28', '#06040e'], 30), `
      ${K.stars(60, 29, 300, .6)}
      ${pic(170, 160, -12, `<circle cx="18" cy="-36" r="16" fill="#f3ead6"/><circle cx="26" cy="-40" r="14" fill="#1a1a3a"/><path d="M-50 72 L-50 30 Q-20 0 10 30 Q30 10 50 26 V72 Z" fill="#3a2a6a"/>`)}
      ${pic(300, 150, 0, `<ellipse cx="0" cy="10" rx="40" ry="18" fill="#3a6ab8"/><path d="M30 10 Q50 -10 46 -20 Q40 0 30 4 Z" fill="#3a6ab8"/><circle cx="-24" cy="6" r="3" fill="#fff"/>${K.sparkles([[-30, -40, .8], [24, -50, .6], [0, -20, .5]])}`, true)}
      ${pic(430, 160, 12, `<path d="M-30 72 V-10 L-18 -30 L-6 -10 V-40 L6 -60 L18 -40 V72 Z" fill="#6a4aa8"/><rect x="-4" y="0" width="8" height="12" fill="#ffd36a"/>`)}
      ${K.bubble(id, 300, 284, 270, 40, '“where the whale sleeps”', { italic: true, fs: 17 })}
    `);
  });

  cover('knowme', id => shell(id, S('Know Me', 'What did they really answer?', ['#5a1c2e', '#2e0e18', '#100408'], 26), `
    <path d="M300 -20 L200 310 L400 310 Z" fill="#fff3cf" opacity=".14"/>
    <ellipse cx="300" cy="300" rx="120" ry="20" fill="#fff3cf" opacity=".12"/>
    <g transform="translate(300 220)" ${K.sh(id)}><path d="M-60 -110 Q-62 -150 0 -150 Q62 -150 60 -110 L60 0 L-60 0 Z" fill="#8a1a2a"/><path d="M-52 -104 Q-54 -140 0 -140 Q54 -140 52 -104 L52 -6 L-52 -6 Z" fill="#a8243a"/><rect x="-80" y="-10" width="160" height="34" rx="10" fill="#8a1a2a"/><rect x="-80" y="-60" width="20" height="70" rx="8" fill="#7a1424"/><rect x="60" y="-60" width="20" height="70" rx="8" fill="#7a1424"/><path d="M-60 24 v50 M60 24 v50" stroke="url(#${id}-gold)" stroke-width="8"/>${[-30, 0, 30].map(x => `<circle cx="${x}" cy="-110" r="4" fill="url(#${id}-gold)"/>`).join('')}</g>
    ${K.bubble(id, 130, 100, 140, 50, 'Pizza?', { italic: true, fs: 20 })}${K.bubble(id, 470, 90, 140, 50, 'Tacos!', { italic: true, fs: 20, tail: 'r' })}
  `));

  cover('faceoff', id => shell(id, S('Face Off', 'Two answers enter, one wins', ['#c8562a', '#6a2a14', '#200a04'], 30), `
    ${K.stage(id)}
    ${K.bubble(id, 170, 150, 200, 110, '“free soup”', { italic: true, fs: 24 })}${K.bubble(id, 430, 150, 200, 110, '“a tiny horse”', { italic: true, fs: 22, tail: 'r' })}
    <g transform="translate(300 156)" ${K.sh(id)}><circle r="34" fill="#1d1b1a" stroke="url(#${id}-gold)" stroke-width="4"/><text y="11" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="28" fill="#ffd36a">VS</text></g>
    ${[0, 1, 2].map(i => `<path transform="translate(${140 + i * 30} 250)" d="M0 0 l6 8 l12 -16" stroke="#7ae09a" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}<path transform="translate(430 250)" d="M0 0 l6 8 l12 -16" stroke="#7ae09a" stroke-width="5" fill="none" stroke-linecap="round"/>
  `));

  cover('powergrab', id => shell(id, S('Power Grab', 'Claim any role, call the bluffs', ['#4a2a3a', '#26141e', '#0e060a'], 30), `
    ${glow(id, 300, 150, 160, '#ffb0c0', .18)}
    <g transform="translate(300 190)" ${K.sh(id)}><path d="M-80 60 L-70 -120 Q0 -150 70 -120 L80 60 Z" fill="#6a1a2a"/><path d="M-66 50 L-58 -104 Q0 -130 58 -104 L66 50 Z" fill="#8a2438"/><path d="M-70 -120 Q0 -150 70 -120" stroke="url(#${id}-gold)" stroke-width="6" fill="none"/><rect x="-100" y="40" width="200" height="30" rx="6" fill="url(#${id}-gold)"/><rect x="-96" y="-20" width="24" height="70" rx="8" fill="url(#${id}-gold)"/><rect x="72" y="-20" width="24" height="70" rx="8" fill="url(#${id}-gold)"/></g>
    ${['Duke', 'Spy', 'Thief'].map((r, i) => `<g transform="translate(${170 + i * 130} 250) rotate(${(i - 1) * 8})" ${K.sh(id)}><rect x="-40" y="-56" width="80" height="112" rx="8" fill="#fbf6ea"/><rect x="-32" y="-48" width="64" height="96" rx="5" fill="none" stroke="url(#${id}-gold)" stroke-width="2"/><text y="8" text-anchor="middle" font-family="${SERIF}" font-size="20" fill="#3a1a2a">${r}</text></g>`).join('')}
    <g transform="translate(300 90)" ${K.sh(id)}><path d="M-34 10 L-40 -26 L-18 -8 L0 -36 L18 -8 L40 -26 L34 10 Z" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/></g>
  `));

  cover('rebelcell', id => shell(id, S('Rebel Cell', 'Five missions, hidden spies', ['#2a3a3a', '#141e1e', '#060a0a'], 30), `
    <g opacity=".2" stroke="#9ae0d0">${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M0 ${40 + i * 50} H600"/>`).join('')}</g>
    ${[0, 1, 2, 3, 4].map(i => `<g transform="translate(${130 + i * 85} 110)" ${K.sh(id)}><circle r="30" fill="${['#2a8a5a', '#b8232a', '#2a8a5a', '#3a4a4a', '#3a4a4a'][i]}" stroke="url(#${id}-gold)" stroke-width="3"/><text y="9" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="22" fill="#f3ead6">${i + 1}</text></g>`).join('')}
    ${[0, 1, 2, 3, 4].map(i => silhouette(150 + i * 75, 300, .8 + (i === 2 ? .15 : 0), i === 3 ? '#3a0a0e' : '#0a0e0e')).join('')}
    <g transform="translate(375 214)"><ellipse rx="16" ry="6" fill="#c8232a" opacity=".85" filter="url(#${id}-glow)"/></g>
  `));

  cover('roundtable', id => shell(id, S('Round Table', 'Loyal knights, hidden traitors', ['#5a3a1e', '#2e1e0e', '#100a04'], 30), `
    ${glow(id, 300, 160, 170, '#ffd09a', .22)}
    <g transform="translate(300 180) scale(1 .5)" ${K.sh(id)}><circle r="190" fill="#3a2010"/><circle r="176" fill="#6a3a1a"/><circle r="176" fill="url(#${id}-vig)" opacity=".4"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 0 L${(176 * Math.cos(i * Math.PI / 4)).toFixed(1)} ${(176 * Math.sin(i * Math.PI / 4)).toFixed(1)}" stroke="#4a2810" stroke-width="3"/>`).join('')}<circle r="40" fill="url(#${id}-gold)"/></g>
    <g transform="translate(300 150) rotate(90)" ${K.sh(id)}><path d="M-6 -140 L6 -140 L8 50 L0 66 L-8 50 Z" fill="#d9dde3" stroke="#6a7480" stroke-width="2"/><rect x="-44" y="50" width="88" height="12" rx="4" fill="url(#${id}-gold)"/><rect x="-7" y="62" width="14" height="44" rx="4" fill="#5a3416"/><circle cy="112" r="10" fill="url(#${id}-gold)"/></g>
    ${[[130, 120, '#2a4a8a'], [470, 120, '#8a1a1a'], [150, 250, '#2a6a3a'], [450, 250, '#6a4a8a']].map(([x, y, c]) => `<g transform="translate(${x} ${y})" ${K.sh(id)}><path d="M-32 -38 H32 V0 Q32 34 0 46 Q-32 34 -32 0 Z" fill="${c}" stroke="url(#${id}-gold)" stroke-width="4"/><path d="M0 -30 V36 M-24 -6 H24" stroke="url(#${id}-gold)" stroke-width="5"/></g>`).join('')}
  `));
}
