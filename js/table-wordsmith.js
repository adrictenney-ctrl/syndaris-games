// Wordsmith on the table: the 15×15 board in walnut and cream with our bonus squares, the
// tiles in play (the latest word lit up), the bag, and a list of the words played.
import * as W from './wordsmith.js?v=56';
import { snap } from './cards.js?v=56';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Load the word list once (an open-source list of English words). If it can't load, every
// word is accepted and the players keep each other honest.
const WORDS_URL = 'https://cdn.jsdelivr.net/npm/word-list@4.0.0/words.txt';
let loading = false;
function loadDictionary() {
  if (loading || W.dictionaryReady()) return;
  loading = true;
  fetch(WORDS_URL).then(r => (r.ok ? r.text() : Promise.reject(r.status)))
    .then(t => W.setDictionary(new Set(t.split('\n').map(w => w.trim()).filter(Boolean))))
    .catch(() => W.setDictionary(false))
    .finally(() => { key = ''; window.dispatchEvent(new Event('resize')); });
}

const LABEL = { W3: '3×<br>word', W2: '2×<br>word', L3: '3×<br>letter', L2: '2×<br>letter' };
export const tileHTML = (t, cls = '') => `<span class="ws-tile ${cls}${t && t === t.toLowerCase() && t !== '?' ? ' blank' : ''}">${t === '?' ? '' : t.toUpperCase()}<sub>${W.tileValue(t) || ''}</sub></span>`;

// The board. opts: { pending: {i: letter}, last: Set, clickable }
export function boardHTML(g, opts = {}) {
  let h = '';
  for (let i = 0; i < W.N * W.N; i++) {
    const t = g.board[i] || opts.pending?.[i];
    const b = W.BONUS[i];
    const cls = ['ws-sq'];
    if (b) cls.push(b);
    if (i === W.CENTER) cls.push('star');
    h += `<div class="${cls.join(' ')}" data-i="${i}">${t ? tileHTML(t, opts.pending?.[i] ? 'pending' : opts.last?.has(i) ? 'last' : '') : b ? `<em>${i === W.CENTER ? '★' : LABEL[b]}</em>` : ''}</div>`;
  }
  return `<div class="ws-board">${h}</div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'wordsmith';
  root.innerHTML = `<div class="ws-wrap"></div><div class="ws-side"><p class="ws-bag"></p><ol class="ws-log"></ol><p class="ws-now"></p></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { level: 'normal' },
  settingsHTML: s => `<label>Computer <select data-set="level" data-str="1">${[['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']].map(([v, t]) => `<option value="${v}" ${v === s.level ? 'selected' : ''}>${t}</option>`).join('')}</select></label><span class="yc-note">All seven tiles at once: +${W.BINGO}</span>`,
  applySetting(s, k, el) { if (k !== 'level') return false; s.level = el.value; return true; },
  create: (settings, players) => { loadDictionary(); return W.createGame(settings, players); },
  act: W.applyAction,
  bot: W.botAction,
  view: W.viewFor,
  // Bots wait for the dictionary before they play.
  turn: g => (g.phase === 'play' && W.dictionaryReady() ? W.current(g) : -1),
  timer: g => (g.phase === 'play' && !W.dictionaryReady() ? { ms: 500, run: () => {} } : null),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    return { badges, meta: `<span><b>${g.scores[seat]}</b> points</span><span>${g.racks[seat].length} tiles</span>`, cards: 0, turn: g.phase === 'play' && W.current(g) === seat, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    loadDictionary();
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const B = Math.min(felt.height - v * 30, felt.width - v * 90);
    root.style.setProperty('--B', B + 'px');
    const k = JSON.stringify([g.moveId, g.phase, W.dictionaryReady(), Math.round(B)]);
    if (k === key) return;
    if (key && g.last) snap(0.4);
    key = k;
    root.querySelector('.ws-wrap').innerHTML = boardHTML(g, { last: new Set(g.last?.cells || []) });
    root.querySelector('.ws-bag').innerHTML = W.dictionaryReady() ? `<b>${g.bag.length}</b> tiles in the bag` : 'Loading the dictionary…';
    root.querySelector('.ws-log').innerHTML = g.log.slice(-8).map(l => `<li><i style="background:var(--seat-${l.seat})"></i>${esc(l.text)}<b>${l.score}</b></li>`).join('');
    root.querySelector('.ws-now').innerHTML = g.phase === 'play' ? `<b>${esc(ctx.nameOf(W.current(g)))}</b> to play` : '';
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} win${g.winners.length > 1 ? '' : 's'}</h2><p>Leftover tiles count against you</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
