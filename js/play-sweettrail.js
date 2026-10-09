// Sweet Trail on a phone: one big Draw button and the card you got.
import { racePhone, reset as baseReset } from './play-snakes.js?v=66';
import { cardHTML } from './table-sweettrail.js?v=66';
import { LEN } from './sweettrail.js?v=66';
import { $, setHud } from './phone-kit.js?v=66';

export const reset = baseReset;
export function renderLobby(c) {
  $('#whoami').innerHTML = `<i style="background:var(--seat-${c.st.you})"></i>${c.nameOf(c.st.you)}`;
  setHud('#hudL', null); setHud('#hudR', null); setHud('#hudC', null);
  reset();
}
export function render(c) {
  racePhone(c, {
    label: 'Square', icon: '🍬', verb: 'Draw a card', action: 'draw',
    where: (g, s) => `${g.pos[s]}/${LEN}`, rank: (g, s) => g.pos[s],
    lastHTML: g => (g.last ? `${cardHTML(g.last.card)}<p>${c.nameOf(g.last.seat)}${g.last.bridge ? ' crossed a Sugar Bridge! 🌈' : ''}${g.stuck[c.st.you] ? '<br>🍯 You’re stuck in toffee — you’ll miss your next turn' : ''}</p>` : ''),
  });
}
