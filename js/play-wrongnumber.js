// Wrong Number on a phone: your seven replies as message bubbles — tap one, then Send. When
// you're the Receiver, you pick your favourite of everyone's replies here.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=61';

let ctx = null, sel = null, wasMyTurn = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export function reset() { sel = null; document.getElementById('wnPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('wnPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'wnPhone';
    e.addEventListener('click', ev => {
      const t = ev.target.closest('[data-r], [data-i], [data-x]');
      if (!t) return;
      const g = ctx.st.game;
      if (t.dataset.r != null) { sel = Number(t.dataset.r); return render(ctx); }
      if (t.dataset.i != null) { sel = Number(t.dataset.i); return render(ctx); }
      if (t.dataset.x === 'send' && sel != null) { ctx.send(g.phase === 'judge' ? { type: 'pick', i: sel } : { type: 'reply', r: sel }); sel = null; navigator.vibrate?.(20); }
      if (t.dataset.x === 'swap') { sel = null; ctx.send({ type: 'swap' }); }
    });
    $('#status').after(e);
  }
  return e;
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  const recv = g.receiver === you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Points', g.score[you], `to ${g.target}`);
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b>`;
  setHud('#hudR', 'Receiver', recv ? 'You' : c.nameOf(g.receiver));
  const act = (g.phase === 'reply' && !recv && g.mine == null) || (g.phase === 'judge' && recv);
  document.body.classList.toggle('myturn', act);
  if (act && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = act;
  if (!act) sel = null;

  const prompt = `<div class="wn-msg in"><p>${esc(g.prompt)}</p></div>`;
  let body = '';
  if (g.phase === 'over') setStatus(g.pick.seat === you ? '🏆 You win!' : `${c.nameOf(g.pick.seat)} wins`, 'Look at the table to play again');
  else if (g.phase === 'won') setStatus(g.pick.seat === you ? 'Your reply won! +1' : `${c.nameOf(g.pick.seat)} wins the round`, 'Next text in a moment');
  else if (recv && g.phase === 'reply') setStatus("You're the Receiver", 'Everyone is replying to your text…');
  else if (recv) setStatus('Pick your favourite', 'Tap a reply, then choose it');
  else if (g.phase === 'reply' && g.mine == null) setStatus('Reply to the text', 'Tap your funniest reply, then Send');
  else setStatus('Sent!', g.phase === 'reply' ? 'Waiting for the others' : `${c.nameOf(g.receiver)} is choosing…`);

  if (g.phase === 'judge' && recv) {
    body = `<div class="wn-list">${g.replies.map((r, i) => `<button class="wn-msg out${sel === i ? ' sel' : ''}" data-i="${i}"><p>${esc(r)}</p></button>`).join('')}</div>`;
  } else if (!recv && g.phase === 'reply' && g.mine == null) {
    body = `<div class="wn-list">${g.hand.map(h => `<button class="wn-msg out${sel === h.r ? ' sel' : ''}" data-r="${h.r}"><p>${esc(h.text)}</p></button>`).join('')}</div>`;
  } else if (g.mine != null && g.phase === 'reply') {
    body = '<p class="wn-note">Your reply is in.</p>';
  }
  el().innerHTML = `<div class="wn-thread">${prompt}</div>${body}`;
  const p = $('#panel');
  if (act) p.innerHTML = `<div class="row"><button class="panel-btn go" data-x="send" ${sel != null ? '' : 'disabled'}>${recv ? 'Choose this reply' : 'Send'}</button>${!recv && g.swaps ? '<button class="panel-btn" data-x="swap">New phone (new hand)</button>' : ''}</div>`;
  else p.innerHTML = '';
  p.querySelectorAll('[data-x]').forEach(b => { b.onclick = () => {
    const cur = ctx.st.game;
    if (b.dataset.x === 'send' && sel != null) { ctx.send(cur.phase === 'judge' ? { type: 'pick', i: sel } : { type: 'reply', r: sel }); sel = null; navigator.vibrate?.(20); }
    if (b.dataset.x === 'swap') { sel = null; ctx.send({ type: 'swap' }); }
  }; });
  renderHand([]);
}
