// Chef's Kiss on a phone. Cards arrive face down: touch one to turn it over, then slide it
// up into the selection area to play it. The Chef picks a Recipe Card the same way, then
// awards the Chef's Kiss here (or on the table).
import { $, setHud, setStatus, renderHand, toast } from './phone-kit.js?v=63';
import { face, back, wireBulbs, esc } from './ck-face.js?v=63';
import { movable } from './gesture.js?v=63';
import { TEAMS } from './chefskiss.js?v=63';

let ctx = null, v = null;
let flipped = new Set();
let selected = null, swapMode = false, chosen = -1;
let handKey = '', panelKey = '', boardKey = '', recipeKey = '';
let endsAt = 0, tickT = null, gameId = null;
let sheetOpen = false, editing = -1, sheetPlayable = false;

// ---------------------------------------------------------------- stored on this phone only

const LS = { deck: 'pod.ck.deck', life: 'pod.ck.lifetime', counted: 'pod.ck.counted', flips: 'pod.ck.flips' };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, val) => { try { localStorage.setItem(k, JSON.stringify(val)); } catch {} };
const myDeck = () => read(LS.deck, []);
const lifetime = () => read(LS.life, 0);

// Chef's Kisses Forever: every Kiss you win adds to this phone's lifetime counter.
function countKiss(key) {
  const done = read(LS.counted, []);
  if (done.includes(key)) return false;
  done.push(key);
  write(LS.counted, done.slice(-300));
  write(LS.life, lifetime() + 1);
  return true;
}

export function reset() {
  handKey = panelKey = boardKey = recipeKey = '';
  selected = null; swapMode = false; chosen = -1;
  clearInterval(tickT);
  document.getElementById('ckPhone')?.remove();
  document.getElementById('ckSheet')?.remove();
  sheetOpen = false;
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', null);
  setHud('#hudC', null);
  setHud('#hudR', "Lifetime 💋", lifetime(), 'on this phone');
  document.getElementById('ckPhone')?.remove();
}

// ---------------------------------------------------------------- layout

function shell() {
  let el = document.getElementById('ckPhone');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'ckPhone';
  el.innerHTML = `
    <div class="ckp-recipe"></div>
    <div class="ckp-board"></div>
    <div class="ckp-zone"><span></span></div>
    <div class="ckp-hand"></div>`;
  $('#status').after(el);
  return el;
}

const isRecipeTurn = () => v.isChef && v.phase === 'recipe';
const handCards = () => (isRecipeTurn() ? v.myRecipes : v.hand);
const canPlay = c => {
  if (!c) return false;
  if (c.kind === 'r') return isRecipeTurn();
  return v.phase === 'play' && v.playing && v.mine.length < v.need;
};

function send(a) { ctx.send(a); }

function playCard(c, el) {
  if (!canPlay(c)) return;
  if (!flipped.has(c.id)) { flip(c.id); return; }
  el?.classList.add('fly');
  navigator.vibrate?.(20);
  selected = null;
  setTimeout(() => send(c.kind === 'r' ? { type: 'recipe', id: c.id } : { type: 'play', id: c.id }), el ? 180 : 0);
}

function flip(id) {
  flipped.add(id);
  write(LS.flips, { game: gameId, ids: [...flipped] });
  handKey = '';
  renderHandRow();
}

function renderHandRow() {
  const row = $('#ckPhone .ckp-hand');
  const cards = handCards() || [];
  const key = cards.map(c => c.id + (flipped.has(c.id) ? '+' : '-')).join(',') + `|${selected}|${swapMode}|${v.phase}|${v.isChef}|${v.mine.length}`;
  if (key === handKey) return;
  handKey = key;
  row.innerHTML = '';
  row.classList.toggle('resting', !(isRecipeTurn() || (v.phase === 'play' && v.playing && v.mine.length < v.need)) && !swapMode);
  for (const c of cards) {
    const wrap = document.createElement('div');
    wrap.className = 'ckp-slot' + (selected === c.id ? ' sel' : '') + (swapMode && c.kind === 'i' ? ' swapping' : '');
    wrap.innerHTML = flipped.has(c.id) ? face(c) : back(c.kind);
    row.appendChild(wrap);
    gestures(wrap, c);
  }
  wireBulbs(row);
}

