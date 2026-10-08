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

GAMES.chess = {
  id: 'chess',
  name: 'Chess',
  blurb: '2 players · or play the computer',
  startLabel: 'Start the game',
  min: 2,
  max: 2,
  // Players sit at the two ends of the board, off to the side so the board can be big.
  layout: [S(11, 100, 0, 'White'), S(89, 0, 2, 'Black')],
};

GAMES.gofish = {
  id: 'gofish',
  name: 'Go Fish',
  blurb: '2–8 players · ask, fish, collect books',
  min: 2,
  max: 8,
  midJoin: true, // dealt in next game
  layout: GAMES.holdem.layout,
};

export const SIDE_ROT = [0, 90, 180, -90];

GAMES.backgammon = {
  id: 'backgammon',
  name: 'Backgammon',
  blurb: '2 players · or play the computer',
  min: 2,
  max: 2,
  layout: GAMES.chess.layout, // players in the corners, board in the middle
};

GAMES.sketch = {
  id: 'sketch',
  name: 'Sketch & Guess',
  blurb: '3–8 players · draw it, guess it',
  min: 3,
  max: 8,
  midJoin: true,   // new players start guessing right away
  noBots: true,    // a bot can't draw or guess
  startLabel: 'Start drawing',
  layout: GAMES.holdem.layout,
};

GAMES.chefskiss = {
  id: 'chefskiss',
  name: "Chef's Kiss Party Game",
  blurb: '3–8 players · pair the cards, win the Kiss',
  min: 3,
  max: 8,
  midJoin: true,   // dealt in at the next round
  startLabel: 'Start the game',
  layout: GAMES.holdem.layout,
};

GAMES.insidejob = {
  id: 'insidejob',
  name: 'Inside Job',
  blurb: '3–6 players · a silent heist, together',
  min: 3,
  max: 6,
  startLabel: 'Start the heist',
  layout: GAMES.holdem.layout,
};

// Ten seats: three along each long side and two at each end.
const TEN = [
  S(72, 100, 0, 'Bottom right'), S(50, 100, 0, 'Bottom middle'), S(28, 100, 0, 'Bottom left'),
  S(0, 72, 1, 'Left end, near'), S(0, 28, 1, 'Left end, far'),
  S(28, 0, 2, 'Top left'), S(50, 0, 2, 'Top middle'), S(72, 0, 2, 'Top right'),
  S(100, 28, 3, 'Right end, far'), S(100, 72, 3, 'Right end, near'),
];

GAMES.crown = {
  id: 'crown',
  name: 'Crown & Dagger',
  blurb: '5–10 players · find the Usurper',
  min: 5,
  max: 10,
  startLabel: 'Deal the roles',
  layout: TEN,
};

GAMES.hollow = {
  id: 'hollow',
  name: 'Hollowmere',
  blurb: '5–10 players · a village, a Shade, a long night',
  min: 5,
  max: 10,
  startLabel: 'Let night fall',
  layout: TEN,
};

GAMES.blackjack = {
  id: 'blackjack',
  name: 'Blackjack',
  blurb: '1–7 players · beat the dealer to 21',
  min: 1,
  max: 7,
  midJoin: true,   // sit down any time; you're dealt in next round
  startLabel: 'Open the table',
  layout: GAMES.holdem.layout,
};

GAMES.baccarat = {
  id: 'baccarat',
  name: 'Baccarat',
  blurb: '1–8 players · Player, Banker or Tie',
  min: 1,
  max: 8,
  midJoin: true,
  startLabel: 'Open the table',
  layout: GAMES.holdem.layout,
};

GAMES.checkers = {
  id: 'checkers',
  name: 'Checkers',
  blurb: '2 players · or play the computer',
  min: 2,
  max: 2,
  startLabel: 'Set up the board',
  layout: GAMES.chess.layout, // players at the two ends of the board
};

GAMES.yacht = {
  id: 'yacht',
  name: 'Yacht Club',
  blurb: '1–8 players · five dice, three rolls, thirteen boxes',
  min: 1,
  max: 8,
  startLabel: 'Open the score card',
  layout: GAMES.holdem.layout,
};

GAMES.spoons = {
  id: 'spoons',
  name: 'Spoons',
  blurb: '3–8 players · four of a kind, then grab a spoon',
  min: 3,
  max: 8,
  startLabel: 'Deal the cards',
  layout: GAMES.holdem.layout,
};

GAMES.doubt = {
  id: 'doubt',
  name: 'I Doubt It',
  blurb: '3–6 players · lay cards face down, lie, call the bluff',
  min: 3,
  max: 6,
  startLabel: 'Deal the cards',
  layout: GAMES.holdem.layout,
};

GAMES.cashout = {
  id: 'cashout',
  name: 'Cash Out',
  blurb: '2–8 players · roll for the pot, cash out before the 7',
  min: 2,
  max: 8,
  startLabel: 'Open the vault',
  layout: GAMES.holdem.layout,
};

GAMES.crazy8 = {
  id: 'crazy8',
  name: 'Crazy Eights',
  blurb: '2–8 players · match suit or rank, eights are wild',
  min: 2,
  max: 8,
  startLabel: 'Deal the cards',
  layout: GAMES.holdem.layout,
};

GAMES.skyline = {
  id: 'skyline',
  name: 'Skyline',
  blurb: '2–6 players · buy the city, raise towers, collect rent',
  min: 2,
  max: 6,
  startLabel: 'Open the city',
  // Players sit at the two ends so the board can fill the table.
  layout: [
    S(0, 78, 1, 'Left, near'), S(0, 50, 1, 'Left, middle'), S(0, 22, 1, 'Left, far'),
    S(100, 22, 3, 'Right, far'), S(100, 50, 3, 'Right, middle'), S(100, 78, 3, 'Right, near'),
  ],
};

