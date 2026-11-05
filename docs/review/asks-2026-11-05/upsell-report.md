## Photo-first upsell drawer on /cart: design

**North Star.** This raises Shopify net sales by making two- and three-gift baskets easy at the cart, where the live bundle (15% off two gifts, 20% off three or more, gifts only) is already set up and covers its costs. The number is $69 against $658 at U5, so this is work worth doing now. Nothing was edited, committed or pushed. The only requests to heartside.io were GETs: `/cart` (empty), `/`, and the three products' `.js`.

### 1. Root cause

- **The only upsell is text you can't act on.**
  - `hs2.js:2998` (`bundleLine`) writes "Add a second gift and save 15%. Three saves 20%." into an attribute.
  - `hs2.css:1276-1280` draws it with `::before { content: attr(data-hs2-bundle-say) }`. It has no link, no picture, no dollar amount, and it only shows when the cart has exactly one gift.
- **The one offer you can act on is the $29 Artist's touch**, drawn under each line (`hs2.js:3017-3089`). It sits above the bundle line, which is worth more.
- **Nothing on /cart can start another painting.** Every gift has to be painted on its own page (`hs-journey-choose.js:14-17`).
  - The journey queue is only written on the home page, by `handOver()` (`hs-journey.js:282-302`).
  - After the last gift, `hs-journey-choose.js:344` sends the buyer to `/cart`, which has no way back into the queue.
  - `cart.json`'s "You may also like" product list is `"disabled": true`. If it were switched on, it would open a plain product page, where Teeinblue's uploader asks for the photo again.
- **Where drawers exist on the live store.** Helio's right-hand cart drawer (`#cart-drawer`, `cart-drawer-component`) is on every page except /cart. The live `/` has it; live `/cart` doesn't. The journey always ends on /cart, so the new drawer belongs there only. `artistTouch` and `cardOffers` already follow the same "cart page only" rule (`hs2.js:3015`, `3239`).

### 2. How a buyer adds another gift from the cart

The drawer's button adds the gift to the end of `hs2-review.hs_journey.queue` and opens that gift's page:

- The new entry is `{gift, variant, url: '/products/<handle>?journey=1&variant=<id>'}`.
- `hs_journey.t` is never changed. Every per-gift key depends on it: `hs2-journey-sent:<pid>:<t>`, `hs-jm-added:<handle>:<t>` and `hs2-journey-on:<pid>`. Changing it would let earlier gift pages paint again.

The gift page then treats this entry exactly like a second gift chosen on the home page: `at() > 0`, so `first()` is false, so nothing is asked (`hs-journey-choose.js:35-44`).

I ran a local probe of this against today's code (`/tmp/claude-0/-home-user-heartside/2e077d0e-1ec9-5845-8fab-a9e6b1438927/scratchpad/probe-extend.mjs`). It used `tools/preview/out` only, blocked every other host and called no n8n host. The setup was a finished one-mug journey with the blanket or portrait added to the queue:

| Case | What the gift page did |
|---|---|
| Photo saved | Journey mode from first paint, painted exactly once (`__painted 1`). Showed "Now the blanket", "gift 2 of 2", asked nothing in 9 s. The reveal said "Mowgli on the blanket" with an "Add to cart" button. |
| Portrait, White frame | Same, with `variant=…08` kept in the URL. |
| No photo | Phase `nophoto`, "One photo of Mowgli". It asks only for the photo. |
| Journey older than 6 h | Not journey mode. `journey()` at `hs2.js:309-319` and the inline check at `hs-journey-choose.liquid:89` both use 6 h. |

So the drawer has three modes:

- **extend**: the journey is photo-first, under 6 h old, and `answered === true`. Add to the queue (or replace the entry if that gift is already queued) and open its page.
- **extend without photo**: same, but the photo is gone. This happens after `PHOTO_DAYS` = 3 (`hs2.js:1125`), in a private window, or when IndexedDB fails. It still extends, and the copy says the photo is chosen once more.
- **start**: no fresh, answered journey in this tab. This covers buyers who came straight from a product page or the old chat, a second tab (sessionStorage is per tab), and a journey over 6 h old.
  - The link goes to `/?step=photo&gift=<mug|portrait|blanket>`, which already exists (`hs-journey.js:951-955`).
  - That starts a new journey: photo, style, feel, then gifts with that gift ticked. Its gift page asks the questions while it paints.
  - The existing cart line keeps its design, and the bundle still counts both gifts.
  - An optional small change: at line 954, read `&variant=` so the frame or color chosen in the drawer carries over.

### 3. The drawer

**Where:** only on `/cart`, as a fixed panel appended to `<body>`. That keeps it outside Helio's cart re-render, which Teeinblue's cart pass triggers. Helio's right-hand drawer gets nothing in v1, because two drawers would collide on phones.

