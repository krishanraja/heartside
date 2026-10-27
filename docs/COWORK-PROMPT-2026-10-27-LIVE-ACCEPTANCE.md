# Claude CoWork: Heartside live-browser acceptance review

Status: DRAFT for the release owner to finalize after publishing the theme, reopening the store and merging the release. Written 27 October 2026. This document is a verification instruction, not evidence that release has occurred.

## Release owner: complete the handoff first

Supply the final main commit, release time, current live-theme identity in the private handoff, and the private final compatibility-order receipt. Confirm that normal payments were restored, the three pre-existing USD49 market overrides match their backups, and manual supplier holds remain enabled. Supply any accepted remaining limitations. Do not put customer names/photos, order identifiers, admin URLs, private runtime identifiers or credentials in this repository document.

Use the release owner's final live-state packet and private acceptance receipts. Claude Code separately owns repository tests, build, generated files, security review and source parity; do not repeat that review here. Repository state documents may contain historical and superseded checkpoints. If the packet still describes an unpublished or password-protected store, report the discrepancy and verify current state before drawing conclusions. Do not repeat already-completed tests or revive historical prices merely because an old paragraph mentions them.

## Your assignment

Independently verify the real customer experience at Heartside after release. This advances the North Star by checking that US buyers can confidently buy a gift from their own dog. Begin with the public store, then use existing authenticated browser tabs for read-only backend confirmation. The result must be a finite evidence-backed acceptance report, not a generic checklist or a claim that every possible future order is guaranteed.

Use browser controls only within the authorized browser session. Do not take over the native desktop or open a file picker. Do not ask routine questions that can be answered from the UI or release packet. Continue independent checks if one surface is unavailable; report the precise unverified boundary.

Allowed: navigation, screenshots, ordinary form input, product/format/style selection, reload, and reversible changes to an isolated QA cart you created. Preserve any pre-existing customer cart and accepted artwork. Inspect existing order/workflow/supplier records read-only. Do not record customer data in public artifacts.

Not authorized by this prompt: any photo upload, image or text AI generation, regeneration, real or test order submission, payment or subscription, supplier confirmation/fulfillment, gateway change, theme/product/workflow/configuration edit, publication, deletion of existing orders/artwork, or message to a vendor. Do not click Generate, Create artwork, Generate test design, Retry, Pay now, Place order, Confirm order or equivalent controls. If a step would invoke AI automatically, stop that step and use retained evidence; do not spend to complete a checklist. No new API calls to paid models. Customer-facing text entry that triggers the typed-answer AI is outside this no-generation review; use existing chips instead.

## 1. Prove production is the surface under test

Open these exact public URLs without preview parameters, theme-editor frames or an admin preview cookie:

- https://heartside.io/
- https://heartside.io/products/your-dogs-illustrated-mug
- https://heartside.io/products/your-dogs-personality-blanket
- https://heartside.io/products/your-dogs-portrait
- https://heartside.io/cart

Use a clean browser context if the authorized browser supports one. Otherwise state the limitation and verify a direct customer URL independently. Record final URLs after redirects, time, viewport and whether a password wall appears. Verify both a phone-sized viewport around 390×844 and desktop around 1280×900. Check the default product routes, not only URLs containing `view=mug-native`, `view=blanket-native` or `view=portrait-native`. The public default templates must expose the correct personalization experience.

Confirm header, homepage gifts, navigation, catalog/search and footer route customers to the intended current products. No dated draft handles, paused-product offers, QA controls, debug payloads, broken links or misleading preview labels should appear. The ornament remains held, the pillow is not automatically part of the core launch, and the book is planned rather than immediately purchasable. If an unexpected product appears, report its exact discovery route and current availability; do not hide or delete it yourself.

## 2. Review all three actual products

