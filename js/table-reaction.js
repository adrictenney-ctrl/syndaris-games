// Table screens for the reaction games (reaction-games.js). The action is up here — phones are
// just the buttons — so these redraw live while a race, pull or mole hunt is on.
import { partyTable, esc, clock, doneRow, sc, who, teamScores, TEAMS } from './table-party.js?v=68';
import * as X from './reaction-games.js?v=68';
import { tone } from './sfx.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const nm = (ctx, s) => esc(ctx.nameOf(s));
const countdown = g => `<div class="rx-count">${Math.max(1, Math.ceil((g.readyAt + 3500 - Date.now()) / 1000))}</div>`;

export const tugofwarT = partyTable(X.tugofwar, {
  id: 'tugofwar', defaults: { rounds: 3, secs: 20 }, settingsHTML: s => `<label>Pulls ${opt('rounds', s, [[1, 'One pull'], [3, 'Best of 3'], [5, 'Best of 5']])}</label>`,
  live: g => g.phase === 'pull' || g.phase === 'ready',
  center(g, ctx) {
    if (g.phase === 'over') return teamScores(g);
    const p = Math.max(-1, Math.min(1, X.tugofwar.pos(g) / X.tugofwar.LINE));
    const rope = `<div class="rx-rope"><i class="mark l"></i><i class="mark r"></i><div class="line"></div><span class="knot" style="left:${50 - p * 40}%">🎀</span><b class="t0">${TEAMS[0]}<small>${g.members[0].map(s => nm(ctx, s)).join(', ')}</small></b><b class="t1">${TEAMS[1]}<small>${g.members[1].map(s => nm(ctx, s)).join(', ')}</small></b></div>`;
    const head = `${teamScores(g)}<p class="pt-kicker">Pull ${g.round} of ${g.settings.rounds}</p>`;
    if (g.phase === 'ready') return `${head}${rope}${countdown(g)}`;
    if (g.phase === 'pull') return `${head}${rope}<p class="pt-big">PULL! Tap tap tap!</p>${clock()}`;
    return `${head}${rope}<p class="pt-big">${g.roundWin == null ? 'A draw!' : `${TEAMS[g.roundWin]} wins the pull!`}</p>`;
  },
});
function raceTable(E, id, light) {
  return partyTable(E, {
    id, defaults: { rounds: 3 }, settingsHTML: s => `<label>Races ${opt('rounds', s, [[1, '1'], [3, '3'], [5, '5']])}</label>`,
    live: g => g.phase === 'race' || g.phase === 'ready',
    center(g, ctx) {
      if (g.phase === 'over') return sc(g, ctx);
      const lanes = `<div class="rx-lanes">${g.order.map(s => `<div class="rx-lane"><span class="nm"><i style="background:var(--seat-${s})"></i>${nm(ctx, s)}</span><div class="track"><b style="left:${(g.posn[s] / E.finish) * 100}%">${light ? '🏃' : '🏇'}</b>${g.place.includes(s) ? `<em>#${g.place.indexOf(s) + 1}</em>` : ''}</div></div>`).join('')}</div>`;
      const lamp = light && g.phase === 'race' ? `<div class="rx-light ${g.green ? 'green' : 'red'}">${g.green ? 'GREEN — GO!' : 'RED — FREEZE!'}</div>` : '';
      const head = `<p class="pt-kicker">Race ${g.round} of ${g.settings.rounds}</p>`;
      if (g.phase === 'ready') return `${head}${countdown(g)}${lanes}`;
      if (g.phase === 'race') return `${head}${lamp}${lanes}`;
      return `${head}${lanes}<p class="pt-big">${g.full.slice(0, 3).map((s, i) => `${['🥇', '🥈', '🥉'][i]} ${nm(ctx, s)}`).join('  ')}</p>${sc(g, ctx)}`;
    },
  });
}
export const tapderbyT = raceTable(X.tapderby, 'tapderby');
export const redlightT = raceTable(X.redlight, 'redlight', true);

