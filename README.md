# Play On Display

In-person card games. One device lies flat in the middle of the table (tablet, laptop, or TV) and shows the
cards everyone plays. Each player's phone holds their private hand. Games: **Euchre**, **Texas Hold'em**, **Veto**, **Go Fish**, **Chess**, **Backgammon** and **Sketch & Guess**, with **Cooking Up Trouble** on the way.
The start page is a catalog of games. Choosing one opens the table for that game, and each game has its own table: green felt for Euchre, navy casino felt for Hold'em, a wooden table for Veto, a pond for Go Fish, an inlaid board on a dark walnut table for Chess, an open backgammon case on cognac leather for Backgammon, a sketchbook on a green cutting mat for Sketch & Guess.

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
- **Drawing:** the drawer draws on their phone, with nine colours, an eraser, three pen sizes, Undo and Clear. The
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
N=19; sed -i -E "s#\?v=[0-9]+#?v=$N#g" js/*.js *.html
```

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

Phones and the table exchange messages through a free public MQTT relay (`broker.emqx.io`, over secure
WebSockets). Messages are encrypted with a key derived from the room code. That stops casual snooping on the
public relay, but anyone who knows the room code could decrypt them. The table device still runs the game; the
relay only forwards messages. Direct device-to-device (WebRTC) links were dropped because many home routers
and cellular networks block them.

## Adding a game
1. Add its seat layout to `js/games.js`.
2. Write a rules engine (see `js/euchre.js` and `js/poker.js`).
3. Add `js/table-<game>.js`, which draws it on the table, and `js/play-<game>.js`, which draws it on the phone.
4. Register them in `js/table.js` (`MODES`) and `js/play.js` (`UIS`).

## Files
| File | What it does |
|---|---|
| `index.html` | Game catalog: pick a game for the table, or join with your phone |
| `table.html`, `js/table.js`, `css/table.css` | The table screen: lobby, seats, networking, game hosting |
| `js/table-euchre.js`, `js/table-poker.js`, `js/table-veto.js`, `js/table-gofish.js`, `js/table-chess.js`, `js/table-backgammon.js`, `js/table-sketch.js` | Each game's table drawing and hookup |
| `play.html`, `js/play.js`, `css/play.css` | The phone: join, seat picker |
| `js/play-euchre.js`, `js/play-poker.js`, `js/play-veto.js`, `js/play-gofish.js`, `js/play-chess.js`, `js/play-backgammon.js`, `js/play-sketch.js`, `js/phone-kit.js` | Each game's phone controls, plus shared phone pieces |
| `js/games.js` | Game list and seat layouts, used by both sides |
| `js/euchre.js`, `js/poker.js`, `js/veto.js`, `js/gofish.js`, `js/chess.js`, `js/backgammon.js` (+ `js/bg-board.js`), `js/sketch.js` (+ `js/sketch-words.js`, `js/sketch-pad.js`) | Rules engines, per-player views, bots |
| `js/net.js` | Host/join networking (MQTT relay) |
| `js/cards.js`, `css/cards.css` | Card rendering, sound, keep-screen-awake |
| `serve.ps1` | Tiny local web server for LAN play |

## Look and feel
The table is designed as a real card room. Everything is either printed on the felt in gold ink (the oval
with the name, the seat outlines, the pot line, the direction ring) or a physical object sitting on it (cards,
chips, the ivory dealer button, paper slips for announcements and scores). A soft pool of lamp light moves to
whoever's turn it is. Type: IM Fell English (names, headings), DM Serif Display (card numerals), Figtree
(small labels).
