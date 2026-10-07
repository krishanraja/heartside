# Prompt for Claude Cowork (Shopify, Teeinblue and Printful in Krish's browser), 5 October

Paste everything below the line into the Cowork session.

---

You're working in Krish's browser on **Heartside** (Shopify store `bnf1em-ge`, domain heartside.io): a US-only dog-gift store launching on **20 October 2026**. The hero product is **The Annual Review**, a 12 × 18 inch poster of a dog's deadpan performance review of its owner, made to order by Printful through the Teeinblue personalizer. $39 unframed, $89 framed. Also live: **The Body Double** (16-inch square photo pillow, $59) and **Tiny Me, For The Tree** (ceramic ornament, $24).

The theme is built in code at github.com/krishanraja/heartside and deployed by a GitHub workflow into the unpublished theme **"Heartside launch" (#197492998526)**. Claude Code owns the theme. Your job is the admin, Teeinblue and Printful work that code can't reach.

Read first (public repo):
- https://github.com/krishanraja/heartside/blob/main/docs/ADMIN-RUN-2026-10-04.md (what the last browser session did)
- https://github.com/krishanraja/heartside/blob/main/shopify/README.md (what the theme does, including "Product photos" and "Funnel pixel")

To see the theme, open https://bnf1em-ge.myshopify.com/?preview_theme_id=197492998526 first. It sets a preview cookie, and every page after that shows Heartside launch.

## Hard rules

- **Never publish a theme.** Krish publishes.
- **Don't change theme settings in the theme editor, and don't edit theme code.** The repo owns the templates. Since 5 October the deploy workflow **stops** if the editor has changed a template the repo doesn't know about, so an editor change blocks the next deploy. If something needs a theme setting, list it in your report and Claude Code will make it.
- **Ask Krish first**, and wait for a clear yes, before spending money (samples, test orders), installing an app, or changing checkout, payments, markets, domains or DNS.
- **Honesty.** No invented reviews, scarcity, stock counts or dates. Leave every `[DATE]` placeholder alone.
- **Email.** Customer-facing email is krish@heartside.io. Never a personal Gmail.
- **Carts are fine, orders are not.** Adding to cart to test is free; always empty the cart afterwards. Never check out.

## What changed today (so you know what you're testing)

- **The bridge.** The homepage answers now reach Teeinblue correctly, including the three joke choices. Before today, Teeinblue kept its own first option, so the poster would have printed the wrong jokes.
- **Placeholder names never travel.** "Biscuit" and "Sarah" only fill the page until the shopper types. Pressing Approve without both names sends the shopper back to step 1 with "HR needs your name for the file."
- **The product page.** It shows one price and one Add To Cart (Teeinblue's). The framed poster's picker is labelled **Frame** (Black, Red Oak, White), the poster shows no picker, and each product has its own description in the dog's voice.
- **The poster print.** Every joke line now has two lines of room, so two of Teeinblue's layers move (task 1).
- **New product photos** with the real print in them are in `design/mockups/` (task 2).

## Tasks, in order

### 1. Teeinblue: the poster artwork (do this first)

Artwork **"The Annual Review (HR-26)"** (ID 1329726), used by campaigns 1032639 (poster) and 1032650 (framed).

1. Replace the background layer's image with the new background, 3600 × 5400: https://raw.githubusercontent.com/krishanraja/heartside/main/design/poster-template/poster-background.png
2. Move two clipart layers. Change **only y**; x stays 252 and the size stays 3096 × 269:
   - **Open incident report:** y **3581** (was 3446).
   - **Known enemy of the company:** y **4122** (was 3853).
3. Leave every other layer where it is: the photo, both names, the treat-cupboard line, Area for improvement (y 3039), the signature and the APPROVED stamp.
4. Save. If Teeinblue needs the campaigns updated for the artwork to apply, update both. **Before you do, note whether a campaign update also rewrites the Shopify product's images or description** (see task 2).
5. The 15 joke-line PNGs don't need re-uploading; their size and text are unchanged. Copies are in `design/poster-template/lines/` if Teeinblue ever needs them.
6. **Check it.** On the preview theme, open https://bnf1em-ge.myshopify.com/products/the-annual-review-framed?view=review&dog=Biscuit&person=Sarah&improvement=The%20vacuum&incident=The%20sock&enemy=The%20mailman
   - Upload Biscuit's headshot in the personalizer: https://raw.githubusercontent.com/krishanraja/heartside/main/assets/v2/biscuit-headshot.jpg
   - Press **Preview**.
   - Both two-line answers ("Continues to bring the vacuum into the building…" and "The mailman. Comes every day…") must sit clear of the heading below them. Compare with https://raw.githubusercontent.com/krishanraja/heartside/main/design/poster-template/poster-sample.png

### 2. Product photos

Each photo is a staged scene with the **real print file** composited into a blank frame, sheet, ornament or pillow. The product itself was never AI-drawn. The dog is Biscuit, made for Heartside.

Add them in Shopify admin > Products > each product > Media. Use **Add from URL** if it's offered; otherwise download the file and upload it. Drag each new photo into the position given. Keep Teeinblue's own mockups after ours.

| Product | Position | File (all under `https://raw.githubusercontent.com/krishanraja/heartside/main/design/mockups/`) | Alt text |
|---|---|---|---|
| The Annual Review | 1 | `christmas-sheet-a-4x5.jpg` | The Annual Review poster, unframed, held up on Christmas morning while a dachshund rests his chin on a knee |
| The Annual Review, Framed | 1 | `office-black-b-4x5.jpg` | The Annual Review in a black frame above a desk, with a dachshund asleep in his bed below |
| The Annual Review, Framed | 2 | `entry-oak-a-4x5.jpg` | The Annual Review in a red oak frame in an entryway, with a dachshund sitting and looking up at it |
| Tiny Me, For The Tree | 1 | `ornament-tree-1x1.jpg` | Tiny Me, a round ceramic ornament with a dachshund's photo and verdict, hanging on a Christmas tree. **Only after task 3 passes.** |
| The Body Double | 1 | `pillow-sofa-a-1x1.jpg` | The Body Double, a square pillow printed with a dachshund's photo, on a sofa beside the dog himself, asleep |

- Don't attach these photos to individual variants; Teeinblue manages the variant mockups.
- **Teeinblue may overwrite product photos** when a campaign is updated. Look for a setting about syncing or updating product images or mockups in each campaign, and report what it does. If an update wipes our photos, add them again after your last campaign update, and tell Krish that any future update will need the same.

### 3. Check the ornament photo against Teeinblue's artwork

Tiny Me's photo uses a face Claude Code built from the spec: the photo in a circle, "OVERALL RATING: EXCEEDS EXPECTATIONS • CONTRACT RENEWED. FOR LIFE. •" in a ring, and the name in Fraunces underneath. It's only honest to use if it matches what Teeinblue actually prints.

1. Open https://bnf1em-ge.myshopify.com/products/tiny-me-for-the-tree?view=heartside
2. Upload `biscuit-headshot.jpg` (link in task 1), crop with **Select**, type the name **Biscuit**, and press **Preview**.
3. Compare Teeinblue's preview with https://raw.githubusercontent.com/krishanraja/heartside/main/design/mockups/ornament-biscuit.png on these points:
   - the ring wording and where it starts;
   - the ring's typeface and colour;
   - the photo's size and its outline;
   - the name's font and position;
   - the background colour.
4. **If they match closely** (same elements, same arrangement), add the ornament photo as image 1 (task 2).
5. **If they don't:**
   - don't add it;
   - save Teeinblue's preview image into Krish's Drive folder https://drive.google.com/drive/folders/1-a44OHrHtf0IqJOXS9uFGtGWwIcSWYSH as `teeinblue-ornament-preview.png`;
   - list the differences.

   Claude Code will rebuild the photo from Teeinblue's version.

### 4. Phone test, end to end, without ordering

Use an iPhone-sized window on the preview theme.

1. **Homepage, no names.** Scroll to the review, go to step 5 and tap **Approve**. Expect to land back on step 1 with "HR needs both names for the file." and a field for the dog's name.
2. **Homepage, with names.** Type a dog's name and your name. Pick **"Your phone"**, **"The couch"** and **"The cat"** (none of them is Teeinblue's first option), then tap **Approve**.
3. **Product page.**
   - The answers card says "Copied into the personalizer below."
   - Teeinblue's fields hold both names and the treat count.
   - Its three joke choices show **Your phone, The couch, The cat** as selected. This is the bug fixed today, so look carefully.
4. **"Use [Dog]'s headshot".** It should open Teeinblue's cropper.
5. **On the framed poster:**
   - exactly **one price** ($89);
   - a picker titled **Frame** with Black, Red Oak and White;
   - **one** Add To Cart;
   - the description beginning "The same review, framed and ready to hang."
6. **Cart.** Choose **Red Oak** and Add To Cart. Then check the cart line:
   - the variant is Red Oak;
   - the price is $89;
   - all six answers show (both names, the treat count and the three joke lines).
7. **Clean up.** Remove the line and leave the cart empty.
8. **Landing page.** Repeat steps 2 to 6 once on https://bnf1em-ge.myshopify.com/products/the-annual-review?view=landing (the ad landing page). There, Approve scrolls down to the buy box instead of opening a new page.

### 5. Printful: check the facts in the new product descriptions

The descriptions (in `shopify/README.md`, "New copy for Krish to approve") make plain claims. Check each one in Printful's product details and report true, false or unclear:

- **Framed poster:** the frame is wood; "ready to hang", with hanging hardware included; whether the front is acrylic or glass.
- **Pillow:** the insert is included, and the print runs edge to edge on both sides.
- **Ornament:** it's ceramic, about 3 inches across, and the same design prints on both sides.

Also read the **All-Over Print Basic Pillow 16″ × 16″** base price and its US shipping price. The margin table in `docs/V2-FROM-THE-DOG.md` still says "re-check" for it.

### 6. Only with Krish's go

- **Funnel pixel.** If the Facebook & Instagram channel is connected, find the Meta pixel (dataset) ID. Follow "Funnel pixel" in `shopify/README.md`:
  - The code is https://raw.githubusercontent.com/krishanraja/heartside/main/shopify/pixels/hs2-funnel.js with the ID pasted into `META_PIXEL_ID`.
  - Set customer privacy to "Required: marketing".
  - Ask Krish before you press **Connect**.
  - Add a TikTok ID only if a TikTok pixel already exists.
- **Email domain.** The 6 CNAME records for email authentication go in Vercel DNS (heartside.io's nameservers are Vercel). Do this only if Krish says go, in this session.
- **After Krish publishes "Heartside launch"** (not before), assign the product templates in Products > each product > Theme template:
  - **review** for both Annual Review products;
  - **heartside** for the Body Double and Tiny Me.

### 7. Report back

- What you did, and what you skipped and why.
- Every setting you changed, with old and new values.
- The Teeinblue layer positions as saved.
- Whether a campaign update rewrites product photos or descriptions.
- The task 4 results, step by step (pass or fail, with a screenshot of any failure).
- The task 3 verdict.
- The task 5 facts.
- Anything that needs Krish's yes.
