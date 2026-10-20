// Si Spice It Up (SPEC.md Section 10.1, CARD_RULES.md Section 6): funnier versions of a player's
// own card idea. "The Si doesn't change your card, it pulls out the flavor."
//
// It runs entirely on the phone (nothing is sent anywhere) and only when the player asks. It
// offers up to 3 versions, each using a different technique and labelled with it; every version
// keeps the player's own idea in it; the player picks one, edits it, or keeps their own.
// Output contract: spiceItUp(text, type, level, deckHeat) -> [{ text, technique, tags }] (0–3 items).
// It never throws: anything unexpected gives an empty list ("Keep mine" only).

export const TECHNIQUES = ['Twist', 'Status flip', 'Scale mismatch', 'Fancy talk', 'Rule-break'];
export const RECIPE_TECHNIQUES = ['Wrong word', 'Role frame', 'Status flip'];

// Words that keep "a"/"an" off the front ("a homework" reads wrong).
const MASS = new Set(['homework', 'music', 'money', 'rain', 'snow', 'glitter', 'slime', 'mud', 'spaghetti', 'cereal', 'pasta', 'bread', 'cheese', 'toast', 'popcorn', 'candy', 'ice cream', 'soup', 'laundry', 'traffic', 'wifi', 'wi-fi', 'furniture', 'luggage', 'grandma', 'grandpa', 'mom', 'dad', 'broccoli', 'lava', 'water', 'chocolate', 'gum', 'bubble gum', 'jelly', 'meatloaf', 'math', 'gym', 'recess', 'school', 'breakfast', 'lunch', 'dinner', 'bedtime']);
const ANIMALS = /\b(dog|cat|puppy|kitten|goat|llama|sloth|raccoon|squirrel|pigeon|goose|duck|chicken|hamster|horse|cow|pig|sheep|bear|lion|tiger|monkey|penguin|giraffe|elephant|fish|goldfish|frog|snake|bird|parrot|owl|bunny|rabbit|mouse|dinosaur|shark|whale|octopus|turtle|crab|bee|ant|worm|spider|unicorn|dragon)s?\b/i;
const FOODS = /\b(pizza|taco|burrito|sandwich|cookie|cake|cupcake|pie|soup|toast|cheese|meatloaf|spaghetti|pasta|noodles?|cereal|pancakes?|waffles?|fries|burger|hot dog|ice cream|candy|broccoli|pickle|banana|apple|carrot|popcorn|donut|bagel|salad|casserole|jelly|chocolate|gum)\b/i;
const PEOPLE = /\b(mom|dad|grandma|grandpa|uncle|aunt|cousin|brother|sister|teacher|principal|coach|boss|baby|kid|friend|neighbor|wizard|pirate|knight|queen|king|ninja|chef|clown|ghost|zombie|vampire|man|woman|guy|girl|boy)s?\b/i;

