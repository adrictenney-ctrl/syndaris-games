// Hard Sell: a party game of ridiculous inventions. Each round one player is the Customer and
// turns over who they are today ("a Pirate", "a Retired Astronaut"). Everyone else picks two
// word cards from their hand to make a product ("Bacon" + "Umbrella"), then pitches it out
// loud. The Customer buys the one they like best; that seller keeps the Customer card as a
// point. Everyone gets a turn as the Customer; most sales wins. Runs only on the table (host).

export const WORDS = `bacon umbrella laser pillow helmet rocket toaster sock ladder mirror blender jetpack hammock wig balloon cannon
banana sword tent trampoline glitter magnet parachute robot sandwich tuba kite shovel snorkel canoe chainsaw cupcake
fridge piano scooter wallet lasso whistle hat cape spoon blanket tractor submarine pancake bucket lamp camera goggles
drum crayon saddle beard muffin sprinkler pogo-stick slingshot telescope harmonica blimp igloo hose spatula duck
pickle trumpet microwave mop gravy noodle marshmallow cheese llama sticker yo-yo fork glove backpack radar boomerang
catapult stilts feather sofa jelly bubble disco slipper bathtub chalk flamingo pretzel saxophone volcano zipper
bowling-ball cactus pizza vacuum hammer accordion karaoke crown periscope thermos ninja ghost pirate wizard dragon
cowboy unicorn hamster goldfish parrot squirrel penguin gorilla octopus bee goat raccoon tiger moose sloth snail
turbo mini mega smart solar inflatable invisible glow-in-the-dark heated talking flying edible portable vintage
luxury waterproof self-driving musical magnetic folding haunted golden emergency silent rocket-powered tiny giant
diet organic royal fake extreme pocket wooden fuzzy spicy frozen sparkly bulletproof wireless underwater family
baby grandpa grandma office party camping beach space jungle midnight morning weekend holiday birthday wedding
romance gym spa nap snack lunch dance yoga sleepover detective spy secret mystery nacho butter chocolate coffee
tea soup taco burrito waffle donut lemonade popcorn sushi curry honey jam garlic onion carrot broccoli potato
alarm clock calendar map compass key lock chain rope tape glue string button pocket belt scarf tie apron
mittens earmuffs sunglasses poncho tutu kilt onesie tuxedo pajamas diaper bib leash collar saddlebag cart
wagon sled skateboard unicycle tricycle hovercraft bus train elevator escalator bridge tunnel castle tower
fort treehouse doghouse bunker lighthouse windmill fountain pool hot-tub sauna jacuzzi fireplace chimney
garden hedge fence mailbox doorbell welcome-mat chandelier disco-ball fog-machine bubble-wrap confetti
fireworks smoke-bomb siren megaphone microphone podcast app subscription coupon hotline butler`.split(/\s+/).map(w => w.replace(/-/g, ' '));

export const CUSTOMERS = ['a Pirate', 'a Caveman', 'a Retired Astronaut', 'a Zombie', 'a Grandma', 'a Toddler', 'a Rock Star',
  'a Vampire', 'a Ghost', 'a Wizard', 'a Lumberjack', 'a Ninja', 'a Mermaid', 'a Superhero', 'a Cowboy', 'a Robot',
  'a Dragon', 'a Ballerina', 'a Sumo Wrestler', 'a Teenager', 'a Librarian', 'a Lifeguard', 'a Clown', 'a Mad Scientist',
  'a Pharaoh', 'a Knight', 'a Yeti', 'an Alien Tourist', 'a Gym Coach', 'a Chef', 'a Detective', 'a Spy', 'a Farmer',
  'a Plumber', 'a Dentist', 'a Rapper', 'a Mime', 'a Monk', 'a Queen', 'a Baby', 'a Dog', 'a Cat', 'a Goldfish',
  'a Snowman', 'a Scarecrow', 'a Werewolf', 'a Surfer', 'a Tax Inspector', 'a Wedding Planner', 'a Magician',
  'a Mountain Climber', 'a Pilot', 'a Night-Shift Nurse', 'an Opera Singer', 'a Hermit', 'a Billionaire', 'a Time Traveller',
  'a Lighthouse Keeper', 'a Beekeeper', 'a Park Ranger', 'a Fortune Teller', 'a Movie Star', 'a Pizza Delivery Driver',
  'a Bride', 'a Groom', 'a Kindergarten Teacher', 'a Bodybuilder', 'a Gamer', 'a Lion Tamer', 'a Penguin', 'a Garden Gnome'];
