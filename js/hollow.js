// Hollowmere: a social deduction game in a village with a Shade hiding among the players.
// The app is the Storyteller: it deals characters, wakes people at night on their phones,
// works out poison and false information, and announces who died. By day the village
// talks, nominates and votes on the table; the player on the block is executed at dusk.
// Good wins when the Shade dies. Evil wins when only two players are left alive.
import { CHARS, TEAM, BY_KIND, SETUP } from './hollow-chars.js?v=55';

const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let annN = 0;

// ---------------------------------------------------------------- setup

export function createGame(settings, players) {
  const crew = players.map((p, i) => (p ? i : -1)).filter(i => i >= 0);
  const n = crew.length;
  let [v, o, h] = SETUP[Math.min(10, Math.max(5, n))];
  const henchmen = shuffle(BY_KIND('henchman')).slice(0, h);
  if (henchmen.includes('patron')) { o += 2; v -= 2; }
  const outcasts = shuffle(BY_KIND('outcast')).slice(0, o);
  v += o - outcasts.length;  // not enough Outcasts: fill with Villagers
  const villagers = shuffle(BY_KIND('villager')).slice(0, v);
  const deal = shuffle([...villagers, ...outcasts, ...henchmen, 'shade']);
  const chars = {}, shown = {};
  crew.forEach((s, i) => { chars[s] = deal[i]; shown[s] = deal[i]; });
  // The Sleepwalker is told they are a Villager who isn't in play.
  const notIn = BY_KIND('villager').filter(c => !deal.includes(c));
  for (const s of crew) if (chars[s] === 'sleepwalker') shown[s] = notIn.splice(rnd(notIn.length), 1)[0];
  const goodOut = shuffle([...BY_KIND('villager'), ...BY_KIND('outcast')].filter(c => !deal.includes(c) && !Object.values(shown).includes(c)));
  const g = {
    settings: { ...settings },
    seats: players.map(p => (p ? (p.bot ? 'bot' : 'human') : null)),
    crew, n, chars, shown,
    alive: Object.fromEntries(crew.map(s => [s, true])),
    ghost: Object.fromEntries(crew.map(s => [s, true])),
    decoy: pick(crew.filter(s => TEAM[CHARS[chars[s]].kind] === 'good')),
    bluffs: goodOut.slice(0, 3),
    notes: Object.fromEntries(crew.map(s => [s, []])),
    poisoned: null, master: {}, hunterUsed: {}, innocentUsed: false,
    night: 0, day: 0, phase: 'night',
    log: [], winner: null, announce: null,
    lastExecuted: null,
  };
  startNight(g);
  return g;
}

const alive = g => g.crew.filter(s => g.alive[s]);
const real = (g, s) => g.chars[s];
const kindOf = c => CHARS[c].kind;
const isEvil = (g, s) => TEAM[kindOf(g.chars[s])] === 'evil';
const broken = (g, s) => g.poisoned === s || g.chars[s] === 'sleepwalker';
const say = (g, text) => { g.log.push(text); if (g.log.length > 40) g.log.shift(); };
const note = (g, s, text) => g.notes[s].push({ night: g.night, day: g.day, text });
const nm = s => `{${s}}`;  // the table and phones swap this for the player's name

// How a player reads to information abilities: the Hermit may read as evil, the
// Informant as good. Decided fresh each time, like a Storyteller would.
function reads(g, s) {
  const c = g.chars[s];
  if (c === 'hermit' && Math.random() < 0.45) { const evil = pick([...BY_KIND('henchman'), 'shade']); return { evil: true, char: evil }; }
  if (c === 'informant' && Math.random() < 0.45) return { evil: false, char: pick([...BY_KIND('villager'), ...BY_KIND('outcast')]) };
  return { evil: isEvil(g, s), char: c };
}

function neighbors(g, s) {
  // The nearest living player on each side.
  const ring = g.crew.filter(x => g.alive[x] || x === s);
  const i = ring.indexOf(s), L = ring.length;
  if (L < 2) return [];
  const a = ring[(i - 1 + L) % L], b = ring[(i + 1) % L];
  return a === b ? [a] : [a, b];
}

