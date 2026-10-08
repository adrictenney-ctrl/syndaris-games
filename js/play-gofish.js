// Go Fish on a player's phone: pick a rank and a player to ask; when it's "Go fish!",
// draw from the pond — or, with the table's fishing-motion switch on, turn the phone
// sideways and pull it back like a rod to reel the card in.
import { GAMES } from './games.js?v=61';
import { RANK_NAME, rankPlural } from './gofish.js?v=61';
import { $, toast, setHud, setStatus, renderHand, cardEl } from './phone-kit.js?v=61';
import { cardText } from './cards.js?v=61';

const LAYOUT = GAMES.gofish.layout;
let ctx = null;
let rank = null;        // rank picked to ask for
let target = null;      // player picked to ask
let panelKey = '';
let wasMyTurn = false;
let lastCatchSeen = null;

export function reset() {
  rank = target = null;
  panelKey = '';
  stopFishing();
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${LAYOUT[you].name}`;
  setHud('#hudL', null);
  setHud('#hudR', null);
  setHud('#hudC', null);
  $('#board').innerHTML = '';
  stopFishing();
}

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · ${LAYOUT[you].name}`;
  const mine = g.seats[you];
  setHud('#hudL', 'Cards', g.hand.length);
  $('#hudC').innerHTML = g.phase === 'gameOver' ? '' : `<span>Pond</span><b>${g.pond}</b>`;
  setHud('#hudR', 'Books', mine?.books.length ?? 0);

  // Your books, face up where the table cards usually go.
  const board = $('#board');
  const bkey = (mine?.books || []).join('');
  if (board.dataset.key !== bkey) {
    board.dataset.key = bkey;
    board.innerHTML = '';
    (mine?.books || []).forEach((r, i) => board.appendChild(cardEl(r + 'SHDC'[i % 4])));
  }

  // You reeled something in.
  if (g.lastCatch && g.lastCatch.card && g.lastCatch.id !== lastCatchSeen) {
    lastCatchSeen = g.lastCatch.id;
    const lucky = g.lastCatch.wanted && g.lastCatch.card[0] === g.lastCatch.wanted;
    toast(`You caught the ${cardText(g.lastCatch.card)}${lucky ? ' — just what you wanted!' : ''}`);
    if (g.motion) popCard(g.lastCatch.card);
  } else if (g.lastCatch && lastCatchSeen === null) lastCatchSeen = g.lastCatch.id;

  const myTurn = (g.phase === 'ask' || g.phase === 'fish') && g.turn === you;
  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;
  if (!myTurn || g.phase !== 'ask') { rank = null; target = null; }
  if (rank && !g.askable.includes(rank)) rank = null;
  if (target != null && !(g.seats[target]?.n > 0)) target = null;

  renderStatus(g, you, myTurn);
  renderPanel(g, you, myTurn);
  if (myTurn && g.phase === 'fish' && g.motion) startFishing(); else stopFishing();
  renderHand(g.hand, {
    selected: null,
    dim: myTurn && g.phase === 'ask' && rank ? g.hand.filter(c => c[0] !== rank) : null,
    onTap: card => {
      if (!(myTurn && g.phase === 'ask')) return;
      rank = card[0];
      panelKey = '';
      render(ctx);
    },
    hint: myTurn && g.phase === 'ask' ? 'Tap a card to ask for that rank' : '',
  });
}

function renderStatus(g, you, myTurn) {
  const nameOf = ctx.nameOf;
  if (g.phase === 'gameOver') {
    const won = g.winners.includes(you);
    return setStatus(won ? (g.winners.length > 1 ? 'A tie — you share the win!' : '🏆 You win!') : `${g.winners.map(nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`,
      `${g.result.books} books${g.winners.length > 1 ? ' each' : ''} · look at the table to play again`);
  }
  if (!g.active) return setStatus("You're dealt in next game", 'Hang tight while this one finishes');
  const a = g.lastAsk;
  const recap = a ? (a.got ? `${nameOf(a.to)} gave ${a.from === you ? 'you' : nameOf(a.from)} ${a.got} ${a.got === 1 ? RANK_NAME[a.rank] : rankPlural(a.rank)}`
    : `${nameOf(a.to)} said “Go fish!”`) : '';
  if (myTurn && g.phase === 'fish') {
    if (!g.fishFor) return setStatus('Out of cards', 'Draw one from the pond');
    return setStatus('Go fish!', g.motion ? 'Turn your phone sideways, then pull it back to reel one in' : `${nameOf(a?.to)} has no ${rankPlural(g.fishFor)}. Draw from the pond`);
  }
  if (myTurn) return setStatus('Your turn', rank ? `Ask someone for ${rankPlural(rank)}` : 'Pick a rank you hold, then who to ask');
  if (g.phase === 'fish') return setStatus(`${nameOf(g.turn)} is fishing…`, recap);
  return setStatus(`${nameOf(g.turn)} is asking…`, recap);
}

