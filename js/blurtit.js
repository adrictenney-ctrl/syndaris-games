// Blurt It: two teams. On your team's turn a topic goes up — "Things in a fridge" — and your team
// has a minute to shout out as many of the ten answers on the card as they can. Someone from the
// OTHER team holds the card on their phone and ticks each one off as it's said. One point per
// answer found. Teams take turns; most points wins.
import { base, teams, deal, sfx, left, announce } from './party.js?v=67';

export const TOPICS = [
  ['Things in a fridge', 'Milk|Eggs|Butter|Cheese|Juice|Ketchup|Leftovers|Yogurt|Lettuce|Mustard'],
  ['Pizza toppings', 'Pepperoni|Mushrooms|Onions|Sausage|Peppers|Olives|Ham|Pineapple|Bacon|Anchovies'],
  ['Farm animals', 'Cow|Pig|Horse|Sheep|Chicken|Goat|Duck|Turkey|Donkey|Rooster'],
  ['Things at a birthday party', 'Cake|Candles|Balloons|Presents|Hats|Ice cream|Games|Music|Cards|Streamers'],
  ['Board and card game words', 'Dice|Deck|Shuffle|Deal|Turn|Board|Token|Spinner|Score|Cheat'],
  ['Things with wings', 'Bird|Plane|Butterfly|Bee|Bat|Angel|Dragon|Fly|Helicopter|Moth'],
  ['Colours of the rainbow', 'Red|Orange|Yellow|Green|Blue|Indigo|Violet|Purple|Pink|Turquoise'],
  ['Kitchen utensils', 'Spoon|Fork|Knife|Spatula|Whisk|Ladle|Tongs|Peeler|Grater|Rolling pin'],
  ['Things at the beach', 'Sand|Waves|Towel|Umbrella|Shells|Sunscreen|Seagulls|Bucket|Lifeguard|Surfboard'],
  ['Sports with a ball', 'Soccer|Basketball|Tennis|Baseball|Golf|Volleyball|Rugby|Cricket|Bowling|Football'],
  ['Things that are cold', 'Ice|Snow|Ice cream|Freezer|Winter|Penguin|Igloo|Popsicle|Glacier|Fridge'],
  ['Musical instruments', 'Piano|Guitar|Drums|Violin|Trumpet|Flute|Saxophone|Harp|Cello|Clarinet'],
  ['Breakfast foods', 'Eggs|Bacon|Toast|Cereal|Pancakes|Waffles|Oatmeal|Sausage|Bagel|Muffin'],
  ['Things in a classroom', 'Desk|Chair|Board|Teacher|Books|Pencils|Clock|Globe|Map|Computer'],
  ['Zoo animals', 'Lion|Tiger|Elephant|Giraffe|Monkey|Zebra|Bear|Penguin|Hippo|Gorilla'],
  ['Things you wear in winter', 'Coat|Hat|Scarf|Gloves|Boots|Sweater|Mittens|Earmuffs|Thermals|Jacket'],
  ['Body parts with three letters', 'Arm|Leg|Eye|Ear|Hip|Lip|Toe|Jaw|Rib|Gum'],
  ['Things with keys', 'Piano|Keyboard|Car|Door|Lock|Map|Computer|Typewriter|Locker|House'],
  ['Things that are yellow', 'Banana|Sun|Lemon|Corn|School bus|Taxi|Butter|Duck|Cheese|Sunflower'],
  ['Things in a bathroom', 'Toilet|Sink|Shower|Bath|Towel|Mirror|Soap|Toothbrush|Shampoo|Toilet paper'],
  ['Things you can ride', 'Bike|Horse|Bus|Train|Skateboard|Scooter|Elevator|Rollercoaster|Wave|Camel'],
  ['Jobs in a hospital', 'Doctor|Nurse|Surgeon|Paramedic|Porter|Receptionist|Cleaner|Pharmacist|Midwife|Radiologist'],
  ['Fruits', 'Apple|Banana|Orange|Grape|Strawberry|Pear|Peach|Mango|Pineapple|Watermelon'],
  ['Things in space', 'Stars|Moon|Sun|Planets|Comet|Asteroid|Astronaut|Satellite|Galaxy|Black hole'],
  ['Things that are round', 'Ball|Wheel|Coin|Plate|Clock|Pizza|Orange|Ring|Button|Globe'],
  ['Things in a toolbox', 'Hammer|Screwdriver|Wrench|Nails|Screws|Pliers|Tape measure|Saw|Drill|Level'],
  ['Halloween things', 'Pumpkin|Ghost|Witch|Candy|Costume|Bat|Skeleton|Spider|Mask|Broomstick'],
  ['Things at a wedding', 'Bride|Groom|Cake|Rings|Dress|Flowers|Vows|Dancing|Veil|Toast'],
  ['Things you plug in', 'TV|Lamp|Phone charger|Toaster|Kettle|Computer|Hair dryer|Fridge|Microwave|Vacuum'],
  ['Words before “ball”', 'Basket|Foot|Base|Snow|Volley|Eye|Hand|Meat|Fire|Gum'],
  ['Desserts', 'Cake|Ice cream|Pie|Cookies|Brownies|Pudding|Cheesecake|Donut|Cupcake|Jelly'],
  ['Things that buzz', 'Bee|Alarm|Phone|Doorbell|Mosquito|Fly|Razor|Wasp|Buzzer|Fridge'],
];

