# History log

Newest first. Entries are written by the docs steward (see the steward link in
NOW.md) and by humans doing the same job by hand. Nothing in this file
describes current behaviour; NOW.md and the state doc do.

## 2026-10-30

- reconciled at `54b6b0e`: NOW.md cut to meet the size audit (16,733 characters against a limit of 16,000). Head and as_of re-stamped; `0825532` and `54b6b0e` were already recorded in NOW.md.
- rolled from NOW.md: the 28 October, after Part B bullet (the cart row for the one-per-design rule says "Each design is one gift, so it stays at one. Nothing was changed.", the plus is served disabled, and `component-cart-items.js` turns it off again after every redraw because Helio's quantity selector re-enabled it).
- rolled from NOW.md: the 28 October, later (live) bullet (Krish's own walk-through found a flickering cart thumbnail, a painting wait that looked broken, a review tickbox above the picture and no way to add a toy or collar, fixed through #59 and #60, record `docs/evidence/2026-10-28-product-cart-live.md`; CoWork Part B held for a design at quantity 2 checking out as 4 because Shopify's checkout merge doubles a design line above one, so every design is kept at one unit).

## 2026-10-29

- reconciled at `1a58ff5`: NOW.md cut to meet the size audit (24,376 to about 15,000 characters). "Where it is right now" now states current position only, and "What changed recently" bullets were shortened. The longer 28 October texts (the PR #65 fix list by area, the #59 and #60 follow-up detail, the example-painting batch detail and the 27 October redesign list) remain in git history at `8da4514` and in the linked records under `docs/evidence/`.
- rolled from NOW.md: the 27 October, later bullet (Christmas reminder capture on the choose screen, the mug reveal opening on the dog's side, an Artist's touch line saying so when its design left the cart, "Not sure" on the home follow-up), and the 27 October CoWork prompt rewrite in three parts (Part A automated in `tools/preview/preview-acceptance.mjs`, Part B production run on 28 October that held for three defects, Part C only on Krish's word).
- `1a58ff5` (CoWork prompt carries Krish's yes up front) touched no product behaviour; NOW.md head re-stamped.

## 2026-10-28

- reconciled on branch `ccr-3d956231-xygpcb` (PR #65): NOW.md no longer says Shopify Payments is accepting payments. It was switched off for the mock orders, and no readback since says it is back on. That is recorded as a finding, and Part 0 of the CoWork prompt reads it back. NOW.md also records that the 27 October prompt spec was applied on 28 October, and that the checkout merge app is kept through Christmas.
- archived: the 28 October CoWork prompt as `docs/history/COWORK-PROMPT-2026-10-28.md`, before `docs/review/COWORK-LIVE-ACCEPTANCE.md` was rewritten for the release.

## 2026-10-27

- reconciled at `785e0d7`: current product scope and economics now have stable `docs/SCOPE.md` and `docs/ECONOMICS.md` paths; dated briefs, prompts and pre-release notes are indexed in `docs/history/README.md`.
- archived: superseded October prompts and module notes now carry explicit Historical banners; `NOW.md` remains the current status and next-action source.

## 2026-10-23

- reconciled at `351c56c`: PR #50 (mug print-proof guard) is merged to `main`; NOW.md no longer says it awaits merge, and marks live deployment as unrecorded.
- stamped at `6710125`: two commits since (`e395228` steward enrolment, `fc48639` harness administration) touched no product behaviour; NOW.md re-dated, no other change.

## 2026-10-22

- reconciled at `6710125`: first NOW.md, written by hand at enrolment in the docs steward fleet.
- archived: `docs/archive/` is this repository's existing archive directory and stays where it is; its index is `docs/archive/README.md`. It holds `AD-BRIEF.md`, `ADMIN-RUN-2026-10-04.md`, `CLAUDE-CODE-PROMPT-2026-10-05.md`, `CLAUDE-CODE-PROMPT-2026-10-05b.md`, `COWORK-PROMPT-2026-10-05-ALL.md`, `COWORK-PROMPT-2026-10-05.md`, `COWORK-PROMPT-2026-10-06-AUDIT-FIXES.md`, `HANDOFF-2026-10-04.md`, `SHOPIFY-BROWSER-PROMPT.md` and `STORE-STATE.md`.
