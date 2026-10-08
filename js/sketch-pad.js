// Drawing strokes onto a canvas, shared by the table and the drawer's phone.
// Strokes are in pad units (1000 × 750); the canvas can be any size with that shape.
import { PALETTE, SIZES, PAD_W, PAD_H } from './sketch.js?v=64';

export function fitCanvas(cv, cssW) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssH = Math.round(cssW * PAD_H / PAD_W);
  cv.style.width = cssW + 'px';
  cv.style.height = cssH + 'px';
  const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
  return false;
}

export function drawStroke(c2, st, from = 0) {
  const k = c2.canvas.width / PAD_W;
  const p = st.p;
  if (p.length < 2) return;
  c2.strokeStyle = c2.fillStyle = PALETTE[st.c] || PALETTE[0];
  c2.lineWidth = SIZES[st.w] * k;
  c2.lineCap = c2.lineJoin = 'round';
  if (p.length === 2) {
    c2.beginPath();
    c2.arc(p[0] * k, p[1] * k, (SIZES[st.w] * k) / 2, 0, Math.PI * 2);
    c2.fill();
    return;
  }
  // Smooth the line through the midpoints between samples.
  const start = Math.max(0, from - 4);
  c2.beginPath();
  c2.moveTo(p[start] * k, p[start + 1] * k);
  for (let i = start + 2; i < p.length - 2; i += 2) {
    const mx = (p[i] + p[i + 2]) / 2, my = (p[i + 1] + p[i + 3]) / 2;
    c2.quadraticCurveTo(p[i] * k, p[i + 1] * k, mx * k, my * k);
  }
  c2.lineTo(p[p.length - 2] * k, p[p.length - 1] * k);
  c2.stroke();
}

export function paint(cv, strokes) {
  const c2 = cv.getContext('2d');
  c2.clearRect(0, 0, cv.width, cv.height);
  for (const st of strokes) if (st.p.every(v => v !== undefined && v !== null)) drawStroke(c2, st);
}
