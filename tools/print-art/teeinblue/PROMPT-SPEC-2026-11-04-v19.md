# Painter prompt spec v19: likeness first, photo first (4 November 2026)

Recipe version `actual-dog-recipes-v19-likeness`, recipes SHA-256 `8cb5e64ad3854fa9aa53a87e51a0b5ccab142179d09ea27c656c6bebbb978f51`. It follows v18 (`PROMPT-SPEC-2026-11-04-v18.md`).

Status: theme-only. It ships with the next theme push. Nothing changes in Teeinblue.

## Why

Krish ran a real purchase on 4 November and said: "The AI generation has failed massively and regressed hugely since the last change." The mug's painting "does not even look like the asset that was produced in the previous paint or the one that was produced in the first paint." Asked what matters most, he chose: the painting looks like his dog, it matches the style he picked, and it invents less scene. In his words: "Each gift should look like that same exact dog. Even if the design is per gift." He also chose photo first: everything else is asked while the painting runs.

## What changed

1. **A likeness direction** (`brief.likeness`). When the journey sends the photo before any other answer exists (`briefFields({likeness: true})`), the Tone direction asks for a true likeness of the exact dog in the photo: the same face shape, ears, eyes, muzzle, coat colors and markings, the dog's own relaxed expression, both eyes open. It keeps whatever the dog wears in the photo, a simple setting softly out of focus, an eye-level camera close enough that the face is large and clear, soft natural light, and no toy, clothing or prop that is not in the photo. The mug and the portrait keep the format's fill line. The blanket stays a scattered pattern of whole figures, each figure a likeness of the photo, with no setting or props.
2. **The tone no longer stages the painting in the journey.** The buyer picks the tone after the painting has started, so in the journey the tone shapes the note only. Scenes from the answers (the couch, the walk, the bone in the mouth, the side-eye) are no longer painted there. Every older path (`likeness` absent) is byte for byte v18, including Roast.

## Field limits

Across every style and format, the likeness Tone direction is at most 552 of the field's 1,200 characters, and Energy at most 111 of 300.

The four saved blocks, byte for byte as before:
- mug `aa41590e9e59effb331bbea91d4064a1eb5c3eb7c6bfa47f595a7144041194c6` (v16);
- portrait `dddbf245f588aea4487a9da1dc4c0da6dafa5ce5d2d98c634a4d71ab8b39f6cd`;
- blanket `b6aa708e8737f483362f99d8433b50dd4282e480a11df5f882e20f453a5d0108`;
- card `1868aab7a1bf48770259028da9c443ada62311ae4cb0b0c004af5d34bfebacbd`.

The saved blocks still say "Change everything else: never reuse the photo's pose, angle, light or background." That line lives in Teeinblue, not the theme. The likeness direction works inside it: a new pose and setting, the same dog.

## Verified

The journey's real paintings run through Teeinblue on the store, not through another model; the record is in `docs/evidence/2026-11-04-photo-first-journey.md`.
