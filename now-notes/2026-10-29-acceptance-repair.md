# Acceptance repair checkpoint — 29 October 2026

Status: HOLD. Repairs are on PR #71; no live theme release has occurred. This is an in-progress acceptance checkpoint, not a launch or revenue claim.

Ruling (Krish, 2026-10-29): fix all blockers autonomously, rerun the gates, and leave physical phone checks until every other gate passes. Platform work remains in the Codex browser.

The branch reconciles current main, including #69 and #70. Saved checkout artwork now gets a bounded 90-second wait with 12 readiness polls; retries retain the same design and cannot repaint. Toy and accessory text persists on input before blur. Chat fixes cover self-gifts, hyphenated names, typed display punctuation, and clearing prior artwork choices on restart. Typed follow-ups reject invented bringing, carrying or fetching when the owner only said a toy was beside the dog. The Hilarious direction now requires a clear visual joke without inventing objects.

Verified platform repairs: the blanket checkout tile is assigned and appears on the reported order; the mug supplier price is $45 across its five sold colors and reads back in Shopify; both mug text layers have a cream outline for contrast. The typed-answer workflow was saved, exported for an exact two-field comparison, published, and exercised through the normal storefront chat. Its resting-beside-a-hedgehog input no longer produced a delivery question. The contrast editor preview is not yet fresh-paint proof.

Offline tests passed on 1fcb934 (Actions run 40825376283, 3m 7s). The reconciled branch is rerunning CI. Earlier draft gates passed preview acceptance, but the full presentation run failed during a supplier price republish; the upstream price is corrected and all three draft gates must be rerun after pushing the complete repaired branch. A main-branch handle-check pass is not a pass for those three draft gates.

Real payments are restored. The four completed mock orders and the four named earlier test orders were canceled/refunded as applicable; no customer notifications were sent and no Printful fulfillment was confirmed. Eight of fourteen paintings are used. One painting is reserved for combined repair verification and five for the final phone/order checks. Physical print quality and the mug margin decision remain open. No new paid revenue measurement is claimed.

Next: complete CI and closeout checks; push only the unpublished theme from the exact reviewed repair head; rerun preview acceptance, live presentation gate and handle-check; use the single repair painting to prove toy/accessory retention, Hilarious direction, mug contrast and immediate saved-art add/retry. Only after those pass, run the real Android Edge/Chrome and iPhone Safari photo checks and final mock order, restore payments and clean up, then release only if the brief's phone conditions pass. Update this checkpoint with actual results.

North Star check (2026-10-29): holds. Removing checkout and personalization blockers supports paid conversion, but test orders and green checks do not move the measured revenue number.
