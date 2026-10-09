// Hearts on a phone: pick three cards to pass, then play — tap a bright card twice, or swipe
// it up. Cards you can't play are dimmed.
import { $, toast, setHud, setStatus, renderHand, flyCard } from './phone-kit.js?v=66';
import { cardName } from './tricks.js?v=66';

let ctx = null, picks = [], selected = null, lastHand = -1, wasMyTurn = false;

export function reset() { picks = []; selected = null; lastHand = -1; }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
}

// Shared by the trick games: tap once to raise a card, tap again (or swipe up) to play it.
export function playHand(c, g, { legal, myTurn, send, hint }) {
  if (!myTurn || !legal.includes(selected)) selected = null;
  const play = card => {
    if (!myTurn) return;
    if (!legal.includes(card)) return toast("You can't play that card now");
    flyCard(card); selected = null; send({ type: 'play', card }); navigator.vibrate?.(15);
  };
  renderHand(g.hand, {
    dim: myTurn ? g.hand.filter(x => !legal.includes(x)) : null,
    selected,
    onTap: card => { if (!myTurn) return; if (selected === card) play(card); else { selected = card; playHand(c, g, { legal, myTurn, send, hint }); } },
    onSwipe: play,
    hint: myTurn ? hint || 'Tap a card twice or swipe it up to play' : '',
  });
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (g.handNo !== lastHand) { lastHand = g.handNo; picks = []; selected = null; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'This hand', g.taken[you]);
  $('#hudC').innerHTML = `<span>Hearts</span><b class="red">${g.broken ? '♥' : '♡'}</b>`;
  setHud('#hudR', 'Total', g.scores[you], `to ${g.target}`);
  const myTurn = g.phase === 'play' && g.turn === you;
  const mine = myTurn || (g.phase === 'pass' && !g.passed);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  const p = $('#panel');

  if (g.phase === 'pass') {
    picks = picks.filter(x => g.hand.includes(x));
    const dir = g.passDir === 'across' ? 'across the table' : `to the ${g.passDir}`;
    if (g.passed) {
      setStatus('Passed ✓', `Waiting for ${4 - g.passedAll.filter(Boolean).length} more`);
      p.innerHTML = '<button class="panel-btn" id="hUn">Take them back</button>';
      $('#hUn').onclick = () => c.send({ type: 'unpass' });
      renderHand(g.hand, { selected: g.passed, dim: g.hand.filter(x => !g.passed.includes(x)) });
      return;
    }
    setStatus(`Pass three cards ${dir}`, `${picks.length}/3 chosen · the Queen of Spades and high hearts are good to pass`);
    p.innerHTML = `<button class="panel-btn go wide" id="hPass" ${picks.length === 3 ? '' : 'disabled'}>Pass ${dir}</button>`;
    $('#hPass').onclick = () => { c.send({ type: 'pass', cards: picks }); navigator.vibrate?.(20); };
    renderHand(g.hand, {
      selected: picks,
      onTap: card => { picks = picks.includes(card) ? picks.filter(x => x !== card) : [...picks, card].slice(-3); render(ctx); },
      hint: 'Tap three cards',
    });
    return;
  }
  p.innerHTML = '';
  if (g.phase === 'handEnd' || g.phase === 'over') {
    setStatus(g.phase === 'over' ? (g.winners.includes(you) ? '🏆 You win!' : 'Game over') : `You took ${g.result.taken[you]} point${g.result.taken[you] === 1 ? '' : 's'}`, g.phase === 'over' ? 'Look at the table to play again' : 'Next hand in a moment');
  } else if (myTurn) {
    setStatus('Your turn', g.trickNo === 0 && !g.trick.length ? 'Lead the 2♣' : g.trick.length ? `Follow ${cardName(g.trick[0].card).slice(-1)} if you can` : g.broken ? 'Lead anything' : "Lead anything but a heart — they aren't broken");
  } else if (g.phase === 'play') setStatus(`${c.nameOf(g.turn)}'s turn`, g.received && g.trickNo === 0 ? `You were passed ${g.received.map(cardName).join(' ')}` : '');
  else setStatus('Trick over', '');
  playHand(c, g, { legal: g.legal, myTurn, send: c.send });
}
