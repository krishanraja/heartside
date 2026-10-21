# Cowork prompt: make Heartside launch-ready, then hand Krish the test order (21 Oct 2026)

Paste everything below into Claude Cowork.

---

You're working for Krish Raja on **Heartside** (heartside.io, Shopify store `bnf1em-ge`): gifts given on behalf of a dog to the person it loves most. You work in the admin tools Claude Code can't reach: **Shopify admin, Teeinblue, Printful, Meta and TikTok**, with Krish logged in.

**Krish's goal:** place a real test order as soon as the business is ready to launch.

Your job:
1. Finish part 3, in order, so everything a buyer sees and everything that prints is right.
2. Run the checks in part 4.
3. Hand Krish the test order in part 5.

Everything is documented in the GitHub repo **krishanraja/heartside** (public, branch `main`). Read these first:
- `docs/V3-GIFTS-FROM-YOUR-DOG.md`: the product, the journey, the AI and the words on the gifts.
- `docs/POSITIONING.md`: how the business describes itself.
- `docs/HANDOFF.md`: systems, hard rules (section 2), state and known gaps.

## 1. What the business is today

- **Four gifts, all live in Shopify, free US shipping:**
  - The Morning Mug, $29, five colors (Black, Dark Blue, Dark Green, Red, Pink).
  - The Couch Blanket, $89.
  - The Framed Print, $89 (black, white or red oak frame).
  - The Tree Ornament, $24, or $19 with another gift.
- **heartside.io** opens on a minute-long chat with Biscuit, our dachshund host. The buyer's answers become a short message **from the dog, in its own voice**, printed on any of the gifts and signed "Love, [dog]" with a paw:
  - "I wait by the door. Weekends too. Obviously."
  - "I took your side of the bed. Not sorry."
  - "I'm your shadow. Where else would I be?"
