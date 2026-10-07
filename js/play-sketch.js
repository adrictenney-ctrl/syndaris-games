// Sketch & Guess on a phone. The drawer gets a sketch pad (what they draw shows up on the
// table as they draw it); everyone else types their answer here.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=44';
import { PALETTE, SIZES, ERASER, PAD_W, PAD_H } from './sketch.js?v=44';
import { fitCanvas, paint, drawStroke } from './sketch-pad.js?v=44';

let ctx = null;
let panelKey = '';
let wasMyTurn = false;
let lastV = null;

// The clock: the table says how long is left; count down from when that arrived.
let endsAt = 0, tickT = null;

// The drawer's own copy of the drawing, so their pad never waits on the network.
let turnNo = -1;
let strokes = [];               // { id, c, w, p }
const removed = new Set();      // undone or cleared, even if an old update still has them
let pen = { c: 0, w: 1 };
let live = null;                // stroke being drawn: { st, sent }
let flushT = null;
let seq = 0;

export function reset() {
  panelKey = '';
  lastV = null;
  turnNo = -1;
  strokes = [];
  removed.clear();
  clearInterval(tickT);
  document.getElementById('skPhone')?.remove();
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', null);
  setHud('#hudR', null);
  setHud('#hudC', null);
  document.getElementById('skPhone')?.remove();
}

// ---------------------------------------------------------------- the pad

function padEl() {
  let el = document.getElementById('skPhone');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'skPhone';
  el.innerHTML = `
    <div class="sk-pad"><canvas></canvas></div>
    <div class="sk-tools">
      <div class="sk-colours">${PALETTE.map((c, i) => `<button data-c="${i}" class="${i === ERASER ? 'eraser' : ''}" style="--c:${c}" aria-label="${i === ERASER ? 'Eraser' : 'Colour'}"></button>`).join('')}</div>
      <div class="sk-sizes">${SIZES.map((s, i) => `<button data-w="${i}" aria-label="Size ${i + 1}"><i style="--s:${4 + i * 6}px"></i></button>`).join('')}
        <button data-do="undo">↶ Undo</button><button data-do="clear">Clear</button></div>
    </div>`;
  $('#status').after(el);
  const cv = el.querySelector('canvas');
  cv.addEventListener('pointerdown', down);
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  el.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { pen.c = Number(b.dataset.c); tools(); }; });
  el.querySelectorAll('[data-w]').forEach(b => { b.onclick = () => { pen.w = Number(b.dataset.w); tools(); }; });
  el.querySelector('[data-do="undo"]').onclick = undo;
  el.querySelector('[data-do="clear"]').onclick = clearAll;
  tools();
  return el;
}

function tools() {
  const el = document.getElementById('skPhone');
  if (!el) return;
  el.querySelectorAll('[data-c]').forEach(b => b.classList.toggle('on', Number(b.dataset.c) === pen.c));
  el.querySelectorAll('[data-w]').forEach(b => b.classList.toggle('on', Number(b.dataset.w) === pen.w));
}

function sizePad() {
  const el = padEl();
  const cv = el.querySelector('canvas');
  // As wide as the phone allows, but leave room for the tools and the status line.
  const byH = (innerHeight - 330) * PAD_W / PAD_H;
  const w = Math.floor(Math.max(220, Math.min(innerWidth - 20, 560, byH)));
  if (fitCanvas(cv, w)) redraw();
  el.querySelector('.sk-pad').style.width = w + 'px';
}

const canvas = () => document.querySelector('#skPhone canvas');

function redraw() {
  const cv = canvas();
  if (cv) paint(cv, strokes);
}

function at(e) {
  const r = canvas().getBoundingClientRect();
  return [
    Math.round(Math.min(PAD_W, Math.max(0, ((e.clientX - r.left) / r.width) * PAD_W))),
    Math.round(Math.min(PAD_H, Math.max(0, ((e.clientY - r.top) / r.height) * PAD_H))),
  ];
}

function canDraw() {
  return lastV && lastV.isDrawer && lastV.phase === 'draw';
}

