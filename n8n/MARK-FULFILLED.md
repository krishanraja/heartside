# n8n: Printful shipped, mark Shopify fulfilled

The workflow "Heartside: Printful shipped, mark Shopify fulfilled" runs in n8n. It is private, because it reads orders and addresses.

**Built:** 10 November 2026, on Krish's go ("Build a workflow that marks Shopify orders as fulfilled").

**State:** live since 10 November 2026, 09:52 UTC (`dryRun: false`, `notifyCustomer: true`), after the orders app got its fulfillment scopes and the order emails were changed to show the buyer's painting (`docs/evidence/2026-11-10-fulfillment-and-thumbnails/REPORT.md`). Successful runs are not saved, and failed runs are. A real shipment has not yet exercised it.

**The Shopify token is never saved.** Every Shopify call goes through the helper workflow in `SHOPIFY-ADMIN-CALL.md`, which signs in, makes the call and returns only Shopify's answer. The helper saves none of its own runs, so no saved run of this workflow, failed or successful, holds the 24-hour token (checked 10 November 2026, execution 53696). This is in the draft built on 10 November; until Krish publishes it, the live version still saves the token in failed runs.

## Why it exists

Printful ships, but nothing told Shopify. Krish's first live order, #1013, was printed and shipped on 2 November and delivered on 8 November. Shopify still showed it Unfulfilled, and the buyer got no shipping email or tracking. Claude Code marked it fulfilled by hand on 10 November, with the UPS tracking and no email.

There was a second risk. The send workflow (`SEND-TO-PRINTFUL.md`) treats every paid, unfulfilled order as a candidate, and checks for duplicates against Printful's latest 100 orders only. Once Printful held more than 100 orders, an old order that Shopify still called unfulfilled could be sent a second time. Marking orders fulfilled closes that risk.

## What it does

It runs every 30 minutes, and it can also be run by hand.

1. **Reads the open orders.** Through the Shopify helper (`SHOPIFY-ADMIN-CALL.md`), signed in as the "Heartside n8n orders" app, it reads the paid orders that are not fully fulfilled since `since`, with their fulfillment-order lines.
2. **Skips** test orders, cancelled orders, orders tagged `do-not-fulfill`, and orders named in `hold`.
3. **Groups each order's open lines by the Printful order that ships them:**
   - the gift order is `#<number>`, which Teeinblue and the send workflow both use;
   - each printed card is `hs-card-<number>-<n>`, with n counting card lines in order, as `PRINTED-CARD.md` names them;
   - an Artist's touch line goes with the gift.
4. **Asks Printful for each of those orders by its external id.** Lines are marked fulfilled only when Printful's whole order is `fulfilled`. The fulfillment carries the carrier and every tracking number and link, and goes to Shopify through the same helper, one call per Printful order. A gift that has shipped while its card has not is marked on its own.
5. **Sends Shopify's shipping email** when `notifyCustomer` is true. With the snippet in `shopify/notifications/line-item-painting.liquid`, that email shows the buyer's painting.

It emails hello@krishraja.com once when a person is needed:
- Printful says an order failed, was cancelled, or is on hold;
- a gift is still not at Printful a day after the order;
- Shopify refuses the order query, which usually means the app is missing the fulfillment scopes. This email goes at most once a day;
- Shopify refuses to mark an order fulfilled.

## Settings

- `dryRun`: true reports what it would mark and changes nothing.
- `notifyCustomer`: true sends Shopify's shipping email with the tracking.
- `since`: the earliest order it reads.
- `hold`: order names to leave alone.

## Needs from Shopify

On top of `read_orders`, the "Heartside n8n orders" app needs `read_merchant_managed_fulfillment_orders` and `write_merchant_managed_fulfillment_orders`. The store's "USA" location is merchant-managed. If an order is ever assigned to a fulfillment-service location, the app also needs the `assigned` pair of these scopes.

## Checked on 10 November 2026

- **Simulated run, using n8n's pinned data, execution 53591.** It covered:
  - an order with a shipped gift and an unshipped card: only the gift's line was marked, with UPS and its tracking, and the card waited;
  - an order Printful had on hold: an email for Krish;
  - a test order: skipped;
  - dry run: kept everything out of Shopify.
- **#1013 marked fulfilled in Shopify by hand,** with no email sent. Readback: FULFILLED, with UPS tracking.

The store's myshopify address appears only inside n8n, never here: it is on the never-publish list.
