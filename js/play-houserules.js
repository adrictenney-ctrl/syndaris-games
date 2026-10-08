// House Rules on a phone: your hand. Tap a card to read it, then Play. Cards that need a
// choice (whose Keeper, which player, which rule) ask for it before they go.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=62';
import * as H from './houserules.js?v=62';
import { hrCard } from './table-houserules.js?v=62';

let ctx = null, sel = null, mineK = null, picks = [], wasMyTurn = false, lastMove = -1;

export function reset() { sel = null; mineK = null; picks = []; document.getElementById('hrPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('hrPhone');
  if (!e) { e = document.createElement('div'); e.id = 'hrPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}
const D = id => H.DECKS[ctx.st.game.deck].cards[H.typeOf(id)];
const send = a => { ctx.send(a); sel = null; mineK = null; picks = []; navigator.vibrate?.(12); };

function onClick(ev) {
  const g = ctx.st.game;
  const t = ev.target.closest('[data-c], [data-x], [data-k], [data-p], [data-r], [data-g], [data-m]');
  if (!t) return;
  if (g.limit) {
    if (t.dataset.c || t.dataset.k) { const c = t.dataset.c || t.dataset.k; picks = picks.includes(c) ? picks.filter(x => x !== c) : [...picks, c].slice(-g.limit.n); return render(ctx); }
    if (t.dataset.x === 'discard') return send({ type: 'discard', cards: picks });
    return;
  }
  if (t.dataset.c) { sel = sel === t.dataset.c ? null : t.dataset.c; mineK = null; return render(ctx); }
  if (t.dataset.x === 'back') { sel = null; mineK = null; return render(ctx); }
  if (!sel) return;
  if (t.dataset.x === 'play') return send({ type: 'play', card: sel });
  if (t.dataset.m) { mineK = t.dataset.m; return render(ctx); }
  if (t.dataset.k) return send(mineK ? { type: 'play', card: sel, mine: mineK, keeper: t.dataset.k } : { type: 'play', card: sel, keeper: t.dataset.k });
  if (t.dataset.p) return send({ type: 'play', card: sel, target: Number(t.dataset.p) });
  if (t.dataset.r) return send({ type: 'play', card: sel, rule: t.dataset.r });
  if (t.dataset.g) return send({ type: 'play', card: sel, replace: Number(t.dataset.g) });
}

// What the selected card needs before it can be played.
function chooser(g, you) {
  const d = D(sel), deck = g.deck;
  const keepersBy = (filter) => g.order.map(s => {
    const ks = g.keepers[s].filter(c => filter(s, c));
    return ks.length ? `<div class="hr-who"><small>${s === you ? 'Yours' : ctx.nameOf(s)}</small><div>${ks.map(c => `<button data-k="${c}">${hrCard(deck, c, 'sm')}</button>`).join('')}</div></div>` : '';
  }).join('');
  const back = '<button class="panel-btn" data-x="back">Back</button>';
  if (d.type === 'goal' && g.double && g.goals.length >= 2) return `<p class="pick">Replace which Goal?</p><div class="hr-row">${g.goals.map((c, i) => `<button data-g="${i}">${hrCard(deck, c)}</button>`).join('')}</div>${back}`;
  if (d.type !== 'action' || !d.target) return `<div class="row"><button class="panel-btn go" data-x="play">Play ${d.name}</button>${back}</div>`;
  const fizz = `<p class="pick">Nothing to aim at — it will just be discarded</p><div class="row"><button class="panel-btn go" data-x="play">Play anyway</button>${back}</div>`;
  if (d.target === 'keeper' || d.target === 'creeper' || d.target === 'theirKeeper') {
    const want = d.target === 'creeper' ? 'creeper' : 'keeper';
    const html = keepersBy((s, c) => D(c).type === want && (d.target !== 'theirKeeper' || s !== you));
    return html ? `<p class="pick">Which ${want === 'creeper' ? 'Creeper' : 'Keeper'}?</p>${html}${back}` : fizz;
  }
  if (d.target === 'player') return `<p class="pick">Swap with who?</p><div class="hr-players">${g.order.filter(s => s !== you).map(s => `<button class="panel-btn" data-p="${s}"><i style="background:var(--seat-${s})"></i>${ctx.nameOf(s)} · ${g.counts[s]}</button>`).join('')}</div>${back}`;
  if (d.target === 'rule') return g.rules.length ? `<p class="pick">Which rule goes?</p><div class="hr-row">${g.rules.map(c => `<button data-r="${c}">${hrCard(deck, c, 'sm')}</button>`).join('')}</div>${back}` : fizz;
  if (d.target === 'exchange') {
    const mine = g.keepers[you].filter(c => D(c).type === 'keeper');
    const theirs = keepersBy((s, c) => s !== you && D(c).type === 'keeper');
    if (!mine.length || !theirs) return fizz;
    if (!mineK) return `<p class="pick">Give away which of yours?</p><div class="hr-row">${mine.map(c => `<button data-m="${c}">${hrCard(deck, c, 'sm')}</button>`).join('')}</div>${back}`;
    return `<p class="pick">…for which of theirs?</p>${theirs}${back}`;
  }
  return '';
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, deck = g.deck;
  if (g.moveId !== lastMove) { lastMove = g.moveId; const src = g.temp?.cards?.[0] ? g.temp.cards : g.hand; if (sel && !src.includes(sel)) { sel = null; mineK = null; } if (!g.limit) picks = []; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Draw', g.draws);
  $('#hudC').innerHTML = `<span>Play</span><b>${g.plays >= 99 ? 'All' : g.plays}</b>`;
  setHud('#hudR', 'Hand', g.hand.length, g.handLimit != null ? `limit ${g.handLimit}` : '');
  const mine = g.toMove === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  const goals = `<div class="hr-goalbar"><small>Goal${g.goals.length > 1 ? 's' : ''}</small>${g.goals.length ? g.goals.map(x => hrCard(deck, x, 'sm')).join('') : '<em>none yet</em>'}</div>`;
  let body = '';
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, D(g.winGoal).name);
  else if (g.limit && g.limit.seat === you) {
    const keep = g.limit.what === 'keepers';
    setStatus(`Discard ${g.limit.n} ${keep ? 'Keeper' : 'card'}${g.limit.n > 1 ? 's' : ''}`, keep ? `Keeper limit is ${g.keeperLimit}` : `Hand limit is ${g.handLimit}`);
    const pool = keep ? g.keepers[you].filter(x => D(x).type === 'keeper') : g.hand;
    body = `<div class="hr-hand">${pool.map(x => `<button data-c="${x}" class="${picks.includes(x) ? 'sel' : ''}">${hrCard(deck, x)}</button>`).join('')}</div>
      <div class="row"><button class="panel-btn go" data-x="discard" ${picks.length === g.limit.n ? '' : 'disabled'}>Discard ${picks.length}/${g.limit.n}</button></div>`;
  } else if (g.limit) setStatus(`${c.nameOf(g.limit.seat)} is discarding`, '');
  else if (mine) setStatus(g.temp ? `Play the cards you drew (${g.temp.left})` : 'Your turn', g.temp ? 'They have to be played now' : `${g.plays >= 99 ? 'Play every card' : `Play ${g.plays - g.played} more`} · tap a card`);
  else setStatus(`${c.nameOf(g.turn)}'s turn`, 'Plan your next move');
  if (!g.limit || g.limit.seat !== you) {
    const src = mine && g.temp ? g.temp.cards : g.hand;
    const pick = mine && sel ? `<div class="hr-big">${hrCard(deck, sel, 'lg')}</div>${chooser(g, you)}` : '';
    body = `${pick}${mine && g.temp ? '<p class="pick">Just drawn — play these:</p>' : ''}<div class="hr-hand">${src.map(x => `<button data-c="${x}" class="${sel === x ? 'sel' : ''}" ${mine ? '' : 'tabindex="-1"'}>${hrCard(deck, x)}</button>`).join('')}</div>
      ${mine && g.temp ? `<p class="pick">Your hand</p><div class="hr-hand dim">${g.hand.map(x => hrCard(deck, x)).join('')}</div>` : ''}
      <div class="hr-mykeep"><small>Your Keepers</small>${g.keepers[you].map(x => hrCard(deck, x, 'sm')).join('') || '<em>none</em>'}</div>`;
  }
  el().innerHTML = goals + body;
  $('#panel').innerHTML = '';
  renderHand([]);
}
