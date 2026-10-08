// Little synthesised sounds (no audio files): a ding, a buzzer, a beep and a chime.
let actx = null;
function ac() {
  actx = actx || new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

export function tone(freq, dur = 0.2, { type = 'sine', vol = 0.25, at = 0, slide = 0 } = {}) {
  try {
    const a = ac(), t = a.currentTime + at;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch {}
}

export const ding = () => { tone(1320, 0.5, { vol: 0.22 }); tone(1980, 0.4, { vol: 0.08, at: 0.01 }); };
export const beep = (hi = false) => tone(hi ? 1040 : 660, 0.14, { type: 'square', vol: 0.08 });
export const buzzer = () => { tone(150, 0.7, { type: 'sawtooth', vol: 0.18 }); tone(155, 0.7, { type: 'square', vol: 0.08 }); };
export const chime = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { vol: 0.16, at: i * 0.11 }));
export const thud = () => tone(90, 0.25, { type: 'triangle', vol: 0.3, slide: 0.5 });
export const sad = () => [392, 330, 262].forEach((f, i) => tone(f, 0.3, { type: 'triangle', vol: 0.16, at: i * 0.16 }));