**What it offers:**
- Only gifts with no gift line in the cart. Add-on lines (`_hs_addon_for`) are ignored. It never offers a second copy of a gift already in the cart; two mugs at 15% fall below the 30% floor (`ECONOMICS.md`).
- Order: print, mug, blanket, matching the home page.
- Pictures: the home gifts screen's approved photos `hs-ex-scene-{portrait,mug,blanket}-home.webp` (540x675), each with the "Example" tag, using the alt text from `hs3-chat.liquid`.
- Variant choice, labeled by the rule in `hs-journey.js:192-197`:
  - Mug: five color dots, "Inside color: Dark Green" (colors from `HEX`, `hs-journey.js:470`).
  - Portrait: chips "Unframed, $59", "Black frame, $119", and so on.
  - Blanket: no choice.

**The saving, in exact cents:**
- Rates: `RATES=[[3,20],[2,15]]`, counted by gift units, rounded per unit. This follows the go-live record, step 7.
- Calculation: saving = `bundleOff(units in cart + chosen variant)`. Units come from each row's `data-hs2-cart-line` (variant_id, quantity, `_hs_addon_for`) matched against the config's variant prices. There is no extra `/cart.js` read, because each read sets off Teeinblue's cart redraw (`hs2.js:2986-2988`).
- Examples:
  - Mug in cart, add blanket: **$26.10**.
  - Mug in cart, add Unframed portrait: $15.60. Black frame instead: $24.60.
  - Mug and blanket in cart, add Unframed portrait: **$46.60 on all three**.
- The number updates as the frame changes, in a two-line space that is always reserved.

**Copy (all strings pass copy-lint):**

| Part | Text |
|---|---|
| Title | "Paint one more from the same photo" |
| Subline, extend | "Mowgli, in the same style. Nothing to answer again. Most paintings take 1 to 3 minutes." (no dog name: "Your dog, in the same style…") |
| Subline, no photo | "The same style and note. You choose the photo once more, then it paints." |
| Subline, start | "Start from your dog's photo. About 2 minutes, then it paints." |
| Deal pill | 1 gift: "Second gift: 15% off both". 2 gifts: "Third gift: 20% off all three". |
| Card line | "You save $26.10 on the two." or "…on all three." |
| Card button | "Paint the blanket" (start mode: "Start with the photo") |
| Footer | "The saving comes off at checkout. No code needed." |
| Christmas line | "Order by December 4 for Christmas delivery to a US address." Read from the memo's `data-deadline`, shown only until that day ends (same rule as `christmasLine`, `hs-journey-choose.js:126`). |
| Buttons | "No thanks", "Check out" |

**When it opens:**
- Waits for hs2's first cart pass, then 1.2 s more, and only after 700 ms with no tap, key or scroll.
- It doesn't open while a quantity change is pending (`HSCartQuantity.pending()`), while the zoom overlay is open, or while a form field has focus.
- It opens automatically once per session. If the buyer took an offer from it, it opens once more when they come back with the next gift, for the 20% step. After any close it never opens by itself again that session. State is kept in sessionStorage `hs-more`.
- Motion: slides from `translateX(-100%)` in 520 ms with an overshoot (`cubic-bezier(.3,1.35,.55,1)`). Closing takes 200 ms. Taps are ignored for 450 ms after it lands, so a tap meant for Check out can't hit it by mistake.
- Reduced motion: opacity only, 150 ms, no transform or bounce.

**Paying is never blocked:**
- On desktop the drawer is 400 px wide and covers only the items column; the page's Check out stays uncovered.
- On phones it is `min(360px, 100vw - 48px)` wide and full height, so it does cover the page's Check out. In the preview layout (Helio's own CSS isn't in this repo, so this is inferred), Check out sits at x 40-335 on a 375 px screen, inside the first screen.
- There is no scrim and the page isn't made inert. A tap outside the drawer closes it, and the tap still lands.
- The drawer carries its own "Check out", fixed in its footer. It clicks the page's own `[name="checkout"]`, so the quantity gate in `hs-cart-quantity.js:141,213` still applies. If there is no such button, it goes to `/checkout`.
- The cards' buttons are disabled with the words "Finish the change in your cart first." while a quantity change is pending.

**Accessibility:**
- Markup: `<section role="dialog" aria-modal="false" aria-labelledby aria-describedby>`, with `hidden` and `inert` when closed. It is non-modal: no focus trap, page scroll not locked (locking it would shift the layout).
- When the buyer opens it, focus goes to the title (`tabindex=-1`). Escape, the close button (44 px, `aria-label="Close"`), "No thanks", or a swipe left of more than 60 px closes it, and focus returns to what opened it.
- When it opens by itself, focus stays where it was, and a polite live region says "An offer opened at the left of the page. Press Escape to close it."
- Variant buttons use `aria-pressed` inside a labeled group. Every target is at least 44 px.

