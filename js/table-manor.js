// Midnight Manor on the table: the floor plan of the house, nine rooms, with every suspect's
// pawn and every weapon where it currently lies, secret passages in the corners, and a case log
// of suggestions (never which card was shown).
import * as M from './manor.js?v=58';
import { snap } from './cards.js?v=58';

let root = null, key = '';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const pawn = (i, cls = '') => `<i class="mm-pawn ${cls}" style="--c:${M.SUSPECT_COLOR[i]}" title="${M.SUSPECTS[i]}">${M.SUSPECTS[i].split(' ').pop()[0]}</i>`;
export const weapon = (i, cls = '') => `<i class="mm-weapon ${cls}" title="${M.WEAPONS[i]}">${M.WEAPON_ICON[i]}</i>`;

export function planHTML(g, opts = {}) {
  return `<div class="mm-plan">${M.ROOMS.map((name, r) => {
    const here = M.SUSPECTS.map((_, i) => i).filter(i => g.where[i] === r);
    const arms = M.WEAPONS.map((_, i) => i).filter(i => g.weaponAt[i] === r);
    const cls = ['mm-room', `r${r}`];
    if (opts.can?.includes(r)) cls.push('can');
    if (opts.mine === r) cls.push('mine');
    return `<${opts.can ? 'button' : 'div'} class="${cls.join(' ')}" data-room="${r}"><b>${name}</b>${M.PASSAGES[r] != null ? '<em class="mm-pass" title="Secret passage">⇲</em>' : ''}
      <span class="mm-in">${here.map(i => pawn(i)).join('')}</span><span class="mm-arms">${arms.map(i => weapon(i)).join('')}</span></${opts.can ? 'button' : 'div'}>`;
  }).join('')}</div>`;
}

export function logLine(e, nameOf) {
  const [s, w, r] = e.cards.map(c => +c.slice(1));
  const what = `${M.SUSPECTS[s]} · ${M.WEAPONS[w].toLowerCase()} · ${M.ROOMS[r]}`;
  if (e.type === 'suggest') return `<b>${esc(nameOf(e.seat))}</b> suggests ${what}`;
  if (e.type === 'shown') return `<b>${esc(nameOf(e.by))}</b> showed <b>${esc(nameOf(e.seat))}</b> a card`;
  if (e.type === 'none') return `Nobody could disprove <b>${esc(nameOf(e.seat))}</b>'s suggestion!`;
  if (e.type === 'accuse') return `<b>${esc(nameOf(e.seat))}</b> accuses: ${what} — ${e.right ? 'correct!' : 'wrong'}`;
  return '';
}

function build() {
  root = document.createElement('div');
  root.id = 'manor';
  root.innerHTML = `<div class="mm-house"></div><div class="mm-side"><h4>Case log</h4><ul class="mm-log"></ul><p class="mm-now"></p></div>`;
  document.getElementById('center').appendChild(root);
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Who did it, with what, and where? Our own suspects, weapons and mansion.</span>',
  create: (settings, players) => M.createGame(settings, players),
  act: M.applyAction,
  bot: M.botAction,
  view: M.viewFor,
  turn: g => (g.phase !== 'play' ? -1 : g.pending ? g.pending.asker : g.turn),
  timer: () => null,
  joinMidGame: () => false,

  plate(g, seat) {
    if (!g.seats[seat]) return { badges: [], meta: '', cards: 0 };
    const badges = [];
    if (g.out[seat]) badges.push('<span class="badge off">out of the running</span>');
    if (g.pending?.asker === seat) badges.push('<span class="badge alone">showing a card…</span>');
    if (g.winner === seat) badges.push('<span class="badge got">🔎 solved it</span>');
    return { badges, meta: `${pawn(g.suspectOf[seat], 'small')}<span>${M.SUSPECTS[g.suspectOf[seat]]}</span>`, cards: Math.min(g.hands[seat].length, 8), turn: g.phase === 'play' && g.turn === seat, out: g.out[seat] };
  },

  reset() { root?.remove(); root = null; key = ''; },

  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) build();
    const felt = document.getElementById('felt').getBoundingClientRect();
    const v = ctx.vmin;
    const H = Math.min(felt.height - v * 34, (felt.width - v * 60) * 0.62);
    root.style.setProperty('--H', H + 'px');
    const k = JSON.stringify([g.where, g.weaponAt, g.logId, g.turn, g.step, g.pending, g.phase, Math.round(H)]);
    if (k === key) return;
    if (key) snap(0.3);
    key = k;
    root.querySelector('.mm-house').innerHTML = planHTML(g, { mine: g.phase === 'play' ? M.roomOf(g, g.turn) : null });
    root.querySelector('.mm-log').innerHTML = g.log.slice(-6).map(e => `<li>${logLine(e, ctx.nameOf)}</li>`).join('') || '<li class="quiet">No suggestions yet.</li>';
    root.querySelector('.mm-now').innerHTML = g.phase !== 'play' ? '' : g.pending ? `Waiting for <b>${esc(ctx.nameOf(g.pending.asker))}</b> to show a card…`
      : `<b>${esc(ctx.nameOf(g.turn))}</b> ${g.step === 'move' ? 'is moving' : g.step === 'suggest' ? `is in the ${M.ROOMS[M.roomOf(g, g.turn)]}` : 'is thinking'}`;
  },

  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    const [s, w, r] = g.envelope.map(c => +c.slice(1));
    return {
      key: 'over' + g.logId,
      html: `<h2>${g.winner != null ? `${ctx.nameOf(g.winner)} solved it` : 'The culprit got away'}</h2>
        <p>It was <b>${M.SUSPECTS[s]}</b>, with the <b>${M.WEAPONS[w].toLowerCase()}</b>, in the <b>${M.ROOMS[r]}</b>.</p>
        <div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>`,
    };
  },
};
