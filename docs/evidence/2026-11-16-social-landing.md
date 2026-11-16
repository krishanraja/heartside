# The social landing, attribution, Example badges and the reviews: 16 November 2026

**Status: on branch `growth/social-landing-2026-11-16`, not live.** Asked for by the growth engine for Krish ("Is heartside.io not adequate as that continuation? Do the rest, anything is on the table."). Nothing reaches buyers until Krish approves the pull request, it is merged, and the guarded theme push runs. No Shopify setting, page, product or theme was changed.

**North Star:** U5, $45 against $1,084 this week. This moves the number at the point it is stuck: cold social visitors reach the store and do not add to cart. Shopify sessions over the 30 days to 16 Nov: Facebook 470 and 0 cart adds (383 landed on the homepage, 85 on the mug page), Instagram 47 and 1, TikTok 23 and 0, direct 474 and 37 (mostly Krish's own testing). Those numbers are the growth engine's reading of Shopify on 16 Nov, not re-read here.

## 1. What people say: found, and held

**Where they come from.** `shopify/sections/hs-reviews.liquid` renders the blocks saved in `shopify/templates/index.json` (section `reviews`): nine quotes, each with a first name and initial, a US city, a gift and a photo from Shopify Files (`shopify://shop_images/jessica.png` and so on, added by Krish in the theme editor on 10 Nov). Commit `283077e` added them with "Ruling (Krish, 2026-11-10): publish the customer quotes he supplied, in their own words, without photos for now", described as "people who used the site or received Heartside gifts made by hand before it". `/llms.txt` carried four of them, and `docs/SELLING.md` told the growth repository it could quote all nine.

**Why they are held.** This repository holds no record of any reviewer's permission, nor of which order or gift each one is about. Seven of the nine describe the current site and its products: ordering on a phone, the questions, the Roast tone, and a blanket, mug or framed print that "arrived fast" or "showed up well packed". The store records two orders in 60 days, and `docs/SELLING.md` says one paid order (#1013, delivered 8 Nov) had come through the site when the quotes went up on 10 Nov. Quotes about the Roast feature, answering the questions or ordering on a phone describe the site itself, so "made by hand before it" does not cover them. None of this proves a quote is invented; it means nothing here shows that it is not. The FTC's rule on consumer reviews and testimonials (16 CFR Part 465, in force since October 2024) prohibits reviews that misrepresent who wrote them or their experience with the product.

**What changed.** The section is switched off (`"disabled": true`), with every block's words kept, and the four quotes are out of `/llms.txt`. `docs/SELLING.md` now says to quote none of them. Krish can switch the section back on in the theme editor in one click once each person is verified with permission on record. That reverses his 10 Nov ruling, so it needs his yes: it is a separate commit in the pull request and can be dropped on its own.

## 2. Example badges: removed, with one caution

Krish, 2 Nov: "We never need EXAMPLE badges anywhere" (growth-heartside `factory/floor.json`, `no-badges`). No later ruling in this repository keeps them: the "Every picture carries an Example tag" line in `shopify/README.md` (30 Oct) and the Example label on the gift page's live preview (29 Oct) both predate it. The overlay is removed from the homepage showcase and hero sets, the journey's style and gift cards, the cart drawer, the product gallery and its live preview, the Answers card and the rollback chat (`/?view=chat`).

Kept: every alt text that starts "Example:" (screen readers still hear what a picture is), and the blanket's sentence "Example placement only. Upload your dog to preview your blanket." The badge CSS stays, unused, so a revert is one commit.

Caution for Krish: the 2 Nov words were said about finished social posts, and the growth repository's own record of that day reads "Heartside's canon tags examples on its own store pages". The live preview's label was there so a buyer would not take Teeinblue's sample dog for their own painting. It is its own commit too.

## 3. The social landing

`sections/hs-social.liquid` on `templates/product.social.json`, reached at any gift's page with `?view=social`, so no Shopify page is created and no admin change is needed:

| Gift | Address |
|---|---|
| Mug, $45 | `https://heartside.io/products/your-dogs-illustrated-mug?view=social` |
| Portrait, $59 unframed, $119 framed | `https://heartside.io/products/your-dogs-portrait?view=social` |
| Blanket, $129 | `https://heartside.io/products/your-dogs-personality-blanket?view=social` |

`&hook=` picks the headline, in heartside's voice rules (US spelling, no em dashes or exclamation marks, not the retired "your dog has notes"): `love` (default) "Your dog loves you too."; `roast` "Your dog has reviewed your performance."; `file` "Your dog has been keeping a file on you."; `christmas` "This year, the dog's buying." The words are blocks Krish can edit in the theme editor. Every `utm_*` and the hook are carried on the button and the other gifts' links.

The page shows the product's own first photo, title and prices from Shopify; "See your dog painted, free, before you buy."; free US shipping; "Order by December 4 for Christmas delivery to a US address." (the date `docs/SELLING.md` confirms for every gift, shown until 4 Dec and then hidden); the bundle saving only while the memo strip's bundle switch is on; the note in the box; the person who checks every design; three "how it works" pictures from the approved set; and one pinned button, "See my dog painted", to `/?gift=<gift>&step=photo`. The memo strip's Christmas offer sits above it, as on every page. No review, rating, count or badge.

**The promise is in the code.** The gift page paints the buyer's own photo as soon as it opens (`hs-journey-choose.js`), shows the painting on the gift in the reveal, and keeps Add to cart disabled until the buyer ticks "Yes, this is <dog>"; payment happens only at Shopify checkout after that. `tools/preview/journey-flow.browser.test.mjs` walks it ("the add waits for the tick"). There is no cap on a buyer's first painting in the theme.

Screens at 375 wide: `tools/preview/out/social-landing/` (after `node tools/preview/render.mjs` and the test below); `live-*.png` there use the live store's own product photos, read from the public storefront on 16 Nov.

## 4. Taps

The growth engine's live walk counted about 9 taps from the homepage to "Start painting", picking a style and a tone; the table takes the defaults, which is 8. Counted from the code and the browser walk, for one gift, taking the defaults (style and tone each have one; the mug's inside color defaults to Black):

