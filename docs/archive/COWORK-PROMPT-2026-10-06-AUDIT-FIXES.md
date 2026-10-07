# Prompt for Claude Cowork: fixes from tonight's judge panel (6 October)

Paste everything below the line into the Cowork session. This is separate from `docs/COWORK-PROMPT-2026-10-06.md` (the ornament note picker and product descriptions) — do both in the same sitting if you're already in Teeinblue's admin, but they're independent.

---

You're working in Krish's browser on **Heartside** (Shopify store `bnf1em-ge`, heartside.io, live and public). Tonight a blind nine-panel audit tested the live site end to end. These are the fixes it surfaced that only a browser session can make — none of them are theme code, so Claude Code can't do them from the repo.

Krish is at the keyboard. When a page needs a login, a code, or a button only the account owner may press, stop and ask him to do that step, then carry on.

## Hard rules

- **Theme.** You may remove a section in the theme editor (task 2 asks for exactly that). Don't add new sections, don't edit Liquid or settings beyond what each task says, and don't touch any `hs2-*` section. Report anything you're unsure about rather than guessing.
- **Ask Krish first** before spending money, installing an app, or changing checkout, payments, markets, taxes, domains or DNS.
- **No orders.** Carts are fine to test with; empty them afterward. Never place a real order.
- **Honesty.** No invented dates, reviews or scarcity.
- **Email.** Customer-facing email is krish@heartside.io.

## Why these matter

Tonight's panel found that an old product line (dog slings) is still live in three places on the site, the homepage's search/share text advertises products and a discount that don't exist, checkout promises a delivery date that ignores your own stated production time, and the mobile menu is functionally invisible. None of these take more than 15 minutes each, and all four were independently confirmed by more than one tester tonight.

## Task 1: Teeinblue — require the photo on the two Annual Review products (5 minutes)

