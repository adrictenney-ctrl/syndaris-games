// Skyline on the table: the city board fills the middle, players sit at both ends.
// Payday is the top-left corner and play runs clockwise. Each lot carries its district's
// colour as a ribbon on the inside edge, the owner's colour as a flag, and its floors.
// The centre of the board shows the skyline, the dice, the latest Fortune card and news.
import * as K from './skyline.js?v=66';
import { snap } from './cards.js?v=66';
import { dieHTML } from './table-yacht.js?v=66';

let root = null, tokenAt = {}, hopTimers = {}, lastRoll = -1, lastCard = 0, B = 0, U = 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const PIECE = s => K.PIECES[s % K.PIECES.length];

// Grid cell (row, col) of each square on a 10×10 grid, Payday top-left, clockwise.
export function cell(i) {
  if (i === 0) return [1, 1];
  if (i < 9) return [1, i + 1];
  if (i === 9) return [1, 10];
  if (i < 18) return [i - 8, 10];
  if (i === 18) return [10, 10];
  if (i < 27) return [10, 10 - (i - 18)];
  if (i === 27) return [10, 1];
  return [10 - (i - 27), 1];
}
// Which side the square sits on: 0 top, 1 right, 2 bottom, 3 left (corners: -1).
const side = i => (i % 9 === 0 ? -1 : Math.floor(i / 9));

export const SKYLINE_SVG = `<svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
  <path d="M0 118 H400"/>
  <path d="M14 118 V70 H40 V118 M24 70 V58 H32 V70"/>
  <path d="M48 118 V44 L62 30 L76 44 V118 M62 30 V16"/><path d="M54 56 H70 M54 70 H70 M54 84 H70 M54 98 H70"/>
  <path d="M86 118 V62 H118 V118 M92 74 H112 M92 88 H112 M92 102 H112"/>
  <path d="M128 118 V28 Q150 6 172 28 V118 M150 8 V-2"/><path d="M136 40 H164 M136 54 H164 M136 68 H164 M136 82 H164 M136 96 H164"/>
  <path d="M182 118 V54 H200 V36 H214 V54 H232 V118"/><path d="M190 66 H224 M190 80 H224 M190 94 H224"/>
  <path d="M242 118 V20 L258 4 L274 20 V118 M258 4 V-6"/><path d="M250 32 H266 M250 46 H266 M250 60 H266 M250 74 H266 M250 88 H266 M250 102 H266"/>
  <path d="M284 118 V66 H316 V50 H332 V118"/><path d="M292 78 H324 M292 92 H324"/>
  <path d="M342 118 V40 H362 V30 H372 V40 H386 V118"/><path d="M350 54 H378 M350 68 H378 M350 82 H378 M350 96 H378"/>
</g></svg>`;

function tileHTML(i) {
  const t = K.BOARD[i];
  const sd = side(i);
  if (sd < 0) {
    const icon = { payday: '✦', prison: '▦', garden: '❀', arrest: '➚' }[t.kind];
    const sub = { payday: 'Collect $200 as you pass', prison: 'Just visiting', garden: 'Take a breather', arrest: 'Straight to Prison' }[t.kind];
    return `<div class="sl-tile corner k-${t.kind}" data-i="${i}" style="grid-area:${cell(i)[0]}/${cell(i)[1]}"><i>${icon}</i><b>${t.name}</b><small>${sub}</small></div>`;
  }
  const ribbon = t.kind === 'lot' ? `<span class="rib" style="background:${K.DISTRICTS[t.d].color}"></span>` : '';
  const icon = { metro: '◉', utility: t.name.startsWith('Power') ? 'ϟ' : '⌁', fortune: '?', tax: '§' }[t.kind] || '';
  return `<div class="sl-tile s${sd} k-${t.kind}" data-i="${i}" style="grid-area:${cell(i)[0]}/${cell(i)[1]}">${ribbon}
    ${icon ? `<i>${icon}</i>` : ''}<b>${esc(t.name)}</b>${t.price ? `<small>$${t.price}</small>` : t.amount ? `<small>Pay $${t.amount}</small>` : ''}
    <span class="own"></span><span class="lv"></span></div>`;
}

