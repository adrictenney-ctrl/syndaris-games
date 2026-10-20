// How-to-play rules, part 3 of 3 (see js/rules.js).
const casino = (goal, play, win = 'Everyone starts with the same chip stack. Most chips after the last round wins.') => ({ goal, play: ['Pick a chip size and tap where to bet on your phone. Everyone bets at the same time.', ...play], win });

export const RULES_C = {
  roulette: casino('Bet on where the ball will land.', [
    'Bet on a number (0–36, pays 35:1), or on red/black, odd/even, 1–18/19–36 (1:1), or a dozen (2:1).',
    'The wheel spins on the table and pays every winning bet. Single zero.',
  ]),
  tripledice: casino('Bet on how three dice will land.', [
    'Small (4–10) and Big (11–17) pay 1:1; any triple pays 30:1.',
    'Bet on a single face: it pays 1:1 for each die showing it.',
    'Bet on an exact total: the less likely the total, the bigger the payout.',
  ]),
  luckynumbers: casino('Match your picked numbers to the ten drawn.', [
    'Pick up to 6 numbers from 1 to 40 and stake one bet on your ticket.',
    'The table draws ten numbers.',
    'The more of your numbers come up, the bigger the payout (picking 6 and hitting all 6 pays 800×).',
  ]),
  moneywheel: casino('Bet on the number the big wheel stops on.', [
    'Bet on 1, 2, 5, 10, 20 or the ★.',
    'The wheel spins on the table. Each number pays that many to one; the ★ pays 45:1.',
  ]),
  derbyday: casino('Back the winning horse.', [
    'Six horses race; each has odds that change every race.',
    'Bet on a horse on your phone, then watch the race on the table.',
    'Only the winner pays, at its odds.',
  ]),
  oddoreven: casino('Guess whether two hidden dice add up to odd or even.', [
    'Bet on Odd (Han) or Even (Chō).',
    'The cup lifts on the table. A right guess pays 0.95:1.',
  ]),
  dicepit: casino('Win dice bets on the come-out and the point.', [
    'Pass line (1:1): a first roll of 7 or 11 wins, 2, 3 or 12 loses; any other number is the point, and it wins if it comes again before a 7.',
    'Don’t pass is the opposite (a 12 pushes).',
    'One-roll bets: Field (2, 3, 4, 9, 10, 11, 12; 2 and 12 pay double), Any seven (4:1), Any craps (7:1).',
  ]),
  pegdrop: casino('Drop your ball through the pegs and land on a big payout.', [
    'Stake a bet and drop a ball. It bounces down eight rows of pegs on the table.',
    'Where it lands sets the payout: the edges pay 8×, the middle less than your stake.',
  ]),
  inbetween: casino('Bet that the next card lands between two cards.', [
    'Two cards are turned up on the table.',
    'Bet that the next card is strictly between them. The smaller the gap, the bigger the payout (up to 5:1).',
    'If the two cards are a pair, you can bet on three of a kind (11:1). Next to each other is a push.',
  ]),
  casinowar: casino('Beat the dealer’s card.', [
    'Stake a bet. You and the dealer each get one card.',
    'Higher card wins 1:1. A tie pushes (you get your stake back).',
  ]),
  liftoff: {
    goal: 'Ride the rocket and cash out before it crashes.',
    play: [
      'Stake a bet on your phone, then the rocket takes off and the multiplier climbs on the table.',
      'Tap CASH OUT any time to win your stake times the multiplier shown.',
      'The rocket crashes at a random moment. Anyone still riding loses their stake.',
    ],
    win: 'Most chips after the last round wins.',
  },
  ridethebus: {
    goal: 'Guess card after card, and cash out before you’re wrong.',
    play: [
      'Stake a bet, then guess each new card: red or black (×2), higher or lower than the first (×3), inside or outside the first two (×4), then the suit (×20).',
      'After any right guess you can cash out at that stage’s payout.',
      'One wrong guess and you’re off the bus with nothing.',
    ],
    win: 'Most chips after the last round wins.',
  },
  threecard: {
    goal: 'Beat the dealer’s three-card poker hand.',
    play: [
      'Place an ante. You get three cards on your phone; the dealer gets three on the table.',
      'Play (bet the same again) or fold (lose your ante).',
      'The dealer needs Queen high to qualify. If they don’t, your ante wins and the play bet pushes.',
      'A straight, three of a kind or straight flush earns an ante bonus (1, 4 or 5 to 1), win or lose.',
    ],
    win: 'Beat a qualifying dealer to win both bets. Most chips after the last round wins.',
  },
  islandstud: {
    goal: 'Beat the dealer’s five-card stud hand for big bonus payouts.',
    play: [
      'Place an ante. You get five cards on your phone.',
      'Play (bet double your ante) or fold (lose your ante).',
      'The dealer needs Ace–King or better to qualify. If not, your ante wins and the play bet pushes.',
    ],
    win: 'Beat a qualifying dealer: the play bet pays by your hand, from 1:1 for a pair up to 50:1 for a straight flush. Most chips after the last round wins.',
  },
  omaha: {
    goal: 'Win chips with the best poker hand, using exactly two of your four cards.',
    play: [
      'Everyone gets FOUR private cards on their phone. Blinds and betting rounds work like Texas Hold’em.',
      'Five shared cards come out: the flop, the turn and the river.',
      'Your hand must use exactly two of your four cards plus exactly three from the table.',
    ],
    win: 'The best hand at the showdown takes the pot. The last player with chips wins.',
  },
  lowestunique: {
    goal: 'Pick the lowest number nobody else picks.',
    play: [
      'Everyone secretly picks a number on their phone.',
      'Numbers picked by more than one player don’t count.',
    ],
    win: 'The lowest number that only one player picked scores 1. Most points after 10 rounds wins.',
  },
  splitsteal: {
    goal: 'Share the pot with your partner, or take it all.',
    play: [
      'Each round you’re paired with another player and a pot of points.',
      'Talk it over… then each secretly picks Split or Steal.',
    ],
    win: 'Both split: half each. One steals: they take it all. Both steal: nobody gets anything. Most points after six rounds wins.',
  },
  twothirds: {
    goal: 'Guess two-thirds of everyone’s average guess.',
    play: [
      'Everyone secretly picks a whole number from 0 to 100.',
      'The table works out the average and takes two-thirds of it: that’s the target.',
    ],
    win: 'Closest to the target scores 3. Most points after eight rounds wins.',
  },
  vulturebids: {
    goal: 'Win the best prizes with secret card bids.',
    play: [
      'Everyone has cards 1–15. A prize card (−5 to +10) is turned up.',
      'Everyone secretly plays one card. Cards played by more than one player cancel out.',
      'For a good prize, the highest card nobody else played wins it. For a bad prize, the lowest card nobody else played is stuck with it.',
      'All tied? The prize carries over to the next one.',
    ],
    win: 'When the prizes run out, the highest total wins.',
  },
  treasurerun: {
    goal: 'Bring home the most gems from five trips into the cave.',
    play: [
      'Each step, a card is turned: gems are shared equally among everyone still inside (leftovers stay on the path).',
      'After each card, everyone secretly picks: Go deeper, or Head home.',
      'Heading home banks what you carry, plus a share of the leftovers.',
      'A hazard is safe the first time; if the same hazard appears twice, the cave collapses and everyone inside loses what they carry.',
    ],
    win: 'Most banked gems after five expeditions wins.',
  },
  ticker: {
    goal: 'Be the richest trader after the last day.',
    play: [
      'Everyone starts with 100 cash; four stocks start at 20.',
      'Each day your phone gives you a secret tip about one stock (up, down or flat).',
      'Make one trade a day: buy up to 10 shares of a stock, sell all of one, or hold.',
      'Then the market moves, plus a little push from what people bought and sold.',
    ],
    win: 'Cash plus shares at today’s prices: richest after eight days wins.',
  },
  galaauction: {
    goal: 'Win the best luxuries without ending up the poorest.',
    play: [
      'Everyone has the same money cards. One item at a time is auctioned.',
      'Everyone secretly bids one money card. Highest bid wins the item and spends that card.',
      'The Swan and Fame double your collection. The Scandal is bad: the LOWEST bid is stuck with it, but everyone else pays.',
    ],
    win: 'The player with the least money left can’t win. Of the rest, the most valuable collection wins.',
  },
  threefronts: {
    goal: 'Beat as many opponents as you can on the battlefields.',
    play: [
      'Each round split exactly 10 troops across three fronts: North, Coast and Forest.',
      'Your army is compared with every other player’s: whoever wins more of the three fronts beats them.',
    ],
    win: '1 point for each opponent you beat. Most points after six rounds wins.',
  },
  lemonade: {
    goal: 'Run the most profitable lemonade stand.',
    play: [
      'Each day you see a weather forecast (it’s right most of the time).',
      'Choose how many cups to make ($1 each) and your price ($1–$5).',
      'Customers come by the real weather, prefer cheaper stands, and may skip pricey lemonade.',
    ],
    win: 'Most cash after seven days wins.',
  },
  fishpond: {
    goal: 'Catch the most fish without ruining the pond.',
    play: [
      'Each round everyone secretly takes 0 to 5 fish.',
      'If the total is no more than the pond has, everyone gets what they took and the pond grows back by half.',
      'If everyone together takes too many, the pond is ruined: the fish are shared out and the season ends.',
    ],
    win: 'Most fish when the season ends wins.',
  },
  mysteryboxes: {
    goal: 'Buy boxes worth more than you pay.',
    play: [
      'Three boxes hold hidden coin values. Your phone gives you one secret hint about one box.',
      'Everyone secretly bids on ONE box. The highest bid wins it.',
      'Winners pay their bid and get the box’s value.',
    ],
    win: 'Most coins after six rounds wins.',
  },
  standoff: {
    goal: 'Grab the most loot and survive the standoff.',
    play: [
      'Everyone secretly aims at another player, then chooses BANG (a real bullet, three per game) or click (a bluff).',
      'Everyone reveals at once. A real bullet wounds its target.',
      'The loot is shared out among the players who weren’t hit this round.',
      'Three wounds and you’re out.',
    ],
    win: 'Most loot after eight rounds (or when one player is left) wins.',
  },
  fiveletters: {
    goal: 'Guess the secret five-letter word in as few tries as possible.',
    play: [
      'Everyone guesses the same secret word on their own phone, with six tries.',
      'Green: right letter, right spot. Yellow: in the word, wrong spot. Grey: not in the word.',
    ],
    win: 'Fewer guesses score more, and the first to solve it gets 2 extra. Most points after three words wins.',
  },
  wordgallows: {
    goal: 'Fill in the hidden phrase together, before the gallows is built.',
    play: [
      'Everyone picks a letter at the same time. Each letter scores 1 point for every time it appears.',
      'Letters that aren’t in the phrase add to the gallows.',
      'Think you know it? Solve it: right is a big bonus, wrong is −2.',
    ],
    win: 'Most points after four phrases wins.',
  },
  longword: {
    goal: 'Make the longest word from nine letters.',
    play: [
      'Nine letters appear on the table.',
      'Type the longest real word you can make with them (three letters or more, each letter once).',
    ],
    win: 'Score one point per letter, plus 3 for the longest word of the round. Most points wins.',
  },
  targetnumber: {
    goal: 'Hit the target using six numbers.',
    play: [
      'Six numbers and a target appear on the table.',
      'Type a sum using + − × ÷ and brackets, each number at most once, whole numbers only along the way.',
    ],
    win: 'Exactly right 10, within 5 is 7, within 10 is 5, and +2 for the closest. Most points after four rounds wins.',
  },
  wordchain: {
    goal: 'Be the last player still talking.',
    play: [
      'On your turn, type a word that starts with the last letter of the word before.',
      'Three letters or more, a real word, and no repeats. Be quick!',
      'Miss, repeat or run out of time and you lose a life. Three lives each.',
    ],
    win: 'The last player with lives left wins.',
  },
  ghostletters: {
    goal: 'Don’t be the one who finishes a word.',
    play: [
      'Take turns adding one letter to a growing fragment.',
      'Keep it heading toward a real word, but don’t complete a word of four or more letters.',
      'On your turn you can challenge: if the fragment can still become a word, you lose; if not, the player before you loses.',
      'Losing a round earns a letter of G-H-O-S-T. Too slow also loses.',
    ],
    win: 'Spell GHOST and you’re out. The last player who isn’t a ghost wins.',
  },
  slowreveal: {
    goal: 'Name the hidden picture before anyone else.',
    play: [
      'A picture appears on the table tile by tile.',
      'Type your guess on your phone. A wrong guess freezes you for a moment.',
    ],
    win: 'The first right guess scores more the earlier it comes. Most points after eight pictures wins.',
  },
  acrorace: {
    goal: 'Write the funniest phrase from random letters.',
    play: [
      'A set of letters appears. Write a phrase with one word per letter, in order.',
      'All the phrases go up on the table, without names. Everyone votes for their favourite (not your own).',
    ],
    win: '1 point per vote, with a bonus for the round’s favourite. Most points wins.',
  },
  fibfinder: {
    goal: 'Write fake answers that fool people, and find the truth.',
    play: [
      'A strange but true fact appears, with a blank.',
      'Everyone writes a believable fake answer for the blank.',
      'The real answer and all the fakes are shuffled together; everyone votes for the real one.',
    ],
    win: 'Find the real answer to score; every player your fake fools earns you 1. Most points wins.',
  },
  storychain: {
    goal: 'Write the story the table loves most.',
    play: [
      'Several stories are written at once. On each turn you add a line, seeing only the line before yours.',
      'When the stories are done, the table reads them out.',
      'Everyone votes for the best story.',
    ],
    win: 'Everyone who wrote in a story scores 1 per vote it gets. Most points wins.',
  },
  rateit: {
    goal: 'Guess how the hot seat rates things from 1 to 10.',
    play: [
      'One player is in the hot seat. Something to rate appears (“Pineapple on pizza”).',
      'The hot seat secretly gives their real rating; everyone else guesses it.',
      'Everyone takes the hot seat twice.',
    ],
    win: 'Exactly right 3, one off 2, two off 1; the hot seat gets 1 for each exact guess. Most points wins.',
  },
  topfive: {
    goal: 'Guess how the hot seat ranks five things.',
    play: [
      'One player is in the hot seat. Five things in a topic appear.',
      'The hot seat ranks them, favourite first; everyone else guesses their order.',
    ],
    win: '1 point per thing in the right place; the hot seat gets 1 for each player who got 3 or more. Most points wins.',
  },
  mindmeld: {
    goal: 'Say the same word as your partner at the same time.',
    play: [
      'Players are paired up. Each partner secretly types a word.',
      'If your words don’t match, both words are shown and you try again, aiming for a word that links them.',
      'Keep going until your minds meet (six tries).',
    ],
    win: 'The fewer tries you need, the more points you both score. Most points after three rounds wins.',
  },
  captionit: {
    goal: 'Write the funniest caption for a strange picture.',
    play: [
      'A strange picture appears on the table. Everyone writes a caption on their phone.',
      'The captions go up without names; everyone votes for their favourite (not their own).',
    ],
    win: '1 point per vote. Most points after five pictures wins.',
  },
  fakeartist: {
    goal: 'Catch the fake artist, or fool everyone if it’s you.',
    play: [
      'Everyone’s phone shows the category and secret word, except the fake artist, who sees only the category.',
      'Take turns adding ONE line each to the shared drawing on the table, two laps round.',
      'Then everyone votes for who they think the fake is.',
      'If the fake is caught, they get one guess at the word.',
    ],
    win: 'Fake escapes: +2. Fake caught but guesses the word: +1. Fake caught and wrong: everyone else +1. Most points wins.',
  },
  copycat: {
    goal: 'Draw the picture from memory as closely as you can.',
    play: [
      'A picture flashes on the table. Memorise it!',
      'It disappears; draw it from memory on your phone.',
      'All the drawings go up and everyone votes for the best copy (not their own).',
    ],
    win: '1 point per vote. Most points after four pictures wins.',
  },
  codecrack: {
    goal: 'Pass secret codes to your team without the other team cracking them.',
    play: [
      'Two teams, each with four secret keywords numbered 1–4.',
      'Each round one player per team gets a three-number code (like 3-1-4) and writes one clue per number.',
      'Their team guesses the code from the clues; the other team tries to intercept it (from round 2).',
      'Past clues stay visible, so the other team learns your keywords over time.',
    ],
    win: 'Two interceptions win; two miscommunications (your own team gets it wrong) lose. Otherwise the best record after eight rounds wins.',
  },
  undercover: {
    goal: 'Find the spy, or, as the spy, work out where you are.',
    play: [
      'Everyone’s phone shows the location, except the spy’s.',
      'Take turns asking each other questions out loud. Answer so the spy can’t work it out.',
      'The spy can guess the location at any time.',
      'When time is up, everyone votes on who the spy is.',
    ],
    win: 'Spy caught: everyone else +1. Spy escapes or guesses the location: spy +2. Most points after the rounds wins.',
  },
  mafianight: {
    goal: 'The town finds the Mafia; the Mafia takes over the town.',
    play: [
      'Everyone gets a secret role: Mafia, Doctor, Detective (6+ players) or Villager.',
      'Night: on their phones, the Mafia picks someone to eliminate, the Doctor protects someone, the Detective investigates someone.',
      'Day: the town learns who was eliminated, talks it over and votes someone out (or skips).',
      'No talking from beyond the grave!',
    ],
    win: 'The town wins when every Mafia member is out. The Mafia wins when they equal or outnumber the town.',
  },
  whist: {
    goal: 'Win more than six tricks with your partner.',
    play: [
      'Four players, partners across. All 52 cards are dealt; the dealer’s last card sets trump.',
      'Follow suit if you can. The highest trump wins, or the highest card of the led suit.',
    ],
    win: 'Your team scores 1 point for every trick over six. First team to the target (5) wins.',
  },
  exactly: {
    goal: 'Take exactly the number of tricks you bid.',
    play: [
      'Hands start at 7 cards and change size each hand. A card is turned up for trump.',
      'Everyone bids how many tricks they’ll take. The dealer can’t make the bids add up to the number of tricks.',
      'Follow suit if you can; trump wins.',
    ],
    win: 'Exactly right scores 10 + your bid; anything else scores 0. Highest total after the last hand wins.',
  },
  setback: {
    goal: 'Make your bid of High, Low, Jack and Game points.',
    play: [
      'Six cards each. Bid 2, 3 or 4 (or pass; the dealer must bid if everyone passes).',
      'The high bidder leads, and the first card they play sets trump.',
      'Points: High (highest trump played), Low (lowest trump, to whoever played it), Jack (of trump), Game (most card points).',
    ],
    win: 'Make your bid to score your points; miss it and lose the bid (you’re set back). The other team scores what they take. First team to 11 wins.',
  },
  raven: {
    goal: 'Win the bid, take the nest, and capture the counting cards.',
    play: [
      'Cards 5 to Ace in four suits plus the Raven. Nine cards each; five go in the nest.',
      'Bid in fives from 70, or pass for good. The winner takes the nest, buries five cards and names trump.',
      'The Raven is the highest trump. Counting cards: 5s are 5, 10s and Aces are 10, the Raven is 20.',
    ],
    win: 'The bidding team scores its points if it makes the bid, or loses the bid if not. The other team scores what it takes. First team to 300 wins.',
  },
  missiontricks: {
    goal: 'Work together to complete missions: win the right cards with the right player.',
    play: [
      'All cards are dealt (four coloured suits 1–9 plus four rockets, which are trump). The 4 of rockets leads.',
      'Each mission lists task cards and who must win them. No talking about your cards!',
      'Once per mission you may reveal one coloured card to the team on your turn.',
      'A task card won by the wrong player fails the mission.',
    ],
    win: 'Complete every task to move up a level. Clear all ten levels to win together.',
  },
  schnapsen: {
    goal: 'Reach 66 card points first in each hand.',
    play: [
      'Five cards each from J, Q, K, 10, A; a trump card is turned up. Card points: J 2, Q 3, K 4, 10 10, A 11.',
      'While cards are left to draw, you don’t have to follow suit. After each trick, draw back up to five.',
      'Lead a King or Queen while holding its partner for a marriage: 20, or 40 in trumps.',
      'Once the stock is empty, you must follow suit and beat the card if you can.',
    ],
    win: 'Reach 66 to win the hand: 1 game point, 2 if the loser has under 33, 3 if they took no tricks. First to 7 game points wins.',
  },
  pinochle: {
    goal: 'Win the bid, score meld, and take counters with your partner.',
    play: [
      'A 48-card double deck (9 to Ace). Twelve cards each.',
      'Bid from 250, or pass and you’re out of the bidding. The winner names trump.',
      'Meld (special combinations in your hand) scores first, then play tricks for the counters.',
    ],
    win: 'Make the bid to score meld plus tricks; miss it and lose the bid. First team to 1500 wins.',
  },
  bridge: {
    goal: 'Bid a contract, then make it with your partner (and the dummy).',
    play: [
      'Four players, partners across. Bid a number of tricks over six and a trump suit (or no trump). Each bid must be higher than the last.',
      'You can also pass or double. The highest bid is the contract.',
      'The declarer’s partner’s hand (the dummy) goes face up on the table, and the declarer plays it.',
      'Follow suit if you can.',
    ],
    win: 'Make the contract to score it (overtricks add more); go down and the defenders score. Four deals (Chicago); highest score wins.',
  },
  topdog: {
    goal: 'Get rid of your cards first to become Top Dog.',
    play: [
      'Lead a single card or a set of 2–4 of one rank.',
      'Each player beats it with the same number of cards of a higher rank, or passes. 2s are high.',
      'When everyone passes, the last player to play starts a new pile.',
      'The order you go out sets the ranks for the next round: the Underdog pays tribute (their best cards) to Top Dog.',
    ],
    win: 'Each round you score by the order you go out (first scores most). Most points after five rounds wins.',
  },
  bigdeuce: {
    goal: 'Play out all your cards first.',
    play: [
      'Lead singles, pairs, triples or five-card poker hands. 2s are the highest rank.',
      'Each player beats the pile with the same kind of play, higher, or passes.',
      'When everyone passes, the last player to play leads anything.',
    ],
    win: 'Go out first to win the round; everyone else scores a penalty point per card left (double with 10 or more). Fewest penalty points wins.',
  },
  foolsdefense: {
    goal: 'Get rid of all your cards and don’t be the Fool.',
    play: [
      'A 36-card deck (6 to Ace); a trump suit is set. The attacker plays a card at the defender.',
      'The defender beats it with a higher card of the same suit, or any trump.',
      'Attackers can add cards of ranks already on the table. Can’t beat one? Pick up everything.',
      'Everyone draws back up to six after each attack.',
    ],
    win: 'Players who run out of cards are safe. The last player holding cards is the Fool.',
  },
  thirtyone: {
    goal: 'Get as close to 31 in one suit as you can.',
    play: [
      'Three cards each. On your turn draw from the deck or the discard pile, then discard one.',
      'Count only one suit: Aces 11, pictures 10, others face value.',
      'Knock when you think you’re ahead: everyone else gets one more turn.',
    ],
    win: 'The lowest hand loses a life (a knocker who is lowest loses two). Hit 31 exactly and everyone else loses a life at once. Three lives each; the last player standing wins.',
  },
  tonk: {
    goal: 'Go out, or have the lowest hand when you drop.',
    play: [
      'Five cards each. On your turn draw from the deck or the discard pile.',
      'Spread sets (three of a kind) or runs (three in a suit), hit on spreads, then discard.',
      'Or, before drawing, drop: if you think your hand is lowest, end the round.',
    ],
    win: 'Going out (or dropping with the lowest hand) wins the hand; everyone else scores their cards as penalty points. Lowest total wins.',
  },
  pairs: {
    goal: 'Avoid points: don’t pair your own cards.',
    play: [
      'The deck has one 1, two 2s … ten 10s. On your turn flip a card into your row, or fold.',
      'If it pairs a card already in your row, you take that card’s value in points and the round ends.',
      'Fold to take the lowest card showing on the table instead (and end the round).',
    ],
    win: 'When someone reaches the point limit (fewer points with more players), the fewest points wins.',
  },
  cardgolf: {
    goal: 'Have the lowest score, like golf.',
    play: [
      'Six cards in two rows of three; two of them start face up.',
      'On your turn draw from the deck or the discard pile and swap it into your grid, or throw a deck card away and flip one of yours.',
      'Matching cards in a column score zero.',
      'When someone has all six face up, everyone else gets one more turn.',
    ],
    win: 'Lowest total after four holes wins.',
  },
  cornerkings: {
    goal: 'Play all your cards first.',
    play: [
      'Draw a card to start your turn. Play cards onto the piles: one lower and the opposite colour.',
      'Kings start new piles in the corners.',
      'Move whole piles onto each other when they fit. End your turn when you can’t (or don’t want to) play.',
    ],
    win: 'Go out first to win the round; others score 10 per King and 1 per other card left. When someone reaches 25, or after five rounds, fewest penalty points wins.',
  },
  emojistory: {
    goal: 'Tell a story in emoji, and guess others’ stories.',
    play: [
      'The storyteller gets a secret story and tells it using only emoji on their phone.',
      'Everyone else types what they think the story is.',
      'The storyteller picks the closest guess; everyone else votes for the funniest.',
    ],
    win: 'Closest guess +3 (and the storyteller +2); funny votes score too. Most points wins.',
  },
  fakepitch: {
    goal: 'Pitch the movie everyone wants to watch.',
    play: [
      'Everyone gets a random title, genre and star.',
      'Write a pitch, then read it out loud like a movie trailer.',
      'Everyone votes for the movie they’d watch (not their own).',
    ],
    win: '1 point per vote. Most points wins.',
  },
  hottakes: {
    goal: 'Convince the room of a ridiculous opinion.',
    play: [
      'One player gets a hot take (“Cereal is soup”) and defends it out loud for 30 seconds.',
      'Everyone else votes: were they convinced?',
      'Everyone takes a turn in the hot seat.',
    ],
    win: '2 points for every player you convinced. Most points wins.',
  },
  whosaidthat: {
    goal: 'Guess who wrote each answer, and keep yours a mystery.',
    play: [
      'A question goes up; everyone answers in secret.',
      'One at a time, each answer is shown. Everyone else guesses who wrote it.',
    ],
    win: 'A right guess scores 2; the writer scores 1 for each player who guessed wrong. Most points wins.',
  },
  worstgift: {
    goal: 'Give the hot seat the worst gift they’ll “love”.',
    play: [
      'One player is the hot seat. Everyone else invents the worst possible gift for them.',
      'The hot seat picks their favourite.',
      'Everyone takes a turn in the hot seat.',
    ],
    win: 'The chosen gift scores 3. Most points wins.',
  },
  interrogation: {
    goal: 'Work out whether the suspect is lying about their alibi.',
    play: [
      'One player is the suspect and secretly reads their alibi. Their phone says whether to tell the truth or lie.',
      'Everyone grills them with questions for two minutes.',
      'Then the jury votes: lying or telling the truth?',
    ],
    win: 'A right verdict scores 2; the suspect scores 1 for every juror they fooled. Most points wins.',
  },
  translatethis: {
    goal: 'Rewrite a normal sentence in the funniest style.',
    play: [
      'A plain sentence and a style appear (like a pirate, a toddler or Shakespeare).',
      'Everyone rewrites it in that style.',
      'Everyone votes for the funniest version (not their own).',
    ],
    win: '1 point per vote. Most points wins.',
  },
  drawpartner: {
    goal: 'Draw another player so well the room recognises them.',
    play: [
      'Your phone secretly tells you which player to draw. No peeking, no showing!',
      'Everyone draws at once.',
      'The drawings go up and everyone votes for the best likeness (not their own).',
    ],
    win: '1 point per vote. Most points wins.',
  },
  excuses: {
    goal: 'Write the most believable excuse for a ridiculous situation.',
    play: [
      'A ridiculous situation appears on the table.',
      'Everyone writes the most believable excuse they can.',
      'Everyone votes for the best one (not their own).',
    ],
    win: '1 point per vote. Most points wins.',
  },
  lipreader: {
    goal: 'Read the speaker’s lips.',
    play: [
      'One player mouths a secret phrase with no sound. No pointing, no spelling.',
      'Everyone else types what they think they’re saying.',
      'Everyone takes a turn mouthing.',
    ],
    win: 'A right guess scores 2, and the speaker gets 1 for each player who got it. Most points wins.',
  },
  twowords: {
    goal: 'Invent the best product, band or superhero from two random words.',
    play: [
      'Two random words appear.',
      'Everyone invents something using both words and describes it.',
      'Everyone votes for the best invention (not their own).',
    ],
    win: '1 point per vote. Most points wins.',
  },
  guilty: {
    goal: 'Guess who has done it.',
    play: [
      'An anonymous “Have you ever…?” question appears. Everyone answers yes or no in secret.',
      'The table shows how many said yes, but not who.',
      'Everyone guesses who said yes (up to that many players).',
    ],
    win: '1 point for each right guess. Most points after six questions wins.',
  },
  plottwist: {
    goal: 'Write the best twist ending.',
    play: [
      'The table starts a story.',
      'Everyone writes a twist ending, then reads it out loud, dramatically.',
      'Everyone votes for the best twist (not their own).',
    ],
    win: '1 point per vote. Most points wins.',
  },
};
