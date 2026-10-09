// Cornerstones on the table: the 20×20 board on a slate stand, each colour's starting corner
// marked, the last piece outlined.
import * as C from './cornerstones.js?v=68';
import { snap } from './cards.js?v=68';
import { centerMsg, clearMsg } from './table-hearts.js?v=68';

let root = null, key = '';
export function boardSVG(g, { ghost = null, ghostOk = true, tap = false } = {}) {
  const N = C.N;
  let h = `<rect x="-.3" y="-.3" width="${N + .6}" height="${N + .6}" rx=".4" fill="#2a2e36"/>`;
  for (let i = 0; i < N * N; i++) {
    const x = i % N, y = Math.floor(i / N), v = g.board[i];
    h += `<rect x="${x + .06}" y="${y + .06}" width=".88" height=".88" rx=".12" fill="${v == null ? '#3a404a' : C.COLOR[v]}" ${v != null ? 'class="cs-sq"' : ''}/>`;
    if (tap) h += `<rect data-i="${i}" x="${x}" y="${y}" width="1" height="1" fill="transparent"/>`;
  }
  C.CORNER.forEach(([x, y], k) => { if (g.colors.includes(k) && g.board[y * N + x] == null) h += `<circle cx="${x + .5}" cy="${y + .5}" r=".28" fill="${C.COLOR[k]}"/>`; });
  if (g.last) for (const i of g.last) h += `<rect x="${i % N + .06}" y="${Math.floor(i / N) + .06}" width=".88" height=".88" rx=".12" fill="none" stroke="#fff" stroke-width=".1"/>`;
  if (ghost) for (const [x, y] of ghost) if (x >= 0 && y >= 0 && x < N && y < N) h += `<rect x="${x + .1}" y="${y + .1}" width=".8" height=".8" rx=".12" fill="${ghostOk ? C.COLOR[g.color] : '#888'}" opacity=".7" stroke="${ghostOk ? '#fff' : '#f55'}" stroke-width=".08"/>`;
  return `<svg viewBox="-.5 -.5 ${N + 1} ${N + 1}" class="cs-board">${h}</svg>`;
}
export function pieceSVG(cells, color, size = 5) {
  const w = Math.max(...cells.map(c => c[0])) + 1, hgt = Math.max(...cells.map(c => c[1])) + 1;
  return `<svg viewBox="-.1 -.1 ${Math.max(w, hgt) + .2} ${Math.max(w, hgt) + .2}" class="cs-piece">${cells.map(([x, y]) => `<rect x="${x + .05}" y="${y + .05}" width=".9" height=".9" rx=".15" fill="${color}"/>`).join('')}</svg>`;
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Two players control two colours each</span>',
  create: (settings, players) => C.createGame(settings, players),
  act: C.applyAction,
  bot: C.botAction,
  view: C.viewFor,
  turn: g => C.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const mine = g.colors.map((c, i) => (g.owner[i] === s ? i : -1)).filter(i => i >= 0);
    const sq = mine.reduce((t, ci) => t + g.left[ci].reduce((u, p) => u + C.PIECES[p].length, 0), 0);
    const badges = g.phase === 'over' && g.winners.includes(s) ? ['<span class="badge got">🏆 winner</span>'] : [];
    return { badges, meta: `${mine.map(ci => `<i class="cs-dot" style="background:${C.COLOR[g.colors[ci]]}"></i>`).join('')}<span><b>${sq}</b> squares left</span>`, cards: 0, turn: C.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'cornerstones'; document.getElementById('center').appendChild(root); }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--B', Math.min(felt.height - v * 16, felt.width - v * 60) + 'px');
    if (g.moveId === key) return;
    if (key !== '') snap(0.4);
    key = g.moveId;
    root.innerHTML = boardSVG(g);
    centerMsg(g.phase === 'play' ? `<b>${ctx.nameOf(C.current(g))}</b> places a <span style="color:${C.COLOR[g.colors[g.ci]]}">■</span> ${C.COLOR_NAME[g.colors[g.ci]]} piece` : '');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.score[b] - g.score[a]);
    return { key: 'over', html: `<h2>${g.winners.map(ctx.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}!</h2><p>−1 per square left · +15 for placing everything</p><ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.score[s]}</b></li>`).join('')}</ol><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
