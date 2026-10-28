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

## Since the 28 October fixes (PR #65, merged, not yet pushed)

Record: `docs/evidence/2026-10-28-acceptance-fixes.md`.

- **Photo debug log.** `?hsdebug=photo` on a product page turns on an on-screen "Photo log" (Copy, Clear, Hide) for that tab. It survives the phone's picker and reloads, and `?hsdebug=off` clears it. It records stage names and file facts, never pixels, and sends nothing.
- **Photo choice card.** A photo the buyer gave Buddy in the chat shows as one card ("Use <dog>'s photo" or "Use a different photo"). Teeinblue's empty uploader is clip-hidden, never `display:none`, while the card shows.
- **Teeinblue chrome.** Its fixed Personalize bar, Preview, form header, upload quota line, "Recustomize image" and success line are hidden or relabeled by `hs2.css` and `hs2.js`. Its agreement box is ticked by our own confirmation and hidden (Krish, 28 Oct).
- **Order properties.** Native orders carry `_hs_answers` and `_hs_ship_to` like the older routes.
- **Cart.** `snippets/cart-products.liquid` lists each Artist's touch line under its gift, and `component-cart-items.js` finds rows by line key, not position. The drawer is an overlay.
- **Checkout tiles.** Any photo whose alt text says "checkout tile" is hidden from the gallery, the variant picture map and Buddy's gift fan (`design/checkout-tiles/`).
- **Guards.** The guarded push runs `tools/preview/handle-check.mjs` before writing anything and again after. A broken product address stops the run. `.github/workflows/storefront-guard.yml` runs the same check every hour and opens one issue when something breaks. Both gates now include Krish's Android Edge size (360×640).
