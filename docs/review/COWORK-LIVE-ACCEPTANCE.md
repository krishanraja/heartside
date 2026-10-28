# Claude CoWork: make the platforms match, check everything, then five recorded mock orders (28 October 2026)

Status: ASSIGNMENT, not a result. Krish runs it in CoWork on his own computer and screen-records Part 3. He brings the recording and your report back to the Claude Code session, which judges the orders for UX and quality. The earlier version of this file (Parts A to C, 27 October) is in git history; Part A's automated gate is now `tools/preview/preview-acceptance.mjs`, which the release session runs before every publish.

Work in three parts, in order:

1. **Platforms.** Make Teeinblue, Shopify, Function Studio and Printful match what the store now does.
2. **End to end.** Check every page, product, price, mockup and the checkout path on heartside.io. Read only.
3. **Five mock orders.** Real flow, test payments, every edge case below, then restore and clean up.

## Before you start

Pull `main` of `krishanraja/heartside` to a local folder you can read. Read [`../../NOW.md`](../../NOW.md) first, then [`../SCOPE.md`](../SCOPE.md) and [`../evidence/2026-10-28-product-cart-live.md`](../evidence/2026-10-28-product-cart-live.md). Anything under `docs/history/` is provenance only. Later live readback beats this file; recheck every fact in its own system.

What is live on heartside.io, as the store should behave:

- **Products.** Illustrated mug $45, inside black, dark blue, dark green, pink or red. Portrait 12×18, $59 unframed or $119 framed in black, white or red oak. Word-free 50×60 sherpa blanket $129 (tan). Ten variants in all. The Artist's touch add-on is $29.
- **Offers.** "Free US shipping on every order." The bundle is automatic: 15% off two gifts, 20% off three or more, gifts only, never the add-on.
- **Hosts and words.** Buddy, a chestnut dachshund, hosts. The customer's dog has its own name. No exclamation marks and no em dashes anywhere a buyer can read.
- **First screen.** The "Try the slider" demo swaps both the example note and the example painting across Sentimental, Warm with a wink and Hilarious. Below it, a "Same slider, every gift" strip shows labelled examples on a mug pair, a portrait, a blanket and a mug.
- **Product page.** While Teeinblue paints, a painting card shows the buyer's photo being painted with an eased progress bar. The finished design appears with a large "Yes, this is <dog>." confirmation directly under it. Add to cart is blocked until that box is ticked, and a blocked click scrolls to it.
- **Toy and collar.** A "Favorite toy" and a "Collar or accessory" box take words that reach the painting. "Have photos of it?" adds an Artist's touch line, with tagged photos, right after the gift.
- **Cart.** A personalised design is one unit. It shows "One per design", and a raise is refused with "Each design is one gift, so it stays at one. Nothing was changed." The cart picture is the accepted design and holds steady.
- **Phone menu.** It lists "Make a gift with Buddy", the mug $45, the portrait "From $59", the sherpa blanket $129, the shipping line, Answers and Contact.

## Rules for every part

- **Approval.** Each step marked **[approval]** needs Krish's explicit yes immediately before it, for that named action and target only. Ask in one plain line naming the action, the target and how to undo it. Wait for the answer. A yes never carries to the next step. Everything not marked is read only and runs without asking.
- **Never, in any part:**
  - confirm, release or pay for a Printful order;
  - press a fulfillment control;
  - use a real card;
  - send a message to a customer or vendor;
  - change anything not named here;
  - delete without its own approval.
- **Browser.** Use only the authorized browser session. Never open the system file picker. Attach photos with the browser tool's file upload on the page's file input. If the tool cannot attach a file, ask Krish to pick the named file himself while recording.
- **Test details.**
  - Names: synthetic only.
  - Email: `hello@krishraja.com` on every order and form, or `hello+mock1@krishraja.com` through `hello+mock5@krishraja.com` if checkout accepts the plus form. Never Krish's personal address.
  - Phone, where required: `212-555-0100`.
  - Never tick "Email me with news and offers". Do not use the Christmas reminder box.