- **The words:** live AI (Google Gemini through Krish's n8n) writes them, and scripted lines are the fallback.
- **The order chain:** Shopify product page, then Teeinblue (preview and print file), then Printful (makes and ships).
  - Teeinblue holds each order until a person presses **"Confirm & Send to fulfill"**.
  - An order check runs twice a day on GitHub Actions (07:56 and 16:56 London). It tags each order `qc-pass` or `qc-hold`, and never confirms anything.

**Done by Claude Code today (21 Oct):**
- **New product images in the dog's voice.** All four products in Shopify now show them: the mug's five note faces, the blanket, four framed-print images and two ornament images. Don't replace them.
- **Repo updated:** the docs, the growth engine and the AI prompts all match the dog's voice.

## 2. Rules

- **Approved by Krish for this job:**
  - the Teeinblue mockup settings in step 1;
  - the Teeinblue sample text in step 2;
  - the profile wording in step 6.

  Everything else is checking and reporting, unless Krish says yes in the session.
- **Teeinblue's Update / Push to store:** untick **Images, Description, Title and Tags** every time. Otherwise Teeinblue overwrites today's new images and Heartside's descriptions.
- **Never place an order, pay for anything, or confirm an order to print.** Krish places and pays for the test order himself, and he or you press "Confirm & Send to fulfill" only after the check in part 5.
- **Never handle tokens, keys or passwords,** in chat or in files. Ask Krish to log in.
- **Don't change** prices, products, Printful settings, payments, taxes, markets, the theme or the Shopify theme editor without Krish's yes. The theme is deployed only from GitHub.
- **Writing:** no em dashes, no exclamation marks, US spelling.
- **Email:** customer-facing email is krish@heartside.io. Never use a personal Gmail on anything a customer sees; use hello@krishraja.com where a personal contact is needed.

## 3. Make it launch-ready, in this order

1. **Teeinblue: the mug's Preview (campaign 1043122).** Claude Code checked the live page on 20 Oct and found two settings wrong. Full steps: `docs/evidence/claude-code-2026-10-19/COWORK-MUG-PREVIEW-FIX.md`.
   - **Each mockup pair belongs to its own color only.** Today every color's Preview shows all 10 slides. Assign Black's pair to Black, Dark Blue's to Dark Blue, and so on. In each pair, Mockup 1 (the dog face) comes first.
   - **Perspective on, on every mockup** (both faces, all five colors), so the note-face rows bow with the mug instead of running flat. Placement, from `design/teeinblue/mug-v3/mk-geometry.json`:
     - top 208, size 1372 x 593;
     - dog face at left 283, note face at left -696;
     - these are on the 1200 px image, so multiply by 0.8 if Teeinblue asks in its 960-unit canvas.
   - **Save.** If saving asks to update Shopify, untick Images, Description, Title and Tags.
   - **Check:** at heartside.io/products/the-morning-mug, pick each color and press Preview. You should see two slides in that color, and a note face that curves like `design/teeinblue/mug-v3/shopify-images/colors/the-morning-mug-drinker-black.jpg`.
2. **Teeinblue: sample text on all four campaigns** (Mug 1043122, Blanket 1043153, Print 1043167, Ornament 1043174). If a campaign shows sample words before a buyer personalizes (fields' default or placeholder values, or the sample in the mockup editor), replace any old third-person lines ("Waits at the door for you", "Steals your side of the bed", "Will ride anywhere", "Your best friend, no contest") with the dog's voice:
   - Line 1 "I wait by the door. Weekends too. Obviously."
   - Line 2 "I took your side of the bed. Not sorry."
   - Line 3 "Our walks are the best part of my day." (blanket and print); on the mug, Line 3 is "I'm your shadow. Where else would I be?"
   - Line 4 "I'm your shadow. Where else would I be?" (blanket and print)
   - Ornament Line 1 "I'm your shadow. Where else would I be?"

   Keep the field labels exactly as they are ("Dog's name", "Line 1" to "Line 4", "Signed"): the site fills Teeinblue's fields by those labels. Save without pushing images or descriptions.
3. **Teeinblue: fulfillment settings, all four campaigns.** Only look and report:
   - "Auto confirm order" is **off**.
   - Each campaign's Printful product and variants match:
     - Mug: Printful 403, 11 oz; Black 11051, Dark Blue 17362, Dark Green 17359, Red 11049, Pink 12578.
     - Blanket: 711.
     - Print: 2, three frames.
     - Ornament: 900, circle.
   - Prices are $29, $89, $89 and $24.
4. **Printful.** Only look and report:
   - The store is connected to bnf1em-ge, and orders arrive as drafts until confirmed.
   - The billing method is set, so a confirmed order can be charged. If it isn't, tell Krish; don't add one.
   - **Christmas order-by dates for US shipping, per product:** mug, blanket, framed print and ornament. Write down each product's last safe order date and where Printful states it. The site must not promise a date until these are known.
5. **Shopify admin.** Only look and report, unless a fix is listed here:
   - Payments: Shopify Payments active, with no test mode left on.
   - Markets and shipping: US only, free shipping on all four gifts.
   - Products: only the four gifts are Active. The retired HR poster, framed poster and pillow are Draft or Archived.
   - The four product pages each show Heartside's own description, not Printful's stock text.
   - Store contact email: krish@heartside.io. Refund, privacy and shipping policies exist.
   - **Home page title and meta description** (Online Store > Preferences): if the description still names posters, ornaments or pillows, change it to: "Your dog loves you too. Gifts from your dog: a mug, a blanket, a framed print or an ornament, with a message from your dog to the person it loves. A person checks every order. Free US shipping." (Approved wording: `docs/POSITIONING.md` section 1.)
6. **Social profiles** (Krish logged in):
   - **Instagram @yourdoghasnotes:** set the bio's middle line to "Gifts from your dog, in your dog's own words." and keep "Your dog loves you too." and "Free US shipping." Set the display name to "Heartside: Personalized Dog Gifts" if Instagram allows it. Set the bio link to `https://heartside.io/?utm_source=instagram&utm_medium=social&utm_campaign=bio`.
   - **Facebook Page:** make the intro say the same.
   - **TikTok:** check the bio still reads "Your dog loves you too. Personalized dog gifts. heartside.io".
   - Report the before and after for each.
7. **Cowork scheduled tasks:** confirm the old task "Heartside order QC" is **off**. GitHub Actions now runs the order check, and the two must never tag the same order. If it's still on, ask Krish before turning it off.

## 4. Checks before the test order (screenshots for each)

1. **Mug Preview, all five colors:** two slides each, in that color, with a curved note face.
2. **The real journey on Krish's phone** (an iPhone, opened inside Instagram if possible), stopping at the cart:
   1. Open heartside.io and start the chat.
   2. Use a real dog name, She or He, a real photo and a breed.
   3. Answer with chips, plus one "Something else" typed answer.
   4. On the reveal, check that the lines read as the dog talking ("I ..."), the mug shows the chosen color, and "Turn the mug" works.
   5. Tick the **mug in Black** and **the Couch Blanket**.
   6. On each product page, check that Teeinblue's fields hold the lines, "Signed" says "Love, [dog]", the photo is in place, and the Preview looks right.
   7. In the cart, check two lines: the Black mug and the blanket, each with its lines and "Love, [dog]", and the right thumbnail.

   Stop before checkout and leave the cart for Krish.
3. **The n8n AI:** in n8n, open Overview > Data tables > "Heartside AI calls". The journey above should have added rows with `source = ai`. Note any `fallback` or `slow = true`.

If any check fails, stop and tell Krish exactly what you saw, with the screenshot. Don't try to fix the theme or Shopify settings yourself.

## 5. Hand Krish the test order

When parts 3 and 4 pass, tell Krish he can order. He places and pays for it himself, from the cart above or a fresh one:

1. **The order:** one **Morning Mug in Black** and one **Couch Blanket**, with a real dog photo, a typed breed and at least one typed answer. This tests the AI, the color, both print layouts and the order check in one order.
2. **After he pays:**
   - **Shopify:** the order shows both gifts with their properties (Line 1 to 3 or 4, Signed, `_hs_answers`, `_hs_lines`).
   - **Teeinblue:** the order exists with a print file for each gift. Open each print file and check the photo, the lines, "Love, [dog]" and the paw are inside the print area and spelled right.
   - **Order QC:** at the next run (07:56 or 16:56 London), the order is tagged `qc-pass`, and its note says "Color: Black (Printful 11051)". A `qc-hold` opens a GitHub issue for Krish; read it before going on.
   - **Printful:** the order waits as a draft with both products, the mug as Black 11 oz (11051).
3. **Confirm:** only when every check above passes, Krish (or you, on his explicit yes in the session) presses **"Confirm & Send to fulfill"** in Teeinblue. Note the Printful order number and its estimated delivery.

## 6. Search and AI listings (approved by Krish, 21 Oct: "yes to all four")

Claude Code put the site side live on 21 Oct:
- the Biscuit favicon and the new share card;
- structured data on every page;
- a brand-first `/llms.txt`;
- the Answers library at heartside.io/blogs/answers, with three answers and a small footer link.

Strategy: `krishanraja/growth-heartside`, `docs/GEO-AEO.md`. With Krish logged in, do these, and report each with a screenshot:

1. **Google Search Console:** add the domain property heartside.io (verify by DNS or the Shopify-friendly HTML tag method Search Console offers), submit `https://heartside.io/sitemap.xml`, then use URL Inspection to request indexing for the homepage, the four product pages and the three answers.
2. **Bing Webmaster Tools:** sign in and import the site from Search Console (the quickest way), or verify heartside.io. Submit the sitemap. If Bing offers an AI or Copilot citations report, note where it is.
3. **Google Merchant Center** (through Shopify's Google & YouTube channel; installing it is Krish's yes):
   - free listings on for the US;
   - the four products approved;
   - shipping is free to the US;
   - the products are marked as custom.

   Report any disapproval and its reason. Don't change prices or titles without Krish's yes.
4. **Bing Merchant Center** (Microsoft Merchant Center): connect the same catalog if Shopify's Microsoft channel offers it; otherwise report what it needs.
5. **Pinterest:** a business account for Heartside (hello@krishraja.com or krish@heartside.io, never a personal Gmail). Claim heartside.io and connect the catalog if Shopify's Pinterest channel is installed (installing it is Krish's yes).
6. **Shopify's AI sales channels:** in Shopify admin > Sales channels, list any AI or agentic channel Shopify offers (ChatGPT, Perplexity, Copilot or similar). Don't turn one on; report what's offered so Krish can decide.

Check afterwards: Search Console's sitemap status reads "Success", and the URL Inspection of one answer page shows "URL is available to Google" once crawled.

## 7. Report back to Krish

- **Part 3:** what you changed, with before and after screenshots, and what you only checked, with its state:
  - auto confirm off or on;
  - Printful billing set or not;
  - the four order-by dates and their source;
  - payments, markets, shipping and policies;
  - the profile wording.
- **Part 4:** the screenshots, and anything that failed.
- **After the order:** the Shopify order number, the Teeinblue print files (screenshots), the QC tag and note, and the Printful order number.
- **Anything a tool wouldn't allow:** stop at that step, and say what it offered instead.
