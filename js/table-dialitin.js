// Dial It In on the table: a big brass-rimmed half dial. The spectrum's two ends sit at its
// feet, the clue above it, and the needle swings as the guessing team turns it from their
// phones. At the reveal the shutter opens on the scoring bands.
import * as D from './dialitin.js?v=62';
import { snap } from './cards.js?v=62';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const R = 90, CX = 100, CY = 100;
const pt = (deg, r = R) => { const a = deg * Math.PI / 180; return [CX - r * Math.cos(a), CY - r * Math.sin(a)]; };
function wedge(a, b, r = R) {
  a = Math.max(0, a); b = Math.min(180, b);
  const [x1, y1] = pt(a, r), [x2, y2] = pt(b, r);
  return `M${CX} ${CY} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

// The dial. o: { dial, target (null = hidden), ends: [left, right], live }
export function dialSVG(o) {
  let h = `<svg viewBox="-6 -4 212 118" class="di-svg">
    <defs><radialGradient id="diFace" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="#f6eedb"/><stop offset="1" stop-color="#d9c9a3"/></radialGradient></defs>
    <path d="${wedge(0, 180, R + 6)}" class="di-rim"/><path d="${wedge(0, 180)}" fill="url(#diFace)" class="di-face"/>`;
  if (o.target != null) {
    const cls = ['b2', 'b3', 'b4'];
    D.BANDS.slice().reverse().forEach(([w, p], i) => {
      h += `<path d="${wedge(o.target - w, o.target + w)}" class="di-band ${cls[i]}"/>`;
      if (p < 4) for (const side of [-1, 1]) { const [x, y] = pt(o.target + side * (w - 3.5), R - 9); h += `<text x="${x}" y="${y}" class="di-pt">${p}</text>`; }
    });
    const [x, y] = pt(o.target, R - 9);
    h += `<text x="${x}" y="${y}" class="di-pt c4">4</text>`;
  }
  for (let d = 0; d <= 180; d += 10) { const [a, b] = pt(d, R), [c, e] = pt(d, R - (d % 30 ? 3 : 6)); h += `<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" class="di-tick"/>`; }
  const [nx, ny] = pt(o.dial, R - 4);
  h += `<line x1="${CX}" y1="${CY}" x2="${nx}" y2="${ny}" class="di-needle"/><circle cx="${CX}" cy="${CY}" r="7" class="di-hub"/>`;
  if (o.ends) h += `<text x="4" y="112" class="di-end l">${esc(o.ends[0])}</text><text x="196" y="112" class="di-end r">${esc(o.ends[1])}</text>`;
  return h + '</svg>';
}

function build() {
  root = document.createElement('div');
  root.id = 'dialitin';
  root.innerHTML = `<p class="di-clue"></p><div class="di-dial"></div><div class="di-score"></div><p class="di-msg"></p>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">4+ players: two teams, first to 10 · 2–3 players: team up for 7 rounds</span>',
  create: (settings, players) => D.createGame(settings, players),
  act: D.applyAction,
  bot: D.botAction,
  view: D.viewFor,
  turn: g => D.current(g),
  timer: g => D.tick(g),
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (seat === g.reader && g.phase !== 'over') badges.push('<span class="badge got">🔮 reader</span>');
    if (g.phase === 'over' && !g.coop && g.team[seat] === g.winner) badges.push('<span class="badge got">🏆 winner</span>');
    const meta = g.coop ? '<span>team</span>' : `<span class="di-team t${g.team[seat]}">${g.team[seat] ? 'Team Moon' : 'Team Sun'}</span>`;
    const busy = (g.phase === 'dial' && g.team[seat] === g.teamUp && seat !== g.reader) || (g.phase === 'side' && g.team[seat] !== g.teamUp);
    return { badges, meta, cards: 0, turn: seat === D.current(g) || busy, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const v = ctx.vmin;
    root.style.setProperty('--v', v + 'px');
    const k = JSON.stringify([g.moveId, g.phase, Math.round(v)]);
    if (k === key) return;
    if (key && g.phase === 'reveal') snap(0.5);
    key = k;
    const show = g.phase === 'reveal' || g.phase === 'over';
    root.querySelector('.di-dial').innerHTML = dialSVG({ dial: g.dial, target: show ? g.target : null, ends: g.card != null ? D.SPECTRA[g.card] : null });
    root.querySelector('.di-clue').innerHTML = g.clue ? `“${esc(g.clue)}”` : '<em>waiting for a clue…</em>';
    const team = t => (g.coop ? 'Together' : t ? 'Team Moon' : 'Team Sun');
    root.querySelector('.di-score').innerHTML = g.coop ? `<span><b>${g.scores[0]}</b> points · round ${g.round} of ${D.COOP_ROUNDS}</span>`
      : `<span class="t0 ${g.teamUp === 0 ? 'up' : ''}">☀ Sun <b>${g.scores[0]}</b></span><span class="t1 ${g.teamUp === 1 ? 'up' : ''}">☾ Moon <b>${g.scores[1]}</b></span><small>first to ${D.WIN}</small>`;
    const msg = root.querySelector('.di-msg'), rd = esc(ctx.nameOf(g.reader));
    if (g.phase === 'clue') msg.innerHTML = `<b>${rd}</b> is reading the dial and thinking of a clue`;
    else if (g.phase === 'dial') msg.innerHTML = `<b>${team(g.teamUp)}</b> · turn the dial on your phones, then lock it in`;
    else if (g.phase === 'side') msg.innerHTML = `<b>${team(1 - g.teamUp)}</b> · is the target left or right of the needle?`;
    else if (g.result) msg.innerHTML = `<b>${team(g.result.team)} +${g.result.pts}</b>${g.result.pts === 4 ? ' · bullseye!' : ''}${g.side ? ` · ${team(1 - g.result.team)} ${g.result.sidePt ? '+1 for the call' : 'called it wrong'}` : ''}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return {
      key: 'over' + g.moveId,
      html: g.coop ? `<h2>${g.scores[0]} points</h2><p>${g.scores[0] >= 20 ? 'On the same wavelength — superb' : g.scores[0] >= 13 ? 'Nicely tuned in' : 'A little static on the line'}</p>
          <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`
        : `<h2>${g.winner ? 'Team Moon' : 'Team Sun'} wins!</h2><p>${D.members(g, g.winner).map(s => ctx.nameOf(s)).join(', ')} · ${g.scores[g.winner]} to ${g.scores[1 - g.winner]}</p>
          <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
