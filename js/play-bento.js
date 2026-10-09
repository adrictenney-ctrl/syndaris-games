// Bento Box on a phone: your hand of lunch cards. Tap one to pick it (with chopsticks on your
// tray you may pick two), then Lock in. Your tray is shown above.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { bnCard, spread } from './table-bento.js?v=66';
import { roundScore, lanterns } from './bento.js?v=66';

let sel = [], wasMyTurn = false, lastKey = '';
export function reset() { sel = []; document.getElementById('bnPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  const g = c.st.game, you = c.st.you;
  const k = g.round + ':' + g.hand.join(',');
  if (k !== lastKey) { lastKey = k; sel = []; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Points', g.scores[you]);
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b><em>of 3</em>`;
  setHud('#hudR', 'Lanterns', lanterns(g.played[you]), `🍡 ${g.mochi[you] + g.played[you].filter(p => p.k === 'mochi').length}`);
  const mine = g.phase === 'pick' && !g.picked;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.(40);
  wasMyTurn = mine;
  let el = document.getElementById('bnPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bnPhone';
    $('#status').after(el);
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-i]');
      if (!b || !(c.st.game.phase === 'pick' && !c.st.game.picked)) return;
      const i = Number(b.dataset.i);
      const max = c.st.game.hasSticks ? 2 : 1;
      sel = sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i].slice(-max);
      render(c);
    });
  }
  const r = roundScore(g.played[you]);
  el.innerHTML = `<div class="bn-mytray">${spread(g.played[you]) || '<i>Your tray is empty</i>'}</div><p class="bn-tally">This round so far: rolls ${r.roll} · onigiri ${r.oni} · gyoza ${r.gyoza} · bowls ${r.bowls}</p>
    <div class="bn-hand">${g.hand.map((k, i) => `<button data-i="${i}" class="${sel.includes(i) || g.picked?.includes(i) ? 'sel' : ''}" ${mine ? '' : 'disabled'}>${bnCard(k)}</button>`).join('')}</div>`;
  const p = $('#panel');
  if (g.phase === 'over') { setStatus(g.winners.includes(you) ? '🏆 You win!' : 'Game over', 'Look at the table to play again'); p.innerHTML = ''; }
  else if (g.phase === 'roundEnd') { setStatus(`Round ${g.round} scored`, `You got ${g.result.lines[you].total}`); p.innerHTML = ''; }
  else if (g.picked) { setStatus('Picked ✓', 'Waiting for everyone else'); p.innerHTML = '<button class="panel-btn" id="bnUn">Change my pick</button>'; $('#bnUn').onclick = () => c.send({ type: 'unpick' }); }
  else {
    setStatus('Pick a card', g.hasSticks ? 'You have chopsticks — you may take two' : 'Keep one, pass the rest left');
    p.innerHTML = `<button class="panel-btn go wide" id="bnGo" ${sel.length ? '' : 'disabled'}>${sel.length === 2 ? 'Take both (chopsticks go back)' : 'Lock it in'}</button>`;
    $('#bnGo').onclick = () => { c.send({ type: 'pick', idx: sel }); sel = []; navigator.vibrate?.(15); };
  }
  renderHand([]);
}
