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

GAMES.gearworks = {
  id: 'gearworks',
  name: 'Gearworks',
  blurb: '2–5 players · pick actions at once, build a robot workshop',
  min: 2,
  max: 5,
  startLabel: 'Open the workshop',
  layout: GAMES.holdem.layout,
};

GAMES.tessera = {
  id: 'tessera',
  name: 'Tessera',
  blurb: '2–4 players · join the shapes, cover their gems',
  min: 2,
  max: 4,
  startLabel: 'Lay the first tile',
  layout: GAMES.holdem.layout,
};

GAMES.passpot = {
  id: 'passpot',
  name: 'Pass the Pot',
  blurb: '3–10 players · roll, pass your chips, keep the last one',
  min: 3,
  max: 10,
  startLabel: 'Hand out the chips',
  layout: GAMES.crown.layout,
};

GAMES.luckystreak = {
  id: 'luckystreak',
  name: 'Lucky Streak',
  blurb: '2–8 players · flip cards, push your luck, never pair up',
  min: 2,
  max: 8,
  startLabel: 'Deal the first round',
  layout: GAMES.holdem.layout,
};

GAMES.pileup = {
  id: 'pileup',
  name: 'Pile Up',
  blurb: '2–8 players · stack the draws, no mercy, 25 cards and you are out',
  min: 2,
  max: 8,
  midJoin: false,
  startLabel: 'Deal the cards',
  layout: GAMES.holdem.layout,
};

GAMES.dialitin = {
  id: 'dialitin',
  name: 'Dial It In',
  blurb: '2–10 players · give a clue, turn the dial, read their minds',
  min: 2,
  max: 10,
  noBots: true,   // bots can't give or read clues
  startLabel: 'Spin up the dial',
  layout: GAMES.crown.layout,
};

GAMES.fieldagents = {
  id: 'fieldagents',
  name: 'Field Agents',
  blurb: '4–8 players · two teams, one-word clues, find your agents',
  min: 4,
  max: 8,
  noBots: true,   // bots can't give or read clues
  startLabel: 'Open the dossier',
  // Brass sits down the left side, Steel down the right.
  layout: [
    S(0, 80, 1, 'Brass'), S(0, 60, 1, 'Brass'), S(0, 40, 1, 'Brass'), S(0, 20, 1, 'Brass'),
    S(100, 20, 3, 'Steel'), S(100, 40, 3, 'Steel'), S(100, 60, 3, 'Steel'), S(100, 80, 3, 'Steel'),
  ],
};

GAMES.bannerraid = {
  id: 'bannerraid',
  name: 'Banner Raid',
  blurb: '2 players · hidden ranks, bold attacks, capture the Banner',
  min: 2,
  max: 2,
  startLabel: 'Muster the troops',
  layout: GAMES.chess.layout,
};

GAMES.houserules = {
  id: 'houserules',
  name: 'House Rules',
  blurb: '2–6 players · the rules change every time someone plays a card',
  min: 2,
  max: 6,
  startLabel: 'Deal three each',
  layout: GAMES.holdem.layout,
};

GAMES.deepspace = {
  id: 'deepspace',
  name: 'House Rules: Deep Space',
  blurb: '2–6 players · ever-changing rules among the stars, with Creepers',
  min: 2,
  max: 6,
  startLabel: 'Launch the deck',
  layout: GAMES.holdem.layout,
};

GAMES.hardsell = {
  id: 'hardsell',
  name: 'Hard Sell',
  blurb: '3–10 players · make silly products, pitch them, make the sale',
  min: 3,
  max: 10,
  noBots: true,   // bots can't pitch
  startLabel: 'Open for business',
  layout: GAMES.crown.layout,
};

GAMES.words4fun = {
  id: 'words4fun',
  name: 'Words 4 Fun',
  blurb: '2–8 players · two teams, a grid of letters, find the most words',
  min: 2,
  max: 8,
  startLabel: 'Shake the letters',
  // Team Sun down the left side, Team Moon down the right.
  layout: [
    S(0, 80, 1, 'Sun'), S(0, 60, 1, 'Sun'), S(0, 40, 1, 'Sun'), S(0, 20, 1, 'Sun'),
    S(100, 20, 3, 'Moon'), S(100, 40, 3, 'Moon'), S(100, 60, 3, 'Moon'), S(100, 80, 3, 'Moon'),
  ],
};

