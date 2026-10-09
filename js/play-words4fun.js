// Words 4 Fun on a phone: the letter grid. Drag a finger across touching tiles (or tap them one
// by one) to spell a word, then press Enter to score it and start the next. A ding means you're
// the first to find that word. Your words are listed underneath.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { tile, fmt } from './table-words4fun.js?v=68';
import { adjacent, team, TEAM_NAME } from './words4fun.js?v=68';
import { ding, buzzer, beep } from './sfx.js?v=68';

let ctx = null, path = [], tracing = false, gridKey = '', clockT = null, goAt = 0, endAt = 0, lastMine = 0, lastPhase = '', lastBeep = -1;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function reset() { document.getElementById('wfPhone')?.remove(); path = []; gridKey = ''; clearInterval(clockT); clockT = null; lastMine = -1; lastPhase = ''; }
export function renderLobby(c) {
  const t = team(c.st.you);
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)} · ${t ? '☾' : '☀'} ${TEAM_NAME[t]}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('wfPhone');
  if (!e) {
    e = document.createElement('div');
    e.id = 'wfPhone';
    e.innerHTML = '<div class="wf-clock"></div><div class="wf-word"></div><div class="wf-gridwrap"></div><div class="wf-keys"></div><div class="wf-mine"></div>';
    $('#status').after(e);
    const wrap = e.querySelector('.wf-gridwrap');
    wrap.addEventListener('pointerdown', down);
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', () => { tracing = false; });
    wrap.addEventListener('pointercancel', () => { tracing = false; });
    e.querySelector('.wf-keys').addEventListener('click', ev => {
      const b = ev.target.closest('[data-k]');
      if (!b) return;
      if (b.dataset.k === 'enter') submit();
      else if (b.dataset.k === 'back') { path.pop(); paint(); }
      else if (b.dataset.k === 'clear') { path = []; paint(); }
      else ctx.send({ type: b.dataset.k });
    });
  }
  return e;
}

// Which tile is under the finger? `inner` only counts the middle of a tile, so a diagonal
// drag doesn't catch the corners of its neighbours.
function cellAt(ev, inner) {
  const tiles = [...document.querySelectorAll('#wfPhone .wf-grid .wf-tile')];
  for (let i = 0; i < tiles.length; i++) {
    const r = tiles[i].getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (inner ? Math.hypot(ev.clientX - cx, ev.clientY - cy) < r.width * 0.42 : ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) return i;
  }
  return null;
}
const playing = () => ctx?.st.game?.phase === 'play';

function down(ev) {
  if (!playing()) return;
  const i = cellAt(ev, false);
  if (i == null) return;
  ev.preventDefault();
  const n = ctx.st.game.n, last = path[path.length - 1];
  if (i === last) { /* keep going from here */ }
  else if (path.length && !path.includes(i) && adjacent(n, last, i)) path.push(i);
  else path = [i];
  tracing = true;
  try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
  navigator.vibrate?.(6);
  paint();
}
function move(ev) {
  if (!tracing || !playing()) return;
  const i = cellAt(ev, true);
  if (i == null) return;
  const n = ctx.st.game.n, last = path[path.length - 1];
  if (i === last) return;
  if (i === path[path.length - 2]) path.pop();
  else if (!path.includes(i) && adjacent(n, last, i)) { path.push(i); navigator.vibrate?.(6); }
  else return;
  paint();
}
function submit() {
  if (!playing() || path.length < 3) return;
  ctx.send({ type: 'word', path });
  path = [];
  paint();
}

function paint() {
  const e = document.getElementById('wfPhone'), g = ctx?.st.game;
  if (!e || !g) return;
  e.querySelectorAll('.wf-grid .wf-tile').forEach((t, i) => {
    t.classList.toggle('on', path.includes(i));
    t.classList.toggle('head', path[path.length - 1] === i);
  });
  const w = path.map(i => g.grid[i]).join('').toUpperCase();
  e.querySelector('.wf-word').innerHTML = w ? `<b>${w}</b>` : `<span>${playing() ? 'Trace a word' : ''}</span>`;
  const k = e.querySelector('.wf-keys [data-k="enter"]');
  if (k) k.disabled = path.length < 3;
}

