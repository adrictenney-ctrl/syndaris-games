// The Laugh Engine for Chef's Kiss Party Game (Master Plan, Section 7). It only HELPS:
//  • Funny Pairing Radar: ranks the Ingredient Cards in a player's hand by how funny they are
//    WITH the current Recipe Card, so the phone can highlight the top 2–3.
//  • "Make me a card": 3 short, family-friendly, funny card ideas for the current Recipe Card.
// It never plays a card and never picks the winner. The game never waits on it: every call has
// a 3-second timeout, and any failure (missing, slow or broken backend) quietly returns nothing,
// so the round carries on with no highlights.
//
// Backends share one small interface, so a real on-device model (e.g. Gemma) can be plugged in
// later with setLaughBackend():
//   { name, rank(recipe, cards) → Promise<number[]> (a score per card),
//     suggest(recipe, n, avoid) → Promise<string[]> }
// Until then the local scorer below does the job with no downloads at all.

export const TIMEOUT_MS = 3000;

// ---------------------------------------------------------------- safety net

// Resolve with the value, or with `fallback` if it fails or takes longer than the timeout.
export function withTimeout(work, ms = TIMEOUT_MS, fallback = null) {
  return new Promise(resolve => {
    let done = false;
    const finish = v => { if (!done) { done = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => finish(fallback), ms);
    try { Promise.resolve(typeof work === 'function' ? work() : work).then(finish, () => finish(fallback)); } catch { finish(fallback); }
  });
}

// ---------------------------------------------------------------- words and themes

const STOP = new Set('a an the and or of to in on at for with my your our their his her its is are was be i you we they it this that what why who where when how me do does did not no so up out by from as into than then just very really most best worst new first next one some any all thing things something someone'.split(' '));
const stem = w => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '').replace(/(.)\1$/, '$1');
export const words = t => String(t || '').toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)).map(stem);

// Themes: a pairing is funnier when the card plays into (or hilariously against) the Recipe Card.
const THEMES = {
  food: 'food eat pizza sauce cheese ice cream cake picnic lunch dinner breakfast soup taco burger spaghetti cookie snack flavor recipe chef kitchen sandwich pickle sprinkle donut pie fridge cook meal hungry bake jelly banana carrot meatball',
  animal: 'dog cat goat raccoon pigeon llama sloth penguin squirrel hamster horse dinosaur shark frog monkey unicorn dragon kitten puppy skunk giraffe octopus animal pet bird fish cow chicken duck bear snake mouse spider bee creature',
  scary: 'zombie villain monster ghost haunt scary fear nightmare dark evil apocalypse spooky vampire witch creepy undead scream',
  love: 'marriage date love romantic wedding valentine kiss heart crush boyfriend girlfriend proposal',
  work: 'job interview boss work office monday meet late excuse coworker paycheck deadline email',
  school: 'teacher school homework class substitute project library test principal recess lunchbox',
  family: 'grandma grandpa uncle aunt mom dad brother sister family baby toddler cousin parent kid',
  money: 'million dollar rich money lottery gift buy price shop sale wallet treasure',
  sleep: 'sleep asleep bed pajama nap woke tired snore pillow dream blanket',
  sport: 'olympic sport race game team ball win medal coach gym workout marathon',
  music: 'karaoke sing choir music band dance song disco concert',
  tech: 'phone autocorrect gps robot online influencer unbox computer vacuum app video internet text selfie',
  travel: 'island boat vacation trip ride park scooter hoverboard car plane train beach camp',
  silly: 'clown whoopee hiccup sock pajama tutu wig banana slime burp tickle giggle silly goofy prank costume underwear noodle',
  fantasy: 'wizard magic unicorn dragon alien space pirate ninja viking bigfoot loch ness mermaid fairy superhero spell',
  home: 'closet drawer junk bag fridge couch bathroom house garage attic basement toilet laundry',
  royal: 'king queen prince princess castle crown royal knight throne',
};
const THEME_OF = new Map();
for (const [t, list] of Object.entries(THEMES)) for (const w of list.split(' ')) THEME_OF.set(stem(w), [...(THEME_OF.get(stem(w)) || []), t]);
const themesOf = ws => { const s = new Set(); for (const w of ws) for (const t of THEME_OF.get(w) || []) s.add(t); return s; };

