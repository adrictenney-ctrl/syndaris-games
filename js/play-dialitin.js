// Dial It In on a phone. The Reader picks a spectrum, sees the secret target, and types a
// clue. Their teammates drag the needle (everyone on the team moves the same dial) and lock
// it in. The other team calls left or right.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=58';
import * as D from './dialitin.js?v=58';
import { dialSVG } from './table-dialitin.js?v=58';

let ctx = null, pick = null, draft = '', local = null, lastSent = 0, sendT = null, dragging = false, wasMyTurn = false, lastRound = -1;

export function reset() { pick = null; draft = ''; local = null; document.getElementById('diPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('diPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'diPhone';
    e.addEventListener('click', onClick);
    e.addEventListener('input', ev => { if (ev.target.id === 'diClue') draft = ev.target.value; });
    e.addEventListener('pointerdown', ev => { if (ev.target.closest('.di-live')) { dragging = true; ev.target.closest('.di-live').setPointerCapture?.(ev.pointerId); moveTo(ev); } });
    e.addEventListener('pointermove', ev => { if (dragging) moveTo(ev); });
    e.addEventListener('pointerup', () => { if (dragging) { dragging = false; flush(); } });
    $('#status').after(e);
  }
  return e;
}

// Turning the dial: follow the finger locally, and tell the table a few times a second.
function moveTo(ev) {
  const box = document.querySelector('.di-live svg').getBoundingClientRect();
  const sx = 212 / box.width, x = (ev.clientX - box.left) * sx - 6, y = (ev.clientY - box.top) * sx - 4;
  let deg = Math.atan2(100 - y, 100 - x) * 180 / Math.PI;
  if (deg < 0) deg = x < 100 ? 0 : 180;
  local = Math.max(0, Math.min(180, deg));
  document.querySelector('.di-live').innerHTML = dialSVG({ dial: local, target: null, ends: ctx.st.game.card });
  if (Date.now() - lastSent > 150) flush();
  else { clearTimeout(sendT); sendT = setTimeout(flush, 160); }
}
function flush() { if (local == null) return; lastSent = Date.now(); ctx.send({ type: 'dial', at: Math.round(local * 10) / 10 }); }

