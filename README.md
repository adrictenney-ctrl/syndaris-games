# Play On Display

In-person card games. One device lies flat in the middle of the table (tablet, laptop, or TV) and shows the
cards everyone plays. Each player's phone holds their private hand. Games: **Euchre**, **Texas Hold'em**, **Veto**, **Go Fish**, **Chess**, **Backgammon**, **Sketch & Guess**, **Chef's Kiss Party Game**, **Inside Job**, **Crown & Dagger**, **Hollowmere**, **Blackjack** and **Baccarat**.
The start page is a catalog of games. Choosing one opens the table for that game, and each game has its own table: green felt for Euchre, navy casino felt for Hold'em, a wooden table for Veto, a pond for Go Fish, an inlaid board on a dark walnut table for Chess, an open backgammon case on cognac leather for Backgammon, a sketchbook on a green cutting mat for Sketch & Guess, a deep teal party table with kiss marks and confetti for Chef's Kiss Party Game, a heist blueprint for Inside Job, a royal purple throne room for Crown & Dagger, a lantern-lit village square for Hollowmere, classic green felt for Blackjack, deep red felt for Baccarat.

## How it works

- **The table device is the server.** Open `table.html` on it and it hosts the game. Game rules, dealing,
  scoring, and bots all run there (`js/euchre.js`).
- **Phones join by scanning the QR code** on the table. Messages pass through an internet relay (see Networking)
  with no app install and no accounts. A phone only ever receives its own hand.
- Each seat's name plate, speech bubbles, and played cards are rotated to face the person sitting on that
  side of the table. Use **⟲ Flat / Upright** in the corner to switch to TV mode, where nothing is rotated.
- Empty seats can be filled with bots. If someone's phone dies mid-game, their seat shows "reconnecting…".
  They can rejoin (re-scan and tap their old seat), or you can tap **Let a bot play**.
- Refreshing the table resumes the game. Phones reconnect by themselves.

## Running it

It's a static website, so it only needs to be hosted somewhere every device can reach.

### Option A: free hosting (recommended, works anywhere)
Upload this folder to GitHub Pages, Netlify, or Cloudflare Pages. Open `https://<your-site>/table.html`
on the tablet, then add it to the home screen for full-screen play.

### Option B: from this PC on your Wi-Fi
```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```
It prints an address like `http://192.168.1.20:8090`. Open **that** address (not `localhost`) on the table
device so the QR code points somewhere phones can reach. Allow PowerShell through the Windows firewall
on private networks when Windows asks.

## Euchre rules implemented
24-card deck (9 through A). Partners sit across from each other. Right and left bowers. Order up or pass
in round 1, where the dealer picks up the card and discards. Name trump in round 2. "Stick the dealer" is
on by default and can be switched off in the lobby, in which case a round where everyone passes gets
redealt. Anyone who calls trump can go alone. Scoring: 3–4 tricks = 1 point, all 5 = 2, alone and all 5 = 4,
euchred = 2 points to the defenders. Play to 10 by default (5, 7, and 11 are also available).

## Veto rules
Veto is a shedding game that plays like UNO, but with its own look: four colours (red ●, gold ▲,
teal ■, plum ◆), each with a shape so colour isn't the only cue. The deck has 108 cards. Each colour has one
0, plus two each of 1–9, Skip, Reverse and Tax ×2. There are also 4 Wilds and 4 Wild Tax ×4s.

- Everyone is dealt 7 cards. On your turn, match the colour or the number/symbol, or play a wild.
- If you can't play, draw one card. If it fits you may play it; otherwise play passes.
- A **Tax** card makes the next player pay: they draw 2 (or 4 for a Wild Tax) and lose their turn.
- A Wild Tax can only be played when you hold nothing of the current colour.
- With two players, Reverse works like Skip.
- When you're about to play your second-to-last card, tap **Last card!**. If you forget, anyone can tap
  **Catch** before the next player moves, and you draw 2. Bots will catch you too.

The lobby sets the length: one round, or play to 200 or 500 points. The winner of each round scores everyone's
leftover cards: numbers at face value, action cards 20, wilds 50. You can also let players pass a tax on by playing another Tax card.

The name, colours and card faces are original, so the game stands apart from Mattel's UNO trademark and card
design. The rules themselves are the standard ones.

## Chess
Two players, or one player against the computer (add a bot to the other seat). White sits at the bottom of the
table screen and Black at the top. With the tablet flat, Black's pieces are turned to face Black.

- **Moving:** tap a piece, then its destination. You can do this on your phone (the board is turned to your side)
  or right on the table screen. On the table, a tap moves for whoever's turn it is, unless that's the computer.
- **Full rules:** castling, en passant, promotion (you choose the piece), check, checkmate, stalemate, threefold
  repetition, the 50-move rule, and draws when neither side has enough pieces to checkmate. The move generator is
  checked against the standard "perft" reference counts.
- **Clock (optional):** none, 5 min, 10 min, or 15 min + 10 s per move. Running out of time loses, or draws if
  the other side has nothing left that could checkmate.
- **From the phone:** resign (tap twice), offer a draw, accept or decline a draw.
- **Computer:** Easy, Normal or Hard. Hard searches deeper and is capped at about a second and a half per move,
  so a tablet never freezes for long.

## Backgammon
Two players, or one against the computer. White sits at the bottom, Black at the top. The board is an open
backgammon case: walnut frame, felt field, ivory and oxblood points.

- **Moving:** roll, then tap a checker and tap where it goes. Tap it on your phone (the board is turned to your
  side) or on the table screen. Highlighted points are the only legal choices, and the same checker can move with
  both dice in one tap. **Undo** puts the whole turn back until it's finished.
- **Rules:** hitting and the bar (you must enter before anything else), blocked points, doubles played four
  times, and bearing off with an exact roll or a higher one from the farthest checker. Forced moves: you must use
  both dice if any sequence allows it, and if only one die can be played it must be the larger one. With no legal
  move, the turn passes by itself.
- **Doubling cube (optional):** double before you roll, and the other player takes or drops. After a take, the
  cube belongs to the player who took it. Gammons count double and backgammons triple.
