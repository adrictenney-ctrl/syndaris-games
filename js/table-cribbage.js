// Cribbage on the table: an oak peg board along the middle (two tracks of 120 holes in three
// rows each, front and back pegs), the starter and crib beside it, the pegging pile with its
// running count, and in the show each hand laid out with its points.
import * as C from './cribbage.js?v=66';
import { cardEl, snap } from './cards.js?v=66';
import { centerMsg, clearMsg } from './table-hearts.js?v=66';

let root = null, key = '';

// Hole n (1..120) for track t on a board W×H: three rows of 40, snaking.
function hole(t, n, W, H) {
  const row = Math.floor((n - 1) / 40), i = (n - 1) % 40;
  const x = row % 2 === 0 ? 40 + i * ((W - 80) / 39) : W - 40 - i * ((W - 80) / 39);
  const y = 26 + row * 56 + t * 20;
  return [x, y];
}
function boardSVG(g, ctx) {
  const W = 900, H = 180;
  let h = `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="22" fill="url(#cbWood)" stroke="#3a2210" stroke-width="3"/>`;
  for (let t = 0; t < 2; t++) for (let n = 1; n <= 120; n++) { const [x, y] = hole(t, n, W, H); h += `<circle cx="${x}" cy="${y}" r="${n % 5 === 0 ? 3.6 : 3}" fill="#2a170a"/>`; }
  for (let t = 0; t < 2; t++) {
    const col = `var(--seat-${t})`;
    for (const [v, op] of [[g.prev[t], 0.55], [g.scores[t], 1]]) {
      if (!v) continue;
      const [x, y] = v >= 121 ? [W / 2, H / 2] : hole(t, v, W, H);
      h += `<circle cx="${x}" cy="${y}" r="10" style="fill:${col}" opacity="${op}" stroke="#fff" stroke-width="2.4"/>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="cb-board"><defs><linearGradient id="cbWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c08a52"/><stop offset=".5" stop-color="#a06a38"/><stop offset="1" stop-color="#7a4a22"/></linearGradient></defs>${h}</svg>`;
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">First to 121 · the computer can play either seat</span>',
  create: settings => C.createGame(settings),
  act: C.applyAction,
  bot: C.botAction,
  view: C.viewFor,
  turn: g => C.current(g),
  timer: (g, players) => C.tick(g, players),
  joinMidGame: () => false,
  plate(g, s) {
    const badges = [];
    if (g.dealer === s) badges.push('<span class="badge dealer">DEALER · crib</span>');
    if (g.phase === 'discard' && g.thrown[s]) badges.push('<span class="badge got">crib ✓</span>');
    if (g.go?.[s] && g.phase === 'peg') badges.push('<span class="badge">go</span>');
    if (g.phase === 'over' && g.winner === s) badges.push('<span class="badge got">🏆 winner</span>');
    return { badges, meta: `<span><b>${g.scores[s]}</b> / 121</span>`, cards: g.hands[s].length, turn: C.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'cribbage'; document.getElementById('center').appendChild(root); }
    root.style.setProperty('--cw', ctx.vmin * 5.6 * ctx.cardScale + 'px');
    const k = JSON.stringify([g.moveId, g.phase, g.showStep, g.scores]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.innerHTML = `<div class="cb-top">${boardSVG(g, ctx)}</div><div class="cb-mid"><div class="cb-starter"><small>Starter</small></div><div class="cb-crib"><small>Crib</small></div><div class="cb-pile"></div></div>`;
    const st = root.querySelector('.cb-starter');
    st.appendChild(g.starter ? cardEl(g.starter) : cardEl(null, true));
    const cr = root.querySelector('.cb-crib');
    cr.appendChild(cardEl(null, true));
    const pile = root.querySelector('.cb-pile');
    if (g.phase === 'show' || g.phase === 'over' && g.show) {
      g.show.forEach((sh, i) => {
        const d = document.createElement('div');
        d.className = 'cb-shown' + (i < g.showStep ? ' done' : '') + (i === g.showStep - 1 ? ' now' : '');
        sh.cards.forEach(c => d.appendChild(cardEl(c)));
        d.insertAdjacentHTML('beforeend', `<small>${ctx.nameOf(sh.seat)}'s ${sh.what} · <b>${i < g.showStep ? sh.total : '?'}</b>${i < g.showStep && sh.parts.length ? `<em>${sh.parts.map(p => `${p[0]} ${p[1]}`).join(' · ')}</em>` : ''}</small>`);
        pile.appendChild(d);
      });
    } else if (g.played) {
      const row = document.createElement('div');
      row.className = 'cb-played';
      g.played.forEach(p => { const c = cardEl(p.card); if (!g.seq.includes(p.card)) c.classList.add('old'); c.style.setProperty('--dot', `var(--seat-${p.seat})`); row.appendChild(c); });
      pile.appendChild(row);
      pile.insertAdjacentHTML('beforeend', `<div class="cb-count"><small>Count</small><b>${g.count}</b></div>`);
    }
    if (g.phase === 'discard') centerMsg('Each player throws two cards into <b>' + ctx.nameOf(g.dealer) + '\'s crib</b>');
    else if (g.phase === 'peg') centerMsg(`<b>${ctx.nameOf(g.turn)}</b> to play · count ${g.count}`);
    else centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const lurch = g.scores[1 - g.winner] < 91;
    return {
      key: 'over' + g.handNo,
      html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>${g.scores[0]} – ${g.scores[1]}${lurch ? ' · a skunk!' : ''}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
