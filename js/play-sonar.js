// Sonar on a phone. Before the shooting starts: arrange your fleet (shuffle, or pick a ship,
// set it across or down, and tap where its front goes), then press Ready. During the game: the
// big grid is the other player's waters — tap to ping; your own fleet is shown underneath.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=60';
import { FLEET, N } from './sonar.js?v=60';
import { gridHTML, cellName } from './table-sonar.js?v=60';

let ctx = null, pick = 0, down = false, wasMyTurn = false;
export function reset() { pick = 0; down = false; document.getElementById('soPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('soPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'soPhone';
    e.addEventListener('click', onClick);
    $('#status').after(e);
  }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-cell], [data-k], [data-x]');
  if (!t) return;
  if (t.dataset.k != null) { pick = Number(t.dataset.k); return render(ctx); }
  const x = t.dataset.x;
  if (x === 'rotate') { down = !down; return render(ctx); }
  if (x === 'shuffle') return ctx.send({ type: 'shuffle' });
  if (x === 'ready') return ctx.send({ type: 'ready' });
  if (x === 'unready') return ctx.send({ type: 'unready' });
  if (x === 'resign') return ctx.send({ type: 'resign' });
  const cell = Number(t.dataset.cell);
  if (g.step === 'place' && t.closest('.place')) {
    if (g.ready[you]) return;
    ctx.send({ type: 'place', k: pick, r: Math.floor(cell / N), c: cell % N, down });
    pick = (pick + 1) % FLEET.length;
    return;
  }
  if (g.step === 'fire' && t.closest('.target')) {
    if (g.p !== you) return toast('Wait for your turn');
    if (g.foeShots[cell]) return toast('Already pinged there');
    ctx.send({ type: 'ping', cell });
    navigator.vibrate?.(20);
  }
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, opp = 1 - you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} vs ${c.nameOf(opp)}`;
  setHud('#hudL', 'Your fleet', FLEET.length - g.mySunk.length, 'afloat');
  $('#hudC').innerHTML = g.bestOf > 1 ? `<span>Games</span><b>${g.wins[you]}–${g.wins[opp]}</b>` : '';
  setHud('#hudR', c.nameOf(opp), FLEET.length - g.foeSunk.length, 'afloat');
  const mine = g.phase === 'play' && g.step === 'fire' && g.p === you;
  document.body.classList.toggle('myturn', mine || (g.step === 'place' && !g.ready[you]));
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;

  const e = el();
  if (g.phase === 'over' || g.phase === 'between') {
    const won = g.result?.winner === you;
    setStatus(g.phase === 'over' ? (g.champion === you ? '🏆 You win!' : `${c.nameOf(opp)} wins`) : won ? 'You sank them all!' : `${c.nameOf(opp)} sank your fleet`, g.phase === 'over' ? 'Look at the table to play again' : 'Next game in a moment');
    e.innerHTML = `<p class="pick">Their fleet</p>${gridHTML(g.foeShots, g.foeShips.map(s => s))}<p class="pick">Your fleet</p><div class="so-small">${gridHTML(g.myShots, g.myFleet, { mine: true })}</div>`;
    $('#panel').innerHTML = '';
  } else if (g.step === 'place') {
    if (g.ready[you]) setStatus('Ready!', `Waiting for ${c.nameOf(opp)} to hide their fleet`);
    else setStatus('Hide your fleet', `Pick a ship, then tap where its front goes · placing ${FLEET[pick].name} ${down ? 'down' : 'across'}`);
    e.innerHTML = `<div class="place${g.ready[you] ? ' locked' : ''}">${gridHTML({}, g.myFleet, { mine: true })}</div>
      ${g.ready[you] ? '' : `<div class="so-ships">${FLEET.map((f, k) => `<button data-k="${k}" class="${k === pick ? 'on' : ''}">${f.name}<small>${'■'.repeat(f.len)}</small></button>`).join('')}</div>`}`;
    $('#panel').innerHTML = g.ready[you] ? '<button class="panel-btn wide" data-x="unready">Change my fleet</button>'
      : `<div class="row"><button class="panel-btn" data-x="rotate">${down ? '↕ Down' : '↔ Across'}</button><button class="panel-btn" data-x="shuffle">Shuffle</button><button class="panel-btn go" data-x="ready">Ready</button></div>`;
    $('#panel').onclick = onClick;
  } else {
    const L = g.last;
    setStatus(mine ? 'Your ping' : `${c.nameOf(opp)} is aiming…`, L ? `${L.by === you ? 'You' : c.nameOf(opp)} pinged ${cellName(L.cell)} — ${L.sunk != null ? `sank the ${FLEET[L.sunk].name}!` : L.hit ? 'hit!' : 'miss'}` : 'Tap a square in their waters');
    e.innerHTML = `<p class="pick">${c.nameOf(opp)}'s waters</p><div class="target">${gridHTML(g.foeShots, g.foeShips, { pick: mine, last: L && L.by === you ? L.cell : null })}</div>
      <p class="pick">Your fleet</p><div class="so-small">${gridHTML(g.myShots, g.myFleet, { mine: true, last: L && L.by !== you ? L.cell : null })}</div>`;
    $('#panel').innerHTML = '<button class="panel-btn" data-x="resign">Resign</button>';
    $('#panel').onclick = onClick;
  }
  renderHand([]);
}
