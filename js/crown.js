// Crown & Dagger: a hidden-role game of loyalty and treason at a royal court.
// Most players are Loyalists. A few are the Conspiracy, and one of them is the Usurper.
// Each round the Regent names a Steward, everyone votes Aye or Nay, and if the pair is
// approved they enact an Edict together: the Regent draws three, discards one in secret,
// and the Steward enacts one of the two left. Loyal edicts (crown) help the Loyalists;
// Dagger edicts help the Conspiracy and hand the Regent a power.
//
// Loyalists win with 5 Loyal edicts or by banishing the Usurper.
// The Conspiracy wins with 6 Dagger edicts, or if the Usurper is approved as Steward once
// 3 or more Dagger edicts are in force.

const rnd = n => Math.floor(Math.random() * n);
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let annN = 0;

// Conspirators besides the Usurper, by player count.
const CONSPIRATORS = { 5: 1, 6: 1, 7: 2, 8: 2, 9: 3, 10: 3 };
// The Regent's power after each Dagger edict (1st to 5th).
export function powers(n) {
  if (n <= 6) return [null, null, 'peek', 'banish', 'banish'];
  if (n <= 8) return [null, 'investigate', 'council', 'banish', 'banish'];
  return ['investigate', 'investigate', 'council', 'banish', 'banish'];
}
export const POWER_TEXT = {
  peek: 'Read the scrolls: the Regent secretly sees the next three edicts.',
  investigate: 'Question loyalty: the Regent secretly learns one player\'s side.',
  council: 'Call a council: the Regent chooses the next Regent.',
  banish: 'Banishment: the Regent banishes a player from court.',
};

// ---------------------------------------------------------------- setup

export function createGame(settings, players) {
  const crew = players.map((p, i) => (p ? i : -1)).filter(i => i >= 0);
  const n = crew.length;
  const roles = {};
  const deal = shuffle(['usurper', ...Array(CONSPIRATORS[n] || 1).fill('consp'), ...Array(n - 1 - (CONSPIRATORS[n] || 1)).fill('loyal')]);
  crew.forEach((s, i) => { roles[s] = deal[i]; });
  const g = {
    settings: { ...settings },
    seats: players.map(p => (p ? (p.bot ? 'bot' : 'human') : null)),
    crew, n, roles,
    alive: Object.fromEntries(crew.map(s => [s, true])),
    deck: shuffle([...Array(6).fill('L'), ...Array(11).fill('D')]),
    discard: [],
    loyal: 0, dagger: 0, tracker: 0,
    rotation: rnd(n),     // index into crew of the regular Regent
    special: null,        // a Regent chosen by "Call a council"
    regent: null, nominee: null, steward: null,
    lastRegent: null, lastSteward: null,
    votes: {}, lastVote: null,
    hand: null, vetoAsked: false,
    power: null, peek: null, known: {}, investigated: [],
    phase: 'nominate',
    log: [],
    winner: null,
    announce: null,
    round: 0,
  };
  g.rotation = (g.rotation + n - 1) % n;  // nextRegent moves on by one
  nextRegent(g);
  return g;
}

const isAlive = (g, s) => !!g.alive[s];
const alivePlayers = g => g.crew.filter(s => g.alive[s]);
// The table log. "{3}" stands for the name of the player in seat 3.
const say = (g, text) => {
  g.log.push(text);
  if (g.log.length > 30) g.log.shift();
};

function nextRegent(g) {
  if (g.special !== null) { g.regent = g.special; g.special = null; }
  else {
    for (let k = 1; k <= g.n; k++) {
      const i = (g.rotation + k) % g.n;
      if (g.alive[g.crew[i]]) { g.rotation = i; break; }
    }
    g.regent = g.crew[g.rotation];
  }
  g.round++;
  g.nominee = null;
  g.steward = null;
  g.votes = {};
  g.hand = null;
  g.vetoAsked = false;
  g.power = null;
  g.peek = null;
  g.phase = 'nominate';
}

export function eligible(g) {
  const few = alivePlayers(g).length <= 5;
  return alivePlayers(g).filter(s => s !== g.regent && s !== g.lastSteward && (few || s !== g.lastRegent));
}

function refill(g) {
  if (g.deck.length < 3) { g.deck = shuffle([...g.deck, ...g.discard]); g.discard = []; }
}