- **Match play:** single game, or first to 3, 5 or 7 points, with the Crawford rule (no doubling in the game right
  after someone reaches match point).
- **Computer:** weighs pip count, safety, made points, primes and hits, and handles the cube.

## Sketch & Guess
A drawing and guessing party game for 3–8 players. (It plays like the classic draw-and-guess games, under its own
name so it stays clear of anyone's trademark.) Everyone takes turns drawing.

- **Picking:** the drawer's phone offers three words (easy, medium and hard, or all from one level, set in the lobby).
  Only the drawer sees them. If they don't pick within 20 seconds, one is picked for them.
- **Drawing:** the drawer draws on their phone, with 19 colours, an eraser, three pen sizes, Undo and Clear. The
  drawing appears on the table's sketch pad as it's drawn. The table also shows the word as blanks and a clock.
- **Guessing:** everyone else types answers on their own phone, as many times as they like. A phone says "so close!"
  for near misses. Small typos, plurals and "a/the" are accepted. The table only marks who got it, not what anyone
  typed, so nobody can copy.
- **Hints (optional):** a letter is revealed halfway through and another at three quarters.
- **End of each turn:** when time runs out or everyone has it, the table shows the word and every player's final
  answer, marked right or wrong with the points earned. The next turn starts after 10 seconds, or tap **Next now**.
- **Scoring:** first correct guess 3 points, second 2, everyone after that 1. The drawer gets 1 point per correct
  guesser, up to 3.
- **Length:** everyone draws 1–4 times. Drawing time is 45–120 seconds.
- The drawer can **pass** a word they can't draw (tap twice). The table has **Skip turn** in case the drawer walks away.
- There are no bots, since a bot can't draw or guess. New players can sit down at any time and start guessing.

## Chef's Kiss Party Game
A party game of funny pairings for 3–8 players, built from the official instructions (29 September 2026). The
kitchen words are a metaphor; it isn't a cooking game. There are two kinds of cards: **Recipe Cards** (burgundy, the
prompt) and **Ingredient Cards** (terracotta orange, the response).

- **Each round** one player is the **Chef**; everyone else is an **Apprentice**. The first Chef is the first player at
  the table, and the Chef moves one seat to the left each round.
- **The Chef** holds three Recipe Cards (dealt face down; touch one to turn it over) and slides one up into the
  selection area. It appears on the table.
- **Apprentices** hold five Ingredient Cards, also face down until touched, and slide up the one that pairs best.
  The table shows face-down cards as they come in.
- **Lobby the Chef:** when everyone has played, the cards are revealed on the table and on the Chef's phone, in a
  random order. There's no timer on the Chef's decision. The Chef **must** award exactly one Chef's Kiss (1 point),
  either on their phone or by tapping a card on the table. Then the table shows who played what.
- **Hands are refilled** after every round, so the Chef always has three Recipe Cards and Apprentices have five
  Ingredient Cards. Hands are dealt for variety (people, things, happenings, places) so nobody gets five of a kind.
- **Swap:** each player may swap out one Ingredient Card per round.
- **Brain Bulb 💡:** every card has one. Touch it to see a short description of the card's title.
- **Three's a Party (Double Vision):** with exactly three players, each Apprentice plays two cards.
- **Bot mode:** computer players can fill seats. They play a random card, and as Chef they pick a random winner.
- **Your own cards:** "✎ My cards" on the phone lets you write, edit, delete and play your own Ingredient Cards.
  They're kept on that phone only, and the game doesn't filter them.
- **Chef's Kisses Forever:** each phone keeps a lifetime count of the Kisses won on it. Winning a game adds a
  bonus Kiss.
- **Moving cards:** cards on the table (and the Recipe Card on your phone) can be dragged, pinched bigger or
  smaller, and twisted with two fingers. With a mouse, scroll to resize and Shift+scroll to rotate. Double-tap puts
  a card back.
- **Ending:** play to 5, 7 or 10 Chef's Kisses, or no target. The game-length timer is 30 minutes, 60 minutes, 2
  hours, or none; when time is up the current round finishes and the most Chef's Kisses wins.
- **Timers:** a Recipe Card timer (off, 5, 10 or 15 s) and an Ingredient Card timer (off, 10, 15, 20 or 30 s). When
  one runs out, a random card is played. The host can change any timer mid-game with **⏱ Timers** on the table,
  which also has "End the game now".
- **Teams:** 2, 3 or 4 colored teams. Players are spread across the teams in seat order (latecomers join the
  smallest team). Everyone still scores individually; team scores are the sum.
