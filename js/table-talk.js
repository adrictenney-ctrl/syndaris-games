// Table screens for the talk-and-laugh party games (talk-games.js).
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=91';
import * as S from './talk-games.js?v=91';
import { fitCanvas, paint } from './sketch-pad.js?v=91';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${String(v) === String(s[k]) ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const nm = (ctx, s) => esc(ctx.nameOf(s));
const named = (ctx, t) => esc(t).replace(/@(\d+)@/g, (_, s) => esc(ctx.nameOf(Number(s))));
const rounds = list => s => `<label>Rounds ${opt('rounds', s, list.map(n => [n, String(n)]))}</label>`;
const laps = s => `<label>Turns ${opt('laps', s, [[1, 'Once each'], [2, 'Twice each']])}</label>`;
const hotBadge = E => (g, s) => (E.hot && g.order.includes(s) && E.hot(g) === s && g.phase !== 'over' ? ['<span class="badge alone">🔥 hot seat</span>'] : []);
const quote = t => `<blockquote class="tk-quote">${t}</blockquote>`;

// ---------------------------------------------------------------- the shared write → (read) → vote screen
function wvTable(E, id, o) {
  return partyTable(E, {
    id, defaults: o.defaults, settingsHTML: o.settings || (() => ''),
    badges: o.judge ? hotBadge(E) : undefined,
    center(g, ctx) {
      if (g.phase === 'over') return sc(g, ctx);
      const head = `<p class="pt-kicker">${o.judge ? `Turn ${g.round} of ${g.total} · ` : `Round ${g.round} of ${g.total} · `}${o.kicker(g, ctx)}</p>${o.head(g, ctx)}`;
      if (g.phase === 'write') return `${head}<p class="pt-sub">${o.writeCue(g, ctx)}</p>${clock()}${doneRow(g, ctx, E.writers(g))}`;
      if (g.phase === 'read') { const r = E.reader(g); return `${head}<p class="pt-kicker">${g.ri + 1} of ${g.list.length}</p>${quote(esc(g.ans[r]))}<p class="pt-big">${who(ctx, r)} ${o.readCue || 'reads it out loud!'}</p>${clock()}`; }
      const reveal = g.phase === 'reveal';
      const tag = s => (reveal ? `<small>${nm(ctx, s)}${o.judge ? (g.votes[E.hot(g)] === s ? ' · ⭐ picked!' : '') : ` · ${g.gain[s] || 0} vote${g.gain[s] === 1 ? '' : 's'}`}</small>` : '');
      const body = E.isDraw(g)
        ? `<div class="so-gallery">${g.list.map(s => `<figure class="${reveal && (o.judge ? g.votes[E.hot(g)] === s : g.gain[s] && g.gain[s] === Math.max(...g.list.map(x => g.gain[x] || 0))) ? 'win' : ''}"><div class="db-easel"><canvas data-s="${s}"></canvas></div><figcaption>${named(ctx, E.label(g, s))}${tag(s)}</figcaption></figure>`).join('')}</div>`
        : `<ol class="wb-opts ${reveal ? 'reveal' : ''}">${g.list.map(s => `<li><span>${esc(g.ans[s])}</span>${tag(s)}</li>`).join('')}</ol>`;
      const cue = g.phase === 'vote' ? `<p class="pt-sub">${o.judge ? `${nm(ctx, E.hot(g))} picks a favourite on their phone` : 'Vote on your phones'}</p>${clock()}${doneRow(g, ctx, o.judge ? [E.hot(g)] : g.order)}` : sc(g, ctx);
      return `${head}${body}${cue}`;
    },
    after(root, g) { if (!E.isDraw(g)) return; root.querySelectorAll('canvas[data-s]').forEach(cv => { fitCanvas(cv, Math.round(Math.min(window.innerWidth, window.innerHeight) * (g.list.length > 6 ? .17 : .22))); paint(cv, g.ans[cv.dataset.s] || []); }); },
  });
}

export const fakepitchT = wvTable(S.fakepitch, 'fakepitch', {
  defaults: { rounds: 3, secs: 90 }, settings: rounds([2, 3, 4]),
  kicker: () => 'Fake Movie Pitch', head: g => (g.phase === 'write' ? '<h2 class="pt-h">🎬 Everyone has a secret movie to pitch</h2>' : ''),
  writeCue: () => 'Check your phone for your title, genre and star — write a one-line pitch', readCue: 'pitches their movie — trailer voice, please!',
});
export const translatethisT = wvTable(S.translatethis, 'translatethis', {
  defaults: { rounds: 4, secs: 75 }, settings: rounds([3, 4, 6]),
  kicker: g => `Say it like ${esc(g.style.name)}`, head: g => quote(esc(g.sentence)),
  writeCue: g => `Rewrite it like ${esc(g.style.name)} — ${esc(g.style.tip)}`,
});
export const excusesT = wvTable(S.excuses, 'excuses', {
  defaults: { rounds: 5, secs: 60 }, settings: rounds([3, 5, 8]),
  kicker: () => 'Explain yourself', head: g => `<h2 class="pt-h">${esc(g.situation)}</h2>`,
  writeCue: () => 'Write your most believable excuse on your phone',
});
export const twowordsT = wvTable(S.twowords, 'twowords', {
  defaults: { rounds: 3, secs: 75 }, settings: rounds([2, 3, 4]),
  kicker: () => 'Two Words', head: (g, ctx) => (g.phase === 'write' ? '<h2 class="pt-h">Everyone got two random words — invent something with both</h2>' : `<div class="tk-words">${g.list.map(s => `<span>${esc(g.mine[s].words.join(' + '))}<small>${esc(g.mine[s].kind.name)}</small></span>`).join('')}</div>`),
  writeCue: () => 'A product, band, superhero, restaurant… name it and pitch it in one sentence',
});
export const plottwistT = wvTable(S.plottwist, 'plottwist', {
  defaults: { rounds: 3, secs: 90 }, settings: rounds([2, 3, 4]),
  kicker: () => 'The story so far…', head: g => quote(esc(g.story)),
  writeCue: () => 'Write the twist ending on your phone', readCue: 'reads their twist — dramatically!',
});
export const drawpartnerT = wvTable(S.drawpartner, 'drawpartner', {
  defaults: { rounds: 2, secs: 90 }, settings: rounds([1, 2, 3]),
  kicker: () => 'Draw Your Partner', head: g => (g.phase === 'write' ? '<h2 class="pt-h">🎨 Everyone is secretly drawing someone in this room</h2>' : ''),
  writeCue: () => 'Check your phone to see who you’re drawing — no peeking!',
});
export const worstgiftT = wvTable(S.worstgift, 'worstgift', {
  defaults: { laps: 1, secs: 75, mode: 0 }, judge: true,
  settings: s => `${laps(s)}<label>Gifts ${opt('mode', s, [[0, 'Write them'], [1, 'Draw them']])}</label>`,
  kicker: g => esc(g.occasion), head: (g, ctx) => `<h2 class="pt-h">🎁 The worst gift for ${who(ctx, g.hotSeat)}</h2>`,
  writeCue: (g, ctx) => `Everyone except ${nm(ctx, g.hotSeat)}: ${g.settings.mode === 1 ? 'draw' : 'describe'} the worst possible gift`,
});

// ---------------------------------------------------------------- Hot Takes
export const hottakesT = partyTable(S.hottakes, {
  id: 'hottakes', defaults: { laps: 1, secs: 30 }, settingsHTML: s => `${laps(s)}<label>Defence time ${opt('secs', s, [[20, '20 seconds'], [30, '30 seconds'], [45, '45 seconds']])}</label>`,
  badges: hotBadge(S.hottakes),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const H = S.hottakes.hot(g), take = `<div class="tk-take"><small>🔥 Hot take</small><b>${esc(g.take)}</b></div>`;
    if (g.phase === 'ready') return `<p class="pt-kicker">Turn ${g.round} of ${g.total}</p>${take}<p class="pt-big">${who(ctx, H)} has to defend this!</p>${clock()}`;
    if (g.phase === 'defend') return `${take}<p class="pt-big">${who(ctx, H)} — convince us!</p>${clock()}`;
    if (g.phase === 'vote') return `${take}<p class="pt-big">Were you convinced? Vote on your phones</p>${clock()}${doneRow(g, ctx, S.hottakes.voters(g))}`;
    const n = S.hottakes.voters(g).length;
    return `${take}<div class="tk-meter"><i style="width:${n ? Math.round(g.yes / n * 100) : 0}%"></i></div><p class="pt-big">${g.yes} of ${n} convinced · ${who(ctx, H)} +${g.gain[H]}</p>${sc(g, ctx)}`;
  },
});

