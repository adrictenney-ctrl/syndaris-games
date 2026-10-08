// Race circuits for the racing games: a closed loop through some control points, cut into
// equal spaces. Corners are found from how sharply the road bends, so the rules always match
// the drawing. Pure geometry + SVG; no game rules here.

// Build a circuit with L spaces from control points [[x, y], ...] (a closed loop, viewBox units).
export function makeCircuit(ctrl, L) {
  const n = ctrl.length, dense = [];
  // Catmull-Rom through the control points, sampled densely.
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
    for (let k = 0; k < 60; k++) {
      const t = k / 60, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const cum = [0];
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1], b = dense[i % dense.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[cum.length - 1];
  const at = d => {
    d = ((d % total) + total) % total;
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; }
    const a = dense[lo % dense.length], b = dense[(lo + 1) % dense.length], u = (d - cum[lo]) / ((cum[lo + 1] - cum[lo]) || 1);
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  };
  const step = total / L;
  const pts = Array.from({ length: L }, (_, i) => {
    const [x, y] = at((i + 0.5) * step), [x0, y0] = at(i * step), [x1, y1] = at((i + 1) * step);
    return { x, y, a: Math.atan2(y1 - y0, x1 - x0), x0, y0 };
  });
  // How much the road turns at each space (signed, radians per space).
  const turn = pts.map((_, i) => {
    const a = pts[(i - 1 + L) % L].a, b = pts[(i + 1) % L].a;
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d / 2;
  });
  return { L, pts, turn, step, at };
}

// Group the bendy spaces into corners: [{ from, to, angle (degrees, total), sign }].
export function findCorners(c, minDeg = 7) {
  const L = c.L, bend = c.turn.map(t => Math.abs(t) * 180 / Math.PI >= minDeg);
  // Start the scan on a straight so a corner doesn't wrap around the start.
  let s0 = bend.findIndex(b => !b);
  if (s0 < 0) s0 = 0;
  const out = [];
  let cur = null, gap = 0;
  for (let k = 1; k <= L; k++) {
    const i = (s0 + k) % L;
    if (bend[i]) {
      // A bend the other way (an S) starts a new corner.
      if (cur && gap <= 1 && Math.sign(c.turn[i]) === Math.sign(cur.sum)) { cur.to = i; cur.angle += Math.abs(c.turn[i]); cur.sum += c.turn[i]; }
      else { cur = { from: i, to: i, angle: Math.abs(c.turn[i]), sum: c.turn[i] }; out.push(cur); }
      gap = 0;
    } else gap++;
  }
  return out.map(k => ({ from: k.from, to: k.to, len: ((k.to - k.from + L) % L) + 1, angle: Math.round(k.angle * 180 / Math.PI), sign: Math.sign(k.sum) || 1 }))
    .filter(k => k.angle >= 25);
}

const f2 = v => v.toFixed(2);

