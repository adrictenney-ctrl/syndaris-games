// Painted covers: word games.
export default function paint(K) {
  const { cover, shell, glow, SERIF, UI } = K;
  const S = (title, tag, bg, cy = 34) => ({ title, tag, bg, cy });
  const CHALK = "'Cormorant Garamond', Georgia, serif";

  cover('fiveletters', id => {
    const rows = [['C', 'R', 'A', 'N', 'E'], ['S', 'T', 'O', 'L', 'E'], ['G', 'L', 'O', 'B', 'E']];
    const marks = [['n', 'n', 'n', 'n', 'y'], ['n', 'n', 'y', 'g', 'g'], ['g', 'g', 'g', 'g', 'g']];
    const fill = { n: '#3a3430', y: '#d8a84a', g: '#3a8a52' };
    return shell(id, S('Five Letters', 'One secret word, six guesses', ['#2a5a3a', '#142e1e', '#06100a'], 30), `
      ${glow(id, 300, 150, 160, '#a0f0b0', .18)}
      ${rows.map((r, ri) => r.map((c, ci) => K.tile(id, 180 + ci * 60, 82 + ri * 64, 54, c, { fill: fill[marks[ri][ci]], ink: '#f3ead6', edge: '#141210' })).join('')).join('')}
    `);
  });

  cover('wordgallows', id => shell(id, S('Word Gallows', 'Guess a letter, all at once', ['#4a3a2a', '#261e14', '#0e0a06'], 30), `
    ${K.chalkboard(id, 300, 150, 440, 200, `
      <g stroke="#f3ead6" stroke-width="5" stroke-linecap="round" fill="none" opacity=".9"><path d="M-170 70 H-80 M-140 70 V-70 H-80 V-46"/><circle cx="-80" cy="-32" r="14"/><path d="M-80 -18 V16 M-80 -6 L-96 6 M-80 -6 L-64 6"/></g>
      <g font-family="${CHALK}" font-size="40" fill="#f3ead6" text-anchor="middle">${['P', '', 'Z', 'Z', '', 'E'].map((c, i) => `<text x="${-10 + i * 34}" y="10">${c}</text><path d="M${-24 + i * 34} 22 h28" stroke="#f3ead6" stroke-width="3"/>`).join('')}</g>
      <text x="40" y="-46" font-family="${CHALK}" font-size="22" fill="#f3ead6" opacity=".6">A B C D E F G</text>`)}
  `));

  cover('longword', id => shell(id, S('Long Word', 'Nine letters, longest word wins', ['#2a3a6a', '#141c38', '#060814'], 30), `
    ${glow(id, 300, 150, 160, '#a0c0ff', .2)}
    <g ${K.sh(id)}><rect x="40" y="168" width="520" height="34" rx="6" fill="#6a3a1a"/><path d="M40 168 h520 l-14 -12 h-492 Z" fill="#8a5226"/></g>
    ${'TRIANGLES'.split('').map((c, i) => K.tile(id, 80 + i * 55, 140, 50, c, { pts: [1, 1, 1, 1, 1, 2, 1, 1, 1][i] })).join('')}
    ${['STEAL', 'TANGLE', 'RELATING'].map((w, i) => `<text x="300" y="${240 + i * 26}" text-anchor="middle" font-family="${SERIF}" font-size="${18 + i * 4}" fill="#e9d29a" opacity="${.5 + i * .25}">${w}</text>`).join('')}
  `));

  cover('targetnumber', id => shell(id, S('Target Number', 'Six numbers, one target', ['#6a2a2a', '#381414', '#140606'], 30), `
    <g transform="translate(300 120)" ${K.sh(id)}>${[80, 62, 44, 26].map((r, i) => `<circle r="${r}" fill="${i % 2 ? '#f3ead6' : '#b8232a'}"/>`).join('')}<rect x="-62" y="-26" width="124" height="52" rx="8" fill="#0c0a08" stroke="url(#${id}-gold)" stroke-width="3"/><text y="16" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="38" fill="#ffe08a">742</text></g>
    ${['100', '75', '6', '9', '3', '2'].map((n, i) => `<g transform="translate(${125 + i * 70} 262)" ${K.sh(id)}><rect x="-30" y="-26" width="60" height="52" rx="8" fill="#2a4a8a"/><rect x="-30" y="-26" width="60" height="14" rx="8" fill="#fff" opacity=".14"/><text y="11" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="${n.length > 2 ? 22 : 28}" fill="#fff">${n}</text></g>`).join('')}
  `));

  cover('speedtypist', id => shell(id, S('Speed Typist', 'Type it fastest', ['#2a2a4a', '#161626', '#06060e'], 30), `
    ${glow(id, 300, 150, 160, '#c0c0ff', .16)}
    <g transform="translate(300 180)" ${K.sh(id)}>
      <rect x="-90" y="-150" width="180" height="90" fill="#fbf6ea"/><text x="-74" y="-118" font-family="'Courier New', monospace" font-size="13" fill="#2a2018">The quick brown fox</text><text x="-74" y="-98" font-family="'Courier New', monospace" font-size="13" fill="#2a2018">jumps over the la_</text>
      <rect x="-120" y="-70" width="240" height="22" rx="10" fill="#2a2a2e"/><circle cx="-128" cy="-59" r="12" fill="#3a3a40"/><circle cx="128" cy="-59" r="12" fill="#3a3a40"/>
      <path d="M-170 -40 L170 -40 L190 70 L-190 70 Z" fill="#1d1d22"/><path d="M-170 -40 L170 -40 L174 -26 L-174 -26 Z" fill="url(#${id}-gold)"/>
      ${[0, 1, 2].map(r => Array.from({ length: 10 - r }, (_, c) => `<circle cx="${-138 + r * 14 + c * 31}" cy="${-6 + r * 28}" r="12" fill="#f3ead6" stroke="url(#${id}-gold)" stroke-width="2.5"/><text x="${-138 + r * 14 + c * 31}" y="${-1 + r * 28}" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="11" fill="#2a2018">${['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'][r][c] || ''}</text>`).join('')).join('')}
    </g>
  `));

  cover('wordchain', id => {
    const words = ['APPLE', 'EAGLE', 'EMBER', 'RIVER'];
    return shell(id, S('Word Chain', 'Last letter starts the next', ['#4a4a2a', '#262614', '#0e0e06'], 30), `
      ${glow(id, 300, 150, 160, '#fff0a0', .16)}
      ${words.map((w, i) => `<g transform="translate(${130 + i * 112} ${110 + (i % 2) * 70}) rotate(${i % 2 ? 8 : -8})" ${K.sh(id)}><rect x="-50" y="-22" width="100" height="44" rx="22" fill="none" stroke="url(#${id}-gold)" stroke-width="10"/><text y="9" text-anchor="middle" font-family="${SERIF}" font-size="24" fill="#f3ead6"><tspan fill="#ffd36a">${w[0]}</tspan>${w.slice(1, -1)}<tspan fill="#ffd36a">${w.slice(-1)}</tspan></text></g>`).join('')}
    `);
  });

  cover('ghostletters', id => shell(id, S('Ghost Letters', 'Don’t be the one to finish a word', ['#3a3a5a', '#1c1c2e', '#08080e'], 26), `
    ${K.stars(40, 13, 260, .5)}
    <circle cx="300" cy="150" r="120" fill="#c0d0ff" opacity=".16" filter="url(#${id}-soft)"/>
    <g transform="translate(300 160)" ${K.sh(id)}><path d="M-70 60 Q-80 -20 -50 -60 Q0 -110 50 -60 Q80 -20 70 60 L54 46 L38 64 L20 46 L0 64 L-20 46 L-38 64 L-54 46 Z" fill="#f3f0ff" opacity=".94"/><ellipse cx="-24" cy="-20" rx="11" ry="15" fill="#1a1a2a"/><ellipse cx="24" cy="-20" rx="11" ry="15" fill="#1a1a2a"/><ellipse cy="16" rx="12" ry="9" fill="#1a1a2a"/></g>
    ${['G', 'H', 'O', 'S', 'T'].map((c, i) => K.tile(id, [110, 168, 432, 490, 548][i], 170 + [10, -14, -14, 10, -4][i], 44, c, { rot: (i - 2) * 6, fill: i < 3 ? '#f3e2bc' : '#3a3a4a', ink: i < 3 ? '#2a2018' : '#8a8aa0', edge: '#141420' })).join('')}
  `));

  cover('slowreveal', id => {
    let tiles = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) if ((r * 7 + c * 3) % 5 > 1) tiles += `<rect x="${-150 + c * 50}" y="${-100 + r * 50}" width="50" height="50" fill="#2a1a3a" stroke="#4a3a5a" stroke-width="1.5"/><text x="${-125 + c * 50}" y="${-66 + r * 50}" text-anchor="middle" font-family="${SERIF}" font-size="22" fill="#6a5a7a">?</text>`;
    return shell(id, S('Slow Reveal', 'Guess before it’s all shown', ['#5a2a6a', '#2e1436', '#0e0612'], 30), `
      ${K.frame(id, 300, 150, 300, 200, `<rect x="-150" y="-100" width="300" height="200" fill="#8ac8f0"/><circle cx="80" cy="-50" r="26" fill="#ffd36a"/><path d="M-150 100 L-60 -10 L0 50 L50 0 L150 100 Z" fill="#3a6a3a"/><path d="M-60 -10 L-40 14 L-80 14 Z" fill="#f3ead6"/>${tiles}`)}
    `);
  });

  cover('acrorace', id => shell(id, S('Acro Race', 'Make a phrase from the letters', ['#6a2a4a', '#381426', '#14060e'], 30), `
    ${glow(id, 300, 150, 160, '#ffa0d0', .2)}
    ${['B', 'F', 'G'].map((c, i) => K.tile(id, 200 + i * 100, 100, 78, c, { fill: '#ffd36a', edge: '#b07a1a' })).join('')}
    ${K.bubble(id, 300, 220, 360, 64, 'Big Fluffy Giraffes', { italic: true, fs: 26 })}
  `));

  cover('fibfinder', id => shell(id, S('Fib Finder', 'Find the truth among the fibs', ['#4a2a6a', '#261438', '#0e0614'], 30), `
    <g transform="translate(270 150) rotate(-5)" ${K.sh(id)}><rect x="-150" y="-104" width="300" height="208" fill="#efe6d0"/><text x="0" y="-70" text-anchor="middle" font-family="${SERIF}" font-size="30" fill="#1d1b1a">The Daily Fact</text><path d="M-136 -58 H136 M-136 -54 H136" stroke="#1d1b1a"/>
      <text x="-132" y="-26" font-family="${SERIF}" font-size="16" fill="#2a2018">Sea otters hold</text><text x="-132" y="-4" font-family="${SERIF}" font-size="16" fill="#2a2018">hands while they</text><rect x="-132" y="8" width="96" height="22" fill="#2a2018"/>
      ${[0, 1, 2, 3, 4].map(i => `<path d="M10 ${-30 + i * 16} H${132 - (i % 2) * 20}" stroke="#8a7a5a" stroke-width="5" opacity=".5"/>`).join('')}${[0, 1, 2].map(i => `<path d="M-132 ${50 + i * 16} H132" stroke="#8a7a5a" stroke-width="5" opacity=".4"/>`).join('')}</g>
    ${K.magnifier(id, 430, 210, .9, -40, `<text y="10" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="24" fill="#2a2018">sleep</text>`)}
  `));

  // ---- older party-word covers, repainted without emoji
  cover('wordbluff', id => shell(id, S('Word Bluff', 'Fake the meaning, find the real one', ['#6a4a2a', '#3a2814', '#140c06'], 30), `
    ${K.book(id, 280, 160, 1.3, '#4a2a1a', { open: true, lines: false, inner: `<text x="-52" y="-16" text-anchor="middle" font-family="${SERIF}" font-size="17" fill="#2a1a10">snolly·goster</text><text x="-52" y="4" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="11" fill="#6a5a3a">noun.</text><text x="-52" y="24" text-anchor="middle" font-family="${SERIF}" font-size="26" fill="#8a2a2a">?</text>${[0, 1, 2].map(i => `<text x="52" y="${-18 + i * 22}" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="12" fill="#3a2a1a">${['a. a clever rogue', 'b. a ghost pastry', 'c. a snowy hill'][i]}</text>`).join('')}` })}
    ${K.mask(id, 480, 110, .7, 14, '#f3ead6', { stick: true })}
  `));

  cover('dontsay', id => shell(id, S('Don’t Say It', 'Describe it without the banned words', ['#3a2a5a', '#1e142e', '#0a0610'], 30), `
    ${glow(id, 300, 150, 160, '#ff8080', .14)}
    <g transform="translate(250 160) rotate(-4)" ${K.sh(id)}><rect x="-110" y="-120" width="220" height="240" rx="14" fill="#fffaf0"/><rect x="-110" y="-120" width="220" height="64" rx="14" fill="#5a3a8a"/><text y="-78" text-anchor="middle" font-family="${SERIF}" font-size="34" fill="#fff">BEACH</text>${['sand', 'sea', 'sun', 'waves', 'towel'].map((w, i) => `<text y="${-26 + i * 32}" text-anchor="middle" font-family="${SERIF}" font-size="22" fill="#b8232a">${w}</text>`).join('')}</g>
    <g transform="translate(450 140)" ${K.sh(id)}><circle r="56" fill="none" stroke="#c8232a" stroke-width="12"/><path d="M-40 40 L40 -40" stroke="#c8232a" stroke-width="12"/><path d="M-22 -6 Q0 -30 22 -6 Q0 18 -22 -6 Z" fill="#f3ead6"/></g>
  `));

  cover('passphrase', id => shell(id, S('Pass the Phrase', 'Describe it, pass it on', ['#4a2a4a', '#261426', '#0e060e'], 30), `
    ${glow(id, 300, 160, 150, '#ffb070', .2)}
    <g transform="translate(300 170)" ${K.sh(id)}><circle r="70" fill="#1d1b22"/><circle r="70" fill="url(#${id}-vig)"/><ellipse cx="-24" cy="-28" rx="18" ry="10" fill="#fff" opacity=".18" transform="rotate(-30)"/><rect x="-16" y="-84" width="32" height="20" rx="4" fill="#5a5a60"/><path d="M0 -84 Q20 -120 50 -110" stroke="#8a6a3a" stroke-width="5" fill="none"/><circle cx="52" cy="-112" r="10" fill="#ffd36a" filter="url(#${id}-glow)"/></g>
    ${K.bubble(id, 140, 90, 150, 50, 'It’s a… ', { italic: true, fs: 20 })}${K.bubble(id, 470, 100, 160, 50, 'Pass!', { fs: 24, tail: 'r' })}
    <g opacity=".8">${K.sparkles([[530, 60, 1], [80, 220, .8]])}</g>
  `));
}
