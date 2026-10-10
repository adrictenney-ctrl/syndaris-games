// Game packs: the whole library, grouped into themed collections for the home page.
// A game not listed here falls into a pack by its kind (see KIND_PACK), so new games still land somewhere.
export const PACKS = [
  { id: 'classic', name: 'Classic Cards', emoji: '🃏', color: '#7a2a2a', blurb: 'The card games everyone grew up with — shed your hand, match, slap and race.',
    games: ['veto', 'crazy8', 'gofish', 'war', 'oldmaid', 'rummy', 'gin', 'cribbage', 'spoons', 'doubt', 'slapstack', 'speed', 'pairs', 'thirtyone', 'tonk', 'cardgolf', 'cornerkings', 'topdog', 'bigdeuce', 'foolsdefense', 'rackem'] },
  { id: 'tricks', name: 'Trick Takers', emoji: '♠️', color: '#1f3a6a', blurb: 'Bid, follow suit and take tricks — solo or with a partner across the table.',
    games: ['euchre', 'hearts', 'spades', 'whist', 'bridge', 'pinochle', 'setback', 'exactly', 'raven', 'schnapsen', 'missiontricks'] },
  { id: 'casino', name: 'Casino Night', emoji: '🎰', color: '#1e5a32', blurb: 'Poker, blackjack, roulette and the whole casino floor — chips on your phone.',
    games: ['holdem', 'omaha', 'drawpoker', 'blackjack', 'baccarat', 'roulette', 'tripledice', 'luckynumbers', 'moneywheel', 'derbyday', 'oddoreven', 'dicepit', 'pegdrop', 'inbetween', 'casinowar', 'liftoff', 'ridethebus', 'threecard', 'islandstud'] },
  { id: 'board', name: 'Board Game Classics', emoji: '♟️', color: '#5a3a1e', blurb: 'Chess, checkers, backgammon and family race games on the big screen.',
    games: ['chess', 'powerup', 'checkers', 'backgammon', 'go', 'reversi', 'fourup', 'trio', 'seedstones', 'dominoes', 'lineup5', 'shapeshade', 'cornerstones', 'starjump', 'codebreaker', 'sonar', 'whoswho', 'snakes', 'ludo', 'poprace', 'marblerush', 'pardon', 'orchard', 'sweettrail', 'bingo'] },
  { id: 'dice', name: 'Dice Den', emoji: '🎲', color: '#6a1e24', blurb: 'Roll, keep, bank or bluff — dice games for every crowd.',
    games: ['yacht', 'hotdice', 'hogtoss', 'passpot', 'cashout', 'bluffdice'] },
  { id: 'strategy', name: 'Strategy Night', emoji: '🏰', color: '#2a3a5a', blurb: 'Bigger games to sink an evening into — build, race, trade and outplan.',
    games: ['homestead', 'warfront', 'ironroutes', 'skyline', 'lowtide', 'tessera', 'gearworks', 'spires', 'redline', 'grandprix', 'milestones', 'bannerraid', 'nestegg', 'houserules', 'deepspace', 'pileup', 'luckystreak', 'unicorns', 'roadrally', 'dealmaker', 'bento', 'stackup'] },
  { id: 'quiz', name: 'Quiz Show', emoji: '🧠', color: '#3a2a6a', blurb: 'Buzz in from your phone — trivia, flags, riddles and quick-fire rounds.',
    games: ['triviawheel', 'topanswers', 'answerboard', 'spinsolve', 'flagfrenzy', 'capitalquest', 'trueorfalse', 'emojiphrase', 'numbercrunch', 'whichismore', 'missingvowels', 'wordscramble', 'riddleme', 'doesntbelong', 'wildfacts', 'finishthesaying', 'continentquest', 'colorclash', 'countit', 'lastonestanding', 'buzzin', 'whatyear', 'nextinline', 'opposites', 'cluecrack', 'sortitout', 'flashmemory'] },
  { id: 'words', name: 'Word Play', emoji: '🔤', color: '#2c2a5a', blurb: 'Spell, guess, chain and bluff with words.',
    games: ['wordsmith', 'words4fun', 'fiveletters', 'wordgallows', 'longword', 'targetnumber', 'speedtypist', 'wordchain', 'ghostletters', 'slowreveal', 'acrorace', 'fibfinder', 'wordbluff', 'passphrase', 'dontsay', 'listoff'] },
  { id: 'party', name: 'Party Pack', emoji: '🎉', color: '#6a2a5a', blurb: 'Draw, caption, vote and get to know each other — the big group crowd-pleasers.',
    games: ['sketch', 'scribble', 'doodlebluff', 'captionit', 'dreamcards', 'chefskiss', 'copycat', 'storychain', 'wrongnumber', 'faceoff', 'thisorthat', 'knowme', 'mostlikely', 'twotruths', 'oddoneout', 'rateit', 'topfive', 'mindmeld', 'samebrain', 'oneclue', 'throwdown', 'closecall', 'dialitin', 'fieldagents', 'hardsell', 'petals', 'kaboom', 'insync'] },
  { id: 'mind', name: 'Mind Games', emoji: '🤔', color: '#4a3a0c', blurb: 'Secret bids, bluffs and outguessing your friends.',
    games: ['lowestunique', 'splitsteal', 'twothirds', 'vulturebids', 'treasurerun', 'ticker', 'galaauction', 'threefronts', 'lemonade', 'fishpond', 'mysteryboxes', 'standoff', 'bugbluff', 'openhouse', 'bullpen', 'nope', 'nightlights', 'sealed'] },
  { id: 'roles', name: 'Hidden Roles', emoji: '🕵️', color: '#3a1428', blurb: 'Secret identities on your phone — find the traitor before it’s too late.',
    games: ['crown', 'hollow', 'manor', 'insidejob', 'roundtable', 'rebelcell', 'powergrab', 'mafianight', 'undercover', 'codecrack', 'fakeartist'] },
  { id: 'action', name: 'Action Arcade', emoji: '⚡', color: '#1e4a6a', blurb: 'Fast fingers: tap, race, react and remember.',
    games: ['tugofwar', 'tapderby', 'redlight', 'musicalchairs', 'quickdraw', 'echo', 'simonsays', 'memorygrid', 'whackamole', 'counttogether', 'snapmatch'] },
];
const KIND_PACK = { cards: 'classic', casino: 'casino', board: 'board', dice: 'dice', party: 'party', quiz: 'quiz', word: 'words', action: 'action', roles: 'roles' };
const BY_GAME = {};
for (const P of PACKS) for (const id of P.games) BY_GAME[id] = P.id;
export const packOf = (id, kind) => BY_GAME[id] || KIND_PACK[kind] || 'party';
export const PACK = Object.fromEntries(PACKS.map(P => [P.id, P]));
