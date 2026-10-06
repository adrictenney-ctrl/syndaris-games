// Yacht Club: the classic five-dice scorecard game (Yacht / Yahtzee-style rules).
// Each turn: up to three rolls, keeping any dice between rolls, then fill one box.
// 13 rounds. Upper bonus 35 at 63+. A Yacht (five of a kind) scores 50; each extra
// Yacht scores a 100 bonus and plays as a joker (the official joker rules).

export const UPPER = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
export const LOWER = ['three', 'four', 'house', 'small', 'large', 'yacht', 'chance'];
export const CATS = [...UPPER, ...LOWER];
export const LABEL = {
  ones: 'Aces', twos: 'Twos', threes: 'Threes', fours: 'Fours', fives: 'Fives', sixes: 'Sixes',
  three: 'Three of a kind', four: 'Four of a kind', house: 'Full house', small: 'Small straight',
  large: 'Large straight', yacht: 'Yacht', chance: 'Chance',
};
export const HINT = {
  ones: 'Add the 1s', twos: 'Add the 2s', threes: 'Add the 3s', fours: 'Add the 4s', fives: 'Add the 5s', sixes: 'Add the 6s',
  three: 'Add all dice', four: 'Add all dice', house: 'Scores 25', small: 'Four in a row · 30',
  large: 'Five in a row · 40', yacht: 'Five of a kind · 50', chance: 'Add all dice',
};

const counts = dice => { const c = [0, 0, 0, 0, 0, 0, 0]; dice.forEach(d => c[d]++); return c; };
const sum = dice => dice.reduce((a, b) => a + b, 0);
export const isYacht = dice => dice.length === 5 && dice.every(d => d === dice[0]);

// Plain score of these dice in a box (no joker).
export function rawScore(cat, dice) {
  const c = counts(dice), s = sum(dice);
  const i = UPPER.indexOf(cat);
  if (i >= 0) return c[i + 1] * (i + 1);
  const most = Math.max(...c);
  const run = n => { for (let a = 1; a + n - 1 <= 6; a++) { let ok = true; for (let k = a; k < a + n; k++) if (!c[k]) ok = false; if (ok) return true; } return false; };
  switch (cat) {
    case 'three': return most >= 3 ? s : 0;
    case 'four': return most >= 4 ? s : 0;
    case 'house': return (c.includes(3) && c.includes(2)) || most === 5 ? 25 : 0;
    case 'small': return run(4) ? 30 : 0;
    case 'large': return run(5) ? 40 : 0;
    case 'yacht': return most === 5 ? 50 : 0;
    case 'chance': return s;
  }
  return 0;
}

// Which boxes are open to this roll, and what each would score, with the joker rule:
// after a Yacht already scored 50 (or 0), another Yacht must go in its matching upper box
// if that's empty; otherwise in any lower box (full value for house/straights); otherwise
// any upper box for zero.
export function options(card, dice) {
  const open = CATS.filter(k => card[k] == null);
  if (!isYacht(dice) || card.yacht == null) return Object.fromEntries(open.map(k => [k, rawScore(k, dice)]));
  const up = UPPER[dice[0] - 1];
  if (card[up] == null) return { [up]: rawScore(up, dice) };
  const lower = open.filter(k => LOWER.includes(k));
  if (lower.length) {
    return Object.fromEntries(lower.map(k => [k, k === 'house' ? 25 : k === 'small' ? 30 : k === 'large' ? 40 : rawScore(k, dice)]));
  }
  return Object.fromEntries(open.map(k => [k, 0]));
}

export function totals(card) {
  const upper = UPPER.reduce((a, k) => a + (card[k] || 0), 0);
  const bonus = upper >= 63 ? 35 : 0;
  const lower = LOWER.reduce((a, k) => a + (card[k] || 0), 0);
  const yachtBonus = (card.bonusYachts || 0) * 100;
  return { upper, bonus, lower, yachtBonus, total: upper + bonus + lower + yachtBonus };
}

const roll1 = () => 1 + Math.floor(Math.random() * 6);

export function createGame(settings, players) {
  const seats = players.map(p => !!p);
  const order = seats.map((x, i) => (x ? i : -1)).filter(i => i >= 0);
  const g = {
    settings: { ...settings },
    seats, order, cards: seats.map(x => (x ? { bonusYachts: 0 } : null)),
    turnIdx: 0, round: 1, dice: [1, 2, 3, 4, 5], held: [false, false, false, false, false],
    rolls: 0, rollId: 0, last: null, over: false, annId: 0,
  };
  return g;
}

export const current = g => (g.over ? -1 : g.order[g.turnIdx]);

function announce(g, seat, text) { g.announce = { id: ++g.annId, seat, text }; }

