# Optional-city repair and deterministic text checks — 26 October 2026

## Repair deployed and verified in the unpublished runtime

The portrait bridge previously replaced an empty City with Somewhere quiet, and the native image prompt required a City substitution. The repair leaves City empty and projects the optional buyer place into the existing Personality JSON as place:null or {source:buyer,text:...}. This is a transport projection, not a new personality fact. Non-portrait products do not acquire a place. Clearing a city also clears stale native defaults. The image-request namespace changes to prevent old requests from certifying the revised transport.

The canonical native prompt no longer references City. A proposed template clears its City default and allows the evidence envelope enough space. Its prompt exactly matches the compiler. Teeinblue validated the proposed template with zero errors and zero warnings; proposed form preview has optional City and no warnings.

The paired change is deployed. Guarded workflow 40299189411 completed successfully for commit 1387432 on the existing unpublished review theme. Native version 3078046 validates with zero errors/warnings and a fresh readback matches the proposed templates exactly. The prior native snapshot (3067199) and theme workflow backup are retained for rollback. Portal-only City entry also does not construct this envelope; use the tested bridge for future generation. No image-generation behavior has been claimed as tested.

## Tests

18 source/minified integration regressions pass, including blank city, whitespace clearing, explicit São Paulo, deletion back to null, fact preservation and no place on blankets. Asset minification passes. Canonical/proposed native prompt parity passes. Git diff --check passes.

## Native layout renders using the already-saved Ink image

No upload effect or image generation was called. These are deterministic compositions from the existing derivative, not original-resolution production proofs.

- Maximum text: 14 W characters in the name, 44 W characters in the note. Text stays in its band; the note shrinks, so physical-size readability is not certified. Preview 6c32aa8d-1b48-4ad1-a44f-acb65a5ebd7c.
- Unicode: Zoë O’Malley; You’re my favourite place — café days & all. Accents, apostrophe, em dash and ampersand render, with populated signature and no clipping. Preview 727c43cc-eee8-4213-85db-31ce4066c472.
- Explicit empty name/note: no sample name or note reappears. Signature resolves to Love, with no name; required-name validation must prevent purchasing this state. Preview 778b0fa8-4bb3-4222-8e64-b0a514e48cc6.

## Actual runtime acceptance

- Blank city starts empty. Entering São Paulo produces `{"version":1,"facts":[],"place":{"source":"buyer","text":"São Paulo"}}` in the native Personality input, with City equal to São Paulo.
- Clearing returns native City to an empty string and `place` to null. After reload the same blank/null state persists, and the UI says No city selected.
- Unicode name and note were transported exactly and persisted after reload. Original review copy was restored afterwards; city intentionally remains blank.
- Desktop and mobile previews show the reference-artwork label. Generation and ordering controls remain disabled. Both theme and product are Draft; editor Save is disabled.
- Shopify draft description was stale. A description-only native sync corrected it; independent Shopify readback confirms the corrected copy and DRAFT status. Images, three variants, SKUs and prices remain unchanged. No image regeneration was requested.
- Native selected frame variants map to the same Shopify SKU suffixes for Black, Red Oak and White; all are 12x18. Exact account mappings are retained in private operations. This is mapping evidence, not current supplier-stock certification.
- Screenshot: private workspace outputs/optional-city-deployed.png. The portal tab was stale and had no retained generated upload; it was not used to regenerate art.

## Support evidence and remaining qualification

Teeinblue replied on 26 October at 03:53 UTC: a lower-resolution storefront preview is derived from a generated high-resolution image, and Generate test design represents the final order design. Their public Design Testing article describes a high-resolution test render without placing an order: https://support.teeinblue.com/en/article/design-testing-beta-vwoyej/ . This is provider explanation, not artifact-specific original-resolution verification.

The same thread already contains a follow-up asking for original export/dimensions, upscaling, whether test rendering/refresh can trigger generation, direct-provider failure billing, and a supported private draft binding. No duplicate follow-up was sent. Current Painterly/Ink original export and exact production-source linkage remain unresolved. The old verified production PNGs remain historical proofs. Native Line 4 remains an internal-looking field label beneath the Your note navigator; preserve its bridge dependency until a coordinated label change is tested.

No AI generation, upload, order, payment or live publication occurred. Billing remains deferred. Continue independent non-AI product qualification; source-dependent production acceptance and private blanket/mug binding still await the specific evidence above.
