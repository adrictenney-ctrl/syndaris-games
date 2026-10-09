// Gearworks on the table: the round track, this round's two Power Surges, the five actions (and
// who picked each, once they're revealed), and in front of every player their workshop of
// robots, parts and points.
import * as W from './gearworks.js?v=67';
import { snap } from './cards.js?v=67';

let root = null, shops = {}, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const ACT_COLOR = { recycle: '#4f9a6a', design: '#4a78b5', fabricate: '#c07a35', assemble: '#9a5ab0', upgrade: '#c9a13a' };

// A little robot, different for every blueprint: head shape, eyes, mouth, antenna.
export function robotSVG(seed, color) {
  let x = seed;
  const rnd = () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; };
  const headW = 34 + rnd() * 14, headH = 24 + rnd() * 10, r = rnd() < 0.4 ? headH / 2 : 4 + rnd() * 6;
  const hx = 50 - headW / 2, hy = 30;
  const eye = rnd(), mouth = rnd(), ant = rnd(), ears = rnd() < 0.5;
  let h = `<rect x="${hx}" y="${hy}" width="${headW}" height="${headH}" rx="${r}" fill="${color}" stroke="#1b1b1f" stroke-width="2"/>`;
  h += `<rect x="${hx + 4}" y="${hy + 4}" width="${headW - 8}" height="${headH - 8}" rx="${Math.max(2, r - 3)}" fill="#e9f2f2" opacity=".9"/>`;
  const ey = hy + headH * 0.42, ex = headW * 0.22;
  if (eye < 0.33) h += `<circle cx="${50 - ex}" cy="${ey}" r="3.6" fill="#1b1b1f"/><circle cx="${50 + ex}" cy="${ey}" r="3.6" fill="#1b1b1f"/><circle cx="${50 - ex + 1.2}" cy="${ey - 1.2}" r="1.1" fill="#fff"/><circle cx="${50 + ex + 1.2}" cy="${ey - 1.2}" r="1.1" fill="#fff"/>`;
  else if (eye < 0.66) h += `<rect x="${50 - ex - 4}" y="${ey - 2}" width="8" height="4" rx="2" fill="#1b1b1f"/><rect x="${50 + ex - 4}" y="${ey - 2}" width="8" height="4" rx="2" fill="#1b1b1f"/>`;
  else h += `<circle cx="50" cy="${ey}" r="5.5" fill="#1b1b1f"/><circle cx="50" cy="${ey}" r="2.2" fill="#ff5a4a"/>`;
  const my = hy + headH * 0.74;
  if (mouth < 0.4) h += `<path d="M${50 - 7} ${my} q7 5 14 0" stroke="#1b1b1f" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  else if (mouth < 0.75) h += [0, 1, 2, 3].map(i => `<rect x="${50 - 8 + i * 4.4}" y="${my - 2}" width="2.6" height="4" fill="#1b1b1f"/>`).join('');
  else h += `<rect x="${50 - 6}" y="${my - 1.2}" width="12" height="2.4" rx="1.2" fill="#1b1b1f"/>`;
  if (ant < 0.5) h += `<line x1="50" y1="${hy}" x2="50" y2="${hy - 10}" stroke="#1b1b1f" stroke-width="2"/><circle cx="50" cy="${hy - 12}" r="3.4" fill="${ant < 0.25 ? '#ff5a4a' : '#f6d27a'}" stroke="#1b1b1f" stroke-width="1.5"/>`;
  else h += `<path d="M${50 - 8} ${hy} l-4 -9 M${50 + 8} ${hy} l4 -9" stroke="#1b1b1f" stroke-width="2" stroke-linecap="round"/>`;
  if (ears) h += `<rect x="${hx - 5}" y="${hy + headH / 2 - 5}" width="5" height="10" rx="2" fill="#8a8f98" stroke="#1b1b1f" stroke-width="1.5"/><rect x="${hx + headW}" y="${hy + headH / 2 - 5}" width="5" height="10" rx="2" fill="#8a8f98" stroke="#1b1b1f" stroke-width="1.5"/>`;
  h += `<rect x="${50 - headW * 0.36}" y="${hy + headH + 2}" width="${headW * 0.72}" height="16" rx="4" fill="${color}" stroke="#1b1b1f" stroke-width="2"/><circle cx="50" cy="${hy + headH + 10}" r="3" fill="#f6d27a" stroke="#1b1b1f" stroke-width="1.2"/>`;
  return `<svg viewBox="0 6 100 76" class="gw-bot">${h}</svg>`;
}

export function gwCard(id, cls = '') {
  if (id == null) return `<div class="gw-card back ${cls}"><i>⚙</i></div>`;
  const b = W.BLUEPRINTS[id], col = ACT_COLOR[b.icon];
  return `<div class="gw-card ${cls}" style="--c:${col}"><span class="cost">${b.cost}</span><span class="vp">${b.vp}</span>${robotSVG(b.seed, col)}<b>${b.name}</b><small>${W.ACT[b.icon].ic} ${W.ACT[b.icon].name} +1</small></div>`;
}

export const actTile = (a, extra = '') => `<div class="gw-act" style="--c:${ACT_COLOR[a]}"><i>${W.ACT[a].ic}</i><b>${W.ACT[a].name}</b>${extra}</div>`;

function build() {
  root = document.createElement('div');
  root.id = 'gearworks';
  root.innerHTML = `<div class="gw-mid"><div class="gw-rounds"></div><div class="gw-surge"></div><div class="gw-acts"></div><p class="gw-msg"></p></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: {},
  settingsHTML: () => `<span class="yc-note">${W.ROUNDS} rounds · everyone picks an action at once</span>`,
  create: (settings, players) => W.createGame(settings, players),
  act: W.applyAction,
  bot: W.botAction,
  view: W.viewFor,
  turn: () => -1,
  timer: (g, players) => W.tick(g, players),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const p = g.p[seat], badges = [];
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    else if (g.phase === 'plan') badges.push(p.pick ? '<span class="badge got">picked</span>' : '<span class="badge">choosing…</span>');
    else if (g.phase === 'choose' && g.choices && seat in g.choices && g.choices[seat] == null) badges.push('<span class="badge">deciding…</span>');
    return { badges, meta: `<span><b>${W.score(g, seat)}</b> pts</span><span>🔩 ${p.parts} · 📜 ${p.hand.length}</span>`, cards: 0, turn: (g.phase === 'plan' && !p.pick) || (g.phase === 'choose' && g.choices?.[seat] === null), out: false };
  },

  reset() { root?.remove(); root = null; shops = {}; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin;
    root.style.setProperty('--v', v + 'px');
    for (const s of g.order) {
      let el = shops[s];
      if (!el) { el = shops[s] = document.createElement('div'); el.className = 'gw-shop'; root.appendChild(el); }
      const p = g.p[s], k = JSON.stringify([p.robots, p.parts, p.vp]);
      if (el.dataset.k !== k) {
        el.dataset.k = k;
        el.innerHTML = `<div class="gw-bots">${p.robots.map(id => `<span style="--c:${ACT_COLOR[W.BLUEPRINTS[id].icon]}" title="${W.BLUEPRINTS[id].name}">${robotSVG(W.BLUEPRINTS[id].seed, ACT_COLOR[W.BLUEPRINTS[id].icon])}<b>${W.BLUEPRINTS[id].vp}</b></span>`).join('') || '<em>no robots yet</em>'}</div><div class="gw-res"><span>🔩 ${p.parts}</span><span>⭐ ${p.vp}</span></div>`;
      }
      const pt = ctx.inset(s, 21);
      el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(s)}deg)`;
    }
    const k = JSON.stringify([g.moveId, g.phase, g.order.map(s => !!g.p[s].pick), g.choices && Object.values(g.choices).map(c => c != null)]);
    if (k === key) return;
    if (key && g.phase === 'show') snap(0.3);
    key = k;
    root.querySelector('.gw-rounds').innerHTML = Array.from({ length: W.ROUNDS }, (_, i) => `<i class="${i + 1 < g.round ? 'done' : i + 1 === g.round ? 'now' : ''}">${i + 1}</i>`).join('');
    root.querySelector('.gw-surge').innerHTML = `<small>Power surge</small>${g.surges.map(a => `<div class="gw-sc" style="--c:${ACT_COLOR[a]}">⚡ ${W.ACT[a].ic} ${W.ACT[a].name} +1</div>`).join('')}`;
    const cur = g.step?.action;
    root.querySelector('.gw-acts').innerHTML = W.ACTIONS.map(a => {
      const who = g.chosen?.[a] || [];
      const cls = cur === a ? ' now' : g.chosen && !who.length ? ' off' : '';
      return actTile(a, `<span class="who">${who.map(s => `<i style="background:var(--seat-${s})"></i>`).join('')}</span>`).replace('class="gw-act"', `class="gw-act${cls}"`);
    }).join('');
    const msg = root.querySelector('.gw-msg');
    if (g.phase === 'over') msg.innerHTML = '';
    else if (g.phase === 'plan') { const w = g.order.filter(s => !g.p[s].pick); msg.innerHTML = `Round ${g.round} · pick an action on your phone${w.length < g.order.length ? ` · waiting for ${w.map(s => `<b>${esc(ctx.nameOf(s))}</b>`).join(', ')}` : ''}`; }
    else if (g.phase === 'choose') { const w = Object.keys(g.choices).map(Number).filter(s => g.choices[s] == null); msg.innerHTML = `<b>${W.ACT[cur].name}</b> · ${w.map(s => esc(ctx.nameOf(s))).join(', ')} deciding…`; }
    else msg.innerHTML = `<b>${W.ACT[cur].name}</b> for everyone`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => W.score(g, b) - W.score(g, a));
    return {
      key: 'over' + g.moveId,
      html: `<h2>${g.winners.map(s => ctx.nameOf(s)).join(' & ')} win${g.winners.length > 1 ? '' : 's'}</h2><p>The finest workshop after ${W.ROUNDS} rounds</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${W.score(g, s)}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
