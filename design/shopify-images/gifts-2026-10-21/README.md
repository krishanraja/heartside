# Product images in the dog's own voice (21 Oct 2026)

Krish (21 Oct): "re-render the product images in the dog's voice".

- **The Morning Mug:** the note faces are re-rendered the approved way:
  - `tools/realphoto/build_shopify_mug_inputs.py` rebuilds the print file with the dog-voice lines. It passes `tools/qc/mug_qc.py`.
  - `tools/realphoto/shopify_mug_images.py` wraps it onto the mug.
  - `recolor_mug.py` makes the four other colors.

  The files are in `design/teeinblue/mug-v3/shopify-images/`. The dog faces come out unchanged, byte for byte.
- **Blanket, framed print, ornament (this folder):** Teeinblue's mockups of its long-name sample, with only the Courier Prime lines replaced (`tools/realphoto/reword_gift_images.py`). Courier Prime is fitted to each old row, so the new lines keep the same size, center and baseline. The name, photo, signature and paw are untouched.

| File | Product image |
|---|---|
| `the-couch-blanket.jpg` | The Couch Blanket |
| `the-framed-print-held.jpg` | The Framed Print, first image |
| `the-framed-print-white.jpg`, `-black.jpg`, `-red-oak.jpg` | The Framed Print, each frame's variant image |
| `the-tree-ornament.jpg`, `the-tree-ornament-tree.jpg` | The Tree Ornament |

Lines (V3 4.2, the dog's own voice): "I wait by the door. Weekends too. Obviously." / "I took your side of the bed. Not sorry." / "Our walks are the best part of my day." / "I'm your shadow. Where else would I be?". The ornament carries the last one.
