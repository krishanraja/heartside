# Heartside: brief for Claude CoWork to finish the launch

> **Superseded on 4 October 2026 by `docs/V2-FROM-THE-DOG.md`.** The ornament-led plan below no longer applies. Two parts still hold: the deploy route (Phase 1: Theme Access, the GitHub secret and the workflow, already working) and the browser notes at the end. Teeinblue setup is in `docs/TEEINBLUE-SETUP.md`.

Paste everything below the line into CoWork. It's written for an agent working in Krish's browser with Shopify admin, Printify and GitHub open.

---

You're finishing the Heartside Shopify store so Krish can launch it on **20 October 2026**. Today's work picks up where a Claude Code session left off. All of that work is in the public GitHub repo **https://github.com/krishanraja/heartside** (branch `main`). Work through the phases below in order. Stop only at the marked decision points, and keep going on everything else while you wait. Krish presses publish; you never do.

## Why this exists

Heartside sells gifts for people whose small dog is their person. The line is "Keep them close." It's a dropshipping side-income test: US only, USD, a $100 to $150 ad budget, and an offer of 30% off plus free US shipping that ends on 1 November. The hero product is the **"Their Person" ornament**, a round ceramic Christmas ornament. The front has the customer's own dog in a watercolor heart with "[Name] is my person." underneath. The back says "Merry Christmas from the one who hogs the bed."

The feeling every page should give: *"that is literally my dog, I need to send this to someone."* Warm, a little cheeky, cream and ink, one watercolor heart, nothing that looks like a pet-store aisle. Customer-facing copy uses US spelling (favorite, color, personalized).

## Read these first (10 minutes, all on `main`)

1. `docs/HANDOFF.md`: store state, the open list, and **browser lessons for this Shopify admin** (see the last section of this brief too).
2. `docs/BRIEF.md`, sections 1 (the feeling), 7 (the look) and 10 (guardrails).
3. `ornament/README.md`: the ornament print files and step-by-step Printify setup.
4. `ornament/SELL.md`: the product page copy and the reasoning behind it.
5. `shopify/README.md`: the homepage sections, what each does, and the checklist for the real theme.

## Already done (don't redo)

- **Ornament print files** in `ornament/`: frame overlay with the heart-shaped photo window, mask, sample front, back (plus two alternative backs), previews.
- **A homepage** built as ten Shopify Online Store 2.0 sections in `shopify/` (`hs-*.liquid`), plus snippets, `templates/index.json`, fonts and images. Shopify's Theme Check passes with zero offenses. Screenshots are in `shopify/preview/`.
- **A deploy workflow**, `.github/workflows/shopify-theme-push.yml`. It pushes `shopify/` into a Shopify theme you name, adds or updates only Heartside files, and refuses to touch the live theme.
- The social sharing image `assets/social-share-1200x628.png` and favicon `assets/favicon-512.png`.
- Dog photo licences are confirmed by Krish.

## Rules that don't bend

1. **Work only in an unpublished copy of the Helio theme.** Never publish a theme, never launch, never put the store in or out of password mode. Krish does those.
2. **Don't change store-level settings:** currency, payments, markets, tax, domains, checkout.
3. **Don't spend money or install apps without asking Krish.** That covers test orders, paid apps and samples. The one exception: Shopify's free **Theme Access** app, which Krish approves for Phase 1.
4. **The Theme Access password goes in exactly one place**, the GitHub repository secret. It never goes in chat, notes, files, commits, Shopify fields or any summary you write.
5. **No invented trust signals:** no fake reviews, ratings, customer counts, testimonials or "only 3 left". Never publish a delivery or order-by date that a supplier hasn't confirmed. Krish's personal Gmail never appears anywhere customer-facing; the contact address is krish@heartside.io.
6. **Code changes go through GitHub, not Shopify's code editor.** Edit the file on github.com, commit to `main`, then rerun the workflow. That keeps the repo as the single source of truth. Settings in the theme editor (products, words, images, toggles) are fine to change in Shopify.
7. **When something is Krish's call**, write it down with your recommendation and keep going on everything else. Bring all the decisions to him together in the final report.

## Phase 1: Put the homepage into a copy of Helio (about 20 minutes)

Why this route: the repo is public, so Helio's paid theme code can't live in it, and Shopify's own GitHub connection only builds a theme from a complete theme stored in the repo. The workflow pushes just the Heartside files into a copy of Helio instead. You don't need a terminal, and you don't upload files one by one.

