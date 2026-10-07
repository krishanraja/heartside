# Prompt for Claude Cowork: everything left in the browser (5 October, evening)

Paste everything below the line into the Cowork session.

---

You're working in Krish's browser on **Heartside** (Shopify store `bnf1em-ge`, domain heartside.io). It's a US-only dog-gift store launching on **20 October 2026**. The products are:
- **The Annual Review**: a 12 × 18 inch poster of a dog's deadpan performance review of its owner, $39. A framed version is $89.
- **Tiny Me, For The Tree**: a ceramic ornament, $24.
- **The Body Double**: a 16-inch square photo pillow, $59.

Printful makes everything to order, through the Teeinblue personalizer.

Krish is at the keyboard with you. Open a new tab for anything you need. When a page needs a login, a two-factor code, a payment confirmation or a button only the account owner may press, **stop and ask Krish to do that step**, then carry on.

**State tonight.** Krish published the theme "Heartside launch" (#197492998526) on 5 October, so heartside.io is public now. Claude Code builds the theme in github.com/krishanraja/heartside and deploys it. The last browser session's log is https://github.com/krishanraja/heartside/blob/main/docs/ADMIN-RUN-2026-10-04.md

## Hard rules

- **Theme.** Don't edit theme code, and don't change settings in the theme editor. The repo owns the theme, and the deploy workflow stops if the editor has changed a template. If something needs a theme change, put it in your report for Claude Code.
- **Ask Krish, in this session, before you:**
  - spend money (samples, test orders, apps with a fee, ads);
  - install any app;
  - change checkout, payments, markets, taxes, domains or DNS.

  Show him exactly what you're about to do, and wait for a clear yes.
- **Orders.** Carts are fine; orders are not. Adding to cart to test is free, so empty the cart afterwards. Never place an order without Krish's yes.
- **Honesty.** No invented reviews, scarcity, stock counts or dates. Don't fill any `[DATE]` placeholder; Claude Code does that once Printful confirms.
- **Email.** Customer-facing email is krish@heartside.io. Never a personal Gmail.
- **Payments.** They stay on Shopify Payments. Krish connected Stripe too; don't use it for checkout.
- **Files.** Save anything Claude Code needs into Krish's Drive folder: https://drive.google.com/drive/folders/1-a44OHrHtf0IqJOXS9uFGtGWwIcSWYSH

## Start by asking Krish one question

The store is public, and visitors can currently see placeholders: `[DATE]` in the memo bar and the Christmas deadlines, and "[ORNAMENT SHOT]" on one homepage card. Ask Krish whether to turn on the **store password until 20 October**: Shopify admin > Online Store > Preferences > Password protection. Do it only on his yes. Either way, carry on with the tasks below; the store keeps working behind a password.

## Tasks, in order

### 1. Assign the product templates (most urgent)

The theme is published now, so its templates can be assigned. Until they are, anyone who lands straight on a product page gets the generic template, with no answers carried over and an untidy picker.

Shopify admin > Products > each product > Theme template (right-hand column):

| Product | Template |
|---|---|
| The Annual Review (`the-annual-review`) | **review** |
| The Annual Review, Framed (`the-annual-review-framed`) | **review** |
| The Body Double (`the-body-double`) | **heartside** |
| Tiny Me, For The Tree (`tiny-me-for-the-tree`) | **heartside** |

Check each one by opening https://heartside.io/products/the-annual-review (no `?view=`). Expect:
- the red "FORM HR-26" stamp and the dog's-voice description;
- one price;
- under the Add To Cart, a quiet link "Want it framed? $89".

### 2. Product photos: first position

Our photos (the real print in a staged scene) were uploaded today. In each product's Media, drag ours to the front:
- **The Annual Review:** the Christmas-morning photo first.
- **The Annual Review, Framed:** the black frame in the office first, then the red oak frame in the entryway.
- **The Body Double:** the pillow on the sofa first.
- **Tiny Me:** don't add or move anything (task 4).

A Teeinblue campaign update rewrites product photos. If you update any campaign, check the photos afterwards and fix the order again. The files are under https://raw.githubusercontent.com/krishanraja/heartside/main/design/mockups/ if one needs re-adding:
- `christmas-sheet-a-4x5.jpg`
- `office-black-b-4x5.jpg`
- `entry-oak-a-4x5.jpg`
- `pillow-sofa-a-1x1.jpg`

### 3. The phone test on the live site, end to end

Use an iPhone-sized window on https://heartside.io/ and test **without ordering**.

1. **No names.** Scroll to the review, go to step 5 and tap **Approve**. Expect step 1 with "HR needs both names for the file."
2. **With names.** Type a dog's name and your name. Pick **Your phone**, **The couch** and **The cat**, then tap **Approve**.
3. **The poster page.**
   - The answers card says "Copied into the personalizer below."
   - Teeinblue's fields hold both names and the treat count.
   - Its three picture choices show **Your phone, The couch, The cat** as selected.
4. **The headshot.** "Use [Dog]'s headshot" opens Teeinblue's cropper.
5. **The framed page.** Tap "Want it framed? $89". Expect one price ($89), one Add To Cart, and a picker **titled "Frame"** (Black, Red Oak, White).
   - Claude Code could only test the "Frame" title off the live site. **Screenshot it.** If it says "color", say so.
6. **The cart.** Choose Red Oak and Add To Cart. The cart line should show Red Oak, $89 and all six answers. Then **open https://heartside.io/cart.js in a new tab** and copy the full URLs of `_tib_design_link_1` and `_customization_image` into your report. Empty the cart.
7. **The ad landing page.** Repeat steps 2 to 5 once on https://heartside.io/products/the-annual-review?view=landing
8. **The homepage order.**
   - There's no "Hear [Dog] read it out loud" button anywhere.
   - The benefits cards show Tiny Me first and the Body Double second.
   - The page says "for the fridge, the office…".

### 4. Teeinblue: the ornament

Campaign **1032885** (Tiny Me, For The Tree, base 364797).

1. **Fix the mockup.** The campaign's mockup has no print area, so the live preview on the product page shows a blank ornament. In Teeinblue, give the mockup a print area on the ornament's face, mapped to the artwork, then save. If the fix needs a campaign update, that rewrites this product's photos (fine; Tiny Me has none of ours yet).
2. **Capture the real look.**
   - Open https://heartside.io/products/tiny-me-for-the-tree
   - Upload Biscuit's headshot (https://raw.githubusercontent.com/krishanraja/heartside/main/assets/v2/biscuit-headshot.jpg), crop with **Select**, and type the name **Biscuit**.
   - Press **Preview**.
   - Save the preview image to the Drive folder as **`teeinblue-ornament-preview.png`**.
3. **Get the print file.** Add one to the cart, open https://heartside.io/cart.js, and copy the `_tib_design_link_1` and `_customization_image` URLs into your report. Empty the cart. Claude Code rebuilds the ornament photo from these. Until then, don't put an ornament photo on the product.

### 5. Printful: facts and costs

In the Printful dashboard (Krish logs in), check the following and report each answer with where you read it:

1. **The pillow** (All-Over Print Basic Pillow, 16″ × 16″): is the back printed, and with what? The site currently says only "printed with [Dog]'s face … printed edge to edge, with a shape-retaining insert included". Check also what Teeinblue's Body Double template sends for the back.
2. **Costs.** Base cost and **US shipping** for each product (free shipping to the customer makes these the real margin). Claude Code's figures date from 4 October.

   | Product | Base | US shipping |
   |---|---|---|
   | Enhanced Matte Paper Poster 12×18 | | |
   | Enhanced Matte Paper Framed Poster 12×18 | | |
   | Ceramic Ornament, circle | | |
   | All-Over Print Basic Pillow 16×16 | $14.95 (already read) | |

   Note whether the poster and the ornament ship together when ordered together, and what shipping costs in that case.
3. **Christmas deadlines.** Find Printful's published 2026 holiday order deadlines for US delivery (their holiday shipping page, and the dashboard if it shows per-product cutoffs). Report the date for each of the four products, with the source.
   - **Don't put them on the site.** Claude Code fills the `[DATE]` placeholders once Krish confirms them.

### 6. Email: authenticate heartside.io and verify the sender (Krish confirms first)

1. Shopify admin > Settings > Notifications > **Sender email**. Start domain authentication for heartside.io; Shopify shows **six CNAME records**. Copy them exactly.
2. heartside.io's DNS lives at **Vercel** (its nameservers are Vercel's). Open https://vercel.com/dashboard and ask Krish to log in. Then go to Domains > heartside.io > DNS records.
3. **Show Krish the six records and get his yes, then add them.** Don't touch any other record.
4. Back in Shopify, press **Verify**. DNS can take a while; if it's not verified yet, note the time and check again before you finish.
5. Ask Krish to click the **sender verification email** sent to krish@heartside.io (resend it from the same Shopify page if needed).