// Words that make a card absurd on its own.
const ABSURD = new Set(['tiny', 'giant', 'confus', 'grumpy', 'suspicious', 'polite', 'tired', 'excit', 'dramatic', 'angry', 'secret', 'plan', 'grudge', 'pajama', 'tuxedo', 'dancing', 'danc', 'sweaty', 'stuck', 'forgot', 'think', 'tutu', 'wig', 'scooter', 'hoverboard', 'vacation', 'attitude', 'hurry', 'whoopee', 'hiccup', 'clown', 'mime', 'ninja', 'pirate', 'viking', 'llama', 'goat', 'sloth', 'raccoon', 'pigeon', 'bigfoot', 'karaoke', 'squirrel', 'coffee', 'sock', 'banana', 'pickle', 'underpant', 'slime', 'burp', 'toddler', 'marker', 'uncle', 'grandpa', 'grandma', 'robot', 'snowman', 'unicorn'].map(stem));
// Serious recipes + silly cards = the classic Chef's Kiss laugh.
const SERIOUS = new Set(['love', 'work', 'school', 'money', 'royal']);
const SILLY = new Set(['animal', 'silly', 'fantasy', 'food']);

// What sort of card does the Recipe Card ask for? (p person/creature, t thing, e event/action, c place/idea)
function wantsKind(recipe) {
  const t = String(recipe.t || '').toLowerCase();
  if (/\b(who|grandma|uncle|villain|animal|spirit|teacher|boss|person|partner|roommate|neighbor|hero)\b/.test(t)) return 'p';
  if (/\b(where|place|destination|island|theme park)\b/.test(t)) return 'c';
  if (/\b(why|excuse|reason|happen|when|talent|sport|habit|origin|sign)\b/.test(t)) return 'e';
  return 't';
}
// A stable little nudge so ties don't flicker between renders.
const nudge = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 1000) / 1000; };

// How funny is this card with this Recipe Card? Higher is funnier.
export function funnyScore(recipe, c) {
  const rw = words(`${recipe.t} ${recipe.d || ''}`), cw = words(`${c.t} ${c.d || ''}`), ct = words(c.t);
  const rt = themesOf(rw), cthemes = themesOf(cw);
  const shared = [...cthemes].filter(t => rt.has(t)).length;
  const overlap = ct.filter(w => rw.includes(w)).length;
  const absurd = Math.min(3, ct.filter(w => ABSURD.has(w)).length + (ct.length >= 4 ? .5 : 0));
  const contrast = [...rt].some(t => SERIOUS.has(t)) && [...cthemes].some(t => SILLY.has(t)) ? 1 : 0;
  const kind = c.k && c.k === wantsKind(recipe) ? .6 : 0;
  return 1.6 * shared + 1.1 * overlap + .9 * absurd + .9 * contrast + kind + .35 * nudge(`${recipe.t}|${c.t}`);
}

// ---------------------------------------------------------------- "Make me a card" ideas

