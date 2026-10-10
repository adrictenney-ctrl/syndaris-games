// Painted covers: the fast-fingers action games.
export default function paint(K) {
  const { cover, shell, glow, SERIF, UI } = K;
  const S = (title, tag, bg, cy = 34) => ({ title, tag, bg, cy });
  const PADS = ['#2a9a4a', '#c8232a', '#e6b82a', '#2a6ad8'];

  cover('tugofwar', id => shell(id, S('Tug of War', 'Two teams, tap to pull', ['#7a4a1a', '#40260c', '#160c04'], 30), `
    <path d="M0 250 Q300 230 600 250 V400 H0 Z" fill="#3a5a22"/><path d="M300 236 V300" stroke="#f3ead6" stroke-width="5" stroke-dasharray="10 8"/>
    <g ${K.sh(id)}><path d="M40 170 Q170 186 300 176 Q430 166 560 182" stroke="#8a6a3a" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M40 170 Q170 186 300 176 Q430 166 560 182" stroke="#c8a060" stroke-width="16" fill="none" stroke-dasharray="6 6" stroke-linecap="round"/></g>
    <g transform="translate(280 177)" ${K.sh(id)}><path d="M0 0 l-18 -26 l36 0 Z M0 0 l-18 26 l36 0 Z" fill="#c8232a"/><circle r="9" fill="#a8141a"/></g>
    ${[0, 1].map(t => [0, 1, 2].map(k => { const x = t ? 400 + k * 60 : 200 - k * 60, c = t ? '#2a6ad8' : '#c8232a'; return `<g transform="translate(${x} 240) rotate(${t ? 18 : -18})" ${K.sh(id)}><circle cy="-80" r="16" fill="#e8c8a8"/><path d="M-20 0 L-16 -60 Q0 -70 16 -60 L20 0 Z" fill="${c}"/><path d="M-16 -50 L${t ? -40 : 40} -64" stroke="#e8c8a8" stroke-width="8" stroke-linecap="round"/><path d="M-12 0 L-24 20 M12 0 L18 20" stroke="#2a2018" stroke-width="9" stroke-linecap="round"/></g>`; }).join('')).join('')}
  `));

  cover('tapderby', id => shell(id, S('Tap Derby', 'Tap your horse home', ['#2a6a2a', '#143614', '#061206'], 30), `
    ${[0, 1, 2, 3].map(i => `<rect x="0" y="${110 + i * 46}" width="600" height="44" fill="${i % 2 ? '#2e6a26' : '#357a2c'}"/>`).join('')}
    <g transform="translate(520 100)">${[0, 1, 2, 3, 4, 5, 6, 7].map(r => [0, 1].map(c => (r + c) % 2 ? `<rect x="${c * 12}" y="${r * 23}" width="12" height="23" fill="#1d1b1a"/>` : `<rect x="${c * 12}" y="${r * 23}" width="12" height="23" fill="#fff"/>`).join('')).join('')}</g>
    ${[['#c8232a', 360, 136], ['#2a4aa8', 260, 182], ['#e6b82a', 430, 228], ['#8a3ab8', 200, 274]].map(([c, x, y], i) => K.horse(id, x, y, .5, c, ['#5a3418', '#2a1a10', '#7a4a22', '#3a2416'][i])).join('')}
    <g transform="translate(110 140)" ${K.sh(id)}><circle r="40" fill="${'#fff'}" opacity=".12"/><circle r="26" fill="#fff" opacity=".2"/><path d="M-6 -30 Q-6 -40 4 -40 Q14 -40 14 -30 V0 L24 -6 Q34 -10 36 2 L18 40 H-14 L-26 10 Q-30 0 -20 -4 L-6 4 Z" fill="#e8c8a8" stroke="#8a6a4a" stroke-width="2"/></g>
  `));

  cover('redlight', id => shell(id, S('Red Light, Green Light', 'Run on green, freeze on red', ['#6a1a1a', '#360c0c', '#120404'], 30), `
    <g transform="translate(300 150)" ${K.sh(id)}><rect x="-50" y="-120" width="100" height="240" rx="20" fill="#1d1b1a" stroke="url(#${id}-gold)" stroke-width="4"/>${[['#e8322a', -78, 1], ['#e6b82a', 0, .25], ['#2a9a4a', 78, .25]].map(([c, y, op]) => `<path d="M-40 ${y - 36} h80 v-6 h-80 Z" fill="#0a0a0a"/><circle cy="${y}" r="32" fill="${c}" opacity="${op}"/>${op === 1 ? `<circle cy="${y}" r="44" fill="${c}" opacity=".5" filter="url(#${id}-soft)"/><ellipse cx="-10" cy="${y - 12}" rx="10" ry="6" fill="#fff" opacity=".6"/>` : ''}`).join('')}<rect x="-8" y="120" width="16" height="140" fill="#2a2a2a"/></g>
    ${[[130, 260], [200, 250], [420, 262], [490, 250]].map(([x, y], i) => `<g transform="translate(${x} ${y})" ${K.sh(id)}><circle cy="-62" r="12" fill="#e8c8a8"/><path d="M-12 -14 L-10 -48 Q0 -54 10 -48 L12 -14 Z" fill="${['#2a6ad8', '#e6b82a', '#2a9a4a', '#8a3ab8'][i]}"/><path d="M-8 -14 L-14 ${i % 2 ? 10 : 6} M8 -14 L${i % 2 ? 18 : 12} 8 M-10 -42 L-22 -28 M10 -42 L24 -${i % 2 ? 50 : 30}" stroke="#2a2018" stroke-width="6" stroke-linecap="round"/></g>`).join('')}
  `));

  cover('musicalchairs', id => {
    const chair = (x, y, r, s = 1) => `<g ${K.at(x, y, s, r)} ${K.sh(id)}><rect x="-22" y="-70" width="44" height="50" rx="6" fill="#8a1a2a"/><rect x="-28" y="-22" width="56" height="14" rx="4" fill="#a8243a"/><path d="M-24 -8 V30 M24 -8 V30 M-24 -70 V-20 M24 -70 V-20" stroke="url(#${id}-gold)" stroke-width="5"/></g>`;
    return shell(id, S('Musical Chairs', 'When the music stops, sit!', ['#6a2a6a', '#381438', '#120612'], 30), `
      ${K.stage(id)}
      ${[0, 1, 2, 3, 4].map(i => { const a = i / 5 * Math.PI * 2 + .3; return chair(300 + Math.cos(a) * 160, 190 + Math.sin(a) * 60, Math.cos(a) * 20, .9 + Math.sin(a) * .1); }).join('')}
      <g fill="#ffd36a" ${K.sh(id)}><path d="M150 70 v40 a12 9 0 1 1 -6 -8 v-46 l30 -6 v40 a12 9 0 1 1 -6 -8 v-28 Z"/><path d="M450 60 v44 a12 9 0 1 1 -6 -8 v-36 Z"/><path d="M500 110 v30 a10 8 0 1 1 -5 -7 v-23 Z"/></g>
    `);
  });

  cover('quickdraw', id => shell(id, S('Quick Draw', 'Wait for it, then tap', ['#8a5a2a', '#482e14', '#180e06'], 24), `
    <circle cx="300" cy="190" r="110" fill="#ffc060" opacity=".6" filter="url(#${id}-glow)"/>
    <path d="M0 230 Q300 214 600 230 V400 H0 Z" fill="#6a3a1a"/>
    <g fill="#2a1408">${[[60, 230, 1], [540, 230, -1]].map(([x, y, sx]) => `<g transform="translate(${x} ${y}) scale(${sx} 1)"><path d="M0 0 V-80 M-14 -40 H0 M14 -60 H0" stroke="#2a1408" stroke-width="10" stroke-linecap="round"/></g>`).join('')}</g>
    ${K.stopwatch(id, 300, 150, 1.1, { hand: 0, hand2: 0 })}
    <g transform="translate(300 270)" ${K.sh(id)}><path d="M-80 0 Q-60 -20 0 -22 Q60 -20 80 0 Q40 8 0 8 Q-40 8 -80 0 Z" fill="#6a4a2a"/><path d="M-36 -18 Q-34 -54 0 -54 Q34 -54 36 -18 Z" fill="#7a5632"/><rect x="-36" y="-26" width="72" height="8" fill="#3a2410"/></g>
    <text x="300" y="52" text-anchor="middle" font-family="${SERIF}" font-size="26" fill="#2a1408" opacity=".75">HIGH NOON</text>
  `));

  cover('echo', id => shell(id, S('Echo', 'Watch, then repeat', ['#2a2a7a', '#141440', '#060616'], 30), `
    ${K.stars(40, 31, 300, .4)}
    <g transform="translate(300 156)" ${K.sh(id)}><circle r="130" fill="#141218" stroke="url(#${id}-gold)" stroke-width="6"/>${PADS.map((c, i) => { const P = (r, d) => `${(r * Math.cos(d * Math.PI / 180)).toFixed(1)} ${(r * Math.sin(d * Math.PI / 180)).toFixed(1)}`, a0 = i * 90 + 4, a1 = i * 90 + 86; return `<path d="M${P(46, a0)} L${P(118, a0)} A118 118 0 0 1 ${P(118, a1)} L${P(46, a1)} A46 46 0 0 0 ${P(46, a0)} Z" fill="${c}" opacity="${i === 1 ? 1 : .55}"/>`; }).join('')}<circle r="40" fill="#141218" stroke="url(#${id}-gold)" stroke-width="4"/><text y="9" text-anchor="middle" font-family="${SERIF}" font-size="24" fill="#e9d29a">echo</text></g>
    <circle cx="380" cy="80" r="60" fill="${PADS[1]}" opacity=".35" filter="url(#${id}-soft)"/>
  `));

  cover('simonsays', id => shell(id, S('Simon Says', 'Only when Simon says', ['#1a6a5a', '#0e3830', '#041410'], 30), `
    ${K.stage(id)}
    <g transform="translate(240 160) rotate(-18)" ${K.sh(id)}><path d="M-30 -24 L60 -70 L60 70 L-30 24 Z" fill="#e6b82a"/><path d="M60 -70 Q80 0 60 70" fill="none" stroke="url(#${id}-gold)" stroke-width="8"/><rect x="-60" y="-24" width="34" height="48" rx="6" fill="#c8232a"/><rect x="-80" y="-10" width="24" height="20" rx="4" fill="#1d1b1a"/></g>
    <g fill="none" stroke="#ffd36a" stroke-width="5" stroke-linecap="round" opacity=".85"><path d="M340 110 Q360 150 340 190"/><path d="M366 92 Q396 150 366 208"/><path d="M392 74 Q432 150 392 226"/></g>
    <text x="490" y="170" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="34" fill="#f3ead6" transform="rotate(-6 490 170)">“jump!”</text>
  `));

  cover('memorygrid', id => {
    const lit = [1, 4, 8, 12, 13, 19, 22];
    return shell(id, S('Memory Grid', 'Remember which ones lit up', ['#3a4a7a', '#1e2640', '#0a0c16'], 30), `
      <g transform="translate(300 150) rotate(-4)" ${K.sh(id)}><rect x="-146" y="-120" width="292" height="240" rx="14" fill="#141218" stroke="url(#${id}-gold)" stroke-width="4"/>${Array.from({ length: 25 }, (_, i) => { const x = -130 + (i % 5) * 53, y = -104 + Math.floor(i / 5) * 42; return `<rect x="${x}" y="${y}" width="48" height="36" rx="6" fill="${lit.includes(i) ? '#ffd36a' : '#2a2a3a'}"/>${lit.includes(i) ? `<rect x="${x}" y="${y}" width="48" height="36" rx="6" fill="#ffd36a" filter="url(#${id}-glow)" opacity=".7"/>` : ''}`; }).join('')}</g>
    `);
  });

  cover('whackamole', id => {
    const hole = (x, y, mole) => `<g transform="translate(${x} ${y})"><ellipse rx="56" ry="18" fill="#1a0e04"/>${mole ? `<g ${K.sh(id)}><path d="M-34 6 V-40 Q-34 -76 0 -76 Q34 -76 34 -40 V6 Z" fill="#7a5a3a"/><ellipse cy="-30" rx="18" ry="12" fill="#c89a7a"/><circle cy="-38" r="6" fill="#3a1a14"/><circle cx="-12" cy="-54" r="4" fill="#1d1b1a"/><circle cx="12" cy="-54" r="4" fill="#1d1b1a"/><rect x="-6" y="-24" width="5" height="8" fill="#fff"/><rect x="1" y="-24" width="5" height="8" fill="#fff"/></g>` : ''}<path d="M-56 0 A56 18 0 0 0 56 0" fill="#3a2410"/></g>`;
    return shell(id, S('Whack-a-Mole', 'Whack them as they pop up', ['#5a4a1a', '#2e260c', '#100c04'], 30), `
      <path d="M0 160 Q300 130 600 160 V400 H0 Z" fill="#4a7a2a"/>
      ${hole(150, 200, false)}${hole(300, 180, true)}${hole(450, 200, false)}${hole(220, 270, false)}${hole(380, 270, true)}
      <g transform="translate(420 110) rotate(-36)" ${K.sh(id)}><rect x="-6" y="0" width="12" height="110" rx="5" fill="#7a4a22"/><rect x="-40" y="-36" width="80" height="40" rx="12" fill="#c8232a"/><rect x="-40" y="-36" width="80" height="12" rx="6" fill="#fff" opacity=".2"/></g>
      ${K.sparkles([[300, 92, 1.4], [330, 80, .8]], '#ffd36a')}
    `);
  });

  cover('counttogether', id => shell(id, S('Count Together', 'One at a time, no talking', ['#2a5a7a', '#142e40', '#060e16'], 30), `
    ${glow(id, 300, 150, 160, '#a0e0ff', .2)}
    ${[1, 2, 3, 4, 5, 6, 7].map((n, i) => { const a = -Math.PI + i * Math.PI / 6; return `<g transform="translate(${300 + Math.cos(a) * 190} ${210 + Math.sin(a) * 140})" ${K.sh(id)}><circle r="${n === 7 ? 40 : 30}" fill="${n === 7 ? 'url(#' + id + '-gold)' : '#fffaf0'}" stroke="url(#${id}-gold)" stroke-width="3"/><text y="${n === 7 ? 14 : 11}" text-anchor="middle" font-family="${SERIF}" font-size="${n === 7 ? 40 : 30}" fill="#1a2a4a">${n}</text></g>`; }).join('')}
    ${K.laurel(id, 250, 230, .7)}${K.laurel(id, 350, 230, .7, true)}
  `));
}
