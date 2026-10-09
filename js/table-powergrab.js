// Power Grab on the table: in front of each player their two role cards (face down until lost)
// and their coins; in the middle the treasury and what's being claimed right now.
import * as P from './powergrab.js?v=66';
import { snap } from './cards.js?v=66';
import { centerMsg, clearMsg } from './table-hearts.js?v=66';

let root = null, key = '';
export const roleCard = (r, cls = '') => r ? `<div class="pg-card ${cls}" style="--c:${P.ROLES[r].col}"><b>${P.ROLES[r].ic}</b><strong>${P.ROLES[r].name}</strong><em>${P.ROLES[r].text}</em></div>` : `<div class="pg-card back ${cls}"><b>⚜️</b></div>`;
export function claimText(p, nameOf) {
  if (!p) return '';
  const A = P.ACTS[p.act];
  let t = `${nameOf(p.actor)}: ${A.name}${p.claim ? ` (claims ${P.ROLES[p.claim].ic} ${P.ROLES[p.claim].name})` : ''}${p.target != null ? ` → ${nameOf(p.target)}` : ''}`;
  if (p.blocker != null) t += ` · ${nameOf(p.blocker)} blocks with ${P.ROLES[p.blockRole].ic} ${P.ROLES[p.blockRole].name}`;
  return t;
}
const STAGE = { challengeAct: 'anyone may call the bluff', block: 'can it be blocked?', challengeBlock: 'anyone may call the block a bluff' };

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Bluff, call bluffs, and be the last one standing</span>',
  create: (settings, players) => P.createGame(settings, players),
  act: P.applyAction,
  bot: P.botAction,
  view: P.viewFor,
  turn: g => P.current(g),
  timer: (g, players) => P.tick(g, players),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (!P.alive(g, s)) badges.push('<span class="badge off">exiled</span>');
    if (g.phase === 'window' && g.p.waiting.includes(s)) badges.push('<span class="badge">deciding…</span>');
    if (g.phase === 'over' && g.winner === s) badges.push('<span class="badge got">👑 winner</span>');
    return { badges, meta: `<span>🪙 <b>${g.coins[s]}</b></span>`, cards: 0, turn: P.current(g) === s || (g.phase === 'window' && g.p.waiting.includes(s)), out: !P.alive(g, s) };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'powergrab'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.moveId, g.phase, ctx.upright, Math.round(ctx.vmin)]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    let h = `<div class="pg-mid"><div class="pg-court"><b>${g.court.length}</b><small>in the court</small></div>${g.p ? `<div class="pg-claim">${g.p.claim ? roleCard(g.p.claim, 'claim') : ''}</div>` : ''}</div>`;
    for (const s of g.order) {
      const pt = ctx.inset(s, 18);
      h += `<div class="pg-seat ${P.alive(g, s) ? '' : 'out'}" style="transform: translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ctx.rot(s)}deg)">${g.cards[s].map(c => roleCard(c.up ? c.role : null, c.up ? 'lost' : '')).join('')}<span class="pg-coins">${'🪙'.repeat(Math.min(g.coins[s], 10))}<b>${g.coins[s]}</b></span></div>`;
    }
    root.innerHTML = h;
    if (g.phase === 'window') centerMsg(`${claimText(g.p, ctx.nameOf)} · <b>${STAGE[g.p.stage]}</b>`);
    else if (g.phase === 'lose') centerMsg(`<b>${ctx.nameOf(g.loseQ[0].seat)}</b> must give up a card`);
    else if (g.phase === 'exchange') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> is swapping roles with the court`);
    else if (g.phase === 'act') centerMsg(`<b>${ctx.nameOf(g.turn)}</b>'s move`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over',
      html: `<h2>${ctx.nameOf(g.winner)} takes the throne!</h2><p>The last one with any influence left</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
