// Baccarat on the table: the Player and Banker hands dealt one card at a time, the result,
// the bead road of past results, and everyone's bets in front of their seat.
import * as Bc from './baccarat.js?v=53';
import { cardEl, snap } from './cards.js?v=53';
import { chipStack, money } from './casino.js?v=53';

let root = null, key = '';
const LABEL = { player: 'P', banker: 'B', tie: 'T', ppair: 'PP', bpair: 'BP' };

function hand(cards, cw, side, scoreV, win) {
  const el = document.createElement('div');
  el.className = `bc-hand ${side}${win ? ' win' : ''}`;
  el.innerHTML = `<h4>${side === 'player' ? 'Player' : 'Banker'}</h4>`;
  const row = document.createElement('div');
  row.className = 'bc-cards';
  [0, 1, 2].forEach(i => {
    const c = cards[i];
    if (c === undefined) { if (i < 2) row.insertAdjacentHTML('beforeend', `<span class="bc-slot" style="--cw:${cw}px"></span>`); return; }
    const ce = cardEl(c);
    ce.style.setProperty('--cw', cw + 'px');
    if (i === 2) ce.classList.add('third');
    row.appendChild(ce);
  });
  el.appendChild(row);
  el.insertAdjacentHTML('beforeend', `<b class="bc-score">${scoreV ?? ''}</b>`);
  return el;
}

function road(list) {
  // Bead plate: six rows by twelve columns, filled column by column; empty cells wait.
  const cells = [];
  for (let i = 0; i < 72; i++) {
    const r = list[i];
    cells.push(r ? `<i class="${r.w}${r.pp ? ' pp' : ''}${r.bp ? ' bp' : ''}">${r.w}</i>` : '<i></i>');
  }
  return `<div class="bc-road">${cells.join('')}</div>`;
}

function render(g, ctx) {
  const cw = ctx.vmin * 7.4 * ctx.cardScale;
  root.style.setProperty('--v', ctx.vmin + 'px');
  root.innerHTML = '<div class="bc-stack"></div>';
  const stack = root.firstChild;
  const v = Bc.visible(g);
  const winner = g.phase === 'settle' ? g.result.winner : null;
  const pS = v.p.filter(Boolean).length ? Bc.score(v.p.filter(Boolean)) : null;
  const bS = v.b.filter(Boolean).length ? Bc.score(v.b.filter(Boolean)) : null;

  const center = document.createElement('div');
  center.className = 'bc-center';
  center.appendChild(hand(v.p, cw, 'player', pS, winner === 'player'));
  center.appendChild(hand(v.b, cw, 'banker', bS, winner === 'banker'));
  stack.appendChild(center);

  let msg = '';
  if (g.phase === 'bet') {
    const any = Object.entries(g.bets).some(([s, b]) => g.seats[s] && Object.values(b).reduce((a, x) => a + x, 0) >= g.settings.min);
    const left = g.betDeadline ? Math.max(0, Math.ceil((g.betDeadline - Date.now()) / 1000)) : null;
    msg = `<p class="bc-msg">Place your bets on your phone${left !== null ? ` · dealing in ${left}s` : ''}</p><button class="tool" data-a="deal" type="button" ${any ? '' : 'disabled'}>Deal now</button>`;
  } else if (g.phase === 'settle') {
    const r = g.result;
    msg = `<p class="bc-result ${r.winner}">${r.winner === 'tie' ? `Tie, ${r.ps} – ${r.bs}` : `${r.winner === 'player' ? 'Player' : 'Banker'} wins, ${Math.max(r.ps, r.bs)} over ${Math.min(r.ps, r.bs)}`}${r.natural ? ' · natural' : ''}${r.ppair ? ' · Player pair' : ''}${r.bpair ? ' · Banker pair' : ''}</p>
      <button class="tool" data-a="next" type="button">Next hand</button>`;
  } else msg = `<p class="bc-msg">${g.shuffled && g.round ? 'New shoe · ' : ''}No more bets</p>`;
  stack.insertAdjacentHTML('beforeend', `<div class="bc-bar">${msg}</div>${road(g.road.slice(-72))}
    <p class="bc-print">Player pays 1 to 1 · Banker pays 1 to 1, less 5% · Tie pays 8 to 1${g.settings.pairs ? ' · Pairs pay 11 to 1' : ''}</p>`);
  root.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => ctx.act(g.seats.findIndex(Boolean), { type: b.dataset.a }); });

  // Bets in front of each seat.
  g.seats.forEach((s, seat) => {
    const b = g.bets[seat];
    if (!s || !b || !Object.keys(b).length) return;
    const el = document.createElement('div');
    el.className = 'bc-spot';
    el.innerHTML = Object.entries(b).map(([k, amt]) => `<span class="bc-bet ${k}">${chipStack(amt, 4)}<em>${LABEL[k]}</em><b>${money(amt)}</b></span>`).join('')
      + (g.phase === 'settle' && g.result.net[seat] !== undefined ? `<span class="bj-net ${g.result.net[seat] > 0 ? 'up' : g.result.net[seat] < 0 ? 'down' : ''}">${g.result.net[seat] > 0 ? '+' : ''}${money(g.result.net[seat])}</span>`
        : g.phase === 'bet' ? `<span class="bj-label">${g.ready[seat] ? '✓ ready' : 'betting…'}</span>` : '');
    const pt = ctx.inset(seat, 15);
    el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${ctx.rot(seat)}deg)`;
    root.appendChild(el);
  });
}

export default {
  defaults: { ...Bc.DEFAULTS },
  settingsHTML: s => {
    const sel = (k, vals) => `<select data-set="${k}">${vals.map(v => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${v.toLocaleString()}</option>`).join('')}</select>`;
    return `
      <label>Chips ${sel('startChips', [500, 1000, 2000, 5000])}</label>
      <label>Minimum bet ${sel('min', [5, 10, 25, 100])}</label>
      <label><input type="checkbox" data-set="pairs" ${s.pairs ? 'checked' : ''}> Pair bets</label>
      <label><input type="checkbox" data-set="rebuy" ${s.rebuy ? 'checked' : ''}> Rebuys</label>`;
  },

  create: (settings, players) => Bc.createGame(settings, players),
  act: Bc.applyAction,
  bot: Bc.botAction,
  view: Bc.viewFor,
  turn: Bc.turn,
  timer: Bc.timer,
  joinMidGame: () => true,

  plate(g, seat) {
    const st = g.stacks[seat] ?? 0;
    const badges = [];
    if (g.phase === 'bet' && g.ready[seat]) badges.push('<span class="badge got">✓ in</span>');
    if (st < g.settings.min && g.phase === 'bet') badges.push('<span class="badge off">out of chips</span>');
    return { badges, meta: `<span class="chips-count"><i class="chip-dot"></i><b>${money(st)}</b></span>`, cards: 0, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'baccarat'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.phase, g.round, g.shown, g.bets, g.ready, Math.ceil((g.betDeadline - Date.now()) / 1000), ctx.vmin, ctx.cardScale, ctx.upright]);
    if (k === key) return;
    const flip = key && JSON.parse(key)[2] !== g.shown;
    key = k;
    render(g, ctx);
    if (flip) snap(0.3);
    clearTimeout(root._t);
    if (g.phase === 'bet' && g.betDeadline) root._t = setTimeout(() => { key = ''; render(g, ctx); }, 1000);
  },

  overlay: () => null,
};
