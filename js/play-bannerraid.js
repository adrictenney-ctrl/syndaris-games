// Banner Raid on a phone: your side of the field (always at the bottom). During setup tap two
// of your pieces to swap them, or Shuffle; then Ready. In play tap a piece, then a glowing
// square.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=64';
import * as B from './bannerraid.js?v=64';
import { fieldHTML, battleHTML } from './table-bannerraid.js?v=64';

let ctx = null, sel = null, wasMyTurn = false, lastMove = -1;

export function reset() { sel = null; document.getElementById('brPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('brPhone');
  if (!e) { e = document.createElement('div'); e.id = 'brPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game;
  const t = ev.target.closest('[data-sq], [data-x]');
  if (!t) return;
  if (t.dataset.x) { ctx.send({ type: t.dataset.x }); sel = null; return; }
  const sq = Number(t.dataset.sq), pc = g.board[sq];
  if (g.phase === 'setup') {
    if (g.ready[g.me] || !pc || pc.o !== g.me) return;
    if (sel == null) { sel = sq; return render(ctx); }
    if (sel !== sq) ctx.send({ type: 'swap', a: sel, b: sq });
    sel = null;
    return render(ctx);
  }
  if (g.turnP !== g.me) return;
  if (pc && pc.o === g.me) { sel = sel === sq ? null : sq; return render(ctx); }
  if (sel != null && g.moves.some(m => m.from === sel && m.to === sq)) {
    ctx.send({ type: 'move', from: sel, to: sq });
    sel = null;
    navigator.vibrate?.(15);
  }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, me = g.me;
  if (g.moveId !== lastMove) { lastMove = g.moveId; if (g.phase === 'play' && sel != null && !g.moves.some(m => m.from === sel)) sel = null; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const left = p => g.board.filter(x => x && x.o === p).length;
  setHud('#hudL', 'Your pieces', left(me));
  setHud('#hudR', c.nameOf(g.order[1 - me]), left(1 - me));
  $('#hudC').innerHTML = `<span>You are</span><b class="br-side o${me}">${me ? 'Indigo' : 'Oxblood'}</b>`;
  const mine = (g.phase === 'setup' && !g.ready[me]) || (g.phase === 'play' && g.turnP === me);
  document.body.classList.toggle('myturn', mine);
  if (g.phase === 'play' && mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  let actions = '';
  if (g.phase === 'over') setStatus(g.how === 'draw' ? 'A draw' : g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, g.how === 'banner' ? 'The Banner was captured' : g.how === 'stuck' ? 'No moves left' : '');
  else if (g.phase === 'setup') {
    if (g.ready[me]) { setStatus('Ready ⚑', 'Waiting for the other side'); actions = '<div class="row"><button class="panel-btn" data-x="unready">Change my setup</button></div>'; }
    else {
      setStatus('Set up your side', sel != null ? 'Now tap the piece to swap it with' : 'Tap two pieces to swap them');
      actions = '<div class="row"><button class="panel-btn" data-x="shuffle">🔀 Shuffle</button><button class="panel-btn go" data-x="ready">Ready</button></div>';
    }
  } else if (g.turnP === me) setStatus('Your move', sel != null ? 'Tap a glowing square' : 'Tap one of your pieces');
  else setStatus(`${c.nameOf(g.order[g.turnP])} is moving`, 'Your pieces are hidden from them');
  const dots = new Set(sel != null && g.phase === 'play' ? g.moves.filter(m => m.from === sel).map(m => m.to) : []);
  const zone = g.phase === 'setup' ? new Set(B.zone(me)) : null;
  const fight = g.battle && g.battle.id >= g.moveId - 1 ? battleHTML(g.battle) : '';
  el().innerHTML = `${fight ? `<div class="br-pfight">${fight}</div>` : ''}<div class="br-wrap">${fieldHTML(g, { flip: me === 1, sel, dots, tap: true, zone })}</div>${actions}
    <div class="br-legend">${B.ORDER.map(r => `<span><b>${{ 10: 'X', M: '✸', B: '⚑' }[r] || r}</b>${B.RANKS[r].name}</span>`).join('')}</div>`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
