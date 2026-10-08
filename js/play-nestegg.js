// Nest Egg on a phone: your four cards. Tap one or two to pick them, then choose what to do:
// make a set, take the discard, challenge someone's top set, or discard. When you're
// challenged, the cards you can answer with light up.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=60';
import * as N from './nestegg.js?v=60';
import { neCard, stackHTML } from './table-nestegg.js?v=60';

let ctx = null, sel = [], picking = false, wasMyTurn = false, lastMove = -1;

export function reset() { sel = []; picking = false; document.getElementById('nePhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('nePhone');
  if (!e) { e = document.createElement('div'); e.id = 'nePhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}
const send = a => { ctx.send(a); sel = []; picking = false; navigator.vibrate?.(12); };

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-c], [data-x], [data-t]');
  if (!t) return;
  const mine = g.toMove === you;
  if (t.dataset.c) {
    const c = t.dataset.c;
    if (g.challenge) { if (mine && N.typeOf(c) && (N.typeOf(c) === g.challenge.type || N.isWild(c))) send({ type: 'answer', card: c }); else if (mine) toast(`Answer with a ${N.ASSETS[g.challenge.type].name} or a wild`); return; }
    sel = sel.includes(c) ? sel.filter(x => x !== c) : [...sel, c].slice(-2);
    picking = false;
    return render(ctx);
  }
  if (t.dataset.t != null) return send({ type: 'challenge', target: Number(t.dataset.t), card: sel[0] });
  const x = t.dataset.x;
  if (x === 'fold') return send({ type: 'fold' });
  if (!mine) return;
  if (x === 'pair') return send({ type: 'pair', cards: sel });
  if (x === 'take') return send({ type: 'take', card: sel[0] });
  if (x === 'discard') return send({ type: 'discard', card: sel[0] });
  if (x === 'challenge') { picking = !picking; return render(ctx); }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (g.moveId !== lastMove) { lastMove = g.moveId; sel = sel.filter(x => g.hand.includes(x)); picking = false; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Your nest egg', N.money(g.mine), `${g.stacks[you].sets} sets`);
  $('#hudC').innerHTML = `<span>Deck</span><b>${g.deck}</b>`;
  setHud('#hudR', 'Discard', g.top ? N.money(N.valueOf(g.top)) : '—', g.top ? N.ASSETS[N.typeOf(g.top)].name : '');

  const mine = g.toMove === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  const ch = g.challenge;
  const answerable = ch ? g.hand.filter(x => N.typeOf(x) === ch.type || N.isWild(x)) : [];
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 Richest nest egg!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, `Yours: ${N.money(g.totals[you])}`);
  else if (ch && ch.toMove === you) setStatus(ch.defender === you ? `${c.nameOf(ch.attacker)} wants your ${N.ASSETS[ch.type].name}s!` : `${c.nameOf(ch.defender)} fights back!`, answerable.length ? 'Tap a lit card to answer — or let it go' : 'Nothing to answer with');
  else if (ch) setStatus(`${c.nameOf(ch.attacker)} vs ${c.nameOf(ch.defender)}`, `Waiting for ${c.nameOf(ch.toMove)}`);
  else if (!mine) setStatus(`${c.nameOf(g.turn)}'s turn`, 'Plan your next set');
  else if (picking) setStatus('Challenge who?', 'Pick a player whose top set your card matches');
  else setStatus('Your turn', sel.length ? `${sel.length} picked` : 'Tap one or two cards');

  // What the selection allows.
  const pairT = sel.length === 2 ? N.pairType(sel[0], sel[1]) : null;
  const takeT = sel.length === 1 && g.top ? N.pairType(sel[0], g.top) : null;
  const targets = sel.length === 1 ? g.order.filter(s => s !== you && g.stacks[s].sets >= 2 && (N.isWild(sel[0]) || N.typeOf(sel[0]) === g.stacks[s].top.type)) : [];
  let actions = '';
  if (ch && ch.toMove === you) actions = `<div class="row"><button class="panel-btn" data-x="fold">Let it go</button></div>`;
  else if (mine && !ch && picking) actions = `<div class="ne-targets">${targets.map(s => `<button data-t="${s}"><b><i style="background:var(--seat-${s})"></i>${c.nameOf(s)}</b>${stackHTML(g.stacks[s])}</button>`).join('')}</div><div class="row"><button class="panel-btn" data-x="challenge">Back</button></div>`;
  else if (mine && !ch) actions = `<div class="row">
      <button class="panel-btn go" data-x="pair" ${pairT ? '' : 'disabled'}>Make a set</button>
      <button class="panel-btn go" data-x="take" ${takeT ? '' : 'disabled'}>Take the discard</button></div>
    <div class="row"><button class="panel-btn" data-x="challenge" ${targets.length ? '' : 'disabled'}>Challenge…</button>
      <button class="panel-btn" data-x="discard" ${sel.length === 1 ? '' : 'disabled'}>Discard</button></div>`;

  const others = g.order.filter(s => s !== you && g.stacks[s].sets).map(s => `<div class="ne-other"><b><i style="background:var(--seat-${s})"></i>${c.nameOf(s)}</b>${stackHTML(g.stacks[s])}</div>`).join('');
  el().innerHTML = `
    ${ch ? `<div class="ne-fightp">${ch.played.map(p => neCard(p.card, p.seat === ch.attacker ? 'atk' : 'def')).join('')}</div>` : `<div class="ne-strip"><div class="ne-dis">${g.top ? neCard(g.top) : '<div class="ne-card gone"></div>'}<small>Discard</small></div>${others ? `<div class="ne-others">${others}</div>` : ''}</div>`}
    <div class="ne-hand">${g.hand.map(x => `<button data-c="${x}" class="${sel.includes(x) ? 'sel' : ''}${ch && ch.toMove === you ? (answerable.includes(x) ? ' lit' : ' dim') : ''}">${neCard(x)}</button>`).join('')}</div>
    ${actions}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
