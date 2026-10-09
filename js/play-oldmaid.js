// Old Maid on a phone: your hand (pairs are thrown away for you), and on your turn the next
// player's cards face down — tap one to take it.
import { $, setHud, setStatus, renderHand, cardEl } from './phone-kit.js?v=68';
import { MAID } from './oldmaid.js?v=68';

let wasMyTurn = false;
export function reset() { document.getElementById('omPick')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  const g = c.st.game, you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Cards', g.hand.length);
  setHud('#hudR', 'Pairs', g.pairs[you]);
  $('#hudC').innerHTML = g.hand.includes(MAID) ? '<span>You have</span><b>😱</b>' : '';
  const mine = g.phase === 'play' && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  let pick = document.getElementById('omPick');
  if (!pick) { pick = document.createElement('div'); pick.id = 'omPick'; $('#status').after(pick); }
  pick.innerHTML = '';
  if (g.phase === 'over') setStatus(g.loser === you ? "😱 You're the Old Maid!" : 'Safe! 🎉', `${c.nameOf(g.loser)} was left with the queen`);
  else if (!g.hand.length) setStatus("You're safe! 🎉", 'Watch who gets stuck with the Old Maid');
  else if (mine) {
    setStatus(`Take a card from ${c.nameOf(g.from)}`, 'Tap any of their cards');
    for (let i = 0; i < g.fromCount; i++) {
      const b = cardEl(null, true);
      b.dataset.i = i;
      b.style.setProperty('--r', `${(i - (g.fromCount - 1) / 2) * 3}deg`);
      b.onclick = () => { c.send({ type: 'take', i }); navigator.vibrate?.(20); };
      pick.appendChild(b);
    }
  } else setStatus(`${c.nameOf(g.turn)}'s turn`, g.from === you ? `${c.nameOf(g.turn)} is taking one of YOUR cards…` : '');
  $('#panel').innerHTML = g.hand.length > 1 && g.phase === 'play' ? '<button class="panel-btn" id="omShuf">Shuffle my hand</button>' : '';
  $('#omShuf')?.addEventListener('click', () => c.send({ type: 'shuffle' }));
  renderHand(g.hand, { hint: g.hand.includes(MAID) ? 'Keep a straight face…' : '' });
}
