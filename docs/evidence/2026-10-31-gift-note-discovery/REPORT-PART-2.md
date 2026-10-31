# Gift note and bundle discovery, Part 2: cards, consolidation and the decision it leaves

Status: FINDINGS, not a build. Written 31 October 2026 from a read-only CoWork run, for Krish to bring back to the Claude Code session. Part 1 is `cowork-gift-note-discovery-report-2026-10-31.md`. This Part 2 covers the two follow-up questions Krish asked after reading Part 1, and holds everything learned since. No ids, order numbers, addresses or credentials appear here.

## Why Part 2 exists, in Krish's terms

On 31 October Krish ruled that the gifts go artwork-only, with the dog's note becoming an optional $12 add-on card. He set two conditions: **nothing is packed by hand**, and **one parcel per recipient**.

After Part 1 he pushed back twice:

1. "You sure Printful doesn't offer gift cards at all? I'm pretty sure it does." He wants every card option, with its specs for design, delivery and shipping logistics.
2. "Are you sure there's no way to consolidate orders if they're placed together through Teeinblue and/or Printful? For the prices we're charging I think customers would feel underwhelmed if they got loads of different deliveries."

**The intent to carry forward:** Heartside sells gifts from $45 to over $230 for a set. The arrival has to feel premium and deliberate. A recipient who gets a stream of unexplained boxes feels let down, and that disappointment undercuts the price. Any design the Claude Code session recommends has to protect that feeling. Shipping cost and implementation ease come second to it.

North Star: $50,000 Shopify net sales, trailing four weeks, by 22 February 2027.

## The short answers

1. **Printful does sell cards: a folded Greeting Card and a flat Standard Postcard.** Part 1 named the Greeting Card. Part 2 has full specs for both, below. **Neither can be made to ship in the same parcel as a mug, a framed poster or a blanket.**
2. **No consolidation exists.** Printful (asked directly, and on its help pages) offers no "ship together" option, paid or unpaid. Teeinblue's combine setting merges orders into one Printful order, which saves shipping fees, but it doesn't change how Printful splits parcels. A mug, a framed portrait and a blanket bought together arrive as **at least three parcels**.
3. **The only per-order message that rides inside a gift's own box is Printful's packing-slip gift message.** Whether it works for Heartside's orders is unproven (see the open checks).

## 1. Every Printful card option

### Greeting Card (Stationery, Greeting cards)
| Spec | Detail |
|---|---|
| Format | Folded card, designable to stand horizontally or vertically. Printful warns "Small cracks are likely to appear in the fold area over time." |
| Print areas | Front, Inside 1, Inside 2, Back. Full colour on all four. |
| Sizes and price | 4″×6″ $2.55 ($2.21 on Printful Growth); 5″×7″ $2.95; 5.83″×8.27″ (A5) $3.75 |
| Print file with bleed | 4.15″×6.15″ / 5.15″×7.15″ / 5.98″×8.42″. PNG or JPEG, 300 DPI or more, sRGB, full-bleed. Printful advises against borders because cutting can make them look uneven. |
| Paper and printing | Card stock 260–350 g/m², toner (digital laser) printing. Coated outside; lightly coated inside "for writing". Blank stock sourced from Sweden. |
| Envelope | Included. US-made cards have a glossy outside and a thinner 60# envelope. EU-made cards are matte with a 120 g/m² envelope. |
| Fixed marks | A small production QR code is printed on the back, lower left. It can't be removed. |
| Made where, for a US buyer | Only the **4″×6″** is made in the United States. The 5×7 and A5 are made in Latvia only. |
| US shipping | $4.49 first card, +$0.05 each extra. Delivery 6–10 business days; the product page estimates 13–14 days in total including production. |
| Per-order message | Yes. Every order carries its own print files, so each card can show a different painting and note. |
| In the gift's parcel? | **No.** Printful support: "it will normally be packaged separately, and you should plan for a separate parcel… there is no guaranteed way to make a Greeting Card share a parcel with a mug, framed poster, or blanket." It also can't be a branded pack-in, because it's a stationery product. |
| In Teeinblue today | Not imported as a product base. It could be imported from Printful; nothing was imported in this run. |

