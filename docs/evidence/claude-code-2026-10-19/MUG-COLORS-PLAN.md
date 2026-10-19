# The Morning Mug in more than one color: findings and plan (19 Oct)

North Star: "the gift US dog owners reach for first when they want something that sounds like their dog." Krish tested with Mowgli, a boy, and the only mug (pink inside and handle) was wrong for him. A gift that doesn't fit the dog doesn't get shown to anyone else. Krish: multiple colors are not negotiable.

Nothing in Shopify, Teeinblue, Printful or the theme has changed. Steps 2 to 4 below wait for Krish's yes. Step 5 (the order QC) is done in this PR.

## 1. What Printful offers (read from Printful's catalog API, product 403, 19 Oct)

Product 403 is the "White Ceramic Mug with Color Inside", sublimation, with 16 variants. The live mug is variant 12578 (Pink / 11 oz), which is the `_tib_fulfilled_sku` Teeinblue writes. Every 11 oz color costs the same: $8.11.

| Color (inside and handle) | Printful variant | Hex | US facility |
|---|---|---|---|
| Pink (live today) | 12578 | #f6a1b1 | in stock |
| Black | 11051 | #050505 | in stock |
| Blue | 11050 | #1e9fcd | in stock |
| Dark Blue | 17362 | #1b1b51 | in stock (US only; no EU) |
| Dark Green | 17359 | #226653 | in stock (US only) |
| Red | 11049 | #e32a2d | in stock |
| Orange | 12579 | #f85625 | in stock |
| Yellow | 11048 | #ffdc3a | in stock |
| Golden Yellow | 17358 | #feba45 | in stock (US only) |
| Green | 17361 | #b2d264 | in stock (US only) |

**Recommended set of five:** Black, Dark Blue, Dark Green, Red, Pink.
- **Black and Dark Blue** are the two that clearly don't read as pink. They suit any dog, any person and any kitchen, and they go with the cream and ink brand.
- **Dark Green** is the third quiet option, and the color people pick when they want neither the black nor the blue.
- **Red** is the Christmas color, for December.
- **Pink** stays, because it is already live, photographed and approved.

The brighter ones (Blue, Orange, Yellow, Golden Yellow, Green) fight with a dog's photo on the other side, so they're left out. Every one is in stock at a US facility. Dark Blue and Dark Green have no EU stock, which doesn't matter for a US store.

**First look:** `mug-colors-board.jpg` shows the approved render with the pink inside and handle recolored to each Printful hex. The mask comes from the plain shaded mug base, so the dog and the note are untouched. It's a preview to choose colors from, not a final image: the real per-color images get rendered the approved way after Krish's yes.

## 2. Teeinblue (proposal)

- **One campaign, one artwork.** The mug stays on artwork #1353995 and campaign 1043122. Only the mug's color changes, never the print, so the print file stays byte-for-byte the same layout for every color. Teeinblue's print area is the white wrap; the color is the inside and the handle, which aren't printed.
- **The fulfilled SKU per variant.** After Shopify has the new variants, sync the campaign so each Shopify variant maps to its Printful variant: Pink 12578, Black 11051, Dark Blue 17362, Dark Green 17359, Red 11049. Teeinblue then writes that ID as `_tib_fulfilled_sku` on each line item.
- **Mockups.** The two mockups (`mk-outward-*`, `mk-drinker-*`) are built from Printful's photo of the pink mug. I'll rebuild one pair per color by recoloring the pink inside and handle to each Printful hex (the printed band stays white), and Krish judges them on the real photo before upload.
- **When anyone presses Update in Teeinblue for the mug, untick Images**, or Teeinblue puts its own images back over the approved Shopify images.

## 3. Shopify (proposal)

- **Option and variants.** The Morning Mug gets a Color option with the values Pink, Black, Dark Blue, Dark Green and Red, one variant each, size 11 oz. The existing Pink variant (58215128727934) stays, so nothing that links to it breaks.
- **Price:** $29.00 on every color. Printful's base cost is the same $8.11 for every 11 oz color, so the margin is the same as today: $29.00 minus $8.11 is $20.89 before Printful shipping (free US shipping is on us) and Teeinblue's fee. The shipping cost wasn't readable without a Printful account token, and I didn't use one.
- **Images.** One pair per color (dog face and note face), rendered the same way as the approved pink images with `tools/realphoto/shopify_mug_images.py`, on recolored bases. Each color's dog face is that variant's image. The current pink pair stays.
- **Default.** Black opens first, as the color nobody objects to. Pink is the second swatch.

## 4. Theme (proposal)

- **Mug product page:** a row of round swatches above Teeinblue, labeled "Mug color", each named for screen readers. Choosing one switches the Shopify variant (which Teeinblue follows, as it already follows the variant in the URL), the gallery image and the Preview's mockup color.
- **Chat:** on the reveal's mug tab and the mug row on the choose screen, the same five swatches. The mug drawing recolors live (the reveal's mug layers are drawn from the same recolored bases). The choice travels to the product page in the link (`?variant=`) and stays in the visit's state.
- **The QC and the cart** both read the variant, so the color the buyer saw is the color that gets checked.

## 5. Order QC (done in this PR)

`tools/qc/order_qc.py` reads each mug line item's Shopify variant ("White Ceramic Mug with Color Inside / Black / 11 oz") and its `_tib_fulfilled_sku`. It checks that the Printful variant Teeinblue will make is the color the buyer chose. A mismatch, a missing Printful variant or an unknown color is a `qc-hold`, and the reason goes in the order note and on the card. A pass records the color in the note line ("Color: Black (Printful 11051)"). The order query only adds `variantTitle`, which the app's `read_orders` scope covers. Tests: `python3 tools/qc/test_order_qc.py` passes all checks, including 8 new color ones.

## 6. Verification once 2 to 4 are live (Krish pays for the samples)

- Preview for each color on desktop and phone.
- A cart line per color, showing the right variant, `_tib_fulfilled_sku` and the order properties.
- One sample order for each new color: Black, Dark Blue, Dark Green and Red. Each must get `qc-pass` with its color in the note, and the mug that arrives must match.
