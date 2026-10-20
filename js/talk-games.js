// Talk-and-laugh party games: Emoji Story, Fake Movie Pitch, Hot Takes, Who Said That?, Worst Gift,
// Interrogation, Translate This, Draw Your Partner, Excuses Excuses, Lip Reader, Two Words,
// Guilty Conscience, Plot Twist. Secrets and writing on the phones; the reveal, the reading and
// the votes on the table.
import { base, shuffle, pick, same, cleanText, sfx, left, waiting, finish } from './party.js?v=100';
import { LISTS } from './sketch-words.js?v=100';
import * as D from './talk-data.js?v=100';

const R = n => Math.floor(Math.random() * n);
const strokes = st => (Array.isArray(st) ? st.slice(0, 400).map(x => ({ c: x.c | 0, w: x.w | 0, p: (Array.isArray(x.p) ? x.p : []).slice(0, 2000).map(v => Math.round(v) || 0) })) : []);
const hud = (g, seat, label = 'Round') => [['Points', g.score[seat] ?? 0], [label, `${Math.min(g.round, g.total)}/${g.total}`]];
const overUI = (g, seat, win) => ({ k: 'wait', title: (g.winners || []).includes(seat) ? `🏆 ${win}` : 'Game over', sub: '' });
const BOT_STROKE = () => [{ c: R(9), w: 1, p: [300, 300, 500, 200, 700, 300, 520, 520, 300, 300] }];

