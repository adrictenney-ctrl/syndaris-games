// Seven Spires on the table: the central deck with the war drums and the Boons on offer in the
// middle; a face-up deck between each pair of neighbours; and in front of every player their
// spire rising stage by stage, with what they've collected beneath it.
import * as S from './spires.js?v=67';
import { snap } from './cards.js?v=67';

let root = null, decks = [], spires = {}, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function svCard(c, cls = '') {
  if (!c) return `<div class="sv-card back ${cls}"><i>✦</i></div>`;
  const t = S.typeOf(c), d = S.CARD[t];
  let body = `<i>${d.ic}</i>`;
  if (d.kind === 'banner') body = `<i>${'🚩'.repeat(d.banners)}</i><em>${'🥁'.repeat(d.drums) || '&nbsp;'}</em>`;
  if (d.kind === 'laurel') body = `<i>${d.ic}</i><b>${d.pts}</b>`;
  return `<div class="sv-card k-${d.kind} m-${t} ${cls}">${body}<small>${d.name}</small></div>`;
}

// A player's spire: five tiers, the built ones gilded.
export function spireSVG(stages, color = 'var(--champagne)') {
  const tiers = [[8, 92, 84, 12], [16, 78, 68, 12], [24, 64, 52, 12], [32, 50, 36, 12], [40, 36, 20, 12]];
  return `<svg viewBox="0 0 100 100" class="sv-spire">${tiers.map(([x, y, w, h], i) => `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="1.5" class="${i < stages ? 'on' : ''}" style="${i < stages ? `fill:${color}` : ''}"/>`).join('')}
    <path d="M44 24 L50 6 L56 24 Z" class="${stages >= 5 ? 'on' : ''}" style="${stages >= 5 ? `fill:${color}` : ''}"/></svg>`;
}

// What a player has collected, as small icon counts.
export function tableauHTML(t) {
  const bits = [];
  for (const m of [...S.MATS, 'gold']) if (t.mats[m]) bits.push(`<span>${S.CARD[m].ic}<b>${t.mats[m]}</b></span>`);
  if (t.banners) bits.push(`<span class="ban">🚩<b>${t.banners}</b></span>`);
  for (const k of S.SCI) if (t.sci[k]) bits.push(`<span>${S.CARD[k].ic}<b>${t.sci[k]}</b></span>`);
  if (t.laurels.length) bits.push(`<span>🏛️<b>${t.laurels.reduce((a, x) => a + x, 0)}</b></span>`);
  if (t.wars) bits.push(`<span>⚔️<b>${t.wars}</b></span>`);
  return `<div class="sv-tab">${bits.join('') || '<em>nothing yet</em>'}</div>${t.boons.length ? `<div class="sv-boons">${t.boons.map(b => `<span>${S.BOONS[b].name}</span>`).join('')}</div>` : ''}`;
}

function build() {
  root = document.createElement('div');
  root.id = 'spires';
  root.innerHTML = `<div class="sv-mid"><div class="sv-center"></div><div class="sv-war"></div><div class="sv-offer"></div></div><p class="sv-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">First to finish a spire ends the game</span>',
  create: (settings, players) => S.createGame(settings, players),
  act: S.applyAction,
  bot: S.botAction,
  view: S.viewFor,
  turn: g => S.current(g),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    if (g.owl === seat) badges.push('<span class="badge">🦉 owl</span>');
    if (g.boonFor === seat) badges.push('<span class="badge">choosing a boon</span>');
    return { badges, meta: `<span><b>${S.points(g, seat, g.phase === 'over')}</b> pts</span><span>stage <b>${g.tab[seat].stages}</b>/5</span>`, cards: 0, turn: S.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; decks = []; spires = {}; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin, cw = v * 7.4 * ctx.cardScale;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--sv', cw + 'px');
    const n = g.order.length;
    // The shared decks, each between the two players who can reach it.
    g.decks.forEach((d, i) => {
      let el = decks[i];
      if (!el) { el = decks[i] = document.createElement('div'); el.className = 'sv-side'; root.appendChild(el); }
      let x, y, rot = 0;
      if (n === 2) { x = (i ? 1 : -1) * v * 30; y = 0; }
      else {
        // On an oval around the middle, halfway (by angle) between the two neighbours.
        const a = ctx.inset(g.order[i], 20), b = ctx.inset(g.order[(i + 1) % n], 20);
        const la = Math.hypot(a.x, a.y) || 1, lb = Math.hypot(b.x, b.y) || 1;
        let ux = a.x / la + b.x / lb, uy = a.y / la + b.y / lb;
        if (Math.hypot(ux, uy) < 0.2) { ux = -a.y / la; uy = a.x / la; } // opposite each other
        const ang = Math.atan2(uy, ux);
        x = Math.cos(ang) * v * 38; y = Math.sin(ang) * v * 25;
        rot = ctx.rot(g.order[i]);
      }
      const k = (d.length ? d[d.length - 1] : '-') + d.length + cw;
      if (el.dataset.k !== k) { el.dataset.k = k; el.innerHTML = `${d.length ? svCard(d[d.length - 1], g.lastTake?.deck === i ? '' : '') : '<div class="sv-card gone"></div>'}<small>${d.length}</small>`; }
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rot}deg)`;
    });
    // Each player's spire and collection.
    for (const s of g.order) {
      let el = spires[s];
      if (!el) { el = spires[s] = document.createElement('div'); el.className = 'sv-mine'; root.appendChild(el); }
      const t = g.tab[s];
      const k = JSON.stringify(t) + (g.owl === s);
      if (el.dataset.k !== k) { el.dataset.k = k; el.innerHTML = `${spireSVG(t.stages, `var(--seat-${s})`)}${tableauHTML(t)}`; }
      el.classList.toggle('now', S.current(g) === s);
      const pt = ctx.inset(s, 15);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
    }
    const k = JSON.stringify([g.moveId, g.phase, cw, g.drums]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.querySelector('.sv-center').innerHTML = `${g.center.length ? svCard(null) : '<div class="sv-card gone"></div>'}<small>${g.center.length} · centre</small>`;
    const at = S.drumsForWar(n);
    root.querySelector('.sv-war').innerHTML = `<small>War drums</small><div>${Array.from({ length: at }, (_, i) => `<i class="${i < g.drums ? 'on' : ''}">🥁</i>`).join('')}</div>`;
    root.querySelector('.sv-offer').innerHTML = `<small>Boons</small>${g.boonOffer.map(b => `<div class="sv-boon"><b>${S.BOONS[b].name}</b><span>${S.BOONS[b].text}</span></div>`).join('')}`;
    const who = esc(ctx.nameOf(S.current(g)));
    root.querySelector('.sv-msg').innerHTML = g.phase === 'over' ? '' : g.phase === 'boon' ? `<b>${who}</b> chooses a Boon`
      : `<b>${who}</b> takes a card${g.lastWar && g.lastWar.id >= g.moveId - 1 ? ' · ⚔️ war was just fought' : ''}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => S.points(g, b) - S.points(g, a));
    const done = g.order.find(s => g.tab[s].stages >= 5);
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} win${g.winners.length > 1 ? '' : 's'}</h2><p>${done != null ? `${ctx.nameOf(done)} finished their spire` : 'The decks ran out'}</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${S.points(g, s)}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
