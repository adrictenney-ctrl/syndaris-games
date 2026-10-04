// Move, pinch-to-size and twist-to-rotate a card with your fingers, like a real card on the
// table. With a mouse: drag to move, scroll to resize, Shift+scroll to rotate.
// Double-tap puts it back. onTap(e) fires for a touch that didn't move.
export function movable(el, { onTap, min = 0.5, max = 3 } = {}) {
  const st = { x: 0, y: 0, r: 0, s: 1 };
  const pts = new Map();
  let start = null, moved = false, lastTap = 0;
  const apply = () => { el.style.transform = `translate(${st.x}px, ${st.y}px) rotate(${st.r}deg) scale(${st.s})`; };
  const snapshot = () => {
    const p = [...pts.values()];
    start = { ...st, p: p.map(q => ({ ...q })) };
  };
  const geo = p => ({
    cx: (p[0].x + p[1].x) / 2, cy: (p[0].y + p[1].y) / 2,
    d: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) || 1,
    a: Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x),
  });

  el.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    try { el.setPointerCapture(e.pointerId); } catch {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) moved = false;
    snapshot();
    el.style.zIndex = String(movable.z = (movable.z || 20) + 1);
    el.classList.add('held');
  });
  el.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.values()];
    if (p.length === 1 && start.p.length === 1) {
      const dx = p[0].x - start.p[0].x, dy = p[0].y - start.p[0].y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (!moved) return;
      st.x = start.x + dx; st.y = start.y + dy;
    } else if (p.length >= 2 && start.p.length >= 2) {
      moved = true;
      const a = geo(start.p), b = geo(p);
      st.s = Math.min(max, Math.max(min, start.s * (b.d / a.d)));
      st.r = start.r + ((b.a - a.a) * 180) / Math.PI;
      st.x = start.x + (b.cx - a.cx); st.y = start.y + (b.cy - a.cy);
    }
    apply();
  });
  const end = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size) { snapshot(); return; }
    el.classList.remove('held');
    if (!moved && e.type === 'pointerup') {
      const t = Date.now();
      if (t - lastTap < 320) { reset(); lastTap = 0; return; }
      lastTap = t;
      onTap?.(e);
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.shiftKey) st.r += e.deltaY > 0 ? 8 : -8;
    else st.s = Math.min(max, Math.max(min, st.s * (e.deltaY > 0 ? 0.92 : 1.08)));
    apply();
  }, { passive: false });
  function reset() { Object.assign(st, { x: 0, y: 0, r: 0, s: 1 }); apply(); }
  el.style.touchAction = 'none';
  return { reset, state: st };
}