// ================================================================ write, (read aloud), then vote
// One shape for every "everyone writes (or draws) something, then the room picks a favourite" game.
// cfg: defaults, setup(g) for the round, personal(g, seat) for a private prompt, draw(g), judge
// (the hot seat picks instead of a room vote), read (seconds each entry stays up to be read aloud),
// card(g, seat), title, sub, ph, max, voteTitle, label(g, seat), bot(g, seat), win.
function writeVote(cfg) {
  const E = {};
  const isDraw = g => !!(cfg.draw && cfg.draw(g));
  const hot = g => (cfg.judge ? g.order[(g.round - 1) % g.order.length] : -1);
  const writers = g => (cfg.judge ? g.order.filter(s => s !== hot(g)) : g.order);
  const voters = g => (cfg.judge ? [hot(g)] : g.order.filter(s => g.list.some(a => a !== s)));
  E.hot = hot;
  E.writers = writers;
  E.isDraw = isDraw;
  E.createGame = (s, p) => {
    const g = base(s, p, { rounds: 3, secs: 75, ...cfg.defaults });
    g.round = 0;
    g.total = cfg.judge ? g.order.length * (g.settings.laps || 1) : g.settings.rounds;
    start(g);
    return g;
  };
  function start(g) {
    g.round++; g.hotSeat = hot(g);
    g.mine = {}; g.ans = {}; g.drafts = {}; g.done = {}; g.votes = {}; g.list = []; g.gain = {};
    cfg.setup?.(g);
    if (cfg.personal) for (const s of writers(g)) g.mine[s] = cfg.personal(g, s);
    g.phase = 'write'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++;
  }
  function closeWriting(g) {
    for (const s of writers(g)) if (g.ans[s] == null && g.drafts[s] && (isDraw(g) ? g.drafts[s].length : g.drafts[s])) g.ans[s] = g.drafts[s];
    g.list = shuffle(Object.keys(g.ans).map(Number));
    if (!g.list.length) return reveal(g);
    if (cfg.read) { g.phase = 'read'; g.ri = 0; g.readAt = Date.now(); g.endAt = g.readAt + cfg.read * 1000; g.moveId++; return; }
    toVote(g);
  }
  function toVote(g) {
    g.phase = 'vote'; g.done = {}; g.votes = {}; g.endAt = Date.now() + 40000; g.moveId++;
    if (!voters(g).length) reveal(g);
  }
  function reveal(g) {
    for (const s of g.order) g.gain[s] = 0;
    if (cfg.judge) { const w = g.votes[hot(g)]; if (w != null) g.gain[w] += 3; }
    else for (const v of Object.values(g.votes)) g.gain[v]++;
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  function nextRead(g) { g.ri++; if (g.ri >= g.list.length) return toVote(g); g.readAt = Date.now(); g.endAt = g.readAt + cfg.read * 1000; g.moveId++; }
  E.reader = g => (g.phase === 'read' ? g.list[g.ri] : -1);
  E.collecting = g => g.phase === 'write' || g.phase === 'vote';
  E.turnSeat = g => (g.phase === 'read' ? E.reader(g) : cfg.judge && g.phase === 'vote' ? hot(g) : -1);
  E.pending = g => (g.phase === 'write' ? waiting(g, writers(g)) : g.phase === 'vote' ? waiting(g, voters(g)) : g.phase === 'read' ? [E.reader(g)] : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.draft = (g, s, d) => {
    if (g.phase !== 'write' || g.done[s] || !writers(g).includes(s)) return false;
    g.drafts[s] = isDraw(g) ? strokes(d.strokes) : cleanText((d.vals || [])[0], cfg.max || 90);
    return true;
  };
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'write' && (a.type === 'answer' || a.type === 'draw')) {
      if (!writers(g).includes(seat)) return 'Not your turn to write';
      if (g.done[seat]) return 'Already in';
      if (isDraw(g)) { const st = strokes(a.strokes); if (!st.length) return 'Draw something first'; g.ans[seat] = st; }
      else { const t = cleanText((a.vals || [])[0], cfg.max || 90); if (!t) return 'Write something first'; g.ans[seat] = t; }
      g.done[seat] = true;
      if (!waiting(g, writers(g)).length) closeWriting(g); else g.moveId++;
      return null;
    }
    if (g.phase === 'read' && a.type === 'next') { if (seat !== E.reader(g)) return 'Not you'; nextRead(g); return null; }
    if (g.phase === 'vote' && a.type === 'pick') {
      if (!voters(g).includes(seat)) return 'Not your vote';
      if (g.done[seat]) return 'Already voted';
      const s = Number(a.v);
      if (g.ans[s] == null || s === seat) return 'Pick someone else’s';
      g.votes[seat] = s; g.done[seat] = true;
      if (!waiting(g, voters(g)).length) reveal(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => closeWriting(g) };
    if (g.phase === 'read') return { ms: Math.max(0, g.endAt - Date.now()), run: () => nextRead(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 8000 - Date.now()), run: () => (g.round >= g.total ? finish(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => {
    if (g.phase === 'write') return isDraw(g) ? { type: 'draw', strokes: BOT_STROKE() } : { type: 'answer', vals: [cfg.bot(g, s)] };
    if (g.phase === 'read') return { type: 'next' };
    if (g.phase === 'vote') { const o = g.list.filter(x => x !== s); return o.length ? { type: 'pick', v: pick(o) } : null; }
    return null;
  };
  E.label = (g, s) => (isDraw(g) ? (cfg.drawLabel ? cfg.drawLabel(g, s) : `Drawing ${g.list.indexOf(s) + 1}`) : g.ans[s]);
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) || g.phase === 'read' ? left(g) : 0, hud: hud(g, seat, cfg.judge ? 'Turn' : 'Round') };
    const card = cfg.card(g, seat);
    if (g.phase === 'write') {
      if (!writers(g).includes(seat)) v.ui = { k: 'wait', title: cfg.judgeWait || 'Sit back — they’re all working on you', sub: 'You’ll pick your favourite', card };
      else if (g.done[seat]) v.ui = { k: 'wait', title: isDraw(g) ? 'Drawing in ✓' : `“${g.ans[seat]}” ✓`, sub: `Waiting for ${waiting(g, writers(g)).length} more…`, card };
      else if (isDraw(g)) v.ui = { k: 'draw', key: 'd' + g.round, title: cfg.drawTitle ? cfg.drawTitle(g, seat) : cfg.title(g, seat), sub: cfg.sub, myturn: true, buzz: true, card, submit: 'Done' };
      else v.ui = { k: 'fields', key: 'w' + g.round, title: cfg.title(g, seat), sub: cfg.sub, myturn: true, buzz: true, card, fields: [{ ph: cfg.ph, max: cfg.max || 90, value: g.drafts[seat] || '' }], submit: 'Hand it in', need: 1 };
    } else if (g.phase === 'read') {
      const r = E.reader(g);
      v.ui = r === seat ? { k: 'buttons', key: 'r' + g.round + '.' + g.ri, title: cfg.readCue || 'Read yours out loud now!', sub: `“${g.ans[r]}”`, myturn: true, buzz: true, buttons: [{ type: 'next', label: 'Done reading', go: true }] }
        : { k: 'wait', title: `@${r}@ is reading`, sub: 'Listen up — votes are next' };
    } else if (g.phase === 'vote') {
      if (!voters(g).includes(seat)) v.ui = { k: 'wait', title: cfg.judge ? `@${hot(g)}@ is picking a favourite` : 'Nothing to vote on', sub: '' };
      else if (g.done[seat]) v.ui = { k: 'wait', title: 'Vote in ✓', sub: '' };
      else v.ui = { k: 'pick', key: 'v' + g.round, title: cfg.voteTitle, sub: cfg.judge ? 'Pick your favourite' : 'Not your own', myturn: true, buzz: true, options: g.list.filter(s => s !== seat).map(s => ({ v: s, label: E.label(g, s) })) };
    } else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.gain[seat] ? `+${g.gain[seat]}` : 'No points this time', sub: g.ans[seat] && !isDraw(g) ? `Yours: “${g.ans[seat]}”` : '' };
    else v.ui = overUI(g, seat, cfg.win);
    return v;
  };
  return E;
}

// ---------------------------------------------------------------- Fake Movie Pitch
export const fakepitch = writeVote({
  defaults: { rounds: 3, secs: 90 },
  personal: () => ({ title: D.movieTitle(), genre: pick(D.GENRES), star: pick(D.STARS) }),
  card: (g, s) => (g.mine[s] ? { kicker: `${g.mine[s].genre} · starring ${g.mine[s].star}`, big: g.mine[s].title } : null),
  title: () => 'Pitch your movie in one line', sub: 'Then read it out in your best trailer voice', ph: 'In a world where…', max: 140,
  read: 15, readCue: 'Read it like a movie trailer! 🎬',
  voteTitle: 'Which movie would you watch?', win: 'Hollywood wants you!',
  bot: g => pick(['In a world where nobody can whistle, one hero must learn.', 'This summer, the toaster strikes back.', 'One town. One goat. One last chance.']),
});

// ---------------------------------------------------------------- Translate This
export const translatethis = writeVote({
  defaults: { rounds: 4, secs: 75 },
  setup(g) { g.sentence = pick(D.PLAIN); g.style = pick(D.STYLES); },
  card: g => ({ kicker: `Say it like ${g.style.name}`, big: g.sentence, small: g.style.tip }),
  title: g => `Rewrite it like ${g.style.name}`, sub: 'Funniest version wins', ph: 'Your version…', max: 140,
  voteTitle: 'Funniest version?', win: 'Master translator!',
  bot: g => `${g.sentence} ${pick(['Arr!', 'Hmph.', 'Forsooth!', 'Waaah!'])}`,
});

// ---------------------------------------------------------------- Excuses, Excuses
export const excuses = writeVote({
  defaults: { rounds: 5, secs: 60 },
  setup(g) { g.situation = pick(D.SITUATIONS); },
  card: g => ({ kicker: 'Explain yourself…', big: g.situation }),
  title: () => 'Write your most believable excuse', sub: 'Most believable gets the votes', ph: 'I can explain…', max: 120,
  voteTitle: 'Most believable excuse?', win: 'Totally believable!',
  bot: () => pick(['I was looking for the cat.', 'It was for a school project.', 'My phone told me to.', 'I was sleepwalking, honestly.']),
});

// ---------------------------------------------------------------- Two Words
export const twowords = writeVote({
  defaults: { rounds: 3, secs: 75 },
  personal: () => { const w = shuffle([...new Set([...LISTS.easy, ...LISTS.medium])]).slice(0, 2); return { words: w, kind: pick(D.INVENT) }; },
  card: (g, s) => (g.mine[s] ? { kicker: `Invent a ${g.mine[s].kind.name}`, big: `${g.mine[s].words[0]} + ${g.mine[s].words[1]}`, small: g.mine[s].kind.tip } : null),
  title: (g, s) => `Name it and pitch it in one sentence`, sub: 'Use both words', ph: 'The Banana Rocket: …', max: 140,
  voteTitle: 'Best invention?', win: 'Genius inventor!',
  bot: (g, s) => { const m = g.mine[s]; return m ? `The ${m.words[0]} ${m.words[1]}: you didn’t know you needed it.` : 'Something amazing.'; },
});

// ---------------------------------------------------------------- Plot Twist
export const plottwist = writeVote({
  defaults: { rounds: 3, secs: 90 },
  setup(g) { g.story = pick(D.STORIES); },
  card: g => ({ kicker: 'The story so far…', big: g.story }),
  title: () => 'Write the twist ending', sub: 'Keep it secret — the table reads them out', ph: 'But then…', max: 160,
  read: 12, readCue: 'Read your twist out loud — make it dramatic!',
  voteTitle: 'Best twist?', win: 'Master of twists!',
  bot: () => pick(['But then it turned out it was all a dream… of a goldfish.', 'Suddenly, everyone realised the butler was a robot.', 'And that is why the moon is made of cheese.']),
});

// ---------------------------------------------------------------- Draw Your Partner
// Everyone draws the next player round the table (a ring, so any number of players works).
const target = (g, s) => { const i = g.order.indexOf(s); return g.order[(i + g.round) % g.order.length] === s ? g.order[(i + 1) % g.order.length] : g.order[(i + g.round) % g.order.length]; };
export const drawpartner = writeVote({
  defaults: { rounds: 2, secs: 90 },
  draw: () => true,
  personal: (g, s) => ({ who: target(g, s) }),
  card: (g, s) => (g.mine[s] ? { kicker: 'Secretly draw…', big: `@${g.mine[s].who}@` } : null),
  title: (g, s) => `Draw @${g.mine[s]?.who}@ — secretly!`, sub: 'No peeking, no showing', drawTitle: (g, s) => `Draw @${g.mine[s]?.who}@ — secretly!`,
  drawLabel: (g, s) => `Portrait of @${g.mine[s]?.who}@`,
  voteTitle: 'Best likeness?', win: 'Portrait master!',
  bot: () => '',
});

// ---------------------------------------------------------------- Worst Gift (the hot seat picks)
export const worstgift = writeVote({
  defaults: { laps: 1, secs: 75, mode: 0 },
  judge: true,
  draw: g => g.settings.mode === 1,
  setup(g) { g.occasion = pick(D.OCCASIONS); },
  card: g => ({ kicker: g.occasion, big: `The worst gift for @${g.hotSeat}@` }),
  title: g => `The worst gift for @${g.hotSeat}@`, drawTitle: g => `Draw the worst gift for @${g.hotSeat}@`, sub: 'They pick their favourite', ph: 'A gift card for…', max: 100,
  judgeWait: 'Everyone is choosing your worst gift…',
  voteTitle: 'Which gift do you “love” most?', win: 'Worst gift giver!',
  bot: () => pick(['A single used sock', 'A framed photo of their own feet', 'A year’s supply of broccoli', 'A pet rock with no name']),
});

// ================================================================ Hot Takes
export const hottakes = (() => {
  const E = {};
  E.hot = g => g.order[(g.round - 1) % g.order.length];
  E.createGame = (s, p) => { const g = base(s, p, { laps: 1, secs: 30 }); g.round = 0; g.total = g.order.length * g.settings.laps; g.deck = shuffle(D.HOT_TAKES.map((_, i) => i)); start(g); return g; };
  function start(g) { g.round++; g.take = D.HOT_TAKES[g.deck.pop() ?? R(D.HOT_TAKES.length)]; g.done = {}; g.votes = {}; g.gain = {}; g.phase = 'ready'; g.endAt = Date.now() + 6000; g.moveId++; }
  const voters = g => g.order.filter(s => s !== E.hot(g));
  function defend(g) { g.phase = 'defend'; g.endAt = Date.now() + g.settings.secs * 1000; sfx(g, 'ding'); g.moveId++; }
  function vote(g) { g.phase = 'vote'; g.done = {}; g.endAt = Date.now() + 25000; g.moveId++; }
  function reveal(g) {
    const H = E.hot(g);
    for (const s of g.order) g.gain[s] = 0;
    g.yes = Object.values(g.votes).filter(Boolean).length;
    g.gain[H] = g.yes * 2;
    g.score[H] += g.gain[H];
    sfx(g, g.yes > voters(g).length / 2 ? 'chime' : 'sad'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'vote';
  E.turnSeat = g => (g.phase === 'defend' || g.phase === 'ready' ? E.hot(g) : -1);
  E.pending = g => (g.phase === 'vote' ? waiting(g, voters(g)) : g.phase === 'defend' ? [E.hot(g)] : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if ((g.phase === 'defend' || g.phase === 'ready') && a.type === 'rest' && seat === E.hot(g)) { if (g.phase === 'ready') defend(g); else vote(g); return null; }
    if (g.phase === 'vote' && a.type === 'pick') {
      if (seat === E.hot(g)) return 'You’re the one being judged';
      if (g.done[seat]) return 'Already voted';
      g.votes[seat] = a.v === 'yes'; g.done[seat] = true;
      if (!waiting(g, voters(g)).length) reveal(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'ready') return { ms: Math.max(0, g.endAt - Date.now()), run: () => defend(g) };
    if (g.phase === 'defend') return { ms: Math.max(0, g.endAt - Date.now()) + 300, run: () => vote(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 6500 - Date.now()), run: () => (g.round >= g.total ? finish(g) : start(g)) };
    return null;
  };
  E.botDelay = g => (g.phase === 'defend' ? 6000 : 1200);
  E.botAction = g => (g.phase === 'vote' ? { type: 'pick', v: Math.random() < .5 ? 'yes' : 'no' } : { type: 'rest' });
  E.viewFor = (g, seat) => {
    const H = E.hot(g), me = seat === H;
    const v = { phase: g.phase, moveId: g.moveId, left: ['ready', 'defend', 'vote'].includes(g.phase) ? left(g) : 0, hud: hud(g, seat, 'Turn') };
    const card = { kicker: 'Hot take', big: g.take };
    if (g.phase === 'ready') v.ui = me ? { k: 'buttons', key: 'r' + g.round, title: 'You’re defending this!', sub: 'Out loud, 30 seconds, as if your life depends on it', myturn: true, buzz: true, card, buttons: [{ type: 'rest', label: 'I’m ready — start the clock', go: true }] } : { k: 'wait', title: `@${H}@ has to defend this`, sub: 'Get ready to judge', card };
    else if (g.phase === 'defend') v.ui = me ? { k: 'buttons', key: 'd' + g.round, title: 'Defend it! Go go go!', sub: 'Convince the room', myturn: true, card, buttons: [{ type: 'rest', label: 'I rest my case', go: true }] } : { k: 'wait', title: `@${H}@ is defending`, sub: 'Listen… then decide', card };
    else if (g.phase === 'vote') v.ui = me ? { k: 'wait', title: 'The room is deciding…', sub: '', card } : g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: '' } : { k: 'pick', key: 'v' + g.round, title: `Did @${H}@ convince you?`, sub: '', myturn: true, buzz: true, card, options: [{ v: 'yes', label: 'Convinced ✓' }, { v: 'no', label: 'Not buying it ✗' }] };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: me ? `${g.yes} convinced · +${g.gain[H]}` : `${g.yes} of ${voters(g).length} were convinced`, sub: '' };
    else v.ui = overUI(g, seat, 'Most convincing!');
    return v;
  };
  E.voters = voters;
  return E;
})();

// ================================================================ Who Said That?
export const whosaidthat = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 2, secs: 60 }); g.round = 0; g.total = g.settings.rounds; g.deck = shuffle(D.QUESTIONS.map((_, i) => i)); start(g); return g; };
  function start(g) { g.round++; g.q = D.QUESTIONS[g.deck.pop() ?? R(D.QUESTIONS.length)]; g.ans = {}; g.drafts = {}; g.done = {}; g.phase = 'write'; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; }
  function closeWriting(g) { for (const s of g.order) if (!g.ans[s] && g.drafts[s]) g.ans[s] = g.drafts[s]; g.list = shuffle(Object.keys(g.ans).map(Number)); g.qi = -1; next(g); }
  function next(g) { g.qi++; if (g.qi >= g.list.length) return g.round >= g.total ? finish(g) : start(g); g.guess = {}; g.done = {}; g.phase = 'guess'; g.endAt = Date.now() + 25000; g.moveId++; if (!guessers(g).length) reveal(g); }
  const author = g => g.list[g.qi];
  const guessers = g => g.order.filter(s => s !== author(g));
  function reveal(g) {
    const A = author(g); g.gain = {};
    for (const s of g.order) g.gain[s] = 0;
    for (const s of guessers(g)) { if (g.guess[s] === A) g.gain[s] = 2; else if (g.guess[s] != null) g.gain[A]++; }
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.author = author;
  E.collecting = g => g.phase === 'write' || g.phase === 'guess';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'write' ? waiting(g) : g.phase === 'guess' ? waiting(g, guessers(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.draft = (g, s, d) => { if (g.phase !== 'write' || g.done[s]) return false; g.drafts[s] = cleanText((d.vals || [])[0], 90); return true; };
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'write' && a.type === 'answer') { if (g.done[seat]) return 'Already in'; const t = cleanText((a.vals || [])[0], 90); if (!t) return 'Write an answer'; g.ans[seat] = t; g.done[seat] = true; if (!waiting(g).length) closeWriting(g); else g.moveId++; return null; }
    if (g.phase === 'guess' && a.type === 'pick') {
      if (seat === author(g)) return 'That one’s yours — keep a straight face!';
      if (g.done[seat]) return 'Already guessed';
      const s = Number(a.v); if (!g.order.includes(s) || s === seat) return 'Pick someone else';
      g.guess[seat] = s; g.done[seat] = true;
      if (!waiting(g, guessers(g)).length) reveal(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'write') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => closeWriting(g) };
    if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 5500 - Date.now()), run: () => next(g) };
    return null;
  };
  E.botAction = (g, s) => (g.phase === 'write' ? { type: 'answer', vals: [pick(['Pizza, obviously', 'My grandma', 'Probably a dog', 'Never!', 'Space'])] } : { type: 'pick', v: pick(g.order.filter(x => x !== s)) });
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, hud: hud(g, seat) };
    const card = { kicker: 'Answer honestly', big: g.q };
    if (g.phase === 'write') v.ui = g.done[seat] ? { k: 'wait', title: `“${g.ans[seat]}” ✓`, sub: `Waiting for ${waiting(g).length} more…`, card } : { k: 'fields', key: 'w' + g.round, title: 'Answer in secret', sub: 'The room will guess it was you', myturn: true, buzz: true, card, fields: [{ ph: 'Your answer…', max: 90, value: g.drafts[seat] || '' }], submit: 'Hand it in', need: 1 };
    else if (g.phase === 'guess') {
      const A = author(g), quote = { kicker: g.q, big: `“${g.ans[A]}”` };
      v.ui = seat === A ? { k: 'wait', title: 'That’s yours! 🤫', sub: 'Poker face…', card: quote } : g.done[seat] ? { k: 'wait', title: 'Guess in ✓', sub: '', card: quote } : { k: 'pick', key: 'g' + g.round + '.' + g.qi, title: 'Who said that?', sub: 'Right: +2 · they get +1 for each person fooled', myturn: true, buzz: true, card: quote, options: g.order.filter(s => s !== seat).map(s => ({ v: s, label: `@${s}@`, dot: s })) };
    } else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.gain[seat] ? `+${g.gain[seat]}` : 'No points', sub: `It was @${author(g)}@!` };
    else v.ui = overUI(g, seat, 'You know everyone!');
    return v;
  };
  return E;
})();

