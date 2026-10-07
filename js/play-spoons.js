// Spoons on a player's phone: the card coming your way sits on top. Tap one of your four
// cards to swap it in (yours goes left), or pass it straight on. The spoon button is always
// there — use it when you have four of a kind, or the moment you see spoons vanishing.
import { $, toast, setHud, setStatus, renderHand, cardEl } from './phone-kit.js?v=48';
import { WORD } from './spoons.js?v=48';
import { SPOON_SVG } from './table-spoons.js?v=48';

let ctx = null, lastIn = null, wasQuads = false, panelKey = '';

export function reset() { lastIn = null; panelKey = ''; }

export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  $('#board').innerHTML = '';
}

const letters = n => [...WORD].map((ch, i) => `<i class="${i < n ? 'on' : ''}">${ch}</i>`).join('');

export function render(c) {
  ctx = c;
  const g = c.st.game;
  const you = c.st.you;
  $('#whoami').innerHTML = `<i style="background:var(--seat-${you})"></i>${c.nameOf(you)}`;
  $('#hudL').innerHTML = `<span>Letters</span><b class="sp-hud">${letters(g.letters[you])}</b>`;
  $('#hudC').innerHTML = `<span>Round</span><b>${g.round}</b>`;
  setHud('#hudR', 'Spoons', g.spoons - g.grabbed.length, `of ${g.spoons}`);

  if (g.quads && !wasQuads) navigator.vibrate?.([80, 40, 80, 40, 80]);
  wasQuads = g.quads;

  // The card coming your way.
  const board = $('#board');
  const k = [g.phase, g.incoming, g.waiting].join('|');
  if (board.dataset.k !== k) {
    board.dataset.k = k;
    board.innerHTML = '';
    if (g.phase === 'play' && g.inRound) {
      const wrap = document.createElement('div');
      wrap.className = 'sp-in';
      const from = g.dealer === you ? 'Off the deck' : `From ${c.nameOf(g.order[g.order.indexOf(you) - 1])}`;
      if (g.incoming) {
        const ce = cardEl(g.incoming);
        if (g.incoming !== lastIn) ce.classList.add('slide-in');
        wrap.appendChild(ce);
      } else wrap.insertAdjacentHTML('beforeend', '<div class="sp-empty">Waiting for a card…</div>');
      wrap.insertAdjacentHTML('beforeend', `<p>${from}${g.waiting > 1 ? ` · <b>${g.waiting - 1}</b> more waiting` : ''}</p>`);
      board.appendChild(wrap);
    }
    lastIn = g.incoming;
  }

  if (g.phase === 'over') setStatus(g.winner === you ? '🏆 You win!' : `${c.nameOf(g.winner)} wins`, 'Look at the table to play again');
  else if (!g.inRound) setStatus(g.out[you] ? "You're out — S·P·O·O·N" : 'Sit tight', 'Watch the spoons on the table');
  else if (g.phase === 'roundOver') setStatus(g.loser === you ? 'No spoon for you!' : g.mine ? 'Got one! 🥄' : 'Round over', g.loser === you ? `That's ${WORD.slice(0, g.letters[you])}` : 'Next round in a moment');
  else if (g.mine) setStatus('Safe! 🥄', 'You have a spoon — wait for the round to end');
  else if (g.quads) setStatus('Four of a kind!', 'GRAB A SPOON — quick!');
  else if (g.incoming) setStatus('Keep it or pass it', 'Tap one of your cards to swap it in');
  else setStatus('Waiting for a card…', 'Keep an eye on the spoons');

  // Pass + the spoon.
  const pk = [g.phase, !!g.incoming, g.mine, g.quads, g.inRound].join('|');
  if (pk !== panelKey) {
    panelKey = pk;
    const p = $('#panel');
    if (g.phase !== 'play' || !g.inRound) p.innerHTML = '';
    else {
      p.innerHTML = `<button class="panel-btn wide" id="spPass" ${g.incoming && !g.mine ? '' : 'disabled'}>Pass it on →</button>
        <button class="sp-grab${g.quads ? ' hot' : ''}" id="spGrab" ${g.mine ? 'disabled' : ''}>${SPOON_SVG}<span>${g.mine ? 'You have a spoon' : 'Grab a spoon'}</span></button>`;
      $('#spPass').onclick = () => { if (ctx.st.game.incoming) { ctx.send({ type: 'pass' }); navigator.vibrate?.(10); } };
      $('#spGrab').onclick = () => { ctx.send({ type: 'grab' }); navigator.vibrate?.(30); };
    }
  }

  renderHand(g.hand, {
    onTap: card => {
      const cur = ctx.st.game;
      if (cur.phase !== 'play' || cur.mine) return;
      if (!cur.incoming) return toast('No card to swap in yet');
      ctx.send({ type: 'swap', card });
      navigator.vibrate?.(12);
    },
    hint: g.phase === 'play' && g.incoming && !g.mine ? 'Tap a card to give it away and keep the new one' : '',
  });
}
