# The Morning Mug, rebuilt (14 Oct 2026): handoff for Claude Code

Krish chose direction A: the dog as a cut-out on the outward face, the note on the drinker's face, Fraunces at 16pt or larger, and previews on a real product photo. All of this is now live in Teeinblue on campaign 1043122, artwork #1353995. The Shopify product is still Draft. Nothing was pushed with Teeinblue's Update.

## Print file (2700x1050, Printful 11 oz)

- **Faces.** Printful's guides put x≈585 on the face seen with the handle on the left. For a right-handed drinker, that is the side other people see. The face at x≈2115 is the one the drinker sees.
- **Photo layer.** 900x1000 at left 135, top 50, centred on x=585.
  - Upload editor: **Photo Reposition**, fit mode **Contain**. The whole dog always shows; nothing gets cropped.
  - Image effect: **Remove background**, using Teeinblue's free built-in remover.
  - Shape mask: 160 px soft fade at the bottom.
  - Sample image: Biscuit as a cut-out (`hs3-mug-sample-biscuit.png`).
- **Lines 1 to 3.** HS-Fraunces-Text (Fraunces, opsz 24, weight 400) at 70 px, which is 16.8pt.
  - Each box is 860x190 at left 1685, at tops 130, 345 and 560.
  - Left-aligned, vertically centred, #121010.
- **Signed.** HS-Fraunces-Italic at 96 px, #8A4A2B, 775x130 at left 1770, top 790. The paw sits at (1685, 833).
- **Why the remover setting matters.** Teeinblue had no background-remover service selected. With the effect on, test designs never rendered: four stuck for over 20 minutes. I selected Teeinblue's built-in remover under Extras > 3rd-party Services > Remove Background. Its help article says it is free. This setting applies to the whole Teeinblue account. Since then, every test design rendered within a minute.

## Live preview (Teeinblue mockups)

- **Two mockups**, built from Printful's own photo of this mug on the brand cream (243,238,231).
  - Mockup 1: dog face, handle on the left. It is set to "Always load first" and is first in the order.
  - Mockup 2: note face, handle on the right.
- **How each is built.** A flat perspective print area, a band mask, and a shading overlay layer taken from the photo itself.
- **Order matters.** The Reposition popup uses the first mockup in the order. Keep the dog face first.
- **Pixel accuracy.** Teeinblue can't wrap a design around a cylinder, so the preview is a flat approximation. Within about 10% at the edges, it matches the real-mug renders made from the actual print files.

## Asks for the theme and n8n

1. **Balanced line breaks.** Teeinblue keeps a `\n` typed into a Line field (tested).
   - At 70 px in an 860 px box, about 24 to 26 characters fit on one row.
   - For any line that won't fit on one row, replace the space at the most balanced break with `\n`. This doesn't change the length, so the 45-character limit still holds.
   - Without it, Teeinblue wraps greedily and leaves one word on the second row ("Naps best when you are" / "there.").
   - Examples now in the test print: "Naps best when\nyou are there." / "Guards your slippers\non the bottom stair." / "Your best friend,\nno contest."
2. **Photo popup.** The photo field now opens Teeinblue's Reposition popup with a Save button. It no longer opens the cropper with Select.
   - `doHandoff` still injects the file and dispatches `change`, and the popup is still a `.vm--container`, so `tibTookPhoto()` should keep working.
   - Please re-check the handoff on a real product page once the mug is Active.
3. **Mug reveal tab (hs3).** Show it like the live preview: the dog as a cut-out on one face, and the note in Fraunces (not Courier) on the other, with the paw left of "Love, [dog]".
4. **Shopify product image.** The drawn mockup is still the product's only image. Replacing it with two real-photo images is waiting for Krish's yes.

## Evidence (this folder)

- `before-after.jpg`: the old and new print files, each wrapped onto Printful's photo of the real mug.
- `mug-v3-on-real-mug.jpg`: three real Teeinblue print files, both faces:
  - a phone photo with 45-character lines
  - a studio headshot with the shortest lines
  - a small photo of a dog lying in its bed, with even line breaks
- `print-files/`: those three 2700x1050 files.
- `live-preview/`: screenshots of the Teeinblue preview (both mockups) and the photo-position popup.