export function createGame(settings, players) {
  const g = base(settings, players, { secs: 60, turns: 2 });
  teams(g);
  g.up = 0;
  g.next = [0, 0];       // next guesser turn per team (used to rotate judges)
  g.turnNo = 0;
  startTurn(g);
  return g;
}
export const judge = g => { const m = g.members[1 - g.up]; return m[(g.next[g.up] + g.turnNo) % m.length]; };
function startTurn(g) {
  g.topic = deal(g, 't', TOPICS.length);
  g.found = [];
  g.phase = 'ready';
  g.endAt = 0;
  g.moveId++;
}
export const answers = g => TOPICS[g.topic][1].split('|');
export const collecting = () => false;
export const turnSeat = g => (g.phase === 'ready' || g.phase === 'play' ? judge(g) : -1);
export const current = g => (g.phase === 'ready' || g.phase === 'play' ? judge(g) : -1);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== judge(g)) return 'Only the card-holder can do that';
  if (g.phase === 'ready' && a.type === 'start') {
    g.phase = 'play';
    g.endAt = Date.now() + g.settings.secs * 1000;
    sfx(g, 'thud');
    g.moveId++;
    return null;
  }
  if (g.phase === 'play' && a.type === 'toggle') {
    const i = Number(a.v);
    if (!(i >= 0 && i < 10)) return 'Tap an answer';
    if (g.found.includes(i)) { g.found = g.found.filter(x => x !== i); g.scores[g.up]--; }
    else { g.found.push(i); g.scores[g.up]++; sfx(g, 'ding'); }
    if (g.found.length === 10) { announce(g, seat, 'All ten! 🎉'); end(g); return null; }
    g.moveId++;
    return null;
  }
  if (g.phase === 'play' && a.type === 'done') { end(g); return null; }
  return 'Not now';
}
function end(g) { g.phase = 'end'; g.endAt = 0; g.endShown = Date.now(); sfx(g, 'buzzer'); g.moveId++; }

export function tick(g) {
  if (g.phase === 'play') return { ms: Math.max(0, g.endAt - Date.now()), run: () => end(g) };
  if (g.phase === 'end') return { ms: Math.max(0, g.endShown + 8000 - Date.now()), run: () => {
    g.next[g.up]++;
    g.turnNo++;
    if (g.turnNo >= g.settings.turns * 2) { g.phase = 'over'; g.winner = g.scores[0] === g.scores[1] ? null : g.scores[0] > g.scores[1] ? 0 : 1; g.moveId++; return; }
    g.up = 1 - g.up;
    startTurn(g);
  } };
  return null;
}

export function botAction(g) {
  if (g.phase === 'ready') return { type: 'start' };
  const open = [...Array(10).keys()].filter(i => !g.found.includes(i));
  return Math.random() < 0.15 || !open.length ? { type: 'done' } : { type: 'toggle', v: open[Math.floor(Math.random() * open.length)] };
}

const TEAMS = ['Team Ruby', 'Team Teal'];
export function viewFor(g, seat) {
  const t = g.team[seat], J = judge(g), A = answers(g);
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'play' ? left(g) : 0, teamName: TEAMS[t], myTeam: t, hud: [[TEAMS[t], g.scores[t]], [TEAMS[1 - t], g.scores[1 - t]]] };
  const topic = TOPICS[g.topic][0];
  if (g.phase === 'ready') v.ui = seat === J
    ? { k: 'buttons', key: 'r' + g.turnNo, title: 'You hold the card', sub: `${TEAMS[g.up]} will blurt — tick each answer they say`, myturn: true, buzz: true, card: { kicker: 'Topic', big: topic, small: 'Keep the answers hidden!' }, buttons: [{ type: 'start', label: 'Start the clock', icon: '⏱', go: true, cls: 'pp-huge' }] }
    : { k: 'wait', title: g.up === t ? 'Get ready to BLURT!' : 'Your team holds the card', sub: g.up === t ? 'Shout out everything you can think of' : '', card: { kicker: 'Topic', big: topic } };
  else if (g.phase === 'play') v.ui = seat === J
    ? { k: 'toggles', key: 'p' + g.turnNo, title: topic, sub: 'Tap each one as they say it', myturn: true, options: A.map((x, i) => ({ v: i, label: x, on: g.found.includes(i) })), buttons: [{ type: 'done', label: 'They’re out — end turn' }] }
    : { k: 'wait', title: g.up === t ? 'BLURT IT! 📣' : 'Shhh… they’re blurting', sub: `${g.found.length} of 10 found`, card: { kicker: 'Topic', big: topic } };
  else if (g.phase === 'end') v.ui = { k: 'wait', title: `${g.found.length} of 10!`, sub: `${TEAMS[g.up]} scored ${g.found.length}`, card: { kicker: topic, list: A.map((x, i) => (g.found.includes(i) ? '✓ ' : '· ') + x) } };
  else v.ui = { k: 'wait', title: g.winner == null ? 'A tie!' : g.winner === t ? '🏆 Your team wins!' : `${TEAMS[g.winner]} wins`, sub: 'Look at the table to play again' };
  return v;
}
