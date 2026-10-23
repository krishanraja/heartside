# Personality blanket v2, October 23, 2026

## Approved direction

Krish rejected the rectangular screenprint adaptation: "the blanket needs more faded or rough edges ... it looks way too much like a poster" and proposed the dog's face all over the blanket, visual representations of personality, and no words.

After viewing `design/blanket/approved-direction-v2.png`, Krish said: "Yes, this is much better. Use this direction and keep going with the artwork system. Make sure it actually looks like their dog and reflects their personality. Sample order last."

The approved image is a generated concept using an example pug and illustrative habits, not a customer's likeness proof, supplier mockup, production image or live offer. Its folds and backing are presentation only and must never be printed into the artwork.

## Implemented in an isolated native draft

- New isolated Teeinblue personality-pattern artwork. The prior screenprint blanket draft remains intact for history and rollback. Account-specific identifiers and full readbacks are retained privately, outside this public repository.
- Full 5300 x 6300 image layer, no rectangular inset, note, signature or printed text layers. The dog name and personality fields are form-only metadata.
- Photo layer layer-292294 has no default image. It uses the already connected native image effect. No new generation was executed during configuration.
- Personality layer layer-388769 takes a bounded JSON fact list. Its empty default authorizes no habit props. Native schema validation and saved-form inspection pass with zero errors or warnings.
- `tools/print-art/blanket-prompt.txt` matches the saved image-effect prompt. It prioritizes individual muzzle, ears, eyes, coat texture and asymmetrical markings; prohibits mirrored markings, breed-based substitutions and invented body markings; requests portraits only when the reference does not show the body.
- The generated output must be flat print art, with soft irregular edges around the motifs, not a photographed blanket. Portraits dominate. Props must be supported by explicit customer facts.
- Manifest: `tools/print-art/teeinblue/draft-personality-blanket.json`. An unpublished campaign now binds the artwork to its 15900 x 18900 supplier print area. Its only selected variant is the intended 50 x 60 inch tan blanket. The existing campaign placement was copied proportionally into a private technical mockup because the base library image had no print-area layer. Readback confirms one variant, one artwork placement and zero store instances. No Shopify product was published. The portal calls the campaign structurally valid; that is not likeness or production-quality acceptance. The inherited supplier description still describes the old worded blanket and must be replaced on the draft listing before publication.

## Customer data and storefront handoff

`hs-artwork-profile.js` derives facts from actual home, follow-up, resting-place and together-time answers. It does not derive habits from breed, names, recipient details, shipping, AI-written lines or the concept pug. Skipped and unknown answers supply no facts. A follow-up chip from another branch is ignored. Typed facts remain quoted data with negations intact; they are not keyword-matched into positive props. Overlong facts are omitted rather than silently cut mid-qualification. Empty facts mean faithful portraits with no invented habit props.

The Buddy chat exports this structure independently of the gift note. The opt-in `product.blanket-art-preview.json` route fills the native personality field and keeps it hidden from the buyer. Existing single-field editing remains in place. Legacy chat sessions can derive the facts from saved chat state without repeating the interview.

The request identity includes photo timestamp, product, blanket prompt revision and the full fact payload. Changed facts require another deliberate request. The shared latest-request correction also prevents the print route from labeling a later city's image as an earlier city when the customer switches back. Reload does not resubmit an uncertain generation. Provider buttons and native form submission are blocked in acceptance previews.

## Checks and their limits

- Artwork schema and saved native form: pass, zero findings.
- Local fact extraction: pass for empty input, breed/note exclusions, stale branch answers, negations, bounded input and privacy exclusions.
- Browser provider fixture: pass for hidden JSON, facts present before upload, deliberate creation, no ten-second retry, saved-image handling, changed-fact invalidation and order blocking. Mobile and desktop captures are in ignored preview output.
- Existing city bridge, mug bridge and gift form regressions: pass. Minification and theme checks pass.
- These checks establish mechanics, not model obedience, generated likeness, print detail, actual supplier output or a paid order.

## Required image acceptance before release

1. Run the same native route with five consented reference dogs spanning distinct coat patterns, ear shapes and face proportions, including asymmetrical markings. Preserve source-photo identity; use private evidence storage only.
2. Compare the source and every repeated portrait for muzzle proportions, ears, eye color, coat texture and distinguishing patches. A generic breed match is a failure. No automatic likeness certificate from a passing API response.
3. Trace every habit prop to an explicit source answer. Include a negated preference and a no-facts case; neither may acquire the concept's socks, snacks or tennis balls. Reject ignored negations or instructions embedded in answers.
4. Verify the customer can inspect and reject a mismatch without buying it. Any regeneration must be deliberate, bounded and separately priced in the margin calculation.
5. Confirm original source dimensions and the exact production source with Teeinblue. The supplier canvas is 15900 x 18900; scaling the artwork 3x is not new image detail. Support follow-up is scheduled for Monday, October 26, 9 AM London.
6. Draft campaign placement is verified. Complete the actual Shopify handoff and replace the inherited old-product draft description; check US availability, shipping and margin again at release. Upgrade the remaining products, then website mockups, then obtain approval for the physical sample order last.

## Scope and rollback

No live theme release, live blanket artwork replacement, paid generation, sample order or fulfillment occurred. The new isolated artwork can remain unused. The later private theme deployment and Shopify connection incident are recorded in `2026-10-23-private-blanket-connection.md`; that record supersedes the earlier statement that the template existed only locally.

Private campaign screenshot and supplier readback were retained outside the public repository. Supplier readback on October 23: the selected variant is available, base cost 35.76 USD, retail 89 USD. This excludes shipping, fees, generation and remakes and is not delivered margin.
