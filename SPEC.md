# Chef's Kiss Party Game: Build Spec for Claude Code

**Version:** 12 October 2026, updated 17 October 2026 (approved 6+1 hand, dud rule, Si Spice It Up), updated 18 October 2026 (deck size set to 200 Recipe + 800 Ingredient per level; Parent Controls, Section 9.3; Family Deck Sync, Section 9.4) · **Owner:** Al Waller · **Builder:** Adric (with Claude Code)
**Source of truth:** *Chef's Kiss Party Game Master Plan 10-12-26*. If this spec conflicts with the Master Plan, the Master Plan wins. Stop and ask.
**Companion files (keep them in the repo next to this file):**
- **`CARD_RULES.md`**: the Card Writing Rulebook. It covers how to write and tag cards, and the Si Spice It Up rules.
- **`cards.json`**: 180 tagged test cards (30 Recipe, 150 Ingredient, all Medium). They come from the 17 Oct 2026 blind test.

> **House term:** say **Si** everywhere (code identifiers, UI copy, comments, commit messages). Never use the other two-letter term.

> **Al's direction (17 Oct 2026):** improving each card is the priority. The 17 Oct test found that card writing drives most of the laughs. The Laugh Engine adds lift on top of that. **Si Spice It Up** is a key feature (Section 10.1).

> **To the coding agent:** This file is your spec. Follow it exactly. Requirements use **MUST**, **MUST NOT**, **SHOULD** and **MAY**. Items marked **TODO-ADRIC** need facts about the existing code that Adric (or you, after inspecting the repo) must fill in. Items marked **TODO-AL** are product decisions that are not final. Build the stated default, keep it behind a config value, and do not invent a different rule.

---

## 0. First instructions to the agent

1. **Inspect the existing code first.** Before writing anything, read the repo and the current build behind playondisplay.com. Then fill in Section 3 (TODO-ADRIC) with what you find: the stack, the repo layout, hosting, realtime transport, how bots work, and how rooms and seats work.
2. **Keep the existing stack** (language, framework, hosting, transport) unless Adric tells you otherwise. Do not rewrite working parts for style.
3. **Plan before coding.** For each milestone (Section 14), write a short plan: files to touch, data changes and tests. Wait for approval, then implement.
4. **One milestone at a time.** Do not start milestone N+1 until every Definition of Done (DoD) item for milestone N passes.
5. **Tests are part of done.** Every rule written as MUST in this spec needs at least one automated test.
6. **Use the exact terms** in Section 2 in code identifiers, UI copy and comments.
7. **Do not touch** production data, payment settings or DNS without Adric's explicit go-ahead.
8. **Read `CARD_RULES.md` and `cards.json`** before working on the Laugh Engine, card data, seed content or Spice It Up. Use `cards.json` as the first test fixture for the card schema and `buildHand`.

---

## 1. Goal and non-goals

### Goal

Ship the next version of **Chef's Kiss Party Game**, a digital party game played on one shared **table screen** with players' **phones**. Each round:

1. The **Chef** is dealt 3 Recipe Cards and picks 1.
2. Every **Apprentice** gets a freshly built 7-card hand from the **Laugh Engine** and anonymously plays exactly 1 Ingredient Card.
3. The Chef awards exactly one **Chef's Kiss**.

Bots fill empty seats. Content is filtered by level. The Laugh Engine stacks hands so that **at least 70% of rounds are good matches and no more than 30% are duds**.

### Non-goals (do NOT build)

- Paper or printable cards, or a physical shuffle.
- A cloud LLM. Any language-model feature runs on the device and is optional.
- The Laugh Engine picking the winner of a human Chef's round.
- A "reject all" or "no Kiss" option for the Chef.
- Playing two Ingredient Cards per Apprentice ("Double Vision" is retired).
- A public social feed of Organic Cards.
- A marketplace for paid player cards.
- Automatic age detection. Levels come from player and host settings.
- Hot or Hellfire content in official decks or in Cards from the Community, ever.
- Uploading card text to analytics.
- Any cooking, recipe-app or restaurant-sim framing. The kitchen is a metaphor.
- Old titles or names in UI copy: no "Trash It", "Toss It", "Super-Duper Pantry", "MyCard", "Simply Silly" or "Easy Peasy".
- Voice recap or assistant features.

---

## 2. Glossary (use these exact terms)

| Term | Meaning | Code identifier |
|---|---|---|
| **Recipe Card** | Prompt card for the round. Burgundy. | `type: "recipe"` |
| **Ingredient Card** | Response card an Apprentice plays. Terracotta orange. | `type: "ingredient"` |
| **Organic Cards** | Cards a player makes on their own device. Paid tier. They can be Recipe or Ingredient cards. | `source: "organic"` |
| **Cards from the Community** | Organic Cards a player chose to submit that passed the family-friendly review. | `source: "community"` |
| **Official cards** | Cards we write and ship. | `source: "official"` |
| **Chef** | The player who picks the Recipe and awards the Kiss this round. Rotates. | `role: "chef"` |
| **Apprentice** | Every other seated player this round. | `role: "apprentice"` |
| **Chef's Kiss** | The single award per round. Worth 1 point. | `kiss` |
| **Laugh Engine** | The system that builds hands to maximize funny pairings, plus optional on-device model features. It never picks a human Chef's winner. | `laughEngine` |
| **Mild / Medium / Spicy** | Family-friendly official levels: elementary, middle school, high school. | `level: "mild" \| "medium" \| "spicy"` |
| **Hot / Hellfire** | Adult heat levels, for Organic Cards only. Blocked by default. Enabled only when every seated human opts in. | `level: "hot" \| "hellfire"` |
| **Table screen** | The shared big screen at `/table?game=chefskiss`. | `table` |
| **Phone** | A player's device, joined via `/play?room=CODE`. | `client` |
| **Bot** | A computer-controlled seat. | `isBot: true` |
| **Dud** | A round won by a plain, literal match. | `isDud` |
| **Si** | The game's built-in on-device intelligence. Always "Si"; never the other two-letter term. | `si` |
| **Spice It Up** | Si feature. It offers about 3 funnier, technique-labelled versions of a player's card idea. The player chooses or keeps the original. Tagline: *"The Si doesn't change your card, it pulls out the flavor."* | `spiceItUp` |

Level order, used for every comparison: `mild < medium < spicy < hot < hellfire`.

Never write "Prompt/Answer" or "Green/Red" cards. Never imply the cards are real recipes.

---

## 3. Existing build: TODO-ADRIC (fill in before Milestone 1)

Known facts:

- Live web build at **https://playondisplay.com**.
- Table screen: **`/table?game=chefskiss`**.
- Phone join page: **`/play?room=CODE`** (joined by QR code or by typing the room code).
- The table can add **bots** to fill seats.
- A Laugh Engine exists (Adric implemented it).
- Organic Card creation is **not** in the build yet.

Fill in:

| Item | Value |
|---|---|
| Repo URL / location | TODO-ADRIC |
| Language(s) / framework(s) (front end, back end) | TODO-ADRIC |
| Hosting / deploy process | TODO-ADRIC |
| Realtime transport (WebSocket, WebRTC, polling, service name) | TODO-ADRIC |
| Who holds game state (server, table screen, or a peer) | TODO-ADRIC |
| Room code format and lifetime | TODO-ADRIC |
| Current Laugh Engine location and inputs | TODO-ADRIC |
| Current bot logic location | TODO-ADRIC |
| Current card data format and location | TODO-ADRIC |
| Storage on the phone (localStorage, IndexedDB, other) | TODO-ADRIC |
| Test framework(s) in use | TODO-ADRIC |
| How to run locally / run tests | TODO-ADRIC |
| Other games served by playondisplay.com that must not break | TODO-ADRIC |

**Transport note:** The Master Plan's long-term goal is local-network or offline play. The current build uses an online connection. **Keep the online transport for now** (TODO-AL: whether to add a local mode later). Whatever the transport, follow the privacy rules in Section 11.

