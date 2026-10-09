// Trio on a phone: the same board — tap a square on your turn.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { mark } from './table-trio.js?v=66';

let ctx = null, wasMyTurn = false;
export function reset() { document.getElementById('trPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `${mark(c.st.you, 'small')} ${c.nameOf(c.st.you)} · ${c.st.you === 0 ? 'gold rings' : 'ivory diamonds'}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  $('#whoami').innerHTML = `${mark(you, 'small')} ${c.nameOf(you)} vs ${c.nameOf(opp)}`;
  setHud('#hudL', 'You', g.wins[you]);
  $('#hudC').innerHTML = g.bestOf > 1 ? `<span>Game</span><b>${g.gameNo + 1}</b><em class="of">best of ${g.bestOf}</em>` : '';
  setHud('#hudR', c.nameOf(opp), g.wins[opp]);
  const mine = g.phase === 'play' && g.p === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  if (g.phase === 'over') setStatus(g.champion === you ? '🏆 You win the match!' : g.champion == null ? 'A drawn match' : `${c.nameOf(opp)} wins the match`, 'Look at the table to play again');
  else if (g.phase === 'between') setStatus(g.result.winner === you ? 'You win this one!' : g.result.winner == null ? 'A draw' : `${c.nameOf(opp)} takes it`, 'Next game in a moment');
  else setStatus(mine ? 'Your move' : `${c.nameOf(opp)} is thinking…`, mine ? 'Tap a square' : '');

  let el = document.getElementById('trPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'trPhone';
    el.className = 'tr-board';
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      const cur = ctx.st.game;
      if (!b || cur.phase !== 'play' || cur.p !== ctx.st.you) return;
      ctx.send({ type: 'move', i: Number(b.dataset.i) });
      navigator.vibrate?.(12);
    });
    $('#status').after(el);
  }
  el.innerHTML = g.board.map((x, i) => `<button class="tr-cell${g.line?.includes(i) ? ' win' : ''}" data-i="${i}" ${x != null || !mine ? 'disabled' : ''}>${mark(x)}</button>`).join('');
  $('#panel').innerHTML = mine ? '<button class="panel-btn" id="trResign">Resign this game</button>' : '';
  $('#trResign')?.addEventListener('click', () => ctx.send({ type: 'resign' }));
  renderHand([]);
}
