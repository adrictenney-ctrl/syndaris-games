// Backgammon on the table screen: a backgammon case open in the middle of the table.
// Checkers can be moved by tapping the board on the table (or with a TV remote), or from phones.
import * as B from './backgammon.js?v=64';
import { buildBoard, drawBoard, tap } from './bg-board.js?v=64';
import { snap } from './cards.js?v=64';

let boardEl = null, actionsEl = null;
let gameRef = null, ctxRef = null;
let selected = null;
let lastKey = '';

const NAME = { w: 'White', b: 'Black' };
const seatOf = c => (c === 'w' ? 0 : 1);

function view(g) {
  // The table acts for whoever's turn it is (or whoever has to answer a double).
  const actor = g.phase === 'doubled' ? g.decider : g.turn;
  return B.viewFor(g, seatOf(actor));
}

function onTap(target) {
  const g = gameRef, ctx = ctxRef;
  if (!g || g.phase !== 'move' || ctx.isBot(seatOf(g.turn))) return;
  const v = view(g);
  const r = tap(target, v, selected);
  if (r.move) {
    selected = null;
    ctx.act(seatOf(g.turn), { type: 'move', moves: r.move });
    snap(0.4);
    return;
  }
  selected = r.selected;
  draw(g);
}

function draw(g) {
  const v = view(g);
  const mine = !ctxRef.isBot(seatOf(g.turn));
  // The bar has to be cleared first, so pick it up automatically.
  if (v.targets.bar && selected == null && mine) selected = 'bar';
  const sources = new Set(mine ? Object.keys(v.targets) : []);
  const targets = new Set(selected != null && v.targets[selected] ? Object.keys(v.targets[selected]) : []);
  drawBoard(boardEl, { ...v, cubeOn: g.settings.cube }, { selected, sources, targets, showDice: true });
}

function renderActions(g, ctx) {
  const actor = g.phase === 'doubled' ? g.decider : g.turn;
  const seat = seatOf(actor);
  const v = view(g);
  const bot = ctx.isBot(seat);
  let html = '';
  if (!bot && !['gameOver', 'matchOver'].includes(g.phase)) {
    if (g.phase === 'roll') {
      html = `<button class="big" data-a="roll">Roll</button>${v.canDouble ? `<button class="big ghost" data-a="double">Double to ${g.cube * 2}</button>` : ''}`;
    } else if (g.phase === 'doubled') {
      html = `<p>${NAME[actor]}: take the cube at ${g.cube * 2}?</p><button class="big" data-a="take">Take</button><button class="big ghost" data-a="drop">Drop</button>`;
    } else if (g.phase === 'move' && v.canUndo) {
      html = '<button class="big ghost" data-a="undo">Undo</button>';
    } else if (g.phase === 'nomove') {
      html = '<p>No legal moves</p>';
    }
  }
  const k = [g.phase, actor, v.canDouble, v.canUndo, g.cube, bot, ctx.upright].join('|');
  if (k === lastKey) return;
  lastKey = k;
  actionsEl.innerHTML = html;
  actionsEl.className = `bg-actions ${actor} ${ctx.upright ? 'upright' : ''}`;
  actionsEl.querySelectorAll('[data-a]').forEach(b => {
    b.onclick = () => { selected = null; ctx.act(seat, { type: b.dataset.a }); };
  });
}

export default {
  defaults: { match: 3, cube: true },

  settingsHTML: s => `
    <label>Match <select data-set="match">${[1, 3, 5, 7].map(n => `<option value="${n}" ${n === s.match ? 'selected' : ''}>${n === 1 ? 'Single game' : `First to ${n}`}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-set="cube" ${s.cube ? 'checked' : ''}> Doubling cube</label>`,

  create: settings => B.createGame(settings),
  act: B.applyAction,
  bot: B.botAction,
  view: B.viewFor,
  turn: g => (g.phase === 'doubled' ? seatOf(g.decider) : ['roll', 'move', 'nomove'].includes(g.phase) ? seatOf(g.turn) : -1),
  timer(g) {
    if (g.phase === 'nomove') return { ms: 1800, run: () => B.advance(g) };
    if (g.phase === 'gameOver') return { ms: 7000, run: () => B.advance(g) };
    return null;
  },
  joinMidGame: () => false,

  plate(g, seat) {
    const c = B.seatColor(seat);
    const badges = [];
    if (g.cubeOwner === c) badges.push(`<span class="badge">cube ${g.cube}</span>`);
    if (g.phase === 'doubled' && g.decider === c) badges.push('<span class="badge alone">take or drop?</span>');
    const match = g.settings.match > 1 ? `<span><b>${g.score[c]}</b> of ${g.settings.match}</span>` : '';
    return {
      badges,
      meta: `<span><b>${B.pips(g.pos, c)}</b> pips</span>${match}<span>${g.pos.off[c]} off</span>`,
      cards: 0,
      turn: (g.phase === 'doubled' ? g.decider : g.turn) === c && !['gameOver', 'matchOver'].includes(g.phase),
      out: false,
    };
  },

  reset() {
    boardEl?.remove();
    actionsEl?.remove();
    boardEl = actionsEl = null;
    selected = null;
    lastKey = '';
  },

  renderCenter(g, ctx) {
    gameRef = g;
    ctxRef = ctx;
    document.getElementById('watermark').textContent = '';
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    // Board is 15u × 11.8u; fit it between the rail and the players' corners.
    const u = Math.floor(Math.min((felt.width - 2 * v * 27) / 15, (felt.height - 2 * v * 6) / 11.8));
    if (!boardEl) {
      boardEl = buildBoard(document.createElement('div'));
      boardEl.id = 'bgboard';
      boardEl.addEventListener('click', e => {
        const t = e.target.closest('[data-pt]');
        if (t) onTap(t.dataset.pt);
      });
      document.getElementById('center').appendChild(boardEl);
      actionsEl = document.createElement('div');
      actionsEl.className = 'bg-actions';
      document.getElementById('center').appendChild(actionsEl);
    }
    boardEl.style.setProperty('--u', u + 'px');
    boardEl.classList.toggle('flat-table', !ctx.upright);
    actionsEl.style.setProperty('--u', u + 'px');
    if (g.phase !== 'move') selected = null;
    draw(g);
    renderActions(g, ctx);
  },

  overlay(g, ctx) {
    if (!['gameOver', 'matchOver'].includes(g.phase)) return null;
    const r = g.result;
    const who = ctx.nameOf(seatOf(r.winner));
    const how = r.how === 'drop' ? 'The double was dropped' : r.kind === 'backgammon' ? 'Backgammon! (triple)' : r.kind === 'gammon' ? 'Gammon! (double)' : 'All checkers off';
    const score = g.settings.match > 1 ? `<p class="scoreline">${ctx.nameOf(0)} <b>${g.score.w}</b> — <b>${g.score.b}</b> ${ctx.nameOf(1)} · first to ${g.settings.match}</p>` : '';
    if (g.phase === 'matchOver') {
      return {
        key: 'match' + g.gameNo,
        html: `<h2>${who} wins${g.settings.match > 1 ? ' the match' : ''}</h2><p>${how} · +${r.pts}</p>${score}
          <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
      };
    }
    return {
      key: 'game' + g.gameNo,
      html: `<h2>${who} wins the game</h2><p>${how} · +${r.pts}</p>${score}
        <p class="hint">Next game in a moment… <button class="tool" data-do="next">Start now</button></p>`,
      next: () => { if (g.phase === 'gameOver') B.advance(g); },
    };
  },
};
