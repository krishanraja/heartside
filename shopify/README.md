# Shopify theme

This directory holds the theme source and guarded deployment workflow. Current products, configured prices, release state and next action are in [`../NOW.md`](../NOW.md); approved scope is in [`../docs/SCOPE.md`](../docs/SCOPE.md). Earlier four-gift theme instructions have moved to [`../docs/history/SHOPIFY-README-2026-10.md`](../docs/history/SHOPIFY-README-2026-10.md).

Before a theme change, inspect the current source and guarded workflow, identify the exact target revision and theme role, preserve private editor settings, and compare deployed default product templates with the page actually served. Source files alone do not establish a live customer route. Do not deploy from this README.

## Since the 27 October redesign

- Every page carries `hs-brand.css` through the memo strip, which also holds the store-wide switches: `bundle_offer_live` (the bundle saving, off until the automatic discount exists) and `artist_touch_product` (the Artist's touch add-on, hidden until picked).
- `sections/hs-footer.liquid` replaces Helio's footer when the guarded workflow runs with `footer_heartside` ticked (`.github/scripts/footer-heartside.mjs`, never deletes, `--restore` undoes it). `templates/404.json` is Buddy's 404. The 14 retired alternate templates render only `hs-moved`.
- The chat's steps have addresses (`/?step=`); product pages accept `?redo=<design id>` from the cart. See `docs/evidence/2026-10-27-journey-redesign.md`.