### 7. Meta (Facebook and Instagram), then the funnel pixel

1. Shopify admin > Sales channels > **Facebook & Instagram**. Finish setup; Krish logs in to Facebook when asked. Connect:
   - the Business account and Facebook Page;
   - the **Instagram account @yourdoghasnotes**;
   - the ad account;
   - a pixel/dataset, with **Maximum** data sharing.

   Turn on catalog sync and confirm the four products appear in the catalog. **Spending:** don't create or boost ads. Ask Krish before anything that charges.
2. Copy the **pixel (dataset) ID** into your report.
3. Install the funnel pixel in Shopify admin > Settings > **Customer events** > Add custom pixel, named "Heartside funnel":
   - Code: everything in https://raw.githubusercontent.com/krishanraja/heartside/main/shopify/pixels/hs2-funnel.js, with the dataset ID pasted between the quotes in `const META_PIXEL_ID = '';`.
   - Leave `TIKTOK_PIXEL_ID` empty unless Krish already has a TikTok pixel.
   - Customer privacy: Permission **Required: marketing**; Data sale **Data collected qualifies as data sale**.
   - **Save**, show Krish, and press **Connect** on his yes.
4. **Test it.** Meta Events Manager > Test events, with heartside.io open. Type a dog's name and step through the review; `hs2_name_entered` and `hs2_review_step` should arrive.
5. **TikTok:** only if Krish wants TikTok ads now. The TikTok channel is an app install, so ask first.

