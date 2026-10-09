// Know Me: how well do you know each other? One player is in the hot seat. A question about them
// goes up on the table with four answers. They secretly pick their real answer on their phone while
// everyone else guesses what they picked. +1 for every right guess — and the hot seat gets +1 for
// each friend who knew them. Everyone takes the hot seat twice.
import { base, deal, sfx, left, waiting, finish } from './party.js?v=68';

export const QS = [
  ['The perfect Saturday?', 'Out with friends', 'On the sofa', 'Outdoors, somewhere green', 'Trying something new'],
  ['Pick a superpower', 'Flying', 'Invisibility', 'Reading minds', 'Teleporting'],
  ['Go-to snack', 'Crisps / chips', 'Chocolate', 'Fruit', 'Cheese'],
  ['Dream holiday', 'Beach and sun', 'A big city', 'Mountains and snow', 'A road trip'],
  ['In a zombie film you’d be…', 'The leader', 'The one with a plan', 'First to go', 'Hiding the whole time'],
  ['Morning person?', 'Up with the sun', 'Fine after coffee', 'Grumpy until noon', 'What’s a morning?'],
  ['Favourite way to say sorry', 'Words', 'A gift', 'Food', 'Pretend it never happened'],
  ['Pick a pet', 'Dog', 'Cat', 'Something scaly', 'No pets, thanks'],
  ['When the bill comes they…', 'Grab it first', 'Split it exactly', 'Suddenly need the bathroom', 'Check it twice'],
  ['Best pizza', 'Plain cheese', 'Pepperoni', 'Pineapple — fight me', 'Loaded with veggies'],
  ['Biggest fear', 'Spiders', 'Heights', 'Public speaking', 'Deep water'],
  ['They’d survive longest…', 'On a desert island', 'In the wild woods', 'In space', 'Without their phone'],
  ['How they pack for a trip', 'Weeks early, with a list', 'The night before', 'An hour before leaving', 'They forget something every time'],
  ['Favourite season', 'Spring', 'Summer', 'Autumn', 'Winter'],
  ['At a party you’ll find them…', 'On the dance floor', 'In the kitchen', 'With the pets', 'Leaving early'],
  ['Pick a movie night', 'Comedy', 'Horror', 'Action', 'A good cry'],
  ['Dream job as a kid', 'Astronaut', 'Vet', 'Famous star', 'Something sensible'],
  ['Texting style', 'Lots of emojis', 'One word', 'Voice notes', 'Replies three days later'],
  ['A perfect breakfast', 'Full cooked breakfast', 'Cereal', 'Just coffee', 'Pancakes'],
  ['If they won the lottery…', 'Travel the world', 'Buy a dream house', 'Give lots away', 'Keep working, secretly rich'],
  ['Their cooking is…', 'Restaurant-level', 'Pretty decent', 'Toast is a recipe', 'A fire hazard'],
  ['Hot or cold?', 'Always cold', 'Always hot', 'Just right', 'Depends on the snacks'],
  ['Messy or tidy?', 'Spotless', 'Organised chaos', 'Messy', 'Tidy… when guests come'],
  ['Karaoke song style', 'Big power ballad', 'Rap', 'A duet', 'They won’t sing, ever'],
  ['Favourite way to relax', 'Music', 'A bath', 'Games', 'A nap'],
  ['Board game style', 'Plays to win, always', 'Just here for fun', 'Rules lawyer', 'Accidental winner'],
  ['Pick a decade to live in', 'The 60s', 'The 80s', 'The 2000s', 'The future'],
  ['Phone battery right now?', 'Over 80%', 'About half', 'In the red', 'Already dead'],
  ['In a group project they’re…', 'The boss', 'The hard worker', 'The ideas person', 'The one who vanishes'],
  ['Pick a sweet treat', 'Ice cream', 'Cake', 'Cookies', 'Sweets / candy'],
];

export function createGame(settings, players) {
  const g = base(settings, players, { laps: 2 });
  g.turn = 0;
  g.total = g.order.length * g.settings.laps;
  startRound(g);
  return g;
}
export const hot = g => g.order[g.turn % g.order.length];
const guessers = g => g.order.filter(s => s !== hot(g));
function startRound(g) {
  g.q = deal(g, 'q', QS.length);
  g.ans = {};
  g.done = {};
  g.phase = 'answer';
  g.endAt = Date.now() + 40000;
  g.moveId++;
}
export const collecting = g => g.phase === 'answer';
export const turnSeat = g => (g.phase === 'answer' ? hot(g) : -1);
export const pending = g => (g.phase === 'answer' ? waiting(g) : []);
export const current = g => pending(g)[0] ?? -1;

function reveal(g) {
  const H = hot(g), truth = g.ans[H];
  g.gain = {};
  for (const s of g.order) g.gain[s] = 0;
  if (truth != null) for (const s of guessers(g)) if (g.ans[s] === truth) { g.gain[s]++; g.gain[H]++; }
  for (const s of g.order) g.score[s] += g.gain[s];
  sfx(g, 'chime');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}
export function applyAction(g, seat, a) {
  if (!a || a.type !== 'pick' || g.phase !== 'answer') return 'Not now';
  if (g.done[seat]) return 'Already locked in';
  const i = Number(a.v);
  if (!(i >= 0 && i < 4)) return 'Pick an answer';
  g.ans[seat] = i;
  g.done[seat] = true;
  if (!waiting(g).length) reveal(g); else g.moveId++;
  return null;
}
export function tick(g) {
  if (g.phase === 'answer') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 7000 - Date.now()), run: () => { g.turn++; if (g.turn >= g.total) finish(g); else startRound(g); } };
  return null;
}
export const botAction = () => ({ type: 'pick', v: Math.floor(Math.random() * 4) });

export function viewFor(g, seat) {
  const H = hot(g), me = seat === H, Q = QS[g.q];
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'answer' ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Turn', `${Math.min(g.turn + 1, g.total)}/${g.total}`]] };
  const opts = Q.slice(1).map((t, i) => ({ v: i, label: t, cls: 'tw-c' + i }));
  if (g.phase === 'answer') v.ui = g.done[seat] ? { k: 'wait', title: 'Locked in ✓', sub: `Waiting for ${waiting(g).length} more…`, card: { kicker: me ? 'About you' : `About @${H}@`, big: Q[0] } }
    : { k: 'pick', key: 'a' + g.turn, title: me ? 'Your honest answer' : `What did @${H}@ pick?`, sub: me ? 'Everyone is guessing — be truthful!' : 'Guess their answer', myturn: true, buzz: true, card: { kicker: me ? 'About you' : `About @${H}@`, big: Q[0] }, options: opts };
  else if (g.phase === 'reveal') v.ui = { k: 'wait', title: me ? `${g.gain[H]} friend${g.gain[H] === 1 ? '' : 's'} knew you` : g.gain[seat] ? '✓ You know them!' : '✗ Not quite', sub: g.ans[H] != null ? `@${H}@ said: ${Q[g.ans[H] + 1]}` : 'They didn’t answer in time' };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Best friend award!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
