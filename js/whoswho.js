// Who's Who: two players, 24 faces. Your phone shows your secret person and your own board.
// Take turns asking yes/no questions — "Glasses?", "Red hair?" — the answer comes from your
// opponent's secret person automatically and the faces it rules out flip down on your board. When
// you think you know, guess. Right and you win; wrong and you lose.
import { base, shuffle, sfx, announce } from './party.js?v=68';

const HAIR = [{ n: 'black', c: '#2a211c' }, { n: 'brown', c: '#7a4a26' }, { n: 'blond', c: '#e3bf5a' }, { n: 'red', c: '#c4502a' }, { n: 'white', c: '#e6e2da' }];
const SKIN = ['#f3d2b5', '#e0b08a', '#c68a5e', '#8d5a3a', '#5e3a26'];
const NAMES = 'Ada Ben Cleo Dan Eve Finn Gus Hana Ivan Jade Kofi Lena Milo Nia Omar Pia Quinn Rosa Sam Tess Uma Vic Wes Zoe'.split(' ');
// 24 people with a good spread of features (fixed, so everyone plays with the same faces).
export const PEOPLE = NAMES.map((name, i) => {
  const r = k => ((i * 7919 + k * 104729) % 97) / 97;
  const bald = i % 8 === 3;
  return {
    name, skin: SKIN[i % 5], hair: bald ? -1 : (i * 3) % 5, long: !bald && r(1) < 0.42,
    glasses: r(2) < 0.36, hat: r(3) < 0.27, beard: r(4) < 0.3, earrings: r(5) < 0.3, blue: r(6) < 0.4, smile: r(7) < 0.5,
  };
});
// No two faces may answer every question the same way: nudge any twin until it's unique.
{
  const key = p => [p.hair, p.long, p.glasses, p.hat, p.beard, p.earrings, p.blue, p.smile].join();
  const seen = new Set();
  for (const p of PEOPLE) { for (let k = 0; seen.has(key(p)); k++) { const t = ['smile', 'earrings', 'blue', 'glasses', 'hat', 'beard'][k % 6]; p[t] = !p[t]; } seen.add(key(p)); }
}
export const QUESTIONS = [
  ...HAIR.map((h, i) => ({ q: `${h.n[0].toUpperCase() + h.n.slice(1)} hair?`, f: p => p.hair === i })),
  { q: 'Bald?', f: p => p.hair < 0 }, { q: 'Long hair?', f: p => p.long }, { q: 'Glasses?', f: p => p.glasses }, { q: 'A hat?', f: p => p.hat },
  { q: 'A beard?', f: p => p.beard }, { q: 'Earrings?', f: p => p.earrings }, { q: 'Blue eyes?', f: p => p.blue }, { q: 'Big smile?', f: p => p.smile },
];
// A face as a small SVG.
export function face(i) {
  const p = PEOPLE[i], hc = p.hair >= 0 ? HAIR[p.hair].c : null;
  return `<svg viewBox="0 0 40 46" class="ww-face"><rect width="40" height="46" rx="5" fill="#cfe3ef"/>
    ${p.long && hc ? `<path d="M8 20 Q7 40 13 42 L27 42 Q33 40 32 20 Z" fill="${hc}"/>` : ''}
    <path d="M9 46 Q10 35 20 35 Q30 35 31 46 Z" fill="${['#3d6ab0', '#b0473d', '#3d9a5c', '#8a5ab0', '#c08a2a'][i % 5]}"/>
    <ellipse cx="20" cy="22" rx="10" ry="12" fill="${p.skin}"/>
    ${hc ? `<path d="M10 20 Q10 9 20 9 Q30 9 30 20 Q27 13 20 14 Q13 13 10 20 Z" fill="${hc}"/>` : ''}
    ${p.beard ? `<path d="M11 25 Q12 35 20 35 Q28 35 29 25 Q25 31 20 31 Q15 31 11 25 Z" fill="${hc || '#6a5a4a'}"/>` : ''}
    <circle cx="16" cy="21" r="1.4" fill="${p.blue ? '#2f7de1' : '#4a2e1a'}"/><circle cx="24" cy="21" r="1.4" fill="${p.blue ? '#2f7de1' : '#4a2e1a'}"/>
    ${p.glasses ? '<g fill="none" stroke="#222" stroke-width="1"><circle cx="16" cy="21" r="3.2"/><circle cx="24" cy="21" r="3.2"/><path d="M19.2 21h1.6"/></g>' : ''}
    <path d="${p.smile ? 'M16 27 Q20 31 24 27' : 'M17 28 Q20 29 23 28'}" stroke="#7a3a2a" stroke-width="1.1" fill="none"/>
    ${p.earrings ? '<circle cx="10" cy="26" r="1.3" fill="#f2c230"/><circle cx="30" cy="26" r="1.3" fill="#f2c230"/>' : ''}
    ${p.hat ? '<path d="M8 13 h24 v-2 h-4 v-6 h-16 v6 h-4 z" fill="#2a2a3a"/><rect x="12" y="9" width="16" height="2" fill="#b8323a"/>' : ''}</svg>`;
}

