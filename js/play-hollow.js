// Hollowmere on a phone: your secret character (hold to peek), what you've learned, your
// choices at night, and nominating and voting by day.
import { $, setHud, setStatus, renderHand, toast } from './phone-kit.js?v=41';
import { CHARS, KIND_NAME } from './hollow-chars.js?v=41';
import { fmt, sheetHTML } from './table-hollow.js?v=41';

let ctx = null, panelKey = '', cardKey = '', picks = [], mode = null, notesSeen = 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function reset() { panelKey = cardKey = ''; picks = []; mode = null; notesSeen = 0; document.getElementById('hmCard')?.remove(); }

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', null); setHud('#hudC', null); setHud('#hudR', null);
  document.getElementById('hmCard')?.remove();
}

function card(v) {
  let el = document.getElementById('hmCard');
  const k = v.char + v.team;
  if (el && k === cardKey) return;
  cardKey = k;
  if (!el) {
    el = document.createElement('div');
    el.id = 'hmCard';
    $('#status').after(el);
    const show = on => el.classList.toggle('peek', on);
    el.addEventListener('pointerdown', () => show(true));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, () => show(false)));
  }
  if (!v.char) { el.innerHTML = '<div class="hm-back"><b>Watching</b><span>You joined after the characters were dealt.</span></div>'; return; }
  const c = CHARS[v.char];
  el.innerHTML = `
    <div class="hm-back">🏮<b>Hold to see your character</b><span>Keep it hidden</span></div>
    <div class="hm-face ${v.team}"><span class="ic">${c.icon}</span><small>${v.team === 'evil' ? 'Evil' : 'Good'} · ${KIND_NAME[c.kind]}</small><h3>${c.name}</h3><p>${c.text}</p></div>`;
}

function players(v, filter) {
  return v.crew.filter(filter).map(s => `<button class="panel-btn${picks.includes(s) ? ' on' : ''}" data-s="${s}">${s === v.me ? 'Me' : esc(ctx.nameOf(s))}${v.alive[s] ? '' : ' ☠'}</button>`).join('');
}

