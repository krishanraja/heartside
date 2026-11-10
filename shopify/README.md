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

## 10 November: search and AI answers (SEO and GEO)

- **Structured data** (`snippets/hs-schema.liquid`):
  - every Offer carries free US shipping, with its 2 to 5 handling days and 3 to 7 transit days;
  - the Organization carries a contact point and the topics it knows;
  - the homepage graph adds an FAQPage drawn from the live policies;
  - the Answers library (`sections/hs-answers-index.liquid`) lists every article as a CollectionPage. Tests: `tools/preview/core-schema.test.mjs`.
- **`/llms.txt`** (`templates/llms.txt.liquid`) adds the savings, the card, the Christmas date, the styles and tones, every Answers article, four quotes from "What people say", and the help chat.
- **Set in Shopify, not in this repo** (Admin API, 10 Nov):
  - SEO titles and descriptions on the four products, the All gifts collection (with a description), the Answers blog and the contact page;
  - `seo.hidden` on the empty frontpage collection and on `/pages/card`;
  - 13 new Answers articles (source: `content/answers/2026-11-10-answers.py`), each with its own search description;
  - the December 4 date in the Christmas gift article.

## 10 November: the help chat in the corner

- **What people say** (`sections/hs-reviews.liquid`, `assets/hs-reviews.css`, `hs-reviews.js`) sits under the showcase on the homepage.
  - It holds nine quotes in the people's own words (blocks in `templates/index.json`). A block's photo is optional: add it in the theme editor, only with the person's permission; without one, the card shows their initials.
  - It moves one card every 6 s and loops. It stays still on hover, focus, touch, a hidden tab and the Pause button, and never moves under reduced motion. Swipe and the arrows always work.
  - `copy-lint.mjs` skips a quote's headline and words, since they are the customer's words, not ours.
  - Tests: `tools/preview/reviews.browser.test.mjs`.
- **The help chat's phone sheet** closes with a drag down from its header. Its handoff button shows Sending, then Sent, and Try again if the send fails. Both ideas were borrowed from 21st.dev components and written in plain JS, with no React.

- **Help chat** (`snippets/hs-help.liquid`, `assets/hs-help.js`, `hs-help.css`, `hs-help-agent.svg`; `n8n/HELP-CHAT.md`). The memo strip renders it on every page except the printable card.
  - It shows only while the memo strip's **Help chat address** setting holds the n8n webhook. The guarded push writes that address from the `HS_HELP_CHAT_URL` secret (`help_chat: on`), and `off` clears it.
  - Chips answer at once from the policies. Typed questions go to Claude through n8n. A person is one tap away, by email within 6 hours, through jonny@heartside.io.
  - It says it is an automated assistant.
  - It lifts above the journey dock, the sticky button and the next-gift bar.
  - Tests: `tools/preview/help.browser.test.mjs`.
- **The guarded push now ignores** `apps/` (the customer-account order-painting app, deployed with the Shopify CLI) and `notifications/` (email snippets pasted in admin).

## 5 November, evening: Krish's five asks (live since 19:33 UTC)