export function createGame(settings, players) {
  const g = base(settings, players, {});
  const pick = shuffle([...PEOPLE.keys()]);
  g.secret = g.seats.map((_, s) => (g.order.includes(s) ? pick.pop() : null));
  g.up = g.seats.map(() => PEOPLE.map(() => true));   // which faces are still standing on each board
  g.turn = g.order[0];
  g.asked = [];
  g.sel = null;
  g.phase = 'play';
  return g;
}
const opp = (g, s) => g.order.find(x => x !== s);
export const pending = g => (g.phase === 'play' ? [g.turn] : []);
export const current = g => pending(g)[0] ?? -1;
export const turnSeat = g => (g.phase === 'play' ? g.turn : -1);
export const collecting = () => false;
const end = (g, w, how) => { g.winner = w; g.winners = [w]; g.score[w] = 1; g.how = how; g.phase = 'over'; sfx(g, 'chime'); g.moveId++; };

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.phase !== 'play' || seat !== g.turn) return "It's not your turn";
  if (a.type === 'mode') { g.sel = a.m; g.moveId++; return null; }
  if (a.type === 'back') { g.sel = null; g.moveId++; return null; }
  const o = opp(g, seat), target = PEOPLE[g.secret[o]];
  if (g.sel === 'ask' && a.type === 'pick') {
    const Q = QUESTIONS[Number(a.v)];
    if (!Q) return 'Pick a question';
    const yes = Q.f(target);
    PEOPLE.forEach((p, i) => { if (Q.f(p) !== yes) g.up[seat][i] = false; });
    g.asked.unshift({ s: seat, q: Q.q, yes });
    announce(g, seat, `${Q.q} ${yes ? 'YES' : 'NO'}`);
    sfx(g, yes ? 'ding' : 'thud');
  } else if (g.sel === 'guess' && a.type === 'pick') {
    const i = Number(a.v);
    if (!PEOPLE[i]) return 'Pick a face';
    g.guess = { s: seat, i };
    return end(g, i === g.secret[o] ? seat : o, i === g.secret[o] ? 'right' : 'wrong'), null;
  } else return 'Choose to ask or to guess';
  g.sel = null;
  g.turn = o;
  g.moveId++;
  return null;
}
export const tick = () => null;

export function botAction(g, seat) {
  const left = PEOPLE.map((_, i) => i).filter(i => g.up[seat][i]);
  if (!g.sel) return { type: 'mode', m: left.length <= 1 || (left.length === 2 && Math.random() < 0.5) ? 'guess' : 'ask' };
  if (g.sel === 'guess') return { type: 'pick', v: left[Math.floor(Math.random() * left.length)] };
  // The question that splits what's left most evenly.
  let best = 0, bd = 99;
  QUESTIONS.forEach((Q, k) => { const y = left.filter(i => Q.f(PEOPLE[i])).length, d = Math.abs(left.length / 2 - y); if (d < bd && y > 0 && y < left.length) { bd = d; best = k; } });
  return { type: 'pick', v: best };
}

export function viewFor(g, seat) {
  const left = PEOPLE.map((_, i) => i).filter(i => g.up[seat]?.[i]);
  const v = { phase: g.phase, moveId: g.moveId, hud: [['Standing', left.length], ['Questions', g.asked.filter(x => x.s === seat).length]] };
  const me = g.secret[seat];
  const board = `<div class="ww-secret">${face(me)}<span>You are <b>${PEOPLE[me].name}</b></span></div><div class="ww-board">${PEOPLE.map((p, i) => `<span class="${g.up[seat][i] ? '' : 'down'}">${face(i)}<small>${p.name}</small></span>`).join('')}</div>`;
  const log = g.asked.slice(0, 3).map(x => `${x.s === seat ? 'You' : 'They'}: ${x.q} ${x.yes ? 'Yes' : 'No'}`);
  if (g.phase === 'over') v.ui = { k: 'wait', title: g.winner === seat ? '🏆 You found them!' : 'They got you', sub: `They were ${PEOPLE[g.secret[opp(g, seat)]].name}`, html: board };
  else if (g.turn !== seat) v.ui = { k: 'wait', title: 'Their turn', sub: log[0] || 'Waiting for their question', html: board };
  else if (!g.sel) v.ui = { k: 'buttons', key: 'm' + g.moveId, title: 'Your turn', sub: log[0] || 'Ask a question, or guess who they are', myturn: true, buzz: true, html: board,
    buttons: [{ type: 'mode', label: 'Ask a question', icon: '❓', go: true, payload: { m: 'ask' } }, { type: 'mode', label: 'Make a guess', icon: '🎯', payload: { m: 'guess' } }] };
  else if (g.sel === 'ask') v.ui = { k: 'pick', key: 'a' + g.moveId, title: 'Ask…', sub: 'Faces that don’t match the answer flip down', myturn: true, grid: 2,
    options: QUESTIONS.map((Q, k) => ({ v: k, label: Q.q, sub: `${left.filter(i => Q.f(PEOPLE[i])).length}/${left.length}` })), buttons: [{ type: 'back', label: '‹ Back' }] };
  else v.ui = { k: 'pick', key: 'g' + g.moveId, title: 'Who are they?', sub: 'Wrong guess and you lose!', myturn: true, grid: 4, cards: true,
    options: left.map(i => ({ v: i, art: face(i), sub: PEOPLE[i].name, cls: 'ww-pick' })), buttons: [{ type: 'back', label: '‹ Back' }] };
  return v;
}
