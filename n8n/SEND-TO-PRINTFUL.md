# n8n: send paid orders to Printful

The workflow "Heartside: send paid orders to Printful" runs in n8n. It is private, and it never runs in this repository's Actions, because it reads orders and addresses.

**Built:** 2 November 2026. **State:** live since 2 November 2026, 14:32 UTC, on Krish's go ("this needs to be all as autonomous as possible").

## Why it exists

On 2 November CoWork found that Teeinblue never sends an order to Printful on its own. Each paid order sits as "Ready" until someone presses "Confirm & Send to fulfill", and no setting changes that. Krish's first live order sat there for six hours.

## What it does

It runs every 10 minutes, and it can also be run by hand.

1. **Signs in to Shopify** with the same "Heartside n8n orders" app as the note workflow (`read_orders`).
2. **Reads the paid, unfulfilled orders** placed since `since`.
3. **Reads Printful's orders** and leaves alone any order Printful already has. Teeinblue and this workflow both use the Shopify order name as the external id, so an order is never sent twice, even if someone also presses Teeinblue's button.
4. **Skips:**
   - test orders, cancelled orders, and orders tagged `do-not-fulfill`;
   - orders named in `hold`;
   - anything younger than `minAgeMinutes` (15). Teeinblue makes the print file in the first minutes.

   It emails hello@krishraja.com once, an hour after the order, when a person is needed:
   - an Artist's touch is on the order (the artist reworks the design first);
   - a line it does not know;
   - no readable shipping address;
   - an address outside the US.
5. **Sends each order to Printful as a draft** (`confirm=false`). For each gift line it uses:
   - the line's `_tib_fulfilled_sku`, which is the Printful variant;
   - its print file, `_tib_design_link_1`, as the `default` file;
   - the order's US shipping address.

   The $12 card lines are left to the card workflow (`PRINTED-CARD.md`). It ships to the gift's Printful address.
6. **The note workflow takes over** (`NOTE-AND-CONFIRM.md`) on its next run. It writes the note on the packing slip and confirms the order, which is when Printful charges.

If Printful refuses a draft, hello@krishraja.com is told. Nothing is charged, and the order stays Ready in Teeinblue to send by hand.

## Settings

- `dryRun`: true reports what it would send and changes nothing.
- `since`: the earliest order it touches.
- `minAgeMinutes`: how long it waits after an order is placed.
- `hold`: order names to leave alone for now.

## Checked on 2 November 2026

- **Dry run against the live store.** Krish's mug order built exactly the Printful order Teeinblue would send: Printful's mug variant for Black, 11 oz; his Mowgli wrap print file; his Brooklyn address.
- **Live run with that order in `hold`.** It was skipped and nothing was sent.
- **The three October test orders** are archived and tagged `do-not-fulfill`. Shopify's connector refuses order cancellation as a money action.

The store's myshopify address appears only inside n8n, never here: it is on the never-publish list.
