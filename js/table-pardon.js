// Pardon Me! on the table: the race-home board with a 60-square track, coloured slides on every
// side, and the card just drawn shown big.
import * as P from './pardon.js?v=67';
import { boardSVG } from './table-ludo.js?v=67';
import { snap } from './cards.js?v=67';
import { centerMsg, clearMsg } from './table-hearts.js?v=67';

let root = null, key = '', lastCard = -1;
export const pmCard = c => (c == null ? '<div class="pm-card back">🎩</div>' : `<div class="pm-card ${c === 'P' ? 'pardon' : ''}"><b>${c === 'P' ? '🎩' : c}</b><small>${P.CARD_TEXT[c]}</small></div>`);
// Describe a move for the phone buttons.
export function optText(g, s, o, nameOf) {
  const where = to => (to >= P.R.track + P.R.home - 1 ? 'Home' : to >= P.R.track ? 'the safety lane' : `space ${to + 1}`);
  if (o.pardon) return `Pawn ${o.i + 1}: bump ${nameOf(o.pardon.s)}'s pawn ${o.pardon.k + 1}`;
  if (o.swap) return `Pawn ${o.i + 1}: swap with ${nameOf(o.swap.s)}'s pawn ${o.swap.k + 1}`;
  if (o.j != null) return `Pawn ${o.i + 1} → ${where(o.to)}, pawn ${o.j + 1} → ${where(o.to2)}`;
  const from = g.pieces[s][o.i];
  return `Pawn ${o.i + 1}: ${from === -1 ? 'out of Start' : `${where(from)} → ${where(o.to)}`}`;
}

export default {
  defaults: {},
  settingsHTML: () => '<span class="yc-note">Cards instead of dice · land on a rival to send them back to Start</span>',
  create: (settings, players) => P.createGame(settings, players),
  act: P.applyAction,
  bot: P.botAction,
  view: P.viewFor,
  turn: g => P.current(g),
  timer: g => P.tick(g),
  joinMidGame: () => false,
  plate(g, s) {
    if (!g.seats[s]) return { badges: [], meta: '', cards: 0 };
    const home = g.pieces[s].filter(p => p === P.R.track + P.R.home - 1).length;
    return { badges: g.phase === 'over' && g.winner === s ? ['<span class="badge got">🏠 winner</span>'] : [], meta: `<span><b>${home}</b>/4 home</span>`, cards: 0, turn: P.current(g) === s, out: false };
  },
  reset() { root?.remove(); root = null; key = ''; lastCard = -1; clearMsg(); },
  renderCenter(g, ctx) {
    document.getElementById('watermark').textContent = '';
    if (!root) { root = document.createElement('div'); root.id = 'pardon'; root.className = 'race-wrap'; document.getElementById('center').appendChild(root); }
    const felt = document.getElementById('felt').getBoundingClientRect(), v = ctx.vmin;
    root.style.setProperty('--B', Math.min(felt.height - v * 12, felt.width - v * 70) + 'px');
    if (g.moveId === key) return;
    key = g.moveId;
    if (g.cardId !== lastCard && lastCard !== -1) snap(0.5);
    lastCard = g.cardId;
    root.innerHTML = `<div class="race-board">${boardSVG({ ...g, R: { ...P.R, slides: P.SLIDES } })}</div><div class="race-side">${pmCard(g.card)}<p><b>${ctx.nameOf(g.turn)}</b>${g.phase === 'draw' ? ' to draw' : ''}</p></div>`;
    centerMsg('');
  },
  overlay(g, ctx) {
    if (g.phase !== 'over') return null;
    return { key: 'over', html: `<h2>${ctx.nameOf(g.winner)} wins!</h2><p>All four pawns home</p><div class="buttons"><button class="big" data-do="again">Play again</button><button class="big ghost" data-do="lobby">Back to lobby</button></div>` };
  },
};
