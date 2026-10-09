// Cribbage on a phone: choose two cards for the crib, then peg — tap a bright card to lay it
// (the count is shown), or say Go when nothing fits.
import { $, setHud, setStatus, renderHand, flyCard } from './phone-kit.js?v=66';

let pick = [], wasMyTurn = false, lastHand = -1;
export function reset() { pick = []; lastHand = -1; }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
}
export function render(c) {
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  if (g.handNo !== lastHand) { lastHand = g.handNo; pick = []; }
  pick = pick.filter(x => g.hand.includes(x));
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}${g.dealer === you ? ' · your crib' : ''}`;
  setHud('#hudL', 'You', g.scores[you], 'of 121');
  $('#hudC').innerHTML = g.phase === 'peg' ? `<span>Count</span><b>${g.count}</b>` : '';
  setHud('#hudR', c.nameOf(opp), g.scores[opp]);
  const mine = (g.phase === 'peg' && g.turn === you) || (g.phase === 'discard' && !g.thrown);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  const p = $('#panel');
  p.innerHTML = '';
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(opp)} wins`, 'Look at the table to play again');
  else if (g.phase === 'discard') {
    if (g.thrown) { setStatus('Crib ✓', 'Waiting for the other player'); renderHand(g.hand, { selected: g.thrown }); return; }
    setStatus(`Throw two into ${g.dealer === you ? 'your' : `${c.nameOf(opp)}'s`} crib`, `${pick.length}/2 chosen`);
    p.innerHTML = `<button class="panel-btn go wide" id="cbCrib" ${pick.length === 2 ? '' : 'disabled'}>To the crib</button>`;
    $('#cbCrib').onclick = () => c.send({ type: 'crib', cards: pick });
    renderHand(g.hand, { selected: pick, onTap: card => { pick = pick.includes(card) ? pick.filter(x => x !== card) : [...pick, card].slice(-2); render(c); }, hint: 'Tap two cards' });
    return;
  } else if (g.phase === 'peg') {
    if (g.turn === you) {
      setStatus(g.canPlay.length ? 'Your play' : 'Nothing fits — say Go', `Count is ${g.count} · it can't pass 31`);
      if (!g.canPlay.length) { p.innerHTML = '<button class="panel-btn go wide" id="cbGo">Go</button>'; $('#cbGo').onclick = () => c.send({ type: 'go' }); }
    } else setStatus(`${c.nameOf(opp)}'s play`, `Count is ${g.count}`);
  } else setStatus('The show', 'Counting hands and the crib');
  renderHand(g.hand, {
    dim: g.phase === 'peg' && g.turn === you ? g.hand.filter(x => !g.canPlay.includes(x)) : null,
    onTap: card => { if (!(g.phase === 'peg' && g.turn === you) || !g.canPlay.includes(card)) return; flyCard(card); c.send({ type: 'play', card }); },
    onSwipe: card => { if (g.phase === 'peg' && g.turn === you && g.canPlay.includes(card)) { flyCard(card); c.send({ type: 'play', card }); } },
    hint: g.phase === 'peg' && g.turn === you && g.canPlay.length ? 'Tap a card to lay it' : '',
  });
}
