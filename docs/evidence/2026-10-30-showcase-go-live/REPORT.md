# Showcase go-live report, 30 October 2026

The run of `docs/review/COWORK-SHOWCASE-GO-LIVE.md` from `main` at `3f1f28b`. Krish approved every step in one message: "get going with everything end to end with full approval". Every picture named here is an Example. None is a customer, an order, a review or a result.

## Verified by readback

### Part 1: the theme and the blocks

1. **Gate on the draft theme ("Heartside 28 Oct fixes").** The first gate failed on three phone widths (phone, Instagram, Edge). On the journey's first screen, the headline started at 32px under a header that ended at 92px: Helio laid its transparent header over the home page's first section. hs2.js clears that overlap for the old hero, but the journey had nothing equivalent.
   - **Fix applied:** turned off "transparent header on the home page" in the draft theme's header settings (`sections/header-group.json`, `enable_transparent_header_home: false`; nothing else changed). The theme editor owns that file, and the push workflow keeps it, so the fix stays in place.
   - **Result:** `live-gate.mjs` on the draft ended "all clear". `handle-check.mjs --theme <draft> --warn-media` ended "all clear (18 checks, 1 picture warnings)". The one warning was the blanket's blank variant picture, which step 6 fixed.
2. **Theme published.** "Heartside 28 Oct fixes" replaced "Copy of Heartside launch" as the live theme. The old theme is still in the theme list as a draft, so publishing it again rolls this back.
   - **Live homepage readback:** HTTP 200, theme name "Heartside 28 Oct fixes", first-screen picture alt "Example: Maple, a golden retriever, in a play bow…".
   - **Showcase section:** present, with 28 figures. Every figure has an Example tag and alt text.
   - **Live gate:** `live-gate.mjs` on production ended "all clear".
3. **Teeinblue prompt blocks, read back with nothing changed.** Each campaign's saved prompt was hashed with SHA-256:

| Campaign | Characters | SHA-256 | Spec |
|---|---|---|---|
| Mug | 1216 | `d760818e269faeec49aa4f0e636656aa00c9aaec03bfa98575ea0d9adc337bc5` | match |
| Portrait | 1143 | `dddbf245f588aea4487a9da1dc4c0da6dafa5ce5d2d98c634a4d71ab8b39f6cd` | match |
| Blanket | 1394 | `b6aa708e8737f483362f99d8433b50dd4282e480a11df5f882e20f453a5d0108` | match |

   The campaign behind "Update required: 1" is **"The Morning Mug"**, a legacy campaign tagged v3 and published 14 October. I pressed nothing on it.
