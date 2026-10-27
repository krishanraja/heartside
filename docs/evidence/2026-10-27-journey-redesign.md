# Journey redesign, 27 October 2026

What changed on the storefront, why, and what is proved. Branch `claude/eager-cray-mi55gq`; nothing here is deployed. The owner's requests and rulings are in the commit bodies (`Ruling (Krish, 2026-10-27): ...`).

## The problems, as found live on 27 October

- **A site within a site.** Helio's header and menu over our memo and a second ribbon; product pages in Helio's frame with its black "Powered by Shopify" footer; Helio's grey cart.
- **Glitches.** The chat zoomed itself to fit the window and locked the page; every re-render replayed animations; the first screen flashed before a saved step; `clearHeader` re-padded the page on every resize and load; Helio's cross-document view transitions flashed between pages.
- **Back.** No history: the browser's Back left the site mid-chat, and the in-app Back erased the previous answer.
- **Image click.** A thumbnail click blanked the main photo for about 600 ms, dropped its srcset and switched the box between the preview's shape and a square crop. The blanket page opened on the blank technical image (its hard-coded id had gone stale).
- **Stale truth.** The chat drew the retired white photo-and-note mug, used the old product names and fallback prices, showed a four-line note where one line prints, and every product page said "Shipping calculated at checkout" while free US shipping applies.

## What the branch does

| Area | Change | Proof |
| --- | --- | --- |
| Chrome | `hs-brand.css` (brand-book tokens) on every page through the memo strip; Helio's header restyled cream, menu and search hidden, cart and account kept; `hs-footer` replaces Helio's footer behind the `footer_heartside` workflow input; Buddy 404; 14 retired templates render `hs-moved` | footer-heartside, moved-templates, editor-edits, memo-shipping tests |
| Journey | Every step at its own address (`/?step=`); Back and Forward keep answers; reload keeps the step; resume on the first screen; stale links clamp; no zoom, no lock; animations only on a new view | history-routing.test.mjs (real Chromium, source and minified) |
| Products | Prices, photos and URLs from Shopify; the real range on the first screen labelled Example; the reveal shows the product photo, the buyer's photo, the one printed line and "What I'll paint" | blanket-route, candidate-reveal tests; rendered QA |
| Gallery | One stage for preview and photo; swap only after decode, srcset kept; blank technical image hidden by alt | gallery.browser.test.mjs fails on the old swap, passes now; blanket-gallery test |
| Product page | Buddy's bar and the journey card with Change links back to each chat step; a direct visit gets Buddy's offer; prefill loop guard | product-journey, bridge-guard tests |
| Photos | On-device check before any upload (hard rejects, "It's my dog" override, fails open); toy and accessory facts | photo-gate, photo-quality tests |
| Conversion | Story beats, "Try the slider" demo, Christmas countdown, several gifts together, bundle line behind one memo switch (off), cart saving only as Shopify applied it | blanket-route bundle cases |
| After the cart | One redo per gift (old line removed only by the buyer); Artist's touch add-on (hidden until the product exists); Buddy's empty cart | redo, artist-touch tests |
| Truth | "Free US shipping on every order." everywhere; portrait "Framed or unframed" and both prices; cart "Format" | core-native, native-completion tests; copy-lint |

Rendered QA (tools/preview, Helio and Teeinblue as stand-ins) at 390x844 and 1280x900: no sideways overflow, html and body never locked, the first screen's button at 670 px, the "Show me" step's at 818 px and the reveal's at 827 px on a phone. On a product page the first action is Buddy's (or the photo step after the chat); Add to cart sits below the personalizer, as it must, because it needs finished artwork.

## Not proved here

- The real Teeinblue form and preview, Helio's real header and cart, and Shopify's morph behaviour: the preview uses captured stand-ins. The photo gate and metadata stripping rely on Teeinblue's photo input selectors; a CoWork check on the preview theme must confirm they still match.
- Any AI call: the chat's n8n calls were blocked in every test.
- File properties on the Artist's touch line (Shopify's size limit), the bundle discount itself, and the redo through a real checkout.
- Physical print quality: still Krish's sample.

These are the preview-theme checks in `docs/review/COWORK-LIVE-ACCEPTANCE.md`, Part A.

## Decisions still with Krish

1. The Artist's touch price (modeled $29 at about 20 minutes) and creating the product.
2. The bundle conditions per basket (two mugs alone fail the 30% floor in every cost set; see `2026-10-27-bundle-economics.md`) and creating the discount.
3. Whether the Artist's touch may name him (the copy says "our artist": founder visibility is his open decision).
4. Whether the six Drive dog photos may be public, so the photo-check fixtures can be committed.
5. The mug at $45 sits below the 30% floor in every modeled case.
