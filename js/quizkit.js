// The quiz-show kit: one engine for many question games. A game gives it a question source and a
// mode; the table shows the question (and anything to look at), everyone answers on their own
// phone at the same time, and the table reveals the answer.
//   mode 'mc'      — tap one of the options (q.opts, q.a = index)
//   mode 'type'    — type the answer (q.a = answer or [answers]; small typos forgiven)
//   mode 'closest' — type a number (q.a = number); closest scores most
//   mode 'order'   — tap the options in the right order (q.a = indexes in order)
// Options: rounds, secs, firstOnly (only the first right answer scores; wrong answers lose points),
// elim (a wrong or missing answer knocks you out), flash (ms the table shows q.show before hiding it).
// A question: { q, big?, show?, opts?, a, note?, pts? }.
import { base, shuffle, same, cleanText, sfx, left, waiting, announce } from './party.js?v=68';

export function quizEngine(src, cfg = {}) {
  const mode = cfg.mode || 'mc';
  const E = {};
  E.mode = mode;
  E.createGame = (settings, players) => {
    const g = base(settings, players, { rounds: cfg.rounds || 10, secs: cfg.secs || 20 });
    g.alive = [...g.order];
    g.used = [];
    g.round = 0;
    next(g);
    return g;
  };
  // A fresh question that hasn't been asked this game.
  function newQ(g) {
    for (let k = 0; k < 40; k++) {
      const q = src(g);
      const key = JSON.stringify([q.q, q.big, q.show, q.a]);
      if (!g.used.includes(key)) { g.used.push(key); return q; }
    }
    return src(g);
  }
  function next(g) {
    g.round++;
    g.Q = newQ(g);
    // Shuffle options for multiple choice (remembering where the answer went).
    if ((mode === 'mc' || mode === 'order') && g.Q.opts && !g.Q.fixed) {
      const idx = shuffle(g.Q.opts.map((_, i) => i));
      const opts = idx.map(i => g.Q.opts[i]);
      g.Q.a = mode === 'mc' ? idx.indexOf(g.Q.a) : g.Q.a.map(a => idx.indexOf(a));
      g.Q.opts = opts;
    }
    g.ans = {};
    g.sel = {};
    g.done = {};
    g.locked = {};
    g.flashing = !!cfg.flash;
    g.phase = 'ask';
    g.askAt = Date.now();
    g.endAt = g.askAt + (cfg.flash || 0) + g.settings.secs * 1000;
    g.moveId++;
  }
  const players = g => (cfg.elim ? g.alive : g.order);
  E.collecting = g => g.phase === 'ask';
  E.turnSeat = () => -1;
  E.pending = g => (g.phase === 'ask' && !g.flashing ? waiting(g, players(g)).filter(s => !g.locked[s]) : []);
  E.current = g => E.pending(g)[0] ?? -1;
  E.botDelay = () => 1500 + Math.random() * 4000;

  const isRight = (g, s) => {
    const A = g.ans[s];
    if (A == null) return false;
    if (mode === 'mc') return A.v === g.Q.a;
    if (mode === 'type') return same(A.v, [].concat(g.Q.a));
    if (mode === 'order') return JSON.stringify(A.v) === JSON.stringify(g.Q.a);
    return false;
  };
  function reveal(g) {
    const P = players(g);
    g.gain = {};
    for (const s of g.order) g.gain[s] = 0;
    const base = g.Q.pts || 100;
    if (mode === 'closest') {
      const d = s => Math.abs(g.ans[s].v - g.Q.a);
      const answered = P.filter(s => g.ans[s] && Number.isFinite(g.ans[s].v)).sort((a, b) => d(a) - d(b) || g.ans[a].t - g.ans[b].t);
      const dists = [...new Set(answered.map(d))];
      for (const s of answered) { const r = dists.indexOf(d(s)); g.gain[s] = r === 0 ? base : r === 1 ? Math.round(base * 0.6) : r === 2 ? Math.round(base * 0.3) : 0; if (d(s) === 0) g.gain[s] += 50; }
      g.right = answered.filter(s => d(s) === dists[0]);
    } else if (mode === 'order') {
      g.right = P.filter(s => isRight(g, s));
      for (const s of P) if (g.ans[s]) { const ok = g.ans[s].v.filter((v, i) => v === g.Q.a[i]).length; g.gain[s] = ok * Math.round(base / 4) + (ok === g.Q.a.length ? 50 : 0); }
    } else {
      const right = P.filter(s => isRight(g, s)).sort((a, b) => g.ans[a].t - g.ans[b].t);
      g.right = right;
      const secs = g.settings.secs * 1000;
      if (cfg.firstOnly) {
        if (right[0] != null) g.gain[right[0]] = base;
        for (const s of P) if (g.ans[s] && !isRight(g, s)) g.gain[s] = -Math.round(base / 2);
      } else right.forEach((s, k) => { g.gain[s] = Math.max(20, Math.round(base - ((g.ans[s].t - g.askAt - (cfg.flash || 0)) / secs) * (base * 0.7))) + (k === 0 ? 25 : 0); });
      if (cfg.elim) { g.knocked = g.alive.filter(s => !isRight(g, s)); if (g.knocked.length < g.alive.length) g.alive = g.alive.filter(s => isRight(g, s)); else g.knocked = []; }
    }
    for (const s of g.order) g.score[s] += g.gain[s];
    sfx(g, g.right.length ? 'ding' : 'sad');
    g.phase = 'reveal';
    g.endAt = 0;
    g.revAt = Date.now();
    g.moveId++;
  }
  function done(g) {
    let w;
    if (cfg.elim && g.alive.length) { const top = Math.max(...g.alive.map(s => g.score[s])); w = g.alive.filter(s => g.score[s] === top); }
    else { const top = Math.max(...g.order.map(s => g.score[s])); w = g.order.filter(s => g.score[s] === top); }
    g.winners = w; g.winner = w[0]; g.phase = 'over'; g.moveId++;
  }

  E.applyAction = (g, seat, a) => {
    if (!a || g.phase !== 'ask') return 'Not now';
    if (!players(g).includes(seat)) return cfg.elim ? 'You’re out — cheer the others on!' : "You're not in this game";
    if (g.flashing) return 'Look at the table!';
    if (g.done[seat] || g.locked[seat]) return 'Already answered';
    let v;
    if (mode === 'mc') { v = Number(a.v); if (!(v >= 0 && v < g.Q.opts.length)) return 'Pick an answer'; }
    else if (mode === 'type') { v = cleanText((a.vals || [])[0], 60); if (!v) return 'Type an answer'; }
    else if (mode === 'closest') { v = Number(String((a.vals || [])[0] ?? '').replace(/[, ]/g, '')); if (!Number.isFinite(v) || String((a.vals || [])[0] ?? '').trim() === '') return 'Type a number'; }
    else if (mode === 'order') {
      if (a.type === 'undo') { (g.sel[seat] || []).pop(); g.moveId++; return null; }
      const i = Number(a.v), cur = g.sel[seat] || (g.sel[seat] = []);
      if (!(i >= 0 && i < g.Q.opts.length) || cur.includes(i)) return 'Pick the next one';
      cur.push(i);
      if (cur.length < g.Q.opts.length) { g.moveId++; return null; }
      v = cur;
    }
    g.ans[seat] = { v, t: Date.now() };
    // Buzz-in: a wrong answer just locks you out; a right one ends the question.
    if (cfg.firstOnly) {
      if (isRight(g, seat)) { announce(g, seat, 'Buzz! ✓'); g.done[seat] = true; return reveal(g), null; }
      g.locked[seat] = true; announce(g, seat, 'Buzz! ✗');
    } else g.done[seat] = true;
    if (!E.pending(g).length) reveal(g); else g.moveId++;
    return null;
  };
  E.tick = g => {
    if (g.phase === 'ask' && g.flashing) return { ms: Math.max(0, g.askAt + cfg.flash - Date.now()), run: () => { g.flashing = false; g.moveId++; } };
    if (g.phase === 'ask') return { ms: Math.max(0, g.endAt - Date.now()) + 600, run: () => reveal(g) };
    if (g.phase === 'reveal') return { ms: Math.max(0, g.revAt + (cfg.revealMs || 5000) - Date.now()), run: () => {
      if (g.round >= g.settings.rounds || (cfg.elim && g.alive.length <= 1)) return done(g);
      next(g);
    } };
    return null;
  };
  E.botAction = (g, seat) => {
    const smart = Math.random() < 0.6;
    if (mode === 'mc') return { type: 'pick', v: smart ? g.Q.a : Math.floor(Math.random() * g.Q.opts.length) };
    if (mode === 'type') return { type: 'answer', vals: [smart ? [].concat(g.Q.a)[0] : 'no idea'] };
    if (mode === 'closest') return { type: 'answer', vals: [String(Math.round(g.Q.a * (0.7 + Math.random() * 0.6)))] };
    const cur = g.sel[seat] || [];
    const want = smart ? g.Q.a : shuffle(g.Q.opts.map((_, i) => i));
    return { type: 'pick', v: want.find(i => !cur.includes(i)) };
  };
  E.viewFor = (g, seat) => {
    const Q = g.Q, me = players(g).includes(seat);
    const v = { phase: g.phase, moveId: g.moveId, left: g.phase === 'ask' && !g.flashing ? left(g) : 0, hud: [['Score', g.score[seat] ?? 0], [cfg.elim ? 'Still in' : 'Question', cfg.elim ? g.alive.length : `${g.round}/${g.settings.rounds}`]] };
    const card = { kicker: cfg.kicker ? cfg.kicker(Q) : `Question ${g.round}`, small: Q.q, big: cfg.phoneBig === false ? '' : Q.big || '', cls: 'tw-q' };
    if (g.phase === 'ask') {
      if (!me) v.ui = { k: 'wait', title: 'You’re out', sub: 'Watch the table — cheer them on!', card };
      else if (g.flashing) v.ui = { k: 'wait', title: '👀 Look at the table!', sub: 'Quick — it disappears soon', key: 'f' + g.round };
      else if (g.locked[seat]) v.ui = { k: 'wait', title: 'Locked out ✗', sub: 'Wrong buzz — wait for the next one', card };
      else if (g.done[seat]) v.ui = { k: 'wait', title: 'Locked in ✓', sub: `Waiting for ${E.pending(g).length} more…`, card };
      else if (mode === 'mc') v.ui = { k: 'pick', key: 'q' + g.round, title: cfg.prompt || 'Your answer', sub: cfg.firstOnly ? 'First right answer wins it — wrong costs points' : 'Faster answers score more', myturn: true, buzz: true, card, grid: Q.opts.length <= 2 ? 2 : Q.opts.every(o => String(o).length < 12) ? 2 : 0, big: Q.opts.length <= 2, options: Q.opts.map((o, i) => ({ v: i, label: String(o), cls: 'tw-c' + (i % 4) })) };
      else if (mode === 'type') v.ui = { k: 'fields', key: 'q' + g.round, title: cfg.prompt || 'Type your answer', sub: 'Small typos are fine', myturn: true, buzz: true, card, fields: [{ ph: cfg.ph || 'Answer…', max: 60 }], submit: 'Answer', need: 1 };
      else if (mode === 'closest') v.ui = { k: 'fields', key: 'q' + g.round, title: cfg.prompt || 'Your guess', sub: 'Closest wins', myturn: true, buzz: true, card, fields: [{ type: 'number', ph: cfg.ph || '0', max: 12 }], submit: 'Lock it in', need: 1, needMsg: 'Type a number' };
      else {
        const cur = g.sel[seat] || [];
        v.ui = { k: 'pick', key: 'q' + g.round + ':' + cur.length, title: cfg.prompt || `Tap them in order (${cur.length + 1} of ${Q.opts.length})`, sub: cfg.orderHint ? cfg.orderHint(Q) : 'First to last', myturn: true, card,
          options: Q.opts.map((o, i) => ({ v: i, label: String(o), dis: cur.includes(i), sub: cur.includes(i) ? `#${cur.indexOf(i) + 1}` : '' })), buttons: cur.length ? [{ type: 'undo', label: '↶ Undo' }] : null };
      }
    } else if (g.phase === 'reveal') {
      const ans = mode === 'mc' ? Q.opts[Q.a] : mode === 'order' ? Q.a.map(i => Q.opts[i]).join(' → ') : [].concat(Q.a)[0];
      const d = g.gain[seat];
      v.ui = { k: 'wait', title: d > 0 ? `✓ +${d}` : d < 0 ? `✗ ${d}` : g.ans[seat] ? '✗ Not this time' : 'No answer', sub: `Answer: ${typeof ans === 'number' ? ans.toLocaleString() : ans}${Q.note ? ` — ${Q.note}` : ''}`, card: { ...card, big: Q.big || '' } };
      if (cfg.elim && g.knocked?.includes(seat)) v.ui.title = '💥 You’re out!';
    } else v.ui = { k: 'wait', title: (g.winners || []).includes(seat) ? '🏆 You win!' : 'Game over', sub: 'Look at the table to play again' };
    return v;
  };
  E.answerText = g => { const Q = g.Q; return mode === 'mc' ? Q.opts[Q.a] : mode === 'order' ? Q.a.map(i => Q.opts[i]).join(' → ') : typeof Q.a === 'number' ? Q.a.toLocaleString() : [].concat(Q.a)[0]; };
  E.cfg = cfg;
  return E;
}
