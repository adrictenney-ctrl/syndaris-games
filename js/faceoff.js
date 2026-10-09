// Face Off: everyone gets two silly prompts on their phone and writes the funniest answers they can.
// Each prompt went to exactly two players — so on the table, answers go head to head, and everyone
// else votes for the one they like best (without knowing who wrote what). 100 points per vote
// (200 in round two), +250 for a clean sweep. The final round: one prompt for everybody.
import { base, shuffle, deal, cleanText, sfx, left, waiting, finish } from './party.js?v=68';

export const PROMPTS = 'The worst thing to say on a first date|A terrible name for a cruise ship|What your pet really thinks of you|The secret ingredient in grandma’s soup|A rejected flavour of ice cream|The worst superpower to have|What aliens would find most confusing about us|A bad name for a hair salon|The real reason dinosaurs went extinct|Something you shouldn’t shout in a library|The worst thing to find in your sandwich|A slogan for a very honest airline|What the moon is thinking right now|A terrible theme for a wedding|The world’s most useless invention|What’s really at the centre of the Earth|A bad thing to name a boat|The last words of a houseplant|A new Olympic sport nobody asked for|The worst song to play at a funeral|An awkward thing to say to the queen|What cats dream about|A fortune cookie you don’t want to get|The least scary monster|A strange thing to keep in your fridge|The worst excuse for missing work|A rejected board game|What a sloth does on its day off|The worst advice for a new parent|A bad name for a perfume|What you’d find in a wizard’s junk drawer|A movie sequel nobody needs|The most boring superhero|The worst thing to say to a pirate|A new rule for the school playground|What your socks get up to when you’re not looking|A bad slogan for a dentist|The most disappointing treasure|A ridiculous reason to call the police|A pizza topping that should be illegal|What penguins gossip about|A really bad tattoo idea|The worst thing to hear from your pilot|The name of a very lazy detective|A terrible gift for a teacher|A haunted house that isn’t scary at all|What robots do for fun|The worst flavour of toothpaste|A strange thing to bring to a picnic|What really happens at the North Pole in summer|The world’s worst holiday destination|A bad name for a rock band|The secret life of a garden gnome|A sign you’re at a bad restaurant|The real reason the chicken crossed the road|An unhelpful thing to say during an emergency|The worst job in a castle|A bad thing to bring to show-and-tell|What babies are really thinking|A new national holiday'.split('|');

export function createGame(settings, players) {
  const g = base(settings, players, { secs: 90 });
  g.round = 0;
  startRound(g);
  return g;
}
function startRound(g) {
  g.round++;
  const n = g.order.length;
  if (g.round <= 2) {
    // Each prompt goes to two neighbours (in a shuffled circle), so everyone writes two answers.
    const ring = shuffle([...g.order]);
    g.matchups = ring.map((s, i) => ({ p: deal(g, 'p', PROMPTS.length), a: s, b: ring[(i + 1) % n], ans: {} }));
  } else g.matchups = [{ p: deal(g, 'p', PROMPTS.length), all: true, ans: {} }];
  g.drafts = {};
  g.done = {};
  g.phase = 'write';
  g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}
// The prompts a player has to answer this round.
export const myPrompts = (g, s) => g.matchups.filter(m => m.all || m.a === s || m.b === s);
const mult = g => g.round * 100;
export const collecting = g => g.phase === 'write' || g.phase === 'vote';
export const turnSeat = () => -1;
const voters = g => { const m = g.matchups[g.mi]; return m.all ? g.order.filter(s => (m.opts || []).some(o => o !== s)) : g.order.filter(s => s !== m.a && s !== m.b); };
export const pending = g => (g.phase === 'write' ? waiting(g) : g.phase === 'vote' ? waiting(g, voters(g)) : []);
export const current = g => pending(g)[0] ?? -1;

