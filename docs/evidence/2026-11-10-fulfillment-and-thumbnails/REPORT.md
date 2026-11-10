# Fulfillment and thumbnails: CoWork report

Run: 10 November 2026, 08:16–09:55 UTC, in Krish's Chrome via the Claude side panel. Brief: `docs/review/COWORK-FULFILLMENT-AND-THUMBNAILS.md`.
Source files used: `shopify/notifications/line-item-painting.liquid` and `n8n/MARK-FULFILLED.md` from branch `ccr-00dfb7a0-l0vbjn`. They are not on `main`.

| Part | Result |
|---|---|
| 1. Painting in every order email | Done, after one correction. Krish confirmed it on his phone. |
| 2. Fulfillment scopes on the orders app | Done. Dry run clean. |
| 3. Workflow live | Done. Published 09:52 UTC. |
| 4. Look, do not change | Done. The order status page still shows the example dog. |

## Part 1: order email templates

| Template | Changed | Detail |
|---|---|---|
| Order confirmation | Yes | 6 `line` picture blocks; 10 `component` blocks; 4 line-item-group picture blocks. "A card from …" block untouched. |
| Shipping confirmation | Yes | 2 blocks. Variable mapped to `line.line_item`. |
| Shipping update | Yes | 2 blocks, `line.line_item`. |
| Out for delivery | Yes | 2 blocks, `line.line_item`. |
| Delivered | Yes | 2 blocks, `line.line_item`. |

Each template was read back from a fresh load after saving.

**Deviation 1: the shipping templates.** In these four templates the loop variable is `line`, but the loop runs over fulfillment lines, so the gift itself is `line.line_item`. The snippet was pasted with `line` replaced by `line.line_item` in its code lines. Pasted unchanged, it would read no properties and show the variant picture.

**Deviation 2: grouped orders. This was the first check's failure.** The first resend, at 08:50 UTC, still showed the golden retriever. The cause is #1013's line, which belongs to a line-item group created by the checkout bundle (`_hs_checkout_parent: true`). Shopify draws a grouped line in its own loop, `for line_item_group in line_item_groups`, where the top picture belongs to the group and the nested row is a `component`. The brief only covered `for line in …` loops. The correction, in Order confirmation only:
- **Each component picture block.** The snippet was pasted with `component` as the variable (10 blocks).
- **Each group picture block.** Before Shopify's own chain (`parent_line_item`, then `line_item_group`, then the placeholder), the painting now comes first. It is read from the group's components, `_hs_checkout_image` first, then `_customization_image` (4 blocks).

The second resend, at about 09:15 UTC, loaded `heartside-checkout-<customization id>.jpg` for both the group and the component pictures. Krish confirmed the painting on his phone.

**Side effects of the straight swap.** The snippet drops Shopify's grey "no image" placeholder and right-to-left alignment. Neither affects Heartside's gift lines.

**For Claude Code:**
- Add the grouped-order case (`line_item_group` and `component`) to `line-item-painting.liquid` and to `tools/preview/line-item-painting-email.test.mjs`. It currently covers plain lines only.
- Record the `line.line_item` mapping for the shipping templates.

**Rollback.** The replaced blocks were Shopify's defaults, `{% if <var>.image %} … img_url: 'compact_cropped' … {% else %} no-image {% endif %}`. The group openers were `{% if parent_line_item and parent_line_item.image %}`. Each template also has Shopify's "Revert to default", but on Order confirmation that would also remove the digital-card block.

## Part 2: orders app scopes

- **App.** "Heartside n8n orders" is a Dev Dashboard app. Its scopes before were `read_orders` only.
- **New version.** Version `heartside-n8n-orders-2-fulfillment` was released at 08:51 UTC with:
  - `read_orders`;
  - `read_merchant_managed_fulfillment_orders`;
  - `write_merchant_managed_fulfillment_orders`.
- **Store approval.** The access update was approved in the store. The app page now shows Orders as View granted and Edit granted.
- **Client secret.** Not rotated or changed.
- **Dry run, execution 53609, 08:53 UTC: success.**
  - The issued token's scope is `read_orders,write_merchant_managed_fulfillment_orders`. Shopify folds read into write.
  - "Open Shopify orders" returned `data` with no `errors`.
  - "Which Printful orders" raised no refusal and found nothing, which is expected because #1013 is already fulfilled.

## Part 3: workflow live

- **Settings node.** `dryRun: false`, `notifyCustomer: true`. Saved as version "Go live: dryRun false".
- **Published at 09:52 UTC** (active version `b23bfe78-03fd-420a-87c4-c67ce7ec4f00`). It runs every 30 minutes.
- **Manual run, execution 53632, 09:52:13 UTC: success.** Settings showed `dryRun: false`. There were no open orders and nothing to mark.
- **Rollback.** Unpublish the workflow, or set `dryRun: true`.

**Execution log hygiene.** The workflow's executions store Shopify's token response, a 24-hour access token plus admin session cookies, in plain form. Redaction in n8n needs a plan upgrade, which was not bought.
- Krish set "Save successful production executions" to "Do not save". An API attempt to make that change was refused by a safety check, so Krish made it himself.
- Failed runs still save, for debugging.
- Executions 53609 and 53632 were deleted.
- 53591, Claude Code's pinned-data simulation, remains.
- For Claude Code: consider reading the token without storing the response, so failed runs stop logging it.

## Part 4: look, do not change

- **Order status page** (#1013, opened from the resent email on Krish's phone, at the customer account order page). The mug line and its nested row show the golden retriever, the variant picture. Krish's phone screenshot shows a contact email, so it was not kept here. Nothing was changed, and Claude Code owns the fix.
- **Admin order page.** The thumbnail is always the variant's example dog. Shopify draws that page and no setting changes it per order. The buyer's real painting is in the line's properties, as `_customization_image`, and as `_hs_checkout_image` for the checkout copy. Nothing was changed.

## Not verified

- **The shipping-family templates.** They have not been seen rendered with a real grouped shipment. The first real Printful shipment is their check, as the brief planned.
- **A real fulfillment by the live workflow.** No open orders existed to exercise it.

## Claude Code review (10 November 2026)

- **Live state, read back from n8n:**
  - the workflow is active on version `b23bfe78`, the one CoWork published;
  - successful runs are not saved;
  - only the pinned-data simulation, execution 53591, remains.
- **The two deviations are now in the repository and tested** (10 of 10 pass):
  - `line-item-painting.liquid` now names its line in one place, `hs_l`, and lists the three pointers: `line`, `component` and `line.line_item`;
  - the bundle group's top picture is its own file, `line-item-group-painting.liquid`. It goes before Shopify's chain, and Shopify's chain stays as the fallback.
- **Still open:**
  - The order status page in customer accounts shows the variant's example dog. Shopify draws that page, and no template there can change it. The only route is a customer-account UI extension in an app. It can add the painting next to the line, but it cannot replace the line's picture. That is Krish's call.
  - Failed runs of the four order workflows still store Shopify's token response. The fix is proposed as a separate task.
