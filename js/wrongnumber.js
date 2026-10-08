// Wrong Number: a party game of texts from unknown numbers. Each round one player is the
// Receiver: a strange text arrives on the table. Everyone else picks the funniest reply from the
// seven in their hand. The replies appear anonymously as bubbles; the Receiver picks a favourite,
// and whoever sent it wins the round's text. First to the target score wins.
import { PROMPTS, REPLIES } from './wrongnumber-cards.js?v=60';

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const HAND = 7;

export function createGame(settings, players) {
  const g = {
    settings: { target: 5, ...settings }, seats: players.map(p => !!p), score: players.map(() => 0),
    prompts: shuffle(PROMPTS.map((_, i) => i)), replies: shuffle(REPLIES.map((_, i) => i)), used: [],
    round: 0, receiverIdx: -1, annId: 0, swaps: players.map(() => 1),
  };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.hands = g.seats.map(x => (x ? [] : null));
  startRound(g);
  return g;
}

function draw(g) {
  if (!g.replies.length) { g.replies = shuffle(g.used); g.used = []; }
  return g.replies.pop();
}

function startRound(g) {
  g.round++;
  g.receiverIdx = (g.receiverIdx + 1) % g.order.length;
  g.receiver = g.order[g.receiverIdx];
  if (!g.prompts.length) g.prompts = shuffle(PROMPTS.map((_, i) => i));
  g.prompt = g.prompts.pop();
  for (const s of g.order) while (g.hands[s].length < HAND) g.hands[s].push(draw(g));
  g.played = {};               // seat -> reply index
  g.shown = null;              // anonymous order of seats once everyone has replied
  g.pick = null;
  g.phase = 'reply';
}

function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (!g.order.includes(seat)) return "You're not in this game";
  if (a.type === 'swap') {
    if (g.phase !== 'reply' || seat === g.receiver || g.played[seat] != null) return 'Not now';
    if (!g.swaps[seat]) return 'You already used your new phone';
    g.swaps[seat]--;
    g.used.push(...g.hands[seat]);
    g.hands[seat] = [];
    while (g.hands[seat].length < HAND) g.hands[seat].push(draw(g));
    announce(g, seat, 'Got a new phone');
    return null;
  }
  if (a.type === 'reply') {
    if (g.phase !== 'reply') return 'Replies are closed';
    if (seat === g.receiver) return "You're the Receiver this round";
    if (g.played[seat] != null) return 'You already replied';
    if (!g.hands[seat].includes(a.r)) return "That reply isn't in your hand";
    g.hands[seat] = g.hands[seat].filter(x => x !== a.r);
    g.played[seat] = a.r;
    if (g.order.every(s => s === g.receiver || g.played[s] != null)) {
      g.shown = shuffle(Object.keys(g.played).map(Number));
      g.phase = 'judge';
    }
    return null;
  }
  if (a.type === 'pick') {
    if (g.phase !== 'judge') return 'Not yet';
    if (seat !== g.receiver) return 'Only the Receiver picks';
    const w = g.shown[a.i];
    if (w == null) return 'Pick a reply';
    g.pick = { seat: w, reply: g.played[w], i: a.i };
    g.score[w]++;
    g.used.push(...Object.values(g.played));
    announce(g, w, 'Best reply!');
    g.phase = g.score[w] >= g.settings.target ? 'over' : 'won';
    g.nextAt = Date.now() + 6000;
    return null;
  }
  return "That move isn't allowed";
}

export function advance(g) {
  if (g.phase === 'won' && Date.now() >= g.nextAt) { startRound(g); return true; }
  return false;
}

export function viewFor(g, seat) {
  return {
    phase: g.phase, round: g.round, receiver: g.receiver, prompt: PROMPTS[g.prompt], score: g.score, order: g.order, target: g.settings.target,
    hand: (g.hands[seat] || []).map(r => ({ r, text: REPLIES[r] })),
    mine: g.played[seat] ?? null, waiting: g.order.filter(s => s !== g.receiver && g.played[s] == null),
    replies: g.shown ? g.shown.map(s => REPLIES[g.played[s]]) : null,
    pick: g.pick && { ...g.pick, text: REPLIES[g.pick.reply] }, swaps: g.swaps[seat] ?? 0,
  };
}

export function botAction(g, seat) {
  if (g.phase === 'reply' && seat !== g.receiver && g.played[seat] == null) {
    const h = g.hands[seat];
    return { type: 'reply', r: h[Math.floor(Math.random() * h.length)] };
  }
  if (g.phase === 'judge' && seat === g.receiver) return { type: 'pick', i: Math.floor(Math.random() * g.shown.length) };
  return null;
}