### Standard Postcard (Stationery, Postcards)
| Spec | Detail |
|---|---|
| Format | Flat 4″×6″ card, 260–350 g/m², 0.34 mm thick, toner printing on front and back. Glossy outside when US-made. **No envelope.** Same production QR code on the back. |
| Price | $1.53 ($1.35 on Growth) |
| Made where | United States, Latvia, Australia |
| US shipping | $4.49 first, +$0.05 each, 6–10 business days |
| As a pack-in | The product page says it "Can be stored in warehouse and used as a pack-in". Pack-ins are pre-printed stock, **identical for every order**, so they **can't carry a per-order note**. Cost: $0.50 picking per pack-in, plus a $25 per month storage minimum. |
| Pack-in allowed with our gifts? | Mug and framed poster: **no**. Support: "A Standard Postcard pack-in cannot be added to parcels containing an 11 oz mug or a 12 × 18 framed poster." Blanket: support says it "may support pack-ins" if the blanket is made where the pack-ins are stored. **This conflicts with the help centre,** which lists blankets under excluded home decor. Treat the help centre as the rule. |

### Packing-slip gift message (not a card)
- Printed on Printful's white-label packing slip, **inside the gift's own parcel**. No Printful branding and no prices.
- Free, and needs no stock.
- **How it gets on the slip:**
  - Etsy "Mark as gift" orders: automatic.
  - Manual orders: tick "Include a personalized message".
  - API orders: per-order `gift` and `packing_slip` fields (API v1 docs).
  - **Shopify orders, and orders sent through Teeinblue: unconfirmed.** Teeinblue's Printful connection screen shows no gift-message field.
- Dropped whenever an order is routed to a **backup or partner facility**. Heartside has backup facilities switched **on**.
- No documented character limit. The store-wide slip message allows 500 characters.
- When an order splits, the slip notes the split. Whether the gift message prints on **every** parcel's slip is unconfirmed.

### Not a card
Printful sells custom wrapping paper (rolls and sheets) as a product. It doesn't gift-wrap orders.

## 2. Consolidation: can a bundle arrive as one parcel?

| Source | What it says |
|---|---|
| Printful help centre (printful.com/shipping) | "Will I get my order in one shipment? No, not always." Mugs, posters and framed posters are on the always-ship-separately list. Each separately shipped category pays its own first-item rate. |
| Printful support, asked plainly whether *any* way exists | "Plainly: Printful doesn't offer a guaranteed 'ship together' or paid consolidation option." Warehousing, pack-ins, custom packaging or storing stock at one facility "won't force consolidation". There is "no documented Growth/Enterprise, warehousing, or ship-to-one-facility setting" that ensures one package. |
| Teeinblue "Combine orders by Shipping Address" (ON for Heartside) | Merges matching orders and sends "them to fulfillment as one order", to avoid being "charged twice for the shipping fee". Its help page says nothing about packing; Printful's split rules still decide the parcels. |
| Live Printful quote draft (mug + sherpa blanket, US) | Shipping $21.08 flat rate = $6.69 + $13.99 + $0.40 holiday surcharge: two first-item rates, which means two parcels. |

**Where the gifts are made:**
- Mug: Printful's "US / Mexico" region.
- Framed poster: "United States".
- Blanket: "US / Mexico".
- Printful can also reroute any order to a backup facility.

**What a three-gift bundle costs to ship:** $6.69 + $10.89 + $13.99 + $0.40 ≈ **$32**, in three parcels (inferred from the rate rules).

**The only way to one box** is a person or a packing service combining the items. That breaks Krish's no-hand-packing rule and adds cost and days. It isn't recommended.

