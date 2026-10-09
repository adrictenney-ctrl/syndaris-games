// Inside Job on the table: the community cards, the chips still in the middle, the vault and
// alarm track, and at the showdown the lineup of hands from the lowest red chip to the highest.
import * as J from './insidejob.js?v=68';
import { cardEl, snap } from './cards.js?v=68';

let root = null;
let key = '';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const chipHTML = (k, round, extra = '') =>
  `<span class="pchip c-${J.ROUNDS[round]}" ${extra}><b>${(k + 1) * 100}</b></span>`;

function cards(list, cw, cls = '') {
  const wrap = document.createElement('div');
  wrap.className = 'ij-cards ' + cls;
  for (const c of list) {
    const el = cardEl(c || null, !c);
    el.style.setProperty('--cw', cw + 'px');
    wrap.appendChild(el);
  }
  return wrap;
}

function track(g) {
  const v = Array.from({ length: 3 }, (_, i) => `<i class="vault${i < g.vaults ? ' on' : ''}"></i>`).join('');
  const a = Array.from({ length: 3 }, (_, i) => `<i class="alarm${i < g.alarms ? ' on' : ''}"></i>`).join('');
  return `<div class="ij-track"><span>Vaults</span>${v}<em></em><span>Alarms</span>${a}</div>`;
}

function render(g, ctx) {
  const cw = ctx.vmin * 7.6 * ctx.cardScale;
  root.style.setProperty('--v', ctx.vmin + 'px');
  root.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'ij-head';
  const roundName = g.phase === 'chips' ? `${J.ROUND_NAME[g.round]} · ${J.ROUNDS[g.round]} chips` : g.phase === 'pick' ? 'After the flop' : 'The showdown';
  head.innerHTML = `<b>Heist ${g.heist}</b><span>${roundName}</span>${track(g)}`;
  root.appendChild(head);

  if (g.twist) {
    const t = J.TWISTS[g.twist];
    root.insertAdjacentHTML('beforeend', `<div class="ij-twist ${t.kind}"><small>${t.kind === 'specialist' ? 'Specialist' : 'Complication'}</small><b>${t.name}</b><span>${t.text}</span></div>`);
  }

  // Community cards (five spots; unturned ones stay face down).
  const blind = g.twist === 'blindriver' && g.board.length === 5 && !['showdown', 'result', 'over'].includes(g.phase);
  const board = [0, 1, 2, 3, 4].map(i => (i < g.board.length && !(blind && i === 4) ? g.board[i] : null));
  if (!g.board.length && g.early) board[0] = g.early;
  const bw = cards(board, cw, 'board');
  [...bw.children].forEach((el, i) => { if (!board[i]) el.classList.add('unturned'); });
  root.appendChild(bw);

  if (g.phase === 'chips') {
    const row = g.chips[g.round];
    const free = row.map((o, k) => (o === null ? k : -1)).filter(k => k >= 0);
    const held = row.length - free.length;
    const ready = g.crew.filter(s => g.ready[s]).length;
    root.insertAdjacentHTML('beforeend', `
      <div class="ij-middle">${free.length ? free.map(k => chipHTML(k, g.round)).join('') : '<p>All chips taken</p>'}</div>
      <p class="ij-msg">${free.length ? `Take the chip that matches your hand: 100 is the weakest hand at the table, ${row.length * 100} the strongest. No talking about cards!` : `${ready} of ${g.crew.length} are happy with their chips${held === row.length && ready < g.crew.length ? ' · anyone can still take a chip' : ''}`}</p>`);
  } else if (g.phase === 'pick') {
    root.insertAdjacentHTML('beforeend', `<p class="ij-msg">${g.pick.mode === 'drop' ? 'Everyone drops one of their three cards' : 'Everyone may swap one card for a fresh one'} · waiting on ${g.crew.filter(s => !g.pick.done[s]).length}</p>`);
  } else if (g.show) {
    // The lineup, lowest red chip first.
    const line = document.createElement('div');
    line.className = 'ij-lineup';
    g.show.order.forEach(({ seat, value }, i) => {
      const on = i < g.show.revealed;
      const h = g.show.hands[seat];
      const bad = on && g.show.bad.includes(i);
      const slot = document.createElement('div');
      slot.className = 'ij-slot' + (on ? ' on' : '') + (bad ? ' bad' : on && i > 0 ? ' good' : '');
      slot.innerHTML = `${chipHTML(value - 1, 3)}<span class="nm"><i style="background:var(--seat-${seat})"></i>${esc(ctx.nameOf(seat))}</span>`;
      slot.appendChild(cards(on ? g.hole[seat] : [null, null], cw * 0.8));
      slot.insertAdjacentHTML('beforeend', `<span class="hand">${on ? h.name : '…'}</span>${bad ? '<span class="mark">✗ out of order</span>' : ''}`);
      line.appendChild(slot);
    });
    root.appendChild(line);
    if (g.phase === 'result' || (g.phase === 'over' && g.result)) {
      const ok = g.result.ok;
      root.insertAdjacentHTML('beforeend', `<div class="ij-verdict ${ok ? 'ok' : 'bad'}">${ok ? '🔓 The vault is open!' : '🚨 The alarm went off!'}</div>`);
      if (g.phase === 'result') {
        const nt = g.nextTwist ? J.TWISTS[g.nextTwist] : null;
        root.insertAdjacentHTML('beforeend', `<p class="ij-msg">${nt ? `Next heist: ${nt.kind === 'specialist' ? 'a Specialist joins the crew' : 'a Complication'} · <b>${nt.name}</b> · ` : ''}<button class="tool" data-a="next" type="button">Next heist</button></p>`);
        root.querySelector('[data-a="next"]').onclick = () => ctx.act(g.crew[0], { type: 'next' });
      }
    }
  }
}

