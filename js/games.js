// Game registry shared by the table and the phones (no DOM, no rules here).
//
// Each seat has a spot on the table screen: x/y in percent, plus which edge it sits on
// (side 0 = bottom, 1 = left, 2 = top, 3 = right). Seat numbers go clockwise when you
// look down at the table, so "next player" is always seat + 1.

const S = (x, y, side, name) => ({ x, y, side, name });

export const GAMES = {
  euchre: {
    id: 'euchre',
    name: 'Euchre',
    blurb: '4 players · partners sit across',
    min: 4,
    max: 4,
    layout: [S(50, 100, 0, 'South'), S(0, 50, 1, 'West'), S(50, 0, 2, 'North'), S(100, 50, 3, 'East')],
  },
  holdem: {
    id: 'holdem',
    name: "Texas Hold'em",
    blurb: '2–8 players · no-limit, chips',
    min: 2,
    max: 8,
    midJoin: true, // players can sit down between hands
    layout: [
      S(72, 100, 0, 'Bottom right'), S(50, 100, 0, 'Bottom middle'), S(28, 100, 0, 'Bottom left'),
      S(0, 50, 1, 'Left end'),
      S(28, 0, 2, 'Top left'), S(50, 0, 2, 'Top middle'), S(72, 0, 2, 'Top right'),
      S(100, 50, 3, 'Right end'),
    ],
  },
  veto: {
    id: 'veto',
    name: 'Veto',
    blurb: '2–8 players · match colours, empty your hand',
    min: 2,
    max: 8,
    midJoin: true, // dealt in next round
    layout: null,  // same seats as Hold'em (filled in below)
  },
};
GAMES.veto.layout = GAMES.holdem.layout;

export const SIDE_ROT = [0, 90, 180, -90];
