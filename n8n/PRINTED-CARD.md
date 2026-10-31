# n8n: the printed Christmas card from the dog

The workflow "Heartside: printed Christmas card from the dog" runs in n8n, private and never in this repository's Actions, because it reads orders and addresses. It makes the $12 card that buyers add on the gift page or in the cart (`docs/review/LAUNCH-READY-2026-10-31.md`).

**Built:** 31 October 2026. **State:** live since 31 October 2026, 18:39 UTC, on Krish's go after the release (`dryRun: false`, active).

## What it does

It runs every 10 minutes, and it can also be run by hand.

1. **Signs in to Shopify.** It uses the same "Heartside n8n orders" app as the note workflow (n8n credential `Shopify - Heartside orders (client)`, scope `read_orders`).
2. **Reads the orders placed after `startAfter`** and finds each card line: the line property `_hs_addon` is `card`, and `_hs_addon_for` names the gift's design.
3. **Gathers the card's words from that gift's line:**
   - the painting is the gift's print file, `_tib_design_link_1`;
   - the note is `Your note` (or `_hs_lines`);
   - the dog is `Dog's name` (or `Signed`);
   - the recipient is the "For:" name in `_hs_answers`.
4. **Checks Printful twice** (n8n credential `Printful - Heartside orders`):
   - whether the card's own order `hs-card-<order number>-<n>` already exists;
   - the gift's own order (external id `#<order number>`), whose address the card ships to.
5. **Decides.** It makes the card only when every one of these holds:
   - the order is paid, not a test and not cancelled;
   - it was placed before the cutoff, 11:59 pm Eastern on Thursday 3 December 2026;
   - the painting is ready and there is a note;
   - the gift is already at Printful, with a US address.

   A card ordered after the cutoff is never made, and hello@krishraja.com is told to refund it. The other problems are emailed once when they need a person: a painting or a gift still missing after two hours, no note, or an address outside the US.
6. **If `dryRun` is false, it makes the card:**
   - **Renders each of the four panels** (front, inside1, inside2, back). PDF.co, on n8n's gateway credits, prints `https://heartside.io/pages/card?d=…&panel=…` on a 10.375 × 15.375 in page, 2.5 times the card. Its 120 dpi image step turns that into a 1245 × 1845 px file, which matches Printful's 300 dpi file for the 4×6 card (1842 × 1240, rotatable).
   - **Creates and confirms one Printful order:** variant 14457 (the 4×6 US greeting card), the four files, and the gift's address. Printful charges for it then, under Krish's standing approval (31 October 2026). If Printful refuses, hello@krishraja.com is told.

## Checked on 31 October 2026

- **Printful's card spec**, read from its API:
  - four placements: front, inside1, inside2 and back;
  - each 1842 × 1240 px at 300 dpi.
- **PDF.co, through n8n's gateway:**
  - it renders HTML to a PDF of a custom page size;
  - its PNG step works when it returns a link (`inline: false`), and it draws at 120 dpi.
- **Decision logic, on five simulated orders:**
  - a good card builds a Printful order with four files and the gift's address;
  - a card ordered after the cutoff emails for a refund;
  - a test order and an already-made card are skipped;
  - a gift not yet at Printful waits.
- **A live dry run:** the Shopify sign-in and the order search work. There are no card orders yet, and nothing was touched.
- **Locally:** the card page draws a tall painting and a wide one (the mug's wrap, in a wider mount) at the renderer's page size.

## Before it goes live

- **The card page has to exist.** Publish the theme with `templates/page.card.json`, and create the Shopify page `card` with that template. The workflow can't render anything until then. Its first real render is the end-to-end proof.
- **The card product goes on sale.** Set "A Christmas card from your dog" to active on the Online Store, and pick it in the memo bar's "Printed Christmas card add-on" setting.
- **At the cutoff,** set the card product unavailable. The theme and this workflow already stop at the same moment, but the n8n app can only read orders, so this step is done in Shopify admin.
- **Switch it on:** set `dryRun: false`, then activate the workflow.

The store's myshopify address appears only inside n8n, never here: it is on the never-publish list.