// Musical Chairs plays its own little tune while the music phase lasts.
const TUNE = [523, 587, 659, 523, 659, 784, 659, 587, 523, 494, 523, 587];
let tuneT = null;
export const musicalchairsT = partyTable(X.musicalchairs, {
  id: 'musicalchairs', settingsHTML: () => '<span class="yc-note">One chair fewer than players · sitting early knocks you out</span>',
  badges: (g, s) => (g.alive.includes(s) ? (g.sat?.includes(s) ? ['<span class="badge got">🪑</span>'] : []) : ['<span class="badge">out</span>']),
  center(g, ctx) {
    clearInterval(tuneT);
    if (g.phase === 'music') { let i = 0; tuneT = setInterval(() => { tone(TUNE[i++ % TUNE.length], 0.22, { type: 'triangle', vol: 0.12 }); }, 260); }
    if (g.phase === 'over') return sc(g, ctx);
    const chairs = `<div class="rx-chairs">${Array.from({ length: Math.max(1, g.alive.length - 1) }, (_, i) => `<span>${g.sat[i] != null ? `<i style="background:var(--seat-${g.sat[i]})"></i>` : '🪑'}</span>`).join('')}</div>`;
    const dancers = `<div class="rx-dancers ${g.phase === 'music' ? 'dance' : ''}">${g.alive.map(s => `<span class="${g.fault.includes(s) ? 'fault' : ''}"><i style="background:var(--seat-${s})"></i>${nm(ctx, s)}</span>`).join('')}</div>`;
    if (g.phase === 'music') return `<p class="pt-kicker">Round ${g.round}</p><div class="rx-note">🎶</div>${chairs}${dancers}<p class="pt-sub">Wait for the music to stop…</p>`;
    if (g.phase === 'stop') return `<p class="rx-shout">SIT!</p>${chairs}${dancers}`;
    return `${chairs}<p class="pt-big">${g.out.map(s => who(ctx, s)).join(' ')} ${g.out.length > 1 ? 'are' : 'is'} out!</p>${dancers}`;
  },
});
// Stop the tune if the game is ended mid-song.
const mcReset = musicalchairsT.reset;
musicalchairsT.reset = () => { clearInterval(tuneT); mcReset(); };
export const quickdrawT = partyTable(X.quickdraw, {
  id: 'quickdraw', defaults: { rounds: 10 }, settingsHTML: s => `<label>Duels ${opt('rounds', s, [[5, '5'], [10, '10'], [15, '15']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    if (g.phase === 'wait') return `<p class="pt-kicker">Duel ${g.round} of ${g.settings.rounds}</p><div class="rx-draw wait">🤠 …</div><p class="pt-big">Steady… don’t draw yet</p>${g.fouls.length ? `<p class="pt-sub">Too early: ${g.fouls.map(s => nm(ctx, s)).join(', ')}</p>` : ''}${sc(g, ctx)}`;
    if (g.phase === 'draw') return `<div class="rx-draw go">DRAW!</div>`;
    return `<div class="rx-draw">${g.first >= 0 ? '💥' : '🌵'}</div><p class="pt-big">${g.first >= 0 ? `${who(ctx, g.first)} drew first — ${g.reaction} ms` : 'Nobody drew!'}</p>${sc(g, ctx)}`;
  },
});
const pads = (lit = -1) => `<div class="rx-pads">${X.PADS.map((p, i) => `<span class="${i === lit ? 'lit' : ''}" style="--c:${p.c}"></span>`).join('')}</div>`;
export const echoT = partyTable(X.echo, {
  id: 'echo', settingsHTML: () => '<span class="yc-note">The sequence grows each round · one mistake and you’re out</span>',
  live: g => g.phase === 'show', liveMs: 100,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const head = `<p class="pt-kicker">Sequence of ${g.seq.length} · ${g.alive.length} still in</p>`;
    if (g.phase === 'show') { const st = X.echo.step(g), t = (Date.now() - g.showAt) % 650; return `${head}${pads(st < g.seq.length && t < 450 ? g.seq[st] : -1)}<p class="pt-big">Watch… ${Math.min(st + 1, g.seq.length)} / ${g.seq.length}</p>`; }
    if (g.phase === 'repeat') return `${head}${pads()}<p class="pt-big">Now repeat it on your phone!</p>${clock()}${doneRow(g, ctx, g.alive)}`;
    return `${head}${pads()}<p class="pt-big">${g.fail.length ? `Out: ${g.fail.map(s => nm(ctx, s)).join(', ')}` : 'Everyone got it!'}</p>`;
  },
});
export const simonsaysT = partyTable(X.simonsays, {
  id: 'simonsays', defaults: { rounds: 15 }, settingsHTML: s => `<label>Commands ${opt('rounds', s, [[10, '10'], [15, '15'], [25, '25']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const P = X.PADS[g.color];
    if (g.phase === 'cmd') return `<p class="pt-kicker">Command ${g.round} of ${g.settings.rounds}</p><p class="rx-cmd">${g.simon ? 'Simon says… tap' : 'Tap'} <b style="color:${P.c}">${P.e} ${P.n.toUpperCase()}</b></p>`;
    return `<p class="rx-cmd small">${g.simon ? `Simon said ${P.e}` : 'Simon didn’t say! 😈'}</p><div class="qz-guesses">${g.order.map(s => `<span class="${g.gain[s] > 0 ? 'ok' : ''}">${nm(ctx, s)} ${g.gain[s] > 0 ? '+' : ''}${g.gain[s]}</span>`).join('')}</div>${sc(g, ctx)}`;
  },
});
export const memorygridT = partyTable(X.memorygrid, {
  id: 'memorygrid', defaults: { rounds: 6 }, settingsHTML: s => `<label>Rounds ${opt('rounds', s, [[4, '4'], [6, '6'], [8, '8']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const show = g.phase !== 'mark';
    const grid = `<div class="rx-grid">${Array.from({ length: 25 }, (_, i) => `<i class="${show && g.lit.includes(i) ? 'lit' : ''}"></i>`).join('')}</div>`;
    if (g.phase === 'show') return `<p class="pt-kicker">Round ${g.round} · ${g.lit.length} squares</p>${grid}<p class="pt-big">Memorise!</p>`;
    if (g.phase === 'mark') return `<p class="pt-kicker">Round ${g.round}</p>${grid}<p class="pt-big">Mark them on your phone</p>${clock()}${doneRow(g, ctx)}`;
    return `${grid}<div class="qz-guesses">${g.order.map(s => `<span class="${g.gain[s] === g.lit.length ? 'ok' : ''}">${nm(ctx, s)} +${g.gain[s]}</span>`).join('')}</div>${sc(g, ctx)}`;
  },
});
export const whackamoleT = partyTable(X.whackamole, {
  id: 'whackamole', defaults: { secs: 30 }, settingsHTML: s => `<label>Time ${opt('secs', s, [[20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds']])}</label>`,
  live: g => g.phase === 'play' || g.phase === 'ready', liveMs: 100,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    if (g.phase === 'ready') return `<p class="pt-big">Moles are coming…</p>${countdown(g)}`;
    const now = Date.now();
    const holes = `<div class="rx-holes">${Array.from({ length: 9 }, (_, h) => { const m = g.moles.find(x => x.h === h && x.until > now), hit = g.hits.find(x => x.h === h && now - x.at < 500); return `<span>${m ? `<b class="${m.gold ? 'gold' : ''}">${m.gold ? '🌟' : '🐹'}</b>` : hit ? `<em style="color:var(--seat-${hit.s})">💥</em>` : ''}</span>`; }).join('')}</div>`;
    return `${clock()}${holes}${sc(g, ctx)}`;
  },
});
export const counttogetherT = partyTable(X.counttogether, {
  id: 'counttogether', defaults: { tries: 5 }, settingsHTML: s => `<label>Tries ${opt('tries', s, [[3, '3'], [5, '5'], [8, '8']])}</label><span class="yc-note">A team game · no talking!</span>`,
  center(g, ctx) {
    const log = `<div class="wd-chain">${g.log.slice(-10).map(l => `<span><i style="background:var(--seat-${l.s})"></i>${l.n}</span>`).join('')}</div>`;
    if (g.phase === 'over') return `<p class="pt-big">${g.won ? `🏆 You counted to ${g.target} together!` : `Best count: ${g.best} of ${g.target}`}</p>`;
    if (g.phase === 'ready') return `<p class="pt-kicker">Try ${g.tries} of ${g.settings.tries}</p><div class="rx-num">0</div><p class="pt-big">Count to ${g.target} — one at a time, no talking</p>`;
    if (g.phase === 'count') return `<p class="pt-kicker">Try ${g.tries} of ${g.settings.tries} · target ${g.target}</p><div class="rx-num">${g.count}</div>${log}`;
    return `<div class="rx-num bad">${g.count}</div><p class="pt-big">💥 ${esc(g.fail).replace(/@(\d+)@/g, (_, s) => nm(ctx, Number(s)))}</p>${log}`;
  },
});