## 3. The decision this leaves (recommended, awaiting Krish's yes)

Krish has to choose how a multi-gift order should feel, given that it can't arrive as one box. This is the recommended design, held as a test until he rules.

1. **Keep one gift as the hero.** The site already leads with "Make one for my dog", so most orders will be a single gift, and a single gift arrives as one box.
2. **For sets, present the parcels as a planned sequence.** Say it before checkout and again on the branded Printful tracking page, for example "Your set arrives as three gifts, each in its own box." Promised arrivals feel like a gift unfolding; unexplained ones feel like a mistake.
3. **Put the dog's note on the packing slip in every box**, but only once a test proves it reaches the slip on every parcel. For that to hold, backup facilities would need switching off (a setting change that needs Krish's yes).
4. **A 4×6 Greeting Card is optional, and it arrives on its own.** It's a lovely object, but it breaks the one-parcel rule. If it's offered, the copy must say it comes separately.

**Counterpoint:** turning backup facilities off protects the slip message, but it can slow orders when Printful is busy, and Christmas is its busiest time. That trade-off is Krish's to make.

## 4. Open checks before anything is built

1. **One human ticket to Printful**, asking the consolidation question and whether a Shopify or API gift message prints on every parcel's slip. Every Printful answer so far came from its AI assistant, Sparky. Sending the ticket needs Krish's OK.
2. **Teeinblue's answer** to the card question asked on 31 October. Their team is off for the weekend; expected Monday.
3. **One test order with a gift message, carrying all three gifts.** This proves whether the message reaches the slip and appears on every parcel. It needs Krish's yes because it costs money.
4. **2026 US holiday cut-off dates:** not yet published (Printful: "We'll share cutoff dates soon"). In 2025 it was 11 December Standard and 16 December Express for US-made home and living products.
5. **Outside this topic, more urgent:** Shopify's Checkout settings page warns "There were errors during checkout starting October 29, 2026. Some customers have abandoned checkout or were unable to submit orders."
6. **Security:** Teeinblue's Printful connection page shows the Printful API key in plain text. Rotating it is a cheap precaution and Krish's call.

## Sources
- **Live screens, 31 Oct 2026:**
  - Printful catalog: Greeting Card, Standard Postcard, Stationery and Postcards listings, and the product pages for the mug, the framed poster and the sherpa blanket (Description, Shipping, File guidelines and Availability tabs)
  - Printful dashboard: Settings, Orders and Branding; the cost-quote draft
  - Teeinblue portal: Fulfillment Providers, the Printful connection, General settings, Additional Options, Product Bases
  - Shopify admin: Settings, Checkout and Apps
- **Printful support (Sparky, AI assistant), 31 Oct 2026:** five answers, quoted above.
- **Help pages:**
  - https://www.printful.com/custom/stationery/greeting-cards/greeting-card
  - https://www.printful.com/custom/stationery/postcards/standard-postcard
  - https://www.printful.com/shipping
  - https://help.printful.com/hc/en-us/articles/50265136897169-Are-all-products-in-an-order-shipped-together
  - https://help.printful.com/hc/en-us/articles/20583931065372-How-do-I-calculate-shipping-costs-for-different-types-of-orders
  - https://help.printful.com/hc/en-us/articles/360014007840-Can-I-add-promotional-materials-to-my-orders
  - https://help.printful.com/hc/en-us/articles/360014006680-Can-I-include-custom-messages-with-Printful-orders
  - https://help.printful.com/hc/en-us/articles/360014009720-Can-my-customers-mark-an-order-fulfilled-by-Printful-as-a-gift-on-Etsy
  - https://www.printful.com/custom/decor/holiday/wrapping-papers
  - https://www.printful.com/guides/holiday-readiness-hub
  - https://support.teeinblue.com/en/article/bulk-fulfill-your-orders-1sbkjw8/
