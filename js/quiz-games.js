// The quiz-show games: each is a question source plus a few rules for the quiz kit.
import { quizEngine } from './quizkit.js?v=68';
import { shuffle, pick } from './party.js?v=68';
import { COUNTRIES, flagImg, TRUE_FALSE, EMOJI, BIGGER, RIDDLES, ODD_ONE, ANIMALS, PROVERBS, EVENTS, OPPOSITES, CLUES } from './quiz-data.js?v=68';
import { CATS, Q as TRIVIA } from './trivia-bank.js?v=68';
import { LISTS } from './sketch-words.js?v=68';

const R = n => Math.floor(Math.random() * n);
const others = (list, right, n, key = x => x) => shuffle(list.filter(x => key(x) !== key(right))).slice(0, n);
const mc = (q, right, wrongs, extra = {}) => ({ q, opts: [right, ...wrongs], a: 0, ...extra });
const WORDS = [...new Set([...LISTS.easy, ...LISTS.medium])].filter(w => /^[a-z]{4,9}$/.test(w));
const trivia = () => { const c = pick(CATS), row = pick(TRIVIA[c.id]); return { q: row[0], opts: row.slice(1, 5), a: 0, kicker: `${c.icon} ${c.name}` }; };

const COLORS = [['RED', '#e8473c'], ['BLUE', '#3d8be8'], ['GREEN', '#3fb35c'], ['YELLOW', '#f2c230'], ['PURPLE', '#a05ad8'], ['ORANGE', '#f08a2a']];
const COUNT_EMOJI = ['🍎', '⭐', '🐟', '🎈', '🍩', '🐞', '🌸', '⚽'];
const FLASH_EMOJI = '🍎 🍌 🍇 🍓 🥕 🌽 🍄 🌵 🌻 🌙 ⭐ ⚡ ❄️ 🔥 🌈 ☂️ ⚓ 🚲 🚗 ✈️ 🚀 ⛵ 🎈 🎁 🎸 🎺 🥁 🎲 🧩 ⚽ 🏀 🎯 🔑 💡 ⏰ ✂️ 📌 📚 🔔 🎩 👓 👑 💎 🐶 🐱 🐸 🐢 🐙 🦋 🐝 🦉'.split(' ');
const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

// Number puzzles: "2, 4, 6, 8, ?"
function sequence() {
  const k = R(6), a = 1 + R(9), d = 2 + R(7);
  let s;
  if (k === 0) s = Array.from({ length: 5 }, (_, i) => a + d * i);
  else if (k === 1) s = Array.from({ length: 5 }, (_, i) => a * 2 ** i);
  else if (k === 2) s = Array.from({ length: 5 }, (_, i) => (i + a) ** 2);
  else if (k === 3) { s = [a, a + 1]; while (s.length < 5) s.push(s[s.length - 1] + s[s.length - 2]); }
  else if (k === 4) s = Array.from({ length: 5 }, (_, i) => 100 - d * i - a);
  else s = Array.from({ length: 5 }, (_, i) => (i % 2 ? a * 10 + i : a + i * d));
  return { q: 'What comes next?', big: `${s.slice(0, 4).join(', ')}, ?`, a: String(s[4]) };
}
function arithmetic() {
  const k = R(4);
  let x, y, ans, sym;
  if (k === 0) { x = 12 + R(88); y = 12 + R(88); ans = x + y; sym = '+'; }
  else if (k === 1) { x = 40 + R(160); y = 5 + R(x - 5); ans = x - y; sym = '−'; }
  else if (k === 2) { x = 3 + R(10); y = 3 + R(10); ans = x * y; sym = '×'; }
  else { y = 2 + R(10); ans = 2 + R(12); x = y * ans; sym = '÷'; }
  const wrong = [...new Set([ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ans * 2].filter(n => n !== ans && n >= 0))];
  return mc('Quick! What’s the answer?', String(ans), shuffle(wrong).slice(0, 3).map(String), { big: `${x} ${sym} ${y}` });
}
function scatter(n, m, a, b) {
  // n of emoji a and m of emoji b at random spots (avoiding heavy overlap).
  const spots = shuffle([...Array(48).keys()]).slice(0, n + m);
  const items = shuffle([...Array(n).fill(a), ...Array(m).fill(b)]);
  return `<div class="qz-scatter">${items.map((e, i) => `<span style="left:${(spots[i] % 8) * 12 + 3 + R(5)}%;top:${Math.floor(spots[i] / 8) * 15 + 3 + R(6)}%;transform:rotate(${R(50) - 25}deg)">${e}</span>`).join('')}</div>`;
}