export function draft(g, seat, d) { if (g.phase !== 'write' || g.done[seat]) return false; g.drafts[seat] = (d.vals || []).map(v => cleanText(v, 70)); return true; }
function save(g, s, vals) { myPrompts(g, s).forEach((m, i) => { if (vals[i]) m.ans[s] = vals[i]; }); }
function toVote(g) {
  for (const s of g.order) if (!g.done[s] && g.drafts[s]) save(g, s, g.drafts[s]);
  g.mi = -1;
  nextMatch(g);
}
function nextMatch(g) {
  g.mi++;
  if (g.mi >= g.matchups.length) {
    if (g.round >= 3) return finish(g);
    return startRound(g);
  }
  const m = g.matchups[g.mi];
  g.votes = {};
  g.done = {};
  // Head to head: if one side said nothing, the other wins without a vote.
  if (!m.all && (!m.ans[m.a] || !m.ans[m.b])) { scoreMatch(g); return; }
  m.opts = m.all ? shuffle(g.order.filter(s => m.ans[s])) : shuffle([m.a, m.b]);
  if (!m.opts.length) return nextMatch(g);
  if (!voters(g).length) return scoreMatch(g);
  g.phase = 'vote';
  g.endAt = Date.now() + 25000;
  g.moveId++;
}
function scoreMatch(g) {
  const m = g.matchups[g.mi];
  g.gain = {};
  for (const s of g.order) g.gain[s] = 0;
  if (!m.all && (!m.ans[m.a] || !m.ans[m.b])) {
    const w = m.ans[m.a] ? m.a : m.ans[m.b] ? m.b : null;
    if (w != null) g.gain[w] += mult(g);
    m.opts = [m.a, m.b];
  } else {
    for (const [, s] of Object.entries(g.votes)) g.gain[s] += m.all ? 300 : mult(g);
    const vs = Object.values(g.votes);
    if (!m.all && vs.length > 1 && vs.every(x => x === vs[0])) { g.gain[vs[0]] += 250; g.sweep = vs[0]; } else g.sweep = null;
  }
  for (const s of g.order) g.score[s] += g.gain[s];
  sfx(g, 'chime');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'write' && a.type === 'answer') {
    if (g.done[seat]) return 'Already handed in';
    const vals = (a.vals || []).map(v => cleanText(v, 70));
    if (!vals.some(Boolean)) return 'Write at least one answer';
    save(g, seat, vals);
    g.done[seat] = true;
    if (!waiting(g).length) toVote(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'vote' && a.type === 'pick') {
    if (!voters(g).includes(seat)) return 'You wrote one of these — no voting!';
    if (g.done[seat]) return 'Already voted';
    const m = g.matchups[g.mi], s = Number(a.v);
    if (!m.opts.includes(s)) return 'Vote for an answer';
    if (s === seat) return "You can't vote for yourself";
    g.votes[seat] = s;
    g.done[seat] = true;
    if (!waiting(g, voters(g)).length) scoreMatch(g); else g.moveId++;
    return null;
  }
  return 'Not now';
}
export function tick(g) {
  if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1500, run: () => { sfx(g, 'buzzer'); toVote(g); } };
  if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => scoreMatch(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 6000 - Date.now()), run: () => nextMatch(g) };
  return null;
}
export function botAction(g, seat) {
  if (g.phase === 'write') return { type: 'answer', vals: myPrompts(g, seat).map((_, i) => ['a confused llama', 'free soup', 'my uncle Gary'][(seat + i) % 3]) };
  const ok = g.matchups[g.mi].opts.filter(s => s !== seat);
  return { type: 'pick', v: ok[Math.floor(Math.random() * ok.length)] };
}

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, left: collecting(g) ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Round', g.round >= 3 ? 'Final' : `${g.round}/2`]] };
  if (g.phase === 'write') {
    const mp = myPrompts(g, seat), d = g.drafts[seat] || [];
    v.ui = g.done[seat] ? { k: 'wait', title: 'Answers in ✓', sub: `Waiting for ${waiting(g).length} more…` }
      : { k: 'fields', key: 'w' + g.round, title: g.round >= 3 ? 'Final round — one prompt for everyone' : 'Be funny!', sub: 'Each answer goes head to head with someone else’s', myturn: true, buzz: true,
        fields: mp.map((m, i) => ({ label: PROMPTS[m.p], ph: 'Your answer…', max: 70, value: d[i] || '' })), submit: 'Hand them in', need: 1, needMsg: 'Write at least one answer' };
  } else if (g.phase === 'vote' || g.phase === 'reveal') {
    const m = g.matchups[g.mi], card = { kicker: m.all ? 'Final round' : `Round ${g.round}`, big: PROMPTS[m.p] };
    if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.gain[seat] ? `+${g.gain[seat]}${g.sweep === seat ? ' — clean sweep!' : ''}` : 'Votes are in', sub: 'Look at the table', card };
    else if (!voters(g).includes(seat)) v.ui = { k: 'wait', title: 'That’s yours up there!', sub: 'Fingers crossed 🤞', card };
    else if (g.done[seat]) v.ui = { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g, voters(g)).length} more…`, card };
    else v.ui = { k: 'pick', key: 'v' + g.round + ':' + g.mi, title: 'Which answer is funnier?', sub: 'Tap your favourite', myturn: true, buzz: true, card, options: m.opts.filter(s => s !== seat).map(s => ({ v: s, label: m.ans[s] })) };
  } else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Funniest in the room!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
