Chef's Kiss deck update, 18 Nov 2026 (pass 3 + Crew tag-review fixes, evening version)

decks/   Load these. Six release decks (100 Recipes + 400 Ingredients each):
         mild_base, mild_expansion1, medium_base, medium_expansion1, hot_base, hot_expansion1.
         *_holdout_NOT_FOR_RELEASE.json = extra cards held for a possible Expansion 2. Do not load into the game.
csv/     Same cards as flat CSV for reading/review. JSON is the source of truth.
recipe_tag_changes.csv       Every Recipe whose tags changed (old vs new, and why). Already applied in decks/.
ingredient_tag_changes.csv   Every Ingredient whose tags, answer types or deck changed since the first version of this zip.
score_decks.py               Reference scorer. Run: python3 score_decks.py decks
"Chef's Kiss Programming Changes for Claude Code 2026-11-18.md"   The full spec. Start with "Changes since first version".

This v2 zip replaces the first version sent earlier on 18 Nov. Deck files say meta.version = pass3-crewfix-2026-11-18.
Family levels only (Mild, Medium, Hot). No Spicy or Hellfire Scorpion cards are included.
