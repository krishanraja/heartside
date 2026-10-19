# The Morning Mug in five colors: the Teeinblue steps (for Cowork or Krish)

Krish said yes on 19 Oct to the five colors (Black, Dark Blue, Dark Green, Red, Pink) and to steps 2, 3 and 4. The new colors have to start in Teeinblue, not in Shopify. The mug's Shopify variant was made by Teeinblue (SKU `bnf_1043122_9161262`, which is campaign 1043122), and Teeinblue knows which Printful mug to make only for variants it pushed itself. A color added by hand in Shopify would have no Teeinblue SKU, and the order could go to Printful as pink or not at all. Claude Code has no way into Teeinblue's admin, so these steps are yours.

## In Teeinblue: campaign 1043122, The Morning Mug

1. **Colors.** On the campaign's Printful product (White Ceramic Mug with Color Inside), add Black, Dark Blue, Dark Green and Red, 11 oz only. Keep Pink. Leave out plain Blue, which is a light blue: QC treats Dark Blue and Blue as different mugs.
   Printful variant IDs, for checking: Pink 12578, Black 11051, Dark Blue 17362, Dark Green 17359, Red 11049.
2. **Price.** $29.00 for every color. Printful's cost is the same $8.11 for each, so the margin stays $20.89 before shipping and Teeinblue's fee.
3. **One artwork.** Every color uses artwork #1353995, with the same print area and the same layers. Only the inside and the handle change color, and those aren't printed.
4. **Mockups, one pair per color.** For each new color, add the two mockups the same way as the pink pair, with only the base image swapped:
   - Mockup 1, dog face: base `design/teeinblue/mug-v3/colors/mk-outward-base-<color>.png`, shade `mk-outward-shade.png`, mask `mk-outward-printmask.png`.
   - Mockup 2, note face: base `design/teeinblue/mug-v3/colors/mk-drinker-base-<color>.png`, shade `mk-drinker-shade.png`, mask `mk-drinker-printmask.png`.
   - Placement from `design/teeinblue/mug-v3/mk-geometry.json`, the same as today: top 208, size 1372x593, perspective on, dog face at left 283, note face at left -696. Teeinblue's canvas is 960 units, so multiply by 0.8.
   - Assign each pair to its color only, with Mockup 1 first.

   `<color>` is `black`, `dark-blue`, `dark-green` or `red`. The shade and mask files are the same for every color (they're in `design/teeinblue/mug-v3/`).
5. **Update to Shopify, with Images unticked.** Untick Images in Teeinblue's Update dialog, or Teeinblue puts its own pictures back over the approved Shopify images.
6. **Open the mug in Teeinblue's preview** and switch through the five colors. The Preview should show the chosen color's inside and handle, with the same words and dog on every color.

Then tell Claude Code: "Teeinblue has the five mug colors."

## Then Claude Code (already approved: step 3)

- Check that the Shopify product has five Color variants, each with a Teeinblue SKU and $29.00, and that the Pink variant is still 58215128727934.
- Upload the per-color images from `design/teeinblue/mug-v3/shopify-images/colors/` (dog face and note face for each color). Set each variant's image to its dog face.
- Put Black first, so the page opens on it. Krish's call: Black is the color nobody objects to.
- Check the live site:
  - the chat's swatches, which appear on their own once the product has more than one color;
  - the product page photo switching with the color;
  - Teeinblue's Color choice, with a dot of each color;
  - a cart line per color, showing the variant and `_tib_fulfilled_sku`.
- Krish pays for one sample order per new color. Order QC must tag each one `qc-pass`, with its color in the note.
