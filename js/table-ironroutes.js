// Iron Routes on the table: the country map with every route drawn as a row of coloured car
// spaces (double routes side by side); claimed routes fill with the owner's trains. Beside the
// map: the five face-up rail cards, the deck, and the latest claims.
import * as I from './ironroutes.js?v=68';
import { snap } from './cards.js?v=68';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const railCard = (c, cls = '') => `<span class="ir-card ${cls}" style="--k:${I.HEX[c]}">${c === 'loco' ? '<i>⚙</i>Engine' : c}</span>`;

// The map. opts: { hi: Set of city indexes to highlight, mine: seat to emphasise }
export function mapSVG(g, opts = {}) {
  const cars = I.ROUTES.map((r, k) => {
    const A = I.CITIES[r.a], B = I.CITIES[r.b];
    let dx = B.x - A.x, dy = B.y - A.y;
    const L = Math.hypot(dx, dy); dx /= L; dy /= L;
    const off = r.twin != null ? (k < r.twin ? 0.9 : -0.9) : 0;
    const ox = -dy * off, oy = dx * off;
    const start = 2.4, usable = L - 4.8, gap = 0.5, len = (usable - gap * (r.len - 1)) / r.len;
    const own = g.owner[k];
    let h = '';
    for (let i = 0; i < r.len; i++) {
      const s = start + i * (len + gap), e = s + len;
      h += `<line x1="${(A.x + dx * s + ox).toFixed(2)}" y1="${(A.y + dy * s + oy).toFixed(2)}" x2="${(A.x + dx * e + ox).toFixed(2)}" y2="${(A.y + dy * e + oy).toFixed(2)}" class="ir-car${own != null ? ' own' : ''}" style="stroke:${own != null ? `var(--seat-${own})` : I.HEX[r.color]}"/>`;
    }
    return `<g class="ir-route${own != null && own === opts.mine ? ' mine' : ''}">${h}</g>`;
  }).join('');
  const cities = I.CITIES.map((c, i) => `<g class="ir-city${opts.hi?.has(i) ? ' hi' : ''}"><circle cx="${c.x}" cy="${c.y}" r="1.5"/><text x="${c.x}" y="${c.y + (c.y > 50 ? 3.8 : -2.4)}">${esc(c.name)}</text></g>`).join('');
  return `<svg viewBox="-3 -2 106 66" class="ir-map">${cars}${cities}</svg>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'ironroutes';
  root.innerHTML = `<div class="ir-board"></div><div class="ir-side"><div class="ir-market"></div><p class="ir-deck"></p><ul class="ir-log"></ul><p class="ir-now"></p></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { trains: 40 },
  settingsHTML: () => '<span class="yc-note">40 trains each · longest line earns 10</span>',
  create: (settings, players) => I.createGame(settings, players),
  act: I.applyAction,
  bot: I.botAction,
  view: I.viewFor,
  turn: g => (g.phase === 'play' ? I.current(g) : -1),
  // Opening tickets are chosen by everyone at once; bots pick theirs straight away.
  timer(g, players) {
    if (g.phase !== 'tickets') return null;
    const b = g.order.find(s => players[s]?.bot && g.offer[s]);
    return b != null ? { ms: 600, run: () => I.applyAction(g, b, I.botAction(g, b)) } : null;
  },
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.offer[seat]) badges.push('<span class="badge">choosing tickets</span>');
    if (g.lastRound === seat) badges.push('<span class="badge alone">last round!</span>');
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    const cards = Object.values(g.hands[seat]).reduce((a, b) => a + b, 0);
    return { badges, meta: `<span><b>${g.trains[seat]}</b> trains</span><span><b>${g.points[seat]}</b> pts</span><span><b>${cards}</b> cards · ${g.tickets[seat].length} tickets</span>`, cards: 0, turn: g.phase === 'play' && I.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const H = Math.min(felt.height - v * 32, (felt.width - v * 82) / 1.62);
    root.style.setProperty('--H', H + 'px');
    const k = JSON.stringify([g.owner, g.market, g.moveId, I.current(g), g.phase, g.drew, Math.round(H)]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.querySelector('.ir-board').innerHTML = mapSVG(g);
    root.querySelector('.ir-market').innerHTML = g.market.map(c => railCard(c)).join('');
    root.querySelector('.ir-deck').innerHTML = `Deck <b>${g.deck.length + g.discard.length}</b> · tickets <b>${g.ticketDeck.length}</b>`;
    root.querySelector('.ir-log').innerHTML = g.log.slice(-5).map(l => `<li><i style="background:var(--seat-${l.seat})"></i>${esc(ctx.nameOf(l.seat))} · ${esc(l.text)}</li>`).join('');
    const s = I.current(g);
    root.querySelector('.ir-now').innerHTML = g.phase === 'tickets' ? 'Everyone is choosing destination tickets…' : g.phase === 'over' ? ''
      : `<b>${esc(ctx.nameOf(s))}</b> ${g.offer[s] ? 'is choosing tickets' : g.drew ? 'takes a second card' : 'to play'}${g.lastRound != null ? ' · final round' : ''}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.final[b].total - g.final[a].total);
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} win${g.winners.length > 1 ? '' : 's'}</h2><p>Routes + tickets + the longest line</p>
        <ol class="scores">${order.map(s => { const f = g.final[s]; return `<li>${ctx.nameOf(s)} <small>${f.routes} routes · ${f.tickets >= 0 ? '+' : ''}${f.tickets} tickets${f.bonus ? ' · +10 longest' : ''}</small> <b>${f.total}</b></li>`; }).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
