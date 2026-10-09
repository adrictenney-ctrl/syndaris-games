// Doodle Bluff: everyone gets a strange secret prompt ("a nervous cactus") and draws it on their
// phone. Then, one at a time, each drawing goes up on the table. Everyone else writes a title for it
// that might fool people, and then votes on which title is the real one. Find the real prompt: +2
// (and the artist gets +1 for each of you). Fool someone with your fake: +1 per vote.
import { base, shuffle, core, cleanText, sfx, left, waiting, finish } from './party.js?v=68';

export const PROMPTS = 'a nervous cactus|a cat running for president|a sandwich on holiday|the world’s tiniest dragon|a snowman in the desert|a very proud potato|a ghost at the dentist|a shark learning to ride a bike|grandma’s secret disco|a lonely lighthouse|a robot falling in love|a penguin in a hot tub|the last slice of pizza|a dog that’s also a sofa|a haunted toaster|a bear doing taxes|a superhero on their day off|a jellyfish with a hat|the moon eating breakfast|an angry cloud|a dinosaur at a birthday party|a vampire at the beach|a fish out of water|a cow on a trampoline|a broken umbrella’s bad day|a wizard stuck in traffic|a happy volcano|a banana in disguise|a spider knitting a sweater|a pirate’s shopping list|a sleepy octopus|a mouse lifting weights|a carrot running away|a giraffe in a tiny car|a confused compass|a frog on a first date|an owl at a rock concert|a tea party for bugs|the world’s worst haircut|a cupcake with a secret|a skeleton sunbathing|a fancy rat|a cactus hug|a snail in a hurry|a duck in a suit|a melting clock at a party|a pigeon stealing fries|a tired alarm clock|a mermaid at the gym|a monster under the bed scared of the dark|a camel in the snow|a squirrel bank robber|a chicken crossing a very wide road|a lazy river|a sneezing elephant|an unhappy birthday cake|a worm going to school|a king who lost his crown|a balloon afraid of pins|a tornado at a picnic|a sock looking for its partner|a tiny house on a big hill|a sad clown at the circus|a goat on a mountain throne|a kite stuck in a tree|a lion getting a manicure|an alien buying groceries|a pencil that won’t stop writing|a vegetable band|a rainy picnic'.split('|');

export function createGame(settings, players) {
  const g = base(settings, players, { secs: 90 });
  const p = shuffle(PROMPTS.map((_, i) => i));
  g.prompt = g.seats.map((_, s) => (g.order.includes(s) ? p.pop() : null));
  g.pics = {};
  g.drafts = {};
  g.done = {};
  g.phase = 'draw';
  g.endAt = Date.now() + g.settings.secs * 1000;
  return g;
}
export const artist = g => g.queue[g.qi];
const others = g => g.order.filter(s => s !== artist(g));
export const collecting = g => ['draw', 'title', 'vote'].includes(g.phase);
export const turnSeat = () => -1;
export const pending = g => (g.phase === 'draw' ? waiting(g) : g.phase === 'title' || g.phase === 'vote' ? waiting(g, others(g)) : []);
export const current = g => pending(g)[0] ?? -1;

