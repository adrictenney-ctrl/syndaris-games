// A player's phone: joining, picking a seat, then the game's own phone UI.
import { GAMES } from './games.js?v=26';
import { keepAwake } from './cards.js?v=26';
import { joinRoom } from './net.js?v=26';
import { $, toast, setStatus, renderHand, resetHand } from './phone-kit.js?v=26';
import * as euchreUI from './play-euchre.js?v=26';
import * as pokerUI from './play-poker.js?v=26';
import * as vetoUI from './play-veto.js?v=26';
import * as gofishUI from './play-gofish.js?v=26';
import * as chessUI from './play-chess.js?v=26';
import * as backgammonUI from './play-backgammon.js?v=26';
import * as sketchUI from './play-sketch.js?v=26';
import * as chefskissUI from './play-chefskiss.js?v=26';

const UIS = { euchre: euchreUI, holdem: pokerUI, veto: vetoUI, gofish: gofishUI, chess: chessUI, backgammon: backgammonUI, sketch: sketchUI, chefskiss: chefskissUI };
const params = new URLSearchParams(location.search);

let pid = null;
try { pid = sessionStorage.getItem('syndaris.pid'); } catch {}
if (!pid) {
  pid = 'p-' + Math.random().toString(36).slice(2, 10);
  try { sessionStorage.setItem('syndaris.pid', pid); } catch {}
}

let net = null;
let st = null;          // last state from the table
let pickingSeat = false;
let lastGameKey = '';

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
}

// ---------------------------------------------------------------- join

try { $('#name').value = localStorage.getItem('syndaris.name') || ''; } catch {}
const urlRoom = (params.get('room') || '').toUpperCase();
if (urlRoom) { $('#room').value = urlRoom; $('#roomField').hidden = true; }
show('s-join');

$('#joinBtn').onclick = () => {
  const name = $('#name').value.trim();
  const room = $('#room').value.trim().toUpperCase();
  if (!name) { $('#name').focus(); return toast('Enter your name'); }
  if (!/^[A-Z]{4}$/.test(room)) { $('#roomField').hidden = false; $('#room').focus(); return toast('Enter the 4-letter room code shown on the table'); }
  try {
    localStorage.setItem('syndaris.name', name);
    sessionStorage.setItem('syndaris.joined', room);
  } catch {}
  if (!urlRoom) history.replaceState(null, '', '?room=' + room);
  keepAwake();
  $('#waitMsg').textContent = 'Connecting to the table…';
  show('s-wait');
  net = joinRoom(room, {
    pid,
    onOpen: () => net.send({ t: 'hello', id: pid, name }),
    onMessage,
    onStatus,
  });
};
$('#name').addEventListener('keydown', e => { if (e.key === 'Enter') $('#joinBtn').click(); });
$('#cancelBtn').onclick = () => {
  try { sessionStorage.removeItem('syndaris.joined'); } catch {}
  location.reload();
};

// Page reloaded mid-game: jump straight back in.
try {
  if (urlRoom && sessionStorage.getItem('syndaris.joined') === urlRoom && $('#name').value) $('#joinBtn').click();
} catch {}

function onStatus(s) {
  const bar = $('#netbar');
  if (!st) {
    $('#waitMsg').textContent = {
      connecting: 'Connecting to the table…',
      'no-table': "Can't find that table yet. Make sure the room code is right and the table screen is open — still trying…",
      offline: 'No internet connection — retrying…',
      lost: 'Reconnecting…',
    }[s] || 'Connecting…';
    return;
  }
  bar.hidden = s === 'online';
  bar.textContent = s === 'no-table' ? 'Table not reachable — retrying…' : 'Reconnecting to the table…';
}

function onMessage(m) {
  if (m.t === 'error') return toast(m.msg);
  if (m.t !== 'state') return;
  st = m;
  $('#netbar').hidden = true;
  render();
}

