// Crown & Dagger on the table: the two edict tracks, the failed-council tracker, who is
// Regent and who is up for Steward, and the votes once everyone has voted.
import * as K from './crown.js?v=52';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const fmt = (text, nameOf) => esc(text).replace(/\{(\d+)\}/g, (_, s) => `<b>${esc(nameOf(Number(s)))}</b>`);

export const CROWN = '<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M6 40 2 10l16 12L32 2l14 20 16-12-4 30z" fill="currentColor"/><rect x="6" y="40" width="52" height="6" rx="2" fill="currentColor"/></svg>';
export const DAGGER = '<svg viewBox="0 0 48 64" aria-hidden="true"><path d="M24 2 30 40H18z" fill="currentColor"/><rect x="10" y="40" width="28" height="5" rx="2" fill="currentColor"/><rect x="21" y="45" width="6" height="12" rx="2" fill="currentColor"/><circle cx="24" cy="60" r="3.5" fill="currentColor"/></svg>';
const POWER_ICON = { peek: '👁', investigate: '🔍', council: '📜', banish: '⚔' };
const POWER_SHORT = { peek: 'Read the scrolls', investigate: 'Question loyalty', council: 'Call a council', banish: 'Banish' };

export const edict = (c, extra = '') => `<span class="edict ${c === 'L' ? 'loyal' : 'dagger'}" ${extra}>${c === 'L' ? CROWN : DAGGER}<b>${c === 'L' ? 'Loyal' : 'Dagger'}</b></span>`;

function status(g, ctx) {
  const N = s => `<b>${esc(ctx.nameOf(s))}</b>`;
  switch (g.phase) {
    case 'nominate': return `Regent ${N(g.regent)} is choosing a Steward`;
    case 'vote': return `Vote on Regent ${N(g.regent)} and Steward ${N(g.nominee)} · ${Object.keys(g.votes).length} of ${g.crew.filter(s => g.alive[s]).length} voted`;
    case 'voteResult': return g.lastVote.passed ? `Aye ${g.lastVote.ayes}–${g.lastVote.nays}: the council approves` : `Nay ${g.lastVote.nays}–${g.lastVote.ayes}: the council refuses`;
    case 'regentLegis': return `Regent ${N(g.regent)} draws three edicts and discards one in secret`;
    case 'stewardLegis': return `Steward ${N(g.steward)} enacts one of the two`;
    case 'veto': return `Steward ${N(g.steward)} wants to veto. Regent ${N(g.regent)}, do you agree?`;
    case 'enacted': return g.lastEnacted ? `${g.lastEnacted.chaos ? 'Three councils failed. The people force an edict through!' : 'An edict is enacted'}` : `The council failed (${g.tracker} of 3)`;
    case 'power': return `Regent ${N(g.regent)}: ${K.POWER_TEXT[g.power]}`;
    case 'seen': return `Regent ${N(g.regent)} is looking at what they learned`;
  }
  return '';
}

function render(g, ctx) {
  root.style.setProperty('--v', ctx.vmin + 'px');
  const pw = K.powers(g.n);
  const loyal = Array.from({ length: 5 }, (_, i) => `<span class="slot${i < g.loyal ? ' filled' : ''}">${i < g.loyal ? edict('L') : i === 4 ? '<em>Loyalists win</em>' : ''}</span>`).join('');
  const dagger = Array.from({ length: 6 }, (_, i) => `<span class="slot${i < g.dagger ? ' filled' : ''}${i >= 3 ? ' danger' : ''}">${i < g.dagger ? edict('D') : i === 5 ? '<em>Conspiracy wins</em>' : pw[i] ? `<i>${POWER_ICON[pw[i]]}</i><em>${POWER_SHORT[pw[i]]}</em>${i === 4 ? '<em class="veto">+ veto</em>' : ''}` : ''}</span>`).join('');
  const tracker = [0, 1, 2].map(i => `<i class="${i < g.tracker ? 'on' : ''}"></i>`).join('');
  const fresh = g.phase === 'enacted' && g.lastEnacted ? g.lastEnacted : null;
  root.innerHTML = `
    <div class="cd-board loyal"><h4>${CROWN} Loyal edicts</h4><div class="cd-track">${loyal}</div></div>
    <div class="cd-board dagger"><h4>${DAGGER} Dagger edicts</h4><div class="cd-track">${dagger}</div>
      <p class="cd-note">${g.dagger >= 3 ? 'Danger: if the Usurper is approved as Steward, the Conspiracy wins.' : 'From the 3rd Dagger edict, approving the Usurper as Steward wins for the Conspiracy.'}</p></div>
    <div class="cd-mid">
      <div class="cd-tracker"><span>Failed councils</span>${tracker}</div>
      <div class="cd-piles"><span>Draw <b>${g.deck.length}</b></span><span>Discard <b>${g.discard.length}</b></span></div>
    </div>
    ${fresh ? `<div class="cd-fresh">${edict(fresh.card)}</div>` : ''}
    <p class="cd-status">${status(g, ctx)}</p>
    <ul class="cd-log">${g.log.slice(-3).map(l => `<li>${fmt(l, ctx.nameOf)}</li>`).join('')}</ul>`;
}