1. **Duplicate the theme.** Shopify admin > Online Store > Themes > the current theme (Helio) > `…` > **Duplicate**. Rename the copy **Heartside launch**. Open it in **Customize**. The theme ID is the number in the URL (`/themes/<ID>/editor`); note it.
2. **Create a deploy password.** Install **Theme Access** by Shopify (free) from the Shopify App Store.
   - In the app: **Create password**, name `GitHub deploy`, email `krish@heartside.io`.
   - Shopify emails a one-time link to view it. Open the link and copy the password (it starts `shptka_`).
3. **Store it in GitHub.** On github.com/krishanraja/heartside: **Settings > Secrets and variables > Actions > New repository secret**. Name: `SHOPIFY_CLI_THEME_TOKEN`. Value: the password. Save, then close the email tab.
4. **Run the deploy.** On the repo: **Actions** > **Push homepage to a Shopify theme** > **Run workflow** > branch `main` > `theme_id` = the copy's ID > Run.
   - It takes 2 to 4 minutes. When it's green, the run summary has a preview link.
   - If it's red, the error line says why: a missing secret, a wrong ID, or the live theme refused.
   - If Actions is switched off, turn it on under Settings > Actions > General, then rerun.

**Done when** the copy's preview shows the new homepage, headed "Put the real *favorite* on the tree." with the dachshund and the hanging ornament.

If Theme Access or GitHub Actions is blocked, don't improvise a workaround. Note it for Krish. The manual route ("Without the CLI") is in `shopify/README.md`.

## Phase 2: Build the ornament in Printify (about 45 minutes)

Follow `ornament/README.md` > "Wiring it in Printify" exactly. Download the files from the repo: `ornament/front-frame-overlay.png`, `ornament/back.png`, and the fonts in `tools/fonts/`. The details that matter:

- **Product.** Ceramic Decoration Ornament, **Circle**, from a print provider that ships from the US.
- **Front layers, top to bottom.**
  - The frame overlay, filling the print area.
  - The name: personalizable text, Cormorant Garamond Medium Italic, `#121010`, max **14** characters, label "What's their name?".
  - "is my person.": static text, same family in Medium.
  - The customer photo: a personalizable image placed **under** the frame.
  - Use the positions given in the README.
- **If Printify won't let the photo sit under the frame,** switch to manual personalisation as the README describes and note it for Krish.
- **Back.** `back.png`.
- **Test** the live preview with a portrait phone photo, with the name "Sir Waffleton" (13 characters) and with "Bo".
- **Price and cost.**
  - List price **$34.99**.
  - Read the provider's base cost (with both sides printed) and its first-item US shipping. Together they must come to **$15.45 or less**; that keeps the price after 30% off above Krish's floor.
  - If the total is higher, don't change the price. Record the numbers for Krish.
- **Copy.** Use `ornament/SELL.md` > "Product page, top to bottom": title "Their Person Ornament", promise, body, photo help text and name field.
- **Publish to Shopify, then set the product to Draft.**
  - Leave it Draft until Krish says go. That way it doesn't go on sale before the launch.
  - The homepage falls back cleanly while it's Draft: built-in price, buttons to `/collections/all`.
  - Record Krish's choice to make: activate now or at launch. Recommend at launch.
- **Shopify checks.**
  - It's in the **All gifts** collection, so the 30% and free shipping apply.
  - Note which shipping profile it landed in.
  - In the Helio theme copy, add Printify's **Personalize** app block to the product template the ornament uses.
- **Printify settings.**
  - Every personalised order comes in as **Review needed** and needs approving. That review step is intended; leave it on.
  - Never press "Request fulfillment" in Shopify for personalised orders, because it skips the review.
  - Note the provider's production time and shipping time. They become the order-by date.

## Phase 3: Finish the homepage in the theme editor (about 20 minutes)

In Customize for **Heartside launch**:

1. **Header area.** Add section > **Heartside offer bar**, and drag it above the header. Hide Helio's own announcement bar; it still says "50% off", which is wrong.
2. **Products.** Choose the ornament in **Heartside hero**, **Heartside name preview**, **Heartside ornament wall** and **Heartside phone buy bar**. In **Heartside gifts**, choose the ornament, the sling, the tag (once it exists, see Phase 4) and the water bottle. A card with no product stays hidden.
3. **Collection handle.** Products > Collections > All gifts: check that the URL handle is `all-gifts`. If it isn't:
   - Edit `shopify/snippets/hs-offer.liquid` on GitHub and set `hs_collection` to the real handle.
   - Commit to `main` and rerun the workflow.
   - If you skip this, the page shows full prices with no discount.
