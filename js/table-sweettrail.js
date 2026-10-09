// Sweet Trail on the table: a winding candy path of coloured squares across a pastel meadow,
// treat squares along the way, toffee pits, rainbow sugar bridges and the Candy Castle at the
// end. The last card drawn is shown big.
import * as T from './sweettrail.js?v=66';
import { snap } from './cards.js?v=66';
import { centerMsg, clearMsg } from './table-hearts.js?v=66';

let root = null, key = '';
// Path coordinates: 8 rows of 15, snaking upward from the bottom-left.
export const PT = i => { if (i <= 0) return [-6, 92]; if (i >= T.LEN) return [104, 6]; const r = Math.floor((i - 1) / 15), c = (i - 1) % 15; return [4 + (r % 2 ? 14 - c : c) * 6.6, 92 - r * 12]; };
export function cardHTML(card) {
  if (!card) return '<div class="st-card back">🍬</div>';
  if (card.treat) { const t = T.TREATS.find(x => x.k === card.treat); return `<div class="st-card treat"><b>${t.ic}</b><small>${t.name}</small></div>`; }
  const c = T.COLORS[card.c].c;
  return `<div class="st-card">${Array(card.n).fill(`<i style="background:${c}"></i>`).join('')}</div>`;
}
export function boardSVG(g) {
  let path = '';
  for (let i = 1; i < T.LEN; i++) { const [x, y] = PT(i), [x2, y2] = PT(i + 1); path += `<path d="M${x} ${y} L${x2} ${y2}" stroke="#fff8ea" stroke-width="5.6" stroke-linecap="round"/>`; }
  let h = path;
  for (const [a, b] of Object.entries(T.BRIDGES)) { const [x1, y1] = PT(+a), [x2, y2] = PT(b); h += `<path d="M${x1} ${y1} Q ${(x1 + x2) / 2 + 12} ${(y1 + y2) / 2} ${x2} ${y2}" stroke="url(#stRain)" stroke-width="2.4" fill="none" stroke-dasharray="3 1.2" opacity=".9"/>`; }
  for (let i = 1; i < T.LEN; i++) {
    const [x, y] = PT(i), s = T.SQUARES[i];
    if (typeof s === 'number') h += `<rect x="${x - 2.7}" y="${y - 2.7}" width="5.4" height="5.4" rx="1.2" fill="${T.COLORS[s].c}" stroke="#fff" stroke-width=".4"/>`;
    else if (s === 'toffee') h += `<circle cx="${x}" cy="${y}" r="3.1" fill="#8a5a2a" stroke="#fff" stroke-width=".4"/><text x="${x}" y="${y + 1.3}" text-anchor="middle" font-size="3.6">🍯</text>`;
    else { const t = T.TREATS.find(z => 'treat:' + z.k === s); h += `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#f0a0c0" stroke-width=".8"/><text x="${x}" y="${y + 1.6}" text-anchor="middle" font-size="4.6">${t.ic}</text>`; }
  }
  const [cx, cy] = PT(T.LEN);
  h += `<text x="${cx}" y="${cy + 3}" text-anchor="middle" font-size="11">🏰</text><text x="${PT(0)[0]}" y="${PT(0)[1] + 2}" text-anchor="middle" font-size="6">🚩</text>`;
  const at = {};
  g.order.forEach(s => (at[g.pos[s]] ||= []).push(s));
  for (const [p, ss] of Object.entries(at)) ss.forEach((s, k) => { const [x, y] = PT(+p); h += `<g transform="translate(${x + (k - (ss.length - 1) / 2) * 2.6} ${y - 3})"><path d="M0 2.6 L-1.8 -1 A1.9 1.9 0 1 1 1.8 -1 Z" style="fill:var(--seat-${s})" stroke="#fff" stroke-width=".4"/></g>`; });
  return `<svg viewBox="-12 -2 124 102" class="st-board"><defs><linearGradient id="stRain" x1="0" x2="1"><stop offset="0" stop-color="#ff6a6a"/><stop offset=".33" stop-color="#ffd36a"/><stop offset=".66" stop-color="#6ae08a"/><stop offset="1" stop-color="#6ab0ff"/></linearGradient></defs><rect x="-12" y="-2" width="124" height="102" rx="4" fill="#cdeccf"/>${h}</svg>`;
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">No reading or counting — great for little ones</span>',
  create: (settings, players) => T.createGame(settings, players),
  act: T.applyAction,
  bot: T.botAction,
  view: T.viewFor,
  turn: g => T.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.stuck[s]) badges.push('<span class="badge alone">stuck 🍯</span>');
    if (g.phase === 'over' && g.winner === s) badges.push('<span class="badge got">🏰 winner</span>');
    return { badges, meta: `<span><b>${g.pos[s]}</b> / ${T.LEN}</span>`, cards: 0, turn: T.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'sweettrail'; root.className = 'race-wrap'; document.getElementById('center').appendChild(root); }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--B', Math.min((felt.height - v * 14) * 1.2, felt.width - v * 70) + 'px');
    if (g.moveId === key) return;
    if (key !== '') snap(0.5);
    key = g.moveId;
    root.innerHTML = `<div class="race-board wide">${boardSVG(g)}</div><div class="race-side">${g.last ? `${cardHTML(g.last.card)}<p><b>${ctx.nameOf(g.last.seat)}</b>${g.last.bridge ? ' crossed a bridge!' : ''}</p>` : cardHTML(null)}</div>`;
    centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return { key: 'over', html: `<h2>${ctx.nameOf(g.winner)} reached the Candy Castle! 🏰</h2><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