function renderPanel(v) {
  const k = JSON.stringify([v.phase, v.night, v.day, v.need, v.done, v.vote?.mine, v.vote?.nominee, picks, mode, v.nominated, v.nominators, v.alive, v.notes.length, v.hunterUsed, v.ghost[v.me]]);
  if (k === panelKey) return;
  panelKey = k;
  const p = $('#panel');
  const you = v.me;
  const notes = v.notes.length ? `<details class="hm-notes" ${v.notes.length > notesSeen ? 'open' : ''}><summary>What you know (${v.notes.length})</summary><ol>${v.notes.slice().reverse().map((n, i) => `<li class="${i < v.notes.length - notesSeen ? 'new' : ''}"><small>Night ${n.night}</small>${fmt(n.text, ctx.nameOf)}</li>`).join('')}</ol></details>` : '';
  let html = '';
  if (['night', 'witness'].includes(v.phase) && v.need && !v.done) {
    const need = v.need;
    if (need.pick) {
      const filter = s => (need.self || s !== you) && (need.char === 'seer' || v.alive[s]);
      html = `<p class="hm-q">${CHARS[need.char].icon} ${v.phase === 'witness' ? 'Choose a player to learn their character' : need.pick === 2 ? 'Choose two players' : 'Choose a player'}</p>
        <div class="hm-pick">${players(v, filter)}</div>
        <button class="panel-btn go wide" id="hmGo" ${picks.length === need.pick ? '' : 'disabled'}>Confirm</button>`;
    } else {
      html = `<p class="hm-q">Nothing to choose tonight.</p><button class="panel-btn go wide" id="hmSleep">Go to sleep</button>
        <p class="hm-hint">Everyone taps something at night, so nobody can tell who has an ability.</p>`;
    }
  } else if (['night', 'witness'].includes(v.phase)) {
    html = `<p class="hm-q">💤 Sleeping…</p><p class="hm-hint">${v.nightLeft} still in the dark. What you learn arrives at dawn.</p>`;
  } else if (v.phase === 'vote') {
    const can = v.alive[you] || v.ghost[you];
    html = `<p class="hm-q">Execute ${esc(ctx.nameOf(v.vote.nominee))}?</p>
      ${can ? `<div class="hm-votes"><button class="hm-vote yes ${v.vote.mine === true ? 'on' : ''}" data-v="1">✋ Yes</button><button class="hm-vote no ${v.vote.mine === false ? 'on' : ''}" data-v="0">No</button></div>
      <p class="hm-hint">${v.vote.needed} votes needed.${!v.alive[you] ? ' You are dead: voting Yes uses up your one ghost vote.' : ''}</p>` : '<p class="hm-hint">You already used your ghost vote.</p>'}`;
  } else if (v.phase === 'day') {
    if (mode === 'nominate') {
      html = `<p class="hm-q">Nominate who?</p><div class="hm-pick">${players(v, s => v.alive[s] && !v.nominated.includes(s))}</div><button class="panel-btn wide" id="hmCancel">Cancel</button>`;
    } else if (mode === 'shoot') {
      html = `<p class="hm-q">🏹 Claim to be the Hunter and shoot…</p><p class="hm-hint">Everyone will see this. It only works for the real Hunter, once.</p><div class="hm-pick">${players(v, s => v.alive[s] && s !== you)}</div><button class="panel-btn wide" id="hmCancel">Cancel</button>`;
    } else if (v.alive[you]) {
      const canNom = !v.nominators.includes(you);
      html = `<div class="row"><button class="panel-btn go" id="hmNom" ${canNom ? '' : 'disabled'}>${canNom ? 'Nominate someone' : 'You nominated today'}</button>
        ${v.hunterUsed ? '' : '<button class="panel-btn" id="hmShoot">🏹 Hunter\'s shot</button>'}</div>`;
    } else html = `<p class="hm-hint">You are dead, but you can still talk${v.ghost[you] ? ' and you have one vote left' : ''}.</p>`;
  } else if (v.phase === 'over') {
    html = `<p class="hm-q">${v.winner.team === 'good' ? 'Good wins!' : 'Evil wins!'}</p><ul class="hm-grim">${v.crew.map(s => `<li><b>${esc(ctx.nameOf(s))}</b> ${CHARS[v.grimoire[s]].icon} ${CHARS[v.grimoire[s]].name}</li>`).join('')}</ul>`;
  }
  p.innerHTML = html + notes + `<details class="hm-notes"><summary>All characters</summary><div class="hm-sheet-p">${sheetHTML()}</div></details>`;
  p.querySelector('.hm-notes')?.addEventListener('toggle', () => { notesSeen = v.notes.length; });
  p.querySelectorAll('.hm-pick [data-s]').forEach(b => {
    b.onclick = () => {
      const s = Number(b.dataset.s);
      if (mode === 'nominate') { mode = null; ctx.send({ type: 'nominate', s }); return; }
      if (mode === 'shoot') { mode = null; if (confirm(`Shoot ${ctx.nameOf(s)}? Everyone will see it.`)) ctx.send({ type: 'shoot', s }); panelKey = ''; render(ctx); return; }
      const max = v.need?.pick || 1;
      picks = picks.includes(s) ? picks.filter(x => x !== s) : [...picks, s].slice(-max);
      panelKey = '';
      renderPanel(v);
    };
  });
  $('#hmGo')?.addEventListener('click', () => { ctx.send({ type: 'night', s: picks }); picks = []; navigator.vibrate?.(15); });
  $('#hmSleep')?.addEventListener('click', () => ctx.send({ type: 'night', s: [] }));
  $('#hmNom')?.addEventListener('click', () => { mode = 'nominate'; panelKey = ''; renderPanel(v); });
  $('#hmShoot')?.addEventListener('click', () => { mode = 'shoot'; panelKey = ''; renderPanel(v); });
  $('#hmCancel')?.addEventListener('click', () => { mode = null; panelKey = ''; renderPanel(v); });
  p.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => { navigator.vibrate?.(15); ctx.send({ type: 'vote', yes: b.dataset.v === '1' }); }; });
}

let lastNotes = 0, toastedAt = 0;
export function render(c) {
  ctx = c;
  const v = c.st.game;
  const you = c.st.you;
  const night = ['night', 'witness'].includes(v.phase);
  document.body.classList.toggle('hm-night', night);
  if (v.phase !== 'day') mode = null;
  if (!night) picks = [];
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}${v.alive[you] === false ? ' · ☠ dead' : ''}`;
  setHud('#hudL', night ? 'Night' : 'Day', night ? v.night : v.day, '');
  $('#hudC').innerHTML = `<span>${night ? '🌙' : '☀️'}</span>`;
  setHud('#hudR', 'Alive', v.crew.filter(s => v.alive[s]).length, `of ${v.crew.length}`);
  if (v.notes.length > lastNotes) { if (lastNotes) navigator.vibrate?.([40, 40, 40]); lastNotes = v.notes.length; }

  const myTurn = (night && v.need && !v.done) || (v.phase === 'vote' && (v.alive[you] || v.ghost[you]) && v.vote.mine === null);
  document.body.classList.toggle('myturn', !!myTurn);

  if (v.phase === 'over') setStatus(v.winner.team === 'good' ? 'The village is saved!' : 'The Shade wins!', '');
  else if (night) setStatus(`Night ${v.night}`, v.done ? 'Sleep tight…' : 'Keep your phone to yourself');
  else if (v.phase === 'vote') setStatus(`${c.nameOf(v.vote.nominator)} nominated ${c.nameOf(v.vote.nominee)}`, 'Vote now');
  else setStatus(`Day ${v.day}`, v.dawn?.deaths?.length ? `${v.dawn.deaths.map(s => c.nameOf(s)).join(' and ')} died in the night` : 'Nobody died in the night');

  card(v);
  renderPanel(v);
  renderHand([]);
  // New information arrived at dawn: say so once.
  if (v.phase === 'day' && v.notes.length > toastedAt) { toastedAt = v.notes.length; toast('You learned something. Check "What you know".'); }
}