4. **Handles and guard.** `handle-check.mjs` was run after every Shopify and Teeinblue change. The final run ended "all clear (18 checks)" with no picture warnings. I ran the storefront guard by hand from the Actions tab (run #13, green), and the scheduled run #14 after the media changes was also green.

### Part 2: the artwork

The sources are the 1080 × 1350 full-size files in `krishanraja/growth-heartside` (`assets/heartside-examples-2026-10-29/mockups/…`). All 11 matched `source_sha256` in `site.json`. Every alt text is the `alt` string from `site.json`.

| Product | 1 | 2 | 3 | 4 | Kept after them |
|---|---|---|---|---|---|
| Mug | `scene-mug-home` | `scene-mug-studio` | `flow-gift` | `set-golden` | none |
| Blanket | `scene-blanket-home` | `scene-blanket-studio` | `scene-blanket-hand` | `set-lab` | blank tan blanket reference (the theme hides it) |
| Portrait | `scene-portrait-home` | `scene-portrait-studio` | `scene-portrait-hand` | `set-lab` | blank unframed print reference, checkout tile |

**Variant pictures:**
- **Mug:** Black uses `scene-mug-home`. Dark Blue, Dark Green, Pink and Red have no picture of their own, so they show the product's first picture.
- **Blanket:** the one variant uses `scene-blanket-studio`, as the prompt asks. The blank-base warning is gone.
- **Portrait:** Framed / Black uses `scene-portrait-home`. Red Oak, White and Unframed have no picture of their own.
- **Why some variants have none:** the approved set shows only a black-handled mug and a black frame. Giving those pictures to other colours would show the wrong colour.

**Blanket variant option:** "Available Product" reads "Heartside Personality Blanket". I left it unchanged, as the prompt says.

**What was replaced.** I detached these from the products but did not delete them, so they are all still in Shopify Files. Local copies are in the session evidence.
- **Mug, 10 pug pictures:** black, pink, red, dark blue and dark green inside, handle-left and handle-right of each. Files `6ae3bebba1288`, `6ae3bec08fbff`, `6ae3bec5737ab`, `6ae3beca6b7bd`, `6ae3becf55537`, `6ae3bed46cec2`, `6ae3bed99a093`, `6ae3bedecf13b`, `6ae3bee403d9b`, `6ae3bee917fce` (.webp).
- **Portrait, 5 pug pictures:** white, black and red oak frames, a held black frame, and unframed. Files `6adf2504bc174_…`, `6adf25082493a_…`, `6adf250b670c5_…`, `6adf25019cba1_…`, `6ae0433aaaee2` (.webp).
- **Blanket:** nothing removed. The blank reference was moved to last place.

Product pages on production at phone width: HTTP 200, each opens on the new Example picture, and the Example tag shows.

**Teeinblue personaliser default (step 8):**
- **Mug: done.** Before, the Photo layer's default was the pug. It is now Maple's approved painting (`paintings/golden-warm-mug.png`, the `hero-mug` source in `site.json`), cropped to the layer's own 2700 × 1050 shape so the AI output ratio is unchanged. The layer still measures 2700 × 1049 at 0,0, and the prompt hash is unchanged.
  - **Why not the `studio` mockup the prompt names:** that is a photo of a mug, and as the artwork on a mug it would show a mug on a mug.
  - **Update:** pressed with every sync box unticked, including all four Variants sub-boxes. Readback: "Your design" on the live mug page shows Maple, and the blanket title and price are still "Your Dog's Personality Blanket" at $129.
- **Portrait: saved in Teeinblue but not live.** The default is now Bear (`crops/lab-warm-portrait-4x5.png`, the `style-cinematic` source, cropped to 2:3). The layer is still 3600 × 5400 at 0,0, and the prompt hash is unchanged.
  - **The Update failed** with this Shopify error: "Handle 'your-dogs-portrait' already in use. Please provide a new handle." The live personaliser still shows the pug.
  - **Likely cause:** the campaign is linked to a second Shopify product, the draft "Your Dog's Portrait" at `heartside-unframed-portrait-reference`. Teeinblue tries to give it the clean handle.
  - Nothing else changed, and the handle check stayed all clear.
- **Blanket: left as it is.** The personaliser default is the plain blank blanket, which shows no pug. The approved set has no blanket painting in `site.json`.

**Step 9, collections, homepage and navigation:** the collections have no images. The menus are text links only. The two pages carry no pictures. The live homepage has none of the old pictures.

**Step 10, search:**
- **Pages checked:** the home page, the chat view (`?view=chat`), both collections, the three product pages, the cart, a missing page (404), the Answers blog and the Artist's touch page. I checked both the server HTML and the rendered pages.
- **Result:** no old pug, golden puppy, `hs-example-*` or Pickle picture is visible to a buyer.
- **Still present but out of scope:**
  - The portrait personaliser default (the pug), described above.
  - Teeinblue's own mug and portrait thumbnails still show the pug, but the theme hides them (0 × 0, not visible).
  - The live theme still holds unused old assets that nothing references: `hs-example-*` (8), `hs-photo-pug-*`, `hs-window-pug`, `hs-ornament-pug`, plus their golden counterparts. Older pushes kept them because they never delete files.
  - The "The Morning Mug" Teeinblue campaign still exists.
- **Checkout and email pictures:** checkout draws each line with the variant's picture, or the product's first picture when the variant has none, and both are now new Examples. I did not read the email templates: the Admin API does not expose them.

## Not done, and why

- **Step 11: the phone walkthroughs.** These need Krish's phone and his recording, so there are no clock times.
- **Step 12: test personalisations on the four tones.** This needs Shopify Payments switched off for the Bogus Gateway on the live store. That would stop real buyers paying during the window, and it means typing test card numbers into production checkout, which I may not do on a live store. It would also generate eight paintings and leave Printful drafts to clear up. Krish runs this step himself.
- **Step 13** follows step 12.
- **Portrait personaliser default:** blocked by the Teeinblue handle conflict described above.

## Repository changes not on `main`

The session's git push is refused for this repository. The commit `Journey: clear Helio's transparent header on the first screen` (shopify/assets/hs-journey.js, +29 lines) is on the local branch `fix/journey-clear-header` and in `heartside-journey-header.bundle`. It makes the journey clear the header on its own, so a theme that turns the transparent header back on stays right. All 786 offline tests pass, as does `minify-check`.
