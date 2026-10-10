// Still-life covers: the casino and card room.
export default function paint(K) {
  const { cover, shell, T } = K;
  const S = (title, tag, bg) => ({ title, tag, bg });

  cover('roulette', id => shell(id, S('Roulette', 'Red · black · zero', ['#2a7a48', '#0f3a20', '#04140a']), `${T.defs(id)}
    ${T.surface(id, 'felt', { hz: 28, lx: 300, ly: 150, color: '#1d5634' })}
    <g opacity=".5" stroke="#e9d29a" fill="none" stroke-width="1.6"><path d="M-10 330 Q300 300 610 330"/><path d="M-10 372 Q300 340 610 372"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${40 + i * 90} ${328 - Math.abs(i - 3) * -2} L${20 + i * 94} 400"/>`).join('')}</g>
    ${T.stand(id, 300, 250, 300, K.roulette(id, 300, 170, 1.55, { tilt: .5, ball: 82 }).replace(`filter="url(#${id}-sh)"`, ''))}
    ${T.chips(id, 520, 300, 34, 9, '#a8202a')}${T.chips(id, 470, 330, 34, 5, '#1d1d24', { edge: '#d8b46a' })}
    ${T.lay(id, 120, 300, -20, T.chipTop(id, 30, '#2a4a9a', { label: '25' }))}${T.lay(id, 175, 318, 30, T.chipTop(id, 30, '#e8e2d4', { label: '5', ink: '#2a2018', edge: '#2a4a9a' }))}
    ${T.chips(id, 60, 390, 46, 6, '#a8202a', { blur: 4 })}
  `));

  cover('holdem', id => shell(id, S('Texas Hold’em', 'No-limit · chips · nerve', ['#2a4a6e', '#1c2f4a', '#0a1422']), `${T.defs(id)}
    ${T.surface(id, 'felt', { hz: 40, lx: 300, ly: 200, color: '#1b4f37' })}
    ${['10H', 'JC', 'QD', '4S', '9H'].map((c, i) => T.lay(id, 140 + i * 80, 150, (i - 2) * 1.5, T.pcard(id, c.slice(0, -1), c.slice(-1), 70))).join('')}
    ${T.lay(id, 270, 300, -14, T.pcard(id, 'A', '♠', 112))}${T.lay(id, 340, 296, 10, T.pcard(id, 'A', '♥', 112))}
    ${T.chips(id, 500, 120, 28, 12, '#1d1d24', { edge: '#d8b46a', blur: 2 })}${T.chips(id, 555, 140, 28, 7, '#a8202a', { blur: 2 })}
    ${T.chips(id, 80, 330, 36, 8, '#2a4a9a')}
    ${T.lay(id, 470, 300, 0, `<circle r="26" fill="#fbf8f0" stroke="#1d1d24" stroke-width="2"/><circle r="20" fill="none" stroke="#1d1d24" stroke-width="1"/>${T.word('DEALER', 0, 4, 10, { font: K.UI, weight: 900, ls: 1.5 })}`)}
  `));

  cover('blackjack', id => shell(id, S('Blackjack', 'Twenty-one · beat the house', ['#2f6b50', '#1a4a36', '#0a1f16']), `${T.defs(id)}
    ${T.surface(id, 'felt', { hz: 30, lx: 300, ly: 180, color: '#1a5a3a' })}
    <path id="${id}-arc" d="M60 200 Q300 120 540 200" fill="none"/><path d="M50 214 Q300 132 550 214" fill="none" stroke="#e9d29a" stroke-width="1.5" opacity=".6"/>
    <text font-family="${T.DISPLAY}" font-weight="700" font-size="22" letter-spacing="5" fill="#e9d29a" opacity=".75"><textPath href="#${id}-arc" startOffset="50%" text-anchor="middle">BLACKJACK PAYS 3 TO 2</textPath></text>
    ${T.lay(id, 255, 270, -9, T.pcard(id, 'A', '♠', 116))}${T.lay(id, 345, 270, 7, T.pcard(id, 'K', '♥', 116))}
    ${T.chips(id, 480, 330, 34, 7, '#a8202a')}${T.chips(id, 120, 330, 34, 4, '#1d1d24', { edge: '#d8b46a' })}
  `));

  cover('derbyday', id => {
    const rosette = `<g>${Array.from({ length: 28 }, (_, i) => `<path d="M0 0 L${(46 * Math.cos(i * Math.PI / 14)).toFixed(1)} ${(46 * Math.sin(i * Math.PI / 14)).toFixed(1)} L${(46 * Math.cos((i + .5) * Math.PI / 14)).toFixed(1)} ${(46 * Math.sin((i + .5) * Math.PI / 14)).toFixed(1)} Z" fill="${i % 2 ? '#1a3a8a' : '#2a4a9e'}"/>`).join('')}<path d="M-14 30 L-30 110 L-16 100 L-6 116 L4 34 Z M14 30 L30 110 L16 100 L6 116 L-4 34 Z" fill="#1a3a8a"/><circle r="28" fill="#f4eee0"/><circle r="24" fill="none" stroke="#c9a35a" stroke-width="1.5"/>${T.word('1st', 0, 9, 22, { weight: 700, fill: '#1a3a8a' })}</g>`;
    const prog = T.sheet(id, 210, 290, `<rect x="-95" y="-135" width="190" height="44" fill="#1a3a2a"/>${T.word('RACE IV', 0, -104, 24, { weight: 700, fill: '#f4eee0', ls: 4 })}${T.word('The Autumn Stakes', 0, -70, 16, { italic: true })}${[0, 1, 2, 3, 4, 5].map(i => `<text x="-86" y="${-34 + i * 30}" font-family="${T.DISPLAY}" font-weight="700" font-size="16" fill="#2a2018">${i + 1}</text>${T.lines(-62, -38 + i * 30, 120, 1, 0, '#6a5a44', { op: .55 })}<text x="86" y="${-34 + i * 30}" text-anchor="end" font-family="${T.DISPLAY}" font-size="14" fill="#6a5a44">${['5/2', '4/1', '7/1', '9/2', '12/1', '20/1'][i]}</text>`).join('')}<ellipse cx="0" cy="-4" rx="70" ry="13" fill="none" stroke="#b0202a" stroke-width="2.5" transform="rotate(-4)"/>`);
    const slip = T.sheet(id, 120, 70, `${T.word('BET · WIN', -46, -14, 11, { anchor: 'start', font: K.UI, weight: 800, ls: 1.5, fill: '#7a2a2a' })}${T.word('No. 2', -46, 10, 18, { anchor: 'start', weight: 700 })}${T.word('$20', 46, 10, 18, { anchor: 'end', weight: 700 })}`, { fill: '#f3e7c8' });
    const bino = `<g><rect x="-58" y="-22" width="50" height="78" rx="18" fill="#1d1b1a"/><rect x="8" y="-22" width="50" height="78" rx="18" fill="#1d1b1a"/><rect x="-60" y="-34" width="54" height="24" rx="10" fill="url(#${id}-brass)"/><rect x="6" y="-34" width="54" height="24" rx="10" fill="url(#${id}-brass)"/><rect x="-10" y="-6" width="20" height="40" rx="6" fill="#2a2826"/><rect x="-52" y="-16" width="10" height="66" rx="5" fill="#fff" opacity=".1"/></g>`;
    return shell(id, S('Derby Day', 'Back a horse · watch it run', ['#3a7a2a', '#1e3e14', '#081406']), `${T.defs(id)}
      ${T.surface(id, 'leather', { hz: 34, lx: 280, ly: 180, color: '#1f3a28' })}
      ${T.lay(id, 270, 185, -6, prog)}
      ${T.lay(id, 440, 215, 12, rosette, { tilt: .7 })}
      ${T.lay(id, 140, 270, -18, slip)}
      ${T.lay(id, 500, 360, 24, bino, { blur: 4, tilt: .8 })}
      ${T.lay(id, 380, 300, 50, `<rect x="-6" y="-80" width="12" height="160" fill="#c9a24a"/><path d="M-6 80 L0 98 L6 80 Z" fill="#e8d4a8"/><path d="M-2 92 L0 98 L2 92 Z" fill="#1d1b1a"/>`)}
    `);
  });

  cover('quickdraw', id => {
    const watch = `<circle r="78" fill="url(#${id}-brass)"/><circle r="70" fill="#7a5a1e"/><circle r="66" fill="#f7f1e2"/>${Array.from({ length: 60 }, (_, i) => `<path d="M0 -62 V${i % 5 ? -58 : -52}" stroke="#2a2018" stroke-width="${i % 5 ? 1 : 2.4}" transform="rotate(${i * 6})"/>`).join('')}${['XII', 'III', 'VI', 'IX'].map((n, i) => `<text transform="rotate(${i * 90}) translate(0 -38) rotate(${-i * 90})" y="6" text-anchor="middle" font-family="${T.DISPLAY}" font-weight="700" font-size="16" fill="#2a2018">${n}</text>`).join('')}<path d="M0 6 L-3 0 L0 -48 L3 0 Z" fill="#1d1b1a"/><path d="M0 6 L-2.4 0 L0 -36 L2.4 0 Z" fill="#1d1b1a" transform="rotate(2)"/><circle r="4" fill="url(#${id}-brass)"/><circle cy="-92" r="12" fill="none" stroke="url(#${id}-brass)" stroke-width="5"/><rect x="-8" y="-84" width="16" height="10" rx="2" fill="url(#${id}-brass)"/><circle r="66" fill="url(#${id}-glass)"/><defs><linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
    const chain = Array.from({ length: 22 }, (_, i) => { const t = i / 21, cx = -8 - t * 190, cy = -104 + Math.sin(t * Math.PI) * 70 + t * 40; return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="6" ry="3.4" fill="none" stroke="url(#${id}-brass)" stroke-width="2" transform="rotate(${i % 2 ? 70 : -10} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`; }).join('');
    const star = K.star(id, 0, 0, 1).replace(`filter="url(#${id}-sh)"`, '').replace(/url\(#[^)]*-gold\)/g, `url(#${id}-silver)`);
    return shell(id, S('Quick Draw', 'Wait for it, then tap', ['#8a5a2a', '#482e14', '#180e06']), `${T.defs(id)}
      ${T.surface(id, 'wood', { hz: 26, lx: 300, ly: 180, color: '#6a3c1c' })}
      ${T.lay(id, 300, 180, -8, `${chain}${watch}`, { s: 1.05, tilt: .7 })}
      ${T.lay(id, 470, 290, 16, star, { tilt: .66, s: .85 })}
      ${T.lay(id, 120, 300, -30, `<rect x="-60" y="-8" width="120" height="16" rx="8" fill="#5a3418"/><rect x="-60" y="-8" width="40" height="16" rx="8" fill="#3a2010"/>`, { blur: 2 })}
    `);
  });

  cover('mafianight', id => {
    const role = (t, c) => T.sheet(id, 110, 154, `<rect x="-47" y="-69" width="94" height="138" rx="4" fill="none" stroke="${c}" stroke-width="1.5"/><rect x="-42" y="-64" width="84" height="128" rx="3" fill="none" stroke="${c}" stroke-width=".6"/>${T.word(t, 0, 6, t.length > 6 ? 15 : 19, { weight: 700, fill: c, ls: 2.5 })}<path d="M-26 20 H26" stroke="${c}" stroke-width="1"/>`, { r: 6, fill: '#f3ead6' });
    const rose = `<path d="M-120 20 C-60 14 -10 4 30 -2" stroke="#2a4a1a" stroke-width="5" fill="none"/>${[[-80, 14, -30], [-40, 8, 30]].map(([x, y, r]) => `<path d="M${x} ${y} q16 -20 34 -10 q-14 18 -34 10 Z" fill="#2e5a22" transform="rotate(${r} ${x} ${y})"/>`).join('')}<g transform="translate(40 -4)">${[[0, 0, 26, '#6a0a1a'], [-6, -4, 20, '#8a1424'], [4, -6, 16, '#a81c2c'], [-2, -2, 10, '#c42a38'], [1, -3, 5, '#7a0e1c']].map(([dx, dy, r, c]) => `<ellipse cx="${dx}" cy="${dy}" rx="${r}" ry="${r * .82}" fill="${c}"/>`).join('')}<path d="M-14 -6 Q0 -22 16 -8" stroke="#5a0814" stroke-width="2" fill="none"/></g>`;
    return shell(id, S('Mafia Night', 'Secret roles after dark', ['#3a1424', '#1e0a12', '#0a0406']), `${T.defs(id)}
      ${T.surface(id, 'wood', { hz: 40, lx: 320, ly: 200, color: '#3a2014', light: .28 })}
      ${T.lay(id, 190, 160, -14, role('DOCTOR', '#2a4a6a'))}${T.lay(id, 410, 160, 12, role('DETECTIVE', '#3a3a3a'))}${T.lay(id, 300, 148, -2, role('MAFIA', '#8a1424'))}
      ${T.lay(id, 300, 300, -8, rose, { tilt: .7, s: 1.35 })}
      ${T.stand(id, 520, 120, 40, `<g filter="url(#${id}-b4)"><rect x="502" y="40" width="36" height="80" fill="#efe4cc"/><path d="M520 10 C530 24 528 34 520 38 C512 34 510 24 520 10 Z" fill="#ffd36a"/></g><circle cx="520" cy="26" r="40" fill="#ffc860" opacity=".25" filter="url(#${id}-b8)"/>`, { noShadow: true })}
    `);
  });

  cover('captionit', id => {
    const photo = T.sheet(id, 200, 230, `<rect x="-86" y="-100" width="172" height="160" fill="#7ab0d0"/><rect x="-86" y="-100" width="172" height="160" fill="url(#${id}-ph)"/><path d="M-86 60 L-86 10 Q-30 -6 20 10 Q60 22 86 6 V60 Z" fill="#5a8a3a"/><g transform="translate(14 22)"><ellipse rx="26" ry="16" fill="#f4f0e6"/><circle cx="22" cy="-10" r="10" fill="#2a2420"/><path d="M-16 14 v12 M-4 16 v12 M8 16 v12 M18 14 v12" stroke="#2a2420" stroke-width="3"/></g><g transform="translate(-40 -4)"><rect x="-22" y="-6" width="44" height="18" rx="4" fill="#a8202a"/><rect x="-12" y="-16" width="24" height="12" rx="3" fill="#a8202a"/><circle cx="-12" cy="14" r="6" fill="#1d1b1a"/><circle cx="12" cy="14" r="6" fill="#1d1b1a"/></g><defs><linearGradient id="${id}-ph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`, { fill: '#fbfaf6' });
    const note = T.sheet(id, 150, 120, `${T.word('“He asked', 0, -12, 22, { italic: true, font: "'Cormorant Garamond', serif", fill: '#2a2a5a' })}${T.word('for a lift.”', 0, 16, 22, { italic: true, font: "'Cormorant Garamond', serif", fill: '#2a2a5a' })}`, { fill: '#f6e27a' });
    return shell(id, S('Caption It', 'Write the funniest caption', ['#1a4a6a', '#0c2638', '#040e14']), `${T.defs(id)}
      ${T.surface(id, 'linen', { hz: 30, lx: 280, ly: 180, color: '#cfc2a6' })}
      ${T.lay(id, 250, 180, -7, photo, { tilt: .72 })}
      ${T.lay(id, 430, 250, 9, note, { tilt: .72 })}
      ${T.lay(id, 470, 120, 58, `<rect x="-8" y="-90" width="16" height="150" rx="6" fill="#1d1b1a"/><rect x="-8" y="-90" width="16" height="40" rx="6" fill="#2a2a5a"/><path d="M-6 60 L0 78 L6 60 Z" fill="#2a2a5a"/>`)}
      ${T.lay(id, 90, 330, -20, T.sheet(id, 150, 120, '', { fill: '#f6e27a' }), { blur: 4, tilt: .72 })}
    `);
  });

  cover('wildfacts', id => {
    const wing = (sx, c1, c2) => `<g transform="scale(${sx} 1)"><path d="M0 -4 C20 -60 90 -70 96 -30 C100 -6 60 6 0 0 Z" fill="${c1}"/><path d="M0 2 C40 6 76 16 70 46 C64 70 24 56 0 6 Z" fill="${c2}"/><path d="M0 -4 C20 -60 90 -70 96 -30" fill="none" stroke="#1d1410" stroke-width="5"/><circle cx="66" cy="-36" r="9" fill="#f4eee0"/><circle cx="66" cy="-36" r="5" fill="#1d1410"/><path d="M10 -6 L80 -40 M10 0 L84 -12 M8 6 L60 40" stroke="#1d1410" stroke-width="1.2" opacity=".6"/></g>`;
    const fly = `${wing(1, '#d8782a', '#b85a1a')}${wing(-1, '#d8782a', '#b85a1a')}<ellipse rx="6" ry="34" cy="8" fill="#1d1410"/><path d="M-2 -22 Q-16 -50 -24 -56 M2 -22 Q16 -50 24 -56" stroke="#1d1410" stroke-width="1.6" fill="none"/>`;
    const card = T.sheet(id, 250, 210, `<rect x="-115" y="-95" width="230" height="190" fill="none" stroke="#2a3a2a" stroke-width="1"/>${'' }<g transform="translate(0 -10) scale(.8)">${fly}</g>${T.word('Danaus plexippus', 0, 80, 15, { italic: true, fill: '#3a3a2a' })}`, { fill: '#f1ead8' });
    return shell(id, S('Wild Facts', 'Animal trivia', ['#3e7a3e', '#1e3e1e', '#081608']), `${T.defs(id)}
      ${T.surface(id, 'wood', { hz: 30, lx: 290, ly: 190, color: '#4a2c16' })}
      ${T.lay(id, 280, 180, -4, card, { tilt: .7 })}
      ${T.lay(id, 470, 280, -30, K.magnifier(id, 0, 0, 1.2, 0).replace(`filter="url(#${id}-sh)"`, ''), { tilt: .75 })}
      ${T.lay(id, 100, 160, 30, `<path d="M0 -90 C30 -60 24 30 2 80 L-2 80 C-20 30 -30 -60 0 -90 Z" fill="#ece4d2"/><path d="M0 -86 V80" stroke="#8a7a5a" stroke-width="1.4"/>${Array.from({ length: 14 }, (_, i) => `<path d="M0 ${-74 + i * 11} l${i % 2 ? 18 : -18} -6" stroke="#cfc4aa" stroke-width="1"/>`).join('')}`, { tilt: .75 })}
      ${T.soft(id, 4, `<g transform="translate(120 360) rotate(-12)"><rect x="-90" y="-50" width="180" height="100" rx="4" fill="#2a4a2a"/><rect x="-82" y="-50" width="10" height="100" fill="#1a2a1a"/></g>`)}
    `);
  });
}
