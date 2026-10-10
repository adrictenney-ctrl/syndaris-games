// Still-life covers: word games, party games, hidden roles. Paper, pens, phones and cards.
export default function paint(K) {
  const { cover, shell, T } = K;
  const C = (id, title, tag, bg, body, z = 1.2) => shell(id, { title, tag, bg }, `${T.defs(id)}${T.zoom(body, z)}`);
  const shade = K.shade;
  const tile = (id, x, y, r, ch, o = {}) => T.lay(id, x, y, r, T.tile(ch, o.s || 46, o), { thin: true });
  const pad = (id, w, h, inner, o = {}) => T.notepad(id, w, h, inner, o);
  const hand = T.hand;
  const pen = (id, x, y, r, c = '#1d1b1a', o = {}) => T.lay(id, x, y, r, `<rect x="-8" y="-90" width="16" height="150" rx="6" fill="${c}"/><rect x="-8" y="-90" width="16" height="36" rx="6" fill="${shade(c, .25)}"/><rect x="-3" y="-90" width="4" height="60" rx="2" fill="url(#${id}-brass)"/><path d="M-6 60 L0 78 L6 60 Z" fill="url(#${id}-brass)"/>`, { thin: true, blur: o.blur });
  const slip = (id, text, o = {}) => `<rect x="${-(o.w || 150) / 2}" y="${-(o.h || 60) / 2}" width="${o.w || 150}" height="${o.h || 60}" rx="3" fill="${o.fill || '#fbf8ee'}" stroke="rgba(0,0,0,.15)"/>${hand(text, 0, 7, o.fs || 20, o.ink || '#2a2a5a')}`;
  const gcard = (id, title, c, art = '', o = {}) => { const w = o.w || 100, h = w * 1.4; return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w * .07}" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="${-w / 2 + w * .07}" y="${-h / 2 + w * .07}" width="${w * .86}" height="${h * .5}" rx="${w * .04}" fill="${c}"/><g transform="translate(0 ${-h / 2 + w * .07 + h * .25})">${art}</g>${T.word(title, 0, h * .16, w * (title.length > 9 ? .11 : .15), { weight: 700 })}`; };
  const disc = (id, c, inner = '') => `<circle r="36" fill="${c}"/><circle r="36" fill="url(#${id}-dsh)"/><circle r="28" fill="none" stroke="${shade(c, .3)}" stroke-width="2"/>${inner}<defs><radialGradient id="${id}-dsh" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs>`;

  // ---------------------------------------------------------------- word games
  cover('fiveletters', id => {
    const rows = [['C', 'R', 'A', 'N', 'E'], ['S', 'T', 'O', 'L', 'E'], ['G', 'L', 'O', 'B', 'E']], marks = ['nnnny', 'nnygg', 'ggggg'], fill = { n: '#4a4440', y: '#c8963a', g: '#3a7a4a' };
    return C(id, 'Five Letters', 'One secret word, six guesses', ['#2a5a3a', '#142e1e', '#06100a'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${rows.map((r, ri) => r.map((ch, ci) => tile(id, 180 + ci * 60, 130 + ri * 62, 0, ch, { s: 52, fill: fill[marks[ri][ci]], ink: '#f4eee0', edge: '#1a1612' })).join('')).join('')}
    `);
  });

  cover('wordgallows', id => C(id, 'Word Gallows', 'Guess a letter, all at once', ['#4a3a2a', '#261e14', '#0e0a06'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 300, 190, -3, `<rect x="-200" y="-110" width="400" height="220" rx="4" fill="#7a4a22"/><rect x="-188" y="-98" width="376" height="196" fill="#26382e"/><g stroke="#f4eee0" stroke-width="4" stroke-linecap="round" fill="none" opacity=".9"><path d="M-170 70 H-90 M-140 70 V-70 H-80 V-50"/><circle cx="-80" cy="-36" r="12"/><path d="M-80 -24 V6"/></g>${['P', '', 'Z', 'Z', '', 'E'].map((c, i) => `${c ? `<text x="${-20 + i * 36}" y="16" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-size="38" fill="#f4eee0">${c}</text>` : ''}<path d="M${-34 + i * 36} 26 h28" stroke="#f4eee0" stroke-width="3"/>`).join('')}`)}
    ${T.lay(id, 470, 320, 20, `<rect x="-30" y="-8" width="60" height="16" rx="3" fill="#f4eee0"/>`, { thin: true })}
  `));

  cover('longword', id => C(id, 'Long Word', 'Nine letters, longest word wins', ['#2a3a6a', '#141c38', '#060814'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.stand(id, 300, 220, 300, `<g transform="translate(300 220)"><path d="M-260 0 L-270 -20 H270 L260 0 Z" fill="#6a3a1a"/></g>`)}
    ${'TRIANGLES'.split('').map((c, i) => T.stand(id, 80 + i * 55, 200, 0, `<g transform="translate(${80 + i * 55} 178)"><rect x="-24" y="-24" width="48" height="48" rx="5" fill="#f1dfb4"/>${T.word(c, 0, 12, 32, { weight: 700 })}</g>`, { noShadow: true })).join('')}
    ${T.lay(id, 300, 320, -3, pad(id, 200, 90, `${hand('RELATING', 0, -6, 22)}${hand('TANGLES', 0, 18, 18, '#6a6a8a')}`, { spiral: false }))}
  `));

  cover('targetnumber', id => C(id, 'Target Number', 'Six numbers, one target', ['#6a2a2a', '#381414', '#140606'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.stand(id, 300, 170, 120, `<g transform="translate(300 130)"><rect x="-90" y="-40" width="180" height="80" rx="8" fill="#1a1612"/><rect x="-80" y="-30" width="160" height="60" rx="4" fill="#0a0806"/>${T.word('742', 0, 20, 52, { font: "'Courier New', monospace", weight: 700, fill: '#ffb03a' })}</g>`)}
    ${['100', '75', '6', '9', '3', '2'].map((n, i) => T.lay(id, 125 + i * 70, 270, (i - 2.5) * 3, `<rect x="-30" y="-40" width="60" height="80" rx="6" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/>${T.word(n, 0, 10, n.length > 2 ? 22 : 30, { weight: 700, fill: '#2a3a6a' })}`)).join('')}
  `));

  cover('speedtypist', id => C(id, 'Speed Typist', 'Type it fastest', ['#2a2a4a', '#161626', '#06060e'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.stand(id, 300, 300, 260, T.strip(K.T ? `<g transform="translate(300 240)"><rect x="-80" y="-170" width="160" height="80" fill="#fbf8ee"/><text x="-66" y="-140" font-family="'Courier New', monospace" font-size="12" fill="#2a2018">The quick brown fox</text><text x="-66" y="-122" font-family="'Courier New', monospace" font-size="12" fill="#2a2018">jumps over the la_</text><rect x="-110" y="-96" width="220" height="20" rx="10" fill="#2a2a2e"/><path d="M-160 -70 L160 -70 L180 40 L-180 40 Z" fill="#1d1d22"/><path d="M-160 -70 L160 -70 L164 -58 L-164 -58 Z" fill="url(#${id}-brass)"/>${[0, 1, 2].map(r => Array.from({ length: 10 - r }, (_, c) => `<circle cx="${-128 + r * 14 + c * 29}" cy="${-38 + r * 26}" r="11" fill="#f4eee0" stroke="url(#${id}-brass)" stroke-width="2.5"/><text x="${-128 + r * 14 + c * 29}" y="${-34 + r * 26}" text-anchor="middle" font-family="${K.UI}" font-weight="800" font-size="10" fill="#2a2018">${['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'][r][c] || ''}</text>`).join('')).join('')}</g>` : ''))}
    ${T.stand(id, 500, 300, 40, T.strip(K.stopwatch(id, 500, 260, .45, { hand: 140 })).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`))}
  `));

  cover('wordchain', id => C(id, 'Word Chain', 'The last letter starts the next', ['#4a4a2a', '#262614', '#0e0e06'], `
    ${T.surface(id, 'linen', { hz: 26, color: '#c8bc9c', lx: 300 })}
    ${[['APPLE', -12], ['EAGLE', 6], ['EMBER', -8], ['RIVER', 10]].map(([w, r], i) => T.lay(id, 140 + i * 110, 170 + (i % 2) * 70, r, `<rect x="-56" y="-26" width="112" height="52" rx="4" fill="#fbf8ee" stroke="rgba(0,0,0,.18)"/>${T.word(`<tspan fill="#a8242a">${w[0]}</tspan>${w.slice(1, -1)}<tspan fill="#a8242a">${w.slice(-1)}</tspan>`, 0, 9, 24, { weight: 700 })}`)).join('')}
    ${[0, 1, 2].map(i => T.lay(id, 195 + i * 110, 205, 0, `<ellipse rx="18" ry="10" fill="none" stroke="url(#${id}-silver)" stroke-width="5"/><ellipse cx="14" rx="18" ry="10" fill="none" stroke="url(#${id}-silver)" stroke-width="5"/>`, { thin: true })).join('')}
  `));

  cover('ghostletters', id => C(id, 'Ghost Letters', 'Don’t be the one to finish a word', ['#3a3a5a', '#1c1c2e', '#08080e'], `
    ${T.surface(id, 'slate', { hz: 26, color: '#1e1e2a', lx: 300, light: .24 })}
    ${['G', 'H', 'O'].map((c, i) => tile(id, 210 + i * 64, 190, (i - 1) * 6, c, { s: 56 })).join('')}${['S', 'T'].map((c, i) => tile(id, 410 + i * 64, 196, 0, c, { s: 56, fill: '#3a3a4a', ink: '#8a8aa8', edge: '#1a1a24' })).join('')}
    ${T.stand(id, 140, 300, 40, T.strip(K.candle(id, 140, 300, .8, 90)))}
    <circle cx="140" cy="200" r="70" fill="#ffc860" opacity=".2" filter="url(#${id}-b8)"/>
  `));

  cover('slowreveal', id => {
    let t = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) if ((r * 7 + c * 3) % 5 > 1) t += `<rect x="${-125 + c * 50}" y="${-100 + r * 50}" width="50" height="50" fill="#2a1a3a" stroke="#4a3a5a" stroke-width="1.5"/>`;
    return C(id, 'Slow Reveal', 'Guess before it’s all shown', ['#5a2a6a', '#2e1436', '#0e0612'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 300, 190, -4, `<rect x="-140" y="-114" width="280" height="228" fill="url(#${id}-brass)"/><rect x="-125" y="-100" width="250" height="200" fill="#8ac0e0"/><circle cx="70" cy="-50" r="24" fill="#ffd36a"/><path d="M-125 100 L-40 -10 L10 50 L60 0 L125 100 Z" fill="#3a6a3a"/>${t}`)}
    `);
  });

  cover('acrorace', id => C(id, 'Acro Race', 'Make a phrase from the letters', ['#6a2a4a', '#381426', '#14060e'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${['B', 'F', 'G'].map((c, i) => tile(id, 200 + i * 100, 140, (i - 1) * 6, c, { s: 74, fill: '#ffd36a', edge: '#b07a1a' })).join('')}
    ${T.lay(id, 300, 280, -3, slip(id, 'Big Fluffy Giraffes', { w: 280, h: 70, fs: 30 }))}
    ${pen(id, 480, 300, 60, '#2a2a5a')}
  `));

  cover('fibfinder', id => C(id, 'Fib Finder', 'Find the truth among the fibs', ['#4a2a6a', '#261438', '#0e0614'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 270, 190, -5, `<rect x="-150" y="-110" width="300" height="220" fill="#ece4d0"/>${T.word('The Daily Fact', 0, -76, 26, { weight: 700 })}<path d="M-136 -62 H136 M-136 -58 H136" stroke="#2a2018"/>${T.word('Sea otters hold hands', -130, -30, 15, { anchor: 'start' })}${T.word('while they', -130, -10, 15, { anchor: 'start' })}<rect x="-50" y="-24" width="80" height="20" fill="#2a2018"/>${T.lines(-130, 20, 260, 5, 15, '#6a5a44', { weight: 2.4, op: .4 })}`)}
    ${T.lay(id, 440, 290, -40, T.strip(K.magnifier(id, 0, 0, 1, 0, `${T.word('sleep', 0, 8, 22, { italic: true })}`)).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`), { tilt: .75 })}
  `));

  cover('wordbluff', id => C(id, 'Word Bluff', 'Fake the meaning, find the real one', ['#6a4a2a', '#3a2814', '#140c06'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 270, 190, -4, T.strip(K.book(id, 0, 0, 1.45, '#2a3a5a', { open: true, lines: false, inner: `${T.word('snolly·goster', -52, -10, 15, { weight: 700 })}${T.word('n.', -52, 8, 12, { italic: true, fill: '#6a5a3a' })}${T.word('?', -52, 32, 26, { weight: 700, fill: '#8a1a2a' })}${['a. a clever rogue', 'b. a ghost pastry', 'c. a snowy hill'].map((t, i) => T.word(t, 52, -14 + i * 18, 11, { italic: true })).join('')}` })))}
    ${T.lay(id, 470, 300, 20, slip(id, 'b. surely?', { w: 120, h: 50, fs: 18 }))}
  `));

  cover('passphrase', id => C(id, 'Pass the Phrase', 'Describe it, pass it on', ['#4a2a4a', '#261426', '#0e060e'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 260, 196, -12, T.phone(id, `<rect x="-36" y="-72" width="72" height="144" fill="#2a1a3a"/>${T.word('PASS', 0, -40, 11, { font: K.UI, weight: 900, ls: 3, fill: '#ffd36a' })}${T.word('Lighthouse', 0, 6, 15, { weight: 700, fill: '#fff' })}<circle cy="44" r="16" fill="none" stroke="#e8473c" stroke-width="3"/><path d="M0 44 V32" stroke="#e8473c" stroke-width="3"/>`), { tilt: .74, s: 1.25 })}
    ${T.stand(id, 440, 260, 60, `<g transform="translate(440 220)"><circle r="40" fill="#1d1b22"/><circle cx="-12" cy="-14" r="10" fill="#fff" opacity=".18"/><rect x="-9" y="-50" width="18" height="12" rx="3" fill="#4a4a54"/><path d="M0 -50 Q14 -74 34 -66" stroke="#c8a060" stroke-width="4" fill="none"/><circle cx="36" cy="-66" r="6" fill="#ffd36a"/></g>`)}
  `));

  cover('dontsay', id => {
    const taboo = `<rect x="-90" y="-120" width="180" height="240" rx="10" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-90" y="-120" width="180" height="56" rx="10" fill="#4a2a7a"/><rect x="-90" y="-76" width="180" height="12" fill="#4a2a7a"/>${T.word('BEACH', 0, -82, 28, { weight: 700, fill: '#fff', ls: 2 })}${['sand', 'sea', 'sun', 'waves', 'towel'].map((w, i) => T.word(w, 0, -32 + i * 30, 20, { weight: 600, fill: '#8a1a2a' })).join('')}`;
    return C(id, 'Don’t Say It', 'Describe it without the banned words', ['#3a2a5a', '#1e142e', '#0a0610'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${T.lay(id, 270, 190, -6, taboo)}
      ${T.stand(id, 460, 260, 50, T.strip(K.hourglass(id, 460, 210, .6, 0)))}
    `);
  });

  cover('listoff', id => C(id, 'List Off', 'One letter, ten categories', ['#3a7a5a', '#1c4030', '#08160e'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 250, 196, -4, pad(id, 230, 230, ['A fruit', 'A city', 'An animal', 'Something cold', 'A job'].map((c, i) => `${T.word(`${i + 1}. ${c}`, -80, -76 + i * 32, 11, { anchor: 'start', font: K.UI, fill: '#6a5a44' })}${hand(['Mango', 'Madrid', 'Moose', 'Milkshake', 'Mechanic'][i], 70, -76 + i * 32, 17, '#2a4a8a', { anchor: 'end' })}`).join('')))}
    ${tile(id, 460, 200, 10, 'M', { s: 84, fill: '#f2cf2a', edge: '#b07a1a' })}
  `));

  // ---------------------------------------------------------------- party games
  cover('doodlebluff', id => C(id, 'Doodle Bluff', 'Draw it, then guess the fakes', ['#3e2448', '#24142a', '#0c060e'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 250, 190, -6, pad(id, 230, 200, `<path d="M-60 40 Q-50 -40 0 -50 Q60 -40 70 30 Z" fill="none" stroke="#a8242a" stroke-width="4"/><circle cx="0" cy="-6" r="12" fill="none" stroke="#2a2a3a" stroke-width="3"/><path d="M-30 30 L-40 60 M30 30 L40 60" stroke="#2a2a3a" stroke-width="3"/>`))}
    ${[['a cat?', -8], ['a bell!', 6], ['a hat', -4]].map(([t, r], i) => T.lay(id, 450, 140 + i * 70, r, slip(id, t, { w: 120, h: 50, fs: 19 }))).join('')}
  `));

  cover('dreamcards', id => {
    const pic = (inner) => `<rect x="-60" y="-84" width="120" height="168" rx="8" fill="#fbf8f0" stroke="rgba(0,0,0,.2)"/><rect x="-52" y="-76" width="104" height="152" rx="5" fill="#1a1a3a"/>${inner}`;
    return C(id, 'Dreamcards', 'A dreamy clue, which picture?', ['#2a1e4a', '#160e28', '#06040e'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#2a1a14', lx: 300 })}
      ${T.lay(id, 180, 190, -12, pic(`<circle cx="18" cy="-36" r="16" fill="#f3ead6"/><circle cx="26" cy="-40" r="14" fill="#1a1a3a"/><path d="M-52 76 L-52 30 Q-20 0 10 30 Q30 10 52 26 V76 Z" fill="#3a2a6a"/>`))}
      ${T.lay(id, 300, 176, 0, pic(`<ellipse cy="10" rx="40" ry="18" fill="#3a6ab8"/><path d="M34 10 Q52 -8 48 -20 Q42 0 32 4 Z" fill="#3a6ab8"/><circle cx="-24" cy="6" r="3" fill="#fff"/>`))}
      ${T.lay(id, 420, 192, 12, pic(`<path d="M-30 76 V-10 L-18 -30 L-6 -10 V-40 L6 -60 L18 -40 V76 Z" fill="#6a4aa8"/><rect x="-4" y="0" width="8" height="12" fill="#ffd36a"/>`))}
      ${T.lay(id, 300, 330, 0, slip(id, '“where the whale sleeps”', { w: 280, h: 50, fs: 20 }))}
    `);
  });

  cover('copycat', id => C(id, 'Copy Cat', 'Draw it from memory', ['#6a5a1a', '#38300c', '#141004'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 190, 190, -8, `<rect x="-90" y="-80" width="180" height="160" fill="url(#${id}-brass)"/><rect x="-78" y="-68" width="156" height="136" fill="#e8d8b0"/><circle cx="-20" cy="0" r="32" fill="#a8242a"/><path d="M10 40 L40 -30 L70 40 Z" fill="#2a4a8a"/><rect x="-66" y="-54" width="30" height="30" fill="#c8902a"/>`)}
    ${T.lay(id, 410, 196, 8, pad(id, 170, 160, `<circle cx="-16" cy="6" r="30" fill="none" stroke="#a8242a" stroke-width="3"/><path d="M14 46 L42 -20 L66 46 Z" fill="none" stroke="#2a4a8a" stroke-width="3"/><rect x="-62" y="-44" width="28" height="28" fill="none" stroke="#c8902a" stroke-width="3"/>`))}
    ${T.lay(id, 480, 320, -40, T.pencilFlat(150), { thin: true })}
  `));

  cover('storychain', id => C(id, 'Story Chain', 'One line at a time', ['#4a2a5a', '#26142e', '#0e0612'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${['Once upon a time…', '…a dragon sneezed…', '…and the end?'].map((t, i) => T.lay(id, 180 + i * 120, 180 + (i % 2) * 30, -10 + i * 10, `<rect x="-70" y="-90" width="140" height="180" fill="#f4ecd8" stroke="rgba(0,0,0,.15)"/>${T.lines(-54, -64, 108, 5, 16, '#7a6040', { weight: 2, ragged: true, op: i === 2 ? .2 : .45 })}<path d="M-70 40 H70" stroke="#c9b48c" stroke-dasharray="4 4"/>${hand(t, 0, 66, 13)}`)).join('')}
    ${T.lay(id, 480, 320, 30, T.strip(K.quill(id, 0, 0, 1, 0)), { thin: true })}
  `));

  cover('faceoff', id => C(id, 'Face Off', 'Two answers enter, one wins', ['#c8562a', '#6a2a14', '#200a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 190, 190, -8, slip(id, '“free soup”', { w: 200, h: 120, fs: 30 }))}${T.lay(id, 410, 190, 8, slip(id, '“a tiny horse”', { w: 200, h: 120, fs: 28 }))}
    ${T.lay(id, 300, 196, 0, `<circle r="30" fill="#1d1b1a"/><circle r="30" fill="none" stroke="url(#${id}-brass)" stroke-width="4"/>${T.word('VS', 0, 9, 24, { font: K.UI, weight: 900, fill: '#ffd36a' })}`)}
    ${[0, 1, 2].map(i => T.lay(id, 150 + i * 30, 310, 0, T.coinTop(id, 13, { mark: '✓' }), { thin: true })).join('')}${T.lay(id, 430, 310, 0, T.coinTop(id, 13, { mark: '✓' }), { thin: true })}
  `));

  cover('thisorthat', id => C(id, 'This or That', 'Pick a side', ['#1c2e50', '#101a2e', '#040810'], `
    ${T.surface(id, 'marble', { hz: 26, color: '#d8d2c6', lx: 300 })}
    ${T.lay(id, 200, 190, -8, gcard(id, 'Mountains', '#3a6a9a', `<path d="M-36 24 L-10 -20 L6 4 L18 -10 L36 24 Z" fill="#f4eee0"/>`, { w: 130 }))}
    ${T.lay(id, 400, 190, 8, gcard(id, 'Beaches', '#d8a84a', `<circle cx="16" cy="-10" r="12" fill="#fff3c0"/><path d="M-40 24 Q0 6 40 24 Z" fill="#3a8ab8"/>`, { w: 130 }))}
    ${T.word('or', 300, 200, 30, { italic: true, fill: '#6a5a44' })}
  `));

  cover('knowme', id => C(id, 'Know Me', 'What did they really answer?', ['#5a1c2e', '#2e0e18', '#100408'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2014', lx: 300 })}
    ${T.lay(id, 300, 180, -2, pad(id, 220, 160, `${T.word('Favourite food?', 0, -38, 14, { font: K.UI, weight: 800, fill: '#6a5a44' })}${hand('Pizza.', 0, 4, 30)}${hand('— Ben', 40, 34, 16, '#6a6a8a')}`))}
    ${[['Pizza!', -10, 150], ['Tacos', 6, 460], ['Pizza', 4, 150]].map(([t, r, x], i) => T.lay(id, x, 140 + i * 90 - (i === 1 ? 50 : 0), r, slip(id, t, { w: 110, h: 48, fs: 20 }))).join('')}
  `));

  cover('mostlikely', id => C(id, 'Most Likely To', 'Vote with the crowd', ['#aa4a2a', '#5a2414', '#1e0a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 300, 160, -2, slip(id, '…be late to their own party', { w: 300, h: 70, fs: 22 }))}
    ${['Ana', 'Ben', 'Ben', 'Cleo', 'Ben'].map((n, i) => T.lay(id, 120 + i * 90, 280 + (i % 2) * 14, (i - 2) * 6, `<rect x="-36" y="-26" width="72" height="52" rx="3" fill="#fbf8ee" stroke="rgba(0,0,0,.15)"/>${hand(n, 0, 8, 22, n === 'Ben' ? '#a8242a' : '#2a2a5a')}`)).join('')}
  `));

  cover('twotruths', id => C(id, 'Two Truths & a Lie', 'Two are true, spot the fib', ['#2a5a8a', '#142e48', '#060e18'], `
    ${T.surface(id, 'linen', { hz: 26, color: '#c8bc9c', lx: 300 })}
    ${['I’ve met a penguin', 'I can juggle', 'I’ve been to the Moon'].map((t, i) => T.lay(id, 280, 120 + i * 80, (i - 1) * 3, `${slip(id, t, { w: 300, h: 58, fs: 22 })}${i === 2 ? `<ellipse rx="160" ry="34" fill="none" stroke="#a8242a" stroke-width="3" transform="rotate(-3)"/>` : ''}`)).join('')}
    ${pen(id, 480, 300, 50, '#a8242a')}
  `));

  cover('oddoneout', id => C(id, 'Odd One Out', 'Everyone knows the word, but one', ['#6a2a5a', '#3a142e', '#14060f'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#2a1a2a', lx: 300 })}
    ${[0, 1, 2, 3].map(i => T.lay(id, 150 + i * 100, 200, (i - 1.5) * 5, gcard(id, i === 2 ? '???' : 'PIZZA', i === 2 ? '#2a2a3a' : '#a8582a', i === 2 ? T.word('?', 0, 14, 40, { weight: 700, fill: '#e8c87a' }) : `<path d="M-24 18 L0 -24 L24 18 Z" fill="#f2c24a"/><circle cx="-4" cy="4" r="4" fill="#a8242a"/><circle cx="8" cy="10" r="3" fill="#a8242a"/>`, { w: 90 }))).join('')}
  `));

  cover('rateit', id => C(id, 'Rate It', 'How would they score it?', ['#8a3a1a', '#481e0c', '#180a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n, i) => T.lay(id, 90 + i * 46, 200 - (n === 8 ? 30 : 0), (i % 3 - 1) * 4, `<rect x="-20" y="-28" width="40" height="56" rx="5" fill="${n === 8 ? '#c8a24a' : 'url(#' + id + '-paper)'}" stroke="rgba(0,0,0,.2)"/>${T.word(String(n), 0, 10, n === 10 ? 20 : 26, { weight: 700, fill: n === 8 ? '#fff' : '#2a2018' })}`, { thin: true })).join('')}
    ${T.lay(id, 300, 310, 0, slip(id, 'Pineapple on pizza', { w: 240, h: 56, fs: 22 }))}
  `));

  cover('topfive', id => C(id, 'Top Five', 'Guess their ranking', ['#6a5a1a', '#3a300c', '#141004'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 280, 200, -3, pad(id, 240, 240, ['Dogs', 'Pizza', 'Sleep', 'Rain', 'Mondays'].map((t, i) => `${T.word(`${i + 1}.`, -76, -64 + i * 34, 18, { weight: 700, fill: '#a8242a' })}${hand(t, -50, -64 + i * 34, 22, '#2a2a5a', { anchor: 'start' })}`).join('')))}
    ${pen(id, 470, 280, 40, '#2a2a5a')}
  `));

  cover('mindmeld', id => C(id, 'Mind Meld', 'Say the same word at once', ['#2a2a6a', '#141438', '#060614'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1a14', lx: 300 })}
    ${T.lay(id, 200, 200, -10, T.phone(id, `<rect x="-36" y="-72" width="72" height="144" fill="#1a1a3a"/>${T.word('MOON', 0, 6, 18, { font: K.UI, weight: 900, fill: '#ffd36a' })}`), { tilt: .74, s: 1.2 })}
    ${T.lay(id, 400, 200, 10, T.phone(id, `<rect x="-36" y="-72" width="72" height="144" fill="#1a1a3a"/>${T.word('MOON', 0, 6, 18, { font: K.UI, weight: 900, fill: '#ffd36a' })}`), { tilt: .74, s: 1.2 })}
    <circle cx="300" cy="180" r="60" fill="#ffd36a" opacity=".16" filter="url(#${id}-b8)"/>
  `));

  cover('samebrain', id => C(id, 'Same Brain', 'Give the answer everyone gives', ['#2e481c', '#18260e', '#081004'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.lay(id, 300, 130, 0, slip(id, 'Name a breakfast food', { w: 270, h: 56, fs: 22 }))}
    ${[0, 1, 2, 3].map(i => T.lay(id, 150 + i * 100, 260 + (i % 2) * 14, (i - 1.5) * 6, slip(id, i === 2 ? 'Toast' : 'Eggs', { w: 90, h: 56, fs: 22, ink: i === 2 ? '#6a6a8a' : '#2a2a5a' }))).join('')}
  `));

  cover('oneclue', id => C(id, 'One Clue', 'One-word clues, duplicates cancel', ['#1a5a5a', '#0e2e2e', '#041010'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${['sweet', 'bees', 'honey', 'sweet'].map((w, i) => T.stand(id, 130 + i * 110, 230 + (i % 2) * 10, 70, `<g transform="translate(${130 + i * 110} ${200 + (i % 2) * 10})"><path d="M-48 30 L-42 -30 H42 L48 30 Z" fill="#fbf8ee"/>${hand(w, 0, 8, 22, w === 'sweet' ? '#9a9aa8' : '#2a2a5a')}${w === 'sweet' ? '<path d="M-36 2 H36" stroke="#a8242a" stroke-width="2.5"/>' : ''}<rect x="-52" y="30" width="104" height="10" fill="#7a4a22"/></g>`)).join('')}
    ${T.lay(id, 300, 110, 0, gcard(id, '???', '#2a2a3a', T.word('?', 0, 14, 40, { weight: 700, fill: '#e8c87a' }), { w: 80 }), { blur: 2 })}
  `));

  cover('throwdown', id => C(id, 'Throwdown', 'Rock, paper, scissors, bracket', ['#5a3a1a', '#2e1e0c', '#100a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.stand(id, 160, 210, 70, `<path d="M110 210 Q100 160 140 140 Q190 126 210 160 Q226 196 200 214 Q160 230 110 210 Z" fill="#8a8478"/><path d="M130 150 Q160 140 186 152" stroke="#fff" stroke-opacity=".3" stroke-width="5" fill="none"/>`)}
    ${T.lay(id, 300, 196, 8, `<rect x="-60" y="-76" width="120" height="152" fill="#fbfaf4" stroke="rgba(0,0,0,.15)"/>${[0, 1, 2, 3, 4].map(k => `<path d="M-46 ${-50 + k * 24} H46" stroke="#a8c0d8"/>`).join('')}`)}
    ${T.lay(id, 450, 200, -30, `<circle cx="-20" cy="50" r="18" fill="none" stroke="#a8242a" stroke-width="10"/><circle cx="20" cy="50" r="18" fill="none" stroke="#a8242a" stroke-width="10"/><path d="M-10 36 L16 -76 L22 -72 L4 40 Z M10 36 L-16 -76 L-22 -72 L-4 40 Z" fill="url(#${id}-silver)"/><circle cy="30" r="4" fill="#6a7480"/>`, { tilt: .75 })}
    ${T.lay(id, 300, 330, 0, `<path d="M-160 -10 V10 H0 V-10 M0 10 V24 H160 V10" stroke="#2a2018" stroke-width="3" fill="none"/>`, { thin: true })}
  `));

  cover('closecall', id => C(id, 'Close Call', 'Guess, then bet on the closest', ['#142614', '#0c160c', '#040804'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#1d4a2a', lx: 300 })}
    ${T.lay(id, 300, 130, 0, slip(id, 'How tall is the Eiffel Tower?', { w: 300, h: 56, fs: 20 }))}
    ${['250', '330', '400'].map((n, i) => T.lay(id, 170 + i * 130, 240, (i - 1) * 5, `<rect x="-50" y="-34" width="100" height="68" rx="6" fill="url(#${id}-paper)" stroke="${i === 1 ? '#c8a24a' : 'rgba(0,0,0,.2)'}" stroke-width="${i === 1 ? 3 : 1}"/>${T.word(`${n} m`, 0, 10, 26, { weight: 700 })}`)).join('')}
    ${T.chips(id, 300, 330, 24, 4, '#a8242a', { blur: 2 })}
  `));

  cover('petals', id => {
    const rose = `<g>${[0, 1, 2, 3, 4].map(k => `<ellipse cy="-14" rx="9" ry="14" fill="#c8325a" transform="rotate(${k * 72})"/>`).join('')}<circle r="8" fill="#8a1a3a"/></g>`;
    const thorn = `<path d="M-14 10 L-6 -18 L2 10 M2 10 L12 -22 L20 10" fill="#2a3a1a" stroke="#1a2010" stroke-width="2"/>`;
    return C(id, 'Petals & Thorns', 'Bid, then flip without a thorn', ['#5a2a4a', '#2e1426', '#0e060c'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
      ${[0, 1, 2, 3].map(i => T.lay(id, 220 + i * 2, 220 - i * 10, i * 20, disc(id, '#3a1a2a'), { thin: true, s: 1.6 })).join('')}
      ${T.lay(id, 390, 180, 0, disc(id, '#e8d0dc', rose), { s: 1.5 })}${T.lay(id, 470, 260, 0, disc(id, '#3a4a2a', thorn), { s: 1.5 })}
      ${T.lay(id, 140, 300, -10, `<path d="M0 60 C-10 20 10 -10 0 -40" stroke="#3a6a2a" stroke-width="5" fill="none"/><g transform="translate(0 -46)">${rose}</g>`, { tilt: .75 })}
    `);
  });

  cover('insync', id => C(id, 'In Sync', 'Play your numbers in order, silently', ['#1a3a5a', '#0c1c2e', '#04080e'], `
    ${T.surface(id, 'felt', { hz: 26, color: '#1a2a40', lx: 300 })}
    ${[3, 17, 42, 68].map((n, i) => T.lay(id, 300 + (i % 2) * 6 - 3, 210 - i * 6, (i - 1.5) * 10, `<rect x="-44" y="-62" width="88" height="124" rx="9" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/>${T.word(String(n), 0, 16, 46, { weight: 700, fill: '#1a2a4a' })}`, { s: 1.35 })).join('')}
    ${T.fan(id, 130, 330, ['back', 'back'], { w: 80, step: 14, backColor: '#1a2a40', blur: 2 })}${T.fan(id, 470, 330, ['back', 'back', 'back'], { w: 80, step: 14, backColor: '#1a2a40', blur: 2 })}
  `));

  // ---------------------------------------------------------------- hidden roles
  const role = (id, t, c, art = '') => `<rect x="-55" y="-77" width="110" height="154" rx="8" fill="#ece0c8" stroke="rgba(0,0,0,.25)"/><rect x="-47" y="-69" width="94" height="138" rx="5" fill="none" stroke="${c}" stroke-width="2"/><g transform="translate(0 -18)">${art}</g>${T.word(t, 0, 48, t.length > 7 ? 13 : 16, { weight: 700, fill: c, ls: 2 })}`;
  cover('roundtable', id => C(id, 'Round Table', 'Loyal knights, hidden traitors', ['#5a3a1e', '#2e1e0e', '#100a04'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2014', lx: 300 })}
    ${T.lay(id, 200, 190, -10, role(id, 'KNIGHT', '#2a4a8a', `<path d="M-22 -26 H22 V0 Q22 24 0 32 Q-22 24 -22 0 Z" fill="#2a4a8a"/><path d="M0 -20 V26 M-16 -2 H16" stroke="#e8c87a" stroke-width="4"/>`))}
    ${T.lay(id, 300, 180, 2, role(id, 'SEER', '#6a3a8a', `<circle r="22" fill="#9a7ac8"/><circle cx="-6" cy="-6" r="7" fill="#fff" opacity=".5"/>`))}
    ${T.lay(id, 400, 194, 12, role(id, 'TRAITOR', '#8a1a1a', `<path d="M-4 -30 L4 -30 L6 14 L0 22 L-6 14 Z" fill="url(#${id}-silver)"/><rect x="-14" y="14" width="28" height="5" fill="url(#${id}-brass)"/>`))}
    ${T.lay(id, 300, 320, -10, `<path d="M-160 -5 L40 -6 L60 0 L40 6 L-160 5 Z" fill="url(#${id}-silver)"/><rect x="40" y="-22" width="12" height="44" rx="3" fill="url(#${id}-brass)"/><rect x="52" y="-6" width="56" height="12" rx="4" fill="#3a2010"/>`, { thin: true, blur: 2 })}
  `));

  cover('rebelcell', id => C(id, 'Rebel Cell', 'Five missions, hidden spies', ['#2a3a3a', '#141e1e', '#060a0a'], `
    ${T.surface(id, 'slate', { hz: 26, color: '#1e2424', lx: 300 })}
    ${[0, 1, 2, 3, 4].map(i => T.lay(id, 140 + i * 80, 140, 0, `<circle r="30" fill="${['#2a7a4a', '#8a1a1a', '#2a7a4a', '#3a4444', '#3a4444'][i]}"/><circle r="30" fill="none" stroke="url(#${id}-brass)" stroke-width="3"/>${T.word(String(i + 1), 0, 8, 22, { weight: 700, fill: '#f4eee0' })}`)).join('')}
    ${T.lay(id, 300, 270, -4, `<rect x="-110" y="-70" width="220" height="140" fill="#c8b48a"/><path d="M-110 -70 L0 0 L110 -70" fill="none" stroke="#8a7a5a" stroke-width="2"/>${T.word('TOP SECRET', 0, 40, 18, { font: K.UI, weight: 900, ls: 4, fill: '#8a1a1a' })}`)}
  `));

  cover('powergrab', id => C(id, 'Power Grab', 'Claim any role, call the bluffs', ['#4a2a3a', '#26141e', '#0e060a'], `
    ${T.surface(id, 'leather', { hz: 26, color: '#3a1424', lx: 300 })}
    ${['DUKE', 'SPY', 'THIEF'].map((r, i) => T.lay(id, 190 + i * 110, 190 + (i % 2) * 10, (i - 1) * 10, role(id, r, ['#6a4a1a', '#2a3a5a', '#5a1a2a'][i], `<path d="M-22 6 L-26 -18 L-10 -6 L0 -24 L10 -6 L26 -18 L22 6 Z" fill="url(#${id}-brass)"/>`))).join('')}
    ${[[440, 300], [466, 310], [452, 292]].map(([x, y]) => T.lay(id, x, y, 0, T.coinTop(id, 18, { mark: '' }), { thin: true })).join('')}
  `));

  cover('undercover', id => C(id, 'Undercover Spy', 'Everyone knows the place, except the spy', ['#2a2a3a', '#16161e', '#06060a'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#2a1e14', lx: 300 })}
    ${T.lay(id, 270, 190, -5, `<rect x="-160" y="-110" width="320" height="220" fill="#e8dcbc"/>${[[-110, -60], [-30, -80], [60, -40], [110, 30], [-60, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#a8242a"/>`).join('')}<path d="M-110 -60 L-30 -80 L60 -40 L110 30" stroke="#a8242a" stroke-width="1.5" stroke-dasharray="4 4" fill="none"/>${T.lines(-140, 60, 120, 3, 14, '#6a5a44', { weight: 2, op: .4 })}`)}
    ${T.lay(id, 460, 250, 12, role(id, 'SPY', '#1d1b1a', `<path d="M-26 -4 Q-26 -26 0 -26 Q26 -26 26 -4 Z" fill="#1d1b1a"/><rect x="-34" y="-6" width="68" height="6" fill="#1d1b1a"/>`))}
    ${T.lay(id, 140, 300, -40, T.strip(K.magnifier(id, 0, 0, .9, 0)).replace(/url\(#[^)]*-gold\)/g, `url(#${id}-brass)`), { tilt: .75 })}
  `));

  cover('codecrack', id => {
    const ring = (r, txt, rot, c) => `<g transform="rotate(${rot})"><circle r="${r}" fill="${c}" stroke="url(#${id}-brass)" stroke-width="3"/>${Array.from({ length: 26 }, (_, i) => `<text transform="rotate(${i * 360 / 26}) translate(0 ${-r + 15})" text-anchor="middle" font-family="${T.DISPLAY}" font-weight="700" font-size="${r > 90 ? 15 : 13}" fill="#f4eee0">${txt[i]}</text>`).join('')}</g>`;
    return C(id, 'Code Crack', 'Coded clues, sneaky interceptions', ['#1a3a4a', '#0c1e26', '#040c10'], `
      ${T.surface(id, 'wood', { hz: 26, color: '#2a1a14', lx: 300 })}
      ${T.lay(id, 270, 190, 0, `${ring(118, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 0, '#2a1a10')}${ring(86, 'XYZABCDEFGHIJKLMNOPQRSTUVW', 7, '#5a3416')}<circle r="52" fill="url(#${id}-brass)"/><path d="M0 -118 V-70" stroke="#a8242a" stroke-width="4"/>${T.word('4 · 1 · 3', 0, 8, 22, { weight: 700, fill: '#3a2410' })}`, { tilt: .62 })}
      ${T.lay(id, 470, 300, 10, pad(id, 120, 110, `${hand('1. sea', -40, -18, 16, '#2a2a5a', { anchor: 'start' })}${hand('2. key', -40, 4, 16, '#2a2a5a', { anchor: 'start' })}${hand('3. ring', -40, 26, 16, '#2a2a5a', { anchor: 'start' })}`))}
    `);
  });

  cover('fakeartist', id => C(id, 'Fake Artist', 'One artist doesn’t know the word', ['#6a1a2a', '#380c16', '#140408'], `
    ${T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 })}
    ${T.stand(id, 300, 300, 200, `<g transform="translate(300 170)"><path d="M-100 140 L-60 -110 M100 140 L60 -110 M0 -130 V140" stroke="#6a3a1a" stroke-width="9"/><rect x="-110" y="-96" width="220" height="160" fill="#fbf8f0"/><rect x="-118" y="62" width="236" height="10" fill="#7a4a22"/><path d="M-64 30 Q-54 -40 0 -50" stroke="#a8242a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M0 -50 Q54 -40 64 20" stroke="#2a5ab8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M64 20 Q30 40 -10 30" stroke="#2a8a3a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-30 -10 l20 30 l-40 10 l30 -50" stroke="#c8902a" stroke-width="5" fill="none" stroke-linecap="round"/></g>`)}
    ${['#a8242a', '#2a5ab8', '#2a8a3a', '#c8902a'].map((c, i) => T.lay(id, 100 + i * 20, 320, 60 + i * 6, `<rect x="-7" y="-70" width="14" height="110" rx="6" fill="#f4eee0"/><rect x="-7" y="-70" width="14" height="30" rx="6" fill="${c}"/>`, { thin: true })).join('')}
  `));
}