// ---------------------------------------------------------------- Who Said That?
export const whosaidthatT = partyTable(S.whosaidthat, {
  id: 'whosaidthat', defaults: { rounds: 2, secs: 60 }, settingsHTML: rounds([1, 2, 3]),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const q = `<p class="pt-kicker">Question ${g.round} of ${g.total}</p><h2 class="pt-h">${esc(g.q)}</h2>`;
    if (g.phase === 'write') return `${q}<p class="pt-sub">Answer in secret on your phone</p>${clock()}${doneRow(g, ctx)}`;
    const A = S.whosaidthat.author(g), ans = quote(`“${esc(g.ans[A])}”`), step = `<p class="pt-kicker">Answer ${g.qi + 1} of ${g.list.length}</p>`;
    if (g.phase === 'guess') return `${q}${step}${ans}<p class="pt-big">Who said that? Guess on your phone</p>${clock()}${doneRow(g, ctx, g.order.filter(s => s !== A))}`;
    const right = g.order.filter(s => s !== A && g.guess[s] === A);
    return `${q}${step}${ans}<p class="pt-big">It was ${who(ctx, A)}!</p><p class="pt-sub">${right.length ? `Got it: ${right.map(s => nm(ctx, s)).join(', ')}` : 'Nobody guessed it!'}</p>${sc(g, ctx)}`;
  },
});

