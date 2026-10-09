// Don't Say It on the table: the two teams' scores, the clock, and who's giving clues. The card
// itself is only on the clue-giver's phone (and the other team's, so they can buzz). At the end
// of a turn the words are listed.
import * as D from './dontsay.js?v=66';
import { buzzer, ding, beep } from './sfx.js?v=66';
import { centerMsg, clearMsg } from './table-hearts.js?v=66';

export const TEAMS = ['Team Ruby', 'Team Teal'];
let root = null, key = '', gameRef = null, clockT = null, lastAnn = 0, lastSec = -1;
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// A shared clock for timed party games: paints .pt-clock from g.endAt.
export function partyClock(getG, sel = '.pt-clock') {
  return setInterval(() => {
    const g = getG(), el = document.querySelector(sel);
    if (!g || !el || !g.endAt) return;
    const left = g.endAt - Date.now();
    if (left > 0 && left < 6000) { const s = Math.ceil(left / 1000); if (s !== lastSec) { lastSec = s; beep(true); } }
    el.textContent = fmt(left);
    el.classList.toggle('low', left < 10000);
  }, 200);
}

export default {
  defaults: { secs: 60, rounds: 2, skipCost: 0 },
  settingsHTML: s => `<label>Turn <select data-set="secs">${[45, 60, 90].map(n => `<option value="${n}" ${n === s.secs ? 'selected' : ''}>${n} seconds</option>`).join('')}</select></label>
    <label>Length <select data-set="rounds">${[[1, 'Everyone gives clues once'], [2, 'Everyone gives clues twice']].map(([v, t]) => `<option value="${v}" ${v === s.rounds ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label>Skips <select data-set="skipCost">${[[0, 'Free'], [1, 'Cost a point']].map(([v, t]) => `<option value="${v}" ${v === s.skipCost ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  create: (settings, players) => D.createGame(settings, players),
  act: D.applyAction,
  bot: D.botAction,
  view: D.viewFor,
  turn: g => D.current(g),
  timer: g => D.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const t = g.team[s], badges = [];
    if (D.giver(g) === s && g.phase !== 'over') badges.push('<span class="badge got">🗣 clues</span>');
    if (g.phase === 'over' && g.winner === t) badges.push('<span class="badge got">🏆 winners</span>');
    return { badges, meta: `<span class="pt-team t${t}">● ${TEAMS[t]}</span>`, cards: 0, turn: D.giver(g) === s && g.phase !== 'over', out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearInterval(clockT); clearMsg(); },
  renderCenter(g, ctx) {
    gameRef = g;
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'dontsay'; root.className = 'pt-wrap'; document.getElementById('center').appendChild(root); clockT = partyClock(() => gameRef); }
    if (g.announce && g.announce.id !== lastAnn) { if (lastAnn) buzzer(); lastAnn = g.announce.id; }
    if (g.moveId === key) return;
    if (key !== '' && g.phase === 'clue') ding();
    if (key !== '' && g.phase === 'end') buzzer();
    key = g.moveId;
    const G = D.giver(g);
    const scores = `<div class="pt-scores">${[0, 1].map(t => `<div class="pt-score t${t} ${g.up === t && g.phase !== 'over' ? 'up' : ''}"><small>${TEAMS[t]}</small><b>${g.scores[t]}</b></div>`).join('')}</div>`;
    let mid = '';
    if (g.phase === 'ready') mid = `<p class="pt-big"><b>${ctx.nameOf(G)}</b> gives clues for ${TEAMS[g.up]}</p><p class="pt-sub">Tap Start on your phone when you’re ready</p>`;
    else if (g.phase === 'clue') mid = `<div class="pt-clock"></div><p class="pt-sub"><b>${ctx.nameOf(G)}</b> is describing · ${g.log.length} card${g.log.length === 1 ? '' : 's'} so far</p><p class="pt-sub">${TEAMS[1 - g.up]}: watch for forbidden words and BUZZ!</p>`;
    else if (g.phase === 'end') mid = '<p class="pt-big">Time!</p><ul class="pt-log"></ul>';
    root.innerHTML = scores + mid;
    if (g.phase === 'end') root.querySelector('.pt-log').innerHTML = D.viewFor(g, G).log.map(x => `<li class="${x.r}">${x.r === 'got' ? '✓' : x.r === 'buzz' ? '🚨' : '↷'} ${x.word}</li>`).join('') || '<li>No cards</li>';
    centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return { key: 'over', html: `<h2>${g.winner == null ? "It's a tie!" : `${TEAMS[g.winner]} wins!`}</h2><p>${TEAMS[0]} ${g.scores[0]} · ${TEAMS[1]} ${g.scores[1]}</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
