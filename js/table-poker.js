// Texas Hold'em on the table screen: board, pot, bets in front of each player, showdown.
import * as P from './poker.js?v=42';
import { cardEl, setFace, snap } from './cards.js?v=42';

let boardKey = null;
let boardEls = [];
const betEls = new Map();   // seat -> element showing that seat's bet this round
let revealEls = new Map();  // seat -> [cardEl, cardEl, label]
let payoutKey = null;

const chipCount = n => Math.max(1, Math.min(6, Math.ceil(Math.log10(n + 1) * 1.6)));

function chipPile(amount) {
  const el = document.createElement('div');
  el.className = 'bet';
  el.innerHTML = `<div class="stack"></div><b></b>`;
  setPile(el, amount);
  return el;
}
function setPile(el, amount) {
  const n = chipCount(amount);
  const stack = el.querySelector('.stack');
  if (stack.childElementCount !== n) stack.innerHTML = Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join('');
  el.querySelector('b').textContent = amount.toLocaleString();
}
const place = (el, pt, rot, extra = '') => {
  el.style.transform = `translate(-50%, -50%) translate(${pt.x}px, ${pt.y}px) rotate(${rot}deg) ${extra}`;
};
function fadeOut(el, to, rot) {
  if (to) place(el, to, rot, 'scale(.7)');
  el.classList.add('gone');
  setTimeout(() => el.remove(), 650);
}

