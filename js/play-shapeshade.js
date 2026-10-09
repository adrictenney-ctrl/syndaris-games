// Shape & Shade on a phone: tap a tile in your hand, then a glowing square on the board; repeat
// for more tiles in the same line, then Play. Or tick tiles and Swap them with the bag.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { qTile, boardHTML } from './table-shapeshade.js?v=68';
import { checkMove, spots } from './shapeshade.js?v=68';

let ctx = null, sel = null, staged = [], swapMode = false, swapSel = [], wasMyTurn = false, lastMove = -1;
export function reset() { sel = null; staged = []; swapSel = []; swapMode = false; document.getElementById('qsPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (g.moveId !== lastMove) { lastMove = g.moveId; staged = []; sel = null; swapSel = []; swapMode = false; }
  const mine = g.phase === 'play' && g.turn === you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Points', g.scores[you]);
  $('#hudC').innerHTML = `<span>Bag</span><b>${g.bag}</b>`;
  const lead = g.order.filter(s => s !== you).sort((a, b) => g.scores[b] - g.scores[a])[0];
  setHud('#hudR', c.nameOf(lead), g.scores[lead]);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('qsPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'qsPhone';
    el.addEventListener('click', e => {
      const st = ctx.st.game;
      if (!(st.phase === 'play' && st.turn === ctx.st.you)) return;
      const t = e.target.closest('[data-t]');
      if (t) { const id = Number(t.dataset.t); if (swapMode) swapSel = swapSel.includes(id) ? swapSel.filter(x => x !== id) : [...swapSel, id]; else sel = sel === id ? null : id; return render(ctx); }
      const sp = e.target.closest('.qs-spot');
      if (sp) { if (sel == null) return toast('Tap a tile in your hand first'); staged.push({ x: Number(sp.dataset.x), y: Number(sp.dataset.y), t: sel }); sel = null; return render(ctx); }
      const b = e.target.closest('[data-do]');
      if (!b) return;
      const d = b.dataset.do;
      if (d === 'play') ctx.send({ type: 'place', places: staged });
      if (d === 'undo') { staged.pop(); render(ctx); }
      if (d === 'swap') { swapMode = !swapMode; swapSel = []; render(ctx); }
      if (d === 'doswap') ctx.send({ type: 'swap', ids: swapSel });
    });
    $('#status').after(el);
  }
  const hand = g.hand.filter(t => !staged.some(p => p.t === t));
  const board = { ...g.board };
  const sp = mine && !swapMode ? spots({ ...board, ...Object.fromEntries(staged.map(p => [`${p.x},${p.y}`, p.t])) }) : [];
  const res = staged.length ? checkMove(g.board, staged) : null;
  el.innerHTML = `<div class="qs-scroll">${boardHTML(g.board, { staged, spots: sp, last: g.last })}</div>
    <div class="qs-hand">${hand.map(t => `<button data-t="${t}" class="${sel === t || swapSel.includes(t) ? 'sel' : ''}">${qTile(t)}</button>`).join('')}</div>
    ${mine ? (swapMode ? `<div class="row"><button class="panel-btn" data-do="swap">Cancel</button><button class="panel-btn go" data-do="doswap" ${swapSel.length || !g.bag ? '' : 'disabled'}>${g.bag ? `Swap ${swapSel.length}` : 'Pass'}</button></div>`
      : `<div class="row"><button class="panel-btn" data-do="undo" ${staged.length ? '' : 'disabled'}>Undo</button><button class="panel-btn" data-do="swap">${g.bag ? 'Swap…' : 'Pass…'}</button><button class="panel-btn go" data-do="play" ${res && typeof res !== 'string' ? '' : 'disabled'}>Play${res && typeof res !== 'string' ? ` +${res.score}` : ''}</button></div>`) : ''}`;
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 You win!' : 'Game over', 'Look at the table to play again');
  else if (mine) setStatus('Your turn', swapMode ? 'Tick the tiles to swap' : typeof res === 'string' ? res : sel != null ? 'Now tap a glowing square' : 'Tap a tile, then a square');
  else setStatus(`${c.nameOf(g.turn)}'s turn`, '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
