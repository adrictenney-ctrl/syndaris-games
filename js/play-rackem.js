// Rack 'Em on a phone: your rack top to bottom (slot 1 at the top must be the lowest). Draw from
// the deck or take the discard, then tap the slot to swap it into — or throw it away.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=65';
import { rkCard } from './table-rackem.js?v=65';
import { runFromFront } from './rackem.js?v=65';

let wasMyTurn = false;
export function reset() { document.getElementById('rkPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  const g = c.st.game, you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Points', g.scores[you], `to ${g.target}`);
  $('#hudC').innerHTML = `<span>In order</span><b>${runFromFront(g.rack)}</b><em>of 10</em>`;
  const best = g.order.filter(s => s !== you).sort((a, b) => g.scores[b] - g.scores[a])[0];
  setHud('#hudR', c.nameOf(best), g.scores[best]);
  const mine = (g.phase === 'draw' || g.phase === 'place') && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  let el = document.getElementById('rkPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rkPhone';
    $('#status').after(el);
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-slot]');
      if (b) c.send({ type: 'place', slot: Number(b.dataset.slot) });
    });
  }
  const placing = mine && g.phase === 'place';
  const run = runFromFront(g.rack);
  el.innerHTML = `<div class="rk-rack">${g.rack.map((v, i) => `<button data-slot="${i}" ${placing ? '' : 'disabled'} class="${i < run ? 'ok' : ''}"><span>${i + 1}</span>${rkCard(v, g.max)}</button>`).join('')}</div>`;
  const p = $('#panel');
  if (g.phase === 'handEnd' || g.phase === 'over') { setStatus(g.result.winner === you ? "You racked it! +75" : `${c.nameOf(g.result.winner)} racked it`, `You score ${g.result.add[you]}`); p.innerHTML = ''; }
  else if (!mine) { setStatus(`${c.nameOf(g.turn)}'s turn`, 'Lowest at the top, highest at the bottom'); p.innerHTML = ''; }
  else if (g.phase === 'draw') {
    setStatus('Your turn', 'Draw from the deck, or take the discard');
    p.innerHTML = `<div class="row"><button class="panel-btn go" id="rkDeck">Draw from deck</button><button class="panel-btn rk-take" id="rkDis">Take ${rkCard(g.top, g.max)}</button></div>`;
    $('#rkDeck').onclick = () => c.send({ type: 'draw', from: 'deck' });
    $('#rkDis').onclick = () => c.send({ type: 'draw', from: 'discard' });
  } else {
    setStatus(`You drew ${g.drawn.v}`, 'Tap the slot to swap it into');
    p.innerHTML = `<div class="rk-held">${rkCard(g.drawn.v, g.max)}${g.drawn.from === 'deck' ? '<button class="panel-btn" id="rkToss">Throw it away</button>' : ''}</div>`;
    $('#rkToss')?.addEventListener('click', () => c.send({ type: 'place', slot: -1 }));
  }
  renderHand([]);
}
