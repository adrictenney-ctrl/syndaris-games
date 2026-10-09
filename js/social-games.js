// Social games: Story Chain, Rate It, Top Five, Mind Meld, Caption It, Fake Artist, Copy Cat,
// Code Crack, Undercover Spy, Mafia Night. Secrets and private input on phones; the shared story,
// drawing, board or verdict on the table.
import { base, shuffle, pick, same, core, cleanText, sfx, left, waiting, announce, finish, teams, TEAMS } from './party.js?v=68';
import { art as dreamArt, CARDS as DREAMS } from './dreamcards.js?v=68';
import { LISTS } from './sketch-words.js?v=68';

const R = n => Math.floor(Math.random() * n);
const topWin = g => { const top = Math.max(...g.order.map(s => g.score[s])); g.winners = g.order.filter(s => g.score[s] === top); g.winner = g.winners[0]; g.phase = 'over'; g.moveId++; };
const clean = st => (Array.isArray(st) ? st.slice(0, 400).map(x => ({ c: x.c | 0, w: x.w | 0, p: (Array.isArray(x.p) ? x.p : []).slice(0, 2000).map(v => Math.round(v) || 0) })) : []);
const WORDS = [...new Set([...LISTS.easy, ...LISTS.medium])];

// ---------------------------------------------------------------- Story Chain
const STARTERS = ['It was a dark and stormy night, and the toaster started to talk.', 'Nobody expected the school bus to take off and fly.', 'The treasure map led straight to grandma’s fridge.', 'On Monday morning, every cat in town learned to whistle.', 'The new neighbour was definitely a wizard.', 'Our holiday went wrong the moment the GPS started singing.', 'The museum’s dinosaur skeleton was missing on Tuesday.', 'Captain Biscuit had never lost a pirate race — until today.', 'The last slice of pizza was guarded by a very small dragon.', 'Everyone woke up with their neighbour’s voice.'];
export const storychain = (() => {
  const E = {};
  E.createGame = (s, p) => {
    const g = base(s, p, { secs: 90, len: 0 });
    g.len = g.settings.len || Math.min(6, Math.max(3, g.order.length));
    const st = shuffle([...STARTERS]);
    g.stories = g.order.map((owner, i) => ({ owner, lines: [{ by: -1, t: st[i % st.length] }] }));
    g.step = 0;
    start(g);
    return g;
  };
  const n = g => g.order.length;
  E.storyFor = (g, s) => (g.order.indexOf(s) + g.step) % n(g);
  function start(g) { g.done = {}; g.drafts = {}; g.phase = 'write'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; }
  function advance(g) {
    for (const s of g.order) if (!g.done[s]) g.stories[E.storyFor(g, s)].lines.push({ by: s, t: g.drafts[s] || '…and then nothing happened.' });
    g.step++;
    if (g.step >= g.len) { g.phase = 'read'; g.si = 0; g.li = 0; g.readAt = Date.now(); g.moveId++; return; }
    start(g);
  }
  E.collecting = g => g.phase === 'write' || g.phase === 'vote';
  E.turnSeat = () => -1;
  E.pending = g => (E.collecting(g) ? waiting(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.draft = (g, seat, d) => { if (g.phase !== 'write' || g.done[seat]) return false; g.drafts[seat] = cleanText((d.vals || [])[0], 160); return true; };
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'write' && a.type === 'answer') {
      if (g.done[seat]) return 'Already added';
      const t = cleanText((a.vals || [])[0], 160);
      if (t.length < 3) return 'Write a sentence';
      g.stories[E.storyFor(g, seat)].lines.push({ by: seat, t });
      g.done[seat] = true;
      if (!waiting(g).length) advance(g); else g.moveId++;
      return null;
    }
    if (g.phase === 'vote' && a.type === 'pick') {
      if (g.done[seat]) return 'Already voted';
      const i = Number(a.v);
      if (!g.stories[i]) return 'Pick a story';
      g.votes[seat] = i; g.done[seat] = true;
      if (!waiting(g).length) result(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  function result(g) {
    g.tally = g.stories.map((_, i) => Object.values(g.votes).filter(v => v === i).length);
    g.stories.forEach((st, i) => { for (const l of st.lines) if (l.by >= 0) g.score[l.by] += g.tally[i]; });
    sfx(g, 'chime');
    g.phase = 'result'; g.endAt = 0; g.resAt = Date.now(); g.moveId++;
  }
  E.tick = g => {
    if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1500, run: () => advance(g) };
    if (g.phase === 'read') return { ms: Math.max(0, g.readAt + 4500 - Date.now()), run: () => {
      g.li++;
      if (g.li >= g.stories[g.si].lines.length) { g.si++; g.li = 0; }
      if (g.si >= g.stories.length) { g.phase = 'vote'; g.votes = {}; g.done = {}; g.endAt = Date.now() + 40000; }
      g.readAt = Date.now(); g.moveId++;
    } };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => result(g) };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 8000 - Date.now()), run: () => topWin(g) };
    return null;
  };
  E.botAction = (g, s) => (g.phase === 'write' ? { type: 'answer', vals: [pick(['Suddenly, a llama burst through the door.', 'Then everybody started dancing.', 'It turned out to be a dream — or was it?', 'Nobody noticed the giant banana outside.'])] } : { type: 'pick', v: R(g.stories.length) });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, hud: [['Line', `${Math.min(g.step + 2, g.len + 1)}/${g.len + 1}`], ['Points', g.score[seat] ?? 0]] };
    if (g.phase === 'write') {
      const S = g.stories[E.storyFor(g, seat)], last = S.lines[S.lines.length - 1].t;
      v.ui = g.done[seat] ? { k: 'wait', title: 'Added ✓', sub: `Waiting for ${waiting(g).length} more…` } : { k: 'fields', key: 'w' + g.step, title: 'Continue the story', sub: 'You only see the line before yours', myturn: true, buzz: true, card: { kicker: 'The story so far ends…', small: `“${last}”` }, fields: [{ ph: 'And then…', max: 160, value: g.drafts[seat] || '' }], submit: 'Add my line', need: 1 };
    } else if (g.phase === 'read') v.ui = { k: 'wait', title: 'Story time 📖', sub: 'Listen to the table' };
    else if (g.phase === 'vote') v.ui = g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: '' } : { k: 'pick', key: 'v', title: 'Best story?', sub: 'Everyone who wrote in it gets a point per vote', myturn: true, options: g.stories.map((st, i) => ({ v: i, label: `Story ${i + 1}: ${st.lines[0].t.slice(0, 40)}…` })) };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Master storyteller!' : 'The end', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Rate It & Top Five (guess the hot seat)