function win(g, team, why) {
  g.phase = 'over';
  g.winner = { team, why };
}

function enact(g, card, chaos = false) {
  if (card === 'L') g.loyal++; else g.dagger++;
  g.tracker = 0;
  g.lastEnacted = { card, chaos, id: ++annN };
  say(g, `${chaos ? 'The people rose up: ' : ''}A ${card === 'L' ? 'Loyal' : 'Dagger'} edict was enacted.`);
  refill(g);
  if (g.loyal >= 5) return win(g, 'loyal', 'Five Loyal edicts were enacted.');
  if (g.dagger >= 6) return win(g, 'consp', 'Six Dagger edicts were enacted.');
  if (chaos) { g.lastRegent = g.lastSteward = null; g.phase = 'enacted'; g.after = 'next'; return; }
  const p = card === 'D' ? powers(g.n)[g.dagger - 1] : null;
  g.phase = 'enacted';
  g.after = p || 'next';
}

function failedElection(g) {
  g.tracker++;
  if (g.tracker >= 3) {
    refill(g);
    enact(g, g.deck.pop(), true);
    return;
  }
  g.phase = 'enacted';
  g.after = 'next';
  g.lastEnacted = null;
}

// ---------------------------------------------------------------- actions

export function applyAction(g, seat, a) {
  if (!a || typeof a !== 'object') return 'Bad move';
  if (g.phase === 'over') return null;
  const alive = isAlive(g, seat);
  switch (a.type) {
    case 'nominate': {
      if (g.phase !== 'nominate' || seat !== g.regent) return 'Only the Regent names a Steward';
      if (!eligible(g).includes(a.s)) return "They can't be Steward this round";
      g.nominee = a.s;
      g.phase = 'vote';
      g.votes = {};
      return null;
    }
    case 'vote': {
      if (g.phase !== 'vote') return 'No vote right now';
      if (!alive) return 'Banished players cannot vote';
      g.votes[seat] = !!a.aye;
      if (alivePlayers(g).every(s => s in g.votes)) countVotes(g);
      return null;
    }
    case 'discard': {
      if (g.phase !== 'regentLegis' || seat !== g.regent) return null;
      const i = Number(a.i);
      if (!(i >= 0 && i < 3)) return 'Pick an edict to discard';
      g.discard.push(g.hand.splice(i, 1)[0]);
      g.phase = 'stewardLegis';
      return null;
    }
    case 'enact': {
      if (g.phase !== 'stewardLegis' || seat !== g.steward) return null;
      const i = Number(a.i);
      if (!(i >= 0 && i < 2)) return 'Pick an edict to enact';
      const card = g.hand.splice(i, 1)[0];
      g.discard.push(g.hand[0]);
      g.hand = null;
      g.lastRegent = g.regent;
      g.lastSteward = g.steward;
      enact(g, card);
      return null;
    }
    case 'veto': {
      if (g.phase !== 'stewardLegis' || seat !== g.steward || g.dagger < 5 || g.vetoAsked) return null;
      g.vetoAsked = true;
      g.phase = 'veto';
      say(g, 'The Steward asks to veto this session.', seat);
      return null;
    }
    case 'vetoAnswer': {
      if (g.phase !== 'veto' || seat !== g.regent) return null;
      if (a.agree) {
        g.discard.push(...g.hand);
        g.hand = null;
        g.lastRegent = g.regent;
        g.lastSteward = g.steward;
        say(g, 'The Regent agreed: both edicts were thrown out.', seat);
        failedElection(g);
      } else {
        say(g, 'The Regent refused the veto.', seat);
        g.phase = 'stewardLegis';
      }
      return null;
    }
    case 'power': {
      if (g.phase !== 'power' || seat !== g.regent) return null;
      const t = a.s;
      if (g.power === 'peek') { g.phase = 'enacted'; g.after = 'next'; g.peek = null; return null; }
      if (!isAlive(g, t) || t === seat) return 'Choose another player at court';
      if (g.power === 'investigate') {
        if (g.investigated.includes(t)) return 'That player has already been questioned';
        g.investigated.push(t);
        (g.known[seat] = g.known[seat] || {})[t] = g.roles[t] === 'loyal' ? 'loyal' : 'consp';
        say(g, `The Regent questioned {${t}}.`, seat);
        g.phase = 'seen';
        g.seen = t;
        return null;
      }
      if (g.power === 'council') {
        g.special = t;
        say(g, `The Regent called a council: {${t}} will be the next Regent.`, seat);
        g.phase = 'enacted';
        g.after = 'next';
        return null;
      }
      if (g.power === 'banish') {
        g.alive[t] = false;
        say(g, `{${t}} was banished from court.`, t);
        if (g.roles[t] === 'usurper') return win(g, 'loyal', 'The Usurper was banished.');
        g.phase = 'enacted';
        g.after = 'next';
        return null;
      }
      return null;
    }
    case 'done': {
      // The Regent has finished looking at secret information.
      if (g.phase === 'seen' && seat === g.regent) { g.phase = 'enacted'; g.after = 'next'; g.seen = null; }
      return null;
    }
    case 'next':
      if (g.phase === 'enacted') proceed(g);
      return null;
  }
  return 'Unknown move';
}

