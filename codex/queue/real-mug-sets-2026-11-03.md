---
card: real-mug-sets-2026-11-03
title: Homepage carousel sets with the real product mug in place of the flat AI mug, five dogs, built in code
spend_id: 6ca3cfb0-ac5d-48b9-9d72-029a93b85629
max_minutes: 45
max_calls: 45
write_allow: [tools/print-art/real_mug_sets.py, design/examples-2026-11-03-real-mug-sets/*.jpg, design/examples-2026-11-03-real-mug-sets/sheet.jpg]
---
## Goal
Build `tools/print-art/real_mug_sets.py`, a Python 3 script (Pillow and numpy only) that puts the real product mug into
five of the six homepage carousel pictures. Krish, 3 Nov 2026, on the live carousel: "What's causing the mug mockups to
look so crappy on the live site?" The cause: in each set the painting is pasted onto an AI mug as a flat rectangle
(straight sides, hard top edge, white band below, no wrap, no shading), and it reads as a sticker. The real product
photos (`design/launch-reel-2026-11-02/inputs/mug-real-<dog>.jpg`, 1080x1350, approved by Krish 30-31 Oct) show the
same painting wrapped round a real mug. The one point it must land: the mug in the room looks like the mug a buyer gets.

Inputs (read only):
- Sources: `design/examples-2026-11-03-real-mug-sets/inputs/set-<dog>-source.png`, 1080x1350, for lab, frenchie, doodle,
  dachshund, shepherd. These are the approved full-size sets; their SHA-256 matches `source_sha256` for `set-<dog>` in
  `design/examples-2026-10-30-showcase/site.json`.
- Real mugs: `design/launch-reel-2026-11-02/inputs/mug-real-<dog>.jpg`, the mug on a plain light studio backdrop,
  handle on the left.

The AI mug(s) to cover, as boxes in source pixels (left, top, right, bottom), measured by Claude; include the handle:
- lab: (200, 610, 425, 815)
- frenchie: (200, 700, 490, 955)
- doodle: (235, 610, 475, 820)
- dachshund: (115, 715, 385, 965)
- shepherd: two mugs, (90, 555, 390, 835) and (405, 550, 705, 815). Cover both, each with the real shepherd mug.

For each box:
1. **Cut the real mug out of its studio photo.** Use a mask from the colour distance to the backdrop, sampled from the
   photo's four corners, then flood fill from the edges so the white mug body and the inside of the handle are handled
   correctly. Keep the mug's own contact shadow out of the mask. Feather the mask edge by 1.5 px.
2. **Turn it to match the room.** In the sets the handle is on the right, so mirror the CUT-OUT MUG ONLY if its handle is
   on the left. If mirroring would reverse the painting, do not mirror; set the handle side from the photo as it is and
   tell Claude in the result. Never mirror the painting on its own.
3. **Scale and place it.** Scale uniformly (never stretch) so the mug's height equals the box height plus 6%, and its
   width covers the box. Align its base with the box's bottom edge and centre it on the box. Before pasting, fill the
   box area by sampling the room around it, so no edge of the AI mug shows past the real one: wall above the tabletop
   line, tabletop below it.
4. **Make it belong.** Add a soft elliptical contact shadow under the base: about 35% opacity, about 18 px blur, 1.1 x
   the mug's width. Match the room by scaling the mug's mean luminance to the box's surroundings within plus or minus
   8%. Add a slight warm shift toward the room's white balance, measured on the wall area beside the box.
5. **Never touch anything else.** No pixel more than 40 px outside a box changes. The framed portrait and the blanket
   are never redrawn, warped or regenerated.

Outputs:
- `design/examples-2026-11-03-real-mug-sets/set-<dog>.jpg`, 1080x1350 RGB, JPEG quality 92, one for each of the five
  dogs.
- `design/examples-2026-11-03-real-mug-sets/sheet.jpg`: a review sheet. For each dog, a row with the old set and the new
  set side by side at 540 wide, plus a close-up of the old and new mug at 2x.

Command line:
- `python3 tools/print-art/real_mug_sets.py --out design/examples-2026-11-03-real-mug-sets` writes all of the above.
- `python3 tools/print-art/real_mug_sets.py --check design/examples-2026-11-03-real-mug-sets` exits non-zero unless:
  - the five JPEGs exist at 1080x1350;
  - outside each box grown by 40 px, the mean absolute difference from the source is under 3 (0 to 255);
  - inside each box the difference is over 10, so the mug was actually replaced;
  - the sheet exists.

## Acceptance
python3 tools/print-art/real_mug_sets.py --out design/examples-2026-11-03-real-mug-sets
python3 tools/print-art/real_mug_sets.py --check design/examples-2026-11-03-real-mug-sets

## Return
The script, the five JPEGs and the sheet, committed on the card's branch. Also a note of anything it could not do: a
mask that needed a different threshold, a mug whose handle side had to stay, or a box it had to grow.
