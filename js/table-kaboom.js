// Kaboom Critters on the table: the deck (and how many Kaboom!s are still in it), the discard
// pile, and — after every action — a fuse burning down while anyone can shout Nuh-uh!
import * as K from './kaboom.js?v=67';
import { snap } from './cards.js?v=67';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// A card: its critter or item, name and what it does. null = the back.
export function kcCard(c, cls = '') {
  if (!c) return `<div class="kc-card back ${cls}"><b>KABOOM</b><small>critters</small></div>`;
  const t = K.typeOf(c), d = K.CARDS[t];
  return `<div class="kc-card k-${t} ${cls}"><small class="nm">${d.name}</small><i>${d.ic}</i><p>${d.text}</p></div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'kaboom';
  root.innerHTML = `<div class="kc-mid"><div class="kc-deck"></div><div class="kc-disc"></div></div><div class="kc-act"></div><p class="kc-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Last critter-keeper standing wins</span>',
  create: (settings, players) => K.createGame(settings, players),
  act: K.applyAction,
  bot: K.botAction,
  view: K.viewFor,
  turn: g => K.current(g),
  timer: (g, players) => K.tick(g, players),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (!g.alive[seat]) badges.push('<span class="badge lost">kaboom</span>');
    if (g.phase === 'over' && g.winner === seat) badges.push('<span class="badge got">🏆 survivor</span>');
    if (g.phase === 'play' && g.turn === seat && g.turnsLeft > 1) badges.push(`<span class="badge">${g.turnsLeft} turns</span>`);
    if (g.favor?.from === seat) badges.push('<span class="badge">choosing a gift</span>');
    return { badges, meta: `<span><b>${g.hands[seat].length}</b> cards</span>`, cards: 0, turn: g.phase !== 'over' && g.alive[seat] && g.turn === seat, out: !g.alive[seat] };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin, cw = v * 11 * ctx.cardScale;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--kc', cw + 'px');
    const p = g.pending;
    const k = JSON.stringify([g.moveId, cw, g.phase]);
    if (k === key) return;
    if (key) snap(0.35);
    key = k;
    const kb = K.kaboomsLeft(g);
    root.querySelector('.kc-deck').innerHTML = `${kcCard(null)}<small>${g.deck.length} cards · <b>${kb}</b> Kaboom${kb === 1 ? '' : 's'}!</small>`;
    root.querySelector('.kc-disc').innerHTML = g.discard.slice(-3).map((c, i, all) => kcCard(c, i === all.length - 1 && g.moveId ? 'land' : '').replace('class="kc-card', `style="--r:${((g.discard.length - all.length + i) * 41) % 19 - 9}deg" class="kc-card`)).join('') || '<div class="kc-card gone"></div>';
    const act = root.querySelector('.kc-act');
    if (p) {
      const what = p.kind === 'steal' ? `steal from <b>${esc(ctx.nameOf(p.target))}</b>` : p.kind === 'please' ? `<b>${esc(ctx.nameOf(p.target))}</b>, pretty please?` : K.CARDS[p.kind].name;
      act.innerHTML = `<p><b>${esc(ctx.nameOf(p.seat))}</b> · ${what}</p>
        <div class="kc-fuse${p.nopes % 2 ? ' off' : ''}"><i style="animation-duration:${Math.max(200, p.until - Date.now())}ms"></i></div>
        <small>${p.nopes ? (p.nopes % 2 ? `Nuh-uh! ×${p.nopes} · cancelled — unless someone objects` : `Nuh-uh! ×${p.nopes} · back on`) : 'Anyone can say Nuh-uh!'}</small>`;
    } else act.innerHTML = '';
    const msg = root.querySelector('.kc-msg');
    if (g.phase === 'over') msg.innerHTML = `<b>${esc(ctx.nameOf(g.winner))}</b> is the last one standing`;
    else if (g.phase === 'tuck') msg.innerHTML = `<b>${esc(ctx.nameOf(g.turn))}</b> is tucking a Kaboom! back into the deck…`;
    else if (g.favor) msg.innerHTML = `<b>${esc(ctx.nameOf(g.favor.from))}</b> picks a card for ${esc(ctx.nameOf(g.favor.to))}`;
    else msg.innerHTML = `<b>${esc(ctx.nameOf(g.turn))}</b> · play cards, then draw${g.turnsLeft > 1 ? ` · ${g.turnsLeft} turns to go` : ''}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.moveId,
      html: `<h2>${ctx.nameOf(g.winner)} survives!</h2><p>Everyone else went kaboom</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
