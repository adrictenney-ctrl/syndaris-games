// Line Up 5 on the table: the 10×10 card board on green felt, chips in team colours (chips in a
// finished line get a gold ring), the last chip pulsing.
import * as L from './lineup5.js?v=65';
import { snap, SUIT_SYMBOL } from './cards.js?v=65';
import { centerMsg, clearMsg } from './table-hearts.js?v=65';

let root = null, key = '';
const label = c => (c === '*' ? '★' : `${c[0] === 'T' ? '10' : c[0]}<i>${SUIT_SYMBOL[c[1]]}</i>`);
export function boardHTML(g, { ok = [], tap = false } = {}) {
  return `<div class="l5-board">${L.BOARD.map((c, i) => {
    const chip = g.chips[i];
    const red = c !== '*' && 'HD'.includes(c[1]);
    return `<${tap ? 'button' : 'div'} class="l5-cell ${red ? 'red' : ''} ${c === '*' ? 'free' : ''} ${ok.includes(i) ? 'ok' : ''}" data-i="${i}"><span>${label(c)}</span>${chip != null ? `<b class="l5-chip ${g.locked[i] != null ? 'locked' : ''} ${g.last?.i === i ? 'last' : ''}" style="--c:${L.TEAM_COLOR[chip]}"></b>` : ''}${g.last?.removed && g.last.i === i ? '<b class="l5-gone">✂</b>' : ''}</${tap ? 'button' : 'div'}>`;
  }).join('')}</div>`;
}

export default {
  defaults: { teams: 2 },
  settingsHTML: s => `<label>Teams <select data-set="teams">${[[2, 'Two teams'], [3, 'Three teams (3, 6 or 9 players)']].map(([v, t]) => `<option value="${v}" ${v === s.teams ? 'selected' : ''}>${t}</option>`).join('')}</select></label><span class="yc-note">Teams alternate around the table</span>`,
  create: (settings, players) => L.createGame(settings, players),
  act: L.applyAction,
  bot: L.botAction,
  view: L.viewFor,
  turn: g => L.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const t = g.team[s];
    const badges = g.phase === 'over' && g.winner === t ? ['<span class="badge got">🏆 winners</span>'] : [];
    return { badges, meta: `<span class="l5-team" style="--c:${L.TEAM_COLOR[t]}">● ${L.TEAM_NAME[t]}</span><span><b>${g.lines[t]}</b>/${g.need} lines</span>`, cards: g.hands[s].length, turn: L.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'lineup5'; document.getElementById('center').appendChild(root); }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--B', Math.min(felt.height - v * 16, felt.width - v * 60) + 'px');
    if (g.moveId === key) return;
    if (key !== '') snap(0.4);
    key = g.moveId;
    root.innerHTML = boardHTML(g);
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const names = t => g.order.filter(s => g.team[s] === t).map(ctx.nameOf).join(' & ');
    return { key: 'over', html: `<h2>${g.winner == null ? 'Out of cards — a draw' : `${L.TEAM_NAME[g.winner]} wins!`}</h2><p>${g.winner == null ? '' : names(g.winner)}</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
