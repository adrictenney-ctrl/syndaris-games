// One Clue: a team game. One player is the guesser and looks away from the phones. Everyone else
// sees the secret word on their phone and writes ONE word as a clue. Then the clues go up on the
// table — but any clue that someone else also wrote is crossed out first, so be original! The
// guesser has one try. Get it and the team scores; a wrong guess also costs the next card; passing
// costs nothing. How many of the 13 can you get?
import { base, shuffle, deal, same, core, cleanText, sfx, left, announce, waiting } from './party.js?v=68';
import { LISTS } from './sketch-words.js?v=68';

export const WORDS = [...new Set([...LISTS.easy, ...LISTS.medium])].filter(w => !w.includes(' '));
export function createGame(settings, players) {
  const g = base(settings, players, { cards: 13, secs: 60 });
  g.cardsLeft = g.settings.cards;
  g.got = 0;
  g.round = 0;
  g.history = [];
  startRound(g);
  return g;
}
export const guesser = g => g.order[(g.round - 1) % g.order.length];
const writers = g => g.order.filter(s => s !== guesser(g));
function startRound(g) {
  g.round++;
  g.cardsLeft--;
  g.word = WORDS[deal(g, 'w', WORDS.length)];
  g.clues = {};
  g.drafts = {};
  g.done = {};
  g.phase = 'clue';
  g.endAt = Date.now() + g.settings.secs * 1000;
  g.moveId++;
}
export const collecting = g => g.phase === 'clue';
export const turnSeat = g => (g.phase === 'guess' ? guesser(g) : -1);
export const pending = g => (g.phase === 'clue' ? waiting(g, writers(g)) : g.phase === 'guess' ? [guesser(g)] : []);
export const current = g => pending(g)[0] ?? -1;

export function draft(g, seat, d) {
  if (g.phase !== 'clue' || g.done[seat] || !writers(g).includes(seat)) return false;
  g.drafts[seat] = cleanText((d.vals || [])[0], 24);
  return true;
}
function toGuess(g) {
  for (const s of writers(g)) if (!g.clues[s] && g.drafts[s]) g.clues[s] = g.drafts[s];
  // Cross out duplicates (and the word itself, or anything containing it).
  g.cancel = {};
  for (const s of writers(g)) {
    const c = g.clues[s];
    if (!c) continue;
    if (same(c, [g.word]) || core(c).includes(core(g.word))) g.cancel[s] = 'the word itself';
    else if (writers(g).some(o => o !== s && g.clues[o] && core(g.clues[o]) === core(c))) g.cancel[s] = 'duplicate';
  }
  g.phase = 'guess';
  g.endAt = Date.now() + 60000;
  sfx(g, 'chime');
  g.moveId++;
}
function result(g, kind, guess) {
  g.res = { kind, guess };
  if (kind === 'right') { g.got++; sfx(g, 'ding'); }
  else if (kind === 'wrong') { if (g.cardsLeft > 0) g.cardsLeft--; sfx(g, 'sad'); }
  g.history.push({ word: g.word, kind });
  g.phase = 'result';
  g.endAt = 0;
  g.resAt = Date.now();
  g.moveId++;
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase === 'clue' && a.type === 'answer') {
    if (!writers(g).includes(seat)) return 'You’re guessing this time — no peeking!';
    if (g.done[seat]) return 'Already handed in';
    const c = cleanText((a.vals || [])[0], 24);
    if (!c) return 'Write one word';
    if (c.trim().includes(' ')) return 'Just ONE word';
    g.clues[seat] = c;
    g.done[seat] = true;
    if (!waiting(g, writers(g)).length) toGuess(g); else g.moveId++;
    return null;
  }
  if (g.phase === 'guess') {
    if (seat !== guesser(g)) return 'Only the guesser answers';
    if (a.type === 'pass') { announce(g, seat, 'Pass'); return result(g, 'pass'), null; }
    if (a.type === 'answer') {
      const t = cleanText((a.vals || [])[0], 30);
      if (!t) return 'Type your guess';
      announce(g, seat, `“${t}”`);
      return result(g, same(t, [g.word]) ? 'right' : 'wrong', t), null;
    }
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'clue') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => toGuess(g) };
  if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => result(g, 'pass') };
  if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 6000 - Date.now()), run: () => {
    if (g.cardsLeft <= 0) { g.order.forEach(s => { g.score[s] = g.got; }); g.winners = [...g.order]; g.phase = 'over'; g.moveId++; return; }
    startRound(g);
  } };
  return null;
}
export function botAction(g, seat) {
  if (g.phase === 'clue') return { type: 'answer', vals: [['bright', 'round', 'big', 'fast', 'soft', 'old'][seat % 6]] };
  return Math.random() < 0.6 ? { type: 'answer', vals: [g.word] } : { type: 'pass' };
}

export function viewFor(g, seat) {
  const G = guesser(g), me = seat === G;
  const v = { phase: g.phase, moveId: g.moveId, left: (g.phase === 'clue' && !me) || (g.phase === 'guess' && me) ? left(g) : 0, hud: [['Found', `${g.got}`], ['Cards left', g.cardsLeft]] };
  const card = { kicker: 'The secret word', big: g.word };
  if (g.phase === 'clue') v.ui = me ? { k: 'wait', title: 'You’re guessing!', sub: 'Don’t look at anyone’s phone 🙈', note: 'The clues will appear on the table.' }
    : g.done[seat] ? { k: 'wait', title: `Clue in: “${g.clues[seat]}” ✓`, sub: `Waiting for ${waiting(g, writers(g)).length} more…`, card }
      : { k: 'fields', key: 'c' + g.round, title: `Give @${G}@ a one-word clue`, sub: 'If someone writes the same clue, both get crossed out', myturn: true, card, fields: [{ ph: 'One word…', max: 24, value: g.drafts[seat] || '' }], submit: 'Hand it in', need: 1 };
  else if (g.phase === 'guess') v.ui = me ? { k: 'fields', key: 'g' + g.round, title: 'What’s the word?', sub: 'Read the clues on the table · one guess (a wrong guess costs a card)', myturn: true, buzz: true, fields: [{ ph: 'I think it’s…', max: 30 }], submit: 'Guess', buttons: [{ type: 'pass', label: 'Pass (no penalty)' }] }
    : { k: 'wait', title: `@${G}@ is guessing…`, sub: 'No hints! 🤐', card };
  else if (g.phase === 'result') v.ui = { k: 'wait', title: g.res.kind === 'right' ? '✓ Got it!' : g.res.kind === 'wrong' ? `✗ Not “${g.res.guess}”` : 'Passed', sub: `The word was ${g.word}` };
  else if (g.phase === 'over') v.ui = { k: 'wait', title: `${g.got} of ${g.settings.cards}!`, sub: 'Look at the table to play again' };
  return v;
}