const clean = st => (Array.isArray(st) ? st.slice(0, 400).map(x => ({ c: x.c | 0, w: x.w | 0, p: (Array.isArray(x.p) ? x.p : []).slice(0, 2000).map(v => Math.round(v) || 0) })) : []);
export function draft(g, seat, d) {
  if (g.phase === 'draw' && !g.done[seat] && d.strokes) { g.drafts[seat] = clean(d.strokes); return true; }
  if (g.phase === 'title' && !g.done[seat] && d.vals) { g.drafts[seat] = cleanText(d.vals[0], 50); return true; }
  return false;
}
function toShow(g) {
  for (const s of g.order) if (!g.pics[s]) g.pics[s] = g.drafts[s] || [];
  g.queue = shuffle([...g.order]);
  g.qi = -1;
  nextPic(g);
}
function nextPic(g) {
  g.qi++;
  if (g.qi >= g.queue.length) return finish(g);
  g.titles = {};
  g.drafts = {};
  g.done = {};
  g.phase = 'title';
  g.endAt = Date.now() + 50000;
  g.moveId++;
}
function toVote(g) {
  for (const s of others(g)) if (!g.titles[s] && typeof g.drafts[s] === 'string' && g.drafts[s]) g.titles[s] = g.drafts[s];
  const real = PROMPTS[g.prompt[artist(g)]];
  const opts = [{ text: real, by: [], real: true }];
  for (const s of others(g)) {
    const t = g.titles[s];
    if (!t) continue;
    const m = opts.find(o => core(o.text) === core(t));
    if (m) m.by.push(s); else opts.push({ text: t, by: [s] });
  }
  g.opts = shuffle(opts);
  g.votes = {};
  g.done = {};
  g.phase = 'vote';
  g.endAt = Date.now() + 40000;
  g.moveId++;
}
function reveal(g) {
  g.gain = {};
  for (const s of g.order) g.gain[s] = 0;
  for (const [s, i] of Object.entries(g.votes)) {
    const o = g.opts[i];
    if (o.real) { g.gain[s] += 2; g.gain[artist(g)] += 1; } else for (const b of o.by) if (b !== Number(s)) g.gain[b] += 1;
  }
  // Writing the real prompt yourself counts as finding it.
  for (const b of g.opts.find(o => o.real).by) if (g.votes[b] == null) g.gain[b] += 2;
  for (const s of g.order) g.score[s] += g.gain[s];
  sfx(g, 'chime');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'draw' && a.type === 'draw') {
    if (g.done[seat]) return 'Already handed in';
    g.pics[seat] = clean(a.strokes);
    g.done[seat] = true;
    if (!waiting(g).length) toShow(g); else g.moveId++;
    return null;
  }
  if ((g.phase === 'title' || g.phase === 'vote') && !others(g).includes(seat)) return 'It’s your drawing — sit back!';
  if (g.phase === 'title' && a.type === 'answer') {
    if (g.done[seat]) return 'Already handed in';
    const t = cleanText((a.vals || [])[0], 50);
    if (!t) return 'Write a title';
    g.titles[seat] = t;
    g.done[seat] = true;
    if (!waiting(g, others(g)).length) toVote(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'vote' && a.type === 'pick') {
    if (g.done[seat]) return 'Already voted';
    const i = Number(a.v), o = g.opts[i];
    if (!o) return 'Pick a title';
    if (o.by.includes(seat) && !o.real) return "That's your own!";
    g.votes[seat] = i;
    g.done[seat] = true;
    if (!waiting(g, others(g)).length) reveal(g); else g.moveId++;
    return null;
  }
  return 'Not now';
}
export function tick(g) {
  if (g.phase === 'draw') return { ms: Math.max(0, g.endAt - Date.now()) + 2000, run: () => { sfx(g, 'buzzer'); toShow(g); } };
  if (g.phase === 'title') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => toVote(g) };
  if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 9000 - Date.now()), run: () => nextPic(g) };
  return null;
}
export function botAction(g, seat) {
  if (g.phase === 'draw') return { type: 'draw', strokes: [{ c: seat % 8, w: 1, p: [100, 100, 500, 300, 800, 600] }] };
  if (g.phase === 'title') return { type: 'answer', vals: [`a ${['grumpy', 'tiny', 'dancing'][seat % 3]} ${['banana', 'robot', 'llama'][seat % 3]}`] };
  const ok = g.opts.map((o, i) => i).filter(i => g.opts[i].real || !g.opts[i].by.includes(seat));
  return { type: 'pick', v: ok[Math.floor(Math.random() * ok.length)] };
}

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, left: collecting(g) ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Drawing', g.queue ? `${Math.min(g.qi + 1, g.queue.length)}/${g.queue.length}` : '—']] };
  if (g.phase === 'draw') v.ui = g.done[seat] ? { k: 'wait', title: 'Masterpiece handed in ✓', sub: `Waiting for ${waiting(g).length} more…` }
    : { k: 'draw', key: 'd', title: 'Draw your secret prompt', sub: 'Don’t write words!', myturn: true, card: { kicker: 'Draw this', big: PROMPTS[g.prompt[seat]] }, submit: 'Done' };
  else if (g.phase === 'title') v.ui = artist(g) === seat ? { k: 'wait', title: 'That’s your drawing on the table!', sub: 'Everyone is writing fake titles…' }
    : g.done[seat] ? { k: 'wait', title: `“${g.titles[seat]}” ✓`, sub: `Waiting for ${waiting(g, others(g)).length} more…` }
      : { k: 'fields', key: 't' + g.qi, title: 'What is this drawing?', sub: 'Look at the table · write a title that could fool people', myturn: true, buzz: true, fields: [{ ph: 'a …', max: 50 }], submit: 'Hand it in', need: 1 };
  else if (g.phase === 'vote') v.ui = artist(g) === seat ? { k: 'wait', title: 'Voting on your drawing…', sub: 'You get a point for everyone who finds your prompt' }
    : g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g, others(g)).length} more…` }
      : { k: 'pick', key: 'v' + g.qi, title: 'Which is the real prompt?', sub: '+2 if you find it', myturn: true, options: g.opts.map((o, i) => ({ v: i, label: o.text, dis: o.by.includes(seat) && !o.real, sub: o.by.includes(seat) && !o.real ? 'yours' : '' })) };
  else if (g.phase === 'reveal') v.ui = { k: 'wait', title: `+${g.gain[seat]} this drawing`, sub: `It was “${PROMPTS[g.prompt[artist(g)]]}”` };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
