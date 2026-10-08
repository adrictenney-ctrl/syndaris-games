// Seven Spires on a phone: tap one of your three decks to take its top card — the deck on your
// left, the hidden centre (you see its top card while you hold the Owl), or the deck on your
// right. Below: your spire, what the next stage needs, and everything you've collected.
import { $, setHud, setStatus, renderHand } from './phone-kit.js?v=60';
import * as S from './spires.js?v=60';
import { svCard, spireSVG, tableauHTML } from './table-spires.js?v=60';

let ctx = null, wasMyTurn = false;

export function reset() { document.getElementById('svPhone')?.remove(); }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}

function el() {
  let e = document.getElementById('svPhone');
  if (!e) { e = document.createElement('div'); e.id = 'svPhone'; e.addEventListener('click', onClick); $('#status').after(e); }
  return e;
}

function onClick(ev) {
  const g = ctx.st.game, you = ctx.st.you;
  const t = ev.target.closest('[data-from], [data-boon], [data-x]');
  if (!t || g.toMove !== you) return;
  if (t.dataset.boon) ctx.send({ type: 'boon', boon: t.dataset.boon });
  else if (t.dataset.from) ctx.send({ type: 'take', from: t.dataset.from });
  else if (t.dataset.x === 'pass') ctx.send({ type: 'pass' });
  navigator.vibrate?.(12);
}

const neighbour = (g, you, side) => {
  const n = g.order.length, i = g.order.indexOf(you);
  if (n === 2) return g.order[1 - i];
  return side === 'left' ? g.order[(i - 1 + n) % n] : g.order[(i + 1) % n];
};

export function render(c) {
  ctx = c;
  const g = c.st.game, you = c.st.you, t = g.tab[you];
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  setHud('#hudL', 'Points', g.points[g.order.indexOf(you)]);
  $('#hudC').innerHTML = `<span>Stage</span><b>${t.stages}/5</b>`;
  setHud('#hudR', 'War drums', `${g.drums}/${g.warAt}`);

  const mine = g.toMove === you;
  document.body.classList.toggle('myturn', mine);
  if (mine && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = mine;

  const st = S.STAGES[t.stages];
  const need = st ? `${st.n} ${st.same ? 'alike' : 'different'} (Gold counts as any)` : 'Finished!';
  if (g.phase === 'over') setStatus(g.winners.includes(you) ? '🏆 You win!' : `${g.winners.map(c.nameOf).join(' & ')} win${g.winners.length > 1 ? '' : 's'}`, 'Look at the table to play again');
  else if (g.phase === 'boon' && mine) setStatus('Science! Choose a Boon', 'It\'s yours for the rest of the game');
  else if (mine) setStatus('Your turn', 'Take a card from one of your three decks');
  else setStatus(`${c.nameOf(g.toMove)}'s turn`, st ? `Your next stage: ${need}` : '');

  const r = g.reach;
  const deckBtn = (from, d, label) => `<button class="sv-pick${mine && d.n ? ' tap' : ''}" data-from="${from}" ${mine && d.n && g.phase === 'play' ? '' : 'disabled'}>${d.n ? svCard(d.top) : '<div class="sv-card gone"></div>'}<small>${label}</small><em>${d.n} left</em></button>`;
  const center = `<button class="sv-pick${mine && g.center ? ' tap' : ''}" data-from="center" ${mine && g.center && g.phase === 'play' ? '' : 'disabled'}>${g.center ? svCard(g.peek, g.peek ? 'peek' : '') : '<div class="sv-card gone"></div>'}<small>${g.peek ? '🦉 Centre (you peek)' : 'Centre · hidden'}</small><em>${g.center} left</em></button>`;
  const stuck = mine && g.phase === 'play' && !g.center && !g.decks[r.left].n && !g.decks[r.right].n;
  const top = g.phase === 'boon' && mine
    ? `<div class="sv-boonpick">${g.boonOffer.map(b => `<button data-boon="${b}"><b>${S.BOONS[b].name}</b><span>${S.BOONS[b].text}</span></button>`).join('')}</div>`
    : `<div class="sv-picks">${deckBtn('left', g.decks[r.left], `With ${c.nameOf(neighbour(g, you, 'left'))}`)}${center}${deckBtn('right', g.decks[r.right], `With ${c.nameOf(neighbour(g, you, 'right'))}`)}</div>${stuck ? '<button class="panel-btn" data-x="pass">Nothing left to take · pass</button>' : ''}`;
  el().innerHTML = `${top}
    <div class="sv-me"><div class="sv-spirebox">${spireSVG(t.stages, `var(--seat-${you})`)}</div>
      <div class="sv-info"><p class="sv-need"><small>Next stage</small>${st ? `${need} · <b>+${st.pts}</b>` : 'Your spire is complete'}</p>${tableauHTML(t)}</div></div>`;
  $('#panel').innerHTML = '';
  renderHand([]);
}
