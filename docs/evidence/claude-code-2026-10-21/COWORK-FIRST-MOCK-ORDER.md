# Cowork prompt: from today's state to the first mock order (21 Oct 2026, evening)

Paste everything below into Claude Cowork. It replaces `COWORK-LAUNCH-AND-TEST-ORDER.md` (this morning) for the path to the first order. That file's part 6, the search and AI listings, still stands, but run it after the order.

---

You're working for Krish Raja on **Heartside** (heartside.io, Shopify store `bnf1em-ge`). Heartside sells gifts given on behalf of a dog to the person it loves most.

You work in the admin tools Claude Code can't reach, with Krish logged in: **Shopify admin, Teeinblue, Printful, n8n and Instagram**.

**Krish's goal today:** place the first real mock order, and prove that Shopify, Teeinblue, Printful and the order check work end to end for the v3 range.

Your job, in order:
- **Part 2:** find out what is already done.
- **Part 3:** clear the launch blockers.
- **Part 4:** run the journey check on Krish's phone.
- **Part 5:** hand Krish the order, then check it all the way to Printful.

Everything is documented in the public GitHub repo **krishanraja/heartside**, branch `main`. Read first:
- `docs/HANDOFF.md`, sections 2 (hard rules), 3 (state) and 4 (work left).
- `docs/V3-GIFTS-FROM-YOUR-DOG.md`: the product and the words on the gifts.

## 1. Where things stand

**The business:** four gifts, all live, with free US shipping.

| Gift | Price |
|---|---|
| The Morning Mug | $29, in Black, Dark Blue, Dark Green, Red or Pink |
| The Couch Blanket | $89 |
| The Framed Print | $89 |
| The Tree Ornament | $24, or $19 with another gift |

heartside.io opens on a minute-long chat with Biscuit, our dachshund host. The answers become a short message from the dog, in its own voice ("I wait by the door. Weekends too. Obviously."). The message is printed on any of the gifts and signed "Love, [dog]".

The words come from live AI: Google Gemini through Krish's n8n, with scripted lines as the fallback.

**The order chain:** Shopify, then Teeinblue (preview and print file), then Printful (makes and ships).
- Teeinblue holds every order until a person presses **"Confirm & Send to fulfill"**.
- GitHub Actions checks orders at 07:56 and 16:56 London. It tags each order `qc-pass` or `qc-hold` and never confirms one.

**Shipped by Claude Code today, all live:**
- **One screen, no scroll, on every device.** Every screen fits the window, on phones and desktop:
  - the homepage
  - the six questions
  - the reveal
  - choose gifts
  - the share card

  The footer is replaced by one line under "Start with your dog" with the policy links and "Heartside is a Mindmaker LLC company." The memo bar is hidden on phones. Helio's "Keep an eye on us" email signup is switched off on every page.
- **The gift page is one screen.** Top to bottom:
  - the preview of their gift
  - title and price, then "Free US shipping. Order by Dec 10 for Christmas."
  - "From Mowgli to Sam" with **Change a word**
  - the mug color as round swatches
  - the photo as one row ("Add Mowgli's photo", then "Change photo" and "Crop")
  - Add To Cart, with "A person checks every order before it prints." and the policy links under it

  Teeinblue's word fields are filled automatically and folded behind **Change a word**. That opens them in a panel; **Done** closes it.
- **The hidden chat answers now reach every order.** They are `_hs_answers` (what the buyer told Biscuit), `_hs_lines` (the words) and `_hs_ship_to`. They never did before today.

**Verified live by Claude Code this evening:**
- **A test cart.** It went chat, then gift page, then photo upload, then Add To Cart. The cart line carried:
  - Line 1 to 3 with their line breaks, and Signed "Love, Mowgli"
  - Teeinblue's customization image and print file link
  - all three hidden answers

  The cart was emptied afterwards.
- **The mug's Teeinblue Preview** now shows 2 slides for the chosen color, no longer all 10. The per-color mockup fix looks done; perspective can't be checked from outside.
- **Teeinblue's word fields** show neutral placeholders ("Your words from the chat with Biscuit"), not old third-person lines.

## 2. Rules

