# Optional-city repair and deterministic text checks — 26 October 2026

## Repair prepared and verified locally

The portrait bridge previously replaced an empty City with Somewhere quiet, and the native image prompt required a City substitution. The repair leaves City empty and projects the optional buyer place into the existing Personality JSON as place:null or {source:buyer,text:...}. This is a transport projection, not a new personality fact. Non-portrait products do not acquire a place. Clearing a city also clears stale native defaults. The image-request namespace changes to prevent old requests from certifying the revised transport.

The canonical native prompt no longer references City. A proposed template clears its City default and allows the evidence envelope enough space. Its prompt exactly matches the compiler. Teeinblue validated the proposed template with zero errors and zero warnings; proposed form preview has optional City and no warnings.

The stored native artwork and unpublished Shopify theme have NOT yet been updated with this pair. They must move together: the previous storefront does not put place in the evidence envelope. Portal-only City entry also does not construct this envelope; use the tested bridge for future generation. No image-generation behavior has been claimed as tested.

## Tests

18 source/minified integration regressions pass, including blank city, whitespace clearing, explicit São Paulo, deletion back to null, fact preservation and no place on blankets. Asset minification passes. Canonical/proposed native prompt parity passes. Git diff --check passes.

## Native layout renders using the already-saved Ink image

No upload effect or image generation was called. These are deterministic compositions from the existing derivative, not original-resolution production proofs.

- Maximum text: 14 W characters in the name, 44 W characters in the note. Text stays in its band; the note shrinks, so physical-size readability is not certified. Preview 6c32aa8d-1b48-4ad1-a44f-acb65a5ebd7c.
- Unicode: Zoë O’Malley; You’re my favourite place — café days & all. Accents, apostrophe, em dash and ampersand render, with populated signature and no clipping. Preview 727c43cc-eee8-4213-85db-31ce4066c472.
- Explicit empty name/note: no sample name or note reappears. Signature resolves to Love, with no name; required-name validation must prevent purchasing this state. Preview 778b0fa8-4bb3-4222-8e64-b0a514e48cc6.

## Next bounded action

Apply the reviewed paired native/preview-theme change, then exercise blank -> explicit city -> cleared city in the actual unpublished storefront without uploading a photo. Preserve current native version 3067199 and the previous unpublished theme assets for rollback. Live publishing and ordering remain off. Billing is deferred; no further image generation is authorized. Original generated-source lineage remains unresolved independently of this repair.
