// Word games: Five Letters, Word Gallows, Long Word, Target Number, Speed Typist, Word Chain,
// Ghost Letters, Slow Reveal, Acro Race, Fib Finder. Phones hold your guesses and answers; the
// table shows the board, the clock and the reveal. The word list (dict.js) is loaded by the table.
import { base, shuffle, pick, same, core, norm, cleanText, sfx, left, waiting, announce, finish } from './party.js?v=68';
import { loadDict, isWord, hasPrefix, randomWord } from './dict.js?v=68';
import { FIVE, GALLOWS, SENTENCES, FIBS, REVEAL } from './word-data.js?v=68';

const R = n => Math.floor(Math.random() * n);
const ABC = 'abcdefghijklmnopqrstuvwxyz'.split('');
const topWin = g => { const top = Math.max(...g.order.map(s => g.score[s])); g.winners = g.order.filter(s => g.score[s] === top); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; };
const nextRoundOr = (g, start) => (g.round >= g.settings.rounds ? topWin(g) : start(g));

// ---------------------------------------------------------------- Five Letters
// Colours for a guess: g = right place, y = in the word elsewhere, x = not in it.
export function marks(guess, word) {
  const res = Array(5).fill('x'), left2 = {};
  for (let i = 0; i < 5; i++) { if (guess[i] === word[i]) res[i] = 'g'; else left2[word[i]] = (left2[word[i]] || 0) + 1; }
  for (let i = 0; i < 5; i++) if (res[i] !== 'g' && left2[guess[i]] > 0) { res[i] = 'y'; left2[guess[i]]--; }
  return res.join('');
}
export const fiveletters = (() => {
  const E = {};
  E.createGame = (s, p) => { loadDict(); const g = base(s, p, { rounds: 3, secs: 180 }); g.round = 0; start(g); return g; };
  function start(g) { g.round++; g.word = pick(FIVE); g.rows = g.seats.map(() => []); g.solvedAt = {}; g.done = {}; g.phase = 'play'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; }
  function end(g) {
    const order = Object.keys(g.solvedAt).map(Number).sort((a, b) => g.solvedAt[a] - g.solvedAt[b]);
    g.gain = {};
    for (const s of g.order) { const n = g.rows[s].length; g.gain[s] = order.includes(s) ? 7 - n + (order[0] === s ? 2 : 0) : 0; g.score[s] += g.gain[s]; }
    g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); sfx(g, 'chime'); g.moveId++;
  }
  E.collecting = g => g.phase === 'play';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'play' ? waiting(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 2500 + Math.random() * 3000;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'play' || a.type !== 'answer') return 'Not now';
    if (g.done[seat]) return 'You’re done this round';
    const w = norm((a.vals || [])[0]).replace(/ /g, '');
    if (w.length !== 5) return 'Five letters, please';
    if (!FIVE.includes(w) && !isWord(w)) return 'Not in the word list';
    const m = marks(w, g.word);
    g.rows[seat].push({ w, m });
    if (m === 'ggggg') { g.solvedAt[seat] = Date.now(); g.done[seat] = true; announce(g, seat, `Solved in ${g.rows[seat].length}! 🟩`); sfx(g, 'ding'); }
    else if (g.rows[seat].length >= 6) g.done[seat] = true;
    if (!waiting(g).length) end(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'play') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => end(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 7000 - Date.now()), run: () => nextRoundOr(g, start) };
    return null;
  };
  E.botAction = (g, seat) => {
    // A simple solver: a common word that fits everything learned so far.
    const ok = FIVE.filter(w => g.rows[seat].every(r => marks(r.w, w) === r.m));
    return { type: 'answer', vals: [ok.length ? pick(ok) : pick(FIVE)] };
  };
  const grid = (rows, letters) => `<div class="fl-grid">${Array.from({ length: 6 }, (_, i) => `<div>${Array.from({ length: 5 }, (_, j) => { const r = rows[i]; return `<i class="${r ? r.m[j] : ''}">${r && letters ? r.w[j].toUpperCase() : ''}</i>`; }).join('')}</div>`).join('')}</div>`;
  E.grid = grid;
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'play' ? left(g) : 0, hud: [['Score', g.score[seat] ?? 0], ['Word', `${g.round}/${g.settings.rounds}`]] };
    const rows = g.rows[seat] || [];
    const used = {};
    for (const r of rows) [...r.w].forEach((c, i) => { const m = r.m[i]; if (m === 'g' || (m === 'y' && used[c] !== 'g') || !used[c]) used[c] = m === 'x' && used[c] ? used[c] : m; });
    const keys = `<div class="fl-keys">${ABC.map(c => `<i class="${used[c] || ''}">${c}</i>`).join('')}</div>`;
    if (g.phase === 'play') v.ui = g.done[seat] ? { k: 'wait', title: g.solvedAt[seat] ? `Solved in ${rows.length}! 🎉` : 'Out of guesses', sub: `Waiting for ${waiting(g).length} more…`, html: grid(rows, true) }
      : { k: 'fields', key: 'g' + g.round + ':' + rows.length, title: `Guess ${rows.length + 1} of 6`, sub: '🟩 right spot · 🟨 wrong spot', myturn: true, html: grid(rows, true) + keys, fields: [{ ph: 'five letters', max: 5 }], submit: 'Guess', need: 1 };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.gain[seat] ? `+${g.gain[seat]}` : 'Not this time', sub: `The word was ${g.word.toUpperCase()}`, html: grid(rows, true) };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Word wizard!' : 'Game over', sub: 'Look at the table to play again' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Word Gallows (everyone picks a letter at once)
