// Rebel Cell (and Round Table): hidden loyalties over five missions. A few players are secretly
// Spies and know each other; everyone else is loyal and knows nothing. Each round the leader
// proposes a team; everyone votes. If most approve, the team goes on the mission and each member
// secretly plays Success or Sabotage (loyal players must play Success). One Sabotage fails the
// mission (two on the 4th mission with 7+ players). Three successful missions win for the
// loyal side; three failures — or five rejected teams in a row — win for the Spies.
//
// Round Table adds characters: the Seer (loyal) knows the spies; the Squire knows who might be
// the Seer; the Witch (spy) looks like the Seer to the Squire; the Black Knight (spy) is hidden
// from the Seer; the Lone Wolf (spy) doesn't know the other spies and they don't know him. If the
// loyal side wins three missions, the Knife (a spy) gets one guess at the Seer — and wins if
// right. Our own names and art.

export const SPIES = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };
export const TEAMS = { 5: [2, 3, 2, 3, 3], 6: [2, 3, 4, 3, 4], 7: [2, 3, 3, 4, 4], 8: [3, 4, 4, 5, 5], 9: [3, 4, 4, 5, 5], 10: [3, 4, 4, 5, 5] };
export const ROLE = {
  loyal: { name: 'Loyalist', side: 0, ic: '🛡️', text: 'Win three missions. Trust carefully.' },
  spy: { name: 'Spy', side: 1, ic: '🕵️', text: 'Sabotage three missions. You know the other spies.' },
  seer: { name: 'Seer', side: 0, ic: '🔮', text: 'You know the spies (but not the Black Knight). Don’t let the Knife find you.' },
  squire: { name: 'Squire', side: 0, ic: '🐎', text: 'You know who might be the Seer. Protect them.' },
  knife: { name: 'The Knife', side: 1, ic: '🔪', text: 'A spy. If the loyalists win, you get one guess at the Seer.' },
  witch: { name: 'Witch', side: 1, ic: '🧙', text: 'A spy who looks like the Seer to the Squire.' },
  black: { name: 'Black Knight', side: 1, ic: '♞', text: 'A spy hidden even from the Seer.' },
  wolf: { name: 'Lone Wolf', side: 1, ic: '🐺', text: 'A spy who doesn’t know the other spies — and they don’t know you.' },
};
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