function onClick(ev) {
  const t = ev.target.closest('[data-x], [data-card], [data-side]');
  if (!t) return;
  if (t.dataset.card != null) { pick = Number(t.dataset.card); return render(ctx); }
  if (t.dataset.side) return ctx.send({ type: 'side', side: t.dataset.side });
  if (t.dataset.x === 'clue') { const v = document.getElementById('diClue')?.value || draft; ctx.send({ type: 'clue', clue: v, card: pick }); draft = ''; }
  if (t.dataset.x === 'lock') { flush(); ctx.send({ type: 'lock' }); }
  if (t.dataset.x === 'nudgeL' || t.dataset.x === 'nudgeR') {
    local = Math.max(0, Math.min(180, (local ?? ctx.st.game.dial) + (t.dataset.x === 'nudgeL' ? -1 : 1)));
    flush();
  }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  if (g.round !== lastRound) { lastRound = g.round; pick = g.offer ? g.offer[0].i : null; local = null; draft = ''; }
  if (pick == null && g.offer) pick = g.offer[0].i;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  if (g.coop) { setHud('#hudL', 'Score', g.scores[0]); $('#hudC').innerHTML = `<span>Round</span><b>${g.round}/${D.COOP_ROUNDS}</b>`; setHud('#hudR', null); }
  else { setHud('#hudL', '☀ Sun', g.scores[0]); setHud('#hudR', '☾ Moon', g.scores[1]); $('#hudC').innerHTML = `<span>You</span><b>${g.team[you] ? '☾ Moon' : '☀ Sun'}</b>`; }
  const reader = g.reader === you, myTeam = g.team[you] === g.teamUp;
  const guessing = g.phase === 'dial' && myTeam && !reader, calling = g.phase === 'side' && !myTeam;
  const mine = (g.phase === 'clue' && reader) || guessing || calling;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;
  if (!dragging && g.phase === 'dial' && local != null && Math.abs(local - g.dial) > 0.5 && Date.now() - lastSent > 600) local = null;

  let body = '';
  if (g.phase === 'over') setStatus(g.coop ? `${g.scores[0]} points together` : g.team[you] === g.winner ? '🏆 Your team wins!' : 'The other team wins', 'Look at the table to play again');
  else if (g.phase === 'clue' && reader) {
    setStatus('You are the Reader 🔮', 'Pick a spectrum, look at the target, give a clue');
    const ends = g.offer.find(o => o.i === pick)?.ends || g.offer[0].ends;
    body = `<div class="di-offer">${g.offer.map(o => `<button data-card="${o.i}" class="${o.i === pick ? 'on' : ''}">${o.ends[0]} ⟷ ${o.ends[1]}</button>`).join('')}</div>
      <div class="di-wrap">${dialSVG({ dial: g.target, target: g.target, ends })}</div>
      <div class="di-input"><input id="diClue" maxlength="60" placeholder="Your clue…" value="${draft.replace(/"/g, '&quot;')}" autocomplete="off"><button class="panel-btn go" data-x="clue">Give clue</button></div>
      <p class="di-tip">A word or a phrase that sits at that spot between the two ends. No numbers!</p>`;
  } else if (g.phase === 'clue') setStatus(`${c.nameOf(g.reader)} is thinking of a clue`, myTeam ? 'Get ready to turn the dial' : 'You get to call left or right later');
  else if (guessing) {
    setStatus(`“${g.clue}”`, 'Drag the needle together, then lock it in');
    body = `<div class="di-wrap di-live">${dialSVG({ dial: local ?? g.dial, target: null, ends: g.card })}</div>
      <div class="row"><button class="panel-btn" data-x="nudgeL">◀</button><button class="panel-btn go" data-x="lock">Lock it in 🔒</button><button class="panel-btn" data-x="nudgeR">▶</button></div>`;
  } else if (calling) {
    setStatus(`“${g.clue}”`, 'Is the target left or right of their needle?');
    body = `<div class="di-wrap">${dialSVG({ dial: g.dial, target: null, ends: g.card })}</div><div class="row"><button class="panel-btn go" data-side="L">◀ Left</button><button class="panel-btn go" data-side="R">Right ▶</button></div>`;
  } else if (g.phase === 'reveal') {
    setStatus(g.result.team === g.team[you] || g.coop ? `+${g.result.pts}${g.result.pts === 4 ? ' · bullseye!' : ''}` : `They got ${g.result.pts}`, g.side ? (g.result.sidePt ? 'Left/right call was right: +1' : 'Left/right call missed') : 'Next round starting…');
    body = `<div class="di-wrap">${dialSVG({ dial: g.dial, target: g.target, ends: g.card })}</div>`;
  } else {
    setStatus(reader ? 'Your team is turning the dial' : `“${g.clue}”`, reader ? 'No hints now — just watch!' : g.phase === 'side' ? 'The other team is calling left or right' : 'The other team is turning the dial');
    body = `<div class="di-wrap">${dialSVG({ dial: g.dial, target: reader ? g.target : null, ends: g.card })}</div>`;
  }
  // Keep the clue box (and the keyboard) alive while the Reader types.
  const e = el();
  if (document.activeElement?.id === 'diClue' && g.phase === 'clue' && reader && e.querySelector('#diClue')) {
    e.querySelector('.di-wrap').outerHTML = `<div class="di-wrap">${dialSVG({ dial: g.target, target: g.target, ends: g.offer.find(o => o.i === pick)?.ends || g.offer[0].ends })}</div>`;
  } else e.innerHTML = body;
  $('#panel').innerHTML = '';
  renderHand([]);
}