export const wordgallows = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 4, secs: 25 }); g.round = 0; g.deck = shuffle(GALLOWS.map((_, i) => i)); start(g); return g; };
  function start(g) { g.round++; [g.cat, g.word] = GALLOWS[g.deck.pop()]; g.called = []; g.misses = 0; g.solved = -1; g.lockSolve = {}; next(g); }
  function next(g) { g.pickL = {}; g.solving = {}; g.done = {}; g.phase = 'pick'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; }
  const hidden = g => [...new Set([...g.word].filter(c => /[a-z]/.test(c) && !g.called.includes(c)))];
  E.masked = g => [...g.word].map(c => (/[a-z]/.test(c) && !g.called.includes(c) && g.phase !== 'over' && g.phase !== 'end' ? '_' : c)).join('');
  function resolve(g) {
    g.last = {};
    const letters = [...new Set(Object.values(g.pickL))];
    for (const L of letters) {
      if (g.called.includes(L)) continue;
      g.called.push(L);
      const n = [...g.word].filter(c => c === L).length;
      const by = g.order.filter(s => g.pickL[s] === L);
      g.last[L] = { n, by };
      if (n) for (const s of by) g.score[s] += n; else g.misses++;
    }
    if (g.solved >= 0 || !hidden(g).length || g.misses >= 7) return finishWord(g);
    g.phase = 'show'; g.endAt = 0; g.showAt = Date.now(); sfx(g, g.misses >= 5 ? 'sad' : 'ding'); g.moveId++;
  }
  function finishWord(g) { g.phase = 'end'; g.endShown = Date.now(); sfx(g, g.misses >= 7 ? 'buzzer' : 'chime'); g.moveId++; }
  E.collecting = g => g.phase === 'pick';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'pick' ? waiting(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'pick') return 'Not now';
    if (g.done[seat]) return 'Already picked';
    if (a.type === 'solvemode') { if (g.lockSolve[seat]) return 'You already tried to solve this one'; g.solving[seat] = !g.solving[seat]; g.moveId++; return null; }
    if (a.type === 'answer') {
      const t = cleanText((a.vals || [])[0], 40);
      if (!t) return 'Type the answer';
      if (norm(t) === norm(g.word)) { g.score[seat] += 3 + hidden(g).length; g.solved = seat; g.called = [...new Set([...g.called, ...hidden(g)])]; announce(g, seat, 'Solved it! 🎉'); }
      else { g.score[seat] -= 2; g.lockSolve[seat] = true; announce(g, seat, `“${t}” ✗`); }
      g.done[seat] = true;
      if (g.solved >= 0 || !waiting(g).length) resolve(g); else g.moveId++;
      return null;
    }
    const L = String(a.v || '').toLowerCase();
    if (!ABC.includes(L) || g.called.includes(L)) return 'Pick a letter that hasn’t been called';
    g.pickL[seat] = L;
    g.done[seat] = true;
    if (!waiting(g).length) resolve(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'pick') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => resolve(g) };
    if (g.phase === 'show') return { ms: Math.max(0, g.showAt + 3500 - Date.now()), run: () => next(g) };
    if (g.phase === 'end') return { ms: Math.max(0, g.endShown + 6000 - Date.now()), run: () => nextRoundOr(g, start) };
    return null;
  };
  E.botAction = g => { const pool = 'etaoinshrdlucmfwypvbgkqjxz'.split('').filter(c => !g.called.includes(c)); return { type: 'pick', v: pool[Math.min(pool.length - 1, R(4))] }; };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'pick' ? left(g) : 0, hud: [['Score', g.score[seat] ?? 0], ['Misses', `${g.misses}/7`]] };
    const card = { kicker: g.cat, big: E.masked(g).toUpperCase().split('').join(' '), cls: 'ss-card' };
    if (g.phase === 'pick') v.ui = g.done[seat] ? { k: 'wait', title: g.pickL[seat] ? `You picked ${g.pickL[seat].toUpperCase()} ✓` : 'Locked in', sub: `Waiting for ${waiting(g).length} more…`, card }
      : g.solving[seat] ? { k: 'fields', key: 's' + g.round, title: 'Solve it!', sub: 'Right: big bonus · wrong: −2', myturn: true, card, fields: [{ ph: 'The answer…', max: 40 }], submit: 'Solve', need: 1, buttons: [{ type: 'solvemode', label: '‹ Back to letters' }] }
        : { k: 'pick', key: 'p' + g.round + ':' + g.called.length, title: 'Pick a letter', sub: '1 point for every time it appears', myturn: true, buzz: true, card, grid: 7, options: ABC.map(c => ({ v: c, label: c.toUpperCase(), dis: g.called.includes(c), cls: 'ss-key' })), buttons: [{ type: 'solvemode', label: '💡 Solve instead', dis: !!g.lockSolve[seat] }] };
    else if (g.phase === 'show') v.ui = { k: 'wait', title: g.pickL[seat] ? (g.last[g.pickL[seat]]?.n ? `${g.pickL[seat].toUpperCase()} ×${g.last[g.pickL[seat]].n}! +${g.last[g.pickL[seat]].n}` : `No ${g.pickL[seat].toUpperCase()}`) : '…', sub: '', card };
    else if (g.phase === 'end') v.ui = { k: 'wait', title: g.misses >= 7 ? '💀 Hanged!' : g.solved === seat ? 'You solved it! 🎉' : 'Solved!', sub: `It was “${g.word}”` };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Long Word / Target Number / Speed Typist (answer-at-once rounds)
