// Pass the Phrase: a hot-potato word game for two teams (seats alternate around the table, so
// the phrase always passes to the other team). Whoever holds the phrase describes it — no
// rhyming, no "sounds like", no saying the word. As soon as their own team guesses it, tap
// Got it and it jumps to the next player with a new phrase. A hidden timer is ticking: when the
// buzzer goes, the team NOT holding the phrase scores a point. First to the target wins.
import { LISTS } from './sketch-words.js?v=66';

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
// The Sketch & Guess words plus some everyday sayings.
export const PHRASES = [...new Set([...LISTS.easy, ...LISTS.medium, ...(LISTS.hard || []), ...'couch potato|cold feet|piece of cake|under the weather|on cloud nine|spill the beans|break a leg|hit the road|traffic jam|road trip|comfort food|sweet tooth|night owl|early bird|bucket list|game night|sleepover|pillow fight|snow day|pool party|yard sale|garage band|food truck|bounce house|water park|haunted house|tree house|ice skating|sky diving|bungee jump|summer camp|field trip|science fair|spelling bee|talent show|magic trick|high five|fist bump|group hug|belly laugh|brain freeze|second wind'.split('|')])];

export function createGame(settings, players) {
  const g = { settings: { target: 7, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  g.team = g.seats.map(() => null);
  g.order.forEach((s, i) => { g.team[s] = i % 2; });
  g.deck = shuffle(PHRASES.map((_, i) => i));
  g.scores = [0, 0];
  g.holderIdx = 0;
  g.round = 0;
  g.phase = 'ready';
  return g;
}
export const holder = g => g.order[g.holderIdx % g.order.length];
const draw = g => { if (!g.deck.length) g.deck = shuffle(PHRASES.map((_, i) => i)); return g.deck.pop(); };
export const current = g => (g.phase === 'ready' ? holder(g) : -1);

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (seat !== holder(g)) return 'You’re not holding the phrase';
  if (a.type === 'start' && g.phase === 'ready') {
    g.phase = 'play';
    g.round++;
    g.buzzAt = Date.now() + (40 + Math.random() * 35) * 1000;
    g.phrase = draw(g);
    g.passes = 0;
    g.moveId++;
    return null;
  }
  if (g.phase !== 'play') return 'Not now';
  if (a.type === 'skip') { g.phrase = draw(g); g.moveId++; return null; }
  if (a.type === 'got') {
    g.holderIdx = (g.holderIdx + 1) % g.order.length;
    g.phrase = draw(g);
    g.passes++;
    g.moveId++;
    return null;
  }
  return "That move isn't allowed";
}
export function tick(g) {
  if (g.phase === 'play') return { ms: Math.max(0, g.buzzAt - Date.now()), run: () => {
    const caught = g.team[holder(g)];
    g.scores[1 - caught]++;
    g.lastBuzz = { caught: holder(g), phrase: PHRASES[g.phrase] };
    announce(g, holder(g), 'BZZZT! Caught holding it 💣');
    g.phase = 'buzz';
    g.buzzShownAt = Date.now();
    g.moveId++;
  } };
  if (g.phase === 'buzz') return { ms: Math.max(0, g.buzzShownAt + 6000 - Date.now()), run: () => {
    if (Math.max(...g.scores) >= g.settings.target) { g.phase = 'over'; g.winner = g.scores[0] > g.scores[1] ? 0 : 1; g.moveId++; return; }
    g.holderIdx = (g.holderIdx + 1) % g.order.length;     // whoever was caught passes it on to start
    g.phase = 'ready';
    g.moveId++;
  } };
  return null;
}
export const botAction = () => null;
export const viewFor = (g, seat) => ({ phase: g.phase, team: g.team, scores: g.scores, holder: holder(g), phrase: seat === holder(g) && g.phase === 'play' ? PHRASES[g.phrase] : null, passes: g.passes || 0, lastBuzz: g.lastBuzz || null, target: g.settings.target, round: g.round, winner: g.winner ?? null, moveId: g.moveId });
