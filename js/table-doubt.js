// I Doubt It on the table: the face-down pile in the middle, the rank that's up printed
// on the felt, the last claim, and a ring that counts down the time to doubt it. When
// someone doubts, the cards turn over for everyone to see.
import * as D from './doubt.js?v=58';
import { cardEl, snap } from './cards.js?v=58';

let root = null, lastPlay = -1, pileEls = [], revealKey = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function build() {
  root = document.createElement('div');
  root.id = 'doubt';
  root.innerHTML = `<div class="db-pile"></div><div class="db-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" class="bg"/><circle cx="50" cy="50" r="46" class="fg" pathLength="100"/></svg></div>
    <div class="db-up"><small>Now playing</small><b></b></div><div class="db-claim"></div><div class="db-reveal"></div>`;
  document.getElementById('center').appendChild(root);
}

function seeded(i) { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

function renderPile(g, ctx) {
  const pile = root.querySelector('.db-pile');
  const cw = ctx.vmin * 7 * ctx.cardScale;
  const want = Math.min(g.pile.length, 26);
  if (g.phase === 'reveal' || !g.pile.length) { pile.innerHTML = ''; pileEls = []; }
  while (pileEls.length > want) pileEls.pop().remove();
  while (pileEls.length < want) {
    const i = pileEls.length;
    const c = cardEl(null, true);
    c.style.setProperty('--cw', cw + 'px');
    c.style.transform = `translate(-50%, -50%) translate(${(seeded(i) - .5) * cw * .5}px, ${(seeded(i + 99) - .5) * cw * .4}px) rotate(${(seeded(i + 7) - .5) * 70}deg)`;
    pile.appendChild(c);
    pileEls.push(c);
  }
  pile.dataset.n = g.pile.length ? `${g.pile.length} card${g.pile.length === 1 ? '' : 's'}` : '';
}

function tickRing(g) {
  if (!root) return;
  const ring = root.querySelector('.db-ring');
  const on = g.phase === 'doubt';
  ring.classList.toggle('on', on);
  if (on) {
    const left = Math.max(0, g.deadline - Date.now()) / (g.settings.window * 1000);
    ring.querySelector('.fg').style.strokeDashoffset = String(100 - left * 100);
  }
}
let gameRef = null;
setInterval(() => gameRef && tickRing(gameRef), 100);

export default {
  defaults: { window: 6 },
  settingsHTML: s => `<label>Time to doubt <select data-set="window">${[4, 6, 8, 10].map(n => `<option value="${n}" ${n === s.window ? 'selected' : ''}>${n} seconds</option>`).join('')}</select></label>`,

  create: (settings, players) => D.createGame(settings, players),
  act: D.applyAction,
  bot: D.botAction,
  view: D.viewFor,
  turn: g => (g.phase === 'play' ? g.turn : -1),
  timer(g, players) {
    if (g.phase === 'doubt') {
      D.planBotDoubt(g, players);
      if (g.botDoubt && g.botDoubt.at < g.deadline) {
        const b = g.botDoubt;
        return { ms: Math.max(0, b.at - Date.now()), run: () => { if (g.phase === 'doubt') D.applyAction(g, b.seat, { type: 'doubt' }); } };
      }
      // The next player is a bot: it waits out the window, then plays.
      return { ms: Math.max(0, g.deadline - Date.now()) + 20, run: () => D.advance(g) };
    }
    if (g.phase === 'reveal') return { ms: Math.max(0, g.deadline - Date.now()) + 20, run: () => D.advance(g) };
    return null;
  },
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const n = g.hands[seat].length;
    const badges = [];
    if (g.phase === 'over' && g.winner === seat) badges.push('<span class="badge got">🏆 out of cards</span>');
    else if (n <= 2 && g.phase !== 'over') badges.push(`<span class="badge alone">${n === 0 ? 'no cards!' : `${n} left!`}</span>`);
    return { badges, meta: `<span><b>${n}</b> card${n === 1 ? '' : 's'}</span>`, cards: Math.min(n, 12), turn: g.phase === 'play' && g.turn === seat, out: false };
  },

  reset() { root?.remove(); root = null; lastPlay = -1; pileEls = []; revealKey = ''; gameRef = null; },

  renderCenter(g, ctx) {
    gameRef = g;
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    root.style.setProperty('--v', ctx.vmin + 'px');
    renderPile(g, ctx);
    if (g.last && g.last.id !== lastPlay) { if (lastPlay !== -1) snap(0.5); lastPlay = g.last.id; }

    const up = root.querySelector('.db-up b');
    up.textContent = D.plural(D.required(g));
    root.querySelector('.db-up small').textContent = g.phase === 'play' ? `${ctx.nameOf(g.turn)} plays` : g.phase === 'doubt' ? 'Up next' : 'Up next';

    const claim = root.querySelector('.db-claim');
    if (g.phase === 'doubt' && g.last) claim.innerHTML = `<span><b>${esc(ctx.nameOf(g.last.seat))}</b> says</span><strong>${D.claimText(g.last.n, g.last.claim)}</strong><em>Doubt it? Tap on your phone</em>`;
    else claim.innerHTML = '';

    const rv = root.querySelector('.db-reveal');
    const rk = g.reveal ? 'r' + g.reveal.id : '';
    if (rk !== revealKey) {
      revealKey = rk;
      if (g.reveal) {
        const r = g.reveal;
        const cw = ctx.vmin * 9 * ctx.cardScale;
        rv.innerHTML = `<p class="who"><b>${esc(ctx.nameOf(r.doubter))}</b> doubts <b>${esc(ctx.nameOf(r.liar))}</b>: “${D.claimText(r.cards.length, r.claim)}”</p><div class="cards"></div>
          <p class="verdict ${r.truthful ? 'true' : 'lie'}">${r.truthful ? 'It was true!' : 'Caught lying!'} <span>${esc(ctx.nameOf(r.taker))} picks up ${r.took} card${r.took === 1 ? "" : "s"}</span></p>`;
        const row = rv.querySelector('.cards');
        r.cards.forEach((c, i) => {
          const ce = cardEl(c);
          ce.style.setProperty('--cw', cw + 'px');
          ce.style.animationDelay = `${i * 0.18}s`;
          ce.classList.add('flipin', c[0] === r.claim ? 'ok' : 'bad');
          row.appendChild(ce);
        });
        snap(0.7);
      } else rv.innerHTML = '';
    }
    root.classList.toggle('revealing', !!g.reveal);
    tickRing(g);
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.hands[a].length - g.hands[b].length);
    return {
      key: 'over' + g.playId,
      html: `<h2>${ctx.nameOf(g.winner)} wins</h2><p>Out of cards — and nobody caught them</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.hands[s].length}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