**What's wrong:** On the ornament and the pillow, Teeinblue already requires a photo before Add to Cart works. On **The Annual Review** and **The Annual Review, Framed**, it doesn't. Tonight's test added an order with no photo to the cart successfully — the order's preview then showed Teeinblue's own stock sample dog signed with the customer's typed name, with nothing on the order to flag that the real photo never arrived. Claude Code closed most of this gap tonight (the photo now hands itself to Teeinblue automatically the moment it's attached, instead of needing a second tap), but if a shopper skips the review entirely and goes straight to a product page with no photo at all, this is the remaining hole.

**Do this:**
1. Open Teeinblue's campaign editor for **The Annual Review** (campaign tied to product base 364791 or similar — look for "The Annual Review" in the campaign list).
2. Find the photo/headshot field ("Attach your dog's headshot"). Mark it **required**, the same way it already is on Tiny Me and The Body Double.
3. Repeat for **The Annual Review, Framed**'s campaign.
4. Test: open each product page with a private/incognito window, fill in the names, and try Add to Cart with no photo. It should now be blocked with a clear message, the same way the ornament already behaves.
5. While you're in Teeinblue, check **Settings > Billing**: confirm a card is on file for when the free trial ends **19 October** (the day before launch). If none is on file, add one — ask Krish to approve the card entry.

## Task 2: Remove the leftover sling product slider (15 minutes)

**What's wrong:** A before/after image-comparison section showing a pink and beige dog sling or carrier (not something Heartside sells) is live on the homepage, all four product pages, and the cart — it has nothing to do with dogs, posters, ornaments or pillows, and reads as an unfinished or reused store at the exact moment a new visitor is deciding whether to trust the site.

**Do this:**
1. Shopify admin > Online Store > Themes > **Heartside launch** > Customize.
2. Open the homepage. Scroll to the bottom, above the footer. Look for an image-comparison / before-after slider section (it may be labeled something generic like "Image comparison" or carry a brand mark on the images themselves).
3. Click it, then **Remove section**.
4. Since the same panel found it on every product page and the cart too, it's most likely sitting in a shared section group (footer), so removing it once should clear it everywhere. Check: reload the homepage, one product page, and `/cart` to confirm it's gone from all three. If it's still showing anywhere, it's placed per-template — repeat the removal there.
5. Don't touch anything else in that section group.

## Task 3: Clean the sling references out of policy text (10 minutes)

**What's wrong:** The Terms of Service still contains leftover wording from when the store sold dog slings:

> "Our carriers and slings are designed for small dogs up to the weight stated on each product page. Please read the product description and use the product as described."

and:

> "Prices and offers. Prices are in US dollars for US customers. Offers such as 30% off and free US shipping run for the dates shown on the site and may end without notice after those dates."

Heartside doesn't sell slings or carriers, and there's no 30% off anywhere on the site today.

**Do this:**
1. Shopify admin > Settings > Policies > **Terms of service**.
2. Find and remove the "Our carriers and slings..." sentence entirely (it serves no purpose for posters, ornaments or pillows — nothing needs to replace it).
3. In the "Prices and offers" paragraph, remove the specific "Offers such as 30% off..." sentence, or reword it to something generic like: "Any discount or promotion runs only for the dates shown on the site and may end without notice." Don't invent a real offer.
4. Also check **Settings > Pages > Contact** (`/pages/contact`) for any leftover sling text or imagery below the contact form — tonight's test flagged something there but couldn't confirm the exact content through the site's bot protection. Look at the live page yourself and remove anything that isn't about contacting Heartside.
5. Save.

## Task 4: Fix the homepage's search and share text (10 minutes)

**What's wrong:** The homepage's SEO description and social-share text (what shows in a Google result or when the homepage link is pasted into iMessage, Instagram or Facebook) currently reads:

> "Engraved name tags, the Heartside Sling and small things that keep your dog close. Free US shipping and 30% off until 1 November."

None of that is true today: there are no engraved name tags, no sling, and no 30% off. This is also missing a share image entirely (a shared link currently shows no picture).

**Do this:**
1. Shopify admin > Online Store > **Preferences**.
2. Under "Title and meta description," replace the description with something accurate, for example: *"Personalized dog gifts: a poster of your dog's annual review of you, a ceramic ornament and a photo pillow, made from your dog's own photo. Free US shipping."* Keep it under about 160 characters.
3. Under "Social sharing image," upload one of the product photos (the Christmas-morning poster shot or the pillow-on-sofa shot both work well) so shared links show a picture instead of nothing.
4. Save, then check with Facebook's Sharing Debugger (developers.facebook.com/tools/debug/) and Google's Rich Results Test on `https://heartside.io/` to confirm the new text and image show up (these tools force a fresh crawl; the old text can be cached otherwise).

## Task 5: Fix the checkout delivery-date estimate (15 minutes)

**What's wrong:** Tonight's checkout test with a US address showed a specific delivery promise — "Standard, Tue Oct 13–Thu Oct 15" — calculated from shipping transit time alone. It ignores the 2–5 business days Printful needs to print the order first. Your own shipping policy says 5–12 business days total (2–5 to print, 3–7 to ship); checkout is promising something 5–7 days faster than that.

**Do this:**
1. Shopify admin > Settings > **Shipping and delivery**.
2. Find the shipping profile/rate that applies to these products (likely "General Profile" or similar, covering all US rates).
3. Look for a "Delivery time" or "Transit time" setting on the rate. If Shopify lets you add handling/processing time separately from transit time, add **2–5 business days** of processing time so the total matches your policy (5–12 business days).
4. If there's no separate processing-time field on this plan, the simplest fix is to turn off the delivery date estimate for these shipping rates entirely, so checkout just says "Standard shipping" with no date — safer than a wrong date.
5. Test: add a product to cart, go to checkout, enter a US address, and check the date range shown matches (or is silent, not wrong).

## Task 6: Fix the invisible mobile menu and header icons (15 minutes)

**What's wrong:** On mobile, the hamburger menu opens to a drawer where every link's text color matches the background almost exactly (`rgb(249,249,249)` on `rgb(249,249,249)` or similar) — the links are there, just unreadable. The same near-invisible color affects the cart, search and menu icons in the sticky header once you scroll past the hero on every page. This isn't a hs2 section; it's the theme's own header and menu color scheme.

**Do this:**
1. Online Store > Themes > Heartside launch > Customize.
2. Open **Theme settings > Colors** (or the color scheme assigned to the header/menu — Helio themes usually have a color scheme picker per section).
3. Find whichever color scheme the header and mobile menu drawer use. Check the text/icon color against the background color it's actually rendering on (not just what the scheme editor preview shows, since the live bug is specifically after scrolling).
4. Set the menu drawer's link text and the header's icon color to the brand ink color (dark, near-black) so they're readable against the near-white background.
5. Test on an actual phone or a resized browser window: open the menu and confirm the links are readable; scroll down any page and confirm the cart/search/menu icons stay visible.

## Task 7: Check the Meta ad account status (5 minutes, just a status check)

This isn't a fix — just find out where things stand, since tonight's analysis found this is the biggest open question standing between "the site works" and "there's a channel to advertise on."

1. Meta Business Suite / Ads Manager, logged in as Krish.
2. Report back: Is an ad account connected to the Heartside Facebook Page? Is Instagram (@yourdoghasnotes) linked to that Page? Is a payment method on the ad account? Has the product catalog sync finished (it was "syncing additional info" as of 5 October)?

Don't create or fund anything here — just report the current state.

## Report back

Paste this into the Claude Code session:
- Task 1: done or not, and the actual result of the no-photo Add to Cart test on both products. Whether a card is now on file for Teeinblue.
- Task 2: confirm the slider is gone from the homepage, one product page, and the cart.
- Task 3: what you removed from the Terms of Service, and what (if anything) you found and removed on the Contact page.
- Task 4: the new description and share image, and what the Facebook/Google debug tools showed.
- Task 5: what setting you changed, and what checkout now shows for a US address.
- Task 6: what you changed, and confirm the menu and header icons are readable.
- Task 7: the Meta ad account status, exactly as you found it.
