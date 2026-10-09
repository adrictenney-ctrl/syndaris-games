// Reversi on a phone: the board — tap a glowing square on your turn.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=67';
import { disc, boardHTML } from './table-reversi.js?v=67';

let ctx = null, wasMyTurn = false;
export function reset() { document.getElementById('rvPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `${disc(c.st.you, 'small')} ${c.nameOf(c.st.you)} · ${c.st.you === 0 ? 'dark' : 'light'}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  $('#whoami').innerHTML = `${disc(you, 'small')} ${c.nameOf(you)} vs ${c.nameOf(opp)}`;
  const n = w => g.board.filter(x => x === w).length;
  setHud('#hudL', 'You', n(you), 'discs');
  $('#hudC').innerHTML = g.bestOf > 1 ? `<span>Games</span><b>${g.wins[you]}–${g.wins[opp]}</b>` : '';
  setHud('#hudR', c.nameOf(opp), n(opp), 'discs');
  const mine = g.phase === 'play' && g.p === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  if (g.phase === 'over') setStatus(g.champion === you ? '🏆 You win!' : g.champion == null ? 'A draw' : `${c.nameOf(opp)} wins`, 'Look at the table to play again');
  else if (g.phase === 'between') setStatus(g.result.winner === you ? 'You win this one!' : g.result.winner == null ? 'A draw' : `${c.nameOf(opp)} takes it`, 'Next game in a moment');
  else setStatus(mine ? 'Your move' : `${c.nameOf(opp)} is thinking…`, mine ? 'Tap a glowing square' : g.passed && g.p === you ? `${c.nameOf(opp)} had to pass` : '');
  let el = document.getElementById('rvPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rvPhone';
    el.className = 'rv-board';
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      const cur = ctx.st.game;
      if (!b || cur.phase !== 'play' || cur.p !== ctx.st.you || !b.classList.contains('ok')) return;
      ctx.send({ type: 'move', i: Number(b.dataset.i) });
      navigator.vibrate?.(12);
    });
    $('#status').after(el);
  }
  el.innerHTML = boardHTML(g, mine);
  $('#panel').innerHTML = mine ? '<button class="panel-btn" id="rvResign">Resign this game</button>' : '';
  $('#rvResign')?.addEventListener('click', () => ctx.send({ type: 'resign' }));
  renderHand([]);
}