// ---------------------------------------------------------------- the night

// What a player is asked to do tonight, based on the character they believe they are.
function nightNeed(g, s) {
  if (!g.alive[s]) return null;
  const c = isEvil(g, s) ? real(g, s) : g.shown[s];
  const first = g.night === 1;
  const ch = CHARS[c];
  if (!ch.pick) return { pick: 0, char: c };
  if (first && (c === 'guardian' || c === 'shade')) return { pick: 0, char: c };
  return { pick: ch.pick, char: c, self: !!ch.self };
}

function startNight(g) {
  g.night++;
  g.phase = 'night';
  g.choices = {};
  g.need = Object.fromEntries(alive(g).map(s => [s, nightNeed(g, s)]));
  g.vote = null;
  g.block = null;
  g.top = 0;
  g.nominated = [];
  g.nominators = [];
  g.executedToday = null;
  g.dawn = null;
  say(g, `Night ${g.night} falls on Hollowmere.`);
}

function resolveNight(g) {
  const first = g.night === 1;
  const ch = s => g.choices[s] || [];
  const who = c => alive(g).find(s => real(g, s) === c);
  // The Venomist acts first. Poison lasts until the next night.
  g.poisoned = null;
  const ven = who('venomist');
  if (ven !== undefined && ch(ven)[0] !== undefined) g.poisoned = ch(ven)[0];
  // The Servant picks a master.
  for (const s of alive(g)) if (real(g, s) === 'servant' && ch(s)[0] !== undefined) g.master[s] = ch(s)[0];
  const deaths = [];
  if (first) {
    // The evil team learns who is who (with seven or more players).
    if (g.n >= 7) {
      const shade = g.crew.find(s => real(g, s) === 'shade');
      const hench = g.crew.filter(s => kindOf(real(g, s)) === 'henchman');
      note(g, shade, `Your Henchmen: ${hench.map(nm).join(', ')}. Good characters not in play you can pretend to be: ${g.bluffs.map(c => CHARS[c].name).join(', ')}.`);
      for (const h of hench) note(g, h, `The Shade is ${nm(shade)}.${hench.length > 1 ? ` Other Henchmen: ${hench.filter(x => x !== h).map(nm).join(', ')}.` : ''}`);
    }
  } else {
    // The Guardian protects, then the Shade strikes.
    const guard = who('guardian');
    const safe = guard !== undefined && !broken(g, guard) ? ch(guard)[0] : null;
    const shade = who('shade');
    if (shade !== undefined && g.poisoned !== shade && ch(shade)[0] !== undefined) {
      let t = ch(shade)[0];
      if (t === shade) {
        // The Shade kills itself: a Henchman takes over.
        g.alive[shade] = false;
        deaths.push(shade);
        const heirs = alive(g).filter(s => kindOf(real(g, s)) === 'henchman');
        if (heirs.length) {
          const h = heirs.find(s => real(g, s) === 'heir') ?? pick(heirs);
          g.chars[h] = g.shown[h] = 'shade';
          note(g, h, 'The Shade has passed its power to you. You are now the Shade.');
        }
      } else if (g.alive[t] && t !== safe && !(real(g, t) === 'knight' && !broken(g, t))) {
        if (real(g, t) === 'elder' && !broken(g, t) && Math.random() < 0.5) {
          const others = alive(g).filter(s => s !== t && s !== shade);
          t = others.length ? pick(others) : t;
        }
        if (!(real(g, t) === 'knight' && !broken(g, t))) {
          g.alive[t] = false;
          deaths.push(t);
          if (g.shown[t] === 'witness') g.witness = t;
        }
      }
    }
  }
  g.deaths = deaths;
  // Information, worked out after everything else tonight.
  for (const s of alive(g)) giveInfo(g, s, first);
  if (g.witness !== undefined && g.witness !== null) {
    g.phase = 'witness';
    g.need = { [g.witness]: { pick: 1, char: 'witness', self: true } };
    g.choices = {};
    return;
  }
  dawn(g);
}

