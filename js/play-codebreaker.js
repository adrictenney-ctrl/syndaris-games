// Code Breaker on a phone: tap a slot, then a colour, to build four pegs — as the secret code
// (code-maker) or as your next guess (breaker). Your earlier guesses and their keys are listed.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=65';
import { peg, rowsHTML } from './table-codebreaker.js?v=65';
import { COLORS, PEGS } from './codebreaker.js?v=65';

let ctx = null, pegs = [null, null, null, null], slot = 0, wasMyTurn = false, lastKey = '';
export function reset() { pegs = [null, null, null, null]; slot = 0; document.getElementById('cbPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  const k = `${g.gameNo}:${g.round}:${g.stage}:${g.guesses.length}`;
  if (k !== lastKey) { lastKey = k; if (g.stage !== 'guess' || !g.guesses.length) pegs = [null, null, null, null]; slot = 0; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${g.maker === you ? 'code-maker 🔒' : 'breaker 🔍'}`;
  setHud('#hudL', 'You', g.points[you], 'points');
  $('#hudC').innerHTML = g.stage === 'guess' ? `<span>Try</span><b>${g.guesses.length + 1}</b><em>of ${g.tries}</em>` : '';
  setHud('#hudR', c.nameOf(opp), g.points[opp], 'points');
  const mine = g.phase === 'play' && g.p === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('cbPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cbPhone';
    $('#status').after(el);
    el.addEventListener('click', e => {
      const s = e.target.closest('[data-slot]');
      if (s) { slot = Number(s.dataset.slot); return render(ctx); }
      const col = e.target.closest('[data-col]');
      if (col) { pegs[slot] = Number(col.dataset.col); slot = (slot + 1) % PEGS; navigator.vibrate?.(8); return render(ctx); }
      if (e.target.closest('#cbGo')) {
        if (pegs.some(x => x == null)) return toast('Fill all four pegs');
        const st = ctx.st.game;
        ctx.send({ type: st.stage === 'set' ? 'set' : 'guess', pegs });
      }
    });
  }
  const input = mine ? `<div class="cb2-input">${pegs.map((x, i) => `<button data-slot="${i}" class="${i === slot ? 'on' : ''}">${peg(x)}</button>`).join('')}</div>
    <div class="cb2-pal">${COLORS.slice(0, g.colors).map((col, i) => `<button data-col="${i}">${peg(i)}</button>`).join('')}</div>
    <button class="panel-btn go wide" id="cbGo">${g.stage === 'set' ? 'Lock in my secret code' : 'Guess'}</button>` : '';
  const code = g.code ? `<div class="cb2-mycode"><small>${g.stage === 'reveal' ? 'The code was' : 'Your secret code'}</small>${g.code.map(x => peg(x)).join('')}</div>` : '';
  el.innerHTML = `${code}${input}${g.stage !== 'set' ? `<div class="cb2-rows small">${rowsHTML({ ...g, tries: Math.max(g.guesses.length, 1) })}</div>` : ''}`;
  if (g.phase === 'over') setStatus(g.champion === you ? '🏆 You win!' : g.champion == null ? 'A draw' : `${c.nameOf(opp)} wins`, 'Look at the table to play again');
  else if (g.phase === 'between') setStatus('Game over', 'Next game in a moment');
  else if (g.stage === 'set') setStatus(mine ? 'Set your secret code' : `${c.nameOf(opp)} is setting a code`, mine ? 'Tap a slot, then a colour' : 'Get ready to crack it');
  else if (g.stage === 'guess') setStatus(mine ? 'Your guess' : `${c.nameOf(opp)} is guessing`, mine ? 'Gold = right colour, right place · silver = right colour, wrong place' : '');
  else setStatus(g.guesses.at(-1)?.black === PEGS ? 'Cracked!' : 'Not cracked', '');
  $('#panel').innerHTML = '';
  renderHand([]);
}
