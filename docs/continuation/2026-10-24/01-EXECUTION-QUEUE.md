# One ordered execution queue

Use this as the only revamp checklist. Preserve scope in START-HERE. On each completed step attach source/time or test evidence and update the repository's NOW.md with one next action. Do not turn blocked work into a new parallel roadmap.

## E0. Establish the checkpoint

- [x] Owner approved the range and required at least 50% net margin on October 24.
- [x] Clean continuation corpus prepared; no live mutation in handoff preparation.
- [x] New session verifies branch, working tree, latest commit, connected account identity and draft/live targets.
- [x] Inventory the in-app browser and retain only critical tabs, never more than five. Do not touch unrelated Chrome tabs.
- [x] Read actual current service capabilities once. Prefer native MCPs; use the in-app browser for unsupported operations.

Evidence (2026-10-24): `../../evidence/2026-10-24-economics-calibration.md`, E0 target checks; four critical in-app tabs, draft editor preserved.

Pass: the agent can name the exact working checkout, unpublished theme, artwork/campaign targets and outstanding blockers without guessing or creating replacements.

## E1. Calibrate economics and qualify the range

- [x] Current owner direction: defer labor calibration for now and calculate delivered supplier cost plus margin. `tools/economics/cost_price.py` reconciles all 13 recorded quotes and produces provisional prices at a 50% supplier-cost margin. This does not certify net margin or authorize live prices. No further labor question is pending.

- [ ] Read actual processing fees, Teeinblue fees/subscription, supplier base cost, shipping by exact variant/US destination, taxes charged to Heartside and any exemptions.
- [ ] Deferred for current cost-based planning: complete the monthly all-business-cost allocation. Include fixed costs once and preserve unknowns rather than setting them to zero.
- [ ] Deferred net-margin certification: reconcile every variant/basket against the complete cost model in 02-ECONOMICS. The current cost-based view is a provisional planning output.
- [ ] For the ornament, qualify the exact US Printify configuration, separate front/back, packaging, provider and route into Teeinblue. Verify both-side charges and full delivery cost. Do not install a paid plan or silently switch providers.
- [ ] Confirm stock/availability and US fulfillment/delivery route for each selected base. Imported available=true is provisional.
- [ ] Establish current 2026 route-specific holiday cutoffs and a customer-artwork/QC buffer. No promised Christmas date without evidence.

Checkpoint (2026-10-24): account processing/app fees and US seasonal surcharge verified; business account access resolved, Shopify/Teeinblue connections and manual gates preserved. Catalog, US shipping tables and stock readbacks recorded. Recipient resolved from the existing matching Shopify order. Eleven independent unpaid Brooklyn quotes recorded: each of five mug colors $16.55, unframed portrait $18.52, each of three frame colors $47.98, blanket $54.60, and both-sided pillow $28.18, including supplier tax. Saved quotes differ from several catalog/editor bases; route parity remains unverified. Both proposed baskets are independently quoted: mug + black frame $64.09 and mug + sherpa $70.71, including one surcharge and supplier tax. Wider destinations and integration route parity remain unverified. Offline net-cost model has 13 passing regressions; all 70 actual-input price cases remain blocked on named operating costs, customer sales-tax treatment, FX/allocation and accounting boundary. Owner confirmed the accounting boundary before personal income tax; business-level profit-tax treatment remains unverified. Evidence: `../../evidence/2026-10-24-economics-calibration.md`.

Pass: each core SKU has a quoted delivered cost and a price with a defensible 50% net model, or is explicitly blocked on a named input. If a viable price does not sell or a supplier cannot qualify, present the exact cost/design/scope trade-off to Krish; do not quietly lower the margin target. Do not change catalog prices live merely to finish a spreadsheet.

## E2. Finish the common artwork and tone foundation

- [ ] Maintain one profile: original photo identity/hash, explicit personality facts, optional city, style, tone, exact edited copy and prompt/layout versions.
- [ ] Implement shared three-stop tone and six substantially distinct style candidates, preserving the approved portrait and blanket direction.
- [ ] Keep personality metadata invisible to the buyer. No JSON fields or multiple prefilled copy inputs in customer UI.
- [ ] Bind each generated result to the complete input version and format. Invalidate stale results on relevant changes. Preserve the last valid preview separately from the currently requested result.
- [ ] Use one deliberate generation/update action. No generation while dragging, duplicate click charges, timeout auto-retries or refresh-triggered charges. Verify provider behavior rather than assuming the client guard prevents all charges.
- [ ] Verify manual copy edits have explicit ownership: changing tone offers a rewrite or preserves the edit; it never silently overwrites it.
- [ ] Resolve original source resolution and final production source through Teeinblue support or a supported export. An enlarged canvas does not pass.

