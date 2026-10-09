// Pardon Me! on a phone: Draw a card, then pick one of the moves it allows (pawns are numbered
// 1–4 on the board).
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { boardSVG } from './table-ludo.js?v=66';
import { pmCard, optText } from './table-pardon.js?v=66';
import { SLIDES } from './pardon.js?v=66';

let ctx = null, wasMyTurn = false;
export function reset() { document.getElementById('pmPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const mine = (g.phase === 'draw' || g.phase === 'move') && g.turn === you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const goal = g.R.track + g.R.home - 1;
  setHud('#hudL', 'Home', `${g.pieces[you].filter(p => p === goal).length}/4`);
  setHud('#hudR', null); $('#hudC').innerHTML = '';
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('pmPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pmPhone';
    el.addEventListener('click', e => {
      if (e.target.closest('#pmDraw')) { ctx.send({ type: 'draw' }); navigator.vibrate?.(20); return; }
      const o = e.target.closest('[data-k]');
      if (o) { ctx.send({ type: 'play', k: Number(o.dataset.k) }); navigator.vibrate?.(15); }
    });
    $('#status').after(el);
  }
  el.innerHTML = `${boardSVG({ ...g, R: { ...g.R, slides: SLIDES } }, { numbers: you })}
    <div class="pm-row">${g.card != null && g.turn === you ? pmCard(g.card) : ''}<div class="pm-opts">${mine && g.phase === 'draw' ? '<button id="pmDraw" class="panel-btn go">Draw a card</button>' : mine ? g.opts.map((o, k) => `<button class="panel-btn" data-k="${k}">${optText(g, you, o, c.nameOf)}</button>`).join('') : ''}</div></div>`;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (mine) setStatus('Your turn', g.phase === 'draw' ? 'Draw a card' : 'Pick a move');
  else setStatus(`${c.nameOf(g.turn)}'s turn`, g.phase === 'nomove' ? 'No move with that card' : '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