Expected USD retail baseline: illustrated mug45; unframed portrait59; framed portrait119; word-free sherpa blanket129. Confirm visible prices, selected variant prices, currency and cart totals rather than relying on a card's starting price. Inspect every offered mug color and portrait framing choice. Verify sold-out states, selected options, gallery changes and price transitions agree. Do not change policy or activate a discount.

Review actual mockups at useful zoom. The mug must use the landscape composition, with the dog's face intentionally placed rather than cut off at the wrap edge, and readable note/signature on the appropriate view. Check all offered colors and front/back mappings, not just the default gallery image. The blanket must be word-free with a coherent repeat, intentional edge crop and no residual example text. The portrait must distinguish framed from unframed and show the approved note/signature without clipping. Label catalog examples as examples; they must never be mistaken for a customer's personalized order design.

Read descriptions, sizes, materials, care, personalization instructions, delivery wording and returns/remake information. Flag claims unsupported by the release evidence, invented holiday guarantees, contradictory free-shipping claims, or copy promising that obscured body parts will always be reconstructed correctly. Cross-check the current approved delivery/discount rules before declaring a claim false. Production time and transit time are separate; physical sample quality remains unverified until the owner receives and inspects a real sample.

## 3. Buddy and shared personalization state

In an isolated QA session, test empty dog-name validation and keyboard focus, then use a clearly synthetic dog name. Confirm Buddy remains the host and never overwrites the customer's dog identity. At the recipient step, verify **Me** is offered and changes the field label to **Your first name**. Choose Me, supply a synthetic first name and continue using existing chips only. Confirm the relationship remains selected after back/forward and reload. Also inspect another recipient choice to ensure its existing label and behavior remain intact.

Check saved dog/recipient/note selections across the three core product routes, with no unexpected reset or customer-data leakage. Verify text fits and names/signatures are correctly escaped, with no visible `&#39;` or raw HTML. Confirm optional city/location is explicitly supplied rather than inferred from a delivery address. Do not use free-text answer submission when it would invoke AI.

Test the fresh no-photo/no-accepted-art state: purchase must be blocked with useful next-step wording and no bare product added. Check product cards, search results, quick-add, sticky buttons and any accelerated checkout affordance for bypasses. Do not upload a photo to advance this test.

Only if the release owner supplies an existing isolated QA session with retained accepted artwork: inspect saved artwork, source-photo relationship and the explicit acceptance step without regeneration. Change style, then restore it; acceptance must clear and purchase must block until the intended existing result is explicitly reviewed again. Reload must not silently regenerate or reuse stale acceptance for a different photo/style. If no retained session exists, record this as not re-run and reference the bounded release evidence; do not invent a new generation requirement.

## 4. Actual design in cart and hosted checkout

Use only retained accepted artwork and an isolated QA cart. Record its starting contents. If there is no safe retained artwork session, inspect the final compatibility-order evidence instead and mark fresh customer cart creation untested. Never remove someone else's cart items.

Where safe, add one accepted core product using the native personalization flow. Verify the cart shows that exact customer design, correct variant/options, note/signature where applicable, quantity1 and correct price. No pug/example-dog substitution, stale generic image, duplicate charge, escaped property label, hidden technical field exposed to the customer or obsolete recommendation should remain.

Check quantity1→2→1 with real readback after each change, then reload and recheck. Do not accept an animation or success toast as proof. For a blanket the expected item subtotals are129→258→129 before shipping/tax. Both the displayed presentation row and the underlying purchase quantity must agree. If quantity controls are intentionally restricted, evaluate the visible explanation and actual prevention rather than assuming a change succeeded. Test removal only on the QA line you created; no stale line should survive in a fresh cart read.

If the retained session supports more than one safely accepted product, check a mixed cart for separate artwork identities, quantities and prices; never create extra artwork for this review. Report single-item coverage separately from mixed-cart coverage.

Proceed to hosted checkout only as far as necessary to inspect the line, shipping and total; never submit. Confirm the actual accepted design is the main thumbnail, native personalization remains present and price has not changed. Inspect expanded component details as well: distinguish a correct parent image from any residual neutral component thumbnail, document what a customer actually sees, and do not silently downgrade the owner's actual-design requirement.

