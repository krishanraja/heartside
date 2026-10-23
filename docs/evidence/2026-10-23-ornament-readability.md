# Ornament readability repair, October 23, 2026

Status: isolated native artwork draft. No campaign, Shopify product or live artwork was changed. This repairs typography within the current photo direction; it is not approval of a new product design.

## Changes

- Preserved the exact original photo layer, image URLs, crop settings and dimensions. No generative transformation was applied to the dog.
- Increased note type from 40 to 50 pixels on the 954 x 954, 3.18-inch canvas. At 300 pixels per inch, 50 pixels corresponds to 12 points before automatic fitting.
- Widened the note box to 640 pixels and increased its height to 180 pixels.
- Moved the signature below the note, enlarged its box and set its nominal type to 50 pixels.
- Moved the decorative paw down to remove the signature overlap.
- Kept the 14-character name, 44-character meaning line and 20-character signature limits.

## Observed checks

- Native validation returned zero errors and zero warnings.
- The portal's Live preview updated all three text layers from fresh form input. Short fixture: Mabel, "You are my favorite person.", "Love, Mabel". Long fixture: Bartholomew Jr, "You're the best part of each single day home", "Love, Bartholomew Jr". The latter is exactly 14 / 44 / 20 characters. Both had legible type and no note/signature/paw overlap in the inspected preview.
- A native server-rendered short fixture completed and was visually inspected after the final save. Default text and paragraph line metadata agree.
- Source live artwork version remained unchanged on independent readback.
- Supplier base readback showed the circle variant available, with a $7.73 base cost and $24 retail price. Shipping, tax, platform fees and any discounts are excluded from that spread. This is not a delivered-margin calculation.

## Failures retained and limits

The first full update timed out and readback showed it had not saved. Targeted layer updates subsequently persisted. A customer-value server preview failed because stored paragraph lines did not match replacement text. Removing paragraph metadata produced a completed render with missing text, so status alone was rejected as proof. Consistent text/line metadata restored rendering; browser Live preview separately verified dynamic text updates.

The first long fixture accidentally contained 45 note characters. It was corrected to the exact 44-character sentence above before the boundary screenshot. The over-limit fixture is not counted as a successful limit test.

A stress test with 44 consecutive W characters caused the native paragraph engine to shrink the line to tiny text. Therefore this draft does **not** guarantee a 12-point minimum for every accepted input. A supported wrapping or fitting guard and a matching final print-file test remain required before release. The displayed reference dog is an existing example, not a newly verified customer upload.

The provider product name refers to two-sided printing, but only one print-area mapping was verified. Do not promise a back-face design without verifying that mapping. No physical print, customer order or fulfillment was created.

Private IDs, source readbacks and browser screenshots are retained outside this public repository. Next: resolve the unbroken-text fitting case, then test the chosen layout through the private campaign and actual print route. Products first, website mockups next, sample last.
