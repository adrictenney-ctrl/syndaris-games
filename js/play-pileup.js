// Pile Up on a phone: your hand, with the cards you can play lifted. Tap one to play it (wilds
// ask for a suit). When a draw pile is coming your way, answer it or take it.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=62';
import * as U from './pileup.js?v=62';
import { puCard, suitSVG, SUIT_COLOR } from './table-pileup.js?v=62';

let ctx = null, wild = null, wasMyTurn = false;

export function reset() { wild = null; document.getElementById('puPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('puPhone');
  if (!e) { e = document.createElement('div'); e.id = 'puPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}
const send = a => { ctx.send(a); wild = null; navigator.vibrate?.(12); };

function onClick(ev) {
  const g = ctx.st.game;
  const t = ev.target.closest('[data-c], [data-x], [data-col], [data-t]');
  if (!t) return;
  if (t.dataset.t != null) return send({ type: 'swap', target: Number(t.dataset.t) });
  if (t.dataset.col) {
    if (g.choice?.kind === 'roulette') return send({ type: 'color', color: t.dataset.col });
    if (wild) return send({ type: 'play', card: wild, color: t.dataset.col });
    return;
  }
  if (t.dataset.c) {
    const c = t.dataset.c;
    if (!g.playable.includes(c)) return;
    if (U.isWild(c) && U.kindOf(c) !== 'roul') { wild = wild === c ? null : c; return render(ctx); }
    return send({ type: 'play', card: c });
  }
  if (t.dataset.x === 'cancel') { wild = null; return render(ctx); }
  send({ type: t.dataset.x });
}

const suitPicker = () => `<div class="pu-pick">${U.SUITS.map(s => `<button data-col="${s}" style="--sc:${SUIT_COLOR[s]}">${suitSVG(s)}<span>${U.SUIT[s].name}</span></button>`).join('')}</div>`;

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (wild && !g.hand.includes(wild)) wild = null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Cards', g.hand.length, `${U.MERCY} = out`);
  $('#hudC').innerHTML = `<span>Match</span><b style="color:${SUIT_COLOR[g.color]}">${U.SUIT[g.color].name}</b>`;
  const fewest = g.order.filter(s => s !== you && !g.out[s]).sort((a, b) => g.counts[a] - g.counts[b])[0];
  if (fewest != null) setHud('#hudR', c.nameOf(fewest), g.counts[fewest], 'cards');
  const mine = g.toMove === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  let actions = '';
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (g.out[you]) setStatus('💀 Knocked out', `${U.MERCY} cards — no mercy`);
  else if (g.choice?.seat === you && g.choice.kind === 'swap') {
    setStatus('Swap hands with…', 'Pick a player');
    actions = `<div class="pu-targets">${g.order.filter(s => s !== you && !g.out[s]).map(s => `<button class="panel-btn" data-t="${s}"><i style="background:var(--seat-${s})"></i>${c.nameOf(s)} · ${g.counts[s]}</button>`).join('')}</div>`;
  } else if (g.choice?.seat === you) { setStatus('Roulette! Name a suit', 'You flip until it turns up — and keep them all'); actions = suitPicker(); }
  else if (mine && wild) { setStatus('Pick a suit', U.label(wild)); actions = suitPicker() + '<button class="panel-btn" data-x="cancel">Back</button>'; }
  else if (mine && g.stack) {
    setStatus(`+${g.stack} coming at you!`, g.playable.length ? `Answer with +${g.stackMin} or bigger — or take it` : 'Nothing to answer with');
    actions = `<button class="panel-btn pu-take" data-x="take">Take ${g.stack} cards</button>`;
  } else if (mine && g.drew) { setStatus('You drew one you can play', 'Play it, or pass'); actions = '<button class="panel-btn" data-x="pass">Keep it and pass</button>'; }
  else if (mine) {
    setStatus('Your turn', g.playable.length ? 'Tap a lifted card to play it' : 'Nothing matches — draw until something does');
    if (!g.playable.length) actions = '<button class="panel-btn go" data-x="draw">Draw</button>';
  } else setStatus(g.choice ? `${c.nameOf(g.choice.seat)} is choosing…` : `${c.nameOf(g.turn)}'s turn`, g.stack ? `The pile is +${g.stack}` : '');
  const top = `<div class="pu-top">${puCard(g.top)}<div><small>Top card</small><b style="color:${SUIT_COLOR[g.color]}">${U.SUIT[g.color].name}</b></div></div>`;
  el().innerHTML = `${top}${actions}<div class="pu-hand${g.hand.length > 14 ? ' tight' : ''}">${g.hand.map(x => `<button data-c="${x}" class="${g.playable.includes(x) ? 'ok' : ''} ${wild === x ? 'sel' : ''}">${puCard(x)}</button>`).join('')}</div>`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
