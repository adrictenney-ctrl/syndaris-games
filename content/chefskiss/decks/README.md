# Al's finished Chef's Kiss decks go here

Put the deck JSON files from the Drive folder "Chef's Kiss Decks 10-18-26" in this folder:

- `mild_batch1.json` … `mild_batch13.json`: the Mild deck (elementary), level `mild`
- `medium_batch1.json` … `medium_batch11.json`: the Medium deck (middle school), level `medium`
- `spicy_batch1.json` … `spicy_batch11.json`: the **Hot** deck (high school). The file names still say
  "spicy" (older than the 19 Oct 2026 rename); the cards inside are level `hot`.
- `college_batch*.json` (optional): the Spicy college deck, level `spicy`. Never dealt until the 17+ gate exists.

Then run `node tools/build-chefskiss-cards.mjs`. When this folder has deck files, they are the **only**
cards the game deals (the older `content/chefskiss/*.txt` cards are retired). Each card keeps the
permanent id from its file. The build stops if an id repeats, a card's level doesn't match its file,
or a tag isn't in `taxonomy.json`.
