// Odd One Out: the table shows a topic and 16 words. Everyone's phone shows which word is the
// secret one — except one player, the Odd One Out, who has no idea. Going around the table,
// everyone types ONE word as a clue (subtle enough not to give it away to the Odd One). Then
// everybody votes on who the Odd One is. Catch them and they get one guess at the secret word;
// if they're wrong, everyone else scores. Escape (or guess it) and the Odd One scores.
import { base, shuffle, pick, deal, cleanText, sfx, left, announce, waiting, finish } from './party.js?v=67';

export const TOPICS = [
  ['Food', 'Pizza|Burger|Sushi|Pasta|Tacos|Salad|Soup|Steak|Curry|Pancakes|Sandwich|Hot dog|Noodles|Burrito|Omelette|Lasagne'],
  ['Animals', 'Lion|Elephant|Penguin|Giraffe|Shark|Eagle|Kangaroo|Snake|Monkey|Dolphin|Owl|Zebra|Frog|Bear|Camel|Octopus'],
  ['Jobs', 'Doctor|Teacher|Pilot|Chef|Farmer|Firefighter|Dentist|Lawyer|Plumber|Artist|Astronaut|Police officer|Nurse|Builder|Scientist|Waiter'],
  ['Sports', 'Soccer|Tennis|Golf|Boxing|Swimming|Skiing|Baseball|Basketball|Cycling|Surfing|Karate|Hockey|Bowling|Rugby|Volleyball|Archery'],
  ['Places', 'Beach|Hospital|School|Airport|Library|Zoo|Cinema|Museum|Casino|Gym|Prison|Church|Farm|Castle|Supermarket|Space station'],
  ['Weather', 'Rain|Snow|Hail|Fog|Thunder|Lightning|Tornado|Hurricane|Sunshine|Rainbow|Drizzle|Heatwave|Frost|Wind|Blizzard|Cloud'],
  ['Instruments', 'Piano|Guitar|Drums|Violin|Trumpet|Flute|Harp|Saxophone|Cello|Banjo|Accordion|Tuba|Ukulele|Harmonica|Clarinet|Xylophone'],
  ['In the house', 'Sofa|Bed|Fridge|Lamp|Toilet|Bath|Oven|Mirror|Carpet|Curtains|Television|Wardrobe|Stairs|Fireplace|Doorbell|Dishwasher'],
  ['Fairy tales', 'Cinderella|Snow White|Rapunzel|Pinocchio|Peter Pan|Hansel|Goldilocks|Little Red Riding Hood|Jack|Rumpelstiltskin|Sleeping Beauty|The Frog Prince|Aladdin|The Little Mermaid|Thumbelina|The Gingerbread Man'],
  ['Transport', 'Car|Bus|Train|Bicycle|Plane|Helicopter|Boat|Submarine|Rocket|Skateboard|Taxi|Tram|Scooter|Hot air balloon|Horse|Tractor'],
  ['Clothes', 'Hat|Scarf|Gloves|Jeans|Dress|Shorts|Socks|Boots|Jacket|Pyjamas|Tie|Swimsuit|Hoodie|Skirt|Sandals|Raincoat'],
  ['Holidays', 'Christmas|Halloween|Easter|New Year|Birthday|Valentine’s Day|Thanksgiving|Wedding|Graduation|Baby shower|Anniversary|Mother’s Day|Fourth of July|Hanukkah|Diwali|Lunar New Year'],
  ['Desserts', 'Cake|Ice cream|Cookie|Brownie|Pie|Donut|Cupcake|Pudding|Cheesecake|Jelly|Muffin|Waffle|Tiramisu|Pancake|Macaron|Fudge'],
  ['Body', 'Nose|Ear|Elbow|Knee|Toe|Tongue|Heart|Brain|Shoulder|Ankle|Belly button|Eyebrow|Thumb|Lungs|Hair|Teeth'],
  ['School', 'Homework|Exam|Recess|Teacher|Backpack|Lunchbox|Pencil|Detention|Library|Gym class|Field trip|Principal|Locker|Chalkboard|Report card|School bus'],
  ['Fantasy', 'Dragon|Unicorn|Wizard|Elf|Troll|Mermaid|Vampire|Ghost|Giant|Fairy|Witch|Werewolf|Goblin|Phoenix|Zombie|Genie'],
  ['Kitchen', 'Spoon|Fork|Knife|Pan|Kettle|Toaster|Blender|Microwave|Whisk|Plate|Bowl|Cup|Chopping board|Oven mitt|Grater|Rolling pin'],
  ['Hobbies', 'Reading|Gardening|Fishing|Painting|Knitting|Cooking|Dancing|Hiking|Camping|Photography|Gaming|Singing|Baking|Chess|Yoga|Skateboarding'],
  ['Countries', 'France|Japan|Brazil|Egypt|India|Canada|Mexico|Italy|Australia|China|Spain|Germany|Greece|Kenya|Russia|Ireland'],
  ['At the beach', 'Sandcastle|Seagull|Sunscreen|Towel|Umbrella|Shell|Crab|Wave|Surfboard|Lifeguard|Ice cream|Bucket|Sunglasses|Pier|Jellyfish|Flip-flops'],
  ['Things with buttons', 'Phone|Remote|Calculator|Keyboard|Elevator|Doorbell|Microwave|Coat|Shirt|Game controller|Camera|Car radio|Vending machine|Washing machine|Mouse|Jukebox'],
  ['Fruit', 'Apple|Banana|Orange|Grape|Strawberry|Mango|Pineapple|Watermelon|Cherry|Peach|Lemon|Kiwi|Coconut|Pear|Plum|Blueberry'],
];