export default {
  defaults: {},
  settingsHTML: () => `<p class="hint">5–10 players. Most are Loyalists; a few are the Conspiracy, and one of them is the secret Usurper. Everyone checks their role on their phone.</p>`,

  create: (settings, players) => K.createGame(settings, players),
  act: K.applyAction,
  bot: K.botAction,
  view: K.viewFor,
  turn: K.turn,
  timer: K.timer,
  joinMidGame: () => false,

  plate(g, seat) {
    const badges = [];
    const inGame = g.crew.includes(seat);
    if (!inGame) return { badges: ['<span class="badge off">watching</span>'], meta: '', cards: 0, out: true };
    if (!g.alive[seat]) badges.push('<span class="badge off">banished</span>');
    if (seat === g.regent && g.phase !== 'over') badges.push('<span class="badge cd-regent">👑 Regent</span>');
    if (seat === g.nominee && ['vote', 'voteResult'].includes(g.phase)) badges.push('<span class="badge alone">Steward?</span>');
    if (seat === g.steward && ['stewardLegis', 'veto'].includes(g.phase)) badges.push('<span class="badge alone">Steward</span>');
    if (g.phase === 'nominate' && g.alive[seat] && seat !== g.regent && !K.eligible(g).includes(seat)) badges.push('<span class="badge off">can\'t be Steward</span>');
    if (g.phase === 'vote' && seat in g.votes) badges.push('<span class="badge got">✓ voted</span>');
    if (g.phase === 'voteResult' && seat in g.lastVote.votes) badges.push(g.lastVote.votes[seat] ? '<span class="badge cd-aye">Aye</span>' : '<span class="badge cd-nay">Nay</span>');
    if (g.phase === 'over') {
      const r = g.roles[seat];
      badges.push(`<span class="badge cd-role ${r}">${r === 'loyal' ? 'Loyalist' : r === 'consp' ? 'Conspirator' : 'The Usurper'}</span>`);
    }
    return { badges, meta: '', cards: 0, out: !g.alive[seat], turn: K.turn(g) === seat };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'crown'; document.getElementById('center').appendChild(root); }
    root.style.visibility = g.phase === 'over' ? 'hidden' : '';
    const k = JSON.stringify([g.phase, g.round, g.loyal, g.dagger, g.tracker, Object.keys(g.votes).length, g.log.length, g.deck.length, ctx.vmin]);
    if (k === key) return;
    key = k;
    render(g, ctx);
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const loyal = g.winner.team === 'loyal';
    const usurper = g.crew.find(s => g.roles[s] === 'usurper');
    const consp = g.crew.filter(s => g.roles[s] === 'consp');
    return {
      key: 'cd-over' + g.round,
      html: `<h2>${loyal ? 'The Loyalists win!' : 'The Conspiracy wins!'}</h2>
        <p>${esc(g.winner.why)}</p>
        <p class="scoreline">The Usurper was <b>${esc(ctx.nameOf(usurper))}</b>${consp.length ? `, with ${consp.map(s => `<b>${esc(ctx.nameOf(s))}</b>`).join(' and ')}` : ''}.</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