**Authority:** One authority (server or table host, per the existing design) owns game state. Phones send intents; the authority validates them and broadcasts the resulting state. Phones MUST NOT be trusted for scoring, anonymity or level gating.

---

## 4. Configuration (defaults)

Put these values in one config module. Defaults marked TODO-AL are product decisions that may change.

```json
{
 "minSeats": 3,
 "maxSeats": 8,
 "targetScoreOptions": [5, 7, 10],
 "defaultTargetScore": 7,
 "gameTimerOptionsMin": [null, 15, 30, 45],
 "handSize": 7,
 "handMix": { "onTarget": 6, "random": 1 },
 "handRefresh": "full",
 "recipeChoices": 3,
 "timers": {
 "recipePickSec": 30,
 "playSec": 60,
 "kissSec": null,
 "resultSec": 6,
 "disconnectGraceSec": 60,
 "joinTimeoutSec": 15
 },
 "botsCanBeChef": false,
 "revealWinnerAfterKiss": true,
 "freshness": { "halfLifeDays": 180, "kissBoost": 0.05, "floor": 0.05, "retireBelow": null },
 "dudTarget": 0.30,
 "paidTierEnabled": false,
 "spiceItUpEnabled": true,
 "spiceItUpSuggestions": 3,
 "spiceItUpButtonLabel": "Salt and Pepper"
}
```

TODO-AL items:

- `botsCanBeChef`
- `revealWinnerAfterKiss`
- `maxSeats`
- `freshness.halfLifeDays` and `kissBoost`
- `kissSec`
- tie handling (Section 6.6)
- the final Spice It Up button label (`"Salt and Pepper"` is the candidate)

**Approved, not open:** `handMix` = 6 on-target + 1 random (Al, 17 Oct 2026).

---

## 5. Data model

The shapes below are TypeScript-style. Adapt the syntax to the existing stack, but keep the field names, types, required fields and enums. `?` marks an optional field. All timestamps are ISO 8601 UTC strings. All IDs are strings.

### 5.1 Shared enums

```ts
type CardType = "recipe" | "ingredient";
type CardSource = "official" | "community" | "organic";
type Level = "mild" | "medium" | "spicy" | "hot" | "hellfire";
type CardStatus = "draft" | "in_review" | "active" | "retired" | "rejected";
type Subject = "person" | "place" | "thing" | "event" | "nature" | "animal" | "food" | "pop_culture" | "feeling" | "action";
type Tone = "silly" | "absurd" | "wholesome" | "awkward" | "dramatic" | "dry" | "gross_mild" | "nostalgic";
type Scale = "tiny" | "everyday" | "huge" | "cosmic";
type Register = "formal" | "casual" | "kid" | "slang" | "fancy" | "official_sounding";
type Violation = "none" | "social" | "physical" | "logic"; // benign only (see CARD_RULES.md)
type Status = "high" | "low" | "neutral";
type Role = "chef" | "apprentice";
```

The tag lists are a **starter taxonomy (TODO-AL)**. The `violation` and `status` axes were added in the 17 Oct test kit and are used in `cards.json` and `CARD_RULES.md`. Every card gets 1–2 tags on each of the 6 axes. Store tags as strings, validated against a taxonomy file (`taxonomy.json`), so the lists can grow without a code change.

### 5.2 Card (master card database record)

| Field | Type | Req | Rules |
|---|---|---|---|
| `id` | string | ✔ | Permanent and never reused. Format `rc_000123` (recipe) or `ic_000123` (ingredient). Organic local cards use `org_<uuid>`. |
| `type` | CardType | ✔ | |
| `text` | string | ✔ | 1–120 chars. Plain text. |
| `source` | CardSource | ✔ | |
| `level` | Level | ✔ | `hot` and `hellfire` are allowed only when `source = "organic"`. |
| `status` | CardStatus | ✔ | Never hard-delete `official` or `community` cards. Set `retired` instead. |
| `audience` | object | ✔ | `{ readingLevel: Level≤spicy, cultureLevel: Level≤spicy, knownness: 1–5 }`. Hot and Hellfire cards keep their audience at `spicy`. |
| `culture` | object | ✔ | `{ born: "YYYY" \| null, peak: "YYYY" \| null, stale: "YYYY" \| null }` |
| `freshness` | number | ✔ | 0–1. Default 1.0 for new cards. |
| `tags` | object | ✔ | `{ subject: Subject[], tone: Tone[], scale: Scale[], register: Register[], violation: Violation[], status: Status[] }`. 1–2 values per axis for new cards (CARD_RULES.md §3). The engine still tolerates empty arrays. |
| `funnyTargetCombos` | object[] | recipe ✔ | 2–3 combos. Each is a partial `tags` object covering 2+ axes that clash with the Recipe, each using a different technique (as in `cards.json`). |
| `funnyTargets` | object | recipe – | The union of the combos. Legacy and display only. |
| `literalTags` | object | recipe ✔ | Tags that make a plain, literal fit. Same shape as `tags`. |
| `literalFor` | string[] | | Recipe IDs this Ingredient is a known literal fit for. |
| `deckIds` | string[] | | Decks this card belongs to. |
| `decade` | string | | Derived from `culture.born`, e.g. `"1990s"`. Used as a filter only. |
| `creditName` | string | | Opt-in creator credit. Set only when a card is promoted. |
| `stats` | object | ✔ | `{ timesDealt: int, timesPlayed: int, kisses: int }` |
| `createdAt` / `updatedAt` / `retiredAt?` | string | ✔/✔/– | |
| `version` | int | ✔ | Bump on any text change. Never change the meaning under the same ID; retire it and create a new card instead. |

```json
{
 "id": "rc_000042",
 "type": "recipe",
 "text": "The worst superpower to get on a Monday",
 "source": "official",
 "level": "mild",
 "status": "active",
 "audience": { "readingLevel": "mild", "cultureLevel": "mild", "knownness": 5 },
 "culture": { "born": null, "peak": null, "stale": null },
 "freshness": 1.0,
 "tags": { "subject": ["event"], "tone": ["silly"], "scale": ["everyday"], "register": ["casual"] },
 "funnyTargets": { "subject": ["animal", "thing"], "tone": ["absurd", "awkward"], "scale": ["tiny", "cosmic"], "register": [] },
 "literalTags": { "subject": ["action"], "tone": [], "scale": [], "register": [] },
 "deckIds": ["deck_official_core"],
 "stats": { "timesDealt": 0, "timesPlayed": 0, "kisses": 0 },
 "createdAt": "2026-10-12T22:00:00Z",
 "updatedAt": "2026-10-12T22:00:00Z",
 "version": 1
}
```

```json
{
 "id": "ic_000310",
 "type": "ingredient",
 "text": "A very polite volcano",
 "source": "official",
 "level": "mild",
 "status": "active",
 "audience": { "readingLevel": "mild", "cultureLevel": "mild", "knownness": 5 },
 "culture": { "born": null, "peak": null, "stale": null },
 "freshness": 0.92,
 "tags": { "subject": ["nature"], "tone": ["absurd"], "scale": ["huge"], "register": ["formal"] },
 "literalFor": [],
 "deckIds": ["deck_official_core"],
 "stats": { "timesDealt": 120, "timesPlayed": 31, "kisses": 12 },
 "createdAt": "2026-10-12T22:00:00Z",
 "updatedAt": "2026-10-12T22:00:00Z",
 "version": 1
}
```

### 5.3 Deck

| Field | Type | Req | Rules |
|---|---|---|---|
| `id` | string | ✔ | e.g. `deck_official_core`, `deck_drop_2026_11`, `deck_org_<uuid>` |
| `name` | string | ✔ | e.g. "Core", "November 2026 Drop", "Wedding" |
| `kind` | `"official" \| "drop" \| "community" \| "organic_theme"` | ✔ | |
| `ownerPlayerId` | string | organic ✔ | Local only. Never uploaded. |
| `theme` | string | | e.g. `"wedding"`, `"family_reunion"`, `"custom"` |
| `cardIds` | string[] | ✔ | |
| `releasedAt` | string | drop ✔ | Monthly drop date |
| `status` | `"active" \| "retired"` | ✔ | |

