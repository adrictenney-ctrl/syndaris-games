// Backgammon on a player's phone: the board turned to your side, tap a checker then a point.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=48';
import { buildBoard, drawBoard, tap } from './bg-board.js?v=48';

let ctx = null;
let selected = null;
let panelKey = '';
let wasMyTurn = false;
const NAME = { w: 'White', b: 'Black' };

export function reset() {
  selected = null;
  panelKey = '';
  document.getElementById('bgPhone')?.remove();
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · plays ${you === 0 ? 'White' : 'Black'}`;
  setHud('#hudL', null);
  setHud('#hudR', null);
  setHud('#hudC', null);
  document.getElementById('bgPhone')?.remove();
}

function boardEl() {
  let el = document.getElementById('bgPhone');
  if (!el) {
    el = buildBoard(document.createElement('div'));
    el.id = 'bgPhone';
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-pt]');
      if (!t) return;
      const v = ctx.st.game;
      if (v.phase !== 'move' || v.turn !== v.color) return;
      const r = tap(t.dataset.pt, v, selected);
      if (r.move) { selected = null; navigator.vibrate?.(15); ctx.send({ type: 'move', moves: r.move }); return; }
      selected = r.selected;
      draw(v);
    });
    $('#status').after(el);
  }
  // Fit the 15 × 11.8u board to the phone's width.
  const u = Math.floor(Math.min(innerWidth - 24, 520) / 15);
  el.style.setProperty('--u', u + 'px');
  return el;
}

function draw(v) {
  const el = boardEl();
  el.classList.toggle('flipped', v.color === 'b');
  const mine = v.turn === v.color && v.phase === 'move';
  if (mine && v.targets.bar && selected == null) selected = 'bar';
  if (!mine) selected = null;
  drawBoard(el, v, {
    selected,
    sources: new Set(mine ? Object.keys(v.targets) : []),
    targets: new Set(mine && selected != null && v.targets[selected] ? Object.keys(v.targets[selected]) : []),
    showDice: true,
  });
}

export function render(c) {
  ctx = c;
  const v = c.st.game;
  const you = c.st.you;
  const me = v.color, them = me === 'w' ? 'b' : 'w';
  const opp = you === 0 ? 1 : 0;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${NAME[me]} vs ${c.nameOf(opp)}`;
  setHud('#hudL', 'Your pips', v.pips[me], v.match > 1 ? `${v.score[me]} of ${v.match}` : '');
  $('#hudC').innerHTML = `<span>Cube</span><b>${v.cube}</b>`;
  setHud('#hudR', `${c.nameOf(opp)}`, v.pips[them], v.match > 1 ? `${v.score[them]} of ${v.match}` : 'pips');

  const myTurn = (v.phase === 'doubled' ? v.decider : v.turn) === me && !['gameOver', 'matchOver'].includes(v.phase);
  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;

  if (v.phase === 'matchOver' || v.phase === 'gameOver') {
    const won = v.result.winner === me;
    const kind = v.result.how === 'drop' ? 'double dropped' : v.result.kind;
    setStatus(won ? `🏆 You win · +${v.result.pts}` : `${c.nameOf(opp)} wins · +${v.result.pts}`, v.phase === 'matchOver' ? 'Look at the table for a rematch' : `${kind} · next game coming up`);
  } else if (v.phase === 'doubled') {
    setStatus(v.decider === me ? `Take the cube at ${v.cube * 2}?` : `${c.nameOf(opp)} is deciding…`, v.decider === me ? `Dropping now loses ${v.cube} point${v.cube > 1 ? 's' : ''}` : `You doubled to ${v.cube * 2}`);
  } else if (v.turn !== me) setStatus(`${c.nameOf(opp)}'s turn`, v.rolled ? `Rolled ${v.rolled[0]}-${v.rolled[1]}` : '');
  else if (v.phase === 'roll') setStatus('Your turn', v.canDouble ? 'Roll, or offer a double' : 'Roll the dice');
  else if (v.phase === 'nomove') setStatus(`${v.rolled[0]}-${v.rolled[1]} · no moves`, 'Your turn passes');
  else setStatus(`You rolled ${v.rolled[0]}-${v.rolled[1]}`, selected != null ? 'Now tap where it goes' : 'Tap a checker to move');

  draw(v);
  renderPanel(v, me);
  renderHand([]);
}

function renderPanel(v, me) {
  const k = [v.phase, v.turn, v.decider, v.canDouble, v.canUndo, v.cube].join('|');
  if (k === panelKey) return;
  panelKey = k;
  const p = $('#panel');
  p.innerHTML = '';
  const send = ctx.send;
  if (v.phase === 'doubled' && v.decider === me) {
    p.innerHTML = `<div class="row"><button class="panel-btn" id="drop">Drop (lose ${v.cube})</button><button class="panel-btn go" id="take">Take at ${v.cube * 2}</button></div>`;
    $('#drop').onclick = () => send({ type: 'drop' });
    $('#take').onclick = () => send({ type: 'take' });
    return;
  }
  if (v.turn !== me) return;
  if (v.phase === 'roll') {
    p.innerHTML = `<div class="row">${v.canDouble ? `<button class="panel-btn" id="double">Double to ${v.cube * 2}</button>` : ''}<button class="panel-btn go" id="roll">Roll</button></div>`;
    $('#roll').onclick = () => send({ type: 'roll' });
    $('#double')?.addEventListener('click', () => send({ type: 'double' }));
  } else if (v.phase === 'move' && v.canUndo) {
    p.innerHTML = '<button class="panel-btn wide" id="undo">Undo this turn</button>';
    $('#undo').onclick = () => { selected = null; send({ type: 'undo' }); };
  }
}
