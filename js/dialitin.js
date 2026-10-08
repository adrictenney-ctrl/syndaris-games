// Dial It In: a guessing game on a half-circle dial. Each round one player — the Reader —
// secretly sees where the target sits on a spectrum ("Cold ⟷ Hot") and gives a one-line
// clue. Their teammates turn the dial to where they think the clue points. Closer = more
// points (4 for a bullseye, then 3, then 2). The other team then bets whether the target is
// left or right of the dial, for a point. First team to 10 wins.
//
// With 2–3 players everyone is on one team, playing together for the best score in 7 rounds.
// Runs only on the table (host).

export const SPECTRA = [
  ['Cold', 'Hot'], ['Useless', 'Useful'], ['Underrated', 'Overrated'], ['Boring', 'Exciting'], ['Cheap', 'Expensive'],
  ['Easy to spell', 'Hard to spell'], ['Quiet', 'Loud'], ['Tiny', 'Enormous'], ['Bad breakfast', 'Great breakfast'],
  ['Villain', 'Hero'], ['Old-fashioned', 'Futuristic'], ['Smells bad', 'Smells good'], ['Safe', 'Dangerous'],
  ['Normal pet', 'Weird pet'], ['Forgettable', 'Unforgettable'], ['Soft', 'Hard'], ['Bad gift', 'Good gift'],
  ['Calm', 'Chaotic'], ['Fact', 'Myth'], ['For kids', 'For adults'], ['Easy job', 'Hard job'], ['Ugly', 'Beautiful'],
  ['Healthy snack', 'Junk food'], ['Short-lived', 'Lasts forever'], ['Wet', 'Dry'], ['Mild', 'Spicy'],
  ['Bad superpower', 'Great superpower'], ['Indoors', 'Outdoors'], ['Rare', 'Common'], ['Sad song', 'Happy song'],
  ['Simple', 'Complicated'], ['Bad habit', 'Good habit'], ['Fragile', 'Indestructible'], ['Lazy', 'Hard-working'],
  ['Unknown', 'Famous'], ['Slow', 'Fast'], ['Rough', 'Smooth'], ['Bad movie', 'Great movie'], ['Light', 'Heavy'],
  ['Nobody needs it', 'Everybody needs it'], ['Mainstream', 'Niche'], ['Overpriced', 'A bargain'], ['Casual', 'Formal'],
  ['Comfortable', 'Uncomfortable'], ['Friendly animal', 'Scary animal'], ['Normal', 'Bizarre'], ['Low-tech', 'High-tech'],
  ['Bad holiday spot', 'Dream holiday spot'], ['Sweet', 'Sour'], ['Dull colour', 'Bright colour'], ['Quick meal', 'Feast'],
  ['Harmless', 'Deadly'], ['Bad smell to wake up to', 'Good smell to wake up to'], ['Ordinary', 'Magical'],
  ['Unhelpful advice', 'Wise advice'], ['Plain', 'Fancy'], ['Bad for a first date', 'Good for a first date'],
  ['Small talk', 'Deep talk'], ['Messy', 'Tidy'], ['Weak', 'Strong'], ['Lowbrow', 'Highbrow'], ['Nervous', 'Confident'],
  ['Mostly harmless', 'Mostly trouble'], ['Hard to pronounce', 'Easy to pronounce'], ['Bad name for a boat', 'Good name for a boat'],
  ['Trend', 'Classic'], ['Underwater', 'In space'], ['Dad joke', 'Clever joke'], ['Tastes worse cold', 'Tastes better cold'],
  ['Morning thing', 'Night thing'], ['Overcooked', 'Raw'], ['Unpopular opinion', 'Popular opinion'], ['Waste of time', 'Time well spent'],
  ['Silent movie hero', 'Action movie hero'], ['Childhood fear', 'Adult fear'], ['Needs batteries', 'Never needs batteries'],
  ['Boring hobby', 'Thrilling hobby'], ['Square', 'Round'], ['Flimsy excuse', 'Solid excuse'], ['Bad smell in a car', 'Good smell in a car'],
];
export const BANDS = [[3.5, 4], [10.5, 3], [17.5, 2]];   // half-widths in degrees, and points
export const WIN = 10, COOP_ROUNDS = 7;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = { settings: { ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.coop = g.order.length < 4;
  // Teams alternate round the table so teammates aren't sitting together.
  g.team = g.seats.map(() => -1);
  g.order.forEach((s, i) => { g.team[s] = g.coop ? 0 : i % 2; });
  g.scores = [0, 0];
  g.round = 0;
  g.deck = shuffle(SPECTRA.map((_, i) => i));
  g.next = [0, 0];          // whose turn to read, per team
  g.teamUp = Math.floor(Math.random() * 2);
  if (g.coop) g.teamUp = 0;
  g.winner = null;
  startRound(g);
  return g;
}

export const members = (g, t) => g.order.filter(s => g.team[s] === t);
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };

function startRound(g) {
  g.round++;
  const team = members(g, g.teamUp);
  g.reader = team[g.next[g.teamUp] % team.length];
  g.next[g.teamUp]++;
  if (g.deck.length < 2) g.deck = shuffle(SPECTRA.map((_, i) => i));
  g.offer = [g.deck.pop(), g.deck.pop()];
  g.card = null;
  g.target = 8 + Math.random() * 164;       // keep the whole bullseye on the dial
  g.clue = '';
  g.dial = 90;
  g.side = null;
  g.phase = 'clue';
  g.result = null;
  g.moveId++;
}

export function points(target, dial) {
  const d = Math.abs(target - dial);
  for (const [w, p] of BANDS) if (d <= w) return p;
  return 0;
}

export function current(g) {
  if (g.phase === 'clue') return g.reader;
  return -1;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (!g.order.includes(seat)) return "You're not playing";
  const guessers = members(g, g.teamUp).filter(s => s !== g.reader);
  if (a.type === 'clue') {
    if (g.phase !== 'clue' || seat !== g.reader) return 'Only the Reader gives the clue';
    const clue = String(a.clue || '').replace(/[<>&"]/g, '').trim().slice(0, 60);
    if (!clue) return 'Type a clue first';
    const pick = g.offer.includes(Number(a.card)) ? Number(a.card) : g.offer[0];
    g.card = pick;
    g.deck.unshift(...g.offer.filter(x => x !== pick));
    g.clue = clue;
    g.phase = 'dial';
    g.moveId++;
    announce(g, seat, `“${clue}”`);
    return null;
  }
  if (a.type === 'dial') {
    if (g.phase !== 'dial') return 'Not now';
    if (!guessers.includes(seat)) return "Only the Reader's teammates turn the dial";
    g.dial = Math.max(0, Math.min(180, Number(a.at) || 0));
    g.dialBy = seat;
    g.moveId++;
    return null;
  }
  if (a.type === 'lock') {
    if (g.phase !== 'dial' || !guessers.includes(seat)) return 'Not now';
    g.moveId++;
    announce(g, seat, 'Locked in! 🔒');
    if (g.coop) return reveal(g);
    g.phase = 'side';
    return null;
  }
  if (a.type === 'side') {
    if (g.phase !== 'side' || g.team[seat] === g.teamUp) return 'The other team calls left or right';
    if (a.side !== 'L' && a.side !== 'R') return 'Left or right?';
    g.side = { side: a.side, by: seat };
    announce(g, seat, a.side === 'L' ? '◀ Left!' : 'Right! ▶');
    return reveal(g);
  }
  return "That move isn't allowed";
}

function reveal(g) {
  const pts = points(g.target, g.dial);
  g.scores[g.teamUp] += pts;
  let sidePt = 0;
  if (g.side && pts < 4) {
    const truth = g.target < g.dial ? 'L' : 'R';
    if (truth === g.side.side) { sidePt = 1; g.scores[1 - g.teamUp] += 1; }
  }
  g.result = { pts, sidePt, team: g.teamUp };
  g.phase = 'reveal';
  g.revealAt = Date.now();
  g.moveId++;
  if (g.coop ? g.round >= COOP_ROUNDS : Math.max(...g.scores) >= WIN) {
    g.phase = 'over';
    if (!g.coop) {
      const t = g.scores[0] === g.scores[1] ? g.teamUp : g.scores[0] > g.scores[1] ? 0 : 1;
      g.winner = t;
    }
  }
  return null;
}

// After the reveal, the next round starts on its own. A team that scored 4 but is still
// behind goes again (the catch-up rule).
export function tick(g) {
  if (g.phase !== 'reveal') return null;
  return {
    ms: Math.max(0, g.revealAt + 7000 - Date.now()), run: () => {
      if (!g.coop && !(g.result.pts === 4 && g.scores[g.teamUp] < g.scores[1 - g.teamUp])) g.teamUp = 1 - g.teamUp;
      startRound(g);
    },
  };
}

export const botAction = () => null;

export function viewFor(g, seat) {
  const secret = g.phase === 'reveal' || g.phase === 'over' || seat === g.reader;
  return {
    phase: g.phase, round: g.round, coop: g.coop, team: g.team, scores: g.scores, teamUp: g.teamUp, reader: g.reader, order: g.order,
    offer: seat === g.reader && g.phase === 'clue' ? g.offer.map(i => ({ i, ends: SPECTRA[i] })) : null,
    card: g.card != null ? SPECTRA[g.card] : null, clue: g.clue, dial: g.dial, side: g.side,
    target: secret ? g.target : null, result: g.result, winner: g.winner, moveId: g.moveId,
  };
}