export function createGame(settings, players) {
  const g = base(settings, players, { rounds: 0, secs: 45 });
  g.rounds = g.settings.rounds || g.order.length;
  g.round = 0;
  startRound(g);
  return g;
}
function startRound(g) {
  g.round++;
  g.topic = deal(g, 't', TOPICS.length);
  g.word = Math.floor(Math.random() * 16);
  g.odd = pick(g.order);
  g.first = (g.round - 1) % g.order.length;
  g.clues = {};
  g.ci = 0;
  g.votes = {};
  g.done = {};
  g.phase = 'peek';
  g.endAt = 0;
  g.peekAt = Date.now();
  g.moveId++;
}
export const words = g => TOPICS[g.topic][1].split('|');
const clueSeat = g => g.order[(g.first + g.ci) % g.order.length];
export const collecting = g => g.phase === 'vote';
export const turnSeat = g => (g.phase === 'clue' ? clueSeat(g) : g.phase === 'guess' ? g.odd : -1);
export const current = g => (g.phase === 'clue' ? clueSeat(g) : g.phase === 'vote' ? waiting(g)[0] ?? -1 : g.phase === 'guess' ? g.odd : -1);

function nextClue(g) {
  g.ci++;
  if (g.ci >= g.order.length) { g.phase = 'vote'; g.done = {}; g.endAt = Date.now() + 60000; }
  else g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}
function count(g) {
  const tally = {};
  for (const v of Object.values(g.votes)) tally[v] = (tally[v] || 0) + 1;
  const top = Math.max(0, ...Object.values(tally));
  const most = Object.keys(tally).filter(k => tally[k] === top).map(Number);
  g.tally = tally;
  g.accused = most.length === 1 ? most[0] : -1;
  if (g.accused === g.odd) { g.phase = 'guess'; g.endAt = Date.now() + 30000; sfx(g, 'ding'); announce(g, g.odd, 'Caught! 🕵️'); g.moveId++; }
  else end(g, 'escaped');
}
function end(g, how) {
  g.how = how;
  if (how === 'escaped') { g.score[g.odd] += 2; sfx(g, 'sad'); }
  else if (how === 'guessed') { g.score[g.odd] += 1; sfx(g, 'sad'); }
  else { for (const s of g.order) if (s !== g.odd) g.score[s] += 1; sfx(g, 'chime'); }
  g.phase = 'result';
  g.endAt = 0;
  g.resAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'clue' && a.type === 'answer') {
    if (seat !== clueSeat(g)) return 'Wait for your turn to give a clue';
    const t = cleanText((a.vals || [])[0], 24);
    if (!t) return 'Type a clue';
    if (t.toLowerCase() === words(g)[g.word].toLowerCase()) return 'You can’t say the word itself!';
    g.clues[seat] = t;
    nextClue(g);
    return null;
  }
  if (g.phase === 'vote' && a.type === 'pick') {
    if (g.done[seat]) return 'Already voted';
    const s = Number(a.v);
    if (!g.order.includes(s) || s === seat) return 'Vote for someone else';
    g.votes[seat] = s;
    g.done[seat] = true;
    if (!waiting(g).length) count(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'guess' && a.type === 'pick') {
    if (seat !== g.odd) return 'Only the Odd One Out guesses';
    g.guess = Number(a.v);
    end(g, g.guess === g.word ? 'guessed' : 'caught');
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'peek') return { ms: Math.max(0, g.peekAt + 6000 - Date.now()), run: () => { g.phase = 'clue'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; } };
  if (g.phase === 'clue') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => { g.clues[clueSeat(g)] = '…'; nextClue(g); } };
  if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => count(g) };
  if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => { g.guess = -1; end(g, 'caught'); } };
  if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 9000 - Date.now()), run: () => (g.round >= g.rounds ? finish(g) : startRound(g)) };
  return null;
}