### 8. Ask Krish these, and write down his answers for Claude Code

1. **Ornament Christmas line.** Which one, or none? It isn't live yet.
   - "Filed for the tree. Reviewed every December. The rating has not changed."
   - "[Dog] has approved a seasonal placement on the tree. Renewed every December, for life."
   - "Tiny Me reports to the tree each December. HR has no further notes."
2. **Samples.** Should we order samples, for example one poster and one ornament with Biscuit? They cost money, and real photos of the real product would help the store. If yes, place the order in Printful with Krish confirming the payment step.
3. **Store address.** Shopify's address is locked to the business entity's country (UK). Changing it is a tax and markets decision; just record what Krish wants to do.

### 9. Report back

Paste this into the Claude Code session:
- The password-page decision and state.
- For each task: done, skipped or failed, with every setting you changed (old value and new value).
- The template assignments, and what https://heartside.io/products/the-annual-review shows now.
- The phone test step by step (pass or fail), the "Frame" screenshot, and the two cart URLs.
- The Teeinblue mockup fix, whether `teeinblue-ornament-preview.png` is in the Drive folder, and the ornament's two cart URLs.
- The Printful facts and costs, the shipping-together answer and the holiday deadlines, each with its source.
- The DNS records you added, their verification state, and whether the sender is verified.
- The Meta pixel ID, the catalog state, and whether the funnel pixel is connected and tested.
- Krish's answers to task 8.
- Anything still waiting on Krish.
