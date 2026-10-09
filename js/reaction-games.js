// Reaction games: watch the table, act on your phone. Tug of War, Tap Derby, Red Light Green
// Light, Musical Chairs, Quick Draw, Echo, Memory Grid, Simon Says, Whack-a-Mole, Count Together.
// Button-mashing arrives in small batches (play-party's 'tap' control) as drafts.
import { base, shuffle, pick, sfx, left, waiting, announce, teams, TEAMS } from './party.js?v=68';

const R = n => Math.floor(Math.random() * n);
const topWin = g => { const top = Math.max(...g.order.map(s => g.score[s])); g.winners = g.order.filter(s => g.score[s] === top); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; };
const noBot = () => null;

// ---------------------------------------------------------------- Tug of War
export const tugofwar = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 3, secs: 20 }); teams(g); g.round = 0; start(g); return g; };
  function start(g) { g.round++; g.pull = [0, 0]; g.taps = g.seats.map(() => 0); g.phase = 'ready'; g.readyAt = Date.now(); g.moveId++; }
  E.pos = g => g.pull[0] / Math.max(1, g.members[0].length) - g.pull[1] / Math.max(1, g.members[1].length);
  const LINE = 40;
  function end(g, w) { g.roundWin = w; if (w != null) g.scores[w]++; g.phase = 'roundEnd'; g.endAt = 0; g.endShown = Date.now(); sfx(g, 'chime'); g.moveId++; }
  E.draft = (g, seat, d) => {
    if (g.phase !== 'pull' || !(d.taps > 0)) return false;
    const n = Math.min(Number(d.taps), 25), t = g.team[seat];
    g.pull[t] += n; g.taps[seat] += n;
    if (Math.abs(E.pos(g)) >= LINE) end(g, E.pos(g) > 0 ? 0 : 1);
    return true;
  };
  E.collecting = g => g.phase === 'pull'; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'pull' ? g.order : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 600;
  E.applyAction = (g, seat, a) => (a?.type === 'taps' ? (E.draft(g, seat, { taps: a.n }), null) : 'Not now');
  E.tick = g => {
    if (g.phase === 'ready') return { ms: Math.max(0, g.readyAt + 3500 - Date.now()), run: () => { g.phase = 'pull'; g.endAt = Date.now() + g.settings.secs * 1000; sfx(g, 'thud'); g.moveId++; } };
    if (g.phase === 'pull') return { ms: Math.max(0, g.endAt - Date.now()), run: () => end(g, Math.abs(E.pos(g)) < 1 ? null : E.pos(g) > 0 ? 0 : 1) };
    if (g.phase === 'roundEnd') return { ms: Math.max(0, g.endShown + 5000 - Date.now()), run: () => {
      if (g.round >= g.settings.rounds || Math.max(...g.scores) > g.settings.rounds / 2) { g.winner = g.scores[0] === g.scores[1] ? null : g.scores[0] > g.scores[1] ? 0 : 1; g.phase = 'over'; g.moveId++; return; }
      start(g);
    } };
    return null;
  };
  E.botAction = () => ({ type: 'taps', n: 1 + (Math.random() < 0.4 ? 1 : 0) });
  E.LINE = LINE;
  E.viewFor = (g, seat) => {
    const t = g.team[seat];
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'pull' ? left(g) : 0, teamName: TEAMS[t], myTeam: t, hud: [[TEAMS[t], g.scores[t]], [TEAMS[1 - t], g.scores[1 - t]]] };
    if (g.phase === 'ready') v.ui = { k: 'wait', key: 'r' + g.round, buzz: true, title: 'Get ready to PULL!', sub: 'Tap as fast as you can when it starts' };
    else if (g.phase === 'pull') v.ui = { k: 'tap', key: 'p' + g.round, title: 'PULL! 💪', sub: `Pull for ${TEAMS[t]}`, label: 'PULL!', icon: '🪢', color: t ? '#1fb5a8' : '#e0382c', count: g.taps[seat] };
    else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: g.roundWin == null ? 'A draw!' : g.roundWin === t ? 'Your team won the pull! 🎉' : 'Pulled over the line!', sub: `You tapped ${g.taps[seat]} times` };
    else v.ui = { k: 'wait', title: g.winner == null ? 'A tie!' : g.winner === t ? '🏆 Your team wins!' : `${TEAMS[g.winner]} wins`, sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Tap Derby & Red Light, Green Light (tap races)
function tapRace({ finish = 100, light = false }) {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 3 }); g.round = 0; start(g); return g; };
  function start(g) { g.round++; g.posn = g.seats.map(() => 0); g.done = {}; g.place = []; g.green = true; g.phase = 'ready'; g.readyAt = Date.now(); g.moveId++; }
  function nextLight(g) { g.green = !g.green; g.switchAt = Date.now(); g.nextAt = Date.now() + (g.green ? 2000 + R(3500) : 1500 + R(2500)); sfx(g, g.green ? 'ding' : 'buzzer'); g.moveId++; }
  function end(g) {
    const rest = g.order.filter(s => !g.place.includes(s)).sort((a, b) => g.posn[b] - g.posn[a]);
    const full = [...g.place, ...rest];
    full.forEach((s, i) => { g.score[s] += Math.max(0, g.order.length - i); });
    g.full = full; g.phase = 'roundEnd'; g.endShown = Date.now(); sfx(g, 'chime'); g.moveId++;
  }
  E.draft = (g, seat, d) => {
    if (g.phase !== 'race' || g.place.includes(seat) || !(d.taps > 0)) return false;
    // Red light: anything that arrives well after the light changed sends you back to the start.
    if (light && !g.green && Date.now() - g.switchAt > 900) { g.posn[seat] = 0; announce(g, seat, '🚨 Caught moving!'); sfx(g, 'sad'); return true; }
    g.posn[seat] = Math.min(finish, g.posn[seat] + Math.min(Number(d.taps), 25));
    if (g.posn[seat] >= finish) { g.place.push(seat); announce(g, seat, `#${g.place.length}! 🏁`); if (g.place.length >= Math.min(3, g.order.length)) end(g); }
    return true;
  };
  E.collecting = g => g.phase === 'race'; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'race' && (!light || g.green) ? g.order.filter(s => !g.place.includes(s)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 600;
  E.applyAction = (g, seat, a) => (a?.type === 'taps' ? (E.draft(g, seat, { taps: a.n }), null) : 'Not now');
  E.tick = g => {
    if (g.phase === 'ready') return { ms: Math.max(0, g.readyAt + 3500 - Date.now()), run: () => { g.phase = 'race'; g.raceEnd = Date.now() + 60000; g.switchAt = Date.now(); g.nextAt = Date.now() + 2500 + R(3000); sfx(g, 'thud'); g.moveId++; } };
    if (g.phase === 'race') return light ? { ms: Math.max(0, Math.min(g.nextAt, g.raceEnd) - Date.now()), run: () => (Date.now() >= g.raceEnd ? end(g) : nextLight(g)) } : { ms: Math.max(0, g.raceEnd - Date.now()), run: () => end(g) };
    if (g.phase === 'roundEnd') return { ms: Math.max(0, g.endShown + 5000 - Date.now()), run: () => (g.round >= g.settings.rounds ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = () => ({ type: 'taps', n: 1 + (Math.random() < 0.4 ? 1 : 0) });
  E.finish = finish;
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, hud: [['Points', g.score[seat] ?? 0], ['Race', `${g.round}/${g.settings.rounds}`]] };
    if (g.phase === 'ready') v.ui = { k: 'wait', key: 'r' + g.round, buzz: true, title: 'On your marks…', sub: light ? 'Tap on GREEN only — moving on RED sends you back!' : 'Tap as fast as you can!' };
    else if (g.phase === 'race') v.ui = g.place.includes(seat) ? { k: 'wait', title: `Finished #${g.place.indexOf(seat) + 1}! 🏁`, sub: '' }
      : light && !g.green ? { k: 'tap', key: 'red' + g.switchAt, title: '🔴 RED — FREEZE!', sub: 'Don’t tap!', label: 'STOP', icon: '✋', color: '#a8232a', count: g.posn[seat], cls: 'red' }
        : { k: 'tap', key: 'g' + g.round + (light ? g.switchAt : ''), title: light ? '🟢 GREEN — GO!' : 'GO GO GO!', sub: `${g.posn[seat]} / ${finish}`, label: 'RUN!', icon: light ? '🏃' : '🏇', color: '#2a8a4a', count: g.posn[seat] };
    else if (g.phase === 'roundEnd') v.ui = { k: 'wait', title: `You came #${g.full.indexOf(seat) + 1}`, sub: '' };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Fastest fingers!' : 'Game over', sub: '' };
    return v;
  };
  return E;
}
export const tapderby = tapRace({ finish: 100 });
export const redlight = tapRace({ finish: 120, light: true });

// ---------------------------------------------------------------- Musical Chairs
export const musicalchairs = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, {}); g.alive = [...g.order]; g.round = 0; start(g); return g; };
  function start(g) { g.round++; g.sat = []; g.fault = []; g.phase = 'music'; g.stopAt = Date.now() + 5000 + R(9000); g.moveId++; }
  function settle(g) {
    const out = g.alive.filter(s => !g.sat.includes(s));
    g.out = out.length ? out : [g.sat[g.sat.length - 1]];
    g.alive = g.alive.filter(s => !g.out.includes(s));
    for (const s of g.out) g.score[s] = g.round;
    g.phase = 'result'; g.resAt = Date.now(); sfx(g, 'sad'); g.moveId++;
  }
  E.collecting = () => false; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'stop' ? g.alive.filter(s => !g.sat.includes(s) && !g.fault.includes(s)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 400 + Math.random() * 1600;
  E.applyAction = (g, seat, a) => {
    if (!a || a.type !== 'sit') return 'Not now';
    if (!g.alive.includes(seat)) return 'You’re out';
    if (g.phase === 'music') { if (!g.fault.includes(seat)) { g.fault.push(seat); announce(g, seat, 'Sat too early! 🙈'); g.moveId++; } return null; }
    if (g.phase !== 'stop') return 'Not now';
    if (g.sat.includes(seat) || g.fault.includes(seat)) return 'Already sitting';
    g.sat.push(seat);
    sfx(g, 'thud');
    if (g.sat.length >= g.alive.length - 1) settle(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'music') return { ms: Math.max(0, g.stopAt - Date.now()), run: () => { g.phase = 'stop'; g.stoppedAt = Date.now(); g.moveId++; } };
    if (g.phase === 'stop') return { ms: Math.max(0, g.stoppedAt + 8000 - Date.now()), run: () => settle(g) };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 4500 - Date.now()), run: () => {
      if (g.alive.length <= 1) { for (const s of g.alive) g.score[s] = g.round + 1; topWin(g); return; }
      start(g);
    } };
    return null;
  };
  E.botAction = () => ({ type: 'sit' });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, hud: [['Players left', g.alive.length], ['Chairs', Math.max(1, g.alive.length - 1)]] };
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Last one sitting!' : 'Game over', sub: '' };
    else if (!g.alive.includes(seat)) v.ui = { k: 'wait', title: 'You’re out 🎶', sub: 'Watch the rest' };
    else if (g.phase === 'music') v.ui = { k: 'buttons', key: 'm' + g.round + (g.fault.includes(seat) ? 'f' : ''), title: g.fault.includes(seat) ? 'You sat too early! 🙈' : '🎶 Dance! Wait for the music to stop…', sub: 'Tap SIT the moment it stops — not before!', buttons: [{ type: 'sit', label: 'SIT', icon: '🪑', cls: 'pp-huge', dis: g.fault.includes(seat) }] };
    else if (g.phase === 'stop') v.ui = g.sat.includes(seat) ? { k: 'wait', title: 'Seated ✓', sub: '' } : { k: 'buttons', key: 's' + g.round, buzz: true, title: '🛑 SIT DOWN!', sub: '', myturn: true, buttons: [{ type: 'sit', label: 'SIT!', icon: '🪑', go: true, cls: 'pp-huge', dis: g.fault.includes(seat) }] };
    else v.ui = { k: 'wait', title: g.out.includes(seat) ? 'No chair for you! 😱' : 'Safe!', sub: `Out: ${g.out.map(s => `@${s}@`).join(', ')}` };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Quick Draw
