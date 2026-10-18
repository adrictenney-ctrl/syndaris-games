# Chef's Kiss card source files

These text files are the master card database's source (SPEC.md Section 5.2 and Section 15).
`node tools/build-chefskiss-cards.mjs` checks them and writes `js/chefskiss-db.js`.

- Never hand-edit `js/chefskiss-db.js`. Edit these files and rebuild.
- IDs are permanent. The build reuses the ID of a card whose text is unchanged. New cards get the next number.
- A card removed from these files is **retired** (kept in the database with `status: "retired"`), never deleted.
- Changing a card's text makes a new card and retires the old one. Never change a card's meaning under the same ID.
- Official cards are only `mild`, `medium` or `spicy`. There are no Hot or Hellfire cards here, ever.

## Files

`mild-recipes.txt`, `mild-ingredients.txt`, `medium-…`, `spicy-…`. The level is in the file name.

## Line formats

```
Recipe Card:      text | tags | funnyTargets | literalTags | meta | hint
Ingredient Card:  text | tags | meta | hint
```

`meta` and `hint` are optional. Lines starting with `#` are comments.

A **tag group** is four space-separated fields, `subject tone scale register`. Each field is a string of
one-letter codes (several letters = several tags), or `-` for none.

| Field | Codes |
|---|---|
| subject | `p` person, `l` place, `t` thing, `e` event, `n` nature, `a` animal, `f` food, `c` pop_culture, `m` feeling, `x` action |
| tone | `s` silly, `a` absurd, `w` wholesome, `k` awkward, `d` dramatic, `y` dry, `g` gross_mild, `n` nostalgic |
| scale | `1` tiny, `2` everyday, `3` huge, `4` cosmic |
| register | `f` formal, `c` casual, `k` kid, `s` slang, `y` fancy, `o` official_sounding |

`meta` is space-separated tokens: `k3` knownness (1–5, default 4), `@1996` culture born, `^1997` peak,
`~2005` stale. Every pop-culture card gives at least `@year`.

`hint` is the short "what it means" text shown under the light bulb on a card.

Example:

```
A very polite volcano | n a 3 f
The worst superpower to get on a Monday | e s 2 c | at ak 14 - | x - - -
A Tamagotchi | ct n 1 c | @1996 ^1997 k3 | A digital pet on a keychain.
```
