// Grand Prix Dice on the table: the Monte Vale circuit fills the table — kerbs and a stop count
// on every corner, each car in its driver's colour with its gear on the roof — and the gear
// die rolling in the infield.
import * as G from './grandprix.js?v=65';
import { circuitSVG } from './circuit.js?v=65';
import { snap } from './cards.js?v=65';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const GEAR_COLOR = { 0: '#777', 1: '#e8e2d0', 2: '#e6c25a', 3: '#e08a3c', 4: '#c9473a', 5: '#7b4fa0', 6: '#2f5f9e' };

// The circuit with every car on it. opts.highlight: a seat to ring.
export function trackSVG(g, opts = {}) {
  const lanes = {};
  const cars = g.order.filter(s => !g.cars[s].out).map(s => {
    const c = g.cars[s], k = c.done ? `done${s}` : c.pos;
    lanes[k] = (lanes[k] ?? -1) + 1;
    return { pos: Math.max(c.pos, -2), lane: lanes[k] % 3, color: `var(--seat-${s})`, text: c.gear || '', cls: `${opts.highlight === s ? 'me' : ''}${g.turn === s && g.phase !== 'over' ? ' now' : ''}` };
  });
  return circuitSVG(G.CIRCUIT, {
    width: 11,
    zones: G.CORNERS.map(z => ({ ...z, label: z.stops, cls: `s${z.stops}` })),
    cars,
  });
}

function build() {
  root = document.createElement('div');
  root.id = 'grandprix';
  root.innerHTML = `<div class="gp-track"></div><div class="gp-hud"><div class="gp-die"></div><p class="gp-now"></p><p class="gp-lap"></p></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { laps: 1 },
  settingsHTML: s => `<label>Race <select data-set="laps">${[1, 2, 3].map(n => `<option value="${n}" ${n === s.laps ? 'selected' : ''}>${n} lap${n > 1 ? 's' : ''}</option>`).join('')}</select></label>`,
  create: (settings, players) => G.createGame(settings, players),
  act: G.applyAction,
  bot: G.botAction,
  view: G.viewFor,
  turn: g => G.current(g),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const c = g.cars[seat], badges = [];
    const p = G.standings(g).indexOf(seat) + 1;
    if (c.out) badges.push('<span class="badge lost">crashed</span>');
    else if (c.done) badges.push(`<span class="badge got">🏁 P${g.finishers.indexOf(seat) + 1}</span>`);
    const pips = (k, n) => `<i class="gp-w"><em>${k}</em>${'●'.repeat(Math.max(0, c.wear[k === 'T' ? 'tires' : k === 'B' ? 'brakes' : k === 'G' ? 'gearbox' : 'engine']))}</i>`;
    return { badges, meta: `<span><b>P${p}</b> · gear <b>${c.gear || '–'}</b></span><span class="gp-wear">${pips('T')}${pips('B')}${pips('G')}${pips('E')}</span>`, cards: 0, turn: G.current(g) === seat, out: c.out };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const W = Math.min(felt.width - v * 48, (felt.height - v * 6) * 200 / 120);
    root.style.setProperty('--W', W + 'px');
    root.style.setProperty('--v', v + 'px');
    const k = JSON.stringify([g.moveId, g.phase, Math.round(W)]);
    if (k === key) return;
    if (key && g.last?.id === g.moveId) snap(0.3);
    key = k;
    root.querySelector('.gp-track').innerHTML = trackSVG(g);
    const t = g.turn, c = g.cars[t];
    root.querySelector('.gp-die').innerHTML = g.phase === 'move' && g.roll != null
      ? `<span class="gp-dz" style="--gc:${GEAR_COLOR[c.gear]}"><b>${g.roll}</b><small>gear ${c.gear}</small></span>` : g.phase === 'over' ? '<span class="gp-flag">🏁</span>' : `<span class="gp-dz idle" style="--gc:${GEAR_COLOR[c?.gear || 0]}"><b>${c?.gear || '–'}</b><small>gear</small></span>`;
    root.querySelector('.gp-now').innerHTML = g.phase === 'over' ? 'Race over' : `<b>${esc(ctx.nameOf(t))}</b> ${g.phase === 'gear' ? 'picks a gear' : 'moves'}`;
    const leader = G.standings(g)[0];
    root.querySelector('.gp-lap').textContent = `Lap ${G.lapOf(g, leader)} of ${g.settings.laps} · round ${g.round}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.finishers.length ? `${ctx.nameOf(g.ranking[0])} wins the Grand Prix` : 'Nobody finished'}</h2><p>${g.settings.laps} lap${g.settings.laps > 1 ? 's' : ''} of Monte Vale</p>
        <ol class="scores">${g.ranking.map((s, i) => `<li>${ctx.nameOf(s)} <b>${g.cars[s].out ? 'crashed' : g.cars[s].done ? `P${i + 1}` : `${Math.max(0, g.goal - g.cars[s].pos)} to go`}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Race again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
