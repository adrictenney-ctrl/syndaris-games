// This or That: an impossible choice goes up on the table — "Fly or be invisible?" Everyone secretly
// picks their own answer on their phone, then predicts which side MOST of the room picked. The vote
// is revealed as a tug of war: +1 if you predicted the majority (a tie means everyone's right).
import { base, deal, sfx, left, waiting, finish } from './party.js?v=68';

export const PAIRS = [
  ['Fly', 'Be invisible'], ['Beach', 'Mountains'], ['Cats', 'Dogs'], ['Sweet', 'Savoury'], ['Early bird', 'Night owl'], ['Pizza forever', 'Burgers forever'],
  ['Talk to animals', 'Speak every language'], ['Live in the past', 'Live in the future'], ['Never use your phone again', 'Never watch TV again'], ['Summer', 'Winter'],
  ['Be famous', 'Be rich'], ['Time travel', 'Teleport'], ['Always too hot', 'Always too cold'], ['Book', 'Movie'], ['Have a pet dragon', 'Have a pet unicorn'],
  ['Read minds', 'See the future'], ['City life', 'Country life'], ['Coffee', 'Tea'], ['Sing every word you say', 'Dance everywhere you go'], ['No music', 'No movies'],
  ['Be a wizard', 'Be a superhero'], ['Explore space', 'Explore the deep ocean'], ['Only eat breakfast foods', 'Never eat breakfast foods'], ['Lose your keys every day', 'Lose your phone once a month'],
  ['Have a rewind button', 'Have a pause button'], ['Live in a treehouse', 'Live on a houseboat'], ['Win an Olympic medal', 'Win an Oscar'], ['Be the funniest person', 'Be the smartest person'],
  ['Free travel for life', 'Free food for life'], ['Ice cream', 'Cake'], ['Swim with sharks', 'Sleep in a haunted house'], ['Have no eyebrows', 'Have one giant eyebrow'],
  ['Know how you die', 'Know when you die'], ['Board games', 'Video games'], ['Rain', 'Snow'], ['Be a giant', 'Be tiny'], ['Have a personal chef', 'Have a personal driver'],
  ['Skip the line forever', 'Never hit a red light'], ['Socks with sandals', 'Shorts in the snow'], ['Live without the internet', 'Live without hot water'],
  ['Be a famous singer', 'Be a famous athlete'], ['Spicy', 'Mild'], ['Camping', 'Five-star hotel'], ['Breakfast in bed', 'Dinner on a rooftop'], ['Never be tired', 'Never be hungry'],
  ['Have a twin', 'Be an only child'], ['Robot butler', 'Robot dog'], ['Go back to school', 'Work forever'], ['Fight one horse-sized duck', 'Fight a hundred duck-sized horses'], ['Pineapple on pizza: yes', 'Pineapple on pizza: no'],
];

export function createGame(settings, players) {
  const g = base(settings, players, { rounds: 10 });
  g.round = 0;
  startRound(g);
  return g;
}
function startRound(g) {
  g.round++;
  g.q = deal(g, 'q', PAIRS.length);
  g.pick = {};
  g.pred = {};
  g.done = {};
  g.phase = 'vote';
  g.endAt = Date.now() + 30000;
  g.moveId++;
}
export const collecting = g => g.phase === 'vote';
export const turnSeat = () => -1;
export const pending = g => (g.phase === 'vote' ? waiting(g) : []);
export const current = g => pending(g)[0] ?? -1;

function reveal(g) {
  const n = [0, 1].map(i => Object.values(g.pick).filter(x => x === i).length);
  g.count = n;
  g.major = n[0] === n[1] ? -1 : n[0] > n[1] ? 0 : 1;
  g.gain = {};
  for (const s of g.order) { g.gain[s] = g.pred[s] != null && (g.major < 0 || g.pred[s] === g.major) ? 1 : 0; g.score[s] += g.gain[s]; }
  sfx(g, 'chime');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}
export function applyAction(g, seat, a) {
  if (!a || a.type !== 'pick' || g.phase !== 'vote') return 'Not now';
  if (g.done[seat]) return 'Already in';
  const i = Number(a.v);
  if (i !== 0 && i !== 1) return 'Pick one';
  if (g.pick[seat] == null) g.pick[seat] = i;
  else { g.pred[seat] = i; g.done[seat] = true; }
  if (!waiting(g).length) reveal(g); else g.moveId++;
  return null;
}
export function tick(g) {
  if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 7000 - Date.now()), run: () => (g.round >= g.settings.rounds ? finish(g) : startRound(g)) };
  return null;
}
export const botAction = () => ({ type: 'pick', v: Math.random() < 0.5 ? 0 : 1 });

export function viewFor(g, seat) {
  const P = PAIRS[g.q];
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'vote' ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
  const opts = P.map((t, i) => ({ v: i, label: t, cls: i ? 'tt-b' : 'tt-a' }));
  if (g.phase === 'vote') {
    if (g.done[seat]) v.ui = { k: 'wait', title: 'All in ✓', sub: `You: ${P[g.pick[seat]]} · you think most said ${P[g.pred[seat]]}` };
    else if (g.pick[seat] == null) v.ui = { k: 'pick', key: 'p' + g.round, title: 'Which would YOU choose?', sub: 'Secretly', myturn: true, buzz: true, grid: 2, big: true, options: opts };
    else v.ui = { k: 'pick', key: 'q' + g.round, title: 'Which did MOST people choose?', sub: `You chose ${P[g.pick[seat]]} — now read the room`, myturn: true, grid: 2, big: true, options: opts };
  } else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.gain[seat] ? '+1 — you read the room!' : 'The room surprised you', sub: g.major < 0 ? 'It’s a perfect tie!' : `Most chose ${P[g.major]}` };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Mind reader!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
