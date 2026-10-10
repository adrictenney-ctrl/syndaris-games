// "Still life" art direction for the covers: real props on a real surface, photographed from
// above at an angle under one warm key light (upper left). Flat things lie in perspective
// (lay), standing things cast soft shadows, the nearest and farthest things are out of focus.
// Every function returns SVG markup; `id` prefixes the defs so covers can share a page.
export function makeStill(K) {
  const { SERIF } = K;
  const DISPLAY = "'Cormorant Garamond', 'DM Serif Display', Georgia, serif";
  const shade = K.shade;
  const T = {};

  // ---------------------------------------------------------------- the set
  // Filters and gradients every still-life cover uses.
  T.defs = id => `<defs>
    <filter id="${id}-cs" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="7" dy="9"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="${id}-cs2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="2" dy="3"/><feComponentTransfer><feFuncA type="linear" slope=".5"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="${id}-b2"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="${id}-b4"><feGaussianBlur stdDeviation="4.5"/></filter>
    <filter id="${id}-b8" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
    <linearGradient id="${id}-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset=".6" stop-color="#f6f0e2"/><stop offset="1" stop-color="#e8dfcb"/></linearGradient>
    <linearGradient id="${id}-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0c0"/><stop offset=".3" stop-color="#d9b25c"/><stop offset=".55" stop-color="#9a7228"/><stop offset=".8" stop-color="#d2aa58"/><stop offset="1" stop-color="#7a5a1e"/></linearGradient>
    <linearGradient id="${id}-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#c9ced6"/><stop offset=".6" stop-color="#7c838e"/><stop offset=".85" stop-color="#d4d8de"/><stop offset="1" stop-color="#6a707a"/></linearGradient>
  </defs>`;

  // A surface seen from above at an angle. kind: wood | felt | leather | marble | linen | slate.
  // The far edge sits at `hz` (the back wall above it falls into shadow); a pool of warm light lands at (lx, ly).
  T.surface = (id, kind = 'wood', o = {}) => {
    const hz = o.hz ?? 70, lx = o.lx ?? 250, ly = o.ly ?? 190;
    const base = o.color || { wood: '#5a3418', felt: '#1f5a36', leather: '#5a1a1e', marble: '#d8d2c6', linen: '#d9cdb4', slate: '#2a2e33' }[kind];
    let tex = '';
    if (kind === 'wood') {
      // planks running away from us, converging on a point far above the frame
      const vp = [300, -900];
      for (let i = -6; i <= 6; i++) { const xb = 300 + i * 120; tex += `<path d="M${xb} 400 L${vp[0] + (xb - vp[0]) * ((hz - vp[1]) / (400 - vp[1]))} ${hz}" stroke="${shade(base, -.45)}" stroke-width="1.6" opacity=".7"/>`; }
      for (let i = 0; i < 26; i++) { const y = hz + 8 + (i * 37) % (400 - hz), x = (i * 131) % 600; tex += `<path d="M${x - 60} ${y} q40 -3 80 0 t80 1" stroke="${shade(base, i % 2 ? -.3 : .12)}" stroke-width="${1 + (i % 3) * .5}" fill="none" opacity=".35"/>`; }
    }
    if (kind === 'marble') for (let i = 0; i < 7; i++) tex += `<path d="M${-40 + i * 110} ${hz} C${i * 110 + 20} ${hz + 120} ${i * 110 - 60} ${hz + 200} ${i * 110 + 40} 400" stroke="#9a948a" stroke-width="${.8 + (i % 3) * .6}" fill="none" opacity=".35"/>`;
    if (kind === 'leather') tex += `<rect x="40" y="${hz + 18}" width="520" height="${400 - hz}" fill="none" stroke="#c9a35a" stroke-width="2" opacity=".55"/><rect x="50" y="${hz + 26}" width="500" height="${400 - hz}" fill="none" stroke="#c9a35a" stroke-width="1" opacity=".4" stroke-dasharray="1 4"/>`;
    if (kind === 'felt' && o.rail !== false) tex += `<path d="M-20 ${hz + 4} Q300 ${hz - 26} 620 ${hz + 4}" stroke="${shade(base, .22)}" stroke-width="2" fill="none" opacity=".5"/>`;
    const wall = o.wall || shade(base, -.82);
    return `<rect width="600" height="400" fill="${wall}"/>
      <rect y="0" width="600" height="${hz + 2}" fill="url(#${id}-wall)"/>
      <defs><linearGradient id="${id}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(wall, -.4)}"/><stop offset="1" stop-color="${shade(wall, .12)}"/></linearGradient>
      <linearGradient id="${id}-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(base, -.45)}"/><stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, -.25)}"/></linearGradient>
      <radialGradient id="${id}-pool" cx="${lx / 6}%" cy="${(ly - hz) / (400 - hz) * 100}%" r="62%"><stop offset="0" stop-color="#fff2d6" stop-opacity="${o.light ?? .34}"/><stop offset=".5" stop-color="#ffe2b0" stop-opacity="${(o.light ?? .34) * .3}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>
      <rect y="${hz}" width="600" height="${400 - hz}" fill="url(#${id}-top)"/>${tex}
      <rect y="${hz}" width="600" height="${400 - hz}" fill="url(#${id}-pool)"/>
      ${kind === 'wood' || kind === 'slate' ? `<rect y="${hz}" width="600" height="3" fill="#fff" opacity=".08"/>` : ''}<!--/surface-->`;
  };

  // Move the camera in: everything after the surface is scaled about (cx, cy).
  T.zoom = (body, z = 1.35, cx = 300, cy = 175, lift = 36) => { const i = body.indexOf('<!--/surface-->'); return i < 0 ? body : body.slice(0, i) + `<g transform="translate(${cx} ${cy - lift}) scale(${z}) translate(${-cx} ${-cy})">${body.slice(i)}</g>`; };

  // Lay something flat on the table (foreshortened), with its shadow falling down and right.
  T.lay = (id, x, y, rot, inner, o = {}) => `<g filter="url(#${id}-${o.thin ? 'cs2' : 'cs'})" ${o.blur ? `opacity="${o.op ?? 1}"` : ''}><g ${o.blur ? `filter="url(#${id}-b${o.blur})"` : ''}><g transform="translate(${x} ${y}) scale(${o.s ?? 1} ${(o.s ?? 1) * (o.tilt ?? .64)}) rotate(${rot})">${inner}</g></g></g>`;
  // Stand something upright on the table (contact shadow under it, cast shadow to the right).
  T.stand = (id, x, y, w, inner, o = {}) => `<g>${o.noShadow ? '' : `<ellipse cx="${x + w * .18}" cy="${y + 2}" rx="${w * .62}" ry="${w * .14}" fill="#000" opacity=".45" filter="url(#${id}-b4)"/>`}<g ${o.blur ? `filter="url(#${id}-b${o.blur})"` : ''}>${inner}</g></g>`;
  // Out-of-focus wrapper.
  T.soft = (id, n, inner) => `<g filter="url(#${id}-b${n})">${inner}</g>`;

  // ---------------------------------------------------------------- suits and playing cards
  const SUITP = {
    H: 'M0 9 C-14 -1 -15 -9 -8.5 -12 C-4.5 -13.8 -1 -11.5 0 -8.5 C1 -11.5 4.5 -13.8 8.5 -12 C15 -9 14 -1 0 9 Z',
    D: 'M0 -12.5 Q4.6 -5.6 9 0 Q4.6 5.6 0 12.5 Q-4.6 5.6 -9 0 Q-4.6 -5.6 0 -12.5 Z',
    S: 'M0 -12.5 C-4.5 -6 -12.5 -2.5 -12.5 3 C-12.5 7.6 -7 9.4 -2.4 6.2 L-4.4 12.5 H4.4 L2.4 6.2 C7 9.4 12.5 7.6 12.5 3 C12.5 -2.5 4.5 -6 0 -12.5 Z',
    C: 'M0 -12.2 A5 5 0 0 1 4.3 -4.8 A5 5 0 1 1 1.6 4 L3.6 12.5 H-3.6 L-1.6 4 A5 5 0 1 1 -4.3 -4.8 A5 5 0 0 1 0 -12.2 Z',
  };
  const RED = '#b0202a', INK = '#16151a';
  const SUIT_OF = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' };
  T.suit = (s, x, y, size, o = {}) => { const k = SUIT_OF[s] || s; return `<path d="${SUITP[k]}" fill="${o.fill || (k === 'H' || k === 'D' ? RED : INK)}" transform="translate(${x} ${y}) scale(${size / 25}) rotate(${o.rot || 0})"/>`; };
  const PIPS = {
    2: [[1, 0], [1, 4]], 3: [[1, 0], [1, 2], [1, 4]], 4: [[0, 0], [2, 0], [0, 4], [2, 4]], 5: [[0, 0], [2, 0], [1, 2], [0, 4], [2, 4]],
    6: [[0, 0], [2, 0], [0, 2], [2, 2], [0, 4], [2, 4]], 7: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [0, 4], [2, 4]],
    8: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [1, 3], [0, 4], [2, 4]], 9: [[0, 0], [2, 0], [0, 4 / 3], [2, 4 / 3], [1, 2], [0, 8 / 3], [2, 8 / 3], [0, 4], [2, 4]],
    10: [[0, 0], [2, 0], [1, 2 / 3], [0, 4 / 3], [2, 4 / 3], [0, 8 / 3], [2, 8 / 3], [1, 10 / 3], [0, 4], [2, 4]],
  };
  // A playing card, centred on (0,0), w wide. Real pip layouts; court cards in a framed monogram.
  T.pcard = (id, rank, s, w = 100, o = {}) => {
    const h = w * 1.4, k = SUIT_OF[s] || s, col = k === 'H' || k === 'D' ? RED : INK, r = String(rank).replace('T', '10');
    const idx = (flip) => `<g transform="${flip ? `rotate(180)` : ''} translate(${-w / 2 + w * .1} ${-h / 2 + w * .17})"><text x="0" y="0" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${w * .2}" fill="${col}">${r}</text>${T.suit(s, 0, w * .13, w * .12)}</g>`;
    let mid = '';
    if (PIPS[r]) {
      const pw = w * .44, ph = h * .58;
      mid = PIPS[r].map(([cx, cy]) => T.suit(s, -pw / 2 + cx * pw / 2, -ph / 2 + cy * ph / 4, w * .19, { rot: cy > 2 ? 180 : 0 })).join('');
    } else if (r === 'A') {
      mid = `<circle r="${w * .26}" fill="none" stroke="${col}" stroke-width=".8" opacity=".35"/>${T.suit(s, 0, 0, w * .42)}`;
    } else if (r) {
      // Court card: a gilt-framed panel with an engraved monogram and the suit.
      const fw = w * .62, fh = h * .66;
      mid = `<rect x="${-fw / 2}" y="${-fh / 2}" width="${fw}" height="${fh}" rx="${w * .03}" fill="${k === 'H' || k === 'D' ? '#f6e6dc' : '#e8e8ee'}" stroke="${col}" stroke-width="${w * .012}"/>
        <rect x="${-fw / 2 + w * .03}" y="${-fh / 2 + w * .03}" width="${fw - w * .06}" height="${fh - w * .06}" fill="none" stroke="url(#${id}-brass)" stroke-width="${w * .012}"/>
        <path d="M${-fw / 2 + w * .03} 0 H${fw / 2 - w * .03}" stroke="${col}" stroke-width=".6" opacity=".4"/>
        <text y="${w * .06}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${w * .44}" fill="${col}">${r}</text>
        <g transform="translate(0 ${-fh / 2 + w * .14})">${{ K: `<path d="M-${w * .1} 0 L-${w * .12} -${w * .09} L-${w * .05} -${w * .04} L0 -${w * .11} L${w * .05} -${w * .04} L${w * .12} -${w * .09} L${w * .1} 0 Z" fill="url(#${id}-brass)"/>`, Q: `<path d="M-${w * .09} 0 Q0 -${w * .14} ${w * .09} 0 Z" fill="url(#${id}-brass)"/><circle cy="-${w * .1}" r="${w * .02}" fill="url(#${id}-brass)"/>`, J: `<path d="M-${w * .08} 0 L0 -${w * .09} L${w * .08} 0 Z" fill="url(#${id}-brass)"/>` }[r] || ''}</g>
        ${T.suit(s, 0, fh / 2 - w * .13, w * .14)}`;
    }
    return `<g transform="rotate(${o.rot || 0})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w * .065}" fill="url(#${id}-paper)" stroke="rgba(0,0,0,.22)" stroke-width=".8"/>${o.back ? '' : `${idx(false)}${idx(true)}${mid}`}</g>`;
  };
  // A card back: a fine engraved lattice inside a gilt border.
  T.pback = (id, w = 100, c = '#6a1a24', o = {}) => {
    const h = w * 1.4, pid = `${id}-lat${c.slice(1)}`;
    return `<g transform="rotate(${o.rot || 0})"><defs><pattern id="${pid}" width="${w * .08}" height="${w * .08}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${w * .08}" height="${w * .08}" fill="${c}"/><path d="M0 0 H${w * .08} M0 0 V${w * .08}" stroke="${shade(c, .35)}" stroke-width="${w * .008}"/></pattern></defs><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w * .065}" fill="#fbf8f0" stroke="rgba(0,0,0,.22)" stroke-width=".8"/><rect x="${-w / 2 + w * .06}" y="${-h / 2 + w * .06}" width="${w * .88}" height="${h - w * .12}" rx="${w * .03}" fill="url(#${pid})"/><rect x="${-w / 2 + w * .1}" y="${-h / 2 + w * .1}" width="${w * .8}" height="${h - w * .2}" rx="${w * .02}" fill="none" stroke="url(#${id}-brass)" stroke-width="${w * .012}"/><ellipse rx="${w * .2}" ry="${w * .26}" fill="${c}" stroke="url(#${id}-brass)" stroke-width="${w * .015}"/><path d="M0 ${-w * .14} L${w * .08} 0 L0 ${w * .14} L${-w * .08} 0 Z" fill="url(#${id}-brass)"/></g>`;
  };
  // A fanned hand of cards lying on the table. cards: [[rank, suit] | 'back']
  T.fan = (id, x, y, cards, o = {}) => {
    const w = o.w || 100, step = o.step ?? 16, n = cards.length;
    const inner = cards.map((c, i) => { const a = (i - (n - 1) / 2) * step; return `<g transform="rotate(${a}) translate(0 ${-w * .5})">${c === 'back' ? T.pback(id, w, o.backColor) : T.pcard(id, c[0], c[1], w)}</g>`; }).join('');
    return T.lay(id, x, y, o.rot || 0, `<g transform="translate(0 ${w * .5})">${inner}</g>`, { tilt: o.tilt, s: o.s, blur: o.blur });
  };

  // ---------------------------------------------------------------- chips, coins, dice
  // A casino chip, top view (lay it to put it on the table).
  T.chipTop = (id, r, c, o = {}) => {
    const edge = o.edge || '#f4eee0';
    return `<circle r="${r}" fill="${c}"/>${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${-r} A${r} ${r} 0 0 1 ${(r * Math.sin(Math.PI / 12)).toFixed(2)} ${(-r * Math.cos(Math.PI / 12)).toFixed(2)} L${(r * .72 * Math.sin(Math.PI / 12)).toFixed(2)} ${(-r * .72 * Math.cos(Math.PI / 12)).toFixed(2)} A${r * .72} ${r * .72} 0 0 0 0 ${-r * .72} Z" fill="${edge}" transform="rotate(${i * 60 - 7.5})"/>`).join('')}<circle r="${r * .62}" fill="${shade(c, .06)}" stroke="${edge}" stroke-width="${r * .03}" stroke-dasharray="${r * .06} ${r * .05}"/><circle r="${r * .5}" fill="${c}"/>${o.label ? `<text y="${r * .17}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${r * .48}" fill="${o.ink || edge}">${o.label}</text>` : ''}<circle r="${r}" fill="url(#${id}-chipsheen)"/><defs><radialGradient id="${id}-chipsheen" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient></defs>`;
  };
  // A stack of chips standing on the table, n high.
  T.chips = (id, x, y, r, n, c, o = {}) => {
    const t = r * .2, ry = r * .5, edge = o.edge || '#f4eee0';
    let h = '';
    for (let i = 0; i < n; i++) {
      const yy = y - i * t;
      h += `<path d="M${x - r} ${yy - ry * .0} v${-t} a${r} ${ry} 0 0 0 ${2 * r} 0 v${t} a${r} ${ry} 0 0 1 ${-2 * r} 0 Z" fill="${shade(c, -.18)}" stroke="${shade(c, -.45)}" stroke-width=".6"/>`;
      for (let k = 0; k < 5; k++) { const ax = x - r + (k + .5) * (2 * r / 5); h += `<rect x="${ax - r * .07}" y="${yy - t + 1}" width="${r * .14}" height="${t - 1.5}" fill="${edge}" opacity="${.9 - Math.abs(k - 2) * .15}"/>`; }
    }
    const top = y - n * t;
    h += `<g transform="translate(${x} ${top}) scale(1 ${ry / r})">${T.chipTop(id, r, c, { label: o.label, edge, ink: o.ink })}</g>`;
    // shading: the side of the stack away from the light falls darker
    h += `<path d="M${x + r * .2} ${y + ry * .9} A${r} ${ry} 0 0 0 ${x + r} ${y} V${top} A${r} ${ry} 0 0 1 ${x + r * .2} ${top + ry * .9} Z" fill="#000" opacity=".22"/>`;
    return T.stand(id, x, y + ry * .7, r * 1.6, h, { blur: o.blur });
  };
  // A coin lying flat.
  T.coinTop = (id, r, o = {}) => `<circle r="${r}" fill="url(#${id}-brass)"/><circle r="${r * .84}" fill="none" stroke="#6a4a14" stroke-width="${r * .04}" opacity=".6"/><circle r="${r * .76}" fill="none" stroke="#fff3c8" stroke-width="${r * .03}" stroke-dasharray="${r * .05} ${r * .06}" opacity=".7"/><text y="${r * .22}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${r * .7}" fill="#6a4a14" opacity=".8">${o.mark ?? ''}</text>`;
  // A die standing on the table (three faces), using the kit's die3 but with a proper shadow.
  T.die = (id, x, y, s, faces, o = {}) => T.stand(id, x, y + 46 * s, 80 * s, K.die3(id, x, y, s, faces, { ...o }).replace(`filter="url(#${id}-sh)"`, ''), { blur: o.blur });

  // ---------------------------------------------------------------- paper goods
  // A sheet of paper / card with content, lying flat.
  T.sheet = (id, w, h, inner = '', o = {}) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${o.r ?? 2}" fill="${o.fill || `url(#${id}-paper)`}" stroke="rgba(0,0,0,.15)" stroke-width=".8"/>${inner}`;
  // Lines of handwriting / print as soft grey strokes.
  T.lines = (x, y, w, n, gap = 12, c = '#6a5a44', o = {}) => Array.from({ length: n }, (_, i) => `<path d="M${x} ${y + i * gap} H${x + w * (o.ragged ? [1, .86, .94, .7, .9, .8][i % 6] : 1)}" stroke="${c}" stroke-width="${o.weight || 2}" stroke-linecap="round" opacity="${o.op ?? .5}"/>`).join('');
  T.word = (txt, x, y, size, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${o.font || DISPLAY}" ${o.italic ? 'font-style="italic"' : ''} font-weight="${o.weight || 600}" font-size="${size}" fill="${o.fill || '#2a2018'}" letter-spacing="${o.ls || 0}">${txt}</text>`;

  // Old kit props carry their own glossy drop shadow; strip it so the still-life light rules.
  T.strip = svg => svg.replace(/ ?filter="url\(#[^)]*-sh\)"/g, '');

  // ---------------------------------------------------------------- boards and pieces
  // An n×n chequered board, centred (lay it).
  T.board = (n, cell, a, b, o = {}) => { let h = `<rect x="${-n * cell / 2 - (o.rim ?? 14)}" y="${-n * cell / 2 - (o.rim ?? 14)}" width="${n * cell + 2 * (o.rim ?? 14)}" height="${n * cell + 2 * (o.rim ?? 14)}" rx="6" fill="${o.frame || '#3a2010'}"/>`; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) h += `<rect x="${-n * cell / 2 + c * cell}" y="${-n * cell / 2 + r * cell}" width="${cell + .3}" height="${cell + .3}" fill="${(r + c) % 2 ? b : a}"/>`; return h + `<rect x="${-n * cell / 2}" y="${-n * cell / 2}" width="${n * cell}" height="${n * cell}" fill="none" stroke="${o.line || '#c9a35a'}" stroke-width="1.5"/>`; };
  // A lined grid board (go, gomoku), centred.
  T.grid = (n, cell, o = {}) => { let h = `<rect x="${-n * cell / 2 - cell * .8}" y="${-n * cell / 2 - cell * .8}" width="${n * cell + cell * 1.6}" height="${n * cell + cell * 1.6}" rx="4" fill="${o.fill || '#d8a860'}"/>`; for (let i = 0; i <= n; i++) h += `<path d="M${-n * cell / 2 + i * cell} ${-n * cell / 2} V${n * cell / 2} M${-n * cell / 2} ${-n * cell / 2 + i * cell} H${n * cell / 2}" stroke="${o.line || '#3a2410'}" stroke-width="1.1" opacity=".8"/>`; return h; };
  // Staunton chess pieces, standing, base at (0,0), ~100 tall. c: 'w' | 'b'.
  const PIECE = {
    p: 'M-22 0 H22 Q24 -6 16 -10 Q12 -14 12 -20 H-12 Q-12 -14 -16 -10 Q-24 -6 -22 0 Z M-10 -20 Q-14 -40 -8 -46 H8 Q14 -40 10 -20 Z M0 -44 A13 13 0 1 1 0.1 -44 Z',
    r: 'M-26 0 H26 Q28 -8 18 -12 L14 -16 V-56 L20 -58 V-74 H11 V-66 H5 V-74 H-5 V-66 H-11 V-74 H-20 V-58 L-14 -56 V-16 L-18 -12 Q-28 -8 -26 0 Z',
    b: 'M-24 0 H24 Q26 -8 16 -12 Q10 -16 10 -24 Q22 -40 14 -62 Q8 -76 0 -84 Q-8 -76 -14 -62 Q-22 -40 -10 -24 Q-10 -16 -16 -12 Q-26 -8 -24 0 Z M0 -84 A6 6 0 1 1 0.1 -84 Z',
    q: 'M-26 0 H26 Q28 -8 18 -12 Q12 -18 12 -30 L22 -86 L10 -70 L6 -92 L0 -72 L-6 -92 L-10 -70 L-22 -86 L-12 -30 Q-12 -18 -18 -12 Q-28 -8 -26 0 Z',
    k: 'M-26 0 H26 Q28 -8 18 -12 Q12 -18 12 -30 L18 -76 Q0 -84 -18 -76 L-12 -30 Q-12 -18 -18 -12 Q-28 -8 -26 0 Z M-4 -80 V-92 H-10 V-98 H-4 V-104 H4 V-98 H10 V-92 H4 V-80 Z',
    n: 'M-26 0 H26 Q28 -8 18 -12 Q14 -16 14 -24 Q22 -50 10 -72 Q2 -84 -10 -84 L-14 -92 L-18 -80 Q-30 -70 -34 -52 Q-34 -44 -26 -44 Q-18 -48 -10 -50 Q-20 -36 -12 -24 Q-12 -16 -18 -12 Q-28 -8 -26 0 Z',
  };
  T.piece = (id, x, y, s, kind, c = 'w', o = {}) => {
    const g = `${id}-pc${c}`;
    const fill = c === 'w' ? ['#fffaf0', '#e6dcc6', '#a89878'] : ['#5a5048', '#2a2420', '#0e0c0a'];
    return T.stand(id, x, y, 48 * s, `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${fill[0]}"/><stop offset=".45" stop-color="${fill[1]}"/><stop offset="1" stop-color="${fill[2]}"/></linearGradient></defs><g transform="translate(${x} ${y}) scale(${s})"><path d="${PIECE[kind]}" fill="url(#${g})" stroke="${c === 'w' ? '#8a7a5a' : '#000'}" stroke-width="1"/><path d="M-14 -14 Q-10 -40 -8 -60" stroke="#fff" stroke-opacity="${c === 'w' ? .6 : .18}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`, { blur: o.blur });
  };
  // A checker / draughts piece standing on the board (a short cylinder), optionally crowned.
  T.checker = (id, x, y, r, c, o = {}) => { const t = r * .26, ry = r * .45; const one = yy => `<path d="M${x - r} ${yy} v${-t} a${r} ${ry} 0 0 0 ${2 * r} 0 v${t} a${r} ${ry} 0 0 1 ${-2 * r} 0 Z" fill="${shade(c, -.25)}"/><ellipse cx="${x}" cy="${yy - t}" rx="${r}" ry="${ry}" fill="${c}"/><ellipse cx="${x}" cy="${yy - t}" rx="${r * .7}" ry="${ry * .7}" fill="none" stroke="${shade(c, .25)}" stroke-width="1.5"/><ellipse cx="${x - r * .3}" cy="${yy - t - ry * .3}" rx="${r * .35}" ry="${ry * .25}" fill="#fff" opacity=".2"/>`; return T.stand(id, x, y + ry * .5, r * 1.7, one(y) + (o.king ? one(y - t) : ''), { blur: o.blur }); };
  // A go stone / reversi disc lying on the board (already foreshortened).
  T.stone = (x, y, r, c, o = {}) => `<g><ellipse cx="${x + r * .25}" cy="${y + r * .3}" rx="${r}" ry="${r * .62}" fill="#000" opacity=".35"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .62}" fill="${c}"/><ellipse cx="${x - r * .3}" cy="${y - r * .2}" rx="${r * .4}" ry="${r * .2}" fill="#fff" opacity="${c === '#f4f0e6' || o.light ? .7 : .25}"/></g>`;
  // A glass marble.
  T.marble = (id, x, y, r, c) => `<g><ellipse cx="${x + r * .5}" cy="${y + r * .8}" rx="${r}" ry="${r * .35}" fill="#000" opacity=".35" filter="url(#${id}-b2)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><path d="M${x - r * .8} ${y} Q${x} ${y - r * .5} ${x + r * .8} ${y + r * .2}" stroke="${shade(c, .5)}" stroke-width="${r * .25}" fill="none" opacity=".6"/><circle cx="${x - r * .35}" cy="${y - r * .4}" r="${r * .22}" fill="#fff" opacity=".85"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${shade(c, -.4)}" stroke-width="1"/></g>`;
  // A turned wooden pawn (board-game token), standing.
  T.pawn = (id, x, y, s, c, o = {}) => T.stand(id, x, y, 40 * s, `<g transform="translate(${x} ${y}) scale(${s})"><defs><linearGradient id="${id}-pw${c.slice(1)}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, .35)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.45)}"/></linearGradient></defs><path d="M-20 0 Q-22 -10 -10 -16 Q-14 -30 -8 -42 A14 14 0 1 1 8 -42 Q14 -30 10 -16 Q22 -10 20 0 Z" fill="url(#${id}-pw${c.slice(1)})"/><ellipse cy="0" rx="20" ry="5" fill="${shade(c, -.4)}"/></g>`, { blur: o.blur });
  // A meeple, standing.
  T.meeple = (id, x, y, s, c, o = {}) => T.stand(id, x, y, 44 * s, `<g transform="translate(${x} ${y}) scale(${s})"><defs><linearGradient id="${id}-mp${c.slice(1)}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c, .3)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.4)}"/></linearGradient></defs><path d="M-24 0 L-12 -24 L-30 -30 Q-34 -40 -24 -42 L-10 -40 Q-14 -60 0 -62 Q14 -60 10 -40 L24 -42 Q34 -40 30 -30 L12 -24 L24 0 H6 L0 -12 L-6 0 Z" fill="url(#${id}-mp${c.slice(1)})" stroke="${shade(c, -.5)}" stroke-width="1"/></g>`, { blur: o.blur });
  // A smartphone lying on the table, its screen showing `screen` (drawn in a 70×140 box centred).
  T.phone = (id, screen, o = {}) => `<rect x="-42" y="-82" width="84" height="164" rx="12" fill="#14141a"/><rect x="-42" y="-82" width="84" height="164" rx="12" fill="none" stroke="#3a3a44" stroke-width="2"/><rect x="-36" y="-72" width="72" height="144" rx="4" fill="${o.bg || '#0e1424'}"/><g>${screen}</g><rect x="-36" y="-72" width="72" height="144" rx="4" fill="url(#${id}-glass2)"/><rect x="-10" y="-79" width="20" height="3" rx="1.5" fill="#2a2a32"/><defs><linearGradient id="${id}-glass2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  // A wooden letter tile lying flat (no shadow of its own; lay adds it).
  T.tile = (ch, s = 40, o = {}) => `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * .1}" fill="${o.edge || '#b8935a'}"/><rect x="${-s / 2 + 1.5}" y="${-s / 2 + 1.5}" width="${s - 3}" height="${s - 3}" rx="${s * .08}" fill="${o.fill || '#f1dfb4'}"/><text y="${s * .22}" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${s * .62}" fill="${o.ink || '#2a2018'}">${ch}</text>${o.pts ? `<text x="${s * .32}" y="${s * .4}" text-anchor="middle" font-family="${K.UI}" font-weight="800" font-size="${s * .17}" fill="${o.ink || '#2a2018'}">${o.pts}</text>` : ''}`;
  // A domino lying flat.
  T.domino = (a, b, s = 40, o = {}) => { const pip = (n, cy) => (({ 0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] })[n] || []).map(([u, v]) => `<circle cx="${u * s * .27}" cy="${cy + v * s * .27}" r="${s * .08}" fill="${o.pip || '#1d1b1a'}"/>`).join(''); return `<rect x="${-s / 2}" y="${-s}" width="${s}" height="${2 * s}" rx="${s * .14}" fill="${o.fill || '#f6f0e2'}" stroke="rgba(0,0,0,.25)"/><path d="M${-s * .36} 0 H${s * .36}" stroke="#8a7a5a" stroke-width="1.5"/><circle r="${s * .06}" fill="url(#${o.id}-brass)"/>${pip(a, -s / 2)}${pip(b, s / 2)}`; };
  // A banknote lying flat.
  T.note = (w, c = '#3a6a4a', denom = '100', o = {}) => `<rect x="${-w / 2}" y="${-w * .22}" width="${w}" height="${w * .44}" rx="2" fill="${shade(c, .55)}"/><rect x="${-w / 2 + 4}" y="${-w * .22 + 4}" width="${w - 8}" height="${w * .44 - 8}" fill="none" stroke="${c}" stroke-width="1.5"/><ellipse rx="${w * .14}" ry="${w * .15}" fill="${shade(c, .3)}" stroke="${c}"/><text x="${-w / 2 + 10}" y="${-w * .22 + 18}" font-family="${DISPLAY}" font-weight="700" font-size="${w * .11}" fill="${c}">${denom}</text><text x="${w / 2 - 10}" y="${w * .22 - 8}" text-anchor="end" font-family="${DISPLAY}" font-weight="700" font-size="${w * .11}" fill="${c}">${denom}</text>`;
  // A notepad with ruled lines (and optional writing).
  T.notepad = (id, w, h, inner = '', o = {}) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="${o.fill || '#fbf8ee'}" stroke="rgba(0,0,0,.15)"/>${Array.from({ length: Math.floor(h / 16) - 1 }, (_, i) => `<path d="M${-w / 2} ${-h / 2 + 24 + i * 16} H${w / 2}" stroke="#a8c0d8" stroke-width="1"/>`).join('')}<path d="M${-w / 2 + 22} ${-h / 2} V${h / 2}" stroke="#d89090" stroke-width="1"/>${o.spiral !== false ? Array.from({ length: Math.floor(w / 18) }, (_, i) => `<ellipse cx="${-w / 2 + 12 + i * 18}" cy="${-h / 2}" rx="4" ry="7" fill="none" stroke="url(#${id}-silver)" stroke-width="2"/>`).join('') : ''}${inner}`;
  // A pencil lying flat (0,0 = middle), length L.
  T.pencilFlat = (L = 160, c = '#d8a830') => `<rect x="${-L / 2}" y="-6" width="${L * .78}" height="12" fill="${c}"/><rect x="${-L / 2}" y="-6" width="${L * .78}" height="4" fill="#fff" opacity=".25"/><rect x="${-L / 2 - 14}" y="-6" width="14" height="12" fill="url(#brassFix)"/><rect x="${-L / 2 - 24}" y="-6" width="11" height="12" rx="3" fill="#d88a8a"/><path d="M${-L / 2 + L * .78} -6 L${L / 2} 0 L${-L / 2 + L * .78} 6 Z" fill="#e8d0a0"/><path d="M${L / 2 - 8} -1.6 L${L / 2} 0 L${L / 2 - 8} 1.6 Z" fill="#2a2018"/>`.replace('url(#brassFix)', '#b8b8c0');
  // A hand-written word in ink.
  T.hand = (txt, x, y, size, c = '#2a2a5a', o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="'Cormorant Garamond', Georgia, serif" font-style="italic" font-weight="600" font-size="${size}" fill="${c}" transform="rotate(${o.rot || 0} ${x} ${y})">${txt}</text>`;

  T.DISPLAY = DISPLAY; T.RED = RED; T.INK = INK;
  return T;
}
