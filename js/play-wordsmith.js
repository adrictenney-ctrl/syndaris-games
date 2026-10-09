// Wordsmith on a phone: the board (tap "Zoom" for a closer look) and your rack. Tap a tile,
// then a square to put it there; tap a placed tile to take it back. The phone shows what the
// word would score; the table checks it against the dictionary when you press Play.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { evaluate, tileValue } from './wordsmith.js?v=66';
import { boardHTML, tileHTML } from './table-wordsmith.js?v=66';

let ctx = null, pending = {}, pendingBlank = {}, sel = null, zoom = false, swapping = false, swapSel = new Set(), order = null, blankFor = null, lastMove = -1, wasMyTurn = false;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function reset() { pending = {}; pendingBlank = {}; sel = null; swapping = false; swapSel = new Set(); order = null; document.getElementById('wsPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('wsPhone');
  if (!e) { e = document.createElement('div'); e.id = 'wsPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

// Rack tiles not yet on the board, by rack position.
const usedIdx = () => new Set(Object.values(pending).map(p => p.k));

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-k], [data-i], [data-x], [data-l]');
  if (!t) return;
  const mine = g.phase === 'play' && g.turn === you;
  if (t.dataset.l) { const p = pending[blankFor]; if (p) p.letter = t.dataset.l; blankFor = null; return render(ctx); }
  if (t.dataset.k != null) {
    const k = +t.dataset.k;
    if (swapping) { swapSel.has(k) ? swapSel.delete(k) : swapSel.add(k); return render(ctx); }
    if (usedIdx().has(k)) return;
    sel = sel === k ? null : k;
    return render(ctx);
  }
  if (t.dataset.i != null) {
    const i = +t.dataset.i;
    if (!mine) return;
    if (pending[i]) { delete pending[i]; return render(ctx); }
    if (g.board[i] || sel == null) return sel == null ? toast('Pick a tile from your rack first') : null;
    const tile = g.rack[sel];
    pending[i] = { k: sel, letter: tile === '?' ? 'E' : tile, blank: tile === '?' };
    if (tile === '?') blankFor = i;
    sel = null;
    navigator.vibrate?.(8);
    return render(ctx);
  }
  const x = t.dataset.x;
  if (x === 'zoom') { zoom = !zoom; return render(ctx); }
  if (x === 'recall') { pending = {}; sel = null; return render(ctx); }
  if (x === 'shuffle') { order = (order || g.rack.map((_, k) => k)).sort(() => Math.random() - 0.5); return render(ctx); }
  if (x === 'play') {
    const tiles = Object.entries(pending).map(([i, p]) => ({ i: +i, letter: p.letter, blank: p.blank }));
    if (!tiles.length) return toast('Place some tiles first');
    ctx.send({ type: 'place', tiles });
    return;
  }
  if (x === 'swap') { swapping = true; swapSel = new Set(); pending = {}; return render(ctx); }
  if (x === 'doswap') { ctx.send({ type: 'swap', tiles: [...swapSel].map(k => g.rack[k]) }); swapping = false; return; }
  if (x === 'cancel') { swapping = false; return render(ctx); }
  if (x === 'pass') ctx.send({ type: 'pass' });
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (g.moveId !== lastMove) { lastMove = g.moveId; pending = {}; sel = null; blankFor = null; if (order && order.length !== g.rack.length) order = null; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Score', g.scores[you]);
  $('#hudC').innerHTML = `<span>Bag</span><b>${g.bag}</b>`;
  const best = g.order.filter(s => s !== you).sort((a, b) => g.scores[b] - g.scores[a])[0];
  if (best != null) setHud('#hudR', c.nameOf(best), g.scores[best]);
  const mine = g.phase === 'play' && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;

  const tiles = Object.entries(pending).map(([i, p]) => ({ i: +i, letter: p.blank ? p.letter.toLowerCase() : p.letter }));
  const preview = tiles.length ? evaluate(g.board, tiles) : null;
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 You win!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, 'Look at the table to play again');
  else if (!g.ready) setStatus('Loading the dictionary…', 'One moment');
  else if (!mine) setStatus(`${c.nameOf(g.turn)} is thinking…`, 'You can plan your word on the board');
  else if (swapping) setStatus('Swap tiles', 'Pick the tiles to put back in the bag');
  else if (preview && !preview.error) setStatus(`${preview.words.map(w => w.word).join(', ')}`, `Worth ${preview.score}${preview.bingo ? ' (all seven!)' : ''} if the words are real`);
  else setStatus(mine ? 'Your turn' : '', preview?.error || 'Tap a tile, then a square');

  const pend = Object.fromEntries(Object.entries(pending).map(([i, p]) => [i, p.blank ? p.letter.toLowerCase() : p.letter]));
  const used = usedIdx();
  const rackOrder = order && order.length === g.rack.length ? order : g.rack.map((_, k) => k);
  const rack = rackOrder.map(k => `<button data-k="${k}" class="${sel === k ? 'sel' : ''}${used.has(k) ? ' used' : ''}${swapSel.has(k) ? ' sel' : ''}">${tileHTML(g.rack[k])}</button>`).join('');
  let actions = '';
  if (mine && swapping) actions = `<div class="row"><button class="panel-btn" data-x="cancel">Cancel</button><button class="panel-btn go" data-x="doswap" ${swapSel.size ? '' : 'disabled'}>Swap ${swapSel.size || ''}</button></div>`;
  else if (mine) actions = `<div class="row"><button class="panel-btn" data-x="recall">Recall</button><button class="panel-btn" data-x="shuffle">Shuffle</button><button class="panel-btn go" data-x="play" ${tiles.length && preview && !preview.error ? '' : 'disabled'}>Play${preview && !preview.error ? ` · ${preview.score}` : ''}</button></div>
    <div class="row"><button class="panel-btn" data-x="swap" ${g.bag >= 7 ? '' : 'disabled'}>Swap tiles</button><button class="panel-btn" data-x="pass">Pass</button><button class="panel-btn" data-x="zoom">${zoom ? 'Zoom out' : 'Zoom in'}</button></div>`;
  else actions = `<div class="row"><button class="panel-btn" data-x="zoom">${zoom ? 'Zoom out' : 'Zoom in'}</button></div>`;
  const picker = blankFor != null ? `<p class="pick">Which letter is the blank?</p><div class="ws-letters">${[...LETTERS].map(L => `<button data-l="${L}">${L}</button>`).join('')}</div>` : '';
  el().innerHTML = `<div class="ws-scroll${zoom ? ' zoom' : ''}">${boardHTML(g, { pending: pend, last: new Set(g.last?.cells || []) })}</div>${picker}<div class="ws-rack">${rack}</div>${actions}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
