// Rebel Cell / Round Table on a phone: your secret role (hold to peek), the team picker for the
// leader, Approve / Reject votes, and the secret Success / Sabotage cards on a mission.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=65';
import { ROLE } from './rebel.js?v=65';

let ctx = null, team = [], wasMyTurn = false, peek = false;
export function reset() { team = []; peek = false; document.getElementById('rbPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const b = (label, a, cls = '') => `<button class="panel-btn ${cls}" data-a='${JSON.stringify(a)}'>${label}</button>`;

function roleBox(g, c) {
  const r = ROLE[g.role];
  const know = g.knows.length ? `<ul>${g.knows.map(k => `<li>${c.nameOf(k.seat)} — ${k.as === 'spy' ? 'a spy 🕵️' : 'maybe the Seer 🔮'}</li>`).join('')}</ul>` : '';
  return `<div class="rb-role ${peek || g.phase === 'night' ? 'open' : ''} s${g.side}"><div class="rb-face"><b>${r.ic}</b><strong>${r.name}</strong><em>${r.text}</em>${know}</div><div class="rb-hide">Hold to see your role</div></div>`;
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const ok = g.missions.filter(m => m.ok).length;
  setHud('#hudL', 'Successes', ok);
  $('#hudC').innerHTML = `<span>Mission</span><b>${Math.min(5, g.missions.length + 1)}</b>`;
  setHud('#hudR', 'Sabotaged', g.missions.length - ok);
  const lead = g.leader === you;
  const mine = (g.phase === 'night' && !g.ready[you]) || (g.phase === 'propose' && lead) || (g.phase === 'vote' && g.myVote == null) || (g.phase === 'mission' && g.team.includes(you) && !g.played) || (g.phase === 'knife' && g.role === 'knife');
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  if (g.phase !== 'propose' || !lead) team = [];
  let el = document.getElementById('rbPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rbPhone';
    $('#status').after(el);
    el.addEventListener('click', ev => {
      const t = ev.target.closest('[data-t]');
      if (t) { const s = Number(t.dataset.t); const n = ctx.st.game.teamSize; team = team.includes(s) ? team.filter(x => x !== s) : [...team, s].slice(-n); return render(ctx); }
      const a = ev.target.closest('[data-a]');
      if (!a) return;
      const act = JSON.parse(a.dataset.a);
      if (act.type === 'propose') act.team = team;
      ctx.send(act);
      navigator.vibrate?.(20);
    });
    const hold = on => () => { peek = on; const r = el.querySelector('.rb-role'); if (r) r.classList.toggle('open', on || ctx.st.game.phase === 'night'); };
    el.addEventListener('pointerdown', ev => { if (ev.target.closest('.rb-role')) hold(true)(); });
    el.addEventListener('pointerup', hold(false));
    el.addEventListener('pointercancel', hold(false));
  }
  let body = roleBox(g, c);
  if (g.phase === 'night') body += g.ready[you] ? '<p class="rb-note">Waiting for everyone…</p>' : b('I’ve seen it — Ready', { type: 'ready' }, 'go wide');
  else if (g.phase === 'propose' && lead) body += `<p class="rb-note">Pick ${g.teamSize} for mission ${g.missions.length + 1}${g.failsNeeded > 1 ? ' (needs two sabotages to fail)' : ''}:</p><div class="rb-pick">${g.order.map(s => `<button data-t="${s}" class="${team.includes(s) ? 'sel' : ''}"><i style="background:var(--seat-${s})"></i>${c.nameOf(s)}</button>`).join('')}</div>${b(`Propose this team (${team.length}/${g.teamSize})`, { type: 'propose' }, 'go wide')}`;
  else if (g.phase === 'vote') body += `<p class="rb-note">${c.nameOf(g.leader)}’s team: <b>${g.team.map(c.nameOf).join(', ')}</b></p>${g.myVote == null ? `<div class="row">${b('👍 Approve', { type: 'vote', yes: true }, 'go')}${b('👎 Reject', { type: 'vote', yes: false })}</div>` : `<p class="rb-note">You voted ${g.myVote ? 'approve' : 'reject'}</p>`}`;
  else if (g.phase === 'mission' && g.team.includes(you)) body += g.played ? '<p class="rb-note">Card played — face down.</p>' : `<div class="rb-cards">${b('<b>✅</b>Success', { type: 'card', sabotage: false }, 'ok')}${g.side === 1 ? b('<b>💥</b>Sabotage', { type: 'card', sabotage: true }, 'bad') : '<button class="panel-btn bad" disabled><b>💥</b>Loyalists can’t sabotage</button>'}</div>`;
  else if (g.phase === 'knife' && g.role === 'knife') body += `<p class="rb-note">Who is the Seer? One guess.</p><div class="rb-pick">${g.order.filter(s => s !== you && !g.knows.some(k => k.seat === s)).map(s => b(c.nameOf(s), { type: 'stab', target: s })).join('')}</div>`;
  el.innerHTML = body;
  const L = c.nameOf(g.leader);
  if (g.phase === 'over') setStatus(g.winner === g.side ? '🏆 Your side wins!' : 'Your side lost', g.why);
  else if (g.phase === 'night') setStatus('Your secret role', 'Don’t let anyone see your screen');
  else if (g.phase === 'propose') setStatus(lead ? 'You’re the leader' : `${L} picks the team`, lead ? 'Choose who goes on the mission' : 'Argue your case!');
  else if (g.phase === 'vote') setStatus('Vote on the team', `${g.rejects} rejected in a row · 5 and the spies win`);
  else if (g.phase === 'tally') setStatus(g.lastVote?.passed ? 'Team approved' : 'Team rejected', '');
  else if (g.phase === 'mission') setStatus(g.team.includes(you) ? 'You’re on the mission' : 'The team is on the mission', g.team.includes(you) ? 'Your card is secret' : 'Wait for the result');
  else if (g.phase === 'result') { const m = g.missions.at(-1); setStatus(m.ok ? 'Mission succeeded ✅' : 'Mission sabotaged 💥', m.fails ? `${m.fails} sabotage card${m.fails > 1 ? 's' : ''}` : ''); }
  else if (g.phase === 'knife') setStatus(g.role === 'knife' ? 'Find the Seer' : 'The Knife is choosing…', '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