function paintClock() {
  const e = document.getElementById('wfPhone'), g = ctx?.st.game;
  if (!e || !g) return;
  const c = e.querySelector('.wf-clock');
  if (g.phase === 'count') {
    const n = goAt ? Math.ceil((goAt - Date.now()) / 1000) : null;
    c.innerHTML = n == null ? '<small>Get ready…</small>' : `<b class="cd">${Math.max(1, n)}</b>`;
    if (n != null && n > 0 && n <= 3 && n !== lastBeep) { lastBeep = n; beep(); }
  } else if (g.phase === 'play') {
    const left = endAt - Date.now();
    c.innerHTML = `<b class="${left < 15000 ? 'low' : ''}">${fmt(left)}</b>`;
  } else c.innerHTML = '<b class="done">Time!</b>';
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, t = team(you);
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${t ? '☾' : '☀'} ${TEAM_NAME[t]}`;
  setHud('#hudL', TEAM_NAME[t], g.teamScores[t]);
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b>`;
  if (g.order.some(s => team(s) !== t)) setHud('#hudR', TEAM_NAME[1 - t], g.teamScores[1 - t]); else setHud('#hudR', null);
  if (g.goIn != null) goAt = Date.now() + g.goIn;
  if (g.left != null) endAt = Date.now() + g.left;
  if (!clockT) clockT = setInterval(paintClock, 200);
  if (g.phase !== lastPhase) {
    if (g.phase === 'play' && lastPhase === 'count') { buzzer(); navigator.vibrate?.(300); }
    if ((g.phase === 'scored' || g.phase === 'over') && lastPhase === 'play') { buzzer(); navigator.vibrate?.([200, 100, 200]); }
    if (g.phase !== 'play') { path = []; tracing = false; }
    lastPhase = g.phase;
  }
  if (g.mine.length > lastMine && lastMine >= 0 && g.phase === 'play') {
    const w = g.mine[g.mine.length - 1];
    if (w.first) { ding(); navigator.vibrate?.([30, 40, 30]); }
  }
  lastMine = g.mine.length;
  document.body.classList.toggle('myturn', g.phase === 'play');

  const e = el();
  const gk = g.round + ':' + g.grid.join('');
  if (gk !== gridKey) {
    gridKey = gk;
    path = [];
    e.querySelector('.wf-gridwrap').innerHTML = `<div class="wf-grid n${g.n}">${g.grid.map(x => tile(x)).join('')}</div>`;
  }
  e.querySelector('.wf-grid').classList.toggle('hide', g.phase === 'count');
  e.classList.toggle('playing', g.phase === 'play');

  const keys = e.querySelector('.wf-keys');
  if (g.phase === 'play') {
    if (!keys.querySelector('[data-k="enter"]')) keys.innerHTML = '<button class="panel-btn" data-k="clear">Clear</button><button class="panel-btn" data-k="back">⌫</button><button class="panel-btn go" data-k="enter">Enter ⏎</button>';
  } else if (g.phase === 'scored') keys.innerHTML = '<button class="panel-btn go" data-k="next">Next round ▶</button>';
  else keys.innerHTML = '';

  if (g.results) {

    e.querySelector('.wf-mine').innerHTML = `<p class="wf-sum">${TEAM_NAME[t]} <b>+${g.results.add[t]}</b>${g.order.some(s => team(s) !== t) ? ` · ${TEAM_NAME[1 - t]} <b>+${g.results.add[1 - t]}</b>` : ''}</p>
      <ul>${g.results.teams[t].map(r => `<li class="${r.cancelled ? 'x' : ''} ${r.by === you || r.first === you ? 'me' : ''}">${esc(r.w)}<em>${r.cancelled ? '✕' : r.pts + (r.bonus ? '+2' : '')}</em></li>`).join('')}</ul>`;
  } else {
    e.querySelector('.wf-mine').innerHTML = g.mine.length ? `<p class="wf-sum">Your words · ${g.mine.length}</p><ul>${g.mine.slice().reverse().map(m => `<li class="${m.first ? 'first' : ''}">${esc(m.w)}${m.first ? '<em>★</em>' : ''}</li>`).join('')}</ul>` : '';
  }

  if (g.phase === 'count') setStatus('Get ready!', 'The letters appear when the buzzer sounds');
  else if (g.phase === 'play') setStatus('Find words!', 'Drag across touching tiles, then press Enter · ★ = you found it first');
  else if (g.phase === 'scored') setStatus("Time's up!", 'Words both teams found are cancelled ✕');
  else setStatus(g.winner == null ? "It's a tie!" : g.winner === t ? '🏆 Your team wins!' : `${TEAM_NAME[g.winner]} wins`, 'Look at the table to play again');
  paint();
  paintClock();
  $('#panel').innerHTML = '';
  renderHand([]);
}
