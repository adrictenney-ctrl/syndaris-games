// The table: the shared screen in the middle. Hosts the game, the lobby and the seats.
// Game-specific rules and drawing live in table-<game>.js modules.
import { GAMES, SIDE_ROT } from './games.js?v=17';
import { cardEl, snap, keepAwake } from './cards.js?v=17';
import { hostRoom } from './net.js?v=17';
import euchre from './table-euchre.js?v=17';
import holdem from './table-poker.js?v=17';
import veto from './table-veto.js?v=17';
import gofish from './table-gofish.js?v=17';
import chess from './table-chess.js?v=17';
import backgammon from './table-backgammon.js?v=17';

const MODES = { euchre, holdem, veto, gofish, chess, backgammon };
const STORE = 'syndaris.table.v2';
const BOT_NAMES = ['Dot', 'Rook', 'Bixby', 'Clank', 'Pixel', 'Gizmo', 'Sprocket', 'Widget'];
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const $ = s => document.querySelector(s);

const newRoom = () => Array.from({ length: 4 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join('');

function freshSession(room) {
  return {
    room: room || newRoom(),
    gameId: 'euchre',
    players: new Array(GAMES.euchre.layout.length).fill(null),
    settings: Object.fromEntries(Object.entries(MODES).map(([id, m]) => [id, { ...m.defaults }])),
    game: null,
  };
}

let session = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (s && s.room && GAMES[s.gameId] && Array.isArray(s.players)) {
      s.players.forEach(p => { if (p && !p.bot) p.connected = false; });
      s.settings = s.settings || {};
      for (const id in MODES) s.settings[id] = { ...MODES[id].defaults, ...s.settings[id] };
      return s;
    }
  } catch {}
  return freshSession();
})();

// How big cards are drawn on the table (the slider in the corner), remembered on this device.
let cardScale = 1;
try { cardScale = Math.min(1.8, Math.max(0.8, Number(localStorage.getItem('pod.cardScale')) || 1)); } catch {}
document.documentElement.style.setProperty('--card-scale', cardScale);

let upright = false;
try {
  const saved = localStorage.getItem('syndaris.table.upright');
  // A TV stands up, so it starts in Upright mode unless someone changed it.
  upright = saved === null ? document.documentElement.classList.contains('tv') : saved === '1';
} catch {}

const mode = () => MODES[session.gameId];
const info = () => GAMES[session.gameId];
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(session)); } catch {} };
const seatOf = pid => session.players.findIndex(p => p && p.id === pid);
const nameOf = seat => session.players[seat]?.name || info().layout[seat]?.name || '?';
const clients = new Map(); // pid -> { name, lastSeen }

// ---------------------------------------------------------------- networking

const net = hostRoom(session.room, {
  onStatus(s) {
    const el = $('#netstatus');
    el.className = 'pill ' + (s === 'online' ? 'ok' : 'bad');
    el.textContent = {
      online: `Room ${session.room}`, connecting: 'Connecting…', reconnecting: 'Reconnecting…', waiting: 'Opening room…',
    }[s] || s;
  },
  onMessage,
  onLeave(pid) {
    clients.delete(pid);
    const s = seatOf(pid);
    if (s >= 0) { session.players[s].connected = false; update(); }
  },
});

function onMessage(pid, msg) {
  const seat = seatOf(pid);
  const c = clients.get(pid);
  if (c) c.lastSeen = Date.now();
  switch (msg.t) {
    case 'hello': {
      const name = cleanName(msg.name);
      clients.set(pid, { name, lastSeen: Date.now() });
      if (seat >= 0) Object.assign(session.players[seat], { connected: true, name: name || session.players[seat].name });
      update();
      break;
    }
    case 'ping':
      net.send(pid, { t: 'pong' });
      if (seat >= 0 && !session.players[seat].connected) { session.players[seat].connected = true; update(); }
      break;
    case 'sit': claimSeat(pid, msg.seat); break;
    case 'leave':
      if (seat >= 0 && !session.game) { session.players[seat] = null; update(); }
      break;
    case 'act': {
      const g = session.game;
      if (!g || seat < 0) return;
      const err = mode().act(g, seat, msg.action);
      if (err) net.send(pid, { t: 'error', msg: err });
      else update();
      break;
    }
  }
}

