// Grand Prix Dice on a phone: your car's wear, the next corner, and — on your turn — the gearbox
// (each gear shows its die and what a big downshift costs), then after the roll, how hard to
// brake, with where each choice puts you. ★ marks what the computer would pick.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=61';
import * as G from './grandprix.js?v=61';
import { trackSVG, GEAR_COLOR } from './table-grandprix.js?v=61';

let ctx = null, wasMyTurn = false;

export function reset() { document.getElementById('gpPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('gpPhone');
  if (!e) { e = document.createElement('div'); e.id = 'gpPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const t = ev.target.closest('[data-gear], [data-brake]');
  if (!t || t.disabled) return;
  if (t.dataset.gear) ctx.send({ type: 'gear', gear: Number(t.dataset.gear) });
  else ctx.send({ type: 'move', brake: Number(t.dataset.brake) });
  navigator.vibrate?.(15);
}

const WEAR_NAME = { tires: 'Tyres', brakes: 'Brakes', gearbox: 'Gearbox', engine: 'Engine' };

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, car = g.cars[you];
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  const pos = g.standings.indexOf(you) + 1;
  setHud('#hudL', 'Position', `P${pos}`, `of ${g.order.length}`);
  $('#hudC').innerHTML = `<span>Gear</span><b style="color:${GEAR_COLOR[car.gear]}">${car.gear || '–'}</b>`;
  setHud('#hudR', 'To go', Math.max(0, g.goal - car.pos), `lap ${Math.min(g.laps, Math.max(1, Math.floor(car.pos / G.L) + 1))}/${g.laps}`);

  const mine = g.phase !== 'over' && g.turn === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  const nc = g.nextCorner;
  const cornerTxt = nc ? (nc.dist === 0 ? `In a corner · ${nc.have}/${nc.stops} stop${nc.stops > 1 ? 's' : ''} made` : `Corner in ${nc.dist} · needs ${nc.stops} stop${nc.stops > 1 ? 's' : ''}`) : '';
  if (g.phase === 'over') setStatus(g.ranking[0] === you && car.done ? '🏆 You win the Grand Prix!' : car.out ? '💥 You crashed out' : car.done ? `🏁 You finished P${pos}` : 'Race over', 'Look at the table');
  else if (car.out) setStatus('💥 Crashed out', 'Watch the rest of the race');
  else if (car.done) setStatus(`🏁 Finished · P${pos}`, 'Waiting for the others');
  else if (mine && g.phase === 'gear') setStatus('Your turn · pick a gear', cornerTxt);
  else if (mine) setStatus(`You rolled ${g.roll}`, 'Brake to move fewer spaces — it costs brake points');
  else setStatus(`${c.nameOf(g.turn)} is driving`, cornerTxt);

  let panel = '';
  if (mine && g.phase === 'gear' && g.gears) {
    panel = `<div class="gp-gears">${g.gears.map(o => {
      const [lo, hi] = G.GEARS[o.gear];
      const cost = Object.entries(o.cost).filter(([, v]) => v).map(([k]) => `−1 ${WEAR_NAME[k].toLowerCase()}`).join(', ');
      return `<button data-gear="${o.gear}" ${o.ok ? '' : 'disabled'} style="--gc:${GEAR_COLOR[o.gear]}" class="${o.gear === car.gear ? 'cur' : ''}"><b>${o.gear}</b><span>${lo}–${hi}</span>${cost ? `<em>${cost}</em>` : ''}${g.hint === o.gear ? '<i>★</i>' : ''}</button>`;
    }).join('')}</div>`;
  } else if (mine && g.phase === 'move' && g.brakes) {
    panel = `<div class="gp-brakes">${g.brakes.map(o => {
      const what = o.crash ? `<em class="bad">💥 crash — ${o.crash}</em>` : o.tires ? `<em class="warn">overshoot · −${o.tires} tyres</em>` : o.corner ? `<em class="ok">stop in the corner ✓</em>` : o.end >= g.goal ? '<em class="ok">🏁 finish!</em>' : '';
      return `<button data-brake="${o.brake}"><b>${o.brake ? `Brake ${o.brake}` : 'Full speed'}</b><span>move ${o.dist}${o.blocked ? ' (blocked)' : ''}</span>${what}${g.hint === o.brake ? '<i>★</i>' : ''}</button>`;
    }).join('')}</div>`;
  }
  const wear = Object.keys(WEAR_NAME).map(k => `<div><small>${WEAR_NAME[k]}</small><b>${'●'.repeat(Math.max(0, car.wear[k]))}<span>${'○'.repeat(Math.max(0, G.WEAR[k] - car.wear[k]))}</span></b></div>`).join('');
  el().innerHTML = `<div class="gp-mini">${trackSVG(g, { highlight: you })}</div><div class="gp-wearbox">${wear}</div>${panel}`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
