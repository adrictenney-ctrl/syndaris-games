// Veto on the table screen: draw pile, discard pile, direction ring, current colour.
import * as C from './veto.js?v=41';
import { cardEl, snap } from './cards.js?v=41';

let pile = [];          // discard pile elements on the felt, oldest first
let pileRound = null;
let lastPlayId = null;
let lastDrawnId = null;

const $ = id => document.getElementById(id);

function ensure(id, cls, html = '') {
  let el = $(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = cls;
    el.innerHTML = html;
    $('center').appendChild(el);
  }
  return el;
}

// A ring of arrows printed on the felt around the piles; mirrored when play reverses.
const RING = `<svg viewBox="-100 -100 200 200" aria-hidden="true">
  <defs><marker id="ccArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
  ${[0, 120, 240].map(a => `<path d="M ${Math.cos((a + 12) * Math.PI / 180) * 88} ${Math.sin((a + 12) * Math.PI / 180) * 88}
     A 88 88 0 0 1 ${Math.cos((a + 100) * Math.PI / 180) * 88} ${Math.sin((a + 100) * Math.PI / 180) * 88}"
     fill="none" stroke="currentColor" stroke-width="2.2" marker-end="url(#ccArrow)"/>`).join('')}
</svg>`;

export default {
  defaults: { target: 0, stacking: false },

  settingsHTML: s => `
    <label>Play <select data-set="target">${[[0, 'one round'], [200, 'to 200 points'], [500, 'to 500 points']]
      .map(([v, t]) => `<option value="${v}" ${v === s.target ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-set="stacking" ${s.stacking ? 'checked' : ''}> Tax cards can be passed on</label>`,

  create: (settings, players) => C.createGame(settings, players.map(Boolean)),
  act: C.applyAction,
  bot: C.botAction,
  view: C.viewFor,
  turn: g => (g.phase === 'play' ? g.turn : -1),
  timer(g, players) {
    if (g.phase === 'roundEnd') return { ms: 7000, run: () => C.advance(g) };
    if (g.phase === 'play' && g.vulnerable != null && !g.catchChecked) {
      const bots = players.map((p, i) => (p?.bot ? i : -1)).filter(i => i >= 0 && i !== g.vulnerable);
      if (bots.length && !players[g.vulnerable]?.bot) {
        return { ms: 2600, run: () => { g.catchChecked = true; C.botCatch(g, bots); } };
      }
    }
    return null;
  },
  joinMidGame(g, seat) { C.addPlayer(g, seat); return true; },

  plate(g, seat) {
    const s = g.seats[seat];
    if (!s) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.dealer === seat && g.phase === 'play') badges.push('<span class="badge dealer">DEALER</span>');
    if (s.active && s.hand.length === 1) {
      badges.push(g.vulnerable === seat ? '<span class="badge lost">didn’t call it!</span>' : '<span class="badge alone">last card</span>');
    }
    if (!s.active) badges.push('<span class="badge off">next round</span>');
    const n = s.hand.length;
    return {
      badges,
      meta: `<span><b>${n}</b> card${n === 1 ? '' : 's'}</span>${g.settings.target ? `<span><b>${s.score}</b> pts</span>` : ''}`,
      cards: s.active ? Math.min(n, 12) : 0,
      turn: g.phase === 'play' && g.turn === seat,
      out: !s.active,
    };
  },

  reset() {
    pile.forEach(p => p.remove());
    pile = [];
    pileRound = null;
    lastPlayId = null;
    lastDrawnId = null;
    ['ccDraw', 'ccHalo', 'ccRing', 'ccLabelA', 'ccLabelB'].forEach(id => $(id)?.remove());
  },

  renderCenter(g, ctx) {
    $('watermark').textContent = '';
    const cw = ctx.vmin * 10.5 * ctx.cardScale;
    const drawX = -cw * 0.78, discX = cw * 0.72;

    const ring = ensure('ccRing', 'cc-ring', RING);
    ring.style.setProperty('--size', cw * 3.3 + 'px');
    ring.classList.toggle('rev', g.dir === -1);

    const halo = ensure('ccHalo', 'cc-halo');
    halo.style.setProperty('--size', cw * 2 + 'px');
    halo.style.transform = `translate(-50%, -50%) translate(${discX}px, 0)`;
    halo.style.setProperty('--glow', g.color ? `var(--oc-${g.color})` : 'transparent');

    // Draw pile: a small squared-up stack of backs.
    const draw = ensure('ccDraw', 'cc-draw');
    if (draw.childElementCount !== 4) {
      draw.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const b = cardEl(null, true);
        b.style.setProperty('--cw', cw + 'px');
        b.style.transform = `translate(-50%, -50%) translate(${-i * 0.9}px, ${-i * 1.6}px)`;
        draw.appendChild(b);
      }
    }
    draw.style.transform = `translate(${drawX}px, 0) rotate(-4deg)`;

    // Discard pile. A new round starts from its single turned-up card.
    if (pileRound !== g.roundNo) {
      pile.forEach(p => p.remove());
      pile = [];
      pileRound = g.roundNo;
      lastPlayId = g.lastPlay?.id ?? null;
      lastDrawnId = g.drawn?.id ?? null;
      const top = g.discard[g.discard.length - 1];
      const el = cardEl(top);
      el.classList.add('cc-pile');
      el.style.setProperty('--cw', cw + 'px');
      el.style.transform = `translate(-50%, -50%) translate(${discX}px, 0) rotate(-3deg)`;
      $('center').appendChild(el);
      pile.push(el);
    }
    if (g.lastPlay && g.lastPlay.id !== lastPlayId) {
      lastPlayId = g.lastPlay.id;
      const { seat, card } = g.lastPlay;
      const el = cardEl(card);
      el.classList.add('cc-pile');
      el.style.setProperty('--cw', cw + 'px');
      const from = ctx.inset(seat, 6);
      el.style.transform = `translate(-50%, -50%) translate(${from.x}px, ${from.y}px) rotate(${ctx.rot(seat)}deg)`;
      el.style.zIndex = String(10 + pile.length);
      $('center').appendChild(el);
      el.getBoundingClientRect();
      const jitterX = (Math.random() - 0.5) * cw * 0.25, jitterY = (Math.random() - 0.5) * cw * 0.25;
      el.style.transform = `translate(-50%, -50%) translate(${discX + jitterX}px, ${jitterY}px) rotate(${ctx.rot(seat) + (Math.random() - 0.5) * 50}deg)`;
      pile.push(el);
      snap();
      while (pile.length > 8) pile.shift().remove();
    }

    // Keep everything on the felt at the chosen card size.
    pile.forEach(p => p.style.setProperty('--cw', cw + 'px'));
    draw.querySelectorAll('.card').forEach(b => b.style.setProperty('--cw', cw + 'px'));

    // Cards flying from the draw pile to whoever drew.
    if (g.drawn && g.drawn.id !== lastDrawnId) {
      lastDrawnId = g.drawn.id;
      const to = ctx.inset(g.drawn.seat, 12);
      for (let i = 0; i < Math.min(g.drawn.count, 4); i++) {
        const b = cardEl(null, true);
        b.classList.add('cc-fly');
        b.style.setProperty('--cw', cw + 'px');
        b.style.transform = `translate(-50%, -50%) translate(${drawX}px, 0)`;
        $('center').appendChild(b);
        setTimeout(() => {
          b.style.transform = `translate(-50%, -50%) translate(${to.x}px, ${to.y}px) rotate(${ctx.rot(g.drawn.seat)}deg) scale(.55)`;
          b.style.opacity = '0';
          snap(0.2);
        }, 30 + i * 120);
        setTimeout(() => b.remove(), 900 + i * 120);
      }
    }

    // Current colour, printed twice so both long sides can read it.
    const text = g.phase !== 'play' ? '' : (g.color ? C.COLOR_NAME[g.color] : 'Any colour') + (g.pending ? ` · tax of ${g.pending} waiting` : '');
    ['ccLabelA', 'ccLabelB'].forEach((id, i) => {
      const l = ensure(id, 'pot-label' + (i ? ' mirror-label' : ''));
      l.style.setProperty('--r', i ? '180deg' : '0deg');
      l.style.setProperty('--dy', cw * 1.05 + 'px');
      l.textContent = text;
    });
  },

  overlay(g, ctx) {
    if (!['roundEnd', 'gameOver'].includes(g.phase)) return null;
    const r = g.result;
    const board = g.settings.target
      ? `<ol class="scores">${g.seats.map((s, i) => s && { i, s }).filter(Boolean).sort((a, b) => b.s.score - a.s.score)
        .map(({ i, s }) => `<li><span>${ctx.nameOf(i)}</span><b>${s.score}</b></li>`).join('')}</ol>`
      : '';
    if (g.phase === 'gameOver') {
      return {
        key: 'over' + g.roundNo,
        html: `<h2>${ctx.nameOf(g.winner)} wins</h2>
          <p>${g.settings.target ? `Reached ${g.settings.target} points` : 'First to empty their hand'} · +${r.pts} this round</p>${board}
          <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
      };
    }
    return {
      key: 'round' + g.roundNo,
      html: `<h2>${ctx.nameOf(r.winner)} goes out</h2><p>+${r.pts} points from everyone's leftover cards</p>${board}
        <p class="hint">Next round in a moment… <button class="tool" data-do="next">Deal now</button></p>`,
      next: () => { if (g.phase === 'roundEnd') C.advance(g); },
    };
  },
};