function down(e) {
  if (!canDraw() || live) return;
  e.preventDefault();
  try { canvas().setPointerCapture(e.pointerId); } catch {}
  const st = { id: `${turnNo}-${Date.now().toString(36)}-${seq++}`, c: pen.c, w: pen.w, p: at(e) };
  strokes.push(st);
  live = { st, sent: 0, pointer: e.pointerId };
  drawStroke(canvas().getContext('2d'), st);
  flushT = setInterval(flush, 70);
}

function move(e) {
  if (!live || e.pointerId !== live.pointer) return;
  e.preventDefault();
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  const p = live.st.p;
  for (const ev of evs.length ? evs : [e]) {
    const [x, y] = at(ev);
    const dx = x - p[p.length - 2], dy = y - p[p.length - 1];
    if (dx * dx + dy * dy < 9) continue;
    p.push(x, y);
  }
  // Repainting only the end of the line keeps it smooth.
  drawStroke(canvas().getContext('2d'), live.st, Math.max(0, p.length - 8));
}

function up(e) {
  if (!live || (e && e.pointerId !== live.pointer)) return;
  clearInterval(flushT);
  const st = live.st;
  live = null;
  // Send the whole line once more, in case a piece got lost on the way.
  for (let i = 0; i < st.p.length; i += 1200) ctx.raw({ t: 'ink', s: st.id, c: st.c, w: st.w, i, p: st.p.slice(i, i + 1200), done: i === 0 && st.p.length <= 1200 });
  redraw();
}

function flush() {
  if (!live) return;
  const { st } = live;
  if (live.sent >= st.p.length) return;
  const from = live.sent;
  live.sent = st.p.length;
  ctx.raw({ t: 'ink', s: st.id, c: st.c, w: st.w, i: from, p: st.p.slice(from, from + 1200) });
}

function undo() {
  const st = strokes.pop();
  if (!st) return;
  removed.add(st.id);
  redraw();
  ctx.send({ type: 'undo', s: st.id });
}

function clearAll() {
  if (!strokes.length) return;
  strokes.forEach(s => removed.add(s.id));
  strokes = [];
  redraw();
  ctx.send({ type: 'clear' });
}

// Bring in anything the table has that this phone doesn't (after a reload, say).
function merge(ink) {
  if (!ink) return;
  let changed = false;
  for (const s of ink) {
    if (removed.has(s.id) || strokes.some(x => x.id === s.id)) continue;
    strokes.push(s);
    changed = true;
  }
  if (changed) redraw();
}

// ---------------------------------------------------------------- guessing

function guessBox() {
  const p = $('#panel');
  p.innerHTML = `
    <form class="sk-guess" autocomplete="off">
      <input id="skGuess" maxlength="40" placeholder="Type your answer" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send">
      <button class="panel-btn go" type="submit">Guess</button>
    </form>
    <div class="sk-mine" id="skMine"></div>`;
  p.querySelector('form').onsubmit = e => {
    e.preventDefault();
    const inp = $('#skGuess');
    const text = inp.value.trim();
    if (!text) return;
    ctx.send({ type: 'guess', text });
    inp.value = '';
    inp.focus();
  };
}

// ---------------------------------------------------------------- render

const clock = ms => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function showClock() {
  const left = Math.max(0, endsAt - Date.now());
  const v = lastV;
  if (!v) return;
  $('#hudC').innerHTML = v.phase === 'draw' ? `<span>Time</span><b class="${left < 10000 ? 'red' : ''}">${clock(left)}</b>` : `<span>Round</span><b>${v.round}/${v.rounds}</b>`;
}

