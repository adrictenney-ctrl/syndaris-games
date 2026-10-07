// Cash Out: a push-your-luck dice game (the same rules as BANK!-style dice games).
// Each round the pot starts at zero and players take turns rolling two dice.
//   Rolls 1–3 are safe: a 7 adds 70, anything else adds the total.
//   From roll 4 on: a 7 ends the round (anyone still in gets nothing this round),
//   doubles DOUBLE the pot, anything else adds the total.
// At any moment after the first roll, any player still in can CASH OUT: they bank the pot
// as it stands and sit out the rest of the round. The round ends when everyone has cashed
// out or a 7 is rolled. Most points after the last round wins.

export const SAFE = 3;

export function createGame(settings, players) {
  const g = {
    settings: { rounds: 15, ...settings },
    seats: players.map(p => !!p),
    scores: players.map(() => 0),
    round: 0, starterIdx: -1, annId: 0, rollId: 0, history: [],
  };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  startRound(g);
  return g;
}

function startRound(g) {
  g.round++;
  g.starterIdx = (g.starterIdx + 1) % g.order.length;
  g.rollerIdx = g.starterIdx;
  g.pot = 0;
  g.rolls = 0;
  g.dice = null;
  g.last = null;            // { total, doubles, effect }
  g.banked = {};            // seat -> amount this round
  g.phase = 'roll';
  g.nextAt = 0;
  g.bustBy = null;
  g.botPlan = null;
}

export const roller = g => (g.phase === 'roll' ? g.order[g.rollerIdx] : -1);
const stillIn = g => g.order.filter(s => !(s in g.banked));
function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }

function nextRoller(g) {
  for (let k = 1; k <= g.order.length; k++) {
    const i = (g.rollerIdx + k) % g.order.length;
    if (!(g.order[i] in g.banked)) { g.rollerIdx = i; return; }
  }
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (a.type === 'bank') {
    if (g.phase !== 'roll') return 'The round is over';
    if (!g.order.includes(seat)) return "You're not playing";
    if (seat in g.banked) return 'You already cashed out';
    if (!g.rolls) return 'Wait for the first roll';
    g.banked[seat] = g.pot;
    g.scores[seat] += g.pot;
    announce(g, seat, `Cash out! +${g.pot}`);
    if (!stillIn(g).length) return endRound(g, null), null;
    if (g.order[g.rollerIdx] === seat) nextRoller(g);
    g.botPlan = null;
    return null;
  }
  if (a.type === 'roll') {
    if (g.phase !== 'roll') return 'The round is over';
    if (seat !== roller(g)) return "It isn't your roll";
    const d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    g.dice = d;
    g.rolls++;
    g.rollId++;
    const total = d[0] + d[1], doubles = d[0] === d[1];
    let effect;
    if (g.rolls <= SAFE) {
      if (total === 7) { g.pot += 70; effect = '+70'; }
      else { g.pot += total; effect = `+${total}`; }
    } else if (total === 7) {
      effect = 'bust';
      g.last = { total, doubles, effect, seat };
      announce(g, seat, 'Seven!');
      endRound(g, seat);
      return null;
    } else if (doubles) { g.pot *= 2; effect = '×2'; }
    else { g.pot += total; effect = `+${total}`; }
    g.last = { total, doubles, effect, seat };
    nextRoller(g);
    g.botPlan = null;
    return null;
  }
  return "That move isn't allowed";
}

function endRound(g, bustBy) {
  g.phase = 'roundOver';
  g.bustBy = bustBy;
  g.history.push({ round: g.round, pot: g.pot, banked: { ...g.banked }, bust: bustBy != null });
  g.nextAt = Date.now() + 4500;
  if (g.round >= g.settings.rounds) {
    g.phase = 'over';
    const top = Math.max(...g.order.map(s => g.scores[s]));
    g.winners = g.order.filter(s => g.scores[s] === top);
  }
}

export function advance(g) {
  if (g.phase === 'roundOver' && Date.now() >= g.nextAt) { startRound(g); return true; }
  return false;
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, round: g.round, rounds: g.settings.rounds, pot: g.pot, rolls: g.rolls, dice: g.dice, last: g.last,
    rollId: g.rollId, roller: roller(g), banked: g.banked, scores: g.scores, order: g.order, bustBy: g.bustBy,
    nextAt: g.nextAt, winners: g.winners || null, danger: g.rolls >= SAFE,
    you: { in: g.order.includes(seat) && !(seat in g.banked), banked: g.banked[seat] ?? null, score: g.scores[seat] ?? 0 },
  };
}

// ---------------------------------------------------------------- bots

// Each bot has a feel for when the pot is "enough", nudged by the scoreboard.
function wantsToBank(g, s) {
  if (!g.rolls || s in g.banked) return false;
  if (g.rolls < SAFE) return false;                       // nothing to lose yet
  const others = g.order.filter(x => x !== s);
  const lead = others.length ? Math.max(...others.map(x => g.scores[x])) : 0;
  const behind = lead - g.scores[s];
  const left = g.settings.rounds - g.round;
  let target = 130 + ((s * 37 + g.round * 11) % 90);       // 130–220, steady per bot and round
  if (behind > 0) target += Math.min(behind * 0.4, left === 0 ? behind + 1 : 250);
  if (behind < 0 && left <= 2) target -= 40;                // protect a lead late on
  // Last one in: the next roll is all risk for them alone.
  if (stillIn(g).length === 1 && !(left === 0 && g.pot + g.scores[s] <= lead)) target -= 40;
  if (left === 0 && g.scores[s] + g.pot > lead && stillIn(g).length > 1) return true;
  return g.pot >= target;
}

// Plan the next bot moment: someone cashing out, or a bot rolling.
export function planBots(g, players) {
  if (g.phase !== 'roll') return null;
  if (g.botPlan) return g.botPlan;
  const bankers = stillIn(g).filter(s => players[s]?.bot && wantsToBank(g, s));
  if (bankers.length) {
    g.botPlan = { type: 'bank', seat: bankers[Math.floor(Math.random() * bankers.length)], at: Date.now() + 500 + Math.random() * 900 };
  } else if (players[roller(g)]?.bot) {
    g.botPlan = { type: 'roll', seat: roller(g), at: Date.now() + 1100 + Math.random() * 500 };
  } else return null;
  return g.botPlan;
}
