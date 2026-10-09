// Homestead on a phone: your resources, the island (legal spots glow when you're building),
// and the buttons for this moment — roll, build, trade, play a charter, end your turn.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=65';
import { RES, RES_NAME, RES_ICON, COST, CHARTERS, cabinSpots, roadSpots, manorSpots, HEXES, total } from './homestead.js?v=65';
import { boardSVG } from './table-homestead.js?v=65';

let ctx = null, mode = null, give = null, get = null, offer = null, disc = null, pick = [], wasMyTurn = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const canPay = (h, cost) => Object.entries(cost).every(([r, n]) => h[r] >= n);

export function reset() { mode = give = get = offer = disc = null; pick = []; document.getElementById('hsPhone')?.remove(); }
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

// The view needs a game-shaped object for the placement helpers.
const G = g => ({ ...g, vOwner: g.vOwner, vLevel: g.vLevel, eOwner: g.eOwner });

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-v], [data-e], [data-hex], [data-x], [data-give], [data-get], [data-d], [data-play], [data-pick], [data-to], [data-steal], [data-o]');
  if (!t) return;
  const send = a => { ctx.send(a); navigator.vibrate?.(12); };
  if (t.dataset.v != null) { const v = +t.dataset.v; if (g.phase === 'setup') return send({ type: 'cabin', v }); if (mode === 'cabin' || mode === 'manor') { send({ type: mode, v }); mode = null; } return; }
  if (t.dataset.e != null) { send({ type: 'road', e: +t.dataset.e }); if (!g.free || g.free <= 1) mode = null; return; }
  if (t.dataset.hex != null && g.step === 'bandit' && g.turn === you) return send({ type: 'bandit', hex: +t.dataset.hex });
  if (t.dataset.steal != null) return send({ type: 'steal', from: +t.dataset.steal });
  if (t.dataset.give) { give = t.dataset.give; return render(ctx); }
  if (t.dataset.get) { get = t.dataset.get; return render(ctx); }
  if (t.dataset.d) { const [r, d] = t.dataset.d.split(':'); disc[r] = Math.max(0, Math.min(g.hand[r], disc[r] + +d)); return render(ctx); }
  if (t.dataset.o) { const [side, r, d] = t.dataset.o.split(':'); offer[side][r] = Math.max(0, (offer[side][r] || 0) + +d); return render(ctx); }
  if (t.dataset.to) { offer.to = +t.dataset.to; return render(ctx); }
  if (t.dataset.pick) { pick.push(t.dataset.pick); if (pick.length >= (mode === 'bounty' ? 2 : 1)) { send({ type: 'play', kind: mode, res: pick }); pick = []; mode = null; } return render(ctx); }
  if (t.dataset.play) {
    const k = t.dataset.play;
    if (k === 'bounty' || k === 'embargo') { mode = k; pick = []; return render(ctx); }
    return send({ type: 'play', kind: k });
  }
  const x = t.dataset.x;
  if (x === 'roll' || x === 'end' || x === 'charter') { mode = null; return send({ type: x }); }
  if (['road', 'cabin', 'manor', 'bank', 'offer'].includes(x)) { mode = mode === x ? null : x; give = get = null; if (x === 'offer') offer = { give: {}, get: {}, to: null }; return render(ctx); }
  if (x === 'trade') { if (!give || !get) return toast('Pick what to give and what to get'); return send({ type: 'bank', give, get }); }
  if (x === 'send') { if (offer.to == null) return toast('Pick who to offer it to'); send({ type: 'offer', to: offer.to, give: offer.give, get: offer.get }); mode = null; return; }
  if (x === 'discard') { send({ type: 'discard', give: disc }); disc = null; return; }
  if (x === 'yes' || x === 'no') return send({ type: 'answer', yes: x === 'yes' });
  if (x === 'cancel') { mode = null; return render(ctx); }
}

