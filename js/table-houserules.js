// House Rules on the table: the rulebook in the middle — the basic rule (draw N, play N) as
// it stands right now, every New Rule in play, and the Goal card(s) big and clear. Each
// player's Keepers (and any Creepers) sit in front of them.
import * as H from './houserules.js?v=59';
import { snap } from './cards.js?v=59';

let root = null, mine = {}, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const KIND = { keeper: 'Keeper', creeper: 'Creeper', goal: 'Goal', rule: 'New Rule', action: 'Action' };

// One card from either deck. deck: 'home' | 'space'. id: the card (null = the back).
export function hrCard(deck, id, cls = '') {
  if (!id) return `<div class="hr-card back d-${deck} ${cls}"><b>House<br>Rules</b>${deck === 'space' ? '<small>Deep Space</small>' : ''}</div>`;
  const cards = H.DECKS[deck].cards, d = cards[H.typeOf(id)];
  let body = '';
  if (d.type === 'keeper' || d.type === 'creeper') body = `<i>${d.ic}</i>`;
  else if (d.type === 'goal') body = Array.isArray(d.needs) ? `<i class="pair">${cards[d.needs[0]].ic}<em>+</em>${cards[d.needs[1]].ic}</i>` : `<p>${d.text}</p>`;
  else body = `<p>${d.text}</p>`;
  return `<div class="hr-card t-${d.type} d-${deck} ${cls}" data-id="${id}"><small>${KIND[d.type]}</small><b>${esc(d.name)}</b>${body}</div>`;
}

export function basicHTML(g) {
  const plays = H.playCount(g);
  return `<span><b>${H.drawCount(g)}</b>draw</span><span><b>${plays >= 99 ? 'all' : plays}</b>play</span>${H.handLimit(g) != null ? `<span><b>${H.handLimit(g)}</b>hand limit</span>` : ''}${H.keeperLimit(g) != null ? `<span><b>${H.keeperLimit(g)}</b>keeper limit</span>` : ''}`;
}

function build() {
  root = document.createElement('div');
  root.id = 'houserules';
  root.innerHTML = `<div class="hr-mid"><div class="hr-pile"></div><div class="hr-goals"></div><div class="hr-book"><div class="hr-basic"></div><div class="hr-rules"></div></div></div><p class="hr-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { deck: 'home' },
  settingsHTML: () => '<span class="yc-note">Start: draw 1, play 1 — the cards change the rest</span>',
  create: (settings, players) => H.createGame(settings, players),
  act: H.applyAction,
  bot: H.botAction,
  view: H.viewFor,
  turn: g => H.current(g),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'over' && g.winner === seat) badges.push('<span class="badge got">🏆 winner</span>');
    if (g.phase === 'play' && g.turn === seat) badges.push(`<span class="badge">played ${g.played}/${H.playCount(g) >= 99 ? 'all' : H.playCount(g)}</span>`);
    if (g.phase === 'limit' && g.limitQ[0].seat === seat) badges.push('<span class="badge">discarding</span>');
    if (g.extra && g.turn === seat) badges.push('<span class="badge">another turn next</span>');
    return { badges, meta: `<span><b>${g.hands[seat].length}</b> in hand</span>`, cards: 0, turn: H.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; mine = {}; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin, cw = v * 11 * ctx.cardScale, deck = g.settings.deck;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--hr', cw + 'px');
    for (const s of g.order) {
      let el = mine[s];
      if (!el) { el = mine[s] = document.createElement('div'); el.className = 'hr-mine'; root.appendChild(el); }
      const k = g.keepers[s].join() + cw;
      if (el.dataset.k !== k) { el.dataset.k = k; el.innerHTML = g.keepers[s].map(c => hrCard(deck, c, 'sm')).join(''); }
      const pt = ctx.inset(s, 17);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
    }
    const k = JSON.stringify([g.moveId, g.phase, cw]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.querySelector('.hr-pile').innerHTML = `${hrCard(deck, null)}<small>${g.deck.length} left</small>`;
    root.querySelector('.hr-goals').innerHTML = g.goals.length ? g.goals.map(c => hrCard(deck, c, 'goal-big')).join('') : `<div class="hr-card none"><b>No Goal yet</b><p>Play a Goal card to set one</p></div>`;
    root.querySelector('.hr-basic').innerHTML = basicHTML(g);
    root.querySelector('.hr-rules').innerHTML = g.rules.map(c => hrCard(deck, c, 'sm')).join('');
    const msg = root.querySelector('.hr-msg'), who = esc(ctx.nameOf(H.current(g)));
    if (g.phase === 'over') msg.innerHTML = '';
    else if (g.phase === 'limit') msg.innerHTML = `<b>${who}</b> must discard ${g.limitQ[0].n} ${g.limitQ[0].what === 'hand' ? 'card' : 'Keeper'}${g.limitQ[0].n > 1 ? 's' : ''}`;
    else if (g.temp) msg.innerHTML = `<b>${who}</b> plays the cards they just drew (${g.temp.left} to go)`;
    else msg.innerHTML = `<b>${who}</b> · ${H.playCount(g) >= 99 ? 'play every card' : `play ${H.playCount(g) - g.played} more`}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const d = H.def(g, g.winGoal);
    return {
      key: 'over' + g.moveId,
      html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>${esc(d.name)}${Array.isArray(d.needs) ? ` · ${d.needs.map(k => H.DECKS[g.settings.deck].cards[k].name).join(' + ')}` : ''}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
