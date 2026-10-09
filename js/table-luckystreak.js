// Lucky Streak on the table: the deck and discard in the middle, and in front of each player
// the row of cards they've flipped this round — glowing while they're still in, dimmed when
// they stay, cracked through when they bust.
import * as L from './luckystreak.js?v=66';
import { snap } from './cards.js?v=66';

let root = null, rows = {}, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const HUE = ['#8a8a8a', '#6b8f71', '#5f7fa0', '#9a6b4f', '#7a5f95', '#a0864a', '#4f8a8a', '#a05f6b', '#6f7f4a', '#5a6aa8', '#9a5a3f', '#4a7a5f', '#8a4a6a'];

// A card face. null = the back.
export function lkCard(c, cls = '') {
  if (!c) return `<div class="lk-card back ${cls}"><i>🍀</i><b>Lucky<br>Streak</b></div>`;
  const t = L.typeOf(c);
  if (L.isNum(c)) {
    const n = L.numOf(c);
    return `<div class="lk-card num ${cls}" style="--h:${HUE[n]}"><small>${n}</small><b>${n}</b><small class="br">${n}</small></div>`;
  }
  if (L.ACTIONS[t]) return `<div class="lk-card act a-${t} ${cls}"><i>${L.ACTIONS[t].ic}</i><b>${L.ACTIONS[t].name}</b></div>`;
  return `<div class="lk-card mod ${cls}"><b>${t === 'x2' ? '×2' : '+' + t.slice(1)}</b><small>bonus</small></div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'luckystreak';
  root.innerHTML = `<div class="lk-mid"><div class="lk-deck"></div></div><p class="lk-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { target: 200 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[100, 200, 300].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`,
  create: (settings, players) => L.createGame(settings, players),
  act: L.applyAction,
  bot: L.botAction,
  view: L.viewFor,
  turn: g => L.current(g),
  timer: g => L.tick(g),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const r = g.rows[seat], badges = [];
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    else if (r.status === 'bust') badges.push('<span class="badge lost">bust</span>');
    else if (r.status === 'stay') badges.push('<span class="badge">staying</span>');
    if (r.charm) badges.push('<span class="badge">🍀 charm</span>');
    if (g.need?.seat === seat) badges.push(`<span class="badge">picking a ${L.ACTIONS[g.need.kind].name} target</span>`);
    return { badges, meta: `<span><b>${g.scores[seat]}</b> / ${g.settings.target}</span><span>this round <b>${L.roundPoints(g, seat)}</b></span>`, cards: 0, turn: L.current(g) === seat, out: r.status === 'bust' };
  },

  reset() { root?.remove(); root = null; rows = {}; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin, cw = v * 6.6 * ctx.cardScale;
    root.style.setProperty('--v', v + 'px');
    root.style.setProperty('--lk', cw + 'px');
    for (const s of g.order) {
      let el = rows[s];
      if (!el) { el = rows[s] = document.createElement('div'); el.className = 'lk-row'; root.appendChild(el); }
      const r = g.rows[s];
      const k = r.cards.join() + r.status + g.phase;
      if (el.dataset.k !== k) {
        el.dataset.k = k;
        const fresh = g.lastFlip?.seat === s ? g.lastFlip.card : null;
        el.innerHTML = `<div class="lk-cards">${r.cards.map(c => lkCard(c, c === fresh ? 'flip' : c === r.bustCard ? 'bad' : '')).join('')}</div>
          <span class="lk-pts">${r.status === 'bust' ? 'bust' : L.roundPoints(g, s)}${r.nums.length >= L.STREAK ? ' 🌟' : ''}</span>`;
      }
      el.className = `lk-row s-${r.status}${L.current(g) === s ? ' now' : ''}`;
      const pt = ctx.inset(s, 17);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
    }
    const k = JSON.stringify([g.moveId, g.phase, cw]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.querySelector('.lk-deck').innerHTML = `${lkCard(null)}<small>${g.deck.length} left · round ${g.round}</small>`;
    const msg = root.querySelector('.lk-msg');
    if (g.phase === 'over') msg.innerHTML = '';
    else if (g.phase === 'scored') msg.innerHTML = g.streak != null ? `<b>${esc(ctx.nameOf(g.streak))}</b> hit a Lucky Streak! Round over` : 'Round over — points banked';
    else if (g.need) msg.innerHTML = `<b>${esc(ctx.nameOf(g.need.seat))}</b> picks who gets the ${L.ACTIONS[g.need.kind].name}`;
    else if (g.forced.length) msg.innerHTML = g.forced[0].why === 'dare' ? `<b>${esc(ctx.nameOf(g.forced[0].seat))}</b> flips — triple dare!` : 'Dealing…';
    else msg.innerHTML = `<b>${esc(ctx.nameOf(g.turn))}</b> · hit or stay?`;
  },

  overlay(g, ctx) {
    if (g.phase === 'scored') {
      const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
      return {
        key: 'r' + g.round,
        html: `<h2>Round ${g.round}</h2><p>${g.streak != null ? `${ctx.nameOf(g.streak)} hit a Lucky Streak 🌟` : 'Everyone is out of the round'}</p>
          <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b> <small>+${g.roundPts[s]}</small></li>`).join('')}</ol>`,
      };
    }
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} win${g.winners.length > 1 ? '' : 's'}!</h2><p>First past ${g.settings.target}</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s]}</b> <small>+${g.roundPts[s]}</small></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
