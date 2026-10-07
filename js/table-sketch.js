// Sketch & Guess on the table: a sketch pad in the middle shows the drawing as it's made,
// with the word's blanks and the clock above it. At the end of each turn the answers card
// shows every player's final answer.
import * as S from './sketch.js?v=50';
import { fitCanvas, paint } from './sketch-pad.js?v=50';

let root = null, cv = null;
let gameRef = null, ctxRef = null;
let tick = null, raf = 0;
let lastInk = '';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clock = ms => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function repaint() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => { if (cv && gameRef) paint(cv, gameRef.ink || []); });
}

function updateClock() {
  const g = gameRef;
  if (!root || !g) return;
  const el = root.querySelector('.sk-clock');
  const left = Math.max(0, (g.endsAt || 0) - Date.now());
  if (g.phase === 'draw') {
    el.textContent = clock(left);
    el.classList.toggle('low', left < 10000);
    root.querySelector('.sk-fuse i').style.width = `${(100 * left) / g.total}%`;
  } else if (g.phase === 'reveal') {
    const n = root.querySelector('.sk-next b');
    if (n) n.textContent = Math.ceil(left / 1000);
  }
}

function build() {
  root = document.createElement('div');
  root.id = 'sketch';
  root.innerHTML = `
    <div class="sk-head">
      <div class="sk-who"></div>
      <div class="sk-blanks"></div>
      <div class="sk-clock"></div>
    </div>
    <div class="sk-body">
      <div class="sk-pad"><div class="sk-rings"></div><canvas></canvas><div class="sk-msg"></div><div class="sk-fuse"><i></i></div></div>
      <div class="sk-card"></div>
    </div>
    <div class="sk-actions"></div>`;
  document.getElementById('center').appendChild(root);
  cv = root.querySelector('canvas');
  tick = setInterval(updateClock, 250);
}

function renderCard(g, ctx) {
  const r = g.result;
  const rows = r.answers.map((a, i) => (a ? `
    <li class="${a.correct ? 'yes' : a.answer ? 'no' : 'none'}">
      <span class="nm"><i style="background:var(--seat-${i})"></i>${esc(ctx.nameOf(i))}</span>
      <span class="ans">${a.answer ? esc(a.answer) : '<em>no answer</em>'}</span>
      <span class="pts">${a.correct ? `✓ +${a.pts}` : '✗'}</span>
    </li>` : '')).join('');
  const why = { time: "Time's up", all: 'Everyone got it!', gaveup: `${esc(ctx.nameOf(r.drawer))} passed`, left: `${esc(ctx.nameOf(r.drawer))} left the table` }[r.why] || '';
  return `
    <p class="eyebrow">${why}</p>
    <p class="was">The word was</p>
    <h3>${esc(r.word)}</h3>
    <p class="drew"><i style="background:var(--seat-${r.drawer})"></i>${esc(ctx.nameOf(r.drawer))} drew it · +${r.drawerPts}</p>
    <ul>${rows}</ul>
    <p class="sk-next">Next drawer in <b></b>s <button class="tool" data-a="next">Next now</button></p>`;
}