GAMES.hearts = {
  id: 'hearts',
  name: 'Hearts',
  blurb: '4 players · pass three, duck the hearts, dodge the Queen',
  min: 4,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.spades = {
  id: 'spades',
  name: 'Spades',
  blurb: '4 players · partners bid their tricks, spades are trump',
  min: 4,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.war = {
  id: 'war',
  name: 'War',
  blurb: '2 players · flip, compare, and go to war on a tie',
  min: 2,
  max: 2,
  startLabel: 'Split the deck',
  layout: [S(50, 100, 0, 'South'), S(50, 0, 2, 'North')],
};

GAMES.oldmaid = {
  id: 'oldmaid',
  name: 'Old Maid',
  blurb: '2–8 players · pair up, pass it on, don’t get stuck with the queen',
  min: 2,
  max: 8,
  layout: GAMES.holdem.layout,
};

GAMES.rummy = {
  id: 'rummy',
  name: 'Rummy',
  blurb: '2–6 players · draw, meld sets and runs, go out first',
  min: 2,
  max: 6,
  layout: GAMES.holdem.layout,
};

GAMES.gin = {
  id: 'gin',
  name: 'Gin Rummy',
  blurb: '2 players · cut your deadwood, knock, or go Gin',
  min: 2,
  max: 2,
  layout: [S(50, 100, 0, 'South'), S(50, 0, 2, 'North')],
};

GAMES.drawpoker = {
  id: 'drawpoker',
  name: 'Five-Card Draw',
  blurb: '2–6 players · ante, bet, swap up to three, show down',
  min: 2,
  max: 6,
  layout: GAMES.holdem.layout,
};

GAMES.cribbage = {
  id: 'cribbage',
  name: 'Cribbage',
  blurb: '2 players · fifteens, pairs and runs, peg to 121',
  min: 2,
  max: 2,
  layout: [S(50, 100, 0, 'South'), S(50, 0, 2, 'North')],
};

GAMES.stackup = {
  id: 'stackup',
  name: 'Stack Up',
  blurb: '2–6 players · build 1 to 12, empty your stock pile first',
  min: 2,
  max: 6,
  layout: GAMES.holdem.layout,
};

GAMES.rackem = {
  id: 'rackem',
  name: 'Rack ’Em',
  blurb: '2–4 players · put ten cards in order, lowest to highest',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.bento = {
  id: 'bento',
  name: 'Bento Box',
  blurb: '2–5 players · pick a card, pass the rest, pack the best lunch',
  min: 2,
  max: 5,
  layout: GAMES.holdem.layout,
};

GAMES.dealmaker = {
  id: 'dealmaker',
  name: 'Deal Maker',
  blurb: '2–5 players · charge rent, steal deals, complete three sets',
  min: 2,
  max: 5,
  layout: GAMES.holdem.layout,
};

GAMES.roadrally = {
  id: 'roadrally',
  name: 'Road Rally',
  blurb: '2–4 players · drive 1000 miles, hit rivals with hazards',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.unicorns = {
  id: 'unicorns',
  name: 'Unicorn Chaos',
  blurb: '2–6 players · build a stable of seven unicorns, sabotage everyone else',
  min: 2,
  max: 6,
  layout: GAMES.holdem.layout,
};

GAMES.powergrab = {
  id: 'powergrab',
  name: 'Power Grab',
  blurb: '2–6 players · claim any role, call bluffs, be the last one standing',
  min: 2,
  max: 6,
  startLabel: 'Deal the roles',
  layout: GAMES.holdem.layout,
};

GAMES.rebelcell = {
  id: 'rebelcell',
  name: 'Rebel Cell',
  blurb: '5–10 players · five missions, hidden spies, trust no one',
  min: 5,
  max: 10,
  startLabel: 'Deal the roles',
  layout: GAMES.crown.layout,
};

GAMES.roundtable = {
  id: 'roundtable',
  name: 'Round Table',
  blurb: '5–10 players · loyal knights, hidden traitors, and a Seer to protect',
  min: 5,
  max: 10,
  startLabel: 'Deal the roles',
  layout: GAMES.crown.layout,
};

GAMES.reversi = {
  id: 'reversi',
  name: 'Reversi',
  blurb: '2 players · trap and flip, own the board',
  startLabel: 'Start the game',
  min: 2,
  max: 2,
  layout: GAMES.chess.layout,
};

GAMES.go = {
  id: 'go',
  name: 'Go',
  blurb: '2 players · surround territory, capture stones',
  startLabel: 'Start the game',
  min: 2,
  max: 2,
  layout: GAMES.chess.layout,
};

GAMES.codebreaker = {
  id: 'codebreaker',
  name: 'Code Breaker',
  blurb: '2 players · set a secret code, crack theirs',
  startLabel: 'Start the game',
  min: 2,
  max: 2,
  layout: GAMES.chess.layout,
};

GAMES.starjump = {
  id: 'starjump',
  name: 'Star Jump',
  blurb: '2–6 players · hop and jump your marbles across the star',
  startLabel: 'Start the game',
  min: 2,
  max: 6,
  // One seat at each point of the star, clockwise from the bottom.
  layout: [S(50, 100, 0, 'South'), S(0, 74, 1, 'South-west'), S(0, 26, 1, 'North-west'), S(50, 0, 2, 'North'), S(100, 26, 3, 'North-east'), S(100, 74, 3, 'South-east')],
};

GAMES.dominoes = {
  id: 'dominoes',
  name: 'Dominoes',
  blurb: '2–4 players · match the ends, empty your hand',
  min: 2,
  max: 4,
  startLabel: 'Shuffle the tiles',
  layout: GAMES.euchre.layout,
};

GAMES.cornerstones = {
  id: 'cornerstones',
  name: 'Cornerstones',
  blurb: '2–4 players · fit your pieces corner to corner, block everyone else',
  startLabel: 'Start the game',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.shapeshade = {
  id: 'shapeshade',
  name: 'Shape & Shade',
  blurb: '2–4 players · line up colours and shapes, score big with six',
  startLabel: 'Fill the bag',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.lineup5 = {
  id: 'lineup5',
  name: 'Line Up 5',
  blurb: '2–8 players · play a card, place a chip, get five in a row',
  min: 2,
  max: 8,
  layout: GAMES.holdem.layout,
};

GAMES.hotdice = {
  id: 'hotdice',
  name: 'Hot Dice',
  blurb: '2–8 players · roll six, keep the scorers, bank before you bust',
  startLabel: 'Grab the dice',
  min: 2,
  max: 8,
  layout: GAMES.holdem.layout,
};

GAMES.hogtoss = {
  id: 'hogtoss',
  name: 'Hog Toss',
  blurb: '2–8 players · toss two pigs, push your luck, first to 100',
  startLabel: 'Toss the pigs',
  min: 2,
  max: 8,
  layout: GAMES.holdem.layout,
};

GAMES.bingo = {
  id: 'bingo',
  name: 'Bingo',
  blurb: '2–10 players · the table calls, your phone is your card',
  startLabel: 'Deal the cards',
  min: 1,
  max: 10,
  layout: GAMES.crown.layout,
};

GAMES.snakes = {
  id: 'snakes',
  name: 'Snakes & Ladders',
  blurb: '2–6 players · roll, climb the ladders, dodge the snakes',
  startLabel: 'Start the race',
  min: 2,
  max: 6,
  layout: GAMES.holdem.layout,
};

GAMES.sweettrail = {
  id: 'sweettrail',
  name: 'Sweet Trail',
  blurb: '2–6 players · draw a colour, hop along the candy path',
  startLabel: 'Start the race',
  min: 2,
  max: 6,
  layout: GAMES.holdem.layout,
};

GAMES.orchard = {
  id: 'orchard',
  name: 'Orchard',
  blurb: '2–4 players · spin, pick your fruit, watch out for the crow',
  startLabel: 'Start picking',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.ludo = {
  id: 'ludo',
  name: 'Ludo',
  blurb: '2–4 players · roll a six to get out, race all four pieces home',
  startLabel: 'Start the race',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.poprace = {
  id: 'poprace',
  name: 'Pop-Up Race',
  blurb: '2–4 players · pop the die, chase your pegs home, bump the others back',
  startLabel: 'Start the race',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.marblerush = {
  id: 'marblerush',
  name: 'Marble Rush',
  blurb: '2–4 players · race your marbles home, take the shortcuts, aggravate everyone',
  startLabel: 'Start the race',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.pardon = {
  id: 'pardon',
  name: 'Pardon Me!',
  blurb: '2–4 players · draw cards, slide, swap, and bump rivals back to Start',
  startLabel: 'Start the race',
  min: 2,
  max: 4,
  layout: GAMES.euchre.layout,
};

GAMES.dontsay = {
  id: 'dontsay',
  name: 'Don’t Say It',
  blurb: '4–8 players · two teams, describe the word, avoid the forbidden ones',
  min: 4,
  max: 8,
  noBots: true,
  startLabel: 'Shuffle the cards',
  layout: GAMES.holdem.layout,
};

GAMES.passphrase = {
  id: 'passphrase',
  name: 'Pass the Phrase',
  blurb: '4–8 players · describe, pass it on, don’t get caught holding it',
  min: 4,
  max: 8,
  noBots: true,
  startLabel: 'Light the fuse',
  layout: GAMES.holdem.layout,
};

GAMES.listoff = {
  id: 'listoff',
  name: "List Off",
  blurb: "2–10 players · one letter, ten categories, beat the clock",
  min: 2,
  max: 10,
  noBots: true,
  startLabel: "Roll the letter",
  layout: GAMES.crown.layout,
};

GAMES.wordbluff = {
  id: 'wordbluff',
  name: "Word Bluff",
  blurb: "3–10 players · fake the meaning of a strange word, spot the real one",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Open the dictionary",
  layout: GAMES.crown.layout,
};


GAMES.topanswers = {
  id: 'topanswers',
  name: "Top Answers",
  blurb: "4–10 players · two teams guess the most popular survey answers",
  min: 4,
  max: 10,
  noBots: true,
  startLabel: "Survey says…",
  layout: GAMES.crown.layout,
};

GAMES.triviawheel = {
  id: 'triviawheel',
  name: "Trivia Wheel",
  blurb: "1–10 players · spin, answer fast, collect every wedge",
  min: 1,
  max: 10,
  noBots: true,
  startLabel: "Spin the wheel",
  layout: GAMES.crown.layout,
};

GAMES.answerboard = {
  id: 'answerboard',
  name: "Answer Board",
  blurb: "1–8 players · pick a clue, answer fastest, watch for the Double Down",
  min: 1,
  max: 8,
  noBots: true,
  startLabel: "Light up the board",
  layout: GAMES.holdem.layout,
};

GAMES.spinsolve = {
  id: 'spinsolve',
  name: "Spin & Solve",
  blurb: "1–6 players · spin the wheel, call letters, solve the puzzle",
  min: 1,
  max: 6,
  noBots: true,
  startLabel: "Spin the wheel",
  layout: GAMES.holdem.layout,
};

GAMES.oddoneout = {
  id: 'oddoneout',
  name: "Odd One Out",
  blurb: "3–10 players · everyone knows the secret word except one",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Deal the secret",
  layout: GAMES.crown.layout,
};

GAMES.mostlikely = {
  id: 'mostlikely',
  name: "Most Likely To",
  blurb: "3–10 players · vote who’s most likely to… and agree with the crowd",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Ask the first question",
  layout: GAMES.crown.layout,
};

GAMES.twotruths = {
  id: 'twotruths',
  name: "Two Truths & a Lie",
  blurb: "3–10 players · three facts about you, one is made up",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Start writing",
  layout: GAMES.crown.layout,
};



GAMES.bluffdice = {
  id: 'bluffdice',
  name: "Bluff Dice",
  blurb: "2–6 players · secret dice under your cup, bid big, call Liar",
  min: 2,
  max: 6,
  startLabel: "Shake the cups",
  layout: GAMES.holdem.layout,
};

GAMES.petals = {
  id: 'petals',
  name: "Petals & Thorns",
  blurb: "3–6 players · stack discs, bid, and pray you don’t flip a Thorn",
  min: 3,
  max: 6,
  startLabel: "Lay your discs",
  layout: GAMES.holdem.layout,
};

GAMES.sealed = {
  id: 'sealed',
  name: "Sealed Letter",
  blurb: "2–6 players · one secret card each, last letter standing wins",
  min: 2,
  max: 6,
  startLabel: "Seal the letters",
  layout: GAMES.holdem.layout,
};

GAMES.insync = {
  id: 'insync',
  name: "In Sync",
  blurb: "2–4 players · a silent team game: play your numbers in order",
  min: 2,
  max: 4,
  startLabel: "Begin level 1",
  layout: GAMES.euchre.layout,
};

GAMES.nightlights = {
  id: 'nightlights',
  name: "Night Lights",
  blurb: "2–5 players · team fireworks — see every hand except your own",
  min: 2,
  max: 5,
  startLabel: "Light the fuse",
  layout: GAMES.holdem.layout,
};

GAMES.nope = {
  id: 'nope',
  name: "Nope!",
  blurb: "3–7 players · take the card or pay a secret chip to pass it on",
  min: 3,
  max: 7,
  startLabel: "Deal the cards",
  layout: GAMES.holdem.layout,
};

GAMES.bullpen = {
  id: 'bullpen',
  name: "Bull Pen",
  blurb: "2–10 players · everyone picks a card at once — dodge the sixth spot",
  min: 2,
  max: 10,
  startLabel: "Open the pen",
  layout: GAMES.crown.layout,
};

GAMES.openhouse = {
  id: 'openhouse',
  name: "Open House",
  blurb: "3–6 players · bid on properties, then sell them for cheques",
  min: 3,
  max: 6,
  startLabel: "Open the market",
  layout: GAMES.holdem.layout,
};

GAMES.bugbluff = {
  id: 'bugbluff',
  name: "Bug Bluff",
  blurb: "3–6 players · pass bugs with a claim — believe it or call it",
  min: 3,
  max: 6,
  startLabel: "Deal the bugs",
  layout: GAMES.holdem.layout,
};

GAMES.snapmatch = {
  id: 'snapmatch',
  name: "Snap Match",
  blurb: "2–8 players · your card vs the table’s — tap the match first",
  min: 2,
  max: 8,
  startLabel: "Flip the first card",
  layout: GAMES.holdem.layout,
};

GAMES.whoswho = {
  id: 'whoswho',
  name: "Who’s Who",
  blurb: "2 players · ask yes-or-no questions, guess their secret face",
  min: 2,
  max: 2,
  startLabel: "Pick the faces",
  layout: GAMES.chess.layout,
};

GAMES.throwdown = {
  id: 'throwdown',
  name: "Throwdown",
  blurb: "2–10 players · a rock-paper-scissors tournament bracket",
  min: 2,
  max: 10,
  startLabel: "Draw the bracket",
  layout: GAMES.crown.layout,
};

GAMES.oneclue = {
  id: 'oneclue',
  name: "One Clue",
  blurb: "3–10 players · team game: one-word clues, duplicates cancel",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Deal the first card",
  layout: GAMES.crown.layout,
};

GAMES.samebrain = {
  id: 'samebrain',
  name: "Same Brain",
  blurb: "3–10 players · give the answer everyone else gives",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Ask the herd",
  layout: GAMES.crown.layout,
};

GAMES.closecall = {
  id: 'closecall',
  name: "Close Call",
  blurb: "2–10 players · guess numbers, then bet on the closest guess",
  min: 2,
  max: 10,
  noBots: true,
  startLabel: "First question",
  layout: GAMES.crown.layout,
};

GAMES.doodlebluff = {
  id: 'doodlebluff',
  name: "Doodle Bluff",
  blurb: "3–8 players · draw a weird prompt, fake titles for the others",
  min: 3,
  max: 8,
  noBots: true,
  startLabel: "Hand out the prompts",
  layout: GAMES.holdem.layout,
};

GAMES.dreamcards = {
  id: 'dreamcards',
  name: "Dreamcards",
  blurb: "3–8 players · a dreamy clue — which picture was it?",
  min: 3,
  max: 8,
  noBots: true,
  startLabel: "Deal the dreams",
  layout: GAMES.holdem.layout,
};

GAMES.knowme = {
  id: 'knowme',
  name: "Know Me",
  blurb: "3–10 players · guess what the hot seat really answered",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Take the hot seat",
  layout: GAMES.crown.layout,
};

GAMES.thisorthat = {
  id: 'thisorthat',
  name: "This or That",
  blurb: "3–10 players · pick a side, then predict the room",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "First dilemma",
  layout: GAMES.crown.layout,
};

GAMES.faceoff = {
  id: 'faceoff',
  name: "Face Off",
  blurb: "3–8 players · funny answers go head to head, everyone votes",
  min: 3,
  max: 8,
  noBots: true,
  startLabel: "Hand out prompts",
  layout: GAMES.holdem.layout,
};

GAMES.flagfrenzy = {
  id: 'flagfrenzy',
  name: "Flag Frenzy",
  blurb: "1–10 players · flags on the big screen, answers on your phone",
  min: 1,
  max: 10,
  startLabel: "Raise the flags",
  layout: GAMES.crown.layout,
};

GAMES.capitalquest = {
  id: 'capitalquest',
  name: "Capital Quest",
  blurb: "1–10 players · name the capital city before everyone else",
  min: 1,
  max: 10,
  startLabel: "Start the tour",
  layout: GAMES.crown.layout,
};

GAMES.trueorfalse = {
  id: 'trueorfalse',
  name: "True or False?",
  blurb: "1–10 players · surprising facts — tap true or false, fast",
  min: 1,
  max: 10,
  startLabel: "First fact",
  layout: GAMES.crown.layout,
};

GAMES.emojiphrase = {
  id: 'emojiphrase',
  name: "Emoji Phrase",
  blurb: "1–10 players · decode the emoji on the table, type the phrase",
  min: 1,
  max: 10,
  startLabel: "Show the first puzzle",
  layout: GAMES.crown.layout,
};

GAMES.numbercrunch = {
  id: 'numbercrunch',
  name: "Number Crunch",
  blurb: "1–10 players · mental maths race on the big screen",
  min: 1,
  max: 10,
  startLabel: "Crunch!",
  layout: GAMES.crown.layout,
};

GAMES.whichismore = {
  id: 'whichismore',
  name: "Which Is More?",
  blurb: "1–10 players · two choices, one is bigger, faster, older…",
  min: 1,
  max: 10,
  startLabel: "First face-off",
  layout: GAMES.crown.layout,
};

GAMES.missingvowels = {
  id: 'missingvowels',
  name: "Missing Vowels",
  blurb: "1–10 players · the vowels vanished — type the word",
  min: 1,
  max: 10,
  startLabel: "Remove the vowels",
  layout: GAMES.crown.layout,
};

GAMES.wordscramble = {
  id: 'wordscramble',
  name: "Word Scramble",
  blurb: "1–10 players · unscramble the letters before the clock runs out",
  min: 1,
  max: 10,
  startLabel: "Scramble!",
  layout: GAMES.crown.layout,
};

GAMES.riddleme = {
  id: 'riddleme',
  name: "Riddle Me This",
  blurb: "1–10 players · classic riddles — type the answer",
  min: 1,
  max: 10,
  startLabel: "First riddle",
  layout: GAMES.crown.layout,
};

GAMES.doesntbelong = {
  id: 'doesntbelong',
  name: "Doesn’t Belong",
  blurb: "1–10 players · four things, one is the odd one out",
  min: 1,
  max: 10,
  startLabel: "Spot the odd one",
  layout: GAMES.crown.layout,
};

GAMES.wildfacts = {
  id: 'wildfacts',
  name: "Wild Facts",
  blurb: "1–10 players · animal trivia for the whole room",
  min: 1,
  max: 10,
  startLabel: "Into the wild",
  layout: GAMES.crown.layout,
};

GAMES.finishthesaying = {
  id: 'finishthesaying',
  name: "Finish the Saying",
  blurb: "1–10 players · complete the proverb, fastest wins",
  min: 1,
  max: 10,
  startLabel: "Begin",
  layout: GAMES.crown.layout,
};

GAMES.continentquest = {
  id: 'continentquest',
  name: "Continent Quest",
  blurb: "1–10 players · which continent is that country in?",
  min: 1,
  max: 10,
  startLabel: "Spin the globe",
  layout: GAMES.crown.layout,
};

GAMES.colorclash = {
  id: 'colorclash',
  name: "Colour Clash",
  blurb: "1–10 players · tap the colour of the ink, not the word",
  min: 1,
  max: 10,
  startLabel: "Clash!",
  layout: GAMES.crown.layout,
};

GAMES.countit = {
  id: 'countit',
  name: "Count It",
  blurb: "1–10 players · a flash of pictures on the table — how many?",
  min: 1,
  max: 10,
  startLabel: "Ready… look!",
  layout: GAMES.crown.layout,
};

GAMES.lastonestanding = {
  id: 'lastonestanding',
  name: "Last One Standing",
  blurb: "2–10 players · trivia elimination — one wrong and you’re out",
  min: 2,
  max: 10,
  startLabel: "Everyone stand",
  layout: GAMES.crown.layout,
};

GAMES.buzzin = {
  id: 'buzzin',
  name: "Buzz In",
  blurb: "2–10 players · first right answer takes the points — wrong costs you",
  min: 2,
  max: 10,
  startLabel: "Fingers on buzzers",
  layout: GAMES.crown.layout,
};

GAMES.whatyear = {
  id: 'whatyear',
  name: "What Year?",
  blurb: "1–10 players · guess the year of famous events, closest wins",
  min: 1,
  max: 10,
  startLabel: "Turn back time",
  layout: GAMES.crown.layout,
};

GAMES.nextinline = {
  id: 'nextinline',
  name: "Next in Line",
  blurb: "1–10 players · number patterns — what comes next?",
  min: 1,
  max: 10,
  startLabel: "First pattern",
  layout: GAMES.crown.layout,
};

GAMES.opposites = {
  id: 'opposites',
  name: "Opposites",
  blurb: "1–10 players · pick the word that means the opposite",
  min: 1,
  max: 10,
  startLabel: "Flip it",
  layout: GAMES.crown.layout,
};

GAMES.cluecrack = {
  id: 'cluecrack',
  name: "Clue Crack",
  blurb: "1–10 players · crossword clues on the big screen",
  min: 1,
  max: 10,
  startLabel: "Read the first clue",
  layout: GAMES.crown.layout,
};

GAMES.sortitout = {
  id: 'sortitout',
  name: "Sort It Out",
  blurb: "1–10 players · put four things in the right order on your phone",
  min: 1,
  max: 10,
  startLabel: "Shuffle the cards",
  layout: GAMES.crown.layout,
};

GAMES.flashmemory = {
  id: 'flashmemory',
  name: "Flash Memory",
  blurb: "1–10 players · pictures flash on the table — which one wasn’t there?",
  min: 1,
  max: 10,
  startLabel: "Memorise!",
  layout: GAMES.crown.layout,
};

GAMES.roulette = {
  id: 'roulette',
  name: "Roulette",
  blurb: "1–10 players · bet on your phone, the wheel spins on the table",
  min: 1,
  max: 10,
  startLabel: "Spin the wheel",
  layout: GAMES.crown.layout,
};

GAMES.tripledice = {
  id: 'tripledice',
  name: "Triple Dice",
  blurb: "1–10 players · three dice, big or small, totals and triples",
  min: 1,
  max: 10,
  startLabel: "Shake the dice",
  layout: GAMES.crown.layout,
};

GAMES.luckynumbers = {
  id: 'luckynumbers',
  name: "Lucky Numbers",
  blurb: "1–10 players · pick your numbers, watch ten get drawn",
  min: 1,
  max: 10,
  startLabel: "Start the draw",
  layout: GAMES.crown.layout,
};

GAMES.moneywheel = {
  id: 'moneywheel',
  name: "Money Wheel",
  blurb: "1–10 players · bet on the number the big wheel lands on",
  min: 1,
  max: 10,
  startLabel: "Spin it",
  layout: GAMES.crown.layout,
};

GAMES.derbyday = {
  id: 'derbyday',
  name: "Derby Day",
  blurb: "1–10 players · back a horse on your phone, watch the race on the table",
  min: 1,
  max: 10,
  startLabel: "Saddle up",
  layout: GAMES.crown.layout,
};

GAMES.oddoreven = {
  id: 'oddoreven',
  name: "Odd or Even",
  blurb: "1–10 players · two dice under the cup — odd or even?",
  min: 1,
  max: 10,
  startLabel: "Shake the cup",
  layout: GAMES.crown.layout,
};

GAMES.dicepit = {
  id: 'dicepit',
  name: "Dice Pit",
  blurb: "1–10 players · pass line, field and long-shot dice bets",
  min: 1,
  max: 10,
  startLabel: "Come out roll",
  layout: GAMES.crown.layout,
};

GAMES.pegdrop = {
  id: 'pegdrop',
  name: "Peg Drop",
  blurb: "1–10 players · drop your ball through the pegs — edges pay big",
  min: 1,
  max: 10,
  startLabel: "Drop the balls",
  layout: GAMES.crown.layout,
};

GAMES.inbetween = {
  id: 'inbetween',
  name: "In Between",
  blurb: "1–10 players · two cards on the table — will the next land between?",
  min: 1,
  max: 10,
  startLabel: "Deal the gate",
  layout: GAMES.crown.layout,
};

GAMES.casinowar = {
  id: 'casinowar',
  name: "Casino War",
  blurb: "1–10 players · your card against the dealer’s, high card wins",
  min: 1,
  max: 10,
  startLabel: "Deal",
  layout: GAMES.crown.layout,
};

GAMES.liftoff = {
  id: 'liftoff',
  name: "Liftoff",
  blurb: "1–10 players · ride the rocket and cash out before it crashes",
  min: 1,
  max: 10,
  startLabel: "Count down",
  layout: GAMES.crown.layout,
};

GAMES.ridethebus = {
  id: 'ridethebus',
  name: "Ride the Bus",
  blurb: "1–10 players · red or black, higher or lower… cash out or keep riding",
  min: 1,
  max: 10,
  startLabel: "All aboard",
  layout: GAMES.crown.layout,
};

GAMES.threecard = {
  id: 'threecard',
  name: "Three Card Showdown",
  blurb: "1–7 players · three cards on your phone — play or fold against the dealer",
  min: 1,
  max: 7,
  startLabel: "Deal the cards",
  layout: GAMES.holdem.layout,
};

GAMES.islandstud = {
  id: 'islandstud',
  name: "Island Stud",
  blurb: "1–7 players · five-card stud against the dealer, big bonus payouts",
  min: 1,
  max: 7,
  startLabel: "Deal the cards",
  layout: GAMES.holdem.layout,
};

GAMES.omaha = {
  id: 'omaha',
  name: 'Four-Hole Hold’em',
  blurb: '2–8 players · four hole cards on your phone, use exactly two',
  min: 2,
  max: 8,
  midJoin: true,
  layout: GAMES.holdem.layout,
};

GAMES.lowestunique = {
  id: 'lowestunique',
  name: "Lowest Unique",
  blurb: "2–10 players · pick the lowest number nobody else picks",
  min: 2,
  max: 10,
  startLabel: "Pick a number",
  layout: GAMES.crown.layout,
};

GAMES.splitsteal = {
  id: 'splitsteal',
  name: "Split or Steal",
  blurb: "2–10 players · share the pot with your partner… or take it all",
  min: 2,
  max: 10,
  startLabel: "Pair up",
  layout: GAMES.crown.layout,
};

GAMES.twothirds = {
  id: 'twothirds',
  name: "Two-Thirds",
  blurb: "2–10 players · guess two-thirds of everyone’s average guess",
  min: 2,
  max: 10,
  startLabel: "Guess away",
  layout: GAMES.crown.layout,
};

GAMES.vulturebids = {
  id: 'vulturebids',
  name: "Vulture Bids",
  blurb: "2–10 players · secret card bids for prizes — ties cancel out",
  min: 2,
  max: 10,
  startLabel: "Reveal the first prize",
  layout: GAMES.crown.layout,
};

GAMES.treasurerun = {
  id: 'treasurerun',
  name: "Treasure Run",
  blurb: "2–10 players · go deeper for gems or head home before the cave collapses",
  min: 2,
  max: 10,
  startLabel: "Enter the cave",
  layout: GAMES.crown.layout,
};

GAMES.ticker = {
  id: 'ticker',
  name: "Ticker",
  blurb: "2–10 players · a secret tip on your phone, one trade a day, richest wins",
  min: 2,
  max: 10,
  startLabel: "Open the market",
  layout: GAMES.crown.layout,
};

GAMES.galaauction = {
  id: 'galaauction',
  name: "Gala Auction",
  blurb: "3–10 players · bid money cards on luxuries — but don’t end up the poorest",
  min: 3,
  max: 10,
  startLabel: "Start the gala",
  layout: GAMES.crown.layout,
};

GAMES.threefronts = {
  id: 'threefronts',
  name: "Three Fronts",
  blurb: "2–10 players · split your troops across three battlefields",
  min: 2,
  max: 10,
  startLabel: "Deploy",
  layout: GAMES.crown.layout,
};

GAMES.lemonade = {
  id: 'lemonade',
  name: "Lemonade Stand",
  blurb: "2–10 players · set your price, make your cups, read the weather",
  min: 2,
  max: 10,
  startLabel: "Open the stands",
  layout: GAMES.crown.layout,
};

GAMES.fishpond = {
  id: 'fishpond',
  name: "Fish Pond",
  blurb: "2–10 players · take fish from a shared pond — or ruin it for everyone",
  min: 2,
  max: 10,
  startLabel: "Cast off",
  layout: GAMES.crown.layout,
};

GAMES.mysteryboxes = {
  id: 'mysteryboxes',
  name: "Mystery Boxes",
  blurb: "2–10 players · a secret hint, a sealed bid, three boxes",
  min: 2,
  max: 10,
  startLabel: "Bring out the boxes",
  layout: GAMES.crown.layout,
};

GAMES.standoff = {
  id: 'standoff',
  name: "Standoff",
  blurb: "3–10 players · aim, load a bullet or a bluff, and grab the loot",
  min: 3,
  max: 10,
  startLabel: "Draw!",
  layout: GAMES.crown.layout,
};

GAMES.fiveletters = {
  id: 'fiveletters',
  name: "Five Letters",
  blurb: "1–10 players · everyone guesses the same secret word on their own phone",
  min: 1,
  max: 10,
  startLabel: "Pick the word",
  layout: GAMES.crown.layout,
};

GAMES.wordgallows = {
  id: 'wordgallows',
  name: "Word Gallows",
  blurb: "2–10 players · everyone picks a letter at once — fill the word before the gallows",
  min: 2,
  max: 10,
  startLabel: "Hang the word",
  layout: GAMES.crown.layout,
};

GAMES.longword = {
  id: 'longword',
  name: "Long Word",
  blurb: "1–10 players · nine letters on the table, longest word wins",
  min: 1,
  max: 10,
  startLabel: "Deal the letters",
  layout: GAMES.crown.layout,
};

GAMES.targetnumber = {
  id: 'targetnumber',
  name: "Target Number",
  blurb: "1–10 players · six numbers, one target, any sums you like",
  min: 1,
  max: 10,
  startLabel: "Show the target",
  layout: GAMES.crown.layout,
};

GAMES.speedtypist = {
  id: 'speedtypist',
  name: "Speed Typist",
  blurb: "1–10 players · type the sentence on the table fastest",
  min: 1,
  max: 10,
  startLabel: "Ready, set, type",
  layout: GAMES.crown.layout,
};

GAMES.wordchain = {
  id: 'wordchain',
  name: "Word Chain",
  blurb: "2–10 players · each word starts with the last letter of the one before",
  min: 2,
  max: 10,
  startLabel: "First word",
  layout: GAMES.crown.layout,
};

GAMES.ghostletters = {
  id: 'ghostletters',
  name: "Ghost Letters",
  blurb: "2–10 players · add a letter, don’t finish a word, or you’re a GHOST",
  min: 2,
  max: 10,
  startLabel: "First letter",
  layout: GAMES.crown.layout,
};

GAMES.slowreveal = {
  id: 'slowreveal',
  name: "Slow Reveal",
  blurb: "1–10 players · a picture appears tile by tile — guess it first",
  min: 1,
  max: 10,
  startLabel: "Start revealing",
  layout: GAMES.crown.layout,
};

GAMES.acrorace = {
  id: 'acrorace',
  name: "Acro Race",
  blurb: "3–10 players · write a phrase from random letters, vote for the funniest",
  min: 3,
  max: 10,
  startLabel: "Roll the letters",
  layout: GAMES.crown.layout,
};

GAMES.fibfinder = {
  id: 'fibfinder',
  name: "Fib Finder",
  blurb: "3–10 players · strange true facts with a blank — write fibs, find the truth",
  min: 3,
  max: 10,
  startLabel: "First fact",
  layout: GAMES.crown.layout,
};

GAMES.storychain = {
  id: 'storychain',
  name: "Story Chain",
  blurb: "3–10 players · add a line seeing only the one before — then read the chaos aloud",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Start the stories",
  layout: GAMES.crown.layout,
};

GAMES.rateit = {
  id: 'rateit',
  name: "Rate It",
  blurb: "3–10 players · guess how the hot seat rates things from 1 to 10",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Take the hot seat",
  layout: GAMES.crown.layout,
};

GAMES.topfive = {
  id: 'topfive',
  name: "Top Five",
  blurb: "3–10 players · guess how the hot seat ranks five things",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Take the hot seat",
  layout: GAMES.crown.layout,
};

GAMES.mindmeld = {
  id: 'mindmeld',
  name: "Mind Meld",
  blurb: "2–10 players · pairs try to say the same word at the same time",
  min: 2,
  max: 10,
  noBots: true,
  startLabel: "Pair up",
  layout: GAMES.crown.layout,
};

GAMES.captionit = {
  id: 'captionit',
  name: "Caption It",
  blurb: "3–10 players · a strange picture on the table — write the funniest caption",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Show a picture",
  layout: GAMES.crown.layout,
};

GAMES.fakeartist = {
  id: 'fakeartist',
  name: "Fake Artist",
  blurb: "3–10 players · one line each on a shared drawing — one artist doesn’t know the word",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Hand out the word",
  layout: GAMES.crown.layout,
};

GAMES.copycat = {
  id: 'copycat',
  name: "Copy Cat",
  blurb: "2–10 players · a picture flashes on the table — draw it from memory",
  min: 2,
  max: 10,
  noBots: true,
  startLabel: "Show the picture",
  layout: GAMES.crown.layout,
};

GAMES.codecrack = {
  id: 'codecrack',
  name: "Code Crack",
  blurb: "4–10 players · two teams, secret keywords, coded clues — and interceptions",
  min: 4,
  max: 10,
  noBots: true,
  startLabel: "Deal the keywords",
  layout: GAMES.crown.layout,
};

GAMES.undercover = {
  id: 'undercover',
  name: "Undercover Spy",
  blurb: "3–10 players · everyone knows the location except the spy",
  min: 3,
  max: 10,
  noBots: true,
  startLabel: "Deal the secrets",
  layout: GAMES.crown.layout,
};

GAMES.mafianight = {
  id: 'mafianight',
  name: "Mafia Night",
  blurb: "5–10 players · Mafia, Doctor, Detective — secret roles and night moves on your phone",
  min: 5,
  max: 10,
  startLabel: "Night falls",
  layout: GAMES.crown.layout,
};

GAMES.tugofwar = {
  id: 'tugofwar',
  name: "Tug of War",
  blurb: "2–10 players · two teams tap like mad to drag the rope over the line",
  min: 2,
  max: 10,
  startLabel: "Grab the rope",
  layout: GAMES.crown.layout,
};

GAMES.tapderby = {
  id: 'tapderby',
  name: "Tap Derby",
  blurb: "1–10 players · tap your horse to the finish line on the big screen",
  min: 1,
  max: 10,
  startLabel: "Under starter’s orders",
  layout: GAMES.crown.layout,
};

GAMES.redlight = {
  id: 'redlight',
  name: "Red Light, Green Light",
  blurb: "1–10 players · run on green, freeze on red — or back to the start",
  min: 1,
  max: 10,
  startLabel: "Green light!",
  layout: GAMES.crown.layout,
};

GAMES.musicalchairs = {
  id: 'musicalchairs',
  name: "Musical Chairs",
  blurb: "3–10 players · when the music stops, tap SIT — one chair short",
  min: 3,
  max: 10,
  startLabel: "Start the music",
  layout: GAMES.crown.layout,
};

GAMES.quickdraw = {
  id: 'quickdraw',
  name: "Quick Draw",
  blurb: "2–10 players · wait for DRAW, then tap fastest — too early costs you",
  min: 2,
  max: 10,
  startLabel: "Take ten paces",
  layout: GAMES.crown.layout,
};

GAMES.echo = {
  id: 'echo',
  name: "Echo",
  blurb: "1–10 players · watch the colours on the table, repeat them on your phone",
  min: 1,
  max: 10,
  startLabel: "Watch closely",
  layout: GAMES.crown.layout,
};

GAMES.simonsays = {
  id: 'simonsays',
  name: "Simon Says",
  blurb: "2–10 players · only tap when Simon says so",
  min: 2,
  max: 10,
  startLabel: "Simon says start",
  layout: GAMES.crown.layout,
};

GAMES.memorygrid = {
  id: 'memorygrid',
  name: "Memory Grid",
  blurb: "1–10 players · squares light up on the table — mark them from memory",
  min: 1,
  max: 10,
  startLabel: "Light the grid",
  layout: GAMES.crown.layout,
};

GAMES.whackamole = {
  id: 'whackamole',
  name: "Whack-a-Mole",
  blurb: "1–10 players · moles pop up on the table — whack the hole on your phone",
  min: 1,
  max: 10,
  startLabel: "Moles incoming",
  layout: GAMES.crown.layout,
};

GAMES.counttogether = {
  id: 'counttogether',
  name: "Count Together",
  blurb: "2–10 players · count to the target as a team — never two at once, no talking",
  min: 2,
  max: 10,
  startLabel: "Begin counting",
  layout: GAMES.crown.layout,
};
