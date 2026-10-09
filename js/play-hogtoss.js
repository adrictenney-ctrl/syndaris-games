// Hog Toss on a phone: Toss the pigs, or Bank what you've built up this turn.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { pigSVG } from './table-hogtoss.js?v=68';

let wasMyTurn = false;
export function reset() { document.getElementById('hgPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  const g = c.st.game, you = c.st.you;
  const mine = g.phase === 'play' && g.turn === you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Score', g.scores[you], `to ${g.target}`);
  $('#hudC').innerHTML = g.turn === you ? `<span>This turn</span><b>${g.turnPts}</b>` : '';
  const lead = g.order.filter(s => s !== you).sort((a, b) => g.scores[b] - g.scores[a])[0];
  setHud('#hudR', c.nameOf(lead), g.scores[lead]);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('hgPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hgPhone';
    el.addEventListener('click', e => { const b = e.target.closest('[data-do]'); if (b) { c.send({ type: b.dataset.do }); navigator.vibrate?.(25); } });
    $('#status').after(el);
  }
  const t = g.lastToss;
  el.innerHTML = `<div class="hog-mat small">${pigSVG(g.pigs[0])}${pigSVG(g.pigs[1], true)}</div>${t && g.turn === you ? `<p class="hog-name ${t.kind !== 'ok' ? 'bad' : ''}">${t.name}${t.kind === 'ok' ? ` +${t.pts}` : ''}</p>` : ''}
    ${mine ? `<div class="row"><button class="panel-btn go" data-do="toss">🐖 Toss the pigs</button><button class="panel-btn" data-do="bank" ${g.turnPts ? '' : 'disabled'}>Bank ${g.turnPts}</button></div>` : ''}`;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (g.phase === 'oops' && g.turn === you) setStatus(t?.kind === 'pile' ? 'Pig Pile! 😱' : 'Odd sides! 💨', t?.kind === 'pile' ? 'Your score is back to zero' : 'This turn’s points are gone');
  else if (mine) setStatus('Your turn', g.turnPts ? 'Push your luck — or bank it' : 'Toss the pigs');
  else setStatus(`${c.nameOf(g.turn)} is tossing`, '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
