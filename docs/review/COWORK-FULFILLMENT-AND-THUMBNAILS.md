# Claude CoWork: shipped orders marked fulfilled, and the buyer's painting in every order email

Status: ASSIGNMENT, not a result. Issued 10 November 2026. Krish runs it in CoWork on his own computer and brings your report back to the Claude Code session.

**Krish's approval.** Krish approved every step of this prompt up front (10 November 2026: "Yes … Build a workflow that marks Shopify orders as fulfilled and then let's set up how to get the thumbnail correct"). Run it straight through. Stop and ask him only where a step says so, or where a screen asks for something this prompt does not cover.

## Why

Krish's first real order, #1013, was printed with his painting, shipped by Printful on 2 November and delivered on 8 November. Two things went wrong:

- **Shopify still called it Unfulfilled,** because nothing tells Shopify when Printful ships. Claude Code fixed #1013 by hand. It also built an n8n workflow, "Heartside: Printful shipped, mark Shopify fulfilled" (`n8n/MARK-FULFILLED.md`). The workflow is in dry run and not published, because Shopify does not yet let it mark orders fulfilled.
- **The order email shows an example dog,** the mug's golden retriever, in place of the buyer's own painting. Shopify draws each line with the product's variant picture. Krish ruled on 5 November that variant pictures stay example dogs for his ads. So the fix goes in the email templates, not the products: `shopify/notifications/line-item-painting.liquid` swaps in the painting.

Do the parts in this order. The shipping emails must show the painting before the workflow starts sending them.

## Before you start

Pull `main` of `krishanraja/heartside`, or the branch Krish names, and read:
1. `n8n/MARK-FULFILLED.md`
2. `shopify/notifications/line-item-painting.liquid`

Never write any credential, the store's myshopify address, the n8n address or any customer detail into a file, a report or a screenshot you keep.

## Part 1: the painting in every order email

In Shopify admin, open Settings, then Notifications, then Customer notifications. Edit the code of each of these:
- Order confirmation;
- Shipping confirmation;
- Shipping update;
- Out for delivery;
- Delivered.

In each template:

1. Find the loop over the order's lines. In Shopify's default templates it is `{% for line in ... %}`.
2. Inside the loop, find the block that draws the line's picture. It starts `{% if line.image %}` and contains `line | img_url: 'compact_cropped'`. Replace that whole block, from `{% if line.image %}` to its `{% endif %}`, with the whole of `shopify/notifications/line-item-painting.liquid`.
3. Two exceptions:
   - If a template's loop variable is not called `line`, change `line` in the pasted text to that name and note it in your report.
   - If a template has no such block, change nothing in it and note it.
4. Leave everything else as it is. In Order confirmation, the "A card from …" block (`order-confirmation-digital-card.liquid`) stays where it is.
5. Save.

**Check it.** Open order #1013 in Shopify admin. Use "Resend" (or More actions, then "Resend confirmation") to send the order confirmation to Krish's own address on the order, and nobody else. Krish opens it on his phone and confirms that the mug's picture is the comic-book painting of his dog with the big stick, not the golden retriever. The shipping templates are checked by the first real shipment in Part 3.

## Part 2: let the orders app mark orders fulfilled

The "Heartside n8n orders" app signs in with a client id and secret. Find where it lives:
- in the Shopify Dev Dashboard (dev.shopify.com), under Krish's organization; or
- in Shopify admin, under Settings, then Apps, then Develop apps.

Then:

1. Open the app's configuration or a new version, and add these Admin API scopes. Keep `read_orders` and every scope it already has.
   - `read_merchant_managed_fulfillment_orders`
   - `write_merchant_managed_fulfillment_orders`
2. Release or save the version, then approve the new access in the Heartside store. A Dev Dashboard app shows an update or approve prompt on its page in Shopify admin.
3. Do not rotate or change the client secret. The n8n credential "Shopify - Heartside orders (client)" uses it, and so do the send and note workflows.

**Check it.**
1. In n8n, open "Heartside: Printful shipped, mark Shopify fulfilled". Leave `dryRun` true and click "Run now" (Execute workflow).
2. Open the execution:
   - "Open Shopify orders" must show `data` with no `errors`;
   - "Which Printful orders" must not say "Shopify refused the order query".
3. #1013 is already fulfilled, so a clean run finds nothing to mark. That is the expected result.

If Shopify still refuses, stop and report its exact error message. Leave out any token.

## Part 3: switch the workflow on

Only after Parts 1 and 2 both pass:

1. In the workflow's Settings node, set `dryRun: false` and leave `notifyCustomer: true`.
2. Publish (activate) the workflow.
3. Click "Run now" once and confirm it finishes with no error.
4. Report that it is live, with the time in UTC.

Rollback: unpublish the workflow, or set `dryRun: true`. Nothing else depends on it.

## Part 4: look, do not change

**The order status page.** In a private window, open #1013's order status page from the link in the email Part 1 sent. Note which picture the mug line shows: the painting or the golden retriever. Report it with a cropped screenshot that shows no address. Change nothing. If it shows the golden retriever, Claude Code will look for a fix.

**The admin order page.** The thumbnail on Shopify's admin order page will always be the variant's example dog. Shopify draws that page and no setting changes it per order. The buyer's real painting is in the line's `_customization_image` link, under the line's properties. Say this in the report and change nothing.

## Report

Write `docs/evidence/2026-11-10-fulfillment-and-thumbnails/REPORT.md`, with one line for each part: done, blocked (with the reason), or not attempted.

Include:
- the five template names, and whether each was changed;
- the scopes the app has now;
- the dry-run execution id and its result;
- the time the workflow went live;
- what the order status page showed.

Hand the report back to Krish for the Claude Code session.
