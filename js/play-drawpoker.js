// Five-Card Draw on a phone: your five cards, the betting buttons, and at the draw tap the
// cards you want to throw away.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=63';
import { CAP } from './drawpoker.js?v=63';

let toss = [], wasMyTurn = false, lastHand = -1;
export function reset() { toss = []; lastHand = -1; }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
}
export function render(c) {
  const g = c.st.game, you = c.st.you;
  if (g.handNo !== lastHand) { lastHand = g.handNo; toss = []; }
  toss = toss.filter(x => g.hand.includes(x));
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Chips', g.chips[you]);
  $('#hudC').innerHTML = `<span>Pot</span><b>${g.pot}</b>`;
  setHud('#hudR', 'Hand', '', g.text);
  const mine = ['bet1', 'draw', 'bet2'].includes(g.phase) && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  const p = $('#panel');
  const me = g.me;
  if (g.phase === 'over') { setStatus(g.winner === you ? '🏆 You win every chip!' : 'Game over', 'Look at the table to play again'); p.innerHTML = ''; }
  else if (!me) { setStatus("You're out of chips", 'Watch the rest of the game'); p.innerHTML = ''; }
  else if (g.phase === 'handEnd') {
    const won = g.result.pots.filter(x => x.winners.includes(you)).reduce((a, x) => a + Math.floor(x.amount / x.winners.length), 0);
    setStatus(won ? `You win ${won}!` : me.folded ? 'You folded' : 'Not this time', g.result.hands[you]?.text || '');
    p.innerHTML = '';
  } else if (me.folded) { setStatus('You folded', 'Wait for the next hand'); p.innerHTML = ''; }
  else if (!mine) { setStatus(`${c.nameOf(g.turn)} to act`, g.phase === 'draw' ? 'The draw' : `${g.bet - me.bet > 0 ? `${g.bet - me.bet} to call` : 'Nothing to call yet'}`); p.innerHTML = ''; }
  else if (g.phase === 'draw') {
    const max = g.hand.some(x => x[0] === 'A' && !toss.includes(x)) ? 4 : 3;
    setStatus('The draw', `Tap the cards to throw away (up to ${max})`);
    p.innerHTML = `<button class="panel-btn go wide" id="dpDraw" ${toss.length > max ? 'disabled' : ''}>${toss.length ? `Swap ${toss.length}` : 'Stand pat'}</button>`;
    $('#dpDraw').onclick = () => { c.send({ type: 'draw', cards: toss }); toss = []; };
  } else {
    const toCall = g.bet - me.bet;
    const canRaise = g.raises < CAP && g.chips[you] > toCall;
    setStatus('Your bet', toCall > 0 ? `${toCall} to call` : 'Check or bet');
    p.innerHTML = `<div class="row"><button class="panel-btn" id="dpFold">Fold</button><button class="panel-btn" id="dpCall">${toCall > 0 ? `Call ${Math.min(toCall, g.chips[you])}` : 'Check'}</button><button class="panel-btn go" id="dpBet" ${canRaise ? '' : 'disabled'}>${g.bet ? `Raise ${g.step}` : `Bet ${g.step}`}</button></div>`;
    $('#dpFold').onclick = () => c.send({ type: 'fold' });
    $('#dpCall').onclick = () => c.send({ type: toCall > 0 ? 'call' : 'check' });
    $('#dpBet').onclick = () => c.send({ type: 'bet' });
  }
  renderHand(g.hand, {
    selected: toss,
    onTap: card => { if (!(mine && g.phase === 'draw')) return; toss = toss.includes(card) ? toss.filter(x => x !== card) : [...toss, card]; render(c); },
    hint: mine && g.phase === 'draw' ? 'Raised cards get thrown away' : '',
  });
}