- **Never place an order, pay for anything, or press "Confirm & Send to fulfill"** without Krish's explicit yes in this session. Krish places and pays for the mock order himself.
- **Teeinblue's Update / Push to store:** untick **Images, Description, Title and Tags** every time. Otherwise it overwrites Heartside's product images and descriptions.
- **Never handle tokens, keys or passwords,** in chat or in files. Ask Krish to log in.
- **Don't change the theme, the Shopify theme editor, prices, products, payments, taxes, markets or Printful settings** without Krish's yes. The theme is deployed only from GitHub.
- **Approved for this job:** the Teeinblue mockup fix in 3.1 and the sample text in 3.2, only if they are still needed. Everything else is checking and reporting.
- **Writing:** no em dashes, no exclamation marks, US spelling.
- **Email:** customer email is krish@heartside.io. Where a personal contact is needed, use hello@krishraja.com, never a personal Gmail.
- **If a check fails, stop.** Tell Krish exactly what you saw, with a screenshot. Don't try to fix the site yourself.

## 2b. Step zero: what's already done

Ask Krish whether this morning's prompt (`COWORK-LAUNCH-AND-TEST-ORDER.md`) was run, and paste its report if there is one. For anything already reported as done, re-check it in one look and move on. Don't redo it.

## 3. Launch blockers, in order