function cleanName(n) {
  return String(n || '').replace(/[<>&"]/g, '').trim().slice(0, 14);
}

function claimSeat(pid, s) {
  if (!(s >= 0 && s < session.players.length)) return;
  const cur = session.players[s];
  const mine = seatOf(pid);
  if (mine === s) return;
  if (cur && !cur.bot && cur.connected) return net.send(pid, { t: 'error', msg: 'Someone is already sitting there' });
  if (session.game && mine >= 0) return net.send(pid, { t: 'error', msg: "You can't switch seats in the middle of a game" });
  if (session.game && !cur && !mode().joinMidGame(session.game, s)) return net.send(pid, { t: 'error', msg: 'Wait for the next game to sit there' });
  if (mine >= 0) session.players[mine] = null;
  const name = clients.get(pid)?.name || 'Player';
  session.players[s] = { id: pid, name, bot: false, connected: true };
  update();
}

function stateFor(pid) {
  const seat = seatOf(pid);
  const g = session.game;
  return {
    t: 'state',
    room: session.room,
    gameId: session.gameId,
    seats: session.players.map(p => p && { name: p.name, bot: !!p.bot, connected: !!p.connected }),
    started: !!g,
    you: seat >= 0 ? seat : null,
    game: g && seat >= 0 ? mode().view(g, seat) : null,
  };
}

function broadcast() {
  for (const pid of net.clients()) net.send(pid, stateFor(pid));
}

// Mark players whose phones went quiet (screen locked, walked away).
setInterval(() => {
  let changed = false;
  for (const p of session.players) {
    if (!p || p.bot || !p.connected) continue;
    const c = clients.get(p.id);
    if (!c || Date.now() - c.lastSeen > 15000) { p.connected = false; changed = true; }
  }
  if (changed) update();
}, 5000);

// ---------------------------------------------------------------- game driving

let autoTimer = null;
function automate() {
  clearTimeout(autoTimer);
  const g = session.game;
  if (!g) return;
  const t = mode().timer(g, session.players);
  if (t) { autoTimer = setTimeout(() => { t.run(); update(); }, t.ms); return; }
  const turn = mode().turn(g);
  if (turn >= 0 && session.players[turn]?.bot) {
    autoTimer = setTimeout(() => {
      const err = mode().act(g, turn, mode().bot(g, turn));
      if (err) console.warn('bot move rejected:', err);
      update();
    }, 850 + Math.random() * 600);
  }
}

function update() {
  save();
  render();
  broadcast();
  automate();
}

function startGame() {
  const n = session.players.filter(Boolean).length;
  if (n < info().min || n > info().max) return;
  snap(0.01); // unlocks audio on iOS while we have a user gesture
  keepAwake();
  mode().reset();
  session.game = mode().create(session.settings[session.gameId], session.players);
  update();
}

function endGame() {
  session.game = null;
  mode().reset();
  update();
}

// Switching games: move everyone to the nearest seat in the new layout.
function remapPlayers(players, oldLayout, newLayout) {
  const seated = players.map((p, i) => p && { p, at: oldLayout[i] }).filter(x => x && x.at);
  const next = new Array(newLayout.length).fill(null);
  for (const { p, at } of seated) {
    let best = -1, bestD = Infinity;
    newLayout.forEach((L, i) => {
      if (next[i]) return;
      const d = (L.x - at.x) ** 2 + (L.y - at.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) next[best] = p;
  }
  return next;
}

// ---------------------------------------------------------------- rendering

let seatEls = [];
function buildSeats() {
  seatEls.forEach(el => el.remove());
  seatEls = info().layout.map((L, pos) => {
    const el = $('#seatTpl').content.firstElementChild.cloneNode(true);
    el.classList.add('side-' + L.side);
    el.style.setProperty('--x', L.x + '%');
    el.style.setProperty('--y', L.y + '%');
    el.style.setProperty('--seat-color', `var(--seat-${pos})`);
    el.querySelector('.addbot').onclick = () => {
      const used = session.players.filter(Boolean).map(p => p.name);
      const name = BOT_NAMES.find(n => !used.includes(n)) || 'Bot';
      if (session.game && !mode().joinMidGame(session.game, pos)) return;
      session.players[pos] = { id: 'bot-' + pos + '-' + Date.now(), name, bot: true, connected: true };
      update();
    };
    el.querySelector('.kick').onclick = () => { session.players[pos] = null; update(); };
    el.querySelector('.takeover').onclick = () => {
      const p = session.players[pos];
      if (p) { p.bot = true; p.connected = true; p.name += ' 🤖'; update(); }
    };
    $('#felt').appendChild(el);
    return el;
  });
  document.body.dataset.game = session.gameId;
  document.body.classList.toggle('many-seats', info().layout.length > 4);
  drawPrint();
}

// The table's printed markings: a double oval with the name set along it, readable from
// both long sides. Sized to sit just inside the seats.
function drawPrint() {
  // Some tables have their own scenery (Go Fish: rocks, lily pads, koi).
  const decor = $('#decor');
  const fr = $('#felt').getBoundingClientRect();
  if (mode().decorate) mode().decorate(decor, fr.width, fr.height, Math.min(fr.width, fr.height) / 100);
  else { decor.innerHTML = ''; delete decor.dataset.key; }
  const r = fr;
  const W = r.width, H = r.height, v = Math.min(W, H) / 100;
  const edge = (3.4 + 1.2 + (info().layout.length > 4 ? 21 : 25) + 1.6) * v;
  const cx = W / 2, cy = H / 2, rx = W / 2 - edge, ry = H / 2 - edge;
  if (rx < 10 * v || ry < 10 * v) { $('#print').innerHTML = ''; return; }
  const tx = rx - 1.7 * v, ty = ry - 1.7 * v;
  const words = 'PLAY ON DISPLAY ✦ CARD TABLE';
  const text = id => `<text font-size="${1.7 * v}" opacity=".7"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${words}</textPath></text>`;
  $('#print').innerHTML = `<svg viewBox="0 0 ${W} ${H}">
    <defs>
      <path id="arcB" d="M ${cx - tx} ${cy} A ${tx} ${ty} 0 0 0 ${cx + tx} ${cy}"/>
      <path id="arcT" d="M ${cx + tx} ${cy} A ${tx} ${ty} 0 0 0 ${cx - tx} ${cy}"/>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="${0.16 * v}" opacity=".5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx - 0.8 * v}" ry="${ry - 0.8 * v}" fill="none" stroke="currentColor" stroke-width="${0.08 * v}" opacity=".3"/>
    ${text('arcB')}${text('arcT')}
  </svg>`;
}

function renderLobbyInfo() {
  document.querySelectorAll('.roomcode').forEach(el => { el.textContent = session.room; });
  const url = new URL('play.html?room=' + session.room, location.href).href;
  $('#joinUrl').textContent = url.replace(/^https?:\/\//, '');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
  $('#localWarn').hidden = !local;
  const qrEl = $('#qr');
  if (window.qrcode) {
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    qrEl.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } else qrEl.textContent = 'QR unavailable — type the address instead';

  // The game is picked in the catalog (index.html); here we just name it.
  $('#gameTitle').textContent = info().name;
  $('#gameBlurb').textContent = info().blurb;

  const set = session.settings[session.gameId];
  const box = $('#settings');
  box.innerHTML = mode().settingsHTML(set);
  box.querySelectorAll('[data-set]').forEach(el => {
    el.onchange = () => {
      const key = el.dataset.set;
      if (!mode().applySetting?.(set, key, el)) set[key] = el.type === 'checkbox' ? el.checked : Number(el.value);
      update();
    };
  });
}

// Geometry helpers handed to the game renderers.
function geometry() {
  const r = $('#felt').getBoundingClientRect();
  const vmin = Math.min(r.width, r.height) / 100;
  const layout = info().layout;
  return {
    vmin,
    layout,
    upright,
    cardScale,
    nameOf,
    bubble: (seat, text) => showBubble(seat, text),
    // Moves made by touching the table itself (chess pieces on the board).
    isBot: seat => !!session.players[seat]?.bot,
    act(seat, a) {
      if (!session.game) return 'No game';
      const err = mode().act(session.game, seat, a);
      if (err) showBubble(seat, err);
      else update();
      return err;
    },
    rot: seat => (upright ? 0 : SIDE_ROT[layout[seat].side]),
    // A point `d` vmin in from the edge that seat sits on, relative to the table centre.
    inset(seat, d) {
      const L = layout[seat];
      d += 2.6; // clear of the rail
      if (upright && L.side % 2 === 1) d += 8;
      let x = (L.x / 100) * r.width, y = (L.y / 100) * r.height;
      if (L.side === 0) y = r.height - d * vmin;
      if (L.side === 1) x = d * vmin;
      if (L.side === 2) y = d * vmin;
      if (L.side === 3) x = r.width - d * vmin;
      return { x: x - r.width / 2, y: y - r.height / 2 };
    },
  };
}

function render() {
  const g = session.game;
  const G = info();
  document.body.classList.toggle('in-lobby', !g);
  document.body.classList.toggle('in-game', !!g);
  document.body.classList.toggle('upright', upright);
  $('#btnOrient').textContent = upright ? 'Upright' : 'Flat';
  $('#btnEnd').hidden = !g;
  $('#allGames').hidden = !!g;
  // A game can add its own switch to the corner toolbar (Go Fish's fishing motion).
  const tool = mode().tool;
  $('#btnTool').hidden = !tool;
  if (tool) {
    const on = tool.on(session.settings[session.gameId]);
    const b = $('#btnTool');
    b.className = 'switch' + (on ? ' on' : '');
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `<span class="track"><span class="knob"></span></span><span class="sw-label">${tool.label}<small>${tool.hint}</small></span><b>${on ? 'On' : 'Off'}</b>`;
  }

  if (!g) {
    const n = session.players.filter(Boolean).length;
    const ok = n >= G.min && n <= G.max;
    $('#startBtn').disabled = !ok;
    $('#startBtn').textContent = ok ? 'Deal the cards'
      : G.min === G.max ? `Waiting for players (${n}/${G.max})` : `Need at least ${G.min} players`;
  }

  turnSeat = -1;
  session.players.forEach((p, pos) => renderSeat(pos, p, g));
  // The lamp follows whoever's turn it is.
  const lamp = $('#lamp');
  lamp.classList.toggle('on', turnSeat >= 0);
  if (turnSeat >= 0) {
    const pt = geometry().inset(turnSeat, 20);
    lamp.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
  }
  if (g) {
    const ctx = geometry();
    mode().renderCenter(g, ctx);
    if (g.announce && g.announce.id !== lastAnn) {
      lastAnn = g.announce.id;
      showBubble(g.announce.seat, g.announce.text);
    }
  }
  renderOverlay(g);
}

function renderSeat(pos, p, g) {
  const el = seatEls[pos];
  const plate = g && p ? mode().plate(g, pos) : null;
  el.classList.toggle('empty', !p);
  el.classList.toggle('filled', !!p);
  el.classList.toggle('lost', !!p && !p.connected);
  el.classList.toggle('out', !!plate?.out);
  el.classList.toggle('turn', !!plate?.turn);
  if (plate?.turn) turnSeat = pos;
  el.classList.toggle('joinable', !!g && !p && !!GAMES[session.gameId].midJoin);
  el.querySelector('.name').textContent = p ? p.name : session.gameId === 'euchre' ? `Open seat · ${GAMES.euchre.layout[pos].name}` : 'Open seat';

  const badges = plate ? [...plate.badges] : [];
  if (p && !p.connected) badges.unshift('<span class="badge lost">reconnecting…</span>');
  if (!g && p?.bot) badges.push('<span class="badge">bot</span>');
  el.querySelector('.badges').innerHTML = badges.join('');

  const partner = GAMES[session.gameId].id === 'euchre' ? session.players[(pos + 2) % 4] : null;
  el.querySelector('.meta').innerHTML = plate ? plate.meta
    : p ? (partner !== null ? `<span>Partner: ${partner?.name || '—'}</span>` : '<span>Ready</span>')
      : '<span>Scan the join card to sit here</span>';

  const fan = el.querySelector('.fan');
  const n = plate ? plate.cards : 0;
  if (fan.childElementCount !== n) {
    fan.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const c = cardEl(null, true);
      c.style.transform = `rotate(${(i - (n - 1) / 2) * 5}deg) translateY(${Math.abs(i - (n - 1) / 2) * 0.4}vmin)`;
      fan.appendChild(c);
    }
  }
}

let lastAnn = null;
let turnSeat = -1;
function showBubble(pos, text) {
  const b = seatEls[pos]?.querySelector('.bubble');
  if (!b) return;
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(b._t);
  b._t = setTimeout(() => b.classList.remove('show'), 2600);
}

function renderOverlay(g) {
  const ov = $('#overlay');
  const o = g && mode().overlay(g, geometry());
  if (!o) { ov.hidden = true; ov.dataset.key = ''; return; }
  if (ov.dataset.key === o.key) return;
  ov.dataset.key = o.key;
  ov.innerHTML = o.html;
  ov.querySelectorAll('[data-do]').forEach(b => {
    b.onclick = () => {
      if (b.dataset.do === 'again') startGame();
      else if (b.dataset.do === 'lobby') endGame();
      else if (b.dataset.do === 'next') { o.next?.(); update(); }
    };
  });
  ov.hidden = false;
}

// ---------------------------------------------------------------- controls

$('#startBtn').onclick = startGame;
$('#cardSize').value = String(cardScale);
$('#cardSize').oninput = e => {
  cardScale = Number(e.target.value);
  document.documentElement.style.setProperty('--card-scale', cardScale);
  try { localStorage.setItem('pod.cardScale', String(cardScale)); } catch {}
  render();
};

$('#btnOrient').onclick = () => {
  upright = !upright;
  try { localStorage.setItem('syndaris.table.upright', upright ? '1' : '0'); } catch {}
  render();
};
$('#btnFull').onclick = () => {
  const d = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else (d.requestFullscreen || d.webkitRequestFullscreen)?.call(d);
};
$('#btnEnd').onclick = () => { if (confirm('End this game and go back to the lobby?')) endGame(); };
window.addEventListener('resize', () => { drawPrint(); render(); });

$('#btnTool').onclick = () => {
  const tool = mode().tool;
  if (!tool) return;
  tool.toggle(session.settings[session.gameId], session.game);
  renderLobbyInfo();
  update();
};

// Opened from the catalog with ?game=<id>: switch to that game (unless one is being played).
const wanted = new URLSearchParams(location.search).get('game');
if (wanted && GAMES[wanted] && !session.game && wanted !== session.gameId) {
  const oldLayout = info().layout;
  session.gameId = wanted;
  session.players = remapPlayers(session.players, oldLayout, GAMES[wanted].layout);
  save();
}

buildSeats();
renderLobbyInfo();
render();
automate();