export function createGame(settings, players) {
  const g = { settings: { avalon: false, squire: true, witch: true, black: false, wolf: false, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const n = g.order.length, nSpy = SPIES[n];
  const roles = [];
  if (g.settings.avalon) {
    const spies = ['knife'];
    if (g.settings.witch) spies.push('witch');
    if (g.settings.black) spies.push('black');
    if (g.settings.wolf) spies.push('wolf');
    while (spies.length < nSpy) spies.push('spy');
    roles.push(...spies.slice(0, nSpy), 'seer');
    if (g.settings.squire) roles.push('squire');
  } else roles.push(...Array(nSpy).fill('spy'));
  while (roles.length < n) roles.push('loyal');
  shuffle(roles);
  g.role = g.seats.map(() => null);
  g.order.forEach((s, i) => { g.role[s] = roles[i]; });
  g.ready = g.seats.map(() => false);
  g.missions = [];               // { team, fails, ok }
  g.leaderIdx = Math.floor(Math.random() * n);
  g.rejects = 0;
  g.phase = 'night';
  g.history = [];
  return g;
}

export const side = (g, s) => ROLE[g.role[s]].side;
export const teamSize = g => TEAMS[g.order.length][g.missions.length];
export const failsNeeded = g => (g.missions.length === 3 && g.order.length >= 7 ? 2 : 1);
export const leader = g => g.order[g.leaderIdx % g.order.length];

// What this seat learns at night: a list of { seat, as } (as: 'spy' | 'seer?').
export function knowledge(g, s) {
  const r = g.role[s], out = [];
  for (const o of g.order) {
    if (o === s) continue;
    const ro = g.role[o];
    if (side(g, s) === 1 && r !== 'wolf' && side(g, o) === 1 && ro !== 'wolf') out.push({ seat: o, as: 'spy' });
    if (r === 'seer' && side(g, o) === 1 && ro !== 'black') out.push({ seat: o, as: 'spy' });
    if (r === 'squire' && (ro === 'seer' || ro === 'witch')) out.push({ seat: o, as: 'seer?' });
  }
  return out;
}

export function current(g) {
  if (g.phase === 'propose') return leader(g);
  if (g.phase === 'knife') return g.order.find(s => g.role[s] === 'knife');
  return -1;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (!g.order.includes(seat)) return "You're not playing";
  if (g.phase === 'night') {
    if (a.type !== 'ready') return 'Look at your role, then tap Ready';
    g.ready[seat] = true;
    g.moveId++;
    if (g.order.every(s => g.ready[s])) { g.phase = 'propose'; g.team = []; }
    return null;
  }
  if (g.phase === 'propose') {
    if (seat !== leader(g)) return 'The leader picks the team';
    const team = (a.team || []).map(Number);
    if (a.type !== 'propose' || team.length !== teamSize(g) || new Set(team).size !== team.length || !team.every(s => g.order.includes(s))) return `Pick ${teamSize(g)} players`;
    g.team = team;
    g.votes = g.seats.map(() => null);
    g.phase = 'vote';
    announce(g, seat, 'Proposes a team');
    g.moveId++;
    return null;
  }
  if (g.phase === 'vote') {
    if (a.type !== 'vote') return 'Approve or reject the team';
    g.votes[seat] = !!a.yes;
    g.moveId++;
    if (g.order.every(s => g.votes[s] != null)) {
      const yes = g.order.filter(s => g.votes[s]).length;
      g.lastVote = { team: g.team, votes: g.votes.slice(), passed: yes * 2 > g.order.length, leader: leader(g) };
      g.history.push({ kind: 'vote', ...g.lastVote, mission: g.missions.length });
      g.phase = 'tally';
      g.tallyAt = Date.now();
    }
    return null;
  }
  if (g.phase === 'mission') {
    if (!g.team.includes(seat)) return 'You’re not on this mission';
    if (g.cards[seat] != null) return 'Already played';
    if (a.type !== 'card') return 'Play Success or Sabotage';
    const sab = !!a.sabotage;
    if (sab && side(g, seat) === 0) return 'Loyal players must play Success';
    g.cards[seat] = sab ? 'fail' : 'ok';
    g.moveId++;
    if (g.team.every(s => g.cards[s] != null)) {
      const fails = g.team.filter(s => g.cards[s] === 'fail').length;
      const ok = fails < failsNeeded(g);
      g.missions.push({ team: g.team.slice(), fails, ok, size: g.team.length });
      g.history.push({ kind: 'mission', team: g.team.slice(), fails, ok });
      g.phase = 'result';
      g.resultAt = Date.now();
      announce(g, leader(g), ok ? 'Mission succeeded ✅' : `Sabotaged! (${fails}) 💥`);
    }
    return null;
  }
  if (g.phase === 'knife') {
    if (seat !== current(g)) return 'Only the Knife chooses';
    const t = Number(a.target);
    if (a.type !== 'stab' || !g.order.includes(t) || side(g, t) !== 0) return 'Pick a loyal player';
    g.stabbed = t;
    g.winner = g.role[t] === 'seer' ? 1 : 0;
    g.why = g.winner ? 'The Knife found the Seer!' : 'The Knife missed — the Seer is safe';
    g.phase = 'over';
    g.moveId++;
    return null;
  }
  return "That move isn't allowed";
}

function nextLeader(g) { g.leaderIdx++; g.team = []; g.phase = 'propose'; g.moveId++; }

function afterMission(g) {
  const ok = g.missions.filter(m => m.ok).length, bad = g.missions.length - ok;
  g.rejects = 0;
  if (bad >= 3) return end(g, 1, 'Three missions sabotaged');
  if (ok >= 3) {
    if (g.settings.avalon && g.order.some(s => g.role[s] === 'knife')) { g.phase = 'knife'; g.moveId++; return; }
    return end(g, 0, 'Three missions succeeded');
  }
  nextLeader(g);
}
function end(g, w, why) { g.phase = 'over'; g.winner = w; g.why = why; g.moveId++; }

export function tick(g, players) {
  const bot = s => players?.[s]?.bot;
  if (g.phase === 'night') { const s = g.order.find(x => !g.ready[x] && bot(x)); return s == null ? null : { ms: 300, run: () => applyAction(g, s, { type: 'ready' }) }; }
  if (g.phase === 'vote') { const s = g.order.find(x => g.votes[x] == null && bot(x)); return s == null ? null : { ms: 400, run: () => applyAction(g, s, botAction(g, s)) }; }
  if (g.phase === 'mission') { const s = g.team.find(x => g.cards[x] == null && bot(x)); return s == null ? null : { ms: 700, run: () => applyAction(g, s, botAction(g, s)) }; }
  if (g.phase === 'tally') {
    return { ms: Math.max(0, g.tallyAt + 4000 - Date.now()), run: () => {
      if (g.lastVote.passed) { g.cards = g.seats.map(() => null); g.phase = 'mission'; g.moveId++; return; }
      g.rejects++;
      if (g.rejects >= 5) return end(g, 1, 'Five teams rejected in a row');
      nextLeader(g);
    } };
  }
  if (g.phase === 'result') return { ms: Math.max(0, g.resultAt + 5000 - Date.now()), run: () => afterMission(g) };
  return null;
}

// ------------------------------------------------------------------ computer player
// Loyal bots trust players who've been on clean missions and distrust those on failed ones.
function suspicion(g, s, o) {
  const k = knowledge(g, s).find(x => x.seat === o);
  if (k?.as === 'spy') return side(g, s) === 1 ? -5 : 10;
  let v = 0;
  for (const m of g.missions) if (m.team.includes(o)) v += m.ok ? -1 : 2 + m.fails / m.size;
  return v + Math.random() * 0.8;
}
export function botAction(g, s) {
  const spy = side(g, s) === 1;
  if (g.phase === 'propose') {
    const n = teamSize(g);
    let team = [s];
    const others = g.order.filter(o => o !== s);
    if (spy) {
      // Me plus loyal-looking players (keep it to one spy so it isn't obvious).
      const rest = others.filter(o => !knowledge(g, s).some(k => k.seat === o)).sort(() => Math.random() - 0.5);
      team.push(...rest.slice(0, n - 1));
    } else team.push(...others.sort((a, b) => suspicion(g, s, a) - suspicion(g, s, b)).slice(0, n - 1));
    return { type: 'propose', team: team.slice(0, n) };
  }
  if (g.phase === 'vote') {
    if (g.rejects >= 3) return { type: 'vote', yes: !spy || g.team.some(o => side(g, o) === 1) };
    if (spy) return { type: 'vote', yes: g.team.some(o => knowledge(g, s).some(k => k.seat === o) || o === s) || Math.random() < 0.3 };
    const worst = Math.max(...g.team.map(o => (o === s ? 0 : suspicion(g, s, o))));
    return { type: 'vote', yes: worst < 2 || leader(g) === s || (g.team.includes(s) && worst < 3) };
  }
  if (g.phase === 'mission') {
    if (!spy) return { type: 'card', sabotage: false };
    const spiesOn = g.team.filter(o => side(g, o) === 1).length;
    const needed = failsNeeded(g);
    const early = g.missions.length === 0 && Math.random() < 0.4;
    return { type: 'card', sabotage: !early && (spiesOn <= needed || Math.random() < 0.6) };
  }
  if (g.phase === 'knife') {
    const good = g.order.filter(o => side(g, o) === 0);
    // Guess whoever kept rejecting teams with spies on them.
    const score = o => g.history.filter(h => h.kind === 'vote' && h.team.some(x => side(g, x) === 1) && h.votes[o] === false).length + Math.random();
    return { type: 'stab', target: good.sort((a, b) => score(b) - score(a))[0] };
  }
  return { type: 'ready' };
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, order: g.order, role: g.role[seat], side: g.role[seat] ? side(g, seat) : null, knows: g.role[seat] ? knowledge(g, seat) : [],
    ready: g.ready, leader: leader(g), team: g.team || [], teamSize: g.missions.length < 5 ? teamSize(g) : 0, failsNeeded: failsNeeded(g),
    voted: g.votes ? g.votes.map(v => v != null) : [], myVote: g.votes?.[seat] ?? null, lastVote: g.phase === 'vote' ? null : g.lastVote || null,
    played: g.phase === 'mission' ? g.cards[seat] : null, missions: g.missions, rejects: g.rejects, avalon: g.settings.avalon,
    winner: g.winner ?? null, why: g.why || '', roles: g.phase === 'over' ? g.role : null, stabbed: g.stabbed ?? null, moveId: g.moveId,
  };
}