function answerGame({ defaults, setup, check, score, bot, ui, after }) {
  const E = {};
  E.createGame = (s, p) => { loadDict(); const g = base(s, p, defaults); g.round = 0; start(g); return g; };
  function start(g) { g.round++; setup(g); g.ans = {}; g.done = {}; g.phase = 'play'; g.startAt = Date.now(); g.endAt = g.startAt + g.settings.secs * 1000; g.moveId++; }
  function end(g) { g.gain = {}; for (const s of g.order) g.gain[s] = 0; score(g); for (const s of g.order) g.score[s] += g.gain[s]; g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); sfx(g, 'chime'); g.moveId++; }
  E.collecting = g => g.phase === 'play';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'play' ? waiting(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 3000 + Math.random() * 5000;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'play' || a.type !== 'answer') return 'Not now';
    if (g.done[seat]) return 'Already in';
    const t = cleanText((a.vals || [])[0], 120);
    const r = check(g, t);
    if (typeof r === 'string') return r;
    g.ans[seat] = { t, v: r, at: Date.now() };
    g.done[seat] = true;
    if (!waiting(g).length) end(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'play') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => end(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 7000 - Date.now()), run: () => nextRoundOr(g, start) };
    return null;
  };
  E.botAction = (g, s) => ({ type: 'answer', vals: [bot(g, s)] });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'play' ? left(g) : 0, hud: [['Score', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
    if (g.phase === 'play') v.ui = g.done[seat] ? { k: 'wait', title: `In: “${g.ans[seat].t}” ✓`, sub: `Waiting for ${waiting(g).length} more…` } : { myturn: true, buzz: true, key: 'r' + g.round, ...ui(g, seat) };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.gain[seat] ? `+${g.gain[seat]}` : 'No points this round', sub: after(g, seat) };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
    return v;
  };
  return E;
}
const fits = (word, letters) => { const pool = [...letters]; for (const c of word) { const i = pool.indexOf(c); if (i < 0) return false; pool.splice(i, 1); } return true; };
export const longword = answerGame({
  defaults: { rounds: 5, secs: 40 },
  setup(g) {
    const V = 'aaeeeiioou', C = 'bbccddffgghjklllmmnnnpprrrrsssstttttvwyz';
    const nv = 3 + R(2);
    g.letters = shuffle([...shuffle([...V]).slice(0, nv), ...shuffle([...C]).slice(0, 9 - nv)]);
  },
  check(g, t) { const w = norm(t).replace(/ /g, ''); if (w.length < 3) return 'At least three letters'; if (!fits(w, g.letters)) return 'Use only the letters on the table'; if (!isWord(w)) return 'Not in the word list'; return w.length; },
  score(g) { const best = Math.max(0, ...Object.values(g.ans).map(a => a.v)); for (const [s, a] of Object.entries(g.ans)) g.gain[s] = a.v + (a.v === best ? 3 : 0); g.best = best; },
  bot: g => randomWord(3, 7, w => fits(w, g.letters)) || g.letters.slice(0, 3).join(''),
  ui: g => ({ k: 'fields', title: 'Your longest word', sub: `Letters: ${g.letters.join(' ').toUpperCase()}`, card: { big: g.letters.join(' ').toUpperCase(), cls: 'ss-card' }, fields: [{ ph: 'word', max: 9 }], submit: 'Submit', need: 1 }),
  after: (g, s) => (g.ans[s] ? `Your word: ${norm(g.ans[s].t).toUpperCase()} (${g.ans[s].v})` : 'No word this time'),
});