function countVotes(g) {
  const ayes = Object.values(g.votes).filter(Boolean).length;
  const nays = Object.values(g.votes).length - ayes;
  const passed = ayes > nays;
  g.lastVote = { votes: { ...g.votes }, ayes, nays, passed, regent: g.regent, nominee: g.nominee, id: ++annN };
  if (!passed) {
    say(g, `The council said Nay (${ayes}–${nays}).`);
    g.phase = 'voteResult';
    g.afterVote = 'fail';
    return;
  }
  say(g, `The council said Aye (${ayes}–${nays}).`);
  g.steward = g.nominee;
  if (g.dagger >= 3 && g.roles[g.steward] === 'usurper') {
    g.phase = 'voteResult';
    g.afterVote = 'usurper';
    return;
  }
  g.tracker = 0;
  g.phase = 'voteResult';
  g.afterVote = 'pass';
}

// Called after the pause that shows each result on the table.
function proceed(g) {
  if (g.phase === 'voteResult') {
    if (g.afterVote === 'fail') return failedElection(g);
    if (g.afterVote === 'usurper') return win(g, 'consp', 'The Usurper became Steward.');
    refill(g);
    g.hand = [g.deck.pop(), g.deck.pop(), g.deck.pop()];
    g.phase = 'regentLegis';
    return;
  }
  if (g.phase === 'enacted') {
    const p = g.after;
    g.after = null;
    if (!p || p === 'next') return nextRegent(g);
    g.power = p;
    g.phase = 'power';
    if (p === 'peek') g.peek = g.deck.slice(-3).reverse();
  }
}

// ---------------------------------------------------------------- timers and bots

export function timer(g, players) {
  g.seats = players.map(p => (p ? (p.bot ? 'bot' : 'human') : null));
  if (g.phase === 'voteResult') return { ms: 4200, run: () => proceed(g) };
  if (g.phase === 'enacted') return { ms: g.lastEnacted ? 3200 : 1800, run: () => { if (g.phase === 'enacted') proceed(g); } };
  // Someone left the table mid-vote: count the votes that are in.
  if (g.phase === 'vote' && alivePlayers(g).every(s => s in g.votes || !g.seats[s])) {
    return { ms: 600, run: () => { if (g.phase === 'vote') { alivePlayers(g).forEach(s => { if (!(s in g.votes)) g.votes[s] = false; }); countVotes(g); } } };
  }
  const bot = botNeeded(g);
  if (bot !== null) return { ms: 900 + rnd(900), run: () => { const a = botAction(g, bot); if (a) applyAction(g, bot, a); } };
  return null;
}

function botNeeded(g) {
  const isBot = s => g.seats[s] === 'bot';
  if (g.phase === 'vote') { const s = alivePlayers(g).find(x => isBot(x) && !(x in g.votes)); return s ?? null; }
  if (['nominate', 'regentLegis', 'power', 'seen'].includes(g.phase) && isBot(g.regent)) return g.regent;
  if (g.phase === 'veto' && isBot(g.regent)) return g.regent;
  if (g.phase === 'stewardLegis' && isBot(g.steward)) return g.steward;
  return null;
}