```json
{ "id": "deck_org_7f3a", "name": "Maya & Sam's Wedding", "kind": "organic_theme", "ownerPlayerId": "p_local_19c2", "theme": "wedding", "cardIds": ["org_5b1e...", "org_a903..."], "status": "active" }
```

### 5.4 Player

| Field | Type | Req | Rules |
|---|---|---|---|
| `id` | string | ✔ | Stable per device (stored on the device). Bots use `bot_<n>`. |
| `displayName` | string | ✔ | 1–16 chars. Never attached to played cards. |
| `isBot` | boolean | ✔ | |
| `level` | `"mild" \| "medium" \| "spicy"` | ✔ | Self-declared at join (TODO-AL: profile or parent setting later). Bots default to the table level. |
| `paidTier` | boolean | ✔ | Unlocks Organic Cards. Default false. |
| `adultOptIn` | ConsentRef \| null | ✔ | A reference to this device's consent record. Bots are always null. |
| `seatIndex` | int \| null | ✔ | |
| `connection` | `"connected" \| "reconnecting" \| "disconnected"` | ✔ | |
| `score` | int | ✔ | Per game |
| `rejoinToken` | string | ✔ | Secret, stored on the device. Used to reclaim the seat. |

```json
{ "id": "p_local_19c2", "displayName": "Grandpa Al", "isBot": false, "level": "spicy", "paidTier": true, "adultOptIn": null, "seatIndex": 0, "connection": "connected", "score": 3, "rejoinToken": "<secret>" }
```

### 5.5 Table / session

| Field | Type | Req | Rules |
|---|---|---|---|
| `roomCode` | string | ✔ | TODO-ADRIC: the existing format |
| `game` | `"chefskiss"` | ✔ | |
| `hostPlayerId` | string \| `"table"` | ✔ | |
| `state` | GameState (Section 6) | ✔ | |
| `seats` | `(playerId \| null)[]` | ✔ | Length = `maxSeats`. Seats are numbered clockwise from the top-left seat. |
| `targetScore` | 5 \| 7 \| 10 | ✔ | |
| `gameTimerMin` | int \| null | ✔ | |
| `level` | Level | ✔ | Effective table level, computed per Section 9 |
| `levelRaisedByHost` | `"mild" \| "medium" \| "spicy"` \| null | ✔ | |
| `adultLevel` | `"hot" \| "hellfire"` \| null | ✔ | Effective only if the gate passes (Section 9.2) |
| `chefOrder` | string[] | ✔ | Player IDs in rotation order |
| `chefIndex` | int | ✔ | |
| `roundNumber` | int | ✔ | |
| `usedCardIds` | string[] | ✔ | Cards already used this game, so they are not repeated |
| `startedAt` / `endsAt?` | string | | |

```json
{ "roomCode": "KZ4P", "game": "chefskiss", "hostPlayerId": "table", "state": "APPRENTICES_PLAY", "seats": ["p_local_19c2", "p_9a01", "bot_1", null, null, null, null, null], "targetScore": 7, "gameTimerMin": null, "level": "medium", "levelRaisedByHost": "medium", "adultLevel": null, "chefOrder": ["p_local_19c2", "p_9a01"], "chefIndex": 1, "roundNumber": 4, "usedCardIds": ["rc_000042", "ic_000310"] }
```

### 5.6 Round

| Field | Type | Req | Rules |
|---|---|---|---|
| `roundId` | string | ✔ | |
| `roundNumber` | int | ✔ | |
| `chefId` | string | ✔ | |
| `recipeChoices` | string[3] | ✔ | Card IDs |
| `recipeId` | string \| null | ✔ | Set on pick |
| `hands` | `Record<playerId, HandSlot[]>` | ✔ | `HandSlot = { cardId, slot: "on_target" \| "random" }`. Stored at the authority. Each phone sees only its own hand. |
| `submissions` | `Submission[]` | ✔ | `Submission = { submissionId, playerId, cardId, cardText, slot, source, level }`. `playerId` is **never** sent to the Chef or the table before the Kiss. |
| `revealOrder` | string[] | ✔ | `submissionId`s in a shuffled order |
| `kissSubmissionId` | string \| null | ✔ | |
| `isDud` | boolean \| null | ✔ | |
| `status` | `"active" \| "complete" \| "voided"` | ✔ | `voided` only when the Chef leaves (Section 6.5) |

```json
{ "roundId": "r_KZ4P_4", "roundNumber": 4, "chefId": "p_9a01", "recipeChoices": ["rc_000042", "rc_000077", "rc_000101"], "recipeId": "rc_000042",
 "submissions": [ { "submissionId": "s_1", "playerId": "p_local_19c2", "cardId": "ic_000310", "cardText": "A very polite volcano", "slot": "on_target", "source": "official", "level": "mild" } ],
 "revealOrder": ["s_3", "s_1", "s_2"], "kissSubmissionId": "s_1", "isDud": false, "status": "complete" }
```

### 5.7 Pairing log entry

There are two forms: **local**, kept on the device, and **upload**, the anonymous stat. The upload form contains no text and no player identity.

| Field | Type | Req | Rules |
|---|---|---|---|
| `pairingId` | string | ✔ | |
| `recipeId` | string | ✔ | An Organic Recipe uses `orgh_<sha256(localId+deviceSalt)>` |
| `ingredientId` | string | ✔ | Same hashing rule for Organic |
| `won` | boolean | ✔ | |
| `slot` | `"on_target" \| "random"` | ✔ | |
| `isDud` | boolean | ✔ | Set on the winning entry, otherwise false |
| `tableLevel` | Level | ✔ | Upload: `hot` and `hellfire` are reported as `"adult"` with no IDs (TODO-AL: or not uploaded at all) |
| `seatCount` / `botCount` | int | ✔ | |
| `engineVersion` | string | ✔ | |
| `ts` | string | ✔ | Upload: rounded to the hour |

```json
{ "pairingId": "pl_8c21", "recipeId": "rc_000042", "ingredientId": "ic_000310", "won": true, "slot": "on_target", "isDud": false, "tableLevel": "medium", "seatCount": 5, "botCount": 1, "engineVersion": "le-2.0.0", "ts": "2026-10-12T22:00:00Z" }
```

### 5.8 Opt-in consent record (Hot / Hellfire)

Stored **on the device**. The authority receives only `{ playerId, adultOk: true, maxLevel, consentVersion }` for the current session.

| Field | Type | Req | Rules |
|---|---|---|---|
| `consentId` | string | ✔ | |
| `playerId` | string | ✔ | |
| `ageAttested18` | boolean | ✔ | Must be true. TODO-AL/legal: verification method |
| `agreementVersion` | string | ✔ | e.g. `"adult-v0-DRAFT"`. TODO-AL/legal: the final text |
| `maxLevel` | `"hot" \| "hellfire"` | ✔ | |
| `acceptedAt` | string | ✔ | |
| `revokedAt` | string \| null | ✔ | Revoking takes effect immediately |

```json
{ "consentId": "c_31aa", "playerId": "p_local_19c2", "ageAttested18": true, "agreementVersion": "adult-v0-DRAFT", "maxLevel": "hot", "acceptedAt": "2026-10-12T22:10:00Z", "revokedAt": null }
```

---

## 6. Game state machine

