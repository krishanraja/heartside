# Private blanket connection, October 23, 2026

## Verified progress

- Merged current main into the draft branch, preserving the refreshed North Star state.
- Deployed commit `4be0010` to the existing unpublished theme through GitHub Actions run `40012124675`. The workflow verified the target was not live, saved its backup, and completed successfully. No live-theme deployment occurred.
- Created an isolated Shopify acceptance product with one tan 50 x 60 variant at $89, a unique test SKU, no images and no collection assignment. Its description explicitly identifies it as a private, non-purchasable test of the word-free personality blanket.
- Assigned `blanket-art-preview`. The authenticated theme editor rendered that template against the Draft product. It showed the photo placeholder and no purchase action. The native personalization form is not connected yet; this is not end-to-end acceptance.
- Teeinblue's existing-product selector displayed the test product as Draft and disabled selection, matching its documentation that this route requires Active status.

## Publication incident and recovery

The product began in Draft with no public URL or publication records. Setting Active through the product connector added Online Store and Microsoft Copilot publications. It was promptly returned to Draft. A direct GraphQL status update was also followed by those publications, so the cause cannot be attributed solely to the convenience tool. Do not repeat an Active transition until channel assignment has been removed and verified.

The attempted explicit removal of those two publications was rejected by the Shopify connector's safety policy: `Unpublishing is blocked to prevent accidental storefront catalog removal.` No alternate tool was used to bypass that rejection. The product was returned to Draft again. Final independent readback: Draft, null public URL, no published channels. An order search for the exact test SKU returned zero results with no further page.

Krish was asked to remove the channel assignments in Shopify while leaving the product Draft. This is a real connection blocker, not artwork acceptance. The exact account identifiers and product link remain in private evidence outside this public repository.

## Focused queue

- [x] Native word-free blanket artwork and one-variant campaign prepared.
- [x] Chat facts reach the local bridge without invented breed-based traits or extra text boxes.
- [x] Blanket template deployed to the unpublished Shopify theme and rendered there.
- [ ] Clear private test-product channel assignment, connect the native artwork, return to Draft, and verify the actual form in the unpublished theme.
- [ ] Compare every generated dog portrait with the source photo and trace each prop to an actual answer. No blanket likeness pass has been claimed.
- [ ] Resolve original source resolution and production-file behavior with Teeinblue. Monday follow-up is already scheduled.
- [ ] Complete remaining product upgrades and print checks, including the ornament's known small-text issue.
- [ ] Improve website mockups after product acceptance.
- [ ] Physical sample order last, with exact payment approval.

## Browser handoffs

Krish could not find action pages among accumulated tabs. Closed eight obsolete or duplicate tabs and retained four critical Shopify/Teeinblue tabs. Open the precise requested action page visibly for future handoffs, keep the working set small, and avoid accumulating historical proofs or completed PR tabs.

## References

- [Teeinblue existing Shopify product campaigns](https://support.teeinblue.com/en/article/personalize-existing-shopify-products-with-campaign-by-shopify-products-1wo8urm/)
- [Shopify product creation](https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate)
- [Private theme deployment](https://github.com/krishanraja/heartside/actions/runs/40012124675)
