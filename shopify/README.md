# Shopify theme

This directory holds the theme source and guarded deployment workflow. Current products, configured prices, release state and next action are in [`../NOW.md`](../NOW.md); approved scope is in [`../docs/SCOPE.md`](../docs/SCOPE.md). Earlier four-gift theme instructions have moved to [`../docs/history/SHOPIFY-README-2026-10.md`](../docs/history/SHOPIFY-README-2026-10.md).

Before a theme change, inspect the current source and guarded workflow, identify the exact target revision and theme role, preserve private editor settings, and compare deployed default product templates with the page actually served. Source files alone do not establish a live customer route. Do not deploy from this README.

## Since the 27 October redesign

- Every page carries `hs-brand.css` through the memo strip, which also holds the store-wide switches: `bundle_offer_live` (the bundle saving, off until the automatic discount exists) and `artist_touch_product` (the Artist's touch add-on, hidden until picked).
- `sections/hs-footer.liquid` replaces Helio's footer when the guarded workflow runs with `footer_heartside` ticked (`.github/scripts/footer-heartside.mjs`, never deletes, `--restore` undoes it). `templates/404.json` is Buddy's 404. The 14 retired alternate templates render only `hs-moved`.
- The chat's steps have addresses (`/?step=`); product pages accept `?redo=<design id>` from the cart. See `docs/evidence/2026-10-27-journey-redesign.md`.
- The guarded workflow sets the two memo switches itself: `bundle_offer` (keep, on or off) and `artist_touch_product` (a product handle, or none). Both were switched on with the 27 October go-live (`docs/evidence/2026-10-27-go-live.md`).
- `tools/preview/preview-acceptance.mjs` checks the real store, live or an unpublished theme (`--theme`), the way a buyer meets it, without calling the paid AI or writing to a cart. Run it after every theme push; `live-gate.mjs` adds the layout checks.
- The chat offers one Christmas reminder by email on the choose screen (Shopify's customer form, tags `newsletter` and `buddy-reminder`). Someone must send that reminder before the delivery cut-off.

## 5 November: photo first, each choice once, one painting per gift

Krish's 4 November purchase found three paintings, a second colour choice and the blanket's pattern on every gift. The journey now runs in one order, and every choice is made once (record: `docs/evidence/2026-11-04-photo-first-journey.md`):
- **Home page** (`assets/hs-journey.js`, home mode): the photo, then the look, then the feel, then the gifts.
  - The feel is one tap on four tone cards.
  - The gifts are shown large on real product photos. Each gift's colour or frame is chosen there, once, beside the bundle and the store's own timing ("Order by December 4 for Christmas delivery to a US address").
  - `handOver()` writes the photo-first state (`hs2-review`, `hs_journey.mode = 'photo-first'`, the queue of gift addresses).
- **Gift page** (`snippets/hs-journey-choose.liquid`, `assets/hs-journey-choose.js`):
  - In journey mode (`?journey=1`) the page steps aside for one frame. An inline check sets `hs-jm-on` while the page parses, so the product page never paints under it.
  - The photo goes to Teeinblue by itself, once (hs2.js `journeyAutoSend`).
  - The studio shows for 6 s, then the questions run in the same frame while it paints. Later gifts ask nothing.
  - The reveal shows Teeinblue's own mockups ("On the gift") and the painting up close.
  - One tick and one add. Teeinblue's framing box is saved, never shown.
- **What hs2.js tells the gift page**, as `__hs2api.journeyStatus()`:
  - `checking`, `waiting` and `sent`;
  - `nophoto`: the photo is really not on this device, so one button opens Teeinblue's picker;
  - `picked`;
  - `interrupted`: sent by a page that is gone (a reload, or Back then Forward), so the frame says "The painting stopped" and `journeyResume()` paints again on one tap;
  - `stuck`: the painter never opened in 90 s.
- **The add** waits out hs2's checkout registration (`hs-checkout-image.js`, up to 90 s, which now retries a slow first registration). It shows hs2's words in the dock, and presses once more by itself if hs2 says the copy failed.
- **Taps and layout.** A double tap answers one screen, never the next, and a double tap on a gift card or colour is one tap. The address drops `#ask=` when the questions end. The breed search replaces the list, so a 320 px phone sees its suggestions.
- **Tests:** `tools/preview/journey-flow.browser.test.mjs` (home to cart, six phones and desktop) and `journey-product.browser.test.mjs` (the gift page, including a 9 s painter, a reload mid-paint, a slow checkout copy and a 320 px breed search).

## 4 November: one wait, the painting studio, any gift, four tones

- **Photo step** (`assets/hs-journey.js`, `hs-journey.css`). The photo check runs out of sight: the button reads "Off to the painter" and a passing photo goes straight to the gift page. Only a refused photo is shown, whole on a blurred copy of itself, with Buddy's reason. The dog detector loads while the buyer is on the step and is used only if it is ready, for at most 1.5 s. The tips no longer tick green.
- **Note step** (`hs-journey.js`). `fitNote()` steps the type from 17 down to 13 px so every line and the signature show; on the smallest phones the note scrolls inside its card. The backup lines are one set per tone, and Over the top is labelled **Roast** (the id stays `over_the_top`).
- **Painting wait** (`assets/hs-wait.js`, `hs-wait.css`, `hs-breed-facts.js`, loaded by `sections/hs2-product.liquid` with the painting card). While `hs2.js` says the card is painting, the photo paints in from gray, the dog talks from the studio, a true breed fact appears every third beat, a tap gives a treat, the bar eases and fills on arrival, and the tab title says when it is ready. `hs-breed-facts.js` is generated by `breeds-corpus/lookup/facts.mjs`.
- **Gifts screen** (`assets/hs-journey-choose.js`). Every gift can be unticked, the painted one too; with it unticked, the first chosen gift opens and paints in auto mode and nothing is added from this page.
- **Painting recipes** (`assets/hs-artwork-engine.js`, recipes v18, `tools/print-art/teeinblue/PROMPT-SPEC-2026-11-04-v18.md`). Roast paints a visible roast.
- **Checks.** `tools/preview/wait-room.browser.test.mjs` is new; `journey-flow.browser.test.mjs` checks that every note line shows, and `journey-product.browser.test.mjs` covers unticking the painted gift.

## 3 November: the phone homepage in two screens

- **First screen** (`sections/hs-journey.liquid`). It holds the Christmas offer card, the six-sets reel as the hero, one price line, and the button pinned to the bottom on phones. The offer card shows hs2.js's countdown and "Free US shipping", plus the bundle saving, but only while the memo strip's `bundle_offer_live` is on. The reel is the one `hs-showcase.js` already ran; it now runs every `[data-hss]` block on the page. The button is `.hs-btn-heart` (`hs-brand.css`): the logo heart pink `--hs-heart` with an ink label, pulsing, and still under reduced motion. The old example, intro, time, trust and legal settings stay in the schema, marked retired, so a saved theme still loads.
- **Below it** (`sections/hs-showcase.liquid`). The slider and the strip each have a heading only. Strip cards are one height, the credit is one line that opens to the full credit, and the footer is compact on phones.
- **Head** (`snippets/hs-head.liquid`). It holds every favicon size (byte copies of `design/brand-v4/`), the touch icon, `assets/hs-manifest.json` and the page colour. Tick `head_heartside` on the guarded push: `.github/scripts/head-heartside.mjs` renders the snippet in the layout and switches Helio's single icon and empty colour off; `--restore` undoes it. `/favicon.ico` needs a Shopify URL redirect to `favicon.ico` in Files.
- **Checks.** `tools/preview/homepage-phone.browser.test.mjs` covers four phone sizes. `live-gate.mjs` now also reads the home page head (`--head off` skips it).

## 30 October: the breed examples

- **Showcase.** `sections/hs-showcase.liquid` (with `assets/hs-showcase.css`, `assets/hs-showcase.js` and `snippets/hs-showcase-fig.liquid`) sits under the first screen on the homepage: photo to painting to gift, six dogs in six styles, each gift in three scenes, one dog in four tones, a set per dog. Its pictures are `assets/hs-ex-*.webp`, built by `tools/print-art/showcase-assets.py` from the growth repository's approved set; `design/examples-2026-10-30-showcase/site.json` records each file's source and output hash and its ledger approval. Every picture carries an Example tag.
- The first screen's picture and the journey's six style cards use the same set. The pug and golden gallery (`hs-example-*`) is retired.
- Record and screenshots: `docs/evidence/2026-10-30-showcase/README.md`. Go-live: `docs/review/COWORK-SHOWCASE-GO-LIVE.md`.

## 28 October, before the fixes (#59, #60 and #62 live; #64 merged, not yet pushed)

Records: `docs/evidence/2026-10-28-product-cart-live.md` and `docs/evidence/2026-10-28-examples-live.md`.

- **Painting card.** While Teeinblue paints, a card shows the buyer's photo being painted, lines from their own choices and an eased bar, then reveals the design. The review confirmation sits directly under the finished design, and a blocked Add to cart points at it.
- **Toy and collar.** The product page takes the buyer's words for a toy or collar, which reach the painting, and photos of them for our artist with the Artist's touch.
- **One unit per design.** A design stays at one unit, because Shopify's checkout merge doubles a design line above one. #64 adds the row's own message, "Each design is one gift, so it stays at one. Nothing was changed.", and serves the plus disabled. The PR #65 push ships it.
- **Phone menu and tax line.** The phone drawer shows Heartside's own menu with Shopify's prices. The cart reads "Free US shipping on every order. Any tax is shown at checkout."
- **Example paintings.** The chat section's `examples_on` switch, on in `templates/index.json`, swaps the slider demo's painting at each tone and shows the "Same slider, every gift" strip.

## Since the 28 October fixes (PR #65, merged, not yet pushed)

Record: `docs/evidence/2026-10-28-acceptance-fixes.md`.

- **Photo debug log.** `?hsdebug=photo` on a product page turns on an on-screen "Photo log" (Copy, Clear, Hide) for that tab. It survives the phone's picker and reloads, and `?hsdebug=off` clears it. It records stage names and file facts, never pixels, and sends nothing.
- **Photo limits.** Uploads are capped at 4096 px on the long side, as JPEG 0.92 with the metadata removed (`hs-artwork-photo.js`). The Exif and Photoshop blocks that Safari's encoder writes into every canvas JPEG are cut before the metadata check, which had refused every iPhone and Mac photo because of them. The check still refuses anything from the source photo. Getting a photo ready gives up after 20 seconds and says so in plain words. The on-device check (`hs-photo-quality.js`) has 10 seconds for the whole check, the dog check included, then lets the photo go on. HEIC or HEIF is refused with guidance to choose a JPEG. No WebKit runs offline, so the iPhone test in the CoWork prompt is the proof of the Safari fix.
- **Photo choice card.** A photo the buyer gave Buddy in the chat shows as one card ("Use <dog>'s photo" or "Use a different photo"). Teeinblue's empty uploader is clip-hidden, never `display:none`, while the card shows.
- **Teeinblue chrome.** Its fixed Personalize bar, Preview, form header, upload quota line, "Recustomize image" and success line are hidden or relabeled by `hs2.css` and `hs2.js`. Its agreement box is ticked by our own confirmation and hidden (Krish, 28 Oct).
- **Example until the painting (29 Oct).** Until the buyer's painting is in Teeinblue's preview, the preview shows Teeinblue's sample dog. A gift page reached without the chat keeps the labeled example photo on show until then (`artStage` in `hs2.js`, as the blanket did); after the chat the preview stays on show with its own Example label (`.hs2-product__tag--preview` in `snippets/hs-product-gallery.liquid`).
- **One price format (29 Oct).** The product price, the variant prices and the format line all use `money_without_trailing_zeros` ("$119"), as the product cards and the home page do. The cart still uses Helio's "$45.00" format.
- **Order properties.** Native orders carry `_hs_answers` and `_hs_ship_to` like the older routes.
- **Cart.** `snippets/cart-products.liquid` lists each Artist's touch line under its gift, and `component-cart-items.js` finds rows by line key, not position. The drawer is an overlay.
- **Checkout tiles.** Any photo whose alt text says "checkout tile" is hidden from the gallery, the variant picture map and Buddy's gift fan (`design/checkout-tiles/`).
- **Guards.** The guarded push runs `tools/preview/handle-check.mjs` before writing anything and again after. A broken product address stops the run. A blank variant picture or the heart stand-in only warns there (`--warn-media`), because the push cannot change product media. `.github/workflows/storefront-guard.yml` runs the same check every hour, pictures included, and opens one issue when something breaks. Until CoWork attaches the checkout tiles, it finds the blank pictures and the stand-in, so expect that issue to be open. The check names each blank variant by gift and variant title, and finds the heart stand-in by its file name, alt text or media id (`tools/preview/catalog.mjs`). Both gates now include Krish's Android Edge size (360×640). `tools/preview/live-gate.mjs` fails a product title's lone last word only when that word could have shared a line with the word before it.
