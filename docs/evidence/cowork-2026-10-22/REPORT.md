# Cowork report: 60-character gift lines (22 Oct 2026)

## 1. Character limits (done, live)

Line fields raised from 45 to 61 and saved in the Teeinblue artwork editor. "Dog's name" (14), "Signed" (20) and all labels untouched.

| Campaign | Fields changed | Check |
|---|---|---|
| Morning Mug 1043122 | Line 1 to 3 | Typed a 62-character string into Line 1: capped at 61/61 |
| Couch Blanket 1043153 | Line 1 to 4 | Counters read 0/61 on all four |
| Framed Print 1043167 | Line 1 to 4 | Counters read 0/61 on all four |
| Tree Ornament 1043174 | Line 1 | Counter reads 0/61 |

Only the mug received the 62-character typing test. The other three were verified by counter. The campaign "Update" button was not clicked (it can offer to push to Shopify), so confirm the storefront form shows 61.

## 2. Blanket, framed print, ornament

Method: artwork editor, Live preview, unsaved. Test strings from the brief, with balanced `\n` breaks (two rows per 60-character line). Sizes are measured from the preview (about plus or minus 1 pt). Teeinblue shrinks text to fit its box.

| Gift | Print area | Box | Today | Smallest size at 60 chars | Rows per line | Verdict |
|---|---|---|---|---|---|---|
| Blanket | 5300x6300 px, 50x60 in (about 106 ppi) | 4300x190 | 140 px, 95 pt | about 78 px, about 53 pt | 2 | PASS. Nothing clipped or touching photo, name or signature |
| Framed print | 3600x5400 px, 12x18 in (300 ppi) | 3000x150 | 104 px, 25 pt | about 55 to 62 px, about 13 to 15 pt (stress line at the low end) | 2 | PASS, marginal. Boxes do not need to be taller, but 12 pt is close |
| Ornament | 954x954 px, 3.18 in (300 ppi) | 580x112 | 40 px, about 9.6 pt | about 31 px, about 7.5 pt | 2 | FAIL against the 12 pt rule |

Stress line (60 W): all three fit with no clipping at the sizes above. Shortest line ("I'm yours, always."): one row at the full original size, no shrink.

Ornament note: the ornament already prints under 12 pt today (9.6 pt at 44 characters), so the 12 pt rule is not met even before this change. A 12 pt font is about 50 px, which gives about 26 characters per row at the 580 px box. A 60-character line would need three rows, about 180 px of height. The gap between name and signature is about 145 px. So 60 characters at 12 pt does not fit. Options for Krish: (a) keep the ornament line at about 44 characters and accept about 9.6 pt, (b) lower the ornament floor to about 9 pt and cap the line near 44 to 48 characters, (c) shorten the ornament to about 30 characters for a true 12 pt. Nothing changed on the ornament beyond the limit.

I did not run "Generate test design" for a true print file. The measurements are from Live preview at the editor zoom (10 to 69 percent), so they are estimates. The images are zoomed crops, not the full-size print files.

## 3. Mug options (unsaved edits, discarded)

All three rendered in Live preview of the mug artwork. The live mug campaign was not changed beyond the character limit. Edits were made in the editor and discarded by navigating away without saving. Mug mockups were not generated, since that needs a saved campaign or duplicate.

- **A. 58 px, three lines, two rows each.** Font set to 58 px on Lines 1 to 3, boxes unchanged (860x190). All three 60-character lines take two rows, sit clear of each other, and leave the signature and paw clear. The longest row ("because I have good taste, dear.") reaches the right edge of the box, so very wide words could wrap to a third row. Reads smaller at arm's length, but keeps the full home, spot, meaning structure.
- **B. 70 px, two lines, three rows each.** Boxes: Line 1 height 300 at top 130, Line 3 height 300 at top 450. Fits cleanly with the signature clear, and reads largest. Important: an empty Line 2 makes Teeinblue print the default text ("I took your side of the bed. Not sorry."), which overlaps. Line 2 has to be sent as a single space. Needs the site to send " " for Line 2.
- **C. Baseline, 70 px, 44-character lines.** Each line takes two rows. Layout as today.

Files: `mug-A-58px-three-lines.jpg`, `mug-B-70px-two-lines.jpg`, `mug-C-baseline-44char.jpg`. Krish has not picked yet.

## 4. Not done

- Step 5 (sample text) is waiting on the mug pick, as the brief says.
- Full-size print files and mug mockups were not generated.
- Files were not written into the repo folder `docs/evidence/cowork-2026-10-22/`; they are in this delivery only.

## 5. Live changes

Only the Line character limits (above). No other campaign or artwork setting was saved.
