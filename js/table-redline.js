// Redline on the table: the Redline Ring with a speed-limit sign at every corner line, the
// cars with their gears, and — as each car moves — the cards it played.
import * as R from './redline.js?v=61';
import { circuitSVG } from './circuit.js?v=61';
import { snap } from './cards.js?v=61';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// A card: carbon fibre with a glowing number, a Heat flame, or a Stress hazard.
export function rlCard(c, cls = '') {
  if (!c) return `<div class="rl-card back ${cls}"><b>R</b></div>`;
  const t = R.cardType(c);
  if (t === 'heat') return `<div class="rl-card heat ${cls}"><i>🔥</i><small>Heat</small></div>`;
  if (t === 'stress') return `<div class="rl-card stress ${cls}"><b>?</b><small>Stress</small></div>`;
  return `<div class="rl-card sp v${R.speedOf(c)} ${cls}"><b>${R.speedOf(c)}</b><small>speed</small></div>`;
}

export function trackSVG(g, opts = {}) {
  const lanes = {};
  const cars = g.order.map(s => {
    const c = g.cars[s], k = c.done ? `d${s}` : c.pos;
    lanes[k] = (lanes[k] ?? -1) + 1;
    return { pos: Math.max(c.pos, -2), lane: lanes[k] % 3, color: `var(--seat-${s})`, text: c.gear, cls: opts.highlight === s ? 'me' : '' };
  });
  return circuitSVG(R.CIRCUIT, {
    width: 11,
    lines: R.CORNERS.map(z => ({ at: z.at, label: z.limit, sign: z.sign, cls: `lim l${z.limit}` })),
    cars,
  });
}

function build() {
  root = document.createElement('div');
  root.id = 'redline';
  root.innerHTML = `<div class="rl-track"></div><div class="rl-hud"><p class="rl-round"></p><div class="rl-show"></div><p class="rl-now"></p></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { laps: 2 },
  settingsHTML: s => `<label>Race <select data-set="laps">${[1, 2, 3].map(n => `<option value="${n}" ${n === s.laps ? 'selected' : ''}>${n} lap${n > 1 ? 's' : ''}</option>`).join('')}</select></label>`,
  create: (settings, players) => R.createGame(settings, players),
  act: R.applyAction,
  bot: R.botAction,
  view: R.viewFor,
  turn: () => -1,
  timer: (g, players) => R.tick(g, players),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const c = g.cars[seat], badges = [];
    const p = R.standings(g).indexOf(seat) + 1;
    if (c.done) badges.push(`<span class="badge got">🏁 P${g.finishers.indexOf(seat) + 1}</span>`);
    else if (g.phase === 'plan') badges.push(c.plan ? '<span class="badge got">locked in</span>' : '<span class="badge">planning…</span>');
    if (c.last?.spun && c.last.round === g.round) badges.push('<span class="badge lost">spun out</span>');
    return { badges, meta: `<span><b>P${p}</b> · gear <b>${c.gear}</b></span><span>🔥 <b>${c.engine}</b> in the engine</span>`, cards: 0, turn: g.phase === 'plan' && !c.plan && !c.done, out: false };
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
    const k = JSON.stringify([g.moveId, g.phase, Math.round(W), g.order.map(s => !!g.cars[s].plan)]);
    if (k === key) return;
    if (key && g.phase === 'reveal') snap(0.35);
    key = k;
    root.querySelector('.rl-track').innerHTML = trackSVG(g);
    const leader = R.standings(g)[0];
    root.querySelector('.rl-round').textContent = `Round ${g.round} · lap ${R.lapOf(g, leader)} of ${g.settings.laps}`;
    // Whoever moved most recently (it stays up while everyone plans the next round).
    const movers = g.order.filter(s => g.cars[s].last);
    const lastMover = movers.length ? movers.reduce((a, b) => (g.cars[b].arrive > g.cars[a].arrive ? b : a)) : null;
    const show = root.querySelector('.rl-show');
    if (lastMover != null) {
      const l = g.cars[lastMover].last;
      show.innerHTML = `<div class="rl-played">${l.cards.map(c => rlCard(c)).join('')}${l.flips.length ? `<span class="rl-flip">+${l.flips.filter(R.speedOf).map(R.speedOf).join('+') || 0}</span>` : ''}</div>
        <p><b>${esc(ctx.nameOf(lastMover))}</b> · speed ${l.speed}${l.adrenaline ? ' (adrenaline)' : ''}${l.slip ? ' · slipstream' : ''}${l.heatPaid ? ` · 🔥${l.heatPaid}` : ''}${l.spun ? ' · <em>spun out!</em>' : ''}</p>`;
    } else show.innerHTML = '';
    const waiting = g.order.filter(s => !g.cars[s].done && !g.cars[s].plan);
    root.querySelector('.rl-now').innerHTML = g.phase === 'over' ? 'Race over' : g.phase === 'plan' ? (waiting.length ? `Choosing gears · waiting for ${waiting.map(s => `<b>${esc(ctx.nameOf(s))}</b>`).join(', ')}` : 'Lights out…') : 'Cars move, leader first';
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.moveId,
      html: `<h2>${ctx.nameOf(g.ranking[0])} wins at the Redline Ring</h2><p>${g.settings.laps} lap${g.settings.laps > 1 ? 's' : ''} · ${g.round} rounds</p>
        <ol class="scores">${g.ranking.map((s, i) => `<li>${ctx.nameOf(s)} <b>${g.cars[s].done ? `P${i + 1}` : `${Math.max(0, g.goal - g.cars[s].pos)} to go`}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Race again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
