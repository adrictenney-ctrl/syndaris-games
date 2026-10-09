// Orchard on a phone: your tree, and a big Spin button.
import { racePhone, reset as baseReset } from './play-snakes.js?v=66';
import { treeSVG } from './table-orchard.js?v=66';
import { SPIN } from './orchard.js?v=66';
import { $, setHud } from './phone-kit.js?v=66';

export const reset = baseReset;
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  racePhone(c, {
    label: 'On your tree', icon: '🌀', verb: 'Spin!', action: 'spin',
    where: (g, s) => g.tree[s], rank: (g, s) => -g.tree[s],
    lastHTML: g => `<div class="oc-mine">${treeSVG(g.tree[c.st.you], g.fruit[c.st.you])}</div>${g.last ? `<p>${c.nameOf(g.last.seat)}: ${SPIN[g.last.i].label}</p>` : ''}`,
  });
}
