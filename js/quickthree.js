// Quick Three: on your turn the table shows "Name 3…" and you have five seconds to shout three
// answers out loud — it's harder than it sounds. Everyone else then votes on their phone: did
// they do it? A thumbs-up majority scores a point. First to the target wins.
import { base, deal, sfx, left, announce, waiting } from './party.js?v=67';

export const PROMPTS = 'fruits|vegetables|things in a fridge|pizza toppings|breakfast foods|types of cheese|things that are red|things that are yellow|things with wheels|things that fly|zoo animals|farm animals|animals that swim|dog breeds|birds|insects|things in a bathroom|things in a classroom|things in a backpack|things at a birthday party|sports played with a ball|Olympic sports|board games|card games|musical instruments|things you plug in|kitchen appliances|tools|things in a garage|things at the beach|things you take camping|ice cream flavours|desserts|candy bars|cereals|drinks you have hot|things that are cold|things in the sky|planets|countries in Europe|countries in Asia|countries in Africa|US states|capital cities|languages|rivers|oceans or seas|famous mountains|superheroes|cartoon characters|fairy tale characters|villains|wizards or witches|famous painters|famous scientists|presidents or prime ministers|Disney movies|movies with animals in them|TV shows|songs with a colour in the title|bands|singers|things you say on the phone|excuses for being late|reasons to cry|things that make you sneeze|things that smell bad|things that smell good|things that are sticky|things that are soft|things that are loud|things that are round|things with stripes|things with buttons|things with a screen|apps on a phone|websites|things you can fold|things you can break|things you can climb|things you can ride|things you can throw|things that bounce|things you find in a pocket|things in a purse|things in a junk drawer|things you recycle|things that grow|flowers|trees|spices|sauces|sandwich fillings|soups|things made of wood|things made of glass|things made of metal|things that are hot|things in a hospital|jobs that wear a uniform|jobs in a restaurant|things a pirate has|things a cowboy has|things in space|things in a castle|things at a wedding|things at a funeral|things at the airport|things on a farm|things in a garden|winter clothes|summer clothes|shoes|hats|hairstyles|body parts above the neck|bones|things with legs|things with wings|things with a tail|things that are green|things that are black and white|holidays|gifts for a baby|gifts for a grandparent|chores|hobbies|dances|things you do in the morning|things you do before bed|ways to say hello|ways to say goodbye|words that rhyme with cat|words that rhyme with blue|words that start with Z|words that start with Q|words with double letters|things that are spicy|fast food restaurants|car brands|colours of the rainbow|kinds of weather|natural disasters|things that are scary|Halloween costumes|things at a fair|carnival rides|things you collect|famous landmarks|things in a toolbox|school subjects|things in an office|computer parts|video games|reality shows|things that run on batteries|types of boats|types of trucks|things with a lid|things that come in pairs|things you squeeze|things that melt|nicknames for a friend|things you shout at a game'.split('|');

export function createGame(settings, players) {
  const g = base(settings, players, { secs: 5, target: 5 });
  g.turn = 0;
  startTurn(g);
  return g;
}
export const player = g => g.order[g.turn % g.order.length];
function startTurn(g) {
  g.phase = 'ready';
  g.prompt = null;
  g.votes = {};
  g.done = {};
  g.endAt = 0;
  g.moveId++;
}
export const turnSeat = g => (g.phase === 'over' ? -1 : player(g));
export const collecting = g => g.phase === 'judge';
const judges = g => g.order.filter(s => s !== player(g));
export const current = g => (g.phase === 'ready' ? player(g) : g.phase === 'judge' ? waiting(g, judges(g))[0] ?? -1 : -1);

function result(g) {
  const yes = Object.values(g.votes).filter(Boolean).length, no = Object.values(g.votes).filter(v => !v).length;
  g.made = yes >= no;
  if (g.made) g.score[player(g)]++;
  sfx(g, g.made ? 'ding' : 'sad');
  announce(g, player(g), g.made ? 'Nailed it! +1' : 'Not quite…');
  g.phase = 'result';
  g.endAt = 0;
  g.resAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'ready' && a.type === 'go') {
    if (seat !== player(g)) return "It's not your turn";
    g.prompt = deal(g, 'p', PROMPTS.length);
    g.phase = 'go';
    g.endAt = Date.now() + g.settings.secs * 1000;
    sfx(g, 'thud');
    g.moveId++;
    return null;
  }
  if (g.phase === 'judge' && a.type === 'vote') {
    if (seat === player(g) || !g.order.includes(seat)) return 'You don’t vote on your own turn';
    if (g.done[seat]) return 'Already voted';
    g.votes[seat] = !!a.yes;
    g.done[seat] = true;
    if (!waiting(g, judges(g)).length) result(g); else g.moveId++;
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'go') return { ms: Math.max(0, g.endAt - Date.now()), run: () => { sfx(g, 'buzzer'); g.phase = 'judge'; g.endAt = Date.now() + 15000; g.moveId++; } };
  if (g.phase === 'judge') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => result(g) };
  if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 4000 - Date.now()), run: () => {
    if (g.score[player(g)] >= g.settings.target) { g.winners = [player(g)]; g.winner = player(g); g.phase = 'over'; g.moveId++; return; }
    g.turn++;
    startTurn(g);
  } };
  return null;
}

export function botAction(g) {
  if (g.phase === 'ready') return { type: 'go' };
  if (g.phase === 'judge') return { type: 'vote', yes: Math.random() < 0.6 };
  return null;
}

export function viewFor(g, seat) {
  const P = player(g), mine = P === seat;
  const v = { phase: g.phase, moveId: g.moveId, left: left(g), hud: [['Score', g.score[seat] ?? 0, `to ${g.settings.target}`], ['Lead', Math.max(...g.order.map(s => g.score[s]))]] };
  
  const card = g.prompt != null ? { kicker: 'Name 3', big: PROMPTS[g.prompt] } : null;
  if (g.phase === 'ready') v.ui = mine
    ? { k: 'buttons', key: 'r' + g.turn, title: 'Your turn!', sub: `You'll have ${g.settings.secs} seconds to name three — out loud`, myturn: true, buzz: true, buttons: [{ type: 'go', label: 'Go!', icon: '⏱', go: true, cls: 'pp-huge' }] }
    : { k: 'wait', title: `@${P}@ is up`, sub: 'Get ready to judge', note: 'Listen closely…' };
  else if (g.phase === 'go') v.ui = { k: 'wait', title: mine ? 'GO GO GO!' : 'Listen…', sub: mine ? 'Shout three out loud!' : 'Count them!', card };
  else if (g.phase === 'judge') v.ui = mine
    ? { k: 'wait', title: 'Time!', sub: 'Everyone is voting…', card }
    : g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g, judges(g)).length} more…`, card }
      : { k: 'buttons', key: 'j' + g.turn, title: 'Did they name three?', sub: 'Real answers, in time', myturn: true, card, buttons: [{ type: 'vote', label: 'Nope', icon: '👎', payload: { yes: false } }, { type: 'vote', label: 'Yes!', icon: '👍', go: true, payload: { yes: true } }] };
  else if (g.phase === 'result') v.ui = { k: 'wait', title: g.made ? (mine ? 'Nailed it! +1' : 'They made it') : mine ? 'Not this time' : 'They missed', sub: '', card };
  else v.ui = { k: 'wait', title: g.winner === seat ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
