// Go on a phone: the board (tap a point to play), Pass and Resign. When scoring, tap stones to
// mark them dead and accept the count.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=65';
import { stone, goSVG } from './table-go.js?v=65';

let ctx = null, wasMyTurn = false;
export function reset() { document.getElementById('goPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `${stone(c.st.you, 'small')} ${c.nameOf(c.st.you)} · ${c.st.you === 0 ? 'black' : 'white'}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  $('#whoami').innerHTML = `${stone(you, 'small')} ${c.nameOf(you)} vs ${c.nameOf(opp)}`;
  setHud('#hudL', 'Captured', g.caps[you]);
  $('#hudC').innerHTML = g.stage === 'score' && g.score ? `<span>Score</span><b>${you ? g.score.white : g.score.black}–${you ? g.score.black : g.score.white}</b>` : `<span>Komi</span><b>${g.komi}</b>`;
  setHud('#hudR', c.nameOf(opp), g.caps[opp], 'captured');
  const scoring = g.phase === 'play' && g.stage === 'score';
  const mine = g.phase === 'play' && ((g.stage === 'play' && g.p === you) || (scoring && !g.accept[you]));
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  if (g.phase === 'over') setStatus(g.champion === you ? '🏆 You win!' : `${c.nameOf(opp)} wins`, 'Look at the table to play again');
  else if (g.phase === 'between') setStatus(g.result.winner === you ? 'You win this one!' : `${c.nameOf(opp)} takes it`, 'Next game in a moment');
  else if (scoring) setStatus('Counting', g.accept[you] ? `Waiting for ${c.nameOf(opp)} to accept` : 'Tap dead stones, then accept');
  else setStatus(mine ? 'Your move' : `${c.nameOf(opp)} is thinking…`, g.passes && mine ? `${c.nameOf(opp)} passed — pass too to start counting` : '');
  let el = document.getElementById('goPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'goPhone';
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      const cur = ctx.st.game;
      if (!b || cur.phase !== 'play') return;
      if (cur.stage === 'score') return ctx.send({ type: 'dead', i: Number(b.dataset.i) });
      if (cur.p !== ctx.st.you) return;
      ctx.send({ type: 'move', i: Number(b.dataset.i) });
      navigator.vibrate?.(12);
    });
    $('#status').after(el);
  }
  el.innerHTML = goSVG(g);
  const p = $('#panel');
  if (scoring) p.innerHTML = `<div class="row"><button class="panel-btn go" id="goAcc" ${g.accept[you] ? 'disabled' : ''}>Accept score</button><button class="panel-btn" id="goRes">Keep playing</button></div>`;
  else p.innerHTML = mine ? '<div class="row"><button class="panel-btn" id="goPass">Pass</button><button class="panel-btn" id="goQuit">Resign</button></div>' : '';
  $('#goAcc')?.addEventListener('click', () => ctx.send({ type: 'accept' }));
  $('#goRes')?.addEventListener('click', () => ctx.send({ type: 'resume' }));
  $('#goPass')?.addEventListener('click', () => ctx.send({ type: 'pass' }));
  $('#goQuit')?.addEventListener('click', () => { if (confirm('Resign this game?')) ctx.send({ type: 'resign' }); });
  renderHand([]);
}
