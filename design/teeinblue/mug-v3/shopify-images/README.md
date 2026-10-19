# The Morning Mug: Shopify product images (re-render, 19 Oct 2026)

Made by `python3 tools/realphoto/build_shopify_mug_inputs.py`, then
`python3 tools/realphoto/shopify_mug_images.py design/teeinblue/mug-v3/shopify-images/print-file-biscuit.png design/teeinblue/mug-v3/shopify-images`.

| File | What it is |
|---|---|
| `print-file-biscuit.png` | The 2700x1050 print file: Biscuit's sample cut-out, the three lines and "Love, Biscuit". Passes `tools/qc/mug_qc.py` at 1.00. |
| `mk-outward-shaded.png`, `mk-drinker-shaded.png` | The shaded mockup bases, rebuilt from `../mk-*-base.png` plus `../mk-*-shade.png` (Printful's CDN is blocked from the cloud) |
| `the-morning-mug-outward.jpg` | Image 1, the dog face. The featured and variant image. |
| `the-morning-mug-drinker.jpg` | Image 2, the note face |

Not on Shopify yet: replacing the live images waits for Krish's yes (boards in `docs/evidence/claude-code-2026-10-19/`).
