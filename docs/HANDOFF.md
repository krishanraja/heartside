# Heartside: hand-off from the Shopify session to Claude Code

Written 4 October 2026. This supersedes docs/STORE-STATE.md, which describes the store before any changes. Read docs/BRIEF.md and docs/AD-BRIEF.md for the brand and ad intent; this file records what changed in Shopify since, what is still open, and what Claude Code builds next. Suggested location in the repo: docs/HANDOFF.md.

## Why this exists (read first)

Heartside sells gifts for people whose small dog is their person. Tagline: "Keep them close." It is a dropshipping side-income test: no physical inventory, US only, USD, $100 to $150 of ad budget, launch 20 October 2026, offer ends 1 November 2026 (30% off and free US shipping).

The feeling a visitor should have: "that is literally my dog, I need to send this to someone." The products are stock supplier items, so they do not carry the brand. The gift framing, the personalisation and the one standout product do. Krish's own verdict on the current range was that it is generic and has no "take my money" product. Treat that as the design problem. A clean-looking store that sells a tag and a sling has not solved it.

Krish's working style: he decides fast when he can react to something concrete. Show finished options, make the call, say what was assumed. Do not hand him blank-page questions. No "not X, it's Y" phrasing and no staccato false binaries in any copy. Personal Gmail never appears on anything customer-facing. The only contact is krish@heartside.io and the site is heartside.io.

## State of the Shopify store (store id bnf1em-ge, theme Helio)

Done and saved:

- Store is open to everyone (private mode off). The homepage is still unfinished, so keep an eye on indexing until the new page is live.
- Markets: United States is the only active market. United Kingdom is draft. A second managed market called "USA" exists in draft.
- Currency shown to US visitors is USD via the United States market. Product base prices are still stored in GBP and converted dynamically. Setting fixed USD prices per product is an open item.
- Discounts, both automatic, both end 1 November 11:59 PM: "30% off" on the "All gifts" automated collection (price above 0.01), and "Free shipping" for US. They combine.
- Shipping: the dropship profile charges a flat $5.99 US Standard. The free-shipping discount takes it to $0 until 1 November, so "free until 1 November" is literally true and the rate returns on its own afterwards. The fallback General profile now has only US Standard $5.99. UK zone and US Express removed.
- Policies published: returns (30 days, personalised items non-returnable unless misprinted), shipping, terms, contact. All use krish@heartside.io.
- Store contact and sender email: krish@heartside.io. Email domain authentication was still propagating on 4 October.
- SEO: home page title "Heartside | Gifts for people whose dog is their person" and a meta description with the offer. The social sharing image is empty; it needs a 1200 x 628 image.
- Checkout reviewed and left as is: email contact, first and last name required, phone optional, marketing opt-in at checkout.
- Products: The Heartside Sling and The Heartside Travel Bottle have brand copy and prices. Treat Bag and Travel Harness are draft. Nancy Track Top, Puff Parka and Golden Spike Collar are archived.
- Homepage hero text updated ("Gifts for people whose dog is their person."), but the button is still orange and links to All Products.
- Printify is installed and the account is connected. Shopify warned that Printify does not support "ship and pickup in one order". Pickup, local delivery and pickup points are all off, so it does not apply. Run one test order anyway before launch.
- Hello Pet ID Tag (Red Bittercress, $6.49 plus $0.04 shipping) is in the Dropshipper-ai import list but is not pushed to the store.

Open, in this order:

1. Design the hero product (below), then upload it to Printify and connect it.
2. Push the Pet ID Tag live through Dropshipper-ai so it lands on the dropship shipping profile. Do not create it by hand; a hand-made product falls into the General profile.
3. Rebuild the Gift Set around the ornament. Candidate bundles: Carry Set (sling plus tag), Gift Set (ornament plus tag plus sling or bottle). Earlier list prices: Tag $24.99, Sling $79.99, Carry Set $94.99, Gift Set $119.99, Bottle $29.99. Revisit with the ornament in.
4. Build the landing page: urgency to 1 November, order-by dates, FAQ, hero button in the brand ink colour, social sharing image.
5. Confirm order-by dates for Christmas delivery with each supplier before publishing them.
6. US sales tax: not configured for the US. Krish's accountant decides.
7. Pink and Beige sling variants show sold out and cannot be hidden without permanent deletion. Decide.
8. Confirm the licence for the hero dachshund photo.

Price floor used for every product: landed cost plus 3% plus $0.30 plus $8, checked after the 30% discount.

## The hero product: "Their Person" ornament

A round ceramic Christmas ornament (Printify "Ceramic Decoration Ornament", from about $4.90) that carries the customer's own dog.

- Front: the customer's photo of their dog in a hand-drawn heart-shaped window, with the line "[Dog's name] is my person."
- Back: "Keep them close." and a small Heartside mark.
- Target list price $34.99, about $24.49 after the 30% discount.
- The feeling: warm, a little cheeky, screenshot-worthy. It should make someone tag a friend. The ad hook is "Who's your person?"
- Brand look: cream and ink, matching the palette in docs/BRIEF.md.
- Printify's editor offers Buyer personalization with a personalizable image (customer uploads a photo) and personalizable text (name). The editor needs real artwork on the canvas before it can save; an empty template cannot be saved. The photo slot and the name line must sit inside the circular safe area.
- Deliver the artwork as a print-ready PNG for the round ornament, plus the heart-window mask for the photo, so it can be uploaded and wired in Printify's editor.
- After it is live, check that automatic order sending to the print provider is on, so no order needs Krish's hands. Add the product to the "All gifts" collection so the 30% discount and free shipping apply.

## Browser-automation lessons for the next Shopify session

- Saving: running `button[aria-label="Save"].click()` in the page works when a real click on the Save bar does not.
- Typing with no focused field opens the barcode scanner dialog. Click the field first.
- Native selects in settings (market status) ignore clicks; focus the select and type the first letter of the option, then Return.
- Pages need 10 to 20 seconds after navigation. Settings modals and theme editor panels are cross-origin, so use coordinates there.
- Dropshipper-ai's Find Products search keeps its filters (Pets, ships to US, 1 to 3 days) and returns the same small set whatever the query.
