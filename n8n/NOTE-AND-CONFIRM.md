# n8n: the dog's note on the packing slip, then confirm

The workflow "Heartside: dog note on the packing slip, then confirm" runs in n8n, private and never in this repository's Actions, because it reads orders. It carries out the launch plan's step 3 (`docs/review/LAUNCH-READY-2026-10-31.md`).

**Built:** 31 October 2026. **State:** live since 31 October 2026, 18:39 UTC, on Krish's go after the release (`dryRun: false`, active).

**The Shopify token is never saved.** Every Shopify call goes through the helper workflow in `SHOPIFY-ADMIN-CALL.md`, which signs in, makes the call and returns only Shopify's answer. The helper saves none of its own runs, so no saved run of this workflow, failed or successful, holds the 24-hour token (checked 10 November 2026, execution 53687). Live since 10 November 2026, 11:40 UTC, on Krish's go.

## What it does

The workflow runs every 10 minutes, and it can also be run by hand.

1. **Reads Printful's drafts** (n8n credential `Printful - Heartside orders`) and keeps only those that:
   - Teeinblue sent: the external id is the Shopify order name, like `#1012`;
   - were created after `startAfter` (31 October 2026, 15:20 UTC), so older test drafts are never confirmed;
   - hold only known products: poster (1), framed poster (2), mug (403), blanket (711).
2. **Reads the Shopify order** with the same name, once per draft, through the Shopify helper (`SHOPIFY-ADMIN-CALL.md`). The helper exchanges the "Heartside n8n orders" app's client id and secret (n8n credential `Shopify - Heartside orders (client)`) for a 24-hour Admin token, scope `read_orders`, and keeps the token to itself. It skips the order, leaving it a draft, when:
   - it is a test order;
   - it is cancelled;
   - it isn't paid;
   - the print files aren't ready (the next run tries again).
3. **Writes the note.**
   - The text comes from the line property `Your note` (or `_hs_lines`).
   - The recipient's name comes from `_hs_answers` ("For: …"), unless the buyer is buying for themselves.
   - The sign-off is `Signed` (or "Love, " plus `Dog's name`).
   - It goes into Printful's gift message: subject "A note from <dog>", at most 500 characters.
   - An order with no note at all is confirmed without one.
4. **If `dryRun` is false**, it puts the gift message on the order (`PUT /orders/{id}?confirm=false`) and then confirms it (`POST /orders/{id}/confirm`). Printful charges for the order at that point, under Krish's standing approval (31 October 2026). Setting `dryRun` back to `true` stops all confirming.

## Checked on 31 October 2026

- **Printful token:** reads drafts. It wrote a gift message onto the never-confirmed cost-quote draft, and the gift message read back. That draft still carries the test message and is never confirmed.
- **Shopify app:** the token exchange works, and the token reads a past test order with all its line properties.
- **Decision logic, on simulated data:** the old test draft and the cost-quote draft are ignored. A paid order gets "Jo-anne, / I'm in charge here, and I choose you. / Love, Pickle". An order with files not yet ready waits. A dry run stops before Printful.
- **A live dry run** against both services succeeded and touched nothing.

## Still to do before it goes live

- **Failure alerts.** n8n has no email credential yet. Until one exists, an order the workflow skips stays a draft, and is visible only in n8n's execution list.
- **The printed card.** Add the 4×6 card item with the Christmas front, and enforce the 3 December cutoff.
- **Switch it on.** Set `dryRun: false`, then activate the workflow. This happens when the theme goes artwork only, before Krish's order as a customer.

The store's myshopify address appears only inside n8n, never here: it is on the never-publish list.

## Changed on 2 November 2026: the note fits Printful's 200 characters

The first live order's note ran to 209 characters, and Printful cut it at 200, dropping the signature to "Lo". The recipient's name was missing too: the journey writes "For: KJ", and the workflow only knew "For: Sam (friend)".

The workflow now:
- reads both forms of the name;
- always keeps the greeting, the note's closing line (what the dog means to them) and the signature;
- drops the middle lines, last first, until the note fits in 200 characters.

For the first order's four lines, that keeps the first, second and last, at 161 characters. The first order itself was already confirmed and could not be changed.
