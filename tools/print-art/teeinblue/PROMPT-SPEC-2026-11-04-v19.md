# Painter prompt spec v19: face-locked tones, photo first (4 and 5 November 2026)

Recipe version `actual-dog-recipes-v19-face-locked-tones`, recipes SHA-256 `8df665f082a020dd81002190a34063241b621deb432f3ff56a8bdc42b98de4b4`. It follows v18 (`PROMPT-SPEC-2026-11-04-v18.md`).

Status: theme-only. It ships with the next theme push. Nothing changes in Teeinblue.

## Why

Krish's real purchase on 4 November was Roast. His mug showed a different-looking dog, a bone in its mouth, side-eyeing the camera: "The AI generation has failed massively and regressed hugely since the last change." Replaying the painter's fields for his answers on v17 and v18 shows that v18 changed Roast and nothing else. Sentimental, Warm and Hilarious are byte for byte v17. Roast grew from 729 to 959 characters of caricature: "openly judging his person", "a dramatic, exaggerated side-eye down the lens, one brow raised, smug". Asking the painter to rebuild the face into an expression fights the identity line, and the identity loses.

Krish, 5 November: "Surely there's a solution here without making the dog look arrogant or completely different, or grumpy or mean." The tones must still change the picture.

## What changed

1. **The face is locked to the photo** (`brief.likeness.energy`, the Energy field): the same head shape, ear set, eye color and spacing, muzzle, nose, coat colors and every marking, never mirrored and never exaggerated. Only the body, the setting, the light and the medium change. The breed "character" line no longer travels in Energy on this path, because it pushed expressions.
2. **Each tone changes everything around the face** (`brief.likeness.tones`), through the staging, the body, the camera, the light and the color:
   - **Sentimental:** resting close, soft window light.
   - **Warm:** a candid moment in daylight.
   - **Hilarious:** sitting bolt upright and dignified, as if for an official portrait, played straight.
   - **Roast:** the dog has taken over the whole couch, every cushion claimed, perfectly content.

   Each direction ends with a guard: "The face stays exactly the dog in the photo, with its own calm, natural expression: never grumpy, mean, smug or exaggerated." The blanket keeps its scattered figures, each with the face of the photo, in the tone's moment and light.
3. **Photo first.** The journey asks for the photo, the style and the tone, then the gifts, and paints before any other answer. Nothing from the later answers (the spot, the walk, the toy) stages the picture; those answers shape the note.
4. **Teeinblue's three-value tone select** receives Warm with a wink for Roast, its nearest true value, instead of Hilarious (`hs2.js` `answer`).

Every older path (`likeness` absent) is byte for byte v18.

## Field limits

Across every style, tone and format, Tone direction is at most 709 of the field's 1,200 characters, and Energy is 245 of 300.

The four saved blocks, byte for byte as before:
- mug `aa41590e9e59effb331bbea91d4064a1eb5c3eb7c6bfa47f595a7144041194c6` (v16);
- portrait `dddbf245f588aea4487a9da1dc4c0da6dafa5ce5d2d98c634a4d71ab8b39f6cd`;
- blanket `b6aa708e8737f483362f99d8433b50dd4282e480a11df5f882e20f453a5d0108`;
- card `1868aab7a1bf48770259028da9c443ada62311ae4cb0b0c004af5d34bfebacbd`.

The saved blocks still say "Change everything else: never reuse the photo's pose, angle, light or background." That line lives in Teeinblue, not the theme. The face lock says what "everything else" excludes.

## Verified

Through Teeinblue's own painter on the live store, not another model: `docs/evidence/2026-11-04-photo-first-journey.md`.
