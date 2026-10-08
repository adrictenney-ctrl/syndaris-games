// Chef's Kiss on the table: the Recipe Card in the middle, the Ingredient Cards laid out
// beside it (face down as they come in, face up for the Chef to judge). Every card can be
// moved, pinched bigger or smaller, and twisted, like a real card on the table.
import * as K from './chefskiss.js?v=57';
import { face, back, wireBulbs, esc } from './ck-face.js?v=57';
import { movable } from './gesture.js?v=57';

let root = null, gameRef = null, ctxRef = null, tick = null;
let subsKey = '', recipeKey = '', chosen = -1, slipOpen = false;

const clock = ms => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function build() {
  root = document.createElement('div');
  root.id = 'chefskiss';
  root.innerHTML = `
    <div class="ck-bar">
      <span class="ck-round"></span>
      <span class="ck-goal"></span>
      <span class="ck-gameclock"></span>
      <button class="tool ck-timers" type="button">⏱ Timers</button>
    </div>
    <div class="ck-board">
      <div class="ck-recipe"></div>
      <div class="ck-subs"></div>
    </div>
    <div class="ck-status"><span class="ck-msg"></span><b class="ck-clock"></b></div>
    <div class="ck-slip" hidden></div>`;
  document.getElementById('center').appendChild(root);
  root.querySelector('.ck-timers').onclick = () => { slipOpen = !slipOpen; renderSlip(); };
  tick = setInterval(updateClocks, 250);
}

function updateClocks() {
  const g = gameRef;
  if (!root || !g) return;
  const c = root.querySelector('.ck-clock');
  const left = g.endsAt ? g.endsAt - Date.now() : null;
  c.textContent = left !== null && ['recipe', 'play'].includes(g.phase) ? clock(left) : '';
  c.classList.toggle('low', left !== null && left < 5000);
  const gc = root.querySelector('.ck-gameclock');
  if (g.settings.length && g.phase !== 'over') {
    const gl = g.startedAt + g.settings.length * 60000 - Date.now();
    gc.textContent = gl > 0 ? `⏳ ${clock(gl)} left` : '⏳ Last round!';
  } else gc.textContent = '';
  if (g.phase === 'reveal') {
    const n = root.querySelector('.ck-next b');
    if (n) n.textContent = Math.max(0, Math.ceil((g.endsAt - Date.now()) / 1000));
  }
}

function renderSlip() {
  const slip = root.querySelector('.ck-slip');
  slip.hidden = !slipOpen;
  if (!slipOpen) return;
  const s = gameRef.settings;
  const opt = (vals, cur, label) => vals.map(v => `<option value="${v}" ${v === cur ? 'selected' : ''}>${label(v)}</option>`).join('');
  slip.innerHTML = `
    <h4>Timers</h4>
    <label>Recipe Card pick <select data-k="recipeTime">${opt([0, 5, 10, 15], s.recipeTime, v => (v ? v + ' seconds' : 'Off'))}</select></label>
    <label>Ingredient Card pick <select data-k="ingredientTime">${opt([0, 10, 15, 20, 30], s.ingredientTime, v => (v ? v + ' seconds' : 'Off'))}</select></label>
    <label>Game length <select data-k="length">${opt([0, 30, 60, 120], s.length, v => (v ? (v === 120 ? '2 hours' : v + ' minutes') : 'No timer'))}</select></label>
    <p class="hint">The Chef's decision never has a timer.</p>
    <div class="row"><button class="tool" data-a="end" type="button">End the game now</button><button class="tool" data-a="close" type="button">Done</button></div>`;
  slip.querySelectorAll('select').forEach(sel => {
    sel.onchange = () => {
      const v = Object.fromEntries([...slip.querySelectorAll('select')].map(x => [x.dataset.k, Number(x.value)]));
      ctxRef.act(gameRef.chef, { type: 'timers', ...v });
    };
  });
  slip.querySelector('[data-a="close"]').onclick = () => { slipOpen = false; renderSlip(); };
  slip.querySelector('[data-a="end"]').onclick = () => {
    if (confirm('End the game now? The most Chef\'s Kisses wins.')) { slipOpen = false; renderSlip(); ctxRef.act(gameRef.chef, { type: 'end' }); }
  };
}

function nameTag(seat, ctx, g) {
  const t = g.settings.teams && g.teams[seat] !== null ? K.TEAMS[g.teams[seat]] : null;
  return `<span class="ck-owner"><i style="background:var(--seat-${seat})"></i>${esc(ctx.nameOf(seat))}${t ? ` <em style="color:${t.c}">Team ${t.name}</em>` : ''}</span>`;
}

function renderRecipe(g) {
  const box = root.querySelector('.ck-recipe');
  const key = g.phase === 'recipe' || !g.recipe ? 'stack' + g.round : g.recipe;
  if (key === recipeKey) return;
  recipeKey = key;
  if (!g.recipe || g.phase === 'recipe') {
    box.innerHTML = `<div class="ck-stack">${back('r')}${back('r')}${back('r')}</div>`;
    return;
  }
  box.innerHTML = face({ kind: 'r', ...K.card(g.recipe) });
  const el = box.firstElementChild;
  el.classList.add('deal');
  movable(el);
  wireBulbs(box);
}

