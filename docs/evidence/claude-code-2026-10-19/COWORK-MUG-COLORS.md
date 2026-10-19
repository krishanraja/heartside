# Cowork prompt: The Morning Mug in five colors (Teeinblue)

Paste everything below into Claude Cowork.

---

You're working for Krish Raja on Heartside (heartside.io, Shopify store `bnf1em-ge`). Your job is to add four new colors to The Morning Mug in **Teeinblue**, so Teeinblue creates the matching Shopify variants and sends Printful the right mug. Claude Code has already built the images and the theme for this, but it has no access to Teeinblue's admin. Only you can do this part.

## Why

Krish tested the mug with Mowgli, a boy dog, and the only color, pink inside and handle, was wrong for him. Krish says more than one color is not negotiable. On 19 Oct he approved these five colors: **Black, Dark Blue, Dark Green, Red and Pink**.

The new colors must be added in Teeinblue, not in Shopify. The live Pink variant was made by Teeinblue: its SKU is `bnf_1043122_9161262`, from campaign 1043122. Teeinblue only knows which Printful mug to make for variants it created itself, so a color added by hand in Shopify could print pink.

## What Krish has approved, and the rules

- **Approved by Krish on 19 Oct ("those five colors, yes to steps 2, 3, and 4"):** adding the four colors to the Teeinblue campaign at $29.00, uploading their mockups, and pushing the update to Shopify.
- **Ask Krish first** before anything outside that list: other colors, other sizes, a different price, discounts, Printful settings, the theme, or any other product.
- **Never handle tokens or secrets:** no client secrets, API tokens or passwords, in chat or in files.
- **Writing:** no em dashes, no exclamation marks, US spelling.
- **Email:** the customer email is krish@heartside.io. Never use a personal Gmail on anything a customer sees; use hello@krishraja.com.

## Facts you'll need

| Color | Printful variant ID | Hex (inside and handle) |
|---|---|---|
| Black | 11051 | #050505 |
| Dark Blue | 17362 | #1b1b51 |
| Dark Green | 17359 | #226653 |
| Red | 11049 | #e32a2d |
| Pink (live now, keep it) | 12578 | #f6a1b1 |

- **Printful product:** 403, "White Ceramic Mug with Color Inside", 11 oz only. Every color costs Printful $8.11, so $29.00 leaves a margin of $20.89 before shipping and Teeinblue's fee.
- **Plain Blue (11050) is not wanted.** It's a light blue, and Heartside's order QC treats Blue and Dark Blue as different mugs, so an order on the wrong one gets held.
- **Teeinblue campaign:** 1043122, The Morning Mug. Artwork **#1353995**.
- **Shopify product:** The Morning Mug, `gid://shopify/Product/16132766630270`. Pink variant 58215128727934, which must stay as it is.

## The mockup files

They're in the GitHub repo **krishanraja/heartside**, on branch `main`:

- **New for each color** (in `design/teeinblue/mug-v3/colors/`):
  - Mockup 1, dog face: `mk-outward-base-black.png`, `mk-outward-base-dark-blue.png`, `mk-outward-base-dark-green.png`, `mk-outward-base-red.png`
  - Mockup 2, note face: `mk-drinker-base-black.png`, `mk-drinker-base-dark-blue.png`, `mk-drinker-base-dark-green.png`, `mk-drinker-base-red.png`
- **The same for every color** (in `design/teeinblue/mug-v3/`):
  - Shade layers: `mk-outward-shade.png`, `mk-drinker-shade.png`
  - Print masks: `mk-outward-printmask.png`, `mk-drinker-printmask.png`
  - Placement: `mk-geometry.json`

Each new base is the approved pink mockup photo with only the inside and handle recolored to the Printful hex. The white print band is unchanged.

## Steps in Teeinblue

1. **Open campaign 1043122 (The Morning Mug).** Before you change anything, write down its current state: the colors, the price, the artwork and the mockups.
2. **Add the colors.** On the campaign's Printful product, add Black, Dark Blue, Dark Green and Red, in 11 oz only. Keep Pink. Don't add plain Blue or any other color.
3. **Set the price to $29.00 for every color**, including Pink, which should already be $29.00.
4. **Keep one artwork for every color:** #1353995, with the same print area and layers as now. Only the mug color changes, never the print.
5. **Add one pair of mockups per new color,** set up exactly like the existing pink pair, with only the base image swapped:
   - **Mockup 1, dog face:** base `mk-outward-base-<color>.png`, shading overlay `mk-outward-shade.png`, print mask `mk-outward-printmask.png`.
   - **Mockup 2, note face:** base `mk-drinker-base-<color>.png`, shading overlay `mk-drinker-shade.png`, print mask `mk-drinker-printmask.png`.
   - **Print area placement:** the same as the pink pair (from `mk-geometry.json`): top 208, size 1372 x 593, perspective on. The dog face sits at left 283 and the note face at left -696. Those numbers are on the 1200 px image; Teeinblue's canvas is 960 units, so multiply each by 0.8 if Teeinblue asks in canvas units.
   - **Assign each pair to its own color only.**
   - **Mockup 1 stays first.** Teeinblue's photo-position popup uses the first mockup.

   If Teeinblue can't assign mockups to a single color, stop and tell Krish what it does offer. Don't apply one color's mockups to every color.
6. **Update the product in Shopify, with Images unticked.** In Teeinblue's Update / Push to store dialog, untick **Images**, or Teeinblue replaces the approved Shopify product images with its own. Leave every other option as Krish had it before.

## Check your work (screenshots for each check)

1. **In Teeinblue's preview,** switch through all five colors. Each one should show its own inside and handle color, with the same dog and the same words.
2. **In Shopify admin, open The Morning Mug.** You should see:
   - five Color variants (Pink, Black, Dark Blue, Dark Green, Red), each 11 oz and $29.00;
   - each with a Teeinblue SKU, starting `bnf_1043122_`;
   - the Pink variant's ID still 58215128727934;
   - the product images not replaced by Teeinblue's.
3. **On heartside.io, open the mug's product page.** Teeinblue's Color choice should show five options, each with a small color dot. Changing the color should change Teeinblue's Preview.
4. **Don't place any orders.** Krish places and pays for the sample orders himself.

If any check fails, stop and tell Krish exactly what you saw. Don't try to fix it in Shopify.

## Report back to Krish

- What you changed in Teeinblue, plus the before state you wrote down.
- The five new Shopify variant IDs, with their colors and SKUs.
- The screenshots from the checks.
- Then tell Krish to send Claude Code this line: **"Teeinblue has the five mug colors."** Claude Code will then do the rest (already approved by Krish):
  - put each color's two images on its variant;
  - make Black the first option;
  - check the chat's color swatches, which appear on their own once the variants exist;
  - check a cart line per color.

## One more for Krish (not part of this job)

Turn off the Cowork scheduled task **"Heartside order QC"**. GitHub Actions now runs the order QC at 07:56 and 16:56 London time, and the two shouldn't tag the same order.
