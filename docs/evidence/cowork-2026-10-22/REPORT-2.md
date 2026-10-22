# Cowork report, round 2: 60-character gift lines (22 Oct 2026)

Images are in `round2/`. Test renders use a placeholder photo (a generated cartoon dog), so the photo looks different from the real one.

## Result by step

1. **Mug Lines 1 to 3 at 58 px: done and saved** in the live mug artwork (campaign 1043122). Boxes, signature and paw untouched. The storefront mug page already shows maxlength 61 on all three lines.
2. **Note-face mockup: done**, `mug-note-face-mockup.jpg`. Three test lines, two rows each, clean, signature and paw clear. The real print file (2700x1050) is also clean: `mug-real-print-file.jpg`.
3. **60-character line with no break, blanket and print: one shrunk row, it does not wrap.** Measured from the real print files.
   - Blanket (15900x18900 file, 3x the 5300x6300 design): all four 60-character lines sit on one row each, row pitch about 620 px at file scale, text fills the 4300 px box width. The size works out to about 119 px in design pixels, about 81 pt. Nothing clipped, no lone word. `blanket-real-print-file.jpg`.
   - Framed print (3600x5400): all four lines on one row each, shrunk, between name and signature, nothing clipped, no lone word. Size is derived from the 3000 px box width over 60 characters in Courier (0.6 em advance): about 83 px, about 20 pt. `print-real-print-file.jpg`.
   - So Claude Code does not need to send balanced breaks for the blanket and print. A break is only worth adding if you want two rows.
4. **Generate test design: run for all four.** Real print files received for mug, blanket, print and ornament. Ornament (954x954): the 49-character line `I've sniffed a lot of dogs, and I'd still pick you.` wraps to two rows, about 8.3 pt, no lone word. Unchanged from today, as agreed. `ornament-real-print-file.jpg`.
5. **Sample text: set and saved** in the artwork "Default paragraph" for each:
   - Mug: Lines 1 to 3 (saved with step 1).
   - Blanket and print Lines 1 to 4: `I hear your car long before anyone else.` / `I keep your spot on the couch warm for you.` / `Our walks are the best part of my day.` / `I'm your shadow, and I like it that way.` Each shown correctly on the canvas before saving.
   - Ornament Line 1: `I'm your shadow, and I like it that way.`
6. **Product pages: only the mug accepts 60 characters.** Read from the live storefront (heartside.io) textarea maxlength:

| Product | Dog's name | Lines | Signed | Accepts 60? |
|---|---|---|---|---|
| Mug | n/a | 61, 61, 61 | 20 | Yes |
| Blanket | 14 | 45, 45, 45, 45 | 20 | **No** |
| Framed print | 14 | 45, 45, 45, 45 | 20 | **No** |
| Ornament | 14 | 45 | 20 | **No** |

The 61 limit is saved in the artworks but has not reached the storefront for the blanket, print and ornament. Those campaigns need the "Update" button in Teeinblue (untick Images, Description, Title and Tags if it asks about Shopify). I did not click it because it publishes to the live store and you only approved that for the mug. Say the word and I will do the three.

## Caveats

- The framed print size is derived from the box width, not measured from glyphs. Blanket row pitch and width were measured from the file.
- The sample text and 61 limits for blanket, print and ornament are saved in the artwork but not yet live.
- Files are in this delivery only, not in the repo folder.
