// Painted covers: board and dice games that used to lean on emoji.
export default function paint(K) {
  const { cover, shell, glow, SERIF, UI } = K;
  const S = (title, tag, bg, cy = 34) => ({ title, tag, bg, cy });
  const pawn = (id, x, y, c, s = 1) => `<g ${K.at(x, y, s)} ${K.sh(id)}><ellipse cy="26" rx="22" ry="8" fill="${K.shade(c, -.4)}"/><path d="M-20 26 Q-20 10 -10 0 Q-16 -10 -10 -18 Q0 -26 10 -18 Q16 -10 10 0 Q20 10 20 26 Z" fill="${c}"/><circle cy="-30" r="13" fill="${c}"/><ellipse cx="-5" cy="-34" rx="5" ry="3" fill="#fff" opacity=".5"/></g>`;

  cover('codebreaker', id => shell(id, S('Code Breaker', 'Set a code, crack theirs', ['#6a4424', '#3a2412', '#140c04'], 30), `
    <g transform="translate(220 160) rotate(-6)" ${K.sh(id)}><rect x="-90" y="-130" width="180" height="270" rx="12" fill="#3a2010"/><rect x="-82" y="-122" width="164" height="254" rx="8" fill="#5a3418"/>
      ${[0, 1, 2, 3, 4, 5].map(r => `${[0, 1, 2, 3].map(c => { const col = r < 3 ? ['#c8232a', '#2a6ad8', '#e6b82a', '#2a9a4a', '#f3ead6', '#8a3ab8'][(r * 2 + c * 3) % 6] : null; return col ? `<circle cx="${-56 + c * 30}" cy="${100 - r * 36}" r="11" fill="${col}"/><circle cx="${-59 + c * 30}" cy="${97 - r * 36}" r="3" fill="#fff" opacity=".5"/>` : `<circle cx="${-56 + c * 30}" cy="${100 - r * 36}" r="5" fill="#2a1408"/>`; }).join('')}${r < 3 ? [0, 1, 2, 3].map(k => `<circle cx="${62 + (k % 2) * 10}" cy="${94 - r * 36 + Math.floor(k / 2) * 10}" r="3.5" fill="${k < 2 - (r % 2) ? '#1d1b1a' : '#f3ead6'}"/>`).join('') : ''}`).join('')}</g>
    ${K.padlock(id, 440, 160, 1.15)}
    <g transform="translate(440 178)"><rect x="-38" y="6" width="76" height="22" rx="4" fill="#1d1b1a"/>${['3', '1', '4'].map((d, i) => `<text x="${-22 + i * 22}" y="23" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="15" fill="#ffd36a">${d}</text>`).join('')}</g>
  `));

  cover('hotdice', id => shell(id, S('Hot Dice', 'Keep the scorers, bank before you bust', ['#7a2228', '#401014', '#160406'], 30), `
    <path d="M100 300 C80 220 140 200 130 130 C170 170 180 120 200 80 C220 140 260 140 250 70 C300 120 330 110 330 40 C380 100 400 150 390 200 C420 180 440 160 450 120 C490 190 500 250 480 300 Z" fill="#e8642a" opacity=".85" filter="url(#${id}-glow)"/>
    <path d="M160 300 C150 240 190 220 190 170 C220 200 240 180 250 140 C270 190 300 180 310 130 C340 180 360 200 350 240 C370 230 390 210 400 190 C420 240 420 270 410 300 Z" fill="#ffc03a" opacity=".9"/>
    ${K.die3(id, 200, 250, .8, [5, 1, 3], { rot: -10 })}${K.die3(id, 290, 236, .9, [1, 5, 6], { rot: 6 })}${K.die3(id, 390, 256, .8, [5, 2, 4], { rot: 14 })}${K.die3(id, 250, 170, .7, [1, 3, 2], { rot: -18 })}${K.die3(id, 350, 166, .7, [5, 4, 1], { rot: 10 })}
  `));

  cover('sweettrail', id => {
    const path = 'M60 300 C120 220 240 300 300 230 C360 160 220 120 300 90 C380 60 480 140 540 80';
    const lolly = (x, y, c, s = 1) => `<g ${K.at(x, y, s)} ${K.sh(id)}><rect x="-3" y="0" width="6" height="70" fill="#f3ead6"/><circle r="30" fill="${c}"/><path d="M0 0 m-22 0 a22 22 0 1 1 22 22 a14 14 0 1 1 -14 -14 a7 7 0 1 1 7 7" stroke="#fff" stroke-width="5" fill="none" opacity=".8"/></g>`;
    return shell(id, S('Sweet Trail', 'Draw a colour, hop along', ['#7a4a8a', '#3e2648', '#140a18'], 30), `
      <path d="M0 260 Q300 220 600 260 V400 H0 Z" fill="#7ac86a" opacity=".5"/>
      <path d="${path}" stroke="#fbf6ea" stroke-width="44" fill="none" stroke-linecap="round"/>
      <path d="${path}" stroke-width="40" fill="none" stroke-linecap="round" stroke="url(#${id}-trail)" stroke-dasharray="26 6"/>
      <defs>${K.lin(`${id}-trail`, [[0, '#e8473c'], [.2, '#f39a1e'], [.4, '#f2cf2a'], [.6, '#36a852'], [.8, '#2f7de1'], [1, '#8b45c8']], 1, 0)}</defs>
      ${lolly(110, 120, '#e8473c')}${lolly(470, 220, '#2f7de1', .9)}${lolly(200, 90, '#f2cf2a', .7)}
      ${pawn(id, 300, 216, '#e88ad8', .9)}
      <g transform="translate(520 60)" ${K.sh(id)}><rect x="-30" y="-10" width="60" height="50" fill="#f3d0e0"/><path d="M-36 -10 L0 -44 L36 -10 Z" fill="#e8473c"/><rect x="-8" y="14" width="16" height="26" fill="#8a4a2a"/></g>
    `);
  });

  cover('orchard', id => {
    const tree = (x, y, fruit, s = 1) => `<g ${K.at(x, y, s)} ${K.sh(id)}><rect x="-8" y="0" width="16" height="70" fill="#6a3a1a"/><circle cy="-30" r="56" fill="#3a8a3a"/><circle cx="-30" cy="-10" r="36" fill="#2e7a2e"/><circle cx="32" cy="-14" r="34" fill="#2e7a2e"/><circle cx="-14" cy="-56" r="20" fill="#4aa04a" opacity=".7"/>${[[-30, -40], [10, -60], [30, -20], [-10, -10], [-40, 0], [24, 8]].map(([dx, dy]) => `<circle cx="${dx}" cy="${dy}" r="9" fill="${fruit}"/><circle cx="${dx - 3}" cy="${dy - 3}" r="3" fill="#fff" opacity=".5"/>`).join('')}</g>`;
    return shell(id, S('Orchard', 'Pick the fruit, beat the crow', ['#4a7a3a', '#263e1e', '#0a1408'], 26), `
      <path d="M0 220 Q300 190 600 220 V400 H0 Z" fill="#5a8a3a"/>
      ${tree(130, 190, '#c8232a', .9)}${tree(300, 170, '#f2cf2a')}${tree(470, 190, '#8a3ab8', .9)}
      ${K.bird(id, 300, 60, .55, 'raven', '#14121a')}
      <g transform="translate(300 260)" ${K.sh(id)}><path d="M-50 -10 h100 l-12 40 h-76 Z" fill="#c88a4a"/><path d="M-44 0 h88 M-40 14 h80" stroke="#8a5a2a" stroke-width="3"/><path d="M-40 -10 Q0 -60 40 -10" stroke="#8a5a2a" stroke-width="5" fill="none"/>${[[-20, -16, '#c8232a'], [0, -20, '#f2cf2a'], [20, -16, '#8a3ab8']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/>`).join('')}</g>
    `);
  });

  cover('pardon', id => {
    let track = '';
    for (let i = 0; i < 16; i++) { const x = 70 + i * 30; track += `<rect x="${x}" y="70" width="28" height="28" rx="3" fill="#f3ead6" stroke="#2a4a7a"/><rect x="${x}" y="230" width="28" height="28" rx="3" fill="#f3ead6" stroke="#2a4a7a"/>`; }
    for (let i = 0; i < 4; i++) track += `<rect x="70" y="${100 + i * 32}" width="28" height="28" rx="3" fill="#f3ead6" stroke="#2a4a7a"/><rect x="520" y="${100 + i * 32}" width="28" height="28" rx="3" fill="#f3ead6" stroke="#2a4a7a"/>`;
    return shell(id, S('Pardon Me!', 'Slide, swap and bump them home', ['#2a4a7a', '#14243e', '#060a14'], 30), `
      <g ${K.sh(id)}><rect x="50" y="50" width="520" height="230" rx="10" fill="#1a3a6a"/>${track}<path d="M130 84 H230" stroke="#c8232a" stroke-width="10" stroke-linecap="round"/><circle cx="130" cy="84" r="8" fill="#c8232a"/><path d="M380 244 H480" stroke="#2a9a4a" stroke-width="10" stroke-linecap="round"/><circle cx="480" cy="244" r="8" fill="#2a9a4a"/></g>
      ${pawn(id, 240, 160, '#c8232a')}${pawn(id, 300, 176, '#2a6ad8')}${pawn(id, 360, 160, '#e6b82a')}${pawn(id, 420, 176, '#2a9a4a')}
      <g transform="translate(160 150) rotate(-12)" ${K.sh(id)}><rect x="-36" y="-50" width="72" height="100" rx="8" fill="#fbf6ea"/><text y="-12" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="12" fill="#2a4a7a">PARDON</text><text y="22" text-anchor="middle" font-family="${SERIF}" font-size="32" fill="#c8232a">ME!</text></g>
    `);
  });
}
