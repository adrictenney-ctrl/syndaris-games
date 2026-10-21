// Chef's Kiss on a phone. Cards arrive face down: touch one to turn it over, then slide it
// up into the selection area to play it. The Chef picks a Recipe Card the same way, then
// awards the Chef's Kiss here (or on the table).
import { $, setHud, setStatus, renderHand, toast } from './phone-kit.js?v=106';
import { face, back, wireBulbs, esc } from './ck-face.js?v=106';
import { movable } from './gesture.js?v=106';
import { TEAMS } from './chefskiss-config.js?v=3';
import { openWorkshop, myCards } from './ck-workshop.js?v=1';
import { makeCustomCard } from './ck-custom.js?v=1';
import { funnyPicks, makeCards } from './laugh-engine.js?v=106';

let ctx = null, v = null;
let flipped = new Set();
let selected = null, chosen = -1;
let handKey = '', panelKey = '', boardKey = '', recipeKey = '';
let endsAt = 0, tickT = null, gameId = null;
let workshop = null;   // the Card Workshop panel, when it's open
// Laugh Engine (only when the host left it on): the funniest cards in this hand for this Recipe
// Card, and card ideas. Both arrive whenever they're ready; nothing here ever waits on them.
let laughKey = '', laughIds = [];

// ---------------------------------------------------------------- stored on this phone only

