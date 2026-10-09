// Close Call: nobody needs to know the answer. Each question has a number for an answer ("How many
// keys on a piano?"). Everyone writes a guess on their phone; the guesses go up on the table in
// order, each with payout odds (the outside guesses pay more). Then everyone bets on the guess they
// think is closest WITHOUT going over. Your guess wins: +3. Your bet wins: + the odds. Most points
// after the last question wins.
import { base, deal, sfx, left, waiting, finish } from './party.js?v=68';

export const QS = [
  ['How many keys are on a standard piano?', 88], ['In what year did the Titanic sink?', 1912], ['How many bones are in the adult human body?', 206],
  ['How tall is Mount Everest, in metres?', 8849], ['In what year did people first walk on the Moon?', 1969], ['How many hearts does an octopus have?', 3],
  ['In what year was the Eiffel Tower finished?', 1889], ['How many countries are in the European Union?', 27], ['How many minutes are in a day?', 1440],
  ['How many Earth days does Mars take to go round the Sun?', 687], ['How many teeth does an adult usually have, wisdom teeth included?', 32], ['In what year did World War I begin?', 1914],
  ['Roughly how fast does sound travel through air, in metres per second?', 343], ['How many squares are on a chessboard?', 64], ['At how many degrees Fahrenheit does water boil (at sea level)?', 212],
  ['In what year did the first iPhone go on sale?', 2007], ['How many moons does Mars have?', 2], ['In what year did the Berlin Wall fall?', 1989],
  ['How many time zones does Russia span?', 11], ['How long is an Olympic swimming pool, in metres?', 50], ['How many hours are in a week?', 168],
  ['In what year was William Shakespeare born?', 1564], ['How many elements are on the periodic table?', 118], ['In what year did Columbus first reach the Americas?', 1492],
  ['How wide is a basketball hoop’s rim, in inches?', 18], ['How many dots are on a standard die, all faces added up?', 21], ['In what year did the Wright brothers first fly a powered plane?', 1903],
  ['How many letters are in the Greek alphabet?', 24], ['How many years did the Hundred Years’ War actually last?', 116], ['In what year was the Great Fire of London?', 1666],
  ['How many bones are in one human hand?', 27], ['How long is a marathon, in metres?', 42195], ['How many seconds are in an hour?', 3600],
  ['In what year was Coca-Cola first sold?', 1886], ['How many eyes does a honeybee have?', 5], ['How many pieces does each player start with in chess?', 16],
  ['How many players does a baseball team have on the field?', 9], ['How many cards are in a standard deck, without jokers?', 52], ['How deep is the deepest point of the ocean, in metres (roughly)?', 10935],
  ['How many legs does a lobster have?', 10], ['How many sides does a dodecagon have?', 12], ['At how many degrees Fahrenheit does water freeze?', 32],
  ['In what year did the Second World War end?', 1945], ['How many strings does a standard harp have (concert pedal harp)?', 47], ['How many years are in a millennium?', 1000],
  ['How many US states border Canada?', 13], ['In what year did the first modern Olympic Games take place?', 1896], ['How many symphonies did Beethoven complete?', 9],
];

export function createGame(settings, players) {
  const g = base(settings, players, { rounds: 7 });
  g.round = 0;
  startRound(g);
  return g;
}
function startRound(g) {
  g.round++;
  g.q = deal(g, 'q', QS.length);
  g.guess = {};
  g.drafts = {};
  g.done = {};
  g.phase = 'guess';
  g.endAt = Date.now() + 45000;
  g.moveId++;
}
export const collecting = g => g.phase === 'guess' || g.phase === 'bet';
export const turnSeat = () => -1;
export const pending = g => (collecting(g) ? waiting(g) : []);
export const current = g => pending(g)[0] ?? -1;
export function draft(g, seat, d) { if (g.phase !== 'guess' || g.done[seat]) return false; const n = Number(String((d.vals || [])[0]).replace(/[, ]/g, '')); if (Number.isFinite(n)) g.drafts[seat] = n; return true; }

