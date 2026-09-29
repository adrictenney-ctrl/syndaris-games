// Card faces for every game, plus table sound and keep-screen-awake.
export const SUIT_SYMBOL = { S: '♠︎', H: '♥︎', D: '♦︎', C: '♣︎' };
export const RANK_LABEL = { T: '10' };
const rankOf = c => c[0];
const suitOf = c => c[1];
const isRed = s => s === 'H' || s === 'D';

export function cardEl(card, faceDown = false) {
  const el = document.createElement('div');
  if (faceDown || !card) el.className = 'card back';
  else setFace(el, card);
  return el;
}

// Pip positions (x%, y%) inside the pip area, laid out like a printed deck.
const L = 0, M = 50, R = 100;
const PIPS = {
  2: [[M, 0], [M, 100]],
  3: [[M, 0], [M, 50], [M, 100]],
  4: [[L, 0], [R, 0], [L, 100], [R, 100]],
  5: [[L, 0], [R, 0], [M, 50], [L, 100], [R, 100]],
  6: [[L, 0], [R, 0], [L, 50], [R, 50], [L, 100], [R, 100]],
  7: [[L, 0], [R, 0], [M, 25], [L, 50], [R, 50], [L, 100], [R, 100]],
  8: [[L, 0], [R, 0], [M, 25], [L, 50], [R, 50], [M, 75], [L, 100], [R, 100]],
  9: [[L, 0], [R, 0], [L, 33.3], [R, 33.3], [M, 50], [L, 66.6], [R, 66.6], [L, 100], [R, 100]],
  T: [[L, 0], [R, 0], [M, 17], [L, 33.3], [R, 33.3], [L, 66.6], [R, 66.6], [M, 83], [L, 100], [R, 100]],
};

// Cards are "rank + suit" (standard deck, e.g. "TH") or "colour-value-n" (Veto, e.g. "R-7-12").
export function setFace(el, card) {
  if (card.includes('-')) return setVetoFace(el, card);
  const r = rankOf(card), s = suitOf(card);
  const rl = RANK_LABEL[r] || r, sy = SUIT_SYMBOL[s];
  let mid;
  if (r === 'A') mid = `<span class="ace-pip">${sy}</span>`;
  else if ('JQK'.includes(r)) mid = `<div class="court"><div class="half"><b>${r}</b><i>${sy}</i></div><div class="half inv"><b>${r}</b><i>${sy}</i></div></div>`;
  else mid = `<div class="pips">${PIPS[r].map(([x, y]) => `<i class="${y > 50 ? 'down' : ''}" style="left:${x}%;top:${y}%">${sy}</i>`).join('')}</div>`;
  el.className = `card ${isRed(s) ? 'red' : 'black'}${r === 'T' ? ' ten' : ''}${r === 'A' && s === 'S' ? ' ace-s' : ''}`;
  el.dataset.card = card;
  el.innerHTML =
    `<div class="corner tl"><b>${rl}</b><i>${sy}</i></div>` + mid +
    `<div class="corner br"><b>${rl}</b><i>${sy}</i></div>`;
}

// Veto cards: ivory stock, a frame in the card's colour, a serif numeral, and a shape per
// colour (red circle, gold triangle, teal square, plum diamond) so colour isn't the only cue.
const VETO_LABEL = { skip: '⊘', rev: '⇄', d2: '+2', d4: '+4', wild: '' };
const QUAD = '<span class="quad"><i class="emb e-R"></i><i class="emb e-O"></i><i class="emb e-P"></i><i class="emb e-T"></i></span>';

function setVetoFace(el, card) {
  const [c, v] = card.split('-');
  const label = VETO_LABEL[v] ?? v;
  const wild = c === 'W';
  el.className = `card oc c-${c}${wild ? ` oc-${v}` : ''}`;
  el.dataset.card = card;
  const emb = wild ? '' : `<i class="emb e-${c}"></i>`;
  const corner = wild ? (v === 'd4' ? '+4' : 'W') : label;
  const centre = wild
    ? `${QUAD}${v === 'd4' ? '<span class="val">+4</span>' : '<span class="wild-word">wild</span>'}`
    : `<i class="emb e-${c} big-emb"></i><span class="val${v === 'skip' || v === 'rev' ? ' sym' : ''}">${label}</span>`;
  el.innerHTML =
    `<div class="frame"></div>` +
    `<div class="corner tl"><b>${corner}</b>${emb}</div>` + centre +
    `<div class="corner br"><b>${corner}</b>${emb}</div>`;
}

// Short click for card plays, synthesised so there are no audio files to load.
let actx = null;
export function snap(volume = 0.5) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const len = Math.floor(actx.sampleRate * 0.07);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const f = actx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1600;
    f.Q.value = 0.8;
    const gain = actx.createGain();
    gain.gain.value = volume;
    src.connect(f).connect(gain).connect(actx.destination);
    src.start();
  } catch {}
}

export const cardText = c => (RANK_LABEL[rankOf(c)] || rankOf(c)) + SUIT_SYMBOL[suitOf(c)];

export async function keepAwake() {
  try {
    if (!('wakeLock' in navigator)) return;
    let lock = await navigator.wakeLock.request('screen');
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && lock.released) lock = await navigator.wakeLock.request('screen');
    });
  } catch {}
}