const RATE = ['Pineapple on pizza', 'Camping in the rain', 'Karaoke nights', 'Getting up early', 'Rollercoasters', 'Horror films', 'Spicy food', 'Board game night', 'Cold showers', 'Reality TV', 'Long walks', 'Musicals', 'Doing the dishes', 'Snow days', 'Surprise parties', 'Cats', 'Dogs', 'Going to the gym', 'Beach holidays', 'Public speaking', 'Road trips', 'Dancing at weddings', 'Sushi', 'Theme parks', 'Gardening', 'Shopping for clothes', 'Brussels sprouts', 'Waking up to an alarm', 'Video calls', 'Sleeping in', 'Playing in snow', 'Live concerts', 'Being on time', 'Spiders', 'Thunderstorms', 'Cooking dinner', 'Libraries', 'Escape rooms', 'Hiking up hills', 'Fancy restaurants'];
export const rateit = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { laps: 2 }); g.turn = 0; g.total = g.order.length * g.settings.laps; g.deck = shuffle(RATE.map((_, i) => i)); start(g); return g; };
  E.hot = g => g.order[g.turn % g.order.length];
  function start(g) { g.item = RATE[g.deck.pop() ?? R(RATE.length)]; g.ans = {}; g.done = {}; g.phase = 'rate'; g.endAt = Date.now() + 40000; g.moveId++; }
  function reveal(g) {
    const H = E.hot(g), t = g.ans[H];
    g.gain = {};
    for (const s of g.order) g.gain[s] = 0;
    if (t != null) for (const s of g.order) if (s !== H && g.ans[s] != null) { const d = Math.abs(g.ans[s] - t); g.gain[s] = d === 0 ? 3 : d === 1 ? 2 : d === 2 ? 1 : 0; if (!d) g.gain[H]++; }
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'rate';
  E.turnSeat = g => (g.phase === 'rate' ? E.hot(g) : -1);
  E.pending = g => (g.phase === 'rate' ? waiting(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'rate' || a.type !== 'pick') return 'Not now';
    if (g.done[seat]) return 'Locked in';
    const n = Number(a.v);
    if (!(n >= 1 && n <= 10)) return 'Pick 1 to 10';
    g.ans[seat] = n; g.done[seat] = true;
    if (!waiting(g).length) reveal(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'rate') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 6500 - Date.now()), run: () => { g.turn++; if (g.turn >= g.total) topWin(g); else start(g); } };
    return null;
  };
  E.botAction = () => ({ type: 'pick', v: 1 + R(10) });
  E.viewFor = (g, seat) => {
    const H = E.hot(g), me = H === seat;
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'rate' ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Turn', `${Math.min(g.turn + 1, g.total)}/${g.total}`]] };
    const card = { kicker: me ? 'Rate this — honestly' : `How did @${H}@ rate…`, big: g.item };
    if (g.phase === 'rate') v.ui = g.done[seat] ? { k: 'wait', title: `You said ${g.ans[seat]} ✓`, sub: `Waiting for ${waiting(g).length} more…`, card } : { k: 'pick', key: 'r' + g.turn, title: me ? 'Your real rating, 1–10' : `Guess @${H}@’s rating`, sub: me ? 'Everyone’s guessing — be honest' : 'Exact: 3 · off by one: 2 · by two: 1', myturn: true, buzz: true, card, grid: 5, big: false, options: Array.from({ length: 10 }, (_, i) => ({ v: i + 1, label: String(i + 1) })) };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: me ? `${g.gain[seat]} friend${g.gain[seat] === 1 ? '' : 's'} nailed it` : g.gain[seat] ? `+${g.gain[seat]}` : 'Missed', sub: g.ans[H] != null ? `@${H}@ said ${g.ans[H]}/10` : 'They didn’t rate it', card };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You know everyone best!' : 'Game over', sub: '' };
    return v;
  };
  return E;
})();
const TOP5 = [
  ['Pizza toppings', ['Pepperoni', 'Mushrooms', 'Pineapple', 'Olives', 'Extra cheese']], ['Seasons… plus one', ['Spring', 'Summer', 'Autumn', 'Winter', 'Holidays']], ['Pets', ['Dog', 'Cat', 'Rabbit', 'Goldfish', 'Parrot']],
  ['Ice cream flavours', ['Chocolate', 'Vanilla', 'Strawberry', 'Mint choc chip', 'Cookie dough']], ['Superpowers', ['Flying', 'Invisibility', 'Teleporting', 'Mind reading', 'Super strength']], ['Holidays', ['Beach', 'City break', 'Mountains', 'Camping', 'Cruise']],
  ['Breakfasts', ['Pancakes', 'Cereal', 'Eggs and bacon', 'Toast', 'Fruit and yogurt']], ['Sports to watch', ['Football', 'Basketball', 'Tennis', 'Swimming', 'Motor racing']], ['Chores (best to worst)', ['Laundry', 'Dishes', 'Vacuuming', 'Cleaning the bathroom', 'Taking out the bins']],
  ['Film genres', ['Comedy', 'Horror', 'Action', 'Romance', 'Animation']], ['Desserts', ['Cake', 'Ice cream', 'Brownies', 'Cheesecake', 'Apple pie']], ['Ways to travel', ['Car', 'Train', 'Plane', 'Bike', 'Boat']],
  ['Board game moments', ['Winning', 'Rolling a double', 'Stealing the lead', 'Snacks', 'Bragging rights']], ['Jobs', ['Astronaut', 'Chef', 'Vet', 'Pilot', 'Artist']], ['Weather', ['Sunshine', 'Snow', 'Thunderstorm', 'Fog', 'Light rain']],
  ['Animals', ['Dolphin', 'Panda', 'Lion', 'Penguin', 'Elephant']], ['Snacks', ['Crisps / chips', 'Popcorn', 'Chocolate', 'Nuts', 'Fruit']], ['Party games', ['Charades', 'Quiz', 'Karaoke', 'Card games', 'Dancing']],
  ['Fruits', ['Mango', 'Strawberry', 'Banana', 'Apple', 'Watermelon']], ['Drinks', ['Coffee', 'Tea', 'Hot chocolate', 'Lemonade', 'Smoothie']],
];
export const topfive = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { laps: 1 }); g.turn = 0; g.total = g.order.length * g.settings.laps; g.deck = shuffle(TOP5.map((_, i) => i)); start(g); return g; };
  E.hot = g => g.order[g.turn % g.order.length];
  function start(g) { const t = TOP5[g.deck.pop() ?? R(TOP5.length)]; g.topic = t[0]; g.items = shuffle([...t[1]]); g.sel = {}; g.ans = {}; g.done = {}; g.phase = 'rank'; g.endAt = Date.now() + 60000; g.moveId++; }
  function reveal(g) {
    const H = E.hot(g), truth = g.ans[H];
    g.gain = {};
    for (const s of g.order) g.gain[s] = 0;
    if (truth) for (const s of g.order) if (s !== H && g.ans[s]) { g.gain[s] = g.ans[s].filter((x, i) => x === truth[i]).length; g.gain[H] += g.gain[s] >= 3 ? 1 : 0; }
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'rank';
  E.turnSeat = g => (g.phase === 'rank' ? E.hot(g) : -1);
  E.pending = g => (g.phase === 'rank' ? waiting(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'rank') return 'Not now';
    if (g.done[seat]) return 'Locked in';
    const cur = g.sel[seat] || (g.sel[seat] = []);
    if (a.type === 'undo') { cur.pop(); g.moveId++; return null; }
    const i = Number(a.v);
    if (!(i >= 0 && i < 5) || cur.includes(i)) return 'Pick the next one';
    cur.push(i);
    if (cur.length === 5) { g.ans[seat] = [...cur]; g.done[seat] = true; if (!waiting(g).length) return reveal(g), null; }
    g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'rank') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 8000 - Date.now()), run: () => { g.turn++; if (g.turn >= g.total) topWin(g); else start(g); } };
    return null;
  };
  E.botAction = (g, s) => { const cur = g.sel[s] || []; const left2 = [0, 1, 2, 3, 4].filter(i => !cur.includes(i)); return { type: 'pick', v: left2[R(left2.length)] }; };
  E.viewFor = (g, seat) => {
    const H = E.hot(g), me = H === seat, cur = g.sel[seat] || [];
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'rank' ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Turn', `${Math.min(g.turn + 1, g.total)}/${g.total}`]] };
    if (g.phase === 'rank') v.ui = g.done[seat] ? { k: 'wait', title: 'Ranked ✓', sub: `Waiting for ${waiting(g).length} more…` }
      : { k: 'pick', key: 'k' + g.turn + ':' + cur.length, title: me ? `Rank: ${g.topic}` : `How did @${H}@ rank ${g.topic}?`, sub: `Tap your #${cur.length + 1}${me ? '' : ' guess'} (favourite first)`, myturn: true, buzz: !cur.length, options: g.items.map((t, i) => ({ v: i, label: t, dis: cur.includes(i), sub: cur.includes(i) ? `#${cur.indexOf(i) + 1}` : '' })), buttons: cur.length ? [{ type: 'undo', label: '↶ Undo' }] : null };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: me ? 'Here’s how well they know you' : `${g.gain[seat]} in the right spot`, sub: g.ans[H] ? `@${H}@: ${g.ans[H].map(i => g.items[i]).join(' > ')}` : 'No ranking' };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Mind Meld (pairs try to say the same word)