```
LOBBY
 └─(host taps Start; seats ≥ minSeats; ≥1 human)──► CHEF_PICKS_RECIPE
CHEF_PICKS_RECIPE (Chef sees 3 Recipe Cards)
 └─(Chef picks 1 | timer → auto-pick a random choice)──► DEAL_HANDS
DEAL_HANDS (Laugh Engine builds/refreshes every Apprentice hand; instant)
 └──► APPRENTICES_PLAY
APPRENTICES_PLAY (each Apprentice plays exactly 1 Ingredient Card)
 └─(all submitted | timer expires with ≥1 submission)──► CHEF_READS
 └─(timer expires with 0 submissions)──► extend once by playSec, then ROUND_VOIDED
CHEF_READS (cards shown anonymously in shuffled order; Chef reads aloud)
 └─(Chef taps "Ready to Kiss")──► CHEF_KISSES
CHEF_KISSES (Chef must select exactly 1)
 └─(Chef awards Kiss)──► ROUND_RESULT
ROUND_RESULT (show winning card; +1 score; log pairings; dud check)
 └─(someone reached targetScore | game timer expired)──► GAME_OVER
 └─(else; after resultSec)──► rotate Chef ──► CHEF_PICKS_RECIPE
ROUND_VOIDED (no points; cards return; rotate Chef) ──► CHEF_PICKS_RECIPE
GAME_OVER (final scores, winner(s), Play again → LOBBY with same seats)
```

### 6.1 Rules per state (MUST)

- **LOBBY:** Players join and leave. The host can add or remove bots and set the target score, game timer and level. Start is disabled until `seats filled ≥ minSeats` and at least 1 human is seated.
- **CHEF_PICKS_RECIPE:** Deal `recipeChoices` (3) distinct, eligible Recipe Cards that are not in `usedCardIds`. Only the Chef's phone sees them. The table shows "Chef is choosing…". When the timer expires, auto-pick one of the 3 uniformly at random.
- **DEAL_HANDS:** Run the Section 8 algorithm for each Apprentice (bots included). No Ingredient Card appears in two hands in the same round.
- **APPRENTICES_PLAY:** Each Apprentice may submit **exactly one** card. A second submission is rejected; changing a pick before the phase ends is allowed. Organic Cards and on-the-fly cards are allowed only if `paidTier` is true and the card passes the level gate. The table shows an anonymous count ("3 of 4 cards in"), never names.
- **CHEF_READS / CHEF_KISSES:** The Chef and the table see only `submissionId`, `cardText` and the card-type styling. No `playerId`, `displayName`, seat, source badge or Organic "growth" visuals. There is no reject or skip button.
- **ROUND_RESULT:** Add exactly +1 to the winning submission's player. If `revealWinnerAfterKiss` is true, show the winner's name with the winning card. Never reveal who played the non-winning cards. Write pairing-log entries for every submission. Compute `isDud`.
- **GAME_OVER:** Triggered when a player reaches `targetScore`, or when the game timer expires (the current round finishes first). Tie at timer expiry: declare co-winners (TODO-AL: tie-break round).

### 6.2 Timers

| State | Default | On expiry |
|---|---|---|
| CHEF_PICKS_RECIPE | 30 s | Random pick from the 3 |
| APPRENTICES_PLAY | 60 s | Close with the current submissions (≥1). With 0 submissions, extend once, then void the round. |
| CHEF_KISSES | none (`kissSec: null`) | If set: nudge only. Never auto-award for a human Chef. |
| ROUND_RESULT | 6 s | Advance |
| Disconnect grace | 60 s | See Section 6.4 |
| Join attempt | 15 s | Show an error with a Retry button (Section 13) |

All timers run at the authority and are shown as a countdown on the table and on the relevant phone.

### 6.3 Chef rotation

- Order: clockwise by `seatIndex`.
- Skip bots when `botsCanBeChef` is false. Skip players who are disconnected at rotation time.
- If `botsCanBeChef` is true (TODO-AL), a bot Chef picks the Recipe at random and picks the Kiss by Laugh Engine score with randomness. This is the only time the engine picks a winner, and it MUST be labeled "Bot Chef" on screen.

### 6.4 Disconnect and rejoin

- The phone stores `{ roomCode, playerId, rejoinToken }`. Reopening `/play?room=CODE` with a valid token reclaims the same seat, score and current hand.
- While disconnected, the seat shows "Reconnecting…" on the table. The player's submission, if made, stays in.
- If an **Apprentice** has not reconnected when the play timer ends, they are skipped for that round.
- After `disconnectGraceSec`, the host may "Replace with bot". The bot keeps the seat and the score. If the human returns, they take the seat back.
- If the table screen reloads, it MUST restore the full state from the authority (TODO-ADRIC: depends on the transport).

### 6.5 Chef disconnect

- During CHEF_PICKS_RECIPE: the timer runs, then auto-picks.
- During CHEF_READS or CHEF_KISSES: wait `disconnectGraceSec`. Then the host may tap "Skip Chef". The round becomes `voided`, no points are awarded, the cards return to the pool, and the Chef rotates.
- Voiding is the **only** way a round ends without a Kiss. The Chef can never choose it.

### 6.6 Bot behavior

- Bots are seated by the host in the lobby. They fill the **lowest-numbered open seat** (seats numbered clockwise from top-left).
- As an Apprentice, a bot plays from its own Laugh Engine hand after a random delay of 3–12 s. Choice weights: on-target cards ranked by score 85%, the random card 15%. Use a seeded RNG so tests are reproducible.
- Bots **never** hold or play Organic, Hot or Hellfire cards.
- Bots have no consent record and do not count toward or against the adult gate (Section 9.2).
- Bot names are clearly marked (e.g. "🤖 Basil").

---

## 7. UI requirements

These apply to every screen:

- Use the card terms and colors: Recipe = burgundy, Ingredient = terracotta orange.
- Large type. Table text must be readable at 3 m; phone text at arm's length.
- No element overlaps another at the supported viewports. Table: 1280×720, 1366×768, 1920×1080, 3840×2160, 1024×768. Phone: 360×640, 390×844, 430×932 portrait.
- Every network wait shows a spinner, a status text and, after a timeout, an error with a Retry button.
- No old titles in any copy.

### 7.1 Table screen (`/table?game=chefskiss`)

| Screen | MUST show | MUST NOT |
|---|---|---|
| **Lobby** | Wordmark "Chef's Kiss Party Game"; a large QR code; the room code; the join URL as text (exactly the URL that opens: `/play?room=CODE`); the seat ring with names, connection dots and bot badges; the settings panel (target score, timer, level, bots); a Start button with its disabled reason. | Let the settings panel overlap any seat. Let Start overlap any seat. |
| **Connection status** | Overall status (Connected / Reconnecting / Offline), plus a per-seat dot. On a failure longer than 15 s: an error message with the reason and Retry. | Show "CONNECTING" forever. |
| **Chef choosing** | Chef's name, "Chef is choosing a Recipe Card…", countdown. | Show the 3 choices. |
| **Recipe reveal / play** | The chosen Recipe Card, large; anonymous progress ("3 of 4 in"); countdown. | Show which players have submitted. |
| **Reading** | Each Ingredient Card, large, one at a time or as a grid, in `revealOrder`, beside the Recipe. | Show names, seats, sources or growth. |
| **Kiss result** | The winning pairing, a short Chef's Kiss animation (≤1.5 s, optional), the winner's name if enabled, updated scores. | Show who played the losing cards. |
| **Scoreboard** | Scores, the target, the next Chef. | |
| **Game over** | Winner(s), final scores, a few highlights (top pairings by Kiss), Play again, Back to lobby. | |

After Start, empty seats are **hidden** (the ring re-lays out for the seated players only).

### 7.2 Phone (`/play?room=CODE`)

| Screen | MUST show |
|---|---|
| **Join** | Room code (prefilled from the URL), name, level picker ("Which school level fits you?": Mild = elementary, Medium = middle school, Spicy = high school), Join button. While connecting: "Connecting to the table…", then an error and Retry after 15 s. |
| **Lobby wait** | "You're in, seat N", list of players, a link to Settings. |
| **Chef: pick a Recipe** | 3 Recipe Cards as large tappable cards, countdown, Confirm. |
| **Chef: wait** | "Apprentices are choosing…" with an anonymous count. |
| **Chef: read and Kiss** | The anonymous Ingredient Cards in `revealOrder`, "Ready to Kiss", then select exactly one and Confirm "Give the Chef's Kiss". No reject button. |
| **Apprentice: hand** | The Recipe Card at the top, a 7-card hand (swipe or grid), tap to select, then "Play this Ingredient Card". Paid tier adds tabs: "My Organic Cards" and "Write one now". |
| **Apprentice: submitted** | "Your card is in. The Chef won't know it's yours." Option to change the pick until the phase ends. |
| **Result** | The winning pairing. "You won the Kiss!" privately on the winner's phone, plus the public result per config. |
| **Game over** | Final scores, Play again. |
| **Settings** | Level, an adult opt-in section (Section 9.2), and a revoke button. |
| **Organic Cards** (paid) | Collection, plant, tag, decks, grow, harvest, delete (Section 10). |
| **Error** | A plain-language reason, Retry, and "Check you're on the internet" help. |