// ---------------------------------------------------------------- Interrogation
export const interrogationT = partyTable(S.interrogation, {
  id: 'interrogation', defaults: { laps: 1, mins: 2 }, settingsHTML: s => `${laps(s)}<label>Questioning ${opt('mins', s, [[1, '1 minute'], [2, '2 minutes'], [3, '3 minutes']])}</label>`,
  badges: (g, s) => (g.phase !== 'over' && S.interrogation.hot(g) === s ? ['<span class="badge alone">🕵️ suspect</span>'] : []),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const H = S.interrogation.hot(g), c = g.case;
    const file = `<div class="tk-file"><small>Case file · suspect ${nm(ctx, H)}</small><b>${esc(c.crime)}</b><p>Their alibi: <strong>${esc(c.place)}</strong></p></div>`;
    if (g.phase === 'brief') return `<p class="pt-kicker">Suspect ${g.round} of ${g.total}</p>${file}<p class="pt-big">${who(ctx, H)} is reading their secret…</p>${clock()}`;
    if (g.phase === 'grill') return `${file}<p class="pt-big">Grill ${who(ctx, H)}! Ask anything about their alibi</p>${clock()}`;
    if (g.phase === 'vote') return `${file}<p class="pt-big">Lying or telling the truth? Vote on your phones</p>${clock()}${doneRow(g, ctx, S.interrogation.jury(g))}`;
    const right = S.interrogation.jury(g).filter(s => g.votes[s] === g.lying);
    return `${file}<p class="pt-big tk-verdict ${g.lying ? 'lie' : 'true'}">${g.lying ? '🤥 LYING!' : '✅ TRUTH!'}</p>${g.lying ? '' : `<p class="pt-sub">${c.facts.map(esc).join(' · ')}</p>`}<p class="pt-sub">${right.length ? `Saw through it: ${right.map(s => nm(ctx, s)).join(', ')}` : 'Fooled everyone!'}</p>${sc(g, ctx)}`;
  },
});

