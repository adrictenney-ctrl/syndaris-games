// Table screens for the social games (social-games.js).
import { partyTable, esc, clock, doneRow, sc, who, teamScores, TEAMS } from './table-party.js?v=68';
import * as S from './social-games.js?v=68';
import { art as dreamArt } from './dreamcards.js?v=68';
import { fitCanvas, paint } from './sketch-pad.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const nm = (ctx, s) => esc(ctx.nameOf(s));
const named = (ctx, t) => esc(t).replace(/@(\d+)@/g, (_, s) => esc(ctx.nameOf(Number(s))));

export const storychainT = partyTable(S.storychain, {
  id: 'storychain', defaults: { secs: 90, len: 0 },
  settingsHTML: s => `<label>Lines each story ${opt('len', s, [[0, 'One per player'], [3, '3'], [5, '5'], [8, '8']])}</label><label>Time per line ${opt('secs', s, [[60, '1 minute'], [90, '1½ minutes'], [120, '2 minutes']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'write') return `<p class="pt-kicker">Line ${g.step + 2} of ${g.len + 1}</p><h2 class="pt-h">Everyone is writing the next line of a story…</h2><p class="pt-sub">You only see the line before yours</p>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'read') { const st = g.stories[g.si]; return `<p class="pt-kicker">Story ${g.si + 1} of ${g.stories.length}</p><div class="so-story">${st.lines.slice(0, g.li + 1).map((l, i) => `<p class="${i === g.li ? 'new' : ''}">${esc(l.t)}${l.by >= 0 ? `<small>— ${nm(ctx, l.by)}</small>` : ''}</p>`).join('')}</div>`; }
    if (g.phase === 'vote') return `<h2 class="pt-h">Vote for the best story on your phone</h2><ol class="so-titles">${g.stories.map(st => `<li>${esc(st.lines[0].t)}</li>`).join('')}</ol>${clock()}${doneRow(g, ctx)}`;
    return `<ol class="so-titles">${g.stories.map((st, i) => `<li>${esc(st.lines[0].t)} <b>${g.tally?.[i] || 0} 🗳️</b></li>`).join('')}</ol>${sc(g, ctx)}`;
  },
});
const hotTable = (E, id, title, extra) => partyTable(E, {
  id, defaults: { laps: id === 'rateit' ? 2 : 1 }, settingsHTML: s => `<label>Hot seats ${opt('laps', s, [[1, 'Once each'], [2, 'Twice each']])}</label>`,
  badges: (g, s) => (E.hot(g) === s && g.phase !== 'over' ? ['<span class="badge alone">🔥 hot seat</span>'] : []),
  center(g, ctx) { if (g.phase === 'over') return sc(g, ctx); return `<p class="pt-kicker">In the hot seat: ${nm(ctx, E.hot(g))}</p>${title(g)}${extra(g, ctx)}${g.phase === 'reveal' ? sc(g, ctx) : clock() + doneRow(g, ctx)}`; },
});
export const rateitT = hotTable(S.rateit, 'rateit', g => `<h2 class="pt-h">${esc(g.item)}</h2>`, (g, ctx) => {
  if (g.phase !== 'reveal') return '<p class="pt-sub">Hot seat: rate it 1–10 · everyone else: guess their rating</p>';
  const H = S.rateit.hot(g);
  return `<div class="so-scale">${Array.from({ length: 10 }, (_, i) => i + 1).map(n => `<span class="${g.ans[H] === n ? 'hot' : ''}"><b>${n}</b>${g.order.filter(s => s !== H && g.ans[s] === n).map(s => `<i style="background:var(--seat-${s})" title="${nm(ctx, s)}"></i>`).join('')}</span>`).join('')}</div>`;
});
export const topfiveT = hotTable(S.topfive, 'topfive', g => `<h2 class="pt-h">Rank: ${esc(g.topic)}</h2>`, (g, ctx) => {
  if (g.phase !== 'reveal') return `<div class="so-items">${g.items.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
  const H = S.topfive.hot(g);
  return g.ans[H] ? `<ol class="so-rank">${g.ans[H].map(i => `<li>${esc(g.items[i])}<span>${g.order.filter(s => s !== H && g.ans[s] && g.ans[s][g.ans[H].indexOf(i)] === i).map(s => `<i style="background:var(--seat-${s})"></i>`).join('')}</span></li>`).join('')}</ol>` : '<p class="pt-sub">No ranking given</p>';
});
export const mindmeldT = partyTable(S.mindmeld, {
  id: 'mindmeld', defaults: { rounds: 3, tries: 6 }, settingsHTML: s => `<label>Rounds ${opt('rounds', s, [[2, '2'], [3, '3'], [4, '4']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const pairs = `<div class="so-pairs">${g.pairs.map(P => `<div class="${P.done ? 'won' : ''}"><p>${nm(ctx, P.a)} 🧠 ${nm(ctx, P.b)}</p>${P.hist.map(([a, b]) => `<span><b>${esc(a)}</b><em>·</em><b>${esc(b)}</b></span>`).join('')}${P.done ? `<strong>Mind meld! +${P.pts}</strong>` : ''}</div>`).join('')}</div>`;
    return `<p class="pt-kicker">Round ${g.round} · try ${g.attempt} of ${g.settings.tries}</p>${g.phase === 'think' ? '<p class="pt-big">Each pair: find the word that links your last two</p>' + clock() : ''}${pairs}${sc(g, ctx)}`;
  },
});
export const captionitT = partyTable(S.captionit, {
  id: 'captionit', defaults: { rounds: 5, secs: 60 }, settingsHTML: s => `<label>Pictures ${opt('rounds', s, [[3, '3'], [5, '5'], [8, '8']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const pic = `<div class="so-pic">${dreamArt(g.pic)}</div>`;
    if (g.phase === 'write') return `<p class="pt-kicker">Picture ${g.round} of ${g.settings.rounds}</p>${pic}<p class="pt-sub">Write a caption on your phone</p>${clock()}${doneRow(g, ctx)}`;
    const caps = `<ol class="wb-opts ${g.phase === 'reveal' ? 'reveal' : ''}">${g.list.map(s => `<li><span>${esc(g.cap[s])}</span>${g.phase === 'reveal' ? `<small>${nm(ctx, s)} · ${g.gain[s]} vote${g.gain[s] === 1 ? '' : 's'}</small>` : ''}</li>`).join('')}</ol>`;
    return `<div class="db-row">${pic}${caps}</div>${g.phase === 'vote' ? clock() + doneRow(g, ctx) : sc(g, ctx)}`;
  },
});
export const fakeartistT = partyTable(S.fakeartist, {
  id: 'fakeartist', defaults: { laps: 2, rounds: 0 }, settingsHTML: s => `<label>Lines each ${opt('laps', s, [[1, '1'], [2, '2'], [3, '3']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const head = `<p class="pt-kicker">Round ${g.round} of ${g.rounds} · category: ${esc(g.cat)}</p>`;
    const easel = '<div class="db-easel"><canvas></canvas></div>';
    if (g.phase === 'peek') return `${head}<p class="pt-big">Check your phones 🤫 — one of you is the fake artist</p>`;
    if (g.phase === 'draw') return `${head}${easel}<p class="pt-big">${who(ctx, S.fakeartist.artist(g))} adds one line</p>${clock()}`;
    if (g.phase === 'vote') return `${head}${easel}<p class="pt-big">Who’s faking? Vote on your phone</p>${clock()}${doneRow(g, ctx)}`;
    if (g.phase === 'guess') return `${head}${easel}<p class="pt-big">${who(ctx, g.fake)} was caught! Can they guess the word?</p>${clock()}`;
    return `${head}${easel}<p class="pt-big">${g.how === 'escaped' ? `${who(ctx, g.fake)} got away with it!` : g.how === 'guessed' ? `${who(ctx, g.fake)} guessed “${esc(g.word)}”!` : `Caught ${who(ctx, g.fake)}!`} The word was ${esc(g.word)}.</p>${sc(g, ctx)}`;
  },
  after(root, g) { const cv = root.querySelector('.db-easel canvas'); if (!cv) return; fitCanvas(cv, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.46)); paint(cv, g.strokes); },
});
export const copycatT = partyTable(S.copycat, {
  id: 'copycat', defaults: { rounds: 4, secs: 60 }, settingsHTML: s => `<label>Rounds ${opt('rounds', s, [[3, '3'], [4, '4'], [6, '6']])}</label><label>Drawing time ${opt('secs', s, [[45, '45 seconds'], [60, '1 minute'], [90, '1½ minutes']])}</label>`,
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    if (g.phase === 'look') return `<p class="pt-kicker">Round ${g.round} · memorise this!</p><div class="so-copy">${g.pic}</div>`;
    if (g.phase === 'draw') return `<p class="pt-kicker">Round ${g.round}</p><div class="so-copy gone">❓</div><p class="pt-big">Draw it from memory on your phone</p>${clock()}${doneRow(g, ctx)}`;
    const grid = `<div class="so-gallery">${Object.keys(g.pics).map(Number).map(s => `<figure><div class="db-easel"><canvas data-s="${s}"></canvas></div><figcaption>${g.phase === 'reveal' ? `${nm(ctx, s)} · ${g.gain[s]} 🗳️` : `Drawing ${g.order.indexOf(s) + 1}`}</figcaption></figure>`).join('')}</div>`;
    return `${g.phase === 'reveal' ? `<div class="so-copy small">${g.pic}</div>` : ''}${grid}${g.phase === 'vote' ? clock() + doneRow(g, ctx) : sc(g, ctx)}`;
  },
  after(root, g) { root.querySelectorAll('canvas[data-s]').forEach(cv => { fitCanvas(cv, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.2)); paint(cv, g.pics[cv.dataset.s] || []); }); },
});
export const codecrackT = partyTable(S.codecrack, {
  id: 'codecrack', defaults: { rounds: 8 }, settingsHTML: () => '<span class="yc-note">Two teams, alternating seats · 2 intercepts wins, 2 mix-ups loses</span>',
  badges: (g, s) => (g.phase === 'clue' && S.codecrack.encoder(g, g.team[s]) === s ? ['<span class="badge alone">✏️ encoder</span>'] : []),
  center(g, ctx) {
    const tok = t => `<span class="cc-tok">🎯 ${g.tokens.int[t]} · ❌ ${g.tokens.mis[t]}</span>`;
    const boards = `<div class="cc-boards">${[0, 1].map(t => `<div class="cc-board t${t}"><p class="pt-team t${t}">${TEAMS[t]} ${tok(t)}</p><table>${[0, 1, 2, 3].map(k => `<tr><th>${k + 1}</th><td>${g.clueLog[t][k].map(esc).join(' · ') || '<em>—</em>'}</td></tr>`).join('')}</table></div>`).join('')}</div>`;
    if (g.phase === 'over') return `${boards}<p class="pt-big">${g.winner == null ? 'A draw!' : `${TEAMS[g.winner]} wins!`}</p><p class="pt-sub">Keywords: ${TEAMS[0]} — ${g.keys[0].join(', ')} · ${TEAMS[1]} — ${g.keys[1].join(', ')}</p>`;
    let mid = '';
    if (g.phase === 'clue') mid = `<p class="pt-big">Encoders are writing clues for their secret codes</p>${clock()}`;
    else if (g.phase === 'guess') mid = `<p class="pt-kicker">${TEAMS[g.at]}’s clues</p><div class="cc-clues">${g.clues[g.at].map(c => `<span>${esc(c)}</span>`).join('')}</div><p class="pt-sub">${TEAMS[g.at]}: decode it · ${g.round > 1 ? `${TEAMS[1 - g.at]}: intercept it!` : 'no intercepts in round 1'}</p>${clock()}`;
    else if (g.phase === 'result') mid = `<div class="cc-clues">${g.clues[g.at].map((c, i) => `<span>${esc(c)}<b>${g.code[g.at][i]}</b></span>`).join('')}</div><p class="pt-big">${g.res.own ? '✓ Decoded' : '✗ Mix-up!'}${g.res.inter ? ' · 🎯 INTERCEPTED!' : ''}</p>`;
    return `<p class="pt-kicker">Round ${g.round} of ${g.settings.rounds}</p>${mid}${boards}`;
  },
});
export const undercoverT = partyTable(S.undercover, {
  id: 'undercover', defaults: { mins: 6, rounds: 0 }, settingsHTML: s => `<label>Questioning time ${opt('mins', s, [[4, '4 minutes'], [6, '6 minutes'], [8, '8 minutes']])}</label>`,
  badges: (g, s) => (g.phase === 'ask' && g.asker === s ? ['<span class="badge alone">❓ asking</span>'] : g.phase === 'ask' && g.ready[s] ? ['<span class="badge got">ready</span>'] : []),
  center(g, ctx) {
    if (g.phase === 'over') return sc(g, ctx);
    const locs = `<div class="uc-locs">${S.LOCATIONS.map((l, i) => `<span class="${(g.phase === 'result' && i === g.loc) ? 'real' : g.phase === 'result' && i === g.spyGuess ? 'guess' : ''}">${esc(l[0])}</span>`).join('')}</div>`;
    if (g.phase === 'ask') return `<p class="pt-kicker">Round ${g.round} of ${g.rounds} · ${g.order.filter(s => g.ready[s]).length} ready to vote</p><p class="pt-big">${who(ctx, g.asker)}, ask someone a question!</p>${clock()}${locs}`;
    if (g.phase === 'vote') return `<p class="pt-big">Vote: who is the spy?</p>${clock()}${doneRow(g, ctx)}${locs}`;
    const txt = { caught: `Caught the spy, ${who(ctx, g.spy)}!`, spywin: `The spy ${who(ctx, g.spy)} got away!`, spyguess: `The spy ${who(ctx, g.spy)} guessed the location!`, spywrong: `The spy ${who(ctx, g.spy)} guessed wrong!` }[g.how];
    return `<p class="pt-big">${txt}</p><p class="pt-sub">It was the ${esc(S.LOCATIONS[g.loc][0])}</p>${locs}${sc(g, ctx)}`;
  },
});
export const mafianightT = partyTable(S.mafianight, {
  id: 'mafianight', defaults: { talk: 3 }, settingsHTML: s => `<label>Day discussion ${opt('talk', s, [[2, '2 minutes'], [3, '3 minutes'], [5, '5 minutes']])}</label>`,
  badges: (g, s) => (g.alive.includes(s) ? [] : ['<span class="badge">👻 out</span>']),
  center(g, ctx) {
    const town = `<div class="mf-town">${g.order.map(s => `<span class="${g.alive.includes(s) ? '' : 'dead'}">${g.alive.includes(s) ? '🏠' : '🪦'}<b>${nm(ctx, s)}</b>${!g.alive.includes(s) || g.phase === 'over' ? `<small>${S.mafianight.ROLE[g.role[s]][0]}</small>` : ''}</span>`).join('')}</div>`;
    if (g.phase === 'over') return `<p class="pt-big">${g.winTeam === 'town' ? '🏡 The town wins — every Mafia member is gone!' : '🔪 The Mafia takes over the town!'}</p>${town}`;
    if (g.phase === 'night') return `<div class="mf-sky night">🌙</div><p class="pt-big">Night ${g.day} — everyone close your eyes</p><p class="pt-sub">The Mafia, the Doctor and the Detective act on their phones</p>${clock()}${town}`;
    if (g.phase === 'day') return `<div class="mf-sky">☀️</div><p class="pt-big">${g.dawn.victim >= 0 ? `${who(ctx, g.dawn.victim)} was eliminated in the night.` : g.dawn.saved ? 'The Doctor saved someone last night!' : 'A quiet night — nobody was hurt.'}</p><p class="pt-sub">Discuss, then vote on your phones</p>${clock()}${doneRow(g, ctx, g.alive)}${town}`;
    return `<div class="mf-sky">⚖️</div><p class="pt-big">${g.out >= 0 ? `${who(ctx, g.out)} was voted out — they were ${S.mafianight.ROLE[g.role[g.out]][0]}` : 'The town couldn’t agree — nobody is out'}</p>${town}`;
  },
});
