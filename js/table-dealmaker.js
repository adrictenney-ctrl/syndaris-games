// Deal Maker on the table: in front of each player, their property sets (a complete set glows)
// and their bank total; in the middle the draw pile and whatever deal is happening right now.
import * as D from './dealmaker.js?v=66';
import { snap } from './cards.js?v=66';
import { centerMsg, clearMsg } from './table-hearts.js?v=66';

let root = null, key = '';
const C = D.CARDS;

// One card, full size (phone hand) or small.
export function dmCard(id, cls = '') {
  const c = C[id];
  if (c.kind === 'money') return `<div class="dm-card money ${cls}"><b>${c.val}</b><small>million</small></div>`;
  if (c.kind === 'prop') {
    if (c.rainbow) return `<div class="dm-card prop rainbow ${cls}"><i></i><b>Any colour</b><small>wild property</small></div>`;
    const cols = c.colors.map(k => D.COLORS[k]);
    if (cols.length > 1) return `<div class="dm-card prop wild2 ${cls}" style="--c1:${cols[0].col};--c2:${cols[1].col}"><i></i><b>${cols[0].name} / ${cols[1].name}</b><small>wild · ${c.val}M</small></div>`;
    const k = D.COLORS[c.colors[0]];
    return `<div class="dm-card prop ${cls}" style="--c1:${k.col}"><i></i><b>${k.name}</b><small>rent ${k.rent.join('·')} · set of ${k.size}</small><em>${c.val}M</em></div>`;
  }
  if (c.kind === 'rent') {
    if (c.wild) return `<div class="dm-card rent rainbow ${cls}"><i></i><b>Rent</b><small>any colour, one player</small><em>${c.val}M</em></div>`;
    return `<div class="dm-card rent ${cls}" style="--c1:${D.COLORS[c.colors[0]].col};--c2:${D.COLORS[c.colors[1]].col}"><i></i><b>Rent</b><small>everyone pays</small><em>${c.val}M</em></div>`;
  }
  const a = D.ACTIONS[c.act];
  return `<div class="dm-card action a-${c.act} ${cls}"><b>${a.name}</b><small>${a.tip}</small><em>${a.val}M</em></div>`;
}

// A player's property sets as little coloured stacks.
export function setsHTML(g, s) {
  return Object.entries(g.props[s]).map(([col, ids]) => {
    const k = D.COLORS[col], done = ids.length >= k.size, b = g.builds[s][col] || {};
    return `<div class="dm-set ${done ? 'done' : ''}" style="--c1:${k.col}"><div class="dm-pips">${ids.map(id => `<i class="${C[id].colors.length > 1 ? 'w' : ''}"></i>`).join('')}${Array(Math.max(0, k.size - ids.length)).fill('<i class="empty"></i>').join('')}</div><small>${k.name}${b.shop != null ? ' 🏪' : ''}${b.tower != null ? ' 🏢' : ''}</small></div>`;
  }).join('');
}
export const bankTotal = (g, s) => g.bank[s].reduce((t, id) => t + C[id].val, 0);

export function pendingText(p, nameOf) {
  if (!p) return '';
  const who = nameOf(p.to), vic = nameOf(p.from);
  const what = p.kind === 'pay' ? `${vic} owes ${who} ${p.amount}M (${p.why})` : p.kind === 'takeover' ? `${who} is taking ${vic}'s ${D.COLORS[p.color].name} set` : p.kind === 'snatch' ? `${who} is snatching a property from ${vic}` : `${who} wants to swap properties with ${vic}`;
  return what + (p.nopes ? ` · Nope! ×${p.nopes}` : '');
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">First to three complete sets of different colours wins</span>',
  create: (settings, players) => D.createGame(settings, players),
  act: D.applyAction,
  bot: D.botAction,
  view: D.viewFor,
  turn: g => D.current(g),
  timer: () => null,
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.phase === 'over' && g.winner === s) badges.push('<span class="badge got">🏆 winner</span>');
    if (g.pending && g.pending.from === s && g.phase === 'pay') badges.push('<span class="badge alone">paying…</span>');
    return { badges, meta: `<span><b>${D.completeSets(g, s).length}</b>/3 sets</span><span>bank <b>${bankTotal(g, s)}M</b></span>`, cards: Math.min(g.hands[s].length, 10), turn: D.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'dealmaker'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.moveId, g.phase, ctx.upright, Math.round(ctx.vmin)]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    let h = `<div class="dm-mid"><div class="dm-deck"><b>${g.deck.length}</b><small>draw pile</small></div>${g.discard.length ? dmCard(g.discard[g.discard.length - 1], 'small') : ''}</div>`;
    for (const s of g.order) {
      const pt = ctx.inset(s, 24);
      h += `<div class="dm-area" style="transform: translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${ctx.rot(s)}deg)">${setsHTML(g, s) || '<em>no properties yet</em>'}</div>`;
    }
    root.innerHTML = h;
    if (g.pending) centerMsg(pendingText(g.pending, ctx.nameOf) + (g.phase === 'respond' ? ` · <b>${ctx.nameOf(g.pending.responder)}</b> may say Nope!` : ''));
    else if (g.phase === 'play') centerMsg(`<b>${ctx.nameOf(g.turn)}</b>'s turn · ${3 - g.plays} play${3 - g.plays === 1 ? '' : 's'} left`);
    else if (g.phase === 'discard') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> discards down to seven`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over',
      html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>Three complete sets: ${D.completeSets(g, g.winner).map(c => D.COLORS[c].name).join(', ')}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