GAMES.lowtide = {
  id: 'lowtide',
  name: 'Low Tide',
  blurb: '2–8 players · twelve hidden cards, lowest score wins',
  min: 2,
  max: 8,
  startLabel: 'Deal the grids',
  layout: GAMES.holdem.layout,
};

// Quick two-player games share the chess seats (the two ends of the board).
GAMES.trio = {
  id: 'trio',
  name: 'Tic Tac Toe',
  blurb: '2 players · or play the computer',
  min: 2,
  max: 2,
  startLabel: 'Start the match',
  layout: GAMES.chess.layout,
};

GAMES.fourup = {
  id: 'fourup',
  name: 'Four Up',
  blurb: '2 players · drop discs, line up four',
  min: 2,
  max: 2,
  startLabel: 'Start the match',
  layout: GAMES.chess.layout,
};

GAMES.seedstones = {
  id: 'seedstones',
  name: 'Seed Stones',
  blurb: '2 players · sow, capture, fill your store',
  min: 2,
  max: 2,
  startLabel: 'Start the game',
  layout: GAMES.chess.layout,
};

GAMES.sonar = {
  id: 'sonar',
  name: 'Sonar',
  blurb: '2 players · hide your fleet, ping theirs',
  min: 2,
  max: 2,
  startLabel: 'Hide the fleets',
  layout: GAMES.chess.layout,
};

GAMES.milestones = {
  id: 'milestones',
  name: 'Milestones',
  blurb: '2–6 players · ten stages of sets and runs',
  min: 2,
  max: 6,
  startLabel: 'Deal the cards',
  layout: GAMES.holdem.layout,
};

GAMES.wrongnumber = {
  id: 'wrongnumber',
  name: 'Wrong Number',
  blurb: '3–8 players · strange texts, funnier replies',
  min: 3,
  max: 8,
  startLabel: 'Start texting',
  layout: GAMES.holdem.layout,
};

GAMES.scribble = {
  id: 'scribble',
  name: 'Scribble Chain',
  blurb: '3–8 players · draw, guess, pass it on',
  min: 3,
  max: 8,
  noBots: true,   // bots can't draw
  startLabel: 'Open the sketchbooks',
  layout: GAMES.holdem.layout,
};

GAMES.manor = {
  id: 'manor',
  name: 'Midnight Manor',
  blurb: '3–6 players · who did it, with what, and where?',
  min: 3,
  max: 6,
  startLabel: 'Seal the envelope',
  layout: GAMES.holdem.layout,
};

GAMES.warfront = {
  id: 'warfront',
  name: 'Warfront',
  blurb: '2–6 players · conquer the islands, one battle at a time',
  min: 2,
  max: 6,
  startLabel: 'Deploy the armies',
  layout: GAMES.skyline.layout,   // players at the two ends, map in the middle
};

GAMES.ironroutes = {
  id: 'ironroutes',
  name: 'Iron Routes',
  blurb: '2–5 players · build rail lines across the country',
  min: 2,
  max: 5,
  startLabel: 'Lay the first track',
  layout: GAMES.skyline.layout,
};

GAMES.homestead = {
  id: 'homestead',
  name: 'Homestead',
  blurb: '2–4 players · settle the island, trade, build to 10',
  min: 2,
  max: 4,
  startLabel: 'Settle the island',
  layout: [S(0, 70, 1, 'Left, near'), S(0, 30, 1, 'Left, far'), S(100, 30, 3, 'Right, far'), S(100, 70, 3, 'Right, near')],
};

GAMES.wordsmith = {
  id: 'wordsmith',
  name: 'Wordsmith',
  blurb: '2–4 players · build words across the board',
  min: 2,
  max: 4,
  startLabel: 'Draw the tiles',
  layout: GAMES.homestead.layout,
};

GAMES.powerup = {
  id: 'powerup',
  name: 'PowerUp Chess',
  blurb: '2 players · captured pieces join your piece and lend it their moves',
  startLabel: 'Start the game',
  min: 2,
  max: 2,
  layout: GAMES.chess.layout,
};

GAMES.nestegg = {
  id: 'nestegg',
  name: 'Nest Egg',
  blurb: '2–6 players · pair up valuables, steal the top set',
  min: 2,
  max: 6,
  startLabel: 'Deal the cards',
  layout: GAMES.holdem.layout,
};

GAMES.kaboom = {
  id: 'kaboom',
  name: 'Kaboom Critters',
  blurb: '2–5 players · draw, dodge, and try not to go kaboom',
  min: 2,
  max: 5,
  startLabel: 'Deal the cards',
  layout: GAMES.holdem.layout,
};

GAMES.spires = {
  id: 'spires',
  name: 'Seven Spires',
  blurb: '2–7 players · draw, build your spire, win the wars',
  min: 2,
  max: 7,
  startLabel: 'Lay the foundations',
  layout: GAMES.holdem.layout,
};

GAMES.grandprix = {
  id: 'grandprix',
  name: 'Grand Prix Dice',
  blurb: '2–6 players · shift gears, roll, and brake for the corners',
  min: 2,
  max: 6,
  startLabel: 'Start your engines',
  layout: GAMES.skyline.layout,
};

GAMES.redline = {
  id: 'redline',
  name: 'Redline',
  blurb: '2–6 players · play speed cards, manage your engine heat',
  min: 2,
  max: 6,
  startLabel: 'Lights out',
  layout: GAMES.skyline.layout,
};
