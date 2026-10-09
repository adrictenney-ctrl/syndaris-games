// Pile Up on the table: the draw deck, the growing pile (each card landing a little askew), the
// suit to match, the direction of play — and, when draw cards are stacking, how big the pile
// of punishment has grown.
import * as U from './pileup.js?v=68';
import { snap } from './cards.js?v=68';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const SUIT_COLOR = { e: '#9b3b2e', t: '#2f5a85', m: '#4a7340', g: '#a8802c' };

// The suit's emblem, drawn (no emoji) so every device shows the same thing.
export function suitSVG(s, cls = '') {
  const p = {
    e: '<path d="M50 8 C62 28 80 38 76 62 C73 80 60 92 50 92 C40 92 27 80 24 62 C21 46 34 40 38 26 C44 36 46 44 50 46 C52 34 50 22 50 8 Z"/>',
    t: '<path d="M8 58 C20 40 32 40 42 52 C52 64 62 64 72 52 C80 42 88 42 92 46 L92 70 C82 62 74 74 64 78 C52 84 40 76 32 68 C24 60 16 62 8 70 Z"/><path d="M8 38 C20 22 32 22 42 34 C52 46 62 46 72 34 C80 24 88 24 92 28 L92 40 C82 34 74 44 64 50 C52 56 40 48 32 40 C24 32 16 34 8 44 Z" opacity=".6"/>',
    m: '<path d="M50 92 C50 70 50 50 50 30 M50 60 C38 52 26 54 18 44 C30 36 44 40 50 56 M50 46 C60 34 74 30 84 34 C78 48 62 50 50 58" stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="22" rx="12" ry="16"/>',
    g: '<path d="M50 6 L60 40 L94 50 L60 60 L50 94 L40 60 L6 50 L40 40 Z"/>',
  }[s];
  return `<svg viewBox="0 0 100 100" class="pu-suit ${cls}">${p}</svg>`;
}

// A card face; null = the back.
export function puCard(c, cls = '', style = '') {
  if (!c) return `<div class="pu-card back ${cls}" style="${style}"><b>PILE<br>UP</b></div>`;
  const s = U.suitOf(c), k = U.kindOf(c);
  if (U.isWild(c)) {
    const big = U.KIND[k].short;
    return `<div class="pu-card wild w-${k} ${cls}" style="${style}"><span class="pu-ring">${U.SUITS.map(x => `<i style="background:${SUIT_COLOR[x]}"></i>`).join('')}</span><b>${big}</b><small>${U.KIND[k].name}</small></div>`;
  }
  const big = U.KIND[k] ? U.KIND[k].short : k;
  return `<div class="pu-card s-${s} ${U.KIND[k] ? 'act' : 'num'} ${cls}" style="--sc:${SUIT_COLOR[s]};${style}"><em>${big}</em>${suitSVG(s)}<b>${big}</b><em class="br">${big}</em>${U.KIND[k] ? `<small>${U.KIND[k].name}</small>` : ''}</div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'pileup';
  root.innerHTML = `<div class="pu-mid"><div class="pu-deck"></div><div class="pu-pile"></div><div class="pu-info"></div></div><p class="pu-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { hand: 7 },
  settingsHTML: s => `<label>Cards each <select data-set="hand">${[5, 7, 10].map(n => `<option value="${n}" ${n === s.hand ? 'selected' : ''}>${n}</option>`).join('')}</select></label><span class="yc-note">${U.MERCY} cards and you're out</span>`,
  create: (settings, players) => U.createGame(settings, players),
  act: U.applyAction,
  bot: U.botAction,
  view: U.viewFor,
  turn: g => U.current(g),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.out[seat]) badges.push('<span class="badge lost">knocked out</span>');
    if (g.phase === 'over' && g.winner === seat) badges.push('<span class="badge got">🏆 winner</span>');
    const n = g.hands[seat].length;
    if (!g.out[seat] && n === 1) badges.push('<span class="badge got">last card!</span>');
    if (!g.out[seat] && n >= 18) badges.push(`<span class="badge lost">${U.MERCY - n} from out</span>`);
    return { badges, meta: `<span><b>${n}</b> cards</span>`, cards: 0, turn: U.current(g) === seat, out: g.out[seat] };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin, cw = v * 10 * ctx.cardScale;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--pu', cw + 'px');
    const k = JSON.stringify([g.moveId, g.phase, cw]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.querySelector('.pu-deck').innerHTML = `${puCard(null)}<small>${g.deck.length}</small>`;
    root.querySelector('.pu-pile').innerHTML = g.pile.slice(-4).map((c, i, all) => {
      const n = g.pile.length - all.length + i;
      return puCard(c, i === all.length - 1 ? 'land' : '', `--r:${(n * 47) % 23 - 11}deg`);
    }).join('');
    const C = g.color;
    root.querySelector('.pu-info').innerHTML = `<div class="pu-color" style="--sc:${SUIT_COLOR[C]}">${suitSVG(C)}<span>${U.SUIT[C].name}</span></div>
      <div class="pu-dir ${g.dir > 0 ? 'cw' : 'ccw'}"><svg viewBox="0 0 100 100"><path d="M50 12 A38 38 0 1 1 14 62" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M4 50 L14 70 L28 54 Z" fill="currentColor"/></svg></div>
      ${g.stack ? `<div class="pu-stack"><b>+${g.stack}</b><small>${esc(ctx.nameOf(g.turn))} must answer with +${g.stackMin} or bigger</small></div>` : ''}`;
    const msg = root.querySelector('.pu-msg');
    if (g.phase === 'over') msg.innerHTML = '';
    else if (g.choice?.kind === 'swap') msg.innerHTML = `<b>${esc(ctx.nameOf(g.choice.seat))}</b> picks someone to swap hands with`;
    else if (g.choice) msg.innerHTML = `<b>${esc(ctx.nameOf(g.choice.seat))}</b> names a suit for the Roulette…`;
    else msg.innerHTML = `<b>${esc(ctx.nameOf(g.turn))}</b> · ${g.stack ? `answer the +${g.stack} or take it` : g.drew ? 'play the card you drew, or pass' : 'match the suit or the symbol'}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = U.alive(g).sort((a, b) => g.hands[a].length - g.hands[b].length);
    return {
      key: 'over' + g.moveId,
      html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>${g.hands[g.winner].length ? 'Last one standing' : 'Out of cards first'}</p>
        <ol class="scores">${[...order, ...g.order.filter(s => g.out[s])].map(s => `<li>${ctx.nameOf(s)} <b>${g.out[s] ? 'out' : g.hands[s].length}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
