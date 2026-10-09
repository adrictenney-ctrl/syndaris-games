// Scribble Chain: everyone starts a sketchbook with a secret word. Books pass around the
// table: the next player draws the word, the next guesses what the drawing is, the next draws
// that guess, and so on — everyone working at once — until each book comes home. Then the
// table reveals every chain, page by page, to see how far the word drifted.
import { LISTS } from './sketch-words.js?v=68';

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickWords = n => shuffle([...LISTS.easy, ...LISTS.medium]).slice(0, n);

export function createGame(settings, players) {
  const g = { settings: { draw: 80, guess: 45, ...settings }, seats: players.map(p => !!p), annId: 0, stepId: 0 };
  g.order = g.seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const words = pickWords(g.order.length * 3);
  g.books = g.order.map((owner, i) => ({ owner, pages: [], offer: words.slice(i * 3, i * 3 + 3) }));
  g.step = 0;
  g.phase = 'write';
  g.deadline = 0;
  g.done = {};
  return g;
}

const n = g => g.order.length;
// Which book is this seat working on at this step? With an even number of players everyone
// draws their own word first, so the book never comes back to its owner for the last guess.
const shift = g => (n(g) % 2 ? g.step : Math.max(0, g.step - 1));
export const bookFor = (g, seat) => { const i = g.order.indexOf(seat); return i < 0 ? -1 : (i - shift(g) + n(g) * 4) % n(g); };
export const stepType = k => (k === 0 ? 'word' : k % 2 ? 'draw' : 'guess');
// Word + (n − 1) passes; with an even count the owner's own drawing adds a page so it still ends on a guess.
export const totalSteps = g => (n(g) % 2 ? n(g) : n(g) + 1);

function startStep(g) {
  g.done = {};
  g.drafts = {};
  g.stepId++;
  const t = stepType(g.step);
  g.phase = t === 'word' ? 'write' : t;
  g.deadline = t === 'word' ? 0 : Date.now() + (t === 'draw' ? g.settings.draw : g.settings.guess) * 1000;
}

function finishStep(g) {
  // Anyone who ran out of time hands in whatever they had so far.
  for (const s of g.order) {
    if (g.done[s]) continue;
    const b = g.books[bookFor(g, s)], d = (g.drafts || {})[s] || {};
    b.pages.push(stepType(g.step) === 'draw' ? { type: 'draw', by: s, strokes: d.strokes || [] } : { type: 'guess', by: s, text: d.text || '' });
  }
  g.step++;
  if (g.step >= totalSteps(g)) { g.phase = 'reveal'; g.revealBook = 0; g.revealPage = 0; g.nextAt = Date.now() + 4500; return; }
  startStep(g);
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (!g.order.includes(seat)) return "You're not in this game";
  if (a.type === 'next' || a.type === 'back' || a.type === 'pause') {
    if (g.phase !== 'reveal') return 'Not yet';
    if (a.type === 'next') nextPage(g);
    else if (a.type === 'back') prevPage(g);
    else { g.paused = !g.paused; g.nextAt = Date.now() + 6000; }
    return null;
  }
  if (g.done[seat]) return 'Already handed in';
  const b = g.books[bookFor(g, seat)];
  if (g.phase === 'write') {
    const w = String(a.word || '').trim().slice(0, 40);
    if (!w) return 'Pick a word';
    b.pages.push({ type: 'word', by: seat, text: w });
  } else if (g.phase === 'draw') {
    const strokes = cleanStrokes(a.strokes);
    b.pages.push({ type: 'draw', by: seat, strokes });
  } else if (g.phase === 'guess') {
    b.pages.push({ type: 'guess', by: seat, text: String(a.text || '').trim().slice(0, 60) });
  } else return 'Not now';
  g.done[seat] = true;
  if (g.order.every(s => g.done[s])) finishStep(g);
  return null;
}

const cleanStrokes = st => (Array.isArray(st) ? st.slice(0, 400).map(x => ({ c: x.c | 0, w: x.w | 0, p: (Array.isArray(x.p) ? x.p : []).slice(0, 2000).map(v => Math.round(v) || 0) })) : []);
// Work in progress, sent quietly from the phones, so a page still has something on it when the clock runs out.
export function draft(g, seat, d) {
  if (!g.order.includes(seat) || g.done[seat] || !(g.phase === 'draw' || g.phase === 'guess')) return false;
  g.drafts = g.drafts || {};
  g.drafts[seat] = g.phase === 'draw' ? { strokes: cleanStrokes(d.strokes) } : { text: String(d.text || '').trim().slice(0, 60) };
  return true;
}

function prevPage(g) {
  if (g.revealPage > 0) g.revealPage--;
  else if (g.revealBook > 0) { g.revealBook--; g.revealPage = g.books[g.revealBook].pages.length - 1; }
  g.nextAt = Date.now() + 9000;      // a little longer to look again
}

function nextPage(g) {
  const b = g.books[g.revealBook];
  if (g.revealPage < b.pages.length - 1) g.revealPage++;
  else if (g.revealBook < g.books.length - 1) { g.revealBook++; g.revealPage = 0; }
  else { g.phase = 'over'; return; }
  g.nextAt = Date.now() + (g.books[g.revealBook].pages[g.revealPage]?.type === 'draw' ? 6000 : 4500);
}

export function timer(g) {
  if ((g.phase === 'draw' || g.phase === 'guess') && g.deadline) return { ms: Math.max(0, g.deadline - Date.now()) + 2500, run: () => finishStep(g) };
  if (g.phase === 'reveal' && !g.paused) return { ms: Math.max(0, g.nextAt - Date.now()) + 20, run: () => nextPage(g) };
  return null;
}

export function viewFor(g, seat) {
  const v = { phase: g.phase, step: g.step, steps: totalSteps(g), stepId: g.stepId, deadline: g.deadline, left: g.deadline ? g.deadline - Date.now() : 0, order: g.order, done: g.done[seat] || false, waiting: g.order.filter(s => !g.done[s]).length };
  const bi = bookFor(g, seat);
  if (bi >= 0 && g.phase === 'write') v.offer = g.books[bi].offer;
  if (bi >= 0 && (g.phase === 'draw' || g.phase === 'guess')) {
    const prev = g.books[bi].pages[g.books[bi].pages.length - 1];
    v.prev = prev ? { type: prev.type, text: prev.text, strokes: prev.type === 'draw' ? prev.strokes : undefined } : null;
  }
  if (g.phase === 'reveal') { v.revealOwner = g.books[g.revealBook].owner; v.revealBook = g.revealBook; v.revealPage = g.revealPage; v.paused = !!g.paused; v.canBack = g.revealBook > 0 || g.revealPage > 0; }
  return v;
}