export default {
  defaults: { rounds: 2, time: 80, words: 'mixed', hints: true },

  settingsHTML: s => `
    <label>Rounds <select data-set="rounds">${[1, 2, 3, 4].map(n => `<option value="${n}" ${n === s.rounds ? 'selected' : ''}>${n === 1 ? 'Everyone draws once' : `Everyone draws ${n}×`}</option>`).join('')}</select></label>
    <label>Drawing time <select data-set="time">${[45, 60, 80, 100, 120].map(n => `<option value="${n}" ${n === s.time ? 'selected' : ''}>${n} seconds</option>`).join('')}</select></label>
    <label>Words <select data-set="words">${[['easy', 'Easy'], ['mixed', 'Pick from easy, medium, hard'], ['medium', 'Medium'], ['hard', 'Hard']].map(([v, t]) => `<option value="${v}" ${v === s.words ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-set="hints" ${s.hints ? 'checked' : ''}> Reveal letters as time runs down</label>`,

  applySetting(set, key, el) {
    if (key !== 'words') return false;
    set.words = el.value;
    return true;
  },

  create: (settings, players) => S.createGame(settings, players),
  act: S.applyAction,
  bot: S.botAction,
  view: S.viewFor,
  turn: S.turn,
  timer: S.timer,
  joinMidGame: () => true,

  // Pieces of the drawing, straight from the drawer's phone.
  ink(g, seat, m) {
    if (!S.addInk(g, seat, m)) return false;
    repaint();
    return true;
  },

  plate(g, seat) {
    const badges = [];
    const a = g.guesses?.[seat];
    if (seat === g.drawer && ['pick', 'draw'].includes(g.phase)) badges.push(`<span class="badge alone">${g.phase === 'pick' ? 'choosing a word' : '✏️ drawing'}</span>`);
    else if (g.phase === 'draw' && a?.correct) badges.push('<span class="badge got">✓ got it</span>');
    else if (g.phase === 'draw' && a?.tries) badges.push('<span class="badge">guessing…</span>');
    if (g.phase === 'over' && g.winners?.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    return {
      badges,
      meta: `<span><b>${g.scores[seat] || 0}</b> points</span>`,
      cards: 0,
      turn: seat === g.drawer && ['pick', 'draw'].includes(g.phase),
      out: false,
    };
  },

  reset() {
    clearInterval(tick);
    root?.remove();
    root = cv = null;
    lastInk = '';
  },

  renderCenter(g, ctx) {
    gameRef = g;
    ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const many = ctx.layout.length > 4;
    const reveal = g.phase === 'reveal';
    // Room between the players' name plates: ends on the left and right, rows top and bottom.
    const availW = felt.width - 2 * v * (many ? 27 : 24);
    const availH = felt.height - 2 * v * (ctx.upright ? 20 : 22) - 9 * v;
    const cardW = reveal ? Math.min(46 * v, availW * 0.42) : 0;
    const padW = Math.max(30 * v, Math.min(availW - cardW - (reveal ? 2.5 * v : 0), (availH * S.PAD_W) / S.PAD_H));
    root.style.setProperty('--v', v + 'px');
    root.classList.toggle('reveal', reveal);
    root.dataset.phase = g.phase;
    root.querySelector('.sk-card').style.width = cardW + 'px';
    root.querySelector('.sk-card').style.maxHeight = (padW * S.PAD_H) / S.PAD_W + 'px';
    if (fitCanvas(cv, Math.floor(padW))) lastInk = '';
    root.querySelector('.sk-pad').style.width = Math.floor(padW) + 'px';

    const name = esc(ctx.nameOf(g.drawer));
    const who = root.querySelector('.sk-who');
    const msg = root.querySelector('.sk-msg');
    const blanksEl = root.querySelector('.sk-blanks');
    if (g.phase === 'pick') {
      who.innerHTML = `Round ${g.round} of ${g.settings.rounds}`;
      blanksEl.textContent = '';
      msg.innerHTML = `<span><b>${name}</b> is choosing a word<span class="dots"></span></span>`;
      root.querySelector('.sk-clock').textContent = '';
    } else if (g.phase === 'draw') {
      who.innerHTML = `<i style="background:var(--seat-${g.drawer})"></i>${name} is drawing · ${g.correct} of ${S.viewFor(g, -1).guessers} got it`;
      blanksEl.textContent = S.blanks(g);
      msg.innerHTML = g.ink.length ? "" : "<span>Watch the pad · type your answer on your phone</span>";
    } else if (reveal) {
      who.innerHTML = `Round ${g.round} of ${g.settings.rounds}`;
      blanksEl.textContent = '';
      root.querySelector('.sk-clock').textContent = '';
      msg.innerHTML = '';
    } else {
      who.innerHTML = '';
      blanksEl.textContent = '';
      msg.innerHTML = '';
    }
    const card = root.querySelector('.sk-card');
    const ck = reveal ? 'r' + g.turnNo : '';
    if (card.dataset.k !== ck) {
      card.dataset.k = ck;
      card.innerHTML = reveal ? renderCard(g, ctx) : '';
      card.querySelector('[data-a="next"]')?.addEventListener('click', () => ctx.act(g.drawer, { type: 'next' }));
    }

    // A way out if the drawer has wandered off.
    const acts = root.querySelector('.sk-actions');
    const ak = g.phase + g.turnNo;
    if (acts.dataset.k !== ak) {
      acts.dataset.k = ak;
      acts.innerHTML = ['pick', 'draw'].includes(g.phase) ? `<button class="tool" data-a="skip">Skip ${name}'s turn</button>` : '';
      acts.querySelector('[data-a="skip"]')?.addEventListener('click', () => ctx.act(g.drawer, { type: 'giveup' }));
    }

    const inkKey = g.turnNo + ':' + g.ink.length + ':' + g.ink.reduce((n, s) => n + s.p.length, 0);
    if (inkKey !== lastInk) { lastInk = inkKey; repaint(); }
    updateClock();
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.scores.map((s, i) => ({ s, i })).filter(x => g.seats[x.i]).sort((a, b) => b.s - a.s);
    const names = g.winners.map(i => ctx.nameOf(i));
    return {
      key: 'over' + g.turnNo,
      html: `<h2>${names.length > 1 ? `${names.join(' & ')} tie` : `${names[0] || 'Nobody'} wins`}</h2>
        <p>Final scores</p>
        <ol class="scores">${order.map(x => `<li>${ctx.nameOf(x.i)} <b>${x.s}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
