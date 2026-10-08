// Cash Out on the table: the pot in a brass-framed counter, the two dice, a track of the
// rolls this round (the first three are safe — after that a 7 wipes the pot), and who has
// already cashed out.
import * as C from './cashout.js?v=60';
import { snap } from './cards.js?v=60';
import { dieHTML } from './table-yacht.js?v=60';

let root = null, lastRoll = -1, potShown = 0, potAnim = 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function build() {
  root = document.createElement('div');
  root.id = 'cashout';
  root.innerHTML = `<p class="co-round"></p>
    <div class="co-vault"><small>The pot</small><b class="co-pot">0</b><span class="co-fx"></span></div>
    <div class="co-dice"></div>
    <div class="co-track"></div>
    <p class="co-msg"></p>
    <div class="co-banked"></div>`;
  document.getElementById('center').appendChild(root);
}

// Count the pot up (or down) smoothly to its new value.
function showPot(target) {
  cancelAnimationFrame(potAnim);
  const el = root.querySelector('.co-pot');
  const from = potShown, t0 = performance.now();
  const step = t => {
    const k = Math.min(1, (t - t0) / 500);
    potShown = Math.round(from + (target - from) * (1 - (1 - k) ** 3));
    el.textContent = potShown.toLocaleString();
    if (k < 1) potAnim = requestAnimationFrame(step);
  };
  potAnim = requestAnimationFrame(step);
  setTimeout(() => { potShown = target; el.textContent = target.toLocaleString(); }, 650);
}

export default {
  defaults: { rounds: 15 },
  settingsHTML: s => `<label>Rounds <select data-set="rounds">${[10, 15, 20].map(n => `<option value="${n}" ${n === s.rounds ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <span class="yc-note">First 3 rolls are safe · then a 7 ends the round, doubles double the pot</span>`,

  create: (settings, players) => C.createGame(settings, players),
  act: C.applyAction,
  bot: () => ({ type: 'roll' }),
  view: C.viewFor,
  turn: C.roller,
  timer(g, players) {
    if (g.phase === 'roundOver') return { ms: Math.max(0, g.nextAt - Date.now()) + 20, run: () => C.advance(g) };
    const p = C.planBots(g, players);
    if (!p) return null;
    return { ms: Math.max(0, p.at - Date.now()), run: () => { if (C.applyAction(g, p.seat, { type: p.type })) g.botPlan = null; } };
  },
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (seat in g.banked) badges.push(`<span class="badge got">+${g.banked[seat]}</span>`);
    else if (g.phase === 'roundOver' && g.bustBy != null) badges.push('<span class="badge lost">bust</span>');
    if (g.phase === 'roll' && C.roller(g) === seat) badges.push('<span class="badge">rolling</span>');
    if (g.phase === 'over' && g.winners.includes(seat)) badges.push('<span class="badge got">🏆 winner</span>');
    return { badges, meta: `<span><b>${g.scores[seat].toLocaleString()}</b> points</span>`, cards: 0, turn: g.phase === 'roll' && C.roller(g) === seat, out: g.phase === 'roll' && seat in g.banked };
  },

  reset() { root?.remove(); root = null; lastRoll = -1; potShown = 0; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    root.style.setProperty('--v', ctx.vmin + 'px');
    root.querySelector('.co-round').innerHTML = `Round <b>${g.round}</b> of ${g.settings.rounds}`;
    const vault = root.querySelector('.co-vault');
    vault.classList.toggle('danger', g.phase === 'roll' && g.rolls >= C.SAFE);
    vault.classList.toggle('bust', g.phase !== 'roll' && g.bustBy != null);
    if (potShown !== g.pot) showPot(g.pot);

    const rolled = g.rollId !== lastRoll;
    if (rolled) {
      const dice = root.querySelector('.co-dice');
      dice.innerHTML = g.dice ? g.dice.map((d, i) => dieHTML(d, lastRoll !== -1 ? 'tumble' : '').replace('class="ydie', `style="--r:${i ? 9 : -12}deg" class="ydie`)).join('') : '';
      const fx = root.querySelector('.co-fx');
      fx.textContent = g.last ? (g.last.effect === 'bust' ? 'SEVEN!' : g.last.effect) : '';
      fx.className = `co-fx${g.last ? ` show ${g.last.effect === 'bust' ? 'bad' : g.last.effect === '×2' ? 'dbl' : g.last.effect === '+70' ? 'big' : ''}` : ''}`;
      if (lastRoll !== -1 && g.dice) { snap(0.5); setTimeout(() => snap(0.35), 140); }
      lastRoll = g.rollId;
    }
    if (!g.dice) root.querySelector('.co-fx').className = 'co-fx';

    const n = Math.max(g.rolls + (g.phase === 'roll' ? 1 : 0), 6);
    root.querySelector('.co-track').innerHTML = Array.from({ length: n }, (_, i) =>
      `<i class="${i < C.SAFE ? 'safe' : 'risk'}${i < g.rolls ? ' done' : ''}${i === g.rolls && g.phase === 'roll' ? ' next' : ''}">${i + 1}</i>`).join('');

    const msg = root.querySelector('.co-msg');
    if (g.phase === 'roll') {
      const r = C.roller(g);
      msg.innerHTML = g.rolls < C.SAFE ? `<b>${esc(ctx.nameOf(r))}</b> rolls · safe roll — a 7 adds 70` : `<b>${esc(ctx.nameOf(r))}</b> rolls · a 7 ends it · doubles double it`;
    } else if (g.phase === 'roundOver') {
      msg.innerHTML = g.bustBy != null ? `<b>Seven!</b> Anyone still in gets nothing this round` : 'Everyone cashed out';
    } else msg.innerHTML = '';

    root.querySelector('.co-banked').innerHTML = Object.entries(g.banked).map(([s, v]) => `<span><i style="background:var(--seat-${s})"></i>${esc(ctx.nameOf(Number(s)))} <b>+${v}</b></span>`).join('');
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.scores[b] - g.scores[a]);
    const names = g.winners.map(s => ctx.nameOf(s));
    return {
      key: 'over' + g.round,
      html: `<h2>${names.length > 1 ? `${names.join(' & ')} tie` : `${names[0]} wins`}</h2><p>${g.scores[order[0]].toLocaleString()} points after ${g.settings.rounds} rounds</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.scores[s].toLocaleString()}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