Checkpoint (2026-10-24): local versioned six-style/three-tone recipes and preparation/state contract added under `tools/print-art/`; consumes the existing facts profile. Ten tests pass across 90 prepared style/tone/format configurations, plus the existing facts regression. Not storefront-wired, not image-qualified, no paid run. Exact input keys, stale/late results, manual copy preservation, duplicate requests and uncertain-response reconciliation are tested locally. See `tools/print-art/ARTWORK-SYSTEM.md`. No E2 acceptance box is checked from these tests alone. Follow-on inspection found the existing hs3 tone-change handler still invokes compose on slider release; explicit-update integration and actual duplicate/reload/late-response checks remain the next local repair.

Pass: six varied reference dogs across six styles and three tone stops are evaluated for identity and grounded personality. This is up to 108 art cases, staged in a small initial screen then a full qualification matrix only for viable styles, with an explicit spend budget. Reuse accepted source art across format adaptations where appropriate, not 108 fresh calls by default. A failed style remains unavailable until repaired; do not substitute a different style silently.

Subsequent E2 local repair checkpoint: hs3 now keeps tone selection separate from an explicit Update note action. Pending copy requests persist before dispatch; reload/uncertainty pauses new dispatches; late replies only apply to matching input; manual edits stay authoritative. 26 source/minified tests and existing adjacent checks pass. Codex IAB checks at 390x844 and 1280x900 verify no request from selection, one from a double-click, edit/reload preservation and stale-result cache reuse. A keyboard-focus regression was repaired and retested. No deployment or provider request occurred. Full image/style integration and provider billing remain unverified; see `../../evidence/2026-10-24-explicit-tone-update.md`. This is copy-control progress, not E2 completion.

## E3. Complete selected products

Six-style test preparation checkpoint (2026-10-24): six exact expected native prompts, licensed reference hash, pixel-identical metadata-free upload and empty results template prepared offline. Fixed Warm tone and explicit synthetic personality fixture; no real-dog habits invented. Sunburst/High and the native portrait prompt read back. Corrected global-option tool keys pass all 18 style/tone form configurations with empty photos; layer-only keys had silently retained defaults. 48 local regressions and packet/hash checks pass. Three historical requests show $0.37; about $0.75 for six is an extrapolation, not a quote. Proposed $5 all-in allowance remains unapproved and is not a verified provider cap. Exact request size, all-in attempt bound and retry reconciliation still block dispatch. No generation or production acceptance. See `../../evidence/2026-10-24-six-style-test-approval.md`; use `tools/print-art/six-style-test-v1.json` as the test specification, not a second execution queue.

E2/E3 integration checkpoint (2026-10-24): browser and Node share the six-style/three-tone contract; selectors persist across products and Buddy without requests. Actual photo normalization/hashes and copy ownership are implemented locally. Native options are saved/read back in existing portrait/blanket drafts and one new unbound full-wrap mug draft. Three native validations, 46 local tests, IAB selection/reload/hidden-field/zero-upload checks and Theme Check pass. No art generated, campaign published or theme deployed. Native substitution/source/cost remain gated; pillow 17x17 imported labels do not qualify the 16x16 pilot. See `../../evidence/2026-10-24-six-style-integration.md`. No E2/E3 acceptance box is checked from configuration tests.

Order within this stage: portrait pair, blanket, mug, ornament qualification/adaptation, bounded pillow prototype.

- [ ] Portrait: finish shared framed/unframed artwork; optional buyer-specified city; small exact handwritten note, dog signature and decorative paw; correct print sizes and safe areas.
- [ ] Blanket: word-free all-over actual-dog faces/poses with grounded motifs and soft irregular edges. Supported private Shopify connection required. Inspect every repeated face.
- [ ] Mug: independent wrap composition and readable short note. Verify outward/drinker views, handle placement and color/size mapping. Do not shrink the poster onto it.
- [ ] Ornament: qualified separate front/back base, large recognizable dog, small number of meaningful details, readable reverse note. Check hole/safe area and actual physical diameter. No automatic add-on discount.
- [ ] Pillow: one 16 x 16 pilot design adapted to seams and insert. Verify base fabric later in the final sample batch; do not call render approval fabric approval.
- [ ] Confirm source captions, listing descriptions, Shopify data and alt text match the new products, Buddy and actual supplier specifications.

