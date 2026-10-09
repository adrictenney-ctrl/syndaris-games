// Stack Up on a phone: the four build piles along the top, your stock and discard piles in the
// middle, your hand at the bottom. Tap a card (hand, stock or a discard top), then tap a build
// pile to play it. To end your turn, tap a hand card and then one of your discard piles.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=65';
import { suCard, buildCard } from './table-stackup.js?v=65';
import { fits, WILD } from './stackup.js?v=65';

let sel = null, wasMyTurn = false, ctx = null;
export function reset() { sel = null; document.getElementById('suPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
const same = (a, b) => a && b && a.from === b.from && a.i === b.i && a.d === b.d;

function valOf(g, src) {
  if (!src) return undefined;
  if (src.from === 'hand') return g.hand[src.i];
  if (src.from === 'stock') return g.stockTop.find(x => x[0] === ctx.st.you)?.[1];
  const d = g.discards[ctx.st.you][src.d];
  return d[d.length - 1];
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const mine = g.phase === 'play' && g.turn === you;
  if (!mine) sel = null;
  if (sel && valOf(g, sel) === undefined) sel = null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Stock', g.stockN[you]);
  $('#hudC').innerHTML = `<span>Draw pile</span><b>${g.deck}</b>`;
  const best = g.order.filter(s => s !== you).sort((a, b) => g.stockN[a] - g.stockN[b])[0];
  if (best != null) setHud('#hudR', c.nameOf(best), g.stockN[best], 'in stock');
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  const v = valOf(g, sel);
  let el = document.getElementById('suPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'suPhone';
    $('#status').after(el);
    el.addEventListener('click', onClick);
  }
  const top = g.stockTop.find(x => x[0] === you)?.[1];
  el.innerHTML = `<div class="su-row builds">${g.builds.map((p, b) => `<button data-b="${b}" class="${sel && v !== undefined && fits({ length: p.n }, v) ? 'ok' : ''}">${buildCard(p)}<small>${p.n ? `next ${p.n + 1}` : '1'}</small></button>`).join('')}</div>
    <div class="su-row mine"><button data-src="stock" class="${sel?.from === 'stock' ? 'sel' : ''}">${suCard(top ?? null)}<small>stock ${g.stockN[you]}</small></button>
    ${g.discards[you].map((d, k) => `<button data-d="${k}" class="pile ${sel?.from === 'discard' && sel.d === k ? 'sel' : ''} ${sel?.from === 'hand' ? 'drop' : ''}">${d.map(x => suCard(x)).join('') || suCard(null)}</button>`).join('')}</div>
    <div class="su-row hand">${g.hand.map((x, i) => `<button data-i="${i}" class="${sel?.from === 'hand' && sel.i === i ? 'sel' : ''}">${suCard(x)}</button>`).join('')}</div>`;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (!mine) setStatus(`${c.nameOf(g.turn)}'s turn`, `Get your stock down to zero · ${g.stockN[you]} to go`);
  else if (!sel) setStatus('Your turn', g.hand.length ? 'Tap a card, then a build pile · end by discarding a hand card' : 'Your hand is empty');
  else setStatus(v === WILD ? 'Wild star — any pile' : `Play the ${v}`, sel.from === 'hand' ? 'Tap a glowing build pile — or one of your discard piles to end your turn' : 'Tap a glowing build pile');
  $('#panel').innerHTML = mine && !g.hand.length ? '<button class="panel-btn go wide" id="suEnd">End my turn</button>' : '';
  $('#suEnd')?.addEventListener('click', () => c.send({ type: 'end' }));
  renderHand([]);
}

function onClick(ev) {
  const g = ctx.st.game;
  if (!(g.phase === 'play' && g.turn === ctx.st.you)) return;
  const t = ev.target.closest('button');
  if (!t) return;
  if (t.dataset.i != null) { const s = { from: 'hand', i: Number(t.dataset.i) }; sel = same(sel, s) ? null : s; return render(ctx); }
  if (t.dataset.src === 'stock') { const s = { from: 'stock' }; sel = same(sel, s) ? null : s; return render(ctx); }
  if (t.dataset.d != null) {
    const d = Number(t.dataset.d);
    if (sel?.from === 'hand') { ctx.send({ type: 'discard', d, i: sel.i }); sel = null; navigator.vibrate?.(15); return; }
    const s = { from: 'discard', d };
    sel = same(sel, s) ? null : s;
    return render(ctx);
  }
  if (t.dataset.b != null) {
    if (!sel) return toast('Tap a card first');
    const b = Number(t.dataset.b), p = g.builds[b];
    if (!fits({ length: p.n }, valOf(g, sel))) return toast(`That pile needs a ${p.n + 1}`);
    ctx.send({ type: 'build', b, src: sel });
    sel = null;
    navigator.vibrate?.(12);
  }
}