// Target Number: + − × ÷ and brackets, each number once, whole numbers only along the way.
export function evalExpr(src, nums) {
  const toks = String(src).replace(/x|×/gi, '*').replace(/÷/g, '/').replace(/−/g, '-').match(/\d+|[-+*/()]/g);
  if (!toks || toks.join('') !== String(src).replace(/x|×/gi, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s+/g, '')) return 'Use numbers and + − × ÷ ( ) only';
  const pool = [...nums];
  let i = 0;
  const err = m => { throw new Error(m); };
  const prim = () => {
    const t = toks[i++];
    if (t === '(') { const v = expr(); if (toks[i++] !== ')') err('Missing )'); return v; }
    if (/^\d+$/.test(t)) { const n = Number(t), k = pool.indexOf(n); if (k < 0) err(`${n} isn’t available (each number once)`); pool.splice(k, 1); return n; }
    return err('That doesn’t add up');
  };
  const term = () => { let v = prim(); while (toks[i] === '*' || toks[i] === '/') { const op = toks[i++], r = prim(); if (op === '*') v *= r; else { if (!r || v % r) err('Divisions must come out whole'); v /= r; } } return v; };
  const expr = () => { let v = term(); while (toks[i] === '+' || toks[i] === '-') { const op = toks[i++], r = term(); v = op === '+' ? v + r : v - r; if (v < 0) err('No negative numbers'); } return v; };
  try { const v = expr(); if (i !== toks.length) err('That doesn’t add up'); return v; } catch (e) { return e.message; }
}
export const targetnumber = answerGame({
  defaults: { rounds: 4, secs: 60 },
  setup(g) {
    const big = shuffle([25, 50, 75, 100]).slice(0, 2), small = Array.from({ length: 4 }, () => 1 + R(10));
    g.nums = [...big, ...small];
    // Build the target from a real calculation so it can be reached.
    let t;
    for (let k = 0; k < 200; k++) {
      const ns = shuffle([...g.nums]); let v = ns[0];
      for (let j = 1; j < 2 + R(4); j++) { const o = R(3); const n = ns[j]; v = o === 0 ? v + n : o === 1 ? v * n : Math.abs(v - n); }
      if (v >= 101 && v <= 999) { t = v; break; }
    }
    g.target = t || 100 + R(400);
  },
  check(g, t) { const v = evalExpr(t, g.nums); return typeof v === 'string' ? v : v; },
  score(g) {
    const d = s => Math.abs(g.ans[s].v - g.target);
    const best = Math.min(...Object.keys(g.ans).map(s => d(s)));
    for (const s of Object.keys(g.ans)) { const x = d(s); g.gain[s] = x === 0 ? 10 : x <= 5 ? 7 : x <= 10 ? 5 : 0; if (x === best) g.gain[s] += 2; }
  },
  bot: g => `${g.nums[0]} + ${g.nums[2]} * ${g.nums[3]}`,
  ui: g => ({ k: 'fields', title: `Make ${g.target}`, sub: `Use ${g.nums.join(', ')} — each once, + − × ÷ ( )`, card: { kicker: 'Target', big: String(g.target), small: g.nums.join('  ·  ') }, fields: [{ ph: 'e.g. (100 - 4) * 3', max: 60 }], submit: 'Submit', need: 1 }),
  after: (g, s) => (g.ans[s] ? `${g.ans[s].t} = ${g.ans[s].v} (target ${g.target})` : `Target was ${g.target}`),
});
const tidy = t => String(t).toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
export const speedtypist = answerGame({
  defaults: { rounds: 6, secs: 30 },
  setup(g) { g.text = pick(SENTENCES); },
  check(g, t) { return tidy(t) === tidy(g.text) ? 1 : 0; },
  score(g) { const right = Object.keys(g.ans).filter(s => g.ans[s].v).sort((a, b) => g.ans[a].at - g.ans[b].at); right.forEach((s, i) => { g.gain[s] = [5, 3, 2][i] || 1; }); g.order2 = right.map(Number); },
  bot: g => (Math.random() < 0.7 ? g.text : 'oops'),
  ui: () => ({ k: 'fields', title: 'Type the sentence on the table!', sub: 'Exactly — fastest wins (capitals and punctuation don’t matter)', fields: [{ ph: 'Type here…', max: 120 }], submit: 'Done!', need: 1 }),
  after: (g, s) => (g.ans[s]?.v ? `#${g.order2.indexOf(s) + 1} to finish` : 'Not quite right'),
});

