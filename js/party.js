// Shared pieces for the phone party games (List Off, Word Bluff, Trivia Wheel, Top Answers…):
// seating, shuffling, answer matching and a "who still has to answer" helper.
export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const seatsOf = players => players.map((p, i) => (p ? i : -1)).filter(i => i >= 0);

// The basic shape every party game starts from.
export function base(settings, players, defaults) {
  const g = { settings: { ...defaults, ...settings }, seats: players.map(p => !!p), annId: 0, moveId: 0 };
  g.order = seatsOf(players);
  g.score = g.seats.map(() => 0);
  return g;
}
export const announce = (g, seat, text) => { g.announce = { id: ++g.annId, seat, text }; };
export const bump = g => { g.moveId++; };

// Two teams, alternating around the table.
export function teams(g) {
  g.team = g.seats.map(() => null);
  g.order.forEach((s, i) => { g.team[s] = i % 2; });
  g.members = [0, 1].map(t => g.order.filter(s => g.team[s] === t));
  g.scores = [0, 0];
}
export const TEAMS = ['Team Ruby', 'Team Teal'];

// A deck of indexes that refills itself when it runs out.
export function deal(g, key, n) {
  g.decks = g.decks || {};
  if (!g.decks[key]?.length) g.decks[key] = shuffle([...Array(n).keys()]);
  return g.decks[key].pop();
}

// Answers: lower case, no accents, punctuation or leading "the/a/an".
export const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const core = t => norm(t).replace(/^(the|a|an) /, '').replace(/s$/, '');
const lev = (a, b) => {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
// Does a typed guess match an answer (with its alternative spellings)? Small typos are forgiven.
export function same(guess, answers) {
  const g = core(guess);
  if (!g) return false;
  return [].concat(answers).some(a => {
    const c = core(a);
    if (c === g) return true;
    if (c.length >= 5 && lev(c, g) <= (c.length >= 8 ? 2 : 1)) return true;
    // "golden retriever" for "retriever", "pizza" for "pepperoni pizza"
    return g.length >= 4 && (c.split(' ').includes(g) || g.split(' ').includes(c));
  });
}

export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Players who haven't answered yet in a phase where everyone answers at once.
export const waiting = (g, set = g.order) => set.filter(s => !g.done?.[s]);
export const cleanText = (t, n = 60) => String(t || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
// End of game: highest score wins (several on a tie).
export function finish(g) {
  const top = Math.max(...g.order.map(s => g.score[s]));
  g.winners = g.order.filter(s => g.score[s] === top);
  g.winner = g.winners[0];
  g.phase = 'over';
  g.moveId++;
}
// A sound for the table to play once: 'ding', 'buzzer', 'chime', 'sad' or 'thud'.
export const sfx = (g, s) => { g.sfx = { id: (g.sfx?.id || 0) + 1, s }; };
// Milliseconds left on the clock, for the phones (whose own clocks may not agree with the table's).
export const left = g => (g.endAt ? Math.max(0, g.endAt - Date.now()) : 0);
