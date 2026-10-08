// The trick on the table for the trick-taking games: each card slides in from its player's
// edge, the winning card glows, and the finished trick sweeps off toward whoever won it.
// (Euchre has its own copy of this; the newer games share this one.)
import { cardEl, setFace, snap } from './cards.js?v=64';

const DIR = [[0, 1], [-1, 0], [0, -1], [1, 0]];

export function trickView() {
  let shown = [];
  return {
    reset() { shown.forEach(s => s.el.remove()); shown = []; },
    // trick: [{ seat, card }]; sweepTo: seat the last trick went to; glow: seat whose card wins.
    render(trick, ctx, { sweepTo = null, glow = null } = {}) {
      const box = document.getElementById('trick');
      const k = ctx.cardScale;
      const spot = (seat, j) => { const [dx, dy] = DIR[ctx.layout[seat].side]; return `translate(-50%, -50%) translate(${dx * 11.5 * k}vmin, ${dy * 9.5 * k}vmin) rotate(${ctx.rot(seat) + j}deg)`; };
      const edge = (seat, extra = '') => { const [dx, dy] = DIR[ctx.layout[seat].side]; return `translate(-50%, -50%) translate(${dx * 70}vmin, ${dy * 55}vmin) rotate(${ctx.rot(seat)}deg) ${extra}`; };
      const id = p => p.seat + ':' + p.card;
      const stale = shown.filter(s => !trick.some(p => id(p) === s.id));
      for (const s of stale) {
        s.el.classList.remove('win');
        if (sweepTo != null) s.el.style.transform = edge(sweepTo, 'scale(.6)');
        s.el.classList.add('gone');
        setTimeout(() => s.el.remove(), 600);
      }
      shown = shown.filter(s => !stale.includes(s));
      trick.forEach((p, i) => {
        if (shown.some(s => s.id === id(p))) return;
        const el = cardEl(null, true);
        setFace(el, p.card);
        const jitter = Math.round((Math.random() - 0.5) * 14);
        el.style.transform = edge(p.seat);
        el.style.zIndex = String(i + 1);
        box.appendChild(el);
        el.getBoundingClientRect();
        el.style.transform = spot(p.seat, jitter);
        shown.push({ id: id(p), seat: p.seat, el, jitter });
        snap();
      });
      for (const s of shown) {
        s.el.classList.toggle('win', glow != null && s.seat === glow);
        s.el.style.transform = spot(s.seat, s.jitter);
      }
    },
  };
}