- **Private data.** Keep these out of the report: the store handle, any theme id, Teeinblue campaign ids, Printful product ids, order numbers, admin URLs, workflow addresses, the Drive link, Krish's personal email and anything a real customer entered. Keep screenshots and files in a private local folder with neutral names (`mock-1-cart.png`). If you meet a real customer's order or data, stop looking at it and do not record it.
- **Recording.** Krish screen-records Part 3. Pause about three seconds on each checkpoint screen named below, so the recording catches it. Write the clock time at the start of each order and at each checkpoint into your log, so the recording can be matched to the steps.

## Part 1: make the platforms match the store

### 1.1 Teeinblue prompts, the change that makes the examples true **[approval, once per campaign]**

The examples on the first screen were painted with the single-direction prompts. Real orders follow them only once each campaign has them. Apply [`tools/print-art/teeinblue/PROMPT-SPEC-2026-10-27.md`](../../tools/print-art/teeinblue/PROMPT-SPEC-2026-10-27.md) to the mug, then the portrait, then the blanket campaign. Ask Krish separately for each.

1. Back up the campaign's current template privately and record its current prompt's SHA-256.
2. Add three text layers named exactly `Tone direction`, `Style direction` and `Energy`. Each is form only, not printed and not required. Max lengths are 1200, 1200 and 300. Defaults are empty, empty and `none`. Reuse a layer that already has one of those names.
3. Replace the photo effect's prompt with that campaign's block from the spec. Change no other effect setting: model, quality, resolution, output size, reference image off, backup model as it is.
4. Validate. It must show zero errors and zero warnings.
5. Read back:
   - the saved prompt's SHA-256 equals the spec: mug `acab45c9…`, portrait `d115d2dd…`, blanket `ed13162b…` (full values in the spec);
   - the three layers have exactly those names, lengths and defaults;
   - `Artwork tone` still offers exactly Sentimental, Warm with a wink and Hilarious.
6. Sync with the catalog and image flags off.
7. On heartside.io, after a short chat with chips, open that product page. In the browser's developer tools, find the personalizer's hidden `Tone direction`, `Style direction` and `Energy` fields and record that they hold the chosen tone's text, style's text and energy text, or `none`. Make no upload and no generation.

If the editor rejects or shortens a prompt or a field, stop and report it. Do not trim anything to fit. To roll back, restore the backed-up prompt, remove the three layers, validate and read back the old hash.

### 1.2 The checkout merge (Function Studio), read first

The cart transform builds the checkout line that carries the design's picture. On 28 October it doubled any design above one unit at checkout: two became four. The store now keeps every design at one unit, so nothing is broken for buyers. Read the following and change nothing:

- the active rule's status;
- how the rule sets the output quantity;
- the app's plan and when its trial ends. The record says Advanced at $69 a month, with the trial ending 1 November.

If the app has a simulator that runs without saving, simulate one design at quantity 2 and record what comes out.

Report two decisions for Krish:

- **Keep the app past 1 November?** Without it, checkout shows the catalog picture instead of the buyer's design.
- **Lift the one-per-design cap?** If he wants it lifted, propose the exact rule change and run it only on **[approval]**, with a simulation showing 2 in and 2 out. The store's cap stays in the theme until the Claude Code session lifts it.

### 1.3 Shopify settings, read only unless a defect is found

Record each item. Change one only on **[approval]** and only if it contradicts what the store promises.

- **Discounts.**
  - The automatic bundle discount or discounts: 15% for two gifts and 20% for three or more. Eligible: the three gift products only, never the Artist's touch. They combine with the free shipping discount.
  - The free shipping discount: which countries and US regions it covers, including Alaska, Hawaii and Puerto Rico.
  - No other active automatic discount or public code that conflicts.