export const quickdraw = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 10 }); g.round = 0; start(g); return g; };
  function start(g) { g.round++; g.fouls = []; g.first = -1; g.phase = 'wait'; g.drawAt = Date.now() + 2500 + R(4500); g.moveId++; }
  E.collecting = () => false; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'draw' ? g.order.filter(s => !g.fouls.includes(s)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 350 + Math.random() * 900;
  E.applyAction = (g, seat, a) => {
    if (!a || a.type !== 'bang') return 'Not now';
    if (g.phase === 'wait') { if (!g.fouls.includes(seat)) { g.fouls.push(seat); g.score[seat] -= 1; announce(g, seat, 'Too early! −1'); g.moveId++; } return null; }
    if (g.phase !== 'draw' || g.fouls.includes(seat)) return 'Not now';
    g.first = seat; g.score[seat] += 2; g.reaction = Date.now() - g.drawnAt;
    announce(g, seat, `BANG! 🤠 ${g.reaction} ms`); sfx(g, 'buzzer');
    g.phase = 'result'; g.resAt = Date.now(); g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'wait') return { ms: Math.max(0, g.drawAt - Date.now()), run: () => { g.phase = 'draw'; g.drawnAt = Date.now(); g.moveId++; } };
    if (g.phase === 'draw') return { ms: Math.max(0, g.drawnAt + 5000 - Date.now()), run: () => { g.phase = 'result'; g.resAt = Date.now(); g.moveId++; } };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 3500 - Date.now()), run: () => (g.round >= g.settings.rounds ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = () => ({ type: 'bang' });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, hud: [['Points', g.score[seat] ?? 0], ['Duel', `${g.round}/${g.settings.rounds}`]] };
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Fastest in the West!' : 'Game over', sub: '' };
    else if (g.phase === 'wait') v.ui = { k: 'buttons', key: 'w' + g.round + g.fouls.includes(seat), title: g.fouls.includes(seat) ? 'Too early! 🙈' : 'Steady… watch the table', sub: 'Draw only when it says DRAW!', buttons: [{ type: 'bang', label: 'BANG', icon: '🔫', cls: 'pp-huge', dis: g.fouls.includes(seat) }] };
    else if (g.phase === 'draw') v.ui = { k: 'buttons', key: 'd' + g.round, buzz: true, title: 'DRAW!', sub: '', myturn: true, buttons: [{ type: 'bang', label: 'BANG!', icon: '💥', go: true, cls: 'pp-huge', dis: g.fouls.includes(seat) }] };
    else v.ui = { k: 'wait', title: g.first === seat ? `You won the draw! +2 (${g.reaction} ms)` : g.first >= 0 ? `@${g.first}@ was quickest` : 'Nobody drew', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Echo (repeat the sequence) & Simon Says
export const PADS = [{ n: 'Red', c: '#e8473c', e: '🔴' }, { n: 'Blue', c: '#3d8be8', e: '🔵' }, { n: 'Green', c: '#3fb35c', e: '🟢' }, { n: 'Yellow', c: '#f2c230', e: '🟡' }];
const padOpts = (dis = false) => PADS.map((p, i) => ({ v: i, label: p.e, color: p.c, cls: 'rx-pad', dis }));
export const echo = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, {}); g.alive = [...g.order]; g.seq = [R(4), R(4)]; g.round = 0; start(g); return g; };
  function start(g) { g.round++; g.seq.push(R(4)); g.sel = {}; g.done = {}; g.fail = []; g.phase = 'show'; g.showAt = Date.now(); g.moveId++; }
  const showMs = g => g.seq.length * 650 + 800;
  E.step = g => Math.floor((Date.now() - g.showAt) / 650);
  function settle(g) {
    g.fail = g.alive.filter(s => !(g.done[s] === true));
    if (g.fail.length < g.alive.length) g.alive = g.alive.filter(s => !g.fail.includes(s));
    for (const s of g.alive) g.score[s] = g.seq.length;
    g.phase = 'result'; g.resAt = Date.now(); sfx(g, g.fail.length ? 'sad' : 'chime'); g.moveId++;
  }
  E.collecting = g => g.phase === 'repeat'; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'repeat' ? g.alive.filter(s => g.done[s] == null) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 900;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'repeat' || a.type !== 'pick') return 'Not now';
    if (!g.alive.includes(seat) || g.done[seat] != null) return 'Wait for the next round';
    const cur = g.sel[seat] || (g.sel[seat] = []);
    const i = Number(a.v);
    cur.push(i);
    if (g.seq[cur.length - 1] !== i) g.done[seat] = false;
    else if (cur.length === g.seq.length) g.done[seat] = true;
    if (!E.pending(g).length) settle(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'show') return { ms: Math.max(0, g.showAt + showMs(g) - Date.now()), run: () => { g.phase = 'repeat'; g.endAt = Date.now() + 4000 + g.seq.length * 1200; g.moveId++; } };
    if (g.phase === 'repeat') return { ms: Math.max(0, g.endAt - Date.now()), run: () => settle(g) };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 3500 - Date.now()), run: () => (g.alive.length <= 1 || g.seq.length >= 20 ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => { const cur = g.sel[s] || []; const right = g.seq[cur.length]; return { type: 'pick', v: Math.random() < 0.97 - g.seq.length * 0.02 ? right : R(4) }; };
  E.showMs = showMs;
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'repeat' ? left(g) : 0, hud: [['Length', g.seq.length], ['Still in', g.alive.length]] };
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Perfect memory!' : 'Game over', sub: `Longest: ${g.score[seat]}` };
    else if (!g.alive.includes(seat)) v.ui = { k: 'wait', title: 'You’re out', sub: 'Watch the others' };
    else if (g.phase === 'show') v.ui = { k: 'wait', key: 's' + g.round, buzz: true, title: '👀 Watch the table!', sub: `Remember all ${g.seq.length} colours` };
    else if (g.phase === 'repeat') { const cur = g.sel[seat] || []; v.ui = g.done[seat] != null ? { k: 'wait', title: g.done[seat] ? 'Perfect ✓' : 'Oops ✗', sub: 'Waiting for the others…' } : { k: 'pick', key: 'r' + g.round + ':' + cur.length, title: `Repeat it: ${cur.length} of ${g.seq.length}`, sub: 'In the same order', myturn: true, grid: 2, cards: true, options: padOpts() }; }
    else v.ui = { k: 'wait', title: g.fail.includes(seat) ? 'Out! 💥' : 'Through! ✓', sub: '' };
    return v;
  };
  return E;
})();
export const simonsays = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 15 }); g.round = 0; start(g); return g; };
  function start(g) { g.round++; g.color = R(4); g.simon = Math.random() < 0.65; g.tapped = {}; g.phase = 'cmd'; g.cmdAt = Date.now(); g.endAt = g.cmdAt + 3500; g.moveId++; }
  function settle(g) {
    g.gain = {};
    const right = Object.keys(g.tapped).map(Number).filter(s => g.simon && g.tapped[s].c === g.color).sort((a, b) => g.tapped[a].t - g.tapped[b].t);
    for (const s of g.order) {
      const t = g.tapped[s];
      g.gain[s] = !t ? (g.simon ? 0 : 1) : !g.simon || t.c !== g.color ? -1 : right[0] === s ? 2 : 1;
      g.score[s] += g.gain[s];
    }
    g.phase = 'result'; g.resAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'cmd'; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'cmd' ? g.order.filter(s => !g.tapped[s]) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 700 + Math.random() * 1500;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'cmd' || a.type !== 'pick') return 'Not now';
    if (g.tapped[seat]) return 'Already tapped';
    g.tapped[seat] = { c: Number(a.v), t: Date.now() };
    g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'cmd') return { ms: Math.max(0, g.endAt - Date.now()), run: () => settle(g) };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 2800 - Date.now()), run: () => (g.round >= g.settings.rounds ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = g => (!g.simon && Math.random() < 0.8 ? null : { type: 'pick', v: Math.random() < 0.85 ? g.color : R(4) });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, hud: [['Points', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Simon’s favourite!' : 'Game over', sub: '' };
    else if (g.phase === 'cmd') v.ui = g.tapped[seat] ? { k: 'wait', title: 'Tapped!', sub: '' } : { k: 'pick', key: 'c' + g.round, title: '👀 Listen to the table!', sub: 'Only tap if Simon says…', grid: 2, cards: true, options: padOpts() };
    else v.ui = { k: 'wait', title: g.gain[seat] > 0 ? `+${g.gain[seat]}` : g.gain[seat] < 0 ? 'Gotcha! −1' : 'Too slow', sub: g.simon ? `Simon said ${PADS[g.color].n}` : 'Simon didn’t say!' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Memory Grid
export const memorygrid = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 6 }); g.round = 0; start(g); return g; };
  function start(g) { g.round++; g.lit = shuffle([...Array(25).keys()]).slice(0, 3 + g.round); g.marks = g.seats.map(() => []); g.done = {}; g.phase = 'show'; g.showAt = Date.now(); g.moveId++; }
  function settle(g) {
    g.gain = {};
    for (const s of g.order) { const m = g.marks[s]; g.gain[s] = Math.max(0, m.filter(i => g.lit.includes(i)).length - m.filter(i => !g.lit.includes(i)).length); g.score[s] += g.gain[s]; }
    g.phase = 'result'; g.endAt = 0; g.resAt = Date.now(); sfx(g, 'chime'); g.moveId++;
  }
  E.collecting = g => g.phase === 'mark'; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'mark' ? waiting(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 600;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'mark') return 'Not now';
    if (g.done[seat]) return 'Already in';
    if (a.type === 'done') { g.done[seat] = true; if (!waiting(g).length) settle(g); else g.moveId++; return null; }
    if (a.type !== 'toggle') return 'Tap the squares';
    const i = Number(a.v), m = g.marks[seat];
    if (!(i >= 0 && i < 25)) return 'Tap a square';
    g.marks[seat] = m.includes(i) ? m.filter(x => x !== i) : [...m, i];
    g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'show') return { ms: Math.max(0, g.showAt + 2500 + g.round * 300 - Date.now()), run: () => { g.phase = 'mark'; g.endAt = Date.now() + 25000; g.moveId++; } };
    if (g.phase === 'mark') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => settle(g) };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 4500 - Date.now()), run: () => (g.round >= g.settings.rounds ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => (g.marks[s].length >= g.lit.length ? { type: 'done' } : { type: 'toggle', v: Math.random() < 0.75 ? g.lit.find(i => !g.marks[s].includes(i)) : R(25) });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'mark' ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Squares', g.lit.length]] };
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Photographic memory!' : 'Game over', sub: '' };
    else if (g.phase === 'show') v.ui = { k: 'wait', key: 's' + g.round, buzz: true, title: '👀 Memorise the lit squares on the table!', sub: `${g.lit.length} squares` };
    else if (g.phase === 'mark') v.ui = g.done[seat] ? { k: 'wait', title: 'Locked in ✓', sub: '' } : { k: 'toggles', key: 'm' + g.round, title: `Tap the ${g.lit.length} squares`, sub: `${g.marks[seat].length} marked · wrong ones cost a point`, myturn: true, grid: 5, options: Array.from({ length: 25 }, (_, i) => ({ v: i, label: ' ', on: g.marks[seat].includes(i), cls: 'rx-cell' })), buttons: [{ type: 'done', label: 'Done ✓', go: true }] };
    else v.ui = { k: 'wait', title: `+${g.gain[seat]}`, sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Whack-a-Mole
export const whackamole = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { secs: 30 }); g.moles = []; g.hits = []; g.phase = 'ready'; g.readyAt = Date.now(); g.nextMole = 0; return g; };
  function spawn(g) {
    const now = Date.now();
    g.moles = g.moles.filter(m => m.until > now);
    const free = [...Array(9).keys()].filter(h => !g.moles.some(m => m.h === h));
    if (free.length) g.moles.push({ id: (g.moleId = (g.moleId || 0) + 1), h: pick(free), until: now + 1100 + R(700), gold: Math.random() < 0.12 });
    g.nextMole = now + 450 + R(500);
    g.moveId++;
  }
  E.collecting = () => false; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'play' && g.moles.some(m => m.until > Date.now()) ? [...g.order] : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 500 + Math.random() * 600;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'play' || a.type !== 'pick') return 'Not now';
    const h = Number(a.v), now = Date.now();
    const m = g.moles.find(x => x.h === h && x.until > now - 250);
    if (!m) { g.score[seat] = Math.max(0, g.score[seat] - 1); g.moveId++; return null; }
    g.moles = g.moles.filter(x => x !== m);
    g.score[seat] += m.gold ? 3 : 1;
    g.hits.push({ s: seat, h, at: now });
    g.hits = g.hits.slice(-12);
    sfx(g, 'ding');
    g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'ready') return { ms: Math.max(0, g.readyAt + 3500 - Date.now()), run: () => { g.phase = 'play'; g.endAt = Date.now() + g.settings.secs * 1000; spawn(g); } };
    if (g.phase === 'play') return { ms: Math.max(0, Math.min(g.nextMole, g.endAt) - Date.now()), run: () => (Date.now() >= g.endAt ? topWin(g) : spawn(g)) };
    return null;
  };
  E.botAction = (g, s) => { const m = g.moles.filter(x => x.until > Date.now()); return m.length && Math.random() < 0.6 ? { type: 'pick', v: pick(m).h } : null; };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'play' ? left(g) : 0, hud: [['Whacks', g.score[seat] ?? 0], ['Lead', Math.max(...g.order.map(s => g.score[s]))]] };
    if (g.phase === 'ready') v.ui = { k: 'wait', key: 'r', buzz: true, title: 'Get ready to whack!', sub: 'Watch the table — tap the hole where a mole pops up. Misses cost a point.' };
    else if (g.phase === 'play') v.ui = { k: 'pick', key: 'play', title: 'WHACK! 🔨', sub: 'Look at the table, tap the matching hole', myturn: true, grid: 3, options: Array.from({ length: 9 }, (_, i) => ({ v: i, label: '🕳️', cls: 'rx-hole' })) };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Top whacker!' : 'Time!', sub: `${g.score[seat]} whacks` };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Count Together (co-op, no talking)