function renderPanel(g, you, myTurn) {
  const key = [g.phase, g.turn, myTurn, rank, target, g.askable.join(''), g.seats.map(s => s?.n).join(','), g.motion].join('|');
  if (key === panelKey) return;
  panelKey = key;
  const p = $('#panel');
  p.innerHTML = '';
  if (!myTurn) return;

  if (g.phase === 'fish') {
    if (!g.motion) {
      p.innerHTML = `<button class="panel-btn go wide" id="fish">${g.fishFor ? 'Go fish: draw from the pond' : 'Draw from the pond'}</button>`;
      $('#fish').onclick = () => ctx.send({ type: 'fish' });
    }
    return;
  }

  const counts = {};
  g.hand.forEach(c => { counts[c[0]] = (counts[c[0]] || 0) + 1; });
  const ranks = Object.keys(counts);
  const others = g.seats.map((s, i) => (s?.active && i !== you && s.n > 0 ? i : -1)).filter(i => i >= 0);
  p.innerHTML = `
    <p class="pick">Ask for…</p>
    <div class="row ranks">${ranks.map(r => `<button class="panel-btn rank ${r === rank ? 'on' : ''}" data-r="${r}">${r === 'T' ? '10' : r}<small>×${counts[r]}</small></button>`).join('')}</div>
    <p class="pick">…from</p>
    <div class="row">${others.map(i => `<button class="panel-btn who ${i === target ? 'on' : ''}" data-t="${i}">${esc(ctx.nameOf(i))}<small>${g.seats[i].n} cards</small></button>`).join('')}</div>
    <button class="panel-btn go wide" id="ask" ${rank && target != null ? '' : 'disabled'}>${rank && target != null ? `Ask ${esc(ctx.nameOf(target))} for ${rankPlural(rank)}` : 'Pick a rank and a player'}</button>`;
  p.querySelectorAll('[data-r]').forEach(b => { b.onclick = () => { rank = b.dataset.r; panelKey = ''; render(ctx); }; });
  p.querySelectorAll('[data-t]').forEach(b => { b.onclick = () => { target = Number(b.dataset.t); panelKey = ''; render(ctx); }; });
  $('#ask').onclick = () => {
    if (!rank || target == null) return;
    ctx.send({ type: 'ask', target, rank });
    rank = target = null;
  };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------------------------------------------------------------- motion fishing

let fishing = false;
let listening = false;
let sidewaysAt = 0;
let reeled = false;

function fishingEl() {
  let el = document.getElementById('fishing');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fishing';
    el.innerHTML = `
      <div class="steps">
        <p class="step s1"><b>1</b> Turn your phone sideways</p>
        <p class="step s2"><b>2</b> Pull it back like you're reeling one in</p>
      </div>
      <div class="water"><div class="line"></div><div class="bobber"></div></div>
      <button class="panel-btn" id="allowMotion" hidden>Allow motion to fish</button>
      <button class="link" id="tapReel">Motion not working? Tap to reel</button>`;
    document.getElementById('panel').after(el); // where the buttons go, above the hand
    el.querySelector('#tapReel').onclick = reel;
    el.querySelector('#allowMotion').onclick = async () => {
      if (await askPermission()) { el.querySelector('#allowMotion').hidden = true; listen(); }
    };
  }
  return el;
}

const needsPermission = () => typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function';

async function askPermission() {
  try {
    const r = await DeviceMotionEvent.requestPermission();
    return r === 'granted';
  } catch { return false; }
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener('devicemotion', onMotion);
}

function startFishing() {
  if (fishing) return;
  fishing = true;
  reeled = false;
  sidewaysAt = 0;
  const el = fishingEl();
  el.hidden = false;
  el.classList.remove('sideways', 'caught');
  // iPhones only hand over motion data after a tap on a button.
  if (needsPermission() && !listening) el.querySelector('#allowMotion').hidden = false;
  else listen();
}

function stopFishing() {
  fishing = false;
  const el = document.getElementById('fishing');
  if (el) el.hidden = true;
}

function onMotion(e) {
  if (!fishing || reeled) return;
  const g = e.accelerationIncludingGravity;
  if (!g) return;
  const el = fishingEl();
  // Sideways = gravity pulling along the phone's long edge (its x axis).
  const sideways = Math.abs(g.x || 0) > 6.5 && Math.abs(g.y || 0) < 6;
  if (sideways) {
    sidewaysAt = Date.now();
    el.classList.add('sideways');
  } else if (Date.now() - sidewaysAt > 900) el.classList.remove('sideways');
  if (Date.now() - sidewaysAt > 900) return;
  // The pull: a sharp flick — fast rotation or a big jolt.
  const r = e.rotationRate || {};
  const spin = Math.hypot(r.alpha || 0, r.beta || 0, r.gamma || 0);
  const a = e.acceleration || {};
  const jolt = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
  if (spin > 220 || jolt > 13) reel();
}

function reel() {
  if (!fishing || reeled) return;
  reeled = true;
  navigator.vibrate?.([30, 30, 80]);
  fishingEl().classList.add('caught');
  setTimeout(() => ctx.send({ type: 'fish' }), 350);
}

// The caught card leaps out of the water on your screen, then drops into your hand.
function popCard(card) {
  const c = cardEl(card);
  c.classList.add('pop-catch');
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 1500);
}
