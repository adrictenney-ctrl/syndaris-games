// Hog Toss on the table: two little pink pigs land on a straw-coloured mat in whatever pose they
// rolled, with the name of the toss and the turn's running total.
import * as P from './hogtoss.js?v=67';
import { snap } from './cards.js?v=67';
import { centerMsg, clearMsg } from './table-hearts.js?v=67';

let root = null, key = '';
// A pig (side view) in a pose: side, dot (side with its spot showing), back, feet, nose, ear.
export function pigSVG(pose, flip = false) {
  const body = `<ellipse cx="0" cy="0" rx="30" ry="20" fill="#f4a6b4" stroke="#c96a80" stroke-width="2"/>
    <circle cx="27" cy="-8" r="15" fill="#f4a6b4" stroke="#c96a80" stroke-width="2"/>
    <ellipse cx="40" cy="-5" rx="6" ry="7" fill="#f7bcc8" stroke="#c96a80" stroke-width="1.6"/><circle cx="39" cy="-7" r="1.3" fill="#8a3a4a"/><circle cx="42" cy="-4" r="1.3" fill="#8a3a4a"/>
    <path d="M20 -20 L26 -32 L31 -20 Z" fill="#e88aa0" stroke="#c96a80" stroke-width="1.6"/>
    <circle cx="30" cy="-12" r="2" fill="#2a1a1a"/>
    <path d="M-30 -4 q-9 -4 -6 4 q3 6 -4 6" fill="none" stroke="#c96a80" stroke-width="2"/>
    ${[-18, -6, 8, 18].map(x => `<rect x="${x - 3.5}" y="14" width="7" height="12" rx="3" fill="#f4a6b4" stroke="#c96a80" stroke-width="1.6"/>`).join('')}
    ${pose === 'dot' ? '<circle cx="-6" cy="-2" r="7" fill="#3a2020"/>' : ''}`;
  const T = { side: 'rotate(90)', dot: 'rotate(-90)', back: 'rotate(180)', feet: '', nose: 'rotate(55)', ear: 'rotate(-35)' }[pose] || '';
  return `<svg viewBox="-55 -55 110 110" class="hog"><g transform="${flip ? 'scale(-1 1) ' : ''}${T}">${body}</g></svg>`;
}

export default {
  defaults: { target: 100 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[50, 100, 150].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`,
  create: (settings, players) => P.createGame(settings, players),
  act: P.applyAction,
  bot: P.botAction,
  view: P.viewFor,
  turn: g => P.current(g),
  timer: g => P.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    return { badges: g.phase === 'over' && g.winner === s ? ['<span class="badge got">🏆 winner</span>'] : [], meta: `<span><b>${g.scores[s]}</b> / ${g.settings.target}</span>`, cards: 0, turn: P.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'hogtoss'; document.getElementById('center').appendChild(root); }
    const k = g.moveId;
    if (k === key) return;
    if (key !== '' && g.lastToss) snap(0.6);
    key = k;
    const t = g.lastToss;
    root.innerHTML = `<div class="hog-mat ${t ? 'land' : ''}" data-id="${t?.id || 0}">${pigSVG(g.pigs[0])}${pigSVG(g.pigs[1], true)}</div>
      <div class="hog-name ${t && t.kind !== 'ok' ? 'bad' : ''}">${t ? `${t.name}${t.kind === 'ok' ? ` +${t.pts}` : ''}` : 'Toss the pigs!'}</div>
      <div class="hog-turn"><small>This turn</small><b>${g.turnPts}</b></div>`;
    centerMsg(g.phase === 'play' ? `<b>${ctx.nameOf(g.turn)}</b>: toss again or bank` : '');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return { key: 'over', html: `<h2>${ctx.nameOf(g.winner)} wins! 🐖</h2><ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b></li>`).join('')}</ol><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