export function render(c) {
  ctx = c;
  const v = c.st.game;
  lastV = v;
  const you = c.st.you;
  const drawerName = c.nameOf(v.drawer);
  if (v.turnNo !== turnNo) {
    turnNo = v.turnNo;
    strokes = [];
    removed.clear();
    live = null;
    clearInterval(flushT);
    panelKey = '';
  }
  endsAt = Date.now() + v.left;
  clearInterval(tickT);
  tickT = setInterval(showClock, 250);
  showClock();

  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const ranked = v.scores.map((s, i) => ({ s, i })).filter(x => v.seats[x.i]).sort((a, b) => b.s - a.s);
  setHud('#hudL', 'Your score', v.scores[you] || 0, '');
  const lead = ranked[0];
  setHud('#hudR', 'Leader', lead ? lead.s : 0, lead ? (lead.i === you ? 'you!' : c.nameOf(lead.i)) : '');

  const myTurn = v.isDrawer && ['pick', 'draw'].includes(v.phase);
  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;

  const drawing = v.isDrawer && v.phase === 'draw';
  document.body.classList.toggle('sk-drawing', drawing);
  if (drawing) { sizePad(); merge(v.ink); } else document.getElementById('skPhone')?.remove();

  // Status line.
  if (v.phase === 'over') {
    const won = v.winners?.includes(you);
    setStatus(won ? '🏆 You win!' : `${v.winners.map(i => c.nameOf(i)).join(' & ')} win${v.winners.length > 1 ? '' : 's'}`, `You scored ${v.scores[you] || 0} · look at the table`);
  } else if (v.phase === 'reveal') {
    const r = v.result;
    const a = r.answers[you];
    setStatus(`It was “${r.word}”`, r.drawer === you ? `${v.correct} got it · you scored ${r.drawerPts}` : a?.correct ? `You got it · +${a.pts}` : a?.answer ? `You said “${a.answer}”` : 'Answers are on the table');
  } else if (v.phase === 'pick') {
    setStatus(v.isDrawer ? 'Your turn to draw!' : `${drawerName} is choosing…`, v.isDrawer ? 'Pick a word. Only you can see these.' : 'Get ready to guess');
  } else if (v.isDrawer) {
    setStatus(v.word.toUpperCase(), `Draw it — no letters or numbers! ${v.correct} of ${v.guessers} got it`);
  } else if (v.my?.correct) {
    setStatus(`✓ ${v.word.toUpperCase()}`, `You got it! +${v.my.pts} · wait for the others`);
  } else {
    setStatus(v.blanks, `${drawerName} is drawing — watch the table`);
  }

  renderPanel(v, you);
  const mine = $('#skMine');
  if (mine) {
    mine.className = 'sk-mine' + (v.my?.close ? ' close' : '');
    mine.textContent = !v.my?.tries ? 'Guess as many times as you like. Your last answer shows on the table at the end.'
      : v.my.close ? `“${v.my.last}” — so close!` : `“${v.my.last}” — not it, keep going`;
  }
  renderHand([]);
}

function renderPanel(v, you) {
  const guessing = v.phase === 'draw' && !v.isDrawer && !v.my?.correct;
  const k = [v.turnNo, v.phase, v.isDrawer, guessing].join('|');
  if (k === panelKey) return;
  panelKey = k;
  const p = $('#panel');
  p.innerHTML = '';
  if (v.phase === 'pick' && v.isDrawer) {
    p.innerHTML = `<div class="sk-choices">${v.choices.map((ch, i) => `<button class="panel-btn sk-word" data-i="${i}">${ch.w}<small>${ch.level}</small></button>`).join('')}</div>`;
    p.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => ctx.send({ type: 'pick', i: Number(b.dataset.i) }); });
  } else if (v.phase === 'draw' && v.isDrawer) {
    p.innerHTML = '<button class="panel-btn sk-pass" id="skPass">Pass (skip this word)</button>';
    let armed = 0;
    $('#skPass').onclick = () => {
      if (Date.now() - armed < 3000) return ctx.send({ type: 'giveup' });
      armed = Date.now();
      $('#skPass').textContent = 'Tap again to pass';
    };
  } else if (guessing) {
    guessBox();
    setTimeout(() => $('#skGuess')?.focus(), 50);
  }
}

window.addEventListener('resize', () => { if (document.body.classList.contains('sk-drawing')) sizePad(); });
