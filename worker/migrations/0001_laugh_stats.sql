-- Chef's Kiss Laugh Engine: which pairings win (SPEC.md 5.7, the anonymous upload form).
-- No card text, no names, no player ids: only official card ids and counts.
-- plays = times the Ingredient was played on the Recipe; wins = Chef's Kisses;
-- exp = the wins expected by chance (1 / cards in the round, summed), so table size doesn't skew it.
CREATE TABLE IF NOT EXISTS pairs (recipe TEXT NOT NULL, card TEXT NOT NULL, plays INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, exp REAL NOT NULL DEFAULT 0, PRIMARY KEY (recipe, card));
CREATE TABLE IF NOT EXISTS cards (card TEXT PRIMARY KEY, plays INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, exp REAL NOT NULL DEFAULT 0);
-- One row per judged round, for Al's reviews (hour-rounded time, no identities).
CREATE TABLE IF NOT EXISTS rounds (id INTEGER PRIMARY KEY AUTOINCREMENT, hour INTEGER NOT NULL, level TEXT NOT NULL, recipe TEXT NOT NULL, winner TEXT, played TEXT NOT NULL, seats INTEGER, bots INTEGER, engine TEXT);