export const QUIZ = {
  flagfrenzy: quizEngine(() => { const c = pick(COUNTRIES); return mc('Which country’s flag is this?', c[0], others(COUNTRIES, c, 3, x => x[0]).map(x => x[0]), { big: ' ', bigHTML: flagImg(c[1]) }); }, { phoneBig: false, secs: 15, kicker: () => '🏳️ Flags' }),
  capitalquest: quizEngine(() => { const c = pick(COUNTRIES); return mc(`What is the capital of ${c[0]}?`, c[2], others(COUNTRIES, c, 3, x => x[2]).map(x => x[2])); }, { kicker: () => '🏛️ Capitals' }),
  trueorfalse: quizEngine(() => { const [t, v] = pick(TRUE_FALSE); return { q: t, opts: ['True', 'False'], a: v ? 0 : 1, fixed: true }; }, { secs: 12, kicker: () => '✅ True or false?' }),
  emojiphrase: quizEngine(() => { const [e, a] = pick(EMOJI); return { q: 'What phrase or thing is this?', big: e, a }; }, { mode: 'type', secs: 30, kicker: () => '🧩 Emoji puzzle' }),
  numbercrunch: quizEngine(arithmetic, { secs: 10, rounds: 15, kicker: () => '🧮 Mental maths' }),
  whichismore: quizEngine(() => { const [q, a, b, i, note] = pick(BIGGER); return { q, opts: [a, b], a: i, note, fixed: false }; }, { secs: 12, kicker: () => '⚖️ This or that' }),
  missingvowels: quizEngine(() => {
    const kind = R(3), word = kind === 0 ? pick(COUNTRIES)[0] : kind === 1 ? pick(COUNTRIES)[2] : pick(WORDS);
    return { q: kind === 0 ? 'A country' : kind === 1 ? 'A capital city' : 'A thing you could draw', big: word.toUpperCase().replace(/[AEIOUÁÉÍÓÚ]/g, '').replace(/[^A-Z]/g, ' ').replace(/\s+/g, ' ').trim(), a: word };
  }, { mode: 'type', secs: 25, kicker: () => '🔤 Missing vowels' }),
  wordscramble: quizEngine(() => { const w = pick(WORDS); let s; do s = shuffle([...w]).join(''); while (s === w); return { q: 'Unscramble the word', big: s.toUpperCase(), a: w }; }, { mode: 'type', secs: 30, kicker: () => '🔀 Scramble' }),
  riddleme: quizEngine(() => { const [q, a] = pick(RIDDLES); return { q, a }; }, { mode: 'type', secs: 40, rounds: 8, kicker: () => '❓ Riddle' }),
  doesntbelong: quizEngine(() => { const [items, why] = pick(ODD_ONE); return { q: 'Which one doesn’t belong?', opts: items, a: 0, note: why }; }, { secs: 15, kicker: () => '🧐 Odd one out' }),
  wildfacts: quizEngine(() => { const r = pick(ANIMALS); return { q: r[0], opts: r.slice(1), a: 0 }; }, { kicker: () => '🦁 Animal facts' }),
  finishthesaying: quizEngine(() => { const r = pick(PROVERBS); return { q: r[0], opts: r.slice(1), a: 0 }; }, { secs: 15, kicker: () => '📜 Sayings' }),
  continentquest: quizEngine(() => { const c = pick(COUNTRIES); const all = ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania']; return mc(`Which continent is ${c[0]} in?`, c[3], others(all, c[3], 3)); }, { secs: 12, kicker: () => '🗺️ Continents' }),
  colorclash: quizEngine(() => {
    const [word] = pick(COLORS), ink = pick(COLORS.filter(c => c[0] !== word));
    return mc('What COLOUR is the word written in? (not what it says!)', ink[0], others(COLORS, ink, 3, x => x[0]).map(x => x[0]), { big: word, bigHTML: `<span class="qz-stroop" style="color:${ink[1]}">${word}</span>` });
  }, { secs: 6, rounds: 15, phoneBig: false, revealMs: 3000, kicker: () => '🎨 Colour clash' }),
  countit: quizEngine(() => {
    const [a, b] = shuffle([...COUNT_EMOJI]), n = 6 + R(14), m = 4 + R(10);
    return { q: `How many ${a} were there?`, show: scatter(n, m, a, b), a: n };
  }, { mode: 'closest', flash: 3500, secs: 15, kicker: () => '👀 Count it' }),
  lastonestanding: quizEngine(trivia, { elim: true, rounds: 30, secs: 15, kicker: q => q.kicker || 'Trivia' }),
  buzzin: quizEngine(trivia, { firstOnly: true, rounds: 15, secs: 15, kicker: q => q.kicker || 'Trivia' }),
  whatyear: quizEngine(() => { const [e, y] = pick(EVENTS); return { q: `In what year? ${e}`, a: y }; }, { mode: 'closest', secs: 25, ph: 'Year', kicker: () => '📅 What year?' }),
  nextinline: quizEngine(sequence, { mode: 'type', secs: 25, ph: 'Number', kicker: () => '🔢 Sequences' }),
  opposites: quizEngine(() => { const r = pick(OPPOSITES); return { q: `What is the opposite of “${r[0]}”?`, opts: r.slice(1), a: 0 }; }, { secs: 12, kicker: () => '↔️ Opposites' }),
  cluecrack: quizEngine(() => { const [c, a] = pick(CLUES); return { q: c, big: `${a.replace(/[a-z]/g, '_ ').trim()}  (${a.replace(/ /g, '').length})`, a }; }, { mode: 'type', secs: 30, kicker: () => '✏️ Crossword clue' }),
  sortitout: quizEngine(() => {
    if (R(3) === 0) { const p = shuffle(PLANETS.map((n, i) => [n, i])).slice(0, 4).sort((x, y) => x[1] - y[1]); return { q: 'Put these planets in order from the Sun outward', opts: p.map(x => x[0]), a: [0, 1, 2, 3] }; }
    const e = shuffle([...EVENTS]); const four = [];
    for (const x of e) { if (four.every(f => f[1] !== x[1])) four.push(x); if (four.length === 4) break; }
    four.sort((x, y) => x[1] - y[1]);
    return { q: 'Put these in order — earliest first', opts: four.map(x => x[0]), a: [0, 1, 2, 3], note: four.map(x => x[1]).join(' · ') };
  }, { mode: 'order', secs: 40, rounds: 8, kicker: () => '📶 Sort it out' }),
  flashmemory: quizEngine(() => {
    const set = shuffle([...FLASH_EMOJI]), shown = set.slice(0, 7), missing = set[7];
    return mc('Which of these was NOT on the table?', missing, shuffle(shown).slice(0, 3), { show: `<div class="qz-row">${shown.map(e => `<span>${e}</span>`).join('')}</div>` });
  }, { flash: 4000, secs: 12, kicker: () => '🧠 Flash memory' }),
};