// ---------------------------------------------------------------- Word Chain (turns; three lives)
export const wordchain = (() => {
  const E = {};
  E.createGame = (s, p) => { loadDict(); const g = base(s, p, { secs: 12 }); g.lives = g.seats.map(x => (x ? 3 : 0)); g.chain = []; g.used = []; g.letter = pick('abcdefghilmnoprstw'.split('')); g.turn = g.order[0]; turn(g); return g; };
  const alive = g => g.order.filter(s => g.lives[s] > 0);
  function turn(g) { g.phase = 'play'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; }
  function nextP(g) { let i = g.order.indexOf(g.turn); do i = (i + 1) % g.order.length; while (!g.lives[g.order[i]]); g.turn = g.order[i]; }
  function miss(g, why) {
    g.lives[g.turn]--;
    announce(g, g.turn, why);
    sfx(g, 'buzzer');
    if (alive(g).length <= 1) { g.order.forEach(s => { g.score[s] = g.lives[s]; }); g.winners = alive(g); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; return; }
    nextP(g); turn(g);
  }
  E.collecting = () => false;
  E.turnSeat = g => (g.phase === 'play' ? g.turn : -1);
  E.pending = g => (g.phase === 'play' ? [g.turn] : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
    const w = norm((a.vals || [])[0]).replace(/ /g, '');
    if (w.length < 3) return 'At least three letters';
    if (w[0] !== g.letter) return `It has to start with ${g.letter.toUpperCase()}`;
    if (g.used.includes(w)) return 'Already used!';
    if (!isWord(w)) return 'Not in the word list';
    g.used.push(w);
    g.chain.push({ s: seat, w });
    g.letter = w[w.length - 1];
    sfx(g, 'ding');
    nextP(g); turn(g);
    return null;
  };
  E.tick = g => (g.phase === 'play' ? { ms: Math.max(0, g.endAt - Date.now()) + 400, run: () => miss(g, '⏰ Too slow!') } : null);
  E.botAction = g => ({ type: 'answer', vals: [randomWord(3, 8, w => w[0] === g.letter && !g.used.includes(w)) || 'zzz'] });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'play' && g.turn === seat ? left(g) : 0, hud: [['Lives', '❤️'.repeat(g.lives[seat] || 0) || '💀'], ['Words', g.chain.length]] };
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Last one talking!' : 'Game over', sub: 'Look at the table to play again' };
    else if (!g.lives[seat]) v.ui = { k: 'wait', title: 'You’re out 💀', sub: 'Watch the chain' };
    else if (g.turn === seat) v.ui = { k: 'fields', key: 't' + g.chain.length + ':' + g.lives.join(''), title: `A word starting with ${g.letter.toUpperCase()}!`, sub: 'Quick — no repeats', myturn: true, buzz: true, card: { big: g.letter.toUpperCase() }, fields: [{ ph: `${g.letter}…`, max: 20 }], submit: 'Go', need: 1 };
    else v.ui = { k: 'wait', title: `@${g.turn}@ needs a ${g.letter.toUpperCase()} word`, sub: g.chain.length ? `Last: ${g.chain[g.chain.length - 1].w}` : 'Get ready' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Ghost Letters
export const ghostletters = (() => {
  const E = {};
  E.createGame = (s, p) => { loadDict(); const g = base(s, p, {}); g.ghost = g.seats.map(() => 0); g.frag = ''; g.turn = g.order[0]; g.prev = -1; g.phase = 'play'; g.endAt = Date.now() + 30000; return g; };
  const alive = g => g.order.filter(s => g.ghost[s] < 5);
  function nextP(g) { let i = g.order.indexOf(g.turn); do i = (i + 1) % g.order.length; while (g.ghost[g.order[i]] >= 5); g.turn = g.order[i]; }
  function lose(g, s, why) {
    g.ghost[s]++;
    g.lost = { s, why, frag: g.frag };
    announce(g, s, `${'GHOST'.slice(0, g.ghost[s])} 👻`);
    sfx(g, 'sad');
    g.phase = 'lost'; g.lostAt = Date.now(); g.endAt = 0; g.moveId++;
  }
  E.collecting = () => false;
  E.turnSeat = g => (g.phase === 'play' ? g.turn : -1);
  E.pending = g => (g.phase === 'play' ? [g.turn] : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
    if (a.type === 'challenge') {
      if (g.prev < 0 || !g.frag) return 'Nothing to challenge yet';
      return hasPrefix(g.frag) ? lose(g, seat, `“${g.frag.toUpperCase()}” can become a word`) : lose(g, g.prev, `No word starts with “${g.frag.toUpperCase()}”`), null;
    }
    const L = String(a.v || '').toLowerCase();
    if (!ABC.includes(L)) return 'Pick a letter';
    g.frag += L;
    if (g.frag.length >= 4 && isWord(g.frag)) return lose(g, seat, `“${g.frag.toUpperCase()}” is a word!`), null;
    g.prev = seat;
    nextP(g);
    g.endAt = Date.now() + 30000;
    g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'play') return { ms: Math.max(0, g.endAt - Date.now()) + 400, run: () => lose(g, g.turn, '⏰ Out of time') };
    if (g.phase === 'lost') return { ms: Math.max(0, g.lostAt + 4500 - Date.now()), run: () => {
      if (alive(g).length <= 1) { g.order.forEach(s => { g.score[s] = 5 - g.ghost[s]; }); g.winners = alive(g); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; return; }
      g.frag = ''; g.prev = -1; g.turn = g.lost.s; if (g.ghost[g.turn] >= 5) nextP(g); g.phase = 'play'; g.endAt = Date.now() + 30000; g.moveId++;
    } };
    return null;
  };
  E.botAction = g => {
    if (g.frag && !hasPrefix(g.frag)) return { type: 'challenge' };
    const ok = shuffle([...ABC]).filter(c => hasPrefix(g.frag + c) && !(g.frag.length + 1 >= 4 && isWord(g.frag + c)));
    return ok.length ? { type: 'pick', v: ok[0] } : g.frag ? { type: 'challenge' } : { type: 'pick', v: 'e' };
  };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'play' && g.turn === seat ? left(g) : 0, hud: [['You', 'GHOST'.slice(0, g.ghost[seat]) || '—'], ['Letters', g.frag.length]] };
    const card = { kicker: 'So far', big: g.frag.toUpperCase() || '…', cls: 'ss-card' };
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You’re no ghost!' : 'Game over', sub: '' };
    else if (g.ghost[seat] >= 5) v.ui = { k: 'wait', title: 'You’re a GHOST 👻', sub: 'Haunt the others from the sidelines', card };
    else if (g.phase === 'lost') v.ui = { k: 'wait', title: g.lost.s === seat ? `You take a letter: ${'GHOST'.slice(0, g.ghost[seat])}` : `@${g.lost.s}@ takes a letter`, sub: g.lost.why };
    else if (g.turn === seat) v.ui = { k: 'pick', key: 'p' + g.frag + g.ghost.join(''), title: 'Add a letter', sub: 'Keep it heading toward a word — but don’t finish one (4+ letters)', myturn: true, buzz: true, card, grid: 7, options: ABC.map(c => ({ v: c, label: c.toUpperCase(), cls: 'ss-key' })), buttons: g.frag && g.prev >= 0 ? [{ type: 'challenge', label: `Challenge @${g.prev}@ — that’s not a word start!` }] : null };
    else v.ui = { k: 'wait', title: `@${g.turn}@ is adding a letter`, sub: '', card };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Slow Reveal
export const slowreveal = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 8 }); g.round = 0; g.deck = shuffle(REVEAL.map((_, i) => i)); start(g); return g; };
  function start(g) { g.round++; g.item = REVEAL[g.deck.pop()]; g.order16 = shuffle([...Array(16).keys()]); g.shown = 0; g.freeze = {}; g.winnerR = -1; g.phase = 'play'; g.stepAt = Date.now(); g.moveId++; }
  function end(g) { g.phase = 'reveal'; g.revAt = Date.now(); sfx(g, g.winnerR >= 0 ? 'chime' : 'sad'); g.moveId++; }
  E.collecting = () => false;
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'play' ? g.order.filter(s => !(g.freeze[s] > Date.now())) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 1700;   // in step with the tiles; botAction waits until enough is showing
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'play' || a.type !== 'answer') return 'Not now';
    if (g.freeze[seat] > Date.now()) return 'Frozen for a moment!';
    const t = cleanText((a.vals || [])[0], 30);
    if (!t) return 'Type a guess';
    if (same(t, g.item.slice(1))) { g.winnerR = seat; g.gain = 16 - g.shown + 2; g.score[seat] += g.gain; announce(g, seat, `“${t}” ✓`); return end(g), null; }
    g.freeze[seat] = Date.now() + 3000;
    announce(g, seat, `“${t}” ✗`);
    g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'play') return { ms: Math.max(0, g.stepAt + 1800 - Date.now()), run: () => { g.shown++; g.stepAt = Date.now(); if (g.shown >= 16) end(g); else g.moveId++; } };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 5000 - Date.now()), run: () => nextRoundOr(g, start) };
    return null;
  };
  E.botAction = g => (g.shown < 5 || Math.random() < 0.6 ? null : { type: 'answer', vals: [g.shown > 9 ? g.item[1] : pick(REVEAL)[1]] });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, hud: [['Score', g.score[seat] ?? 0], ['Picture', `${g.round}/${g.settings.rounds}`]] };
    if (g.phase === 'play') v.ui = g.freeze[seat] > Date.now() ? { k: 'wait', title: '❄️ Wrong — frozen for a moment', sub: 'Keep watching the table' }
      : { k: 'fields', key: 'r' + g.round + ':' + (g.freeze[seat] || 0), title: 'What’s under the tiles?', sub: `Guess early for more points (${16 - g.shown + 2} now)`, myturn: true, fields: [{ ph: 'It’s a…', max: 30 }], submit: 'Guess', need: 1 };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.winnerR === seat ? `+${g.gain} — you got it!` : g.winnerR >= 0 ? `@${g.winnerR}@ got it` : 'Nobody got it', sub: `It was a ${g.item[1]}` };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Eagle eyes!' : 'Game over', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Acro Race & Fib Finder (write, then vote)
