// Hard Sell on a phone. Sellers tap two words to make a product, then lock it in and get ready
// to pitch it out loud. The Customer can swap who they are once, opens the shop, moves the
// spotlight from pitch to pitch, and buys the winner.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { wordCard, productHTML, customerCard } from './table-hardsell.js?v=66';

let ctx = null, sel = [], wasMyTurn = false, lastRound = -1;

export function reset() { sel = []; document.getElementById('hsPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('hsPhone');
  if (!e) { e = document.createElement('div'); e.id = 'hsPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const t = ev.target.closest('[data-w], [data-x], [data-buy]');
  if (!t) return;
  if (t.dataset.w != null) {
    const w = Number(t.dataset.w);
    sel = sel.includes(w) ? sel.filter(x => x !== w) : [...sel, w].slice(-2);
    return render(ctx);
  }
  if (t.dataset.buy != null) return ctx.send({ type: 'buy', seat: Number(t.dataset.buy) });
  const x = t.dataset.x;
  if (x === 'lock') ctx.send({ type: 'pick', words: sel });
  else ctx.send({ type: x });
  navigator.vibrate?.(15);
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, cust = g.customer === you;
  if (g.round !== lastRound) { lastRound = g.round; sel = []; }
  sel = sel.filter(i => g.hand.some(h => h.i === i));
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Sold', g.scores[you]);
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}/${g.total}</b>`;
  const best = g.order.filter(s => s !== you).sort((a, b) => g.scores[b] - g.scores[a])[0];
  if (best != null) setHud('#hudR', c.nameOf(best), g.scores[best]);
  const P = g.pitchers, myPitch = g.phase === 'pitch' && P[g.pitchIdx] === you;
  const mine = (g.phase === 'build' && !cust && !g.mine) || (cust && g.phase === 'pitch') || myPitch;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  let body = '';
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 Top seller!' : `${g.winners.map(c.nameOf).join(' & ')} won`, 'Look at the table to play again');
  else if (g.phase === 'won') {
    setStatus(g.won.seat === you ? '💰 SOLD! Nice pitch' : `${c.nameOf(g.won.seat)} made the sale`, `${g.won.who} bought the ${g.won.words.join(' ')}`);
  } else if (cust) {
    body = customerCard(g.who, 'big');
    if (g.phase === 'build') {
      const ready = g.order.filter(s => s !== you && g.ready[s]).length, n = g.order.length - 1;
      setStatus("You're the Customer 🛍", `Get into character! ${ready}/${n} products ready`);
      body += `<div class="row">${g.redrawn ? '' : '<button class="panel-btn" data-x="redraw">Be someone else</button>'}<button class="panel-btn go" data-x="open" ${ready >= Math.min(2, n) ? '' : 'disabled'}>Open the shop</button></div>`;
    } else {
      const done = g.pitchIdx >= P.length - 1;
      setStatus(done ? 'Which one will you buy?' : `${c.nameOf(P[g.pitchIdx])} is pitching`, done ? 'Ask questions, then tap a product' : 'Listen… then tap Next pitch');
      if (!done) body += '<div class="row"><button class="panel-btn go" data-x="next">Next pitch ▶</button></div>';
      body += `<div class="hs-buy">${P.map(s => `<button data-buy="${s}" ${done ? '' : 'disabled'}>${productHTML(g.products[s])}<small>${c.nameOf(s)}</small></button>`).join('')}</div>`;
    }
  } else if (g.phase === 'build' && g.mine) {
    setStatus('Locked in ✓', 'Rehearse your pitch while the others finish');
    body = `${customerCard(g.who)}${productHTML(g.products[you], 'big')}<div class="row"><button class="panel-btn" data-x="unpick">Change it</button></div>`;
  } else if (g.phase === 'build') {
    setStatus(`Sell something to ${g.who}`, sel.length === 2 ? 'Lock it in — or try another pair' : 'Tap two words to make a product');
    body = `${customerCard(g.who)}${sel.length ? productHTML(sel.map(i => g.hand.find(h => h.i === i).w), 'big') : '<div class="hs-prod empty big">? + ?</div>'}
      <div class="hs-hand">${g.hand.map(h => `<button data-w="${h.i}" class="${sel.includes(h.i) ? 'sel' : ''}">${wordCard(h.w)}</button>`).join('')}</div>
      <div class="row"><button class="panel-btn go" data-x="lock" ${sel.length === 2 ? '' : 'disabled'}>Lock it in</button></div>`;
  } else {
    const mineP = g.products[you];
    setStatus(myPitch ? '🎤 Your pitch! Sell it!' : g.pitchIdx >= P.length ? `${c.nameOf(g.customer)} is deciding…` : `${c.nameOf(P[g.pitchIdx])} is pitching`, mineP ? `Your product: the ${mineP.join(' ')}` : 'You sat this one out');
    body = `${customerCard(g.who)}${mineP ? productHTML(mineP, 'big' + (myPitch ? ' now' : '')) : ''}`;
  }
  el().innerHTML = body;
  $('#panel').innerHTML = '';
  renderHand([]);
}
