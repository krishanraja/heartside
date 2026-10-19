# Claude Code, 19 October (second session): preview fix, footer note, mug images, order QC

North Star: "Heartside is the gift US dog owners reach for first when they want something that sounds like their dog."

- The preview fix moves it most. A buyer now sees their own dog's words on the gift before paying.
- The mug images and "pit" move the same part: the product page matches what prints, and more owners see their dog's breed named.
- The order QC supports "$10,000 is an ordinary month". Every mug is checked with no dependence on a connector.
- The footer note moves no part of the North Star. It carries out Krish's ruling on naming the companies.

Krish said yes to the deploy and the mug images in this session; both are done (see "Done on Krish's yes" at the end).

## 0. "pit" shows Pit Bull

`KRISH_CALLS` in `breeds-corpus/lookup/build.mjs` now has "pit" beside "pit bull", "pitbull" and "pittie". `node build.mjs` rebuilt the lookup; the Pit Bull test now covers "pit" and "Pit" and counts 4 calls. **10 of 10 tests pass.** "pit mix" still falls back to Mixed Breed, as every mix does.

Ruling (Krish, 2026-10-19): add "pit".

## 1. The ornament preview showed Teeinblue's sample

**The cause was not the events.** I reproduced it on the live store (heartside.io, phone size, chat as Biscuit with chips, then the ornament page):

- Teeinblue's fields held the chat's words: Dog's name "Biscuit", Line 1 "Your shadow, always.", Signed "Love, Biscuit".
- `teeinblue.getCurrentCustomization()` held the same words, and so did the SVG Teeinblue draws its preview from.
- Teeinblue's Preview button showed "Biscuit / Your shadow, always. / Love, Biscuit", both 4 s and 15 s after the page loaded.
- The bridge already sets each field through the native value setter and fires `input` and `change` (`hs2.js` `setValue`).

What the buyer saw was the **big gallery picture**. Gift pages are set to open on the product photo (`open_on: photo`) until the shopper adds their own photo. The product photo is Teeinblue's sample ("Bartholomew Jr", "Will ride anywhere, as long as it's with you."). The live preview sat behind the "Yours" thumbnail. `ornament-before-fix.jpg` shows it.

**Fix (`hs2.js`, `tibGallery`):** when the chat has handed this gift its words, the gallery shows Teeinblue's live preview as soon as it arrives. If the shopper has tapped a product photo, their choice stays. A shopper who lands on a gift page without the chat still opens on the photo, as before.

Why this fix and not the one asked for: the asked-for fix (firing events) was already in the code, and the evidence showed Teeinblue had the words. Adding more events would have changed nothing the buyer sees.

**Proof, live store with the fixed `hs2.js` served in place of the live one** (a browser-side swap, nothing deployed), for ornament, mug and blanket (`gift-pages-preview-after-fix.jpg`):

- The gallery opens on the preview (`data-show` cleared) with the chat's words: the ornament shows "Biscuit / Your shadow, always. / Love, Biscuit". The blanket shows all four lines and the signature. The mug opens on its dog face, and its second slide shows "Waits at the door for / you, weekends too.", "Steals your side of the bed.", "Your shadow, always." and "Love, Biscuit" (`mug-note-face-after-fix.jpg`).
- The Preview button shows the same words on all three.
- One thing remains for Krish to know: Teeinblue's own small thumbnails inside its gallery still show its sample text. They are Teeinblue's mockup thumbnails, not the buyer's preview, and the theme doesn't draw them.

## 2. Company note in the footer

"Heartside is a Mindmaker LLC company. Mindmaker Ltd in the UK." These are the exact words, with no numbers, addresses or jurisdictions.

- `shopify/sections/hs-company-note.liquid`: 11 px, the theme's muted text colour (60% of its lightest palette colour) on the footer's #0f0f0f. That is the smallest text in the footer; the copyright is 12 px. The words are fixed in code, not a setting, so they can't drift.
- Helio's footer group lives only in the theme, not the repo. So, as with the memo bar in the header, the theme push has a new option **`footer_company_note`**. It copies the theme's own `footer-group.json` from the backup and adds the note last (`.github/scripts/footer-note.mjs`). Running it again changes nothing.
- Proof: the note inserted under the live footer in a headless browser at 390 and 1440 px (`footer-note-390.jpg`, `footer-note-1440.jpg`). `theme-check`: 0 offenses.

## 3. Mug images with the new curve

- `tools/realphoto/build_shopify_mug_inputs.py` rebuilds both inputs, now committed in `design/teeinblue/mug-v3/shopify-images/`:
  - the print file: Biscuit's sample cut-out and the live images' words, drawn with `mug_qc.py`'s own layout;
  - the shaded bases: `mk-*-base.png` plus `mk-*-shade.png`.
