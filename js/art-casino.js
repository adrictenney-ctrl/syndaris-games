// Painted covers: the casino floor.
export default function paint(K) {
  const { cover, shell, card, chip, stack, glow, SERIF, UI, SYM } = K;
  const S = (title, tag, bg, cy = 34) => ({ title, tag, bg, cy });

  cover('roulette', id => shell(id, S('Roulette', 'Red · black · zero', ['#2a7a48', '#0f3a20', '#04140a']), `
    ${K.felt(id, '#1a5a32', 250)}
    ${glow(id, 300, 150, 150, '#ffe0a0', .22)}
    ${K.roulette(id, 300, 170, 1.32)}
    ${stack(id, 108, 300, 30, 6, '#b8232a')}${stack(id, 168, 318, 30, 4, '#1d1d22', '#d8b46a')}${stack(id, 492, 306, 30, 7, '#2a4aa8')}
    ${chip(id, 430, 330, 26, '#e6c25a', { label: '25', ink: '#3a2a0a', edge: '#fff6dc' })}
  `));

  cover('tripledice', id => shell(id, S('Triple Dice', 'Big · small · triples', ['#8a2a2a', '#481414', '#180606']), `
    ${glow(id, 300, 170, 160, '#ffb070', .25)}
    <g ${K.sh(id)}><ellipse cx="300" cy="270" rx="190" ry="44" fill="#2a1206"/><ellipse cx="300" cy="262" rx="182" ry="40" fill="#6e3a1a"/><ellipse cx="300" cy="258" rx="160" ry="32" fill="#1a5a32"/></g>
    <path d="M150 250 Q150 70 300 62 Q450 70 450 250" fill="#dfeaf2" opacity=".14" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <path d="M190 120 Q220 84 270 76" stroke="#fff" stroke-opacity=".55" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${K.die3(id, 240, 220, .95, [4, 2, 6], { rot: -8 })}${K.die3(id, 352, 226, .95, [4, 5, 3], { rot: 6 })}${K.die3(id, 298, 168, .95, [4, 1, 2], { rot: -2 })}
    <g font-family="${UI}" font-weight="900" font-size="16" letter-spacing="4" fill="#e9d29a" opacity=".85"><text x="80" y="70">BIG</text><text x="474" y="70">SMALL</text></g>
  `));

  cover('luckynumbers', id => {
    const ball = (x, y, n, c, s = 1) => `<g ${K.at(x, y, s)} ${K.sh(id)}><circle r="30" fill="${c}"/><circle r="17" fill="#fffaf0"/><text y="7" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="18" fill="#1d1b1a">${n}</text><ellipse cx="-11" cy="-14" rx="9" ry="5" fill="#fff" opacity=".55"/></g>`;
    const ticket = `<g transform="translate(150 200) rotate(-8)" ${K.sh(id)}><rect x="-80" y="-100" width="160" height="200" rx="6" fill="#fbf3dc"/><rect x="-80" y="-100" width="160" height="30" rx="6" fill="#b8232a"/><text y="-79" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="14" letter-spacing="3" fill="#fff">LUCKY</text>${Array.from({ length: 30 }, (_, i) => { const x = -64 + (i % 6) * 26, y = -52 + Math.floor(i / 6) * 28, on = [3, 8, 14, 21, 26].includes(i); return `<text x="${x}" y="${y}" text-anchor="middle" font-family="${UI}" font-weight="700" font-size="12" fill="#5a4a3a">${i + 1}</text>${on ? `<circle cx="${x}" cy="${y - 4}" r="10" fill="none" stroke="#b8232a" stroke-width="2.5"/>` : ''}`; }).join('')}</g>`;
    return shell(id, S('Lucky Numbers', 'Pick yours · ten are drawn', ['#3a2a7a', '#1c1440', '#080616']), `
      ${glow(id, 380, 160, 150, '#a08aff', .25)}
      <g ${K.sh(id)}><circle cx="390" cy="150" r="100" fill="#dfeaf2" opacity=".16" stroke="#fff" stroke-opacity=".4" stroke-width="2"/><rect x="370" y="246" width="40" height="40" fill="url(#${id}-gold)"/><path d="M330 286 h120 l-14 26 h-92 Z" fill="url(#${id}-gold)"/></g>
      ${ball(350, 120, 7, '#b8232a', .9)}${ball(420, 100, 22, '#2a6ad8', .9)}${ball(440, 175, 31, '#e6b82a', .9)}${ball(365, 190, 14, '#2a9a4a', .9)}${ball(395, 150, 40, '#8a3ac8', .9)}
      <path d="M330 80 Q350 60 380 56" stroke="#fff" stroke-opacity=".6" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${ticket}${ball(500, 300, 3, '#b8232a')}
    `);
  });

  cover('moneywheel', id => shell(id, S('Money Wheel', 'Where will it stop?', ['#8a6a1a', '#4a380c', '#181204'], 30), `
    ${glow(id, 300, 170, 170, '#ffe08a', .28)}
    ${K.stage(id)}
    ${K.wheel(id, 300, 190, 1.25, null, { n: 24, colorOf: i => ['#b8232a', '#2a4aa8', '#2a8a4a', '#e6b82a', '#7a3ab8', '#1d1b1a'][(i * 5) % 6], labels: ['$1', '$2', '$5', '$1', '$10', '$1', '$2', '$20', '$1', '$5', '$2', '$40'], fs: 11 })}
    <g ${K.sh(id)}><path d="M300 52 L286 22 L314 22 Z" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><circle cx="300" cy="20" r="9" fill="url(#${id}-gold)" stroke="#6a4a1a"/></g>
  `));

  cover('derbyday', id => shell(id, S('Derby Day', 'Back a horse · watch it run', ['#3a7a2a', '#1e3e14', '#081406'], 26), `
    <rect width="600" height="150" fill="#9ac8e8" opacity=".18"/>
    <path d="M0 150 Q300 120 600 150 V400 H0 Z" fill="#2e5a1e"/>
    ${[0, 1, 2, 3].map(i => `<path d="M-20 ${178 + i * 46} Q300 ${158 + i * 46} 620 ${178 + i * 46}" stroke="#f3ead6" stroke-opacity=".5" stroke-width="3" fill="none"/>`).join('')}
    ${[60, 130, 200, 270, 340, 410, 480, 550].map(x => `<rect x="${x}" y="118" width="4" height="34" fill="#f3ead6"/>`).join('')}<path d="M40 122 H580" stroke="#f3ead6" stroke-width="4"/>
    ${K.horse(id, 190, 250, .95, '#2a4aa8', '#5a3418')}${K.horse(id, 330, 206, 1.05, '#c8232a', '#2a1a10')}${K.horse(id, 460, 280, 1, '#e6b82a', '#7a4a22')}
    <g transform="translate(540 120)" ${K.sh(id)}><rect x="-3" y="0" width="6" height="80" fill="#f3ead6"/><rect x="0" y="0" width="40" height="28" fill="#fff"/>${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c => (r + c) % 2 ? `<rect x="${c * 8}" y="${r * 7}" width="8" height="7" fill="#1d1b1a"/>` : '').join('')).join('')}</g>
  `));

  cover('oddoreven', id => shell(id, S('Odd or Even', 'Two dice · one cup', ['#7a4a2a', '#3e2414', '#140a04']), `
    ${K.wood(id, 250, '#4a2a12')}
    ${glow(id, 300, 170, 140, '#ffc890', .22)}
    <g transform="translate(220 196) rotate(-14)" ${K.sh(id)}><path d="M-70 -70 Q-74 40 -60 70 L60 70 Q74 40 70 -70 Z" fill="#3a1e0c"/><path d="M-70 -70 Q0 -84 70 -70 Q0 -56 -70 -70 Z" fill="#1a0c04"/><path d="M-58 -50 Q-62 30 -50 60" stroke="#fff" stroke-opacity=".18" stroke-width="10" fill="none" stroke-linecap="round"/><ellipse cy="70" rx="62" ry="12" fill="#5a2e14"/><path d="M-70 -20 Q0 -10 70 -20" stroke="url(#${id}-gold)" stroke-width="5" fill="none"/></g>
    ${K.die3(id, 380, 250, .85, [3, 1, 5], { rot: 6 })}${K.die3(id, 470, 270, .8, [4, 2, 6], { rot: -10 })}
    <g font-family="${SERIF}" font-size="30" fill="#e9d29a"><text x="410" y="120" text-anchor="middle">odd</text><text x="510" y="150" text-anchor="middle" opacity=".7">even</text></g>
  `));

  cover('dicepit', id => shell(id, S('Dice Pit', 'Pass line · field · long shots', ['#1e6a4a', '#0e3624', '#04120c']), `
    ${K.felt(id, '#185a3c', 120)}
    <g fill="none" stroke="#f3ead6" stroke-opacity=".6" stroke-width="3"><path d="M30 200 Q300 140 570 200"/><path d="M60 250 Q300 196 540 250"/><rect x="380" y="150" width="140" height="56" rx="6" transform="rotate(4 450 178)"/></g>
    <g font-family="${UI}" font-weight="900" letter-spacing="5" fill="#f3ead6" opacity=".75"><text x="300" y="232" text-anchor="middle" font-size="18">PASS LINE</text><text x="450" y="186" text-anchor="middle" font-size="14" transform="rotate(4 450 178)">FIELD</text><text x="160" y="168" font-size="13" transform="rotate(-6 160 168)">COME</text></g>
    ${K.die3(id, 220, 290, .9, [6, 1, 2], { rot: -16 })}${K.die3(id, 320, 300, .9, [1, 4, 5], { rot: 12 })}
    ${stack(id, 470, 300, 30, 5, '#b8232a')}${stack(id, 530, 320, 30, 3, '#1d1d22', '#d8b46a')}
    <path d="M60 120 Q140 60 210 230" stroke="#c9a35a" stroke-width="3" fill="none" stroke-dasharray="2 8" opacity=".6"/>
  `));

  cover('pegdrop', id => {
    let pegs = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c <= r + 3; c++) { const x = 300 + (c - (r + 3) / 2) * 34, y = 70 + r * 26; pegs += `<circle cx="${x}" cy="${y}" r="4.5" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width=".8"/>`; }
    const slots = ['x10', 'x3', 'x1', '½', '½', 'x1', 'x3', 'x10'];
    return shell(id, S('Peg Drop', 'Drop it · edges pay big', ['#5a2a7a', '#2e1440', '#0c0616'], 30), `
      <g ${K.sh(id)}><path d="M100 40 L500 40 L560 300 L40 300 Z" fill="#1a0e2a" stroke="url(#${id}-gold)" stroke-width="4"/></g>
      ${pegs}
      <path d="M300 30 C306 60 286 84 318 112 C330 130 306 150 326 176 C340 196 352 214 370 240" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="3 5" fill="none"/>
      <circle cx="370" cy="244" r="11" fill="#fff" ${K.sh(id)}/><circle cx="366" cy="240" r="4" fill="#fff" opacity=".9"/>
      ${slots.map((t, i) => `<rect x="${64 + i * 59}" y="270" width="54" height="34" rx="4" fill="${i === 0 || i === 7 ? '#e6b82a' : i === 1 || i === 6 ? '#b8232a' : '#3a2a5a'}"/><text x="${91 + i * 59}" y="293" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="15" fill="#fff">${t}</text>`).join('')}
    `);
  });

  cover('inbetween', id => shell(id, S('In Between', 'Will it land between?', ['#2a4a8a', '#142448', '#060a18']), `
    ${K.felt(id, '#1a3a6a', 270)}
    ${glow(id, 300, 160, 150, '#a0c0ff', .2)}
    ${card(id, 160, 170, { rank: '3', suit: '♣', rot: -12, w: 116 })}${card(id, 440, 170, { rank: 'J', suit: '♦', red: true, rot: 12, w: 116, face: K.jackFace('#a3262a', 116) })}
    ${card(id, 300, 150, { rank: '8', suit: '♥', red: true, rot: 0, w: 126 })}
    <g fill="url(#${id}-gold)"><path d="M214 280 l-14 -10 v20 Z"/><path d="M386 280 l14 -10 v20 Z"/></g><path d="M216 280 H384" stroke="url(#${id}-gold)" stroke-width="3" stroke-dasharray="6 6"/>
  `));

  cover('casinowar', id => shell(id, S('Casino War', 'High card takes it', ['#7a1a24', '#400c12', '#160406']), `
    ${glow(id, 300, 160, 160, '#ff8a70', .2)}
    <g transform="translate(300 160)" opacity=".85">${[-1, 1].map(sx => `<g transform="scale(${sx} 1) rotate(-40)" ${K.sh(id)}><rect x="-5" y="-130" width="10" height="160" fill="#d9dde3" stroke="#6a7480"/><path d="M-5 -130 L0 -146 L5 -130 Z" fill="#d9dde3"/><rect x="-34" y="30" width="68" height="10" rx="4" fill="url(#${id}-gold)"/><rect x="-6" y="40" width="12" height="40" rx="4" fill="#5a3416"/><circle cy="86" r="8" fill="url(#${id}-gold)"/></g>`).join('')}</g>
    ${card(id, 205, 190, { rank: 'K', suit: '♠', rot: -10, w: 124, face: K.kingFace(124) })}${card(id, 395, 190, { rank: 'Q', suit: '♥', red: true, rot: 10, w: 124, face: K.queenFace('#a3262a', 124) })}
  `));

  cover('liftoff', id => shell(id, S('Liftoff', 'Cash out before the crash', ['#1a2a6a', '#0c1438', '#040614'], 26), `
    ${K.stars(70, 11, 300, .8)}
    <g stroke="#9ab0ff" stroke-opacity=".15">${[0, 1, 2, 3, 4].map(i => `<path d="M40 ${300 - i * 60} H580"/>`).join('')}</g>
    <path d="M40 300 C200 296 300 270 380 200 C420 160 440 120 460 80" stroke="#ffb03a" stroke-width="5" fill="none" filter="url(#${id}-glow)"/>
    ${K.rocket(id, 466, 74, .62, 32)}
    <text x="150" y="150" font-family="${SERIF}" font-size="74" fill="#ffe08a" filter="url(#${id}-glow)">2.40×</text>
    <g ${K.sh(id)}><rect x="150" y="190" width="150" height="40" rx="20" fill="#2a9a4a"/><text x="225" y="216" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="15" letter-spacing="3" fill="#fff">CASH OUT</text></g>
  `));

  cover('ridethebus', id => shell(id, S('Ride the Bus', 'Red or black · higher or lower', ['#7a5a1a', '#3e2e0c', '#141004'], 30), `
    <path d="M0 290 H600" stroke="#3a2a14" stroke-width="40"/><path d="M0 290 H600" stroke="#e9d29a" stroke-width="3" stroke-dasharray="26 18"/>
    <g transform="translate(300 200)" ${K.sh(id)}><rect x="-190" y="-90" width="380" height="140" rx="24" fill="#e6b82a"/><rect x="-190" y="10" width="380" height="20" fill="#b8232a"/><rect x="-190" y="-90" width="380" height="20" rx="12" fill="#f3d36a"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${-168 + i * 62}" y="-62" width="52" height="54" rx="6" fill="#3a5a7a"/><rect x="${-168 + i * 62}" y="-62" width="14" height="54" fill="#fff" opacity=".18"/>`).join('')}<rect x="150" y="-62" width="30" height="96" rx="4" fill="#3a5a7a"/>${[-120, 120].map(cx => `<circle cx="${cx}" cy="54" r="28" fill="#1d1b1a"/><circle cx="${cx}" cy="54" r="12" fill="#9a9aa0"/>`).join('')}<circle cx="182" cy="18" r="8" fill="#fff3c0"/></g>
    ${card(id, 120, 110, { rank: '5', suit: '♦', red: true, rot: -14, w: 74 })}${card(id, 190, 92, { rank: 'Q', suit: '♠', rot: 6, w: 74 })}
    <g font-family="${UI}" font-weight="900" font-size="15" letter-spacing="3"><text x="420" y="80" fill="#e05a4a">RED?</text><text x="420" y="104" fill="#f3ead6">BLACK?</text></g>
  `));

  cover('threecard', id => shell(id, S('Three Card Showdown', 'Play or fold', ['#1e6a4a', '#0e3626', '#04120c']), `
    ${K.felt(id, '#185a3a', 240)}
    ${card(id, 220, 170, { rank: 'Q', suit: '♠', rot: -16, w: 120, face: K.queenFace('#1d1b1a', 120) })}${card(id, 300, 152, { rank: 'K', suit: '♠', rot: 0, w: 124, face: K.kingFace(124) })}${card(id, 380, 170, { rank: 'A', suit: '♠', rot: 16, w: 120 })}
    <g transform="translate(500 286)" ${K.sh(id)}><circle r="30" fill="#fbf6ea"/><circle r="24" fill="none" stroke="#1d1b1a" stroke-width="2"/><text y="6" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="12" letter-spacing="1.5" fill="#1d1b1a">DEALER</text></g>
    ${stack(id, 110, 300, 30, 6, '#b8232a')}
  `));

  cover('islandstud', id => shell(id, S('Island Stud', 'Five cards · big bonuses', ['#1a7a8a', '#0c3e48', '#041418'], 28), `
    <circle cx="460" cy="90" r="46" fill="#ffd36a" filter="url(#${id}-glow)"/>
    <path d="M0 230 Q300 200 600 230 V400 H0 Z" fill="#0e4a5a"/><path d="M0 250 Q150 240 300 252 Q450 264 600 248 V400 H0 Z" fill="#e8d4a0"/>
    <g ${K.sh(id)}><path d="M110 260 Q100 160 140 80" stroke="#6a4a22" stroke-width="12" fill="none"/>${[[-70, 10], [-30, -30], [20, -30], [60, 10], [0, -40]].map(([dx, dy]) => `<path d="M140 80 Q${140 + dx * .6} ${80 + dy - 20} ${140 + dx} ${80 + dy + 30}" stroke="#2a7a3a" stroke-width="16" fill="none" stroke-linecap="round"/>`).join('')}</g>
    ${[0, 1, 2, 3, 4].map(i => card(id, 230 + i * 62, 210 + Math.abs(i - 2) * 6, { rank: ['10', 'J', 'Q', 'K', 'A'][i], suit: '♥', red: true, rot: (i - 2) * 7, w: 84 })).join('')}
  `));

  cover('omaha', id => shell(id, S('Four-Hole Hold’em', 'Four in hand · use two', ['#6a1a3a', '#3a0c1e', '#14040a']), `
    ${K.felt(id, '#1a4a32', 250)}
    ${[0, 1, 2, 3].map(i => card(id, 195 + i * 70, 165 + Math.abs(i - 1.5) * 8, { rank: ['A', 'A', 'K', 'Q'][i], suit: ['♠', '♦', '♠', '♦'][i], red: i % 2 === 1, rot: (i - 1.5) * 10, w: 108 })).join('')}
    ${stack(id, 110, 310, 30, 7, '#1d1d22', '#d8b46a')}${stack(id, 490, 312, 30, 5, '#b8232a')}${chip(id, 420, 334, 24, '#2a4aa8')}
  `));
}