function giveInfo(g, s, first) {
  const c = g.shown[s];
  const bad = broken(g, s);
  const others = g.crew.filter(x => x !== s);
  const two = (target, truth) => {
    const decoy = pick(others.filter(x => x !== target));
    const pair = shuffle([target, decoy]);
    return `One of ${nm(pair[0])} or ${nm(pair[1])} is ${CHARS[truth].name}.`;
  };
  if (isEvil(g, s)) {
    if (real(g, s) === 'informant') note(g, s, `The village: ${g.crew.map(x => `${nm(x)} ${CHARS[real(g, x)].name}${g.poisoned === x ? ' (poisoned)' : ''}${g.alive[x] ? '' : ' (dead)'}`).join(' · ')}`);
    return;
  }
  if (first && c === 'gossip') {
    const pool = others.filter(x => kindOf(reads(g, x).char) === 'villager');
    if (bad || !pool.length) { note(g, s, two(pick(others), pick(BY_KIND('villager').filter(k => k !== 'gossip')))); return; }
    const t = pick(pool); note(g, s, two(t, reads(g, t).char));
  } else if (first && c === 'archivist') {
    const pool = others.filter(x => kindOf(real(g, x)) === 'outcast' || (real(g, x) === 'informant' && Math.random() < 0.3));
    if (bad) { note(g, s, Math.random() < 0.3 ? 'There are no Outcasts in play.' : two(pick(others), pick(BY_KIND('outcast')))); return; }
    if (!pool.length) { note(g, s, 'There are no Outcasts in play.'); return; }
    const t = pick(pool); note(g, s, two(t, kindOf(real(g, t)) === 'outcast' ? real(g, t) : pick(BY_KIND('outcast'))));
  } else if (first && c === 'inspector') {
    const pool = others.filter(x => kindOf(real(g, x)) === 'henchman' || (real(g, x) === 'hermit' && Math.random() < 0.5));
    if (bad || !pool.length) { note(g, s, two(pick(others), pick(BY_KIND('henchman')))); return; }
    const t = pick(pool); note(g, s, two(t, kindOf(real(g, t)) === 'henchman' ? real(g, t) : pick(BY_KIND('henchman'))));
  } else if (first && c === 'cook') {
    let pairs = 0;
    const evil = Object.fromEntries(g.crew.map(x => [x, reads(g, x).evil]));
    g.crew.forEach((x, i) => { if (evil[x] && evil[g.crew[(i + 1) % g.crew.length]]) pairs++; });
    if (bad) pairs = pick([0, 1, 2].filter(k => k !== pairs));
    note(g, s, `${pairs} pair${pairs === 1 ? '' : 's'} of evil players sit next to each other.`);
  } else if (c === 'sensitive') {
    let k = neighbors(g, s).filter(x => reads(g, x).evil).length;
    if (bad) k = pick([0, 1, 2].filter(x => x !== k));
    note(g, s, `${k} of your living neighbors ${k === 1 ? 'is' : 'are'} evil.`);
  } else if (c === 'seer') {
    const [a, b] = g.choices[s] || [];
    if (a === undefined) return;
    let yes = [a, b].some(x => x === g.decoy || real(g, x) === 'shade' || (real(g, x) === 'hermit' && Math.random() < 0.45));
    if (bad) yes = Math.random() < 0.5;
    note(g, s, `${nm(a)} and ${nm(b)}: ${yes ? 'YES, one of them reads as the Shade.' : 'no, neither is the Shade.'}`);
  } else if (!first && c === 'gravedigger' && g.lastExecuted) {
    const e = g.lastExecuted;
    const shownChar = bad ? pick(Object.keys(CHARS)) : e.char;
    note(g, s, `${nm(e.seat)}, executed today, was ${CHARS[shownChar].name}.`);
  }
}

function dawn(g) {
  g.lastExecuted = null;
  g.day++;
  g.phase = 'day';
  g.dawn = { deaths: g.deaths.slice(), id: ++annN };
  say(g, g.deaths.length ? `Dawn of day ${g.day}. ${g.deaths.map(nm).join(' and ')} died in the night.` : `Dawn of day ${g.day}. Nobody died in the night.`);
  checkWin(g);
}

