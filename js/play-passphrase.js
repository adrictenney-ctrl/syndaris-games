// Pass the Phrase on a phone: when you're holding it, the phrase is shown big with Got it (pass
// it on) and Skip. Everyone else sees whose turn it is.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=67';
import { TEAMS } from './table-dontsay.js?v=67';
import { buzzer } from './sfx.js?v=67';

let ctx = null, wasMine = false, lastPhase = '';
export function reset() { document.getElementById('ppPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, t = g.team[you];
  const mine = g.holder === you && (g.phase === 'ready' || g.phase === 'play');
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · <span class="pt-team t${t}">${TEAMS[t]}</span>`;
  setHud('#hudL', TEAMS[t], g.scores[t], `to ${g.target}`);
  setHud('#hudR', TEAMS[1 - t], g.scores[1 - t]);
  $('#hudC').innerHTML = '';
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMine) navigator.vibrate?.([80, 30, 80]);
  wasMine = mine;
  if (g.phase === 'buzz' && lastPhase === 'play') { buzzer(); navigator.vibrate?.(500); }
  lastPhase = g.phase;
  let el = document.getElementById('ppPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ppPhone';
    el.addEventListener('click', e => { const b = e.target.closest('[data-do]'); if (b) { ctx.send({ type: b.dataset.do }); navigator.vibrate?.(20); } });
    $('#status').after(el);
  }
  if (g.phase === 'ready' && mine) el.innerHTML = '<button class="rc-go" data-do="start"><b>💣</b>Start</button>';
  else if (g.phase === 'play' && mine) el.innerHTML = `<div class="ds-card"><b>${g.phrase}</b></div><div class="row"><button class="panel-btn" data-do="skip">↷ Skip</button><button class="panel-btn go pp-got" data-do="got">✓ Got it — pass!</button></div>`;
  else el.innerHTML = g.phase === 'play' ? `<p class="ds-shout">${g.team[g.holder] === t ? 'Guess! 📣' : 'Hope it’s still in their hands when it blows… 💣'}</p>` : '';
  if (g.phase === 'over') setStatus(g.winner === t ? '🏆 Your team wins!' : `${TEAMS[g.winner]} wins`, 'Look at the table to play again');
  else if (g.phase === 'buzz') setStatus(g.lastBuzz.caught === you ? '💥 Caught you!' : 'BZZZT!', `${c.nameOf(g.lastBuzz.caught)} was holding “${g.lastBuzz.phrase}”`);
  else if (mine) setStatus(g.phase === 'ready' ? 'You start this round' : 'Describe it!', g.phase === 'ready' ? 'Tap Start — the timer is secret' : 'No rhymes, no “sounds like”, don’t say the word');
  else setStatus(`${c.nameOf(g.holder)} has it`, g.team[g.holder] === t ? 'Your team — guess fast' : '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
