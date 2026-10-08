// Kaboom Critters on a phone: your hand. Tap a card to pick it (a critter picks its twin
// too), then Play — or just Draw to end your turn. When anyone plays an action, a big
// Nuh-uh! button appears if you hold one.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=60';
import * as K from './kaboom.js?v=60';
import { kcCard } from './table-kaboom.js?v=60';

let ctx = null, sel = [], targeting = false, wasMyTurn = false, lastMove = -1, lastGift = -1;

export function reset() { sel = []; targeting = false; document.getElementById('kcPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('kcPhone');
  if (!e) { e = document.createElement('div'); e.id = 'kcPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}
const send = a => { ctx.send(a); sel = []; targeting = false; navigator.vibrate?.(12); };

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-c], [data-x], [data-t], [data-pos]');
  if (!t) return;
  if (t.dataset.x === 'nuhuh') return send({ type: 'nuhuh' });
  if (t.dataset.pos != null) return send({ type: 'tuck', pos: t.dataset.pos });
  if (t.dataset.t != null) return send({ type: 'play', cards: sel, target: Number(t.dataset.t) });
  if (t.dataset.c) {
    const c = t.dataset.c, ty = K.typeOf(c);
    if (g.favor?.from === you) return send({ type: 'give', card: c });
    if (sel.includes(c)) sel = [];
    else if (K.CARDS[ty].critter) { const twin = g.hand.find(x => x !== c && K.typeOf(x) === ty); sel = twin ? [c, twin] : [c]; }
    else sel = [c];
    targeting = false;
    return render(ctx);
  }
  const x = t.dataset.x;
  if (x === 'draw') return send({ type: 'draw' });
  if (x === 'back') { targeting = false; return render(ctx); }
  if (x === 'play') {
    const ty = K.typeOf(sel[0]);
    if (sel.length === 2 || ty === 'please') { targeting = true; return render(ctx); }
    return send({ type: 'play', cards: sel });
  }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (g.moveId !== lastMove) { lastMove = g.moveId; sel = sel.filter(x => g.hand.includes(x)); if (sel.length === 1 && K.CARDS[K.typeOf(sel[0])].critter) sel = []; }
  if (g.gift && g.gift.id !== lastGift) { if (lastGift !== -1) toast(`You got ${K.CARDS[K.typeOf(g.gift.card)].name}!`); lastGift = g.gift.id; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Cards', g.hand.length);
  $('#hudC').innerHTML = `<span>Deck</span><b>${g.deck}</b>`;
  setHud('#hudR', 'Kaboom!s', g.kabooms, `1 in ${g.kabooms ? Math.max(1, Math.round(g.deck / g.kabooms)) : '—'}`);

  const out = !g.alive[you];
  const mine = !out && g.phase !== 'over' && !g.pending && (g.favor ? g.favor.from === you : g.turn === you);
  document.body.classList.toggle('myturn', mine || (!!g.pending && canNope(g, you)));
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  const p = g.pending;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You survived!' : `${c.nameOf(g.winner)} survives`, 'Look at the table to play again');
  else if (out) setStatus('💥 Kaboom — you\'re out', 'Watch the others sweat');
  else if (p) setStatus(`${c.nameOf(p.seat)}: ${p.kind === 'steal' ? 'critter steal' : K.CARDS[p.kind].name}`, p.nopes % 2 ? 'Cancelled… for now' : p.target === you ? 'That\'s aimed at you!' : 'Anyone can say Nuh-uh!');
  else if (g.favor?.from === you) setStatus(`${c.nameOf(g.favor.to)} says pretty please`, 'Tap a card to give it to them');
  else if (g.phase === 'tuck' && g.turn === you) setStatus('Phew — the Lullaby worked', 'Where does the Kaboom! go back in the deck?');
  else if (g.turn === you) setStatus(g.turnsLeft > 1 ? `Your turn (${g.turnsLeft} to take)` : 'Your turn', sel.length ? 'Play it, or draw to end your turn' : 'Play cards, then draw one to end your turn');
  else setStatus(`${c.nameOf(g.turn)}'s turn`, g.favor ? `${c.nameOf(g.favor.from)} is picking a gift` : '');

  let actions = '';
  if (p && canNope(g, you)) actions = `<button class="panel-btn kc-nuh" data-x="nuhuh">✋ Nuh-uh!</button>`;
  else if (mine && g.phase === 'tuck') actions = `<div class="kc-pos">${[['0', 'Top'], ['1', '2nd'], ['2', '3rd'], ['4', '5th'], [String(g.deck), 'Bottom'], ['random', 'Random']].map(([v, t]) => `<button class="panel-btn" data-pos="${v}">${t}</button>`).join('')}</div>`;
  else if (mine && !g.favor && targeting) actions = `<p class="pick">Who from?</p><div class="kc-targets">${g.order.filter(s => s !== you && g.alive[s] && g.counts[s]).map(s => `<button class="panel-btn" data-t="${s}"><i style="background:var(--seat-${s})"></i>${c.nameOf(s)} · ${g.counts[s]}</button>`).join('')}</div><button class="panel-btn" data-x="back">Back</button>`;
  else if (mine && !g.favor) {
    const ty = sel[0] && K.typeOf(sel[0]);
    const ok = sel.length === 2 || (sel.length === 1 && !K.CARDS[ty].critter && !['lullaby', 'nuhuh', 'kaboom'].includes(ty));
    actions = `<div class="row"><button class="panel-btn go" data-x="play" ${ok ? '' : 'disabled'}>${ok ? `Play ${sel.length === 2 ? 'the pair' : K.CARDS[ty].name}` : 'Play'}</button><button class="panel-btn kc-draw" data-x="draw">Draw &amp; end turn</button></div>`;
  }
  const peek = g.peek && !out ? `<div class="kc-peek"><small>Top of the deck →</small>${g.peek.map((x, i) => kcCard(x, i ? '' : 'first')).join('')}</div>` : '';
  el().innerHTML = `${peek}<div class="kc-hand">${g.hand.map(x => `<button data-c="${x}" class="${sel.includes(x) ? 'sel' : ''}">${kcCard(x)}</button>`).join('')}</div>${actions}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}

const canNope = (g, you) => !!g.pending && g.alive[you] && g.pending.last !== you && g.hand.some(c => K.typeOf(c) === 'nuhuh');
