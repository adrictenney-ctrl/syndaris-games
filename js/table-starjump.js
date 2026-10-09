// Star Jump on the table: a six-pointed star of holes on a dark wooden disc, each point tinted
// in the colour of the player who starts there; glass marbles; the last move traced as a line.
import * as J from './starjump.js?v=67';
import { snap } from './cards.js?v=67';
import { centerMsg, clearMsg } from './table-hearts.js?v=67';

let root = null, key = '';
const XY = J.HOLES.map(h => [Math.sqrt(3) * (h.q + h.r / 2), 1.5 * h.r]);

// The board as SVG; `sel` (a hole) and `ok` (reachable holes) for the phone.
export function starSVG(g, { sel = null, ok = [], tap = false, seatColor = s => `var(--seat-${s})` } = {}) {
  const R = 0.62;
  let h = '<circle cx="0" cy="0" r="16.2" fill="url(#sjWood)"/><circle cx="0" cy="0" r="16.2" fill="none" stroke="#c9a35a" stroke-width=".25" opacity=".6"/>';
  // Tint each arm by its owner.
  J.ARMS.forEach((arm, k) => { if (g.order.includes(k)) for (const i of arm) h += `<circle cx="${XY[i][0]}" cy="${XY[i][1]}" r="1.05" style="fill:${seatColor(k)}" opacity=".22"/>`; });
  if (g.last) h += `<polyline points="${g.last.path.map(i => XY[i].join(',')).join(' ')}" fill="none" style="stroke:${seatColor(g.last.seat)}" stroke-width=".28" stroke-dasharray=".6 .4" opacity=".9"/>`;
  J.HOLES.forEach((_, i) => {
    const [x, y] = XY[i], who = g.board[i];
    h += `<circle cx="${x}" cy="${y}" r="${R * .55}" fill="#1a0f08" opacity=".85"/>`;
    if (who != null) h += `<circle cx="${x}" cy="${y + .08}" r="${R}" fill="#000" opacity=".35"/><circle cx="${x}" cy="${y}" r="${R}" style="fill:${seatColor(who)}"/><circle cx="${x - R * .3}" cy="${y - R * .35}" r="${R * .32}" fill="#fff" opacity=".55"/>`;
    if (i === sel) h += `<circle cx="${x}" cy="${y}" r="${R + .18}" fill="none" stroke="#fff" stroke-width=".2"/>`;
    if (ok.includes(i)) h += `<circle cx="${x}" cy="${y}" r="${R * .7}" fill="none" stroke="#ffe08a" stroke-width=".22"/>`;
    if (tap) h += `<circle data-i="${i}" cx="${x}" cy="${y}" r=".86" fill="transparent"/>`;
  });
  return `<svg viewBox="-16.5 -16.5 33 33" class="sj-board"><defs><radialGradient id="sjWood" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#6a4424"/><stop offset="1" stop-color="#3a2210"/></radialGradient></defs>${h}</svg>`;
}

export default {
  defaults: { level: 'normal' },
  settingsHTML: s => `<label>Computer <select data-set="level" data-str="1">${[['easy', 'Easy'], ['normal', 'Normal']].map(([v, t]) => `<option value="${v}" ${v === s.level ? 'selected' : ''}>${t}</option>`).join('')}</select></label><span class="yc-note">Sit anywhere — your marbles start in the point facing you</span>`,
  applySetting(s, k, el) { if (k === 'level') { s.level = el.value; return true; } return false; },
  create: (settings, players) => J.createGame(settings, players),
  act: J.applyAction,
  bot: J.botAction,
  view: J.viewFor,
  turn: g => J.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const home = J.ARMS[J.opposite(s)].filter(i => g.board[i] === s).length;
    return { badges: g.phase === 'over' && g.winner === s ? ['<span class="badge got">🌟 winner</span>'] : [], meta: `<span><b>${home}</b>/10 home</span>`, cards: 0, turn: J.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'starjump'; document.getElementById('center').appendChild(root); }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--B', Math.min(felt.height - v * 12, felt.width - v * 50) + 'px');
    if (g.moveId === key) return;
    if (key !== '') snap(0.4);
    key = g.moveId;
    root.innerHTML = starSVG(g);
    centerMsg(g.phase === 'play' ? `<b>${ctx.nameOf(g.turn)}</b>'s move` : '');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return { key: 'over', html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>All the way across the star</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
