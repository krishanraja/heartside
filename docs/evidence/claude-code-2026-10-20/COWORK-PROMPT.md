# Cowork prompt: the dog's own voice is live; get ready for the mock order (20 Oct 2026)

Paste everything below into Claude Cowork.

---

You're working for Krish Raja on Heartside (heartside.io, Shopify store `bnf1em-ge`): gifts given on behalf of a dog to the person it loves most. There are four products, all live: The Morning Mug (Teeinblue campaign 1043122, five colors), The Couch Blanket (1043153), The Framed Print (1043167) and The Tree Ornament (1043174). Claude Code built and shipped the change below today. Your job is the list in part 3. That list must be finished before Krish redoes the mock order.

## 1. What changed today: gift lines are now a message from the dog

**Krish's words (20 Oct), on a cart showing "Understands every word. Pretends he doesn't.":** "It should be a message from your dog in their personality style... capture their demeanour, cross reference the corpus, and create literally a humanized warm message from the dog to the person with some humour and dog anthropomorphisms. Make sure all products create a warm message."

**The ruling.** It replaces the 13 Oct "gift lines never say I" rule and the 15 Oct "no breed question yet".
- On every gift, **I, me and my are the dog; you is the person.** The lines read as one warm little message from the dog: warm first, funny second, with a dog's logic and a straight face.
- **Never in a gift line:** he, she, the dog's name, the person's name, an exclamation mark, or "Dear". "Love, [dog]" with the paw stays the only sign-off. The 15 Oct "every gift as a letter" direction stays rejected.
- **Biscuit doesn't change.** He is still the host in the chat and talks to the buyer about the dog and the person.

**What a buyer now sees:**
- **Scripted lines.** All 36 chip lines are rewritten. Each fits the mug's two rows and Teeinblue's 45-character fields. Examples:
  - "I wait by the door. Weekends too. Obviously."
  - "I took your side of the bed. Not sorry."
  - "You have coffee. I have hope of toast."
  - "Where you go, I go. Bathroom included."
  - "I'm your shadow. Where else would I be?" (the mug's third line, and the ornament's only line)
  - If the buyer skips everything: "Best part of my day? You walking in." / "I'm never far from you." / "Any time with you is my favorite time." / "I'm yours. Always."
- **The AI writes for every buyer.** At the reveal it rewrites the four lines as one message in that dog's personality, from the buyer's answers. The scripted lines show at once and are the fallback if the AI is slow or fails.
- **Breed.** Step 1 has an optional "Breed, if you know it" field. An exact match in the breed corpus sends the breed's archetype (e.g. "Herding Manager") to the AI as a light tone signal. It is never shown to the buyer.
- **Checks.** The n8n rules and the theme both reject a line that talks about the dog from outside ("Pretends he doesn't."), names the dog or the person, or has an exclamation mark.

**Live and checked (20 Oct):**
- **Theme:** https://github.com/krishanraja/heartside/pull/31, pushed to "Heartside launch" by GitHub Actions run 56.
- **n8n:** both webhooks published. Typed answer version `1a4ae334`, compose version `e8f540d4`. Rollback is publishing `5f1ba99b` (typed) and `f014b5be` (compose) from each workflow's history.
- **A live test for Mowgli, a Border Collie,** returned:
  - "I bring the stick back. Every time."
  - "Your feet are my pillow. It is the law."
  - "Our walks are the best part of my day."
  - "You are my best friend. Not even close."
- **On the mug page:**
  - Teeinblue's Line 1 to 3 and Signed fields fill with these lines and "Love, Mowgli".
  - The cart line shows them, with the whole mug in the chosen color.
  - The Shopify images, gallery, description and Your Words box are correct.

The full record is in `docs/evidence/claude-code-2026-10-20/FOR-COWORK.md` and in `docs/V3-GIFTS-FROM-YOUR-DOG.md` section 13.

## 2. Rules

- **Approved by Krish for this job:** the two Teeinblue mockup settings in part 3, step 1. Everything else here is checking and reporting.
- **Ask Krish first** before anything else: prices, products, Printful settings, the theme, product images, descriptions, or discounts. Never place an order or spend money: Krish places and pays for the mock order himself.
- **Any Update / Push to Shopify in Teeinblue:** untick **Images** and **Description** every time. A push with them ticked replaces the approved Shopify images and Heartside's description.
- **Never handle tokens, keys or passwords,** in chat or in files.
- **Writing:** no em dashes, no exclamation marks, US spelling.
- **Email:** customer-facing email is krish@heartside.io. Never put a personal Gmail on anything a customer sees; use hello@krishraja.com.