function renderSubs(g, ctx) {
  const box = root.querySelector('.ck-subs');
  const played = Object.values(g.subs || {}).reduce((n, c) => n + c.length, 0);
  const expected = (g.apprentices || []).filter(s => g.seats[s]).length * g.need;
  const key = [g.round, g.phase, played, expected, g.winner].join('|');
  if (key === subsKey) return;
  subsKey = key;
  chosen = -1;
  box.innerHTML = '';
  if (g.phase === 'play') {
    for (let i = 0; i < Math.max(expected, played); i++) {
      box.insertAdjacentHTML('beforeend', i < played ? back('i', 'data-in') : '<div class="ck-card slot"></div>');
    }
    box.querySelectorAll('[data-in]').forEach((el, i) => { if (i === played - 1) el.classList.add('deal'); });
    return;
  }
  if (!['judge', 'reveal'].includes(g.phase)) return;
  g.reveal.forEach((r, i) => {
    const c = K.card(r.c);
    const won = g.phase === 'reveal' && g.winner === i;
    const wrap = document.createElement('div');
    wrap.className = 'ck-sub' + (won ? ' won' : '') + (g.phase === 'reveal' && !won ? ' lost' : '');
    wrap.innerHTML = face({ kind: 'i', ...c }) + (g.phase === 'reveal' ? nameTag(r.seat, ctx, g) : '') +
      (won ? `<span class="ck-kissmark">${'<svg viewBox="0 0 64 36"><path d="M2 17C10 6 20 2 26 7c3 2 4 3 6 3s3-1 6-3c6-5 16-1 24 10-7 11-17 17-30 17S9 28 2 17Z" fill="currentColor"/></svg>'}</span>` : '');
    wrap.style.animationDelay = (g.phase === 'judge' ? i * 0.12 : 0) + 's';
    box.appendChild(wrap);
    const el = wrap.querySelector('.ck-card');
    movable(wrap, {
      onTap: () => {
        // The Chef can award the Kiss right on the table too.
        if (gameRef.phase !== 'judge' || ctx.isBot(gameRef.chef)) return;
        chosen = chosen === i ? -1 : i;
        box.querySelectorAll('.ck-sub').forEach((w, j) => w.classList.toggle('chosen', j === chosen));
        box.querySelectorAll('.ck-give').forEach(b => b.remove());
        if (chosen === i) {
          const b = document.createElement('button');
          b.className = 'big ck-give';
          b.type = 'button';
          b.innerHTML = "💋 Give the Chef's Kiss";
          b.onclick = e => { e.stopPropagation(); ctx.act(gameRef.chef, { type: 'kiss', i }); };
          wrap.appendChild(b);
        }
      },
    });
    el.dataset.i = i;
  });
  wireBulbs(box);
}

function message(g, ctx) {
  const chef = esc(ctx.nameOf(g.chef));
  switch (g.phase) {
    case 'recipe': return `<b>${chef}</b> is the Chef · choosing a Recipe Card`;
    case 'play': {
      const waiting = g.apprentices.filter(s => g.seats[s] && (g.subs[s]?.length || 0) < g.need);
      return `Apprentices, play ${g.need === 2 ? 'two Ingredient Cards (Double Vision)' : 'your best Ingredient Card'} · waiting on ${waiting.length}`;
    }
    case 'judge': return `<b>Lobby the Chef!</b> ${chef} is choosing the Chef's Kiss`;
    case 'reveal': {
      const w = g.reveal[g.winner];
      return `💋 <b>${esc(ctx.nameOf(w.seat))}</b> gets the Chef's Kiss! <span class="ck-next">Next round in <b></b>s <button class="tool" type="button" data-a="next">Next round</button></span>`;
    }
  }
  return '';
}

