// Same Brain: think like the herd. A question goes up ("Name a pizza topping") and everyone types
// an answer in secret. The table groups matching answers: if one answer is the most popular on its
// own, everyone who gave it scores a point. The lone player with an answer nobody else gave gets the
// Odd Sock 🧦 — you can't win while you're holding it. First to the target without the sock wins.
import { base, deal, same, cleanText, sfx, left, waiting } from './party.js?v=68';

export const QUESTIONS = 'Name a pizza topping|Name a fruit|Best ice cream flavour|Name a colour|A number between 1 and 10|Name a farm animal|The best day of the week|Name a superhero|Something you find in a kitchen|A word that rhymes with “cat”|Name a sport|A famous painter|The best breakfast food|Name a vegetable|Name a planet|Something that’s yellow|A type of dog|Name a sea creature|A board game|Name a country in Europe|A sandwich filling|Something you take on holiday|A breakfast cereal|A flavour of crisps or chips|Name a musical instrument|The best season|A month of the year|A shape|Name a bird|A school subject|Something you find in a bathroom|A cartoon character|A fairy tale|Something cold|A fast animal|A hot drink|A Halloween costume|A job that wears a uniform|A sauce|A type of shoe|Something with wheels|A flower|A body part|A dessert|A city in the USA|A piece of furniture|A card game|A Christmas song|A reason to be late|Something you can’t live without|A word that means “very big”|A chocolate bar|A smell everyone loves|A famous bridge or tower|Something in a toolbox|A breakfast drink|An animal with stripes|Name a dance|A soup|A green food|Something you plant|A thing that bounces|A camping item|A famous wizard|A spice|Something round|A gemstone|Something in the sky|A type of weather|Something you collect|Your go-to karaoke song genre|The best pet|A nut|A pasta shape|A kind of bread|The best sandwich|A movie snack|A Disney animal|Something you do on a rainy day|A gift for a teacher|A type of tree'.split('|');

export function createGame(settings, players) {
  const g = base(settings, players, { target: 8, secs: 30 });
  g.sock = -1;
  g.round = 0;
  startRound(g);
  return g;
}
function startRound(g) {
  g.round++;
  g.q = deal(g, 'q', QUESTIONS.length);
  g.ans = {};
  g.drafts = {};
  g.done = {};
  g.phase = 'answer';
  g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}
export const collecting = g => g.phase === 'answer';
export const turnSeat = () => -1;
export const pending = g => (g.phase === 'answer' ? waiting(g) : []);
export const current = g => pending(g)[0] ?? -1;
export function draft(g, seat, d) { if (g.phase !== 'answer' || g.done[seat]) return false; g.drafts[seat] = cleanText((d.vals || [])[0], 30); return true; }

function group(g) {
  for (const s of g.order) if (!g.ans[s] && g.drafts[s]) g.ans[s] = g.drafts[s];
  // Bunch answers that mean the same thing (small typos, plurals, "the").
  const groups = [];
  for (const s of g.order) {
    const a = g.ans[s];
    if (!a) continue;
    const gr = groups.find(x => same(a, [x.text]));
    if (gr) gr.who.push(s); else groups.push({ text: a, who: [s] });
  }
  groups.sort((x, y) => y.who.length - x.who.length);
  g.groups = groups;
  const top = groups[0];
  g.herd = top && top.who.length > 1 && (!groups[1] || groups[1].who.length < top.who.length) ? 0 : -1;
  if (g.herd === 0) for (const s of top.who) g.score[s]++;
  const lone = groups.filter(x => x.who.length === 1);
  g.sockMoved = false;
  if (lone.length === 1) { g.sock = lone[0].who[0]; g.sockMoved = true; }
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  sfx(g, g.herd === 0 ? 'chime' : 'sad');
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a || a.type !== 'answer' || g.phase !== 'answer') return 'Not now';
  if (g.done[seat]) return 'Already answered';
  const t = cleanText((a.vals || [])[0], 30);
  if (!t) return 'Type an answer';
  g.ans[seat] = t;
  g.done[seat] = true;
  if (!waiting(g).length) group(g); else g.moveId++;
  return null;
}
export function tick(g) {
  if (g.phase === 'answer') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => group(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 8000 - Date.now()), run: () => {
    const w = g.order.filter(s => g.score[s] >= g.settings.target && s !== g.sock);
    if (w.length || g.round >= 30) {
      const best = w.length ? w : (() => { const m = Math.max(...g.order.filter(s => s !== g.sock).map(s => g.score[s])); return g.order.filter(s => s !== g.sock && g.score[s] === m); })();
      g.winners = best; g.winner = best[0]; g.phase = 'over'; g.moveId++; return;
    }
    startRound(g);
  } };
  return null;
}
export const botAction = (g, seat) => ({ type: 'answer', vals: [['red', 'blue', 'pizza', 'dog', 'apple'][Math.floor(Math.random() * (seat % 2 ? 3 : 5))]] });

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'answer' ? left(g) : 0, hud: [['Points', `${g.score[seat] ?? 0}/${g.settings.target}`], ['Sock', g.sock === seat ? '🧦 you!' : g.sock >= 0 ? '🧦' : '—']] };
  const card = { kicker: `Question ${g.round}`, big: QUESTIONS[g.q] };
  if (g.phase === 'answer') v.ui = g.done[seat] ? { k: 'wait', title: `“${g.ans[seat]}” ✓`, sub: `Waiting for ${waiting(g).length} more…`, card }
    : { k: 'fields', key: 'a' + g.round, title: 'What will everyone else say?', sub: 'Match the most popular answer', myturn: true, buzz: true, card, fields: [{ ph: 'Your answer…', max: 30, value: g.drafts[seat] || '' }], submit: 'Lock it in', need: 1 };
  else if (g.phase === 'reveal') {
    const mine = g.groups.find(x => x.who.includes(seat));
    v.ui = { k: 'wait', title: g.herd === 0 && g.groups[0].who.includes(seat) ? '🐑 +1 — you’re with the herd!' : g.sock === seat && g.sockMoved ? '🧦 You get the Odd Sock' : mine ? 'No point this time' : 'No answer', sub: g.herd === 0 ? `The herd said “${g.groups[0].text}”` : 'No clear winner — nobody scores', card };
  } else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You think like the herd!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
