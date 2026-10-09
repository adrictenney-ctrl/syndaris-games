// Five-Card Draw on the table: the pot in the middle, bets on the plates, and at the showdown
// everyone's five cards turned up in front of them.
import * as D from './drawpoker.js?v=65';
import { cardEl, snap } from './cards.js?v=65';
import { centerMsg, clearMsg } from './table-hearts.js?v=65';

let root = null, key = '';

export default {
  defaults: { chips: 500 },
  settingsHTML: s => `<label>Starting chips <select data-set="chips">${[200, 500, 1000].map(n => `<option value="${n}" ${n === s.chips ? 'selected' : ''}>${n}</option>`).join('')}</select></label><span class="yc-note">Ante 5 · bets of 10, then 20 after the draw</span>`,
  create: (settings, players) => D.createGame(settings, players),
  act: D.applyAction,
  bot: D.botAction,
  view: D.viewFor,
  turn: g => D.current(g),
  timer: g => D.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const p = g.p[s], badges = [];
    if (g.dealer === s) badges.push('<span class="badge dealer">DEALER</span>');
    if (p?.folded) badges.push('<span class="badge off">folded</span>');
    if (p?.allIn) badges.push('<span class="badge alone">all in</span>');
    if (p?.drew != null && g.phase !== 'handEnd') badges.push(`<span class="badge">drew ${p.drew}</span>`);
    if (g.result?.pots.some(x => x.winners.includes(s))) badges.push('<span class="badge got">wins</span>');
    if (!g.chips[s] && !p) badges.push('<span class="badge off">out</span>');
    return { badges, meta: `<span><b>${g.chips[s]}</b> chips</span>${p?.bet ? `<span>bet <b>${p.bet}</b></span>` : ''}`, cards: p && !p.folded && g.phase !== 'handEnd' && g.phase !== 'over' ? 5 : 0, turn: D.current(g) === s, out: !p || p.folded };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'drawpoker'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.moveId, g.phase, ctx.upright]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.style.setProperty('--cw', ctx.vmin * 6.4 * ctx.cardScale + 'px');
    root.innerHTML = `<div class="dp-pot"><small>Pot</small><b>${D.pot(g)}</b></div>`;
    if (g.result && !g.result.fold) {
      for (const [s, h] of Object.entries(g.result.hands)) {
        const pt = ctx.inset(Number(s), 21);
        const box = document.createElement('div');
        box.className = 'dp-show' + (g.result.pots.some(x => x.winners.includes(Number(s))) ? ' win' : '');
        box.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ctx.rot(Number(s))}deg)`;
        h.cards.forEach(c => box.appendChild(cardEl(c)));
        box.insertAdjacentHTML('beforeend', `<small>${h.text}</small>`);
        root.appendChild(box);
      }
    }
    const t = D.current(g);
    if (g.phase === 'draw') centerMsg(`The draw · <b>${ctx.nameOf(t)}</b> swaps up to three`);
    else if (t >= 0) centerMsg(`<b>${ctx.nameOf(t)}</b> to act · ${g.bet ? `${g.bet} to stay in` : 'no bet yet'} · bets of ${D.step(g)}`);
    else if (g.result) centerMsg(g.result.pots.map(p => `${p.winners.map(ctx.nameOf).join(' & ')} win${p.winners.length > 1 ? '' : 's'} ${p.amount}`).join(' · '));
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.handNo,
      html: `<h2>${ctx.nameOf(g.winner)} takes every chip!</h2><p>After ${g.handNo} hands</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
