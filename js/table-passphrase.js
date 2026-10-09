// Pass the Phrase on the table: the two teams' scores and a ticking bomb — the buzzer is hidden,
// so the table only shows that it's ticking (faster and faster), and who's holding the phrase.
import * as P from './passphrase.js?v=68';
import { buzzer, tone } from './sfx.js?v=68';
import { TEAMS } from './table-dontsay.js?v=68';
import { centerMsg, clearMsg } from './table-hearts.js?v=68';

let root = null, key = '', gameRef = null, tickT = null;
function ticking() {
  clearTimeout(tickT);
  const g = gameRef;
  if (!g || g.phase !== 'play') return;
  tone(1400, 0.04, { type: 'square', vol: 0.05 });
  const left = g.buzzAt - Date.now();
  tickT = setTimeout(ticking, Math.max(180, Math.min(900, left / 40)));
}

export default {
  defaults: { target: 7 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[5, 7, 10].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label><span class="yc-note">Teams alternate around the table</span>`,
  create: (settings, players) => P.createGame(settings, players),
  act: P.applyAction,
  bot: P.botAction,
  view: P.viewFor,
  turn: g => P.current(g),
  timer: g => P.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const t = g.team[s], badges = [];
    if (P.holder(g) === s && g.phase === 'play') badges.push('<span class="badge alone">💣 holding</span>');
    if (g.phase === 'over' && g.winner === t) badges.push('<span class="badge got">🏆 winners</span>');
    return { badges, meta: `<span class="pt-team t${t}">● ${TEAMS[t]}</span>`, cards: 0, turn: P.holder(g) === s && g.phase !== 'over', out: false };
  },
  reset() { root?.remove(); root = null; key = ''; clearTimeout(tickT); clearMsg(); },
  renderCenter(g, ctx) {
    gameRef = g;
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'passphrase'; root.className = 'pt-wrap'; document.getElementById('center').appendChild(root); }
    if (g.moveId === key) return;
    const was = key;
    key = g.moveId;
    if (g.phase === 'play' && !tickT) ticking();
    if (g.phase !== 'play') { clearTimeout(tickT); tickT = null; }
    if (was !== '' && g.phase === 'buzz') buzzer();
    const scores = `<div class="pt-scores">${[0, 1].map(t => `<div class="pt-score t${t}"><small>${TEAMS[t]}</small><b>${g.scores[t]}</b></div>`).join('')}</div>`;
    const H = P.holder(g);
    let mid = '';
    if (g.phase === 'ready') mid = `<p class="pt-big"><b>${ctx.nameOf(H)}</b> starts round ${g.round + 1}</p><p class="pt-sub">First to ${g.settings.target}</p>`;
    else if (g.phase === 'play') mid = `<div class="pp-bomb">💣</div><p class="pt-big"><b>${ctx.nameOf(H)}</b> has it!</p><p class="pt-sub">${g.passes} pass${g.passes === 1 ? '' : 'es'} this round</p>`;
    else if (g.phase === 'buzz') mid = `<div class="pp-bomb boom">💥</div><p class="pt-big"><b>${ctx.nameOf(g.lastBuzz.caught)}</b> was caught holding “${g.lastBuzz.phrase}”</p><p class="pt-sub">${TEAMS[1 - g.team[g.lastBuzz.caught]]} scores!</p>`;
    root.innerHTML = scores + mid;
    centerMsg('');
  },
  overlay(g) {
    if (g.phase !== 'over') return null;
    return { key: 'over', html: `<h2>${TEAMS[g.winner]} wins!</h2><p>${TEAMS[0]} ${g.scores[0]} · ${TEAMS[1]} ${g.scores[1]}</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
