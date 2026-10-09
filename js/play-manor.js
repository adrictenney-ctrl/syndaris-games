// Midnight Manor on a phone. Your turn: tap a lit room to move there, then suggest a suspect
// and a weapon (the room is where you are). When someone asks you, pick which card to show.
// Underneath: your detective notebook — your own cards and cards you've been shown are
// filled in for you; tap any row to mark it ✗ / ? yourself.
import { $, toast, setHud, setStatus, renderHand } from './phone-kit.js?v=67';
import { SUSPECTS, WEAPONS, ROOMS, ALL, cardName, neighbours } from './manor.js?v=67';
import { planHTML, pawn, weapon, logLine } from './table-manor.js?v=67';

let ctx = null, pickS = null, pickW = null, accusing = false, aS = null, aW = null, aR = null, notes = {}, notesKey = '', wasMyTurn = false;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function reset() { pickS = pickW = null; accusing = false; document.getElementById('mmPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function loadNotes(g) {
  const k = 'pod.manor.' + g.hand.slice().sort().join('');
  if (k === notesKey) return;
  notesKey = k;
  try { notes = JSON.parse(localStorage.getItem(k)) || {}; } catch { notes = {}; }
}
function saveNotes() { try { localStorage.setItem(notesKey, JSON.stringify(notes)); } catch {} }

function el() {
  let e = document.getElementById('mmPhone');
  if (!e) { e = document.createElement('div'); e.id = 'mmPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-room], [data-s], [data-w], [data-r], [data-show], [data-note], [data-x]');
  if (!t) return;
  if (t.dataset.note) { const c = t.dataset.note; notes[c] = notes[c] === 'x' ? '?' : notes[c] === '?' ? '' : 'x'; saveNotes(); return render(ctx); }
  if (t.dataset.show) { ctx.send({ type: 'show', card: t.dataset.show }); return; }
  if (t.dataset.room != null && g.turn === you && g.step === 'move' && !accusing) { ctx.send({ type: 'move', room: Number(t.dataset.room) }); return; }
  if (t.dataset.s != null) { if (accusing) aS = +t.dataset.s; else pickS = +t.dataset.s; return render(ctx); }
  if (t.dataset.w != null) { if (accusing) aW = +t.dataset.w; else pickW = +t.dataset.w; return render(ctx); }
  if (t.dataset.r != null) { aR = +t.dataset.r; return render(ctx); }
  const x = t.dataset.x;
  if (x === 'suggest') { if (pickS == null || pickW == null) return toast('Pick a suspect and a weapon'); ctx.send({ type: 'suggest', suspect: pickS, weapon: pickW }); pickS = pickW = null; }
  if (x === 'end') ctx.send({ type: 'end' });
  if (x === 'accuse') { accusing = true; aS = aW = aR = null; render(ctx); }
  if (x === 'cancel') { accusing = false; render(ctx); }
  if (x === 'confirm') { if (aS == null || aW == null || aR == null) return toast('Pick one of each'); ctx.send({ type: 'accuse', suspect: aS, weapon: aW, room: aR }); accusing = false; }
}

const chips = (list, sel, attr, icon) => `<div class="mm-chips">${list.map((n, i) => `<button data-${attr}="${i}" class="${sel === i ? 'on' : ''}">${icon ? icon(i) : ''}${esc(n)}</button>`).join('')}</div>`;

function notebook(g) {
  const mine = new Set(g.hand), shown = {};
  g.shown.forEach(x => { shown[x.card] = x.by; });
  const row = c => {
    const auto = mine.has(c) ? 'mine' : shown[c] != null ? 'seen' : '';
    const mark = auto ? '✓' : notes[c] === 'x' ? '✗' : notes[c] === '?' ? '?' : '';
    const who = auto === 'mine' ? 'your card' : auto === 'seen' ? `shown by ${esc(ctx.nameOf(shown[c]))}` : '';
    return `<li class="${auto || notes[c] || ''}" ${auto ? '' : `data-note="${c}"`}><span>${esc(cardName(c))}</span><small>${who}</small><b>${mark}</b></li>`;
  };
  return `<div class="mm-notes"><h5>Suspects</h5><ul>${ALL.filter(c => c[0] === 's').map(row).join('')}</ul><h5>Weapons</h5><ul>${ALL.filter(c => c[0] === 'w').map(row).join('')}</ul><h5>Rooms</h5><ul>${ALL.filter(c => c[0] === 'r').map(row).join('')}</ul></div>`;
}

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you;
  loadNotes(g);
  const me = g.suspectOf[you], room = g.where[me];
  $('#whoami').innerHTML = `${pawn(me, 'small')} ${c.nameOf(you)} · ${SUSPECTS[me]}`;
  setHud('#hudL', 'You are in', ROOMS[room]);
  setHud('#hudC', null);
  setHud('#hudR', 'Cards', g.hand.length);
  const mine = g.phase === 'play' && g.turn === you && !g.pending;
  const asked = !!g.asked;
  document.body.classList.toggle('myturn', mine || asked);
  if ((mine || asked) && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine || asked;
  if (!mine) accusing = false;

  let top = '';
  if (g.phase === 'over') {
    const [s, w, r] = g.envelope.map(x => +x.slice(1));
    setStatus(g.winner === you ? '🔎 You solved it!' : g.winner != null ? `${c.nameOf(g.winner)} solved it` : 'Nobody solved it', `${SUSPECTS[s]}, ${WEAPONS[w].toLowerCase()}, ${ROOMS[r]}`);
  } else if (asked) {
    const sug = g.log[g.log.length - 1];
    setStatus('Show a card', `${c.nameOf(g.pending.suggester)} asked — only they will see it`);
    top = `<p class="pick">${sug ? logLine(sug, c.nameOf) : ''}</p><div class="mm-show">${g.asked.map(x => `<button class="panel-btn go" data-show="${x}">${esc(cardName(x))}</button>`).join('')}</div>`;
  } else if (g.out[you]) setStatus("You're out of the running", 'You still show cards when asked');
  else if (!mine) setStatus(g.pending ? `${c.nameOf(g.pending.asker)} is choosing a card to show` : `${c.nameOf(g.turn)}'s turn`, '');
  else if (accusing) {
    setStatus('Make your accusation', 'Right and you win. Wrong and you are out.');
    top = `<p class="pick">Who?</p>${chips(SUSPECTS, aS, 's', i => pawn(i, 'small'))}<p class="pick">With what?</p>${chips(WEAPONS, aW, 'w', i => weapon(i, 'small'))}<p class="pick">Where?</p>${chips(ROOMS, aR, 'r')}
      <div class="row"><button class="panel-btn" data-x="cancel">Not yet</button><button class="panel-btn fold" data-x="confirm">Accuse</button></div>`;
  } else if (g.step === 'move') {
    setStatus('Your turn — move', g.summoned ? 'You were summoned here — tap your room to stay, or move' : 'Tap a lit room next door');
    const can = [...neighbours(room), ...(g.summoned ? [room] : [])];
    top = planHTML(g, { can, mine: room }) + '<div class="row"><button class="panel-btn" data-x="accuse">Accuse…</button></div>';
  } else if (g.step === 'suggest') {
    setStatus(`In the ${ROOMS[room]}`, 'Suggest who did it, and with what');
    top = `<p class="pick">Suspect</p>${chips(SUSPECTS, pickS, 's', i => pawn(i, 'small'))}<p class="pick">Weapon</p>${chips(WEAPONS, pickW, 'w', i => weapon(i, 'small'))}
      <div class="row"><button class="panel-btn" data-x="accuse">Accuse…</button><button class="panel-btn go" data-x="suggest">Suggest</button></div>`;
  } else {
    setStatus('Anything else?', 'Accuse now, or end your turn');
    const last = g.log[g.log.length - 1];
    top = `<p class="pick">${last ? logLine(last, c.nameOf) : ''}</p><div class="row"><button class="panel-btn" data-x="accuse">Accuse…</button><button class="panel-btn go" data-x="end">End turn</button></div>`;
  }
  el().innerHTML = `${top}${notebook(g)}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