// The circuit as SVG. opts: { width, zones: [{ from, to, label, cls }], lines: [{ at, label, cls }],
// cars: [{ pos, lane, color, text, cls }], startAt (space index of the finish line) }
export function circuitSVG(c, opts = {}) {
  const W = opts.width || 11, L = c.L;
  let d = '';
  for (let i = 0; i <= L; i++) { const p = c.pts[i % L]; d += `${i ? 'L' : 'M'}${f2(p.x0)} ${f2(p.y0)} `; }
  d += 'Z';
  let h = `<path d="${d}" class="cc-shadow" stroke-width="${W + 3}"/><path d="${d}" class="cc-edge" stroke-width="${W + 1.2}"/><path d="${d}" class="cc-road" stroke-width="${W}"/>`;
  // A thin line across the road at every space.
  for (let i = 0; i < L; i++) {
    const p = c.pts[i], nx = -Math.sin(p.a), ny = Math.cos(p.a);
    h += `<line x1="${f2(p.x0 + nx * W / 2)}" y1="${f2(p.y0 + ny * W / 2)}" x2="${f2(p.x0 - nx * W / 2)}" y2="${f2(p.y0 - ny * W / 2)}" class="cc-tick"/>`;
  }
  // Corner kerbs on the outside of each bend, with a label on the inside.
  for (const z of opts.zones || []) {
    let kd = '';
    const sgn = z.sign || 1;
    for (let k = 0; k <= z.len; k++) {
      const i = (z.from + k) % L, p = c.pts[i], nx = -Math.sin(p.a), ny = Math.cos(p.a);
      const px = k < z.len ? p.x0 : c.pts[(z.from + z.len) % L].x0, py = k < z.len ? p.y0 : c.pts[(z.from + z.len) % L].y0;
      kd += `${k ? 'L' : 'M'}${f2(px - sgn * nx * (W / 2 + 0.4))} ${f2(py - sgn * ny * (W / 2 + 0.4))} `;
    }
    h += `<path d="${kd}" class="cc-kerb ${z.cls || ''}"/>`;
    if (z.label != null) {
      const m = c.pts[(z.from + Math.floor(z.len / 2)) % L], nx = -Math.sin(m.a), ny = Math.cos(m.a), off = W / 2 + 5.5;
      h += `<g class="cc-badge ${z.cls || ''}" transform="translate(${f2(m.x + sgn * nx * off)} ${f2(m.y + sgn * ny * off)})"><circle r="4.2"/><text y="1.5">${z.label}</text></g>`;
    }
  }
  // Lines across the road (corner speed limits, the finish).
  for (const ln of opts.lines || []) {
    const p = c.pts[ln.at % L], nx = -Math.sin(p.a), ny = Math.cos(p.a);
    h += `<line x1="${f2(p.x0 + nx * W / 2)}" y1="${f2(p.y0 + ny * W / 2)}" x2="${f2(p.x0 - nx * W / 2)}" y2="${f2(p.y0 - ny * W / 2)}" class="cc-line ${ln.cls || ''}"/>`;
    if (ln.label != null) {
      const sgn = ln.sign || 1, off = W / 2 + 5.5;
      h += `<g class="cc-sign ${ln.cls || ''}" transform="translate(${f2(p.x0 + sgn * nx * off)} ${f2(p.y0 + sgn * ny * off)})"><circle r="4.4"/><text y="1.6">${ln.label}</text></g>`;
    }
  }
  // The chequered start/finish line.
  const s = c.pts[(opts.startAt || 0) % L], snx = -Math.sin(s.a), sny = Math.cos(s.a);
  for (let k = 0; k < 6; k++) for (let r = 0; r < 2; r++) {
    const u = -W / 2 + (k + 0.5) * W / 6, along = (r - 0.5) * 1.6;
    const x = s.x0 + snx * u + Math.cos(s.a) * along, y = s.y0 + sny * u + Math.sin(s.a) * along;
    h += `<rect x="${f2(x - 0.8)}" y="${f2(y - 0.8)}" width="1.6" height="1.6" transform="rotate(${f2(s.a * 180 / Math.PI)} ${f2(x)} ${f2(y)})" class="cc-chk ${(k + r) % 2 ? 'b' : 'w'}"/>`;
  }
  // Cars: side by side when they share a space.
  for (const car of opts.cars || []) {
    const i = ((Math.floor(car.pos) % L) + L) % L, p = c.pts[i], nx = -Math.sin(p.a), ny = Math.cos(p.a);
    const off = [0, -1, 1][car.lane || 0] * W * 0.3;
    const x = p.x + nx * off, y = p.y + ny * off;
    h += `<g class="cc-car ${car.cls || ''}" transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(p.a * 180 / Math.PI)})"><rect x="-3.6" y="-1.9" width="7.2" height="3.8" rx="1.3" style="fill:${car.color}"/><rect x="0.8" y="-1.3" width="1.7" height="2.6" rx=".5" class="cc-glass"/>${car.text != null ? `<text y="1" x="-1.1" transform="rotate(${f2(-p.a * 180 / Math.PI)} -1.1 0)">${car.text}</text>` : ''}</g>`;
  }
  return `<svg viewBox="${opts.viewBox || '0 0 200 120'}" class="cc-svg">${h}</svg>`;
}
