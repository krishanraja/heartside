# Gift note and bundle discovery: report, 31 October 2026

This was a read-only run. Nothing was saved, updated, confirmed or ordered. The only messages sent were the brief's support questions: three to Printful's chat and one to Teeinblue's. No order numbers, ids, addresses or credentials appear here.

**Outside this brief, but important:** Shopify admin's Checkout settings page shows this warning: "There were errors during checkout starting October 29, 2026. Some customers have abandoned checkout or were unable to submit orders." That puts the North Star at risk now, so it should be looked at before any note work. (Source: live screen, Shopify, Settings, Checkout.)

## 1. The answer
**No.** Today, no supplier-made card or note reliably travels in the same parcel as any of the three gifts.
- Printful ships mugs, posters and framed posters in their own parcels, always. A greeting card is a separate product that ships separately too, and pack-ins are not allowed with mugs, wall art or blankets.
- The only per-order printed message that rides inside the gift's own parcel is Printful's **packing-slip gift message**, which has three limits:
  1. It is documented for manual and API orders. Printful could not confirm that a Shopify order note or the API `gift` field reaches the slip automatically.
  2. It is dropped when the order is routed to a backup or partner facility. Heartside has backup facilities switched on.
  3. Printful could not say whether it prints on every parcel of a split order.
- So the most practical route is one Printful order per gift, each carrying its own packing-slip message. It needs a test order to prove it.
- **A three-gift bundle will arrive as at least three parcels.** No consolidation option exists.

## 2. Part 1: what each gift is (live screens and catalog)
| Gift | Printful product (Teeinblue base) | US production region | Packing (help centre) | Item cost | US standard shipping (first / next) |
|---|---|---|---|---|---|
| Mug | White Ceramic Mug with Color Inside, 11 oz (5 colours) | "US / Mexico" (catalog Availability tab) | Brown cardboard box, ships on its own | $8.11 (live quote draft, Black) | $6.69 / +$3.50 |
| Portrait, unframed | Enhanced Matte Paper Poster (in), 12×18 | "United States" (2026 catalog API: US in stock) | Triangular kraft box, or a stay-flat envelope for small sizes | not read live | $4.99 / +$0.40 |
| Portrait, framed | Enhanced Matte Paper Framed Poster (in), 12×18, black, white or red oak | "United States" (catalog Availability tab) | Cardboard box, tissue and bubble wrap or foam | $20.76 from (catalog) | $10.89 / +$4.50 |
| Blanket | Sublimated Sherpa Blanket, Tan, 50″×60″ | "US / Mexico" (catalog Availability tab; 50×60 marked stocked) | Recycled poly mailer | $35.76 (live quote draft) | $13.99 / +$4.00 |

- **Production time:** 2 to 5 business days on average (help centre). US standard delivery is 3 to 4 business days after that.
- **Holiday surcharge:** $0.40 per US order from 15 October 2026 to 17 January 2027.
- **Live proof of split pricing:** a cost-quote draft in Printful holds a mug and a sherpa blanket. Shipping is shown as **$21.08 flat rate**, which is exactly $6.69 + $13.99 + $0.40. Each category is charged its own first-item rate.
- **Facilities can change.** Printful routes each order automatically, and it can go to backup or partner facilities, which Heartside has switched on. "US / Mexico" means the mug or blanket may be made in Mexico.
- **Estimated cost for the three gifts in one order:** $6.69 + $10.89 + $13.99 + $0.40 = **$31.97 shipping**, in three parcels. This is inferred from the rate rules.

## 3. Part 2: does the bundle arrive as one parcel?
- **Help centre** (printful.com/shipping, read 31 Oct): "Will I get my order in one shipment? No, not always." The page lists mugs, posters and framed posters among the products that always ship separately.
- **Printful support** (Sparky, an AI assistant; human support was not reached), 31 Oct: "They will most likely arrive in several shipments, not one package." It added that the gifts are "not guaranteed to be made at the same facility" and that the facility can't be chosen. On consolidation it said it "can't confirm that consolidation is available or quote a cost or delivery-time increase."
- **Mug plus card, and portrait plus card:** support said a greeting card "cannot be added as a supported pack-in for orders containing a mug, framed poster, or blanket" and "is not guaranteed to be produced at the same facility or included in the same parcel."

## 4. Part 3: every card, insert and message option
| Option | Per-order text? | Cost | Where it is made | Ships with the gift? | Source |
|---|---|---|---|---|---|
| Printful Greeting Card 4×6 (front, two inside panels, back; envelope included) | Yes, print on demand | $2.55 + $4.49 shipping (+$0.05 each extra card) | US region only for 4×6 | **No**, a separate parcel | Catalog screen, support |
| Greeting Card 5×7 or A5 | Yes | $2.95 / $3.75 | Latvia only for US buyers | No | Catalog Availability |
| Pack-ins (stocked inserts) | No, the same insert for every order | $0.50 per pack-in, $25 per month storage minimum, up to 6×8×1 in | In-house facilities only | **Not allowed** with mugs, wall art or blankets | Help centre, support |
| Packing-slip store message | No, one message for the whole store | Free, 500 characters | Printful in-house facilities only | Yes, but dropped at backup or partner facilities | Live screen: **empty now**, no logo |
| Packing-slip per-order gift message | Yes | Free | In-house facilities only | Yes, on the parcel's slip | Help centre (manual and API orders), support |
| Teeinblue add-on ("Addon Charge") | It is a price add-on, not a printed card | Set by us | n/a | Only if mapped to a product | Help centre. Live: Additional Options is **empty** |
| Teeinblue greeting-card base | Could be imported from Printful | as Printful | as Printful | Separate parcel (Printful rule) | Live: **not imported** |