- **Products.**
  - All ten variants at the prices above, available on the Online Store.
  - The Artist's touch product: active, $29, available, and needing shipping or not (record which).
  - Each variant's image matches it: the mug's inside colour, and the portrait's frame or no frame.
- **Payments.** Shopify Payments accepting payments, with test mode off. The three pre-existing $49 market price overrides exactly as they are. Record them now, because Part 3 checks them again.
- **Tax.** Record the regions where Shopify collects tax. The cart says "Any tax is shown at checkout", which is true either way. Change nothing.
- **Markets and shipping.** Which countries checkout can ship to. The store promises US shipping only.
- **Shopify Inbox.** At 390×844, record whether its chat bubble covers Add to cart, a chip or Buddy's button on any page. If it does, propose the fix: hide it on product pages, or move it. Change it only on **[approval]**.

### 1.4 Printful and n8n, read only

- **Printful.** For the Heartside store, record:
  - "Manually confirm imported orders": expected on;
  - automatic confirmation: expected off;
  - "Import personalized orders as drafts": expected on;
  - "Automatically import orders with synced products" and "Use product alternatives", as they are. Approve no substitute product.
- **n8n.** The typed-answer and compose workflows are the published versions.

### 1.5 Christmas cut-off **[approval]**

Find Printful's published 2026 US holiday order cut-offs on Printful's own site. Find the dates for the 11 oz mug, the 12×18 poster (unframed and framed) and the 50×60 sherpa blanket, with standard shipping. Report each date and the link.

If all three are published, propose the earliest one. On approval, set it as "Last order date for Christmas" (format YYYY-MM-DD) in the live theme's header, in the HS memo section of the theme editor, and save. Then read the strip back on heartside.io: it should count down to that date. If any date is not published, leave the setting empty and say so.

Close Part 1 with a table: each item, then done with readback, not run, or blocked (with the reason).

## Part 2: end to end, read only

No upload, generation, typed answer or order in this part. Use chips only. Test at about 390×844 and 1280×900 with a clean session, on https://heartside.io/ with no preview parameter.