Do not enter the owner's private address or billing details from an old record. Use only an explicitly approved QA recipient supplied privately, or inspect the existing final test-order quote and state that no new quote was obtained. Record item subtotal, shipping charge, shipping discount, tax, currency and total separately. Do not infer universal US free shipping from one New York quote. Check the configured coverage for50states, DC and Puerto Rico against current policy; report unverified regions explicitly.

## 5. Read-only backend acceptance

Using the private release receipt, locate the final approved compatibility order in Shopify and Teeinblue. Do not create another one. Verify exact linkage rather than searching for a visually similar preview. Record privately whether Shopify marks it as a test/unfulfilled, whether the original native variant and personalization properties survived, and whether Teeinblue has the expected mapped variant/SKU, completed design and no rendering error. Verify the order-linked original print artifact, dimensions, and hash against the existing private proof; a thumbnail alone is not a print file. Do not publish the order ID, customer image, address or private download URL.

The retained blanket proof is expected to include a15900×18900 RGBA production PNG and the official50×60sherpa geometry:53×63-inch print canvas and centered45×55-inch safe area. Check the exact final receipt before treating these as the final order's measurements. The previously inspected few transparent exterior rows lay outside the nominal finished/safe regions; do not misrepresent that bounded geometry result as a physical manufacturing guarantee or native AI source resolution. Mug and portrait production acceptance must be reported separately; blanket order success does not prove every product's print output.

In Shopify Admin, read the payment page: normal Shopify Payments must accept payments with test mode off and Bogus Gateway inactive. Confirm the three pre-existing49USD market prices against the rollback receipt. In Teeinblue/Printful, verify automatic confirmation remains disabled, imported personalized orders stay drafts and production requires manual review. Never click a confirmation/fulfillment control. The owner's future real sample order remains theirs to place.

Inspect the relevant active AI and checkout-media workflow versions read-only against the release packet. The typed-answer prompt must support recipient.relation=self without changing the existing named-recipient voice contract. Check published versus merely saved status; do not trigger a model run. For checkout-media preparation, verify the expected active integration and bounded failure behavior from existing receipts. Do not expose credentials, change workflow settings, or treat a green workflow badge as end-to-end proof.

Confirm final runtime wiring from the live UI and release readback: homepage core purchase enabled, all three native purchase routes enabled, actual-design preparation configured on each, clean handles/default template assignments, and no temporary checkout-image diagnostic surface. Private runtime values belong only in private evidence. Verify installed recurring app cost against current billing evidence; approved economics includes69USD/month for the checkout app. Modelled margins are not measured net margins: the current policy is a30% all-cost floor, and the documented low-volume mug-heavy scenario remains a sensitivity to monitor, not a claim that every sale clears it.

## Deliver the review

Save screenshots and sensitive evidence privately, using neutral filenames. The public report must contain no customer data, private URLs or runtime identifiers. For each check give: PASS, FAIL or NOT VERIFIED; exact public URL or private evidence reference; timestamp/viewport; steps; expected and actual result; screenshot or readback reference; and practical consequence.

Lead with launch-blocking findings, then other defects, then unverified boundaries. Prioritize wrong artwork/order identity, wrong charge, unavailable checkout, bypassed personalization, unintended AI charges and supplier auto-release. Give finite reproduction steps and the smallest proposed correction; do not apply fixes under this verification prompt. Consolidate related defects rather than repeatedly asking the owner questions.

Conclude with one of: **safe for the owner to begin their real sample checkout**, **hold for listed defects**, or **insufficient evidence at the named boundary**. Separately state that physical print quality and a real paid-order fulfillment journey remain for the owner's sample. Never describe the store as100% proven because source tests, a test order or screenshots passed. Return the finite report to the release owner; do not place the sample order.
