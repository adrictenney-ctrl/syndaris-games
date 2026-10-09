// In Sync: a team game played in silence. Everyone gets numbered cards (1–100) on their phone —
// one each in level 1, two in level 2, and so on. With no turns and no talking, the team must play
// every card onto the table pile in rising order, just by feel. Play a card while someone still
// holds a lower one and the team loses a life (those lower cards are thrown away). Everyone can
// agree to throw a star: each player discards their lowest card. Clear every level to win.
import { base, shuffle, sfx, announce } from './party.js?v=68';

export function createGame(settings, players) {
  const g = base(settings, players, {});
  const n = g.order.length;
  g.levels = n <= 2 ? 12 : n === 3 ? 10 : 8;
  g.lives = n;
  g.stars = 1;
  g.level = 0;
  nextLevel(g);
  return g;
}
const REWARD = { 2: 'star', 3: 'life', 5: 'star', 6: 'life', 8: 'star', 9: 'life' };
function nextLevel(g) {
  g.level++;
  const deck = shuffle([...Array(100).keys()].map(i => i + 1));
  g.hand = g.seats.map((_, s) => (g.order.includes(s) ? deck.splice(0, g.level).sort((a, b) => a - b) : []));
  g.pile = [];
  g.lost = [];          // cards thrown away by mistakes and stars
  g.starVote = {};
  g.phase = 'play';
  g.last = null;
  g.moveId++;
}
const lowest = (g, s) => g.hand[s][0];
const left = g => g.order.reduce((t, s) => t + g.hand[s].length, 0);
// Bots move in order of their lowest card; anyone yet to agree to a proposed star goes first.
export function pending(g) {
  if (g.phase !== 'play') return [];
  const has = g.order.filter(s => g.hand[s].length);
  if (Object.keys(g.starVote).length) { const w = has.filter(s => !g.starVote[s]); if (w.length) return w; }
  return has.sort((a, b) => lowest(g, a) - lowest(g, b));
}
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = () => -1;
export const collecting = () => false;
// A bot waits longer the bigger the gap between the pile and its card — the "feel".
export function botDelay(g, s) {
  if (Object.keys(g.starVote).length) return 1200;
  const top = g.pile.length ? g.pile[g.pile.length - 1] : 0;
  return 900 + (lowest(g, s) - top) * (180 + Math.random() * 80);
}

function checkDone(g) {
  if (g.lives <= 0) { g.phase = 'over'; g.won = false; g.order.forEach(s => { g.score[s] = g.level - 1; }); g.winners = []; sfx(g, 'sad'); return; }
  if (left(g) === 0) {
    sfx(g, 'chime');
    if (g.level >= g.levels) { g.phase = 'over'; g.won = true; g.order.forEach(s => { g.score[s] = g.level; }); g.winners = [...g.order]; return; }
    const r = REWARD[g.level];
    if (r === 'star') g.stars = Math.min(3, g.stars + 1);
    if (r === 'life') g.lives = Math.min(5, g.lives + 1);
    g.reward = r || null;
    g.phase = 'cleared';
    g.clearedAt = Date.now();
  }
}

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play') return 'Not now';
  if (a.type === 'play') {
    const v = lowest(g, seat);
    if (v == null) return 'You have no cards';
    g.hand[seat].shift();
    g.pile.push(v);
    g.starVote = {};
    // Did anyone still hold something lower?
    const lower = g.order.flatMap(s => g.hand[s].filter(x => x < v).map(x => ({ s, x })));
    if (lower.length) {
      for (const { s, x } of lower) { g.hand[s].splice(g.hand[s].indexOf(x), 1); g.lost.push(x); }
      g.lives--;
      g.last = { s: seat, v, oops: lower };
      announce(g, seat, `${v} — too soon! 💔`);
      sfx(g, 'buzzer');
    } else { g.last = { s: seat, v }; sfx(g, 'ding'); }
    checkDone(g);
    g.moveId++;
    return null;
  }
  if (a.type === 'star') {
    if (g.stars < 1) return 'No stars left';
    if (g.starVote[seat]) delete g.starVote[seat]; else g.starVote[seat] = true;
    const need = g.order.filter(s => g.hand[s].length);
    if (need.every(s => g.starVote[s])) {
      g.stars--;
      for (const s of need) g.lost.push(g.hand[s].shift());
      g.starVote = {};
      announce(g, seat, '⭐ Star thrown!');
      sfx(g, 'chime');
      g.last = { star: true };
      checkDone(g);
    }
    g.moveId++;
    return null;
  }
  return 'Not now';
}

export function tick(g) {
  if (g.phase === 'cleared') return { ms: Math.max(0, g.clearedAt + 4000 - Date.now()), run: () => nextLevel(g) };
  return null;
}
export const botAction = g => (Object.keys(g.starVote).length ? { type: 'star' } : { type: 'play' });

export function viewFor(g, seat) {
  const h = g.hand[seat] || [];
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Level', `${g.level}/${g.levels}`], ['Lives', '❤️'.repeat(g.lives) || '0'], ['Stars', '⭐'.repeat(g.stars) || '—']] };
  const cards = `<div class="is-hand">${h.map((x, i) => `<span class="is-card ${i ? 'dim' : ''}">${x}</span>`).join('')}</div>`;
  if (g.phase === 'play') {
    const sv = Object.keys(g.starVote).length;
    v.ui = h.length
      ? { k: 'buttons', key: 'p' + g.level, title: 'Play when it feels right', sub: 'No talking! Your lowest card goes down', myturn: true, html: cards,
        buttons: [{ type: 'play', label: `Play ${h[0]}`, go: true, cls: 'pp-huge is-play' }, { type: 'star', label: g.starVote[seat] ? `⭐ Agreed (${sv})` : sv ? `⭐ Agree to a star (${sv})` : '⭐ Propose a star', dis: g.stars < 1 }] }
      : { k: 'wait', title: 'All your cards are down ✓', sub: 'Watch the others…' };
    // Re-key so the big button refreshes as the hand changes, without buzzing.
    if (h.length) v.ui.key = 'p' + g.level + ':' + h.length + ':' + sv + ':' + (g.starVote[seat] ? 1 : 0);
  } else if (g.phase === 'cleared') v.ui = { k: 'wait', title: `Level ${g.level} cleared! 🎉`, sub: g.reward ? `Bonus: +1 ${g.reward === 'star' ? '⭐ star' : '❤️ life'}` : 'Next level…' };
  else v.ui = { k: 'wait', title: g.won ? '🏆 You were in sync!' : 'Out of lives', sub: g.won ? `All ${g.levels} levels` : `You reached level ${g.level}` };
  return v;
}