export default {
  defaults: { startChips: 1000, sb: 10, bb: 20, rebuy: true },

  settingsHTML: s => `
    <label>Chips <select data-set="startChips">${[500, 1000, 2000, 5000].map(n => `<option value="${n}" ${n === s.startChips ? 'selected' : ''}>${n.toLocaleString()}</option>`).join('')}</select></label>
    <label>Blinds <select data-set="blinds">${[[5, 10], [10, 20], [25, 50], [50, 100]].map(([a, b]) => `<option value="${a}/${b}" ${a === s.sb ? 'selected' : ''}>${a}/${b}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-set="rebuy" ${s.rebuy ? 'checked' : ''}> Rebuys</label>`,

  applySetting(s, key, el) {
    if (key !== 'blinds') return false;
    [s.sb, s.bb] = el.value.split('/').map(Number);
    return true;
  },

  create: (settings, players) => P.createGame(settings, players.map(Boolean)),
  act: P.applyAction,
  bot: P.botAction,
  view: P.viewFor,
  turn: g => (g.runout ? -1 : g.toAct ?? -1),
  timer(g) {
    if (g.phase === 'showdown') return { ms: g.result.type === 'fold' ? 3200 : 6500, run: () => P.advance(g) };
    if (g.runout) return { ms: 1500, run: () => P.runoutStep(g) };
    return null;
  },
  joinMidGame(g, seat) { P.addPlayer(g, seat); return true; },

  plate(g, seat) {
    const s = g.seats[seat];
    if (!s) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    const playing = g.phase !== 'gameOver';
    if (playing && g.button === seat) badges.push('<span class="badge dealer">D</span>');
    if (playing && s.inHand && g.sbSeat === seat && g.phase === 'preflop') badges.push('<span class="badge">SB</span>');
    if (playing && s.inHand && g.bbSeat === seat && g.phase === 'preflop') badges.push('<span class="badge">BB</span>');
    if (s.allIn && s.inHand && !s.folded) badges.push('<span class="badge alone">ALL IN</span>');
    if (s.folded) badges.push('<span class="badge off">folded</span>');
    if (!s.inHand && s.chips === 0) badges.push('<span class="badge off">out of chips</span>');
    else if (!s.inHand) badges.push('<span class="badge off">next hand</span>');
    const revealed = (g.runout || (g.phase === 'showdown' && g.result?.type === 'showdown')) && s.inHand && !s.folded;
    return {
      badges,
      meta: `<span class="chips-count"><i class="chip-dot"></i><b>${s.chips.toLocaleString()}</b></span>`,
      cards: s.inHand && !s.folded && !revealed ? 2 : 0,
      turn: g.toAct === seat && !g.runout && ['preflop', 'flop', 'turn', 'river'].includes(g.phase),
      out: s.folded || !s.inHand,
    };
  },

  reset() {
    boardEls.forEach(e => e.remove());
    boardEls = [];
    boardKey = null;
    betEls.forEach(e => e.remove());
    betEls.clear();
    revealEls.forEach(els => els.forEach(e => e.remove()));
    revealEls = new Map();
    payoutKey = null;
    document.querySelectorAll('.pot-label').forEach(e => e.remove());
  },

  renderCenter(g, ctx) {
    const center = document.getElementById('center');
    document.getElementById('watermark').textContent = '';
    const cw = ctx.vmin * 8 * ctx.cardScale;

    // Pot label (twice, so both long sides of a flat table can read it).
    let labels = [...document.querySelectorAll('.pot-label')];
    if (!labels.length) {
      labels = [0, 180].map(r => {
        const el = document.createElement('div');
        el.className = 'pot-label' + (r ? ' mirror-label' : '');
        el.style.setProperty('--r', r + 'deg');
        center.appendChild(el);
        return el;
      });
    }
    let text = '';
    if (g.phase === 'showdown') {
      const w = g.result.winners;
      text = w.map(x => `${ctx.nameOf(x.seat)} wins ${x.amount.toLocaleString()}${x.hand ? ' · ' + x.hand : ''}`).join('  ·  ');
    } else if (g.phase !== 'gameOver') text = `Pot ${P.potTotal(g).toLocaleString()}`;
    labels.forEach(l => { l.textContent = text; l.classList.toggle('big', g.phase === 'showdown'); l.style.setProperty('--dy', Math.max(ctx.vmin * 9, cw * 1.12) + 'px'); });

    // Board.
    const key = g.handNo;
    if (boardKey !== key) {
      boardEls.forEach(e => fadeOut(e));
      boardEls = [];
      boardKey = key;
    }
    const best = g.phase === 'showdown' && g.result.type === 'showdown'
      ? g.result.hands[g.result.winners.slice().sort((a, b) => b.amount - a.amount)[0].seat].best : null;
    g.board.forEach((c, i) => {
      let el = boardEls[i];
      const x = (i - 2) * cw * 1.1;
      if (!el) {
        el = cardEl(null, true);
        el.classList.add('board-card');
        el.style.setProperty('--cw', cw + 'px');
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${-ctx.vmin * 12}px) scale(.4)`;
        el.style.opacity = '0';
        center.appendChild(el);
        el.getBoundingClientRect();
        const delay = boardEls.filter(Boolean).length >= 3 || i < 3 ? (i % 3) * 110 : 0;
        setTimeout(() => {
          setFace(el, c);
          el.classList.add('board-card');
          el.style.setProperty('--cw', cw + 'px');
          el.style.transform = `translate(-50%, -50%) translate(${x}px, 0px)`;
          el.style.opacity = '';
          snap(0.3);
        }, delay);
        boardEls[i] = el;
      } else {
        el.style.setProperty('--cw', cw + 'px');
        if (el.dataset.card) el.style.transform = `translate(-50%, -50%) translate(${x}px, 0px)`;
      }
      el.classList.toggle('dimmed', !!best && !best.includes(c));
      el.classList.toggle('win', !!best && best.includes(c));
    });

    // Bets in front of each player; when a betting round ends they slide into the pot.
    g.seats.forEach((s, seat) => {
      const amount = s ? s.bet : 0;
      let el = betEls.get(seat);
      const rot = ctx.rot(seat);
      if (amount > 0) {
        if (!el) {
          el = chipPile(amount);
          center.appendChild(el);
          place(el, ctx.inset(seat, 12), rot);
          el.getBoundingClientRect();
          betEls.set(seat, el);
          snap(0.25);
        }
        setPile(el, amount);
        place(el, ctx.inset(seat, 36), rot);
      } else if (el) {
        fadeOut(el, { x: 0, y: 0 }, rot);
        betEls.delete(seat);
      }
    });

    // Showdown: winners' chips slide from the middle to them.
    if (g.phase === 'showdown' && payoutKey !== g.handNo) {
      payoutKey = g.handNo;
      for (const w of g.result.winners) {
        const el = chipPile(w.amount);
        el.classList.add('payout');
        center.appendChild(el);
        place(el, { x: 0, y: ctx.vmin * 8 }, 0);
        el.getBoundingClientRect();
        setTimeout(() => place(el, ctx.inset(w.seat, 24), ctx.rot(w.seat)), 900);
        setTimeout(() => fadeOut(el), 2600);
      }
    }

    // Face-up hole cards at showdown (or once everyone left is all in).
    const want = new Map();
    const revealing = g.runout || (g.phase === 'showdown' && g.result.type === 'showdown');
    if (revealing) g.seats.forEach((s, seat) => { if (s && s.inHand && !s.folded) want.set(seat, s.cards); });
    for (const [seat, els] of revealEls) {
      if (!want.has(seat) || els.handNo !== g.handNo) { els.forEach(e => fadeOut(e)); revealEls.delete(seat); }
    }
    const winners = new Set(g.phase === 'showdown' ? g.result.winners.map(w => w.seat) : []);
    for (const [seat, cards] of want) {
      const rot = ctx.rot(seat);
      const pt = ctx.inset(seat, 27);
      let els = revealEls.get(seat);
      if (!els) {
        els = cards.map(c => {
          const el = cardEl(c);
          el.classList.add('hole-card');
          center.appendChild(el);
          return el;
        });
        const label = document.createElement('div');
        label.className = 'hand-label';
        center.appendChild(label);
        els.push(label);
        els.handNo = g.handNo;
        revealEls.set(seat, els);
      }
      const hand = g.phase === 'showdown' ? g.result.hands[seat] : null;
      els.forEach((el, i) => {
        if (i < 2) {
          el.style.setProperty('--cw', cw * 0.9 + 'px');
          place(el, pt, rot, `translateX(${(i - 0.5) * cw * 0.62}px) rotate(${(i - 0.5) * 8}deg)`);
          el.classList.toggle('win', winners.has(seat) && !!hand?.best.includes(cards[i]));
        } else {
          el.textContent = hand ? hand.name : '';
          el.classList.toggle('winner', winners.has(seat));
          place(el, pt, rot, `translateY(${-cw * 0.95}px)`);
        }
      });
    }
  },

  overlay(g, ctx) {
    if (g.phase !== 'gameOver') return null;
    const name = g.winner >= 0 ? ctx.nameOf(g.winner) : 'Nobody';
    return {
      key: 'over' + g.handNo,
      html: `<h2>${name} wins!</h2><p>Last player with chips after ${g.handNo} hands.</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
