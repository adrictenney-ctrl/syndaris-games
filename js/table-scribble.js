// Scribble Chain on the table. While everyone works: which step it is, the clock, and who's
// finished. Then the reveal: each sketchbook opens on the table, page by page — the word, the
// drawing, the guess, the next drawing… — with who did each page.
import * as C from './scribble.js?v=60';
import { fitCanvas, paint } from './sketch-pad.js?v=60';
import { snap } from './cards.js?v=60';

let root = null, key = '', tick = null, gref = null;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function build() {
  root = document.createElement('div');
  root.id = 'scribble';
  root.innerHTML = `<div class="sc-status"></div><div class="sc-book"></div>`;
  document.getElementById('center').appendChild(root);
  tick = setInterval(() => { const c = root?.querySelector('.sc-clock'); if (c && gref?.deadline) c.textContent = clock(gref.deadline - Date.now()); }, 250);
}

export default {
  defaults: { draw: 80, guess: 45 },
  settingsHTML: s => `<label>Drawing time <select data-set="draw">${[60, 80, 100, 120].map(n => `<option value="${n}" ${n === s.draw ? 'selected' : ''}>${n} seconds</option>`).join('')}</select></label>
    <label>Guessing time <select data-set="guess">${[30, 45, 60].map(n => `<option value="${n}" ${n === s.guess ? 'selected' : ''}>${n} seconds</option>`).join('')}</select></label>`,
  create: (settings, players) => C.createGame(settings, players),
  act: C.applyAction,
  bot: () => null,
  view: C.viewFor,
  turn: () => -1,
  timer: g => C.timer(g),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (['write', 'draw', 'guess'].includes(g.phase)) badges.push(g.done[seat] ? '<span class="badge got">done</span>' : `<span class="badge">${g.phase === 'draw' ? '✏️ drawing' : g.phase === 'guess' ? 'guessing' : 'choosing'}</span>`);
    if (g.phase === 'reveal' && g.books[g.revealBook].owner === seat) badges.push('<span class="badge alone">their book</span>');
    return { badges, meta: '', cards: 0, turn: false, out: false };
  },

  reset() { clearInterval(tick); root?.remove(); root = null; key = ''; gref = null; },

  renderCenter(g, ctx) {
    gref = g;
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const W = Math.min(felt.width - v * 60, (felt.height - v * 36) * 1.33);
    root.style.setProperty('--W', W + 'px');
    const status = root.querySelector('.sc-status'), book = root.querySelector('.sc-book');
    const k = JSON.stringify([g.phase, g.step, Object.keys(g.done).length, g.revealBook, g.revealPage, Math.round(W)]);
    if (k === key) return;
    key = k;
    if (g.phase !== 'reveal' && g.phase !== 'over') {
      const label = { write: 'Everyone picks a secret word', draw: 'Draw what your book says', guess: 'Guess what the drawing is' }[g.phase];
      status.innerHTML = `<p class="sc-step">Page ${g.step + 1} of ${C.totalSteps(g)}</p><h3>${label}</h3>${g.deadline ? `<b class="sc-clock">${clock(g.deadline - Date.now())}</b>` : ''}
        <div class="sc-who">${g.order.map(s => `<span class="${g.done[s] ? 'on' : ''}"><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(s))}</span>`).join('')}</div>`;
      book.innerHTML = '';
      return;
    }
    status.innerHTML = '';
    if (g.phase === 'over') { book.innerHTML = ''; return; }
    const b = g.books[g.revealBook], p = b.pages[g.revealPage];
    book.innerHTML = `<header><b>${esc(ctx.nameOf(b.owner))}'s book</b><span>${b.pages.map((_, i) => `<i class="${i === g.revealPage ? 'on' : i < g.revealPage ? 'past' : ''}"></i>`).join('')}</span></header>
      <div class="sc-page ${p.type}">${p.type === 'draw' ? '<canvas></canvas>' : `<p class="${p.type}">${p.text ? esc(p.text) : '<em>(no answer)</em>'}</p>`}</div>
      <footer>${p.type === 'word' ? 'The word was chosen by' : p.type === 'draw' ? 'Drawn by' : 'Guessed by'} <b>${esc(ctx.nameOf(p.by))}</b><button class="tool" data-next>Next page ›</button></footer>`;
    if (p.type === 'draw') { const cv = book.querySelector('canvas'); fitCanvas(cv, Math.floor(W * 0.92)); paint(cv, p.strokes); }
    book.querySelector('[data-next]').onclick = () => ctx.act(b.owner, { type: 'next' });
    snap(0.3);
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const drift = g.books.map(b => `<li>${esc(ctx.nameOf(b.owner))}: “${esc(b.pages[0]?.text || '')}” → “${esc([...b.pages].reverse().find(p => p.type === 'guess')?.text || '…')}”</li>`).join('');
    return {
      key: 'over' + g.stepId,
      html: `<h2>That's every book</h2><p>From the first word to the last guess:</p><ol class="scores sc-drift">${drift}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