---

## 8. Laugh Engine: hand building

### 8.1 Eligibility filter

```text
function eligible(card, table, player, round):
 if card.status != "active": return false
 if card.type != "ingredient": return false
 if card.id in table.usedCardIds or card.id in round.dealtThisRound: return false
 if card.source == "organic": return false # Organic cards are never dealt; owners play them from their own tab
 if rank(card.level) > rank(table.level): return false # table.level ≤ spicy for official/community
 if table.decadeFilter and card.decade not in table.decadeFilter: return false
 return true
```

Official and community cards are always `mild`, `medium` or `spicy`, so they can never be dealt above Spicy. Hot and Hellfire cards exist only as Organic Cards, are played only from the owner's tab, and only when the gate passes (Section 9.2).

### 8.2 Scoring

```text
TAG_WEIGHTS = { subject: 1.0, tone: 1.5, scale: 1.0, register: 1.0, violation: 1.0, status: 1.0 }

function overlap(cardTags, targetTags):
 s = 0
 for dim in [subject, tone, scale, register, violation, status]:
 s += TAG_WEIGHTS[dim] * |cardTags[dim] ∩ targetTags[dim]|
 return s

function funnyScore(card, recipe, stats):
 target = max(overlap(card.tags, combo) for combo in recipe.funnyTargetCombos) # must fit one whole combo
 literal = overlap(card.tags, recipe.literalTags) + (recipe.id in card.literalFor ? 3 : 0)
 history = pairWinRate(recipe.id, card.id, prior=0.2, priorWeight=5) # Bayesian-smoothed from the pairings log
 return (2.0*target - 1.5*literal + 3.0*history) * (0.5 + 0.5*card.freshness) + jitter(0, 0.3)

function literalScore(card, recipe):
 return overlap(card.tags, recipe.literalTags) + (recipe.id in card.literalFor ? 3 : 0)
```

### 8.3 Building the 7-card hand (APPROVED 17 Oct 2026: 6 on-target + 1 random)

The safe and wild slots are **removed**. In the 17 Oct blind test, the safe slot was rated DUD 43% of the time and the wild slot 38%, against 31% for random cards and 24% for on-target cards. The wild slot becomes a plain random eligible card.

```text
function buildHand(player, recipe, table, round, rng):
 pool = [c for c in cardDB if eligible(c, table, player, round)]
 if len(pool) < config.handSize:
 pool += widenToLowerLevels(table) # never higher levels
 hand = []

 hasData = recipe.funnyTargetCombos is non-empty and pool has ≥ 10 tagged cards
 if not hasData:
 hand = rng.sample(pool, config.handSize), all slot="random" # FALLBACK
 mark dealt; return hand

 ranked = sortDesc(pool, by funnyScore(c, recipe))
 onTarget = takeTopWithDiversity(ranked, n=handMix.onTarget, # 6
 maxSameSubject=2, rng) # weighted sample from the top 25%, not strictly top-N
 rand = rng.sample(pool - onTarget, handMix.random) # 1 uniformly random eligible card
 hand = onTarget(slot="on_target") + rand(slot="random")
 if len(hand) < config.handSize: top up with rng.sample(pool - hand), slot="random"
 shuffle(hand, rng) # slot labels are NEVER shown to players
 mark all dealt in round.dealtThisRound; table.usedCardIds += played only
 return hand
```

- There is **no** safe/literal pick and **no** "wild" selection rule. Do not keep the old code paths behind flags. Delete them.
- `handRefresh: "full"` (default): every round, after the Recipe is picked, unplayed cards return to the pool and a new 7-card hand is built.
- A card that is dealt but not played is **not** added to `usedCardIds`. It can be dealt again in later rounds, but not in two hands in the same round.
- Missing data falls back to random. If any field the engine needs is missing (tags, funnyTargetCombos, freshness, stats), treat it as empty or default and keep going. The engine MUST NOT throw or block a round.
- Recipe choices: deal 3 eligible Recipes. Prefer ones with high freshness and non-empty `funnyTargetCombos` (weighted random), and avoid choices that share a subject.

### 8.4 Freshness

```text
daily job (or computed lazily at read time):
 days = now - card.freshnessUpdatedAt (in days)
 card.freshness = max(floor, card.freshness * 0.5 ** (days / halfLifeDays))
on Kiss win:
 card.freshness = min(1.0, card.freshness + kissBoost)
culture.stale in the past → multiply freshness by 0.5 at read time (TODO-AL)
```

Defaults: `halfLifeDays = 180`, `kissBoost = 0.05`, `floor = 0.05` (all TODO-AL). Freshness only changes how often a card is dealt. It never deletes or retires a card automatically unless `retireBelow` is set.

### 8.5 Dud metric

```text
isDud(round) =
 winner = submission[round.kissSubmissionId]
 literalScore(winnerCard, recipe) ≥ LITERAL_THRESHOLD (default 2)
 or recipe.id in winnerCard.literalFor
# The slot never decides a dud. (A safe-slot win is no longer an automatic dud; the safe slot no longer exists.)
dudRate(window) = count(isDud) / count(completed rounds) # exclude voided
goodRate = 1 - dudRate
TARGET: dudRate ≤ 0.30 (goodRate ≥ 0.70)
```

- Compute per game, per table level, per engine version and per monthly drop.
- Show it on an internal dev page (`/admin/metrics` or a console report).
- Organic winners use the Organic Card's own tags. Untagged Organic winners are excluded from the dud metric.
- Also report the dud rate by slot (`on_target` vs `random`), so the 6+1 mix can be checked against the 17 Oct test (on-target 24% dud, random 31%).

### 8.6 Si: optional on-device model (feature-flagged)

- **Spice It Up** (Section 10.1): funnier versions of a player's card idea. This is a key feature.
- Funny Pairing Radar (re-rank the hand on the device). Later.
- If the model is absent or slow, hide the feature. Never block a round.
- TODO-AL: model choice (Gemma 4 E2B/E4B) and the minimum device.

---

## 9. Level rules

### 9.1 Mild / Medium / Spicy

1. `youngest = min(rank(p.level) for p in seated humans)`.
2. `table.level = max(youngest, table.levelRaisedByHost ?? youngest)`. The host can **raise** the level above the youngest player's level. The host can also clear the raise, which returns the table to the youngest level. The table level is never set below the youngest level.
3. The default with no host action: `table.level = youngest`.
4. When a player joins or leaves, recompute. If a younger player joins, the level drops to theirs unless the host had raised it (then show the host "Level stays at X because you raised it").
5. Official and community content MUST be `≤ spicy`.
6. The current level is shown on the table screen in the lobby and during play.

### 9.2 Hot / Hellfire (adult Organic Cards)

1. **Blocked by default** for every player and every table.
2. A player turns it on **individually** on their own phone, under Settings → Adult Organic Cards:
 - an 18+ warning,
 - an age attestation,
 - a legal agreement (`agreementVersion`, TODO-AL/legal text),
 - a choice of max level (Hot, or Hellfire).
3. Gate, evaluated at the authority at deal time **and** at submit time:

```text
adultAllowed(table, level L in {hot, hellfire}) =
 paidTierEnabled
 and table.adultLevel is set and rank(L) ≤ rank(table.adultLevel)
 and for EVERY seated human h: h.adultOptIn valid (not revoked, current agreementVersion) and rank(L) ≤ rank(h.maxLevel)
```

 Bots are excluded from the check and **never** play adult cards.
