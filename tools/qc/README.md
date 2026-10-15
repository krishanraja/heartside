# Order QC

Every order's real print file is checked before anyone confirms it in Teeinblue. Built 15 Oct, after Krish asked "what do we do for autonomous mock up quality control for live orders?". It covers The Morning Mug for now; the blanket, print and ornament follow once their designs settle.

## The mug: `mug_qc.py`

```sh
python3 tools/qc/mug_qc.py <print file or its URL> <out_dir> \
  --line1 "..." --line2 "..." --line3 "..." --signed "Love, Biscuit"
```

The print file is the order's `_tib_design_link_1` (Teeinblue's 2700x1050 PNG). The words are the line item's `Line 1` to `Line 3` and `Signed`, exactly as Teeinblue printed them. It exits 0 for pass and 1 for hold, and writes `report.json` and `card.png`. The card shows the print file wrapped onto Printful's photo of the mug, both faces, with every check under it.

It uses no AI and no OCR. The mug's layout is known to the pixel (calibrated against Teeinblue's own print files), so it draws what the words should look like and compares that ink with the print:

| Check | Holds the order when |
|---|---|
| file | the print isn't 2700x1050 with a transparent background |
| not blank | the note has almost no ink |
| line 1 to 3 words | no way of breaking the line matches the print (missing, clipped or wrong text, a font that didn't load) |
| signature | "Love, [dog]" isn't on the print as it should be |
| inside | ink sits outside the note's boxes |
| photo | there's no photo on the dog face |
| photo cut out | the photo is still a rectangle, so Teeinblue's background remover didn't run |

Two checks warn without holding: **breaks** (a line leaves one word alone on its second row) and **photo whole** (the dog touches the edge of the photo area, so the buyer's photo may have cut it off).

`python3 tools/qc/test_mug_qc.py` runs it on Teeinblue's three real print files (all pass) and on six broken prints made from them, which it must catch: a line missing, no photo, the background left on, one word alone, text past its box, and the wrong name on the signature.

## How it runs on live orders (proposed, needs Krish's yes)

Krish approved a twice-daily order check with an AI pre-check on 13 Oct (V3 section 6). The recommendation: a scheduled Claude session at those two times.

1. Lists unfulfilled orders with the Shopify connector, and runs `mug_qc.py` on each mug line item.
2. Looks at each card for what pixels can't judge: is it a dog, is the face whole, is anything off.
3. Tags the order `qc-pass` or `qc-hold`, with the reason in the order note.
4. Sends Krish one message: holds first, each with its card, then the number that passed.

It never confirms an order in Teeinblue. A person still does, as the site promises ("A real person checks every order before it prints"), and now checks a card instead of a raw file.

## The preview gate (the other half)

`tools/preview/mockup-gate.mjs` holds the chat's mug preview to the same standard before a deploy. It compares the chat's render with Teeinblue's real print files wrapped by `tools/realphoto/golden_reveal_mug.py`.