// Touch to turn a card over; slide it up to play it.
function gestures(wrap, c) {
  let x0 = 0, y0 = 0, dy = 0, drag = false, down = false;
  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    down = true; drag = false; dy = 0; x0 = e.clientX; y0 = e.clientY;
  });
  wrap.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - x0;
    dy = e.clientY - y0;
    if (!drag && dy < -12 && Math.abs(dy) > Math.abs(dx) && flipped.has(c.id) && canPlay(c)) {
      drag = true;
      try { wrap.setPointerCapture(e.pointerId); } catch {}
      $('#ckPhone .ckp-zone').classList.add('hot');
    }
    if (drag) wrap.style.transform = `translateY(${Math.min(0, dy)}px) rotate(${dx / 30}deg)`;
  });
  const up = e => {
    if (!down) return;
    down = false;
    $('#ckPhone .ckp-zone')?.classList.remove('hot');
    if (drag) {
      if (dy < -90 && e.type === 'pointerup') return playCard(c, wrap);
      wrap.style.transform = '';
      return;
    }
    if (e.type !== 'pointerup' || Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 10) return;
    if (swapMode && c.kind === 'i') {
      swapMode = false;
      send({ type: 'swap', id: c.id });
      flipped.delete(c.id);
      handKey = panelKey = '';
      return;
    }
    if (!flipped.has(c.id)) return flip(c.id);
    selected = selected === c.id ? null : c.id;
    handKey = panelKey = '';
    renderHandRow();
    renderPanel();
  };
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', up);
}

function renderRecipe() {
  const box = $('#ckPhone .ckp-recipe');
  const show = v.recipe && v.phase !== 'recipe' && v.phase !== 'over';
  const key = show ? v.recipe.id : '';
  if (key === recipeKey) return;
  recipeKey = key;
  box.innerHTML = show ? face({ kind: 'r', ...v.recipe }) : '';
  if (show) { movable(box.firstElementChild, { max: 2.2 }); wireBulbs(box); }
}

function renderBoard() {
  const box = $('#ckPhone .ckp-board');
  let key = '';
  if (['judge', 'reveal'].includes(v.phase)) key = `${v.phase}|${v.round}|${v.winner}|${chosen}`;
  else if (v.phase === 'play' && v.mine.length) key = `mine|${v.round}|${v.mine.length}`;
  if (key === boardKey) return;
  boardKey = key;
  box.className = 'ckp-board';
  box.innerHTML = '';
  if (!key) return;
  if (key.startsWith('mine')) {
    box.classList.add('mine');
    box.innerHTML = `<p>You played</p><div class="ckp-grid">${v.mine.map(c => face({ kind: 'i', ...c })).join('')}</div>`;
  } else {
    box.innerHTML = `<div class="ckp-grid">${v.reveal.map((c, i) => `
      <div class="ckp-pick${i === chosen ? ' sel' : ''}${v.phase === 'reveal' && i === v.winner ? ' won' : ''}${v.phase === 'reveal' && i !== v.winner ? ' lost' : ''}" data-i="${i}">
        ${face({ kind: 'i', ...c })}
        ${c.yours ? '<em class="ckp-yours">yours</em>' : ''}
        ${v.phase === 'reveal' && c.seat !== undefined ? `<span class="ckp-who">${esc(ctx.nameOf(c.seat))}</span>` : ''}
      </div>`).join('')}</div>`;
    if (v.phase === 'judge' && v.isChef) {
      box.querySelectorAll('.ckp-pick').forEach(p => {
        p.onclick = e => {
          if (e.target.closest('.ck-bulb')) return;
          chosen = Number(p.dataset.i) === chosen ? -1 : Number(p.dataset.i);
          boardKey = panelKey = '';
          renderBoard();
          renderPanel();
        };
      });
    }
  }
  wireBulbs(box);
}

function renderPanel() {
  const key = [v.phase, v.round, v.isChef, v.playing, v.mine.length, selected, swapMode, v.canSwap, chosen, sheetOpen].join('|');
  if (key === panelKey) return;
  panelKey = key;
  const p = $('#panel');
  p.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'row';
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'panel-btn ' + cls; b.innerHTML = label; b.onclick = fn; row.appendChild(b); return b; };

  if (v.phase === 'judge' && v.isChef) {
    const b = btn("💋 Give the Chef's Kiss", 'go ck-kiss', () => { if (chosen >= 0) { send({ type: 'kiss', i: chosen }); chosen = -1; } });
    b.disabled = chosen < 0;
    p.appendChild(row);
    return;
  }
  if (v.phase === 'over') return;
  const sel = (handCards() || []).find(c => c.id === selected);
  if (sel && canPlay(sel)) btn(sel.kind === 'r' ? 'Use this Recipe Card' : 'Play this card', 'go', () => playCard(sel, document.querySelector('#ckPhone .ckp-slot.sel')));
  btn('✎ My cards', '', openSheet);
  if (!isRecipeTurn() && v.hand.length) {
    btn(swapMode ? 'Cancel swap' : v.canSwap ? '⟳ Swap a card' : 'Swap used this round', '', () => { swapMode = !swapMode; handKey = panelKey = ''; renderHandRow(); renderPanel(); }).disabled = !v.canSwap && !swapMode;
  }
  if (row.childElementCount) p.appendChild(row);
  if (swapMode) p.insertAdjacentHTML('beforeend', '<p class="ckp-hint">Tap the card you want to swap out. You get one swap each round.</p>');
}

