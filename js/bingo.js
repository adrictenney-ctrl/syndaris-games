// Bingo: everyone gets a 5×5 card (B 1–15, I 16–30, N 31–45 with a free centre, G 46–60,
// O 61–75). The table calls a ball every few seconds; daub the number if it's on your card (or
// let the phone do it). Complete the pattern — any line, four corners, or the whole card — and
// shout BINGO on your phone. A false call sits you out for the next three balls.

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const LETTER = n => 'BINGO'[Math.floor((n - 1) / 15)];

export function makeCard() {
  const cols = [0, 1, 2, 3, 4].map(c => shuffle([...Array(15)].map((_, i) => c * 15 + i + 1)).slice(0, 5));
  const card = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) card.push(r === 2 && c === 2 ? 0 : cols[c][r]);
  return card;   // row-major; 0 = free space
}
const LINES = (() => {
  const L = [];
  for (let i = 0; i < 5; i++) { L.push([0, 1, 2, 3, 4].map(c => i * 5 + c)); L.push([0, 1, 2, 3, 4].map(r => r * 5 + i)); }
  L.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
  return L;
})();
export function wins(card, called, pattern) {
  const has = i => card[i] === 0 || called.includes(card[i]);
  if (pattern === 'corners') return [0, 4, 20, 24].every(has);
  if (pattern === 'full') return card.every((_, i) => has(i));
  return LINES.some(l => l.every(has));
}

export function createGame(settings, players) {
  const g = { settings: { pattern: 'line', pace: 8, auto: true, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.cards = g.seats.map(x => (x ? makeCard() : null));
  g.daubs = g.seats.map(() => []);
  g.balls = shuffle([...Array(75)].map((_, i) => i + 1));
  g.called = [];
  g.penalty = g.seats.map(() => 0);
  g.phase = 'play';
  g.nextAt = Date.now() + 4000;
  g.winners = [];
  return g;
}

export const current = () => -1;

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'The game is over';
  if (!g.order.includes(seat)) return "You're not playing";
  if (a.type === 'daub') {
    const n = Number(a.n);
    if (!g.cards[seat].includes(n)) return 'Not on your card';
    g.daubs[seat] = g.daubs[seat].includes(n) ? g.daubs[seat].filter(x => x !== n) : [...g.daubs[seat], n];
    g.moveId++;
    return null;
  }
  if (a.type === 'bingo') {
    if (g.penalty[seat] > 0) return `Sit out ${g.penalty[seat]} more ball${g.penalty[seat] > 1 ? 's' : ''}`;
    if (wins(g.cards[seat], g.called, g.settings.pattern)) {
      g.winners.push(seat);
      announce(g, seat, 'BINGO! 🎉');
      // Anyone else who calls on this same ball shares it.
      g.closeAt = g.closeAt || Date.now() + 2500;
      g.moveId++;
      return null;
    }
    g.penalty[seat] = 3;
    announce(g, seat, 'False call! 🙈');
    g.moveId++;
    return null;
  }
  if (a.type === 'call') { callBall(g); return null; }
  return "That move isn't allowed";
}

function callBall(g) {
  if (!g.balls.length) { g.phase = 'over'; g.moveId++; return; }
  const n = g.balls.pop();
  g.called.push(n);
  g.penalty = g.penalty.map(p => Math.max(0, p - 1));
  if (g.settings.auto) for (const s of g.order) if (g.cards[s].includes(n)) g.daubs[s].push(n);
  g.nextAt = Date.now() + g.settings.pace * 1000;
  g.moveId++;
}

export function tick(g, players) {
  if (g.phase !== 'play') return null;
  if (g.closeAt) return { ms: Math.max(0, g.closeAt - Date.now()), run: () => { g.phase = 'over'; g.moveId++; } };
  // Computer players notice their bingo a moment after the ball.
  const bot = g.order.find(s => players?.[s]?.bot && !g.winners.includes(s) && wins(g.cards[s], g.called, g.settings.pattern));
  if (bot != null) return { ms: 1200 + Math.random() * 1500, run: () => applyAction(g, bot, { type: 'bingo' }) };
  if (g.settings.pace === 0) return null;   // the host calls each ball
  return { ms: Math.max(0, g.nextAt - Date.now()), run: () => callBall(g) };
}

export const botAction = () => null;
export function viewFor(g, seat) {
  return { phase: g.phase, order: g.order, card: g.cards[seat], daubs: g.daubs[seat] || [], called: g.called, last: g.called[g.called.length - 1] ?? null, pattern: g.settings.pattern, auto: g.settings.auto, penalty: g.penalty[seat] || 0, winners: g.winners, nextIn: g.nextAt - Date.now(), moveId: g.moveId };
}
