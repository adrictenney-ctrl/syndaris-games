// War on a phone: one big button to flip your top card.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=65';

let wasMyTurn = false;
export function reset() {}
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
}
export function render(c) {
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'You', g.counts[you], 'cards');
  $('#hudC').innerHTML = g.length ? `<span>Battle</span><b>${g.battles}</b><em>of ${g.length}</em>` : `<span>Battles</span><b>${g.battles}</b>`;
  setHud('#hudR', c.nameOf(opp), g.counts[opp], 'cards');
  const mine = g.phase === 'flip' && !g.flipped[you];
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.(40);
  wasMyTurn = mine;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : g.winner == null ? 'A draw' : `${c.nameOf(opp)} wins`, 'Look at the table to play again');
  else if (g.phase === 'reveal') setStatus(g.result.winner === you ? `You take ${g.result.n}!` : `${c.nameOf(opp)} takes ${g.result.n}`, '');
  else setStatus(g.wars ? 'WAR!' : mine ? 'Flip!' : 'Waiting…', mine ? (g.wars ? 'Three cards go down — flip the fourth' : 'Tap to flip your top card') : `Waiting for ${c.nameOf(opp)}`);
  $('#panel').innerHTML = `<button class="wr-flip" id="wrFlip" ${mine ? '' : 'disabled'}><span>${g.wars && mine ? 'WAR!' : 'FLIP'}</span><small>${g.counts[you]} cards</small></button>`;
  $('#wrFlip').onclick = () => { c.send({ type: 'flip' }); navigator.vibrate?.(20); };
  renderHand([]);
}
