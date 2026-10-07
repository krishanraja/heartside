# Heartside: Shopify store state

> **Superseded.** This is the store as found on 4 October 2026, before any changes. For the current state and the open list, read `docs/HANDOFF.md`.

Verified by looking at the admin on 4 October 2026. Store id `bnf1em-ge` (admin.shopify.com/store/bnf1em-ge). Theme: Helio (active). Nothing here has been changed except the two products pushed in section 3. Treat every item in "Problems" as a to-do.

## 1. Settings and markets

- **Store currency:** British Pound (GBP). Backup region United Kingdom. Time zone London.
- **Markets:** United Kingdom (active), United States (draft), "USA" (managed market, active). US visitors see prices converted from GBP.
- **Discounts (both automatic, both active):**
  - "30% off", titled "30% off Home page", type amount off product, all customers. Scope not verified.
  - "Free shipping", all products, United States.
- **Order processing:** line items are not fulfilled automatically.
- **Apps:** Dropshipper-ai (the Spocket-powered product importer) and Messaging. Spocket and DropSure are logged in separately in the browser.

## 2. Products

| Product | Status | Stock | Notes |
|---|---|---|---|
| Heartside: The sling that keeps your dog close | Active | 54 (Charcoal only; Pink 0, Beige 0) | Priced £39.99 on all variants. With the 30% discount that is about £28, below landed cost (about $40). Category metafield "Animal type" says Cats. Description includes safety and material claims. |
| Travel Harness - Black | Active | 492 across 6 sizes (2XS to XL) | Pushed 4 October. Not yet priced, described or photographed for the brand. Recommended: set to Draft until a size guide exists. |
| Water Bottle | Active | 557 across 3 variants | Pushed 4 October. Not yet priced or described for the brand. |
| Treat Bag | Active | 565 | Supplier Beige Antigone. Cost not recorded. |
| Nancy Track Top Mint (floral dog jacket) | Active | 20 | Clothing. Archive. |
| The Puff Parka - Hazel | Active | 13 | Clothing. Archive. |
| Golden Spike Black Collar | Active | 66 | Off-brand. Archive. |

## 3. Import list

After pushing the Travel Harness and Water Bottle the import list is empty. The Dropshipper-ai catalog is the same catalog as Spocket's US/EU pool.

## 4. Suppliers and costs (landed = item + shipping)

| Product | Supplier | Item | Shipping | Landed | Speed |
|---|---|---|---|---|---|
| Neoprene Pet Sling Carrier | Emerald Alfie | $34.45 | $6.00 | $40.45 | 1-3 days |
| Hello Pet ID Tag Eco-Friendly | Red Bittercress | $6.49 | $0.04 | $6.53 | 1-3 days |
| Paw Print Text ID Tag | Red Bittercress | $6.49 | $4.00 | $10.49 | 1-3 days |
| Water Bottle | Beige Antigone | $5.99 | $7.00 | $12.99 | 1-3 days |
| Travel Harness - Black | Beige Antigone | $16.79 to $23.99 by size | $7.00 | $23.79 to $30.99 | 1-3 days |
| Grey plush donut bed | Teal Simba | $18.00 | $3.00 | $21.00 | 8-14 days |
| Cozy Polka Dot Pet Bed Cave | Pear Daisy | $31.17 | $9.99 | $41.16 | 4-7 days |

Inventory counts are shown in the Dropshipper-ai import list's Variants tab. The 1-3 day US catalog has no cave bed, fleece blanket or paw cleaner.

## 5. Homepage

Sections in order: Header, Rich text, Image with text, Pull quote, Carousel, Featured product, Footer (Section, Rich text, Utilities).

Hero text: "Some of the best moments of your day are the ones where your loved one is asleep on your heart." Subline: "The Heartside sling carries small dogs up to 15 lbs, close enough to feel your heartbeat." Button: orange, "50% off until Nov 1" (wrong: the live discount is 30%).

## 6. Problems found (in priority order)

1. The sling's price is below landed cost once the 30% discount applies.
2. The homepage banner says 50% and the discount is 30%.
3. Only Charcoal has stock; Pink and Beige are at 0, while the photos lead with a cream sling.
4. The sling description contains "SAFETY STRAP... safe and secure", "100% premium organic neoprene" and "dogs and cats up to 15 lbs". Rewrite per BRIEF section 9.
5. The sling's category metafield says Cats.
6. Currency is GBP for a US-only store.
7. Three off-brand clothing and accessory products are live.
8. The hero button colour (orange) clashes with the brand palette.
9. No personalisation workflow exists yet.
10. No Heartside contact email exists; the personal Gmail must not be used.
