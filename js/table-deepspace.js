// House Rules: Deep Space on the table — the same table as House Rules, dealt from the
// Deep Space deck (with Creepers).
import * as H from './houserules.js?v=68';
import HR from './table-houserules.js?v=68';

export default {
  ...HR,
  defaults: { deck: 'space' },
  settingsHTML: () => '<span class="yc-note">Start: draw 1, play 1 · watch out for Creepers</span>',
  create: (settings, players) => H.createGame({ ...settings, deck: 'space' }, players),
};