export function botAction(g, s) {
  const evil = g.roles[s] !== 'loyal';
  const friends = g.crew.filter(x => g.roles[x] !== 'loyal');
  const pick = list => list[rnd(list.length)];
  switch (g.phase) {
    case 'nominate': {
      const el = eligible(g);
      const mine = el.filter(x => friends.includes(x));
      return { type: 'nominate', s: evil && mine.length && Math.random() < 0.7 ? pick(mine) : pick(el) };
    }
    case 'vote': {
      if (evil) return { type: 'vote', aye: friends.includes(g.nominee) || friends.includes(g.regent) || Math.random() < 0.4 };
      const suspect = g.known[s] && (g.known[s][g.nominee] === 'consp' || g.known[s][g.regent] === 'consp');
      return { type: 'vote', aye: !suspect && (g.tracker >= 2 || Math.random() < 0.65) };
    }
    case 'regentLegis': {
      const want = evil ? 'L' : 'D';
      const i = g.hand.indexOf(want);
      return { type: 'discard', i: i >= 0 ? i : 0 };
    }
    case 'stewardLegis': {
      const want = evil ? 'D' : 'L';
      if (!evil && g.dagger >= 5 && !g.vetoAsked && !g.hand.includes('L')) return { type: 'veto' };
      const i = g.hand.indexOf(want);
      return { type: 'enact', i: i >= 0 ? i : 0 };
    }
    case 'veto':
      return { type: 'vetoAnswer', agree: !evil };
    case 'power': {
      if (g.power === 'peek') return { type: 'power' };
      const others = alivePlayers(g).filter(x => x !== s && !(g.power === 'investigate' && g.investigated.includes(x)));
      const targets = evil ? others.filter(x => !friends.includes(x)) : others;
      return { type: 'power', s: pick(targets.length ? targets : others) };
    }
    case 'seen':
      return { type: 'done' };
  }
  return null;
}

// ---------------------------------------------------------------- views

export function viewFor(g, seat) {
  const role = g.roles[seat] || null;
  const over = g.phase === 'over';
  // The Conspiracy know each other; the Usurper only knows them in small games.
  let allies = [];
  if (role === 'consp' || (role === 'usurper' && g.n <= 6)) allies = g.crew.filter(s => s !== seat && g.roles[s] !== 'loyal').map(s => ({ seat: s, role: g.roles[s] }));
  const regent = seat === g.regent, steward = seat === g.steward;
  return {
    phase: g.phase,
    round: g.round,
    n: g.n,
    crew: g.crew,
    alive: g.alive,
    me: seat,
    role,
    allies,
    regent: g.regent,
    nominee: g.nominee,
    steward: g.steward,
    lastRegent: g.lastRegent,
    lastSteward: g.lastSteward,
    eligible: g.phase === 'nominate' && regent ? eligible(g) : null,
    voted: g.phase === 'vote' ? Object.keys(g.votes).map(Number) : null,
    myVote: g.phase === 'vote' ? (seat in g.votes ? g.votes[seat] : null) : null,
    lastVote: g.lastVote,
    loyal: g.loyal, dagger: g.dagger, tracker: g.tracker,
    powers: powers(g.n),
    deckCount: g.deck.length, discardCount: g.discard.length,
    hand: (g.phase === 'regentLegis' && regent) || (['stewardLegis', 'veto'].includes(g.phase) && steward) ? g.hand : null,
    vetoOpen: g.dagger >= 5 && !g.vetoAsked,
    power: g.phase === 'power' ? g.power : null,
    peek: g.phase === 'power' && regent ? g.peek : null,
    seen: g.phase === 'seen' && regent ? { seat: g.seen, side: g.known[seat][g.seen] } : null,
    known: g.known[seat] || {},
    investigated: g.investigated,
    targets: g.phase === 'power' && regent && g.power !== 'peek'
      ? g.crew.filter(s => g.alive[s] && s !== seat && !(g.power === 'investigate' && g.investigated.includes(s))) : null,
    lastEnacted: g.lastEnacted || null,
    log: g.log.slice(-6),
    winner: g.winner,
    roles: over ? g.roles : null,
  };
}

export const turn = g => (['nominate', 'regentLegis', 'power', 'seen', 'veto'].includes(g.phase) ? g.regent : g.phase === 'stewardLegis' ? g.steward : -1);