const LS = { deck: 'pod.ck.deck', life: 'pod.ck.lifetime', counted: 'pod.ck.counted', flips: 'pod.ck.flips' };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, val) => { try { localStorage.setItem(k, JSON.stringify(val)); } catch {} };
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
  selected = null; chosen = -1;
  laughKey = ''; laughIds = []; laughFrom = ''; clearTimeout(laughTimer);
  clearInterval(tickT);
  document.getElementById('ckPhone')?.remove();
  workshop?.close(); workshop = null;
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
const choosing = () => v.phase === 'play' && v.playing && !v.mine.length;
// Where this hand's picks come from: the table's Si (Gemma on the host) when it's running,
// otherwise the built-in scorer on this phone. The Si gets 3 seconds; then the scorer steps in.
const SI_WAIT = 3000;
let laughFrom = '', laughTimer = null;
function showPicks(key, ids, from) {
  if (laughKey !== key || !ids?.length) return;
  const mine = new Set(v.hand.map(c => c.id));
  const keep = ids.filter(id => mine.has(id));
  if (!keep.length) return;
  laughIds = keep; laughFrom = from; handKey = '';
  if (document.getElementById('ckPhone')) renderHandRow();
}
function localPicks(key) { funnyPicks(v.recipe, v.hand).then(ids => { if (laughFrom !== 'si') showPicks(key, ids, 'local'); }, () => {}); }
function askLaugh() {
  const on = v.laugh && choosing() && v.recipe && v.hand.length > 1;
  const key = on ? `${v.recipe.id}|${v.hand.map(c => c.id).join(',')}` : '';
  if (key !== laughKey) {
    laughKey = key; laughIds = []; laughFrom = '';
    clearTimeout(laughTimer);
    if (!on) return;
    if (v.laughSi === 'ready') laughTimer = setTimeout(() => { if (!laughFrom) localPicks(key); }, SI_WAIT);
    else localPicks(key);
  }
  // The Si's picks for this round have arrived (and nothing is showing yet): use them.
  if (on && !laughFrom && v.siPicks?.length) { clearTimeout(laughTimer); showPicks(key, v.siPicks, 'si'); }
}
const handCards = () => (isRecipeTurn() ? v.myRecipes : v.hand);
const canPlay = c => {
  if (!c) return false;
  if (c.kind === 'r') return isRecipeTurn();
  return v.phase === 'play' && v.playing && !v.mine.length;
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
  const funny = !isRecipeTurn() && choosing() ? laughIds : [];
  const key = cards.map(c => c.id + (flipped.has(c.id) ? '+' : '-')).join(',') + `|${selected}|${v.phase}|${v.isChef}|${v.mine.length}|${funny.join(',')}`;
  if (key === handKey) return;
  handKey = key;
  row.innerHTML = '';
  row.classList.toggle('resting', !(isRecipeTurn() || (v.phase === 'play' && v.playing && !v.mine.length)));
  for (const c of cards) {
    const wrap = document.createElement('div');
    wrap.className = 'ckp-slot' + (selected === c.id ? ' sel' : '') + (funny.includes(c.id) ? ' laugh' : '');
    wrap.innerHTML = (flipped.has(c.id) ? face(c) : back(c.kind)) + (funny.includes(c.id) ? '<em class="ckp-laugh">😂 Funny pick</em>' : '');
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
  const key = [v.phase, v.round, v.isChef, v.playing, v.mine.length, selected, chosen].join('|');
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
  btn('✎ Card Workshop', '', () => openCards());
  if (v.laugh && choosing() && v.recipe) btn('✨ Make me a card', '', () => openCards('snack'));
  if (row.childElementCount) p.appendChild(row);
}

// ---------------------------------------------------------------- the Card Workshop (players' own cards)

// Card ideas for a Snack card: the table's ideas for this Recipe Card when it has some (fresh ones
// each time), otherwise the built-in idea maker on this phone.
let ideasShown = [];
function cardIdeas() {
  if (!v?.recipe) return Promise.resolve([]);
  if (v.siIdeas?.length) {
    let pool = v.siIdeas.filter(t => !ideasShown.includes(t));
    if (pool.length < 3) { ideasShown = []; pool = [...v.siIdeas]; }
    const pick = pool.sort(() => Math.random() - .5).slice(0, 3);
    ideasShown.push(...pick);
    return Promise.resolve(pick);
  }
  const avoid = [...(v.hand || []).map(c => c.t), ...myCards().map(c => c.text)];
  return makeCards(v.recipe, avoid).then(list => list.slice(0, 3), () => []);
}

// Cards written before the Card Workshop (the old "My cards" list) become Snack cards at the first
// table this phone opens the Workshop at.
function moveOldCards(level) {
  const old = read(LS.deck, []);
  if (!old.length) return;
  const list = myCards();
  for (const o of old) { try { list.push(makeCustomCard({ type: 'snack', text: o.t, flavor: o.d ? String(o.d).slice(0, 60) : null, level })); } catch {} }
  write('pod.ck.cards', list);
  write(LS.deck, []);
}

function openCards(startOn) {
  if (!v) return;
  moveOldCards(v.level);
  workshop = openWorkshop({
    level: v.level, startOn, send, toast,
    activeIds: () => v?.myCustom || [],
    ideas: v.laugh ? cardIdeas : null,
  });
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
  const myTurn = (v.isChef && ['recipe', 'judge'].includes(v.phase)) || (v.phase === 'play' && v.playing && !v.mine.length);
  document.body.classList.toggle('myturn', myTurn);
  document.body.classList.toggle('ck-chef', v.isChef);

  if (v.phase === 'over') {
    const won = v.winners?.includes(you);
    setStatus(won ? '🏆 You win!' : v.winners?.length ? `${v.winners.map(i => c.nameOf(i)).join(' & ')} win${v.winners.length > 1 ? '' : 's'}!` : 'Game over', won ? 'Bonus Chef\'s Kiss added to your lifetime count' : 'The real win is the laughs. Look at the table.');
  } else if (v.phase === 'recipe') {
    if (v.isChef) setStatus("You're the Chef!", 'Touch your Recipe Cards to turn them over, then slide one up.');
    else setStatus(`${chefName} is the Chef`, 'They are picking a Recipe Card. Your new hand of 7 arrives as soon as they do.');
  } else if (v.phase === 'play') {
    if (v.isChef) setStatus('Apprentices are choosing…', `${v.played} of ${v.expected} cards in`);
    else if (!v.playing) setStatus('Welcome to the kitchen!', "You'll be dealt in next round.");
    else if (!v.mine.length) setStatus('Play your best pairing', 'Touch a card to turn it over, then slide it up.');
    else setStatus('Card played!', `Waiting for the others · ${v.played} of ${v.expected} in`);
  } else if (v.phase === 'judge') {
    if (v.isChef) setStatus("Award the Chef's Kiss", 'Tap your favorite pairing. Let them lobby you first!');
    else setStatus('Lobby the Chef!', `Talk up your card. ${chefName} is deciding.`);
  } else if (v.phase === 'reveal') {
    const w = v.reveal[v.winner];
    setStatus(w.yours ? "💋 You got the Chef's Kiss!" : w.custom ? "💋 A house card got the Chef's Kiss" : `💋 ${c.nameOf(w.seat)} got the Chef's Kiss`, `“${w.t}”`);
  }

  askLaugh();
  shell();
  renderRecipe();
  renderBoard();
  const zone = $('#ckPhone .ckp-zone');
  const zoneOn = isRecipeTurn() || (v.phase === 'play' && v.playing && !v.mine.length);
  zone.hidden = !zoneOn;
  zone.querySelector('span').textContent = isRecipeTurn() ? 'Slide a Recipe Card up here' : 'Slide an Ingredient Card up here to play it';
  $('#ckPhone .ckp-hand').hidden = v.phase === 'over' || (v.phase === 'judge' && v.isChef);
  renderHandRow();
  renderPanel();
  // The Workshop shows which cards are at this table: keep it current.
  if (!document.getElementById('ckWork')) workshop = null; else workshop?.redraw();
  renderHand([]);
}