// ---------------------------------------------------------------- winning

function shadeDied(g, s, aliveBefore) {
  const heir = alive(g).find(x => real(g, x) === 'heir');
  if (heir !== undefined && aliveBefore >= 5 && g.poisoned !== heir) {
    g.chars[heir] = g.shown[heir] = 'shade';
    note(g, heir, 'The Shade died, and its power passed to you. You are now the Shade.');
    return;
  }
}

function checkWin(g) {
  if (g.phase === 'over') return true;
  const shadeAlive = alive(g).some(s => real(g, s) === 'shade');
  if (!shadeAlive) return end(g, 'good', 'The Shade is dead.');
  if (alive(g).length <= 2) return end(g, 'evil', 'Only two players are left alive.');
  return false;
}

function end(g, team, why) {
  g.phase = 'over';
  g.winner = { team, why };
  say(g, why);
  return true;
}

// ---------------------------------------------------------------- the day

const needed = g => Math.ceil(alive(g).length / 2);
const canVote = (g, s) => g.alive[s] || g.ghost[s];

function closeVote(g) {
  const v = g.vote;
  // The Servant's vote only counts if their master voted too.
  const counts = s => {
    if (!v.votes[s]) return false;
    if (real(g, s) === 'servant' && g.poisoned !== s && g.master[s] !== undefined && !v.votes[g.master[s]]) return false;
    return true;
  };
  const yes = g.crew.filter(counts);
  for (const s of yes) if (!g.alive[s]) g.ghost[s] = false;   // a dead player's vote is used up
  const k = yes.length;
  v.count = k;
  v.yes = yes;
  if (k >= v.needed) {
    if (k > g.top) { g.top = k; g.block = v.nominee; g.tie = false; }
    else if (k === g.top) { g.block = null; g.tie = true; }
  }
  say(g, `${nm(v.nominee)} got ${k} vote${k === 1 ? '' : 's'} (${v.needed} needed).${g.block === v.nominee ? ` ${nm(v.nominee)} is about to be executed.` : k >= v.needed && g.tie ? ' A tie: nobody is about to be executed.' : ''}`);
  g.lastVote = { ...v, id: ++annN };
  g.vote = null;
  g.phase = 'day';
}

function execute(g, s, why) {
  const before = alive(g).length;
  g.alive[s] = false;
  g.executedToday = s;
  g.lastExecuted = { seat: s, char: reads(g, s).char };
  say(g, why);
  if (real(g, s) === 'martyr' && g.poisoned !== s) return end(g, 'evil', `${nm(s)} was the Martyr. Good loses.`);
  if (real(g, s) === 'shade') shadeDied(g, s, before);
  return checkWin(g);
}

function endDay(g) {
  if (g.block !== null && g.block !== undefined) {
    if (execute(g, g.block, `${nm(g.block)} was executed.`)) return;
  } else {
    say(g, 'Nobody was executed today.');
    const elder = alive(g).find(s => real(g, s) === 'elder');
    if (alive(g).length === 3 && elder !== undefined && g.poisoned !== elder) { end(g, 'good', 'Three remain and nobody was executed: the Elder leads the village to safety.'); return; }
  }
  if (!checkWin(g)) startNight(g);
}

// ---------------------------------------------------------------- actions

