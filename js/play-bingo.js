// Bingo on a phone: your card (tap numbers to daub them if auto-daub is off) and a big BINGO
// button for when your pattern is complete.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import { LETTER } from './bingo.js?v=66';
import { ding } from './sfx.js?v=66';

let lastBall = null;
export function reset() { document.getElementById('bgPhone')?.remove(); lastBall = null; }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  const g = c.st.game, you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Called', g.called.length);
  $('#hudC').innerHTML = g.last ? `<span>${LETTER(g.last)}</span><b>${g.last}</b>` : '';
  setHud('#hudR', 'To win', { line: 'A line', corners: 'Corners', full: 'Full card' }[g.pattern]);
  if (g.last !== lastBall) { if (lastBall !== null && g.card.includes(g.last)) { ding(); navigator.vibrate?.(30); } lastBall = g.last; }
  let el = document.getElementById('bgPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bgPhone';
    el.addEventListener('click', e => {
      const d = e.target.closest('[data-n]');
      if (d) { c.send({ type: 'daub', n: Number(d.dataset.n) }); navigator.vibrate?.(8); return; }
      if (e.target.closest('#bgBingo')) { c.send({ type: 'bingo' }); navigator.vibrate?.([80, 40, 80]); }
    });
    $('#status').after(el);
  }
  el.innerHTML = `<div class="bg-card"><div class="bg-head">${'BINGO'.split('').map(L => `<b>${L}</b>`).join('')}</div>
    <div class="bg-grid">${g.card.map(n => n === 0 ? '<span class="free">★</span>' : `<button data-n="${n}" class="${g.daubs.includes(n) ? 'daub' : ''}">${n}</button>`).join('')}</div></div>
    <button id="bgBingo" class="bg-btn" ${g.phase === 'play' && !g.penalty && !g.winners.includes(you) ? '' : 'disabled'}>BINGO!</button>`;
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🎉 You won!' : g.winners.length ? 'Somebody else got it' : 'No winner', 'Look at the table');
  else if (g.winners.includes(you)) setStatus('BINGO! 🎉', 'Waiting for the round to close');
  else if (g.penalty) setStatus('False call!', `Sit out ${g.penalty} more ball${g.penalty > 1 ? 's' : ''}`);
  else setStatus(g.last ? `${LETTER(g.last)} ${g.last}` : 'Get ready…', g.auto ? 'Your card daubs itself — shout BINGO when you’ve got it' : 'Tap the called numbers on your card');
  $('#panel').innerHTML = '';
  renderHand([]);
}
