// Snakes & Ladders on the table: a hand-painted 10×10 board — cream and sage squares, wooden
// ladders, striped snakes — with everyone's token on it and the last roll's die.
import * as S from './snakes.js?v=66';
import { dieHTML } from './table-yacht.js?v=66';
import { snap } from './cards.js?v=66';
import { centerMsg, clearMsg } from './table-hearts.js?v=66';

let root = null, key = '';
const XY = n => { const [c, r] = S.cell(n); return [c * 10 + 5, (9 - r) * 10 + 5]; };

export function boardSVG(g) {
  let h = '';
  for (let n = 1; n <= 100; n++) {
    const [c, r] = S.cell(n);
    h += `<rect x="${c * 10}" y="${(9 - r) * 10}" width="10" height="10" fill="${(c + r) % 2 ? '#e9dcb8' : '#b8c99a'}"/><text x="${c * 10 + 1.2}" y="${(9 - r) * 10 + 3.2}" font-size="2.6" font-family="Manrope, sans-serif" font-weight="800" fill="#5a4a2a" opacity=".7">${n}</text>`;
  }
  for (const [a, b] of Object.entries(S.LADDERS)) {
    const [x1, y1] = XY(+a), [x2, y2] = XY(b);
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * 1.6, ny = dx / L * 1.6;
    h += `<g stroke="#8a5a2a" stroke-width=".9" stroke-linecap="round"><path d="M${x1 + nx} ${y1 + ny} L${x2 + nx} ${y2 + ny} M${x1 - nx} ${y1 - ny} L${x2 - nx} ${y2 - ny}"/>`;
    for (let t = 0.12; t < 1; t += 0.12) h += `<path d="M${x1 + dx * t + nx} ${y1 + dy * t + ny} L${x1 + dx * t - nx} ${y1 + dy * t - ny}" stroke-width=".55"/>`;
    h += '</g>';
  }
  for (const [a, b] of Object.entries(S.SNAKES)) {
    const [x1, y1] = XY(+a), [x2, y2] = XY(b);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, wob = 6;
    const d = `M${x1} ${y1} C ${mx + wob} ${y1 + (y2 - y1) * .25}, ${mx - wob} ${y1 + (y2 - y1) * .75}, ${x2} ${y2}`;
    h += `<path d="${d}" stroke="#2f6a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#6ab04a" stroke-width="1.6" fill="none" stroke-dasharray="1.6 1.2" stroke-linecap="round"/><circle cx="${x1}" cy="${y1}" r="1.9" fill="#2f6a3a"/><circle cx="${x1 - .6}" cy="${y1 - .5}" r=".35" fill="#fff"/><circle cx="${x1 + .6}" cy="${y1 - .5}" r=".35" fill="#fff"/>`;
  }
  const at = {};
  g.order.forEach(s => { const p = g.pos[s]; if (p) (at[p] ||= []).push(s); });
  for (const [p, ss] of Object.entries(at)) ss.forEach((s, k) => { const [x, y] = XY(+p); const ox = (k - (ss.length - 1) / 2) * 2.4; h += `<circle cx="${x + ox}" cy="${y + 1.5}" r="2.4" style="fill:var(--seat-${s})" stroke="#fff" stroke-width=".5"/>`; });
  return `<svg viewBox="-1 -1 102 102" class="sl-board"><rect x="-1" y="-1" width="102" height="102" rx="2" fill="#6a4424"/>${h}</svg>`;
}

export default {
  defaults: { bounce: true, sixAgain: true },
  settingsHTML: s => `<label><input type="checkbox" data-set="bounce" ${s.bounce ? 'checked' : ''}> Bounce back off 100</label><label><input type="checkbox" data-set="sixAgain" ${s.sixAgain ? 'checked' : ''}> A six rolls again</label>`,
  applySetting(s, k, el) { s[k] = el.checked; return true; },
  create: (settings, players) => S.createGame(settings, players),
  act: S.applyAction,
  bot: S.botAction,
  view: S.viewFor,
  turn: g => S.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    return { badges: g.phase === 'over' && g.winner === s ? ['<span class="badge got">🏆 winner</span>'] : [], meta: `<span>square <b>${g.pos[s] || '—'}</b></span>`, cards: 0, turn: S.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'snakes'; root.className = 'race-wrap'; document.getElementById('center').appendChild(root); }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--B', Math.min(felt.height - v * 14, felt.width - v * 66) + 'px');
    if (g.moveId === key) return;
    if (key !== '') snap(0.5);
    key = g.moveId;
    root.innerHTML = `<div class="race-board">${boardSVG(g)}</div><div class="race-side">${g.last ? `${dieHTML(g.last.d, 'tumble')}<p><b>${ctx.nameOf(g.last.seat)}</b> rolled ${g.last.d}${g.last.via ? `<br>${g.last.via === 'ladder' ? '🪜 up a ladder' : '🐍 down a snake'} to ${g.last.to}` : ''}</p>` : '<p>Roll to start</p>'}</div>`;
    centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return { key: 'over', html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>First to square 100</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
