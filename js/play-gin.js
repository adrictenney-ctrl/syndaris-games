// Gin Rummy on a phone: your hand with its melds worked out and your deadwood counted. Draw,
// then tap a card and Discard — or Knock once your deadwood is 10 or less.
import { $, setHud, setStatus, renderHand, cardEl, flyCard } from './phone-kit.js?v=68';
import { bestMelds } from './rummycore.js?v=68';

let sel = null, wasMyTurn = false;
export function reset() { sel = null; }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
}
export function render(c) {
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  if (!g.hand.includes(sel)) sel = null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'You', g.scores[you], `to ${g.target}`);
  $('#hudC').innerHTML = `<span>Deadwood</span><b>${g.deadwood}</b>`;
  setHud('#hudR', c.nameOf(opp), g.scores[opp]);
  const mine = (g.phase === 'draw' || g.phase === 'discard') && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  // Lay the hand out meld by meld, deadwood last.
  const inMeld = g.melds.flat();
  const ordered = [...inMeld, ...g.hand.filter(x => !inMeld.includes(x))];
  const p = $('#panel');
  const after = sel ? bestMelds(g.hand.filter(x => x !== sel)).deadwood : null;
  if (g.phase === 'handEnd' || g.phase === 'over') {
    const r = g.result;
    setStatus(r.wash ? 'A wash' : r.winner === you ? `You score ${r.pts}!` : `${c.nameOf(opp)} scores ${r.pts}`, r.wash ? 'Nobody scores' : r.gin ? 'Gin!' : r.undercut ? 'Undercut! (+25)' : 'Knock');
    p.innerHTML = '';
  } else if (!mine) { setStatus(`${c.nameOf(g.turn)}'s turn`, ''); p.innerHTML = ''; }
  else if (g.phase === 'draw') {
    setStatus('Your turn — draw', 'Take the stock or the top discard');
    p.innerHTML = '<div class="row"><button class="panel-btn go" id="gnS">Draw from stock</button><button class="panel-btn rm-take" id="gnD">Take <span></span></button></div>';
    if (g.top) p.querySelector('.rm-take span').appendChild(cardEl(g.top));
    $('#gnS').onclick = () => c.send({ type: 'draw', from: 'stock' });
    $('#gnD').onclick = () => c.send({ type: 'draw', from: 'discard' });
  } else {
    setStatus('Discard one', sel ? `Deadwood after: ${after}${after === 0 ? ' — GIN!' : after <= 10 ? ' — you can knock' : ''}` : 'Tap the card to throw away');
    const ok = sel && sel !== g.took;
    p.innerHTML = `<div class="row"><button class="panel-btn" id="gnX" ${ok ? '' : 'disabled'}>Discard</button><button class="panel-btn go" id="gnK" ${ok && after <= 10 ? '' : 'disabled'}>${after === 0 ? 'Gin!' : 'Knock'}</button></div>`;
    $('#gnX').onclick = () => { flyCard(sel); c.send({ type: 'discard', card: sel }); sel = null; };
    $('#gnK').onclick = () => { c.send({ type: 'discard', card: sel, knock: true }); sel = null; };
  }
  renderHand(ordered, {
    selected: sel,
    onTap: card => { if (!(mine && g.phase === 'discard')) return; sel = sel === card ? null : card; render(c); },
    hint: g.melds.length ? `Melds: ${g.melds.map(m => m.map(x => x[0] === 'T' ? '10' : x[0]).join('')).join(' · ')}` : '',
  });
}