const WHO = ['A goat', 'Grandma', 'A very polite robot', 'A sleepy dragon', 'A pirate', 'A tiny horse', 'The substitute teacher', 'A penguin', 'A raccoon', 'A wizard', 'A toddler', 'A llama', 'Bigfoot', 'A squirrel', 'A grumpy cat', 'The ice cream truck driver', 'A ninja', 'A snowman', 'A Viking', 'A dancing banana'];
const LIKE = ['in pajamas', 'on roller skates', 'with a tiny hat', 'with a clipboard', 'who just learned to whistle', 'with a secret plan', 'in a tutu', 'on a scooter', 'with way too much glitter', 'who only speaks in rhymes', 'with a grudge against Tuesdays', 'wearing three scarves', 'doing interpretive dance', 'with a suspicious sandwich', 'on a very long vacation'];
const THINGS = {
  food: ['A pickle-flavored milkshake', 'Spaghetti in a sock', 'Pizza with gummy bears', 'A sandwich made of pancakes', 'Mystery soup from Grandma', 'A cake shaped like a shoe'],
  animal: ['A goat who files taxes', 'A cat with a lawyer', 'A dog wearing sunglasses', 'A hamster with a gym membership', 'A llama in a business suit'],
  scary: ['A ghost afraid of the dark', 'A vampire who faints at ketchup', 'A zombie at a yoga class', 'A haunted rubber duck'],
  love: ['A love letter written in crayon', 'A heart-shaped meatloaf', 'Matching sweaters for the cat', 'A serenade on a kazoo'],
  work: ['A boss who only communicates in emojis', 'A meeting that could have been a nap', 'A stapler with feelings', 'Bringing your pet llama to work'],
  school: ['Homework eaten by a goldfish', 'A field trip to the dentist', 'A substitute teacher who is a pirate', 'Recess for grown-ups'],
  family: ['Grandpa’s secret dance move', 'The uncle who tells the same joke', 'Mom’s “I’m not mad” voice', 'A family photo with a goat'],
  money: ['A million rubber ducks', 'A golden toilet brush', 'A savings jar full of buttons', 'Buying an island shaped like a sock'],
  sleep: ['Snoring like a motorcycle', 'Sleepwalking into the fridge', 'A pillow full of crackers', 'A dream about tax forms'],
  sport: ['Competitive napping', 'Synchronized sneezing', 'Extreme thumb wrestling', 'The 100-meter waddle'],
  music: ['A kazoo solo', 'A choir of chickens', 'Karaoke with a parrot', 'A tuba in the bathtub'],
  tech: ['A phone that only autocorrects to “banana”', 'A robot vacuum with stage fright', 'A GPS that gives up', 'An app for talking to plants'],
  travel: ['A cruise for cats', 'A road trip in a shopping cart', 'An island made of pudding', 'A hot-air balloon shaped like a pickle'],
  silly: ['A whoopee cushion at a wedding', 'Socks on your hands', 'A clown who is very serious', 'Hiccups that sound like a duck'],
  fantasy: ['A wizard with a cold', 'A unicorn with a mortgage', 'An alien at a garage sale', 'A dragon that’s scared of matches'],
  home: ['A sock that went missing in 2009', 'A junk drawer that bites', 'The fridge light’s secret life', 'A couch cushion full of coins'],
  royal: ['A king in fuzzy slippers', 'A crown made of pretzels', 'A royal decree about naps', 'A knight afraid of horses'],
};
const recent = [];
function pickFrom(list, avoid, n = 1) {
  const pool = list.filter(x => !avoid.has(x.toLowerCase()) && !recent.includes(x));
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
function localSuggest(recipe, n = 3, avoidList = []) {
  const avoid = new Set(avoidList.map(x => String(x).toLowerCase()));
  const rt = [...themesOf(words(`${recipe.t} ${recipe.d || ''}`))];
  const ideas = [];
  // 1–2 ideas from the Recipe Card's own themes (or a silly opposite for serious ones)…
  const themes = rt.length ? rt : ['silly'];
  const lean = themes.some(t => SERIOUS.has(t)) ? [...themes, 'animal', 'silly'] : themes;
  for (const t of lean.sort(() => Math.random() - .5)) { if (ideas.length >= n - 1) break; ideas.push(...pickFrom(THINGS[t] || [], avoid)); }
  // …and a mix-and-match character for surprise.
  while (ideas.length < n) {
    const idea = `${pickFrom(WHO, avoid)[0] || 'A goat'} ${pickFrom(LIKE, avoid)[0] || 'in pajamas'}`;
    if (!ideas.includes(idea)) ideas.push(idea);
  }
  const out = [...new Set(ideas)].slice(0, n);
  recent.push(...out); recent.splice(0, Math.max(0, recent.length - 40));
  return out;
}

// ---------------------------------------------------------------- backends

export const localBackend = {
  name: 'local',
  rank: async (recipe, cards) => cards.map(c => funnyScore(recipe, c)),
  suggest: async (recipe, n, avoid) => localSuggest(recipe, n, avoid),
};
let backend = localBackend;
// Plug a real model in here later (same interface as localBackend). Falls back to local on null.
export function setLaughBackend(b) { backend = b && typeof b.rank === 'function' && typeof b.suggest === 'function' ? b : localBackend; }
export const laughBackend = () => backend.name;

// ---------------------------------------------------------------- what the game calls

// The ids of the 2–3 funniest cards in this hand for this Recipe Card ([] if anything goes wrong).
export async function funnyPicks(recipe, cards, ms = TIMEOUT_MS) {
  if (!recipe || !Array.isArray(cards) || cards.length < 2) return [];
  const scores = await withTimeout(() => backend.rank(recipe, cards), ms, null);
  if (!Array.isArray(scores) || scores.length !== cards.length || scores.some(s => !Number.isFinite(s))) return [];
  const ranked = cards.map((c, i) => ({ id: c.id, s: scores[i] })).sort((a, b) => b.s - a.s);
  const top = ranked.slice(0, 2);
  // A third card only when it's nearly as good as the second.
  if (cards.length >= 5 && ranked[2] && ranked[2].s >= ranked[1].s * .9) top.push(ranked[2]);
  return top.map(x => x.id);
}

// Three short, family-friendly card ideas for this Recipe Card ([] if anything goes wrong).
export async function makeCards(recipe, avoid = [], ms = TIMEOUT_MS) {
  if (!recipe) return [];
  const out = await withTimeout(() => backend.suggest(recipe, 3, avoid), ms, null);
  if (!Array.isArray(out)) return [];
  const clean = [...new Set(out.map(s => String(s || '').replace(/\s+/g, ' ').trim()).filter(s => s && s.length <= 60))];
  return clean.slice(0, 3);
}
