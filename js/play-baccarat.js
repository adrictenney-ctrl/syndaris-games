// Baccarat on a phone: pick a chip, tap where to bet (Player, Banker, Tie, pairs), then
// watch the table.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=61';
import { CHIP_CLASS, money } from './casino.js?v=61';

let ctx = null, panelKey = '', chip = 25;
const CHIPS = [5, 25, 100, 500];
const SPOT = { player: ['Player', '1 to 1'], banker: ['Banker', '1 to 1, less 5%'], tie: ['Tie', '8 to 1'], ppair: ['Player pair', '11 to 1'], bpair: ['Banker pair', '11 to 1'] };

export function reset() { panelKey = ''; }

export function renderLobby(c) {
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', null); setHud('#hudC', null); setHud('#hudR', null);
}

const sum = b => Object.values(b || {}).reduce((a, x) => a + x, 0);

function renderPanel(v) {
  const k = JSON.stringify([v.phase, v.bets, v.ready, v.stack, chip, v.round]);
  if (k === panelKey) return;
  panelKey = k;
  const p = $('#panel');
  const send = a => ctx.send(a);
  if (v.phase !== 'bet') { p.innerHTML = ''; return; }
  if (v.stack < v.min && !sum(v.bets)) {
    p.innerHTML = v.rebuy ? '<button class="panel-btn go wide" id="bcRebuy">Rebuy</button>' : '<p class="bjp-hint">Out of chips.</p>';
    $('#bcRebuy')?.addEventListener('click', () => send({ type: 'rebuy' }));
    return;
  }
  const spots = ['player', 'banker', 'tie', ...(v.pairs ? ['ppair', 'bpair'] : [])];
  p.innerHTML = `
    <div class="bcp-spots">${spots.map(s => `<button class="bcp-spot ${s}" data-s="${s}"><span>${SPOT[s][0]}</span><small>${SPOT[s][1]}</small><b>${v.bets[s] ? money(v.bets[s]) : ''}</b></button>`).join('')}</div>
    <div class="bjp-chips">${CHIPS.map(d => `<button class="cchip big ${CHIP_CLASS[d]}${d === chip ? ' on' : ''}" data-chip="${d}"><b>${d}</b></button>`).join('')}</div>
    <div class="row"><button class="panel-btn" id="bcClear">Clear</button>${v.lastBets && sum(v.lastBets) <= v.stack && JSON.stringify(v.lastBets) !== JSON.stringify(v.bets) ? '<button class="panel-btn" id="bcSame">Same bet</button>' : ''}
      <button class="panel-btn go" id="bcReady" ${sum(v.bets) >= v.min ? '' : 'disabled'}>${v.ready ? '✓ Ready' : 'Deal me in'}</button></div>
    <p class="bjp-hint">Pick a chip, then tap where to bet. Minimum ${v.min} in total.</p>`;
  p.querySelectorAll('[data-chip]').forEach(b => { b.onclick = () => { chip = Number(b.dataset.chip); panelKey = ''; renderPanel(v); }; });
  p.querySelectorAll('[data-s]').forEach(b => {
    b.onclick = () => {
      const bets = { ...v.bets };
      const room = v.stack - sum(bets);
      if (room <= 0) return;
      bets[b.dataset.s] = (bets[b.dataset.s] || 0) + Math.min(chip, room);
      navigator.vibrate?.(8);
      send({ type: 'bet', bets });
    };
  });
  $('#bcClear').onclick = () => send({ type: 'bet', bets: {} });
  $('#bcSame')?.addEventListener('click', () => send({ type: 'bet', bets: v.lastBets }));
  $('#bcReady').onclick = () => send({ type: 'ready', on: !v.ready });
}

export function render(c) {
  ctx = c;
  const v = c.st.game;
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Chips', money(v.stack), '');
  $('#hudC').innerHTML = v.pScore !== null ? `<span>P · B</span><b>${v.pScore} · ${v.bScore ?? '–'}</b>` : `<span>Hand</span><b>${v.round || '–'}</b>`;
  setHud('#hudR', 'Bet', money(sum(v.bets)), '');
  document.body.classList.toggle('myturn', v.phase === 'bet' && !v.ready && v.stack >= v.min);
  if (v.phase === 'bet') setStatus(v.ready ? "You're in" : 'Place your bets', v.ready ? 'Waiting for the others…' : 'Player, Banker or Tie?');
  else if (v.phase === 'deal') setStatus('No more bets', 'Watch the table');
  else {
    const r = v.result;
    const head = r.winner === 'tie' ? `Tie ${r.ps}–${r.bs}` : `${r.winner === 'player' ? 'Player' : 'Banker'} wins ${Math.max(r.ps, r.bs)}–${Math.min(r.ps, r.bs)}`;
    setStatus(head, r.mine === null ? '' : r.mine > 0 ? `You won ${money(r.mine)}` : r.mine < 0 ? `You lost ${money(-r.mine)}` : 'Your bet pushed');
  }
  renderPanel(v);
  renderHand([]);
}
