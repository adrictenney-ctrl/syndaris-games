// Warfront on the table: the island map drawn as hex territories coloured by region, sea lanes
// dashed across the water, and on each territory a token in its owner's colour with the troop
// count. The last battle is marked with an arrow; the dice are shown beside the map.
import * as W from './warfront.js?v=67';
import { snap } from './cards.js?v=67';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const R = 10, HW = Math.sqrt(3) * R;
export const center = t => ({ x: HW * (t.c + 0.5 * (t.r % 2)) + HW / 2 + 2, y: R * 1.5 * t.r + R + 2 });
const hexPath = ({ x, y }) => [...Array(6)].map((_, k) => { const a = (Math.PI / 3) * k - Math.PI / 2; return `${(x + R * Math.cos(a)).toFixed(2)},${(y + R * Math.sin(a)).toFixed(2)}`; }).join(' ');
export const VIEW = `0 0 ${(HW * 10.5 + 4).toFixed(1)} ${(R * 1.5 * 7 + R * 2 + 4).toFixed(1)}`;

// The map as SVG. opts: { sel, targets:Set, names:bool, battle }
export function mapSVG(g, opts = {}) {
  const lanes = W.LANES.map(([a, b]) => { const p = center(W.MAP[a]), q = center(W.MAP[b]); return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" class="wf-lane"/>`; }).join('');
  const hexes = W.MAP.map((t, i) => {
    const p = center(t);
    const cls = ['wf-hex'];
    if (opts.sel === i) cls.push('sel');
    if (opts.targets?.has(i)) cls.push('target');
    return `<g class="${cls.join(' ')}" data-t="${i}"><polygon points="${hexPath(p)}" style="fill:${W.REGIONS[t.region].color}"/>
      <circle cx="${p.x}" cy="${p.y - 1}" r="4.2" style="fill:var(--seat-${g.owner[i]})" class="wf-tok"/><text x="${p.x}" y="${p.y + 0.6}" class="wf-n">${g.armies[i]}</text>
      ${opts.names ? `<text x="${p.x}" y="${p.y + 6.6}" class="wf-name">${esc(t.name)}</text>` : ''}</g>`;
  }).join('');
  let arrow = '';
  if (opts.battle) {
    const p = center(W.MAP[opts.battle.from]), q = center(W.MAP[opts.battle.to]);
    arrow = `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" class="wf-arrow" marker-end="url(#wfHead)"/>`;
  }
  return `<svg viewBox="${VIEW}" class="wf-map"><defs><marker id="wfHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#f1dfb2"/></marker></defs>${lanes}${hexes}${arrow}</svg>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'warfront';
  root.innerHTML = `<div class="wf-board"></div><div class="wf-side"><div class="wf-legend"></div><div class="wf-dice"></div><ul class="wf-log"></ul><p class="wf-now"></p></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { rounds: 0 },
  settingsHTML: s => `<label>Game length <select data-set="rounds">${[[0, 'Until one is left'], [15, '15 rounds'], [25, '25 rounds']].map(([v, t]) => `<option value="${v}" ${v === s.rounds ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  create: (settings, players) => W.createGame(settings, players),
  act: W.applyAction,
  bot: W.botAction,
  view: W.viewFor,
  turn: g => (g.step === 'over' ? -1 : W.current(g)),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const land = g.owner.filter(o => o === seat).length, troops = g.owner.reduce((a, o, i) => a + (o === seat ? g.armies[i] : 0), 0);
    const badges = [];
    if (g.out[seat]) badges.push('<span class="badge off">conquered</span>');
    if (g.cards[seat].length) badges.push(`<span class="badge">${g.cards[seat].length} card${g.cards[seat].length > 1 ? 's' : ''}</span>`);
    return { badges, meta: `<span><b>${land}</b> lands</span><span><b>${troops}</b> troops</span>`, cards: 0, turn: g.step !== 'over' && W.current(g) === seat, out: g.out[seat] };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const H = Math.min(felt.height - v * 30, (felt.width - v * 83) / 1.44);
    root.style.setProperty('--H', H + 'px');
    const k = JSON.stringify([g.owner, g.armies, g.battle?.id, g.step, g.reserve, W.current(g), g.logId, Math.round(H)]);
    if (k === key) return;
    if (key && g.battle && JSON.parse(key)[2] !== g.battle.id) snap(0.6);
    key = k;
    root.querySelector('.wf-board').innerHTML = mapSVG(g, { names: true, battle: g.battle });
    root.querySelector('.wf-legend').innerHTML = W.REGIONS.map((r, k2) => {
      const ts = W.MAP.map((t, i) => (t.region === k2 ? i : -1)).filter(i => i >= 0);
      const holder = g.order.find(s => ts.every(i => g.owner[i] === s));
      return `<span><i style="background:${r.color}"></i>${r.name} <b>+${r.bonus}</b>${holder != null ? ` <em style="color:var(--seat-${holder})">●</em>` : ''}</span>`;
    }).join('');
    const b = g.battle;
    root.querySelector('.wf-dice').innerHTML = b ? `<p>${esc(W.MAP[b.from].name)} → ${esc(W.MAP[b.to].name)}${b.rounds > 1 ? ` · ${b.rounds} rolls` : ''}</p>
      <div><span class="atk">${b.a.map(d => `<i>${d}</i>`).join('')}</span><span class="def">${b.d.map(d => `<i>${d}</i>`).join('')}</span></div><p>Last roll: attacker lost ${b.al}, defender lost ${b.dl}</p>` : '';
    root.querySelector('.wf-log').innerHTML = g.log.slice(-5).map(l => `<li><i style="background:var(--seat-${l.seat})"></i>${esc(ctx.nameOf(l.seat))} ${esc(l.text)}</li>`).join('');
    const s = W.current(g);
    root.querySelector('.wf-now').innerHTML = g.step === 'over' ? '' : `<b>${esc(ctx.nameOf(s))}</b> · ${g.step === 'reinforce' ? `placing ${g.reserve} troops` : g.step === 'attack' ? (g.occupy ? 'moving in' : 'attacking') : 'fortifying'}${g.settings.rounds ? ` · round ${g.round}/${g.settings.rounds}` : ` · round ${g.round}`}`;
  },

  overlay(g, ctx) {
    if (g.step !== 'over') return null;
    return {
      key: 'over' + g.round,
      html: `<h2>${ctx.nameOf(g.winner)} wins the war</h2><p>${g.settings.rounds && g.order.filter(s => !g.out[s]).length > 1 ? 'Most territory when the time ran out' : 'Every territory taken'}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