// ================================================================ Interrogation
export const interrogation = (() => {
  const E = {};
  E.hot = g => g.order[(g.round - 1) % g.order.length];
  E.createGame = (s, p) => { const g = base(s, p, { laps: 1, mins: 2 }); g.round = 0; g.total = g.order.length * g.settings.laps; g.deck = shuffle(D.ALIBIS.map((_, i) => i)); start(g); return g; };
  function start(g) {
    g.round++; g.case = D.ALIBIS[g.deck.pop() ?? R(D.ALIBIS.length)]; g.lying = Math.random() < .5;
    g.done = {}; g.votes = {}; g.gain = {}; g.phase = 'brief'; g.endAt = Date.now() + 20000; g.moveId++;
  }
  const jury = g => g.order.filter(s => s !== E.hot(g));
  function grill(g) { g.phase = 'grill'; g.endAt = Date.now() + g.settings.mins * 60000; sfx(g, 'ding'); g.moveId++; }
  function vote(g) { g.phase = 'vote'; g.done = {}; g.endAt = Date.now() + 30000; g.moveId++; }
  function reveal(g) {
    const H = E.hot(g);
    for (const s of g.order) g.gain[s] = 0;
    for (const s of jury(g)) { if (g.votes[s] == null) continue; if (g.votes[s] === g.lying) g.gain[s] = 2; else g.gain[H]++; }
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'vote';
  E.turnSeat = g => (['brief', 'grill'].includes(g.phase) ? E.hot(g) : -1);
  E.pending = g => (g.phase === 'vote' ? waiting(g, jury(g)) : g.phase === 'brief' || g.phase === 'grill' ? [E.hot(g)] : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (a.type === 'go' && seat === E.hot(g)) { if (g.phase === 'brief') grill(g); else if (g.phase === 'grill') vote(g); else return 'Not now'; return null; }
    if (g.phase === 'vote' && a.type === 'pick') {
      if (seat === E.hot(g)) return 'You’re the suspect!';
      if (g.done[seat]) return 'Already voted';
      g.votes[seat] = a.v === 'lie'; g.done[seat] = true;
      if (!waiting(g, jury(g)).length) reveal(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'brief') return { ms: Math.max(0, g.endAt - Date.now()), run: () => grill(g) };
    if (g.phase === 'grill') return { ms: Math.max(0, g.endAt - Date.now()) + 300, run: () => vote(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 7000 - Date.now()), run: () => (g.round >= g.total ? finish(g) : start(g)) };
    return null;
  };
  E.botDelay = g => (g.phase === 'grill' ? 8000 : 1500);
  E.botAction = g => (g.phase === 'vote' ? { type: 'pick', v: Math.random() < .5 ? 'lie' : 'truth' } : { type: 'go' });
  E.viewFor = (g, seat) => {
    const H = E.hot(g), me = seat === H, c = g.case;
    const v = { phase: g.phase, moveId: g.moveId, left: ['brief', 'grill', 'vote'].includes(g.phase) ? left(g) : 0, hud: hud(g, seat, 'Suspect') };
    const pub = { kicker: c.crime, big: `Alibi: ${c.place}` };
    const secret = g.lying
      ? { kicker: '🤥 You were NOT there — LIE', big: `Claim you were ${c.place}`, small: 'Make up the details and keep your story straight' }
      : { kicker: '✅ You WERE there — tell the TRUTH', big: c.place, list: c.facts };
    if (g.phase === 'brief') v.ui = me ? { k: 'buttons', key: 'b' + g.round, title: 'You’re the suspect. Read your secret!', sub: 'The room will grill you for 2 minutes', myturn: true, buzz: true, card: secret, buttons: [{ type: 'go', label: 'I’m ready — start the questions', go: true }] } : { k: 'wait', title: `@${H}@ is the suspect`, sub: 'Think of tough questions…', card: pub };
    else if (g.phase === 'grill') v.ui = me ? { k: 'buttons', key: 'g' + g.round, title: 'Answer their questions!', sub: 'Stay calm…', myturn: true, card: secret, buttons: [{ type: 'go', label: 'End the questioning', go: false }] } : { k: 'wait', title: `Grill @${H}@!`, sub: 'Ask anything about their alibi, out loud', card: pub };
    else if (g.phase === 'vote') v.ui = me ? { k: 'wait', title: 'The jury is out…', sub: '', card: secret } : g.done[seat] ? { k: 'wait', title: 'Verdict in ✓', sub: '' } : { k: 'pick', key: 'v' + g.round, title: `Is @${H}@ lying?`, sub: 'Right: +2 · the suspect gets +1 for each person fooled', myturn: true, buzz: true, card: pub, options: [{ v: 'lie', label: 'Lying 🤥' }, { v: 'truth', label: 'Telling the truth ✅' }] };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.lying ? `@${H}@ was LYING!` : `@${H}@ told the truth!`, sub: g.gain[seat] ? `+${g.gain[seat]}` : 'No points' };
    else v.ui = overUI(g, seat, 'Master detective!');
    return v;
  };
  E.jury = jury;
  return E;
})();

// ================================================================ Lip Reader
export const lipreader = (() => {
  const E = {};
  E.hot = g => g.order[(g.round - 1) % g.order.length];
  E.createGame = (s, p) => { const g = base(s, p, { laps: 2, secs: 45 }); g.round = 0; g.total = g.order.length * g.settings.laps; g.deck = shuffle(D.PHRASES.map((_, i) => i)); start(g); return g; };
  function start(g) { g.round++; g.phrase = D.PHRASES[g.deck.pop() ?? R(D.PHRASES.length)]; g.ans = {}; g.drafts = {}; g.done = {}; g.gain = {}; g.phase = 'mouth'; g.endAt = Date.now() + g.settings.secs * 1000; sfx(g, 'ding'); g.moveId++; }
  const guessers = g => g.order.filter(s => s !== E.hot(g));
  function reveal(g) {
    const H = E.hot(g);
    for (const s of g.order) if (!g.ans[s] && g.drafts[s]) g.ans[s] = g.drafts[s];
    for (const s of g.order) g.gain[s] = 0;
    g.right = {};
    for (const s of guessers(g)) if (g.ans[s] && same(g.ans[s], g.phrase)) { g.right[s] = true; g.gain[s] = 2; g.gain[H]++; }
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'mouth';
  E.turnSeat = g => (g.phase === 'mouth' ? E.hot(g) : -1);
  E.pending = g => (g.phase === 'mouth' ? waiting(g, guessers(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.draft = (g, s, d) => { if (g.phase !== 'mouth' || g.done[s]) return false; g.drafts[s] = cleanText((d.vals || [])[0], 60); return true; };
  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'mouth') return 'Not now';
    if (a.type === 'stop' && seat === E.hot(g)) { reveal(g); return null; }
    if (a.type === 'answer') {
      if (seat === E.hot(g)) return 'You’re mouthing it!';
      if (g.done[seat]) return 'Locked in';
      const t = cleanText((a.vals || [])[0], 60); if (!t) return 'Type a guess';
      g.ans[seat] = t; g.done[seat] = true;
      if (!waiting(g, guessers(g)).length) reveal(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'mouth') return { ms: Math.max(0, g.endAt - Date.now()) + 1000, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 8000 - Date.now()), run: () => (g.round >= g.total ? finish(g) : start(g)) };
    return null;
  };
  E.botAction = g => ({ type: 'answer', vals: [Math.random() < .3 ? g.phrase : pick(['I love potatoes', 'Where is my sock', 'Banana phone', 'Nice to meet you'])] });
  E.viewFor = (g, seat) => {
    const H = E.hot(g), me = seat === H;
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'mouth' ? left(g) : 0, hud: hud(g, seat, 'Turn') };
    if (g.phase === 'mouth') v.ui = me ? { k: 'buttons', key: 'm' + g.round, title: 'Mouth this — no sound!', sub: 'Exaggerate every word. No pointing, no spelling.', myturn: true, buzz: true, card: { kicker: 'Your phrase', big: g.phrase }, buttons: [{ type: 'stop', label: 'Everyone’s done', go: false }] }
      : g.done[seat] ? { k: 'wait', title: `“${g.ans[seat]}” ✓`, sub: `Waiting for ${waiting(g, guessers(g)).length} more…` }
      : { k: 'fields', key: 'm' + g.round, title: `Read @${H}@’s lips!`, sub: 'Type what they’re saying · right: +2', myturn: true, buzz: true, fields: [{ ph: 'They’re saying…', max: 60, value: g.drafts[seat] || '' }], submit: 'Lock it in', need: 1 };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: me ? `${Object.keys(g.right).length} got it · +${g.gain[seat]}` : g.right[seat] ? 'Nailed it! +2' : 'Not quite', sub: `It was “${g.phrase}”` };
    else v.ui = overUI(g, seat, 'Lip-reading legend!');
    return v;
  };
  E.guessers = guessers;
  return E;
})();

// ================================================================ Guilty Conscience
export const guilty = (() => {
  const E = {};
  E.createGame = (s, p) => { const g = base(s, p, { rounds: 6 }); g.round = 0; g.total = g.settings.rounds; g.deck = shuffle(D.CONFESSIONS.map((_, i) => i)); start(g); return g; };
  function start(g) { g.round++; g.q = D.CONFESSIONS[g.deck.pop() ?? R(D.CONFESSIONS.length)]; g.yes = {}; g.done = {}; g.sel = {}; g.gain = {}; g.phase = 'answer'; g.endAt = Date.now() + 30000; g.moveId++; }
  function toGuess(g) {
    for (const s of g.order) if (g.yes[s] == null) g.yes[s] = false;
    g.count = g.order.filter(s => g.yes[s]).length;
    if (g.count === 0 || g.count === g.order.length) return reveal(g);
    g.phase = 'guess'; g.done = {}; for (const s of g.order) g.sel[s] = []; g.endAt = Date.now() + 40000; g.moveId++;
  }
  function reveal(g) {
    for (const s of g.order) { g.gain[s] = 0; if (g.phase === 'guess') for (const x of g.sel[s] || []) if (g.yes[x]) g.gain[s]++; }
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'answer' || g.phase === 'guess';
  E.turnSeat = () => -1;
  E.pending = g => (E.collecting(g) ? waiting(g) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'answer' && a.type === 'pick') { if (g.done[seat]) return 'Already answered'; g.yes[seat] = a.v === 'yes'; g.done[seat] = true; if (!waiting(g).length) toGuess(g); else g.moveId++; return null; }
    if (g.phase === 'guess' && a.type === 'toggle') {
      if (g.done[seat]) return 'Locked in';
      const s = Number(a.v); if (!g.order.includes(s)) return 'Who?';
      const L = g.sel[seat];
      if (L.includes(s)) L.splice(L.indexOf(s), 1); else { if (L.length >= g.count) return `Pick only ${g.count}`; L.push(s); }
      g.moveId++; return null;
    }
    if (g.phase === 'guess' && a.type === 'lock') { if (g.done[seat]) return 'Locked in'; g.done[seat] = true; if (!waiting(g).length) reveal(g); else g.moveId++; return null; }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'answer') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => toGuess(g) };
    if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 6500 - Date.now()), run: () => (g.round >= g.total ? finish(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => {
    if (g.phase === 'answer') return { type: 'pick', v: Math.random() < .4 ? 'yes' : 'no' };
    const L = g.sel[s] || [];
    if (L.length < g.count) { const o = g.order.filter(x => !L.includes(x)); if (o.length) return { type: 'toggle', v: pick(o) }; }
    return { type: 'lock' };
  };
  E.viewFor = (g, seat) => {
    const v = { phase: g.phase, moveId: g.moveId, left: E.collecting(g) ? left(g) : 0, hud: hud(g, seat) };
    const card = { kicker: 'Have you ever…', big: g.q };
    if (g.phase === 'answer') v.ui = g.done[seat] ? { k: 'wait', title: 'Answer in ✓ — nobody will see it', sub: `Waiting for ${waiting(g).length} more…`, card } : { k: 'pick', key: 'a' + g.round, title: 'Be honest — it’s anonymous', sub: '', myturn: true, buzz: true, card, options: [{ v: 'yes', label: 'Yes 😬' }, { v: 'no', label: 'No 😇' }] };
    else if (g.phase === 'guess') {
      const L = g.sel[seat] || [];
      v.ui = g.done[seat] ? { k: 'wait', title: 'Guesses locked ✓', sub: `Waiting for ${waiting(g).length} more…`, card } : { k: 'toggles', key: 'g' + g.round, title: `${g.count} said yes — who?`, sub: `Pick up to ${g.count} · +1 for each right guess`, myturn: true, buzz: true, card, options: g.order.map(s => ({ v: s, label: s === seat ? 'Me' : `@${s}@`, dot: s, on: L.includes(s) })), buttons: [{ type: 'lock', label: `Lock in (${L.length}/${g.count})`, go: true }] };
    } else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.count === 0 ? 'Nobody! What angels 😇' : g.count === g.order.length ? 'EVERYONE! 😂' : `${g.count} said yes`, sub: g.gain[seat] ? `+${g.gain[seat]} for good guesses` : '' };
    else v.ui = overUI(g, seat, 'You can read a room!');
    return v;
  };
  return E;
})();

