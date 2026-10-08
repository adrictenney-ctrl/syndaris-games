// Rummy on a phone: draw from the stock or take the discard; then tap cards to select them and
// Meld, tap one card and a meld on the table to lay it off, or tap one card and Discard.
import { $, toast, setHud, setStatus, renderHand, cardEl, flyCard } from './phone-kit.js?v=64';
import { isMeld, fits } from './rummycore.js?v=64';

let sel = [], wasMyTurn = false, lastHand = -1;
export function reset() { sel = []; lastHand = -1; document.getElementById('rmPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

// The cards on the table, small: the discard top and every meld (tappable for laying off).
export function tableStrip(c, g, { melds = [], onMeld, okMeld = () => false } = {}) {
  let el = document.getElementById('rmPhone');
  if (!el) { el = document.createElement('div'); el.id = 'rmPhone'; $('#status').after(el); }
  el.innerHTML = '';
  melds.forEach((m, i) => {
    const row = document.createElement('button');
    row.className = 'rm-mini' + (okMeld(m) ? ' ok' : '');
    row.style.setProperty('--dot', `var(--seat-${m.by ?? 0})`);
    m.cards.forEach(card => row.appendChild(cardEl(card)));
    row.onclick = () => onMeld?.(i);
    el.appendChild(row);
  });
  return el;
}

export function render(c) {
  const g = c.st.game, you = c.st.you;
  if (g.handNo !== lastHand) { lastHand = g.handNo; sel = []; }
  sel = sel.filter(x => g.hand.includes(x));
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Cards', g.hand.length);
  $('#hudC').innerHTML = `<span>Stock</span><b>${g.stock}</b>`;
  if (g.target) setHud('#hudR', 'Points', g.scores[you], `to ${g.target}`); else setHud('#hudR', null);
  const mine = (g.phase === 'draw' || g.phase === 'play') && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  const one = sel.length === 1 ? sel[0] : null;
  tableStrip(c, g, {
    melds: g.melds,
    okMeld: m => mine && g.phase === 'play' && one && fits(m.cards, one),
    onMeld: i => { if (!(mine && g.phase === 'play')) return; if (!one) return toast('Select one card to lay off'); c.send({ type: 'layoff', card: one, meld: i }); sel = []; },
  });
  const p = $('#panel');
  if (g.phase === 'handEnd' || g.phase === 'over') {
    if (g.result.wash) setStatus('A wash', 'Nobody scores this hand');
    else setStatus(g.result.winner === you ? `You went out! +${g.result.pts}` : `${c.nameOf(g.result.winner)} went out`, g.phase === 'over' ? 'Game over · look at the table' : 'Next hand in a moment');
    p.innerHTML = '';
  } else if (!mine) {
    setStatus(`${c.nameOf(g.turn)}'s turn`, 'Plan your melds');
    p.innerHTML = '';
  } else if (g.phase === 'draw') {
    setStatus('Your turn — draw', 'From the stock, or take the top discard');
    p.innerHTML = `<div class="row"><button class="panel-btn go" id="rmStock">Draw from stock</button><button class="panel-btn rm-take" id="rmDis" ${g.top ? '' : 'disabled'}>Take <span></span></button></div>`;
    if (g.top) p.querySelector('.rm-take span').appendChild(cardEl(g.top));
    $('#rmStock').onclick = () => c.send({ type: 'draw', from: 'stock' });
    $('#rmDis').onclick = () => c.send({ type: 'draw', from: 'discard' });
  } else {
    const canMeld = sel.length >= 3 && isMeld(sel);
    setStatus('Meld, lay off, then discard', sel.length ? (canMeld ? 'That’s a meld!' : one ? 'Discard it, or tap a glowing meld to lay it off' : `${sel.length} selected`) : 'Tap cards to select them');
    p.innerHTML = `<div class="row"><button class="panel-btn go" id="rmMeld" ${canMeld ? '' : 'disabled'}>Meld</button><button class="panel-btn" id="rmDisc" ${one && (one !== g.took || g.hand.length === 1) ? '' : 'disabled'}>Discard</button></div>`;
    $('#rmMeld').onclick = () => { c.send({ type: 'meld', cards: sel }); sel = []; };
    $('#rmDisc').onclick = () => { flyCard(one); c.send({ type: 'discard', card: one }); sel = []; };
  }
  renderHand(g.hand, {
    selected: sel,
    onTap: card => { if (!(mine && g.phase === 'play')) return; sel = sel.includes(card) ? sel.filter(x => x !== card) : [...sel, card]; render(c); },
    hint: mine && g.phase === 'play' ? (g.took ? 'The card you picked up can’t go straight back' : '') : '',
  });
}
