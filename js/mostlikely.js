// Most Likely To: "Who's most likely to… become famous?" Everyone secretly votes for a player
// (yourself included). The votes are revealed on the table and whoever gets the most is crowned.
// You score a point if you voted with the crowd — so think about what everyone else will say.
import { base, deal, sfx, left, waiting, finish } from './party.js?v=67';

export const PROMPTS = 'become famous|survive a zombie apocalypse|forget their own birthday|win the lottery and lose the ticket|cry at a movie|get lost in their own neighbourhood|become a millionaire|talk their way out of a speeding ticket|adopt ten cats|eat something off the floor|laugh at the worst moment|start a band|move to another country on a whim|win a reality show|still be awake at 4am|text their ex|trip over nothing|become president|show up late to their own wedding|accidentally set off a fire alarm|go viral online|befriend a stranger on a plane|spend all their money on snacks|win an argument with a teacher|binge a whole series in one day|run a marathon|sleep through an earthquake|be a secret genius|get a tattoo they regret|keep a plant alive for ten years|break a world record|write a bestselling book|become a stand-up comedian|survive alone in the wilderness|get stuck in a revolving door|be the first to leave a party|be the last to leave a party|cheat at board games|sing karaoke without being asked|start a conversation with a dog|become a famous chef|go skydiving|forget where they parked|send a text to the wrong person|keep a secret forever|spill a secret by accident|own the most shoes|win a hot-dog-eating contest|join the circus|become an astronaut|wear pyjamas to the shops|fall asleep at the cinema|order the weirdest thing on the menu|plan the perfect surprise party|cry during a sad advert|lose their phone while holding it|become a reality TV villain|talk to themselves out loud|have a secret talent|be a ghost hunter|win a dance-off|get kicked out of a library|befriend a celebrity|make everyone laugh at a funeral|fix anything with tape|panic in an escape room|still sleep with a stuffed animal|eat dessert first|spend hours choosing a film|have the most tabs open|start a business|become a meme|get married in Las Vegas|live to 100|lose a game and demand a rematch|believe in aliens|win a staring contest|organise their sock drawer by colour|cook a three-course meal for everyone|forget someone’s name right after meeting them'.split('|');

export function createGame(settings, players) {
  const g = base(settings, players, { rounds: 10, secs: 30 });
  g.round = 0;
  startRound(g);
  return g;
}
function startRound(g) {
  g.round++;
  g.prompt = deal(g, 'p', PROMPTS.length);
  g.votes = {};
  g.done = {};
  g.phase = 'vote';
  g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}
export const collecting = g => g.phase === 'vote';
export const turnSeat = () => -1;
export const current = g => (g.phase === 'vote' ? waiting(g)[0] ?? -1 : -1);

function reveal(g) {
  const tally = {};
  for (const v of Object.values(g.votes)) tally[v] = (tally[v] || 0) + 1;
  const top = Math.max(0, ...Object.values(tally));
  g.tally = tally;
  g.crowned = Object.keys(tally).filter(k => tally[k] === top).map(Number);
  g.gain = {};
  for (const [s, v] of Object.entries(g.votes)) if (g.crowned.includes(v)) { g.score[s]++; g.gain[s] = 1; }
  sfx(g, 'chime');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a || a.type !== 'pick' || g.phase !== 'vote') return 'Not now';
  if (!g.order.includes(seat)) return "You're not in this game";
  if (g.done[seat]) return 'Already voted';
  const s = Number(a.v);
  if (!g.order.includes(s)) return 'Vote for a player';
  g.votes[seat] = s;
  g.done[seat] = true;
  if (!waiting(g).length) reveal(g); else g.moveId++;
  return null;
}

export function tick(g) {
  if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 8000 - Date.now()), run: () => (g.round >= g.settings.rounds ? finish(g) : startRound(g)) };
  return null;
}
export const botAction = g => ({ type: 'pick', v: g.order[Math.floor(Math.random() * g.order.length)] });

export function viewFor(g, seat) {
  const card = { kicker: 'Who’s most likely to…', big: PROMPTS[g.prompt] + '?' };
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'vote' ? left(g) : 0, hud: [['Score', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
  if (g.phase === 'vote') v.ui = g.done[seat]
    ? { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g).length} more…`, card }
    : { k: 'pick', key: 'v' + g.round, title: 'Cast your vote', sub: 'Point if you pick who most people pick', myturn: true, card, options: g.order.map(s => ({ v: s, dot: s, label: `@${s}@`, sub: s === seat ? 'you!' : '' })) };
  else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.crowned.includes(seat) ? '👑 That’s you!' : g.gain[seat] ? '+1 — you read the room' : 'The room disagreed', sub: `Crowned: ${g.crowned.map(s => `@${s}@`).join(' & ')}`, card };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
