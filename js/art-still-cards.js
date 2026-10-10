// Still-life covers: card games. Real cards on real tables.
export default function paint(K) {
  const { cover, shell, T } = K;
  const C = (id, title, tag, bg, body, z = 1.32) => shell(id, { title, tag, bg }, `${T.defs(id)}${T.zoom(body, z)}`);
  const card = (id, x, y, r, rank, s, w = 100, o = {}) => T.lay(id, x, y, r, T.pcard(id, rank, s, w), o);
  const back = (id, x, y, r, w = 100, c = '#6a1a24', o = {}) => T.lay(id, x, y, r, T.pback(id, w, c), o);
  const deck = (id, x, y, r, w = 90, c = '#6a1a24', n = 6) => T.lay(id, x, y, r, `${Array.from({ length: n }, (_, i) => `<rect x="${-w / 2 + i * .6}" y="${-w * .7 + i * 1.6}" width="${w}" height="${w * 1.4}" rx="${w * .065}" fill="${i % 2 ? '#e8e0cc' : '#f6f0e2'}"/>`).join('')}<g transform="translate(${n * .6} ${n * 1.6 - 2})">${T.pback(id, w, c)}</g>`);
  const scorepad = (id, rows, o = {}) => T.notepad(id, o.w || 150, o.h || 190, rows.map((r, i) => T.hand(r, o.x ?? -40, -62 + i * 16 + 8, 15, '#2a2a5a', { anchor: 'start' })).join(''));
  const pencil = (id, x, y, r, o = {}) => T.lay(id, x, y, r, T.pencilFlat(o.L || 170, o.c), { thin: true, blur: o.blur });
  const silverSpoon = `<ellipse cx="0" cy="-70" rx="20" ry="28" fill="url(#ID-silver)"/><ellipse cx="-5" cy="-76" rx="8" ry="14" fill="#fff" opacity=".55"/><path d="M-4 -44 Q-6 10 -7 60 Q0 68 7 60 Q6 10 4 -44 Z" fill="url(#ID-silver)"/>`;

  cover('euchre', id => C(id, 'Euchre', 'Partners, trumps and bowers', ['#2f6b50', '#1d4433', '#0c1f17'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1d5a3c', lx: 280 })}
    ${deck(id, 110, 120, -12, 80, '#1d3a5a')}${card(id, 175, 125, 8, '9', '♦', 80)}
    ${T.fan(id, 320, 260, [['J', '♥'], ['J', '♦'], ['A', '♥'], ['K', '♥'], ['Q', '♥']], { w: 108, step: 13 })}
    ${T.chips(id, 500, 150, 26, 2, '#e8e2d4', { edge: '#1d3a5a', blur: 2 })}
  `));

  cover('veto', id => {
    const vcard = (num, c, w = 96) => `<rect x="${-w / 2}" y="${-w * .7}" width="${w}" height="${w * 1.4}" rx="${w * .08}" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="${-w / 2 + 6}" y="${-w * .7 + 6}" width="${w - 12}" height="${w * 1.4 - 12}" rx="${w * .05}" fill="${c}"/><rect x="${-w / 2 + 12}" y="${-w * .7 + 12}" width="${w - 24}" height="${w * 1.4 - 24}" rx="${w * .03}" fill="none" stroke="#f4eee0" stroke-width="1.2" opacity=".7"/>${num === 'X' ? `<path d="M-${w * .2} -${w * .2} L${w * .2} ${w * .2} M${w * .2} -${w * .2} L-${w * .2} ${w * .2}" stroke="#f4eee0" stroke-width="${w * .07}" stroke-linecap="round"/>` : `<text y="${w * .2}" text-anchor="middle" font-family="${T.DISPLAY}" font-weight="700" font-size="${w * .62}" fill="#f4eee0">${num}</text>`}<text x="${-w / 2 + 16}" y="${-w * .7 + 30}" font-family="${T.DISPLAY}" font-weight="700" font-size="${w * .18}" fill="#f4eee0">${num === 'X' ? '✕' : num}</text>`;
    const seal = `<circle r="40" fill="#8a1a1a"/><circle r="40" fill="url(#${id}-chipsheen)"/>${Array.from({ length: 16 }, (_, i) => `<circle cx="${(40 * Math.cos(i * Math.PI / 8)).toFixed(1)}" cy="${(40 * Math.sin(i * Math.PI / 8)).toFixed(1)}" r="6" fill="#8a1a1a"/>`).join('')}<circle r="30" fill="none" stroke="#5a0a0a" stroke-width="2"/>${T.word('VETO', 0, 7, 18, { weight: 700, fill: '#e8c0a0', ls: 2 })}<defs><radialGradient id="${id}-chipsheen" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs>`;
    return C(id, 'Veto', 'Match colours, block, shed', ['#7a4a2a', '#4b301c', '#1a0f06'], `
      ${T.surface(id, 'wood', { hz: 28, color: '#5a3418', lx: 300 })}
      ${T.lay(id, 200, 190, -14, vcard('7', '#2a5a9a'))}${T.lay(id, 300, 176, 2, vcard('X', '#a8242a'))}${T.lay(id, 405, 192, 14, vcard('2', '#2a7a4a'))}
      ${T.lay(id, 470, 310, 0, seal, { tilt: .72 })}
      ${T.lay(id, 110, 330, -30, vcard('5', '#c89a2a', 90), { blur: 4 })}
    `);
  });

  cover('gofish', id => {
    const lure = `<path d="M-14 -60 Q-26 0 0 60 Q26 0 14 -60 Q0 -72 -14 -60 Z" fill="url(#${id}-brass)"/><path d="M-6 -50 Q-14 0 0 46" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/><circle cy="-66" r="5" fill="none" stroke="url(#${id}-silver)" stroke-width="2"/><path d="M0 60 v14 M0 74 q-10 4 -12 -6 M0 74 q10 4 12 -6" stroke="url(#${id}-silver)" stroke-width="2.4" fill="none"/>${[0, 1, 2].map(i => `<circle cx="0" cy="${-30 + i * 22}" r="3" fill="#a8242a"/>`).join('')}`;
    return C(id, 'Go Fish', 'Ask, fish, collect books', ['#2a5a6a', '#173f48', '#081a20'], `
      ${T.surface(id, 'wood', { hz: 30, color: '#4a3424', lx: 300 })}
      ${Array.from({ length: 9 }, (_, i) => back(id, 150 + (i % 5) * 70 + (i > 4 ? 35 : 0), 120 + (i > 4 ? 70 : 0) + (i % 2) * 6, (i * 37) % 40 - 20, 70, '#1d4a5a')).join('')}
      ${T.fan(id, 300, 300, [['Q', '♠'], ['Q', '♥'], ['Q', '♦'], ['Q', '♣']], { w: 96, step: 12 })}
      ${T.lay(id, 510, 300, 30, lure, { tilt: .7 })}
    `);
  });

  cover('crazy8', id => C(id, 'Crazy Eights', 'Match suit or rank, eights are wild', ['#2a6a6a', '#17393b', '#071616'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1d4a4a', lx: 300 })}
    ${deck(id, 190, 150, -6, 90, '#6a1a24')}${card(id, 300, 150, 8, '8', '♣', 100)}${card(id, 400, 160, -10, '8', '♥', 100)}
    ${T.fan(id, 300, 320, [['8', '♠'], ['3', '♥'], ['K', '♣'], ['8', '♦']], { w: 92, step: 12, blur: 0 })}
  `));

  cover('war', id => C(id, 'War', 'Flip, compare, go to war', ['#2f4a6a', '#1c2c40', '#080e16'], `
    ${T.surface(id, 'leather', { hz: 30, color: '#3a1a1a', lx: 300 })}
    ${deck(id, 120, 190, -8, 90, '#1d3a6a', 10)}${deck(id, 480, 190, 8, 90, '#6a1a24', 10)}
    ${back(id, 260, 130, -4, 70, '#1d3a6a')}${back(id, 340, 130, 4, 70, '#6a1a24')}
    ${card(id, 250, 230, -10, 'K', '♠', 110)}${card(id, 350, 230, 10, 'K', '♦', 110)}
  `));

  cover('oldmaid', id => C(id, 'Old Maid', 'Pair up, don’t keep the Queen', ['#4a3560', '#261a32', '#0c0812'], `
    ${T.surface(id, 'linen', { hz: 30, color: '#b8aa90', lx: 300 })}
    ${[['5', '♥', '5', '♦'], ['9', '♣', '9', '♠'], ['J', '♠', 'J', '♣']].map((p, i) => `${card(id, 110 + i * 40, 110 + i * 14, -20 + i * 6, p[0], p[1], 70)}${card(id, 120 + i * 40, 118 + i * 14, -12 + i * 6, p[2], p[3], 70)}`).join('')}
    ${T.fan(id, 340, 270, ['back', 'back', ['Q', '♣'], 'back'], { w: 118, step: 14, backColor: '#4a3560' })}
  `));

  cover('rummy', id => C(id, 'Rummy', 'Meld sets and runs, go out first', ['#2a5a40', '#173a28', '#071209'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#245a3c', lx: 300 })}
    ${['5', '6', '7', '8'].map((r, i) => card(id, 130 + i * 40, 150, -3, r, '♥', 82)).join('')}
    ${['♠', '♦', '♣'].map((s, i) => card(id, 360 + i * 40, 140, 4, 'J', s, 82)).join('')}
    ${deck(id, 300, 300, 4, 82, '#1d3a5a')}${card(id, 400, 300, -8, '2', '♣', 82)}
    ${T.lay(id, 120, 320, -14, scorepad(id, ['Ana  42', 'Ben  57', 'Cleo 31'], { w: 130, h: 110 }))}
  `));

  cover('gin', id => C(id, 'Gin Rummy', 'Cut your deadwood, knock or go Gin', ['#1b4f36', '#1b3f2c', '#08160e'], `
    ${T.surface(id, 'leather', { hz: 30, color: '#22402e', lx: 300 })}
    ${T.fan(id, 270, 270, [['3', '♣'], ['4', '♣'], ['5', '♣'], ['9', '♥'], ['9', '♦'], ['9', '♠'], ['K', '♦']], { w: 100, step: 9 })}
    ${T.lay(id, 470, 170, 8, scorepad(id, ['GIN!', '+25', ''], { w: 120, h: 150, x: -30 }))}
    ${pencil(id, 470, 280, -30)}
  `));

  cover('cribbage', id => {
    const board = `<rect x="-200" y="-46" width="400" height="92" rx="46" fill="#7a4a22"/><rect x="-200" y="-46" width="400" height="92" rx="46" fill="url(#${id}-wd)"/><defs><linearGradient id="${id}-wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>${[-24, -8, 8, 24].map(yy => Array.from({ length: 30 }, (_, i) => `<circle cx="${-160 + i * 11 + Math.floor(i / 5) * 2}" cy="${yy}" r="2" fill="#2a1408"/>`).join('')).join('')}`;
    return C(id, 'Cribbage', 'Fifteens, pairs and runs, peg to 121', ['#3a5a3a', '#203a20', '#0a140a'], `
      ${T.surface(id, 'wood', { hz: 30, color: '#4a2c16', lx: 300 })}
      ${T.lay(id, 300, 140, -4, board)}
      ${T.stand(id, 250, 132, 8, `<rect x="246" y="104" width="8" height="28" rx="3" fill="#a8242a"/><rect x="330" y="96" width="8" height="28" rx="3" fill="#2a4a9a"/>`)}
      ${T.fan(id, 300, 300, [['5', '♣'], ['5', '♦'], ['J', '♥'], ['10', '♠']], { w: 96, step: 12 })}
    `);
  });

  cover('spoons', id => C(id, 'Spoons', 'Four of a kind, then grab', ['#4a5a6a', '#2c3844', '#0e1318'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#5a3a22', lx: 300 })}
    ${[-50, -15, 20, 55].map((r, i) => T.lay(id, 300 + Math.sin(r * Math.PI / 180) * 30, 150, r, silverSpoon.replace(/ID/g, id), { thin: true })).join('')}
    ${T.fan(id, 300, 310, [['7', '♠'], ['7', '♥'], ['7', '♦'], ['7', '♣']], { w: 92, step: 12 })}
  `));

  cover('doubt', id => C(id, 'I Doubt It', 'Lay them face down, lie, call it', ['#4a3a5a', '#2c2238', '#0f0a14'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#3a2a4a', lx: 300 })}
    ${Array.from({ length: 6 }, (_, i) => back(id, 260 + (i % 3) * 8, 170 - i * 3, -20 + i * 9, 92, '#3e2a52')).join('')}
    ${card(id, 400, 200, 16, '4', '♠', 104)}${back(id, 420, 196, 30, 96, '#3e2a52', { blur: 0 })}
    ${T.lay(id, 140, 300, -10, T.sheet(id, 140, 64, T.hand('“Three Kings.”', 0, 8, 20)), { tilt: .7 })}
  `));

  cover('hearts', id => C(id, 'Hearts', 'Pass three, dodge the Queen', ['#7a2a3c', '#4e1726', '#17060b'], `
    ${T.surface(id, 'leather', { hz: 30, color: '#4a1420', lx: 300 })}
    ${card(id, 300, 140, 0, 'Q', '♠', 110)}
    ${T.fan(id, 300, 320, [['A', '♥'], ['10', '♥'], ['7', '♥'], ['3', '♥'], ['K', '♣']], { w: 96, step: 11 })}
    ${back(id, 110, 160, -20, 80, '#4a1420')}${back(id, 130, 170, -8, 80, '#4a1420')}${back(id, 150, 176, 6, 80, '#4a1420')}
  `));

  cover('spades', id => C(id, 'Spades', 'Partners bid, spades are trump', ['#2c3c64', '#18223e', '#06080f'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1d2a4a', lx: 300 })}
    ${T.fan(id, 270, 280, [['A', '♠'], ['K', '♠'], ['Q', '♠'], ['J', '♠'], ['10', '♠']], { w: 104, step: 11 })}
    ${T.lay(id, 470, 170, 8, scorepad(id, ['We  bid 5', 'They bid 4', ''], { w: 140, h: 150, x: -40 }))}
    ${pencil(id, 450, 280, -24)}
  `));

  cover('whist', id => C(id, 'Whist', 'Partners, trumps and tricks', ['#1f3a6a', '#0f1e38', '#050a14'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1d3a52', lx: 300 })}
    ${card(id, 300, 110, 180, 'K', '♥', 84)}${card(id, 390, 160, 92, '9', '♥', 84)}${card(id, 300, 210, 4, 'A', '♥', 84)}${card(id, 210, 160, -88, '4', '♠', 84)}
    ${[0, 1, 2].map(i => back(id, 470 + i * 10, 300 - i * 4, 90 + i * 4, 64, '#1f2a4a')).join('')}${[0, 1].map(i => back(id, 120 + i * 10, 300 - i * 4, 90 - i * 6, 64, '#6a1f24')).join('')}
  `));

  cover('bridge', id => C(id, 'Bridge', 'Auction the contract, then make it', ['#1a4a4a', '#0c2626', '#040e0e'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1a4a3a', lx: 300 })}
    ${['A', 'K', 'Q', '9', '6', '3'].map((r, i) => card(id, 150 + i * 46, 120, 0, r, '♠', 76)).join('')}
    ${['K', '8', '4'].map((r, i) => card(id, 430 + i * 30, 112, 0, r, '♥', 76)).join('')}
    ${T.lay(id, 300, 270, -4, `<rect x="-120" y="-50" width="240" height="100" rx="8" fill="#fbf8ee" stroke="rgba(0,0,0,.2)"/>${['1♣', '1♥', '2♠', '4♠'].map((b, i) => `<text x="${-90 + i * 60}" y="-12" text-anchor="middle" font-family="${T.DISPLAY}" font-weight="700" font-size="20" fill="${b.includes('♥') ? T.RED : T.INK}">${b}</text>`).join('')}${T.word('CONTRACT', 0, 22, 11, { font: K.UI, weight: 800, ls: 3, fill: '#6a5a44' })}${T.word('4♠', 0, 44, 18, { weight: 700 })}`)}
  `));

  cover('pinochle', id => C(id, 'Pinochle', 'Bid, meld and take tricks', ['#5a3a1a', '#2e1e0c', '#100a04'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#4a2c16', lx: 300 })}
    ${card(id, 250, 170, -8, 'Q', '♠', 112)}${card(id, 350, 170, 8, 'J', '♦', 112)}
    ${T.fan(id, 300, 330, [['A', '♦'], ['10', '♦'], ['K', '♦'], ['Q', '♦'], ['J', '♦']], { w: 90, step: 10, blur: 2 })}
    ${T.lay(id, 490, 170, 10, scorepad(id, ['Meld 40', 'Bid 250'], { w: 120, h: 130, x: -34 }))}
  `));

  cover('setback', id => C(id, 'Setback', 'High, low, jack and game', ['#7a4a1a', '#40260c', '#160c04'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#5a3418', lx: 300 })}
    ${card(id, 250, 170, -10, 'J', '♣', 112)}${card(id, 350, 168, 10, '2', '♣', 112)}
    ${T.lay(id, 300, 310, -2, `<rect x="-170" y="-34" width="340" height="68" rx="10" fill="#8a5a2a"/><rect x="-170" y="-34" width="340" height="68" rx="10" fill="url(#${id}-wd2)"/><defs><linearGradient id="${id}-wd2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>${Array.from({ length: 22 }, (_, i) => `<circle cx="${-150 + i * 14}" cy="-10" r="2.4" fill="#2a1408"/><circle cx="${-150 + i * 14}" cy="10" r="2.4" fill="#2a1408"/>`).join('')}`)}
  `));

  cover('exactly', id => C(id, 'Exactly', 'Bid the exact tricks you’ll take', ['#6a2a5a', '#38142e', '#140610'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#3a1a3a', lx: 300 })}
    ${T.fan(id, 270, 280, [['Q', '♣'], ['7', '♦'], ['A', '♠']], { w: 116, step: 14 })}
    ${T.lay(id, 460, 170, 6, scorepad(id, ['Ana  bid 2', 'Ben  bid 0', 'You  bid 3'], { w: 150, h: 160, x: -50 }))}
    ${card(id, 120, 140, -14, '5', '♦', 70)}
  `));

  cover('raven', id => {
    const feather = `<path d="M0 -100 C34 -60 28 30 3 90 L-3 90 C-26 30 -34 -60 0 -100 Z" fill="#15131a"/><path d="M0 -96 V90" stroke="#3a3644" stroke-width="1.6"/>${Array.from({ length: 16 }, (_, i) => `<path d="M0 ${-84 + i * 11} l${i % 2 ? 20 : -20} -8" stroke="#2a2830" stroke-width="1.2"/>`).join('')}<path d="M-8 -40 Q-14 0 -6 50" stroke="#5a5470" stroke-width="2" fill="none" opacity=".5"/>`;
    return C(id, 'Raven', 'Bid for the nest, fear the Raven', ['#3a3a4a', '#1c1c26', '#08080c'], `
      ${T.surface(id, 'slate', { hz: 30, color: '#2a2a30', lx: 300 })}
      ${[0, 1, 2, 3, 4].map(i => back(id, 230 + i * 12, 170 - i * 3, -10 + i * 5, 90, '#2a2a3a')).join('')}
      ${T.lay(id, 380, 200, 24, feather, { s: 1.1 })}
      ${T.fan(id, 300, 340, [['10', '♠'], ['J', '♠'], ['A', '♠']], { w: 90, step: 14, blur: 2 })}
    `);
  });

  cover('missiontricks', id => {
    const crew = (n, c) => `<rect x="-36" y="-50" width="72" height="100" rx="7" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-30" y="-44" width="60" height="88" rx="5" fill="${c}"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${(i * 37) % 60 - 30}" cy="${(i * 53) % 88 - 44}" r=".9" fill="#fff" opacity=".6"/>`).join('')}${T.word(n, 0, 14, 40, { weight: 700, fill: '#f4eee0' })}`;
    const task = `<rect x="-40" y="-28" width="80" height="56" rx="6" fill="#f4eee0"/><circle cx="-18" r="12" fill="none" stroke="#2a2a5a" stroke-width="2"/><path d="M-24 0 l5 5 l9 -11" stroke="#2a8a4a" stroke-width="3" fill="none"/>${T.word('TASK', 14, 5, 13, { font: K.UI, weight: 900, ls: 1.5, fill: '#2a2a5a' })}`;
    return C(id, 'Mission Tricks', 'Co-op missions among the stars', ['#1a3a6a', '#0c1e38', '#040a14'], `
      ${T.surface(id, 'slate', { hz: 30, color: '#1a2030', lx: 300 })}
      ${T.lay(id, 190, 170, -12, crew('9', '#a8242a'))}${T.lay(id, 270, 160, -4, crew('4', '#2a5ab8'))}${T.lay(id, 350, 162, 6, crew('7', '#2a8a4a'))}${T.lay(id, 430, 176, 14, crew('2', '#c89a2a'))}
      ${T.lay(id, 230, 300, -6, task)}${T.lay(id, 380, 300, 8, task)}
      ${T.lay(id, 520, 110, 30, crew('4', '#1a1a2a'), { blur: 4 })}
    `);
  });

  cover('schnapsen', id => {
    const ring = `<ellipse rx="34" ry="34" fill="none" stroke="url(#${id}-brass)" stroke-width="9"/><path d="M-10 -40 L-6 -50 H6 L10 -40 L0 -32 Z" fill="#e8f0ff" stroke="#9ab0c8"/>`;
    return C(id, 'Schnapsen', 'A fast duel to sixty-six', ['#6a1a2a', '#380c14', '#140406'], `
      ${T.surface(id, 'leather', { hz: 30, color: '#4a1420', lx: 300 })}
      ${card(id, 250, 175, -10, 'K', '♥', 122)}${card(id, 350, 175, 10, 'Q', '♥', 122)}
      ${T.lay(id, 470, 300, 0, ring, { tilt: .62 })}
      ${deck(id, 120, 290, 10, 80, '#4a1420')}
    `);
  });

  cover('topdog', id => {
    const collar = `<ellipse rx="70" ry="70" fill="none" stroke="#7a1a1a" stroke-width="16"/><ellipse rx="70" ry="70" fill="none" stroke="url(#${id}-brass)" stroke-width="2" stroke-dasharray="3 8"/><g transform="translate(0 70)"><circle r="18" fill="url(#${id}-brass)"/>${T.word('No.1', 0, 5, 12, { weight: 700, fill: '#5a3a10' })}</g>`;
    return C(id, 'Top Dog', 'First out wins the crown', ['#7a5a1a', '#402e0c', '#160e04'], `
      ${T.surface(id, 'wood', { hz: 30, color: '#5a3418', lx: 300 })}
      ${T.lay(id, 300, 170, -6, collar, { tilt: .62 })}
      ${card(id, 300, 172, 4, '2', '♠', 96)}
      ${T.fan(id, 120, 330, ['back', 'back', 'back'], { w: 90, step: 12, backColor: '#4a2a6a', blur: 2 })}
      ${T.fan(id, 480, 320, [['3', '♣'], ['3', '♦']], { w: 90, step: 14 })}
    `);
  });

  cover('bigdeuce', id => C(id, 'Big Deuce', 'Twos are king', ['#6a1a1a', '#380c0c', '#140404'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#3a1414', lx: 300 })}
    ${T.fan(id, 300, 270, [['2', '♦'], ['2', '♣'], ['2', '♥'], ['2', '♠']], { w: 120, step: 13 })}
    ${['9', '10', 'J', 'Q', 'K'].map((r, i) => card(id, 470 + i * 14, 110 + i * 4, 6, r, '♦', 66, { blur: 2 })).join('')}
  `));

  cover('foolsdefense', id => {
    const bell = `<circle r="12" fill="url(#${id}-brass)"/><path d="M-12 0 H12" stroke="#5a3a10" stroke-width="2"/><circle cy="4" r="2" fill="#3a2410"/>`;
    return C(id, 'Fool’s Defense', 'Don’t be left holding cards', ['#4a1a6a', '#260c38', '#0c0414'], `
      ${T.surface(id, 'felt', { hz: 30, color: '#2a1a3a', lx: 300 })}
      ${card(id, 230, 170, -6, '9', '♠', 100)}${card(id, 262, 186, 24, 'K', '♠', 100)}${card(id, 380, 170, 4, '7', '♦', 100)}${card(id, 410, 188, -20, 'A', '♦', 100)}
      ${deck(id, 120, 290, -14, 84, '#2a1a3a')}${card(id, 150, 300, 80, '6', '♥', 84)}
      ${T.lay(id, 470, 310, 0, `${bell}<g transform="translate(36 10)">${bell}</g><g transform="translate(16 -24)">${bell}</g>`, { tilt: .8 })}
    `);
  });

  cover('thirtyone', id => C(id, 'Thirty-One', 'Knock when you dare', ['#1a5a3a', '#0c2e1e', '#04100a'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1a5a3a', lx: 300 })}
    ${T.fan(id, 300, 260, [['A', '♣'], ['K', '♣'], ['10', '♣']], { w: 124, step: 15 })}
    ${T.lay(id, 480, 140, 0, `<circle r="32" fill="#8a1a1a"/><circle r="25" fill="none" stroke="#5a0a0a" stroke-width="2"/>${T.word('31', 0, 9, 24, { weight: 700, fill: '#e8c0a0' })}`, { tilt: .7 })}
    ${T.chips(id, 120, 160, 24, 3, '#e8e2d4', { edge: '#1a5a3a', blur: 2 })}
  `));

  cover('tonk', id => C(id, 'Tonk', 'Spread it, or drop it', ['#5a2a1a', '#2e140c', '#100604'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#4a2a14', lx: 300 })}
    ${['♠', '♥', '♣'].map((s, i) => card(id, 140 + i * 42, 150, -4, '7', s, 84)).join('')}
    ${['5', '6', '7'].map((r, i) => card(id, 380 + i * 42, 152, 4, r, '♦', 84)).join('')}
    ${T.fan(id, 300, 320, [['Q', '♠'], ['2', '♣'], ['A', '♥']], { w: 100, step: 13 })}
    ${T.coinsLay ? '' : ''}
  `));

  cover('slapstack', id => C(id, 'Slap Stack', 'Slap the doubles first', ['#7a2a2a', '#401414', '#160606'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#4a2a14', lx: 300 })}
    ${Array.from({ length: 7 }, (_, i) => back(id, 300 + (i * 17) % 30 - 15, 180 - i * 2, (i * 47) % 70 - 35, 100, '#6a1a24')).join('')}
    ${card(id, 290, 170, -18, '7', '♠', 108)}${card(id, 316, 164, 12, '7', '♥', 108)}
    ${deck(id, 110, 300, -14, 84, '#1d3a5a')}${deck(id, 490, 300, 14, 84, '#2a5a2a')}
  `));

  cover('speed', id => C(id, 'Speed', 'No turns, just hands', ['#6a5a1a', '#382e0c', '#141004'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#2a4a2a', lx: 300 })}
    ${card(id, 240, 160, -6, '8', '♣', 108)}${card(id, 360, 160, 6, '9', '♥', 108)}
    ${T.soft(id, 4, `<g transform="translate(150 320) scale(1 .64) rotate(-20)">${T.pcard(id, '7', '♦', 100)}</g><g transform="translate(450 320) scale(1 .64) rotate(24)">${T.pcard(id, '10', '♠', 100)}</g>`)}
    ${deck(id, 80, 140, -10, 70, '#6a1a24')}${deck(id, 520, 140, 10, 70, '#1d3a5a')}
  `));

  cover('pairs', id => {
    const num = (n, c) => `<rect x="-38" y="-54" width="76" height="108" rx="7" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-32" y="-48" width="64" height="96" rx="4" fill="none" stroke="${c}" stroke-width="1.4"/>${T.word(n, 0, 16, 50, { weight: 700, fill: c })}`;
    const pear = `<path d="M0 -40 Q-14 -30 -14 -10 Q-34 10 -30 34 Q-24 56 0 56 Q24 56 30 34 Q34 10 14 -10 Q14 -30 0 -40 Z" fill="#b8b83a"/><path d="M0 -40 Q-14 -30 -14 -10 Q-34 10 -30 34 Q-24 56 0 56" fill="#8a9a2a" opacity=".5"/><path d="M0 -40 Q2 -54 8 -60" stroke="#5a3a1a" stroke-width="4" fill="none"/><path d="M6 -54 q16 -10 24 -2 q-12 8 -24 2 Z" fill="#4a7a2a"/><ellipse cx="-10" cy="10" rx="6" ry="14" fill="#fff" opacity=".25"/>`;
    return C(id, 'Pairs', 'Flip, or fold?', ['#4a6a1a', '#26380c', '#0c1404'], `
      ${T.surface(id, 'linen', { hz: 30, color: '#c8bc9c', lx: 300 })}
      ${T.lay(id, 200, 170, -10, num('3', '#2a5a2a'))}${T.lay(id, 285, 160, -2, num('7', '#a8242a'))}${T.lay(id, 360, 166, 8, num('7', '#a8242a'))}${T.lay(id, 440, 180, 16, num('10', '#2a3a6a'))}
      ${T.stand(id, 140, 320, 40, `<g transform="translate(140 270)">${pear}</g>`)}
    `);
  });

  cover('cardgolf', id => C(id, 'Card Golf', 'Lowest score wins', ['#2a6a2a', '#143814', '#061406'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#2a6a32', lx: 300 })}
    ${[['K', '♠'], 'b', ['3', '♥'], ['A', '♣'], 'b', ['5', '♦']].map((c, i) => { const x = 210 + (i % 3) * 90, y = 130 + Math.floor(i / 3) * 110; return c === 'b' ? back(id, x, y, 0, 80, '#1f4a2a') : card(id, x, y, 0, c[0], c[1], 80); }).join('')}
    ${T.stand(id, 500, 300, 20, `<circle cx="500" cy="290" r="10" fill="#fbfbf6"/><circle cx="497" cy="287" r="3" fill="#fff"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${495 + (i % 3) * 4}" cy="${292 + Math.floor(i / 3) * 4}" r=".9" fill="#c8c8c0"/>`).join('')}`)}
    ${T.lay(id, 470, 340, -30, `<rect x="-6" y="-60" width="12" height="80" fill="#e8d4a8"/><circle cy="-62" r="8" fill="#e8d4a8"/>`, { thin: true })}
  `));

  cover('cornerkings', id => C(id, 'Corner Kings', 'Kings claim the corners', ['#6a4a1a', '#38260c', '#140c04'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#2a4a2a', lx: 300 })}
    ${T.lay(id, 300, 180, 0, `${T.pback(id, 70, '#5a2a1a')}${[[0, -110, 0, '5', '♠'], [110, 0, 90, '9', '♥'], [0, 110, 0, 'J', '♣'], [-110, 0, 90, '4', '♦']].map(([x, y, r, rk, s]) => `<g transform="translate(${x} ${y})">${T.pcard(id, rk, s, 70, { rot: r })}</g>`).join('')}${[[-104, -104, -45, '♠'], [104, -104, 45, '♥'], [104, 104, -45, '♣'], [-104, 104, 45, '♦']].map(([x, y, r, s]) => `<g transform="translate(${x} ${y})">${T.pcard(id, 'K', s, 70, { rot: r })}</g>`).join('')}`, { s: .95 })}
  `));

  cover('rackem', id => C(id, 'Rack ’Em', 'Ten cards in order', ['#2a5a62', '#163238', '#061214'], `
    ${T.surface(id, 'wood', { hz: 30, color: '#5a3a22', lx: 300 })}
    ${T.lay(id, 300, 200, 0, `<rect x="-90" y="-150" width="180" height="300" rx="10" fill="#2a4a5a"/>${Array.from({ length: 10 }, (_, i) => `<rect x="-80" y="${-140 + i * 28}" width="160" height="24" rx="3" fill="url(#${id}-paper)"/><rect x="-80" y="${-140 + i * 28}" width="${10 + [3, 9, 14, 22, 30, 37, 41, 48, 53, 58][i] * 2.4}" height="24" rx="3" fill="${['#c8402a', '#d8782a', '#e0a82a', '#8ab03a', '#3a9a5a', '#2a8a9a', '#2a6ab8', '#4a4ab8', '#7a3ab0', '#a82a7a'][i]}" opacity=".85"/>${T.word(String([3, 9, 14, 22, 30, 37, 41, 48, 53, 58][i]), 66, -122 + i * 28, 16, { anchor: 'end', weight: 700 })}`).join('')}`, { tilt: .6 })}
    ${deck(id, 120, 300, -12, 70, '#2a4a5a')}
  `));

  cover('stackup', id => C(id, 'Stack Up', 'Build one to twelve, empty your stock', ['#4a3a6a', '#261c38', '#0c0814'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#2a2440', lx: 300 })}
    ${[1, 2, 3, 4, 5].map((n, i) => T.lay(id, 160 + i * 24, 150 + i * 14, -8 + i * 3, `<rect x="-40" y="-56" width="80" height="112" rx="8" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/>${T.word(String(n), 0, 16, 46, { weight: 700, fill: '#3a2a6a' })}`)).join('')}
    ${[6, 7, 8].map((n, i) => T.lay(id, 380 + i * 22, 150 + i * 12, 6 - i * 2, `<rect x="-40" y="-56" width="80" height="112" rx="8" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/>${T.word(String(n), 0, 16, 46, { weight: 700, fill: '#8a2a3a' })}`)).join('')}
    ${deck(id, 300, 320, 4, 80, '#3a2a6a')}
  `));

  cover('lowtide', id => {
    const shell2 = `<path d="M0 30 C-40 30 -46 -10 -30 -30 L0 -40 L30 -30 C46 -10 40 30 0 30 Z" fill="#f2dcc8"/>${[-24, -12, 0, 12, 24].map(x => `<path d="M0 30 L${x} -36" stroke="#d8b8a0" stroke-width="2"/>`).join('')}`;
    return C(id, 'Low Tide', 'Twelve hidden cards, lowest wins', ['#12304a', '#0a1e30', '#040c14'], `
      ${T.surface(id, 'linen', { hz: 30, color: '#d8c8a4', lx: 300 })}
      ${Array.from({ length: 12 }, (_, i) => { const x = 165 + (i % 4) * 90, y = 100 + Math.floor(i / 4) * 85; return i === 5 || i === 9 ? T.lay(id, x, y, 0, `<rect x="-34" y="-46" width="68" height="92" rx="7" fill="url(#${id}-paper)"/>${T.word(['-2', '0'][i === 5 ? 0 : 1], 0, 14, 36, { weight: 700, fill: '#1a4a6a' })}`) : T.lay(id, x, y, 0, `<rect x="-34" y="-46" width="68" height="92" rx="7" fill="#1a4a6a"/><path d="M-26 10 Q-13 0 0 10 T26 10 M-26 22 Q-13 12 0 22 T26 22" stroke="#7ab0d0" stroke-width="2" fill="none"/>`); }).join('')}
      ${T.lay(id, 520, 330, 20, shell2, { tilt: .75 })}
    `);
  });

  cover('milestones', id => C(id, 'Milestones', 'Ten stages of sets and runs', ['#1e2a3e', '#121a28', '#060a10'], `
    ${T.surface(id, 'felt', { hz: 30, color: '#1d2a40', lx: 300 })}
    ${T.lay(id, 300, 120, 0, `<rect x="-200" y="-30" width="400" height="60" rx="8" fill="#fbf8ee"/>${Array.from({ length: 10 }, (_, i) => `<circle cx="${-180 + i * 40}" r="13" fill="${i < 4 ? '#2a5ab8' : 'none'}" stroke="#2a5ab8" stroke-width="2"/>${T.word(String(i + 1), -180 + i * 40, 5, 13, { weight: 700, fill: i < 4 ? '#fff' : '#2a5ab8' })}`).join('')}`)}
    ${['7', '7', '7'].map((r, i) => T.lay(id, 170 + i * 40, 250, -4, `<rect x="-36" y="-50" width="72" height="100" rx="7" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-30" y="-44" width="60" height="88" rx="4" fill="${['#c8402a', '#2a6ab8', '#2a8a4a'][i]}"/>${T.word(r, 0, 14, 40, { weight: 700, fill: '#fff' })}`)).join('')}
    ${['3', '4', '5', '6'].map((r, i) => T.lay(id, 360 + i * 36, 252, 4, `<rect x="-36" y="-50" width="72" height="100" rx="7" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.2)"/><rect x="-30" y="-44" width="60" height="88" rx="4" fill="#c89a2a"/>${T.word(r, 0, 14, 40, { weight: 700, fill: '#fff' })}`)).join('')}
  `));
}
