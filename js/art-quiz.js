// Painted covers: the quiz shows. Each one is a game-show set with its own prop.
export default function paint(K) {
  const { cover, shell, card, glow, SERIF, UI } = K;
  const CHALK = "'Cormorant Garamond', Georgia, serif";
  const S = (title, tag, bg, cy = 34) => ({ title, tag, bg, cy });
  const podium = (id, x, y, c, label = '') => `<g ${K.at(x, y)} ${K.sh(id)}><path d="M-46 0 h92 l-8 70 h-76 Z" fill="${c}"/><rect x="-50" y="-10" width="100" height="14" rx="3" fill="url(#${id}-gold)"/><rect x="-30" y="16" width="60" height="26" rx="4" fill="#0c0a08" opacity=".7"/><text y="35" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="14" fill="#ffe08a">${label}</text></g>`;
  const screen = (id, x, y, w, h, inner) => `<g ${K.at(x, y)} ${K.sh(id)}><rect x="${-w / 2 - 10}" y="${-h / 2 - 10}" width="${w + 20}" height="${h + 20}" rx="10" fill="#1a1410" stroke="url(#${id}-gold)" stroke-width="4"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4" fill="#0e1a3a"/>${inner}</g>`;

  cover('flagfrenzy', id => shell(id, S('Flag Frenzy', 'Name the flag first', ['#2a5aa8', '#142c58', '#060c1c'], 30), `
    ${K.stage(id)}
    ${K.flag(id, 120, 110, .9, 'tri', ['#1f4aa8', '#f3ead6', '#c8232a'], -6)}
    ${K.flag(id, 250, 74, 1.15, 'cross', ['#c8232a', '#f3ead6'], 2)}
    ${K.flag(id, 400, 100, .95, 'star', ['#1a7a4a', '#f2cf2a'], 6)}
    ${K.flag(id, 500, 150, .7, 'stripes', ['#1d1b1a', '#c8232a', '#f2cf2a'], -4)}
  `));

  cover('capitalquest', id => shell(id, S('Capital Quest', 'Name the capital city', ['#5a3a8a', '#2c1c48', '#0c0818'], 30), `
    ${glow(id, 300, 140, 150, '#c8a0ff', .22)}
    <g opacity=".22" stroke="#e9d7ae" fill="none">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M0 ${60 + i * 50} Q300 ${40 + i * 50} 600 ${60 + i * 50}"/>`).join('')}${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${i * 100} 0 Q${i * 100 + 20} 200 ${i * 100} 400"/>`).join('')}</g>
    ${K.temple(id, 300, 170, 1.25)}
    <g transform="translate(470 96)" ${K.sh(id)}><path d="M0 40 C-26 10 -26 -30 0 -30 C26 -30 26 10 0 40 Z" fill="#c8232a"/><circle cy="-6" r="10" fill="#fff"/></g>
    ${K.sparkles([[150, 80, 1], [520, 210, .7]])}
  `));

  cover('trueorfalse', id => shell(id, S('True or False?', 'Tap it, fast', ['#2a7a5a', '#143e2e', '#06140e'], 30), `
    ${K.stage(id)}
    ${K.buzzer(id, 200, 190, 1.35, '#2a9a4a')}${K.buzzer(id, 400, 190, 1.35, '#c8232a')}
    <g font-family="${SERIF}" font-size="44" text-anchor="middle" fill="#f3ead6" filter="url(#${id}-glow)"><text x="200" y="110">True</text><text x="400" y="110">False</text></g>
  `));

  cover('emojiphrase', id => shell(id, S('Emoji Phrase', 'Decode the picture puzzle', ['#8a5a2a', '#4a2e14', '#180e06'], 30), `
    ${screen(id, 300, 140, 380, 150, `${K.face(id, -120, 0, .8, 'smile', '#f2c94a')}<text x="-62" y="12" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="34" fill="#ffe08a">+</text>${K.bulb(id, 0, -8, .55)}<text x="62" y="12" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="34" fill="#ffe08a">=</text><text x="124" y="22" text-anchor="middle" font-family="${SERIF}" font-size="64" fill="#fff">?</text>`)}
    ${K.tile(id, 210, 276, 44, 'B')}${K.tile(id, 260, 276, 44, 'R')}${K.tile(id, 310, 276, 44, 'I')}${K.tile(id, 360, 276, 44, 'G')}${K.tile(id, 410, 276, 44, '?', { fill: '#ffd36a' })}
  `));

  cover('numbercrunch', id => shell(id, S('Number Crunch', 'Mental maths, at speed', ['#2a5a6a', '#142e38', '#060e14'], 30), `
    ${K.chalkboard(id, 300, 150, 400, 190, `<g font-family="${CHALK}" fill="#f3ead6" opacity=".92"><text x="-170" y="-30" font-size="44">17 × 4</text><text x="-60" y="30" font-size="56">= 68</text><text x="70" y="-36" font-size="30" opacity=".7">√144</text><text x="96" y="40" font-size="30" opacity=".7">9²</text></g><path d="M-170 48 Q-120 60 -70 46" stroke="#f3ead6" stroke-width="2" fill="none" opacity=".5"/>`)}
    ${K.stopwatch(id, 500, 260, .62, { hand: 120 })}
  `));

  cover('whichismore', id => shell(id, S('Which Is More?', 'Bigger, older, faster…', ['#7a2e5a', '#401834', '#16060f'], 30), `
    ${glow(id, 300, 130, 160, '#ffb0d0', .2)}
    ${K.scales(id, 300, 150, 1.3, 12)}
    <g ${K.sh(id)}>${K.gem(id, 196, 108, .45, '#3ab0e8')}<path d="M380 140 l-26 -36 h52 Z M380 98 l-26 36 h52 Z" fill="#f3ead6" opacity="0"/></g>
    ${K.coins(id, 404, 150, 4, .55)}
  `));

  cover('missingvowels', id => shell(id, S('Missing Vowels', 'The vowels vanished', ['#3e6a2a', '#203814', '#0a1406'], 30), `
    ${glow(id, 300, 150, 160, '#c0f0a0', .18)}
    ${['B', '', 'N', '', 'N', ''].map((c, i) => K.tile(id, 150 + i * 60, 150, 54, c || '·', c ? {} : { fill: '#2a3a20', ink: '#7a9a60', edge: '#141e0e' })).join('')}
    ${['A', 'E', 'I', 'O', 'U'].map((c, i) => K.tile(id, 170 + i * 64, 260 + (i % 2) * 14, 40, c, { rot: (i - 2) * 14, fill: '#ffd36a', edge: '#b07a1a' })).join('')}
  `));

  cover('wordscramble', id => shell(id, S('Word Scramble', 'Unscramble before time’s up', ['#7a6028', '#3e3014', '#161006'], 30), `
    ${glow(id, 300, 150, 160, '#ffe0a0', .2)}
    ${'SCRAMBLE'.split('').map((c, i) => K.tile(id, 120 + i * 52 + (i % 2 ? 6 : -6), 140 + Math.sin(i * 1.7) * 34, 50, c, { rot: (i * 37 % 50) - 25 })).join('')}
    <path d="M150 250 C250 300 360 300 450 246" stroke="url(#${id}-gold)" stroke-width="4" fill="none"/><path d="M452 232 l12 18 l-22 4 Z" fill="url(#${id}-gold)"/>
  `));

  cover('riddleme', id => shell(id, S('Riddle Me This', 'Classic riddles', ['#44307a', '#22183e', '#0a0616'], 30), `
    ${K.stars(40, 4, 260, .5)}
    ${K.scroll(id, 270, 160, 1.15, { rot: -4, inner: `<text y="-14" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="15" fill="#4a3420">What has keys</text><text y="6" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="15" fill="#4a3420">but opens no locks?</text><text y="40" text-anchor="middle" font-family="${SERIF}" font-size="30" fill="#8a2a2a">?</text>` })}
    ${K.candle(id, 470, 280, .9, 100)}
    ${K.quill(id, 130, 230, .7, -30)}
  `));

  cover('doesntbelong', id => shell(id, S('Doesn’t Belong', 'Spot the odd one out', ['#7a4228', '#3e2014', '#160a06'], 30), `
    ${K.stage(id)}
    ${[0, 1, 2, 3].map(i => `<g transform="translate(${135 + i * 110} 160)" ${K.sh(id)}><rect x="-46" y="-56" width="92" height="112" rx="10" fill="${i === 2 ? '#ffd36a' : '#fffaf0'}"/>${i === 2 ? `<path d="M0 -30 L26 20 H-26 Z" fill="#b8232a"/>` : `<circle r="26" fill="${['#2a6ad8', '#2a9a4a', '', '#8a3ac8'][i]}"/>`}</g>`).join('')}
    ${K.magnifier(id, 395, 230, .55, -30)}
  `));

  cover('wildfacts', id => shell(id, S('Wild Facts', 'Animal trivia', ['#3e7a3e', '#1e3e1e', '#081608'], 26), `
    <circle cx="300" cy="190" r="110" fill="#f2a03a" opacity=".85" filter="url(#${id}-glow)"/>
    <path d="M0 250 Q300 226 600 250 V400 H0 Z" fill="#3a2a10"/>
    <g fill="#1a120a"><path d="M150 250 Q148 200 160 170" stroke="#1a120a" stroke-width="10" fill="none"/><path d="M90 168 Q160 130 230 168 Q160 158 90 168 Z"/><path d="M110 160 Q160 140 210 160" stroke="#1a120a" stroke-width="14" fill="none" stroke-linecap="round"/>
    <g transform="translate(-50 -25) scale(1.1)"><path d="M380 250 L384 190 Q388 170 380 150 L376 90 Q374 76 386 74 L392 64 L396 76 Q404 80 400 92 L396 150 Q404 170 414 190 L470 196 Q486 200 488 220 L486 250 L478 250 L476 222 L466 252 L458 252 L460 220 L410 214 L404 252 L396 252 L396 214 L390 252 Z"/></g></g>
    ${[[230, 290], [262, 318], [300, 300], [336, 328]].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(-20)" fill="#e9d29a" opacity=".7"><ellipse rx="9" ry="11"/><circle cx="-10" cy="-14" r="4"/><circle cx="0" cy="-18" r="4"/><circle cx="10" cy="-14" r="4"/></g>`).join('')}
  `));

  cover('finishthesaying', id => shell(id, S('Finish the Saying', 'Complete the proverb', ['#7a6044', '#3e3022', '#16100a'], 30), `
    ${glow(id, 300, 150, 160, '#ffe0b0', .22)}
    ${K.book(id, 300, 170, 1.35, '#5a2a1a', { open: true, lines: false, inner: `<text x="-52" y="-6" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="16" fill="#3a2a1a">Every cloud</text><text x="-52" y="16" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="16" fill="#3a2a1a">has a…</text><text x="52" y="12" text-anchor="middle" font-family="${SERIF}" font-size="30" fill="#8a2a2a">“ ? ”</text>` })}
    ${K.quill(id, 470, 160, .75, 24)}
  `));

  cover('continentquest', id => shell(id, S('Continent Quest', 'Where in the world?', ['#2a7a7a', '#143e3e', '#061616'], 30), `
    ${K.stars(40, 9, 400, .4)}
    ${glow(id, 300, 150, 150, '#a0f0ff', .2)}
    ${K.globe(id, 300, 140, 1.45)}
    <g transform="translate(470 230) rotate(20)" ${K.sh(id)}><circle r="40" fill="url(#${id}-gold)"/><circle r="32" fill="#fbf6ea"/><path d="M0 -26 L7 0 L0 26 L-7 0 Z" fill="#b8232a"/><path d="M0 26 L7 0 L-7 0 Z" fill="#1d1b1a"/><text y="-12" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="8" fill="#1d1b1a" dy="-6">N</text></g>
  `));

  cover('colorclash', id => shell(id, S('Colour Clash', 'Read the ink, not the word', ['#6a2a6a', '#361436', '#120612'], 30), `
    ${glow(id, 300, 150, 160, '#ff90ff', .18)}
    <g font-family="${SERIF}" text-anchor="middle" ${K.sh(id)}>
      <text x="170" y="110" font-size="62" fill="#3a8ae8">RED</text><text x="420" y="96" font-size="54" fill="#f2cf2a" transform="rotate(4 420 96)">BLUE</text>
      <text x="300" y="190" font-size="74" fill="#e8473c">GREEN</text><text x="150" y="250" font-size="48" fill="#36c86a" transform="rotate(-5 150 250)">PINK</text><text x="450" y="250" font-size="52" fill="#ff7ad8">GOLD</text>
    </g>
  `));

  cover('countit', id => {
    const shapes = Array.from({ length: 23 }, (_, i) => { const x = 120 + ((i * 97) % 360), y = 70 + ((i * 53) % 170), c = ['#e8473c', '#3a8ae8', '#f2cf2a', '#36a852'][i % 4]; return i % 3 === 0 ? `<circle cx="${x}" cy="${y}" r="14" fill="${c}"/>` : i % 3 === 1 ? `<rect x="${x - 12}" y="${y - 12}" width="24" height="24" rx="3" fill="${c}" transform="rotate(${i * 20} ${x} ${y})"/>` : `<path d="M${x} ${y - 15} L${x + 14} ${y + 11} L${x - 14} ${y + 11} Z" fill="${c}"/>`; }).join('');
    return shell(id, S('Count It', 'How many did you see?', ['#7a7a28', '#3e3e14', '#161606'], 30), `
      ${K.stage(id)}
      <g ${K.sh(id)}>${shapes}</g>
      <g transform="translate(500 270)" ${K.sh(id)}><rect x="-50" y="-34" width="100" height="68" rx="10" fill="#0c0a08" stroke="url(#${id}-gold)" stroke-width="3"/><text y="18" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="44" fill="#ffe08a">23?</text></g>
    `);
  });

  cover('lastonestanding', id => shell(id, S('Last One Standing', 'One wrong and you’re out', ['#7a2a2a', '#3e1414', '#160606'], 30), `
    ${K.stage(id, ['#ff8a6a', '#ffe0b0'])}
    <path d="M300 -20 L210 300 L390 300 Z" fill="#fff3cf" opacity=".12"/>
    ${podium(id, 120, 220, '#3a2a2a', '✗')}${podium(id, 220, 220, '#3a2a2a', '✗')}${podium(id, 380, 220, '#3a2a2a', '✗')}${podium(id, 480, 220, '#3a2a2a', '✗')}
    ${podium(id, 300, 200, '#b8232a', '★')}${K.trophy(id, 300, 110, .7)}
  `));

  cover('buzzin', id => shell(id, S('Buzz In', 'First right answer wins', ['#8a3a1a', '#4a1e0c', '#180904'], 30), `
    ${K.stage(id)}
    <g opacity=".75" stroke="#ffe08a" stroke-width="5" stroke-linecap="round">${[[-1, -1], [1, -1], [-1.3, 0], [1.3, 0]].map(([dx, dy]) => `<path d="M${300 + dx * 120} ${150 + dy * 70} l${dx * 30} ${dy * 26}"/>`).join('')}</g>
    ${K.buzzer(id, 300, 180, 2.1, '#d8322a', { label: 'BUZZ' })}
  `));

  cover('whatyear', id => shell(id, S('What Year?', 'Closest guess wins', ['#5a4a2a', '#2e2614', '#100c06'], 30), `
    ${glow(id, 300, 150, 160, '#ffe0a0', .2)}
    <g ${K.sh(id)}>${'1969'.split('').map((d, i) => `<g transform="translate(${165 + i * 90} 150)"><rect x="-38" y="-62" width="76" height="124" rx="8" fill="#1a1612"/><rect x="-34" y="-58" width="68" height="56" rx="5" fill="#2a2420"/><rect x="-34" y="2" width="68" height="56" rx="5" fill="#221e1a"/><text y="32" text-anchor="middle" font-family="${SERIF}" font-size="90" fill="#f3ead6">${d}</text><rect x="-38" y="-2" width="76" height="4" fill="#0a0806"/></g>`).join('')}</g>
    ${K.hourglass(id, 520, 270, .55, 12)}
  `));

  cover('nextinline', id => shell(id, S('Next in Line', 'What comes next?', ['#2a3a7a', '#141c40', '#060816'], 30), `
    ${K.stage(id)}
    ${['2', '4', '8', '16', '?'].map((n, i) => `<g transform="translate(${120 + i * 92} ${150 + (i % 2 ? 10 : -10)})" ${K.sh(id)}><circle r="38" fill="${i === 4 ? '#ffd36a' : '#fffaf0'}" stroke="url(#${id}-gold)" stroke-width="4"/><text y="${n.length > 1 ? 12 : 14}" text-anchor="middle" font-family="${SERIF}" font-size="${n.length > 1 ? 34 : 40}" fill="#2a1a40">${n}</text></g>`).join('')}
    ${[0, 1, 2, 3].map(i => `<path d="M${160 + i * 92} 150 h12" stroke="url(#${id}-gold)" stroke-width="3"/>`).join('')}
  `));

  cover('opposites', id => shell(id, S('Opposites', 'Black and white, hot and cold', ['#4a4a5a', '#24242e', '#0a0a10'], 30), `
    <g transform="translate(300 160)" ${K.sh(id)}><circle r="110" fill="#f3ead6"/><path d="M0 -110 A110 110 0 0 1 0 110 A55 55 0 0 1 0 0 A55 55 0 0 0 0 -110 Z" fill="#1a1a22"/><circle cy="-55" r="16" fill="#1a1a22"/><circle cy="55" r="16" fill="#f3ead6"/><circle r="110" fill="none" stroke="url(#${id}-gold)" stroke-width="6"/></g>
    <g font-family="${SERIF}" font-size="34" fill="#e9d29a"><text x="70" y="110">hot</text><text x="470" y="110">cold</text><text x="80" y="250">up</text><text x="470" y="250">down</text></g>
  `));

  cover('cluecrack', id => {
    const grid = ['##C###', 'PUZZLE', '##O#A#', '#WORDS', '##S#E#'];
    let cells = '';
    grid.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') return; cells += `<rect x="${c * 44 - 132}" y="${r * 44 - 110}" width="42" height="42" fill="#fffaf0" stroke="#2a2018" stroke-width="2"/><text x="${c * 44 - 111}" y="${r * 44 - 76}" text-anchor="middle" font-family="${SERIF}" font-size="28" fill="#2a2018">${(r + c) % 3 ? ch : ''}</text>`; }));
    return shell(id, S('Clue Crack', 'Crossword clues, against the clock', ['#3a3a3a', '#1e1e1e', '#080808'], 30), `
      ${glow(id, 300, 150, 160, '#ffffff', .12)}
      <g transform="translate(300 160) rotate(-4)" ${K.sh(id)}><rect x="-150" y="-128" width="300" height="250" fill="#1d1b1a"/>${cells}</g>
      ${K.pencil(id, 480, 210, .8, 30)}
    `);
  });

  cover('sortitout', id => shell(id, S('Sort It Out', 'Put them in order', ['#1a5a3a', '#0e2e1e', '#04100a'], 30), `
    ${K.stage(id)}
    ${[['1', '#36a852'], ['2', '#3a8ae8'], ['3', '#e6b82a'], ['4', '#e8473c']].map(([n, c], i) => `<g transform="translate(${150 + i * 100} ${160 + [20, -20, 10, -10][i]}) rotate(${[-8, 6, -4, 10][i]})" ${K.sh(id)}><rect x="-40" y="-54" width="80" height="108" rx="10" fill="#fffaf0"/><rect x="-40" y="-54" width="80" height="28" rx="10" fill="${c}"/><text y="30" text-anchor="middle" font-family="${SERIF}" font-size="52" fill="#2a2018">${n}</text></g>`).join('')}
    <path d="M140 260 H460" stroke="url(#${id}-gold)" stroke-width="4"/><path d="M462 250 l16 10 l-16 10 Z" fill="url(#${id}-gold)"/>
  `));

  cover('flashmemory', id => shell(id, S('Flash Memory', 'What was missing?', ['#3a2a4a', '#1e1428', '#0a060e'], 30), `
    <circle cx="300" cy="140" r="180" fill="#fff" opacity=".12" filter="url(#${id}-soft)"/>
    ${[[-18, 170, 170, 'm'], [-4, 300, 140, 'k'], [12, 430, 175, 's']].map(([r, x, y, kind]) => `<g transform="translate(${x} ${y}) rotate(${r})" ${K.sh(id)}><rect x="-62" y="-70" width="124" height="146" fill="#fbf6ea"/><rect x="-52" y="-60" width="104" height="104" fill="${kind === 'm' ? '#2a4a7a' : kind === 'k' ? '#7a2a2a' : '#2a6a3a'}"/>${kind === 'm' ? `<path d="M-52 30 L-10 -20 L20 14 L36 -4 L52 20 V44 H-52 Z" fill="#cfe0f0"/><circle cx="30" cy="-34" r="10" fill="#ffd36a"/>` : kind === 'k' ? `<text y="22" text-anchor="middle" font-family="${SERIF}" font-size="70" fill="#f3ead6">?</text>` : `<circle r="26" fill="#f2cf2a"/><path d="M0 26 V44" stroke="#4a8a2a" stroke-width="5"/>`}</g>`).join('')}
    <g transform="translate(110 70)">${K.sparkles([[0, 0, 2.4]], '#fff', .95)}</g>
  `));
}