**Nothing changes size:**
- Drawer width and card sizes are fixed by breakpoint. The image box is 4:5. The saving and Christmas lines keep their space. The list scrolls inside the drawer while the footer stays put.
- On the cart page, the slot that reopens the drawer is rendered by the server and present from the first paint, so neither Check out nor the totals move.

### 4. Files and functions

1. **New: `shopify/snippets/hs-cart-more.liquid`**, with a `part` parameter.
   - `part: 'config'` outputs `<script type="application/json" data-hs-more-config>` holding the three gifts.
     - Products are looked up with `all_products['your-dogs-portrait' | 'your-dogs-illustrated-mug' | 'your-dogs-personality-blanket']`, following `hs-footer.liquid:48-50`.
     - Each gift carries gift key, handle, url, `available`, scene image via `asset_url`, alt text, spec line (copied from `GIFT_INFO`, `hs-journey.js:469`), and variants (id, options, price in cents, available).
     - It also loads `hs-cart-more.css` and `hs-cart-more.js` (deferred, after hs2.js).
   - `part: 'slot'` gives the kept place: an `<a href="{{ routes.root_url }}?step=photo" data-hs-more-open>` with two 32x40 scene thumbnails, the server label "Add another gift" (JS changes it to "Paint one more from the same photo" in extend mode), a reserved deal line, min-height 64 px, and a chevron. It renders only when at least one of the three handles is missing from `cart.items`.
2. **Edit: `sections/hs2-memo.liquid`**, after the memo div (line 40 block): `{% if template.name == 'cart' %}{% render 'hs-cart-more', part: 'config' %}{% endif %}`. The bundle switch and the deadline stay on the memo element as they are now.
3. **Edit: `snippets/cart-products.liquid`**, after `</table>` (line 659): `{% if context != 'drawer' %}{% render 'hs-cart-more', part: 'slot' %}{% endif %}`.
4. **Edit: `assets/hs2.js`.**
   - Beside `journey()` (~line 320), add:
     - `journeyMoreState()`. It applies the same freshness rule (`JOURNEY_HOURS`), requires `j.answered === true`, and calls `restorePhoto()`. It returns `{mode:'extend'|'start', photo:File|null, dog: answer('dog'), queued:[handles]}`.
     - `journeyMore(gift, variant, url)`. It checks the gift is mug, print or blanket, the variant is a number, and the url matches `/products/…?…journey=1`. It replaces an existing entry by handle or adds a new one, then calls `save()` and `track('more_extend')`.
     - Writing through hs2's in-memory `state` is required. If another script wrote sessionStorage directly, a later `save()` would overwrite it.
   - At the end of `cartTidy` `run()` (after line 3462), dispatch `new CustomEvent('hs2:cart')` so the drawer recalculates its offers.
   - Add both functions to `__hs2api` (line 4535).
