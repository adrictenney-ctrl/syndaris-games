// Hard Sell on the table: the Customer's card in the middle, then a shelf of products — each a
// pair of word cards with its seller's name — with a spotlight on whoever is pitching.
import * as H from './hardsell.js?v=63';
import { snap } from './cards.js?v=63';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// A word card, and a product made of two.
export const wordCard = (w, cls = '') => `<span class="hs-word ${cls}">${esc(w)}</span>`;
export const productHTML = (words, cls = '') => `<div class="hs-prod ${cls}">${words.map(w => wordCard(w)).join('<em>+</em>')}</div>`;
export const customerCard = (who, cls = '') => `<div class="hs-cust ${cls}"><small>Today's customer</small><b>${esc(who)}</b></div>`;

function build() {
  root = document.createElement('div');
  root.id = 'hardsell';
  root.innerHTML = `<div class="hs-top"></div><div class="hs-shelf"></div><p class="hs-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { rounds: 1 },
  settingsHTML: s => `<label>Turns as Customer <select data-set="rounds">${[1, 2, 3].map(n => `<option value="${n}" ${n === s.rounds ? 'selected' : ''}>${n} each</option>`).join('')}</select></label>`,
  create: (settings, players) => H.createGame(settings, players),
  act: H.applyAction,
  bot: H.botAction,
  view: H.viewFor,
  turn: g => H.current(g),
  timer: g => H.tick(g),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (seat === g.customer && g.phase !== 'over') badges.push('<span class="badge got">🛍 customer</span>');
    else if (g.phase === 'build') badges.push(g.picks[seat] ? '<span class="badge got">ready</span>' : '<span class="badge">inventing…</span>');
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 top seller</span>');
    const pitching = g.phase === 'pitch' && H.pitchers(g)[g.pitchIdx] === seat;
    return { badges, meta: `<span><b>${g.scores[seat]}</b> sold</span>`, cards: 0, turn: pitching || (g.phase === 'build' && seat !== g.customer && !g.picks[seat]), out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    root.style.setProperty('--v', ctx.vmin + 'px');
    const k = JSON.stringify([g.moveId, g.phase, Math.round(ctx.vmin)]);
    if (k === key) return;
    if (key && g.phase === 'won') snap(0.5);
    key = k;
    root.querySelector('.hs-top').innerHTML = `${customerCard(g.who)}<span class="hs-buyer">${esc(ctx.nameOf(g.customer))} is buying · round ${g.round} of ${g.total}</span>`;
    const shelf = root.querySelector('.hs-shelf');
    if (g.phase === 'build') {
      const sel = H.sellers(g);
      shelf.innerHTML = `<div class="hs-wait">${sel.map(s => `<span class="${g.picks[s] ? 'on' : ''}">${esc(ctx.nameOf(s))}${g.picks[s] ? ' ✓' : ''}</span>`).join('')}</div>`;
    } else {
      const P = H.pitchers(g);
      shelf.innerHTML = P.map((s, i) => `<div class="hs-item ${g.phase === 'pitch' && i === g.pitchIdx ? 'now' : ''} ${g.won?.seat === s ? 'sold' : ''} ${g.won && g.won.seat !== s ? 'dim' : ''}">
        ${productHTML(g.picks[s].map(w => H.WORDS[w]))}<small>${esc(ctx.nameOf(s))}${g.won?.seat === s ? ' · SOLD 💰' : ''}</small></div>`).join('');
    }
    const msg = root.querySelector('.hs-msg');
    const P = H.pitchers(g);
    if (g.phase === 'build') msg.innerHTML = 'Everyone else: pick two words on your phone to make a product';
    else if (g.phase === 'pitch') msg.innerHTML = g.pitchIdx < P.length ? `<b>${esc(ctx.nameOf(P[g.pitchIdx]))}</b>, sell it to ${esc(g.who)}!` : `<b>${esc(ctx.nameOf(g.customer))}</b>, which one are you buying?`;
    else if (g.won) msg.innerHTML = `${esc(g.who)} bought the <b>${esc(g.won.words ? g.picks[g.won.seat].map(w => H.WORDS[w]).join(' ') : '')}</b>`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} ${g.winners.length > 1 ? 'are' : 'is'} the top seller${g.winners.length > 1 ? 's' : ''}!</h2><p>Last sale: ${esc(g.won.who)} bought the ${esc(g.picks[g.won.seat].map(w => H.WORDS[w]).join(' '))}</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
