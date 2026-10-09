// Act It Out: charades for two teams. The actor's phone shows something to act out — no talking,
// no sounds, no pointing at things in the room — and their team shouts guesses. Got it scores a
// point and shows the next one; Skip passes. When the minute is up, the other team acts. Actors
// take turns; most points wins.
import { base, teams, deal, sfx, left } from './party.js?v=67';

export const CARDS = {
  'Action': 'Brushing your teeth|Riding a horse|Climbing a ladder|Changing a nappy|Walking a dog|Flying a kite|Juggling|Bowling|Fishing|Swimming|Surfing|Skiing|Ice skating|Chopping wood|Milking a cow|Baking a cake|Mowing the lawn|Washing a car|Taking a selfie|Blowing up a balloon|Sneezing|Getting a haircut|Doing laundry|Playing the violin|Rowing a boat|Climbing a mountain|Building a snowman|Lifting weights|Yawning|Tying shoelaces|Walking on a tightrope|Hammering a nail|Painting a wall|Riding a rollercoaster|Doing yoga',
  'Animal': 'Elephant|Kangaroo|Penguin|Monkey|Snake|Giraffe|Crab|Chicken|Frog|Gorilla|Flamingo|Octopus|Butterfly|Shark|Rabbit|Cat|Dog|Horse|Owl|Lion|Crocodile|Bear|Duck|Turtle|Spider|Bat|Seal|Peacock|Sloth|Woodpecker',
  'Job': 'Firefighter|Chef|Doctor|Dentist|Pilot|Teacher|Photographer|Magician|Lifeguard|Mail carrier|Hairdresser|Waiter|Astronaut|Farmer|Plumber|Police officer|Referee|Conductor|Painter|Lumberjack|Ballet dancer|DJ|Zookeeper|Surgeon|Construction worker',
  'Sport': 'Tennis|Golf|Boxing|Basketball|Baseball|Archery|Fencing|Wrestling|Diving|Gymnastics|Karate|Bowling|Snowboarding|Weightlifting|Rowing|Hurdles|Javelin|Skateboarding|Volleyball|Ping pong',
  'Thing': 'Umbrella|Toothbrush|Vacuum cleaner|Washing machine|Scissors|Camera|Telescope|Hairdryer|Pogo stick|Trampoline|Ladder|Microwave|Remote control|Rocking chair|Typewriter|Hammock|Stapler|Kettle|Bicycle|Fire extinguisher|Wheelbarrow|Seesaw|Yo-yo|Paper aeroplane|Snow globe',
  'Character': 'Santa Claus|A pirate|A zombie|A vampire|A robot|A mermaid|A cowboy|A ghost|A ninja|A superhero|A wizard|A mummy|A clown|A king|A cave person|An alien|A knight|A witch|A fairy|A scarecrow',
  'Place': 'A library|A gym|A dentist’s office|A rollercoaster|A haunted house|A beach|An airport|A circus|A hospital|A bowling alley|A cinema|A restaurant|A farm|A zoo|A swimming pool',
};
export const DECK = Object.entries(CARDS).flatMap(([cat, list]) => list.split('|').map(w => [cat, w]));

export function createGame(settings, players) {
  const g = base(settings, players, { secs: 60, rounds: 2 });
  teams(g);
  g.up = 0;
  g.next = [0, 0];
  g.turnNo = 0;
  g.total = Math.max(g.members[0].length, g.members[1].length) * 2 * g.settings.rounds;
  startTurn(g);
  return g;
}
export const actor = g => g.members[g.up][g.next[g.up] % g.members[g.up].length];
function startTurn(g) { g.phase = 'ready'; g.card = null; g.log = []; g.endAt = 0; g.moveId++; }
export const collecting = () => false;
export const turnSeat = g => (g.phase === 'ready' || g.phase === 'act' ? actor(g) : -1);
export const current = g => turnSeat(g);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== actor(g)) return 'Only the actor can do that';
  if (g.phase === 'ready' && a.type === 'start') {
    g.phase = 'act';
    g.endAt = Date.now() + g.settings.secs * 1000;
    g.card = deal(g, 'c', DECK.length);
    sfx(g, 'thud');
    g.moveId++;
    return null;
  }
  if (g.phase === 'act' && (a.type === 'got' || a.type === 'skip')) {
    g.log.push({ w: DECK[g.card][1], r: a.type });
    if (a.type === 'got') { g.scores[g.up]++; sfx(g, 'ding'); }
    g.card = deal(g, 'c', DECK.length);
    g.moveId++;
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'act') return { ms: Math.max(0, g.endAt - Date.now()), run: () => { g.phase = 'end'; g.endShown = Date.now(); g.endAt = 0; sfx(g, 'buzzer'); g.moveId++; } };
  if (g.phase === 'end') return { ms: Math.max(0, g.endShown + 7000 - Date.now()), run: () => {
    g.next[g.up]++;
    g.turnNo++;
    if (g.turnNo >= g.total) { g.phase = 'over'; g.winner = g.scores[0] === g.scores[1] ? null : g.scores[0] > g.scores[1] ? 0 : 1; g.moveId++; return; }
    g.up = 1 - g.up;
    startTurn(g);
  } };
  return null;
}
export const botAction = g => (g.phase === 'ready' ? { type: 'start' } : { type: Math.random() < 0.6 ? 'got' : 'skip' });

const TEAMS = ['Team Ruby', 'Team Teal'];
export function viewFor(g, seat) {
  const t = g.team[seat], A = actor(g);
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'act' ? left(g) : 0, teamName: TEAMS[t], myTeam: t, hud: [[TEAMS[t], g.scores[t]], [TEAMS[1 - t], g.scores[1 - t]]] };
  if (g.phase === 'ready') v.ui = seat === A
    ? { k: 'buttons', key: 'r' + g.turnNo, title: 'You’re acting!', sub: 'No talking, no sounds — act it out', myturn: true, buzz: true, buttons: [{ type: 'start', label: 'Start', icon: '🎭', go: true, cls: 'pp-huge' }] }
    : { k: 'wait', title: g.up === t ? `@${A}@ is acting for you` : `@${A}@ acts for the other team`, sub: g.up === t ? 'Get ready to guess' : 'Sit back and enjoy (no helping!)' };
  else if (g.phase === 'act') {
    const [cat, w] = DECK[g.card];
    v.ui = seat === A
      ? { k: 'buttons', key: 'a' + g.card + ':' + g.log.length, title: 'Act it out!', sub: `${g.log.filter(x => x.r === 'got').length} so far`, myturn: true, card: { kicker: cat, big: w, cls: 'ai-card' }, buttons: [{ type: 'skip', label: 'Skip' }, { type: 'got', label: 'Got it!', go: true }] }
      : { k: 'wait', title: g.up === t ? 'GUESS! 📣' : 'No helping!', sub: `Category: ${cat}` };
  } else if (g.phase === 'end') v.ui = { k: 'wait', title: 'Time!', sub: `${TEAMS[g.up]} got ${g.log.filter(x => x.r === 'got').length}`, card: { list: g.log.map(x => (x.r === 'got' ? '✓ ' : '↷ ') + x.w) } };
  else v.ui = { k: 'wait', title: g.winner == null ? 'A tie!' : g.winner === t ? '🏆 Your team wins!' : `${TEAMS[g.winner]} wins`, sub: 'Look at the table to play again' };
  return v;
}
