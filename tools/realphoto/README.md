# Real-photo checks

The standard Krish set on 14 Oct: no preview is shown to him or to buyers until it sits on a real product photo. These scripts wrap real Teeinblue print files onto Printful's own product photos, and build the Teeinblue mockup images and the Shopify product images for the mug.

Inputs go in `tools/realphoto/src/` (not committed):

- `pf-mug-pink.jpg`: Printful's photo of the White Ceramic Mug with Color Inside, Pink, 11 oz (catalog 403, variant 12578), from https://files.cdn.printful.com/products/403/12578_1619156415.jpg (700x1000, handle on the right)
- `Fraunces-Text-400.ttf`: the static Fraunces cut. Copy `tools/fonts/HS-Fraunces-Text.ttf`.
- For the other gifts, the matching Printful photos:
  - framed poster 12x18, black: https://files.cdn.printful.com/products/2/4398_1527683145.jpg
  - framed poster 12x18, red oak: https://files.cdn.printful.com/products/2/15026_1651046808.jpg
  - framed poster 12x18, white: https://files.cdn.printful.com/products/2/10752_1565092324.jpg
  - sherpa blanket 50x60: https://files.cdn.printful.com/products/711/17482_1691154685.jpg
  - circle ornament: https://files.cdn.printful.com/products/900/23133_1748861540.jpg

Needs Python 3 with Pillow and NumPy. `build_mug_mockups.py` also needs `rembg`.

| Script | What it does |
|---|---|
| `wrap_mug.py out_dir name=print.png ...` | Wraps 2700x1050 print files onto the real mug photo, both faces, plus a 390 px phone-width copy and a board |
| `build_mug_mockups.py` | Builds the Teeinblue mockup images (cream background, band painted white, shading overlay) and `mk-geometry.json` |
| `build_printmasks.py name left top width height` | Builds a print-area mask in print-file space for a Teeinblue print area (960-unit canvas numbers) |
| `simulate_teeinblue_mockup.py out_dir print.png ...` | Shows what Teeinblue's flat print area will look like on those mockups |
| `shopify_mug_images.py print.png out_dir` | Renders 2048 px Shopify images with a true cylindrical wrap |

Mug geometry, from Printful's guides:

- The print file is 2700 px of a 3063 px circumference, and the handle sits at x = -181.5.
- x≈585 is the face seen with the handle on the left. A right-handed drinker holds the mug so other people see this face.
- x≈2115 is the face the drinker sees.
