// Field Agents on a phone. Handlers see the secret key and type a one-word clue with a number.
// Their teammates tap a word, then Guess — or stop when they've had enough.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=66';
import * as F from './fieldagents.js?v=66';
import { gridHTML } from './table-fieldagents.js?v=66';

let ctx = null, sel = null, num = 1, draft = '', wasMyTurn = false, lastMove = -1;

export function reset() { sel = null; num = 1; draft = ''; document.getElementById('faPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('faPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'faPhone';
    e.addEventListener('click', onClick);
    e.addEventListener('input', ev => { if (ev.target.id === 'faWord') draft = ev.target.value; });
    $('#status').after(e);
  }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game;
  const t = ev.target.closest('[data-i], [data-x], [data-n]');
  if (!t) return;
  if (t.dataset.n != null) { num = Number(t.dataset.n); return render(ctx); }
  if (t.dataset.i != null) { sel = Number(t.dataset.i); return render(ctx); }
  const x = t.dataset.x;
  if (x === 'clue') { ctx.send({ type: 'clue', word: document.getElementById('faWord')?.value || draft, n: num }); }
  if (x === 'guess' && sel != null) { ctx.send({ type: 'guess', i: sel }); sel = null; navigator.vibrate?.(20); }
  if (x === 'stop') ctx.send({ type: 'stop' });
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, t = g.team[you];
  if (g.moveId !== lastMove) { lastMove = g.moveId; if (sel != null && g.shown[sel]) sel = null; if (g.phase === 'guess') draft = ''; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', `${F.TEAM[0].ic} ${F.TEAM[0].name}`, g.left[0], 'to find');
  setHud('#hudR', `${F.TEAM[1].ic} ${F.TEAM[1].name}`, g.left[1], 'to find');
  $('#hudC').innerHTML = `<span>You</span><b class="fa-tm t${t}">${F.TEAM[t].name}${g.handler[t] === you ? ' 🕶' : ''}</b>`;
  const handler = g.handler[t] === you;
  const giving = g.phase === 'clue' && g.up === t && handler;
  const guessing = g.phase === 'guess' && g.up === t && !handler;
  const mine = giving || guessing;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  let top = '';
  if (g.phase === 'over') setStatus(g.winner === t ? '🏆 Your team wins!' : `Team ${F.TEAM[g.winner].name} wins`, g.how === 'double' ? 'Somebody found the Double Agent 💀' : 'All their agents were found');
  else if (giving) {
    setStatus('Give your team a clue', 'One word, and how many words it points to');
    top = `<div class="fa-input"><input id="faWord" maxlength="24" placeholder="One word…" autocomplete="off" autocapitalize="off" value="${draft.replace(/"/g, '&quot;')}"></div>
      <div class="fa-nums">${[1, 2, 3, 4, 5, 6, 0].map(n => `<button data-n="${n}" class="${n === num ? 'on' : ''}">${n || '∞'}</button>`).join('')}</div>
      <div class="row"><button class="panel-btn go" data-x="clue">Give clue</button></div>`;
  } else if (guessing) {
    setStatus(`“${g.clue.word}” · ${g.clue.n || '∞'}`, sel != null ? `Guess “${g.words[sel]}”?` : `Tap a word${g.guesses ? ` · ${g.guesses} guessed` : ''}`);
    top = `<div class="row"><button class="panel-btn go" data-x="guess" ${sel != null ? '' : 'disabled'}>${sel != null ? `Guess ${g.words[sel]}` : 'Guess'}</button>${g.guesses ? '<button class="panel-btn" data-x="stop">Stop · end turn</button>' : ''}</div>`;
  } else if (g.phase === 'clue') setStatus(`${F.TEAM[g.up].name}'s Handler is thinking`, g.up === t ? 'Get ready to guess' : 'Their turn');
  else setStatus(`${F.TEAM[g.up].name}: “${g.clue.word}” · ${g.clue.n || '∞'}`, handler && g.up === t ? 'Keep a straight face! 😐' : 'Their turn — watch and plan');
  const keepInput = document.activeElement?.id === 'faWord' && giving && document.getElementById('faWord');
  if (keepInput) { el().querySelector('.fa-grid').outerHTML = gridHTML(g, { hint: handler }); }
  else el().innerHTML = `${top}${gridHTML(g, { hint: handler || g.phase === 'over', tap: guessing, sel })}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
