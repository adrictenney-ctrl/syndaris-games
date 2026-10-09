// Roll-and-move games on a phone (Snakes & Ladders, Sweet Trail, Orchard): one big button to
// roll (or draw / spin), and what happened last.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=68';
import { dieHTML } from './table-yacht.js?v=68';

let wasMyTurn = false;
export function reset() { document.getElementById('rcPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
// opts: { label, verb, icon, where(g, s), lastHTML(g) }
export function racePhone(c, o) {
  const g = c.st.game, you = c.st.you;
  const mine = g.phase === 'play' && g.turn === you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', o.label, o.where(g, you));
  const lead = g.order.filter(s => s !== you).sort((a, b) => o.rank(g, b) - o.rank(g, a))[0];
  setHud('#hudR', c.nameOf(lead), o.where(g, lead));
  $('#hudC').innerHTML = '';
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([50, 30, 50]);
  wasMyTurn = mine;
  let el = document.getElementById('rcPhone');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rcPhone';
    el.addEventListener('click', e => { if (e.target.closest('#rcGo')) { c.send({ type: o.action || 'roll' }); navigator.vibrate?.(30); } });
    $('#status').after(el);
  }
  el.innerHTML = `<div class="rc-last">${o.lastHTML(g)}</div><button id="rcGo" class="rc-go" ${mine ? '' : 'disabled'}><b>${o.icon}</b>${o.verb}</button>`;
  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else setStatus(mine ? 'Your turn' : `${c.nameOf(g.turn)}'s turn`, mine ? '' : 'Watch the board');
  $('#panel').innerHTML = '';
  renderHand([]);
}

export function render(c) {
  racePhone(c, {
    label: 'Square', icon: '🎲', verb: 'Roll',
    where: (g, s) => g.pos[s] || '—', rank: (g, s) => g.pos[s],
    lastHTML: g => (g.last ? `${dieHTML(g.last.d)}<p>${c.nameOf(g.last.seat)} rolled ${g.last.d}${g.last.via ? ` — ${g.last.via === 'ladder' ? '🪜 up' : '🐍 down'} to ${g.last.to}` : ` to ${g.last.to}`}</p>` : ''),
  });
}
