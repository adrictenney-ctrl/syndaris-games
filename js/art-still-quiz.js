// Still-life covers: the quiz shows. A host's desk — cue cards, buzzers and the prop of the day.
export default function paint(K) {
  const { cover, shell, T } = K;
  const C = (id, title, tag, bg, body, z = 1.2) => shell(id, { title, tag, bg }, `${T.defs(id)}${T.zoom(body, z)}`);
  const shade = K.shade;
  // A host's cue card: a heading strip and a question in print.
  const cue = (id, head, q, o = {}) => { const w = o.w || 200, h = o.h || 130; return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="26" rx="6" fill="${o.c || '#2a2a5a'}"/><rect x="${-w / 2}" y="${-h / 2 + 18}" width="${w}" height="8" fill="${o.c || '#2a2a5a'}"/>${T.word(head, 0, -h / 2 + 18, 11, { font: K.UI, weight: 900, ls: 3, fill: '#f4eee0' })}${q.split('|').map((l, i) => T.word(l, 0, -h / 2 + 52 + i * 22, o.fs || 18, { weight: 600, italic: o.italic })).join('')}${o.inner || ''}`; };
  const buzz = (id, x, y, s, c) => T.stand(id, x, y + 20 * s, 90 * s, T.strip(K.buzzer(id, x, y, s, c)));
  const deskFlag = (id, x, y, design, cols) => T.stand(id, x, y, 24, T.strip(K.flag(id, x - 2, y - 100, .5, design, cols)).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`) + `<ellipse cx="${x - 1}" cy="${y}" rx="16" ry="5" fill="url(#${id}-brass)"/>`);
  const tile = (id, x, y, r, ch, o = {}) => T.lay(id, x, y, r, T.tile(ch, o.s || 46, o), { thin: true });

  cover('flagfrenzy', id => C(id, 'Flag Frenzy', 'Name the flag first', ['#2a5aa8', '#142c58', '#060c1c'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${deskFlag(id, 200, 220, 'tri', ['#1f4aa8', '#f3ead6', '#c8232a'])}${deskFlag(id, 300, 200, 'cross', ['#c8232a', '#f3ead6'])}${deskFlag(id, 400, 224, 'star', ['#1a7a4a', '#f2cf2a'])}
    ${T.lay(id, 300, 320, -4, cue(id, 'ROUND 3 · FLAGS', 'Which country?', { w: 220, h: 90 }))}
  `));

  cover('capitalquest', id => C(id, 'Capital Quest', 'Name the capital city', ['#5a3a8a', '#2c1c48', '#0c0818'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 260, 200, -6, `<rect x="-170" y="-110" width="340" height="220" fill="#e8dcbc"/><path d="M-150 -60 Q-80 -100 -10 -70 Q30 -20 -20 30 Q-100 60 -150 -60 Z M30 -80 Q100 -110 150 -40 Q140 40 60 60 Q20 0 30 -80 Z" fill="#c8b48a" stroke="#8a7a5a"/>${[[-60, -20], [90, -10]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#a8242a"/>`).join('')}`)}
    ${T.stand(id, 300, 190, 10, [[200, 186], [350, 194]].map(([x, y]) => `<path d="M${x} ${y} V${y - 30}" stroke="#8a8a92" stroke-width="2"/><circle cx="${x}" cy="${y - 32}" r="7" fill="#a8242a"/><circle cx="${x - 2}" cy="${y - 34}" r="2" fill="#fff" opacity=".7"/>`).join(''), { noShadow: true })}
    ${T.lay(id, 460, 300, 10, cue(id, 'CAPITALS', 'Peru?', { w: 150, h: 96 }))}
  `));

  cover('trueorfalse', id => {
    const paddle = (t, c) => `<rect x="-6" y="40" width="12" height="110" rx="5" fill="#8a5a2a"/><circle r="58" fill="${c}"/><circle r="50" fill="none" stroke="#f4eee0" stroke-width="2"/>${T.word(t, 0, 10, 28, { weight: 700, fill: '#f4eee0' })}`;
    return C(id, 'True or False?', 'Tap it, fast', ['#2a7a5a', '#143e2e', '#06140e'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 210, 200, -18, paddle('TRUE', '#2a7a4a'))}${T.lay(id, 390, 200, 16, paddle('FALSE', '#a8242a'))}
      ${T.lay(id, 300, 320, 0, cue(id, 'FACT 7', 'Owls can’t move their eyes.', { w: 230, h: 76, fs: 15, italic: true }))}
    `);
  });

  cover('emojiphrase', id => {
    const sun = `<circle r="16" fill="#f2c230"/>${Array.from({ length: 10 }, (_, i) => `<path d="M0 -20 V-27" stroke="#f2c230" stroke-width="3" stroke-linecap="round" transform="rotate(${i * 36})"/>`).join('')}`;
    const flower = `<g>${[0, 1, 2, 3, 4].map(i => `<ellipse cy="-12" rx="7" ry="11" fill="#e8607a" transform="rotate(${i * 72})"/>`).join('')}<circle r="7" fill="#f2c230"/></g>`;
    return C(id, 'Emoji Phrase', 'Decode the picture puzzle', ['#8a5a2a', '#4a2e14', '#180e06'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 300, 180, -3, cue(id, 'PICTURE PUZZLE', '', { w: 260, h: 140, inner: `<g transform="translate(-70 14)">${sun}</g>${T.word('+', -20, 22, 30, { weight: 700, fill: '#8a7a5a' })}<g transform="translate(30 14)">${flower}</g>${T.word('=', 80, 22, 30, { weight: 700, fill: '#8a7a5a' })}${T.word('?', 110, 26, 34, { weight: 700, fill: '#a8242a' })}` }))}
      ${'SUNFLOWER'.split('').map((ch, i) => tile(id, 120 + i * 44, 320 + (i % 2) * 4, (i % 3 - 1) * 4, ch, { s: 38 })).join('')}
    `);
  });

  cover('numbercrunch', id => {
    const abacus = `<rect x="-130" y="-80" width="260" height="160" rx="6" fill="none" stroke="#6a3a1a" stroke-width="12"/>${[0, 1, 2, 3, 4].map(r => `<path d="M-124 ${-56 + r * 28} H124" stroke="#c8b07a" stroke-width="2"/>${Array.from({ length: 10 }, (_, i) => `<ellipse cx="${(i < [3, 6, 2, 8, 4][r] ? -110 : 0) + (i < [3, 6, 2, 8, 4][r] ? i : i - [3, 6, 2, 8, 4][r]) * 14 + (i < [3, 6, 2, 8, 4][r] ? 0 : 24)}" cy="${-56 + r * 28}" rx="7" ry="10" fill="${['#a8242a', '#2a5ab8', '#c8902a', '#2a8a3a', '#7a3ab0'][r]}"/>`).join('')}`).join('')}`;
    return C(id, 'Number Crunch', 'Mental maths, at speed', ['#2a5a6a', '#142e38', '#060e14'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 270, 190, -6, abacus)}
      ${T.lay(id, 470, 290, 12, T.notepad(id, 130, 120, `${T.hand('17 × 4', -20, -10, 20, '#2a2a5a')}${T.hand('= 68', -10, 18, 22, '#a8242a')}`))}
    `);
  });

  cover('whichismore', id => C(id, 'Which Is More?', 'Bigger, older, faster', ['#7a2e5a', '#401834', '#16060f'], `
    ${T.surface(id, 'marble', { hz: 26, color: '#d8d2c6', lx: 300 })}
    ${T.stand(id, 300, 300, 120, T.strip(K.scales(id, 300, 190, 1.3, 12)).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`))}
    ${T.lay(id, 120, 300, -10, cue(id, 'A', 'Elephants', { w: 120, h: 70, c: '#2a5ab8' }))}${T.lay(id, 480, 300, 10, cue(id, 'B', 'Whales', { w: 120, h: 70, c: '#a8242a' }))}
  `));

  cover('missingvowels', id => C(id, 'Missing Vowels', 'The vowels vanished', ['#3e6a2a', '#203814', '#0a1406'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.stand(id, 300, 220, 300, `<g transform="translate(300 220)"><path d="M-180 0 L-190 -20 H190 L180 0 Z" fill="#6a3a1a"/></g>`)}
    ${['B', '', 'N', '', 'N', ''].map((c, i) => T.stand(id, 140 + i * 64, 196, 0, `<g transform="translate(${140 + i * 64} 176)"><rect x="-26" y="-26" width="52" height="52" rx="5" fill="${c ? '#f1dfb4' : '#3a3a30'}"/>${c ? T.word(c, 0, 12, 34, { weight: 700 }) : `<path d="M-10 14 H10" stroke="#8a8a70" stroke-width="3"/>`}</g>`, { noShadow: true })).join('')}
    ${['A', 'E', 'I', 'O', 'U'].map((c, i) => tile(id, 160 + i * 70, 320 + (i % 2) * 10, (i - 2) * 14, c, { s: 40, fill: '#ffd36a', edge: '#b07a1a' })).join('')}
  `));

  cover('wordscramble', id => C(id, 'Word Scramble', 'Unscramble before time’s up', ['#7a6028', '#3e3014', '#161006'], `
    ${T.surface(id, 'linen', { hz: 26, color: '#c8bc9c', lx: 300 })}
    ${'SCRAMBLE'.split('').map((c, i) => tile(id, 140 + ((i * 97) % 330), 140 + ((i * 53) % 150), (i * 37) % 70 - 35, c, { s: 50 })).join('')}
    ${T.stand(id, 500, 300, 40, T.strip(K.hourglass(id, 500, 250, .55, 0)))}
  `));

  cover('riddleme', id => C(id, 'Riddle Me This', 'Classic riddles', ['#44307a', '#22183e', '#0a0616'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1a12', lx: 380, ly: 170, light: .26 })}
    ${T.lay(id, 270, 200, -6, T.strip(K.book(id, 0, 0, 1.4, '#3a1a2a', { open: true, lines: false, inner: `${T.word('What has keys', -52, -10, 13, { italic: true })}${T.word('but opens', -52, 8, 13, { italic: true })}${T.word('no locks?', -52, 26, 13, { italic: true })}${T.word('?', 52, 16, 40, { weight: 700, fill: '#8a1a2a' })}` })))}
    ${T.stand(id, 470, 200, 40, T.strip(K.candle(id, 470, 200, .9, 100)))}
    <circle cx="470" cy="80" r="80" fill="#ffc860" opacity=".2" filter="url(#${id}-b8)"/>
  `));

  cover('doesntbelong', id => {
    const shp = [`<circle r="22" fill="#2a5ab8"/>`, `<circle r="22" fill="#2a8a3a"/>`, `<path d="M0 -24 L24 18 H-24 Z" fill="#a8242a"/>`, `<circle r="22" fill="#7a3ab0"/>`];
    return C(id, 'Doesn’t Belong', 'Spot the odd one out', ['#7a4228', '#3e2014', '#160a06'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#2a2a3a', lx: 300 })}
      ${shp.map((s, i) => T.lay(id, 150 + i * 100, 200, (i - 1.5) * 4, `<rect x="-42" y="-58" width="84" height="116" rx="8" fill="url(#${id}-paper)" stroke="${i === 2 ? '#c8a02a' : 'rgba(0,0,0,.2)'}" stroke-width="${i === 2 ? 4 : 1}"/>${s}`)).join('')}
      ${T.lay(id, 380, 300, -30, T.strip(K.magnifier(id, 0, 0, .9, 0)).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`), { tilt: .75 })}
    `);
  });

  cover('finishthesaying', id => C(id, 'Finish the Saying', 'Complete the proverb', ['#7a6044', '#3e3022', '#16100a'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 280, 200, -4, T.strip(K.book(id, 0, 0, 1.45, '#5a2a1a', { open: true, lines: false, inner: `${T.word('Every cloud', -52, -6, 15, { italic: true })}${T.word('has a…', -52, 14, 15, { italic: true })}${T.word('silver', 52, 4, 18, { italic: true, fill: '#8a6a2a' })}${T.word('lining', 52, 24, 18, { italic: true, fill: '#8a6a2a' })}` })))}
    ${T.lay(id, 480, 260, 30, T.strip(K.quill(id, 0, 0, 1.1, 0)), { thin: true })}
  `));

  cover('continentquest', id => C(id, 'Continent Quest', 'Where in the world?', ['#2a7a7a', '#143e3e', '#061616'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.stand(id, 280, 290, 100, T.strip(K.globe(id, 280, 190, 1.35)).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`))}
    ${T.lay(id, 470, 290, 14, `<circle r="44" fill="url(#${id}-brass)"/><circle r="36" fill="#fbf6ea"/>${['N', 'E', 'S', 'W'].map((d, i) => `<text transform="rotate(${i * 90}) translate(0 -24) rotate(${-i * 90})" y="4" text-anchor="middle" font-family="${T.DISPLAY}" font-weight="700" font-size="11" fill="#2a2018">${d}</text>`).join('')}<path d="M0 -20 L5 0 L0 20 L-5 0 Z" fill="#a8242a"/><path d="M0 20 L5 0 L-5 0 Z" fill="#1d1b1a"/>`, { tilt: .7 })}
    ${T.lay(id, 120, 300, -14, `<rect x="-44" y="-60" width="88" height="120" rx="5" fill="#2a3a5a"/><circle cy="-6" r="18" fill="none" stroke="url(#${id}-brass)" stroke-width="2"/>${T.word('PASSPORT', 0, 34, 11, { font: K.UI, weight: 900, ls: 2, fill: '#e8c87a' })}`)}
  `));

  cover('colorclash', id => {
    const cc = (w, ink) => `<rect x="-60" y="-40" width="120" height="80" rx="8" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/>${T.word(w, 0, 10, 28, { font: K.UI, weight: 900, fill: ink })}`;
    return C(id, 'Colour Clash', 'Read the ink, not the word', ['#6a2a6a', '#361436', '#120612'], `
      ${T.surface(id, 'felt', { hz: 26, color: '#2a2030', lx: 300 })}
      ${[['RED', '#2a6ad8', 180, 140, -10], ['BLUE', '#c89a2a', 340, 130, 6], ['GREEN', '#c8232a', 260, 220, -2], ['PINK', '#2a9a4a', 420, 220, 10], ['GOLD', '#e86ab8', 150, 280, -6]].map(([w, c, x, y, r]) => T.lay(id, x, y, r, cc(w, c))).join('')}
    `);
  });

  cover('countit', id => C(id, 'Count It', 'How many did you see?', ['#7a7a28', '#3e3e14', '#161606'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#2a3a2a', lx: 300 })}
    ${Array.from({ length: 17 }, (_, i) => T.lay(id, 300 + Math.sin(i * 2.4) * (40 + i * 9), 190 + Math.cos(i * 2.4) * (24 + i * 5), i * 30, T.chipTop(id, 14, ['#a8242a', '#2a5ab8', '#c8902a'][i % 3]), { thin: true })).join('')}
    ${T.lay(id, 480, 300, 10, T.notepad(id, 110, 110, `<g stroke="#2a2a5a" stroke-width="3">${[0, 1, 2, 3].map(i => `<path d="M${-30 + i * 9} -20 V10"/>`).join('')}<path d="M-34 4 L4 -16"/>${[0, 1].map(i => `<path d="M${16 + i * 9} -20 V10"/>`).join('')}</g>`))}
  `));

  cover('lastonestanding', id => C(id, 'Last One Standing', 'One wrong and you’re out', ['#7a2a2a', '#3e1414', '#160606'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1810', lx: 300 })}
    ${buzz(id, 140, 220, .7, '#5a5a60')}${buzz(id, 230, 210, .7, '#5a5a60')}${buzz(id, 370, 210, .7, '#5a5a60')}${buzz(id, 460, 220, .7, '#5a5a60')}
    ${buzz(id, 300, 236, .95, '#d8322a')}<circle cx="300" cy="210" r="70" fill="#ff6a4a" opacity=".2" filter="url(#${id}-b8)"/>
    ${T.stand(id, 300, 120, 40, T.strip(K.trophy(id, 300, 80, .5)).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`), { blur: 2 })}
  `));

  cover('buzzin', id => C(id, 'Buzz In', 'First right answer wins', ['#8a3a1a', '#4a1e0c', '#180904'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1810', lx: 300 })}
    ${buzz(id, 300, 200, 1.9, '#d8322a')}
    <circle cx="300" cy="170" r="110" fill="#ff6a4a" opacity=".16" filter="url(#${id}-b8)"/>
    ${T.lay(id, 120, 300, -12, cue(id, 'Q. 12', 'For 300…', { w: 130, h: 80 }))}
  `));

  cover('whatyear', id => C(id, 'What Year?', 'Closest guess wins', ['#5a4a2a', '#2e2614', '#100c06'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 230, 210, -6, `<rect x="-150" y="-110" width="300" height="220" fill="#ece4d0"/>${T.word('THE DAILY TIMES', 0, -78, 24, { weight: 700 })}<path d="M-136 -66 H136 M-136 -62 H136" stroke="#2a2018"/>${T.word('MEN WALK ON MOON', 0, -36, 20, { weight: 700 })}<rect x="-136" y="-20" width="120" height="90" fill="#8a8478"/>${T.lines(-6, -12, 140, 6, 14, '#6a5a44', { weight: 2.4, op: .45 })}`)}
    ${T.stand(id, 430, 260, 120, `<g transform="translate(430 230)">${'19??'.split('').map((d, i) => `<g transform="translate(${-66 + i * 44} 0)"><rect x="-20" y="-34" width="40" height="68" rx="5" fill="#1a1612"/><rect x="-18" y="-32" width="36" height="30" rx="3" fill="#2a2420"/>${T.word(d, 0, 16, 44, { weight: 700, fill: '#f4eee0' })}<rect x="-20" y="-1" width="40" height="2" fill="#0a0806"/></g>`).join('')}</g>`)}
  `));

  cover('nextinline', id => C(id, 'Next in Line', 'What comes next?', ['#2a3a7a', '#141c40', '#060816'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#1d2440', lx: 300 })}
    ${['2', '4', '8', '16', '?'].map((n, i) => T.lay(id, 120 + i * 92, 200, 0, `<rect x="-38" y="-52" width="76" height="104" rx="8" fill="${i === 4 ? '#c8a24a' : 'url(#' + id + '-paper)'}" stroke="rgba(0,0,0,.2)"/>${T.word(n, 0, 16, n.length > 1 ? 36 : 46, { weight: 700, fill: i === 4 ? '#fff' : '#1a2a5a' })}`)).join('')}
  `));

  cover('opposites', id => C(id, 'Opposites', 'Black and white, hot and cold', ['#4a4a5a', '#24242e', '#0a0a10'], `
    ${T.surface(id, 'marble', { hz: 26, color: '#d8d2c6', lx: 300 })}
    ${T.lay(id, 200, 200, -8, `<rect x="-70" y="-96" width="140" height="192" rx="10" fill="#16151a"/>${T.word('NIGHT', 0, 50, 22, { weight: 700, fill: '#f4eee0', ls: 3 })}<path d="M10 -50 A30 30 0 1 0 10 10 A22 22 0 1 1 10 -50 Z" fill="#f4eee0"/>`)}
    ${T.lay(id, 400, 200, 8, `<rect x="-70" y="-96" width="140" height="192" rx="10" fill="#fbf8f0" stroke="rgba(0,0,0,.2)"/>${T.word('DAY', 0, 50, 22, { weight: 700, fill: '#16151a', ls: 3 })}<circle cy="-20" r="22" fill="#e8b82a"/>${Array.from({ length: 10 }, (_, i) => `<path d="M0 -48 V-56" stroke="#e8b82a" stroke-width="3" transform="translate(0 -20) rotate(${i * 36}) translate(0 20)"/>`).join('')}`)}
  `));

  cover('cluecrack', id => {
    const grid = ['##C###', 'PUZZLE', '##O#A#', '#WORDS', '##S#E#'];
    let cells = '';
    grid.forEach((row, r) => [...row].forEach((ch, c) => { cells += ch === '#' ? `<rect x="${c * 34 - 102}" y="${r * 34 - 85}" width="34" height="34" fill="#1d1b1a"/>` : `<rect x="${c * 34 - 102}" y="${r * 34 - 85}" width="34" height="34" fill="#fbfaf4" stroke="#2a2018" stroke-width="1.4"/>${(r + c) % 3 ? T.hand(ch, c * 34 - 85, r * 34 - 59, 24, '#2a2a5a') : ''}`; }));
    return C(id, 'Clue Crack', 'Crossword clues, against the clock', ['#3a3a3a', '#1e1e1e', '#080808'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 280, 200, -6, `<rect x="-170" y="-120" width="340" height="240" fill="#ece4d0"/>${cells}${T.lines(110, -80, 50, 9, 14, '#6a5a44', { weight: 2, op: .45 })}`)}
      ${T.lay(id, 460, 300, -30, T.pencilFlat(170), { thin: true })}
    `);
  });

  cover('sortitout', id => C(id, 'Sort It Out', 'Put them in order', ['#1a5a3a', '#0e2e1e', '#04100a'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#1d4a32', lx: 300 })}
    ${[['1', '#2a8a4a'], ['2', '#2a6ad8'], ['3', '#c8902a'], ['4', '#a8242a']].map(([n, c], i) => T.lay(id, 150 + i * 100, 196 + [10, -6, 6, -10][i], [-6, 4, -3, 8][i], `<rect x="-42" y="-58" width="84" height="116" rx="8" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-42" y="-58" width="84" height="26" rx="8" fill="${c}"/><rect x="-42" y="-40" width="84" height="8" fill="${c}"/>${T.word(n, 0, 30, 50, { weight: 700 })}`)).join('')}
  `));

  cover('flashmemory', id => {
    const pol = (inner) => `<rect x="-62" y="-72" width="124" height="148" fill="#fbfaf6" stroke="rgba(0,0,0,.18)"/><g>${inner}</g>`;
    return C(id, 'Flash Memory', 'What was missing?', ['#3a2a4a', '#1e1428', '#0a060e'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 180, 190, -14, pol(`<rect x="-52" y="-62" width="104" height="104" fill="#2a4a7a"/><path d="M-52 30 L-10 -20 L20 14 L36 -4 L52 20 V42 H-52 Z" fill="#cfe0f0"/><circle cx="30" cy="-34" r="10" fill="#ffd36a"/>`))}
      ${T.lay(id, 300, 176, 2, pol(`<rect x="-52" y="-62" width="104" height="104" fill="#3a2a3a"/>${T.word('?', 0, 6, 60, { weight: 700, fill: '#f4eee0' })}`))}
      ${T.lay(id, 420, 196, 14, pol(`<rect x="-52" y="-62" width="104" height="104" fill="#2a6a3a"/><circle cy="-14" r="24" fill="#f2cf2a"/><path d="M0 10 V40" stroke="#4a8a2a" stroke-width="5"/>`))}
    `);
  });

  cover('triviawheel', id => {
    const cols = ['#3b82d6', '#e0559a', '#e8b923', '#9a6a3a', '#3aa856', '#ee7a2a'];
    const wheel = cols.map((c, i) => { const a0 = i / 6 * Math.PI * 2, a1 = (i + 1) / 6 * Math.PI * 2; return `<path d="M0 0 L${(120 * Math.cos(a0)).toFixed(1)} ${(120 * Math.sin(a0)).toFixed(1)} A120 120 0 0 1 ${(120 * Math.cos(a1)).toFixed(1)} ${(120 * Math.sin(a1)).toFixed(1)} Z" fill="${c}" stroke="#fbf8f0" stroke-width="4"/>`; }).join('');
    const pie = cols.slice(0, 4).map((c, i) => { const a0 = i / 6 * Math.PI * 2, a1 = (i + 1) / 6 * Math.PI * 2; return `<path d="M0 0 L${(30 * Math.cos(a0)).toFixed(1)} ${(30 * Math.sin(a0)).toFixed(1)} A30 30 0 0 1 ${(30 * Math.cos(a1)).toFixed(1)} ${(30 * Math.sin(a1)).toFixed(1)} Z" fill="${c}"/>`; }).join('');
    return C(id, 'Trivia Wheel', 'Spin, answer, collect all six', ['#4a3a7a', '#241c40', '#0a0816'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 280, 190, 0, `<circle r="132" fill="#2a2018"/>${wheel}<circle r="28" fill="#fbf8f0"/><path d="M0 -24 L8 4 H-8 Z" fill="#2a2018"/>`, { tilt: .62 })}
      ${T.lay(id, 470, 300, 0, `<circle r="34" fill="#efe8d8"/>${pie}<circle r="34" fill="none" stroke="#c8bca4" stroke-width="3"/>`, { tilt: .62 })}
    `);
  });

  cover('topanswers', id => C(id, 'Top Answers', 'Survey says…', ['#2a4aaa', '#14245a', '#060a1e'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1810', lx: 300 })}
    ${T.lay(id, 270, 190, -4, cue(id, 'WE SURVEYED 100 PEOPLE', 'Something you lose|every morning…', { w: 280, h: 150, fs: 17, italic: true }))}
    ${T.lay(id, 470, 290, 10, T.notepad(id, 130, 120, `${T.hand('Keys  45', -40, -18, 16, '#2a2a5a', { anchor: 'start' })}${T.hand('Phone 20', -40, 2, 16, '#2a2a5a', { anchor: 'start' })}${T.hand('Socks 12', -40, 22, 16, '#2a2a5a', { anchor: 'start' })}`))}
    ${buzz(id, 120, 300, .7, '#d8322a')}
  `));

  cover('answerboard', id => C(id, 'Answer Board', 'Pick a clue, answer fastest', ['#1a3aa8', '#0e1e5a', '#04081e'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1810', lx: 300 })}
    ${T.lay(id, 300, 190, 0, `<rect x="-220" y="-130" width="440" height="260" rx="6" fill="#0a1240"/>${[0, 1, 2, 3, 4].map(c => [0, 1, 2, 3].map(r => `<rect x="${-212 + c * 85}" y="${-122 + r * 63}" width="80" height="58" fill="${r === 0 ? '#1a2aa0' : '#1636c8'}"/>${r === 0 ? `<rect x="${-200 + c * 85}" y="-98" width="56" height="5" rx="2" fill="#fff" opacity=".7"/>` : (c + r) % 3 === 0 ? '' : T.word(`$${r * 200}`, -172 + c * 85, -84 + r * 63, 18, { font: K.UI, weight: 900, fill: '#f2cf2a' })}`).join('')).join('')}`, { tilt: TILT_Q })}
  `));
  const TILT_Q = .62;

  cover('spinsolve', id => C(id, 'Spin & Solve', 'Spin, call a letter, solve it', ['#2a7a6a', '#144038', '#061814'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1810', lx: 300 })}
    ${T.lay(id, 190, 200, 0, `<circle r="112" fill="#2a2018"/>${Array.from({ length: 12 }, (_, i) => { const a0 = i / 12 * Math.PI * 2, a1 = (i + 1) / 12 * Math.PI * 2; return `<path d="M0 0 L${(104 * Math.cos(a0)).toFixed(1)} ${(104 * Math.sin(a0)).toFixed(1)} A104 104 0 0 1 ${(104 * Math.cos(a1)).toFixed(1)} ${(104 * Math.sin(a1)).toFixed(1)} Z" fill="${['#e0382c', '#f39a1e', '#f2cf2a', '#36a852', '#2f7de1', '#8b45c8'][i % 6]}"/>`; }).join('')}<circle r="18" fill="url(#${id}-brass)"/>`, { tilt: .62 })}
    ${T.stand(id, 420, 240, 200, `<g transform="translate(420 190)"><rect x="-110" y="-44" width="220" height="88" rx="6" fill="#1a5a4a"/>${[...'S_IN_'].map((c, i) => `<rect x="${-100 + i * 41}" y="-34" width="37" height="68" rx="3" fill="${c === '_' ? '#2a8a6a' : '#fbf8f0'}"/>${c === '_' ? '' : T.word(c, -81 + i * 41, 14, 36, { font: K.UI, weight: 900 })}`).join('')}</g>`)}
  `));
}
