// Still-life covers: the rest of the casino floor, and the dice games.
export default function paint(K) {
  const { cover, shell, T } = K;
  const C = (id, title, tag, bg, body, z = 1.25) => shell(id, { title, tag, bg }, `${T.defs(id)}${T.zoom(body, z)}`);
  const card = (id, x, y, r, rank, s, w = 100, o = {}) => T.lay(id, x, y, r, T.pcard(id, rank, s, w), o);
  const back = (id, x, y, r, w = 100, c = '#6a1a24', o = {}) => T.lay(id, x, y, r, T.pback(id, w, c), o);
  const chip = (id, x, y, r, c, label, o = {}) => T.lay(id, x, y, o.rot || 0, T.chipTop(id, r, c, { label, ...o }));
  // A leather dice cup standing on the table (mouth up), or upturned (o.down).
  const cup = (id, x, y, s = 1, o = {}) => {
    const c = o.c || '#5a2a14';
    const body = o.down
      ? `<path d="M-46 0 L-38 -96 Q0 -104 38 -96 L46 0 Q0 12 -46 0 Z" fill="url(#${id}-cup)"/><ellipse cy="-96" rx="38" ry="9" fill="${K.shade(c, -.2)}"/><path d="M-44 -18 Q0 -8 44 -18" stroke="url(#${id}-brass)" stroke-width="3" fill="none"/><path d="M-42 -30 Q0 -20 42 -30" stroke="#d8c8a0" stroke-width="1" stroke-dasharray="3 3" fill="none" opacity=".6"/>`
      : `<path d="M-38 0 L-46 -96 Q0 -86 46 -96 L38 0 Q0 10 -38 0 Z" fill="url(#${id}-cup)"/><ellipse cy="-96" rx="46" ry="12" fill="#1a0c06"/><ellipse cy="-96" rx="46" ry="12" fill="none" stroke="url(#${id}-brass)" stroke-width="3"/><path d="M-44 -78 Q0 -68 44 -78" stroke="#d8c8a0" stroke-width="1" stroke-dasharray="3 3" fill="none" opacity=".6"/>`;
    return T.stand(id, x, y, 60 * s, `<defs><linearGradient id="${id}-cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${K.shade(c, .25)}"/><stop offset=".4" stop-color="${c}"/><stop offset="1" stop-color="${K.shade(c, -.55)}"/></linearGradient></defs><g transform="translate(${x} ${y}) scale(${s})">${body}</g>`, { blur: o.blur });
  };
  const pad = (id, rows, o = {}) => T.notepad(id, o.w || 150, o.h || 190, rows.map((r, i) => T.hand(r, o.x ?? -44, -62 + i * 16 + 8, 15, '#2a2a5a', { anchor: 'start' })).join(''));

  cover('baccarat', id => {
    const shoe = `<path d="M-70 0 L-50 -70 H70 L70 0 Z" fill="#1a1a1e"/><path d="M-50 -70 H70 L60 -84 H-40 Z" fill="#2a2a30"/><path d="M-66 -8 L-48 -64" stroke="#fff" stroke-opacity=".15" stroke-width="4"/><rect x="-46" y="-30" width="50" height="18" rx="2" fill="#f6f0e2" transform="rotate(-14 -20 -20)"/>`;
    return C(id, 'Baccarat', 'Player, banker or tie', ['#6a2430', '#43141d', '#16060a'], `
      ${T.surface(id, 'felt', { hz: 30, color: '#4a1a24', lx: 300 })}
      <g opacity=".55" fill="none" stroke="#e9d29a" stroke-width="1.6"><ellipse cx="300" cy="150" rx="250" ry="40"/><ellipse cx="300" cy="215" rx="280" ry="48"/></g>
      ${T.word('BANKER', 300, 140, 16, { font: K.UI, weight: 800, ls: 6, fill: '#e9d29a' })}${T.word('PLAYER', 300, 205, 16, { font: K.UI, weight: 800, ls: 6, fill: '#e9d29a' })}
      ${card(id, 250, 280, -8, '9', '♦', 100)}${card(id, 340, 284, 8, '8', '♣', 100)}
      ${T.chips(id, 110, 250, 28, 6, '#c9a24a', { edge: '#fff6dc' })}${T.chips(id, 500, 250, 28, 4, '#1d1d24', { edge: '#d8b46a' })}
      ${T.stand(id, 470, 120, 110, `<g transform="translate(470 120)">${shoe}</g>`, { blur: 2 })}
    `);
  });

  cover('tripledice', id => C(id, 'Triple Dice', 'Big, small and triples', ['#8a2a2a', '#481414', '#180606'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#4a1414', lx: 300 })}
    ${T.stand(id, 300, 250, 220, `<ellipse cx="300" cy="250" rx="150" ry="36" fill="#2a1206"/><ellipse cx="300" cy="244" rx="142" ry="32" fill="url(#${id}-brass)"/><ellipse cx="300" cy="240" rx="124" ry="26" fill="#1a4a2a"/>`)}
    ${T.die(id, 250, 210, .8, [4, 2, 6], { rot: -10 })}${T.die(id, 350, 214, .8, [4, 5, 3], { rot: 8 })}${T.die(id, 300, 182, .74, [4, 1, 2])}
    <path d="M170 240 Q170 70 300 62 Q430 70 430 240" fill="#dfeaf2" opacity=".1" stroke="#fff" stroke-opacity=".35" stroke-width="2"/><path d="M196 140 Q216 96 262 82" stroke="#fff" stroke-opacity=".55" stroke-width="7" fill="none" stroke-linecap="round"/>
    ${T.chips(id, 520, 300, 28, 6, '#c9a24a', { edge: '#fff6dc', blur: 2 })}
  `));

  cover('luckynumbers', id => {
    const ball = (n, c) => `<circle r="22" fill="${c}"/><circle r="12" fill="#fbf8f0"/>${T.word(String(n), 0, 5, 13, { font: K.UI, weight: 800 })}<ellipse cx="-8" cy="-10" rx="7" ry="4" fill="#fff" opacity=".5"/>`;
    const ticket = T.sheet(id, 210, 270, `<rect x="-105" y="-135" width="210" height="36" fill="#8a1a1a"/>${T.word('LUCKY NUMBERS', 0, -110, 15, { font: K.UI, weight: 900, ls: 3, fill: '#fbf3dc' })}${Array.from({ length: 40 }, (_, i) => { const x = -84 + (i % 8) * 24, y = -76 + Math.floor(i / 8) * 34, on = [3, 9, 14, 21, 27, 33].includes(i); return `<text x="${x}" y="${y}" text-anchor="middle" font-family="${K.UI}" font-weight="700" font-size="12" fill="#5a4a3a">${i + 1}</text>${on ? `<path d="M${x - 9} ${y - 12} L${x + 9} ${y + 4} M${x + 9} ${y - 12} L${x - 9} ${y + 4}" stroke="#2a2a8a" stroke-width="2.4" stroke-linecap="round"/>` : ''}`; }).join('')}`, { fill: '#f6efd8' });
    return C(id, 'Lucky Numbers', 'Pick yours, ten are drawn', ['#3a2a7a', '#1c1440', '#080616'], `
      ${T.surface(id, 'leather', { hz: 30, color: '#2a1e40', lx: 300 })}
      ${T.lay(id, 240, 190, -8, ticket, { tilt: .7 })}
      ${[[400, 150, 7, '#a8242a'], [450, 180, 22, '#2a5ab8'], [410, 220, 31, '#c89a2a'], [470, 240, 40, '#2a8a4a'], [520, 160, 14, '#7a3ab8']].map(([x, y, n, c]) => T.lay(id, x, y, 0, ball(n, c), { tilt: 1 })).join('')}
      ${T.lay(id, 370, 300, -40, T.pencilFlat(150, '#2a2a8a'), { thin: true })}
    `);
  });

  cover('moneywheel', id => C(id, 'Money Wheel', 'Where will it stop?', ['#8a6a1a', '#4a380c', '#181204'], `
    ${T.surface(id, 'felt', { hz: 210, color: '#2a3a24', lx: 300, ly: 300, wall: '#2a1a0c' })}
    ${T.stand(id, 300, 300, 240, `${T.strip(K.wheel(id, 300, 160, 1.15, null, { n: 24, colorOf: i => ['#a8242a', '#2a4a8a', '#2a7a4a', '#c89a2a', '#6a3a9a', '#1d1b1a'][(i * 5) % 6], labels: ['$1', '$2', '$5', '$1', '$10', '$1', '$2', '$20', '$1', '$5', '$2', '$40'], fs: 11 }))}<path d="M300 34 L288 8 H312 Z" fill="url(#${id}-brass)" stroke="#5a3a10"/><path d="M270 296 L290 290 V300 Z M330 296 L310 290 V300 Z" fill="#3a2410"/><rect x="292" y="294" width="16" height="8" fill="#3a2410"/>`)}
    ${T.chips(id, 110, 340, 28, 6, '#a8242a')}${T.chips(id, 500, 340, 28, 4, '#c9a24a', { edge: '#fff6dc' })}
  `, 1.08));

  cover('oddoreven', id => C(id, 'Odd or Even', 'Two dice, one cup', ['#7a4a2a', '#3e2414', '#140a04'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#4a2a14', lx: 300 })}
    ${cup(id, 230, 260, 1.25, { down: true })}
    ${T.die(id, 370, 230, .75, [3, 1, 5], { rot: 8 })}${T.die(id, 450, 250, .7, [4, 2, 6], { rot: -12 })}
    ${T.lay(id, 140, 140, -6, T.sheet(id, 120, 60, `${T.word('丁 · 半', 0, 8, 22, { weight: 700, fill: '#8a1a1a' })}`, { fill: '#f3e7c8' }), { blur: 2 })}
  `));

  cover('dicepit', id => C(id, 'Dice Pit', 'Pass line, field and long shots', ['#1e6a4a', '#0e3624', '#04120c'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#18603e', lx: 300 })}
    <g opacity=".6" fill="none" stroke="#f4eee0" stroke-width="2"><path d="M-10 250 Q300 200 610 250"/><path d="M-10 290 Q300 236 610 290"/><path d="M360 120 L540 132 L530 196 L350 180 Z"/></g>
    ${T.word('PASS LINE', 300, 262, 20, { font: K.UI, weight: 900, ls: 8, fill: '#f4eee0' })}${T.word('FIELD', 446, 165, 16, { font: K.UI, weight: 900, ls: 6, fill: '#f4eee0' })}
    ${T.die(id, 230, 180, .75, [6, 1, 2], { rot: -16 })}${T.die(id, 310, 196, .75, [1, 4, 5], { rot: 12 })}
    ${chip(id, 160, 310, 26, '#a8242a', '5')}${T.chips(id, 480, 300, 26, 5, '#1d1d24', { edge: '#d8b46a' })}
    ${T.lay(id, 120, 150, 30, `<rect x="-4" y="-120" width="8" height="200" rx="3" fill="#c9a24a"/><path d="M-4 -120 q-30 -10 -34 10 q14 -4 34 4 Z" fill="#c9a24a"/>`, { thin: true, blur: 2 })}
  `));

  cover('pegdrop', id => {
    let pegs = '';
    for (let r = 0; r < 9; r++) for (let c = 0; c <= r + 2; c++) pegs += `<circle cx="${(c - (r + 2) / 2) * 30}" cy="${-130 + r * 26}" r="4" fill="url(#${id}-silver)"/>`;
    const slots = ['x10', 'x3', 'x1', '½', '½', 'x1', 'x3', 'x10'];
    const board = `<path d="M-60 -150 H60 L180 120 H-180 Z" fill="#1a1028"/><path d="M-60 -150 H60 L180 120 H-180 Z" fill="none" stroke="url(#${id}-brass)" stroke-width="5"/>${pegs}${slots.map((t, i) => `<rect x="${-176 + i * 44}" y="104" width="40" height="34" rx="3" fill="${i === 0 || i === 7 ? '#c89a2a' : i === 1 || i === 6 ? '#8a1a2a' : '#3a2a5a'}"/>${T.word(t, -156 + i * 44, 127, 13, { font: K.UI, weight: 900, fill: '#fff' })}`).join('')}<circle cx="34" cy="-14" r="10" fill="#fbfbf6"/><circle cx="31" cy="-17" r="3" fill="#fff"/>`;
    return C(id, 'Peg Drop', 'Drop it, edges pay big', ['#5a2a7a', '#2e1440', '#0c0616'], `
      ${T.surface(id, 'leather', { hz: 30, color: '#2a1a3a', lx: 300 })}
      ${T.lay(id, 300, 180, 0, board, { tilt: .72 })}
      ${T.chips(id, 520, 310, 26, 4, '#c9a24a', { edge: '#fff6dc' })}
    `);
  });

  cover('inbetween', id => C(id, 'In Between', 'Will it land between?', ['#2a4a8a', '#142448', '#060a18'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1a3a5a', lx: 300 })}
    ${card(id, 160, 170, -10, '3', '♣', 110)}${card(id, 440, 170, 10, 'J', '♦', 110)}${card(id, 300, 200, 0, '8', '♥', 116)}
    ${T.chips(id, 300, 340, 26, 5, '#a8242a', { blur: 2 })}
  `));

  cover('casinowar', id => C(id, 'Casino War', 'High card takes it', ['#7a1a24', '#400c12', '#160406'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#3a1018', lx: 300 })}
    ${card(id, 220, 190, -10, 'K', '♠', 124)}${card(id, 380, 190, 10, 'Q', '♥', 124)}
    ${T.chips(id, 120, 300, 26, 7, '#1d1d24', { edge: '#d8b46a' })}${T.chips(id, 480, 300, 26, 5, '#a8242a')}
  `));

  cover('liftoff', id => {
    const screen = `<rect x="-36" y="-72" width="72" height="144" fill="#0b1226"/>${[0, 1, 2, 3].map(i => `<path d="M-30 ${-40 + i * 24} H30" stroke="#2a3a5a" stroke-width=".8"/>`).join('')}<path d="M-30 40 C-10 38 4 30 14 8 C20 -8 24 -20 28 -36" stroke="#ffb03a" stroke-width="2.6" fill="none"/><circle cx="28" cy="-36" r="3" fill="#ffd36a"/>${T.word('2.40×', 0, -48, 18, { weight: 700, fill: '#ffd36a' })}<rect x="-26" y="50" width="52" height="14" rx="7" fill="#2a9a4a"/>${T.word('CASH OUT', 0, 60, 7, { font: K.UI, weight: 900, ls: 1, fill: '#fff' })}`;
    return C(id, 'Liftoff', 'Cash out before the crash', ['#1a2a6a', '#0c1438', '#040614'], `
      ${T.surface(id, 'slate', { hz: 30, color: '#1a1e2a', lx: 300 })}
      ${T.lay(id, 280, 190, -10, T.phone(id, screen), { tilt: .74, s: 1.3 })}
      ${T.chips(id, 470, 280, 26, 8, '#c9a24a', { edge: '#fff6dc' })}${T.chips(id, 520, 300, 26, 4, '#1d1d24', { edge: '#d8b46a' })}
      ${T.lay(id, 120, 300, 20, T.coinTop(id, 22, { mark: '$' }), { thin: true })}${T.lay(id, 150, 320, -10, T.coinTop(id, 22, { mark: '$' }), { thin: true })}
    `);
  });

  cover('ridethebus', id => {
    const ticket = `<rect x="-90" y="-40" width="180" height="80" rx="4" fill="#e8c86a"/>${[-40, 40].map(y => Array.from({ length: 18 }, (_, i) => `<circle cx="${-85 + i * 10}" cy="${y}" r="2.5" fill="#2a1a0a" opacity=".5"/>`).join('')).join('')}<rect x="-80" y="-30" width="160" height="60" fill="none" stroke="#8a5a1a" stroke-width="1.5"/>${T.word('ADMIT ONE', 0, -6, 18, { weight: 700, fill: '#5a3a10', ls: 3 })}${T.word('· BUS NO. 31 ·', 0, 18, 12, { font: K.UI, weight: 800, ls: 2, fill: '#8a5a1a' })}`;
    return C(id, 'Ride the Bus', 'Red or black, higher or lower', ['#7a5a1a', '#3e2e0c', '#141004'], `
      ${T.surface(id, 'wood', { hz: 30, color: '#4a2c14', lx: 300 })}
      ${['5♦', 'Q♠', '9♥', '3♣'].map((c, i) => i < 2 ? card(id, 160 + i * 110, 160 + i * 6, -8 + i * 8, c.slice(0, -1), c.slice(-1), 100) : back(id, 160 + i * 110, 160 + i * 6, -8 + i * 6, 100, '#5a3a10')).join('')}
      ${T.lay(id, 330, 310, -6, ticket)}
    `);
  });

  cover('threecard', id => C(id, 'Three Card Showdown', 'Play or fold', ['#1e6a4a', '#0e3626', '#04120c'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#185a3a', lx: 300 })}
    ${T.fan(id, 280, 230, [['Q', '♠'], ['K', '♠'], ['A', '♠']], { w: 118, step: 16 })}
    ${T.lay(id, 480, 290, 0, `<circle r="30" fill="#fbf8f0" stroke="#1d1d24" stroke-width="2"/><circle r="24" fill="none" stroke="#1d1d24"/>${T.word('DEALER', 0, 4, 11, { font: K.UI, weight: 900, ls: 1.5 })}`)}
    ${T.chips(id, 110, 260, 26, 6, '#a8242a')}
  `));

  cover('islandstud', id => {
    const shell2 = `<path d="M0 40 C-50 40 -56 -10 -36 -36 L0 -48 L36 -36 C56 -10 50 40 0 40 Z" fill="#f2d8c4"/>${[-30, -15, 0, 15, 30].map(x => `<path d="M0 40 L${x} -42" stroke="#d8b49a" stroke-width="2.4"/>`).join('')}<path d="M-18 40 h36 v10 h-36 Z" fill="#e8c8b0"/>`;
    return C(id, 'Island Stud', 'Five cards, big bonuses', ['#1a7a8a', '#0c3e48', '#041418'], `
      ${T.surface(id, 'felt', { hz: 30, color: '#145a62', lx: 300 })}
      ${['10', 'J', 'Q', 'K', 'A'].map((r, i) => card(id, 170 + i * 66, 190 + Math.abs(i - 2) * 6, (i - 2) * 5, r, '♥', 92)).join('')}
      ${T.lay(id, 500, 310, 20, shell2, { tilt: .8 })}${T.chips(id, 110, 300, 26, 6, '#c9a24a', { edge: '#fff6dc' })}
    `);
  });

  cover('omaha', id => C(id, 'Four-Hole Hold’em', 'Four in hand, use two', ['#6a1a3a', '#3a0c1e', '#14040a'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1b4a32', lx: 300 })}
    ${['K♥', '9♣', '9♦', '2♠', 'J♥'].map((c, i) => card(id, 150 + i * 75, 120, 0, c.slice(0, -1), c.slice(-1), 64, { blur: 0 })).join('')}
    ${T.fan(id, 300, 300, [['A', '♠'], ['A', '♦'], ['K', '♠'], ['Q', '♦']], { w: 104, step: 12 })}
    ${T.chips(id, 500, 290, 26, 8, '#1d1d24', { edge: '#d8b46a' })}
  `));

  cover('drawpoker', id => C(id, 'Five-Card Draw', 'Ante, swap three, show down', ['#6a1e24', '#3a0e14', '#140406'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1d4a34', lx: 300 })}
    ${T.fan(id, 300, 260, [['K', '♠'], ['K', '♥'], ['K', '♦'], ['7', '♣'], ['7', '♠']], { w: 108, step: 12 })}
    ${back(id, 120, 140, -20, 76, '#6a1a24')}${back(id, 150, 150, -6, 76, '#6a1a24')}${back(id, 180, 156, 8, 76, '#6a1a24')}
    ${T.chips(id, 480, 140, 26, 9, '#a8242a', { blur: 2 })}${T.chips(id, 530, 160, 26, 5, '#2a4a9a', { blur: 2 })}
  `));

  // ---- dice games
  cover('yacht', id => C(id, 'Yacht Club', 'Five dice, three rolls, thirteen boxes', ['#2f5a7a', '#1b3a52', '#08141e'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#3a2a1e', lx: 300 })}
    ${T.lay(id, 140, 190, -8, pad(id, ['Ones    3', 'Sixes   24', 'Full H. 25', 'Yacht   50'], { w: 150, h: 200, x: -56 }))}
    ${T.die(id, 300, 170, .7, [6, 2, 3])}${T.die(id, 370, 190, .7, [6, 4, 5], { rot: 12 })}${T.die(id, 330, 240, .7, [6, 3, 1], { rot: -8 })}${T.die(id, 410, 250, .7, [6, 5, 2], { rot: 20 })}${T.die(id, 270, 250, .7, [6, 1, 4], { rot: -20 })}
    ${cup(id, 500, 160, 1, { blur: 2 })}
  `));

  cover('hotdice', id => C(id, 'Hot Dice', 'Keep the scorers, bank before you bust', ['#7a2228', '#401014', '#160406'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#4a1418', lx: 300 })}
    ${[[200, 160, [1, 2, 3], -14], [280, 150, [5, 4, 6], 10], [360, 170, [1, 3, 2], -6], [240, 230, [5, 6, 1], 18], [330, 240, [2, 6, 4], -20], [420, 230, [5, 2, 3], 6]].map(([x, y, f, r]) => T.die(id, x, y, .7, f, { rot: r })).join('')}
    ${T.lay(id, 510, 300, 12, pad(id, ['500', '1,250', '2,000'], { w: 120, h: 130, x: -30 }))}
  `));

  cover('hogtoss', id => {
    const pig = (flip, lying) => `<g transform="scale(${flip ? -1 : 1} 1)"><ellipse rx="44" ry="${lying ? 24 : 28}" fill="#f2b8b0"/><ellipse cx="-6" cy="-8" rx="24" ry="10" fill="#fff" opacity=".35"/><circle cx="40" cy="-6" r="20" fill="#f2b8b0"/><ellipse cx="56" cy="-2" rx="9" ry="8" fill="#e89a92"/><circle cx="54" cy="-3" r="1.6" fill="#7a3a3a"/><circle cx="59" cy="-1" r="1.6" fill="#7a3a3a"/><circle cx="42" cy="-14" r="2.4" fill="#2a1a1a"/><path d="M30 -24 l-6 -14 l14 8 Z" fill="#e89a92"/>${lying ? '' : '<path d="M-26 22 v14 M-10 24 v14 M14 24 v14 M28 22 v14" stroke="#e89a92" stroke-width="8" stroke-linecap="round"/>'}<path d="M-44 -4 q-12 -6 -8 -16" stroke="#e89a92" stroke-width="3" fill="none"/><circle cx="-16" cy="${lying ? 6 : 8}" r="6" fill="#4a2a2a" opacity=".7"/></g>`;
    return C(id, 'Hog Toss', 'Toss two pigs, push your luck', ['#6a7a3a', '#363e1e', '#121408'], `
      ${T.surface(id, 'felt', { hz: 30, color: '#3a5a2a', lx: 300 })}
      ${T.stand(id, 250, 210, 90, `<g transform="translate(250 180)">${pig(false, false)}</g>`)}${T.stand(id, 380, 230, 90, `<g transform="translate(380 214) rotate(-10)">${pig(true, true)}</g>`)}
      ${T.lay(id, 140, 300, -10, pad(id, ['Razorback 5', 'Snouter 10', 'Total 64'], { w: 140, h: 120, x: -54 }))}
    `);
  });

  cover('passpot', id => {
    const lcr = (ch, c) => `<rect x="-24" y="-24" width="48" height="48" rx="8" fill="#f6f0e2" stroke="rgba(0,0,0,.25)"/>${T.word(ch, 0, 10, 28, { font: K.UI, weight: 900, fill: c })}`;
    return C(id, 'Pass the Pot', 'Roll, pass your chips, keep the last', ['#7a2a24', '#4a1d1c', '#180806'], `
      ${T.surface(id, 'wood', { hz: 30, color: '#4a2a14', lx: 300 })}
      ${T.stand(id, 300, 190, 150, `<ellipse cx="300" cy="186" rx="110" ry="34" fill="#2a1408"/><ellipse cx="300" cy="180" rx="104" ry="30" fill="url(#${id}-brass)"/><ellipse cx="300" cy="182" rx="88" ry="22" fill="#5a3a14"/>`)}
      ${[[270, 176], [300, 170], [330, 178], [290, 186], [320, 188]].map(([x, y], i) => T.lay(id, x, y, i * 30, T.chipTop(id, 18, ['#a8242a', '#2a4a9a', '#c9a24a'][i % 3]), { thin: true })).join('')}
      ${T.lay(id, 190, 280, -14, lcr('L', '#2a4a9a'))}${T.lay(id, 300, 300, 6, lcr('C', '#a8242a'))}${T.lay(id, 410, 282, 18, lcr('R', '#2a7a4a'))}
    `);
  });

  cover('cashout', id => C(id, 'Cash Out', 'Roll for the pot, out before the seven', ['#3a3d45', '#24272d', '#0c0d10'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#2a3a2e', lx: 300 })}
    ${T.stand(id, 300, 180, 150, `<ellipse cx="300" cy="176" rx="100" ry="30" fill="#1a1006"/><ellipse cx="300" cy="170" rx="96" ry="28" fill="url(#${id}-brass)"/><ellipse cx="300" cy="172" rx="80" ry="20" fill="#3a2a10"/>`)}
    ${Array.from({ length: 9 }, (_, i) => T.lay(id, 270 + (i % 3) * 30, 162 + Math.floor(i / 3) * 8, i * 40, T.coinTop(id, 16, { mark: '' }), { thin: true })).join('')}
    ${T.die(id, 220, 270, .72, [3, 2, 5], { rot: -10 })}${T.die(id, 380, 276, .72, [4, 1, 6], { rot: 14 })}
  `));

  cover('bluffdice', id => C(id, 'Bluff Dice', 'Secret dice, bold bids, call Liar', ['#7a2a2a', '#401414', '#160606'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#3a2014', lx: 300 })}
    ${cup(id, 200, 250, 1.15, { down: true })}${cup(id, 420, 236, 1, { down: true, c: '#2a2a3a' })}
    ${T.die(id, 300, 270, .6, [5, 5, 2], { rot: 10 })}${T.die(id, 520, 300, .6, [5, 1, 3], { rot: -16, blur: 2 })}
    ${T.lay(id, 300, 120, 0, T.sheet(id, 150, 56, T.hand('four fives…', 0, 8, 20), { fill: '#f3e7c8' }), { blur: 2 })}
  `));
}