export function applyAction(g, seat, a) {
  if (!a || typeof a !== 'object') return 'Bad move';
  if (g.phase === 'over') return null;
  if (!g.crew.includes(seat)) return "You'll be in the next game";
  switch (a.type) {
    case 'night': {
      if (!['night', 'witness'].includes(g.phase)) return null;
      const need = g.need[seat];
      if (need === undefined) return null;
      const list = Array.isArray(a.s) ? a.s.map(Number) : [];
      if (need && need.pick) {
        if (list.length !== need.pick || new Set(list).size !== list.length) return `Choose ${need.pick} player${need.pick > 1 ? 's' : ''}`;
        if (list.some(x => !g.crew.includes(x))) return 'Choose players in the game';
        if (!need.self && list.includes(seat)) return 'Choose someone other than yourself';
        if (need.char !== 'seer' && list.some(x => !g.alive[x])) return 'Choose a living player';
      }
      g.choices[seat] = list;
      if (g.phase === 'witness') {
        const t = list[0];
        const shownChar = broken(g, seat) ? pick(Object.keys(CHARS)) : reads(g, t).char;
        note(g, seat, `With your last breath you see that ${nm(t)} is ${CHARS[shownChar].name}.`);
        g.witness = null;
        dawn(g);
        return null;
      }
      if (Object.keys(g.need).every(s => s in g.choices || !g.alive[s] || !g.seats[s])) resolveNight(g);
      return null;
    }
    case 'nominate': {
      if (g.phase !== 'day') return g.phase === 'vote' ? 'Finish this vote first' : 'You can only nominate during the day';
      if (!g.alive[seat]) return 'Dead players cannot nominate';
      if (g.nominators.includes(seat)) return 'You already nominated today';
      const t = Number(a.s);
      if (!g.crew.includes(t) || !g.alive[t]) return 'Nominate a living player';
      if (g.nominated.includes(t)) return 'They were already nominated today';
      g.nominators.push(seat);
      g.nominated.push(t);
      say(g, `${nm(seat)} nominated ${nm(t)}.`);
      // The Innocent: nominating them as a Villager gets you executed on the spot.
      if (real(g, t) === 'innocent' && !g.innocentUsed && g.poisoned !== t) {
        g.innocentUsed = true;
        const r = reads(g, seat);
        if (kindOf(real(g, seat)) === 'villager' || (real(g, seat) === 'informant' && kindOf(r.char) === 'villager')) {
          if (execute(g, seat, `${nm(seat)} nominated the Innocent and was executed at once!`)) return null;
          startNight(g);
          return null;
        }
      }
      g.vote = { nominator: seat, nominee: t, votes: {}, needed: needed(g) };
      g.phase = 'vote';
      return null;
    }
    case 'vote': {
      if (g.phase !== 'vote') return null;
      if (!canVote(g, seat)) return 'You have used your one vote as a ghost';
      g.vote.votes[seat] = !!a.yes;
      if (g.crew.filter(s => canVote(g, s) && g.seats[s]).every(s => s in g.vote.votes)) closeVote(g);
      return null;
    }
    case 'closeVote':
      if (g.phase === 'vote') closeVote(g);
      return null;
    case 'shoot': {
      if (g.phase !== 'day') return 'Only during the day, outside a vote';
      if (!g.alive[seat]) return 'Dead players cannot do that';
      if (g.hunterUsed[seat]) return 'You already used your shot';
      const t = Number(a.s);
      if (!g.alive[t] || t === seat) return 'Choose a living player';
      g.hunterUsed[seat] = true;
      say(g, `${nm(seat)} claims to be the Hunter and shoots ${nm(t)}…`);
      const hits = real(g, seat) === 'hunter' && g.poisoned !== seat && (real(g, t) === 'shade' || (real(g, t) === 'hermit' && Math.random() < 0.45));
      if (hits) {
        const before = alive(g).length;
        g.alive[t] = false;
        say(g, `…and ${nm(t)} falls dead!`);
        if (real(g, t) === 'shade') shadeDied(g, t, before);
        checkWin(g);
      } else say(g, '…nothing happens.');
      return null;
    }
    case 'endDay':
      if (g.phase === 'vote') closeVote(g);
      if (g.phase === 'day') endDay(g);
      return null;
  }
  return 'Unknown move';
}

// ---------------------------------------------------------------- timers and bots

function botNight(g, s) {
  const need = g.need[s];
  if (!need || !need.pick) return { type: 'night', s: [] };
  let pool = alive(g).filter(x => (need.self || x !== s));
  if (need.char === 'shade') pool = pool.filter(x => !isEvil(g, x));
  if (need.char === 'venomist') pool = pool.filter(x => !isEvil(g, x));
  if (!pool.length) pool = alive(g);
  const chosen = shuffle(pool.slice()).slice(0, need.pick);
  while (chosen.length < need.pick) chosen.push(pick(g.crew));
  return { type: 'night', s: chosen };
}