**Open questions on the packing-slip route:**
- Printful support: "For Shopify orders, I can't confirm that a Shopify order note is automatically transferred as a gift message."
- On split orders: "I don't have confirmed information on whether the gift message is printed on every parcel's slip." No character limit is documented.
- The API v1 docs say the `packing_slip` and `gift` fields override slip settings per order.
- Teeinblue's Printful connector shows no gift-message or packing-slip field, so a Teeinblue-sent order probably carries no per-order message today. This is inferred from the settings screen and needs Teeinblue's answer.

**Teeinblue support:** the question was sent at about 09:50 UTC on 31 October. The bot replied that the team is off for the weekend and back on Monday (Mon to Fri, 02:00 to 11:00 UTC). **No answer yet.**

**Shopify:**
- Settings, Checkout has no gift message field. The active checkout customisations are "Addon Price Cart Transform" (Teeinblue) and "Cart Transformer: Line Properties" (Function Studio).
- The theme code includes a cart-note component. The live empty cart page shows no note box; an empty cart may hide it, so this needs a check with an item in the cart.
- Installed apps: Function Studio, Teeinblue Product Personalizer, growth-heartside, Printful, Heartside checkout artwork, Heartside order QC, Shopify Claude Connector App, control-center, Spocket, Shopify ChatGPT MCP App, MetaShop, Stripe Subscriptions, Bundles, Dropshipper-ai, Printify. **None of them handles gift messages.**

## 5. Part 4: the gates as they stand (report only)
- **Printful, Settings, Orders (Heartside):**
  - Manually confirm imported orders: **ON** (automatic confirmation off)
  - Import personalized orders as drafts: **ON**
  - Fulfill my orders at a backup facility: **ON**. This drops custom packing slips on any backed-up order.
  - Automatically import orders with synced products: ON
  - Use product alternatives: ON
- **Teeinblue, Fulfillment Providers:** Printful is **Connected**, and Auto confirm order is **OFF**.
- **Teeinblue, General settings:** "Bulk Fulfill: Combine orders by Shipping Address" is **ON**. Design URL goes to the line item property.
- **Printful orders:** two drafts awaiting approval: the 24 Oct cost quote and a 13 Oct test.

## 6. Not found, and what blocked it
- **Exact Printful facility per product:** the catalog shows regions ("US / Mexico", "United States") but not sites. The help article on facility locations failed to load.
- **Whether a Shopify or Teeinblue order's gift message reaches the slip, and on every parcel:** Printful's AI support couldn't confirm. A human Printful ticket, or one $0 test order with an API gift message, would settle it.
- **Teeinblue's answer:** waiting until Monday.
- **2026 US holiday cut-off dates:** Printful's Holiday Readiness Hub says "We'll share cutoff dates soon." In 2025 it was Standard 11 Dec and Express 16 Dec for US-made home and living products.
- **Express shipping rates** for these three products: not listed.

## 7. Security note
Teeinblue's Printful connection page shows the Printful API key in plain text. I didn't record it. It appeared on screen during this run, so rotating it is a cheap precaution and your call.

## Sources
- Live screens: Printful dashboard (Settings, Orders and Branding; the cost-quote draft; the catalog pages for Greeting Card, White Ceramic Mug with Color Inside, Enhanced Matte Paper Framed Poster (in) and Sublimated Sherpa Blanket), Teeinblue portal (Fulfillment Providers, Printful connection, General settings, Additional Options, Product Bases), Shopify admin (Settings, Checkout and Apps). All read on 31 Oct 2026.
- Help centre:
  - https://www.printful.com/shipping
  - https://help.printful.com/hc/en-us/articles/50265254386833-How-are-your-products-packaged
  - https://help.printful.com/hc/en-us/articles/360014007840-Can-I-add-promotional-materials-to-my-orders
  - https://help.printful.com/hc/en-us/articles/360014006680-Can-I-include-custom-messages-with-Printful-orders
  - https://help.printful.com/hc/en-us/articles/360014068659-Can-I-choose-where-my-products-are-fulfilled
  - https://www.printful.com/guides/holiday-readiness-hub
  - https://support.teeinblue.com/en/article/send-orders-to-fulfillment-providers-zqp1s0/
  - https://support.teeinblue.com/en/article/upsell-your-product-design-with-addon-charge-additional-charge-1at62af/
- Support: Printful Sparky (AI), three answers on 31 Oct around 09:40 to 09:48 UTC. Teeinblue: bot weekend reply only.