// The board: slot 0 is "lower than every guess", then each distinct guess from low to high.
function toBet(g) {
  for (const s of g.order) if (g.guess[s] == null && g.drafts[s] != null) g.guess[s] = g.drafts[s];
  const vals = [...new Set(Object.values(g.guess))].sort((a, b) => a - b);
  const n = vals.length, mid = (n - 1) / 2;
  g.slots = [{ low: true, v: null, odds: 6, who: [] }, ...vals.map((v, i) => ({ v, odds: Math.min(5, 2 + Math.floor(Math.abs(i - mid))), who: g.order.filter(s => g.guess[s] === v) }))];
  g.bets = {};
  g.done = {};
  g.phase = 'bet';
  g.endAt = Date.now() + 30000;
  g.moveId++;
}
function reveal(g) {
  const ans = QS[g.q][1];
  let w = 0;
  g.slots.forEach((sl, i) => { if (!sl.low && sl.v <= ans) w = i; });
  g.win = w;
  g.gain = {};
  for (const s of g.order) g.gain[s] = 0;
  for (const s of g.slots[w].who) g.gain[s] += 3;
  for (const [s, i] of Object.entries(g.bets)) if (i === w) g.gain[s] += g.slots[w].odds;
  for (const s of g.order) g.score[s] += g.gain[s];
  sfx(g, 'chime');
  g.phase = 'reveal';
  g.endAt = 0;
  g.revAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'guess' && a.type === 'answer') {
    if (g.done[seat]) return 'Already guessed';
    const n = Number(String((a.vals || [])[0]).replace(/[, ]/g, ''));
    if (!Number.isFinite(n) || String((a.vals || [])[0]).trim() === '') return 'Type a number';
    g.guess[seat] = n;
    g.done[seat] = true;
    if (!waiting(g).length) toBet(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'bet' && a.type === 'pick') {
    if (g.done[seat]) return 'Already bet';
    const i = Number(a.v);
    if (!g.slots[i]) return 'Bet on a guess';
    g.bets[seat] = i;
    g.done[seat] = true;
    if (!waiting(g).length) reveal(g); else g.moveId++;
    return null;
  }
  return 'Not now';
}
export function tick(g) {
  if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => toBet(g) };
  if (g.phase === 'bet') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => reveal(g) };
  if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 9000 - Date.now()), run: () => (g.round >= g.settings.rounds ? finish(g) : startRound(g)) };
  return null;
}
export function botAction(g, seat) {
  if (g.phase === 'guess') { const a = QS[g.q][1]; return { type: 'answer', vals: [String(Math.round(a * (0.5 + Math.random())))] }; }
  return { type: 'pick', v: Math.floor(Math.random() * g.slots.length) };
}

export function viewFor(g, seat) {
  const v = { phase: g.phase, moveId: g.moveId, left: collecting(g) ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Question', `${g.round}/${g.settings.rounds}`]] };
  const card = { kicker: `Question ${g.round}`, small: QS[g.q][0], cls: 'tw-q' };
  if (g.phase === 'guess') v.ui = g.done[seat] ? { k: 'wait', title: `Your guess: ${g.guess[seat]} ✓`, sub: `Waiting for ${waiting(g).length} more…`, card }
    : { k: 'fields', key: 'g' + g.round, title: 'Your best guess', sub: 'A number — no need to be exact', myturn: true, buzz: true, card, fields: [{ type: 'number', ph: '0', max: 12 }], submit: 'Lock it in', need: 1, needMsg: 'Type a number' };
  else if (g.phase === 'bet') v.ui = g.done[seat] ? { k: 'wait', title: 'Bet placed ✓', sub: `Waiting for ${waiting(g).length} more…`, card }
    : { k: 'pick', key: 'b' + g.round, title: 'Bet on the closest guess', sub: 'Closest WITHOUT going over wins', myturn: true, buzz: true, card,
      options: g.slots.map((sl, i) => ({ v: i, label: sl.low ? 'Lower than all of them' : String(sl.v.toLocaleString()), sub: `pays ${sl.odds}${sl.who.includes(seat) ? ' · yours' : ''}` })) };
  else if (g.phase === 'reveal') v.ui = { k: 'wait', title: `+${g.gain[seat]}`, sub: `The answer: ${QS[g.q][1].toLocaleString()}`, card };
  else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
  return v;
}
