// Tessera on a phone: choose the top or bottom tile of your deck, turn it, and tap one of the
// glowing spots on the mosaic to try it there — then Place. Spots only show where it fits.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=57';
import * as T from './tessera.js?v=57';
import { boardSVG, tilePreview } from './table-tessera.js?v=57';

let ctx = null, pick = 0, rot = 0, spot = null, lastMove = -1, wasMyTurn = false;

export function reset() { pick = 0; rot = 0; spot = null; document.getElementById('tsPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('tsPhone');
  if (!e) { e = document.createElement('div'); e.id = 'tsPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-spot], [data-pick], [data-x]');
  if (!t || g.turn !== you || g.phase !== 'play') return;
  if (t.dataset.pick != null) { pick = Number(t.dataset.pick); spot = null; return render(ctx); }
  if (t.dataset.spot) { spot = t.dataset.spot; return render(ctx); }
  const x = t.dataset.x;
  if (x === 'rotl') { rot = (rot + 3) % 4; spot = null; return render(ctx); }
  if (x === 'rotr') { rot = (rot + 1) % 4; spot = null; return render(ctx); }
  if (x === 'place' && spot) {
    const [sx, sy] = spot.split(',').map(Number);
    ctx.send({ type: 'place', tile: g.choices[pick], rot, x: sx, y: sy });
    spot = null; navigator.vibrate?.(15);
  }
  if (x === 'pass') ctx.send({ type: 'pass' });
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (g.moveId !== lastMove) { lastMove = g.moveId; spot = null; if (pick >= g.choices.length) pick = 0; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Gems showing', g.gems[you]);
  $('#hudC').innerHTML = `<span>Tiles left</span><b>${g.left[you]}</b>`;
  const best = g.order.filter(s => s !== you).sort((a, b) => g.gems[b] - g.gems[a])[0];
  if (best != null) setHud('#hudR', c.nameOf(best), g.gems[best]);

  const mine = g.phase === 'play' && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  const tile = g.choices[pick];
  const legal = mine && tile != null ? (g.legal[tile] || []).filter(p => p.rot === rot) : [];
  const anyFit = mine && g.choices.some(t => (g.legal[t] || []).length);
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 Most gems showing!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, 'Look at the table to play again');
  else if (!mine) setStatus(`${c.nameOf(g.turn)} is placing a tile`, g.left[you] ? 'Plan your next move' : 'Your deck is empty');
  else if (!anyFit) setStatus('Nothing fits', 'Your top tile is discarded');
  else if (spot) setStatus('Like this?', 'Tap Place — or another spot');
  else setStatus('Your turn', legal.length ? `${legal.length} spot${legal.length > 1 ? 's' : ''} fit this way · tap one` : 'Doesn\'t fit this way — turn it or try the other tile');

  let ghost = null;
  if (spot && tile != null) { const [sx, sy] = spot.split(',').map(Number); ghost = { tile, rot, x: sx, y: sy }; }
  const dots = legal.map(p => ({ x: p.x + 1, y: p.y + 1, key: `${p.x},${p.y}`, on: spot === `${p.x},${p.y}` }));
  const choice = mine || g.choices.length ? `<div class="ts-choices">${g.choices.map((t, i) => `<button data-pick="${i}" class="${i === pick ? 'on' : ''}">${tilePreview(g.tiles[t], i === pick ? rot : 0)}<small>${i ? 'Bottom' : 'Top'}</small></button>`).join('')}
      ${mine ? `<div class="ts-rot"><button class="panel-btn" data-x="rotl">⟲</button><button class="panel-btn" data-x="rotr">⟳</button></div>` : ''}</div>` : '';
  const actions = mine ? (anyFit ? `<div class="row"><button class="panel-btn go" data-x="place" ${spot ? '' : 'disabled'}>Place tile</button></div>` : `<div class="row"><button class="panel-btn" data-x="pass">Discard and pass</button></div>`) : '';
  el().innerHTML = `<div class="ts-wrap">${boardSVG(g, { ghost, dots, glowLast: !mine })}</div>${choice}${actions}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
