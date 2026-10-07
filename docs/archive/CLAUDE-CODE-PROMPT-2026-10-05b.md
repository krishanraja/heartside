# Prompt for Claude Code: reorder the store around the ornament and the $39 poster

Paste everything below the line into a Claude Code session on `krishanraja/heartside`. It sits on top of `docs/CLAUDE-CODE-PROMPT-2026-10-05.md`: every item in that prompt still applies (frame label, Printful-true copy, layers.json y 3581 and 4122, ornament photo rebuild, voice-video button check). This one changes the priorities and adds the work below.

---

You are working on the Heartside theme in `krishanraja/heartside` (Shopify store `bnf1em-ge`, heartside.io, US-only, launching 20 October 2026). Same hard rules as before: never publish a theme, no edits in Shopify's code editor, no invented reviews, scarcity, stock counts or dates, krish@heartside.io only, US spelling, no "not X, it's Y" lines, no staccato false binaries. Leave every `[DATE]` and `[… SHOT]` placeholder alone.

## Why this run exists

Krish doubted the product line today, and the doubt is fair. Nobody has bought anything yet, and the $89 framed certificate asks a stranger to hang a joke on a wall. We reasoned it through and reached this view:

- The funny object is the poster. People buy it because the review made them laugh and they want to send it to a friend. It does not have to be hung to do its job. It lives on a fridge, in an office, by the dog's bed. $39 is the right price for that.
- The cherished object is the ornament. It carries the dog's real face and name, comes out every December for years, and costs $24, which is a price people pay for a gift without thinking. Christmas is also the one real date we have, and the theme already counts down to it.
- The framed poster at $89 is the weakest item. It stays on sale as an upsell. It is not a headline product.
- The pillow ($59) is third. Keep it on the site, lower on the page.

The feeling we want a visitor to have: "this is exactly my dog, and I want to send it to someone who knows him." The review is the hook, and the ornament is what they keep. Every decision below follows from that. If a choice isn't covered here, pick the one that makes the review easier to share and the ornament easier to buy.

This is a reversible change. If the first weeks of traffic say otherwise, the order flips back with one setting. Build it so the order is controlled by section settings, not hard-coded.

## 1. Homepage and navigation order

- Lead offer on the homepage: The Annual Review ($39) through the review builder, which stays the first thing a visitor does. Second block: Tiny Me, For The Tree ($24), with a short line about Christmas. Third: The Body Double. Fourth: the framed poster, shown as "Want it framed? $89" inside the poster product experience, not as its own card.
- Remove the framed poster as a standalone homepage card if it is one. Keep its product page live and reachable from the poster page.
- Make the order of the benefits cards a setting per card so Krish can reorder without code.

## 2. The ornament as the second hero

- Give Tiny Me its own homepage section with the real product photo, the price, the verdict ring wording, and one honest line: it is ceramic, 2.99 in, and printed the same on both sides. Copy must stay inside what Printful confirms.
- Do not use the ornament photo until the rebuilt one has been checked against a fresh Teeinblue preview (see item 3 of the earlier prompt). Until then the section can be built and hidden by a setting.
- Dependency for Krish, not code: the ornament campaign's Teeinblue mockup has no print area, so the live preview on the product page is a blank ornament. The ornament cannot lead until that is fixed. List it at the top of your report.

## 3. Christmas angle, with no promises

- The countdown to Christmas morning can stay as a countdown. It must not promise delivery by that date.
- Do not publish an order-by date. Krish adds one only after Printful confirms production and shipping times. Leave the `[DATE]` placeholder where it is.
- Write one in-voice line for the ornament section tying it to Christmas. Draft three options and list them for approval, for example in the tone of the dog filing the verdict for the tree. Do not ship any of them live.

## 4. Framed poster as an upsell

- On the poster product page, add a quiet "Frame it" option that links to the framed product, with its own price visible ($89). It must not look like a second Add To Cart competing with the poster's.
- Keep the framed page's description honest to Printful: wood frame, hanging hardware included, acrylic front.

## 5. Things to report, not change

- Margins. You can't see Printful's base costs, so list the three numbers Krish needs to check in Printful: base cost of the 12×18 poster, of the framed poster, and of the ornament. The pillow's base is $14.95. Shipping is free to the customer, so these set the real margin. Say which price looks tight once you have them.
- Whether any copy on the homepage still leads with the framed poster or calls the review a "certificate to hang on your wall". If so, rewrite it to the fridge, office and dog-bed framing and list the new lines for approval.

## Done when

- [ ] The homepage order is poster ($39), ornament ($24), pillow ($59), with the framed poster reachable from the poster page only.
- [ ] Each benefits card has a setting for its position and for hiding it.
- [ ] The ornament section exists and stays hidden until the rebuilt photo is verified.
- [ ] No delivery date or order-by date appears anywhere.
- [ ] The earlier prompt's done-when list is also complete.
- [ ] A short report for Krish: what changed, the copy options to approve, the three Printful numbers to check, and the Teeinblue ornament mockup dependency.