export const mindmeld = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 3, tries: 6 }); g.round = 0; start(g); return g; };
  function start(g) {
    g.round++;
    const P = shuffle([...g.order]);
    g.pairs = [];
    while (P.length >= 2) g.pairs.push({ a: P.pop(), b: P.pop(), hist: [], done: false });
    if (P.length) g.pairs.push({ a: P[0], b: g.pairs[0]?.a ?? P[0], hist: [], done: false, shared: true });
    g.attempt = 0;
    next(g);
  }
  function next(g) { g.attempt++; g.word = {}; g.done = {}; g.phase = 'think'; g.endAt = Date.now() + 40000; g.moveId++; }
  const pairOf = (g, s) => g.pairs.filter(P => (P.a === s || P.b === s));
  const active = g => [...new Set(g.pairs.filter(P => !P.done).flatMap(P => [P.a, P.b]))];
  function reveal(g) {
    for (const P of g.pairs) {
      if (P.done) continue;
      const wa = g.word[P.a] || '…', wb = g.word[P.b] || '…';
      P.hist.push([wa, wb]);
      if (g.word[P.a] && g.word[P.b] && same(wa, [wb])) { P.done = true; P.pts = Math.max(1, g.settings.tries + 1 - g.attempt); g.score[P.a] += P.pts; if (P.b !== P.a && !P.shared) g.score[P.b] += P.pts; sfx(g, 'chime'); }
    }
    g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'think';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'think' ? waiting(g, active(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'think' || a.type !== 'answer') return 'Not now';
    if (!active(g).includes(seat)) return 'Your pair has finished';
    if (g.done[seat]) return 'Locked in';
    const w = cleanText((a.vals || [])[0], 30);
    if (!w || w.includes(' ')) return 'One word';
    g.word[seat] = w; g.done[seat] = true;
    if (!E.pending(g).length) reveal(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'think') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 5000 - Date.now()), run: () => {
      if (g.pairs.every(P => P.done) || g.attempt >= g.settings.tries) return g.round >= g.settings.rounds ? topWin(g) : start(g);
      next(g);
    } };
    return null;
  };
  E.botAction = (g, s) => { const P = pairOf(g, s).find(x => !x.done); const h = P?.hist[P.hist.length - 1]; return { type: 'answer', vals: [h && Math.random() < 0.5 ? h[R(2)] : pick(WORDS.filter(w => !w.includes(' ')))] }; };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'think' ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Try', `${g.attempt}/${g.settings.tries}`]] };
    const P = pairOf(g, seat).find(x => !x.done) || pairOf(g, seat)[0];
    const mate = P ? (P.a === seat ? P.b : P.a) : seat;
    const last = P?.hist[P.hist.length - 1];
    if (g.phase === 'think') v.ui = !active(g).includes(seat) ? { k: 'wait', title: 'Your minds met! 🧠✨', sub: 'Watch the others' }
      : g.done[seat] ? { k: 'wait', title: `“${g.word[seat]}” ✓`, sub: 'Waiting…' }
        : { k: 'fields', key: 'm' + g.round + ':' + g.attempt, title: last ? `Link “${last[0]}” and “${last[1]}”` : `Any word — with @${mate}@`, sub: last ? 'Think of the word that connects them — the same one as your partner!' : 'Say any word to start', myturn: true, buzz: true, fields: [{ ph: 'one word', max: 30 }], submit: 'Send', need: 1 };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: P?.done ? `Mind meld! +${P.pts}` : 'Not yet…', sub: last ? `You: ${last[P.a === seat ? 0 : 1]} · @${mate}@: ${last[P.a === seat ? 1 : 0]}` : '' };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Telepathic!' : 'Game over', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Caption It
export const captionit = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 5, secs: 60 }); g.round = 0; g.deck = shuffle(DREAMS.map((_, i) => i)); start(g); return g; };
  function start(g) { g.round++; g.pic = g.deck.pop(); g.cap = {}; g.drafts = {}; g.done = {}; g.phase = 'write'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; }
  const voters = g => g.order.filter(s => Object.keys(g.cap).some(c => Number(c) !== s));
  function toVote(g) { for (const s of g.order) if (!g.cap[s] && g.drafts[s]) g.cap[s] = g.drafts[s]; g.list = shuffle(Object.keys(g.cap).map(Number)); g.votes = {}; g.done = {}; g.phase = 'vote'; g.endAt = Date.now() + 35000; g.moveId++; if (!voters(g).length) reveal(g); }
  function reveal(g) { g.gain = {}; for (const s of g.order) g.gain[s] = 0; for (const v of Object.values(g.votes)) g.gain[v]++; for (const s of g.order) g.score[s] += g.gain[s]; sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++; }
  E.collecting = g => g.phase === 'write' || g.phase === 'vote';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'write' ? waiting(g) : g.phase === 'vote' ? waiting(g, voters(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.draft = (g, s, d) => { if (g.phase !== 'write' || g.done[s]) return false; g.drafts[s] = cleanText((d.vals || [])[0], 80); return true; };
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'write' && a.type === 'answer') { if (g.done[seat]) return 'Already in'; const t = cleanText((a.vals || [])[0], 80); if (!t) return 'Write a caption'; g.cap[seat] = t; g.done[seat] = true; if (!waiting(g).length) toVote(g); else g.moveId++; return null; }
    if (g.phase === 'vote' && a.type === 'pick') { if (g.done[seat]) return 'Already voted'; const s = Number(a.v); if (!g.cap[s] || s === seat) return 'Vote for someone else’s'; g.votes[seat] = s; g.done[seat] = true; if (!waiting(g, voters(g)).length) reveal(g); else g.moveId++; return null; }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => toVote(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 7000 - Date.now()), run: () => (g.round >= g.settings.rounds ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => (g.phase === 'write' ? { type: 'answer', vals: [pick(['Me on a Monday', 'When the wifi drops', 'Nobody: … Me:', 'My plans vs reality', 'Five minutes before the deadline'])] } : { type: 'pick', v: pick(Object.keys(g.cap).map(Number).filter(x => x !== s)) });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
    const pic = `<div class="dc-chosen">${dreamArt(g.pic)}</div>`;
    if (g.phase === 'write') v.ui = g.done[seat] ? { k: 'wait', title: `“${g.cap[seat]}” ✓`, sub: `Waiting for ${waiting(g).length} more…` } : { k: 'fields', key: 'w' + g.round, title: 'Caption this picture', sub: 'Funniest caption gets the votes', myturn: true, buzz: true, html: pic, fields: [{ ph: 'When you…', max: 80, value: g.drafts[seat] || '' }], submit: 'Hand it in', need: 1 };
    else if (g.phase === 'vote') v.ui = !voters(g).includes(seat) ? { k: 'wait', title: 'Nothing to vote on', sub: '' } : g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: '' } : { k: 'pick', key: 'v' + g.round, title: 'Funniest caption?', sub: 'Not your own', myturn: true, html: pic, options: g.list.filter(s => s !== seat).map(s => ({ v: s, label: g.cap[s] })) };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: `+${g.gain[seat]}`, sub: g.cap[seat] ? `Yours: “${g.cap[seat]}”` : '' };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Caption champion!' : 'Game over', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Fake Artist (one stroke each; one player doesn't know the word)
