---
card: real-mug-on-plates-2026-11-03
title: Stand each dog's real product mug on its clean plate for the homepage carousel, five dogs, built in code
spend_id: a6e2adea-02b0-417b-8b7b-6b6543942f39
max_minutes: 45
max_calls: 45
write_allow: [tools/print-art/real_mug_sets.py, design/examples-2026-11-03-real-mug-sets/*.jpg, design/examples-2026-11-03-real-mug-sets/sheet.jpg]
---
## Goal
Rework `tools/print-art/real_mug_sets.py` (from card real-mug-sets-2026-11-03) to place each real mug on a clean plate.
The first pass failed on sight: its code fill behind the old AI mug smeared the wall and table.

Krish approved Higgsfield clean plates instead:
`design/examples-2026-11-03-real-mug-sets/plates/set-<dog>-plate.png`, 1080x1350. Each is the approved source set with
the AI mug(s) removed, leaving an empty tabletop. Outside the mug area every pixel equals the approved source
(mean difference 0.0, checked by Claude). So there is nothing left to fill: delete the cleanup and fill code entirely,
and only place the mug.

The one point it must land: the mug on the table looks like the mug a buyer gets, standing in the room.

Inputs (read only):
- Plates: `design/examples-2026-11-03-real-mug-sets/plates/set-<dog>-plate.png` for lab, frenchie, doodle, dachshund
  and shepherd.
- Real mugs: `design/launch-reel-2026-11-02/inputs/mug-real-<dog>.jpg`. Keep your own cutout(), with the studio-shadow
  separation you built.
- Sources, for the review sheet only: `design/examples-2026-11-03-real-mug-sets/inputs/set-<dog>-source.png`.

Where each real mug stands, as the footprint of the old AI mug in plate pixels (left, top, right, bottom):
- lab: (200, 610, 425, 815)
- frenchie: (200, 700, 490, 955)
- doodle: (235, 610, 475, 820)
- dachshund: (115, 715, 385, 965)
- shepherd: (90, 555, 390, 885) and (405, 550, 705, 885). The bottoms are corrected: the old boxes stopped short of the
  table. Use the real shepherd mug for both.

For each footprint:
1. **Size and position.** Scale the cut-out mug uniformly, never stretched, so its body height (rim to base, handle not
   counted) equals 0.92 x the footprint height. Stand its base on the footprint's bottom edge, centred on the
   footprint.
2. **Handle and painting.** The handle stays as photographed (on the left). Never mirror. Never redraw, warp or
   recolour the painting.
3. **Matte.** Feather the matte 1 px. No pixel within 3 px outside the mug's edge may be lighter than the plate behind
   it by more than 12 (no backdrop halo).
4. **Contact shadow.** An ellipse under the base: width 1.05 x the base, height 0.12 x the base, 40% opacity, blur 14 px.
   Add a fainter cast shadow toward the right side of the image at 15% opacity, blur 30 px, since the window light
   comes from the left.
5. **Match the room.** Match the mug's mean luminance and warmth to the tabletop and wall beside the footprint, within
   plus or minus 6%. Apply the same correction to the whole mug, painting included, so the painting's own colours keep
   their relationships.

Outputs:
- `design/examples-2026-11-03-real-mug-sets/set-<dog>.jpg`, 1080x1350 RGB, JPEG quality 92. Overwrite the first pass.
- `design/examples-2026-11-03-real-mug-sets/sheet.jpg`. For each dog, a row with the old source set and the new set
  side by side at 540 wide. Then add the old and new mug close-ups at 2x.

Command line:
- `python3 tools/print-art/real_mug_sets.py --out design/examples-2026-11-03-real-mug-sets` writes all of the above.
- `python3 tools/print-art/real_mug_sets.py --check design/examples-2026-11-03-real-mug-sets` exits non-zero unless all
  of these hold:
  - The five JPEGs exist at 1080x1350.
  - Each output equals its plate (mean absolute difference under 2) outside each footprint grown by 60 px.
  - Each output differs from its plate by more than 10 inside each footprint.
  - The halo rule holds.
  - The sheet exists.

## Acceptance
python3 tools/print-art/real_mug_sets.py --out design/examples-2026-11-03-real-mug-sets
python3 tools/print-art/real_mug_sets.py --check design/examples-2026-11-03-real-mug-sets

## Return
The script, the five JPEGs and the sheet, committed on the card's branch. Also say anything you could not do.
