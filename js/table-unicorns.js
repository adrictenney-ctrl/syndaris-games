// Unicorn Chaos on the table: each player's stable (their unicorns in a row, with any Upgrades
// and Downgrades beside them), the card being played right now, and who can still stop it.
import * as U from './unicorns.js?v=66';
import { snap } from './cards.js?v=66';
import { centerMsg, clearMsg } from './table-hearts.js?v=66';

let root = null, key = '';
const TYPE = { unicorn: 'Unicorn', magic: 'Magic', up: 'Upgrade', down: 'Downgrade', instant: 'Instant' };

export function ucCard(id, cls = '') {
  const c = U.card(id), d = U.DEF[c.k];
  const hue = c.hue ?? { unicorn: 290, magic: 200, up: 140, down: 0, instant: 40 }[d.t];
  return `<div class="uc-card t-${d.t} ${c.k === 'baby' ? 'baby' : ''} ${cls}" style="--h:${hue}"><small>${TYPE[d.t]}</small><b>${d.ic}</b><strong>${U.cardName(id)}</strong><em>${d.text}</em></div>`;
}
export const ucMini = id => { const c = U.card(id), d = U.DEF[c.k]; return `<span class="uc-mini t-${d.t}" style="--h:${c.hue ?? { unicorn: 290, up: 140, down: 0 }[d.t] ?? 290}" title="${U.cardName(id)}">${d.ic}</span>`; };

export function describe(p, nameOf) {
  const d = U.def(p.id), a = p.a;
  let t = `${nameOf(p.seat)} plays ${d.ic} ${U.cardName(p.id)}`;
  if (a.player != null && (d.t === 'down' || d.target === 'player')) t += ` on ${nameOf(Number(a.player))}`;
  if (a.unicorn != null) t += ` → ${U.cardName(Number(a.unicorn))}`;
  if (p.chain.length) t += ` · ${p.chain.map(x => (x.super ? '🔥' : '✋') + nameOf(x.seat)).join(' ')}`;
  return t;
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">First to seven unicorns (six with six players)</span>',
  create: (settings, players) => U.createGame(settings, players),
  act: U.applyAction,
  bot: U.botAction,
  view: U.viewFor,
  turn: g => U.current(g),
  timer: (g, players) => U.tick(g, players),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'over' && g.winner === s) badges.push('<span class="badge got">🏆 winner</span>');
    if (g.phase === 'respond' && g.pending.waiting.includes(s)) badges.push('<span class="badge alone">deciding…</span>');
    return { badges, meta: `<span>🦄 <b>${g.stable[s].length}</b>/${g.goal}</span>`, cards: Math.min(g.hands[s].length, 10), turn: U.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'unicorns'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.moveId, g.phase, ctx.upright, Math.round(ctx.vmin)]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    let h = '';
    for (const s of g.order) {
      const pt = ctx.inset(s, 24);
      h += `<div class="uc-stable" style="transform: translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ctx.rot(s)}deg)"><div class="uc-row">${g.stable[s].map(ucMini).join('')}</div>${g.mods[s].length ? `<div class="uc-row mods">${g.mods[s].map(ucMini).join('')}</div>` : ''}</div>`;
    }
    h += g.pending ? `<div class="uc-now">${ucCard(g.pending.id, 'big')}</div>` : `<div class="uc-deck"><b>${g.deck.length}</b><small>cards</small></div>`;
    root.innerHTML = h;
    if (g.pending) centerMsg(describe(g.pending, ctx.nameOf) + (g.phase === 'respond' ? ' · <b>anyone holding Hold Your Horses! can stop it</b>' : ''));
    else if (g.phase === 'action') centerMsg(`<b>${ctx.nameOf(g.turn)}</b>'s turn · play a card or draw`);
    else if (g.phase === 'discard') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> discards down to seven`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over',
      html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>A stable of ${g.stable[g.winner].length} unicorns 🦄</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
