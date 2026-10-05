// Inside Job on a phone: your two cards, the community cards, and the chips. Tap a chip in
// the middle, or tap the chip in front of another player to take it from them.
import { $, setHud, setStatus, renderHand, cardEl } from './phone-kit.js?v=28';
import { ROUNDS, ROUND_NAME } from './insidejob.js?v=28';

let ctx = null;
let panelKey = '', boardKey = '';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const chip = (k, r, extra = '') => `<span class="pchip c-${ROUNDS[r]}" ${extra}><b>${(k + 1) * 100}</b></span>`;

export function reset() {
  panelKey = boardKey = '';
}

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', null);
  setHud('#hudC', null);
  setHud('#hudR', null);
}

function renderBoard(v) {
  const k = JSON.stringify([v.board, v.early]);
  if (k === boardKey) return;
  boardKey = k;
  const el = $('#board');
  el.innerHTML = '';
  const list = [0, 1, 2, 3, 4].map(i => v.board[i] ?? (i === 0 && v.early ? v.early : null));
  for (const c of list) el.appendChild(cardEl(c || null, !c));
}

function renderPanel(v, you) {
  const k = JSON.stringify([v.phase, v.round, v.chips, v.ready, v.pick, v.show?.revealed, v.heist, v.twist?.id, v.nextTwist?.id]);
  if (k === panelKey) return;
  panelKey = k;
  const p = $('#panel');
  const twist = v.twist ? `<div class="ij-twist ${v.twist.kind}"><small>${v.twist.kind === 'specialist' ? 'Specialist' : 'Complication'}</small><b>${v.twist.name}</b><span>${v.twist.text}</span></div>` : '';

  if (v.phase === 'chips' && v.inCrew) {
    const row = v.chips[v.round];
    const mine = row.indexOf(you);
    const free = row.map((o, k2) => (o === null ? k2 : -1)).filter(x => x >= 0);
    const others = v.crew.filter(s => s !== you);
    const happy = v.crew.filter(s => v.ready[s]).length;
    p.innerHTML = `${twist}
      <p class="ij-label">In the middle</p>
      <div class="ij-middle">${free.length ? free.map(k2 => chip(k2, v.round, `data-k="${k2}" role="button"`)).join('') : '<em>All taken</em>'}</div>
      <button class="panel-btn ${v.ready[you] ? '' : 'go'} wide" id="ijReady" ${mine < 0 ? 'disabled' : ''}>${v.ready[you] ? 'Wait, not yet' : "I'm happy with my chip"}</button>
      <p class="ij-hint">${happy} of ${v.crew.length} happy · tap any chip to take it, even one in front of someone else</p>
      <p class="ij-label">The crew</p>
      <ul class="ij-crew">
        ${[you, ...others].map(s => {
          const now = row.indexOf(s);
          const past = v.chips.slice(0, v.round).map((r, i) => (r && r.indexOf(s) >= 0 ? chip(r.indexOf(s), i, 'data-small') : '')).join('');
          return `<li class="${s === you ? 'me' : ''}">
            <span class="nm"><i style="background:var(--seat-${s})"></i>${s === you ? 'You' : esc(ctx.nameOf(s))}${v.ready[s] ? ' <em>✓</em>' : ''}</span>
            <span class="past">${past}${v.shown[s] ? `<small>shows ${v.shown[s].replace('T', '10')}</small>` : ''}</span>
            ${now >= 0 ? chip(now, v.round, s === you ? '' : `data-k="${now}" role="button" title="Take it"`) : '<span class="pchip empty"></span>'}
          </li>`;
        }).join('')}
      </ul>`;
    p.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => { navigator.vibrate?.(12); ctx.send({ type: 'take', k: Number(b.dataset.k) }); }; });
    $('#ijReady').onclick = () => ctx.send({ type: 'ready', on: !v.ready[you] });
    return;
  }
  if (v.phase === 'pick' && v.inCrew && !v.pick.done) {
    p.innerHTML = `${twist}<p class="ij-hint">${v.pick.mode === 'drop' ? 'Tap the card you want to drop.' : 'Tap a card to swap it for a fresh one, or keep both.'}</p>
      ${v.pick.mode === 'swap' ? '<button class="panel-btn wide" id="ijKeep">Keep my cards</button>' : ''}`;
    $('#ijKeep')?.addEventListener('click', () => ctx.send({ type: 'pick', card: null }));
    return;
  }
  if (v.show) {
    p.innerHTML = `<ol class="ij-line">${v.show.order.map(({ seat, value }, i) => {
      const h = v.show.hands[seat];
      return `<li class="${i < v.show.revealed ? (v.show.bad.includes(i) ? 'bad' : 'good') : ''}">${chip(value - 1, 3, 'data-small')}
        <span>${seat === you ? 'You' : esc(ctx.nameOf(seat))}</span><em>${h ? h.name : '…'}</em></li>`;
    }).join('')}</ol>${v.nextTwist ? `<p class="ij-hint">Next heist: <b>${v.nextTwist.name}</b> · ${v.nextTwist.text}</p>` : ''}`;
    return;
  }
  p.innerHTML = twist;
}

export function render(c) {
  ctx = c;
  const v = c.st.game;
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · Heist ${v.heist}`;
  setHud('#hudL', 'Vaults', `${v.vaults}/3`, '');
  $('#hudC').innerHTML = v.phase === 'chips' ? `<span>Chips</span><b class="ij-roundchip c-${ROUNDS[v.round]}">${ROUNDS[v.round]}</b>` : '';
  setHud('#hudR', 'Alarms', `${v.alarms}/3`, '');

  const row = v.chips[v.round];
  const mine = row ? row.indexOf(you) : -1;
  const myTurn = v.inCrew && ((v.phase === 'chips' && (mine < 0 || !v.ready[you])) || (v.phase === 'pick' && !v.pick.done));
  document.body.classList.toggle('myturn', myTurn);

  if (!v.inCrew) setStatus('Welcome aboard', "You'll join the crew for the next heist.");
  else if (v.phase === 'chips') {
    if (mine < 0) setStatus('Take a chip', `${ROUND_NAME[v.round]}: 100 = weakest hand at the table, ${row.length * 100} = strongest.`);
    else if (!v.ready[you]) setStatus(`You have ${(mine + 1) * 100}`, 'Happy with it? Or take a different one.');
    else setStatus(`You have ${(mine + 1) * 100} ✓`, 'Waiting for the rest of the crew…');
  } else if (v.phase === 'pick') setStatus(v.pick.done ? 'Done' : v.pick.mode === 'drop' ? 'Butterfingers!' : 'The Forger', v.pick.done ? `Waiting on ${v.pick.waiting}` : v.pick.mode === 'drop' ? 'Drop one of your three cards.' : 'Swap one card, or keep both.');
  else if (v.phase === 'showdown') setStatus('The showdown', 'Hands are revealed from the lowest red chip up.');
  else if (v.result) setStatus(v.result.ok ? '🔓 Vault cracked!' : '🚨 The alarm went off!', v.phase === 'over' ? (v.vaults >= 3 ? 'The crew got away with it!' : 'Busted! Look at the table.') : 'Next heist coming up…');

  renderBoard(v);
  renderPanel(v, you);
  const picking = v.phase === 'pick' && v.inCrew && !v.pick.done;
  renderHand(v.hole, {
    onTap: picking ? card => ctx.send({ type: 'pick', card }) : null,
    hint: picking ? (v.pick.mode === 'drop' ? 'Tap a card to drop it' : 'Tap a card to swap it') : 'Your cards. Keep them secret!',
  });
}