function build() {
  root = document.createElement('div');
  root.id = 'skyline';
  root.innerHTML = `<div class="sl-board">${K.BOARD.map((_, i) => tileHTML(i)).join('')}
    <div class="sl-mid">
      <div class="sl-art">${SKYLINE_SVG}</div>
      <h2>SKYLINE</h2>
      <div class="sl-dice"></div>
      <p class="sl-now"></p>
      <div class="sl-card"></div>
      <ul class="sl-log"></ul>
    </div>
    <div class="sl-tokens"></div></div>`;
  document.getElementById('center').appendChild(root);
}

function tilePoint(i, k, n) {
  const [r, c] = cell(i);
  const cw = (col) => (col === 1 || col === 10 ? 1.45 : 1);
  const x0 = c === 1 ? 0 : 1.45 + (c - 2) * 1;
  const y0 = r === 1 ? 0 : 1.45 + (r - 2) * 1;
  const w = cw(c), h = cw(r);
  // Spread several tokens on one square in a small cluster.
  const spread = n > 1 ? 0.22 : 0;
  const ang = (k / Math.max(1, n)) * Math.PI * 2;
  return { x: (x0 + w / 2 + Math.cos(ang) * spread) * U, y: (y0 + h / 2 + Math.sin(ang) * spread) * U };
}

function placeTokens(g) {
  const layer = root.querySelector('.sl-tokens');
  const live = g.order.filter(s => !g.broke[s]);
  for (const s of g.order) {
    let el = layer.querySelector(`[data-s="${s}"]`);
    if (g.broke[s]) { el?.remove(); continue; }
    if (!el) {
      el = document.createElement('div');
      el.className = 'sl-token';
      el.dataset.s = s;
      el.style.setProperty('--c', `var(--seat-${s})`);
      el.textContent = PIECE(s).glyph;
      layer.appendChild(el);
      tokenAt[s] = g.pos[s];
    }
    const target = g.pos[s];
    if (tokenAt[s] !== target && !hopTimers[s]) {
      // Hop square by square going forward (short trips); jump for Prison and backwards moves.
      const fwd = (target - tokenAt[s] + K.SIZE) % K.SIZE;
      if (fwd > 0 && fwd <= 14 && !(target === K.PRISON && g.inPrison[s])) {
        hopTimers[s] = setInterval(() => {
          tokenAt[s] = (tokenAt[s] + 1) % K.SIZE;
          setTok(el, g, s, live);
          snap(0.12);
          if (tokenAt[s] === g.pos[s]) { clearInterval(hopTimers[s]); hopTimers[s] = null; setTok(el, g, s, live); }
        }, 140);
      } else tokenAt[s] = target;
    }
    setTok(el, g, s, live);
    el.classList.toggle('now', K.current(g) === s && g.phase !== 'over');
    el.classList.toggle('jailed', !!g.inPrison[s]);
  }
}
function setTok(el, g, s, live) {
  const here = live.filter(x => tokenAt[x] === tokenAt[s]);
  const p = tilePoint(tokenAt[s], here.indexOf(s), here.length);
  el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
}

function paintTiles(g) {
  root.querySelectorAll('.sl-tile').forEach(el => {
    const i = Number(el.dataset.i);
    const o = g.owner[i];
    const own = el.querySelector('.own');
    if (own) { own.style.background = o == null ? '' : `var(--seat-${o})`; own.classList.toggle('on', o != null); }
    const lv = el.querySelector('.lv');
    if (lv) lv.innerHTML = g.level[i] === 5 ? '<em class="tower"></em>' : '<em></em>'.repeat(g.level[i]);
    el.classList.toggle('mort', !!g.mortgaged[i]);
    el.classList.toggle('here', g.pos[K.current(g)] === i && g.phase !== 'over');
  });
}

