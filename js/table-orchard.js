// Orchard on the table: everyone's fruit tree in a ring around a big spinner; picked fruit moves
// into their basket.
import * as O from './orchard.js?v=66';
import { snap } from './cards.js?v=66';
import { centerMsg, clearMsg } from './table-hearts.js?v=66';

let root = null, key = '';
const SPOTS = [[0, -22], [-14, -16], [14, -16], [-20, -4], [20, -4], [-9, -8], [9, -8], [-4, -20], [4, -20], [0, -10]];
export function treeSVG(n, fruit) {
  return `<svg viewBox="-30 -36 60 66" class="oc-tree"><rect x="-4" y="0" width="8" height="24" rx="2" fill="#7a4a24"/><circle cx="0" cy="-12" r="22" fill="#3f8a3a"/><circle cx="-12" cy="-6" r="13" fill="#4a9a44"/><circle cx="12" cy="-6" r="13" fill="#4a9a44"/>
    ${SPOTS.slice(0, n).map(([x, y]) => `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="9">${fruit}</text>`).join('')}
    <path d="M-14 22 Q0 32 14 22 L12 30 Q0 36 -12 30 Z" fill="#c9922a" stroke="#8a5a1a"/><text x="0" y="28.5" text-anchor="middle" font-size="5" font-family="Manrope, sans-serif" font-weight="800" fill="#3a2008">${10 - n}</text></svg>`;
}
export function spinnerSVG(i) {
  const n = O.SPIN.length, seg = 360 / n;
  const cols = ['#f3d67a', '#9ad0f0', '#f0a0b8', '#b8e0a0', '#2a2a2a', '#c9a35a', '#d8443a'];
  let h = '';
  O.SPIN.forEach((s, k) => {
    const a0 = (k * seg - 90) * Math.PI / 180, a1 = ((k + 1) * seg - 90) * Math.PI / 180, am = (a0 + a1) / 2;
    h += `<path d="M0 0 L${Math.cos(a0) * 40} ${Math.sin(a0) * 40} A40 40 0 0 1 ${Math.cos(a1) * 40} ${Math.sin(a1) * 40} Z" fill="${cols[k]}" stroke="#fff" stroke-width=".8"/><text x="${Math.cos(am) * 26}" y="${Math.sin(am) * 26 + 4}" text-anchor="middle" font-size="${s.ic ? 11 : 13}" font-family="DM Serif Display, serif" fill="${k === 4 ? '#fff' : '#2a1a10'}">${s.ic || s.k}</text>`;
  });
  const rot = i == null ? 0 : i * seg + seg / 2;
  return `<svg viewBox="-44 -44 88 88" class="oc-spin">${h}<circle r="40" fill="none" stroke="#5a3a1a" stroke-width="2.5"/><g class="oc-arrow" style="transform: rotate(${rot + 720}deg)"><path d="M0 -34 L4 0 L0 4 L-4 0 Z" fill="#1a1a1a"/></g><circle r="4" fill="#c9a35a"/></svg>`;
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">A first counting game — pick your tree bare to win</span>',
  create: (settings, players) => O.createGame(settings, players),
  act: O.applyAction,
  bot: O.botAction,
  view: O.viewFor,
  turn: g => O.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    return { badges: g.phase === 'over' && g.winner === s ? ['<span class="badge got">🧺 winner</span>'] : [], meta: `<span>${g.fruit[s]} <b>${g.tree[s]}</b> left</span>`, cards: 0, turn: O.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'orchard'; document.getElementById('center').appendChild(root); }
    if (g.moveId === key) return;
    if (key !== '') snap(0.4);
    key = g.moveId;
    let h = `<div class="oc-mid">${spinnerSVG(g.last?.i)}<p>${g.last ? `<b>${ctx.nameOf(g.last.seat)}</b>: ${O.SPIN[g.last.i].label}` : 'Spin to start!'}</p></div>`;
    for (const s of g.order) { const pt = ctx.inset(s, 18); h += `<div class="oc-seat" style="transform: translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ctx.rot(s)}deg)">${treeSVG(g.tree[s], g.fruit[s])}</div>`; }
    root.innerHTML = h;
    centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return { key: 'over', html: `<h2>${ctx.nameOf(g.winner)} picked every ${g.fruit[g.winner]}!</h2><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