export function applyAction(g, seat, a) {
  if (!a) return 'Nothing to do';
  if (g.over) return 'The game is over';
  if (seat !== current(g)) return "It isn't your turn";
  if (a.type === 'hold') {
    if (!g.rolls) return 'Roll first';
    const i = a.i;
    if (!(i >= 0 && i < 5)) return 'No such die';
    g.held[i] = !g.held[i];
    return null;
  }
  if (a.type === 'roll') {
    if (g.rolls >= 3) return 'No rolls left — pick a box';
    if (Array.isArray(a.held) && g.rolls) g.held = a.held.slice(0, 5).map(Boolean);
    if (!g.rolls) g.held = [false, false, false, false, false];
    if (g.held.every(Boolean)) return 'Every die is held';
    g.dice = g.dice.map((d, i) => (g.held[i] ? d : roll1()));
    g.rolls++;
    g.rollId++;
    if (isYacht(g.dice)) announce(g, seat, 'Yacht! ⚓');
    return null;
  }
  if (a.type === 'score') {
    if (!g.rolls) return 'Roll first';
    const card = g.cards[seat];
    const opts = options(card, g.dice);
    if (!(a.cat in opts)) return card[a.cat] != null ? 'That box is already filled' : 'That box isn\'t allowed for this roll';
    if (isYacht(g.dice) && card.yacht === 50) card.bonusYachts++;
    card[a.cat] = opts[a.cat];
    g.last = { seat, cat: a.cat, pts: opts[a.cat], id: (g.last?.id || 0) + 1 };
    announce(g, seat, `${LABEL[a.cat]} · ${opts[a.cat]}`);
    // Next player.
    g.rolls = 0;
    g.held = [false, false, false, false, false];
    g.turnIdx++;
    if (g.turnIdx >= g.order.length) { g.turnIdx = 0; g.round++; }
    if (g.round > 13) { g.over = true; g.round = 13; }
    return null;
  }
  return "That move isn't allowed";
}

export function standings(g) {
  return g.order.map(s => ({ seat: s, ...totals(g.cards[s]) })).sort((a, b) => b.total - a.total);
}

export function viewFor(g, seat) {
  const cur = current(g);
  return {
    order: g.order, cards: g.cards, turn: cur, round: g.round, dice: g.dice, held: g.held,
    rolls: g.rolls, rollId: g.rollId, over: g.over, last: g.last,
    options: cur === seat && g.rolls ? options(g.cards[seat], g.dice) : null,
    totals: Object.fromEntries(g.order.map(s => [s, totals(g.cards[s])])),
  };
}

// ---------------------------------------------------------------- computer player

// Roughly what each box is worth on average with good play, used to judge "using up" a box.
const PAR = { ones: 2.1, twos: 5.3, threes: 8.6, fours: 12.2, fives: 15.7, sixes: 19.2, three: 21.7, four: 13.1, house: 22.6, small: 29.5, large: 32.7, yacht: 16.9, chance: 22 };

function pickBox(card, dice) {
  const opts = options(card, dice);
  let best = null, bestV = -Infinity;
  const upperSoFar = UPPER.reduce((a, k) => a + (card[k] || 0), 0);
  for (const [k, pts] of Object.entries(opts)) {
    let v = pts - PAR[k];
    const i = UPPER.indexOf(k);
    if (i >= 0) {
      const face = i + 1;
      if (upperSoFar < 63) v += (pts - 3 * face) * 0.9;            // keeping pace for the bonus
      if (upperSoFar < 63 && upperSoFar + pts >= 63) v += 30;
    }
    if (k === 'yacht' && pts === 0) v -= 6;
    if (k === 'chance' && pts < 20) v -= 6;
    if (v > bestV) { bestV = v; best = k; }
  }
  return { cat: best, v: bestV };
}

function bestValue(card, dice) {
  const opts = options(card, dice);
  const { cat, v } = pickBox(card, dice);
  return v + opts[cat] * 0.15;
}

export function botAction(g, seat) {
  const card = g.cards[seat];
  if (!g.rolls) return { type: 'roll' };
  if (g.rolls >= 3) return { type: 'score', cat: pickBox(card, g.dice).cat };
  // Try every way of keeping dice and see which leaves the best roll on average.
  const now = bestValue(card, g.dice);
  let bestMask = null, bestEV = now;
  const N = g.rolls === 1 ? 70 : 90;
  for (let mask = 0; mask < 31; mask++) {            // 31 = keep all, which is "stop"
    const keep = [0, 1, 2, 3, 4].map(i => !!(mask & (1 << i)));
    let total = 0;
    for (let n = 0; n < N; n++) {
      const d = g.dice.map((x, i) => (keep[i] ? x : roll1()));
      // With a roll still to come after this one, look a little further: keep what matches most.
      total += bestValue(card, d);
    }
    const ev = total / N + (g.rolls === 1 ? 2 : 0);   // another roll after this helps a little more
    if (ev > bestEV) { bestEV = ev; bestMask = keep; }
  }
  if (!bestMask) return { type: 'score', cat: pickBox(card, g.dice).cat };
  return { type: 'roll', held: bestMask };
}
