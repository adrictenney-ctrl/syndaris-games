// Low Tide on a player's phone: your 3×4 grid, big enough to tap. On your turn, tap the deck
// to draw or the discard to take it; then tap a card in your grid to swap it in — or, for a
// card off the deck, throw it away and turn one of your hidden cards up.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=67';
import { ROWS, COLS, visibleSum } from './lowtide.js?v=67';
import { tideCard } from './table-lowtide.js?v=67';

let ctx = null, wasMyTurn = false;

export function reset() { document.getElementById('ltPhone')?.remove(); }

export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  document.getElementById('ltPhone')?.remove();
}

function el() {
  let e = document.getElementById('ltPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'ltPhone';
    e.addEventListener('click', onClick);
    $('#status').after(e);
  }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-x], [data-i]');
  if (!t) return;
  const mine = g.phase === 'play' && g.turn === you;
  if (t.dataset.x === 'draw' && mine && !g.holding && !g.mustFlip) return send({ type: 'draw' });
  if (t.dataset.x === 'take' && mine && !g.holding && !g.mustFlip && g.top != null) return send({ type: 'take' });
  if (t.dataset.x === 'toss' && mine && g.holding?.from === 'deck') return send({ type: 'toss' });
  if (t.dataset.i == null) return;
  const i = Number(t.dataset.i), cell = g.mine[i];
  if (!cell) return;
  if (g.phase === 'setup' && !cell.up && g.flips < 2) return send({ type: 'flip', i });
  if (!mine) return;
  if (g.holding) return send({ type: 'swap', i });
  if (g.mustFlip && !cell.up) return send({ type: 'flip', i });
}
const send = a => { ctx.send(a); navigator.vibrate?.(12); };

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Total', g.totals[you], `ends at ${g.target}`);
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b>`;
  setHud('#hudR', 'Showing', visibleSum(g.mine));

  const mine = g.phase === 'play' && g.turn === you;
  const act = mine || (g.phase === 'setup' && g.flips < 2);
  document.body.classList.toggle('myturn', act);
  if (act && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = act;

  if (g.phase === 'setup') setStatus(g.flips < 2 ? `Turn up ${2 - g.flips} card${g.flips === 1 ? '' : 's'}` : 'Waiting for the others', 'Tap any face-down card');
  else if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 Lowest score — you win!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, 'Look at the table to play again');
  else if (g.phase === 'roundOver') setStatus(`Round over · +${g.result.pts[you]}${g.result.doubled && g.result.closer === you ? ' (doubled)' : ''}`, 'Next round in a moment');
  else if (!mine) setStatus(`${c.nameOf(g.turn)}'s turn`, g.lastTurns ? (g.lastTurns.includes(you) ? 'You get one last turn' : '') : 'Lower is better');
  else if (g.mustFlip) setStatus('Turn a card up', 'Tap one of your face-down cards');
  else if (g.holding) setStatus(g.holding.from === 'deck' ? `You drew a ${g.holding.v}` : `You took the ${g.holding.v}`, g.holding.from === 'deck' ? 'Tap a card to swap it — or throw it away' : 'Tap a card in your grid to swap it');
  else setStatus(g.lastTurns ? 'Your last turn!' : 'Your turn', 'Draw from the deck or take the discard');

  const canPick = mine && !g.holding && !g.mustFlip;
  let grid = '';
  for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
    const i = col * ROWS + r, cell = g.mine[i];
    const tap = cell && ((g.phase === 'setup' && !cell.up && g.flips < 2) || (mine && g.holding) || (mine && g.mustFlip && !cell.up));
    grid += `<div class="lt-slot${tap ? ' tap' : ''}" data-i="${i}">${tideCard(cell)}</div>`;
  }
  el().innerHTML = `
    <div class="lt-piles">
      <button class="lt-pile${canPick ? ' tap' : ''}" data-x="draw" ${canPick ? '' : 'disabled'}><div class="lt-card back"><i></i></div><small>Deck</small></button>
      ${g.holding && mine ? `<div class="lt-held">${tideCard({ v: g.holding.v, up: true })}<small>In hand</small></div>` : ''}
      <button class="lt-pile${canPick && g.top != null ? ' tap' : ''}" data-x="take" ${canPick && g.top != null ? '' : 'disabled'}>${g.top != null ? tideCard({ v: g.top, up: true }) : '<div class="lt-card gone"></div>'}<small>Discard</small></button>
    </div>
    ${mine && g.holding?.from === 'deck' ? '<button class="panel-btn wide lt-toss" data-x="toss">Throw it away · then turn a card up</button>' : ''}
    <div class="lt-mygrid">${grid}</div>`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
