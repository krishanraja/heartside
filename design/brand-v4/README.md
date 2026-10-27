# Favicon and site icon for v4 (27 Oct 2026)

Ruling (Krish, 2026-10-27): the favicon and site icon are the pink watercolor heart with a white paw.

**Status: built on 27 Oct 2026. Not uploaded to Shopify yet, so not live.**

The brand book says: "transparent PNG: 1024 px for app icons and avatars, 512 and 32 px for the site. Never recolor, outline or redraw it, and keep clear space of a quarter of its width."

This set supersedes the brand-v3 favicon (Buddy's dachshund head on a cream tile, chosen on 21 Oct because the plain watercolor heart "disappears at 16 px"). The brand-v3 files stay where they are, for history.

## Files

| File | Size | What it is |
| --- | --- | --- |
| `heart-paw-source.png` | 1449 px | The master. The brand book's 2000 px PNG cropped to the heart and padded to a square with a 78 px transparent margin (6% of the heart's width). The heart's pixels are unchanged and the metadata is stripped. |
| `heartside-favicon-heart.png` | 512 px, transparent | **The file to upload** to Shopify Files and set as the theme favicon. See "The Shopify upload" below. |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | 16, 32, 48 px, transparent | Tab sizes. About 4% padding, with the small-size treatment below. |
| `favicon.ico` | 16, 32 and 48 px | The three tab sizes above in one file, frame for frame. |
| `favicon-180.png` | 180 px, opaque | Apple touch icon. The heart on cream (#FBF6F1) with clear space of a quarter of its width on every side. |
| `favicon-192.png`, `favicon-512.png` | 192, 512 px, transparent | Plain resamples with a 10% safe zone, for web app manifests and anywhere else a large icon is wanted. |
| `icon-1024.png` | 1024 px, transparent | App icon and avatar. Plain resample with clear space of a quarter of its width. |
| `favicon-preview.png` | 940 x 856 | Review sheet: 180, 64, 32 and 16 px on a light (#F1F1F1) and a dark (#202124) browser tab, with the old Buddy head at 32 and 16 px beside them. The 64 px icon is there for review only and uses the 192 and 512 recipe. |

`shopify/assets/hs-favicon-32.png` and `shopify/assets/hs-favicon-180.png` are byte copies of `favicon-32.png` and `favicon-180.png`, for local previews.

There is no SVG this time. A watercolor is a painting, and an SVG version would mean redrawing it.

## Rebuild

`python3 tools/build_favicon.py` writes every file above except the master, and prints each file's size and sha256. It uses only the standard library, Pillow and numpy, and two runs give the same bytes.

## How small-size legibility was handled

The paw is near white and the heart is a light pink, so they differ in lightness by little. At 16 px each toe is about one and a half pixels wide. The risk was the same one that retired the plain heart on 21 Oct.

To judge it, the build was checked by measuring the lightness of the paw against the heart at 16 px, and by looking at nearest-neighbor enlargements of 16 and 32 px on both tab colors.

- A plain resample gives a lightness gap of 0.09 (on a 0 to 1 scale). The paw is a faint smudge.
- The first try (color x1.3, contrast x1.2, a strong unsharp mask) raised the gap to 0.13 but broke the watercolor into a checkerboard, and lit up the heart's soft edge until it looked like an outline. That broke the brand rule, so it was dropped.
- The shipped recipe uses an area (box) resample, which does not ring at the paw's edges. It raises saturation by 1.15 and contrast by 1.4, 1.3 and 1.2 at 16, 32 and 48 px, both measured from the heart's own average, so the hue does not move. A gentle unsharp mask follows (radius 1 px, amount 0.5, or 0.4 at 48). The gap at 16 px is 0.16, and there is no checkerboard or edge rim.

Nothing is recolored to another hue, outlined or redrawn. 180, 192, 512 and 1024 px are plain resamples of the master.

**Verdict.** At 32 px the paw is clear: four toes and a pad, on light and dark tabs. At 16 px the heart reads at once and the paw survives as a pale pad with a lighter row of toes above it. It reads as a paw if you know it is there, but the four toes do not separate. That is the limit of 16 pixels without redrawing. The old Buddy head is also mostly a shape at 16 px.

## The Shopify upload

In Shopify's standard theme head, the favicon setting is not served to browsers as uploaded. Shopify resizes it to 32 px (`image_url: width: 32, height: 32`), and browsers on standard screens shrink that to 16 px. The theme layout is not in this repository, so this describes the standard head, not a readback of this theme. Check the live `<link rel="icon">` before relying on it. `heartside-favicon-heart.png` is built for that path rather than as a copy of `favicon-512.png`: it has the tab-size framing (about 4% padding) and the same color step (saturation x1.15, contrast x1.3), without the unsharp mask, which would not survive the resize. Simulating that path, the paw's lightness gap at 16 px is 0.14 with this file and 0.08 with `favicon-512.png`, and the heart is about 15% larger in the tab.

At full size this file looks more vivid than the master. It is only ever shown at 32 px or smaller. If a faithful 512 px is preferred, set `UPLOAD` in `tools/build_favicon.py` to `(512, SAFE, 1.0, 1.0)` and rebuild.

To put it live, as with brand-v3: upload `heartside-favicon-heart.png` to Shopify Files, then run the theme push with `favicon` set to that file name. `.github/scripts/set-favicon.mjs` changes only that one setting.

The hand-tuned `favicon-16.png`, `favicon-32.png`, `favicon.ico` and `favicon-180.png` reach the live site only if the page head links them directly. Helio owns the page head.
