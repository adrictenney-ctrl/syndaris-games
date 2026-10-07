// Crazy Eights on the table: the stock and the discard pile in the middle, with the suit in
// play printed large beside them (it changes when someone plays an eight).
import * as E from './crazy8.js?v=54';
import { cardEl, snap, SUIT_SYMBOL } from './cards.js?v=54';

let root = null, lastPlay = -1, lastHand = -1;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function build() {
  root = document.createElement('div');
  root.id = 'crazy8';
  root.innerHTML = `<div class="c8-stock"></div><div class="c8-discard"></div><div class="c8-suit"><small>Suit</small><b></b></div><p class="c8-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { target: 100, drawUntil: false },
  settingsHTML: s => `<label>Play to <select data-set="target">${[[0, 'One hand'], [100, '100 points'], [200, '200 points']].map(([v, t]) => `<option value="${v}" ${v === s.target ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-set="drawUntil" ${s.drawUntil ? 'checked' : ''}> Draw until you can play</label>`,

  create: (settings, players) => E.createGame(settings, players),
  act: E.applyAction,
  bot: E.botAction,
  view: E.viewFor,
  turn: g => (g.phase === 'play' ? g.turn : -1),
  timer(g) {
    if (g.phase === 'handOver') return { ms: Math.max(0, g.nextAt - Date.now()) + 20, run: () => E.advance(g) };
    return null;
  },
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const n = g.hands[seat].length;
    const badges = [];
    if (n === 1 && g.phase === 'play') badges.push('<span class="badge alone">last card!</span>');
    if (g.result && g.result.winner === seat) badges.push(`<span class="badge got">+${g.result.won}</span>`);
    return {
      badges,
      meta: `<span><b>${n}</b> card${n === 1 ? '' : 's'}</span>${g.settings.target ? `<span><b>${g.scores[seat]}</b> pts</span>` : ''}`,
      cards: Math.min(n, 12), turn: g.phase === 'play' && g.turn === seat, out: false,
    };
  },

  reset() { root?.remove(); root = null; lastPlay = lastHand = -1; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin, cw = v * 10 * ctx.cardScale;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--cw', cw + 'px');

    const stock = root.querySelector('.c8-stock');
    const sk = String(Math.min(g.stock.length, 6)) + ':' + cw;
    if (stock.dataset.k !== sk) {
      stock.dataset.k = sk;
      stock.innerHTML = '';
      for (let i = 0; i < Math.min(g.stock.length, 6); i++) {
        const c = cardEl(null, true);
        c.style.setProperty('--cw', cw + 'px');
        c.style.transform = `translate(${-i * .6}px, ${-i * .9}px)`;
        stock.appendChild(c);
      }
    }
    stock.dataset.n = g.stock.length;

    const dis = root.querySelector('.c8-discard');
    if (g.playId !== lastPlay || g.hand !== lastHand || !dis.children.length) {
      const fresh = lastPlay !== -1 && g.hand === lastHand;
      dis.innerHTML = '';
      g.discard.slice(-4).forEach((c, i, all) => {
        const el = cardEl(c);
        el.style.setProperty('--cw', cw + 'px');
        const k = g.discard.length - all.length + i;
        el.style.transform = `rotate(${((k * 37) % 21) - 10}deg)`;
        if (fresh && i === all.length - 1) el.classList.add('c8-land');
        dis.appendChild(el);
      });
      if (fresh) snap(0.5);
      lastPlay = g.playId;
      lastHand = g.hand;
    }

    const suit = root.querySelector('.c8-suit');
    suit.className = `c8-suit s-${g.suit}`;
    suit.querySelector('b').textContent = SUIT_SYMBOL[g.suit];
    suit.querySelector('small').textContent = E.top(g)[0] === '8' ? 'Eight called' : 'Suit';

    const msg = root.querySelector('.c8-msg');
    if (g.phase === 'play') msg.innerHTML = `<b>${esc(ctx.nameOf(g.turn))}</b> · match ${E.SUIT_NAME[g.suit].toLowerCase()} or ${E.top(g)[0] === 'T' ? '10' : E.top(g)[0]}s, or play an eight`;
    else if (g.result) msg.innerHTML = `<b>${esc(ctx.nameOf(g.result.winner))}</b> goes out · +${g.result.won} points`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: 'over' + g.hand,
      html: `<h2>${ctx.nameOf(g.result.winner)} wins</h2><p>${g.settings.target ? `${g.scores[g.result.winner]} points` : `Out first · +${g.result.won}`}</p>
        ${g.settings.target ? `<ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b></li>`).join('')}</ol>` : ''}
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
