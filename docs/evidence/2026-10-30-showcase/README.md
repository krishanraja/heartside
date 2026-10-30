# Breed examples in the store, 30 October 2026

Built on `feature/breed-examples-showcase`, from the release branch at `52b5a92` (painter v15). Not merged, not live.

Source: `krishanraja/growth-heartside`, `assets/heartside-examples-2026-10-29` (PR #29, merged), the 24 paintings and 6 bundles Krish approved on 30 October. `tools/print-art/showcase-assets.py` refuses any job the approvals ledger does not mark approved or whose painting no longer matches the ledger's SHA-256.

Screenshots from the local render (`node tools/preview/render.mjs`, real images, Chromium):

- `phone-first-screen.jpg`, `desktop-first-screen.jpg`: the first screen with Maple's mug.
- `phone-showcase.jpg`, `desktop-showcase.jpg`: the showcase section (390 and 1280 px wide).
- `phone-flow-0.jpg` to `phone-flow-2.jpg`, `desktop-flow-0.jpg` to `desktop-flow-2.jpg`: the slider at photo, painting and gift.

Checks run: `showcase-assets.py --check` (27 pictures), the full node test suite, `render.mjs`, `chat.mjs`, `minify-check.mjs`, Theme Check (0 introduced), copy lint (0 introduced). Page weight: 27 pictures, 1.3 MB in total, none over 90 KB; the lazy ones load as the buyer scrolls. No horizontal overflow and no console errors at 390 and 1280 px.

Not verified here: how the page looks on a real phone, in Safari, or on the live store with Helio's header and footer; that is the CoWork run's job.
