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
- **One price format (29 Oct).** The product price, the variant prices and the format line all use `money_without_trailing_zeros` ("$119"), as the rest of the store does.
- **Order properties.** Native orders carry `_hs_answers` and `_hs_ship_to` like the older routes.
- **Cart.** `snippets/cart-products.liquid` lists each Artist's touch line under its gift, and `component-cart-items.js` finds rows by line key, not position. The drawer is an overlay.
- **Checkout tiles.** Any photo whose alt text says "checkout tile" is hidden from the gallery, the variant picture map and Buddy's gift fan (`design/checkout-tiles/`).
- **Guards.** The guarded push runs `tools/preview/handle-check.mjs` before writing anything and again after. A broken product address stops the run. A blank variant picture or the heart stand-in only warns there (`--warn-media`), because the push cannot change product media. `.github/workflows/storefront-guard.yml` runs the same check every hour, pictures included, and opens one issue when something breaks. Until CoWork attaches the checkout tiles, it finds the blank pictures and the stand-in, so expect that issue to be open. The check names each blank variant by gift and variant title, and finds the heart stand-in by its file name, alt text or media id (`tools/preview/catalog.mjs`). Both gates now include Krish's Android Edge size (360×640). `tools/preview/live-gate.mjs` fails a product title's lone last word only when that word could have shared a line with the word before it.