export const HAND = 6;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createGame(settings, players) {
  const g = { settings: { rounds: 1, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.deck = shuffle(WORDS.map((_, i) => i));
  g.discard = [];
  g.people = shuffle(CUSTOMERS.slice());
  g.hands = g.seats.map(() => []);
  for (const s of g.order) g.hands[s] = g.deck.splice(0, HAND);
  g.scores = g.seats.map(() => 0);
  g.sold = g.seats.map(() => []);      // the customers each player has sold to
  g.round = 0;
  g.total = g.order.length * g.settings.rounds;
  g.custIdx = Math.floor(Math.random() * g.order.length) - 1;
  g.winners = [];
  startRound(g);
  return g;
}

const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const sellers = g => g.order.filter(s => s !== g.customer);

function startRound(g) {
  g.round++;
  g.custIdx = (g.custIdx + 1) % g.order.length;
  g.customer = g.order[g.custIdx];
  if (!g.people.length) g.people = shuffle(CUSTOMERS.slice());
  g.who = g.people.pop();
  g.redrawn = false;
  g.picks = g.seats.map(() => null);
  g.phase = 'build';
  g.pitchIdx = 0;
  g.won = null;
  g.moveId++;
}

function draw(g) {
  if (!g.deck.length) { g.deck = shuffle(g.discard); g.discard = []; }
  return g.deck.pop();
}

export function current(g) { return g.phase === 'pitch' ? g.customer : -1; }

function openShop(g) {
  g.phase = 'pitch';
  g.pitchIdx = 0;
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'over') return 'The game is over';
  if (!g.order.includes(seat)) return "You're not playing";
  const isCust = seat === g.customer;
  if (a.type === 'redraw') {
    if (!isCust || g.phase !== 'build') return 'Only the Customer can do that';
    if (g.redrawn) return 'You already changed who you are';
    if (!g.people.length) g.people = shuffle(CUSTOMERS.slice());
    g.who = g.people.pop();
    g.redrawn = true;
    g.moveId++;
    return null;
  }
  if (a.type === 'pick') {
    if (isCust) return "You're the Customer this round";
    if (g.phase !== 'build') return 'The pitches have started';
    const w = (a.words || []).map(Number);
    if (w.length !== 2 || w[0] === w[1] || !w.every(x => g.hands[seat].includes(x))) return 'Pick two of your words';
    g.picks[seat] = w;
    g.moveId++;
    if (sellers(g).every(s => g.picks[s])) openShop(g);
    return null;
  }
  if (a.type === 'unpick') {
    if (g.phase !== 'build' || !g.picks[seat]) return 'Nothing to change';
    g.picks[seat] = null;
    g.moveId++;
    return null;
  }
  if (a.type === 'open') {
    // The Customer can start without someone who's taking forever (needs at least two products).
    if (!isCust || g.phase !== 'build') return 'Only the Customer can open the shop';
    if (sellers(g).filter(s => g.picks[s]).length < Math.min(2, sellers(g).length)) return 'Wait for at least two products';
    openShop(g);
    return null;
  }
  if (a.type === 'next') {
    if (!isCust || g.phase !== 'pitch') return 'Not now';
    const n = pitchers(g).length;
    g.pitchIdx = Math.min(n, g.pitchIdx + 1);
    g.moveId++;
    return null;
  }
  if (a.type === 'buy') {
    if (!isCust || g.phase !== 'pitch') return 'Only the Customer buys';
    if (!pitchers(g).includes(a.seat)) return 'Pick one of the products';
    if (g.pitchIdx < pitchers(g).length - 1) return 'Hear every pitch first';
    g.scores[a.seat]++;
    g.sold[a.seat].push(g.who);
    g.won = { seat: a.seat, words: g.picks[a.seat], who: g.who };
    announce(g, a.seat, 'SOLD! 💰');
    // Used words go away; everyone who played refills.
    for (const s of pitchers(g)) {
      for (const w of g.picks[s]) { g.hands[s].splice(g.hands[s].indexOf(w), 1); g.discard.push(w); }
      while (g.hands[s].length < HAND) g.hands[s].push(draw(g));
    }
    g.phase = 'won';
    g.wonAt = Date.now();
    g.moveId++;
    if (g.round >= g.total) {
      const top = Math.max(...g.order.map(s => g.scores[s]));
      g.winners = g.order.filter(s => g.scores[s] === top);
      g.phase = 'over';
    }
    return null;
  }
  return "That move isn't allowed";
}

// Sellers whose products are on the shelf, in pitching order (starting left of the Customer).
export function pitchers(g) {
  const i = g.order.indexOf(g.customer);
  return [...g.order.slice(i + 1), ...g.order.slice(0, i)].filter(s => g.picks[s]);
}

export function tick(g) {
  if (g.phase !== 'won') return null;
  return { ms: Math.max(0, g.wonAt + 6500 - Date.now()), run: () => startRound(g) };
}

export const botAction = () => null;

export function viewFor(g, seat) {
  const show = g.phase !== 'build';
  return {
    phase: g.phase, round: g.round, total: g.total, order: g.order, customer: g.customer, who: g.who, redrawn: g.redrawn,
    scores: g.scores, hand: (g.hands[seat] || []).map(i => ({ i, w: WORDS[i] })), mine: g.picks[seat],
    ready: g.picks.map(Boolean), pitchers: show ? pitchers(g) : [], pitchIdx: g.pitchIdx,
    products: g.picks.map((p, s) => (p && (show || s === seat) ? p.map(i => WORDS[i]) : null)),
    won: g.won && { ...g.won, words: g.won.words.map(i => WORDS[i]) }, winners: g.winners, moveId: g.moveId,
  };
}
