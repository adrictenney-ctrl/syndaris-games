// Road Rally on the table: one lane per player across the middle — a little car on a road with
// mile markers, the light it's showing (green, red or a hazard), any speed limit, and its Aces.
import * as R from './roadrally.js?v=65';
import { snap } from './cards.js?v=65';
import { centerMsg, clearMsg } from './table-hearts.js?v=65';

let root = null, key = '';
const K = R.KINDS;
export const rrCard = (k, cls = '') => {
  const c = K[k];
  if (c.t === 'miles') return `<div class="rr-card miles ${cls}"><b>${c.v}</b><small>miles</small></div>`;
  return `<div class="rr-card ${c.t} ${cls}"><b>${c.ic}</b><small>${c.name}</small></div>`;
};
export function status(p) {
  const light = p.battle ? K[p.battle] : null;
  const go = R.rolling(p);
  return `${go ? '<span class="rr-light go">GO</span>' : light && light.t === 'hazard' ? `<span class="rr-light haz">${light.ic} ${light.name}</span>` : '<span class="rr-light stop">needs a Green Light</span>'}${R.limited(p) ? '<span class="rr-light lim">🐢 50</span>' : ''}${p.aces.map(a => `<span class="rr-ace">${K[a].ic}</span>`).join('')}`;
}

export default {
  defaults: { target: 1000, goal: 3000 },
  settingsHTML: s => `<label>Trip <select data-set="target">${[700, 1000].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} miles</option>`).join('')}</select></label>
    <label>Game to <select data-set="goal">${[[1, 'One hand'], [3000, '3000 points'], [5000, '5000 points']].map(([v, t]) => `<option value="${v}" ${v === s.goal ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  create: (settings, players) => R.createGame(settings, players),
  act: R.applyAction,
  bot: R.botAction,
  view: R.viewFor,
  turn: g => R.current(g),
  timer: g => R.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const p = g.p[s], badges = [];
    if (g.phase === 'over' && g.winner === s) badges.push('<span class="badge got">🏆 winner</span>');
    return { badges, meta: `<span><b>${p.miles}</b> mi</span><span><b>${g.scores[s]}</b> pts</span>`, cards: g.hands[s].length, turn: R.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'roadrally'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.moveId, g.phase]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    const T = g.settings.target;
    root.innerHTML = `<div class="rr-lanes">${g.order.map(s => {
      const p = g.p[s];
      return `<div class="rr-lane ${R.current(g) === s ? 'turn' : ''}" style="--c: var(--seat-${s})"><div class="rr-who">${ctx.nameOf(s)}<small>${p.miles} / ${T}</small></div>
        <div class="rr-road">${[0.25, 0.5, 0.75].map(f => `<i style="left:${f * 100}%"><em>${f * T}</em></i>`).join('')}<span class="rr-car" style="left:${(p.miles / T) * 100}%">🚗</span><span class="rr-flag">🏁</span></div>
        <div class="rr-stat">${status(p)}</div></div>`;
    }).join('')}</div><div class="rr-deck"><b>${g.deck.length}</b> cards left${g.discard.length ? ` · last discard ${rrCard(g.discard[g.discard.length - 1], 'tiny')}` : ''}</div>`;
    if (g.phase === 'coup') centerMsg(`<b>${ctx.nameOf(g.coup.target)}</b> can answer with a Counter-Move…`);
    else if (g.phase === 'play') centerMsg(`<b>${ctx.nameOf(g.turn)}</b>'s turn`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'handEnd' && g.phase !== 'over') return null;
    const r = g.result;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: g.phase + g.handNo,
      html: `<h2>${g.phase === 'over' ? `${ctx.nameOf(g.winner)} wins the rally!` : r.finisher != null ? `${ctx.nameOf(r.finisher)} made it!` : 'The road runs out'}</h2>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <span>${r.lines[s].map(([w, v]) => `${w} ${v}`).join(' · ')}</span> <b>${g.scores[s]}</b></li>`).join('')}</ol>
        ${g.phase === 'over' ? '<div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>' : '<p class="hint">Next hand in a moment… <button class="tool" data-do="next">Deal now</button></p>'}`,
      next: () => R.advance(g),
    };
  },
};