function send(action) {
  if (!net || !net.send({ t: 'act', action })) toast('Not connected — hang on…');
}

const nameOf = s => st.seats[s]?.name || GAMES[st.gameId].layout[s]?.name || '?';

// ---------------------------------------------------------------- render

function render() {
  if (st.you === null || pickingSeat) return renderSeatPicker();
  show('s-game');
  const ui = UIS[st.gameId];
  document.body.dataset.game = st.gameId;
  const gameKey = st.gameId + (st.started ? ':on' : ':off');
  if (gameKey !== lastGameKey) {
    lastGameKey = gameKey;
    Object.values(UIS).forEach(u => u.reset());
    resetHand();
    $('#panel').innerHTML = '';
    $('#board').innerHTML = '';
    $('#myHand').textContent = '';
  }
  const c = { st, send, nameOf, raw: msg => net?.send(msg) };

  if (!st.game) {
    document.body.classList.remove('myturn');
    ui.renderLobby(c);
    const G = GAMES[st.gameId];
    const n = st.seats.filter(Boolean).length;
    setStatus(`You're in! · ${G.name}`, n >= G.min ? `Waiting for someone to tap "${G.startLabel || 'Deal'}" on the table.` : 'Waiting for everyone to sit down…');
    $('#panel').innerHTML = '<button class="panel-btn wide" id="chgSeat">Change seat</button>';
    $('#chgSeat').onclick = () => { pickingSeat = true; render(); };
    renderHand([]);
    return;
  }
  ui.render(c);
}

// ---------------------------------------------------------------- seat picker

function renderSeatPicker() {
  const G = GAMES[st.gameId];
  const claimable = s => !s || s.bot || !s.connected;
  if (st.started && st.you === null && !st.seats.some((s, i) => claimable(s) && (s || G.midJoin))) {
    $('#waitMsg').textContent = "A game is already going and every seat is taken. You'll be able to join when a seat opens up.";
    return show('s-wait');
  }
  show('s-seat');
  $('#seatGame').textContent = G.name;
  const table = $('#minitable');
  table.dataset.game = G.id;
  table.querySelectorAll('.seatbtn').forEach(b => b.remove());
  G.layout.forEach((L, seat) => {
    const s = st.seats[seat];
    const mine = st.you === seat;
    const b = document.createElement('button');
    b.className = 'seatbtn side-' + L.side;
    // Map the table-screen position into the little picture of the table. Rows along the
    // top/bottom edge (x from 28% to 72%) are stretched to use the picture's full width.
    const vertical = L.side % 2 === 1;
    const [w, h] = vertical ? (G.max > 4 ? [20, 30] : [22, 42]) : (G.max > 4 ? [32, 19] : [42, 21]);
    const fx = vertical ? L.x / 100 : Math.min(1, Math.max(0, (L.x - 28) / 44));
    Object.assign(b.style, {
      width: w + '%', height: h + '%',
      left: (100 - w) * fx + '%', top: ((100 - h) * L.y) / 100 + '%',
    });
    b.style.setProperty('--dot', `var(--seat-${seat})`);
    b.classList.toggle('mine', mine);
    b.classList.toggle('open', !s);
    const joinable = !s && (!st.started || G.midJoin);
    b.disabled = !mine && !(claimable(s) && (s || joinable));
    if (mine) b.innerHTML = `You<small>${L.name}</small>`;
    else if (!s) b.innerHTML = `Sit here<small>${L.name}</small>`;
    else if (s.bot) b.innerHTML = `${esc(s.name)}<small>bot · tap to replace</small>`;
    else if (!s.connected) b.innerHTML = `${esc(s.name)}<small>tap to rejoin</small>`;
    else b.innerHTML = `${esc(s.name)}<small>${L.name}</small>`;
    b.onclick = () => {
      pickingSeat = false;
      if (!mine) net.send({ t: 'sit', seat });
      render();
    };
    table.appendChild(b);
  });
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