4. **Favicon.** Theme settings > Favicon: upload `assets/favicon-512.png` from the repo.
5. **Social sharing image.** Online Store > Preferences > Social sharing image: upload `assets/social-share-1200x628.png`. Change nothing else on that page.
6. **Save.** Leave the **Order-by date** in "Heartside how it works" empty until Krish confirms a date.

## Phase 4: The rest of the open list

1. **The Heartside Tag.**
   - Push the Hello Pet ID Tag live **through Dropshipper-ai**, so it lands on the dropship shipping profile. Don't create it by hand.
   - Title "The Heartside Tag", list price $24.99, copy from `docs/BRIEF.md` section 9 ("The Tag").
   - Find out how the supplier captures the dog's name and its production time, and record what you learn.
2. **Bundles: skip for launch** (recommended; confirm with Krish). The ornament ships from Printify and the sling, tag and bottle from Spocket suppliers. A bundle across two fulfilment networks needs a bundles app and gets messy with personalised items.
   - For launch, sell everything individually.
   - Let the homepage's "One for your tree, one for their grandma's" line sell the second ornament.
   - Record a one-line proposal for Krish anyway.
3. **Order-by date.** From the Printify provider and each Spocket supplier listing, collect production and shipping times. Propose a single Christmas order-by date for the US with a few days of margin, and show your working. **Don't publish it.** Krish confirms it first.
4. **Discount end time** (Krish's call). Both automatic discounts end at 11:59 pm on 1 November in the store's time zone (London). That is 4:59 pm in California.
   - Recommendation: move both to end at 11:59 pm Pacific on 1 November, so "until November 1" holds for every US shopper.
   - If Krish says yes, change both discounts. Then set `hs_ends` to `2026-11-02T07:59:00+00:00` in `shopify/snippets/hs-offer.liquid` on GitHub and rerun the workflow.
5. **Pink and Beige sling variants** (Krish's call). They show sold out and the brief wants Charcoal only. Hiding them means deleting them. Recommendation: delete them. Ask first.
6. **US sales tax.** Leave it. Krish's accountant decides.

## Phase 5: Check the copy theme like a customer (phone first)

Open the copy's preview link on a phone-sized window, then desktop.

- [ ] The homepage matches `shopify/preview/phone-full-page.png`. Helio's header and footer sit cleanly around it, with no stray Helio heading or button styles.
- [ ] The offer bar countdown shows, and prices read $24.49 next to a struck-through $34.99 (or whatever the chosen products cost, minus 30%).
- [ ] The name preview: typing a name updates the ornament; the breed buttons swap the photo; "Turn it over" shows the back; the buy button reads "Make [Name]'s ornament".
- [ ] "Send it to the group chat" saves or shares a picture. If it only shares a link, note it; the fallback is intended.
- [ ] The ornament product page shows the Personalize button, and a photo and name preview correctly.
- [ ] The cart shows 30% off and free US shipping on a mix of products.
- [ ] The email signup creates a customer tagged `newsletter`.
- [ ] Every link works (FAQ returns-policy link, footer policies) and nothing shows Krish's personal email.
- [ ] Test order: **prepare it, don't place it.** It costs real money with Printify. Ask Krish.

## Phase 6: Report to Krish (one message)

- **Done:** with the copy's preview link and the GitHub Actions run link.
- **Waiting on Krish:** each item with your recommendation in one line. The likely list:
  - Activate the ornament now or at launch.
  - The ornament cost against $15.45.
  - The order-by date.
  - The discount end time.
  - The sling variants.
  - Bundles.
  - The test order.
- **The publish step:** Online Store > Themes > Heartside launch > Publish, when he's happy.

Keep it short and concrete. No celebration, no padding.

## Browser notes for this Shopify admin (from the last session)

- If a real click on the Save bar does nothing, run `document.querySelector('button[aria-label="Save"]').click()` in the page.
- Typing with no field focused opens the barcode scanner. Click into the field first.
- Native selects (such as market status) ignore clicks. Focus the select, type the first letter of the option, then press Return.
- Give pages 10 to 20 seconds after navigating. Settings modals and theme-editor panels are cross-origin frames, so use coordinates there.
- Dropshipper-ai's Find Products keeps its filters (Pets, ships to US, 1 to 3 days) and returns the same small set whatever the query.
- Don't type code into Shopify's code editor. It auto-closes brackets and tags and mangles pasted Liquid. Code goes through GitHub and the workflow (rule 6).