// ---------------------------------------------------------------- my own Ingredient Cards

function openSheet() {
  sheetOpen = true;
  editing = -1;
  drawSheet();
}

function drawSheet() {
  let s = document.getElementById('ckSheet');
  if (!sheetOpen) { s?.remove(); panelKey = ''; return; }
  if (!s) { s = document.createElement('div'); s.id = 'ckSheet'; document.body.appendChild(s); }
  const deck = myDeck();
  const playable = v && v.phase === 'play' && v.playing && v.mine.length < v.need;
  const cur = editing >= 0 ? deck[editing] : { t: '', d: '' };
  s.innerHTML = `
    <div class="ckp-sheet">
      <header><h3>My Ingredient Cards</h3><button class="ckp-x" type="button" aria-label="Close">✕</button></header>
      <p class="ckp-hint">Your own cards stay on this phone. Only you can play them.</p>
      <form class="ckp-form">
        <input name="t" maxlength="80" placeholder="Write a card…" value="${esc(cur.t)}" autocomplete="off">
        <input name="d" maxlength="160" placeholder="What it means (for the 💡, optional)" value="${esc(cur.d)}" autocomplete="off">
        <div class="row">
          <button class="panel-btn" type="submit" name="save">${editing >= 0 ? 'Save changes' : 'Save to my deck'}</button>
          ${playable ? '<button class="panel-btn go" type="button" data-a="playnow">Play it now</button>' : ''}
        </div>
      </form>
      <ul class="ckp-list">${deck.length ? deck.map((c, i) => `
        <li><div><b>${esc(c.t)}</b>${c.d ? `<small>${esc(c.d)}</small>` : ''}</div>
          <span>${playable ? `<button type="button" data-play="${i}">Play</button>` : ''}<button type="button" data-edit="${i}">Edit</button><button type="button" data-del="${i}">Delete</button></span></li>`).join('')
        : '<li class="empty">No cards yet. Write one above.</li>'}</ul>
    </div>`;
  const f = s.querySelector('form');
  const val = () => ({ t: f.t.value.trim().slice(0, 80), d: f.d.value.trim().slice(0, 160) });
  f.onsubmit = e => {
    e.preventDefault();
    const c = val();
    if (!c.t) return toast('Write something on the card first');
    const d = myDeck();
    if (editing >= 0) d[editing] = c; else d.unshift(c);
    write(LS.deck, d);
    editing = -1;
    toast('Saved to your deck');
    drawSheet();
  };
  s.querySelector('[data-a="playnow"]')?.addEventListener('click', () => {
    const c = val();
    if (!c.t) return toast('Write something on the card first');
    playOwn(c);
  });
  s.querySelector('.ckp-x').onclick = () => { sheetOpen = false; drawSheet(); };
  s.onclick = e => { if (e.target === s) { sheetOpen = false; drawSheet(); } };
  s.querySelectorAll('[data-play]').forEach(b => { b.onclick = () => playOwn(myDeck()[Number(b.dataset.play)]); });
  s.querySelectorAll('[data-edit]').forEach(b => { b.onclick = () => { editing = Number(b.dataset.edit); drawSheet(); s.querySelector('input').focus(); }; });
  s.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => {
      const d = myDeck();
      d.splice(Number(b.dataset.del), 1);
      write(LS.deck, d);
      editing = -1;
      drawSheet();
    };
  });
}

function playOwn(c) {
  send({ type: 'play', own: { t: c.t, d: c.d } });
  sheetOpen = false;
  drawSheet();
  navigator.vibrate?.(20);
}

// ---------------------------------------------------------------- render

const clock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function showClock() {
  if (!v) return;
  const left = endsAt ? endsAt - Date.now() : null;
  $('#hudC').innerHTML = left !== null ? `<span>Time</span><b class="${left < 5000 ? 'red' : ''}">${clock(left)}</b>` : `<span>Round</span><b>${v.round}</b>`;
}

