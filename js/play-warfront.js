// Warfront on a phone: the map, small enough to hold, big enough to tap. Reinforce by tapping
// your territories; attack by tapping one of yours and then an enemy next to it; fortify by
// tapping where troops come from and where they go.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=63';
import { MAP, ADJ, isSet, tradeValue, SYMBOLS, connected } from './warfront.js?v=63';
import { mapSVG } from './table-warfront.js?v=63';

let ctx = null, sel = null, tgt = null, amount = 1, moveN = 1, wasMyTurn = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function reset() { sel = tgt = null; document.getElementById('wfPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('wfPhone');
  if (!e) { e = document.createElement('div'); e.id = 'wfPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function findSet(cards) {
  for (let a = 0; a < cards.length; a++) for (let b = a + 1; b < cards.length; b++) for (let c = b + 1; c < cards.length; c++) if (isSet([cards[a], cards[b], cards[c]])) return [cards[a], cards[b], cards[c]];
  return null;
}

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-t], [data-x], [data-amt]');
  if (!t) return;
  if (t.dataset.amt) { amount = t.dataset.amt === 'all' ? 999 : Number(t.dataset.amt); return render(ctx); }
  const x = t.dataset.x;
  if (x) {
    if (x === 'trade') { const s = findSet(g.cards); if (s) ctx.send({ type: 'trade', cards: s }); }
    if (x === 'attack' || x === 'blitz') ctx.send({ type: 'attack', from: sel, to: tgt, blitz: x === 'blitz' });
    if (x === 'endAttack') { sel = tgt = null; ctx.send({ type: 'endAttack' }); }
    if (x === 'end') { sel = tgt = null; ctx.send({ type: 'end' }); }
    if (x === 'minus') { moveN = Math.max(1, moveN - 1); return render(ctx); }
    if (x === 'plus') { moveN = moveN + 1; return render(ctx); }
    if (x === 'occupy') ctx.send({ type: 'occupy', n: moveN });
    if (x === 'fortify') { ctx.send({ type: 'fortify', from: sel, to: tgt, n: moveN }); sel = tgt = null; }
    return;
  }
  if (g.turn !== you) return;
  const i = Number(t.dataset.t);
  if (g.step === 'reinforce') {
    if (g.owner[i] !== you) return toast('Place troops on your own territory');
    ctx.send({ type: 'place', t: i, n: Math.min(amount, g.reserve) });
    navigator.vibrate?.(10);
    return;
  }
  if (g.step === 'attack' && !g.occupy) {
    if (g.owner[i] === you) { sel = g.armies[i] > 1 ? i : null; tgt = null; if (!sel && sel !== 0) toast('You need 2+ troops there to attack'); return render(ctx); }
    if (sel != null && ADJ[sel].includes(i)) { tgt = i; return render(ctx); }
    return toast('Pick one of your territories first, then a neighbouring enemy');
  }
  if (g.step === 'fortify') {
    if (g.owner[i] !== you) return;
    if (sel == null || (tgt != null && i !== tgt)) { if (g.armies[i] > 1) { sel = i; tgt = null; moveN = g.armies[i] - 1; } return render(ctx); }
    if (i !== sel && connected(g, sel, i)) { tgt = i; return render(ctx); }
    return toast('Pick a territory linked to it through your land');
  }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const land = g.owner.filter(o => o === you).length;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Lands', land);
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b>`;
  setHud('#hudR', 'Cards', g.cards.length, g.cards.map(x => (x[0] === 'W' ? '★' : SYMBOLS[+x[0]])).join(''));
  const mine = g.step !== 'over' && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) { navigator.vibrate?.([60, 40, 60]); sel = tgt = null; amount = 1; }
  wasMyTurn = mine;
  if (sel != null && g.owner[sel] !== you) sel = tgt = null;
  if (tgt != null && g.step === 'attack' && g.owner[tgt] === you && !g.occupy) tgt = null;
  if (g.occupy) moveN = Math.max(g.occupy.min, Math.min(g.occupy.max, moveN || g.occupy.max));

  let targets = new Set(), panel = '';
  if (g.step === 'over') setStatus(g.winner === you ? '🏆 Victory!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (g.out[you]) setStatus("You've been conquered", 'Watch the war play out on the table');
  else if (!mine) setStatus(`${c.nameOf(g.turn)}'s turn`, `You'll get ${g.income[g.order.indexOf(you)]} troops next turn`);
  else if (g.step === 'reinforce') {
    const set = findSet(g.cards);
    setStatus(`Place ${g.reserve} troops`, 'Tap your territories');
    panel = `<div class="row wf-amt">${[1, 3, 5, 'all'].map(a => `<button class="panel-btn ${String(amount === 999 ? 'all' : amount) === String(a) ? 'on' : ''}" data-amt="${a}">${a === 'all' ? 'All' : '+' + a}</button>`).join('')}</div>
      ${set ? `<button class="panel-btn go wide" data-x="trade">Trade a card set · +${tradeValue(g.trades)} troops</button>` : g.cards.length >= 5 ? '<p class="pick">You must trade a set.</p>' : ''}`;
  } else if (g.occupy) {
    setStatus(`You took ${MAP[g.occupy.to].name}!`, 'How many troops move in?');
    panel = `<div class="row wf-step"><button class="panel-btn" data-x="minus">−</button><b>${moveN}</b><button class="panel-btn" data-x="plus" ${moveN >= g.occupy.max ? 'disabled' : ''}>+</button></div><button class="panel-btn go wide" data-x="occupy">Move ${moveN} in</button>`;
  } else if (g.step === 'attack') {
    if (sel != null) targets = new Set(ADJ[sel].filter(j => g.owner[j] !== you));
    const b = g.battle;
    setStatus(tgt != null ? `${MAP[sel].name} → ${MAP[tgt].name}` : sel != null ? 'Pick a target' : 'Attack!', tgt != null ? `${g.armies[sel]} against ${g.armies[tgt]}` : b ? `Last roll ${b.a.join(' ')} vs ${b.d.join(' ')}` : 'Tap one of your territories with 2+ troops');
    panel = `${tgt != null ? '<div class="row"><button class="panel-btn" data-x="attack">Attack once</button><button class="panel-btn fold" data-x="blitz">Blitz</button></div>' : ''}<button class="panel-btn wide" data-x="endAttack">Done attacking</button>`;
  } else if (g.step === 'fortify') {
    if (sel != null) targets = new Set(MAP.map((_, j) => j).filter(j => j !== sel && g.owner[j] === you && connected(g, sel, j)));
    if (sel != null) moveN = Math.max(1, Math.min(moveN, g.armies[sel] - 1));
    setStatus('Fortify', tgt != null ? `${MAP[sel].name} → ${MAP[tgt].name}` : sel != null ? 'Now tap where the troops go' : 'One move: tap where troops come from (or end your turn)');
    panel = `${tgt != null ? `<div class="row wf-step"><button class="panel-btn" data-x="minus">−</button><b>${moveN}</b><button class="panel-btn" data-x="plus" ${moveN >= g.armies[sel] - 1 ? 'disabled' : ''}>+</button></div><button class="panel-btn go wide" data-x="fortify">Move ${moveN} and end turn</button>` : ''}<button class="panel-btn wide" data-x="end">End turn</button>`;
  }
  el().innerHTML = `<div class="wf-phone-map">${mapSVG(g, { sel: sel ?? tgt, targets })}</div>${mine ? panel : ''}`;
  if (tgt != null) el().querySelector(`[data-t="${tgt}"]`)?.classList.add('sel2');
  $('#panel').innerHTML = '';
  renderHand([]);
}
