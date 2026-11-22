// Bread: Play On Display's second currency. Bread can only be bought (it's never won or given by
// codes). It lives on the player's wallet (Firestore users/{uid}.bread). The site never writes it:
// the Firestore rules don't let a browser change it, and once payments are on, the server adds it
// after Paddle confirms a payment.
//
// The cart (top bar): the Bread packs. Buying is off until Paddle is ready (BUY_LIVE).

export const BUY_LIVE = false;   // turned on once the domain is approved and Paddle is set up

// Each pack: its price in US dollars and how much Bread it gives. `priceId` is Paddle's price
// id (pri_…), filled in when the products exist in Paddle.
export const PACKS = [
  { id: 'bread_500', usd: 1.99, bread: 500, priceId: '' },
  { id: 'bread_1500', usd: 5.99, bread: 1500, priceId: '' },
  { id: 'bread_3000', usd: 9.99, bread: 3000, priceId: '' },
  { id: 'bread_4500', usd: 15.99, bread: 4500, priceId: '' },
  { id: 'bread_6000', usd: 19.99, bread: 6000, priceId: '' },
];

export const SLICE = '<svg class="slice" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 20V10.6A4.6 4.6 0 0 1 5 7.2C5 4.9 8.1 3 12 3s7 1.9 7 4.2c0 1.3-.6 2.5-1.5 3.4V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z" fill="#c8843a" stroke="#6b3d12" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.6 18.6V10l-.5-.5A2.6 2.6 0 0 1 7.2 7.3c0-1.2 2.1-2.4 4.8-2.4s4.8 1.2 4.8 2.4c0 .8-.4 1.6-1 2.1l-.4.4v8.8z" fill="#f6dfb0"/></svg>';
const CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.2l2.3 10.4a1.5 1.5 0 0 0 1.5 1.1h7.9a1.5 1.5 0 0 0 1.4-1.1L20 8H6.2"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/></svg>';

const usd = n => '$' + n.toFixed(2);
const fmt = n => Number(n || 0).toLocaleString();
// How much Bread each dollar buys, for the "best value" note (the biggest pack).
const best = PACKS.reduce((a, p) => (p.bread / p.usd > a.bread / a.usd ? p : a), PACKS[0]);

let state = { signedIn: false, bread: 0 }, cartBtn = null, dlg = null;

// The cart button and its window, placed before `beforeEl` in the top bar.
export function mountCart(beforeEl, { signIn } = {}) {
  if (cartBtn || !beforeEl) return;
  cartBtn = document.createElement('button');
  cartBtn.type = 'button';
  cartBtn.className = 'cart-btn';
  cartBtn.id = 'openCart';
  cartBtn.setAttribute('aria-label', 'Shop: buy Bread');
  cartBtn.title = 'Shop';
  beforeEl.before(cartBtn);
  dlg = document.createElement('dialog');
  dlg.className = 'settings cart';
  dlg.id = 'cart';
  dlg.setAttribute('aria-labelledby', 'cartTitle');
  document.body.appendChild(dlg);
  dlg.addEventListener('click', e => {
    if (e.target === dlg) return dlg.close();
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'close') dlg.close();
    if (a === 'signin') { dlg.close(); signIn?.(); }
  });
  cartBtn.onclick = () => { draw(); dlg.showModal(); };
  paint();
}

// Called with the wallet whenever it changes: { signedIn, bread }.
export function setBread(w) {
  state = { signedIn: !!w?.signedIn, bread: Number(w?.bread) || 0 };
  paint();
  if (dlg?.open) draw();
}

function paint() {
  if (!cartBtn) return;
  cartBtn.innerHTML = CART + (state.signedIn ? `<span class="cart-bread">${SLICE}<b>${fmt(state.bread)}</b></span>` : '');
  cartBtn.title = state.signedIn ? `Shop · You have ${fmt(state.bread)} Bread` : 'Shop';
}

function draw() {
  dlg.innerHTML = `<div class="cart-in">
    <div class="set-head"><h2 id="cartTitle">Shop</h2><button type="button" class="set-x" data-a="close" aria-label="Close">✕</button></div>
    <p class="cart-lead">${SLICE}<span><b>Bread</b> is Play On Display's premium currency. You can only get it here.</span></p>
    ${state.signedIn ? `<p class="cart-have">You have ${SLICE}<b>${fmt(state.bread)}</b> Bread</p>` : ''}
    <ul class="cart-packs">${PACKS.map(p => `<li class="cart-pack${p === best ? ' best' : ''}">
      ${p === best ? '<span class="cart-tag">Best value</span>' : ''}
      <span class="cart-amt">${SLICE}<b>${fmt(p.bread)}</b><small>Bread</small></span>
      <button type="button" class="cart-buy" data-pack="${p.id}" ${BUY_LIVE ? '' : 'disabled aria-disabled="true"'}>${usd(p.usd)}</button>
    </li>`).join('')}</ul>
    <p class="cart-note">${BUY_LIVE
      ? (state.signedIn ? 'Payments are handled securely by Paddle.' : 'Sign in to buy Bread. It’s saved to your account.')
      : 'Coming soon: Bread isn’t for sale yet.'}</p>
    ${!state.signedIn ? '<button type="button" class="shop-go" data-a="signin">Sign in</button>' : ''}
  </div>`;
}
