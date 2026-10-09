// Table screens for the secret-choice games (choice-games.js). While everyone chooses: what's at
// stake, the clock and who's locked in. Then the big reveal.
import { partyTable, esc, clock, doneRow, sc, who } from './table-party.js?v=68';
import * as C from './choice-games.js?v=68';

const opt = (k, s, list) => `<select data-set="${k}">${list.map(([v, t]) => `<option value="${v}" ${v === s[k] ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const dot = s => `<i class="ch-dot" style="background:var(--seat-${s})"></i>`;
const nm = (ctx, s) => esc(ctx.nameOf(s));
const rounds = list => s => `<label>Rounds ${opt('rounds', s, list.map(n => [n, String(n)]))}</label>`;
const wait = (g, ctx, P = g.order) => `${clock()}${doneRow(g, ctx, P)}`;
const head = (g, txt) => `<p class="pt-kicker">${txt || `Round ${g.round} of ${g.settings.rounds}`}</p>`;
function make(id, o) {
  return partyTable(C[id], { id, defaults: { rounds: C[id].o.rounds || 8, secs: C[id].o.secs || 30 }, settingsHTML: o.settings || rounds([5, 8, 10]), ...o, center: (g, ctx) => (g.phase === 'over' ? (o.over ? o.over(g, ctx) : sc(g, ctx)) : o.center(g, ctx)) });
}

export const lowestuniqueT = make('lowestunique', {
  center(g, ctx) {
    if (g.phase === 'choose') return `${head(g)}<h2 class="pt-h">Pick a number from 1 to ${g.max}</h2><p class="pt-sub">The lowest number that only ONE person picks wins</p>${wait(g, ctx)}${sc(g, ctx)}`;
    const grid = Array.from({ length: g.max }, (_, i) => i + 1).map(n => { const who2 = g.order.filter(s => g.pick[s] === n); return `<span class="${who2.length === 1 ? 'uniq' : who2.length ? 'dup' : ''} ${g.win >= 0 && g.pick[g.win] === n ? 'win' : ''}"><b>${n}</b>${who2.map(dot).join('')}</span>`; }).join('');
    return `${head(g)}<div class="ch-grid">${grid}</div><p class="pt-big">${g.win >= 0 ? `${who(ctx, g.win)} wins with ${g.pick[g.win]}!` : 'No unique number this time'}</p>${sc(g, ctx)}`;
  },
});
export const splitstealT = make('splitsteal', {
  center(g, ctx) {
    const pairs = `<div class="ch-pairs">${g.pairs.map(P => `<div class="ch-pair"><span>${dot(P.a)}${nm(ctx, P.a)}${g.phase === 'reveal' ? `<b class="${g.pick[P.a]}">${g.pick[P.a] === 'split' ? '🤝 Split' : '🗡️ Steal'}</b>` : ''}</span><em>${P.pot}</em><span>${g.phase === 'reveal' ? `<b class="${g.pick[P.b]}">${g.pick[P.b] === 'split' ? '🤝 Split' : '🗡️ Steal'}</b>` : ''}${nm(ctx, P.b)}${dot(P.b)}</span></div>`).join('')}</div>`;
    return `${head(g)}${g.phase === 'choose' ? '<p class="pt-big">Talk it over with your partner… then choose in secret</p>' : ''}${pairs}${g.bye >= 0 ? `<p class="pt-sub">${nm(ctx, g.bye)} sits out</p>` : ''}${g.phase === 'choose' ? wait(g, ctx, g.order.filter(s => s !== g.bye)) : ''}${sc(g, ctx)}`;
  },
});
export const twothirdsT = make('twothirds', {
  center(g, ctx) {
    if (g.phase === 'choose') return `${head(g)}<h2 class="pt-h">Pick 0–100. Closest to ⅔ of the average wins.</h2><p class="pt-sub">What will everyone else pick?</p>${wait(g, ctx)}${sc(g, ctx)}`;
    const line = `<div class="ch-line"><i class="avg" style="left:${g.avg}%"><small>avg ${g.avg.toFixed(1)}</small></i><i class="tgt" style="left:${g.target}%"><small>⅔ = ${g.target}</small></i>${g.order.filter(s => g.pick[s] != null).map(s => `<span style="left:${g.pick[s]}%;background:var(--seat-${s})" class="${g.wins.includes(s) ? 'win' : ''}" title="${nm(ctx, s)}">${g.pick[s]}</span>`).join('')}</div>`;
    return `${head(g)}${line}<p class="pt-big">${g.wins.map(s => who(ctx, s)).join(' & ')} closest! +3</p>${sc(g, ctx)}`;
  },
});
export const vulturebidsT = make('vulturebids', {
  settings: () => '<span class="yc-note">Everyone has cards 1–15 · all 15 prizes are played</span>',
  center(g, ctx) {
    const carry = g.carry.reduce((a, b) => a + b, 0);
    const prize = `<div class="ch-prize ${g.prize < 0 ? 'bad' : ''}">${g.prize > 0 ? '+' : ''}${g.prize}${carry ? `<small>+${carry} carried</small>` : ''}</div>`;
    if (g.phase === 'choose') return `${head(g, `${g.deck.length} prizes left`)}${prize}<p class="pt-sub">${g.prize > 0 ? 'Highest card nobody else played takes it' : 'Lowest card nobody else played is stuck with it'}</p>${wait(g, ctx)}${sc(g, ctx)}`;
    const cards = `<div class="ch-cards">${[...g.order].sort((a, b) => g.pick[b] - g.pick[a]).map(s => `<span class="${g.taker === s ? 'win' : g.order.filter(x => g.pick[x] === g.pick[s]).length > 1 ? 'tie' : ''}"><b>${g.pick[s]}</b>${nm(ctx, s)}</span>`).join('')}</div>`;
    return `${head(g, `${g.deck.length} prizes left`)}${prize}${cards}<p class="pt-big">${g.taker >= 0 ? `${who(ctx, g.taker)} takes it` : 'Ties everywhere — it carries over'}</p>${sc(g, ctx)}`;
  },
});
export const treasurerunT = make('treasurerun', {
  settings: s => `<label>Expeditions ${opt('rounds', s, [[3, '3'], [5, '5']])}</label>`,
  center(g, ctx) {
    const path = `<div class="ch-path">${g.path.map((c, i) => `<span class="${c.hazard ? 'hz' : ''} ${i === g.path.length - 1 ? 'new' : ''}">${c.hazard || `💎${c.gems}`}${c.left ? `<small>${c.left} left</small>` : ''}</span>`).join('')}</div>`;
    const crew = `<div class="ch-crew">${g.order.map(s => `<span class="${g.inside.includes(s) ? 'in' : ''}">${dot(s)}${nm(ctx, s)}<small>${g.inside.includes(s) ? `carrying 💎${g.carry[s]}` : 'outside'} · banked ${g.bank[s]}</small></span>`).join('')}</div>`;
    const msg = g.collapsed ? `<p class="pt-big">${g.collapsed} A second ${g.collapsed} — the cave collapses! Everyone inside loses their gems.</p>` : g.phase === 'choose' ? '<p class="pt-big">Go deeper or head home? Decide on your phone</p>' : g.left?.length ? `<p class="pt-big">${g.left.map(s => nm(ctx, s)).join(', ')} head${g.left.length > 1 ? '' : 's'} home</p>` : '<p class="pt-big">Everyone pushes on…</p>';
    return `${head(g, `Expedition ${Math.min(g.cave, g.settings.rounds)} of ${g.settings.rounds}`)}${path}${msg}${g.phase === 'choose' ? wait(g, ctx, g.inside) : ''}${crew}`;
  },
});
export const tickerT = make('ticker', {
  center(g, ctx) {
    const spark = i => { const h = g.hist.map(x => x[i]), mx = Math.max(...h), mn = Math.min(...h); return `<svg viewBox="0 0 100 30" class="ch-spark"><polyline points="${h.map((v, k) => `${(k / Math.max(1, h.length - 1)) * 100},${28 - ((v - mn) / Math.max(1, mx - mn)) * 26}`).join(' ')}"/></svg>`; };
    const rows = `<table class="ch-stocks">${C.STOCKS.map((x, i) => { const d = g.hist.length > 1 ? g.price[i] - g.hist[g.hist.length - 2][i] : 0; return `<tr><td><b>${x.t}</b><small>${x.n}</small></td><td>${spark(i)}</td><td class="p">${g.price[i]}</td><td class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${g.phase === 'reveal' ? (d > 0 ? '▲' : d < 0 ? '▼' : '•') + Math.abs(d) : ''}</td></tr>`; }).join('')}</table>`;
    return `${head(g, `Day ${g.round} of ${g.settings.rounds}`)}${rows}${g.phase === 'choose' ? `<p class="pt-sub">Everyone has a secret tip on their phone… make one trade</p>${wait(g, ctx)}` : ''}${sc(g, ctx)}`;
  },
});
export const galaauctionT = make('galaauction', {
  settings: () => '<span class="yc-note">The player with the least money left at the end can’t win</span>',
  center(g, ctx) {
    const I = C.ITEMS[g.item];
    const item = `<div class="ch-prize ${I.v < 0 ? 'bad' : ''}">${I.n}<small>${I.x ? `×${I.x} your total` : I.v > 0 ? `worth ${I.v}` : 'minus 5!'}</small></div>`;
    const coll = `<div class="ch-crew">${g.order.map(s => `<span>${dot(s)}${nm(ctx, s)}<small>${g.won[s].map(i => C.ITEMS[i].n.split(' ')[0]).join('') || '—'} · ${g.score[s]} · cards ${g.money[s].length}</small></span>`).join('')}</div>`;
    if (g.phase === 'choose') return `${head(g, `${g.deck.length} lots left`)}${item}<p class="pt-sub">Bid with one money card from your phone</p>${wait(g, ctx)}${coll}`;
    const bids = `<div class="ch-cards">${[...g.order].sort((a, b) => g.pick[b] - g.pick[a]).map(s => `<span class="${g.taker === s ? 'win' : ''}"><b>${g.pick[s]}</b>${nm(ctx, s)}</span>`).join('')}</div>`;
    return `${head(g, `${g.deck.length} lots left`)}${item}${bids}<p class="pt-big">${who(ctx, g.taker)} takes the ${I.n}</p>${coll}`;
  },
  over: (g, ctx) => `${g.broke?.length ? `<p class="pt-sub">Too poor to win: ${g.broke.map(s => nm(ctx, s)).join(', ')}</p>` : ''}${sc(g, ctx)}`,
});
export const threefrontsT = make('threefronts', {
  center(g, ctx) {
    if (g.phase === 'choose') return `${head(g)}<h2 class="pt-h">Split 10 troops across ⛰️ North, 🌊 Coast and 🌲 Forest</h2><p class="pt-sub">Beat an opponent on more fronts than they beat you — every player against every player</p>${wait(g, ctx)}${sc(g, ctx)}`;
    const t = `<table class="ch-fronts"><tr><th></th><th>⛰️</th><th>🌊</th><th>🌲</th><th>beat</th></tr>${g.order.map(s => `<tr><td>${dot(s)}${nm(ctx, s)}</td>${g.pick[s].map(n => `<td>${'🪖'.repeat(Math.min(n, 6))}${n > 6 ? '+' : ''}<b>${n}</b></td>`).join('')}<td class="b">${g.gain[s]}</td></tr>`).join('')}</table>`;
    return `${head(g)}${t}${sc(g, ctx)}`;
  },
});
export const lemonadeT = make('lemonade', {
  center(g, ctx) {
    if (g.phase === 'choose') return `${head(g, `Day ${g.round} of ${g.settings.rounds}`)}<div class="ch-prize">${C.WEATHER[g.forecast].n}<small>forecast (usually right)</small></div><p class="pt-sub">How many cups, and at what price? Cheaper stands get more customers</p>${wait(g, ctx)}${sc(g, ctx)}`;
    const stands = `<div class="ch-stands">${g.order.map(s => `<span>${dot(s)}<b>${nm(ctx, s)}</b>🍋 ${g.sold[s]}/${g.pick[s][0]} at $${g.pick[s][1]}<small class="${g.profit[s] >= 0 ? 'up' : 'down'}">${g.profit[s] >= 0 ? '+' : ''}$${g.profit[s]}</small></span>`).join('')}</div>`;
    return `${head(g, `Day ${g.round} of ${g.settings.rounds}`)}<div class="ch-prize">${C.WEATHER[g.wx].n}<small>actual weather</small></div>${stands}${sc(g, ctx)}`;
  },
});
export const fishpondT = make('fishpond', {
  center(g, ctx) {
    const n = g.phase === 'reveal' ? g.before : g.fish;
    const pond = `<div class="ch-pond ${g.collapsed ? 'dead' : ''}">${'🐟'.repeat(Math.min(n, 60))}${n > 60 ? `<small>+${n - 60}</small>` : ''}<b>${n}</b></div>`;
    if (g.phase === 'choose') return `${head(g)}${pond}<p class="pt-sub">Take 0–5 fish each. Too many in total and the pond dies</p>${wait(g, ctx)}${sc(g, ctx)}`;
    return `${head(g)}${pond}<div class="ch-cards">${g.order.map(s => `<span><b>${g.pick[s]}</b>${nm(ctx, s)}</span>`).join('')}</div><p class="pt-big">${g.collapsed ? '💀 The pond is empty — season over!' : `Everyone took ${g.want}. The pond grows back to ${g.fish}.`}</p>${sc(g, ctx)}`;
  },
});
export const mysteryboxesT = make('mysteryboxes', {
  center(g, ctx) {
    const boxes = `<div class="ch-boxes">${g.box.map((v, b) => `<span class="${g.phase === 'reveal' ? 'open' : ''}"><em>${'ABC'[b]}</em>${g.phase === 'reveal' ? `<b>${v}</b><small>${g.winners3[b] >= 0 ? `${nm(ctx, g.winners3[b])} paid ${g.pick[g.winners3[b]][1]}` : 'no bids'}</small>` : '🎁'}</span>`).join('')}</div>`;
    return `${head(g)}${boxes}${g.phase === 'choose' ? `<p class="pt-sub">Everyone has a secret hint… bid on one box</p>${wait(g, ctx)}` : ''}${sc(g, ctx)}`;
  },
});
export const standoffT = make('standoff', {
  center(g, ctx) {
    const loot = `<div class="ch-cards">${g.loot.map(c => `<span class="loot"><b>${c ? `💵${c}` : '🪨'}</b></span>`).join('')}</div>`;
    const P = g.order;
    if (g.phase === 'choose') return `${head(g)}${loot}<p class="pt-big">Aim… and load a real bullet or a bluff</p>${wait(g, ctx, C.standoff.o.who(g))}<div class="ch-crew">${P.map(s => `<span>${dot(s)}${nm(ctx, s)}<small>${'🩸'.repeat(g.wounds[s]) || 'unhurt'}${g.wounds[s] >= 3 ? ' · out' : ''}</small></span>`).join('')}</div>`;
    const aims = `<div class="ch-aims">${C.standoff.o.who(g).filter(s => g.aim[s] != null).map(s => `<span class="${g.pick[s]}">${nm(ctx, s)} → ${nm(ctx, g.aim[s])} ${g.pick[s] === 'bang' ? '💥' : '🔫 click'}</span>`).join('')}</div>`;
    return `${head(g)}${aims}<div class="ch-crew">${P.map(s => `<span class="${g.hit.includes(s) ? 'hit' : ''}">${dot(s)}${nm(ctx, s)}<small>${g.hit.includes(s) ? 'HIT · ' : `+${g.got[s]} · `}${'🩸'.repeat(g.wounds[s]) || 'unhurt'}</small></span>`).join('')}</div>${sc(g, ctx)}`;
  },
});