## 3. Before Krish redoes the mock order, in this order

1. **Fix the mug's Teeinblue Preview** (campaign 1043122). The full steps are in `docs/evidence/claude-code-2026-10-19/COWORK-MUG-PREVIEW-FIX.md`. Claude Code checked the live page on 20 Oct, and both settings are still wrong:
   - **Each mockup pair belongs to its own color only.** Today every color's Preview shows all 10 slides; with Red picked, it opened on a black mug. Assign Black's pair to Black, Dark Blue's to Dark Blue, and so on. In each pair, Mockup 1 (the dog face) comes first.
   - **Perspective on, on every mockup** (both faces, all five colors), so the note-face rows bow with the mug. Today they run flat. Keep the placement from `design/teeinblue/mug-v3/mk-geometry.json`:
     - top 208, size 1372 x 593;
     - dog face at left 283, note face at left -696;
     - these are on the 1200 px image, so multiply by 0.8 if Teeinblue asks in its 960-unit canvas.
   - **Save** with Images and Description unticked.
   - **Check:** on heartside.io/products/the-morning-mug, pick each of the five colors and press Preview. You should see exactly two slides in that color, and a note face whose rows curve like `design/teeinblue/mug-v3/shopify-images/colors/the-morning-mug-drinker-black.jpg`, with the words inside the white band.
2. **Check the other three gifts take the new lines** (Blanket 1043153, Print 1043167, Ornament 1043174). Change nothing; only look and report.
   - On a phone, run the chat at heartside.io: chips only, any dog name, a breed such as "beagle". Pick the blanket, the print and the ornament on the choose screen.
   - On each product page:
     - Teeinblue's Line fields hold the dog-voice lines (Line 1 to 4 on the blanket and the print, Line 1 on the ornament) and Signed says "Love, [dog]";
     - nothing is cut off at 45 characters;
     - the Preview shows the words fitting.
   - Screenshot each Preview.
3. **List every product image that still shows the old wording.** The mug's 10 approved Shopify photos show the old third-person lines ("Waits at the door for you, weekends too."). Check the blanket, print and ornament images the same way. Report which images show old lines. Don't replace any: Krish decides whether Claude Code re-renders them before ads.
4. **Run the whole journey on real phones, without paying.**
   - The two journeys:
     - On an iPhone, open heartside.io inside Instagram's in-app browser.
     - On an Android phone, open it inside Facebook's.
   - On each, go: chat, reveal, choose two gifts (the mug in a color other than Pink, plus one other), then the cart.
   - Confirm:
     - the reveal's lines are in the dog's voice;
     - the mug's color carries through to the product page, the Preview and the cart;
     - each cart line shows the right color, the lines and "Love, [dog]".
   - Stop at the cart. Don't check out.
5. **Watch the AI for a day.** In n8n, open Overview > Data tables > **Heartside AI calls**. Compose rows should now arrive for every chat that reaches the reveal. Report the share of rows with `source = fallback` or `slow = true`. Above about 1 in 10, tell Krish.
6. **Confirm the old Cowork scheduled task "Heartside order QC" is off.** GitHub Actions runs order QC at 07:56 and 16:56 London time, and the two must not tag the same order. If it's still on, ask Krish before turning it off.
7. **Hand the mock order to Krish.** Once 1 to 6 pass, tell Krish he can place it. Last time the mug came out pink for a boy dog, so suggest:
   - one Black mug and one Couch Blanket in a single order, with a real dog photo;
   - a breed typed in step 1, and at least one answer typed under "Something else", so the AI's lines are tested end to end.

   After he orders, order QC should tag it `qc-pass`, with "Color: Black (Printful 11051)" in the order note. In Teeinblue, the order still needs "Confirm & Send to fulfill". That's Krish's step.

## 4. Report back to Krish

- **Step 1:** before-and-after screenshots of the mug Preview for each of the five colors.
- **Step 2:** a screenshot of each other gift's Preview, and any line that was cut off or didn't fill.
- **Step 3:** the list of product images showing old wording.
- **Step 4:** the two phone runs, with a note of anything that broke.
- **Step 5:** the fallback rate from the AI calls table.
- **Step 6:** whether the old order QC task is off.
- **Anything Teeinblue wouldn't allow.** For example, if it can't assign a mockup to a single color, stop at that step and say what it offers instead.
