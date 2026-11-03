# Share card, 3 November 2026: brief for a Codex card (not queued yet)

Status: queued as codex/queue/share-card-2026-11-03.md on 3 Nov (Krish: "do that first"), spend 1f246f81-e0dd-4c95-9510-34f217a294fa.

## Why
heartside.io's social share image (`heartside-share-1200x630.jpg` in Shopify Files, read live on 3 Nov) is out of date. It says "A mug, a blanket, a print **or an ornament**", but the ornament is on hold. It also shows the old mug with words printed on it, and the 31 Oct ruling made the gifts artwork only. Every link shared in a message or post shows it.

## What to make
One still, 1200x630 JPEG under 300 KB, plus a 1200x1200 square from the same layout. Built in code from approved files only. Nothing is generated, and no painting is redrawn, warped or recoloured.

- Left half, on cream #FBF6F1: "Gifts from your dog" eyebrow in chestnut #8A4A2B; "Your dog" in ink #121010 and "*loves you too.*" in stamp #A8284E (Fraunces, `shopify/assets/hs-fraunces*.woff2`); "Mug · Blanket · Portrait" (DM Sans); "heartside.io  Free US shipping" at the foot. Every line fits inside a 64 px margin, with no lone last word.
- Right half: `shopify/assets/hs-ex-set-golden.webp` (Maple's set: mug, blanket, portrait in one room), scaled to cover and cropped, never stretched. It has a 24 px radius and a small "Example" tag, as on the site.
- The logo heart (`design/brand-v4/icon-1024.png`) at 56 px, top left.

## Inputs (read only)
`shopify/assets/hs-ex-set-golden.webp`, `shopify/assets/hs-fraunces.woff2`, `shopify/assets/hs-fraunces-italic.woff2`, `shopify/assets/hs-dmsans.woff2`, `design/brand-v4/icon-1024.png`.

## Writes
`design/share-card-2026-11-03/share-1200x630.jpg`, `design/share-card-2026-11-03/share-1200x1200.jpg`, `tools/print-art/share_card.py`.

## After
Claude checks both images at full size. With Krish's go, they are uploaded to Shopify Files and set as the theme's social sharing image. That is a store write.
