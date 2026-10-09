// The race-home games on a phone: Roll, then tap one of your glowing pieces on the board to move
// it. In Marble Rush, landing on a ⚡ corner asks whether to take the shortcut.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { boardSVG } from './table-ludo.js?v=68';
import { dieHTML } from './table-yacht.js?v=68';
import { moves, dest, startOf } from './racehome.js?v=68';

let ctx = null, wasMyTurn = false, ask = null;
export function reset() { ask = null; document.getElementById('rhPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const mine = (g.phase === 'roll' || g.phase === 'move') && g.turn === you;
  if (!(mine && g.phase === 'move')) ask = null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const goal = g.R.track + g.R.home - 1;
  setHud('#hudL', 'Home', `${g.pieces[you].filter(p => p === goal).length}/4`);
  $('#hudC').innerHTML = g.die && g.turn === you ? `<span>Rolled</span><b>${g.die}</b>` : '';
  setHud('#hudR', null);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  const mv = mine && g.phase === 'move' ? moves(g, you, g.die) : [];
  let el = document.getElementById('rhPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rhPhone';
    el.addEventListener('click', e => {
      const st = ctx.st.game;
      if (e.target.closest('#rhRoll')) { ctx.send({ type: 'roll' }); navigator.vibrate?.(25); return; }
      const sc = e.target.closest('[data-sc]');
      if (sc && ask != null) { ctx.send({ type: 'move', i: ask, shortcut: sc.dataset.sc || undefined }); ask = null; return; }
      const p = e.target.closest('[data-i]');
      if (!p) return;
      const i = Number(p.dataset.i);
      // Marble Rush: offer the shortcut when the piece would land on a corner.
      if (st.R.corners) {
        let to = dest(st, ctx.st.you, i, st.die);
        if (to?.fromHub) to = to.to;
        const A = typeof to === 'number' && to < st.R.track ? (startOf(st, ctx.st.you) + to) % st.R.track : null;
        if (A != null && st.R.corners.includes(A)) { ask = i; return render(ctx); }
      }
      ctx.send({ type: 'move', i });
      navigator.vibrate?.(15);
    });
    $('#status').after(el);
  }
  el.innerHTML = `${boardSVG(g, { movable: mv, you })}
    ${ask != null ? '<div class="row"><button class="panel-btn go" data-sc="corner">⚡ Hop to the next corner</button><button class="panel-btn" data-sc="hub">🌀 Into the hub</button><button class="panel-btn" data-sc="">Stay</button></div>' : ''}
    ${mine && g.phase === 'roll' ? '<button id="rhRoll" class="panel-btn go wide">🎲 Roll</button>' : g.die ? `<div class="rh-die">${dieHTML(g.die)}</div>` : ''}`;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (mine && g.phase === 'move') setStatus(`You rolled ${g.die}`, 'Tap a glowing piece');
  else if (mine) setStatus('Your turn', 'Roll the die');
  else setStatus(`${c.nameOf(g.turn)}'s turn`, g.phase === 'nomove' ? `Rolled ${g.die} — no move` : '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
