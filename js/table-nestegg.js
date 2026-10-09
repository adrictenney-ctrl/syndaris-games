// Nest Egg on the table: the deck and the discard pile in the middle, each player's stack of
// sets in front of them (only the top set shows — that's the one that can be stolen), and any
// challenge being fought out between the two piles.
import * as N from './nestegg.js?v=66';
import { snap } from './cards.js?v=66';

let root = null, piles = {}, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// A valuables card: the item, its worth and its name. Wilds are metal bars.
export function neCard(c, cls = '') {
  if (!c) return `<div class="ne-card back ${cls}"><i></i></div>`;
  const t = N.typeOf(c), a = N.ASSETS[t];
  if (a.wild) return `<div class="ne-card wild w-${t} ${cls}"><span class="bar"></span><b>${N.money(a.v)}</b><small>${a.name}</small><em>wild</em></div>`;
  return `<div class="ne-card t-${t} ${cls}"><i class="ic">${a.ic}</i><b>${N.money(a.v)}</b><small>${a.name}</small></div>`;
}

// A player's stack: a few card edges for the sets underneath, the top set fanned on top.
export function stackHTML(st) {
  if (!st.sets) return '<div class="ne-stack empty"><small>No sets yet</small></div>';
  const under = Math.min(st.sets - 1, 5);
  return `<div class="ne-stack">${Array.from({ length: under }, (_, i) => `<div class="ne-card back edge" style="--k:${i}"><i></i></div>`).join('')}
    <div class="ne-top">${st.top.cards.map((c, i) => neCard(c, '').replace('class="ne-card', `style="--i:${i}" class="ne-card`)).join('')}</div>
    <small>${st.sets} set${st.sets === 1 ? '' : 's'}${st.sets === 1 ? ' · safe' : ''}</small></div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'nestegg';
  root.innerHTML = `<div class="ne-mid"><div class="ne-deck"></div><div class="ne-disc"></div></div><div class="ne-fight"></div><p class="ne-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Pairs of valuables · steal the top set</span>',
  create: (settings, players) => N.createGame(settings, players),
  act: N.applyAction,
  bot: N.botAction,
  view: N.viewFor,
  turn: g => N.current(g),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 richest</span>');
    if (g.challenge?.defender === seat) badges.push('<span class="badge lost">under challenge</span>');
    if (g.challenge?.attacker === seat) badges.push('<span class="badge">challenging</span>');
    const worth = g.phase === 'over' ? `<span><b>${N.money(N.total(g.stacks[seat]))}</b></span>` : `<span><b>${g.stacks[seat].length}</b> sets</span>`;
    return { badges, meta: `${worth}<span>${g.hands[seat].length} in hand</span>`, cards: g.hands[seat].length, turn: N.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; piles = {}; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin, cw = v * 8.4 * ctx.cardScale;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--ne', cw + 'px');
    // Each player's stack sits in front of them.
    for (const s of g.order) {
      let el = piles[s];
      if (!el) { el = piles[s] = document.createElement('div'); el.className = 'ne-pile'; root.appendChild(el); }
      const st = N.viewFor(g, s).stacks[s];
      const k = JSON.stringify(st) + cw;
      if (el.dataset.k !== k) { el.dataset.k = k; el.innerHTML = stackHTML(st); }
      el.classList.toggle('hot', g.challenge?.defender === s);
      const pt = ctx.inset(s, 25);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
    }
    const k = JSON.stringify([g.moveId, g.deck.length, g.discard.length, cw, g.phase]);
    if (k === key) return;
    if (key) snap(0.35);
    key = k;
    root.querySelector('.ne-deck').innerHTML = g.deck.length ? `${neCard(null)}<small>${g.deck.length}</small>` : '<div class="ne-card gone"></div><small>empty</small>';
    root.querySelector('.ne-disc').innerHTML = g.discard.slice(-3).map((c, i, all) => neCard(c, i === all.length - 1 ? 'ne-land' : '').replace('class="ne-card', `style="--r:${((g.discard.length - all.length + i) * 37) % 17 - 8}deg" class="ne-card`)).join('') || '<div class="ne-card gone"></div>';
    const ch = g.challenge;
    root.querySelector('.ne-fight').innerHTML = ch
      ? `<p><b>${esc(ctx.nameOf(ch.attacker))}</b> challenges <b>${esc(ctx.nameOf(ch.defender))}</b> for the ${N.ASSETS[ch.type].name}s</p><div class="row">${ch.played.map(p => neCard(p.card, p.seat === ch.attacker ? 'atk' : 'def')).join('')}</div>`
      : '';
    const who = esc(ctx.nameOf(g.turn));
    root.querySelector('.ne-msg').innerHTML = g.phase === 'over' ? '' : ch ? `<b>${esc(ctx.nameOf(ch.toMove))}</b> to answer · match it or let it go`
      : `<b>${who}</b> · make a set, challenge, or discard${g.deck.length ? '' : ' · the deck is empty'}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => N.total(g.stacks[b]) - N.total(g.stacks[a]));
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} ${g.winners.length > 1 ? 'are' : 'is'} the richest</h2><p>${N.money(N.total(g.stacks[g.winners[0]]))} nest egg</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${N.money(N.total(g.stacks[s]))}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