const CATEGORY = [['Animal', 'giraffe elephant penguin snake octopus spider butterfly whale rabbit crab'], ['Food', 'pizza banana burger ice cream carrot donut sandwich cake cheese egg'], ['Thing', 'umbrella bicycle guitar lamp rocket chair glasses key clock camera'], ['Place', 'castle beach volcano island lighthouse tent igloo pyramid bridge farm']];
export const fakeartist = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { laps: 2, rounds: 0 }); g.rounds = g.settings.rounds || Math.min(5, g.order.length); g.round = 0; start(g); return g; };
  function start(g) {
    g.round++;
    const [cat, list] = pick(CATEGORY);
    g.cat = cat; g.word = pick(list.split(' ').length > 1 ? list.match(/ice cream|\S+/g) : [list]);
    g.fake = pick(g.order);
    g.strokes = [];
    g.ti = 0; g.first = (g.round - 1) % g.order.length;
    g.phase = 'peek'; g.peekAt = Date.now(); g.endAt = 0; g.moveId++;
  }
  E.artist = g => g.order[(g.first + g.ti) % g.order.length];
  E.collecting = g => g.phase === 'vote';
  E.turnSeat = g => (g.phase === 'draw' ? E.artist(g) : g.phase === 'guess' ? g.fake : -1);
  E.pending = g => (g.phase === 'draw' ? [E.artist(g)] : g.phase === 'vote' ? waiting(g) : g.phase === 'guess' ? [g.fake] : []);
  E.current = g => E.pending(g)[0] ?? -1;
  function nextDraw(g) { g.ti++; if (g.ti >= g.order.length * g.settings.laps) { g.phase = 'vote'; g.votes = {}; g.done = {}; g.endAt = Date.now() + 60000; } else g.endAt = Date.now() + 25000; g.moveId++; }
  function count(g) {
    const t = {}; for (const v of Object.values(g.votes)) t[v] = (t[v] || 0) + 1;
    const top = Math.max(0, ...Object.values(t)), most = Object.keys(t).filter(k => t[k] === top).map(Number);
    g.tally = t; g.accused = most.length === 1 ? most[0] : -1;
    if (g.accused === g.fake) { g.phase = 'guess'; g.endAt = Date.now() + 30000; g.moveId++; } else end(g, 'escaped');
  }
  function end(g, how) {
    g.how = how;
    if (how === 'escaped') g.score[g.fake] += 2; else if (how === 'guessed') g.score[g.fake] += 1; else for (const s of g.order) if (s !== g.fake) g.score[s] += 1;
    sfx(g, how === 'caught' ? 'chime' : 'sad'); g.phase = 'result'; g.endAt = 0; g.resAt = Date.now(); g.moveId++;
  }
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'draw' && a.type === 'draw') {
      if (seat !== E.artist(g)) return 'Wait for your turn';
      const st = clean(a.strokes).filter(x => x.p.length >= 2)[0];
      if (!st) return 'Draw one line';
      g.strokes.push({ ...st, c: g.order.indexOf(seat) % 9 + 1, by: seat });
      nextDraw(g);
      return null;
    }
    if (g.phase === 'vote' && a.type === 'pick') { if (g.done[seat]) return 'Already voted'; const s = Number(a.v); if (!g.order.includes(s) || s === seat) return 'Vote for someone else'; g.votes[seat] = s; g.done[seat] = true; if (!waiting(g).length) count(g); else g.moveId++; return null; }
    if (g.phase === 'guess' && a.type === 'answer') { if (seat !== g.fake) return 'Only the fake guesses'; const t = cleanText((a.vals || [])[0], 30); g.guess = t; end(g, same(t, [g.word]) ? 'guessed' : 'caught'); return null; }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'peek') return { ms: Math.max(0, g.peekAt + 6000 - Date.now()), run: () => { g.phase = 'draw'; g.endAt = Date.now() + 25000; g.moveId++; } };
    if (g.phase === 'draw') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => nextDraw(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => count(g) };
    if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => end(g, 'caught') };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 9000 - Date.now()), run: () => (g.round >= g.rounds ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => {
    if (g.phase === 'draw') { const x = 200 + R(600), y = 150 + R(450); return { type: 'draw', strokes: [{ c: 0, w: 1, p: [x, y, x + R(200) - 100, y + R(200) - 100, x + R(300) - 150, y + R(150)] }] }; }
    if (g.phase === 'vote') { const o = g.order.filter(x => x !== s); return { type: 'pick', v: s !== g.fake && Math.random() < 0.4 ? g.fake : o[R(o.length)] }; }
    return { type: 'answer', vals: [Math.random() < 0.4 ? g.word : 'cat'] };
  };
  E.viewFor = (g, seat) => {
    const fake = seat === g.fake;
    const card = fake ? { kicker: g.cat, big: 'You’re the FAKE 🎭', small: 'Draw like you know what it is!', cls: 'oo-odd' } : { kicker: g.cat, big: g.word, small: 'Don’t make it too obvious — one of you is faking' };
    const v = { phase: g.phase, moveId: g.moveId, left: (g.phase === 'draw' && E.artist(g) === seat) || g.phase === 'vote' || (g.phase === 'guess' && fake) ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Round', `${g.round}/${g.rounds}`]] };
    if (g.phase === 'peek') v.ui = { k: 'wait', key: 'pk' + g.round, buzz: true, title: fake ? '🤫 You’re the fake artist' : 'Remember the word', sub: '', card };
    else if (g.phase === 'draw') v.ui = E.artist(g) === seat ? { k: 'draw', key: 'd' + g.round + ':' + g.ti, title: 'Add ONE line', sub: 'One stroke — lift your finger and tap Done', myturn: true, buzz: true, card, submit: 'Done' } : { k: 'wait', title: `@${E.artist(g)}@ is adding a line`, sub: 'Watch the drawing on the table', card };
    else if (g.phase === 'vote') v.ui = g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: '' } : { k: 'pick', key: 'v' + g.round, title: 'Who’s the fake artist?', myturn: true, card, options: g.order.filter(s => s !== seat).map(s => ({ v: s, dot: s, label: `@${s}@` })) };
    else if (g.phase === 'guess') v.ui = fake ? { k: 'fields', key: 'g' + g.round, title: 'Caught! What’s the word?', sub: `It’s a ${g.cat.toLowerCase()} — guess it to score`, myturn: true, buzz: true, fields: [{ ph: 'The word is…', max: 30 }], submit: 'Guess', need: 1 } : { k: 'wait', title: 'Caught them!', sub: 'They get one guess at the word…', card };
    else if (g.phase === 'result') v.ui = { k: 'wait', title: g.how === 'escaped' ? (fake ? 'You got away! +2' : 'The fake escaped!') : g.how === 'guessed' ? (fake ? 'Caught — but you guessed it! +1' : 'They guessed the word!') : fake ? 'Caught 🎨' : 'Got the fake! +1', sub: `The word was ${g.word}` };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Master artist!' : 'Game over', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Copy Cat (draw it from memory)
const COPY = '🐱 🐶 🐸 🐢 🐙 🦋 🐝 🦉 🦊 🐧 🍕 🍔 🍦 🍩 🌮 🍉 🍓 🥕 🌵 🌻 🍄 🌈 ⛄ 🏠 🏰 ⛵ 🚀 🚲 🚗 ✈️ 🎈 🎁 🎸 ⚽ 🏀 👑 💡 ⏰ ☂️ 🔑 🌙 ⭐ ☀️ ⚡ 🔥 💧 🍎 🍌 🐳 🦒'.split(' ');
export const copycat = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 4, secs: 60 }); g.round = 0; g.deck = shuffle([...COPY]); start(g); return g; };
  function start(g) { g.round++; g.pic = g.deck.pop(); g.pics = {}; g.drafts = {}; g.done = {}; g.phase = 'look'; g.lookAt = Date.now(); g.endAt = 0; g.moveId++; }
  const voters = g => g.order.filter(s => Object.keys(g.pics).some(c => Number(c) !== s));
  function toVote(g) { for (const s of g.order) if (!g.pics[s]) g.pics[s] = g.drafts[s] || []; g.votes = {}; g.done = {}; g.phase = 'vote'; g.endAt = Date.now() + 35000; g.moveId++; }
  function reveal(g) { g.gain = {}; for (const s of g.order) g.gain[s] = 0; for (const v of Object.values(g.votes)) g.gain[v]++; for (const s of g.order) g.score[s] += g.gain[s]; sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++; }
  E.collecting = g => g.phase === 'draw' || g.phase === 'vote';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'draw' ? waiting(g) : g.phase === 'vote' ? waiting(g, voters(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.draft = (g, s, d) => { if (g.phase !== 'draw' || g.done[s] || !d.strokes) return false; g.drafts[s] = clean(d.strokes); return true; };
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'draw' && a.type === 'draw') { if (g.done[seat]) return 'Already in'; g.pics[seat] = clean(a.strokes); g.done[seat] = true; if (!waiting(g).length) toVote(g); else g.moveId++; return null; }
    if (g.phase === 'vote' && a.type === 'pick') { if (g.done[seat]) return 'Already voted'; const s = Number(a.v); if (!g.pics[s] || s === seat) return 'Vote for someone else’s'; g.votes[seat] = s; g.done[seat] = true; if (!waiting(g, voters(g)).length) reveal(g); else g.moveId++; return null; }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'look') return { ms: Math.max(0, g.lookAt + 5000 - Date.now()), run: () => { g.phase = 'draw'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; } };
    if (g.phase === 'draw') return { ms: Math.max(0, g.endAt - Date.now()) + 2000, run: () => toVote(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 7000 - Date.now()), run: () => (g.round >= g.settings.rounds ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => (g.phase === 'draw' ? { type: 'draw', strokes: [{ c: R(9), w: 1, p: [300, 300, 500, 200, 700, 300, 500, 500, 300, 300] }] } : { type: 'pick', v: pick(Object.keys(g.pics).map(Number).filter(x => x !== s)) });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Round', `${g.round}/${g.settings.rounds}`]] };
    if (g.phase === 'look') v.ui = { k: 'wait', key: 'l' + g.round, buzz: true, title: '👀 Look at the table — memorise it!', sub: 'It disappears in a moment' };
    else if (g.phase === 'draw') v.ui = g.done[seat] ? { k: 'wait', title: 'Masterpiece in ✓', sub: `Waiting for ${waiting(g).length} more…` } : { k: 'draw', key: 'd' + g.round, title: 'Draw it from memory!', sub: 'As close as you can', myturn: true, submit: 'Done' };
    else if (g.phase === 'vote') v.ui = !voters(g).includes(seat) ? { k: 'wait', title: 'Nothing to vote on', sub: '' } : g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: '' } : { k: 'pick', key: 'v' + g.round, title: 'Best copy?', sub: 'Numbers match the drawings on the table', myturn: true, options: Object.keys(g.pics).map(Number).filter(s => s !== seat).map(s => ({ v: s, label: `Drawing ${g.order.indexOf(s) + 1}` })) };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: `+${g.gain[seat]}`, sub: 'Look at the table' };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 Perfect copy!' : 'Game over', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Code Crack (team codes and interceptions)
