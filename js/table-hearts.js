// Hearts on the table: the trick in the middle, a heart printed on the felt, each player's
// points this hand and in total on their plate.
import * as H from './hearts.js?v=64';
import { trickView } from './trickview.js?v=64';

const tv = trickView();
let msgEl = null;

export function centerMsg(html) {
  if (!msgEl) { msgEl = document.createElement('p'); msgEl.className = 'tk-msg'; document.getElementById('center').appendChild(msgEl); }
  msgEl.innerHTML = html;
}
export function clearMsg() { msgEl?.remove(); msgEl = null; }

export default {
  defaults: { target: 100 },
  settingsHTML: s => `<label>Game ends at <select data-set="target">${[50, 75, 100].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label>`,
  create: settings => H.createGame(settings),
  act: H.applyAction,
  bot: H.botAction,
  view: H.viewFor,
  turn: g => H.current(g),
  timer: (g, players) => H.tick(g, players),
  joinMidGame: () => false,

  plate(g, s) {
    const badges = [];
    if (g.phase === 'pass' && g.passes[s]) badges.push('<span class="badge got">passed</span>');
    if (g.taken[s] >= 13) badges.push('<span class="badge alone">♠Q</span>');
    if (g.phase === 'over' && g.winners.includes(s)) badges.push('<span class="badge got">🏆 winner</span>');
    return {
      badges,
      meta: `<span><b>${g.taken[s]}</b> this hand</span><span><b>${g.scores[s]}</b> total</span>`,
      cards: g.hands[s].length, turn: g.phase === 'play' && g.turn === s, out: false,
    };
  },

  reset() { tv.reset(); clearMsg(); },

  renderCenter(g, ctx) {
    const wm = document.getElementById('watermark');
    wm.textContent = '♥';
    wm.classList.add('red');
    tv.render(g.trick, ctx, { sweepTo: g.lastTrick?.winner, glow: g.phase === 'trickEnd' ? g.trickWinner : null });
    if (g.phase === 'pass') centerMsg(`Pass three cards <b>${g.passDir === 'across' ? 'across' : 'to the ' + g.passDir}</b>`);
    else if (g.phase === 'play' && g.trickNo === 0 && !g.trick.length) centerMsg(`<b>${ctx.nameOf(g.turn)}</b> leads the 2♣`);
    else centerMsg(g.broken ? '' : '<small>Hearts not broken yet</small>');
  },

  overlay(g, ctx) {
    if (g.phase !== 'handEnd' && g.phase !== 'over') return null;
    const r = g.result;
    const rows = [0, 1, 2, 3].map(s => `<li>${ctx.nameOf(s)} <span>+${r.add[s]}</span> <b>${g.scores[s]}</b></li>`).join('');
    const head = g.phase === 'over' ? `${g.winners.map(ctx.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}!` : r.moon >= 0 ? `${ctx.nameOf(r.moon)} shot the moon!` : 'Hand over';
    return {
      key: g.phase + g.handNo,
      html: `<h2>${head}</h2><p>${g.phase === 'over' ? 'Lowest score wins' : `First to ${g.settings.target} ends the game`}</p><ol class="scores">${rows}</ol>
        ${g.phase === 'over' ? '<div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>' : '<p class="hint">Next hand in a moment… <button class="tool" data-do="next">Deal now</button></p>'}`,
      next: () => { if (g.phase === 'handEnd') H.advance(g); },
    };
  },
};
