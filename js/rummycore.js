// Melds for the rummy games: sets (three or four of a rank) and runs (three or more in a row of
// one suit, ace low). bestMelds() finds the arrangement that leaves the least deadwood.
export const ORDER = 'A23456789TJQK';
export const val = c => (c[0] === 'A' ? 1 : 'TJQK'.includes(c[0]) ? 10 : Number(c[0]));
const ri = c => ORDER.indexOf(c[0]);

export function isSet(cs) { return cs.length >= 3 && cs.length <= 4 && cs.every(c => c[0] === cs[0][0]) && new Set(cs.map(c => c[1])).size === cs.length; }
export function isRun(cs) {
  if (cs.length < 3 || !cs.every(c => c[1] === cs[0][1])) return false;
  const r = cs.map(ri).sort((a, b) => a - b);
  return r.every((x, i) => i === 0 || x === r[i - 1] + 1);
}
export const isMeld = cs => isSet(cs) || isRun(cs);
export const sortMeld = cs => (isRun(cs) ? cs.slice().sort((a, b) => ri(a) - ri(b)) : cs.slice().sort((a, b) => 'SHDC'.indexOf(a[1]) - 'SHDC'.indexOf(b[1])));

// Every meld that can be made from these cards.
export function allMelds(hand) {
  const out = [];
  const byRank = {};
  hand.forEach(c => { (byRank[c[0]] ||= []).push(c); });
  for (const cs of Object.values(byRank)) {
    if (cs.length >= 3) out.push(cs.slice(0, 4));
    if (cs.length === 4) for (let i = 0; i < 4; i++) out.push(cs.filter((_, j) => j !== i));
  }
  for (const s of 'SHDC') {
    const cs = hand.filter(c => c[1] === s).sort((a, b) => ri(a) - ri(b));
    for (let i = 0; i < cs.length; i++) {
      const run = [cs[i]];
      for (let j = i + 1; j < cs.length && ri(cs[j]) === ri(run[run.length - 1]) + 1; j++) {
        run.push(cs[j]);
        if (run.length >= 3) out.push(run.slice());
      }
    }
  }
  return out;
}

// Least-deadwood arrangement: { melds, dead, deadwood }.
export function bestMelds(hand) {
  const melds = allMelds(hand);
  let best = { melds: [], dead: hand.slice(), deadwood: hand.reduce((a, c) => a + val(c), 0) };
  const go = (i, used, chosen) => {
    const dead = hand.filter(c => !used.has(c));
    const dw = dead.reduce((a, c) => a + val(c), 0);
    if (dw < best.deadwood) best = { melds: chosen.map(m => m.slice()), dead, deadwood: dw };
    for (let k = i; k < melds.length; k++) {
      const m = melds[k];
      if (m.some(c => used.has(c))) continue;
      m.forEach(c => used.add(c));
      chosen.push(m);
      go(k + 1, used, chosen);
      chosen.pop();
      m.forEach(c => used.delete(c));
    }
  };
  go(0, new Set(), []);
  return best;
}

// Can `card` be added to `meld` (a set or run already on the table)?
export function fits(meld, card) { return isMeld([...meld, card]); }

// Lay off as many of `cards` as possible onto `melds` (mutates copies). Returns { melds, left, laid }.
export function layOffAll(melds, cards) {
  const ms = melds.map(m => m.slice());
  let left = cards.slice(), laid = [], again = true;
  while (again) {
    again = false;
    for (const c of left) {
      const m = ms.find(x => fits(x, c));
      if (m) { m.push(c); laid.push(c); left = left.filter(x => x !== c); again = true; break; }
    }
  }
  return { melds: ms.map(sortMeld), left, laid };
}