export function botAction(g, seat) {
  if (g.phase === 'clue') return { type: 'answer', vals: [seat === g.odd ? 'Hmm' : `${words(g)[g.word].slice(0, 2)}ish`] };
  if (g.phase === 'vote') { const o = g.order.filter(s => s !== seat); return { type: 'pick', v: Math.random() < 0.5 && seat !== g.odd ? g.odd : o[Math.floor(Math.random() * o.length)] }; }
  if (g.phase === 'guess') return { type: 'pick', v: Math.floor(Math.random() * 16) };
  return null;
}

export function viewFor(g, seat) {
  const odd = seat === g.odd, W = words(g);
  const card = odd ? { kicker: TOPICS[g.topic][0], big: 'You’re the Odd One Out', small: 'Blend in — work out the word from the clues', cls: 'oo-odd' } : { kicker: TOPICS[g.topic][0], big: W[g.word], small: 'The secret word — don’t make it too obvious' };
  const v = { phase: g.phase, moveId: g.moveId, left: (g.phase === 'clue' && clueSeat(g) === seat) || g.phase === 'vote' || (g.phase === 'guess' && odd) ? left(g) : 0, hud: [['Score', g.score[seat] ?? 0], ['Round', `${g.round}/${g.rounds}`]] };
  if (g.phase === 'peek') v.ui = { k: 'wait', title: odd ? '🤫 You’re the Odd One Out' : 'Remember the word', sub: odd ? 'Nobody knows — yet' : 'One of you doesn’t know it…', card, buzz: true, key: 'pk' + g.round };
  else if (g.phase === 'clue') v.ui = clueSeat(g) === seat
    ? { k: 'fields', key: `c${g.round}:${g.ci}`, title: 'Your clue', sub: 'One word, related to the secret word', myturn: true, buzz: true, card, fields: [{ ph: 'One word…', max: 24 }], submit: 'Give clue', need: 1 }
    : { k: 'wait', title: 'Clues going around', sub: 'Who sounds like they don’t know it?', card };
  else if (g.phase === 'vote') v.ui = g.done[seat]
    ? { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g).length} more…`, card }
    : { k: 'pick', key: 'v' + g.round, title: 'Who’s the Odd One Out?', sub: 'Most votes gets caught', myturn: true, card,
      options: g.order.filter(s => s !== seat).map(s => ({ v: s, dot: s, label: `@${s}@`, sub: `clue: ${g.clues[s] || '—'}` })) };
  else if (g.phase === 'guess') v.ui = odd
    ? { k: 'pick', key: 'g' + g.round, title: 'Caught! Guess the word', sub: 'Get it right and you still score', myturn: true, buzz: true, grid: 2, options: W.map((w, i) => ({ v: i, label: w })) }
    : { k: 'wait', title: 'Caught them!', sub: 'Now they get one guess at the word…', card };
  else if (g.phase === 'result') v.ui = { k: 'wait', title: g.how === 'escaped' ? (odd ? 'You got away! +2' : 'They got away!') : g.how === 'guessed' ? (odd ? 'Caught, but you guessed it! +1' : 'They guessed the word!') : odd ? 'Caught! 😬' : 'Got them! +1', sub: `The word was ${W[g.word]}` };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
