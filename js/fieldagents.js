// Field Agents: two teams, a grid of 25 code words. Each team's Handler knows which words are
// their agents; they give a one-word clue and a number, and their team guesses. Hit one of
// yours and keep going (up to the number + 1). Hit a bystander or the other team's agent and
// your turn ends. Touch the Double Agent and your team loses at once. First team to find all
// its agents wins. Runs only on the table (host).

export const WORDS = `anchor apple arrow atlas badge bakery balloon bamboo band bank bark barrel bat battery beach beam bean bear bell belt bench berry bike bird blade blanket block boat bolt bone book boot bottle bow box brain branch brick bridge brush bubble bucket bug button cable cactus cake camera camp candle cane canoe cap captain card carpet castle cat cave cell chain chair chalk charge check cheese chest chicken chip circle clay cliff clock cloud club coach coast coat code coin comb comet compass cone cook copper coral cork cotton country court crab crane crash crown crystal cup curtain cycle dance dart date deck desert diamond dice dinosaur doctor dog doll dolphin door dragon drain dream dress drill drum duck dust eagle earth echo egg engine eye fair fan farm feather fence field file film fire fish flag flame flash floor flute fly fog foot forest fork fountain fox frame frost fuel game garden gate ghost giant glass glove glue goat gold grape grass guitar hammer hand harbor hat hawk heart helmet hero hill hive hole honey hook horn horse hose hotel ice iron island ivory jacket jam jar jet jewel joke judge jungle kettle key king kite knife knot ladder lake lamp lantern laser lead leaf lemon lens letter lever light line lion lock log loop magnet mail map marble mask match maze medal mint mirror mole moon moss motor mount mouse mud nail needle nest net night note nut oak ocean office oil olive opera orange organ owl paint palm pan paper park parrot party pass pen pepper piano pie pig pilot pin pipe pirate pit plane plant plate plot pocket point pole pool port post pot press prince pump queen racket radio rail rain ring river robot rock rocket roll roof root rope rose ruler sail salt sand satellite saw scale school scout screen seal seed shadow shark sheep shell ship shoe shop silk silver sink skate sky slip snake snow sock soldier spider spike spoon spring spy square stable staff stage stamp star station steam stick storm straw string sugar suit sun swan swing switch sword table tail tank tea teacher temple tent thread throne thumb ticket tide tie tiger toast tooth torch tower track train trap tree triangle truck trumpet tube tunnel turtle umbrella unicorn valley van vase violin volcano wagon wall watch water wave web whale wheel whistle wind window wing wire witch wolf wood yard`.split(/\s+/);
export const SIZE = 25;
export const TEAM = [{ name: 'Brass', ic: '◆' }, { name: 'Steel', ic: '●' }];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0, log: [] };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.team = g.seats.map(() => -1);
  // Brass sits on seats 0–3 (left side), Steel on 4–7 (right). If one side is short of
  // players, deal everyone into alternating teams instead.
  g.order.forEach(s => { g.team[s] = s < 4 ? 0 : 1; });
  if ([0, 1].some(t => g.order.filter(s => g.team[s] === t).length < 2)) g.order.forEach((s, i) => { g.team[s] = i % 2; });
  // A random Handler for each team.
  g.handler = [0, 1].map(t => { const m = g.order.filter(s => g.team[s] === t); return m[Math.floor(Math.random() * m.length)]; });
  g.words = shuffle(WORDS.slice()).slice(0, SIZE);
  g.first = Math.floor(Math.random() * 2);
  // The key: 9 for the team going first, 8 for the other, 7 bystanders, 1 Double Agent.
  g.key = shuffle([...Array(9).fill(g.first), ...Array(8).fill(1 - g.first), ...Array(7).fill('b'), 'x']);
  g.shown = Array(SIZE).fill(false);
  g.up = g.first;
  g.phase = 'clue';
  g.clue = null;          // { word, n, team }
  g.guesses = 0;
  g.winner = null;
  g.how = null;
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const left = (g, t) => g.key.filter((k, i) => k === t && !g.shown[i]).length;
export const operatives = (g, t) => g.order.filter(s => g.team[s] === t && s !== g.handler[t]);
export function current(g) { return g.phase === 'clue' ? g.handler[g.up] : -1; }

function switchTeams(g) {
  g.up = 1 - g.up;
  g.phase = 'clue';
  g.clue = null;
  g.guesses = 0;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (!g.order.includes(seat)) return "You're not playing";
  if (a.type === 'clue') {
    if (g.phase !== 'clue' || seat !== g.handler[g.up]) return 'Only the Handler gives the clue';
    const word = String(a.word || '').trim().toLowerCase().replace(/[^a-z'-]/g, '');
    if (!word || /\s/.test(String(a.word).trim())) return 'One word only';
    if (g.words.some((w, i) => !g.shown[i] && (w === word || word.includes(w) || w.includes(word)))) return "That's (part of) a word on the board";
    const n = Math.max(0, Math.min(9, Math.floor(Number(a.n))));
    if (!Number.isFinite(n)) return 'Pick a number';
    g.clue = { word, n, team: g.up };
    g.phase = 'guess';
    g.guesses = 0;
    g.log.push({ team: g.up, word, n, hits: [] });
    g.moveId++;
    announce(g, seat, `${word.toUpperCase()} · ${n}`);
    return null;
  }
  if (g.phase !== 'guess') return 'Wait for the clue';
  if (g.team[seat] !== g.up || seat === g.handler[g.up]) return g.team[seat] === g.up ? 'Handlers can only watch now!' : "It's the other team's turn";
  if (a.type === 'stop') {
    if (!g.guesses) return 'Make at least one guess first';
    announce(g, seat, 'We\'ll stop there');
    switchTeams(g);
    g.moveId++;
    return null;
  }
  if (a.type !== 'guess') return "That move isn't allowed";
  const i = Number(a.i);
  if (!(i >= 0 && i < SIZE) || g.shown[i]) return 'Pick a hidden word';
  g.shown[i] = true;
  g.guesses++;
  g.last = { i, id: g.moveId + 1 };
  g.moveId++;
  const k = g.key[i];
  g.log[g.log.length - 1].hits.push(i);
  if (k === 'x') {
    g.phase = 'over'; g.winner = 1 - g.up; g.how = 'double';
    announce(g, seat, 'The Double Agent! 💀');
    return null;
  }
  if (k === 0 || k === 1) {
    if (!left(g, k)) { g.phase = 'over'; g.winner = k; g.how = 'found'; announce(g, seat, k === g.up ? 'That\'s all of them! 🏆' : 'Oops — that finishes them off'); return null; }
  }
  if (k !== g.up) {
    announce(g, seat, k === 'b' ? 'A bystander 😐' : `One of ${TEAM[k].name}'s! 😬`);
    switchTeams(g);
    return null;
  }
  announce(g, seat, 'Got one! ✔');
  if (g.clue.n > 0 && g.guesses >= g.clue.n + 1) switchTeams(g);
  return null;
}

export const botAction = () => null;

export function viewFor(g, seat) {
  const handler = g.handler.includes(seat) || g.phase === 'over';
  return {
    phase: g.phase, up: g.up, team: g.team, handler: g.handler, order: g.order, words: g.words, shown: g.shown,
    key: g.key.map((k, i) => (handler || g.shown[i] ? k : null)), clue: g.clue, guesses: g.guesses, left: [left(g, 0), left(g, 1)],
    winner: g.winner, how: g.how, last: g.last, moveId: g.moveId, log: g.log.slice(-6),
  };
}
