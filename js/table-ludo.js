// The race-home games on the table (Ludo, Pop-Up Race, Marble Rush): the track runs round a
// square board; each side has its yard of pieces, its start square (an arrow) and its home lane
// running in to the middle. Pieces are in the owner's seat colour.
import * as H from './racehome.js?v=68';
import { dieHTML } from './table-yacht.js?v=68';
import { snap } from './cards.js?v=68';
import { centerMsg, clearMsg } from './table-hearts.js?v=68';

// Geometry on a 100×100 board.
const IN = 13;
function trackPt(T, n) {
  // n = 0 at the bottom middle; going left, up, right, down.
  const side = 100 - 2 * IN, per = 4 * side;
  let u = ((n / T) * per + side / 2) % per;      // distance from the bottom-right corner, going left
  if (u < side) return [100 - IN - u, 100 - IN];
  u -= side; if (u < side) return [IN, 100 - IN - u];
  u -= side; if (u < side) return [IN + u, IN];
  u -= side; return [100 - IN, IN + u];
}
const rot = (x, y, k) => { for (let i = 0; i < k; i++) [x, y] = [100 - y, x]; return [x, y]; };   // a quarter turn clockwise (screen), per seat
export function pieceXY(g, s, p, i) {
  const T = g.R.track, k = s % 4;
  if (p === -1) return rot(29 + (i % 2) * 5, 90.5 + Math.floor(i / 2) * 5, k);   // the yard, beside the start
  if (p === 'hub') return [50 + (i - 1.5) * 3, 50];
  if (p < T) return trackPt(T, H.startOf(g, s) + p);
  const j = p - T, n = g.R.home;
  const [px, py] = trackPt(T, H.startOf(g, s) - 1);
  const t = (j + 1) / (n + 1.2);
  return [px + (50 - px) * t, py + (50 - py) * t];
}
export function boardSVG(g, { movable = [], you = null, numbers = null } = {}) {
  const T = g.R.track;
  let h = `<rect width="100" height="100" rx="4" fill="#f3ead6"/><rect x="${IN - 3.5}" y="${IN - 3.5}" width="${100 - 2 * IN + 7}" height="${100 - 2 * IN + 7}" rx="3" fill="none" stroke="#c9b48c" stroke-width=".4"/>`;
  const R = Math.min(2.4, 150 / T);
  for (let n = 0; n < T; n++) {
    const [x, y] = trackPt(T, n);
    const safe = g.R.safe.includes(n), corner = g.R.corners?.includes(n);
    const startOf = g.order.find(s => H.startOf(g, s) === n);
    h += `<circle cx="${x}" cy="${y}" r="${R}" fill="${startOf != null ? 'var(--seat-' + startOf + ')' : corner ? '#e8c35a' : '#fffaf0'}" ${startOf != null ? `style="fill:var(--seat-${startOf})"` : ''} stroke="#8a7a5a" stroke-width=".3"/>`;
    if (safe && startOf == null) h += `<text x="${x}" y="${y + 1.2}" text-anchor="middle" font-size="${R * 1.4}" fill="#b8892a">★</text>`;
    if (corner) h += `<text x="${x}" y="${y + 1}" text-anchor="middle" font-size="${R * 1.2}">⚡</text>`;
  }
  // Slides (Pardon Me!): a coloured chute over the track squares.
  for (const sl of g.R.slides || []) {
    const pts = [...Array(sl.len + 1).keys()].map(n => trackPt(T, (sl.from + n) % T));
    h += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" style="stroke:var(--seat-${sl.owner})" stroke-width="${R * 1.1}" stroke-linecap="round" opacity=".45"/><circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="${R * .5}" fill="#fff"/>`;
  }
  for (const s of g.order) {
    for (let j = 0; j < g.R.home; j++) { const [x, y] = pieceXY(g, s, T + j, 0); h += `<circle cx="${x}" cy="${y}" r="${R * .9}" style="fill:var(--seat-${s})" opacity="${j === g.R.home - 1 ? .9 : .35}" stroke="#8a7a5a" stroke-width=".3"/>`; }
    for (let i = 0; i < 4; i++) { const [x, y] = pieceXY(g, s, -1, i); h += `<circle cx="${x}" cy="${y}" r="${R * .9}" fill="none" style="stroke:var(--seat-${s})" stroke-width=".5" opacity=".6"/>`; }
  }
  if (g.R.hub) h += `<circle cx="50" cy="50" r="6" fill="#e8c35a" stroke="#8a6a2a" stroke-width=".5"/><text x="50" y="52" text-anchor="middle" font-size="4">🌀</text>`;
  // Pieces (stacked ones nudge apart).
  const seen = {};
  for (const s of g.order) g.pieces[s].forEach((p, i) => {
    let [x, y] = pieceXY(g, s, p, i);
    const k = `${x.toFixed(1)},${y.toFixed(1)}`;
    const n = (seen[k] = (seen[k] || 0) + 1) - 1;
    x += n * 1.2; y -= n * 1.2;
    const mv = s === you && movable.includes(i);
    h += `<g ${mv ? `data-i="${i}" class="rh-mv"` : ''}><circle cx="${x}" cy="${y + .5}" r="${R * 1.05}" fill="#000" opacity=".3"/><circle cx="${x}" cy="${y}" r="${R * 1.05}" style="fill:var(--seat-${s})" stroke="${mv ? '#fff' : '#2a1a10'}" stroke-width="${mv ? .8 : .35}"/><circle cx="${x - R * .3}" cy="${y - R * .35}" r="${R * .35}" fill="#fff" opacity=".5"/>${numbers === s ? `<text x="${x}" y="${y + R * .45}" text-anchor="middle" font-size="${R * 1.3}" font-family="Manrope, sans-serif" font-weight="800" fill="#fff">${i + 1}</text>` : ""}${mv ? `<circle cx="${x}" cy="${y}" r="${R * 1.9}" fill="transparent"/>` : ''}</g>`;
  });
  return `<svg viewBox="-2 -2 104 104" class="rh-board">${h}</svg>`;
}

