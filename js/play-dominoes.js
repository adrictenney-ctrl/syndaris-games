// Dominoes on a phone: your tiles; the ones that fit are bright. Tap one to play it (pick the
// end if it fits both), or draw from the boneyard / pass when you can't.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=67';
import { domino } from './table-dominoes.js?v=67';
import { TILES } from './dominoes.js?v=67';

let ctx = null, sel = null, wasMyTurn = false;
export function reset() { sel = null; document.getElementById('doPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const sidesFor = (g, t) => { if (!g.ends) return ['L']; const [a, b] = TILES[t], o = []; if (a === g.ends[0] || b === g.ends[0]) o.push('L'); if (a === g.ends[1] || b === g.ends[1]) o.push('R'); return o; };

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const mine = g.phase === 'play' && g.turn === you;
  if (!mine || !g.playable.includes(sel)) sel = null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Tiles', g.hand.length);
  $('#hudC').innerHTML = g.ends ? `<span>Ends</span><b>${g.ends[0]} · ${g.ends[1]}</b>` : '';
  setHud('#hudR', g.target ? 'Points' : 'Boneyard', g.target ? g.scores[you] : g.bone);
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('doPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'doPhone';
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-t]');
      const st = ctx.st.game;
      if (t) {
        const id = Number(t.dataset.t);
        if (!st.playable.includes(id)) return;
        const sides = sidesFor(st, id);
        if (sides.length === 1 || (st.ends && st.ends[0] === st.ends[1])) { ctx.send({ type: 'play', t: id, side: sides[0] }); sel = null; navigator.vibrate?.(15); }
        else { sel = id; render(ctx); }
        return;
      }
      const s = e.target.closest('[data-side]');
      if (s && sel != null) { ctx.send({ type: 'play', t: sel, side: s.dataset.side }); sel = null; }
    });
    $('#status').after(el);
  }
  const choose = sel != null ? `<div class="row"><button class="panel-btn go" data-side="L">◀ Left end (${g.ends[0]})</button><button class="panel-btn go" data-side="R">Right end (${g.ends[1]}) ▶</button></div>` : '';
  el.innerHTML = `${choose}<div class="do-hand">${g.hand.map(t => `<button data-t="${t}" class="${g.playable.includes(t) ? 'ok' : mine ? 'dim' : ''} ${sel === t ? 'sel' : ''}">${domino(TILES[t][0], TILES[t][1], { vertical: true })}</button>`).join('')}</div>`;
  const p = $('#panel');
  p.innerHTML = mine && !g.playable.length ? `<button class="panel-btn go wide" id="doDraw">${g.bone ? `Draw from the boneyard (${g.bone})` : 'Pass'}</button>` : '';
  $('#doDraw')?.addEventListener('click', () => c.send({ type: g.bone ? 'draw' : 'pass' }));
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (g.phase === 'handEnd') setStatus(g.result.winner === you ? `You score ${g.result.pts}!` : 'Hand over', '');
  else if (mine) setStatus(g.playable.length ? 'Your turn' : 'Nothing fits', g.playable.length ? (g.ends ? `Match ${g.ends[0]} or ${g.ends[1]}` : 'Play your highest double') : g.bone ? 'Draw until you can play' : 'Boneyard empty — pass');
  else setStatus(`${c.nameOf(g.turn)}'s turn`, g.ends ? `Ends: ${g.ends[0]} and ${g.ends[1]}` : '');
  renderHand([]);
}