Built in parallel from `docs/review/asks-2026-11-05/` (PRs #122 to #129). Record: `docs/evidence/2026-11-05-roast-and-place.md`.

- **Where the dog rules the house** (`assets/hs-journey.js`). The home page asks it after the feel: `HOME` is photo, look, tone, spot, gifts. `handOver()` sends `hs_brief_input.spot` to the painter, and recipes v21 stage that place for every tone (`tools/print-art/teeinblue/PROMPT-SPEC-2026-11-05-v20.md`). The gift page no longer asks it; a journey begun before the change still does, for the note. Back to the gifts with the same photo, look, feel and spot keeps the journey, so nothing paints twice.
- **Roast winks** (recipes v21, `PROMPT-SPEC-2026-11-05-v21.md`). Roast has its own face rule (`brief.likeness.faces`); the other tones and the blanket keep the calm face.
- **Cart first** (Krish, 6 November; `docs/RUNBOOK-cart.md`):
  - A failed checkout picture no longer blocks the add (`hs2.js` `prepareCheckoutCart`, `designedAdd`). The saved design goes in, and checkout shows the gift's own photo instead.
  - An add with no Teeinblue design reference is still refused.
  - Shopify's app proxy turns every 5xx from the registration workflow into its own 500 page, so `hs-checkout-image.js` asks again on a 500, inside its 90-second budget.
- **Text never sprawls** (Krish, 6 November): the line under a title takes two lines at most, and the gift page's dock line one (`.hs-jm__line` is 18 px). The reveal's line is short so the picture gets the room, and the tick is centred on phones.
- **Buddy guides the journey** (Krish, 6 November: Buddy "instead of these stupid paw emojis", then "buddy in a classy way and dont just shoe horn him in"):
  - He says the line under each question, on the home steps and the gift page's questions (`hs-journey.js` `host()`): his head in a small cream circle beside the line that was already there, so no screen gains a box. On the smallest phones that line is hidden, and so is he.
  - In the studio he is the speaker (`hs-wait.js`, "Buddy, at the studio"): he tells the buyer how their dog is getting on, by name, from what they told us, and never names a food, toy, object or place they did not mention. The drifting icons and the paw are gone; a tap on him brings his next line.
  - One Buddy on a screen: while he talks in the studio's bubble, the line under the title is said without his face (`hs-journey-choose.css`).
  - His drawing is one copy, `snippets/hs-buddy.liquid`, put on the page in `<template data-hs-buddy>` for the scripts. The dog's own voice is the note in the box.
- **The studio is the painting card from its first frame** (`snippets/hs-journey-choose.liquid`, `assets/hs-journey-choose.js`, `assets/hs-wait.js`):
  - The inline script puts the buyer's photo on the easel from IndexedDB before any script runs.
  - `hs-wait.js` takes over the easel's speech bubble unchanged.
  - The photo is sent as soon as Teeinblue's fields are ready.
  - The journey's own photo does not load the dog detector again.
  - In journey mode, `#buy`'s other children are `aria-hidden`.
- **Screen changes** (`hs-journey.js`, `hs-journey-choose.js`, `tools/preview/journey-motion.browser.test.mjs`):
  - The bar, the progress line and the dock stay in place between steps; only the content moves.
  - Content-only same-document View Transitions run on the home steps and the gift page phases (16 px, about 340 ms), with a tap guard.
  - Reduced motion is instant, and browsers without View Transitions get a fade.
  - `snippets/hs-head.liquid` sets `hs-jm-on` from the head, so the store header never paints on arrival.
- **Speed:**
  - The journey's own scripts no longer wait behind Teeinblue's `app-v1.js`.
  - The home hero loads one picture set at a time (`assets/hs-showcase.js`, `snippets/hs-showcase-fig.liquid`).
  - The dog detector loads only after a photo is chosen, on a fast connection. "No dog" and "too far" are asked at Start painting.
  - The gifts step prefetches the first gift page, and `hs2.js` sends nothing while a page is prerendered.
- **The cart's "Make another version" link** (`?redo=`) opens the normal gift page. The head, the inline check and `hs2.js` `journey()` all stand down on it.

## 5 November: photo first, each choice once, one painting per gift

Krish's 4 November purchase found three paintings, a second colour choice and the blanket's pattern on every gift. The journey now runs in one order, and every choice is made once (record: `docs/evidence/2026-11-04-photo-first-journey.md`):
- **Home page** (`assets/hs-journey.js`, home mode): the photo, then the look, then the feel, then the gifts.
  - The feel is one tap on four tone cards.
  - The gifts are shown large on real product photos. Each gift's colour or frame is chosen there, once, beside the bundle and the store's own timing ("Order by December 4 for Christmas delivery to a US address").
  - `handOver()` writes the photo-first state (`hs2-review`, `hs_journey.mode = 'photo-first'`, the queue of gift addresses).
- **Gift page** (`snippets/hs-journey-choose.liquid`, `assets/hs-journey-choose.js`):
  - In journey mode (`?journey=1`) the page steps aside for one frame. An inline check sets `hs-jm-on` while the page parses, so the product page never paints under it.
  - The photo goes to Teeinblue by itself, once (hs2.js `journeyAutoSend`).
  - The studio shows from the first paint of the page: the easel (`data-hs-jm-easel`) carries the buyer's own photo until hs2.js shows its painting card in the same place. It ends about 6 s after the tap (at least 2.5 s after the script runs), then the questions run in the same frame while it paints. Later gifts ask nothing. On desktop the questions use the studio's own 1040 px card.
  - The reveal shows Teeinblue's own mockups ("On the gift") and the whole print, uncropped. The last gift's reveal says the Christmas date from the memo strip's `data-deadline`, only until that day ends.
  - A gift already added from this journey says so on Back (`hs-jm-added:<handle>:<journey time>`), and never paints again.
  - One tick and one add. Teeinblue's framing box is saved, never shown.
- **What hs2.js tells the gift page**, as `__hs2api.journeyStatus()`:
  - `checking`, `waiting` and `sent`;
  - `nophoto`: the photo is really not on this device, so one button opens Teeinblue's picker;
  - `picked`;
  - `interrupted`: sent by a page that is gone (a reload, or Back then Forward), so the frame says "The painting stopped" and `journeyResume()` paints again on one tap;
  - `stuck`: the painter never opened in 90 s, so the frame says so and one tap reloads;
  - `refused`: the photo was refused after it left (`journeyRefused()`: the device check, a redrawn photo field, a failed preparation, or `journeyWatch()` seeing nothing happen for 15 s). `journeyNote()` gives the reason and whether "It's my dog" can override (`journeyOverride()`); otherwise one tap opens Teeinblue's picker.
- **The add** waits out hs2's checkout registration (`hs-checkout-image.js`, up to 90 s, which now retries a slow first registration). It shows hs2's words in the dock, and presses once more by itself if hs2 says the copy failed.
- **Taps and layout.** A double tap answers one screen, never the next, and a double tap on a gift card or colour is one tap. The address drops `#ask=` when the questions end, and Back after them steps past every question at once. The breed search replaces the list, so a 320 px phone sees its suggestions. The progress line only moves forward across both pages.
- **More than one dog.** The home page's dog detector finishes its check out of sight after the photo is accepted (`lateDogs`); if it sees more than one dog, Start painting asks once: another photo, or this one anyway.
- **Tests:** `tools/preview/journey-flow.browser.test.mjs` (home to cart, six phones and desktop) and `journey-product.browser.test.mjs` (the gift page, including a 9 s painter, a reload mid-paint, a refused photo, a painter that never starts, Back to an added gift, a slow checkout copy, a 320 px breed search, the empty-studio check and the 1280x800 questions).

## 4 November: one wait, the painting studio, any gift, four tones

- **Photo step** (`assets/hs-journey.js`, `hs-journey.css`). The photo check runs out of sight: the button reads "Off to the painter" and a passing photo goes straight to the gift page. Only a refused photo is shown, whole on a blurred copy of itself, with Buddy's reason. The dog detector loads while the buyer is on the step and is used only if it is ready, for at most 1.5 s. The tips no longer tick green.
- **Note step** (`hs-journey.js`). `fitNote()` steps the type from 17 down to 13 px so every line and the signature show; on the smallest phones the note scrolls inside its card. The backup lines are one set per tone, and Over the top is labelled **Roast** (the id stays `over_the_top`).
- **Painting wait** (`assets/hs-wait.js`, `hs-wait.css`, `hs-breed-facts.js`, loaded by `sections/hs2-product.liquid` with the painting card). While `hs2.js` says the card is painting, the photo paints in from gray, Buddy keeps the buyer company from the studio (6 November, below), a true breed fact appears every third beat, a tap on Buddy brings his next line, the bar eases and fills on arrival, and the tab title says when it is ready. `hs-breed-facts.js` is generated by `breeds-corpus/lookup/facts.mjs`.
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
- **One more gift (live since 5 Nov, 19:33 UTC).** On `/cart` only, while the bundle switch is on, `assets/hs-cart-more.js` opens a drawer from the left once per session (early, never while the buyer is busy) offering the gifts not in the cart with the bundle saving in dollars. Its data comes from `snippets/hs-cart-more.liquid`, rendered by `sections/hs2-memo.liquid` on the cart template. Its opener is the bundle line itself, in the box `hs2.css` keeps for it. A fresh, answered photo-first journey is extended (`journeyMore` in `hs2.js`); otherwise the home journey starts with `?gift=` and `&have=` (`hs-journey.js`). Orders from it carry `_hs_from=cart_more`; events are `hs2_more_*`. Tests: `tools/preview/cart-more.test.mjs` and `cart-more.browser.test.mjs`.
- **Checkout tiles.** Any photo whose alt text says "checkout tile" is hidden from the gallery, the variant picture map and Buddy's gift fan (`design/checkout-tiles/`).
- **Guards.** The guarded push runs `tools/preview/handle-check.mjs` before writing anything and again after. A broken product address stops the run. A blank variant picture or the heart stand-in only warns there (`--warn-media`), because the push cannot change product media. `.github/workflows/storefront-guard.yml` runs the same check every hour, pictures included, and opens one issue when something breaks. Until CoWork attaches the checkout tiles, it finds the blank pictures and the stand-in, so expect that issue to be open. The check names each blank variant by gift and variant title, and finds the heart stand-in by its file name, alt text or media id (`tools/preview/catalog.mjs`). Both gates now include Krish's Android Edge size (360×640). `tools/preview/live-gate.mjs` fails a product title's lone last word only when that word could have shared a line with the word before it.