const resRow = h => `<div class="hs-res">${RES.map(r => `<span class="r-${r}"><i>${RES_ICON[r]}</i><b>${h[r]}</b><small>${RES_NAME[r]}</small></span>`).join('')}</div>`;
const costText = c => Object.entries(c).map(([r, n]) => `${n > 1 ? n : ''}${RES_ICON[r]}`).join(' ');

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, h = g.hand;
  const myPts = g.points[g.order.indexOf(you)];
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Points', myPts);
  $('#hudC').innerHTML = g.dice ? `<span>Rolled</span><b>${g.dice[0] + g.dice[1]}</b>` : '';
  setHud('#hudR', 'Cards', total(h));
  const mine = g.phase !== 'over' && g.turn === you;
  const act = mine || g.discard || g.trade?.to === you;
  document.body.classList.toggle('myturn', !!act);
  if (act && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = !!act;
  if (!mine) { if (mode && !['bounty', 'embargo'].includes(mode)) mode = null; }

  const opts = {};
  let panel = '';
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (g.discard) {
    if (!disc) disc = Object.fromEntries(RES.map(r => [r, 0]));
    const n = RES.reduce((a, r) => a + disc[r], 0);
    setStatus(`Discard ${g.discard} cards`, `${n} of ${g.discard} chosen`);
    panel = `<div class="hs-pick">${RES.map(r => `<div><span>${RES_ICON[r]} ${RES_NAME[r]} <small>(${h[r]})</small></span><button data-d="${r}:-1">−</button><b>${disc[r]}</b><button data-d="${r}:1">+</button></div>`).join('')}</div>
      <button class="panel-btn go wide" data-x="discard" ${n === g.discard ? '' : 'disabled'}>Discard</button>`;
  } else if (g.trade?.to === you) {
    const t = g.trade;
    setStatus(`${c.nameOf(t.from)} offers a trade`, '');
    panel = `<p class="hs-offer">You get <b>${costText(t.give)}</b> · you give <b>${costText(t.get)}</b></p><div class="row"><button class="panel-btn fold" data-x="no">No deal</button><button class="panel-btn go" data-x="yes" ${canPay(h, t.get) ? '' : 'disabled'}>Deal</button></div>`;
  } else if (!mine) setStatus(`${c.nameOf(g.turn)}'s turn`, g.phase === 'setup' ? 'Placing the first cabins and roads' : '');
  else if (g.phase === 'setup') {
    if (g.step === 'cabin') { opts.verts = new Set(cabinSpots(G(g), you, true)); setStatus('Place a cabin', 'Tap a glowing corner — not next to another building'); }
    else { opts.edges = new Set(roadSpots(G(g), you, g.lastCabin)); setStatus('Place a road', 'Tap a glowing edge next to your new cabin'); }
  } else if (g.step === 'roll') {
    setStatus('Your turn', 'Roll the dice');
    const ranger = g.charters.some(x => x.kind === 'ranger' && !x.fresh) && !g.playedThisTurn;
    panel = `<button class="panel-btn go wide" data-x="roll">Roll</button>${ranger ? '<button class="panel-btn wide" data-play="ranger">Play a Ranger first</button>' : ''}`;
  } else if (g.step === 'bandit') {
    opts.hexes = new Set(HEXES.map((_, i) => i).filter(i => i !== g.bandit));
    setStatus('Move the Bandit', 'Tap a tile — it stops producing until moved');
  } else if (g.step === 'steal') {
    setStatus('Take a card from…', '');
    panel = `<div class="row">${(g.victims || []).map(s => `<button class="panel-btn" data-steal="${s}">${esc(c.nameOf(s))}</button>`).join('')}</div>`;
  } else if (g.step === 'discard') setStatus('Waiting for discards', '');
  else {
    if (g.free) { opts.edges = new Set(roadSpots(G(g), you)); setStatus(`Build ${g.free} free road${g.free > 1 ? 's' : ''}`, 'Tap a glowing edge'); }
    else if (mode === 'road') { opts.edges = new Set(roadSpots(G(g), you)); setStatus('Build a road', 'Tap a glowing edge'); }
    else if (mode === 'cabin') { opts.verts = new Set(cabinSpots(G(g), you, false)); setStatus('Build a cabin', 'Tap a glowing corner on your roads'); }
    else if (mode === 'manor') { opts.verts = new Set(manorSpots(G(g), you)); setStatus('Raise a manor', 'Tap one of your cabins'); }
    else setStatus('Build, trade or end your turn', g.stolen && g.stolen.id ? '' : '');
    const btn = (k, label, ok) => `<button class="panel-btn${mode === k ? ' on' : ''}" data-x="${k}" ${ok ? '' : 'disabled'}>${label}<small>${costText(COST[k])}</small></button>`;
    panel = `<div class="row hs-build">${btn('road', 'Road', canPay(h, COST.road))}${btn('cabin', 'Cabin', canPay(h, COST.cabin))}${btn('manor', 'Manor', canPay(h, COST.manor))}${btn('charter', 'Charter', canPay(h, COST.charter) && g.deck)}</div>
      <div class="row"><button class="panel-btn${mode === 'bank' ? ' on' : ''}" data-x="bank">Bank trade</button><button class="panel-btn${mode === 'offer' ? ' on' : ''}" data-x="offer" ${g.trade ? 'disabled' : ''}>Offer a player</button><button class="panel-btn go" data-x="end">End turn</button></div>`;
    if (mode === 'bank') {
      panel += `<div class="hs-trade"><p class="pick">Give</p><div class="hs-chips">${RES.map(r => `<button data-give="${r}" class="${give === r ? 'on' : ''}" ${h[r] >= g.rates[r] ? '' : 'disabled'}>${RES_ICON[r]} ${g.rates[r]}:1</button>`).join('')}</div>
        <p class="pick">Get</p><div class="hs-chips">${RES.map(r => `<button data-get="${r}" class="${get === r ? 'on' : ''}">${RES_ICON[r]} ${RES_NAME[r]}</button>`).join('')}</div><button class="panel-btn go wide" data-x="trade">Trade</button></div>`;
    }
    if (mode === 'offer' && offer) {
      const step = (side, r) => `<div><span>${RES_ICON[r]}</span><button data-o="${side}:${r}:-1">−</button><b>${offer[side][r] || 0}</b><button data-o="${side}:${r}:1">+</button></div>`;
      panel += `<div class="hs-trade"><p class="pick">Offer to</p><div class="hs-chips">${g.order.filter(s => s !== you).map(s => `<button data-to="${s}" class="${offer.to === s ? 'on' : ''}">${esc(c.nameOf(s))}</button>`).join('')}</div>
        <div class="hs-two"><div><p class="pick">You give</p>${RES.map(r => step('give', r)).join('')}</div><div><p class="pick">You get</p>${RES.map(r => step('get', r)).join('')}</div></div><button class="panel-btn go wide" data-x="send">Send offer</button></div>`;
    }
  }
  // Charters (playable in roll or main steps).
  const playable = mine && ['roll', 'main'].includes(g.step) && !g.playedThisTurn;
  const chart = g.charters.length ? `<p class="pick">Your charters</p><div class="hs-charters">${g.charters.map(x => `<div class="hs-ch k-${x.kind}"><b>${CHARTERS[x.kind].name}</b><small>${CHARTERS[x.kind].text}</small>${x.kind !== 'monument' && playable && !x.fresh && !(x.kind === 'ranger' && g.step === 'roll') ? `<button data-play="${x.kind}">Play</button>` : x.fresh ? '<em>new</em>' : ''}</div>`).join('')}</div>` : '';
  const picker = mode === 'bounty' || mode === 'embargo' ? `<p class="pick">${mode === 'bounty' ? `Pick ${2 - pick.length} resource${pick.length ? '' : 's'}` : 'Name a resource'}</p><div class="hs-chips">${RES.map(r => `<button data-pick="${r}">${RES_ICON[r]} ${RES_NAME[r]}</button>`).join('')}</div><button class="panel-btn" data-x="cancel">Cancel</button>` : '';
  el().innerHTML = `${resRow(h)}<div class="hs-phone-map">${boardSVG(g, opts)}</div>${picker}${panel}${chart}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