function writeVote({ defaults, setup, prompt, valid, realOption, scoreReal, bot }) {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, defaults); g.round = 0; start(g); return g; };
  function start(g) { g.round++; setup(g); g.text = {}; g.drafts = {}; g.done = {}; g.phase = 'write'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; }
  function toVote(g) {
    for (const s of g.order) if (!g.text[s] && g.drafts[s] && valid(g, g.drafts[s]) === true) g.text[s] = g.drafts[s];
    const opts = realOption ? [{ text: realOption(g), by: [], real: true }] : [];
    for (const s of g.order) { const t = g.text[s]; if (!t) continue; const m = opts.find(o => core(o.text) === core(t)); if (m) m.by.push(s); else opts.push({ text: t, by: [s] }); }
    g.opts = shuffle(opts); g.votes = {}; g.done = {}; g.phase = 'vote'; g.endAt = Date.now() + 40000; g.moveId++;
    if (!g.opts.length) reveal(g);
  }
  function reveal(g) {
    g.gain = {}; for (const s of g.order) g.gain[s] = 0;
    for (const [s, i] of Object.entries(g.votes)) { const o = g.opts[i]; if (o.real) g.gain[s] += scoreReal; else for (const b of o.by) if (b !== Number(s)) g.gain[b] += 1; }
    if (!realOption && g.opts.length) { const tally = g.opts.map((_, i) => Object.values(g.votes).filter(v => v === i).length), top = Math.max(...tally); if (top > 0) g.opts.forEach((o, i) => { if (tally[i] === top) o.by.forEach(b => { g.gain[b] += 1; }); }); }
    for (const s of g.order) g.score[s] += g.gain[s];
    g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); sfx(g, 'chime'); g.moveId++;
  }
  const voters = g => g.order.filter(s => g.opts?.some(o => o.real || !o.by.includes(s)));
  E.collecting = g => g.phase === 'write' || g.phase === 'vote';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'write' ? waiting(g) : g.phase === 'vote' ? waiting(g, voters(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.draft = (g, seat, d) => { if (g.phase !== 'write' || g.done[seat]) return false; g.drafts[seat] = cleanText((d.vals || [])[0], 90); return true; };
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'write' && a.type === 'answer') {
      if (g.done[seat]) return 'Already in';
      const t = cleanText((a.vals || [])[0], 90), ok = valid(g, t);
      if (ok !== true) return ok;
      g.text[seat] = t; g.done[seat] = true;
      if (!waiting(g).length) toVote(g); else g.moveId++;
      return null;
    }
    if (g.phase === 'vote' && a.type === 'pick') {
      if (g.done[seat]) return 'Already voted';
      const i = Number(a.v), o = g.opts[i];
      if (!o || (o.by.includes(seat) && !o.real)) return 'Vote for someone else’s';
      g.votes[seat] = i; g.done[seat] = true;
      if (!waiting(g, voters(g)).length) reveal(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => toVote(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 800, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 9000 - Date.now()), run: () => nextRoundOr(g, start) };
    return null;
  };
  E.botAction = (g, s) => { if (g.phase === 'write') return { type: 'answer', vals: [bot(g, s)] }; const ok = g.opts.map((_, i) => i).filter(i => g.opts[i].real || !g.opts[i].by.includes(s)); return { type: 'pick', v: ok[R(ok.length)] }; };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, hud: [['Score', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
    const P = prompt(g);
    if (g.phase === 'write') v.ui = g.done[seat] ? { k: 'wait', title: `“${g.text[seat]}” ✓`, sub: `Waiting for ${waiting(g).length} more…`, card: P.card } : { k: 'fields', key: 'w' + g.round, myturn: true, buzz: true, ...P, fields: [{ ph: P.ph, max: 90, value: g.drafts[seat] || '' }], submit: 'Hand it in', need: 1 };
    else if (g.phase === 'vote') v.ui = !voters(g).includes(seat) ? { k: 'wait', title: 'Nothing to vote for', sub: '' } : g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: `Waiting for ${waiting(g, voters(g)).length} more…`, card: P.card }
      : { k: 'pick', key: 'v' + g.round, title: realOption ? 'Which one is real?' : 'Vote for the best', sub: realOption ? `+${scoreReal} if you find it` : 'Not your own', myturn: true, card: P.card, options: g.opts.map((o, i) => ({ v: i, label: o.text, dis: o.by.includes(seat) && !o.real, sub: o.by.includes(seat) && !o.real ? 'yours' : '' })) };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: `+${g.gain[seat]} this round`, sub: realOption ? `Real answer: ${realOption(g)}` : '', card: P.card };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
    return v;
  };
  return E;
}
const ACRO_LETTERS = 'AAABBBCCCDDDEEFFFGGGHHHIIJKLLLMMMNNNOOPPPQRRRSSSSTTTUVWWWY';
export const acrorace = writeVote({
  defaults: { rounds: 5, secs: 60 },
  setup(g) { const n = 3 + Math.min(2, Math.floor((g.round - 1) / 2)); g.acro = Array.from({ length: n }, () => ACRO_LETTERS[R(ACRO_LETTERS.length)]).join(''); },
  prompt: g => ({ title: `Make a phrase for ${g.acro}`, sub: 'One word per letter, in order — be funny', card: { kicker: 'Letters', big: g.acro.split('').join('.') + '.' }, ph: 'e.g. Big Angry Turtles' }),
  valid(g, t) { const w = t.trim().split(/\s+/).filter(Boolean); if (w.length !== g.acro.length) return `Use exactly ${g.acro.length} words`; if (!w.every((x, i) => x[0].toUpperCase() === g.acro[i])) return `Words must start with ${g.acro.split('').join(', ')}`; return true; },
  scoreReal: 0,
  bot: g => g.acro.split('').map(c => ({ A: 'Angry', B: 'Bouncing', C: 'Cheesy', D: 'Dancing', E: 'Eager', F: 'Funky', G: 'Giant', H: 'Happy', I: 'Itchy', J: 'Jolly', K: 'Kooky', L: 'Lazy', M: 'Mighty', N: 'Noisy', O: 'Odd', P: 'Purple', Q: 'Quiet', R: 'Rowdy', S: 'Sneaky', T: 'Tiny', U: 'Unusual', V: 'Velvet', W: 'Wobbly', Y: 'Yawning' })[c] || c).join(' '),
});
export const fibfinder = writeVote({
  defaults: { rounds: 6, secs: 60 },
  setup(g) { g.deck = g.deck?.length ? g.deck : shuffle(FIBS.map((_, i) => i)); g.fib = FIBS[g.deck.pop()]; },
  prompt: g => ({ title: 'Fill in the blank with a believable fib', sub: 'Fool the others into picking your answer', card: { kicker: 'True fact', small: g.fib[0] }, ph: 'A believable answer…' }),
  valid(g, t) { if (!t) return 'Write something'; if (same(t, g.fib.slice(1))) return 'That’s the real answer — think of a fib!'; return true; },
  realOption: g => g.fib[1],
  scoreReal: 2,
  bot: (g, s) => ['penguins', 'a teapot', 'seventeen', 'wallaby', 'banana'][s % 5],
});