const clean = t => String(t ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().replace(/[.!?,;:]+$/, '').slice(0, 80);
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

function guessSubject(t) {
  if (ANIMALS.test(t)) return 'animal';
  if (FOODS.test(t)) return 'food';
  if (PEOPLE.test(t)) return 'person';
  return 'thing';
}

// The player's idea, ready to drop into a template: with "a", with "the", bare, and the right
// "who/that" and verb forms ("a dog who thinks…", "socks that cut…").
export function coreOf(text) {
  if (typeof text !== 'string') return null;
  const t = clean(text);
  if (!t) return null;
  const lower = t.toLowerCase();
  const hasLead = /^(a|an|the|my|your|our|his|her|their|this|that|some)\s/i.test(t) || /'s\b/.test(t);
  const bare = t.replace(/^(a|an|the)\s+/i, '');
  // Starts with a name: "Grandma", "Uncle Bob dancing".
  const named = /^[A-Z][a-z]+(\s[A-Z][a-z]+)*\b/.test(t) && !/^(The|A|An|My|Your|Our|Some|This|That)\b/.test(t);
  // The head noun decides plural: the last word before any "at/in/with…" ("things at a wedding").
  const head = (bare.split(/\s(?:at|in|on|of|with|for|from|to|during|who|that|and)\s/i)[0].split(' ').pop() || '').toLowerCase();
  const plural = /[^s]s$/.test(head) && !/(ss|us|is)$/.test(head);
  const mass = MASS.has(lower);
  let a;
  if (hasLead || named) a = t;
  else if (plural || mass) a = bare;
  else a = (/^[aeiou]/i.test(bare) ? 'an ' : 'a ') + bare;
  const the = hasLead || named ? t : mass ? bare : 'the ' + bare;
  const subject = guessSubject(t);
  const living = named || /^(person|animal)$/.test(subject);
  return {
    text: t, bare, a, the, plural, named, mass, lead: hasLead || named,
    they: plural || named || subject === 'person' ? "they're" : "it's",
    rel: living ? 'who' : 'that',
    v: (one, many) => (plural ? many : one),
  };
}

// Each technique: templates (Mild ones for every level, more for Medium and Hot), and the tags
// it adds. All of them are family-friendly at every level.
const ING = {
  'Twist': {
    mild: [c => `${c.a} ${c.rel} ${c.v('is', 'are')} scared of everything`, c => `${c.a} with the hiccups`, c => `${c.a} ${c.rel} only ${c.v('speaks', 'speak')} in whispers`],
    more: [c => `${c.a} with a secret double life`, c => `${c.a} ${c.rel} ${c.v('is', 'are')} allergic to fun`, c => `${c.a} ${c.rel} ${c.v('refuses', 'refuse')} to be photographed`],
    tags: { tone: ['absurd'], violation: ['logic'] },
  },
  'Status flip': {
    mild: [c => `${c.a} ${c.rel} ${c.v('thinks', 'think')} ${c.they} the mayor`, c => `${c.a}, wearing a crown`, c => `${c.a} in charge of recess`],
    more: [c => `${c.a}, head of security`, c => `${c.a} ${c.rel} ${c.v('runs', 'run')} the whole school`, c => `${c.a} with a fancy business card`],
    tags: { tone: ['silly'], register: ['official_sounding'], violation: ['logic'], status: ['high'] },
  },
  'Scale mismatch': {
    mild: [c => `${c.a} the size of a school bus`, c => (c.lead ? `${c.a}, shrunk to the size of a bean` : c.a === c.bare ? `tiny ${c.bare}` : `a tiny, tiny ${c.bare}`), c => `${c.a} as big as a mountain`],
    more: [c => `${c.a} the size of a parking garage`, c => `${c.a}, visible from space`, c => `${c.a} ${c.rel} ${c.v('fits', 'fit')} in a teaspoon`],
    tags: { tone: ['absurd'], scale: ['huge'], violation: ['physical'] },
  },
  'Fancy talk': {
    mild: [c => `${c.a} in a top hat`, c => `${c.a} at a fancy tea party`, c => `${c.a} with perfect manners`],
    more: [c => `${c.a}, signed and notarized`, c => `${c.a} in a three-piece suit`, c => `the official ${c.bare} rulebook`],
    tags: { tone: ['dry'], register: ['fancy'], violation: ['social'] },
  },
  'Rule-break': {
    mild: [c => `${c.a} ${c.rel} ${c.v('cuts', 'cut')} in line`, c => `${c.a} ${c.rel} won't share`, c => `${c.a} ${c.rel} ${c.v('talks', 'talk')} during the movie`],
    more: [c => `${c.a} ${c.rel} ${c.v('demands', 'demand')} a tip`, c => `${c.a} ${c.rel} ${c.v('replies', 'reply')}-all to everything`, c => `${c.a} ${c.rel} ${c.v('shows', 'show')} up uninvited`],
    tags: { tone: ['awkward'], violation: ['social'] },
  },
};
// Recipe ideas are often a topic ("things at a wedding"), so these frames wrap the whole idea.
const REC = {
  'Wrong word': { all: [c => `the worst ${c.bare}`, c => `the most useless ${c.bare}`, c => `the most suspicious ${c.bare}`], tags: { tone: ['dry'] } },
  'Role frame': { all: [c => `a terrible new name for ${c.bare}`, c => `the award for the best ${c.bare}`, c => `a rejected theme for ${c.bare}`], tags: { register: ['casual'] } },
  'Status flip': { all: [c => `what ${c.bare} ${c.v('is', 'are')} secretly planning`, c => `if ${c.bare} ran the world`, c => `the official rules for ${c.bare}`], tags: { register: ['official_sounding'] } },
};
// A Recipe idea that's already a whole prompt ("The worst thing to say at prom") keeps every word;
// these add a twist after it instead.
const PROMPT = {
  'Wrong word': { all: [t => `${t}, but on the moon`, t => `${t}, in total silence`, t => `${t}, at a fancy wedding`], tags: { tone: ['dry'] } },
  'Role frame': { all: [t => `${t}, according to Grandma`, t => `${t}, according to your dog`, t => `${t}, according to a pirate`], tags: { register: ['casual'] } },
  'Status flip': { all: [t => `${t}, if you ran the school`, t => `${t}, by royal order`, t => `${t}, if the principal did it`], tags: { register: ['official_sounding'] } },
};
const isPrompt = t => /^(the|what|why|how|who|where|when|if|your|my|a|an)\b/i.test(t) && t.split(/\s+/).length >= 4;

function tagsFor(core, extra, type) {
  const tags = {
    subject: [type === 'recipe' ? 'event' : guessSubject(core.text)], tone: ['silly'], scale: ['everyday'],
    register: ['casual'], violation: ['none'], status: [type === 'recipe' ? 'neutral' : 'low'],
  };
  for (const [axis, v] of Object.entries(extra || {})) tags[axis] = (type === 'recipe' && axis === 'status' ? ['neutral'] : v).slice(0, 2);
  return tags;
}

/**
 * @param text     the player's idea, e.g. "a dog"
 * @param type     'ingredient' | 'recipe'
 * @param level    'mild' | 'medium' | 'hot' (Mild gets the simplest wording)
 * @param deckHeat null, or 'hot' | 'hellfire' for the player's own opted-in deck. Unused on
 *                 purpose: the Si never raises heat, and every template is family-friendly.
 * @param rng      random source (for tests)
 */
export function spiceItUp(text, type = 'ingredient', level = 'mild', deckHeat = null, rng = Math.random, n = 3) {
  try {
    const core = coreOf(text);
    if (!core || core.bare.length < 2) return [];
    const whole = type === 'recipe' && isPrompt(core.text);
    const book = type === 'recipe' ? (whole ? PROMPT : REC) : ING;
    const names = Object.keys(book);
    // Shuffle the techniques so each tap can offer a different mix.
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    const want = Math.max(0, Math.min(3, n));
    const out = [];
    for (const technique of names) {
      if (out.length >= want) break;
      const T = book[technique];
      const pool = type === 'recipe' ? T.all : level === 'mild' ? T.mild : [...T.mild, ...T.more];
      const made = cap(clean(pool[Math.floor(rng() * pool.length)](whole ? core.text.replace(/[?.!]+$/, '') : core)));
      // Every version keeps the player's idea, and actually changes it.
      if (!made.toLowerCase().includes(core.bare.toLowerCase()) || made.toLowerCase() === core.text.toLowerCase()) continue;
      out.push({ text: made.slice(0, 120), technique, tags: tagsFor(core, T.tags, type) });
    }
    return out;
  } catch { return []; }
}
