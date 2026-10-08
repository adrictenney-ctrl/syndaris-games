// Milestones on a phone: your hand as a tidy row of cards (tap to pick). Draw first; then lay
// down your stage (pick the cards, tap Lay down — the phone works out the groups), add a card to
// any laid-down group, and finish by discarding one card.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=62';
import { STAGES, stageText, fitsGroup, isSkip, solve } from './milestones.js?v=62';
import { msCard, groupText } from './table-milestones.js?v=62';

let ctx = null, picked = [], skipFor = null, wasMyTurn = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function reset() { picked = []; skipFor = null; document.getElementById('msPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('msPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'msPhone';
    e.addEventListener('click', onClick);
    $('#status').after(e);
  }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-c], [data-x], [data-hit], [data-skip]');
  if (!t) return;
  if (t.dataset.c && t.closest('.ms-hand')) {
    const c = t.dataset.c;
    picked = picked.includes(c) ? picked.filter(x => x !== c) : [...picked, c];
    skipFor = null;
    return render(ctx);
  }
  if (t.dataset.hit) {
    const [owner, group] = t.dataset.hit.split(':').map(Number);
    ctx.send({ type: 'hit', owner, group, card: picked[0] });
    picked = [];
    return;
  }
  if (t.dataset.skip) { ctx.send({ type: 'discard', card: skipFor, target: Number(t.dataset.skip) }); picked = []; skipFor = null; return; }
  const x = t.dataset.x;
  if (x === 'draw' || x === 'take') return ctx.send({ type: x });
  if (x === 'lay') { ctx.send({ type: 'lay', cards: picked }); picked = []; return; }
  if (x === 'discard') {
    if (picked.length !== 1) return toast('Pick one card to discard');
    if (isSkip(picked[0]) && g.order.length > 2) { skipFor = picked[0]; return render(ctx); }
    ctx.send({ type: 'discard', card: picked[0] });
    picked = [];
  }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const stage = Math.min(g.stage[you], 9);
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Stage', stage + 1, g.laid[you] ? 'laid down ✓' : '');
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b>`;
  setHud('#hudR', 'Points', g.score[you]);
  const mine = g.phase === 'play' && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  picked = picked.filter(x => g.hand.includes(x));
  if (!mine) { skipFor = null; }

  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 You finished first!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, 'Look at the table to play again');
  else if (g.phase === 'roundOver') setStatus(g.result.advanced.includes(you) ? `On to stage ${Math.min(g.stage[you] + 1, 10)}!` : 'Stage not done — try again', `+${g.result.pts[you]} points this round`);
  else if (!mine) setStatus(`${c.nameOf(g.turn)}'s turn`, `Your stage: ${stageText(stage)}`);
  else if (g.step === 'draw') setStatus('Draw a card', `Your stage: ${stageText(stage)}`);
  else if (skipFor) setStatus('Who gets skipped?', 'They miss their next turn');
  else setStatus(g.laid[you] ? 'Add cards or discard' : `Stage ${stage + 1}: ${stageText(stage)}`, picked.length ? `${picked.length} picked` : 'Tap cards to pick them');

  // Groups you can add the picked card to.
  let hits = '';
  if (mine && g.step === 'act' && g.laid[you] && picked.length === 1) {
    const opts = [];
    g.order.forEach(o => (g.laid[o] || []).forEach((gr, i) => { if (fitsGroup(gr, picked[0])) opts.push(`<button class="panel-btn" data-hit="${o}:${i}">${o === you ? 'Your' : esc(c.nameOf(o)) + "'s"} ${groupText(gr).toLowerCase()}</button>`); }));
    if (opts.length) hits = `<p class="pick">Add it to…</p><div class="row ms-hits">${opts.join('')}</div>`;
  }
  const canLay = mine && g.step === 'act' && !g.laid[you] && picked.length && solve(STAGES[stage], picked, true);
  let actions = '';
  if (mine && g.step === 'draw') actions = `<div class="row"><button class="panel-btn go" data-x="draw">Draw from the deck</button><button class="panel-btn" data-x="take" ${g.top && !isSkip(g.top) ? '' : 'disabled'}>Take the discard</button></div>`;
  else if (mine && skipFor) actions = `<div class="row">${g.order.filter(s => s !== you).map(s => `<button class="panel-btn" data-skip="${s}">${esc(c.nameOf(s))}</button>`).join('')}</div>`;
  else if (mine) actions = `${hits}<div class="row">${g.laid[you] ? '' : `<button class="panel-btn${canLay ? ' go' : ''}" data-x="lay" ${canLay ? '' : 'disabled'}>Lay down stage</button>`}<button class="panel-btn${picked.length === 1 && !canLay ? ' go' : ''}" data-x="discard" ${picked.length === 1 ? '' : 'disabled'}>Discard</button></div>`;

  el().innerHTML = `<div class="ms-top">${msCard(g.top)}<small>Discard</small></div>
    <div class="ms-hand">${g.hand.map(x => msCard(x, picked.includes(x) ? 'picked' : '')).join('')}</div>
    ${actions}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
