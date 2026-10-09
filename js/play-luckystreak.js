// Lucky Streak on a phone: your row of cards, your chance of busting on the next flip, and
// two big buttons — Hit or Stay. When you draw a Halt or a Triple Dare, pick who gets it.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import * as L from './luckystreak.js?v=66';
import { lkCard } from './table-luckystreak.js?v=66';

let ctx = null, wasMyTurn = false;

export function reset() { document.getElementById('lkPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('lkPhone');
  if (!e) { e = document.createElement('div'); e.id = 'lkPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const t = ev.target.closest('[data-x], [data-t]');
  if (!t) return;
  if (t.dataset.t != null) ctx.send({ type: 'target', target: Number(t.dataset.t) });
  else ctx.send({ type: t.dataset.x });
  navigator.vibrate?.(15);
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, r = g.rows[you];
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Score', g.scores[you], `of ${g.target}`);
  $('#hudC').innerHTML = `<span>This round</span><b>${r.status === 'bust' ? '—' : r.pts}</b>`;
  const best = g.order.filter(s => s !== you).sort((a, b) => g.scores[b] - g.scores[a])[0];
  if (best != null) setHud('#hudR', c.nameOf(best), g.scores[best]);
  const mine = g.toMove === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  let actions = '';
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 You win!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, 'Look at the table to play again');
  else if (g.phase === 'scored') setStatus(`Round over · +${g.roundPts[you]}`, 'Next round coming up…');
  else if (g.need && g.need.seat === you) {
    setStatus(`You drew ${L.ACTIONS[g.need.kind].name}`, L.ACTIONS[g.need.kind].text);
    actions = `<div class="lk-targets">${g.order.filter(s => g.rows[s].status === 'in').map(s => `<button class="panel-btn" data-t="${s}"><i style="background:var(--seat-${s})"></i>${s === you ? 'Me' : c.nameOf(s)} · ${g.rows[s].pts}</button>`).join('')}</div>`;
  } else if (r.status === 'bust') setStatus('Bust 💥', 'Nothing this round — watch the others');
  else if (r.status === 'stay') setStatus(`Banked ${r.pts}`, 'Waiting for the round to finish');
  else if (g.dealing) setStatus('Dealing…', '');
  else if (mine) {
    setStatus('Hit or stay?', `${g.bust}% chance the next card busts you${r.charm ? ' · 🍀 you have a charm' : ''}`);
    actions = `<div class="row lk-btns"><button class="panel-btn go" data-x="hit">Hit</button><button class="panel-btn" data-x="stay" ${r.cards.length ? '' : 'disabled'}>Stay · bank ${r.pts}</button></div>`;
  } else setStatus(g.need ? `${c.nameOf(g.need.seat)} is picking a target` : `${c.nameOf(g.turn)}'s turn`, `Next flip: ${g.bust}% bust risk for you`);
  const nums = r.cards.filter(L.isNum).length;
  el().innerHTML = `<div class="lk-mine s-${r.status}">${r.cards.map(x => lkCard(x, x === r.bustCard ? 'bad' : '')).join('') || '<em>No cards yet</em>'}</div>
    <div class="lk-meter"><span>${nums}/7 different numbers</span><i style="width:${(nums / 7) * 100}%"></i></div>${actions}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