export function render(c) {
  ctx = c;
  v = c.st.game;
  const you = c.st.you;
  if (v.id !== gameId) {
    gameId = v.id;
    const saved = read(LS.flips, {});
    flipped = new Set(saved.game === gameId ? saved.ids : []);
    handKey = panelKey = boardKey = recipeKey = '';
  }
  if (v.phase !== 'judge') chosen = -1;
  if (selected && !(handCards() || []).some(x => x.id === selected)) selected = null;
  if (swapMode && (!v.canSwap || isRecipeTurn())) swapMode = false;
  endsAt = v.left !== null ? Date.now() + v.left : 0;
  clearInterval(tickT);
  tickT = setInterval(showClock, 250);
  showClock();

  // Lifetime Chef's Kisses.
  if (v.lastKiss && v.lastKiss.seat === you && countKiss(`${v.id}:${v.lastKiss.n}`)) navigator.vibrate?.([80, 60, 160]);
  if (v.phase === 'over' && v.winners?.includes(you)) countKiss(`${v.id}:bonus`);

  const team = v.teams && v.teams[you] !== null && v.teams[you] !== undefined ? TEAMS[v.teams[you]] : null;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}${v.isChef && v.phase !== 'over' ? ' · the Chef' : ''}${team ? ` · <span style="color:${team.c}">Team ${team.name}</span>` : ''}`;
  setHud('#hudL', "Chef's Kisses", v.scores[you] || 0, v.target ? `first to ${v.target}` : '');
  setHud('#hudR', 'Lifetime 💋', lifetime(), team ? `team ${v.teamTotals[v.teams[you]]}` : 'on this phone');

  const chefName = c.nameOf(v.chef);
  const myTurn = (v.isChef && ['recipe', 'judge'].includes(v.phase)) || (v.phase === 'play' && v.playing && v.mine.length < v.need);
  document.body.classList.toggle('myturn', myTurn);
  document.body.classList.toggle('ck-chef', v.isChef);

  if (v.phase === 'over') {
    const won = v.winners?.includes(you);
    setStatus(won ? '🏆 You win!' : v.winners?.length ? `${v.winners.map(i => c.nameOf(i)).join(' & ')} win${v.winners.length > 1 ? '' : 's'}!` : 'Game over', won ? 'Bonus Chef\'s Kiss added to your lifetime count' : 'The real win is the laughs. Look at the table.');
  } else if (v.phase === 'recipe') {
    if (v.isChef) setStatus("You're the Chef!", 'Touch your Recipe Cards to turn them over, then slide one up.');
    else setStatus(`${chefName} is the Chef`, 'They are picking a Recipe Card. Turn over your Ingredient Cards while you wait.');
  } else if (v.phase === 'play') {
    if (v.isChef) setStatus('Apprentices are choosing…', `${v.played} of ${v.expected} cards in`);
    else if (!v.playing) setStatus('Welcome to the kitchen!', "You'll be dealt in next round.");
    else if (v.mine.length < v.need) setStatus(v.need === 2 && v.mine.length === 0 ? 'Double Vision: play two cards' : v.need === 2 ? 'Play one more card' : 'Play your best pairing', 'Touch a card to turn it over, then slide it up.');
    else setStatus('Card played!', `Waiting for the others · ${v.played} of ${v.expected} in`);
  } else if (v.phase === 'judge') {
    if (v.isChef) setStatus("Award the Chef's Kiss", 'Tap your favorite pairing. Let them lobby you first!');
    else setStatus('Lobby the Chef!', `Talk up your card. ${chefName} is deciding.`);
  } else if (v.phase === 'reveal') {
    const w = v.reveal[v.winner];
    setStatus(w.yours ? "💋 You got the Chef's Kiss!" : `💋 ${c.nameOf(w.seat)} got the Chef's Kiss`, `“${w.t}”`);
  }

  shell();
  renderRecipe();
  renderBoard();
  const zone = $('#ckPhone .ckp-zone');
  const zoneOn = isRecipeTurn() || (v.phase === 'play' && v.playing && v.mine.length < v.need);
  zone.hidden = !zoneOn;
  zone.querySelector('span').textContent = isRecipeTurn() ? 'Slide a Recipe Card up here' : 'Slide an Ingredient Card up here to play it';
  $('#ckPhone .ckp-hand').hidden = v.phase === 'over' || (v.phase === 'judge' && v.isChef);
  renderHandRow();
  renderPanel();
  // Refresh the "Play" buttons in My cards when playing becomes possible (or stops being).
  const playable = v.phase === 'play' && v.playing && v.mine.length < v.need;
  if (sheetOpen && playable !== sheetPlayable) drawSheet();
  sheetPlayable = playable;
  renderHand([]);
}
