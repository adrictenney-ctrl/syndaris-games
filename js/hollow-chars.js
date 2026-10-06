// The people of Hollowmere. Good: Villagers and Outcasts. Evil: Henchmen and the Shade.
// `night1` / `nights`: whether (and in which order) the character wakes on the first night
// and on later nights. `pick`: how many players they choose when they wake.
export const TEAM = { villager: 'good', outcast: 'good', henchman: 'evil', shade: 'evil' };
export const KIND_NAME = { villager: 'Villager', outcast: 'Outcast', henchman: 'Henchman', shade: 'The Shade' };

export const CHARS = {
  // Villagers
  gossip: { kind: 'villager', name: 'The Gossip', icon: '🗣️', text: 'On the first night you learn that one of two players is a particular Villager.' },
  archivist: { kind: 'villager', name: 'The Archivist', icon: '📚', text: 'On the first night you learn that one of two players is a particular Outcast (or that there are none).' },
  inspector: { kind: 'villager', name: 'The Inspector', icon: '🔎', text: 'On the first night you learn that one of two players is a particular Henchman.' },
  cook: { kind: 'villager', name: 'The Cook', icon: '🍲', text: 'On the first night you learn how many pairs of evil players sit next to each other.' },
  sensitive: { kind: 'villager', name: 'The Sensitive', icon: '💞', text: 'Each night you learn how many of your two living neighbors are evil.' },
  seer: { kind: 'villager', name: 'The Seer', icon: '🔮', text: 'Each night, choose two players: you learn if either is the Shade. One good player always reads as the Shade to you.', pick: 2, self: true },
  gravedigger: { kind: 'villager', name: 'The Gravedigger', icon: '⚰️', text: 'Each night after the first, you learn which character was executed today.' },
  guardian: { kind: 'villager', name: 'The Guardian', icon: '🛡️', text: 'Each night after the first, choose another player: the Shade cannot kill them tonight.', pick: 1 },
  witness: { kind: 'villager', name: 'The Last Witness', icon: '🕯️', text: 'If the Shade kills you at night, you wake and choose a player: you learn their character.' },
  innocent: { kind: 'villager', name: 'The Innocent', icon: '🕊️', text: 'The first time you are nominated, if the nominator is a Villager, they are executed at once.' },
  hunter: { kind: 'villager', name: 'The Hunter', icon: '🏹', text: 'Once per game, during the day, publicly choose a player: if they are the Shade, they die.' },
  knight: { kind: 'villager', name: 'The Knight', icon: '⚔️', text: 'The Shade cannot kill you.' },
  elder: { kind: 'villager', name: 'The Elder', icon: '🎩', text: 'If only three players live and nobody is executed, good wins. If you would die at night, someone else might die instead.' },
  // Outcasts
  servant: { kind: 'outcast', name: 'The Servant', icon: '🧹', text: 'Each night, choose another player to be your master: tomorrow your vote only counts if they vote too.', pick: 1 },
  sleepwalker: { kind: 'outcast', name: 'The Sleepwalker', icon: '💤', text: 'You think you are a Villager, but you are not. Your ability does not work.' },
  hermit: { kind: 'outcast', name: 'The Hermit', icon: '🏚️', text: 'You might read as evil, even as a Henchman or the Shade, although you are good.' },
  martyr: { kind: 'outcast', name: 'The Martyr', icon: '✝️', text: 'If you are executed, good loses.' },
  // Henchmen
  venomist: { kind: 'henchman', name: 'The Venomist', icon: '🧪', text: 'Each night, choose a player: they are poisoned tonight and tomorrow. Poisoned players\' abilities fail and they get false information.', pick: 1, self: true },
  informant: { kind: 'henchman', name: 'The Informant', icon: '🗝️', text: 'Each night you see every player\'s character. You might read as good, even as a Villager or Outcast.' },
  heir: { kind: 'henchman', name: 'The Heir', icon: '🥀', text: 'If the Shade dies while five or more players live, you become the Shade.' },
  patron: { kind: 'henchman', name: 'The Patron', icon: '💰', text: 'Two extra Outcasts are in play.' },
  // The Shade
  shade: { kind: 'shade', name: 'The Shade', icon: '👁️', text: 'Each night after the first, choose a player: they die. If you choose yourself, you die and a Henchman becomes the Shade.', pick: 1, self: true },
};

export const BY_KIND = kind => Object.keys(CHARS).filter(k => CHARS[k].kind === kind);

// Villagers / Outcasts / Henchmen / Shade by number of players.
export const SETUP = { 5: [3, 0, 1, 1], 6: [3, 1, 1, 1], 7: [5, 0, 1, 1], 8: [5, 1, 1, 1], 9: [5, 2, 1, 1], 10: [7, 0, 2, 1] };
