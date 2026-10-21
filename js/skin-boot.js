// Picks the page's style before anything is drawn (loaded in <head> on the home page, the table and
// the phone; the page is named by data-page on the script tag).
//   vibrant          the free default
//   a skin (below)   Vibrant's layout with that skin's look on top (bought): the home page, the table
//                    and the phone
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

  // A skin's fonts and styles, loaded once each. On the built site every file sits in one folder (no
  // css/). The home page calls this again when someone picks a skin in Settings.
  const src = me?.getAttribute('src') || '';
  const dir = /(^|\/)js\//.test(src) ? 'css/' : '', ver = (src.match(/\?v=\d+/) || [''])[0];
  const add = (href, key) => {
    if (document.head.querySelector(`link[data-skin-file="${key}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.dataset.skinFile = key;
    document.head.appendChild(l);
  };
  window.POD_LOAD_SKIN = id => {
    if (!SKINS[id]) return;
    add(`https://fonts.googleapis.com/css2?${SKINS[id]}&display=swap`, 'font-' + id);
    add(`${dir}skins.css${ver}`, 'engine');
    add(`${dir}skin-${id}.css${ver}`, id);
  };

  let st = null;
  try {
    if (page === 'phone') {
      const look = new URLSearchParams(location.search).get('look');
      if (look === 'vibrant' || SKINS[look]) localStorage.setItem('pod.style', look);
    }
    st = localStorage.getItem('pod.style');
  } catch {}
  // (Classic, the old black-and-gold look, is no longer offered: anyone who had it gets Vibrant.)
  if (SKINS[st] && page !== 'phone' && !read('pod.owned', []).includes(st)) st = 'vibrant';
  d.dataset.style = 'vibrant';
  const icon = document.querySelector('link[rel="icon"]');
  if (icon) icon.href = 'icon-vibrant.svg';
  if (!SKINS[st]) return;
  d.dataset.skin = st;
  window.POD_LOAD_SKIN(st);
})();
