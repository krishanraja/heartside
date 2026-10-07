# Prompt for the Claude session running the Shopify browser

Paste everything below the line into that session.

---

You're working in Shopify admin for **Heartside** (store `bnf1em-ge`, domain heartside.io). It's a US-only gift store launching on 20 October 2026. It sells personalized gifts "written by your dog". The hero product is **The Annual Review**: a 12 × 18 inch poster of a dog's deadpan performance review of its owner, with the dog's photo. It costs $39, or $89 framed. Printful makes everything to order, and the Teeinblue personalizer feeds it.

The theme is built in code at github.com/krishanraja/heartside. A GitHub workflow deploys it into the unpublished theme **"Heartside launch" (#197492998526)**. Your job is the admin and theme-editor work that code can't reach.

**Read first** (public repo):
- https://github.com/krishanraja/heartside/blob/main/docs/V2-FROM-THE-DOG.md (sections 1 to 5: why the store exists, the tone, the range, prices, fulfilment)
- https://github.com/krishanraja/heartside/blob/main/docs/TEEINBLUE-SETUP.md (the six products and their Teeinblue templates)
- https://github.com/krishanraja/heartside/blob/main/shopify/README.md (what the theme does)

## Hard rules
- **Publishing.** Never publish a theme. Krish publishes.
- **Ask first.** Stop and ask Krish before spending money, installing any app, ordering a sample or test order, or changing checkout, payments, markets or domains. If a task needs one of those, skip it and list it in your report.
- **Theme code.** Don't edit theme code.
- **Theme editor.** Change only what's listed in task 5. The next code deploy overwrites template settings, so record every setting you change and report it.
- **Honesty.** No invented reviews, scarcity or dates. Leave every `[DATE]` and `[… SHOT]` placeholder as it is.
- **Email.** The contact address is krish@heartside.io. Never use a personal Gmail anywhere customer-facing.

## Tasks, in order
1. **End the 30% discount.** Go to Discounts and find the automatic "30% off" discount, which applies to the All gifts collection. Deactivate it. Krish decided this on 4 October because 30% off wipes out the margin on the new range. Free US shipping stays.
2. **Store email.**
   - Settings > General: set the store contact email and the sender email to krish@heartside.io.
   - Settings > Policies: replace any heart-side.org address with krish@heartside.io.
3. **Printful safety net.** In the Printful dashboard, go to Settings > Store settings > Orders and turn on **"Manually confirm all imported orders"**. Every order must reach Printful as a draft that a person confirms. This keeps the site's promise "A human checks every order" true.
4. **Products and Teeinblue templates.** Follow TEEINBLUE-SETUP.md for the six products, at the prices in V2-FROM-THE-DOG.md section 4, with no compare-at prices.
   - **Teeinblue orders:** set Teeinblue to send orders to Printful as drafts or on hold, never auto-confirmed.
   - **Field labels:** use them exactly as written in TEEINBLUE-SETUP.md. The theme copies the shopper's homepage answers into Teeinblue by reading those labels, so the shopper never types anything twice.
   - **The Uniform:** create the sweatshirt ($89) and the bandana ($40) as separate products. The $129 set needs the Shopify Bundles app, so ask Krish before installing it.
5. **Theme editor:** Online Store > Themes > "Heartside launch" > Customize. Do not publish.
   1. **Assign templates.** Products > each product > Theme template:
      - **review** for The Annual Review and the framed Annual Review.
      - **heartside** for the pillow, sweatshirt, bandana, socks and ornament.
   2. **Add Teeinblue's app block** to the product templates **review**, **heartside** and **landing**, between "Homepage answers" and "Add to cart". The landing template is the ad landing page; preview it by adding `?view=landing` to the poster's product URL.
   3. **Homepage product pickers:**
      - "HS review builder": choose The Annual Review.
      - "HS leak the review": choose The Annual Review.
      - "HS benefits package": choose each card's product.
   4. **Record your changes.** Write down every product handle and ID you picked and every setting you changed.
6. **Check payments without changing them.** In Settings > Payments, report whether Shop Pay, Apple Pay and Google Pay are on. Ads open the site inside Instagram's and TikTok's in-app browsers, where Shop Pay is the quickest checkout that works.
7. **Test on a phone without ordering.**
   - Open https://bnf1em-ge.myshopify.com/?preview_theme_id=197492998526
   - Type a dog's name and go through the five review steps, then tap "Approve and order".
   - On the product page, check that the answers card says "Copied into the personalizer below" and that Teeinblue's fields hold the answers.
   - Check that "Use [Dog]'s headshot" opens Teeinblue's cropper.
   - Open the poster's product URL with `?view=landing` and check the same flow there.
8. **Report back.** Include:
   - What you did.
   - What you skipped and why.
   - Every setting you changed.
   - The product handles and IDs.
   - The payment-method status.
   - Anything that needs Krish's yes.