export default {
  defaults: { twists: true },

  settingsHTML: s => `
    <label><input type="checkbox" data-set="twists" ${s.twists ? 'checked' : ''}> Complications and Specialists</label>
    <p class="hint">Crack 3 vaults before 3 alarms go off. After a cracked vault the next heist gets a Complication; after an alarm, a Specialist helps out.</p>`,

  create: (settings, players) => J.createGame(settings, players),
  act: J.applyAction,
  bot: J.botAction,
  view: J.viewFor,
  turn: J.turn,
  timer: J.timer,
  joinMidGame: () => false,

  plate(g, seat) {
    const badges = [];
    const inCrew = g.crew.includes(seat);
    if (!inCrew) badges.push('<span class="badge off">next heist</span>');
    if (g.phase === 'chips' && g.ready[seat]) badges.push('<span class="badge got">✓ happy</span>');
    if (g.phase === 'pick' && inCrew && !g.pick.done[seat]) badges.push('<span class="badge">choosing…</span>');
    // The chips in front of this player: earlier rounds small, this round big.
    const pile = g.chips.map((row, r) => {
      if (!row) return '';
      const k = row.indexOf(seat);
      if (k < 0) return r === g.round && g.phase === 'chips' ? '<span class="pchip empty"></span>' : '';
      return chipHTML(k, r, r === g.round && g.phase === 'chips' ? 'data-now' : '');
    }).join('');
    const shown = g.shown[seat] ? `<span class="ij-shown">shows ${g.shown[seat][0].replace('T', '10')}${{ S: '♠', H: '♥', D: '♦', C: '♣' }[g.shown[seat][1]]}</span>` : '';
    return {
      badges,
      meta: `<span class="ij-pile">${pile}</span>${shown}`,
      cards: inCrew && !['showdown', 'result', 'over'].includes(g.phase) ? g.hole[seat].length : 0,
      turn: false,
      out: !inCrew,
    };
  },

  reset() {
    root?.remove();
    root = null;
    key = '';
  },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) {
      root = document.createElement('div');
      root.id = 'heist';
      document.getElementById('center').appendChild(root);
    }
    const k = JSON.stringify([g.heist, g.phase, g.round, g.chips, g.ready, g.board, g.show?.revealed, g.pick?.done, g.vaults, g.alarms, ctx.cardScale, ctx.vmin, ctx.upright]);
    if (k === key) return;
    if (key && JSON.parse(key)[5]?.length !== g.board.length) snap(0.3);
    key = k;
    render(g, ctx);
  },

  overlay(g) {
    if (g.phase !== 'over') return null;
    const won = g.vaults >= 3;
    return {
      key: 'over' + g.heist,
      html: `<h2>${won ? 'The crew got away with it!' : 'Busted!'}</h2>
        <p>${won ? `Three vaults cracked with ${g.alarms} alarm${g.alarms === 1 ? '' : 's'}.` : `Three alarms went off after ${g.vaults} vault${g.vaults === 1 ? '' : 's'}.`}</p>
        <p class="scoreline">${g.history.map(ok => (ok ? '🔓' : '🚨')).join(' ')}</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
