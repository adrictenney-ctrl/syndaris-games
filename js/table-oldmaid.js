// Old Maid on the table: everyone's hand as a face-down fan on their plate, the discarded pairs
// heaped in the middle, and who's taking from whom.
import * as O from './oldmaid.js?v=65';
import { cardEl, snap } from './cards.js?v=65';
import { centerMsg, clearMsg } from './table-hearts.js?v=65';

let root = null, key = '';

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">One queen is taken out. Don\'t get stuck with the Old Maid!</span>',
  create: (settings, players) => O.createGame(settings, players),
  act: O.applyAction,
  bot: O.botAction,
  view: O.viewFor,
  turn: g => O.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.safe.includes(s)) badges.push('<span class="badge got">safe</span>');
    if (g.phase === 'over' && g.loser === s) badges.push('<span class="badge alone">Old Maid!</span>');
    return { badges, meta: `<span><b>${g.hands[s].length}</b> cards</span><span><b>${g.pairs[s]}</b> pairs</span>`, cards: Math.min(g.hands[s].length, 14), turn: g.phase === 'play' && g.turn === s, out: g.safe.includes(s) };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'oldmaid'; document.getElementById('center').appendChild(root); }
    root.style.setProperty('--cw', ctx.vmin * 9 * ctx.cardScale + 'px');
    const k = JSON.stringify([g.moveId, g.phase]);
    if (k === key) return;
    if (key) snap(0.4);
    key = k;
    const n = g.pairs.reduce((a, b) => a + b, 0);
    root.innerHTML = '';
    for (let i = 0; i < Math.min(n, 14); i++) {
      const c = cardEl(null, true);
      c.style.transform = `translate(-50%, -50%) rotate(${(i * 47) % 70 - 35}deg) translate(${(i * 13) % 9 - 4}vmin, ${(i * 7) % 7 - 3}vmin)`;
      root.appendChild(c);
    }
    if (g.last?.card) { const c = cardEl(g.last.card); c.classList.add('om-top'); root.appendChild(c); }
    if (g.phase === 'play') {
      const from = O.victim(g, g.turn);
      centerMsg(`<b>${ctx.nameOf(g.turn)}</b> takes a card from <b>${ctx.nameOf(from)}</b>${g.last ? ` · ${g.last.paired ? `${ctx.nameOf(g.last.to)} made a pair` : `${ctx.nameOf(g.last.to)} kept it`}` : ''}`);
    } else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over',
      html: `<h2>${ctx.nameOf(g.loser)} is the Old Maid!</h2><p>Safe, in order: ${g.safe.map(ctx.nameOf).join(', ')}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