1. **Automated gate, if Node is available.** Run `cd tools/preview && npm ci && node preview-acceptance.mjs` and `node live-gate.mjs`. Both should end "all clear". Record any line that does not.
2. **Every page.** Check the home page, the three product pages (`/products/your-dogs-illustrated-mug`, `/products/your-dogs-portrait`, `/products/your-dogs-personality-blanket`), the cart, the cart drawer, a made-up path (Buddy's 404) and the phone menu. Each shows:
   - the night strip, "Free US shipping on every order.";
   - the cream header;
   - Heartside's footer;
   - no Helio menu, search, product cards or "Powered by Shopify".
3. **The examples.**
   - Move the "Try the slider" control through all three tones. The painting and the note change together.
   - The "Same slider, every gift" strip shows every image, each labelled as an example.
   - Nothing is blank, cut off or scrolls sideways at either size.
   - Note anything that reads as a promise the product cannot keep.
4. **Prices everywhere equal Shopify.** Check the first screen, the chat's choose step ("Give two, save 15%. Give three, save 20%."), each product page ("Unframed $59 · Framed $119" on the portrait), the phone menu and the cart. No retired names (Morning Mug, Couch Blanket, Framed Print, Tree Ornament) and no $89, $24 or $39 anywhere. $29 appears only beside the Artist's touch.
5. **Mockups.**
   - Select every variant: five mug insides, unframed and three frames, and the blanket. The main picture matches the variant.
   - Click every gallery thumbnail on all three pages at both sizes. The main picture never goes blank or changes the box height.
   - The blanket never shows the blank grey template.
6. **The chat.**
   - Walk it with chips: start, the dog's name and breed, a person, the home question and its follow-up, spot, together, meaning, "Show me".
   - Use Back and Forward at every step, and reload on three steps. Each lands on the same step, nothing is erased, and the address carries `?step=`.
   - With the network panel open, nothing reaches the note service on Back, Forward or reload.
7. **No bypass.**
   - A product page with no photo blocks Add to cart with plain wording.
   - Quick add, search, product cards and accelerated checkout offer no way around it.
   - Teeinblue's quantity box is hidden on all three gift pages.

Conclude Part 2 with **ready for the mock orders**, **hold for the listed defects** or **insufficient evidence at the named boundary**.

## Part 3: five mock orders (Krish records)

### 3.0 Set up

1. **Choose the test route.**
   - Read Teeinblue's current help pages: "How to make a test order" and the pricing FAQ.
   - On 26 October they said orders paid through Shopify's Bogus Gateway are not billed, and warned that other routes, including a real $0 order, can count as real orders.
   - Use only the route the current pages say is not billed. Quote the line in the report.
   - If that is the Bogus Gateway, it means deactivating Shopify Payments for the window. Shopify has warned before that this can affect fixed market prices, which is why 1.3 recorded them.
2. **Open the test window [approval].**
   - Ask: "Switch checkout to test payments (Bogus Gateway) for about 90 minutes for five mock orders, then switch back. Real buyers cannot pay during the window."
   - On yes, activate it. Read back that checkout offers only the test method.
   - Note the window's start time. Any order placed during the window that you did not place must go to Krish at once.
3. **Agree the spend [approval].**
   - Teeinblue paints once per upload and once per redo. The plan uses 8 paintings. Ask for a cap of 10.
   - Order 1's typed answer makes a few cents of note calls.
   - Count every painting as you go and stop at the cap.
4. **Before each order,** say in one line which order is next and how many paintings it uses, and wait for Krish's go. Before you pay, check that the payment is the test method's success card.

**Bogus Gateway cards:**

| Field | Value |
| --- | --- |
| Name on card | `Bogus Gateway` |
| Number for a successful payment | `1` |
| Number for a declined payment | `2` |
| Expiry | any future date |
| Security code | any three digits |

**Photos.** The dog photos are in the repository at `assets/photos/`. They are stock photos, not customer photos. The test photos for orders 3 and 5 are in [`mock-order-photos/`](mock-order-photos/README.md): `reject-blurry.jpg` and `reject-too-small.jpg` are rejected by the store's own photo check, and `close-up.jpg` is the red poodle's face.

**Addresses.** Use public buildings, never a person's home:

- New York: 350 5th Ave, New York, NY 10118
- Anchorage: 632 W 6th Ave, Anchorage, AK 99501
- Honolulu: 530 S King St, Honolulu, HI 96813
- San Juan: 153 Calle San Francisco, San Juan, PR 00901
- Toronto, to test the block: 100 Queen St W, Toronto, ON M5H 2N2, Canada
- Chicago: 121 N LaSalle St, Chicago, IL 60602

### The five orders

| # | Gift | Size | Dog (photo) | Style, tone | Ship to | Paintings |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sherpa blanket | 390×844 | Honey, Golden Retriever, she (`golden-puppy-asleep.jpg`) | Cut-paper collage, Sentimental | New York | 1 |
| 2 | Portrait, framed red oak | 1280×900 | Sir Biscuit O'Malley, Pug, he (`pug-autumn-leaves.jpg`) | Comic book, Hilarious | Anchorage | 1 |
| 3 | Mug, dark green inside, plus Artist's touch | 390×844 | Ruby, Toy Poodle, she (`red-poodle-head-tilt.jpg`) | Painterly, Warm with a wink | Honolulu | 1 |
| 4 | Mug (red inside), unframed portrait and blanket, plus one redo | 1280×900 | Pickle, Cavapoo, he (`apricot-poodle-puppy.jpg`) | Vintage screenprint, Hilarious | San Juan | 4 |
| 5 | Mug, pink inside | 390×844, or Krish's iPhone in Safari | Mochi, Maltipoo, she (rejects first, then `maltipoo-on-deck.jpg`) | Fine ink drawing, Sentimental | Toronto, then Chicago | 1 |

**Order 1: the full chat, a typed answer and toy and collar words.**

- **Chat.** Start on the home page with a clean session. Chips at every step except the home question, where you type one short answer: "She waits by the door with one ear up". Recipient: a partner, "Sam". Show me, then choose the blanket.
- **Product page.**
  - Favorite toy: "Green squeaky hedgehog". Collar or accessory: "Red plaid bandana".
  - Upload the photo.
  - **Checkpoint: painting card.** The buyer's photo is being painted, lines come from Honey's choices, and the bar eases without claiming 100% early.
  - **Checkpoint: reveal.** The design appears with "Yes, this is Honey." directly under it.
  - Click Add to cart before ticking. It scrolls to the confirmation. Tick it, then add.
- **Cart.**
  - **Checkpoint: cart.** Watch the picture for ten seconds. It stays the design, with no flicker.
  - It reads "One per design", $129, the shipping line and "Any tax is shown at checkout".
- **Checkout.**
  - **Checkpoint: checkout summary.** The design is the line's picture, $129, shipping free.
  - Pay with card `1`.
  - **Checkpoint: thank-you page.**

**Order 2: a direct visit, a name with an apostrophe, an ampersand, and a declined card.**

- **Product page.**
  - In a fresh private window, go straight to `/products/your-dogs-portrait`. Buddy's offer shows, with no earlier names.
  - Choose Framed, then red oak. The price reads $119.
  - Dog's name: "Sir Biscuit O'Malley". Style Comic book, tone Hilarious.
  - In the note field ("Your note"), type "For Pat & Jo, who saved me the good chair". In the signature field, type "Love, Sir Biscuit O'Malley". If the page does not offer these fields on a direct visit, record which fields it does offer.
  - Upload the photo. Check the painting card and the reveal.
  - Every place the names show (preview, cart, checkout, order) shows `O'Malley` and `&`, never `&#39;` or `&amp;`.
- **Checkout.**
  - "Format: Framed" is shown, at $119.
  - Pay first with card `2`. The decline message is plain and the order is not placed.
  - Then pay with card `1`.
  - Check whether free shipping applied for Alaska.

**Order 3: "Me", Back and Forward in the chat, and the Artist's touch with a photo.**

- **Chat.**
  - Choose "Me" as the recipient. The label reads "Your first name"; enter "Alex".
  - On three steps, press Back, then Forward, then reload. Nothing is erased and no step repeats a paid call.
  - Choose the mug.
- **Product page.**
  - Inside dark green. Favorite toy: "Blue rope ball".
  - Open "Have photos of it?".
    - What should our artist add: "Paint her dark brown collar, and her ears as fluffy as photo 1".
    - Photo 1: tag "Another photo of my dog", file `mock-order-photos/close-up.jpg`.
  - Upload the main photo. Accept the design and add to cart.
- **Cart.**
  - An Artist's touch line at $29 sits right after the mug, naming what it is for. It carries the note and "Photo 1: Another photo of my dog".
  - No bundle saving applies, because there is one gift.
  - The add-on says it adds 5 days.
- **Checkout.** $74 in total, shipping free to Hawaii. Pay with card `1`.

**Order 4: three gifts from one chat, the bundle steps, and a redo.**

- **Chat.** One chat for Pickle. A Cavapoo is a named cross, so the hidden Energy field should read `none`. On the choose step, pick all three gifts.
- **Make the three gifts.** Make them one at a time from the product pages: mug (red inside), then the unframed portrait, then the blanket.
  - **Checkpoint:** after two gifts, the cart applies 15%: $45 + $59 = $104, less $15.60, so $88.40.
  - **Checkpoint:** after three, it applies 20%: $233, less $46.60, so $186.40.
- **Redo the mug.**
  - In the cart, use "Not quite right? Make another version." on the mug once and make the new version.
  - The old mug line then says "You made a new version of this gift. Keep the new one?". Press "Remove this version".
  - **Checkpoint: cart.** Three gifts, each at one, 20% applied, every picture steady.
- **Checkout.** Ship to San Juan. If Puerto Rico cannot be shipped to, or is charged for shipping, record exactly what checkout says, then use the Chicago address. Pay with card `1`.

**Order 5: bad photos, leaving the page mid-paint, a raise to two, and a foreign address.**

Run this one at phone size, or have Krish run it on his iPhone in Safari while you watch the admin side.

- **Bad photos.**
  - Upload `reject-blurry.jpg`. Expected: "This photo is too blurry for me to see your dog clearly. Try one where the eyes look sharp.", with no request to Teeinblue in the network panel.
  - Upload `reject-too-small.jpg`. Expected: "This photo is too small for me to draw from…", and again no request.
  - Upload `maltipoo-on-deck.jpg`.
- **Leaving mid-paint.** While it paints, press Back, then Forward, then reload. The painting card resumes, not restarting from zero, and no second painting starts. Count it if one does.
- **The cart.** Try to raise the quantity to 2. It stays at 1 and says "Each design is one gift, so it stays at one. Nothing was changed."
- **Checkout.**
  - Enter the Toronto address and record exactly what checkout says.
  - Change it to the Chicago address.
  - Pay with card `1`.

### 3.1 After each order, read back (read only)

- **Shopify order.**
  - Marked test.
  - The right variant at the right price.
  - The bundle and free shipping as expected.
  - The line properties carry the dog's name escaped correctly, plus the style, tone and photo.
  - The order picture is the design.
- **Teeinblue.**
  - The order reads Ready, with the design complete and no error.
  - Open the production file privately and check:
    - **Words.** The mug and portrait carry the exact note and signature. The blanket has no words at all.
    - **Style.** The style is the one chosen.
    - **Tone.** The tone reads at a glance: tender for Sentimental, a light wink for Warm, a clear comic premise for Hilarious.
    - **Likeness.** The dog looks like the photo.
    - **Toy and collar.** Order 1 shows a green hedgehog and a red plaid bandana; order 3, a blue rope ball.
  - Save the design preview privately as `mock-<n>-design.png`.
- **Printful.** The order is a draft or was not imported, never confirmed. If there is a draft, its variant matches: the mug's inside colour, the frame, the blanket size.

### 3.2 Restore payments **[approval]**

- Ask, then switch Shopify Payments back on and the Bogus Gateway off.
- Read back:
  - accepting payments, with test mode off;
  - the three $49 market prices exactly as recorded in 1.3;
  - a fresh checkout on heartside.io offering the real payment methods. Go as far as the payment step, never paying.
- Report the window's end time. List every order placed during it, by count only, and how many were yours.

### 3.3 Clean up **[approval, separately for each system]**

- **Shopify.** Cancel the five test orders, with no customer notification. Read back cancelled.
- **Printful.** Delete any draft the test orders created, never confirming one. Read back gone.
- **Teeinblue.** Archive or cancel the five orders if it has a control for it. Otherwise leave them and say so.

## The report

Write it for the Claude Code session, with nothing from the private list above.

1. **Part 1.** The table, plus the two Function Studio decisions for Krish and the Christmas dates with links.
2. **Part 2.** The verdict, with each defect as blocking or minor, and its page and size.
3. **Part 3, per order.**
   - Start time and checkpoint times.
   - What was expected and what was seen at each checkpoint.
   - Totals: items, discount, shipping, tax and total.
   - The production-file checks (style, tone, likeness, words, toy and collar).
   - Every defect, with what a buyer would feel.
4. **Counts.** Paintings used against the cap of 10, note calls, orders placed, and the restore and cleanup readbacks.
5. **Close** with **ready to sell**, **hold for the listed defects** or **insufficient evidence at the named boundary**. Say separately that physical print quality still waits for Krish's own sample order.

Krish names the recording files `mock-1` to `mock-5` (or one file with the times from your log) and brings them back with this report.
