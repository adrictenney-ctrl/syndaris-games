// Cornerstones on a phone: pick one of your pieces, turn or flip it, tap the board to put it
// there (a preview shows where it lands — grey means it can't go there), then Place.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { boardSVG, pieceSVG } from './table-cornerstones.js?v=66';
import { PIECES, COLOR, COLOR_NAME, shape, canPlace } from './cornerstones.js?v=66';

let ctx = null, piece = null, rot = 0, flip = false, pos = null, wasMyTurn = false;
export function reset() { piece = null; pos = null; document.getElementById('csPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
// Put the piece's middle cell on the tapped square.
function placeAt(cells, i) {
  const x = i % 20, y = Math.floor(i / 20);
  const mx = cells.reduce((a, c) => a + c[0], 0) / cells.length, my = cells.reduce((a, c) => a + c[1], 0) / cells.length;
  const mid = cells.slice().sort((a, b) => Math.hypot(a[0] - mx, a[1] - my) - Math.hypot(b[0] - mx, b[1] - my))[0];
  return [x - mid[0], y - mid[1]];
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const mine = g.phase === 'play' && g.turn === you;
  const ci = g.ci, left = g.left[ci];
  if (!mine || !left.includes(piece)) piece = null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const myCols = g.colors.map((col, i) => (g.owner[i] === you ? i : -1)).filter(i => i >= 0);
  setHud('#hudL', 'Squares left', myCols.reduce((t, k) => t + g.left[k].reduce((u, p) => u + PIECES[p].length, 0), 0));
  $('#hudC').innerHTML = mine ? `<span>Playing</span><b style="color:${COLOR[g.color]}">■ ${COLOR_NAME[g.color]}</b>` : '';
  setHud('#hudR', null);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('csPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'csPhone';
    el.addEventListener('click', e => {
      const st = ctx.st.game;
      const sq = e.target.closest('[data-i]');
      if (sq && piece != null) { pos = placeAt(shape(piece, rot, flip), Number(sq.dataset.i)); return render(ctx); }
      const pc = e.target.closest('[data-p]');
      if (pc) { piece = Number(pc.dataset.p); rot = 0; flip = false; pos = null; return render(ctx); }
      const b = e.target.closest('[data-do]');
      if (!b) return;
      if (b.dataset.do === 'rot') { rot = (rot + 1) % 4; }
      if (b.dataset.do === 'flip') { flip = !flip; }
      if (b.dataset.do === 'place') {
        if (piece == null || !pos) return toast('Pick a piece and tap the board');
        ctx.send({ type: 'place', piece, rot, flip, x: pos[0], y: pos[1] });
        piece = null; pos = null;
        return;
      }
      if (b.dataset.do === 'pass') return ctx.send({ type: 'pass' });
      render(ctx);
    });
    $('#status').after(el);
  }
  const cells = piece != null ? shape(piece, rot, flip) : null;
  const ghost = cells && pos ? cells.map(([x, y]) => [x + pos[0], y + pos[1]]) : null;
  const ok = ghost ? canPlace(g, g.color, cells, pos[0], pos[1]) : true;
  el.innerHTML = `${boardSVG(g, { ghost, ghostOk: ok, tap: mine })}
    ${mine ? `<div class="cs-tools"><button class="panel-btn" data-do="rot">↻ Turn</button><button class="panel-btn" data-do="flip">⇋ Flip</button><button class="panel-btn go" data-do="place" ${ghost && ok ? '' : 'disabled'}>Place</button></div>
    <div class="cs-tray">${left.map(p => `<button data-p="${p}" class="${p === piece ? 'sel' : ''}">${pieceSVG(p === piece ? cells : PIECES[p], COLOR[g.color])}</button>`).join('')}</div>
    <button class="panel-btn" data-do="pass">I can’t place anything</button>` : ''}`;
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 You win!' : 'Game over', 'Look at the table to play again');
  else if (mine) setStatus(`Place a ${COLOR_NAME[g.color]} piece`, piece == null ? 'Pick a piece below' : !pos ? 'Tap the board where it goes' : ok ? 'Looks good — Place it' : 'It can’t go there: touch your colour at a corner only');
  else setStatus(`${c.nameOf(g.turn)} is placing`, '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
