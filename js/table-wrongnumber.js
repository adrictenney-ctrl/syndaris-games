// Wrong Number on the table: a big phone screen in the middle. The text from the unknown
// number arrives; once everyone has replied, the replies pop in as anonymous bubbles, and the
// Receiver's favourite is revealed with who sent it.
import * as W from './wrongnumber.js?v=66';
import { snap } from './cards.js?v=66';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function build() {
  root = document.createElement('div');
  root.id = 'wrongnumber';
  root.innerHTML = `<div class="wn-phone"><header><i></i><div><b>Unknown number</b><small></small></div></header><div class="wn-chat"></div></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: { target: 5 },
  settingsHTML: s => `<label>Play to <select data-set="target">${[3, 5, 7, 10].map(n => `<option value="${n}" ${n === s.target ? 'selected' : ''}>${n} points</option>`).join('')}</select></label>`,
  create: (settings, players) => W.createGame(settings, players),
  act: W.applyAction,
  bot: W.botAction,
  view: W.viewFor,
  turn: () => -1,
  timer(g, players) {
    if (g.phase === 'won') return { ms: Math.max(0, g.nextAt - Date.now()) + 20, run: () => W.advance(g) };
    if (g.phase === 'reply') {
      const b = g.order.find(s => players[s]?.bot && s !== g.receiver && g.played[s] == null);
      if (b != null) return { ms: 900 + Math.random() * 900, run: () => W.applyAction(g, b, W.botAction(g, b)) };
    }
    if (g.phase === 'judge' && players[g.receiver]?.bot) return { ms: 3500, run: () => W.applyAction(g, g.receiver, W.botAction(g, g.receiver)) };
    return null;
  },
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (seat === g.receiver) badges.push('<span class="badge alone">📱 receiver</span>');
    else if (g.phase === 'reply') badges.push(g.played[seat] != null ? '<span class="badge got">replied</span>' : '<span class="badge">typing…</span>');
    if (g.pick?.seat === seat && g.phase !== 'reply') badges.push('<span class="badge got">+1</span>');
    return { badges, meta: `<span><b>${g.score[seat]}</b> point${g.score[seat] === 1 ? '' : 's'}</span>`, cards: 0, turn: seat === g.receiver, out: false };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    root.style.setProperty('--ph', Math.min(felt.height - v * 30, v * 66) + 'px');
    const view = W.viewFor(g, -1);
    const k = JSON.stringify([g.round, g.phase, view.waiting.length, g.pick?.i]);
    if (k === key) return;
    const fresh = key && JSON.parse(key)[1] !== g.phase;
    key = k;
    root.querySelector('header small').textContent = `Round ${g.round} · texting ${ctx.nameOf(g.receiver)}`;
    const chat = root.querySelector('.wn-chat');
    let h = `<div class="wn-msg in"><p>${esc(view.prompt)}</p><small>to ${esc(ctx.nameOf(g.receiver))}</small></div>`;
    if (g.phase === 'reply') {
      const n = g.order.length - 1, done = n - view.waiting.length;
      h += `<div class="wn-typing"><i></i><i></i><i></i></div><p class="wn-note">${done} of ${n} replied${view.waiting.length && view.waiting.length <= 2 ? ` · waiting on ${view.waiting.map(s => esc(ctx.nameOf(s))).join(' & ')}` : ''}</p>`;
    } else {
      h += view.replies.map((r, i) => {
        const won = g.pick && g.pick.i === i;
        return `<div class="wn-msg out${won ? ' won' : g.pick ? ' lost' : ''}" style="animation-delay:${i * 0.25}s"><p>${esc(r)}</p>${won ? `<small>— ${esc(ctx.nameOf(g.pick.seat))} ✓</small>` : ''}</div>`;
      }).join('');
      h += `<p class="wn-note">${g.pick ? `${esc(ctx.nameOf(g.receiver))} picked ${esc(ctx.nameOf(g.pick.seat))}'s reply` : `${esc(ctx.nameOf(g.receiver))} is choosing a favourite…`}</p>`;
    }
    chat.innerHTML = h;
    chat.scrollTop = chat.scrollHeight;
    if (fresh) snap(0.4);
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const order = g.order.slice().sort((a, b) => g.score[b] - g.score[a]);
    return {
      key: 'over' + g.round,
      html: `<h2>${ctx.nameOf(g.pick.seat)} wins</h2><p>“${esc(W.viewFor(g, -1).pick.text)}”</p>
        <ol class="scores">${order.map(s => `<li>${ctx.nameOf(s)} <b>${g.score[s]}</b></li>`).join('')}</ol>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