const CODE_WORDS = 'ocean rocket castle piano jungle winter pirate ghost robot desert garden circus volcano dragon island mirror camera forest candle storm crown bridge clock moon shadow river planet wizard treasure engine'.split(' ');
export const codecrack = (() => {
  const E = {};
  E.createGame = (s, p) => {
    const g = base(s, p, { rounds: 8 });
    teams(g);
    const w = shuffle([...CODE_WORDS]);
    g.keys = [w.slice(0, 4), w.slice(4, 8)];
    g.clueLog = [[[], [], [], []], [[], [], [], []]];   // per team, per keyword: clues given so far
    g.tokens = { int: [0, 0], mis: [0, 0] };
    g.round = 0;
    g.next = [0, 0];
    start(g);
    return g;
  };
  E.encoder = (g, t) => g.members[t][g.next[t] % g.members[t].length];
  const code = () => shuffle([1, 2, 3, 4]).slice(0, 3);
  function start(g) { g.round++; g.code = [code(), code()]; g.clues = [null, null]; g.done = {}; g.phase = 'clue'; g.endAt = Date.now() + 90000; g.moveId++; }
  function toGuess(g, t) { g.at = t; g.guess = [null, null]; g.phase = 'guess'; g.endAt = Date.now() + 60000; g.moveId++; }
  function resolveGuess(g) {
    const t = g.at, C = g.code[t].join('');
    const own = g.guess[t], other = g.guess[1 - t];
    g.res = { t, own: own === C, inter: g.round > 1 && other === C };
    if (!g.res.own) g.tokens.mis[t]++;
    if (g.res.inter) g.tokens.int[1 - t]++;
    g.code[t].forEach((k, i) => g.clueLog[t][k - 1].push(g.clues[t][i]));
    sfx(g, g.res.inter || !g.res.own ? 'buzzer' : 'ding');
    g.phase = 'result'; g.endAt = 0; g.resAt = Date.now(); g.moveId++;
  }
  const over = g => g.tokens.int.some(x => x >= 2) || g.tokens.mis.some(x => x >= 2) || g.round >= g.settings.rounds;
  function finishCC(g) {
    const pts = t => g.tokens.int[t] - g.tokens.mis[t];
    g.scores = [pts(0), pts(1)];
    g.winner = g.tokens.int[0] >= 2 || g.tokens.mis[1] >= 2 ? 0 : g.tokens.int[1] >= 2 || g.tokens.mis[0] >= 2 ? 1 : g.scores[0] === g.scores[1] ? null : g.scores[0] > g.scores[1] ? 0 : 1;
    g.phase = 'over'; g.moveId++;
  }
  E.collecting = g => g.phase === 'clue' || g.phase === 'guess';
  E.turnSeat = () => -1;
  const guessers = (g, t) => g.members[t].filter(s => t !== g.at || s !== E.encoder(g, g.at));
  E.pending = g => {
    if (g.phase === 'clue') return [0, 1].filter(t => !g.clues[t]).map(t => E.encoder(g, t));
    if (g.phase === 'guess') return [0, 1].filter(t => !g.guess[t]).flatMap(t => guessers(g, t)).filter(s => g.round > 1 || g.team[s] === g.at);
    return [];
  };
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    const t = g.team[seat];
    if (g.phase === 'clue' && a.type === 'answer') {
      if (seat !== E.encoder(g, t)) return 'Your team’s encoder is writing clues';
      const v = (a.vals || []).map(x => cleanText(x, 24));
      if (v.length < 3 || v.some(x => !x)) return 'Write three clues';
      g.clues[t] = v.slice(0, 3);
      if (g.clues[0] && g.clues[1]) toGuess(g, 0); else g.moveId++;
      return null;
    }
    if (g.phase === 'guess' && a.type === 'pick') {
      if (g.guess[t]) return 'Your team already answered';
      if (!guessers(g, t).includes(seat)) return 'You wrote these clues!';
      if (t !== g.at && g.round === 1) return 'No intercepting in round 1';
      const c = String(a.v);
      if (!/^[1-4]{3}$/.test(c) || new Set(c).size < 3) return 'Pick a code';
      g.guess[t] = c;
      if (g.guess[g.at] && (g.round === 1 || g.guess[1 - g.at])) resolveGuess(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'clue') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => { for (const t of [0, 1]) if (!g.clues[t]) g.clues[t] = ['…', '…', '…']; toGuess(g, 0); } };
    if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => resolveGuess(g) };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 7000 - Date.now()), run: () => {
      if (g.at === 0) return toGuess(g, 1);
      g.next[0]++; g.next[1]++;
      if (over(g)) return finishCC(g);
      start(g);
    } };
    return null;
  };
  E.botAction = (g, s) => {
    const t = g.team[s];
    if (g.phase === 'clue') return { type: 'answer', vals: g.code[t].map(k => `${g.keys[t][k - 1].slice(0, 3)}…`) };
    return { type: 'pick', v: t === g.at && Math.random() < 0.7 ? g.code[t].join('') : shuffle(['1', '2', '3', '4']).slice(0, 3).join('') };
  };
  const CODES = (() => { const out = []; for (const a of '1234') for (const b of '1234') for (const c of '1234') if (new Set(a + b + c).size === 3) out.push(a + b + c); return out; })();
  E.viewFor = (g, seat) => {
    const t = g.team[seat];
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, teamName: TEAMS[t], myTeam: t, hud: [['Intercepts', `${g.tokens.int[t]}/2`], ['Mix-ups', `${g.tokens.mis[t]}/2`]] };
    const keys = { kicker: 'Your team’s secret keywords', list: g.keys[t].map((w, i) => `${i + 1}. ${w}  —  ${g.clueLog[t][i].join(', ') || 'no clues yet'}`) };
    if (g.phase === 'clue') v.ui = seat === E.encoder(g, t) && !g.clues[t] ? { k: 'fields', key: 'c' + g.round, title: `Your code: ${g.code[t].join(' - ')}`, sub: 'One clue for each number — your team must crack it, the others mustn’t', myturn: true, buzz: true, card: keys, fields: g.code[t].map(k => ({ label: `#${k} (${g.keys[t][k - 1]})`, ph: 'clue', max: 24 })), submit: 'Send clues', need: 3 }
      : { k: 'wait', title: g.clues[t] ? 'Clues are in' : `@${E.encoder(g, t)}@ is writing your clues`, sub: 'Study your keywords…', card: keys };
    else if (g.phase === 'guess') {
      const mine = t === g.at;
      v.ui = g.guess[t] || !guessers(g, t).includes(seat) || (!mine && g.round === 1) ? { k: 'wait', title: mine ? (seat === E.encoder(g, g.at) ? 'Your team is decoding your clues…' : 'Guess sent ✓') : g.round === 1 ? 'No intercepting in round 1' : 'Interception sent ✓', sub: 'Look at the table', card: keys }
        : { k: 'pick', key: 'g' + g.round + g.at, title: mine ? 'Crack your team’s code' : 'Intercept their code!', sub: `Clues: ${g.clues[g.at].join(' · ')}`, myturn: true, buzz: true, card: keys, grid: 4, options: CODES.map(c => ({ v: c, label: c.split('').join('-'), cls: 'ss-key' })) };
    } else if (g.phase === 'result') v.ui = { k: 'wait', title: `Code was ${g.code[g.at].join('-')}`, sub: `${g.res.own ? 'Decoded ✓' : 'Mix-up ✗'}${g.res.inter ? ' · INTERCEPTED!' : ''}`, card: keys };
    else v.ui = { k: 'wait', title: g.winner == null ? 'A draw!' : g.winner === t ? '🏆 Your team wins!' : `${TEAMS[g.winner]} wins`, sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Undercover Spy
export const LOCATIONS = [['Beach', 'Lifeguard Surfer Tourist Ice-cream seller Sunbather Photographer'], ['Hospital', 'Doctor Nurse Patient Visitor Surgeon Porter'], ['School', 'Teacher Student Head teacher Janitor Parent Cook'], ['Airport', 'Pilot Passenger Security guard Flight attendant Baggage handler Tourist'], ['Restaurant', 'Chef Waiter Customer Critic Dishwasher Musician'], ['Space station', 'Commander Engineer Scientist Doctor Tourist Alien'], ['Circus', 'Clown Acrobat Lion tamer Juggler Visitor Magician'], ['Pirate ship', 'Captain Cook Sailor Prisoner Parrot keeper Lookout'], ['Movie studio', 'Director Actor Stunt double Camera operator Make-up artist Extra'], ['Bank', 'Manager Teller Customer Security guard Robber Accountant'], ['Zoo', 'Zookeeper Vet Visitor Photographer Child Ticket seller'], ['Supermarket', 'Cashier Shopper Manager Stock clerk Security guard Baker'], ['Theatre', 'Actor Director Audience member Usher Lighting tech Singer'], ['Ski resort', 'Ski instructor Skier Lift operator Medic Chef Tourist'], ['Submarine', 'Captain Sonar operator Engineer Cook Navigator Sailor'], ['Castle', 'King Queen Knight Jester Guard Cook'], ['Train', 'Driver Conductor Passenger Food trolley Tourist Ticket inspector'], ['Library', 'Librarian Student Author Reader Cleaner Toddler'], ['Football stadium', 'Player Referee Fan Coach Commentator Hot-dog seller'], ['Farm', 'Farmer Vet Tractor driver Visitor Sheepdog trainer Beekeeper'], ['Hotel', 'Receptionist Guest Chef Cleaner Bellhop Manager'], ['Museum', 'Guide Visitor Security guard Curator Artist Child'], ['Police station', 'Detective Officer Suspect Lawyer Receptionist Witness'], ['Cruise ship', 'Captain Entertainer Passenger Chef Lifeguard Waiter']];
export const undercover = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { mins: 6, rounds: 0 }); g.rounds = g.settings.rounds || Math.min(6, g.order.length); g.round = 0; start(g); return g; };
  function start(g) {
    g.round++;
    g.loc = R(LOCATIONS.length);
    g.spy = pick(g.order);
    const roles = shuffle(LOCATIONS[g.loc][1].split(' ').map(r => r.replace(/-/g, ' ')));
    g.role = g.seats.map(() => null);
    g.order.forEach((s, i) => { g.role[s] = roles[i % roles.length]; });
    g.ready = {}; g.asker = g.order[R(g.order.length)];
    g.phase = 'ask'; g.endAt = Date.now() + g.settings.mins * 60000; g.moveId++;
  }
  function toVote(g) { g.phase = 'vote'; g.votes = {}; g.done = {}; g.endAt = Date.now() + 45000; g.moveId++; }
  function end(g, how) {
    g.how = how;
    if (how === 'spywin' || how === 'spyguess') g.score[g.spy] += 2; else for (const s of g.order) if (s !== g.spy) g.score[s] += 1;
    sfx(g, how === 'caught' || how === 'spywrong' ? 'chime' : 'sad'); g.phase = 'result'; g.endAt = 0; g.resAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'vote';
  E.turnSeat = g => (g.phase === 'ask' ? g.asker : -1);
  E.pending = g => (g.phase === 'vote' ? waiting(g) : g.phase === 'ask' ? g.order.filter(s => !g.ready[s]) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = g => (g.phase === 'ask' ? 8000 + Math.random() * 8000 : 1500 + Math.random() * 2000);
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'ask') {
      if (a.type === 'asked') { if (seat !== g.asker) return 'It’s not your turn to ask'; g.asker = Number(a.v); if (!g.order.includes(g.asker)) return 'Pick a player'; g.moveId++; return null; }
      if (a.type === 'ready') { g.ready[seat] = !g.ready[seat]; if (g.order.filter(s => g.ready[s]).length * 2 > g.order.length) toVote(g); else g.moveId++; return null; }
      if (a.type === 'spyguess') { if (seat !== g.spy) return 'Only the spy can do that'; g.spyGuess = Number(a.v); end(g, g.spyGuess === g.loc ? 'spyguess' : 'spywrong'); return null; }
      return 'Not now';
    }
    if (g.phase === 'vote' && a.type === 'pick') {
      if (g.done[seat]) return 'Already voted';
      const s = Number(a.v); if (!g.order.includes(s) || s === seat) return 'Vote for someone else';
      g.votes[seat] = s; g.done[seat] = true;
      if (!waiting(g).length) { const t = {}; for (const x of Object.values(g.votes)) t[x] = (t[x] || 0) + 1; const top = Math.max(...Object.values(t)), m = Object.keys(t).filter(k => t[k] === top).map(Number); g.tally = t; g.accused = m.length === 1 ? m[0] : -1; end(g, g.accused === g.spy ? 'caught' : 'spywin'); } else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'ask') return { ms: Math.max(0, g.endAt - Date.now()), run: () => toVote(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => { g.tally = {}; g.accused = -1; end(g, 'spywin'); } };
    if (g.phase === 'result') return { ms: Math.max(0, g.resAt + 9000 - Date.now()), run: () => (g.round >= g.rounds ? topWin(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => {
    if (g.phase === 'ask') { if (s === g.spy && Math.random() < 0.15) return { type: 'spyguess', v: R(LOCATIONS.length) }; return g.ready[s] ? null : { type: 'ready' }; }
    const o = g.order.filter(x => x !== s); return { type: 'pick', v: s !== g.spy && Math.random() < 0.35 ? g.spy : o[R(o.length)] };
  };
  E.viewFor = (g, seat) => {
    const spy = seat === g.spy;
    const card = spy ? { kicker: 'Your secret', big: 'You are the SPY 🕵️', small: 'Work out the location from the questions', cls: 'oo-odd' } : { kicker: 'Location', big: LOCATIONS[g.loc][0], small: `Your role: ${g.role[seat]}` };
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase !== 'result' && g.phase !== 'over' ? left(g) : 0, hud: [['Points', g.score[seat] ?? 0], ['Round', `${g.round}/${g.rounds}`]] };
    if (g.phase === 'ask') {
      const btns = [{ type: 'ready', label: g.ready[seat] ? '✓ Ready to vote (tap to undo)' : 'I’m ready to vote' }];
      if (g.asker === seat) v.ui = { k: 'pick', key: 'a' + g.round + g.asker, title: 'Your turn to ask a question', sub: 'Ask someone out loud, then tap who you asked', myturn: true, buzz: true, card, options: g.order.filter(s => s !== seat).map(s => ({ v: s, dot: s, label: `@${s}@` })), act: 'asked', buttons: btns };
      else if (spy) v.ui = { k: 'pick', key: 's' + g.round, act: 'spyguess', title: 'Think you know where you are?', sub: 'Guess the location — right wins, wrong loses!', card, grid: 2, options: LOCATIONS.map((l, i) => ({ v: i, label: l[0] })), buttons: btns };
      else v.ui = { k: 'buttons', key: 'w' + g.round + g.asker, title: `@${g.asker}@ is asking`, sub: 'Answer questions in a way the spy can’t use', card, buttons: btns };
    } else if (g.phase === 'vote') v.ui = g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: '', card } : { k: 'pick', key: 'v' + g.round, title: 'Who’s the spy?', myturn: true, buzz: true, card, options: g.order.filter(s => s !== seat).map(s => ({ v: s, dot: s, label: `@${s}@` })) };
    else if (g.phase === 'result') v.ui = { k: 'wait', title: { caught: spy ? 'Caught! 🕵️' : 'Spy caught! +1', spywin: spy ? 'You escaped! +2' : 'The spy got away', spyguess: spy ? 'You found the location! +2' : 'The spy guessed it!', spywrong: spy ? 'Wrong guess!' : 'The spy guessed wrong! +1' }[g.how], sub: `It was the ${LOCATIONS[g.loc][0]} — @${g.spy}@ was the spy` };
    else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: '' };
    return v;
  };
  return E;
})();

