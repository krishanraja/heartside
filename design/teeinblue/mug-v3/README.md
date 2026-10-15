# Teeinblue files for The Morning Mug (v3, 15 Oct 2026)

Every file here is uploaded to Teeinblue: artwork #1353995 and campaign 1043122. Teeinblue holds the live copies; these are the source copies.

| File | Where it is used |
|---|---|
| `hs3-bg-mug-v2.png` | Artwork background layer (2700x1050, transparent). It carries only the paw, at (1685, 833). |
| `hs3-mug-photo-mask-fade-900.png` | The photo layer's shape mask (900x1000, black, 160 px soft fade at the bottom) |
| `hs3-mug-sample-biscuit.png` | The photo layer's sample image: Biscuit as a cut-out. Shoppers see it before they upload. |
| `mk-outward-base.png`, `mk-outward-shade.png`, `mk-outward-printmask.png` | Mockup 1, the dog face. Base image, shading overlay layer above the print area, and print-area mask. |
| `mk-drinker-base.png`, `mk-drinker-shade.png`, `mk-drinker-printmask.png` | Mockup 2, the note face, built the same way |
| `mk-geometry.json` | Print-area placement on the 1200 px mockup images. Teeinblue's canvas is 960 units, so multiply by 0.8. Both mockups use top 208, size 1372x593 with perspective on; the dog face is at left 283 and the note face at left -696. |

The mockups are built from Printful's own product photo by `tools/realphoto/build_mug_mockups.py` and `build_printmasks.py`. Mockup 1 must stay first in the campaign's mockup order, because Teeinblue's photo-position popup uses the first mockup.