- `shopify_mug_images.py` falls back to that folder when Printful's photo isn't available.
- `mug_qc.py` on the print file: **PASS. Lines 1, 2 and 3 and the signature each match at 1.00**; file, not blank, breaks, inside, photo cut out and photo whole all ok.
- Boards: `mug-images-before-after-phone.jpg` (both faces at 390 px, live above, new below) and `row-compare.jpg` (the note face close up). The lower rows now bow more toward the base, as the mug does.
- **Stopped here.** On Krish's yes: upload `the-morning-mug-outward.jpg` and `the-morning-mug-drinker.jpg`, make the dog face the featured and variant image, delete MediaImage 71718546637182 and 71718546669950, and untick Images on any Teeinblue Update.

## 4. Order QC on GitHub Actions

- `.github/workflows/order-qc.yml` runs `tools/qc/order_qc.py` at 07:56 and 16:56 London time:
  - It fetches unfulfilled orders from the last 14 days with no qc tag.
  - It runs `mug_qc.check` on each mug's `_tib_design_link_1` with that mug's Line 1 to 3 and Signed.
  - It tags `qc-pass` or `qc-hold` and adds one note line, keeping the buyer's note.
  - On any hold it opens a GitHub issue assigned to Krish (GitHub emails him and notifies him in its app), with the cards as a run artifact.
- **Clock change:** four cron slots (06:56, 07:56, 15:56, 16:56 UTC). A step runs only the slot that matches London's offset that day. It reads the slot from `github.event.schedule` rather than the time, so a late start still runs. Checked for July and December: exactly one slot runs at each London time.
- **Never confirms** anything in Teeinblue or Printful; the token is `read_orders` and `write_orders` only. Orders with no mug are left untagged, and a mug whose print file isn't there yet is retried next run.
- **Schedule off:** the cron lines are commented out. A manual run defaults to dry run, which checks and reports but tags nothing.
- **Krish's steps:** `tools/qc/ORDER-QC-SETUP.md` covers the custom app with the two order scopes and the `SHOPIFY_ORDERS_TOKEN` repository secret. The token goes only into GitHub's secret field.
- Tests: `test_order_qc.py` uses a stand-in Shopify (no network) and real print files: 11 of 11 pass. `test_mug_qc.py` still passes.
- Why GitHub issues for the alert: they need no new secret or service, and Krish already gets GitHub notifications for his repo.
- Not run against the real store: there is no token yet. The Shopify API version is `2026-07` (env `SHOPIFY_API_VERSION` to change); the first dry run will show if it needs moving.

## 5. Printful Christmas cutoff

"Order by Dec 10 for Christmas" stays on all gifts. Printful's 2026 guide gives Dec 11 for US-made home items to the US and Nov 26 for anything made outside the US, and the sherpa blanket can be made in the US, Europe or Latvia. `hs3.js` has a TODO beside the line: on the first blanket order, check which facility Printful routes it to.

## Checks run before the PR

`tools/preview`: render, chat (all), minify-check, mug-bridge and theme-check all pass. Breed tests: 10 of 10. `test_order_qc.py`: 11 of 11. `test_mug_qc.py`: all pass. No em dashes in any added file.

## Waiting on Krish

1. Yes to deploy the theme (`hs2.js` preview fix, `hs3.js` TODO comment, the footer note with `footer_company_note` ticked).
2. Yes to replace the two Shopify mug images.
3. The Shopify custom app and the `SHOPIFY_ORDERS_TOKEN` secret, then a dry run, then switching the schedule on and the Claude task off.

## Done on Krish's yes (19 Oct, same session)

**Theme deploy:** "Push homepage to a Shopify theme" run 50 (https://github.com/krishanraja/heartside/actions/runs/39216613271) ran from `claude/adoring-cerf-ybph82` at 64369c4, because main was not to be pushed. It went to "Heartside launch" (#197492998526) with `allow_live_theme` and `footer_company_note` ticked, and every step was green. Observed afterward:

- The footer note "Heartside is a Mindmaker LLC company. Mindmaker Ltd in the UK." is on heartside.io and on `/policies/privacy-policy`.
- The live `hs2.js` has the gallery fix. The real chat as Biscuit, with no patched files, opened the ornament page on the buyer's preview: "Biscuit / Your shadow, always. / Love, Biscuit" (`data-show` = preview).

**Mug images:** I uploaded the two new images through a Shopify staged upload, then attached them with the same alt text. The new dog face (MediaImage 71759779692926) is first, the featured image, and the variant image. The new note face (71759779725694) is second. MediaImage 71718546637182 and 71718546669950 are deleted. `/products/the-morning-mug.json` now lists only the two new images. When anyone next presses Update in Teeinblue for the mug, untick Images so Teeinblue does not put its own back.

**Note:** main does not have this branch yet, so the live theme is ahead of main. Merge the PR before the next deploy from main, or that deploy would undo the preview fix.
