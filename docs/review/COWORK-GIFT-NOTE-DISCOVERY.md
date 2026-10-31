# Claude CoWork: how the dog's note and a bundle can reach the recipient in one parcel, with nobody packing anything

Status: ASSIGNMENT, not a result. Written 31 October 2026 for Krish to run in CoWork on his own computer. **Read only: change nothing anywhere.** No saves, no Updates, no orders, no test purchases, no messages to customers. The one thing you may send is a question to Printful's and Teeinblue's support chat, worded as below. Work only from `main` of `krishanraja/heartside`.

## Why this exists, in Krish's terms

On 31 October Krish ruled that the gifts go artwork-only: the mug and portrait carry the painting alone, and the note in the dog's voice becomes an optional $12 add-on, a gift card the dog "wrote". His two conditions:

- **Nothing is packed by hand.** Krish never holds stock and never puts things in a box himself. Every order must be made and shipped by the suppliers on their own.
- **One parcel.** The recipient must not get a stream of separate packages. In his words: "the recipient will receive lots of different packages one at a time, which I don't want."

Krish believes the existing suppliers already offer gift cards. Your job is to find out exactly what Printful, Teeinblue and Shopify can do today, read from the live platforms, so the Claude Code session can recommend one design. Report facts with screenshots; where a page and support disagree, report both.

The North Star is $50,000 Shopify net sales, trailing four weeks, by 22 February 2027. A note that arrives with the gift, at no extra handling, protects the Christmas orders.

## Rules that hold for the whole run

- Read only. Never press Save, Update, Confirm, Publish, Submit or Pay. Never change a setting, even to look at what it would do. If a screen only shows an option after you change something, describe the option instead and take a screenshot.
- Never put a credential, the store handle, a theme id, a Teeinblue campaign id, a Printful id, an order number, a customer's name or address, or Krish's personal email in the report or in any file you save to the repository. Use hello@krishraja.com where a contact is needed.
- Support questions: ask them in Printful's and Teeinblue's own support chat or help centre, as Heartside, using the wording below. Do not share order numbers or customer data with support.
- Record where each fact came from: a dashboard screen (with a screenshot), a help-centre page (with its URL and date), or a support answer (with a quote and time).

## Before you start

Pull `main`. Read `NOW.md` and `docs/SCOPE.md`. Know the three gifts:
- the 11 oz mug in five colours;
- the 12 x 18 portrait, framed in black, red oak or white, or unframed;
- the 50 x 60 sherpa blanket.

All three are made by Printful through Teeinblue. Buyers are in the United States.

## Part 1: what each gift is and where it is made

For each gift, in Printful (Dashboard, Stores, Heartside, the product, and the catalog page for its base product), record:

1. the exact Printful catalog product name and variant (for example "White Ceramic Mug with Color Inside, 11 oz, Pink");
2. the fulfillment facility or region it is made in for a US address, and whether that can change (backup or partner facilities);
3. how it is packed (its own box, a mailer, a poly bag);
4. the production time and the US shipping method, time and cost Printful shows for one item, and for the three together.

## Part 2: does an order ship as one parcel?

1. In Printful's help centre, read "Are all products in an order shipped together?" and the packaging pages. Quote what they say about mugs, posters and framed posters, and blankets.
2. **Ask Printful support:** "For a US customer, if one order contains an 11 oz mug with colour inside, a 12x18 framed poster and a 50x60 sherpa blanket, are they made at the same facility, and will they arrive in one package or several? If several, can we choose to consolidate them into one shipment, and what does that cost or how long does it add?"
3. Ask the same about two pairs: mug plus card, and portrait plus card (see Part 3).
4. Report the shipping Printful would charge for the three-gift bundle shipped split versus shipped together, if it shows both.

## Part 3: gift cards and notes the suppliers already offer

Look for every way a personalised card or note can travel inside the gift's own parcel, made by the supplier.

**Printful:**
1. Greeting cards in the catalog: each size, folded or flat, whether the inside can be printed, whether it can be personalised per order through Teeinblue, the cost, the facility for a US address, and the packaging (kraft envelope?). Screenshot the catalog page.
2. Packaging inserts (pack-ins): are they the same for every order, or can one carry a per-order message? Cost and size.
3. Packing-slip messages: the store-wide message in Settings, Store settings, Branding. Also whether a per-order gift message can reach the packing slip from a Shopify order automatically: the Shopify order note, the "gift" or "packing_slip" fields in Printful's order API, or an app setting. Report what the Heartside store's settings show now, without changing them.
4. **Ask Printful support:** "Can a personalised greeting card with a different message for each order ship in the same package as a mug, a framed poster or a blanket, made at the same facility? If not, what is the closest option for a per-order printed message in the same parcel?"

**Teeinblue:**
1. Look in the Teeinblue app (campaign settings, Add-ons or Upsell, Settings) for gift messages, greeting cards, gift wrap or "add a card" options. Screenshot each, with its price and which fulfilment partner makes it.
2. Check whether a Teeinblue campaign can hold two print areas that print as one order line, for example the gift plus a card made from the same buyer's photo and text.
3. **Ask Teeinblue support:** "We sell personalised mugs, framed posters and blankets fulfilled by Printful. We want to offer an optional card with a personalised message (written for each order) that arrives in the same package as the gift. What does Teeinblue offer for this, and which Printful products or settings make it ship together?"

**Shopify:**
1. Shopify admin, Settings, Checkout: is there a gift message or order note field on the store's checkout now? Screenshot it. Change nothing.
2. Apps: list any installed app that handles gift messages or gift cards (not Shopify gift cards for money). Report only.

## Part 4: today's automation, read back

Read each without changing it:
1. Printful, Settings for the Heartside store: "Manually confirm imported orders" or automatic confirmation, and "Import personalized orders as drafts". Screenshot both.
2. Teeinblue fulfilment settings: is Printful connected, is auto-confirm on or off? Screenshot.
3. Shopify's Printful app: anything that holds orders.

These gates were set on purpose during testing (Krish, 31 October: "those are bottlenecks we've put in place"), so report them only.

## Part 5: anything else the decision needs

Report anything else you find that decides how a note and a bundle reach one address in one parcel without anyone packing: costs, minimums, holiday cut-off dates for US Christmas delivery from each facility, and any limit on personalised text length on cards.

## Report

Return in this order:
1. A one-paragraph answer: can a per-order note or card travel in the same parcel as each gift, made by the supplier, today? If yes, name the route.
2. **Part 1 table:** gift, Printful product, US facility, packaging, production and shipping time, cost.
3. **Part 2:** does the three-gift bundle arrive as one parcel? Quote support and the help centre.
4. **Part 3:** every gift-card, insert, packing-slip and Teeinblue option, with cost, facility, personalisation per order, and whether it ships with the gift.
5. **Part 4:** settings as they stand, with screenshots.
6. Anything you could not find, and the exact screen or answer that blocked you.

Say plainly which facts come from a live screen, which from help pages, and which from support. Change nothing.

Krish brings the report back to the Claude Code session, which recommends one design and waits for his yes before building anything.
