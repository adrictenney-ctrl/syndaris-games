// Bingo on the table: the ball just called, big, and the caller's board of all 75 numbers with
// every called one lit. With the "host calls" pace, tap Next ball.
import * as B from './bingo.js?v=68';
import { chime, ding } from './sfx.js?v=68';
import { centerMsg, clearMsg } from './table-hearts.js?v=68';

let root = null, key = '', gameRef = null, ctxRef = null, lastBall = null;
const PAT = { line: 'Any line', corners: 'Four corners', full: 'Full card' };

export default {
  defaults: { pattern: 'line', pace: 8, auto: true },
  settingsHTML: s => `<label>To win <select data-set="pattern" data-str="1">${Object.entries(PAT).map(([v, t]) => `<option value="${v}" ${v === s.pattern ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label>Calls <select data-set="pace">${[[5, 'Every 5 seconds'], [8, 'Every 8 seconds'], [12, 'Every 12 seconds'], [0, 'The host taps Next ball']].map(([v, t]) => `<option value="${v}" ${v === s.pace ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-set="auto" ${s.auto ? 'checked' : ''}> Phones daub automatically</label>`,
  applySetting(s, k, el) { if (k === 'pattern') { s.pattern = el.value; return true; } return false; },
  create: (settings, players) => B.createGame(settings, players),
  act: B.applyAction,
  bot: B.botAction,
  view: B.viewFor,
  turn: () => -1,
  timer: (g, players) => B.tick(g, players),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.winners.includes(s)) badges.push('<span class="badge got">BINGO!</span>');
    if (g.penalty[s]) badges.push(`<span class="badge alone">sitting out ${g.penalty[s]}</span>`);
    const marked = g.cards[s].filter(n => n === 0 || g.called.includes(n)).length;
    return { badges, meta: `<span><b>${marked}</b>/25 marked</span>`, cards: 0, turn: false, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; lastBall = null; clearMsg(); },
  renderCenter(g, ctx) {
    gameRef = g; ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    if (!root) {
      root = document.createElement('div');
      root.id = 'bingo';
      root.addEventListener('click', e => { if (e.target.closest('#bgNext') && gameRef.phase === 'play') ctxRef.act(gameRef.order[0], { type: 'call' }); });
      document.getElementById('center').appendChild(root);
    }
    if (g.moveId === key) return;
    key = g.moveId;
    const last = g.called[g.called.length - 1];
    if (last !== lastBall && lastBall !== null) ding();
    if (g.winners.length && g.phase === 'over') chime();
    lastBall = last ?? null;
    const board = 'BINGO'.split('').map((L, c) => `<div class="bg-col"><b>${L}</b>${[...Array(15)].map((_, i) => { const n = c * 15 + i + 1; return `<i class="${g.called.includes(n) ? 'on' : ''} ${n === last ? 'last' : ''}">${n}</i>`; }).join('')}</div>`).join('');
    root.innerHTML = `<div class="bg-ball ${last ? '' : 'empty'}" data-k="${last}">${last ? `<small>${B.LETTER(last)}</small><b>${last}</b>` : '<small>ready</small>'}</div>
      <div class="bg-board">${board}</div>
      <div class="bg-info">${PAT[g.settings.pattern]} · ${g.called.length} of 75 called${g.settings.pace === 0 && g.phase === 'play' ? ' · <button class="tool" id="bgNext" data-tv>Next ball ▶</button>' : ''}</div>`;
    centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return { key: 'over', html: `<h2>${g.winners.length ? `BINGO! ${g.winners.map(ctx.nameOf).join(' & ')}` : 'No winner this time'}</h2><p>${PAT[g.settings.pattern]} after ${g.called.length} balls</p><div class="buttons"><button class="big" data-do="again">New cards</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
