// Hot Dice on the table: the dice tumble onto a red felt tray; dice set aside this turn sit on
// a brass rail above, with the turn's running total.
import * as H from './hotdice.js?v=68';
import { dieHTML } from './table-yacht.js?v=68';
import { snap } from './cards.js?v=68';
import { centerMsg, clearMsg } from './table-hearts.js?v=68';

let root = null, key = '', lastRoll = -1;

export default {
  defaults: { target: 10000, entry: 500 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[3000, 5000, 10000].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n.toLocaleString()}</option>`).join('')}</select></label>
    <label>To get on the board <select data-set="entry">${[[0, 'Any score'], [350, '350 in a turn'], [500, '500 in a turn']].map(([v, t]) => `<option value="${v}" ${v === s.entry ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
  create: (settings, players) => H.createGame(settings, players),
  act: H.applyAction,
  bot: H.botAction,
  view: H.viewFor,
  turn: g => H.current(g),
  timer: g => H.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.endAt === s) badges.push('<span class="badge alone">reached the target</span>');
    if (g.phase === 'over' && g.winners.includes(s)) badges.push('<span class="badge got">🏆 winner</span>');
    return { badges, meta: `<span><b>${g.scores[s].toLocaleString()}</b></span>`, cards: 0, turn: H.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; lastRoll = -1; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'hotdice'; root.innerHTML = '<div class="hd-rail"></div><div class="hd-tray"></div><div class="hd-total"></div>'; document.getElementById('center').appendChild(root); }
    root.style.setProperty('--die', ctx.vmin * 9 + 'px');
    const k = JSON.stringify([g.moveId, g.phase]);
    if (k === key) return;
    key = k;
    const fresh = g.rollId !== lastRoll;
    if (fresh && lastRoll !== -1) snap(0.6);
    lastRoll = g.rollId;
    root.querySelector('.hd-rail').innerHTML = g.setAside.map(v => dieHTML(v, 'held')).join('');
    root.querySelector('.hd-tray').innerHTML = g.dice.map((v, i) => dieHTML(v, fresh ? 'tumble' : '').replace('class="ydie', `style="--r:${(i * 37) % 30 - 15}deg;--y:${(i * 13) % 5 - 2}" class="ydie`)).join('');
    root.querySelector('.hd-total').innerHTML = g.phase === 'bust' ? '<b class="bust">BUST</b>' : `<small>This turn</small><b>${g.turnPts.toLocaleString()}</b>`;
    root.classList.toggle('bust', g.phase === 'bust');
    if (g.phase === 'start') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> to roll`);
    else if (g.phase === 'choose') centerMsg(`<b>${ctx.nameOf(g.turn)}</b>: keep scoring dice, then roll on or bank`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return { key: 'over', html: `<h2>${g.winners.map(ctx.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}!</h2><ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s].toLocaleString()}</b></li>`).join('')}</ol><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