1. **Teeinblue: the mug's Preview (campaign 1043122).**
   - Open heartside.io/products/the-morning-mug. Pick each color and press Preview. You should see exactly two slides in that color: the dog face, then the note face.
   - The note face's rows must bow with the mug, like `design/teeinblue/mug-v3/shopify-images/colors/the-morning-mug-drinker-black.jpg`. Flat rows mean perspective is off.
   - Only if either is wrong, follow `docs/evidence/claude-code-2026-10-19/COWORK-MUG-PREVIEW-FIX.md`. Placement comes from `design/teeinblue/mug-v3/mk-geometry.json`: top 208, size 1372 x 593, dog face at left 283, note face at left -696, on the 1200 px image (multiply by 0.8 in Teeinblue's 960 canvas). Save without pushing Images, Description, Title or Tags.
2. **Teeinblue: sample text in the mockup editors** (Mug 1043122, Blanket 1043153, Print 1043167, Ornament 1043174). If a campaign's mockup editor shows sample words in the old third person ("Waits at the door for you", "Steals your side of the bed", "Will ride anywhere", "Your best friend, no contest"), replace them with the dog's voice:
   - Line 1 "I wait by the door. Weekends too. Obviously."
   - Line 2 "I took your side of the bed. Not sorry."
   - Line 3 "Our walks are the best part of my day." (blanket and print). On the mug, Line 3 is "I'm your shadow. Where else would I be?"
   - Line 4 "I'm your shadow. Where else would I be?" (blanket and print)
   - Ornament Line 1 "I'm your shadow. Where else would I be?"

   **Never rename a field.** The site fills Teeinblue by the labels "Dog's name", "Line 1" to "Line 4" and "Signed".
3. **Teeinblue: fulfillment, all four campaigns.** Look and report only:
   - "Auto confirm order" is **off**.
   - The Printful products match:
     - Mug: Printful 403, 11 oz. Black 11051, Dark Blue 17362, Dark Green 17359, Red 11049, Pink 12578.
     - Blanket: 711.
     - Print: 2, three frames.
     - Ornament: 900, circle.
   - Prices are $29, $89, $89 and $24.
4. **Printful.** Look and report only:
   - The store is connected to bnf1em-ge, and orders arrive as drafts until confirmed.
   - **The billing method is set,** so a confirmed order can be charged. If it isn't, tell Krish; don't add one.
   - **Christmas order-by dates for US shipping,** per product (mug, blanket, framed print, ornament). For each, record the last safe order date and where Printful states it.
     - The site promises "Order by Dec 10 for Christmas" for every gift (Krish, 19 Oct). Printful's 2026 guide gives Dec 11 for US-made home items and Nov 26 for anything made outside the US.
     - The sherpa blanket can be made in the US, Europe or Latvia. If Printful says it ships from outside the US, flag it to Krish at once: Dec 10 would then be wrong for the blanket.
5. **Shopify admin.** Look and report only:
   - Shopify Payments is active, with test mode off.
   - Markets and shipping: US only, free shipping on all four gifts.
   - Only the four gifts are Active. The retired HR poster, framed poster and pillow are Draft or Archived.
   - Refund, privacy, shipping and terms policies exist. The site links to all four from the homepage and the gift pages.
6. **Cowork scheduled tasks:** confirm the old task "Heartside order QC" is **off**. GitHub Actions runs the order check now, and the two must never tag the same order. If it's on, ask Krish before turning it off.

## 4. The journey check on Krish's phone

Use an iPhone, opened inside Instagram if possible: paste heartside.io into a DM to yourself and tap it. Take a screenshot at each numbered step. Stop at the cart.

1. **First screen.** It fits the phone with nothing to scroll. Under "Start with your dog" there is one line: "Privacy · Terms · Shipping · Refunds · Heartside is a Mindmaker LLC company." There is no "Keep an eye on us" anywhere. Try to scroll: the page shouldn't move.
2. **The chat.**
   - Use a real dog name, She or He, a real breed, and a real photo ("Add a photo" on question 1).
   - Answer with chips, plus one "Something else" typed answer.
   - Each question fits the screen without scrolling. With the keyboard up, the field you're typing in stays visible.
3. **The reveal.**
   - The lines read as the dog talking ("I ..."), never he, she or a name.
   - The mug shows the chosen color, and "Turn the mug" works.
   - "Change a word" lets you edit a line.
4. **Choose gifts.** Tick the **mug in Black** and **the Couch Blanket**, ship to them, then "Add 2 gifts to cart".
5. **The mug's gift page.**
   - **Layout:** one screen, with the preview at the top, "From [dog] to [person]", the black swatch ringed, the photo row showing the dog's photo, and Add To Cart.
   - **Change a word:** it opens the panel with Line 1 to 3 holding the reveal's lines and Signed "Love, [dog]". Done closes it.
   - **Preview:** use the arrows to check both faces: the photo face and the note face with the words.
   - **Add To Cart.**
6. **The next-gift bar** at the bottom names the blanket. Tap it. The blanket's page should show the same layout, its four lines under Change a word and the photo already in place. Add To Cart.
7. **The cart** has two lines:
   - the Black mug, with its three lines, "Love, [dog]" and the mug thumbnail
   - the blanket, with its four lines and its thumbnail

   **Leave the cart for Krish.**
8. **The AI log.** In n8n, open Overview, then Data tables, then "Heartside AI calls". The journey should have added rows with `source = ai`. Note any `fallback` or `slow = true` rows.

## 5. The mock order

When parts 3 and 4 pass, tell Krish he can order.

1. **Krish places and pays.** One **Morning Mug in Black** and one **Couch Blanket**, from the cart in part 4 or a fresh one, with a real dog photo, a typed breed and at least one typed answer.
2. **Shopify** (Orders, then the new order). Each line shows:
   - Line 1 to 3 (mug) or Line 1 to 4 (blanket), and Signed "Love, [dog]"
   - **`_hs_answers`, `_hs_lines` and `_hs_ship_to`** (open "Show more" or the line's properties). These are new today. Their absence is a failure; screenshot it and tell Krish.
3. **Teeinblue:** the order exists with a print file for each gift. Open each print file and check:
   - the photo is the dog's
   - the lines are spelled right and sit inside the print area
   - "Love, [dog]" and the paw are there
   - the mug's rows break evenly (no single word alone on a row)
4. **Order QC:** at the next run (07:56 or 16:56 London), the order should be tagged `qc-pass`, with a note saying "Color: Black (Printful 11051)". A `qc-hold` opens a GitHub issue in krishanraja/heartside for Krish; read it with him before going on.
5. **Printful:** the order waits as a draft with both products, the mug as Black 11 oz (11051).
   - **Record which facility the blanket is routed to** (US, Europe or Latvia). This settles whether "Order by Dec 10" holds for the blanket.
6. **Confirm.** Only when every check above passes, and only on Krish's explicit yes in this session, press **"Confirm & Send to fulfill"** in Teeinblue. Record the Printful order number and its estimated delivery date.

## 6. Report back to Krish

- **Step zero:** what was already done and re-checked.
- **Part 3:** what you changed, with before and after screenshots, and what you only checked:
  - the mug Preview per color
  - auto confirm on or off
  - Printful billing set or not
  - the four order-by dates and their sources
  - payments, markets, shipping and policies
  - the old Cowork QC task on or off
- **Part 4:** a screenshot per step, the n8n rows, and anything that failed.
- **Part 5:**
  - the Shopify order number, with a screenshot of each line's properties including the three hidden answers
  - the Teeinblue print files (screenshots)
  - the QC tag and note
  - the Printful order number, the blanket's facility, and the estimated delivery
- **Anything a tool wouldn't allow:** stop at that step, and say what it offered instead.

**After the order, when Krish says go:** run part 6 of `COWORK-LAUNCH-AND-TEST-ORDER.md` (Search Console, Bing, Merchant Center, Pinterest, Shopify's AI channels).