// ---------------------------------------------------------------- Lip Reader
export const lipreaderT = partyTable(S.lipreader, {
  id: 'lipreader', defaults: { laps: 2, secs: 45 }, settingsHTML: s => `${laps(s)}<label>Time ${opt('secs', s, [[30, '30 seconds'], [45, '45 seconds'], [60, '1 minute']])}</label>`,
  badges: hotBadge(S.lipreader),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const H = S.lipreader.hot(g);
    if (g.phase === 'mouth') return `<p class="pt-kicker">Turn ${g.round} of ${g.total}</p><div class="tk-lips">👄</div><p class="pt-big">Watch ${who(ctx, H)}’s lips…</p><p class="pt-sub">Type what they’re saying on your phone</p>${clock()}${doneRow(g, ctx, S.lipreader.guessers(g))}`;
    const guesses = `<ol class="wb-opts reveal tk-guesses">${S.lipreader.guessers(g).filter(s => g.ans[s]).map(s => `<li class="${g.right[s] ? 'ok' : ''}"><span>${g.right[s] ? '✓' : '✗'} “${esc(g.ans[s])}”</span><small>${nm(ctx, s)}</small></li>`).join('')}</ol>`;
    return `${quote(esc(g.phrase))}<p class="pt-big">${who(ctx, H)} was saying that!</p>${guesses}${sc(g, ctx)}`;
  },
});

// ---------------------------------------------------------------- Guilty Conscience
export const guiltyT = partyTable(S.guilty, {
  id: 'guilty', defaults: { rounds: 6 }, settingsHTML: rounds([4, 6, 10]),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const q = `<p class="pt-kicker">Confession ${g.round} of ${g.total}</p><h2 class="pt-h">Have you ever… ${esc(g.q)}</h2>`;
    if (g.phase === 'answer') return `${q}<p class="pt-sub">Answer yes or no in secret — it stays anonymous</p>${clock()}${doneRow(g, ctx)}`;
    const meter = `<div class="tk-count"><b>${g.count}</b><span>of ${g.order.length} said yes</span></div>`;
    if (g.phase === 'guess') return `${q}${meter}<p class="pt-big">Who? Pick them on your phone</p>${clock()}${doneRow(g, ctx)}`;
    return `${q}${meter}<p class="pt-sub">${g.count === 0 ? 'Nobody! 😇' : g.count === g.order.length ? 'Everyone! 😂' : 'Answers stay secret — points for good guesses'}</p>${sc(g, ctx)}`;
  },
});

// ---------------------------------------------------------------- Emoji Story
export const emojistoryT = partyTable(S.emojistory, {
  id: 'emojistory', defaults: { laps: 1, secs: 60 }, settingsHTML: laps,
  badges: hotBadge(S.emojistory),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const H = S.emojistory.hot(g), head = `<p class="pt-kicker">Turn ${g.round} of ${g.total} · storyteller ${nm(ctx, H)}</p>`;
    if (g.phase === 'tell') return `${head}<p class="pt-big">${who(ctx, H)} is telling a story in emoji…</p>${clock()}`;
    const story = `<div class="tk-emoji">${esc(g.story)}</div>`;
    if (g.phase === 'guess') return `${head}${story}<p class="pt-big">What’s the story? Write your guess</p>${clock()}${doneRow(g, ctx, S.emojistory.guessers(g))}`;
    const reveal = g.phase === 'reveal';
    const list = `<ol class="wb-opts ${reveal ? 'reveal' : ''}">${g.list.map(s => `<li class="${reveal && g.closest === s ? 'ok' : ''}"><span>${esc(g.ans[s])}</span>${reveal ? `<small>${nm(ctx, s)}${g.closest === s ? ' · ⭐ closest' : ''} · +${g.gain[s] || 0}</small>` : ''}</li>`).join('')}</ol>`;
    if (g.phase === 'vote') return `${head}${story}${list}<p class="pt-sub">${nm(ctx, H)} picks the closest · everyone else votes funniest</p>${clock()}${doneRow(g, ctx, S.emojistory.voters(g))}`;
    return `${head}${story}${quote(`“${esc(g.secret)}”`)}${list}${sc(g, ctx)}`;
  },
});
