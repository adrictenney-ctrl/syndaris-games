// Line Up 5 on a phone: tap a card in your hand — its open spaces glow on the board — then tap
// one. Jacks: two-eyed (♣ ♦) go anywhere, one-eyed (♠ ♥) remove a chip. Dead cards can be traded.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { boardHTML } from './table-lineup5.js?v=68';
import { TEAM_COLOR, TEAM_NAME, BOARD, isTwoEye, isOneEye } from './lineup5.js?v=68';

let ctx = null, sel = null, wasMyTurn = false;
export function reset() { sel = null; document.getElementById('l5Phone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const spaces = (g, card) => isTwoEye(card) ? g.chips.map((c, i) => (c == null && BOARD[i] !== '*' ? i : -1)).filter(i => i >= 0)
  : isOneEye(card) ? g.chips.map((c, i) => (c != null && c !== g.team[ctx.st.you] && g.locked[i] == null ? i : -1)).filter(i => i >= 0)
  : BOARD.map((b, i) => (b === card && g.chips[i] == null ? i : -1)).filter(i => i >= 0);

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, t = g.team[you];
  const mine = g.phase === 'play' && g.turn === you;
  if (!mine || !g.hand.includes(sel)) sel = null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · <span style="color:${TEAM_COLOR[t]}">● ${TEAM_NAME[t]}</span>`;
  setHud('#hudL', 'Your lines', `${g.lines[t]}/${g.need}`);
  const other = [...Array(g.nTeams).keys()].filter(x => x !== t).sort((a, b) => g.lines[b] - g.lines[a])[0];
  setHud('#hudR', TEAM_NAME[other], `${g.lines[other]}/${g.need}`);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('l5Phone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'l5Phone';
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (!b || sel == null) return;
      const i = Number(b.dataset.i);
      if (!spaces(ctx.st.game, sel).includes(i)) return;
      ctx.send({ type: 'play', card: sel, i });
      sel = null;
      navigator.vibrate?.(15);
    });
    $('#status').after(el);
  }
  const ok = sel ? spaces(g, sel) : [];
  el.innerHTML = boardHTML(g, { ok, tap: mine });
  const isDead = sel && !isTwoEye(sel) && !isOneEye(sel) && !ok.length;
  $('#panel').innerHTML = isDead && !g.traded ? '<button class="panel-btn go wide" id="l5Trade">Trade in this dead card</button>' : '';
  $('#l5Trade')?.addEventListener('click', () => { c.send({ type: 'trade', card: sel }); sel = null; });
  if (g.phase === 'over') setStatus(g.winner === t ? '🏆 Your team wins!' : g.winner == null ? 'A draw' : `${TEAM_NAME[g.winner]} wins`, 'Look at the table to play again');
  else if (mine) setStatus('Your turn', sel ? (isTwoEye(sel) ? 'Two-eyed Jack: put a chip anywhere' : isOneEye(sel) ? 'One-eyed Jack: remove an opponent’s chip' : isDead ? 'Both spaces are taken — trade it in' : 'Tap a glowing space') : 'Tap a card in your hand');
  else setStatus(`${c.nameOf(g.turn)}'s turn`, '');
  renderHand(g.hand, { selected: sel, onTap: card => { if (!mine) return; sel = sel === card ? null : card; render(ctx); }, hint: mine ? 'Jacks: ♣♦ wild · ♠♥ remove' : '' });
}
