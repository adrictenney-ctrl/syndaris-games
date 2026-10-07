// I Doubt It on a player's phone: on your turn, tap 1–4 cards and lay them down as the rank
// that's up (true or not). When someone else lays cards, a big "I doubt it!" button counts down.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=55';
import { claimText, plural } from './doubt.js?v=55';

let ctx = null, picked = [], panelKey = '', wasMyTurn = false, tick = null;
let localFor = null, localDeadline = 0;   // the doubt clock, counted on this phone
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function reset() { picked = []; panelKey = ''; clearInterval(tick); tick = null; }

export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  $('#board').innerHTML = '';
}

function countdown() {
  const g = ctx?.st?.game;
  const b = document.getElementById('dbBtn');
  if (!g || !b || g.phase !== 'doubt') return;
  const left = Math.max(0, localDeadline - Date.now());
  b.style.setProperty('--left', String(left / (g.window * 1000)));
  b.querySelector('small').textContent = `${Math.ceil(left / 1000)}s`;
}

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  // The table's clock and ours may differ a little; count from when this update arrived.
  if (g.phase === 'doubt' && g.last && localFor !== g.last.id) { localFor = g.last.id; localDeadline = Date.now() + g.window * 1000 - 300; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Cards', g.hand.length);
  $('#hudC').innerHTML = `<span>Up now</span><b class="db-hud">${plural(g.required)}</b>`;
  setHud('#hudR', 'Pile', g.pile);

  const myTurn = g.phase === 'play' && g.turn === you;
  const canPlay = (g.phase === 'play' || g.phase === 'doubt') && g.turn === you;
  document.body.classList.toggle('myturn', canPlay);
  if (canPlay && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = canPlay;
  picked = picked.filter(x => g.hand.includes(x));
  if (!canPlay) picked = [];

  const L = g.last;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (g.phase === 'reveal') {
    const r = g.reveal;
    setStatus(r.truthful ? 'It was true!' : 'Caught lying!', `${r.taker === you ? 'You pick' : `${c.nameOf(r.taker)} picks`} up ${r.took} card${r.took === 1 ? "" : "s"}`);
  } else if (g.canDoubt) setStatus(`${c.nameOf(L.seat)}: “${claimText(L.n, L.claim)}”`, 'Believe it? Or doubt it…');
  else if (g.phase === 'doubt' && L?.seat === you) setStatus('Fingers crossed…', 'Waiting to see if anyone doubts you');
  else if (canPlay) setStatus(`Lay down ${plural(g.required)}`, picked.length ? `${picked.length} picked — true or not, it's your call` : 'Tap 1–4 cards. Lie if you have to.');
  else setStatus(`${c.nameOf(g.turn)}'s turn`, `They have to play ${plural(g.required)}`);

  const key = [g.phase, g.turn, g.canDoubt, L?.id, picked.join(','), canPlay].join('|');
  if (key !== panelKey) {
    panelKey = key;
    const p = $('#panel');
    p.innerHTML = '';
    if (g.canDoubt) {
      p.innerHTML = `<button class="db-doubt" id="dbBtn"><span>I doubt it!</span><small></small></button>`;
      $('#dbBtn').onclick = () => { ctx.send({ type: 'doubt' }); navigator.vibrate?.([40, 30, 80]); };
      clearInterval(tick); tick = setInterval(countdown, 100); countdown();
    } else clearInterval(tick);
    if (canPlay) {
      const n = picked.length;
      p.insertAdjacentHTML('beforeend', `<button class="panel-btn go wide" id="dbPlay" ${n ? '' : 'disabled'}>${n ? `Play as “${claimText(n, g.required)}”` : `Pick cards to play as ${plural(g.required)}`}</button>`);
      $('#dbPlay').onclick = () => {
        if (!picked.length) return;
        ctx.send({ type: 'play', cards: picked.slice() });
        picked = [];
        navigator.vibrate?.(20);
      };
    }
  }

  renderHand(g.hand, {
    dim: canPlay && picked.length >= 4 ? g.hand.filter(x => !picked.includes(x)) : null,
    onTap: card => {
      if (!canPlay) return;
      if (picked.includes(card)) picked = picked.filter(x => x !== card);
      else if (picked.length < 4) picked.push(card);
      else return toast('Four cards at most');
      panelKey = '';
      render(ctx);
    },
    hint: canPlay ? `Tap to pick · whatever you play counts as ${plural(g.required)}` : '',
  });
  // Lift the picked cards.
  document.querySelectorAll('#hand .card').forEach(ce => ce.classList.toggle('picked', picked.includes(ce.dataset.card)));
}
