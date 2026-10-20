// Picks the page's style before anything is drawn (loaded in <head> on the home page, the table and
// the phone; the page is named by data-page on the script tag).
//   classic          the black-and-gold card room (bought)
//   vibrant          the free default
//   a skin (below)   Vibrant's layout with that skin's look on top (bought)
// Paid styles only apply on a device whose signed-in account owns them. Phones follow the table: the
// join link carries ?look=<style>, so the phone matches the TV without owning it.
(() => {
  const SKINS = {
    arcade: 'family=Press+Start+2P&family=VT323',
    neon: 'family=Monoton&family=Rajdhani:wght@500;600;700',
    cafe: 'family=Fredoka:wght@500;600;700',
    comic: 'family=Bangers&family=Comic+Neue:wght@400;700',
    gameshow: 'family=Anton&family=Montserrat:wght@500;600;700;800',
    sketch: 'family=Patrick+Hand&family=Permanent+Marker',
    luxe: 'family=Playfair+Display:wght@600;700&family=Lato:wght@400;700',
    paper: 'family=Baloo+2:wght@600;700;800&family=Quicksand:wght@500;600;700',
  };
  window.POD_SKINS = Object.keys(SKINS);
  const me = document.currentScript, page = me?.dataset.page || 'home', d = document.documentElement;
  const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  let st = null;
  try {
    if (page === 'phone') {
      const look = new URLSearchParams(location.search).get('look');
      if (look === 'vibrant' || look === 'classic' || SKINS[look]) localStorage.setItem('pod.style', look);
    }
    st = localStorage.getItem('pod.style');
  } catch {}
  const paid = st === 'classic' || !!SKINS[st];
  if (paid && page !== 'phone' && !read('pod.owned', []).includes(st)) st = 'vibrant';
  if (st === 'classic') return;   // Classic is the pages' own look
  d.dataset.style = 'vibrant';
  const icon = document.querySelector('link[rel="icon"]');
  if (icon) icon.href = 'icon-vibrant.svg';
  if (!SKINS[st]) return;
  d.dataset.skin = st;
  if (page === 'home') return;     // the home page keeps Vibrant; skins dress the table and the phone
  // The skin's fonts and styles. On the built site every file sits in one folder (no css/).
  const src = me?.getAttribute('src') || '';
  const dir = /(^|\/)js\//.test(src) ? 'css/' : '', ver = (src.match(/\?v=\d+/) || [''])[0];
  const add = href => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); };
  add(`https://fonts.googleapis.com/css2?${SKINS[st]}&display=swap`);
  add(`${dir}skins.css${ver}`);
  add(`${dir}skin-${st}.css${ver}`);
})();
