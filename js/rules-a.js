// How-to-play rules, part 1 of 3 (see js/rules.js). Each game: goal, how to play (in order),
// how to win, and a few tips. Plain words, matched to how each game plays on this table.
export const RULES_A = {
  euchre: {
    goal: 'Win tricks with your partner (across the table) and be the first team to 10 points.',
    play: [
      'Uses only the 9s through Aces. Everyone gets five cards and one card is turned up.',
      'Round 1: in turn, tell the dealer to pick up the turned card (that suit becomes trump) or pass.',
      'Round 2: if everyone passed, name any other suit as trump or pass. With "stick the dealer" on, the dealer must name one.',
      'The Jack of trump (right bower) is the highest card, then the other Jack of the same colour (left bower), then A, K, Q, 10, 9 of trump.',
      'Follow the suit that was led if you can. The highest trump wins the trick; with no trump, the highest card of the led suit.',
      'The player who calls trump can choose to go alone, without their partner.',
    ],
    win: 'The calling team scores 1 for 3–4 tricks, 2 for all 5, 4 for all 5 alone. If they take fewer than 3 they are euchred and the other team scores 2. First to the target (10 by default) wins.',
    tips: ['Count trump: there are only seven in each hand.', 'The left bower counts as trump, not as its printed suit.'],
  },
  holdem: {
    goal: 'Win chips by holding the best five-card poker hand, or by making everyone else fold.',
    play: [
      'Everyone gets two private cards on their phone. The two players after the dealer post the small and big blinds.',
      'Betting rounds: before the flop, after the flop (3 shared cards), after the turn (4th card) and after the river (5th card).',
      'On your turn: fold, check, call, bet or raise any amount (no limit), or go all in.',
      'Your best five-card hand uses any mix of your two cards and the five on the table.',
    ],
    win: 'At the showdown the best hand takes the pot (side pots handle all-ins). A player with no chips is out; the last player with chips wins.',
    tips: ['Hands from best to worst: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card.'],
  },
  veto: {
    goal: 'Be the first to play every card in your hand.',
    play: [
      'Everyone gets 7 cards. Match the top card by colour or by number/symbol, or play a Wild.',
      'Can’t play? Draw one card; play it if it fits, otherwise your turn ends.',
      'Skip: the next player misses a turn. Reverse: play changes direction (with two players it works like Skip).',
      'Tax ×2 / Wild Tax ×4: the next player draws 2 or 4 and loses their turn. A Wild Tax can only be played if you have nothing of the current colour.',
      'When you are about to play your second-to-last card, tap Last card! If you forget and someone taps Catch first, you draw 2.',
    ],
    win: 'Empty your hand to win the round. You score everyone else’s leftover cards (numbers face value, action cards 20, wilds 50). Play one round, or first to 200 or 500.',
  },
  chess: {
    goal: 'Checkmate the other king: attack it so it has no safe move.',
    play: [
      'White moves first. Tap a piece, then where it goes, on your phone or on the table.',
      'King one square any way; Queen any distance straight or diagonal; Rook straight; Bishop diagonal; Knight in an L and can jump; Pawn forward one (two on its first move) and captures diagonally.',
      'Special moves: castling, en passant, and promotion when a pawn reaches the far side (you choose the piece).',
      'Add a bot to the other seat to play the computer (Easy, Normal or Hard). Optional clocks: 5, 10 or 15 min + 10 s.',
    ],
    win: 'Checkmate wins. Stalemate, threefold repetition, the 50-move rule and too few pieces are draws. Running out of time loses. You can also resign or offer a draw from your phone.',
  },
  gofish: {
    goal: 'Collect the most books: sets of all four cards of one rank.',
    play: [
      '2–3 players get 7 cards each, 4 or more get 5. The rest is the pond.',
      'On your turn, ask one player for a rank you already hold (“Any sevens?”).',
      'If they have any, they hand over all of them and you go again.',
      'If not, Go fish: draw from the pond. If it’s the rank you asked for, show it and go again; otherwise play passes left.',
      'A complete book of four goes down on the table straight away.',
    ],
    win: 'When all 13 books are made, the player with the most books wins.',
  },
  backgammon: {
    goal: 'Move all fifteen of your checkers round the board, into your home board and off.',
    play: [
      'Roll two dice; move one checker per die, or one checker twice. Doubles are played four times.',
      'You can’t land on a point with two or more of the other colour. Landing on a single one hits it to the bar.',
      'A checker on the bar must come back in before you move anything else.',
      'Once all your checkers are home, bear them off with exact rolls (or a higher roll from your farthest checker).',
      'You must use both dice if you can; if only one can be played, it must be the larger.',
      'Optional doubling cube: double before you roll; the other player takes (and owns the cube) or drops.',
    ],
    win: 'First to bear off every checker wins: 1 point, a gammon 2, a backgammon 3 (times the cube). Play one game or a match to 3, 5 or 7.',
  },
  sketch: {
    goal: 'Guess other players’ drawings fast, and draw so they can guess yours.',
    play: [
      'The drawer picks one of three secret words on their phone and draws it. The drawing appears on the table.',
      'Everyone else types guesses on their own phone as often as they like. Near misses show “so close!”.',
      'Optional hints reveal letters as the clock runs down.',
      'The round ends when time is up or everyone has it; the word and everyone’s answer are shown.',
    ],
    win: 'First right guess scores 3, second 2, then 1 each. The drawer scores 1 per correct guesser (up to 3). Most points after everyone has drawn wins.',
    tips: ['No letters or numbers in your drawing!'],
  },
  chefskiss: {
    goal: 'Make the funniest pairing and win the Chef’s Kiss from the Chef.',
    play: [
      'Each round one player is the Chef and picks one of three Recipe Cards (the prompt).',
      'Everyone else is an Apprentice and gets a fresh hand of 7 Ingredient Cards. Each Apprentice plays exactly one card that pairs best with the Recipe.',
      'The cards are shown without names, in a shuffled order. Read them out and lobby the Chef!',
      'The Chef awards exactly one Chef’s Kiss (1 point). The Chef role then passes to the left.',
      'Card Workshop on your phone: write your own Signature Recipes and Snack cards and bring them to the table.',
    ],
    win: 'First to the target number of Chef’s Kisses (5, 7 or 10) wins, or the most Kisses when the game timer runs out.',
    tips: ['The table picks one deck: Mild, Medium or Hot. With fewer than 4 people, bots fill the seats.'],
  },
  insidejob: {
    goal: 'Work as one crew to crack 3 vaults before 3 alarms go off.',
    play: [
      'Everyone gets two cards, Texas Hold’em style. Nobody may say what they hold!',
      'Each round, take a chip that shows how strong you think your hand is: 100 = the weakest hand at the table, 200 = the next, and so on.',
      'Take chips from the middle or straight from another player, until everyone has one.',
      'Shared cards come out (flop, turn, river) with a new round of chips each time.',
      'At the showdown, hands are revealed from the lowest final chip to the highest.',
    ],
    win: 'If the hands really go weakest to strongest, the vault opens; if not, an alarm sounds. 3 vaults wins, 3 alarms loses.',
  },
  crown: {
    goal: 'Loyalists protect the court; the hidden Conspiracy tries to seize it for the Usurper.',
    play: [
      'Everyone secretly gets a role on their phone. The Conspiracy knows each other (the Usurper may not).',
      'Each round the Regent names a Steward and everyone votes Aye or Nay.',
      'If approved, the Regent draws three edicts, secretly discards one, and the Steward enacts one of the two left.',
      'Dagger edicts give the Regent a power (peek, investigate, banish…). Talk, accuse and bluff!',
    ],
    win: 'Loyalists win with 5 Loyal edicts or by banishing the Usurper. The Conspiracy wins with 6 Dagger edicts, or if the Usurper is approved as Steward once 3 or more Dagger edicts are in force.',
  },
  hollow: {
    goal: 'Good villagers find and execute the Shade; evil keeps it alive.',
    play: [
      'The app is the Storyteller: everyone gets a secret character with a special ability on their phone.',
      'At night, characters wake one by one on their phones to use their abilities. The Shade picks someone to die.',
      'By day the village talks, nominates and votes on the table. The player on the block is executed at dusk.',
      'Some information may be false: poisoned or drunk players can be misled.',
    ],
    win: 'Good wins when the Shade dies. Evil wins when only two players are left alive.',
  },
  blackjack: {
    goal: 'Beat the dealer by getting closer to 21 without going over.',
    play: [
      'Place your bet on your phone. You and the dealer get two cards (one dealer card face down).',
      'Number cards are face value, picture cards 10, Aces 1 or 11.',
      'On your turn: hit, stand, double (one more card, bet doubled), split a pair, or surrender (if turned on).',
      'The dealer then draws to 17 or more.',
    ],
    win: 'Beat the dealer’s total (or the dealer busts) to win your bet. Blackjack (Ace + ten) pays 3:2. Most chips when the table ends wins.',
  },
  baccarat: {
    goal: 'Bet on which hand will be closest to 9.',
    play: [
      'Bet on the Player hand, the Banker hand or a Tie (and optionally a pair) on your phone.',
      'The table deals both hands using fixed drawing rules: you never make a decision after betting.',
      'Cards count: Aces 1, 2–9 face value, tens and pictures 0. Only the last digit of the total counts.',
    ],
    win: 'Player pays 1:1, Banker 0.95:1, Tie 8:1, pairs 11:1. Most chips when the table ends wins.',
  },
  checkers: {
    goal: 'Capture all the other player’s pieces, or leave them with no moves.',
    play: [
      'Pieces move one square diagonally forward on the dark squares. Ebony moves first.',
      'Capture by jumping over an enemy piece into an empty square. Captures are compulsory, and jumps chain.',
      'A piece that reaches the far row is crowned a king and can move backwards too.',
    ],
    win: 'Take every enemy piece or block them so they can’t move. Play one game or a match.',
  },
  yacht: {
    goal: 'Score the most points by filling all 13 boxes on your scorecard.',
    play: [
      'On your turn roll five dice up to three times, keeping any dice you like between rolls.',
      'Then fill one empty box: ones to sixes, three or four of a kind, full house (25), small straight (30), large straight (40), Yacht (50) or chance.',
      'If your roll doesn’t fit anything, you must put a zero somewhere.',
      'Upper section of 63 or more earns a 35 bonus. Extra Yachts score 100 each.',
    ],
    win: 'After 13 rounds, the highest total wins.',
  },
  spoons: {
    goal: 'Get four of a kind, grab a spoon, and don’t be the one left without.',
    play: [
      'Everyone holds four cards on their phone. Cards are passed around the table, everyone playing at once.',
      'Each card that reaches you: keep it (swap one of yours out) or pass it on to the left.',
      'Make four of a kind and grab a spoon on your phone. Once one spoon is gone, everyone can grab!',
      'There is one spoon fewer than players. Whoever misses out takes a letter of S-P-O-O-N.',
    ],
    win: 'Spell SPOON and you’re out. The last player still in wins. Grabbing too early costs you a letter.',
  },
  doubt: {
    goal: 'Be the first to get rid of all your cards, lying as much as you dare.',
    play: [
      'The whole deck is dealt out. The rank in play goes Aces, Twos, Threes … Kings, then Aces again.',
      'On your turn lay 1–4 cards face down and claim they are all the rank that’s up. You may lie!',
      'Anyone can call “I doubt it!” before the clock runs out.',
      'The cards are turned over: if it was a lie, the player who laid them takes the whole pile; if it was true, the doubter does.',
    ],
    win: 'First player to empty their hand (and survive any doubt) wins.',
  },
  cashout: {
    goal: 'Bank the most points by cashing out of the pot before a 7 wipes it out.',
    play: [
      'Each round the pot starts at zero and players take turns rolling two dice.',
      'Rolls 1–3 are safe: a 7 adds 70, anything else adds the total.',
      'From roll 4 on: a 7 ends the round and everyone still in gets nothing. Doubles double the pot.',
      'At any moment, anyone still in can tap Cash Out to bank the pot as it stands and sit out the rest of the round.',
    ],
    win: 'Most banked points after the last round wins.',
  },
  crazy8: {
    goal: 'Be first to empty your hand.',
    play: [
      'Match the top card of the discard pile by suit or by rank.',
      'Eights are wild: play one anytime and name the suit that must follow.',
      'Can’t play? Draw one card (or keep drawing until you can, if that setting is on).',
    ],
    win: 'Go out first to win the hand and score what others hold: eights 50, pictures 10, aces 1, others face value. Play one hand, or to 100 or 200.',
  },
  skyline: {
    goal: 'Build a property empire and be the last player still solvent.',
    play: [
      'Roll two dice and move around the 36-square city.',
      'Buy unowned lots you land on. Land on someone else’s lot and you pay them rent.',
      'Own every lot in a district to build floors (up to four, then a tower), which raises the rent.',
      'Trade with other players, mortgage when short of cash, and avoid Prison.',
    ],
    win: 'The last player who isn’t bankrupt wins, or the richest when the round limit is reached.',
  },
  lowtide: {
    goal: 'End with the lowest score over several rounds.',
    play: [
      'You have twelve face-down cards in a 3×4 grid. Cards run from −2 to 12. Start by turning two up.',
      'On your turn draw from the deck (swap it into your grid, or throw it away and turn a hidden card up), or take the top discard and swap it in.',
      'Three matching face-up cards in a column wash away.',
      'When someone has every card face up, everyone else gets one last turn.',
    ],
    win: 'Add up your grid each round (if the player who ended it isn’t lowest, their score doubles). When someone reaches 100, the lowest total wins.',
  },
  trio: {
    goal: 'Get three of your marks in a row.',
    play: ['Take turns placing your mark (gold rings or ivory diamonds) on the 3×3 board.', 'A row can go across, down or diagonally.', 'Add a bot to play the computer.'],
    win: 'Three in a row wins; a full board with no line is a draw. Play one game or a best-of match.',
  },
  fourup: {
    goal: 'Line up four of your discs.',
    play: ['Take turns dropping a disc into one of the 7 columns; it falls to the lowest empty space.', 'Lines can go across, up or diagonally.'],
    win: 'First to four in a row wins; a full frame is a draw. Play a single game or a match.',
  },
  seedstones: {
    goal: 'Have the most stones in your store at the end.',
    play: [
      'Each player has six pits and a store. Pick up all the stones in one of your pits.',
      'Sow them one by one counter-clockwise into the next pits and your own store (never your opponent’s).',
      'Last stone lands in your store: take another turn.',
      'Last stone lands in an empty pit on your side: capture it and every stone in the pit opposite.',
    ],
    win: 'When one side runs out of stones, the other player stores what’s left. Most stones in store wins.',
  },
  sonar: {
    goal: 'Sink the other player’s whole fleet first.',
    play: [
      'Hide your ships on your 10×10 grid on your phone (shuffle, or place them yourself).',
      'Take turns pinging a square of the other player’s waters: hit or miss.',
      'Hit every square of a ship and it sinks.',
    ],
    win: 'Sink every ship to win. Play a single game or a match.',
  },
  milestones: {
    goal: 'Complete all ten stages before anyone else.',
    play: [
      'Each stage asks for a combination of sets (same number), runs (numbers in a row) or a colour group.',
      'On your turn draw (deck or discard), lay down your stage once you have it, add cards to any laid-down groups, then discard one.',
      'Wilds fill in anywhere; a Skip makes another player miss their turn.',
      'When someone goes out, the round ends. Everyone who laid down moves on to the next stage.',
    ],
    win: 'First to finish stage ten wins (lowest score breaks a tie). Cards left in hand score against you.',
  },
  wrongnumber: {
    goal: 'Send the funniest reply to a text from an unknown number.',
    play: [
      'Each round one player is the Receiver and a strange text arrives on the table.',
      'Everyone else picks a reply from the seven in their hand.',
      'The replies pop up anonymously as bubbles. The Receiver picks a favourite.',
      'Once a game you can get a new phone: swap your whole hand.',
    ],
    win: 'Whoever sent the chosen reply wins the round. First to the target score wins.',
  },
  scribble: {
    goal: 'Keep a word alive through a chain of drawings and guesses.',
    play: [
      'Everyone starts a sketchbook with a secret word.',
      'Books pass around the table: the next player draws the word, the next guesses the drawing, the next draws that guess, and so on. Everyone works at once.',
      'When every book comes home, the table reveals each chain page by page.',
    ],
    win: 'Whoever writes the last guess in a book scores a point if it matches the original word. Points carry over through Play again; whoever leads when the table goes back to the lobby wins.',
  },
  manor: {
    goal: 'Work out who did it, with what, and in which room.',
    play: [
      'One suspect, one weapon and one room are sealed in the envelope. The rest of the cards are dealt out.',
      'On your turn move to a room next door (or take a secret passage between opposite corners).',
      'Suggest a suspect and a weapon in your room. The first player who can disprove it shows you one card privately.',
      'Mark what you learn on your phone’s notebook.',
    ],
    win: 'Make an accusation when you’re sure. Right and you win; wrong and you’re out of the running (but still show cards).',
  },
  warfront: {
    goal: 'Conquer the island world, one territory at a time.',
    play: [
      'Reinforce: get armies for your territories (÷3, at least 3), whole regions and traded-in supply cards.',
      'Attack neighbours with dice: up to 3 attacker dice against up to 2 defender dice. Highest dice are compared; the defender wins ties.',
      'Fortify: make one move of armies between connected territories.',
      'Take at least one territory on your turn to earn a supply card.',
    ],
    win: 'Conquer every territory, or hold the most when the round limit is reached.',
  },
  ironroutes: {
    goal: 'Score the most points by claiming rail routes and finishing your tickets.',
    play: [
      'On your turn do one thing: take two rail cards, claim a route, or draw new destination tickets.',
      'Take cards from the five face-up ones or blind from the deck. A face-up engine (wild) counts as both picks.',
      'Claim a route by playing a set of matching cards as long as the route.',
      'The game ends a round after someone is down to two trains.',
    ],
    win: 'Routes score by length. Finished tickets add their value; unfinished ones subtract it. The longest continuous line earns 10. Highest score wins.',
  },
  homestead: {
    goal: 'Be the first settler to reach 10 points.',
    play: [
      'Roll two dice each turn: every hex with that number pays its resource to the cabins and manors around it.',
      'Spend Timber, Clay, Fleece, Wheat and Stone on roads, cabins (1 point) and manors (2 points).',
      'Trade with other players, the bank (4:1) or harbours (better rates). Buy charters for surprises.',
      'A 7 moves the Bandit, who blocks a hex and steals a card. Anyone holding more than 7 cards discards half.',
    ],
    win: 'First to 10 points (buildings, the longest road, the biggest ranger army, monuments) wins.',
  },
  wordsmith: {
    goal: 'Score the most points by building words on the board.',
    play: [
      'Draw seven letter tiles. On your turn lay a word in a straight line, joined to the words already down (the first word crosses the centre star).',
      'Every new word you make must be real.',
      'Score the letters, with bonus squares under your new tiles. Use all seven tiles at once for +40.',
      'Instead of playing you can swap tiles or pass.',
    ],
    win: 'When the bag is empty and someone plays out, leftover tiles count against their holders. Highest score wins.',
  },
  powerup: {
    goal: 'Checkmate the other king, with pieces that grow stronger as they capture.',
    play: [
      'Normal chess moves, with one twist: a piece that captures absorbs the captured piece.',
      'An absorbed piece lends its moves: a rook that takes a knight can also move like a knight.',
      'Absorbed pieces show in a strip under the piece on top.',
    ],
    win: 'Checkmate wins, just like chess.',
  },
  nestegg: {
    goal: 'Build the most valuable stack of matched sets.',
    play: [
      'Your turn, one of: make a set (two matching cards from your hand, or one that matches the top discard) and put it on your stack;',
      'or challenge: play a card matching another player’s top set (Bullion and Ingots are wild). You go back and forth with matches until someone can’t or won’t; the winner takes the set and every card played. A first set can’t be challenged.',
      'or discard a card. Then fill your hand back up to four.',
    ],
    win: 'When the deck and every hand are empty, the richest stack wins.',
  },
  kaboom: {
    goal: 'Be the last critter standing.',
    play: [
      'On your turn play as many cards as you like, then draw one card from the deck.',
      'Draw a Kaboom! and you’re out, unless you play a Lullaby and tuck it back into the deck wherever you like.',
      'Action cards let you peek, skip, shuffle, make others draw and more.',
      'After any action, everyone gets a few seconds to cancel it with a Nuh-uh! (which can be cancelled too).',
    ],
    win: 'Last player left in the game wins.',
  },
  spires: {
    goal: 'Raise your five-stage spire, or score the most points.',
    play: [
      'On your turn take one card: the face-up top of either deck beside you (shared with a neighbour) or the hidden top of the centre deck.',
      'Materials build your spire: as soon as you hold what the next stage needs, it’s built and the cards are spent.',
      'Banners add to your army. When enough war drums sound, everyone compares banners with each neighbour; the bigger army takes a Victory laurel (3 points).',
      'Science (Gear, Astrolabe, Quill): two alike, or one of each, buys a Boon of your choice. Laurels are points.',
    ],
    win: 'First to finish their spire ends the game; the most points wins.',
  },
  grandprix: {
    goal: 'Race round the circuit and cross the finish line first.',
    play: [
      'Pick a gear (up one, or down; dropping two or more costs wear), roll that gear’s die and move exactly that far.',
      'You may brake to move a few spaces less, using brake points.',
      'Each corner shows how many times you must STOP inside it. Leave short and you burn tyres for every space you overshoot.',
      'Two stops short, or more overshoot than your tyres can take, and you crash out. A space holds three cars.',
    ],
    win: 'First car across the line after the set number of laps wins.',
  },
  redline: {
    goal: 'Win the race while keeping your engine from overheating.',
    play: [
      'Each round everyone picks a gear (1–4) at once and plays that many cards. Changing by two gears costs a Heat card.',
      'Move the total of your speed cards. Stress cards flip extra cards from your deck.',
      'Boost (pay a Heat for one more speed card), slipstream behind other cars, and last place gets Adrenaline.',
      'Corners have speed limits: each point over costs a Heat card from your engine. Can’t pay? Spin out. Low gears cool your engine down.',
    ],
    win: 'First across the line after the final lap wins.',
  },
  gearworks: {
    goal: 'Build the best robot workshop in eight rounds.',
    play: [
      'Each round two Power Surge cards are turned up, then everyone secretly picks one of five actions.',
      'Every action anyone picked happens for everybody, in order: Recycle, Design, Fabricate, Assemble, Upgrade.',
      'Whoever picked an action gets the bigger version of it.',
      'Power Surges add +1 to their action for everyone; each robot you build adds +1 to the action on its badge, for you.',
    ],
    win: 'After eight rounds: robot points + upgrade points + 1 per 3 leftover parts. Most points wins.',
  },
  tessera: {
    goal: 'Have the most of your gems showing at the end.',
    play: [
      'Every tile is 2×2 squares; some squares hold gems in a player’s colour. Edges carry half-shapes.',
      'On your turn play the top or bottom tile of your deck, turned any way, so at least one half-shape meets the same half-shape already down.',
      'Tiles may overlap others, covering whatever is beneath.',
    ],
    win: 'When the tiles run out, the player with the most visible gems wins.',
  },
  passpot: {
    goal: 'Be the last player holding any chips and win the pot.',
    play: [
      'Everyone starts with three chips. On your turn roll one die per chip you have (up to three).',
      'Each die sends one chip: to your left, to your right, into the pot in the middle, or it stays with you.',
      'A player with no chips skips their turn but is still in: chips can come back to them.',
    ],
    win: 'The last player with chips wins the whole pot.',
  },
  luckystreak: {
    goal: 'Push your luck flipping cards and be first past the target.',
    play: [
      'Each round everyone gets one card face up. In turn, Hit (flip another) or Stay (bank what you have).',
      'Flip a number you already have and you bust: nothing this round.',
      'Bonus cards add points (+2 to +10, or ×2). Halt makes a player stop and bank, Triple Dare makes a player flip three, and a Lucky Charm saves you from one bust.',
      'Collect seven different numbers for a Lucky Streak: +15 and the round ends.',
    ],
    win: 'First player past the target score wins.',
  },
  pileup: {
    goal: 'Empty your hand first, or be the last one standing.',
    play: [
      'Match the top card by suit or by number/symbol, or play a wild.',
      'Draw cards stack: answer a +2 with a +2 or bigger to pass the whole pile on. Can’t answer? Take the lot and lose your turn.',
      'Can’t play? Keep drawing until you can.',
      'Hold 25 cards and you’re knocked out.',
    ],
    win: 'First to empty their hand, or the last player not knocked out, wins.',
  },
  dialitin: {
    goal: 'Read your teammate’s mind and turn the dial to the right spot.',
    play: [
      'Each round one player, the Reader, secretly sees where the target sits on a spectrum (like Cold ⟷ Hot).',
      'The Reader gives a one-line clue. Their teammates turn the dial to where they think it points.',
      'The other team then bets whether the target is left or right of the dial.',
    ],
    win: 'Bullseye 4 points, then 3, then 2; a right left/right bet is 1. First team to 10 wins. With 2–3 players, play together for the best score in 7 rounds.',
  },
  fieldagents: {
    goal: 'Find all your team’s agents in the grid of 25 code words first.',
    play: [
      'Each team has a Handler who sees which words are their agents.',
      'The Handler gives a one-word clue and a number (how many words it points to).',
      'The team guesses words one at a time. Hit one of yours and keep going (up to the number + 1).',
      'Hit a bystander or the other team’s agent and your turn ends.',
    ],
    win: 'First team to find all its agents wins. Touch the Double Agent and your team loses at once.',
  },
  bannerraid: {
    goal: 'Capture the enemy Banner.',
    play: [
      'Each side sets up 40 hidden pieces on its four rows of a 10×10 field.',
      'Move one piece one square at a time (Scouts run any distance in a straight line). Lakes in the middle are blocked.',
      'Move onto an enemy piece to attack: both are revealed and the higher rank wins (equal ranks both fall).',
      'Mines blow up attackers except the Sapper. The Assassin beats the Warlord only when it attacks first.',
    ],
    win: 'Capture the Banner to win. A side that can’t move loses.',
  },
};