// ================================================================ Emoji Story
export const EMOJI_ONLY = t => String(t || '').replace(/[A-Za-z0-9]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
export const emojistory = (() => {
  const E = {};
  E.hot = g => g.order[(g.round - 1) % g.order.length];
  E.createGame = (s, p) => { const g = base(s, p, { laps: 1, secs: 60 }); g.round = 0; g.total = g.order.length * g.settings.laps; g.deck = shuffle(D.EMOJI_PROMPTS.map((_, i) => i)); start(g); return g; };
  function start(g) { g.round++; g.secret = D.EMOJI_PROMPTS[g.deck.pop() ?? R(D.EMOJI_PROMPTS.length)]; g.story = ''; g.ans = {}; g.drafts = {}; g.done = {}; g.votes = {}; g.gain = {}; g.phase = 'tell'; g.endAt = Date.now() + 75000; g.moveId++; }
  const guessers = g => g.order.filter(s => s !== E.hot(g));
  function toGuess(g) { if (!g.story) g.story = EMOJI_ONLY(g.drafts[E.hot(g)]) || '❓'; g.phase = 'guess'; g.done = {}; g.drafts = {}; g.endAt = Date.now() + g.settings.secs * 1000; g.moveId++; }
  function toVote(g) {
    for (const s of guessers(g)) if (!g.ans[s] && g.drafts[s]) g.ans[s] = g.drafts[s];
    g.list = shuffle(Object.keys(g.ans).map(Number));
    if (!g.list.length) return reveal(g);
    g.phase = 'vote'; g.done = {}; g.endAt = Date.now() + 40000; g.moveId++;
  }
  // The storyteller picks the closest guess; everyone else votes for the funniest one.
  const voters = g => g.order.filter(s => s === E.hot(g) || g.list.some(a => a !== s));
  function reveal(g) {
    const H = E.hot(g);
    for (const s of g.order) g.gain[s] = 0;
    g.closest = g.votes[H];
    if (g.closest != null) { g.gain[g.closest] += 3; g.gain[H] += 2; }
    for (const [s, x] of Object.entries(g.votes)) if (Number(s) !== H) g.gain[x]++;
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, 'chime'); g.phase = 'reveal'; g.endAt = 0; g.revAt = Date.now(); g.moveId++;
  }
  E.collecting = g => g.phase === 'guess' || g.phase === 'vote';
  E.turnSeat = g => (g.phase === 'tell' ? E.hot(g) : -1);
  E.pending = g => (g.phase === 'tell' ? [E.hot(g)] : g.phase === 'guess' ? waiting(g, guessers(g)) : g.phase === 'vote' ? waiting(g, voters(g)) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.draft = (g, s, d) => {
    if (g.phase === 'tell' && s === E.hot(g)) { g.drafts[s] = (d.vals || [])[0]; return false; }
    if (g.phase !== 'guess' || g.done[s] || s === E.hot(g)) return false;
    g.drafts[s] = cleanText((d.vals || [])[0], 90); return true;
  };
  E.applyAction = (g, seat, a) => {
    if (!a) return 'Nothing to do';
    if (g.phase === 'tell' && a.type === 'answer') {
      if (seat !== E.hot(g)) return 'Not your story';
      const t = EMOJI_ONLY((a.vals || [])[0]);
      if (!/\p{Extended_Pictographic}/u.test(t)) return 'Emoji only — use your emoji keyboard';
      g.story = t; toGuess(g); return null;
    }
    if (g.phase === 'guess' && a.type === 'answer') {
      if (seat === E.hot(g)) return 'You know it already!';
      if (g.done[seat]) return 'Already in';
      const t = cleanText((a.vals || [])[0], 90); if (!t) return 'Write a guess';
      g.ans[seat] = t; g.done[seat] = true;
      if (!waiting(g, guessers(g)).length) toVote(g); else g.moveId++;
      return null;
    }
    if (g.phase === 'vote' && a.type === 'pick') {
      if (!voters(g).includes(seat)) return 'Nothing to vote on';
      if (g.done[seat]) return 'Already voted';
      const s = Number(a.v); if (!g.ans[s] || s === seat) return 'Pick someone else’s';
      g.votes[seat] = s; g.done[seat] = true;
      if (!waiting(g, voters(g)).length) reveal(g); else g.moveId++;
      return null;
    }
    return 'Not now';
  };
  E.tick = g => {
    if (g.phase === 'tell') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => toGuess(g) };
    if (g.phase === 'guess') return { ms: Math.max(0, g.endAt - Date.now()) + 1200, run: () => toVote(g) };
    if (g.phase === 'vote') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + 8000 - Date.now()), run: () => (g.round >= g.total ? finish(g) : start(g)) };
    return null;
  };
  E.botAction = (g, s) => {
    if (g.phase === 'tell') return { type: 'answer', vals: [pick(['🐶🚀🌕', '👵🍰🔥', '🧛‍♂️🦷🪥', '🐟🎤⭐'])] };
    if (g.phase === 'guess') return { type: 'answer', vals: [pick(['A dog goes to space', 'Grandma burns the cake', 'A vampire at the dentist', 'A fish wins a talent show'])] };
    const o = g.list.filter(x => x !== s); return o.length ? { type: 'pick', v: pick(o) } : null;
  };
  E.viewFor = (g, seat) => {
    const H = E.hot(g), me = seat === H;
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'tell' || E.collecting(g) ? left(g) : 0, hud: hud(g, seat, 'Turn') };
    const story = { kicker: `@${H}@’s emoji story`, big: g.story };
    if (g.phase === 'tell') v.ui = me ? { k: 'fields', key: 't' + g.round, title: 'Tell this story in emoji only', sub: 'Use your emoji keyboard — letters and numbers are removed', myturn: true, buzz: true, card: { kicker: 'Your secret story', big: g.secret }, fields: [{ ph: '🐶🚀🌕…', max: 60, value: '' }], submit: 'Send my story', need: 1 } : { k: 'wait', title: `@${H}@ is writing an emoji story…`, sub: 'Get ready to decode it' };
    else if (g.phase === 'guess') v.ui = me ? { k: 'wait', title: 'They’re decoding your story…', sub: '', card: story } : g.done[seat] ? { k: 'wait', title: `“${g.ans[seat]}” ✓`, sub: `Waiting for ${waiting(g, guessers(g)).length} more…`, card: story } : { k: 'fields', key: 'g' + g.round, title: 'What’s the story?', sub: 'Closest guess: +3 · funny wrong guesses get votes too', myturn: true, buzz: true, card: story, fields: [{ ph: 'I think it’s…', max: 90, value: g.drafts[seat] || '' }], submit: 'Hand it in', need: 1 };
    else if (g.phase === 'vote') v.ui = !voters(g).includes(seat) ? { k: 'wait', title: 'Nothing to vote on', sub: '' } : g.done[seat] ? { k: 'wait', title: 'Vote in ✓', sub: '' } : { k: 'pick', key: 'v' + g.round, title: me ? 'Which guess is closest?' : 'Funniest guess?', sub: me ? `The real story: “${g.secret}”` : 'Not your own', myturn: true, buzz: true, options: g.list.filter(s => s !== seat).map(s => ({ v: s, label: g.ans[s] })) };
    else if (g.phase === 'reveal') v.ui = { k: 'wait', title: g.gain[seat] ? `+${g.gain[seat]}` : 'No points', sub: `It was “${g.secret}”` };
    else v.ui = overUI(g, seat, 'Emoji master!');
    return v;
  };
  E.guessers = guessers;
  E.voters = voters;
  return E;
})();