export default {
  defaults: { ...K.DEFAULTS },

  settingsHTML(s) {
    const box = (k, label) => `<label class="ck-check"><input type="checkbox" data-set="deck_${k}" ${s['deck_' + k] ? 'checked' : ''}> ${label}</label>`;
    const sel = (key, vals, label) => `<select data-set="${key}">${vals.map(v => `<option value="${v}" ${v === s[key] ? 'selected' : ''}>${label(v)}</option>`).join('')}</select>`;
    return `
      <div class="ck-set"><span>Editions</span>${box('e2026', '2026 Edition')}${box('silly', 'Simply Silly (6–9)')}${box('easy', 'Easy Peasy (10–12)')}</div>
      <div class="ck-set"><span>Decade-Decks</span>${box('d50', "'50s")}${box('d60', "'60s")}${box('d70', "'70s")}${box('d80', "'80s")}${box('d90', "'90s")}</div>
      <label>Play to ${sel('target', [5, 7, 10, 0], v => (v ? `${v} Chef's Kisses` : 'no target'))}</label>
      <label>Game length ${sel('length', [30, 60, 120, 0], v => (v ? (v === 120 ? '2 hours' : `${v} minutes`) : 'no timer'))}</label>
      <label>Recipe timer ${sel('recipeTime', [0, 5, 10, 15], v => (v ? `${v} s` : 'off'))}</label>
      <label>Ingredient timer ${sel('ingredientTime', [0, 10, 15, 20, 30], v => (v ? `${v} s` : 'off'))}</label>
      <label>Teams ${sel('teams', [0, 2, 3, 4], v => (v ? `${v} teams` : 'no teams'))}</label>`;
  },

  create: (settings, players) => K.createGame(settings, players),
  act: K.applyAction,
  bot: K.botAction,
  view: K.viewFor,
  turn: K.turn,
  timer: K.timer,
  joinMidGame: () => true,

  plate(g, seat) {
    const badges = [];
    if (seat === g.chef && g.phase !== 'over') badges.push('<span class="badge alone">Chef</span>');
    if (g.settings.teams && g.teams[seat] !== null && g.teams[seat] !== undefined) {
      const t = K.TEAMS[g.teams[seat]];
      badges.push(`<span class="badge" style="color:${t.c};border-color:${t.c}">Team ${t.name}</span>`);
    }
    if (g.phase === 'play' && g.apprentices.includes(seat)) {
      badges.push((g.subs[seat]?.length || 0) >= g.need ? '<span class="badge got">✓ played</span>' : '<span class="badge">choosing…</span>');
    }
    if (g.phase === 'over' && g.winners?.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    return {
      badges,
      meta: `<span><b>${g.scores[seat] || 0}</b> 💋</span>`,
      cards: 0,
      turn: seat === g.chef && ['recipe', 'judge'].includes(g.phase),
      out: false,
    };
  },

  reset() {
    clearInterval(tick);
    root?.remove();
    root = null;
    subsKey = recipeKey = '';
    slipOpen = false;
  },

  renderCenter(g, ctx) {
    gameRef = g;
    ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const many = ctx.layout.length > 4;
    const availW = felt.width - 2 * v * (many ? 26 : 23);
    const availH = felt.height - 2 * v * (ctx.upright ? 19 : 21) - 12 * v;
    const n = ['play', 'judge', 'reveal'].includes(g.phase)
      ? Math.max(1, g.phase === 'play' ? (g.apprentices || []).filter(s => g.seats[s]).length * g.need : g.reveal.length) : 3;
    const rows = n <= 4 ? 1 : 2;
    const cols = Math.ceil(n / rows);
    const gap = 1.6 * v;
    const fit = Math.min((availW - gap * (cols + 1)) / (cols + 1.2), (availH - gap * (rows - 1)) / (rows * 1.4), (availH / 1.4) / 1.2, 30 * v);
    const w = Math.max(9 * v, fit * Math.min(1, ctx.cardScale));
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--w', Math.floor(w) + 'px');
    root.style.setProperty('--cols', cols);
    root.dataset.phase = g.phase;

    const tgt = g.settings.target;
    root.querySelector('.ck-round').textContent = `Round ${g.round}`;
    root.querySelector('.ck-goal').textContent = tgt ? `First to ${tgt} Chef's Kisses` : 'Play for fun · no target';
    renderRecipe(g);
    renderSubs(g, ctx);
    const msg = root.querySelector('.ck-msg');
    const html = message(g, ctx);
    if (msg.dataset.html !== html) {
      msg.dataset.html = html;
      msg.innerHTML = html;
      msg.querySelector('[data-a="next"]')?.addEventListener('click', () => ctx.act(g.chef, { type: 'next' }));
    }
    updateClocks();
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.scores.map((s, i) => ({ s, i })).filter(x => g.seats[x.i]).sort((a, b) => b.s - a.s);
    const names = (g.winners || []).map(i => ctx.nameOf(i));
    const head = !names.length ? 'Thanks for playing!' : names.length > 1 ? `${names.join(' & ')} tie!` : `${names[0]} wins!`;
    const teams = g.settings.teams ? `<ol class="scores">${K.teamTotals(g).map((t, i) => ({ t, i })).sort((a, b) => b.t - a.t)
      .map(x => `<li><span style="color:${K.TEAMS[x.i].c}">Team ${K.TEAMS[x.i].name}</span> <b>${x.t}</b></li>`).join('')}</ol>` : '';
    return {
      key: 'over' + g.id,
      html: `<h2>${esc(head)}</h2>
        <p>${g.why === 'time' ? "Time's up!" : g.why === 'target' ? 'The target was reached.' : ''} The real win is the laughs.</p>
        ${teams}
        <ol class="scores">${order.map(x => `<li>${esc(ctx.nameOf(x.i))} <b>${x.s} 💋</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