// ---------------------------------------------------------------- Mafia Night
export const mafianight = (() => {
  const E = {};
  E.createGame = (s, p) => {
    const g = base(s, p, { talk: 3 });
    const n = g.order.length, roles = shuffle([...g.order]);
    g.role = g.seats.map(() => null);
    const nm = Math.max(1, Math.floor(n / 4));
    roles.forEach((s2, i) => { g.role[s2] = i < nm ? 'mafia' : i === nm ? 'doctor' : i === nm + 1 && n >= 6 ? 'detective' : 'villager'; });
    g.alive = [...g.order];
    g.day = 0;
    night(g);
    return g;
  };
  const mafia = g => g.alive.filter(s => g.role[s] === 'mafia');
  function night(g) { g.day++; g.act = {}; g.done = {}; g.found = g.found || {}; g.phase = 'night'; g.endAt = Date.now() + 45000; g.moveId++; }
  const actors = g => g.alive.filter(s => g.role[s] !== 'villager');
  function dawn(g) {
    const mv = mafia(g).map(s => g.act[s]).filter(x => x != null);
    const t = {}; for (const x of mv) t[x] = (t[x] || 0) + 1;
    const top = Object.keys(t).sort((a, b) => t[b] - t[a])[0];
    const victim = top != null ? Number(top) : -1;
    const doc = g.alive.find(s => g.role[s] === 'doctor');
    const saved = doc != null && g.act[doc] === victim;
    const det = g.alive.find(s => g.role[s] === 'detective');
    if (det != null && g.act[det] != null) g.found[det] = [...(g.found[det] || []), [g.act[det], g.role[g.act[det]] === 'mafia']];
    g.dawn = { victim: saved ? -1 : victim, saved: saved && victim >= 0 };
    if (g.dawn.victim >= 0) g.alive = g.alive.filter(s => s !== g.dawn.victim);
    sfx(g, g.dawn.victim >= 0 ? 'sad' : 'chime');
    if (check(g)) return;
    g.phase = 'day'; g.endAt = Date.now() + g.settings.talk * 60000; g.votes = {}; g.done = {}; g.moveId++;
  }
  function lynch(g) {
    const t = {}; for (const x of Object.values(g.votes)) if (x >= 0) t[x] = (t[x] || 0) + 1;
    const top = Math.max(0, ...Object.values(t)), m = Object.keys(t).filter(k => t[k] === top).map(Number);
    g.out = m.length === 1 && top * 2 > g.alive.length * 0.5 ? m[0] : -1;
    if (g.out >= 0) g.alive = g.alive.filter(s => s !== g.out);
    g.tally = t;
    sfx(g, 'buzzer');
    if (check(g)) return;
    g.phase = 'verdict'; g.endAt = 0; g.verAt = Date.now(); g.moveId++;
  }
  function check(g) {
    const m = mafia(g).length, town = g.alive.length - m;
    if (m === 0 || m >= town) {
      g.winTeam = m === 0 ? 'town' : 'mafia';
      g.winners = g.order.filter(s => (g.role[s] === 'mafia') === (g.winTeam === 'mafia'));
      g.order.forEach(s => { g.score[s] = g.winners.includes(s) ? 1 : 0; });
      g.winner = g.winners[0]; g.phase = 'over'; g.moveId++;
      return true;
    }
    return false;
  }
  E.collecting = g => g.phase === 'night' || g.phase === 'day';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'night' ? waiting(g, actors(g)) : g.phase === 'day' ? waiting(g, g.alive) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = g => (g.phase === 'day' ? 20000 + Math.random() * 20000 : 2000 + Math.random() * 3000);
  E.applyAction = (g, seat, a) => {
    if (!a || a.type !== 'pick') return 'Not now';
    if (!g.alive.includes(seat)) return 'You’re out — watch quietly 👻';
    if (g.done[seat]) return 'Locked in';
    const t = Number(a.v);
    if (g.phase === 'night') {
      if (g.role[seat] === 'villager') return 'Sleep tight';
      if (!g.alive.includes(t)) return 'Pick someone still in the game';
      if (g.role[seat] === 'mafia' && g.role[t] === 'mafia') return 'Not one of your own!';
      g.act[seat] = t; g.done[seat] = true;
      if (!waiting(g, actors(g)).length) dawn(g); else g.moveId++;
      return null;
    }
    if (g.phase === 'day') {
      if (t !== -1 && (!g.alive.includes(t) || t === seat)) return 'Vote for someone else (or skip)';
      g.votes[seat] = t; g.done[seat] = true;
      if (!waiting(g, g.alive).length) lynch(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'night') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => dawn(g) };
    if (g.phase === 'day') return { ms: Math.max(0, g.endAt - Date.now()) + 500, run: () => lynch(g) };
    if (g.phase === 'verdict') return { ms: Math.max(0, g.verAt + 7000 - Date.now()), run: () => night(g) };
    return null;
  };
  E.botAction = (g, s) => {
    const others = g.alive.filter(x => x !== s && !(g.role[s] === 'mafia' && g.role[x] === 'mafia'));
    if (g.phase === 'night') return { type: 'pick', v: g.role[s] === 'doctor' ? pick(g.alive) : pick(others.length ? others : g.alive) };
    return { type: 'pick', v: Math.random() < 0.2 ? -1 : pick(others.length ? others : [-1]) };
  };
  const ROLE = { mafia: ['🔪 Mafia', 'Pick someone to eliminate tonight. Blend in by day.'], doctor: ['💉 Doctor', 'Pick someone to protect tonight (you can pick yourself).'], detective: ['🔍 Detective', 'Pick someone to investigate tonight — your phone will tell you if they’re Mafia.'], villager: ['🏡 Villager', 'Find the Mafia by talking — and vote them out.'] };
  E.viewFor = (g, seat) => {
    const r = g.role[seat], live = g.alive.includes(seat);
    const partners = r === 'mafia' ? mafia(g).filter(x => x !== seat) : [];
    const card = { kicker: 'Your secret role', big: ROLE[r][0], small: `${ROLE[r][1]}${partners.length ? ` Your partner: ${partners.map(x => `@${x}@`).join(', ')}` : ''}${g.found?.[seat]?.length ? ` · Found: ${g.found[seat].map(([x, m]) => `@${x}@ ${m ? 'IS Mafia' : 'is clean'}`).join('; ')}` : ''}`, cls: r === 'mafia' ? 'oo-odd' : '' };
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, hud: [['Day', g.day], ['Still in', g.alive.length]] };
    if (g.phase === 'over') v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? `🏆 The ${g.winTeam} wins!` : `The ${g.winTeam} wins`, sub: `You were ${ROLE[r][0]}` };
    else if (!live) v.ui = { k: 'wait', title: 'You’re out 👻', sub: 'No talking from beyond the grave!', card };
    else if (g.phase === 'night') v.ui = r === 'villager' ? { k: 'wait', key: 'n' + g.day, buzz: true, title: '🌙 Night — close your eyes', sub: 'Keep your phone face down', card }
      : g.done[seat] ? { k: 'wait', title: 'Done for tonight ✓', sub: 'Shh…', card }
        : { k: 'pick', key: 'n' + g.day, buzz: true, title: r === 'mafia' ? 'Who do you eliminate?' : r === 'doctor' ? 'Who do you protect?' : 'Who do you investigate?', sub: 'Quietly!', myturn: true, card, options: g.alive.filter(x => (r === 'doctor' || x !== seat) && !(r === 'mafia' && g.role[x] === 'mafia')).map(x => ({ v: x, dot: x, label: x === seat ? 'Myself' : `@${x}@` })) };
    else if (g.phase === 'day') v.ui = g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: 'Waiting for the town…', card }
      : { k: 'pick', key: 'd' + g.day, title: 'Vote someone out', sub: 'Talk it over first — or skip', myturn: true, card, options: [...g.alive.filter(x => x !== seat).map(x => ({ v: x, dot: x, label: `@${x}@` })), { v: -1, label: 'Skip — nobody' }] };
    else v.ui = { k: 'wait', title: g.out >= 0 ? (g.out === seat ? 'You were voted out' : `@${g.out}@ was voted out`) : 'Nobody was voted out', sub: g.out >= 0 ? `They were ${ROLE[g.role[g.out]][0]}` : '', card };
    return v;
  };
  E.ROLE = ROLE;
  return E;
})();
