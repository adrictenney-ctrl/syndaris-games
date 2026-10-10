// The illustration kit behind the newer covers: painted vector props (dice, coins, gems, wheels,
// buzzers, flags, frames, animals, vehicles…) in the same style as covers.js — soft gradients,
// gilt, a drop shadow. Every prop is drawn around (0, 0) at a nominal size of about 100 and placed
// with at(x, y, scale, rotation). `id` is the cover's id prefix, for the shared gradients/filters
// that covers.js's shell defines (gold, card, sh, soft, glow).
export function makeKit(k) {
  const { SERIF, UI, SYM, CORM } = k;
  const at = (x, y, s = 1, r = 0) => `transform="translate(${x} ${y}) rotate(${r}) scale(${s})"`;
  const sh = id => `filter="url(#${id}-sh)"`;
  const lin = (gid, stops, x2 = 0, y2 = 1) => `<linearGradient id="${gid}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  const rad = (gid, stops, cx = 50, cy = 40, r = 70) => `<radialGradient id="${gid}" cx="${cx}%" cy="${cy}%" r="${r}%">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
  const shade = (c, amt) => { // mix a hex colour toward black (amt < 0) or white (amt > 0)
    const n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    const m = v => Math.round(v + (t - v) * p).toString(16).padStart(2, '0');
    return `#${m(r)}${m(g)}${m(b)}`;
  };
  const PIP = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };

  const K = { ...k, at, sh, lin, rad, shade };

  // A die in three-quarter view: top face and two sides, pips drawn on each in perspective.
  K.die3 = (id, x, y, s = 1, faces = [5, 3, 2], o = {}) => {
    const f = o.fill || '#f8f2e4', pip = o.pip || '#1d1b1a';
    const face = (pts, n, light) => {
      const [a, b, c, d] = pts; // corners in order
      const P = (u, v) => { const x1 = a[0] + (b[0] - a[0]) * u, y1 = a[1] + (b[1] - a[1]) * u, x2 = d[0] + (c[0] - d[0]) * u, y2 = d[1] + (c[1] - d[1]) * u; return [x1 + (x2 - x1) * v, y1 + (y2 - y1) * v]; };
      const pips = (PIP[n] || []).map(([u, v]) => { const [px, py] = P(.5 + u * .27, .5 + v * .27); return `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="6.2" ry="5" fill="${pip}" opacity=".92"/>`; }).join('');
      return `<path d="M${pts.map(p => p.join(' ')).join(' L')} Z" fill="${light}" stroke="${shade(f, -.35)}" stroke-width="1.2" stroke-linejoin="round"/>${pips}`;
    };
    const top = [[0, -50], [46, -26], [0, -2], [-46, -26]], left = [[-46, -26], [0, -2], [0, 50], [-46, 24]], right = [[0, -2], [46, -26], [46, 24], [0, 50]];
    return `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}>${face(top, faces[0], shade(f, .2))}${face(left, faces[1], shade(f, -.06))}${face(right, faces[2], shade(f, -.2))}<path d="M-46 -26 L0 -50 L46 -26" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/></g>`;
  };

  // A gold coin, face on (or tilted with ry < r).
  K.coin = (id, x, y, s = 1, o = {}) => `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}><ellipse cx="0" cy="4" rx="40" ry="${40 * (o.tilt || 1)}" fill="#7a5a1e"/><ellipse rx="40" ry="${40 * (o.tilt || 1)}" fill="url(#${id}-gold)" stroke="#8a6420" stroke-width="2"/><ellipse rx="31" ry="${31 * (o.tilt || 1)}" fill="none" stroke="#fff3cf" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 3"/><text y="${12 * (o.tilt || 1)}" text-anchor="middle" font-family="${SERIF}" font-size="34" fill="#8a6420" transform="scale(1 ${o.tilt || 1})">${o.mark ?? '$'}</text></g>`;
  K.coins = (id, x, y, n = 6, s = 1) => { let h = ''; for (let i = 0; i < n; i++) h += `<g transform="translate(0 ${-i * 7})"><ellipse cx="0" cy="5" rx="40" ry="14" fill="#7a5a1e"/><rect x="-40" y="-2" width="80" height="7" fill="#b8893a"/><ellipse rx="40" ry="14" fill="url(#${id}-gold)" stroke="#8a6420"/></g>`; return `<g ${at(x, y, s)} ${sh(id)}>${h}</g>`; };

  // A cut gem, faceted, in any colour.
  K.gem = (id, x, y, s = 1, c = '#3a9ad8', r = 0) => `<g ${at(x, y, s, r)} ${sh(id)}><path d="M-44 -14 L-26 -38 L26 -38 L44 -14 L0 44 Z" fill="${shade(c, -.25)}"/><path d="M-44 -14 L44 -14 L0 44 Z" fill="${c}"/><path d="M-26 -38 L-14 -14 L0 -38 L14 -14 L26 -38" fill="${shade(c, .35)}" stroke="${shade(c, .5)}" stroke-width=".8"/><path d="M-44 -14 L-14 -14 L0 44 Z" fill="${shade(c, .15)}"/><path d="M14 -14 L44 -14 L0 44 Z" fill="${shade(c, -.35)}"/><path d="M-20 -30 L-10 -30 L-16 -20 Z" fill="#fff" opacity=".8"/></g>`;

  // A round arcade buzzer on a brass collar.
  K.buzzer = (id, x, y, s = 1, c = '#d8322a', o = {}) => `<g ${at(x, y, s)} ${sh(id)}><defs>${rad(`${id}-bz${c.slice(1)}`, [[0, shade(c, .45)], [.55, c], [1, shade(c, -.45)]], 40, 30, 70)}</defs><ellipse cx="0" cy="22" rx="62" ry="22" fill="#2a2018"/><ellipse cx="0" cy="12" rx="62" ry="22" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><path d="M-46 8 v-22 a46 18 0 0 0 92 0 v22 a46 18 0 0 1 -92 0 Z" fill="${shade(c, -.3)}"/><ellipse cx="0" cy="-14" rx="46" ry="18" fill="url(#${id}-bz${c.slice(1)})"/><ellipse cx="-14" cy="-20" rx="16" ry="5" fill="#fff" opacity=".45"/>${o.label ? `<text y="-9" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="14" letter-spacing="1.5" fill="#fff" opacity=".9" transform="scale(1 .8)">${o.label}</text>` : ''}</g>`;

  // A wheel seen face on: segments, a gilt rim with studs, a hub. labels optional.
  K.wheel = (id, x, y, s = 1, cols = ['#b8232a', '#1d1b1a'], o = {}) => {
    const n = o.n || cols.length * 6, R = 100, segs = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + (o.spin || 0), a1 = ((i + 1) / n) * Math.PI * 2 + (o.spin || 0);
      segs.push(`<path d="M0 0 L${(R * Math.cos(a0)).toFixed(1)} ${(R * Math.sin(a0)).toFixed(1)} A${R} ${R} 0 0 1 ${(R * Math.cos(a1)).toFixed(1)} ${(R * Math.sin(a1)).toFixed(1)} Z" fill="${(o.colorOf ? o.colorOf(i) : cols[i % cols.length])}" stroke="${o.line || '#e9d7ae'}" stroke-width="1"/>`);
      if (o.labels) { const am = (a0 + a1) / 2; segs.push(`<text transform="translate(${(R * .8 * Math.cos(am)).toFixed(1)} ${(R * .8 * Math.sin(am)).toFixed(1)}) rotate(${(am * 180 / Math.PI + 90).toFixed(1)})" text-anchor="middle" y="4" font-family="${UI}" font-weight="800" font-size="${o.fs || 10}" fill="${o.ink || '#fff'}">${o.labels[i % o.labels.length]}</text>`); }
    }
    const studs = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `<circle cx="${(108 * Math.cos(a)).toFixed(1)}" cy="${(108 * Math.sin(a)).toFixed(1)}" r="3" fill="#fff3cf"/>`; }).join('');
    return `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}><circle r="116" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="3"/><circle r="102" fill="#2a1a0c"/>${segs.join('')}${studs}<circle r="22" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><circle r="9" fill="#6a4a1a"/></g>`;
  };

  // A roulette wheel from slightly above: wooden bowl, numbered pockets, a white ball.
  K.roulette = (id, x, y, s = 1, o = {}) => {
    const order = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const n = order.length, R = 100;
    let pk = '';
    order.forEach((num, i) => {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      const col = num === 0 ? '#1e7a3a' : i % 2 ? '#1d1b1a' : '#b8232a';
      pk += `<path d="M${(62 * Math.cos(a0)).toFixed(1)} ${(62 * Math.sin(a0)).toFixed(1)} L${(R * Math.cos(a0)).toFixed(1)} ${(R * Math.sin(a0)).toFixed(1)} A${R} ${R} 0 0 1 ${(R * Math.cos(a1)).toFixed(1)} ${(R * Math.sin(a1)).toFixed(1)} L${(62 * Math.cos(a1)).toFixed(1)} ${(62 * Math.sin(a1)).toFixed(1)} A62 62 0 0 0 ${(62 * Math.cos(a0)).toFixed(1)} ${(62 * Math.sin(a0)).toFixed(1)} Z" fill="${col}" stroke="#d8b46a" stroke-width=".8"/>`;
      pk += `<text transform="translate(${(90 * Math.cos(am)).toFixed(1)} ${(90 * Math.sin(am)).toFixed(1)}) rotate(${(am * 180 / Math.PI + 90).toFixed(1)})" text-anchor="middle" y="3" font-family="${UI}" font-weight="800" font-size="7.5" fill="#f3ead6">${num}</text>`;
    });
    const spokes = [0, 1, 2, 3].map(i => `<rect x="-3" y="-52" width="6" height="104" rx="3" fill="url(#${id}-gold)" transform="rotate(${i * 45 + 22})"/>`).join('');
    return `<g ${at(x, y, s, 0)} ${sh(id)}><g transform="scale(1 ${o.tilt || .62})"><circle r="132" fill="#4a2410"/><circle r="126" fill="#6e3a1a" stroke="#2a1206" stroke-width="3"/><circle r="110" fill="#3a1e0c"/><circle r="104" fill="#d8b46a"/>${pk}<circle r="62" fill="#5a3416"/><circle r="56" fill="#7a4a22"/>${spokes}<circle r="14" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><circle cx="${(o.ball ?? 80) * Math.cos(-1.1)}" cy="${(o.ball ?? 80) * Math.sin(-1.1)}" r="7" fill="#fff" stroke="#bbb"/></g></g>`;
  };

  // A waving flag on a pole. design: 'tri' (three bands), 'cross', 'star', 'stripes', 'circle'.
  K.flag = (id, x, y, s = 1, design = 'tri', cols = ['#2a4aa8', '#f3ead6', '#c8232a'], r = 0) => {
    const W = 120, H = 80, wave = (dy = 0) => `M0 ${dy} C30 ${dy - 10} 60 ${dy + 10} ${W} ${dy}`;
    const clipId = `${id}-fl${design}${cols.join('').replace(/#/g, '')}`;
    let body;
    if (design === 'tri') body = cols.map((c, i) => `<rect x="${i * W / 3}" y="-20" width="${W / 3 + 1}" height="${H + 40}" fill="${c}"/>`).join('');
    else if (design === 'stripes') body = cols.map((c, i) => `<rect x="0" y="${-10 + i * (H + 20) / cols.length}" width="${W}" height="${(H + 20) / cols.length + 1}" fill="${c}"/>`).join('');
    else if (design === 'cross') body = `<rect x="0" y="-20" width="${W}" height="${H + 40}" fill="${cols[0]}"/><rect x="34" y="-20" width="16" height="${H + 40}" fill="${cols[1]}"/><rect x="0" y="${H / 2 - 8}" width="${W}" height="16" fill="${cols[1]}"/>`;
    else if (design === 'circle') body = `<rect x="0" y="-20" width="${W}" height="${H + 40}" fill="${cols[0]}"/><circle cx="${W / 2}" cy="${H / 2}" r="20" fill="${cols[1]}"/>`;
    else body = `<rect x="0" y="-20" width="${W}" height="${H + 40}" fill="${cols[0]}"/><path transform="translate(${W / 2} ${H / 2}) scale(1.4)" d="M0 -14 L4 -4 L14 -4 L6 2 L9 12 L0 6 L-9 12 L-6 2 L-14 -4 L-4 -4 Z" fill="${cols[1]}"/>`;
    return `<g ${at(x, y, s, r)} ${sh(id)}><defs><clipPath id="${clipId}"><path d="${wave()} L${W} ${H} C60 ${H + 10} 30 ${H - 10} 0 ${H} Z"/></clipPath>${lin(`${clipId}-sh`, [[0, '#000', .25], [.3, '#fff', .15], [.55, '#000', .2], [.8, '#fff', .12], [1, '#000', .25]], 1, 0)}</defs><rect x="-6" y="-8" width="5" height="${H + 120}" rx="2" fill="url(#${id}-gold)"/><circle cx="-3.5" cy="-10" r="6" fill="url(#${id}-gold)"/><g clip-path="url(#${clipId})">${body}<rect x="0" y="-20" width="${W}" height="${H + 40}" fill="url(#${clipId}-sh)"/></g></g>`;
  };

  // A globe on a brass stand.
  K.globe = (id, x, y, s = 1) => `<g ${at(x, y, s)} ${sh(id)}><defs>${rad(`${id}-gl`, [[0, '#6ac0e8'], [.7, '#1e5a8a'], [1, '#0a2a48']], 38, 32, 75)}</defs><path d="M-40 92 h80 l-10 -14 h-60 Z" fill="url(#${id}-gold)"/><rect x="-4" y="60" width="8" height="20" fill="url(#${id}-gold)"/><path d="M-66 -14 A70 70 0 0 0 52 54" fill="none" stroke="url(#${id}-gold)" stroke-width="6"/><circle r="58" fill="url(#${id}-gl)"/><g fill="#5aa04a" opacity=".9"><path d="M-30 -40 q14 -8 26 2 q8 10 -2 18 q-14 4 -12 18 q-6 10 -16 2 q-8 -14 -2 -22 q-8 -8 6 -18 Z"/><path d="M12 -14 q16 -6 26 6 q6 14 -4 26 q-6 16 -18 10 q-4 -14 -10 -18 q-4 -14 6 -24 Z"/><path d="M20 -48 q10 -2 14 6 q-6 4 -14 -6 Z"/></g><ellipse cx="-22" cy="-26" rx="18" ry="10" fill="#fff" opacity=".22" transform="rotate(-30)"/><path d="M-58 0 A58 20 0 0 0 58 0" fill="none" stroke="#fff" stroke-opacity=".2"/></g>`;

  // A classical building (capitol / museum).
  K.temple = (id, x, y, s = 1, c = '#efe4cc') => `<g ${at(x, y, s)} ${sh(id)}><path d="M-80 -30 L0 -72 L80 -30 Z" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="2"/><path d="M-54 -38 L0 -64 L54 -38 Z" fill="${shade(c, -.1)}"/><rect x="-82" y="-32" width="164" height="12" fill="${shade(c, -.08)}"/>${[-64, -38, -12, 12, 38, 64].map(cx => `<rect x="${cx - 7}" y="-20" width="14" height="70" fill="${c}"/><rect x="${cx - 7}" y="-20" width="4" height="70" fill="#fff" opacity=".4"/><rect x="${cx - 10}" y="-22" width="20" height="5" fill="${shade(c, -.15)}"/>`).join('')}<rect x="-90" y="50" width="180" height="10" fill="${shade(c, -.12)}"/><rect x="-98" y="60" width="196" height="10" fill="${shade(c, -.2)}"/></g>`;

  // A balance scale.
  K.scales = (id, x, y, s = 1, tilt = 10) => {
    const pan = (px, py) => `<g transform="translate(${px} ${py})"><path d="M0 0 L-26 46 M0 0 L26 46" stroke="url(#${id}-gold)" stroke-width="2"/><path d="M-34 46 Q0 70 34 46 Z" fill="url(#${id}-gold)" stroke="#6a4a1a"/></g>`;
    const a = tilt * Math.PI / 180, dx = 80 * Math.cos(a), dy = 80 * Math.sin(a);
    return `<g ${at(x, y, s)} ${sh(id)}><path d="M-40 96 h80 l-12 -16 h-56 Z" fill="url(#${id}-gold)" stroke="#6a4a1a"/><rect x="-5" y="-54" width="10" height="136" fill="url(#${id}-gold)"/><circle cy="-60" r="10" fill="url(#${id}-gold)" stroke="#6a4a1a"/><path d="M${-dx} ${-50 - dy} L${dx} ${-50 + dy}" stroke="url(#${id}-gold)" stroke-width="7" stroke-linecap="round"/>${pan(-dx, -50 - dy)}${pan(dx, -50 + dy)}</g>`;
  };

  // An hourglass in a wooden frame.
  K.hourglass = (id, x, y, s = 1, r = 0) => `<g ${at(x, y, s, r)} ${sh(id)}><rect x="-46" y="-78" width="92" height="12" rx="4" fill="#5a3416"/><rect x="-46" y="66" width="92" height="12" rx="4" fill="#5a3416"/>${[-38, 38].map(cx => `<rect x="${cx - 4}" y="-68" width="8" height="136" fill="url(#${id}-gold)"/>`).join('')}<path d="M-30 -66 Q-30 -20 -4 0 Q-30 20 -30 66 L30 66 Q30 20 4 0 Q30 -20 30 -66 Z" fill="#dbe8f0" opacity=".35" stroke="#fff" stroke-opacity=".6"/><path d="M-20 -40 Q-14 -18 -2 -4 L2 -4 Q14 -18 20 -40 Z" fill="#e8c06a"/><path d="M-1 0 L1 0 L1 50 L-1 50 Z" fill="#e8c06a"/><path d="M-26 66 Q-14 36 0 32 Q14 36 26 66 Z" fill="#e8c06a"/><path d="M-22 -60 Q-24 -30 -10 -12" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none"/></g>`;

  // A pocket stopwatch.
  K.stopwatch = (id, x, y, s = 1, o = {}) => `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}><rect x="-8" y="-82" width="16" height="16" rx="3" fill="url(#${id}-gold)"/><circle cy="-88" r="9" fill="none" stroke="url(#${id}-gold)" stroke-width="4"/><rect x="34" y="-66" width="12" height="16" rx="3" fill="url(#${id}-gold)" transform="rotate(40)"/><circle r="66" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><circle r="56" fill="#fbf6ea"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-1.5" y="-52" width="3" height="${i % 3 ? 6 : 11}" fill="#2a2018" transform="rotate(${i * 30})"/>`).join('')}<path d="M0 0 L0 -44" stroke="#b8232a" stroke-width="3" stroke-linecap="round" transform="rotate(${o.hand ?? 50})"/><path d="M0 0 L0 -30" stroke="#1d1b1a" stroke-width="4" stroke-linecap="round" transform="rotate(${o.hand2 ?? -60})"/><circle r="5" fill="#1d1b1a"/><path d="M-40 -30 A50 50 0 0 1 10 -50" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none"/></g>`;

  // A trophy cup.
  K.trophy = (id, x, y, s = 1) => `<g ${at(x, y, s)} ${sh(id)}><path d="M-44 -62 h88 v20 q0 50 -44 62 q-44 -12 -44 -62 Z" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><path d="M-44 -50 q-34 0 -30 26 q4 22 34 26 M44 -50 q34 0 30 26 q-4 22 -34 26" fill="none" stroke="url(#${id}-gold)" stroke-width="7"/><rect x="-7" y="20" width="14" height="28" fill="url(#${id}-gold)"/><path d="M-34 48 h68 v12 h-68 Z" fill="url(#${id}-gold)" stroke="#6a4a1a"/><rect x="-44" y="60" width="88" height="22" rx="3" fill="#3a2410"/><rect x="-26" y="66" width="52" height="10" rx="2" fill="url(#${id}-gold)"/><path d="M-30 -56 q-2 34 18 50" stroke="#fff" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M0 -40 l5 10 l11 1 l-8 7 l3 11 l-11 -6 l-11 6 l3 -11 l-8 -7 l11 -1 Z" fill="#fff3cf" opacity=".85"/></g>`;

  // A rocket, nose up.
  K.rocket = (id, x, y, s = 1, r = 0, o = {}) => `<g ${at(x, y, s, r)}>${o.flame === false ? '' : `<path d="M-16 58 Q0 130 16 58 Z" fill="#ffb03a" filter="url(#${id}-glow)"/><path d="M-8 58 Q0 100 8 58 Z" fill="#fff3cf"/>`}<g ${sh(id)}><path d="M-26 30 L-50 66 L-22 56 Z M26 30 L50 66 L22 56 Z" fill="#b8232a"/><path d="M0 -90 Q34 -50 28 40 L22 60 L-22 60 L-28 40 Q-34 -50 0 -90 Z" fill="#efe9dc" stroke="#8a8478" stroke-width="2"/><path d="M0 -90 Q18 -70 22 -46 L-22 -46 Q-18 -70 0 -90 Z" fill="#b8232a"/><circle cy="-10" r="15" fill="#2a4a6a" stroke="url(#${id}-gold)" stroke-width="5"/><circle cx="-5" cy="-15" r="5" fill="#fff" opacity=".6"/><path d="M-8 -80 Q-22 -30 -18 40" stroke="#fff" stroke-opacity=".7" stroke-width="4" fill="none"/><rect x="-22" y="56" width="44" height="8" rx="2" fill="#5a5448"/></g></g>`;

  // A racehorse at full gallop, as a silhouette with a jockey (colour = silks).
  K.horse = (id, x, y, s = 1, silks = '#c8232a', coat = '#3a2416', flip = false) => `<g ${at(x, y, s)} ${sh(id)}><g transform="scale(${flip ? -1 : 1} 1)"><path d="M-62 -6 C-60 -22 -40 -30 -16 -28 C4 -27 22 -30 34 -40 C40 -52 46 -60 56 -62 L62 -70 L64 -60 C72 -56 78 -48 76 -42 C72 -38 64 -40 58 -38 C52 -26 48 -14 40 -6 C46 4 58 14 70 18 L66 26 C52 22 40 14 30 6 C18 10 4 10 -10 8 C-18 18 -30 30 -44 34 L-50 28 C-38 22 -28 12 -24 2 C-36 6 -50 12 -64 26 L-72 20 C-62 8 -60 2 -62 -6 Z" fill="${coat}"/><path d="M-62 -6 C-74 -14 -84 -6 -90 6 C-82 0 -72 -2 -66 0 Z" fill="${shade(coat, -.3)}"/><path d="M40 -46 C46 -54 52 -58 56 -60" stroke="${shade(coat, -.4)}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="66" cy="-54" r="2.2" fill="#fff"/><path d="M-6 -30 C-4 -48 4 -58 14 -60 L22 -56 C18 -48 10 -40 8 -30 Z" fill="${silks}"/><circle cx="20" cy="-66" r="8" fill="${silks}"/><path d="M12 -70 h16" stroke="${shade(silks, -.4)}" stroke-width="3"/><path d="M10 -42 L34 -40" stroke="${silks}" stroke-width="5" stroke-linecap="round"/><rect x="-8" y="-32" width="22" height="10" rx="3" fill="#f3ead6"/><text x="3" y="-24" text-anchor="middle" font-family="${UI}" font-weight="900" font-size="8" fill="#1d1b1a">${'7'}</text></g></g>`;

  // A vintage open car (for road games).
  K.car = (id, x, y, s = 1, c = '#b8232a', flip = false) => `<g ${at(x, y, s)} ${sh(id)}><g transform="scale(${flip ? -1 : 1} 1)"><path d="M-90 10 Q-90 -14 -64 -18 L-30 -22 Q-16 -46 18 -46 L34 -46 Q40 -30 52 -22 L80 -18 Q96 -14 96 6 L96 16 L-90 16 Z" fill="${c}"/><path d="M-90 10 h186" stroke="${shade(c, -.4)}" stroke-width="3"/><path d="M-20 -24 Q-10 -40 14 -40 L26 -40 L30 -24 Z" fill="#cfe4f0" opacity=".85"/><path d="M-80 -6 h170" stroke="#fff" stroke-opacity=".4" stroke-width="2"/><rect x="84" y="-12" width="14" height="10" rx="3" fill="#f3e7c0"/>${[-56, 60].map(cx => `<circle cx="${cx}" cy="18" r="22" fill="#1d1b1a"/><circle cx="${cx}" cy="18" r="13" fill="url(#${id}-gold)"/><circle cx="${cx}" cy="18" r="4" fill="#6a4a1a"/>`).join('')}</g></g>`;

  // A book (closed, standing at an angle) or open.
  K.book = (id, x, y, s = 1, c = '#6a1f24', o = {}) => o.open
    ? `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}><path d="M-110 -50 Q-56 -66 0 -50 Q56 -66 110 -50 L110 56 Q56 40 0 56 Q-56 40 -110 56 Z" fill="${c}"/><path d="M-102 -54 Q-52 -68 0 -54 L0 50 Q-52 36 -102 50 Z" fill="#f6eedb"/><path d="M102 -54 Q52 -68 0 -54 L0 50 Q52 36 102 50 Z" fill="#efe4cc"/><path d="M0 -54 V50" stroke="#c9b48c"/>${(o.lines ?? true) ? [0, 1, 2, 3, 4, 5].map(i => `<path d="M-88 ${-34 + i * 13} Q-48 ${-44 + i * 13} -12 ${-34 + i * 13} M12 ${-34 + i * 13} Q48 ${-44 + i * 13} 88 ${-34 + i * 13}" stroke="#8a7a5a" stroke-width="2" opacity=".45" fill="none"/>`).join('') : ''}${o.inner || ''}</g>`
    : `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}><rect x="-40" y="-56" width="80" height="112" rx="4" fill="${c}"/><rect x="30" y="-54" width="10" height="108" fill="#efe4cc"/><rect x="-40" y="-56" width="12" height="112" rx="3" fill="${shade(c, -.3)}"/><rect x="-20" y="-40" width="44" height="30" fill="none" stroke="url(#${id}-gold)" stroke-width="2"/>${o.label ? `<text x="2" y="-20" text-anchor="middle" font-family="${SERIF}" font-size="11" fill="#e9d29a">${o.label}</text>` : ''}<path d="M-28 30 h52 M-28 38 h52" stroke="url(#${id}-gold)" stroke-width="2"/></g>`;

  // A rolled scroll / parchment with lines of writing.
  K.scroll = (id, x, y, s = 1, o = {}) => `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}><rect x="-80" y="-60" width="160" height="120" fill="#efe1bd"/><rect x="-80" y="-60" width="160" height="120" fill="url(#${id}-card)" opacity=".5"/>${o.inner || [0, 1, 2, 3, 4].map(i => `<path d="M-60 ${-34 + i * 17} H${50 - (i % 2) * 22}" stroke="#7a6040" stroke-width="2.5" opacity=".55"/>`).join('')}${[-66, 66].map(cy => `<rect x="-90" y="${cy - 8}" width="180" height="16" rx="8" fill="#d9c08a" stroke="#8a6a3a" stroke-width="1.5"/><circle cx="-92" cy="${cy}" r="9" fill="#5a3416"/><circle cx="92" cy="${cy}" r="9" fill="#5a3416"/>`).join('')}</g>`;

  // A quill pen.
  K.quill = (id, x, y, s = 1, r = 30) => `<g ${at(x, y, s, r)} ${sh(id)}><path d="M0 -100 C28 -70 22 -10 2 40 L-2 40 C-10 -10 -24 -70 0 -100 Z" fill="#f6efe0" stroke="#b8a88a" stroke-width="1.5"/><path d="M0 -96 C4 -40 2 10 0 40" stroke="#9a8a6a" stroke-width="1.5" fill="none"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M0 ${-80 + i * 18} l${i % 2 ? 14 : -12} -8" stroke="#d8ccb4" stroke-width="1.2"/>`).join('')}<path d="M-2 40 L0 64 L2 40 Z" fill="#2a2018"/></g>`;

  // A magnifying glass.
  K.magnifier = (id, x, y, s = 1, r = -35, inner = '') => `<g ${at(x, y, s, r)} ${sh(id)}><rect x="-8" y="44" width="16" height="70" rx="6" fill="#3a2410"/><rect x="-6" y="40" width="12" height="12" fill="url(#${id}-gold)"/><circle r="46" fill="#dfeaf2" opacity=".28"/>${inner}<circle r="46" fill="none" stroke="url(#${id}-gold)" stroke-width="9"/><path d="M-30 -18 A34 34 0 0 1 -6 -36" stroke="#fff" stroke-opacity=".75" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;

  // A light bulb, lit.
  K.bulb = (id, x, y, s = 1) => `<g ${at(x, y, s)}><circle r="58" fill="#ffe08a" opacity=".5" filter="url(#${id}-soft)"/><g ${sh(id)}><path d="M-36 -10 A40 40 0 1 1 36 -10 C36 12 18 22 16 40 L-16 40 C-18 22 -36 12 -36 -10 Z" fill="#fff3c0" stroke="#e0b44a" stroke-width="2"/><path d="M-10 36 L-6 4 L0 14 L6 4 L10 36" stroke="#d8902a" stroke-width="3" fill="none"/>${[0, 1, 2].map(i => `<rect x="-17" y="${42 + i * 9}" width="34" height="7" rx="3" fill="url(#${id}-gold)"/>`).join('')}<path d="M-8 70 h16 l-4 6 h-8 Z" fill="#6a4a1a"/><path d="M-24 -26 A26 26 0 0 1 -4 -42" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/></g></g>`;

  // A speech bubble with words in it.
  K.bubble = (id, x, y, w, h, text = '', o = {}) => `<g ${at(x, y, 1, o.rot || 0)} ${sh(id)}><path d="M${-w / 2} ${-h / 2 + 14} Q${-w / 2} ${-h / 2} ${-w / 2 + 14} ${-h / 2} H${w / 2 - 14} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 14} V${h / 2 - 14} Q${w / 2} ${h / 2} ${w / 2 - 14} ${h / 2} H${o.tail === 'r' ? w / 4 + 22 : -w / 4 + 22} L${o.tail === 'r' ? w / 4 + 16 : -w / 4 - 6} ${h / 2 + 22} L${o.tail === 'r' ? w / 4 : -w / 4} ${h / 2} H${-w / 2 + 14} Q${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 14} Z" fill="${o.fill || '#fffaf0'}"/>${text ? `<text y="${(o.fs || 22) * .35}" text-anchor="middle" font-family="${o.font || SERIF}" ${o.italic ? 'font-style="italic"' : ''} font-size="${o.fs || 22}" fill="${o.ink || '#2a2018'}">${text}</text>` : ''}</g>`;

  // A pencil.
  K.pencil = (id, x, y, s = 1, r = 40, c = '#e6b84a') => `<g ${at(x, y, s, r)} ${sh(id)}><rect x="-9" y="-90" width="18" height="140" fill="${c}"/><rect x="-9" y="-90" width="6" height="140" fill="#fff" opacity=".25"/><path d="M-9 50 L0 80 L9 50 Z" fill="#ecd3a6"/><path d="M-3 70 L0 80 L3 70 Z" fill="#2a2018"/><rect x="-9" y="-104" width="18" height="16" fill="#c9b8a0"/><rect x="-9" y="-120" width="18" height="18" rx="5" fill="#d98a8a"/></g>`;

  // A gilt picture frame around something.
  K.frame = (id, x, y, w, h, inner = '', o = {}) => `<g ${at(x, y, 1, o.rot || 0)} ${sh(id)}><rect x="${-w / 2 - 14}" y="${-h / 2 - 14}" width="${w + 28}" height="${h + 28}" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><rect x="${-w / 2 - 7}" y="${-h / 2 - 7}" width="${w + 14}" height="${h + 14}" fill="none" stroke="#6a4a1a" stroke-width="2" opacity=".6"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${o.bg || '#f3ead6'}"/>${inner}</g>`;

  // Theatre / masquerade mask.
  K.mask = (id, x, y, s = 1, r = 0, c = '#f3ead6', o = {}) => `<g ${at(x, y, s, r)} ${sh(id)}><path d="M-60 -24 Q-60 -40 -40 -40 Q-14 -40 0 -26 Q14 -40 40 -40 Q60 -40 60 -24 Q60 10 32 14 Q14 16 0 2 Q-14 16 -32 14 Q-60 10 -60 -24 Z" fill="${c}" stroke="${shade(c, -.4)}" stroke-width="2"/><path d="M-44 -22 Q-30 -32 -16 -20 Q-30 -10 -44 -22 Z M44 -22 Q30 -32 16 -20 Q30 -10 44 -22 Z" fill="#1d1b1a"/>${o.gold !== false ? `<path d="M-60 -24 Q-60 -40 -40 -40 Q-14 -40 0 -26 Q14 -40 40 -40 Q60 -40 60 -24" fill="none" stroke="url(#${id}-gold)" stroke-width="3"/>` : ''}${o.stick ? `<rect x="54" y="-6" width="6" height="90" rx="3" fill="url(#${id}-gold)" transform="rotate(18 57 -6)"/>` : ''}${o.plume ? `<path d="M40 -40 C60 -80 90 -90 100 -110 C84 -86 70 -62 50 -38 Z" fill="${o.plume}"/>` : ''}</g>`;

  // A candle with flame.
  K.candle = (id, x, y, s = 1, h = 90) => `<g ${at(x, y, s)}><circle cy="${-h - 18}" r="34" fill="#ffcf6a" opacity=".55" filter="url(#${id}-soft)"/><g ${sh(id)}><rect x="-16" y="${-h}" width="32" height="${h}" rx="3" fill="#f3ead6"/><rect x="-16" y="${-h}" width="9" height="${h}" fill="#fff" opacity=".5"/><path d="M-16 ${-h + 4} q6 10 10 0 q4 14 10 2" fill="#f3ead6"/><path d="M0 ${-h} v-8" stroke="#2a2018" stroke-width="2"/><path d="M0 ${-h - 36} C10 ${-h - 22} 8 ${-h - 10} 0 ${-h - 6} C-8 ${-h - 10} -10 ${-h - 22} 0 ${-h - 36} Z" fill="#ffd36a"/><path d="M0 ${-h - 24} C4 ${-h - 16} 3 ${-h - 10} 0 ${-h - 8} C-3 ${-h - 10} -4 ${-h - 16} 0 ${-h - 24} Z" fill="#fff"/><ellipse cy="2" rx="34" ry="9" fill="url(#${id}-gold)"/></g></g>`;

  // A key.
  K.key = (id, x, y, s = 1, r = 0) => `<g ${at(x, y, s, r)} ${sh(id)}><circle cx="-56" r="24" fill="none" stroke="url(#${id}-gold)" stroke-width="10"/><circle cx="-56" r="7" fill="url(#${id}-gold)"/><rect x="-34" y="-6" width="104" height="12" rx="4" fill="url(#${id}-gold)"/><path d="M44 6 v18 h10 v-10 h8 v14 h10 v-22" fill="url(#${id}-gold)"/></g>`;

  // A padlock.
  K.padlock = (id, x, y, s = 1, o = {}) => `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}><path d="M-30 -10 V-40 A30 30 0 0 1 30 -40 V${o.open ? -60 : -10}" fill="none" stroke="#b8bec6" stroke-width="12"/><rect x="-46" y="-12" width="92" height="76" rx="10" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/><circle cy="18" r="10" fill="#3a2410"/><path d="M-5 22 h10 l-3 22 h-4 Z" fill="#3a2410"/></g>`;

  // A treasure chest, open, spilling gold.
  K.chest = (id, x, y, s = 1) => `<g ${at(x, y, s)} ${sh(id)}><path d="M-80 -30 Q-80 -86 0 -86 Q80 -86 80 -30 Z" fill="#6a3a1a" stroke="#3a1e0a" stroke-width="3" transform="translate(0 -14) skewX(-8)"/><circle r="70" cy="-30" fill="#ffd36a" opacity=".45" filter="url(#${id}-soft)"/>${[[-40, -34], [-10, -44], [24, -38], [50, -30], [-56, -24], [8, -28]].map(([cx, cy]) => `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="7" fill="url(#${id}-gold)" stroke="#8a6420"/>`).join('')}<rect x="-84" y="-30" width="168" height="80" rx="6" fill="#7a4220" stroke="#3a1e0a" stroke-width="3"/>${[-84, 70].map(rx => `<rect x="${rx}" y="-30" width="14" height="80" fill="url(#${id}-gold)"/>`).join('')}<rect x="-84" y="-30" width="168" height="12" fill="url(#${id}-gold)"/><rect x="-14" y="-8" width="28" height="34" rx="4" fill="url(#${id}-gold)" stroke="#6a4a1a"/><circle cy="6" r="5" fill="#3a1e0a"/></g>`;

  // A bulging money bag.
  K.moneybag = (id, x, y, s = 1) => `<g ${at(x, y, s)} ${sh(id)}><path d="M-20 -50 Q-30 -66 -14 -70 L14 -70 Q30 -66 20 -50 Q70 -20 62 30 Q56 66 0 66 Q-56 66 -62 30 Q-70 -20 -20 -50 Z" fill="#c9a877" stroke="#7a5a2a" stroke-width="2"/><path d="M-22 -50 Q0 -42 22 -50" stroke="#6a4a1a" stroke-width="6" fill="none"/><path d="M-40 -6 Q-50 30 -30 50" stroke="#fff" stroke-opacity=".35" stroke-width="7" fill="none" stroke-linecap="round"/><text y="30" text-anchor="middle" font-family="${SERIF}" font-size="56" fill="#6a4a1a">$</text></g>`;

  // An auctioneer's gavel.
  K.gavel = (id, x, y, s = 1, r = -30) => `<g ${at(x, y, s, r)} ${sh(id)}><rect x="-6" y="-10" width="12" height="110" rx="5" fill="#6a3a1a"/><rect x="-46" y="-40" width="92" height="36" rx="8" fill="#7a4220"/><rect x="-50" y="-44" width="14" height="44" rx="4" fill="url(#${id}-gold)"/><rect x="36" y="-44" width="14" height="44" rx="4" fill="url(#${id}-gold)"/><rect x="-40" y="-36" width="80" height="6" fill="#fff" opacity=".18"/></g>`;

  // A lemon (whole).
  K.lemon = (id, x, y, s = 1, r = 0) => `<g ${at(x, y, s, r)} ${sh(id)}><ellipse rx="40" ry="28" fill="#f2cf2a"/><path d="M-40 0 l-8 -4 l2 8 Z M40 0 l8 -3 l-2 7 Z" fill="#e0b81a"/><ellipse cx="-12" cy="-10" rx="14" ry="6" fill="#fff" opacity=".45"/><path d="M30 -20 q10 -14 22 -10 q-8 10 -22 10 Z" fill="#4a8a2a"/></g>`;

  // A fish.
  K.fish = (id, x, y, s = 1, c = '#e07a3a', flip = false) => `<g ${at(x, y, s)} ${sh(id)}><g transform="scale(${flip ? -1 : 1} 1)"><path d="M-50 0 Q-10 -36 36 -8 L60 -26 L56 0 L60 26 L36 8 Q-10 36 -50 0 Z" fill="${c}"/><path d="M-10 -22 Q0 -36 16 -22 Z" fill="${shade(c, -.25)}"/><path d="M-50 0 Q-10 -36 36 -8" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3"/><circle cx="-34" cy="-4" r="4" fill="#1d1b1a"/><circle cx="-35" cy="-5" r="1.4" fill="#fff"/><path d="M-20 -10 q6 10 0 20" stroke="${shade(c, -.3)}" stroke-width="2" fill="none"/></g></g>`;

  // A wrapped gift box (mystery box).
  K.giftbox = (id, x, y, s = 1, c = '#6a1f5a', o = {}) => `<g ${at(x, y, s, o.rot || 0)} ${sh(id)}><rect x="-50" y="-30" width="100" height="80" fill="${c}"/><rect x="-50" y="-30" width="100" height="80" fill="url(#${id}-card)" opacity=".08"/><rect x="-56" y="-48" width="112" height="22" fill="${shade(c, .12)}"/><rect x="-8" y="-48" width="16" height="98" fill="url(#${id}-gold)"/><rect x="-56" y="-40" width="112" height="0"/><path d="M0 -48 C-30 -84 -48 -60 -24 -50 Z M0 -48 C30 -84 48 -60 24 -50 Z" fill="url(#${id}-gold)" stroke="#6a4a1a"/>${o.q !== false ? `<text y="30" text-anchor="middle" font-family="${SERIF}" font-size="42" fill="#f3e7c0" opacity=".9" x="-26">?</text>` : ''}</g>`;

  // A sheriff's star badge.
  K.star = (id, x, y, s = 1, r = 0) => { const p = Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6 - Math.PI / 2, R = i % 2 ? 26 : 56; return `${(R * Math.cos(a)).toFixed(1)} ${(R * Math.sin(a)).toFixed(1)}`; }).join(' L'); return `<g ${at(x, y, s, r)} ${sh(id)}><path d="M${p} Z" fill="url(#${id}-gold)" stroke="#6a4a1a" stroke-width="2"/>${Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3 - Math.PI / 2; return `<circle cx="${(58 * Math.cos(a)).toFixed(1)}" cy="${(58 * Math.sin(a)).toFixed(1)}" r="7" fill="url(#${id}-gold)" stroke="#6a4a1a"/>`; }).join('')}<circle r="22" fill="none" stroke="#6a4a1a" stroke-width="2"/></g>`; };

  // A bird silhouette perched (raven / vulture / crow). kind: 'raven' | 'vulture'.
  K.bird = (id, x, y, s = 1, kind = 'raven', c = '#14121a', flip = false) => `<g ${at(x, y, s)} ${sh(id)}><g transform="scale(${flip ? -1 : 1} 1)">${kind === 'vulture'
    ? `<path d="M-20 -50 Q-8 -64 6 -56 Q14 -50 8 -40 L22 -34 L10 -32 Q16 -20 14 -6 Q40 4 60 40 L40 34 Q30 44 20 50 L-40 50 Q-60 20 -40 -10 Q-30 -22 -14 -26 Q-24 -36 -20 -50 Z" fill="${c}"/><path d="M-16 -30 Q-4 -22 10 -30 Q4 -18 -14 -18 Z" fill="#e8dcc0"/><circle cx="-4" cy="-50" r="2.4" fill="#ffd36a"/><path d="M-30 50 v12 M0 50 v12" stroke="#7a6a4a" stroke-width="4"/>`
    : `<path d="M-50 20 Q-40 -20 -6 -26 Q2 -46 20 -48 Q34 -48 40 -40 L58 -36 L42 -30 Q44 -10 30 6 Q10 30 -20 32 L-60 50 L-46 30 Z" fill="${c}"/><path d="M-36 4 Q-10 -8 18 4 Q-6 18 -36 4 Z" fill="${shade(c, .18)}"/><circle cx="28" cy="-40" r="3" fill="#e8dcc0"/><path d="M-6 30 v18 M6 28 v20" stroke="#3a3428" stroke-width="3"/>`}</g></g>`;

  // A house (for property games), a tower (for castles).
  K.house = (id, x, y, s = 1, c = '#b8836a', roof = '#5a2a1a') => `<g ${at(x, y, s)} ${sh(id)}><rect x="-44" y="-20" width="88" height="70" fill="${c}"/><path d="M-56 -16 L0 -64 L56 -16 Z" fill="${roof}"/><rect x="24" y="-58" width="12" height="26" fill="${shade(c, -.25)}"/><rect x="-10" y="16" width="20" height="34" fill="${shade(roof, -.2)}"/><rect x="-34" y="-6" width="18" height="16" fill="#ffe8a8"/><rect x="16" y="-6" width="18" height="16" fill="#ffe8a8"/><path d="M-34 2 h18 M-25 -6 v16 M16 2 h18 M25 -6 v16" stroke="${shade(c, -.3)}" stroke-width="2"/></g>`;
  K.tower = (id, x, y, s = 1, c = '#9a8a74') => `<g ${at(x, y, s)} ${sh(id)}><rect x="-34" y="-60" width="68" height="130" fill="${c}"/>${[-34, -14, 6, 26].map(bx => `<rect x="${bx}" y="-76" width="12" height="18" fill="${c}"/>`).join('')}<rect x="-34" y="-60" width="16" height="130" fill="#fff" opacity=".12"/><path d="M-12 70 v-36 a12 12 0 0 1 24 0 v36 Z" fill="#3a2410"/><rect x="-6" y="-34" width="12" height="20" rx="6" fill="#ffd36a"/>${[0, 1, 2, 3, 4].map(i => `<path d="M-34 ${-40 + i * 24} h68" stroke="${shade(c, -.25)}" stroke-width="1.5"/>`).join('')}</g>`;

  // A playing-card-sized "picture card" with a little framed scene inside (for picture games).
  K.picCard = (id, x, y, r, w, h, inner, fill = '#fffaf0') => `<g ${at(x, y, 1, r)} ${sh(id)}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="${fill}"/><g transform="translate(0 0)">${inner}</g></g>`;

  // A simple smiley face (drawn, not an emoji) in any colour.
  K.face = (id, x, y, s = 1, mood = 'smile', c = '#f2c94a') => `<g ${at(x, y, s)} ${sh(id)}><circle r="40" fill="${c}" stroke="${shade(c, -.35)}" stroke-width="2"/><ellipse cx="-14" cy="-10" rx="5" ry="7" fill="#2a2018"/><ellipse cx="14" cy="-10" rx="5" ry="7" fill="#2a2018"/>${mood === 'smile' ? '<path d="M-20 10 Q0 30 20 10" stroke="#2a2018" stroke-width="5" fill="none" stroke-linecap="round"/>' : mood === 'wow' ? '<ellipse cy="16" rx="8" ry="10" fill="#2a2018"/>' : mood === 'sad' ? '<path d="M-18 22 Q0 6 18 22" stroke="#2a2018" stroke-width="5" fill="none" stroke-linecap="round"/>' : '<path d="M-16 16 H16" stroke="#2a2018" stroke-width="5" stroke-linecap="round"/>'}<ellipse cx="-16" cy="-24" rx="12" ry="6" fill="#fff" opacity=".35"/></g>`;

  // A wooden letter tile (bigger and warmer than ltile).
  K.tile = (id, x, y, s, ch, o = {}) => `<g ${at(x, y, 1, o.rot || 0)} ${sh(id)}><rect x="${-s / 2}" y="${-s / 2 + s * .07}" width="${s}" height="${s}" rx="${s * .14}" fill="${o.edge || '#9a7a48'}"/><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * .14}" fill="${o.fill || '#f3e2bc'}"/><rect x="${-s / 2 + 3}" y="${-s / 2 + 3}" width="${s - 6}" height="${s * .3}" rx="${s * .1}" fill="#fff" opacity=".25"/><text y="${s * .23}" text-anchor="middle" font-family="${o.font || SERIF}" font-size="${s * .62}" fill="${o.ink || '#2a2018'}">${ch}</text>${o.pts ? `<text x="${s * .32}" y="${s * .4}" text-anchor="middle" font-family="${UI}" font-weight="800" font-size="${s * .17}" fill="${o.ink || '#2a2018'}">${o.pts}</text>` : ''}</g>`;

  // A chalkboard in a wooden frame.
  K.chalkboard = (id, x, y, w, h, inner = '', r = 0) => `<g ${at(x, y, 1, r)} ${sh(id)}><rect x="${-w / 2 - 12}" y="${-h / 2 - 12}" width="${w + 24}" height="${h + 24}" rx="4" fill="#7a4a22"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#26382e"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#${id}-vig)" opacity=".5"/>${inner}<rect x="${-w / 4}" y="${h / 2 + 4}" width="${w / 2}" height="8" rx="2" fill="#5a3416"/><rect x="${-w / 8}" y="${h / 2}" width="22" height="6" rx="2" fill="#f3ead6"/></g>`;

  // A vintage microphone on a stand.
  K.mic = (id, x, y, s = 1) => `<g ${at(x, y, s)} ${sh(id)}><rect x="-4" y="30" width="8" height="90" fill="url(#${id}-gold)"/><ellipse cx="0" cy="124" rx="40" ry="10" fill="#2a2018"/><path d="M-30 -10 Q-30 30 0 34 Q30 30 30 -10" fill="none" stroke="url(#${id}-gold)" stroke-width="5"/><rect x="-24" y="-64" width="48" height="76" rx="24" fill="#c9ccd2" stroke="#6a7078" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M-22 ${-50 + i * 10} h44" stroke="#6a7078" stroke-width="2"/>`).join('')}<rect x="-26" y="-14" width="52" height="8" rx="3" fill="url(#${id}-gold)"/></g>`;

  // A game-show stage backdrop: a ring of marquee bulbs and searchlight beams.
  K.stage = (id, cols = ['#ffd36a', '#fff3cf']) => `${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M300 -40 L${40 + i * 87} 300 L${84 + i * 87} 300 Z" fill="#fff" opacity=".045"/>`).join('')}<ellipse cx="300" cy="300" rx="280" ry="46" fill="#000" opacity=".3"/>${Array.from({ length: 22 }, (_, i) => `<circle cx="${18 + i * 27.4}" cy="18" r="5.5" fill="${cols[i % 2]}" opacity="${i % 2 ? .95 : .55}" filter="url(#${id}-glow)"/>`).join('')}`;

  // Ornamental laurel sprig (for winners / prestige).
  K.laurel = (id, x, y, s = 1, flip = false) => `<g ${at(x, y, s)}><g transform="scale(${flip ? -1 : 1} 1)"><path d="M0 60 Q-40 20 -20 -60" fill="none" stroke="url(#${id}-gold)" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map(i => { const t = i / 6, px = -40 * t * (1 - t) * 2 - 20 * t * t + 0 * (1 - t) * (1 - t), py = 60 - 120 * t; return `<ellipse cx="${px - 8}" cy="${py}" rx="12" ry="5" fill="url(#${id}-gold)" transform="rotate(-40 ${px - 8} ${py})"/><ellipse cx="${px + 6}" cy="${py - 6}" rx="11" ry="4.5" fill="url(#${id}-gold)" transform="rotate(30 ${px + 6} ${py - 6})"/>`; }).join('')}</g></g>`;

  // Scattered sparkles.
  K.sparkles = (pts, c = '#fff3cf', op = .85) => pts.map(([x, y, s = 1]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -12 Q2 -2 12 0 Q2 2 0 12 Q-2 2 -12 0 Q-2 -2 0 -12 Z" fill="${c}" opacity="${op}"/>`).join('');

  // A felt table surface in perspective, with a gilt rail.
  K.felt = (id, c = '#1e6a3a', y0 = 210) => `<path d="M-40 ${y0} Q300 ${y0 - 40} 640 ${y0} L640 420 L-40 420 Z" fill="${shade(c, -.3)}"/><path d="M-40 ${y0 + 8} Q300 ${y0 - 32} 640 ${y0 + 8} L640 420 L-40 420 Z" fill="${c}"/><path d="M-40 ${y0 + 8} Q300 ${y0 - 32} 640 ${y0 + 8}" fill="none" stroke="url(#${id}-gold)" stroke-width="3" opacity=".8"/>`;
  // A wooden table surface.
  K.wood = (id, y0 = 240, c = '#5a3416') => `<rect x="0" y="${y0}" width="600" height="${400 - y0}" fill="${c}"/>${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${y0 + 8 + i * 18} Q150 ${y0 + 2 + i * 18} 300 ${y0 + 10 + i * 18} T600 ${y0 + 6 + i * 18}" stroke="${shade(c, -.25)}" stroke-width="2" fill="none" opacity=".6"/>`).join('')}<rect x="0" y="${y0}" width="600" height="6" fill="#fff" opacity=".08"/>`;

  return K;
}
