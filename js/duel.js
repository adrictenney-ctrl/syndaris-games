// Shared plumbing for the quick two-player board games (Trio, Four Up, Seed Stones):
// a best-of series around single games, turn order that alternates who starts, and the
// draw/resign bookkeeping. Each game supplies: fresh(g), legal(g), play(g, move), winner(g),
// and a bot. Seat 0 and seat 1 play; `g.p` is the side to move (0 or 1).

export function createSeries(settings, extra) {
  const g = { settings: { bestOf: 3, level: 'normal', ...settings }, wins: [0, 0], draws: 0, gameNo: 0, phase: 'play', annId: 0, moveId: 0, ...extra };
  return g;
}

export const needed = g => Math.floor(g.settings.bestOf / 2) + 1;

export function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }

// Called by a game when a single game ends (winner: 0, 1 or null for a draw).
export function gameOver(g, winner, why) {
  g.result = { winner, why, gameNo: g.gameNo };
  if (winner == null) g.draws++;
  else g.wins[winner]++;
  const done = g.wins.some(w => w >= needed(g)) || g.gameNo >= g.settings.bestOf + 3;
  g.phase = done ? 'over' : 'between';
  g.nextAt = Date.now() + 3200;
  if (done) g.champion = g.wins[0] === g.wins[1] ? null : g.wins[0] > g.wins[1] ? 0 : 1;
}

// The next game in the series: the other player starts.
export function nextGame(g, fresh) {
  g.gameNo++;
  g.result = null;
  g.phase = 'play';
  fresh(g);
  g.p = g.gameNo % 2;
}

export function seriesTimer(g, fresh) {
  if (g.phase === 'between') return { ms: Math.max(0, g.nextAt - Date.now()) + 20, run: () => nextGame(g, fresh) };
  return null;
}

export const seriesText = (g, nameOf) => `${nameOf(0)} ${g.wins[0]} – ${g.wins[1]} ${nameOf(1)}${g.draws ? ` · ${g.draws} drawn` : ''}`;

export const BEST_OF = s => `<label>Match <select data-set="bestOf">${[[1, 'One game'], [3, 'Best of 3'], [5, 'Best of 5'], [7, 'Best of 7']].map(([v, t]) => `<option value="${v}" ${v === s.bestOf ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
export const LEVEL = s => `<label>Computer <select data-set="level" data-str="1">${[['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']].map(([v, t]) => `<option value="${v}" ${v === s.level ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
export function applyLevel(s, key, el) { if (key !== 'level') return false; s.level = el.value; return true; }

export function duelPlate(g, seat, marker) {
  const badges = [];
  if (g.phase === 'over' && g.champion === seat) badges.push('<span class="badge got">🏆 match</span>');
  else if (g.result && g.result.winner === seat && g.phase !== 'play') badges.push('<span class="badge got">wins this one</span>');
  return {
    badges,
    meta: `${marker}<span><b>${g.wins[seat]}</b> win${g.wins[seat] === 1 ? '' : 's'}</span>`,
    cards: 0, turn: g.phase === 'play' && g.p === seat, out: false,
  };
}

export function duelOverlay(g, ctx, key) {
  if (g.phase !== 'over') return null;
  const head = g.champion == null ? 'A drawn match' : `${ctx.nameOf(g.champion)} wins the match`;
  return {
    key: key + g.gameNo,
    html: `<h2>${head}</h2><p>${seriesText(g, ctx.nameOf)}</p>
      <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
  };
}
