---
card: share-card-2026-11-03
title: heartside.io social share card, 1200x630 and 1200x1200, built in code from approved example art
spend_id: 1f246f81-e0dd-4c95-9510-34f217a294fa
max_minutes: 30
max_calls: 30
write_allow: [tools/print-art/share_card.py, design/share-card-2026-11-03/share-1200x630.jpg, design/share-card-2026-11-03/share-1200x1200.jpg]
---
## Goal
Build `tools/print-art/share_card.py`, a Python 3 script (Pillow only) that renders Heartside's link preview card, the
picture people see when heartside.io is shared in a message or a post. The card replaces one that still advertises an
ornament (on hold) and a mug with words printed on it (the gifts are artwork only since 31 Oct). Krish approved the
homepage this card matches on 3 Nov 2026. The one point it must land: your dog, painted on a mug, a blanket and a
portrait, as a gift that loves you back. The full brief is `design/share-card-2026-11-03/brief.md`.

Layout of `share-1200x630.jpg` (JPEG quality 86, under 300 KB):
- Background cream #FBF6F1.
- Right side: `shopify/assets/hs-ex-set-golden.webp` (Maple's set: mug, blanket, portrait in one room) placed in a box
  x 640 to 1160, y 40 to 590, scaled to cover and centre-cropped, never stretched, with a 24 px corner radius. A small
  tag top left inside the box, 12 px from its edges: "EXAMPLE" in white DM Sans bold 15 px, letter spacing 1 px, on a
  rounded rectangle rgba(26,21,20,0.78), 8 px radius.
- Left side, 64 px margin, top to bottom: the logo heart `design/brand-v4/icon-1024.png` at 56 px; "GIFTS FROM YOUR DOG"
  (DM Sans bold 20 px, letter spacing 2 px, #A8284E); "Your dog" (Fraunces SemiBold 76 px, #121010); "loves you too."
  (Fraunces Italic 76 px, #A8284E); "Mug · Blanket · Portrait" (DM Sans 28 px, #3E322D). At the foot, on one line at
  y about 560: "heartside.io" (DM Sans bold 26 px, #121010) then "Free US shipping" (DM Sans 26 px, #8A4A2B).
- Every line fits inside x 64 to 600. Never ellipsise; shrink a line in steps of 2 px until it fits instead.

`share-1200x1200.jpg`: the same pieces, with the picture filling the top 1200x700 (cover, centre-crop, no radius) and the
words below it, left aligned at a 64 px margin.

Fonts: `shopify/assets/hs-fraunces.woff2` (variable, set the weight to 600), `shopify/assets/hs-fraunces-italic.woff2`,
and `shopify/assets/hs-dmsans.woff2`. If Pillow cannot open woff2 on this machine, convert them with `fontTools`
(`pip install fonttools brotli`) into a temporary folder, never into the repository.

Never redraw, warp, recolour or regenerate the painting or the heart: they are approved files that only scale and crop.

Command line:
- `python3 tools/print-art/share_card.py --out design/share-card-2026-11-03` writes both files.
- `python3 tools/print-art/share_card.py --check design/share-card-2026-11-03` exits non-zero unless both exist, are RGB
  JPEGs of exactly 1200x630 and 1200x1200, and the 1200x630 one is under 300000 bytes.

## Acceptance
python3 tools/print-art/share_card.py --out design/share-card-2026-11-03
python3 tools/print-art/share_card.py --check design/share-card-2026-11-03

## Return
The script and the two JPEGs, committed on the card's branch, and a note of anything it could not do (for example, a
font it had to convert, or a line it had to shrink).