export function timer(g, players) {
  g.seats = players.map(p => (p ? (p.bot ? 'bot' : 'human') : null));
  const isBot = s => g.seats[s] === 'bot';
  if (['night', 'witness'].includes(g.phase)) {
    const s = Object.keys(g.need).map(Number).find(x => isBot(x) && !(x in g.choices));
    if (s !== undefined) return { ms: 500 + rnd(700), run: () => applyAction(g, s, botNight(g, s)) };
    // A player left in the middle of the night.
    if (g.phase === 'night' && Object.keys(g.need).every(x => x in g.choices || !g.seats[x])) return { ms: 500, run: () => { if (g.phase === 'night') resolveNight(g); } };
    return null;
  }
  if (g.phase === 'vote') {
    const s = g.crew.find(x => isBot(x) && canVote(g, x) && !(x in g.vote.votes));
    if (s !== undefined) {
      const yes = isEvil(g, s) ? !isEvil(g, g.vote.nominee) && Math.random() < 0.6 : Math.random() < 0.4;
      return { ms: 400 + rnd(500), run: () => applyAction(g, s, { type: 'vote', yes: g.alive[s] ? yes : yes && Math.random() < 0.5 }) };
    }
    if (g.crew.filter(x => canVote(g, x) && g.seats[x]).every(x => x in g.vote.votes)) return { ms: 300, run: () => { if (g.phase === 'vote') closeVote(g); } };
    return null;
  }
  // With only bots left alive, the day runs itself.
  if (g.phase === 'day' && alive(g).every(isBot)) {
    return {
      ms: 1200, run: () => {
        const free = alive(g).filter(x => !g.nominators.includes(x));
        const targets = alive(g).filter(x => !g.nominated.includes(x));
        if (free.length && targets.length && g.nominated.length < 2) applyAction(g, pick(free), { type: 'nominate', s: pick(targets) });
        else endDay(g);
      },
    };
  }
  return null;
}

export const botAction = () => null;
export const turn = () => -1;

// ---------------------------------------------------------------- views

export function viewFor(g, seat) {
  const inGame = g.crew.includes(seat);
  const over = g.phase === 'over';
  const evil = inGame && isEvil(g, seat);
  const me = inGame ? (evil ? real(g, seat) : g.shown[seat]) : null;
  return {
    phase: g.phase,
    night: g.night,
    day: g.day,
    crew: g.crew,
    alive: g.alive,
    ghost: g.ghost,
    inGame,
    me: seat,
    char: me,
    team: inGame ? (evil ? 'evil' : 'good') : null,
    notes: inGame ? g.notes[seat] : [],
    need: ['night', 'witness'].includes(g.phase) && g.need[seat] !== undefined ? g.need[seat] : null,
    done: ['night', 'witness'].includes(g.phase) ? seat in (g.choices || {}) : false,
    nightLeft: ['night', 'witness'].includes(g.phase) ? Object.keys(g.need).filter(s => !(s in g.choices) && g.alive[s]).length : 0,
    vote: g.vote && { nominator: g.vote.nominator, nominee: g.vote.nominee, needed: g.vote.needed, mine: g.vote.votes[seat] ?? null, count: Object.keys(g.vote.votes).length },
    lastVote: g.lastVote ? { nominee: g.lastVote.nominee, count: g.lastVote.count, needed: g.lastVote.needed, yes: g.lastVote.yes, id: g.lastVote.id } : null,
    block: g.block ?? null,
    top: g.top,
    tie: !!g.tie,
    nominated: g.nominated || [],
    nominators: g.nominators || [],
    hunterUsed: !!g.hunterUsed[seat],
    dawn: g.dawn,
    log: g.log.slice(-8),
    winner: g.winner,
    grimoire: over ? g.chars : null,
    shownAs: over ? g.shown : null,
  };
}
