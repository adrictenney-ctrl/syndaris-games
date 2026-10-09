// Star Jump on a phone: the star turned so your point is at the bottom. Tap one of your marbles,
// then one of the glowing holes it can reach (steps or chains of jumps).
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=67';
import { starSVG } from './table-starjump.js?v=67';
import { reach, ARMS, opposite } from './starjump.js?v=67';

let ctx = null, sel = null, wasMyTurn = false;
export function reset() { sel = null; document.getElementById('sjPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const mine = g.phase === 'play' && g.turn === you;
  if (!mine || g.board[sel] !== you) sel = null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const home = s => ARMS[opposite(s)].filter(i => g.board[i] === s).length;
  setHud('#hudL', 'Home', `${home(you)}/10`);
  const lead = g.order.filter(s => s !== you).sort((a, b) => home(b) - home(a))[0];
  setHud('#hudR', c.nameOf(lead), `${home(lead)}/10`);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('sjPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sjPhone';
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-i]');
      const cur = ctx.st.game;
      if (!t || !(cur.phase === 'play' && cur.turn === ctx.st.you)) return;
      const i = Number(t.dataset.i);
      if (cur.board[i] === ctx.st.you) { sel = sel === i ? null : i; return render(ctx); }
      if (sel != null && reach(cur.board, sel).has(i)) { ctx.send({ type: 'move', from: sel, to: i }); sel = null; navigator.vibrate?.(12); }
    });
    $('#status').after(el);
  }
  const ok = sel != null ? [...reach(g.board, sel).keys()] : [];
  el.innerHTML = starSVG(g, { sel, ok, tap: true });
  // Turn the star so your own point faces you.
  el.firstElementChild.style.transform = `rotate(${-you * 60}deg)`;
  if (g.phase === 'over') setStatus(g.winner === you ? '🌟 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else setStatus(mine ? 'Your move' : `${c.nameOf(g.turn)}'s move`, mine ? (sel == null ? 'Tap one of your marbles' : 'Tap a glowing hole') : '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
