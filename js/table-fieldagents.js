// Field Agents on the table: the 5×5 grid of code words on manila cards. A word that's been
// guessed is covered by its tile — a Brass or Steel agent, a grey bystander, or the black
// Double Agent. The current clue sits above the grid; each team's agents-left count beside it.
import * as F from './fieldagents.js?v=63';
import { snap } from './cards.js?v=63';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// A little figure for the agent tiles: hat and coat.
export const AGENT_SVG = '<svg viewBox="0 0 40 40" class="fa-fig"><path d="M10 15 L30 15 L27 9 Q20 6 13 9 Z"/><rect x="6" y="14" width="28" height="3" rx="1.5"/><circle cx="20" cy="21" r="5"/><path d="M8 40 Q9 28 20 27 Q31 28 32 40 Z"/></svg>';

// One word card. key: 0 | 1 | 'b' | 'x' | null. show: covered by its tile. hint: the
// Handler's view (a coloured edge without covering the word).
export function wordCard(w, key, show, hint, cls = '') {
  const k = key == null ? '' : key === 'b' ? 'kb' : key === 'x' ? 'kx' : 'k' + key;
  if (show) return `<div class="fa-card shown ${k} ${cls}"><span>${key === 'x' ? '☠' : key === 'b' ? '' : AGENT_SVG}</span><small>${esc(w)}</small></div>`;
  return `<div class="fa-card ${hint ? 'hint ' + k : ''} ${cls}"><b>${esc(w)}</b></div>`;
}

export function gridHTML(g, o = {}) {
  return `<div class="fa-grid">${g.words.map((w, i) => {
    const html = wordCard(w, g.key[i], g.shown[i], o.hint, g.last?.i === i ? 'last' : '');
    return o.tap ? `<button data-i="${i}" class="${o.sel === i ? 'sel' : ''}" ${g.shown[i] ? 'disabled' : ''}>${html}</button>` : html;
  }).join('')}</div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'fieldagents';
  root.innerHTML = `<div class="fa-top"><div class="fa-side t0"></div><div class="fa-clue"></div><div class="fa-side t1"></div></div><div class="fa-board"></div><p class="fa-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Two teams · each picks a Handler at random</span>',
  create: (settings, players) => F.createGame(settings, players),
  act: F.applyAction,
  bot: F.botAction,
  view: F.viewFor,
  turn: g => F.current(g),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const t = g.team[seat], badges = [];
    if (g.handler[t] === seat) badges.push('<span class="badge got">🕶 handler</span>');
    if (g.phase === 'over' && g.winner === t) badges.push('<span class="badge got">🏆 winner</span>');
    const guessing = g.phase === 'guess' && t === g.up && g.handler[t] !== seat;
    return { badges, meta: `<span class="fa-tm t${t}">${F.TEAM[t].ic} ${F.TEAM[t].name}</span>`, cards: 0, turn: F.current(g) === seat || guessing, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--fw', Math.min(felt.width - v * 62, (felt.height - v * 24) * 1.62) + 'px');
    const k = JSON.stringify([g.moveId, g.phase, Math.round(felt.width), Math.round(felt.height)]);
    if (k === key) return;
    if (key && g.last) snap(0.4);
    key = k;
    root.querySelector('.fa-board').innerHTML = gridHTML({ ...g, key: g.key.map((x, i) => (g.shown[i] || g.phase === 'over' ? x : null)) }, { hint: g.phase === 'over' });
    [0, 1].forEach(t => {
      root.querySelector('.fa-side.t' + t).innerHTML = `<b>${F.left(g, t)}</b><small>${F.TEAM[t].ic} ${F.TEAM[t].name}</small>`;
      root.querySelector('.fa-side.t' + t).classList.toggle('up', g.up === t && g.phase !== 'over');
    });
    root.querySelector('.fa-clue').innerHTML = g.clue ? `<b>${esc(g.clue.word)}</b><span>${g.clue.n || '∞'}</span>` : g.phase === 'over' ? '' : '<em>waiting for the clue…</em>';
    const msg = root.querySelector('.fa-msg');
    if (g.phase === 'over') msg.innerHTML = '';
    else if (g.phase === 'clue') msg.innerHTML = `<b>${esc(ctx.nameOf(g.handler[g.up]))}</b> (${F.TEAM[g.up].name}'s Handler) is thinking of a clue`;
    else msg.innerHTML = `<b>${F.TEAM[g.up].name}</b> · guess on your phones · ${g.clue.n ? `up to ${g.clue.n + 1 - g.guesses} more` : 'as many as you dare'}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const names = F.operatives(g, g.winner).concat(g.handler[g.winner]).map(s => ctx.nameOf(s)).join(', ');
    return {
      key: 'over' + g.moveId,
      html: `<h2>Team ${F.TEAM[g.winner].name} wins!</h2><p>${g.how === 'double' ? `Team ${F.TEAM[1 - g.winner].name} found the Double Agent` : 'Every agent found'} · ${names}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
