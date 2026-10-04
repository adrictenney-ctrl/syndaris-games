// How a Chef's Kiss card looks, on the table and on phones.
// Recipe Cards are burgundy, Ingredient Cards terracotta orange.
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const LIPS = `<svg class="ck-lips" viewBox="0 0 64 36" aria-hidden="true"><path d="M2 17C10 6 20 2 26 7c3 2 4 3 6 3s3-1 6-3c6-5 16-1 24 10-7 11-17 17-30 17S9 28 2 17Z" fill="currentColor"/><path d="M4 17c9 3 18 4 28 4s19-1 28-4" stroke="rgba(0,0,0,.28)" stroke-width="2" fill="none"/></svg>`;

// c: { kind: 'r' | 'i', t, d, own, deck }
export function face(c, extra = '') {
  const kind = c.kind === 'r' ? 'r' : 'i';
  const long = c.t.length > 34 ? ' long' : c.t.length > 22 ? ' mid' : '';
  return `<div class="ck-card ${kind} face${long}${c.own ? ' own' : ''}" ${extra}>
    <span class="ck-type">${kind === 'r' ? 'Recipe' : 'Ingredient'}</span>
    <b class="ck-title">${esc(c.t)}</b>
    ${c.d ? `<button class="ck-bulb" type="button" aria-label="What does this mean?">💡</button><span class="ck-desc">${esc(c.d)}</span>` : ''}
    <span class="ck-foot">${c.own ? '✎ my own card' : "Chef's Kiss"}</span>
  </div>`;
}

export function back(kind, extra = '') {
  return `<div class="ck-card ${kind === 'r' ? 'r' : 'i'} back" ${extra}>
    <span class="ck-logo">Chef's<br>Kiss</span>${LIPS}
    <span class="ck-type">${kind === 'r' ? 'Recipe Card' : 'Ingredient Card'}</span>
  </div>`;
}

// The Brain Bulb: tap it to see what a card's title means.
export function wireBulbs(root) {
  root.querySelectorAll('.ck-bulb').forEach(b => {
    if (b.dataset.wired) return;
    b.dataset.wired = '1';
    b.addEventListener('pointerdown', e => e.stopPropagation());
    b.addEventListener('click', e => {
      e.stopPropagation();
      b.closest('.ck-card').classList.toggle('explain');
    });
  });
}

export { esc, LIPS };
