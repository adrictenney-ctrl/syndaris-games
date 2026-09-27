// Card faces for any standard-deck game. Cards are "rank + suit" strings like "TH" or "2C".
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

export function setFace(el, card) {
  const r = rankOf(card), s = suitOf(card);
  const face = 'JQK'.includes(r);
  el.className = `card ${isRed(s) ? 'red' : 'black'}${face ? ' face' : ''}${r === 'A' ? ' ace' : ''}`;
  el.dataset.card = card;
  const rl = RANK_LABEL[r] || r, sy = SUIT_SYMBOL[s];
  const mid = face
    ? `<span class="fl">${rl}</span><span class="fs">${sy}</span>`
    : `<span class="pip">${sy}</span>`;
  el.innerHTML =
    `<div class="corner tl"><b>${rl}</b><i>${sy}</i></div>` +
    `<div class="mid">${mid}</div>` +
    `<div class="corner br"><b>${rl}</b><i>${sy}</i></div>`;
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
