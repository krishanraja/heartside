# Painter prompt spec v17: the artwork-only portrait (31 October 2026)

Recipe version `actual-dog-recipes-v17-artwork-only-portrait`, recipes SHA-256 `cb258ed973619892523410b4528ba060f9e12fba8eac12c549a8a5bc0bd0a41a`. It follows v16 (`PROMPT-SPEC-2026-10-31-v16.md`).

Status: the theme change ships with the next theme push. The Teeinblue side, the portrait artwork's layout, is `docs/review/COWORK-PORTRAIT-ARTWORK-ONLY.md`.

## Why

Ruling (Krish, 2026-10-31): the portrait is artwork only, option A. The painting fills the whole 12 × 18 print, and the cream note strip, the paw, the note, the signature and the dog's name come off the artwork.

## What changed

1. **No note area on the portrait.** The portrait's Tone direction ends with the fill line, as the mug, the card and an artwork-only gift do: "The painting fills the whole frame, with no empty area kept for text." It no longer says "The lower-right quarter is a calm, low-detail continuation of the scene …, where a small note will be added later".
2. **The saved portrait block in Teeinblue does not change.** It never named the note area. It already asks for a vertical 2:3 picture, the print's own shape, so the painting fills the whole print once the artwork's photo layer does.

The four saved blocks, byte for byte as before:
- mug `aa41590e9e59effb331bbea91d4064a1eb5c3eb7c6bfa47f595a7144041194c6` (v16);
- portrait `dddbf245f588aea4487a9da1dc4c0da6dafa5ce5d2d98c634a4d71ab8b39f6cd`;
- blanket `b6aa708e8737f483362f99d8433b50dd4282e480a11df5f882e20f453a5d0108`;
- card `1868aab7a1bf48770259028da9c443ada62311ae4cb0b0c004af5d34bfebacbd`.