4. **No reveal.** The UI MUST NOT show which players have or have not opted in. The host sees only "Adult Organic Cards: available" or "not available at this table". Flagging a card Hot or Hellfire never reveals the card's text or creator to anyone else.
5. If a non-consenting player joins mid-game, or a player revokes, adult cards are immediately unavailable. Unplayed adult submissions are withdrawn silently (the player is told privately: "That card can't be played at this table right now").
6. Adult cards MUST NOT be harvested into Cards from the Community, promoted to official decks, uploaded, or included in pairing-log uploads with IDs. Enforce this on the client **and** the server.

### 9.3 Parent Controls (APPROVED by Al, 18 Oct 2026)

**Design philosophy (official):** *The game adapts to the family; it does not judge the family.* Families range from very conservative (some parents don't allow TV at all) to very permissive. The game MUST be flexible enough for each family, and each parent, mother or father equally, is in control of what their young kids play with. *(Equal-parent wording raised by Al, 18 Oct 2026: a father has exactly the same control over his kids' decks as a mother, and every rule in 9.3 and 9.4 applies to any parent on the account.)*

1. **Edit or remove any card.** A parent MAY edit the text of, or remove, **any** card (official, Cards from the Community, or Organic) from their child's deck, for **any reason**. No justification is asked for and the game MUST NOT second-guess or override the parent's choice.
2. **Who it covers.** Parent Controls apply to child profiles **under 18**. When a player turns 18 (e.g. off to college and no longer playing at home), the parent controls on that profile end and the player manages their own deck, including the adult opt-in in Section 9.2.
3. **Scope.** A parent's edits and removals apply only to that family's child profiles. They never change the official decks, Cards from the Community, or any other family's game.
4. **Precedence.** A removed card is never dealt to that child, and an edited card is shown to that child in its edited form. This applies on top of the level rules in 9.1: Parent Controls can only make a child's deck more restrictive or reworded, never raise the level or unlock Hot/Hellfire.
5. **Reversible.** A parent can view, restore, or re-edit any card they changed.
6. **Privacy.** Parent edits are stored with the family's profiles and are not shared or uploaded with card text.
7. TODO-AL/TODO-ADRIC: how a parent account is set up and verified, and how child profiles are linked to it. **Related to Family Deck Sync (9.4):** the parent account and child links are what sync uses to know which devices belong to a household.

### 9.4 Family Deck Sync (raised by Al, 18 Oct 2026)

This is the plumbing behind Parent Controls (9.3). Without sync, a parent's card removals and rewordings exist on only one device.

1. **Follow the child.** A parent's edits and removals for a child profile MUST sync to every device that child plays on (phones, tablets, the family table screen) and apply before any card is dealt to that child.
2. **Private to the household.** Synced Parent Control data is visible only to that household's parent account and linked child profiles. It is never shared with other households, never used in Cards from the Community, and never uploaded with card text in pairing logs or metrics (consistent with Section 11).
3. **Conflicts.** If two edits to the same card conflict, the most recent parent edit wins. A parent's removal always beats a child's or another device's copy.
4. **Offline.** Edits made offline queue on the device and sync when it reconnects. Until a device has synced, it MUST use the strictest version it knows.
5. **Turning 18.** When a profile ages out of Parent Controls, sync stops applying parent edits to it.
6. **Open item (TODO-AL/TODO-ADRIC), linked to 9.3 item 7:** how a parent account is set up and verified, how child profiles link to it, and where synced household data is stored. The sync design depends on this decision.

---

## 10. Organic Cards flow (paid tier)

Everything here is behind `player.paidTier && config.paidTierEnabled`. TODO-ADRIC/AL: the payment mechanism. Until it exists, use a dev flag.

1. **Plant.** Write a card (Recipe or Ingredient, 1–120 chars). Then the player may tap **Spice It Up** (button label candidate: **"Salt and Pepper"**) to see Si suggestions (Section 10.1). Hide the button if the Si is unavailable. Planting always works without it.
2. **Tag.** Show suggested tags as one-tap chips (subject, tone, scale, register, violation, status) and a heat level (Mild, Medium, Spicy, plus Hot or Hellfire only if this player has opted in). The default heat is the player's level.
3. **Deck.** Pick a themed deck (Wedding, Family Reunion, Birthday, Retirement, Custom…) or create one.
4. **Grow.** Each Kiss the card wins increments `stats.kisses`. The collection shows growth stages (e.g. seed → sprout → bloom at 0 / 3 / 10 Kisses). Growth appears **only** in the owner's collection, never on the table or the Chef's view mid-round.
5. **Harvest** (optional). Submit to Cards from the Community. Show exactly what will be shared (text and tags) and an optional credit name. On submit, send `{ text, type, tags, level, creditName? }`. Status becomes `in_review`. Harvest is **disabled** for Hot and Hellfire cards, and the server also rejects them.
6. **Storage.** Organic Cards live on the device (TODO-ADRIC: IndexedDB or the existing store). They are not synced to a server unless harvested.
7. **Delete.** The owner can delete any Organic Card from the device. It is removed from the device immediately. A harvested copy already in Cards from the Community follows the master DB rule (retire, never delete). TODO-AL: should deleting also withdraw a pending submission?
8. **Play.** In APPRENTICES_PLAY, the owner may play an Organic Card from "My Organic Cards" if it passes the level/adult gate. Its text is sent to the authority **for this round only** and shown anonymously. The authority MUST NOT persist Organic text after the round ends.

### 10.1 Si Spice It Up (key feature)

**Tagline (UI copy):** *"The Si doesn't change your card, it pulls out the flavor."*
**Button label:** `config.spiceItUpButtonLabel`, default **"Salt and Pepper"** (candidate, TODO-AL final).
Full writing rules and examples are in **`CARD_RULES.md` §6**. The requirements below are the testable subset.

1. **Only on request.** Suggestions appear only after the player taps the button. The Si MUST NOT rewrite, replace, submit or re-tag a card on its own.
2. **About 3 suggestions** (`spiceItUpSuggestions`, default 3), each using a **different technique**, each shown with its **technique label**. Labels: `Twist`, `Status flip`, `Scale mismatch`, `Fancy talk`, `Rule-break`. (For Recipe ideas: `Wrong word`, `Role frame` and `Status flip` are also allowed.)
3. **"Keep mine" is always shown** with the original text, as an equal option. The player can also edit any suggestion before saving. Nothing is saved until the player confirms.
4. **The core idea is kept.** Every suggestion contains the player's core noun, person or idea.
5. **Card formula** (CARD_RULES.md §2). Ingredient: a 3–8 word picturable noun phrase with one twist. Recipe: a role or label frame with a "wrong" word.
6. **Tags.** Each suggestion carries suggested tags on all 6 axes. The player can change them in the Tag step.
7. **Level.** Suggestions are family-friendly at the player's level (Mild, Medium or Spicy) by default. Only when the card is being planted in the player's **own opted-in Hot or Hellfire deck** (Section 9.2) may suggestions use that heat, and **never above that deck's level**. The Si never raises heat on its own.
8. **Never punch down.** No insults about real groups, appearance, disability, religion, race or gender.
9. **On the device.** Prompts, the original text and suggestions stay on the device (privacy rules, Section 11). If the Si is offline or the device is too old, hide the button. Planting still works.
10. **Output contract.** `spiceItUp(text, type, level, deckHeat) -> [{ text, technique, tags }]`. Return 0–3 items. 0 means "show Keep mine only". Never throw into the UI.

Example: *a dog* → **Status flip:** "A dog who thinks he's the mayor" · **Fancy talk:** "A dog in a three-piece suit filing taxes" · **Scale mismatch:** "A dog the size of a parking garage" · **Keep mine:** "a dog".

---

## 11. Privacy rules (MUST)