- **Decks:** Editions are the **2026 Edition** (default), **Simply Silly** (ages 6–9) and **Easy Peasy** (ages
  10–12). Decade-Decks ('50s, '60s, '70s, '80s, '90s) add Ingredient Cards. Mix any of them in the lobby. All
  official cards are family-friendly.

Not built yet: the Fan-Pacs (their card lists weren't in the instructions), the Super-Duper Pantry, descriptions in
other languages, and the optional on-device AI suggestions. The rules say the game must work without AI, and it does.

## Inside Job
A cooperative heist for 3–6 players, played with Texas Hold'em hands and a standard deck. It plays like the board
game *The Gang*, with its own name and look. Everyone is on the same crew. **Nobody may say what cards they hold.**

- **Each heist:** everyone gets two private cards, then the flop, turn and river come out like in Hold'em. Each of the
  four rounds has its own color of poker chips: white (before the flop), yellow (flop), orange (turn), red (river).
- **Chips:** each round there's one chip per player, marked 100, 200, 300 and so on. 100 means "I think I have the
  weakest hand at the table", and the highest chip means the strongest.
- **Taking chips:** on your phone, tap a chip in the middle, or tap the chip in front of another player to take it
  from them. They then have to take another one. Taking a new chip puts your old one back in the middle.
- **Moving on:** when everyone has a chip, each player taps "I'm happy with my chip". Any chip change makes everyone
  confirm again. The next cards come out when the whole crew is happy.
- **Showdown:** hands are revealed from the lowest red chip to the highest. If each hand is at least as strong as the
  one before it (ties are fine), the vault opens. If not, the alarm goes off.
- **Winning:** crack 3 vaults before 3 alarms go off.
- **Complications and Specialists (optional, on by default):** after a cracked vault, the next heist gets a
  Complication: *Butterfingers*, *Blind River*, *Cold Start* or *Sticky Fingers*. After an alarm, a Specialist joins
  the crew: *the Safecracker*, *the Lookout*, *the Insider* or *the Forger*. The table shows what the current one
  does.
- **Computer players** can fill seats. They judge their hands with a quick simulation, take matching chips, and swap
  chips with each other, but they never take chips from people.

**Chess castling:** tap your king, then tap the rook (or the square two to the side).

## Crown & Dagger
A hidden-role game for 5–10 players, played like *Secret Hitler* but set at a royal court, with its own names and
look. Roles are dealt secretly to phones: most players are **Loyalists**; a few are the **Conspiracy**, and one of them
is the secret **Usurper**. (Conspirators know each other and the Usurper. The Usurper only knows them with 5–6 players.)
Hold your phone's role card to peek at it.

- **Each round** the Regent (rotating clockwise) names a Steward. The last Regent and Steward can't be named (with 5
  players left, only the last Steward). Everyone votes **Aye** or **Nay** on their phone; the votes show on the table
  once all are in.
- **If approved**, the Regent secretly draws three edicts and discards one, and the Steward enacts one of the two left.
  The deck has 6 Loyal and 11 Dagger edicts.
- **If refused**, the failed-council tracker moves up. After three failures the top edict is enacted automatically.
- **Powers** come with Dagger edicts, depending on the number of players: *Read the scrolls* (peek at the next three),
  *Question loyalty* (secretly learn someone's side), *Call a council* (choose the next Regent), *Banish* (remove a
  player).
- **Veto:** after 5 Dagger edicts, the Steward may ask to throw both edicts out. If the Regent agrees, it counts as a
  failed council.
- **Loyalists win** with 5 Loyal edicts or by banishing the Usurper. **The Conspiracy wins** with 6 Dagger edicts, or if
  the Usurper is approved as Steward once 3 Dagger edicts are in force.

## Hollowmere
A social-deduction game for 5–10 players, played like *Blood on the Clocktower* (its "Trouble Brewing" set), with its
own village, characters, names and wording. **The app is the Storyteller**: it deals characters, wakes players at night
on their phones, handles poison and false information, and announces deaths, so everyone gets to play.

- **Characters** (hold your phone's card to peek): 13 Villagers (the Gossip, Archivist, Inspector, Cook, Sensitive,
  Seer, Gravedigger, Guardian, Last Witness, Innocent, Hunter, Knight, Elder), 4 Outcasts (the Servant, Sleepwalker,
  Hermit, Martyr), 4 Henchmen (the Venomist, Informant, Heir, Patron), and the Shade. Tap **Characters** on the table to
  see what each one does.
- **Night:** everyone taps something on their phone (a choice, or "go to sleep"), so nobody can tell who has an
  ability. Information arrives in "What you know" at dawn. Poisoned players and the Sleepwalker get false information.
  The Hermit and the Informant may read as the other side.
- **Day:** talk. Any living player can nominate once a day, and each player can be nominated once. Everyone votes on
  their phone; dead players get one last vote. Enough votes (half the living, rounded up) and more than anyone else
  puts the nominee on the block. Tap **End the day** on the table to execute them, then night falls.
- **Good wins** when the Shade dies. **Evil wins** when only two players are left, or if the Martyr is executed.

## Blackjack
1–7 players against the house; the table is the dealer. Everyone bets from their own chips and plays on their phone.

- **Betting:** tap chips on your phone (5, 25, 100, 500), then **Deal me in**. Your last bet is kept for the next round.
  The cards are dealt when everyone is in, or 20 seconds after the first player is ready (and anyone can tap
  **Deal now** on the table).
- **Playing:** in seat order, **Hit**, **Stand**, **Double** (any two cards, also after a split), **Split** (pairs, up
  to four hands; split Aces get one card each) and **Surrender** (late surrender, optional).
- **The dealer** peeks for blackjack under an Ace or a ten. An Ace up offers **insurance** (pays 2 to 1). The dealer
  stands on all 17s, or hits soft 17 (setting).
- **Pays:** blackjack 3 to 2 (or 6 to 5, setting), wins 1 to 1, ties push.
- **Settings:** starting chips, minimum bet, 1/2/6/8 decks (reshuffled when a quarter of the shoe is left), rebuys.
- **Computer players** play basic strategy.

## Baccarat
1–8 players against the house (punto banco). Bet on the **Player** hand, the **Banker** hand or a **Tie**, and
optionally on a **Player pair** or **Banker pair**. Pick a chip on your phone and tap where to bet.

- The table deals both hands one card at a time by the standard drawing rules (naturals on 8 or 9; the Player draws
  on 0–5; the Banker's draw depends on the Player's third card). Closest to 9 wins.
- **Pays:** Player 1 to 1, Banker 1 to 1 less 5% commission, Tie 8 to 1 (Player and Banker bets push on a tie),
  pairs 11 to 1.
- The table keeps a **bead road** of past results (blue Player, red Banker, green Tie; dots mark pairs).
- 8-deck shoe. Settings: starting chips, minimum bet, pair bets on/off, rebuys.

## Checkers
American checkers (English draughts) on an ebony-and-champagne board, on a bottle-green leather desk.
Ebony (seat 0, the bottom) moves first; Ivory sits across. Men move one square diagonally forward; a man
that reaches the far row is crowned (a gold crown on the piece) and kings move one square in any diagonal
direction. Captures are compulsory, jumps chain, and crowning ends the move. You win by taking every
piece or leaving the other side with no move. Draws: by agreement, the same position three times, or
forty moves each without a capture or a man moving. Moves are written with the standard square numbers
(11-15, 22×15×8). Move from a phone or by tapping the table: pick up a piece and tap where it lands (for a
multiple jump, the square it finishes on). The computer plays Easy, Normal or Hard (alpha-beta search
that keeps looking while captures are forced). Move generation is checked against the published perft
counts (7, 49, 302, 1469, 7361, 36768). Code: `js/checkers.js`, `js/table-checkers.js`,
`js/play-checkers.js`, `css/checkers.css` (all classes use a `dr` prefix; `ck` belongs to Chef's Kiss).

## Yacht Club
The classic five-dice scorecard game (the Yacht / Yahtzee family, under its own name). 1–8 players,
bots welcome. On your turn your phone shows the dice: roll up to three times (tap Roll or shake the
phone), tap dice to keep them, then tap an open box and confirm. Thirteen boxes: Aces to Sixes (bonus 35
at 63), Three and Four of a kind, Full house 25, Small straight 30, Large straight 40, Yacht 50 and
Chance. Each extra Yacht scores a 100 bonus and follows the official joker rules. The table shows a
walnut dice tray (kept dice sit up on the rail) and the shared ivory score card, with the current
player's possible scores pencilled in. Bots choose which dice to keep by simulating every hold, and
average about 230 points. Code: `js/yacht.js`, `js/table-yacht.js`, `js/play-yacht.js`, `css/yacht.css`
(dice use the `ydie` class; `die` belongs to Backgammon).

## Spoons
3–8 players, all playing at once on a dark oak table. Everyone holds four cards. The dealer looks at cards
off the deck; each card you look at, you either keep (tap one of yours to swap it out — yours goes to the
player on your left) or pass it straight on. The last player's passes go to the discard, which is
reshuffled when the deck runs out. Four of a kind? Hit **Grab a spoon** on your phone. The spoons sit in
a ring on the table (one fewer than players) and slide to whoever takes them — once one goes, everyone
can grab. The player left without one takes a letter (S-P-O-O-N); spell it and you're out. Grabbing
before anyone has four of a kind costs a letter. Bots tick every 0.8 s and switch ranks if they stall.
Code: `js/spoons.js`, `js/table-spoons.js`, `js/play-spoons.js`, `css/spoons.css`.

## I Doubt It
Also called Cheat. 3–6 players on plum baize. The whole deck is dealt. On your turn, pick 1–4 cards on
your phone and lay them face down as the rank that's up (Aces, Twos … Kings, round again) — true or not.
Everyone else gets a big **I doubt it!** button with a countdown (4/6/8/10 s, a table setting). If the
claim was a lie the player who laid them picks up the pile; if it was true, the doubter does. The cards
are turned over on the table for everyone to see. First to empty their hand and survive the doubt wins.
Bots tell the truth when they can, bluff with cards that won't be needed soon, and doubt impossible or
suspicious claims. Code: `js/doubt.js`, `js/table-doubt.js`, `js/play-doubt.js`, `css/doubt.css`.

## Cash Out
A push-your-luck dice game with the same rules as BANK! (by ThunderHive Games), under its own name and
look. 2–8 players, 10/15/20 rounds, on a graphite vault table. Each round the pot starts at zero and
players take turns rolling two dice. Rolls 1–3 are safe: a 7 adds 70, anything else adds the total. From
roll 4 on, a 7 ends the round (anyone still in gets nothing), doubles double the pot, anything else adds
the total. Any player still in can **Cash out** on their phone at any moment to bank the pot. Bots bank at
a pot that suits them, adjusted for the scoreboard and the rounds left. Code: `js/cashout.js`,
`js/table-cashout.js`, `js/play-cashout.js`, `css/cashout.css`.

## Crazy Eights
2–8 players on dark teal baize (two decks for 6+). Match the top card by suit or rank; eights are wild —
play one any time and call the next suit on your phone. Can't play? Draw one card and play it or pass
(or turn on "Draw until you can play"). First out scores everyone else's cards: eights 50, pictures 10,
aces 1, the rest face value. Play one hand or to 100/200. The table shows the stock, the discard pile and
the suit in play printed large. Code: `js/crazy8.js`, `js/table-crazy8.js`, `js/play-crazy8.js`,
`css/crazy8.css`.

## Skyline
A property-trading board game with its own city, names, board and pieces (no borrowed names or art), and a
**Prison** rather than a jail. 2–6 players sit at the two ends of the table so the board can fill the
middle. The board is a loop of 36 squares, Payday in the top-left corner, clockwise: eight districts
(Harbor Row, Old Mill, Garden Quarter, Lantern Lane, Museum Mile, The Exchange, Crown Heights, Summit
Park), four metro stations, the Power Grid and Fiber Network, three Fortune squares, the City Levy, Prison,
the Rooftop Garden and Go to Prison. Pieces: Anchor, Crown, Star, Moon, Lily, Knight, Sun, Gem.

Rules: $200 for passing Payday; land on an unowned deed to buy it (no auctions); owning a whole district
doubles bare rent and lets you raise up to four floors and then a tower, built evenly; stations charge
25/50/100/200, utilities 4× or 10× the dice; three doubles in a row, Go to Prison or a Fortune card send
you to Prison (roll doubles, pay $50, or use a pardon; on the third failed roll you pay and move).
Mortgage for half the price, pay off for 55%. If you can't pay, you go into debt: sell floors or
mortgage on your phone, or declare bankruptcy (your deeds go to whoever you owe). Trades: on your turn
offer any mix of deeds and cash to another player; they accept or decline on their phone. Game length:
20/30/45 rounds (richest by net worth wins) or until one is left. Bots buy sensibly, build with spare
cash, get out of Prison early, raise money when in debt, and accept trades that are good for them (they
won't hand you a district cheap); they never start trades. Code: `js/skyline.js`, `js/table-skyline.js`,
`js/play-skyline.js`, `css/skyline.css`.

## Low Tide
The same rules as Skyjo (by Magilano), under its own name, cards and look: a deep-sea table and tide cards
in sea-glass colours (−2/−1 indigo, 0 aqua, 1–4 seafoam, 5–8 sand, 9–12 coral) with a wave-patterned back.
2–8 players. 150 cards (five −2s, ten −1s, fifteen 0s, ten each of 1–12). Everyone has twelve face-down
cards in a 3×4 grid and turns up two to start; the highest pair goes first. On your turn: draw from the
deck (swap it into your grid, or throw it away and turn one hidden card up) or take the top discard (and
swap it in). Three matching face-up cards in a column wash away. When someone has turned up their whole
grid, everyone else gets one last turn; then all cards are shown and scored. If the player who went out
doesn't have the strictly lowest score, their (positive) score is doubled. The game ends when someone
reaches 100 (or 50/150) — lowest total wins. Each grid sits in front of its player on the table, with the
card being weighed up floating beside it; phones show your grid big enough to tap. Code: `js/lowtide.js`,
`js/table-lowtide.js`, `js/play-lowtide.js`, `css/lowtide.css` (size variable `--lw`; `--w` belongs to
Chef's Kiss).

## Tic Tac Toe, Four Up, Seed Stones, Sonar
Two-player games played as a match (best of 1/3/5/7), against a friend or the computer (Easy/Normal/Hard).
Shared match logic is in `js/duel.js`. **Tic Tac Toe**: gold rings vs ivory diamonds on a slate board;
perfect play on Hard. **Four Up** (four in a row): a walnut frame, champagne vs oxblood discs; alpha-beta
search. **Seed Stones** (mancala, Kalah rules): six pits and a store each, capture into an empty pit,
another turn when your last stone lands in your store; 3–6 stones per pit. **Sonar** (the fleet game):
hide five ships on a 10×10 grid on your phone (shuffle or place), then ping the other player's waters;
the table shows both radar screens. Computer: random / hunt-and-target / probability.

## Milestones
2–6 players. Ten stages of sets, runs and colour groups (the Phase 10 rules, with our own cards: four jewel
colours, wilds and skips). Draw, lay down your stage (the phone works out the groups from the cards you
pick), add to anyone's laid-down groups, discard. Skips make someone miss a turn. Code: `js/milestones.js`.

## Wrong Number
3–8 players. A party game of texts from unknown numbers (the New Phone, Who Dis? idea) with every prompt
and reply written for us (`js/wrongnumber-cards.js`, 70 texts, ~175 replies). The Receiver picks the
funniest anonymous reply; first to 3/5/7/10 points. One "new phone" (fresh hand) per player per game.

## Scribble Chain
3–8 players, no bots. Sketchbooks pass round the table: secret word, drawing, guess, drawing… (the
Telestrations idea). Everyone works at once on their phone with a timer; the table then reveals each
book page by page, with Back, Pause and Next so nobody misses a page. With an even number of players everyone
draws their own word first, so nobody guesses their own book at the end. When the clock runs out, whatever is on
the page (drawing or half-typed guess) is handed in. The pen has 19 colours plus an eraser. Code: `js/scribble.js`.

## Midnight Manor
3–6 players. A deduction mystery (the Clue idea) with our own six suspects, six weapons and nine-room
mansion. Move to a neighbouring room (or a corner passage), suggest, and the first player who can
disproves privately on their phone; accuse to win (or be out). Each phone has a notebook that fills in
your own and shown cards. Code: `js/manor.js`.

## Warfront
2–6 players. Territory and dice (the Risk idea) on our own island map: 30 hex territories in six regions
joined by sea lanes. Reinforce (territories ÷ 3, region bonuses, supply-card sets), attack (3 dice v 2),
move in, fortify once. Conquer everything or play to a round limit. Code: `js/warfront.js`.

## Iron Routes
2–5 players. Rail building (the Ticket to Ride idea) on our own country of 22 cities and 55 routes, with
our own eight card colours plus engines. Two cards, claim a route, or draw tickets; routes score 1/2/4/7/10;
tickets add or subtract at the end; longest line +10. Code: `js/ironroutes.js`.

## Homestead
2–4 players. Island settling (the Catan idea) with our own names: Timber, Clay, Fleece, Wheat, Stone;
cabins, manors, roads; the Bandit; Ranger, Monument, Surveyors, Bounty and Embargo charters; Longest Road
and Largest Patrol. Snake setup, 7s and discards, harbours 3:1 / 2:1, bank and player trades. Code:
`js/homestead.js`.

## Wordsmith
2–4 players. A crossword tile game (the Scrabble idea) with our own board layout, letter values, tile
counts and a +40 bonus for all seven tiles. Words are checked against an open-source English word list
loaded by the table (`word-list` on jsDelivr, MIT); if it can't load, every word is accepted. The
computer finds moves with an anchor/cross-check search. Phones: tap a tile, tap a square; Play, Recall,
Shuffle, Swap, Pass, Zoom. Code: `js/wordsmith.js`.

## PowerUp Chess
2 players, or play the computer. Chess where a capture absorbs the piece instead of removing it: the captured
piece (or whole stack) goes under the capturing piece, and the stack belongs to whoever is on top. A stack can
move like any piece inside it (a Bishop that took a Rook moves both ways; a Pawn that took a Knight can jump).
The King stays royal and can gain powers too, but may never move into, slide through or stay in check. Only a
lone pawn promotes (so a pawn capturing onto the last rank just stacks). Castling, en passant, the 50-move rule
and threefold repetition work as in chess. Absorbed powers show in a strip under each stack, with the stack
height. It shares the chess board and phone screens. Code: `js/powerchess.js`.

## Nest Egg
2–6 players. Our own take on pairing up valuables (Piggy Bank, Comic Hoard, Grand Clock, Wine Cellar,
Diamond Ring, Old Master, Sailboat, Roadster, Racehorse, Seaside Villa; Gold Bullion and Silver Ingot are
wild). On your turn: make a set from two matching cards (or one plus the top of the discard), challenge
another player's top set with a matching card (back and forth until someone lets it go; the winner takes
everything played), or discard. Refill to four. Your first set is safe. Richest stack wins.
Code: `js/nestegg.js`.

## Kaboom Critters
2–5 players. Play as many cards as you like, then draw; draw a Kaboom! without a Lullaby and you're out.
Our own cards: Nap (skip), Stampede (next player takes two turns), Crystal Ball (peek at three), Shake Up
(shuffle), Pretty Please (someone gives you a card), Nuh-uh! (cancel anything — after every action there's a
3½-second window), and five critter pairs that steal a random card. Code: `js/kaboom.js`.

## Seven Spires
2–7 players. Take a card from the face-up deck you share with either neighbour, or the hidden centre deck.
Materials build a five-stage spire automatically (Gold is wild); banners and war drums trigger wars between
neighbours; science pairs or sets buy Boons; laurels score, and the Owl lets you peek at the centre deck.
First finished spire ends the game. Code: `js/spires.js`.

## Grand Prix Dice
2–6 players, 1–3 laps of our Monte Vale circuit. Pick a gear (dice 1–2 up to 21–30), roll, brake to shorten
the move if needed. Each corner needs 1–3 stops; one short burns tyres for every space overshot, two short
crashes you out. Tyres, brakes, gearbox and engine wear down. Corners are found from the track drawing
(`js/circuit.js`), so the rules always match the picture. Phones show a ★ suggestion. Code: `js/grandprix.js`.

## Redline
2–6 players on the Redline Ring. Everyone secretly picks a gear and plays that many speed cards at once;
cars move leader-first. Corners have speed limits — every point over costs a Heat card from your engine
(spin out if you can't pay). Heat clogs your hand until you cool down in low gears. Stress cards flip for a
random speed, Boost adds one more, last place gets Adrenaline, and tucking in behind gives a Slipstream.
Code: `js/redline.js`.

## Gearworks
2–5 players, 8 rounds. Everyone secretly picks one of five actions (Recycle, Design, Fabricate, Assemble,
Upgrade); every picked action happens for everybody, with a bonus for whoever picked it. Two Power Surges a
round boost actions for all, and each robot you build boosts its action for you. 40 blueprints, each with a
robot drawn from its number. Code: `js/gearworks.js`.

## Tessera
2–4 players. Play the top or bottom 2×2 tile of your deck, turned any way, so at least one edge half-shape
(circle, square, triangle) completes a shape on the table. Tiles may overlap and hide other players' gems,
but at least one cell must go on empty table. Most gems showing at the end wins. Code: `js/tessera.js`.

## Pass the Pot
3–10 players. Everyone starts with 3 chips (or 4 or 5). Roll one die per chip you hold, up to three: each die
sends a chip left, right or into the pot, or lets you keep it. No chips? You skip your roll but you're still in.
The last player holding chips wins the pot. Our own dice (arrows, a pot, a star). Code: `js/passpot.js`.

## Lucky Streak
2–8 players, first to 200 (or 100/300). Flip cards one at a time: hit or stay. A number you already have busts
you for the round; seven different numbers is a Lucky Streak (+15, round ends). Bonus cards (+2 to +10, ×2)
and action cards: Halt, Triple Dare and Lucky Charm. Code: `js/luckystreak.js`.

## Pile Up
2–8 players. Match the suit (Ember, Tide, Moss, Gilt) or the symbol. Draw cards stack: answer a +2 with a +2 or
bigger or take the whole pile. Can't play? Keep drawing until you can. 25 cards and you're knocked out. Pass,
Turnabout, Clear Out, Encore, Wild +4/+6/+10 and Roulette; a 7 swaps hands, a 0 passes every hand on. 168
cards in our own letterpress style. Code: `js/pileup.js`.

## Dial It In
2–10 players, no bots. A Reader sees where a hidden target sits on a spectrum ("Cold ⟷ Hot") and gives a
clue; their team turns the dial on their phones and locks it in. 4/3/2 points by closeness; the other team
bets left or right for 1. Teams with 4+ (first to 10), co-op with 2–3 (7 rounds). 80 of our own spectrums.
Code: `js/dialitin.js`.

## Field Agents
4–8 players, no bots. Two teams (Brass down the left, Steel down the right), 25 code words from our own list of
400. Each Handler sees the key and gives a one-word clue and a number; teammates guess on their phones. Find
all your agents first; touch the Double Agent and you lose. Code: `js/fieldagents.js`.

## Banner Raid
2 players (or the computer). 40 hidden pieces each on a 10×10 field with two lakes; set up on your phone. The
higher rank wins a fight; the Scout runs, the Sapper clears Mines, the Assassin beats the Warlord when it
attacks. Capture the Banner. Code: `js/bannerraid.js`.

## House Rules and House Rules: Deep Space
2–6 players. Start with draw 1, play 1; New Rule cards change the draw, the plays, hand and keeper limits and
more. Keepers go on the table; the Goal card says which two win. Actions happen once. Two decks of our own:
the Home deck and Deep Space (which adds Creepers). Code: `js/houserules.js`.

## Hard Sell
3–10 players, no bots. One player is the Customer ("a Pirate", "a Retired Astronaut"); everyone else picks two
word cards to make a product ("Bacon" + "Umbrella") and pitches it out loud. The Customer buys one; that
seller scores. Everyone is the Customer once (or twice, or three times). Our own 300 words and 70 customers.
Code: `js/hardsell.js`.

## Words 4 Fun
4–8 players in two teams (Sun and Moon). A 4×4 or 5×5 letter grid; trace words of 3+ touching letters on
your phone and press Enter, with a ding for a word your team found first. After the 10-to-1 countdown and the
buzzer, words both teams found cancel out. Scoring by length (3–4 letters 2, 5 → 3, 6 → 4, 7 → 6, 8+ → 12) or
one point per letter, +2 for finding a word first; timer and target set in the lobby. Code: `js/words4fun.js`.

## Classic card games
Hearts, Spades, War, Old Maid, Rummy, Gin Rummy, Five-Card Draw and Cribbage, with the standard rules and
computer players. Shared pieces: `js/tricks.js` and `js/trickview.js` (trick taking), `js/rummycore.js` (melds).
Stack Up (the Skip-Bo idea), Rack 'Em (Rack-O), Bento Box (Sushi Go), Deal Maker (Monopoly Deal), Road Rally
(Mille Bornes) and Unicorn Chaos (Unstable Unicorns) use our own decks and names.

## Bluffing and hidden roles
Power Grab (the Coup idea), Rebel Cell (The Resistance) and Round Table (Avalon, sharing Rebel Cell's engine
in `js/rebel.js`).

## Board games
Reversi, Go, Code Breaker (Mastermind), Star Jump (Chinese Checkers), Dominoes, Cornerstones (Blokus),
Shape & Shade (Qwirkle) and Line Up 5 (Sequence), all with computer players.

## Dice and roll-and-move
Hot Dice (Farkle), Hog Toss (Pass the Pigs), Bingo, Snakes & Ladders, Sweet Trail (Candy Land), Orchard
(Hi Ho! Cherry-O), Ludo, Pop-Up Race (Trouble), Marble Rush (Aggravation) and Pardon Me! (Sorry!). Ludo,
Pop-Up Race and Marble Rush share `js/racehome.js`.

## Team word games
Don't Say It (the Taboo idea: describe the word without the five forbidden ones; the other team can buzz) and
Pass the Phrase (Catch Phrase: describe, pass it on, don't be holding it when the hidden timer goes off).

## Party games (phones only)
These share one phone screen (`js/play-party.js`, driven by a description each engine puts in its view),
one table frame (`js/table-party.js`) and helpers (`js/party.js`: teams, decks, answer matching that
forgives small typos). Anything typed is sent to the table as a draft, so the clock never hands in a blank.
- **List Off** (the Scattergories idea), 2–10: a letter and 6–12 categories; answers that match someone
  else's score nothing, and the others can vote down anything silly. `js/listoff.js`
- **Word Bluff** (Balderdash/Fibbage), 3–10: write a fake meaning for a real, strange word; vote for the real
  one. 2 points for finding it, 1 for each player your fake fools. `js/wordbluff.js` (+ `wordbluff-words.js`)
- **Quick Three** (5 Second Rule), 2–10: name three things in five seconds, out loud; the others vote
  thumbs up or down. `js/quickthree.js`
- **Top Answers** (Family Feud), 4–10 in two teams: guess the survey answers; three strikes and the other
  team can steal; last round double. Surveys are from our own panel. `js/topanswers.js`
- **Trivia Wheel** (Trivial Pursuit), 1–10: the wheel picks one of six categories; everyone answers at once
  and right answers win that wedge. `js/triviawheel.js`, questions in `js/trivia-bank.js`
- **Answer Board** (Jeopardy), 1–8: pick a clue on your phone; fastest right answer scores it and picks next,
  wrong answers lose half; one Double Down. Same question bank.
- **Spin & Solve** (Wheel of Fortune), 1–6: spin, call consonants, buy vowels (250), solve. Bankrupt and
  Lose a Turn on the wheel. `js/spinsolve.js`
- **Odd One Out** (the Chameleon/Imposter idea), 3–10: everyone but one knows the secret word; one-word clues,
  then vote. `js/oddoneout.js`
- **Most Likely To**, 3–10: vote who's most likely to…; a point for voting with the crowd. `js/mostlikely.js`
- **Two Truths & a Lie**, 3–10: write three statements and mark the lie; everyone guesses each player's.
  `js/twotruths.js`
- **Blurt It** (Outburst), 4–10 in two teams: shout out the ten answers on the card while someone from the
  other team ticks them off. `js/blurtit.js`
- **Act It Out** (charades), 4–10 in two teams. `js/actitout.js`

## Home page
Search box (name, description or kind of game; press / to jump to it, Enter opens the first result) and a ☆
on every tile to star favourites. Starred games come first, and the Favorites chip shows only them. Both are
kept per device.

## Rejoining
During a game the table shows a small QR code above the room code. Anyone who dropped out can scan it; if they
use the same name as before, they go straight back into their seat.

## Card finish
`css/cardart.css` (loaded after the game styles) gives every custom deck the same printed-card finish: paper grain,
a sheen and an inner frame, plus round medallions for picture cards. Card sizes there are in card units (`--cs`),
never percentages.

## Cover art
Every game has its own cover, drawn in `js/covers.js` (one SVG scene per game, 600×400, with the title set
like a box). The home page shows them on the tiles and in the spotlight. A new game needs a cover there too.

## Go Fish rules
2–8 players, standard 52-card deck. With 2–3 players everyone is dealt 7 cards; with 4 or more, 5. The rest
of the deck is the pond.

- On your turn, ask one player for a rank you already hold. If they have any, they hand over all of them and you
  go again.
- If they don't, they say "Go fish!" and you draw one card from the pond. If it's the rank you asked for, you go
  again; otherwise play passes to the left.
- Four of a kind is a book, and it goes face up in front of you right away.
- If your hand runs out, you draw from the pond on your turn. When the pond is empty, you just ask.
- When all 13 books are down, the most books wins. Ties are shared.

**Fishing motion.** The table's corner has a **Fishing motion** switch, which can be flipped any time. With it on,
"Go fish!" asks you to turn your phone sideways and pull it back like a fishing rod to reel the card in, and the
caught card leaps out of the pond on the table. iPhones ask for permission to use motion the first time, and
every phone has a "tap to reel" fallback. With it off, you just tap **Draw from the pond**.

## Texas Hold'em rules implemented
No-limit, 2–8 players. Starting chips (500 to 5,000) and blinds (5/10 up to 50/100) are set in the lobby. The
dealer button rotates, and heads-up blinds follow the standard rules. Minimum raises follow the size of the
last raise. Side pots are handled for any number of all-ins, split pots go to tied hands, and the odd chip goes
to the first winner left of the button. Once everyone left in the hand is all in, the cards are turned face up
and the rest of the board is dealt out. Rebuys can be turned on or off. With rebuys on, a player who runs out
of chips gets a **Rebuy** button on their phone. New players can sit down mid-game and are dealt in on the
next hand. On the phone, tap your hole cards to flip them face down if someone's peeking.

One simplification: an all-in raise that's smaller than a full raise still lets players who already acted
raise again. In casino rules they could only call or fold.

## Publishing an update
The site is hosted on GitHub Pages at https://adrictenney-ctrl.github.io/syndaris-games/ (from the `main`
branch). Every script and stylesheet reference has a `?v=N` tag so phones don't keep an old copy. Before
pushing a change, bump N everywhere:
```bash
N=49; sed -i -E "s#\?v=[0-9]+#?v=$N#g" js/*.js *.html
```

### Cloudflare (playondisplay.com)
`bash deploy-cloudflare.sh` builds the flat site, publishes it straight to the Cloudflare Worker `playondisplay`
(playondisplay.com) with Wrangler, and copies the same files to the Dropbox folder. Needs Node.js and a one-time
`wrangler login`. Settings are in `wrangler.jsonc`.

playondisplay.com is a Cloudflare Pages upload. Run `bash build-cloudflare.sh` to build a flat folder
(`../play-on-display-site`, no sub-folders), then drag all of its files into a new Cloudflare deployment.

## TV app (Google TV, Android TV, Fire TV)
`tv-app/` is a small Android app that shows the site full screen on a TV and works with the TV remote. Use it as
the table: put it on the TV and players join from their phones as usual.

**Install it.** The APK is at **https://adrictenney-ctrl.github.io/syndaris-games/tv.apk**.
- **Fire TV:** install the free **Downloader** app from the Amazon store and type in that address. The first time,
  Fire TV asks you to allow Downloader to install apps.
- **Google TV / Android TV:** install **Downloader** from the Play Store and do the same. Alternatively, send the
  file over with an app like *Send Files to TV*. Allow "install unknown apps" for whichever app opens it.

**The remote:**
- **Arrows** move the gold highlight.
- **OK** presses whatever is highlighted.
- **Back** goes back a screen. During a game, the first Back only warns; the game is saved either way.

TVs start in **Upright** mode. The same remote navigation also works on any TV's built-in browser (or with a
keyboard) at the site address with `?tv=1`. That covers Samsung and LG TVs, which can't install Android apps.

The app loads the live website, so updates to the site reach every TV without reinstalling.

**Building it:** you need Android Studio's Java and the Android SDK. Then run `gradlew.bat assembleRelease` in
`tv-app/`. Release signing reads `tv-app/keystore.properties`, which is not in git. The key itself lives in
`Documents/play-on-display-keys/` and must be backed up: every future version has to be signed with the same key.

## Card size on the table
The table's corner toolbar has a **Card size** slider (0.8× to 1.8×). It scales the cards in the middle of the table
and the face-down hands at each seat, for every card game. Each table device remembers its own setting. Chess hides
it, since the board already fills the screen.

## Networking
Players do **not** need to be on the same Wi-Fi. Any internet connection works, including cellular, so a friend on their phone plan can join the same table.

Phones and the table exchange messages through two free public MQTT relays at once (`broker.emqx.io` and
`broker.hivemq.com`, over secure WebSockets), so the game keeps going if one is slow or down. Messages ask the relay
to confirm delivery, and the table resends everyone's screen every few seconds in case an update is lost. Messages are encrypted with a key derived from the room code. That stops casual snooping on the
public relay, but anyone who knows the room code could decrypt them. The table device still runs the game; the
relay only forwards messages. Direct device-to-device (WebRTC) links were dropped because many home routers
and cellular networks block them.

## Adding a game
1. Add its seat layout to `js/games.js`.
2. Write a rules engine (see `js/euchre.js` and `js/poker.js`).
3. Add `js/table-<game>.js`, which draws it on the table, and `js/play-<game>.js`, which draws it on the phone.
4. Register them in `js/table.js` (`MODES`) and `js/play.js` (`UIS`).
5. Add it to the home page list in `index.html` and give it a cover in `js/covers.js`.

## Files
| File | What it does |
|---|---|
| `index.html` | Game catalog: pick a game for the table, or join with your phone |
| `table.html`, `js/table.js`, `css/table.css` | The table screen: lobby, seats, networking, game hosting |
| `js/table-euchre.js`, `js/table-poker.js`, `js/table-veto.js`, `js/table-gofish.js`, `js/table-chess.js`, `js/table-backgammon.js`, `js/table-sketch.js` | Each game's table drawing and hookup |
| `play.html`, `js/play.js`, `css/play.css` | The phone: join, seat picker |
| `js/play-euchre.js`, `js/play-poker.js`, `js/play-veto.js`, `js/play-gofish.js`, `js/play-chess.js`, `js/play-backgammon.js`, `js/play-sketch.js`, `js/play-chefskiss.js`, `js/play-insidejob.js`, `js/play-crown.js`, `js/play-hollow.js`, `js/play-blackjack.js`, `js/play-baccarat.js`, `js/phone-kit.js` | Each game's phone controls, plus shared phone pieces |
| `js/games.js` | Game list and seat layouts, used by both sides |
| `js/euchre.js`, `js/poker.js`, `js/veto.js`, `js/gofish.js`, `js/chess.js`, `js/backgammon.js` (+ `js/bg-board.js`), `js/sketch.js` (+ `js/sketch-words.js`, `js/sketch-pad.js`), `js/chefskiss.js` (+ `js/chefskiss-cards.js`, `js/ck-face.js`, `js/gesture.js`), `js/insidejob.js`, `js/crown.js`, `js/hollow.js` (+ `js/hollow-chars.js`), `js/blackjack.js`, `js/baccarat.js` (+ `js/casino.js`) | Rules engines, per-player views, bots |
| `js/net.js` | Host/join networking (MQTT relay) |
| `js/cards.js`, `css/cards.css` | Card rendering, sound, keep-screen-awake |
| `serve.ps1` | Tiny local web server for LAN play |

## Look and feel
The table is designed as a real card room. Everything is either printed on the felt in gold ink (the oval
with the name, the seat outlines, the pot line, the direction ring) or a physical object sitting on it (cards,
chips, the ivory dealer button, paper slips for announcements and scores). A soft pool of lamp light moves to
whoever's turn it is. Type: Cormorant Garamond (names, headings), DM Serif Display (card numerals), Manrope
(small labels, set in tracked capitals).

Around the tables, the site is a private members' room: onyx black, champagne gold and fine hairlines, with
deep jewel tones (emerald, sapphire, oxblood, aubergine) only as quiet glows behind each game. The tokens
(`--onyx`, `--champagne`, `--hairline` and friends) live at the top of `css/cards.css`.
