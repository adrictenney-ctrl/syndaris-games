// Still-life covers for the talk-and-laugh party games: phones, slips of paper, case files and cards
// on the table, in the same lamp-lit style as every other Classic cover.
export default function paint(K) {
  const { cover, shell, T } = K;
  const C = (id, title, tag, bg, body, z = 1.2) => shell(id, { title, tag, bg }, `${T.defs(id)}${T.zoom(body, z)}`);
  const wood = id => T.surface(id, 'wood', { hz: 26, color: '#3a2414', lx: 300 });
  const hand = T.hand;
  const slip = (text, o = {}) => `<rect x="${-(o.w || 170) / 2}" y="${-(o.h || 64) / 2}" width="${o.w || 170}" height="${o.h || 64}" rx="3" fill="${o.fill || '#fbf8ee'}" stroke="rgba(0,0,0,.15)"/>${hand(text, 0, 7, o.fs || 20, o.ink || '#2a2a5a')}`;
  const screen = (bg, inner) => `<rect x="-36" y="-72" width="72" height="144" fill="${bg}"/>${inner}`;
  const phone = (id, x, y, r, inner, s = 1.2) => T.lay(id, x, y, r, T.phone(id, inner), { tilt: .74, s });
  const word = (t, x, y, size, o = {}) => T.word(t, x, y, size, { font: K.UI, weight: 900, ...o });

  cover('emojistory', id => C(id, 'Emoji Story', 'Tell it in emoji only', ['#4a3a6a', '#26143a', '#0c0614'], `
    ${wood(id)}
    ${phone(id, 230, 190, -10, screen('#1a1a3a', `<rect x="-30" y="-20" width="60" height="40" rx="12" fill="#2f6ae0"/>${[-20, 0, 20].map((x, i) => `<g transform="translate(${x} 0)"><circle r="8" fill="#ffcf3a"/><circle cx="-3" cy="-2" r="1.4" fill="#2a1a0a"/><circle cx="3" cy="-2" r="1.4" fill="#2a1a0a"/><path d="M-4 ${i === 1 ? 4 : 2} Q0 ${i === 1 ? 1 : 6} 4 ${i === 1 ? 4 : 2}" stroke="#2a1a0a" stroke-width="1.4" fill="none"/></g>`).join('')}`), 1.3)}
    ${T.lay(id, 420, 210, 8, slip('“A dog goes to the moon?”', { w: 210, h: 70, fs: 21 }))}
    ${T.lay(id, 450, 320, -6, T.pencilFlat(150), { thin: true })}
  `));

  cover('fakepitch', id => C(id, 'Fake Movie Pitch', 'In a world where…', ['#6a2a1a', '#3a140c', '#140604'], `
    ${wood(id)}
    ${T.lay(id, 240, 190, -8, `<rect x="-90" y="-60" width="180" height="120" rx="6" fill="#1d1b1a"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${-86 + i * 30}" y="-58" width="16" height="20" fill="${i % 2 ? '#e9e2d0' : '#1d1b1a'}" transform="skewX(-20)"/>`).join('')}<rect x="-90" y="-36" width="180" height="2" fill="#e9e2d0"/>${T.word('SCENE 1', -40, 8, 18, { font: K.UI, weight: 800, fill: '#e9e2d0' })}${T.word('TAKE 3', 40, 8, 18, { font: K.UI, weight: 800, fill: '#e9e2d0' })}${hand('Revenge of the Toaster', 0, 42, 18, '#e9e2d0')}`)}
    ${T.lay(id, 440, 230, 10, slip('“This summer… the toaster strikes back.”', { w: 230, h: 80, fs: 18 }))}
  `));

  cover('hottakes', id => C(id, 'Hot Takes', 'Defend the indefensible', ['#7a2a1a', '#401410', '#160604'], `
    ${wood(id)}
    ${T.lay(id, 280, 190, -6, `<rect x="-130" y="-70" width="260" height="140" rx="8" fill="#c8302a"/><rect x="-120" y="-60" width="240" height="120" rx="5" fill="none" stroke="#f4d8a8" stroke-width="2" stroke-dasharray="6 5"/>${word('HOT TAKE', 0, -24, 18, { fill: '#ffd8a0', ls: 4 })}${T.word('Cereal is soup.', 0, 22, 34, { weight: 700, fill: '#fff' })}`)}
    ${T.lay(id, 480, 300, 20, `<ellipse rx="44" ry="34" fill="#f4ecd8"/><ellipse rx="34" ry="24" fill="#e8c890"/>${Array.from({ length: 7 }, (_, i) => `<rect x="${-20 + i * 6}" y="${-12 + (i % 3) * 8}" width="10" height="6" rx="2" fill="#d8a040" transform="rotate(${i * 30})"/>`).join('')}`)}
  `));

  cover('whosaidthat', id => C(id, 'Who Said That?', 'Guess who wrote it', ['#1a4a6a', '#0c2638', '#040e14'], `
    ${wood(id)}
    ${['Pizza, every day', 'My nan', 'A goldfish called Steve'].map((t, i) => T.lay(id, 170 + i * 140, 190 + (i % 2) * 40, -10 + i * 10, slip(`“${t}”`, { w: 170, h: 70, fs: 18 }))).join('')}
    ${T.lay(id, 300, 320, 0, T.word('?', 0, 20, 70, { weight: 700, fill: '#c8a24a' }), { thin: true })}
  `));

  cover('worstgift', id => C(id, 'Worst Gift', 'They’ll “love” it', ['#2a5a3a', '#14301e', '#06120a'], `
    ${wood(id)}
    ${T.stand(id, 240, 260, 170, `<rect x="160" y="150" width="160" height="110" rx="4" fill="#3a8a5a"/><rect x="230" y="150" width="20" height="110" fill="#e8c860"/><rect x="150" y="130" width="180" height="30" rx="4" fill="#4aa070"/><rect x="230" y="130" width="20" height="30" fill="#e8c860"/><path d="M240 130 C210 96 180 110 214 130 M240 130 C270 96 300 110 266 130" fill="none" stroke="#e8c860" stroke-width="10"/>`)}
    ${T.lay(id, 440, 230, 12, slip('A single used sock', { w: 180, h: 64, fs: 20 }))}
  `));

  cover('interrogation', id => C(id, 'Interrogation', 'Lying, or telling the truth?', ['#4a3a1a', '#2e2414', '#0e0a04'], `
    ${wood(id)}
    ${T.lay(id, 260, 200, -6, `<rect x="-110" y="-80" width="220" height="160" rx="4" fill="#e0c890"/><rect x="-110" y="-96" width="90" height="22" rx="4" fill="#d8bc80"/>${word('CASE FILE', -40, -50, 14, { fill: '#8a2a1e', ls: 3, anchor: 'start' })}${hand('Alibi: at the cinema', -86, -10, 20, '#3a2a14', { anchor: 'start' })}${T.lines(-86, 16, 172, 4, 14, '#7a6040', { weight: 2, ragged: true, op: .5 })}`)}
    ${T.lay(id, 450, 190, 18, `<circle r="46" fill="none" stroke="#2a2a2a" stroke-width="10"/><circle r="46" fill="#cfe8f0" opacity=".35"/><rect x="34" y="34" width="60" height="16" rx="6" fill="#4a2a14" transform="rotate(45 34 34)"/>`)}
  `));

  cover('translatethis', id => C(id, 'Translate This', 'Say it like a pirate', ['#1a5a6a', '#0c3038', '#041014'], `
    ${wood(id)}
    ${T.lay(id, 220, 180, -8, slip('Please take out the rubbish.', { w: 230, h: 70, fs: 19 }))}
    ${T.lay(id, 300, 260, 0, word('→', 0, 0, 40, { fill: '#c8a24a' }), { thin: true })}
    ${T.lay(id, 410, 300, 8, slip('“Arr! Toss the bilge, matey!”', { w: 240, h: 74, fs: 21, fill: '#f6e27a' }))}
  `));

  cover('drawpartner', id => C(id, 'Draw Your Partner', 'The best likeness wins', ['#5a2a5a', '#2e142e', '#100610'], `
    ${wood(id)}
    ${[0, 1].map(i => T.lay(id, 200 + i * 200, 200, -8 + i * 16, `<rect x="-80" y="-100" width="160" height="200" fill="#fbf8ee" stroke="rgba(0,0,0,.15)"/><circle cy="-20" r="${44 - i * 6}" fill="none" stroke="#2a2a5a" stroke-width="4"/><circle cx="-14" cy="-28" r="4" fill="#2a2a5a"/><circle cx="14" cy="-26" r="${4 + i * 3}" fill="#2a2a5a"/><path d="M-16 ${-2 + i * 4} Q0 ${10 - i * 14} 16 ${-2}" fill="none" stroke="#2a2a5a" stroke-width="4"/><path d="M-60 90 Q0 30 60 90" fill="none" stroke="#2a2a5a" stroke-width="4"/>`)).join('')}
    ${T.lay(id, 300, 340, 70, T.pencilFlat(140), { thin: true })}
  `));

  cover('excuses', id => C(id, 'Excuses, Excuses', 'I can explain…', ['#6a5a1a', '#3a2e0c', '#141004'], `
    ${wood(id)}
    ${T.lay(id, 270, 190, -5, slip('Why were you on the roof at 3 a.m.?', { w: 280, h: 74, fs: 20 }))}
    ${T.lay(id, 330, 300, 6, slip('“I was looking for the cat.”', { w: 240, h: 64, fs: 20, fill: '#f6e27a' }))}
  `));

  cover('lipreader', id => C(id, 'Lip Reader', 'Read my lips', ['#7a2a4a', '#40142a', '#16060e'], `
    ${wood(id)}
    ${phone(id, 220, 200, -10, screen('#2a1a2a', `${word('YOUR PHRASE', 0, -38, 8, { fill: '#ffd36a', ls: 2 })}${T.word('Banana pancakes', 0, 6, 12, { weight: 700, fill: '#fff' })}`), 1.3)}
    ${T.lay(id, 430, 200, 6, `<path d="M-70 0 C-40 -36 -10 -26 0 -14 C10 -26 40 -36 70 0 C40 36 -40 36 -70 0Z" fill="#c8303a"/><path d="M-62 0 C-30 8 30 8 62 0" stroke="#7a1420" stroke-width="5" fill="none"/>`)}
  `));

  cover('twowords', id => C(id, 'Two Words', 'Invent something with both', ['#2a3a6a', '#141e38', '#060a14'], `
    ${wood(id)}
    ${T.lay(id, 200, 180, -10, slip('BANANA', { w: 160, h: 60, fs: 26 }))}
    ${T.lay(id, 400, 180, 10, slip('ROCKET', { w: 160, h: 60, fs: 26 }))}
    ${T.lay(id, 300, 300, 0, slip('“The Banana Rocket — breakfast in orbit!”', { w: 300, h: 70, fs: 18, fill: '#f6e27a' }))}
  `));

  cover('guilty', id => C(id, 'Guilty Conscience', 'Have you ever…?', ['#4a2a6a', '#2a1438', '#0e0614'], `
    ${wood(id)}
    ${T.lay(id, 280, 180, -4, slip('Have you ever eaten food off the floor?', { w: 300, h: 74, fs: 19 }))}
    ${['YES', 'NO', 'YES'].map((t, i) => T.lay(id, 190 + i * 110, 300, -8 + i * 8, `<rect x="-44" y="-30" width="88" height="60" rx="8" fill="${t === 'YES' ? '#c8302a' : '#2a6a4a'}"/>${word(t, 0, 8, 22, { fill: '#fff' })}`)).join('')}
  `));

  cover('plottwist', id => C(id, 'Plot Twist', 'Write the ending', ['#3a2a6a', '#24143a', '#0c0614'], `
    ${wood(id)}
    ${T.lay(id, 250, 200, -6, `<rect x="-120" y="-90" width="240" height="180" fill="#f4ecd8" stroke="rgba(0,0,0,.15)"/><path d="M0 -90 V90" stroke="#c9b48c" stroke-width="2"/>${T.lines(-106, -64, 92, 7, 16, '#7a6040', { weight: 2, ragged: true, op: .45 })}${hand('But then…', 60, -50, 20)}${T.lines(14, -24, 92, 4, 16, '#7a6040', { weight: 2, ragged: true, op: .2 })}`)}
    ${T.lay(id, 450, 300, 30, T.strip(K.quill(id, 0, 0, 1, 0)), { thin: true })}
  `));
}
