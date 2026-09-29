// Euchre on the table screen: rules hookup, seat plates, trick area, end-of-hand panel.
import * as E from './euchre.js?v=4';
import { cardEl, setFace, snap } from './cards.js?v=4';

const DIR = [[0, 1], [-1, 0], [0, -1], [1, 0]]; // toward each side's edge

let shown = []; // trick cards on the felt: { card, seat, el, jitter }

export default {
  defaults: { target: 10, stickDealer: true },

  settingsHTML: s => `
    <label><input type="checkbox" data-set="stickDealer" ${s.stickDealer ? 'checked' : ''}> Stick the dealer</label>
    <label>Play to <select data-set="target">${[5, 7, 10, 11].map(n => `<option ${n === s.target ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`,

  create: settings => E.createGame(settings),
  act: E.applyAction,
  bot: E.botAction,
  view: E.viewFor,
  turn: g => (['bid1', 'bid2', 'discard', 'play'].includes(g.phase) ? g.turn : -1),
  timer(g) {
    if (g.phase === 'trickEnd') return { ms: 1700, run: () => E.advance(g) };
    if (g.phase === 'handEnd') return { ms: 6500, run: () => E.advance(g) };
    return null;
  },
  joinMidGame: () => false,

  plate(g, pos) {
    const out = g.alone !== null && E.partnerOf(g.alone) === pos;
    const badges = [];
    if (g.dealer === pos) badges.push('<span class="badge dealer">DEALER</span>');
    if (g.maker === pos && g.trump) badges.push(`<span class="badge maker ${E.isRed(g.trump) ? 'red' : ''}">called ${E.SUIT_SYMBOL[g.trump]}</span>`);
    if (g.alone === pos) badges.push('<span class="badge alone">ALONE</span>');
    if (out) badges.push('<span class="badge off">sitting out</span>');
    const team = E.teamOf(pos);
    const tricks = g.tricksWon[pos] + g.tricksWon[E.partnerOf(pos)];
    const pips = g.trump ? `<span class="pips">${[0, 1, 2, 3, 4].map(i => `<i class="${i < tricks ? 'on' : ''}"></i>`).join('')}</span>` : '';
    return {
      badges,
      meta: `<span>We <b>${g.score[team]}</b> · They <b>${g.score[1 - team]}</b></span>${pips}`,
      cards: g.hands[pos].length,
      turn: g.turn === pos && !['trickEnd', 'handEnd', 'gameOver'].includes(g.phase),
      out,
    };
  },

  reset() {
    shown.forEach(s => s.el.remove());
    shown = [];
    const k = document.getElementById('kitty');
    k.innerHTML = '';
    delete k.dataset.key;
  },

  renderCenter(g, ctx) {
    const wm = document.getElementById('watermark');
    wm.textContent = g.trump ? E.SUIT_SYMBOL[g.trump] : '';
    wm.classList.toggle('red', !!g.trump && E.isRed(g.trump));

    const rot = seat => ctx.rot(seat);
    const spot = (seat, jitter) => {
      const [dx, dy] = DIR[ctx.layout[seat].side];
      return `translate(-50%, -50%) translate(${dx * 11.5}vmin, ${dy * 9.5}vmin) rotate(${rot(seat) + jitter}deg)`;
    };
    const edge = (seat, extra = '') => {
      const [dx, dy] = DIR[ctx.layout[seat].side];
      return `translate(-50%, -50%) translate(${dx * 70}vmin, ${dy * 55}vmin) rotate(${rot(seat)}deg) ${extra}`;
    };

    // Kitty + up-card while bidding.
    const kitty = document.getElementById('kitty');
    const bidding = ['bid1', 'bid2', 'discard'].includes(g.phase);
    if (!bidding) { kitty.innerHTML = ''; delete kitty.dataset.key; }
    else {
      const faceUp = g.phase === 'bid1';
      const key = `${g.handNo}-${g.phase === 'discard' ? 'd' : faceUp}-${ctx.upright}`;
      if (kitty.dataset.key !== key) {
        kitty.dataset.key = key;
        kitty.innerHTML = '';
        for (let i = 0; i < 3; i++) {
          const c = cardEl(null, true);
          c.style.transform = `translate(-50%, -50%) translate(${i * 0.4}vmin, ${-i * 0.4}vmin) rotate(${rot(g.dealer) + (i - 1) * 4}deg)`;
          kitty.appendChild(c);
        }
        if (g.phase !== 'discard') {
          const up = cardEl(faceUp ? g.upcard : null, !faceUp);
          up.style.transform = `translate(-50%, -50%) translate(1.4vmin, -1.4vmin) rotate(${rot(g.dealer) + 3}deg)`;
          kitty.appendChild(up);
        }
      }
    }

    // Trick: slide new cards in from their player's edge; sweep old ones to the winner.
    const trick = document.getElementById('trick');
    const cur = g.trick;
    const stale = shown.filter(s => !cur.some(c => c.card === s.card));
    if (stale.length) {
      const w = g.lastTrick?.winner;
      for (const s of stale) {
        s.el.classList.remove('win');
        if (w != null) s.el.style.transform = edge(w, 'scale(.6)');
        s.el.classList.add('gone');
        setTimeout(() => s.el.remove(), 600);
      }
      shown = shown.filter(s => !stale.includes(s));
    }
    for (const p of cur) {
      if (shown.some(s => s.card === p.card)) continue;
      const el = cardEl(null, true);
      setFace(el, p.card);
      const jitter = Math.round((Math.random() - 0.5) * 14);
      el.style.transform = edge(p.seat);
      el.style.zIndex = String(cur.indexOf(p) + 1);
      trick.appendChild(el);
      el.getBoundingClientRect(); // commit the start position before transitioning
      el.style.transform = spot(p.seat, jitter);
      shown.push({ ...p, el, jitter });
      snap();
    }
    for (const s of shown) {
      s.el.classList.toggle('win', g.phase === 'trickEnd' && s.seat === g.trickWinner);
      s.el.style.transform = spot(s.seat, s.jitter);
    }
  },

  overlay(g, ctx) {
    if (!['handEnd', 'gameOver'].includes(g.phase)) return null;
    const teamNames = team => [team, team + 2].map(ctx.nameOf).join(' & ');
    const r = g.result;
    const maker = ctx.nameOf(g.maker);
    let headline, detail;
    if (r.euchred) {
      headline = 'Euchred!';
      detail = `${maker} called ${E.SUIT_NAME[g.trump]} but took only ${r.makerTricks}. ${teamNames(r.team)} +2`;
    } else if (r.march) {
      headline = r.alone ? 'Loner sweep!' : 'March!';
      detail = `${teamNames(r.team)} took all 5 tricks · +${r.pts}`;
    } else {
      headline = 'Made it';
      detail = `${teamNames(r.team)} took ${r.makerTricks} tricks · +1`;
    }
    const scoreline = `${teamNames(0)} <b>${g.score[0]}</b> — <b>${g.score[1]}</b> ${teamNames(1)}`;
    if (g.phase === 'gameOver') {
      return {
        key: 'over' + g.handNo,
        html: `<h2>${teamNames(g.winner)} win!</h2><p>${headline} ${detail}</p><p class="scoreline">${scoreline}</p>
          <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
      };
    }
    return {
      key: 'hand' + g.handNo,
      html: `<h2>${headline}</h2><p>${detail}</p><p class="scoreline">${scoreline}</p>
        <p class="hint">Next hand in a moment… <button class="tool" data-do="next">Deal now</button></p>`,
      next: () => { if (g.phase === 'handEnd') E.advance(g); },
    };
  },
};
