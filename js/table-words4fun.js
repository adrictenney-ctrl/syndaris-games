// Words 4 Fun on the table: the letter grid in the middle on a sunny tile tray, the clock above
// it, each team's score at the sides. Countdown 10 → 1, a buzzer, then a ding whenever anyone
// finds a word nobody had yet. At time up the two teams' lists are laid out side by side, with
// cancelled words struck through.
import * as W from './words4fun.js?v=64';
import { loadDict, dictFailed } from './dict.js?v=64';
import { ding, buzzer, beep, chime } from './sfx.js?v=64';

let root = null, key = '', gameRef = null, clockT = null, lastAnn = 0, lastBeep = -1;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const sel = (name, s, opts) => `<label>${opts.label} <select data-set="${name}">${opts.v.map(([v, t]) => `<option value="${v}" ${v === s[name] ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;

export const tile = (t, cls = '', attrs = '') => `<button class="wf-tile ${cls}" ${attrs}><b>${t === 'Qu' ? 'Q<small>u</small>' : t}</b></button>`;
export const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function build() {
  root = document.createElement('div');
  root.id = 'words4fun';
  root.innerHTML = `<div class="wf-head"><div class="wf-team t0"></div><div class="wf-clock"></div><div class="wf-team t1"></div></div><div class="wf-body"></div><p class="wf-msg"></p>`;
  document.getElementById('center').appendChild(root);
  clockT = setInterval(paintClock, 200);
}

function paintClock() {
  const g = gameRef, el = root?.querySelector('.wf-clock');
  if (!g || !el) return;
  if (g.phase === 'count') {
    const n = g.goAt ? Math.ceil((g.goAt - Date.now()) / 1000) : null;
    el.innerHTML = n == null ? '<small>Getting the dictionary…</small>' : `<b class="cd">${Math.max(1, n)}</b>`;
    if (n != null && n !== lastBeep && n > 0 && n <= 10) { lastBeep = n; beep(n <= 3); }
  } else if (g.phase === 'play') {
    const left = g.endAt - Date.now();
    el.innerHTML = `<b class="${left < 15000 ? 'low' : ''}">${fmt(left)}</b>`;
  } else el.innerHTML = '<b class="done">Time!</b>';
}

export default {
  defaults: { size: 4, minutes: 3, target: 0, scoring: 'chart', level: 'normal' },
  settingsHTML: s => sel('size', s, { label: 'Grid', v: [[4, '4 × 4 (16 tiles)'], [5, '5 × 5 (25 tiles)']] })
    + sel('minutes', s, { label: 'Round', v: [[1, '1 minute'], [2, '2 minutes'], [3, '3 minutes'], [4, '4 minutes'], [5, '5 minutes']] })
    + sel('target', s, { label: 'Play to', v: [[0, 'One round'], [25, '25 points'], [50, '50 points'], [100, '100 points']] })
    + `<label>Scoring <select data-set="scoring" data-str="1">${[['chart', 'By length (2·3·4·6·12)'], ['letters', '1 point per letter']].map(([v, t]) => `<option value="${v}" ${v === s.scoring ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`
    + `<label>Computer <select data-set="level" data-str="1">${[['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']].map(([v, t]) => `<option value="${v}" ${v === s.level ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  applySetting(s, key, el) { if (el.dataset.str) { s[key] = el.value; return true; } return false; },
  create(settings, players) { loadDict(); return W.createGame(settings, players); },
  act: W.applyAction,
  bot: W.botAction,
  view: W.viewFor,
  turn: () => -1,
  timer: g => W.tick(g),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const t = W.team(seat), badges = [];
    if (g.phase === 'over' && g.winner === t) badges.push('<span class="badge got">🏆 winners</span>');
    const n = g.found[seat].length;
    return { badges, meta: `<span class="wf-tm t${t}">${t ? '☾' : '☀'} ${W.TEAM_NAME[t]}</span><span><b>${n}</b> word${n === 1 ? '' : 's'}</span><span><b>${g.playerScores[seat]}</b> pts</span>`, cards: 0, turn: g.phase === 'play', out: false };
  },

  reset() { root?.remove(); root = null; key = ''; clearInterval(clockT); lastBeep = -1; },

  renderCenter(g, ctx) {
    gameRef = g;
    document.getElementById('watermark').textContent = '';
    loadDict();
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--gw', Math.min(felt.width - v * 66, felt.height - v * 30, v * 66) + 'px');
    if (g.announce && g.announce.id !== lastAnn) {
      if (lastAnn) ({ ding, go: buzzer, end: () => { buzzer(); setTimeout(chime, 800); } })[g.announce.kind]?.();
      lastAnn = g.announce.id;
    }
    paintClock();
    const k = JSON.stringify([g.moveId, g.phase, Math.round(felt.width), Math.round(felt.height)]);
    if (k === key) return;
    key = k;
    [0, 1].forEach(t => {
      const el = root.querySelector('.wf-team.t' + t);
      el.innerHTML = `<small>${t ? '☾' : '☀'} ${W.TEAM_NAME[t]}</small><b>${g.teamScores[t]}</b>`;
      el.hidden = !g.order.some(s => W.team(s) === t);
    });
    const body = root.querySelector('.wf-body');
    body.classList.toggle('res', !!g.results);
    if (!g.results) {
      body.innerHTML = `<div class="wf-grid n${g.n} ${g.phase === 'count' ? 'hide' : ''}">${g.grid.map(t => tile(t)).join('')}</div>`;
    } else {
      const col = t => `<div class="wf-list t${t}"><h3>${t ? '☾' : '☀'} ${W.TEAM_NAME[t]} <b>+${g.results.add[t]}</b></h3><ul>${g.results.teams[t].map(r => `<li class="${r.cancelled ? 'x' : ''}"><span>${esc(r.w)}</span><em>${r.cancelled ? '' : r.pts + (r.bonus ? '+2★' : '')}</em><small>${esc(ctx.nameOf(r.first ?? r.by))}</small></li>`).join('') || '<li class="none">no words</li>'}</ul></div>`;
      body.innerHTML = `<div class="wf-mini n${g.n}">${g.grid.map(t => tile(t)).join('')}</div>${col(0)}${col(1)}`;
    }
    const msg = root.querySelector('.wf-msg');
    if (g.phase === 'count') msg.innerHTML = g.goAt ? 'Get ready… trace words on your phone when the buzzer sounds' : (dictFailed() ? "Couldn't load the dictionary — every word will count" : 'Loading the dictionary…');
    else if (g.phase === 'play') msg.innerHTML = `Find words of 3+ letters · tiles must touch · ${g.order.reduce((a, s) => a + g.found[s].length, 0)} found so far`;
    else if (g.phase === 'scored') msg.innerHTML = 'Words both teams found are cancelled · ★ = found it first (+2) · <b>tap Next round on a phone</b>';
    else msg.innerHTML = '';
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const head = g.winner == null ? "It's a tie!" : `${W.TEAM_NAME[g.winner]} wins!`;
    const players = g.order.slice().sort((a, b) => g.playerScores[b] - g.playerScores[a]);
    return {
      key: 'over' + g.round,
      html: `<h2>${head}</h2><p>${W.TEAM_NAME[0]} ${g.teamScores[0]} · ${W.TEAM_NAME[1]} ${g.teamScores[1]}</p>
        <ol class="scores">${players.map(s => `<li>${ctx.nameOf(s)} <b>${g.playerScores[s]}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big ghost" data-do="next">See the words</button><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
      next: () => { g.phase = 'final'; g.moveId++; },
    };
  },
};
