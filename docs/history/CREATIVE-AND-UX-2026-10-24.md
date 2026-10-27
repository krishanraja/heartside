# Creative system and customer experience

The customer's dog is the protagonist. Buddy is the host. The gift note speaks as the dog to the recipient. One shared profile drives the range, with format-specific composition.

## Approved visual anchors

- Portrait: `design/print-v4/city-screenprint-approved-target.png`. City scene, recognizable dog, small handwritten note, dog signature and decorative paw in the bottom right. The paw may be an illustration appropriate to the design, never a claimed actual paw impression or scientifically exact breed print.
- Blanket: `design/blanket/approved-direction-v2.png`. Word-free, playful all-over dog/personality motifs with softened or irregular edges. No rectangular poster panel or mandatory note.
- Candidate style set: `design/range-system-2026-10-24/six-styles-comparison-v1.png`. Six different media, not six color filters. This board is illustrative, unapproved for production and based on one test dog. Its props are test facts, not facts to inject into customers' art.

The portable pack copies these as `references/portrait-approved.png`, `blanket-approved.png` and `styles-candidates-not-approved.png`. Their manifest hashes establish byte identity. Visual approvals do not establish print resolution or finished material quality.

## Six style specifications to qualify

| Style | Visual grammar | Identity risk to reject |
|---|---|---|
| Cinematic | Natural proportions, composed light, photographic scene depth, restrained palette | Generic photorealistic breed substitution or invented hidden markings |
| Painterly | Visible brush texture, soft color transitions and deliberate painted shapes | Blur erasing eye shape, muzzle or distinctive coat patches |
| Vintage screenprint | Limited colors, bold silhouettes, intentional paper/ink texture | Simplification merging or moving identifying markings |
| Comic book | Strong linework, energetic panels or staging, expressive but recognizable dog | Caricature changing skull, ears, eyes or body; unrequested words/speech bubbles |
| Cut-paper collage | Layered shapes, material texture and controlled negative space | Abstract silhouette resembling only the breed; missing asymmetry |
| Fine ink drawing | Precise contour, hatching, selective wash and calm composition | Loss of coat pattern, overly faint lines or tiny details that disappear in print |

Build these as versioned, reusable production recipes with identity constraints, factual inputs, negative constraints and per-format layout rules. Do not treat these prose descriptions as already tested prompts. Qualify the full selected set; if a style fails, repair or report it explicitly instead of calling five or six styles done without proof.

## Tone is shared, but its expression fits the object

| Stop | Copy | Artwork |
|---|---|---|
| Sentimental | Specific affection grounded in the relationship | Calm companionship, tenderness, familiar place or supported object |
| Warm with a wink | Affection with one recognizable observation | Light visual joke using a real habit |
| Hilarious | Stronger dog-perspective comic premise, still affectionate | Exaggerated situation grounded in the habit, never a different dog or an invented habit |

Owner ruling, October 24: the shared slider changes **copy only on mugs, portraits and ornaments**, and **imagery only on word-free blankets and pillows**. Text-product imagery retains the fixed Warm staging direction when copy tone changes; no image regeneration is needed for tone or exact-copy edits. It does not change art medium or identity. Keep the full product key (including exact copy) separate from the image key, so reusing imagery never attests the current text layout. Mere slider motion does not generate or charge. Let the buyer commit a change once and show honest progress. No automatic retry after an uncertain billable response.

## Shared input and render contract

Conceptual fields, to be mapped to the repository's actual schema rather than creating a competing one:

- Source photo reference and hash, metadata removed from provider upload.
- Dog name, optional breed for copy context only, observed identity features from the reference.
- Explicit personality facts with provenance to the relevant Buddy answers; preserve negation and uncertainty.
- Optional buyer-supplied city/place. Never derive it from shipping address.
- Style identifier/version, three-stop tone, prompt revision, product variant and layout revision.
- Exact note/signature text, and whether it was user-edited or generated.
- Request identifier, status, provider receipt/cost where available, original image dimensions, accepted preview, production artifact hash and source linkage.

A hash is traceability, not proof of likeness or provider obedience. Verify both.

## Per-product rules

Portrait pair: same accepted dog/scene across framing choice. Keep exact text outside image generation, rendered in a deterministic layer. Preserve small note hierarchy and safe margins. No spelling entrusted to generated image pixels.

Blanket: repeated faces/poses must all match the actual dog. Portrait-only treatment when the reference does not establish body markings. Props from facts only. Soft edges and textile-safe spacing, no words. Large supplier canvas is not evidence of original detail.

Mug: wrap composition with one clear focal dog and readable note. Inspect curved preview and flat source, handle gap, outward/drinker faces and color contrast. Adapt each style to the short landscape print area.

Ornament: separate front/back supplier mapping must exist. Front favors one recognizable dog and limited detail; reverse holds a brief exact note if legible at real size. Keep faces/type away from hole and edge. Reject long unbroken names/words that auto-shrink into illegibility. Never claim a one-artwork base has independent sides.

Pillow: square composition, safe seams, actual insert and fabric. Use the same identity/style/tone with its own layout. Fabric acceptance waits for final samples.

## UX sequence

Buddy conversation -> one photo -> recommended preview -> optional Explore styles and tone adjustment -> choose gift/format -> review exact personalized item -> cart/checkout. City appears once when relevant and remains optional. No visible technical fields, JSON, prompt text or multi-box note editor.

Keep one primary next action per screen. Preserve inputs on back/reload/error. Retain the last good preview but clearly distinguish it from a pending/stale result. A stale image cannot enable purchase. Switching products carries the same style/tone without silently using another style to fill an unsupported combination.

Give the buyer a clear rejection/retry path when likeness is wrong. A customer approval checkbox does not absolve the system of visibly wrong identity. Do not collect extra photos routinely; request a better photo only when the supplied one cannot establish identity.

## Acceptance set

Six varied consented or licensed reference dogs, including asymmetric markings, dark coat, light coat, long hair, short muzzle and mixed breed. Add no-facts and negated-fact cases. Record per output: source, settings, model/prompt version, source pixels, output hash, owner/human identity verdict, factual-prop verdict and print-size readability.

Critical failures: wrong individual dog, flipped/missing identifying markings, impossible anatomy, invented habit, unauthorized city, generated misspelled note, stale file ordered or preview disconnected from production source. Any critical failure blocks that output. Repeated style failure blocks that style until fixed.

Quality judgments require side-by-side visual inspection and owner input where necessary. Automated image checks or fresh-model judges may screen issues, but cannot alone certify actual-dog likeness. Prepare a bounded paid evaluation budget before any new chargeable run. Website mockups and acquisition creative are later stages.
