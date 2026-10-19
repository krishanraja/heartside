# Claude Code, 19 October: the gifts-from-your-dog launch goes live

North Star part this moves: "Heartside is the gift US dog owners reach for first". Before today heartside.io opened on the v2 poster page and the four gifts sat behind `?view=gifts`. After today the chat with Biscuit is the first thing a US dog owner sees, and it leads straight to the four Active gifts.

Product data, Teeinblue, prices, discounts and Printful settings were not touched.

## 1. The Cowork branch landed

- https://github.com/krishanraja/heartside/pull/14 opened from `cowork/2026-10-15-launch-prep` against `main`, merged as c5f687a.
- Checked before merging: exactly the six expected paths (`breeds-corpus/us_display_names.csv`, `breeds-corpus/us_lookup_additions.csv`, `docs/SYNC.md`, `docs/evidence/cowork-2026-10-15b/REPORT.md` and the two image boards). No theme code.
- Why a merge commit: it keeps Cowork's three commits as they were pushed, so their report still points at real hashes.

## 2. Biscuit's mug reasons

`reasonFor('mug')` in `shopify/assets/hs3.js` now picks one of the six reasons from the Cowork report (section 3), keyed by `S.together`. `{dog}` is `n.dog` and `{rec}` is `n.rec`.

- A typed "together" answer, "Not sure" or no answer uses `skip`. A compose reason still wins first, because the existing check above the table returns `S.composed.reason` whenever compose recommended this gift.
- Why: the old line said "Walks start with coffee" for walk and coffee and nothing for the other four answers, so most buyers got a reason that did not repeat what they told Biscuit. Each new reason only repeats the buyer's own pick.
- Length, measured on the rendered reveal with two 14-character names (`Abcdefghijklmn`, `Opqrstuvwxyzab`): walk 130, coffee 110, movie 118, naps 108, car 122, skip 105. All within the 140 limit. Cowork measured 121 for the longest; the difference is that I used 14 characters for both names. Still 10 under.
- Observed: a browser check set each answer (walk, coffee, movie, naps, car, skip, typed, none) and read the reveal bubble. Each showed its own reason; typed and none showed skip.

## 3. Breed lookup

- `node build.mjs` rebuilt `breeds-corpus/lookup/hs-breeds.js` (47,550 bytes).
- `test.mjs`: the count for "every query in us_lookup_additions.csv" is now 44.
- `node test.mjs`: **10 tests passed**, 0 failed.
- The lookup is still not loaded by the theme (Krish, 15 Oct: no breed question yet), so this changes nothing shoppers see today.

## 4. The homepage swap

- `shopify/templates/index.json` is now a copy of `index.gifts.json` (the `hs3-chat` section with the four products and the ornament bundle on). The v2 homepage is kept, unchanged, as `index.classic.json`, which opens at `heartside.io/?view=classic`.
- Why a copy and not a theme-editor template assignment: the homepage can only be `index.json` in Shopify, and keeping the old file under a new name means rolling back is one copy and one deploy.
- `tools/preview/render.mjs` now reads `index.classic.json` for the v2 previews, so those checks keep testing the same page. No other theme code changed.
- `shopify/README.md` says the chat is the live homepage.

Checks before deploy, all in `tools/preview`:

| Check | Result |
|---|---|
| `node render.mjs` | all 19 pages rendered |
| `node chat.mjs` (360, 390 and 430 px; chips, typed, AI refused, AI slow, all "Not sure", share card, no products, banned words) | all passed |
| `node minify-check.mjs` | hs3.js and hs2.js minify cleanly |
| `node hs3-lines.mjs` | all passed |
| `node mug-bridge.mjs` | all passed |
| `node mockup-gate.mjs` | all passed |
| `node theme-check.mjs` | 0 offenses in Heartside files |

**Deploy:** merged as https://github.com/krishanraja/heartside/pull/15 (b307cc1), then pushed by "Push homepage to a Shopify theme" run 49 (https://github.com/krishanraja/heartside/actions/runs/39209036407) to the live theme "Heartside launch" (#197492998526) with allow_live_theme ticked. Every step was green, including the backup artifact and the theme-editor guard. It finished at 06:17:52 UTC on 19 October.

Observed on the live site right after the run:

- `https://heartside.io/` returns 200 and serves the chat (`data-hs3-start`, `hs3.js`). None of the v2 hero is in it.
- `https://heartside.io/?view=classic` returns 200 and serves the v2 homepage (`hs2-hero`).
- The live `hs3.js` (`/cdn/shop/t/2/assets/hs3.js`) contains "lives for the morning walk" and no longer contains "Walks start with coffee".

**For Cowork:** the deploy has finished. Run the cart tests (Mug + Ornament shows the ornament at $19; Ornament alone $24; line titles clean; empty the cart afterward) and the chat-to-product-page checks (Part B steps 4 and 5).

## 5. "Order by Dec 10 for Christmas"

Kept as it is in the choose screen. Why: Printful's 2026 guide gives Dec 11 standard and Dec 16 express for US-made home and living accessories, so the mug, the print and the ornament have a day of margin at least. The blanket is the one gift the guide does not name. Cowork is checking its cutoff in the Printful dashboard. If that comes back earlier than Dec 10, the line gets gated per gift (shown only when the cart or selection holds no blanket, or reworded to name the blanket's own date). Nothing to change until Cowork reports.

## 6. Open items for Krish

- **"pit" on its own** is not in `KRISH_CALLS`. Cowork recommends adding it beside "pit bull", "pitbull" and "pittie". It is your call and you have not ruled, so "pit" still falls back to "we don't know the breed".
- **Blanket Christmas cutoff:** waiting on Cowork (item 5).
- The breed gap list in `breeds-corpus/lookup/README.md` is updated (19 Oct): fixed, still open on purpose, and "pit" waiting on Krish. Checked by running each name through `hs-breeds.js`.

## What moved

The North Star's "gift US dog owners reach for first" now has its front door: heartside.io opens on the chat that ends in the four gifts, with Biscuit giving each mug buyer a reason that repeats their own answer.