1. By default, only **anonymous win stats** (the Section 5.7 upload form) leave the device. They contain no card text, no names and no hashes that can be reversed.
2. Card text leaves the device only (a) transiently, to show a played card to the table for the current round, or (b) when a player explicitly harvests a card.
3. The authority and any relay MUST NOT log or persist the text of Organic Cards (including Hot and Hellfire cards). Redact it from server logs.
4. The Chef never receives the `playerId` of any submission before the Kiss. Only the winner may be revealed after the Kiss (per config).
5. Consent records stay on the device. The server receives only the session flag.
6. Creator credit appears only if the creator opts in at harvest, and only when the card is promoted.
7. Display names are stored only for the session (TODO-ADRIC: current retention).

---

## 12. Content pipeline (for Milestone 4)

- One **master card database** (TODO-ADRIC: a JSON file in the repo, SQLite, or the existing DB) with the Section 5.2 schema and a JSON Schema validator in CI.
- **Monthly content drops:** a script `drop:build YYYY-MM` that validates the cards, assigns permanent IDs, creates a `drop` deck, applies retirements (status only), promotes approved community cards, and publishes as a data update without an app release.
- **Review queue** for harvested cards: approve (assign a level and tags, `source: "community"`) or reject. A rejected card stays on the player's device.
- **Promotion:** community cards with a high smoothed Kiss rate, chosen by an editor, are copied into an official drop deck (same ID, `source` stays `community`, added to the official deck), with optional `creditName`.

---

## 13. Acceptance tests from the 12 Oct 2026 playtest

These MUST pass before Milestone 0 is done. Automate them where you can (e.g. Playwright with multiple browser contexts). Mark the rest as manual checklist items.

| ID | Bug found | Acceptance test |
|---|---|---|
| AT-1 | The table stayed on CONNECTING/RECONNECTING and phones hung on "Connecting to the table…" with no error. | (a) A table and 3 phone contexts on a normal network: all phones show "You're in" within 5 s. (b) With the transport blocked: the phone shows an error and Retry within 15 s, and the table shows "Offline" with Retry. (c) **Manual:** verify on 2+ real phones (iOS Safari and Android Chrome) on Wi-Fi and on mobile data. |
| AT-2 | The lobby settings panel overlapped the top seats. | At every table viewport in Section 7, the settings panel's bounding box does not intersect any seat's bounding box (with 8 seats filled). |
| AT-3 | The Start button overlapped the bottom seat. | Same intersection test for the Start button. |
| AT-4 | The first bot filled the bottom-right seat. | Adding a bot to an empty table seats it at `seatIndex 0` (top-left). Each further bot takes the lowest open index. |
| AT-5 | Empty seats stayed visible during play. | After Start, there are no empty-seat elements in the DOM or visible on screen. |
| AT-6 | The join link showed `play.html` but opened `/play`. | The displayed join text equals the QR target URL, and both resolve to `/play?room=CODE` with HTTP 200. |
| AT-7 | The end-game screen was never tested. | An automated game (1 human context + bots, target 5) reaches GAME_OVER with the correct winner and Play again working. |
| AT-8 | Personal (Organic) card creation is not in the build. | Covered in Milestone 3 (an Organic Card is created, played anonymously, grows, and is deleted). |
| AT-9 | The plan calls for local play, but the build is online. | TODO-AL decision. Until then: document the transport in Section 3, and confirm that no Organic text is persisted by the relay (log-scan test). |

---

## 14. Milestones

Each milestone ships behind its own PR(s). It is done only when every box is checked and the listed tests pass in CI.

### M0: Inspect and stabilize the current build

- [ ] Section 3 filled in (no TODO-ADRIC left blank, or each one explained).
- [ ] Repo runs locally with one command, and tests run with one command.
- [ ] AT-1 to AT-7 pass.
- [ ] Join timeout, error and Retry on the phone and the table. Per-seat connection dots.
- [ ] No old-title strings in the UI (grep test for `Trash It|Toss It|Super-Duper|MyCard|Simply Silly|Easy Peasy|Double Vision`, plus the banned two-letter term, regex `\\bA[I]\\b`, since the house term is Si).

**Tests:** Playwright multi-context join; network-blocked join; layout intersection tests at all viewports; bot seat order unit test; join-URL test; full bot game to GAME_OVER; banned-strings test.

### M1: Core loop to the current rules

- [ ] State machine per Section 6, including all transitions, timers and voiding.
- [ ] Chef dealt 3 Recipes, picks 1. Auto-pick on timeout.
- [ ] Exactly 1 Ingredient Card per Apprentice. Second submission rejected. "Double Vision" code removed.
- [ ] Anonymous reveal in shuffled order. No player data in the Chef or table payloads before the Kiss.
- [ ] Exactly 1 Kiss. No reject path. +1 score. Rotation (bots skipped by default).
- [ ] Target score 5/7/10 and optional game timer. GAME_OVER and Play again.
- [ ] Level picker on join. Table level = youngest; the host can raise it (Section 9.1).
- [ ] Disconnect, rejoin and replace-with-bot (Section 6.4/6.5).
- [ ] Bot behavior per Section 6.6 with a seeded RNG.

**Tests:**
- unit tests for every state transition;
- a property test that every completed round has exactly 1 Kiss and the score sum equals the number of completed rounds;
- a payload test that the Chef and table messages contain no `playerId` or `displayName` for submissions before ROUND_RESULT;
- a duplicate-submission test;
- timer tests with fake timers;
- rejoin-with-token test;
- level-computation table tests (joins and leaves, host raise).

### M2: Master card database and Laugh Engine v2

- [ ] Card, Deck, Round, PairingLog schemas with validators (JSON Schema or equivalent). Seed data migrated to the schema.
- [ ] Permanent IDs. There is no delete path for official or community cards (retire only).
- [ ] The `buildHand` algorithm (Section 8.3), including the 5/1/1 mix, diversity, no duplicates across hands, and the random fallback.
- [ ] Freshness decay and Kiss boost. Decade filter.
- [ ] Pairing log written locally for every submission. Anonymous upload (Section 5.7 form) behind a flag.
- [ ] Dud metric computed and visible on the dev metrics page.

**Tests:**
- `buildHand` returns 7 unique eligible cards;
- slot counts 6 on-target + 1 random when data exists, and no `safe` or `wild` slot values anywhere;
- `isDud` never uses the slot (a winning random or on-target card is a dud only by the literal checks);
- running `buildHand` over `cards.json` passes schema validation and returns 7 cards per Recipe;
- falls back to random when tags are missing;
- never returns a card above the table level;
- never returns organic cards;
- no card appears in two hands in a round;
- deterministic output for a fixed seed;
- freshness math tests;
- `isDud` truth table;
- a simulation harness that runs 1,000 simulated rounds with bot Chefs (test-only) and reports dudRate vs the random baseline (informational, not pass/fail);
- a schema validation test over all seed cards;
- an upload-payload test (no `text` fields, no names).

### M3: Organic Cards and the adult gate (paid tier)

- [ ] Paid-tier flag (dev toggle until payments exist).
- [ ] Plant / Tag / Deck / Grow / Harvest UI and device storage. Delete.
- [ ] **Si Spice It Up** per Section 10.1: button (label from config), about 3 technique-labelled suggestions, "Keep mine", editable, on-device, hidden when unavailable.
- [ ] Organic play from the "My Organic Cards" tab, anonymous, with text never persisted by the authority.
- [ ] Adult opt-in screen (18+ warning, attestation, agreement version, max level), revoke, and on-device consent record.
- [ ] Gate (Section 9.2) enforced at deal and submit time on the server. Mid-game join or revoke handled. No reveal of who opted in.
- [ ] Harvest disabled for Hot and Hellfire, and the server rejects them.

