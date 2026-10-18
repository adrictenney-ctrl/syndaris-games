# Notes for Claude Code

- Read `SPEC.md` before any Chef's Kiss task, and `CARD_RULES.md` before any card, Laugh Engine or Spice It Up work.
- Use `cards.json` (Al's 17 Oct 2026 blind-test deck) as test data.
- Say **Si**, never the other two-letter term, in code, UI copy, comments and commit messages.
- Follow the spec. Ask before changing the stack (plain HTML, CSS and JavaScript modules; no build step for the site).
- Run the tests before saying you're done: `node --test "tests/*.test.mjs"`.
- Chef's Kiss cards are edited in `content/chefskiss/*.txt`, then `node tools/build-chefskiss-cards.mjs` writes `js/chefskiss-db.js`.
- Deploy with `bash deploy-cloudflare.sh`, and commit and push to GitHub.
