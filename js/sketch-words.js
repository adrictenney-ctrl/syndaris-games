// Words for Sketch & Guess, sorted by how hard they are to draw.
export const WORDS = {
  easy: `apple banana sun moon star tree house car boat fish cat dog bird snake spider ice cream cake pizza
    hat shoe sock glasses key door window chair bed lamp clock phone book pencil cup
    flower cloud rain snowman heart smile ball kite balloon rainbow egg cookie cheese carrot
    eye nose hand foot ear tooth bone ghost robot rocket train bus bike truck plane
    umbrella candle duck pig cow horse frog turtle bee butterfly snail whale octopus crab
    mushroom cactus leaf volcano mountain island bridge castle tent ladder hammer scissors
    sword crown ring guitar drum bell gift starfish worm lollipop donut burger hot dog
    toothbrush broom bucket table fork spoon bowl bottle sandwich teapot pumpkin anchor`,
  medium: `giraffe elephant penguin kangaroo dinosaur dragon unicorn mermaid pirate wizard ninja
    astronaut vampire zombie skeleton scarecrow lighthouse windmill waterfall igloo pyramid
    campfire treasure map compass telescope microscope magnet battery light bulb rollercoaster
    ferris wheel skateboard surfboard parachute helicopter submarine hot air balloon tractor
    fire truck ambulance traffic light mailbox backpack wheelchair trophy medal crayon
    paintbrush camera television headphones microphone keyboard computer joystick
    sandcastle seesaw swing slide trampoline hammock fireworks birthday party wedding
    haircut sneeze yawn juggling fishing camping bowling snowball sunburn spaghetti
    popcorn pancakes taco sushi watermelon pineapple strawberry peanut coconut
    flamingo peacock porcupine jellyfish shark seahorse squirrel hedgehog owl bat
    tornado lightning earthquake desert jungle swamp cave ocean river planet`,
  hard: `gravity echo shadow reflection invisible upside down time travel daydream nightmare
    homework traffic jam rush hour lost luggage alarm clock bad hair day brain freeze
    double rainbow full moon solar eclipse black hole tug of war hide and seek musical chairs
    sleepwalking stage fright hiccups jet lag déjà vu wishful thinking cold feet
    piggyback ride photo bomb selfie stick group hug high five thumb war pillow fight
    marathon tightrope ventriloquist magician detective archaeologist lifeguard referee
    constellation evolution recycling democracy hibernation migration photosynthesis
    snow day spring cleaning first date surprise party garage sale road trip
    beach volleyball chain reaction domino effect butterfly effect needle in a haystack
    elephant in the room raining cats and dogs piece of cake`,
};

// The lists above are split on spaces, so phrases that belong together are listed here.
const MULTI = new Set([
  'ice cream', 'hot dog', 'treasure map', 'light bulb', 'ferris wheel', 'hot air balloon', 'fire truck', 'traffic light',
  'birthday party', 'upside down', 'time travel', 'traffic jam', 'rush hour', 'lost luggage', 'alarm clock', 'bad hair day',
  'brain freeze', 'double rainbow', 'full moon', 'solar eclipse', 'black hole', 'tug of war', 'hide and seek',
  'musical chairs', 'stage fright', 'jet lag', 'déjà vu', 'wishful thinking', 'cold feet', 'piggyback ride', 'photo bomb',
  'selfie stick', 'group hug', 'high five', 'thumb war', 'pillow fight', 'snow day', 'spring cleaning', 'first date',
  'surprise party', 'garage sale', 'road trip', 'beach volleyball', 'chain reaction', 'domino effect', 'butterfly effect',
  'needle in a haystack', 'elephant in the room', 'raining cats and dogs', 'piece of cake',
]);

function split(text) {
  let s = ' ' + text.replace(/\s+/g, ' ').trim() + ' ';
  const out = [];
  // Longest phrases first so "hot air balloon" wins over "balloon".
  for (const m of [...MULTI].sort((a, b) => b.length - a.length)) {
    const k = ' ' + m + ' ';
    if (s.includes(k)) { out.push(m); s = s.split(k).join(' '); }
  }
  for (const w of s.trim().split(' ')) if (w && !out.includes(w)) out.push(w);
  return out;
}

export const LISTS = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [k, split(v)]));
