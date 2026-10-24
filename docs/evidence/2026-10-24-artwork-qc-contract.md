# Six styles: review contract and edge-case coverage

October 24, 2026. Status: six candidate specifications fixed for comparison; zero new generated outputs reviewed. This is E2/E3 test evidence and specification, not another execution queue. `01-EXECUTION-QUEUE.md` remains the only checklist.

## Decision boundary

The six media remain Cinematic, Painterly, Vintage screenprint, Comic book, Cut-paper collage and Fine ink drawing. Their exact grammars and rejection rules live in `tools/print-art/recipes-v1.json`. A color-filter variant cannot pass as a distinct medium. The six initial warm-tone portrait cases, source and explicit synthetic facts are unchanged from the approved screen packet.

Krish approved the USD 5 ceiling conditionally on closing the native billing boundary. No additional generation, retry, larger matrix or sample payment is authorized. The offline packet now records that approval rather than asking for it again. Historical estimate remains about $0.75 for six, not an exact quote or enforced cap. Native retries, request size and all-in attempt upper bound remain unresolved.

Tone routing resolved by Krish on October 24: copy only on mugs/portraits/ornaments; imagery only on word-free blanket/pillow. Text-product imagery uses fixed Warm staging. Style and dog identity never change with tone. Manual copy remains user-owned until an explicit rewrite. The six Warm portrait cases and $5 limit stay the same; the prompt revision implements this later ruling.

## Initial screen: evidence required per output

Compare each real output beside the exact source, then compare all six together. Record the complete input fingerprint, output hash, provider receipt and reconciled cost. A named human records a dated finding for individual identity, unmirrored markings, anatomy, explicit facts, respected negation, no unauthorized city, no generated words and distinct medium. Each finding needs evidence, not a bare pass checkbox. Any critical failure rejects that output; missing evidence holds it.

`tools/print-art/review-six-style-screen.mjs` checks completeness of those records. It rejects stale fingerprints, duplicated outputs/cases, automated-only verdicts, missing source comparisons and unknown costs. It does not inspect images, authenticate receipts or certify likeness. Even a complete screen cannot set style qualification, production-source verification, sample readiness or ordering to true. `human-reviews-template.json` is emitted with the packet and contains no prefilled passes.

The existing `tools/qc/mug_qc.py` is for the old small-photo/three-line mug. Its rectangular-photo and text checks do not qualify the illustrated full wrap. It remains unchanged for existing orders. Do not apply its result to the new range; the new mug needs the flat/curved/production checks below before any upgraded fulfillment.

## Finite risk-based test set

These are test requirements, not completed tests or a claim to cover every possible dog/photo. Later chargeable evaluations need their own bounded approval; do not expand the six-image allowance.

| Case | Expected result | Evidence stage |
|---|---|---|
| Six distinct media, same dog/facts/tone | Recognizable same individual; clear medium difference without labels | Initial six-output human screen, not run |
| Asymmetric patches / one different ear | No mirrored or moved identity feature | Varied-dog image review; suitable source still missing |
| Dark coat / dark eyes | Face and coat boundaries survive low contrast | Varied-dog image review; suitable source still missing |
| Light coat / fine long or curly hair | Eyes, muzzle and hair structure survive simplification | Licensed sources available; image review not run |
| Short muzzle / mixed breed | Individual proportions retained, no generic breed substitution | Pug and filename-identified maltipoo available; not genetic verification |
| Closed/obscured eyes, cropped body or low-detail face | Preserve only visible features or request a better photo; never invent hidden anatomy | Source admission and image review |
| No facts | Recognizable warm portrait, no invented props or forced joke | Prompt/config guards exist; actual output untested |
| Negated fact | No tennis-ball chase for the frozen negative fact | In initial fixture; actual output untested |
| Contradictory/ambiguous facts, unspecified toy | No arbitrary choice of habit, toy type or costume | Additional factual controls, not run on provider |
| Instructions embedded in answers | Treat as quoted facts, not prompt authority | Local prompt boundary exists; actual provider obedience untested |
| Tone endpoints | Affection and humor remain fact-grounded; no grief or changed dog | Copy-only on text products, imagery-only on textiles; no paid cases yet |
| Manual note, long name, apostrophe/Unicode, overflow | Exact separate text; no silent rewrite, truncation or unreadable shrink | Copy ownership locally tested; final native print legibility untested |
| Missing/corrupt/unsupported/large photo | Useful error, no generation, no lost good preview | Upload guards exist; full native path still untested |
| Change photo/style/tone/city/product then return | Matching cached result only; stale art cannot be ordered | Local state regressions pass; paid provider path untested |
| Double click, slow response, timeout, reload and late reply | One deliberate request; uncertainty blocks retry; preserve inputs | Local request regressions pass; native retry/billing unverified |
| Portrait frame change | Same accepted scene across framed/unframed; correct crop and exact note | Production source and separate variant mapping required |
| Mug wrap | Prominent focal dog, readable short note, no poster crop; handle gap and both viewing faces | Flat source plus curved supplier preview; all five colors |
| Blanket repetitions | Every face same dog; words absent; soft edges and textile spacing | Private binding plus all-face and full-resolution checks |
| Ornament / pillow | Separate sides and hole clearance / true 16x16 seam allowance and insert | Conditional supplier qualification first |
| Preview versus production versus sample | Same approved artifact and variant; final material/print acceptance | Source linkage, unpaid integration, website mockups, then approved physical samples |

## Reference-photo inspection

Commercial-use authority is recorded in `assets/README.md`; no new image was acquired or uploaded. The following are direct visual observations this turn except the pug, inspected in the preceding screen preparation.

| Existing source | Useful coverage | Constraint |
|---|---|---|
| pug-autumn-leaves.jpg | Short muzzle, fawn coat, dark facial mask and folded ears | Mask is not a full dark-coat case |
| apricot-poodle-puppy.jpg | Light curly coat, clear eyes and front paws | Does not establish strong asymmetric patches |
| maltipoo-on-deck.jpg | Light longer hair, clear face; mixed-breed label in source record | Breed label is not genetic proof; body partly obscured |
| red-poodle-head-tilt.jpg | Red curly coat, head tilt | One eye partially obscured; useful fallback case, weaker baseline |
| golden-puppy-asleep.jpg | Low pose and obscured eyes | Poor primary likeness test; do not invent open-eye detail |
| hero-dachshund.png | Long muzzle, clear eyes and smooth coat | Tight body crop; cannot establish full-body markings |

Do not call this six-file inventory a complete six-dog edge-case set. Strong asymmetry and genuinely dark-coat coverage are missing. Replace weaker baseline references with suitable licensed/consented photos before the full qualification run. The painted golden cutout is excluded as a photographic identity source.

## Verification and remaining gate

Five new evidence-gate regressions and ten adjacent artwork-state regressions pass. Offline packet validation preserves six unique fingerprints and the stored native prompt hash. Running the gate on the current empty evidence returns six NOT_RUN cases, no qualified styles, no sample readiness and ordering false. These checks make missing QC visible; they do not create art or certify quality.

No browser edits, native configuration changes, generation, support send, order, payment or publication occurred in this checkpoint. The existing Monday support follow-up remains the sole follow-up. North Star check: holds; this work advances product acceptance, with no revenue claim.
