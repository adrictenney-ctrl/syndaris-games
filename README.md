# Syndaris Table

In-person card games. One device lies flat in the middle of the table (tablet, laptop, or TV) and shows the
cards everyone plays. Each player's phone holds their private hand. Games: **Euchre** and **Texas Hold'em**.
Pick the game in the table's lobby.

## How it works

- **The table device is the server.** Open `table.html` on it and it hosts the game. Game rules, dealing,
  scoring, and bots all run there (`js/euchre.js`).
- **Phones join by scanning the QR code** on the table. They connect directly to the table over WebRTC
  (PeerJS), with no app install and no accounts. A phone only ever receives its own hand.
- The free PeerJS cloud introduces the devices to each other, so an internet connection is needed to
  connect. After that, game traffic goes device to device.
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

## Adding a game
1. Add its seat layout to `js/games.js`.
2. Write a rules engine (see `js/euchre.js` and `js/poker.js`).
3. Add `js/table-<game>.js`, which draws it on the table, and `js/play-<game>.js`, which draws it on the phone.
4. Register them in `js/table.js` (`MODES`) and `js/play.js` (`UIS`).

## Files
| File | What it does |
|---|---|
| `index.html` | Landing page: be the table / join with phone |
| `table.html`, `js/table.js`, `css/table.css` | The table screen: lobby, seats, networking, game hosting |
| `js/table-euchre.js`, `js/table-poker.js` | Each game's table drawing and hookup |
| `play.html`, `js/play.js`, `css/play.css` | The phone: join, seat picker |
| `js/play-euchre.js`, `js/play-poker.js`, `js/phone-kit.js` | Each game's phone controls, plus shared phone pieces |
| `js/games.js` | Game list and seat layouts, used by both sides |
| `js/euchre.js`, `js/poker.js` | Rules engines, per-player views, bots |
| `js/net.js` | Host/join networking (PeerJS) |
| `js/cards.js`, `css/cards.css` | Card rendering, sound, keep-screen-awake |
| `serve.ps1` | Tiny local web server for LAN play |