export default {
  defaults: { cash: 1500, rounds: 30 },
  settingsHTML: s => `
    <label>Starting cash <select data-set="cash">${[1000, 1500, 2000].map(n => `<option value="${n}" ${n === s.cash ? 'selected' : ''}>$${n.toLocaleString()}</option>`).join('')}</select></label>
    <label>Game length <select data-set="rounds">${[[20, '20 rounds'], [30, '30 rounds'], [45, '45 rounds'], [0, 'Until one is left']].map(([v, t]) => `<option value="${v}" ${v === s.rounds ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,

  create: (settings, players) => K.createGame(settings, players),
  act: K.applyAction,
  bot: K.botAction,
  view: K.viewFor,
  turn: g => (g.phase === 'over' ? -1 : g.debt ? g.debt.seat : g.trade ? g.trade.to : K.current(g)),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.broke[seat]) badges.push('<span class="badge off">bankrupt</span>');
    else if (g.inPrison[seat]) badges.push('<span class="badge lost">in prison</span>');
    if (g.debt?.seat === seat) badges.push(`<span class="badge lost">owes $${-g.cash[seat]}</span>`);
    if (g.pardons[seat]) badges.push('<span class="badge">pardon</span>');
    const props = g.owner.filter(o => o === seat).length;
    return {
      badges,
      meta: `<span class="sl-piece" style="--c:var(--seat-${seat})">${PIECE(seat).glyph}</span><span><b>$${g.cash[seat].toLocaleString()}</b></span><span><b>${props}</b> deeds</span>`,
      cards: 0, turn: K.current(g) === seat && g.phase !== 'over', out: g.broke[seat],
    };
  },

  reset() { root?.remove(); root = null; Object.values(hopTimers).forEach(clearInterval); tokenAt = {}; hopTimers = {}; lastRoll = -1; lastCard = 0; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin;
    const felt = document.getElementById('felt').getBoundingClientRect();
    const sideRoom = ctx.upright ? v * 52 : v * 24;
    const size = Math.min(felt.height - v * 8, felt.width - 2 * sideRoom);
    if (Math.abs(size - B) > 1) {
      B = size; U = B / 10.9;
      root.style.setProperty('--B', B + 'px');
      root.style.setProperty('--U', U + 'px');
    }
    paintTiles(g);
    placeTokens(g);

    if (g.rollId !== lastRoll && g.dice) {
      root.querySelector('.sl-dice').innerHTML = g.dice.map((d, i) => dieHTML(d, lastRoll !== -1 ? 'tumble' : '').replace('class="ydie', `style="--r:${i ? 8 : -10}deg" class="ydie`)).join('');
      if (lastRoll !== -1) snap(0.4);
      lastRoll = g.rollId;
    }
    const cur = K.current(g);
    const t = K.BOARD[g.pos[cur]];
    const now = root.querySelector('.sl-now');
    if (g.phase === 'over') now.innerHTML = `<b>${esc(ctx.nameOf(g.winner))}</b> owns the skyline`;
    else if (g.debt) now.innerHTML = `<b>${esc(ctx.nameOf(g.debt.seat))}</b> owes $${-g.cash[g.debt.seat]} — mortgaging…`;
    else if (g.trade) now.innerHTML = `<b>${esc(ctx.nameOf(g.trade.from))}</b> offers <b>${esc(ctx.nameOf(g.trade.to))}</b> a deal`;
    else if (g.phase === 'roll') now.innerHTML = `<b>${esc(ctx.nameOf(cur))}</b> ${g.inPrison[cur] ? 'is in Prison · roll doubles, pay $50 or use a pardon' : g.doubles ? 'rolled doubles · rolls again' : 'to roll'}`;
    else if (g.phase === 'buy') now.innerHTML = `<b>${esc(ctx.nameOf(cur))}</b> is on ${esc(t.name)} · buy it for $${t.price}?`;
    else now.innerHTML = `<b>${esc(ctx.nameOf(cur))}</b> · ${esc(t.name)}`;

    const card = root.querySelector('.sl-card');
    if (g.card && g.card.id !== lastCard) { lastCard = g.card.id; card.innerHTML = `<small>Fortune</small><p>${esc(g.card.text)}</p>`; card.classList.add('show'); }
    else if (!g.card) { card.classList.remove('show'); }
    root.querySelector('.sl-log').innerHTML = g.log.slice(-4).map(l => `<li><i style="background:var(--seat-${l.seat})"></i>${esc(l.text)}</li>`).join('');
    root.querySelector('.sl-mid h2').textContent = g.settings.rounds ? `Round ${Math.min(g.round, g.settings.rounds)} of ${g.settings.rounds}` : 'SKYLINE';
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => (g.broke[a] - g.broke[b]) || K.netWorth(g, b) - K.netWorth(g, a));
    return {
      key: 'over' + g.round,
      html: `<h2>${ctx.nameOf(g.winner)} wins</h2><p>${g.byWorth ? 'Richest after the final round' : 'Last one standing'}</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.broke[s] ? 'bankrupt' : '$' + K.netWorth(g, s).toLocaleString()}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