5. **New: `assets/hs-cart-more.js`**, an IIFE guarded by `window.__hsMore`, containing: `RATES`, `bundleOff`, `cartGifts` (rows outside `#cart-drawer`, skipping nested and add-on lines), `offers`, `build`, `paint`, `open(auto)`, `close(how)`, the auto-open rule, Escape/outside/swipe closing, `pay` (clicks the page's checkout), and the button: extend calls `journeyMore`, then `location.href = url`, disabled after the first tap; start goes to the start link. It publishes analytics events `hs_more_open`, `hs_more_pick`, `hs_more_close` and `hs_more_pay`.
6. **New: `assets/hs-cart-more.css`**, covering the slot, the drawer, the bounce keyframes, reduced motion, safe-area padding, and z-index below the zoom overlay.
7. **Docs:** `shopify/README.md`, NOW.md, and an evidence note.

### 5. Tests: fail on today's code, pass after

- **`tools/preview/cart-more.browser.test.mjs`**, the main one. In Chromium against `out/`, nothing leaving 127.0.0.1, every n8n host aborted, stub `/cart.js`. The setup is the probe's one-mug journey on `out/cart.html`, with the memo served as `data-hs-bundle-live data-deadline="2099-12-04"`. It checks:
  - The drawer opens by itself from the left within 4 s and offers exactly the portrait and blanket.
  - The blanket shows $26.10. The portrait shows $15.60, then $24.60 after choosing White frame, with no change in the card's box.
  - The Christmas line shows, and disappears for a past deadline.
  - Tapping "Paint the blanket" goes to `…personality-blanket?journey=1&variant=58300000000010`, the queue becomes [mug, blanket], and `t` is unchanged.
  - On that page, `__painted === 1` after 9 s, no `ask=`, "Now the blanket", "gift 2 of 2", Add goes to `/cart`.
  - Back on a mug-plus-blanket cart, it opens once more and offers the portrait at "$46.60 on all three".

  This fails today because `[data-hs-more]` doesn't exist and there is no path from /cart into the queue.
- **The same file also covers:**
  - Escape closes it and a reload doesn't reopen it; the slot reopens it with focus in the title.
  - The drawer's Check out clicks the page's own Check out; a tap outside closes it and reaches the page; a pending quantity change stops the automatic open and disables the buttons.
  - No journey, a 7 h old journey, and the no-photo journey each give the right link and copy.
  - With `reducedMotion:'reduce'` there is no transform animation.
  - A cart with all three gifts shows no slot and no drawer.
  - At 320x568, 375x667, 390x844, 430x932 and 1280x800 the drawer fits and the page doesn't scroll sideways. On 1280 the page's Check out isn't covered.
- **`tools/preview/cart-more.test.mjs`** (node only):
  - `bundleOff` matches the go-live readback: [4500,12900] gives 2610, [4500,12900,5900] gives 4660, [4500,4500,12900] gives 4380, one gift gives 0.
  - The snippet's handles equal `catalog.mjs` CORE.
  - The spec lines equal `GIFT_INFO`, and the labels match `variantLabel` for every rendered variant.
- **Edits:** in `cart-layout.test.mjs`, Check out's position stays the same before and after the slot and drawer appear. In `render.mjs`, add `cart-two.html` and `cart-three.html`. Run `copy-lint --baseline` and Theme Check on the new Liquid.

### 6. What must stay true

- **One painting per gift.** The drawer never paints. It offers only gifts with no cart line, adds queue entries without duplicates, and ignores a second tap. The gift page's own locks stay as they are.
  - Known existing cost: a gift added from the journey, then removed and offered again, finds its "sent" key. It says "The painting stopped" after 20 s and paints again only when the buyer taps. This is the open item "a reload still costing a second painting".
- No exclamation marks, no em dashes, US spelling ("color"). Prices always come from Shopify, never written into the code.

### 7. Risks

- `hs2.js:2972-2976` says the cart shows "the saving Shopify actually applied … never a computed promise". The drawer has to predict the saving. It is guarded by the bundle switch and the pinned test, and after the add the cart's own line shows Shopify's real `total_discount`. If the discount in Shopify admin changes while the switch stays on, the drawer would show the wrong number.
- Not proven (inferred): Helio's real cart layout on phones, the checkout button's markup, and Teeinblue honoring `?variant=` for Black and White frames or the Dark Blue, Pink and Red mugs. That last one was already listed as unproven on 5 Nov.

### 8. Decisions for Krish

1. **The "special deal."** v1 uses the existing bundle. A new cart-only discount would need a new Shopify automatic discount and a fresh check of the 30% floor. `ECONOMICS.md` says no new percentage offer without one, and mug plus Unframed portrait at 15% passes by only about $3.70 to $3.98.
2. **Showing a computed saving before the add**, given the earlier "never a computed promise" rule.
3. **Opening by itself:** whether to do it when the bundle switch is off (recommendation: no, show the slot only), the 1.2 s delay, and the once-more-after-taking rule.
4. **Default portrait choice in the drawer:** Unframed $59 (recommended, matches "from $59") or Framed $119.
5. **Pictures:** the home scene photos (recommended) or each variant's own photo. The blanket's variant photo is still the old scatter pattern.
6. **Mock first.** `SCOPE.md` says mock-ups go to Krish before anything is built. Also, does the bounce count as motion design for the Codex lane? My view is that it's a UI transition in theme CSS, like the existing studio transitions.
7. **Helio's right-hand drawer:** leave it alone (v1), or add a link to `/cart#more`.

### 9. Live checks still needed

These need Krish or CoWork approval, since I may not add to the cart:
- With a real one-gift cart: where the slot lands in Helio's real cart, the drawer over Helio's real CSS, whether Teeinblue's redraw disturbs it, and one extended painting through real Teeinblue (about $0.13, inside his painting cap).
- A QA cart to confirm $26.10 and $46.60 against Shopify.
- After the push, a GET of the empty `/cart` should show no slot and no drawer.

### 10. Verified vs inferred

**Verified:**
- The code paths cited above.
- The live empty `/cart` carries `data-hs-bundle-live`, `data-deadline="2026-12-04"`, the Artist's touch and card variants, and has no `#cart-drawer`. The live `/` has the drawer.
- The live product options and prices: mug `[name, Color, 11 oz]`, portrait Framed/Unframed, $59 and $119, blanket $129.
- The local probe results in section 2.
- The preview cart's Check out position.

**Inferred:** Helio's real phone layout and checkout markup, the variant choice through Teeinblue for the colors and frames not yet proven, and the real conversion effect.