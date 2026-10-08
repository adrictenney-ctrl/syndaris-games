// Seed Stones on a phone: the board turned so your pits are along the bottom. Tap a pit to sow.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=58';
import { boardHTML } from './table-seedstones.js?v=58';
import { STORE } from './seedstones.js?v=58';

let ctx = null, wasMyTurn = false;
export function reset() { document.getElementById('ssPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)} · ${c.st.you === 0 ? 'bottom row on the table' : 'top row on the table'}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} vs ${c.nameOf(opp)}`;
  setHud('#hudL', 'Your store', g.pits[STORE[you]]);
  $('#hudC').innerHTML = g.bestOf > 1 ? `<span>Games</span><b>${g.wins[you]}–${g.wins[opp]}</b>` : '';
  setHud('#hudR', c.nameOf(opp), g.pits[STORE[opp]]);
  const mine = g.phase === 'play' && g.p === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  if (g.phase === 'over') setStatus(g.champion === you ? '🏆 You win!' : g.champion == null ? 'A draw' : `${c.nameOf(opp)} wins`, 'Look at the table to play again');
  else if (g.phase === 'between') setStatus(g.result.winner === you ? 'You win this one!' : g.result.winner == null ? 'A draw' : `${c.nameOf(opp)} takes it`, 'Next game in a moment');
  else setStatus(mine ? 'Your move' : `${c.nameOf(opp)} is sowing…`, mine ? 'Tap one of your pits (bottom row)' : '');

  let el = document.getElementById('ssPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ssPhone';
    el.className = 'ss-board';
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      const cur = ctx.st.game;
      if (!b || cur.phase !== 'play' || cur.p !== ctx.st.you) return;
      ctx.send({ type: 'sow', i: Number(b.dataset.i) });
      navigator.vibrate?.(15);
    });
    $('#status').after(el);
  }
  el.innerHTML = boardHTML(g, you, mine);
  $('#panel').innerHTML = mine ? '<button class="panel-btn" id="ssResign">Resign this game</button>' : '';
  $('#ssResign')?.addEventListener('click', () => ctx.send({ type: 'resign' }));
  renderHand([]);
}
