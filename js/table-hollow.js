// Hollowmere on the table: night and day, who died, nominations and votes, who is about to
// be executed, and the list of every character that could be in the village.
import * as H from './hollow.js?v=63';
import { CHARS, KIND_NAME } from './hollow-chars.js?v=63';

let root = null, key = '', sheetOpen = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const fmt = (text, nameOf) => esc(text).replace(/\{(\d+)\}/g, (_, s) => `<b>${esc(nameOf(Number(s)))}</b>`);

export function sheetHTML() {
  return ['villager', 'outcast', 'henchman', 'shade'].map(kind => `
    <section class="hm-kind ${kind}"><h5>${kind === 'shade' ? 'The Shade' : KIND_NAME[kind] + 's'}</h5>
      ${Object.values(CHARS).filter(c => c.kind === kind).map(c => `<p><span>${c.icon}</span><b>${c.name}</b> ${c.text}</p>`).join('')}
    </section>`).join('');
}

function render(g, ctx) {
  const N = s => `<b>${esc(ctx.nameOf(s))}</b>`;
  const night = ['night', 'witness'].includes(g.phase);
  root.style.setProperty('--v', ctx.vmin + 'px');
  const alive = g.crew.filter(s => g.alive[s]).length;
  let body = '';
  if (night) {
    const left = Object.keys(g.need).filter(s => !(s in g.choices) && g.alive[s]).length;
    body = `<p class="hm-big">Everyone, eyes on your own phone.</p><p class="hm-sub">${g.phase === 'witness' ? 'Someone is waking for one last look…' : `${left} still in the dark`}</p>`;
  } else if (g.phase === 'vote') {
    const v = g.vote;
    const voters = g.crew.filter(s => g.alive[s] || g.ghost[s]).length;
    body = `<p class="hm-big">${N(v.nominator)} nominated ${N(v.nominee)}</p>
      <p class="hm-sub">Vote on your phone · ${v.needed} votes needed to put them on the block${g.top ? ` (and more than ${g.top} to replace who's there)` : ''} · ${Object.keys(v.votes).length} of ${voters} voted</p>
      <div class="hm-buttons"><button class="tool" data-a="closeVote" type="button">Close the vote</button></div>`;
  } else if (g.phase === 'day') {
    const deaths = g.dawn?.deaths || [];
    const lv = g.lastVote;
    body = `${g.day && deaths.length !== undefined ? `<p class="hm-dawn">${deaths.length ? `☠ ${deaths.map(N).join(' and ')} died in the night` : 'Nobody died last night'}</p>` : ''}
      <p class="hm-sub">Talk it over. Nominate someone from your phone. ${alive} alive · ${Math.ceil(alive / 2)} votes to execute.</p>
      ${g.block !== null && g.block !== undefined ? `<p class="hm-block">On the block: ${N(g.block)} with ${g.top} vote${g.top === 1 ? '' : 's'}</p>` : g.tie ? '<p class="hm-block">A tie: nobody is on the block</p>' : ''}
      ${lv && lv.id ? `<p class="hm-sub">Last vote: ${N(lv.nominee)} got ${lv.count} of ${lv.needed} needed${lv.yes?.length ? ` (${lv.yes.map(s => esc(ctx.nameOf(s))).join(', ')})` : ''}</p>` : ''}
      <div class="hm-buttons"><button class="tool" data-a="endDay" type="button">${g.block !== null && g.block !== undefined ? `End the day: execute ${esc(ctx.nameOf(g.block))}` : 'End the day (no execution)'}</button></div>`;
  }
  root.innerHTML = `
    <div class="hm-head">${night ? '🌙' : '☀️'}<b>${night ? `Night ${g.night}` : `Day ${g.day}`}</b><button class="tool" data-a="sheet" type="button">Characters</button></div>
    ${body}
    <ul class="hm-log">${g.log.slice(-4).map(l => `<li>${fmt(l, ctx.nameOf)}</li>`).join('')}</ul>
    <div class="hm-sheet" ${sheetOpen ? '' : 'hidden'}>${sheetHTML()}<button class="tool" data-a="sheet" type="button">Close</button></div>`;
  root.querySelectorAll('[data-a]').forEach(b => {
    b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'sheet') { sheetOpen = !sheetOpen; key = ''; render(g, ctx); return; }
      if (a === 'endDay' && !confirm(g.block !== null && g.block !== undefined ? `End the day and execute ${ctx.nameOf(g.block)}?` : 'End the day with no execution?')) return;
      ctx.act(g.crew[0], { type: a });
    };
  });
}

export default {
  defaults: {},
  settingsHTML: () => `<p class="hint">5–10 players. Everyone gets a secret character on their phone; one of you is the Shade. The app is the Storyteller. You'll want to talk, a lot.</p>`,

  create: (settings, players) => H.createGame(settings, players),
  act: H.applyAction,
  bot: H.botAction,
  view: H.viewFor,
  turn: H.turn,
  timer: H.timer,
  joinMidGame: () => false,

  plate(g, seat) {
    const badges = [];
    if (!g.crew.includes(seat)) return { badges: ['<span class="badge off">watching</span>'], meta: '', cards: 0, out: true };
    if (!g.alive[seat]) badges.push(`<span class="badge off">☠ dead${g.ghost[seat] ? ' · 1 vote left' : ''}</span>`);
    if (g.phase === 'vote' && g.vote.nominee === seat) badges.push('<span class="badge alone">nominated</span>');
    if (g.phase === 'vote' && seat in g.vote.votes) badges.push('<span class="badge got">✓ voted</span>');
    if (g.phase === 'day' && g.block === seat) badges.push('<span class="badge hm-block-b">on the block</span>');
    if (['night', 'witness'].includes(g.phase) && g.alive[seat] && g.need[seat] !== undefined && !(seat in g.choices)) badges.push('<span class="badge">…</span>');
    if (g.phase === 'over') {
      const c = CHARS[g.chars[seat]];
      badges.push(`<span class="badge hm-reveal ${c.kind}">${c.icon} ${c.name}</span>`);
      if (g.shown[seat] !== g.chars[seat] && g.chars[seat] === 'sleepwalker') badges.push(`<span class="badge off">thought: ${CHARS[g.shown[seat]].name}</span>`);
    }
    return { badges, meta: '', cards: 0, out: !g.alive[seat] };
  },

  reset() { root?.remove(); root = null; key = ''; sheetOpen = false; document.body.classList.remove('hm-night'); },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    document.body.classList.toggle('hm-night', ['night', 'witness'].includes(g.phase));
    if (root) root.style.visibility = g.phase === 'over' ? 'hidden' : '';
    if (!root) { root = document.createElement('div'); root.id = 'hollow'; document.getElementById('center').appendChild(root); }
    const k = JSON.stringify([g.phase, g.night, g.day, g.log.length, g.vote && Object.keys(g.vote.votes).length, g.choices && Object.keys(g.choices).length, g.block, ctx.vmin, sheetOpen]);
    if (k === key) return;
    key = k;
    render(g, ctx);
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const good = g.winner.team === 'good';
    const shade = g.crew.find(s => g.chars[s] === 'shade');
    return {
      key: 'hm-over' + g.night,
      html: `<h2>${good ? 'The village is saved!' : 'The Shade wins!'}</h2>
        <p>${fmt(g.winner.why, ctx.nameOf)}</p>
        <p class="scoreline">The Shade was <b>${esc(ctx.nameOf(shade))}</b>. Everyone's character is shown at their seat.</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
