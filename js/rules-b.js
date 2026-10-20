// How-to-play rules, part 2 of 3 (see js/rules.js).
const quiz = (goal, how, extra = []) => ({
  goal,
  play: [how, 'Everyone answers at the same time on their own phone before the clock runs out.', ...extra, 'The table shows the right answer after each question.'],
  win: 'A right answer scores up to 100: the faster you answer, the more you get, and the first right answer earns 25 extra. Most points after the last question wins.',
});

export const RULES_B = {
  houserules: {
    goal: 'Hold what the current Goal card asks for, while the rules keep changing.',
    play: [
      'You start with one rule: draw 1, play 1.',
      'Rule cards change it: draw more, play more, hand limits, keeper limits, bonuses.',
      'Keepers go on the table in front of you. Actions do something once.',
      'A Goal card says which two Keepers win. Play a new Goal and the target moves.',
    ],
    win: 'Whoever has what the current Goal asks for, at any moment, wins.',
  },
  deepspace: {
    goal: 'Hold what the current Goal card asks for, among the stars.',
    play: [
      'Plays like House Rules: start with draw 1, play 1, and let the cards change the rules.',
      'Keepers go in front of you; Goals say which Keepers win; Actions happen once.',
      'Creepers jump onto the table in front of you as soon as they’re drawn. You can’t win while you have one, unless the Goal needs it.',
    ],
    win: 'Whoever has what the current Goal asks for, with no Creeper in the way, wins.',
  },
  hardsell: {
    goal: 'Invent and pitch the products the Customer wants to buy.',
    play: [
      'Each round one player is the Customer and turns over who they are today (“a Pirate”, “a Retired Astronaut”).',
      'Everyone else picks two word cards from their hand to make a product (“Bacon” + “Umbrella”).',
      'Pitch your product out loud to the Customer.',
      'The Customer buys the one they like best.',
    ],
    win: 'The seller keeps the Customer card as a point. Everyone gets a turn as the Customer; most sales wins.',
  },
  words4fun: {
    goal: 'Help your team find more words in the letter grid than the other team.',
    play: [
      'After a 10-second countdown, everyone traces words on their own phone.',
      'Words are three letters or more, each tile touching the last (across, up/down or diagonally), no tile used twice.',
      'When time runs out, any word both teams found is cancelled.',
    ],
    win: 'Every other word scores (longer words score more), with 2 bonus points for whoever found it first. Most points wins.',
  },
  hearts: {
    goal: 'Take as few points as possible.',
    play: [
      'Before each hand pass three cards (left, right, across, then a hand with no passing).',
      'The 2♣ leads the first trick. Follow suit if you can; the highest card of the led suit wins.',
      'Each heart is 1 point; the Queen of Spades is 13. No points on the first trick unless you have nothing else.',
      'Hearts can’t be led until one has been thrown (unless that’s all you have).',
    ],
    win: 'Take all 26 points (“shoot the moon”) and everyone else gets 26 instead. When someone reaches the target, the lowest score wins.',
  },
  spades: {
    goal: 'With your partner, take the number of tricks you bid.',
    play: [
      'Everyone bids how many tricks they’ll take. 0 is Nil: you promise to take none.',
      'Spades are always trump. Follow suit if you can.',
      'Spades can’t be led until one has been played (unless you hold only spades).',
    ],
    win: 'Make your team’s bid: 10 points per trick bid, +1 per extra trick (“bag”); every 10 bags costs 100. Miss it: −10 per trick bid. Nil: +100 or −100. First to the target wins.',
  },
  war: {
    goal: 'Win every card in the deck.',
    play: [
      'The deck is split face down. Both players flip their top card; the higher card takes both (Aces high).',
      'A tie means war: each lays three cards face down and flips a fourth; the winner takes the whole pile.',
    ],
    win: 'Whoever has every card wins, or the most cards when the battle limit is reached.',
  },
  oldmaid: {
    goal: 'Don’t get stuck holding the Old Maid.',
    play: [
      'One queen is taken out, so one queen can never be paired. The rest is dealt out.',
      'Everyone throws away their pairs (two cards of the same rank).',
      'On your turn, take one face-down card from the next player who still has cards; pair it if you can.',
      'Empty your hand and you’re safe.',
    ],
    win: 'Whoever is left holding the Old Maid loses; everyone else wins.',
  },
  rummy: {
    goal: 'Go out first by melding all your cards.',
    play: [
      'Draw a card from the stock or the top of the discard pile.',
      'Lay down melds: sets of three or four of a rank, or runs of three or more in a suit (Ace low).',
      'Add single cards to anyone’s melds on the table, then discard one card.',
      'A card taken from the discard pile can’t be thrown straight back.',
    ],
    win: 'Go out to score what everyone else still holds (Aces 1, pictures 10, others face value). Going out all at once is “Rummy” and scores double.',
  },
  gin: {
    goal: 'Cut your unmatched cards (deadwood) and knock, or go Gin.',
    play: [
      'Ten cards each. Draw from the stock or take the top discard, then discard.',
      'Unmatched cards are deadwood: Aces 1, pictures 10, others face value.',
      'With 10 or less deadwood after discarding you may knock. The other player lays off what they can on your melds.',
      'Knock with no deadwood at all for Gin (+25, no laying off).',
    ],
    win: 'Lower deadwood scores the difference; get undercut and they score the difference +25. First to the target wins (+100 game bonus).',
  },
  drawpoker: {
    goal: 'Win chips with the best five-card hand.',
    play: [
      'Everyone antes and gets five cards on their phone.',
      'A betting round, then throw away up to three cards (four if you keep an Ace) and draw replacements.',
      'A second betting round at double the bet size, then the showdown.',
      'Bets come in fixed steps (10 before the draw, 20 after), at most four bets a round.',
    ],
    win: 'The best hand takes the pot. Players who run out of chips are out; the last one with chips wins.',
  },
  cribbage: {
    goal: 'Be first to peg 121 points.',
    play: [
      'Six cards each; both throw two into the dealer’s crib. A starter card is cut (a Jack gives the dealer 2).',
      'Pegging: take turns laying cards with a running count up to 31. Score 2 for 15 or 31, pairs, runs, and 1 for a go or the last card.',
      'The show: count the non-dealer’s hand, the dealer’s hand, then the crib, each with the starter.',
      'Fifteens 2, pairs 2, runs 1 per card, a flush 4 or 5, and 1 for the Jack of the starter’s suit (“nobs”).',
    ],
    win: 'First to 121 wins.',
  },
  stackup: {
    goal: 'Be first to empty your stock pile.',
    play: [
      'Four shared build piles go up from 1 to 12 (then they clear).',
      'On your turn top up your hand to five, then play as many cards as you can onto the build piles, from your hand, the top of your stock, or your discard piles.',
      'Stars are wild. Empty your hand mid-turn and draw five more.',
      'End your turn by putting one hand card on one of your four discard piles.',
    ],
    win: 'First player to play the last card of their stock pile wins.',
  },
  rackem: {
    goal: 'Get the ten cards in your rack into rising order, lowest at the front.',
    play: [
      'Each turn draw from the deck or take the top discard.',
      'Swap it into any slot of your rack (the old card is discarded), or throw a deck card straight away.',
      'First with a fully rising rack calls it.',
    ],
    win: 'Calling it scores 75. Everyone scores 5 per card in order from the front before the first break. First to 500 wins.',
  },
  bento: {
    goal: 'Pack the best-scoring lunches over three rounds.',
    play: [
      'Everyone picks one card from their hand at the same time, lays it down, and passes the rest to the left.',
      'Keep going until the hands run out. Three rounds.',
      'Spring rolls 5 per pair; onigiri 10 per three; gyoza more the more you have; most lanterns 6 (second 3).',
      'Rice bowls score 1–3, tripled if poured on an earlier soy sauce. Chopsticks let you take two cards in one later turn.',
      'Mochi stays until the end of the game: most mochi +6, fewest −6.',
    ],
    win: 'Most points after three rounds wins.',
  },
  dealmaker: {
    goal: 'Be first to own three complete property sets of different colours.',
    play: [
      'Start with five cards. Each turn draw two (five if your hand is empty) and play up to three.',
      'Put money or action cards in your bank, lay down properties, or play actions: charge rent, steal, swap, collect debts.',
      'Anyone hit by an action can play a Nope! to cancel it, and a Nope! can be Noped back.',
      'When you owe, pay from your bank and properties (no change given). Keep at most seven cards.',
    ],
    win: 'First to three complete sets of different colours wins.',
  },
  roadrally: {
    goal: 'Drive exactly 1000 miles first.',
    play: [
      'Draw one card, then play one (or discard one).',
      'You need a Green Light before mileage counts.',
      'Hit rivals with hazards (Crash, Empty Tank, Flat Tire, Red Light, Speed Limit) and fix your own with the matching remedy.',
      'Four Aces make you immune for the rest of the hand. Play one the moment you’re hit by its hazard (a Counter-Move) for 300 extra and another turn. At most two 200s a hand.',
    ],
    win: 'Score miles + 100 per Ace + 300 per Counter-Move + 400 for finishing (+300 with no 200s, +500 if a rival drove nothing). First to the target total wins.',
  },
  unicorns: {
    goal: 'Build a stable of seven unicorns (six with six players) first.',
    play: [
      'Everyone starts with a Baby Unicorn. Each turn draw a card, then play one card or draw another, and keep seven cards at most.',
      'Unicorns join your stable; Magic cards do one thing; Upgrades help you; Downgrades go in a rival’s stable and hurt them.',
      'When anyone plays a card, anyone holding “Hold Your Horses!” may cancel it, and that can be cancelled too.',
    ],
    win: 'First to the full stable wins.',
  },
  powergrab: {
    goal: 'Be the last player with any influence left.',
    play: [
      'Everyone starts with two secret role cards (your influence) and two coins.',
      'On your turn: Income +1, Foreign Aid +2, Overthrow (pay 7, a rival loses an influence; required at 10+ coins), or claim a role, whether you hold it or not.',
      'Roles: Treasurer takes 3 (and blocks Foreign Aid); Shadow pays 3 to make a rival lose influence (a Duchess blocks it); Pirate steals 2 (a Pirate or Diplomat blocks it); Diplomat draws two roles and keeps the best.',
      'Anyone may call a bluff, on a claim or a block. Caught lying, you lose an influence; if the claim was true, the challenger does (and the claimer swaps that card for a fresh one).',
    ],
    win: 'Lose both role cards and you’re out. The last player standing wins.',
  },
  rebelcell: {
    goal: 'Rebels complete three missions; hidden spies make three fail.',
    play: [
      'Everyone gets a secret side on their phone. Spies know each other.',
      'Each round a leader picks a mission team. Everyone votes to approve it or not.',
      'An approved team secretly plays Success or Sabotage. Loyal players must play Success; spies may sabotage.',
      'One Sabotage fails the mission (two on the 4th mission with 7 or more players).',
    ],
    win: 'Three successful missions: the loyal side wins. Three failed missions, or five rejected teams in a row: the spies win.',
  },
  roundtable: {
    goal: 'Loyal knights complete three quests; hidden traitors make three fail.',
    play: [
      'Plays like Rebel Cell, with characters. The Seer (loyal) knows the spies, except the Black Knight. The Squire knows who might be the Seer.',
      'Spy characters: the Knife, the Witch (looks like the Seer to the Squire), the Black Knight, and the Lone Wolf (doesn’t know the other spies).',
      'Leaders pick teams, everyone votes, and team members secretly play Success or Sabotage. Protect the Seer!',
    ],
    win: 'Three failed missions (or five rejected teams): the spies win. Three successful missions: the Knife gets one guess at the Seer, and the spies win if it’s right.',
  },
  reversi: {
    goal: 'Have the most discs of your colour at the end.',
    play: [
      'Place a disc so it traps a straight line of the other player’s discs between it and one of yours (any direction).',
      'All trapped discs flip to your colour. Dark moves first.',
      'If you can’t trap anything, you pass.',
    ],
    win: 'When neither player can move, the most discs wins. Play one game or a match.',
  },
  go: {
    goal: 'Surround more of the board than your opponent.',
    play: [
      'Black plays first. Place a stone on any empty point (9×9, 13×13 or 19×19 board).',
      'A group with no empty points next to it is captured and removed.',
      'You can’t make a move that leaves your own group with no liberties (unless it captures), or repeat the position from before your opponent’s move (ko).',
      'Pass when you’re done. After two passes in a row, mark any dead stones.',
    ],
    win: 'Score your stones plus the empty points only you surround; White gets komi (extra points). Highest score wins.',
  },
  codebreaker: {
    goal: 'Crack the secret code in as few guesses as you can.',
    play: [
      'One player secretly sets a code of four coloured pegs (colours can repeat); the other has ten tries.',
      'After each guess the answer appears automatically: a gold peg for each right colour in the right place, a silver peg for a right colour in the wrong place.',
      'Then swap roles.',
    ],
    win: 'The code-maker scores one point per guess the breaker needed (+1 if never broken). More points after both rounds wins.',
  },
  starjump: {
    goal: 'Move all ten of your marbles into the point of the star opposite yours.',
    play: [
      'On your turn move one marble: one step to a neighbouring empty hole,',
      'or a chain of jumps over any single marble (anyone’s) into the empty hole right behind it, as many jumps as you like.',
    ],
    win: 'First to fill the opposite point wins.',
  },
  dominoes: {
    goal: 'Go out first and score the pips left in other hands.',
    play: [
      'Two players take seven tiles; three or four take five. The highest double starts.',
      'Match the number at either open end of the line.',
      'Can’t play? Draw from the boneyard until you can (or pass when it’s empty).',
    ],
    win: 'Go out first to score everyone else’s pips; if nobody can move, the lowest hand wins the difference. First to the target wins.',
  },
  cornerstones: {
    goal: 'Place as many of your squares on the board as you can.',
    play: [
      'Each colour has 21 pieces. Your first piece must cover your corner of the board.',
      'Every new piece must touch one of your own pieces corner to corner, and never share a side with your own colour.',
      'It may touch other colours however it likes. Block your rivals!',
    ],
    win: 'When nobody can move, you lose a point per square left; placing every piece is +15 (+20 if the last was the single square). Highest score wins.',
  },
  shapeshade: {
    goal: 'Score the most points by building lines of matching tiles.',
    play: [
      'Hold six tiles. On your turn place one or more tiles in a single straight line, joined to the tiles already down.',
      'Every line must be all one colour (each shape once) or all one shape (each colour once): six at most.',
      'Or swap any of your tiles with the bag instead.',
    ],
    win: 'Score one point per tile in every line you made or added to; a full line of six scores six extra. When the bag is empty, the first to use all their tiles ends the game (+6). Highest score wins.',
  },
  lineup5: {
    goal: 'Make lines of five chips in a row with your team.',
    play: [
      'Every card (except Jacks) appears twice on the 10×10 board; the corners are free for everyone.',
      'Play a card and put a chip on a matching space, then draw.',
      'Two-eyed Jacks go anywhere; one-eyed Jacks remove an opponent’s chip (not one in a finished line).',
    ],
    win: 'With two teams, two lines of five win; with three teams, one line wins.',
  },
  hotdice: {
    goal: 'Be the highest scorer after someone reaches the target.',
    play: [
      'Roll six dice. Set aside at least one scoring die each roll, then roll the rest again or bank your points.',
      'A roll with nothing that scores busts your turn.',
      'Score with all six dice and you get all six back to keep rolling (hot dice).',
      'A 1 is 100, a 5 is 50; three of a kind is 100 × the number (three 1s are 1000); a run 1–6 or three pairs is 1500. You need 500 in one turn to get on the board.',
    ],
    win: 'Reaching the target gives everyone else one last turn; the highest score wins.',
  },
  hogtoss: {
    goal: 'Be first to 100 points by tossing two little pigs.',
    play: [
      'Toss the pigs and score by how they land; keep tossing to build your turn total, then bank it.',
      'Both on the same side: 1. On its back or feet: 5. On its nose: 10. Leaning on an ear: 15. Doubles score more.',
      'Pigs on opposite sides lose the turn’s points. A Pig Pile (touching) wipes out your whole score.',
    ],
    win: 'First to the target (100) wins.',
  },
  bingo: {
    goal: 'Complete the pattern on your card first.',
    play: [
      'Everyone gets a 5×5 card on their phone (B 1–15, I 16–30, N 31–45 with a free centre, G 46–60, O 61–75).',
      'The table calls a ball every few seconds. Daub the number if it’s on your card (or let your phone do it).',
      'The pattern is any line, four corners, or the whole card (set in the lobby).',
    ],
    win: 'Complete the pattern and tap BINGO. A false call sits you out for the next three balls.',
  },
  snakes: {
    goal: 'Race from square 1 to square 100.',
    play: [
      'Roll the die and move.',
      'Land at the foot of a ladder and climb it; land on a snake’s head and slide down its tail.',
      'You need the exact number to land on 100 (or bounce back, if that’s turned on). A six can roll again.',
    ],
    win: 'First to reach square 100 wins.',
  },
  sweettrail: {
    goal: 'Be first to reach the Candy Castle.',
    play: [
      'Draw a card: a colour moves you to the next square of that colour; a double colour to the second one.',
      'A treat card sends you straight to that treat’s square, even backwards!',
      'Land on a Toffee Pit and you’re stuck for a turn. Land exactly on a Sugar Bridge to cross it.',
    ],
    win: 'First to the Candy Castle at the end wins.',
  },
  orchard: {
    goal: 'Pick every piece of fruit off your tree first.',
    play: [
      'Spin the spinner: pick 1, 2, 3 or 4 fruit into your basket.',
      'A Crow or a Puppy makes you put two back on the tree. A Spilled Basket puts them all back.',
    ],
    win: 'First to pick their tree bare wins.',
  },
  ludo: {
    goal: 'Race all four of your pieces home.',
    play: [
      'Roll a six to bring a piece out of your yard onto your start square.',
      'Move a piece the number rolled. A six gives you another roll.',
      'Land on a rival’s piece to send it back to its yard (not on safe squares).',
      'Pieces go round the board, then up your home lane into the middle; you need the exact roll.',
    ],
    win: 'First to get all four pieces home wins.',
  },
  poprace: {
    goal: 'Race all your pegs home.',
    play: [
      'Pop the die. A six brings a peg out of start and gives you another go.',
      'Move a peg the number shown. Land on a rival to send them back to start; there are no safe squares.',
      'Pegs need the exact number to get home.',
    ],
    win: 'First to get every peg home wins.',
  },
  marblerush: {
    goal: 'Race your marbles home, using shortcuts to get there first.',
    play: [
      'Roll to bring marbles out and move them round the track.',
      'Corner shortcuts and the centre hub let you cut across the board.',
      'Land on a rival’s marble to send it back to its start.',
      'Marbles go up your home lane with an exact roll.',
    ],
    win: 'First to get every marble home wins.',
  },
  pardon: {
    goal: 'Get all four pawns from Start, round the board, and into Home.',
    play: [
      'Draw a card instead of rolling: 1 or 2 brings a pawn out of Start (a 2 draws again).',
      '3, 5, 8 and 12 move forward; 4 moves back; 7 can be split between two pawns; 10 is forward 10 or back 1; 11 is forward 11 or swap with a rival.',
      'Pardon Me! takes a pawn from Start and bumps any rival’s pawn back to their Start.',
      'Land on a rival and they go back to Start. Land on the start of a rival’s slide and slide to its end.',
    ],
    win: 'First to get all four pawns Home wins.',
  },
  dontsay: {
    goal: 'Get your team to say the word on the card without using the forbidden words.',
    play: [
      'Two teams (seats alternate round the table). On your team’s turn, one player gives clues.',
      'Don’t say any of the five forbidden words, or any part of them.',
      'Tap Got it for a point, or Skip. The other team can hit Buzz! if you slip, and the card goes to them.',
      'When the timer runs out, the other team goes. Everyone takes turns as clue-giver.',
    ],
    win: 'Most points wins.',
  },
  passphrase: {
    goal: 'Don’t be the team holding the phrase when the buzzer goes.',
    play: [
      'Whoever holds the phrase describes it: no rhyming, no “sounds like”, no saying the word.',
      'As soon as your team guesses it, tap Got it. It jumps to the next player (the other team) with a new phrase.',
      'A hidden timer is ticking all the time!',
    ],
    win: 'When the buzzer goes, the team NOT holding the phrase scores a point. First to the target wins.',
  },
  listoff: {
    goal: 'Fill in the categories with answers nobody else thought of.',
    play: [
      'A letter is rolled and everyone gets the same list of categories.',
      'Before the clock runs out, write one answer per category that starts with that letter.',
      'The table goes through the list: answers that match someone else’s score nothing, and players can vote down anything too silly.',
    ],
    win: '1 point per answer that stands (+1 if every word starts with the letter). Most points after the last round wins.',
  },
  wordbluff: {
    goal: 'Fool others with fake meanings and spot the real one.',
    play: [
      'A real but very strange word appears.',
      'Everyone secretly writes a made-up meaning that sounds believable.',
      'All the meanings, fakes and the real one, are shuffled together and everyone votes for the one they think is real.',
    ],
    win: '2 points for finding the real meaning; 1 point for every player your fake fooled. Most points wins.',
  },
  topanswers: {
    goal: 'Guess the most popular answers to the survey question.',
    play: [
      'Two teams. The team in control types guesses on any of their phones.',
      'Every hit flips that answer on the board; every miss is a strike.',
      'Three strikes and the other team gets ONE guess to steal all the points on the board.',
      'The last round is worth double.',
    ],
    win: 'Find every answer and keep the points. The team with the most points wins.',
  },
  triviawheel: {
    goal: 'Collect a wedge from every category.',
    play: [
      'The table spins a wheel of six categories.',
      'Everyone answers the question on their own phone at the same time.',
      'Get it right to win that category’s wedge, and points (more for being quick).',
    ],
    win: 'First to collect the wedges they need wins. If nobody has after the last spin, the most wedges (then points) wins.',
  },
  answerboard: {
    goal: 'Score the most points answering clues from the board.',
    play: [
      'The board has categories with clues worth 100 to 500.',
      'Whoever has control picks a clue on their phone; then everyone answers at once.',
      'Fastest right answer scores the full value and takes control; other right answers score half; wrong answers lose half.',
      'One clue is a Double Down: only the picker answers, for double.',
    ],
    win: 'When the board is empty, the most points wins.',
  },
  spinsolve: {
    goal: 'Bank the most money by solving the hidden phrases.',
    play: [
      'On your turn spin the wheel and call a consonant. You win the wedge’s value for each time it appears.',
      'Bankrupt loses this round’s money; Lose a Turn passes the wheel.',
      'Buy a vowel for 250, or solve the puzzle to bank your round money.',
      'Miss a letter or a solve and the next player spins.',
    ],
    win: 'Most money banked after the last round wins.',
  },
  oddoneout: {
    goal: 'Find the player who doesn’t know the secret word, or blend in if it’s you.',
    play: [
      'The table shows a topic and 16 words. Everyone’s phone shows the secret word, except the Odd One Out.',
      'Going round the table, everyone types ONE word as a clue: subtle enough not to give it away.',
      'Then everybody votes on who the Odd One is.',
    ],
    win: 'Catch the Odd One and they get one guess at the secret word; if they miss, everyone else scores. If they escape or guess it, the Odd One scores.',
  },
  mostlikely: {
    goal: 'Vote with the crowd.',
    play: [
      '“Who’s most likely to… become famous?” Everyone secretly votes for a player (yourself included).',
      'The votes are revealed and whoever gets the most is crowned.',
    ],
    win: 'You score a point if you voted with the crowd. Most points wins.',
  },
  twotruths: {
    goal: 'Spot other players’ lies, and fool them with yours.',
    play: [
      'Everyone secretly writes three things about themselves: two true, one made up. Mark the lie.',
      'One player at a time, their three statements go up on the table.',
      'Everyone else votes for the one they think is the lie.',
    ],
    win: '1 point for spotting a lie; the writer gets 1 point per player they fooled. Most points wins.',
  },
  bluffdice: {
    goal: 'Be the last player with dice.',
    play: [
      'Everyone rolls five dice in secret; only you see yours, on your phone.',
      'Take turns bidding how many dice of a face there are under ALL the cups (“six 4s”); each bid must be higher than the last.',
      'Or call “Liar!” on the bid before you. Ones are wild.',
      'The cups lift: if the bid was there, the caller loses a die; if not, the bidder does.',
    ],
    win: 'Lose all your dice and you’re out. The last player with dice wins.',
  },
  petals: {
    goal: 'Win two challenges by flipping only Petals.',
    play: [
      'Everyone holds three Petals and one Thorn on their phone.',
      'Each round everyone lays one disc face down; then in turn add another disc or start a challenge (“I can flip 4 Petals”).',
      'Others raise or pass. The highest bidder flips: their own stack first, then the top discs of anyone else’s.',
    ],
    win: 'Flip only Petals to win the challenge; win two challenges to win the game. Hit a Thorn and you lose a disc for good.',
  },
  sealed: {
    goal: 'Be the last player standing, or hold the highest card when the deck runs out.',
    play: [
      'Everyone holds ONE secret card. On your turn draw a second and play one of the two.',
      'Watch: guess someone’s card (right = they’re out). Seer: peek at a hand. Duelist: compare hands, lower is out. Shield: you’re protected.',
      'Herald: someone discards and redraws. Regent: swap hands. The Lady must be played if you hold the Regent or Herald.',
      'Whoever discards the Heir is out.',
    ],
    win: 'The last one in, or the highest card when the deck runs out, wins a seal. First to the seal target wins.',
  },
  insync: {
    goal: 'As a team, play every card in rising order, in silence.',
    play: [
      'Everyone gets numbered cards (1–100) on their phone: one each in level 1, two in level 2, and so on.',
      'With no turns and no talking, play cards onto the table pile in rising order, just by feel.',
      'Play a card while someone still holds a lower one and the team loses a life (those lower cards are thrown away).',
      'Everyone can agree to throw a star: each player discards their lowest card.',
    ],
    win: 'Clear every level to win together. Run out of lives and the game is over.',
  },
  nightlights: {
    goal: 'Build the best fireworks show together.',
    play: [
      'Build five rockets, one per colour, from 1 up to 5.',
      'Your phone shows everyone’s cards except your own!',
      'On your turn: play a card (it must be the next number for its colour, or a fuse burns), discard one (get a hint token back), or spend a hint token to tell a teammate about their cards of one colour or one number.',
    ],
    win: 'Three burnt fuses and the show is over. Score = cards in the rockets; 25 is perfect.',
  },
  nope: {
    goal: 'End with the lowest score.',
    play: [
      'Cards from 3 to 35 are bad: each counts its number against you. One card sits in the middle.',
      'On your turn take it (with any chips on it) or say “Nope!” and put one of your chips on it to pass it on.',
      'You can’t say Nope with no chips. Your chips are secret: only your phone knows how many you have.',
    ],
    win: 'Runs of numbers only count their lowest card, and every chip you keep takes a point off. Lowest score wins.',
  },
  bullpen: {
    goal: 'Collect the fewest bull heads.',
    play: [
      'Four rows sit on the table. Everyone secretly picks a card on their phone at the same time.',
      'The cards are placed from lowest to highest, each on the row whose last card is the closest below it.',
      'Lay the SIXTH card in a row and you take the five before it.',
      'Play a card lower than every row and you choose a row to take.',
    ],
    win: 'When someone reaches the bull limit, the fewest bull heads wins.',
  },
  openhouse: {
    goal: 'Buy properties cheaply, then sell them for big cheques.',
    play: [
      'Buying: a row of properties goes up. Bid coins in turn; when you pass, take the cheapest property left and get half your bid back. The last bidder pays in full for the best one.',
      'Selling: a row of cheques goes up, and everyone secretly picks a property on their phone at the same time.',
      'The best property gets the biggest cheque, and so on down.',
    ],
    win: 'Cheques plus leftover coins: most money wins.',
  },
  bugbluff: {
    goal: 'Don’t collect four of the same bug.',
    play: [
      'On your turn, slide a card face down to another player and say what it is (“This is a spider”), true or not.',
      'They either call it (“It IS a spider” / “It’s NOT a spider”), or peek and pass it on to someone who hasn’t seen it, with their own claim.',
      'Call it right and the one who passed it takes it face up; call it wrong and you take it.',
    ],
    win: 'Four of the same bug face up in front of you and you lose.',
  },
  snapmatch: {
    goal: 'Win the most cards by spotting matches first.',
    play: [
      'Any two cards share exactly ONE picture. Your card is on your phone; the middle card is on the table.',
      'Spot the shared picture and tap it on your phone first to win the middle card (it becomes your new card).',
      'Tap a wrong picture and you’re frozen for two seconds.',
    ],
    win: 'When the pile runs out, whoever won the most cards wins.',
  },
  whoswho: {
    goal: 'Guess your opponent’s secret person first.',
    play: [
      'Your phone shows your secret person and your board of 24 faces.',
      'Take turns asking yes/no questions (“Glasses?”, “Red hair?”). The answer comes automatically.',
      'Faces it rules out flip down on your board.',
    ],
    win: 'Guess right and you win; guess wrong and you lose.',
  },
  throwdown: {
    goal: 'Win the rock-paper-scissors tournament.',
    play: [
      'The table draws the bracket. Every match in a round plays at once.',
      'Pick your throw secretly on your phone; both throws flip on the table together.',
      'Rock beats scissors, scissors beat paper, paper beats rock.',
    ],
    win: 'First to two wins takes the match and moves on. Last one standing is the champion.',
  },
  oneclue: {
    goal: 'As a team, help the guesser get as many of the 13 words as you can.',
    play: [
      'One player is the guesser and looks away from the phones.',
      'Everyone else sees the secret word and writes ONE word as a clue.',
      'Clues go up on the table, but any clue that someone else also wrote is crossed out first. Be original!',
      'The guesser has one try. Passing costs nothing.',
    ],
    win: 'Each right guess scores. A wrong guess also costs the next card. How many of the 13 can you get?',
  },
  samebrain: {
    goal: 'Think like the herd: give the answer everyone else gives.',
    play: [
      'A question goes up (“Name a pizza topping”) and everyone types an answer in secret.',
      'Matching answers are grouped. If one answer is the most popular on its own, everyone who gave it scores a point.',
      'The lone player with an answer nobody else gave gets the Odd Sock.',
    ],
    win: 'First to the target score wins, but you can’t win while you’re holding the Odd Sock.',
  },
  closecall: {
    goal: 'Guess close, and bet on whoever guessed best.',
    play: [
      'Each question has a number for an answer (“How many keys on a piano?”). Everyone writes a guess.',
      'The guesses go up in order, each with payout odds (outside guesses pay more).',
      'Everyone bets on the guess they think is closest WITHOUT going over.',
    ],
    win: 'Your guess wins: +3. Your bet wins: + the odds. Most points after the last question wins.',
  },
  doodlebluff: {
    goal: 'Fool others with fake titles and find the real prompt.',
    play: [
      'Everyone gets a strange secret prompt (“a nervous cactus”) and draws it on their phone.',
      'One at a time, each drawing goes up on the table. Everyone else writes a title that might fool people.',
      'Then everyone votes on which title is the real one.',
    ],
    win: 'Find the real prompt: +2 (and the artist gets +1 for each of you). Fool someone with your fake: +1 per vote. Most points wins.',
  },
  dreamcards: {
    goal: 'Give clues that some, but not all, players can match.',
    play: [
      'Each player holds six dreamlike picture cards on their phone.',
      'The storyteller picks one and types a clue: a word, a phrase, anything.',
      'Everyone else picks the card from their hand that best fits the clue.',
      'All the cards are shuffled onto the table and everyone votes for the storyteller’s card.',
    ],
    win: 'If everyone or nobody finds it, the storyteller scores 0 and the others 2. Otherwise the storyteller and each finder score 3. You also score 1 per vote your card fooled. Most points wins.',
  },
  knowme: {
    goal: 'Show how well you know each other.',
    play: [
      'One player is in the hot seat. A question about them goes up with four answers.',
      'They secretly pick their real answer while everyone else guesses what they picked.',
      'Everyone takes the hot seat twice.',
    ],
    win: '+1 for every right guess, and the hot seat gets +1 for each friend who knew them. Most points wins.',
  },
  thisorthat: {
    goal: 'Predict what most of the room will choose.',
    play: [
      'An impossible choice goes up on the table (“Fly or be invisible?”).',
      'Everyone secretly picks their own answer, then predicts which side MOST of the room picked.',
      'The vote is revealed as a tug of war.',
    ],
    win: '+1 if you predicted the majority (a tie means everyone’s right). Most points wins.',
  },
  faceoff: {
    goal: 'Write the funniest answers and win the votes.',
    play: [
      'Everyone gets two silly prompts on their phone and writes the funniest answers they can.',
      'Each prompt went to exactly two players, so answers go head to head on the table.',
      'Everyone else votes for the one they like best, without knowing who wrote what.',
      'The final round is one prompt for everybody.',
    ],
    win: '100 points per vote (200 in round two), +250 for a clean sweep. Most points wins.',
  },
  flagfrenzy: quiz('Name the country from its flag.', 'A flag appears on the big screen; tap the right country.'),
  capitalquest: quiz('Name the capital city of each country.', 'A country appears; tap its capital city.'),
  trueorfalse: quiz('Decide whether each surprising fact is true or false.', 'A fact appears on the table; tap True or False.'),
  emojiphrase: quiz('Decode the emoji puzzle.', 'A row of emoji appears on the table; type the phrase or thing it spells out.', ['Small typos are forgiven.']),
  numbercrunch: quiz('Solve mental maths sums fastest.', 'A sum appears on the big screen; pick the right answer.'),
  whichismore: quiz('Pick which of two things is bigger, faster, older…', 'Two choices appear; tap the one that’s more.'),
  missingvowels: quiz('Work out the word with its vowels taken out.', 'A country, a capital or a thing appears with no vowels; type the whole word.', ['Small typos are forgiven.']),
  wordscramble: quiz('Unscramble the letters.', 'Scrambled letters appear on the table; type the word.', ['Small typos are forgiven.']),
  riddleme: quiz('Solve classic riddles.', 'A riddle appears on the table; type your answer.', ['You get a bit longer for riddles.']),
  doesntbelong: quiz('Find the odd one out.', 'Four things appear; tap the one that doesn’t belong.', ['The reason is shown afterwards.']),
  wildfacts: quiz('Answer animal trivia.', 'An animal question appears; tap the right answer.'),
  finishthesaying: quiz('Complete the proverb.', 'The start of a saying appears; tap how it ends.'),
  continentquest: quiz('Name the continent each country is in.', 'A country appears; tap its continent.'),
  colorclash: quiz('Tap the colour of the ink, not the word.', 'A colour word appears written in a different colour; tap the INK colour.', ['Only 6 seconds each, so be quick!']),
  countit: {
    goal: 'Count the pictures flashed on the table.',
    play: [
      'A crowd of pictures flashes on the table for a few seconds, then disappears.',
      'Type how many of one picture there were.',
    ],
    win: 'Closest guess scores 100, next closest 60, then 30; exactly right earns 50 extra. Most points after the last round wins.',
  },
  lastonestanding: {
    goal: 'Be the last player still answering trivia correctly.',
    play: [
      'A trivia question appears; everyone answers on their own phone at the same time.',
      'One wrong (or missing) answer and you’re out.',
    ],
    win: 'The last player left wins (ties go to the highest score).',
  },
  buzzin: {
    goal: 'Be the first to answer trivia correctly.',
    play: [
      'A trivia question appears; everyone answers on their own phone.',
      'Only the first right answer scores (100). Every wrong answer loses 50.',
    ],
    win: 'Most points after the last question wins.',
  },
  whatyear: {
    goal: 'Guess the year of famous events.',
    play: ['A famous event appears on the table.', 'Type the year you think it happened.'],
    win: 'Closest guess scores 100, next closest 60, then 30; the exact year earns 50 extra. Most points after the last question wins.',
  },
  nextinline: quiz('Work out what comes next in each number pattern.', 'A pattern like “2, 4, 6, 8, ?” appears; type the next number.'),
  opposites: quiz('Pick the word with the opposite meaning.', 'A word appears; tap its opposite.'),
  cluecrack: quiz('Solve crossword clues.', 'A clue and the answer’s blanks appear; type the answer.', ['Small typos are forgiven.']),
  sortitout: quiz('Put four things in the right order.', 'Four things appear (events, planets…); tap them in order on your phone, earliest first.'),
  flashmemory: quiz('Remember what flashed on the table.', 'A row of pictures flashes on the table, then disappears; tap the one that was NOT there.'),
};