export function raceMode(variant, names) {
  let root = null, key = '', lastRoll = -1;
  return {
    defaults: {},
    settingsHTML: () => `<span class="yc-note">${names.note}</span>`,
    create: (settings, players) => H.createGame(settings, players, variant),
    act: H.applyAction,
    bot: H.botAction,
    view: H.viewFor,
    turn: g => H.current(g),
    timer: g => H.tick(g),
    joinMidGame: () => false,
    plate(g, s) {
      if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
      const home = g.pieces[s].filter(p => p === g.R.track + g.R.home - 1).length;
      return { badges: g.phase === 'over' && g.winner === s ? ['<span class="badge got">🏠 winner</span>'] : [], meta: `<span><b>${home}</b>/4 home</span>`, cards: 0, turn: H.current(g) === s, out: false };
    },
    reset() { root?.remove(); root = null; key = ''; lastRoll = -1; clearMsg(); },
    renderCenter(g, ctx) {
      document.getElementById('watermark').textContent = '';
      if (!root) { root = document.createElement('div'); root.id = 'racehome'; root.className = 'race-wrap'; document.getElementById('center').appendChild(root); }
      const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
      root.style.setProperty('--B', Math.min(felt.height - v * 12, felt.width - v * 70) + 'px');
      if (g.moveId === key) return;
      key = g.moveId;
      const fresh = g.rollId !== lastRoll;
      if (fresh && lastRoll !== -1) snap(0.5);
      lastRoll = g.rollId;
      root.innerHTML = `<div class="race-board">${boardSVG(g)}</div><div class="race-side">${g.die ? dieHTML(g.die, fresh ? 'tumble' : '') : ''}<p><b>${ctx.nameOf(g.turn)}</b>${g.phase === 'roll' ? ' to roll' : g.phase === 'move' ? ` rolled ${g.die}` : ''}</p></div>`;
      centerMsg('');
    },
    overlay(g, ctx) {
      if (g.phase !== 'over') return null;
      return { key: 'over', html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>All four pieces home</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
    },
  };
}

export default raceMode('ludo', { note: 'A 6 brings a piece out and rolls again · stars are safe' });
