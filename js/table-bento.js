// Bento Box on the table: each player's lunch spread out in front of them (cards grouped by
// kind), who has picked this turn, and the scores after each round.
import * as B from './bento.js?v=64';
import { snap } from './cards.js?v=64';
import { centerMsg, clearMsg } from './table-hearts.js?v=64';

let root = null, key = '';
export const bnCard = (k, cls = '', extra = '') => { const c = B.CARDS[k]; return `<div class="bn-card ${cls}" style="--c:${c.col}"><small>${c.name}</small><b>${c.ic}${c.lan > 1 ? `<sup>×${c.lan}</sup>` : ''}</b><em>${c.tip}</em>${extra}</div>`; };

// Played cards grouped by kind, as small stacked chips.
export function spread(played) {
  const groups = [];
  for (const p of played) {
    let g = groups.find(x => x.k === p.k && !B.CARDS[p.k].bowl);
    if (!g) groups.push(g = { k: p.k, n: 0, on: p.on });
    g.n++;
  }
  return groups.map(x => `<span class="bn-chip ${x.on ? 'soy' : ''}" style="--c:${B.CARDS[x.k].col}">${B.CARDS[x.k].ic}${B.CARDS[x.k].lan > 1 ? `<sup>${B.CARDS[x.k].lan}</sup>` : ''}${x.n > 1 ? `<b>×${x.n}</b>` : ''}</span>`).join('');
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Three rounds · pick a card, pass the rest to the left</span>',
  create: (settings, players) => B.createGame(settings, players),
  act: B.applyAction,
  bot: B.botAction,
  view: B.viewFor,
  turn: () => -1,
  timer: (g, players) => B.tick(g, players),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'pick') badges.push(g.picks[s] ? '<span class="badge got">picked</span>' : '<span class="badge">choosing…</span>');
    if (g.phase === 'over' && g.winners.includes(s)) badges.push('<span class="badge got">🏆 winner</span>');
    return { badges, meta: `<span><b>${g.scores[s]}</b> pts</span><span>🍡 <b>${g.mochi[s] + (g.phase === 'over' ? 0 : g.played[s].filter(p => p.k === 'mochi').length)}</b></span>`, cards: 0, turn: g.phase === 'pick' && !g.picks[s], out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'bento'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.moveId, g.phase, ctx.upright, Math.round(ctx.vmin)]);
    if (k === key) return;
    if (key && g.phase !== 'pick') snap(0.3);
    key = k;
    let h = `<div class="bn-round">Round <b>${g.round}</b> of 3</div>`;
    for (const s of g.order) {
      const pt = ctx.inset(s, 17);
      const line = g.result?.lines[s];
      h += `<div class="bn-tray" style="transform: translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ctx.rot(s)}deg)">${spread(g.played[s]) || '<i>empty tray</i>'}${line ? `<div class="bn-sum">+${line.total}</div>` : ''}</div>`;
    }
    root.innerHTML = h;
    if (g.phase === 'pick') centerMsg(`Everyone picks a card · ${g.order.filter(s => g.picks[s]).length}/${g.order.length} ready`);
    else if (g.phase === 'roundEnd') centerMsg('Round scored · next round in a moment');
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: 'over',
      html: `<h2>${g.winners.map(ctx.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}!</h2><p>After three rounds, with mochi: most +6, fewest −6</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <span>🍡${g.mochi[s]} ${g.mochiBonus[s] > 0 ? '+' : ''}${g.mochiBonus[s] || ''}</span> <b>${g.scores[s]}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