**Tests:**
- adult card blocked when any seated human lacks consent;
- allowed when all have consented;
- blocked again after revoke or a new join;
- bots never receive or play adult cards;
- the host's view shows only available or not available;
- harvest of a Hot card rejected by client and server;
- Organic text absent from server logs and storage after the round (log scan);
- growth hidden from Chef and table payloads;
- delete removes the card from device storage;
- Spice It Up returns ≤3 suggestions with distinct technique labels, each containing the original core word;
- "Keep mine" saves the original text unchanged;
- nothing is saved or changed without the player's confirm;
- suggestions are never above the player's level outside an opted-in adult deck, and never above the deck's heat inside it;
- no Spice It Up text appears in network traffic (traffic capture test);
- the button is hidden and planting still works when the Si is unavailable;
- the banned-strings test (regex `\\bA[I]\\b`) passes on all Spice It Up copy.

### M4: Cards from the Community and monthly drops

- [ ] Harvest submission endpoint, review queue (approve/reject with level and tags), status flow.
- [ ] Community cards dealt to tables at or above their level.
- [ ] `drop:build` script, drop decks, retirement by status, promotion with optional credit.
- [ ] Anonymous win-stat ingestion and dud-rate report per drop.

**Tests:**
- review state transitions;
- rejected cards are never dealt;
- the drop build fails on schema errors or duplicate IDs;
- a retired card is never dealt but still resolves by ID in old logs;
- the promotion keeps the ID;
- ingestion rejects payloads containing text.

### M5: Platforms and polish (later)

- [ ] Local or offline session mode, if Al approves (AT-9).
- [ ] Tablet and desktop phone-layout polish. Native wrappers (TODO-AL).
- [ ] Optional on-device model (Radar and suggestions), feature-flagged, with Light Mode.
- [ ] Cosmetics, game-over highlights, table humor memory from the local pairings log.

**Tests:** the model-absent path is identical to M2 behavior; plus the transport tests for the chosen local mode.

---

## 15. Seed data guidance

- **Deck size (APPROVED by Al, 18 Oct 2026):** each level's deck (Mild, Medium, Spicy) is **1,000 cards: 200 Recipe Cards and 800 Ingredient Cards**, keeping the 4:1 Ingredient-to-Recipe ratio. This replaces the earlier placeholder of 150 Recipe and 600 Ingredient Cards per level. Status (as of 18 Oct 2026): all three decks are written at 200 Recipe + 800 Ingredient each: Mild in `mild_batch1.json`–`mild_batch12.json`, Medium in `medium_batch1.json`–`medium_batch10.json`, Spicy in `spicy_batch1.json`–`spicy_batch10.json`. None have been playtested yet.
- **Follow `CARD_RULES.md`** for every card: the formulas, tagging on all 6 axes, the level rules and the do's and don'ts. Use `cards.json` as the tagged reference set and test fixture. Improving each card is the priority.
- Voice: picturable noun phrases with one twist for Ingredients (3–7 words; Mild 2–5); role or label frames with a "wrong" word for Recipes. Never mean, never punching down, family-friendly at every level.
- Every card is fully tagged. Every Recipe has 2–3 `funnyTargetCombos` and `literalTags`.
- Spread subjects. Do **not** split cards evenly by category and rely on the mechanic alone; that is the Apples to Apples approach that produced about 70% duds.
- Fill in `culture.born`, `peak` and `stale` for any pop-culture reference.
- **No Hot or Hellfire cards in seed data, ever.**

### SAMPLE cards: examples only, not final content

| Level | Type | Text (SAMPLE) | Tags (subject / tone / scale / register) |
|---|---|---|---|
| Mild | Recipe | SAMPLE: "The worst superpower to get on a Monday" | event / silly / everyday / casual · funnyTargets: animal, thing / absurd, awkward / tiny, cosmic |
| Mild | Recipe | SAMPLE: "What's in a dragon's lunchbox?" | food / silly / huge / kid · funnyTargets: thing, person / wholesome, absurd / tiny, everyday |
| Mild | Ingredient | SAMPLE: "A very polite volcano" | nature / absurd / huge / formal |
| Mild | Ingredient | SAMPLE: "Grandma's fuzzy slippers" | thing / wholesome / tiny / kid |
| Mild | Ingredient | SAMPLE: "A sneezing giraffe" | animal / silly / huge / kid |
| Medium | Recipe | SAMPLE: "What the substitute teacher does on weekends" | person / awkward / everyday / casual · funnyTargets: event, nature / dramatic, absurd / cosmic |
| Medium | Recipe | SAMPLE: "The real reason the Wi-Fi is slow" | thing / dry / everyday / casual · funnyTargets: animal, person / absurd / tiny, cosmic |
| Medium | Ingredient | SAMPLE: "Group project drama" | event / dramatic / everyday / slang |
| Medium | Ingredient | SAMPLE: "Autocorrect" | thing / dry / tiny / casual |
| Medium | Ingredient | SAMPLE: "A dramatic hair flip" | action / dramatic / tiny / slang |
| Spicy | Recipe | SAMPLE: "The worst thing to say in a job interview" | event / awkward / everyday / formal · funnyTargets: feeling, pop_culture / absurd, dramatic / cosmic |
| Spicy | Recipe | SAMPLE: "A text from your future self" | event / dramatic / cosmic / casual · funnyTargets: thing, food / dry, silly / tiny |
| Spicy | Ingredient | SAMPLE: "Senioritis" | feeling / dry / everyday / slang |
| Spicy | Ingredient | SAMPLE: "Your parents discovering emojis" | person / awkward / everyday / casual |
| Spicy | Ingredient | SAMPLE: "A 3 a.m. existential crisis" | feeling / dramatic / cosmic / casual |

---

## 16. Open decisions (TODO-AL) with build defaults

| # | Decision | Build default |
|---|---|---|
| 1 | Online-only, or add local/offline mode | Online (existing) |
| 2 | Bots as Chef | `botsCanBeChef: false` |
| 3 | Reveal the winner's name after the Kiss | `true`; never reveal non-winners |
| 4 | Age verification method and legal text for Hot/Hellfire | Self-attestation plus the DRAFT agreement. **Do not launch adult features publicly until legal text is final.** |
| 5 | Who sets player levels (self, host, parent profile) | Self-declared at join |
| 6 | Final tag taxonomy | Section 5.1 starter lists in `taxonomy.json` |
| 7 | Hand size and mix | **APPROVED 17 Oct 2026:** 7 = 6 on-target + 1 random. Safe slot dropped; wild slot is now random. A safe-slot win is not an automatic dud. |
| 8 | Freshness half-life and boost | 180 days, +0.05 |
| 9 | Monthly drop size, writers and voice | Section 15 guidance |
| 10 | Tie at game-timer end | Co-winners |
| 11 | Paid tier price and billing | Dev flag only |
| 12 | Whether adult-table stats are uploaded | Report as `"adult"` with no IDs, or skip |
| 13 | Final Spice It Up button label | `"Salt and Pepper"` (candidate) |

---

## 17. How to use this with Claude Code (note for Adric)

1. **Put these three files in the repo root:** this file as `SPEC.md`, the Card Writing Rulebook as `CARD_RULES.md`, and the test deck as `cards.json`. Add a short `CLAUDE.md` that says: "Read SPEC.md before any task, and CARD_RULES.md before any card, Laugh Engine or Spice It Up work. Use cards.json as test data. Say Si, never the other term. Follow the spec. Ask before changing the stack. Run the tests before saying you're done."
2. **Ask it to plan first.** Start with: *"Read SPEC.md and inspect the whole codebase. Fill in Section 3 (TODO-ADRIC) from what you find, list anything in the spec that conflicts with the current code, and propose a plan for Milestone M0. Don't write code yet."* Review the plan, then say "go."
3. **Do one milestone at a time.** Don't ask for M1 until every M0 checkbox and test passes. Commit or make a PR per milestone so you can roll back.
4. **Make it prove things.** Ask it to run the tests and show the output. For layout and join bugs, also check on real phones yourself.
5. **Keep TODO-AL decisions with Grandpa Al.** If Claude Code wants to change a rule, a term or a default, bring it to Al. Don't let it decide.
6. **Update the spec, not just the code.** When a decision changes, update SPEC.md (and tell Al so the Master Plan stays in sync)