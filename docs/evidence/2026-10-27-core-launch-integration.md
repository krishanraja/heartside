# Core launch integration — 27 October 2026

Status: work in progress. The store has not been reopened and the launch is not certified.

The owner's current requirement is a complete live customer journey, including the customer's actual purchased design in checkout. He will place the real sample order himself after reopening. The earlier private checkout and neutral thumbnail workaround are not the next action. No additional image generation, payment, paid app installation or supplier release occurred in this integration.

## Persisted product configuration

- The illustrated 11 oz mug has its own Shopify binding, exactly five approved colors at USD45, and remains Draft. Native synchronization completed with no outstanding sync. Both mapped views per color and the 2700×1050 print area are configured.
- The portrait is one Shopify product with four variants: unframed USD59, and Black, Red Oak and White frames USD119. Existing frame IDs and SKUs are preserved. Both print areas use the same artwork/template. The unframed area is 3600×5400, and the original framed placement is unchanged. Independent post-sync readback confirms exactly four variants and no pending synchronization. Product remains Draft.
- The Tan 50×60 word-free blanket is USD129, Unlisted, with its native binding synchronized. The existing neutral variant image is not a solution to the checkout requirement. The approved non-customer word-free example is attached as a separately labelled gallery image; it is not a production print input.
- All ten core variants use untracked inventory, CONTINUE policy and require shipping. A quantity of zero therefore does not alone make these made-to-order variants unavailable.
- The legacy ornament-with-gift automatic discount is now expired. Existing standard US free-shipping discount remains active. No new offer or paid advertising was activated.
- Native supplier-base prices were not rewritten. Future native synchronization must preserve Shopify retail prices rather than copying the older supplier-base retail placeholders.

## Deterministic copy and preview evidence

The live native mug editor renders a 120-character note and an accented signature as exact separate paragraph layers. The saved SVG and independent parsing confirm the strings and five-line note layout. Earlier blank previews were caused by diagnostic overrides omitting computed paragraph lines; they did not establish a production paragraph failure. The attempted paragraph-setting change was rolled back; only the missing existing merchant-reference image URL repair remains. This validates text transport/layout, not physical print readability or the new landscape AI composition.

The combined portrait's four mapped views render the same scene and note with the intended frame colors or unframed presentation. This is bounded mockup evidence, not an original-resolution production export.

## Integrated engineering

Commits through 012b782 provide metadata removal before native photo upload, honest Buddy language when all optional facts are skipped, word-free blanket handling, current core product handles, a guarded native mug template and a guarded native portrait template. Mug color and portrait framing choices share the existing artwork request identity; altered style, facts or photo invalidates it. Exact visible note/signature comparison is required before native ordering. New purchase flags remain off pending real-page acceptance.

Root verification: 95 focused source/minified integration tests pass; all six browser assets minify; Theme Check reports zero offenses; 26 local pages render. Earlier metadata normalization verification includes a real Chromium pixel/dimension comparison. These results do not establish vendor handler ordering, full live purchase flow or hosted checkout thumbnails.

### Later same-day deployment and actual-page readback

The integrated launch branch now includes ce0f135. Guarded workflow40465315950 succeeded against the unpublished launch theme. Independent Admin readback still reports UNPUBLISHED; the deployed hs2.js checksum is81388231fe4099c4212f5ec41fd76a57 and hs-schema.liquid is351dab272599f099acb3399cf8063773, matching committed bytes. The structured data now lists the three current core products, takes prices from Shopify variants, and does not assert a zero shipping rate. Three actual Liquid-to-JSON schema regressions pass.

Actual storefront checks were performed with the password restriction on and purchase flags off. Mug and portrait were temporarily Unlisted for those checks and restored to Draft afterward. The mug's selected color filters the gallery to its two correct views; note and accented signature survived a color change and reload. Its native label now reads Your note. The combined portrait's native product selector is now a dropdown because the prior radio interface could display two checked formats. Framed to unframed to framed changes USD119 to USD59 to USD119 with exactly one selected format while retaining the photo, dog name, note and signature. The portrait guard now checks its actual visible artwork signature, rather than expecting the mug's separate signature input. Original and adjacent guard tests pass, including actual Chromium DOM fixtures. Stale artwork remains blocked rather than being silently accepted.

The blanket gallery includes the approved labelled word-free example and excludes the exact technical placement image. Mobile checks found no horizontal overflow. These checks do not qualify new image compositions or prove a completed order.

Three published gift-article bodies were corrected for current prices, Buddy, the word-free blanket and the ornament hold; exact independent readback passed. The adjacent-content review also corrected two stale summaries, scoped signature advice to mug/portrait, clarified the blanket bullet, and replaced an obsolete specific fallback-message promise. All final bodies and summaries match independent API readback. The home meta description was corrected. The privacy notice's old AI paragraph was replaced with the verified text-provider and selected-answer disclosure, plus Teeinblue/OpenAI photo processing; its date is27October2026. The rest of the policy was preserved. The connector lacked write_legal_policies, so the existing authenticated Shopify editor was used, followed by exact API and storefront readback.

Supplier access is resolved through Shopify's existing Printful app sign-in. Fresh readback confirms the connected Heartside store, USA selling region and USD billing. Shopify's paid-order setting does not automatically fulfill line items. Printful has manual imported-order confirmation and personalized-order drafts selected. Teeinblue's connected Printful auto-confirm checkbox is off. These are current configuration proofs, not an order-import or supplier-render proof.

The existing quote-only supplier draft was reopened for a refreshed single-blanket calculation at USD129 retail. Printful automatically saved the removal of the old mug quote line and the blanket retail-price entry; this is an edit to the old quote draft, not a new submitted order. The approved New York destination shows fulfillment USD35.76, shipping USD13.99, surcharge USD0.40 and tax USD4.45, total USD54.60, with an estimated November2–3 delivery window. No confirmation/payment was clicked. This qualifies one account-specific destination estimate; it does not certify every US region, eventual invoice or promised delivery date.

The owner has been asked for one isolated fee-free compatibility test using existing artwork, with no generation, real payment, subscription or supplier release. Approval is pending; no test product, gateway switch or order has been created for that proposal.

## Unresolved launch conditions

1. Actual per-customer checkout thumbnail. Teeinblue's documented checkout extension requires Plus; the current Basic storefront needs a different verified integration. A separate product per customization is a documented third-party mechanism, but preservation of this Teeinblue campaign/customization and fulfillment chain is unproven. Shared catalog image replacement is excluded.
2. Complete personalized cart and hosted-checkout acceptance of the newly integrated native templates. Actual format switching, visible copy, retained state, gallery filtering and stale-art blocking now pass the bounded checks above. The mug's new landscape artwork still needs actual visual acceptance.
3. Cost coverage. USD45/59/119/129 is the current configured baseline. The independent research provides cost ceilings and dated Brooklyn quotes, not a certified nationwide 30% all-cost net margin. Current shipping includes Alaska, Hawaii, territories and military regions; those routes need qualification or an explicit restriction. Printful business access is now resolved; exact account-specific destination quotes remain to be established.
4. Remaining AI route qualification and original-to-production source evidence. Existing accepted outputs and preview sizes do not prove every enabled style, tone, dog appearance or physical product. No new generations were used to imply that coverage.
5. Supplier holds must remain in force; latest actual provider-hold proof is now dated October27. Exact order import/render still requires a controlled proof. Physical sample quality follows the owner's real order and delivery.

Private target IDs, customer artwork, checkout/address data, supplier readbacks and diagnostic SVG remain in the existing scratch receipts. This document contains no customer-specific artwork or recipient details.