Pass: native templates, print-area mappings and final files match selected variants and the creative requirements. Keep every unfinished product private and ordering disabled. Conditional ornament/pillow failures do not block independent core work, but must not be declared complete.

Unpublished integration checkpoint (2026-10-24): f80b37c deployed only to the unpublished copy. Backup/editor guards pass; nine files match bytes and mug JSON matches semantically. Actual portrait native fields receive six-style/three-tone selections; product remains Draft, public URL null. Choices persist mug -> private blanket -> portrait -> reload. Mug reference is prominent, old global editor isolated, ordering paused, Buddy alternate AI off. 48 tests and phone/desktop IAB checks pass. No image-generation action or paid/live action. Source quality, native production bindings and artwork acceptance remain gated. See `../../evidence/2026-10-24-unpublished-integration.md`. No production acceptance box is passed.

## E4. Prove the actual storefront integration

- [ ] Real customer path: Buddy answers -> photo -> style/tone -> artwork -> optional text edit -> product choice -> matching preview -> cart -> checkout. Use the unpublished environment until release is approved.
- [ ] Switch city, style, tone, photo and gift, including change-away/change-back; verify the resulting image belongs to the current choices.
- [ ] Test reload, back navigation, slow/failing generation, double click, empty/negated facts, long names/notes, invalid photo and interrupted session.
- [ ] Verify no preview/test image can become a purchased production file; line properties and order metadata identify the exact approved rendering and variant.
- [ ] Check mobile and desktop, keyboard/focus, errors, status messages, pricing, US-only checkout, shipping total, tax and total order economics.
- [ ] Run applicable repository regressions, then inspect the actual native provider handoff. Local fixtures alone cannot pass this stage.
- [ ] Verify Buddy across visible UI, accessibility labels, generated host copy and updated assets. Do not mass-rename compatible technical filenames or customers' dog names.

Pass: every selected product can be traced through to its exact intended production file without payment/fulfillment being triggered during unpaid tests. Paid-order proof remains a final sample-stage gate if the system requires payment.

## E5. Website mockups

- [ ] Only now create refreshed website mockups using accepted product art and exact supplier geometry/materials/colors.
- [ ] Show believable actual-dog results; no generated physical product that promises unverified fabric, print area, frame or packaging.
- [ ] Validate homepage/reveal/product/cart imagery and responsive crops. Remove incompatible customer-facing visuals within approved draft work.
- [ ] Run the existing reveal mockup gate if changing the reveal; inspect source/print/render comparisons.

Pass: every visible mockup corresponds to a qualified product configuration, and the simpler user journey works with it. Do not start acquisition videos in this stage.

## E6. Physical sample batch, last

- [ ] Verify all preceding applicable gates. Prepare exact products, final art files, recipient name/address, US route and itemized total.
- [ ] Ask for exact payment approval at the final checkout, using a reused visible action tab. Address alone is not order approval; recipient name remains to be established from authorized saved data or Krish.
- [ ] Order only approved samples; follow the real Shopify -> Teeinblue -> supplier route and verify the resulting production file and fulfillment state.
- [ ] Inspect received samples: dog likeness, markings, text, original detail, crop, fabric/color/feel, washing/care where feasible, packaging and actual delivery time.
- [ ] Reconcile actual fees, elapsed review time, AI costs and shipping with the net model. Failed samples require repair and explicit re-order approval.

Pass: physical quality and operational handoff are accepted. This is the final test stage, not a reason to call the product ready before the package arrives.

## E7. Controlled release and measurement

- [ ] Prepare exact reviewed code/artwork/catalog/price changes, backup and rollback. Request any remaining exact live approvals once the change is concrete.
- [ ] Deploy live theme only from the approved main revision, verify live output and ensure intended products alone become purchasable.
- [ ] Publish only supported delivery claims. Preserve per-order human print review until explicitly changed.
- [ ] Measure completed orders, actual net margin, refunds/remakes and recipient feedback. Recalculate at 20 fulfilled orders and monthly thereafter, and immediately after a material cost change.
- [ ] Sync growth-heartside to the accepted product canon before any new product claims or ad assets. Acquisition content follows product acceptance, not this handoff.

Pass: real revenue and actual costs substantiate the 50% target. Forecasts never count as realized net margin.
