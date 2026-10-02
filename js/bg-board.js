// The backgammon board, drawn the same way on the table and on phones.
// Layout from White's side: points 1–12 along the bottom (1 at the right), 13–24 along the
// top (13 at the left), the bar down the middle, bear-off trays on the right.
// Everything is sized in "u" units (one point's width); the caller sets --u on the board.

const FIELD_H = 11;           // units: two rows of points 5u tall with a 1u gap
const PIP = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]] };

const colOf = p => (p <= 12 ? 12 - p : p - 13);
const xOf = col => 0.4 + col + (col >= 6 ? 1 : 0);      // left edge of a point column, in u

export function buildBoard(el) {
  el.classList.add('bg-board');
  let pts = '';
  for (let p = 1; p <= 24; p++) {
    const top = p > 12;
    pts += `<div class="bg-pt ${top ? 'top' : 'bottom'} ${(p % 2) ? 'odd' : 'even'}" data-pt="${p}" data-tv tabindex="-1"
      style="left:calc(var(--u) * ${xOf(colOf(p))});${top ? 'top' : 'bottom'}:calc(var(--u) * .4)"><i></i></div>`;
  }
  el.innerHTML = `
    <div class="bg-frame">
      <div class="bg-field left"></div><div class="bg-field right"></div>
      ${pts}
      <div class="bg-bar" data-pt="bar" data-tv tabindex="-1"></div>
      <div class="bg-tray top"></div>
      <div class="bg-tray bottom" data-pt="off" data-tv tabindex="-1"></div>
      <div class="bg-checkers"></div>
      <div class="bg-dice"></div>
      <div class="bg-cube"></div>
    </div>`;
  return el;
}

const checker = (c, x, y, cls = '') => `<b class="ck ${c} ${cls}" style="left:calc(var(--u) * ${x});top:calc(var(--u) * ${y})"></b>`;

// data: { pos, turn, rolled, diceLeft, cube, cubeOwner, lastMoves, turnMoves, me }
// opts: { selected, sources: Set, targets: Set, showDice, offFor }  (point keys are strings: '7', 'bar', 'off')
export function drawBoard(el, data, opts = {}) {
  const { pos } = data;
  const d = 0.92;                  // checker diameter in u
  let html = '';
  for (let p = 1; p <= 24; p++) {
    const n = Math.abs(pos.b[p]);
    if (!n) continue;
    const c = pos.b[p] > 0 ? 'w' : 'b';
    const cx = xOf(colOf(p)) + 0.5;
    const step = n <= 5 ? d : (5 - d) / (n - 1);
    for (let i = 0; i < n; i++) {
      const y = p > 12 ? 0.4 + d / 2 + i * step : 0.4 + FIELD_H - d / 2 - i * step;
      html += checker(c, cx, y);
    }
  }
  // Checkers on the bar: White's in the bottom half, Black's in the top half.
  for (const [c, dir] of [['w', 1], ['b', -1]]) {
    for (let i = 0; i < pos.bar[c]; i++) html += checker(c, 6.9, 0.4 + FIELD_H / 2 + dir * (1.1 + i * 0.75), 'onbar');
  }
  // Borne-off checkers stack in the trays as slabs.
  for (const [c, top] of [['b', true], ['w', false]]) {
    for (let i = 0; i < pos.off[c]; i++) {
      const y = top ? 0.5 + i * 0.3 : 0.4 + FIELD_H - 0.4 - i * 0.3;
      html += `<b class="slab ${c}" style="left:calc(var(--u) * 13.5);top:calc(var(--u) * ${y})"></b>`;
    }
  }
  el.querySelector('.bg-checkers').innerHTML = html;

  // Highlights.
  const last = new Set();
  for (const m of (data.turnMoves?.length ? data.turnMoves : data.lastMoves) || []) { last.add(String(m.from)); last.add(String(m.to)); }
  el.querySelectorAll('[data-pt]').forEach(x => {
    const k = x.dataset.pt;
    x.classList.toggle('src', !!opts.sources?.has(k));
    x.classList.toggle('sel', opts.selected === k);
    x.classList.toggle('tgt', !!opts.targets?.has(k));
    x.classList.toggle('last', last.has(k));
  });

  // Dice for whoever is moving, on the right half of the board; used dice fade out.
  const dice = el.querySelector('.bg-dice');
  if (opts.showDice && data.rolled) {
    const left = (data.diceLeft || []).slice();
    const shown = data.rolled[0] === data.rolled[1] ? [data.rolled[0], data.rolled[0]] : data.rolled;
    dice.className = `bg-dice ${data.turn}`;
    dice.innerHTML = shown.map(v => {
      const i = left.indexOf(v);
      const used = i < 0;
      if (!used) left.splice(i, 1);
      return `<span class="die ${used ? 'used' : ''}">${PIP[v].map(([x, y]) => `<i style="left:${x}%;top:${y}%"></i>`).join('')}</span>`;
    }).join('') + (data.rolled[0] === data.rolled[1] && data.diceLeft ? `<em>×${data.diceLeft.length}</em>` : '');
  } else dice.innerHTML = '';

  // The doubling cube: in the middle of the bar until someone owns it.
  const cube = el.querySelector('.bg-cube');
  if (data.cubeOn === false) cube.hidden = true;
  else {
    cube.hidden = false;
    cube.textContent = data.cube > 1 ? data.cube : 64;
    cube.className = `bg-cube ${data.cubeOwner ? 'own-' + data.cubeOwner : ''}`;
  }
}

// Turn a tap on a point into either a selection or a move. Returns { selected, move }.
export function tap(target, view, selected) {
  const t = String(target);
  if (selected != null && view.targets[selected]?.[t]) return { selected: null, move: view.targets[selected][t] };
  if (view.targets[t]) return { selected: t, move: null };
  return { selected: null, move: null };
}
