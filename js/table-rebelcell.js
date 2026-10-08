// Rebel Cell on the table: the five missions along the middle (team sizes, then a green or red
// seal once played), the rejected-teams counter, the team on the table right now, and how
// everyone voted. Round Table (table-roundtable.js) is the same table with its characters.
import * as R from './rebel.js?v=64';
import { snap } from './cards.js?v=64';
import { chime, sad } from './sfx.js?v=64';
import { centerMsg, clearMsg } from './table-hearts.js?v=64';

export function rebelMode(avalon) {
  let root = null, key = '';
  return {
    defaults: avalon ? { avalon: true, squire: true, witch: true, black: false, wolf: false } : { avalon: false },
    settingsHTML: s => avalon ? ['squire', 'witch', 'black', 'wolf'].map(k => `<label><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}> ${R.ROLE[k].ic} ${R.ROLE[k].name}</label>`).join('') + '<span class="yc-note">The Seer and the Knife are always in</span>' : '<span class="yc-note">5–10 players · 2–4 of them are spies</span>',
    applySetting(s, k, el) { if (['squire', 'witch', 'black', 'wolf'].includes(k)) { s[k] = el.checked; return true; } return false; },
    create: (settings, players) => R.createGame({ ...settings, avalon }, players),
    act: R.applyAction,
    bot: R.botAction,
    view: R.viewFor,
    turn: g => R.current(g),
    timer: (g, players) => R.tick(g, players),
    joinMidGame: () => false,
    plate(g, s) {
      if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
      const badges = [];
      if (R.leader(g) === s && g.phase !== 'over') badges.push('<span class="badge dealer">LEADER</span>');
      if ((g.team || []).includes(s) && ['vote', 'tally', 'mission'].includes(g.phase)) badges.push('<span class="badge got">on the team</span>');
      if (g.phase === 'vote') badges.push(g.votes[s] == null ? '<span class="badge">voting…</span>' : '<span class="badge">voted</span>');
      if (g.phase === 'tally') badges.push(g.lastVote.votes[s] ? '<span class="badge got">👍 approve</span>' : '<span class="badge alone">👎 reject</span>');
      if (g.phase === 'over') badges.push(`<span class="badge ${R.side(g, s) ? 'alone' : 'got'}">${R.ROLE[g.role[s]].ic} ${R.ROLE[g.role[s]].name}</span>`);
      const turn = R.current(g) === s || (g.phase === 'night' && !g.ready[s]) || (g.phase === 'vote' && g.votes[s] == null) || (g.phase === 'mission' && g.team.includes(s) && g.cards[s] == null);
      return { badges, meta: '', cards: 0, turn, out: false };
    },
    reset() { root?.remove(); root = null; key = ''; clearMsg(); },
    renderCenter(g, ctx) {
      document.getElementById('watermark').textContent = '';
      if (!root) { root = document.createElement('div'); root.id = 'rebel'; root.className = avalon ? 'rt' : 'rc'; document.getElementById('center').appendChild(root); }
      const k = JSON.stringify([g.moveId, g.phase]);
      if (k === key) return;
      if (key) { if (g.phase === 'result') (g.missions.at(-1).ok ? chime : sad)(); else snap(0.3); }
      key = k;
      const sizes = R.TEAMS[g.order.length];
      const missions = sizes.map((n, i) => { const m = g.missions[i]; return `<div class="rb-m ${m ? (m.ok ? 'ok' : 'bad') : i === g.missions.length ? 'now' : ''}"><b>${m ? (m.ok ? '✓' : '✗') : n}</b><small>${m ? (m.fails ? `${m.fails} sabotage${m.fails > 1 ? 's' : ''}` : 'clean') : i === 3 && g.order.length >= 7 ? '2 to fail' : `${n} go`}</small></div>`; }).join('');
      const rej = [0, 1, 2, 3, 4].map(i => `<i class="${i < g.rejects ? 'on' : ''}"></i>`).join('');
      const team = (g.team || []).length ? `<div class="rb-team">${g.team.map(s => `<span style="--c: var(--seat-${s})">${ctx.nameOf(s)}</span>`).join('')}</div>` : '';
      root.innerHTML = `<div class="rb-missions">${missions}</div><div class="rb-rej"><small>Rejected teams</small>${rej}</div>${team}`;
      const L = ctx.nameOf(R.leader(g));
      const msg = {
        night: 'Everyone: look at your secret role on your phone, then tap Ready',
        propose: `<b>${L}</b> is choosing ${R.teamSize(g)} players for mission ${g.missions.length + 1}`,
        vote: `Vote on <b>${L}</b>’s team — ${g.order.filter(s => g.votes?.[s] != null).length}/${g.order.length} voted`,
        tally: g.lastVote ? (g.lastVote.passed ? '<b>Approved!</b> The team sets out' : `<b>Rejected.</b> ${g.rejects + 1 >= 5 ? 'Five in a row…' : 'Leadership passes on'}`) : '',
        mission: `The team is on the mission — ${g.team.filter(s => g.cards[s] != null).length}/${g.team.length} cards played`,
        result: g.missions.length ? (g.missions.at(-1).ok ? '<b>Mission succeeded</b>' : `<b>Mission sabotaged</b> — ${g.missions.at(-1).fails} sabotage card${g.missions.at(-1).fails > 1 ? 's' : ''}`) : '',
        knife: 'The loyalists won three missions… but <b>the Knife</b> gets one guess at the Seer',
        over: '',
      }[g.phase];
      centerMsg(msg || '');
    },
    overlay(g, ctx) {
      if (g.phase !== 'over') return null;
      const spies = g.order.filter(s => R.side(g, s) === 1);
      return {
        key: 'over',
        html: `<h2>${g.winner ? 'The Spies win' : 'The Loyalists win'}</h2><p>${g.why}</p><p>Spies: ${spies.map(s => `${ctx.nameOf(s)} (${R.ROLE[g.role[s]].name})`).join(', ')}${avalon ? ` · Seer: ${ctx.nameOf(g.order.find(s => g.role[s] === 'seer'))}` : ''}</p>
          <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
      };
    },
  };
}

export default rebelMode(false);