| Stretch | From the homepage today | From the landing |
|---|---|---|
| To the start of the journey | 1 (Design yours in minutes) | 1 (See my dog painted) |
| Photo | 2 (choose, then the phone's picker) | 2 |
| Style, tone, where the dog rules the house | 3 | 3 |
| Gifts | 2 (tick the gift, Start painting) | 1 (already ticked: Start painting) |
| Gift page questions while it paints: name (typed, Next), breed, he or she, who it's for (typed and Next, or "It's for me"), home, together, meaning, the note's Next | 8 | 8 |
| **To seeing the painting on the gift** | **16** | **15** |
| Painting to checkout: tick "Yes, this is <dog>", Add to cart, Check out on the cart page | 3 | 3 |

Implemented here, as safe: the landing itself, its deep link with the gift ticked, and the attribution. Proposed for Krish, not implemented, because each changes a journey decision he made:

1. **Show the painting the moment it is ready, and ask the note's questions after it** (or let the buyer skip them for the scripted note): 15 taps becomes 7. The biggest cut, and it reverses the 4 Nov order ("one step at a time ... and then the user purchases").
2. **One button for the tick and the add** ("Yes, add <dog>'s mug"): one tap fewer; the tick is the buyer's approval of what prints.
3. **A single gift goes straight to checkout**, past the cart page: one tap fewer, but the bundle drawer on the cart page is skipped.
4. **The feel and the style on one screen**: one tap fewer.

## 5. Attribution

Shopify keeps the landing page of the visit that ends in the order as its landing site, with its `utm_*`; a buyer who taps a post and comes back later direct is recorded as direct. `assets/hs-attribution.js`, on the landing, the homepage and every gift page, writes `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `hs_landing` (the page and its hook) and `hs_landed` (the day) to the cart's attributes whenever a page opens with `utm_*`. Shopify copies cart attributes to the order (Additional details; `note_attributes` in the Admin API). The newest tagged visit wins and a key it lacks is cleared. Nothing else in the theme writes cart attributes, and the order workflows read line properties only (`tools/qc/order_qc.py`). Only campaign words travel: no click ids, nothing typed. The journey's own URLs keep the `utm_*` as it moves between steps.

A live walk from a tagged address on 16 Nov (the growth engine's, with a generated dog photo) found the `utm_*` dropped when "Start painting" opened the gift page: `hs-journey.js` `giftURL()` built the gift page's address from the product URL alone. It now carries every `utm_*` from the current address onto each gift page in the queue. The same walk confirmed the painting and the product mockup appear before any payment step, with no email asked. The script is also on every gift page (`sections/hs2-product.liquid`), since 85 of Facebook's 470 sessions landed on the mug page. It writes once per campaign per tab, so the order keeps the page and hook the post opened rather than the gift page the journey moved to.

Not verified: an order placed on the live store with these attributes. That needs the push and a real or test order, both Krish's.

## 6. Checks run (16 Nov, on the branch)

- `node --test tools/preview/*.test.mjs tools/print-art/*.test.mjs tools/perf/*.test.mjs`, on Windows: 920 tests, 897 passed, 23 failed. Twenty of them fail the same way on `main` in the same checkout (photo choice, artist's touch, cart layout, head and theme-push guard scripts, the artwork system), so they belong to this machine, not this branch; CI on Ubuntu is the judge. Of the other three, `no-truncation` caught an ellipsis on the landing's dock line, fixed; two journey timing checks (1440 x 900 walk, the card within 450 ms) failed under load and passed on a quieter rerun of `journey-flow` and `journey-product`.
- `node tools/preview/render.mjs`, `node tools/preview/copy-lint.mjs --baseline ...`: 0 introduced.
- `node tools/preview/minify-check.mjs`: every hs*.js minifies cleanly, `hs-attribution.js` included.
- `node tools/preview/theme-check.mjs --baseline`: 1 introduced offense, `OrphanedSnippet snippets/hs-head.liquid`, which `main` reports too (the snippet is rendered by the theme push, not by a file in this repo); nothing from this branch.
- `node --test tools/preview/social-landing.browser.test.mjs`: the hook, product, price, button address, utm carry, the cart write once, no badge or review text, the button pinned at 375 x 667, and the walk from the button to the gifts screen with the gift ticked.

## What needs Krish's yes

1. Holding "What people say" (reverses his 10 Nov ruling), or the verification that lets it back on.
2. Removing the Example badges from the store, the live preview's label included.
3. The landing's four headlines and its button words.
4. Merging, and the guarded theme push that takes it live.
5. Any of the four tap cuts in section 4.
