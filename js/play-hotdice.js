// Hot Dice on a phone: roll, tap the scoring dice to keep (the points add up as you tap), then
// Roll again or Bank.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { dieHTML } from './table-yacht.js?v=68';
import { scoreSet } from './hotdice.js?v=68';

let ctx = null, keep = [], wasMyTurn = false, lastRoll = -1;
export function reset() { keep = []; document.getElementById('hdPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (g.rollId !== lastRoll) { lastRoll = g.rollId; keep = []; }
  const mine = (g.phase === 'start' || g.phase === 'choose') && g.turn === you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Score', g.scores[you].toLocaleString(), `to ${g.target.toLocaleString()}`);
  $('#hudC').innerHTML = g.turn === you ? `<span>This turn</span><b>${g.turnPts}</b>` : '';
  const lead = g.order.filter(s => s !== you).sort((a, b) => g.scores[b] - g.scores[a])[0];
  setHud('#hudR', c.nameOf(lead), g.scores[lead].toLocaleString());
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('hdPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hdPhone';
    el.addEventListener('click', e => {
      const st = ctx.st.game;
      if (!((st.phase === 'start' || st.phase === 'choose') && st.turn === ctx.st.you)) return;
      const d = e.target.closest('[data-i]');
      if (d) { const i = Number(d.dataset.i); keep = keep.includes(i) ? keep.filter(x => x !== i) : [...keep, i]; navigator.vibrate?.(8); return render(ctx); }
      const b = e.target.closest('[data-do]');
      if (b) { ctx.send({ type: b.dataset.do, keep }); navigator.vibrate?.(20); }
    });
    $('#status').after(el);
  }
  const pts = keep.length ? scoreSet(keep.map(i => g.dice[i])) : 0;
  const total = g.turnPts + Math.max(0, pts);
  const needEntry = g.scores[you] === 0 && total < g.entry;
  el.innerHTML = `${g.setAside.length ? `<div class="hd-kept">${g.setAside.map(v => dieHTML(v, 'held')).join('')}</div>` : ''}
    <div class="hd-roll">${g.dice.map((v, i) => `<button data-i="${i}" class="${keep.includes(i) ? 'kept' : ''}">${dieHTML(v)}</button>`).join('')}</div>
    ${g.turn === you && g.phase === 'choose' ? `<p class="hd-pts">${keep.length ? (pts > 0 ? `+${pts} · turn total ${total}` : 'Those dice don’t all score') : 'Tap the dice to keep'}</p>` : ''}
    ${mine ? (g.phase === 'start' ? '<button class="panel-btn go wide" data-do="roll">🎲 Roll six dice</button>'
      : `<div class="row"><button class="panel-btn go" data-do="roll" ${pts > 0 ? '' : 'disabled'}>Keep &amp; roll ${g.dice.length - keep.length || 6}</button><button class="panel-btn" data-do="bank" ${pts > 0 && !needEntry ? '' : 'disabled'}>Bank ${total}</button></div>`) : ''}`;
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 You win!' : 'Game over', 'Look at the table to play again');
  else if (g.phase === 'bust' && g.turn === you) setStatus('Bust! 💥', 'Nothing scored — your turn points are gone');
  else if (mine) setStatus(g.phase === 'start' ? 'Your turn' : 'Keep, then roll or bank', needEntry && g.phase === 'choose' ? `You need ${g.entry} in one turn to get on the board` : '');
  else setStatus(`${c.nameOf(g.turn)} is rolling`, g.endAt != null ? 'Last round!' : '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
