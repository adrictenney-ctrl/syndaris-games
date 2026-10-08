// Spades on a phone: bid how many tricks you'll take (0 is Nil), then play — tap a bright card
// twice, or swipe it up.
import { $, setHud, setStatus } from './phone-kit.js?v=64';
import { playHand } from './play-hearts.js?v=64';
import { teamOf, partnerOf } from './spades.js?v=64';

let wasMyTurn = false, pick = null, lastHand = -1;
export function reset() { pick = null; lastHand = -1; }
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)} · partner ${c.nameOf(partnerOf(c.st.you))}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
}

export function render(c) {
  const g = c.st.game, you = c.st.you, t = teamOf(you);
  if (g.handNo !== lastHand) { lastHand = g.handNo; pick = null; }
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)} · partner ${c.nameOf(partnerOf(you))}`;
  const k = x => g.tricksWon[x] + g.tricksWon[x + 2], bid = x => [x, x + 2].reduce((a, s) => a + (g.bids[s] || 0), 0);
  setHud('#hudL', 'Us', g.scores[t], g.phase === 'bid' ? `${g.bags[t]} bags` : `${k(t)}/${bid(t)} tricks`);
  $('#hudC').innerHTML = `<span>Bid</span><b>${g.bids[you] ?? '–'}</b>`;
  setHud('#hudR', 'Them', g.scores[1 - t], g.phase === 'bid' ? `${g.bags[1 - t]} bags` : `${k(1 - t)}/${bid(1 - t)} tricks`);
  const myTurn = P_turn(g) === you;
  document.body.classList.toggle('myturn', myTurn);
  if (myTurn && !wasMyTurn) navigator.vibrate?.([60, 40, 60]);
  wasMyTurn = myTurn;
  const p = $('#panel');
  const log = `<div class="tk-bidlog">${[0, 1, 2, 3].map(s => `<span>${c.nameOf(s)} <b>${g.bids[s] == null ? '…' : g.bids[s] === 0 ? 'Nil' : g.bids[s]}</b></span>`).join('')}</div>`;
  if (g.phase === 'bid') {
    if (myTurn) {
      setStatus('Your bid', 'How many tricks will you take? 0 = Nil (you take none, ±100)');
      p.innerHTML = `${log}<div class="tk-bids">${[...Array(14).keys()].map(n => `<button class="panel-btn ${pick === n ? 'sel' : ''}" data-n="${n}">${n === 0 ? 'Nil' : n}</button>`).join('')}</div><button class="panel-btn go wide" id="spBid" ${pick == null ? 'disabled' : ''}>Bid ${pick === 0 ? 'Nil' : pick ?? ''}</button>`;
      p.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => { pick = Number(b.dataset.n); render(c); }; });
      $('#spBid').onclick = () => c.send({ type: 'bid', n: pick });
    } else { setStatus(`${c.nameOf(g.turn)} is bidding…`, 'Look over your hand'); p.innerHTML = log; }
  } else {
    p.innerHTML = g.phase === 'play' || g.phase === 'trickEnd' ? log : '';
    if (g.phase === 'over') setStatus(g.winner === t ? '🏆 Your team wins!' : 'Game over', 'Look at the table to play again');
    else if (g.phase === 'handEnd') setStatus(`Your team ${g.result[t].pts >= 0 ? '+' : ''}${g.result[t].pts}`, g.result[t].lines.join(' · '));
    else if (myTurn) setStatus('Your turn', g.trick.length ? 'Follow suit if you can — or trump with a spade' : g.broken ? 'Lead anything' : "Lead anything but spades — they aren't broken");
    else setStatus(g.phase === 'play' ? `${c.nameOf(g.turn)}'s turn` : 'Trick over', '');
  }
  playHand(c, g, { legal: g.legal, myTurn: myTurn && g.phase === 'play', send: c.send });
}
const P_turn = g => (g.phase === 'bid' || g.phase === 'play' ? g.turn : -1);