export const counttogether = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { tries: 5 }); g.target = 10 + g.order.length * 2; g.tries = 0; g.best = 0; start(g); return g; };
  function start(g) { g.tries++; g.count = 0; g.lastBy = -1; g.lastAt = 0; g.log = []; g.phase = 'ready'; g.readyAt = Date.now(); g.moveId++; }
  function fail(g, why) { g.fail = why; g.best = Math.max(g.best, g.count); g.phase = 'fail'; g.failAt = Date.now(); sfx(g, 'buzzer'); g.moveId++; }
  E.collecting = () => false; E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'count' ? g.order.filter(s => s !== g.lastBy) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = (g, s) => 1500 + ((s * 7919 + g.count * 31) % 9) * 600 + Math.random() * 900;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'count' || a.type !== 'say') return 'Not now';
    const now = Date.now();
    if (seat === g.lastBy) return fail(g, `@${seat}@ said two in a row`), null;
    if (g.count && now - g.lastAt < 900) { g.log.push({ s: seat, n: g.count }); return fail(g, `@${seat}@ and @${g.lastBy}@ spoke at once on ${g.count}`), null; }
    g.count++; g.lastBy = seat; g.lastAt = now; g.log.push({ s: seat, n: g.count });
    sfx(g, 'ding');
    if (g.count >= g.target) { g.best = g.count; g.phase = 'over'; g.won = true; g.order.forEach(s => { g.score[s] = g.count; }); g.winners = [...g.order]; g.moveId++; return null; }
    g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'ready') return { ms: Math.max(0, g.readyAt + 3000 - Date.now()), run: () => { g.phase = 'count'; g.lastAt = Date.now(); g.moveId++; } };
    if (g.phase === 'count') return { ms: Math.max(0, g.lastAt + 25000 - Date.now()), run: () => fail(g, 'Too quiet — nobody counted for 25 seconds') };
    if (g.phase === 'fail') return { ms: Math.max(0, g.failAt + 4000 - Date.now()), run: () => { if (g.tries >= g.settings.tries) { g.phase = 'over'; g.won = false; g.order.forEach(s => { g.score[s] = g.best; }); g.winners = []; g.moveId++; } else start(g); } };
    return null;
  };
  E.botAction = () => ({ type: 'say' });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, hud: [['Count', `${g.count}/${g.target}`], ['Try', `${g.tries}/${g.settings.tries}`]] };
    if (g.phase === 'over') v.ui = { k: 'wait', title: g.won ? `🏆 You counted to ${g.target} together!` : `Best: ${g.best}`, sub: '' };
    else if (g.phase === 'ready') v.ui = { k: 'wait', key: 'r' + g.tries, buzz: true, title: 'No talking, no signals', sub: `Count to ${g.target} — one tap per number, never two at once` };
    else if (g.phase === 'count') v.ui = { k: 'buttons', key: 'c' + g.tries, title: `Next: ${g.count + 1}`, sub: g.lastBy === seat ? 'You said the last one — wait' : 'Tap when it feels like your turn', buttons: [{ type: 'say', label: `Say ${g.count + 1}`, go: true, cls: 'pp-huge', dis: g.lastBy === seat }] };
    else v.ui = { k: 'wait', title: 'Collision! 💥', sub: g.fail.replace(/@(\d+)@/g, '@$1@') };
    return v;
  };
  return E;
})();
