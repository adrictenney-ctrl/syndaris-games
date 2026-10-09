// Don't Say It on a phone. The clue-giver sees the card (Got it / Skip); the other team sees it
// too, with a big BUZZ button; the guessing team just sees the clock and shouts answers.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { TEAMS, partyClock } from './table-dontsay.js?v=66';

let ctx = null, clockT = null, wasMyTurn = false, endAt = 0;
export function reset() { clearInterval(clockT); clockT = null; document.getElementById('dsPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export const cardBox = card => `<div class="ds-card"><b>${card.word}</b><ul>${card.ban.map(w => `<li>${w}</li>`).join('')}</ul></div>`;

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, t = g.team[you];
  const giver = g.giver === you, guessing = g.up === t && !giver;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · <span class="pt-team t${t}">${TEAMS[t]}</span>`;
  setHud('#hudL', TEAMS[t], g.scores[t]);
  setHud('#hudR', TEAMS[1 - t], g.scores[1 - t]);
  $('#hudC').innerHTML = '<span>Time</span><b class="pt-clock"></b>';
  endAt = Date.now() + (g.left || 0);
  if (!clockT) clockT = partyClock(() => (ctx.st.game.phase === 'clue' ? { endAt } : null), '#hudC .pt-clock');
  const mine = (g.phase === 'ready' && giver) || (g.phase === 'clue' && (giver || g.up !== t));
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  let el = document.getElementById('dsPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dsPhone';
    el.addEventListener('click', e => { const b = e.target.closest('[data-do]'); if (b) { ctx.send({ type: b.dataset.do }); navigator.vibrate?.(b.dataset.do === 'buzz' ? [80, 30, 80] : 15); } });
    $('#status').after(el);
  }
  let body = '';
  if (g.phase === 'ready' && giver) body = '<button class="rc-go" data-do="start"><b>🗣</b>Start</button>';
  else if (g.phase === 'clue' && g.card) {
    body = cardBox(g.card);
    body += giver ? '<div class="row"><button class="panel-btn" data-do="skip">↷ Skip</button><button class="panel-btn go" data-do="got">✓ Got it!</button></div>' : '<button class="ds-buzz" data-do="buzz">BUZZ! 🚨</button>';
  } else if (g.phase === 'clue' && guessing) body = '<p class="ds-shout">Shout out guesses! 📣</p>';
  el.innerHTML = body;
  if (g.phase === 'over') setStatus(g.winner == null ? "It's a tie!" : g.winner === t ? '🏆 Your team wins!' : `${TEAMS[g.winner]} wins`, 'Look at the table to play again');
  else if (g.phase === 'ready') setStatus(giver ? 'You give the clues' : `${c.nameOf(g.giver)} gives the clues`, giver ? 'Don’t say the word or any of the forbidden ones!' : g.up === t ? 'Get ready to guess' : 'Get ready to watch for slips');
  else if (g.phase === 'clue') setStatus(giver ? 'Describe it!' : guessing ? 'Guess!' : 'Watch for forbidden words', giver ? 'Got it = +1 · Skip if you’re stuck' : guessing ? `${c.nameOf(g.giver)} is describing` : 'Buzz if they say one — the card goes to your team');
  else setStatus('Time!', 'Next team in a moment');
  $('#panel').innerHTML = '';
  renderHand([]);
}
